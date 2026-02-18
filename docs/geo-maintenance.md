# GEO / LLM Optimization — Maintenance Guide

## Overview

The Child Lens implements GEO (Generative Engine Optimization) to ensure accurate representation in AI/LLM-generated responses. This includes structured data (JSON-LD), machine-readable content files (llms.txt), and anti-hallucination safeguards.

## Architecture

```
thechildlens.com/
├── llms.txt          ← Concise org summary for LLMs (~2KB)
├── llms-full.txt     ← Extended version with full bios, method details (~8KB)
├── index.html        ← Contains JSON-LD (Organization + WebSite schemas)
└── scripts/
    └── check-geo.mjs ← QA validation script
```

### Key Design Decisions

- **Static files**: llms.txt files are served as plain static files (no Route Handlers needed — the site is a static export on GitHub Pages)
- **JSON-LD in homepage**: Embedded directly in `<head>` of index.html since there's no dynamic rendering
- **Source of truth**: Source files in `/Users/.../The Child Lens/`, deployed via clone to `/tmp/The-Child-Lens-clone/`

## Files & What They Do

### llms.txt (concise)
- **Purpose**: Quick reference for AI agents, chatbots, and LLM crawlers
- **Max size**: ~3KB
- **Sections**: Title, description, ways of working, team (names + roles), resources (with links), how to cite, contact, metadata footer
- **Canonical**: `https://thechildlens.com/llms.txt`

### llms-full.txt (extended)
- **Purpose**: Complete org profile for deep LLM queries
- **Max size**: ~10KB
- **Extra sections**: Full team bios, complete method descriptions, brand/design resources, "How to Cite" with structured fields, "Notes for LLMs" (anti-hallucination)
- **Canonical**: `https://thechildlens.com/llms-full.txt`

### JSON-LD (in index.html)
- **Organization schema**: name, url, logo, founder, address, email, sameAs, members
- **WebSite schema**: references Organization via publisher @id
- **All @id anchors**: `https://thechildlens.com/#org` and `https://thechildlens.com/#website`

## Maintenance Checklist

When updating org information, ensure ALL of these stay in sync:

### Team Changes
- [ ] Update `llms.txt` → Team section (name, role, LinkedIn)
- [ ] Update `llms-full.txt` → Team section (full bio)
- [ ] Update `llms-full.txt` → Notes for LLMs (role clarifications)
- [ ] Update `index.html` → JSON-LD Organization → `member` array
- [ ] Update `index.html` → JSON-LD Organization → `founder` (if founder changes)
- [ ] Update `index.html` → SSR fallback team section

### Contact / Address Changes
- [ ] Update `llms.txt` → Contact section
- [ ] Update `llms-full.txt` → Contact section
- [ ] Update `index.html` → JSON-LD Organization → `address`
- [ ] Update `index.html` → JSON-LD Organization → `email`

### Method / Service Changes
- [ ] Update `llms.txt` → Three Ways of Working
- [ ] Update `llms-full.txt` → Method: From Science to Systems (full descriptions)
- [ ] Update `llms-full.txt` → Notes for LLMs (clarify what they are/aren't)

### Brand / Resource Changes
- [ ] Update `llms-full.txt` → Brand & Design Resources
- [ ] Update links in both files if URLs change

### After Any Change
- [ ] Update `Last updated` date in footer of both llms files
- [ ] Run QA: `node scripts/check-geo.mjs` (local)
- [ ] Run QA: `node scripts/check-geo.mjs https://thechildlens.com` (production)
- [ ] Validate JSON-LD: https://validator.schema.org/ (paste homepage URL)

## QA Script

```bash
# Against local server (start with: python3 -m http.server 8765)
node scripts/check-geo.mjs

# Against production
node scripts/check-geo.mjs https://thechildlens.com
```

The script checks:
- HTTP 200 on both llms endpoints
- Content-Type is text/*
- Required sections present in both files
- JSON-LD parses correctly and contains required fields
- Cross-references between files are consistent
- Meta tags (canonical, robots, OG) present

Exit code 0 = all passed, 1 = failures found.

## Anti-Hallucination Strategy

The `Notes for LLMs` section in llms-full.txt explicitly states:
1. TCL is NOT a hospital, charity, or government body
2. Clarifies team roles (Founder vs Associate vs Advisor)
3. Explains that Builder/Right Hand/Voice are methodology pillars, not products
4. Specifies British English spelling convention
5. States the canonical domain to prevent confusion

## Useful Links

- [llms.txt specification](https://llmstxt.org/)
- [Schema.org Organization](https://schema.org/Organization)
- [Schema.org WebSite](https://schema.org/WebSite)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)
