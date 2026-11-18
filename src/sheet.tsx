import { Activity, BookOpen, Check, ChevronRight, Feather, Gem, ScrollText, Shield, Sparkles, Swords } from 'lucide-react'
import { abilities, abilityName, spellLabel } from './catalog'
import { sign, type Draft, type Sheet } from './rules'

export function sheetIdentity(draft:Draft,sheet:Sheet) {
  const classes=Object.entries(sheet.classLevels).map(([id,n])=>[sheet.catalog.classes.find(cls=>cls.id===id)?.name+' '+n,sheet.subclasses[id]].filter(Boolean).join(' · '))
  return [sheet.species?.name,sheet.lineage,sheet.background?.name,...classes,draft.alignment].filter(Boolean).join(' / ')
}
export function combatValues(sheet:Sheet):[string,string][] {
  return [
    ['Класс доспеха',String(sheet.armor)],['Максимум хитов',String(sheet.hp)],['Инициатива',sign(sheet.initiative)],
    ['Скорость',sheet.speed+' фт.'],['Бонус мастерства',sign(sheet.proficiency)],['Пассивная внимательность',String(sheet.passive)],
    ['Кости хитов',Object.entries(sheet.hitDice).map(([die,n])=>n+'d'+die).join(', ')||'—'],['Размер',sheet.size],['Опыт',String(sheet.experience)],
  ]
}
export function coins(draft:Draft,sheet:Sheet) {
  return [sheet.gold.toLocaleString('ru')+' зм',draft.otherCoins.sp+' см',draft.otherCoins.cp+' мм',draft.otherCoins.ep+' эм',draft.otherCoins.pp+' пм'].join(' · ')
}
export function biography(draft:Draft):[string,string][] {
  return ([['Внешность',draft.appearance],['Биография',draft.story],['Связи',draft.bonds],['Цели',draft.goals]] as [string,string][]).filter(([,text])=>text.trim())
}
export function CharacterSheet({draft,sheet,jump}:{draft:Draft;sheet:Sheet;jump:(step:number)=>void}) {
  const sections = [
    {id:'combat',name:'Бой'},{id:'skills',name:'Навыки'},{id:'features',name:'Способности'},
    ...(sheet.magic.length||sheet.slots.length||sheet.pact?[{id:'magic',name:'Магия'}]:[]),{id:'equipment',name:'Инвентарь'},...(biography(draft).length?[{id:'history',name:'История'}]:[]),
  ]
  return <>
    {!sheet.ready&&<section className="warning sheet-issues"><strong>Для готовой анкеты осталось завершить выборы</strong>
      <ul>{sheet.issues.map((issue,index)=><li key={index}><button type="button" onClick={()=>jump(issue.step)}>{issue.message}<ChevronRight size={14}/></button></li>)}</ul>
    </section>}
    <section className="panel sheet-card">
      <div className="character-identity">{draft.portrait&&<img src={draft.portrait} alt="Портрет героя"/>}<div><span className="eyebrow">D&D {sheet.edition} · УРОВЕНЬ {sheet.level}</span><h2>{sheet.name}</h2><p>{sheetIdentity(draft,sheet)||'Заполните информацию о герое'}</p></div>{sheet.ready&&<span className="sheet-ready"><Check size={14}/> Готово к игре</span>}</div>
      <div className="sheet-nav">{sections.map(item=><a key={item.id} href={'#'+item.id}>{item.name}</a>)}</div>
      <div className="sheet-abilities">{abilities.map(id=><div key={id}><span>{abilityName[id]}</span><strong>{sheet.values[id]}</strong><small>{sign(sheet.mods[id])}</small></div>)}</div>
    </section>
    <section className="panel sheet-card" id="combat">
      <h2><Shield size={20}/> Боевые показатели</h2>
      <div className="combat-grid">{combatValues(sheet).map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <h3><Swords size={16}/> Атаки</h3>
      <div className="sheet-table">{sheet.attacks.map(attack=><div key={attack.name}><span>{attack.name}{attack.detail&&<small>{attack.detail}</small>}</span><strong>{sign(attack.bonus)}</strong><span>{attack.damage}</span></div>)}</div>
    </section>
    <section className="panel sheet-card" id="skills">
      <h2><Activity size={20}/> Навыки и спасброски</h2>
      <div className="sheet-split">
        <div><h3>Навыки</h3><div className="sheet-table two">{sheet.skills.map(skill=><div key={skill.id}><span>{skill.name}{skill.expert&&<small>Компетентность</small>}</span><strong className={skill.proficient?'accent':''}>{sign(skill.value)}</strong></div>)}</div></div>
        <div><h3>Спасброски</h3><div className="sheet-table two">{sheet.saves.map(save=><div key={save.id}><span>{save.name}</span><strong className={save.proficient?'accent':''}>{sign(save.value)}</strong></div>)}</div>
          <h3>Владения</h3><p>{[...sheet.profs,...sheet.tools].join(', ')||'—'}</p><h3>Языки</h3><p>{sheet.languages.join(', ')}</p>
        </div>
      </div>
    </section>
    <section className="panel sheet-card" id="features">
      <h2><Sparkles size={20}/> Черты и способности</h2>
      {sheet.features.length===0&&<p className="muted">Особенности появятся после выбора класса и происхождения.</p>}
      <div className="gain-list">{sheet.features.map((feature,index)=><details key={feature.name+index}><summary>{feature.name}<small>{feature.source}{feature.level?' · '+feature.level+' ур.':''}</small></summary>{feature.detail&&<p className="reference-text">{feature.detail}</p>}</details>)}</div>
    </section>
    {sections.some(section=>section.id==='magic')&&<section className="panel sheet-card" id="magic"><h2><BookOpen size={20}/> Заклинания</h2>
      {sheet.slots.length>0&&<div className="combat-grid">{sheet.slots.map((count,index)=><div key={index}><span>Ячейки {index+1}-го уровня</span><strong>{count}</strong></div>)}</div>}
      {sheet.pact&&<p><strong>Магия договора</strong> · {sheet.pact.count} яч. {sheet.pact.level}-го уровня</p>}
      {sheet.magic.map((source,index)=><div className="magic-source" key={index}><h3>{source.name}</h3><p>{abilityName[source.ability]} · Сл {source.dc} · атака {sign(source.attack)}</p>
        <div className="gain-list">{source.spells.map(({spell,status})=><details key={spell.id}><summary>{spellLabel(spell)}<small>{spell.level===0?'Заговор':'Ур. '+spell.level} · {status}</small></summary><p className="reference-text">{spell.text}</p></details>)}</div>
      </div>)}
    </section>}
    <section className="panel sheet-card" id="equipment"><h2><Gem size={20}/> Инвентарь</h2><p>{coins(draft,sheet)}</p>
      <div className="sheet-table two">{sheet.items.map(item=><div key={item.id}><span>{item.name}</span><strong>× {item.quantity}</strong></div>)}</div>
    </section>
    {biography(draft).length>0&&<section className="panel sheet-card" id="history"><h2><Feather size={20}/> История</h2>
      {biography(draft).map(([label,text])=><div key={label}><h3>{label}</h3><p className="reference-text">{text}</p></div>)}
    </section>}
  </>
}
