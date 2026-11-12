'use strict';

// ---------- Cards ----------
// A card is four features, each 0, 1 or 2: n (number of symbols - 1),
// shape, color and fill. Three cards form a trio when, for every feature,
// they are all the same or all different, which for values 0..2 is exactly
// when the three values add up to a multiple of 3.

const SHAPES = ['circle', 'triangle', 'square'];
const SHAPES_PL = ['circles', 'triangles', 'squares'];
const COLORS = ['blue', 'red', 'green'];
const FILLS = ['solid', 'shaded', 'hollow'];
const FEATURES = ['n', 'shape', 'color', 'fill'];

const MODES = {
  starter: { name: 'Starter', fills: [0] },
  classic: { name: 'Classic', fills: [0, 1, 2] },
  blitz: { name: 'Blitz', fills: [0, 1, 2], limit: 180 },
};

const WRONG_PENALTY = 5;   // seconds
const HINT_PENALTY = 15;   // seconds
const BOARD_SIZE = 12;

function makeDeck(fills) {
  const deck = [];
  for (const n of [0, 1, 2])
    for (const shape of [0, 1, 2])
      for (const color of [0, 1, 2])
        for (const fill of fills)
          deck.push({ id: n * 27 + shape * 9 + color * 3 + fill, n, shape, color, fill });
  return deck;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isTrio(a, b, c) {
  return FEATURES.every(f => (a[f] + b[f] + c[f]) % 3 === 0);
}

function findTrios(cards) {
  const out = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++)
      for (let k = j + 1; k < cards.length; k++)
        if (isTrio(cards[i], cards[j], cards[k])) out.push([cards[i], cards[j], cards[k]]);
  return out;
}

// Says why three cards aren't a trio, using the first feature that fails.
function whyNot(a, b, c) {
  for (const f of FEATURES) {
    if ((a[f] + b[f] + c[f]) % 3 === 0) continue;
    const v = a[f] === b[f] ? a[f] : c[f];   // the value two of them share
    switch (f) {
      case 'n': return `Two cards have ${v + 1} symbol${v ? 's' : ''} and one doesn't.`;
      case 'shape': return `Two are ${SHAPES_PL[v]} and one isn't.`;
      case 'color': return `Two are ${COLORS[v]} and one isn't.`;
      case 'fill': return `Two are ${FILLS[v]} and one isn't.`;
    }
  }
  return '';
}

const SHAPE_SVG = [
  '<circle class="sym" cx="20" cy="20" r="16"/>',
  '<path class="sym" d="M20 4.5 L36.5 34 H3.5 Z"/>',
  '<rect class="sym" x="5" y="5" width="30" height="30" rx="4"/>',
];

function symbolSvg(shape) {
  return `<svg viewBox="0 0 40 40" aria-hidden="true">${SHAPE_SVG[shape]}</svg>`;
}

function cardLabel(c) {
  const count = c.n + 1;
  const shape = count > 1 ? SHAPES_PL[c.shape] : SHAPES[c.shape];
  return `${count} ${FILLS[c.fill]} ${COLORS[c.color]} ${shape}`;
}

function cardEl(c, tag = 'button') {
  const el = document.createElement(tag);
  el.className = `card c${c.color} f${c.fill}`;
  el.dataset.id = c.id;
  el.setAttribute('aria-label', cardLabel(c));
  if (tag === 'button') { el.type = 'button'; el.setAttribute('aria-pressed', 'false'); }
  el.innerHTML = symbolSvg(c.shape).repeat(c.n + 1);
  return el;
}

// ---------- Storage ----------

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('triplet-' + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('triplet-' + key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

// ---------- Colours ----------
// The player picks any three of these. Each has a shade for light mode and a
// brighter one for dark mode.

const PALETTE = [
  { key: 'blue',   light: '#0072b2', dark: '#4fb0f0' },
  { key: 'red',    light: '#d55e00', dark: '#ff7a3d' },
  { key: 'green',  light: '#009e73', dark: '#2fd29b' },
  { key: 'purple', light: '#7b3fbf', dark: '#b48cff' },
  { key: 'orange', light: '#e69f00', dark: '#ffb733' },
  { key: 'pink',   light: '#cc3d8f', dark: '#ff7ac0' },
  { key: 'brown',  light: '#8a5a2b', dark: '#c8946a' },
  { key: 'grey',   light: '#3d4450', dark: '#d7dde6' },
];
const DEFAULT_COLORS = ['blue', 'red', 'green'];

function loadColors() {
  const saved = store.get('colors', null);
  const keys = PALETTE.map(p => p.key);
  if (Array.isArray(saved) && saved.length === 3 && new Set(saved).size === 3 && saved.every(k => keys.includes(k))) return saved;
  return DEFAULT_COLORS.slice();
}

let chosenColors = loadColors();

function applyColors() {
  const root = document.documentElement.style;
  chosenColors.forEach((key, i) => {
    const p = PALETTE.find(c => c.key === key);
    root.setProperty(`--c${i}l`, p.light);
    root.setProperty(`--c${i}d`, p.dark);
    COLORS[i] = key;
  });
  $('help-colors').textContent = `${COLORS[0]}, ${COLORS[1]} or ${COLORS[2]}`;
  $('ex-bad-label').textContent = `Not a trio: two are ${COLORS[1]} and one is ${COLORS[0]}.`;
  store.set('colors', chosenColors);
}

function renderSwatches() {
  const wrap = $('swatches');
  wrap.textContent = '';
  for (const p of PALETTE) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.setProperty('--l', p.light);
    b.style.setProperty('--d', p.dark);
    b.setAttribute('aria-label', p.key);
    b.setAttribute('aria-pressed', chosenColors.includes(p.key));
    b.title = p.key;
    b.addEventListener('click', () => toggleColor(p.key));
    wrap.appendChild(b);
  }
  const need = 3 - chosenColors.length;
  const note = $('colors-note');
  note.className = 'colors-note' + (need ? ' warn' : '');
  note.textContent = need
    ? `Pick ${need} more colour${need > 1 ? 's' : ''} to play.`
    : `Playing with ${chosenColors.join(', ')}.`;
  for (const m of document.querySelectorAll('.mode')) m.disabled = need > 0;
}

function toggleColor(key) {
  const i = chosenColors.indexOf(key);
  if (i >= 0) {
    chosenColors.splice(i, 1);
  } else if (chosenColors.length < 3) {
    chosenColors.push(key);
  } else {
    const note = $('colors-note');
    note.className = 'colors-note warn';
    note.textContent = 'Three already picked. Tap one to remove it first.';
    return;
  }
  if (chosenColors.length === 3) applyColors();
  renderSwatches();
  const btn = [...$('swatches').children].find(b => b.title === key);
  if (btn) btn.focus();
}

// ---------- DOM ----------

const $ = id => document.getElementById(id);
const boardEl = $('board');
const msgEl = $('message');

function show(screenId) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === screenId);
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

let msgTimer = 0;
function say(text, kind = 'info', ms = 1800) {
  msgEl.textContent = text;
  msgEl.className = 'message ' + kind;
  clearTimeout(msgTimer);
  if (ms) msgTimer = setTimeout(() => { msgEl.textContent = ''; }, ms);
}

// ---------- Game state ----------

let G = null;

function newGame(mode) {
  const m = MODES[mode];
  G = {
    mode,
    deck: shuffle(makeDeck(m.fills)),
    used: [],           // cards taken in trios (Blitz reshuffles these back in)
    board: [],
    selected: [],
    found: 0,
    wrong: 0,
    hints: 0,
    penalty: 0,         // seconds
    hint: null,         // { trio, shown }
    elapsedMs: 0,
    runningSince: null,
    busy: false,
    over: false,
  };
  const fresh = draw(BOARD_SIZE);
  G.board.push(...fresh);
  fresh.push(...ensureTrio());
  show('game');
  say('');
  renderBoard(fresh);
  $('hud-time-label').textContent = m.limit ? 'Left' : 'Time';
  resume();
}

function draw(count) {
  if (MODES[G.mode].limit && G.deck.length < count) {
    G.deck.push(...shuffle(G.used.splice(0)));
  }
  return G.deck.splice(0, count);
}

// Deals three more cards until there's a trio on the board (or the deck runs out).
// Returns the cards that were added.
function ensureTrio() {
  const added = [];
  while (!findTrios(G.board).length && G.deck.length + (MODES[G.mode].limit ? G.used.length : 0) > 0) {
    const more = draw(3);
    if (!more.length) break;
    G.board.push(...more);
    added.push(...more);
  }
  return added;
}

// ---------- Timer ----------

let tickTimer = 0;

function elapsed() {
  return (G.elapsedMs + (G.runningSince ? performance.now() - G.runningSince : 0)) / 1000;
}

function clockSeconds() {
  const limit = MODES[G.mode].limit;
  return limit ? limit - elapsed() - G.penalty : elapsed() + G.penalty;
}

function resume() {
  if (!G || G.over || G.runningSince) return;
  G.runningSince = performance.now();
  $('paused').hidden = true;
  clearInterval(tickTimer);
  tickTimer = setInterval(tick, 200);
  tick();
}

function pause(showOverlay = true) {
  if (!G || G.over || !G.runningSince) return;
  G.elapsedMs += performance.now() - G.runningSince;
  G.runningSince = null;
  clearInterval(tickTimer);
  if (showOverlay) $('paused').hidden = false;
}

function tick() {
  const t = clockSeconds();
  const timeEl = $('hud-time');
  timeEl.textContent = fmtTime(MODES[G.mode].limit ? Math.ceil(t) : t);
  timeEl.classList.toggle('low', !!MODES[G.mode].limit && t <= 15);
  if (MODES[G.mode].limit && t <= 0) endGame();
}

// ---------- Rendering ----------

function renderBoard(fresh = []) {
  const freshIds = new Set(fresh.map(c => c.id));
  boardEl.textContent = '';
  let i = 0;
  for (const c of G.board) {
    const el = cardEl(c);
    if (freshIds.has(c.id)) { el.classList.add('dealt'); el.style.setProperty('--i', i++); }
    if (G.selected.includes(c)) { el.classList.add('selected'); el.setAttribute('aria-pressed', 'true'); }
    boardEl.appendChild(el);
  }
  renderHints();
  renderHud();
  layout();
}

function renderHud() {
  $('hud-found').textContent = G.found;
  $('hud-deck').textContent = MODES[G.mode].limit ? '∞' : G.deck.length;
  const showCount = $('opt-count').checked;
  const n = findTrios(G.board).length;
  $('trio-count').textContent = showCount ? `${n} trio${n === 1 ? '' : 's'} on the board` : '';
  $('btn-hint').disabled = !!(G.hint && G.hint.shown >= 2);
}

function renderHints() {
  const ids = G.hint ? G.hint.trio.slice(0, G.hint.shown).map(c => c.id) : [];
  for (const el of boardEl.children) el.classList.toggle('hint', ids.includes(+el.dataset.id));
}

// Picks the column count that makes the cards as large as possible.
function layout() {
  if (!G) return;
  const n = G.board.length;
  const cs = getComputedStyle(boardEl);
  const W = boardEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const H = boardEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (W <= 0 || H <= 0) return;
  const gap = Math.max(6, Math.min(12, Math.min(W, H) * 0.02));
  const ratio = 1.5;   // card width / height
  let best = { w: 0, h: 0, cols: 3 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    let w = (W - gap * (cols - 1)) / cols;
    let h = (H - gap * (rows - 1)) / rows;
    if (w / h > ratio) w = h * ratio; else h = w / ratio;
    if (w > best.w) best = { w, h, cols };
  }
  const w = Math.min(best.w, 240);
  const h = w / ratio;
  boardEl.style.setProperty('--cols', best.cols);
  boardEl.style.setProperty('--cw', w + 'px');
  boardEl.style.setProperty('--ch', h + 'px');
  boardEl.style.setProperty('--gap', gap + 'px');
  boardEl.style.setProperty('--sym', Math.min(h * 0.56, w * 0.27) + 'px');
}

// ---------- Play ----------

function onCardTap(id) {
  if (!G || G.busy || G.over || !G.runningSince) return;
  const card = G.board.find(c => c.id === id);
  if (!card) return;
  const i = G.selected.indexOf(card);
  if (i >= 0) G.selected.splice(i, 1); else G.selected.push(card);
  for (const el of boardEl.children) {
    const on = G.selected.some(c => c.id === +el.dataset.id);
    el.classList.toggle('selected', on);
    el.setAttribute('aria-pressed', on);
  }
  if (G.selected.length === 3) checkSelection();
}

function elsFor(cards) {
  return cards.map(c => boardEl.querySelector(`[data-id="${c.id}"]`));
}

function checkSelection() {
  const [a, b, c] = G.selected;
  const els = elsFor(G.selected);
  G.busy = true;
  if (isTrio(a, b, c)) {
    G.found++;
    say(['Trio!', 'Nice!', 'Got it!', 'Yes!'][G.found % 4], 'good', 1200);
    els.forEach(el => el.classList.add('got'));
    setTimeout(() => takeTrio(G.selected), 330);
  } else {
    G.wrong++;
    G.penalty += WRONG_PENALTY;
    say(`${whyNot(a, b, c)}  +${WRONG_PENALTY}s`, 'bad', 2600);
    if (navigator.vibrate) navigator.vibrate(120);
    els.forEach(el => el.classList.add('wrong'));
    tick();
    setTimeout(() => {
      G.selected = [];
      els.forEach(el => { el.classList.remove('wrong', 'selected'); el.setAttribute('aria-pressed', 'false'); });
      G.busy = false;
    }, 420);
  }
}

function takeTrio(trio) {
  if (G.over) return;
  G.used.push(...trio);
  G.selected = [];
  G.hint = null;
  const fresh = [];
  // Refill the gaps in place while the board is at its normal size; otherwise shrink it.
  if (G.board.length <= BOARD_SIZE && (G.deck.length >= 3 || MODES[G.mode].limit)) {
    const more = draw(3);
    trio.forEach((c, i) => {
      const at = G.board.indexOf(c);
      if (more[i]) { G.board[at] = more[i]; fresh.push(more[i]); } else G.board.splice(at, 1);
    });
  } else {
    G.board = G.board.filter(c => !trio.includes(c));
  }
  fresh.push(...ensureTrio());
  G.busy = false;
  renderBoard(fresh);
  if (!findTrios(G.board).length) endGame();
}

function useHint() {
  if (!G || G.busy || G.over || !G.runningSince) return;
  const stale = !G.hint || G.hint.trio.some(c => !G.board.includes(c));
  if (stale) {
    const trios = findTrios(G.board);
    if (!trios.length) return;
    G.hint = { trio: trios[Math.floor(Math.random() * trios.length)], shown: 0 };
  }
  if (G.hint.shown >= 2) return;
  G.hint.shown++;
  G.hints++;
  G.penalty += HINT_PENALTY;
  say(G.hint.shown === 1 ? 'This card is in a trio.' : 'These two are in the same trio.', 'info', 2200);
  renderHints();
  renderHud();
  tick();
}

// ---------- End ----------

function endGame() {
  if (G.over) return;
  pause(false);
  G.over = true;
  clearInterval(tickTimer);
  const m = MODES[G.mode];
  const best = store.get('best', {});
  let isBest = false;
  const rows = [];

  if (m.limit) {
    $('over-title').textContent = "Time's up!";
    rows.push(['Trios found', G.found]);
    if (G.found > 0 && G.found > (best[G.mode] || 0)) { best[G.mode] = G.found; isBest = true; }
    rows.push(['Best', best[G.mode] || 0]);
  } else {
    $('over-title').textContent = G.board.length ? 'No trios left!' : 'Deck cleared!';
    const total = elapsed() + G.penalty;
    rows.push(['Time', fmtTime(total)]);
    rows.push(['Trios found', G.found]);
    if (!best[G.mode] || total < best[G.mode]) { best[G.mode] = total; isBest = true; }
    rows.push(['Best time', fmtTime(best[G.mode])]);
    if (G.board.length) rows.push(['Cards left with no trio', G.board.length]);
  }
  rows.push(['Wrong picks', G.wrong]);
  rows.push(['Hints', G.hints]);
  if (G.penalty) rows.push(['Penalty time', '+' + G.penalty + 's']);

  store.set('best', best);
  $('over-best').hidden = !isBest;
  $('over-stats').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  setTimeout(() => show('over'), 250);
}

function quitToMenu() {
  if (G) { pause(false); G.over = true; clearInterval(tickTimer); }
  $('paused').hidden = true;
  renderMenu();
  show('menu');
}

// ---------- Menu & help ----------

function renderMenu() {
  const best = store.get('best', {});
  for (const el of document.querySelectorAll('[data-best]')) {
    const mode = el.dataset.best;
    const v = best[mode];
    el.textContent = v == null ? '' : MODES[mode].limit ? `Best: ${v} trios` : `Best: ${fmtTime(v)}`;
  }
}

function renderLogo() {
  $('logo').innerHTML = [0, 1, 2].map(i =>
    `<span class="card c${i} f${i}" style="border:none;box-shadow:none;background:none">${symbolSvg(i)}</span>`).join('');
}

function renderHelpExamples() {
  const ex = (el, cards) => { el.textContent = ''; cards.forEach(c => el.appendChild(cardEl(c, 'div'))); };
  const C = (n, shape, color, fill) => ({ id: 0, n, shape, color, fill });
  ex($('ex-good'), [C(0, 1, 0, 0), C(1, 1, 1, 1), C(2, 1, 2, 2)]);
  ex($('ex-bad'), [C(0, 0, 1, 0), C(1, 2, 1, 2), C(2, 1, 0, 1)]);
}

function openHelp() {
  const wasRunning = G && !G.over && G.runningSince;
  if (wasRunning) pause(true);
  $('help').showModal();
}

// ---------- Wiring ----------

for (const btn of document.querySelectorAll('.mode')) {
  btn.addEventListener('click', () => newGame(btn.dataset.mode));
}

boardEl.addEventListener('pointerdown', e => {
  const el = e.target.closest('.card');
  if (el) { e.preventDefault(); onCardTap(+el.dataset.id); }
});
// Keyboard users: Enter/Space fire click but not pointerdown.
boardEl.addEventListener('click', e => {
  const el = e.target.closest('.card');
  if (el && e.detail === 0) onCardTap(+el.dataset.id);
});

$('btn-hint').addEventListener('click', useHint);
$('btn-pause').addEventListener('click', () => pause(true));
$('btn-resume').addEventListener('click', resume);
$('btn-quit').addEventListener('click', quitToMenu);
$('btn-pause-quit').addEventListener('click', quitToMenu);
$('btn-pause-help').addEventListener('click', openHelp);
$('btn-help').addEventListener('click', openHelp);
$('btn-again').addEventListener('click', () => newGame(G.mode));
$('btn-menu').addEventListener('click', quitToMenu);

const optCount = $('opt-count');
optCount.checked = store.get('show-count', false);
optCount.addEventListener('change', () => store.set('show-count', optCount.checked));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause(true);
});

new ResizeObserver(() => layout()).observe(boardEl);

$('btn-colors-reset').addEventListener('click', () => {
  chosenColors = DEFAULT_COLORS.slice();
  applyColors();
  renderSwatches();
});

applyColors();
renderSwatches();
renderLogo();
renderHelpExamples();
renderMenu();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
