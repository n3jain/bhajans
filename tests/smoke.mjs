import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

for (const id of ['home','reader','admin','list','empty','back','dev','eng','copyLink','editBhajan','save']) {
  assert(new RegExp(`id=["']${id}["']`).test(html), `missing #${id}`);
}

assert(html.includes('client.from("bhajans").select'), 'published bhajan query path missing');
assert(html.includes('function openB('), 'openB missing');
assert(html.includes('function fillEditor('), 'owner edit helper missing');
assert(html.includes('update(row).eq("id",editingId)'), 'edit path must update existing row');
assert(html.includes('location.hash=id?"/bhajan/"'), 'per-song hash routing missing');
assert(html.includes('function idFromHash('), 'direct-link parser missing');
assert(html.includes('load();authUI();'), 'app bootstrap missing');

const badEscapes = [
  /<\/script>\\n<script/,
  /<\/button>\\n\s*<button/,
  /};\\n\$\(/,
];
for (const rx of badEscapes) assert(!rx.test(html), `literal \\n artifact matched ${rx}`);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
assert(inlineScripts.length > 0, 'no inline app script found');
for (const [i, src] of inlineScripts.entries()) {
  try { new vm.Script(src, { filename: `inline-${i}.js` }); }
  catch (e) { failures.push(`inline script ${i} syntax error: ${e.message}`); }
}

if (failures.length) {
  console.error('Smoke tests failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Smoke tests passed');
