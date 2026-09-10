# HOTSHOT — Catalogue de production des assets

26 GLB prévus. Le prototype existant utilise Three.js. Ce catalogue applique la direction artistique du document de conception et organise le remplacement progressif des modèles procéduraux.

## Le processus convenu

1. Codex génère **une référence par asset**, en vue 3/4 dans la DA HOTSHOT. Les références sont versionnées sous le nom `<asset>_3q_vN.png` ; le manifeste et la galerie indiquent la version sélectionnée.
2. Tu utilises cette référence pour créer le modèle 3D et son image de HUD, puis tu déposes `<asset>.glb` et `<asset>.png` dans [incoming/](incoming/).
3. Codex inspecte le GLB et le PNG, ajuste l’échelle, l’orientation, le pivot et les matériaux, puis les branche au jeu. Les dimensions de gameplay servent de référence pour les collisions.
4. On vérifie l’asset dans le jeu, surtout les armes en vue FPS et la lisibilité du personnage à distance, puis on passe aux assets suivants.

La vue 3/4 est une **référence de forme et de style**, pas un rig ni une animation. Si un personnage est livré sans squelette, le rig et les animations constituent une étape supplémentaire. Si nécessaire, une vue arrière pourra compléter la référence pour préciser les parties cachées.

Le PNG livré sert d’icône d’arme, de portrait de classe ou d’icône de pickup. Pour les décors, il sert d’aperçu de livraison ; tous les objets ne nécessitent pas une icône dans le HUD.

## Direction artistique commune

- Cartoon industriel : formes épaisses, silhouettes caricaturales, gros biseaux, objets bricolés et mécaniques.
- Lecture à distance avant petits détails : grandes zones de couleur, usure limitée aux arêtes, boulons et tuyaux très lisibles.
- Métal graphite, bleu pétrole désaturé, jaune ocre écaillé, cuir et vêtements de travail bruns.
- Les personnages portent des zones de couleur d’équipe recolorables. **La couleur d’équipe ne définit pas la classe.**
- Personnages en A-pose neutre et symétrique ; mains séparées du corps. Armes seules et assemblées, sans personnage ni bras fusionnés.
- Chaque référence : un asset entier, fond transparent, caméra 3/4 avec peu de perspective, éclairage neutre et marge sur tous les côtés. Les bras FPS et le tas de ferraille sont des ensembles explicitement décrits comme tels.

## Format de livraison

Exemple pour le fusil :

```text
assets/incoming/
  weapon_assault_rifle.glb
  weapon_assault_rifle.png
```

Cibles de travail, à normaliser à l’intégration si le générateur ne les propose pas :

- GLB autonome, textures intégrées, échelle métrique ; convention HOTSHOT : +Y vers le haut, avant vers -Z.
- Pivot au sol et au centre pour personnages et props. Pour une arme, pivot proche de la prise en main ; pour un projectile, au centre.
- Conserver si possible les grandes parties mécaniques dans des meshes séparés : canon, chargeur, culasse et cylindre. Cela facilite les animations de tir et de rechargement.
- Pour les personnages, une zone de matériau distincte pour la couleur d’équipe ; idéalement nommée `team_color`.
- Cibles indicatives pour le navigateur : personnage 10–20 k triangles, arme 5–12 k, prop courant 1–5 k ; ce sont des budgets proposés, pas une obligation imposée au générateur.
- Textures 1 024 px pour les petits props, 2 048 px au maximum pour personnages et armes dans cette première passe. Éviter de multiplier les matériaux.
- PNG de HUD : 1 024 × 1 024 avec vraie transparence, objet entier et centré, environ 12 % de marge, sans nom ni jauge ni ombre portée extérieure. Pour un personnage, un portrait de buste lisible convient au HUD, tandis que la référence 3D conserve le corps entier.

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

Le sol, les murs, les rampes, les passerelles et leurs supports gardent pour l’instant leur géométrie Three.js. Une variante bleue et une variante rouge d’un même container se feront par matériaux : un seul GLB de base suffit.

## Prompts de référence 3/4

Les prompts sont en anglais pour fournir une consigne commune aux outils d’image et de reconstruction. Chaque fichier `.txt` lié ci-dessous contient **le prompt complet** : bloc commun + description propre à l’asset. Ces prompts visent l’image de référence ; ils ne garantissent ni topologie, ni rig, ni séparation des meshes dans le GLB.

### Bloc commun

```text
Use case: stylized-concept.
Asset type: single reference image for image-to-3D reconstruction of an asset in HOTSHOT, a fast cartoon industrial arena FPS.
Visual direction: exaggerated chunky forms, strong readable silhouette, bold planar shapes and broad bevels, stylized hand-painted 3D game rendering, simple broad material areas, restrained wear concentrated at edges. Scrap-factory personality. Charcoal gunmetal, desaturated petrol blue, warm workwear brown, chipped ochre yellow accents. Blue character clothing is a recolorable team-color area, not a class color.
Presentation: exactly ONE isolated asset, entirely visible, centered with 10 percent free margin. A clear front three-quarter view, 35 degrees around the subject and slightly above, nearly orthographic with minimal foreshortening. Soft neutral studio lighting that reveals geometry, no harsh baked shadows. Genuine transparent background, no floor, no scenery, no pedestal.
Avoid: photorealism, detailed surface noise, thin fragile structures, floating parts, dramatic camera angles, motion blur, particles, muzzle flash, extra props, text, labels, logos, watermarks, multiple views, contact sheet.
```

### Gunner — `char_gunner`

[Prompt complet prêt à copier](prompts/char_gunner.txt)

```text
Subject: ONE full-body unarmed Gunner mercenary, a balanced all-rounder, broad shoulders and compact torso, muscular oversized forearms and large gloved hands, sturdy large work boots and slightly shortened legs, smaller square-jawed head. A tough, cheeky determined face, dark eyebrows, stubble, a squat industrial protective cap with broad simple protective goggles sitting on the cap, not hiding the face. Petrol-blue sleeveless work jacket with large simple shoulder pads, cream undershirt, brown utility belt with two large pouches, dark charcoal work trousers, reinforced knee pads, brown fingerless gloves, metal toe caps. A few chunky bolts and ochre patches, no readable markings. His equipment feels improvised and mechanical. Broad blue clothing panels remain clear and untextured for recoloring. Neutral symmetric A-pose with arms about 35 degrees away from the torso, hands fully visible and separated from hips, fingers slightly apart, feet shoulder-width apart. Nothing held in the hands. No gun, no separate floating weapon, no base. The asset should be suitable as the reference for a riggable game character. Vertical or square composition, full character from cap to soles.
```

### Assault Rifle — `weapon_assault_rifle`

[Prompt complet prêt à copier](prompts/weapon_assault_rifle.txt)

```text
Subject: ONE standalone improvised arcade assault rifle, without hands or character, a coherent single assembled object with a long strongly readable silhouette. Oversized squared industrial receiver with petrol-blue housing, thick chipped ochre side plates, charcoal gunmetal exposed structure, short bulky angular stock, very large vented barrel shroud, absurdly thick squared muzzle, thick curved detachable box magazine, black taped pistol grip. Add a handful of large hex bolts, a chunky compression spring protected within the side of the receiver, a single small analog pressure gauge on the visible side, and a clear simple iron sight. Keep surfaces broad, attachments robust, connections obvious, wear sparse. Assembled and at rest, magazine inserted, no ammunition outside, no effects. Three-quarter view shows the broad side and top; the muzzle points toward the left and a little toward the viewer, stock to the right, with minimal barrel foreshortening. Horizontal composition showing the entire weapon, physically coherent proportions around 1 metre overall.
```

### Grenade Launcher — `weapon_grenade_launcher`

[Prompt complet prêt à copier](prompts/weapon_grenade_launcher.txt)

```text
Subject: ONE standalone improvised arcade grenade launcher, without hands or character, a coherent single assembled object. A squat chunky industrial tool-shaped weapon, a very thick short cylindrical barrel with a huge open dark muzzle, prominent four-chamber cylinder magazine under the receiver, oversized drum and stout side hinge, compact angular rear stock, black taped pistol grip and substantial front support grip. Petrol-blue housing, broad chipped ochre armor panels, dark charcoal barrel and drum, brown leather strap tightly fixed to the housing, a few large hex bolts and chunky pneumatic recoil cylinders fixed to the sides. Strong clear silhouette distinct from a rifle: short, heavy, round barrel and drum. Assembled and at rest, no loose ammunition, no moving parts, no effects. Three-quarter view shows the broad side and top; the muzzle points toward the left and a little toward the viewer, stock to the right, with minimal foreshortening. Horizontal composition showing the entire weapon, proportions around 0.85 metres overall.
```

### Grenade — `projectile_grenade`

[Prompt complet prêt à copier](prompts/projectile_grenade.txt)

```text
Subject: ONE compact chunky grenade projectile for a cartoon industrial grenade launcher. A short rounded steel canister with an ochre-yellow armored central shell, two thick charcoal metal end rings, four broad longitudinal ribs, a single large recessed red indicator and a sturdy capped rear end. The projectile is designed to bounce. Simple readable shape, solid rounded edges, a little chipped paint. An inert projectile at rest, fully assembled, without a fuse trail, smoke or explosion. Show its full body in a three-quarter view.
```

### Bras FPS du Gunner — `arms_gunner`

[Prompt complet prêt à copier](prompts/arms_gunner.txt)

```text
Subject: ONE first-person character arm set, consisting of the matching left and right Gunner forearms and hands, shown together as a clearly separated symmetrical pair. This paired set is the one intentional exception to the single-connected-object rule. Oversized muscular forearms, brown fingerless work gloves with thick charcoal knuckle protection, short petrol-blue rolled sleeve cuffs, broad ochre fabric fasteners. Neutral relaxed hands, fingers slightly separated, both thumbs visible, neither hand holding anything. Both forearms end at clean elbow boundaries and are fully visible in a neutral three-quarter reference view, with clear empty space between them. No torso, no weapon, no skeletal or gory cut surfaces. Match the Gunner's proportions and clothing.
```

### Container de couverture — `env_container`

[Prompt complet prêt à copier](prompts/env_container.txt)

```text
Subject: ONE industrial scrapyard shipping container used as large gameplay cover. Rectangular box, six metres long, three metres deep and 3.2 metres high. Broad corrugated petrol-blue steel panels with thick ribs, reinforced chunky charcoal corner posts, closed twin doors at one short end, very large hinges and two stout latch bars. A few ochre corner paint marks, broad patches of restrained rust. Strong flat roof suitable for standing. Nothing protrudes beyond the simple rectangular volume. No other containers, no cargo, no labels. Three-quarter view showing the long side, closed end doors and roof.
```

### Caisse de couverture — `env_crate`

[Prompt complet prêt à copier](prompts/env_crate.txt)

```text
Subject: ONE broad low industrial freight crate for arena cover, three metres wide and deep and two metres high. Thick warm brown wooden planks, wide charcoal steel corner braces, oversized round bolts, one broad ochre metal belt around the middle, sturdy closed lid. Exaggerated thick edges and an immediately legible block silhouette. Subtle splintering limited to the edges; no scattered debris, no readable markings, no lock floating outside the object. Three-quarter view showing the top and two sides.
```

### Presse industrielle centrale — `env_press`

[Prompt complet prêt à copier](prompts/env_press.txt)

```text
Subject: ONE low elongated scrapyard manufacturing press used as solid arena cover. A robust rectangular lower block, 2.2 metres wide, 5.5 metres long and 2.2 metres tall. Charcoal steel body, broad desaturated petrol housing, a heavy ochre press cover, two thick enclosed side pistons, a large recessed circular pressure gauge and three broad ventilation slots. All machinery is integrated into a compact connected silhouette, with a stable flat base and broad surfaces. Closed and idle. Keep all details close to the main volume so the machine reads as solid cover. No surrounding workshop, no crane, no separate scrap pieces, no text.
```

### Coude de tuyau — `env_pipe_elbow`

[Prompt complet prêt à copier](prompts/env_pipe_elbow.txt)

```text
Subject: ONE modular 90-degree industrial pipe elbow, a stout curved charcoal metal pipe with a large thick bolted flange at each end. Broad cast-metal geometry, six oversized hexagonal bolts per flange, simple thick walls, a single wide worn ochre identification stripe. Both circular openings visibly hollow but simple and deep, all bolts attached. Entire connected elbow visible from a three-quarter angle, no attached straight pipe system, no liquid or vapor. Heavy cartoon factory proportions.
```

### Ventilateur industriel — `env_fan`

[Prompt complet prêt à copier](prompts/env_fan.txt)

```text
Subject: ONE wall-mounted industrial exhaust fan as a self-contained square module. Heavy square petrol-blue steel frame, a deep circular charcoal duct, four broad thick ochre fan blades around a huge bolted central hub, and a protective grille made from only a few sturdy bars. Exaggerated oversized bolts, sparse chipped edges, a stable readable silhouette. Fan switched off with distinct stationary blades. Three-quarter view clearly showing the front, frame thickness and simple rear housing. No wall, no wires hanging outside the frame, no motion blur, no text.
```

### Grue portique — `env_gantry_crane`

[Prompt complet prêt à copier](prompts/env_gantry_crane.txt)

```text
Subject: ONE entire industrial gantry crane as a background scenery asset. A wide horizontal chunky ochre box beam rests on two very stout charcoal A-frame legs with heavy rectangular feet. One compact connected trolley and a short thick hanging hook assembly at the centre. Clear exaggerated factory proportions, broad box sections, simple diagonal reinforcement braces, large joints and bolts. All pieces belong to one coherent crane. Show the full crane with every foot and the entire top beam visible, wide three-quarter view, generous empty margin. No ground, buildings, vehicles, workers or cargo, no long thin tangled cables or readable markings.
```

### Tas de ferraille — `env_scrap_pile`

[Prompt complet prêt à copier](prompts/env_scrap_pile.txt)

```text
Subject: ONE compact connected-looking mound of chunky factory scrap for background dressing: three broad bent steel plates, a large blunt gear, a short thick pipe section and a dented motor casing nested together into a low coherent pile. Warm rusty brown, charcoal steel and muted petrol paint with a few ochre accents. All components touch and visually belong to the single pile, no scattered floating fragments. Strong simple silhouette, broad bevels, limited detail. Show the complete low mound in three-quarter view on a transparent background.
```

### Brute — `char_brute`

[Prompt complet prêt à copier](prompts/char_brute.txt)

```text
Subject: ONE unarmed full-body Brute mercenary for HOTSHOT. An absurdly huge barrel chest and exceptionally broad shoulders, enormous forearms and oversized padded work gloves, tiny stocky legs and huge heavy safety boots, a small thick-necked square head with a stubborn scowl. Heavy sleeveless petrol-blue reinforced work vest over a charcoal undershirt, thick brown industrial belt, large ochre shoulder braces, charcoal work trousers and chunky knee caps. Balanced cartoon weight and friendly readable exaggeration, with strong broad color blocks. Neutral symmetric A-pose, arms held 35 degrees from the body, hands and fingers clearly separated from the torso, feet shoulder-width apart. No weapon, no detachable prop, no scenery. Full three-quarter view from head to boot soles.
```

### Boomstick — `weapon_boomstick`

[Prompt complet prêt à copier](prompts/weapon_boomstick.txt)

```text
Subject: ONE absurdly oversized improvised double-barrel shotgun called the Boomstick. Two enormous side-by-side dark barrels and clearly separate wide circular muzzles, a huge heavy central breech with a stout break-action hinge, a short thick battered brown stock, a chunky taped grip, one broad ochre band around both barrels and two large protected recoil springs attached along the receiver. Petrol-blue side panels, graphite steel, thick bolts. Strong short-range heavy silhouette; wide enough to look almost too big to hold. Fully assembled, breech closed, no hands, no shells outside, no blast. Three-quarter side view, both muzzles aimed toward the left and slightly toward the viewer.
```

### Knuckle Cannon — `weapon_knuckle_cannon`

[Prompt complet prêt à copier](prompts/weapon_knuckle_cannon.txt)

```text
Subject: ONE handheld improvised industrial cannon with a huge piston-shaped squared forward shroud, an enormous central cylindrical bore and four broad blocky protective lobes around the muzzle suggesting the knuckles of a mechanical fist. A squat oversized air-pressure tank integrated into the rear housing, a chunky lever-like grip, stout enclosed side pistons, one analog pressure gauge. Charcoal steel, petrol-blue casing, broad chipped ochre plates, large bolts. Compact and very heavy, assembled and at rest, no arm attached, no projectile, no energy beam. Three-quarter view, muzzle toward the left and slightly toward the viewer.
```

### Projectile du Knuckle Cannon — `projectile_knuckle`

[Prompt complet prêt à copier](prompts/projectile_knuckle.txt)

```text
Subject: ONE solid stylized cannon slug, a squat blunt cylindrical metal projectile with a broad four-lobed rounded front cap suggesting a mechanical knuckle, a thick charcoal reinforcement collar and an ochre rear sleeve. Heavy simple industrial geometry, large bevels, minimal wear and a single recessed blue indicator. An inert object at rest, no trail, no glow halo, no explosion, no ammunition pile. Fully visible three-quarter reference view.
```

### Runner — `char_runner`

[Prompt complet prêt à copier](prompts/char_runner.txt)

```text
Subject: ONE unarmed full-body Runner mercenary for HOTSHOT. A compact narrow torso, small head with a mischievous focused expression, longer athletic legs, slim upper arms with oversized fingerless gloves and very large lightweight work sneakers. Short messy hair under a simple industrial headband, goggles resting above the forehead. A short petrol-blue cropped utility jacket, cream undershirt, charcoal slim cargo trousers, brown belt with only two small pouches, broad ochre knee and shoe accents. Strong agile silhouette visibly lighter and narrower than Gunner and Brute. Neutral symmetric A-pose with arms separated from torso, relaxed separated fingers and feet shoulder-width apart. No weapon or extra prop, no running pose. Full front three-quarter view with entire feet visible.
```

### SMG — `weapon_smg`

[Prompt complet prêt à copier](prompts/weapon_smg.txt)

```text
Subject: ONE compact improvised cartoon submachine gun for an agile mercenary. A short squared petrol-blue receiver, a stubby thick perforated barrel shroud, a compact angular stock, a long simple straight box magazine and an oversized taped black pistol grip. Broad ochre top plate, a chunky visibly attached side bolt, a small stout recoil spring in a protected recess, several large steel screws. Snappy lightweight silhouette with all parts thick enough to read from a distance. Fully assembled, magazine inserted, no hands, no bullets or effects. Three-quarter side view, muzzle pointing left and slightly toward viewer.
```

### Sawed-Off — `weapon_sawed_off`

[Prompt complet prêt à copier](prompts/weapon_sawed_off.txt)

```text
Subject: ONE very short improvised double-barrel shotgun with two thick side-by-side cut-down steel barrels, a large stout break-action hinge and a compact curved brown taped pistol grip without a shoulder stock. An ochre retaining band around the muzzles, small petrol-blue breech plates and a few oversized bolts. Exaggerated broad twin bores, clear compact T-shaped silhouette, much smaller than the Boomstick. Fully assembled and closed, no hands, no shells or muzzle flash. Three-quarter view showing both muzzles and the entire grip, barrels toward the left and slightly toward viewer.
```

### Small Health — `pickup_health_small`

[Prompt complet prêt à copier](prompts/pickup_health_small.txt)

```text
Subject: ONE compact chunky industrial medical pickup case. A small warm cream hard-shell box with rounded broad beveled corners, a robust charcoal handle, two very large steel latches and a prominent raised GREEN plus symbol on the front. Dark green reinforced corner bumpers, a few brown scuffs near the edges. Immediately readable as a small health item in a fast game. Closed, no syringes, no contents, no words, no numbers, no glow halo. Three-quarter view showing front, top handle and side. The simple plus is an object marking, not surrounding text.
```

### Mega Health — `pickup_health_mega`

[Prompt complet prêt à copier](prompts/pickup_health_mega.txt)

```text
Subject: ONE large vertical industrial medical canister pickup, much more substantial than a small medical case. A chunky cream cylindrical body with thick charcoal upper and lower protective rings, four broad dark-green reinforcement ribs, two integrated sturdy handles and one large raised GREEN plus on the front. Wide confident silhouette, clean large surfaces, sparse edge wear. The green areas are painted material, no transparent liquid vessel or magical particles. Show the entire closed canister alone in three-quarter view, no surrounding symbols or text.
```

### Armor — `pickup_armor`

[Prompt complet prêt à copier](prompts/pickup_armor.txt)

```text
Subject: ONE standalone industrial body-armor pickup: a broad chunky shield-shaped chest plate, layered desaturated cyan-blue steel with a thick charcoal outer rim, three large ochre fasteners and a blunt central raised ridge. No straps floating loose, no arms or torso behind it, no character, no badge or text. Sturdy easy-to-read protective silhouette and thick visible edges, with restrained chipped paint. Three-quarter view showing the front and thickness, centered complete object, no energy halo.
```

### Overdrive Canister — `pickup_overdrive`

[Prompt complet prêt à copier](prompts/pickup_overdrive.txt)

```text
Subject: ONE unstable-looking but inactive industrial energy canister pickup. A stout vertical charcoal cylinder with thick ochre protective end caps, three broad firmly attached side clamps, a large simple recessed amber-orange window and a bold raised orange lightning-shaped marking on the front. The opaque window has a bright painted inner surface, no translucent liquid, particles or glow extending outside the silhouette. A single chunky pressure knob at the top, a few large bolts, sparse wear. Fully visible three-quarter view, no lettering or background.
```

### Baril explosif — `prop_explosive_barrel`

[Prompt complet prêt à copier](prompts/prop_explosive_barrel.txt)

```text
Subject: ONE chunky explosive industrial barrel for a cartoon arena. A stout RED painted steel drum with thick dark graphite top and bottom rims, two broad raised reinforcement bands, a large simple ochre warning triangle with an exclamation mark painted on its front, and one large screwed cap on the top. Clearly readable bright red hazard silhouette, denting and chipping limited to a few broad patches. Sealed and inert, no flame, smoke or leaking substance, no loose debris, no surrounding text. Three-quarter view showing the front and top.
```

### Bouton de danger — `prop_hazard_button`

[Prompt complet prêt à copier](prompts/prop_hazard_button.txt)

```text
Subject: ONE wall-mountable industrial push-button assembly, a huge raised RED circular mushroom button on a thick squared ochre steel backplate with four massive charcoal corner bolts and a stout dark protective rim. Large simple mechanical geometry with clear press direction, sparse chipped edges. The entire assembly is one connected object, three-quarter view revealing the button projection and backplate thickness. No wall, hand, wires, arrows, lettering, light effects or other switches.
```

### Jump Pad — `prop_jump_pad`

[Prompt complet prêt à copier](prompts/prop_jump_pad.txt)

```text
Subject: ONE low broad industrial jump-pad platform for a cartoon arena. A thick octagonal charcoal steel base with four sturdy support feet, a wide recessed petrol-blue top launch plate, bold thick ochre chevrons pointing toward the front and two big spring housings firmly attached to the side edges. Broad beveled forms, strong grounded silhouette, a few oversized bolts and restrained paint wear. Inactive and uncompressed, no character, no propulsion flame, no energy beam, no floor. Elevated three-quarter view showing the entire top and front edge. Simple chevrons are painted on the object, not external labels.
```

## Instruction à donner au générateur de GLB

À utiliser avec la référence 3/4 choisie, en adaptant le nom de l’asset et sa taille cible :

```text
Create a single game-ready 3D asset from this reference image. Preserve its chunky stylized silhouette, proportions, broad color areas and industrial cartoon materials. Infer the unseen surfaces consistently. Generate only the asset itself, without background, floor, pedestal, lighting rigs, cast shadows or extra props. Produce a self-contained textured GLB. Use the supplied target dimensions if your workflow supports exact scale. Keep materials simple and texture resolution at or below 2048 pixels. Where supported, preserve major mechanical parts as separate meshes. Do not invent accessories or merge a character with a weapon. For a character, preserve the neutral A-pose; deliver a rig only if your workflow actually supports rigging, and report which animations are included.
```

## Références générées — 10 septembre 2026

**Les 26 assets disposent de leur image 3/4.** La [galerie complète](REFERENCES.md) associe chaque PNG au prompt exact utilisé et aux noms des fichiers GLB/PNG à livrer.

- Lot A : 5 références — Gunner, ses deux armes, sa grenade et ses bras FPS.
- Lot B : 7 références — tous les éléments de décor de Scrapyard.
- Lot C : 7 références — Brute, Runner, leurs quatre armes et le projectile du Knuckle Cannon.
- Lot D : 7 références — soins, armure, Overdrive et objets interactifs.

Le [manifeste](manifest.json) référence les 26 PNG sélectionnés, leurs dimensions et leurs prompts. Le fusil d’assaut utilise la version 2 ; la première version reste archivée dans le dépôt. Les autres références utilisent leur version 1. Les cadrages conservent chaque asset entier ; certains restent serrés et ne remplacent pas le cadrage final des icônes de HUD.

Les images ont été revues visuellement et les fichiers PNG RGBA vérifiés. **Le fusil d’assaut est livré et intégré** : son GLB texturé apparaît en vue FPS et chez l’adversaire, et son PNG dans le HUD. Les fichiers fournis à la racine sous le nom `weapon_assault_rifle_3q_v2` sont conservés ; leur copie utilisée par le jeu est dans `public/assets/weapons/`. Le manifeste enregistre cette livraison. Les 25 autres GLB et PNG restent à produire et à déposer dans `incoming/`.

Mode utilisé : **outil imagegen intégré**. Chaque prompt exact est conservé dans `prompts/generated/`, avec une fiche JSON correspondant à l’image. Les prompts de base restent disponibles dans `prompts/`.
