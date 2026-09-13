// WCAG 2.x relative luminance + contrast ratio calculator
function srgb(hex) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
}
function lum(hex) {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(fg, bg) {
  const l1 = lum(fg), l2 = lum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
const bg = '#0a0b0d', card = '#121417';
const pairs = [
  ['foreground #f2f0ea on background', '#f2f0ea', bg],
  ['foreground #f2f0ea on card', '#f2f0ea', card],
  ['primary #f2a61c on background', '#f2a61c', bg],
  ['primary #f2a61c on card', '#f2a61c', card],
  ['primary-foreground #17120a on primary #f2a61c', '#17120a', '#f2a61c'],
  ['accent-teal #5eead4 on background', '#5eead4', bg],
  ['accent-teal #5eead4 on card', '#5eead4', card],
  ['muted-foreground #9c9a92 on background', '#9c9a92', bg],
  ['muted-foreground #9c9a92 on card', '#9c9a92', card],
  ['secondary-foreground #e8e6df on secondary #1a1d21', '#e8e6df', '#1a1d21'],
];
for (const [name, fg, b] of pairs) {
  const r = ratio(fg, b);
  console.log(`${r.toFixed(1)}:1  ${name}  ${r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'FAIL'}`);
}
