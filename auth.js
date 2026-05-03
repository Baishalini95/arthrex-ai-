// ===== ARTHREX AI — AUTH & ACCESS CONTROL =====

// Demo credentials
const DEMO_USERS = {
  'user@arthrex.ai':  { password: 'user123',  role: 'user',  name: 'User' },
  'admin@arthrex.ai': { password: 'admin123', role: 'admin', name: 'Admin' },
};

let selectedRole = 'user'; // role chosen in login modal

// ── Session helpers ───────────────────────────────────────────────────────────
function getSession() {
  return JSON.parse(localStorage.getItem('aai_session') || 'null');
}
function saveSession(data) {
  localStorage.setItem('aai_session', JSON.stringify(data));
}
function clearSession() {
  localStorage.removeItem('aai_session');
}
function isAdmin() {
  const s = getSession();
  return s && s.role === 'admin';
}
function isLoggedIn() {
  return !!getSession();
}

// ── Role selector in modal ────────────────────────────────────────────────────
function selectRole(role) {
  selectedRole = role;
  document.getElementById('roleUser').classList.toggle('active', role === 'user');
  document.getElementById('roleAdmin').classList.toggle('active', role === 'admin');
  // Pre-fill demo credentials
  if (role === 'admin') {
    document.getElementById('auth_email').value = 'admin@arthrex.ai';
    document.getElementById('auth_password').value = 'admin123';
  } else {
    document.getElementById('auth_email').value = 'user@arthrex.ai';
    document.getElementById('auth_password').value = 'user123';
  }
}

// ── Open / close login modal ──────────────────────────────────────────────────
document.getElementById('btnLogin').addEventListener('click', openLoginModal);
document.getElementById('closeLoginModal').addEventListener('click', closeLoginModal);
document.getElementById('loginModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('loginModal')) closeLoginModal();
});

function openLoginModal() {
  document.getElementById('authError').style.display = 'none';
  document.getElementById('auth_email').value = 'user@arthrex.ai';
  document.getElementById('auth_password').value = 'user123';
  selectRole('user');
  document.getElementById('loginModal').classList.add('active');
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

// ── Submit login ──────────────────────────────────────────────────────────────
document.getElementById('btnAuthSubmit').addEventListener('click', () => {
  const email    = document.getElementById('auth_email').value.trim().toLowerCase();
  const password = document.getElementById('auth_password').value;
  const errEl    = document.getElementById('authError');

  const match = DEMO_USERS[email];
  if (!match || match.password !== password) {
    errEl.textContent = '❌ Invalid email or password.';
    errEl.style.display = 'block';
    return;
  }
  if (match.role !== selectedRole) {
    errEl.textContent = `❌ This account is not an ${selectedRole}. Try the other role.`;
    errEl.style.display = 'block';
    return;
  }

  saveSession({ email, role: match.role, name: match.name });
  closeLoginModal();
  applyAccessControl();
});

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', () => {
  clearSession();
  applyAccessControl();
});

// ── Apply access control to the whole page ───────────────────────────────────
function applyAccessControl() {
  const session = getSession();
  const loggedIn = !!session;
  const admin    = loggedIn && session.role === 'admin';

  // Topbar
  document.getElementById('btnLogin').style.display   = loggedIn ? 'none'  : 'flex';
  document.getElementById('userAvatar').style.display = loggedIn ? 'flex'  : 'none';
  document.getElementById('btnLogout').style.display  = loggedIn ? 'flex'  : 'none';

  if (loggedIn) {
    const initials = session.name.slice(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userAvatar').title = `${session.name} (${session.role})`;
    // Add role badge colour
    document.getElementById('userAvatar').className =
      'user-avatar' + (admin ? ' avatar-admin' : ' avatar-user');
  }

  // Admin Panel nav item — only visible to admins
  const adminNavLink = document.querySelector('.admin-link');
  if (adminNavLink) adminNavLink.style.display = admin ? 'flex' : 'none';

  // ⚙️ Manage in LMS Admin button
  const manageBtn = document.querySelector('.btn-manage-courses');
  if (manageBtn) manageBtn.style.display = admin ? 'inline-flex' : 'none';

  // Admin-only link in empty courses state
  const emptyAdminLink = document.getElementById('emptyAdminLink');
  if (emptyAdminLink) emptyAdminLink.style.display = admin ? 'inline-flex' : 'none';

  // ✏️ Edit buttons on My Courses cards (rendered dynamically — handled in dashboard-courses.js)
  document.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.style.display = admin ? 'inline-flex' : 'none';
  });

  // Hide/show enroll buttons based on login state
  // (users must be logged in to enroll — optional UX choice)
  // document.querySelectorAll('.btn-enroll').forEach(btn => {
  //   btn.style.display = loggedIn ? 'inline-flex' : 'inline-flex'; // keep visible for now
  // });
}

// ── Patch dashboard-courses to respect admin flag ────────────────────────────
// Called after dynamic course cards are rendered
window.onCoursesRendered = function() {
  document.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.style.display = isAdmin() ? 'inline-flex' : 'none';
  });
};

// ── Init on page load ─────────────────────────────────────────────────────────
applyAccessControl();
