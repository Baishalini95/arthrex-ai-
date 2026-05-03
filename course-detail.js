// ===== COURSE DETAIL MODAL =====
// Opens a Udemy-style course page when any course card title is clicked

// ── Click handler — delegate on all .master-card h3 and .course-card h3 ──────
document.addEventListener('click', e => {
  const h3 = e.target.closest('.master-card h3, .course-card h3, .live-card h3');
  if (!h3) return;
  e.preventDefault();
  const card = h3.closest('.master-card, .course-card, .live-card');
  if (!card) return;
  openCourseDetail(card, h3.textContent.trim());
});

document.getElementById('closeCourseDetail').addEventListener('click', () => {
  document.getElementById('courseDetailModal').classList.remove('active');
});
document.getElementById('courseDetailModal').addEventListener('click', e => {
  if (e.target === document.getElementById('courseDetailModal'))
    document.getElementById('courseDetailModal').classList.remove('active');
});

// ── Open modal ────────────────────────────────────────────────────────────────
function openCourseDetail(card, title) {
  // Find course data from COURSE_DATABASE
  const course = findCourseByTitle(title) || buildFromCard(card, title);
  renderCourseDetail(course);
  document.getElementById('courseDetailModal').classList.add('active');
  document.querySelector('.cd-modal').scrollTop = 0;
}

function findCourseByTitle(title) {
  if (typeof COURSE_DATABASE === 'undefined') return null;
  for (const cat of Object.values(COURSE_DATABASE)) {
    for (const sub of Object.values(cat.subcategories)) {
      const found = sub.courses.find(c => c.name.toLowerCase() === title.toLowerCase());
      if (found) return { ...found, categoryName: cat.name, categoryEmoji: cat.emoji, subcategoryName: sub.name };
    }
  }
  return null;
}

function buildFromCard(card, title) {
  const tag = card.querySelector('.tag')?.textContent || '';
  const meta = card.querySelectorAll('.card-meta span, .live-meta span');
  const duration = [...meta].find(s => s.textContent.includes('⏱'))?.textContent.replace('⏱','').trim() || '';
  const rating = [...meta].find(s => s.textContent.includes('⭐'))?.textContent.replace('⭐','').trim() || '4.8';
  const enrolled = [...meta].find(s => s.textContent.includes('👥'))?.textContent.replace('👥','').trim() || '';
  const desc = card.querySelector('p')?.textContent || '';
  const price = card.querySelector('.price-tag')?.textContent || '';
  return { name: title, tag, description: desc, duration, rating: parseFloat(rating) || 4.8, enrolled, price, categoryName: tag };
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderCourseDetail(c) {
  const name = c.name || 'Course';
  const desc = c.description || '';
  const rating = c.rating || 4.8;
  const enrolled = c.enrolled || '';
  const duration = c.duration || '';
  const price = c.price || 'Free';
  const tag = c.tag || c.categoryName || '';
  const catEmoji = c.categoryEmoji || '📚';
  const catName = c.categoryName || tag;

  // Breadcrumb
  document.getElementById('cdBreadcrumb').innerHTML =
    `<span>${catEmoji} ${catName}</span>${c.subcategoryName ? ` › <span>${c.subcategoryName}</span>` : ''}`;

  // Title & subtitle
  document.getElementById('cdTitle').textContent = name;
  document.getElementById('cdSubtitle').textContent = desc;

  // Meta
  const stars = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  document.getElementById('cdRating').innerHTML = `<span class="cd-stars">${stars}</span> ${rating}`;
  document.getElementById('cdEnrolled').textContent = enrolled ? `👥 ${enrolled} learners` : '';
  document.getElementById('cdDuration').textContent = duration ? `⏱ ${duration}` : '';

  // Tags
  document.getElementById('cdTags').innerHTML = [tag, c.badge].filter(Boolean)
    .map(t => `<span class="cd-tag-chip">${t}</span>`).join('');

  // Companies hiring + salary chart
  renderCompaniesAndSalary(name, tag); // async, updates UI when ready

  // Thumbnail
  const thumbUrl = getThumbUrl ? getThumbUrl(name) : '';
  document.getElementById('cdThumb').innerHTML = thumbUrl
    ? `<img src="${thumbUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--gradient);border-radius:12px 12px 0 0">${catEmoji}</div>`;

  // Price
  const isFree = price === 'Free' || price === '' || price.toLowerCase().includes('free');
  document.getElementById('cdPrice').innerHTML = isFree
    ? `<span class="cd-price-free">FREE</span>`
    : `<span class="cd-price-current">${price}</span>`;

  // Enroll button
  document.getElementById('cdEnrollBtn').textContent = isFree ? 'Enroll Free' : 'Enroll Now';
  document.getElementById('cdEnrollBtn').onclick = () => {
    document.getElementById('courseDetailModal').classList.remove('active');
    // Trigger enroll modal
    if (typeof currentCourse !== 'undefined') {
      document.getElementById('modalCourseName').textContent = name;
      document.getElementById('reg_course').value = name;
      document.getElementById('enrollModal').classList.add('active');
    }
  };

  // Curriculum from LMS data
  renderCurriculum(name);

  // What you'll learn — generate from description
  const learns = generateLearnPoints(name, desc, tag);
  document.getElementById('cdLearnGrid').innerHTML = learns
    .map(l => `<div class="cd-learn-item"><span class="cd-check">✓</span><span>${l}</span></div>`).join('');

  // Requirements
  document.getElementById('cdReqList').innerHTML =
    `<li>No prior experience required — beginners welcome</li>
     <li>A computer with internet access</li>
     <li>Enthusiasm to learn ${tag || 'the subject'}</li>`;

  // Description
  document.getElementById('cdDescription').innerHTML = buildDescription(name, desc, tag, duration, enrolled);

  // Instructor
  document.getElementById('cdInstructor').innerHTML = buildInstructor(name);

  // Related courses
  document.getElementById('cdRelated').innerHTML = buildRelated(c);
}

// ── Companies hiring + salary trend — AI-powered ─────────────────────────────
const GROQ_KEY = 'YOUR_GROQ_API_KEY_HERE';

// Cache to avoid re-fetching same course
const _salaryCache = {};

async function renderCompaniesAndSalary(name, tag) {
  // Show loading state
  document.getElementById('cdCompanies').innerHTML =
    `<span style="color:var(--muted);font-size:0.78rem">Loading...</span>`;
  document.getElementById('cdSalarySub').textContent = 'Fetching data...';
  document.getElementById('cdSalaryHike').innerHTML = '';
  document.getElementById('cdSalaryChart').innerHTML = '';
  document.getElementById('cdChartLabels').innerHTML = '';

  const cacheKey = name.toLowerCase();
  if (_salaryCache[cacheKey]) {
    applyCompanySalaryData(_salaryCache[cacheKey]);
    return;
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 4 + i);

  const prompt = `You are a job market analyst. For the course "${name}" (category: ${tag}), return a JSON object with:
- "companies": array of exactly 7 real company names that actively hire for this skill (e.g. Google, Microsoft, etc.)
- "salaries": array of exactly 5 numbers representing average annual salary in LPA (Lakhs Per Annum) for years ${years.join(', ')} for a professional with this skill in India
- "role": the most relevant job title for this course
- "currency": "LPA"

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content || '';
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());

    _salaryCache[cacheKey] = { ...data, years };
    applyCompanySalaryData({ ...data, years });

  } catch (e) {
    document.getElementById('cdCompanies').innerHTML =
      `<span style="color:var(--muted);font-size:0.78rem">Could not load company data.</span>`;
    document.getElementById('cdSalarySub').textContent = '';
  }
}

function applyCompanySalaryData({ companies, salaries, role, currency, years }) {
  // Companies
  const colors = [
    'linear-gradient(135deg,#7c3aed,#2563eb)',
    'linear-gradient(135deg,#10b981,#0ea5e9)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#6366f1)',
    'linear-gradient(135deg,#059669,#0ea5e9)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ];
  document.getElementById('cdCompanies').innerHTML = (companies || []).map((c, i) => `
    <div class="cd-company-chip">
      <div class="cd-company-logo" style="background:${colors[i % colors.length]}">${c.slice(0,2).toUpperCase()}</div>
      <span>${c}</span>
    </div>`).join('');

  // Salary
  const vals = salaries || [];
  const first = vals[0] || 0;
  const last = vals[vals.length - 1] || 0;
  const hikePct = first ? Math.round(((last - first) / first) * 100) : 0;

  document.getElementById('cdSalarySub').textContent =
    `${role || 'Professional'} · ₹${first}–${last} ${currency || 'LPA'}`;
  document.getElementById('cdSalaryHike').innerHTML =
    `<span class="cd-hike-badge">↑ ${hikePct}% over 5 yrs</span>`;

  drawSalaryChart(vals);

  const currentYear = years || Array.from({length: 5}, (_, i) => new Date().getFullYear() - 4 + i);
  document.getElementById('cdChartLabels').innerHTML =
    currentYear.map(y => `<span>${y}</span>`).join('');
}

function drawSalaryChart(values) {
  const svg = document.getElementById('cdSalaryChart');
  const W = 400, H = 80, pad = 10;
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const xStep = (W - pad * 2) / (values.length - 1);
  const yScale = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const points = values.map((v, i) => [pad + i * xStep, yScale(v)]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const areaD = pathD + ` L${points[points.length-1][0]},${H} L${pad},${H} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Grid lines -->
    ${[0.25,0.5,0.75].map(t => {
      const y = pad + t * (H - pad * 2);
      return `<line x1="${pad}" y1="${y}" x2="${W-pad}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    }).join('')}
    <!-- Area fill -->
    <path d="${areaD}" fill="url(#chartGrad)"/>
    <!-- Line -->
    <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Dots + value labels -->
    ${points.map((p, i) => `
      <circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#10b981" stroke="#0d0d1a" stroke-width="2"/>
      <text x="${p[0]}" y="${p[1] - 8}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.7)" font-family="Inter,sans-serif">₹${values[i]}L</text>
    `).join('')}
  `;
}

// ── Curriculum from LMS localStorage ─────────────────────────────────────────
function renderCurriculum(courseName) {
  const lmsData = JSON.parse(localStorage.getItem('lf_lms') || '{}');

  // Find matching course by name
  const entry = Object.values(lmsData).find(c =>
    c.name?.toLowerCase() === courseName.toLowerCase()
  );

  const summaryEl = document.getElementById('cdCurriculumSummary');
  const currEl = document.getElementById('cdCurriculum');

  if (!entry || !entry.topics?.length) {
    summaryEl.innerHTML = '';
    currEl.innerHTML = `<div class="cd-no-curriculum">
      <span>📋</span> Curriculum will be available after enrollment.
    </div>`;
    return;
  }

  const topics = [...entry.topics].sort((a, b) => a.order - b.order);
  const totalLessons = topics.reduce((s, t) => s + (t.lessons?.length || 0), 0);
  const totalMins = topics.reduce((s, t) =>
    s + (t.lessons || []).reduce((ls, l) => ls + (parseInt(l.duration) || 0), 0), 0);
  const totalHrs = (totalMins / 60).toFixed(1);

  summaryEl.innerHTML = `
    <div class="cd-curriculum-stats">
      <span>📦 ${topics.length} sections</span>
      <span>📄 ${totalLessons} lessons</span>
      <span>⏱ ${totalHrs} hrs total</span>
    </div>`;

  currEl.innerHTML = topics.map((t, ti) => {
    const lessons = t.lessons || [];
    const modMins = lessons.reduce((s, l) => s + (parseInt(l.duration) || 0), 0);
    return `
      <div class="cd-module" id="cdmod-${ti}">
        <div class="cd-module-header" onclick="toggleCdModule(${ti})">
          <div class="cd-module-left">
            <div class="cd-module-num">${t.order || ti+1}</div>
            <div class="cd-module-info">
              <span class="cd-module-title">${t.title}</span>
              <div class="cd-module-meta">
                <span>📄 ${lessons.length} lessons</span>
                <span>⏱ ${modMins} min</span>
              </div>
            </div>
          </div>
          <div class="cd-module-right">
            <span class="cd-module-expand-hint" id="cdexpand-${ti}">Expand</span>
            <span class="cd-module-arrow" id="cdarrow-${ti}">▶</span>
          </div>
        </div>
        <div class="cd-lessons-list" id="cdlessons-${ti}" style="display:none">
          ${lessons.length ? lessons.map(l => {
            const typeClass = { Video:'cd-type-video', Reading:'cd-type-reading', Lab:'cd-type-lab', 'Live Session':'cd-type-live' }[l.type] || 'cd-type-video';
            const typeLabel = l.type || 'Video';
            return `
            <div class="cd-lesson-row">
              <div class="cd-lesson-left">
                <span class="cd-lock-icon">🔒</span>
                <span class="cd-lesson-type-pill ${typeClass}">${typeLabel}</span>
                <span class="cd-lesson-title">${l.title}</span>
              </div>
              <span class="cd-lesson-dur">⏱ ${l.duration} min</span>
            </div>`;
          }).join('')
          : '<div class="cd-no-lessons">No lessons added yet.</div>'}
        </div>
      </div>`;
  }).join('');
}

function toggleCdModule(idx) {
  const list = document.getElementById(`cdlessons-${idx}`);
  const arrow = document.getElementById(`cdarrow-${idx}`);
  const hint = document.getElementById(`cdexpand-${idx}`);
  const isOpen = list.style.display !== 'none';
  list.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '▶' : '▼';
  if (hint) hint.textContent = isOpen ? 'Expand' : 'Collapse';
}

function lessonTypeIcon(type) {
  return { Video: '▶', Reading: '📖', 'Live Session': '🔴', Lab: '🧪' }[type] || '📄';
}

// ── Generate learn points from course name/tag ────────────────────────────────
function generateLearnPoints(name, desc, tag) {
  const n = name.toLowerCase();
  const base = [
    `Master the core concepts of ${name}`,
    `Build real-world projects from scratch`,
    `Understand industry best practices`,
    `Apply ${tag || 'these skills'} in production environments`,
    `Get hands-on experience with practical exercises`,
    `Earn a certificate of completion`,
  ];
  if (n.includes('llm') || n.includes('gpt') || n.includes('ai')) {
    base.push('Work with state-of-the-art AI models', 'Deploy AI solutions to the cloud');
  }
  if (n.includes('aws') || n.includes('cloud')) {
    base.push('Configure AWS services and IAM policies', 'Deploy scalable cloud architectures');
  }
  if (n.includes('agent')) {
    base.push('Build autonomous AI agents with tool use', 'Orchestrate multi-agent workflows');
  }
  return base.slice(0, 8);
}

// ── Build description HTML ────────────────────────────────────────────────────
function buildDescription(name, desc, tag, duration, enrolled) {
  return `
    <p>${desc}</p>
    <p>This comprehensive course on <strong>${name}</strong> is designed for learners who want to gain practical, job-ready skills. Whether you're a beginner or looking to level up, this course provides structured learning with hands-on projects.</p>
    <p>By the end of this course, you will have built real projects, understood the theory behind the concepts, and be ready to apply your skills professionally.</p>
    ${enrolled ? `<p><strong>${enrolled} learners</strong> have already enrolled in this course.</p>` : ''}
    <h4>Who this course is for:</h4>
    <ul>
      <li>Beginners with no prior experience in ${tag || 'this field'}</li>
      <li>Professionals looking to upskill and stay current</li>
      <li>Anyone who wants to build real-world ${tag || 'tech'} projects</li>
    </ul>`;
}

// ── Build instructor HTML ─────────────────────────────────────────────────────
function buildInstructor(courseName) {
  const instructors = [
    { name: 'Rahul Sharma', title: 'Senior AI Engineer & Educator', rating: 4.9, students: '42K', courses: 12, avatar: 'RS', color: 'linear-gradient(135deg,#7c3aed,#2563eb)' },
    { name: 'Priya Nair', title: 'ML Engineer & Course Creator', rating: 4.8, students: '28K', courses: 8, avatar: 'PN', color: 'linear-gradient(135deg,#10b981,#0ea5e9)' },
    { name: 'Mike Johnson', title: 'Cloud Architect & AWS Expert', rating: 4.9, students: '35K', courses: 10, avatar: 'MJ', color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  ];
  const inst = instructors[Math.floor(courseName.length % instructors.length)];
  return `
    <div class="cd-inst-card">
      <div class="cd-inst-avatar" style="background:${inst.color}">${inst.avatar}</div>
      <div class="cd-inst-info">
        <h3 class="cd-inst-name">${inst.name}</h3>
        <p class="cd-inst-title">${inst.title}</p>
        <div class="cd-inst-meta">
          <span>⭐ ${inst.rating} Rating</span>
          <span>👥 ${inst.students} Students</span>
          <span>📚 ${inst.courses} Courses</span>
        </div>
        <p class="cd-inst-bio">An experienced educator with a passion for making complex topics accessible. Has helped thousands of students worldwide build real-world skills and advance their careers.</p>
      </div>
    </div>`;
}

// ── Build related courses ─────────────────────────────────────────────────────
function buildRelated(course) {
  if (typeof COURSE_DATABASE === 'undefined') return '';
  const related = [];
  const catKey = Object.keys(COURSE_DATABASE).find(k =>
    COURSE_DATABASE[k].name === course.categoryName || k === course.tag?.toLowerCase()
  );
  const cat = catKey ? COURSE_DATABASE[catKey] : Object.values(COURSE_DATABASE)[0];
  for (const sub of Object.values(cat.subcategories)) {
    for (const c of sub.courses) {
      if (c.name !== course.name) related.push(c);
      if (related.length >= 4) break;
    }
    if (related.length >= 4) break;
  }
  if (!related.length) return '<p style="color:var(--muted)">No related courses found.</p>';
  return related.map(c => `
    <div class="cd-related-card" onclick="openCourseDetail(null,'${c.name.replace(/'/g,"\\'")}'); findAndOpen('${c.name.replace(/'/g,"\\'")}')">
      <div class="cd-related-thumb" style="background:${c.badgeColor || 'var(--gradient)'}">
        ${c.badge || '📚'}
      </div>
      <div class="cd-related-body">
        <h4>${c.name}</h4>
        <p>${c.description}</p>
        <div class="cd-related-meta">
          <span>⭐ ${c.rating}</span>
          <span>⏱ ${c.duration}</span>
          <span class="cd-related-price">${c.price}</span>
        </div>
      </div>
    </div>`).join('');
}

function findAndOpen(title) {
  const course = findCourseByTitle(title);
  if (course) renderCourseDetail(course);
}
