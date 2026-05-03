// ===== DATA HELPERS =====
const getData = () => JSON.parse(localStorage.getItem('lf_lms') || '{}');
const saveData = d => localStorage.setItem('lf_lms', JSON.stringify(d));

let activeCourse = null;
let activeTopicId = null;
let qCount = 1;
let selectedCategory = 'all';   // program key: all | agentic | genai | datascience | domainai
let selectedSubcat = 'all';     // subcategory tag filter

// ===== INIT =====
function init() {
  setupProgramButtons();
  renderSubcatFilter();
  populateCourseSelect();
  renderCourseCards();
  const last = localStorage.getItem('lf_active_course');
  if (last) { document.getElementById('courseSelect').value = last; selectCourse(last); }
}

// ===== PROGRAM BUTTONS (step 1) =====
function setupProgramButtons() {
  document.querySelectorAll('#programButtons .cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#programButtons .cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.getAttribute('data-category');
      selectedSubcat = 'all';
      renderSubcatFilter();
      populateCourseSelect();
      renderCourseCards();
      document.getElementById('courseSelect').value = '';
      selectCourse('');
    });
  });
}

// ===== SUBCATEGORY FILTER CHIPS (step 2) =====
function renderSubcatFilter() {
  const filterEl = document.getElementById('subcatFilter');
  const chipsEl  = document.getElementById('subcatChips');
  const labelEl  = document.getElementById('subcatLabel');

  if (selectedCategory === 'all') {
    filterEl.style.display = 'none';
    return;
  }

  // Build unique tags from COURSE_DATABASE subcategories
  const catData = typeof COURSE_DATABASE !== 'undefined' ? COURSE_DATABASE[selectedCategory] : null;
  if (!catData) { filterEl.style.display = 'none'; return; }

  // Collect subcategory tags
  const tags = [{ key: 'all', label: 'All' }];
  Object.values(catData.subcategories).forEach(sub => {
    // Use the tag from first course, or subcategory name
    const sampleTag = sub.courses[0]?.tag;
    const label = sampleTag && sampleTag !== 'All' ? sampleTag : sub.name;
    if (!tags.find(t => t.label === label)) {
      tags.push({ key: label, label });
    }
  });

  labelEl.textContent = catData.name + ' — Filter';
  chipsEl.innerHTML = tags.map(t => `
    <button class="subcat-chip ${selectedSubcat === t.key ? 'active' : ''}"
            onclick="selectSubcat('${t.key}')">${t.label}</button>
  `).join('');

  filterEl.style.display = 'block';
}

function selectSubcat(key) {
  selectedSubcat = key;
  // Re-render chips active state
  document.querySelectorAll('.subcat-chip').forEach(c => {
    c.classList.toggle('active', c.textContent.trim() === key || (key === 'all' && c.textContent.trim() === 'All'));
  });
  renderCourseCards();
}

// ===== RENDER COURSE CARDS (step 3) =====
// Shows courses from COURSE_DATABASE (catalog) + any custom LMS courses
function renderCourseCards() {
  const grid = document.getElementById('courseCardsGrid');
  const lmsData = getData();

  let cards = [];

  if (selectedCategory === 'all') {
    // Show all LMS courses
    Object.keys(lmsData).forEach(id => {
      cards.push({ id, name: lmsData[id].name, tag: getCategoryLabel(lmsData[id].category), isLms: true });
    });
  } else {
    // Pull from COURSE_DATABASE catalog
    const catData = typeof COURSE_DATABASE !== 'undefined' ? COURSE_DATABASE[selectedCategory] : null;
    if (catData) {
      Object.values(catData.subcategories).forEach(sub => {
        sub.courses.forEach(course => {
          const tag = course.tag && course.tag !== 'All' ? course.tag : sub.name;
          if (selectedSubcat === 'all' || selectedSubcat === tag) {
            // Check if already in LMS
            const lmsEntry = Object.entries(lmsData).find(([, c]) => c.name.toLowerCase() === course.name.toLowerCase());
            cards.push({
              id: lmsEntry ? lmsEntry[0] : null,
              catalogId: course.id,
              name: course.name,
              tag,
              duration: course.duration,
              price: course.price,
              isLms: !!lmsEntry
            });
          }
        });
      });
    }
    // Also include any custom LMS courses for this category
    Object.keys(lmsData).forEach(id => {
      const c = lmsData[id];
      const catKey = c.category || '';
      if (catKey === selectedCategory && !cards.find(card => card.id === id)) {
        cards.push({ id, name: c.name, tag: getCategoryLabel(catKey), isLms: true });
      }
    });
  }

  if (!cards.length) {
    grid.innerHTML = '<div class="no-courses-msg">No courses yet. Create one!</div>';
    return;
  }

  grid.innerHTML = cards.map(c => `
    <div class="course-card-item ${activeCourse === c.id ? 'active' : ''}"
         onclick="selectCourseFromCard('${c.id || ''}', '${encodeURIComponent(c.name)}')">
      <div class="course-card-top">
        <h4>${c.name}</h4>
        ${c.isLms ? '<span class="lms-dot" title="Has LMS content">●</span>' : ''}
      </div>
      <div class="course-card-meta">
        <span class="course-tag-chip">${c.tag}</span>
        ${c.duration ? `<span class="course-dur">${c.duration}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function getCategoryLabel(cat) {
  const labels = {
    agentic: '🤖 Agentic AI',
    genai: '✨ Generative AI',
    datascience: '🔬 Data Science',
    domainai: '🏭 Industry AI'
  };
  return labels[cat] || cat;
}

function selectCourseFromCard(id, encodedName) {
  const name = decodeURIComponent(encodedName);
  const lmsData = getData();

  // If no LMS id yet, create the course entry
  if (!id || !lmsData[id]) {
    id = ensureCourseLmsEntry(name);
  }

  document.getElementById('courseSelect').value = id;
  selectCourse(id);
  renderCourseCards();
}

function ensureCourseLmsEntry(name) {
  const lmsData = getData();
  const existing = Object.entries(lmsData).find(([, c]) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing[0];
  const id = 'course_' + Date.now();
  lmsData[id] = {
    name,
    category: selectedCategory !== 'all' ? selectedCategory : detectCategoryFromName(name),
    duration: 'Self-paced',
    topics: [], assignments: [], quizzes: [], projects: [], resources: []
  };
  saveData(lmsData);
  populateCourseSelect();
  return id;
}

function detectCategoryFromName(name) {
  const n = name.toLowerCase();
  if (n.includes('agentic') || n.includes('agent')) return 'agentic';
  if (n.includes('generative') || n.includes('llm') || n.includes('gpt') || n.includes('rag') || n.includes('mcp') || n.includes('prompt')) return 'genai';
  if (n.includes('data')) return 'datascience';
  if (n.includes('domain') || n.includes('healthcare') || n.includes('finance') || n.includes('banking')) return 'domainai';
  return 'genai';
}

// ===== COURSES =====
function populateCourseSelect() {
  const data = getData();
  const sel = document.getElementById('courseSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Choose Course --</option>';
  
  Object.keys(data).forEach(id => {
    const course = data[id];
    const courseCategory = course.category || 'genai';
    
    if (selectedCategory === 'all' || courseCategory === selectedCategory) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = course.name;
      sel.appendChild(opt);
    }
  });
  
  if (current && sel.querySelector(`option[value="${current}"]`)) sel.value = current;
}

document.getElementById('courseSelect').addEventListener('change', e => {
  selectCourse(e.target.value);
});

function selectCourse(id) {
  activeCourse = id || null;
  localStorage.setItem('lf_active_course', id || '');
  document.getElementById('noCourse').style.display = id ? 'none' : 'flex';
  document.getElementById('btnSaveCourse').style.display = id ? 'block' : 'none';
  renderCourseCards();
  if (id) {
    showTab('topics');
    renderTopics(); renderAssignments(); renderQuizzes(); renderProjects(); renderResources();
  }
}

// New course
['btnNewCourse','btnNewCourse2'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('courseModal').classList.add('active');
  });
});
document.getElementById('closeCourseModal').addEventListener('click', () => document.getElementById('courseModal').classList.remove('active'));
document.getElementById('cancelCourseBtn').addEventListener('click', () => document.getElementById('courseModal').classList.remove('active'));

document.getElementById('saveCourseBtn').addEventListener('click', () => {
  const name = document.getElementById('newCourseName').value.trim();
  if (!name) return alert('Enter course name');
  const data = getData();
  const id = 'course_' + Date.now();
  data[id] = { name, category: document.getElementById('newCourseCategory').value, duration: document.getElementById('newCourseDuration').value, topics: [], assignments: [], quizzes: [], projects: [], resources: [] };
  saveData(data);
  populateCourseSelect();
  document.getElementById('courseSelect').value = id;
  selectCourse(id);
  document.getElementById('courseModal').classList.remove('active');
  document.getElementById('newCourseName').value = '';
});

// ===== TABS =====
document.querySelectorAll('.alms-nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    if (!activeCourse) return;
    document.querySelectorAll('.alms-nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    showTab(item.getAttribute('data-tab'));
  });
});

function showTab(tab) {
  document.querySelectorAll('.alms-tab').forEach(t => t.style.display = 'none');
  const el = document.getElementById('tab-' + tab);
  if (el) el.style.display = 'block';
  document.querySelectorAll('.alms-nav-item').forEach(i => {
    if (i.getAttribute('data-tab') === tab) i.classList.add('active');
    else i.classList.remove('active');
  });
}

// ===== TOPICS & LESSONS =====
document.getElementById('btnAddTopic').addEventListener('click', () => {
  document.getElementById('topicForm').style.display = 'block';
});

// AI Generate button on Topics tab — generates content for the active course
document.getElementById('btnAIGenerateCourse').addEventListener('click', () => {
  if (!activeCourse) return;
  const data = getData();
  const course = data[activeCourse];
  if (!course) return;
  aiGenerateMode = 'inject'; // inject into existing course, don't create new
  startAIGeneration(course.name, course.category || 'genai', course.duration || '3 Months');
});

document.getElementById('saveTopicBtn').addEventListener('click', () => {
  const title = document.getElementById('topicTitle').value.trim();
  if (!title || !activeCourse) return;
  const data = getData();
  const topic = { id: 'topic_' + Date.now(), title, order: parseInt(document.getElementById('topicOrder').value) || 1, lessons: [] };
  data[activeCourse].topics.push(topic);
  saveData(data);
  document.getElementById('topicTitle').value = '';
  document.getElementById('topicForm').style.display = 'none';
  renderTopics();
});

function renderTopics() {
  if (!activeCourse) return;
  const data = getData();
  const topics = data[activeCourse]?.topics || [];
  const el = document.getElementById('topicsList');
  if (!topics.length) { el.innerHTML = '<div class="empty-card">No topics yet. Click "+ Add Topic" to begin.</div>'; return; }
  el.innerHTML = topics.sort((a,b) => a.order - b.order).map(t => `
    <div class="topic-card" id="tcard-${t.id}">
      <div class="topic-header">
        <div class="topic-info">
          <span class="topic-order">Module ${t.order}</span>
          <h3>${t.title}</h3>
          <span class="lesson-count">${t.lessons.length} lessons</span>
        </div>
        <div class="topic-actions">
          <button class="btn-ai-lessons" onclick="openAILessonsPrompt('${t.id}')">✨ AI Lessons</button>
          <button class="btn-add-lesson" onclick="openLessonModal('${t.id}','${t.title.replace(/'/g,"\\'")}')">+ Add Lesson</button>
          <button class="btn-del" onclick="deleteTopic('${t.id}')">🗑</button>
        </div>
      </div>
      <div class="lessons-list" id="lessons-${t.id}">
        ${renderLessonRows(t)}
      </div>
    </div>`).join('');
}

function renderLessonRows(t) {
  if (!t.lessons.length) return '<div class="no-lessons">No lessons yet</div>';
  return t.lessons.map((l, i) => `
    <div class="lesson-row">
      <span class="lesson-num">${i+1}</span>
      <span class="lesson-type-icon">${lessonIcon(l.type)}</span>
      <span class="lesson-name">${l.title}</span>
      <span class="lesson-dur">⏱ ${l.duration} min</span>
      <button class="btn-preview-lesson" onclick="previewLesson('${t.id}','${l.id}')" title="Preview">👁</button>
      <button class="btn-edit-lesson" onclick="openEditLessonModal('${t.id}','${l.id}')" title="Edit">✏️</button>
      <button class="btn-del-sm" onclick="deleteLesson('${t.id}','${l.id}')">✕</button>
    </div>`).join('');
}

function lessonIcon(type) {
  return { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' }[type] || '📄';
}

function deleteTopic(tid) {
  if (!confirm('Delete this topic?')) return;
  const data = getData();
  data[activeCourse].topics = data[activeCourse].topics.filter(t => t.id !== tid);
  saveData(data); renderTopics();
}

function deleteLesson(tid, lid) {
  const data = getData();
  const topic = data[activeCourse].topics.find(t => t.id === tid);
  if (topic) topic.lessons = topic.lessons.filter(l => l.id !== lid);
  saveData(data); renderTopics();
}

// ── AI Lessons: open prompt modal ────────────────────────────────────────────
let aiLessonsTopicId = null;
let aiLessonsLastPrompt = '';
let aiLessonsPending = []; // generated but not yet saved

function openAILessonsPrompt(topicId) {
  const data = getData();
  const topic = data[activeCourse]?.topics.find(t => t.id === topicId);
  if (!topic) return;
  aiLessonsTopicId = topicId;
  document.getElementById('aiLessonsModuleName').textContent = '📦 ' + topic.title;
  document.getElementById('aiLessonsPromptText').value = '';
  document.getElementById('aiLessonsPromptModal').classList.add('active');
}

function appendLessonChip(text) {
  const ta = document.getElementById('aiLessonsPromptText');
  ta.value = ta.value ? ta.value.trimEnd() + ', ' + text : text;
  ta.focus();
}

document.getElementById('closeAILessonsPromptModal').addEventListener('click', () =>
  document.getElementById('aiLessonsPromptModal').classList.remove('active'));
document.getElementById('cancelAILessonsBtn').addEventListener('click', () =>
  document.getElementById('aiLessonsPromptModal').classList.remove('active'));

document.getElementById('btnRunAILessons').addEventListener('click', async () => {
  const prompt = document.getElementById('aiLessonsPromptText').value.trim();
  if (!prompt) return alert('Please describe the lessons you want.');
  aiLessonsLastPrompt = prompt;
  document.getElementById('aiLessonsPromptModal').classList.remove('active');
  await aiGenerateLessonsForTopic(aiLessonsTopicId, prompt);
});

// ── AI Generate Lessons: call Groq, show inline preview ──────────────────────
async function aiGenerateLessonsForTopic(topicId, userPrompt) {
  const apiKey = getGroqKey();
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE')
    return alert('Please set your Groq API key in admin-lms.js (GROQ_API_KEY).');

  const data = getData();
  const course = data[activeCourse];
  const topic = course?.topics.find(t => t.id === topicId);
  if (!topic) return;

  const lessonsEl = document.getElementById(`lessons-${topicId}`);
  lessonsEl.innerHTML = `
    <div class="ai-lessons-loading" style="padding:14px 0">
      <div class="ai-spinner-sm"></div>
      <span>Generating lessons for <strong>${topic.title}</strong>...</span>
    </div>`;

  // Step 1: generate lesson list (titles, types, durations)
  const listPrompt = `You are an expert course curriculum designer. Generate a lesson list for a course module. Return a valid JSON array. Each item must have:
- "title": string
- "type": one of "Video", "Reading", "Lab", "Live Session"
- "duration": number (minutes)
- "summary": string (one sentence summary)

Return ONLY the JSON array, no markdown, no explanation.`;

  const listMsg = `Course: "${course.name}"
Module: "${topic.title}"
${topic.description ? `Description: ${topic.description}` : ''}
${topic.highlights?.length ? `Key topics: ${topic.highlights.join(', ')}` : ''}
Instructions: ${userPrompt}`;

  try {
    const listRes = await callGroq(apiKey, listPrompt, listMsg, 800);
    const lessonList = JSON.parse(listRes.replace(/```json|```/g, '').trim());

    // Step 2: generate full rich content for each lesson
    lessonsEl.innerHTML = `
      <div class="ai-lessons-loading" style="padding:14px 0">
        <div class="ai-spinner-sm"></div>
        <span>Generating full content for ${lessonList.length} lessons...</span>
      </div>`;

    const richLessons = [];
    for (let i = 0; i < lessonList.length; i++) {
      const l = lessonList[i];
      lessonsEl.querySelector('span').textContent =
        `Generating lesson ${i+1}/${lessonList.length}: "${l.title}"...`;

      const richContent = await generateRichLessonContent(apiKey, course.name, topic.title, l);
      richLessons.push({
        id: 'lesson_' + Date.now() + '_' + i,
        title: l.title,
        type: l.type || 'Video',
        duration: l.duration || 30,
        summary: l.summary || '',
        content: richContent,  // full HTML content
        video: ''
      });
    }

    aiLessonsPending = richLessons;
    renderAILessonsInlinePreview(topicId);

  } catch (e) {
    lessonsEl.innerHTML = `
      <div class="ai-lessons-error">
        ❌ ${e.message}
        <button class="btn-gen-lessons" onclick="openAILessonsPrompt('${topicId}')">Retry</button>
      </div>`;
  }
}

// ── Generate full rich HTML content for one lesson ───────────────────────────
async function generateRichLessonContent(apiKey, courseName, moduleName, lesson) {
  const systemPrompt = `You are an expert technical educator. Write a complete, rich lesson in HTML format.

Rules:
- Use proper HTML tags only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <pre><code>, <blockquote>, <strong>, <em>, <table>, <tr>, <th>, <td>
- For code examples use: <pre><code class="language-python"> or language-javascript, language-bash etc
- For callout boxes use: <div class="callout info">, <div class="callout warning">, <div class="callout tip">
- For diagrams use: <div class="mermaid"> with valid mermaid syntax
- For key concept highlights use: <div class="concept-card"><h4>title</h4><p>explanation</p></div>
- Include: introduction, core concepts with examples, code samples where relevant, a summary
- Write at least 600 words of actual educational content
- Do NOT include <html>, <head>, <body>, <style> tags
- Return ONLY the HTML content, nothing else`;

  const userMsg = `Course: "${courseName}"
Module: "${moduleName}"
Lesson title: "${lesson.title}"
Lesson type: ${lesson.type}
Duration: ${lesson.duration} minutes
Summary: ${lesson.summary}

Write the complete lesson content as rich HTML.`;

  try {
    const raw = await callGroq(apiKey, systemPrompt, userMsg, 4000);
    // Strip any accidental markdown fences
    return raw.replace(/^```html\n?|^```\n?|```$/gm, '').trim();
  } catch (e) {
    return `<p>${lesson.summary || 'Content generation failed. Please regenerate.'}</p>`;
  }
}

// ── Shared Groq fetch helper ──────────────────────────────────────────────────
async function callGroq(apiKey, systemPrompt, userMsg, maxTokens = 2000) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

// ── Inline preview inside the topic card ─────────────────────────────────────
function renderAILessonsInlinePreview(topicId) {
  const lessonsEl = document.getElementById(`lessons-${topicId}`);
  lessonsEl.innerHTML = `
    <div class="ai-inline-preview">
      <div class="ai-inline-preview-header">
        <span class="ai-inline-badge">✨ AI Generated — ${aiLessonsPending.length} lessons</span>
        <div class="ai-inline-actions">
          <button class="btn-accept-lessons" onclick="acceptAILessons('${topicId}')">✅ Accept</button>
          <button class="btn-regen-lessons" onclick="openAILessonsPrompt('${topicId}')">🔄 Regenerate</button>
          <button class="btn-discard-lessons" onclick="discardAILessons('${topicId}')">✕ Discard</button>
        </div>
      </div>
      <div class="ai-lessons-list">
        ${aiLessonsPending.map((l, i) => `
          <div class="ai-lesson-row">
            <span class="ai-lesson-num">${i+1}</span>
            <span class="ai-lesson-type-icon">${lessonIcon(l.type)}</span>
            <span class="ai-lesson-name">${l.title}</span>
            <span class="ai-lesson-dur">${l.duration} min</span>
            <button class="btn-preview-lesson-sm" onclick="previewPendingLesson(${i})" title="Preview">👁</button>
          </div>`).join('')}
      </div>
    </div>`;
}

function acceptAILessons(topicId) {
  const freshData = getData();
  const topic = freshData[activeCourse]?.topics.find(t => t.id === topicId);
  if (!topic) return;
  topic.lessons = [...topic.lessons, ...aiLessonsPending];
  saveData(freshData);
  aiLessonsPending = [];
  renderTopics();
  showToast(`${topic.lessons.length} lessons saved to "${topic.title}"!`);
}

function discardAILessons(topicId) {
  aiLessonsPending = [];
  renderTopics(); // restores saved lessons
}

// ── Lesson preview modal ──────────────────────────────────────────────────────
function previewLesson(topicId, lessonId) {
  const data = getData();
  const topic = data[activeCourse]?.topics.find(t => t.id === topicId);
  const lesson = topic?.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  showLessonPreview(lesson);
}

function previewPendingLesson(idx) {
  const lesson = aiLessonsPending[idx];
  if (!lesson) return;
  showLessonPreview(lesson);
}

function showLessonPreview(lesson) {
  const typeIcon = { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' };
  const typeColor = { Video: '#ef4444', Reading: '#3b82f6', 'Live Session': '#f59e0b', Lab: '#10b981' };
  const icon = typeIcon[lesson.type] || '📄';
  const color = typeColor[lesson.type] || '#7c3aed';
  const content = lesson.content || '';

  document.getElementById('lessonPreviewBody').innerHTML = `
    <div class="lesson-blog">
      <div class="lb-meta">
        <span class="lb-type-badge" style="background:${color}22;color:${color};border-color:${color}44">
          ${icon} ${lesson.type}
        </span>
        <span class="lb-dur">⏱ ${lesson.duration} min</span>
      </div>
      <div class="lb-intro-card">
        <div class="lb-intro-icon">${icon}</div>
        <div>
          <h2 class="lb-intro-title">${lesson.title}</h2>
          <p class="lb-intro-sub">${lesson.type} · ${lesson.duration} min</p>
        </div>
      </div>
      ${content ? `
      <div class="lb-section">
        <div class="lb-section-label">📖 Lesson Content</div>
        <div class="lb-rich-content">${content}</div>
      </div>` : '<p style="color:var(--muted);padding:20px 0">No content yet.</p>'}
      ${lesson.video ? `
      <div class="lb-section">
        <div class="lb-section-label">🎬 Video Resource</div>
        <a href="${lesson.video}" target="_blank" class="lb-video-link"><span>▶</span> Watch: ${lesson.title}</a>
      </div>` : ''}
    </div>`;
  document.getElementById('lessonPreviewModal').classList.add('active');

  // Init mermaid diagrams if present
  if (content.includes('class="mermaid"') && typeof mermaid !== 'undefined') {
    mermaid.init(undefined, document.querySelectorAll('#lessonPreviewBody .mermaid'));
  }
}

document.getElementById('closeLessonPreviewModal').addEventListener('click', () =>
  document.getElementById('lessonPreviewModal').classList.remove('active'));

// Lesson Modal
let editingLessonId = null; // null = add mode, string = edit mode
let contentMode = 'html';   // 'html' | 'text'

// ── Content mode toggle ───────────────────────────────────────────────────────
function switchContentMode(mode) {
  contentMode = mode;
  document.getElementById('modeHtml').classList.toggle('active', mode === 'html');
  document.getElementById('modeText').classList.toggle('active', mode === 'text');
  document.getElementById('contentHtmlArea').style.display = mode === 'html' ? 'block' : 'none';
  document.getElementById('contentTextArea').style.display = mode === 'text' ? 'block' : 'none';

  if (mode === 'text') {
    // Convert current HTML to plain text for editing
    const html = document.getElementById('lessonContent').value;
    document.getElementById('lessonContentText').value = htmlToPlainText(html);
  } else {
    // Convert plain text back to HTML
    const text = document.getElementById('lessonContentText').value;
    if (text.trim()) {
      document.getElementById('lessonContent').value = plainTextToHtml(text);
    }
  }
}

function htmlToPlainText(html) {
  if (!html.trim()) return '';
  // Strip tags but preserve structure
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n## $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function plainTextToHtml(text) {
  if (!text.trim()) return '';
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      return;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${trimmed.replace(/^#+\s*/, '')}</h2>`;
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${trimmed.replace(/^[•\-\*]\s*/, '')}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${trimmed}</p>`;
    }
  });
  if (inList) html += '</ul>';
  return html;
}

// ── Get content value (handles both modes) ────────────────────────────────────
function getLessonContentValue() {
  if (contentMode === 'text') {
    return plainTextToHtml(document.getElementById('lessonContentText').value);
  }
  return document.getElementById('lessonContent').value;
}

// ── Reset modal to HTML mode ──────────────────────────────────────────────────
function resetContentMode() {
  contentMode = 'html';
  document.getElementById('modeHtml').classList.add('active');
  document.getElementById('modeText').classList.remove('active');
  document.getElementById('contentHtmlArea').style.display = 'block';
  document.getElementById('contentTextArea').style.display = 'none';
}

document.getElementById('closeLessonModal').addEventListener('click', () => {
  document.getElementById('lessonModal').classList.remove('active');
  editingLessonId = null;
});
document.getElementById('cancelLessonBtn').addEventListener('click', () => {
  document.getElementById('lessonModal').classList.remove('active');
  editingLessonId = null;
});

function openLessonModal(topicId, topicName) {
  editingLessonId = null;
  activeTopicId = topicId;
  resetContentMode();
  document.getElementById('lessonModalTitle').textContent = 'Add Lesson to';
  document.getElementById('lessonTopicName').textContent = topicName;
  document.getElementById('lessonTitle').value = '';
  document.getElementById('lessonVideo').value = '';
  document.getElementById('lessonContent').value = '';
  document.getElementById('lessonContentText').value = '';
  document.getElementById('lessonDuration').value = '';
  document.getElementById('lessonType').value = 'Video';
  document.getElementById('saveLessonBtn').textContent = 'Save Lesson';
  document.getElementById('lessonModal').classList.add('active');
}

function openEditLessonModal(topicId, lessonId) {
  const data = getData();
  const topic = data[activeCourse]?.topics.find(t => t.id === topicId);
  const lesson = topic?.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  editingLessonId = lessonId;
  activeTopicId = topicId;
  resetContentMode();

  document.getElementById('lessonModalTitle').textContent = 'Edit Lesson in';
  document.getElementById('lessonTopicName').textContent = topic.title;
  document.getElementById('lessonTitle').value = lesson.title || '';
  document.getElementById('lessonVideo').value = lesson.video || '';
  document.getElementById('lessonContent').value = lesson.content || '';
  document.getElementById('lessonContentText').value = '';
  document.getElementById('lessonDuration').value = lesson.duration || '';
  document.getElementById('lessonType').value = lesson.type || 'Video';
  document.getElementById('saveLessonBtn').textContent = '💾 Update Lesson';
  document.getElementById('lessonModal').classList.add('active');
}

document.getElementById('saveLessonBtn').addEventListener('click', () => {
  const title = document.getElementById('lessonTitle').value.trim();
  if (!title || !activeCourse || !activeTopicId) return;
  const data = getData();
  const topic = data[activeCourse].topics.find(t => t.id === activeTopicId);
  if (!topic) return;

  const lessonData = {
    title,
    video: document.getElementById('lessonVideo').value,
    content: getLessonContentValue(),
    duration: document.getElementById('lessonDuration').value || 30,
    type: document.getElementById('lessonType').value
  };

  if (editingLessonId) {
    // Edit mode — update existing lesson
    const idx = topic.lessons.findIndex(l => l.id === editingLessonId);
    if (idx !== -1) topic.lessons[idx] = { ...topic.lessons[idx], ...lessonData };
  } else {
    // Add mode — push new lesson
    topic.lessons.push({ id: 'lesson_' + Date.now(), ...lessonData });
  }

  saveData(data);
  editingLessonId = null;
  document.getElementById('lessonModal').classList.remove('active');
  renderTopics();
});

// ===== ASSIGNMENTS =====
document.getElementById('btnAddAssignment').addEventListener('click', () => document.getElementById('assignmentForm').style.display = 'block');

document.getElementById('saveAssignBtn').addEventListener('click', () => {
  const title = document.getElementById('assignTitle').value.trim();
  if (!title || !activeCourse) return;
  const data = getData();
  data[activeCourse].assignments.push({ id: 'assign_' + Date.now(), title, description: document.getElementById('assignDesc').value, due: document.getElementById('assignDue').value || 7, marks: document.getElementById('assignMarks').value || 100 });
  saveData(data);
  document.getElementById('assignmentForm').style.display = 'none';
  document.getElementById('assignTitle').value = '';
  document.getElementById('assignDesc').value = '';
  renderAssignments();
});

function renderAssignments() {
  if (!activeCourse) return;
  const items = getData()[activeCourse]?.assignments || [];
  const el = document.getElementById('assignmentsList');
  if (!items.length) { el.innerHTML = '<div class="empty-card">No assignments yet.</div>'; return; }
  el.innerHTML = items.map(a => `
    <div class="content-card">
      <div class="content-card-header">
        <div>
          <span class="content-type-badge assign-badge">📝 Assignment</span>
          <h3>${a.title}</h3>
          <p>${a.description}</p>
        </div>
        <div class="content-meta">
          <span>⏰ Due in ${a.due} days</span>
          <span>🏆 ${a.marks} marks</span>
          <button class="btn-del" onclick="deleteItem('assignments','${a.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

// ===== QUIZZES =====
document.getElementById('btnAddQuiz').addEventListener('click', () => { document.getElementById('quizForm').style.display = 'block'; qCount = 1; });

document.getElementById('addQuestionBtn').addEventListener('click', () => {
  qCount++;
  const block = document.createElement('div');
  block.className = 'question-block';
  block.id = `q-${qCount-1}`;
  block.innerHTML = `
    <div class="form-group"><label>Question ${qCount}</label><input type="text" class="q-text" placeholder="Enter question..."/></div>
    <div class="options-grid">
      <input type="text" class="q-opt" placeholder="Option A"/>
      <input type="text" class="q-opt" placeholder="Option B"/>
      <input type="text" class="q-opt" placeholder="Option C"/>
      <input type="text" class="q-opt" placeholder="Option D"/>
    </div>
    <div class="form-group"><label>Correct Answer</label>
      <select class="q-answer"><option>A</option><option>B</option><option>C</option><option>D</option></select>
    </div>`;
  document.getElementById('quizQuestions').appendChild(block);
});

document.getElementById('saveQuizBtn').addEventListener('click', () => {
  const title = document.getElementById('quizTitle').value.trim();
  if (!title || !activeCourse) return;
  const questions = [];
  document.querySelectorAll('.question-block').forEach(block => {
    const opts = [...block.querySelectorAll('.q-opt')].map(o => o.value);
    questions.push({ question: block.querySelector('.q-text').value, options: opts, answer: block.querySelector('.q-answer').value });
  });
  const data = getData();
  data[activeCourse].quizzes.push({ id: 'quiz_' + Date.now(), title, time: document.getElementById('quizTime').value || 30, questions });
  saveData(data);
  document.getElementById('quizForm').style.display = 'none';
  document.getElementById('quizTitle').value = '';
  renderQuizzes();
});

function renderQuizzes() {
  if (!activeCourse) return;
  const items = getData()[activeCourse]?.quizzes || [];
  const el = document.getElementById('quizzesList');
  if (!items.length) { el.innerHTML = '<div class="empty-card">No quizzes yet.</div>'; return; }
  el.innerHTML = items.map(q => `
    <div class="content-card">
      <div class="content-card-header">
        <div>
          <span class="content-type-badge quiz-badge">🧠 Quiz</span>
          <h3>${q.title}</h3>
          <p>${q.questions.length} questions · ⏱ ${q.time} mins</p>
        </div>
        <div class="content-meta">
          <button class="btn-view" onclick="previewQuiz('${q.id}')">👁 Preview</button>
          <button class="btn-del" onclick="deleteItem('quizzes','${q.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

function previewQuiz(qid) {
  const quiz = getData()[activeCourse]?.quizzes.find(q => q.id === qid);
  if (!quiz) return;
  alert(`Quiz: ${quiz.title}\n\n${quiz.questions.map((q,i) => `Q${i+1}: ${q.question}\nA: ${q.options[0]}  B: ${q.options[1]}  C: ${q.options[2]}  D: ${q.options[3]}\nAnswer: ${q.answer}`).join('\n\n')}`);
}

// ===== PROJECTS =====
document.getElementById('btnAddProject').addEventListener('click', () => document.getElementById('projectForm').style.display = 'block');

document.getElementById('saveProjectBtn').addEventListener('click', () => {
  const title = document.getElementById('projectTitle').value.trim();
  if (!title || !activeCourse) return;
  const data = getData();
  data[activeCourse].projects.push({ id: 'proj_' + Date.now(), title, description: document.getElementById('projectDesc').value, difficulty: document.getElementById('projectDiff').value, stack: document.getElementById('projectStack').value, days: document.getElementById('projectDays').value || 14 });
  saveData(data);
  document.getElementById('projectForm').style.display = 'none';
  document.getElementById('projectTitle').value = '';
  document.getElementById('projectDesc').value = '';
  renderProjects();
});

function renderProjects() {
  if (!activeCourse) return;
  const items = getData()[activeCourse]?.projects || [];
  const el = document.getElementById('projectsList');
  if (!items.length) { el.innerHTML = '<div class="empty-card">No projects yet.</div>'; return; }
  el.innerHTML = items.map(p => `
    <div class="content-card">
      <div class="content-card-header">
        <div>
          <span class="content-type-badge project-badge">🚀 Project</span>
          <span class="diff-badge diff-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <p class="stack-info">🛠 ${p.stack}</p>
        </div>
        <div class="content-meta">
          <span>📅 ${p.days} days</span>
          <button class="btn-del" onclick="deleteItem('projects','${p.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

// ===== RESOURCES =====
document.getElementById('btnAddResource').addEventListener('click', () => document.getElementById('resourceForm').style.display = 'block');

document.getElementById('saveResourceBtn').addEventListener('click', () => {
  const title = document.getElementById('resourceTitle').value.trim();
  if (!title || !activeCourse) return;
  const data = getData();
  data[activeCourse].resources.push({ id: 'res_' + Date.now(), title, type: document.getElementById('resourceType').value, url: document.getElementById('resourceUrl').value });
  saveData(data);
  document.getElementById('resourceForm').style.display = 'none';
  document.getElementById('resourceTitle').value = '';
  renderResources();
});

function renderResources() {
  if (!activeCourse) return;
  const items = getData()[activeCourse]?.resources || [];
  const el = document.getElementById('resourcesList');
  if (!items.length) { el.innerHTML = '<div class="empty-card">No resources yet.</div>'; return; }
  const icons = { PDF: '📄', Video: '▶', Link: '🔗', GitHub: '🐙', Notebook: '📓' };
  el.innerHTML = items.map(r => `
    <div class="content-card">
      <div class="content-card-header">
        <div>
          <span class="content-type-badge resource-badge">${icons[r.type] || '📎'} ${r.type}</span>
          <h3>${r.title}</h3>
          ${r.url ? `<a href="${r.url}" target="_blank" class="resource-link">${r.url}</a>` : ''}
        </div>
        <div class="content-meta">
          <button class="btn-del" onclick="deleteItem('resources','${r.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

// ===== DELETE HELPER =====
function deleteItem(type, id) {
  if (!confirm('Delete this item?')) return;
  const data = getData();
  data[activeCourse][type] = data[activeCourse][type].filter(i => i.id !== id);
  saveData(data);
  if (type === 'assignments') renderAssignments();
  if (type === 'quizzes') renderQuizzes();
  if (type === 'projects') renderProjects();
  if (type === 'resources') renderResources();
}

init();

// ===== AI COURSE GENERATOR (Groq-powered) =====
let aiGenerateMode = 'inject'; // always inject into active course from tab button
let aiCurrentModules = [];     // modules generated in step 2
let aiLastPrompt = '';         // for regenerate

// ── Helpers ──────────────────────────────────────────────────────────────────
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // ← paste your Groq key here (get it from console.groq.com)
function getGroqKey() { return GROQ_API_KEY; }
function saveGroqKey() {}

// ── Open prompt modal from tab button ────────────────────────────────────────
document.getElementById('btnAIGenerateCourse').addEventListener('click', () => {
  if (!activeCourse) return;
  const course = getData()[activeCourse];
  document.getElementById('aiPromptCourseName').textContent = '📘 ' + course.name;
  document.getElementById('aiModulesCourseLabel').textContent = '📘 ' + course.name;
  document.getElementById('aiPromptText').value = '';
  document.getElementById('aiPromptModal').classList.add('active');
});

// ── Open prompt modal from New Course modal ───────────────────────────────────
document.getElementById('btnAIGenerate').addEventListener('click', () => {
  const name = document.getElementById('newCourseName').value.trim();
  if (!name) return alert('Enter a course name first.');
  aiGenerateMode = 'new';
  document.getElementById('courseModal').classList.remove('active');
  document.getElementById('aiPromptCourseName').textContent = '📘 ' + name;
  document.getElementById('aiModulesCourseLabel').textContent = '📘 ' + name;
  document.getElementById('aiPromptText').value = '';
  document.getElementById('aiPromptModal').classList.add('active');
});

// ── Close / cancel prompt modal ───────────────────────────────────────────────
document.getElementById('closeAIPromptModal').addEventListener('click', () => document.getElementById('aiPromptModal').classList.remove('active'));
document.getElementById('cancelAIPromptBtn').addEventListener('click', () => document.getElementById('aiPromptModal').classList.remove('active'));

// ── Quick chips ───────────────────────────────────────────────────────────────
function appendChip(text) {
  const ta = document.getElementById('aiPromptText');
  ta.value = ta.value ? ta.value.trimEnd() + ', ' + text : text;
  ta.focus();
}

// ── Run: Generate Modules ─────────────────────────────────────────────────────
document.getElementById('btnRunAIGenerate').addEventListener('click', async () => {
  const key = getGroqKey();
  const prompt = document.getElementById('aiPromptText').value.trim();
  if (!prompt) return alert('Please describe the course (duration, topics, etc.).');
  aiLastPrompt = prompt;
  aiGenerateMode = activeCourse ? 'inject' : 'new';
  document.getElementById('aiPromptModal').classList.remove('active');
  await generateModulesWithGroq(key, prompt);
});

// ── Regenerate modules ────────────────────────────────────────────────────────
document.getElementById('btnRegenModules').addEventListener('click', async () => {
  const key = getGroqKey();
  if (!key || !aiLastPrompt) return;
  await generateModulesWithGroq(key, aiLastPrompt);
});

// ── Close modules modal ───────────────────────────────────────────────────────
document.getElementById('closeAIModulesModal').addEventListener('click', () => document.getElementById('aiModulesModal').classList.remove('active'));

// ── Save all modules to course ────────────────────────────────────────────────
document.getElementById('btnSaveModules').addEventListener('click', () => {
  if (!aiCurrentModules.length) return;

  if (aiGenerateMode === 'inject' && activeCourse) {
    const data = getData();
    const course = data[activeCourse];
    const existingTitles = (course.topics || []).map(t => t.title.toLowerCase());
    aiCurrentModules.forEach(m => {
      if (!existingTitles.includes(m.title.toLowerCase())) {
        course.topics.push(m);
      }
    });
    saveData(data);
    renderTopics();
    document.getElementById('aiModulesModal').classList.remove('active');
    showToast(`${aiCurrentModules.length} modules added to course!`);
  } else {
    // new course mode — create course then inject
    const name = document.getElementById('aiPromptCourseName').textContent.replace('📘 ', '').trim();
    const data = getData();
    const id = 'course_' + Date.now();
    data[id] = {
      name,
      category: selectedCategory !== 'all' ? selectedCategory : detectCategoryFromName(name),
      duration: 'Self-paced',
      topics: aiCurrentModules,
      assignments: [], quizzes: [], projects: [], resources: []
    };
    saveData(data);
    populateCourseSelect();
    document.getElementById('courseSelect').value = id;
    selectCourse(id);
    document.getElementById('aiModulesModal').classList.remove('active');
    showToast(`Course created with ${aiCurrentModules.length} modules!`);
  }
});

// ── Core: call Groq to generate modules ──────────────────────────────────────
async function generateModulesWithGroq(apiKey, userPrompt) {
  // Show loading
  document.getElementById('aiModulesModal').classList.add('active');
  document.getElementById('aiModulesLoading').style.display = 'block';
  document.getElementById('aiModulesResult').style.display = 'none';
  document.getElementById('aiLoadingTitle').textContent = '✨ Generating modules...';
  document.getElementById('aiLoadingStatus').textContent = 'Calling Groq AI — this takes a few seconds...';

  const courseName = document.getElementById('aiPromptCourseName').textContent.replace('📘 ', '').trim();

  const systemPrompt = `You are an expert course curriculum designer. Given a course name and user instructions, generate ONLY the module list (no lessons yet). Return a valid JSON array of modules. Each module must have:
- "order": number (1, 2, 3...)
- "title": string (e.g. "Module 1: Introduction to Agents")
- "description": string (2-3 sentence overview of what this module covers)
- "highlights": array of 3-5 strings (key topics/skills covered)
- "duration": string (e.g. "Week 1", "Week 1-2", "6 hrs")

Return ONLY the JSON array, no markdown, no explanation.`;

  const userMsg = `Course name: "${courseName}"
User instructions: ${userPrompt}

Generate the module list for this course.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content || '';

    // Parse JSON — strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const modules = JSON.parse(cleaned);

    // Normalise into topic format
    aiCurrentModules = modules.map((m, i) => ({
      id: 'topic_' + Date.now() + '_' + i,
      title: m.title || `Module ${m.order || i+1}`,
      order: m.order || i + 1,
      description: m.description || '',
      highlights: m.highlights || [],
      duration: m.duration || '',
      lessons: []   // empty — filled by "Generate Lessons"
    }));

    renderAIModules();

  } catch (e) {
    document.getElementById('aiLoadingTitle').textContent = '❌ Error';
    document.getElementById('aiLoadingStatus').textContent = e.message || 'Something went wrong. Check your API key and try again.';
  }
}

// ── Render module cards ───────────────────────────────────────────────────────
function renderAIModules() {
  document.getElementById('aiModulesLoading').style.display = 'none';
  document.getElementById('aiModulesResult').style.display = 'block';

  const list = document.getElementById('aiModulesList');
  list.innerHTML = aiCurrentModules.map((m, idx) => `
    <div class="ai-module-card" id="aimod-${idx}">
      <div class="ai-module-top">
        <div class="ai-module-order">Module ${m.order}</div>
        ${m.duration ? `<span class="ai-module-dur">⏱ ${m.duration}</span>` : ''}
      </div>
      <h3 class="ai-module-title">${m.title}</h3>
      <p class="ai-module-desc">${m.description}</p>
      ${m.highlights.length ? `
        <div class="ai-module-highlights">
          ${m.highlights.map(h => `<span class="ai-highlight-chip">✓ ${h}</span>`).join('')}
        </div>` : ''}

      <!-- Lessons area -->
      <div class="ai-lessons-area" id="ailessons-${idx}">
        ${m.lessons.length ? renderAILessonsPreview(m.lessons) : `
          <button class="btn-gen-lessons" onclick="generateLessonsForModule(${idx})">
            ✨ Generate Lessons
          </button>`}
      </div>
    </div>
  `).join('');
}

function renderAILessonsPreview(lessons) {
  return `<div class="ai-lessons-list">
    ${lessons.map((l, i) => `
      <div class="ai-lesson-row">
        <span class="ai-lesson-num">${i+1}</span>
        <span class="ai-lesson-type-icon">${lessonIcon(l.type)}</span>
        <span class="ai-lesson-name">${l.title}</span>
        <span class="ai-lesson-dur">${l.duration} min</span>
      </div>`).join('')}
  </div>`;
}

// ── Generate lessons for a single module ─────────────────────────────────────
async function generateLessonsForModule(idx) {
  const apiKey = getGroqKey();
  if (!apiKey) return alert('No Groq API key saved. Please re-open AI Generate.');

  const module = aiCurrentModules[idx];
  const courseName = document.getElementById('aiPromptCourseName').textContent.replace('📘 ', '').trim();

  const area = document.getElementById(`ailessons-${idx}`);
  area.innerHTML = `<div class="ai-lessons-loading"><div class="ai-spinner-sm"></div><span>Generating lesson list...</span></div>`;

  const listPrompt = `You are an expert course curriculum designer. Generate a lesson list for a course module. Return a valid JSON array. Each item must have:
- "title": string
- "type": one of "Video", "Reading", "Lab", "Live Session"
- "duration": number (minutes)
- "summary": string (one sentence summary)

Return ONLY the JSON array, no markdown, no explanation.`;

  const listMsg = `Course: "${courseName}"
Module: "${module.title}"
Description: ${module.description}
Key topics: ${module.highlights.join(', ')}
Instructions: ${aiLastPrompt}

Generate 4-6 lessons for this module.`;

  try {
    const listRaw = await callGroq(apiKey, listPrompt, listMsg, 800);
    const lessonList = JSON.parse(listRaw.replace(/```json|```/g, '').trim());

    // Generate rich content for each lesson
    const richLessons = [];
    for (let i = 0; i < lessonList.length; i++) {
      const l = lessonList[i];
      area.querySelector('span').textContent = `Generating lesson ${i+1}/${lessonList.length}: "${l.title}"...`;
      const richContent = await generateRichLessonContent(apiKey, courseName, module.title, l);
      richLessons.push({
        id: 'lesson_' + Date.now() + '_' + i,
        title: l.title,
        type: l.type || 'Video',
        duration: l.duration || 30,
        summary: l.summary || '',
        content: richContent,
        video: ''
      });
    }

    aiCurrentModules[idx].lessons = richLessons;
    area.innerHTML = renderAILessonsPreview(aiCurrentModules[idx].lessons) +
      `<button class="btn-regen-lessons" onclick="generateLessonsForModule(${idx})">🔄 Regenerate Lessons</button>`;

  } catch (e) {
    area.innerHTML = `<div class="ai-lessons-error">❌ ${e.message} <button class="btn-gen-lessons" onclick="generateLessonsForModule(${idx})">Retry</button></div>`;
  }
}

// ── Legacy template functions (no longer called, kept for reference) ──────────
function startAIGeneration() {}
function showAIPreview() {}

function generateCourseData(name, category, duration) {
  const templates = getTemplates(name, category);
  return {
    name, category, duration,
    topics: templates.topics,
    assignments: templates.assignments,
    quizzes: templates.quizzes,
    projects: templates.projects,
    resources: templates.resources
  };
}

function getTemplates(name, category) {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // ---- GENERATIVE AI / LLM ----
  if (c.includes('generative') || c.includes('llm') || n.includes('gpt') || n.includes('llm') || n.includes('generative')) {
    return {
      topics: [
        { id: tid(), title: 'Module 1: Foundations of Generative AI', order: 1, lessons: [
          lesson('What is Generative AI?', 'Video', 20, 'Introduction to generative models, their history and real-world applications.'),
          lesson('How LLMs Work', 'Video', 30, 'Deep dive into transformer architecture, attention mechanisms and tokenization.'),
          lesson('Prompt Basics', 'Reading', 15, 'Understanding how prompts influence model outputs.'),
          lesson('Setting Up Your Environment', 'Lab', 45, 'Install Python, OpenAI SDK, LangChain and configure API keys.'),
        ]},
        { id: tid(), title: 'Module 2: Prompt Engineering', order: 2, lessons: [
          lesson('Zero-Shot & Few-Shot Prompting', 'Video', 25, 'Techniques for guiding LLMs without or with minimal examples.'),
          lesson('Chain-of-Thought Prompting', 'Video', 30, 'Improve reasoning by asking models to think step by step.'),
          lesson('System Prompts & Personas', 'Reading', 20, 'Crafting effective system prompts for consistent AI behavior.'),
          lesson('Prompt Templates Lab', 'Lab', 60, 'Build reusable prompt templates for different use cases.'),
        ]},
        { id: tid(), title: 'Module 3: RAG & Vector Databases', order: 3, lessons: [
          lesson('Introduction to RAG', 'Video', 25, 'Retrieval-Augmented Generation — why and when to use it.'),
          lesson('Embeddings & Semantic Search', 'Video', 35, 'How text embeddings work and how to use them for search.'),
          lesson('Building with LangChain', 'Lab', 60, 'Build a RAG pipeline using LangChain and ChromaDB.'),
          lesson('LlamaIndex Deep Dive', 'Lab', 45, 'Index documents and query them with LlamaIndex.'),
        ]},
        { id: tid(), title: 'Module 4: Fine-Tuning & Deployment', order: 4, lessons: [
          lesson('When to Fine-Tune', 'Reading', 20, 'Understanding when fine-tuning beats prompt engineering.'),
          lesson('LoRA & QLoRA Techniques', 'Video', 40, 'Parameter-efficient fine-tuning methods for LLMs.'),
          lesson('Deploying LLMs to Production', 'Video', 35, 'Deploy models using FastAPI, Docker and cloud platforms.'),
          lesson('Monitoring & Cost Optimization', 'Lab', 45, 'Track usage, latency and optimize API costs.'),
        ]},
        { id: tid(), title: 'Module 5: Capstone', order: 5, lessons: [
          lesson('Capstone Project Briefing', 'Video', 15, 'Overview of the final project requirements and evaluation criteria.'),
          lesson('Build Your AI Application', 'Lab', 120, 'End-to-end project: build, test and deploy a GenAI application.'),
          lesson('Code Review & Feedback', 'Live Session', 60, 'Live session with instructor for code review and Q&A.'),
        ]},
      ],
      assignments: [
        { id: aid(), title: 'Prompt Engineering Challenge', description: 'Design 10 effective prompts for different business use cases and document the results.', due: 7, marks: 100 },
        { id: aid(), title: 'Build a RAG Pipeline', description: 'Create a document Q&A system using LangChain, OpenAI and a vector database of your choice.', due: 14, marks: 150 },
        { id: aid(), title: 'Fine-Tune a Small LLM', description: 'Fine-tune a small open-source model on a custom dataset using LoRA and evaluate its performance.', due: 21, marks: 200 },
      ],
      quizzes: [
        { id: qid(), title: 'Module 1 — Foundations Quiz', time: 15, questions: [
          { question: 'What architecture do most modern LLMs use?', options: ['CNN', 'Transformer', 'RNN', 'LSTM'], answer: 'B' },
          { question: 'What does RAG stand for?', options: ['Random AI Generation', 'Retrieval-Augmented Generation', 'Recursive AI Graph', 'Rapid AI Generation'], answer: 'B' },
          { question: 'Which company created GPT-4?', options: ['Google', 'Meta', 'OpenAI', 'Anthropic'], answer: 'C' },
          { question: 'What is tokenization in LLMs?', options: ['Encrypting text', 'Breaking text into smaller units', 'Translating text', 'Compressing text'], answer: 'B' },
          { question: 'Which technique improves LLM reasoning step by step?', options: ['Zero-shot', 'Chain-of-Thought', 'Fine-tuning', 'Embedding'], answer: 'B' },
        ]},
        { id: qid(), title: 'Module 3 — RAG & Vectors Quiz', time: 20, questions: [
          { question: 'What is a vector database used for?', options: ['Storing images', 'Storing embeddings for similarity search', 'Running SQL queries', 'Training models'], answer: 'B' },
          { question: 'Which library is commonly used for RAG pipelines?', options: ['TensorFlow', 'LangChain', 'Pandas', 'Scikit-learn'], answer: 'B' },
          { question: 'What does an embedding represent?', options: ['A compressed image', 'A numerical vector of semantic meaning', 'A database index', 'A model weight'], answer: 'B' },
        ]},
      ],
      projects: [
        { id: pid(), title: 'AI Customer Support Chatbot', description: 'Build a RAG-powered customer support chatbot that answers questions from a product knowledge base.', difficulty: 'Intermediate', stack: 'Python, LangChain, OpenAI, ChromaDB, FastAPI', days: 14 },
        { id: pid(), title: 'Document Intelligence System', description: 'Create a system that ingests PDFs, extracts insights and answers natural language queries.', difficulty: 'Advanced', stack: 'Python, LlamaIndex, OpenAI, Streamlit', days: 21 },
        { id: pid(), title: 'Capstone: Production GenAI App', description: 'Design and deploy a full-stack GenAI application with authentication, RAG, and monitoring.', difficulty: 'Advanced', stack: 'Python, LangChain, OpenAI, Docker, AWS', days: 30 },
      ],
      resources: [
        { id: rid(), title: 'Attention Is All You Need (Paper)', type: 'Link', url: 'https://arxiv.org/abs/1706.03762' },
        { id: rid(), title: 'LangChain Documentation', type: 'Link', url: 'https://docs.langchain.com' },
        { id: rid(), title: 'OpenAI API Reference', type: 'Link', url: 'https://platform.openai.com/docs' },
        { id: rid(), title: 'Course Starter Notebook', type: 'Notebook', url: '#' },
        { id: rid(), title: 'Prompt Engineering Guide', type: 'PDF', url: '#' },
      ]
    };
  }

  // ---- AGENTIC AI ----
  if (c.includes('agentic') || n.includes('agent')) {
    return {
      topics: [
        { id: tid(), title: 'Module 1: Agent Fundamentals', order: 1, lessons: [
          lesson('What are AI Agents?', 'Video', 20, 'Introduction to autonomous AI agents, their capabilities and use cases.'),
          lesson('ReAct Framework', 'Video', 30, 'Reasoning and Acting — how agents plan and execute tasks.'),
          lesson('Tool Use & Function Calling', 'Lab', 45, 'Give agents access to tools like search, calculators and APIs.'),
          lesson('Memory Systems', 'Reading', 25, 'Short-term, long-term and episodic memory in AI agents.'),
        ]},
        { id: tid(), title: 'Module 2: Agent Frameworks', order: 2, lessons: [
          lesson('LangGraph Basics', 'Video', 35, 'Build stateful multi-step agent workflows with LangGraph.'),
          lesson('CrewAI Multi-Agents', 'Lab', 60, 'Create teams of specialized AI agents with CrewAI.'),
          lesson('AutoGen Setup', 'Lab', 45, 'Build conversational multi-agent systems with Microsoft AutoGen.'),
          lesson('n8n AI Workflows', 'Video', 30, 'Automate workflows visually using n8n with AI nodes.'),
        ]},
        { id: tid(), title: 'Module 3: Cloud Agent Deployment', order: 3, lessons: [
          lesson('AWS Bedrock Agents', 'Video', 40, 'Deploy production agents using AWS Bedrock and Lambda.'),
          lesson('Azure AutoGen on Cloud', 'Lab', 45, 'Run multi-agent systems on Azure infrastructure.'),
          lesson('Vertex AI Agents', 'Video', 35, 'Build and deploy agents using Google Cloud Vertex AI.'),
        ]},
        { id: tid(), title: 'Module 4: Enterprise & Production', order: 4, lessons: [
          lesson('Agent Architecture Patterns', 'Reading', 30, 'Design patterns for scalable, reliable agent systems.'),
          lesson('Security & Governance', 'Video', 25, 'Guardrails, safety filters and enterprise compliance for agents.'),
          lesson('AgentOps Monitoring', 'Lab', 45, 'Monitor agent performance, costs and errors in production.'),
          lesson('Capstone Project', 'Lab', 120, 'Build and deploy a complete multi-agent AI system.'),
        ]},
      ],
      assignments: [
        { id: aid(), title: 'Build a Tool-Using Agent', description: 'Create an AI agent that can search the web, read files and answer complex questions.', due: 7, marks: 100 },
        { id: aid(), title: 'Multi-Agent Workflow', description: 'Design a CrewAI workflow with at least 3 specialized agents working together on a business task.', due: 14, marks: 150 },
        { id: aid(), title: 'Cloud Agent Deployment', description: 'Deploy an agent to AWS Bedrock or Azure and document the architecture.', due: 21, marks: 200 },
      ],
      quizzes: [
        { id: qid(), title: 'Agent Fundamentals Quiz', time: 15, questions: [
          { question: 'What does ReAct stand for in AI agents?', options: ['Reactive Actions', 'Reasoning and Acting', 'Real-time Execution', 'Recursive Agent Tasks'], answer: 'B' },
          { question: 'Which framework is used for multi-agent teams?', options: ['TensorFlow', 'CrewAI', 'Pandas', 'Flask'], answer: 'B' },
          { question: 'What is the purpose of tool use in agents?', options: ['Training models', 'Accessing external capabilities', 'Storing data', 'Rendering UI'], answer: 'B' },
          { question: 'Which AWS service is used for deploying AI agents?', options: ['EC2', 'S3', 'Bedrock', 'RDS'], answer: 'C' },
        ]},
      ],
      projects: [
        { id: pid(), title: 'Autonomous Research Agent', description: 'Build an agent that researches a topic, summarizes findings and generates a report.', difficulty: 'Intermediate', stack: 'Python, LangGraph, OpenAI, Tavily Search', days: 14 },
        { id: pid(), title: 'Enterprise AI Automation System', description: 'Create a multi-agent system that automates a complete business workflow end-to-end.', difficulty: 'Advanced', stack: 'CrewAI, LangChain, FastAPI, Docker', days: 21 },
      ],
      resources: [
        { id: rid(), title: 'LangGraph Documentation', type: 'Link', url: 'https://langchain-ai.github.io/langgraph/' },
        { id: rid(), title: 'CrewAI GitHub', type: 'GitHub', url: 'https://github.com/joaomdmoura/crewAI' },
        { id: rid(), title: 'AgentOps Documentation', type: 'Link', url: 'https://docs.agentops.ai' },
        { id: rid(), title: 'Agent Starter Notebook', type: 'Notebook', url: '#' },
      ]
    };
  }

  // ---- DATA SCIENCE ----
  if (c.includes('data') || n.includes('data')) {
    return {
      topics: [
        { id: tid(), title: 'Module 1: Python for Data Science', order: 1, lessons: [
          lesson('Python Basics Refresher', 'Video', 30, 'Quick review of Python fundamentals for data science.'),
          lesson('NumPy Arrays & Operations', 'Lab', 45, 'Numerical computing with NumPy arrays and vectorized operations.'),
          lesson('Pandas DataFrames', 'Lab', 60, 'Data manipulation, cleaning and analysis with Pandas.'),
          lesson('Data Cleaning Techniques', 'Reading', 25, 'Handling missing values, outliers and data quality issues.'),
        ]},
        { id: tid(), title: 'Module 2: Data Visualization', order: 2, lessons: [
          lesson('Matplotlib Fundamentals', 'Lab', 40, 'Create charts, plots and visualizations with Matplotlib.'),
          lesson('Seaborn for Statistical Plots', 'Lab', 35, 'Beautiful statistical visualizations with Seaborn.'),
          lesson('Power BI Basics', 'Video', 45, 'Build interactive dashboards with Microsoft Power BI.'),
          lesson('Tableau Essentials', 'Video', 40, 'Create data stories and dashboards with Tableau.'),
        ]},
        { id: tid(), title: 'Module 3: Machine Learning', order: 3, lessons: [
          lesson('Supervised Learning', 'Video', 40, 'Regression and classification algorithms with Scikit-learn.'),
          lesson('Unsupervised Learning', 'Video', 35, 'Clustering, dimensionality reduction and anomaly detection.'),
          lesson('Model Evaluation', 'Lab', 45, 'Cross-validation, metrics and model selection techniques.'),
          lesson('Feature Engineering', 'Reading', 30, 'Transform raw data into meaningful features for ML models.'),
        ]},
        { id: tid(), title: 'Module 4: AI Tools for Data', order: 4, lessons: [
          lesson('ChatGPT for Data Analysis', 'Lab', 30, 'Use ChatGPT to write SQL, analyze data and generate insights.'),
          lesson('Copilot in Excel & Power BI', 'Video', 35, 'AI-powered data analysis with Microsoft Copilot.'),
          lesson('AutoML with H2O & AutoSklearn', 'Lab', 45, 'Automate model selection and hyperparameter tuning.'),
        ]},
      ],
      assignments: [
        { id: aid(), title: 'EDA on Real Dataset', description: 'Perform exploratory data analysis on a Kaggle dataset and present your findings with visualizations.', due: 7, marks: 100 },
        { id: aid(), title: 'ML Model Building', description: 'Build, train and evaluate 3 different ML models on a classification problem and compare results.', due: 14, marks: 150 },
        { id: aid(), title: 'Dashboard Creation', description: 'Create an interactive Power BI or Tableau dashboard from a business dataset.', due: 21, marks: 100 },
      ],
      quizzes: [
        { id: qid(), title: 'Python & Pandas Quiz', time: 15, questions: [
          { question: 'Which library is used for numerical computing in Python?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn'], answer: 'B' },
          { question: 'What does df.dropna() do in Pandas?', options: ['Drops all columns', 'Removes rows with missing values', 'Fills missing values', 'Renames columns'], answer: 'B' },
          { question: 'Which algorithm is used for classification?', options: ['K-Means', 'Linear Regression', 'Random Forest', 'PCA'], answer: 'C' },
          { question: 'What is the purpose of cross-validation?', options: ['Speed up training', 'Evaluate model generalization', 'Clean data', 'Visualize data'], answer: 'B' },
        ]},
      ],
      projects: [
        { id: pid(), title: 'Sales Forecasting Model', description: 'Build a time-series forecasting model to predict monthly sales for a retail company.', difficulty: 'Intermediate', stack: 'Python, Pandas, Scikit-learn, Prophet', days: 14 },
        { id: pid(), title: 'Customer Churn Prediction', description: 'Predict customer churn using ML models and build a dashboard to visualize risk scores.', difficulty: 'Advanced', stack: 'Python, XGBoost, Power BI, FastAPI', days: 21 },
      ],
      resources: [
        { id: rid(), title: 'Kaggle Datasets', type: 'Link', url: 'https://www.kaggle.com/datasets' },
        { id: rid(), title: 'Scikit-learn Documentation', type: 'Link', url: 'https://scikit-learn.org/stable/' },
        { id: rid(), title: 'Pandas Cheat Sheet', type: 'PDF', url: '#' },
        { id: rid(), title: 'Starter Notebook', type: 'Notebook', url: '#' },
      ]
    };
  }

  // ---- DEFAULT FALLBACK ----
  return {
    topics: [
      { id: tid(), title: 'Module 1: Introduction', order: 1, lessons: [
        lesson('Course Overview', 'Video', 15, `Welcome to ${name}. This lesson covers what you will learn and how the course is structured.`),
        lesson('Core Concepts', 'Reading', 20, 'Foundational concepts and terminology you need to know.'),
        lesson('Environment Setup', 'Lab', 30, 'Set up all tools and dependencies required for this course.'),
      ]},
      { id: tid(), title: 'Module 2: Core Skills', order: 2, lessons: [
        lesson('Fundamentals Deep Dive', 'Video', 40, 'In-depth exploration of the core skills in this domain.'),
        lesson('Hands-on Practice', 'Lab', 60, 'Apply what you have learned through guided exercises.'),
        lesson('Real-World Examples', 'Video', 30, 'See how these skills are applied in industry.'),
      ]},
      { id: tid(), title: 'Module 3: Advanced Topics', order: 3, lessons: [
        lesson('Advanced Concepts', 'Video', 45, 'Take your skills to the next level with advanced techniques.'),
        lesson('Industry Best Practices', 'Reading', 25, 'Learn the standards and practices used by professionals.'),
        lesson('Case Studies', 'Video', 35, 'Analyze real-world case studies from top companies.'),
      ]},
      { id: tid(), title: 'Module 4: Capstone', order: 4, lessons: [
        lesson('Project Planning', 'Video', 20, 'Plan your capstone project with clear goals and milestones.'),
        lesson('Build & Deploy', 'Lab', 120, 'Build your complete capstone project from scratch.'),
        lesson('Final Presentation', 'Live Session', 60, 'Present your project to the instructor and peers.'),
      ]},
    ],
    assignments: [
      { id: aid(), title: 'Assignment 1: Fundamentals', description: `Complete the foundational exercises for ${name} and submit your work with documentation.`, due: 7, marks: 100 },
      { id: aid(), title: 'Assignment 2: Applied Project', description: 'Apply the skills learned in modules 2 and 3 to solve a real-world problem.', due: 14, marks: 150 },
    ],
    quizzes: [
      { id: qid(), title: 'Module 1 Quiz', time: 15, questions: [
        { question: `What is the primary focus of ${name}?`, options: ['Theory only', 'Practical skills and real-world application', 'History', 'Mathematics'], answer: 'B' },
        { question: 'What is the best way to learn a new skill?', options: ['Reading only', 'Watching videos', 'Hands-on practice', 'Memorizing'], answer: 'C' },
        { question: 'What does a capstone project demonstrate?', options: ['Basic knowledge', 'Comprehensive mastery of course skills', 'Speed', 'Memorization'], answer: 'B' },
      ]},
    ],
    projects: [
      { id: pid(), title: `${name} — Capstone Project`, description: `Build a complete end-to-end project applying all skills learned in ${name}.`, difficulty: 'Advanced', stack: 'As per course requirements', days: 21 },
    ],
    resources: [
      { id: rid(), title: 'Course Handbook', type: 'PDF', url: '#' },
      { id: rid(), title: 'Starter Code Repository', type: 'GitHub', url: '#' },
      { id: rid(), title: 'Reference Documentation', type: 'Link', url: '#' },
    ]
  };
}

// ID helpers
const tid = () => 'topic_' + Date.now() + Math.random().toString(36).slice(2,6);
const aid = () => 'assign_' + Date.now() + Math.random().toString(36).slice(2,6);
const qid = () => 'quiz_' + Date.now() + Math.random().toString(36).slice(2,6);
const pid = () => 'proj_' + Date.now() + Math.random().toString(36).slice(2,6);
const rid = () => 'res_' + Date.now() + Math.random().toString(36).slice(2,6);
const lesson = (title, type, duration, content) => ({ id: 'lesson_' + Date.now() + Math.random().toString(36).slice(2,6), title, type, duration, content, video: '' });

function renderAIPreview(data) {
  const typeIcon = { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' };
  return `
    <div class="ai-preview-section">
      <div class="ai-preview-label">📚 ${data.topics.length} Topics · ${data.topics.reduce((s,t)=>s+t.lessons.length,0)} Lessons</div>
      ${data.topics.map(t => `
        <div class="ai-preview-topic">
          <div class="ai-preview-topic-title">Module ${t.order}: ${t.title}</div>
          <div class="ai-preview-lessons">
            ${t.lessons.map(l => `<span class="ai-lesson-chip">${typeIcon[l.type]||'📄'} ${l.title} <em>${l.duration}m</em></span>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="ai-preview-section">
      <div class="ai-preview-label">📝 ${data.assignments.length} Assignments</div>
      ${data.assignments.map(a => `<div class="ai-preview-item">📝 <strong>${a.title}</strong> — Due in ${a.due} days · ${a.marks} marks</div>`).join('')}
    </div>
    <div class="ai-preview-section">
      <div class="ai-preview-label">🧠 ${data.quizzes.length} Quizzes</div>
      ${data.quizzes.map(q => `<div class="ai-preview-item">🧠 <strong>${q.title}</strong> — ${q.questions.length} questions · ${q.time} mins</div>`).join('')}
    </div>
    <div class="ai-preview-section">
      <div class="ai-preview-label">🚀 ${data.projects.length} Projects</div>
      ${data.projects.map(p => `<div class="ai-preview-item">🚀 <strong>${p.title}</strong> — ${p.difficulty} · ${p.days} days<br><small>🛠 ${p.stack}</small></div>`).join('')}
    </div>
    <div class="ai-preview-section">
      <div class="ai-preview-label">📎 ${data.resources.length} Resources</div>
      ${data.resources.map(r => `<div class="ai-preview-item">📎 <strong>${r.title}</strong> — ${r.type}</div>`).join('')}
    </div>`;
}

// ===== SAVE COURSE BUTTON =====
function showToast(msg) {
  const toast = document.getElementById('saveToast');
  document.getElementById('toastMsg').textContent = msg || 'All changes have been saved successfully.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.getElementById('btnSaveCourse').addEventListener('click', () => {
  if (!activeCourse) return;
  const data = getData();
  const course = data[activeCourse];
  const totalLessons = (course.topics || []).reduce((s, t) => s + t.lessons.length, 0);
  showToast(`"${course.name}" saved — ${course.topics.length} topics, ${totalLessons} lessons, ${course.assignments.length} assignments.`);
});

// Show/hide save button when course selected
document.getElementById('courseSelect').addEventListener('change', () => {
  document.getElementById('btnSaveCourse').style.display = activeCourse ? 'block' : 'none';
});
