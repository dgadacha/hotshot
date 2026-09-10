import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { Match } from '../shared/simulation.js';
import { sanitizeInput, neutralInput, DT } from '../shared/physics.js';
import { RULES } from '../shared/config.js';
const ROOT = resolve(
  fileURLToPath(new URL('../dist/client/', import.meta.url)),
);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};
export function createDuelServer({ port = 3001, host = '0.0.0.0' } = {}) {
  const rooms = new Map(),
    clients = new Set();
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ ok: true, rooms: rooms.size, players: clients.size }),
      );
      return;
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = resolve(ROOT, `.${decodeURIComponent(url.pathname)}`);
      if (path !== ROOT && !path.startsWith(ROOT + sep)) {
        res.writeHead(403).end();
        return;
      }
      let file = path;
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, 'index.html');
      } catch {
        res.writeHead(404).end('Not found');
        return;
      }
      const data = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': file.endsWith('.html')
          ? 'no-cache'
          : 'public, max-age=3600',
      });
      res.end(data);
    } catch {
      res
        .writeHead(404)
        .end(
          'Build the client with npm run build, or use the development preview.',
        );
    }
  });
  const wss = new WebSocketServer({
    server,
    maxPayload: 4096,
    perMessageDeflate: false,
  });
  wss.on('error', (error) => {
    if (server.listening) console.error('WebSocket server:', error.message);
  });
  const send = (c, data) => {
    if (c.ws.readyState === WebSocket.OPEN && c.ws.bufferedAmount < 256 * 1024)
      c.ws.send(JSON.stringify(data));
  };
  const sendError = (c, message) => send(c, { type: 'error', message });
  function leave(c) {
    if (c.room) {
      const room = c.room;
      room.match.removePlayer(c.id);
      room.clients.delete(c);
      c.room = null;
      c.queue = [];
      if (room.clients.size === 0) rooms.delete(room.code);
    }
    c.lastSeq = 0;
    c.eventId = 0;
  }
  wss.on('connection', (ws, req) => {
    if (clients.size >= 64) {
      ws.close(1013, 'Server full');
      return;
    }
    const allowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .filter(Boolean);
    if (
      allowed.length &&
      (!req.headers.origin || !allowed.includes(req.headers.origin))
    ) {
      ws.close(1008, 'Origin not allowed');
      return;
    }
    const c = {
      id: randomBytes(8).toString('hex'),
      ws,
      room: null,
      queue: [],
      last: neutralInput(),
      lastSeq: 0,
      eventId: 0,
      lastInput: 0,
      window: Date.now(),
      count: 0,
      joinWindow: Date.now(),
      joins: 0,
      rtt: 0,
      pingSent: 0,
      pingNonce: '',
      lastSeen: Date.now(),
      lastSend: 0,
    };
    clients.add(c);
    send(c, { type: 'hello', id: c.id, tickRate: RULES.tickRate });
    ws.on('error', () => ws.close());
    ws.on('message', (raw) => {
      const now = Date.now();
      c.lastSeen = now;
      if (now - c.window > 1000) {
        c.window = now;
        c.count = 0;
      }
      if (++c.count > 100) {
        ws.close(1008, 'Rate limit');
        return;
      }
      let data;
      try {
        const buffer = Array.isArray(raw)
          ? Buffer.concat(raw)
          : Buffer.isBuffer(raw)
            ? raw
            : Buffer.from(raw);
        data = JSON.parse(buffer.toString('utf8'));
      } catch {
        sendError(c, 'Message invalide.');
        return;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      if (data.type === 'pong') {
        if (data.nonce === c.pingNonce) {
          c.rtt = Math.min(400, now - c.pingSent);
          c.pingNonce = '';
        }
        return;
      }
      if (data.type === 'input') {
        if (!c.room) return;
        const input = sanitizeInput(data.input);
        if (!input || input.seq <= c.lastSeq || input.seq > c.lastSeq + 600)
          return;
        c.lastSeq = input.seq;
        c.lastInput = now;
        // Bounded queue: additional input cannot buy extra simulation time.
        if (c.queue.length >= 15) c.queue.shift();
        c.queue.push(input);
        return;
      }
      if (data.type === 'leave') {
        leave(c);
        return;
      }
      if (data.type === 'rematch') {
        c.room?.match.voteRematch(c.id);
        return;
      }
      if (data.type !== 'host' && data.type !== 'join') return;
      if (now - c.joinWindow > 10000) {
        c.joinWindow = now;
        c.joins = 0;
      }
      if (++c.joins > 10) {
        sendError(c, 'Trop de demandes. Réessaie dans quelques secondes.');
        return;
      }
      const name =
        (typeof data.name === 'string' ? data.name : 'ROOKIE')
          .split('')
          .filter(
            (char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127,
          )
          .join('')
          .trim()
          .slice(0, 16) || 'ROOKIE';
      if (c.room) {
        sendError(c, 'Tu es déjà dans un duel.');
        return;
      }
      let room;
      if (data.type === 'host') {
        if (rooms.size >= 32) {
          sendError(c, 'Toutes les arènes sont occupées.');
          return;
        }
        let code;
        do {
          code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
        } while (rooms.has(code));
        room = { code, match: new Match(), clients: new Set(), created: now };
        rooms.set(code, room);
      } else {
        if (typeof data.code !== 'string' || !/^[A-F0-9]{6}$/.test(data.code)) {
          sendError(c, 'Code de duel invalide.');
          return;
        }
        room = rooms.get(data.code);
        if (!room) {
          sendError(
            c,
            'Ce duel est introuvable. Vérifie le code et le serveur.',
          );
          return;
        }
        if (room.clients.size >= 2) {
          sendError(c, 'Ce duel est déjà complet.');
          return;
        }
      }
      c.room = room;
      room.clients.add(c);
      room.match.addPlayer(c.id, name);
      send(c, { type: 'joined', id: c.id, code: room.code });
    });
    ws.on('close', () => {
      leave(c);
      clients.delete(c);
    });
  });
  let accumulator = 0,
    last = performance.now(),
    tick = 0;
  const interval = setInterval(() => {
    const now = performance.now();
    accumulator += Math.min((now - last) / 1000, 0.1);
    last = now;
    while (accumulator >= DT) {
      accumulator -= DT;
      tick++;
      for (const room of rooms.values()) {
        const inputs = new Map(),
          latencies = new Map();
        for (const c of room.clients) {
          let input = c.queue.shift();
          if (input) c.last = input;
          else
            input = {
              ...c.last,
              jump: false,
              roll: false,
              reload: false,
              weapon: 0,
            };
          if (Date.now() - c.lastInput > 250)
            input = {
              ...neutralInput(c.last.seq),
              yaw: c.last.yaw,
              pitch: c.last.pitch,
            };
          inputs.set(c.id, input);
          latencies.set(c.id, c.rtt / 1000);
        }
        room.match.step(inputs, latencies);
        if (tick % 3 === 0)
          for (const c of room.clients) {
            const snap = room.match.snapshot(c.eventId);
            send(c, { type: 'snapshot', ...snap, ping: Math.round(c.rtt) });
            c.eventId = room.match.eventId;
          }
      }
    }
  }, 4);
  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const c of clients) {
      if (now - c.lastSeen > 15000) {
        c.ws.terminate();
        continue;
      }
      c.pingSent = now;
      c.pingNonce = randomBytes(6).toString('hex');
      send(c, { type: 'ping', nonce: c.pingNonce });
    }
    for (const room of rooms.values())
      if (room.clients.size < 2 && now - room.created > 30 * 60 * 1000)
        for (const c of room.clients) {
          sendError(c, 'Cette arène a expiré. Ouvre un nouveau duel.');
          c.ws.close();
        }
  }, 3000);
  return {
    server,
    rooms,
    clients,
    listen: () =>
      new Promise((resolvePromise, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolvePromise(server.address());
        });
      }),
    close: () =>
      new Promise((resolvePromise) => {
        clearInterval(interval);
        clearInterval(heartbeat);
        for (const c of clients) c.ws.terminate();
        wss.close(() => server.close(resolvePromise));
      }),
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = createDuelServer({
    port: Number(process.env.PORT || 3001),
    host: process.env.HOST || '0.0.0.0',
  });
  app
    .listen()
    .then((a) =>
      console.log(
        `HOTSHOT duel server: http://localhost:${a.port} / ws://localhost:${a.port}`,
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => app.close().then(() => process.exit()));
}
