// Server is the source of truth; localStorage holds language and a legacy backup only.
var STORAGE_KEY = 'veliaht_yonetim_state_v1';
var persistedSnapshot = null, saveQueue = Promise.resolve(), pendingSaves = 0;
var saveGeneration = 0, lastSaveError = null;
var stateArrays = ['users', 'departments', 'tasks', 'meetingTemplates', 'meetingOccurrences',
  'meetingDecisions', 'kpiDefinitions', 'kpiValues', 'kpiAlerts', 'goals', 'scorecards',
  'documents', 'policies', 'handbookSections', 'meetingSummaries', 'healthBriefs'];
function cloneValue(value) { return JSON.parse(JSON.stringify(value)); }
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
async function apiRequest(path, body) {
  var response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body) });
  var data;
  try { data = await response.json(); } catch (_) { throw new Error('Backend unavailable. Open the app through the Python server, not GitHub Pages.'); }
  if (!response.ok) { var error = new Error(data.error || 'Request failed.'); error.status = response.status; throw error; }
  return data;
}
function backendNotice(message, failure) {
  var el = document.getElementById('backend-status');
  if (el) { el.textContent = message; el.className = 'backend-status' + (failure ? ' backend-error' : ''); }
}
function adoptServerState(data) {
  var lang = state.lang; state = data; state.lang = lang || 'tr'; persistedSnapshot = cloneValue(state);
}
function recordMap(data, collection) {
  if (collection === 'roleCards') return data.roleCards || {};
  if (collection === 'company' || collection === 'aiSettings') return { singleton: data[collection] };
  var rows = {};
  if (collection === 'dismissedInsightIds') { (data[collection] || []).forEach(function (id) { rows[id] = true; }); return rows; }
  (data[collection] || []).forEach(function (row) {
    var value = cloneValue(row);
    if (collection === 'users') { delete value.password; delete value.passwordHash; delete value.password_hash; }
    rows[row.id] = value;
  }); return rows;
}
function diffState(before, after) {
  var operations = [];
  stateArrays.concat(['roleCards', 'company', 'aiSettings', 'dismissedInsightIds']).forEach(function (collection) {
    var oldRows = recordMap(before, collection), newRows = recordMap(after, collection);
    new Set(Object.keys(oldRows).concat(Object.keys(newRows))).forEach(function (id) {
      var oldValue = oldRows[id] === undefined ? null : oldRows[id];
      var newValue = newRows[id] === undefined ? null : newRows[id];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) operations.push({ collection: collection, id: id, before: oldValue, value: newValue });
    });
  }); return operations;
}
function persistState() {
  try { localStorage.setItem('veliaht_lang', state.lang); } catch (_) {}
  if (!persistedSnapshot || !state.currentUserId) return Promise.resolve();
  var next = cloneValue(state), operations = diffState(persistedSnapshot, next);
  if (!operations.length) return saveQueue;
  persistedSnapshot = next;
  var generation = saveGeneration;
  pendingSaves++;
  backendNotice(state.lang === 'tr' ? 'Kaydediliyor…' : 'Saving…');
  saveQueue = saveQueue.then(async function () {
    if (generation !== saveGeneration) return;
    await apiRequest('/api/changes', { operations: operations }); lastSaveError = null;
  }).catch(async function (error) {
    lastSaveError = error.message; saveGeneration++;
    try { adoptServerState(await apiRequest('/api/state')); if (state.currentUserId) window.renderShell(); } catch (_) {}
    backendNotice('Save failed: ' + error.message + ' Unsaved changes were reloaded from the server.', true);
  }).finally(function () {
    pendingSaves--;
    if (!pendingSaves && !lastSaveError) backendNotice(state.lang === 'tr' ? 'SQLite · Kaydedildi' : 'SQLite · Saved');
  }); return saveQueue;
}
async function loadState() {
  try {
    var old = localStorage.getItem(STORAGE_KEY);
    if (old && !localStorage.getItem('veliaht_legacy_backup')) localStorage.setItem('veliaht_legacy_backup', old);
    state.lang = localStorage.getItem('veliaht_lang') || state.lang;
  } catch (_) {}
  try { adoptServerState(await apiRequest('/api/state')); backendNotice('SQLite · Connected'); return true; }
  catch (error) {
    if (error.status === 401) { backendNotice('SQLite · Select a demo account'); return false; }
    backendNotice(error.message, true); return false;
  }
}
async function resetAllData() {
  alert(state.lang === 'tr' ? 'Kalıcı şirket kayıtları bu düğmeyle silinmez. Demo hesabını değiştirmek için çıkış yapabilirsiniz.'
    : 'Persistent company records cannot be deleted with this button. Sign out to change demo accounts.');
}
window.addEventListener('beforeunload', function (event) {
  if (pendingSaves > 0) { event.preventDefault(); event.returnValue = ''; }
});
