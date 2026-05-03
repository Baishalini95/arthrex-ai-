// Enroll modal logic
const modal = document.getElementById('enrollModal');
const closeModal = document.getElementById('closeModal');
const modalCourseName = document.getElementById('modalCourseName');
const modalSuccess = document.getElementById('modalSuccess');

let currentCourse = '';

// Open modal on any Enroll Now click — but NOT on masterclass cards (they have their own modal)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-enroll');
  if (!btn) return;
  // Skip if inside a masterclass card (handled by masterclasses.js)
  if (btn.closest('.mc-dynamic-card')) return;
  // Skip if it has an inline onclick (masterclass/live class handlers)
  if (btn.getAttribute('onclick')) return;
  e.preventDefault();
  const card = btn.closest('.master-card, .course-card, .live-card');
  currentCourse = card ? card.querySelector('h3')?.textContent : 'Course';
  modalCourseName.textContent = currentCourse;
  document.getElementById('reg_course').value = currentCourse;
  modalSuccess.style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
  document.getElementById('loginForm').style.display = 'none';
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.modal-tab[data-tab="register"]').classList.add('active');
  modal.classList.add('active');
});

// Close modal
closeModal.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

// Tab switching
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    document.querySelectorAll('.modal-form').forEach(f => f.style.display = 'none');
    document.getElementById(target + 'Form').style.display = 'flex';
  });
});

// Register submit
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const enrollment = {
    id: Date.now(),
    name: document.getElementById('reg_name').value,
    email: document.getElementById('reg_email').value,
    phone: document.getElementById('reg_phone').value,
    country: document.getElementById('reg_country').value,
    course: document.getElementById('reg_course').value || currentCourse,
    status: 'pending',
    date: new Date().toLocaleDateString('en-IN')
  };
  saveEnrollment(enrollment);
  showSuccess();
});

// Login submit
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value;
  const enrollments = getEnrollments();
  const user = enrollments.find(en => en.email === email);
  if (user) {
    if (user.status === 'approved') {
      window.location.href = `curriculum.html?course=${encodeURIComponent(user.course)}&user=${encodeURIComponent(user.name)}`;
    } else if (user.status === 'pending') {
      alert('⏳ Your enrollment is pending admin approval.');
    } else {
      alert('❌ Your enrollment was rejected. Please contact support.');
    }
  } else {
    // New login enrollment
    const enrollment = {
      id: Date.now(),
      name: email.split('@')[0],
      email,
      phone: 'N/A',
      course: currentCourse,
      status: 'pending',
      date: new Date().toLocaleDateString('en-IN')
    };
    saveEnrollment(enrollment);
    showSuccess();
  }
});

function saveEnrollment(enrollment) {
  const list = getEnrollments();
  list.push(enrollment);
  localStorage.setItem('lf_enrollments', JSON.stringify(list));
}

function getEnrollments() {
  return JSON.parse(localStorage.getItem('lf_enrollments') || '[]');
}

function showSuccess() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
  modalSuccess.style.display = 'flex';
}
