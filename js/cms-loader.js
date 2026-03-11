/**
 * cms-loader.js
 * Читает контент из файлов CMS (JSON + Markdown front-matter)
 * и рендерит страницу динамически.
 *
 * На Netlify файлы отдаются как статика — fetch() работает нативно.
 * Для локальной разработки нужен любой dev-сервер (npx serve .).
 */

'use strict';

// ─── MARKDOWN FRONT-MATTER PARSER ───────────────────────────────
function parseFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    if (col < 0) return;
    const key = line.slice(0, col).trim();
    let val = line.slice(col + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(val) && val !== '') val = Number(val);
    meta[key] = val;
  });
  // Parse list fields (forms, ticker, etc.)
  const listRe = /^(\w+):\s*\n((?:\s+- .+\n?)+)/gm;
  let m;
  const raw = match[1];
  while ((m = listRe.exec(raw)) !== null) {
    const key = m[1];
    meta[key] = m[2].split('\n')
      .map(l => l.replace(/^\s+- /, '').replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);
  }
  const body = text.slice(match[0].length).trim();
  return { meta, body };
}

// ─── FILE FETCHER ────────────────────────────────────────────────
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchMD(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    return parseFrontMatter(text);
  } catch { return null; }
}

// Known content files (on Netlify these are static files in the repo)
const NEWS_FILES = [
  'content/news/2025-02-28-olimpiada-sng.md',
  'content/news/2025-03-05-belgazprombank.md',
  'content/news/2025-03-12-open-day.md',
];

const EVENT_FILES = [
  'content/events/2025-03-15-open-day.md',
  'content/events/2025-03-22-conference.md',
  'content/events/2025-04-04-masterclass.md',
  'content/events/2025-04-18-olympiad.md',
];

const PROGRAM_FILES = [
  'content/programs/economics-management.md',
  'content/programs/finance.md',
  'content/programs/management.md',
];

// ─── LOAD ALL DATA ───────────────────────────────────────────────
async function loadAll() {
  const [settings, hero, dean, ...rest] = await Promise.all([
    fetchJSON('_data/settings.json'),
    fetchJSON('_data/hero.json'),
    fetchJSON('_data/dean.json'),
    ...NEWS_FILES.map(fetchMD),
    ...EVENT_FILES.map(fetchMD),
    ...PROGRAM_FILES.map(fetchMD),
  ]);

  const nCount = NEWS_FILES.length;
  const eCount = EVENT_FILES.length;
  const pCount = PROGRAM_FILES.length;

  const newsData    = rest.slice(0, nCount).filter(Boolean).map(f => f.meta);
  const eventsData  = rest.slice(nCount, nCount + eCount).filter(Boolean).map(f => f.meta);
  const programsData = rest.slice(nCount + eCount).filter(Boolean).map(f => f.meta);

  return { settings, hero, dean, newsData, eventsData, programsData };
}

// ─── RENDERERS ──────────────────────────────────────────────────

function renderNav(settings) {
  if (!settings) return;
  const abbr = settings.faculty_abbr || 'ФЭМ';
  const uni  = settings.university   || 'БГЭУ';
  const name = settings.faculty_name || 'Факультет экономики и менеджмента';
  document.getElementById('navTitle').textContent = `${abbr} · ${uni}`;
  document.getElementById('navSub').textContent   = name;
}

function renderHero(hero, settings) {
  if (hero) {
    setText('heroLine1', hero.line1 || 'Факультет');
    setText('heroLine2', hero.line2 || 'экономики');
    setText('heroLine3', hero.line3 || 'и менеджмента');
    setText('heroDesc',  hero.description || '');
    setLink('heroBtn1', hero.btn1_text, hero.btn1_url);
    setLink('heroBtn2', hero.btn2_text, hero.btn2_url);
  }
  if (settings && settings.stats) {
    const el = document.getElementById('heroStats');
    el.innerHTML = settings.stats.map(s => `
      <div>
        <div class="hero-stat-num">${s.number}</div>
        <div class="hero-stat-label">${s.label}</div>
      </div>
    `).join('');
  }
}

function renderHeroWidget(newsData) {
  const el = document.getElementById('heroNewsWidget');
  if (!newsData.length) { el.innerHTML = '<div class="news-widget-item"><div class="nwi-title" style="opacity:.4;">Новостей нет</div></div>'; return; }
  el.innerHTML = newsData.slice(0, 3).map(n => `
    <div class="news-widget-item">
      <div class="nwi-date">${n.date || ''}</div>
      <div class="nwi-title">${n.title || ''}</div>
    </div>
  `).join('');
}

function renderTicker(settings) {
  const items = (settings && settings.ticker) ? settings.ticker : [];
  if (!items.length) return;
  const doubled = [...items, ...items];
  document.getElementById('tickerInner').innerHTML =
    doubled.map(t => `<span class="ticker-item">${t}</span>`).join('');
}

function renderPrograms(programsData) {
  const el = document.getElementById('programsGrid');
  if (!programsData.length) { el.innerHTML = '<p style="color:var(--muted);">Программы не загружены</p>'; return; }
  const sorted = [...programsData].sort((a, b) => (a.order || 0) - (b.order || 0));
  el.innerHTML = sorted.filter(p => p.published !== false).map(p => `
    <div class="prog-card ${p.featured ? 'featured' : ''}">
      <div class="prog-level">${p.level} · ${p.duration}</div>
      <div class="prog-icon">${p.icon || '📚'}</div>
      <div class="prog-name">${p.title}</div>
      <div class="prog-desc">${p.description || ''}</div>
      <div class="prog-tags">
        ${(p.forms || []).map(f => `<span class="prog-tag">${f}</span>`).join('')}
      </div>
      <div class="prog-more">Подробнее →</div>
    </div>
  `).join('');
}

function renderNews(newsData) {
  const el = document.getElementById('newsGrid');
  const published = newsData.filter(n => n.published !== false);
  if (!published.length) {
    el.innerHTML = '<div style="padding:40px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;font-size:12px;letter-spacing:.1em;grid-column:1/-1;">НОВОСТЕЙ НЕТ — ДОБАВЬТЕ ЧЕРЕЗ /admin/</div>';
    document.getElementById('cmsStatus').innerHTML = '<div class="cms-dot" style="background:#F87171"></div><span>CMS: нет данных</span>';
    return;
  }
  // Sort: featured first, then by date desc
  const sorted = [...published].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
  const [feat, ...rest] = sorted;
  const catClass = ['Наука','Партнёрство'].includes(feat.category) ? 'blue' : 'red';

  el.innerHTML = `
    <div class="news-feat">
      <span class="news-cat ${catClass}">${feat.category || ''}</span>
      <div class="news-feat-date">${feat.date || ''}</div>
      <div class="news-feat-title">${feat.title}</div>
      ${feat.excerpt ? `<div class="news-feat-text">${feat.excerpt}</div>` : ''}
    </div>
    <div class="news-side">
      ${rest.slice(0, 3).map(n => `
        <div class="news-side-item">
          <div class="news-cat outline">${n.category || ''}</div>
          <div class="nsi-title">${n.title}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);margin-top:8px;">${n.date || ''}</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('cmsStatus').innerHTML =
    `<div class="cms-dot"></div><span>CMS: ${published.length} новост${published.length === 1 ? 'ь' : 'и'} загружено</span>`;
}

function renderEvents(eventsData) {
  const el = document.getElementById('eventsRow');
  const published = eventsData.filter(e => e.published !== false);
  if (!published.length) {
    el.innerHTML = '<div style="padding:40px;color:rgba(255,255,255,0.3);font-family:\'JetBrains Mono\',monospace;font-size:12px;">НЕТ СОБЫТИЙ</div>';
    return;
  }
  el.innerHTML = published.slice(0, 4).map(e => `
    <div class="event-card">
      <div>
        <div class="ev-day">${e.day_display || ''}</div>
        <div class="ev-month">${e.month_display || ''}</div>
      </div>
      <div class="ev-title">${e.title}</div>
      <div class="ev-type">${e.type || ''}${e.time ? ' · ' + e.time : ''}</div>
    </div>
  `).join('');
}

function renderDean(dean) {
  if (!dean) return;
  setText('deanName', dean.name || '');
  setText('deanPos', dean.position || '');
  setText('deanQuote', dean.quote || '');
  if (dean.photo) {
    const wrap = document.getElementById('deanPhotoWrap');
    wrap.innerHTML = `<img src="${dean.photo}" alt="${dean.name}" />`;
  }
}

function renderPartners(settings) {
  const el = document.getElementById('partnersRow');
  const partners = (settings && settings.partners) || [];
  el.innerHTML = partners.map(p => `<div class="p-logo">${p}</div>`).join('');
}

function renderFooter(settings) {
  if (!settings) return;
  const abbr = settings.faculty_abbr || 'ФЭМ';
  const uni  = settings.university   || 'БГЭУ';
  const name = settings.faculty_name || '';
  setText('footerTitle', `${abbr} · ${uni}`);
  setText('footerSub', name);
  setText('footerCopy', `© ${new Date().getFullYear()} ${uni} · ${name}`);
  const contacts = document.getElementById('footerContacts');
  contacts.innerHTML = `
    <a href="#">${settings.address || ''}</a>
    <a href="tel:${settings.phone || ''}">${settings.phone || ''}</a>
    <a href="mailto:${settings.email || ''}">${settings.email || ''}</a>
  `;
}

// ─── HELPERS ────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setLink(id, text, href) {
  const el = document.getElementById(id);
  if (!el) return;
  if (text) el.textContent = text;
  if (href) el.href = href;
}

// ─── MOBILE NAV ─────────────────────────────────────────────────
window.toggleMobile = function() {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  const open = links.style.display === 'flex';
  links.style.cssText = open
    ? ''
    : 'display:flex;flex-direction:column;position:fixed;top:68px;left:0;right:0;background:var(--blue);padding:1rem 0;z-index:199;';
};

// ─── INIT ────────────────────────────────────────────────────────
(async () => {
  try {
    const { settings, hero, dean, newsData, eventsData, programsData } = await loadAll();
    renderNav(settings);
    renderHero(hero, settings);
    renderHeroWidget(newsData);
    renderTicker(settings);
    renderPrograms(programsData);
    renderNews(newsData);
    renderEvents(eventsData);
    renderDean(dean);
    renderPartners(settings);
    renderFooter(settings);
  } catch (err) {
    console.error('CMS load error:', err);
    document.getElementById('cmsStatus').innerHTML =
      '<div class="cms-dot" style="background:#F87171"></div><span>Ошибка загрузки CMS</span>';
  }
})();
