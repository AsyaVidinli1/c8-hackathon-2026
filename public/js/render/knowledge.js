var DOCUMENT_CATEGORIES = ["template", "report", "contract", "reference"];
var POLICY_CATEGORIES = ["hr", "financial", "operational", "family"];

// Which sub-screen of the Knowledge tab is active, which record (if any) is drilled
// into, and the current Content Search query (searches within this module only —
// distinct from the platform-level Global Search, deferred to v0.8).
var currentKnowledgeView = "documents";
var currentDocumentId = null;
var currentPolicyId = null;
var knowledgeSearchQuery = "";

// ─── Entry point + sub-navigation ─────────────────────────────────────────────

function renderKnowledge() {
  var user = getCurrentUser();
  if (knowledgeSearchQuery.trim()) { renderKnowledgeSearchResults(user); return; }
  if (currentDocumentId) { renderDocumentDetail(currentDocumentId); return; }
  if (currentPolicyId) { renderPolicyDetail(currentPolicyId); return; }
  if (currentKnowledgeView === "policies") { renderPoliciesList(); return; }
  if (currentKnowledgeView === "handbook") { renderHandbook(); return; }
  renderDocumentsList();
}

function switchKnowledgeView(view) {
  currentKnowledgeView = view;
  currentDocumentId = null;
  currentPolicyId = null;
  knowledgeSearchQuery = "";
  window.renderMain();
}

function knowledgeSubnav(user) {
  var tabs = [
    ["documents", t("ktab_documents")],
    ["policies", t("ktab_policies")],
    ["handbook", t("ktab_handbook")],
  ];
  var buttons = tabs.map(function (entry) {
    return `<button class="subtab ${entry[0] === currentKnowledgeView && !knowledgeSearchQuery.trim() ? "active" : ""}" onclick="switchKnowledgeView('${entry[0]}')">${entry[1]}</button>`;
  }).join("");
  return `<div class="subtab-bar">${buttons}</div>` + knowledgeSearchBar();
}

function knowledgeSearchBar() {
  return `<div class="form-row" style="margin-top:10px;max-width:360px">
    <input class="text-input" id="f-knowledge-search" placeholder="${t("label_knowledge_search_placeholder")}"
      value="${knowledgeSearchQuery}" oninput="updateKnowledgeSearch(this.value)">
  </div>`;
}

var knowledgeSearchDebounce = null;

function updateKnowledgeSearch(value) {
  knowledgeSearchQuery = value;
  currentDocumentId = null;
  currentPolicyId = null;
  // renderMain() replaces #main-content wholesale, which would drop focus and
  // truncate fast typing if it ran on every keystroke — debounce it so the
  // native input keeps accumulating characters until typing pauses.
  if (knowledgeSearchDebounce) clearTimeout(knowledgeSearchDebounce);
  knowledgeSearchDebounce = setTimeout(function () {
    window.renderMain();
    var input = document.getElementById("f-knowledge-search");
    if (input) {
      input.focus();
      var len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, 250);
}

function canEditKnowledge(user) {
  return user.role === "patron" || user.role === "mudur";
}

// ─── Content Search (module-scoped, distinct from Global Search) ──────────────

function renderKnowledgeSearchResults(user) {
  var results = knowledgeSearchResults(knowledgeSearchQuery, user);
  var total = results.documents.length + results.policies.length + results.handbookSections.length;

  var html = knowledgeSubnav(user) + `
    <div class="page-title">${t("page_title_knowledge")}</div>
    <div class="section-head"><h2>${tf("section_search_results", { n: total })}</h2></div>`;

  if (total === 0) html += `<div class="empty-state">${t("empty_no_search_results")}</div>`;

  results.documents.forEach(function (d) {
    html += `<div class="card card-row">
      <div><span class="tag tag-gray" style="margin-right:6px">${t("result_type_document")}</span><span class="p-name">${d.title}</span></div>
      <button class="btn-sm" onclick="switchKnowledgeView('documents');openDocumentDetail('${d.id}')">${t("btn_open")}</button>
    </div>`;
  });
  results.policies.forEach(function (p) {
    html += `<div class="card card-row">
      <div><span class="tag tag-gray" style="margin-right:6px">${t("result_type_policy")}</span><span class="p-name">${p.title}</span></div>
      <button class="btn-sm" onclick="switchKnowledgeView('policies');openPolicyDetail('${p.id}')">${t("btn_open")}</button>
    </div>`;
  });
  results.handbookSections.forEach(function (h) {
    html += `<div class="card card-row">
      <div><span class="tag tag-gray" style="margin-right:6px">${t("result_type_handbook")}</span><span class="p-name">${h.title}</span></div>
      <button class="btn-sm" onclick="switchKnowledgeView('handbook')">${t("btn_open")}</button>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Documents ──────────────────────────────────────────────────────────────────

function renderDocumentsList() {
  var user = getCurrentUser();
  var canEdit = canEditKnowledge(user);
  var html = knowledgeSubnav(user) + `
    <div class="page-title">${t("page_title_documents")}</div>
    <div class="page-sub">${t("page_sub_documents")}</div>
    <div class="section-head"><h2>${t("section_documents")}</h2>${canEdit ? `<button class="btn-gold" onclick="openDocumentModal()">${t("btn_add_document")}</button>` : ""}</div>`;

  if (state.documents.length === 0) html += `<div class="empty-state">${t("empty_no_documents")}</div>`;

  state.documents.slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); }).forEach(function (d) {
    var dept = state.departments.find(function (x) { return x.id === d.departmentId; });
    var owner = state.users.find(function (u) { return u.id === d.ownerId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${d.title}</div>
        <div class="p-title">${dept ? loc(dept.name) + " · " : ""}${owner ? owner.name : "—"} · ${formatDate(d.updatedAt)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${documentCategoryTagClass(d.category)}">${documentCategoryLabel(d.category)}</span>
        <button class="btn-sm" onclick="openDocumentDetail('${d.id}')">${t("btn_open")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openDocumentDetail(docId) {
  currentDocumentId = docId;
  window.renderMain();
}

function closeDocumentDetail() {
  currentDocumentId = null;
  window.renderMain();
}

function renderDocumentDetail(docId) {
  var user = getCurrentUser();
  var d = state.documents.find(function (x) { return x.id === docId; });
  if (!d) { currentDocumentId = null; renderDocumentsList(); return; }
  var canEdit = canEditKnowledge(user);
  var dept = state.departments.find(function (x) { return x.id === d.departmentId; });
  var owner = state.users.find(function (u) { return u.id === d.ownerId; });

  var html = `<button class="btn-sm" onclick="closeDocumentDetail()">${t("btn_back_to_list")}</button>
    <div class="card" style="margin-top:16px">
      <div class="card-row">
        <div><div class="p-name">${d.title}</div><div class="p-title">${dept ? loc(dept.name) + " · " : ""}${owner ? owner.name : "—"} · ${t("field_last_update")}: ${formatDate(d.updatedAt)}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          ${canEdit ? `<button class="btn-sm" onclick="openDocumentModal('${d.id}')">${t("btn_new_version")}</button>` : ""}
          <button class="btn-sm" onclick="downloadDocumentTxt('${d.id}')">${t("btn_download_txt")}</button>
          ${canEdit ? `<button class="btn-sm danger" onclick="deleteDocument('${d.id}')">${t("btn_delete")}</button>` : ""}
        </div>
      </div>
      <div style="margin-top:10px"><span class="tag ${documentCategoryTagClass(d.category)}">${documentCategoryLabel(d.category)}</span></div>
    </div>
    <div class="field-block"><div class="lbl">${t("field_document_body")}</div><div class="val" style="white-space:pre-wrap">${d.body}</div></div>
    <div class="section-head"><h2>${t("field_version_history")}</h2></div>`;

  d.versions.slice().sort(function (a, b) { return b.versionNumber - a.versionNumber; }).forEach(function (v) {
    var vu = state.users.find(function (u) { return u.id === v.updatedBy; });
    html += `<div class="card card-row">
      <div><div class="p-name">v${v.versionNumber} — ${v.note || "—"}</div><div class="p-title">${vu ? vu.name : "—"} · ${formatDate(v.updatedAt)}</div></div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openDocumentModal(docId) {
  var d = docId ? state.documents.find(function (x) { return x.id === docId; }) : null;
  var catOptions = DOCUMENT_CATEGORIES.map(function (c) {
    return `<option value="${c}" ${d && d.category === c ? "selected" : ""}>${documentCategoryLabel(c)}</option>`;
  }).join("");
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${d ? t("modal_edit_document") : t("modal_new_document")}</h3>
    <div class="form-row"><label>${t("label_document_title")}</label><input class="text-input" id="f-doc-title" value="${d ? d.title : ""}"></div>
    <div class="form-row"><label>${t("label_document_category")}</label><select class="text-input" id="f-doc-category">${catOptions}</select></div>
    <div class="form-row"><label>${t("label_document_department")}</label><select class="text-input" id="f-doc-department">${departmentSelectOptions(d ? d.departmentId : null)}</select></div>
    <div class="form-row"><label>${t("label_document_body")}</label><textarea class="text-input" id="f-doc-body" rows="6">${d ? d.body : ""}</textarea></div>
    ${d ? `<div class="form-row"><label>${t("label_version_note")}</label><input class="text-input" id="f-doc-version-note"></div>` : ""}
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveDocument(${d ? `'${d.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveDocument(docId) {
  var user = getCurrentUser();
  var title = document.getElementById("f-doc-title").value.trim();
  var category = document.getElementById("f-doc-category").value;
  var departmentId = document.getElementById("f-doc-department").value || null;
  var bodyText = document.getElementById("f-doc-body").value.trim();

  var validation = validateDocumentPayload({ title: title });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }

  var today = new Date().toISOString().slice(0, 10);

  if (docId) {
    var d = state.documents.find(function (x) { return x.id === docId; });
    var noteField = document.getElementById("f-doc-version-note");
    var note = noteField ? noteField.value.trim() : "";
    var nextVersion = d.versions.length + 1;
    d.title = title;
    d.category = category;
    d.departmentId = departmentId;
    d.body = bodyText;
    d.updatedAt = today;
    d.versions.push({ versionNumber: nextVersion, body: bodyText, note: note, updatedBy: user.id, updatedAt: today });
  } else {
    var newId = genId("doc");
    state.documents.push({
      id: newId, title: title, category: category, departmentId: departmentId, ownerId: user.id, body: bodyText,
      versions: [{ versionNumber: 1, body: bodyText, note: "", updatedBy: user.id, updatedAt: today }],
      updatedAt: today,
    });
  }

  closeModal();
  persistState();
  window.renderMain();
}

function deleteDocument(docId) {
  if (!confirm(t("confirm_delete_document"))) return;
  state.documents = state.documents.filter(function (x) { return x.id !== docId; });
  currentDocumentId = null;
  persistState();
  window.renderMain();
}

function downloadDocumentTxt(docId) {
  var d = state.documents.find(function (x) { return x.id === docId; });
  if (!d) return;
  var blob = new Blob([d.title + "\n\n" + d.body], { type: "text/plain" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = d.title.replace(/[^a-z0-9]+/gi, "_") + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Policies ───────────────────────────────────────────────────────────────────

function renderPoliciesList() {
  var user = getCurrentUser();
  var canEdit = canEditKnowledge(user);
  var policies = visiblePolicies(user);
  var html = knowledgeSubnav(user) + `
    <div class="page-title">${t("page_title_policies")}</div>
    <div class="page-sub">${t("page_sub_policies")}</div>
    <div class="section-head"><h2>${t("section_policies")}</h2>${canEdit ? `<button class="btn-gold" onclick="openPolicyModal()">${t("btn_add_policy")}</button>` : ""}</div>`;

  if (policies.length === 0) html += `<div class="empty-state">${t("empty_no_policies")}</div>`;

  policies.slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); }).forEach(function (p) {
    var owner = state.users.find(function (u) { return u.id === p.ownerId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${p.title}</div>
        <div class="p-title">${policyCategoryLabel(p.category)} · ${owner ? owner.name : "—"} · ${formatDate(p.effectiveDate)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${policyStatusTagClass(p.status)}">${policyStatusLabel(p.status)}</span>
        <button class="btn-sm" onclick="openPolicyDetail('${p.id}')">${t("btn_open")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openPolicyDetail(policyId) {
  currentPolicyId = policyId;
  window.renderMain();
}

function closePolicyDetail() {
  currentPolicyId = null;
  window.renderMain();
}

function renderPolicyDetail(policyId) {
  var user = getCurrentUser();
  var p = state.policies.find(function (x) { return x.id === policyId; });
  if (!p || (p.category === "family" && user.role !== "patron")) {
    currentPolicyId = null;
    renderPoliciesList();
    return;
  }
  var canEdit = canEditKnowledge(user);
  var owner = state.users.find(function (u) { return u.id === p.ownerId; });

  var html = `<button class="btn-sm" onclick="closePolicyDetail()">${t("btn_back_to_list")}</button>
    <div class="card" style="margin-top:16px">
      <div class="card-row">
        <div><div class="p-name">${p.title}</div><div class="p-title">${policyCategoryLabel(p.category)} · ${owner ? owner.name : "—"} · ${t("label_effective_date")}: ${formatDate(p.effectiveDate)}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          ${canEdit ? `<button class="btn-sm" onclick="openPolicyModal('${p.id}')">${t("btn_edit")}</button>` : ""}
          ${canEdit && p.status === "draft" ? `<button class="btn-sm" onclick="publishPolicy('${p.id}')">${t("btn_publish_policy")}</button>` : ""}
          ${canEdit && p.status === "active" ? `<button class="btn-sm" onclick="archivePolicy('${p.id}')">${t("btn_archive_policy")}</button>` : ""}
          ${canEdit ? `<button class="btn-sm danger" onclick="deletePolicy('${p.id}')">${t("btn_delete")}</button>` : ""}
        </div>
      </div>
      <div style="margin-top:10px">
        <span class="tag ${policyStatusTagClass(p.status)}" style="margin-right:6px">${policyStatusLabel(p.status)}</span>
        ${p.source === "meeting_decision" ? `<span class="tag tag-gray">${t("source_meeting_decision")}</span>` : ""}
      </div>
    </div>
    <div class="field-block"><div class="lbl">${t("field_policy_body")}</div><div class="val" style="white-space:pre-wrap">${p.body}</div></div>
    <div class="section-head"><h2>${t("field_version_history")}</h2></div>`;

  p.versions.slice().sort(function (a, b) { return b.versionNumber - a.versionNumber; }).forEach(function (v) {
    var vu = state.users.find(function (u) { return u.id === v.updatedBy; });
    html += `<div class="card card-row">
      <div><div class="p-name">v${v.versionNumber} — ${v.note || "—"}</div><div class="p-title">${vu ? vu.name : "—"} · ${formatDate(v.updatedAt)}</div></div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openPolicyModal(policyId) {
  var p = policyId ? state.policies.find(function (x) { return x.id === policyId; }) : null;
  var catOptions = POLICY_CATEGORIES.map(function (c) {
    return `<option value="${c}" ${p && p.category === c ? "selected" : ""}>${policyCategoryLabel(c)}</option>`;
  }).join("");
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${p ? t("modal_edit_policy") : t("modal_new_policy")}</h3>
    <div class="form-row"><label>${t("label_policy_title")}</label><input class="text-input" id="f-pol-title" value="${p ? p.title : ""}"></div>
    <div class="form-row"><label>${t("label_policy_category")}</label><select class="text-input" id="f-pol-category">${catOptions}</select></div>
    <div class="form-row"><label>${t("label_policy_body")}</label><textarea class="text-input" id="f-pol-body" rows="6">${p ? p.body : ""}</textarea></div>
    <div class="form-row"><label>${t("label_effective_date")}</label><input class="text-input" id="f-pol-effective" type="date" value="${p ? p.effectiveDate : ""}"></div>
    <div class="form-row"><label>${t("label_policy_owner")}</label><select class="text-input" id="f-pol-owner">${ownerSelectOptions(p ? p.ownerId : null)}</select></div>
    ${p ? `<div class="form-row"><label>${t("label_version_note")}</label><input class="text-input" id="f-pol-version-note"></div>` : ""}
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="savePolicy(${p ? `'${p.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function savePolicy(policyId) {
  var user = getCurrentUser();
  var title = document.getElementById("f-pol-title").value.trim();
  var category = document.getElementById("f-pol-category").value;
  var bodyText = document.getElementById("f-pol-body").value.trim();
  var effectiveDate = document.getElementById("f-pol-effective").value || null;
  var ownerId = document.getElementById("f-pol-owner").value || null;

  var validation = validatePolicyPayload({ title: title, body: bodyText });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }

  var today = new Date().toISOString().slice(0, 10);

  if (policyId) {
    var p = state.policies.find(function (x) { return x.id === policyId; });
    var noteField = document.getElementById("f-pol-version-note");
    var note = noteField ? noteField.value.trim() : "";
    var nextVersion = p.versions.length + 1;
    p.title = title;
    p.category = category;
    p.body = bodyText;
    p.effectiveDate = effectiveDate;
    p.ownerId = ownerId;
    p.updatedAt = today;
    p.versions.push({ versionNumber: nextVersion, body: bodyText, note: note, updatedBy: user.id, updatedAt: today });
  } else {
    state.policies.push({
      id: genId("pol"), title: title, category: category, body: bodyText, effectiveDate: effectiveDate,
      ownerId: ownerId, status: "draft", source: "manual", sourceId: null,
      versions: [{ versionNumber: 1, body: bodyText, note: "", updatedBy: user.id, updatedAt: today }],
      updatedAt: today,
    });
  }

  closeModal();
  persistState();
  window.renderMain();
}

function publishPolicy(policyId) {
  var p = state.policies.find(function (x) { return x.id === policyId; });
  p.status = "active";
  persistState();
  window.renderMain();
}

function archivePolicy(policyId) {
  var p = state.policies.find(function (x) { return x.id === policyId; });
  p.status = "archived";
  persistState();
  window.renderMain();
}

function deletePolicy(policyId) {
  if (!confirm(t("confirm_delete_policy"))) return;
  state.policies = state.policies.filter(function (x) { return x.id !== policyId; });
  currentPolicyId = null;
  persistState();
  window.renderMain();
}

// ─── Promote to Policy (called from the Decisions Log in meetings.js) ─────────

function openPromoteToPolicyModal(decisionId) {
  var d = state.meetingDecisions.find(function (x) { return x.id === decisionId; });
  if (!d) return;
  var catOptions = POLICY_CATEGORIES.filter(function (c) { return c !== "family"; }).map(function (c) {
    return `<option value="${c}" ${c === "operational" ? "selected" : ""}>${policyCategoryLabel(c)}</option>`;
  }).join("");
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("modal_promote_to_policy")}</h3>
    <div class="form-row"><label>${t("label_policy_title")}</label><input class="text-input" id="f-promo-title" value="${d.text.slice(0, 80)}"></div>
    <div class="form-row"><label>${t("label_policy_body")}</label><textarea class="text-input" id="f-promo-body" rows="5">${d.text}</textarea></div>
    <div class="form-row"><label>${t("label_policy_category")}</label><select class="text-input" id="f-promo-category">${catOptions}</select></div>
    <div class="form-row"><label>${t("label_policy_owner")}</label><select class="text-input" id="f-promo-owner">${ownerSelectOptions(d.ownerId)}</select></div>
    <div class="form-row"><label>${t("label_effective_date")}</label><input class="text-input" id="f-promo-effective" type="date" value="${(d.createdAt || "").slice(0, 10)}"></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="savePromotedPolicy('${decisionId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function savePromotedPolicy(decisionId) {
  var user = getCurrentUser();
  var title = document.getElementById("f-promo-title").value.trim();
  var bodyText = document.getElementById("f-promo-body").value.trim();
  var category = document.getElementById("f-promo-category").value;
  var ownerId = document.getElementById("f-promo-owner").value || null;
  var effectiveDate = document.getElementById("f-promo-effective").value || null;

  var validation = validatePolicyPayload({ title: title, body: bodyText });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }

  var today = new Date().toISOString().slice(0, 10);
  state.policies.push({
    id: genId("pol"), title: title, category: category, body: bodyText, effectiveDate: effectiveDate,
    ownerId: ownerId, status: "draft", source: "meeting_decision", sourceId: decisionId,
    versions: [{ versionNumber: 1, body: bodyText, note: "", updatedBy: user.id, updatedAt: today }],
    updatedAt: today,
  });

  closeModal();
  persistState();
  window.switchTab("bilgi");
  switchKnowledgeView("policies");
}

// ─── Company Handbook ────────────────────────────────────────────────────────────

function renderHandbook() {
  var user = getCurrentUser();
  var canEdit = canEditKnowledge(user);
  var html = knowledgeSubnav(user) + `
    <div class="page-title">${t("page_title_handbook")}</div>
    <div class="page-sub">${t("page_sub_handbook")}</div>`;

  state.handbookSections.forEach(function (h) {
    html += `<div class="card" style="margin-bottom:12px">
      <div class="card-row">
        <div class="p-name">${h.title}</div>
        ${canEdit ? `<button class="btn-sm" onclick="openHandbookEditModal('${h.id}')">${t("btn_edit")}</button>` : ""}
      </div>
      <div class="val" style="white-space:pre-wrap;margin-top:8px">${h.body || "—"}</div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openHandbookEditModal(sectionId) {
  var h = state.handbookSections.find(function (x) { return x.id === sectionId; });
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${h.title}</h3>
    <div class="form-row"><label>${t("label_section_title")}</label><input class="text-input" id="f-hb-title" value="${h.title}"></div>
    <div class="form-row"><label>${t("label_section_body")}</label><textarea class="text-input" id="f-hb-body" rows="6">${h.body || ""}</textarea></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveHandbookSection('${sectionId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveHandbookSection(sectionId) {
  var user = getCurrentUser();
  var title = document.getElementById("f-hb-title").value.trim();
  var bodyText = document.getElementById("f-hb-body").value.trim();

  var validation = validateHandbookSectionPayload({ title: title });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }

  var h = state.handbookSections.find(function (x) { return x.id === sectionId; });
  h.title = title;
  h.body = bodyText;
  h.updatedAt = new Date().toISOString().slice(0, 10);
  h.updatedBy = user.id;

  closeModal();
  persistState();
  window.renderMain();
}

// ─── AI Meeting Summary (rule-based stub; called from meetings.js) ────────────

function openMeetingSummaryModal(occurrenceId) {
  var o = state.meetingOccurrences.find(function (x) { return x.id === occurrenceId; });
  if (!o) return;
  var summary = state.meetingSummaries.find(function (s) { return s.occurrenceId === occurrenceId; });

  if (!summary) {
    var generated = generateMeetingSummary(o);
    summary = {
      id: genId("ms"), occurrenceId: occurrenceId,
      keyPoints: generated.keyPoints, decisionIds: generated.decisionIds, actionItemIds: generated.actionItemIds,
      status: "draft", generatedAt: new Date().toISOString(), approvedBy: null, approvedAt: null,
    };
    state.meetingSummaries.push(summary);
    persistState();
  }

  renderMeetingSummaryModal(summary.id);
}

function renderMeetingSummaryModal(summaryId) {
  var summary = state.meetingSummaries.find(function (x) { return x.id === summaryId; });
  var decisions = state.meetingDecisions.filter(function (d) { return summary.decisionIds.includes(d.id); });
  var tasks = state.tasks.filter(function (task) { return summary.actionItemIds.includes(task.id); });

  var pointsHtml = summary.keyPoints.length
    ? summary.keyPoints.map(function (p) { return "• " + p; }).join("<br>")
    : "—";
  var decisionsHtml = decisions.length
    ? decisions.map(function (d) { return "• " + d.text; }).join("<br>")
    : "—";
  var tasksHtml = tasks.length
    ? tasks.map(function (task) { return "• " + loc(task.title); }).join("<br>")
    : "—";

  var statusTag = summary.status === "approved"
    ? `<span class="tag tag-green">${t("tag_summary_approved")}</span>`
    : `<span class="tag tag-amber">${t("tag_summary_draft")}</span>`;

  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("modal_meeting_summary_review")}</h3>
    <div class="dim-text" style="margin-bottom:10px">${t("notice_ai_stub")}</div>
    <div class="field-block"><div class="lbl">${t("section_summary_key_points")}</div><div class="val">${pointsHtml}</div></div>
    <div class="field-block"><div class="lbl">${t("section_summary_decisions")}</div><div class="val">${decisionsHtml}</div></div>
    <div class="field-block"><div class="lbl">${t("section_summary_action_items")}</div><div class="val">${tasksHtml}</div></div>
    <div style="margin:10px 0">${statusTag}</div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      ${summary.status === "draft" ? `<button class="btn-sm" onclick="regenerateMeetingSummary('${summary.id}')">${t("btn_regenerate_summary")}</button>` : ""}
      ${summary.status === "draft" ? `<button class="btn-gold" onclick="approveMeetingSummary('${summary.id}')">${t("btn_approve_summary")}</button>` : ""}
    </div>`;
  showModal(body);
}

function regenerateMeetingSummary(summaryId) {
  var summary = state.meetingSummaries.find(function (x) { return x.id === summaryId; });
  var o = state.meetingOccurrences.find(function (x) { return x.id === summary.occurrenceId; });
  var generated = generateMeetingSummary(o);
  summary.keyPoints = generated.keyPoints;
  summary.decisionIds = generated.decisionIds;
  summary.actionItemIds = generated.actionItemIds;
  summary.generatedAt = new Date().toISOString();
  persistState();
  renderMeetingSummaryModal(summaryId);
}

function approveMeetingSummary(summaryId) {
  var user = getCurrentUser();
  var summary = state.meetingSummaries.find(function (x) { return x.id === summaryId; });
  summary.status = "approved";
  summary.approvedBy = user.id;
  summary.approvedAt = new Date().toISOString();
  persistState();
  closeModal();
  window.renderMain();
}
