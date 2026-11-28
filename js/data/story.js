/**
 * Narrative Lore, Villains, Enemy Bestiary, Level Dispatches & Cutscenes
 * for TowerDeChess: "The Shattered Gambit".
 *
 * Every campaign level (Levels 1-18) plus the Epilogue has its own 30-second
 * story (4 x 7.5s motion-comic slides, or 4 x 8s stitched Veo MP4 shots with
 * 0.6s crossfades -> 30.2s). A cutscene with a `video` key plays
 * `assets/videos/<video>.mp4` with its own audio, overlaying each slide's
 * caption from its `videoStart` cue; its painted slides remain the fallback.
 * Drop a generated MP4 into `assets/videos/<id>.mp4` and set `video: '<id>'`
 * to upgrade any level's motion-comic to a Veo cinematic.
 */

export const CUTSCENES = {
  "prologue": {
    "id": "prologue",
    "levelId": 1,
    "chapter": 1,
    "title": "The Shattered Gambit",
    "chapterLabel": "LEVEL 1 • PROLOGUE",
    "unlockLevel": 1,
    "musicMode": "prep",
    "particleTheme": "gold",
    "thumbScene": "scene_prologue_1",
    "summary": "How the Accord of Sixty-Four fell when Malakor shattered his Black Crown, leaving lone Pawns to hold the Opening Rank.",
    "slides": [
      {
        "scene": "scene_prologue_1",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "For a thousand winters, Aethelgard endured under the Accord of Sixty-Four — an ancient pact binding Ivory and Obsidian to the Sacred Laws of the Board."
      },
      {
        "scene": "scene_prologue_2",
        "duration": 8.5,
        "videoStart": 10.08,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "MALAKOR, THE UNBOUND KING",
        "caption": "\"No sovereign kneels to sixty-four squares!\" Shattering his Black Crown at the edge of the world, Malakor tore open the Rift — unleashing an army bound by no rule of chess."
      },
      {
        "scene": "scene_prologue_1",
        "duration": 7.0,
        "videoStart": 20.12,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "The Court is scattered across the Ivory Ranks. Only a line of humble Pawns remains to hold the first bastion — rally the Royal Set before the Citadel Gate falls!"
      }
    ],
    "video": "prologue"
  },
  "level_02": {
    "id": "level_02",
    "levelId": 2,
    "chapter": 1,
    "title": "The Knight's Fork",
    "chapterLabel": "LEVEL 2 • THE IVORY RANKS",
    "unlockLevel": 2,
    "musicMode": "prep",
    "particleTheme": "gold",
    "thumbScene": "scene_level_02",
    "summary": "Shadow Chargers race down the autumn twin hairpins until the Royal Knights vault from the highland ridges to fork both lanes.",
    "slides": [
      {
        "scene": "scene_level_02",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "HIGHLAND WATCHTOWER",
        "caption": "Dawn breaks amber over the Twin Hairpins, yet the valley trembles. Through swirling autumn leaves, scouts spot dark warhorses thundering off the broken border."
      },
      {
        "scene": "scene_prologue_2",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "CAPTAIN AURELIAN",
        "caption": "\"They have cast off the L-jump oath!\" Spiked Shadow Chargers tear straight through the hairpin switchbacks, too swift for solitary Pawns to catch alone."
      },
      {
        "scene": "scene_level_02",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "ROYAL CAVALRY ORDER",
        "caption": "From the sunlit marble ridges above, the Ivory Knights answer the horn — gleaming warhorses lowering their gilded lances to leap clean across the chasm."
      },
      {
        "scene": "scene_level_02",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Vault over the stone wall and fork both hairpins at once! Command the central ridges and shatter the Shadow Charger raid before they turn the flank."
      }
    ]
  },
  "level_03": {
    "id": "level_03",
    "levelId": 3,
    "chapter": 1,
    "title": "The Bishop's Diagonal",
    "chapterLabel": "LEVEL 3 • THE IVORY RANKS",
    "unlockLevel": 3,
    "musicMode": "prep",
    "particleTheme": "gold",
    "thumbScene": "scene_level_03",
    "summary": "Blighted Clerics ascend the misty Sunbeam Staircase with crimson mending lanterns until the Solar Bishops pierce the fog along every diagonal.",
    "slides": [
      {
        "scene": "scene_level_03",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "High in the cliffside sanctuaries stands the Sunbeam Staircase — stepped marble terraces where light itself obeys the sacred diagonal geometry of the Board."
      },
      {
        "scene": "scene_level_03",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ARCH-CANTOR'S DISCIPLES",
        "caption": "From the gorge below climb hooded Blighted Clerics. Swinging lanterns of stolen Rift-fire, their dark chants knit shattered obsidian armor back together mid-stride."
      },
      {
        "scene": "scene_level_03",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "PRELATE SERAPHINA",
        "caption": "\"Let the shadow flee the true diagonal!\" Stepping onto the gilded landings, the Ivory Bishops raise their sun-staves and draw down blazing beams of dawn."
      },
      {
        "scene": "scene_level_03",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Line your Bishops along the long diagonal terraces to cleave entire columns and sunder heavy armor — silence the Clerics before their dark chorus reaches the summit!"
      }
    ]
  },
  "level_04": {
    "id": "level_04",
    "levelId": 4,
    "chapter": 1,
    "title": "The Rook's Siege",
    "chapterLabel": "LEVEL 4 • THE IVORY RANKS",
    "unlockLevel": 4,
    "musicMode": "battle",
    "particleTheme": "gold",
    "thumbScene": "scene_level_04",
    "summary": "Vaelor's armored Ironclad Bastions march down the Grand Straightaways until the Ivory Rooks unchain their bronze siege culverins.",
    "slides": [
      {
        "scene": "scene_level_04",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "FORTRESS QUARTERMASTER",
        "caption": "Past the highland stairs stretch the Grand Straightaways — wide sandstone corridors built to let royal artillery command every rank and file without obstruction."
      },
      {
        "scene": "scene_level_04",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "VAELOR'S VANGUARD",
        "caption": "The ground shudders beneath Ironclad Bastions — shattered Obsidian Rooks reforged into living siege golems whose molten iron plates shrug off light spears."
      },
      {
        "scene": "scene_level_04",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "MASTER ARTIFICER TORIN",
        "caption": "\"Roll the Bastion Towers onto the file!\" Carved Ivory Rooks rumble into position at the corridor ends, locking four heavy bronze culverins on the enemy rank."
      },
      {
        "scene": "scene_level_04",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Anchor your Rooks at the ends of long straightaways! Their armor-piercing blasts will blow Vaelor's living keeps back to rubble."
      }
    ]
  },
  "level_05": {
    "id": "level_05",
    "levelId": 5,
    "chapter": 1,
    "title": "The Queen's Gambit",
    "chapterLabel": "LEVEL 5 • THE IVORY RANKS",
    "unlockLevel": 5,
    "musicMode": "battle",
    "particleTheme": "gold",
    "thumbScene": "scene_level_05",
    "summary": "Under driving rain in the Spiral Court, the obsidian host encircles the inner city until the Ivory Queen claims the center square.",
    "slides": [
      {
        "scene": "scene_level_05",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Black storm clouds swallow the sky above the Royal Spiral Court. Silver rain lashes concentric rings of marble as the obsidian tide closes in from every compass point."
      },
      {
        "scene": "scene_level_05",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ROYAL GUARD CAPTAIN",
        "caption": "\"They are flooding every lane of the spiral!\" Footmen, Bastions, and Clerics press inward in lockstep, threatening to drown the inner sanctum under sheer numbers."
      },
      {
        "scene": "scene_level_05",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "QUEEN ISOLDE OF THE IVORY COURT",
        "caption": "\"Then let them gather around the center square.\" Descending onto the heart of the Spiral Court, the Ivory Queen raises her starlight diadem, illuminating every rank, file, and diagonal."
      },
      {
        "scene": "scene_level_05",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Command the heart of the spiral with the Queen! Chain her starlight volleys across the wet corridors and break the encirclement before the Citadel gates are exposed."
      }
    ]
  },
  "level_06": {
    "id": "level_06",
    "levelId": 6,
    "chapter": 1,
    "title": "The King's Citadel",
    "chapterLabel": "LEVEL 6 • CHAPTER I CLIMAX",
    "unlockLevel": 6,
    "musicMode": "boss",
    "particleTheme": "ember",
    "thumbScene": "scene_level_06",
    "summary": "Vaelor the Oathbreaker storms the Sovereign Courtyard during a raging tempest; the Ivory King steps onto the board to rally every defender.",
    "slides": [
      {
        "scene": "scene_level_06",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Lightning splits the night above the Ivory Citadel. After five bitter battles, the outer archway cracks under a roaring tempest — Chapter I reaches its reckoning."
      },
      {
        "scene": "scene_level_06",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "VAELOR THE OATHBREAKER",
        "caption": "\"Walls built on rules crumble the moment someone stops playing by them!\" Vaelor — Malakor’s first traitorous Warlord — shatters the marble arch with a blazing greatsword."
      },
      {
        "scene": "scene_level_06",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "KING ALDRIC OF AETHELGARD",
        "caption": "\"No monarch hides while his Court bleeds!\" Stepping down from the Sovereign dais, the Ivory King lifts his golden scepter, binding every nearby defender in a radiant aura of valor."
      },
      {
        "scene": "scene_level_06",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Place your King beside your strongest Rooks and Queens to supercharge their strikes and royal treasury — break Vaelor the Oathbreaker and save the Ivory Ranks!"
      }
    ]
  },
  "chapter2": {
    "id": "chapter2",
    "levelId": 7,
    "chapter": 2,
    "title": "Beyond the Sixty-Four",
    "chapterLabel": "LEVEL 7 • CHAPTER II OPENING",
    "unlockLevel": 7,
    "musicMode": "prep",
    "particleTheme": "snow",
    "thumbScene": "scene_chapter2_1",
    "summary": "Beyond Vaelor's defeat lies the frozen abyss of the Glacial Rift, where Arch-Cantor Malyss marches and the Court unearths the ancient Frost Obelisk.",
    "slides": [
      {
        "scene": "scene_chapter2_1",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Vaelor lies defeated behind the Ivory Gates, yet the victory brings no peace. Beyond the sixty-fourth rank, the earth splits open into an endless frozen abyss — the Glacial Rift."
      },
      {
        "scene": "scene_chapter2_1",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ARCH-CANTOR MALYSS",
        "caption": "\"Ice preserves the flesh. Rift-fire restores the broken!\" Through the blizzard strides Arch-Cantor Malyss, her crimson lantern knitting shattered Bastions back to life."
      },
      {
        "scene": "scene_chapter2_2",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "RELIC AWAKENED",
        "caption": "Against foes who defy the rules of chess, the Accord alone is not enough. Beneath the glacier, your Court unearths the Frost Obelisk — a mythic Relic forged before the Board existed."
      },
      {
        "scene": "scene_chapter2_2",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Plant the Frost Obelisk at icy chokepoints to chill Malyss's relentless columns to a crawl while your Royal Chess pieces shatter them in frozen crossfire!"
      }
    ]
  },
  "level_08": {
    "id": "level_08",
    "levelId": 8,
    "chapter": 2,
    "title": "Frozen Switchback",
    "chapterLabel": "LEVEL 8 • THE GLACIAL RIFT",
    "unlockLevel": 8,
    "musicMode": "prep",
    "particleTheme": "snow",
    "thumbScene": "scene_level_08",
    "summary": "Deep in the glacial crevasse, Frost Obelisks anchor tight icy hairpins so Ivory Rooks can harvest slowed columns of Malyss's vanguard.",
    "slides": [
      {
        "scene": "scene_level_08",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "GLACIAL SCOUT CORPS",
        "caption": "Narrow icy switchbacks carve deep pockets down the walls of the crevasse. Soft snow blankets every square, hiding the sheer drop on either side of the march."
      },
      {
        "scene": "scene_level_08",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "RELIC KEEPER VEYRA",
        "caption": "\"Every bend is a trap waiting for frost.\" Placing Frost Obelisks inside the tightest hairpin pockets turns the mountain’s own cold into a weapon against the Rift."
      },
      {
        "scene": "scene_level_08",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "ARCH-CANTOR'S VANGUARD",
        "caption": "As Malyss's Footmen and Ironclad Bastions round the frozen turn, crystalline chill encases their joints — slowing their dread march beneath the waiting cliffside battlements."
      },
      {
        "scene": "scene_level_08",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Pair Frost Obelisks inside the switchbacks with elevated Rooks and Queens — freeze the column in place and bring down warm golden thunder!"
      }
    ]
  },
  "level_09": {
    "id": "level_09",
    "levelId": 9,
    "chapter": 2,
    "title": "Cavalry Crossing",
    "chapterLabel": "LEVEL 9 • THE GLACIAL RIFT",
    "unlockLevel": 9,
    "musicMode": "battle",
    "particleTheme": "snow",
    "thumbScene": "scene_level_09",
    "summary": "A howling blizzard blinds twin frost canyons while Knights vault from King-buffed ridges to intercept Shadow Charger stampedes below.",
    "slides": [
      {
        "scene": "scene_level_09",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "A vicious blizzard tears across the Glacial Rift, carving twin narrow ravines between towering ridges of ice. Visibility drops to a spear’s length as iron hooves echo through the gale."
      },
      {
        "scene": "scene_level_09",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ROYAL CAVALRY WATCH",
        "caption": "\"They are splitting down both ravines!\" Packs of Shadow Chargers burst from the glowing cavern mouths, eyes burning crimson as they race through both canyons at once."
      },
      {
        "scene": "scene_level_09",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "KING ALDRIC OF AETHELGARD",
        "caption": "\"Hold the high ground, Knights of Aethelgard!\" Standing upon the central icy precipice, the Ivory King ignites his golden rallying beacon, guiding his warhorses through the storm."
      },
      {
        "scene": "scene_level_09",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Station Knights beside a buffing King on the elevated ridges to fork both frost canyons simultaneously — break the Charger stampede before it clears the pass!"
      }
    ]
  },
  "level_10": {
    "id": "level_10",
    "levelId": 10,
    "chapter": 2,
    "title": "Cathedral of Rays",
    "chapterLabel": "LEVEL 10 • THE GLACIAL RIFT",
    "unlockLevel": 10,
    "musicMode": "prep",
    "particleTheme": "snow",
    "thumbScene": "scene_level_10",
    "summary": "Beneath translucent ice vaults where aurora light refracts into golden prisms, Bishops and Queens carve diagonal crossfire through Malyss's iron ranks.",
    "slides": [
      {
        "scene": "scene_level_10",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Suddenly the blizzard parts. Before the Court rises the Cathedral of Rays — an ancient ruined basilica whose translucent ice arches bend starlight into luminous prisms."
      },
      {
        "scene": "scene_level_10",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "PRELATE SERAPHINA",
        "caption": "\"Malyss’s cantors dare bring Rift-fire into the house of light.\" Along the lower colonnades march armored Bastions and crimson-lantern Clerics, staining the clear ice red."
      },
      {
        "scene": "scene_level_10",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "QUEEN ISOLDE OF THE IVORY COURT",
        "caption": "\"Every diagonal here is a lens.\" Raising her staff beside a choir of Ivory Bishops, the Queen channels the cathedral’s prismatic light into blazing piercing beams."
      },
      {
        "scene": "scene_level_10",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Claim the grand diagonal colonnades with Bishops and Queens! Let refracted solar rays melt Malyss's iron armor and silence her cantors in a blaze of light."
      }
    ]
  },
  "level_11": {
    "id": "level_11",
    "levelId": 11,
    "chapter": 2,
    "title": "Iron Ramparts",
    "chapterLabel": "LEVEL 11 • THE GLACIAL RIFT",
    "unlockLevel": 11,
    "musicMode": "battle",
    "particleTheme": "snow",
    "thumbScene": "scene_level_11",
    "summary": "In snowbound perimeter trenches outside Malyss's citadel, Ivory Rooks dig in for a thunderous artillery duel against endless Bastion columns.",
    "slides": [
      {
        "scene": "scene_level_11",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "FORTRESS QUARTERMASTER",
        "caption": "Beyond the ice cathedral lie the Iron Ramparts — frozen trenches and broken obsidian walls guarding the final approach to Arch-Cantor Malyss’s monoliths."
      },
      {
        "scene": "scene_level_11",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ARCH-CANTOR'S LEGION",
        "caption": "Row upon row of Ironclad Bastions march shoulder-to-shoulder across the snowfield, flanked by chanting Clerics determined to grind the royal trenches into dust."
      },
      {
        "scene": "scene_level_11",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "MASTER ARTIFICER TORIN",
        "caption": "\"Elevate the culverins and hold the straight files!\" Anchored atop the frozen ridge, heavy Ivory Rook batteries ignite their braziers and sight down the perimeter corridors."
      },
      {
        "scene": "scene_level_11",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Build an unbreakable Rook and Frost Obelisk fireline along the ramparts! Hold the trenches through every iron wave to force the gates of the Twin Monoliths."
      }
    ]
  },
  "level_12": {
    "id": "level_12",
    "levelId": 12,
    "chapter": 2,
    "title": "The Twin Monoliths",
    "chapterLabel": "LEVEL 12 • CHAPTER II CLIMAX",
    "unlockLevel": 12,
    "musicMode": "boss",
    "particleTheme": "snow",
    "thumbScene": "scene_level_12",
    "summary": "At the Glacial Rift's heart, Arch-Cantor Malyss unleashes her full necromantic host across two frozen island monoliths against the united Court and Relics.",
    "slides": [
      {
        "scene": "scene_level_12",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "At the frozen edge of the Rift rise the Twin Monoliths — two colossal spires of ancient ice linked by narrow chessboard causeways above a churning arctic sea."
      },
      {
        "scene": "scene_level_12",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "ARCH-CANTOR MALYSS",
        "caption": "\"Your Relics chill the body, Ivory Sovereign — my flame denies death itself!\" Raising her blazing ember-lantern, Malyss weaves crimson life-threads into towering Warlords."
      },
      {
        "scene": "scene_level_12",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "QUEEN ISOLDE OF THE IVORY COURT",
        "caption": "\"Then we break the lantern and the ice together!\" On the eastern monolith, the Ivory King and Queen ignite twin Frost Obelisks, answering Malyss’s crimson fire with starlight and rime."
      },
      {
        "scene": "scene_level_12",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Crown both frozen islands with Queens, a King, and Frost Obelisks! Shatter Arch-Cantor Malyss's healing armada and open the bridge to the Crimson Citadel!"
      }
    ]
  },
  "chapter3": {
    "id": "chapter3",
    "levelId": 13,
    "chapter": 3,
    "title": "Ember Gauntlet",
    "chapterLabel": "LEVEL 13 • CHAPTER III OPENING",
    "unlockLevel": 13,
    "musicMode": "boss",
    "particleTheme": "ember",
    "thumbScene": "scene_chapter3_1",
    "summary": "Beyond the shattered Glacial Rift rises the volcanic Crimson Citadel, where Malakor greets the Ivory Court across the scorched Ember Gauntlet.",
    "slides": [
      {
        "scene": "scene_chapter3_1",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Arch-Cantor Malyss is vanquished and the blizzard breaks behind you. Ahead, the sky bleeds volcanic scarlet as grey ash drifts down onto charred basalt squares."
      },
      {
        "scene": "scene_chapter3_1",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Across the lava chasm looms the Crimson Citadel — a jagged obsidian fortress veined with flowing magma, built by Malakor upon the shattered rim of the world."
      },
      {
        "scene": "scene_chapter3_1",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "MALAKOR, THE UNBOUND KING",
        "caption": "\"So the Ivory Court dares cross into my dominion!\" High upon the flaming rampart, Malakor lifts his Rift-forged greatsword, his molten crown burning like a fallen star."
      },
      {
        "scene": "scene_chapter3_1",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Enter the Ember Gauntlet! Anchor Frost Obelisks in the scorching hairpins and unleash Rooks, Bishops, and Queens — the road to Malakor’s throne begins here."
      }
    ]
  },
  "level_14": {
    "id": "level_14",
    "levelId": 14,
    "chapter": 3,
    "title": "Obsidian Labyrinth",
    "chapterLabel": "LEVEL 14 • THE CRIMSON CITADEL",
    "unlockLevel": 14,
    "musicMode": "battle",
    "particleTheme": "ember",
    "thumbScene": "scene_level_14",
    "summary": "Twin volcanic chessboard rings spiral around a central magma sanctum where the Ivory King, Queen, and Frost Obelisk hold the high core.",
    "slides": [
      {
        "scene": "scene_level_14",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Inside the outer fortress walls lies the Obsidian Labyrinth — concentric volcanic chess rings suspended over glowing magma chasms that spiral endlessly toward a single raised vault."
      },
      {
        "scene": "scene_level_14",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "CITADEL WATCH",
        "caption": "From every tunnel mouth march relentless obsidian phalanxes and heavy Bastions, winding around the fiery rings to crush whoever dares hold the central stone."
      },
      {
        "scene": "scene_level_14",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "KING ALDRIC OF AETHELGARD",
        "caption": "\"Claim the heart of the maze and turn their own spiral against them!\" At the central dais, the Ivory King and Queen raise a blazing cyan Frost Obelisk amid the volcanic heat."
      },
      {
        "scene": "scene_level_14",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Fortify the central pocket with your King, Queens, Rooks, and Frost Obelisks! Every coiled lane passes beneath your crossfire — break the labyrinth's guard!"
      }
    ]
  },
  "level_15": {
    "id": "level_15",
    "levelId": 15,
    "chapter": 3,
    "title": "Cleric's Conclave",
    "chapterLabel": "LEVEL 15 • THE CRIMSON CITADEL",
    "unlockLevel": 15,
    "musicMode": "battle",
    "particleTheme": "ember",
    "thumbScene": "scene_level_15",
    "summary": "Inside the ash-filled Blighted Cloister, surviving crimson Clerics weave an unbreakable healing chorus until Bishops and Queens shatter their ritual.",
    "slides": [
      {
        "scene": "scene_level_15",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Past the labyrinth yawns the Blighted Cloister — soot-blackened gothic arches choked with drifting volcanic ash where Malyss’s surviving disciples have gathered for a final rite."
      },
      {
        "scene": "scene_level_15",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "THE BLIGHTED CONCLAVE",
        "caption": "Standing shoulder-to-shoulder, rows of hooded Clerics raise crimson lanterns in unison — weaving glowing scarlet webs that render their armored Bastions nearly immortal."
      },
      {
        "scene": "scene_level_15",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "PRELATE SERAPHINA",
        "caption": "\"No false flame endures true dawn!\" Advancing onto the marble dais, the Ivory Queen and her Archbishops aim piercing solar beams straight through the cloister diagonals."
      },
      {
        "scene": "scene_level_15",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Bring piercing Bishops, Frost Obelisks, and concentrated Queen-Rook bursts! Break the Cleric conclave quickly before their synchronized healing outpaces your line."
      }
    ]
  },
  "level_16": {
    "id": "level_16",
    "levelId": 16,
    "chapter": 3,
    "title": "Castle Perimeter",
    "chapterLabel": "LEVEL 16 • THE CRIMSON CITADEL",
    "unlockLevel": 16,
    "musicMode": "battle",
    "particleTheme": "ember",
    "thumbScene": "scene_level_16",
    "summary": "Molten lava moats guard the inner volcanic keep as the Court constructs a layered Rook and Frost Obelisk killbox against a swarming perimeter siege.",
    "slides": [
      {
        "scene": "scene_level_16",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "FORTRESS QUARTERMASTER",
        "caption": "Only the inner keep stands between the Court and Malakor’s throne. A blazing river of molten lava rings the central stronghold, bridged by treacherous outer battlements."
      },
      {
        "scene": "scene_level_16",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "CITADEL WATCH",
        "caption": "Obsidian legions swarm across the outer battlements with ladders and siege fire, racing around the perimeter to force the drawbridge straight into the keep’s heart."
      },
      {
        "scene": "scene_level_16",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "snow",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "MASTER ARTIFICER TORIN",
        "caption": "\"Let them march the perimeter — they’ll meet our killbox at the moat!\" Inside the inner courtyard, layered Ivory Rooks and glowing cyan Frost Obelisks lock onto every causeway."
      },
      {
        "scene": "scene_level_16",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Layer heavy Rooks and Frost Obelisks at the core keep! Crush the perimeter waves before the obsidian host breaks across the throne moat."
      }
    ]
  },
  "level_17": {
    "id": "level_17",
    "levelId": 17,
    "chapter": 3,
    "title": "The Dread March",
    "chapterLabel": "LEVEL 17 • THE CRIMSON CITADEL",
    "unlockLevel": 17,
    "musicMode": "boss",
    "particleTheme": "ember",
    "thumbScene": "scene_level_17",
    "summary": "Beneath blood-red lightning on the staggered caldera battlements, the entire Royal Set and Frost Relics stand united against Malakor's royal guard.",
    "slides": [
      {
        "scene": "scene_level_17",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Crimson lightning tears the ash-choked sky above the volcanic summit. The staggered ramparts climb directly toward Malakor’s citadel — one final ridge before the Throne of Ash."
      },
      {
        "scene": "scene_level_17",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "MALAKOR'S ROYAL GUARD",
        "caption": "Malakor unleashes his personal Warlord guard — an unbroken river of horned titans, Bastions, and Clerics climbing every rank of the mountain in a deafening Dread March."
      },
      {
        "scene": "scene_level_17",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "KING ALDRIC OF AETHELGARD",
        "caption": "\"Pawns, Knights, Bishops, Rooks, Queen, and Relic — stand together!\" Along the upper battlement, the complete Ivory Court locks ranks beside a towering radiant Frost Obelisk."
      },
      {
        "scene": "scene_level_17",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Only complete synergy between Frost Obelisks, Bishops, Rooks, Knights, Queens, and the King can halt the Dread March — break Malakor's guard and claim the summit!"
      }
    ]
  },
  "level_18": {
    "id": "level_18",
    "levelId": 18,
    "chapter": 3,
    "title": "Crown of Ash",
    "chapterLabel": "LEVEL 18 • GRAND FINALE",
    "unlockLevel": 18,
    "musicMode": "boss",
    "particleTheme": "ember",
    "thumbScene": "scene_level_18",
    "summary": "Upon the cracked sixty-fourth square over magma, Malakor the Unbound King descends for the final gambit against the Ivory Sovereign and Relics.",
    "slides": [
      {
        "scene": "scene_level_18",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "At the summit of the world lies the fractured Royal Board suspended above an erupting caldera. Above it swirls the bleeding Crimson Rift — and beneath it waits the final checkmate."
      },
      {
        "scene": "scene_level_18",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "MALAKOR, THE UNBOUND KING",
        "caption": "\"I broke the Board to rule without limit! Come, Ivory Sovereign — show me your final move!\" Malakor steps onto the blazing tiles, his molten crown scorching the air itself."
      },
      {
        "scene": "scene_level_18",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "gold",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "QUEEN ISOLDE & KING ALDRIC",
        "caption": "\"The Accord lives in every square we defended!\" Side by side, the Ivory King and Queen raise radiant golden blades amid glowing cyan Frost Obelisks and promoted Royal defenders."
      },
      {
        "scene": "scene_level_18",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "ember",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "ROYAL VANGUARD DISPATCH",
        "caption": "Marshal every promoted piece and Relic across all twelve siege waves! Break Malakor's Warlord armada, shatter the Crown of Ash, and seal the Rift forever!"
      }
    ]
  },
  "epilogue": {
    "id": "epilogue",
    "levelId": 19,
    "chapter": 3,
    "title": "Checkmate & Dawn",
    "chapterLabel": "EPILOGUE • THE ACCORD RESTORED",
    "unlockLevel": 19,
    "musicMode": "prep",
    "particleTheme": "dawn",
    "thumbScene": "scene_epilogue_1",
    "summary": "Malakor's broken crown cools to stone as golden dawn seals the Crimson Rift and Chess and Relic unite to guard the Sixty-Four Squares.",
    "slides": [
      {
        "scene": "scene_epilogue_1",
        "duration": 7.5,
        "videoStart": 0,
        "particleTheme": "dawn",
        "kb": {
          "s0": 1.02,
          "s1": 1.12,
          "x0": -1.8,
          "x1": 1.6,
          "y0": 0.6,
          "y1": -0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Checkmate. Upon the quiet marble terrace lies Malakor’s shattered Black Crown, its stolen Rift-fire fading to cold dark stone as the last ember drifts away on the morning breeze."
      },
      {
        "scene": "scene_epilogue_1",
        "duration": 7.5,
        "videoStart": 7.4,
        "particleTheme": "dawn",
        "kb": {
          "s0": 1.13,
          "s1": 1.03,
          "x0": 1.8,
          "x1": -1.4,
          "y0": -0.8,
          "y1": 0.8
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "Far across the horizon, the bleeding scar of the Crimson Rift folds shut in a flood of sunrise gold. Warm morning light washes back over the Ivory Ranks and the melting glaciers."
      },
      {
        "scene": "scene_epilogue_1",
        "duration": 7.5,
        "videoStart": 14.8,
        "particleTheme": "dawn",
        "kb": {
          "s0": 1.04,
          "s1": 1.15,
          "x0": -0.6,
          "x1": 1.8,
          "y0": 1.0,
          "y1": -1.2
        },
        "speaker": "KING ALDRIC OF AETHELGARD",
        "caption": "\"Never again shall Aethelgard stand divided.\" Beside the Ivory King and Queen pulses the peaceful blue Frost Obelisk — Chess and Relic bound together in a stronger Accord."
      },
      {
        "scene": "scene_prologue_1",
        "duration": 7.5,
        "videoStart": 22.2,
        "particleTheme": "dawn",
        "kb": {
          "s0": 1.12,
          "s1": 1.02,
          "x0": 1.2,
          "x1": -1.8,
          "y0": -0.6,
          "y1": 0.6
        },
        "speaker": "CHRONICLE OF AETHELGARD",
        "caption": "The Sixty-Four Squares endure in peace, their silent sentinels watchful at the edge of the world. Thank you for defending Aethelgard, Grand Sovereign of TowerDeChess!"
      }
    ]
  }
};

export const CUTSCENE_ORDER = [
  "prologue",
  "level_02",
  "level_03",
  "level_04",
  "level_05",
  "level_06",
  "chapter2",
  "level_08",
  "level_09",
  "level_10",
  "level_11",
  "level_12",
  "chapter3",
  "level_14",
  "level_15",
  "level_16",
  "level_17",
  "level_18",
  "epilogue"
];

export function getCutsceneIdForLevel(levelId) {
  if (levelId === 1) return 'prologue';
  if (levelId === 7) return 'chapter2';
  if (levelId === 13) return 'chapter3';
  const id = `level_${String(levelId).padStart(2, '0')}`;
  return CUTSCENES[id] ? id : 'prologue';
}

export const VILLAINS = [
  {
    id: 'vaelor',
    name: 'Vaelor the Oathbreaker',
    title: 'First Warlord of the Breach',
    chapter: 1,
    bossLevel: 6,
    sprite: 'enemy_warlord',
    scene: 'scene_prologue_2',
    quote: '"Walls built on rules crumble the moment someone stops playing by them."',
    lore: 'Once the proud Obsidian Rook-Captain sworn to guard the border under the Accord of Sixty-Four, Vaelor was the first general to shatter his oath. Leading the vanguard into the Ivory Ranks, he marched straight over the marble watchtowers toward the King’s Citadel.',
    tactic: 'Commands heavy Ironclad Bastions and Blighted Clerics at Level 6. Bring King-buffed Rooks and Bishops to shatter his guard.',
  },
  {
    id: 'malyss',
    name: 'Arch-Cantor Malyss',
    title: 'Matriarch of the Blighted Conclave',
    chapter: 2,
    bossLevel: 12,
    sprite: 'enemy_cleric',
    scene: 'scene_chapter2_1',
    quote: '"Ice preserves the flesh. Rift-fire restores the broken. March forever!"',
    lore: 'A fallen Obsidian Bishop who drank from the frozen Rift-fire at the edge of the world. Malyss twisted sacred restoration into necromantic dark-mending, leading endless columns of healed Bastions across the Glacial Rift toward the Twin Monoliths.',
    tactic: 'Empowers relentless Cleric healing packs across Chapter II. Pair Frost Obelisk chill with piercing Bishops and Queen volleys.',
  },
  {
    id: 'malakor',
    name: 'Malakor, the Unbound King',
    title: 'Architect of the Shattering',
    chapter: 3,
    bossLevel: 18,
    sprite: 'enemy_warlord',
    scene: 'scene_chapter3_1',
    quote: '"I broke the Board to rule without limit. Come, Ivory Sovereign — show me your final move."',
    lore: 'The Obsidian Monarch who shattered his own Black Crown against the Edge of the World, ripping open the Rift beyond the Sixty-Four Squares. His molten crown burns with stolen starlight, and whenever wounded in battle he tears open mini-rifts to summon fresh Footmen directly onto the road.',
    tactic: 'Commands the 12-wave Warlord armada at Level 18 (Crown of Ash). Marshal Tier 3 Queens, Rooks, Bishops, Frost Obelisks, and a central King.',
  },
];

export const CHAPTER_BOSS_BY_LEVEL = {
  6: VILLAINS[0],
  12: VILLAINS[1],
  18: VILLAINS[2],
};

export const ENEMY_LORE = {
  footman: {
    epithet: 'The Forsworn Rank',
    story:
      'Once disciplined obsidian pawns sworn to earn promotion with honor. When Malakor shattered the Accord, their oaths burned to ash — leaving hollow stone soldiers driven forward by crimson Rift-fire behind their visors.',
  },
  lancer: {
    epithet: 'The Bridleless Steeds',
    story:
      'Armored dark warhorses unchained from the sacred L-jump law. Wild, spiked, and blazingly fast, they gallop straight down uncovered lanes to punish any corner left unguarded.',
  },
  bastion: {
    epithet: 'The Hollow Keeps',
    story:
      'Living wreckage of shattered Obsidian Rooks forged into stomping siege golems. Their molten-veined iron plates shrug off nearly half of all strikes unless sundered by Bishops or shelled by Rooks.',
  },
  cleric: {
    epithet: 'The Rift Cantors',
    story:
      'Disciples of Arch-Cantor Malyss carrying ember lanterns of corrupted light. Too fragile to breach alone, they chant dark litanies that knit cracked obsidian armor back together mid-march.',
  },
  warlord: {
    epithet: 'The Crowned Breakers',
    story:
      'Malakor’s dread lieutenants — massive sovereign knights wielding Rift-forged greatswords. Resistant to glacial chill, they rip open a fracture at half health to summon four fresh Footmen directly onto the board.',
  },
};

export const LEVEL_DISPATCHES = {
  1: 'Night falls over the Opening Rank. With the Court scattered, lone ivory Pawns brace their spears against the first breach.',
  2: 'Scouts report bridless Shadow Chargers racing down the Twin Hairpins — the Royal Cavalry rides to intercept them.',
  3: 'Blighted Clerics emerge from the mist along the Sunbeam Staircase. Only the Bishops’ piercing rays can cleave their dark chants.',
  4: 'Vaelor’s siege rams approach the outer fortress walls. The Ivory Rooks roll their bronze culverins onto the Grand Straightaways.',
  5: 'The obsidian host encircles the Royal Spiral Court — the Queen steps forth to reclaim all eight compass lines.',
  6: 'Vaelor the Oathbreaker storms the Sovereign Courtyard! The Ivory King takes the field to rally every defender.',
  7: 'Crossing into the frozen fracture beyond the sixty-four squares, your Court awakens a slumbering pre-Accord Frost Obelisk.',
  8: 'Blizzards howl across the Frozen Switchback as Malyss’s vanguard tries to outrun your chilling glacial chokepoints.',
  9: 'Twin frost canyons echo with obsidian hooves — Knights leap between icy ridges to break the Charger stampede.',
  10: 'Sunlight refracts across the Prism Staircase, giving Bishops and Queens clean sightlines through Malyss’s iron columns.',
  11: 'Shattered keeps fortify the Iron Ramparts. Steady artillery volleys must hold the perimeter trenches.',
  12: 'Arch-Cantor Malyss unveils her full legion at the Twin Monoliths — shatter her healing host to breach the Crimson border!',
  13: 'Ash rains from a blood-red sky as your Court enters the Ember Gauntlet, the outer throat of Malakor’s dominion.',
  14: 'Twin obsidian rings spiral around a volcanic vault — hold the inner sanctum against relentless armored coils.',
  15: 'Inside the Blighted Cloister, Malyss’s surviving cantors chant in unison to make their Bastions nearly immortal.',
  16: 'Lava moats surround the inner fortress keep. Hold the outer battlements before the breach reaches the throne moat.',
  17: 'Malakor marshals his royal guard across the Shattered Battlements in a final bid to crush your advance.',
  18: 'The Throne of Ash stands before you. Malakor the Unbound King descends — deliver checkmate and seal the Rift forever!',
};
