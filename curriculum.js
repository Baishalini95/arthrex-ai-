const params = new URLSearchParams(window.location.search);
const courseName = params.get('course') || 'AI Course';
const userName   = params.get('user')   || 'Learner';

document.getElementById('sidebarCourseTitle').textContent = courseName;
document.getElementById('userInitials').textContent = userName.slice(0,2).toUpperCase();

// Generate curriculum based on course name
function getCurriculum(course) {
  const c = course.toLowerCase();

  if (c.includes('gpt') || c.includes('llm') || c.includes('generative')) return [
    { module: 'Module 1: Foundations', lessons: ['Introduction to LLMs', 'How GPT Works', 'Tokenization & Embeddings', 'Prompt Basics'] },
    { module: 'Module 2: Prompt Engineering', lessons: ['Zero-Shot Prompting', 'Few-Shot Prompting', 'Chain-of-Thought', 'System Prompts'] },
    { module: 'Module 3: RAG & Vector DBs', lessons: ['What is RAG?', 'Vector Databases', 'LangChain Basics', 'Building a RAG Pipeline'] },
    { module: 'Module 4: Fine-Tuning', lessons: ['LoRA & QLoRA', 'Dataset Preparation', 'Training & Evaluation', 'Deploying Fine-Tuned Models'] },
    { module: 'Module 5: Production AI', lessons: ['API Integration', 'Cost Optimization', 'Monitoring & Observability', 'Capstone Project'] },
  ];

  if (c.includes('agentic') || c.includes('agent')) return [
    { module: 'Module 1: Agent Fundamentals', lessons: ['What are AI Agents?', 'ReAct Framework', 'Tool Use & Function Calling', 'Memory Systems'] },
    { module: 'Module 2: Frameworks', lessons: ['LangGraph Basics', 'CrewAI Multi-Agents', 'AutoGen Setup', 'n8n AI Workflows'] },
    { module: 'Module 3: Cloud Agents', lessons: ['AWS Bedrock Agents', 'Azure AutoGen', 'Vertex AI Agents', 'Copilot Studio'] },
    { module: 'Module 4: Architecture', lessons: ['Agent Design Patterns', 'Orchestration Systems', 'Error Handling', 'Scalability'] },
    { module: 'Module 5: Enterprise', lessons: ['Enterprise Integration', 'Security & Governance', 'AgentOps Monitoring', 'Capstone Project'] },
  ];

  if (c.includes('data science') || c.includes('analytics')) return [
    { module: 'Module 1: Python for Data', lessons: ['NumPy Basics', 'Pandas DataFrames', 'Data Cleaning', 'EDA Techniques'] },
    { module: 'Module 2: Visualization', lessons: ['Matplotlib', 'Seaborn', 'Power BI Basics', 'Tableau Dashboards'] },
    { module: 'Module 3: Machine Learning', lessons: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Feature Engineering'] },
    { module: 'Module 4: AI Tools', lessons: ['ChatGPT for Data', 'Copilot in Excel', 'AI-Powered Analytics', 'AutoML'] },
    { module: 'Module 5: Projects', lessons: ['Sales Forecasting', 'Customer Segmentation', 'Churn Prediction', 'Capstone Project'] },
  ];

  if (c.includes('rag')) return [
    { module: 'Module 1: RAG Basics', lessons: ['What is RAG?', 'Embeddings Deep Dive', 'Semantic Search', 'Vector Stores'] },
    { module: 'Module 2: Building RAG', lessons: ['LangChain RAG', 'LlamaIndex', 'Chunking Strategies', 'Retrieval Optimization'] },
    { module: 'Module 3: Advanced RAG', lessons: ['Graph RAG', 'Hybrid Search', 'Re-ranking', 'Multi-Modal RAG'] },
    { module: 'Module 4: Production', lessons: ['Serverless RAG', 'Cloud Deployment', 'Monitoring', 'Capstone Project'] },
  ];

  // Default curriculum
  return [
    { module: 'Module 1: Introduction', lessons: ['Course Overview', 'Setup & Tools', 'Core Concepts', 'First Project'] },
    { module: 'Module 2: Core Skills', lessons: ['Fundamentals', 'Hands-on Practice', 'Real-World Examples', 'Mini Project'] },
    { module: 'Module 3: Advanced Topics', lessons: ['Advanced Concepts', 'Industry Patterns', 'Best Practices', 'Case Studies'] },
    { module: 'Module 4: Production', lessons: ['Deployment', 'Optimization', 'Monitoring', 'Capstone Project'] },
  ];
}

const curriculum = getCurriculum(courseName);
let currentLesson = { moduleIdx: 0, lessonIdx: 0 };
const completedLessons = new Set();

function renderModules() {
  const list = document.getElementById('moduleList');
  list.innerHTML = curriculum.map((mod, mi) => `
    <div class="module-item">
      <div class="module-title" onclick="toggleModule(${mi})">
        <span>${mod.module}</span>
        <span class="module-arrow" id="arrow-${mi}">▼</span>
      </div>
      <div class="module-lessons" id="lessons-${mi}">
        ${mod.lessons.map((lesson, li) => `
          <div class="lesson-item ${mi===0&&li===0?'active':''} ${completedLessons.has(mi+'-'+li)?'completed':''}"
               id="lesson-${mi}-${li}"
               onclick="loadLesson(${mi}, ${li})">
            <span class="lesson-dot">${completedLessons.has(mi+'-'+li) ? '✅' : '○'}</span>
            ${lesson}
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function toggleModule(mi) {
  const el = document.getElementById(`lessons-${mi}`);
  const arrow = document.getElementById(`arrow-${mi}`);
  el.classList.toggle('collapsed');
  arrow.textContent = el.classList.contains('collapsed') ? '▶' : '▼';
}

function loadLesson(mi, li) {
  currentLesson = { moduleIdx: mi, lessonIdx: li };
  const mod = curriculum[mi];
  const lesson = mod.lessons[li];

  document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`lesson-${mi}-${li}`)?.classList.add('active');

  document.getElementById('lessonBreadcrumb').textContent = `${mod.module} › Lesson ${li + 1}`;
  document.getElementById('lessonTitle').textContent = lesson;
  document.getElementById('videoLabel').textContent = `▶ ${lesson}`;
  document.getElementById('lessonBody').innerHTML = `
    <div class="lesson-description">
      <h3>About this lesson</h3>
      <p>In this lesson, you will learn about <strong>${lesson}</strong> as part of <em>${mod.module}</em> in the <strong>${courseName}</strong> program.</p>
      <ul>
        <li>📌 Understand the core concepts of ${lesson}</li>
        <li>🛠 Hands-on exercises and real-world examples</li>
        <li>📝 Quiz at the end to test your understanding</li>
        <li>🎯 Project task to apply what you've learned</li>
      </ul>
      <button class="btn-complete" onclick="markComplete(${mi}, ${li})">✅ Mark as Complete</button>
    </div>`;

  updateProgress();
}

function markComplete(mi, li) {
  completedLessons.add(mi + '-' + li);
  renderModules();
  loadLesson(mi, li);
  updateProgress();
}

function updateProgress() {
  const total = curriculum.reduce((s, m) => s + m.lessons.length, 0);
  const pct = Math.round((completedLessons.size / total) * 100);
  document.getElementById('overallProgress').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = pct + '% Complete';
}

document.getElementById('nextLesson').addEventListener('click', () => {
  let { moduleIdx: mi, lessonIdx: li } = currentLesson;
  li++;
  if (li >= curriculum[mi].lessons.length) { mi++; li = 0; }
  if (mi < curriculum.length) loadLesson(mi, li);
});

document.getElementById('prevLesson').addEventListener('click', () => {
  let { moduleIdx: mi, lessonIdx: li } = currentLesson;
  li--;
  if (li < 0) { mi--; if (mi >= 0) li = curriculum[mi].lessons.length - 1; }
  if (mi >= 0) loadLesson(mi, li);
});

renderModules();
loadLesson(0, 0);
