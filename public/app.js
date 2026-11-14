function renderShell() {
  const user = getCurrentUser();
  document.getElementById("tb-name").textContent = user.name;
  document.getElementById("tb-role").textContent = roleLabel(user.role);
  document.querySelectorAll(".lang-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.lang === state.lang);
  });

  const tabsByRole = {
    patron: [
      ["genel", t("nav_genel_patron")],
      ["ekip", t("nav_ekip_patron")],
      ["yonetisim", t("nav_yonetisim")],
      ["toplantilar", t("nav_toplantilar")],
      ["gorevler", t("nav_gorevler")],
      ["performans", t("nav_performans")],
      ["bilgi", t("nav_bilgi")],
      ["ai", t("nav_ai")],
      ["ayarlar", t("nav_ayarlar")],
    ],
    mudur: [
      ["genel", t("nav_genel_patron")],
      ["ekip", t("nav_ekip_mudur")],
      ["yonetisim", t("nav_yonetisim")],
      ["toplantilar", t("nav_toplantilar")],
      ["gorevler", t("nav_gorevler")],
      ["performans", t("nav_performans")],
      ["bilgi", t("nav_bilgi")],
      ["ai", t("nav_ai")],
    ],
    calisan: [
      ["genel", t("nav_genel_calisan")],
      ["kartim", t("nav_kartim")],
      ["toplantilar", t("nav_toplantilarim")],
      ["gorevler", t("nav_gorevler")],
      ["performans", t("nav_performans")],
      ["bilgi", t("nav_bilgi")],
    ],
  };

  const tabs = tabsByRole[user.role];
  if (!tabs.find(function (tb) { return tb[0] === currentTab; })) {
    setCurrentTab(tabs[0][0]);
  }

  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = tabs
    .map(function (entry) {
      const key = entry[0];
      const label = entry[1];
      return `<button class="nav-item ${key === currentTab ? "active" : ""}" data-tab="${key}" onclick="switchTab('${key}')">${label}</button>`;
    })
    .join("");

  renderMain();
}

function switchTab(key) {
  setCurrentTab(key);
  document.querySelectorAll(".nav-item").forEach(function (b) {
    b.classList.toggle("active", b.dataset.tab === key);
  });
  renderMain();
}

function renderMain() {
  const user = getCurrentUser();
  const fn = {
    patron: {
      genel: renderPatronGenel,
      ekip: renderPatronEkip,
      yonetisim: renderPatronKartlar,
      toplantilar: renderMeetings,
      gorevler: renderExecution,
      performans: renderPerformance,
      bilgi: renderKnowledge,
      ai: renderAiAdvisor,
      ayarlar: renderAyarlar,
    },
    mudur: {
      genel: renderMudurGenel,
      ekip: renderMudurEkip,
      yonetisim: renderMudurKartlar,
      toplantilar: renderMeetings,
      gorevler: renderExecution,
      performans: renderPerformance,
      bilgi: renderKnowledge,
      ai: renderAiAdvisor,
    },
    calisan: {
      genel: renderCalisanGenel,
      kartim: renderCalisanKart,
      toplantilar: renderMeetings,
      gorevler: renderExecution,
      performans: renderPerformance,
      bilgi: renderKnowledge,
    },
  };

  fn[user.role][currentTab]();
}

window.setLang = setLang;
window.quickLogin = quickLogin;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.switchTab = switchTab;
window.renderShell = renderShell;
window.renderMain = renderMain;
window.showModal = showModal;
window.closeModal = closeModal;
window.openDeptModal = openDeptModal;
window.saveDept = saveDept;
window.deleteDept = deleteDept;
window.openEmployeeModal = openEmployeeModal;
window.saveEmployee = saveEmployee;
window.deleteEmployee = deleteEmployee;
window.openGovernanceDetail = openGovernanceDetail;
window.closeGovernanceDetail = closeGovernanceDetail;
window.openGovernanceEditModal = openGovernanceEditModal;
window.saveGovernanceCard = saveGovernanceCard;
window.switchMeetingsView = switchMeetingsView;
window.openMeetingSetupModal = openMeetingSetupModal;
window.prefillFromTemplate = prefillFromTemplate;
window.saveMeetingOccurrence = saveMeetingOccurrence;
window.deleteMeetingOccurrence = deleteMeetingOccurrence;
window.openTemplateModal = openTemplateModal;
window.saveTemplate = saveTemplate;
window.deleteTemplate = deleteTemplate;
window.openMeetingDetail = openMeetingDetail;
window.closeMeetingDetail = closeMeetingDetail;
window.updateOccurrenceStatus = updateOccurrenceStatus;
window.openAgendaItemModal = openAgendaItemModal;
window.saveAgendaItem = saveAgendaItem;
window.deleteAgendaItem = deleteAgendaItem;
window.saveNotes = saveNotes;
window.openDecisionModal = openDecisionModal;
window.saveDecision = saveDecision;
window.deleteDecision = deleteDecision;
window.openActionItemModal = openActionItemModal;
window.saveActionItem = saveActionItem;
window.saveCompany = saveCompany;
window.resetAllData = resetAllData;
window.updateTaskStatus = updateTaskStatus;
window.switchExecutionView = switchExecutionView;
window.openTaskModal = openTaskModal;
window.saveTask = saveTask;
window.deleteTask = deleteTask;
window.openTaskDetail = openTaskDetail;
window.closeTaskDetail = closeTaskDetail;
window.openMeetingFromTask = openMeetingFromTask;
window.switchPerformanceView = switchPerformanceView;
window.openKpiModal = openKpiModal;
window.saveKpiDefinition = saveKpiDefinition;
window.toggleKpiStatus = toggleKpiStatus;
window.openKpiDetail = openKpiDetail;
window.closeKpiDetail = closeKpiDetail;
window.openKpiValueModal = openKpiValueModal;
window.saveKpiValue = saveKpiValue;
window.deleteKpiValue = deleteKpiValue;
window.openGoalModal = openGoalModal;
window.saveGoal = saveGoal;
window.deleteGoal = deleteGoal;
window.openGoalDetail = openGoalDetail;
window.closeGoalDetail = closeGoalDetail;
window.updateGoalStatus = updateGoalStatus;
window.openCheckInModal = openCheckInModal;
window.saveCheckIn = saveCheckIn;
window.openStartReviewModal = openStartReviewModal;
window.saveNewScorecard = saveNewScorecard;
window.openScorecardDetail = openScorecardDetail;
window.closeScorecardDetail = closeScorecardDetail;
window.saveScorecardNotes = saveScorecardNotes;
window.saveSelfAssessment = saveSelfAssessment;
window.advanceScorecardStatus = advanceScorecardStatus;
window.exportKpiSummaryCsv = exportKpiSummaryCsv;
window.exportDeptPerformanceCsv = exportDeptPerformanceCsv;
window.exportGoalStatusCsv = exportGoalStatusCsv;
window.switchKnowledgeView = switchKnowledgeView;
window.updateKnowledgeSearch = updateKnowledgeSearch;
window.openDocumentDetail = openDocumentDetail;
window.closeDocumentDetail = closeDocumentDetail;
window.openDocumentModal = openDocumentModal;
window.saveDocument = saveDocument;
window.deleteDocument = deleteDocument;
window.downloadDocumentTxt = downloadDocumentTxt;
window.openPolicyDetail = openPolicyDetail;
window.closePolicyDetail = closePolicyDetail;
window.openPolicyModal = openPolicyModal;
window.savePolicy = savePolicy;
window.publishPolicy = publishPolicy;
window.archivePolicy = archivePolicy;
window.deletePolicy = deletePolicy;
window.openPromoteToPolicyModal = openPromoteToPolicyModal;
window.savePromotedPolicy = savePromotedPolicy;
window.openHandbookEditModal = openHandbookEditModal;
window.saveHandbookSection = saveHandbookSection;
window.openMeetingSummaryModal = openMeetingSummaryModal;
window.regenerateMeetingSummary = regenerateMeetingSummary;
window.approveMeetingSummary = approveMeetingSummary;
window.switchAiView = switchAiView;
window.setInsightFilter = setInsightFilter;
window.dismissInsight = dismissInsight;
window.convertInsightToTask = convertInsightToTask;
window.askAssistantQuestion = askAssistantQuestion;
window.regenerateHealthBrief = regenerateHealthBrief;
window.applyRoleProfileDraft = applyRoleProfileDraft;
window.toggleAiFeature = toggleAiFeature;

async function bootApplication() {
  initModal();
  await loadState();
  applyStaticTranslations();
  configureDemoLogin();
  if (state.currentUserId && getCurrentUser()) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-shell").style.display = "block";
    renderShell();
  }
}
function configureDemoLogin() {
  document.getElementById("login-password").style.display = "none";
  var labels = document.querySelectorAll("#login-screen .field-label");
  if (labels[1]) labels[1].style.display = "none";
  document.querySelector("#login-screen .btn-primary").textContent = state.lang === "tr" ? "Demo hesabını aç" : "Open demo account";
}
bootApplication().catch(function () { backendNotice("Application could not connect to the backend.", true); });
