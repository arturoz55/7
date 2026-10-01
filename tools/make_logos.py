"""Generate Conduit's token logos (original artwork) as app-icon SVGs in logos/."""
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'logos')

def grad(id, a, b, x1=0, y1=0, x2=0, y2=1):
    return f'<linearGradient id="{id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'

def rgrad(id, a, b, cx=.35, cy=.3, r=.8):
    return f'<radialGradient id="{id}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'

def icon(bg, defs, body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">
<defs>
{grad("bg", bg[0], bg[1], 0, 0, 1, 1)}
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="#000" flood-opacity=".38"/></filter>
<clipPath id="tile"><rect width="100" height="100" rx="23"/></clipPath>
{defs}
</defs>
<g clip-path="url(#tile)">
<rect width="100" height="100" fill="url(#bg)"/>
<rect width="100" height="100" fill="url(#vig)"/>
<g filter="url(#sh)">{body}</g>
<rect width="100" height="56" fill="url(#gloss)"/>
</g>
<rect x=".5" y=".5" width="99" height="99" rx="22.5" fill="none" stroke="#fff" stroke-opacity=".14"/>
</svg>'''

def pt(cx, cy, r, deg):
    a = math.radians(deg); return (cx + r * math.cos(a), cy + r * math.sin(a))

L = {}

# LUMEN — sun
rays = ''.join(f'<rect x="47" y="12" width="6" height="15" rx="3" fill="url(#ray)" transform="rotate({k*45} 50 50)"/>' for k in range(8))
L['lumen'] = icon(('#FF9A3C', '#E2451F'),
    grad('ray', '#FFF3C4', '#FFC547') + rgrad('core', '#FFFBE6', '#FFB21E', .38, .32, .75),
    rays + '<circle cx="50" cy="50" r="16" fill="url(#core)"/><circle cx="45" cy="44" r="5" fill="#fff" opacity=".55"/>')

# PARCEL — isometric box with tape
L['parcel'] = icon(('#2B3A67', '#141B33'),
    grad('top', '#F2C88E', '#D9A066') + grad('lft', '#C98B4E', '#A86E38') + grad('rgt', '#9A6331', '#7A4C24'),
    '<polygon points="50,18 80,34 50,50 20,34" fill="url(#top)"/>'
    '<polygon points="20,34 50,50 50,84 20,68" fill="url(#lft)"/>'
    '<polygon points="50,50 80,34 80,68 50,84" fill="url(#rgt)"/>'
    '<polygon points="31.5,40.1 61.5,24.1 68.5,27.9 38.5,43.9" fill="#E9E4D8" opacity=".9"/>'
    '<polygon points="31.5,40.1 38.5,43.9 38.5,77.9 31.5,74.1" fill="#D4CEC0" opacity=".9"/>'
    '<polyline points="20,34 50,50 80,34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>')

# FIELD — leaf
L['field'] = icon(('#1E6B52', '#0C3A2C'),
    grad('lf', '#B8F27C', '#2FA84F', 0, 0, 1, 1),
    '<path d="M22 80 C 22 46, 42 24, 80 18 C 78 56, 58 80, 22 80 Z" fill="url(#lf)"/>'
    '<path d="M26 76 Q 50 54 74 24" fill="none" stroke="#E9FFD6" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"/>'
    '<path d="M40 62 L 36 48 M50 52 L 48 38 M58 44 L 58 32 M44 58 L 58 60 M54 48 L 66 50" stroke="#E9FFD6" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>'
    '<path d="M22 80 L 16 86" stroke="#2FA84F" stroke-width="4" stroke-linecap="round"/>')

# HARBOR — anchor
L['harbor'] = icon(('#1D5FAE', '#0B2550'),
    '<linearGradient id="steel" gradientUnits="userSpaceOnUse" x1="20" y1="15" x2="80" y2="85"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B9C7DA"/></linearGradient>',
    '<g fill="none" stroke="url(#steel)" stroke-linecap="round" stroke-linejoin="round">'
    '<circle cx="50" cy="22" r="6.5" stroke-width="5"/>'
    '<path d="M50 29 V 80" stroke-width="7"/><path d="M35 39 H 65" stroke-width="6"/>'
    '<path d="M22 58 Q 24 80 50 81 Q 76 80 78 58" stroke-width="7"/></g>'
    '<polygon points="15,60 22,50 29,60" fill="#E8EEF6"/><polygon points="71,60 78,50 85,60" fill="#E8EEF6"/>')

# QUIET — crescent moon with stars
L['quiet'] = icon(('#3B2E7E', '#120C33'),
    rgrad('mn', '#FFF8DC', '#E9C46A', .3, .3, .9) + '<mask id="cres"><rect width="100" height="100" fill="#fff"/><circle cx="62" cy="40" r="24" fill="#000"/></mask>',
    '<circle cx="47" cy="53" r="28" fill="url(#mn)" mask="url(#cres)"/>'
    '<circle cx="34" cy="62" r="3.5" fill="#C9A44E" opacity=".45" mask="url(#cres)"/><circle cx="44" cy="72" r="2.4" fill="#C9A44E" opacity=".45"/>'
    + ''.join(f'<path d="M{x} {y-s} Q{x} {y} {x+s} {y} Q{x} {y} {x} {y+s} Q{x} {y} {x-s} {y} Q{x} {y} {x} {y-s}Z" fill="#fff" opacity=".9"/>' for x, y, s in [(74, 24, 5), (82, 46, 3), (66, 74, 3.5)]))

# FORMS — checkbox tile
L['forms'] = icon(('#FFC93C', '#F08C00'),
    grad('pp', '#FFFFFF', '#E9ECF2') + grad('ck', '#2EC27E', '#11865A'),
    '<rect x="23" y="23" width="54" height="54" rx="13" fill="url(#pp)"/>'
    '<path d="M36 51 L 46 61 L 65 39" fill="none" stroke="url(#ck)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>')

# ORBIT — ringed planet
L['orbit'] = icon(('#0E7C86', '#062F3C'),
    rgrad('pl', '#9FF3E6', '#1C8C9C', .35, .3, .85) + grad('rg', '#FFFFFF', '#9FD8E0', 0, 0, 1, 0)
    + '<clipPath id="front"><rect x="0" y="50" width="100" height="50"/></clipPath>',
    '<g transform="rotate(-20 50 50)"><ellipse cx="50" cy="50" rx="38" ry="11" fill="none" stroke="url(#rg)" stroke-width="4" opacity=".55"/>'
    '<circle cx="50" cy="50" r="21" fill="url(#pl)"/>'
    '<path d="M32 44 Q50 40 68 46" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/>'
    '<ellipse cx="50" cy="50" rx="38" ry="11" fill="none" stroke="url(#rg)" stroke-width="4" clip-path="url(#front)"/></g>'
    '<circle cx="82" cy="22" r="2" fill="#fff" opacity=".8"/><circle cx="20" cy="78" r="1.5" fill="#fff" opacity=".6"/>')

# GRAIN — wheat
grains = ''
for i, y in enumerate([66, 55, 44, 33]):
    grains += f'<ellipse cx="44" cy="{y}" rx="4.6" ry="8.5" fill="url(#gr)" transform="rotate(-32 44 {y})"/>'
    grains += f'<ellipse cx="56" cy="{y}" rx="4.6" ry="8.5" fill="url(#gr)" transform="rotate(32 56 {y})"/>'
L['grain'] = icon(('#7A4A1E', '#3A2210'),
    grad('gr', '#FFE7A3', '#D8A13A', 0, 0, 1, 1),
    '<path d="M50 86 V 24" stroke="#E7B95A" stroke-width="3" stroke-linecap="round"/>' + grains
    + '<ellipse cx="50" cy="22" rx="4.6" ry="8.5" fill="url(#gr)"/>')

# KILN — flame
L['kiln'] = icon(('#9E1B1B', '#3D0909'),
    grad('fo', '#FFB347', '#FF3D1F') + grad('fi', '#FFF8C2', '#FFC93C'),
    '<path d="M50 12 C 62 28, 77 40, 75 60 C 73 79, 61 87, 50 87 C 39 87, 25 79, 25 60 C 25 46, 35 40, 40 27 C 44 37, 46 41, 50 43 C 53 33, 51 23, 50 12 Z" fill="url(#fo)"/>'
    '<path d="M50 45 C 58 55, 64 61, 62 71 C 60 81, 54 85, 50 85 C 44 85, 38 81, 38 71 C 38 63, 44 58, 50 45 Z" fill="url(#fi)"/>')

# PATCH — audio bars
bars = ''.join(f'<rect x="{20 + i*9.2:.1f}" y="{50 - h/2}" width="6.2" height="{h}" rx="3.1" fill="url(#br)"/>' for i, h in enumerate([16, 32, 52, 40, 60, 30, 18]))
L['patch'] = icon(('#B5179E', '#3A0CA3'),
    grad('br', '#FFFFFF', '#F5B8FF'), bars)

# NORTH — compass
ticks = ''.join(f'<rect x="49" y="21" width="2" height="5" rx="1" fill="#fff" opacity=".7" transform="rotate({k*90} 50 50)"/>' for k in range(4))
L['north'] = icon(('#1F4E8C', '#0A1A33'),
    grad('bz', '#F4F6FA', '#9AA7BA', 0, 0, 1, 1) + rgrad('dl', '#24364F', '#0E1A2A', .5, .4, .7),
    '<circle cx="50" cy="50" r="32" fill="url(#bz)"/><circle cx="50" cy="50" r="27" fill="url(#dl)"/>' + ticks
    + '<polygon points="50,25 56,50 50,50" fill="#FF5A4E"/><polygon points="50,25 44,50 50,50" fill="#C9241A"/>'
    '<polygon points="50,75 56,50 50,50" fill="#D7DDE6"/><polygon points="50,75 44,50 50,50" fill="#FFFFFF"/>'
    '<circle cx="50" cy="50" r="3.2" fill="#E9EDF3" stroke="#6B778A" stroke-width="1"/>')

# SPROUT — seedling
L['sprout'] = icon(('#9BE15D', '#2C9A3F'),
    grad('lv', '#E9FFB8', '#4CB944', 0, 0, 1, 1) + grad('so', '#8A5A35', '#5A371E'),
    '<ellipse cx="50" cy="83" rx="24" ry="7" fill="url(#so)"/>'
    '<path d="M50 82 V 50" stroke="#2F8F3A" stroke-width="5" stroke-linecap="round"/>'
    '<path d="M50 56 C 40 56, 25 50, 22 33 C 37 31, 50 40, 50 56 Z" fill="url(#lv)"/>'
    '<path d="M50 50 C 53 35, 66 26, 81 28 C 79 43, 66 52, 50 50 Z" fill="url(#lv)"/>'
    '<path d="M47 52 Q 36 44 28 36 M53 47 Q 65 38 75 32" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" fill="none" stroke-linecap="round"/>')

# NOTES — open book
lines = ''.join(f'<path d="M{a} {y} Q {(a+b)/2} {y-2} {b} {y+1}" stroke="#B9C0D0" stroke-width="1.6" fill="none" stroke-linecap="round"/>' for a, b in [(26, 44), (56, 74)] for y in (40, 48, 56, 64))
L['notes'] = icon(('#7B5CFF', '#3A1FA8'),
    grad('pg', '#FFFFFF', '#E3E7F0') + grad('cv', '#2A1A6E', '#1A0F48'),
    '<path d="M16 32 C 28 26, 42 26, 50 32 C 58 26, 72 26, 84 32 V 80 C 72 75, 58 75, 50 81 C 42 75, 28 75, 16 80 Z" fill="url(#cv)"/>'
    '<path d="M50 30 C 41 24, 29 24, 20 28 V 74 C 29 70, 41 70, 50 76 Z" fill="url(#pg)"/>'
    '<path d="M50 30 C 59 24, 71 24, 80 28 V 74 C 71 70, 59 70, 50 76 Z" fill="url(#pg)"/>'
    '<path d="M50 30 V 76" stroke="#AEB6C8" stroke-width="1.4"/>' + lines)

# POST — envelope with wax seal
L['post'] = icon(('#E63946', '#8C1420'),
    grad('ev', '#FFFFFF', '#E8E2D6') + grad('fl', '#F6F1E7', '#D9D0BF') + rgrad('wx', '#FF6B6B', '#A4161A', .35, .3, .8),
    '<rect x="18" y="30" width="64" height="44" rx="6" fill="url(#ev)"/>'
    '<path d="M18 72 L 44 52 M82 72 L 56 52" stroke="#CFC6B4" stroke-width="1.6"/>'
    '<path d="M19 33 L 50 57 L 81 33 Q 81 30 78 30 H 22 Q 19 30 19 33 Z" fill="url(#fl)"/>'
    '<circle cx="50" cy="56" r="8" fill="url(#wx)"/><circle cx="50" cy="56" r="4.5" fill="none" stroke="#FFB3B3" stroke-opacity=".6" stroke-width="1.2"/>')

# KIT — duffel bag
L['kit'] = icon(('#00A6A6', '#04504F'),
    grad('bg2', '#FF9F5A', '#D9571A') + grad('hd', '#5A2A0E', '#3A1A08'),
    '<path d="M37 40 V 33 A 13 13 0 0 1 63 33 V 40" fill="none" stroke="url(#hd)" stroke-width="5.5" stroke-linecap="round"/>'
    '<path d="M26 40 H 74 Q 79 40 79.5 45 L 82 78 Q 82 84 76 84 H 24 Q 18 84 18 78 L 20.5 45 Q 21 40 26 40 Z" fill="url(#bg2)"/>'
    '<rect x="20" y="52" width="60" height="5" fill="#000" opacity=".15"/>'
    '<rect x="44" y="58" width="12" height="9" rx="2" fill="#FFE1C7"/>'
    '<path d="M26 44 H 74" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>')

# LUX — faceted gold star
facets = ''
outer = [pt(50, 53, 34, -90 + k*72) for k in range(5)]
inner = [pt(50, 53, 14, -54 + k*72) for k in range(5)]
for k in range(5):
    o, il, ir = outer[k], inner[k-1], inner[k]
    facets += f'<polygon points="50,53 {il[0]:.1f},{il[1]:.1f} {o[0]:.1f},{o[1]:.1f}" fill="#FFE27A"/>'
    facets += f'<polygon points="50,53 {o[0]:.1f},{o[1]:.1f} {ir[0]:.1f},{ir[1]:.1f}" fill="#D99A1E"/>'
L['lux'] = icon(('#2A2A2E', '#09090B'), '', facets)

os.makedirs(OUT, exist_ok=True)
for k, svg in L.items():
    with open(os.path.join(OUT, k + '.svg'), 'w') as f: f.write(svg)
print(len(L), 'logos written')
