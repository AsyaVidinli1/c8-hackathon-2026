var state = {
  "lang": "tr",
  "company": {
    "name": {
      "tr": "Örnek Aile Şirketi A.Ş.",
      "en": "Example Family Company Ltd."
    },
    "scorecardFrequency": "quarterly"
  },
  "currentUserId": null,
  "users": [],
  "departments": [],
  "roleCards": {},
  "tasks": [],
  "meetingTemplates": [],
  "meetingOccurrences": [],
  "meetingDecisions": [],
  "kpiDefinitions": [],
  "kpiValues": [],
  "kpiAlerts": [],
  "goals": [],
  "scorecards": [],
  "documents": [],
  "policies": [],
  "handbookSections": [],
  "meetingSummaries": [],
  "dismissedInsightIds": [],
  "healthBriefs": [],
  "assistantQueries": [],
  "aiSettings": {
    "llmProvider": "anthropic",
    "featuresEnabled": {
      "insights": true,
      "suggestedActions": true,
      "roleProfileDrafter": true,
      "executiveAssistant": true,
      "healthBrief": true
    }
  }
};
var currentTab = null;
function genId(p) { return p + "-" + crypto.randomUUID(); }
function setCurrentTab(tab) { currentTab = tab; }
