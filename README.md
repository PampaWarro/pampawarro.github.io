# pampawarro.org

The website of Pampa Warro, as plain static files. It replaces the site the hosted page
builder used to serve (the original design, text, images and behaviour are kept exactly)
and is published by GitHub Pages from the root of this repository.

There is no build step, no framework and no dependency: what is in the repository is what
is served. Edit the HTML, commit, done.

## File map

```
index.html                              home ("experiencia")
experiencia.html                        byte-identical copy of index.html (every "< Back" link points here)
ethos.html                              the ethos page
fuego-austral-2019.html                 the seven gallery pages, one per event
conjuro.html
fuego-austral-2018.html
primavera-pampa-warro-el-correo.html
pwi.html
fuego-austral-2017.html
recompression-2017.html
404.html                                "page not found" (also redirects trailing-slash URLs, see below)
assets/css/site.css                     the one stylesheet (fonts, tokens, shell, pages, one breakpoint)
assets/js/site.js                       the one script (menu, video, gallery slider, card sizing fallback)
assets/fonts/                           Jost (variable, latin) + its OFL licence
assets/img/logo.png                     header logo (253 x 87)
assets/img/og-image.jpg                 share image (1500 x 999)
assets/img/home/                        home tiles and the video thumbnail
assets/img/ethos/                       the ethos photos
assets/img/<gallery-slug>/              the slides of each gallery page, e.g. assets/img/pwi/01-1000w.webp
favicon.ico  robots.txt  sitemap.xml    crawl files
.nojekyll                               tells GitHub Pages to serve the files as they are
```

URLs have no extension: `/ethos` is served from `ethos.html` by GitHub Pages. Every link and
image path inside the HTML is root-absolute (`/ethos`, `/assets/img/...`).

## Editing a page

Open the `.html` file and edit the text or the markup directly; the pages are short and
hand-written. Rules that keep the site consistent:

- `experiencia.html` must stay byte-identical to `index.html`. After editing one, copy it
  over the other and check with `cmp index.html experiencia.html` (prints nothing when equal).
- The site is one stylesheet: colours, sizes, spacings and timings are custom properties at
  the top of `assets/css/site.css`. Do not add inline `style` attributes; the only inline
  values are the per-player `--ratio` custom properties on the gallery pages, which are content.
- Keep the heading structure as it is (the logo is an `h1` on every page): it is content and
  crawlers read it.
- When the visible content of a page changes, set that page's `<lastmod>` in `sitemap.xml` to
  the date of the edit (the dates there now are the original site's).

## Adding a gallery image

Every image is shipped in up to seven sizes (the ones the original CDN served), named by
their real pixel width: `<name>-100w.webp`, `-300w.webp`, `-500w.webp`, `-750w.webp`,
`-1000w.webp`, `-1500w.webp`, `-2500w.webp`. A rendition is never larger than the original,
so a 2048px wide photo ends at `-2048w.webp`, and sizes above the original are not created.

To add slide 06 to `/pwi`:

1. Export the photo as WebP at those widths into `assets/img/pwi/06-100w.webp` ... `06-2500w.webp`
   (whichever exist; the file name must carry the real width).
2. In `pwi.html`, inside `<div class="strip__track" data-track>`, add after the last slide:

   ```html
   <img class="strip__slide" data-slide aria-current="false"
        src="/assets/img/pwi/06-1000w.webp"
        srcset="/assets/img/pwi/06-100w.webp 100w, /assets/img/pwi/06-300w.webp 300w, /assets/img/pwi/06-500w.webp 500w, /assets/img/pwi/06-750w.webp 750w, /assets/img/pwi/06-1000w.webp 1000w, /assets/img/pwi/06-1500w.webp 1500w, /assets/img/pwi/06-2500w.webp 2500w"
        sizes="(max-width: 800px) calc((100vw - 96px) * A / 2), calc(min(100vw - 116px, 1794px) * A / 2)"
        width="W" height="H" alt="06.jpg">
   ```

   with `W` x `H` the pixel size of the original and `A` = `W / H` (6 decimals). The `sizes`
   value is the rendered width of that slide (the strip is half as tall as it is wide, and a
   slide is as wide as its aspect ratio makes it), so the browser picks the right file. Only
   the first slide of a strip has `aria-current="true"`.

Home tiles and the ethos photos follow the same naming; their `sizes` attributes are the
ones the original pages used and should stay as they are.

## Fonts

The original site rendered everything in Futura PT through the previous host's Adobe Fonts
kit, which was licensed to that host only. This site ships Jost (SIL Open Font License,
`assets/fonts/OFL.txt`), tuned inside the `@font-face` rules at the top of `site.css`
(`size-adjust`, `ascent-override`, `descent-override`) so that it takes up the same space as
Futura PT: baselines land on the same pixel, and on most pages lines break exactly where they
did. Measured in Chromium at every window width from 320 to 2560px, the exceptions are:

- Home, `/conjuro`, `/fuego-austral-2018`: none.
- `/primavera-pampa-warro-el-correo`, `/pwi`, `/fuego-austral-2017`, `/recompression-2017`
  (title row split 11 + 1): from 871 to 885px the `< Back` link fits on one line instead of
  two, so everything below it sits 11 to 21px higher.
- `/fuego-austral-2019`: from 398 to 405px the photo credit breaks at another word; from 424
  to 430px it fits on one line (the page is 27px shorter).
- `/primavera-pampa-warro-el-correo`: from 467 to 473px the title fits on one line (33px shorter).
- `/ethos`: at about one width in eight (280 of 2241) a paragraph, a crew-name column or the
  Crew card takes a line more or fewer, so the page is up to 61px taller or shorter there.
- `404.html`, the only English text: the sentences break differently at 46 widths; where the
  page is shorter than the window its content shifts by half a line.

The numbers in the `@font-face` rules are measured; please do not round them.

For exact Futura PT: create an Adobe Fonts web project containing Futura PT Light, Book and
Heavy, and add the stylesheet `<link>` Adobe Fonts shows for that project to the `<head>` of
every HTML file, before `site.css`. The font stack already lists `"futura-pt"` first, so
nothing else changes: with the kit the pages are pixel-identical to the original, without it
Jost renders.

## 404 and trailing slashes

GitHub Pages serves `404.html` for any URL that matches no file. The original site answered
`/ethos/` (trailing slash) like `/ethos`; here a three-line script at the top of `404.html`
sends `/ethos/` to `/ethos` (and `/anything/` to `/anything`, which then shows the 404 page
if it does not exist). The page also carries `noindex`, because Pages answers `/404.html`
itself with status 200.

## Kept from the original, for the owner to decide

The look is reproduced exactly, including two things an accessibility checker flags on the
original as well: the grey of the inactive menu links, the headings and the `< Back` link
(`--c-nav: #999` and `--c-heading: #9c9c9c` on white, a contrast of 2.85 and 2.75 to 1, below
the 4.5 to 1 that WCAG AA asks for text and the 3 to 1 for large headings), and the two
"clicking here" links on the 404 page, which are black inside near-black text with no
underline. A darker grey and an underline would fix both; they are visible changes, so they
wait for the owner. The colours are the tokens at the top of `assets/css/site.css`.

## Small differences from the original

Invisible or nearly so, listed for the record:

- Gallery slides are plain `<img srcset sizes>`. At a few window widths (and more often on
  Windows, whose scroll bar takes room) the browser picks the next larger file than the
  original's image loader did, so a slide is sharper and up to a pixel wider.
- Keyboard and screen-reader improvements: MENU is a button that says whether the menu is open,
  the active slide is marked with `aria-current`, the social links and every player have a name,
  the Play button moves keyboard focus into the video.
- Social links use `https` and open with `rel="noopener"`.
- Without JavaScript the gallery strip scrolls sideways (the original showed nothing).
- The 404 page's second link searches the site on Google (the original pointed at a search page
  of the old host, which no longer exists), and the page is marked `noindex`.

## Where the originals are

A full backup of the original site, taken on 2026-10-01 before the move, is kept outside this
repository in `~/Documents/pampawarro-squarespace-backup-2026-10-01/`: the original uploads
(the only full-quality copies of the photos), each page's HTML and data as the old host served
them, the reference screenshots the rebuild was checked against, and the rebuild notes. Keep
that folder: the files in `assets/img/` are the sized renditions the old CDN served, byte for
byte, not the originals.
