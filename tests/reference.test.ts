import { describe, expect, it } from 'vitest'
import { catalogFor } from '../src/catalog'
import { createDraft, derive } from '../src/rules'

describe('расширенные справочники',()=>{
  for(const edition of ['2014','2024'] as const){
    it(edition+' расширяет SRD и сохраняет стабильные идентификаторы',()=>{
      const srd=catalogFor(edition,'srd')
      const official=catalogFor(edition,'official')
      const all=catalogFor(edition,'all')
      expect(official.spells.length).toBeGreaterThan(srd.spells.length)
      expect(new Set(all.spells.map(spell=>spell.id)).size).toBe(all.spells.length)
      expect(all.spells.length).toBeGreaterThanOrEqual(official.spells.length)
      const fireball=official.spells.find(spell=>spell.id==='fireball')
      expect(fireball?.text).toBe(srd.spells.find(spell=>spell.id==='fireball')?.text)
      expect(fireball?.url).toMatch(/https:\/\/(next\.)?dnd\.su\//)
      expect(official.backgrounds.length).toBeGreaterThan(srd.backgrounds.length)
      expect(official.subclassOptions.fighter.length).toBeGreaterThan(1)
    })
  }
  it('сохраняет выбор подкласса из старых черновиков',()=>{
    const draft=createDraft('2024')
    draft.target=3
    draft.levels=Array.from({length:3},(_,i)=>({classId:'fighter',choices:i===2?{subclass:['default']}:{} as Record<string,string[]>}))
    expect(derive(draft).subclasses.fighter).toBe('Чемпион')
  })
  it('показывает заговоры вне SRD в реальном выборе мага',()=>{
    const draft=createDraft('2014')
    draft.levels=[{classId:'wizard',choices:{}}]
    const names=derive(draft).choices[1].find(choice=>choice.id==='cantrips')?.options.map(option=>option.id)
    expect(names).toContain('sword-burst')
  })
})

describe('варианты вне SRD и полнота листа',()=>{
  it('разводит официальный каталог и Homebrew',()=>{
    const official=catalogFor('2014','official')
    const all=catalogFor('2014','all')
    expect(official.spells.some(entry=>entry.id==='booming-blade')).toBe(true)
    expect(official.spells.some(entry=>entry.id.startsWith('homebrew-'))).toBe(false)
    expect(all.spells.filter(entry=>entry.id.startsWith('homebrew-'))).toHaveLength(2512)
    expect(catalogFor('2024','official').items.some(entry=>entry.id==='alchemy-jug')).toBe(true)
  })
  it('выдаёт бойцу 2014 с подклассом «Мистический рыцарь» верные школы и ячейки',()=>{
    const draft=createDraft('2014')
    draft.target=3
    draft.levels=[{classId:'fighter',choices:{}},{classId:'fighter',choices:{}},{classId:'fighter',choices:{subclass:['eldritch-knight'],'known-free':['find-familiar'],known:['magic-missile','shield']}}]
    const sheet=derive(draft)
    expect(sheet.slots).toEqual([2])
    expect(sheet.choices[3].some(choice=>choice.id==='known'&&choice.options.some(option=>option.id==='find-familiar'))).toBe(false)
    expect(sheet.magic[0]?.spells.map(entry=>entry.spell.id)).toEqual(expect.arrayContaining(['magic-missile','shield','find-familiar']))
  })
  it('проверяет минимальный уровень воззвания и показывает полученное заклинание',()=>{
    const draft=createDraft('2024')
    draft.target=2
    draft.levels=[{classId:'warlock',choices:{invocations:['pact-of-the-blade']}},{classId:'warlock',choices:{invocations:['pact-of-the-blade','armor-of-shadows','eldritch-smite']}}]
    const sheet=derive(draft)
    expect(sheet.choices[2].find(choice=>choice.id==='invocations')?.options.some(entry=>entry.id==='eldritch-smite')).toBe(false)
    expect(sheet.magic.flatMap(section=>section.spells).find(entry=>entry.spell.id==='mage-armor')?.status).toContain('По желанию')
  })
  it('показывает «Желание» чародея и слова силы барда в анкете 2024',()=>{
    for(const [classId,expected] of [['sorcerer',['wish']],['bard',['power-word-heal','power-word-kill']]] as const){
      const draft=createDraft('2024')
      draft.target=20
      draft.levels=Array.from({length:20},()=>({classId,choices:{}}))
      expect(derive(draft).magic.flatMap(section=>section.spells.map(entry=>entry.spell.id))).toEqual(expect.arrayContaining([...expected]))
    }
  })
  it('даёт барду 2014 уникальные «Тайны магии» и полный список заклинаний',()=>{
    const draft=createDraft('2014')
    Object.assign(draft,{target:20,species:'human',background:'acolyte',base:[8,14,13,12,10,15],name:'Сказитель'})
    draft.levels=Array.from({length:20},()=>({classId:'bard',choices:{}}))
    for(let pass=0;pass<200;pass++){
      const sheet=derive(draft)
      const next=Object.entries(sheet.choices).sort(([a],[b])=>Number(a)-Number(b)).flatMap(([step,choices])=>choices.map(choice=>({step:Number(step),choice})))
        .find(({choice})=>!choice.optional&&choice.value.length<choice.count)
      if(!next)break
      const {step,choice}=next
      const chosen=[...choice.value,...choice.options.filter(option=>!choice.value.includes(option.id)).map(option=>option.id)].slice(0,choice.count)
      if(chosen.length!==choice.count)throw new Error('Недостаточно вариантов: '+choice.name)
      ;(step<1?draft.origin:draft.levels[step-1].choices)[choice.id]=chosen
    }
    const sheet=derive(draft)
    expect(sheet.issues).toEqual([])
    expect(sheet.magic.find(section=>section.name==='Бард')?.spells).toHaveLength(28)
  })
  it('анкетирует PHB-варианты вида и даёт настоящие способности',()=>{
    const draft=createDraft('2014')
    Object.assign(draft,{target:5,species:'elf-drow',background:'acolyte',base:[8,14,13,12,10,15]})
    const sheet=derive(draft)
    expect(sheet.values.dex).toBe(16)
    expect(sheet.values.cha).toBe(16)
    expect(sheet.magic.flatMap(book=>book.spells.map(entry=>entry.spell.id))).toEqual(expect.arrayContaining(['dancing-lights','faerie-fire','darkness']))
  })
})

describe('сверка основных книг',()=>{
  it('считает дополнительные языки предысторий D&D 2014',()=>{
    for(const [background,count] of [['noble',2],['sage',3],['hermit',2],['guild-artisan',2]] as const){
      const draft=createDraft('2014')
      Object.assign(draft,{species:'human',background})
      expect(derive(draft).choices[0]?.find(choice=>choice.id==='languages')?.count).toBe(count)
    }
  })
  it('даёт Дуэлянта в официальном списке боевых стилей 2024',()=>{
    const draft=createDraft('2024')
    draft.levels=[{classId:'fighter',choices:{style:['dueling']}}]
    expect(derive(draft).choices[1].find(choice=>choice.id==='style')?.value).toEqual(['dueling'])
    draft.options.content='srd'
    expect(derive(draft).choices[1].find(choice=>choice.id==='style')?.options.some(option=>option.id==='dueling')).toBe(false)
  })
})

describe('предыдущие анкеты и требования дополнений',()=>{
  it('сохраняет режим SRD у старого черновика',()=>{
    const draft=createDraft('2014')
    delete draft.options.content
    expect(derive(draft).catalog.spells).toHaveLength(319)
    expect(derive(createDraft('2014')).catalog.spells.length).toBeGreaterThan(319)
  })
  it('проверяет происхождение для черт из дополнений',()=>{
    const draft=createDraft('2014')
    draft.target=4
    draft.options.feats=true
    draft.species='dwarf'
    draft.levels=Array.from({length:4},()=>({classId:'fighter',choices:{}}))
    const ids=derive(draft).choices[4]?.find(choice=>choice.id==='advancement')?.options.map(option=>option.id)
    expect(ids).toContain('dwarven-fortitude')
    expect(ids).not.toContain('elven-accuracy')
    expect(ids).not.toContain('dragon-fear')
  })
  it('применяет владения доменов 2014 и показывает бонусный заговор',()=>{
    for(const subclass of ['tempest','war','light']){
      const draft=createDraft('2014')
      draft.levels=[{classId:'cleric',choices:{subclass:[subclass]}}]
      const sheet=derive(draft)
      if(subclass==='light')expect(sheet.magic.flatMap(source=>source.spells.map(entry=>entry.spell.id))).toContain('light')
      else expect(sheet.profs).toEqual(expect.arrayContaining(['Воинское оружие','Тяжёлые доспехи']))
    }
  })
})
