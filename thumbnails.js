// ===== AUTO THUMBNAIL INJECTOR =====
// Replaces .card-thumb emoji divs with real Unsplash images
// based on the course title keywords

const THUMB_MAP = [
  // AI & LLM
  { keys: ['gpt','openai','chatgpt'],        img: 'photo-1677442135703-1787eea5ce01' },
  { keys: ['claude'],                         img: 'photo-1620712943543-bcc4688e7485' },
  { keys: ['gemini','google ai'],             img: 'photo-1573804633927-bfcbcd909acd' },
  { keys: ['llm','large language'],           img: 'photo-1655720828018-edd2daec9349' },
  { keys: ['prompt engineering','prompting'], img: 'photo-1686191128892-3b37add4c844' },
  { keys: ['rag','retrieval'],                img: 'photo-1558494949-ef010cbdcc31' },
  { keys: ['mcp','model context'],            img: 'photo-1518770660439-4636190af475' },
  { keys: ['fine-tun','finetun','lora','qlora'], img: 'photo-1620712943543-bcc4688e7485' },
  { keys: ['generative ai','genai'],          img: 'photo-1677442135703-1787eea5ce01' },
  { keys: ['foundation model'],               img: 'photo-1655720828018-edd2daec9349' },
  { keys: ['context engineering'],            img: 'photo-1558494949-ef010cbdcc31' },
  { keys: ['production llm','llm system'],    img: 'photo-1518770660439-4636190af475' },
  // Agentic AI
  { keys: ['agentic','agent','autonomous'],   img: 'photo-1485827404703-89b55fcc595e' },
  { keys: ['langgraph','langchain'],          img: 'photo-1555949963-ff9fe0c870eb' },
  { keys: ['crewai','crew ai'],               img: 'photo-1531746790731-6c087fecd65a' },
  { keys: ['autogen','auto gen'],             img: 'photo-1531746790731-6c087fecd65a' },
  { keys: ['n8n','workflow','automation'],    img: 'photo-1518770660439-4636190af475' },
  { keys: ['agentops','agent ops'],           img: 'photo-1485827404703-89b55fcc595e' },
  { keys: ['multi-agent','multiagent'],       img: 'photo-1531746790731-6c087fecd65a' },
  { keys: ['orchestrat'],                     img: 'photo-1518770660439-4636190af475' },
  // Cloud
  { keys: ['aws','bedrock','amazon'],         img: 'photo-1451187580459-43490279c0fa' },
  { keys: ['azure','microsoft','autogen'],    img: 'photo-1633419461186-7d40a38105ec' },
  { keys: ['copilot studio'],                 img: 'photo-1633419461186-7d40a38105ec' },
  { keys: ['vertex','google cloud','gcp'],    img: 'photo-1573804633927-bfcbcd909acd' },
  { keys: ['cloud','serverless'],             img: 'photo-1451187580459-43490279c0fa' },
  // Data Science
  { keys: ['data science','python','pandas'], img: 'photo-1551288049-bebda4e38f71' },
  { keys: ['data analytic','excel','tableau','power bi'], img: 'photo-1460925895917-afdab827c52f' },
  { keys: ['sql','database'],                 img: 'photo-1544383835-bda2bc66a55d' },
  { keys: ['machine learning','ml','scikit'], img: 'photo-1555949963-ff9fe0c870eb' },
  { keys: ['deep learning','neural'],         img: 'photo-1620712943543-bcc4688e7485' },
  // Industry / Domain AI
  { keys: ['healthcare','medical','clinical'], img: 'photo-1576091160399-112ba8d25d1d' },
  { keys: ['finance','fintech','banking','trading'], img: 'photo-1611974789855-9c2a0a7236a3' },
  { keys: ['retail','ecommerce','e-commerce'], img: 'photo-1556742049-0cfed4f6a45d' },
  { keys: ['telecom','network'],              img: 'photo-1558618666-fcd25c85cd64' },
  { keys: ['robotics','robot'],               img: 'photo-1485827404703-89b55fcc595e' },
  { keys: ['healthcare'],                     img: 'photo-1576091160399-112ba8d25d1d' },
  // Web / Dev
  { keys: ['react','javascript','js','frontend'], img: 'photo-1633356122544-f134324a6cee' },
  { keys: ['fullstack','full stack','full-stack'], img: 'photo-1555949963-ff9fe0c870eb' },
  { keys: ['ui/ux','ux','figma','design'],    img: 'photo-1561070791-2526d30994b5' },
  { keys: ['startup'],                        img: 'photo-1559136555-9303baea8ebd' },
  { keys: ['docker','kubernetes','devops'],   img: 'photo-1518770660439-4636190af475' },
  // Fallback pools by gradient color (used when no keyword matches)
  { keys: ['__fallback__'],                   img: 'photo-1677442135703-1787eea5ce01' },
];

// Unsplash image dimensions for card thumbs
const W = 400, H = 200;

function getThumbUrl(title) {
  const t = title.toLowerCase();
  for (const entry of THUMB_MAP) {
    if (entry.keys[0] === '__fallback__') continue;
    if (entry.keys.some(k => t.includes(k))) {
      return `https://images.unsplash.com/${entry.img}?w=${W}&h=${H}&fit=crop&auto=format`;
    }
  }
  // Generic AI fallback
  return `https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=${W}&h=${H}&fit=crop&auto=format`;
}

function injectThumbnails() {
  document.querySelectorAll('.master-card, .course-card-grid').forEach(card => {
    const thumb = card.querySelector('.card-thumb');
    if (!thumb) return;
    // Skip if already has an image
    if (thumb.querySelector('img')) return;

    const titleEl = card.querySelector('h3');
    const title = titleEl ? titleEl.textContent : '';
    const url = getThumbUrl(title);

    // Save original gradient as fallback bg
    const origBg = thumb.style.background || thumb.style.backgroundImage || '';

    thumb.style.position = 'relative';
    thumb.style.overflow = 'hidden';
    thumb.style.padding = '0';
    thumb.style.fontSize = '0'; // hide emoji

    thumb.innerHTML = `
      <img src="${url}"
           alt="${title}"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"
           onerror="this.remove();this.parentElement.style.fontSize='2rem'"/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%);z-index:1;"></div>
    `;
  });
}

// Run after DOM is ready and again after dynamic cards load
document.addEventListener('DOMContentLoaded', injectThumbnails);
setTimeout(injectThumbnails, 800); // catch dynamically rendered cards

// Re-run when My Courses section loads
window.addEventListener('storage', () => setTimeout(injectThumbnails, 300));
