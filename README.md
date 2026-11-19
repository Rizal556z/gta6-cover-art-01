# Neon Coast Cover Studio — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Rizal556z/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Rizal556z/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photo into GTA 6-style Vice City cover art: the multi-panel
poster / loading-screen look, with a neon-sunset colour grade and bold caption
lettering — exported as a PNG to share.

## What it does

- **Any photo** — load two of your own photos (Photo A and Photo B) from your
  machine, or use the built-in samples (pier and boulevard, made for make.fun
  and free to use). Photos are read on your machine and never uploaded.
- **Several panels** — four layouts: Grid (2×2), Hero + 3, Split (3 panels)
  and Full bleed. Fill several panels with one photo or several.
- **Crop and position per panel** — pick a panel, choose which photo it shows,
  then zoom and pan it until the framing is right.
- **Colour grades** — Vice Sunset, Neon Nights, Warm Gold and Mono Vice.
- **Lettering** — edit the caption and subtitle; the caption is set in big
  bold italic capitals with an accent bar, GTA-poster style.
- **Finish** — film grain and vignette toggles.
- **Fast and easy** — one click exports a PNG in 1080×1080, 1080×1350 or
  1920×1080, or all three sizes at once.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything is static files
under `app/` — no build step, no network request, no library to install.

## Originality

All art is the app's own: no Rockstar Games logo, wordmark, official
artwork, character or font. Lettering uses the system font stack at heavy
weights only. The two sample photos under `app/samples/` were made for
make.fun with an image model and are free to use.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the kit's vendored `buildDossier` library.

License: MIT (see LICENSE).

---
<sub>Entered on [make.fun](https://make.fun/?ref=8497f1e3&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
