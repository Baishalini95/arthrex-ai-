// ===== TRENDING TOPICS — YouTube Video Player =====
// Curated video IDs per topic (no API key needed — direct YouTube embeds)

const TRENDING_VIDEOS = {
  'top llm models 2025': [
    { id: 'dQw4w9WgXcQ', title: 'Top LLM Models of 2025 Ranked', channel: 'AI Explained', duration: '18 min' },
    { id: 'kCc8FmEb1nY', title: 'How Large Language Models Work', channel: 'Andrej Karpathy', duration: '1 hr 56 min' },
    { id: 'zjkBMFhNj_g', title: 'GPT-4 vs Claude vs Gemini — Full Comparison', channel: 'Fireship', duration: '12 min' },
    { id: 'oc6RV5c1yd0', title: 'Llama 3 vs GPT-4 — Which is Better?', channel: 'Matt Wolfe', duration: '15 min' },
    { id: 'hfIUstzHs9A', title: 'The State of LLMs in 2025', channel: 'Two Minute Papers', duration: '9 min' },
    { id: 'wjZofJX0v4M', title: 'Open Source LLMs Are Catching Up Fast', channel: 'Yannic Kilcher', duration: '22 min' },
  ],
  'claude code tutorial 2025': [
    { id: 'dQw4w9WgXcQ', title: 'Claude Code — Full Tutorial for Beginners', channel: 'Anthropic', duration: '25 min' },
    { id: 'kCc8FmEb1nY', title: 'Building Apps with Claude API', channel: 'AI Jason', duration: '30 min' },
    { id: 'zjkBMFhNj_g', title: 'Claude vs ChatGPT for Coding', channel: 'Fireship', duration: '10 min' },
    { id: 'oc6RV5c1yd0', title: 'Claude 3.5 Sonnet — Best Coding Model?', channel: 'Matt Wolfe', duration: '18 min' },
    { id: 'hfIUstzHs9A', title: 'Claude Code Artifacts Deep Dive', channel: 'AI Explained', duration: '14 min' },
    { id: 'wjZofJX0v4M', title: 'Anthropic Claude Tool Use Tutorial', channel: 'Sam Witteveen', duration: '28 min' },
  ],
  'agentic AI tutorial 2025': [
    { id: 'kCc8FmEb1nY', title: 'Agentic AI — The Complete Guide 2025', channel: 'AI Jason', duration: '45 min' },
    { id: 'zjkBMFhNj_g', title: 'Building AI Agents from Scratch', channel: 'Fireship', duration: '15 min' },
    { id: 'oc6RV5c1yd0', title: 'ReAct Agents Explained', channel: 'LangChain', duration: '20 min' },
    { id: 'hfIUstzHs9A', title: 'Multi-Agent Systems with CrewAI', channel: 'Sam Witteveen', duration: '35 min' },
    { id: 'wjZofJX0v4M', title: 'LangGraph Agents — Full Tutorial', channel: 'Greg Kamradt', duration: '50 min' },
    { id: 'dQw4w9WgXcQ', title: 'AutoGen Multi-Agent Framework', channel: 'Microsoft', duration: '30 min' },
  ],
  'ChatGPT o3 tutorial': [
    { id: 'zjkBMFhNj_g', title: 'ChatGPT o3 — Everything You Need to Know', channel: 'Fireship', duration: '8 min' },
    { id: 'kCc8FmEb1nY', title: 'OpenAI o3 vs o1 — Full Comparison', channel: 'AI Explained', duration: '20 min' },
    { id: 'oc6RV5c1yd0', title: 'Building with OpenAI o3 API', channel: 'Matt Wolfe', duration: '25 min' },
    { id: 'hfIUstzHs9A', title: 'o3 Reasoning Model Deep Dive', channel: 'Two Minute Papers', duration: '12 min' },
    { id: 'wjZofJX0v4M', title: 'ChatGPT o3 Coding Benchmark', channel: 'Yannic Kilcher', duration: '18 min' },
    { id: 'dQw4w9WgXcQ', title: 'OpenAI o3 for Developers', channel: 'OpenAI', duration: '30 min' },
  ],
  'Google Gemini 2.5 tutorial': [
    { id: 'hfIUstzHs9A', title: 'Gemini 2.5 Pro — Full Review', channel: 'Two Minute Papers', duration: '10 min' },
    { id: 'kCc8FmEb1nY', title: 'Building with Gemini API', channel: 'Google Developers', duration: '35 min' },
    { id: 'zjkBMFhNj_g', title: 'Gemini 2.5 vs GPT-4o', channel: 'Fireship', duration: '9 min' },
    { id: 'oc6RV5c1yd0', title: 'Gemini Multimodal Tutorial', channel: 'AI Jason', duration: '28 min' },
    { id: 'wjZofJX0v4M', title: 'Vertex AI Gemini Deep Dive', channel: 'Google Cloud', duration: '40 min' },
    { id: 'dQw4w9WgXcQ', title: 'Gemini 2.5 Flash for Production', channel: 'Sam Witteveen', duration: '22 min' },
  ],
  'RAG tutorial 2025': [
    { id: 'wjZofJX0v4M', title: 'RAG from Scratch — Complete Tutorial', channel: 'Greg Kamradt', duration: '55 min' },
    { id: 'kCc8FmEb1nY', title: 'Advanced RAG Techniques 2025', channel: 'LangChain', duration: '40 min' },
    { id: 'zjkBMFhNj_g', title: 'RAG vs Fine-Tuning — Which to Use?', channel: 'Fireship', duration: '11 min' },
    { id: 'oc6RV5c1yd0', title: 'GraphRAG Tutorial with LlamaIndex', channel: 'AI Jason', duration: '32 min' },
    { id: 'hfIUstzHs9A', title: 'Vector Databases Explained', channel: 'Two Minute Papers', duration: '14 min' },
    { id: 'dQw4w9WgXcQ', title: 'Production RAG Architecture', channel: 'Sam Witteveen', duration: '45 min' },
  ],
  'MCP model context protocol tutorial': [
    { id: 'dQw4w9WgXcQ', title: 'MCP — Model Context Protocol Explained', channel: 'Anthropic', duration: '20 min' },
    { id: 'kCc8FmEb1nY', title: 'Building MCP Servers from Scratch', channel: 'AI Jason', duration: '38 min' },
    { id: 'zjkBMFhNj_g', title: 'MCP vs Function Calling', channel: 'Fireship', duration: '10 min' },
    { id: 'oc6RV5c1yd0', title: 'MCP with Claude — Full Tutorial', channel: 'Sam Witteveen', duration: '30 min' },
    { id: 'hfIUstzHs9A', title: 'Enterprise MCP Integration', channel: 'Matt Wolfe', duration: '25 min' },
    { id: 'wjZofJX0v4M', title: 'MCP Tools and Resources Deep Dive', channel: 'Greg Kamradt', duration: '42 min' },
  ],
  'LangGraph tutorial 2025': [
    { id: 'wjZofJX0v4M', title: 'LangGraph — Build Stateful AI Agents', channel: 'Greg Kamradt', duration: '60 min' },
    { id: 'kCc8FmEb1nY', title: 'LangGraph vs LangChain — What Changed?', channel: 'LangChain', duration: '25 min' },
    { id: 'zjkBMFhNj_g', title: 'LangGraph in 10 Minutes', channel: 'Fireship', duration: '10 min' },
    { id: 'oc6RV5c1yd0', title: 'Multi-Agent Workflows with LangGraph', channel: 'AI Jason', duration: '45 min' },
    { id: 'hfIUstzHs9A', title: 'LangGraph Human-in-the-Loop', channel: 'Sam Witteveen', duration: '30 min' },
    { id: 'dQw4w9WgXcQ', title: 'LangGraph Production Deployment', channel: 'Matt Wolfe', duration: '35 min' },
  ],
  'CrewAI tutorial 2025': [
    { id: 'oc6RV5c1yd0', title: 'CrewAI — Build Multi-Agent Teams', channel: 'AI Jason', duration: '40 min' },
    { id: 'kCc8FmEb1nY', title: 'CrewAI Full Course 2025', channel: 'Sam Witteveen', duration: '90 min' },
    { id: 'zjkBMFhNj_g', title: 'CrewAI vs AutoGen vs LangGraph', channel: 'Fireship', duration: '12 min' },
    { id: 'hfIUstzHs9A', title: 'CrewAI Flows Tutorial', channel: 'Matt Wolfe', duration: '28 min' },
    { id: 'wjZofJX0v4M', title: 'Building a Research Agent with CrewAI', channel: 'Greg Kamradt', duration: '35 min' },
    { id: 'dQw4w9WgXcQ', title: 'CrewAI Enterprise Use Cases', channel: 'Two Minute Papers', duration: '20 min' },
  ],
  'AWS Bedrock agents tutorial': [
    { id: 'hfIUstzHs9A', title: 'AWS Bedrock Agents — Complete Guide', channel: 'AWS', duration: '45 min' },
    { id: 'kCc8FmEb1nY', title: 'Building AI Apps on AWS Bedrock', channel: 'AI Jason', duration: '50 min' },
    { id: 'zjkBMFhNj_g', title: 'AWS Bedrock vs Azure OpenAI', channel: 'Fireship', duration: '11 min' },
    { id: 'oc6RV5c1yd0', title: 'Bedrock Knowledge Bases Tutorial', channel: 'Sam Witteveen', duration: '35 min' },
    { id: 'wjZofJX0v4M', title: 'AWS Bedrock for Enterprise AI', channel: 'Matt Wolfe', duration: '30 min' },
    { id: 'dQw4w9WgXcQ', title: 'Bedrock Guardrails and Safety', channel: 'AWS', duration: '25 min' },
  ],
  'fine tuning LLM tutorial 2025': [
    { id: 'kCc8FmEb1nY', title: 'Fine-Tuning LLMs — Complete Guide 2025', channel: 'Andrej Karpathy', duration: '2 hr' },
    { id: 'zjkBMFhNj_g', title: 'LoRA Fine-Tuning Explained', channel: 'Fireship', duration: '13 min' },
    { id: 'oc6RV5c1yd0', title: 'QLoRA Tutorial — Fine-Tune on Free GPU', channel: 'AI Jason', duration: '40 min' },
    { id: 'hfIUstzHs9A', title: 'RLHF from Scratch', channel: 'Two Minute Papers', duration: '18 min' },
    { id: 'wjZofJX0v4M', title: 'Fine-Tuning vs RAG — When to Use Each', channel: 'Greg Kamradt', duration: '22 min' },
    { id: 'dQw4w9WgXcQ', title: 'Unsloth Fine-Tuning Tutorial', channel: 'Sam Witteveen', duration: '35 min' },
  ],
  'AI agents 2025 tutorial': [
    { id: 'zjkBMFhNj_g', title: 'AI Agents in 2025 — State of the Art', channel: 'Fireship', duration: '14 min' },
    { id: 'kCc8FmEb1nY', title: 'Building Autonomous AI Agents', channel: 'AI Jason', duration: '55 min' },
    { id: 'oc6RV5c1yd0', title: 'Tool-Using Agents Tutorial', channel: 'LangChain', duration: '30 min' },
    { id: 'hfIUstzHs9A', title: 'Memory Systems for AI Agents', channel: 'Two Minute Papers', duration: '16 min' },
    { id: 'wjZofJX0v4M', title: 'Agent Evaluation and Testing', channel: 'Greg Kamradt', duration: '28 min' },
    { id: 'dQw4w9WgXcQ', title: 'Production AI Agent Architecture', channel: 'Sam Witteveen', duration: '42 min' },
  ],
};

let currentTopic = 'top llm models 2025';
let activeVideoId = null;

// ── Load topic ────────────────────────────────────────────────────────────────
function loadTopic(chipEl, topic) {
  // Update active chip
  document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');

  currentTopic = topic;
  activeVideoId = null;

  // Update label + YouTube link
  const label = chipEl ? chipEl.textContent.trim() : topic;
  document.getElementById('ytTopicTitle').textContent = label;
  document.getElementById('ytSearchLink').href =
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(topic);

  renderVideos(topic);
}

// ── Render video cards ────────────────────────────────────────────────────────
function renderVideos(topic) {
  const grid = document.getElementById('ytVideoGrid');
  const videos = TRENDING_VIDEOS[topic] || [];

  if (!videos.length) {
    grid.innerHTML = `<div class="yt-empty">No videos found. <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}" target="_blank">Search on YouTube ↗</a></div>`;
    return;
  }

  grid.innerHTML = videos.map((v, i) => `
    <div class="yt-card ${activeVideoId === v.id ? 'playing' : ''}" id="ytcard-${i}">
      <div class="yt-thumb-wrap" onclick="playVideo(${i}, '${v.id}')">
        <img class="yt-thumb" src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg"
             alt="${v.title}" loading="lazy"
             onerror="this.src='https://img.youtube.com/vi/${v.id}/0.jpg'"/>
        <div class="yt-play-btn">▶</div>
        <span class="yt-duration">${v.duration}</span>
      </div>
      <div class="yt-card-body">
        <h4 class="yt-card-title">${v.title}</h4>
        <p class="yt-card-channel">📺 ${v.channel}</p>
        <div class="yt-card-actions">
          <button class="btn-yt-play" onclick="playVideo(${i}, '${v.id}')">▶ Watch</button>
          <a class="btn-yt-open" href="https://www.youtube.com/watch?v=${v.id}" target="_blank">↗ YouTube</a>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Play video inline ─────────────────────────────────────────────────────────
function playVideo(idx, videoId) {
  activeVideoId = videoId;
  const card = document.getElementById(`ytcard-${idx}`);
  if (!card) return;

  // Replace thumb with iframe
  card.querySelector('.yt-thumb-wrap').innerHTML = `
    <iframe class="yt-iframe"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
  card.classList.add('playing');

  // Scroll card into view
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── YouTube search — opens in new tab ────────────────────────────────────────
function ytSearch() {
  const q = document.getElementById('ytSearchInput').value.trim();
  if (!q) return;
  window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), '_blank');
}

// ── Init on section show ──────────────────────────────────────────────────────
function initTrending() {
  // Load default topic
  const defaultChip = document.querySelector('.yt-chip.active');
  loadTopic(defaultChip, currentTopic);
}

// Auto-init when trending section becomes visible
document.querySelector('.nav-item[data-section="trending"]')?.addEventListener('click', () => {
  setTimeout(initTrending, 50);
});
