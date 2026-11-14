// Tracks which employee's profile is open. null = show list.
var currentGovernanceUserId = null;

// ─── Entry points called by app.js dispatch ──────────────────────────────────

function renderPatronKartlar() {
  renderGovernance();
}

function renderMudurKartlar() {
  renderGovernance();
}

// ─── Top-level dispatcher ─────────────────────────────────────────────────────

function renderGovernance() {
  if (currentGovernanceUserId) {
    renderGovernanceDetail(currentGovernanceUserId);
  } else {
    renderGovernanceList();
  }
}

// ─── List View ────────────────────────────────────────────────────────────────

function renderGovernanceList() {
  const user = getCurrentUser();
  const employees = user.role === "patron"
    ? state.users.filter(function (u) { return u.role !== "patron"; })
    : deptEmployees(user.departmentId);

  let html = `
    <div class="page-title">${t("page_title_governance")}</div>
    <div class="page-sub">${t("page_sub_governance")}</div>`;

  if (employees.length === 0) {
    html += `<div class="empty-state">${t("empty_no_employee_show")}</div>`;
  }

  employees.forEach(function (u) {
    const card = state.roleCards[u.id];
    const dept = state.departments.find(function (d) { return d.id === u.departmentId; });
    html += `<div class="card card-row">
      <div class="person">
        <div class="avatar">${initials(u.name)}</div>
        <div>
          <div class="p-name">${u.name}</div>
          <div class="p-title">${loc(u.title)}${dept ? " · " + loc(dept.name) : ""}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${card ? "tag-green" : "tag-amber"}">${card ? t("tag_completed") : t("tag_missing")}</span>
        <button class="btn-sm" onclick="openGovernanceDetail('${u.id}')">${t("btn_view_profile")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function renderGovernanceDetail(userId) {
  const viewer = getCurrentUser();
  const u = state.users.find(function (x) { return x.id === userId; });
  if (!u) {
    currentGovernanceUserId = null;
    renderGovernanceList();
    return;
  }
  const card = state.roleCards[userId];
  const dept = state.departments.find(function (d) { return d.id === u.departmentId; });
  const canEdit = viewer.role === "patron" || viewer.role === "mudur";

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="btn-sm" onclick="closeGovernanceDetail()">${t("btn_back_to_list")}</button>
      ${canEdit ? `<button class="btn-gold" onclick="openGovernanceEditModal('${userId}')">${t("btn_edit_profile")}</button>` : ""}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="person">
        <div class="avatar">${initials(u.name)}</div>
        <div>
          <div class="p-name">${u.name}</div>
          <div class="p-title">${loc(u.title)}${dept ? " · " + loc(dept.name) : ""}</div>
        </div>
      </div>
    </div>`;

  if (!card) {
    html += `<div class="empty-state">${t("empty_governance_card")}</div>`;
  } else {
    const isActive = card.status !== "draft";
    const statusTag = isActive
      ? `<span class="tag tag-green">${t("option_status_active")}</span>`
      : `<span class="tag tag-amber">${t("tag_draft")}</span>`;

    html += `<div class="card">
      ${govField(t("field_mission"), card.mission)}
      ${govField(t("field_responsibilities"), govList(card.responsibilities))}
      ${govField(t("field_authorities"), card.authorities)}
      ${govField(t("field_decision_rights"), card.decisionRights)}
      ${govField(t("field_approval_rules"), card.approvalRules)}
      ${govField(t("field_collaborations"), govCollabs(card.collaborations))}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
        <div class="p-title">${t("field_last_update")}: ${card.updated || "—"}</div>
        ${statusTag}
      </div>
    </div>`;
  }

  document.getElementById("main-content").innerHTML = html;
}

// ─── Detail view helpers ──────────────────────────────────────────────────────

function govField(label, value) {
  return `<div class="field-block">
    <div class="lbl">${label}</div>
    <div class="val">${value || "—"}</div>
  </div>`;
}

function govList(arr) {
  if (!arr || arr.length === 0) return "";
  return arr.map(function (item) { return "• " + item; }).join("<br>");
}

function govCollabs(collabs) {
  if (!collabs || collabs.length === 0) return "";
  return collabs.map(function (c) { return c.with + " — " + c.freq; }).join("<br>");
}

// ─── Sub-navigation ───────────────────────────────────────────────────────────

function openGovernanceDetail(userId) {
  currentGovernanceUserId = userId;
  window.switchTab("yonetisim");
}

function closeGovernanceDetail() {
  currentGovernanceUserId = null;
  window.renderMain();
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function openGovernanceEditModal(userId) {
  const u = state.users.find(function (x) { return x.id === userId; });
  const c = state.roleCards[userId] || {
    mission: "", responsibilities: [], authorities: "",
    decisionRights: "", approvalRules: "", collaborations: [], status: "active",
  };

  const respText = (c.responsibilities || []).join("\n");
  const collabText = (c.collaborations || []).map(function (x) {
    return x.with + " | " + x.freq;
  }).join("\n");

  const statusOptions = [
    { val: "active", label: t("option_status_active") },
    { val: "draft",  label: t("option_status_draft") },
  ].map(function (opt) {
    return `<option value="${opt.val}" ${c.status === opt.val ? "selected" : ""}>${opt.label}</option>`;
  }).join("");

  const isNewCard = !state.roleCards[userId];
  const showDraftBtn = isNewCard && state.aiSettings.featuresEnabled.roleProfileDrafter;

  const body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${tf("modal_governance_edit_header", { name: u.name })}</h3>
    ${showDraftBtn ? `<button class="btn-sm" style="margin-bottom:10px" onclick="applyRoleProfileDraft('${userId}')">${t("btn_draft_with_ai")}</button><div class="dim-text" style="margin-bottom:10px">${t("notice_ai_draft_stub")}</div>` : ""}
    <div class="form-row"><label>${t("label_mission")}</label><textarea class="text-input" id="f-gov-mission">${c.mission || ""}</textarea></div>
    <div class="form-row"><label>${t("label_responsibilities")}</label><textarea class="text-input" id="f-gov-resp">${respText}</textarea></div>
    <div class="form-row"><label>${t("label_authorities")}</label><textarea class="text-input" id="f-gov-auth">${c.authorities || ""}</textarea></div>
    <div class="form-row"><label>${t("label_decision_rights")}</label><textarea class="text-input" id="f-gov-rights">${c.decisionRights || ""}</textarea></div>
    <div class="form-row"><label>${t("label_approval_rules")}</label><textarea class="text-input" id="f-gov-approval">${c.approvalRules || ""}</textarea></div>
    <div class="form-row"><label>${t("label_collaborations_edit")}</label><textarea class="text-input" id="f-gov-collab">${collabText}</textarea></div>
    <div class="form-row"><label>${t("label_card_status")}</label><select class="text-input" id="f-gov-status">${statusOptions}</select></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveGovernanceCard('${userId}')">${t("btn_save")}</button>
    </div>`;

  showModal(body);
}

function applyRoleProfileDraft(userId) {
  const u = state.users.find(function (x) { return x.id === userId; });
  const draft = draftRoleProfile(u);
  document.getElementById("f-gov-mission").value = draft.mission || "";
  document.getElementById("f-gov-resp").value = (draft.responsibilities || []).join("\n");
  document.getElementById("f-gov-auth").value = draft.authorities || "";
  document.getElementById("f-gov-rights").value = draft.decisionRights || "";
  document.getElementById("f-gov-approval").value = draft.approvalRules || "";
}

function saveGovernanceCard(userId) {
  const mission = document.getElementById("f-gov-mission").value.trim();
  const responsibilities = document.getElementById("f-gov-resp").value
    .split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  const authorities    = document.getElementById("f-gov-auth").value.trim();
  const decisionRights = document.getElementById("f-gov-rights").value.trim();
  const approvalRules  = document.getElementById("f-gov-approval").value.trim();
  const collaborations = document.getElementById("f-gov-collab").value
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean)
    .map(function (line) {
      const parts = line.split("|").map(function (x) { return x.trim(); });
      return { with: parts[0] || "", freq: parts[1] || "" };
    });
  const status  = document.getElementById("f-gov-status").value;
  const today   = new Date().toLocaleDateString(state.lang === "en" ? "en-US" : "tr-TR");

  state.roleCards[userId] = {
    mission, responsibilities, authorities,
    decisionRights, approvalRules, collaborations,
    status, updated: today,
  };

  closeModal();
  persistState();
  window.renderMain();
}

// ─── Employee own-card view (calisan "Kartım" tab) ────────────────────────────

function renderCalisanKart() {
  const me   = getCurrentUser();
  const card = state.roleCards[me.id];

  let html = `
    <div class="page-title">${t("page_title_my_card")}</div>
    <div class="page-sub">${t("page_sub_my_card")}</div>`;

  if (!card) {
    html += `<div class="empty-state">${t("empty_card_not_filled_full")}</div>`;
  } else {
    html += `<div class="card">
      ${govField(t("field_mission"),         card.mission)}
      ${govField(t("field_responsibilities"), govList(card.responsibilities))}
      ${govField(t("field_authorities"),      card.authorities)}
      ${govField(t("field_decision_rights"),  card.decisionRights)}
      ${govField(t("field_approval_rules"),   card.approvalRules)}
      ${govField(t("field_collaborations"),   govCollabs(card.collaborations))}
      <div class="field-block">
        <div class="lbl">${t("field_last_update")}</div>
        <div class="val">${card.updated || "—"}</div>
      </div>
    </div>`;
  }

  document.getElementById("main-content").innerHTML = html;
}
