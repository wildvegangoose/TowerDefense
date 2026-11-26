# Crownward — Chess Tower Defense

A mobile-first **Android Progressive Web App (PWA)** & web tower defense game where every campaign level unlocks a new Chess piece with authentic board-geometry attack patterns — escalating to mythic **non-chess relics** beyond the board.

## Play on Android (No APK Required)
Because Crownward is built as a lightweight HTML5 / Canvas / ES Modules PWA:
- Open the hosted URL (e.g., **GitHub Pages** or local dev server) in **Chrome on Android**.
- Tap **Menu → Add to Home screen** (or the in-app **Install App** button) to launch fullscreen like a native Android game — zero APK sideloading needed.

## Campaign Progression & Pieces
| Level | Map | Unlocks | Authentic Attack Pattern |
|---|---|---|---|
| 1 | The Pawn's Bastion | **Pawn** | Adjacent 8 squares with **+35% Critical Thrust** on its 4 diagonal squares |
| 2 | The Knight's Fork | **Knight** | Exact **L-shape jump** squares with AoE shockwave splash & stagger |
| 3 | The Bishop's Diagonal | **Bishop** | Piercing solar beams down all **4 diagonals** + Armor Sunder |
| 4 | The Rook's Siege | **Rook** | Heavy armor-piercing cannons down **4 straight ranks & files** |
| 5 | The Queen's Gambit | **Queen** | All **8 compass rays** with rapid ricocheting starlight bolts |
| 6 | The King's Citadel | **King** | **3×3 Royal Court Aura** (+DMG / +Attack Speed), Wave Treasury gold, Sovereign Smite |
| 7 | Beyond the Board | **Frost Obelisk** *(Non-Chess Relic)* | Radial glacial frost nova slowing entire waves by up to 62% |

## Adding New Non-Chess Pieces
All defenders are data-driven in `js/data/pieces.js`:
1. Drop a new 3D miniature sprite (AI-generated or Blender-rendered on chroma green `#00D040`) and run `python3 scripts/process_assets.py`, or save a transparent PNG directly into `assets/sprites/`.
2. Register the piece in `PIECE_REGISTRY` and `PIECE_ORDER` inside `js/data/pieces.js` with `category: 'mythic'`, its `pattern`, `attackType`, stats, and 3-tier promotion upgrades.

## Local Development
```bash
python3 -m http.server 4173
# Open http://localhost:4173
```