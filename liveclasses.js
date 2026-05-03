// ===== LIVE CLASSES — Dynamic Frontend Renderer =====

function getLiveClasses() {
  return JSON.parse(localStorage.getItem('lf_liveclasses') || '[]');
}

function getLcStatus(scheduleStr) {
  const diff = new Date(scheduleStr) - new Date();
  if (diff <= 0 && diff > -10800000) return 'live';
  if (diff > 0) return 'upcoming';
  return 'ended';
}

function getLcCountdown(scheduleStr) {
  const diff = new Date(scheduleStr) - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0)  return `${hrs}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

function renderDynamicLiveClasses() {
  const container = document.getElementById('dynamicLiveClasses');
  const emptyEl = document.getElementById('lcEmptyState');
  if (!container) return;

  const list = getLiveClasses().filter(lc => getLcStatus(lc.schedule) !== 'ended');

  if (!list.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = list.map(lc => {
    const status = getLcStatus(lc.schedule);
    const countdown = getLcCountdown(lc.schedule);
    const schedDate = new Date(lc.schedule);
    const isLive = status === 'live';
    const thumbStyle = lc.thumb
      ? `background:#000`
      : `background:linear-gradient(135deg,#7c3aed,#2563eb)`;

    return `
      <div class="live-card ${isLive ? 'featured' : ''}">
        <div class="live-thumb" style="${thumbStyle}">
          ${lc.thumb ? `<img src="${lc.thumb}" alt="${lc.title}" class="live-thumb-img"/>` : ''}
          <div class="live-thumb-overlay"></div>
          ${isLive
            ? `<span class="live-pill">🔴 LIVE NOW</span>`
            : `<span class="live-pill upcoming-pill">⏰ ${countdown || 'Soon'}</span>`}
          <div class="live-thumb-meta">
            <span class="live-viewers" id="lccountdown-${lc.id}">
              ${isLive ? '🔴 Live' : countdown ? `⏰ ${countdown}` : ''}
            </span>
            <span class="live-duration">${lc.duration}</span>
          </div>
          ${lc.instructor ? `
          <div class="live-instructor-badge">
            <div class="live-inst-avatar" style="background:linear-gradient(135deg,#7c3aed,#2563eb)">${lc.instructor.slice(0,2).toUpperCase()}</div>
            <span>${lc.instructor}</span>
          </div>` : ''}
        </div>
        <div class="live-body">
          <div class="live-body-top">
            <span class="tag">${lc.tag}</span>
            <span class="live-tag-dot ${isLive ? 'live-dot-red' : 'live-dot-yellow'}">
              ${isLive ? '● LIVE' : '⏰ Soon'}
            </span>
          </div>
          <h3>${lc.title}</h3>
          <p>${lc.description || ''}</p>
          <div class="live-meta">
            <span>📅 ${schedDate.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
            <span>🕐 ${schedDate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}${lc.endTime ? ` – ${lc.endTime}` : ''}</span>
            <span>⏱ ${lc.duration}</span>
          </div>
          <div class="live-actions">
            ${isLive
              ? `<a href="${lc.link || '#'}" target="_blank" class="btn-join">▶ Join Now</a>`
              : `<a href="#" class="btn-enroll" onclick="enrollLiveClass('${lc.id}','${lc.title.replace(/'/g,"\\'")}');return false;">▶ Enroll</a>`}
          </div>
        </div>
      </div>`;
  }).join('');
}

function enrollLiveClass(id, title) {
  if (document.getElementById('enrollModal')) {
    document.getElementById('modalCourseName').textContent = title;
    if (document.getElementById('reg_course'))
      document.getElementById('reg_course').value = title;
    document.getElementById('enrollModal').classList.add('active');
  }
}

// Tick countdowns every second
const _lcPrevStatus = {};
function tickLcCountdowns() {
  const list = getLiveClasses();
  let needsRerender = false;
  list.forEach(lc => {
    const status = getLcStatus(lc.schedule);
    if (_lcPrevStatus[lc.id] !== undefined && _lcPrevStatus[lc.id] !== status) needsRerender = true;
    _lcPrevStatus[lc.id] = status;
    const el = document.getElementById(`lccountdown-${lc.id}`);
    if (!el) return;
    const countdown = getLcCountdown(lc.schedule);
    el.textContent = status === 'live' ? '🔴 Live' : countdown ? `⏰ ${countdown}` : '';
  });
  if (needsRerender) renderDynamicLiveClasses();
}

// Init
renderDynamicLiveClasses();
getLiveClasses().forEach(lc => { _lcPrevStatus[lc.id] = getLcStatus(lc.schedule); });
setInterval(tickLcCountdowns, 1000);

window.addEventListener('storage', e => {
  if (e.key === 'lf_liveclasses') renderDynamicLiveClasses();
});
