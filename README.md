# sagarv.xyz

The existing personal homepage, migrated from Astro to native HTML, plain CSS,
and a Lit tidal-orb enhancement. Vite handles the build; oxlint, oxfmt and stylelint
handle code quality. There is no client-side router or Markdown-to-HTML page generator.

## Develop and verify

Use Node 22.12+ (or a newer supported LTS).

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
npm run lint
npm run fmt:check
```

Vite's Cloudflare plugin runs the same Worker in workerd during development and
built previews. Development adds Vite's module serving and HMR; preview serves
the built assets. The HTML and Markdown are readable without JavaScript.

## Structure

```text
index.html          Existing homepage copy, plus agent / Markdown footer links
404.html            Existing error-page content
public/             Markdown counterparts, llms.txt, robots.txt, sitemap, favicon
src/main.ts         Registers the Lit orb
src/components/     Web components
src/styles/         Plain CSS
src/worker.ts       HTML / Markdown negotiation
tests/              Representation-routing tests
```

Keep `public/index.md` in sync with the homepage text. Maintaining this small
editorial counterpart avoids converting HTML into Markdown or using Markdown as
the site's layout language. The homepage offers `Accept: text/markdown`, explicit
`.md` URLs, `Vary: Accept`, and discovery links; HTML is the default on ties.

The résumé timeline, policy text and Markdown blog are **not** in this release.
They remain on the local `draft/lit-site` branch for further review.

## Production

Cloudflare Workers, not Pages. `npm run build` produces `dist/client` and the
Worker deployment configuration at `dist/sagarvxyz/wrangler.json`.

Deploy using that generated configuration, not the old Astro `dist` asset root:

```sh
npx wrangler deploy --config dist/sagarvxyz/wrangler.json
```

Building and previewing do not publish anything. Deployment and pushes to the
production branch require explicit approval.
