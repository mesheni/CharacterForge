#!/usr/bin/env python3
"""Extract catalog entries from the CC-BY 4.0 SRD 5.2.1 PDF (PyMuPDF)."""
import collections
import json
import re
import sys
import unicodedata

import fitz

source = sys.argv[1] if len(sys.argv) > 1 else '2024.pdf'
dest = sys.argv[2] if len(sys.argv) > 2 else 'catalog2024.json'
doc = fitz.open(source)
class_pages = {name: page for name, page in zip(
    'barbarian bard cleric druid fighter monk paladin ranger rogue sorcerer warlock wizard'.split(),
    (28, 31, 36, 41, 47, 50, 53, 58, 62, 65, 71, 77))}
subclasses = dict(zip(class_pages, (
    'Path of the Berserker', 'College of Lore', 'Life Domain', 'Circle of the Land',
    'Champion', 'Warrior of the Open Hand', 'Oath of Devotion', 'Hunter', 'Thief',
    'Draconic Sorcery', 'Fiend Patron', 'Evoker')))

def slug(name):
    name = unicodedata.normalize('NFKD', name).lower().replace('’', '').replace("'", '')
    return re.sub(r'[^a-z0-9]+', '-', name).strip('-')

def extract_lines(page):
    result = []
    for block in doc[page - 1].get_text('dict')['blocks']:
        for line in block.get('lines', []):
            spans = line['spans']
            first = spans[0]
            x, y = first['bbox'][:2]
            value = ''.join(span['text'] for span in spans).strip()
            if value and y < 735:
                result.append((x, y, first['size'], first['font'], value))
    return result

pages = {p: extract_lines(p) for p in range(27, 177)}
def readers(page):
    return sorted(pages[page], key=lambda line: (line[0] >= 302, line[1], line[0]))

def join_text(lines):
    joined = ''
    for line in lines:
        if joined.endswith('-') and line[:1].islower():
            joined = joined[:-1] + line
        else:
            joined += (' ' if joined else '') + line
    return re.sub(r'\s+', ' ', joined).strip()

features = {}
progressions = {}
for cls, pg in class_pages.items():
    lines = pages[pg]
    header = next(line for line in lines if line[4] == 'Class Features' and line[3] == 'GillSans-SemiBold')
    rows = sorted((line for line in lines if line[3] == 'GillSans'
                   and line[2] == 9.5 and abs(line[0] - (header[0] - 82)) < 17
                   and line[1] > header[1] and line[4].isdigit()
                   and 1 <= int(line[4]) <= 20), key=lambda line: line[1])
    assert [int(row[4]) for row in rows] == list(range(1, 21)), (cls, rows)
    features[cls] = {}
    progressions[cls] = {}
    stat_x = {
        'barbarian': 395, 'bard': 263, 'cleric': 258, 'druid': 257, 'fighter': 424,
        'monk': 369, 'paladin': 300, 'ranger': 303, 'rogue': 444, 'sorcerer': 239,
        'warlock': 304, 'wizard': 276,
    }[cls]
    keys = {
        'barbarian': ('rages','rageDamage','mastery'),
        'bard': ('inspiration','cantrips','prepared'),
        'cleric': ('channelDivinity','cantrips','prepared'),
        'druid': ('wildShape','cantrips','prepared'),
        'fighter': ('secondWind','mastery'),
        'monk': ('martialArts','focusPoints','movement'),
        'paladin': ('channelDivinity','prepared'),
        'ranger': ('favoredEnemy','prepared'),
        'rogue': ('sneakAttack',),
        'sorcerer': ('sorceryPoints','cantrips','prepared'),
        'warlock': ('invocations','cantrips','prepared','pactSlots','pactLevel'),
        'wizard': ('cantrips','prepared'),
    }[cls]
    for i, row in enumerate(rows):
        y, level = row[1], row[4]
        end = rows[i + 1][1] if i + 1 < len(rows) else y + 27
        names = sorted((line for line in lines if abs(line[0] - header[0]) < 6
                        and y - 1 <= line[1] < end - 2 and line[3] == 'GillSans'),
                       key=lambda line: line[1])
        features[cls][level] = [v.strip() for v in join_text([line[4] for line in names]).split(',')
                                if v.strip() and v.strip() != '—']
        stats = sorted((line for line in lines if line[0] >= stat_x and abs(line[1] - y) < 2 and line[3] == 'GillSans'),
                       key=lambda line: line[0])
        vals = [line[4] for line in stats]
        expected = len(keys) + (9 if cls in ('bard','cleric','druid','sorcerer','wizard') else 5 if cls in ('paladin','ranger') else 0)
        assert len(vals) == expected, (cls, level, vals, expected)
        vals = [int(v) if v.isdigit() else 0 if v == '—' else v for v in vals]
        progressions[cls][level] = dict(zip(keys, vals))
        if len(vals) > len(keys):
            progressions[cls][level]['slots'] = vals[len(keys):]

spell_head = re.compile(r'^(?:Level (\d) (\w+)|(\w+) Cantrip) \(([^)]+)\)')
spell_rows = [line for page in range(107, 176) for line in readers(page)]
spells = []
for i, line in enumerate(spell_rows):
    x, y, size, font, title = line
    if not font.startswith('GillSans-SemiBold') or size != 12 or i + 1 == len(spell_rows):
        continue
    metadata_parts = [spell_rows[i+1][4]]
    k = i + 2
    while k < len(spell_rows) and spell_rows[k][3] == 'Cambria-Italic' and not metadata_parts[-1].endswith(')'):
        metadata_parts.append(spell_rows[k][4])
        k += 1
    match = spell_head.match(join_text(metadata_parts))
    if not match:
        continue
    level, school, cantrip_school, available = match.groups()
    spells.append((i, k, dict(id=slug(title), name=title, level=int(level or 0),
                            classes=[cls.strip().lower() for cls in available.split(',')],
                            school=school or cantrip_school)))
data_spells = []
for idx, (_, start, spell) in enumerate(spells):
    end = spells[idx + 1][0] if idx + 1 < len(spells) else len(spell_rows)
    spell['text'] = join_text([line[4] for line in spell_rows[start:end] if line[3].startswith('Cambria') or line[3].startswith('GillSans')])
    data_spells.append(spell)

class_data = {}
descriptions = {}
subclass_features = {}
species_features = {}
feats = collections.defaultdict(list)
sections = list(class_pages)
section_page = {k: v - (1 if k in ('monk','ranger','rogue','sorcerer','warlock') else 0)
                for k,v in class_pages.items()}
active_class = None
active_subclass = None
active = None
buffer = []
def save_section():
    if active:
        section, key = active
        body = join_text(buffer)
        if body:
            section[key] = body
            if section is not descriptions and key not in descriptions:
                descriptions[key] = body
    buffer.clear()

for page in range(28, 83):
    for x,y,size,font,line in readers(page):
        semibold = font.startswith('GillSans-SemiBold')
        if semibold and size == 18 and line.lower() in class_pages:
            save_section()
            active_class = line.lower()
            active = None
            active_subclass = None
            class_data[active_class] = {}
            subclass_features[active_class] = {}
            continue
        if not active_class:
            continue
        if semibold and (size >= 14 or line == subclasses[active_class]):
            save_section()
            active = None
            if 'Subclass:' in line or line == subclasses[active_class]:
                active_subclass = subclasses[active_class]
            continue
        match = re.fullmatch(r'Level (\d+): (.+)', line) if semibold and size == 12 else None
        if match:
            save_section()
            level, label = match.groups()
            if active_subclass:
                subclass_features[active_class].setdefault(level, []).append(label)
                active = (descriptions, label)
            else:
                active = (class_data[active_class], label)
            continue
        if active and font.startswith('Cambria'):
            buffer.append(line)
save_section()

items = []
weapons = pages[91]
weapon_headers = sorted((l for l in weapons if 49 < l[0] < 58 and l[3] == 'GillSans-Italic'), key=lambda l:l[1])
weapon_names = sorted((l for l in weapons if 58 <= l[0] < 91 and l[3] == 'GillSans' and l[2] == 9.5), key=lambda l:l[1])
for i, (x,y,_,_,name) in enumerate(weapon_names):
    stop = weapon_names[i+1][1] if i+1 < len(weapon_names) else y+29
    category = [line[4] for line in weapon_headers if line[1] < y][-1]
    aligned = sorted((l for l in weapons if l[0] > 100 and abs(l[1]-y)<2 and l[3]=='GillSans'),key=lambda l:l[0])
    assert len(aligned) == 5, (name,aligned)
    damage, _, mastery, weight, cost = (l[4] for l in aligned)
    props = join_text([l[4] for l in sorted(weapons, key=lambda a:a[1]) if 208 < l[0] < 235 and y-1 < l[1] < stop-2])
    items.append(dict(id=slug(name), name=name, kind='weapon', category=category, cost=cost, damage=damage, properties=props, weight=weight, mastery=mastery))

armor = pages[92]
armor_headers = sorted((l for l in armor if 62 < l[0] < 71 and l[3] == 'GillSans-Italic' and l[1] > 340), key=lambda l:l[1])
armor_names = sorted((l for l in armor if 73 <= l[0] < 98 and l[3] == 'GillSans' and l[2] == 9.5 and l[1]>355), key=lambda l:l[1])
for x,y,_,_,name in armor_names:
    aligned = sorted((l for l in armor if l[0] > 175 and abs(l[1]-y)<2 and l[3]=='GillSans'),key=lambda l:l[0])
    if len(aligned) < 5:
        continue
    category = [line[4] for line in armor_headers if line[1] < y][-1].split(' (')[0]
    ac, strength, stealth, weight, cost = (l[4] for l in aligned)
    items.append(dict(id=slug(name), name=name, kind='shield' if name == 'Shield' else 'armor',
                      category=category, cost=cost, ac=ac, strength=strength, stealth=stealth, weight=weight))

def two_column_equipment(page, min_y, kind, lower_x=63, upper_x=79):
    lines = pages[page]
    names = [l for l in readers(page) if lower_x < l[0] % 252 < upper_x and l[3] == 'GillSans'
             and l[2] == 9.5 and l[1] > min_y and l[4] not in ('Name','Item')]
    for x,y,_,_,name in names:
        others = sorted((l for l in lines if 135 < l[0]-x < 230 and abs(l[1]-y)<2 and l[3]=='GillSans'),key=lambda l:l[0])
        if len(others) == 2 and (re.search(r'(?:CP|SP|GP|PP)$', others[-1][4]) or others[-1][4] == 'Varies'):
            items.append(dict(id=slug(name), name=name, kind=kind, cost=others[-1][4], weight=others[0][4]))

two_column_equipment(95, 57, 'gear')
# Include the ammo table where the numeric quantity is a different column.
for x,y,size,font,name in pages[96]:
    if 64 < x < 72 and 62 < y < 140 and size == 9.5 and font == 'GillSans':
        row = sorted((l for l in pages[96] if 146 < l[0] < 282 and abs(l[1]-y)<2 and l[3]=='GillSans'),key=lambda l:l[0])
        if len(row) == 4:
            items.append(dict(id=slug(name), name=name, kind='gear', cost=row[-1][4], weight=row[-2][4], quantity=int(row[0][4])))

feat_category = None
active = None
for page in [87,88]:
    for x,y,size,font,line in readers(page):
        if font == 'GillSans-SemiBold' and size == 14 and line.endswith(' Feats'):
            save_section()
            active = None
            feat_category = line[:-6]
        elif font == 'GillSans-SemiBold' and size == 12 and feat_category:
            save_section()
            active = (descriptions, line)
            feats[feat_category].append(dict(id=slug(line), name=line))
        elif active and font.startswith('Cambria'):
            buffer.append(line)
save_section()
def option_group(page_range, after, before):
    active_group = False
    group = []
    current = None
    body = []
    for page in page_range:
        for _,_,size,font,line in readers(page):
            if line == after:
                active_group = True
                continue
            if line == before:
                active_group = False
                continue
            if not active_group:
                continue
            if font.startswith('GillSans-SemiBold') and size == 12:
                if current:
                    current['text'] = join_text(body)
                current = dict(id=slug(line), name=line)
                group.append(current)
                body.clear()
            elif current and (font.startswith('Cambria') or font.startswith('GillSans')):
                body.append(line)
    if current:
        current['text'] = join_text(body)
    return group

invocations = option_group(range(72,75), 'Eldritch Invocation Options', 'Warlock Spell List')
for entry in invocations:
    text = entry['text']
    warlock = re.match(r'Prerequisite: Level (\d+)\+? Warlock', text)
    entry['minLevel'] = int(warlock[1]) if warlock else 1
    prereq_invocation = re.match(r'Prerequisite: [^,]+, (.+?) Invocation', text)
    if prereq_invocation:
        entry['requiresInvocation'] = slug(prereq_invocation[1])
    entry['repeatable'] = 'Repeatable.' in text
metamagic = option_group(range(66,68), 'Metamagic Options', 'Sorcerer Spell List')

for page in [93,94]:
    for x, y, size, font, value in readers(page):
        if page == 94 and (x>=300 and y>234):
            continue
        if size != 12 or font != 'GillSans-SemiBold':
            continue
        match = re.fullmatch(r'(.+) \((\d+ GP)\)', value)
        if match:
            name, cost = match.groups()
            weight = next((l[4][8:] for l in pages[page] if x < l[0] < x+130
                           and y < l[1] < y+19 and l[4].startswith('Weight: ')), '')
            items.append(dict(id=slug(name), name=name, kind='tool', cost=cost, weight=weight))
for name,cost,weight in [
    ('Dice Set','1 SP',''), ('Dragonchess Set','1 GP',''), ('Playing Card Set','5 SP',''),
    ('Three-Dragon Ante Set','1 GP',''), ('Bagpipes','30 GP','6 lb.'),
    ('Drum','6 GP','3 lb.'), ('Dulcimer','25 GP','10 lb.'), ('Flute','2 GP','1 lb.'),
    ('Horn','3 GP','2 lb.'), ('Lute','35 GP','2 lb.'), ('Lyre','30 GP','2 lb.'),
    ('Pan Flute','12 GP','2 lb.'), ('Shawm','2 GP','1 lb.'), ('Viol','30 GP','1 lb.'),
]:
    items.append(dict(id=slug(name), name=name, kind='tool', cost=cost, weight=weight))

magic_items = []
magic_rows = [line for page in range(209, 254) for line in sorted(extract_lines(page), key=lambda line:(line[0]>=302,line[1],line[0]))]
for i, (_,_,size,font,value) in enumerate(magic_rows[:-1]):
    if size != 12 or not font.startswith('GillSans-SemiBold'):
        continue
    n = i + 1
    title = [value]
    while n < len(magic_rows) and magic_rows[n][2] == 12 and magic_rows[n][3].startswith('GillSans-SemiBold') and abs(magic_rows[n][1]-magic_rows[n-1][1]) < 15:
        title.append(magic_rows[n][4])
        n += 1
    if i and abs(magic_rows[i][1]-magic_rows[i-1][1]) < 15 and magic_rows[i-1][2] == 12 and magic_rows[i-1][3].startswith('GillSans-SemiBold'):
        continue
    heading = []
    while n < len(magic_rows) and magic_rows[n][3] == 'Cambria-Italic':
        heading.append(magic_rows[n][4])
        n += 1
    tag = join_text(heading)
    if not any(r in tag for r in ['Common','Uncommon','Rare','Legendary','Artifact']):
        continue
    name = join_text(title)
    magic_items.append(dict(id=slug(name), name=name, kind='magic', category=tag))

species_info = {}
active_species = None
body = []
for page in range(84,87):
    for _,_,size,font,line in readers(page):
        if font.startswith('GillSans-SemiBold') and size==12 and line in ('Dragonborn','Dwarf','Elf','Gnome','Goliath','Halfling','Human','Orc','Tiefling'):
            if active_species:
                species_info[active_species] = join_text(body)
            active_species = slug(line)
            body.clear()
        elif active_species and (font.startswith('Cambria') or font.startswith('GillSans')):
            body.append(line)
if active_species:
    species_info[active_species] = join_text(body)

bonus_spells = {
    'cleric': {3: ['Aid','Bless','Cure Wounds','Lesser Restoration'], 5: ['Mass Healing Word','Revivify'], 7: ['Aura of Life','Death Ward'], 9: ['Greater Restoration','Mass Cure Wounds']},
    'paladin': {3: ['Protection from Evil and Good','Shield of Faith'],5: ['Aid','Zone of Truth'],9: ['Beacon of Hope','Dispel Magic'],13: ['Freedom of Movement','Guardian of Faith'],17: ['Commune','Flame Strike']},
    'sorcerer': {3: ['Alter Self','Chromatic Orb','Command','Dragon’s Breath'],5: ['Fear','Fly'],7: ['Arcane Eye','Charm Monster'],9: ['Legend Lore','Summon Dragon']},
    'warlock': {3: ['Burning Hands','Command','Scorching Ray','Suggestion'],5: ['Fireball','Stinking Cloud'],7: ['Fire Shield','Wall of Fire'],9: ['Geas','Insect Plague']},
}
land_spells = {
    'arid': {3:['Blur','Burning Hands','Fire Bolt'],5:['Fireball'],7:['Blight'],9:['Wall of Stone']},
    'polar': {3:['Fog Cloud','Hold Person','Ray of Frost'],5:['Sleet Storm'],7:['Ice Storm'],9:['Cone of Cold']},
    'temperate': {3:['Misty Step','Shocking Grasp','Sleep'],5:['Lightning Bolt'],7:['Freedom of Movement'],9:['Tree Stride']},
    'tropical': {3:['Acid Splash','Ray of Sickness','Web'],5:['Stinking Cloud'],7:['Polymorph'],9:['Insect Plague']},
}
for group in [bonus_spells,land_spells]:
    for cls,levels in group.items():
        for level,names in levels.items():
            group[cls][level] = [slug(name) for name in names]

with open(dest, 'w', encoding='utf-8') as out:
    json.dump(dict(spells=data_spells, features=features, descriptions=descriptions, classDescriptions=class_data,
                   subclassFeatures=subclass_features, subclasses=subclasses, progressions=progressions,
                   feats=feats, items=items, magicItems=magic_items, invocations=invocations, metamagic=metamagic,
                   speciesDescriptions=species_info, bonusSpells=bonus_spells, landSpells=land_spells), out, ensure_ascii=False, separators=(',', ':'))
print('spells', len(data_spells), 'unique', len(set(a['id'] for a in data_spells)))
print('classes', {k: sum(map(len,v.values())) for k,v in features.items()})
print('subclasses', {k: sum(map(len,v.values())) for k,v in subclass_features.items()})
print('items', len(items), dict(collections.Counter(a['kind'] for a in items)))
