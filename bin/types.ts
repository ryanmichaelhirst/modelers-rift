/**
 * Components
 */
export interface SelectOption {
  label: string
  value: string
}

/**
 * DDragon
 */
export interface Item {
  colloq: string
  depth?: number
  description: string
  gold: {
    base: number
    purchasable: boolean
    total: number
    sell: number
  }
  image: {
    full: string
    sprite: string
    group: string
    h: number
    w: number
    x: number
    y: number
  }
  into?: string[]
  from?: string[]
  maps: Record<number, boolean>
  name: string
  plaintext: string
  stats: Record<string, number>
  tags: string[]
}

interface DataDragonImage {
  full?: string
  h?: number
  w?: number
  group?: string
  x?: number
  y?: number
  sprite?: string
}

export interface Passive {
  image?: DataDragonImage
  description?: string
  name?: string
}

export interface Spell extends Passive {
  cooldown?: number[]
  cooldownBurn?: string
  cost?: number[]
  costBurn?: string
  costType?: string
  datavalues?: Record<string, unknown>
  effect?: unknown[]
  effectBurn?: (null | string)[]
  id?: string
  leveltip?: Record<string, unknown>
  maxammo?: string
  maxrank?: number
  range?: number[]
  rangeBurn?: string
  resource?: string
  tooltip?: string
}

interface ChampionStats {
  armor?: number
  armorperlevel?: number
  attackdamage?: number
  attackdamageperlevel?: number
  attackrange?: number
  attackspeed?: number
  attackspeedperlevel?: number
  crit?: number
  critperlevel?: number
  hp?: number
  hpperlevel?: number
  hpregen?: number
  hpregenperlevel?: number
  movespeed?: number
  mp?: number
  mpperlevel?: number
  mpregen?: number
  mpregenperlevel?: number
  spellblock?: number
  spellblockperlevel?: number
}

export type ChampionStatsKey = keyof ChampionStats

export interface ChampionBasicInfo {
  blurb?: string
  id?: string
  image?: DataDragonImage
  info?: Record<string, number>
  key?: string
  name?: string
  partype?: string
  square_asset?: string
  stats?: ChampionStats
  tags?: string[]
  title?: string
  version?: string
}

export type ChampionDetailedInfo = Omit<ChampionBasicInfo, "square_asset" | "version"> & {
  ally_tips?: string[]
  enemy_tips?: string[]
  lore?: string
  passive?: Passive
  recommended?: string[]
  skins?: { chromas?: boolean; id?: string; name?: string; num?: number }[]
  spells?: Spell[]
}
