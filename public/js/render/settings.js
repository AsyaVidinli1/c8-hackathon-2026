function renderAyarlar() {
  const html = `
    <div class="page-title">${t("page_title_settings")}</div>
    <div class="page-sub">${t("page_sub_settings")}</div>
    <div class="card">
      <div class="field-block"><div class="lbl">${t("label_company_name")}</div><div class="val"><input class="text-input" id="f-company-name" value="${loc(state.company.name)}" style="margin-top:4px"></div></div>
      <div class="field-block"><div class="lbl">${t("label_scorecard_frequency")}</div><div class="val"><select class="text-input" id="f-scorecard-freq" style="margin-top:4px">${scorecardFrequencyOptions(state.company.scorecardFrequency)}</select></div></div>
      <button class="btn-gold" onclick="saveCompany()">${t("btn_save")}</button>
    </div>
    <div class="section-head"><h2>${t("section_access_levels")}</h2></div>
    <div class="card card-row"><div><div class="p-name">${t("access_patron_title")}</div><div class="p-title">${t("access_patron_desc")}</div></div><span class="tag tag-green">${t("tag_active")}</span></div>
    <div class="card card-row"><div><div class="p-name">${t("access_mudur_title")}</div><div class="p-title">${t("access_mudur_desc")}</div></div><span class="tag tag-green">${t("tag_active")}</span></div>
    <div class="card card-row"><div><div class="p-name">${t("access_calisan_title")}</div><div class="p-title">${t("access_calisan_desc")}</div></div><span class="tag tag-green">${t("tag_active")}</span></div>
    <div class="section-head"><h2>${t("section_ai_settings")}</h2></div>
    <div class="card">
      <div class="field-block">
        <div class="lbl">${t("label_llm_provider")}</div>
        <div class="val">
          <select class="text-input" id="f-ai-provider" style="margin-top:4px" disabled>
            <option value="anthropic" selected>Anthropic Claude</option>
          </select>
          <div class="dim-text" style="margin-top:4px">${t("notice_llm_provider_inactive")}</div>
        </div>
      </div>
      <div class="field-block">
        <div class="lbl">${t("label_ai_features")}</div>
        <div class="val" style="margin-top:6px">
          ${aiFeatureToggleRow("insights", t("feature_insights"))}
          ${aiFeatureToggleRow("suggestedActions", t("feature_suggested_actions"))}
          ${aiFeatureToggleRow("roleProfileDrafter", t("feature_role_profile_drafter"))}
          ${aiFeatureToggleRow("executiveAssistant", t("feature_executive_assistant"))}
          ${aiFeatureToggleRow("healthBrief", t("feature_health_brief"))}
        </div>
      </div>
    </div>
    <div class="notice notice-amber" style="margin-top:20px"><div class="dot"></div><div>${t("notice_phase1")}</div></div>
    <button class="btn-sm danger" style="margin-top:8px" onclick="resetAllData()">${t("btn_reset_data")}</button>`;
  document.getElementById("main-content").innerHTML = html;
}

function aiFeatureToggleRow(key, label) {
  var checked = state.aiSettings.featuresEnabled[key];
  return `<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
    <input type="checkbox" ${checked ? "checked" : ""} onchange="toggleAiFeature('${key}', this.checked)"> ${label}
  </label>`;
}

function toggleAiFeature(key, value) {
  state.aiSettings.featuresEnabled[key] = value;
  persistState();
  window.renderMain();
}

function scorecardFrequencyOptions(selected) {
  var opts = ["monthly", "quarterly", "annual"];
  return opts.map(function (o) {
    return `<option value="${o}" ${selected === o ? "selected" : ""}>${t("option_freq_" + o)}</option>`;
  }).join("");
}

function saveCompany() {
  state.company.name = document.getElementById("f-company-name").value.trim() || state.company.name;
  state.company.scorecardFrequency = document.getElementById("f-scorecard-freq").value;
  persistState();
  window.renderMain();
}
