// Which sub-screen of the Performance tab is active, and which record (if any) is drilled into.
var currentPerformanceView = "overview";
var currentKpiId = null;
var currentGoalId = null;
var currentScorecardId = null;

// ─── Entry point + sub-navigation ─────────────────────────────────────────────

function renderPerformance() {
  var user = getCurrentUser();
  if (user.role === "calisan") { renderMyScorecard(); return; }
  if (user.role === "mudur" && ["overview", "kpis", "trends"].includes(currentPerformanceView)) {
    currentPerformanceView = "deptKpis";
  }
  if (currentKpiId) { renderKpiDetail(currentKpiId); return; }
  if (currentGoalId) { renderGoalDetail(currentGoalId); return; }
  if (currentScorecardId) { renderScorecardDetail(currentScorecardId); return; }

  if (currentPerformanceView === "kpis") { renderKpiManagement(); return; }
  if (currentPerformanceView === "deptKpis") { renderDepartmentKpis(); return; }
  if (currentPerformanceView === "goals") { renderGoals(); return; }
  if (currentPerformanceView === "scorecards") { renderScorecardsList(); return; }
  if (currentPerformanceView === "trends") { renderTrendAnalysis(); return; }
  if (currentPerformanceView === "reports") { renderReports(); return; }
  renderCompanyOverview();
}

function switchPerformanceView(view) {
  currentPerformanceView = view;
  currentKpiId = null;
  currentGoalId = null;
  currentScorecardId = null;
  window.renderMain();
}

function performanceSubnav(user) {
  var tabs = user.role === "patron"
    ? [["overview", t("ptab_overview")], ["kpis", t("ptab_kpis")], ["deptKpis", t("ptab_dept_kpis")], ["goals", t("ptab_goals")], ["scorecards", t("ptab_scorecards")], ["trends", t("ptab_trends")], ["reports", t("ptab_reports")]]
    : [["deptKpis", t("ptab_dept_kpis")], ["goals", t("ptab_goals")], ["scorecards", t("ptab_scorecards")], ["reports", t("ptab_reports")]];
  var buttons = tabs.map(function (entry) {
    return `<button class="subtab ${entry[0] === currentPerformanceView ? "active" : ""}" onclick="switchPerformanceView('${entry[0]}')">${entry[1]}</button>`;
  }).join("");
  return `<div class="subtab-bar">${buttons}</div>`;
}

// ─── Shared helpers ─────────────────────────────────────────────────────────────

function canAccessKpi(user, k) {
  if (user.role === "patron") return true;
  if (user.role === "mudur") return k.departmentId === user.departmentId;
  return false;
}

function perfDepartmentOptions(selectedId) {
  var opts = `<option value="">${t("label_company_wide")}</option>`;
  state.departments.forEach(function (d) {
    opts += `<option value="${d.id}" ${selectedId === d.id ? "selected" : ""}>${loc(d.name)}</option>`;
  });
  return opts;
}

function parseNumOrNull(v) {
  if (v === "" || v == null) return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function kpiDirectionLabel(direction) {
  if (direction === "lower_is_better") return t("option_lower_better");
  if (direction === "target_is_best") return t("option_target_best");
  return t("option_higher_better");
}

function kpiDirectionOptions(selected) {
  var opts = ["higher_is_better", "lower_is_better", "target_is_best"];
  return opts.map(function (o) {
    return `<option value="${o}" ${selected === o ? "selected" : ""}>${kpiDirectionLabel(o)}</option>`;
  }).join("");
}

function kpiFrequencyOptions(selected) {
  var opts = ["daily", "weekly", "monthly", "quarterly"];
  return opts.map(function (o) {
    return `<option value="${o}" ${selected === o ? "selected" : ""}>${t("option_freq_" + o)}</option>`;
  }).join("");
}

function renderKpiSummaryRow(k) {
  var latest = latestKpiValue(k.id);
  var status = latest ? kpiStatus(latest.actualValue, k) : "unknown";
  return `<div class="card card-row">
    <div>
      <div class="p-name">${k.name}</div>
      <div class="p-title">${t("label_latest_value")}: ${latest ? latest.actualValue + " " + k.unit + " (" + latest.period + ")" : "—"}</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span class="tag ${kpiStatusTagClass(status)}">${kpiStatusLabel(status)}</span>
      <button class="btn-sm" onclick="openKpiDetail('${k.id}')">${t("btn_view_kpi")}</button>
    </div>
  </div>`;
}

// ─── Company Overview ───────────────────────────────────────────────────────────

function renderCompanyOverview() {
  var user = getCurrentUser();
  var activeKpis = state.kpiDefinitions.filter(function (k) { return k.status === "active"; });
  var missingCards = state.users.filter(function (u) { return u.role !== "patron" && !state.roleCards[u.id]; }).length;

  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_perf_overview")}</div>
    <div class="page-sub">${t("page_sub_perf_overview")}</div>
    <div class="section-head"><h2>${t("section_kpi_status")}</h2></div>`;
  html += activeKpis.length === 0
    ? `<div class="empty-state">${t("empty_no_kpis")}</div>`
    : activeKpis.map(renderKpiSummaryRow).join("");

  html += companyOverviewGoalSummary();
  html += companyOverviewDeptHealth();
  html += companyOverviewAlerts();

  if (missingCards > 0) {
    html += `<div class="notice notice-red" style="margin-top:16px"><div class="dot"></div><div>${tf("notice_missing_cards", { n: missingCards })}</div></div>`;
  }

  document.getElementById("main-content").innerHTML = html;
}

function companyOverviewGoalSummary() {
  var counts = { on_track: 0, at_risk: 0, achieved: 0, missed: 0 };
  state.goals.forEach(function (g) { counts[g.status] = (counts[g.status] || 0) + 1; });
  return `<div class="section-head"><h2>${t("section_goal_summary")}</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${counts.on_track}</div><div class="stat-lbl">${t("stat_goals_on_track")}</div></div>
      <div class="stat-card"><div class="stat-val">${counts.at_risk}</div><div class="stat-lbl">${t("stat_goals_at_risk")}</div></div>
      <div class="stat-card"><div class="stat-val">${counts.achieved}</div><div class="stat-lbl">${t("stat_goals_achieved")}</div></div>
      <div class="stat-card"><div class="stat-val">${counts.missed}</div><div class="stat-lbl">${t("stat_goals_missed")}</div></div>
    </div>`;
}

function companyOverviewDeptHealth() {
  var html = `<div class="section-head"><h2>${t("section_dept_health")}</h2></div>`;
  state.departments.forEach(function (d) {
    var health = departmentHealthScore(d.id);
    html += `<div class="card card-row">
      <div class="p-name">${loc(d.name)}</div>
      <div style="display:flex;gap:16px">
        <div class="dim-text">${t("label_team_size")}: ${health.memberCount}</div>
        <div class="dim-text">${t("label_task_completion")}: ${health.taskCompletionRate != null ? health.taskCompletionRate + "%" : "—"}</div>
        <div class="dim-text">${t("label_kpi_on_track_rate")}: ${health.kpiOnTrackRate != null ? health.kpiOnTrackRate + "%" : "—"}</div>
      </div>
    </div>`;
  });
  return html;
}

function companyOverviewAlerts() {
  var alerts = state.kpiAlerts.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 10);
  var html = `<div class="section-head"><h2>${t("section_recent_alerts")}</h2></div>`;
  if (alerts.length === 0) return html + `<div class="empty-state">${t("empty_no_alerts")}</div>`;
  alerts.forEach(function (a) {
    var k = state.kpiDefinitions.find(function (x) { return x.id === a.kpiDefinitionId; });
    html += `<div class="card card-row">
      <div>${k ? k.name : "—"}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${kpiStatusTagClass(a.severity)}">${kpiStatusLabel(a.severity)}</span>
        <div class="dim-text">${formatDate(a.createdAt)}</div>
      </div>
    </div>`;
  });
  return html;
}

// ─── KPI Management ─────────────────────────────────────────────────────────────

function renderKpiManagement() {
  var html = performanceSubnav(getCurrentUser()) + `
    <div class="page-title">${t("page_title_kpi_mgmt")}</div>
    <div class="page-sub">${t("page_sub_kpi_mgmt")}</div>
    <div class="section-head"><h2>${t("ptab_kpis")}</h2><button class="btn-gold" onclick="openKpiModal()">${t("btn_add_kpi")}</button></div>`;

  if (state.kpiDefinitions.length === 0) html += `<div class="empty-state">${t("empty_no_kpi_defs")}</div>`;
  state.kpiDefinitions.forEach(function (k) {
    var dept = state.departments.find(function (d) { return d.id === k.departmentId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${k.name}</div>
        <div class="p-title">${dept ? loc(dept.name) : t("label_company_wide")} · ${k.unit} · ${t("option_freq_" + k.frequency)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${k.status === "active" ? "tag-green" : "tag-gray"}">${k.status === "active" ? t("tag_kpi_active") : t("tag_kpi_inactive")}</span>
        <button class="btn-sm" onclick="openKpiModal('${k.id}')">${t("btn_edit")}</button>
        <button class="btn-sm" onclick="toggleKpiStatus('${k.id}')">${k.status === "active" ? t("btn_archive") : t("btn_activate")}</button>
        <button class="btn-sm" onclick="openKpiDetail('${k.id}')">${t("btn_view_kpi")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openKpiModal(kpiId) {
  var k = kpiId ? state.kpiDefinitions.find(function (x) { return x.id === kpiId; }) : null;
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${k ? t("modal_edit_kpi") : t("modal_new_kpi")}</h3>
    <div class="form-row"><label>${t("label_kpi_name")}</label><input class="text-input" id="f-kpi-name" value="${k ? k.name : ""}"></div>
    <div class="form-row"><label>${t("label_kpi_description")}</label><textarea class="text-input" id="f-kpi-desc">${k ? k.description || "" : ""}</textarea></div>
    <div class="form-row"><label>${t("label_kpi_unit")}</label><input class="text-input" id="f-kpi-unit" placeholder="${t("placeholder_kpi_unit")}" value="${k ? k.unit : ""}"></div>
    <div class="form-row"><label>${t("label_kpi_direction")}</label><select class="text-input" id="f-kpi-direction">${kpiDirectionOptions(k ? k.direction : "higher_is_better")}</select></div>
    <div class="form-row"><label>${t("label_kpi_department")}</label><select class="text-input" id="f-kpi-dept">${perfDepartmentOptions(k ? k.departmentId : null)}</select></div>
    <div class="form-row"><label>${t("label_target_value")}</label><input class="text-input" id="f-kpi-target" type="number" value="${k && k.targetValue != null ? k.targetValue : ""}"></div>
    <div class="form-row"><label>${t("label_warning_threshold")}</label><input class="text-input" id="f-kpi-warn" type="number" value="${k && k.warningThreshold != null ? k.warningThreshold : ""}"></div>
    <div class="form-row"><label>${t("label_critical_threshold")}</label><input class="text-input" id="f-kpi-crit" type="number" value="${k && k.criticalThreshold != null ? k.criticalThreshold : ""}"></div>
    <div class="form-row"><label>${t("label_kpi_frequency")}</label><select class="text-input" id="f-kpi-freq">${kpiFrequencyOptions(k ? k.frequency : "monthly")}</select></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveKpiDefinition(${k ? `'${k.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveKpiDefinition(kpiId) {
  var name = document.getElementById("f-kpi-name").value.trim();
  var payload = {
    name: name,
    description: document.getElementById("f-kpi-desc").value.trim(),
    unit: document.getElementById("f-kpi-unit").value.trim(),
    direction: document.getElementById("f-kpi-direction").value,
    departmentId: document.getElementById("f-kpi-dept").value || null,
    targetValue: parseNumOrNull(document.getElementById("f-kpi-target").value),
    warningThreshold: parseNumOrNull(document.getElementById("f-kpi-warn").value),
    criticalThreshold: parseNumOrNull(document.getElementById("f-kpi-crit").value),
    frequency: document.getElementById("f-kpi-freq").value,
  };

  var validation = validateKpiDefinitionPayload({ name: name });
  if (validation.errors.length) { alert(validation.errors.join("\n")); return; }

  if (kpiId) {
    Object.assign(state.kpiDefinitions.find(function (x) { return x.id === kpiId; }), payload);
  } else {
    payload.id = genId("kpi");
    payload.status = "active";
    state.kpiDefinitions.push(payload);
  }
  closeModal();
  persistState();
  window.renderMain();
}

function toggleKpiStatus(kpiId) {
  var k = state.kpiDefinitions.find(function (x) { return x.id === kpiId; });
  k.status = k.status === "active" ? "inactive" : "active";
  persistState();
  window.renderMain();
}

// ─── KPI Detail + Entry ─────────────────────────────────────────────────────────

function openKpiDetail(kpiId) {
  currentKpiId = kpiId;
  window.renderMain();
}

function closeKpiDetail() {
  currentKpiId = null;
  window.renderMain();
}

function renderKpiDetail(kpiId) {
  var user = getCurrentUser();
  var k = state.kpiDefinitions.find(function (x) { return x.id === kpiId; });
  if (!k) { currentKpiId = null; renderCompanyOverview(); return; }
  if (!canAccessKpi(user, k)) {
    document.getElementById("main-content").innerHTML = `
      <button class="btn-sm" onclick="closeKpiDetail()">${t("btn_back_to_list")}</button>
      <div class="empty-state" style="margin-top:16px">${t("access_denied")}</div>`;
    return;
  }

  var canEnter = canAccessKpi(user, k);
  var dept = state.departments.find(function (d) { return d.id === k.departmentId; });
  var values = state.kpiValues.filter(function (v) { return v.kpiDefinitionId === k.id; })
    .slice().sort(function (a, b) { return b.period.localeCompare(a.period); });

  var html = `<button class="btn-sm" onclick="closeKpiDetail()">${t("btn_back_to_list")}</button>`;
  html += `<div class="card" style="margin-top:16px">
    <div class="p-name">${k.name}</div>
    <div class="p-title">${dept ? loc(dept.name) : t("label_company_wide")}</div>
    <div style="margin-top:10px">
      ${govField(t("field_direction"), kpiDirectionLabel(k.direction))}
      ${govField(t("field_unit"), k.unit || "—")}
      ${govField(t("field_target"), k.targetValue != null ? k.targetValue : "—")}
      ${govField(t("field_warning"), k.warningThreshold != null ? k.warningThreshold : "—")}
      ${govField(t("field_critical"), k.criticalThreshold != null ? k.criticalThreshold : "—")}
      ${govField(t("field_frequency"), t("option_freq_" + k.frequency))}
    </div>
  </div>`;

  html += `<div class="section-head"><h2>${t("section_kpi_values")}</h2>${canEnter ? `<button class="btn-gold" onclick="openKpiValueModal('${k.id}')">${t("btn_add_value")}</button>` : ""}</div>`;
  if (values.length === 0) html += `<div class="empty-state">${t("empty_no_kpi_values")}</div>`;
  values.forEach(function (v) {
    var status = kpiStatus(v.actualValue, k);
    html += `<div class="card card-row">
      <div><div class="p-name">${v.period}: ${v.actualValue} ${k.unit}</div><div class="p-title">${v.notes || "—"}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${kpiStatusTagClass(status)}">${kpiStatusLabel(status)}</span>
        ${canEnter ? `<button class="btn-sm" onclick="deleteKpiValue('${v.id}')">${t("btn_delete")}</button>` : ""}
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openKpiValueModal(kpiDefId) {
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("modal_new_kpi_value")}</h3>
    <div class="form-row"><label>${t("label_period")}</label><input class="text-input" id="f-kv-period" placeholder="${t("placeholder_period")}"></div>
    <div class="form-row"><label>${t("label_actual_value")}</label><input class="text-input" id="f-kv-value" type="number"></div>
    <div class="form-row"><label>${t("label_value_notes")}</label><textarea class="text-input" id="f-kv-notes"></textarea></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveKpiValue('${kpiDefId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveKpiValue(kpiDefId) {
  var period = document.getElementById("f-kv-period").value.trim();
  var actualValue = parseNumOrNull(document.getElementById("f-kv-value").value);
  var notes = document.getElementById("f-kv-notes").value.trim();
  if (!period || actualValue == null) return;

  var valueId = genId("kpival");
  state.kpiValues.push({ id: valueId, kpiDefinitionId: kpiDefId, period: period, actualValue: actualValue, notes: notes, enteredBy: getCurrentUser().id, enteredAt: new Date().toISOString() });

  var kpiDef = state.kpiDefinitions.find(function (x) { return x.id === kpiDefId; });
  var status = kpiStatus(actualValue, kpiDef);
  if (status === "warning" || status === "critical") {
    state.kpiAlerts.push({ id: genId("kal"), kpiDefinitionId: kpiDefId, kpiValueId: valueId, severity: status, createdAt: new Date().toISOString() });
  }

  closeModal();
  persistState();
  window.renderMain();
}

function deleteKpiValue(valueId) {
  state.kpiValues = state.kpiValues.filter(function (v) { return v.id !== valueId; });
  state.kpiAlerts = state.kpiAlerts.filter(function (a) { return a.kpiValueId !== valueId; });
  persistState();
  window.renderMain();
}

// ─── Department KPIs ────────────────────────────────────────────────────────────

function renderDepartmentKpis() {
  var user = getCurrentUser();
  var depts = user.role === "mudur"
    ? state.departments.filter(function (d) { return d.id === user.departmentId; })
    : state.departments;

  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_dept_kpis")}</div>
    <div class="page-sub">${t("page_sub_dept_kpis")}</div>`;

  depts.forEach(function (d) {
    var defs = state.kpiDefinitions.filter(function (k) { return k.departmentId === d.id && k.status === "active"; });
    html += `<div class="section-head"><h2>${loc(d.name)}</h2></div>`;
    html += defs.length === 0
      ? `<div class="empty-state">${t("empty_no_dept_kpis")}</div>`
      : defs.map(renderKpiSummaryRow).join("");
  });

  document.getElementById("main-content").innerHTML = html;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function goalStatusLabel(status) { return t("goal_status_" + status); }

function goalStatusTagClass(status) {
  if (status === "achieved") return "tag-green";
  if (status === "at_risk") return "tag-amber";
  if (status === "missed") return "tag-red";
  return "tag-gold";
}

function goalStatusOptions(selected) {
  var opts = ["on_track", "at_risk", "achieved", "missed"];
  return opts.map(function (o) {
    return `<option value="${o}" ${selected === o ? "selected" : ""}>${goalStatusLabel(o)}</option>`;
  }).join("");
}

function renderGoals() {
  var user = getCurrentUser();
  var canEdit = user.role === "patron";
  var goals = user.role === "mudur"
    ? state.goals.filter(function (g) { return g.departmentId === null || g.departmentId === user.departmentId; })
    : state.goals;

  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_goals")}</div>
    <div class="page-sub">${t("page_sub_goals")}</div>`;
  if (canEdit) html += `<div class="section-head"><h2>${t("ptab_goals")}</h2><button class="btn-gold" onclick="openGoalModal()">${t("btn_add_goal")}</button></div>`;
  if (goals.length === 0) html += `<div class="empty-state">${t("empty_no_goals_list")}</div>`;

  goals.forEach(function (g) {
    var owner = state.users.find(function (u) { return u.id === g.ownerId; });
    var dept = state.departments.find(function (d) { return d.id === g.departmentId; });
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${g.title}</div>
        <div class="p-title">${owner ? owner.name : "—"} · ${dept ? loc(dept.name) : t("label_company_wide")} · ${formatDate(g.targetDate)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${goalStatusTagClass(g.status)}">${goalStatusLabel(g.status)}</span>
        <button class="btn-sm" onclick="openGoalDetail('${g.id}')">${t("btn_open")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openGoalModal(goalId) {
  var g = goalId ? state.goals.find(function (x) { return x.id === goalId; }) : null;
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${g ? t("modal_edit_goal") : t("modal_new_goal")}</h3>
    <div class="form-row"><label>${t("label_goal_title")}</label><input class="text-input" id="f-goal-title" value="${g ? g.title : ""}"></div>
    <div class="form-row"><label>${t("label_goal_owner")}</label><select class="text-input" id="f-goal-owner">${ownerSelectOptions(g ? g.ownerId : null)}</select></div>
    <div class="form-row"><label>${t("label_goal_department")}</label><select class="text-input" id="f-goal-dept">${perfDepartmentOptions(g ? g.departmentId : null)}</select></div>
    <div class="form-row"><label>${t("label_target_date")}</label><input class="text-input" id="f-goal-date" type="date" value="${g && g.targetDate ? g.targetDate : ""}"></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveGoal(${g ? `'${g.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveGoal(goalId) {
  var title = document.getElementById("f-goal-title").value.trim();
  var ownerId = document.getElementById("f-goal-owner").value || null;
  var departmentId = document.getElementById("f-goal-dept").value || null;
  var targetDate = document.getElementById("f-goal-date").value || null;

  var validation = validateGoalPayload({ title: title });
  if (validation.errors.length) { alert(validation.errors.join("\n")); return; }

  if (goalId) {
    var g = state.goals.find(function (x) { return x.id === goalId; });
    Object.assign(g, { title: title, ownerId: ownerId, departmentId: departmentId, targetDate: targetDate });
  } else {
    state.goals.push({ id: genId("goal"), title: title, ownerId: ownerId, departmentId: departmentId, targetDate: targetDate, status: "on_track", checkIns: [] });
  }
  closeModal();
  persistState();
  window.renderMain();
}

function deleteGoal(goalId) {
  if (!confirm(t("confirm_delete_goal"))) return;
  state.goals = state.goals.filter(function (x) { return x.id !== goalId; });
  currentGoalId = null;
  persistState();
  window.renderMain();
}

function openGoalDetail(goalId) {
  currentGoalId = goalId;
  window.renderMain();
}

function closeGoalDetail() {
  currentGoalId = null;
  window.renderMain();
}

function renderGoalDetail(goalId) {
  var user = getCurrentUser();
  var g = state.goals.find(function (x) { return x.id === goalId; });
  if (!g) { currentGoalId = null; renderGoals(); return; }
  var canEdit = user.role === "patron";
  var owner = state.users.find(function (u) { return u.id === g.ownerId; });
  var dept = state.departments.find(function (d) { return d.id === g.departmentId; });

  var html = `<button class="btn-sm" onclick="closeGoalDetail()">${t("btn_back_to_list")}</button>`;
  html += `<div class="card" style="margin-top:16px">
    <div class="card-row">
      <div><div class="p-name">${g.title}</div><div class="p-title">${owner ? owner.name : "—"} · ${dept ? loc(dept.name) : t("label_company_wide")} · ${formatDate(g.targetDate)}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        ${canEdit ? `<button class="btn-sm" onclick="openGoalModal('${g.id}')">${t("btn_edit")}</button>` : ""}
        ${canEdit ? `<button class="btn-sm danger" onclick="deleteGoal('${g.id}')">${t("btn_delete")}</button>` : ""}
      </div>
    </div>
    <div style="margin-top:10px">
      ${canEdit
        ? `<select class="text-input" style="width:auto" onchange="updateGoalStatus('${g.id}',this.value)">${goalStatusOptions(g.status)}</select>`
        : `<span class="tag ${goalStatusTagClass(g.status)}">${goalStatusLabel(g.status)}</span>`}
    </div>
  </div>`;

  html += `<div class="section-head"><h2>${t("section_checkins")}</h2>${canEdit ? `<button class="btn-gold" onclick="openCheckInModal('${g.id}')">${t("btn_add_checkin")}</button>` : ""}</div>`;
  var checkIns = g.checkIns.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  if (checkIns.length === 0) html += `<div class="empty-state">${t("empty_no_checkins")}</div>`;
  checkIns.forEach(function (ci) {
    var author = state.users.find(function (u) { return u.id === ci.authorId; });
    html += `<div class="card card-row"><div><div class="p-name">${ci.note}</div><div class="p-title">${author ? author.name : "—"} · ${formatDate(ci.date)}</div></div></div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function updateGoalStatus(goalId, status) {
  var g = state.goals.find(function (x) { return x.id === goalId; });
  g.status = status;
  persistState();
  window.renderMain();
}

function openCheckInModal(goalId) {
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("modal_new_checkin")}</h3>
    <div class="form-row"><label>${t("label_checkin_note")}</label><textarea class="text-input" id="f-ci-note"></textarea></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveCheckIn('${goalId}')">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveCheckIn(goalId) {
  var note = document.getElementById("f-ci-note").value.trim();
  if (!note) return;
  var g = state.goals.find(function (x) { return x.id === goalId; });
  g.checkIns.push({ id: genId("ci"), date: new Date().toISOString().slice(0, 10), note: note, authorId: getCurrentUser().id });
  closeModal();
  persistState();
  window.renderMain();
}

// ─── Scorecards ─────────────────────────────────────────────────────────────────

function scorecardStatusLabel(status) { return t("scorecard_status_" + status); }

function scorecardStatusTagClass(status) {
  if (status === "completed") return "tag-green";
  if (status === "shared") return "tag-gold";
  if (status === "in_progress") return "tag-amber";
  return "tag-gray";
}

function canViewScorecard(user, sc) {
  if (user.role === "patron") return true;
  if (sc.employeeId === user.id) return true;
  if (user.role === "mudur") {
    var emp = state.users.find(function (u) { return u.id === sc.employeeId; });
    return !!emp && emp.departmentId === user.departmentId;
  }
  return false;
}

function isScorecardReviewer(user, sc) {
  if (user.role === "patron") return true;
  if (user.role !== "mudur") return false;
  var emp = state.users.find(function (u) { return u.id === sc.employeeId; });
  return !!emp && emp.departmentId === user.departmentId;
}

function renderScorecardsList() {
  var user = getCurrentUser();
  var scorecards = user.role === "patron"
    ? state.scorecards
    : state.scorecards.filter(function (sc) { return myTeamMembers(user).some(function (u) { return u.id === sc.employeeId; }); });

  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_scorecards")}</div>
    <div class="page-sub">${t("page_sub_scorecards")}</div>
    <div class="section-head"><h2>${t("ptab_scorecards")}</h2><button class="btn-gold" onclick="openStartReviewModal()">${t("btn_start_review")}</button></div>`;
  if (scorecards.length === 0) html += `<div class="empty-state">${t("empty_no_scorecards")}</div>`;

  scorecards.forEach(function (sc) {
    var emp = state.users.find(function (u) { return u.id === sc.employeeId; });
    html += `<div class="card card-row">
      <div><div class="p-name">${emp ? emp.name : "—"}</div><div class="p-title">${sc.period}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${scorecardStatusTagClass(sc.status)}">${scorecardStatusLabel(sc.status)}</span>
        <button class="btn-sm" onclick="openScorecardDetail('${sc.id}')">${t("btn_open")}</button>
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function openStartReviewModal() {
  var user = getCurrentUser();
  var pool = user.role === "patron" ? state.users.filter(function (u) { return u.role !== "patron"; }) : myTeamMembers(user);
  var opts = pool.map(function (u) { return `<option value="${u.id}">${u.name}</option>`; }).join("");
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${t("modal_start_review")}</h3>
    <div class="form-row"><label>${t("label_employee")}</label><select class="text-input" id="f-sc-employee">${opts}</select></div>
    <div class="form-row"><label>${t("label_period")}</label><input class="text-input" id="f-sc-period" placeholder="${t("placeholder_period")}"></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveNewScorecard()">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveNewScorecard() {
  var employeeId = document.getElementById("f-sc-employee").value;
  var period = document.getElementById("f-sc-period").value.trim();
  if (!employeeId || !period) return;
  state.scorecards.push({ id: genId("sc"), employeeId: employeeId, reviewerId: getCurrentUser().id, period: period, status: "in_progress", qualitativeNotes: "", selfAssessment: "" });
  closeModal();
  persistState();
  window.renderMain();
}

function openScorecardDetail(scorecardId) {
  currentScorecardId = scorecardId;
  window.renderMain();
}

function closeScorecardDetail() {
  currentScorecardId = null;
  window.renderMain();
}

function renderScorecardDetail(scorecardId) {
  var user = getCurrentUser();
  var sc = state.scorecards.find(function (x) { return x.id === scorecardId; });
  if (!sc) { currentScorecardId = null; renderScorecardsList(); return; }
  if (!canViewScorecard(user, sc)) {
    document.getElementById("main-content").innerHTML = `
      <button class="btn-sm" onclick="closeScorecardDetail()">${t("btn_back_to_list")}</button>
      <div class="empty-state" style="margin-top:16px">${t("access_denied")}</div>`;
    return;
  }
  document.getElementById("main-content").innerHTML =
    `<button class="btn-sm" onclick="closeScorecardDetail()">${t("btn_back_to_list")}</button>` + scorecardDetailBody(sc, user);
}

function scorecardDetailBody(sc, user) {
  var emp = state.users.find(function (u) { return u.id === sc.employeeId; });
  var isReviewer = isScorecardReviewer(user, sc);
  var isSelf = sc.employeeId === user.id;

  var html = `<div class="card" style="margin-top:16px">
    <div class="card-row">
      <div><div class="p-name">${emp ? emp.name : "—"}</div><div class="p-title">${sc.period}</div></div>
      <span class="tag ${scorecardStatusTagClass(sc.status)}">${scorecardStatusLabel(sc.status)}</span>
    </div>
  </div>`;

  html += scorecardMetrics(sc);
  html += scorecardReviewerNotes(sc, isReviewer);
  html += scorecardSelfAssessment(sc, isSelf);
  html += scorecardActions(sc, isReviewer);
  return html;
}

function scorecardMetrics(sc) {
  var emp = state.users.find(function (u) { return u.id === sc.employeeId; });
  var taskRate = taskCompletionRate(sc.employeeId);
  var attendanceRate = meetingAttendanceRate(sc.employeeId);
  var kpiRate = emp ? departmentKpiOnTrackRate(emp.departmentId) : null;
  return `<div class="section-head"><h2>${t("section_computed_metrics")}</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${taskRate != null ? taskRate + "%" : "—"}</div><div class="stat-lbl">${t("label_task_completion")}</div></div>
      <div class="stat-card"><div class="stat-val">${attendanceRate != null ? attendanceRate + "%" : "—"}</div><div class="stat-lbl">${t("label_meeting_attendance")}</div></div>
      <div class="stat-card"><div class="stat-val">${kpiRate != null ? kpiRate + "%" : "—"}</div><div class="stat-lbl">${t("label_kpi_on_track_rate")}</div></div>
    </div>`;
}

function scorecardReviewerNotes(sc, isReviewer) {
  var html = `<div class="section-head"><h2>${t("section_reviewer_notes")}</h2></div>`;
  if (isReviewer) {
    html += `<div class="card">
      <textarea class="text-input" id="f-sc-notes" placeholder="${t("placeholder_reviewer_notes")}" style="min-height:80px">${sc.qualitativeNotes || ""}</textarea>
      <button class="btn-gold" style="margin-top:10px" onclick="saveScorecardNotes('${sc.id}')">${t("btn_save_notes")}</button>
    </div>`;
  } else {
    html += `<div class="card"><div class="val">${sc.qualitativeNotes || "—"}</div></div>`;
  }
  return html;
}

function saveScorecardNotes(scorecardId) {
  var sc = state.scorecards.find(function (x) { return x.id === scorecardId; });
  sc.qualitativeNotes = document.getElementById("f-sc-notes").value.trim();
  persistState();
  window.renderMain();
}

function scorecardSelfAssessment(sc, isSelf) {
  var html = `<div class="section-head" style="margin-top:18px"><h2>${t("section_self_assessment")}</h2></div>`;
  var canEditSelf = isSelf && sc.status === "shared";
  if (canEditSelf) {
    html += `<div class="card">
      <textarea class="text-input" id="f-sc-self" placeholder="${t("placeholder_self_assessment")}" style="min-height:80px">${sc.selfAssessment || ""}</textarea>
      <button class="btn-gold" style="margin-top:10px" onclick="saveSelfAssessment('${sc.id}')">${t("btn_save_self_assessment")}</button>
    </div>`;
  } else {
    html += `<div class="card"><div class="val">${sc.selfAssessment || "—"}</div></div>`;
  }
  return html;
}

function saveSelfAssessment(scorecardId) {
  var sc = state.scorecards.find(function (x) { return x.id === scorecardId; });
  sc.selfAssessment = document.getElementById("f-sc-self").value.trim();
  persistState();
  window.renderMain();
}

function scorecardActions(sc, isReviewer) {
  if (!isReviewer) return "";
  var html = `<div style="margin-top:18px;display:flex;gap:8px">`;
  if (sc.status === "in_progress") {
    html += `<button class="btn-gold" onclick="advanceScorecardStatus('${sc.id}','shared')">${t("btn_mark_shared")}</button>`;
  } else if (sc.status === "shared") {
    html += `<button class="btn-gold" onclick="advanceScorecardStatus('${sc.id}','completed')">${t("btn_mark_completed")}</button>`;
  }
  return html + `</div>`;
}

function advanceScorecardStatus(scorecardId, status) {
  var sc = state.scorecards.find(function (x) { return x.id === scorecardId; });
  sc.status = status;
  persistState();
  window.renderMain();
}

function renderMyScorecard() {
  var user = getCurrentUser();
  var mine = state.scorecards.filter(function (sc) { return sc.employeeId === user.id; });
  var latest = mine.length ? mine.slice().sort(function (a, b) { return b.period.localeCompare(a.period); })[0] : null;

  var html = `<div class="page-title">${t("page_title_my_scorecard")}</div><div class="page-sub">${t("page_sub_my_scorecard")}</div>`;
  html += latest ? scorecardDetailBody(latest, user) : `<div class="empty-state">${t("empty_no_scorecard_yet")}</div>`;
  document.getElementById("main-content").innerHTML = html;
}

// ─── Trend Analysis ─────────────────────────────────────────────────────────────

function renderTrendAnalysis() {
  var user = getCurrentUser();
  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_trends")}</div>
    <div class="page-sub">${t("page_sub_trends")}</div>`;

  var activeKpis = state.kpiDefinitions.filter(function (k) { return k.status === "active"; });
  if (activeKpis.length === 0) html += `<div class="empty-state">${t("empty_no_trend_data")}</div>`;

  activeKpis.forEach(function (k) { html += trendKpiSection(k); });
  document.getElementById("main-content").innerHTML = html;
}

function trendKpiSection(k) {
  var dept = state.departments.find(function (d) { return d.id === k.departmentId; });
  var values = state.kpiValues.filter(function (v) { return v.kpiDefinitionId === k.id; })
    .slice().sort(function (a, b) { return a.period.localeCompare(b.period); });
  var html = `<div class="section-head"><h2>${k.name} · ${dept ? loc(dept.name) : t("label_company_wide")}</h2></div>`;
  if (values.length === 0) return html + `<div class="empty-state">${t("empty_no_kpi_values")}</div>`;
  values.forEach(function (v) {
    var status = kpiStatus(v.actualValue, k);
    html += `<div class="card card-row">
      <div>${v.period}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div>${v.actualValue} ${k.unit}</div>
        <span class="tag ${kpiStatusTagClass(status)}">${kpiStatusLabel(status)}</span>
      </div>
    </div>`;
  });
  return html;
}

// ─── Reports (CSV export) ───────────────────────────────────────────────────────

function renderReports() {
  var user = getCurrentUser();
  var html = performanceSubnav(user) + `
    <div class="page-title">${t("page_title_reports")}</div>
    <div class="page-sub">${t("page_sub_reports")}</div>
    <div class="notice notice-amber"><div class="dot"></div><div>${t("notice_pdf_deferred")}</div></div>
    <div class="section-head"><h2>${t("section_reports")}</h2></div>
    <div class="card card-row"><div class="p-name">${t("btn_export_kpi_summary")}</div><button class="btn-gold" onclick="exportKpiSummaryCsv()">${t("btn_export")}</button></div>
    <div class="card card-row"><div class="p-name">${t("btn_export_dept_performance")}</div><button class="btn-gold" onclick="exportDeptPerformanceCsv()">${t("btn_export")}</button></div>
    <div class="card card-row"><div class="p-name">${t("btn_export_goal_status")}</div><button class="btn-gold" onclick="exportGoalStatusCsv()">${t("btn_export")}</button></div>`;
  document.getElementById("main-content").innerHTML = html;
}

function csvEscape(val) {
  var s = String(val == null ? "" : val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function downloadCsv(filename, rows) {
  var csv = rows.map(function (row) { return row.map(csvEscape).join(","); }).join("\r\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportKpiSummaryCsv() {
  var user = getCurrentUser();
  var defs = user.role === "mudur" ? state.kpiDefinitions.filter(function (k) { return k.departmentId === user.departmentId; }) : state.kpiDefinitions;
  var rows = [[t("csv_header_name"), t("csv_header_department"), t("csv_header_unit"), t("csv_header_direction"), t("csv_header_target"), t("csv_header_latest_period"), t("csv_header_latest_value"), t("csv_header_status")]];
  defs.forEach(function (k) {
    var dept = state.departments.find(function (d) { return d.id === k.departmentId; });
    var latest = latestKpiValue(k.id);
    rows.push([
      k.name, dept ? loc(dept.name) : t("label_company_wide"), k.unit, kpiDirectionLabel(k.direction),
      k.targetValue != null ? k.targetValue : "", latest ? latest.period : "", latest ? latest.actualValue : "",
      latest ? kpiStatusLabel(kpiStatus(latest.actualValue, k)) : kpiStatusLabel("unknown"),
    ]);
  });
  downloadCsv("kpi-summary.csv", rows);
}

function exportDeptPerformanceCsv() {
  var user = getCurrentUser();
  var depts = user.role === "mudur" ? state.departments.filter(function (d) { return d.id === user.departmentId; }) : state.departments;
  var rows = [[t("csv_header_department"), t("csv_header_team_size"), t("csv_header_task_completion"), t("csv_header_kpi_on_track")]];
  depts.forEach(function (d) {
    var health = departmentHealthScore(d.id);
    rows.push([loc(d.name), health.memberCount, health.taskCompletionRate != null ? health.taskCompletionRate : "", health.kpiOnTrackRate != null ? health.kpiOnTrackRate : ""]);
  });
  downloadCsv("department-performance.csv", rows);
}

function exportGoalStatusCsv() {
  var user = getCurrentUser();
  var goals = user.role === "mudur" ? state.goals.filter(function (g) { return g.departmentId === user.departmentId; }) : state.goals;
  var rows = [[t("csv_header_title"), t("csv_header_owner"), t("csv_header_department"), t("csv_header_target_date"), t("csv_header_status")]];
  goals.forEach(function (g) {
    var owner = state.users.find(function (u) { return u.id === g.ownerId; });
    var dept = state.departments.find(function (d) { return d.id === g.departmentId; });
    rows.push([g.title, owner ? owner.name : "", dept ? loc(dept.name) : t("label_company_wide"), g.targetDate || "", goalStatusLabel(g.status)]);
  });
  downloadCsv("goal-status.csv", rows);
}
