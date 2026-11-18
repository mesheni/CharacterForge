import { expect, test, type Page, type Locator } from '@playwright/test'
import { existsSync } from 'node:fs'

async function choose(card: Locator, name: RegExp) {
  await card.getByRole('button',{name}).first().click()
}
async function fillChoices(page: Page) {
  for(let pass=0;pass<4;pass++) {
    const fields=page.locator('fieldset.choice-field')
    for(let i=0;i<await fields.count();i++) {
      const field=fields.nth(i)
      for(let pick=0;pick<25;pick++){
        const quantity=(await field.locator('legend span').textContent())?.match(/^(\d+)\/(\d+)$/)
        if(!quantity||quantity[1]===quantity[2])break
        const opener=field.locator('.select-opener')
        if(await opener.count()&&await opener.getAttribute('aria-expanded')==='false')await opener.click()
        const option=field.locator('button.choice-chip[aria-pressed="false"]:enabled').first()
        if(!await option.count())break
        await option.click()
      }
    }
  }
}
async function start(page:Page,year:'2014'|'2024',target:number,cls='Воин') {
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Начало пути'})).toBeVisible()
  await page.waitForFunction(()=>document.querySelector('[aria-busy]')?.getAttribute('aria-busy')==='false')
  await page.getByRole('button',{name:new RegExp('D&D '+year)}).click()
  await page.getByRole('spinbutton',{name:'Целевой уровень'}).fill(String(target))
  if(year==='2014')await page.getByRole('checkbox',{name:'Мультиклассирование разрешено'}).check()
  await page.getByRole('button',{name:'К происхождению'}).click()
  await choose(page.locator('section').filter({has:page.getByRole('heading',{name:year==='2014'?'Народ':'Вид персонажа',exact:true})}),year==='2014'?/^Человек/:/^Дварф/)
  await choose(page.locator('section').filter({has:page.getByRole('heading',{name:'Предыстория',exact:true})}),year==='2014'?/^Послушник/:/^Солдат/)
  await choose(page.locator('section').filter({has:page.getByRole('heading',{name:'Начальный класс',exact:true})}),new RegExp('^'+cls+'\u0020'))
  await fillChoices(page)
  await page.getByRole('button',{name:'К характеристикам'}).click()
  await expect(page.getByRole('heading',{name:'Характеристики',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Распределить'}).click()
  await fillChoices(page)
  await page.getByRole('button',{name:'К первому уровню'}).click()
  await expect(page.getByRole('heading',{name:'Уровень 1',exact:true})).toBeVisible()
}

for (const year of ['2014','2024'] as const) {
  test(year+' · создание персонажа 1-го уровня и скачивание PDF',async({page},testInfo)=>{
    await start(page,year,1)
    await fillChoices(page)
    await page.getByRole('button',{name:'К анкете'}).click()
    await page.getByRole('textbox',{name:'Имя персонажа'}).fill('Алёна Тихая')
    await page.getByRole('textbox',{name:'Биография'}).fill('В поисках своего дома. '.repeat(240)+' Последняя строка истории.')
    await page.getByRole('button',{name:'Открыть анкету'}).click()
    await expect(page.getByRole('heading',{name:'Лист персонажа'})).toBeVisible()
    await expect(page.getByText('Готово к игре')).toBeVisible()
    const save=page.waitForEvent('download')
    await page.getByRole('button',{name:'Скачать PDF'}).click()
    const download=await save
    expect(download.suggestedFilename()).toContain('Алёна Тихая')
    const path=testInfo.outputPath('character-'+year+'.pdf')
    await download.saveAs(path)
    expect(existsSync(path)).toBe(true)
    await page.reload()
    await expect(page.getByRole('heading',{name:'Лист персонажа'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'Алёна Тихая'}).first()).toBeVisible()
  })
  test(year+' · прохождение всех 20 уровней с мультиклассом',async({page},testInfo)=>{
    await start(page,year,20)
    for(let level=1;level<=20;level++){
      if(level>1)await choose(page.locator('section').filter({has:page.getByRole('heading',{name:'Класс на этом уровне',exact:true})}),level===2?/^Плут /:/^Воин /)
      await fillChoices(page)
      const label=level===20?'К анкете':'К уровню '+(level+1)
      await page.getByRole('button',{name:label,exact:true}).click()
      if(level!==20)await expect(page.getByRole('heading',{name:'Уровень '+(level+1),exact:true})).toBeVisible()
    }
    await page.getByRole('textbox',{name:'Имя персонажа'}).fill('Ратмир')
    await page.getByRole('button',{name:'Открыть анкету'}).click()
    await expect(page.getByText('Готово к игре')).toBeVisible()
    await expect(page.getByText('Воин 19', {exact:false}).first()).toBeVisible()
    await expect(page.getByText('Плут 1', {exact:false}).first()).toBeVisible()
    const save=page.waitForEvent('download')
    await page.getByRole('button',{name:'Скачать PDF'}).click()
    const download=await save
    await download.saveAs(testInfo.outputPath('character-level-20-'+year+'.pdf'))
  })
}

test('мобильная сводка и сохранение бросков',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/')
  await page.getByRole('button',{name:'Сводка героя'}).click()
  await expect(page.getByRole('complementary',{name:'Сводка персонажа'})).toBeVisible()
  await page.getByRole('button',{name:'Закрыть сводку'}).click()
  await expect(page.getByRole('complementary',{name:'Сводка персонажа'})).toBeHidden()
  await page.getByRole('button',{name:'Характеристики',exact:true}).click()
  await page.getByRole('button',{name:'Броски кубиков'}).click()
  await page.getByRole('button',{name:'Бросить 4к6'}).click()
  const results=await page.locator('.score-help strong').textContent()
  expect(results).toMatch(/\d+ · \d+ · \d+ · \d+ · \d+ · \d+/)
  await page.reload()
  await expect(page.locator('.score-help strong')).toHaveText(results!)
})

test('заклинатель получает отдельные ячейки магии договора',async({page})=>{
  await start(page,'2024',1,'Колдун')
  await fillChoices(page)
  await page.getByRole('button',{name:'К анкете'}).click()
  await page.getByRole('textbox',{name:'Имя персонажа'}).fill('Зарина')
  await page.getByRole('button',{name:'Открыть анкету'}).click()
  await expect(page.getByText('Готово к игре')).toBeVisible()
  await expect(page.locator('#magic').getByText('Магия договора',{exact:true})).toBeVisible()
  await expect(page.locator('#magic').getByText(/1 яч\. 1-го уровня/)).toBeVisible()
  await expect(page.locator('#magic').getByText(/Сл 12/)).toBeVisible()
})

test('основной экран помещается на мобильном и доступен с клавиатуры',async({page},testInfo)=>{
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Начало пути'})).toBeVisible()
  await page.screenshot({path:testInfo.outputPath('desktop.png'),fullPage:true})
  await page.setViewportSize({width:360,height:780})
  await expect(page.getByRole('button',{name:'Справочник'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  await page.getByRole('button',{name:'К происхождению'}).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading',{name:'Происхождение',exact:true})).toBeFocused()
})

test('справочник находит заклинание из дополнения и открывает его источник',async({page})=>{
  await page.goto('/')
  await page.getByRole('button',{name:'Справочник'}).click()
  const dialog=page.getByRole('dialog')
  await dialog.getByRole('button',{name:'D&D 2014'}).click()
  await dialog.getByRole('textbox',{name:'Поиск по справочнику'}).fill('Booming Blade')
  const link=dialog.getByRole('link',{name:'Громовой клинок на dnd.su'})
  await expect(link).toHaveAttribute('href',/https:\/\/dnd\.su\/spells\/.*booming-blade/)
  await dialog.getByRole('textbox',{name:'Поиск по справочнику'}).fill('Frostball')
  await expect(dialog.getByText('Ничего не найдено.')).toBeVisible()
  await dialog.getByRole('checkbox',{name:'Партнёрские, плейтест и Homebrew'}).check()
  await expect(dialog.getByRole('link',{name:'Ледяной шар на dnd.su'}).first()).toBeVisible()
})

test('заклинание из дополнения выбирается и попадает в анкету',async({page})=>{
  await start(page,'2014',1,'Волшебник')
  const cantrips=page.locator('fieldset').filter({has:page.getByText('Заговоры · Волшебник',{exact:false})}).first()
  await cantrips.locator('.select-opener').click()
  await cantrips.getByRole('textbox',{name:/Поиск/}).fill('Громовой клинок')
  await cantrips.getByRole('button',{name:/^Громовой клинок/}).click()
  await cantrips.getByRole('textbox',{name:/Поиск/}).clear()
  await fillChoices(page)
  await page.getByRole('button',{name:'К анкете'}).click()
  await page.getByRole('textbox',{name:'Имя персонажа'}).fill('Арканист')
  await page.getByRole('button',{name:'Открыть анкету'}).click()
  await expect(page.getByText('Готово к игре')).toBeVisible()
  await page.locator('#magic').getByText('Громовой клинок',{exact:false}).click()
  await expect(page.locator('#magic').getByRole('link',{name:'Описание на dnd.su'}).last()).toHaveAttribute('href',/booming-blade/)
})
