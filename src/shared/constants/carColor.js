// Maps a car color name (Arabic or English, any case) to a hex swatch.
// Used to render the car color as a circle instead of raw text.

const COLOR_HEX = {
  // English
  white:  '#FFFFFF',
  black:  '#111111',
  silver: '#C0C0C0',
  grey:   '#808080',
  gray:   '#808080',
  red:    '#E53935',
  blue:   '#1E88E5',
  green:  '#43A047',
  yellow: '#FDD835',
  orange: '#FB8C00',
  brown:  '#795548',
  beige:  '#E8D9B5',
  gold:   '#D4AF37',
  purple: '#8E24AA',
  pink:   '#EC407A',
  navy:   '#1A237E',

  // Arabic
  'أبيض':  '#FFFFFF',
  'اسود':  '#111111',
  'أسود':  '#111111',
  'فضي':   '#C0C0C0',
  'رمادي': '#808080',
  'احمر':  '#E53935',
  'أحمر':  '#E53935',
  'ازرق':  '#1E88E5',
  'أزرق':  '#1E88E5',
  'اخضر':  '#43A047',
  'أخضر':  '#43A047',
  'اصفر':  '#FDD835',
  'أصفر':  '#FDD835',
  'برتقالي':'#FB8C00',
  'بني':   '#795548',
  'بيج':   '#E8D9B5',
  'ذهبي':  '#D4AF37',
  'بنفسجي':'#8E24AA',
  'وردي':  '#EC407A',
  'كحلي':  '#1A237E',
};

// Returns the hex for a color name, or null if unknown.
export function carColorHex(name) {
  if (!name || typeof name !== 'string') return null;
  return COLOR_HEX[name.trim().toLowerCase()] ?? COLOR_HEX[name.trim()] ?? null;
}
