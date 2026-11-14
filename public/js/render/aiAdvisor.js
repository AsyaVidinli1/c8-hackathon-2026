// Which sub-screen of the AI Advisor tab is active, and the insight severity filter
// for the Insights feed. Executive Assistant keeps its last-picked question so the
// answer stays visible after a language switch or nav round-trip.
var currentAiView = "insights";
var currentInsightFilter = "all";
var currentAssistantQuestion = null;

// ─── Entry point + sub-navigation ─────────────────────────────────────────────

function renderAiAdvisor() {
  var user = getCurrentUser();
  if (currentAiView === "actions") { renderSuggestedActions(user); return; }
  if (currentAiView === "assistant") { renderExecutiveAssistant(user); return; }
  if (currentAiView === "brief") { renderHealthBrief(user); return; }
  renderAiInsights(user);
}

function switchAiView(view) {
  currentAiView = view;
  window.renderMain();
}

function aiSubnav() {
  var tabs = [
    ["insights", t("aitab_insights")],
    ["actions", t("aitab_actions")],
    ["assistant", t("aitab_assistant")],
    ["brief", t("aitab_brief")],
  ];
  var buttons = tabs.map(function (entry) {
    return `<button class="subtab ${entry[0] === currentAiView ? "active" : ""}" onclick="switchAiView('${entry[0]}')">${entry[1]}</button>`;
  }).join("");
  return `<div class="subtab-bar">${buttons}</div>`;
}

// ─── Dashboard widget (reuses visibleAIInsights — no separate computation) ────────

function renderAiDashboardWidget(user) {
  if (!state.aiSettings.featuresEnabled.insights) return "";
  var items = visibleAIInsights(user);
  var criticalCount = items.filter(function (i) { return i.severity === "critical"; }).length;
  var openCount = items.filter(function (i) { return !isInsightConverted(i.id); }).length;
  return `<div class="section-head"><h2>${t("widget_ai_advisor")}</h2></div>
    <div class="card card-row">
      <div>
        <div class="p-title">${tf("widget_ai_critical", { n: criticalCount })}</div>
        <div class="p-title">${tf("widget_ai_open_actions", { n: openCount })}</div>
      </div>
      <button class="btn-sm" onclick="window.switchTab('ai')">${t("btn_go_to_ai_advisor")}</button>
    </div>`;
}

// ─── AI Insights ────────────────────────────────────────────────────────────────
// Blueprint tabs are "All / Risks / Recommendations / Trends" — none of the four
// structured signals in PRODUCT_BLUEPRINT_V2.md §5.8 actually produce a "trend" or a
// distinct "recommendation" type (recommendations live on the Suggested Actions
// screen instead), so a severity-based filter (All/Critical/Warning) is used here
// instead of forcing a taxonomy the underlying signals don't support.

function renderAiInsights(user) {
  var html = aiSubnav() + `
    <div class="page-title">${t("page_title_ai_insights")}</div>
    <div class="page-sub">${t("page_sub_ai_insights")}</div>`;

  if (!state.aiSettings.featuresEnabled.insights) {
    html += `<div class="notice notice-amber"><div class="dot"></div><div>${t("notice_ai_feature_disabled")}</div></div>`;
    document.getElementById("main-content").innerHTML = html;
    return;
  }

  var all = visibleAIInsights(user);
  var filterTabs = [["all", t("filter_all")], ["critical", t("filter_critical")], ["warning", t("filter_warning")]];
  html += `<div class="subtab-bar">` + filterTabs.map(function (f) {
    return `<button class="subtab ${f[0] === currentInsightFilter ? "active" : ""}" onclick="setInsightFilter('${f[0]}')">${f[1]}</button>`;
  }).join("") + `</div>`;

  var items = currentInsightFilter === "all" ? all : all.filter(function (i) { return i.severity === currentInsightFilter; });

  if (items.length === 0) html += `<div class="empty-state">${t("empty_no_insights")}</div>`;

  items.forEach(function (insight) {
    html += `<div class="card card-row">
      <div>
        <div class="p-name">${insight.title}</div>
        <div class="p-title">${insightTypeLabel(insight.type)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${insightSeverityTagClass(insight.severity)}">${t("severity_" + insight.severity)}</span>
        ${user.role === "patron" ? `<button class="btn-sm" onclick="dismissInsight('${insight.id}')">${t("btn_dismiss")}</button>` : ""}
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function setInsightFilter(filter) {
  currentInsightFilter = filter;
  window.renderMain();
}

function dismissInsight(insightId) {
  if (!state.dismissedInsightIds.includes(insightId)) state.dismissedInsightIds.push(insightId);
  persistState();
  window.renderMain();
}

// ─── Suggested Actions ────────────────────────────────────────────────────────────

function renderSuggestedActions(user) {
  var html = aiSubnav() + `
    <div class="page-title">${t("page_title_suggested_actions")}</div>
    <div class="page-sub">${t("page_sub_suggested_actions")}</div>`;

  if (!state.aiSettings.featuresEnabled.suggestedActions) {
    html += `<div class="notice notice-amber"><div class="dot"></div><div>${t("notice_ai_feature_disabled")}</div></div>`;
    document.getElementById("main-content").innerHTML = html;
    return;
  }

  var items = visibleAIInsights(user);
  if (items.length === 0) html += `<div class="empty-state">${t("empty_no_suggested_actions")}</div>`;

  items.forEach(function (insight) {
    var converted = isInsightConverted(insight.id);
    var assignee = state.users.find(function (u) { return u.id === insight.recommendedAction.assigneeId; });
    html += `<div class="card">
      <div class="p-name">${insight.title}</div>
      <div class="p-title" style="margin-top:4px">${t("label_recommended_action")}: ${insight.recommendedAction.title}</div>
      <div class="p-title">${t("label_suggested_assignee")}: ${assignee ? assignee.name : t("option_unassigned")}</div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
        <span class="tag ${insightSeverityTagClass(insight.severity)}">${t("severity_" + insight.severity)}</span>
        ${converted
          ? `<span class="tag tag-green">${t("tag_converted")}</span>`
          : `<button class="btn-gold" onclick="convertInsightToTask('${insight.id}')">${t("btn_convert_to_task")}</button>`}
      </div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function convertInsightToTask(insightId) {
  if (isInsightConverted(insightId)) return;
  var insight = computeAIInsights().find(function (i) { return i.id === insightId; });
  if (!insight) return;
  state.tasks.push({
    id: genId("t"), employeeId: insight.recommendedAction.assigneeId, title: insight.recommendedAction.title,
    description: "", due: null, dueAt: null, status: "todo", priority: insight.severity === "critical" ? "high" : "medium",
    source: insight.recommendedAction.taskSourceType, sourceId: insight.id, createdAt: new Date().toISOString(),
  });
  persistState();
  window.renderMain();
}

// ─── Executive Assistant ────────────────────────────────────────────────────────

function renderExecutiveAssistant(user) {
  var html = aiSubnav() + `
    <div class="page-title">${t("page_title_assistant")}</div>
    <div class="page-sub">${t("page_sub_assistant")}</div>`;

  if (!state.aiSettings.featuresEnabled.executiveAssistant) {
    html += `<div class="notice notice-amber"><div class="dot"></div><div>${t("notice_ai_feature_disabled")}</div></div>`;
    document.getElementById("main-content").innerHTML = html;
    return;
  }

  var options = ASSISTANT_QUESTIONS.map(function (key) {
    return `<option value="${key}" ${currentAssistantQuestion === key ? "selected" : ""}>${t("question_" + key)}</option>`;
  }).join("");

  html += `
    <div class="form-row" style="max-width:480px">
      <select class="text-input" id="f-assistant-question">${options}</select>
    </div>
    <button class="btn-gold" onclick="askAssistantQuestion()">${t("btn_ask")}</button>`;

  if (currentAssistantQuestion) {
    var answer = answerAssistantQuestion(currentAssistantQuestion, user);
    html += `<div class="card" style="margin-top:16px">
      <div class="p-name">${t("question_" + currentAssistantQuestion)}</div>
      <div class="val" style="margin-top:8px">${answer}</div>
    </div>`;
  }

  var history = state.assistantQueries
    .filter(function (q) { return q.askedBy === user.id; })
    .slice().sort(function (a, b) { return b.askedAt.localeCompare(a.askedAt); })
    .slice(0, 10);

  html += `<div class="section-head"><h2>${t("section_assistant_history")}</h2></div>`;
  if (history.length === 0) html += `<div class="empty-state">${t("empty_no_assistant_history")}</div>`;
  history.forEach(function (q) {
    html += `<div class="card">
      <div class="p-name">${q.questionText}</div>
      <div class="p-title" style="margin-top:4px">${q.answerText}</div>
      <div class="dim-text" style="margin-top:6px">${formatDateTime(q.askedAt)}</div>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function askAssistantQuestion() {
  var user = getCurrentUser();
  var templateKey = document.getElementById("f-assistant-question").value;
  currentAssistantQuestion = templateKey;
  var answerText = answerAssistantQuestion(templateKey, user);
  state.assistantQueries.push({
    id: genId("aq"), templateKey: templateKey, questionText: t("question_" + templateKey),
    answerText: answerText, askedBy: user.id, departmentScope: user.departmentId, askedAt: new Date().toISOString(),
  });
  persistState();
  window.renderMain();
}

// ─── Company Health Brief ────────────────────────────────────────────────────────

function renderHealthBrief(user) {
  var html = aiSubnav() + `
    <div class="page-title">${t("page_title_health_brief")}</div>
    <div class="page-sub">${t("page_sub_health_brief")}</div>`;

  if (!state.aiSettings.featuresEnabled.healthBrief) {
    html += `<div class="notice notice-amber"><div class="dot"></div><div>${t("notice_ai_feature_disabled")}</div></div>`;
    document.getElementById("main-content").innerHTML = html;
    return;
  }

  if (user.role === "patron") {
    html += `<button class="btn-gold" onclick="regenerateHealthBrief()">${t("btn_regenerate_brief")}</button>`;
  }

  var latest = state.healthBriefs.slice().sort(function (a, b) { return b.generatedAt.localeCompare(a.generatedAt); })[0];

  if (!latest) {
    html += `<div class="empty-state" style="margin-top:16px">${t("empty_no_brief")}</div>`;
    document.getElementById("main-content").innerHTML = html;
    return;
  }

  html += `<div class="dim-text" style="margin:10px 0">${tf("label_brief_generated_at", { date: formatDateTime(latest.generatedAt) })}</div>`;
  html += `<div class="card"><div class="lbl">${t("field_executive_summary")}</div><div class="val" style="margin-top:6px">${latest.executiveSummary}</div></div>`;
  html += briefListSection(t("field_biggest_risk"), [latest.biggestRisk]);
  html += briefListSection(t("field_biggest_improvement"), [latest.biggestImprovement]);
  html += briefListSection(t("field_suggested_priorities"), latest.suggestedPriorities);
  html += briefListSection(t("field_improved"), latest.improved);
  html += briefListSection(t("field_declined"), latest.declined);
  html += briefListSection(t("field_top_open_items"), latest.topOpenItems);

  document.getElementById("main-content").innerHTML = html;
}

function briefListSection(label, items) {
  var body = (items && items.length) ? items.map(function (x) { return "• " + x; }).join("<br>") : "—";
  return `<div class="field-block"><div class="lbl">${label}</div><div class="val">${body}</div></div>`;
}

function regenerateHealthBrief() {
  var brief = generateHealthBrief();
  state.healthBriefs.push(Object.assign({ id: genId("snap"), generatedAt: new Date().toISOString() }, brief));
  persistState();
  window.renderMain();
}
