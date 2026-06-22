import React from 'react';
import Svg, {Path} from 'react-native-svg';

// Tight bounding box of the glyph path inside the original 24x24 art.
// x: 3.945 → 20.055 (w 16.11), y: 2.977 → 21.020 (h 18.04).
// Cropping to this box makes `size` map to the icon's real visible height,
// so it can be set equal to the adjacent number's fontSize.
const VB_X = 3.6;
const VB_Y = 2.7;
const VB_W = 16.8;
const VB_H = 18.6;
const ASPECT = VB_W / VB_H; // ~0.903 — glyph is slightly narrower than tall

/**
 * Saudi Riyal currency symbol icon.
 * Replaces the textual "ريال" / "ر.س" / "﷼" / "SAR" across the app.
 * The icon inherits the surrounding text color via the `color` prop.
 *
 * @param {object} props
 * @param {number} [props.size=14] - visible height in px; set it equal to the
 *   adjacent text's fontSize so the icon matches the number. Width is derived
 *   from the glyph's aspect ratio.
 * @param {string} [props.color='#000'] - fill color (pass the adjacent text color)
 * @param {object} [props.style] - optional style for layout (e.g. margin)
 */
export default function RiyalIcon({size = 14, color = '#000', style}) {
  return (
    <Svg
      width={Math.round(size * ASPECT)}
      height={size}
      viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
      fill="none"
      style={style}>
      <Path
        d="M20.0547 17.6855C19.9482 18.5465 19.9014 18.9196 19.5039 19.7588L13.3994 21.0195C13.5398 20.1125 13.7262 19.4128 14.0303 18.9932L20.0547 17.6855ZM11.5518 11.748L13.376 11.3525V5.58789C14.0556 4.825 14.4736 4.48286 15.2939 4.0498V10.9355L20.0547 9.90234C19.9482 10.7632 19.9014 11.1365 19.5039 11.9756L15.2939 12.8652V14.8018L20.0547 13.7949C19.9483 14.6556 19.9015 15.029 19.5039 15.8682L15.2939 16.7363V16.7549L13.376 17.1514V13.2715L11.5518 13.6572V16.1025L11.5195 16.1084C11.1 16.844 10.5083 17.728 9.9375 18.4336L3.94531 19.5742C3.99905 18.8035 4.1114 18.3692 4.45996 17.5928L9.63379 16.4707V14.0625L4.83887 15.0771C4.89259 14.3062 5.00488 13.8713 5.35352 13.0947L9.63379 12.165V4.51562C10.3134 3.75272 10.7313 3.40963 11.5518 2.97656V11.748Z"
        fill={color}
      />
    </Svg>
  );
}
