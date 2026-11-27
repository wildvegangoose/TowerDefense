# TowerDeChess — 2.5D Tactical Chess Tower Defense

**TowerDeChess** is a handcrafted 2.5D diagonal-aerial isometric **Chess Tower Defense** game built for **Web (PWA)** and **Android (Google Play via Capacitor 7)**.

Every defender attacks strictly according to authentic chess board geometry on an `8×8` board — escalating from the classic Royal Chess Set into mythic **non-chess Relics** forged beyond the sixty-four squares.

- **Live Web / PWA:** https://wildvegangoose.github.io/TowerDefense/
- **Android Package ID:** `io.github.wildvegangoose.towerdechess`
- **Google Play Packaging Guide:** [`PLAY_STORE_GUIDE.md`](PLAY_STORE_GUIDE.md)

---

## Table of Contents
1. [Story & Lore — "The Shattered Gambit"](#story--lore--the-shattered-gambit)
2. [Core Gameplay & Rules](#core-gameplay--rules)
3. [Defenders & Promotion Ranks](#defenders--promotion-ranks)
4. [The Obsidian Legion (Enemies & Bosses)](#the-obsidian-legion-enemies--bosses)
5. [18-Level Campaign & 3 Chapter Biomes](#18-level-campaign--3-chapter-biomes)
6. [Motion-Comic Cutscenes & Audio](#motion-comic-cutscenes--audio)
7. [Save Data & Settings](#save-data--settings)
8. [Repository Structure](#repository-structure)
9. [Development, Builds & Extending the Game](#development-builds--extending-the-game)

---

## Story & Lore — "The Shattered Gambit"

For a thousand winters, the realm of **Aethelgard** endured under the **Accord of Sixty-Four** — an ancient pact binding the Ivory Court and the Obsidian Legion to the Sacred Laws of the Board.

Refusing to kneel to sixty-four squares, **Malakor, the Unbound King** shattered his own Black Crown at the Edge of the World, tearing open a crimson Rift. Unchained from the rules of chess, his Obsidian Legion marches down carved battlefield lanes directly toward your Citadel Gate.

Across **3 Chapters (18 Levels)**, you rally the scattered Ivory Court piece by piece, unearth pre-Accord Relics in the frozen fracture beyond the board, and storm the Crimson Citadel to deliver checkmate and seal the Rift.

### Named Chapter Villains
| Chapter | Boss Level | Villain | Title | Signature Threat |
|---|---|---|---|---|
| **I — The Ivory Ranks** | Level 6 | **Vaelor the Oathbreaker** | First Warlord of the Breach | Former Obsidian Rook-Captain leading heavy Ironclad Bastions & Blighted Clerics against the King's Courtyard. |
| **II — The Glacial Rift** | Level 12 | **Arch-Cantor Malyss** | Matriarch of the Blighted Conclave | Fallen Obsidian Bishop wielding Rift-fire necromancy, empowering relentless healing Cleric columns across the ice. |
| **III — The Crimson Citadel** | Level 18 | **Malakor, the Unbound King** | Architect of the Shattering | Sovereign monarch of the Throne of Ash commanding a 12-wave Warlord armada; tears open mini-rifts at 50% HP to summon Footmen. |

---

## Core Gameplay & Rules

### Board & Sightlines
- Battles take place on a **2.5D diagonal-aerial `8×8` chessboard** (`A–H`, `1–8`).
- Enemies spawn from the glowing **Rift Portal** and march along a recessed road trench toward your **Ivory Citadel Gate**.
- Defenders can be placed on any open (non-road) square. Selecting a defender previews its exact **chess attack squares** directly on the board.
- **Target Priority Modes:** Tap any placed defender to cycle targeting between `First`, `Strong` (highest HP), `Close`, or `Last`.
- **Early Wave Call:** Once all enemies from the current wave have spawned (or during prep), calling the next wave early awards bonus gold.
- **Sell Refund:** Any placed defender can be sold for **75%** of total invested gold (placement + promotions).

### Difficulty Modes
| Mode | Enemy HP | Enemy Speed | Starting Gold |
|---|---|---|---|
| **Tactical** *(Standard)* | `1.00×` | `1.00×` | `100%` |
| **Grandmaster** | `1.32×` | `1.09×` | `90%` |

Stars are tracked **independently** for Tactical (`★ 0 / 54`) and Grandmaster (`★ 0 / 54`).

### Star Rating Rules
Conquering a level awards **1 to 3 stars** based on remaining Citadel lives (`livesLeft / startingLives`):
- **★★★ (3 Stars):** `>= 85%` lives remaining
- **★★☆ (2 Stars):** `>= 45%` lives remaining
- **★☆☆ (1 Star):** `< 45%` lives remaining (survived with at least 1 life)

### Fog-of-War Campaign Map
- The home screen features a full-width **Interactive Campaign Map** across 3 biome bands (*Ivory Ranks*, *Glacial Rift*, *Crimson Citadel*).
- Only conquered levels plus your active frontier level are revealed; undiscovered strongholds remain shrouded under the **Fog of War** until you conquer the battle before them.
- Tapping any revealed map node deploys directly into that level with its Chronicle briefing.

---

## Defenders & Promotion Ranks

Each defender has **3 Promotion Ranks**:
- **▲ Rank I** — Base unit
- **▲▲ Rank II** — Promoted unit (displays a dark espresso & gold **double-chevron heraldic shield** on the board + deep battlefield **War Horn** SFX)
- **♛ Rank III (Max)** — Royal Masterpiece (displays a glowing crimson & gold **triple-chevron + crowned star crest** on the board + heroic two-note **Royal War Horn** SFX)

### Royal Chess Set (Levels 1–6) & Non-Chess Relics (Level 7+)
| Unlock | Defender | Base Cost | Attack Geometry | Special Mechanic | Rank II → Rank III Titles |
|---|---|---|---|---|---|
| **Lv. 1** | **Pawn** | `40g` | Adjacent 8 squares (`3×3`) | **+38% Critical Thrust** on its 4 diagonal capture squares (up to +65% at Rank III) | *Halberd Pawn* → *Promoted Vanguard* |
| **Lv. 2** | **Knight** | `80g` | Exact **L-jump** (up to 8 fork squares) | Leaps obstacles with **AoE shockwave splash** + impact stagger | *Gilded Charger* → *Paladin Steed* |
| **Lv. 3** | **Bishop** | `105g` | **4 Diagonal Rays** (6 → 8 tiles) | Piercing solar beam hitting all enemies in line + **Armor Sunder** (38% → 68%) | *Sunfire Prelate* → *Archbishop of Dawn* |
| **Lv. 4** | **Rook** | `135g` | **4 Straight Ranks & Files** (7 tiles) | Heavy splash cannonballs ignoring **60% → 88%** enemy armor | *Ironwall Keep* → *Grand Citadel Tower* |
| **Lv. 5** | **Queen** | `230g` | **All 8 Compass Rays** (5 → 8 tiles) | Rapid starlight volleys that **ricochet** across 2 → 4 targets | *Empress Radiant* → *Ascendant Sovereign* |
| **Lv. 6** | **King** *(Limit 1)* | `180g` | Adjacent `3×3` **Royal Court Aura** | Buffs adjacent allies (`+20% → +48% DMG`, `+25% → +50% Speed`), grants `+25g → +75g/wave` treasury, and smites nearby foes | *High Monarch* → *Eternal Emperor* |
| **Lv. 7** | **Frost Obelisk** *(Relic)* | `135g` | **Radial Frost Nova** (`2.15 → 2.75` tile radius) | First Non-Chess Relic — chills all nearby enemies by **42% → 62%** slow | *Permafrost Spire* → *Absolute Zero Relic* |

> **Workshop Blueprints** (documented in the in-game Royal Archives for future expansion): *Alchemist Mortar* (corrosive siege lobber) and *Clockwork Prism* (beam refractor).

---

## The Obsidian Legion (Enemies & Bosses)

All 5 enemy classes are cataloged with full stats and lore inside **Codex & Lore → Enemies**:

| Enemy | Epithet | Base HP | Speed | Armor | Bounty | Lives Cost | Combat Trait |
|---|---|---|---|---|---|---|---|
| **Obsidian Footman** | *The Forsworn Rank* | `70` | `1.32` | `5%` | `+9g` | `1 ♥` | Relentless dark vanguard infantry. |
| **Shadow Charger** | *The Bridleless Steeds* | `56` | `2.28` | `0%` | `+11g` | `1 ♥` | Blazingly fast dark warhorse that punishes unguarded corners. |
| **Ironclad Bastion** | *The Hollow Keeps* | `260` | `0.78` | `45%` | `+22g` | `2 ♥` | Heavily armored siege golem — counter with Promoted Pawns, Bishop Sunder, or Rooks. |
| **Blighted Cleric** | *The Rift Cantors* | `155` | `1.12` | `15%` | `+21g` | `1 ♥` | Pulses dark mending every `2.4s` to heal nearby allies (`1.85` tile radius). |
| **Crimson Warlord** *(Boss)* | *The Crowned Breakers* | `1050` | `0.66` | `34%` | `+90g` | `5 ♥` | Resists frost slow by `45%`; tears open a rift at **50% HP** to summon 4 Obsidian Footmen. |

Enemy HP, speed, armor, and bounty scale progressively across levels and waves ([`createEnemyConfig`](js/data/enemies.js)).

---

## 18-Level Campaign & 3 Chapter Biomes

Each chapter transforms the **2.5D battle board slab, tile materials, road trench glow, Rift portal, and live ambient particles**:

### Chapter I — The Ivory Ranks *(Warm Walnut, Travertine Marble & Sunlit Gold Dust)*
| Lv | Name | Subtitle | Waves | Gold | Lives | Special |
|---:|---|---|---:|---:|---:|---|
| 1 | The Pawn's Bastion | Opening Rank | 5 | `125g` | `15 ♥` | Unlocks **Pawn** |
| 2 | The Knight's Fork | Twin Hairpins | 6 | `145g` | `12 ♥` | Unlocks **Knight** |
| 3 | The Bishop's Diagonal | Sunbeam Staircase | 7 | `165g` | `12 ♥` | Unlocks **Bishop** |
| 4 | The Rook's Siege | Grand Straightaways | 8 | `245g` | `12 ♥` | Unlocks **Rook** |
| 5 | The Queen's Gambit | Royal Spiral Court | 9 | `265g` | `10 ♥` | Unlocks **Queen** |
| 6 | The King's Citadel | Sovereign Courtyard | 10 | `270g` | `10 ♥` | Unlocks **King** • Boss: **Vaelor the Oathbreaker** |

### Chapter II — The Glacial Rift *(Frosted Slate, Ice-Marble, Cyan Frost Trench & Drifting Snow)*
| Lv | Name | Subtitle | Waves | Gold | Lives | Special |
|---:|---|---|---:|---:|---:|---|
| 7 | Beyond the Board | Mythic Rift Trial | 10 | `320g` | `10 ♥` | Unlocks **Frost Obelisk** *(Relic)* • Triggers Ch. II Cutscene |
| 8 | Frozen Switchback | Glacial Crevasse | 9 | `350g` | `10 ♥` | Long chilling chokepoints |
| 9 | Cavalry Crossing | Twin Frost Canyons | 9 | `390g` | `10 ♥` | High-speed Shadow Charger lanes |
| 10 | Cathedral of Rays | Prism Staircase | 10 | `430g` | `10 ♥` | Diagonal Bishop & Queen sightlines |
| 11 | Iron Ramparts | Siege Trench Line | 10 | `415g` | `10 ♥` | Armored Bastion perimeter trenches |
| 12 | The Twin Monoliths | Glacial Rift Finale | 10 | `435g` | `10 ♥` | Boss: **Arch-Cantor Malyss** |

### Chapter III — The Crimson Citadel *(Volcanic Iron Basalt, Ash-Bone Squares, Magma Trench & Rising Embers)*
| Lv | Name | Subtitle | Waves | Gold | Lives | Special |
|---:|---|---|---:|---:|---:|---|
| 13 | Ember Gauntlet | Basalt Serpentine | 10 | `465g` | `10 ♥` | Triggers Ch. III Cutscene |
| 14 | Obsidian Labyrinth | Double-Coil Vault | 10 | `485g` | `10 ♥` | Dual spiraling inner sanctum |
| 15 | Cleric's Conclave | Blighted Cloister | 11 | `515g` | `10 ♥` | Dense healing Cleric packs |
| 16 | Castle Perimeter | Inner Keep Moat | 11 | `540g` | `10 ♥` | Outer battlement moat defense |
| 17 | The Dread March | Shattered Battlements | 11 | `565g` | `10 ♥` | Malakor's royal vanguard assault |
| 18 | Crown of Ash | Grand Sovereign Finale | 12 | `610g` | `10 ♥` | Boss: **Malakor, the Unbound King** • Triggers **Epilogue Cutscene** |

---

## Motion-Comic Cutscenes & Audio

### Illustrated Motion-Comic Cutscenes (`js/cutscene.js`, `assets/scenes/`)
Four widescreen (`16:9`) motion-comic cinematics use custom-painted illustrations with smooth Ken Burns camera motion, live `<canvas>` particle effects (`gold`, `snow`, `ember`, `dawn`), captions, progress bar, and Next/Skip controls:
1. **Prologue — *The Shattered Gambit*** (auto-plays on a brand-new campaign or after Clear Save)
2. **Chapter II — *Beyond the Sixty-Four*** (auto-plays upon first entering Level 7)
3. **Chapter III — *Crown of Ash*** (auto-plays upon first entering Level 13)
4. **Epilogue — *Checkmate & Dawn*** (auto-plays upon conquering Level 18)

All unlocked cinematics can be replayed anytime via the **🎬 Story** button on the Campaign Map toolbar or inside **Codex & Lore → Chronicles**.

### Procedural Web Audio Engine (`js/audio.js`)
Zero external audio files required — all music and SFX are synthesized live through a stereo concert-hall `ConvolverNode` reverb bus:
- **3 Alternating Cinematographic Orchestral Suites:**
  1. *March of the Ivory Crown* (`D Minor` — Heroic Cinematic Strings & Brass)
  2. *Nocturne of the Obsidian Rift* (`F# Minor` — Brooding Cello & Low Brass)
  3. *Siege of the Crimson Citadel* (`C Minor` — Driving 3+3+2 Action Score)
- Suites automatically alternate across levels/waves, dynamically shift intensity (`prep` → `combat` → `boss`), and can also be cycled manually in **⚙ Settings**.
- **Tactile SFX:** Wooden chess clack placement, blade/beam/cannon/frost/smite combat impacts, and layered brass **War Horn** calls on Rank II / Rank III troop promotions.

### 4-Way Directional Animated Sprite Sheets (`assets/sheets/`)
All 5 enemies and 7 defenders use custom `4×2` (8-frame) chroma-keyed animation sprite sheets (`Row 0`: front-3/4 motion/aiming, `Row 1`: back-3/4 motion/aiming, horizontally mirrored for all 4 isometric facings). Enemies animate along their exact travel vector, and towers dynamically turn to face and aim at their live combat target.

---

## Save Data & Settings

- **Dual Durable Persistence (`js/storage.js`):** Campaign progress (unlocked level, Tactical & Grandmaster stars per level, best scores, and seen cutscenes) is automatically saved to **both** `localStorage` (`towerdechess_progress_v1`) and `IndexedDB` (`TowerDeChessDB`) so saves survive accidental browser cache clears.
- **⚙ Settings Modal:**
  - Independent **Battle Music** and **Sound Effects** switches (also mirrored in the gameplay topbar).
  - **Next Suite** button to cycle orchestral tracks.
  - **Backup / Transfer Code** modal (copy/paste base64 save codes to transfer progress between Web and Android).
  - Two-step **Clear Save Data** button wiping both `localStorage` and `IndexedDB` cleanly back to Chapter I, Level 1.

---

## Repository Structure

```text
TowerDefense/
├── index.html                    # App shell: Campaign Map, Gameplay HUD, Royal Archives, Settings & Cutscene Theater
├── manifest.json                 # PWA manifest (icons, theme color, standalone display)
├── sw.js                         # Network-first Service Worker for offline PWA play (bump CACHE_NAME on releases)
├── privacy-policy.html           # Play Store privacy policy (zero tracking / local-only storage)
├── capacitor.config.json         # Capacitor 7 config (appId: io.github.wildvegangoose.towerdechess, webDir: www)
├── package.json                  # npm build & Android Capacitor scripts
├── PLAY_STORE_GUIDE.md           # Step-by-step Google Play Store .aab signing & release guide
│
├── css/
│   └── styles.css                # Handcrafted Royal Tabletop design system (walnut, marble, brass) + responsive mobile/desktop layouts
│
├── js/
│   ├── main.js                   # App controller: Campaign Map, HUD, Inspector, 4-tab Royal Archives, Settings & Capacitor Back button
│   ├── assets.js                 # Asset manifest, sprite/sheet metadata, preloader & scene URL resolver
│   ├── audio.js                  # Web Audio API synth: 3 orchestral suites + hall reverb + War Horn & combat SFX
│   ├── cutscene.js               # Illustrated Motion-Comic CutscenePlayer (Ken Burns dolly + Canvas particles + audio sync)
│   ├── storage.js                # Dual localStorage + IndexedDB progress persistence, merge logic & export/import save codes
│   ├── data/
│   │   ├── levels.js             # 18 Campaign levels, 3 Chapter definitions, waypoints & wave compositions
│   │   ├── pieces.js             # Data-driven defender registry (6 Chess pieces + Frost Obelisk + Workshop Blueprints)
│   │   ├── enemies.js            # 5 Obsidian Legion enemy archetypes, difficulty presets & wave scaling formulas
│   │   └── story.js              # Cutscene scripts, 3 Villain dossiers, 5 Enemy Bestiary stories & 18 level dispatches
│   └── engine/
│       ├── game.js               # 2.5D isometric Canvas renderer, 3 Chapter board biomes, combat loop, projectiles & rank insignia
│       └── targeting.js          # Authentic chess sightline geometry (Pawn, Knight L-jump, Bishop, Rook, Queen, King, Radial)
│
├── assets/
│   ├── sprites/                  # Static transparent PNG miniatures (UI icons, HUD cards, Codex, Citadel Gate)
│   ├── sheets/                   # 12 custom 4×2 (8-frame) directional animation sprite sheets (enemies + defenders)
│   ├── scenes/                   # 6 widescreen (16:9) painted cutscene illustrations (JPEG)
│   └── icons/                    # App/PWA icons (icon-192.png, icon-512.png)
│
├── scripts/
│   ├── build_standalone.py       # Bundles entire game + WebP-inlined sprites/sheets/scenes into single-file HTML
│   ├── sync_web.mjs              # Copies lean runtime web assets into ./www for Capacitor Android builds
│   ├── process_assets.py         # Chroma-key + trim pipeline for static 3D miniature sprites
│   ├── process_sheets.py         # 4×2 sprite sheet slicer, chroma-keyer, foot-anchor normalizer & PNG packer
│   └── generate_android_assets.py# Generates Android mipmap launcher icons & splash screens
│
├── dist/
│   └── towerdechess-standalone.html  # Zero-dependency single-file HTML build
├── android/                      # Native Capacitor 7 Android Studio / Gradle project
├── store-assets/                 # Google Play feature graphic & store listing artwork
└── .github/workflows/
    └── android-build.yml         # GitHub Actions CI workflow building signed/unsigned Android .aab & .apk artifacts
```

---

## Development, Builds & Extending the Game

### Run Locally
```bash
python3 -m http.server 4173
# Open http://localhost:4173
```

### Build Single-File Standalone HTML
Inlines all CSS, ES modules, sprites, animation sheets, and cutscene paintings as compact WebP data URIs into `dist/towerdechess-standalone.html`:
```bash
npm run build:standalone
# or: python3 scripts/build_standalone.py
```

### Sync & Build for Android (Capacitor 7)
```bash
npm run android:sync     # Syncs lean web bundle into ./www and copies to ./android
npm run android:debug    # Builds debug APK
npm run android:bundle   # Builds release Android App Bundle (.aab) for Google Play
```
See [`PLAY_STORE_GUIDE.md`](PLAY_STORE_GUIDE.md) for keystore setup and GitHub Actions release signing.

### Adding a New Non-Chess Relic / Defender
All defenders are data-driven in `js/data/pieces.js`:
1. Add a static transparent PNG to `assets/sprites/piece_<id>.png` (and optionally a `4×2` animation sheet to `assets/sheets/piece_<id>.png`, registered in `SHEET_META` inside `js/assets.js` and `scripts/build_standalone.py`).
2. Register the defender in `PIECE_REGISTRY` and `PIECE_ORDER` inside `js/data/pieces.js` with `category: 'mythic'`, its attack `pattern`, `attackType`, base stats, and `upgrades` (Rank II & Rank III).
3. Bump `CACHE_NAME` in `sw.js`, rebuild standalone HTML, and run `npm run android:sync`.