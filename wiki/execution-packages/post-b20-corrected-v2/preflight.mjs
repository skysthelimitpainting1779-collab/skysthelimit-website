#!/usr/bin/env node
// Pre-flight validation for Post-B20 execution sessions.
// Run from the integration worktree BEFORE opening any agent session.
// Exits non-zero if any check fails.
// Usage: node preflight.mjs [--fix]

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const CWD = process.cwd();
const FIX = process.argv.includes('--fix');
const B20 = 'b1db201644335acf95a263810bd38e15fbd512f1';
const AUDITED = 'c7e94605eefdace7a76ce5145808478df8503dbb';
const BRANCH = 'agent/skys-limit-convex-os';
const MAIN_WT = 'C:/Users/Johnny Cage/DEV/skysthelimit-collab';
let fail = 0, warn = 0;

function chk(n, ok, d) { console.log('  [' + (ok?'PASS':'FAIL') + '] ' + n + (d ? ': ' + d : '')); if(!ok) fail++; }
function wrn(n, d) { console.log('  [WARN] ' + n + (d ? ': ' + d : '')); warn++; }
function git() { var a = Array.from(arguments); try { return execFileSync('git', a, {cwd:CWD, encoding:'utf8', stdio:['pipe','pipe','pipe']}).trim(); } catch(e) { return null; } }

console.log('\n=== Post-B20 Pre-Flight ===\n');
console.log('  cwd: ' + CWD + '\n');

console.log('1. Branch/Worktree');
var br = git('branch','--show-current');
chk('On integration branch', br===BRANCH, 'current: ' + br);
var isMain = CWD.replace(/\\/g,'/').includes('skysthelimit-collab') && !CWD.replace(/\\/g,'/').includes('skys-limit-worktrees');
chk('Not in main worktree', !isMain);
var st = git('status','--short');
chk('Working tree clean', !st||st.length===0);

console.log('\n2. Checkpoint');
chk('B20 is ancestor', git('merge-base','--is-ancestor',B20,'HEAD')!==null);
var head = git('rev-parse','HEAD');
chk('HEAD resolved', !!head, head ? head.slice(0,8) : 'FAIL');

console.log('\n3. Main Divergence');
git('fetch','origin');
var aud = git('merge-base','--is-ancestor',AUDITED,'origin/main');
if(aud!==null){ chk('Audited commit ancestor of origin/main', true); var rc=git('rev-list','--count', AUDITED + '..origin/main'); if(rc&&parseInt(rc)>10) wrn('Divergence', rc + ' commits'); }
else chk('Audited commit ancestor of origin/main', false, 'REVALIDATION REQUIRED');

console.log('\n4. Graph');
var gj = join(CWD,'.graph','graph.json');
if(!existsSync(gj)){ chk('.graph/graph.json', false); if(FIX){ var s=join(MAIN_WT,'.tmp-analysis','post-b20','skys-limit-post-b20-design-governed-execute','compiled','.graph'); if(existsSync(s)){mkdirSync(join(CWD,'.graph'),{recursive:true});cpSync(s,join(CWD,'.graph'),{recursive:true});console.log('  [FIXED] copied');}}}
else chk('.graph/graph.json', true);

console.log('\n5. Toolchain');
var nv=null; try{nv=execFileSync('node',['--version'],{encoding:'utf8'}).trim();}catch(e){}
chk('Node.js available', !!nv, nv);
chk('Node >= 18', nv ? parseInt(nv.slice(1))>=18 : false);
chk('package.json', existsSync(join(CWD,'package.json')));
chk('node_modules', existsSync(join(CWD,'node_modules')));

console.log('\n=== Result: ' + fail + ' failures, ' + warn + ' warnings ===\n');
if(fail>0){console.log('  BLOCKED\n');process.exit(1);}
else{console.log('  READY\n');process.exit(0);}
