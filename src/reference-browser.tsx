import { useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { catalogFor, itemLabel, spellLabel, type Edition } from './catalog'
import { displaySource, isUnofficial, normalizeName, reference } from './reference'

const sections = [
  ['spells','Заклинания'],['classes','Классы'],['subclasses','Подклассы'],['species','Происхождение'],
  ['backgrounds','Предыстории'],['feats','Черты'],['items','Снаряжение'],
] as const
type Section=typeof sections[number][0]
type Card={id:string; name:string; ru:string; url:string; source?:string; sourceGroup?:string; classes?:string[]; level?:number; note?:string; extra?:boolean}

function browse(edition:Edition,section:Section):Card[] {
  const ref=reference[edition]
  if(section==='spells'){
    const catalog=catalogFor(edition,'all')
    return catalog.spells.map(spell=>({...spell,ru:spellLabel(spell),url:spell.url??'',note:spell.level===0?'Заговор':spell.level+' уровень',
      extra:!!spell.url&&(/\/homebrew\//.test(spell.url)||isUnofficial({...spell,ru:spellLabel(spell),url:spell.url}))}))
  }
  if(section==='items'){
    return catalogFor(edition,'all').items.map(item=>({...item,ru:itemLabel(item),url:item.url??'',note:[item.rarity,item.attunement?'Настройка':undefined,item.cost].filter(Boolean).join(' · '),extra:/\/homebrew\//.test(item.url??'')}))
  }
  if(section==='classes'){
    const listed=catalogFor(edition,'all').classes
    const extras=ref.classes.filter(entry=>!listed.some(cls=>cls.id===entry.id))
    return [...listed.map(cls=>({id:cls.id,name:cls.id,ru:cls.name,url:ref.classes.find(entry=>entry.id===cls.id)?.url??(edition==='2024'?'https://next.dnd.su/class/'+cls.id:'https://dnd.su/class/'),
      source:ref.classes.find(entry=>entry.id===cls.id)?.source??(edition==='2024'?'PH24':'PH14'),note:'Кость хитов 1к'+cls.hp})),...extras.map(entry=>({...entry,extra:isUnofficial(entry)}))]
  }
  return ref[section].map(entry=>({...entry,extra:isUnofficial(entry),note:'classId' in entry?catalogFor(edition,'official').classes.find(cls=>cls.id===entry.classId)?.name??entry.classId:entry.category}))
}
export function ReferenceBrowser({initialEdition}:{initialEdition:Edition}) {
  const [edition,setEdition]=useState(initialEdition)
  const [section,setSection]=useState<Section>('spells')
  const [query,setQuery]=useState('')
  const [source,setSource]=useState('')
  const [cls,setClass]=useState('')
  const [level,setLevel]=useState('')
  const [extra,setExtra]=useState(false)
  const [limit,setLimit]=useState(24)
  const cards=useMemo(()=>browse(edition,section),[edition,section])
  const available=useMemo(()=>cards.filter(card=>extra||!card.extra),[cards,extra])
  const sources=useMemo(()=>[...new Set(available.map(displaySource))].sort((a,b)=>a.localeCompare(b,'ru')),[available])
  const all=useMemo(()=>{
    const words=normalizeName(query).split(' ').filter(Boolean)
    return available.filter(card=>(!source||displaySource(card)===source)&&(!cls||card.classes?.includes(cls))&&(!level||card.level===Number(level))&&
      words.every(word=>normalizeName([card.ru,card.name,card.id,displaySource(card)].join(' ')).includes(word)))
  },[available,source,query,cls,level])
  const reset=()=>{setSource('');setClass('');setLevel('');setLimit(24)}
  return <div className="reference-browser">
    <div className="segmented reference-editions">{(['2014','2024'] as const).map(year=><button key={year} type="button" aria-pressed={year===edition} onClick={()=>{setEdition(year);reset()}}>D&D {year}</button>)}</div>
    <div className="segmented reference-tabs" aria-label="Раздел справочника">{sections.map(([id,name])=><button key={id} type="button" aria-pressed={id===section} onClick={()=>{setSection(id);reset()}}>{name}</button>)}</div>
    <label className="search-field"><Search size={16}/><input autoFocus aria-label="Поиск по справочнику" placeholder="Название по-русски или по-английски" value={query} onChange={event=>{setQuery(event.target.value);setLimit(24)}}/></label>
    <div className="reference-filters">
      <label className="field">Источник<select value={source} onChange={event=>{setSource(event.target.value);setLimit(24)}}><option value="">Все источники</option>{sources.map(book=><option key={book}>{book}</option>)}</select></label>
      {section==='spells'&&<>
        <label className="field">Класс<select value={cls} onChange={event=>{setClass(event.target.value);setLimit(24)}}><option value="">Все классы</option>{catalogFor(edition,'official').classes.map(entry=><option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
        <label className="field">Уровень<select value={level} onChange={event=>{setLevel(event.target.value);setLimit(24)}}><option value="">Все уровни</option><option value="0">Заговоры</option>{Array.from({length:9},(_,i)=><option key={i+1}>{i+1}</option>)}</select></label>
      </>}
      <label className="toggle"><input type="checkbox" checked={extra} onChange={event=>{setExtra(event.target.checked);setSource('');setLimit(24)}}/> Партнёрские, плейтест и Homebrew</label>
    </div>
    <p className="field-note" aria-live="polite">Найдено · {all.length.toLocaleString('ru')}</p>
    <div className="reference-list">
      {all.slice(0,limit).map(card=><div key={card.id+card.url} className="reference-row">
        <div><strong>{card.ru}</strong><span>{[card.note,card.ru===card.name?undefined:card.name,displaySource(card)].filter(Boolean).join(' · ')}</span></div>
        {card.url&&<a href={card.url} target="_blank" rel="noreferrer" aria-label={card.ru+' на dnd.su'}>dnd.su <ArrowUpRight size={14}/></a>}
      </div>)}
      {all.length===0&&<p className="muted">Ничего не найдено.</p>}
    </div>
    {all.length>limit&&<button type="button" className="secondary" onClick={()=>setLimit(limit+24)}>Показать ещё</button>}
  </div>
}
