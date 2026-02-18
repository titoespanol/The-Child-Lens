#!/usr/bin/env node

/**
 * check-geo.mjs — GEO/LLM QA Validation Script
 *
 * Validates that all GEO endpoints and structured data are correct.
 * Run against local server or production.
 *
 * Usage:
 *   node scripts/check-geo.mjs                     # defaults to http://localhost:8765
 *   node scripts/check-geo.mjs https://thechildlens.com
 */

const BASE = process.argv[2] || 'http://localhost:8765';
const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let passed = 0;
let failed = 0;
let warnings = 0;

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

async function check(label, fn) {
  try {
    const result = await fn();
    if (result === true) {
      log(PASS, label);
      passed++;
    } else if (result === 'warn') {
      log(WARN, label);
      warnings++;
    } else {
      log(FAIL, label + (typeof result === 'string' ? ` — ${result}` : ''));
      failed++;
    }
  } catch (err) {
    log(FAIL, `${label} — ${err.message}`);
    failed++;
  }
}

async function fetchText(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchHead(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { method: 'HEAD' });
  return res;
}

// ─── Endpoint Checks ───

async function checkEndpoints() {
  console.log('\n📡 Endpoint Checks');

  await check('/llms.txt returns 200', async () => {
    const res = await fetchHead('/llms.txt');
    return res.ok || `HTTP ${res.status}`;
  });

  await check('/llms-full.txt returns 200', async () => {
    const res = await fetchHead('/llms-full.txt');
    return res.ok || `HTTP ${res.status}`;
  });

  await check('/llms.txt is text/plain or text/markdown', async () => {
    const res = await fetchHead('/llms.txt');
    const ct = res.headers.get('content-type') || '';
    return ct.includes('text/') || `Content-Type: ${ct}`;
  });

  await check('/llms-full.txt is text/plain or text/markdown', async () => {
    const res = await fetchHead('/llms-full.txt');
    const ct = res.headers.get('content-type') || '';
    return ct.includes('text/') || `Content-Type: ${ct}`;
  });
}

// ─── Content Checks ───

async function checkLlmsTxt() {
  console.log('\n📄 llms.txt Content Checks');
  const text = await fetchText('/llms.txt');

  await check('Starts with "# The Child Lens"', async () => {
    return text.startsWith('# The Child Lens') || 'Missing title heading';
  });

  await check('Contains "How to Cite" section', async () => {
    return text.includes('## How to Cite') || 'Missing How to Cite';
  });

  await check('Contains canonical URL', async () => {
    return text.includes('https://thechildlens.com/llms.txt') || 'Missing canonical';
  });

  await check('Contains link to llms-full.txt', async () => {
    return text.includes('llms-full.txt') || 'Missing link to full version';
  });

  await check('Contains "Last updated" date', async () => {
    return text.includes('Last updated') || 'Missing date';
  });

  await check('Contains Contact section', async () => {
    return text.includes('team@thechildlens.com') || 'Missing contact email';
  });

  await check('Under 3KB (concise)', async () => {
    const size = new Blob([text]).size;
    return size <= 3072 || `Size: ${size} bytes (max 3072)`;
  });
}

async function checkLlmsFullTxt() {
  console.log('\n📋 llms-full.txt Content Checks');
  const text = await fetchText('/llms-full.txt');

  await check('Starts with "# The Child Lens"', async () => {
    return text.startsWith('# The Child Lens') || 'Missing title heading';
  });

  await check('Contains "How to Cite" section', async () => {
    return text.includes('## How to Cite') || 'Missing How to Cite';
  });

  await check('Contains "Notes for LLMs" section', async () => {
    return text.includes('## Notes for LLMs') || 'Missing Notes for LLMs';
  });

  await check('Contains canonical URL', async () => {
    return text.includes('https://thechildlens.com/llms-full.txt') || 'Missing canonical';
  });

  await check('Contains all three team members', async () => {
    const hasPilar = text.includes('Pilar Puig');
    const hasTanya = text.includes('Tanya Humphreys');
    const hasMarc = text.includes('Marc Ramis');
    if (!hasPilar) return 'Missing Pilar Puig';
    if (!hasTanya) return 'Missing Tanya Humphreys';
    if (!hasMarc) return 'Missing Marc Ramis';
    return true;
  });

  await check('Contains method sections (Builder, Right Hand, Voice)', async () => {
    const hasBuilder = text.includes('### The Builder');
    const hasRightHand = text.includes('### The Right Hand');
    const hasVoice = text.includes('### The Voice');
    if (!hasBuilder) return 'Missing The Builder';
    if (!hasRightHand) return 'Missing The Right Hand';
    if (!hasVoice) return 'Missing The Voice';
    return true;
  });

  await check('Contains Brand Book and Design System links', async () => {
    const hasBB = text.includes('https://thechildlens.com/brand-book/');
    const hasDS = text.includes('https://thechildlens.com/design-system/');
    if (!hasBB) return 'Missing Brand Book link';
    if (!hasDS) return 'Missing Design System link';
    return true;
  });

  await check('Contains anti-hallucination notes', async () => {
    return text.includes('NOT a hospital') || text.includes('not a hospital') || 'Missing clarification that TCL is not a hospital';
  });

  await check('Under 10KB', async () => {
    const size = new Blob([text]).size;
    return size <= 10240 || `Size: ${size} bytes (max 10240)`;
  });
}

// ─── JSON-LD Checks ───

async function checkJsonLd() {
  console.log('\n🏷️  JSON-LD Checks');
  const html = await fetchText('/');

  await check('Homepage contains JSON-LD script tag', async () => {
    return html.includes('application/ld+json') || 'No JSON-LD found';
  });

  // Extract all JSON-LD blocks
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const blocks = [];
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (e) {
      // will be caught by the parse check
    }
  }

  await check('All JSON-LD blocks parse correctly', async () => {
    const rawBlocks = [];
    const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      rawBlocks.push(m[1]);
    }
    for (let i = 0; i < rawBlocks.length; i++) {
      try {
        JSON.parse(rawBlocks[i]);
      } catch (e) {
        return `Block ${i + 1} failed to parse: ${e.message}`;
      }
    }
    return rawBlocks.length > 0 || 'No JSON-LD blocks found';
  });

  await check('Contains Organization schema', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return !!org || 'No Organization schema found';
  });

  await check('Organization has @id', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return (org && org['@id']) ? true : 'Missing @id on Organization';
  });

  await check('Organization has name "The Child Lens"', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return (org && org.name === 'The Child Lens') ? true : `Name: ${org?.name}`;
  });

  await check('Organization has founder', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return (org && org.founder) ? true : 'Missing founder';
  });

  await check('Organization has address in Barcelona', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return (org && org.address && org.address.addressLocality === 'Barcelona')
      ? true : 'Missing Barcelona address';
  });

  await check('Organization has sameAs with LinkedIn', async () => {
    const org = blocks.find(b => b['@type'] === 'Organization');
    return (org && org.sameAs && org.sameAs.some(u => u.includes('linkedin.com')))
      ? true : 'Missing LinkedIn sameAs';
  });

  await check('Contains WebSite schema', async () => {
    const ws = blocks.find(b => b['@type'] === 'WebSite');
    return !!ws || 'No WebSite schema found';
  });

  await check('WebSite references Organization via publisher', async () => {
    const ws = blocks.find(b => b['@type'] === 'WebSite');
    return (ws && ws.publisher && ws.publisher['@id'])
      ? true : 'Missing publisher @id reference';
  });
}

// ─── Meta Tag Checks ───

async function checkMetaTags() {
  console.log('\n🔖 Meta & Link Tag Checks');
  const html = await fetchText('/');

  await check('Homepage has <link rel="canonical">', async () => {
    return html.includes('rel="canonical"') || 'Missing canonical link';
  });

  await check('Homepage has <meta name="robots">', async () => {
    return html.includes('name="robots"') || 'Missing robots meta';
  });

  await check('Homepage has Open Graph tags', async () => {
    return html.includes('og:title') || 'Missing OG tags';
  });

  await check('Homepage has meta description', async () => {
    return html.includes('name="description"') || 'Missing description';
  });
}

// ─── Cross-Reference Checks ───

async function checkCrossRefs() {
  console.log('\n🔗 Cross-Reference Checks');
  const llms = await fetchText('/llms.txt');
  const llmsFull = await fetchText('/llms-full.txt');

  await check('llms.txt links to llms-full.txt', async () => {
    return llms.includes('llms-full.txt') || 'No cross-reference to full version';
  });

  await check('llms-full.txt links to llms.txt', async () => {
    return llmsFull.includes('llms.txt') && llmsFull.includes('See also')
      || 'No cross-reference to short version';
  });

  await check('Both files have consistent org name', async () => {
    const name1 = llms.startsWith('# The Child Lens');
    const name2 = llmsFull.startsWith('# The Child Lens');
    return (name1 && name2) || 'Inconsistent titles';
  });

  await check('Both files have consistent contact email', async () => {
    const email1 = llms.includes('team@thechildlens.com');
    const email2 = llmsFull.includes('team@thechildlens.com');
    return (email1 && email2) || 'Inconsistent email';
  });
}

// ─── Run All ───

async function main() {
  console.log(`\n🔍 GEO/LLM QA Check — ${BASE}\n${'═'.repeat(50)}`);

  await checkEndpoints();
  await checkLlmsTxt();
  await checkLlmsFullTxt();
  await checkJsonLd();
  await checkMetaTags();
  await checkCrossRefs();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${PASS} Passed: ${passed}`);
  if (warnings > 0) console.log(`  ${WARN} Warnings: ${warnings}`);
  if (failed > 0) console.log(`  ${FAIL} Failed: ${failed}`);
  console.log(`  Total: ${passed + failed + warnings} checks\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(2);
});
