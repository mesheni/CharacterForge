import { describe, expect, it } from 'vitest'
import { createDraft, derive, modifier, pointCost, rollScores } from '../src/rules'
import { catalogs } from '../src/catalog'

describe('правила персонажа', () => {
  it('содержит 12 классов и списки заклинаний для обеих редакций', () => {
    for (const catalog of Object.values(catalogs)) {
      expect(catalog.classes).toHaveLength(12)
      expect(catalog.spells.length).toBeGreaterThan(250)
    }
  })
  it('считает модификаторы, очки и броски', () => {
    expect(modifier(9)).toBe(-1)
    expect(pointCost([15, 15, 15, 8, 8, 8])).toBe(27)
    expect(pointCost([16, 8, 8, 8, 8, 8])).toBe(Infinity)
    expect(rollScores(() => 0.5)).toEqual([12, 12, 12, 12, 12, 12])
  })
  it('считает хиты, кости хитов и мастерство по порядку классов', () => {
    const draft = createDraft('2014')
    Object.assign(draft, { species: 'human', background: 'acolyte', target: 5, base: [15, 14, 13, 8, 12, 10] })
    draft.options.multiclass = true
    draft.levels = ['fighter', 'rogue', 'fighter', 'fighter', 'fighter'].map(classId => ({ classId, choices: {} }))
    const sheet = derive(draft)
    expect(sheet.classLevels).toEqual({ fighter: 4, rogue: 1 })
    expect(sheet.hitDice).toEqual({ 10: 4, 8: 1 })
    expect(sheet.proficiency).toBe(3)
    expect(sheet.hp).toBe(43)
  })
  it('повторно проверяет требования к мультиклассу после ранней правки', () => {
    const draft = createDraft('2024')
    Object.assign(draft, { target: 2, base: [15, 8, 14, 13, 12, 10] })
    draft.levels = [{ classId: 'fighter', choices: {} }, { classId: 'rogue', choices: {} }]
    expect(derive(draft).issues.some(issue => issue.step === 2 && issue.message.includes('Ловкость'))).toBe(true)
  })
  it('учитывает разное получение подкласса жрецом', () => {
    for (const edition of ['2014', '2024'] as const) {
      const draft = createDraft(edition)
      draft.levels = [{ classId: 'cleric', choices: {} }]
      expect(derive(draft).choices[1]?.some(choice => choice.id === 'subclass')).toBe(edition === '2014')
    }
  })
})

describe('пограничные случаи двух редакций', () => {
  it('не записывает щит в обязательный выбор оружия', () => {
    const draft = createDraft('2014')
    draft.levels = [{classId:'fighter',choices:{'class-kit-1':['martial-shield']}}]
    const weapon=derive(draft).choices[1].find(choice=>choice.id.startsWith('class-weapon'))
    expect(weapon?.value).toEqual([])
    expect(weapon?.options.some(option=>option.id==='shield')).toBe(false)
  })
  it('раздельно считает ячейки при раннем мультиклассе жреца с паладином', () => {
    for (const edition of ['2014','2024'] as const) {
      const draft=createDraft(edition)
      Object.assign(draft,{target:2,base:[15,10,12,8,14,13]})
      draft.options.multiclass=true
      draft.levels=[{classId:'cleric',choices:{}},{classId:'paladin',choices:{}}]
      expect(derive(draft).slots).toEqual(edition==='2024'?[3]:[2])
    }
  })
  it('сохраняет минимум одного хита при низком броске каждого уровня', () => {
    const draft=createDraft('2024')
    Object.assign(draft,{target:2,base:[15,14,8,12,13,10]})
    draft.levels=[{classId:'fighter',choices:{}},{classId:'fighter',choices:{},hpMode:'roll',hpRoll:1}]
    expect(derive(draft).hp).toBe(10)
  })
  it('предлагает оружейное мастерство паладину, следопыту и плуту', () => {
    for (const classId of ['paladin','ranger','rogue']) {
      const draft=createDraft('2024')
      draft.levels=[{classId,choices:{}}]
      expect(derive(draft).choices[1].find(choice=>choice.id==='weapon-mastery')?.count).toBe(2)
    }
  })
})

describe.each(['2014','2024'] as const)('сборка героев %s', edition=>{
  for (const characterClass of catalogs[edition].classes) {
    it('завершает развитие класса «'+characterClass.name+'» до 20-го уровня',()=>{
      const draft=createDraft(edition)
      Object.assign(draft,{target:20,name:'Тестовый герой',species:edition==='2014'?'human':'dwarf',background:edition==='2014'?'acolyte':'soldier',base:[15,14,13,12,10,8]})
      draft.levels=Array.from({length:20},()=>({classId:characterClass.id,choices:{}}))
      for(let pass=0;pass<340;pass++){
        const sheet=derive(draft)
        const pending=Object.entries(sheet.choices).sort(([a],[b])=>Number(a)-Number(b)).flatMap(([step,choices])=>choices.map(choice=>({step:Number(step),choice}))).find(({choice})=>!choice.optional&&choice.value.length<choice.count)
        if(!pending)break
        const {step,choice}=pending
        const value=[...choice.value,...choice.options.filter(option=>!choice.value.includes(option.id)).map(option=>option.id)].slice(0,choice.count)
        if(value.length!==choice.count)throw new Error('Недостаточно вариантов: '+choice.name)
        const settings=step<=0?draft.origin:draft.levels[step-1].choices
        settings[choice.id]=value
      }
      const sheet=derive(draft)
      for(const choices of Object.values(sheet.choices)) expect(new Set(choices.map(choice=>choice.id)).size).toBe(choices.length)
      expect(sheet.issues).toEqual([])
      expect(sheet.classLevels[characterClass.id]).toBe(20)
      expect(sheet.ready).toBe(true)
    })
  }
})
