#!/bin/bash
# Generate We Care Car Care site imagery with consistent dark automotive art direction.
set -e
OUT=/home/z/my-project/public/images
mkdir -p "$OUT"

gen() {
  local file="$1"; shift
  local size="$1"; shift
  local prompt="$1"; shift
  if [ -s "$OUT/$file" ]; then
    echo "SKIP $file (exists)"
    return 0
  fi
  echo "GEN  $file [$size]"
  z-ai image -p "$prompt" -o "$OUT/$file" -s "$size" || echo "FAIL $file"
}

gen hero-car.png 1440x720 "Cinematic professional automotive photography of a glossy black luxury sedan in a dark detailing studio, wet paint covered in fine water beads, dramatic rim lighting tracing the body curves, deep charcoal background, subtle warm amber reflections on the paint, photorealistic, high quality, detailed"

gen interior-clean.png 1344x768 "Professional automotive interior photography of a pristine black leather car interior, spotless dashboard, steering wheel and seats, soft warm directional lighting, immaculate showroom condition, photorealistic, high quality, detailed"

gen exterior-clean.png 1344x768 "Close-up professional automotive photography of flawless glossy dark metallic car paint on a fender, mirror-like reflections, deep wet-look gloss finish, dark studio background with a single warm highlight, photorealistic, high quality, detailed"

gen ceramic-beads.png 1344x768 "Macro professional automotive photography of hydrophobic ceramic coating on a dark car hood, perfectly round water beading and rolling off the glossy paint, dramatic dark background, crisp reflections, photorealistic, high quality, detailed"

gen detail-action.png 1344x768 "Professional automotive detailer in a dark uniform machine polishing a black sports car with a dual-action polisher inside a dark premium detailing studio, warm amber accent lighting, focused atmosphere, photorealistic, high quality, detailed"

gen interior-detail.png 1344x768 "Professional automotive detailer steam cleaning a black leather car interior with a steam cleaner inside a dark detailing studio, warm accent lighting, meticulous work, photorealistic, high quality, detailed"

echo "DONE"
