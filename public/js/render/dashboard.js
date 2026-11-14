function renderPatronGenel() {
  const totalEmp = state.users.length;
  const totalDep = state.departments.length;
  const missingCards = employeesMissingRoleProfile().length;
  const totalCardable = state.users.filter(function (u) { return u.role !== "patron"; }).length;

  let html = `
    <div class="page-title">${loc(state.company.name)}</div>
    <div class="page-sub">${t("page_sub_company_overview")}</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${totalEmp}</div><div class="stat-lbl">${t("stat_total_emp")}</div></div>
      <div class="stat-card"><div class="stat-val">${totalDep}</div><div class="stat-lbl">${t("stat_dept")}</div></div>
      <div class="stat-card"><div class="stat-val">${totalCardable - missingCards}/${totalCardable}</div><div class="stat-lbl">${t("stat_completed_card")}</div></div>
      <div class="stat-card"><div class="stat-val">${state.meetingTemplates.length}</div><div class="stat-lbl">${t("stat_meeting_defined")}</div></div>
    </div>`;

  if (missingCards > 0) {
    html += `<div class="notice notice-red"><div class="dot"></div><div>${tf("notice_missing_cards", { n: missingCards })}</div></div>`;
  } else {
    html += `<div class="notice notice-green"><div class="dot"></div><div>${t("notice_all_cards_done")}</div></div>`;
  }

  html += renderAiDashboardWidget(getCurrentUser());

  html += `<div class="section-head"><h2>${t("section_departments")}</h2></div>`;
  state.departments.forEach(function (d) {
    const emps = deptEmployees(d.id);
    const mgr = state.users.find(function (u) { return u.id === d.managerId; });
    html += `<div class="card card-row">
      <div><div class="p-name">${loc(d.name)}</div><div class="p-title">${tf("employee_count", { n: emps.length })} · ${t("label_manager")}: ${mgr ? mgr.name : t("label_manager_unassigned")}</div></div>
      <span class="tag ${mgr ? "tag-green" : "tag-red"}">${mgr ? t("tag_active") : t("tag_manager_missing")}</span>
    </div>`;
  });

  document.getElementById("main-content").innerHTML = html;
}

function renderMudurGenel() {
  const me = getCurrentUser();
  const dept = userDept(me);
  const emps = myTeamMembers(me);
  const myTasks = state.tasks.filter(function (task) {
    return emps.some(function (e) { return e.id === task.employeeId; });
  });
  const openTasks = myTasks.filter(function (task) { return task.status !== "done"; }).length;
  const now = new Date();
  const upcomingMeetings = state.meetingOccurrences.filter(function (o) {
    return o.status === "scheduled" && o.participantIds.includes(me.id) && new Date(o.scheduledAt) >= now;
  }).length;

  let html = `
    <div class="page-title">${t("greeting")} ${me.name.split(" ")[0]}</div>
    <div class="page-sub">${tf("page_sub_dept_summary", { dept: dept ? loc(dept.name) : "" })}</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${emps.length}</div><div class="stat-lbl">${t("stat_team_member")}</div></div>
      <div class="stat-card"><div class="stat-val">${openTasks}</div><div class="stat-lbl">${t("stat_open_task")}</div></div>
      <div class="stat-card"><div class="stat-val">${upcomingMeetings}</div><div class="stat-lbl">${t("stat_my_meeting")}</div></div>
    </div>`;

  html += renderAiDashboardWidget(me);

  html += `<div class="section-head"><h2>${t("section_team_tasks")}</h2></div>`;

  if (myTasks.length === 0) html += `<div class="empty-state">${t("empty_no_open_task")}</div>`;
  myTasks.forEach(function (task) {
    const emp = state.users.find(function (u) { return u.id === task.employeeId; });
    html += `<div class="card card-row"><div><div class="p-name">${loc(task.title)}</div><div class="p-title">${emp.name} · ${taskDueDisplay(task)}</div></div><span class="tag ${statusTagClass(task.status)}">${statusLabel(task.status)}</span></div>`;
  });
  document.getElementById("main-content").innerHTML = html;
}

function renderCalisanGenel() {
  const me = getCurrentUser();
  const myTasks = state.tasks.filter(function (task) { return task.employeeId === me.id; });
  const card = state.roleCards[me.id];
  let html = `
    <div class="page-title">${t("greeting")} ${me.name.split(" ")[0]}</div>
    <div class="page-sub">${loc(me.title)}</div>
    <div class="card" style="border-left:3px solid var(--gold)">
      <div class="person"><div class="avatar">${initials(me.name)}</div>
        <div><div class="p-name">${me.name}</div><div class="p-title">${loc(me.title)}${me.managerId ? " · " + tf("connected_to", { name: state.users.find(function (u) { return u.id === me.managerId; }).name }) : ""}</div></div>
      </div>
    </div>
    <div class="section-head"><h2>${t("section_my_tasks")}</h2></div>`;
  if (myTasks.length === 0) html += `<div class="empty-state">${t("empty_no_task_assigned")}</div>`;
  myTasks.forEach(function (task) {
    html += `<div class="card card-row">
      <div><div class="p-name">${loc(task.title)}</div><div class="p-title">${taskDueDisplay(task)}</div></div>
      <select class="text-input" style="width:auto;padding:4px 8px;font-size:11.5px" onchange="updateTaskStatus('${task.id}',this.value)">
        <option value="todo" ${task.status === "todo" ? "selected" : ""}>${t("status_todo")}</option>
        <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>${t("status_in_progress")}</option>
        <option value="blocked" ${task.status === "blocked" ? "selected" : ""}>${t("status_blocked")}</option>
        <option value="done" ${task.status === "done" ? "selected" : ""}>${t("status_done")}</option>
      </select>
    </div>`;
  });
  if (!card) html += `<div class="notice notice-amber" style="margin-top:18px"><div class="dot"></div><div>${t("notice_card_not_filled")}</div></div>`;
  document.getElementById("main-content").innerHTML = html;
}

function updateTaskStatus(taskId, status) {
  const task = state.tasks.find(function (x) { return x.id === taskId; });
  task.status = status;
  persistState();
  window.renderMain();
}
