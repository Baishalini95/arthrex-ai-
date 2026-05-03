// Gradient pool for course cards
const gradients = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#10b981,#0ea5e9)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#059669,#0ea5e9)',
  'linear-gradient(135deg,#f97316,#facc15)',
  'linear-gradient(135deg,#1e3a5f,#2563eb)',
];

const categoryIcons = {
  'Generative AI': '✨', 'Agentic AI': '🤖', 'Data Science': '🔬',
  'Domain AI': '🏭', 'LLM': '🧠', 'RAG': '🔗', 'MCP': '🔌', 'default': '📚'
};

function loadDashboardCourses() {
  const lmsData = JSON.parse(localStorage.getItem('lf_lms') || '{}');
  const courses = Object.entries(lmsData);

  const grid = document.getElementById('myCoursesGrid');
  const empty = document.getElementById('myCoursesEmpty');
  const countBadge = document.getElementById('myCoursesCount');

  if (!courses.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    countBadge.style.display = 'none';
    updateWelcomeStats(0, 0, 0);
    return;
  }

  empty.style.display = 'none';
  countBadge.style.display = 'inline-block';
  countBadge.textContent = courses.length;

  // Compute stats
  let totalPct = 0, completed = 0;
  courses.forEach(([id, course]) => {
    const totalLessons = (course.topics || []).reduce((s, t) => s + (t.lessons || []).length, 0);
    const progress = JSON.parse(localStorage.getItem(`lf_progress_${id}`) || '[]');
    const pct = totalLessons ? Math.round((progress.length / totalLessons) * 100) : 0;
    totalPct += pct;
    if (pct === 100) completed++;
  });
  const avgPct = courses.length ? Math.round(totalPct / courses.length) : 0;
  updateWelcomeStats(courses.length, completed, avgPct);

  grid.innerHTML = courses.map(([id, course], idx) => {
    const icon = categoryIcons[course.category] || categoryIcons.default;
    const gradient = gradients[idx % gradients.length];
    const totalLessons = (course.topics || []).reduce((s, t) => s + (t.lessons || []).length, 0);
    const totalTopics = (course.topics || []).length;
    const progress = JSON.parse(localStorage.getItem(`lf_progress_${id}`) || '[]');
    const pct = totalLessons ? Math.round((progress.length / totalLessons) * 100) : 0;

    return `
      <div class="master-card dashboard-course-card">
        <div class="card-thumb" style="background:${gradient}">${icon}</div>
        <div class="card-body">
          <span class="tag">${course.category || 'Course'}</span>
          <h3>${course.name}</h3>
          <p>${totalTopics} modules · ${totalLessons} lessons · ${course.duration || 'Self-paced'}</p>
          <div class="progress-bar" style="margin:10px 0 4px">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <p class="progress-label">${pct}% complete</p>
          <div class="job-ready-banner">
            <span class="job-ready-icon">💼</span>
            <div>
              <strong>Job Ready</strong>
              <span>Industry-aligned curriculum · Certificate included</span>
            </div>
          </div>
          <div class="dashboard-course-actions">
            <a href="lms.html?course=${encodeURIComponent(course.name)}&user=Learner" class="btn-enroll">
              ${pct > 0 ? '▶ Continue' : '▶ Start Course'}
            </a>
            <a href="admin-lms.html" class="btn-edit-course" onclick="localStorage.setItem('lf_active_course','${id}')">✏️ Edit</a>
          </div>
        </div>
      </div>`;
  }).join('');

  // Notify auth module to apply edit button visibility
  if (typeof window.onCoursesRendered === 'function') window.onCoursesRendered();
}

// Load on page ready
loadDashboardCourses();

function updateWelcomeStats(enrolled, completed, avgPct) {
  const e = document.getElementById('statEnrolled');
  const c = document.getElementById('statCompleted');
  const p = document.getElementById('statProgress');
  if (e) e.textContent = enrolled;
  if (c) c.textContent = completed;
  if (p) p.textContent = avgPct + '%';
}

// Reload when Home nav is clicked
document.querySelector('.nav-item[data-section="home"]')?.addEventListener('click', loadDashboardCourses);

// Also reload when returning from admin-lms (storage event)
window.addEventListener('storage', (e) => {
  if (e.key === 'lf_lms') loadDashboardCourses();
});
