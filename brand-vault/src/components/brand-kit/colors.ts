export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string) {
  return HEX_COLOR.test(value);
}

// <input type="color"> only accepts lowercase #rrggbb.
export function toPickerValue(hex: string) {
  if (!isHexColor(hex)) return "#000000";
  const lower = hex.toLowerCase();
  if (lower.length === 7) return lower;
  const [, r, g, b] = lower;
  return `#${r}${r}${g}${g}${b}${b}`;
}

export function readableTextOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(toPickerValue(hex).slice(i, i + 2), 16));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}
