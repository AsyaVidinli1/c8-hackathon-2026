// Explicit demo selection; server owns the session. Not production authentication.
function quickLogin(email) { document.getElementById('login-email').value = email; return handleLogin(); }
async function handleLogin() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var errorBox = document.getElementById('login-error');
  var button = document.querySelector('#login-screen .btn-primary');
  if (button) button.disabled = true;
  try {
    await saveQueue; saveGeneration++;
    adoptServerState(await apiRequest('/api/session', { email: email }));
    lastSaveError = null;
    if (typeof liveAdvisorResult !== 'undefined') liveAdvisorResult = null;
    if (typeof liveAdvisorError !== 'undefined') liveAdvisorError = '';
    currentTab = null; errorBox.style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    backendNotice(state.lang === 'tr' ? 'SQLite · Bağlı' : 'SQLite · Connected');
    window.renderShell();
  } catch (error) {
    errorBox.textContent = error.message; errorBox.style.display = 'block'; backendNotice(error.message, true);
  } finally { if (button) button.disabled = false; }
}
async function handleLogout() {
  try {
    await saveQueue; await apiRequest('/api/logout', {}); saveGeneration++;
    state.currentUserId = null; persistedSnapshot = null;
    if (typeof liveAdvisorResult !== 'undefined') liveAdvisorResult = null;
    if (typeof liveAdvisorError !== 'undefined') liveAdvisorError = '';
    stateArrays.forEach(function (key) { state[key] = []; });
    state.assistantQueries = []; state.roleCards = {};
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    backendNotice('SQLite · Select a demo account');
  } catch (error) { backendNotice(error.message, true); }
}
function getCurrentUser() { return state.users.find(function (u) { return u.id === state.currentUserId; }); }
