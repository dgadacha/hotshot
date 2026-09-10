import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createDuelServer } from '../server/index.js';
import { neutralInput } from '../shared/physics.js';
function client(url) {
  const ws = new WebSocket(url);
  const messages = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    messages.push(m);
    if (m.type === 'ping')
      ws.send(JSON.stringify({ type: 'pong', nonce: m.nonce }));
  });
  return {
    ws,
    messages,
    send: (data) => ws.send(JSON.stringify(data)),
    wait: async (type, predicate = () => true) => {
      const start = Date.now();
      while (Date.now() - start < 4000) {
        const idx = messages.findIndex((m) => m.type === type && predicate(m));
        if (idx >= 0) return messages.splice(idx, 1)[0];
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error(`Timeout waiting for ${type}`);
    },
  };
}
void test('real WebSocket host/join, capacity, authoritative inputs, disconnect and rejoin', async () => {
  const server = createDuelServer({ port: 0, host: '127.0.0.1' });
  const address = await server.listen();
  const url = `ws://127.0.0.1:${address.port}`;
  const clients = [];
  try {
    const host = client(url);
    clients.push(host);
    await host.wait('hello');
    host.send({ type: 'host', name: 'ALPHA' });
    const room = await host.wait('joined');
    assert.match(room.code, /^[A-F0-9]{6}$/);
    const guest = client(url);
    clients.push(guest);
    await guest.wait('hello');
    guest.send({ type: 'join', name: 'BRAVO', code: room.code });
    const joined = await guest.wait('joined');
    const state = await host.wait('snapshot', (s) => s.players.length === 2);
    assert.equal(state.phase, 'countdown');
    assert.equal(state.players[0].hp, 150);
    const extra = client(url);
    clients.push(extra);
    await extra.wait('hello');
    extra.send({ type: 'join', name: 'THIRD', code: room.code });
    assert.match((await extra.wait('error')).message, /complet/);
    const match = server.rooms.get(room.code).match;
    match.phase = 'playing';
    for (const p of match.players.values()) p.protected = 0;
    guest.send({ type: 'damage', player: room.id, amount: 999 });
    guest.send({
      type: 'input',
      input: { ...neutralInput(1), x: Infinity, hp: 999, score: 999 },
    });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(match.players.get(room.id).hp, 150);
    assert.equal(match.players.get(joined.id).score, 0);
    const start = match.players.get(joined.id).x;
    for (let i = 2; i < 16; i++)
      guest.send({
        type: 'input',
        input: { ...neutralInput(i), x: 1, yaw: 0 },
      });
    await new Promise((r) => setTimeout(r, 230));
    const moved = match.players.get(joined.id).x - start;
    assert.ok(moved > 0);
    assert.ok(moved < 3, 'flood cannot buy extra movement');
    guest.ws.close();
    await host.wait('snapshot', (s) => s.players.length === 1);
    assert.equal(match.phase, 'waiting');
    extra.send({ type: 'join', name: 'THIRD', code: room.code });
    await extra.wait('joined');
    const rejoined = await host.wait(
      'snapshot',
      (s) => s.players.length === 2 && s.round > state.round,
    );
    assert.equal(rejoined.phase, 'countdown');
    assert.equal(rejoined.players[0].score, 0);
  } finally {
    clients.forEach((c) => c.ws.close());
    await server.close();
  }
});
