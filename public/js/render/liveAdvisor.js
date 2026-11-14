// Free-form model-backed assistant. Older quick checks remain explicitly rule based.
var liveAdvisorQuestion = '', liveAdvisorResult = null, liveAdvisorError = '', liveAdvisorBusy = false;
function advisorExamples() {
  return state.lang === 'tr' ? ['Ahmet %12 indirim verebilir mi? Kimden onay almalı?', 'Satış departmanında hangi işler gecikmiş?', 'Hangi konularda görev kartı ile şirket politikası çelişiyor?']
    : ['Can Ahmet offer a 12% discount? Whose approval is needed?', 'Which sales tasks are overdue?', 'Do any role cards conflict with company policy?'];
}
function renderLiveAdvisor(user) {
  var tr = state.lang === 'tr', enabled = state.aiSettings.featuresEnabled.executiveAssistant;
  var html = aiSubnav() + `<div class="page-title">${tr ? 'Şirket Asistanı' : 'Company Assistant'}</div>
    <div class="page-sub">${tr ? 'Şirket kayıtlarına dayanan, kaynaklı cevaplar. Son karar sizde.' : 'Answers grounded in company records. You remain the decision maker.'}</div>`;
  if (!enabled) {
    document.getElementById('main-content').innerHTML = html + `<div class="empty-state">${t('notice_ai_feature_disabled')}</div>`; return;
  }
  html += `<div class="card advisor-composer"><label class="field-label" for="advisor-question">${tr ? 'Şirketiniz hakkında sorun' : 'Ask about your company'}</label>
    <textarea id="advisor-question" class="text-input" rows="3" maxlength="2000" oninput="liveAdvisorQuestion=this.value" placeholder="${escapeHtml(advisorExamples()[0])}" ${liveAdvisorBusy ? 'disabled' : ''}>${escapeHtml(liveAdvisorQuestion)}</textarea>
    <div class="advisor-examples">${advisorExamples().map(function (example, index) {
      return `<button class="btn-sm" onclick="chooseAdvisorExample(${index})" ${liveAdvisorBusy ? 'disabled' : ''}>${escapeHtml(example)}</button>`;
    }).join('')}</div>
    <button class="btn-gold" onclick="askLiveAdvisor()" ${liveAdvisorBusy ? 'disabled' : ''}>${liveAdvisorBusy ? (tr ? 'Kayıtlar inceleniyor…' : 'Reading company records…') : (tr ? 'AI’a sor' : 'Ask AI')}</button>
    <div class="dim-text" style="margin-top:8px">${tr ? 'AI yanıtını kaynaklarla kontrol edin. Asistan kayıtları değiştiremez.' : 'Verify AI answers against sources. The assistant cannot change records.'}</div></div>`;
  if (liveAdvisorError) html += `<div class="notice notice-red" role="alert"><div>${escapeHtml(liveAdvisorError)}</div></div>`;
  if (liveAdvisorResult) html += advisorAnswerHtml(liveAdvisorResult);
  var history = state.assistantQueries.filter(function (q) { return q.askedBy === user.id; }).slice().reverse().slice(0, 6);
  if (history.length) html += `<div class="section-head"><h2>${t('section_assistant_history')}</h2></div>`;
  history.forEach(function (query) {
    html += `<div class="card"><div class="p-name">${escapeHtml(query.questionText)}</div>
      <div class="advisor-answer">${escapeHtml(query.answerText)}</div><div class="dim-text">${escapeHtml(query.model || 'Rule based')} · ${escapeHtml(formatDateTime(query.askedAt))}</div></div>`;
  });
  document.getElementById('main-content').innerHTML = html;
}
function advisorAnswerHtml(result) {
  var tr = state.lang === 'tr';
  var html = `<div class="card advisor-result"><div class="p-name">${tr ? 'Kaynaklı yanıt' : 'Source-backed answer'}</div>
    <div class="advisor-answer">${escapeHtml(result.answerText)}</div>`;
  ['conflicts', 'missingInformation'].forEach(function (key) {
    if ((result[key] || []).length) html += `<div class="notice notice-amber"><div><strong>${key === 'conflicts' ? (tr ? 'Çelişkiler' : 'Conflicts') : (tr ? 'Eksik bilgi' : 'Missing information')}</strong><br>${result[key].map(escapeHtml).join('<br>')}</div></div>`;
  });
  html += `<div class="section-head"><h2>${tr ? 'Kullanılan kaynaklar' : 'Sources used'}</h2></div><div class="advisor-sources">`;
  result.sources.forEach(function (source, index) {
    html += `<button class="source-card" onclick="showAdvisorSource(${index})"><span class="tag tag-gray">${escapeHtml(source.collection)}</span>
      <strong>${escapeHtml(source.title)}</strong><span>${tr ? 'Kaydı incele →' : 'Inspect record →'}</span></button>`;
  });
  return html + `</div><div class="dim-text" style="margin-top:12px">${escapeHtml(result.model)} · ${escapeHtml(formatDateTime(result.askedAt))}</div></div>`;
}
function chooseAdvisorExample(index) {
  liveAdvisorQuestion = advisorExamples()[index]; document.getElementById('advisor-question').value = liveAdvisorQuestion;
}
async function askLiveAdvisor() {
  if (liveAdvisorBusy) return;
  var input = document.getElementById('advisor-question');
  liveAdvisorQuestion = input ? input.value.trim() : liveAdvisorQuestion;
  if (liveAdvisorQuestion.length < 3) return;
  liveAdvisorBusy = true; liveAdvisorError = ''; liveAdvisorResult = null;
  var requestedUser = state.currentUserId;
  renderMain();
  try {
    await saveQueue;
    if (lastSaveError) throw new Error('Save failed. Reload and save the company record before asking AI.');
    var result = await apiRequest('/api/advisor/ask', { question: liveAdvisorQuestion, lang: state.lang });
    if (state.currentUserId !== requestedUser) return;
    liveAdvisorResult = result; state.assistantQueries.push(result);
  } catch (error) { if (state.currentUserId === requestedUser) liveAdvisorError = error.message; }
  finally { liveAdvisorBusy = false; if (state.currentUserId === requestedUser && currentTab === 'ai') renderMain(); }
}
function showAdvisorSource(index) {
  var source = liveAdvisorResult && liveAdvisorResult.sources[index]; if (!source) return;
  var tr = state.lang === 'tr';
  showModal(`<button class="modal-close" onclick="closeModal()">&times;</button><h3>${escapeHtml(source.title)}</h3>
    <div class="dim-text">${tr ? 'Yanıt oluşturulurken kullanılan kayıt' : 'Record snapshot used when answering'} · ${escapeHtml(source.id)}</div>
    <pre class="source-content">${escapeHtml(source.content)}</pre>
    <button class="btn-gold" onclick="openAdvisorSourceRecord(${index})">${tr ? 'Güncel kaydı aç' : 'Open current record'}</button>`);
}
function openAdvisorSourceRecord(index) {
  var source = liveAdvisorResult && liveAdvisorResult.sources[index]; if (!source) return;
  closeModal(); var key = source.recordId;
  if (source.collection === 'roleCards') { switchTab('yonetisim'); openGovernanceDetail(key); }
  else if (source.collection === 'policies') { switchTab('bilgi'); switchKnowledgeView('policies'); openPolicyDetail(key); }
  else if (source.collection === 'documents') { switchTab('bilgi'); switchKnowledgeView('documents'); openDocumentDetail(key); }
  else if (source.collection === 'tasks') { switchTab('gorevler'); openTaskDetail(key); }
  else if (source.collection === 'kpiDefinitions') { switchTab('performans'); openKpiDetail(key); }
  else if (source.collection === 'goals') { switchTab('performans'); openGoalDetail(key); }
  else if (source.collection === 'meetingDecisions') { switchTab('toplantilar'); switchMeetingsView('decisions'); }
  else if (source.collection === 'users' || source.collection === 'departments') { switchTab('ekip'); }
  else { switchTab('bilgi'); switchKnowledgeView('handbook'); }
}
