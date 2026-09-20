#!/usr/bin/env bash
# Builds src/styles/fonts/NotoKufiArabic-subset.woff2, the self-hosted Arabic face.
#
# Why a subset: Google's own "arabic" build of Noto Kufi Arabic is one 124 kB variable
# file, and 772 of its 1 224 codepoints are presentation forms (U+FB50–FDFF, U+FE76–FEFC)
# that shaped Arabic text never needs — browsers shape from the base letters. Dropping
# them and narrowing the weight axis to the four weights the site uses (400–700) gives a
# ≈ 43 kB file; the hero paragraph is the LCP element and repaints when this file lands,
# so its size is the one performance lever left (TODO.md, 2026-09-20).
#
# Source: the OFL master in google/fonts (the licence is copied next to the output).
# Needs python3; fonttools + brotli are installed into a throwaway venv.
#
#   scripts/subset-arabic-font.sh            # rebuilds the file in place
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/src/styles/fonts"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

SRC_URL='https://github.com/google/fonts/raw/main/ofl/notokufiarabic/NotoKufiArabic%5Bwght%5D.ttf'
OFL_URL='https://github.com/google/fonts/raw/main/ofl/notokufiarabic/OFL.txt'
# Google's "arabic" unicode-range without the presentation-form blocks, plus the
# space/no-break space so an Arabic-only element never falls back for them, plus
# a–z: next/font sizes the metric-matched fallback face from the average width of
# the lowercase Latin glyphs, and without them it emits size-adjust:100% — the
# fallback text then runs narrower than the real face and every paragraph grows
# when the font lands (CLS 0.30 on the home page, 2026-09-20).
UNICODES='U+0020,U+00A0,U+0061-007A,U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FE70-FE74,U+FEFF'
WEIGHTS='wght=400:700'

echo "▶ fetching the source font"
curl -fsSL "$SRC_URL" -o "$WORK/src.ttf"
curl -fsSL "$OFL_URL" -o "$WORK/OFL.txt"
echo "▶ fonttools"
python3 -m venv "$WORK/venv" >/dev/null
"$WORK/venv/bin/pip" install -q fonttools brotli
echo "▶ subsetting ($UNICODES)"
"$WORK/venv/bin/pyftsubset" "$WORK/src.ttf" \
  --unicodes="$UNICODES" \
  --layout-features='*' \
  --name-IDs='1,2,3,4,5,6,13,14' \
  --no-hinting --notdef-outline --no-recalc-average-width \
  --output-file="$WORK/subset.ttf"
echo "▶ narrowing the weight axis ($WEIGHTS)"
"$WORK/venv/bin/fonttools" varLib.instancer -q -o "$WORK/subset-wght.ttf" "$WORK/subset.ttf" "$WEIGHTS"
"$WORK/venv/bin/python" - "$WORK/subset-wght.ttf" "$OUT/NotoKufiArabic-subset.woff2" <<'PY'
import sys
from fontTools.ttLib import TTFont
f = TTFont(sys.argv[1]); f.flavor = 'woff2'; f.save(sys.argv[2])
cmap = f.getBestCmap()
print(f"  {len(cmap)} codepoints, {len(f.getGlyphOrder())} glyphs, axes {[(a.axisTag, a.minValue, a.maxValue) for a in f['fvar'].axes]}")
PY
cp "$WORK/OFL.txt" "$OUT/NotoKufiArabic-OFL.txt"
ls -l "$OUT/NotoKufiArabic-subset.woff2" | awk '{print "✔ " $9 ": " $5 " bytes"}'
