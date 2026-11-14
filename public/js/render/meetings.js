var MEETING_CATEGORIES = ["board", "weekly_review", "daily_standup", "one_on_one", "performance_review", "family_council", "ad_hoc"];

// Which sub-screen of the Meetings tab is active, and which occurrence (if any) is drilled into.
var currentMeetingsView = "schedule";
var currentOccurrenceId = null;

// ─── Entry point + sub-navigation ─────────────────────────────────────────────

function renderMeetings() {
  var user = getCurrentUser();
  if (user.role === "calisan" && ["templates", "decisions", "history"].includes(currentMeetingsView)) {
    currentMeetingsView = "schedule";
  }
  if (currentOccurrenceId) { renderMeetingDetail(currentOccurrenceId); return; }
  if (currentMeetingsView === "templates") { renderMeetingTemplates(); return; }
  if (currentMeetingsView === "decisions") { renderDecisionsLog(); return; }
  if (currentMeetingsView === "actionItems") { renderMeetingActionItems(); return; }
  if (currentMeetingsView === "history") { renderMeetingHistory(); return; }
  renderMeetingsSchedule();
}

function switchMeetingsView(view) {
  currentMeetingsView = view;
  currentOccurrenceId = null;
  window.renderMain();
}

function meetingsSubnav(user) {
  var tabs = [["schedule", t("mtab_schedule")]];
  if (user.role !== "calisan") tabs.push(["templates", t("mtab_templates")]);
  if (user.role !== "calisan") tabs.push(["decisions", t("mtab_decisions")]);
  tabs.push(["actionItems", t("mtab_action_items")]);
  if (user.role !== "calisan") tabs.push(["history", t("mtab_history")]);
  var buttons = tabs.map(function (entry) {
    return `<button class="subtab ${entry[0] === currentMeetingsView ? "active" : ""}" onclick="switchMeetingsView('${entry[0]}')">${entry[1]}</button>`;
  }).join("");
  return `<div class="subtab-bar">${buttons}</div>`;
}

// ─── Role-scoping + label helpers ──────────────────────────────────────────────

function canManageOccurrence(user, o) {
  if (user.role === "patron") return true;
  if (user.role !== "mudur") return false;
  if (o.ownerId === user.id) return true;
  if (o.departmentId === user.departmentId) return true;
  return o.participantIds.some(function (id) {
    var p = state.users.find(function (u) { return u.id === id; });
    return p && p.departmentId === user.departmentId;
  });
}

function visibleOccurrences(user) {
  if (user.role === "patron") return state.meetingOccurrences;
  if (user.role === "calisan") {
    return state.meetingOccurrences.filter(function (o) { return o.participantIds.includes(user.id); });
  }
  return state.meetingOccurrences.filter(function (o) { return canManageOccurrence(user, o); });
}

function participantNames(ids) {
  return ids.map(function (id) {
    var p = state.users.find(function (u) { return u.id === id; });
    return p ? p.name : null;
  }).filter(Boolean);
}

function occStatusLabel(status) { return t("occ_status_" + status); }

function occStatusTagClass(status) {
  return status === "completed" ? "tag-green" : status === "cancelled" ? "tag-red" : "tag-amber";
}

function categoryLabel(cat) { return t("mcat_" + cat); }

function categoryTagClass(cat) {
  return (cat === "board" || cat === "family_council") ? "tag-navy" : "tag-gray";
}

function sortByDueAt(items) {
  return items.slice().sort(function (a, b) {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return a.dueAt.localeCompare(b.dueAt);
  });
}

// ─── Shared form-option builders ───────────────────────────────────────────────

function departmentSelectOptions(selectedId) {
  var opts = `<option value="">${t("option_unassigned")}</option>`;
  state.departments.forEach(function (d) {
    opts += `<option value="${d.id}" ${selectedId === d.id ? "selected" : ""}>${loc(d.name)}</option>`;
  });
  return opts;
}

function ownerSelectOptions(selectedId) {
  var opts = `<option value="">${t("option_unassigned")}</option>`;
  state.users.forEach(function (u) {
    opts += `<option value="${u.id}" ${selectedId === u.id ? "selected" : ""}>${u.name}</option>`;
  });
  return opts;
}

function categorySelectOptions(selectedCat) {
  return MEETING_CATEGORIES.map(function (c) {
    return `<option value="${c}" ${selectedCat === c ? "selected" : ""}>${categoryLabel(c)}</option>`;
  }).join("");
}

function templateSelectOptions(selectedId) {
  var opts = `<option value="">${t("option_unassigned")}</option>`;
  state.meetingTemplates.forEach(function (m) {
    opts += `<option value="${m.id}" ${selectedId === m.id ? "selected" : ""}>${loc(m.name)}</option>`;
  });
  return opts;
}

function participantChipsHtml(selectedIds) {
  return state.users.map(function (u) {
    return `<span class="chip-option ${selectedIds.includes(u.id) ? "selected" : ""}" data-uid="${u.id}" onclick="this.classList.toggle('selected')">${u.name}</span>`;
  }).join("");
}

function selectedChipIds(containerId) {
  return Array.from(document.querySelectorAll("#" + containerId + " .chip-option.selected")).map(function (c) { return c.dataset.uid; });
}

function participantOwnerOptions(ids) {
  var opts = `<option value="">${t("option_unassigned")}</option>`;
  ids.forEach(function (id) {
    var u = state.users.find(function (x) { return x.id === id; });
    if (u) opts += `<option value="${u.id}">${u.name}</option>`;
  });
  return opts;
}

// ─── Schedule ───────────────────────────────────────────────────────────────────

function renderMeetingsSchedule() {
  var user = getCurrentUser();
  var occs = visibleOccurrences(user).slice().sort(function (a, b) { return a.scheduledAt.localeCompare(b.scheduledAt); });

  var html = meetingsSubnav(user) + `
    <div class="page-title">${user.role === "calisan" ? t("page_title_my_meetings") : t("page_title_schedule")}</div>
    <div class="page-sub">${user.role === "calisan" ? t("page_sub_my_meetings") : t("page_sub_schedule")}</div>`;
  if (user.role !== "calisan") html += `<div class="section-head"><h2>${t("mtab_schedule")}</h2><button class="btn-gold" onclick="openMeetingSetupModal()">${t("btn_new_meeting")}</button></div>`;
  if (occs.length === 0) html += `<div class="empty-state">${t("empty_no_occurrences")}</div>`;

  occs.forEach(function (o) {
    var dept = state.departments.find(function (d) { return d.id === o.departmentId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${o.title}</div>
        <div class="p-title">${categoryLabel(o.category)} · ${formatDateTime(o.scheduledAt)}${dept ? " · " + loc(dept.name) : ""}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${occStatusTagClass(o.status)}">${occStatusLabel(o.status)}</span>
        <button class="btn-sm" onclick="openMeetingDetail('${o.id}')">${t("btn_open_meeting")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Meeting Setup (create/edit an occurrence) ─────────────────────────────────

function openMeetingSetupModal(occurrenceId) {
  var o = occurrenceId ? state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; }) : null;
  var chips = participantChipsHtml(o ? o.participantIds : []);
  var when = o ? o.scheduledAt.slice(0, 16) : "";
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${o ? t("modal_edit_meeting_occurrence") : t("modal_new_meeting_occurrence")}</h3>
    <div class="form-row"><label>${t("label_occurrence_title")}</label><input class="text-input" id="f-mo-title" value="${o ? o.title : ""}"></div>
    <div class="form-row"><label>${t("label_template_optional")}</label><select class="text-input" id="f-mo-template" onchange="prefillFromTemplate(this.value)">${templateSelectOptions(o ? o.templateId : null)}</select></div>
    <div class="form-row"><label>${t("label_category")}</label><select class="text-input" id="f-mo-category">${categorySelectOptions(o ? o.category : "ad_hoc")}</select></div>
    <div class="form-row"><label>${t("label_department_optional")}</label><select class="text-input" id="f-mo-dept">${departmentSelectOptions(o ? o.departmentId : null)}</select></div>
    <div class="form-row"><label>${t("label_scheduled_at")}</label><input class="text-input" id="f-mo-when" type="datetime-local" value="${when}"></div>
    <div class="form-row"><label>${t("label_owner")}</label><select class="text-input" id="f-mo-owner">${ownerSelectOptions(o ? o.ownerId : null)}</select></div>
    <div class="form-row"><label>${t("label_participants")}</label><div class="chip-list" id="f-mo-participants">${chips}</div></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveMeetingOccurrence(${o ? `'${o.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function prefillFromTemplate(templateId) {
  var tmpl = state.meetingTemplates.find(function (m) { return m.id === templateId; });
  if (!tmpl) return;
  var titleInput = document.getElementById("f-mo-title");
  if (titleInput && !titleInput.value.trim()) titleInput.value = loc(tmpl.name);
  document.getElementById("f-mo-category").value = tmpl.category;
  document.getElementById("f-mo-dept").value = tmpl.departmentId || "";
  document.querySelectorAll("#f-mo-participants .chip-option").forEach(function (c) {
    c.classList.toggle("selected", tmpl.participantIds.includes(c.dataset.uid));
  });
}

function saveMeetingOccurrence(occurrenceId) {
  var title = document.getElementById("f-mo-title").value.trim();
  var templateId = document.getElementById("f-mo-template").value || null;
  var category = document.getElementById("f-mo-category").value;
  var departmentId = document.getElementById("f-mo-dept").value || null;
  var scheduledAt = document.getElementById("f-mo-when").value;
  var ownerId = document.getElementById("f-mo-owner").value || null;
  var participantIds = selectedChipIds("f-mo-participants");
  if (!title || !scheduledAt) return;
  if (occurrenceId) {
    var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
    Object.assign(o, { title: title, templateId: templateId, category: category, departmentId: departmentId, scheduledAt: scheduledAt, ownerId: ownerId, participantIds: participantIds });
  } else {
    state.meetingOccurrences.push({
      id: genId("mo"), title: title, templateId: templateId, category: category, departmentId: departmentId,
      scheduledAt: scheduledAt, ownerId: ownerId, participantIds: participantIds, status: "scheduled",
      agendaItems: [], notes: "", createdBy: getCurrentUser().id,
    });
  }
  closeModal();
  persistState();
  window.renderMain();
}

function deleteMeetingOccurrence(occurrenceId) {
  if (!confirm(t("confirm_delete_meeting"))) return;
  state.meetingOccurrences = state.meetingOccurrences.filter(function (o) { return o.id !== occurrenceId; });
  state.meetingDecisions = state.meetingDecisions.filter(function (d) { return d.occurrenceId !== occurrenceId; });
  state.tasks = state.tasks.filter(function (task) { return !(task.source === "meeting" && task.sourceId === occurrenceId); });
  currentOccurrenceId = null;
  persistState();
  window.renderMain();
}

// ─── Meeting Templates ──────────────────────────────────────────────────────────

function renderMeetingTemplates() {
  var user = getCurrentUser();
  var canEdit = user.role !== "calisan";
  var visible = user.role === "calisan"
    ? state.meetingTemplates.filter(function (m) { return m.participantIds.includes(user.id); })
    : state.meetingTemplates;

  var html = meetingsSubnav(user) + `
    <div class="page-title">${t("page_title_meetings_mgmt")}</div>
    <div class="page-sub">${t("page_sub_meetings_mgmt")}</div>`;
  if (canEdit) html += `<div class="section-head"><h2>${t("section_meeting_types")}</h2><button class="btn-gold" onclick="openTemplateModal()">${t("btn_add_meeting")}</button></div>`;
  if (visible.length === 0) html += `<div class="empty-state">${t("empty_no_meeting")}</div>`;

  visible.forEach(function (m) {
    var names = participantNames(m.participantIds);
    var dept = state.departments.find(function (d) { return d.id === m.departmentId; });
    html += `<div class="card">
      <div class="card-row">
        <div><div class="p-name">${loc(m.name)}</div><div class="p-title">${loc(m.freq)} · ${loc(m.duration)}</div></div>
        ${canEdit ? `<div class="row-actions"><button onclick="openTemplateModal('${m.id}')">${t("btn_edit")}</button><button onclick="deleteTemplate('${m.id}')">${t("btn_delete")}</button></div>` : ""}
      </div>
      <div style="margin-top:8px">
        <span class="tag ${categoryTagClass(m.category)}" style="margin-right:5px">${categoryLabel(m.category)}</span>
        ${dept ? `<span class="tag tag-gray" style="margin-right:5px">${loc(dept.name)}</span>` : ""}
        ${names.map(function (n) { return `<span class="tag tag-gray" style="margin-right:5px">${n}</span>`; }).join("")}
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openTemplateModal(templateId) {
  var m = templateId ? state.meetingTemplates.find(function (x) { return x.id === templateId; }) : null;
  var chips = participantChipsHtml(m ? m.participantIds : []);
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${m ? t("modal_edit_meeting") : t("modal_new_meeting")}</h3>
    <div class="form-row"><label>${t("label_meeting_name")}</label><input class="text-input" id="f-mt-name" value="${m ? loc(m.name) : ""}"></div>
    <div class="form-row"><label>${t("label_category")}</label><select class="text-input" id="f-mt-category">${categorySelectOptions(m ? m.category : "ad_hoc")}</select></div>
    <div class="form-row"><label>${t("label_department_optional")}</label><select class="text-input" id="f-mt-dept">${departmentSelectOptions(m ? m.departmentId : null)}</select></div>
    <div class="form-row"><label>${t("label_frequency")}</label><input class="text-input" id="f-mt-freq" placeholder="${t("placeholder_frequency")}" value="${m ? loc(m.freq) : ""}"></div>
    <div class="form-row"><label>${t("label_duration")}</label><input class="text-input" id="f-mt-dur" placeholder="${t("placeholder_duration")}" value="${m ? loc(m.duration) : ""}"></div>
    <div class="form-row"><label>${t("label_participants")}</label><div class="chip-list" id="f-mt-participants">${chips}</div></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveTemplate(${m ? `'${m.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveTemplate(templateId) {
  var name = document.getElementById("f-mt-name").value.trim();
  var category = document.getElementById("f-mt-category").value;
  var departmentId = document.getElementById("f-mt-dept").value || null;
  var freq = document.getElementById("f-mt-freq").value.trim();
  var duration = document.getElementById("f-mt-dur").value.trim();
  var participantIds = selectedChipIds("f-mt-participants");
  if (!name) return;
  if (templateId) {
    var m = state.meetingTemplates.find(function (x) { return x.id === templateId; });
    Object.assign(m, { name: name, category: category, departmentId: departmentId, freq: freq, duration: duration, participantIds: participantIds });
  } else {
    state.meetingTemplates.push({ id: genId("m"), name: name, category: category, departmentId: departmentId, freq: freq, duration: duration, participantIds: participantIds });
  }
  closeModal();
  persistState();
  window.renderMain();
}

function deleteTemplate(templateId) {
  state.meetingTemplates = state.meetingTemplates.filter(function (m) { return m.id !== templateId; });
  persistState();
  window.renderMain();
}

// ─── Meeting Detail ───────────────────────────────────────────────────────────

function openMeetingDetail(occurrenceId) {
  currentOccurrenceId = occurrenceId;
  window.renderMain();
}

function closeMeetingDetail() {
  currentOccurrenceId = null;
  window.renderMain();
}

function renderMeetingDetail(occurrenceId) {
  var user = getCurrentUser();
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  if (!o) { currentOccurrenceId = null; renderMeetingsSchedule(); return; }

  var isParticipant = o.participantIds.includes(user.id);
  var canView = user.role === "patron" || canManageOccurrence(user, o) || isParticipant;
  if (!canView) {
    document.getElementById("main-content").innerHTML = `
      <button class="btn-sm" onclick="closeMeetingDetail()">${t("btn_back_to_list")}</button>
      <div class="empty-state" style="margin-top:16px">${t("access_denied")}</div>`;
    return;
  }

  var canManage = canManageOccurrence(user, o);
  var html = `<button class="btn-sm" onclick="closeMeetingDetail()">${t("btn_back_to_list")}</button>`;
  html += meetingDetailHeader(o, canManage);
  html += meetingDetailAgenda(o, canManage);
  html += meetingDetailNotes(o, canManage);
  html += meetingDetailDecisions(o, canManage);
  html += meetingDetailActionItems(o, canManage);
  html += meetingDetailSummary(o, canManage);

  document.getElementById("main-content").innerHTML = html;
}

// AI Meeting Summary entry point — the record and generation logic live in the
// Knowledge module (js/render/knowledge.js); this just surfaces the trigger.
function meetingDetailSummary(o, canManage) {
  if (!canManage || o.status !== "completed") return "";
  var existing = state.meetingSummaries.find(function (s) { return s.occurrenceId === o.id; });
  var label = existing ? t("btn_view_summary") : t("btn_generate_summary");
  return `<div class="section-head"><h2>${t("section_ai_summary")}</h2></div>
    <div class="card card-row">
      <div class="dim-text">${t("notice_ai_stub")}</div>
      <button class="btn-sm" onclick="openMeetingSummaryModal('${o.id}')">${label}</button>
    </div>`;
}

function meetingDetailHeader(o, canManage) {
  var dept = state.departments.find(function (d) { return d.id === o.departmentId; });
  var owner = state.users.find(function (u) { return u.id === o.ownerId; });
  var statusHtml = canManage
    ? `<select class="text-input" style="width:auto;padding:4px 8px;font-size:11.5px" onchange="updateOccurrenceStatus('${o.id}',this.value)">
        <option value="scheduled" ${o.status === "scheduled" ? "selected" : ""}>${t("occ_status_scheduled")}</option>
        <option value="completed" ${o.status === "completed" ? "selected" : ""}>${t("occ_status_completed")}</option>
        <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>${t("occ_status_cancelled")}</option>
      </select>`
    : `<span class="tag ${occStatusTagClass(o.status)}">${occStatusLabel(o.status)}</span>`;

  return `<div class="card" style="margin-top:16px">
    <div class="card-row">
      <div><div class="p-name">${o.title}</div><div class="p-title">${categoryLabel(o.category)} · ${formatDateTime(o.scheduledAt)}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        ${canManage ? `<button class="btn-sm" onclick="openMeetingSetupModal('${o.id}')">${t("btn_edit")}</button>` : ""}
        ${canManage && o.status === "scheduled" ? `<button class="btn-sm danger" onclick="deleteMeetingOccurrence('${o.id}')">${t("btn_delete")}</button>` : ""}
        ${statusHtml}
      </div>
    </div>
    <div style="margin-top:10px">
      ${dept ? `<span class="tag tag-gray" style="margin-right:5px">${loc(dept.name)}</span>` : ""}
      ${owner ? `<span class="tag tag-gold">${t("field_owner")}: ${owner.name}</span>` : ""}
    </div>
    <div class="dim-text" style="margin-top:8px">${t("section_participants")}: ${participantNames(o.participantIds).join(", ") || "—"}</div>
  </div>`;
}

function updateOccurrenceStatus(occurrenceId, status) {
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  o.status = status;
  persistState();
  window.renderMain();
}

function meetingDetailAgenda(o, canManage) {
  var items = (o.agendaItems || []).slice().sort(function (a, b) { return a.order - b.order; });
  var html = `<div class="section-head"><h2>${t("section_agenda")}</h2>${canManage ? `<button class="btn-gold" onclick="openAgendaItemModal('${o.id}')">${t("btn_add_agenda_item")}</button>` : ""}</div>`;
  if (items.length === 0) html += `<div class="empty-state">${t("empty_no_agenda")}</div>`;
  items.forEach(function (item) {
    html += `<div class="card card-row">
      <div>${item.title}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="dim-text">${item.timeboxMin} ${t("field_timebox_suffix")}</span>
        ${canManage ? `<button class="btn-sm" onclick="deleteAgendaItem('${o.id}','${item.id}')">${t("btn_delete")}</button>` : ""}
      </div>
    </div>`;
  });
  return html;
}

function openAgendaItemModal(occurrenceId) {
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("btn_add_agenda_item")}</h3>
    <div class="form-row"><label>${t("label_agenda_item_title")}</label><input class="text-input" id="f-ai-title"></div>
    <div class="form-row"><label>${t("label_timebox_minutes")}</label><input class="text-input" id="f-ai-min" type="number" min="0" value="10"></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveAgendaItem('${occurrenceId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveAgendaItem(occurrenceId) {
  var title = document.getElementById("f-ai-title").value.trim();
  var mins = Number(document.getElementById("f-ai-min").value) || 0;
  if (!title) return;
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  var nextOrder = o.agendaItems.length ? Math.max.apply(null, o.agendaItems.map(function (a) { return a.order; })) + 1 : 1;
  o.agendaItems.push({ id: genId("ai"), title: title, timeboxMin: mins, order: nextOrder });
  closeModal();
  persistState();
  window.renderMain();
}

function deleteAgendaItem(occurrenceId, itemId) {
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  o.agendaItems = o.agendaItems.filter(function (a) { return a.id !== itemId; });
  persistState();
  window.renderMain();
}

function meetingDetailNotes(o, canManage) {
  var html = `<div class="section-head"><h2>${t("section_notes")}</h2></div>`;
  if (canManage) {
    html += `<div class="card">
      <textarea class="text-input" id="f-mo-notes" placeholder="${t("placeholder_notes")}" style="min-height:80px">${o.notes || ""}</textarea>
      <button class="btn-gold" style="margin-top:10px" onclick="saveNotes('${o.id}')">${t("btn_save_notes")}</button>
    </div>`;
  } else {
    html += `<div class="card"><div class="val">${o.notes || "—"}</div></div>`;
  }
  return html;
}

function saveNotes(occurrenceId) {
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  o.notes = document.getElementById("f-mo-notes").value.trim();
  persistState();
  window.renderMain();
}

function meetingDetailDecisions(o, canManage) {
  var decisions = state.meetingDecisions.filter(function (d) { return d.occurrenceId === o.id; });
  var html = `<div class="section-head"><h2>${t("section_decisions")}</h2>${canManage ? `<button class="btn-gold" onclick="openDecisionModal('${o.id}')">${t("btn_add_decision")}</button>` : ""}</div>`;
  if (decisions.length === 0) html += `<div class="empty-state">${t("empty_no_decisions")}</div>`;
  decisions.forEach(function (d) {
    var owner = state.users.find(function (u) { return u.id === d.ownerId; });
    html += `<div class="card card-row">
      <div><div class="p-name">${d.text}</div><div class="p-title">${owner ? owner.name : "—"} · ${formatDate(d.createdAt)}</div></div>
      ${canManage ? `<button class="btn-sm" onclick="deleteDecision('${o.id}','${d.id}')">${t("btn_delete")}</button>` : ""}
    </div>`;
  });
  return html;
}

function openDecisionModal(occurrenceId) {
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("btn_add_decision")}</h3>
    <div class="form-row"><label>${t("label_decision_text")}</label><textarea class="text-input" id="f-md-text"></textarea></div>
    <div class="form-row"><label>${t("label_owner")}</label><select class="text-input" id="f-md-owner">${ownerSelectOptions(null)}</select></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveDecision('${occurrenceId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveDecision(occurrenceId) {
  var text = document.getElementById("f-md-text").value.trim();
  var ownerId = document.getElementById("f-md-owner").value || null;
  if (!text) return;
  state.meetingDecisions.push({ id: genId("md"), occurrenceId: occurrenceId, text: text, ownerId: ownerId, createdAt: new Date().toISOString() });
  closeModal();
  persistState();
  window.renderMain();
}

function deleteDecision(occurrenceId, decisionId) {
  state.meetingDecisions = state.meetingDecisions.filter(function (d) { return d.id !== decisionId; });
  persistState();
  window.renderMain();
}

function meetingDetailActionItems(o, canManage) {
  var items = state.tasks.filter(function (task) { return task.source === "meeting" && task.sourceId === o.id; });
  var html = `<div class="section-head"><h2>${t("section_action_items")}</h2>${canManage ? `<button class="btn-gold" onclick="openActionItemModal('${o.id}')">${t("btn_add_action_item")}</button>` : ""}</div>`;
  if (items.length === 0) html += `<div class="empty-state">${t("empty_no_action_items")}</div>`;
  items.forEach(function (task) {
    var emp = state.users.find(function (u) { return u.id === task.employeeId; });
    html += `<div class="card card-row">
      <div><div class="p-name">${loc(task.title)}</div><div class="p-title">${emp ? emp.name : t("option_unassigned")} · ${taskDueDisplay(task)}</div></div>
      <select class="text-input" style="width:auto;padding:4px 8px;font-size:11.5px" onchange="updateTaskStatus('${task.id}',this.value)">
        <option value="todo" ${task.status === "todo" ? "selected" : ""}>${t("status_todo")}</option>
        <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>${t("status_in_progress")}</option>
        <option value="blocked" ${task.status === "blocked" ? "selected" : ""}>${t("status_blocked")}</option>
        <option value="done" ${task.status === "done" ? "selected" : ""}>${t("status_done")}</option>
      </select>
    </div>`;
  });
  return html;
}

function openActionItemModal(occurrenceId) {
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("btn_add_action_item")}</h3>
    <div class="form-row"><label>${t("label_action_item_title")}</label><input class="text-input" id="f-ta-title"></div>
    <div class="form-row"><label>${t("label_assignee")}</label><select class="text-input" id="f-ta-assignee">${participantOwnerOptions(o.participantIds)}</select></div>
    <div class="form-row"><label>${t("label_due_date")}</label><input class="text-input" id="f-ta-due" type="date"></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveActionItem('${occurrenceId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveActionItem(occurrenceId) {
  var title = document.getElementById("f-ta-title").value.trim();
  var employeeId = document.getElementById("f-ta-assignee").value || null;
  var dueAt = document.getElementById("f-ta-due").value || null;
  if (!title) return;
  state.tasks.push({
    id: genId("t"), employeeId: employeeId, title: title, description: "", due: null, dueAt: dueAt,
    status: "todo", priority: "medium", source: "meeting", sourceId: occurrenceId, createdAt: new Date().toISOString(),
  });
  closeModal();
  persistState();
  window.renderMain();
}

// ─── Decisions Log ────────────────────────────────────────────────────────────

function renderDecisionsLog() {
  var user = getCurrentUser();
  var visibleIds = visibleOccurrences(user).map(function (o) { return o.id; });
  var decisions = state.meetingDecisions
    .filter(function (d) { return visibleIds.includes(d.occurrenceId); })
    .slice()
    .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });

  var html = meetingsSubnav(user) + `
    <div class="page-title">${t("page_title_decisions")}</div>
    <div class="page-sub">${t("page_sub_decisions")}</div>`;
  if (decisions.length === 0) html += `<div class="empty-state">${t("empty_no_decisions")}</div>`;

  decisions.forEach(function (d) {
    var o = state.meetingOccurrences.find(function (x) { return x.id === d.occurrenceId; });
    var owner = state.users.find(function (u) { return u.id === d.ownerId; });
    html += `<div class="card">
      <div class="p-name">${d.text}</div>
      <div class="p-title" style="margin-top:4px">${o ? o.title + " · " : ""}${formatDate(d.createdAt)} · ${owner ? owner.name : "—"}</div>
      <button class="btn-sm" style="margin-top:8px" onclick="openPromoteToPolicyModal('${d.id}')">${t("btn_promote_policy")}</button>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Action Items (filtered tasks view) ────────────────────────────────────────

function renderMeetingActionItems() {
  var user = getCurrentUser();
  var items;
  if (user.role === "patron") {
    items = state.tasks.filter(function (task) { return task.source === "meeting"; });
  } else if (user.role === "mudur") {
    var teamIds = myTeamMembers(user).map(function (u) { return u.id; }).concat(user.id);
    items = state.tasks.filter(function (task) { return task.source === "meeting" && teamIds.includes(task.employeeId); });
  } else {
    items = state.tasks.filter(function (task) { return task.source === "meeting" && task.employeeId === user.id; });
  }
  items = sortByDueAt(items);

  var html = meetingsSubnav(user) + `
    <div class="page-title">${t("page_title_action_items")}</div>
    <div class="page-sub">${t("page_sub_action_items")}</div>`;
  if (items.length === 0) html += `<div class="empty-state">${t("empty_no_action_items")}</div>`;

  items.forEach(function (task) {
    var emp = state.users.find(function (u) { return u.id === task.employeeId; });
    var o = state.meetingOccurrences.find(function (x) { return x.id === task.sourceId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${loc(task.title)}</div>
        <div class="p-title">${emp ? emp.name : t("option_unassigned")} · ${taskDueDisplay(task)}${o ? " · " + o.title : ""}</div>
      </div>
      <select class="text-input" style="width:auto;padding:4px 8px;font-size:11.5px" onchange="updateTaskStatus('${task.id}',this.value)">
        <option value="todo" ${task.status === "todo" ? "selected" : ""}>${t("status_todo")}</option>
        <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>${t("status_in_progress")}</option>
        <option value="blocked" ${task.status === "blocked" ? "selected" : ""}>${t("status_blocked")}</option>
        <option value="done" ${task.status === "done" ? "selected" : ""}>${t("status_done")}</option>
      </select>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Meeting History ────────────────────────────────────────────────────────────

function renderMeetingHistory() {
  var user = getCurrentUser();
  var occs = visibleOccurrences(user)
    .filter(function (o) { return o.status === "completed" || o.status === "cancelled"; })
    .sort(function (a, b) { return b.scheduledAt.localeCompare(a.scheduledAt); });

  var html = meetingsSubnav(user) + `
    <div class="page-title">${t("page_title_history")}</div>
    <div class="page-sub">${t("page_sub_history")}</div>`;
  if (occs.length === 0) html += `<div class="empty-state">${t("empty_no_history")}</div>`;

  occs.forEach(function (o) {
    var decisions = state.meetingDecisions.filter(function (d) { return d.occurrenceId === o.id; });
    var actionItems = state.tasks.filter(function (task) { return task.source === "meeting" && task.sourceId === o.id; });
    var done = actionItems.filter(function (task) { return task.status === "done"; }).length;
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${o.title}</div>
        <div class="p-title">${formatDateTime(o.scheduledAt)} · ${tf("history_participants_count", { n: o.participantIds.length })}</div>
        <div class="dim-text" style="margin-top:4px">${tf("history_decisions_count", { n: decisions.length })} · ${tf("history_action_items_progress", { done: done, total: actionItems.length })}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${occStatusTagClass(o.status)}">${occStatusLabel(o.status)}</span>
        <button class="btn-sm" onclick="openMeetingDetail('${o.id}')">${t("btn_open_meeting")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}
