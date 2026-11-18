#!/usr/bin/env python3
"""Find CR 0–1 Beast stat blocks in the CC BY 4.0 SRD 5.2.1 PDF."""
import json
import re
import sys
from fractions import Fraction
from pathlib import Path

import fitz

doc = fitz.open(sys.argv[1] if len(sys.argv) > 1 else '2024.pdf')
lines = []
for n, p in enumerate(doc,1):
    page = []
    for block in p.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            spans = line['spans']
            first = spans[0]
            x, y = first['bbox'][:2]
            text = ''.join(span['text'] for span in spans).strip()
            if text and x > 40 and y < 735:
                page.append((x,y,first['size'],first['font'],text,n))
    lines.extend(sorted(page, key=lambda ln: (ln[0] >= 301, ln[1], ln[0])))

beasts = []
for i, (x, y, _, font, creature_type, page) in enumerate(lines):
    if font != 'Optima-Italic' or not re.fullmatch(r'(?:Tiny|Small|Medium|Large|Huge|Gargantuan) Beast(?: \([^)]*\))?, .+', creature_type):
        continue
    title = lines[i-1][4]
    if 'GillSans-SemiBold' not in lines[i-1][3]:
        print('Skipping unexpected name for', creature_type, 'on page', page, title, file=sys.stderr)
        continue
    preceding = lines[i-2]
    if preceding[3] == lines[i-1][3] and abs(preceding[1]-lines[i-1][1])<18:
        title = preceding[4] + ' ' + title
    info = []
    for field in lines[i+1:i+56]:
        info.append(field[4])
        if field[4].startswith('CR '):
            break
        if field[3]=='Optima-Italic' and re.search(r', (?:Unaligned|Neutral|Lawful|Chaotic|Any)', field[4]):
            break
    cr = re.fullmatch(r'CR (\d+/\d+|\d+) \(.*',info[-1])
    speed = next((n for n in info if n.startswith('Speed ')),None)
    if not cr or not speed:
        print('Skipping unranked/no speed:',title,page,info[-1],file=sys.stderr)
        continue
    value = float(Fraction(cr[1]))
    if value <= 1:
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        beasts.append(dict(id=slug, name=title, cr=value, fly=bool(re.search(r'\bFly \d+ ft', speed))))
if len(sys.argv)>2 or Path('beasts-ru.txt').exists():
    labels = dict(l.split('|',1) for l in Path('beasts-ru.txt').read_text(encoding='utf-8').splitlines())
    assert set(labels)=={beast['id'] for beast in beasts}, ({b['id'] for b in beasts}-labels.keys(),labels.keys()-{b['id'] for b in beasts})
    for beast in beasts:
        beast['ru']=labels[beast['id']]
    Path(sys.argv[2] if len(sys.argv)>2 else 'beasts2024.json').write_text(json.dumps(beasts,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
else:
    for beast in beasts:
        print(beast['id'],beast['name'],beast['cr'], '*' if beast['fly'] else '')
print(f'{len(beasts)} beasts, {sum(beast["fly"] for beast in beasts)} flying',file=sys.stderr)
