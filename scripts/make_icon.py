"""Renders the Money Intelligence app icon (no third-party libraries)."""
import math, struct, sys, zlib

TOP = (0xC4, 0x1F, 0x3E)
BOTTOM = (0x8B, 0x1D, 0x41)
# Forecast line in a 1024 design space: dip before payday, then rise.
POINTS = [(196, 430), (330, 576), (560, 584), (690, 660), (828, 322)]
STROKE = 66
DOT = (828, 322, 58)
BUFFER_Y = 760

def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)

def coverage(d, half, aa):
    # 1 inside, 0 outside, linear ramp over aa design units.
    return max(0.0, min(1.0, (half - d) / aa + 0.5))

def render(size):
    scale = 1024 / size
    aa = scale  # one output pixel of antialiasing
    rows = []
    for y in range(size):
        row = bytearray([0])
        py = (y + 0.5) * scale
        t = py / 1024
        bg = [round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)]
        for x in range(size):
            px = (x + 0.5) * scale
            d = min(seg_dist(px, py, *POINTS[i], *POINTS[i + 1]) for i in range(len(POINTS) - 1))
            a = coverage(d, STROKE / 2, aa)
            a = max(a, coverage(math.hypot(px - DOT[0], py - DOT[1]), DOT[2], aa))
            # Dashed safety-buffer line.
            if 196 <= px <= 828 and int((px - 196) // 46) % 2 == 0:
                a = max(a, 0.55 * coverage(abs(py - BUFFER_Y), 9, aa))
            row += bytes(round(bg[i] + (255 - bg[i]) * a) for i in range(3))
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

if __name__ == '__main__':
    out_dir = sys.argv[1]
    for name, size in [('icon.png', 1024), ('favicon.png', 48)]:
        with open(f'{out_dir}/{name}', 'wb') as f:
            f.write(render(size))
        print('wrote', name)
