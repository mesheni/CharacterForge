import { Document, Font, Image, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { abilities, abilityName, spellLabel } from './catalog'
import { sign, type Draft, type Sheet } from './rules'
import { biography, coins, combatValues, sheetIdentity } from './sheet'

const fontPath = import.meta.env.BASE_URL + 'fonts/'
Font.register({ family:'Character', fonts:[
  {src:fontPath+'DejaVuSans.ttf'},
  {src:fontPath+'DejaVuSans-Bold.ttf',fontWeight:700},
] })
Font.registerHyphenationCallback(word=>word.length<30?[word]:Array.from(word.matchAll(/.{1,20}/gu),match=>match[0]))

const styles=StyleSheet.create({
  page:{paddingTop:34,paddingBottom:40,paddingHorizontal:35,fontFamily:'Character',fontSize:9,lineHeight:1.35,color:'#222222'},
  title:{fontSize:25,fontWeight:700,marginBottom:3},
  kicker:{fontSize:9,color:'#865424',marginBottom:6},
  identity:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:14,borderBottom:1,borderBottomColor:'#aa8869',paddingBottom:12},
  portrait:{height:75,width:57,objectFit:'cover'},
  group:{marginTop:12,marginBottom:2},
  heading:{backgroundColor:'#ebe2d8',color:'#4a3528',fontWeight:700,fontSize:11,paddingHorizontal:7,paddingVertical:4,marginBottom:4},
  row:{flexDirection:'row',borderBottom:0.6,borderBottomColor:'#ddd3c9',paddingVertical:3,paddingHorizontal:4,minHeight:17},
  left:{flexGrow:1,flexBasis:0,marginRight:8},
  right:{maxWidth:'62%',textAlign:'right',fontWeight:700},
  info:{marginVertical:3,paddingHorizontal:4},
  link:{color:'#79512c',fontSize:8,paddingHorizontal:4,marginBottom:3},
  feature:{fontWeight:700,marginTop:4,paddingHorizontal:4},
  manual:{marginTop:8,borderWidth:0.6,borderColor:'#b4a499',padding:7,lineHeight:1.8},
  footer:{position:'absolute',bottom:18,left:35,right:35,fontSize:8,color:'#63574c',borderTop:0.6,borderTopColor:'#c9b7a4',paddingTop:4},
})
type Value=[string,string]
function Rows({values}:{values:Value[]}) {
  return <>{values.map(([name,value],index)=><View wrap={false} style={styles.row} key={index}><Text style={styles.left}>{name}</Text><Text style={styles.right}>{value}</Text></View>)}</>
}
function Group({title,children}:{title:string;children:React.ReactNode}) {
  return <View style={styles.group}><Text minPresenceAhead={28} style={styles.heading}>{title}</Text>{children}</View>
}
function paragraphs(text:string) {
  return text.split(/\n\s*\n/).flatMap(part=>part.length<1900?[part]:Array.from(part.matchAll(/[^\n]{1,1200}(?:\s|$)|[^\n]{1,1200}/gu),match=>match[0])).filter(Boolean)
}
function CharacterDocument({draft,sheet}:{draft:Draft;sheet:Sheet}) {
  return <Document title={sheet.name+' · Лист персонажа D&D'} language="ru" subject={'D&D '+sheet.edition+' · SRD '+draft.rules}>
    <Page size="A4" style={styles.page} wrap>
      <View wrap={false} style={styles.identity}>{draft.portrait&&<Image style={styles.portrait} src={draft.portrait}/>}<View style={styles.left}>
        <Text style={styles.kicker}>D&D {sheet.edition} / Уровень {sheet.level}</Text><Text style={styles.title}>{sheet.name}</Text><Text>{sheetIdentity(draft,sheet)}</Text>
      </View></View>
      <Group title="Характеристики"><Rows values={abilities.map(id=>[abilityName[id],sheet.values[id]+' · '+sign(sheet.mods[id])])}/></Group>
      <Group title="Боевые показатели"><Rows values={combatValues(sheet)}/><Text style={styles.manual}>Текущие хиты __________    Временные хиты __________    Ресурсы __________</Text></Group>
      <Group title="Атаки"><Rows values={sheet.attacks.map(attack=>[attack.name+(attack.detail?' · '+attack.detail:''),sign(attack.bonus)+' / '+attack.damage])}/></Group>
      <Group title="Спасброски"><Rows values={sheet.saves.map(save=>[save.name+(save.proficient?' •':''),sign(save.value)])}/></Group>
      <Group title="Навыки"><Rows values={sheet.skills.map(skill=>[skill.name+(skill.expert?' · компетентность':skill.proficient?' •':''),sign(skill.value)])}/></Group>
      <Group title="Владения и языки"><Text style={styles.info}>{[...sheet.profs,...sheet.tools].join(', ')||'—'}</Text><Text style={styles.info}>{sheet.languages.join(', ')}</Text></Group>
      {sheet.features.length>0&&<Group title="Черты и способности">
        {sheet.features.map((feature,i)=><View key={i}><Text minPresenceAhead={12} style={styles.feature}>{feature.name} · {feature.source}</Text>
          {feature.url&&<Link style={styles.link} src={feature.url}>Описание в справочнике</Link>}
          {feature.detail&&paragraphs(feature.detail).map((part,index)=><Text key={index} style={styles.info}>{part}</Text>)}
        </View>)}
      </Group>}
      {(sheet.magic.length>0||sheet.slots.length>0||sheet.pact)&&<Group title="Магия">
        <Rows values={sheet.slots.map((slots,index)=>['Ячейки '+(index+1)+'-го уровня',String(slots)+'    □ '.repeat(slots)])}/>
        {sheet.pact&&<Text style={styles.info}>Магия договора · {sheet.pact.count} яч. {sheet.pact.level}-го уровня {'    □ '.repeat(sheet.pact.count)}</Text>}
        {sheet.magic.map((source,index)=><View key={index} style={styles.group}><Text minPresenceAhead={24} style={styles.feature}>{source.name} · {abilityName[source.ability]} · Сл {source.dc} · атака {sign(source.attack)}</Text>
          <Rows values={source.spells.map(({spell,status})=>[spellLabel(spell)+' · '+(spell.level===0?'заговор':spell.level+' ур.'),status])}/>
        </View>)}
      </Group>}
      <Group title="Инвентарь"><Text style={styles.info}>{coins(draft,sheet)}</Text><Rows values={sheet.items.map(item=>[item.name,'× '+item.quantity])}/></Group>
      {biography(draft).map(([name,text])=><Group title={name} key={name}>{paragraphs(text).map((part,index)=><Text key={index} style={styles.info}>{part}</Text>)}</Group>)}
      <View style={styles.group}><Text style={styles.info}>{Copyright[draft.edition]}</Text></View>
      <Text fixed style={styles.footer} render={({pageNumber,totalPages})=>sheet.name+'  /  D&D '+sheet.edition+'  /  '+pageNumber+' из '+totalPages}/>
    </Page>
  </Document>
}
const license='The material is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.'
const Copyright:Record<Draft['edition'],string>={
  '2014':'This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. '+license,
  '2024':'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. '+license,
}
export async function downloadPdf(draft:Draft,sheet:Sheet) {
  const blob=await pdf(<CharacterDocument draft={draft} sheet={sheet}/>).toBlob()
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download=(sheet.name.replace(/[\\/:*?"<>|]/g,'').trim()||'Персонаж')+' — D&D '+draft.edition+'.pdf'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),30_000)
}
