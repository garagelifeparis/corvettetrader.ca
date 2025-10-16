async function loadListings() {
  const res = await fetch('data/listings.json', { cache: 'no-store' });
  const items = await res.json();
  return items.sort((a, b) => new Date(b.posted) - new Date(a.posted));
}

function fmtPrice(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function cardHTML(p) {
  return `
  <article class="card">
    <img src="${p.image}" alt="${p.title}" />
    <div class="meta">
      <div class="topline">
        <span class="gen">${p.generation}</span>
        <span class="loc">${p.city}, ${p.province}</span>
      </div>
      <h3>${p.title}</h3>
      <div class="price">${fmtPrice(p.price)}</div>
      <p class="desc">${p.description}</p>
      <a class="btn" href="mailto:${p.contact}?subject=${encodeURIComponent('Inquiry: ' + p.title)}">Contact Seller</a>
    </div>
  </article>`;
}

function filter(items, q) {
  const kw = (q.q || '').trim().toLowerCase();
  const gen = q.gen || 'All';
  const type = q.type || 'All';
  const prov = q.prov || 'All';
  const min = q.min ? Number(q.min) : 0;
  const max = q.max ? Number(q.max) : Infinity;

  return items.filter(p => {
    const kwMatch = !kw || [p.title, p.description, p.city, p.partType, p.generation].join(' ').toLowerCase().includes(kw);
    const genMatch = gen === 'All' || p.generation === gen;
    const typeMatch = type === 'All' || p.partType === type;
    const provMatch = prov === 'All' || p.province === prov;
    const priceMatch = p.price >= min && p.price <= max;
    return kwMatch && genMatch && typeMatch && provMatch && priceMatch;
  });
}

function unique(arr, key) {
  return [...new Set(arr.map(x => x[key]))].sort();
}

async function initListings() {
  const data = await loadListings();
  const root = document.getElementById('results');
  const form = document.getElementById('filters');

  // populate selects
  const gens = ['All', ...unique(data, 'generation')];
  const types = ['All', ...unique(data, 'partType')];
  const provs = ['All', ...unique(data, 'province')];
  const gSel = form.gen; const tSel = form.type; const pSel = form.prov;

  gens.forEach(v => gSel.insertAdjacentHTML('beforeend', `<option>${v}</option>`));
  types.forEach(v => tSel.insertAdjacentHTML('beforeend', `<option>${v}</option>`));
  provs.forEach(v => pSel.insertAdjacentHTML('beforeend', `<option>${v}</option>`));

  function render() {
    const q = Object.fromEntries(new FormData(form).entries());
    const list = filter(data, q);
    root.innerHTML = list.map(cardHTML).join('') || `<div class="empty">No results. Try widening your filters.</div>`;
    document.getElementById('count').textContent = `${list.length}`;
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => { e.preventDefault(); render(); });
  render();
}

document.addEventListener('DOMContentLoaded', initListings);
