#!/usr/bin/env python3
"""Extract SRD 5.1 subclass spell tables and magic items."""
import argparse
import json
import re
import fitz
from extract2014 import lines, slug

def spell_rows(page, title):
    tables = []
    active = False
    level = None
    for txt, font, size, bbox in lines(page):
        if txt == title:
            active = True
            level = None
            tables.append({})
        elif active and font in ('Calibri', 'Calibri-Italic') and size == 8.9:
            if level_match := re.fullmatch(r'(\d+)(?:st|nd|rd|th)', txt):
                level = int(level_match[1])
                tables[-1][level] = []
            elif level is not None and font == 'Calibri-Italic':
                cells = tables[-1][level]
                pieces = txt.split(', ')
                if not cells or len(pieces) > 1:
                    cells.extend(pieces)
                else:
                    cells[-1] += ' ' + txt
    return [{level:[slug(name) for name in entries] for level, entries in table.items()} for table in tables]

def magic_items(pdf):
    result = []
    named = [v for page in pdf[206:252] for v in lines(page)]
    begin = next(i for i,(txt,*_) in enumerate(named) if txt == 'Magic Items A-Z')
    stop = next(i for i,(txt,*_) in enumerate(named) if txt == 'Sentient Magic Items')
    named = named[begin + 1:stop]
    i = 0
    while i < len(named):
        t, f, n, _ = named[i]
        i += 1
        if n != 12 or not f.startswith('GillSans'):
            continue
        parts = [t]
        while i < len(named) and named[i][2] == 12 and named[i][1].startswith('GillSans'):
            parts.append(named[i][0])
            i += 1
        name = ' '.join(parts)
        body = []
        while i < len(named) and (named[i][2] != 12 or not named[i][1].startswith('GillSans')):
            body.append(named[i][0])
            i += 1
        if len(body) < 2:
            continue
        result.append(dict(id=slug(name), name=name, kind='magic', category=body[0], text=' '.join(body[1:])))
    artifact = [v[0] for p in pdf[251:253] for v in lines(p)]
    beginning = artifact.index('Orb of Dragonkind')
    artifact_type, *artifact_body = artifact[beginning + 1:]
    result.append(dict(id='orb-of-dragonkind', name='Orb of Dragonkind', kind='magic', category=artifact_type, text=' '.join(artifact_body)))
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf')
    parser.add_argument('output')
    args = parser.parse_args()
    with fitz.open(args.pdf) as d:
        data = dict(
            bonusSpells={
                'cleric': spell_rows(d[16], 'Life Domain Spells')[0],
                'paladin': spell_rows(d[32], 'Oath of Devotion Spells')[0],
                'warlock': spell_rows(d[49], 'Fiend Expanded Spells')[0],
            },
            landSpells=dict(zip(('arctic','coast','desert','forest','grassland','mountain','swamp'), spell_rows(d[21], 'Druid Level'))),
            magicItems=magic_items(d),
        )
    with open(args.output, 'w', encoding='utf8') as output:
        json.dump(data, output, ensure_ascii=False, separators=(',', ':'))
        output.write('\n')

if __name__ == '__main__':
    main()
