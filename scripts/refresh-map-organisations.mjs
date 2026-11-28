import { writeFileSync } from 'node:fs';
import model from '../map/organisation-model.js';

const organisations = await model.readPublicOrganisations({ timeout: 20_000 });
organisations.sort((a, b) => a.id.localeCompare(b.id, 'en'));
const snapshot = new URL('../map/data/organisations.json', import.meta.url);
writeFileSync(snapshot, JSON.stringify(organisations, null, 2) + '\n');
console.log(`Refreshed the public map snapshot with ${organisations.length} organisations.`);
