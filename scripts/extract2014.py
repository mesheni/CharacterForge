#!/usr/bin/env python3
"""Extract SRD 5.1 class tables and spells from Wizards' CC BY 4.0 PDF."""
import argparse
import json
import re
import unicodedata
import fitz

CLASSES = {
    'barbarian': (8, 210), 'bard': (11, 276), 'cleric': (15, 313),
    'druid': (19, 313), 'fighter': (24, 324), 'monk': (26, 565),
    'paladin': (30, 296), 'ranger': (35, 338), 'rogue': (39, 324),
    'sorcerer': (42, 276), 'warlock': (46, 288), 'wizard': (52, 260),
}

def clean(value):
    return re.sub(r'\s+', ' ', value.replace('\xad', '').replace('‐‑', '-').replace('‐', '-').replace('‑', '-')).strip()

def slug(value):
    value = unicodedata.normalize('NFKD', value.lower()).replace("'", '').replace('’', '')
    return re.sub('[^a-z0-9]+', '-', value).strip('-')

def lines(page):
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            spans = line['spans']
            txt = clean(''.join(span['text'] for span in spans))
            if txt and txt != 'System Reference Document 5.1' and not (txt.isdigit() and spans[0]['bbox'][1] > 715):
                yield txt, spans[0]['font'], round(spans[0]['size'], 1), spans[0]['bbox']

def plain(page):
    return [text for text, *_ in lines(page)]

def spell_catalog(pdf):
    lists = {}
    class_id = None
    level = 0
    for txt in [text for p in pdf[104:113] for text in plain(p)]:
        heading = re.fullmatch(r'(\w+) Spells', txt)
        if heading:
            class_id = heading[1].lower()
        elif txt.startswith('Cantrips (0 Level)'):
            level = 0
        elif match := re.fullmatch(r'(\d)(?:st|nd|rd|th) Level', txt):
            level = int(match[1])
        elif re.match(r'[A-Z]', txt) and class_id:
            record = lists.setdefault(slug(txt), dict(id=slug(txt), name=txt, level=level, classes=[]))
            if record['level'] != level:
                print('spell level mismatch', txt, level, record['level'])
            record['classes'].append(class_id)
    descriptors = [text for p in pdf[113:194] for text in plain(p)]
    schools = 'abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation'
    expression = re.compile(r'(?:(\d)(?:st|nd|rd|th)-+level (' + schools + r')|(' + schools + r') cantrip)(?: \(ritual\))?', re.I)
    entries = [(i - 1, expression.fullmatch(txt)) for i, txt in enumerate(descriptors) if expression.fullmatch(txt) and i > 0]
    for (idx, metadata), (next_idx, _) in zip(entries, entries[1:] + [(len(descriptors), None)]):
        name = descriptors[idx]
        key = slug(name)
        if key not in lists:
            print('unlisted spell', repr(name))
            continue
        spell = lists[key]
        spell['school'] = (metadata[2] or metadata[3]).lower()
        spell['ritual'] = '(ritual)' in metadata[0]
        body = ' '.join(descriptors[idx + 2:next_idx])
        if key == 'zone-of-truth':
            body = re.split(r'\bRunning the Game\b|\bTraps\b|\bPoisons\b|\bPoison\b', body)[0].strip()
        spell['text'] = body
    print('spell records:', len(lists), 'descriptions:', sum('text' in v for v in lists.values()))
    print('missing spell descriptions:', [k for k, v in lists.items() if 'text' not in v])
    return sorted(lists.values(), key=lambda s: (s['level'], s['name']))

def class_tables(pdf):
    features, progressions = {}, {}
    class_ids = list(CLASSES)
    for i, class_id in enumerate(class_ids):
        start, right_edge = CLASSES[class_id]
        end = CLASSES[class_ids[i + 1]][0] - 1 if i + 1 < len(class_ids) else 55
        features[class_id] = {}
        progressions[class_id] = {}
        local_x = next(x for txt, font, size, (x, *_) in lines(pdf[start - 1]) if txt == 'Features' and size == 8.9)
        expected = 1
        for page in pdf[start - 1:end]:
            entries = [(txt, x, y) for txt, font, size, (x, y, *_) in lines(page) if size == 8.9 and font == 'Calibri']
            anchors = [(int(found[1]), x, y) for txt, x, y in entries if (found := re.fullmatch(r'(\d+)(?:st|nd|rd|th)', txt)) and (x < 70 or 328 < x < 345)]
            for anchor_i, (level, level_x, y) in enumerate(anchors):
                if level != expected:
                    continue
                offset = 270.9 if level_x > 300 else 0
                feature_left = local_x + offset - 1.5
                feature_right = right_edge + offset
                if class_id == 'barbarian' and level == 20:
                    feature_right = 475
                y_next = next((ny for _, nx, ny in anchors[anchor_i + 1:] if abs(nx - level_x) < 10 and ny > y), y + 35)
                parts = [txt for txt, x, cy in entries if feature_left <= x < feature_right and y - 0.8 <= cy < y_next - 0.8]
                numbers = [txt for txt, x, cy in entries if x >= feature_right and abs(cy - y) < 2]
                feature_names = re.split(r', (?![^()]*\))', ' '.join(parts))
                features[class_id][str(level)] = [part.strip().replace('--', '-') for part in feature_names if part and not re.fullmatch(r'[—–\-̶]+', part)]
                if class_id == 'barbarian' and level == 11:
                    features[class_id][str(level)] = ['Relentless Rage'] # Wraps into the next column.
                if class_id == 'rogue' and level == 10:
                    features[class_id][str(level)] = ['Ability Score Improvement'] # Wraps into the next column.
                if class_id == 'wizard' and level == 20:
                    features[class_id][str(level)] = ['Signature Spells'] # The table truncates the heading.
                if numbers and class_id in {'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'}:
                    progressions[class_id][str(level)] = numbers
                expected += 1
        print(class_id, len(features[class_id]), list(features[class_id].values())[:2])
    return features, progressions

SUBCLASSES = {
    'barbarian': ('Path of the Berserker', {3: ['Frenzy'], 6: ['Mindless Rage'], 10: ['Intimidating Presence'], 14: ['Retaliation']}),
    'bard': ('College of Lore', {3: ['Bonus Proficiencies', 'Cutting Words'], 6: ['Additional Magical Secrets'], 14: ['Peerless Skill']}),
    'cleric': ('Life Domain', {1: ['Bonus Proficiency', 'Disciple of Life'], 2: ['Channel Divinity: Preserve Life'], 6: ['Blessed Healer'], 8: ['Divine Strike'], 17: ['Supreme Healing']}),
    'druid': ('Circle of the Land', {2: ['Bonus Cantrip', 'Natural Recovery'], 3: ['Circle Spells'], 6: ['Land’s Stride'], 10: ['Nature’s Ward'], 14: ['Nature’s Sanctuary']}),
    'fighter': ('Champion', {3: ['Improved Critical'], 7: ['Remarkable Athlete'], 10: ['Additional Fighting Style'], 15: ['Superior Critical'], 18: ['Survivor']}),
    'monk': ('Way of the Open Hand', {3: ['Open Hand Technique'], 6: ['Wholeness of Body'], 11: ['Tranquility'], 17: ['Quivering Palm']}),
    'paladin': ('Oath of Devotion', {3: ['Oath Spells', 'Channel Divinity'], 7: ['Aura of Devotion'], 15: ['Purity of Spirit'], 20: ['Holy Nimbus']}),
    'ranger': ('Hunter', {3: ['Hunter’s Prey'], 7: ['Defensive Tactics'], 11: ['Multiattack'], 15: ['Superior Hunter’s Defense']}),
    'rogue': ('Thief', {3: ['Fast Hands', 'Second-Story Work'], 9: ['Supreme Sneak'], 13: ['Use Magic Device'], 17: ['Thief’s Reflexes']}),
    'sorcerer': ('Draconic Bloodline', {1: ['Dragon Ancestor', 'Draconic Resilience'], 6: ['Elemental Affinity'], 14: ['Dragon Wings'], 18: ['Draconic Presence']}),
    'warlock': ('The Fiend', {1: ['Expanded Spell List', 'Dark One’s Blessing'], 6: ['Dark One’s Own Luck'], 10: ['Fiendish Resilience'], 14: ['Hurl Through Hell']}),
    'wizard': ('School of Evocation', {2: ['Evocation Savant', 'Sculpt Spells'], 6: ['Potent Cantrip'], 10: ['Empowered Evocation'], 14: ['Overchannel']}),
}

def class_descriptions(pdf):
    descriptions = {}
    by_class = {}
    class_ids = list(CLASSES)
    for i, class_id in enumerate(class_ids):
        first = CLASSES[class_id][0]
        last = CLASSES[class_ids[i + 1]][0] - 1 if i + 1 < len(class_ids) else 54
        by_class[class_id] = {}
        named = [v for p in pdf[first - 1:last] for v in lines(p)]
        starts = [i for i, (txt, f, n, _) in enumerate(named) if f.startswith('GillSans') and n >= 12]
        for index, stop in zip(starts, starts[1:] + [len(named)]):
            heading = named[index][0].replace('--', '-')
            tail = ' '.join(txt for txt, _, _, _ in named[index + 1:stop])
            if tail:
                descriptions.setdefault(heading, tail)
                by_class[class_id][heading] = tail
    return descriptions, by_class

def spell_progressions(progressions):
    spell_data = {}
    for class_id, tiers in progressions.items():
        spell_data[class_id] = {}
        for lv in range(1, 21):
            t = tiers.get(str(lv), [])
            values = [int(m[0]) for x in t if (m := re.match(r'^\d+', x))]
            record = {'slots': []}
            if class_id == 'warlock':
                record.update(cantrips=values[0], known=values[1], pactSlots=values[2], pactLevel=values[3], invocations=values[4] if len(values) > 4 else 0)
            elif class_id in {'bard', 'sorcerer'}:
                record.update(cantrips=values[0], known=values[1], slots=values[2:])
            elif class_id in {'cleric', 'druid', 'wizard'}:
                record.update(cantrips=values[0], slots=values[1:])
            elif class_id == 'ranger':
                record.update(known=values[0] if values else 0, slots=values[1:])
            else:
                record.update(slots=values)
            spell_data[class_id][str(lv)] = record
    return spell_data

def row_groups(page, predicate):
    groups = {}
    for txt, font, size, (x, y, *_) in lines(page):
        if size == 8.9 and predicate(x, y):
            groups.setdefault(round(y * 2) / 2, []).append((x, txt.replace('--', '-')))
    return [list(sorted(row)) for _, row in sorted(groups.items())]

def item_catalog(pdf):
    items = {}
    def add(name, kind, cost=None, **meta):
        key = slug(name)
        if key in items:
            return
        num = re.fullmatch(r'([\d,]+) (cp|sp|ep|gp|pp)', cost or '')
        gp = int(num[1].replace(',', '')) * {'cp': .01, 'sp': .1, 'ep': .5, 'gp': 1, 'pp': 10}[num[2]] if num else None
        items[key] = dict(id=key, name=name, kind=kind, **({'cost': gp} if gp is not None else {}), **meta)

    armor_type = 'light'
    for page_n in (63, 64):
        for row in row_groups(pdf[page_n-1], lambda x, y: y > 675 if page_n == 63 else y < 245):
            t = [v for x, v in row]
            if len(t) == 1:
                armor_type = {'Medium Armor':'medium','Heavy Armor':'heavy','Shield':'shield'}.get(t[0], armor_type)
            elif len(t) == 6 and re.match(r'\+?\d', t[2]):
                add(t[0], 'armor', t[1], ac=int(re.match(r'\+?(\d+)', t[2])[1]), armorType=armor_type,
                    strength=int(t[3].split()[-1]) if t[3].startswith('Str') else 0,
                    stealth=t[4]=='Disadvantage', weight=t[5])

    weapon_type = 'simple'
    ranged = False
    for row in row_groups(pdf[65], lambda x, y: y < 515):
        t = [v for x, v in row]
        if len(t) == 1 and t[0].endswith('Weapons'):
            weapon_type = 'martial' if t[0].startswith('Martial') else 'simple'
            ranged = 'Ranged' in t[0]
        elif len(t) == 5 and re.match(r'\d', t[1]):
            name = re.sub(r'^Crossbow, (.+)$', lambda m: f'{m[1].capitalize()} crossbow', t[0])
            add(name, 'weapon', t[1], damage=t[2], weight=t[3], properties=t[4], weaponType=weapon_type, ranged=ranged)

    for predicate in (lambda x, y: x < 270 and y < 700, lambda x, y: x > 320 and y < 590):
        for row in row_groups(pdf[68], predicate):
            t = [v for x, v in row]
            if len(t) == 3 and re.match(r'\d', t[1]):
                add(t[0], 'gear', t[1], weight=t[2])
    for row in row_groups(pdf[69], lambda x, y: x > 320 and 150 < y < 570):
        t = [v for x, v in row]
        if len(t) == 3 and re.match(r'\d', t[1]):
            add(t[0], 'tool', t[1], weight=t[2])
    add('Reliquary', 'gear', '5 gp')
    for content, _, _, _ in lines(pdf[69]):
        if m := re.match(r'(.+? Pack) \(([\d,]+ gp)\)\.', content):
            add(m[1], 'pack', m[2])
    return list(items.values())


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('pdf')
    args.add_argument('output')
    a = args.parse_args()
    with fitz.open(a.pdf) as pdf:
        spells = spell_catalog(pdf)
        features, progressions = class_tables(pdf)
        descriptions, class_descriptions_ = class_descriptions(pdf)
        subclasses = {class_id: dict(name=name, features=levels) for class_id, (name, levels) in SUBCLASSES.items()}
        result = dict(spells=spells, features=features, progressions=progressions,
                      spellProgressions=spell_progressions(progressions),
                      descriptions=descriptions, classDescriptions=class_descriptions_, subclasses=subclasses,
                      items=item_catalog(pdf))
    with open(a.output, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')

if __name__ == '__main__':
    main()
