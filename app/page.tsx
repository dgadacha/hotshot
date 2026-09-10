'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  Crosshair,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Game } from '../client/engine.js';
import { registerGameTools } from '../client/webmcp.js';
import { RIFLE_HUD_URL } from '../client/asset-paths.js';

type HUD = {
  hp: number;
  ammo: number;
  reserve: number;
  weapon: string;
  weaponKey: string;
  score: number[];
  timer: number;
  phase: string;
  countdown: number;
  roll: number;
  reload: number;
  respawn: number;
  message: string;
  feed: string;
  hit: number;
  hurt: number;
  kills: number;
  room: string;
  ping: number;
  connected: boolean;
};
const emptyHUD: HUD = {
  hp: 150,
  ammo: 30,
  reserve: 30,
  weapon: 'Assault Rifle',
  weaponKey: 'rifle',
  score: [0, 0],
  timer: 480,
  phase: 'waiting',
  countdown: 3,
  roll: 0,
  reload: 0,
  respawn: 0,
  message: '',
  feed: '',
  hit: 0,
  hurt: 0,
  kills: 0,
  room: '',
  ping: 0,
  connected: false,
};
export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('menu');
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState('home');
  const [name, setName] = useState('ROOKIE');
  const [code, setCode] = useState('');
  const [server, setServer] = useState('');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState(true);
  const [hud, setHud] = useState<HUD>(emptyHUD);
  const [copied, setCopied] = useState(false);
  const start = async (kind: string) => {
    setError('');
    try {
      await game.current?.start(kind, { name, code, server });
      setMode(kind);
      setPaused(game.current?.paused ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const actionsRef = useRef<{
    practice: () => Promise<void>;
    status: () => unknown;
  } | null>(null);
  useEffect(() => {
    actionsRef.current = {
      practice: () => start('practice'),
      status: () => game.current?.status() ?? { mode: 'loading' },
    };
  });
  useEffect(() => {
    if (!ready) return;
    return registerGameTools({
      practice: () => actionsRef.current?.practice(),
      status: () => actionsRef.current?.status(),
    });
  }, [ready]);
  useEffect(() => {
    let gone = false;
    import('../client/engine.js')
      .then(({ Game }) => {
        if (gone || !mount.current) return;
        try {
          game.current = new Game(mount.current, {
            onHUD: setHud,
            onPause: setPaused,
            onError: setError,
          });
          setReady(true);
          setServer(game.current.defaultServer());
        } catch (e) {
          setError(
            `Impossible de démarrer la 3D : ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      })
      .catch(() => setError('Le moteur ne se charge pas. Recharge la page.'));
    return () => {
      gone = true;
      game.current?.dispose();
    };
  }, []);
  function quit() {
    game.current?.leave();
    setMode('menu');
    setPaused(false);
    setView('home');
    setHud(emptyHUD);
    setError('');
  }
  const clock = `${Math.floor(hud.timer / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(hud.timer % 60)
    .toString()
    .padStart(2, '0')}`;
  const menu = mode === 'menu';
  return (
    <main className={`hotshot ${menu ? 'in-menu' : 'in-game'}`}>
      <div ref={mount} className="viewport" aria-label="Arène 3D Scrapyard" />
      <div className="screen-grain" />
      {menu ? (
        <div className="lobby">
          <header className="topbar">
            <span className="edition">
              <i /> DUEL PROTOTYPE <span>001</span>
            </span>
            <span className="studio-label">
              NO STAMINA. NO SECOND THOUGHTS.
            </span>
          </header>
          <section className="menu-content">
            <div className="eyebrow">
              <span /> WELCOME TO THE SCRAPYARD
            </div>
            <h1>
              HOT<span>SHOT</span>
              <b>01</b>
            </h1>
            <p className="tagline">FAST. LOUD. STUPIDLY DANGEROUS.</p>
            <div className="menu-panel">
              {view === 'home' ? (
                <>
                  <div className="mode-heading">
                    <span>01 / DUEL</span>
                    <small>1v1 · 10 KILLS · 8 MIN</small>
                  </div>
                  <Button
                    className="play-button"
                    disabled={!ready}
                    onClick={() => setView('host')}
                  >
                    <span>HOST GAME</span>
                    <ArrowUpRight />
                  </Button>
                  <Button
                    className="join-button"
                    disabled={!ready}
                    onClick={() => setView('join')}
                  >
                    <span>JOIN GAME</span>
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="ghost"
                    className="training-button"
                    disabled={!ready}
                    onClick={() => start('practice')}
                  >
                    <Crosshair /> ENTRAÎNEMENT <small>VS BOT</small>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="back-button"
                    onClick={() => setView('home')}
                  >
                    <ArrowLeft /> RETOUR
                  </Button>
                  <h2>
                    {view === 'host' ? 'OUVRE L’ARÈNE.' : 'ENTRE DANS L’ARÈNE.'}
                  </h2>
                  <label htmlFor="player-name">
                    PSEUDO
                    <Input
                      id="player-name"
                      value={name}
                      maxLength={16}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  {view === 'join' && (
                    <label htmlFor="room-code">
                      CODE DU DUEL
                      <Input
                        id="room-code"
                        placeholder="ABC123"
                        value={code}
                        maxLength={6}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        autoComplete="off"
                      />
                    </label>
                  )}
                  <label htmlFor="server-url">
                    SERVEUR DE DUEL
                    <Input
                      id="server-url"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      placeholder="ws://localhost:3001"
                      spellCheck={false}
                    />
                  </label>
                  <p className="form-hint">
                    Les deux joueurs utilisent le même serveur et le même code.
                  </p>
                  <Button
                    className="play-button"
                    disabled={
                      !ready ||
                      !name.trim() ||
                      (view === 'join' && code.length !== 6)
                    }
                    onClick={() => start(view)}
                  >
                    {view === 'host' ? 'HOST GAME' : 'JOIN GAME'}
                    <ArrowUpRight />
                  </Button>
                </>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </div>
            <div className="loadout">
              <span className="class-mark">G</span>
              <div>
                <strong>GUNNER</strong>
                <small>ASSAULT RIFLE / GRENADE LAUNCHER</small>
              </div>
              <span className="hp-tag">150 HP</span>
            </div>
          </section>
          <aside className="map-stamp">
            <span>THE KILLING FLOOR</span>
            <strong>SCRAPYARD</strong>
            <small>INDUSTRIAL COMPLEX / ARENA 01</small>
            <div className="stamp-line" />
          </aside>
          <footer className="lobby-footer">
            <span>
              <b>WASD / ZQSD</b> BOUGER <b>SOURIS</b> VISER <b>SHIFT</b> ROULADE
            </span>
            <span>CLAVIER + SOURIS REQUIS</span>
          </footer>
        </div>
      ) : (
        <>
          <header className="match-header">
            <div className="brand-mini">HOTSHOT</div>
            <div className="scoreboard">
              <span className="player-blue">{name || 'YOU'}</span>
              <b>{hud.score[0]}</b>
              <em>:</em>
              <b>{hud.score[1]}</b>
              <span className="player-red">
                {mode === 'practice' ? 'SCRAP BOT' : 'RIVAL'}
              </span>
              <small>{hud.phase === 'overtime' ? 'OVERTIME' : clock}</small>
            </div>
            <span className="network-label">
              {mode === 'practice' ? 'ENTRAÎNEMENT' : `${hud.ping} MS`}
            </span>
          </header>
          {hud.feed && <div className="kill-feed">{hud.feed}</div>}
          <div
            className={`crosshair ${hud.hit > 0 ? 'confirmed' : ''}`}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
            <i />
            {hud.hit > 0 && <b>×</b>}
          </div>
          <div
            className="damage-vignette"
            style={{ opacity: Math.min(1, hud.hurt * 2) }}
          />
          <div className="combat-message" aria-live="polite">
            {hud.message}
          </div>
          <div className="bottom-hud">
            <div className={`health-panel ${hud.hp < 50 ? 'low-health' : ''}`}>
              <span className="health-cross">+</span>
              <div>
                <strong>{Math.ceil(hud.hp)}</strong>
                <span>/ 150</span>
                <small>GUNNER</small>
              </div>
              <div className="health-line">
                <i style={{ width: `${hud.hp / 1.5}%` }} />
              </div>
            </div>
            <div className="ability-panel">
              <kbd>SHIFT</kbd>
              <div>
                <strong>
                  {hud.roll > 0 ? `${hud.roll.toFixed(1)}s` : 'COMBAT ROLL'}
                </strong>
                <span>{hud.roll > 0 ? 'RECHARGE' : 'PRÊT À ROULER'}</span>
                <div className="ability-line">
                  <i
                    style={{ width: `${100 - Math.min(100, hud.roll * 20)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="ammo-panel">
              {hud.weaponKey === 'rifle' && (
                <Image
                  className="weapon-hud-image"
                  src={RIFLE_HUD_URL}
                  alt=""
                  width={180}
                  height={120}
                  draggable={false}
                  unoptimized
                />
              )}
              <span>{hud.weapon}</span>
              <div>
                <strong>{hud.ammo.toString().padStart(2, '0')}</strong>
                <b>/ {hud.reserve}</b>
              </div>
              <small>
                {hud.reload > 0
                  ? 'RECHARGEMENT…'
                  : '1  FUSIL   /   2  GRENADES'}
              </small>
            </div>
          </div>
          <div className="combat-controls">
            <span>
              <kbd>R</kbd> RECHARGER
            </span>
            <span>
              <kbd>CTRL</kbd> GLISSER
            </span>
            <span>
              <kbd>CLIC DROIT</kbd>{' '}
              {hud.weaponKey === 'rifle' ? 'RAFALE' : 'DÉTONATION'}
            </span>
            <span>
              <kbd>ESC</kbd> MENU
            </span>
          </div>
          {hud.phase === 'waiting' && !paused && (
            <div className="center-overlay">
              <div className="overlay-card">
                <span className="eyebrow">ARÈNE OUVERTE</span>
                <h2>
                  UN DUEL.
                  <br />
                  IL MANQUE TOI.
                </h2>
                <p>Transmets ce code à ton adversaire.</p>
                <Button
                  className="room-code"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(hud.room)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      })
                      .catch(() =>
                        setError('Copie le code affiché manuellement.'),
                      )
                  }
                >
                  {hud.room}
                  <Copy />
                </Button>
                <small>
                  {copied ? 'CODE COPIÉ' : 'EN ATTENTE DU SECOND JOUEUR'}
                </small>
                <Button className="join-button" onClick={quit}>
                  QUITTER
                </Button>
              </div>
            </div>
          )}
          {hud.phase === 'countdown' && !paused && (
            <div className="countdown">
              {Math.ceil(hud.countdown)}
              <span>GET READY.</span>
            </div>
          )}
          {hud.hp <= 0 && hud.phase !== 'finished' && !paused && (
            <div className="death-panel">
              <span>YOU GOT SCRAPPED.</span>
              <strong>RETOUR DANS {Math.max(1, Math.ceil(hud.respawn))}</strong>
            </div>
          )}
          {hud.phase === 'finished' && (
            <div className="center-overlay">
              <div className="overlay-card">
                <span className="eyebrow">DUEL TERMINÉ</span>
                <h2>
                  {hud.score[0] > hud.score[1] ? 'NICE SHOOTING.' : 'GET EVEN.'}
                </h2>
                <div className="result-score">
                  {hud.score[0]} <span>–</span> {hud.score[1]}
                </div>
                <p>
                  {hud.score[0] > hud.score[1]
                    ? 'Victoire. La ferraille est à toi.'
                    : 'Défaite. La prochaine est pour toi.'}
                </p>
                <Button
                  className="play-button"
                  onClick={() => {
                    game.current?.rematch();
                    setPaused(false);
                  }}
                >
                  REVANCHE
                  <ArrowUpRight />
                </Button>
                <Button className="join-button" onClick={quit}>
                  RETOUR AU MENU
                </Button>
              </div>
            </div>
          )}
          {paused && hud.phase !== 'finished' && (
            <div className="center-overlay">
              <div className="overlay-card pause-card">
                <span className="eyebrow">TAKE A BREATHER.</span>
                <h2>PAUSE</h2>
                <p>
                  {mode === 'practice'
                    ? 'Entraînement en pause.'
                    : 'Le duel continue pendant ton absence.'}
                </p>
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <Button
                  className="play-button"
                  onClick={() => game.current?.resume()}
                >
                  REPRENDRE
                  <ArrowUpRight />
                </Button>
                <Button className="join-button" onClick={quit}>
                  QUITTER LE DUEL
                </Button>
                <Button
                  variant="ghost"
                  className="numbers-toggle"
                  onClick={() => {
                    setDamageNumbers(!damageNumbers);
                    if (game.current)
                      game.current.damageNumbers = !damageNumbers;
                  }}
                >
                  DÉGÂTS AFFICHÉS : {damageNumbers ? 'OUI' : 'NON'}
                </Button>
                <div className="pause-controls">
                  <p>WASD / ZQSD — Déplacement · Espace — Saut</p>
                  <p>Clic gauche — Tir · Clic droit — Tir alternatif</p>
                  <p>1 / 2 / Molette — Arme · R — Rechargement</p>
                  <p>Shift — Roulade · Ctrl / C — Glissade</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div className="utility-buttons">
        <Button
          variant="ghost"
          size="icon"
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
          onClick={() => {
            setMuted(!muted);
            game.current?.setMuted(!muted);
          }}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Plein écran"
          onClick={() => {
            if (document.fullscreenElement)
              void document.exitFullscreen().catch(() => {});
            else
              document.documentElement
                .requestFullscreen()
                .catch(() => setError('Le plein écran est indisponible ici.'));
          }}
        >
          <Maximize />
        </Button>
      </div>
      <div className="mobile-notice">
        <Crosshair />
        <h2>SEE YOU ON DESKTOP.</h2>
        <p>
          HOTSHOT se joue avec un clavier et une souris. Ouvre cette page sur
          ton ordinateur pour entrer dans l’arène.
        </p>
      </div>
    </main>
  );
}
