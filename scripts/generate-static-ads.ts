/**
 * Deskwork Tools - Build-Time Static Ads Manifest Generator
 *
 * Compiles the current ad configuration into a strictly sanitized,
 * public read-only JSON file at data/ads-active.json.
 *
 * Security & Privacy Enforcements:
 * - NO private notes or internal admin fields.
 * - NO disabled slots or disabled provider credentials.
 * - NO server-side environment variables or secrets.
 * - If global ads are disabled, placements array is strictly empty.
 *
 * Usage:
 *   npx tsx scripts/generate-static-ads.ts
 */

import fs from 'fs';
import path from 'path';
import { AdConfigRepository } from '../server/data/repository.js';

async function generateStaticAds() {
  console.log('[Build Step] Generating static public ad manifest (data/ads-active.json)...');
  
  const adRepo = new AdConfigRepository();
  const publicData = await adRepo.getPublicActive();

  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'ads-active.json');
  fs.writeFileSync(outputPath, JSON.stringify(publicData, null, 2), 'utf-8');

  console.log(`[Build Step] Successfully generated ${outputPath}`);
  console.log(`  - Global Ads Enabled: ${publicData.globalEnabled}`);
  console.log(`  - Active Public Slots: ${publicData.placements.length}`);
}

generateStaticAds().catch((err) => {
  console.error('[Build Step] Failed to generate static ads manifest:', err);
  process.exit(1);
});
