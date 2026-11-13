# Children's health map integration

The main website is a published static Next.js export served by GitHub Pages (`CNAME`, `.nojekyll`, exported `_next` assets). It does not contain the Next.js source, `package.json`, a Node version pin, or a build command. Its only available QA script is `scripts/check-geo.mjs`. A fresh Next.js build cannot be reproduced from this repository.

The map source and its Vercel deployment remain in `The-Child-Lens/Mapping-Childrens-Health`. This repository publishes a snapshot of the map's 52-file static build at `/map/`, so the address stays `thechildlens.com/map/`. All map pages and relative assets resolve beneath that path. The Home and About navigation point there. The map uses Supabase directly for public data, sign-in and the organisation workspace.

To update the snapshot after a map release, run from the map source repository:

```sh
MCH_PUBLIC_BASE_URL=https://thechildlens.com/map/ node scripts/build-static.mjs
cp -R dist/. /path/to/The-Child-Lens/map/
```

Review the resulting diff and test `/map/`, `/map/directory.html`, pin cards, filters and sign-in before publishing the main site. If build files have been removed upstream, delete obsolete files from this snapshot explicitly after review. The Vercel deployment remains available but is no longer the navigation destination.

The design tokens in the main site's `shared/shared.css` are cream `#f9f6f0`, charcoal `#222222`, secondary cream `#f2efe8`, aqua `#81ecec`, Lenia Sans headings and Helvetica Neue body. The map's `brand-system.css` applies those tokens. Category pin colours remain distinct.

For Google and email sign-in on this origin, Supabase Auth must allow redirect URLs under `https://thechildlens.com/map/` (including `index.html`). The provider configuration must also permit the production domain. Test the full sign-in return flow with a real account after any Auth setting change.

The static snapshot duplicates published assets and requires manual synchronization on future map releases. A longer-term setup could put the whole site behind a host that supports a `/map/*` reverse proxy to the separately deployed app, while preserving one public domain. That would need Tito's domain and hosting changes. If Tito provides the original Next.js source, future navigation edits belong there so regenerated output does not overwrite these patches.
