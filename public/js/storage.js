var STORAGE_KEY = "veliaht_yonetim_state_v1";

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Veri kaydedilemedi:", e);
  }
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return false;
    for (var k in parsed) state[k] = parsed[k];
    if (typeof state.lang !== "string") state.lang = "tr";

    // Migrate roleCards from old format (description/duties/soloDecisions/approvalDecisions)
    // to new governance format (mission/responsibilities/authorities/decisionRights/approvalRules).
    // Runs on every load; skips cards already in the new format.
    if (state.roleCards && typeof state.roleCards === "object") {
      for (var uid in state.roleCards) {
        var card = state.roleCards[uid];
        if (!card) continue;
        if (card.description !== undefined && card.mission === undefined) {
          card.mission = (card.description && typeof card.description === "object")
            ? (card.description.tr || card.description.en || "")
            : (card.description || "");
          card.responsibilities = (card.duties || []).map(function (d) {
            return (d && typeof d === "object") ? (d.tr || d.en || "") : (d || "");
          });
          card.authorities = (card.soloDecisions && typeof card.soloDecisions === "object")
            ? (card.soloDecisions.tr || card.soloDecisions.en || "")
            : (card.soloDecisions || "");
          card.decisionRights = "";
          card.approvalRules = (card.approvalDecisions && typeof card.approvalDecisions === "object")
            ? (card.approvalDecisions.tr || card.approvalDecisions.en || "")
            : (card.approvalDecisions || "");
          card.collaborations = (card.collaborations || []).map(function (c) {
            return {
              with: (c.with && typeof c.with === "object") ? (c.with.tr || c.with.en || "") : (c.with || ""),
              freq: (c.freq && typeof c.freq === "object") ? (c.freq.tr || c.freq.en || "") : (c.freq || ""),
            };
          });
          card.status = "active";
          delete card.description;
          delete card.duties;
          delete card.soloDecisions;
          delete card.approvalDecisions;
        }
        if (card.status === undefined) card.status = "active";
        if (card.decisionRights === undefined) card.decisionRights = "";
      }
    }

    // Migration: rename meetingTypes -> meetingTemplates (v0.3 -> v0.4), add category/departmentId.
    if (parsed.meetingTypes && !parsed.meetingTemplates) {
      state.meetingTemplates = parsed.meetingTypes;
    } else {
      state.meetingTemplates = parsed.meetingTemplates || [];
    }
    state.meetingTemplates.forEach(function (mt) {
      if (mt.category === undefined) mt.category = "ad_hoc";
      if (mt.departmentId === undefined) mt.departmentId = null;
    });

    if (!state.meetingOccurrences) state.meetingOccurrences = [];
    if (!state.meetingDecisions) state.meetingDecisions = [];

    // Migration: rename todos -> tasks (v0.4 -> v0.5), remap the old 3-value status
    // enum to the new todo/in_progress/blocked/done model, backfill new fields.
    if (parsed.todos && !parsed.tasks) {
      state.tasks = parsed.todos;
      delete state.todos;
    } else {
      state.tasks = parsed.tasks || [];
    }
    var STATUS_REMAP = { scheduled: "todo", pending: "todo" };
    state.tasks.forEach(function (task) {
      if (STATUS_REMAP[task.status]) task.status = STATUS_REMAP[task.status];
      if (task.source === undefined) task.source = "manual";
      if (task.sourceId === undefined) task.sourceId = null;
      if (task.dueAt === undefined) task.dueAt = null;
      if (task.priority === undefined) task.priority = "medium";
      if (task.description === undefined) task.description = "";
      if (task.createdAt === undefined) task.createdAt = null;
    });

    if (!state.company.scorecardFrequency) state.company.scorecardFrequency = "quarterly";
    if (!state.kpiDefinitions) state.kpiDefinitions = [];
    if (!state.kpiValues) state.kpiValues = [];
    if (!state.kpiAlerts) state.kpiAlerts = [];
    if (!state.goals) state.goals = [];
    if (!state.scorecards) state.scorecards = [];

    if (!state.documents) state.documents = [];
    if (!state.policies) state.policies = [];
    if (!state.meetingSummaries) state.meetingSummaries = [];
    if (!state.dismissedInsightIds) state.dismissedInsightIds = [];
    if (!state.healthBriefs) state.healthBriefs = [];
    if (!state.assistantQueries) state.assistantQueries = [];
    if (!state.aiSettings) {
      state.aiSettings = {
        llmProvider: "anthropic",
        featuresEnabled: { insights: true, suggestedActions: true, roleProfileDrafter: true, executiveAssistant: true, healthBrief: true },
      };
    }
    if (!state.handbookSections) {
      state.handbookSections = [
        { id: "hb-about", key: "about", title: "Şirket Hakkında", body: "", updatedAt: null, updatedBy: null },
        { id: "hb-org-structure", key: "org_structure", title: "Organizasyon Yapımız", body: "", updatedAt: null, updatedBy: null },
        { id: "hb-how-we-work", key: "how_we_work", title: "Nasıl Çalışırız", body: "", updatedAt: null, updatedBy: null },
        { id: "hb-policies", key: "policies", title: "Politikalarımız", body: "", updatedAt: null, updatedBy: null },
        { id: "hb-standards", key: "standards", title: "Standartlarımız", body: "", updatedAt: null, updatedBy: null },
      ];
    }

    return true;
  } catch (e) {
    console.error("Veri yüklenemedi, varsayılan demo verisiyle devam ediliyor:", e);
    return false;
  }
}

function resetAllData() {
  if (!confirm(t("confirm_reset_data"))) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  location.reload();
}
