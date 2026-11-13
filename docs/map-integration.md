# Children's health map integration

The main website repository is a published static Next.js export served by GitHub Pages (`CNAME`, `.nojekyll`, exported `_next` assets). It does not contain the Next.js source, `package.json`, a Node version pin, or a build command. Its only available QA script is `scripts/check-geo.mjs`, which runs on current Node and checks published content. A fresh Next.js build cannot be reproduced from this repository.

The map remains the separately built Vercel app in `The-Child-Lens/Mapping-Childrens-Health`. The main site's Home and About navigation link to `/map/`, a small GitHub Pages route that redirects to the stable production map URL. This keeps the map's Supabase Auth session, filters, pin cards, and organisation workspace on their existing origin. Copying the map assets into this generated export or embedding it in an iframe would create two deployment owners and complicate authentication and responsive layout.

The main site's published design tokens are in `shared/shared.css`: cream `#f9f6f0`, charcoal `#222222`, secondary cream `#f2efe8`, aqua `#81ecec`, Lenia Sans headings and Helvetica Neue body. The map's `brand-system.css` carries a scoped application of those tokens. The map's category pin colours stay distinct for interpretation.

When `map.thechildlens.com` has working DNS and Vercel verification, switch the redirect in `map/index.html` to that hostname only after checking TLS, Supabase Auth redirect URLs, account sign-in and map routes. The navigation can keep linking to `/map/`.

If Tito can provide the original Next.js source repository, future navigation edits should be made there and exported through its normal build pipeline. The small published-HTML patch here is appropriate for this exported repository, but regenerated output could overwrite it.
