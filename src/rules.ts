import beasts from './data/beasts2024.json'
import featureRu from './data/features-ru.json'
import {
  abilities, abilityName, artisanTools, catalogs, fixedPackages, games, goldDice14, fighterPack24, instruments, itemLabel,
  languages14, languages24, packageLabel, skillAbility, skillIds, skillNames, slug, spellLabel, weaponGroups,
  type Ability, type Catalog, type ClassInfo, type Edition, type Option, type Package, type Progress, type Skill, type Spell,
} from './catalog'

export type Choice = { id:string; name:string; count:number; options:Option[]; value:string[]; optional?:boolean }
export type Issue = { step:number; message:string }
export type Level = { classId:string; choices:Record<string,string[]>; hpRoll?:number; hpMode?:'fixed'|'roll' }
export type Gear = { id:string; name?:string; quantity:number; price?:number }
export type Draft = {
  id:string; schema:1; rules:string; edition:Edition; target:number; step:string; updated:number;
  options:{ feats:boolean; multiclass:boolean };
  species:string; background:string; origin:Record<string,string[]>;
  method:'array'|'points'|'roll'; base:number[]; rolls:number[];
  levels:Level[]; name:string; portrait:string; appearance:string; story:string; bonds:string; goals:string; alignment:string;
  bonusGear:Gear[]; bonusGold:number; otherCoins:{cp:number;sp:number;ep:number;pp:number}; armor:string; shield:boolean; spentGold:number;
}
export type Feature = {name:string; detail?:string; source:string; level?:number}
export type MagicSource = {name:string; ability:Ability; dc:number; attack:number; spells:{spell:Spell; status:string}[]}
export type Attack = {name:string; bonus:number; damage:string; detail?:string}

export const STANDARD = [15, 14, 13, 12, 10, 8]
export const POINT_COSTS = [0,1,2,3,4,5,7,9]
const XP = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000]
const FULL_SLOTS = [
  [],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],
  [4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]
const HALF = ['paladin','ranger']
export const modifier = (score:number) => Math.floor((score - 10) / 2)
export const rollDie = (die:number, random=Math.random) => 1 + Math.floor(random() * die)
export const rollScores = (random=Math.random) => Array.from({length:6},()=>Array.from({length:4},()=>rollDie(6,random)).sort((a,b)=>b-a).slice(0,3).reduce((sum,value)=>sum+value,0))
export const pointCost = (scores:number[]) => scores.reduce((sum,score)=>sum+(POINT_COSTS[score-8]??Infinity),0)
export const sign = (n:number) => n>=0 ? '+'+n : String(n)
export function createDraft(edition:Edition):Draft {
  return {id:globalThis.crypto.randomUUID(),schema:1,rules:edition==='2014'?'5.1':'5.2.1',edition,target:1,step:'setup',updated:Date.now(),
    options:{feats:edition==='2024',multiclass:edition==='2024'},species:'',background:'',origin:{},method:'array',base:[],rolls:[],levels:[],
    name:'',portrait:'',appearance:'',story:'',bonds:'',goals:'',alignment:'',bonusGear:[],bonusGold:0,otherCoins:{cp:0,sp:0,ep:0,pp:0},spentGold:0,armor:'auto',shield:true}
}
export const equipmentProfs:Record<string,string> = {light:'Лёгкие доспехи',medium:'Средние доспехи',heavy:'Тяжёлые доспехи',shield:'Щиты',simple:'Простое оружие',martial:'Воинское оружие',monk:'Оружие монаха',rogue:'Лёгкое и фехтовальное воинское оружие',thieves:'Воровские инструменты',instrument:'Музыкальный инструмент'}
const translations = new Map(Object.entries({
  'Rage':'Ярость','Unarmored Defense':'Защита без доспехов','Danger Sense':'Чувство опасности','Reckless Attack':'Безрассудная атака',
  'Extra Attack':'Дополнительная атака','Fast Movement':'Быстрое передвижение','Feral Instinct':'Дикий инстинкт',
  'Spellcasting':'Использование заклинаний','Pact Magic':'Магия договора','Bardic Inspiration':'Вдохновение барда','Jack of All Trades':'Мастер на все руки',
  'Expertise':'Компетентность','Magical Secrets':'Тайны магии','Divine Domain':'Божественный домен','Divine Order':'Божественный орден','Channel Divinity':'Божественный канал',
  'Divine Intervention':'Божественное вмешательство','Wild Shape':'Дикий облик','Primal Order':'Первобытный орден',
  'Fighting Style':'Боевой стиль','Second Wind':'Второе дыхание','Action Surge':'Всплеск действий','Weapon Mastery':'Мастерство оружия',
  'Martial Arts':'Боевые искусства','Ki':'Ци','Monk’s Focus':'Сосредоточение монаха','Unarmored Movement':'Движение без доспехов',
  'Lay on Hands':'Наложение рук','Divine Sense':'Божественное чувство','Divine Smite':'Божественная кара',
  'Favored Enemy':'Избранный враг','Favored Foe':'Избранный противник','Natural Explorer':'Природный исследователь','Deft Explorer':'Умелый исследователь',
  'Sneak Attack':'Скрытая атака','Thieves’ Cant':'Воровской жаргон','Cunning Action':'Хитрое действие','Uncanny Dodge':'Невероятное уклонение',
  'Evasion':'Увёртливость','Reliable Talent':'Надёжный талант','Font of Magic':'Источник магии','Metamagic':'Метамагия','Innate Sorcery':'Врождённое чародейство',
  'Otherworldly Patron':'Потусторонний покровитель','Eldritch Invocations':'Таинственные воззвания','Pact Boon':'Дар договора','Mystic Arcanum':'Таинственный арканум',
  'Arcane Recovery':'Магическое восстановление','Ritual Adept':'Знаток ритуалов','Spell Mastery':'Мастерство заклинаний','Signature Spells':'Фирменные заклинания',
  'Ability Score Improvement':'Повышение характеристик','Epic Boon':'Эпический дар','Alert':'Бдительный','Savage Attacker':'Свирепый атакующий',
  'Grappler':'Борец','Skilled':'Умелый','Magic Initiate':'Посвящённый в магию','Archery':'Стрельба','Defense':'Оборона','Dueling':'Дуэлянт',
  'Great Weapon Fighting':'Сражение большим оружием','Two-Weapon Fighting':'Бой двумя оружиями','Protection':'Защита','Superior Critical':'Улучшенный критический удар',
  'Improved Critical':'Улучшенный критический удар','Survivor':'Выживший','Indomitable':'Несгибаемый','Tactical Mind':'Тактический ум',
  'Pact of the Blade':'Договор клинка','Pact of the Chain':'Договор цепи','Pact of the Tome':'Договор гримуара',
}))
export function featureLabel(name:string) {
  const translated = (featureRu as Record<string,string>)[name]
  if (translated) return translated
  const bare = name.replace(/\s+\(.*$/, '')
  return translations.has(bare) ? translations.get(bare)+name.slice(bare.length) : name
}
const opt = (id:string,name=id,description?:string):Option => ({id,name,description})
const formatSkills = (ids:Skill[]) => ids.map(id=>opt(id,skillNames[id]))
const abilityOptions = abilities.map(id=>opt(id,abilityName[id]))
const lookup = (values:Option[],id:string) => values.find(value=>value.id===id)
const only = (ids:string[]) => ids.map(id=>opt(id))
const uniq = <T,>(values:T[]) => [...new Set(values)]
const sum = (values:number[]) => values.reduce((a,b)=>a+b,0)
const samePool = (a:number[],b:number[]) => a.length===b.length && [...a].sort((x,y)=>x-y).every((x,index)=>x===[...b].sort((y,z)=>y-z)[index])
const featNames:Record<string,string> = { alert:'Бдительный','savage-attacker':'Свирепый атакующий',skilled:'Умелый','magic-initiate':'Посвящённый в магию',grappler:'Борец','initiate-cleric':'Посвящённый в магию жреца','initiate-druid':'Посвящённый в магию друида','initiate-wizard':'Посвящённый в магию волшебника' }
const schoolLevel = (spell:Spell) => spell.level === 0 ? 'Заговор' : 'Уровень '+spell.level
const spellOpts = (spells:Spell[]) => spells.map(spell=>opt(spell.id,spellLabel(spell),schoolLevel(spell)+(spell.school?' · '+spell.school:'')))
const familiar24 = ['Find Familiar']
const subclassSpellLists:Record<Edition,Record<string,Record<number,string[]>>> = {
  '2014':{
    cleric:{1:['bless','cure-wounds'],3:['lesser-restoration','spiritual-weapon'],5:['beacon-of-hope','revivify'],7:['death-ward','freedom-of-movement'],9:['mass-cure-wounds','raise-dead']},
    paladin:{3:['protection-from-evil-and-good','sanctuary'],5:['lesser-restoration','zone-of-truth'],9:['beacon-of-hope','dispel-magic'],13:['freedom-of-movement','guardian-of-faith'],17:['commune','flame-strike']},
  },
  '2024':{
    cleric:{3:['aid','bless','cure-wounds','lesser-restoration'],5:['mass-healing-word','revivify'],7:['aura-of-life','death-ward'],9:['greater-restoration','mass-cure-wounds']},
    paladin:{3:['protection-from-evil-and-good','shield-of-faith'],5:['aid','zone-of-truth'],9:['beacon-of-hope','dispel-magic'],13:['freedom-of-movement','guardian-of-faith'],17:['commune','flame-strike']},
    sorcerer:{3:['alter-self','chromatic-orb','command','dragons-breath'],5:['fear','fly'],7:['arcane-eye','charm-monster'],9:['legend-lore','summon-dragon']},
    warlock:{3:['burning-hands','command','scorching-ray','suggestion'],5:['fireball','stinking-cloud'],7:['fire-shield','wall-of-fire'],9:['geas','insect-plague']},
  },
}
const druidLand14:Record<string,string[][]> = {
  Арктика:[['hold-person','spike-growth'],['sleet-storm','slow'],['freedom-of-movement','ice-storm'],['commune-with-nature','cone-of-cold']],
  Побережье:[['mirror-image','misty-step'],['water-breathing','water-walk'],['control-water','freedom-of-movement'],['conjure-elemental','scrying']],
  Пустыня:[['blur','silence'],['create-food-and-water','protection-from-energy'],['blight','hallucinatory-terrain'],['insect-plague','wall-of-stone']],
  Лес:[['barkskin','spider-climb'],['call-lightning','plant-growth'],['divination','freedom-of-movement'],['commune-with-nature','tree-stride']],
  Луга:[['invisibility','pass-without-trace'],['daylight','haste'],['divination','freedom-of-movement'],['dream','insect-plague']],
  Горы:[['spider-climb','spike-growth'],['lightning-bolt','meld-into-stone'],['stone-shape','stoneskin'],['passwall','wall-of-stone']],
  Болото:[['darkness','acid-arrow'],['water-walk','stinking-cloud'],['freedom-of-movement','locate-creature'],['insect-plague','scrying']],
  Подземье:[['spider-climb','web'],['gaseous-form','stinking-cloud'],['greater-invisibility','stone-shape'],['cloudkill','insect-plague']],
}
const druidLand24:Record<string,string[][]> = {
  Засушливая:[['blur','burning-hands','fire-bolt'],['fireball'],['blight'],['wall-of-stone']],
  Полярная:[['fog-cloud','hold-person','ray-of-frost'],['sleet-storm'],['ice-storm'],['cone-of-cold']],
  Умеренная:[['misty-step','shocking-grasp','sleep'],['lightning-bolt'],['freedom-of-movement'],['tree-stride']],
  Тропическая:[['acid-splash','ray-of-sickness','web'],['stinking-cloud'],['polymorph'],['insect-plague']],
}
function statsMap(values:number[]) {
  return Object.fromEntries(abilities.map((id,i)=>[id,values[i]??10])) as Record<Ability,number>
}
export function multiclassRequirements(current:ClassInfo, next:ClassInfo, scores:Record<Ability,number>) {
  const unmet = (cls:ClassInfo) => {
    if(cls.id==='fighter') return scores.str>=13 || scores.dex>=13 ? [] : ['Сила или Ловкость 13']
    return cls.primary.filter(id=>scores[id]<13).map(id=>abilityName[id]+' 13')
  }
  return uniq([...unmet(current),...unmet(next)])
}

function progress(catalog:Catalog, edition:Edition, id:string, level:number):Progress {
  const row = catalog.progressions[id]?.[String(level)]
  if(row&&!Array.isArray(row)) return row
  if(edition==='2024'||!row) return {}
  const vals = row.map(x=>Number(x)||0)
  if(id==='warlock') return {cantrips:vals[0],known:vals[1],pactSlots:vals[2],pactLevel:vals[3],invocations:vals[4]}
  if(id==='bard'||id==='sorcerer') {
    const offset=id==='sorcerer'?1:0
    return {cantrips:vals[offset],known:vals[offset+1],slots:vals.slice(offset+2)}
  }
  if(id==='ranger') return {known:vals[0],slots:vals.slice(1)}
  if(id==='paladin') return {slots:vals}
  if(['cleric','druid','wizard'].includes(id)) return {cantrips:vals[0],slots:vals.slice(1)}
  return {}
}
const strictFirst = (edition:Edition) => edition==='2014'
function expandPackage(values:string[]) {
  const expanded:Gear[] = []
  for (const value of values) {
    if (fixedPackages[value]) { expanded.push(...expandPackage(fixedPackages[value])); continue }
    const [id,count] = value.split('*')
    expanded.push({id,quantity:Number(count)||1})
  }
  return expanded
}
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value))
const choiceFeatures:Record<string,Option[]> = {
  'fighting-style': ['Archery','Defense','Dueling','Great Weapon Fighting','Protection','Two-Weapon Fighting'].map(name=>opt(slug(name),featureLabel(name))),
  'divine-order':[opt('protector','Защитник','Воинское оружие и тяжёлые доспехи.'),opt('thaumaturge','Чудотворец','Дополнительный заговор жреца и бонус к проверкам Магии и Религии.')],
  'primal-order':[opt('warden','Страж','Воинское оружие и средние доспехи.'),opt('magician','Чародей природы','Дополнительный заговор друида и бонус к проверкам Магии и Природы.')],
  'metamagic': ['Careful Spell','Distant Spell','Empowered Spell','Extended Spell','Heightened Spell','Quickened Spell','Seeking Spell','Subtle Spell','Transmuted Spell','Twinned Spell'].map(name=>opt(slug(name),({'Careful Spell':'Осторожное заклинание','Distant Spell':'Далёкое заклинание','Empowered Spell':'Усиленное заклинание','Extended Spell':'Продлённое заклинание','Heightened Spell':'Обострённое заклинание','Quickened Spell':'Ускоренное заклинание','Seeking Spell':'Ищущее заклинание','Subtle Spell':'Неуловимое заклинание','Transmuted Spell':'Преобразованное заклинание','Twinned Spell':'Удвоенное заклинание'} as Record<string,string>)[name])),
  'pact-boon':['Pact of the Blade','Pact of the Chain','Pact of the Tome'].map(name=>opt(slug(name),featureLabel(name))),
  'element':['Кислота','Холод','Огонь','Электричество','Яд'].map(name=>opt(name)),
  'hunter-prey':['Colossus Slayer','Horde Breaker','Giant Killer'].map((name,i)=>opt(slug(name),['Убийца колоссов','Сокрушитель орд','Убийца великанов'][i])),
  'defensive-tactics':['Escape the Horde','Multiattack Defense','Steel Will','Hunter’s Evasion','Uncanny Dodge'].map((name,i)=>opt(slug(name),['Уход от орды','Защита от мультиатаки','Стальная воля','Уклонение охотника','Невероятное уклонение'][i])),
}
const invocationReq:Record<string,number> = {'agonizing-blast':2,'armor-of-shadows':1,'ascendant-step':5,'eldritch-mind':1,'devils-sight':2,'eldritch-sight':1,'eldritch-spear':2,'fiendish-vigor':2,'gaze-of-two-minds':5,'lifedrinker':9,'mask-of-many-faces':2,'master-of-myriad-forms':5,'misty-visions':2,'one-with-shadows':5,'otherworldly-leap':2,'repelling-blast':2,'thirsting-blade':5,'devouring-blade':12,'visions-of-distant-realms':9,'whispers-of-the-grave':7,'witch-sight':15,'gift-of-the-depths':5,'gift-of-the-protectors':9,'lessons-of-the-first-ones':2}
const invocations14 = ['Agonizing Blast','Armor of Shadows','Ascendant Step','Beast Speech','Beguiling Influence','Bewitching Whispers','Book of Ancient Secrets','Chains of Carceri','Devil’s Sight','Dreadful Word','Eldritch Sight','Eldritch Spear','Eyes of the Rune Keeper','Fiendish Vigor','Gaze of Two Minds','Lifedrinker','Mask of Many Faces','Master of Myriad Forms','Minions of Chaos','Mire the Mind','Misty Visions','One with Shadows','Otherworldly Leap','Repelling Blast','Sculptor of Flesh','Sign of Ill Omen','Thief of Five Fates','Thirsting Blade','Visions of Distant Realms','Voice of the Chain Master','Whispers of the Grave','Witch Sight']
const invocations24 = ['Agonizing Blast','Armor of Shadows','Ascendant Step','Devil’s Sight','Devouring Blade','Eldritch Mind','Eldritch Smite','Eldritch Spear','Fiendish Vigor','Gaze of Two Minds','Gift of the Depths','Gift of the Protectors','Investment of the Chain Master','Lessons of the First Ones','Lifedrinker','Mask of Many Faces','Master of Myriad Forms','Misty Visions','One with Shadows','Otherworldly Leap','Pact of the Blade','Pact of the Chain','Pact of the Tome','Repelling Blast','Thirsting Blade','Visions of Distant Realms','Whispers of the Grave','Witch Sight']
const oldInvocationMin:Record<string,number> = {'ascendant-step':9,'bewitching-whispers':7,'chains-of-carceri':15,'dreadful-word':7,lifedrinker:12,'master-of-myriad-forms':15,'minions-of-chaos':9,'mire-the-mind':5,'one-with-shadows':5,'otherworldly-leap':9,'sculptor-of-flesh':7,'sign-of-ill-omen':5,'thirsting-blade':5,'visions-of-distant-realms':15,'whispers-of-the-grave':9,'witch-sight':15}
const trimSlots = (slots:number[] = []) => slots.slice(0,slots.reduce((last,slot,index)=>slot>0?index+1:last,0))

export function derive(draft:Draft) {
  const catalog = catalogs[draft.edition]
  const old = strictFirst(draft.edition)
  const target = clamp(draft.target,1,20)
  const species = lookup(catalog.species,draft.species) as typeof catalog.species[number] | undefined
  const background = lookup(catalog.backgrounds,draft.background) as typeof catalog.backgrounds[number] | undefined
  const issues:Issue[] = []
  const choices:Record<number,Choice[]> = {}
  const gained:Record<number,Feature[]> = {}
  const choicesFor = (step:number, stored:Record<string,string[]>) => (id:string,name:string,count:number,options:Option[],fallback?:string[],optional=false) => {
    if(count===0 || options.length===0) return []
    const valid = uniq((stored[id]??fallback??[]).filter(value=>options.some(option=>option.id===value))).slice(0,count)
    const entry = {id,name,count,options,value:valid,optional}
    ;(choices[step]??=[]).push(entry)
    if(!optional && valid.length!==count) issues.push({step,message:name+' — осталось выбрать '+(count-valid.length)})
    return valid
  }
  const origin = choicesFor(0,draft.origin)
  const values = draft.base.length===6 ? statsMap(draft.base) : statsMap(STANDARD)
  if (!species) issues.push({step:0,message:old?'Выберите народ':'Выберите вид'})
  if (!background) issues.push({step:0,message:'Выберите предысторию'})
  if (!draft.levels[0]?.classId) issues.push({step:0,message:'Выберите начальный класс'})
  if (draft.base.length!==6 || (draft.method==='points' ? pointCost(draft.base)>27 : !samePool(draft.base,draft.method==='roll'?draft.rolls:STANDARD))) issues.push({step:-1,message:'Распределите шесть характеристик'})
  const boosts = choicesFor(-1,draft.origin)
  if (species?.bonuses) for(const stat of abilities) values[stat]+=species.bonuses[stat]??0
  if(species?.id==='half-elf') for(const id of boosts('half-elf-boost','Прибавки полуэльфа',2,abilityOptions.filter(option=>option.id!=='cha')) as Ability[]) values[id]++
  if(background?.scores.length) {
    const method = boosts('boost-method','Бонусы предыстории',1,[opt('2-1','+2 и +1'),opt('1-1-1','+1, +1 и +1')],['2-1'])[0]
    if(method==='1-1-1') for(const id of background.scores) values[id]++
    if(method==='2-1') {
      const first = boosts('boost-2','Характеристика +2',1,abilityOptions.filter(option=>background.scores.includes(option.id as Ability)))[0] as Ability|undefined
      const second = boosts('boost-1','Характеристика +1',1,abilityOptions.filter(option=>option.id!==first&&background.scores.includes(option.id as Ability)))[0] as Ability|undefined
      if(first) values[first]+=2
      if(second) values[second]++
    }
  }
  for(const id of abilities) values[id]=Math.min(values[id],20)
  const languages=new Set(['Общий',...(species?.languages??[])])
  const skillSet=new Set<Skill>(background?.skills)
  const expert=new Set<Skill>()
  const tools=new Set<string>()
  const profs = new Set<string>()
  const saves = new Set<Ability>()
  const features:Feature[]=[]
  const magic = new Map<string,{name:string;ability:Ability; spells:Map<string,string>}>()
  const featIds = new Set<string>()
  const styles = new Set<string>()
  const masteries = new Map<string,string[]>()
  let knownForms:string[]=[]
  const classLevels:Record<string,number>={}
  const subclasses:Record<string,string>={}
  const hitDice:Record<number,number>={}
  const acquired = new Map<string,{cantrips:string[]; known:string[]; prepared:string[]; book:string[]; invocations:string[]; arcanum:string[]}>()
  const bonusFeatures= new Map<string,string>()
  const proficiency = 2+Math.floor((target-1)/4)
  const items:Gear[]=[]
  const landTypes = old ? druidLand14 : druidLand24
  let gold=0, speed=species?.speed??30
  const hpDice:number[]=[]
  let size=species?.size??'—'
  let progressions:Record<string,Progress>={}
  const addSpells = (key:string,name:string,ability:Ability,ids:string[],status:string) => {
    if(!ids.length) return
    const book = magic.get(key) ?? {name,ability,spells:new Map<string,string>()}
    for(const id of ids) {
      if(!catalog.spells.some(spell=>spell.id===id)) continue
      const previous = book.spells.get(id)
      book.spells.set(id,previous&&previous!==status?uniq([...previous.split(' / '),status]).join(' / '):status)
    }
    magic.set(key,book)
  }
  const addFeat = (id:string, source:string, step:number, select:ReturnType<typeof choicesFor>) => {
    if(!id)return
    featIds.add(id)
    const title = featNames[id]??featureLabel(catalog.feats['Epic Boon']?.find(entry=>entry.id===id)?.name??id)
    const description = catalog.descriptions[title] ?? catalog.descriptions[id==='grappler'?'Grappler':id.startsWith('initiate')?'Magic Initiate':title] ?? Object.values(catalog.feats).flat().find(entry=>entry.id===id)?.description
    features.push({name:title,source,level:step||undefined,detail:description})
    if(id==='skilled') {
      const available = [...formatSkills(skillIds.filter(skill=>!skillSet.has(skill))),...artisanTools.map(tool=>opt('tool:'+tool,'Инструменты '+tool.toLowerCase())),opt('tool:Воровские инструменты','Воровские инструменты')]
      for(const entry of select(source+'-skilled','Владения черты «Умелый»',3,available)) {
        if(entry.startsWith('tool:'))tools.add(entry.slice(5)); else skillSet.add(entry as Skill)
      }
    }
    if(id.startsWith('initiate-')) {
      const spellClass=id.replace('initiate-','')
      const ability = select(source+'-initiate-ability','Характеристика магии черты',1,abilityOptions.filter(x=>['int','wis','cha'].includes(x.id)))[0] as Ability|undefined
      const spells=catalog.spells.filter(spell=>spell.classes.includes(spellClass))
      const cantrips=select(source+'-initiate-cantrips','Заговоры черты',2,spellOpts(spells.filter(spell=>spell.level===0)))
      const first=select(source+'-initiate-spell','Заклинание черты 1-го уровня',1,spellOpts(spells.filter(spell=>spell.level===1)))
      if(ability) {addSpells(source,title,ability,cantrips,'Заговор'); addSpells(source,title,ability,first,'Всегда подготовлено · 1/долгий отдых')}
    }
    if((!old&&id==='grappler') || id.startsWith('boon-')) {
      const pool = id==='grappler'||id==='boon-of-irresistible-offense'?['str','dex']:id==='boon-of-spell-recall'?['int','wis','cha']:abilities
      const ceiling=id.startsWith('boon-')?30:20
      const increase=select(source+'-feat-increase','Прибавка характеристики от черты',1,abilityOptions.filter(x=>pool.includes(x.id as Ability)&&values[x.id as Ability]<ceiling))[0] as Ability|undefined
      if(increase)values[increase]++
    }
  }
  const addLevelFeature = (level:number,name:string,source:string,detail?:string) => {
    const entry={name:featureLabel(name),source,detail,level}
    features.push(entry)
    ;(gained[level]??=[]).push(entry)
  }
  const rawGearOptions = (ids:string[]) => ids.map(id=>opt(id,packageLabel(id,catalog)))
  const choosePack = (pack:Package, prefix:string, select:ReturnType<typeof choicesFor>, martial:boolean) => {
    gold+=pack.gold
    const selected = [...pack.items]
    for(const [i,group] of (pack.selects??[]).entries()) {
      const filtered=martial?group:group.filter(id=>id!=='warhammer'&&id!=='chain-mail')
      if(filtered.length===1){ selected.push(filtered[0]); continue }
      selected.push(...select(prefix+'-kit-'+i,'Снаряжение · выбор '+(i+1),1,rawGearOptions(filtered)))
    }
    selected.forEach((id,i)=>{
      if(id==='monk-tool') {
        const tool=choices[1]?.find(choice=>choice.id==='monk-tools')?.value[0]
        if(tool)items.push({id:'tool:'+tool,name:artisanTools.includes(tool)?'Инструменты '+tool.toLowerCase():tool,quantity:1})
      } else if(id==='instrument'||id==='artisan'||id==='game') {
        const options = id==='instrument'?instruments:id==='artisan'?artisanTools:games
        const picked=id==='game'&&background?.tool==='game' ? choices[1]?.find(choice=>choice.id==='background-tool')?.value[0] : select(prefix+'-tool-item-'+i,packageLabel(id,catalog),1,only(options))[0]
        if(picked)items.push({id:id+':'+picked,name:id==='artisan'?'Инструменты '+picked.toLowerCase():picked,quantity:1})
      } else if(weaponGroups.includes(id)) {
        const pool=catalog.items.filter(item=>item.kind==='weapon' && (
          id.startsWith('simple') ? item.category?.startsWith('simple') && (id==='simple-weapon'||!item.category.includes('ranged')) :
          item.category?.startsWith('martial') && (id!=='martial-melee'||!item.category.includes('ranged'))
        ))
        const group = pool.map(item=>opt(item.id,itemLabel(item),item.damage))
        const picked=[...select(prefix+'-weapon-'+i,'Выберите оружие',1,group)]
        if(id.endsWith('pair'))picked.push(...select(prefix+'-weapon-'+i+'-second','Выберите второе оружие',1,group))
        if(id==='martial-shield')picked.push('shield')
        items.push(...expandPackage(picked))
      } else items.push(...expandPackage([id]))
    })
  }
  if(species) {
    const lineage = species.lineages ? origin('lineage','Наследие',1,species.lineages)[0] : undefined
    if (lineage) bonusFeatures.set('lineage',lookup(species.lineages!,lineage)?.name??'')
    if(!old && size==='Маленький или средний') size=origin('size','Размер',1,only(['Маленький','Средний']))[0]??size
    if (species.id==='elf') {
      if(old) { skillSet.add('perception'); for(const id of ['longsword','shortsword','shortbow','longbow'])profs.add(id) }
      else {
        for(const id of origin('keen-senses','Обострённые чувства',1,formatSkills(['insight','perception','survival'])) as Skill[])skillSet.add(id)
        if(lineage==='wood')speed=35
      }
      if(old||lineage) {
        const ability=old?'int':origin('lineage-ability','Характеристика врождённой магии',1,abilityOptions.filter(option=>['int','wis','cha'].includes(option.id)))[0] as Ability|undefined
        const entries:Record<string,string[]>={drow:['dancing-lights','faerie-fire','darkness'],high:['prestidigitation','detect-magic','misty-step'],wood:['druidcraft','longstrider','pass-without-trace']}
        const spells=old?origin('elf-cantrip','Заговор высшего эльфа',1,spellOpts(catalog.spells.filter(spell=>spell.level===0&&spell.classes.includes('wizard')))):entries[lineage??'']?.slice(0,target>=5?3:target>=3?2:1)??[]
        if(!old&&lineage==='high') spells[0]=origin('elf-cantrip','Заговор высшего эльфа',1,spellOpts(catalog.spells.filter(spell=>spell.level===0&&spell.classes.includes('wizard'))),['prestidigitation'])[0]
        if(ability)addSpells('species',species.name,ability,spells.filter(Boolean),'Врождённое')
      }
    }
    if(species.id==='half-orc')skillSet.add('intimidation')
    if(species.id==='dwarf'&&old) {
      for(const id of ['battleaxe','handaxe','light-hammer','warhammer'])profs.add(id)
      for(const tool of origin('dwarf-tool','Ремесло дварфа',1,only(['Инструменты кузнеца','Инструменты пивовара','Инструменты каменщика']))) tools.add(tool)
    }
    if(species.id==='human'&&!old) {
      for(const id of origin('human-skill','Навык человека',1,formatSkills(skillIds.filter(skill=>!skillSet.has(skill)))) as Skill[])skillSet.add(id)
      const feat=origin('human-feat','Черта происхождения человека',1,[opt('alert',featNames.alert),opt('skilled',featNames.skilled),opt('savage-attacker',featNames['savage-attacker']),...['cleric','druid','wizard'].map(id=>opt('initiate-'+id,featNames['initiate-'+id]))].filter(option=>option.id!==background?.feat))[0]
      if(feat)addFeat(feat,'Человек',0,origin)
    }
    if(species.id==='half-elf') for(const id of origin('half-elf-skills','Навыки полуэльфа',2,formatSkills(skillIds.filter(skill=>!skillSet.has(skill)))) as Skill[])skillSet.add(id)
    if(species.id==='tiefling') {
      const list:Record<string,string[]>={abyssal:['poison-spray','ray-of-sickness','hold-person'],chthonic:['chill-touch','false-life','ray-of-enfeeblement'],infernal:['fire-bolt','hellish-rebuke','darkness']}
      const ability = old?'cha':lineage?origin('lineage-ability','Характеристика врождённой магии',1,abilityOptions.filter(option=>['int','wis','cha'].includes(option.id)))[0] as Ability|undefined:undefined
      const picked=old?['thaumaturgy','hellish-rebuke','darkness']:list[lineage??'']??[]
      if(ability)addSpells('species',species.name,ability,[...picked.slice(0,target>=5?3:target>=3?2:1),...(!old?['thaumaturgy']:[])],'Врождённое')
    }
    if(species.id==='gnome'&&!old&&lineage) {
      const ability=origin('lineage-ability','Характеристика врождённой магии',1,abilityOptions.filter(option=>['int','wis','cha'].includes(option.id)))[0] as Ability|undefined
      if(ability)addSpells('species',species.name,ability,lineage==='forest'?['minor-illusion','speak-with-animals']:['mending','prestidigitation'],'Врождённое')
    }
    if(species.id==='gnome'&&old)tools.add('Инструменты ремонтника')
    for(const trait of species.traits)features.push({name:trait,source:species.name})
    if(lineage)features.push({name:lookup(species.lineages!,lineage)?.name??lineage,detail:lookup(species.lineages!,lineage)?.description,source:species.name})
    if(species.id==='dragonborn'&&lineage){
      const resistance=lookup(species.lineages!,lineage)?.description
      if(resistance)bonusFeatures.set('breath',resistance)
      if(!old&&target>=5)features.push({name:'Драконий полёт',source:species.name,detail:'С 5-го уровня. Полёт на 10 минут, скорость равна скорости ходьбы. 1 раз за долгий отдых.'})
    }
  }
  if(species&&background){
    const count=old?(species.id==='human'||species.id==='half-elf'?1:0)+2:2
    for(const id of origin('languages','Дополнительные языки',count,only((old?languages14:languages24).filter(lang=>!languages.has(lang)))))languages.add(id)
  }
  const initialClass=catalog.classes.find(cls=>cls.id===draft.levels[0]?.classId)
  if(initialClass){
    for(const id of initialClass.saves)saves.add(id)
    for(const id of initialClass.profs)if(id!=='instrument')profs.add(id)
  }
  const acquiredSpells = (level:number,id:string) => {
    const cls = catalog.classes.find(entry=>entry.id===id)!
    return catalog.spells.filter(spell=>spell.classes.includes(cls.id)&&spell.level===level)
  }
  for(let step=1;step<=target;step++) {
    const row=draft.levels[step-1]
    const cls=catalog.classes.find(entry=>entry.id===row?.classId)
    if(!row||!cls){ issues.push({step,message:'Выберите класс для уровня '+step}); continue }
    const previousClassLevels={...classLevels}
    const at=(classLevels[cls.id]??0)+1
    if(step>1&&at===1&&initialClass) {
      if(!draft.options.multiclass) {issues.push({step,message:'Включите мультиклассирование в настройках кампании'});continue}
      const unmet=uniq([...Object.keys(previousClassLevels).flatMap(id=>multiclassRequirements(catalog.classes.find(entry=>entry.id===id)!,cls,values)),...multiclassRequirements(initialClass,cls,values)])
      if(unmet.length){issues.push({step,message:'Требования мультикласса: '+unmet.join(', ')});continue}
    }
    classLevels[cls.id]=at
    const select=choicesFor(step,row.choices)
    const prev=progress(catalog,draft.edition,cls.id,at-1)
    const now=progress(catalog,draft.edition,cls.id,at)
    progressions={...progressions,[cls.id]:now}
    hitDice[cls.hp]=(hitDice[cls.hp]??0)+1
    if(step>1&&row.hpMode==='roll'&&!row.hpRoll)issues.push({step,message:'Бросьте кость хитов'})
    const hpDie=step===1?cls.hp:row.hpMode==='roll'&&row.hpRoll?clamp(row.hpRoll,1,cls.hp):cls.hp/2+1
    hpDice.push(hpDie)
    if(step===1) {
      const armorOrWeapon=initialClass?.profs.includes('martial') || initialClass?.profs.includes('heavy')
      if(background?.tool) {
        if(background.tool==='game') {
          for(const tool of select('background-tool','Игровой набор предыстории',1,only(games)))tools.add(tool)
        } else tools.add(background.tool)
      }
      const skillPool=cls.skills.filter(id=>!skillSet.has(id))
      const count=Math.min(cls.skillCount,skillPool.length)
      for(const id of select('class-skills','Владения навыками',count,formatSkills(skillPool)) as Skill[])skillSet.add(id)
      if(count<cls.skillCount) for(const id of select('class-extra-skills','Дополнительные навыки',cls.skillCount-count,formatSkills(skillIds.filter(id=>!skillSet.has(id)))) as Skill[])skillSet.add(id)
      if(cls.id==='bard')for(const tool of select('bard-tools','Владение инструментами барда',3,only(instruments)))tools.add(tool)
      if(cls.id==='druid')tools.add('Набор травника')
      if(cls.id==='rogue')tools.add('Воровские инструменты')
      if(cls.id==='monk') for(const tool of select('monk-tools','Владение инструментом монаха',1,[...only(instruments),...artisanTools.map(name=>opt(name,'Инструменты '+name.toLowerCase()))]))tools.add(artisanTools.includes(tool)?'Инструменты '+tool.toLowerCase():tool)
      const starting=select('starting-gear','Стартовое снаряжение класса',1,[opt('pack','Набор класса'+(!old&&cls.id==='fighter'?' · тяжёлые доспехи':'')),...(!old&&cls.id==='fighter'?[opt('pack-light','Набор класса · лёгкие доспехи')]:[]),opt('cash',old?'Бросок начального золота':cls.cash+' зм')],['pack'])[0]
      if(starting==='pack')choosePack(cls.pack,'class',select,!!armorOrWeapon || old&&cls.id==='cleric'&&row.choices.subclass?.includes('default'))
      if(starting==='pack-light')choosePack(fighterPack24,'class-light',select,true)
      if(starting==='cash') {
        if(!old)gold+=cls.cash
        else {
          const roll=Number(row.choices['wealth-roll']?.[0]??0)
          if(roll>0)gold+=roll*(cls.id==='monk'?1:10)
          else issues.push({step,message:'Бросьте '+goldDice14(cls.id)+'к4 для начального золота'})
        }
      }
      if(background && (!old||starting==='pack')) {
        const pack=old||select('background-gear','Снаряжение предыстории',1,[opt('pack','Набор предыстории'),opt('cash','50 зм')],['pack'])[0]==='pack'
        if(pack)choosePack(background.pack,'background',select,true)
        else gold+=50
      }
      if(background?.feat)addFeat(background.feat,'Предыстория',step,select)
      if(old&&background?.id==='acolyte')features.push({name:'Приют единоверцев',source:background.name,detail:'Единоверцы узнают вас и могут оказать поддержку в храме вашей веры.'})
    } else if(at===1) {
      for(const id of cls.multiclass)if(id!=='instrument')profs.add(id)
      if(['bard','ranger','rogue'].includes(cls.id)) {
        const pool=cls.skills.filter(id=>!skillSet.has(id))
        for(const id of select('multiclass-skill','Навык нового класса',1,formatSkills(pool.length?pool:skillIds.filter(id=>!skillSet.has(id)))) as Skill[])skillSet.add(id)
      }
      if(cls.id==='bard')for(const tool of select('multiclass-tool','Инструмент барда',1,only(instruments.filter(tool=>!tools.has(tool)))))tools.add(tool)
      if(cls.id==='rogue')tools.add('Воровские инструменты')
    }
    const automatic = catalog.features[cls.id]?.[String(at)]??[]
    for(const feature of automatic.filter(feature=>!/Subclass feature|Subclass$/i.test(feature))) {
      const bare=feature.replace(/\s+\(.*$/, '')
      addLevelFeature(step,feature,cls.name,catalog.classDescriptions[cls.id]?.[feature]??catalog.classDescriptions[cls.id]?.[bare]??catalog.descriptions[feature]??catalog.descriptions[bare])
    }
    if(at===cls.subclassAt) {
      const title=old?cls.subclass:({druid:'Круг земли',sorcerer:'Драконье чародейство',wizard:'Воплотитель'} as Record<string,string>)[cls.id]??cls.subclass
      if(select('subclass','Подкласс',1,[opt('default',title,'Подкласс, доступный в выбранном SRD.')])[0])subclasses[cls.id]=title
    }
    if(subclasses[cls.id]){
      if(cls.id==='bard'&&at===3)for(const id of select('lore-skills','Владения коллегии знаний',3,formatSkills(skillIds.filter(id=>!skillSet.has(id)))) as Skill[])skillSet.add(id)
      if(old&&cls.id==='cleric'&&at===1)profs.add('heavy')
      for(const feature of catalog.subclassFeatures[cls.id]?.[String(at)]??[])addLevelFeature(step,feature,subclasses[cls.id],catalog.descriptions[feature])
    }
    const has=(name:string)=>automatic.some(feature=>feature.toLowerCase().includes(name))
    if(has('fighting style')||cls.id==='fighter'&&at===1||cls.id==='fighter'&&at===(old?10:7)&&subclasses.fighter){
      const permitted = !old ? ['archery','defense','great-weapon-fighting','two-weapon-fighting'] : cls.id==='ranger'?['archery','defense','dueling','two-weapon-fighting']:cls.id==='paladin'?['defense','dueling','great-weapon-fighting','protection']:choiceFeatures['fighting-style'].map(option=>option.id)
      const available=choiceFeatures['fighting-style'].filter(option=>permitted.includes(option.id)&&!styles.has(option.id))
      if(!old&&cls.id==='paladin')available.push(opt('blessed-warrior','Священный воин'))
      if(!old&&cls.id==='ranger')available.push(opt('druidic-warrior','Друидический воин'))
      const style=select('style','Боевой стиль',1,available)[0]
      if(style) {
        styles.add(style)
        addLevelFeature(step,lookup(available,style)!.name,cls.name)
        if(style==='blessed-warrior')addSpells(cls.id,cls.name,'cha',select('style-cantrips','Заговоры священного воина',2,spellOpts(acquiredSpells(0,'cleric'))),'Заговор')
        if(style==='druidic-warrior')addSpells(cls.id,cls.name,'wis',select('style-cantrips','Заговоры друидического воина',2,spellOpts(acquiredSpells(0,'druid'))),'Заговор')
      }
    }
    for(const [id, title, profGroup] of [['divine-order','Божественный орден','heavy'],['primal-order','Первобытный орден','medium']] as const) {
      if(has(id.replace('-',' '))) {
        const order=select(id,title,1,choiceFeatures[id])[0]
        if(['protector','warden'].includes(order)){profs.add('martial');profs.add(profGroup)}
        if(order)bonusFeatures.set(id,order)
      }
    }
    if(has('expertise') || has('deft explorer')&&at===2) {
      const eligible=old&&cls.id==='rogue'? [...formatSkills([...skillSet].filter(skill=>!expert.has(skill))),...(!tools.has('Экспертиза: воровские инструменты')?[opt('thieves','Воровские инструменты')]:[])]:formatSkills([...skillSet].filter(skill=>!expert.has(skill)))
      const num=cls.id==='ranger'?1:2
      for(const id of select('expertise','Компетентность',Math.min(eligible.length,num),eligible)) {
        if(id==='thieves')tools.add('Экспертиза: воровские инструменты')
        else expert.add(id as Skill)
      }
      if(cls.id==='ranger')for(const lang of select('ranger-languages','Языки исследователя',2,only(languages24.filter(lang=>!languages.has(lang)))))languages.add(lang)
    }
    if(cls.id==='druid'&&at===1)languages.add('Друидический')
    if(cls.id==='rogue'&&at===1)languages.add('Воровской жаргон')
    if(!old&&cls.id==='druid'&&[2,4,8].includes(at)){
      const maxCR=at===2?.25:at===4?.5:1
      const pool=beasts.filter(beast=>beast.cr<=maxCR&&(at>=8||!beast.fly)).map(beast=>opt(beast.id,beast.ru,'ПО '+beast.cr+(beast.fly?' · полёт':'')))
      knownForms=select('wild-shapes','Знакомые звериные облики',at===2?4:at===4?6:8,pool,knownForms)
    }
    if(!old&&cls.id==='barbarian'&&at===3){
      const pool=formatSkills(cls.skills.filter(id=>!skillSet.has(id)))
      for(const id of select('primal-skill','Навык первобытного знания',1,pool) as Skill[])skillSet.add(id)
    }
    if(!old&&cls.id==='wizard'&&at===2){
      const pool=formatSkills((['arcana','history','investigation','medicine','nature','religion'] as Skill[]).filter(id=>skillSet.has(id)&&!expert.has(id)))
      for(const id of select('scholar','Специализация учёного',1,pool) as Skill[])expert.add(id)
    }
    if(!old&&at===7&&['cleric','druid'].includes(cls.id)){
      const cleric=cls.id==='cleric'
      const alternatives=[opt('potent-spellcasting','Могущественное колдовство','Прибавьте модификатор Мудрости к урону заговоров класса.'),cleric?opt('divine-strike','Божественный удар','Раз в ход добавьте 1к8 некротического урона или урона излучением к попаданию оружием.'):opt('primal-strike','Первобытный удар','Раз в ход добавьте 1к8 урона холодом, огнём, электричеством или звуком к подходящему попаданию.')]
      const chosen=lookup(alternatives,select('damage-feature',cleric?'Благословенные удары':'Стихийная ярость',1,alternatives)[0])
      if(chosen)addLevelFeature(step,chosen.name,cls.name,chosen.description)
    }
    if(old&&cls.id==='ranger'&&(at===1||at===6||at===14)){
      const enemies=['Аберрации','Звери','Небожители','Конструкты','Драконы','Элементали','Феи','Исчадия','Великаны','Монстры','Слизи','Растения','Нежить','Два народа гуманоидов']
      const chosen=select('favored-enemy','Избранный враг',1,only(enemies.filter(id=>!features.some(feature=>feature.name===id&&feature.source==='Избранный враг'))))[0]
      if(chosen) addLevelFeature(step,chosen,'Избранный враг')
      if(chosen==='Два народа гуманоидов')for(const humanoid of select('humanoid-enemies','Народы гуманоидов',2,only(['Люди','Дварфы','Эльфы','Гномы','Полурослики','Орки','Гоблины','Кобольды','Гноллы','Хобгоблины'])))addLevelFeature(step,humanoid,'Избранный враг')
      for(const lang of select('enemy-language','Язык избранного врага',1,only(languages14.filter(lang=>!languages.has(lang))),undefined,true))languages.add(lang)
    }
    if(old&&cls.id==='ranger'&&(at===1||at===6||at===10)){
      for(const part of select('favored-terrain','Излюбленная местность',1,only(Object.keys(druidLand14).filter(id=>!features.some(feature=>feature.name===id&&feature.source==='Излюбленная местность')))))addLevelFeature(step,part,'Излюбленная местность')
    }
    if(!old&&cls.id==='rogue'&&at===1)for(const lang of select('rogue-language','Дополнительный язык плута',1,only([...new Set([...languages24,...languages14])].filter(lang=>!languages.has(lang)))))languages.add(lang)
    if(cls.id==='sorcerer'&&at===cls.subclassAt&&subclasses.sorcerer&&old) {
      const ancestor = select('ancestor','Драконий предок',1,speciesAncestorOptions())[0]
      if(ancestor) addLevelFeature(step,lookup(speciesAncestorOptions(),ancestor)?.name??ancestor,subclasses.sorcerer)
    }
    if(cls.id==='druid'&&at===cls.subclassAt&&subclasses.druid) {
      const land=select('circle-land','Местность круга земли',1,only(Object.keys(landTypes)))[0]
      if(land) bonusFeatures.set('circle-land',land)
    }
    if(cls.id==='ranger'&&subclasses.ranger) {
      if(at===3) {
        const options=old?choiceFeatures['hunter-prey']:choiceFeatures['hunter-prey'].slice(0,2)
        const prey=select('hunter-prey','Приём охотника',1,options)[0]
        if(prey)addLevelFeature(step,lookup(options,prey)!.name,subclasses.ranger)
      }
      if(at===7) {
        const options=old?choiceFeatures['defensive-tactics'].slice(0,3):choiceFeatures['defensive-tactics'].slice(0,2)
        const tactic=select('defensive-tactics','Оборонительная тактика',1,options)[0]
        if(tactic)addLevelFeature(step,lookup(options,tactic)!.name,subclasses.ranger)
      }
      if(old&&(at===11||at===15)){
        const special=select('hunter-special',at===11?'Мультиатака':'Превосходная защита',1,only(at===11?['Залп','Вихревая атака']:['Увёртливость','Стоять против всех','Невероятное уклонение']))[0]
        if(special)addLevelFeature(step,special,subclasses.ranger)
      }
    }
    if(has('metamagic')) {
      const previous=features.filter(feature=>feature.source==='Метамагия').map(feature=>feature.name)
      const count=old?at===3?2:at===10||at===17?1:0:at===2||at===10||at===17?2:0
      const options=choiceFeatures.metamagic.filter(option=>!previous.includes(option.name)&&(!old||!['seeking-spell','transmuted-spell'].includes(option.id)))
      for(const id of select('metamagic','Метамагия',count,options))addLevelFeature(step,lookup(options,id)!.name,'Метамагия')
    }
    if(has('pact boon')){
      const pact=select('pact-boon','Дар договора',1,choiceFeatures['pact-boon'])[0]
      if(pact) {
        bonusFeatures.set('pact-boon',pact)
        addLevelFeature(step,lookup(choiceFeatures['pact-boon'],pact)!.name,cls.name)
        if(pact==='pact-of-the-tome') addSpells(cls.id,cls.name,'cha',select('pact-tome-cantrips','Заговоры книги теней',3,spellOpts(catalog.spells.filter(spell=>spell.level===0))),'Заговор')
      }
    }
    const masteryCount=now.mastery??(!old&&['paladin','ranger','rogue'].includes(cls.id)?2:0)
    if(masteryCount && (at===1||masteryCount!==(prev.mastery??masteryCount))) {
      const options=catalog.items.filter(item=>item.kind==='weapon'&&item.id!=='unarmed'&&weaponProficient(profs,item.id,item.category,item.properties)).map(item=>opt(item.id,itemLabel(item),item.mastery))
      const selected=select('weapon-mastery','Мастерство оружия',masteryCount,options,masteries.get(cls.id))
      masteries.set(cls.id,selected)
    }
    if(has('ability score improvement')||has('epic boon')) {
      const epic=has('epic boon')
      const featChoices=epic ? (catalog.feats['Epic Boon']??[]).filter(entry=>entry.id!=='boon-of-spell-recall'||Object.entries(progressions).some(([id,entry])=>id!=='warlock'&&trimSlots(entry.slots).length)).map(entry=>opt(entry.id,featureLabel(entry.name))) : []
      if(!epic && (!old||draft.options.feats)) {
        if(!featIds.has('grappler')&&(old?values.str>=13:values.str>=13||values.dex>=13))featChoices.push(opt('grappler','Борец'))
        if(!old)featChoices.push(...[opt('alert',featNames.alert),opt('skilled',featNames.skilled),opt('savage-attacker',featNames['savage-attacker']),...['cleric','druid','wizard'].map(id=>opt('initiate-'+id,featNames['initiate-'+id]))].filter(entry=>entry.id==='skilled'||!featIds.has(entry.id)))
      }
      const initialOption=epic?[]:[opt('asi','Повысить характеристики')]
      const picked=select('advancement',epic?'Эпический дар':'Повышение характеристик или черта',1,[...initialOption,...featChoices],epic?undefined:['asi'])[0]
      if(picked==='asi') {
        const available=abilityOptions.filter(option=>values[option.id as Ability]<20)
        const plan=select('asi-mode','Распределение прибавки',1,[...(available.some(option=>values[option.id as Ability]<19)?[opt('2','Одна характеристика +2')]:[]),...(available.length>=2?[opt('1-1','Две характеристики +1')]:[])],['2'])[0]
        if(plan==='2')for(const id of select('asi-2','Характеристика +2',1,available.filter(option=>values[option.id as Ability]<19)) as Ability[]) values[id]+=2
        if(plan==='1-1')for(const id of select('asi-1','Характеристики +1',2,available) as Ability[])values[id]++
      } else if(picked)addFeat(picked,cls.name+' · '+step,step,select)
    }
    if(cls.spellAbility) {
      const ledger=acquired.get(cls.id)??{cantrips:[],known:[],prepared:[],book:[],invocations:[],arcanum:[]}
      const classList=catalog.spells.filter(spell=>spell.classes.includes(cls.id))
      const borrowedList=catalog.spells.filter(spell=>spell.classes.some(id=>['cleric','druid','wizard'].includes(id)))
      const domain=subclasses[cls.id] ? Object.entries(subclassSpellLists[draft.edition][cls.id]??{}).filter(([level])=>Number(level)<=at).flatMap(([,spells])=>spells) : []
      const land=bonusFeatures.get('circle-land')
      if(cls.id==='druid'&&subclasses.druid&&land)domain.push(...landTypes[land].slice(0,Math.max(0,Math.min(4,Math.floor((at-1)/2)))).flat())
      if(!old&&cls.id==='paladin'&&at>=2)domain.push('divine-smite')
      if(!old&&cls.id==='ranger')domain.push('hunters-mark')
      if(!old&&cls.id==='druid'&&at>=1)domain.push('speak-with-animals')
      if(!old&&cls.id==='sorcerer'&&at===20)domain.push('wish')
      const bonusCantrip= Number(cls.id==='cleric'&&bonusFeatures.get('divine-order')==='thaumaturge'||cls.id==='druid'&&bonusFeatures.get('primal-order')==='magician')+Number(old&&cls.id==='druid'&&!!subclasses.druid)
      const cantripCount=(now.cantrips??0)+bonusCantrip
      if(cantripCount && (cantripCount!==ledger.cantrips.length || row.choices.cantrips))ledger.cantrips=select('cantrips','Заговоры · '+cls.name,cantripCount,spellOpts(classList.filter(spell=>spell.level===0)),ledger.cantrips)
      const maxSpell=now.pactLevel??trimSlots(now.slots).length
      let eligible=classList.filter(spell=>spell.level>0&&spell.level<=maxSpell&&!domain.includes(spell.id))
      if(!old&&cls.id==='bard'&&at>=10)eligible=[...new Map([...eligible,...borrowedList.filter(spell=>spell.level>0&&spell.level<=maxSpell)].map(spell=>[spell.id,spell])).values()]
      if(!old&&cls.id==='bard'&&at===6&&subclasses.bard){
        const discovered=select('magical-discoveries','Магические открытия',2,spellOpts(borrowedList.filter(spell=>spell.level<=maxSpell&&!ledger.cantrips.includes(spell.id)&&!ledger.prepared.includes(spell.id))))
        addSpells(cls.id,cls.name,cls.spellAbility,discovered,'Магические открытия')
      }
      if(old&&cls.id==='warlock'&&subclasses.warlock){
        const expanded=[['burning-hands','command'],['blindness-deafness','scorching-ray'],['fireball','stinking-cloud'],['fire-shield','wall-of-fire'],['flame-strike','hallow']].slice(0,maxSpell).flat()
        eligible=[...new Map([...eligible,...catalog.spells.filter(spell=>expanded.includes(spell.id))].map(spell=>[spell.id,spell])).values()]
      }
      if(cls.id==='wizard'&&maxSpell) {
        const count=at===1?6:2
        const bookAdd=select('spellbook','Новые заклинания в книгу',count,spellOpts(eligible.filter(spell=>!ledger.book.includes(spell.id))))
        ledger.book=uniq([...ledger.book,...bookAdd])
        if(!old&&subclasses.wizard&&(at===3||maxSpell>trimSlots(prev.slots).length)){
          const bonus=select('evocation-savant','Заклинания школы воплощения',at===3?2:1,spellOpts(eligible.filter(spell=>spell.school?.toLowerCase().includes('evocation')&&!ledger.book.includes(spell.id))))
          ledger.book=uniq([...ledger.book,...bonus])
        }
        eligible=eligible.filter(spell=>ledger.book.includes(spell.id))
      }
      const learnedSecrets=old&&cls.id==='bard'?[10,14,18].filter(gainedAt=>gainedAt<=at).length*2:0
      const knownCount=(now.known??0)-learnedSecrets
      const learnedSpells = (previous:string[], count:number, kind:'known'|'limited-prepared', title:string)=>{
        const valid=previous.filter(id=>eligible.some(spell=>spell.id===id)).slice(0,count)
        const newSpells=select(kind,title,Math.min(count-valid.length,eligible.length-valid.length),spellOpts(eligible.filter(spell=>!valid.includes(spell.id))))
        if(at===1||!valid.length)return [...valid,...newSpells]
        const removing=select(kind+'-remove','Заменить · '+title.toLowerCase(),1,spellOpts(eligible.filter(spell=>valid.includes(spell.id))),undefined,true)[0]
        if(!removing)return [...valid,...newSpells]
        const next=select(kind+'-replacement','Новое заклинание взамен',1,spellOpts(eligible.filter(spell=>!valid.includes(spell.id)&&!newSpells.includes(spell.id))))[0]
        return [...valid.filter(id=>id!==removing),...newSpells,...(next?[next]:[removing])]
      }
      if(knownCount)ledger.known=learnedSpells(ledger.known,knownCount,'known','Известные заклинания · '+cls.name)
      const formula=old&&maxSpell&&['cleric','druid','paladin','wizard'].includes(cls.id)?Math.max(1,modifier(values[cls.spellAbility])+(cls.id==='paladin'?Math.floor(at/2):at)):0
      const preparedCount = now.prepared??formula
      if(preparedCount&&eligible.length){
        const limit=Math.min(preparedCount,eligible.length)
        if(!old&&['bard','ranger','sorcerer','warlock'].includes(cls.id)){
          ledger.prepared=learnedSpells(ledger.prepared,limit,'limited-prepared','Подготовленные заклинания · '+cls.name)
        } else if(limit!==ledger.prepared.length||row.choices.prepared||ledger.prepared.some(id=>!eligible.some(spell=>spell.id===id))) {
          ledger.prepared=select('prepared','Подготовленные заклинания · '+cls.name,limit,spellOpts(eligible),ledger.prepared)
        }
      }
      if(old&&cls.id==='bard'&&(at===10||at===14||at===18||at===6&&subclasses.bard)){
        const chosen=select('secret-spells','Тайны магии',2,spellOpts(catalog.spells.filter(spell=>spell.level<=maxSpell&&!ledger.known.includes(spell.id))))
        addSpells(cls.id,cls.name,cls.spellAbility,chosen,'Тайны магии')
      }
      const invCount=now.invocations??0
      const hadTome=ledger.invocations.includes('pact-of-the-tome')
      if(invCount&&(invCount!==ledger.invocations.length||row.choices.invocations)){
        const options=(old?invocations14:invocations24).filter(name=>{
          const id=slug(name)
          const pact=old?[bonusFeatures.get('pact-boon')]:ledger.invocations
          if((old?oldInvocationMin[id]??1:invocationReq[id]??1)>at)return false
          if(['agonizing-blast','eldritch-spear','repelling-blast'].includes(id)&&old&&!ledger.cantrips.includes('eldritch-blast'))return false
          if(['thirsting-blade','lifedrinker','eldritch-smite','devouring-blade'].includes(id)&&!pact.includes('pact-of-the-blade'))return false
          if(id==='devouring-blade'&&!ledger.invocations.includes('thirsting-blade'))return false
          if(['chains-of-carceri','voice-of-the-chain-master','investment-of-the-chain-master'].includes(id)&&!pact.includes('pact-of-the-chain'))return false
          if(['book-of-ancient-secrets','gift-of-the-protectors'].includes(id)&&!pact.includes('pact-of-the-tome'))return false
          return true
        }).map(name=>opt(slug(name),featureLabel(name),catalog.descriptions[name]?.split('\n')[0]?.slice(0,160)))
        ledger.invocations=select('invocations','Таинственные воззвания',invCount,options,ledger.invocations)
      }
      if(!old&&cls.id==='warlock'&&ledger.invocations.includes('pact-of-the-tome')&&(!hadTome||row.choices['pact-tome-cantrips'])){
        addSpells(cls.id,cls.name,'cha',select('pact-tome-cantrips','Заговоры книги теней',3,spellOpts(catalog.spells.filter(spell=>spell.level===0))),'Заговор')
        addSpells(cls.id,cls.name,'cha',select('pact-tome-rituals','Ритуалы книги теней',2,spellOpts(catalog.spells.filter(spell=>spell.level===1&&(spell.ritual||/ritual/i.test(spell.text?.slice(0,350)??''))))),'Ритуал')
      }
      if(!old&&cls.id==='warlock'&&ledger.invocations.includes('pact-of-the-chain')) addSpells(cls.id,cls.name,'cha',familiar24.map(slug),'Дар договора')
      if(cls.id==='warlock'&&[11,13,15,17].includes(at)){
        const level=[11,13,15,17].indexOf(at)+6
        ledger.arcanum.push(...select('arcanum','Арканум · уровень '+level,1,spellOpts(classList.filter(spell=>spell.level===level))))
      }
      if(cls.id==='wizard'&&at===18){
        for(const spellLevel of [1,2])addSpells(cls.id,cls.name,cls.spellAbility,select('spell-mastery-'+spellLevel,'Мастерство заклинаний · уровень '+spellLevel,1,spellOpts(classList.filter(spell=>spell.level===spellLevel&&ledger.book.includes(spell.id)))),'Мастерство')
      }
      if(cls.id==='wizard'&&at===20)addSpells(cls.id,cls.name,cls.spellAbility,select('signature-spells','Фирменные заклинания',2,spellOpts(classList.filter(spell=>spell.level===3&&ledger.book.includes(spell.id)))),'Фирменное')
      acquired.set(cls.id,ledger)
    }
  }
  for(const [id,ledger] of acquired) {
    const cls=catalog.classes.find(entry=>entry.id===id)!
    const ability=cls.spellAbility!
    const classLevel=classLevels[id]
    const domain=subclasses[id]?Object.entries(subclassSpellLists[draft.edition][id]??{}).filter(([level])=>Number(level)<=classLevel).flatMap(([,spells])=>spells):[]
    const land=bonusFeatures.get('circle-land')
    if(id==='druid'&&subclasses.druid&&land)domain.push(...landTypes[land].slice(0,Math.max(0,Math.min(4,Math.floor((classLevel-1)/2)))).flat())
    if(!old&&id==='paladin'&&classLevel>=2)domain.push('divine-smite')
    if(!old&&id==='ranger')domain.push('hunters-mark')
    if(!old&&id==='druid'&&classLevel>=1)domain.push('speak-with-animals')
    for(const [status,ids] of [['Заговор',ledger.cantrips],['Известно',ledger.known],['Подготовлено',ledger.prepared],['В книге',ledger.book.filter(spell=>!ledger.prepared.includes(spell))],['Арканум · 1/долгий отдых',ledger.arcanum],['Всегда подготовлено',domain]] as const)addSpells(id,cls.name,ability,ids,status)
    for(const invocation of ledger.invocations){
      const original=(old?invocations14:invocations24).find(name=>slug(name)===invocation)??invocation
      features.push({name:featureLabel(original),source:'Таинственные воззвания',detail:catalog.descriptions[original]})
    }
  }
  if(knownForms.length)features.push({name:'Знакомые звериные облики',source:'Друид',detail:knownForms.map(id=>beasts.find(beast=>beast.id===id)?.ru??id).join(', ')})
  const spellcasting=Object.entries(progressions).filter(([id,entry])=>id!=='warlock'&&trimSlots(entry.slots).length)
  const casterLevel=sum(spellcasting.map(([id])=>HALF.includes(id)?(old?Math.floor(classLevels[id]/2):Math.ceil(classLevels[id]/2)):classLevels[id]))
  const slots=spellcasting.length>1?FULL_SLOTS[clamp(casterLevel,0,20)]:trimSlots(spellcasting[0]?.[1]?.slots)
  const pact = progressions.warlock?.pactSlots?{count:progressions.warlock.pactSlots,level:progressions.warlock.pactLevel??1}:undefined
  for(const [id, number] of Object.entries(classLevels)){
    const cls=catalog.classes.find(entry=>entry.id===id)!
    const pb=progressions[id]
    const named:Record<string,string>={rage:'Ярость',rages:'Ярость',rageDamage:'Урон ярости',sneakAttack:'Скрытая атака',bardicDie:'Кость вдохновения',channelDivinity:'Божественный канал',sorceryPoints:'Очки чародейства',focusPoints:'Очки сосредоточения',secondWind:'Второе дыхание',wildShape:'Дикий облик',favoredEnemy:'Метка охотника',indomitable:'Несгибаемый',layOnHands:'Наложение рук',martialArts:'Кость боевых искусств',ki:'Очки ци'}
    for(const [key,value] of Object.entries(pb??{}))if(value&&named[key])features.push({name:named[key]+' · '+value,source:cls.name,detail:resourceRecovery(id,key,old,number)})
    if(id==='paladin')features.push({name:'Наложение рук · '+number*5+' хитов',source:cls.name,detail:'Восстанавливается после долгого отдыха.'})
    if(id==='bard')features.push({name:'Вдохновение барда · '+Math.max(1,modifier(values.cha))+' использ.',source:cls.name,detail:number>=5?'Восстанавливается после короткого или долгого отдыха.':'Восстанавливается после долгого отдыха.'})
    if(id==='rogue')features.push({name:'Скрытая атака · '+Math.ceil(number/2)+'d6',source:cls.name})
  }
  const inventory = new Map<string,Gear>()
  for(const item of [...items,...draft.bonusGear]) {
    if(item.quantity<=0)continue
    const recent=inventory.get(item.id)
    inventory.set(item.id,{...item,quantity:item.quantity+(recent?.quantity??0)})
  }
  const mods=statsMap(abilities.map(id=>modifier(values[id])))
  const armorItems=catalog.items.filter(item=>item.kind==='armor'&&item.id!=='shield'&&inventory.has(item.id))
  const shield=inventory.has('shield')&&draft.shield
  const acWithShield=shield?2:0
  const unarmored=[10+mods.dex]
  const firstUnarmored=Object.keys(classLevels).find(id=>id==='barbarian'||id==='monk')
  if(classLevels.barbarian&&(!old||firstUnarmored==='barbarian'))unarmored.push(10+mods.dex+mods.con)
  if(classLevels.monk&&!shield&&(!old||firstUnarmored==='monk'))unarmored.push(10+mods.dex+mods.wis)
  if(classLevels.sorcerer&&subclasses.sorcerer)unarmored.push((old?13:10+mods.cha)+mods.dex)
  const acOf=(id:string)=>{
    const item=armorItems.find(object=>object.id===id)
    if(!item)return Math.max(...unarmored)+acWithShield
    return Number(item.ac)+(item.category==='light'?mods.dex:item.category==='medium'?Math.min(2,mods.dex):0)+acWithShield+Number(styles.has('defense'))
  }
  const armorId=draft.armor==='auto'?[...armorItems.filter(entry=>profs.has(entry.category??'')).map(entry=>entry.id),'none'].sort((a,b)=>acOf(b)-acOf(a))[0]:draft.armor
  if(armorId!=='none'&&!armorItems.some(item=>item.id===armorId))issues.push({step:target+1,message:'Выбранный доспех отсутствует в инвентаре'})
  if(draft.spentGold>gold+draft.bonusGold)issues.push({step:target+1,message:'Покупки превышают доступное золото'})
  if(!draft.name.trim())issues.push({step:target+1,message:'Укажите имя персонажа'})
  const clazz = classLevels
  const wornArmor=armorItems.find(item=>item.id===armorId)
  if(wornArmor?.category!=='heavy'){
    if(clazz.barbarian>=5)speed+=10
    if(!old&&clazz.ranger>=6)speed+=10
  }
  if(clazz.monk>=2&&!wornArmor&&!shield)speed+=clazz.monk>=18?30:10+5*Math.floor((clazz.monk-2)/4)
  if(wornArmor?.strength&&values.str<wornArmor.strength&&!(old&&species?.id==='dwarf'))speed=Math.max(0,speed-10)
  const attacks:Attack[]=[]
  for(const item of catalog.items.filter(item=>item.kind==='weapon'&&(item.id==='unarmed'||inventory.has(item.id)))) {
    const props = Array.isArray(item.properties)?item.properties.join(', '):item.properties??''
    const ranged = !!item.category?.includes('ranged')
    const monkWeapon=!!clazz.monk&&!wornArmor&&!shield&&(item.id==='unarmed'||(old?(item.id==='shortsword'||!!item.category?.startsWith('simple')&&!item.category.includes('ranged')&&!/Heavy|Two-Handed/.test(props)):weaponProficient(new Set(['monk']),item.id,item.category,props)))
    const attackMod=props.includes('Finesse')||monkWeapon?Math.max(mods.str,mods.dex):ranged?mods.dex:mods.str
    const known=weaponProficient(profs,item.id,item.category,props)||monkWeapon
    const damageDie=monkWeapon?monkDamage(clazz.monk,old,item.damage??'1'):(item.damage??'1').split(' ')[0]
    const damageBonus=attackMod+ (styles.has('dueling')&&!ranged&&!props.includes('Two-Handed')&&item.id!=='unarmed'?2:0)
    attacks.push({name:itemLabel(item),bonus:attackMod+(known?proficiency:0)+(ranged&&styles.has('archery')?2:0),damage:damageDie+(damageBonus?' '+sign(damageBonus):''),detail:[ranged?'Дальнобойное':undefined,[...masteries.values()].some(list=>list.includes(item.id))?item.mastery:undefined].filter(Boolean).join(' · ')})
  }
  const skills = skillIds.map(id=>{
    const clValue=Number(bonusFeatures.get('divine-order')==='thaumaturge'&&['arcana','religion'].includes(id))*Math.max(1,mods.wis)
    const drValue=Number(bonusFeatures.get('primal-order')==='magician'&&['arcana','nature'].includes(id))*Math.max(1,mods.wis)
    return {id,name:skillNames[id],value:mods[skillAbility[id]]+(expert.has(id)?2*proficiency:skillSet.has(id)?proficiency:clazz.bard>=2?Math.floor(proficiency/2):0)+clValue+drValue,proficient:skillSet.has(id),expert:expert.has(id)}
  })
  const magicSources:MagicSource[]=[...magic.values()].filter(book=>book.spells.size).map(book=>({
    name:book.name,ability:book.ability,dc:8+mods[book.ability]+proficiency,attack:mods[book.ability]+proficiency,
    spells:[...book.spells].map(([id,status])=>({spell:catalog.spells.find(spell=>spell.id===id)!,status})).sort((a,b)=>a.spell.level-b.spell.level||spellLabel(a.spell).localeCompare(spellLabel(b.spell),'ru')),
  }))
  const initiate = features.some(feature=>feature.name==='Бдительный')
  const durableBase = species?.id==='dwarf'?sum(Object.values(clazz)):0
  const hp=sum(hpDice.map(die=>Math.max(1,die+mods.con)))+durableBase+(clazz.sorcerer&&subclasses.sorcerer?clazz.sorcerer:0)
  if(bonusFeatures.has('breath'))features.push({name:'Дыхание · '+bonusFeatures.get('breath')+' · Сл '+(8+mods.con+proficiency),source:species?.name??'Вид'})
  return {
    name:draft.name.trim()||'Безымянный герой',catalog,edition:draft.edition,level:target,issues,choices,gained,classLevels,subclasses,
    species,background,lineage:bonusFeatures.get('lineage'),size,values,mods,proficiency,experience:XP[target-1], hp,hitDice,armor:acOf(armorId),
    armorId,armorItems,initiative:mods.dex+(!old&&initiate?proficiency:0)+(old&&subclasses.fighter&&clazz.fighter>=7?Math.floor(proficiency/2):0),
    speed,passive:10+ (skills.find(skill=>skill.id==='perception')?.value??mods.wis), skills,
    saves:abilities.map(id=>({id,name:abilityName[id],proficient:saves.has(id),value:mods[id]+(saves.has(id)?proficiency:0)})),
    profs:[...profs].map(id=>equipmentProfs[id]??(catalog.items.find(item=>item.id===id)?.name??id)),tools:[...tools],languages:[...languages],
    features,items:[...inventory.values()].map(entry=>({...entry,name:entry.name??packageLabel(entry.id,catalog)})),gold:Math.max(0,gold+draft.bonusGold-draft.spentGold), slots,pact,magic:magicSources,attacks,ready:issues.length===0,
  }
}
export type Sheet = ReturnType<typeof derive>

function speciesAncestorOptions(){
  return catalogs['2014'].species.find(option=>option.id==='dragonborn')?.lineages??[]
}
function weaponProficient(profs:Set<string>,id:string,category?:string,raw?:string|string[]){
  const props=Array.isArray(raw)?raw.join(', '):raw??''
  return id==='unarmed'||profs.has(id)||!!category&&(
    profs.has(category.split(' ')[0]) ||
    (profs.has('rogue')&&category.startsWith('martial')&&/Finesse|Light/.test(props)) ||
    (profs.has('monk')&&(category.startsWith('simple')&&!category.includes('ranged')&&!/Heavy|Two-Handed/.test(props)||category.startsWith('martial')&&props.includes('Light')))
  )
}
function monkDamage(level:number,old:boolean,damage:string){
  const die=old?level>=17?10:level>=11?8:level>=5?6:4:level>=17?12:level>=11?10:level>=5?8:6
  return die>=(Number(damage.match(/d(\d+)/)?.[1])||0)?'1d'+die:damage
}
function resourceRecovery(id:string,key:string,old:boolean,level:number){
  if(['focusPoints','ki','channelDivinity'].includes(key))return 'Восстанавливается после короткого или долгого отдыха по правилам класса.'
  if(key==='rage'||key==='rages')return old?'Восстанавливается после долгого отдыха.':'1 использование после короткого отдыха, все после долгого.'
  if(key==='wildShape')return old?'Восстанавливается после короткого или долгого отдыха.':'1 использование после короткого отдыха, все после долгого.'
  if(key==='secondWind')return '1 использование после короткого отдыха, все после долгого.'
  if(key==='sorceryPoints'||key==='indomitable'||key==='layOnHands')return 'Восстанавливается после долгого отдыха.'
  return undefined
}
