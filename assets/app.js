// assets/app.js — for CorvetteTrader.ca
// Handles listing display, filtering, and formatting

// Load and sort listings from JSON
async function loadListings() {
  try {
    const res = await fetch('data/listings.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    if (!Array.isArray(items)) throw new Error('Invalid JSON structure');
    return items.sort((a, b) => new Date(b.posted) - new Date(a.posted));
  } catch (err) {
    const results = document.getElementById('results');
    const count = document.getElementById('count');
    if (results) {
      results.innerHTML = `<p style="color:red;">Error loading listings: ${err.message}</p>`;
    }
    if (count) count.textContent = '0';
    return [];
  }
}

// Format prices in CAD
function fmtPrice(n) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  }).format(n);
}

// Build each listing card
function cardHTML(p) {
  return `
    <article class="card" style="border:1px solid #ddd;padding:12px;border-radius:6px;margin:8px;">
      <img src="${p.image}" alt="${p.title}" style="width:100%;max-width:400px;height:auto;border-radius:4px;margin-bottom:8px;">
      <div style="font-size:14px;color:#666;margin-bottom:4px;">
        ${Array.isArray(p.generation) ? p.generation.join(', ') : p.generation || ''}
        • ${p.city || ''}, ${p.province || ''}
      </div>
      <h3 style="margin:4px 0;">${p.title}</h3>
      <div style="color:#000;margin-bottom:4px;">${fmtPrice(p.price)}</div>
      <p style="font-size:14px;color:#333;">${p.description}</p>
      <a href="mailto:${p.contact}?subject=${encodeURIComponent('Inquiry: ' + p.title)}" 
         style="color:#007bff;text-decoration:none;">Contact Seller</a>
    </article>
  `;
}

// Filter logic
function filter(items, q) {
  const kw = (q.q || '').trim().toLowerCase();
  const gen = q.generation && q.generation !== 'ALL' ? q.generation : null;
  const type = q.partType && q.partType !== 'ALL' ? q.partType : null;
  const prov = q.province && q.province !== 'ALL' ? q.province : null;
  const min = q.min ? Number(q.min) : 0;
  const max = q.max ? Number(q.max) : Infinity;

  return items.filter(p => {
    const kwMatch =
      p.title.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw);
    const genMatch = !gen || (Array.isArray(p.generation) && p.generation.includes(gen)) || p.generation === gen;
    const typeMatch = !type || p.partType === type;
    const provMatch = !prov || p.province === prov;
    const priceMatch = p.price >= min && p.price <= max;
    return kwMatch && genMatch && typeMatch && provMatch && priceMatch;
  });
}

// Remove duplicates for dropdowns
function unique(arr, key) {
  return [...new Set(arr.map(x => x[key]))].filter(Boolean).sort();
}

// Initialize listings on page load
async function initListings() {
  const data = await loadListings();
  const results = document.getElementById('results');
  const count = document.getElementById('count');
  const form = document.getElementById('filters');
  if (!data.length || !results || !form) return;

  // Populate dropdowns
  const gens = unique(data, 'generation');
  const provs = unique(data, 'province');
  const types = unique(data, 'partType');

  const genSel = form.generation;
  const provSel = form.province;
  const typeSel = form.partType;

  for (const opt of gens) genSel.insertAdjacentHTML('beforeend', `<option>${opt}</option>`);
  for (const opt of provs) provSel.insertAdjacentHTML('beforeend', `<option>${opt}</option>`);
  for (const opt of types) typeSel.insertAdjacentHTML('beforeend', `<option>${opt}</option>`);

  // Render listings
  function render() {
    const query = Object.fromEntries(new FormData(form).entries());
    const list = filter(data, query);
    results.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<p style="color:#999;">No listings match your filters.</p>`;
    count.textContent = list.length;
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', e => {
    e.preventDefault();
    render();
  });

  render();
}

// Run once page is loaded
document.addEventListener('DOMContentLoaded', initListings);
