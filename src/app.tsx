import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Compass, Dice5, Feather, Flame, Footprints, Gem, Heart, ImagePlus, Library, Minus,
  Plus, ScrollText, Search, Shield, Sparkles, Sword, Swords, Trash2, Users, X,
} from 'lucide-react'
import { abilities, abilityName, abilityShort, catalogs, goldDice14, itemLabel, packageLabel, spellLabel, type ClassInfo, type Edition, type Item, type Option } from './catalog'
import { createDraft, derive, multiclassRequirements, pointCost, rollDie, rollScores, sign, STANDARD, type Choice, type Draft, type Level, type Sheet } from './rules'
import { deleteDraft, loadDrafts, saveDraft } from './storage'
import { CharacterSheet } from './sheet'

const ART = import.meta.env.BASE_URL + 'art/adventurer.webp'
const STAGES = [
  {id:'setup',name:'Кампания',icon:Compass},
  {id:'origin',name:'Происхождение',icon:Flame},
  {id:'abilities',name:'Характеристики',icon:Activity},
  {id:'level:1',name:'Развитие',icon:Swords},
  {id:'story',name:'Анкета',icon:ScrollText},
]
const TITLES:Record<string,[string,string]> = {
  setup:['Начало пути','Выберите правила кампании и уровень, с которого начнётся история вашего героя.'],
  origin:['Происхождение','Решите, кто ваш герой, где он вырос и чему научился.'],
  abilities:['Характеристики','Распределите шесть показателей, которые определяют возможности героя.'],
  story:['Последние штрихи','Дайте герою имя, добавьте историю и подготовьте снаряжение к приключению.'],
  sheet:['Лист персонажа','Все выбранные способности и игровые показатели героя.'],
}
const RULES_URL='https://www.dndbeyond.com/srd'
const LICENSE_URL='https://creativecommons.org/licenses/by/4.0/legalcode'
const CLASSES_ICONS:Record<string,typeof Sword>={barbarian:Swords,bard:Feather,cleric:Sparkles,druid:Flame,fighter:Sword,monk:Activity,paladin:Shield,ranger:Compass,rogue:Feather,sorcerer:Flame,warlock:Gem,wizard:BookOpen}
type Change = (action:(draft:Draft)=>Draft)=>void

function Brand() {
  return <span className="brand"><span className="brand-mark"><Dice5 size={25} strokeWidth={1.75} /></span><span>Кузница <strong>персонажей</strong><small>РЕДАКТОР D&D</small></span></span>
}

function Dialog({title, close, children}:{title:string;close:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{ref.current?.showModal()},[])
  return <dialog ref={ref} onCancel={close} onClick={event=>{if(event.target===event.currentTarget)close()}}>
    <div className="dialog-content"><div className="section-header"><h2>{title}</h2><button className="icon-button" type="button" onClick={close} aria-label="Закрыть"><X size={19}/></button></div>{children}</div>
  </dialog>
}

function ChoiceField({choice,change,spells}:{choice:Choice;change:(value:string[])=>void;spells?:Sheet['catalog']['spells']}) {
  const [search,setSearch]=useState('')
  const [open,setOpen]=useState(false)
  const [detail,setDetail]=useState('')
  const visible=choice.options.filter(option=>[option.name,option.id,option.description].some(value=>value?.toLowerCase().includes(search.toLowerCase())))
  const many=choice.options.length>10
  const toggle=(id:string)=>{
    if(choice.value.includes(id))change(choice.value.filter(value=>value!==id))
    else if(choice.count===1){change([id]);setOpen(false)}
    else if(choice.value.length<choice.count)change([...choice.value,id])
  }
  const found=spells?.find(spell=>spell.id===detail)
  return <fieldset className="choice-field">
    <legend>{choice.name} <span>{choice.optional?'по желанию':choice.value.length+'/'+choice.count}</span></legend>
    {many&&<button type="button" className="select-opener" aria-expanded={open} onClick={()=>setOpen(!open)}>
      {choice.value.length?choice.value.map(value=>choice.options.find(option=>option.id===value)?.name).join(', '):'Выбрать…'}<ChevronDown size={17}/></button>}
    {(!many||open)&&<>
      {many&&<label className="search-field"><Search size={16}/><input aria-label={'Поиск · '+choice.name} value={search} placeholder="Поиск" onChange={e=>setSearch(e.target.value)}/></label>}
      <div className={many?'choice-list scroll-list':'choice-list'}>
        {visible.map(option=><div className="choice-option" key={option.id}>
          <button type="button" aria-pressed={choice.value.includes(option.id)} className="choice-chip" disabled={choice.count>1&&choice.value.length>=choice.count&&!choice.value.includes(option.id)} onClick={()=>toggle(option.id)} title={option.description}>
            {choice.value.includes(option.id)?<Check size={14}/>:<span className="choice-dot"/>}<span>{option.name}{option.description && <small>{option.description}</small>}</span>
          </button>
          {spells?.some(spell=>spell.id===option.id)&&<button type="button" className="icon-button spell-info" aria-label={'О заклинании '+option.name} onClick={()=>setDetail(option.id)}><CircleHelp size={15}/></button>}
        </div>)}
        {visible.length===0&&<p className="muted empty">Нет совпадений.</p>}
      </div>
    </>}
    {found&&<Dialog title={spellLabel(found)} close={()=>setDetail('')}><p className="muted">{found.name} · {found.level===0?'Заговор':'Уровень '+found.level}</p><p className="reference-text">{found.text}</p></Dialog>}
  </fieldset>
}

function Choices({choices,onChange,sheet}:{choices:Choice[];onChange:(id:string,value:string[])=>void;sheet:Sheet}) {
  return <div className="choices">{choices.map(choice=><ChoiceField key={choice.id} choice={choice} change={value=>onChange(choice.id,value)} spells={choice.options.some(option=>sheet.catalog.spells.some(spell=>spell.id===option.id))?sheet.catalog.spells:undefined}/>)}</div>
}

function Panel({title,icon:Icon,children,description}:{title:string;icon?:typeof Compass;children:ReactNode;description?:string}) {
  return <section className="panel">
    <div className="panel-heading">{Icon&&<span className="panel-icon"><Icon size={19}/></span>}<div><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>
    {children}
  </section>
}

function Stepper({value,change,label,min=1,max=20}:{value:number;change:(value:number)=>void;label:string;min?:number;max?:number}) {
  return <div className="stepper">
    <button type="button" className="icon-button" onClick={()=>change(value-1)} disabled={value<=min} aria-label={'Уменьшить · '+label}><Minus size={16}/></button>
    <input type="number" aria-label={label} inputMode="numeric" min={min} max={max} value={value} onChange={event=>{const next=Number(event.target.value); if(Number.isInteger(next)&&next>=min&&next<=max)change(next)}}/>
    <button type="button" className="icon-button" onClick={()=>change(value+1)} disabled={value>=max} aria-label={'Увеличить · '+label}><Plus size={16}/></button>
  </div>
}

function Setup({draft,update,edition,locked}:{draft:Draft;update:Change;edition:(value:Edition)=>void;locked:boolean}) {
  return <>
    <Panel title="Правила кампании" icon={BookOpen} description="Выберите редакцию, по которой вы будете играть.">
      <div className="edition-grid">
        {(['2024','2014'] as const).map(year=><button key={year} type="button" aria-pressed={draft.edition===year} disabled={locked&&draft.edition!==year} className="edition-card" onClick={()=>edition(year)}>
          <span className="edition-icon">{year==='2024'?<BookOpen size={22} strokeWidth={1.65}/>:<ScrollText size={22} strokeWidth={1.65}/>}</span>
          <span><strong>D&D {year}</strong><small>{year==='2024'?'Обновлённые правила':'Классические правила 5e'}</small></span>
          <span className="radio-indicator">{draft.edition===year&&<Check size={12}/>}</span>
        </button>)}
      </div>
      {locked&&<p className="field-note">Редакция закреплена за этим героем. Другую редакцию можно выбрать при создании нового персонажа.</p>}
      {draft.edition==='2014'&&<div className="setting-row">
        <label><input type="checkbox" checked={draft.options.feats} onChange={event=>{const checked=event.target.checked;update(d=>({...d,options:{...d.options,feats:checked}}))}}/> Черты разрешены</label>
        <label><input type="checkbox" checked={draft.options.multiclass} onChange={event=>{const checked=event.target.checked;update(d=>({...d,options:{...d.options,multiclass:checked}}))}}/> Мультиклассирование разрешено</label>
      </div>}
    </Panel>
    <Panel title="Уровень персонажа" icon={Activity} description="Можно начать с 1-го уровня или сразу создать опытного героя.">
      <div className="level-setting">
        <div><label id="target-label">Целевой уровень</label><p>{draft.target===1?'Первый шаг к приключениям':draft.target<=4?'Начинающий искатель приключений':draft.target<=10?'Защитник королевства':draft.target<=16?'Герой мира':'Мастер своего дела'}</p></div>
        <Stepper label="Целевой уровень" value={draft.target} change={target=>update(d=>({...d,target}))}/>
      </div>
      <div className="level-scale" aria-label="Быстрый выбор уровня">
        {[1,5,10,15,20].map(level=><button type="button" key={level} aria-pressed={draft.target===level} className={draft.target===level?'active':''} onClick={()=>update(d=>({...d,target:level}))}>{level}</button>)}
      </div>
    </Panel>
  </>
}

function OptionCard({option,active,onClick,icon:Icon}:{option:Option;active:boolean;onClick:()=>void;icon?:typeof Compass}) {
  return <button type="button" className="option-card" aria-pressed={active} onClick={onClick}>
    <span className="option-card-title">{Icon&&<Icon size={19}/>}<strong>{option.name}</strong>{active&&<Check size={16} className="option-check"/>}</span>
    {option.description&&<small>{option.description}</small>}
  </button>
}

function Origin({draft,sheet,update}:{draft:Draft;sheet:Sheet;update:Change}) {
  return <>
    <Panel title={draft.edition==='2014'?'Народ':'Вид персонажа'} icon={Flame}>
      <div className="option-grid">{sheet.catalog.species.map(option=><OptionCard option={option} key={option.id} active={draft.species===option.id} onClick={()=>update(d=>({...d,species:option.id}))}/>)}</div>
    </Panel>
    <Panel title="Предыстория" icon={ScrollText}>
      <div className="option-grid">{sheet.catalog.backgrounds.map(option=><OptionCard option={option} key={option.id} active={draft.background===option.id} onClick={()=>update(d=>({...d,background:option.id}))}/>)}</div>
    </Panel>
    <Panel title="Начальный класс" icon={Swords}>
      <div className="option-grid classes-grid">{sheet.catalog.classes.map(option=><OptionCard option={option} key={option.id} active={draft.levels[0]?.classId===option.id} icon={CLASSES_ICONS[option.id]} onClick={()=>update(d=>withLevel(d,1,{...d.levels[0],classId:option.id,choices:d.levels[0]?.choices??{}}))}/>)}</div>
    </Panel>
    {!!sheet.choices[0]?.length&&<Panel title="Детали происхождения" icon={Gem}><Choices choices={sheet.choices[0]} onChange={(id,value)=>update(d=>({...d,origin:{...d.origin,[id]:value}}))} sheet={sheet}/></Panel>}
  </>
}

function Abilities({draft,sheet,update}:{draft:Draft;sheet:Sheet;update:Change}) {
  const source=draft.method==='roll'?draft.rolls:STANDARD
  const base=draft.base.length===6?draft.base:draft.method==='points'?[8,8,8,8,8,8]:[0,0,0,0,0,0]
  const assigned=base.filter(value=>value>0)
  const pool=[...source]
  for(const value of assigned){
    const index=pool.indexOf(value)
    if(index>=0)pool.splice(index,1)
  }
  const primary=sheet.catalog.classes.find(cls=>cls.id===draft.levels[0]?.classId)?.primary??[]
  const automatic=()=>{
    const indexes=[...primary.map(id=>abilities.indexOf(id)),...abilities.map((id,index)=>primary.includes(id)?-1:index).filter(index=>index>=0)]
    const sorted=[...source].sort((a,b)=>b-a)
    const next=[0,0,0,0,0,0]
    indexes.forEach((index,i)=>next[index]=sorted[i])
    update(d=>({...d,base:next}))
  }
  return <>
    <Panel title="Метод распределения" icon={Dice5}>
      <div className="segmented">{([['array','Стандартный набор'],['points','27 очков'],['roll','Броски кубиков']] as const).map(([id,name])=>
        <button type="button" aria-pressed={draft.method===id} key={id} onClick={()=>update(d=>id===d.method?d:{...d,method:id,base:id==='points'?[8,8,8,8,8,8]:[]})}>{name}</button>)}</div>
      <div className="score-help">
        <div><strong>{draft.method==='points'?'Очки: '+(27-pointCost(base))+' / 27':draft.method==='roll'?(draft.rolls.join(' · ')||'Броски ещё не сделаны'):STANDARD.join(' · ')}</strong>
        <p>{draft.method==='points'?'Базовые значения от 8 до 15.':draft.method==='roll'?'Для каждой характеристики бросьте 4к6 и сложите три лучших.':'Используйте каждое из шести значений один раз.'}</p></div>
        {draft.method==='roll'&&!draft.rolls.length&&<button type="button" className="secondary" onClick={()=>update(d=>({...d,rolls:rollScores(),base:[]}))}><Dice5 size={16}/> Бросить 4к6</button>}
        {draft.method!=='points'&&source.length===6&&<button type="button" className="secondary" onClick={automatic}><Sparkles size={16}/> Распределить</button>}
      </div>
      <div className="ability-grid">{abilities.map((id,index)=><label className="ability-card" key={id}>
        <span>{abilityName[id]}</span><small>{primary.includes(id)?'Основная характеристика':' '}</small>
        {draft.method==='points'
          ?<Stepper label={abilityName[id]} min={8} max={15} value={base[index]} change={value=>{const next=[...base];next[index]=value;if(pointCost(next)<=27)update(d=>({...d,base:next}))}}/>
          :<select aria-label={abilityName[id]} value={base[index]} onChange={e=>{const next=[...base];next[index]=Number(e.target.value);update(d=>({...d,base:next}))}}><option value={0}>—</option>{[...new Set([...pool,base[index]].filter(value=>value>0))].sort((a,b)=>b-a).map(value=><option key={value}>{value}</option>)}</select>}
        <strong>{base[index]?sheet.values[id]+' · '+sign(sheet.mods[id]):'—'}</strong>
      </label>)}</div>
    </Panel>
    {!!sheet.choices[-1]?.length&&<Panel title="Прибавки происхождения" icon={Sparkles}><Choices choices={sheet.choices[-1]} onChange={(id,value)=>update(d=>({...d,origin:{...d.origin,[id]:value}}))} sheet={sheet}/></Panel>}
  </>
}

function withLevel(draft:Draft,level:number,value:Level) {
  const levels=[...draft.levels]
  levels[level-1]=value
  return {...draft,levels}
}

function Advancement({draft,sheet,update,level,navigate}:{draft:Draft;sheet:Sheet;update:Change;level:number;navigate:(step:string)=>void}) {
  const row=draft.levels[level-1]
  const cls=sheet.catalog.classes.find(entry=>entry.id===row?.classId)
  const earlier=level>1?derive({...draft,target:level-1}):null
  const activeClasses=earlier?sheet.catalog.classes.filter(entry=>earlier.classLevels[entry.id]):[]
  const unavailable=(candidate:ClassInfo)=>{
    if(!earlier||activeClasses.some(entry=>entry.id===candidate.id))return ''
    if(!draft.options.multiclass&&activeClasses.length)return 'Нужно разрешение на мультиклассирование'
    const unmet=[...new Set(activeClasses.flatMap(entry=>multiclassRequirements(entry,candidate,earlier.values)))]
    return unmet.length?'Требуется: '+unmet.join(', '):''
  }
  const setLevel=(action:(previous:Level)=>Level)=>update(d=>withLevel(d,level,action(d.levels[level-1]??{classId:cls?.id??'',choices:{}})))
  const choose=(id:string,value:string[])=>setLevel(previous=>({...previous,choices:{...previous.choices,[id]:value}}))
  const entries=sheet.choices[level]??[]
  return <>
    <div className="development-nav" aria-label="Уровни развития">
      {Array.from({length:draft.target},(_,i)=>i+1).map(index=>{
        const selected=draft.levels[index-1]?.classId
        const complete=selected&&!sheet.issues.some(issue=>issue.step===index)
        return <button type="button" key={index} aria-label={'Уровень '+index} aria-current={index===level?'step':undefined} className={complete?'complete':''} onClick={()=>navigate('level:'+index)}>{index}{complete&&<Check size={11}/>}</button>
      })}
    </div>
    <Panel title={level===1?'Начальный класс':'Класс на этом уровне'} icon={Swords}>
      {level===1&&cls?<div className="selected-class"><strong>{cls.name}</strong><p>{cls.description}</p><button type="button" className="text-button" onClick={()=>navigate('origin')}>Изменить класс</button></div>
        :<div className="option-grid classes-grid">{sheet.catalog.classes.map(candidate=>{
          const reason=unavailable(candidate)
          return <button type="button" key={candidate.id} className="option-card" aria-pressed={cls?.id===candidate.id} disabled={!!reason}
            onClick={()=>setLevel(previous=>({...previous,classId:candidate.id,choices:previous.choices,hpRoll:previous.classId===candidate.id?previous.hpRoll:undefined}))}>
            <span className="option-card-title"><strong>{candidate.name}</strong>{cls?.id===candidate.id&&<Check size={15}/>}</span><small>{reason||'Уровень класса '+((earlier?.classLevels[candidate.id]??0)+1)}</small>
          </button>
        })}</div>}
    </Panel>
    {level>1&&cls&&!unavailable(cls)&&<Panel title="Прирост хитов" icon={Heart}>
      <div className="segmented">
        <button type="button" aria-pressed={row?.hpMode!=='roll'} onClick={()=>setLevel(previous=>({...previous,hpMode:'fixed'}))}>Фиксированный · {cls.hp/2+1}</button>
        <button type="button" aria-pressed={row?.hpMode==='roll'} onClick={()=>setLevel(previous=>({...previous,hpMode:'roll'}))}>Бросок 1к{cls.hp}</button>
      </div>
      {row?.hpMode==='roll'&&<div className="inline-actions">{row.hpRoll?<strong>Выпало {row.hpRoll}</strong>:<button type="button" className="secondary" onClick={()=>setLevel(previous=>({...previous,hpRoll:rollDie(cls.hp)}))}><Dice5 size={16}/> Бросить кость хитов</button>}</div>}
    </Panel>}
    {!!sheet.gained[level]?.length&&<Panel title="Полученные способности" icon={Sparkles}><div className="gain-list">
      {sheet.gained[level].map((feature,index)=><details key={feature.name+index}><summary>{feature.name}<small>{feature.source}</small></summary>{feature.detail&&<p className="reference-text">{feature.detail}</p>}</details>)}
    </div></Panel>}
    {entries.length>0&&<Panel title="Выборы уровня" icon={Gem}><Choices key={level+':'+cls?.id} choices={entries} onChange={choose} sheet={sheet}/>
      {cls&&row?.choices['starting-gear']?.[0]==='cash'&&draft.edition==='2014'&&<div className="inline-actions">{row.choices['wealth-roll']?.[0]?<strong>Результат: {row.choices['wealth-roll'][0]}</strong>:<button type="button" className="secondary" onClick={()=>choose('wealth-roll',[String(Array.from({length:goldDice14(cls.id)},()=>rollDie(4)).reduce((a,b)=>a+b,0))])}><Dice5 size={16}/> Бросить начальное золото</button>}</div>}
    </Panel>}
    {level>1&&cls&&sheet.gained[level]?.length===0&&entries.length===0&&<p className="field-note">На этом уровне увеличивается запас хитов. Дополнительных решений для класса нет.</p>}
  </>
}

function GearEditor({draft,sheet,update}:{draft:Draft;sheet:Sheet;update:Change}) {
  const [search,setSearch]=useState('')
  const [custom,setCustom]=useState('')
  const [quantity,setQuantity]=useState(1)
  const [buy,setBuy]=useState(false)
  const options=search.trim()?sheet.catalog.items.filter(item=>item.id!=='unarmed'&&[item.name,itemLabel(item)].some(name=>name.toLowerCase().includes(search.trim().toLowerCase()))).slice(0,25):[]
  const add=(item:Pick<Item,'id'|'name'|'cost'>)=>{
    const cost=buy?priceInGold(item.cost):0
    if(cost*quantity>sheet.gold)return
    update(d=>({...d,bonusGear:[...d.bonusGear,{id:item.id,name:item.name,quantity,price:cost*quantity}],spentGold:d.spentGold+cost*quantity}))
    setSearch('');setCustom('');setQuantity(1)
  }
  const remove=(index:number)=>update(d=>({...d,bonusGear:d.bonusGear.filter((_,i)=>index!==i),spentGold:Math.max(0,d.spentGold-(d.bonusGear[index]?.price??0))}))
  return <>
    <div className="coin-grid">
      {([['cp','Медные'],['sp','Серебряные'],['ep','Электрум'],['pp','Платиновые']] as const).map(([code,title])=><label key={code}>{title}<input type="number" min="0" max="9999999" value={draft.otherCoins[code]} onChange={e=>{const n=Math.max(0,Math.min(9999999,Math.floor(Number(e.target.value)||0)));update(d=>({...d,otherCoins:{...d.otherCoins,[code]:n}}))}}/></label>)}
      <label>Добавить золотые<input type="number" min="0" max="9999999" value={draft.bonusGold} onChange={e=>{const bonusGold=Math.max(0,Math.min(9999999,Math.floor(Number(e.target.value)||0)));update(d=>({...d,bonusGold}))}}/></label>
    </div>
    <p className="mint">Всего золота: <strong>{sheet.gold.toLocaleString('ru')} зм</strong></p>
    {sheet.items.length>0&&<div className="inventory-list">{sheet.items.map(item=><div key={item.id}><span>{item.name}</span><small>× {item.quantity}</small></div>)}</div>}
    <div className="gear-add">
      <label className="search-field"><Search size={16}/><input aria-label="Поиск снаряжения" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти предмет в каталоге"/></label>
      <Stepper label="Количество предметов" value={quantity} change={setQuantity} max={999}/>
      <label className="toggle"><input type="checkbox" checked={buy} onChange={e=>setBuy(e.target.checked)}/> Покупка</label>
    </div>
    {search.length>0&&<div className="gear-results">{options.length?options.map(item=><button type="button" className="secondary" key={item.id} disabled={buy&&(!priceInGold(item.cost)||priceInGold(item.cost)*quantity>sheet.gold)} onClick={()=>add({...item,name:itemLabel(item)})}><Plus size={15}/>{itemLabel(item)}{item.cost&&<small>{typeof item.cost==='number'?item.cost+' зм':item.cost}</small>}</button>):<p className="muted">Предмет не найден.</p>}</div>}
    <div className="custom-gear"><input aria-label="Название своего предмета" value={custom} onChange={e=>setCustom(e.target.value)} maxLength={120} placeholder="Предмет от мастера"/><button type="button" className="secondary" disabled={!custom.trim()} onClick={()=>add({id:'custom-'+custom.trim().toLowerCase(),name:custom.trim()})}><Plus size={16}/> Добавить</button></div>
    {draft.bonusGear.map((item,index)=><div className="removable" key={item.id+index}><span>{item.name} × {item.quantity}</span><button type="button" className="icon-button" aria-label={'Убрать '+item.name} onClick={()=>remove(index)}><Trash2 size={15}/></button></div>)}
    {!!draft.spentGold&&<label className="field">Потрачено золота<input type="number" min="0" step=".01" value={draft.spentGold} onChange={e=>{const spentGold=Math.max(0,Number(e.target.value)||0);update(d=>({...d,spentGold}))}}/></label>}
    <div className="settings-stack">
      <label className="field">Надетый доспех<select value={draft.armor} onChange={e=>{const armor=e.target.value;update(d=>({...d,armor}))}}><option value="auto">Автоматически</option><option value="none">Без доспеха</option>{sheet.armorItems.map(item=><option key={item.id} value={item.id}>{itemLabel(item)}</option>)}</select></label>
      {sheet.items.some(item=>item.id==='shield')&&<label className="toggle"><input type="checkbox" checked={draft.shield} onChange={e=>{const shield=e.target.checked;update(d=>({...d,shield}))}}/> Использовать щит</label>}
    </div>
  </>
}

function priceInGold(cost:Item['cost']) {
  if(typeof cost==='number')return cost
  const match=cost?.match(/^([\d,.]+)\s*(CP|SP|EP|GP|PP)/i)
  if(!match)return 0
  return Number(match[1].replace(/,/g,''))*({CP:.01,SP:.1,EP:.5,GP:1,PP:10}[match[2].toUpperCase()]??1)
}

function Story({draft,sheet,update}:{draft:Draft;sheet:Sheet;update:Change}) {
  const [portraitError,setPortraitError]=useState('')
  const setText=(key:'name'|'alignment'|'appearance'|'story'|'bonds'|'goals',value:string)=>update(d=>({...d,[key]:value}))
  async function portrait(file?:File) {
    if(!file)return
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8_000_000){setPortraitError('Выберите PNG, JPEG или WebP размером до 8 МБ.');return}
    try{
      const image=await createImageBitmap(file)
      const canvas=document.createElement('canvas')
      const scale=Math.min(1,960/Math.max(image.width,image.height))
      canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale))
      canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height)
      image.close()
      const url=canvas.toDataURL('image/jpeg',.88)
      update(d=>({...d,portrait:url}));setPortraitError('')
    }catch{setPortraitError('Не удалось открыть изображение. Выберите другой файл.')}
  }
  return <>
    <Panel title="Имя и облик" icon={Feather}>
      <div className="identity-grid"><label className="field">Имя персонажа <input required maxLength={100} value={draft.name} onChange={e=>setText('name',e.target.value)} placeholder="Имя героя"/></label>
        <label className="field">Мировоззрение<select value={draft.alignment} onChange={e=>setText('alignment',e.target.value)}><option value="">На ваш выбор</option>{['Законно-доброе','Нейтрально-доброе','Хаотично-доброе','Законно-нейтральное','Истинно нейтральное','Хаотично-нейтральное','Законно-злое','Нейтрально-злое','Хаотично-злое'].map(value=><option key={value}>{value}</option>)}</select></label></div>
      <div className="inline-actions"><label className="secondary file-button"><ImagePlus size={17}/> Загрузить портрет <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void portrait(e.target.files?.[0])}/></label>
        {draft.portrait&&<button type="button" className="text-button" onClick={()=>update(d=>({...d,portrait:''}))}>Удалить портрет</button>}</div>
      {portraitError&&<p className="warning" role="alert">{portraitError}</p>}
      <label className="field">Внешность<textarea maxLength={4000} rows={3} value={draft.appearance} onChange={e=>setText('appearance',e.target.value)} placeholder="Что заметят при первой встрече?"/></label>
    </Panel>
    <Panel title="История героя" icon={BookOpen}>
      <label className="field">Биография<textarea maxLength={12000} rows={4} value={draft.story} onChange={e=>setText('story',e.target.value)} placeholder="Как герой оказался на пороге приключения?"/></label>
      <label className="field">Связи<textarea maxLength={4000} rows={2} value={draft.bonds} onChange={e=>setText('bonds',e.target.value)} placeholder="Люди, места и обещания"/></label>
      <label className="field">Цели<textarea maxLength={4000} rows={2} value={draft.goals} onChange={e=>setText('goals',e.target.value)} placeholder="Чего герой хочет добиться?"/></label>
    </Panel>
    <Panel title="Инвентарь и монеты" icon={Gem} description="Добавьте покупки или снаряжение, выданное мастером."><GearEditor draft={draft} sheet={sheet} update={update}/></Panel>
  </>
}

function Overview({draft,sheet,expanded,close}:{draft:Draft;sheet:Sheet;expanded:boolean;close:()=>void}) {
  const classNames=Object.entries(sheet.classLevels).map(([id,n])=>sheet.catalog.classes.find(cls=>cls.id===id)?.name+' '+n).join(' / ')
  return <aside className={'overview '+(expanded?'overview-open':'')} aria-label="Сводка персонажа">
    <div className="portrait"><img src={draft.portrait||ART} alt={draft.portrait?'Портрет персонажа':''}/>
      <div className="portrait-shade"/>
      <span className="portrait-tag"><span/> УРОВЕНЬ {draft.target}</span>
      <button type="button" className="icon-button close-overview" onClick={close} aria-label="Закрыть сводку"><X size={20}/></button>
      <div className="portrait-title"><p>ВАШ ПЕРСОНАЖ</p><h2>{draft.name.trim()||'Безымянный герой'}</h2><span>{[sheet.species?.name,classNames].filter(Boolean).join(' · ')||'История ещё впереди'}</span></div>
    </div>
    <div className="overview-body">
      <div className="summary-grid">
        <div><Shield size={17}/><strong>{draft.levels[0]?.classId?sheet.armor:'—'}</strong><span>КД</span></div>
        <div><Heart size={17}/><strong>{draft.levels[0]?.classId?sheet.hp:'—'}</strong><span>Хиты</span></div>
        <div><Footprints size={17}/><strong>{draft.base.length===6?sign(sheet.initiative):'—'}</strong><span>Инициатива</span></div>
      </div>
      <div className="summary-abilities">{abilities.map((id,index)=><div key={id}><span>{abilityShort[index]}</span><strong>{draft.base[index]?sheet.values[id]:'—'}</strong></div>)}</div>
      <div className="overview-origin"><span><Flame size={15}/> Происхождение</span><strong>{sheet.species?.name??'—'}</strong></div>
      <div className="overview-origin"><span><Swords size={15}/> Класс</span><strong>{classNames||'—'}</strong></div>
    </div>
  </aside>
}

function RulesDialog({close}:{close:()=>void}) {
  return <Dialog title="Источники правил" close={close}><div className="rules-dialog">
    <p>D&D 2014 использует SRD 5.1. D&D 2024 использует SRD 5.2.1. Каталоги включают материалы этих редакций с русскими названиями и английскими справочными описаниями.</p>
    <p lang="en">This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at <a href="https://dnd.wizards.com/resources/systems-reference-document">dnd.wizards.com/resources/systems-reference-document</a>. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at <a href={LICENSE_URL}>creativecommons.org/licenses/by/4.0/legalcode</a>.</p>
    <p lang="en">This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at <a href={RULES_URL}>www.dndbeyond.com/srd</a>. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at <a href={LICENSE_URL}>creativecommons.org/licenses/by/4.0/legalcode</a>.</p>
  </div></Dialog>
}

const levelStep=(step:string)=>step.startsWith('level:')?Number(step.slice(6)):0
const stageOf=(step:string)=>step.startsWith('level:')?'level:1':step==='sheet'?'story':step
const issueStep=(step:number,target:number)=>step===-1?'abilities':step===0?'origin':step>target?'story':'level:'+step

export function App() {
  const [draft,setDraft]=useState<Draft>(()=>createDraft('2024'))
  const [drafts,setDrafts]=useState<Draft[]>([])
  const [loading,setLoading]=useState(true)
  const [storageStatus,setStorageStatus]=useState('Сохраняется в браузере')
  const [modal,setModal]=useState('')
  const [confirm,setConfirm]=useState('')
  const [showOverview,setShowOverview]=useState(false)
  useEffect(()=>{
    if(!showOverview)return
    const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape')setShowOverview(false)}
    document.addEventListener('keydown',cancel)
    requestAnimationFrame(()=>document.querySelector<HTMLElement>('.close-overview')?.focus())
    return ()=>{ document.removeEventListener('keydown',cancel);document.querySelector<HTMLElement>('.mobile-summary')?.focus() }
  },[showOverview])
  const [tried,setTried]=useState(false)
  const [exporting,setExporting]=useState(false)
  const [pdfError,setPdfError]=useState('')
  const sheet=useMemo(()=>derive(draft),[draft])
  useEffect(()=>{
    let active=true
    loadDrafts().then(saved=>{
      if(!active)return
      setDrafts(saved)
      if(saved[0])setDraft(saved[0])
    }).catch(()=>{if(active)setStorageStatus('Не удалось открыть черновики')}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[])
  useEffect(()=>{
    if(loading)return
    let active=true
    saveDraft(draft).then(()=>{if(active)setStorageStatus('Сохранено в браузере')}).catch(()=>{if(active)setStorageStatus('Не удалось сохранить черновик')})
    return ()=>{active=false}
  },[draft,loading])
  const update:Change=action=>setDraft(previous=>({...action(previous),updated:Date.now()}))
  const navigate=(step:string)=>{
    update(d=>({...d,step}))
    setTried(false)
    setPdfError('')
    window.scrollTo({top:0,behavior:'instant'})
    requestAnimationFrame(()=>document.getElementById('page-title')?.focus({preventScroll:true}))
  }
  const level=levelStep(draft.step)
  const stepIndex=STAGES.findIndex(stage=>stage.id===stageOf(draft.step))
  const max=draft.target
  const blocked=draft.step==='origin'?sheet.issues.filter(issue=>issue.step===0):draft.step==='abilities'?sheet.issues.filter(issue=>issue.step===-1):level?sheet.issues.filter(issue=>issue.step===level):[]
  const next = draft.step==='setup'?'origin':draft.step==='origin'?'abilities':draft.step==='abilities'?'level:1':level?level<max?'level:'+(level+1):'story':'sheet'
  const previous=draft.step==='origin'?'setup':draft.step==='abilities'?'origin':level?level===1?'abilities':'level:'+(level-1):draft.step==='story'?'level:'+max:'story'
  const nextLabel=draft.step==='setup'?'К происхождению':draft.step==='origin'?'К характеристикам':draft.step==='abilities'?'К первому уровню':level?level<max?'К уровню '+(level+1):'К анкете':'Открыть анкету'
  const heading=level?['Уровень '+level,level===1?'Выберите владения, снаряжение и классовые особенности.':'Распределите новые возможности героя и проверьте полученные способности.']:TITLES[draft.step]??TITLES.setup
  const newCharacter=()=>{
    setDrafts(existing=>[draft,...existing.filter(entry=>entry.id!==draft.id)])
    setDraft(createDraft('2024'));setModal('');setTried(false);setPdfError('');window.scrollTo(0,0)
  }
  const openDrafts=()=>{
    setModal('drafts')
    void loadDrafts().then(saved=>setDrafts([draft,...saved.filter(entry=>entry.id!==draft.id)])).catch(()=>setDrafts([draft]))
  }
  const removeDraft=async(id:string)=>{
    try{await deleteDraft(id);const others=drafts.filter(entry=>entry.id!==id);setDrafts(others);if(draft.id===id){setDraft(others[0]??createDraft('2024'));setTried(false);setPdfError('')}}catch{setStorageStatus('Не удалось удалить черновик')}
    setConfirm('')
  }
  const download=async()=>{
    if(!sheet.ready||exporting)return
    setExporting(true);setPdfError('')
    try{
      const {downloadPdf}=await import('./pdf')
      await downloadPdf(draft,sheet)
    }catch{setPdfError('Не удалось создать PDF. Попробуйте скачать его ещё раз.')}
    finally{setExporting(false)}
  }
  const jumpToIssue=(step:number)=>navigate(issueStep(step,max))
  return <div className="site-shell">
    <header className="site-header"><div className="header-inner">
      <button className="brand-button" type="button" onClick={()=>navigate('setup')} aria-label="Кузница персонажей · кампания"><Brand/></button>
      <div className="header-actions"><button type="button" className="header-link" aria-label="Справочник" onClick={()=>setModal('rules')}><BookOpen size={17}/><span>Справочник</span></button>
        <button type="button" className="secondary header-library" onClick={openDrafts}><Users size={17}/><span>Мои персонажи</span></button></div>
    </div></header>
    <nav className="progress-nav" aria-label="Этапы создания"><div className="progress-inner">
      {STAGES.map(({id,name,icon:Icon},i)=>{
        const active=stepIndex===i
        const completed=i<stepIndex&&(i===0||i===1&&!sheet.issues.some(issue=>issue.step===0)||i===2&&!sheet.issues.some(issue=>issue.step===-1)||i===3&&!sheet.issues.some(issue=>issue.step>0&&issue.step<=max))
        return <div className="progress-cell" key={id}><button type="button" aria-current={active?'step':undefined} className={'progress-step '+(completed?'completed':'')} onClick={()=>navigate(id)}>
          <span>{completed?<Check size={15}/>:<Icon size={17}/>}</span><strong>{name}</strong>
        </button>{i<STAGES.length-1&&<i/>}</div>
      })}
    </div></nav>
    <main className="main-layout">
      <div className="workspace-main">
        <div className="page-heading">
          <div className="eyebrow"><span/> СОЗДАНИЕ ПЕРСОНАЖА</div>
          <h1 id="page-title" tabIndex={-1}>{heading[0]}</h1><p>{heading[1]}</p>
          <button type="button" className="secondary mobile-summary" onClick={()=>setShowOverview(true)}><Shield size={16}/> Сводка героя</button>
        </div>
        <div className="workspace-content" aria-busy={loading}>
          {draft.step==='setup'&&<Setup draft={draft} update={update} locked={!!(draft.species||draft.background||draft.levels[0]?.classId||draft.base.length)} edition={edition=>update(d=>d.edition===edition?d:{...createDraft(edition),id:d.id,target:d.target})}/>}
          {draft.step==='origin'&&<Origin draft={draft} sheet={sheet} update={update}/>}
          {draft.step==='abilities'&&<Abilities draft={draft} sheet={sheet} update={update}/>}
          {!!level&&<Advancement draft={draft} sheet={sheet} update={update} level={level} navigate={navigate}/>}
          {draft.step==='story'&&<Story draft={draft} sheet={sheet} update={update}/>}
          {draft.step==='sheet'&&<>
            <div className="bottom-actions">
              <button type="button" className="secondary back" onClick={()=>navigate('story')}><ArrowLeft size={17}/> Редактировать</button>
              <button type="button" className="primary" disabled={!sheet.ready||exporting} onClick={()=>void download()}><ArrowDownToLine size={17}/>{exporting?'Создаём PDF…':'Скачать PDF'}</button>
            </div>
            <CharacterSheet draft={draft} sheet={sheet} jump={jumpToIssue}/>
          </>}
          {tried&&blocked.length>0&&<div className="warning" role="alert"><strong>Завершите выборы этого этапа</strong><ul>{blocked.map((issue,i)=><li key={i}>{issue.message}</li>)}</ul></div>}
          {pdfError&&<p role="alert" className="warning">{pdfError}</p>}
          {draft.step!=='sheet'&&<div className="bottom-actions">
            {draft.step!=='setup'?<button type="button" className="secondary back" onClick={()=>navigate(previous)}><ArrowLeft size={17}/> Назад</button>:<span className="storage-status"><span/>{storageStatus}</span>}
            <button type="button" className="primary" onClick={()=>{if(blocked.length)setTried(true);else navigate(next)}}>{nextLabel}<ArrowRight size={18}/></button>
          </div>}
        </div>
      </div>
      <Overview draft={draft} sheet={sheet} expanded={showOverview} close={()=>setShowOverview(false)}/>
    </main>
    <footer className="site-footer"><div className="footer-inner"><span>Кузница персонажей</span><span className="footer-center">D&D {draft.edition} · SRD {draft.rules}</span><button type="button" onClick={()=>setModal('rules')}>Источники и лицензия <ChevronRight size={14}/></button></div></footer>
    {modal==='rules'&&<RulesDialog close={()=>setModal('')}/>}
    {modal==='drafts'&&<Dialog title="Мои персонажи" close={()=>{setModal('');setConfirm('')}}>
      <div className="draft-list">{drafts.map(entry=><div key={entry.id} className="draft-row"><button type="button" className="draft-open" onClick={()=>{setDraft({...entry,updated:Date.now()});setModal('');setTried(false);setPdfError('');window.scrollTo(0,0)}}><strong>{entry.name||'Безымянный герой'}</strong><small>D&D {entry.edition} · уровень {entry.target}</small></button>
        {confirm===entry.id?<button type="button" className="secondary danger" onClick={()=>void removeDraft(entry.id)}>Удалить</button>:<button type="button" className="icon-button" aria-label={'Удалить '+(entry.name||'черновик')} onClick={()=>setConfirm(entry.id)}><Trash2 size={16}/></button>}</div>)}</div>
      <button type="button" className="primary" onClick={newCharacter}><Plus size={17}/> Новый персонаж</button>
    </Dialog>}
  </div>
}
