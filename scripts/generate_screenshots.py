"""
Generate compliant PNG screenshots for PWABuilder.com
Creates screenshot-wide.png (1280x720) and screenshot-narrow.png (750x1334)
using only Python's standard library (zlib, struct).
"""
import zlib
import struct
import os

def create_png(width, height, color_bg, color_accent, text_mode="wide"):
    # Create raw RGBA image buffer
    # color_bg: (r, g, b)
    # color_accent: (r, g, b)
    r_bg, g_bg, b_bg = color_bg
    r_ac, g_ac, b_ac = color_accent

    raw_rows = []
    for y in range(height):
        row = bytearray([0]) # filter type 0 (None)
        # Gradient background
        t_y = y / height
        cur_r = int(r_bg * (1.0 - t_y * 0.4))
        cur_g = int(g_bg * (1.0 - t_y * 0.4))
        cur_b = int(b_bg * (1.0 - t_y * 0.4))

        for x in range(width):
            t_x = x / width
            
            # Draw header bar
            if y < (64 if text_mode == "wide" else 96):
                row.extend([12, 18, 34, 255])
            # Draw periodic grid tiles representation
            elif text_mode == "wide" and 100 <= y <= 620 and 40 <= x <= 1240:
                # 18 cols, 10 rows simulated tiles
                col_idx = int((x - 40) / ((1200) / 18))
                row_idx = int((y - 100) / ((520) / 10))
                rel_x = (x - 40) % (1200 // 18)
                rel_y = (y - 100) % (520 // 10)
                if rel_x > 3 and rel_y > 3:
                    # Tile color based on column
                    if col_idx in [0, 1]:
                        row.extend([239, 68, 68, 255] if col_idx == 0 else [249, 115, 22, 255])
                    elif 2 <= col_idx <= 11:
                        row.extend([234, 179, 8, 255])
                    elif 12 <= col_idx <= 16:
                        row.extend([59, 130, 246, 255])
                    else:
                        row.extend([168, 85, 247, 255])
                else:
                    row.extend([cur_r, cur_g, cur_b, 255])
            elif text_mode == "narrow" and 140 <= y <= 1200 and 30 <= x <= 720:
                # Mobile card layout representation
                card_idx = int((y - 140) / 160)
                card_y = (y - 140) % 160
                if card_y > 15:
                    if card_idx == 0:
                        # Big element badge
                        row.extend([15, 23, 42, 255])
                    elif card_y < 50:
                        row.extend([30, 41, 59, 255])
                    else:
                        row.extend([15, 23, 42, 255])
                else:
                    row.extend([cur_r, cur_g, cur_b, 255])
            else:
                row.extend([cur_r, cur_g, cur_b, 255])
        raw_rows.append(bytes(row))

    raw_data = b"".join(raw_rows)
    compressed_data = zlib.compress(raw_data, 9)

    def png_chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = png_chunk(b"IHDR", ihdr_data)
    idat_chunk = png_chunk(b"IDAT", compressed_data)
    iend_chunk = png_chunk(b"IEND", b"")

    return png_header + ihdr_chunk + idat_chunk + iend_chunk

def main():
    print("Generating screenshots...")
    wide_png = create_png(1280, 720, (11, 15, 25), (6, 182, 212), "wide")
    narrow_png = create_png(750, 1334, (11, 15, 25), (6, 182, 212), "narrow")

    for dir_path in ["public", "."]:
        if os.path.exists(dir_path):
            with open(os.path.join(dir_path, "screenshot-wide.png"), "wb") as f:
                f.write(wide_png)
            with open(os.path.join(dir_path, "screenshot-narrow.png"), "wb") as f:
                f.write(narrow_png)
    print("Screenshots created successfully!")

if __name__ == "__main__":
    main()
