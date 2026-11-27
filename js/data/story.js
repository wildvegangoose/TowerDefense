/**
 * Narrative Lore, Villains, Enemy Bestiary, Level Dispatches & Motion-Comic Cutscenes
 * for TowerDeChess: "The Shattered Gambit".
 */

export const CUTSCENES = {
  prologue: {
    id: 'prologue',
    title: 'The Shattered Gambit',
    chapterLabel: 'PROLOGUE • CHAPTER I',
    unlockLevel: 1,
    musicSuiteIndex: 0, // March of the Ivory Crown
    musicMode: 'prep',
    particleTheme: 'gold',
    thumbScene: 'scene_prologue_1',
    summary: 'How the Accord of Sixty-Four fell when Malakor shattered his Black Crown.',
    slides: [
      {
        scene: 'scene_prologue_1',
        duration: 7.5,
        particleTheme: 'gold',
        kb: { s0: 1.02, s1: 1.12, x0: -1.5, x1: 1.5, y0: 0.5, y1: -1.0 },
        speaker: 'CHRONICLE OF AETHELGARD',
        caption:
          'For a thousand winters, Aethelgard endured under the Accord of Sixty-Four — an ancient pact binding Ivory and Obsidian to the Sacred Laws of the Board.',
      },
      {
        scene: 'scene_prologue_2',
        duration: 8.5,
        particleTheme: 'ember',
        kb: { s0: 1.12, s1: 1.02, x0: 1.5, x1: -1.5, y0: -1.0, y1: 1.0 },
        speaker: 'MALAKOR, THE UNBOUND KING',
        caption:
          '"No sovereign kneels to sixty-four squares!" Shattering his Black Crown at the edge of the world, Malakor tore open the Rift — unleashing an army bound by no rule of chess.',
      },
      {
        scene: 'scene_prologue_1',
        duration: 7.0,
        particleTheme: 'gold',
        kb: { s0: 1.06, s1: 1.14, x0: 0, x1: -2.0, y0: 1.0, y1: -0.5 },
        speaker: 'ROYAL VANGUARD DISPATCH',
        caption:
          'The Court is scattered across the Ivory Ranks. Only a line of humble Pawns remains to hold the first bastion — rally the Royal Set before the Citadel Gate falls!',
      },
    ],
  },

  chapter2: {
    id: 'chapter2',
    title: 'Beyond the Sixty-Four',
    chapterLabel: 'CHAPTER II • THE GLACIAL RIFT',
    unlockLevel: 7,
    musicSuiteIndex: 1, // Nocturne of the Obsidian Rift
    musicMode: 'prep',
    particleTheme: 'snow',
    thumbScene: 'scene_chapter2_1',
    summary: 'Marching into the frozen fracture and awakening the ancient Frost Obelisk.',
    slides: [
      {
        scene: 'scene_chapter2_1',
        duration: 8.0,
        particleTheme: 'snow',
        kb: { s0: 1.03, s1: 1.13, x0: -2.0, x1: 1.5, y0: 0, y1: -1.0 },
        speaker: 'ARCH-CANTOR MALYSS',
        caption:
          'Vaelor has fallen, yet the northern frontier cracks open into an abyss of ice. Through the blizzard marches Arch-Cantor Malyss, her ember-lantern knitting broken obsidian back to life.',
      },
      {
        scene: 'scene_chapter2_2',
        duration: 8.5,
        particleTheme: 'snow',
        kb: { s0: 1.1, s1: 1.02, x0: 1.5, x1: -1.0, y0: 1.0, y1: -1.0 },
        speaker: 'RELIC AWAKENED',
        caption:
          'Against foes who defy the rules of chess, the Accord alone is not enough. Beneath the glacier, your Court unearths the Frost Obelisk — a forbidden Relic forged before the Board existed.',
      },
    ],
  },

  chapter3: {
    id: 'chapter3',
    title: 'Crown of Ash',
    chapterLabel: 'CHAPTER III • THE CRIMSON CITADEL',
    unlockLevel: 13,
    musicSuiteIndex: 2, // Siege of the Crimson Citadel
    musicMode: 'boss',
    particleTheme: 'ember',
    thumbScene: 'scene_chapter3_1',
    summary: 'Crossing the edge of the world to storm Malakor’s volcanic fortress.',
    slides: [
      {
        scene: 'scene_chapter3_1',
        duration: 8.5,
        particleTheme: 'ember',
        kb: { s0: 1.02, s1: 1.14, x0: -2.0, x1: 2.0, y0: 0.5, y1: -1.5 },
        speaker: 'MALAKOR, THE UNBOUND KING',
        caption:
          'The Glacial Rift lies behind you. Ahead rises the Crimson Citadel — charred obsidian squares veined with magma, where Malakor awaits upon the Throne of Ash for a final gambit.',
      },
    ],
  },

  epilogue: {
    id: 'epilogue',
    title: 'Checkmate & Dawn',
    chapterLabel: 'EPILOGUE • THE ACCORD RESTORED',
    unlockLevel: 19, // Unlocked upon conquering Level 18
    musicSuiteIndex: 0,
    musicMode: 'prep',
    particleTheme: 'dawn',
    thumbScene: 'scene_epilogue_1',
    summary: 'Malakor’s broken crown goes cold as golden dawn seals the Rift.',
    slides: [
      {
        scene: 'scene_epilogue_1',
        duration: 9.0,
        particleTheme: 'dawn',
        kb: { s0: 1.08, s1: 1.01, x0: 0, x1: 0, y0: 1.2, y1: -0.8 },
        speaker: 'CHRONICLE OF AETHELGARD',
        caption:
          'Checkmate. The Unbound Crown lies cold upon sunlit marble as the Crimson Rift seals on the horizon. Chess and Relic now stand united — guardians of the Sixty-Four Squares.',
      },
    ],
  },
};

export const CUTSCENE_ORDER = ['prologue', 'chapter2', 'chapter3', 'epilogue'];

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
