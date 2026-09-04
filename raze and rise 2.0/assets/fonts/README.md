# Bundled fonts

## Manrope-Medium.ttf

- **Family / weight:** Manrope, 500 (Medium) — static instance of the Manrope variable font.
- **Source:** Google Fonts (`fonts.gstatic.com`, Manrope v20), upstream project
  <https://github.com/sharanda/manrope>.
- **License:** SIL Open Font License 1.1 — full text in `OFL.txt` alongside this file.

### Why it is bundled

Victory Native XL draws on a Skia canvas. Skia's `useFont` needs a real font
*file*, not a family name — it cannot resolve `fontFamily: 'Manrope'` from the
OS. Chart axis labels therefore load this asset directly:

```ts
import { useFont } from '@shopify/react-native-skia';
import { FONT_SIZE_CHART_AXIS } from '@/lib/tokens';

const font = useFont(require('../../assets/fonts/Manrope-Medium.ttf'), FONT_SIZE_CHART_AXIS);
```

Weight 500 matches the `fg-muted` axis-label treatment in 03-UI-SPEC.
