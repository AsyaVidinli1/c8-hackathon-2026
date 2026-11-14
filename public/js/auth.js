function quickLogin(email) {
  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = "demo1234";
  handleLogin();
}

function handleLogin() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass = document.getElementById("login-password").value;
  const user = state.users.find(function (u) {
    return u.email.toLowerCase() === email && u.password === pass;
  });
  const errBox = document.getElementById("login-error");
  if (!user) {
    errBox.style.display = "block";
    return;
  }
  errBox.style.display = "none";
  state.currentUserId = user.id;
  persistState();
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "block";
  window.renderShell();
}

function handleLogout() {
  state.currentUserId = null;
  persistState();
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
}

function getCurrentUser() {
  return state.users.find(function (u) {
    return u.id === state.currentUserId;
  });
}
