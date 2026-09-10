# HOTSHOT

Prototype FPS arena **Three.js**, pour clavier et souris. Première phase du document de conception : Gunner, Scrapyard, duel 1v1.

Dépôt principal : [dgadacha/hotshot](https://github.com/dgadacha/hotshot).

## Assets 3D et références

Le [catalogue de production](assets/ASSET_PRODUCTION.md) contient la liste des 26 GLB, les prompts des vues 3/4 et les conventions de livraison. Les prompts individuels sont dans [assets/prompts/](assets/prompts/) et les images générées dans [assets/references/](assets/references/).

Déposer chaque modèle et son PNG de HUD dans [assets/incoming/](assets/incoming/), avec le même nom de base, par exemple `weapon_assault_rifle.glb` et `weapon_assault_rifle.png`. Sur le poste de développement actuel, le raccourci `Documents/hotshot/assets` conserve l'accès au même dossier.

## Jouer en développement

Node.js 22.13+ (vérifié avec Node 24).

```sh
npm install
npm run dev:all
```

Ouvrir **http://localhost:5173**. `Entraînement` démarre un duel contre un bot, sans connexion au serveur. Pour un duel humain :

1. Le premier joueur choisit **Host game**. Le serveur par défaut est `ws://localhost:3001`.
2. Le second choisit **Join game**, avec le même serveur et le code à six caractères.
3. Une fois les deux joueurs présents, le match démarre après trois secondes.

Pour deux ordinateurs sur le même réseau : ouvrir `http://IP_DU_SERVEUR:5173` et utiliser `ws://IP_DU_SERVEUR:3001`. Le port 3001 doit être accessible sur ce réseau. Deux fenêtres sur le même ordinateur permettent aussi de vérifier la connexion ; une seule fenêtre capture la souris à la fois.

`npm run dev` lance uniquement le client ; `npm run server` lance uniquement le serveur de duel.

## Version compilée

```sh
npm run build
npm start
```

Ouvrir **http://localhost:3001**. Le serveur Node sert à la fois les fichiers compilés et les WebSockets. `PORT` et `HOST` sont configurables. Pour Internet, placer ce serveur derrière un reverse proxy HTTPS/WSS prenant en charge l’upgrade WebSocket ; renseigner son adresse `wss://…` dans le jeu. `ALLOWED_ORIGINS` accepte une liste d’origines autorisées séparées par des virgules.

La publication Sites héberge le client statique et **l’entraînement autonome**. Les duels humains sur cette publication nécessitent un serveur Node déployé séparément en WSS. Aucun serveur public de duel, matchmaking, compte ou classement persistant n’est provisionné.

## Contrôles

| Action                                    | Contrôle               |
| ----------------------------------------- | ---------------------- |
| Déplacement / course sans stamina         | WASD / ZQSD            |
| Visée                                     | Souris                 |
| Saut                                      | Espace                 |
| Tir principal                             | Clic gauche            |
| Rafale de trois / détonation des grenades | Clic droit             |
| Rechargement                              | R                      |
| Fusil / lance-grenades                    | 1 / 2 ou molette       |
| Combat Roll                               | Shift, recharge de 5 s |
| Accroupissement / glissade en mouvement   | Ctrl ou C              |
| Menu / libérer la souris                  | Échap                  |

L’entraînement se met en pause avec le menu. Un duel réseau continue. La protection de réapparition dure une seconde et s’arrête dès que le joueur tire.

## Périmètre implémenté

- 150 PV, aucune régénération automatique ; dégâts, headshots (×1,5), éliminations, réapparition après deux secondes.
- Fusil 18 dégâts / 600 RPM / 30 cartouches / rechargement 1,8 s ; rafale plus précise à dégâts ×1,1.
- Lance-grenades : quatre grenades, rebonds, mèche de 2,2 s, détonation à distance des grenades du propriétaire, dégâts de zone avec obstacles, dégâts personnels et knockback.
- Combat Roll, saut, contrôle aérien, glissade et accroupissement. Après un kill, 50 % du chargeur du fusil est restauré. Réserve de munitions illimitée pour ce prototype.
- Arène à deux niveaux, deux rampes, chemins latéraux et couvertures. Géométrie greybox industrielle ; armes et Gunner procéduraux.
- Course à dix éliminations, huit minutes, prolongation au prochain kill si égalité ; revanche après accord des deux joueurs.
- HUD, hitmarkers, petits nombres de dégâts, kill feed, flash, recul, animations mécaniques simples, sons synthétisés.
- Entraînement avec bot utilisant les mêmes règles ; création/rejoindre un duel via code.

Brute, Runner, pickups, armure, Overdrive, Hotshot, interactions environnementales et assets finaux appartiennent aux phases suivantes du document. Pas de voix d’announcer ni de musique produite dans cette phase.

## Architecture

- `shared/config.js` : réglages de classe, armes, match et géométrie commune.
- `shared/physics.js` : déplacement à pas fixe, collisions, raycasts et grenades.
- `shared/simulation.js` : état autoritaire du match, armes, dégâts, respawns, score, IA d’entraînement.
- `server/index.js` : rooms WebSocket, validation des entrées, limites de débit et snapshots.
- `client/engine.js` : contrôles, prédiction de mouvement, réconciliation, interpolation des adversaires, feedback prédit.
- `client/scene.js`, `models.js`, `effects.js`, `audio.js` : présentation Three.js et audio.
- `app/` : interface React du navigateur.

Le serveur simule à 60 Hz et émet à 20 Hz. Le client transmet uniquement les entrées ; il ne choisit ni sa position, ni ses dégâts, ni son score. Les entrées sont bornées et la file d’attente limitée, sans ticks supplémentaires achetables par envoi massif. La réconciliation rejoue les commandes non acquittées. Les hitscan utilisent un historique serveur limité à 200 ms, calculé à partir du RTT mesuré côté serveur, et n’atteignent jamais une vie précédente. Les couvertures sont statiques.

Le transport WebSocket/TCP est adapté au prototype et peut subir des blocages lors de pertes de paquets. Ce n’est pas encore un netcode compétitif de production. Les tests valident la logique et une session réseau locale ; la fluidité à 60/120 FPS et le ressenti sur plusieurs machines nécessitent un playtest navigateur.

## Vérifier

```sh
npm test
npm run build
```

Tests : contrôles non fiables, collisions, rampe, saut/roulade, cadence, burst/rechargement, protection, kills et respawns, victoire/timeout/overtime, grenades, occlusion, historique hitscan ; connexions WebSocket hôte/invité, troisième joueur refusé, déconnexion et nouvelle connexion.

Le navigateur expose facultativement deux outils WebMCP s’il fournit `document.modelContext` : lecture du match et démarrage d’un entraînement. Leur validation dans un contexte WebMCP réel n’a pas été effectuée ; ils ne sont pas nécessaires au jeu.

Le document de conception fourni est conservé dans `docs/GAME_DESIGN.md`.
