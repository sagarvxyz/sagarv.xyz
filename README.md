# sagarv.xyz

Source for [Sagar Velagala’s personal website](https://sagarv.xyz): a small,
content-first homepage built with native HTML, plain CSS, and a Lit tidal-orb
enhancement. The page’s content remains readable without JavaScript.

Vite builds the site, and a Cloudflare Worker serves its HTML and Markdown
representations. There is no client-side router or Markdown-to-HTML page generator.

## Getting started

Use Node.js 22.12+ on a supported LTS release and npm. If you use
[mise](https://mise.jdx.dev/), `mise install` installs the LTS version configured
in `mise.toml`.

```sh
npm ci
npm run dev
```

The development server uses Vite’s Cloudflare plugin to run the Worker in
`workerd`, with module serving and hot module replacement.

To build and preview the production assets locally:

```sh
npm run build
npm run preview
```

Preview runs the same Worker against the built assets. Neither command publishes
the site.

## Checks

```sh
npm test
npm run lint
npm run fmt:check
```

- `npm test` checks the Worker’s representation routing with Node’s test runner.
- `npm run lint` checks TypeScript with oxlint and CSS with stylelint.
- `npm run fmt:check` checks formatting with oxfmt; `npm run fmt` applies it.
- `npm run build` also runs TypeScript’s type checker before building.

## Project structure

```text
index.html          Homepage content, metadata, and discovery links
404.html            HTML error page
public/             Markdown content, llms.txt, robots.txt, sitemap, and favicon
src/main.ts         Registers the Lit tidal-orb component
src/components/     Web components
src/styles/         Plain CSS
src/worker.ts       Request routing and HTML / Markdown negotiation
tests/              Worker routing tests
vite.config.ts      Vite build and Cloudflare integration
wrangler.jsonc      Worker and asset configuration
```

The current site contains the homepage and error page, not a blog, résumé
timeline, or policy pages.

## HTML and Markdown

The homepage is available as HTML for browsers and Markdown for readers and
agents:

```sh
# Request the Markdown representation of the homepage.
curl -H 'Accept: text/markdown' https://sagarv.xyz/

# Or use the explicit Markdown URL.
curl https://sagarv.xyz/index.md
```

HTML is the default and wins when both representations have equal preference.
Negotiated responses include `Vary: Accept`; discovery links point to Markdown,
`llms.txt`, and the sitemap. Missing pages retain a 404 status in either
representation.

When editing homepage copy, update both `index.html` and `public/index.md`.
Likewise, keep `404.html` and `public/404.md` aligned. Markdown files are maintained
directly, not generated from HTML or used as the site’s layout language.

## Deployment

The site targets **Cloudflare Workers, not Cloudflare Pages**. A production build
outputs static assets to `dist/client` and the generated Worker configuration to
`dist/sagarvxyz/wrangler.json`.

With Wrangler authenticated to the intended Cloudflare account, build and deploy
using the generated configuration:

```sh
npm run build
npx wrangler deploy --config dist/sagarvxyz/wrangler.json
```

The deploy command publishes to Cloudflare. Use the generated configuration,
not an old Astro `dist` asset root. Deployment and pushes to the production branch
require explicit approval.
