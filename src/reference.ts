import spells14 from './data/dndsu/spells2014.json'
import homebrew14 from './data/dndsu/spells2014-homebrew.json'
import spells24 from './data/dndsu/spells2024.json'
import spellAliases from './data/dndsu/spell-aliases.json'
import subclasses14 from './data/dndsu/subclasses2014.json'
import subclasses24 from './data/dndsu/subclasses2024.json'
import origins14 from './data/dndsu/origins2014.json'
import origins24 from './data/dndsu/origins2024.json'
import items14 from './data/dndsu/items2014.json'
import items24 from './data/dndsu/items2024.json'
import artificer14 from './data/dndsu/artificer2014.json'
import artificer24 from './data/dndsu/artificer2024.json'
import extraClasses from './data/dndsu/classes-index.json'
import type { Ability, Edition, Option, Skill } from './catalog'

export type ContentMode = 'srd' | 'official' | 'all'
export type ReferenceEntry = {
  id:string; name:string; ru:string; url:string; source?:string; sourceGroup?:string; sourceId?:number;
  category?:string; kind?:string; edition?:Edition; group?:string; unofficial?:boolean; homebrew?:boolean; ua?:boolean; referenceOnly?:boolean
}
export type ReferenceSpell = ReferenceEntry & { level:number; classes:string[]; optionalClasses?:string[]; school?:string; ritual?:boolean; concentration?:boolean; subclassIds?:number[] }
export type SubclassFeature = { name:string; detail?:string; spellIds?:string[]; spellMode?:string }
export type ReferenceSubclass = ReferenceEntry & {
  classId:string; features?:Partial<Record<string,SubclassFeature[]>>; pageId?:number; subclassId?:number; dndsuId?:number; numericId?:number
}
export type ReferenceSpecies = ReferenceEntry & {
  speed?:number; size?:string; languageCount?:number; hpPerLevel?:number; profs?:string[]; skills?:Skill[]; skillCount?:number; featChoice?:boolean;
  abilityBoost?:{count:number;amount:number;exclude?:Ability[]}; abilityPatterns?:number[][]; innateSpells?:{id:string;level:number;ability:Ability}[]; traits?:string[]; bonuses?:Partial<Record<Ability,number>>; languages?:string[]; lineages?:Option[];
}
export type ReferenceBackground = ReferenceEntry & {
  skills?:Skill[]; scores?:Ability[]; feat?:string; featCategory?:string; tool?:string; tools?:string[]; gold?:number; cashGold?:number; items?:string[]; languageCount?:number; feature?:string; trait?:string;
}
export type ReferenceFeat = ReferenceEntry & { prerequisite?:string; minimumLevel?:number; abilityOptions?:Ability[]; requirementTags?:string[]; category?:string }
export type ReferenceItem = ReferenceEntry & { rarity?:string; attunement?:boolean; cost?:number|string; damage?:string; ac?:number|string; mastery?:string; properties?:string; category?:string }
type Origins = { species:ReferenceSpecies[]; backgrounds:ReferenceBackground[]; feats:ReferenceFeat[] }
type Reference = Origins & { spells:ReferenceSpell[]; subclasses:ReferenceSubclass[]; items:ReferenceItem[]; classes:ReferenceEntry[] }

export const normalizeName = (name:string) => name.toLowerCase().replace(/ё/g,'е').normalize('NFKD').replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim()
const extra = extraClasses as ReferenceEntry[]
const suffixes = /homebrew|\bhb\b|\bwow\b|\bsetting\b|неофициал|самодел|unearthed arcana|playtest|партн[её]р|partnered|third.party|warcraft|warlock.htmt|\bua\b|\bhtmt\b|обитель льда/i
export const isUnofficial = (entry:ReferenceEntry) => !!(entry.unofficial || entry.homebrew || entry.ua || /\/homebrew\//i.test(entry.url) ||
  suffixes.test([entry.source,entry.sourceGroup,entry.category,entry.group].join(' ')) || entry.id.startsWith('wow-'))
export const inMode = (entry:ReferenceEntry,mode:ContentMode) => mode==='all' || mode==='official'&&!isUnofficial(entry)

export const reference:Record<Edition,Reference> = {
  '2014':{...origins14 as Origins,spells:[...spells14,...homebrew14],subclasses:subclasses14 as ReferenceSubclass[],items:items14 as ReferenceItem[],classes:extra.filter(entry=>String(entry.edition)==='2014')},
  '2024':{...origins24 as Origins,spells:spells24,subclasses:subclasses24 as ReferenceSubclass[],items:items24 as ReferenceItem[],classes:extra.filter(entry=>String(entry.edition)==='2024')},
}
const aliases = spellAliases as Record<string,string>
const reverse = Object.fromEntries(Object.entries(aliases).map(([srd,ref])=>[ref,srd]))
export const spellIdFor = (id:string) => reverse[id]??id
export const referenceIdFor = (id:string) => aliases[id]??id
export const artificerRevision = artificer24
export const artificerLegacy = artificer14
export function displaySource(entry:{source?:string;sourceGroup?:string;url?:string}) {
  return entry.source??entry.sourceGroup??(entry.url?'dnd.su':'SRD')
}
export function numericPageId(url:string|undefined) {
  return Number(url?.match(/\/(\d+)-[^/]+\/?$/)?.[1])||0
}
