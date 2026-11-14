function renderPatronEkip() {
  const owner = state.users.find(function (u) { return u.role === "patron"; }) || null;
  const managerWarnings = employeesMissingManager();
  const departmentWarnings = employeesMissingDepartment();

  let html = `
    <div class="page-title">${t("page_title_ekip")}</div>
    <div class="page-sub">${t("page_sub_ekip")}</div>`;

  if (managerWarnings.length || departmentWarnings.length) {
    html += `<div class="section-head"><h2>${t("section_org_warnings")}</h2></div>`;
    if (managerWarnings.length) {
      html += `<div class="notice notice-amber"><div class="dot"></div><div><strong>${t("warning_manager_missing_title")}:</strong> ${managerWarnings.map(function (u) { return u.name; }).join(", ")}</div></div>`;
    }
    if (departmentWarnings.length) {
      html += `<div class="notice notice-red"><div class="dot"></div><div><strong>${t("warning_department_missing_title")}:</strong> ${departmentWarnings.map(function (u) { return u.name; }).join(", ")}</div></div>`;
    }
  }

  html += `<div class="section-head"><h2>${t("section_departments")}</h2><button class="btn-gold" onclick="openDeptModal()">${t("btn_add_dept")}</button></div>`;

  if (state.departments.length === 0) html += `<div class="empty-state">${t("empty_no_dept")}</div>`;

  state.departments.forEach(function (d) {
    const emps = deptEmployees(d.id);
    html += `<div class="dep-block">
      <div class="dep-head">
        <div class="dep-name">${loc(d.name)} <span class="tag tag-gray">${tf("employee_count", { n: emps.length })}</span></div>
        <div class="row-actions">
          <button onclick="openEmployeeModal(null,'${d.id}')">${t("btn_add_employee")}</button>
          <button onclick="openDeptModal('${d.id}')">${t("btn_edit")}</button>
          <button onclick="deleteDept('${d.id}')">${t("btn_delete")}</button>
        </div>
      </div>`;
    if (emps.length === 0) html += `<div class="empty-state">${t("empty_no_employee_in_dept")}</div>`;
    emps.forEach(function (u) {
      const manager = employeeManager(u);
      html += `<div class="card card-row">
        <div class="person"><div class="avatar">${initials(u.name)}</div>
          <div><div class="p-name">${u.name}</div><div class="p-title">${loc(u.title)}</div><div class="dim-text">${t("reporting_reports_to")}: ${manager ? manager.name : t("warning_manager_missing_inline")}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag ${roleTagClass(u.role)}">${roleLabel(u.role)}</span>
          <div class="row-actions">
            <button onclick="openEmployeeModal('${u.id}')">${t("btn_edit")}</button>
            <button onclick="deleteEmployee('${u.id}')">${t("btn_delete")}</button>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });

  html += `<div class="section-head"><h2>${t("section_reporting_lines")}</h2></div>`;
  if (!owner) {
    html += `<div class="empty-state">${t("role_patron")} bulunamadi.</div>`;
  } else {
    const ownerReports = directReports(owner.id);
    html += `<div class="card">
      <div class="p-name">${owner.name}</div>
      <div class="p-title">${loc(owner.title)} · ${t("reporting_owner_root")}</div>
      <div class="dim-text" style="margin-top:8px">${t("reporting_direct_reports")}</div>`;
    if (ownerReports.length === 0) {
      html += `<div class="empty-state" style="margin-top:10px">${t("reporting_no_reports")}</div>`;
    } else {
      ownerReports.forEach(function (manager) {
        const reports = directReports(manager.id);
        html += `<div class="card" style="margin-top:10px">
          <div class="p-name">${manager.name}</div>
          <div class="p-title">${loc(manager.title)} · ${loc((userDept(manager) || {}).name || "")}</div>
          <div class="dim-text" style="margin-top:8px">${t("reporting_direct_reports")}</div>`;
        if (reports.length === 0) {
          html += `<div class="empty-state" style="margin-top:10px">${t("reporting_no_reports")}</div>`;
        } else {
          reports.forEach(function (report) {
            html += `<div class="card card-row" style="margin-top:10px">
              <div class="person"><div class="avatar">${initials(report.name)}</div><div><div class="p-name">${report.name}</div><div class="p-title">${loc(report.title)}</div></div></div>
              <span class="tag ${roleTagClass(report.role)}">${roleLabel(report.role)}</span>
            </div>`;
          });
        }
        html += `</div>`;
      });
    }
    html += `</div>`;
  }

  document.getElementById("main-content").innerHTML = html;
}

function openDeptModal(deptId) {
  const dept = deptId ? state.departments.find(function (d) { return d.id === deptId; }) : null;
  const mgrOptions = state.users
    .filter(function (u) { return u.role !== "calisan"; })
    .map(function (u) {
      return `<option value="${u.id}" ${dept && dept.managerId === u.id ? "selected" : ""}>${u.name}</option>`;
    })
    .join("");
  const body = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>${dept ? t("modal_edit_dept") : t("modal_new_dept")}</h3>
    <div class="form-row"><label>${t("label_dept_name")}</label><input class="text-input" id="f-dept-name" value="${dept ? loc(dept.name) : ""}"></div>
    <div class="form-row"><label>${t("label_manager_select")}</label>
      <select class="text-input" id="f-dept-mgr"><option value="">${t("option_unassigned")}</option>${mgrOptions}</select>
    </div>
    <div class="modal-actions">
      <button class="btn-sm" onclick="closeModal()">${t("btn_cancel")}</button>
      <button class="btn-gold" onclick="saveDept(${dept ? `'${dept.id}'` : null})">${t("btn_save")}</button>
    </div>`;
  showModal(body);
}

function saveDept(deptId) {
  const name = document.getElementById("f-dept-name").value.trim();
  const mgr = document.getElementById("f-dept-mgr").value || null;
  if (!name) return;
  if (deptId) {
    const d = state.departments.find(function (item) { return item.id === deptId; });
    d.name = name;
    d.managerId = mgr;
  } else {
    state.departments.push({ id: genId("dep"), name, managerId: mgr });
  }
  if (mgr) {
    const m = state.users.find(function (u) { return u.id === mgr; });
    if (m.role === "calisan") m.role = "mudur";
  }
  persistState();
  closeModal();
  window.renderMain();
}

function deleteDept(deptId) {
  if (deptEmployees(deptId).length > 0) {
    alert(t("alert_dept_has_employees"));
    return;
  }
  state.departments = state.departments.filter(function (d) { return d.id !== deptId; });
  persistState();
  window.renderMain();
}
