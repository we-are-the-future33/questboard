import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, remove, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const _safetyTimer = setTimeout(() => {
  const l = document.getElementById('loadingScreen');
  if (l && l.classList.contains('active')) { showScreen('loginScreen'); }
}, 8000);

const firebaseConfig = {
  apiKey: "AIzaSyAbEbLdJuWVai_NKTHuo1XtC8p76dmVPE0",
  authDomain: "grow-goal.firebaseapp.com",
  databaseURL: "https://grow-goal-default-rtdb.firebaseio.com",
  projectId: "grow-goal",
  storageBucket: "grow-goal.firebasestorage.app",
  messagingSenderId: "587441793315",
  appId: "1:587441793315:web:8ae5325a2af90953ce4496"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== CONSTANTS =====
const MAX_HABITS = 10;
const MAX_CHALLENGES = 10;
const TUT_STEPS = 5;
const LEGACY_MAP = { w1:{unit:'weekly',freq:1}, w2:{unit:'weekly',freq:2}, w4:{unit:'weekly',freq:4}, w6:{unit:'weekly',freq:6} };
const STAGE_NAMES = ['알','병아리','고양이','강아지','여우','판다','토끼','사자','드래곤','유니콘'];
const AVATARS = [
  `<svg viewBox="0 0 80 80"><ellipse cx="40" cy="44" rx="22" ry="28" fill="#f0e8d0" stroke="#c8b89a" stroke-width="2"/><ellipse cx="33" cy="36" rx="4" ry="6" fill="rgba(255,255,255,0.3)"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="48" r="20" fill="#f5c518"/><circle cx="40" cy="28" r="14" fill="#f5c518"/><circle cx="35" cy="25" r="3" fill="#1a1a1a"/><circle cx="45" cy="25" r="3" fill="#1a1a1a"/><polygon points="40,30 37,34 43,34" fill="#f39c12"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="48" r="22" fill="#d4a574"/><circle cx="40" cy="30" r="16" fill="#d4a574"/><polygon points="24,20 20,8 32,18" fill="#d4a574"/><polygon points="56,20 60,8 48,18" fill="#d4a574"/><circle cx="34" cy="28" r="3.5" fill="#1a1a1a"/><circle cx="46" cy="28" r="3.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="46" r="22" fill="#c8986a"/><circle cx="40" cy="28" r="16" fill="#c8986a"/><ellipse cx="24" cy="34" rx="9" ry="14" fill="#b8845a" transform="rotate(-10,24,34)"/><ellipse cx="56" cy="34" rx="9" ry="14" fill="#c8986a" transform="rotate(10,56,34)"/><circle cx="34" cy="26" r="3.5" fill="#1a1a1a"/><circle cx="46" cy="26" r="3.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="46" r="20" fill="#e8783a"/><circle cx="40" cy="28" r="15" fill="#e8783a"/><polygon points="26,20 18,6 34,18" fill="#e8783a"/><polygon points="54,20 62,6 46,18" fill="#e8783a"/><circle cx="34" cy="26" r="3.5" fill="#1a1a1a"/><circle cx="46" cy="26" r="3.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="46" r="22" fill="#f8f8f8"/><circle cx="40" cy="28" r="16" fill="#f8f8f8"/><ellipse cx="29" cy="25" rx="8" ry="7" fill="#2a2a2a"/><ellipse cx="51" cy="25" rx="8" ry="7" fill="#2a2a2a"/><circle cx="30" cy="24" r="2.5" fill="#1a1a1a"/><circle cx="52" cy="24" r="2.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><ellipse cx="28" cy="18" rx="7" ry="18" fill="#f0f0f0"/><ellipse cx="52" cy="18" rx="7" ry="18" fill="#f0f0f0"/><circle cx="40" cy="46" r="22" fill="#f0f0f0"/><circle cx="40" cy="30" r="15" fill="#f0f0f0"/><circle cx="34" cy="28" r="3.5" fill="#e87eb0"/><circle cx="46" cy="28" r="3.5" fill="#e87eb0"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="#e8a830" opacity=".4"/><circle cx="40" cy="36" r="16" fill="#f5d040"/><circle cx="34" cy="30" r="3.5" fill="#1a1a1a"/><circle cx="46" cy="30" r="3.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><circle cx="40" cy="46" r="22" fill="#27ae60"/><circle cx="40" cy="28" r="15" fill="#27ae60"/><circle cx="34" cy="26" r="4" fill="#f1c40f"/><circle cx="46" cy="26" r="4" fill="#f1c40f"/><circle cx="35" cy="26" r="2.5" fill="#1a1a1a"/><circle cx="47" cy="26" r="2.5" fill="#1a1a1a"/></svg>`,
  `<svg viewBox="0 0 80 80"><defs><linearGradient id="ugrd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f8b4d4"/><stop offset="50%" style="stop-color:#c8f135"/><stop offset="100%" style="stop-color:#35c8f1"/></linearGradient></defs><circle cx="40" cy="46" r="22" fill="url(#ugrd)"/><circle cx="40" cy="28" r="15" fill="url(#ugrd)"/><path d="M40,6 L36,22 L44,22Z" fill="#f1c835"/><circle cx="34" cy="26" r="3.5" fill="#1a1a1a"/><circle cx="46" cy="26" r="3.5" fill="#1a1a1a"/></svg>`
];

// ===== STATE =====
let currentUser = null;
let localDash = null;
let activeGoalIdx = null;
let viewMonth = null;
let habitFilter = 'all'; // 'all' | 'active'
let challengeFilter = 'all';
let currentSubTab = 'habit';

// ===== UTILITIES =====
function esc(s) { const d = document.createElement('div'); d.textContent = s||''; return d.innerHTML; }
function migrateGoal(g) { if (!g) return g; if (LEGACY_MAP[g.unit]) return Object.assign({}, g, LEGACY_MAP[g.unit]); return g; }
function getGoalFreq(g) {
  if (!g) return 1; g = migrateGoal(g);
  if (g.unit === 'once') return 0;
  if (g.unit === 'daily' || g.unit === 'health_sleep') return 7;
  if (g.unit === 'health_workout') return 2;
  return g.freq || 1;
}
function getUnitLabel(g) {
  if (!g) return ''; g = migrateGoal(g);
  if (g.unit === 'once') return '한 번';
  if (g.unit === 'daily') return '매일';
  if (g.unit === 'health_sleep') return '🌙 수면';
  if (g.unit === 'health_workout') return '💪 운동';
  if (g.unit === 'weekly') return `주 ${g.freq}회`;
  if (g.unit === 'biweekly') return `2주 ${g.freq}회`;
  return g.unit;
}
function getMonthDays(y, m) { return new Date(y, m, 0).getDate(); }
function getMonthWeeks(y, m) { return Math.ceil(getMonthDays(y, m) / 7); }
function goalModulus(g, gi, y, m) {
  if (!g || !g.unit || g.unit === 'once') return 1; g = migrateGoal(g);
  if (g.unit === 'daily' || g.unit === 'health_sleep') return getMonthDays(y, m);
  if (g.unit === 'health_workout') return 2 * getMonthWeeks(y, m);
  if (g.unit === 'weekly') return (g.freq || 1) * getMonthWeeks(y, m);
  if (g.unit === 'biweekly') return (g.freq || 1) * Math.ceil(getMonthDays(y, m) / 14);
  return 1;
}
function goalDone(g, gi, y, m) {
  if (!g || !g.unit) return 0;
  if (g.unit === 'once') return localDash.completions[`g${gi}_once`] === true ? 1 : 0;
  const pfx = `g${gi}_${y}_${m}_`;
  return Object.entries(localDash.completions).filter(([k, v]) => k.startsWith(pfx) && v === true).length;
}
function goalPct(g, gi, y, m) {
  const mod = goalModulus(g, gi, y, m), done = goalDone(g, gi, y, m);
  return { done, mod, pct: mod > 0 ? Math.round(done / mod * 100) : 0 };
}
function globalPct() {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1;
  let td = 0, tm = 0;
  getAllGoals().forEach((g, i) => { if (!g || !g.unit) return; const { done, mod } = goalPct(g, i, y, m); td += done; tm += mod; });
  return tm > 0 ? Math.round(td / tm * 100) : 0;
}
function getAllGoals() { const g = []; for (let i = 0; i < MAX_HABITS; i++) g.push(localDash.goals[i] || null); return g; }

// ===== STREAK =====
function calcStreak(g, gi) {
  if (!g || !g.unit || g.unit === 'once') return 0;
  g = migrateGoal(g);
  const now = new Date();
  if (g.unit === 'daily' || g.unit === 'health_sleep') {
    let streak = 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (localDash.completions[`g${gi}_${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}`] === true) streak++;
      else break;
    }
    return streak;
  }
  if (g.unit === 'weekly' || g.unit === 'health_workout') {
    const freq = g.unit === 'health_workout' ? 2 : (g.freq || 1);
    let streak = 0;
    const dow = now.getDay();
    const sun = new Date(now); sun.setDate(now.getDate() - dow);
    for (let w = 1; w <= 52; w++) {
      const ws = new Date(sun); ws.setDate(sun.getDate() - w * 7);
      let wd = 0;
      for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) wd++; }
      if (wd >= freq) streak++; else break;
    }
    let tw = 0;
    for (let d = 0; d < 7; d++) { const dd = new Date(sun); dd.setDate(sun.getDate() + d); if (dd > now) break; if (localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) tw++; }
    if (tw >= freq) streak++;
    return streak;
  }
  if (g.unit === 'biweekly') {
    const freq = g.freq || 1; let streak = 0;
    const dow = now.getDay();
    const sun = new Date(now); sun.setDate(now.getDate() - dow);
    for (let c = 1; c <= 26; c++) {
      const cs = new Date(sun); cs.setDate(sun.getDate() - c * 14);
      let cd = 0;
      for (let d = 0; d < 14; d++) { const dd = new Date(cs); dd.setDate(cs.getDate() + d); if (localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) cd++; }
      if (cd >= freq) streak++; else break;
    }
    return streak;
  }
  return 0;
}
function getStreakLabel(g, streak) {
  if (!g) return ''; g = migrateGoal(g);
  if (g.unit === 'daily' || g.unit === 'health_sleep') return `${streak}일째`;
  if (g.unit === 'weekly' || g.unit === 'health_workout') return `${streak}주째`;
  if (g.unit === 'biweekly') return `${streak}주기째`;
  return `${streak}`;
}
function isGoalActiveThisWeek(g, gi) {
  if (!g || !g.unit) return true; g = migrateGoal(g);
  if (g.unit === 'once') return localDash.completions[`g${gi}_once`] !== true;
  if (g.unit === 'daily' || g.unit === 'health_sleep' || g.unit === 'health_workout') return true;
  const freq = g.freq || 1, now = new Date(), dow = now.getDay();
  const ws = new Date(now); ws.setDate(now.getDate() - dow);
  if (g.unit === 'weekly') {
    let wd = 0;
    for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (dd > now) break; if (localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) wd++; }
    return wd < freq;
  }
  if (g.unit === 'biweekly') {
    let cd = 0; const cs = new Date(ws); cs.setDate(ws.getDate() - 7);
    for (let d = 0; d < 14; d++) { const dd = new Date(cs); dd.setDate(cs.getDate() + d); if (dd > now) break; if (localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) cd++; }
    return cd < freq;
  }
  return true;
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ===== DB =====
async function loadDash() {
  const snap = await get(ref(db, `dashboards/${currentUser.id}`));
  localDash = snap.exists() ? snap.val() : {};
  if (!localDash.goals) localDash.goals = [];
  if (!localDash.completions) localDash.completions = {};
  if (!localDash.challenges) localDash.challenges = [];
}
async function saveDash() { localDash.lastUpdate = new Date().toISOString(); await set(ref(db, `dashboards/${currentUser.id}`), localDash); }

// ===== INIT =====
async function init() {
  const saved = JSON.parse(localStorage.getItem('qb_login') || 'null');
  if (saved && saved.id && saved.pw) {
    showScreen('loadingScreen');
    try {
      const snap = await Promise.race([get(ref(db, `users/${saved.id}`)), new Promise((_, r) => setTimeout(() => r('timeout'), 5000))]);
      if (snap.exists() && snap.val().password === saved.pw) {
        const u = snap.val(); currentUser = { id: saved.id, ...u };
        document.getElementById('navUserName').textContent = u.name;
        if (u.role === 'admin') { clearTimeout(_safetyTimer); showScreen('adminScreen'); renderAdminList(); return; }
        await loadDash();
        if (!localDash.tutorialDone) { initTutorial(); showScreen('tutorialScreen'); }
        else { activeGoalIdx = null; viewMonth = null; showScreen('dashboardScreen'); await setupDashTabs(saved.id); renderDashboard(); }
        clearTimeout(_safetyTimer); return;
      }
    } catch (e) {}
  }
  clearTimeout(_safetyTimer);
  if (saved) { document.getElementById('loginId').value = saved.id || ''; document.getElementById('loginPw').value = saved.pw || ''; document.getElementById('saveLoginChk').checked = true; }
  showScreen('loginScreen');
}
init();

async function setupDashTabs(uid) {
  const snap = await get(ref(db, 'groups'));
  let has = false;
  if (snap.exists()) has = Object.values(snap.val()).some(g => g.members && Object.values(g.members).includes(uid));
  document.getElementById('dashTabBar').style.display = has ? 'flex' : 'none';
}

// ===== LOGIN =====
window.doLogin = async function () {
  const id = document.getElementById('loginId').value.trim(), pw = document.getElementById('loginPw').value;
  const btn = document.getElementById('loginBtn'), saveChk = document.getElementById('saveLoginChk').checked;
  if (!id || !pw) return; btn.disabled = true; btn.textContent = '확인 중...';
  try {
    const snap = await get(ref(db, `users/${id}`));
    if (!snap.exists() || snap.val().password !== pw) { document.getElementById('loginError').style.display = 'block'; }
    else {
      document.getElementById('loginError').style.display = 'none';
      if (saveChk) localStorage.setItem('qb_login', JSON.stringify({ id, pw })); else localStorage.removeItem('qb_login');
      const u = snap.val(); currentUser = { id, ...u };
      await set(ref(db, `users/${id}/lastLogin`), new Date().toISOString());
      if (u.role === 'admin') { showScreen('adminScreen'); renderAdminList(); }
      else {
        document.getElementById('navUserName').textContent = u.name;
        await loadDash();
        if (!localDash.tutorialDone) { initTutorial(); showScreen('tutorialScreen'); }
        else { activeGoalIdx = null; viewMonth = null; showScreen('dashboardScreen'); await setupDashTabs(id); renderDashboard(); }
      }
    }
  } catch (e) { showToast('❌ 연결 오류'); }
  btn.disabled = false; btn.textContent = '로그인';
};
['loginId', 'loginPw'].forEach(id => { document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); }); });

window.doLogout = function () {
  currentUser = null; localDash = null; activeGoalIdx = null;
  document.getElementById('loginId').value = ''; document.getElementById('loginPw').value = '';
  if (!document.getElementById('saveLoginChk').checked) localStorage.removeItem('qb_login');
  showScreen('loginScreen');
};

// ===== TAB =====
window.switchTab = function (tab) {
  document.getElementById('tabBtnMy').classList.toggle('active', tab === 'my');
  document.getElementById('tabBtnFriends').classList.toggle('active', tab === 'friends');
  document.getElementById('tabMy').classList.toggle('active', tab === 'my');
  document.getElementById('tabFriends').classList.toggle('active', tab === 'friends');
  if (tab === 'friends') renderFriends();
};

// ===== DASHBOARD =====
function renderDashboard() {
  const now = new Date();
  if (!viewMonth) viewMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  renderAvatar(); renderHabitCards(); renderChallengeCards(); loadNoticeBanner(); renderMainCheers();
}

function renderAvatar() {
  const p = globalPct(), stage = Math.min(9, Math.floor(p / 10));
  const artEl = document.getElementById('avatarArt');
  if (!artEl._hamsterInit) { artEl._hamsterInit = true; initHamsterAvatar(artEl); }
  document.getElementById('avatarStage').textContent = `${stage + 1}단계 · ${STAGE_NAMES[stage]}`;
  const nick = localDash.nickname || currentUser.name || '나의 캐릭터';
  const msg = localDash.msg || '좋은 습관 만드는 중';
  document.getElementById('avatarNicknameRow').innerHTML = `<div class="avatar-nickname">${esc(nick)}</div><button class="pencil-btn" onclick="startEditNickname()">✏️</button>`;
  document.getElementById('avatarMsgWrap').innerHTML = `<div class="avatar-msg">${esc(msg)}</div><button class="pencil-btn" onclick="startEditMsg()" style="flex-shrink:0;">✏️</button>`;
}

// ===== SUB TAB =====
window.switchSubTab = function (tab) {
  currentSubTab = tab;
  document.getElementById('subTabHabit').classList.toggle('active', tab === 'habit');
  document.getElementById('subTabChallenge').classList.toggle('active', tab === 'challenge');
  document.getElementById('panelHabit').classList.toggle('active', tab === 'habit');
  document.getElementById('panelChallenge').classList.toggle('active', tab === 'challenge');
};

// ===== HABIT FILTER =====
window.toggleHabitFilter = function () {
  habitFilter = habitFilter === 'all' ? 'active' : 'all';
  const pill = document.getElementById('habitFilterPill');
  pill.classList.toggle('active-filter', habitFilter === 'active');
  pill.innerHTML = (habitFilter === 'active' ? '진행 중' : '모든 목표') + ' <span class="filter-dot"></span>';
  renderHabitCards();
};
window.toggleChallengeFilter = function () {
  challengeFilter = challengeFilter === 'all' ? 'active' : 'all';
  const pill = document.getElementById('challengeFilterPill');
  pill.classList.toggle('active-filter', challengeFilter === 'active');
  pill.innerHTML = (challengeFilter === 'active' ? '진행 중' : '모든 목표') + ' <span class="filter-dot"></span>';
  renderChallengeCards();
};

// ===== HABIT CARDS (2-col grid) =====
function renderHabitCards() {
  const goals = getAllGoals(), now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const grid = document.getElementById('habitCardGrid');
  let valid = [];
  for (let i = 0; i < MAX_HABITS; i++) { if (goals[i] && goals[i].title && goals[i].unit) valid.push({ g: goals[i], idx: i }); }
  let filtered = habitFilter === 'active' ? valid.filter(({ g, idx }) => isGoalActiveThisWeek(g, idx)) : valid;
  document.getElementById('habitCount').textContent = valid.length;

  let html = '';
  filtered.forEach(({ g, idx }) => {
    const mg = migrateGoal(g), { pct } = goalPct(mg, idx, y, m);
    const streak = calcStreak(mg, idx), streakLbl = getStreakLabel(mg, streak);
    const todayKey = `g${idx}_${y}_${m}_${now.getDate()}`;
    const todayDone = localDash.completions[todayKey] === true;
    const isOnce = mg.unit === 'once';
    const isCompleted = pct >= 100;
    const isOver = pct > 100;
    const isDone = todayDone || (isOnce && localDash.completions[`g${idx}_once`]);
    html += `<div class="habit-card-outer" id="hcOuter_${idx}">
      <div class="habit-card-swipe-bg-left todo"><div class="swipe-bg-text">✓ 완료</div></div>
      <div class="habit-card-swipe-bg-right done"><div class="swipe-bg-text">↩ 취소</div></div>
      <div class="habit-card ${isCompleted ? 'completed' : ''}" id="hc_${idx}" data-idx="${idx}" data-once="${isOnce ? 1 : 0}" data-done="${isDone ? 1 : 0}">
        <div>
          <div class="habit-card-title">${esc(g.title)}</div>
          <div class="habit-card-mid">
            <div class="habit-card-unit">${getUnitLabel(mg)}</div>
            <div class="habit-card-streak ${streak > 0 ? '' : 'zero'}">
              <span class="fire">🔥</span><span class="streak-num">${streakLbl}</span>
            </div>
          </div>
        </div>
        <div class="habit-card-bot">
          <div class="habit-card-bar"><div class="habit-card-bar-fill ${isOver ? 'over100' : ''}" style="width:${Math.min(pct, 100)}%"></div></div>
          <div class="habit-card-pct">${pct}%</div>
        </div>
      </div>
    </div>`;
  });
  // 추가 버튼 (9개까지)
  if (valid.length < MAX_HABITS) html += `<div class="grid-add-btn" onclick="openAddHabitSheet()">＋</div>`;
  grid.innerHTML = html;
  document.getElementById('habitSwipeHint').style.display = filtered.length > 0 ? 'block' : 'none';
  filtered.forEach(({ idx }) => initHabitSwipe(idx));
}

// ===== HABIT SWIPE (touch only, bidirectional) =====
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function initHabitSwipe(idx) {
  const card = document.getElementById(`hc_${idx}`);
  if (!card) return;

  // PC: 클릭만 (바텀시트 열기)
  if (!isTouchDevice) {
    card.addEventListener('click', () => openGoalBottomSheet(idx));
    card.style.cursor = 'pointer';
    return;
  }

  // Mobile: 터치 스와이프
  let sx = 0, sy = 0, dx = 0, swiping = false, locked = false;
  const TH = 60;

  function onS(e) {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; dx = 0; swiping = false; locked = false;
    card.classList.remove('snapping');
  }
  function onM(e) {
    if (locked) return;
    const t = e.touches[0];
    const dX = t.clientX - sx, dY = t.clientY - sy;
    if (!swiping && Math.abs(dY) > Math.abs(dX)) { locked = true; return; }
    if (Math.abs(dX) > 8) swiping = true;
    if (!swiping) return;
    e.preventDefault();
    dx = dX;
    card.classList.add('swiping');
    card.style.transform = `translateX(${dx}px)`;
  }
  function onE() {
    if (!swiping) {
      card.style.transform = '';
      card.classList.remove('swiping');
      openGoalBottomSheet(idx);
      return;
    }
    card.classList.remove('swiping');
    card.classList.add('snapping');
    const isDone = card.dataset.done === '1';

    if (dx >= TH && !isDone) {
      // 오른쪽 스와이프 → 완료 (미완료 상태일 때만)
      card.style.transform = `translateX(${window.innerWidth}px)`;
      setTimeout(() => habitMarkDone(idx), 250);
    } else if (dx <= -TH && isDone) {
      // 왼쪽 스와이프 → 취소 (완료 상태일 때만)
      card.style.transform = `translateX(${-window.innerWidth}px)`;
      setTimeout(() => habitMarkUndo(idx), 250);
    } else {
      card.style.transform = 'translateX(0)';
    }
    dx = 0; swiping = false;
  }

  card.addEventListener('touchstart', onS, { passive: true });
  card.addEventListener('touchmove', onM, { passive: false });
  card.addEventListener('touchend', onE);
}

async function habitMarkDone(idx) {
  const now = new Date();
  const g = migrateGoal(localDash.goals[idx]);
  const isOnce = g && g.unit === 'once';
  const k = isOnce ? `g${idx}_once` : `g${idx}_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}`;
  localDash.completions[k] = true;
  await saveDash();
  showToast('🎉 완료!', 'done'); showConfettiSmall();
  if (!isOnce) checkWeekClear(idx);
  renderHabitCards(); renderAvatar();
}

async function habitMarkUndo(idx) {
  const now = new Date();
  const g = migrateGoal(localDash.goals[idx]);
  const isOnce = g && g.unit === 'once';
  const k = isOnce ? `g${idx}_once` : `g${idx}_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}`;
  localDash.completions[k] = false;
  await saveDash();
  showToast('↩️ 해제', 'undo');
  renderHabitCards(); renderAvatar();
}

// ===== CHALLENGE CARDS (2-col grid) =====
function renderChallengeCards() {
  const challenges = localDash.challenges || [];
  const grid = document.getElementById('challengeCardGrid');
  let valid = [];
  for (let i = 0; i < challenges.length; i++) { if (challenges[i] && challenges[i].title) valid.push({ c: challenges[i], idx: i }); }
  let filtered = valid;
  if (challengeFilter === 'active') filtered = valid.filter(({ c }) => !isChallengeComplete(c));
  document.getElementById('challengeCount').textContent = valid.length;

  let html = '';
  filtered.forEach(({ c, idx }) => {
    if (c.type === 'bucket') {
      const done = c.done === true;
      html += `<div class="challenge-card-outer" id="ccOuter_${idx}">
        <div class="challenge-swipe-bg ${done ? 'done' : 'todo'}">
          <div class="swipe-bg-text">${done ? '↩ 해제' : '✓ 완료'}</div>
        </div>
        <div class="challenge-card type-bucket ${done ? 'bucket-done swiping-target' : ''}" id="cc_${idx}" data-idx="${idx}">
          <div>
            <div class="challenge-card-title">${esc(c.title)}</div>
            <span class="challenge-card-type bucket">버킷리스트</span>
          </div>
          ${done ? '<div><span class="challenge-card-sparkle">✨</span><div class="challenge-card-achieve">내 인생의 성취</div></div>' : '<div></div>'}
        </div>
      </div>`;
    } else {
      // project
      const { done, total, pct } = getProjectProgress(c);
      html += `<div class="challenge-card type-project" id="cc_${idx}" data-idx="${idx}" onclick="openProjectDetail(${idx})">
        <div>
          <div class="challenge-card-title">${esc(c.title)}</div>
          <span class="challenge-card-type project">프로젝트</span>
          <div class="challenge-card-progress">${done}/${total} 단계</div>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="challenge-card-bar" style="flex:1;"><div class="challenge-card-bar-fill project" style="width:${Math.min(pct,100)}%"></div></div>
            <div class="challenge-card-pct project">${pct}%</div>
          </div>
        </div>
      </div>`;
    }
  });
  if (valid.length < MAX_CHALLENGES) html += `<div class="grid-add-btn" onclick="openAddChallengeSheet()">＋</div>`;
  grid.innerHTML = html;
  // init bucket swipe
  filtered.forEach(({ c, idx }) => { if (c.type === 'bucket') initBucketSwipe(idx); });
}

function isChallengeComplete(c) {
  if (c.type === 'bucket') return c.done === true;
  if (c.type === 'project') { const { pct } = getProjectProgress(c); return pct >= 100; }
  return false;
}
function getProjectProgress(c) {
  if (!c.stages) return { done: 0, total: 0, pct: 0 };
  let total = 0, done = 0;
  c.stages.forEach(s => { (s.tasks || []).forEach(t => { total++; if (t.done) done++; }); });
  return { done, total, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

// ===== BUCKET SWIPE =====
function initBucketSwipe(idx) {
  const card = document.getElementById(`cc_${idx}`);
  if (!card) return;

  // PC: no action on click for bucket (just visual)
  if (!isTouchDevice) {
    card.style.cursor = 'default';
    return;
  }

  let sx = 0, sy = 0, dx = 0, swiping = false, locked = false;
  const TH = 60;
  function onS(e) { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; swiping = false; locked = false; card.classList.remove('snapping'); }
  function onM(e) {
    if (locked) return; const t = e.touches[0];
    const dX = t.clientX - sx, dY = t.clientY - sy;
    if (!swiping && Math.abs(dY) > Math.abs(dX)) { locked = true; return; }
    if (Math.abs(dX) > 8) swiping = true;
    if (!swiping) return; e.preventDefault();
    const isDone = localDash.challenges[idx]?.done === true;
    // 완료 안됨 → 오른쪽만, 완료됨 → 왼쪽만
    if (!isDone) dx = Math.max(0, dX);
    else dx = Math.min(0, dX);
    card.classList.add('swiping'); card.style.transform = `translateX(${dx}px)`;
  }
  function onE() {
    card.classList.remove('swiping'); card.classList.add('snapping');
    if (Math.abs(dx) >= TH) { card.style.transform = `translateX(${dx > 0 ? window.innerWidth : -window.innerWidth}px)`; setTimeout(() => swipeBucket(idx), 250); }
    else { card.style.transform = 'translateX(0)'; }
    dx = 0; swiping = false;
  }
  card.addEventListener('touchstart', onS, { passive: true });
  card.addEventListener('touchmove', onM, { passive: false });
  card.addEventListener('touchend', onE);
}
async function swipeBucket(idx) {
  const c = localDash.challenges[idx];
  if (!c) return;
  const wasDone = c.done === true;
  localDash.challenges[idx].done = !wasDone;
  await saveDash();
  if (!wasDone) { showToast('🎉 버킷리스트 달성!', 'done'); showConfetti(); }
  else { showToast('↩️ 해제', 'undo'); }
  renderChallengeCards();
}

// ===== ADD CHALLENGE BOTTOM SHEET =====
window.openAddChallengeSheet = function () {
  document.getElementById('bsTitle').textContent = '새로운 도전 만들기';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:14px;">유형을 먼저 선택해 주세요</div>`;
  h += `<div class="challenge-type-grid">
    <div class="challenge-type-card" id="ctBucket" onclick="selectChallengeType('bucket')">
      <span class="challenge-type-icon">⭐</span>
      <div class="challenge-type-name">버킷리스트</div>
      <div class="challenge-type-desc">한 번의 실천으로<br>완료되는 꿈</div>
    </div>
    <div class="challenge-type-card" id="ctProject" onclick="selectChallengeType('project')">
      <span class="challenge-type-icon">🗺️</span>
      <div class="challenge-type-name">프로젝트</div>
      <div class="challenge-type-desc">단계별 로드맵이<br>필요한 목표</div>
    </div>
  </div>`;
  h += `<div id="challengeFormArea"></div>`;
  document.getElementById('bsBody').innerHTML = h;
  openBS();
};

let _challengeType = null;
window.selectChallengeType = function (type) {
  _challengeType = type;
  document.getElementById('ctBucket').classList.toggle('selected', type === 'bucket');
  document.getElementById('ctProject').classList.toggle('selected', type === 'project');
  const area = document.getElementById('challengeFormArea');
  if (type === 'bucket') {
    area.innerHTML = `<div style="margin-top:4px;">
      <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>
      <input class="proj-edit-input" id="bucketNameInput" placeholder="어떤 도전을 시작하시나요?" maxlength="30">
      <button class="unit-confirm-btn" style="margin-top:12px;" onclick="saveBucket()">도전 시작하기</button>
    </div>`;
    setTimeout(() => document.getElementById('bucketNameInput')?.focus(), 200);
  } else {
    area.innerHTML = `<div style="margin-top:4px;">
      <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>
      <input class="proj-edit-input" id="projNameInput" placeholder="어떤 도전을 시작하시나요?" maxlength="30">
      <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">나의 궁극적인 목적 (WHY)</div>
      <textarea class="proj-edit-input proj-edit-textarea" id="projWhyInput" placeholder="이 도전을 완료했을 때의 내 모습을 상상하며 적어보세요." maxlength="100"></textarea>
      <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">첫 번째 단계 설정</div>
      <div class="proj-edit-stage-box">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div class="proj-stage-num">1</div>
          <input class="proj-edit-task-input" id="projStage1Name" placeholder="첫 번째 단계의 이름을 적으세요" style="flex:1;">
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);text-align:center;margin-bottom:12px;">세부 계획은 도전 생성 후 상시 추가 가능합니다.</div>
      <button class="unit-confirm-btn" onclick="saveProject()">도전 시작하기</button>
    </div>`;
    setTimeout(() => document.getElementById('projNameInput')?.focus(), 200);
  }
};

window.saveBucket = async function () {
  const name = document.getElementById('bucketNameInput').value.trim();
  if (!name) return;
  if (!localDash.challenges) localDash.challenges = [];
  localDash.challenges.push({ type: 'bucket', title: name, done: false, createdAt: new Date().toISOString() });
  await saveDash();
  closeBottomSheet(); renderChallengeCards();
  showToast('⭐ 도전 등록!', 'done');
};

window.saveProject = async function () {
  const name = document.getElementById('projNameInput').value.trim();
  if (!name) return;
  const why = document.getElementById('projWhyInput').value.trim();
  const stage1 = document.getElementById('projStage1Name').value.trim() || '단계 1';
  if (!localDash.challenges) localDash.challenges = [];
  localDash.challenges.push({
    type: 'project', title: name, why: why, createdAt: new Date().toISOString(),
    stages: [{ name: stage1, tasks: [] }]
  });
  await saveDash();
  closeBottomSheet(); renderChallengeCards();
  showToast('🗺️ 프로젝트 시작!', 'done');
};

// ===== PROJECT DETAIL BOTTOM SHEET =====
window.openProjectDetail = function (idx) {
  const c = localDash.challenges[idx];
  if (!c || c.type !== 'project') return;
  activeGoalIdx = idx;
  document.getElementById('bsTitle').textContent = c.title;
  renderProjectDetail(idx);
  openBS();
};

function renderProjectDetail(idx) {
  const c = localDash.challenges[idx], body = document.getElementById('bsBody');
  const { done, total, pct } = getProjectProgress(c);
  let h = `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin-bottom:8px;">프로젝트 분석</div>`;
  // WHY box
  if (c.why) {
    h += `<div class="proj-why-box"><span class="proj-why-label">나의 목적</span><div class="proj-why-text">"${esc(c.why)}"</div></div>`;
  }
  // Stages
  (c.stages || []).forEach((s, si) => {
    const stageTasks = s.tasks || [];
    const stageDone = stageTasks.filter(t => t.done).length;
    const allDone = stageTasks.length > 0 && stageDone === stageTasks.length;
    h += `<div class="proj-stage"><div class="proj-stage-hdr"><div class="proj-stage-num ${allDone ? 'done' : ''}">${si + 1}</div><div class="proj-stage-title">${esc(s.name)}</div></div><div class="proj-task-list">`;
    stageTasks.forEach((t, ti) => {
      h += `<div class="proj-task ${t.done ? 'task-done' : ''}" onclick="toggleProjectTask(${idx},${si},${ti})"><div class="proj-task-check">${t.done ? '✓' : ''}</div><div class="proj-task-text">${esc(t.name)}</div></div>`;
    });
    h += `</div></div>`;
  });
  // Progress summary
  h += `<div style="display:flex;align-items:center;gap:8px;padding:12px 0;"><div style="flex:1;height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;"><div style="height:100%;width:${Math.min(pct,100)}%;background:linear-gradient(90deg,#60a5fa,#6366f1);border-radius:100px;"></div></div><span style="font-family:'Black Han Sans';font-size:16px;color:var(--accent);">${pct}%</span></div>`;
  // Edit & Delete buttons
  h += `<button class="proj-edit-btn" onclick="openProjectEdit(${idx})">✏️ 수정</button>`;
  h += `<button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteChallenge(${idx})">🗑 삭제</button>`;
  body.innerHTML = h;
}

window.toggleProjectTask = async function (cIdx, sIdx, tIdx) {
  const task = localDash.challenges[cIdx].stages[sIdx].tasks[tIdx];
  task.done = !task.done;
  await saveDash();
  renderProjectDetail(cIdx);
  renderChallengeCards();
  if (task.done) showConfettiSmall();
};

// ===== PROJECT EDIT MODE =====
window.openProjectEdit = function (idx) {
  const c = localDash.challenges[idx], body = document.getElementById('bsBody');
  document.getElementById('bsTitle').textContent = '프로젝트 수정';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>`;
  h += `<input class="proj-edit-input" id="peTitle" value="${esc(c.title)}" maxlength="30">`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">나의 궁극적인 목적 (WHY)</div>`;
  h += `<textarea class="proj-edit-input proj-edit-textarea" id="peWhy" maxlength="100">${esc(c.why || '')}</textarea>`;
  // Stages
  (c.stages || []).forEach((s, si) => {
    h += `<div class="proj-edit-stage-box" id="peStage_${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="proj-stage-num">${si + 1}</div>
        <input class="proj-edit-task-input" id="peStageName_${si}" value="${esc(s.name)}" placeholder="단계 이름" style="flex:1;">
        <button class="proj-edit-task-del" onclick="removeEditStage(${si})" title="단계 삭제">✕</button>
      </div>`;
    (s.tasks || []).forEach((t, ti) => {
      h += `<div class="proj-edit-task-row"><input class="proj-edit-task-input" id="peTask_${si}_${ti}" value="${esc(t.name)}" placeholder="세부 항목"><button class="proj-edit-task-del" onclick="removeEditTask(${si},${ti})">✕</button></div>`;
    });
    h += `<button class="proj-add-task-btn" onclick="addEditTask(${si})">+ 세부 항목 추가</button></div>`;
  });
  h += `<button class="proj-add-stage-btn" onclick="addEditStage()">+ 새 단계 추가</button>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="cancelProjectEdit(${idx})">취소</button><button class="proj-save-btn save" onclick="saveProjectEdit(${idx})">저장</button></div>`;
  body.innerHTML = h;
};

// Edit helpers - rebuild HTML each time for simplicity
let _editStages = [];
function getEditStagesFromDOM() {
  const stages = [];
  let si = 0;
  while (document.getElementById(`peStageName_${si}`)) {
    const name = document.getElementById(`peStageName_${si}`).value;
    const tasks = [];
    let ti = 0;
    while (document.getElementById(`peTask_${si}_${ti}`)) {
      tasks.push({ name: document.getElementById(`peTask_${si}_${ti}`).value, done: false });
      ti++;
    }
    stages.push({ name, tasks });
    si++;
  }
  return stages;
}

window.addEditTask = function (si) {
  // Save current state then re-render
  const c = { ...localDash.challenges[activeGoalIdx] };
  const stages = getEditStagesFromDOM();
  stages[si].tasks.push({ name: '', done: false });
  // Preserve done states from original
  const orig = localDash.challenges[activeGoalIdx].stages || [];
  stages.forEach((s, i) => {
    s.tasks.forEach((t, j) => {
      if (orig[i] && orig[i].tasks && orig[i].tasks[j]) t.done = orig[i].tasks[j].done;
    });
  });
  _editStages = stages;
  rebuildEditUI();
};
window.removeEditTask = function (si, ti) {
  const stages = getEditStagesFromDOM();
  stages[si].tasks.splice(ti, 1);
  _editStages = stages;
  rebuildEditUI();
};
window.addEditStage = function () {
  const stages = getEditStagesFromDOM();
  stages.push({ name: '', tasks: [] });
  _editStages = stages;
  rebuildEditUI();
};
window.removeEditStage = function (si) {
  const stages = getEditStagesFromDOM();
  stages.splice(si, 1);
  _editStages = stages;
  rebuildEditUI();
};

function rebuildEditUI() {
  const c = localDash.challenges[activeGoalIdx];
  const title = document.getElementById('peTitle')?.value || c.title;
  const why = document.getElementById('peWhy')?.value || c.why || '';
  const stages = _editStages;
  const body = document.getElementById('bsBody');
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>`;
  h += `<input class="proj-edit-input" id="peTitle" value="${esc(title)}" maxlength="30">`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">나의 궁극적인 목적 (WHY)</div>`;
  h += `<textarea class="proj-edit-input proj-edit-textarea" id="peWhy" maxlength="100">${esc(why)}</textarea>`;
  stages.forEach((s, si) => {
    h += `<div class="proj-edit-stage-box" id="peStage_${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="proj-stage-num">${si + 1}</div>
        <input class="proj-edit-task-input" id="peStageName_${si}" value="${esc(s.name)}" placeholder="단계 이름" style="flex:1;">
        <button class="proj-edit-task-del" onclick="removeEditStage(${si})">✕</button>
      </div>`;
    (s.tasks || []).forEach((t, ti) => {
      h += `<div class="proj-edit-task-row"><input class="proj-edit-task-input" id="peTask_${si}_${ti}" value="${esc(t.name)}" placeholder="세부 항목"><button class="proj-edit-task-del" onclick="removeEditTask(${si},${ti})">✕</button></div>`;
    });
    h += `<button class="proj-add-task-btn" onclick="addEditTask(${si})">+ 세부 항목 추가</button></div>`;
  });
  h += `<button class="proj-add-stage-btn" onclick="addEditStage()">+ 새 단계 추가</button>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="cancelProjectEdit(${activeGoalIdx})">취소</button><button class="proj-save-btn save" onclick="saveProjectEdit(${activeGoalIdx})">저장</button></div>`;
  body.innerHTML = h;
}

window.cancelProjectEdit = function (idx) {
  _editStages = [];
  document.getElementById('bsTitle').textContent = localDash.challenges[idx].title;
  renderProjectDetail(idx);
};

window.saveProjectEdit = async function (idx) {
  const title = document.getElementById('peTitle').value.trim();
  if (!title) { showToast('이름을 입력하세요', 'normal'); return; }
  const why = document.getElementById('peWhy').value.trim();
  const stages = getEditStagesFromDOM();
  // Preserve done states
  const orig = localDash.challenges[idx].stages || [];
  stages.forEach((s, i) => {
    s.tasks.forEach((t, j) => {
      if (orig[i] && orig[i].tasks && orig[i].tasks[j]) t.done = orig[i].tasks[j].done;
      if (!t.name.trim()) t.name = '항목';
    });
    if (!s.name.trim()) s.name = `단계 ${i + 1}`;
  });
  localDash.challenges[idx] = { ...localDash.challenges[idx], title, why, stages };
  await saveDash();
  _editStages = [];
  document.getElementById('bsTitle').textContent = title;
  renderProjectDetail(idx);
  renderChallengeCards();
  showToast('✅ 저장 완료!', 'done');
};

window.deleteChallenge = async function (idx) {
  if (!confirm('이 도전을 삭제할까요?')) return;
  localDash.challenges.splice(idx, 1);
  await saveDash();
  closeBottomSheet(); renderChallengeCards();
  showToast('🗑 삭제됨', 'normal');
};

// ===== ADD HABIT =====
window.openAddHabitSheet = function () {
  document.getElementById('bsTitle').textContent = '습관 추가';
  document.getElementById('bsBody').innerHTML = `<div><input class="proj-edit-input" id="newGoalInput" placeholder="습관 이름 입력 (예: 매일 독서 20분)" maxlength="20"><button class="unit-confirm-btn" onclick="confirmAddGoal()">다음 →</button></div>`;
  openBS();
  setTimeout(() => document.getElementById('newGoalInput')?.focus(), 400);
};

// ===== NICKNAME / MSG EDIT =====
window.startEditNickname = function () {
  const row = document.getElementById('avatarNicknameRow');
  const cur = localDash.nickname || currentUser.name || '';
  row.innerHTML = `<div class="nickname-edit-row"><input class="nickname-input" id="nickInput" value="${esc(cur)}" maxlength="10" placeholder="닉네임"><button class="nickname-save-btn" onclick="saveNickname()">저장</button></div>`;
  document.getElementById('nickInput').focus();
};
window.saveNickname = async function () {
  const v = document.getElementById('nickInput').value.trim();
  if (v) { localDash.nickname = v; await saveDash(); }
  renderAvatar();
};
window.startEditMsg = function () {
  const wrap = document.getElementById('avatarMsgWrap');
  const cur = localDash.msg || '';
  wrap.innerHTML = `<div class="nickname-edit-row"><input class="nickname-input" id="msgInput" value="${esc(cur)}" maxlength="30" placeholder="상태 메시지"><button class="nickname-save-btn" onclick="saveMsg()">저장</button></div>`;
  document.getElementById('msgInput').focus();
};
window.saveMsg = async function () {
  const v = document.getElementById('msgInput').value.trim();
  if (v) { localDash.msg = v; await saveDash(); }
  renderAvatar();
};

// (habit filter and cards handled above)

function checkWeekClear(idx) {
  const g = migrateGoal(localDash.goals[idx]);
  if (!g || !g.unit || g.unit === 'once') return;
  const freq = getGoalFreq(g), now = new Date(), dow = now.getDay();
  const ws = new Date(now); ws.setDate(now.getDate() - dow);
  let wd = 0;
  for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (dd > now) break; if (localDash.completions[`g${idx}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) wd++; }
  if (wd === freq) setTimeout(() => { showConfetti(); shakeScreen(); const p = document.getElementById('weekClearPopup'); p.classList.add('show'); setTimeout(() => p.classList.remove('show'), 2800); }, 300);
}

// ===== BOTTOM SHEET =====
window.openGoalBottomSheet = function (idx) {
  const g = getAllGoals()[idx];
  if (!g) { openAddGoalSheet(); return; }
  if (!g.unit) { openUnitSetupSheet(idx); return; }
  activeGoalIdx = idx;
  viewMonth = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  document.getElementById('bsTitle').textContent = g.title;
  renderBSBody(idx);
  openBS();
};

function openBS() { document.getElementById('bsOverlay').classList.add('open'); document.getElementById('bottomSheet').classList.add('open'); }
window.closeBottomSheet = function () { document.getElementById('bsOverlay').classList.remove('open'); document.getElementById('bottomSheet').classList.remove('open'); };

function renderBSBody(idx) {
  const g = migrateGoal(localDash.goals[idx]), body = document.getElementById('bsBody');
  if (g.unit === 'once') { renderBSOnce(idx, body); return; }
  const y = viewMonth.year, m = viewMonth.month, now = new Date();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const isPrevMonth = (y === now.getFullYear() && m === now.getMonth()) || (now.getMonth() === 0 && y === now.getFullYear() - 1 && m === 12);
  const canEdit = isCurrentMonth || isPrevMonth;
  const { done, mod, pct } = goalPct(g, idx, y, m);

  // 월 네비게이션 + 달력 + 통계
  let html = `<div class="bs-cal-meta"><span class="bs-cal-unit">${getUnitLabel(g)}</span></div>`;
  html += `<div class="month-nav"><button class="month-nav-btn" onclick="bsMonthPrev()">‹</button><div class="month-label">${y}년 ${m}월</div>`;
  const isFutureBlocked = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  html += `<button class="month-nav-btn" ${isFutureBlocked ? 'disabled' : ''} onclick="bsMonthNext()">›</button></div>`;
  html += renderCalendar(idx, g, y, m, canEdit);
  // 월별 요약
  html += `<div style="margin-top:12px;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-radius:12px;"><span style="font-size:13px;color:var(--text-dim);font-weight:700;">이번 달</span><div style="flex:1;height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${Math.min(pct,100)}%;background:linear-gradient(90deg,#1952f5,#a78bfa);border-radius:4px;"></div></div><span style="font-family:'Black Han Sans';font-size:16px;color:var(--accent);">${pct}%</span></div>`;
  // 주간 현황
  if (isCurrentMonth && (g.unit === 'weekly' || g.unit === 'biweekly' || g.unit === 'health_workout')) {
    const freq = getGoalFreq(g), dow = now.getDay();
    const ws = new Date(now); ws.setDate(now.getDate() - dow);
    let wd = 0;
    for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (dd > now) break; if (localDash.completions[`g${idx}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`] === true) wd++; }
    const cleared = wd >= freq;
    html += `<div class="week-info-card ${cleared ? 'week-info-clear' : ''}"><span class="week-info-icon">${cleared ? '🏆' : '📅'}</span><div class="week-info-body"><span class="week-info-main">${wd}/${freq} 완료</span><span class="week-info-cheer">${cleared ? '이번 주 달성 완료!' : `${freq - wd}회 더 해보세요`}</span></div></div>`;
  }
  // 6개월 통계
  html += renderStats6Month(idx, g);
  body.innerHTML = html;
}

function renderCalendar(idx, g, y, m, canEdit) {
  const now = new Date(), days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  let h = `<div class="cal-day-row">`;
  ['일', '월', '화', '수', '목', '금', '토'].forEach(d => h += `<div class="cal-day-lbl">${d}</div>`);
  h += `</div><div class="cal-grid">`;
  for (let i = 0; i < fd; i++) h += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const k = `g${idx}_${y}_${m}_${d}`, isDone = localDash.completions[k] === true;
    const isToday = isCurrentMonth && d === now.getDate();
    const isFuture = isCurrentMonth && d > now.getDate();
    const locked = !canEdit || isFuture;
    h += `<div class="cal-cell ${isDone ? 'done' : ''} ${isToday ? 'cal-today' : ''} ${locked ? 'locked' : ''}" onclick="${locked ? '' : `bsToggleDay(${idx},${y},${m},${d})`}"><span class="cal-dn">${d}</span><span class="cal-chk">${isDone ? '✓' : ''}</span></div>`;
  }
  h += `</div>`;
  return h;
}

window.bsMonthPrev = function () { viewMonth.month--; if (viewMonth.month < 1) { viewMonth.month = 12; viewMonth.year--; } renderBSBody(activeGoalIdx); };
window.bsMonthNext = function () { viewMonth.month++; if (viewMonth.month > 12) { viewMonth.month = 1; viewMonth.year++; } renderBSBody(activeGoalIdx); };

window.bsToggleDay = async function (idx, y, m, d) {
  const k = `g${idx}_${y}_${m}_${d}`;
  localDash.completions[k] = localDash.completions[k] !== true;
  await saveDash();
  renderBSBody(idx); renderHabitCards(); renderAvatar();
  if (localDash.completions[k]) { showToast('✓ 체크!', 'done'); checkWeekClear(idx); }
};

function renderBSOnce(idx, body) {
  const done = localDash.completions[`g${idx}_once`] === true;
  body.innerHTML = `<div style="text-align:center;padding:40px 0;">
    <div style="font-size:14px;color:var(--text-dim);margin-bottom:24px;">한 번 달성 목표</div>
    <button style="background:#fff;border:3px solid ${done ? 'var(--accent)' : 'var(--border)'};border-radius:50%;width:80px;height:80px;font-size:30px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;" onclick="bsToggleOnce(${idx})">${done ? '✅' : '⭕'}</button>
    ${done ? '<div style="margin-top:12px;font-family:Black Han Sans;font-size:15px;color:var(--accent);">달성 완료!</div>' : ''}
  </div>${renderStats6Month(idx, migrateGoal(localDash.goals[idx]))}`;
}

window.bsToggleOnce = async function (idx) {
  const k = `g${idx}_once`; localDash.completions[k] = localDash.completions[k] !== true;
  await saveDash(); renderBSBody(idx); renderHabitCards(); renderAvatar();
};

// ===== 6개월 통계 =====
function renderStats6Month(idx, g) {
  const now = new Date(); let months = [];
  for (let i = 5; i >= 0; i--) { let mm = now.getMonth() + 1 - i, yy = now.getFullYear(); while (mm < 1) { mm += 12; yy--; } months.push({ y: yy, m: mm }); }
  const pcts = months.map(({ y, m }) => goalPct(g, idx, y, m).pct);
  const maxPct = Math.max(...pcts, 1);
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);

  let h = `<div class="stats-section"><div class="stats-title">📊 6개월 추이</div><div class="stats-chart">`;
  h += `<div class="stats-avg-line" style="bottom:${Math.min(avg / maxPct * 160, 160)}px;"></div>`;
  months.forEach(({ y, m }, i) => {
    const p = pcts[i], barH = maxPct > 0 ? Math.max(4, p / maxPct * 160) : 4;
    const isCur = y === now.getFullYear() && m === now.getMonth() + 1;
    h += `<div class="stats-bar-wrap"><div class="stats-bar-col"><div class="stats-bar ${isCur ? 'current-month' : 'past'}" style="height:${barH}px;"><span class="stats-bar-pct">${p}%</span></div></div><div class="stats-bar-lbl ${isCur ? 'current' : ''}">${m}월</div></div>`;
  });
  h += `</div>`;
  // 인사이트
  const curPct = pcts[5], prevPct = pcts[4], diff = curPct - prevPct;
  h += `<div class="stats-insight">`;
  h += `<div class="stats-insight-row"><span class="stats-insight-icon">📈</span><span class="stats-insight-text">6개월 평균 <strong>${avg}%</strong></span></div>`;
  if (diff > 0) h += `<div class="stats-insight-row"><span class="stats-insight-icon">🔥</span><span class="stats-insight-text">지난달보다 <strong>+${diff}%p</strong> 상승!</span></div>`;
  else if (diff < 0) h += `<div class="stats-insight-row"><span class="stats-insight-icon">💪</span><span class="stats-insight-text">지난달보다 <strong>${diff}%p</strong> — 다시 힘내요!</span></div>`;
  h += `</div></div>`;
  return h;
}

// ===== ADD HABIT (continued) =====
window.confirmAddGoal = async function () {
  const v = document.getElementById('newGoalInput').value.trim();
  if (!v) return;
  let slot = -1;
  for (let i = 0; i < MAX_HABITS; i++) { if (!localDash.goals[i] || !localDash.goals[i].title) { slot = i; break; } }
  if (slot === -1) { showToast('습관 최대 10개!', 'normal'); return; }
  localDash.goals[slot] = { title: v };
  await saveDash();
  openUnitSetupSheet(slot);
};

function openUnitSetupSheet(idx) {
  document.getElementById('bsTitle').textContent = '단위 설정';
  const opts = [
    { label: '매일', val: 'daily' }, { label: '한 번', val: 'once' },
    { label: '주 1회', val: 'w1' }, { label: '주 2회', val: 'w2' },
    { label: '주 3회', val: 'w3' }, { label: '주 4회', val: 'w4' },
    { label: '주 5회', val: 'w5' }, { label: '주 6회', val: 'w6' },
    { label: '2주 3회', val: 'bw3' }, { label: '2주 5회', val: 'bw5' },
  ];
  let h = `<div style="font-size:14px;font-weight:700;margin-bottom:6px;color:var(--text);">${esc(localDash.goals[idx].title)}</div><div style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">얼마나 자주 수행할 건가요?</div><div class="unit-opts">`;
  opts.forEach(o => h += `<div class="unit-opt" onclick="selectUnit(${idx},'${o.val}')" id="uopt_${o.val}">${o.label}</div>`);
  h += `</div><button class="unit-confirm-btn" id="unitConfirmBtn" onclick="confirmUnit(${idx})" disabled>확인</button>`;
  h += `<div style="margin-top:12px;"><button style="width:100%;background:transparent;border:2px solid var(--danger);border-radius:10px;padding:11px;font-size:13px;font-weight:700;color:var(--danger);cursor:pointer;font-family:'Noto Sans KR',sans-serif;" onclick="deleteGoal(${idx})">🗑 목표 삭제</button></div>`;
  document.getElementById('bsBody').innerHTML = h;
}
let _selUnit = null;
window.selectUnit = function (idx, val) {
  _selUnit = val;
  document.querySelectorAll('.unit-opt').forEach(e => e.classList.remove('selected'));
  document.getElementById(`uopt_${val}`)?.classList.add('selected');
  document.getElementById('unitConfirmBtn').disabled = false;
};
window.confirmUnit = async function (idx) {
  if (!_selUnit) return;
  let unit, freq;
  if (_selUnit === 'daily') { unit = 'daily'; freq = 0; }
  else if (_selUnit === 'once') { unit = 'once'; freq = 0; }
  else if (_selUnit.startsWith('bw')) { unit = 'biweekly'; freq = parseInt(_selUnit.slice(2)); }
  else { unit = 'weekly'; freq = parseInt(_selUnit.slice(1)); }
  localDash.goals[idx] = { ...localDash.goals[idx], unit, freq };
  await saveDash(); _selUnit = null;
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  showToast('✅ 목표 설정 완료!', 'done');
};
window.deleteGoal = async function (idx) {
  if (!confirm('이 목표를 삭제할까요?')) return;
  localDash.goals[idx] = null; await saveDash();
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  showToast('🗑 삭제됨', 'normal');
};

// ===== CHEERS (메인 하단) =====
async function renderMainCheers() {
  const el = document.getElementById('myCheersMain');
  const snap = await get(ref(db, `cheers/${currentUser.id}`));
  if (!snap.exists()) { el.innerHTML = `<div class="my-cheers-main-title">💬 받은 응원</div><div class="my-cheers-empty">아직 받은 응원이 없어요</div>`; return; }
  const data = snap.val(); let all = [];
  Object.entries(data).forEach(([gi, msgs]) => {
    Object.entries(msgs).forEach(([ts, msg]) => {
      const gIdx = parseInt(gi);
      const goalTitle = localDash.goals[gIdx]?.title || `목표 ${gIdx + 1}`;
      all.push({ ...msg, ts: parseInt(ts), goalTitle });
    });
  });
  all.sort((a, b) => b.ts - a.ts);
  const recent = all.slice(0, 10);
  let h = `<div class="my-cheers-main-title">💬 받은 응원 <span style="font-size:12px;color:var(--text-dim);">(${all.length})</span></div>`;
  if (recent.length === 0) { h += `<div class="my-cheers-empty">아직 받은 응원이 없어요</div>`; }
  else {
    recent.forEach(c => {
      const d = new Date(c.ts);
      h += `<div class="my-cheer-card"><div class="my-cheer-goal-tag">🎯 ${esc(c.goalTitle)}</div><div class="my-cheer-from">${esc(c.from)}</div><div class="my-cheer-text">${esc(c.text)}</div><div class="my-cheer-time">${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}</div></div>`;
    });
  }
  el.innerHTML = h;
}

// ===== NOTICE =====
async function loadNoticeBanner() {
  try {
    const snap = await get(ref(db, 'notices'));
    if (!snap.exists()) { document.getElementById('noticeBanner').classList.remove('visible'); return; }
    const notices = snap.val();
    let latest = null;
    Object.entries(notices).forEach(([id, n]) => {
      if (n.target === 'all' || (n.target === 'user' && n.targetId === currentUser.id)) {
        if (!latest || n.createdAt > latest.createdAt) latest = { id, ...n };
      }
    });
    if (latest) {
      const readKey = `qb_notice_read_${latest.id}`;
      if (!localStorage.getItem(readKey)) {
        document.getElementById('noticeBannerTitle').textContent = latest.title;
        document.getElementById('noticeBanner').classList.add('visible');
        document.getElementById('noticeBanner')._noticeData = latest;
      } else { document.getElementById('noticeBanner').classList.remove('visible'); }
    } else { document.getElementById('noticeBanner').classList.remove('visible'); }
  } catch (e) {}
}
window.openNoticeModal = function () {
  const n = document.getElementById('noticeBanner')._noticeData;
  if (!n) return;
  const body = document.getElementById('noticeModalBody');
  let h = `<div class="notice-modal-title">${esc(n.title)}</div><div class="notice-modal-date">${new Date(n.createdAt).toLocaleDateString('ko')}</div>`;
  if (n.img) h += `<img class="notice-modal-img" src="${n.img}" onerror="this.style.display='none'">`;
  if (n.desc) h += `<div class="notice-modal-desc">${esc(n.desc)}</div>`;
  body.innerHTML = h;
  document.getElementById('noticeModalOverlay').classList.add('open');
  localStorage.setItem(`qb_notice_read_${n.id}`, '1');
  document.getElementById('noticeBanner').classList.remove('visible');
};
window.closeNoticeModal = function () { document.getElementById('noticeModalOverlay').classList.remove('open'); };

// ===== FRIENDS =====
async function renderFriends() {
  const sec = document.getElementById('friendsSection');
  sec.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim);">로딩 중...</div>';
  const grpSnap = await get(ref(db, 'groups'));
  if (!grpSnap.exists()) { sec.innerHTML = '<div class="friends-empty">그룹이 없어요</div>'; return; }
  const groups = grpSnap.val();
  let friendIds = new Set();
  Object.values(groups).forEach(g => { if (g.members && Object.values(g.members).includes(currentUser.id)) Object.values(g.members).forEach(m => { if (m !== currentUser.id) friendIds.add(m); }); });
  if (friendIds.size === 0) { sec.innerHTML = '<div class="friends-empty">아직 같은 그룹의 친구가 없어요</div>'; return; }
  let h = '<div class="friend-list">';
  for (const fid of friendIds) {
    const uSnap = await get(ref(db, `users/${fid}`));
    const dSnap = await get(ref(db, `dashboards/${fid}`));
    if (!uSnap.exists()) continue;
    const u = uSnap.val(), d = dSnap.exists() ? dSnap.val() : {};
    const nick = d.nickname || u.name;
    // calc friend global pct
    const fGoals = d.goals || [], fComp = d.completions || {};
    const now = new Date(), fy = now.getFullYear(), fm = now.getMonth() + 1;
    let ftd = 0, ftm = 0;
    for (let i = 0; i < MAX_HABITS; i++) {
      const fg = fGoals[i]; if (!fg || !fg.unit) continue;
      const mg = migrateGoal(fg);
      const mod = goalModulus(mg, i, fy, fm);
      let done = 0;
      if (mg.unit === 'once') done = fComp[`g${i}_once`] === true ? 1 : 0;
      else { const pfx = `g${i}_${fy}_${fm}_`; done = Object.entries(fComp).filter(([k, v]) => k.startsWith(pfx) && v === true).length; }
      ftd += done; ftm += mod;
    }
    const fpct = ftm > 0 ? Math.round(ftd / ftm * 100) : 0;
    const fstage = Math.min(9, Math.floor(fpct / 10));
    h += `<div class="friend-card" onclick="openFriendDetail('${fid}')"><div class="friend-avatar">${AVATARS[fstage]}</div><div class="friend-info"><div class="friend-name">${esc(nick)}</div><div class="friend-stage">${fstage + 1}단계 · ${STAGE_NAMES[fstage]}</div></div><div class="friend-pct">${fpct}%</div></div>`;
  }
  h += '</div><div id="friendDetailArea"></div>';
  sec.innerHTML = h;
}

window.openFriendDetail = async function (fid) {
  const area = document.getElementById('friendDetailArea');
  area.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim);">로딩 중...</div>';
  const dSnap = await get(ref(db, `dashboards/${fid}`));
  const uSnap = await get(ref(db, `users/${fid}`));
  const d = dSnap.exists() ? dSnap.val() : {}, u = uSnap.exists() ? uSnap.val() : {};
  const nick = d.nickname || u.name || fid;
  const goals = d.goals || [], comp = d.completions || {};
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  let h = `<div class="friend-detail"><div class="friend-detail-hdr"><div class="friend-detail-name">${esc(nick)}</div></div><div class="fgoal-grid">`;
  for (let i = 0; i < MAX_HABITS; i++) {
    const g = goals[i]; if (!g || !g.unit) continue;
    const mg = migrateGoal(g);
    const mod = goalModulus(mg, i, y, m);
    let done = 0;
    if (mg.unit === 'once') done = comp[`g${i}_once`] === true ? 1 : 0;
    else { const pfx = `g${i}_${y}_${m}_`; done = Object.entries(comp).filter(([k, v]) => k.startsWith(pfx) && v === true).length; }
    const pct = mod > 0 ? Math.round(done / mod * 100) : 0;
    h += `<button class="fgoal-btn" onclick="showFriendGoalCal('${fid}',${i})"><div class="fgoal-name">${esc(g.title)}</div><div class="fgoal-pct">${pct}%</div><div class="fgoal-bar"><div class="fgoal-bar-fill" style="width:${Math.min(pct,100)}%"></div></div></button>`;
  }
  h += `</div><div id="friendGoalCal"></div></div>`;
  area.innerHTML = h;
};

window.showFriendGoalCal = async function (fid, gi) {
  const area = document.getElementById('friendGoalCal');
  const dSnap = await get(ref(db, `dashboards/${fid}`));
  const d = dSnap.exists() ? dSnap.val() : {};
  const comp = d.completions || {};
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();
  let h = `<div class="rocal-wrap"><div class="rocal-label">${y}년 ${m}월</div><div class="rocal-days">`;
  ['일','월','화','수','목','금','토'].forEach(dd => h += `<div class="rocal-day">${dd}</div>`);
  h += `</div><div class="rocal-grid">`;
  for (let i = 0; i < fd; i++) h += `<div class="rocal-cell empty"></div>`;
  for (let dd = 1; dd <= days; dd++) {
    const k = `g${gi}_${y}_${m}_${dd}`, done = comp[k] === true;
    const isToday = dd === now.getDate();
    h += `<div class="rocal-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}">${dd}</div>`;
  }
  h += `</div></div>`;
  // 응원 보내기
  h += `<div class="cheer-box"><div class="cheer-box-title">💬 응원하기</div>`;
  // 기존 응원 표시
  const cheerSnap = await get(ref(db, `cheers/${fid}/${gi}`));
  if (cheerSnap.exists()) {
    const cheers = cheerSnap.val();
    const sorted = Object.entries(cheers).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).slice(0, 5);
    h += `<div class="cheer-list">`;
    sorted.forEach(([ts, c]) => {
      const dt = new Date(parseInt(ts));
      h += `<div class="cheer-item"><div class="cheer-from">${esc(c.from)}</div><div class="cheer-text">${esc(c.text)}</div><div class="cheer-time">${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}</div></div>`;
    });
    h += `</div>`;
  }
  h += `<div class="cheer-input-row"><input class="cheer-text-input" id="cheerInput" placeholder="응원 메시지 보내기" maxlength="50"><button class="cheer-send-btn" onclick="sendCheer('${fid}',${gi})">보내기</button></div></div>`;
  area.innerHTML = h;
};

window.sendCheer = async function (fid, gi) {
  const input = document.getElementById('cheerInput');
  const text = input.value.trim(); if (!text) return;
  const ts = Date.now();
  await set(ref(db, `cheers/${fid}/${gi}/${ts}`), { from: localDash.nickname || currentUser.name, text, ts });
  showToast('💬 응원 전송!', 'done');
  showFriendGoalCal(fid, gi);
};

// ===== ADMIN =====
async function renderAdminList() {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return;
  const users = snap.val();
  let rows = Object.entries(users).filter(([id, u]) => u.role !== 'admin');
  const tbl = document.getElementById('adminUserTable');
  let h = `<table class="user-table"><thead><tr><th>이름</th><th>아이디</th><th>목표</th></tr></thead><tbody>`;
  for (const [id, u] of rows) {
    const dSnap = await get(ref(db, `dashboards/${id}`));
    const d = dSnap.exists() ? dSnap.val() : {};
    const gCount = (d.goals || []).filter(g => g && g.title).length;
    h += `<tr class="user-row" onclick="showAdminUserDetail('${id}')"><td><span class="user-tbl-name">${esc(u.name)}</span></td><td><span class="user-tbl-id">${id}</span></td><td>${gCount}개</td></tr>`;
  }
  h += `</tbody></table>`;
  tbl.innerHTML = h;
  // 그룹
  const grpSnap = await get(ref(db, 'groups'));
  const gl = document.getElementById('adminGroupList');
  if (!grpSnap.exists()) { gl.innerHTML = '<div class="admin-empty">그룹 없음</div>'; return; }
  const groups = grpSnap.val();
  let gh = '';
  for (const [gid, g] of Object.entries(groups)) {
    gh += `<div class="group-card"><div class="group-card-hdr"><div class="group-card-name">${esc(g.name)}</div></div><div class="group-member-list">`;
    if (g.members) {
      for (const [mk, mid] of Object.entries(g.members)) {
        const muSnap = await get(ref(db, `users/${mid}`));
        const mname = muSnap.exists() ? muSnap.val().name : mid;
        gh += `<div class="group-member-row"><span class="group-member-name">${esc(mname)}</span><span class="group-member-id">${mid}</span></div>`;
      }
    }
    gh += `</div></div>`;
  }
  gl.innerHTML = gh;
  // 공지 목록
  const nSnap = await get(ref(db, 'notices'));
  const nl = document.getElementById('adminNoticeList');
  if (!nSnap.exists()) { nl.innerHTML = ''; return; }
  let nh = '';
  Object.entries(nSnap.val()).sort((a, b) => (b[1].createdAt || '').localeCompare(a[1].createdAt || '')).forEach(([nid, n]) => {
    nh += `<div class="notice-card"><div class="notice-card-info"><div class="notice-card-title">${esc(n.title)}</div><div class="notice-card-meta">${n.target} · ${new Date(n.createdAt).toLocaleDateString('ko')}</div></div><button class="notice-card-del" onclick="deleteNotice('${nid}')">삭제</button></div>`;
  });
  nl.innerHTML = nh;
}

window.showAdminUserDetail = async function (uid) {
  const area = document.getElementById('adminUserDetail');
  const uSnap = await get(ref(db, `users/${uid}`));
  const dSnap = await get(ref(db, `dashboards/${uid}`));
  if (!uSnap.exists()) return;
  const u = uSnap.val(), d = dSnap.exists() ? dSnap.val() : {};
  const goals = d.goals || [], comp = d.completions || {};
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  let h = `<div class="admin-detail"><div class="admin-detail-header"><div><div class="admin-detail-name">${esc(u.name)}</div><div class="admin-detail-id">${uid}</div></div></div>`;
  h += `<div class="admin-meta-grid"><div class="admin-meta-card"><div class="admin-meta-label">마지막 로그인</div><div class="admin-meta-val">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('ko') : '-'}</div></div><div class="admin-meta-card"><div class="admin-meta-label">마지막 업데이트</div><div class="admin-meta-val">${d.lastUpdate ? new Date(d.lastUpdate).toLocaleString('ko') : '-'}</div></div></div>`;
  h += `<div class="admin-goal-list">`;
  for (let i = 0; i < MAX_HABITS; i++) {
    const g = goals[i]; if (!g || !g.unit) continue;
    const mg = migrateGoal(g), mod = goalModulus(mg, i, y, m);
    let done = 0;
    if (mg.unit === 'once') done = comp[`g${i}_once`] === true ? 1 : 0;
    else { const pfx = `g${i}_${y}_${m}_`; done = Object.entries(comp).filter(([k, v]) => k.startsWith(pfx) && v === true).length; }
    const pct = mod > 0 ? Math.round(done / mod * 100) : 0;
    h += `<div class="admin-goal-card"><div class="admin-goal-top"><div class="admin-goal-title">${esc(g.title)}</div><div class="admin-goal-pct">${pct}%</div></div><div class="admin-goal-bar"><div class="admin-goal-bar-fill" style="width:${Math.min(pct,100)}%"></div></div><div class="admin-goal-meta"><span class="admin-goal-tag highlight">${getUnitLabel(mg)}</span><span class="admin-goal-tag">${done}/${mod}</span></div></div>`;
  }
  h += `</div></div>`;
  area.innerHTML = h;
};

// ===== NOTICE ADMIN =====
let _noticeTarget = 'all';
window.setNoticeTarget = function (t) {
  _noticeTarget = t;
  ['All', 'Group', 'User'].forEach(s => document.getElementById(`noticeTarget${s}`).classList.toggle('active', t === s.toLowerCase()));
  document.getElementById('noticeTargetDetail').style.display = t === 'all' ? 'none' : 'block';
  if (t === 'user') document.getElementById('noticeTargetDetail').innerHTML = `<input class="admin-notice-input" id="noticeTargetId" placeholder="유저 아이디 입력">`;
  else if (t === 'group') document.getElementById('noticeTargetDetail').innerHTML = `<input class="admin-notice-input" id="noticeTargetGroupId" placeholder="그룹 ID 입력">`;
};
window.submitNotice = async function () {
  const title = document.getElementById('noticeTitle').value.trim();
  if (!title) { showToast('제목을 입력하세요', 'normal'); return; }
  const desc = document.getElementById('noticeDesc').value.trim();
  const img = document.getElementById('noticeImg').value.trim();
  const notice = { title, desc, img, target: _noticeTarget, createdAt: new Date().toISOString() };
  if (_noticeTarget === 'user') notice.targetId = document.getElementById('noticeTargetId')?.value.trim();
  if (_noticeTarget === 'group') notice.targetGroupId = document.getElementById('noticeTargetGroupId')?.value.trim();
  await push(ref(db, 'notices'), notice);
  showToast('📢 공지 추가!', 'done');
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeDesc').value = '';
  document.getElementById('noticeImg').value = '';
  renderAdminList();
};
window.deleteNotice = async function (nid) {
  if (!confirm('공지를 삭제할까요?')) return;
  await remove(ref(db, `notices/${nid}`));
  showToast('삭제됨', 'normal'); renderAdminList();
};

// ===== TUTORIAL =====
let tutStep = 1, tutChecked = 0, tutGoalName = '12시 전에 자기';
function initTutorial() {
  tutStep = 1; tutChecked = 0;
  const dots = document.getElementById('tutDots');
  let dh = ''; for (let i = 1; i <= TUT_STEPS; i++) dh += `<div class="tut-dot ${i === 1 ? 'active' : ''}" id="tutDot${i}"></div>`;
  dots.innerHTML = dh;
  document.getElementById('tutFill').style.width = '0%';
}
function tutUpdateUI() {
  for (let i = 1; i <= TUT_STEPS; i++) {
    const d = document.getElementById(`tutDot${i}`);
    d.className = 'tut-dot' + (i === tutStep ? ' active' : i < tutStep ? ' done' : '');
  }
  document.getElementById('tutFill').style.width = ((tutStep - 1) / (TUT_STEPS - 1) * 100) + '%';
  for (let i = 1; i <= TUT_STEPS; i++) document.getElementById(`tutStep${i}`).classList.toggle('active', i === tutStep);
}
window.tutStep1Confirm = function () { document.getElementById('tutGoalBtn').style.background = 'var(--accent-light)'; document.getElementById('tutGoalBtn').style.borderColor = 'var(--accent)'; setTimeout(() => tutNextStep(2), 400); };
window.tutNextStep = function (s) {
  tutStep = s; tutUpdateUI();
  if (s === 2) { document.getElementById('tutGoalName2').textContent = tutGoalName; renderTutUnitOpts(); }
  if (s === 3) { document.getElementById('tutGoalName3').textContent = tutGoalName; renderTutCal(); }
  if (s === 4) { const pct = Math.round(tutChecked / 28 * 100); document.getElementById('tutGoalName4').textContent = tutGoalName; document.getElementById('tutGoalPct4').textContent = pct + '%'; document.getElementById('tutGoalBar4').style.width = pct + '%'; document.getElementById('tutGoalStat4').textContent = `${tutChecked}/28`; document.getElementById('tutGbFill').style.width = pct + '%'; document.getElementById('tutGbPct').textContent = pct + '%'; }
  if (s === 5) { document.getElementById('tutAvatarArt').innerHTML = AVATARS[0]; }
};
function renderTutUnitOpts() {
  const opts = [{ l: '매일', v: 'daily' }, { l: '주 2~3회', v: 'w23' }, { l: '주 4~5회', v: 'w45', target: true }, { l: '한 번', v: 'once' }];
  let h = '';
  opts.forEach(o => h += `<div class="unit-opt ${o.target ? 'tut-cal-cell target' : ''}" onclick="tutSelectUnit('${o.v}')" id="tutUopt_${o.v}">${o.l}</div>`);
  document.getElementById('tutUnitOpts').innerHTML = h;
}
window.tutSelectUnit = function (v) {
  document.querySelectorAll('#tutUnitOpts .unit-opt').forEach(e => e.classList.remove('selected'));
  document.getElementById(`tutUopt_${v}`)?.classList.add('selected');
  setTimeout(() => tutNextStep(3), 500);
};
function renderTutCal() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();
  let dh = ''; ['일', '월', '화', '수', '목', '금', '토'].forEach(d => dh += `<div class="tut-cal-day">${d}</div>`);
  document.getElementById('tutCalDayRow').innerHTML = dh;
  let gh = '';
  for (let i = 0; i < fd; i++) gh += `<div class="tut-cal-cell empty"></div>`;
  for (let d = 1; d <= days; d++) gh += `<div class="tut-cal-cell" id="tutCal_${d}" onclick="tutToggleCal(${d})">${d}</div>`;
  document.getElementById('tutCalGrid').innerHTML = gh;
  tutChecked = 0; document.getElementById('tutStep3Status').textContent = '0 / 4 체크';
}
window.tutToggleCal = function (d) {
  const el = document.getElementById(`tutCal_${d}`);
  if (el.classList.contains('done')) { el.classList.remove('done'); tutChecked--; }
  else { el.classList.add('done'); tutChecked++; showConfettiSmall(); }
  document.getElementById('tutStep3Status').textContent = `${tutChecked} / 4 체크`;
  if (tutChecked >= 4) setTimeout(() => tutNextStep(4), 600);
};
window.tutFinish = async function () {
  localDash.tutorialDone = true; await saveDash();
  showScreen('dashboardScreen'); await setupDashTabs(currentUser.id); renderDashboard();
  showConfetti(); showToast('🎉 시작합니다!', 'done');
};

// ===== 3D HAMSTER (Three.js) =====
function initHamsterAvatar(container) {
  // 원본은 ES module import 방식이지만, 기존 CDN 로드 방식 유지
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js';
  script.onload = () => buildHamster(container);
  document.head.appendChild(script);
}

function buildHamster(container) {
  if (typeof THREE === 'undefined') { container.innerHTML = AVATARS[0]; return; }

  let scene, camera, renderer;
  let hamster, handsGroup, seed;
  let clock = new THREE.Clock();
  let mouse = new THREE.Vector2();
  let targetRotation = new THREE.Vector2();
  let eyes = [];
  let isBlinking = false;

  // --- 외곽선 메쉬 (Inverted Hull) ---
  function createOutline(geometry, thickness = 0.03, color = 0x332211) {
    const outlineMat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(geometry, outlineMat);
    outlineMesh.scale.multiplyScalar(1 + thickness);
    return outlineMesh;
  }

  // --- 이모지 파티클 시스템 ---
  const emojiPool = ['❤️','⭐','🌟','✨','💖','🎉','🔥','💕','🌈','🍀'];
  function spawnEmoji(cx, cy) {
    for (let i = 0; i < 6; i++) {
      const em = document.createElement('div');
      em.textContent = emojiPool[Math.floor(Math.random() * emojiPool.length)];
      em.style.cssText = `position:absolute;font-size:${18 + Math.random()*14}px;pointer-events:none;z-index:10;left:${cx - 10 + (Math.random()-0.5)*80}px;top:${cy - 10}px;opacity:1;transition:none;`;
      container.style.position = 'relative';
      container.appendChild(em);
      const dx = (Math.random() - 0.5) * 120;
      const dy = -(40 + Math.random() * 80);
      const rot = (Math.random() - 0.5) * 60;
      requestAnimationFrame(() => {
        em.style.transition = 'all 0.8s cubic-bezier(.15,.9,.3,1)';
        em.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        em.style.opacity = '0';
      });
      setTimeout(() => em.remove(), 900);
    }
  }

  // --- Scene ---
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  camera.position.set(0, 0, 8.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(280, 280);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
  dirLight.position.set(2, 5, 4);
  scene.add(dirLight);

  // --- Materials ---
  const orangeMat = new THREE.MeshToonMaterial({ color: 0xf9c288 });
  const creamMat  = new THREE.MeshToonMaterial({ color: 0xfff9ef });
  const pinkMat   = new THREE.MeshToonMaterial({ color: 0xffb8c6 });
  const darkMat   = new THREE.MeshBasicMaterial({ color: 0x332a26 });

  hamster = new THREE.Group();
  scene.add(hamster);

  // --- Body ---
  const bodyGeom = new THREE.SphereGeometry(1.2, 64, 64);
  const body = new THREE.Mesh(bodyGeom, orangeMat);
  body.scale.set(1.05, 0.95, 0.95);
  body.add(createOutline(bodyGeom, 0.025, 0x5a3e2b));
  hamster.add(body);

  // --- Belly ---
  const bellyGeom = new THREE.SphereGeometry(1.05, 64, 64);
  const belly = new THREE.Mesh(bellyGeom, creamMat);
  belly.position.set(0, -0.2, 0.2);
  belly.scale.set(1.05, 0.95, 1.0);
  belly.add(createOutline(bellyGeom, 0.02, 0x5a3e2b));
  hamster.add(belly);

  // --- Cheeks ---
  const cheekGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const lCheek = new THREE.Mesh(cheekGeom, creamMat);
  lCheek.position.set(-0.55, -0.25, 0.7);
  lCheek.scale.set(1.1, 0.9, 0.8);
  lCheek.add(createOutline(cheekGeom, 0.03, 0x5a3e2b));
  hamster.add(lCheek);
  const rCheek = new THREE.Mesh(cheekGeom, creamMat);
  rCheek.position.set(0.55, -0.25, 0.7);
  rCheek.scale.set(1.1, 0.9, 0.8);
  rCheek.add(createOutline(cheekGeom, 0.03, 0x5a3e2b));
  hamster.add(rCheek);

  // --- Muzzle ---
  const muzzleGeom = new THREE.SphereGeometry(0.35, 32, 32);
  const muzzle = new THREE.Mesh(muzzleGeom, creamMat);
  muzzle.scale.set(1.2, 0.8, 0.8);
  muzzle.position.set(0, -0.15, 0.95);
  muzzle.add(createOutline(muzzleGeom, 0.025, 0x5a3e2b));
  hamster.add(muzzle);

  // --- Nose ---
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), pinkMat);
  nose.position.set(0, 0.02, 1.22);
  hamster.add(nose);

  // --- Mouth ---
  const mouthGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const mouth = new THREE.Mesh(mouthGeom, darkMat);
  mouth.scale.set(1, 0.8, 0.5);
  mouth.position.set(0, -0.06, 1.25);
  hamster.add(mouth);

  // --- Eyes ---
  const createEye = (x) => {
    const group = new THREE.Group();
    const eyeGeom = new THREE.SphereGeometry(0.12, 32, 32);
    const eye = new THREE.Mesh(eyeGeom, darkMat);
    eye.scale.set(1, 1.25, 0.5);
    const highlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    highlight.position.set(0.03, 0.05, 0.06);
    group.add(eye, highlight);
    group.position.set(x, 0.35, 1.02);
    eyes.push(group);
    return group;
  };
  hamster.add(createEye(-0.33));
  hamster.add(createEye(0.33));

  // --- Ears ---
  const createEar = (x, rotZ) => {
    const group = new THREE.Group();
    const earOuterGeom = new THREE.SphereGeometry(0.25, 32, 16);
    const earOuter = new THREE.Mesh(earOuterGeom, orangeMat);
    earOuter.scale.set(1, 1, 0.3);
    earOuter.add(createOutline(earOuterGeom, 0.05, 0x5a3e2b));
    const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), pinkMat);
    earInner.scale.set(1, 1, 0.3);
    earInner.position.z = 0.05;
    group.add(earOuter, earInner);
    group.position.set(x, 0.85, 0.2);
    group.rotation.z = rotZ;
    return group;
  };
  hamster.add(createEar(-0.65, 0.3));
  hamster.add(createEar(0.65, -0.3));

  // --- Hands & Seed ---
  handsGroup = new THREE.Group();
  handsGroup.position.set(0, -0.35, 1.35);
  hamster.add(handsGroup);

  const handGeom = new THREE.SphereGeometry(0.1, 16, 16);
  const lHand = new THREE.Mesh(handGeom, pinkMat);
  lHand.position.set(-0.16, 0, 0);
  lHand.add(createOutline(handGeom, 0.08, 0x5a3e2b));
  handsGroup.add(lHand);
  const rHand = new THREE.Mesh(handGeom, pinkMat);
  rHand.position.set(0.16, 0, 0);
  rHand.add(createOutline(handGeom, 0.08, 0x5a3e2b));
  handsGroup.add(rHand);

  const seedGeom = new THREE.SphereGeometry(0.08, 16, 16);
  seedGeom.scale(1, 2.2, 0.6);
  seed = new THREE.Mesh(seedGeom, darkMat);
  seed.position.set(0, 0.05, 0.05);
  seed.rotation.x = -0.1;
  const stripeGeom = new THREE.SphereGeometry(0.02, 16, 16);
  stripeGeom.scale(1, 2.3, 0.7);
  const stripe = new THREE.Mesh(stripeGeom, creamMat);
  stripe.position.z = 0.03;
  seed.add(stripe);
  handsGroup.add(seed);

  // --- Feet ---
  const footGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const lFoot = new THREE.Mesh(footGeom, pinkMat);
  lFoot.scale.set(1, 0.6, 1.3);
  lFoot.position.set(-0.35, -1.05, 0.6);
  lFoot.add(createOutline(footGeom, 0.08, 0x5a3e2b));
  hamster.add(lFoot);
  const rFoot = new THREE.Mesh(footGeom, pinkMat);
  rFoot.scale.set(1, 0.6, 1.3);
  rFoot.position.set(0.35, -1.05, 0.6);
  rFoot.add(createOutline(footGeom, 0.08, 0x5a3e2b));
  hamster.add(rFoot);

  // --- Events ---
  container.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    targetRotation.y = mouse.x * 0.25;
    targetRotation.x = -mouse.y * 0.15;
  });
  container.addEventListener('touchmove', (e) => {
    const r = container.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = ((t.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((t.clientY - r.top) / r.height) * 2 + 1;
    targetRotation.y = mouse.x * 0.25;
    targetRotation.x = -mouse.y * 0.15;
  });

  // 클릭/탭 시 이모지 파티클
  function onTap(e) {
    const r = container.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    spawnEmoji(cx, cy);
    // 햄스터 살짝 점프
    hamster._jumpT = clock.getElapsedTime();
  }
  container.addEventListener('click', onTap);
  container.addEventListener('touchstart', (e) => { if (e.touches.length === 1) onTap(e); }, { passive: true });

  // --- Animate ---
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 눈 깜빡임
    if (Math.random() > 0.995 && !isBlinking) {
      isBlinking = true;
      eyes.forEach(eye => eye.scale.y = 0.1);
      setTimeout(() => { eyes.forEach(eye => eye.scale.y = 1); isBlinking = false; }, 120);
    }

    // 숨쉬기
    const breath = 1 + Math.sin(time * 3) * 0.015;
    hamster.scale.set(breath, breath, breath);

    // 점프 효과 (클릭 시)
    if (hamster._jumpT) {
      const dt = time - hamster._jumpT;
      if (dt < 0.4) {
        hamster.position.y = Math.sin(dt / 0.4 * Math.PI) * 0.3;
      } else {
        hamster.position.y = 0;
        hamster._jumpT = null;
      }
    }

    // 오물오물
    const nibble = Math.sin(time * 40) * 0.015;
    handsGroup.position.y = -0.35 + nibble;
    seed.rotation.z = Math.sin(time * 30) * 0.05;

    // 마우스 추적
    hamster.rotation.y += (targetRotation.y - hamster.rotation.y) * 0.08;
    hamster.rotation.x += (targetRotation.x - hamster.rotation.x) * 0.08;

    renderer.render(scene, camera);
  }
  animate();
}

// ===== EFFECTS =====
function showToast(msg, type = 'normal') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 2200);
}
function showConfetti() {
  const c = document.getElementById('confettiContainer');
  const colors = ['#1952f5', '#ff5e7d', '#f5c518', '#00b96b', '#a78bfa', '#ff9f43'];
  for (let i = 0; i < 120; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = (6 + Math.random() * 8) + 'px'; p.style.height = (6 + Math.random() * 8) + 'px';
    p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    p.style.animationDelay = Math.random() * 0.5 + 's';
    c.appendChild(p); setTimeout(() => p.remove(), 4000);
  }
}
function showConfettiSmall() {
  const c = document.getElementById('confettiContainer');
  const colors = ['#1952f5', '#a78bfa', '#ff5e7d', '#f5c518'];
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    p.style.left = (30 + Math.random() * 40) + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = (4 + Math.random() * 6) + 'px'; p.style.height = (4 + Math.random() * 6) + 'px';
    p.style.animationDuration = (1 + Math.random() * 1.5) + 's';
    c.appendChild(p); setTimeout(() => p.remove(), 3000);
  }
}
function shakeScreen() {
  const el = document.querySelector('#dashboardScreen .mobile-wrap');
  if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 800); }
}
