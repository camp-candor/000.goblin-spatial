// scripts/setup-merge-shield.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log('>> [SHIELD] Starting Phase 2 Remote Topology Remapping & Merge Shield Setup...');

const cwd = process.cwd();
const rootPkg = path.join(cwd, 'package.json');
const gitAttrPath = path.join(cwd, '.gitattributes');

// 1. Root Verification
if (!fs.existsSync(rootPkg)) {
    console.error(':: [FAIL] Root package.json not found in current directory.');
    process.exit(1);
}

// 2. Validate .gitattributes Merge Shield Declarations
if (!fs.existsSync(gitAttrPath)) {
    console.error(':: [FAIL] Root .gitattributes missing. Cannot arm merge shield.');
    process.exit(1);
}

const gitAttrContent = fs.readFileSync(gitAttrPath, 'utf8');
const requiredRules = [
    '* text=auto eol=lf',
    'apps/worker/src/tools.custom.ts merge=ours',
    'apps/worker/wrangler.jsonc merge=ours',
    'wrangler.jsonc merge=ours',
    'README.md merge=ours',
    'AGENTS.md merge=ours'
];

for (const rule of requiredRules) {
    if (!gitAttrContent.includes(rule)) {
        console.error(`:: [FAIL] .gitattributes missing required rule: ${rule}`);
        process.exit(1);
    }
}
console.log('>> [OK] Root .gitattributes rules verified.');

// 3. Arm the Git Native 'ours' Merge Driver
try {
    execSync('git config merge.ours.driver true', { stdio: 'pipe' });
    const configuredDriver = execSync('git config merge.ours.driver', { encoding: 'utf8' }).trim();
    if (configuredDriver !== 'true') {
        console.error(':: [FAIL] git config merge.ours.driver evaluation failed.');
        process.exit(1);
    }
    console.log('>> [OK] Git "ours" merge driver armed locally (merge.ours.driver = true).');
} catch (err) {
    console.error(':: [FAIL] Failed to configure git merge driver:', err.message);
    process.exit(1);
}

// 3b. Arm Git Hooks (.husky/_)
try {
    execSync('git config core.hooksPath .husky/_', { stdio: 'pipe' });
    console.log('>> [OK] Git hooks path armed locally (core.hooksPath = .husky/_).');
} catch (err) {
    console.error(':: [FAIL] Failed to configure core.hooksPath:', err.message);
    process.exit(1);
}

// 4. Remote Topology Audit and Remapping
let remotes = '';
try {
    remotes = execSync('git remote -v', { encoding: 'utf8' }).trim();
} catch (err) {
    console.error(':: [FAIL] Unable to query git remotes:', err.message);
    process.exit(1);
}

const remoteLines = remotes.split('\n').filter(Boolean);
const remoteMap = new Map();
for (const line of remoteLines) {
    const [name, url] = line.split(/\s+/);
    if (name && url && !remoteMap.has(name)) {
        remoteMap.set(name, url);
    }
}

const originUrl = remoteMap.get('origin');
const upstreamUrl = remoteMap.get('upstream');

// If origin points to upstream template and upstream remote does not exist yet:
if (originUrl && originUrl.includes('camp-candor/npm-agent-01') && !upstreamUrl) {
    console.log('>> [REMAP] Preserving upstream archetype lineage: renaming "origin" to "upstream"...');
    try {
        execSync('git remote rename origin upstream', { stdio: 'pipe' });
        console.log('>> [OK] Renamed origin -> upstream (pointing to ' + originUrl + ').');
    } catch (err) {
        console.error(':: [FAIL] Failed to rename remote origin to upstream:', err.message);
        process.exit(1);
    }
} else if (upstreamUrl) {
    console.log('>> [OK] "upstream" remote already configured:', upstreamUrl);
} else {
    console.log('>> [INFO] "origin" is not pointing to camp-candor/npm-agent-01; skipping automatic rename.');
}

// Allow passing new downstream origin via CLI argument: node scripts/setup-merge-shield.mjs <new-origin-url>
const targetOriginUrl = process.argv[2];
if (targetOriginUrl) {
    try {
        const currentRemotes = execSync('git remote', { encoding: 'utf8' }).trim().split('\n');
        if (currentRemotes.includes('origin')) {
            execSync(`git remote set-url origin ${targetOriginUrl}`, { stdio: 'pipe' });
            console.log('>> [OK] Updated "origin" URL to:', targetOriginUrl);
        } else {
            execSync(`git remote add origin ${targetOriginUrl}`, { stdio: 'pipe' });
            console.log('>> [OK] Added "origin" pointing to:', targetOriginUrl);
        }
    } catch (err) {
        console.error(':: [FAIL] Failed to configure new origin remote:', err.message);
        process.exit(1);
    }
}

// 5. Assert Boundary Cleanliness in apps/995.library/995.library/
const harnessDiff = execSync('git status -s apps/995.library/995.library/', { encoding: 'utf8' }).trim();
if (harnessDiff.length > 0) {
    console.error(':: [FAIL] Harness boundary breach detected in apps/995.library/995.library/:');
    console.error(harnessDiff);
    process.exit(1);
}
console.log('>> [OK] Immutable harness boundary held firm.');

console.log('>> [OK] Phase 2 Remote Topology Remapping & Merge Shield complete.');
process.exit(0);
