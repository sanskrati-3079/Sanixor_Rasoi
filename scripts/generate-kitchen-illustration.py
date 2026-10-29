"""Generates src/components/decor/kitchen-illustration.tsx.

Usage: python3 scripts/generate-kitchen-illustration.py src/components/decor/kitchen-illustration.tsx
       npx prettier --write src/components/decor/kitchen-illustration.tsx

Original isometric Indian kitchen drawn with 2:1 dimetric projection.
World units: x runs along the right wall, y along the left wall, z is up.
"""
import math
import sys

OX, OY = 300, 262
SQ2 = math.sqrt(2)
out = []


def P(x, y, z):
    return (OX + x - y, OY + (x + y) / 2 - z)


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def pts(points):
    return " ".join(f"{f(a)},{f(b)}" for a, b in points)


def c(name):
    return f"var(--color-{name})"


def poly(points, fill, extra=""):
    out.append(f'<polygon points="{pts(points)}" fill="{c(fill)}"{extra} />')


def line(a, b, stroke, width=1.0, extra=""):
    out.append(
        f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}" '
        f'stroke="{c(stroke)}" strokeWidth={{{f(width)}}} strokeLinecap="round"{extra} />'
    )


def box(x0, x1, y0, y1, z0, z1, top, front, side):
    """Visible faces: top (+z), front (+y) and side (+x)."""
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top)
    poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], front)
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], side)


def ellipse(cx, cy, z, r, fill, extra=""):
    sx, sy = P(cx, cy, z)
    out.append(
        f'<ellipse cx="{f(sx)}" cy="{f(sy)}" rx="{f(r * SQ2)}" ry="{f(r * SQ2 / 2)}" fill="{c(fill)}"{extra} />'
    )


def cylinder(cx, cy, z0, z1, r, body, top, grad=None):
    bx, by = P(cx, cy, z0)
    _, ty = P(cx, cy, z1)
    rx, ry = r * SQ2, r * SQ2 / 2
    fill = f"url(#{grad})" if grad else c(body)
    out.append(
        f'<path d="M{f(bx - rx)} {f(ty)}L{f(bx - rx)} {f(by)}A{f(rx)} {f(ry)} 0 0 0 {f(bx + rx)} {f(by)}L{f(bx + rx)} {f(ty)}Z" fill="{fill}" />'
    )
    ellipse(cx, cy, z1, r, top)


def sphere(x, y, z, r, fill, extra=""):
    sx, sy = P(x, y, z)
    out.append(f'<circle cx="{f(sx)}" cy="{f(sy - r)}" r="{f(r)}" fill="{c(fill)}"{extra} />')


def steam(x, y, z, delay):
    sx, sy = P(x, y, z)
    out.append(
        f'<path className="motion-safe:animate-float" style={{{{ animationDelay: "{delay}s" }}}} '
        f'd="M{f(sx)} {f(sy)}c-6 -8 6 -12 0 -20s6 -12 0 -20" fill="none" stroke="{c("steel")}" '
        f'strokeWidth={{3}} strokeLinecap="round" opacity="0.6" />'
    )


W, D, H = 220, 220, 190
T = 8  # wall and floor thickness

# Backdrop blob and ground shadow
out.append(
    f'<path d="M318 30c96 6 196 64 226 150 30 88-6 196-92 252-88 56-226 62-322 8C34 386-2 290 14 196 30 104 106 34 202 30c40-2 80-2 116 0Z" fill="{c("sky")}" />'
)
sx, sy = P(W / 2, D / 2, -T)
out.append(f'<ellipse cx="{f(sx)}" cy="{f(sy + 16)}" rx="236" ry="52" fill="{c("sky-deep")}" opacity="0.55" />')

# Floor slab
box(-T, W, -T, D, -T, 0, "wood", "wood-dark", "wood-dark")
poly([P(-T, -T, 0), P(W, -T, 0), P(W, D, 0), P(-T, D, 0)], "wood-light")
for j in range(1, 10):
    y = j * 22
    line(P(-T, y, 0), P(W, y, 0), "wood", 1.4)
    for k in range(3):
        x = ((j * 53 + k * 79) % 200) + 10
        line(P(x, y - 22, 0), P(x, y, 0), "wood", 1.2)

# Walls
box(-T, 0, -T, D, 0, H, "steel-light", "sky-deep", "wall-shade")  # left wall
box(0, W, -T, 0, 0, H, "steel-light", "surface", "sky-deep")  # right wall


def tiles_right(x0, x1, z0, z1):
    for i, z in enumerate(range(z0, z1 + 1, 10)):
        line(P(x0, 0, z), P(x1, 0, z), "line", 1)
        if z + 10 <= z1:
            for x in range(x0 + (10 if i % 2 else 0), x1, 20):
                line(P(x, 0, z), P(x, 0, z + 10), "line", 1)


def tiles_left(y0, y1, z0, z1):
    for i, z in enumerate(range(z0, z1 + 1, 10)):
        line(P(0, y0, z), P(0, y1, z), "steel-light", 1.2)
        if z + 10 <= z1:
            for y in range(y0 + (10 if i % 2 else 0), y1, 20):
                line(P(0, y, z), P(0, y, z + 10), "steel-light", 1.2)


tiles_right(0, W, 70, 120)
tiles_left(0, 180, 70, 120)

# Window on the left wall
poly([P(0, 66, 92), P(0, 154, 92), P(0, 154, 170), P(0, 66, 170)], "surface")
poly([P(0, 72, 98), P(0, 148, 98), P(0, 148, 164), P(0, 72, 164)], "sky-deep")
poly([P(0, 90, 98), P(0, 112, 98), P(0, 84, 164), P(0, 72, 164), P(0, 72, 150)], "sky", ' opacity="0.8"')
line(P(0, 110, 98), P(0, 110, 164), "surface", 4)
line(P(0, 72, 131), P(0, 148, 131), "surface", 4)
box(0, 9, 62, 158, 89, 92, "surface", "steel-light", "steel-light")

# Spice shelf on the left wall
box(0, 16, 158, 214, 140, 144, "wood-light", "wood", "wood-dark")
for y, col, h in [(170, "turmeric", 16), (185, "chilli", 13), (200, "leaf", 15)]:
    cylinder(8, y, 144, 144 + h, 5, col, col)
    cylinder(8, y, 144 + h, 147 + h, 5, "wood-dark", "wood")

# Upper cabinets and chimney on the right wall
box(18, 98, 0, 32, 122, 184, "denim-edge", "denim", "denim-hover")
line(P(58, 32, 126), P(58, 32, 180), "denim-edge", 1.6)
line(P(52, 32, 130), P(52, 32, 140), "steel-light", 2.4)
line(P(64, 32, 130), P(64, 32, 140), "steel-light", 2.4)
box(186, W, 0, 32, 122, 184, "denim-edge", "denim", "denim-hover")
line(P(192, 32, 130), P(192, 32, 140), "steel-light", 2.4)
box(136, 160, 0, 18, 142, H, "steel", "steel-light", "steel")
box(110, 184, 0, 38, 128, 142, "steel", "steel-light", "steel")
line(P(114, 38, 131), P(180, 38, 131), "steel", 1.4)

# Counters: left run along the left wall, right run along the right wall
box(0, 46, 0, 178, 0, 62, "denim-edge", "denim", "denim-hover")
box(0, 50, 0, 182, 62, 69, "surface", "steel-light", "steel-light")
for y in (92, 136):
    line(P(46, y, 6), P(46, y, 56), "denim-edge", 1.6)
line(P(46, 50, 44), P(46, 178, 44), "denim-edge", 1.6)
for y in (70, 114, 157):
    line(P(46, y - 6, 52), P(46, y + 6, 52), "steel-light", 2.4)

box(46, W, 0, 46, 0, 62, "denim-edge", "denim", "denim-hover")
box(50, W, 0, 50, 62, 69, "surface", "steel-light", "steel")
for x in (90, 134, 178):
    line(P(x, 46, 6), P(x, 46, 56), "denim-edge", 1.6)
line(P(46, 46, 44), P(W, 46, 44), "denim-edge", 1.6)
for x in (68, 112, 156, 200):
    line(P(x - 6, 46, 52), P(x + 6, 46, 52), "steel-light", 2.4)

# Sink in the left counter
opening = [P(10, 86, 69), P(40, 86, 69), P(40, 136, 69), P(10, 136, 69)]
out.append(f'<clipPath id="kitchen-sink"><polygon points="{pts(opening)}" /></clipPath>')
poly(opening, "steel-light")
out.append('<g clipPath="url(#kitchen-sink)">')
poly([P(10, 86, 69), P(10, 136, 69), P(10, 136, 52), P(10, 86, 52)], "steel")
poly([P(10, 86, 69), P(40, 86, 69), P(40, 86, 52), P(10, 86, 52)], "steel-dark")
out.append("</g>")
a, b, cpt, d = P(4, 111, 69), P(4, 111, 92), P(18, 111, 92), P(18, 111, 85)
out.append(
    f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}L{f(cpt[0])} {f(cpt[1])}L{f(d[0])} {f(d[1])}" '
    f'fill="none" stroke="{c("steel-dark")}" strokeWidth={{3.5}} strokeLinecap="round" strokeLinejoin="round" />'
)

# Steel dabbas in the corner
cylinder(24, 26, 69, 80, 10, "steel", "steel-light", grad="kitchen-steel")
cylinder(24, 26, 80, 89, 8, "steel", "steel-light", grad="kitchen-steel")

# Tulsi plant on the left counter
cylinder(24, 162, 69, 82, 8, "accent-strong", "curry")
for dx, dy, dz in [(-4, -2, 90), (4, 3, 92), (0, 0, 98), (-6, 5, 95), (6, -4, 96)]:
    sx, sy = P(24 + dx, 162 + dy, dz)
    out.append(f'<ellipse cx="{f(sx)}" cy="{f(sy)}" rx="5" ry="8" fill="{c("leaf")}" transform="rotate({dx * 6} {f(sx)} {f(sy)})" />')

# Masala dabba
cylinder(78, 26, 69, 76, 15, "steel", "steel-light", grad="kitchen-steel")
spices = ["turmeric", "chilli", "curry", "leaf", "wood-dark", "steel-dark"]
ellipse(78, 26, 76, 4, "wood")
for i, col in enumerate(spices):
    ang = i * math.pi / 3
    ellipse(78 + 9 * math.cos(ang), 26 + 9 * math.sin(ang), 76, 3.6, col)

# Gas stove with pressure cooker and kadhai
box(110, 180, 6, 42, 69, 75, "steel-dark", "steel", "steel-dark")
for x in (124, 145, 166):
    sx, sy = P(x, 42, 72)
    out.append(f'<circle cx="{f(sx)}" cy="{f(sy)}" r="2.2" fill="{c("steel-dark")}" />')
ellipse(127, 24, 75, 10, "ink", ' opacity="0.7"')
ellipse(163, 24, 75, 10, "ink", ' opacity="0.7"')

cylinder(127, 24, 75, 98, 12, "steel", "steel-light", grad="kitchen-steel")
ellipse(127, 24, 98, 9, "steel")
box(139, 162, 21, 27, 95, 99, "ink", "steel-dark", "ink")
cylinder(127, 24, 98, 106, 2.4, "steel-dark", "steel-dark")
steam(127, 24, 108, 0)
steam(121, 24, 110, 1.2)

kx, ky = P(163, 24, 84)
rx, ry = 14 * SQ2, 14 * SQ2 / 2
out.append(
    f'<path d="M{f(kx - rx)} {f(ky)}A{f(rx)} {f(ry * 2.2)} 0 0 0 {f(kx + rx)} {f(ky)}Z" fill="{c("steel-dark")}" />'
)
ellipse(163, 24, 84, 14, "ink")
ellipse(163, 24, 84, 12, "curry")
sphere(160, 20, 84, 2.4, "turmeric")
sphere(167, 28, 84, 2, "leaf")
steam(163, 24, 90, 0.6)

# Chopping board with tomato and onion
box(190, 216, 10, 40, 69, 71, "wood-light", "wood", "wood-dark")
sphere(198, 22, 71, 6, "chilli")
sphere(208, 30, 71, 5.5, "oak", f' stroke="{c("wood-dark")}" strokeWidth={{1}}')
line(P(194, 36, 72), P(212, 36, 72), "steel", 2.5)

# Rug and vegetable basket on the floor
poly([P(84, 92, 0.2), P(200, 92, 0.2), P(200, 196, 0.2), P(84, 196, 0.2)], "sky")
for y in (106, 118, 170, 182):
    line(P(84, y, 0.2), P(200, y, 0.2), "denim", 2.2, ' opacity="0.55"')

cylinder(142, 144, 0, 20, 22, "wood", "wood-dark", grad="kitchen-wood")
for z in (5, 10, 15):
    bx, by = P(142, 144, z)
    rr = 22 * SQ2
    out.append(
        f'<path d="M{f(bx - rr)} {f(by)}A{f(rr)} {f(rr / 2)} 0 0 0 {f(bx + rr)} {f(by)}" fill="none" stroke="{c("wood-dark")}" strokeWidth={{1.2}} opacity="0.6" />'
    )
for x, y, r, col in [
    (134, 138, 7, "wood-light"),
    (148, 134, 6.5, "oak"),
    (140, 150, 7, "chilli"),
    (152, 148, 6.5, "wood-light"),
    (130, 152, 6, "oak"),
]:
    sphere(x, y, 20, r, col, f' stroke="{c("wood-dark")}" strokeWidth={{0.8}}')
sx, sy = P(150, 156, 26)
out.append(f'<path d="M{f(sx - 14)} {f(sy)}c6 6 18 4 24 -6" fill="none" stroke="{c("leaf")}" strokeWidth={{4}} strokeLinecap="round" />')

# Potted plant on the floor
cylinder(26, 204, 0, 24, 12, "accent-strong", "curry")
for dx, ang, ln in [(-8, -30, 30), (0, 0, 38), (8, 28, 32), (-3, -12, 26), (5, 14, 28)]:
    sx, sy = P(26, 204, 24)
    out.append(
        f'<ellipse cx="{f(sx + dx)}" cy="{f(sy - ln / 2)}" rx="6" ry="{f(ln / 2)}" fill="{c("leaf")}" transform="rotate({ang} {f(sx)} {f(sy)})" />'
    )

body = "\n      ".join(out)
tsx = f'''import {{ clsx }} from "clsx";

/*
 * Hero artwork: a cut-away isometric Indian kitchen — denim cabinets, tiled
 * walls, a gas stove with a pressure cooker and kadhai, a masala dabba,
 * spice jars and a basket of vegetables. Pure inline SVG (no image bytes,
 * no layout shift); every colour is a theme token.
 *
 * Generated by scripts/generate-kitchen-illustration.py; edit the script, not the coordinates.
 */
export function KitchenIllustration({{ className }}: {{ className?: string }}) {{
  return (
    <svg
      viewBox="0 0 600 520"
      role="img"
      aria-label="Illustration of a cosy Indian kitchen with blue cabinets, a gas stove with a pressure cooker and kadhai, a masala dabba, spice jars and a basket of vegetables"
      className={{clsx("h-auto w-full", className)}}
    >
      <defs>
        <linearGradient id="kitchen-steel" x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-steel-light)" />
          <stop offset="0.55" stopColor="var(--color-steel)" />
          <stop offset="1" stopColor="var(--color-steel-dark)" />
        </linearGradient>
        <linearGradient id="kitchen-wood" x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-wood-light)" />
          <stop offset="1" stopColor="var(--color-wood-dark)" />
        </linearGradient>
      </defs>
      {body}
    </svg>
  );
}}
'''
open(sys.argv[1], "w").write(tsx)
print(len(out), "elements")
