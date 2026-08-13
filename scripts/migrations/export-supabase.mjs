import { runInventoryCli } from './inventory.mjs';

runInventoryCli(['--dry-run', ...process.argv.slice(2)], { expectedSources: ['supabase'] });
