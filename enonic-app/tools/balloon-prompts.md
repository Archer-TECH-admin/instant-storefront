# Headless Hollywood — balloon-image prompt library

Reference for generating new "bizarro" Headless Hollywood images (every person has a tied-off latex balloon for a head). Paste the relevant prompt into any image-generation model that supports text-to-image (for posters) or image+text editing (to convert an existing photo).

The original generation pipeline (Vertex / Gemini, manifest-driven batching, retry logic) was deleted after the initial content seed — this file preserves only the durable IP: the prompts and the per-actor balloon identities.

## Per-actor balloon identity

Each character has a fixed balloon color + doodle so the bizarro universe stays consistent. The keys match the `persons/<slug>` folder names under `import/hmdb/`.

| slug | color | doodle |
|---|---|---|
| bob-gondola | dark green | an iron prison key |
| brad-pittless | crimson red | a small flame |
| bruce-wheezis | cream off-white | a clenched fist |
| kerry-aire-moss | forest green | a tied rope knot |
| christian-balloon | charcoal gray | a bat silhouette |
| christopher-knotlen | silver | a spinning top |
| daniel-carrigear | matte black | a tiny revolver |
| frank-daraballoon | sand tan | a barred prison window |
| heath-levitatus | deep purple | a crooked grin |
| jeffrey-wroughtair | navy blue | a small star-shaped badge |
| john-travolatex | jet black | a pair of dance shoes |
| keanu-reefs | obsidian black | a single green digital glyph |
| lea-seydough | rose pink | a small skeleton key |
| morgan-floatman | warm beige | an open book |
| quentin-tieantino | brick red | a clapperboard |
| samuel-l-jackdaw | deep wine | a wallet |
| steven-spielmann | dusty gold | a small film reel |
| the-wachowstring-siblings | split half-black half-emerald | a string knot |
| tim-ribbons | sky blue | a small rock hammer |
| uma-tieoffman | bright yellow | a tiny katana |

## 1) Single-person edit (replace one head in an existing photo)

Send the source photo plus this prompt. Substitute `{color}` and `{doodle}` from the table above.

```
Edit this photograph to fit a comedic Headless Hollywood universe.

CHANGE: Replace every visible person's head with a tied-off {color} latex balloon. The balloon must be sized and positioned exactly where the original head appears, including the same angle and rotation. A short white string trails from the bottom of the balloon down to the neck where it meets the body. Drawn on the front-facing surface of the balloon, in a single hand-drawn black marker stroke style, is {doodle}.

PRESERVE EXACTLY: pose, body, outfit, hands, background, lighting direction, color palette, photographic grain, era and styling of the photo. If the original is black-and-white, the output must be black-and-white. Do not redraw, recolor, or restyle anything below the neck.

The result should look like a real photograph in which a balloon has replaced the head -- not an illustration, not a cartoon, not a stylized render.
```

## 2) Multi-person edit (named cast in an existing photo)

When the source photo has multiple recognisable characters, list them in visible order (left-to-right or front-to-back) and use this prompt instead.

```
Edit this photograph to fit a comedic Headless Hollywood universe.

CHANGE: Replace EVERY visible person's head with a tied-off latex balloon. Each named character below gets a specific balloon. Any other visible people in the frame get a generic medium-gray balloon with a small hand-drawn 'X' on it.

NAMED CHARACTERS (in order, e.g. left-to-right or front-to-back as visible):
  1. <slug>: a <color> latex balloon, with a hand-drawn black marker doodle of <doodle> on it.
  2. <slug>: a <color> latex balloon, with a hand-drawn black marker doodle of <doodle> on it.
  ...

Each balloon is sized and positioned exactly where the original head appears, with the same angle and rotation. A short white string trails from the bottom of each balloon to the neck. The doodle on each balloon is rendered as a single hand-drawn black marker stroke.

PRESERVE EXACTLY: every pose, body, outfit, hands, background, lighting direction, color palette, photographic grain, era, and overall photographic style. If the original is black-and-white, the output must be black-and-white. Do not redraw, recolor, or restyle anything below the necks.

The result should look like a real photograph in which balloons have replaced the heads -- not an illustration, not a cartoon, not a stylized render.
```

## 3) Movie poster (text-to-image, no source photo)

Generate a poster from scratch. Substitute `{title}`, `{genre_typography}`, and a bullet list of balloon-headed figures (one per character in `{actor_list}`).

```
Generate a movie poster for the Headless Hollywood universe -- a comedic alternate-cinema world where every actor has a tied-off latex balloon for a head.

TITLE: "{title}" -- typeset prominently on the poster in a {genre_typography} typeface. Title placement should follow standard cinematic poster conventions for this kind of film.

CHARACTERS shown on the poster (each a balloon-headed figure in body posture and outfit appropriate to the film):
{actor_list}

STYLE: photographic figures with hand-drawn marker doodles on their balloon heads, cinema-grade poster typography, dramatic lighting, the visual register a real movie poster would use for this title. Aspect ratio: vertical poster, roughly 2:3.

The image should look like a real movie poster -- not a cartoon, not an illustration -- where balloons have replaced the heads.
```

`actor_list` line format (one per character):

```
  - a balloon-headed figure (head: tied-off <color> latex balloon with a hand-drawn black marker doodle of <doodle>)
```

### Genre typography hints

Use these for the `{genre_typography}` slot to nudge the poster towards the right typeface vibe.

| title | typography |
|---|---|
| Pump Fiction | blocky 1990s pulp-novel |
| The Latex | futuristic green-tinted Matrix-style |
| No Time to Deflate | sleek modern Bond-style serif with metallic accents |
| The Dirigible Knight | stark dramatic cinematic |
| S7ven | grungy distressed thriller |
| The Shoehorn Redemption | soft serif drama |
| Spielmann's Spreadsheet | muted dignified sepia serif |

## Tips

- **IMAGE_SAFETY blocks**: scenes with weapons (pistols, knives) often trip safety filters. The standard fix is to swap the weapon for a balloon-themed prop in the prompt — e.g. "replace the pistol with a chrome hand-held balloon pump".
- **Output dimensions**: edit-mode generators usually return the source aspect ratio; poster-mode is best with an explicit "vertical poster, roughly 2:3" instruction (already in the template).
- **Black-and-white sources**: the "If the original is black-and-white, the output must be black-and-white" line is load-bearing — without it the model often colorises.
- **Multi-character ordering**: models are unreliable at left/right placement when the people are similar. Specify front/back or distinguishing features (clothing colour, posture) in addition to slug order.
