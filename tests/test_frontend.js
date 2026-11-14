// Render-function regression checks with a minimal DOM; not browser end-to-end tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const fixtures = JSON.parse(execFileSync('python3', ['-c', `
import json,tempfile
from pathlib import Path
import server
with tempfile.TemporaryDirectory() as d:
 s=server.Store(Path(d)/'fixture.db')
 print(json.dumps({u['role']:s.visible(u) for u in s.raw()['users'] if u['id'] in ('u-tunc','u-murat','u-ahmet')}))
`], { cwd: root, encoding: 'utf8' }));
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', value: '', style: {},
    classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {},
    setAttribute() {}, getAttribute() { return ''; }, focus() {}, setSelectionRange() {} });
  return elements.get(id);
}
const context = { console, setTimeout, clearTimeout, Date, crypto: require('node:crypto').webcrypto,
  document: { getElementById: element, querySelectorAll: () => [], querySelector: () => element('query'),
    documentElement: {}, createElement: () => element('created') },
  localStorage: { getItem: () => null, setItem() {} },
  alert() {}, confirm: () => false, fetch: async () => { throw Error('Unexpected network call'); } };
context.window = context;
context.addEventListener = () => {};
vm.createContext(context);
const scriptFiles = [...fs.readFileSync(path.join(root, 'public/index.html'), 'utf8').matchAll(/<script src="\.\/(.*?)"><\/script>/g)].map(m => m[1]);
for (const file of scriptFiles) {
  let source = fs.readFileSync(path.join(root, 'public', file), 'utf8');
  if (file === 'app.js') source = source.replace(/bootApplication\(\)\.catch\([^\n]+\);/, '');
  vm.runInContext(source, context, { filename: file });
}
const views = {
  patron: ['genel','ekip','yonetisim','toplantilar','gorevler','performans','bilgi','ai','ayarlar'],
  mudur: ['genel','ekip','yonetisim','toplantilar','gorevler','performans','bilgi','ai'],
  calisan: ['genel','kartim','toplantilar','gorevler','performans','bilgi'],
};
let rendered = 0;
for (const role of Object.keys(views)) {
  for (const lang of ['tr', 'en']) {
    context.state = structuredClone(fixtures[role]); context.state.lang = lang;
    context.currentGovernanceUserId = null; context.currentTaskId = null;
    context.currentKpiId = null; context.currentGoalId = null; context.currentScorecardId = null;
    for (const tab of views[role]) {
      context.currentTab = tab;
      context.renderMain();
      assert.ok(element('main-content').innerHTML.length > 20, role + ':' + tab);
      rendered++;
    }
    if (role !== 'calisan') {
      context.currentTab = 'toplantilar';
      for (const view of ['schedule','templates','decisions','actionItems','history']) {
        context.currentMeetingsView = view; context.renderMain(); rendered++;
      }
      context.currentTab = 'ai';
      for (const view of ['live','insights','actions','assistant','brief']) {
        context.currentAiView = view; context.renderMain(); rendered++;
      }
      context.currentTab = 'performans';
      for (const view of (role === 'patron' ? ['overview','kpis','deptKpis','goals','scorecards','trends','reports'] : ['deptKpis','goals','scorecards','reports'])) {
        context.currentPerformanceView = view; context.renderMain(); rendered++;
      }
    }
    context.currentTab = 'bilgi';
    for (const view of ['documents','policies','handbook']) {
      context.currentKnowledgeView = view; context.renderMain(); rendered++;
    }
  }
}
context.state = structuredClone(fixtures.patron);
const before = structuredClone(context.state);
context.state.roleCards['u-ahmet'].decisionRights = '7%';
const operations = context.diffState(before, context.state);
assert.equal(operations.length, 1);
assert.equal(operations[0].collection, 'roleCards');
assert.equal(operations[0].id, 'u-ahmet');
context.state.lang = 'en';
assert.equal(context.diffState(before, { ...before, lang: 'en' }).length, 0);
assert.equal(context.escapeHtml('<img onerror="bad">'), '&lt;img onerror=&quot;bad&quot;&gt;');
const answer = context.advisorAnswerHtml({ answerText:'<img src=x>', sources:[], model:'test', askedAt:new Date().toISOString() });
assert.ok(answer.includes('&lt;img src=x&gt;'));
assert.ok(!answer.includes('<img'));
console.log(`PASS: ${rendered} scoped TR/EN render checks; record diff and AI escaping checks.`);
