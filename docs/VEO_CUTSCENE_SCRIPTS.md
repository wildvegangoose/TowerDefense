# TowerDeChess — Google Veo Cutscene Scripts & Prompt Book

This document contains the complete **shot-by-shot Veo video generation scripts** for all 4 story cutscenes of **TowerDeChess ("The Shattered Gambit")**.

You can use these in two ways:
1. **Automated CLI Generation** via [`scripts/generate_veo_cutscenes.py`](../scripts/generate_veo_cutscenes.py) + [`scripts/veo_shots.json`](../scripts/veo_shots.json) using the official `google-genai` Python SDK (Vertex AI or Gemini API) and `ffmpeg` crossfade stitching.
2. **Copy-Paste into Google Flow / Veo UI / Vertex AI Media Studio** by uploading each shot's painted `16:9` keyframe from `assets/scenes/` as the **Start Frame** and pasting the shot prompt below.

---

## Global Visual Style & Recommended Veo Settings

- **Model:** `veo-3.1-generate-001` (or `veo-3.1-fast-generate-001` for fast drafts)
- **Mode:** **Image-to-Video** (upload the matching `assets/scenes/scene_*.jpg` painting as the **First Frame** so every cutscene matches the game's exact handcrafted art style)
- **Aspect Ratio:** `16:9`
- **Duration:** `8s` per shot (`24 fps`)
- **Resolution:** `720p` (lean for mobile PWA/APK) or `1080p`
- **Audio:** Native Veo audio **On** for standalone trailers/cinematics, or **Off** (`--no-audio`) if you want TowerDeChess's procedural orchestral suites to play exclusively over the video.

**Global Style Suffix (automatically appended by `generate_veo_cutscenes.py`):**
> Hand-painted epic dark-fantasy oil painting come to life, tactile carved ivory and dark obsidian chess figurines at monumental architectural scale, dramatic volumetric lighting, subtle film grain, 24fps cinematic anamorphic lens, rich warm espresso walnut and brushed antique brass color palette. No modern elements, no on-screen text, no UI overlays, no watermarks.

**Negative Prompt:**
> `text, subtitles, watermark, logo, UI overlay, modern clothing, cartoon cel-shading, plastic toy sheen, distorted faces, extra limbs, jerky frame rate, sudden morphing`

---

## Cutscene 1 — Prologue: *The Shattered Gambit* (`24s` total • 3 shots)

### Shot 1.1 — *The Accord of Sixty-Four* (`8s`)
- **Start Frame:** `assets/scenes/scene_prologue_1.jpg`
- **On-Screen Caption (`CHRONICLE OF AETHELGARD`):**
  > *"For a thousand winters, Aethelgard endured under the Accord of Sixty-Four — an ancient pact binding Ivory and Obsidian to the Sacred Laws of the Board."*
- **Veo Prompt:**
  > Slow sweeping aerial dolly-in across a colossal sunlit marble chessboard kingdom stretching toward a grand medieval ivory citadel on golden cliffs. Golden sunbeams pierce drifting clouds while shimmering golden dust motes float gently through the air. Carved ivory chess warriors — armored Knights, hooded Bishops, towering Rooks, and royal sovereigns — stand in noble, breathing formation along the marble battlements, pennants and cloaks rippling gently in a warm highland breeze. Hand-painted fantasy oil painting aesthetic, 24fps cinematic lens. Audio: majestic swelling orchestral strings and distant warm French horns over soft mountain wind.

### Shot 1.2 — *The Shattering of the Black Crown* (`8s`)
- **Start Frame:** `assets/scenes/scene_prologue_2.jpg`
- **On-Screen Caption (`MALAKOR, THE UNBOUND KING`):**
  > *"\"No sovereign kneels to sixty-four squares!\" Shattering his Black Crown at the edge of the world, Malakor tore open the Rift — unleashing an army bound by no rule of chess."*
- **Veo Prompt:**
  > Dramatic low-angle push-in at the shattered rim of a colossal dark chessboard under storm-torn crimson skies. The towering Obsidian Monarch Malakor in jagged volcanic armor raises his broken black crown and slams it downward, sending a shockwave of glowing molten cracks across the marble squares. Behind him, a swirling crimson abyssal Rift erupts with rising glowing embers as dark armored Obsidian Footmen and spiked Shadow Charger warhorses surge forward off the ruined board. Hand-painted dark-fantasy cinematic oil style, intense chiaroscuro rim lighting, 24fps. Audio: thunderous obsidian shatter, deep subterranean bass boom, roaring Rift fire, and a booming war horn.

### Shot 1.3 — *The Last Line of Pawns* (`8s`)
- **Start Frame:** `assets/scenes/scene_prologue_1.jpg`
- **On-Screen Caption (`ROYAL VANGUARD DISPATCH`):**
  > *"The Court is scattered across the Ivory Ranks. Only a line of humble Pawns remains to hold the first bastion — rally the Royal Set before the Citadel Gate falls!"*
- **Veo Prompt:**
  > Tight heroic tracking shot gliding low along a frontline rank of carved ivory Pawn spearmen standing guard upon a warm travertine marble chess square at dusk. Long dramatic shadows stretch across the chessboard as red stormlight flickers on the distant horizon. The ivory Pawns plant their halberds and raise their gilded shields in crisp unison, dust puffing off the marble tiles as distant crimson sparks drift across the sky. Tactile dark-fantasy oil painting in motion, 24fps. Audio: synchronized metallic spear plant on stone, crisp war drum pulse, and rising heroic brass motif.

---

## Cutscene 2 — Chapter II: *Beyond the Sixty-Four* (`16s` total • 2 shots)

### Shot 2.1 — *Arch-Cantor Malyss in the Blizzard* (`8s`)
- **Start Frame:** `assets/scenes/scene_chapter2_1.jpg`
- **On-Screen Caption (`ARCH-CANTOR MALYSS`):**
  > *"Vaelor has fallen, yet the northern frontier cracks open into an abyss of ice. Through the blizzard marches Arch-Cantor Malyss, her ember-lantern knitting broken obsidian back to life."*
- **Veo Prompt:**
  > Atmospheric lateral tracking shot across a wind-swept icy chessboard bridge spanning a bottomless blue glacier chasm during a howling blizzard. Snowflakes whip diagonally across the frame. In dark tattered crimson-trimmed robes, Arch-Cantor Malyss raises a glowing crimson ember staff; ribbons of eerie red Rift-light arc from her lantern to mend the cracked iron armor of massive stomping Ironclad Bastion golems marching inexorably behind her. Cold cyan twilight contrasted with sinister crimson firelight, hand-painted dark-fantasy cinema, 24fps. Audio: howling arctic wind, heavy rhythmic iron footsteps crunching ice, eerie dark chanting, and brooding low cello.

### Shot 2.2 — *Awakening the Frost Obelisk* (`8s`)
- **Start Frame:** `assets/scenes/scene_chapter2_2.jpg`
- **On-Screen Caption (`RELIC AWAKENED`):**
  > *"Against foes who defy the rules of chess, the Accord alone is not enough. Beneath the glacier, your Court unearths the Frost Obelisk — a forbidden Relic forged before the Board existed."*
- **Veo Prompt:**
  > Majestic upward tilt and slow orbit around a towering ancient glacial alabaster Frost Obelisk rising out of cracked ice tiles in a frozen mountain pass. Luminous cyan runes ignite sequentially from base to spire, unleashing a shimmering radial frost shockwave that crystallizes swirling snowflakes in mid-air. Standing bravely in the foreground on frosted chess tiles, the Ivory Queen, Knight, and Rook shield their eyes as radiant azure light bathes their carved marble armor. Epic fantasy cinema oil painting aesthetic, 24fps. Audio: deep crystalline ice groaning, resonant harmonic frost chime explosion, and soaring ethereal orchestral choir.

---

## Cutscene 3 — Chapter III: *Crown of Ash* (`8s` • 1 shot)

### Shot 3.1 — *Gates of the Crimson Citadel* (`8s`)
- **Start Frame:** `assets/scenes/scene_chapter3_1.jpg`
- **On-Screen Caption (`MALAKOR, THE UNBOUND KING`):**
  > *"The Glacial Rift lies behind you. Ahead rises the Crimson Citadel — charred obsidian squares veined with magma, where Malakor awaits upon the Throne of Ash for a final gambit."*
- **Veo Prompt:**
  > Sweeping dramatic crane shot rising over a volcanic basalt bridge made of scorched obsidian chessboard squares glowing with molten lava seams underneath. Glowing volcanic embers and black ash drift upward against a blood-red storm sky. Upon the jagged volcanic rampart ahead stands Malakor, the Unbound King, molten crown blazing as he raises his greatsword toward the oncoming camera while vast legions of armored obsidian warriors stir along the bridge below. Dark epic fantasy cinema oil-painted realism, intense orange underlighting, 24fps. Audio: booming siege war drums, crackling volcanic lava rumble, blazing brass fanfare, and distant echoing war horns.

---

## Cutscene 4 — Epilogue: *Checkmate & Dawn* (`8s` • 1 shot)

### Shot 4.1 — *The Accord Restored* (`8s`)
- **Start Frame:** `assets/scenes/scene_epilogue_1.jpg`
- **On-Screen Caption (`CHRONICLE OF AETHELGARD`):**
  > *"Checkmate. The Unbound Crown lies cold upon sunlit marble as the Crimson Rift seals on the horizon. Chess and Relic now stand united — guardians of the Sixty-Four Squares."*
- **Veo Prompt:**
  > Serene slow pull-back and gentle rise from a shattered obsidian crown cooling to dark stone on a sunlit white-and-gold marble chessboard terrace. The last faint wisps of ember smoke fade away into crisp morning air. In the glowing golden background, the Ivory King and Queen stand side by side beside the softly pulsing blue Frost Obelisk, gazing over peaceful sunlit valleys as the last sliver of the red Rift closes into bright golden sunrise clouds. Luminous warm golden-hour lighting, floating sunlit pollen motes, hand-painted epic fantasy cinema, 24fps. Audio: gentle fading wind, triumphant warm major-key orchestral strings and horn resolution, peaceful chime.

---

## Running the Automated Veo Generator

```bash
# 1. Install the official Google GenAI Python SDK
pip install google-genai

# 2. Dry-run to inspect all 7 shot prompts & verify keyframe paths
python3 scripts/generate_veo_cutscenes.py --dry-run

# 3a. Generate with Vertex AI (Veo 3.1 GA)
export GOOGLE_CLOUD_PROJECT="your-gcp-project"
export GOOGLE_CLOUD_LOCATION="us-central1"
python3 scripts/generate_veo_cutscenes.py --vertexai --model veo-3.1-generate-001 --resolution 720p

# 3b. Or generate with a Gemini API key
export GEMINI_API_KEY="your-api-key"
python3 scripts/generate_veo_cutscenes.py --model veo-3.1-generate-001 --resolution 720p

# 4. Generate a single cutscene or single shot
python3 scripts/generate_veo_cutscenes.py --cutscene prologue --vertexai
python3 scripts/generate_veo_cutscenes.py --shot chapter2_02_obelisk --vertexai --force
```

Generated shots are saved to `assets/videos/shots/<shot_id>.mp4` and automatically crossfade-stitched (via `ffmpeg`) into web-ready H.264 files:
- `assets/videos/prologue.mp4`
- `assets/videos/chapter2.mp4`
- `assets/videos/chapter3.mp4`
- `assets/videos/epilogue.mp4`
