// SkyCast Frontend Config — v2.1
const CONFIG = {
  BACKEND_URL: 'http://localhost:5000',
  API_KEY: "cf622ac8ec1450b8c7e4a0c06381f84d",
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEO_URL:  'https://api.openweathermap.org/geo/1.0',
  ICON_URL: 'https://openweathermap.org/img/wn',
  DEFAULT_LAT: 12.9716, DEFAULT_LON: 77.5946, DEFAULT_CITY: 'Bengaluru',
};

// ── JWT ──────────────────────────────────────────────────────
const getToken  = () => localStorage.getItem('skycast_token') || '';
const setToken  = (t) => localStorage.setItem('skycast_token', t);

const authHeaders = () => {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }
           : { 'Content-Type': 'application/json' };
};

async function apiCall(path, options = {}) {
  const res  = await fetch(CONFIG.BACKEND_URL + path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Units ────────────────────────────────────────────────────
const getUnit       = () => localStorage.getItem('unit') || 'metric';
const getUnitSymbol = () => getUnit() === 'metric' ? '°C' : '°F';
const getWindUnit   = () => getUnit() === 'metric' ? 'm/s' : 'mph';
const getTempParam  = () => getUnit();

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info', ms = 3500) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${{success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'}[type]||'ℹ️'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 350); }, ms);
}

// ── Auth ─────────────────────────────────────────────────────
function requireAuth() {
  const u = getCurrentUser();
  if (!u || !getToken()) {
    const base = location.pathname.includes('/pages/') ? '../' : '';
    location.href = base + 'pages/login.html';
    return null;
  }
  return u;
}
const getCurrentUser  = () => { try { return JSON.parse(localStorage.getItem('skycast_user') || 'null'); } catch { return null; } };
const setCurrentUser  = (u) => localStorage.setItem('skycast_user', JSON.stringify(u));

function logout() {
  if (getToken()) fetch(CONFIG.BACKEND_URL + '/api/auth/logout', { method: 'POST', headers: authHeaders() }).catch(() => {});
  localStorage.removeItem('skycast_user');
  localStorage.removeItem('skycast_token');
  const base = location.pathname.includes('/pages/') ? '../' : '';
  location.href = base + 'pages/login.html';
}

// ── Log search to backend ────────────────────────────────────
async function logSearch(data) {
  if (!getToken() || getToken() === 'demo_token_no_backend') return;
  try { await apiCall('/api/search/log', { method: 'POST', body: JSON.stringify(data) }); } catch (_) {}
}

// ── Autocomplete — FIXED z-index & click ────────────────────
// Dropdown is appended to <body> with position:fixed so nothing can clip it
function initSearch(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Make sure wrapper is relative
  let wrap = input.closest('.search-wrap') || input.parentElement;
  wrap.style.position = 'relative';

  // Remove any old body-level dropdown for this input
  const oldId = 'ac-' + inputId;
  document.getElementById(oldId)?.remove();

  // Create dropdown appended to body
  const list = document.createElement('div');
  list.id = oldId;
  list.style.cssText = [
    'position:fixed', 'z-index:2147483647', 'display:none',
    'background:rgba(8,18,38,0.98)', 'border:1px solid rgba(255,255,255,0.18)',
    'border-radius:12px', 'backdrop-filter:blur(32px)', '-webkit-backdrop-filter:blur(32px)',
    'box-shadow:0 24px 64px rgba(0,0,0,0.75)', 'max-height:300px',
    'overflow-y:auto', 'font-family:DM Sans,sans-serif',
  ].join(';');
  document.body.appendChild(list);

  const pos = () => {
    const r = wrap.getBoundingClientRect();
    list.style.top   = (r.bottom + 4) + 'px';
    list.style.left  = r.left + 'px';
    list.style.width = r.width + 'px';
  };
  window.addEventListener('resize', pos, true);
  window.addEventListener('scroll', pos, true);

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { list.style.display = 'none'; return; }
    timer = setTimeout(() => fetchGeo(q), 320);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') list.style.display = 'none';
    if (e.key === 'Enter') { const f = list.querySelector('.ac-row'); if (f) f.dispatchEvent(new Event('mousedown')); }
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target) && !list.contains(e.target)) list.style.display = 'none';
  });

  async function fetchGeo(q) {
    const key = CONFIG.API_KEY;
    if (!key) {
      list.innerHTML = '<div style="padding:.8rem 1rem;font-size:.85rem;color:#facc15">⚠️ Set your API key in ⚙️ Settings first.</div>';
      pos(); list.style.display = 'block'; return;
    }
    try {
      const data = await (await fetch(`${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(q)}&limit=7&appid=${key}`)).json();
      if (!Array.isArray(data) || !data.length) { list.style.display = 'none'; return; }
      list.innerHTML = data.map(c => `
        <div class="ac-row" style="padding:.75rem 1rem;cursor:pointer;font-size:.875rem;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:.6rem;color:rgba(241,245,249,0.75);transition:background .15s"
          data-lat="${c.lat}" data-lon="${c.lon}" data-city="${c.name}" data-country="${c.country}" data-state="${c.state||''}"
          onmouseover="this.style.background='rgba(56,189,248,.1)';this.style.color='#f1f5f9'"
          onmouseout="this.style.background='';this.style.color='rgba(241,245,249,0.75)'">
          <span>📍</span>
          <div>
            <div style="font-weight:600;color:#f1f5f9">${c.name}${c.state?', '+c.state:''}</div>
            <div style="font-size:.72rem;color:rgba(241,245,249,.4)">${c.country} · ${(+c.lat).toFixed(3)}, ${(+c.lon).toFixed(3)}</div>
          </div>
        </div>`).join('');
      pos(); list.style.display = 'block';
      list.querySelectorAll('.ac-row').forEach(row => {
        row.addEventListener('mousedown', e => {
          e.preventDefault();
          const lat = +row.dataset.lat, lon = +row.dataset.lon;
          const city = row.dataset.city, country = row.dataset.country;
          input.value = city + (row.dataset.state ? ', ' + row.dataset.state : '') + ', ' + country;
          list.style.display = 'none';
          logSearch({ query: city, city, country, lat, lon });
          onSelect({ lat, lon, city, country });
        });
      });
    } catch (_) {}
  }
}

// ── Dynamic background ───────────────────────────────────────
function applyWeatherBackground(wid, isDay) {
  if (localStorage.getItem('skycast_pref_dynamic_bg') === '0') return;
  const G = {
    clear_day:    'linear-gradient(145deg,#0a1628 0%,#1e3a6e 28%,#2563ab 58%,#f97316 85%,#fbbf24 100%)',
    clear_night:  'linear-gradient(145deg,#020818 0%,#0a1628 40%,#1e3a6e 70%,#312e81 100%)',
    clouds:       'linear-gradient(145deg,#1a2744 0%,#2d3f5f 40%,#4a5568 70%,#6b7280 100%)',
    rain:         'linear-gradient(145deg,#0d1b2a 0%,#1a2744 35%,#1e3a5f 60%,#234e6e 100%)',
    drizzle:      'linear-gradient(145deg,#1a2744 0%,#2d4a6e 40%,#3a5f80 70%,#4a7a9b 100%)',
    thunderstorm: 'linear-gradient(145deg,#0a0a1a 0%,#1a1a3e 35%,#2d1b69 60%,#4c1d95 100%)',
    snow:         'linear-gradient(145deg,#c8d8e8 0%,#b0c4d8 30%,#94a3b8 60%,#7faec8 100%)',
    mist:         'linear-gradient(145deg,#1e2d3d 0%,#2d3f55 40%,#4a5568 70%,#6b7280 100%)',
    haze:         'linear-gradient(145deg,#3d2b1f 0%,#5c3d2e 40%,#7c5a3c 70%,#a0754d 100%)',
  };
  let k = isDay ? 'clear_day' : 'clear_night';
  if (wid>=200&&wid<300) k='thunderstorm'; else if (wid>=300&&wid<400) k='drizzle';
  else if (wid>=500&&wid<600) k='rain'; else if (wid>=600&&wid<700) k='snow';
  else if (wid>=700&&wid<800) k=wid===721?'haze':'mist';
  else if (wid===800) k=isDay?'clear_day':'clear_night'; else if (wid>800) k='clouds';
  document.body.style.background = G[k]; document.body.style.backgroundAttachment = 'fixed';
}
