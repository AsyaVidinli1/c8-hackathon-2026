var STATUS_ORDER = ["todo", "in_progress", "blocked", "done"];
var PRIORITIES = ["low", "medium", "high", "critical"];

// Which sub-screen of the Tasks tab is active, and which task (if any) is drilled into.
var currentExecutionView = "my";
var currentTaskId = null;

// ─── Entry point + sub-navigation ─────────────────────────────────────────────

function renderExecution() {
  var user = getCurrentUser();
  if (user.role === "calisan" && currentExecutionView !== "my") currentExecutionView = "my";
  if (user.role === "mudur" && currentExecutionView === "all") currentExecutionView = "my";
  if (currentTaskId) { renderTaskDetail(currentTaskId); return; }
  renderExecutionList(currentExecutionView);
}

function switchExecutionView(view) {
  currentExecutionView = view;
  currentTaskId = null;
  window.renderMain();
}

function executionSubnav(user) {
  var tabs = [["my", t("etab_my_tasks")]];
  if (user.role !== "calisan") tabs.push(["team", t("etab_team_tasks")]);
  if (user.role === "patron") tabs.push(["all", t("etab_all_tasks")]);
  var buttons = tabs.map(function (entry) {
    return `<button class="subtab ${entry[0] === currentExecutionView ? "active" : ""}" onclick="switchExecutionView('${entry[0]}')">${entry[1]}</button>`;
  }).join("");
  return `<div class="subtab-bar">${buttons}</div>`;
}

// ─── Role-scoping helpers ───────────────────────────────────────────────────────

function tasksForScope(user, scope) {
  if (scope === "team") {
    var teamIds = myTeamMembers(user).map(function (u) { return u.id; }).concat(user.id);
    return state.tasks.filter(function (task) { return teamIds.includes(task.employeeId); });
  }
  if (scope === "all") return state.tasks;
  return state.tasks.filter(function (task) { return task.employeeId === user.id; });
}

function canManageTask(user, task) {
  if (user.role === "patron") return true;
  if (task.employeeId === user.id) return true;
  if (user.role === "mudur") {
    var assignee = state.users.find(function (u) { return u.id === task.employeeId; });
    return !!assignee && assignee.departmentId === user.departmentId;
  }
  return false;
}

function taskAssigneeOptions(user, selectedId) {
  var pool = user.role === "patron" ? state.users : myTeamMembers(user).concat([user]);
  var opts = `<option value="">${t("option_unassigned")}</option>`;
  pool.forEach(function (u) {
    opts += `<option value="${u.id}" ${selectedId === u.id ? "selected" : ""}>${u.name}</option>`;
  });
  return opts;
}

function priorityOptions(selected) {
  return PRIORITIES.map(function (p) {
    return `<option value="${p}" ${selected === p ? "selected" : ""}>${priorityLabel(p)}</option>`;
  }).join("");
}

// ─── Task list (My Tasks / Team Tasks / All Tasks) ─────────────────────────────

function renderExecutionList(scope) {
  var user = getCurrentUser();
  var items = tasksForScope(user, scope);
  var titleKey = scope === "team" ? "page_title_team_tasks" : scope === "all" ? "page_title_all_tasks" : "page_title_my_tasks";
  var subKey = scope === "team" ? "page_sub_team_tasks" : scope === "all" ? "page_sub_all_tasks" : "page_sub_my_tasks";

  var html = executionSubnav(user) + `
    <div class="page-title">${t(titleKey)}</div>
    <div class="page-sub">${t(subKey)}</div>
    <div class="section-head"><h2>${t("section_tasks")}</h2><button class="btn-gold" onclick="openTaskModal()">${t("btn_add_task")}</button></div>`;

  if (items.length === 0) {
    html += `<div class="empty-state">${t("empty_no_tasks")}</div>`;
  } else {
    STATUS_ORDER.forEach(function (status) {
      html += renderTaskStatusGroup(status, items.filter(function (task) { return task.status === status; }));
    });
  }

  document.getElementById("main-content").innerHTML = html;
}

function renderTaskStatusGroup(status, group) {
  if (group.length === 0) return "";
  var html = `<div class="section-head"><h2>${statusLabel(status)} (${group.length})</h2></div>`;
  group.forEach(function (task) { html += renderTaskRow(task); });
  return html;
}

function renderTaskRow(task) {
  var emp = state.users.find(function (u) { return u.id === task.employeeId; });
  return `<div class="card card-row">
    <div>
      <div class="p-name">${loc(task.title)}</div>
      <div class="p-title">${emp ? emp.name : t("option_unassigned")} · ${taskDueDisplay(task)}${task.source === "meeting" ? " · " + t("source_meeting") : ""}</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span class="tag ${priorityTagClass(task.priority)}">${priorityLabel(task.priority)}</span>
      <button class="btn-sm" onclick="openTaskDetail('${task.id}')">${t("btn_open")}</button>
    </div>
  </div>`;
}

// ─── Task Setup (create/edit) ──────────────────────────────────────────────────

function openTaskModal(taskId) {
  var user = getCurrentUser();
  var task = taskId ? state.tasks.find(function (x) { return x.id === taskId; }) : null;
  var assigneeRow = user.role === "calisan"
    ? ""
    : `<div class="form-row"><label>${t("label_assignee")}</label><select class="text-input" id="f-task-assignee">${taskAssigneeOptions(user, task ? task.employeeId : user.id)}</select></div>`;
  var body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${task ? t("modal_edit_task") : t("modal_new_task")}</h3>
    <div class="form-row"><label>${t("label_task_title")}</label><input class="text-input" id="f-task-title" value="${task ? loc(task.title) : ""}"></div>
    <div class="form-row"><label>${t("label_task_description")}</label><textarea class="text-input" id="f-task-desc">${task ? task.description || "" : ""}</textarea></div>
    ${assigneeRow}
    <div class="form-row"><label>${t("label_due_date")}</label><input class="text-input" id="f-task-due" type="date" value="${task && task.dueAt ? task.dueAt : ""}"></div>
    <div class="form-row"><label>${t("label_priority")}</label><select class="text-input" id="f-task-priority">${priorityOptions(task ? task.priority : "medium")}</select></div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveTask(${task ? `'${task.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveTask(taskId) {
  var user = getCurrentUser();
  var title = document.getElementById("f-task-title").value.trim();
  var description = document.getElementById("f-task-desc").value.trim();
  var assigneeField = document.getElementById("f-task-assignee");
  var employeeId = user.role === "calisan" ? user.id : (assigneeField ? assigneeField.value || null : null);
  var dueAt = document.getElementById("f-task-due").value || null;
  var priority = document.getElementById("f-task-priority").value;

  var validation = validateTaskPayload({ title: title });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }

  if (taskId) {
    var task = state.tasks.find(function (x) { return x.id === taskId; });
    Object.assign(task, { title: title, description: description, employeeId: employeeId, dueAt: dueAt, priority: priority });
  } else {
    state.tasks.push({
      id: genId("t"), title: title, description: description, employeeId: employeeId, due: null, dueAt: dueAt,
      status: "todo", priority: priority, source: "manual", sourceId: null, createdAt: new Date().toISOString(),
    });
  }
  closeModal();
  persistState();
  window.renderMain();
}

function deleteTask(taskId) {
  if (!confirm(t("confirm_delete_task"))) return;
  state.tasks = state.tasks.filter(function (x) { return x.id !== taskId; });
  currentTaskId = null;
  persistState();
  window.renderMain();
}

// ─── Task Detail ────────────────────────────────────────────────────────────────

function openTaskDetail(taskId) {
  currentTaskId = taskId;
  window.renderMain();
}

function closeTaskDetail() {
  currentTaskId = null;
  window.renderMain();
}

function renderTaskDetail(taskId) {
  var user = getCurrentUser();
  var task = state.tasks.find(function (x) { return x.id === taskId; });
  if (!task) { currentTaskId = null; renderExecutionList("my"); return; }
  if (!canManageTask(user, task)) {
    document.getElementById("main-content").innerHTML = `
      <button class="btn-sm" onclick="closeTaskDetail()">${t("btn_back_to_list")}</button>
      <div class="empty-state" style="margin-top:16px">${t("access_denied")}</div>`;
    return;
  }

  var html = `<button class="btn-sm" onclick="closeTaskDetail()">${t("btn_back_to_list")}</button>`;
  html += taskDetailHeader(task);
  html += `<div class="field-block"><div class="lbl">${t("field_task_description")}</div><div class="val">${task.description || "—"}</div></div>`;
  html += taskDetailStatus(task);
  html += taskDetailSource(task);

  document.getElementById("main-content").innerHTML = html;
}

function taskDetailHeader(task) {
  var emp = state.users.find(function (u) { return u.id === task.employeeId; });
  return `<div class="card" style="margin-top:16px">
    <div class="card-row">
      <div><div class="p-name">${loc(task.title)}</div><div class="p-title">${emp ? emp.name : t("option_unassigned")} · ${taskDueDisplay(task)}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn-sm" onclick="openTaskModal('${task.id}')">${t("btn_edit")}</button>
        <button class="btn-sm danger" onclick="deleteTask('${task.id}')">${t("btn_delete")}</button>
      </div>
    </div>
    <div style="margin-top:10px">
      <span class="tag ${priorityTagClass(task.priority)}" style="margin-right:5px">${priorityLabel(task.priority)}</span>
      <span class="tag ${statusTagClass(task.status)}">${statusLabel(task.status)}</span>
    </div>
  </div>`;
}

function taskDetailStatus(task) {
  return `<div class="section-head"><h2>${t("label_status")}</h2></div>
    <select class="text-input" style="width:auto" onchange="updateTaskStatus('${task.id}',this.value)">
      <option value="todo" ${task.status === "todo" ? "selected" : ""}>${t("status_todo")}</option>
      <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>${t("status_in_progress")}</option>
      <option value="blocked" ${task.status === "blocked" ? "selected" : ""}>${t("status_blocked")}</option>
      <option value="done" ${task.status === "done" ? "selected" : ""}>${t("status_done")}</option>
    </select>`;
}

function taskDetailSource(task) {
  var occurrence = task.source === "meeting" ? state.meetingOccurrences.find(function (o) { return o.id === task.sourceId; }) : null;
  var html = `<div class="section-head" style="margin-top:18px"><h2>${t("field_source")}</h2></div>`;
  if (occurrence) {
    html += `<div class="card card-row">
      <div>${t("source_meeting")} · ${occurrence.title}</div>
      <button class="btn-sm" onclick="openMeetingFromTask('${occurrence.id}')">${t("btn_view_meeting")}</button>
    </div>`;
  } else {
    html += `<div class="dim-text">${t("source_manual")}</div>`;
  }
  return html;
}

function openMeetingFromTask(occurrenceId) {
  currentTaskId = null;
  currentOccurrenceId = occurrenceId;
  window.switchTab("toplantilar");
}
