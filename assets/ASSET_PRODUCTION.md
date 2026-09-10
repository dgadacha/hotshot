# HOTSHOT — Production des assets / COMIC v2

26 références et 26 GLB à produire dans la nouvelle direction artistique. La [galerie](REFERENCES.md) contient chaque image 3/4, son prompt exact et les fichiers attendus.

## Processus

1. Utiliser les nouvelles références `<id>_comic_v1.png` pour générer les modèles.
2. Déposer `<id>.glb` et `<id>.png` dans [incoming/](incoming/) ou à la racine du projet, comme pour le premier fusil.
3. Codex inspecte chaque livraison, ajuste échelle, orientation et matériaux, puis l’intègre.

Les personnages doivent être riggés pour de véritables animations. Une image seule ne fournit ni rig, ni topologie, ni parties cachées. Les références ne sont pas des GLB et certains contours/couleurs devront être simplifiés à la reconstruction.

## Direction artistique

Aplats ultra colorés, cel-shading / MeshToon, univers de bande dessinée. Cyan électrique `#13C9FF`, jaune `#FFE234`, rose `#FF3C91`, violet `#7135FF`, encre `#15122B`, papier `#FFFDF5`. Soins vert citron `#7AFF4C` + blanc, dangers corail + jaune. Grandes silhouettes épaisses et lisibles, deux ou trois tons francs par matière, ombres violettes et contours sombres. Pas de rouille, de salissure, de textures métalliques réalistes ni de dégradés peints. Les onomatopées et effets sont ajoutés par le moteur, jamais fusionnés dans les modèles.

Dans Three.js : `MeshToonMaterial`, rampe de trois niveaux filtrée au plus proche, `OutlineEffect`, lumière directionnelle et ombres nettes. L’arène, les personnages procéduraux et les armes existantes ont reçu ce traitement. Les textes BAM!, THOOM!, BOOM!, CLACK!, WHOOSH!, HEADSHOT! et K.O.! réagissent aux actions ; la cadence des textes est limitée pour protéger la lisibilité.

Le fusil livré précédemment conserve sa géométrie (29 829 triangles). Une copie de 1,09 Mo remplace ses textures par six zones de matériau plates. Ce modèle d’attente n’est pas une reconstruction de la nouvelle référence. Les originaux sont conservés. Les 26 nouveaux GLB restent à livrer ; le nouveau PNG de référence du fusil sert provisoirement au HUD.

## Livraison GLB + PNG

- GLB autonome, échelle métrique, +Y vers le haut, avant vers -Z.
- Pivot au sol/centre pour personnages et décor ; proche de la prise en main pour les armes ; au centre pour les projectiles.
- Surfaces en couleurs unies. Préférer des matériaux séparés (`body_cyan`, `accent_yellow`, `accent_pink`, `shadow_violet`, `ink`) à une texture avec éclairage peint. Roughness 1, metallic 0 ; ne pas cuire les ombres et le contour noir dans une texture.
- Conserver les pièces animables séparées : chargeur, culasse, barillet et canon. Zone `team_color` distincte pour les personnages.
- Budgets indicatifs : personnages 10–20 k triangles, armes 5–12 k, props 1–5 k. Textures inutiles pour les aplats ; si nécessaire, 1 024 px pour petits props et 2 048 px maximum pour armes/personnages.
- PNG HUD transparent, idéalement 1 024 × 1 024, objet entier et centré avec 12 % de marge, sans texte ni décor. Les personnages peuvent avoir un portrait de buste pour le HUD ; leur référence 3D montre le corps entier.
- Les images générées ont des marges plus serrées que demandé et quelques reflets doux résiduels. La silhouette et la palette servent de guide ; appliquer les aplats stricts au GLB. Les limites spécifiques sont consignées dans `comic/index.json`.

## Inventaire et ordre conseillé

Les dimensions sont des **cibles du projet**, à appliquer au GLB après génération ; une image seule ne garantit pas une échelle exacte.

### Lot A — Gunner : à produire en premier

| GLB à livrer | PNG correspondant | Fonction | Taille cible |
| --- | --- | --- | --- |
| `char_gunner.glb` | `char_gunner.png` | Gunner — Portrait de classe | 1,85 m de haut |
| `weapon_assault_rifle.glb` | `weapon_assault_rifle.png` | Assault Rifle — Icône d’arme | 1,05 m de long |
| `weapon_grenade_launcher.glb` | `weapon_grenade_launcher.png` | Grenade Launcher — Icône d’arme | 0,85 m de long |
| `projectile_grenade.glb` | `projectile_grenade.png` | Grenade — Icône de munition | 0,28 m de diamètre |
| `arms_gunner.glb` | `arms_gunner.png` | Bras FPS du Gunner — Aperçu de livraison | Avant-bras d’environ 0,40 m |

### Lot B — Habillage de Scrapyard

| GLB à livrer | PNG correspondant | Fonction | Taille cible |
| --- | --- | --- | --- |
| `env_container.glb` | `env_container.png` | Container de couverture — Aperçu de décor | 6 × 3 × 3,20 m (L × P × H) |
| `env_crate.glb` | `env_crate.png` | Caisse de couverture — Aperçu de décor | 3 × 3 × 2 m |
| `env_press.glb` | `env_press.png` | Presse industrielle centrale — Aperçu de décor | 2,20 × 5,50 × 2,20 m |
| `env_pipe_elbow.glb` | `env_pipe_elbow.png` | Coude de tuyau — Aperçu de décor | Diamètre extérieur 0,70 m |
| `env_fan.glb` | `env_fan.png` | Ventilateur industriel — Aperçu de décor | 2,50 × 0,70 × 2,50 m |
| `env_gantry_crane.glb` | `env_gantry_crane.png` | Grue portique — Aperçu de décor | 42 m de portée × 20 m de haut |
| `env_scrap_pile.glb` | `env_scrap_pile.png` | Tas de ferraille — Aperçu de décor | 3 × 2 × 1,50 m |

### Lot C — Brute et Runner, après validation du Gunner

| GLB à livrer | PNG correspondant | Fonction | Taille cible |
| --- | --- | --- | --- |
| `char_brute.glb` | `char_brute.png` | Brute — Portrait de classe | 2,10 m de haut — silhouette très large |
| `weapon_boomstick.glb` | `weapon_boomstick.png` | Boomstick — Icône d’arme | 1,15 m de long |
| `weapon_knuckle_cannon.glb` | `weapon_knuckle_cannon.png` | Knuckle Cannon — Icône d’arme | 0,95 m de long |
| `projectile_knuckle.glb` | `projectile_knuckle.png` | Projectile du Knuckle Cannon — Icône de munition facultative | 0,45 m de diamètre |
| `char_runner.glb` | `char_runner.png` | Runner — Portrait de classe | 1,70 m de haut — silhouette fine |
| `weapon_smg.glb` | `weapon_smg.png` | SMG — Icône d’arme | 0,65 m de long |
| `weapon_sawed_off.glb` | `weapon_sawed_off.png` | Sawed-Off — Icône d’arme | 0,48 m de long |

### Lot D — Pickups et interactions, avec leurs systèmes de gameplay

| GLB à livrer | PNG correspondant | Fonction | Taille cible |
| --- | --- | --- | --- |
| `pickup_health_small.glb` | `pickup_health_small.png` | Small Health — Icône de soin | 0,45 × 0,30 × 0,35 m |
| `pickup_health_mega.glb` | `pickup_health_mega.png` | Mega Health — Icône de soin majeur | 0,65 × 0,45 × 0,80 m |
| `pickup_armor.glb` | `pickup_armor.png` | Armor — Icône d’armure | 0,70 m de haut |
| `pickup_overdrive.glb` | `pickup_overdrive.png` | Overdrive Canister — Icône d’Overdrive | 0,55 m de haut |
| `prop_explosive_barrel.glb` | `prop_explosive_barrel.png` | Baril explosif — Aperçu de prop | 0,85 m de diamètre × 1,25 m de haut |
| `prop_hazard_button.glb` | `prop_hazard_button.png` | Bouton de danger — Icône d’interaction facultative | 0,45 × 0,20 × 0,60 m |
| `prop_jump_pad.glb` | `prop_jump_pad.png` | Jump Pad — Aperçu de prop | 2,50 × 2,50 × 0,35 m |

Le lot A suffit pour remplacer les personnages et armes du prototype. Les props du lot B habillent la map progressivement. Les lots C et D sont préparés pour les phases suivantes ; les générer ne signifie pas que leurs mécaniques sont déjà implémentées.

Le sol, les murs, les rampes, les passerelles et leurs supports gardent pour l’instant leur géométrie Three.js. Une variante cyan et une variante rose d’un même container se feront par matériaux : un seul GLB de base suffit.

## Prompts

Les prompts complets en anglais de la nouvelle DA sont dans [comic/prompts/](comic/prompts/). La galerie relie chaque image au texte exact utilisé. Les documents de l’ancienne DA restent dans [archive/industrial-v1/](archive/industrial-v1/).
