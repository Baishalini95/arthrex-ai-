// Sidebar navigation
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.content-section');

function showSection(sectionId) {
  sections.forEach(s => s.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  const target = document.getElementById('section-' + sectionId);
  if (target) target.classList.add('active');

  const activeNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (activeNav) activeNav.classList.add('active');
}

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.getAttribute('data-section');
    const sectionMap = {
      home: 'home', live: 'live', masterclass: 'masterclass',
      trending: 'trending', courses: 'home', success: 'success', mycourses: 'home',
      agentic: 'agentic', genai: 'genai',
      datascience: 'datascience', domainai: 'domainai',
      progress: 'home', certificates: 'home', settings: 'home'
    };
    showSection(sectionMap[section] || 'home');
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

// Filter tabs — actually filter cards by tag
document.querySelectorAll('.filter-tabs').forEach(tabGroup => {
  tabGroup.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active tab
      tabGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.textContent.trim().toLowerCase();
      const section = tabGroup.closest('.content-section');

      // Get all filterable cards in this section
      const cards = section.querySelectorAll('.master-card, .live-card, .course-card');

      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = '';
        } else {
          const tag = card.querySelector('.tag');
          const tagText = tag ? tag.textContent.trim().toLowerCase() : '';
          card.style.display = tagText.includes(filter) ? '' : 'none';
        }
      });
    });
  });
});
