import source14 from './data/srd2014.json'
import source24 from './data/srd2024.json'
import extra14 from './data/srd2014-extra.json'
import spellRu from './data/spells-ru.json'
import itemRu from './data/items-ru.json'

export type Edition = '2014' | '2024'
export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
export const abilities: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const abilityName: Record<Ability, string> = { str:'Сила', dex:'Ловкость', con:'Телосложение', int:'Интеллект', wis:'Мудрость', cha:'Харизма' }
export const abilityShort = ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР']
export const skillNames = {
  athletics:'Атлетика', acrobatics:'Акробатика', sleight:'Ловкость рук', stealth:'Скрытность',
  arcana:'Магия', history:'История', investigation:'Расследование', nature:'Природа', religion:'Религия',
  animals:'Уход за животными', insight:'Проницательность', medicine:'Медицина', perception:'Внимательность', survival:'Выживание',
  deception:'Обман', intimidation:'Запугивание', performance:'Выступление', persuasion:'Убеждение',
}
export type Skill = keyof typeof skillNames
export const skillAbility: Record<Skill, Ability> = {
  athletics:'str', acrobatics:'dex', sleight:'dex', stealth:'dex', arcana:'int', history:'int', investigation:'int', nature:'int', religion:'int',
  animals:'wis', insight:'wis', medicine:'wis', perception:'wis', survival:'wis', deception:'cha', intimidation:'cha', performance:'cha', persuasion:'cha',
}
export const skillIds = Object.keys(skillNames) as Skill[]
const list = (values: string) => values.split(' ').filter(Boolean)
const skills = (values: string) => list(values) as Skill[]
const stats = (values: string) => list(values) as Ability[]
export const languages14 = ['Дварфский', 'Эльфийский', 'Великаний', 'Гномий', 'Гоблинский', 'Полуросликовый', 'Орочий', 'Бездны', 'Небесный', 'Драконий', 'Глубинный', 'Инфернальный', 'Первичный', 'Сильван', 'Подземный']
export const languages24 = [...languages14.slice(0, 7), 'Драконий', 'Общий жестовый язык']
export const instruments = ['Барабан', 'Виола', 'Волынка', 'Лира', 'Лютня', 'Рожок', 'Свирель', 'Флейта', 'Цимбалы', 'Шалмей']
export const artisanTools = ['Алхимика', 'Гончара', 'Каллиграфа', 'Каменщика', 'Картографа', 'Кожевника', 'Кузнеца', 'Пивовара', 'Плотника', 'Повара', 'Резчика', 'Сапожника', 'Стеклодува', 'Ткача', 'Художника', 'Ювелира']
export const games = ['Игральные кости', 'Игральные карты', 'Драконьи шахматы', 'Трёхдраконовое анте']
export const slug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

export type Item = { id:string; name:string; kind:string; cost?:string|number; damage?:string; ac?:number|string; properties?:string|string[]; mastery?:string; category?:string; range?:string; text?:string; strength?:number }
export type Spell = { id:string; name:string; level:number; classes:string[]; school?:string; text?:string; range?:string; casting?:string; duration?:string; components?:string; ritual?:boolean }
export type Progress = { slots?:number[]; cantrips?:number; prepared?:number; known?:number; mastery?:number; invocations?:number; pactSlots?:number; pactLevel?:number; [key:string]: number | number[] | string | undefined }
type SourceItem = Item & { armorType?:string; weaponType?:string; ranged?:boolean };
type Source = { spellProgressions?:Record<string,Record<string,Progress>>; magicItems?:SourceItem[]; invocations?: (Option & {text?:string; min?:number; requires?:string; repeatable?:boolean})[]; speciesDescriptions?:Record<string,string>; progressions?:Record<string,Record<string,Progress|string[]>>; feats?:Record<string,Option[]>; classDescriptions?:Record<string,Record<string,string>>; subclassFeatures?:Record<string,Record<string,string[]>>; spells:Spell[]; features:Record<string, Record<string, string[]>>; descriptions?:Record<string,string>; items?:SourceItem[]; subclasses?:Record<string,string|{name:string;features:Record<string,string[]>}> }
export type Option = { id:string; name:string; description?:string }
export type Package = { gold:number; items:string[]; selects?:string[][] }

const classRows = [
  ['barbarian','Варвар','Берсерк','Воин ярости и первобытной силы.','str','str con',12,2,'animals athletics intimidation nature perception survival','light medium shield simple martial','shield simple martial','barbarian'],
  ['bard','Бард','Коллегия знаний','Вдохновляет союзников музыкой, магией и словом.','cha','dex cha',8,3,'*','light simple','light instrument','bard'],
  ['cleric','Жрец','Домен жизни','Черпает силу в вере, исцеляет и защищает.','wis','wis cha',8,2,'history insight medicine persuasion religion','light medium shield simple','light medium shield','cleric'],
  ['druid','Друид','Круг земли','Держит связь с природой и принимает облик зверя.','wis','int wis',8,2,'arcana animals insight medicine nature perception religion survival','light shield simple','light shield','druid'],
  ['fighter','Воин','Чемпион','Владеет любым оружием и держит передовую.','str dex','str con',10,2,'acrobatics animals athletics history insight intimidation perception survival','light medium heavy shield simple martial','light medium shield simple martial','fighter'],
  ['monk','Монах','Путь открытой ладони','Полагается на скорость, дисциплину и боевые искусства.','dex wis','str dex',8,2,'acrobatics athletics history insight religion stealth','simple monk','simple monk','monk'],
  ['paladin','Паладин','Клятва преданности','Защищает союзников силой священной клятвы.','str cha','wis cha',10,2,'athletics insight intimidation medicine persuasion religion','light medium heavy shield simple martial','light medium shield simple martial','paladin'],
  ['ranger','Следопыт','Охотник','Выслеживает врагов и ориентируется в дикой местности.','dex wis','str dex',10,3,'animals athletics insight investigation nature perception stealth survival','light medium shield simple martial','light medium shield simple martial','ranger'],
  ['rogue','Плут','Вор','Находит слабые места и действует из тени.','dex','dex int',8,4,'acrobatics athletics deception insight intimidation investigation perception performance persuasion sleight stealth','light simple rogue thieves','light thieves','rogue'],
  ['sorcerer','Чародей','Драконье чародейство','Управляет врождённой магией и изменяет заклинания.','cha','con cha',6,2,'arcana deception insight intimidation persuasion religion','simple','','sorcerer'],
  ['warlock','Колдун','Исчадие','Получает магию через договор с потусторонним покровителем.','cha','wis cha',8,2,'arcana deception history intimidation investigation nature religion','light simple','light','warlock'],
  ['wizard','Волшебник','Школа воплощения','Изучает тайны магии и записывает их в книгу заклинаний.','int','int wis',6,2,'arcana history insight investigation medicine religion','simple','','wizard'],
] as const
const spellAbilities: Record<string, Ability> = { bard:'cha', cleric:'wis', druid:'wis', paladin:'cha', ranger:'wis', sorcerer:'cha', warlock:'cha', wizard:'int' }
const pk = (gold:number, items:string, ...selects:string[]):Package => ({gold,items:items.split('|').filter(Boolean), selects:selects.map(group=>group.split('|'))})
const packs24: Record<string, [Package,number]> = {
  barbarian:[pk(15,'greataxe|handaxe*4|explorer-s-pack'),75],
  bard:[pk(19,'leather-armor|dagger*2|entertainer-s-pack','instrument'),90],
  cleric:[pk(7,'chain-shirt|shield|mace|holy-symbol|priest-s-pack'),110],
  druid:[pk(9,'leather-armor|shield|sickle|quarterstaff|explorer-s-pack|herbalism-kit'),50],
  fighter:[pk(4,'chain-mail|greatsword|flail|javelin*8|dungeoneer-s-pack'),155],
  monk:[pk(11,'spear|dagger*5|explorer-s-pack|monk-tool'),50],
  paladin:[pk(9,'chain-mail|shield|longsword|javelin*6|holy-symbol|priest-s-pack'),150],
  ranger:[pk(7,'studded-leather-armor|scimitar|shortsword|longbow|arrow*20|quiver|druidic-focus|explorer-s-pack'),150],
  rogue:[pk(8,'leather-armor|dagger*2|shortsword|shortbow|arrow*20|quiver|thieves-tools|burglar-s-pack'),100],
  sorcerer:[pk(28,'spear|dagger*2|arcane-focus|dungeoneer-s-pack'),50],
  warlock:[pk(15,'leather-armor|sickle|dagger*2|arcane-focus|book|scholar-s-pack'),100],
  wizard:[pk(5,'dagger*2|quarterstaff|robe|spellbook|scholar-s-pack'),55],
}
export const fighterPack24 = pk(11,'studded-leather-armor|scimitar|shortsword|longbow|arrow*20|quiver|dungeoneer-s-pack')
const packs14: Record<string, Package> = {
  barbarian:pk(0,'javelin*4|explorer-s-pack','greataxe|martial-melee','handaxe*2|simple-weapon'),
  bard:pk(0,'leather-armor|dagger','rapier|longsword|simple-weapon','diplomat-s-pack|entertainer-s-pack','instrument'),
  cleric:pk(0,'shield|holy-symbol','mace|warhammer','scale-mail|leather-armor|chain-mail','light-crossbow-set|simple-weapon','priest-s-pack|explorer-s-pack'),
  druid:pk(0,'leather-armor|explorer-s-pack|druidic-focus','shield|simple-weapon','scimitar|simple-melee'),
  fighter:pk(0,'','chain-mail|fighter-leather','martial-shield|martial-pair','light-crossbow-set|handaxe*2','dungeoneer-s-pack|explorer-s-pack'),
  monk:pk(0,'dart*10','shortsword|simple-weapon','dungeoneer-s-pack|explorer-s-pack'),
  paladin:pk(0,'chain-mail|holy-symbol','martial-shield|martial-pair','javelin*5|simple-melee','priest-s-pack|explorer-s-pack'),
  ranger:pk(0,'longbow|quiver|arrow*20','scale-mail|leather-armor','shortsword*2|simple-pair','dungeoneer-s-pack|explorer-s-pack'),
  rogue:pk(0,'leather-armor|dagger*2|thieves-tools','rapier|shortsword','shortbow-set|shortsword','burglar-s-pack|dungeoneer-s-pack|explorer-s-pack'),
  sorcerer:pk(0,'dagger*2','light-crossbow-set|simple-weapon','component-pouch|arcane-focus','dungeoneer-s-pack|explorer-s-pack'),
  warlock:pk(0,'leather-armor|dagger*2','light-crossbow-set|simple-weapon','component-pouch|arcane-focus','scholar-s-pack|dungeoneer-s-pack','simple-weapon'),
  wizard:pk(0,'spellbook','quarterstaff|dagger','component-pouch|arcane-focus','scholar-s-pack|explorer-s-pack'),
}
const style14: Record<string,string> = { monk:'shortsword', rogue:'rapier shortsword longsword hand-crossbow', sorcerer:'dagger dart sling quarterstaff light-crossbow', wizard:'dagger dart sling quarterstaff light-crossbow', druid:'club dagger dart javelin mace quarterstaff scimitar sickle sling spear' }
const startingWealth14: Record<string,number> = { barbarian:2,bard:5,cleric:5,druid:2,fighter:5,monk:5,paladin:5,ranger:5,rogue:4,sorcerer:3,warlock:4,wizard:4 }
export function goldDice14(id:string) { return startingWealth14[id] || 0 }
const subclass14:Record<string,number> = { barbarian:3,bard:3,cleric:1,druid:2,fighter:3,monk:3,paladin:3,ranger:3,rogue:3,sorcerer:1,warlock:1,wizard:2 }
export type ClassInfo = Option & { subclass:string; hp:number; primary:Ability[]; saves:Ability[]; skillCount:number; skills:Skill[]; profs:string[]; multiclass:string[]; pack:Package; cash:number; spellAbility?:Ability; subclassAt:number }
function makeClasses(edition:Edition): ClassInfo[] {
  return classRows.map(([id,name,subclass,description,primary,saves,hp,count,skillList,profs,multiclass]) => {
    let fullProfs = list(profs)
    let multiProfs = list(multiclass)
    let available = skillList === '*' ? skillIds : skills(skillList)
    if (edition === '2014') {
      if (style14[id]) fullProfs = [...fullProfs.filter(prof=>!['simple','monk','rogue'].includes(prof)), ...list(style14[id])]
      if (id==='druid') { fullProfs.push('medium'); multiProfs = ['light','medium','shield'] }
      if (id==='bard') fullProfs.push('hand-crossbow','longsword','rapier','shortsword')
      if (id==='rogue') fullProfs.push('simple')
      if (id==='monk') { fullProfs.push('simple'); multiProfs = ['simple','shortsword'] }
      if (id==='fighter') available = available.filter(skill=>skill!=='persuasion')
    } else {
      if (id==='fighter') available = [...available, 'persuasion']
      if (id==='wizard') available = [...available, 'nature']
      if (id==='monk') multiProfs = []
      if (id==='paladin') available = [...available, 'intimidation' as const].filter((skill,index, all)=>all.indexOf(skill)===index)
    }
    return {id,name,subclass,description,primary:stats(primary),saves:stats(saves),hp,skillCount:count,skills:available,profs:fullProfs,multiclass:multiProfs,
      pack:edition==='2024'?packs24[id][0]:packs14[id],cash:edition==='2024'?packs24[id][1]:0,spellAbility:spellAbilities[id],subclassAt:edition==='2024'?3:subclass14[id]}
  })
}
export type Species = Option & { speed:number; size:string; traits:string[]; bonuses?:Partial<Record<Ability,number>>; lineages?:Option[]; languages?:string[] }
const names = (pairs: string) => pairs.split('|').map(part=>{ const [id,name,description]=part.split(':'); return { id,name,description } })
const dragon = names('black:Чёрный:Кислота|blue:Синий:Электричество|brass:Латунный:Огонь|bronze:Бронзовый:Электричество|copper:Медный:Кислота|gold:Золотой:Огонь|green:Зелёный:Яд|red:Красный:Огонь|silver:Серебряный:Холод|white:Белый:Холод')
const species24: Species[] = [
  {id:'dragonborn',name:'Драконорождённый',description:'Наследие драконов, стихийное дыхание и сопротивление стихии.',speed:30,size:'Средний',traits:['Драконье происхождение','Оружие дыхания','Сопротивление урону','Тёмное зрение 60 фт.'],lineages:dragon},
  {id:'dwarf',name:'Дварф',description:'Выносливый народ с прочной связью с камнем.',speed:30,size:'Средний',traits:['Тёмное зрение 120 фт.','Сопротивление яду','Дварфская стойкость (+1 хит за уровень)','Знание камня']},
  {id:'elf',name:'Эльф',description:'Долгожитель с обострёнными чувствами и магическим наследием.',speed:30,size:'Средний',traits:['Тёмное зрение 60 фт.','Происхождение фей','Обострённые чувства','Транс'],lineages:names('drow:Дроу:Тёмное зрение 120 фт.|high:Высший эльф:Магическое наследие|wood:Лесной эльф:Скорость 35 фт.')},
  {id:'gnome',name:'Гном',description:'Маленький изобретатель или лесной чародей.',speed:30,size:'Маленький',traits:['Тёмное зрение 60 фт.','Хитрость гномов'],lineages:names('forest:Лесной гном|rock:Скальный гном')},
  {id:'goliath',name:'Голиаф',description:'Потомок великанов, наделённый силой своего предка.',speed:35,size:'Средний',traits:['Наследие великанов','Мощное телосложение'],lineages:names('cloud:Облачный великан|fire:Огненный великан|frost:Морозный великан|hill:Холмовой великан|stone:Каменный великан|storm:Штормовой великан')},
  {id:'halfling',name:'Полурослик',description:'Маленький, проворный и удивительно везучий.',speed:30,size:'Маленький',traits:['Везучий','Храбрый','Проворство полурослика','Природная скрытность']},
  {id:'human',name:'Человек',description:'Находчивый и разносторонний. Получает навык и дополнительную черту происхождения.',speed:30,size:'Маленький или средний',traits:['Находчивость','Умелость','Разносторонность']},
  {id:'orc',name:'Орк',description:'Крепкий странник, способный выстоять там, где другие падают.',speed:30,size:'Средний',traits:['Всплеск адреналина','Тёмное зрение 120 фт.','Неукротимая стойкость']},
  {id:'tiefling',name:'Тифлинг',description:'Наследие Нижних планов даёт врождённые заклинания.',speed:30,size:'Маленький или средний',traits:['Тёмное зрение 60 фт.','Потустороннее присутствие'],lineages:names('abyssal:Бездны:Сопротивление яду|chthonic:Хтонический:Сопротивление некротическому урону|infernal:Инфернальный:Сопротивление огню')},
]
const findSpecies = (id:string) => species24.find(entry=>entry.id===id)!
const species14: Species[] = [
  {...findSpecies('dwarf'),speed:25,bonuses:{con:2,wis:1},traits:['Тёмное зрение 60 фт.','Дварфская устойчивость','Боевые навыки дварфов','Знание камня','Дварфская стойкость (+1 хит за уровень)'],languages:['Дварфский'],lineages:undefined,description:'Холмовой дварф. Телосложение +2, Мудрость +1.'},
  {...findSpecies('elf'),speed:30,bonuses:{dex:2,int:1},traits:['Тёмное зрение 60 фт.','Обострённые чувства','Наследие фей','Транс','Владение эльфийским оружием'],languages:['Эльфийский'],lineages:undefined,description:'Высший эльф. Ловкость +2, Интеллект +1.'},
  {...findSpecies('halfling'),speed:25,bonuses:{dex:2,cha:1},traits:['Везучий','Храбрый','Проворство полурослика','Природная скрытность'],languages:['Полуросликовый'],description:'Легконогий полурослик. Ловкость +2, Харизма +1.'},
  {...findSpecies('human'),size:'Средний',bonuses:{str:1,dex:1,con:1,int:1,wis:1,cha:1},traits:[],description:'Все шесть характеристик повышаются на 1.'},
  {...findSpecies('dragonborn'),bonuses:{str:2,cha:1},traits:['Драконье происхождение','Оружие дыхания','Сопротивление урону'],languages:['Драконий'],description:'Сила +2, Харизма +1. Дыхание предка.'},
  {...findSpecies('gnome'),speed:25,bonuses:{int:2,con:1},traits:['Тёмное зрение 60 фт.','Гномья хитрость','Знание ремесла','Механик'],lineages:undefined,languages:['Гномий'],description:'Скальный гном. Интеллект +2, Телосложение +1.'},
  {id:'half-elf',name:'Полуэльф',description:'Харизма +2. Два навыка и две прибавки на выбор.',speed:30,size:'Средний',traits:['Тёмное зрение 60 фт.','Наследие фей','Разносторонность'],bonuses:{cha:2},languages:['Эльфийский']},
  {id:'half-orc',name:'Полуорк',description:'Сила +2, Телосложение +1. Стойкость и свирепость.',speed:30,size:'Средний',traits:['Тёмное зрение 60 фт.','Угрожающий вид','Непоколебимая стойкость','Свирепые атаки'],bonuses:{str:2,con:1},languages:['Орочий']},
  {...findSpecies('tiefling'),size:'Средний',bonuses:{int:1,cha:2},traits:['Тёмное зрение 60 фт.','Адское сопротивление','Инфернальное наследие'],lineages:undefined,languages:['Инфернальный'],description:'Интеллект +1, Харизма +2. Магия Нижних планов.'},
]
export type Background = Option & { skills:Skill[]; scores:Ability[]; feat?:string; tool?:string; pack:Package }
const backgrounds24: Background[] = [
  {id:'acolyte',name:'Послушник',description:'Герой, воспитанный в храме или религиозном ордене.',skills:['insight','religion'],scores:['int','wis','cha'],feat:'initiate-cleric',tool:'Инструменты каллиграфа',pack:pk(8,'calligraphers-supplies|book|holy-symbol|parchment*10|robe')},
  {id:'criminal',name:'Преступник',description:'Уличная школа ловкости и тихих дел.',skills:['sleight','stealth'],scores:['dex','con','int'],feat:'alert',tool:'Воровские инструменты',pack:pk(16,'dagger*2|thieves-tools|crowbar|pouch*2|travelers-clothes')},
  {id:'sage',name:'Мудрец',description:'Учёный архивов, библиотек или магических традиций.',skills:['arcana','history'],scores:['con','int','wis'],feat:'initiate-wizard',tool:'Инструменты каллиграфа',pack:pk(8,'quarterstaff|calligraphers-supplies|book|parchment*8|robe')},
  {id:'soldier',name:'Солдат',description:'Служба приучила к оружию и дисциплине.',skills:['athletics','intimidation'],scores:['str','dex','con'],feat:'savage-attacker',tool:'game',pack:pk(14,'spear|shortbow|arrow*20|game|healers-kit|quiver|travelers-clothes')},
]
const backgrounds14: Background[] = [
  {...backgrounds24[0],scores:[],feat:undefined,tool:undefined,pack:pk(15,'holy-symbol|prayer-book|incense*5|vestments|common-clothes|pouch'),description:'Два языка, навыки Проницательности и Религии, приют единоверцев.'},
]
const commonItems: Item[] = [
  {id:'unarmed',name:'Безоружный удар',kind:'weapon',damage:'1',category:'unarmed',properties:[]},
  ...[
  ['club','Дубинка','1d4','simple','Light'],['dagger','Кинжал','1d4','simple','Finesse, Light, Thrown'],['greatclub','Палица','1d8','simple','Two-Handed'],
  ['handaxe','Ручной топор','1d6','simple','Light, Thrown'],['javelin','Метательное копьё','1d6','simple','Thrown'],['light-hammer','Лёгкий молот','1d4','simple','Light, Thrown'],
  ['mace','Булава','1d6','simple',''],['quarterstaff','Боевой посох','1d6','simple','Versatile (1d8)'],['sickle','Серп','1d4','simple','Light'],['spear','Копьё','1d6','simple','Thrown, Versatile (1d8)'],
  ['light-crossbow','Лёгкий арбалет','1d8','simple ranged','Ammunition, Loading, Two-Handed'],['dart','Дротик','1d4','simple ranged','Finesse, Thrown'],['shortbow','Короткий лук','1d6','simple ranged','Ammunition, Two-Handed'],['sling','Праща','1d4','simple ranged','Ammunition'],
  ['battleaxe','Боевой топор','1d8','martial','Versatile (1d10)'],['flail','Цеп','1d8','martial',''],['glaive','Глефа','1d10','martial','Heavy, Reach, Two-Handed'],['greataxe','Секира','1d12','martial','Heavy, Two-Handed'],['greatsword','Двуручный меч','2d6','martial','Heavy, Two-Handed'],['halberd','Алебарда','1d10','martial','Heavy, Reach, Two-Handed'],
  ['lance','Длинное копьё','1d12','martial','Reach, Special'],['longsword','Длинный меч','1d8','martial','Versatile (1d10)'],['maul','Кувалда','2d6','martial','Heavy, Two-Handed'],['morningstar','Моргенштерн','1d8','martial',''],['pike','Пика','1d10','martial','Heavy, Reach, Two-Handed'],
  ['rapier','Рапира','1d8','martial','Finesse'],['scimitar','Скимитар','1d6','martial','Finesse, Light'],['shortsword','Короткий меч','1d6','martial','Finesse, Light'],['trident','Трезубец','1d6','martial','Thrown, Versatile (1d8)'],['war-pick','Боевая кирка','1d8','martial',''],['warhammer','Боевой молот','1d8','martial','Versatile (1d10)'],['whip','Кнут','1d4','martial','Finesse, Reach'],
  ['blowgun','Духовая трубка','1','martial ranged','Ammunition, Loading'],['hand-crossbow','Ручной арбалет','1d6','martial ranged','Ammunition, Light, Loading'],['heavy-crossbow','Тяжёлый арбалет','1d10','martial ranged','Ammunition, Heavy, Loading, Two-Handed'],['longbow','Длинный лук','1d8','martial ranged','Ammunition, Heavy, Two-Handed'],
  ].map(([id,name,damage,category,properties])=>({id,name,damage,category,properties,kind:'weapon'})),
  ...[
  ['padded-armor','Стёганый доспех','11','light'],['leather-armor','Кожаный доспех','11','light'],['studded-leather-armor','Проклёпанная кожа','12','light'],
  ['hide-armor','Шкурный доспех','12','medium'],['chain-shirt','Кольчужная рубаха','13','medium'],['scale-mail','Чешуйчатый доспех','14','medium'],['breastplate','Кираса','14','medium'],['half-plate','Полулаты','15','medium'],
  ['ring-mail','Колечный доспех','14','heavy'],['chain-mail','Кольчуга','16','heavy'],['splint-armor','Наборный доспех','17','heavy'],['plate-armor','Латы','18','heavy'],['shield','Щит','2','shield'],
  ].map(([id,name,ac,category])=>({id,name,ac:Number(ac),category,kind:'armor',strength:({ 'chain-mail':13,'splint-armor':15,'plate-armor':15 } as Record<string,number>)[id]})),
  ...names('explorer-s-pack:Набор путешественника|dungeoneer-s-pack:Набор исследователя подземелий|entertainer-s-pack:Набор артиста|diplomat-s-pack:Набор дипломата|scholar-s-pack:Набор учёного|priest-s-pack:Набор священника|burglar-s-pack:Набор взломщика|arcane-focus:Магическая фокусировка|druidic-focus:Друидическая фокусировка|holy-symbol:Священный символ|spellbook:Книга заклинаний|component-pouch:Мешочек с компонентами|quiver:Колчан|arrow:Стрела|bolts:Арбалетные болты|robe:Мантия|pouch:Кошель|book:Книга|travelers-clothes:Одежда путешественника|common-clothes:Обычная одежда|thieves-tools:Воровские инструменты|calligraphers-supplies:Инструменты каллиграфа|herbalism-kit:Набор травника|healers-kit:Набор лекаря|crowbar:Ломик|parchment:Пергамент|prayer-book:Молитвенник|incense:Благовония|vestments:Облачение').map(item=>({...item,kind:'gear'})),
]
const alternateIds: Record<string,string> = { 'padded':'padded-armor','leather':'leather-armor','studded-leather':'studded-leather-armor','hide':'hide-armor','splint':'splint-armor','plate':'plate-armor','crossbow-light':'light-crossbow','crossbow-hand':'hand-crossbow','crossbow-heavy':'heavy-crossbow' }
const spellNames: Record<string,string> = Object.fromEntries(names('acid-splash:Брызги кислоты|aid:Подмога|alarm:Сигнал тревоги|animal-friendship:Дружба с животными|bane:Порча|bless:Благословение|burning-hands:Огненные ладони|charm-person:Очарование личности|chill-touch:Леденящее прикосновение|command:Приказ|cure-wounds:Лечение ран|dancing-lights:Пляшущие огоньки|detect-magic:Обнаружение магии|detect-poison-and-disease:Обнаружение яда и болезней|disguise-self:Маскировка|divine-favor:Божественное благоволение|eldritch-blast:Мистический заряд|entangle:Опутывание|feather-fall:Плавное падение|fire-bolt:Огненный снаряд|fireball:Огненный шар|fog-cloud:Туманное облако|goodberry:Чудо-ягоды|guidance:Указание|guiding-bolt:Направляющий снаряд|healing-word:Лечащее слово|hex:Сглаз|hunters-mark:Метка охотника|inflict-wounds:Нанесение ран|light:Свет|longstrider:Скороход|mage-armor:Доспехи мага|mage-hand:Волшебная рука|magic-missile:Волшебная стрела|mending:Починка|message:Сообщение|minor-illusion:Малая иллюзия|misty-step:Туманный шаг|poison-spray:Ядовитые брызги|prestidigitation:Фокусы|produce-flame:Сотворение пламени|protection-from-evil-and-good:Защита от добра и зла|ray-of-frost:Луч холода|resistance:Сопротивление|sacred-flame:Священное пламя|shield:Щит|shield-of-faith:Щит веры|shillelagh:Дубинка|shocking-grasp:Электрошок|silent-image:Безмолвный образ|sleep:Сон|spare-the-dying:Уход за умирающим|speak-with-animals:Разговор с животными|thaumaturgy:Чудотворство|thunderwave:Волна грома|true-strike:Верный удар|vicious-mockery:Злая насмешка|wish:Исполнение желаний|counterspell:Контрзаклинание|darkness:Тьма|daylight:Дневной свет|detect-thoughts:Обнаружение мыслей|dispel-magic:Рассеивание магии|divine-smite:Божественная кара|faerie-fire:Огонь фей|find-familiar:Поиск фамильяра|fly:Полёт|haste:Ускорение|hellish-rebuke:Адское возмездие|identify:Опознание|invisibility:Невидимость|knock:Открывание|levitate:Левитация|mirror-image:Отражения|revivify:Возрождение|scorching-ray:Палящий луч|slow:Замедление|spiritual-weapon:Духовное оружие|stinking-cloud:Зловонное облако|teleport:Телепортация|web:Паутина').map(x=>[x.id,x.name]))
export const spellLabel = (spell:Spell) => (spellRu as Record<string,string>)[spell.id] ?? spellNames[spell.id] ?? spell.name
export const itemLabel = (item:Item) => commonItems.find(entry=>entry.id===item.id)?.name ?? (itemRu as Record<string,string>)[item.id] ?? item.name

function makeCatalog(edition:Edition, source:Source) {
  const items = new Map(commonItems.map(item=>[item.id,item]))
  const aliases = Object.fromEntries(commonItems.filter(i=>i.id.includes('-s-pack')).map(i=>[i.id.replace('-s-pack','s-pack'),i.id]))
  for (const sourceItem of [...(source.items ?? []),...(source.magicItems??[])]) {
    const id = alternateIds[sourceItem.id] ?? aliases[sourceItem.id] ?? sourceItem.id
    const known = items.get(id)
    const baseCategory = (sourceItem.category??sourceItem.weaponType??'').toLowerCase()
    const category = sourceItem.kind==='weapon' && baseCategory ? (baseCategory.includes('martial')?'martial':'simple')+(baseCategory.includes('ranged')||sourceItem.ranged?' ranged':'') : sourceItem.armorType??sourceItem.category
    const original = {...sourceItem,id,category}
    items.set(id,known ? {...original,...known,cost:sourceItem.cost,mastery:sourceItem.mastery,text:sourceItem.text} : original)
  }
  const subclassFeatures = source.subclassFeatures ?? Object.fromEntries(Object.entries(source.subclasses??{}).flatMap(([id,value])=>typeof value==='string'?[]:[[id,value.features]]))
  if (edition==='2024') {
    for (const [id, damage] of [['lance','1d10'],['trident','1d8']] as const) {
      const item = items.get(id)!
      items.set(id,{...item,damage})
    }
  }
  return {classes:makeClasses(edition),species:edition==='2024'?species24:species14,backgrounds:edition==='2024'?backgrounds24:backgrounds14,
    spells:source.spells,features:source.features,descriptions:source.descriptions??{},classDescriptions:source.classDescriptions??{},subclasses:source.subclasses??{},subclassFeatures,progressions:source.spellProgressions??source.progressions??{},feats:source.feats??{},invocations:source.invocations??[],speciesDescriptions:source.speciesDescriptions??{},items:[...items.values()]}
}
export const catalogs = {'2014':makeCatalog('2014', {...source14, magicItems:extra14.magicItems} as Source),'2024':makeCatalog('2024', source24 as Source)}
export type Catalog = typeof catalogs[Edition]
export const weaponGroups = ['simple-weapon','simple-melee','simple-pair','martial-melee','martial-shield','martial-pair']
export const fixedPackages:Record<string,string[]> = {
  'fighter-leather':['leather-armor','longbow','arrow*20'],
  'light-crossbow-set':['light-crossbow','bolts*20'],
  'shortbow-set':['shortbow','arrow*20'],
}
export const packageNames: Record<string,string> = {'simple-weapon':'Простое оружие','simple-melee':'Простое рукопашное оружие','simple-pair':'Два простых рукопашных оружия','martial-melee':'Воинское рукопашное оружие','martial-shield':'Воинское оружие и щит','martial-pair':'Два воинских оружия','fighter-leather':'Кожаный доспех, длинный лук и 20 стрел','light-crossbow-set':'Лёгкий арбалет и 20 болтов','shortbow-set':'Короткий лук и 20 стрел',instrument:'Музыкальный инструмент',artisan:'Ремесленные инструменты',game:'Игровой набор'}
export function packageLabel(id:string,catalog:Catalog) {
  const [key,count] = id.split('*')
  const item = catalog.items.find(entry=>entry.id===key)
  const title = packageNames[key] ?? (item ? itemLabel(item) : key)
  return count ? title+' × '+count : title
}
