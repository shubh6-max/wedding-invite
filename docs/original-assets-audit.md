# Sage Envelope: original artwork audit

The Sage Envelope design (`src/templates/sageenvelope/`) is rebuilt from the artwork of the original invitation site
**https://kabir-weds-diksha.site/** (by designsbyinaara), the site filmed in the reference reel.

**Permission.** Reuse of this artwork was stated as permitted by the designer, via the project owner, on 23 Oct 2026.
That permission was not independently verified here. Keep the written permission with the project. Without it, these
files must not be published.

**How the files were found.** The site is a Vite single-page app. Its JS and CSS bundles were read as text (nothing
was executed) for `/assets/` references. The page was then opened in Edge at 390 x 844 (mobile layout), the seal
tapped, and every section scrolled through, recording each element's image, box, classes and styles. The layout,
sizes and motion in `sageenvelope.css` and `SageEnvelope.jsx` follow that capture and the site's own class names.

**What changed in the files.** Each image is converted to WebP (quality 82, transparency kept) and scaled down to
about 2.5x the CSS width it is shown at; nothing is upscaled. The original pixel sizes are listed below. The 48 files
shipped total about 1.8 MB, against 25.7 MB as served by the original.

## Files in `public/sageenvelope/`

Source URL for each: `https://kabir-weds-diksha.site/assets/<original file>`.

| Shipped file | Original file | Original px | Shipped px | Where it renders |
| --- | --- | --- | --- | --- |
| `envelope.webp` | `envelope2-rrOoymnG.jpeg` | 536x940 | 536x940 | Gate: the envelope |
| `seal.webp` | `button-CrsgPsuz.png` | 475x525 | 475x525 | Gate: the wax seal (button) |
| `hero-scene.webp` | `main_section-CXAGbi6Z.png` | 1536x2796 | 1000x1820 | Hero: sky, mandap and couple (backdrop) |
| `hero-sky.webp` | `bg-d-firstpage-C8jjAsbv.png` | 775x644 | 775x644 | Hero: section ground (8px strip above the scene) |
| `ganesha.webp` | `ganeshji-kHN3fgWp.png` | 124x159 | 124x159 | Hero: Ganesha mark |
| `dancer1.webp` | `dancer1-mp2-TDXs.png` | 318x727 | 240x549 | Hero: dancer |
| `dancer2.webp` | `dancer2-Bn_2k0hM.png` | 306x684 | 240x536 | Hero: dancer |
| `dancer3.webp` | `dancer3-CXrnIJ5V.png` | 415x580 | 240x335 | Hero: dancer |
| `dancer4.webp` | `dancer4-DgnGFgQE.png` | 341x701 | 240x493 | Hero: dancer |
| `dancer6.webp` | `dancer6-BgYehBrP.png` | 286x676 | 240x567 | Hero: dancer |
| `dancer7.webp` | `dancer7-CxqnVLnh.png` | 330x529 | 240x385 | Hero: dancer |
| `dancer8.webp` | `dancer8-DLrAVB_Q.png` | 257x605 | 240x565 | Hero: dancer |
| `couple.webp` | `couple-BgrKK4o8.png` | 464x538 | 464x538 | Welcome: the couple |
| `mehendi-bg.webp` | `bg-m-mehndi-iO-YGkmA.PNG` | 1786x3221 | 1000x1803 | Mehendi: backdrop |
| `umbrella1.webp` | `umbrella1-BdeDwzVj.png` | 579x311 | 320x172 | Mehendi: umbrella (x2) |
| `umbrella2.webp` | `umbrella2-CnwT3ZHh.png` | 609x341 | 320x179 | Mehendi: umbrella (x2) |
| `mehendi-cart.webp` | `gadi-CtWIaOjT.png` | 1139x1437 | 640x807 | Mehendi: flower cart |
| `dhol.webp` | `dhol-C8y3aRTq.png` | 525x267 | 360x183 | Mehendi: dhol |
| `sangeet-bg.webp` | `bg-m-sangeet2-p9cok6hc.jpeg` | 720x1284 | 720x1284 | Sangeet: backdrop |
| `sangeet-lights.webp` | `lightdesign-0oRqoNiC.png` | 2802x860 | 1000x307 | Sangeet: light strings |
| `disco.webp` | `disco1-BETnkKjM.png` | 400x399 | 240x239 | Sangeet (x4), Reception (x2): disco ball |
| `lamp.webp` | `lamp-B6S3oSZG.png` | 286x1046 | 140x512 | Sangeet: lamp (x2) |
| `side-disco.webp` | `side_disco-DgWJgi4b.png` | 980x881 | 380x342 | Sangeet: disco stand |
| `wedding-bg.webp` | `bg-m-wedding2-DwIcryQB.jpeg` | 992x1600 | 992x1600 | Wedding: backdrop |
| `wedding-garland.webp` | `sidemala2-DDLEBbLq.png` | 1054x860 | 400x326 | Wedding: hanging bells (x2) |
| `wedding-sidevase.webp` | `sidevase-DkdV7-Qs.png` | 1406x786 | 1000x559 | Wedding: plant and side table |
| `wedding-vase-tall.webp` | `flowervase2-tGMi9Ik3.png` | 334x1479 | 280x1240 | Wedding: tall urn |
| `wedding-vase.webp` | `flowervase4-KEqgs6bH.png` | 458x840 | 260x477 | Wedding: urn |
| `wedding-fire.webp` | `aag-CUV844_d.png` | 541x358 | 320x212 | Wedding: sacred fire |
| `wedding-pond.webp` | `pond-nvI6UIeI.png` | 674x261 | 360x139 | Wedding: petal bowl |
| `reception-bg.webp` | `bg-m-reception-Dp3MVAIB.PNG` | 640x1153 | 640x1153 | Reception: backdrop |
| `reception-table.webp` | `table-CDbT3-87.png` | 1303x1272 | 600x586 | Reception: banquet table |
| `reception-candelabra.webp` | `candle_reception-DoF6jSyw.png` | 436x628 | 320x461 | Reception: candelabra |
| `reception-florals.webp` | `Reception_art-DQFoXdOA.png` | 1006x711 | 420x297 | Reception: florals and mirror balls |
| `candle.webp` | `candle3-aEAzCA-P.png` | 116x234 | 116x234 | Reception: candle (x2) |
| `candles.webp` | `candles-BH1XfZPw.png` | 222x221 | 200x199 | Reception, Cocktail: candles |
| `cocktail-bg.webp` | `bg-m-cocktail2-BJsTzgZz.jpeg` | 936x1600 | 936x1600 | Cocktail: backdrop |
| `cocktail-trail-left.webp` | `silvertrail1-B1bK_LgN.png` | 1524x1007 | 400x264 | Cocktail: crystal strands, left |
| `cocktail-trail-right.webp` | `silvertrail2-C_iqAopH.png` | 1801x709 | 400x157 | Cocktail: crystal strands, right |
| `cocktail-drapes.webp` | `purpledesign-CN28xBz5.png` | 1987x665 | 1000x335 | Cocktail: drapes |
| `cocktail-balls.webp` | `cocktail_balls-Cx1Ccqje.png` | 1946x520 | 1000x267 | Cocktail: mirror balls |
| `cocktail-arch-small.webp` | `cocktail_bitmap2-BQgAJTrz.png` | 256x608 | 140x333 | Cocktail: light arch, small |
| `cocktail-arch.webp` | `cocktail_bitmap-BIJU7WZh.png` | 256x1037 | 140x567 | Cocktail: light arch |
| `cocktail-mirror.webp` | `mirror-CLMdLVrG.png` | 779x1248 | 520x833 | Cocktail: gold mirror |
| `cocktail-flower.webp` | `cocktail_flower-gC1dflUw.png` | 667x1104 | 440x728 | Cocktail: lotus lamp (x2) |
| `cocktail-sideballs.webp` | `cocktail_sideballs-BQ6K0eme.png` | 378x384 | 200x203 | Cocktail: mirror balls, corner |
| `cocktail-wheat.webp` | `cocktail_wheet-BPXQhoJf.png` | 1046x685 | 640x419 | Cocktail: pampas |
| `venue-bg.webp` | `venue_bg-PWdit_Ul.png` | 832x1256 | 832x1256 | Venue: backdrop |

## Original assets not used

- **`weddingsong-*.mp3`**: background music the original starts on the first tap or scroll. It is a song recording,
  which the designer's permission does not cover, and the brief rules out autoplay audio. Left out.
- **Desktop-only art** (`bg-d-mehndi`, `bg-d-sangeet2`, `bg-d-wedding2`, `bg-d-reception`, `bg-d-cocktail2`,
  `rosepetals`, `greengrass`, `bride`, `groom`, `reception_1`, `reception_2`): used only by the original's desktop
  layout. This design keeps the 430px phone layout on every screen.

## Not from the original

- **Fonts**: Great Vibes, Cormorant and Playfair Display, the families the original uses, loaded from Google Fonts
  (open licence, `index.html`).
- **Emoji**: the gate's corner flowers, the hero's falling blossoms and the footer bouquet are system emoji, as in
  the original. They draw differently on iPhone, Android and Windows.
- **Icons**: the map pin and the directions arrow are Lucide icon paths (ISC licence), the same icons the original uses.
- **Text**: all wording is Komal & Prem's (`src/data/samples/sageenvelope.js`). Family names, dates and venue there are
  placeholders until the real details are filled in.

## Known differences from the original

- The invocation line ("||Shri Chintamani Parshvanathaya Namah||", in place of the original's "||Shree Ganeshaya
  Namah||") is 12px (the original's is 10px), to stay within this site's readable minimum.
- The scratch card, page entrances and section reveals are CSS rebuilds of the original's framer-motion animations:
  the same values, but not frame-identical easing. The closing words and family cards rise in as each block enters
  the screen; in the original they track the scroll position.
- The footer has 88px more padding at the bottom, so its last line clears this site's floating nav bar.
- The map shows the placeholder address until the real one is entered.
