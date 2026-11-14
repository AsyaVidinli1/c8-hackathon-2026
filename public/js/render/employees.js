function openEmployeeModal(userId, presetDeptId) {
  const u = userId ? state.users.find(function (x) { return x.id === userId; }) : null;
  const depOptions = state.departments
    .map(function (d) {
      return `<option value="${d.id}" ${(u ? u.departmentId : presetDeptId) === d.id ? "selected" : ""}>${loc(d.name)}</option>`;
    })
    .join("");
  const mgrOptions = state.users
    .filter(function (x) { return x.id !== userId; })
    .map(function (x) {
      return `<option value="${x.id}" ${u && u.managerId === x.id ? "selected" : ""}>${x.name}</option>`;
    })
    .join("");
  const body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${u ? t("modal_edit_employee") : t("modal_new_employee")}</h3>
    <div class="form-row"><label>${t("label_fullname")}</label><input class="text-input" id="f-emp-name" value="${u ? u.name : ""}"></div>
    <div class="form-row"><label>${t("label_title")}</label><input class="text-input" id="f-emp-title" value="${u ? loc(u.title) : ""}"></div>
    <div class="form-row"><label>${t("label_email")}</label><input class="text-input" id="f-emp-email" value="${u ? u.email : ""}"></div>
    <div class="form-row"><label>${t("label_department")}</label><select class="text-input" id="f-emp-dept">${depOptions}</select></div>
    <div class="form-row"><label>${t("label_reports_to")}</label><select class="text-input" id="f-emp-mgr"><option value="">${t("option_none_reports_patron")}</option>${mgrOptions}</select></div>
    <div class="form-row"><label>${t("label_role_level")}</label>
      <select class="text-input" id="f-emp-role">
        <option value="calisan" ${u && u.role === "calisan" ? "selected" : ""}>${t("option_role_employee")}</option>
        <option value="mudur" ${u && u.role === "mudur" ? "selected" : ""}>${t("option_role_manager")}</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveEmployee(${u ? `'${u.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveEmployee(userId) {
  const name = document.getElementById("f-emp-name").value.trim();
  const title = document.getElementById("f-emp-title").value.trim();
  const email = document.getElementById("f-emp-email").value.trim();
  const deptId = document.getElementById("f-emp-dept").value || null;
  const managerId = document.getElementById("f-emp-mgr").value || null;
  const role = document.getElementById("f-emp-role").value;
  const validation = validateEmployeePayload(
    { name: name, email: email, departmentId: deptId, managerId: managerId, role: role },
    { employeeId: userId }
  );
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }
  if (userId) {
    const u = state.users.find(function (x) { return x.id === userId; });
    Object.assign(u, { name, title, email, departmentId: deptId, managerId, role });
  } else {
    state.users.push({ id: genId("u"), name, title, email, password: "demo1234", role, departmentId: deptId, managerId });
  }
  if (validation.warnings.length) {
    alert(validation.warnings.join("\n"));
  }
  closeModal();
  persistState();
  window.renderMain();
}

function deleteEmployee(userId) {
  if (!confirm(t("confirm_delete_employee"))) return;
  state.users = state.users.filter(function (u) { return u.id !== userId; });
  delete state.roleCards[userId];

  // Manually-created tasks are removed with the employee; meeting-sourced ones are
  // historical meeting records, so they're kept and just unassigned (see ENGINEERING_GUIDE §13).
  state.tasks = state.tasks.filter(function (task) { return task.source === "meeting" || task.employeeId !== userId; });
  state.tasks.forEach(function (task) {
    if (task.employeeId === userId) task.employeeId = null;
  });

  state.meetingTemplates.forEach(function (m) {
    m.participantIds = m.participantIds.filter(function (id) { return id !== userId; });
  });
  state.meetingOccurrences.forEach(function (o) {
    o.participantIds = o.participantIds.filter(function (id) { return id !== userId; });
    if (o.ownerId === userId) o.ownerId = null;
  });
  state.meetingDecisions.forEach(function (d) {
    if (d.ownerId === userId) d.ownerId = null;
  });

  persistState();
  window.renderMain();
}

function renderMudurEkip() {
  const me = getCurrentUser();
  const emps = myTeamMembers(me);
  const dept = userDept(me);
  let html = `<div class="page-title">${t("page_title_my_team")}</div><div class="page-sub">${tf("page_sub_my_team", { dept: dept ? loc(dept.name) : "" })}</div>`;
  if (emps.length === 0) html += `<div class="empty-state">${t("empty_no_employee_dept")}</div>`;
  emps.forEach(function (u) {
    const myTasks = state.tasks.filter(function (task) { return task.employeeId === u.id; });
    const manager = employeeManager(u);
    html += `<div class="card">
      <div class="card-row">
        <div class="person"><div class="avatar">${initials(u.name)}</div><div><div class="p-name">${u.name}</div><div class="p-title">${loc(u.title)}</div></div></div>
        <button class="btn-sm" onclick="openGovernanceDetail('${u.id}')">${t("btn_view_card")}</button>
      </div>
      <div class="dim-text" style="margin-top:8px">${t("reporting_reports_to")}: ${manager ? manager.name : t("warning_manager_missing_inline")}</div>
      <div class="dim-text" style="margin-top:8px">${tf("tasks_defined", { n: myTasks.length })}</div>
    </div>`;
  });
  document.getElementById("main-content").innerHTML = html;
}
