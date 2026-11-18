# Кузница персонажей

Русскоязычный конструктор героев D&D 2014 и 2024. Редактор ведёт через происхождение, характеристики и развитие на каждом уровне, поддерживает мультиклассирование и сохраняет отдельные черновики в IndexedDB. Лист персонажа скачивается в PDF формата A4.

## Запуск

```sh
npm ci
npm run dev
```

Сборка для статического хостинга создаётся командой `npm run build` в `dist/`.

## Проверки

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

Для системного Chromium задайте `CHROMIUM_PATH`. Проверки каталога и движка охватывают обе редакции и все 12 классов до 20-го уровня. Сквозные тесты проходят через редактор и проверяют PDF, восстановление черновика и мобильную сводку.

## Источники

Каталоги основаны на SRD 5.1 и SRD 5.2.1. Интерфейс и названия локализованы на русский язык. Справочные описания приводятся на английском языке из исходных документов. Исходные данные и извлечённые каталоги хранятся отдельно от движка правил.

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

## Материалы кампании

По умолчанию редактор предлагает официальные книги и дополнения. В начале кампании можно оставить только SRD или включить партнёрские материалы, плейтест и Homebrew. Поиск в справочнике работает по русским и английским названиям, с фильтрами по редакции, источнику, классу и уровню заклинания.

Расширенные списки основаны на публичных каталогах [dnd.su](https://dnd.su/) для 2014 года и [next.dnd.su](https://next.dnd.su/) для 2024 года. В карточках сохранены источники и ссылки. Тексты открытых правил взяты из SRD. Описания дополнений открываются по ссылкам на справочник. Для дополнительных видов, черт и подклассов доступная структурированная механика учитывается в редакторе. Ситуационные эффекты, особенности с неполными данными и домашние правила можно добавить вручную в разделе «Дополнительные правила кампании». Сторонние классы и классы спутников доступны в справочнике.
