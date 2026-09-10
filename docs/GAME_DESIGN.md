# HOTSHOT

> Fast. Loud. Stupidly dangerous.

## 1. Présentation

**HOTSHOT** est un FPS arena compétitif 1v1 à classes, rapide et arcade.

Le jeu reprend l'esprit des shooters multijoueurs cartoon des années 2000–2010 : personnages fortement caricaturés, armes disproportionnées, environnements industriels absurdes et gameplay immédiatement compréhensible.

L'objectif n'est pas de créer un FPS tactique réaliste.

HOTSHOT doit privilégier :

* le mouvement ;
* les duels permanents ;
* les armes satisfaisantes ;
* les capacités simples ;
* le contrôle de la map ;
* les interactions environnementales ;
* les retournements de situation ;
* les parties courtes ;
* une forte personnalité visuelle.

Une partie standard doit durer environ **5 à 8 minutes**.

---

# 2. Pillars

HOTSHOT repose sur cinq piliers.

## 2.1 Fast

Le joueur doit quasiment toujours être en mouvement.

Pas de longues phases d'attente.

Après une mort :

**Respawn : 2 secondes.**

Le joueur revient immédiatement dans l'action.

---

## 2.2 Punchy

Chaque action doit produire un feedback important.

Les armes doivent avoir :

* recoil visible ;
* animations exagérées ;
* muzzle flash ;
* impacts importants ;
* sons puissants ;
* hitmarker ;
* camera shake léger ;
* animation mécanique de l'arme ;
* réaction physique du personnage touché.

HOTSHOT doit donner l'impression que chaque arme est légèrement trop puissante pour celui qui l'utilise.

---

## 2.3 Class-Based

Chaque classe possède :

* une silhouette unique ;
* des statistiques différentes ;
* une arme principale ;
* une arme secondaire ;
* une capacité ;
* une passive ;
* une mécanique Overdrive.

Les classes doivent modifier la manière de jouer sans créer des dizaines de capacités à mémoriser.

---

## 2.4 Map Control

La vie ne se régénère pas automatiquement.

Les joueurs doivent récupérer des ressources dans l'arène.

Cela crée naturellement des zones importantes et empêche le camping.

---

## 2.5 Easy to Learn, Hard to Master

Les contrôles doivent rester simples.

```text
WASD        Movement
Mouse       Aim
LMB         Primary Fire
RMB         Alt Fire
R           Reload
SPACE       Jump
SHIFT       Class Ability
CTRL        Crouch / Slide
E           Interact
```

La profondeur vient de l'utilisation intelligente des armes, capacités, déplacements et éléments de la map.

---

# 3. Format principal

```text
Mode: Duel
Players: 1v1

Score Limit: 10 kills
Time Limit: 8 minutes

Respawn Delay: 2 seconds
Spawn Protection: ~1 second

Winner:
First player to 10 kills

OR

Highest score when timer reaches 0.
```

En cas d'égalité :

```text
OVERTIME
Next kill wins.
```

---

# 4. Structure d'un match

## PRE-MATCH

Les deux joueurs choisissent leur classe.

```text
GUNNER
BRUTE
RUNNER
```

Puis :

```text
3
2
1

FIGHT!
```

---

## MATCH

Les joueurs apparaissent à deux endroits opposés.

La map contient :

* Small Health Packs ;
* Mega Health ;
* Armor ;
* Overdrive Canister ;
* éléments interactifs.

Les pickups réapparaissent régulièrement.

---

## DEATH

Lorsqu'un joueur meurt :

```text
KILLED BY PLAYER
[weapon]

RESPAWNING...
2
1
```

La caméra peut brièvement montrer le killer.

Puis respawn immédiat.

---

# 5. Health System

Pas de régénération automatique.

Chaque classe possède son propre maximum de HP.

```text
Runner    100 HP
Gunner    150 HP
Brute     250 HP
```

Les valeurs devront être ajustées pendant le playtest.

---

# 6. Pickups

## Small Health

```text
+25 HP
Respawn: 15 sec
```

Plusieurs exemplaires répartis dans la map.

---

## Mega Health

```text
+75 HP
Respawn: 30 sec
```

Un seul emplacement.

Il doit être volontairement exposé.

Le Mega Health devient un objectif secondaire naturel.

---

# 7. Armor

L'Armor ajoute une protection temporaire.

Exemple :

```text
Armor Pickup

+50 Armor
Respawn: 25 sec
```

HUD :

```text
150 HP
50 ARMOR
```

Les dégâts sont absorbés en priorité par l'Armor.

---

# 8. OVERDRIVE

Chaque joueur possède une jauge :

```text
OVERDRIVE

[██████░░░░]
60%
```

Elle augmente principalement en participant activement au combat.

Exemples :

```text
Damage dealt
Damage received
Kills
Movement actions
Pickup collection
```

Elle ne doit pas encourager le camping.

Après une certaine durée sans interaction :

```text
Overdrive slowly decreases.
```

À :

```text
100%
```

le joueur peut activer son Overdrive.

Durée cible :

```text
8 seconds
```

Chaque classe possède un Overdrive différent.

---

# 9. Classe — GUNNER

## Role

```text
ALL-ROUNDER
```

Classe polyvalente et facile à comprendre.

### Stats

```text
HP: 150
Speed: 100%
Jump: 100%
```

---

# 10. Gunner Primary — Assault Rifle

Fusil automatique polyvalent.

Caractéristiques initiales :

```text
Damage: 18
Fire Rate: 600 RPM
Magazine: 30
Reload: 1.8 sec
```

Les valeurs sont temporaires.

### Primary Fire

```text
LMB
Automatic fire
```

Bonne précision à moyenne portée.

### Alt Fire — Burst

```text
RMB
3-round burst
```

Le burst possède :

* meilleure précision ;
* léger bonus de dégâts ;
* petit délai entre chaque burst.

---

# 11. Gunner Secondary — Grenade Launcher

Lance-grenades bricolé.

### Primary

Projectile physique.

La grenade :

* rebondit ;
* explose après un délai ;
* inflige des dégâts de zone.

### Alt Fire

```text
REMOTE DETONATION
```

RMB fait exploser les grenades déjà présentes.

Cela permet :

```text
Shoot grenade
↓
Enemy approaches
↓
RMB
↓
BOOM
```

---

# 12. Gunner Ability — Combat Roll

```text
SHIFT
```

Petit mouvement rapide dans la direction actuelle.

Cooldown cible :

```text
5 seconds
```

Permet :

* esquive ;
* repositionnement ;
* sortie de couverture ;
* agressivité.

---

# 13. Gunner Passive — Momentum Reload

Après un kill :

```text
50% magazine restored.
```

Le joueur est récompensé lorsqu'il continue son attaque.

---

# 14. Gunner Overdrive — BULLET STORM

Pendant environ 8 secondes :

```text
Infinite magazine
Faster reload irrelevant
Slight fire-rate bonus
```

L'arme peut visuellement commencer à :

* chauffer ;
* vibrer ;
* cracher de la fumée ;
* produire des étincelles.

---

# 15. Classe — BRUTE

## Role

```text
HEAVY / CLOSE RANGE
```

Personnage massif.

### Stats

```text
HP: 250
Speed: 80%
Jump: 85%
```

Très dangereux à courte portée.

---

# 16. Brute Primary — Boomstick

Énorme shotgun bricolé.

### Primary Fire

```text
LMB
Standard shotgun blast
```

Dégâts très élevés à courte portée.

Fort falloff.

### Alt Fire — DOUBLE BLAST

```text
RMB
```

Les deux canons tirent simultanément.

Conséquences :

```text
Huge damage
Huge recoil
Huge knockback
```

Le recul affecte également le joueur.

Cela permet :

```text
Jump
↓
Aim down
↓
DOUBLE BLAST
↓
Shotgun jump
```

---

# 17. Brute Secondary — Knuckle Cannon

Gros canon lançant un projectile relativement lent.

Impact :

```text
Damage
+
Knockback
```

### Alt Fire

Maintenir RMB charge le projectile.

Plus le tir est chargé :

```text
Damage ↑
Projectile size ↑
Knockback ↑
```

Mais :

```text
Movement speed ↓ while charging
```

---

# 18. Brute Ability — CHARGE

```text
SHIFT
```

Le Brute fonce dans la direction regardée.

S'il percute l'adversaire :

```text
Damage
+
Large knockback
```

S'il regarde vers le sol depuis les airs :

```text
GROUND SLAM
```

Impact AoE à l'atterrissage.

Cooldown cible :

```text
7 seconds
```

---

# 19. Brute Passive — Thick Skull

Réduction du knockback subi.

```text
-30% knockback
```

Le Brute est donc difficile à déplacer.

---

# 20. Brute Overdrive — WRECKING BALL

Pendant environ 8 secondes :

```text
Charge cooldown drastically reduced
Knockback resistance increased
Movement speed slightly increased
```

Le Brute devient temporairement extrêmement agressif.

---

# 21. Classe — RUNNER

## Role

```text
MOBILITY / HARASSMENT
```

Classe fragile mais extrêmement mobile.

### Stats

```text
HP: 100
Speed: 120%
Jump: 115%
```

---

# 22. Runner Primary — SMG

Cadence élevée.

```text
Damage: Low
Fire Rate: Very High
Magazine: 35
```

Efficace à courte/moyenne portée.

---

# 23. Runner Secondary — Sawed-Off

Petit shotgun double canon.

Très courte portée.

### Primary

Un canon.

### Alt Fire

Deux canons simultanément.

Produit énormément de recul.

Le Runner peut utiliser ce recul pour se déplacer.

Exemple :

```text
Jump
↓
Look down
↓
Alt Fire
↓
BOOST
```

---

# 24. Runner Ability — Wall Kick

Le Runner peut rebondir sur les murs.

```text
Jump toward wall
↓
SPACE
↓
Wall Kick
```

Le joueur est propulsé dans la direction opposée.

Possibilité d'enchaîner plusieurs wall kicks.

Un délai minimum doit empêcher le spam contre un seul mur.

---

# 25. Runner Passive — Adrenaline

Après avoir infligé des dégâts :

```text
Small temporary movement boost.
```

Exemple :

```text
+10% movement
2 seconds
```

Les tirs réussis entretiennent donc son momentum.

---

# 26. Runner Overdrive — REDLINE

Pendant environ 8 secondes :

```text
Movement Speed ↑
Triple Jump
Wall Kick stronger
Reload Speed ↑
```

Le Runner devient extrêmement difficile à suivre.

---

# 27. Movement

Le mouvement doit rester arcade.

Tous les personnages peuvent :

```text
Walk
Run
Jump
Crouch
Slide
```

Pas de stamina.

Le sprint est illimité.

---

# 28. Slide

```text
Sprint
+
CTRL
```

Le joueur glisse.

Le slide conserve une partie de la vélocité.

Il peut être utilisé pour :

* passer sous certains obstacles ;
* esquiver ;
* maintenir son momentum.

---

# 29. Air Control

Le joueur doit conserver un contrôle limité dans les airs.

Le système doit être permissif sans devenir totalement irréaliste.

HOTSHOT privilégie :

```text
FUN > REALISM
```

---

# 30. Weapon Knockback

Certaines armes appliquent une force.

Le knockback fait partie intégrante du gameplay.

Il permet :

* déplacement ;
* rocket jump ;
* shotgun jump ;
* pousser l'adversaire ;
* interrompre son mouvement.

---

# 31. Environmental Interactions

Les maps doivent contenir quelques éléments utilisables pendant le combat.

Mais il ne faut pas transformer HOTSHOT en jeu à gimmicks.

Chaque élément doit être immédiatement compréhensible.

---

# 32. Explosive Barrel

Baril facilement identifiable.

Lorsqu'il reçoit suffisamment de dégâts :

```text
BOOM
```

Inflige :

```text
AoE Damage
+
Knockback
```

Le respawn du baril doit être relativement long.

---

# 33. Buttons

Certains éléments peuvent être activés en tirant dessus.

Exemple :

```text
[RED BUTTON]
```

Tir :

```text
BANG
```

Puis :

```text
Door closes
Platform moves
Hazard activates
```

---

# 34. Jump Pads

Éléments très visibles.

```text
Player touches pad
↓
WHOOSH
↓
Vertical / directional launch
```

Ils doivent permettre de créer des routes rapides.

---

# 35. Map Design Philosophy

Une map HOTSHOT doit être relativement petite.

Le joueur doit pouvoir retrouver son adversaire rapidement.

Objectif approximatif :

```text
15–20 seconds maximum
to cross the map.
```

Une map doit comporter :

```text
Ground level
Upper level
Central arena
Side routes
Vertical shortcuts
Pickup zones
```

---

# 36. MAP 01 — SCRAPYARD

Première map du jeu.

Thème :

```text
Industrial scrapyard
+
Improvised weapon factory
```

Éléments visuels :

* tôles ;
* tuyaux ;
* machines ;
* containers ;
* grues ;
* ferraille ;
* énormes ventilateurs ;
* chaînes ;
* moteurs ;
* panneaux absurdes.

---

# 37. Scrapyard Layout

Structure approximative :

```text
       UPPER WALKWAY
      ┌─────────────┐
      │             │
──────┘             └──────

       CENTRAL PIT
         [ARMOR]

LEFT                    RIGHT
ROUTE                    ROUTE

      [MEGA HEALTH]

──────┐             ┌──────
      │             │
      └─────────────┘
```

La map doit être approximativement symétrique en termes d'avantage, sans nécessairement être parfaitement symétrique visuellement.

---

# 38. Central Area

Le centre contient :

```text
ARMOR
```

Zone très exposée.

Les joueurs doivent prendre un risque pour le récupérer.

---

# 39. Mega Health Area

Le Mega Health se trouve dans une zone basse.

Le récupérer place temporairement le joueur dans une position vulnérable.

---

# 40. Verticality

Plusieurs méthodes permettent d'atteindre les hauteurs :

```text
Ramp
Jump Pad
Boxes
Class abilities
Weapon jumps
```

Les classes mobiles disposent de routes supplémentaires.

---

# 41. HOTSHOT System

Lorsqu'un joueur réalise :

```text
3 kills
without dying
```

il devient :

# HOTSHOT

Annonce :

```text
PLAYER IS THE HOTSHOT!
```

Effets :

* petite aura visuelle ;
* musique dynamique ;
* annonce ;
* HUD spécifique.

Mais il existe une contrepartie.

Toutes les ~10 secondes :

```text
HOTSHOT PING
```

La position approximative du Hotshot est brièvement révélée.

Cela empêche le joueur dominant de camper.

---

# 42. Hotshot Kill

Tuer le Hotshot affiche :

```text
HOTSHOT DOWN!
```

Cela peut accorder :

```text
Bonus Overdrive
```

mais pas nécessairement de point supplémentaire afin de conserver un scoring facile à comprendre.

---

# 43. HUD

Le HUD doit être minimal mais fortement stylisé.

### Bottom Left

```text
HP
ARMOR
```

### Bottom Right

```text
Weapon
Ammo
```

### Center

```text
Crosshair
Hitmarker
Damage feedback
```

### Top Center

```text
PLAYER 1     6 - 4     PLAYER 2
               04:21
```

### Overdrive

Jauge proche du bas de l'écran.

```text
OVERDRIVE
████████░░
80%
```

---

# 44. Hitmarker

Standard :

```text
X
```

Headshot :

```text
Larger / distinct hitmarker
```

Kill :

```text
Strong visual + sound confirmation
```

---

# 45. Damage Numbers

Option recommandée :

```text
18
18
36!
```

Les nombres peuvent apparaître brièvement autour de l'adversaire.

Ils doivent rester petits afin de ne pas transformer l'écran en RPG.

Option désactivable.

---

# 46. Kill Feed

Exemple :

```text
PLAYER1 [Boomstick] PLAYER2
```

Avec petite icône de l'arme.

---

# 47. Announcer

HOTSHOT bénéficierait énormément d'un announcer arcade.

Exemples :

```text
FIRST BLOOD!

DOUBLE KILL!

HOTSHOT!

HOTSHOT DOWN!

OVERDRIVE!

ONE KILL LEFT!

OVERTIME!
```

Voix volontairement excessive.

---

# 48. Direction artistique

HOTSHOT utilise une DA :

```text
Stylized
Cartoon
Chunky
Industrial
Dirty
Colorful
Exaggerated
```

L'objectif n'est pas le réalisme.

---

# 49. Character Design

Les personnages possèdent des proportions exagérées.

Caractéristiques possibles :

```text
Large hands
Large shoes
Broad shoulders
Small legs
Exaggerated torso
Large weapons
Strong silhouettes
```

Chaque classe doit être identifiable uniquement grâce à sa silhouette.

### Gunner

Silhouette moyenne et équilibrée.

### Runner

Petit, fin, jambes plus importantes.

### Brute

Très large, énorme torse, petits membres inférieurs.

---

# 50. Character Colors

La classe ne définit pas la couleur du joueur.

Les équipes utilisent une couleur globale.

Exemple :

```text
PLAYER 1 = BLUE
PLAYER 2 = RED
```

Les vêtements et accessoires conservent leur design, mais certaines zones utilisent la couleur du joueur.

Cela permet de reconnaître immédiatement l'adversaire.

---

# 51. Weapon Art Direction

Les armes doivent sembler :

```text
Improvised
Over-engineered
Dangerous
Mechanical
Slightly ridiculous
```

Exemples de détails :

* gros boulons ;
* tuyaux ;
* ressorts ;
* cylindres ;
* ruban adhésif ;
* plaques soudées ;
* jauges analogiques ;
* pistons ;
* échappements ;
* câbles.

Une arme ne doit jamais ressembler à un simple fusil militaire moderne.

---

# 52. Weapon Animation

Les armes doivent presque sembler vivantes.

Après un tir :

```text
Parts move
Springs compress
Smoke escapes
Bolts shake
Pressure gauges move
```

Lors d'un reload :

```text
CLANK
CHUNK
CLICK
BANG
```

Les animations peuvent être volontairement mécaniquement absurdes.

---

# 53. Visual Effects

Les effets doivent être stylisés.

### Muzzle Flash

Grand mais très court.

### Explosion

Formes cartoon + fumée.

### Impact

Étincelles / poussière / fragments.

### Overdrive

Effet propre à chaque classe.

Éviter cependant trop de particules.

La lisibilité compétitive reste prioritaire.

---

# 54. Audio Direction

Les armes doivent avoir énormément de personnalité.

Pas nécessairement réalistes.

Exemple Boomstick :

```text
BOOOOOOM
+
metallic CLANK
```

Runner SMG :

```text
RATATATATATA
```

Grenade :

```text
THUNK
...
BOOM
```

Les sons doivent permettre d'identifier les armes sans les voir.

---

# 55. Music

Musique :

```text
Fast
Punk
Industrial
Rock
Arcade
```

Elle doit soutenir le rythme sans masquer les informations audio importantes.

Lorsque quelqu'un devient Hotshot :

la musique peut ajouter temporairement une nouvelle couche instrumentale.

---

# 56. Game Feel

Priorité absolue.

Chaque arme doit posséder :

```text
Recoil
Camera kick
Weapon animation
Muzzle flash
Sound
Impact particles
Hitmarker
Enemy reaction
```

Les valeurs doivent être exagérées mais contrôlées.

---

# 57. Camera Shake

Très léger pour les armes standards.

Plus important pour :

```text
Boomstick
Grenade
Knuckle Cannon
Explosion
Ground Slam
```

Ne jamais rendre la visée inconfortable.

---

# 58. Hit Stop

Les gros impacts peuvent provoquer un très court feedback visuel.

Exemple :

```text
20–40 ms
```

Uniquement sur :

* gros shotgun ;
* Charge ;
* Ground Slam ;
* gros projectile.

À tester avec prudence dans un FPS multijoueur.

---

# 59. MVP

Le MVP ne doit PAS essayer de développer tout ce document.

Objectif :

> Vérifier que HOTSHOT est amusant en 1v1.

---

# 60. MVP — Phase 1

Créer :

```text
1 greybox map
2 players
FPS controller
Health
Damage
Death
Respawn
Score
Timer
```

Seulement :

# GUNNER

Avec :

```text
Assault Rifle
Grenade Launcher
Combat Roll
```

Pas d'Overdrive.

Pas de Hotshot.

Pas d'Armor.

---

# 61. MVP — Phase 2

Ajouter :

```text
BRUTE
RUNNER
```

Tester :

```text
Gunner vs Gunner
Gunner vs Brute
Gunner vs Runner
Brute vs Runner
Brute vs Brute
Runner vs Runner
```

Objectif :

aucun matchup ne doit sembler automatiquement gagné.

---

# 62. MVP — Phase 3

Ajouter les pickups :

```text
Small Health
Mega Health
Armor
```

Tester le contrôle de map.

---

# 63. MVP — Phase 4

Ajouter :

```text
Overdrive
Hotshot System
Interactive environment
```

---

# 64. MVP — Phase 5

Remplacer progressivement le greybox par :

```text
Scrapyard environment
Characters
Weapons
Animations
VFX
Audio
HUD
```

Le polish arrive uniquement lorsque le gameplay fonctionne.

---

# 65. Architecture technique recommandée

Le gameplay doit être data-driven.

Exemple conceptuel :

```text
Player
 ├── CharacterController
 ├── HealthComponent
 ├── ArmorComponent
 ├── WeaponController
 ├── AbilityController
 ├── OverdriveController
 └── PlayerState
```

---

# 66. Weapon Architecture

```text
Weapon
 ├── WeaponData
 ├── Fire()
 ├── AltFire()
 ├── Reload()
 ├── Ammo
 ├── Cooldown
 └── Effects
```

Chaque arme utilise des données configurables.

Exemple :

```json
{
  "name": "Assault Rifle",
  "damage": 18,
  "fireRate": 600,
  "magazineSize": 30,
  "reloadTime": 1.8,
  "automatic": true
}
```

Ne pas hardcoder les valeurs d'équilibrage dans la logique principale.

---

# 67. Ability Architecture

Interface commune :

```text
Ability
 ├── Activate()
 ├── CanActivate()
 ├── Cooldown
 └── Update()
```

Puis :

```text
CombatRollAbility
ChargeAbility
WallKickAbility
```

---

# 68. Class Data

Chaque classe devrait être définie par configuration.

Exemple :

```json
{
  "name": "Runner",
  "health": 100,
  "movementSpeed": 1.2,
  "jumpMultiplier": 1.15,
  "primaryWeapon": "smg",
  "secondaryWeapon": "sawed_off",
  "ability": "wall_kick",
  "passive": "adrenaline",
  "overdrive": "redline"
}
```

---

# 69. Networking

Le jeu doit être pensé pour le multiplayer dès le début.

Le serveur doit être autoritaire sur :

```text
Damage
Health
Deaths
Score
Pickups
Abilities
Respawns
Overdrive
```

Le client peut prédire :

```text
Movement
Weapon feedback
Animations
VFX
```

Prévoir :

```text
Client-side prediction
Interpolation
Lag compensation
Server reconciliation
```

particulièrement pour les armes hitscan.

---

# 70. Performance

HOTSHOT doit privilégier une excellente fluidité.

Objectif PC :

```text
60 FPS minimum
120+ FPS desirable
```

La DA stylisée permet de rester relativement légère.

Limiter :

* lumières dynamiques inutiles ;
* transparences ;
* particules excessives ;
* post-processing lourd.

---

# 71. Future Classes

Après validation des trois classes principales :

## HUNTER

```text
Role: Precision

Primary:
Rail Rifle

Secondary:
Revolver

Ability:
Mark

Passive:
Perfect Shot

Overdrive:
Instant precision
```

---

## PYRO

```text
Role:
Area Control

Primary:
Flame Cannon

Secondary:
Fireball Launcher

Ability:
Oil Bomb

Passive:
Fire resistance

Overdrive:
Inferno
```

---

# 72. Future Modes

HOTSHOT doit être conçu autour du 1v1.

Ne pas développer ces modes avant que Duel fonctionne parfaitement.

Potentiellement :

```text
2v2
Free For All
King of the Hill
Gun Game
Hotshot Mode
```

---

# 73. 2v2

Si ajouté :

```text
4 players
2 teams
```

Les capacités ne doivent pas dépendre exclusivement du 1v1 afin de permettre cette évolution.

---

# 74. Cosmetics

Aucun avantage gameplay.

Possibilités :

```text
Character skins
Weapon skins
Hats
Gloves
Victory poses
Emotes
Kill effects
Announcer packs
```

La forte DA cartoon se prête particulièrement bien aux cosmétiques.

---

# 75. Ce que HOTSHOT ne doit PAS devenir

HOTSHOT n'est pas :

```text
Counter-Strike
Valorant
Call of Duty
Battle Royale
Hero shooter with 20 abilities
Military simulator
Loot shooter
```

Éviter :

* ADS obligatoire ;
* armes militaires réalistes ;
* longues morts ;
* grandes maps ;
* camping ;
* dizaines de compétences ;
* progression donnant des avantages ;
* loadouts impossibles à équilibrer.

---

# 76. Fantasy du joueur

HOTSHOT doit donner cette sensation :

> Je suis un mercenaire complètement taré équipé d'une arme beaucoup trop grosse, dans une arène industrielle dangereuse, et je dois constamment courir, sauter, tirer et utiliser la map pour humilier le joueur d'en face.

---

# 77. Gameplay Loop

```text
SPAWN
  ↓
SEARCH
  ↓
ENGAGE
  ↓
DAMAGE
  ↓
DISENGAGE / CHASE
  ↓
GET HEALTH / ARMOR
  ↓
RE-ENGAGE
  ↓
KILL
  ↓
OVERDRIVE ↑
  ↓
RESPAWN
  ↓
REPEAT
```

Le cycle complet doit prendre quelques dizaines de secondes.

---

# 78. Première version jouable recommandée

La toute première build doit uniquement contenir :

```text
HOTSHOT PROTOTYPE

Players:
2

Class:
Gunner

Weapons:
Assault Rifle
Grenade Launcher

Ability:
Combat Roll

Map:
Scrapyard Greybox

Systems:
HP
Damage
Death
Respawn
Score
Timer

Victory:
10 kills

Match Duration:
8 minutes
```

Aucun menu complexe.

Écran :

```text
HOST GAME
JOIN GAME
```

Puis directement dans la partie.

---

# 79. Priorités de développement

```text
1. Movement
2. Shooting
3. Networking
4. Damage / Death / Respawn
5. Gunner
6. Greybox map
7. Game Feel
8. Brute
9. Runner
10. Pickups
11. Overdrive
12. Hotshot System
13. Environment interactions
14. HUD
15. Art
16. Audio
17. Polish
```

Le mouvement et les armes doivent être excellents avant toute production importante d'assets.

---

# 80. Résumé

## HOTSHOT

**Genre**

FPS Arena compétitif à classes.

**Format principal**

```text
1v1
5–8 minutes
First to 10 kills
```

**Classes MVP**

```text
GUNNER
BRUTE
RUNNER
```

**Gameplay**

```text
Fast movement
Primary + Alt Fire
Class abilities
Weapon knockback
Map pickups
Overdrive
Interactive maps
Hotshot streak system
```

**Direction artistique**

```text
Cartoon
Industrial
Improvised
Dirty
Colorful
Exaggerated
```

**Identité**

Des mercenaires caricaturaux utilisent des armes bricolées absurdement dangereuses dans de petites arènes industrielles conçues pour produire des combats rapides, spectaculaires et constamment chaotiques.

**Règle principale de conception**

> Every weapon should be fun to fire.
>
> Every class should feel different to move.
>
> Every death should make the player want to respawn immediately.
