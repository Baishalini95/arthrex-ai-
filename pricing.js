// Price calculation: ₹1,000 per hour
// Fixed: 3 Months = ₹23,999 | 6 Months = ₹39,999
// 1 Week = 40 hrs, 1 Month = 160 hrs

function calcPrice(durationText) {
  const t = durationText.toLowerCase();

  const monthMatch = t.match(/([\d.]+)\s*month/);
  if (monthMatch) {
    return 39999;
  }

  const weekMatch = t.match(/([\d.]+)\s*week/);
  if (weekMatch) return Math.round(parseFloat(weekMatch[1]) * 40 * 1000);

  const hrMatch = t.match(/([\d.]+)\s*hr/);
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 1000);

  return null;
}

function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

document.querySelectorAll('.card-meta, .live-meta').forEach(meta => {
  // Remove any previously injected price tags
  meta.querySelectorAll('.price-tag').forEach(p => p.remove());

  // Skip free masterclass cards
  const card = meta.closest('.master-card, .course-card, .live-card');
  if (card) {
    const enrollBtn = card.querySelector('.btn-enroll');
    const freeTag = card.querySelector('.tag');
    if ((enrollBtn && enrollBtn.textContent.toLowerCase().includes('free')) ||
        (freeTag && freeTag.textContent.trim().toUpperCase() === 'FREE')) return;

    // Use data-price override if set
    if (card.dataset.price) {
      const priceSpan = document.createElement('span');
      priceSpan.className = 'price-tag';
      priceSpan.textContent = '💰 ' + formatINR(parseInt(card.dataset.price));
      meta.appendChild(priceSpan);
      return;
    }
  }

  const spans = meta.querySelectorAll('span');
  spans.forEach(span => {
    const text = span.textContent;
    if (text.includes('⏱') || text.includes('📅')) {
      const price = calcPrice(text);
      if (price) {
        const priceSpan = document.createElement('span');
        priceSpan.className = 'price-tag';
        priceSpan.textContent = '💰 ' + formatINR(price);
        meta.appendChild(priceSpan);
      }
    }
  });
});

// Hard remove any price tags inside the free masterclasses section
document.querySelectorAll('#section-masterclass .price-tag').forEach(el => el.remove());
