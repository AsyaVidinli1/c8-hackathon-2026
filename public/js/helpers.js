function initials(name) {
  return name
    .split(" ")
    .map(function (p) { return p[0]; })
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isOwnerRole(role) {
  return role === "patron";
}

function userDept(user) {
  return state.departments.find(function (d) { return d.id === user.departmentId; });
}

function employeeManager(user) {
  return state.users.find(function (u) { return u.id === user.managerId; }) || null;
}

function deptEmployees(depId) {
  return state.users.filter(function (u) { return u.departmentId === depId; });
}

function myTeamMembers(me) {
  return state.users.filter(function (u) {
    return u.departmentId === me.departmentId && u.id !== me.id;
  });
}

function directReports(managerId) {
  return state.users.filter(function (u) {
    return u.managerId === managerId;
  });
}

function validateEmployeePayload(payload, options) {
  var opts = options || {};
  var errors = [];
  var warnings = [];
  var employeeId = opts.employeeId || null;

  if (!payload.name) errors.push(t("validation_name_required"));
  if (!payload.email) errors.push(t("validation_email_required"));
  if (!isOwnerRole(payload.role) && !payload.departmentId) {
    errors.push(t("validation_department_required"));
  }
  if (employeeId && payload.managerId && employeeId === payload.managerId) {
    errors.push(t("validation_self_manager"));
  }
  if (payload.managerId) {
    var manager = state.users.find(function (u) { return u.id === payload.managerId; });
    if (!manager) errors.push(t("validation_manager_invalid"));
  }
  if (!isOwnerRole(payload.role) && !payload.managerId) {
    warnings.push(t("warning_manager_missing_save"));
  }

  return { errors: errors, warnings: warnings };
}

function employeesMissingManager() {
  return state.users.filter(function (u) {
    return !isOwnerRole(u.role) && !u.managerId;
  });
}

function employeesMissingDepartment() {
  return state.users.filter(function (u) {
    return !isOwnerRole(u.role) && !u.departmentId;
  });
}

function roleLabel(role) {
  return role === "patron" ? t("role_patron") : role === "mudur" ? t("role_mudur") : t("role_calisan");
}

function roleTagClass(role) {
  return role === "patron" ? "tag-navy" : role === "mudur" ? "tag-gold" : "tag-gray";
}

function statusLabel(status) {
  return t("status_" + status);
}

function statusTagClass(status) {
  if (status === "done") return "tag-green";
  if (status === "in_progress") return "tag-gold";
  if (status === "blocked") return "tag-red";
  return "tag-gray";
}

function priorityLabel(priority) {
  return t("priority_" + priority);
}

function priorityTagClass(priority) {
  if (priority === "critical") return "tag-red";
  if (priority === "high") return "tag-amber";
  if (priority === "low") return "tag-gray";
  return "tag-gold";
}

function validateTaskPayload(payload) {
  var errors = [];
  if (!payload.title) errors.push(t("validation_task_title_required"));
  return { errors: errors, warnings: [] };
}

function formatDateTime(iso) {
  if (!iso) return "—";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  var locale = state.lang === "en" ? "en-US" : "tr-TR";
  return d.toLocaleDateString(locale) + " · " + d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "—";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(state.lang === "en" ? "en-US" : "tr-TR");
}

function taskDueDisplay(task) {
  return task.dueAt ? formatDate(task.dueAt) : loc(task.due);
}

function kpiStatus(value, kpiDef) {
  if (value == null) return "unknown";
  var warn = kpiDef.warningThreshold;
  var crit = kpiDef.criticalThreshold;
  if (warn == null && crit == null) return "unknown";

  if (kpiDef.direction === "lower_is_better") {
    if (crit != null && value >= crit) return "critical";
    if (warn != null && value >= warn) return "warning";
    return "on_track";
  }
  if (kpiDef.direction === "target_is_best") {
    if (kpiDef.targetValue == null) return "unknown";
    var deviation = Math.abs(value - kpiDef.targetValue);
    if (crit != null && deviation >= crit) return "critical";
    if (warn != null && deviation >= warn) return "warning";
    return "on_track";
  }
  // higher_is_better (default)
  if (crit != null && value <= crit) return "critical";
  if (warn != null && value <= warn) return "warning";
  return "on_track";
}

function kpiStatusLabel(status) {
  return t("kpi_status_" + status);
}

function kpiStatusTagClass(status) {
  if (status === "on_track") return "tag-green";
  if (status === "warning") return "tag-amber";
  if (status === "critical") return "tag-red";
  return "tag-gray";
}

function latestKpiValue(kpiDefId) {
  var values = state.kpiValues.filter(function (v) { return v.kpiDefinitionId === kpiDefId; });
  if (values.length === 0) return null;
  return values.slice().sort(function (a, b) { return b.period.localeCompare(a.period); })[0];
}

function validateKpiDefinitionPayload(payload) {
  var errors = [];
  if (!payload.name) errors.push(t("validation_kpi_name_required"));
  return { errors: errors, warnings: [] };
}

function validateGoalPayload(payload) {
  var errors = [];
  if (!payload.title) errors.push(t("validation_goal_title_required"));
  return { errors: errors, warnings: [] };
}

function taskCompletionRate(employeeId) {
  var tasks = state.tasks.filter(function (task) { return task.employeeId === employeeId; });
  if (tasks.length === 0) return null;
  var done = tasks.filter(function (task) { return task.status === "done"; }).length;
  return Math.round((done / tasks.length) * 100);
}

function meetingAttendanceRate(employeeId) {
  var invited = state.meetingOccurrences.filter(function (o) {
    return o.status === "completed" && o.participantIds.includes(employeeId);
  });
  if (invited.length === 0) return null;
  // Approximation: no real attendance-taking exists yet, so every invited
  // participant of a completed meeting counts as attended.
  return 100;
}

function departmentKpiOnTrackRate(departmentId) {
  var defs = state.kpiDefinitions.filter(function (k) { return k.departmentId === departmentId && k.status === "active"; });
  if (defs.length === 0) return null;
  var onTrack = defs.filter(function (k) {
    var latest = latestKpiValue(k.id);
    return latest && kpiStatus(latest.actualValue, k) === "on_track";
  }).length;
  return Math.round((onTrack / defs.length) * 100);
}

// ─── Knowledge module helpers ──────────────────────────────────────────────────

function validateDocumentPayload(payload) {
  var errors = [];
  if (!payload.title) errors.push(t("validation_document_title_required"));
  return { errors: errors, warnings: [] };
}

function validatePolicyPayload(payload) {
  var errors = [];
  if (!payload.title) errors.push(t("validation_policy_title_required"));
  if (!payload.body) errors.push(t("validation_policy_body_required"));
  return { errors: errors, warnings: [] };
}

function documentCategoryLabel(cat) { return t("doc_cat_" + cat); }

function documentCategoryTagClass(cat) {
  if (cat === "template") return "tag-gold";
  if (cat === "contract") return "tag-navy";
  if (cat === "report") return "tag-green";
  return "tag-gray";
}

function policyCategoryLabel(cat) { return t("pol_cat_" + cat); }

function policyStatusLabel(status) { return t("pol_status_" + status); }

function policyStatusTagClass(status) {
  if (status === "active") return "tag-green";
  if (status === "archived") return "tag-gray";
  return "tag-amber";
}

// Family-category policies are visible to the Owner (patron) only, mirroring the
// blueprint's family-governance visibility rule even though that module isn't built yet.
function visiblePolicies(user) {
  return state.policies.filter(function (p) {
    return p.category !== "family" || user.role === "patron";
  });
}

function validateHandbookSectionPayload(payload) {
  var errors = [];
  if (!payload.title) errors.push(t("validation_handbook_title_required"));
  return { errors: errors, warnings: [] };
}

// Rule-based meeting summary generator. There is no LLM integration in the prototype
// (no backend to safely hold an API key) — this deterministically derives the summary
// from data already recorded on the occurrence, agenda, decisions, and action items.
function generateMeetingSummary(occurrence) {
  var keyPoints = (occurrence.agendaItems || [])
    .slice()
    .sort(function (a, b) { return a.order - b.order; })
    .map(function (item) { return item.title; });
  if (occurrence.notes) keyPoints.push(occurrence.notes);

  var decisionIds = state.meetingDecisions
    .filter(function (d) { return d.occurrenceId === occurrence.id; })
    .map(function (d) { return d.id; });

  var actionItemIds = state.tasks
    .filter(function (task) { return task.source === "meeting" && task.sourceId === occurrence.id; })
    .map(function (task) { return task.id; });

  return { keyPoints: keyPoints, decisionIds: decisionIds, actionItemIds: actionItemIds };
}

function knowledgeSearchResults(query, user) {
  var q = (query || "").trim().toLowerCase();
  if (!q) return { documents: [], policies: [], handbookSections: [] };

  var documents = state.documents.filter(function (d) {
    return d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q);
  });
  var policies = visiblePolicies(user).filter(function (p) {
    return p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
  });
  var handbookSections = state.handbookSections.filter(function (h) {
    return h.title.toLowerCase().includes(q) || h.body.toLowerCase().includes(q);
  });

  return { documents: documents, policies: policies, handbookSections: handbookSections };
}

function departmentHealthScore(departmentId) {
  var members = deptEmployees(departmentId);
  var rates = members.map(function (u) { return taskCompletionRate(u.id); }).filter(function (r) { return r != null; });
  var avgTaskCompletion = rates.length ? Math.round(rates.reduce(function (a, b) { return a + b; }, 0) / rates.length) : null;
  return {
    memberCount: members.length,
    taskCompletionRate: avgTaskCompletion,
    kpiOnTrackRate: departmentKpiOnTrackRate(departmentId),
  };
}

// ─── AI module helpers ──────────────────────────────────────────────────────────

function isTaskOverdue(task) {
  if (!task.dueAt || task.status === "done") return false;
  return new Date(task.dueAt) < new Date(new Date().toDateString());
}

function departmentOverdueRate(departmentId) {
  var memberIds = deptEmployees(departmentId).map(function (u) { return u.id; });
  var deptTasks = state.tasks.filter(function (task) { return memberIds.includes(task.employeeId); });
  if (deptTasks.length === 0) return null;
  var overdue = deptTasks.filter(isTaskOverdue).length;
  return Math.round((overdue / deptTasks.length) * 100);
}

function employeesMissingRoleProfile() {
  return state.users.filter(function (u) { return u.role !== "patron" && !state.roleCards[u.id]; });
}

// Determines the most recently *completed* review period (not the in-progress one) —
// matches the blueprint's own phrasing ("Q2 reviews have not been started"), and avoids
// flagging every employee as non-compliant on day one of a freshly-started period.
function currentScorecardPeriod() {
  var freq = state.company.scorecardFrequency || "quarterly";
  var now = new Date();
  if (freq === "monthly") {
    var d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  if (freq === "annual") {
    return String(now.getFullYear() - 1);
  }
  var q = Math.floor(now.getMonth() / 3) + 1;
  var year = now.getFullYear();
  var prevQ = q - 1;
  if (prevQ < 1) { prevQ = 4; year -= 1; }
  return year + "-Q" + prevQ;
}

function employeesMissingScorecard(period) {
  var have = state.scorecards.filter(function (sc) { return sc.period === period; }).map(function (sc) { return sc.employeeId; });
  return state.users.filter(function (u) { return u.role !== "patron" && !have.includes(u.id); });
}

function severityRank(sev) {
  return sev === "critical" ? 0 : sev === "warning" ? 1 : 2;
}

// Structured signals (rule-based, no LLM) — computed live from current state on every
// call rather than stored, per the Performance Guidelines rule against persisting derived
// data. Each insight gets a deterministic id so dismissal (state.dismissedInsightIds) and
// convert-to-task tracking (checked via state.tasks.some(t => t.sourceId === insight.id))
// both survive recomputation without needing their own stored records.
function computeAIInsights() {
  var insights = [];
  if (!state.aiSettings.featuresEnabled.insights) return insights;
  var owner = state.users.find(function (u) { return u.role === "patron"; });

  employeesMissingRoleProfile().forEach(function (u) {
    var manager = employeeManager(u) || owner;
    insights.push({
      id: "ai-gov-" + u.id, type: "governance_gap", severity: "warning",
      title: tf("insight_governance_gap", { name: u.name }),
      departmentId: u.departmentId, sourceId: u.id,
      recommendedAction: {
        title: tf("action_complete_role_profile", { name: u.name }),
        assigneeId: manager ? manager.id : null, taskSourceType: "governance",
      },
    });
  });

  var latestAlertByKpi = {};
  state.kpiAlerts.forEach(function (a) {
    var existing = latestAlertByKpi[a.kpiDefinitionId];
    if (!existing || a.createdAt > existing.createdAt) latestAlertByKpi[a.kpiDefinitionId] = a;
  });
  Object.keys(latestAlertByKpi).forEach(function (kpiDefId) {
    var alert = latestAlertByKpi[kpiDefId];
    var kpiDef = state.kpiDefinitions.find(function (k) { return k.id === kpiDefId; });
    if (!kpiDef) return;
    var dept = kpiDef.departmentId ? state.departments.find(function (d) { return d.id === kpiDef.departmentId; }) : null;
    var manager = dept ? state.users.find(function (u) { return u.id === dept.managerId; }) : owner;
    insights.push({
      id: "ai-kpi-" + kpiDefId, type: "kpi_anomaly", severity: alert.severity,
      title: tf("insight_kpi_anomaly", { name: kpiDef.name, status: kpiStatusLabel(alert.severity) }),
      departmentId: kpiDef.departmentId, sourceId: kpiDefId,
      recommendedAction: {
        title: tf("action_address_kpi", { name: kpiDef.name }),
        assigneeId: manager ? manager.id : null, taskSourceType: "kpi",
      },
    });
  });

  state.departments.forEach(function (d) {
    var rate = departmentOverdueRate(d.id);
    if (rate === null || rate <= 0) return;
    var manager = state.users.find(function (u) { return u.id === d.managerId; });
    insights.push({
      id: "ai-exec-" + d.id, type: "execution_health", severity: rate >= 50 ? "critical" : "warning",
      title: tf("insight_execution_health", { dept: loc(d.name), rate: rate }),
      departmentId: d.id, sourceId: d.id,
      recommendedAction: {
        title: tf("action_followup_department", { dept: loc(d.name) }),
        assigneeId: manager ? manager.id : null, taskSourceType: "governance",
      },
    });
  });

  var period = currentScorecardPeriod();
  state.departments.forEach(function (d) {
    var missing = employeesMissingScorecard(period).filter(function (u) { return u.departmentId === d.id; });
    if (missing.length === 0) return;
    var manager = state.users.find(function (u) { return u.id === d.managerId; });
    insights.push({
      id: "ai-sc-" + d.id, type: "scorecard_completion", severity: "warning",
      title: tf("insight_scorecard_completion", { dept: loc(d.name), n: missing.length, period: period }),
      departmentId: d.id, sourceId: d.id,
      recommendedAction: {
        title: tf("action_complete_scorecards", { dept: loc(d.name), n: missing.length }),
        assigneeId: manager ? manager.id : null, taskSourceType: "governance",
      },
    });
  });

  return insights.sort(function (a, b) { return severityRank(a.severity) - severityRank(b.severity); });
}

function visibleAIInsights(user) {
  var all = computeAIInsights().filter(function (i) { return !state.dismissedInsightIds.includes(i.id); });
  if (user.role === "patron") return all;
  if (user.role === "mudur") return all.filter(function (i) { return i.departmentId === user.departmentId; });
  return [];
}

function isInsightConverted(insightId) {
  return state.tasks.some(function (task) { return task.sourceId === insightId; });
}

function insightTypeLabel(type) { return t("insight_type_" + type); }

function insightSeverityTagClass(severity) {
  if (severity === "critical") return "tag-red";
  if (severity === "warning") return "tag-amber";
  return "tag-gray";
}

// Rule-based role profile drafter. No LLM integration point exists in the prototype
// (no backend to safely hold an API key) — this pulls from an existing peer profile in
// the same department when one exists, or a generic template keyed by nothing more than
// role level, and is disclosed to the user as such rather than presented as real AI output.
function draftRoleProfile(user) {
  var candidates = deptEmployees(user.departmentId).filter(function (u) {
    return u.id !== user.id && state.roleCards[u.id];
  });
  // Prefer a peer with the same title (same job level) over any department member —
  // a manager's role profile is a poor template for an individual-contributor role.
  var sameTitlePeer = candidates.find(function (u) { return loc(u.title) === loc(user.title); });
  var peers = sameTitlePeer ? [sameTitlePeer] : candidates;
  if (peers.length > 0) {
    var template = state.roleCards[peers[0].id];
    return {
      mission: template.mission,
      responsibilities: (template.responsibilities || []).slice(),
      authorities: template.authorities,
      decisionRights: template.decisionRights,
      approvalRules: template.approvalRules,
    };
  }
  return {
    mission: tf("draft_generic_mission", { title: loc(user.title) }),
    responsibilities: [t("draft_generic_resp_1"), t("draft_generic_resp_2"), t("draft_generic_resp_3")],
    authorities: t("draft_generic_authorities"),
    decisionRights: t("draft_generic_decision_rights"),
    approvalRules: t("draft_generic_approval_rules"),
  };
}

// Rule-based Company Health Brief. Generated on demand (no background job runner exists
// in a browser-only prototype) — combines existing structured signals into an
// executive-summary paragraph via string templating. No LLM involved.
function generateHealthBrief() {
  var insights = computeAIInsights().filter(function (i) { return !state.dismissedInsightIds.includes(i.id); });

  var declined = insights.map(function (i) { return i.title; });
  var improved = [];
  state.kpiDefinitions.forEach(function (k) {
    var latest = latestKpiValue(k.id);
    if (latest && kpiStatus(latest.actualValue, k) === "on_track" && state.kpiAlerts.some(function (a) { return a.kpiDefinitionId === k.id; })) {
      improved.push(tf("brief_kpi_recovered", { name: k.name }));
    }
  });
  state.goals.forEach(function (g) {
    if (g.status === "achieved") improved.push(tf("brief_goal_achieved", { title: g.title }));
  });

  var biggestRisk = insights.length ? insights[0].title : t("brief_no_risks");
  var biggestImprovement = improved.length ? improved[0] : t("brief_no_improvement");

  var suggestedPriorities = insights
    .filter(function (i) { return !isInsightConverted(i.id); })
    .slice(0, 3)
    .map(function (i) { return i.recommendedAction.title; });

  var topOpenItems = state.tasks
    .filter(function (task) { return task.status !== "done" && (task.priority === "high" || task.priority === "critical"); })
    .slice(0, 5)
    .map(function (task) { return loc(task.title); });

  var executiveSummary = tf("brief_executive_summary", {
    riskCount: insights.length,
    biggestRisk: biggestRisk,
    biggestImprovement: biggestImprovement,
    priorityCount: suggestedPriorities.length,
    topPriority: suggestedPriorities.length ? suggestedPriorities[0] : t("brief_none"),
  });

  return {
    improved: improved, declined: declined,
    biggestRisk: biggestRisk, biggestImprovement: biggestImprovement,
    suggestedPriorities: suggestedPriorities, topOpenItems: topOpenItems,
    executiveSummary: executiveSummary,
  };
}

// ─── Executive Assistant: rule-based question templates ───────────────────────────
// Per PRODUCT_BLUEPRINT_V2.md §5.8: "structured question templates — not open-ended
// RAG." Every answer below is a deterministic query over existing state, formatted as
// text. No LLM call is made or implied anywhere in this module.

var ASSISTANT_QUESTIONS = [
  "today_attention", "underperforming_depts", "critical_kpis", "goals_at_risk",
  "meetings_unresolved_actions", "employees_overdue_tasks", "changed_this_week",
  "policies_updated_recently", "depts_missing_scorecards", "today_priority_risks",
  "missing_role_profiles", "decisions_last_30_days", "most_overdue_employee",
  "my_open_action_items",
];

function scopedDepartments(user) {
  if (user.role === "patron") return state.departments;
  return state.departments.filter(function (d) { return d.id === user.departmentId; });
}

function scopedEmployees(user) {
  if (user.role === "patron") return state.users.filter(function (u) { return u.role !== "patron"; });
  return deptEmployees(user.departmentId);
}

function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function answerAssistantQuestion(templateKey, user) {
  var emps = scopedEmployees(user);
  var empIds = emps.map(function (u) { return u.id; });
  var depts = scopedDepartments(user);

  if (templateKey === "today_attention") {
    var overdue = state.tasks.filter(function (task) { return empIds.includes(task.employeeId) && isTaskOverdue(task); }).length;
    var criticalCount = visibleAIInsights(user).filter(function (i) { return i.severity === "critical"; }).length;
    var todayStr = new Date().toDateString();
    var todaysMeetings = state.meetingOccurrences.filter(function (o) {
      return o.status === "scheduled" && new Date(o.scheduledAt).toDateString() === todayStr &&
        (user.role === "patron" || o.participantIds.includes(user.id) || o.departmentId === user.departmentId);
    }).length;
    return tf("answer_today_attention", { overdue: overdue, critical: criticalCount, meetings: todaysMeetings });
  }

  if (templateKey === "underperforming_depts") {
    var low = depts.filter(function (d) {
      var h = departmentHealthScore(d.id);
      return (h.taskCompletionRate != null && h.taskCompletionRate < 60) || (h.kpiOnTrackRate != null && h.kpiOnTrackRate < 60);
    }).map(function (d) { return loc(d.name); });
    return low.length ? tf("answer_underperforming_depts", { list: low.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "critical_kpis") {
    var crit = state.kpiDefinitions.filter(function (k) {
      if (k.departmentId && !depts.some(function (d) { return d.id === k.departmentId; })) return false;
      var latest = latestKpiValue(k.id);
      return latest && kpiStatus(latest.actualValue, k) === "critical";
    }).map(function (k) { return k.name; });
    return crit.length ? tf("answer_critical_kpis", { list: crit.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "goals_at_risk") {
    var atRisk = state.goals.filter(function (g) {
      if (g.departmentId && !depts.some(function (d) { return d.id === g.departmentId; })) return false;
      return g.status === "at_risk" || g.status === "missed";
    }).map(function (g) { return g.title; });
    return atRisk.length ? tf("answer_goals_at_risk", { list: atRisk.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "meetings_unresolved_actions") {
    var scopedOccurrences = state.meetingOccurrences.filter(function (o) {
      return user.role === "patron" || o.departmentId === user.departmentId || o.participantIds.includes(user.id);
    });
    var withOpenItems = scopedOccurrences.filter(function (o) {
      return state.tasks.some(function (task) { return task.source === "meeting" && task.sourceId === o.id && task.status !== "done"; });
    }).map(function (o) { return o.title; });
    return withOpenItems.length ? tf("answer_meetings_unresolved", { list: withOpenItems.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "employees_overdue_tasks") {
    var withOverdue = emps.filter(function (u) {
      return state.tasks.some(function (task) { return task.employeeId === u.id && isTaskOverdue(task); });
    }).map(function (u) { return u.name; });
    return withOverdue.length ? tf("answer_employees_overdue", { list: withOverdue.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "changed_this_week") {
    var since = daysAgo(7);
    var completedTasks = state.tasks.filter(function (task) {
      return empIds.includes(task.employeeId) && task.status === "done";
    }).length;
    var recentDecisions = state.meetingDecisions.filter(function (d) { return new Date(d.createdAt) >= since; }).length;
    var recentKpiValues = state.kpiValues.filter(function (v) { return new Date(v.enteredAt) >= since; }).length;
    return tf("answer_changed_this_week", { tasks: completedTasks, decisions: recentDecisions, kpis: recentKpiValues });
  }

  if (templateKey === "policies_updated_recently") {
    var recentPolicies = visiblePolicies(user).slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); }).slice(0, 5).map(function (p) { return p.title; });
    return recentPolicies.length ? tf("answer_policies_updated", { list: recentPolicies.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "depts_missing_scorecards") {
    var period = currentScorecardPeriod();
    var missingByDept = depts.filter(function (d) {
      return employeesMissingScorecard(period).some(function (u) { return u.departmentId === d.id; });
    }).map(function (d) { return loc(d.name); });
    return missingByDept.length ? tf("answer_depts_missing_scorecards", { list: missingByDept.join(", "), period: period }) : t("answer_none_found");
  }

  if (templateKey === "today_priority_risks") {
    var top = visibleAIInsights(user).slice(0, 3).map(function (i) { return i.title; });
    return top.length ? tf("answer_today_priority_risks", { list: top.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "missing_role_profiles") {
    var missingProfiles = employeesMissingRoleProfile().filter(function (u) { return empIds.includes(u.id); }).map(function (u) { return u.name; });
    return missingProfiles.length ? tf("answer_missing_role_profiles", { list: missingProfiles.join(", ") }) : t("answer_none_found");
  }

  if (templateKey === "decisions_last_30_days") {
    var since30 = daysAgo(30);
    var decisions = state.meetingDecisions.filter(function (d) { return new Date(d.createdAt) >= since30; }).map(function (d) { return d.text; });
    return decisions.length ? tf("answer_decisions_last_30_days", { list: decisions.join("; ") }) : t("answer_none_found");
  }

  if (templateKey === "most_overdue_employee") {
    var counts = emps.map(function (u) {
      return { name: u.name, count: state.tasks.filter(function (task) { return task.employeeId === u.id && isTaskOverdue(task); }).length };
    }).filter(function (x) { return x.count > 0; }).sort(function (a, b) { return b.count - a.count; });
    return counts.length ? tf("answer_most_overdue_employee", { name: counts[0].name, count: counts[0].count }) : t("answer_none_found");
  }

  if (templateKey === "my_open_action_items") {
    var mine = state.tasks.filter(function (task) { return task.employeeId === user.id && task.source === "meeting" && task.status !== "done"; }).map(function (task) { return loc(task.title); });
    return mine.length ? tf("answer_my_open_action_items", { list: mine.join(", ") }) : t("answer_none_found");
  }

  return t("answer_none_found");
}
