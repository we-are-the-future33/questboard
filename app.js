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
const MAX_HABITS = 50;
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
let habitViewMode = 'all'; // 'all' | 'time' | 'category'

const TIME_LABELS = { any: '🕒 시간 무관', morning: '🌅 아침 루틴', afternoon: '☀️ 오후 루틴', evening: '🌙 저녁 루틴' };
const CAT_LABELS = { health: '💪 건강 & 체력', diet: '🥗 식단 & 영양', study: '📚 학습 & 성장', work: '💼 업무 & 커리어', finance: '💰 재무 & 자산', life: '🌱 생활 & 루틴', home: '🧹 집안일 & 정리', hobby: '🎨 취미 & 창작', social: '🤝 관계 & 소셜', mental: '🧘 휴식 & 멘탈', etc: '📦 기타' };
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
  if (g.unit === 'multiweek') return `${g.weeks||3}주 ${g.freq}회`;
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
  if (g.unit === 'multiweek') return (g.freq || 1) * Math.ceil(getMonthDays(y, m) / ((g.weeks||3) * 7));
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
function getAllGoals() {
  const src = localDash.goals || {};
  // Firebase may return object instead of array - normalize
  if (!Array.isArray(src)) {
    const arr = [];
    Object.keys(src).forEach(k => { arr[parseInt(k)] = src[k]; });
    localDash.goals = arr;
  }
  const g = [];
  for (let i = 0; i < MAX_HABITS; i++) g.push(localDash.goals[i] || null);
  return g;
}

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
  document.getElementById('avatarStage').textContent = `${stage + 1}단계`;
  const nick = localDash.nickname || currentUser.name || '나의 캐릭터';
  document.getElementById('avatarNicknameRow').innerHTML = `<div class="avatar-nickname">${esc(nick)}</div><button class="pencil-btn" onclick="startEditNickname()">✏️</button>`;
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

// ===== HABIT CARDS (2-col grid, grouped) =====
window.changeViewMode = function(mode) {
  habitViewMode = mode;
  renderHabitCards();
};

window.toggleGroupAccordion = function(id) {
  const grid = document.getElementById(id);
  const icon = document.getElementById(id.replace('hg_', 'hgi_'));
  if (!grid || !icon) return;
  if (grid.classList.contains('hidden')) {
    grid.classList.remove('hidden');
    icon.classList.remove('closed');
  } else {
    grid.classList.add('hidden');
    icon.classList.add('closed');
  }
};

function generateHabitCardHtml(g, idx, y, m) {
  const now = new Date();
  const mg = migrateGoal(g), { pct } = goalPct(mg, idx, y, m);
  const streak = calcStreak(mg, idx), streakLbl = getStreakLabel(mg, streak);
  const todayKey = `g${idx}_${y}_${m}_${now.getDate()}`;
  const todayDone = localDash.completions[todayKey] === true;
  const isOnce = mg.unit === 'once';
  const isCompleted = pct >= 100;
  const isOver = pct > 100;
  const isDone = todayDone || (isOnce && localDash.completions[`g${idx}_once`]);
  return `<div class="habit-card-outer" id="hcOuter_${idx}">
    <div class="habit-card-swipe-bg-left todo"><div class="swipe-bg-text">✓ 완료</div></div>
    <div class="habit-card-swipe-bg-right done"><div class="swipe-bg-text">↩ 취소</div></div>
    <div class="habit-card ${isCompleted ? 'completed' : ''} ${isDone ? 'today-done' : ''}" id="hc_${idx}" data-idx="${idx}" data-once="${isOnce ? 1 : 0}" data-done="${isDone ? 1 : 0}">
      ${isDone ? '<div class="habit-card-done-badge">✓</div>' : ''}
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
}

function sortHabitItems(items, y, m) {
  const now = new Date();
  return items.map(item => {
    const { g, idx } = item;
    const mg = migrateGoal(g);
    const isOnce = mg.unit === 'once';
    const todayKey = `g${idx}_${y}_${m}_${now.getDate()}`;
    const isDone = localDash.completions[todayKey] === true || (isOnce && localDash.completions[`g${idx}_once`]);
    let lastDoneTs = 0;
    Object.keys(localDash.completions).forEach(k => {
      if (!k.startsWith(`g${idx}_`) || localDash.completions[k] !== true) return;
      const parts = k.split('_');
      if (parts.length === 4) {
        const d = new Date(+parts[1], +parts[2] - 1, +parts[3]);
        if (d.getTime() > lastDoneTs) lastDoneTs = d.getTime();
      }
    });
    return { ...item, isDone, lastDoneTs, createdIdx: idx };
  }).sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    if (!a.isDone && !b.isDone) return b.lastDoneTs - a.lastDoneTs;
    return b.createdIdx - a.createdIdx;
  });
}

function renderHabitCards() {
  const goalsObj = localDash.goals || {};
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const wrapper = document.getElementById('habitListWrapper');

  let valid = [];
  // Object.keys로 안전 순회 (Firebase 객체/배열 모두 대응)
  Object.keys(goalsObj).forEach(key => {
    const idx = parseInt(key);
    const g = goalsObj[key];
    if (g && g.title && g.unit) valid.push({ g, idx });
  });

  let filtered = habitFilter === 'active' ? valid.filter(({ g, idx }) => isGoalActiveThisWeek(g, idx)) : valid;
  document.getElementById('habitCount').textContent = valid.length;

  // 정렬
  filtered = sortHabitItems(filtered, y, m);

  let html = '';

  if (habitViewMode === 'time') {
    const groups = { morning: [], afternoon: [], evening: [], any: [] };
    filtered.forEach(v => { const t = v.g.time || 'any'; if (groups[t]) groups[t].push(v); else groups['any'].push(v); });
    let gIdx = 0;
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) return;
      const label = TIME_LABELS[key] || key;
      html += `<div class="group-header" onclick="toggleGroupAccordion('hg_${gIdx}')">
        <div class="group-header-left">${label} <span style="font-size:12px;color:var(--accent);">${groups[key].length}</span></div>
        <div class="group-toggle-icon" id="hgi_${gIdx}">▼</div>
      </div><div class="card-grid" id="hg_${gIdx}">`;
      groups[key].forEach(({ g, idx }) => { html += generateHabitCardHtml(g, idx, y, m); });
      html += `</div>`;
      gIdx++;
    });
  } else if (habitViewMode === 'category') {
    const groups = {};
    Object.keys(CAT_LABELS).forEach(k => { groups[k] = []; });
    filtered.forEach(v => { const c = v.g.category || 'etc'; if (groups[c]) groups[c].push(v); else groups['etc'].push(v); });
    let gIdx = 0;
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) return;
      const label = CAT_LABELS[key] || key;
      html += `<div class="group-header" onclick="toggleGroupAccordion('hg_${gIdx}')">
        <div class="group-header-left">${label} <span style="font-size:12px;color:var(--accent);">${groups[key].length}</span></div>
        <div class="group-toggle-icon" id="hgi_${gIdx}">▼</div>
      </div><div class="card-grid" id="hg_${gIdx}">`;
      groups[key].forEach(({ g, idx }) => { html += generateHabitCardHtml(g, idx, y, m); });
      html += `</div>`;
      gIdx++;
    });
  } else {
    // 기본 보기
    html += `<div class="card-grid">`;
    filtered.forEach(({ g, idx }) => { html += generateHabitCardHtml(g, idx, y, m); });
    if (valid.length < MAX_HABITS) html += `<div class="grid-add-btn" onclick="openAddHabitSheet()"><div class="grid-add-btn-icon">＋</div><div class="grid-add-btn-text">습관 추가</div></div>`;
    html += `</div>`;
  }

  // 그룹 모드일 때 추가 버튼
  if (habitViewMode !== 'all' && valid.length < MAX_HABITS) {
    html += `<div class="card-grid" style="margin-top:12px;"><div class="grid-add-btn" onclick="openAddHabitSheet()"><div class="grid-add-btn-icon">＋</div><div class="grid-add-btn-text">습관 추가</div></div></div>`;
  }

  wrapper.innerHTML = html;
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

  // Mobile touch swipe
  let sx = 0, sy = 0, dx = 0, swiping = false, locked = false;
  const TH = 60;
  const outer = document.getElementById(`hcOuter_${idx}`);

  function onS(e) {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; dx = 0; swiping = false; locked = false;
    card.classList.remove('snapping');
    if (outer) { outer.classList.remove('swiping-right', 'swiping-left'); }
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
    if (outer) {
      outer.classList.toggle('swiping-right', dx > 10);
      outer.classList.toggle('swiping-left', dx < -10);
    }
  }
  function onE() {
    if (outer) { outer.classList.remove('swiping-right', 'swiping-left'); }
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
      card.style.transform = `translateX(${window.innerWidth}px)`;
      setTimeout(() => habitMarkDone(idx), 250);
    } else if (dx <= -TH && isDone) {
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
  showToast('↩️ 취소', 'undo');
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
          <div class="swipe-bg-text">${done ? '↩ 취소' : '✓ 완료'}</div>
        </div>
        <div class="challenge-card type-bucket ${done ? 'bucket-done' : ''}" id="cc_${idx}" data-idx="${idx}">
          ${done ? '<div class="challenge-card-done-badge">✓</div>' : ''}
          <div>
            <div class="challenge-card-title">${esc(c.title)}</div>
            <span class="challenge-card-type bucket">버킷리스트</span>
          </div>
          ${done ? '<div><div class="challenge-card-achieve">달성 완료</div></div>' : '<div></div>'}
        </div>
      </div>`;
    } else {
      // project
      const { done, total, pct } = getProjectProgress(c);
      const projDone = pct >= 100;
      html += `<div class="challenge-card type-project ${projDone ? 'project-done' : ''}" id="cc_${idx}" data-idx="${idx}" onclick="openProjectDetail(${idx})">
        ${projDone ? '<div class="challenge-card-done-badge">✓</div>' : ''}
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
  if (valid.length < MAX_CHALLENGES) html += `<div class="grid-add-btn" onclick="openAddChallengeSheet()"><div class="grid-add-btn-icon">＋</div><div class="grid-add-btn-text">도전 추가</div></div>`;
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

  // PC: click opens bucket detail
  if (!isTouchDevice) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openBucketDetail(idx));
    return;
  }

  let sx = 0, sy = 0, dx = 0, swiping = false, locked = false, tapStart = 0;
  const TH = 60;
  function onS(e) { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; swiping = false; locked = false; tapStart = Date.now(); card.classList.remove('snapping'); }
  function onM(e) {
    if (locked) return; const t = e.touches[0];
    const dX = t.clientX - sx, dY = t.clientY - sy;
    if (!swiping && Math.abs(dY) > Math.abs(dX)) { locked = true; return; }
    if (Math.abs(dX) > 8) swiping = true;
    if (!swiping) return; e.preventDefault();
    const isDone = localDash.challenges[idx]?.done === true;
    if (!isDone) dx = Math.max(0, dX);
    else dx = Math.min(0, dX);
    card.classList.add('swiping'); card.style.transform = `translateX(${dx}px)`;
  }
  function onE() {
    card.classList.remove('swiping'); card.classList.add('snapping');
    if (Math.abs(dx) >= TH) { card.style.transform = `translateX(${dx > 0 ? window.innerWidth : -window.innerWidth}px)`; setTimeout(() => swipeBucket(idx), 250); }
    else {
      card.style.transform = 'translateX(0)';
      // 탭 감지 (짧은 터치 + 이동 없음)
      if (!swiping && Date.now() - tapStart < 300) openBucketDetail(idx);
    }
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
  else { showToast('↩️ 취소', 'undo'); }
  renderChallengeCards();
}

// ===== BUCKET DETAIL (bottom sheet) =====
window.openBucketDetail = function (idx) {
  const c = localDash.challenges[idx];
  if (!c) return;
  document.getElementById('bsTitle').textContent = c.title;
  const done = c.done === true;
  let h = `<div style="text-align:center;padding:30px 0;">
    <div style="font-size:48px;margin-bottom:12px;">${done ? '🏆' : '🎯'}</div>
    <span class="challenge-card-type bucket" style="background:${done?'#ecfdf5':'#fff0f3'};color:${done?'#10b981':'var(--accent2)'};border:1px solid ${done?'#d1fae5':'rgba(255,94,125,.2)'};font-size:12px;">버킷리스트</span>
    ${done ? '<div style="margin-top:12px;font-size:14px;font-weight:700;color:#10b981;">달성 완료! 🎉</div>' : '<div style="margin-top:12px;font-size:13px;color:var(--text-dim);">← 스와이프하여 완료 처리</div>'}
  </div>`;
  h += `<button class="proj-edit-btn" onclick="openBucketEdit(${idx})">✏️ 수정</button>`;
  h += `<button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteChallenge(${idx})">🗑 삭제</button>`;
  document.getElementById('bsBody').innerHTML = h;
  openBS();
};

window.openBucketEdit = function (idx) {
  const c = localDash.challenges[idx];
  if (!c) return;
  document.getElementById('bsTitle').textContent = '버킷리스트 수정';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">이름</div>`;
  h += `<input class="proj-edit-input" id="editBucketName" value="${esc(c.title)}" maxlength="30">`;
  h += `<div class="proj-save-row" style="margin-top:20px;"><button class="proj-save-btn cancel" onclick="openBucketDetail(${idx})">취소</button><button class="proj-save-btn save" onclick="saveBucketEdit(${idx})">저장</button></div>`;
  document.getElementById('bsBody').innerHTML = h;
  setTimeout(() => document.getElementById('editBucketName')?.focus(), 200);
};

window.saveBucketEdit = async function (idx) {
  const name = document.getElementById('editBucketName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }
  localDash.challenges[idx].title = name;
  await saveDash();
  document.getElementById('bsTitle').textContent = name;
  openBucketDetail(idx);
  renderChallengeCards();
  showToast('✅ 수정 완료', 'done');
};

// ===== ADD CHALLENGE BOTTOM SHEET =====
window.openAddChallengeSheet = function () {
  document.getElementById('bsTitle').textContent = '새로운 도전 만들기';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:14px;">유형을 먼저 선택해 주세요</div>`;
  h += `<div class="challenge-type-grid">
    <div class="challenge-type-card selected" id="ctBucket" onclick="selectChallengeType('bucket')">
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
  h += `<div id="challengeFormArea">
    <div style="margin-top:4px;">
      <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>
      <input class="proj-edit-input" id="bucketNameInput" placeholder="어떤 도전을 시작하시나요?" maxlength="30">
      <button class="unit-confirm-btn" style="margin-top:12px;" onclick="saveBucket()">도전 시작하기</button>
    </div>
  </div>`;
  document.getElementById('bsBody').innerHTML = h;
  _challengeType = 'bucket';
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
  document.getElementById('bsBody').innerHTML = `
    <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">습관 이름</div>
    <input class="proj-edit-input" id="newGoalInput" placeholder="예: 매일 독서 20분" maxlength="20">
    <button class="unit-confirm-btn" style="margin-top:12px;" onclick="habitAddStep2()">다음 →</button>`;
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
  if (wd === freq) setTimeout(() => { showConfetti(); const p = document.getElementById('weekClearPopup'); p.classList.add('show'); setTimeout(() => p.classList.remove('show'), 2800); }, 300);
}

// ===== BOTTOM SHEET =====
window.openGoalBottomSheet = function (idx) {
  const g = getAllGoals()[idx];
  if (!g) { openAddHabitSheet(); return; }
  if (!g.unit) { openUnitSetupSheet(idx); return; }
  activeGoalIdx = idx;
  viewMonth = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  document.getElementById('bsTitle').textContent = g.title;
  renderBSBody(idx);
  openBS();
};

function openBS() {
  document.getElementById('bsOverlay').classList.add('open');
  document.getElementById('bottomSheet').classList.add('open');
}
window.closeBottomSheet = function () {
  document.getElementById('bsOverlay').classList.remove('open');
  document.getElementById('bottomSheet').classList.remove('open');
};

// 헬퍼: 날짜가 속한 주의 일요일
function getSunday(y, m, d) {
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt;
}
// 헬퍼: 특정 주(일요일 시작)의 완료 횟수
function countWeekCompletions(idx, sunDt) {
  let c = 0;
  for (let i = 0; i < 7; i++) {
    const dt = new Date(sunDt.getFullYear(), sunDt.getMonth(), sunDt.getDate() + i);
    if (localDash.completions[`g${idx}_${dt.getFullYear()}_${dt.getMonth()+1}_${dt.getDate()}`]) c++;
  }
  return c;
}

function renderBSBody(idx) {
  const g = migrateGoal(localDash.goals[idx]), body = document.getElementById('bsBody');
  if (g.unit === 'once') { renderBSOnce(idx, body); return; }
  const y = viewMonth.year, m = viewMonth.month, now = new Date();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const isPrevMonth = (y === now.getFullYear() && m === now.getMonth()) || (now.getMonth() === 0 && y === now.getFullYear() - 1 && m === 12);
  const canEdit = isCurrentMonth || isPrevMonth;
  const { done, mod, pct } = goalPct(g, idx, y, m);
  const freq = getGoalFreq(g);
  const unitLabel = getUnitLabel(g);

  let html = '';

  // 주간 달성 배너 (once 제외, freq > 0)
  if (g.unit !== 'once' && freq > 0) {
    const curSun = getSunday(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const curDone = countWeekCompletions(idx, curSun);
    if (curDone >= freq) {
      html += `<div class="week-status-banner success">
        <div>
          <div class="wsb-title"><span class="wsb-badge" style="background:#10b981;">${unitLabel}</span> 목표 달성! 🎉</div>
          <div class="wsb-desc">이번 주 할당량(${freq}회)을 모두 채웠어요.</div>
        </div>
        <div class="wsb-icon">🏆</div>
      </div>`;
    } else {
      html += `<div class="week-status-banner">
        <div>
          <div class="wsb-title"><span class="wsb-badge" style="background:var(--accent);">${unitLabel}</span> 진행 중 🏃</div>
          <div class="wsb-desc">현재 ${curDone}회 완료! (앞으로 ${freq - curDone}번 더)</div>
        </div>
        <div class="wsb-icon">🔥</div>
      </div>`;
    }
  }

  // 월 네비게이션
  html += `<div class="month-nav"><button class="month-nav-btn" onclick="bsMonthPrev()">‹</button><div class="month-label">${y}년 ${m}월</div>`;
  const isFutureBlocked = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  html += `<button class="month-nav-btn" ${isFutureBlocked ? 'disabled' : ''} onclick="bsMonthNext()">›</button></div>`;

  // 달력 (주간 하이라이트 포함)
  html += renderCalendar(idx, g, y, m, canEdit);

  // 월별 요약
  html += `<div style="margin-top:12px;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-radius:12px;"><span style="font-size:13px;color:var(--text-dim);font-weight:700;">이번 달</span><div style="flex:1;height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${Math.min(pct,100)}%;background:linear-gradient(90deg,#1952f5,#a78bfa);border-radius:4px;"></div></div><span style="font-family:'Black Han Sans';font-size:16px;color:var(--accent);">${pct}%</span></div>`;

  // 6개월 통계
  html += renderStats6Month(idx, g);
  // 수정 / 삭제 버튼 (도전 카드와 통일)
  html += `<button class="proj-edit-btn" onclick="openHabitEdit(${idx})">✏️ 수정</button>`;
  html += `<button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteGoalFromBS(${idx})">🗑 삭제</button>`;
  body.innerHTML = html;
}

function renderCalendar(idx, g, y, m, canEdit) {
  const now = new Date(), days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const freq = getGoalFreq(g);
  const hasWeekCycle = g.unit !== 'once' && freq > 0;
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 주간 완료 횟수 캐시
  const sunCache = {};
  function isWeekCleared(yy, mm, dd) {
    if (!hasWeekCycle) return false;
    const sun = getSunday(yy, mm, dd);
    const sk = `${sun.getFullYear()}-${sun.getMonth()+1}-${sun.getDate()}`;
    if (sunCache[sk] === undefined) sunCache[sk] = countWeekCompletions(idx, sun);
    return sunCache[sk] >= freq;
  }

  let h = `<div class="cal-day-row">`;
  ['일', '월', '화', '수', '목', '금', '토'].forEach(d => h += `<div class="cal-day-lbl">${d}</div>`);
  h += `</div><div class="cal-grid">`;

  // 빈 셀 (이전 달)
  for (let i = 0; i < fd; i++) {
    const dt = new Date(y, m - 1, -fd + i + 1);
    const wc = isWeekCleared(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    h += `<div class="cal-cell empty ${wc ? 'week-cleared' : ''}"></div>`;
  }

  // 날짜 셀
  for (let d = 1; d <= days; d++) {
    const k = `g${idx}_${y}_${m}_${d}`, isDone = localDash.completions[k] === true;
    const cellDate = new Date(y, m - 1, d);
    const isToday = cellDate.getTime() === todayDate.getTime();
    const isFuture = cellDate > todayDate;
    const locked = !canEdit || isFuture;
    const wc = isWeekCleared(y, m, d);
    const onclick = locked ? '' : `onclick="bsToggleDay(${idx},${y},${m},${d})"`;

    h += `<div class="cal-cell ${isDone ? 'done' : ''} ${isToday ? 'cal-today' : ''} ${wc ? 'week-cleared' : ''} ${locked ? 'locked' : ''}" ${onclick}><span class="cal-dn">${d}</span><span class="cal-chk">${isDone ? '✓' : ''}</span></div>`;
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
  </div>${renderStats6Month(idx, migrateGoal(localDash.goals[idx]))}
  <button class="proj-edit-btn" onclick="openHabitEdit(${idx})">✏️ 수정</button>
  <button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteGoalFromBS(${idx})">🗑 삭제</button>`;
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

// ===== ADD HABIT FLOW =====
let _habitAddName = '';
let _habitCycle1 = null; // 'daily','once','w1','w2','w3','w4'
let _habitCycle2 = null; // number of times

window.habitAddStep2 = function () {
  const v = document.getElementById('newGoalInput').value.trim();
  if (!v) { showToast('이름을 입력해주세요', 'normal'); return; }
  _habitAddName = v;
  _habitCycle1 = null;
  _habitCycle2 = null;
  document.getElementById('bsTitle').textContent = '주기 설정';
  renderCycleStep();
};

function renderCycleStep() {
  const depth1Opts = [
    { label: '매일', val: 'daily' },
    { label: '1주에', val: 'w1' },
    { label: '2주에', val: 'w2' },
    { label: '3주에', val: 'w3' },
    { label: '4주에', val: 'w4' },
    { label: '한 번', val: 'once' },
  ];
  let h = `<div style="font-size:14px;font-weight:700;margin-bottom:4px;">${esc(_habitAddName)}</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">얼마나 자주 수행할 건가요?</div>`;
  // depth 1
  h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">`;
  depth1Opts.forEach(o => {
    const sel = _habitCycle1 === o.val;
    h += `<div class="unit-opt ${sel?'selected':''}" onclick="selectCycle1('${o.val}')">${o.label}</div>`;
  });
  h += `</div>`;
  // depth 2 (only for w1~w4)
  h += `<div id="cycle2Area"></div>`;

  // 시간대 선택
  const canConfirm = _habitCycle1 === 'daily' || _habitCycle1 === 'once' || (_habitCycle1 && _habitCycle2);
  if (canConfirm) {
    h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">시간대</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
    const timeOpts = [['any','🕒 무관'],['morning','🌅 아침'],['afternoon','☀️ 오후'],['evening','🌙 저녁']];
    timeOpts.forEach(([val, lbl], i) => {
      h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:700;color:#4b5563;cursor:pointer;">
        <input type="radio" name="habitTime" value="${val}" ${i===0?'checked':''} style="margin:0;"> ${lbl}</label>`;
    });
    h += `</div>`;

    // 카테고리 선택
    h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">카테고리</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">`;
    const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
    catOpts.forEach(([val, lbl], i) => {
      h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:11px;font-weight:700;color:#4b5563;cursor:pointer;">
        <input type="radio" name="habitCat" value="${val}" ${val==='etc'?'checked':''} style="margin:0;"> ${lbl}</label>`;
    });
    h += `</div>`;
  }

  h += `<button class="unit-confirm-btn" id="cycleConfirmBtn" onclick="confirmHabitAdd()" ${canConfirm?'':'disabled'}>확인</button>`;
  document.getElementById('bsBody').innerHTML = h;
  if (_habitCycle1 && _habitCycle1 !== 'daily' && _habitCycle1 !== 'once') {
    renderCycle2();
  }
}

window.selectCycle1 = function (val) {
  _habitCycle1 = val;
  _habitCycle2 = null;
  renderCycleStep();
};

function renderCycle2() {
  const area = document.getElementById('cycle2Area');
  if (!area) return;
  const weekNum = parseInt(_habitCycle1.slice(1));
  const maxDays = weekNum * 7;
  const quickNums = [1,2,3,4,5,6,7];
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">${weekNum}주에 몇 회?</div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">`;
  quickNums.forEach(n => {
    if (n > maxDays) return;
    const sel = _habitCycle2 === n;
    h += `<div class="unit-opt" style="flex:0 0 auto;min-width:44px;text-align:center;${sel?'background:var(--accent);color:#fff;border-color:var(--accent);':''}" onclick="selectCycle2(${n})">${n}회</div>`;
  });
  // custom button
  const isCustom = _habitCycle2 && _habitCycle2 > 7;
  h += `<div class="unit-opt" style="flex:0 0 auto;min-width:52px;text-align:center;${isCustom?'background:var(--accent);color:#fff;border-color:var(--accent);':''}" onclick="showCycle2Custom()">기타</div>`;
  h += `</div>`;
  h += `<div id="cycle2CustomArea"></div>`;
  area.innerHTML = h;
}

window.selectCycle2 = function (n) {
  _habitCycle2 = n;
  renderCycleStep();
};

window.showCycle2Custom = function () {
  const ca = document.getElementById('cycle2CustomArea');
  if (!ca) return;
  ca.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">
    <input type="number" id="cycle2CustomInput" class="proj-edit-input" style="width:80px;" min="1" max="28" placeholder="횟수">
    <span style="font-size:13px;color:var(--text-dim);">회</span>
    <button class="btn-sm" style="background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700;" onclick="applyCycle2Custom()">적용</button>
  </div>`;
  setTimeout(() => document.getElementById('cycle2CustomInput')?.focus(), 100);
};

window.applyCycle2Custom = function () {
  const v = parseInt(document.getElementById('cycle2CustomInput')?.value);
  if (!v || v < 1) { showToast('1 이상 입력', 'normal'); return; }
  _habitCycle2 = v;
  renderCycleStep();
};

window.confirmHabitAdd = async function () {
  if (!_habitCycle1) return;
  if (_habitCycle1 !== 'daily' && _habitCycle1 !== 'once' && !_habitCycle2) return;

  // find empty slot
  let slot = -1;
  for (let i = 0; i < MAX_HABITS; i++) {
    if (!localDash.goals[i] || !localDash.goals[i].title) { slot = i; break; }
  }
  if (slot === -1) { showToast('습관 최대 50개!', 'normal'); return; }

  let unit, freq, weeks;
  if (_habitCycle1 === 'daily') { unit = 'daily'; freq = 7; }
  else if (_habitCycle1 === 'once') { unit = 'once'; freq = 0; }
  else {
    const weekNum = parseInt(_habitCycle1.slice(1));
    if (weekNum === 1) { unit = 'weekly'; }
    else if (weekNum === 2) { unit = 'biweekly'; }
    else { unit = 'multiweek'; }
    freq = _habitCycle2;
    weeks = weekNum;
  }

  const time = document.querySelector('input[name="habitTime"]:checked')?.value || 'any';
  const category = document.querySelector('input[name="habitCat"]:checked')?.value || 'etc';

  const goalData = { title: _habitAddName, unit, freq, time, category };
  if (weeks) goalData.weeks = weeks;
  localDash.goals[slot] = goalData;
  await saveDash();
  _habitAddName = ''; _habitCycle1 = null; _habitCycle2 = null;
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  showToast('✅ 습관 등록 완료!', 'done');
};

// unit setup (for existing goals without unit - backward compat)
function openUnitSetupSheet(idx) {
  _habitAddName = localDash.goals[idx].title;
  _habitCycle1 = null;
  _habitCycle2 = null;
  document.getElementById('bsTitle').textContent = '주기 설정';
  // override confirmHabitAdd to update existing slot
  const origConfirm = window.confirmHabitAdd;
  window.confirmHabitAdd = async function () {
    if (!_habitCycle1) return;
    if (_habitCycle1 !== 'daily' && _habitCycle1 !== 'once' && !_habitCycle2) return;
    let unit, freq;
    if (_habitCycle1 === 'daily') { unit = 'daily'; freq = 7; }
    else if (_habitCycle1 === 'once') { unit = 'once'; freq = 0; }
    else {
      const weekNum = parseInt(_habitCycle1.slice(1));
      if (weekNum === 1) { unit = 'weekly'; }
      else if (weekNum === 2) { unit = 'biweekly'; }
      else { unit = 'multiweek'; }
      freq = _habitCycle2;
      localDash.goals[idx] = { ...localDash.goals[idx], unit, freq, weeks: weekNum };
      await saveDash();
      closeBottomSheet(); renderHabitCards(); renderAvatar();
      showToast('✅ 주기 설정 완료!', 'done');
      window.confirmHabitAdd = origConfirm;
      return;
    }
    localDash.goals[idx] = { ...localDash.goals[idx], unit, freq };
    await saveDash();
    closeBottomSheet(); renderHabitCards(); renderAvatar();
    showToast('✅ 주기 설정 완료!', 'done');
    window.confirmHabitAdd = origConfirm;
  };
  renderCycleStep();
  // add delete button
  const body = document.getElementById('bsBody');
  body.innerHTML += `<div style="margin-top:12px;"><button style="width:100%;background:transparent;border:2px solid var(--danger);border-radius:10px;padding:11px;font-size:13px;font-weight:700;color:var(--danger);cursor:pointer;font-family:'Noto Sans KR',sans-serif;" onclick="deleteGoal(${idx})">🗑 습관 삭제</button></div>`;
}

window.deleteGoal = async function (idx) {
  if (!confirm('이 습관을 삭제할까요?')) return;
  localDash.goals[idx] = null; await saveDash();
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  showToast('🗑 삭제됨', 'normal');
};

window.deleteGoalFromBS = async function (idx) {
  if (!confirm('정말 삭제하시겠습니까?\n\n삭제된 습관과 모든 기록은 복구할 수 없습니다.')) return;
  localDash.goals[idx] = null;
  // 관련 completions도 정리
  Object.keys(localDash.completions).forEach(k => {
    if (k.startsWith(`g${idx}_`)) delete localDash.completions[k];
  });
  await saveDash();
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  showToast('🗑 삭제됨', 'normal');
};

// ===== HABIT EDIT =====
window.openHabitEdit = function (idx) {
  const g = localDash.goals[idx];
  if (!g) return;
  document.getElementById('bsTitle').textContent = '습관 수정';
  const timeOpts = [['any','🕒 무관'],['morning','🌅 아침'],['afternoon','☀️ 오후'],['evening','🌙 저녁']];
  const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">습관 이름</div>`;
  h += `<input class="proj-edit-input" id="editGoalName" value="${esc(g.title)}" maxlength="20">`;
  h += `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin:12px 0 4px;">주기: ${getUnitLabel(migrateGoal(g))}</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">시간대</div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
  timeOpts.forEach(([val, lbl]) => {
    const sel = (g.time || 'any') === val;
    h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 12px;background:${sel?'var(--accent-light)':'#f8fafc'};border:1.5px solid ${sel?'var(--accent)':'#e2e8f0'};border-radius:8px;font-size:12px;font-weight:700;color:${sel?'var(--accent)':'#4b5563'};cursor:pointer;">
      <input type="radio" name="editTime" value="${val}" ${sel?'checked':''} style="margin:0;"> ${lbl}</label>`;
  });
  h += `</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">카테고리</div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">`;
  catOpts.forEach(([val, lbl]) => {
    const sel = (g.category || 'etc') === val;
    h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:${sel?'var(--accent-light)':'#f8fafc'};border:1.5px solid ${sel?'var(--accent)':'#e2e8f0'};border-radius:8px;font-size:11px;font-weight:700;color:${sel?'var(--accent)':'#4b5563'};cursor:pointer;">
      <input type="radio" name="editCat" value="${val}" ${sel?'checked':''} style="margin:0;"> ${lbl}</label>`;
  });
  h += `</div>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="renderBSBody(${idx});document.getElementById('bsTitle').textContent='${esc(g.title)}';">취소</button><button class="proj-save-btn save" onclick="saveHabitEdit(${idx})">저장</button></div>`;
  document.getElementById('bsBody').innerHTML = h;
};

window.saveHabitEdit = async function (idx) {
  const name = document.getElementById('editGoalName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }
  const time = document.querySelector('input[name="editTime"]:checked')?.value || 'any';
  const cat = document.querySelector('input[name="editCat"]:checked')?.value || 'etc';
  localDash.goals[idx].title = name;
  localDash.goals[idx].time = time;
  localDash.goals[idx].category = cat;
  await saveDash();
  document.getElementById('bsTitle').textContent = name;
  renderBSBody(idx);
  renderHabitCards();
  showToast('✅ 수정 완료', 'done');
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
const ADMIN_UNIT_LABELS = { once:'한 번', daily:'매일', w1:'주 1회', w2:'주 2~3회', w4:'주 4~5회', w6:'주 6회' };
const ADMIN_UNIT_FREQ = { once:0, daily:7, w1:1, w2:2, w4:4, w6:6 };
let _adminUsers = {}, _adminDash = {}, _adminGroups = {};
let _adminDetailTab = 'habit';

async function renderAdminList() {
  try {
    const [uSnap, dSnap, gSnap] = await Promise.all([
      get(ref(db, 'users')), get(ref(db, 'dashboards')), get(ref(db, 'groups'))
    ]);
    _adminUsers = uSnap.exists() ? uSnap.val() : {};
    _adminDash = dSnap.exists() ? dSnap.val() : {};
    _adminGroups = gSnap.exists() ? gSnap.val() : {};
    renderAdminUserTable();
    renderAdminGroupList();
    renderAdminNoticeList();
  } catch(e) { showToast('❌ 로드 오류: ' + e.message, 'normal'); }
}

function adminCountData(dash) {
  const goals = Array.isArray(dash.goals) ? dash.goals.filter(g=>g&&g.title) : [];
  const challenges = Array.isArray(dash.challenges) ? dash.challenges.filter(c=>c&&c.title) : [];
  return { habits: goals.length, challenges: challenges.length };
}

function renderAdminUserTable() {
  const tbl = document.getElementById('adminUserTable');
  const users = Object.entries(_adminUsers).filter(([,u]) => u.role !== 'admin');
  if (users.length === 0) { tbl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:12px;text-align:center;">등록된 유저 없음</div>'; return; }
  let h = '<table class="user-table"><thead><tr><th>유저</th><th>습관 / 도전</th><th>튜토리얼</th><th>마지막 접속</th><th>비밀번호</th><th></th></tr></thead><tbody>';
  for (const [id, u] of users) {
    const dash = _adminDash[id] || {};
    const { habits, challenges } = adminCountData(dash);
    const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '없음';
    const tut = dash.tutorialDone ? '<span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--accent-light);color:var(--accent);border:1px solid rgba(25,82,245,.2);">완료</span>' : '<span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--surface2);color:var(--text-dim);border:1px solid var(--border);">미완료</span>';
    h += '<tr class="user-row" onclick="showAdminUserDetail(\'' + id + '\')">' +
      '<td><span class="user-tbl-name">' + esc(u.name) + '</span><br><span style="font-size:11px;color:var(--text-dim);">@' + esc(id) + '</span></td>' +
      '<td><span style="font-size:11px;padding:2px 8px;border-radius:100px;background:rgba(25,82,245,.08);color:var(--accent);border:1px solid rgba(25,82,245,.15);margin-right:4px;">습관 ' + habits + '</span><span style="font-size:11px;padding:2px 8px;border-radius:100px;background:rgba(255,94,125,.08);color:var(--accent2);border:1px solid rgba(255,94,125,.15);">도전 ' + challenges + '</span></td>' +
      '<td>' + tut + '</td>' +
      '<td style="font-size:11px;color:var(--text-dim);">' + lastLogin + '</td>' +
      '<td onclick="event.stopPropagation()">' +
        '<div id="pwShow_' + id + '" style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:12px;color:var(--text-dim);font-family:monospace;">' + esc(u.password||'') + '</span>' +
          '<button class="btn-sm" style="padding:2px 8px;font-size:10px;" onclick="adminStartEditPw(\'' + id + '\')">수정</button>' +
        '</div>' +
        '<div id="pwEdit_' + id + '" style="display:none;gap:6px;align-items:center;">' +
          '<input id="pwInput_' + id + '" type="text" value="' + esc(u.password||'') + '" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-size:11px;font-family:monospace;width:80px;outline:none;">' +
          '<button class="btn-sm" style="padding:2px 8px;font-size:10px;background:var(--accent);color:#fff;border-color:var(--accent);" onclick="adminSavePw(\'' + id + '\')">저장</button>' +
          '<button class="btn-sm" style="padding:2px 8px;font-size:10px;" onclick="adminCancelPw(\'' + id + '\')">취소</button>' +
        '</div>' +
      '</td>' +
      '<td onclick="event.stopPropagation()"><button class="btn-sm" style="padding:2px 8px;font-size:10px;color:var(--danger);border-color:var(--danger);" onclick="adminDeleteUser(\'' + id + '\')">삭제</button></td>' +
    '</tr>';
  }
  h += '</tbody></table>';
  tbl.innerHTML = h;
}

window.adminStartEditPw = function(id) { document.getElementById('pwShow_'+id).style.display='none'; document.getElementById('pwEdit_'+id).style.display='flex'; };
window.adminCancelPw = function(id) { document.getElementById('pwShow_'+id).style.display='flex'; document.getElementById('pwEdit_'+id).style.display='none'; };
window.adminSavePw = async function(id) {
  const pw = document.getElementById('pwInput_'+id).value.trim();
  if (!pw) return;
  await set(ref(db, 'users/'+id+'/password'), pw);
  showToast('✅ 비밀번호 변경', 'done'); renderAdminList();
};
window.adminCreateUser = async function() {
  const name = document.getElementById('adminNewName').value.trim();
  const id = document.getElementById('adminNewId').value.trim();
  const pw = document.getElementById('adminNewPw').value.trim();
  if (!name||!id||!pw) { showToast('모든 항목 입력 필요', 'normal'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(id)) { showToast('아이디: 영문/숫자/_만', 'normal'); return; }
  if (_adminUsers[id]) { showToast('이미 존재하는 아이디', 'normal'); return; }
  await set(ref(db, 'users/'+id), { name: name, password: pw, role: 'user' });
  document.getElementById('adminNewName').value=''; document.getElementById('adminNewId').value=''; document.getElementById('adminNewPw').value='';
  showToast('✅ '+name+' 생성!', 'done'); renderAdminList();
};
window.adminDeleteUser = async function(id) {
  if (!confirm((_adminUsers[id]?.name||id)+' 계정 삭제?')) return;
  await Promise.all([set(ref(db,'users/'+id),null), set(ref(db,'dashboards/'+id),null)]);
  showToast('🗑 삭제됨', 'normal'); renderAdminList();
};

// ===== ADMIN USER DETAIL (overlay) =====
window.showAdminUserDetail = function(uid) {
  _adminDetailTab = 'habit';
  renderAdminDetail(uid);
  document.getElementById('adminDetailOverlay').style.display = 'block';
};
window.switchAdminDetailTab = function(uid, tab) {
  _adminDetailTab = tab;
  renderAdminDetail(uid);
};

function renderAdminDetail(uid) {
  const u = _adminUsers[uid]||{}, dash = _adminDash[uid]||{}, comp = dash.completions||{};
  const now = new Date(), cy = now.getFullYear(), cm = now.getMonth()+1;
  const { habits, challenges } = adminCountData(dash);
  const goals = Array.isArray(dash.goals)?dash.goals:[];
  const challengeArr = Array.isArray(dash.challenges)?dash.challenges.filter(function(c){return c&&c.title;}):[];
  const lastLogin = u.lastLogin?new Date(u.lastLogin).toLocaleString('ko'):'없음';

  // habit pct
  var tDone=0,tMod=0;
  goals.forEach(function(g,gi){ if(!g||!g.unit||g.unit==='once') return; var f=ADMIN_UNIT_FREQ[g.unit]||1; var dim=new Date(cy,cm,0).getDate(); var mod=f*Math.ceil(dim/7); var pfx='g'+gi+'_'+cy+'_'+cm+'_'; var d=Object.entries(comp).filter(function(e){return e[0].startsWith(pfx)&&e[1]===true;}).length; tDone+=d; tMod+=mod; });
  var habitPct = tMod>0?Math.min(100,Math.round(tDone/tMod*100)):0;
  // project pct
  var pjD=0,pjT=0;
  challengeArr.filter(function(c){return c.type==='project';}).forEach(function(c){ (c.stages||[]).forEach(function(s){ (s.tasks||[]).forEach(function(t){ pjT++; if(t.done)pjD++; }); }); });
  var projPct = pjT>0?Math.round(pjD/pjT*100):0;

  var panel = document.getElementById('adminDetailPanel');
  var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<div><div style="font-family:Black Han Sans;font-size:20px;">'+esc(u.name||uid)+'</div><div style="font-size:12px;color:var(--text-dim);">@'+esc(uid)+' · '+lastLogin+'</div></div>' +
    '<button class="btn-sm" onclick="document.getElementById(\'adminDetailOverlay\').style.display=\'none\'">✕</button></div>';
  // meta cards
  var hpCol = habitPct>=70?'var(--accent3)':habitPct>=40?'orange':'var(--danger)';
  var ppCol = projPct>=70?'var(--accent3)':projPct>=40?'orange':'var(--accent)';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;">' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">습관</div><div style="font-family:Black Han Sans;font-size:20px;color:var(--accent);">'+habits+'개</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">습관 달성률</div><div style="font-family:Black Han Sans;font-size:20px;color:'+hpCol+';">'+habitPct+'%</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">도전</div><div style="font-family:Black Han Sans;font-size:20px;color:var(--accent2);">'+challenges+'개</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">프로젝트</div><div style="font-family:Black Han Sans;font-size:20px;color:'+ppCol+';">'+projPct+'%</div></div></div>';
  // tabs
  h += '<div style="display:flex;gap:4px;margin-bottom:14px;background:var(--surface);border-radius:10px;padding:3px;">' +
    '<button class="btn-sm" style="flex:1;text-align:center;'+(_adminDetailTab==='habit'?'background:var(--accent-light);color:var(--accent);border-color:var(--accent);':'')+'" onclick="switchAdminDetailTab(\''+uid+'\',\'habit\')">🎯 습관 ('+habits+')</button>' +
    '<button class="btn-sm" style="flex:1;text-align:center;'+(_adminDetailTab==='challenge'?'background:var(--accent-light);color:var(--accent);border-color:var(--accent);':'')+'" onclick="switchAdminDetailTab(\''+uid+'\',\'challenge\')">⭐ 도전 ('+challenges+')</button></div>';

  if (_adminDetailTab === 'habit') {
    var hasGoal = false;
    goals.forEach(function(g,gi){
      if(!g||!g.title||!g.unit) return; hasGoal = true;
      var freq=ADMIN_UNIT_FREQ[g.unit]||1; var pct=0,done=0,mod=0;
      if(g.unit==='once'){ done=comp['g'+gi+'_once']===true?1:0; mod=1; pct=done*100; }
      else { var dim=new Date(cy,cm,0).getDate(); mod=freq*Math.ceil(dim/7); var pfx='g'+gi+'_'+cy+'_'+cm+'_'; done=Object.entries(comp).filter(function(e){return e[0].startsWith(pfx)&&e[1]===true;}).length; pct=mod>0?Math.min(100,Math.round(done/mod*100)):0; }
      var col=pct>=70?'var(--accent3)':pct>=40?'orange':'var(--danger)';
      h += '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:13px;font-weight:700;">'+esc(g.title)+'</div><div style="font-family:Black Han Sans;font-size:18px;color:'+col+';">'+pct+'%</div></div>' +
        '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:6px;"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:2px;"></div></div>' +
        '<div style="display:flex;gap:4px;"><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);">'+(ADMIN_UNIT_LABELS[g.unit]||g.unit)+'</span><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);">'+done+'/'+mod+'</span></div></div>';
    });
    if(!hasGoal) h += '<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:20px 0;">등록된 습관 없음</div>';
  } else {
    if(challengeArr.length===0) h += '<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:20px 0;">등록된 도전 없음</div>';
    challengeArr.forEach(function(c){
      if(c.type==='bucket') {
        var isDone=c.done===true;
        h += '<div style="background:var(--surface);border:2px solid '+(isDone?'rgba(0,185,107,.3)':'var(--border)')+';border-radius:10px;padding:12px 14px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><div style="font-size:13px;font-weight:700;">'+(isDone?'✨ ':'')+esc(c.title)+'</div><div style="font-size:13px;font-weight:700;color:'+(isDone?'#00b96b':'var(--text-dim)')+';">'+(isDone?'달성':'진행중')+'</div></div>' +
          '<div style="display:flex;gap:4px;"><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:rgba(255,94,125,.08);border:1px solid rgba(255,94,125,.2);color:var(--accent2);">버킷리스트</span></div></div>';
      } else if(c.type==='project') {
        var td2=0,tt2=0;
        (c.stages||[]).forEach(function(s){(s.tasks||[]).forEach(function(t){tt2++;if(t.done)td2++;});});
        var pp2=tt2>0?Math.round(td2/tt2*100):0;
        var col2=pp2>=70?'var(--accent3)':pp2>=40?'orange':'var(--danger)';
        var stH='';
        (c.stages||[]).forEach(function(s,si){ var st=s.tasks||[]; var sd=st.filter(function(t){return t.done;}).length; stH+='<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding-left:4px;"><div style="width:18px;height:18px;border-radius:50%;background:'+(sd===st.length&&st.length>0?'rgba(0,185,107,.2)':'var(--border)')+';display:flex;align-items:center;justify-content:center;font-size:9px;color:'+(sd===st.length&&st.length>0?'#00b96b':'var(--text-dim)')+';flex-shrink:0;">'+(si+1)+'</div><div style="font-size:12px;font-weight:700;">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--text-dim);margin-left:auto;">'+sd+'/'+st.length+'</div></div>'; });
        h += '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:13px;font-weight:700;">'+esc(c.title)+'</div><div style="font-family:Black Han Sans;font-size:18px;color:'+col2+';">'+pp2+'%</div></div>' +
          '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:6px;"><div style="height:100%;width:'+pp2+'%;background:'+col2+';border-radius:2px;"></div></div>' +
          '<div style="display:flex;gap:4px;margin-bottom:4px;"><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:rgba(25,82,245,.08);border:1px solid rgba(25,82,245,.15);color:var(--accent);">프로젝트</span><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);">'+td2+'/'+tt2+'</span></div>' +
          stH + '</div>';
      }
    });
  }
  panel.innerHTML = h;
}

// ===== ADMIN GROUP =====
function renderAdminGroupList() {
  var gl = document.getElementById('adminGroupList');
  var groups = Object.entries(_adminGroups);
  var nonAdmin = Object.entries(_adminUsers).filter(function(e){return e[1].role!=='admin';});
  if (groups.length === 0) { gl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;text-align:center;">그룹 없음</div>'; return; }
  var h = '';
  groups.forEach(function(entry) {
    var gid = entry[0], g = entry[1];
    var members = g.members ? Object.entries(g.members) : [];
    var chips = members.map(function(m) {
      var mk=m[0],uid=m[1]; return '<span style="display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:100px;padding:3px 10px;font-size:11px;margin:2px;">'+esc(_adminUsers[uid]?.name||uid)+' <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:13px;line-height:1;padding:0 2px;" onclick="adminRemoveMember(\''+gid+'\',\''+mk+'\')">×</button></span>';
    }).join('');
    var addOpts = nonAdmin.filter(function(e){return !members.some(function(m){return m[1]===e[0];});}).map(function(e){return '<option value="'+e[0]+'">'+esc(e[1].name)+'</option>';}).join('');
    h += '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><div style="font-family:Black Han Sans;font-size:14px;">📁 '+esc(g.name)+'</div><button class="btn-sm" style="padding:2px 8px;font-size:10px;color:var(--danger);border-color:var(--danger);" onclick="adminDeleteGroup(\''+gid+'\')">삭제</button></div>' +
      '<div style="margin-bottom:8px;">'+(chips||'<span style="color:var(--text-dim);font-size:11px;">멤버 없음</span>')+'</div>' +
      (addOpts?'<div style="display:flex;gap:6px;"><select id="gsel_'+gid+'" style="flex:1;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:6px 8px;color:var(--text);font-size:12px;font-family:Noto Sans KR,sans-serif;outline:none;"><option value="">+ 멤버 추가</option>'+addOpts+'</select><button class="btn-sm" style="padding:4px 10px;font-size:11px;background:var(--accent);color:#fff;border-color:var(--accent);" onclick="adminAddMember(\''+gid+'\')">추가</button></div>':'') +
    '</div>';
  });
  gl.innerHTML = h;
}

window.adminCreateGroup = async function() {
  var name = document.getElementById('adminNewGroupName').value.trim();
  if (!name) return;
  await push(ref(db,'groups'), { name: name, members:{} });
  document.getElementById('adminNewGroupName').value = '';
  showToast('✅ "'+name+'" 그룹 생성!', 'done'); renderAdminList();
};
window.adminDeleteGroup = async function(gid) {
  if (!confirm('그룹 삭제?')) return;
  await set(ref(db,'groups/'+gid), null);
  showToast('🗑 삭제됨', 'normal'); renderAdminList();
};
window.adminAddMember = async function(gid) {
  var sel = document.getElementById('gsel_'+gid);
  var uid = sel?.value; if (!uid) return;
  await set(ref(db,'groups/'+gid+'/members/'+uid+'_'+Date.now()), uid);
  showToast('✅ 멤버 추가!', 'done'); renderAdminList();
};
window.adminRemoveMember = async function(gid, mk) {
  await set(ref(db,'groups/'+gid+'/members/'+mk), null);
  showToast('✅ 제거됨', 'done'); renderAdminList();
};

// ===== ADMIN NOTICE LIST =====
async function renderAdminNoticeList() {
  var nl = document.getElementById('adminNoticeList');
  var nSnap = await get(ref(db, 'notices'));
  if (!nSnap.exists()) { nl.innerHTML = ''; return; }
  var nh = '';
  Object.entries(nSnap.val()).sort(function(a,b){return (b[1].createdAt||'').localeCompare(a[1].createdAt||'');}).forEach(function(entry){
    var nid=entry[0], n=entry[1];
    nh += '<div class="notice-card"><div class="notice-card-info"><div class="notice-card-title">'+esc(n.title)+'</div><div class="notice-card-meta">'+n.target+' · '+new Date(n.createdAt).toLocaleDateString('ko')+'</div></div><button class="notice-card-del" onclick="deleteNotice(\''+nid+'\')">삭제</button></div>';
  });
  nl.innerHTML = nh;
}

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
        em.style.transition = 'all 1.6s cubic-bezier(.15,.9,.3,1)';
        em.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        em.style.opacity = '0';
      });
      setTimeout(() => em.remove(), 1800);
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
// ===== CELEBRATION EFFECTS =====
function triggerHaptic(style) {
  if (navigator.vibrate) {
    if (style === 'heavy') navigator.vibrate([30, 50, 30, 50, 60]);
    else if (style === 'light') navigator.vibrate(15);
    else navigator.vibrate(10);
  }
}

function showConfetti() {
  const c = document.getElementById('confettiContainer');
  const colors = ['#1952f5', '#ff5e7d', '#f5c518', '#00b96b', '#a78bfa', '#ff9f43', '#38bdf8', '#e879f9'];
  const shapes = ['square', 'circle', 'strip'];
  for (let i = 0; i < 200; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 5 + Math.random() * 10;
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    if (shape === 'circle') { p.style.width = size + 'px'; p.style.height = size + 'px'; p.style.borderRadius = '50%'; }
    else if (shape === 'strip') { p.style.width = (3 + Math.random() * 4) + 'px'; p.style.height = (12 + Math.random() * 16) + 'px'; p.style.borderRadius = '2px'; }
    else { p.style.width = size + 'px'; p.style.height = size + 'px'; }
    p.style.animationDuration = (1.8 + Math.random() * 2.5) + 's';
    p.style.animationDelay = Math.random() * 0.6 + 's';
    c.appendChild(p); setTimeout(() => p.remove(), 5000);
  }
  triggerHaptic('heavy');
  shakeScreen();
}

function showConfettiSmall() {
  const c = document.getElementById('confettiContainer');
  const colors = ['#1952f5', '#a78bfa', '#ff5e7d', '#f5c518', '#00b96b', '#38bdf8'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    const size = 4 + Math.random() * 8;
    p.style.left = (20 + Math.random() * 60) + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = size + 'px'; p.style.height = size + 'px';
    if (Math.random() > 0.5) p.style.borderRadius = '50%';
    p.style.animationDuration = (1.2 + Math.random() * 1.8) + 's';
    p.style.animationDelay = Math.random() * 0.3 + 's';
    c.appendChild(p); setTimeout(() => p.remove(), 3500);
  }
  triggerHaptic('light');
}

function shakeScreen() {
  const el = document.querySelector('#dashboardScreen .mobile-wrap');
  if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 800); }
}
