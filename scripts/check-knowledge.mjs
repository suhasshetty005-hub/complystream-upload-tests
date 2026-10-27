#!/usr/bin/env node
/**
 * Enforces C-LOC-4: every locator in pages/ must trace to a knowledge file.
 *
 *     npm run knowledge
 *
 * Two checks:
 *   1. no knowledge/**\/*.yaml uses a TAB (the one YAML error we can catch without a parser;
 *      C-AGENT-10 rules out adding a YAML dependency)
 *   2. every distinctive locator token in pages/*.ts appears somewhere in knowledge/
 *
 * Check 2 is deliberately crude: it looks for the token as text. It cannot tell you an entry is
 * GOOD, only that one exists. Judging quality is the Review agent's job. What it does catch is the
 * thing that actually happens: someone adds a locator while debugging and never records where it
 * came from.
 *
 * Exits 1 on any failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KNOWLEDGE = path.join(ROOT, 'knowledge');
const PAGES = path.join(ROOT, 'pages');

const TOKEN_PATTERNS = [
  /#([A-Za-z][\w-]{2,})/g,                                         // #file-upload
  /getByRole\(\s*'(\w+)'\s*,\s*\{\s*name:\s*'([^']+)'/g,           // role + literal name
  /getBy(?:Text|Label)\(\s*'([^']+)'/g,                            // literal text / label
];

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

const yamlFiles = walk(KNOWLEDGE, '.yaml');
const knowledge = yamlFiles.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');
let failures = 0;

console.log('knowledge files:');
for (const f of yamlFiles) console.log(`  ${path.relative(ROOT, f).replaceAll('\\', '/')}`);

console.log('\n1. YAML tabs');
for (const f of yamlFiles) {
  fs.readFileSync(f, 'utf-8').split(/\r?\n/).forEach((line, i) => {
    if (line.startsWith('\t')) {
      console.log(`  FAIL ${path.basename(f)}:${i + 1} uses a TAB`);
      failures++;
    }
  });
}
if (!failures) console.log('  OK');

console.log('\n2. locator traceability (C-LOC-4)');
const before = failures;
for (const f of walk(PAGES, '.ts')) {
  const src = fs.readFileSync(f, 'utf-8');
  for (const re of TOKEN_PATTERNS) {
    for (const m of src.matchAll(re)) {
      // the last captured group is the distinctive part (the id, the name, the text)
      const token = m[m.length - 1];
      if (!knowledge.includes(token)) {
        console.log(`  FAIL ${path.basename(f)}: "${token}" is not recorded in knowledge/`);
        failures++;
      }
    }
  }
}
if (failures === before) console.log('  OK');

process.exit(failures ? 1 : 0);
