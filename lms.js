const params = new URLSearchParams(window.location.search);
const courseName = params.get('course') || '';
const userName   = params.get('user')   || 'Learner';
const urlCourseId = params.get('cid')  || '';

document.getElementById('topCourseTitle').textContent = courseName;
document.getElementById('userInitials').textContent = userName.slice(0,2).toUpperCase();

// Find matching course — prefer courseId from URL
const lmsData = JSON.parse(localStorage.getItem('lf_lms') || '{}');
let courseData = null;
let courseId = null;

if (urlCourseId && lmsData[urlCourseId]) {
  courseId = urlCourseId;
  courseData = lmsData[urlCourseId];
} else {
  Object.entries(lmsData).forEach(([id, c]) => {
    if (c.name.toLowerCase() === courseName.toLowerCase() ||
        courseName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) {
      courseData = c; courseId = id;
    }
  });
}

// Fallback demo data if no admin data
if (!courseData) {
  courseData = {
    name: courseName,
    topics: [
      { id: 't1', title: 'Module 1: Foundations', order: 1, lessons: [
        { id: 'l1', title: 'Course Introduction', type: 'Video', duration: 15, content: 'Welcome to the course! In this lesson we cover the course structure and what you will learn.', video: '' },
        { id: 'l2', title: 'Core Concepts Overview', type: 'Reading', duration: 20, content: 'This lesson covers the fundamental concepts you need to understand before diving deeper.', video: '' },
      ]},
      { id: 't2', title: 'Module 2: Hands-on Practice', order: 2, lessons: [
        { id: 'l3', title: 'Your First Project Setup', type: 'Lab', duration: 45, content: 'Set up your development environment and run your first project.', video: '' },
        { id: 'l4', title: 'Live Coding Session', type: 'Live Session', duration: 60, content: 'Join the live session to code along with the instructor.', video: '' },
      ]},
    ],
    assignments: [{ id: 'a1', title: 'Assignment 1: Fundamentals', description: 'Complete the foundational exercises and submit your work.', due: 7, marks: 100 }],
    quizzes: [{ id: 'q1', title: 'Module 1 Quiz', time: 15, questions: [
      { question: 'What is the primary goal of this course?', options: ['Learn basics', 'Build projects', 'Get certified', 'All of the above'], answer: 'D' },
      { question: 'Which tool will we use most?', options: ['Python', 'JavaScript', 'Java', 'C++'], answer: 'A' },
    ]}],
    projects: [{ id: 'p1', title: 'Capstone Project', description: 'Build a complete end-to-end project applying everything you have learned.', difficulty: 'Advanced', stack: 'Python, AI APIs', days: 14 }],
    resources: [{ id: 'r1', title: 'Course Handbook', type: 'PDF', url: '#' }]
  };
}

// Progress tracking
const completed = new Set(JSON.parse(localStorage.getItem(`lf_progress_${courseId}`) || '[]'));
let currentLesson = { topicIdx: 0, lessonIdx: 0 };
let activeQuiz = null;
let quizTimer = null;

// ===== SIDEBAR NAV =====
document.querySelectorAll('.lms-nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.lms-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.lms-view').forEach(v => v.classList.remove('active'));
    item.classList.add('active');
    const view = item.getAttribute('data-view');
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('moduleTree').style.display = view === 'lessons' ? 'block' : 'none';
    if (view === 'assignments') renderAssignments();
    if (view === 'quizzes') renderQuizzes();
    if (view === 'projects') renderProjects();
    if (view === 'resources') renderResources();
  });
});

// ===== MODULE TREE =====
function renderModuleTree() {
  const el = document.getElementById('moduleTree');
  const topics = courseData.topics || [];
  el.innerHTML = topics.sort((a,b) => a.order - b.order).map((t, ti) => `
    <div class="tree-module">
      <div class="tree-module-title" onclick="toggleTree(${ti})">
        <span>${t.title}</span><span id="tree-arrow-${ti}">▼</span>
      </div>
      <div class="tree-lessons" id="tree-lessons-${ti}">
        ${t.lessons.map((l, li) => `
          <div class="tree-lesson ${ti===0&&li===0?'active':''} ${completed.has(l.id)?'done':''}"
               id="tl-${ti}-${li}" onclick="loadLesson(${ti},${li})">
            <span>${completed.has(l.id) ? '✅' : lessonDot(l.type)}</span>
            <span>${l.title}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function toggleTree(ti) {
  const el = document.getElementById(`tree-lessons-${ti}`);
  const arrow = document.getElementById(`tree-arrow-${ti}`);
  el.classList.toggle('collapsed');
  arrow.textContent = el.classList.contains('collapsed') ? '▶' : '▼';
}

function lessonDot(type) {
  return { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' }[type] || '○';
}

// ===== LOAD LESSON =====
function loadLesson(ti, li) {
  currentLesson = { topicIdx: ti, lessonIdx: li };
  const topic = courseData.topics[ti];
  const lesson = topic.lessons[li];

  document.querySelectorAll('.tree-lesson').forEach(el => el.classList.remove('active'));
  document.getElementById(`tl-${ti}-${li}`)?.classList.add('active');

  document.getElementById('lessonBreadcrumb').textContent = `${topic.title} › Lesson ${li + 1}`;
  document.getElementById('lessonTitle').textContent = lesson.title;
  document.getElementById('videoLabel').textContent = lesson.video ? '▶ Click to play' : `▶ ${lesson.title}`;
  document.getElementById('lessonBody').innerHTML = buildLessonBlog(lesson, topic, li, ti);
  updateProgress();

  // Render mermaid diagrams if any
  setTimeout(() => {
    const diagrams = document.querySelectorAll('#lessonBody .mermaid');
    if (diagrams.length && typeof mermaid !== 'undefined') {
      mermaid.init(undefined, diagrams);
    }
  }, 100);
}

function buildLessonBlog(lesson, topic, li, ti) {
  const typeIcon = { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' };
  const typeColor = { Video: '#ef4444', Reading: '#3b82f6', 'Live Session': '#f59e0b', Lab: '#10b981' };
  const icon = typeIcon[lesson.type] || '📄';
  const color = typeColor[lesson.type] || '#7c3aed';
  const content = lesson.content || '';

  return `
    <div class="lesson-blog">

      <!-- Meta row -->
      <div class="lb-meta">
        <span class="lb-type-badge" style="background:${color}22;color:${color};border-color:${color}44">
          ${icon} ${lesson.type}
        </span>
        <span class="lb-dur">⏱ ${lesson.duration} min</span>
        <span class="lb-module">${topic.title}</span>
      </div>

      <!-- Intro card -->
      <div class="lb-intro-card">
        <div class="lb-intro-icon">${icon}</div>
        <div>
          <h2 class="lb-intro-title">${lesson.title}</h2>
          <p class="lb-intro-sub">Lesson ${li + 1} of ${topic.lessons.length} · ${lesson.type} · ${lesson.duration} min</p>
        </div>
      </div>

      <!-- Rich content -->
      ${content ? `
      <div class="lb-section">
        <div class="lb-section-label">📖 Lesson Content</div>
        <div class="lb-rich-content">${content}</div>
      </div>` : `
      <div class="lb-section">
        <div class="lb-section-label">📖 Lesson Content</div>
        <div class="lb-empty-content">No content yet. Edit this lesson in the admin panel to add content.</div>
      </div>`}

      <!-- Video link if present -->
      ${lesson.video ? `
      <div class="lb-section">
        <div class="lb-section-label">🎬 Video Resource</div>
        <a href="${lesson.video}" target="_blank" class="lb-video-link">
          <span>▶</span> Watch: ${lesson.title}
        </a>
      </div>` : ''}

      <!-- Notes area -->
      <div class="lb-section lb-notes-section">
        <div class="lb-section-label">📝 Your Notes</div>
        <textarea class="lb-notes-input" placeholder="Take notes here..."
          onchange="saveNote('${lesson.id}', this.value)">${getNoteForLesson(lesson.id)}</textarea>
      </div>

      <!-- Complete button -->
      <div class="lb-complete-row">
        <button class="btn-complete ${completed.has(lesson.id) ? 'done-btn' : ''}"
          onclick="markDone('${lesson.id}',${ti},${li})">
          ${completed.has(lesson.id) ? '✅ Completed' : '○ Mark as Complete'}
        </button>
        ${completed.has(lesson.id) ? '<span class="lb-done-msg">Great work! Move to the next lesson.</span>' : ''}
      </div>

    </div>`;
}

function getNoteForLesson(lid) {
  return localStorage.getItem(`lf_note_${courseId}_${lid}`) || '';
}
function saveNote(lid, val) {
  localStorage.setItem(`lf_note_${courseId}_${lid}`, val);
}

function markDone(lid, ti, li) {
  completed.add(lid);
  localStorage.setItem(`lf_progress_${courseId}`, JSON.stringify([...completed]));
  renderModuleTree();
  loadLesson(ti, li);
  updateProgress();
}

function updateProgress() {
  const total = courseData.topics.reduce((s, t) => s + t.lessons.length, 0);
  const pct = total ? Math.round((completed.size / total) * 100) : 0;
  document.getElementById('topProgress').style.width = pct + '%';
  document.getElementById('topProgressLabel').textContent = pct + '%';
}

// Prev / Next
document.getElementById('nextBtn').addEventListener('click', () => {
  let { topicIdx: ti, lessonIdx: li } = currentLesson;
  li++;
  if (li >= courseData.topics[ti].lessons.length) { ti++; li = 0; }
  if (ti < courseData.topics.length) loadLesson(ti, li);
});
document.getElementById('prevBtn').addEventListener('click', () => {
  let { topicIdx: ti, lessonIdx: li } = currentLesson;
  li--;
  if (li < 0) { ti--; if (ti >= 0) li = courseData.topics[ti].lessons.length - 1; }
  if (ti >= 0) loadLesson(ti, li);
});

// ===== ASSIGNMENTS =====
function renderAssignments() {
  const el = document.getElementById('assignmentsContent');
  const items = courseData.assignments || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No assignments yet.</div>'; return; }
  el.innerHTML = items.map(a => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge assign-b">📝 Assignment</span>
        <h3>${a.title}</h3>
        <p>${a.description}</p>
      </div>
      <div class="lms-card-meta">
        <span>⏰ Due in ${a.due} days</span>
        <span>🏆 ${a.marks} marks</span>
        <button class="btn-start" onclick="submitAssignment('${a.id}')">📤 Submit</button>
      </div>
    </div>`).join('');
}

function submitAssignment(id) {
  alert('📤 Assignment submission feature — upload your file here.\n(Connect to backend to enable file uploads)');
}

// ===== QUIZZES =====
function renderQuizzes() {
  const el = document.getElementById('quizzesContent');
  const items = courseData.quizzes || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No quizzes yet.</div>'; return; }
  el.innerHTML = items.map(q => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge quiz-b">🧠 Quiz</span>
        <h3>${q.title}</h3>
        <p>${q.questions.length} questions · ⏱ ${q.time} mins</p>
      </div>
      <div class="lms-card-meta">
        <button class="btn-start" onclick="startQuiz('${q.id}')">▶ Start Quiz</button>
      </div>
    </div>`).join('');
}

function startQuiz(qid) {
  activeQuiz = courseData.quizzes.find(q => q.id === qid);
  if (!activeQuiz) return;
  document.getElementById('quizModalTitle').textContent = activeQuiz.title;
  document.getElementById('quizResult').style.display = 'none';
  document.getElementById('submitQuizBtn').style.display = 'block';

  document.getElementById('quizQuestionsRender').innerHTML = activeQuiz.questions.map((q, i) => `
    <div class="quiz-q-block">
      <p class="quiz-q-text">Q${i+1}. ${q.question}</p>
      <div class="quiz-options">
        ${['A','B','C','D'].map((opt, oi) => `
          <label class="quiz-option">
            <input type="radio" name="q${i}" value="${opt}"/>
            <span>${opt}. ${q.options[oi] || ''}</span>
          </label>`).join('')}
      </div>
    </div>`).join('');

  // Timer
  let secs = (activeQuiz.time || 30) * 60;
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    secs--;
    const m = Math.floor(secs / 60), s = secs % 60;
    document.getElementById('quizTimer').textContent = `⏱ ${m}:${s.toString().padStart(2,'0')} remaining`;
    if (secs <= 0) { clearInterval(quizTimer); gradeQuiz(); }
  }, 1000);

  document.getElementById('quizModal').classList.add('active');
}

document.getElementById('submitQuizBtn').addEventListener('click', () => { clearInterval(quizTimer); gradeQuiz(); });
document.getElementById('closeQuizModal').addEventListener('click', () => { clearInterval(quizTimer); document.getElementById('quizModal').classList.remove('active'); });

function gradeQuiz() {
  let score = 0;
  activeQuiz.questions.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    if (sel && sel.value === q.answer) score++;
  });
  const pct = Math.round((score / activeQuiz.questions.length) * 100);
  document.getElementById('submitQuizBtn').style.display = 'none';
  document.getElementById('quizResult').style.display = 'block';
  document.getElementById('quizResult').innerHTML = `
    <div class="quiz-result ${pct >= 60 ? 'pass' : 'fail'}">
      <div class="result-score">${pct}%</div>
      <h3>${pct >= 60 ? '🎉 Passed!' : '😔 Try Again'}</h3>
      <p>You scored ${score} out of ${activeQuiz.questions.length} questions.</p>
    </div>`;
}

// ===== PROJECTS =====
function renderProjects() {
  const el = document.getElementById('projectsContent');
  const items = courseData.projects || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No projects yet.</div>'; return; }
  el.innerHTML = items.map(p => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge project-b">🚀 Project</span>
        <span class="diff-badge diff-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p class="stack-info">🛠 ${p.stack}</p>
      </div>
      <div class="lms-card-meta">
        <span>📅 ${p.days} days</span>
        <button class="btn-start" onclick="submitProject('${p.id}')">📤 Submit Project</button>
      </div>
    </div>`).join('');
}

function submitProject(id) {
  alert('📤 Project submission — paste your GitHub link or upload files here.\n(Connect to backend to enable submissions)');
}

// ===== RESOURCES =====
function renderResources() {
  const el = document.getElementById('resourcesContent');
  const items = courseData.resources || [];
  if (!items.length) { el.innerHTML = '<div class="empty-lms">No resources yet.</div>'; return; }
  const icons = { PDF: '📄', Video: '▶', Link: '🔗', GitHub: '🐙', Notebook: '📓' };
  el.innerHTML = items.map(r => `
    <div class="lms-card">
      <div class="lms-card-top">
        <span class="lms-badge resource-b">${icons[r.type] || '📎'} ${r.type}</span>
        <h3>${r.title}</h3>
        ${r.url && r.url !== '#' ? `<a href="${r.url}" target="_blank" class="resource-link">🔗 Open Resource</a>` : ''}
      </div>
    </div>`).join('');
}

// ===== INIT =====
renderModuleTree();
if (courseData.topics?.length && courseData.topics[0].lessons?.length) loadLesson(0, 0);
updateProgress();

// Edit Course button — opens admin-lms with this course selected
document.getElementById('editCourseBtn').addEventListener('click', (e) => {
  e.preventDefault();
  if (courseId) localStorage.setItem('lf_active_course', courseId);
  window.open('admin-lms.html', '_blank');
});
