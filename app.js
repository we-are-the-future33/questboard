import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, remove, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const APP_VERSION = '20260305f';

const _safetyTimer = setTimeout(() => {
  const l = $id('loadingScreen');
  if (l && l.classList.contains('active')) { showScreen('loginScreen'); }
}, 8000);

// 3초 이상 걸리면 메시지 변경
setTimeout(() => {
  const msg = $id('loadingMsg');
  const l = $id('loadingScreen');
  if (msg && l && l.classList.contains('active')) { msg.textContent = '서버 연결 중...'; }
}, 3000);

// Update check — fetch index.html and compare version
let _updateBannerShown = false;
async function checkAppUpdate() {
  if (_updateBannerShown) return;
  try {
    const res = await fetch('index.html?_t=' + Date.now() + '&_r=' + Math.random(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' }
    });
    const text = await res.text();
    const match = text.match(/app\.js\?v=(\w+)/);
    if (match && match[1] !== APP_VERSION) {
      _updateBannerShown = true;
      const banner = document.createElement('div');
      banner.className = 'update-banner';
      banner.innerHTML = `<span>🔄 새 버전이 있어요!</span><button onclick="location.reload(true)">업데이트</button>`;
      document.body.appendChild(banner);
    }
  } catch (e) {}
}
setTimeout(checkAppUpdate, 3000);
setInterval(checkAppUpdate, 3 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    setTimeout(checkAppUpdate, 1000);
  }
});

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
let messaging = null;
try { messaging = getMessaging(app); } catch(e) { console.log('FCM not supported:', e); }

const VAPID_KEY = 'BEA4OQQCKYaTZDGxbij7La0fMmyxDSyN1qWYxronV3ki1GwYB3mz8LXTRlo01lGjFLiM7LHY8JQr5EFyyfmlbHs';

async function setupFCM() {
  if (!messaging || !currentUser) return;
  // 이미 권한 허용됨 → 바로 토큰 등록
  if (Notification.permission === 'granted') {
    await registerFCMToken();
    return;
  }
  // 이미 거부됨 → 스킵
  if (Notification.permission === 'denied') return;
  // 이미 한 번 물어봤으면 스킵
  if (localStorage.getItem('kw_notiAsked')) return;
  // 안내 모달 표시
  showNotiPermissionModal();
}

function showNotiPermissionModal() {
  let overlay = $id('notiPermOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'notiPermOverlay';
  overlay.className = 'noti-perm-overlay';
  overlay.innerHTML = `
    <div class="noti-perm-modal">
      <div class="noti-perm-icon">🔔</div>
      <div class="noti-perm-title">알림을 받아보시겠어요?</div>
      <div class="noti-perm-desc">습관 리마인더와 친구 응원 알림을<br>받을 수 있어요!</div>
      <div class="noti-perm-btns">
        <button class="noti-perm-later" onclick="dismissNotiPerm()">나중에</button>
        <button class="noti-perm-ok" onclick="acceptNotiPerm()">좋아요!</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

window.acceptNotiPerm = async function () {
  closeNotiPermModal();
  localStorage.setItem('kw_notiAsked', '1');
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerFCMToken();
      showToast('🔔 알림 설정 완료!', 'done');
    }
  } catch (e) {}
};

window.dismissNotiPerm = function () {
  closeNotiPermModal();
  localStorage.setItem('kw_notiAsked', '1');
};

function closeNotiPermModal() {
  const overlay = $id('notiPermOverlay');
  if (overlay) { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); }
}

async function registerFCMToken() {
  try {
    const reg = await navigator.serviceWorker.register((location.pathname.includes('/questboard') ? '/questboard/' : '/') + 'firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) {
      await set(ref(db, `fcmTokens/${currentUser.id}`), { token, updatedAt: Date.now() });
      console.log('FCM 토큰 저장 완료');
    }
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      showToast(body || '🐹 알림이 도착했어요!', 'done');
    });
  } catch (e) {
    console.log('FCM 토큰 등록 실패:', e);
  }
}

// ===== 상수 =====
const MAX_HABITS = 25;
const MAX_CHALLENGES = 25;
const TUT_STEPS = 5;
const LEGACY_MAP = { w1:{unit:'weekly',freq:1}, w2:{unit:'weekly',freq:2}, w4:{unit:'weekly',freq:4}, w6:{unit:'weekly',freq:6} };
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

// Friend animal emojis - deterministic per user ID
const FRIEND_ANIMALS = ['🐶','🐱','🐻','🦊','🐰','🐼','🐨','🦁','🐯','🐮','🐷','🐸','🐵','🦄','🐺','🦝','🦒','🐘','🦩','🦉','🐧','🐬','🦋','🐢','🦈'];
function getFriendEmoji(fid) {
  let hash = 0;
  for (let i = 0; i < fid.length; i++) { hash = ((hash << 5) - hash) + fid.charCodeAt(i); hash |= 0; }
  return FRIEND_ANIMALS[Math.abs(hash) % FRIEND_ANIMALS.length];
}

// ===== 상태 =====
let currentUser = null;
let localDash = null;
let activeGoalIdx = null;
let viewMonth = null;
let habitFilter = localStorage.getItem('kw_habitFilter') || 'active';
let challengeFilter = localStorage.getItem('kw_challengeFilter') || 'active';
let habitViewMode = localStorage.getItem('kw_habitViewMode') || 'time';
let challengeViewMode = localStorage.getItem('kw_challengeViewMode') || 'month';
let _createType = 'bucket';
let _createCat = null;
let _createMonth = null;
let _createStages = [];

const TIME_LABELS = { any: '🔄 언제나', dawn: '🌅 새벽', morning: '🌤 아침', midday: '🏞 낮', afternoon: '🌇 오후', evening: '🌟 저녁', night: '🦉 밤' };
const CAT_LABELS = { health: '💪 건강 & 체력', diet: '🥗 식단 & 영양', study: '📚 학습 & 성장', work: '💼 업무 & 커리어', finance: '💰 재무 & 자산', life: '🌱 생활 & 루틴', home: '🧹 집안일 & 정리', hobby: '🎨 취미 & 창작', social: '🤝 관계 & 소셜', mental: '🧘 휴식 & 멘탈', etc: '📦 기타' };
const TYPE_LABELS = { bucket: '🎯 버킷리스트', project: '📋 프로젝트' };

// ===== 요리 시스템 상수 =====
const INGREDIENTS = {
  flour:      { emoji: '🌾', name: '밀가루', type: 'normal' },
  milk:       { emoji: '🥛', name: '우유', type: 'normal' },
  egg:        { emoji: '🥚', name: '계란', type: 'normal' },
  rice:       { emoji: '🍚', name: '쌀', type: 'normal' },
  strawberry: { emoji: '🍓', name: '딸기', type: 'special', minLv: 0 },
  chocolate:  { emoji: '🍫', name: '초콜릿', type: 'special', minLv: 0 },
  cheese:     { emoji: '🧀', name: '치즈', type: 'special', minLv: 0 },
  honey:      { emoji: '🍯', name: '꿀', type: 'special', minLv: 0 },
  apple:      { emoji: '🍎', name: '사과', type: 'special', minLv: 0 },
  blueberry:  { emoji: '🫐', name: '블루베리', type: 'special', minLv: 6 },
  chestnut:   { emoji: '🌰', name: '밤', type: 'special', minLv: 6 },
  peach:      { emoji: '🍑', name: '복숭아', type: 'special', minLv: 6 }
};
const INGREDIENT_ORDER = ['flour','milk','egg','rice','strawberry','chocolate','cheese','honey','apple','blueberry','chestnut','peach'];
const INGREDIENT_CAP = 9;

const RECIPES = [
  { id:0,  name:'딸기 우유',           emoji:'🧃', lv:1, ingredients:['milk','strawberry'] },
  { id:1,  name:'초코 쿠키',           emoji:'🍪', lv:1, ingredients:['flour','chocolate'] },
  { id:2,  name:'달콤한 꿀떡',          emoji:'🍡', lv:1, ingredients:['rice','honey'] },
  { id:3,  name:'치즈 케이크',          emoji:'🧀', lv:2, ingredients:['flour','egg','cheese'] },
  { id:4,  name:'애플 파이',           emoji:'🥧', lv:2, ingredients:['flour','milk','apple'] },
  { id:5,  name:'초코 푸딩',           emoji:'🍮', lv:2, ingredients:['milk','egg','chocolate'] },
  { id:6,  name:'복숭아 치즈 타르트',    emoji:'🍑', lv:3, ingredients:['flour','peach','cheese'] },
  { id:7,  name:'블루베리 요거트',       emoji:'🫐', lv:3, ingredients:['milk','blueberry','honey'] },
  { id:8,  name:'달콤 밤 찹쌀떡',       emoji:'🌰', lv:3, ingredients:['rice','chestnut','honey'] },
  { id:9,  name:'블루베리 생크림 케이크', emoji:'🎂', lv:4, ingredients:['flour','milk','egg','blueberry'] },
  { id:10, name:'초코 밤 몽블랑',       emoji:'🌰', lv:4, ingredients:['flour','egg','chocolate','chestnut'] },
  { id:11, name:'궁극의 복숭아 파르페',   emoji:'🍨', lv:4, ingredients:['milk','peach','strawberry','blueberry'] }
];

const MILESTONE_STAGES = [25, 50, 75, 100];
const STAGE_MESSAGES = [
  { min:0,   max:24,  msg:'💤... 25% 달성해서 나를 깨워줘!' },
  { min:25,  max:49,  msg:'앗, 햄스터 출몰! 🐹 이제 기본 재료를 모아줘' },
  { min:50,  max:74,  msg:'야호! 절반 넘었어! 이제 스페셜 재료를 모으자 ✨' },
  { min:75,  max:99,  msg:'좋아, 조금만 더 하면 100% 완벽한 하루야! 🔥' },
  { min:100, max:999, msg:'오늘 미션 컴플리트! 진짜 대박이야! 👑' }
];
function formatTargetMonth(tm) {
  if (!tm || tm === 'someday') return '☁️ 언젠가';
  const parts = tm.split('-');
  return `📅 ${parts[0]}년 ${parseInt(parts[1])}월`;
}

function setHabitMetaTags(g) {
  const el = $id('bsMetaTags');
  if (!el) return;
  const unitLbl = getUnitLabel(g);
  const timeLbl = TIME_LABELS[g.time || 'any'] || '🔄 언제나';
  const catLbl = CAT_LABELS[g.category || 'etc'] || '📦 기타';
  let html = `<span class="bs-meta-chip">${unitLbl}</span><span class="bs-meta-chip">${timeLbl}</span><span class="bs-meta-chip">${catLbl}</span>`;
  if (g.public === false) html += '<span class="bs-meta-chip">🔒 비공개</span>';
  el.innerHTML = html;
}
function setChallengeMetaTags(c) {
  const el = $id('bsMetaTags');
  if (!el) return;
  const typeLbl = TYPE_LABELS[c.type || 'bucket'] || '🎯 버킷리스트';
  const catLbl = CAT_LABELS[c.category || 'etc'] || '📦 기타';
  const monthLbl = formatTargetMonth(c.targetMonth);
  let html = `<span class="bs-meta-chip">${typeLbl}</span><span class="bs-meta-chip">${catLbl}</span><span class="bs-meta-chip">${monthLbl}</span>`;
  if (c.public === false) html += '<span class="bs-meta-chip">🔒 비공개</span>';
  el.innerHTML = html;
}
function clearMetaTags() {
  const el = $id('bsMetaTags');
  if (el) el.innerHTML = '';
}
function groupLabel(label) {
  const m = label.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
  if (m) return `<span class="group-header-emoji">${m[1]}</span>${label.slice(m[0].length)}`;
  return label;
}
// 그룹별 아코디언 렌더링 공통 헬퍼
function renderGroupedGrid(groups, prefix, labels, renderItem) {
  let html = '', gIdx = 0;
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) return;
    const label = labels[key] || key;
    html += `<div class="group-header" onclick="toggleGroupAccordion('${prefix}_${gIdx}')">
      <div class="group-header-left">${groupLabel(label)} <span style="font-size:12px;color:var(--accent);">${groups[key].length}</span></div>
      <div class="group-toggle-icon" id="${prefix}i_${gIdx}">▼</div>
    </div><div class="card-grid" id="${prefix}_${gIdx}">`;
    groups[key].forEach(item => { html += renderItem(item); });
    html += `</div>`;
    gIdx++;
  });
  return html;
}
let currentSubTab = 'habit';

// ===== DOM 헬퍼 =====
const $id = (id) => document.getElementById(id);
const $html = (id, html) => { const el = $id(id); if (el) el.innerHTML = html; return el; };
const $text = (id, txt) => { const el = $id(id); if (el) el.textContent = txt; return el; };
const $show = (id) => { const el = $id(id); if (el) el.style.display = ''; return el; };
const $hide = (id) => { const el = $id(id); if (el) el.style.display = 'none'; return el; };
const $toggle = (id, cls, force) => { const el = $id(id); if (el) el.classList.toggle(cls, force); return el; };

// 클립보드 복사 헬퍼
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    return true;
  }
}

// 자동 습관 완료 판정 헬퍼
// value: completions[key] 값 (true | number | {h,kcal,min,km} | undefined)
// goal: 해당 goal 객체 (auto, autoTarget, autoUnit 포함)
function isCompDone(value, goal) {
  if (value === true) return true;
  if (!value || !goal?.auto) return false;
  if (typeof value === 'number') return value >= (goal.autoTarget || 0);
  if (typeof value === 'object') {
    const unit = goal.autoUnit || (goal.auto === 'sleep' ? 'h' : 'kcal');
    return (value[unit] || 0) >= (goal.autoTarget || 0);
  }
  return false;
}
// 자동 습관 수치 추출 (달력/카드 표시용)
function getAutoValue(value, goal) {
  if (!value || value === true) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    const unit = goal?.autoUnit || (goal?.auto === 'sleep' ? 'h' : 'kcal');
    return value[unit] ?? null;
  }
  return null;
}
// 자동 습관 표시 단위
function getAutoUnitLabel(goal) {
  if (!goal?.auto) return '';
  const u = goal.autoUnit || (goal.auto === 'sleep' ? 'h' : 'kcal');
  return { h: 'h', kcal: 'kcal', min: 'min', km: 'km' }[u] || u;
}

// ===== 유틸리티 =====
function esc(s) { const d = document.createElement('div'); d.textContent = s||''; return d.innerHTML; }
function isPublic(item) { return item.public !== false; }
function migrateGoal(g) { if (!g) return g; if (LEGACY_MAP[g.unit]) return Object.assign({}, g, LEGACY_MAP[g.unit]); return g; }
function getGoalFreq(g) {
  if (!g) return 1; g = migrateGoal(g);
  if (g.unit === 'once') return 0;
  if (g.unit === 'daily' || g.unit === 'health_sleep') return 7;
  if (g.unit === 'health_workout') return 7;
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
  if (g.unit === 'health_workout') return getMonthDays(y, m);
  if (g.unit === 'weekly') return (g.freq || 1) * getMonthWeeks(y, m);
  if (g.unit === 'biweekly') return (g.freq || 1) * Math.ceil(getMonthDays(y, m) / 14);
  if (g.unit === 'multiweek') return (g.freq || 1) * Math.ceil(getMonthDays(y, m) / ((g.weeks||3) * 7));
  return 1;
}
function goalDone(g, gi, y, m) {
  if (!g || !g.unit) return 0;
  if (g.unit === 'once') return isCompDone(localDash.completions[`g${gi}_once`], g) ? 1 : 0;
  const pfx = `g${gi}_${y}_${m}_`;
  return Object.entries(localDash.completions).filter(([k, v]) => k.startsWith(pfx) && isCompDone(v, g)).length;
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

// ===== 연속 달성 =====
function calcStreak(g, gi) {
  if (!g || !g.unit || g.unit === 'once') return 0;
  g = migrateGoal(g);
  const now = new Date();
  if (g.unit === 'daily' || g.unit === 'health_sleep' || g.unit === 'health_workout') {
    let streak = 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (isCompDone(localDash.completions[`g${gi}_${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}`], g)) streak++;
      else break;
    }
    return streak;
  }
  if (g.unit === 'weekly') {
    const freq = g.freq || 1;
    let streak = 0;
    const dow = now.getDay();
    const sun = new Date(now); sun.setDate(now.getDate() - dow);
    for (let w = 1; w <= 52; w++) {
      const ws = new Date(sun); ws.setDate(sun.getDate() - w * 7);
      let wd = 0;
      for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (isCompDone(localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], g)) wd++; }
      if (wd >= freq) streak++; else break;
    }
    let tw = 0;
    for (let d = 0; d < 7; d++) { const dd = new Date(sun); dd.setDate(sun.getDate() + d); if (dd > now) break; if (isCompDone(localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], g)) tw++; }
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
      for (let d = 0; d < 14; d++) { const dd = new Date(cs); dd.setDate(cs.getDate() + d); if (isCompDone(localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], g)) cd++; }
      if (cd >= freq) streak++; else break;
    }
    return streak;
  }
  return 0;
}
function getStreakLabel(g, streak) {
  if (!g) return ''; g = migrateGoal(g);
  if (g.unit === 'daily' || g.unit === 'health_sleep' || g.unit === 'health_workout') return `${streak}일째`;
  if (g.unit === 'weekly') return `${streak}주째`;
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
    for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (dd > now) break; if (isCompDone(localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], g)) wd++; }
    return wd < freq;
  }
  if (g.unit === 'biweekly') {
    let cd = 0; const cs = new Date(ws); cs.setDate(ws.getDate() - 7);
    for (let d = 0; d < 14; d++) { const dd = new Date(cs); dd.setDate(cs.getDate() + d); if (dd > now) break; if (isCompDone(localDash.completions[`g${gi}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], g)) cd++; }
    return cd < freq;
  }
  return true;
}

// ===== 화면 전환 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $id(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id !== 'dashboardScreen') stopTypingLoop();
}

// ===== 데이터베이스 =====
async function loadDash() {
  const snap = await get(ref(db, `dashboards/${currentUser.id}`));
  localDash = snap.exists() ? snap.val() : {};
  if (!localDash.goals) localDash.goals = [];
  if (!localDash.completions) localDash.completions = {};
  if (!localDash.challenges) localDash.challenges = [];
  // Cooking system init
  if (!localDash.cooking) localDash.cooking = {};
  const ck = localDash.cooking;
  if (ck.currentScenarioId === undefined) ck.currentScenarioId = 0;
  if (!Array.isArray(ck.clearedRecipes)) ck.clearedRecipes = [];
  if (!ck.inventory) ck.inventory = {};
  INGREDIENT_ORDER.forEach(k => { if (ck.inventory[k] === undefined) ck.inventory[k] = 0; });
  if (!ck.milestoneToday) ck.milestoneToday = '';
  if (!Array.isArray(ck.milestoneReached)) ck.milestoneReached = [];
  if (!ck.milestoneDrops) ck.milestoneDrops = {};
  // Reset milestone if day changed
  const todayStr = new Date().toISOString().slice(0, 10);
  if (ck.milestoneToday !== todayStr) { ck.milestoneToday = todayStr; ck.milestoneReached = []; ck.milestoneDrops = {}; }
}
async function saveDash() { localDash.lastUpdate = new Date().toISOString(); await set(ref(db, `dashboards/${currentUser.id}`), localDash); }

// ===== 초기화 =====
async function init() {
  const saved = JSON.parse(localStorage.getItem('qb_login') || 'null');
  if (saved && saved.id && saved.pw) {
    showScreen('loadingScreen');
    try {
      const snap = await Promise.race([get(ref(db, `users/${saved.id}`)), new Promise((_, r) => setTimeout(() => r('timeout'), 5000))]);
      if (snap.exists() && snap.val().password === saved.pw) {
        const u = snap.val(); currentUser = { id: saved.id, ...u };
        $id('navUserName').textContent = u.name;
        if (u.role === 'admin') { clearTimeout(_safetyTimer); showScreen('adminScreen'); renderAdminList(); return; }
        await loadDash();
        activeGoalIdx = null; viewMonth = null; showScreen('dashboardScreen'); await setupDashTabs(saved.id); renderDashboard();
        clearTimeout(_safetyTimer); return;
      }
    } catch (e) {}
  }
  clearTimeout(_safetyTimer);
  if (saved) { $id('loginId').value = saved.id || ''; $id('loginPw').value = saved.pw || ''; $id('saveLoginChk').checked = true; }
  showScreen('loginScreen');
}
init();

async function setupDashTabs(uid) {
  const snap = await get(ref(db, 'groups'));
  let has = false;
  if (snap.exists()) has = Object.values(snap.val()).some(g => g.members && Object.values(g.members).includes(uid));
  $id('dashTabBar').style.display = has ? 'flex' : 'none';
}

// ===== 로그인 =====
window.doLogin = async function () {
  const id = $id('loginId').value.trim(), pw = $id('loginPw').value;
  const btn = $id('loginBtn'), saveChk = $id('saveLoginChk').checked;
  if (!id || !pw) return; btn.disabled = true; btn.textContent = '확인 중...';
  try {
    const snap = await get(ref(db, `users/${id}`));
    if (!snap.exists() || snap.val().password !== pw) { $id('loginError').style.display = 'block'; }
    else {
      $id('loginError').style.display = 'none';
      if (saveChk) localStorage.setItem('qb_login', JSON.stringify({ id, pw })); else localStorage.removeItem('qb_login');
      const u = snap.val(); currentUser = { id, ...u };
      await set(ref(db, `users/${id}/lastLogin`), new Date().toISOString());
      if (u.role === 'admin') { showScreen('adminScreen'); renderAdminList(); }
      else {
        $id('navUserName').textContent = u.name;
        await loadDash();
        activeGoalIdx = null; viewMonth = null; showScreen('dashboardScreen'); await setupDashTabs(id); renderDashboard();
      }
    }
  } catch (e) { showToast('❌ 연결 오류'); }
  btn.disabled = false; btn.textContent = '로그인';
};
['loginId', 'loginPw'].forEach(id => { $id(id).addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); }); });

window.doLogout = function () {
  currentUser = null; localDash = null; activeGoalIdx = null;
  $id('loginId').value = ''; $id('loginPw').value = '';
  if (!$id('saveLoginChk').checked) localStorage.removeItem('qb_login');
  showScreen('loginScreen');
};

// ===== 햄버거 메뉴 =====
window.toggleHamburger = function () {
  const menu = $id('hamburgerMenu');
  menu.classList.toggle('open');
};
document.addEventListener('click', function(e) {
  const wrap = document.querySelector('.hamburger-wrap');
  if (wrap && !wrap.contains(e.target)) {
    $id('hamburgerMenu')?.classList.remove('open');
  }
});

// ===== 나 알아보기 =====
function summarizeMyData() {
  const goals = localDash?.goals || {};
  const challenges = localDash?.challenges || {};
  const completions = localDash?.completions || {};
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;

  // 습관 요약
  let habitLines = [];
  Object.keys(goals).forEach(key => {
    const g = goals[key];
    if (!g || !g.title) return;
    const mg = migrateGoal(g);
    const unitLbl = getUnitLabel(mg);
    const streak = calcStreak(mg, parseInt(key));
    const { pct } = goalPct(mg, parseInt(key), y, m);
    const timeLbl = (TIME_LABELS[g.time || 'any'] || '언제나').replace(/[^\w가-힣\s&]/g, '').trim();
    const catLbl = (CAT_LABELS[g.category || 'etc'] || '기타').replace(/[^\w가-힣\s&]/g, '').trim();
    habitLines.push(`- "${g.title}" (${unitLbl}, ${timeLbl}, ${catLbl}) — 이번달 달성률 ${pct}%, 연속 ${streak}일`);
  });

  // 도전 요약
  let bucketLines = [], projectLines = [];
  Object.keys(challenges).forEach(key => {
    const c = challenges[key];
    if (!c || !c.title) return;
    const catLbl = (CAT_LABELS[c.category || 'etc'] || '기타').replace(/[^\w가-힣\s&]/g, '').trim();
    const monthLbl = (!c.targetMonth || c.targetMonth === 'someday') ? '기한 미정' : c.targetMonth;
    if (c.type === 'bucket') {
      bucketLines.push(`- "${c.title}" (${catLbl}, ${monthLbl}) — ${c.done ? '달성 완료 ✅' : '진행 중'}`);
    } else if (c.type === 'project') {
      const { done, total, pct } = getProjectProgress(c);
      const stageNames = (c.stages || []).map(s => s.name).join(' → ');
      projectLines.push(`- "${c.title}" (${catLbl}, ${monthLbl}) — ${done}/${total} 완료(${pct}%) | 단계: ${stageNames}`);
    }
  });

  let summary = `[사용자 습관/도전 데이터 요약]\n`;
  summary += `분석 기준일: ${y}년 ${m}월 ${now.getDate()}일\n\n`;

  if (habitLines.length > 0) {
    summary += `📌 습관 (총 ${habitLines.length}개)\n${habitLines.join('\n')}\n\n`;
  } else {
    summary += `📌 습관: 아직 등록된 습관이 없음\n\n`;
  }
  if (bucketLines.length > 0) {
    summary += `🎯 버킷리스트 (총 ${bucketLines.length}개)\n${bucketLines.join('\n')}\n\n`;
  }
  if (projectLines.length > 0) {
    summary += `📋 프로젝트 (총 ${projectLines.length}개)\n${projectLines.join('\n')}\n\n`;
  }
  if (bucketLines.length === 0 && projectLines.length === 0) {
    summary += `🎯 도전: 아직 등록된 도전이 없음\n\n`;
  }
  return summary;
}

function buildAnalysisPrompt() {
  const summary = summarizeMyData();
  return `당신은 습관/목표 분석 전문가입니다. 아래는 한 사용자가 '키웁'에 등록한 습관과 도전 데이터 요약입니다.

${summary}
위 데이터를 바탕으로 아래 항목들을 상세하게 분석하고 조언해 주세요:

1. **성향 분석**: 이 사람은 어떤 유형의 사람인지 (예: 자기계발형, 건강관리형, 탐험가형 등)
2. **강점 발견**: 데이터에서 보이는 긍정적 패턴과 잘하고 있는 점
3. **개선 포인트**: 달성률이 낮거나 연속일수가 끊긴 습관에 대한 원인 분석
4. **균형 진단**: 건강/학습/업무/관계/재무 등 영역별 균형이 잘 잡혀 있는지
5. **맞춤 조언**: 이 사람에게 가장 도움이 될 구체적이고 실행 가능한 3가지 제안
6. **응원 메시지**: 이 사람의 노력을 인정하고 동기부여할 수 있는 따뜻한 한마디

한국어로 친근하고 구체적으로 답변해 주세요.`;
}

window.openAboutMe = function () {
  $text('bsTitle', '🔍 나 알아보기');
  clearMetaTags();
  const summary = summarizeMyData();
  // Count stats
  const goalCount = Object.keys(localDash?.goals || {}).filter(k => localDash.goals[k]?.title).length;
  const challengeCount = Object.keys(localDash?.challenges || {}).filter(k => localDash.challenges[k]?.title).length;

  let h = `<div style="text-align:center;padding:20px 0 10px;">
    <div style="font-size:48px;margin-bottom:8px;">🪞</div>
    <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px;">AI에게 나를 분석받기</div>
    <div style="font-size:12px;color:var(--text-dim);line-height:1.6;">내 습관과 도전 데이터를 AI가 분석해서<br>성향, 강점, 맞춤 조언을 받아보세요</div>
  </div>`;
  h += `<div style="background:#f8fafc;border-radius:14px;padding:16px;margin:16px 0;">
    <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:10px;">내 데이터 미리보기</div>
    <div style="display:flex;gap:12px;margin-bottom:12px;">
      <div style="flex:1;background:#fff;border-radius:10px;padding:12px;text-align:center;border:1px solid #e2e8f0;">
        <div style="font-family:var(--font-heading);font-size:22px;color:var(--accent);">${goalCount}</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">습관</div>
      </div>
      <div style="flex:1;background:#fff;border-radius:10px;padding:12px;text-align:center;border:1px solid #e2e8f0;">
        <div style="font-family:var(--font-heading);font-size:22px;color:var(--accent);">${challengeCount}</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">도전</div>
      </div>
    </div>
    <details style="cursor:pointer;">
      <summary style="font-size:11px;color:var(--accent);font-weight:700;">데이터 요약 펼쳐보기</summary>
      <pre style="font-size:10px;color:#64748b;white-space:pre-wrap;word-break:break-all;margin-top:8px;max-height:200px;overflow-y:auto;background:#fff;padding:10px;border-radius:8px;border:1px solid #e2e8f0;">${esc(summary)}</pre>
    </details>
  </div>`;
  h += `<div style="font-size:11px;color:var(--text-dim);text-align:center;margin-bottom:12px;line-height:1.5;">아래 버튼을 누르면 분석 프롬프트가 클립보드에 복사됩니다.<br>ChatGPT에 붙여넣기하세요!</div>`;
  h += `<button class="unit-confirm-btn" id="copyPromptBtn" onclick="copyAnalysisPrompt()">📋 프롬프트 복사하기</button>`;
  $html('bsBody', h);
  openBS();
};

window.copyAnalysisPrompt = async function () {
  const prompt = buildAnalysisPrompt();
  await copyToClipboard(prompt);
  showToast('📋 클립보드에 복사됨! ChatGPT에 붙여넣기하세요', 'done');
  const btn = $id('copyPromptBtn');
  if (btn) { btn.textContent = '✅ 복사 완료!'; btn.style.background = '#10b981'; setTimeout(() => { btn.textContent = '📋 프롬프트 복사하기'; btn.style.background = ''; }, 2000); }
};

// ===== 설정 =====
const FONT_SIZES = [
  { label: '아주 작게', scale: 0.85 },
  { label: '작게', scale: 0.92 },
  { label: '보통', scale: 1.0 },
  { label: '크게', scale: 1.08 },
  { label: '아주 크게', scale: 1.16 },
];

function applyFontSize(level) {
  const scale = FONT_SIZES[level].scale;
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('qb_font_level', level);
}

function initFontSize() {
  const saved = localStorage.getItem('qb_font_level');
  if (saved !== null) {
    const level = parseInt(saved);
    const scale = FONT_SIZES[level]?.scale || 1.0;
    document.documentElement.style.setProperty('--font-scale', scale);
  }
}
initFontSize();

window.openSettings = function () {
  $text('bsTitle', '⚙️ 설정');
  clearMetaTags();
  const curLevel = parseInt(localStorage.getItem('qb_font_level') ?? '2');
  let h = `<div style="padding:8px 0;">`;
  h += `<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:16px;">글씨 크기</div>`;
  h += `<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:12px;">`;
  FONT_SIZES.forEach((f, i) => {
    const sel = i === curLevel;
    const sz = 11 + i * 2;
    h += `<button class="font-size-btn ${sel ? 'selected' : ''}" onclick="setFontLevel(${i})" style="font-size:${sz}px;">가</button>`;
  });
  h += `</div>`;
  h += `<div style="text-align:center;font-size:13px;color:var(--text-dim);font-weight:700;" id="fontLevelLabel">${FONT_SIZES[curLevel].label}</div>`;
  h += `</div>`;
  // Public profile link
  h += `<div style="border-top:1px solid var(--border);margin-top:20px;padding-top:20px;">`;
  h += `<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:8px;">🔗 공개 프로필</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">링크를 공유하면 누구나 나의 투두 현황을 볼 수 있어요</div>`;
  h += `<button onclick="copyPublicLink()" style="width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;font-family:var(--font-main);cursor:pointer;">📋 공개 링크 복사</button>`;
  h += `</div>`;
  // Bulk visibility
  h += `<div style="border-top:1px solid var(--border);margin-top:20px;padding-top:20px;">`;
  h += `<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:8px;">🔒 공개/비공개 일괄 변경</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">모든 습관과 도전의 공개 설정을 한번에 변경합니다</div>`;
  h += `<div style="display:flex;gap:8px;">`;
  h += `<button onclick="bulkVisibility(true)" style="flex:1;padding:10px;background:#f0f9ff;color:#2563eb;border:1.5px solid #bfdbfe;border-radius:10px;font-size:13px;font-weight:700;font-family:var(--font-main);cursor:pointer;">🔓 전체 공개</button>`;
  h += `<button onclick="bulkVisibility(false)" style="flex:1;padding:10px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:10px;font-size:13px;font-weight:700;font-family:var(--font-main);cursor:pointer;">🔒 전체 비공개</button>`;
  h += `</div></div>`;
  $html('bsBody', h);
  openBS();
};

window.setFontLevel = function (level) {
  applyFontSize(level);
  document.querySelectorAll('.font-size-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === level);
  });
  $id('fontLevelLabel').textContent = FONT_SIZES[level].label;
  showToast(`글씨 크기: ${FONT_SIZES[level].label}`, 'normal');
};

// Simple hash for public profile URL
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

window.bulkVisibility = async function(isPublicVal) {
  const label = isPublicVal ? '전체 공개' : '전체 비공개';
  if (!confirm(`모든 습관과 도전을 ${label}로 변경할까요?\n\n이 작업은 되돌릴 수 있습니다.`)) return;
  (localDash.goals || []).forEach(g => { if (g?.title) g.public = isPublicVal; });
  Object.values(localDash.challenges || {}).forEach(c => { if (c?.title) c.public = isPublicVal; });
  await saveDash();
  renderHabitCards(); renderChallengeCards();
  showToast(isPublicVal ? '🔓 전체 공개로 변경됨' : '🔒 전체 비공개로 변경됨', 'done');
};

window.copyPublicLink = async function () {
  if (!currentUser) return;
  const hash = simpleHash(currentUser.id);
  const url = `${location.origin}${location.pathname.replace(/index\.html$/, '')}public.html?id=${hash}`;
  // iOS: 클립보드 복사를 await 전에 실행해야 사용자 제스처 컨텍스트 유지
  await copyToClipboard(url);
  showToast('📋 링크가 복사되었어요!', 'done');
  // Firebase 저장은 백그라운드에서
  set(ref(db, `publicLinks/${hash}`), currentUser.id).catch(() => {});
};

// ===== 서비스 정보 =====
window.openServiceInfo = function () {
  $text('bsTitle', '📦 서비스 정보');
  clearMetaTags();
  let h = `<div style="text-align:center;padding:24px 0 16px;">
    <div style="font-size:48px;margin-bottom:8px;">🐹</div>
    <div style="font-family:var(--font-logo);font-size:22px;color:var(--text);margin-bottom:2px;">키웁</div>
    <div style="font-size:12px;color:var(--text-dim);">동물 키우기 · 목표 달성 게임</div>
  </div>`;
  h += `<div style="background:#f8fafc;border-radius:14px;padding:16px;margin:8px 0;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#64748b;">앱 버전</span>
      <span style="font-size:13px;font-weight:800;color:var(--text);">${APP_VERSION}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#64748b;">마지막 업데이트</span>
      <span style="font-size:13px;font-weight:800;color:var(--text);">${APP_VERSION.slice(0,4)}년 ${parseInt(APP_VERSION.slice(4,6))}월 ${parseInt(APP_VERSION.slice(6,8))}일</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:12px;font-weight:700;color:#64748b;">개발</span>
      <span style="font-size:13px;font-weight:700;color:var(--text);">Jin</span>
    </div>
  </div>`;
  $html('bsBody', h);
  openBS();
};

window.openWatchGuide = function () {
  $text('bsTitle', '⌚ 워치 데이터 연동');
  clearMetaTags();
  const uid = currentUser?.id || '(로그인 필요)';
  const goals = getAllGoals();
  let healthList = '';
  goals.forEach((g, i) => {
    if (g && (g.unit === 'health_workout' || g.unit === 'health_sleep')) {
      const wType = g.workoutType ? ` (${g.workoutType})` : '';
      healthList += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;">${esc(g.title)}${wType}</span>
        <span style="font-size:13px;font-weight:800;color:var(--accent);">g${i}</span>
      </div>`;
    }
  });

  const infoBox = `<div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:16px;">
    <div style="font-size:13px;font-weight:700;color:#0284c7;margin-bottom:8px;">📌 내 연동 정보</div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;">
      <span style="font-size:12px;color:#64748b;">유저 ID</span>
      <span style="font-size:13px;font-weight:800;color:#0284c7;">${esc(uid)}</span>
    </div>
    ${healthList || '<div style="font-size:12px;color:#94a3b8;padding:6px 0;">헬스 연동 습관이 없습니다. 습관 추가 시 "자동"에서 등록하세요.</div>'}
  </div>`;

  let h = `<div style="display:flex;gap:0;margin-bottom:16px;">
    <button class="sub-tab-btn active" id="watchTabAnd" onclick="switchWatchTab('android')" style="flex:1;">🤖 안드로이드</button>
    <button class="sub-tab-btn" id="watchTabIos" onclick="switchWatchTab('ios')" style="flex:1;">🍎 iOS</button>
  </div>`;
  h += infoBox;
  h += `<div id="watchTabContent"></div>`;

  $html('bsBody', h);
  openBS();
  switchWatchTab('android');
};

window.switchWatchTab = function (tab) {
  $id('watchTabAnd').classList.toggle('active', tab === 'android');
  $id('watchTabIos').classList.toggle('active', tab === 'ios');
  const area = $id('watchTabContent');
  const uid = currentUser?.id || '(로그인 필요)';
  const baseUrl = `https://grow-goal-default-rtdb.firebaseio.com/dashboards/${uid}/completions/`;

  function copyBox(id, text, label) {
    return `<div style="position:relative;margin-top:8px;">
      <div style="font-size:11px;color:#0284c7;font-weight:700;margin-bottom:4px;">${label}</div>
      <div id="${id}" style="font-size:10px;color:#334155;background:#e8f4f8;padding:10px 36px 10px 10px;border-radius:8px;word-break:break-all;font-family:monospace;line-height:1.5;user-select:all;">${text}</div>
      <button onclick="copyWatchText('${id}')" style="position:absolute;top:24px;right:6px;background:#0284c7;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:var(--font-main);">복사</button>
    </div>`;
  }

  if (tab === 'android') {
    let h = `<div style="font-size:14px;font-weight:800;margin-bottom:12px;">MacroDroid 설정 방법</div>`;

    // Step 1
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">1️⃣ MacroDroid 설치</div>
      <div style="font-size:12px;color:#475569;">Play Store에서 <b>MacroDroid</b> 검색 → 설치 (무료)<br>앱 실행 → 알림 접근 권한 허용</div>
    </div>`;

    // Step 2
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">2️⃣ 트리거 설정</div>
      <div style="font-size:12px;color:#475569;">매크로 추가 → 트리거 → <b>Notification</b><br>앱: Samsung Health (또는 사용 중인 건강 앱)<br>텍스트 조건: "운동" 또는 "Exercise" 포함</div>
    </div>`;

    // Step 3 with expandable details
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">3️⃣ 액션 설정</div>
      <div style="font-size:12px;color:#475569;">액션 → <b>HTTP Request</b> 선택</div>
      ${copyBox('andMethod', 'PUT', 'Method')}
      ${copyBox('andContentType', 'application/json', 'Content Type')}
      ${copyBox('andBody', 'true', 'HTTP Body')}
      ${copyBox('andUrl', baseUrl + '<b>g번호</b>_{year}_{month}_{day_of_month}.json', 'URL (g번호를 수정하세요)')}
      <details style="margin-top:12px;cursor:pointer;">
        <summary style="font-size:11px;color:var(--accent);font-weight:700;">📖 URL 만드는 법 자세히 보기</summary>
        <div style="margin-top:8px;font-size:11px;color:#475569;line-height:1.7;background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-weight:700;margin-bottom:6px;">URL 입력란에 아래 순서로 입력하세요:</div>
          <div>1. 아래 기본 URL을 복사하여 붙여넣기</div>
          <div style="background:#e8f4f8;padding:6px 8px;border-radius:6px;font-family:monospace;font-size:10px;margin:4px 0;word-break:break-all;">${esc(baseUrl)}g0_</div>
          <div>2. URL 입력란 옆 <b>{ }</b> 아이콘 탭</div>
          <div>3. <b>Date/Time → Year</b> 선택 → {year} 삽입됨</div>
          <div>4. <b>_</b> 직접 입력</div>
          <div>5. 다시 { } → <b>Date/Time → Month (1-12)</b> 선택</div>
          <div>6. <b>_</b> 직접 입력</div>
          <div>7. 다시 { } → <b>Date/Time → Day of Month</b> 선택</div>
          <div>8. <b>.json</b> 직접 입력</div>
          <div style="margin-top:8px;font-weight:700;">완성 예시:</div>
          <div style="background:#e8f4f8;padding:6px 8px;border-radius:6px;font-family:monospace;font-size:10px;margin-top:4px;word-break:break-all;">...completions/g0_{year}_{month}_{day_of_month}.json</div>
          <div style="margin-top:6px;color:#94a3b8;">→ 실행 시 g0_2026_3_1.json 형태로 자동 변환됩니다</div>
        </div>
      </details>
    </div>`;

    // Step 4
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">4️⃣ 테스트</div>
      <div style="font-size:12px;color:#475569;">매크로 저장 후 활성화<br>건강 앱에서 짧은 운동 기록<br>키웁 새로고침 → 자동 체크 확인</div>
    </div>`;

    // Tips
    h += `<div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:12px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;">💡 운동 여러 개일 때</div>
      <div style="font-size:11px;color:#78350f;">운동 종류마다 별도 매크로를 만드세요.<br>알림 텍스트 조건을 "달리기", "수영" 등으로 구분하면<br>각각 다른 g번호 습관에 기록됩니다.</div>
    </div>`;

    h += `<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px;">
      <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:4px;">⚠️ 주의사항</div>
      <div style="font-size:11px;color:#7f1d1d;">
        • MacroDroid 배터리 최적화 해제 필수<br>
        • 설정 → 앱 → MacroDroid → 배터리 → 제한 없음<br>
        • 무료 버전은 매크로 5개 제한
      </div>
    </div>`;
    area.innerHTML = h;
  } else {
    let h = `<div style="font-size:14px;font-weight:800;margin-bottom:12px;">iOS 단축어 설정 방법</div>`;

    // Step 1
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">1️⃣ 단축어 앱 열기</div>
      <div style="font-size:12px;color:#475569;">iPhone에서 <b>단축어</b> 앱 실행<br><b>자동화</b> 탭 → <b>새로운 자동화</b></div>
    </div>`;

    // Step 2
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">2️⃣ 트리거 설정</div>
      <div style="font-size:12px;color:#475569;"><b>수면:</b> 수면 → 취침 준비가 시작될 때<br><b>운동:</b> Apple Watch 운동 → 운동이 끝났을 때<br><br>"묻지 않고 바로 실행"으로 설정</div>
    </div>`;

    // Step 3 with expandable details
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">3️⃣ 액션 추가</div>
      <div style="font-size:12px;color:#475569;">액션 검색 → <b>URL의 콘텐츠 가져오기</b> 선택</div>
      ${copyBox('iosMethod', 'PUT', 'Method')}
      ${copyBox('iosBody', 'true', '요청 본문 (텍스트)')}
      ${copyBox('iosUrl', baseUrl + '<b>g번호</b>_<b>년_월_일</b>.json', 'URL (g번호를 수정하세요)')}
      <details style="margin-top:12px;cursor:pointer;">
        <summary style="font-size:11px;color:var(--accent);font-weight:700;">📖 URL에 날짜 변수 넣는 법 자세히 보기</summary>
        <div style="margin-top:8px;font-size:11px;color:#475569;line-height:1.7;background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-weight:700;margin-bottom:6px;">URL 입력란에 아래 순서로 입력하세요:</div>
          <div>1. 아래 기본 URL을 복사하여 붙여넣기</div>
          <div style="background:#e8f4f8;padding:6px 8px;border-radius:6px;font-family:monospace;font-size:10px;margin:4px 0;word-break:break-all;">${esc(baseUrl)}g0_</div>
          <div>2. URL 입력란에서 <b>현재 날짜</b> 변수 삽입</div>
          <div style="margin-left:8px;">→ 날짜 포맷: 사용자 지정 → <b>yyyy</b> 입력</div>
          <div>3. <b>_</b> 직접 입력</div>
          <div>4. 다시 <b>현재 날짜</b> 변수 삽입 → 포맷 <b>M</b></div>
          <div>5. <b>_</b> 직접 입력</div>
          <div>6. 다시 <b>현재 날짜</b> 변수 삽입 → 포맷 <b>d</b></div>
          <div>7. <b>.json</b> 직접 입력</div>
          <div style="margin-top:8px;font-weight:700;">완성 예시:</div>
          <div style="background:#e8f4f8;padding:6px 8px;border-radius:6px;font-family:monospace;font-size:10px;margin-top:4px;word-break:break-all;">...completions/g0_<span style="color:#0284c7;">[현재 날짜:yyyy]</span>_<span style="color:#0284c7;">[현재 날짜:M]</span>_<span style="color:#0284c7;">[현재 날짜:d]</span>.json</div>
          <div style="margin-top:6px;color:#94a3b8;">→ 실행 시 g0_2026_3_1.json 형태로 자동 변환됩니다</div>
        </div>
      </details>
    </div>`;

    // Step 4
    h += `<div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;">4️⃣ 테스트</div>
      <div style="font-size:12px;color:#475569;">자동화 저장 → Apple Watch에서 운동 완료<br>또는 수면 시작 시 자동 실행 확인<br>키웁 새로고침 → 자동 체크 확인</div>
    </div>`;

    // Tips
    h += `<div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:12px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;">💡 팁</div>
      <div style="font-size:11px;color:#78350f;">운동 종류별로 별도 자동화를 만들면<br>각각 다른 g번호 습관에 기록할 수 있어요.<br>Apple Watch 운동 앱에서 종류 선택 후 종료하면 자동 실행됩니다.</div>
    </div>`;

    h += `<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px;">
      <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:4px;">⚠️ 주의사항</div>
      <div style="font-size:11px;color:#7f1d1d;">
        • 단축어 자동화가 "묻지 않고 실행"으로 설정되어야 합니다<br>
        • Apple Watch가 iPhone과 연결된 상태여야 합니다<br>
        • 인터넷 연결이 필요합니다
      </div>
    </div>`;
    area.innerHTML = h;
  }
};

window.copyWatchText = async function (elId) {
  const el = $id(elId);
  if (!el) return;
  await copyToClipboard(el.textContent.trim());
  showToast('📋 복사됨!', 'done');
};

// ===== 공유 카드 =====
const CAT_EMOJI = { health:'💪', diet:'🥗', study:'📚', work:'💼', finance:'💰', life:'🌱', home:'🧹', hobby:'🎨', social:'🤝', mental:'🧘', etc:'📦' };

window.openShareCard = function () {
  $text('bsTitle', '📤 공유하기');
  clearMetaTags();
  let h = `<div style="display:flex;flex-direction:column;gap:10px;">
    <button class="share-menu-btn" onclick="openShareHabit()">
      <span style="font-size:24px;">🔥</span>
      <div><div style="font-size:13px;font-weight:800;">습관 카드</div><div style="font-size:11px;color:var(--text-dim);">연속 달성 + 월간 달력</div></div>
    </button>
    <button class="share-menu-btn" onclick="openShareStamp()">
      <span style="font-size:24px;">🏆</span>
      <div><div style="font-size:13px;font-weight:800;">도전 스탬프</div><div style="font-size:11px;color:var(--text-dim);">버킷 & 프로젝트 현황</div></div>
    </button>
    <button class="share-menu-btn" onclick="openShareReport()">
      <span style="font-size:24px;">📊</span>
      <div><div style="font-size:13px;font-weight:800;">월간 리포트</div><div style="font-size:11px;color:var(--text-dim);">이번 달 요약</div></div>
    </button>
  </div>`;
  $html('bsBody', h);
  openBS();
};

// --- Share: Habit Card ---
window.openShareHabit = function () {
  $text('bsTitle', '🔥 습관 카드');
  clearMetaTags();
  const goals = getAllGoals();
  let h = `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">공유할 습관을 선택하세요</div>`;
  h += `<div style="display:flex;flex-direction:column;gap:6px;">`;
  goals.forEach((g, i) => {
    if (!g || !g.title) return;
    const streak = calcStreak(g, i);
    const label = getUnitLabel(migrateGoal(g));
    h += `<button class="share-menu-btn" onclick="generateHabitCard(${i})">
      <span style="font-size:18px;">${CAT_EMOJI[g.category] || '📦'}</span>
      <div style="flex:1;text-align:left;"><div style="font-size:13px;font-weight:700;">${esc(g.title)}</div><div style="font-size:11px;color:var(--text-dim);">${label} · ${streak > 0 ? streak + '일 연속' : '기록 없음'}</div></div>
    </button>`;
  });
  h += `</div>`;
  $html('bsBody', h);
};

window.generateHabitCard = function (idx) {
  const g = migrateGoal(localDash.goals[idx]);
  if (!g) return;
  const nick = localDash.nickname || currentUser?.name || '나';
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const streak = calcStreak(g, idx);
  const { pct } = goalPct(g, idx, y, m);
  const days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();

  // Build calendar data
  let calHtml = '';
  const weekdays = ['일','월','화','수','목','금','토'];
  calHtml += weekdays.map(d => `<div style="font-size:9px;color:#94a3b8;text-align:center;font-weight:700;">${d}</div>`).join('');
  for (let b = 0; b < fd; b++) calHtml += `<div></div>`;
  for (let d = 1; d <= days; d++) {
    const done = isCompDone(localDash.completions[`g${idx}_${y}_${m}_${d}`], localDash.goals[idx]);
    const isToday = d === now.getDate();
    calHtml += `<div style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;font-weight:700;
      ${done ? 'background:var(--accent);color:white;' : isToday ? 'border:1.5px solid var(--accent);color:var(--accent);' : 'color:#cbd5e1;'}">${d}</div>`;
  }

  const cardHtml = `
  <div id="shareCardPreview" style="width:340px;padding:28px;background:linear-gradient(135deg,#f0f7ff 0%,#e8f4f8 100%);border-radius:20px;font-family:var(--font-main);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="font-size:16px;font-weight:800;color:var(--accent);">🐹 키웁</div>
      <div style="font-size:12px;font-weight:700;color:#94a3b8;">${esc(nick)}</div>
    </div>
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;margin-bottom:4px;">${CAT_EMOJI[g.category] || '📦'}</div>
      <div style="font-size:16px;font-weight:800;color:var(--text);">${esc(g.title)}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">${getUnitLabel(g)}</div>
    </div>
    ${streak > 0 ? `<div style="text-align:center;margin-bottom:16px;">
      <span style="background:var(--accent);color:white;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:800;">🔥 ${streak}일 연속 달성 중</span>
    </div>` : ''}
    <div style="background:white;border-radius:12px;padding:12px;">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:8px;">${y}년 ${m}월 · 달성률 ${pct}%</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">${calHtml}</div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:10px;color:#94a3b8;">키웁 - 목표 달성 게임 🐹</div>
  </div>`;

  showSharePreview(cardHtml);
};

// --- Share: Stamp Card ---
window.openShareStamp = function () {
  $text('bsTitle', '🏆 도전 스탬프');
  clearMetaTags();
  let h = `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">카드 크기를 선택하세요</div>`;
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <button class="share-menu-btn" style="justify-content:center;" onclick="generateStampCard(3)"><div style="font-size:13px;font-weight:700;">3×3</div><div style="font-size:11px;color:var(--text-dim);">최대 9개</div></button>
    <button class="share-menu-btn" style="justify-content:center;" onclick="generateStampCard(4)"><div style="font-size:13px;font-weight:700;">4×4</div><div style="font-size:11px;color:var(--text-dim);">최대 16개</div></button>
    <button class="share-menu-btn" style="justify-content:center;" onclick="generateStampCard(5)"><div style="font-size:13px;font-weight:700;">5×5</div><div style="font-size:11px;color:var(--text-dim);">최대 25개</div></button>
    <button class="share-menu-btn" style="justify-content:center;" onclick="generateStampCard(0)"><div style="font-size:13px;font-weight:700;">전체</div><div style="font-size:11px;color:var(--text-dim);">모두 표시</div></button>
  </div>`;
  $html('bsBody', h);
};

window.generateStampCard = function (cols) {
  const challengesObj = localDash.challenges || {};
  const nick = localDash.nickname || currentUser?.name || '나';
  let items = [];
  Object.keys(challengesObj).forEach(key => {
    const c = challengesObj[key];
    if (c && c.title) {
      const done = isChallengeComplete(c);
      const emoji = CAT_EMOJI[c.category] || (c.type === 'project' ? '📋' : '🎯');
      let pctVal = done ? 100 : 0;
      if (c.type === 'project' && !done) pctVal = getProjectProgress(c).pct;
      items.push({ title: c.title, emoji, done, pct: pctVal });
    }
  });

  // Sort: done first
  items.sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0));

  // For "전체" mode, auto-calculate cols
  const actualCols = cols > 0 ? cols : Math.min(Math.ceil(Math.sqrt(items.length)), 5) || 3;
  const maxItems = cols > 0 ? cols * cols : items.length;
  const displayItems = items.slice(0, maxItems);
  const doneCount = items.filter(i => i.done).length;

  // When cols specified (3,4,5), fix grid to NxN; otherwise fit to items
  const rows = cols > 0 ? cols : Math.ceil(displayItems.length / actualCols);
  const totalCells = rows * actualCols;

  const gap = actualCols <= 3 ? '8px' : actualCols <= 4 ? '6px' : '5px';
  const fontSize = actualCols <= 3 ? '22px' : actualCols <= 4 ? '18px' : '15px';
  const titleSize = actualCols <= 3 ? '10px' : actualCols <= 4 ? '9px' : '8px';
  const checkSize = actualCols <= 3 ? '20px' : actualCols <= 4 ? '18px' : '16px';
  const checkFont = actualCols <= 3 ? '11px' : actualCols <= 4 ? '10px' : '9px';
  const radius = actualCols <= 3 ? '14px' : actualCols <= 4 ? '12px' : '10px';

  let gridHtml = '';
  for (let i = 0; i < totalCells; i++) {
    const item = displayItems[i];
    if (!item) {
      // Empty cell — only show if within grid bounds, subtle dashed
      gridHtml += `<div style="aspect-ratio:1;border-radius:${radius};border:1.5px dashed #e2e8f0;"></div>`;
      continue;
    }
    const bg = item.done ? 'linear-gradient(135deg,#dbeafe,#c7d9f7)' : '#f8fafc';
    const border = item.done ? '2px solid #6ba3f7' : '1.5px solid #e2e8f0';
    const opacity = item.done ? '' : 'opacity:0.6;';
    const check = item.done ? `<div style="position:absolute;top:-3px;right:-3px;background:#3b82f6;color:white;border-radius:50%;width:${checkSize};height:${checkSize};display:flex;align-items:center;justify-content:center;font-size:${checkFont};font-weight:800;box-shadow:0 1px 3px rgba(0,0,0,.15);">✓</div>` : '';
    const pctLabel = !item.done && item.pct > 0 ? `<div style="font-size:${actualCols <= 3 ? '9px' : '8px'};color:#3b82f6;font-weight:700;">${item.pct}%</div>` : '';
    gridHtml += `<div style="position:relative;aspect-ratio:1;background:${bg};border:${border};border-radius:${radius};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;${opacity}">
      ${check}
      <div style="font-size:${fontSize};line-height:1.2;">${item.emoji}</div>
      <div style="font-size:${titleSize};font-weight:700;color:#334155;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;line-height:1.3;">${esc(item.title)}</div>
      ${pctLabel}
    </div>`;
  }

  const pctTotal = items.length > 0 ? Math.round(doneCount / items.length * 100) : 0;
  const cardHtml = `
  <div id="shareCardPreview" style="width:340px;padding:24px;background:linear-gradient(135deg,#f0f7ff 0%,#e8f4f8 100%);border-radius:20px;font-family:var(--font-main);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:800;color:#3b82f6;">🐹 키웁</div>
      <div style="font-size:12px;font-weight:700;color:#94a3b8;">${esc(nick)}</div>
    </div>
    <div style="text-align:center;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:800;color:var(--text);">🏆 나의 도전 현황</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${actualCols},1fr);gap:${gap};margin-bottom:14px;">
      ${gridHtml}
    </div>
    <div style="background:white;border-radius:10px;padding:10px 14px;text-align:center;">
      <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px;">${doneCount} / ${items.length} 달성</div>
      <div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pctTotal}%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:3px;"></div>
      </div>
      <div style="font-size:11px;color:#3b82f6;font-weight:700;margin-top:4px;">${pctTotal}%</div>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:10px;color:#94a3b8;">키웁 - 목표 달성 게임 🐹</div>
  </div>`;

  showSharePreview(cardHtml);
};

// --- Share: Monthly Report ---
window.openShareReport = function () {
  const nick = localDash.nickname || currentUser?.name || '나';
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const goals = getAllGoals();

  // Habit stats
  let totalPct = 0, habitCount = 0, maxStreak = 0, bestHabit = null;
  goals.forEach((g, i) => {
    if (!g || !g.title) return;
    const mg = migrateGoal(g);
    const { pct } = goalPct(mg, i, y, m);
    const streak = calcStreak(mg, i);
    totalPct += pct;
    habitCount++;
    if (streak > maxStreak) { maxStreak = streak; bestHabit = g; }
  });
  const avgPct = habitCount > 0 ? Math.round(totalPct / habitCount) : 0;

  // Challenge stats
  const challengesObj = localDash.challenges || {};
  let totalChal = 0, doneChal = 0, projCount = 0;
  Object.keys(challengesObj).forEach(key => {
    const c = challengesObj[key];
    if (!c || !c.title) return;
    totalChal++;
    if (isChallengeComplete(c)) doneChal++;
    if (c.type === 'project') projCount++;
  });

  const cardHtml = `
  <div id="shareCardPreview" style="width:340px;padding:28px;background:linear-gradient(135deg,#f0f7ff 0%,#e8f4f8 100%);border-radius:20px;font-family:var(--font-main);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="font-size:16px;font-weight:800;color:var(--accent);">🐹 키웁</div>
      <div style="font-size:12px;font-weight:700;color:#94a3b8;">${esc(nick)}</div>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:15px;font-weight:800;color:var(--text);">📊 ${m}월 리포트</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:white;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:var(--accent);">${avgPct}%</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">습관 달성률</div>
      </div>
      <div style="background:white;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:var(--accent);">${maxStreak}일</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">최장 연속</div>
      </div>
      <div style="background:white;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:var(--accent);">${doneChal}개</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">도전 달성</div>
      </div>
      <div style="background:white;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:var(--accent);">${projCount}개</div>
        <div style="font-size:11px;color:#64748b;font-weight:700;">프로젝트 진행</div>
      </div>
    </div>
    ${bestHabit ? `<div style="background:white;border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:4px;">🏆 이달의 베스트</div>
      <div style="font-size:14px;font-weight:800;color:var(--text);">${esc(bestHabit.title)}</div>
      <div style="font-size:12px;color:var(--accent);font-weight:700;">${maxStreak}일 연속</div>
    </div>` : ''}
    <div style="text-align:center;margin-top:16px;font-size:10px;color:#94a3b8;">키웁 - 목표 달성 게임 🐹</div>
  </div>`;

  showSharePreview(cardHtml);
};

// --- Share Preview + Export ---
function showSharePreview(cardHtml) {
  $text('bsTitle', '📤 미리보기');
  clearMetaTags();
  let h = `<div style="display:flex;justify-content:center;margin-bottom:16px;">${cardHtml}</div>`;
  h += `<div style="display:flex;gap:8px;">
    <button class="share-export-btn" onclick="exportShareCard('save')">💾 이미지 저장</button>
    <button class="share-export-btn primary" onclick="exportShareCard('share')">📤 공유하기</button>
  </div>`;
  $html('bsBody', h);
}

window.exportShareCard = async function (mode) {
  const el = $id('shareCardPreview');
  if (!el) return;
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true });
    canvas.toBlob(async (blob) => {
      if (!blob) { showToast('이미지 생성 실패', 'normal'); return; }
      const file = new File([blob], 'kiwup-share.png', { type: 'image/png' });

      if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '키웁 - 목표 달성 게임' });
        } catch (e) {
          if (e.name !== 'AbortError') downloadBlob(blob);
        }
      } else {
        downloadBlob(blob);
      }
    }, 'image/png');
  } catch (e) {
    showToast('이미지 생성 실패', 'normal');
  }
};

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'kiwup-share.png'; a.click();
  URL.revokeObjectURL(url);
  showToast('💾 이미지 저장됨', 'done');
}

// ===== 탭 =====
window.switchTab = function (tab) {
  $id('tabBtnMy').classList.toggle('active', tab === 'my');
  $id('tabBtnFriends').classList.toggle('active', tab === 'friends');
  $id('tabMy').classList.toggle('active', tab === 'my');
  $id('tabFriends').classList.toggle('active', tab === 'friends');
  if (tab === 'friends') renderFriends();
};

// ===== SCROLL SNAP (avatar ↔ sub-tab zone) =====
// Scroll snap removed — free scroll with sticky tab bars

// ===== 대시보드 =====
function renderDashboard() {
  const now = new Date();
  if (!viewMonth) viewMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  // localStorage 저장값 UI 반영
  const hSelect = $id('habitViewModeSelect');
  if (hSelect) hSelect.value = habitViewMode;
  const cSelect = $id('challengeViewModeSelect');
  if (cSelect) cSelect.value = challengeViewMode;
  const hPill = $id('habitFilterPill');
  if (hPill) { hPill.classList.toggle('active-filter', habitFilter === 'active'); hPill.innerHTML = (habitFilter === 'active' ? '진행 중' : '전체') + ' <span class="filter-dot"></span>'; }
  const cPill = $id('challengeFilterPill');
  if (cPill) { cPill.classList.toggle('active-filter', challengeFilter === 'active'); cPill.innerHTML = (challengeFilter === 'active' ? '진행 중' : '전체') + ' <span class="filter-dot"></span>'; }
  renderAvatar(); renderHabitCards(); renderChallengeCards(); loadNoticeBanner(); renderMainCheers(); checkFriendActivity(); renderCookingFAB(); renderMilestoneBar();
  setupFCM();
  loadNotifications();
  // jin 전용 어드민 메뉴
  const adminEl = $id('adminMenuItem');
  if (adminEl) adminEl.style.display = (currentUser && currentUser.id === 'jin') ? '' : 'none';
}

function renderAvatar() {
  const p = globalPct(), stage = Math.min(9, Math.floor(p / 10));
  const artEl = $id('avatarArt');
  const { total, done } = getMyTodayProgress();
  const todayPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const showHouse = todayPct < 25;
  // Track current mode — always re-evaluate
  const currentMode = artEl._avatarMode;
  const needMode = showHouse ? 'house' : 'hamster';
  if (currentMode !== needMode || !artEl._avatarMode) {
    artEl._avatarMode = needMode;
    artEl._hamsterInit = false;
    artEl.innerHTML = '';
    // Cancel existing animation loops
    if (artEl._animId) { cancelAnimationFrame(artEl._animId); artEl._animId = null; }
    if (needMode === 'house') {
      initHamsterHouse(artEl);
    } else {
      initHamsterAvatar(artEl);
    }
  }
  $id('avatarStage').textContent = `${stage + 1}단계`;
  const nick = localDash.nickname || currentUser.name || '나의 캐릭터';
  $id('avatarNickname').textContent = nick;
  applyTimeBackground();
}

function applyTimeBackground() {
  const section = document.querySelector('.avatar-section');
  if (!section) return;
  const h = new Date().getHours();
  let bg, decoHTML, nickColor = '#111827', stageColor = 'var(--accent)', stageBg = 'var(--accent-light)';

  // 기존 장식 제거
  section.querySelectorAll('.sky-deco').forEach(e => e.remove());

  if (h >= 0 && h < 5) {
    // 🌌 새벽
    bg = 'linear-gradient(180deg, #1a1650 0%, #302a78 50%, #4a42a0 100%)';
    nickColor = '#e2e8f0'; stageColor = '#a5b4fc'; stageBg = 'rgba(165,180,252,.15)';
    decoHTML = `
      <div class="sky-deco star" style="top:5%;left:8%;font-size:5px;animation-delay:0s;">✦</div>
      <div class="sky-deco star" style="top:12%;left:15%;font-size:8px;animation-delay:0.3s;">✦</div>
      <div class="sky-deco star" style="top:3%;left:30%;font-size:4px;animation-delay:1.8s;">✦</div>
      <div class="sky-deco star" style="top:8%;left:48%;font-size:6px;animation-delay:1.2s;">✦</div>
      <div class="sky-deco star" style="top:18%;left:55%;font-size:3px;animation-delay:2.8s;">✦</div>
      <div class="sky-deco star" style="top:22%;left:80%;font-size:10px;animation-delay:0.6s;">✦</div>
      <div class="sky-deco star" style="top:6%;left:72%;font-size:5px;animation-delay:2.0s;">✦</div>
      <div class="sky-deco star" style="top:28%;left:20%;font-size:4px;animation-delay:3.2s;">✦</div>
      <div class="sky-deco star" style="top:15%;left:90%;font-size:6px;animation-delay:1.5s;">✦</div>
      <div class="sky-deco star" style="top:25%;left:42%;font-size:3px;animation-delay:2.4s;">✦</div>
      <div class="sky-deco star" style="top:10%;left:65%;font-size:7px;animation-delay:0.9s;">✦</div>
      <div class="sky-deco moon" style="top:2%;right:12%;font-size:26px;">🌙</div>`;
  } else if (h >= 5 && h < 9) {
    // 🌅 아침
    bg = 'linear-gradient(180deg, #ffecd2 0%, #fcb69f 40%, #ff9a9e 100%)';
    decoHTML = `
      <div class="sky-deco sun-rise" style="bottom:25%;left:50%;transform:translateX(-50%);font-size:36px;">☀️</div>
      <div class="sky-deco cloud" style="top:12%;left:10%;font-size:20px;animation-delay:0s;">☁️</div>
      <div class="sky-deco cloud" style="top:20%;right:15%;font-size:16px;animation-delay:2s;">☁️</div>`;
  } else if (h >= 9 && h < 13) {
    // ☀️ 점심
    bg = 'linear-gradient(180deg, #89CFF0 0%, #a0d2f0 50%, #d4ecfc 100%)';
    decoHTML = `
      <div class="sky-deco" style="top:6%;right:18%;font-size:32px;">☀️</div>
      <div class="sky-deco cloud" style="top:15%;left:8%;font-size:22px;animation-delay:0s;">☁️</div>
      <div class="sky-deco cloud" style="top:10%;left:55%;font-size:16px;animation-delay:1.5s;">☁️</div>
      <div class="sky-deco cloud" style="top:25%;right:10%;font-size:14px;animation-delay:3s;">☁️</div>`;
  } else if (h >= 13 && h < 17) {
    // 🌤 오후
    bg = 'linear-gradient(180deg, #74b9ff 0%, #a0c4ff 50%, #d0e8ff 100%)';
    decoHTML = `
      <div class="sky-deco" style="top:8%;right:22%;font-size:28px;">⛅</div>
      <div class="sky-deco cloud" style="top:18%;left:12%;font-size:18px;animation-delay:0.5s;">☁️</div>
      <div class="sky-deco cloud" style="top:12%;left:60%;font-size:14px;animation-delay:2.5s;">☁️</div>`;
  } else if (h >= 17 && h < 20) {
    // 🌇 저녁
    bg = 'linear-gradient(180deg, #3d2a7a 0%, #d4336e 40%, #ff8534 70%, #ffbb5c 100%)';
    nickColor = '#fef3c7'; stageColor = '#fbbf24'; stageBg = 'rgba(251,191,36,.15)';
    decoHTML = `
      <div class="sky-deco cloud" style="top:10%;left:15%;font-size:18px;opacity:0.6;animation-delay:0s;">☁️</div>
      <div class="sky-deco cloud" style="top:18%;right:20%;font-size:14px;opacity:0.5;animation-delay:1.5s;">☁️</div>
      <div class="sky-deco star" style="top:5%;left:25%;font-size:5px;animation-delay:0.8s;">✦</div>
      <div class="sky-deco star" style="top:8%;right:30%;font-size:4px;animation-delay:2s;">✦</div>`;
  } else {
    // 🌙 밤
    bg = 'linear-gradient(180deg, #111d3a 0%, #1a2d52 40%, #24396a 100%)';
    nickColor = '#e2e8f0'; stageColor = '#93c5fd'; stageBg = 'rgba(147,197,253,.15)';
    decoHTML = `
      <div class="sky-deco moon" style="top:3%;right:15%;font-size:28px;">🌙</div>
      <div class="sky-deco star" style="top:5%;left:8%;font-size:6px;animation-delay:0s;">✦</div>
      <div class="sky-deco star" style="top:10%;left:18%;font-size:8px;animation-delay:0.5s;">✦</div>
      <div class="sky-deco star" style="top:3%;left:35%;font-size:4px;animation-delay:1.8s;">✦</div>
      <div class="sky-deco star" style="top:7%;left:52%;font-size:6px;animation-delay:0.8s;">✦</div>
      <div class="sky-deco star" style="top:15%;left:25%;font-size:5px;animation-delay:2.2s;">✦</div>
      <div class="sky-deco star" style="top:20%;left:70%;font-size:10px;animation-delay:1.6s;">✦</div>
      <div class="sky-deco star" style="top:25%;right:25%;font-size:7px;animation-delay:1.2s;">✦</div>
      <div class="sky-deco star" style="top:4%;left:65%;font-size:4px;animation-delay:3s;">✦</div>
      <div class="sky-deco star" style="top:12%;left:85%;font-size:5px;animation-delay:2.5s;">✦</div>
      <div class="sky-deco star" style="top:28%;left:45%;font-size:3px;animation-delay:1.0s;">✦</div>
      <div class="sky-deco star" style="top:8%;left:92%;font-size:6px;animation-delay:3.5s;">✦</div>
      <div class="sky-deco star" style="top:22%;left:10%;font-size:4px;animation-delay:2.8s;">✦</div>`;
  }

  section.style.background = bg;
  section.style.position = 'relative';
  section.style.overflow = 'hidden';
  section.insertAdjacentHTML('beforeend', decoHTML);

  // 닉네임/단계 색상
  const nickEl = document.querySelector('.avatar-nickname');
  if (nickEl) nickEl.style.color = nickColor;
  const stageEl = $id('avatarStage');
  if (stageEl) { stageEl.style.color = stageColor; stageEl.style.background = stageBg; }
  // 어두운 배경 여부 토글
  const isDark = (h >= 0 && h < 9) || h >= 17;
  section.classList.toggle('dark-bg', isDark);
}

// ===== 서브탭 =====
window.switchSubTab = function (tab) {
  currentSubTab = tab;
  $id('subTabHabit').classList.toggle('active', tab === 'habit');
  $id('subTabChallenge').classList.toggle('active', tab === 'challenge');
  $id('panelHabit').classList.toggle('active', tab === 'habit');
  $id('panelChallenge').classList.toggle('active', tab === 'challenge');
  // Scroll so "나의 투두" header is visible right below sticky sub-tab-bar
  requestAnimationFrame(() => {
    const scroll = document.querySelector('.dash-scroll');
    const subBar = document.querySelector('.sub-tab-bar');
    const panel = $id(tab === 'habit' ? 'panelHabit' : 'panelChallenge');
    if (!scroll || !subBar || !panel) return;
    const sectionHdr = panel.querySelector('.section-hdr');
    if (!sectionHdr) return;
    // Get position relative to scroll container
    const scrollRect = scroll.getBoundingClientRect();
    const hdrRect = sectionHdr.getBoundingClientRect();
    const subBarH = subBar.offsetHeight + 8;
    // Current offset of hdr from scroll viewport top, then adjust
    const targetScroll = scroll.scrollTop + (hdrRect.top - scrollRect.top) - subBarH;
    scroll.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
  });
};

// ===== 습관 필터 =====
window.toggleHabitFilter = function () {
  habitFilter = habitFilter === 'all' ? 'active' : 'all';
  localStorage.setItem('kw_habitFilter', habitFilter);
  const pill = $id('habitFilterPill');
  pill.classList.toggle('active-filter', habitFilter === 'active');
  pill.innerHTML = (habitFilter === 'active' ? '진행 중' : '전체') + ' <span class="filter-dot"></span>';
  renderHabitCards();
};
window.toggleChallengeFilter = function () {
  challengeFilter = challengeFilter === 'all' ? 'active' : 'all';
  localStorage.setItem('kw_challengeFilter', challengeFilter);
  const pill = $id('challengeFilterPill');
  pill.classList.toggle('active-filter', challengeFilter === 'active');
  pill.innerHTML = (challengeFilter === 'active' ? '진행 중' : '전체') + ' <span class="filter-dot"></span>';
  renderChallengeCards();
};

// ===== 습관 카드 (2열 그리드) =====
window.changeViewMode = function(mode) {
  habitViewMode = mode;
  localStorage.setItem('kw_habitViewMode', mode);
  renderHabitCards();
};

window.toggleGroupAccordion = function(id) {
  const grid = $id(id);
  const iconId = id.replace(/^(hg_|cg_)/, (m) => m === 'hg_' ? 'hgi_' : 'cgi_');
  const icon = $id(iconId);
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
  const todayDone = isCompDone(localDash.completions[todayKey], mg);
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
          ${g.public === false ? '<div class="private-badge">🔒</div>' : ''}
          ${mg.auto ? (() => {
            const av = getAutoValue(localDash.completions[todayKey], mg);
            const ul = getAutoUnitLabel(mg);
            const tgt = mg.autoTarget || 0;
            return av !== null ? `<div class="habit-card-auto">${av < 10 ? av.toFixed(1) : Math.round(av)}${ul} / ${tgt}${ul}</div>` : '';
          })() : ''}
          <div class="habit-card-streak ${streak > 0 ? '' : 'zero'}">
            <span class="streak-num">${streakLbl}</span>
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
    const isDone = isCompDone(localDash.completions[todayKey], mg) || (isOnce && isCompDone(localDash.completions[`g${idx}_once`], mg));
    let lastDoneTs = 0;
    Object.keys(localDash.completions).forEach(k => {
      if (!k.startsWith(`g${idx}_`) || !isCompDone(localDash.completions[k], mg)) return;
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
  const wrapper = $id('habitListWrapper');

  let valid = [];
  // Object.keys로 안전 순회 (Firebase 객체/배열 모두 대응)
  Object.keys(goalsObj).forEach(key => {
    const idx = parseInt(key);
    const g = goalsObj[key];
    if (g && g.title && g.unit) valid.push({ g, idx });
  });

  let filtered = habitFilter === 'active' ? valid.filter(({ g, idx }) => isGoalActiveThisWeek(g, idx)) : valid;
  $id('habitCount').textContent = valid.length;

  // 정렬
  filtered = sortHabitItems(filtered, y, m);

  let html = '';

  const hCardRender = ({ g, idx }) => generateHabitCardHtml(g, idx, y, m);
  if (habitViewMode === 'time') {
    const groups = { dawn: [], morning: [], midday: [], afternoon: [], evening: [], night: [], any: [] };
    filtered.forEach(v => { const t = v.g.time || 'any'; (groups[t] || groups['any']).push(v); });
    html += renderGroupedGrid(groups, 'hg', TIME_LABELS, hCardRender);
  } else if (habitViewMode === 'category') {
    const groups = {};
    Object.keys(CAT_LABELS).forEach(k => { groups[k] = []; });
    filtered.forEach(v => { (groups[v.g.category || 'etc'] || groups['etc']).push(v); });
    html += renderGroupedGrid(groups, 'hg', CAT_LABELS, hCardRender);
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
  $id('habitSwipeHint').style.display = filtered.length > 0 ? 'block' : 'none';
  // Staggered entrance
  filtered.forEach(({ idx }, i) => {
    const outer = $id(`hcOuter_${idx}`);
    if (outer) outer.style.animationDelay = `${i * 0.06}s`;
    initHabitSwipe(idx);
  });
}

// ===== 습관 스와이프 =====
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function initHabitSwipe(idx) {
  const card = $id(`hc_${idx}`);
  if (!card) return;

  // PC: 클릭만 (바텀시트 열기)
  if (!isTouchDevice) {
    card.addEventListener('click', () => openGoalBottomSheet(idx));
    card.style.cursor = 'pointer';
    return;
  }

  // Mobile touch swipe
  let sx = 0, sy = 0, dx = 0, swiping = false, locked = false, touchStartTime = 0, totalMove = 0;
  const TH = 60;
  const outer = $id(`hcOuter_${idx}`);

  function onS(e) {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; dx = 0; swiping = false; locked = false;
    touchStartTime = Date.now(); totalMove = 0;
    card.classList.remove('snapping');
    if (outer) { outer.classList.remove('swiping-right', 'swiping-left'); }
  }
  function onM(e) {
    if (locked) return;
    const t = e.touches[0];
    const dX = t.clientX - sx, dY = t.clientY - sy;
    totalMove = Math.abs(dX) + Math.abs(dY);
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
    const elapsed = Date.now() - touchStartTime;
    if (!swiping) {
      card.style.transform = '';
      card.classList.remove('swiping');
      // 명확한 탭: 이동량 적고, 너무 짧지 않은 터치
      if (totalMove < 20 && elapsed < 600) {
        openGoalBottomSheet(idx);
      }
      return;
    }
    card.classList.remove('swiping');
    card.classList.add('snapping');
    const isDone = card.dataset.done === '1';

    if (dx >= TH && !isDone) {
      triggerHaptic('light');
      const cardW = card.offsetWidth || 200;
      card.style.transform = `translateX(${cardW + 20}px)`;
      setTimeout(() => habitMarkDone(idx), 350);
    } else if (dx <= -TH && isDone) {
      triggerHaptic('light');
      const cardW = card.offsetWidth || 200;
      card.style.transform = `translateX(${-(cardW + 20)}px)`;
      setTimeout(() => habitMarkUndo(idx), 350);
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

  // 오늘 첫 완료인지 체크 (알림 전에)
  const y = now.getFullYear(), m = now.getMonth()+1, d = now.getDate();
  const todaySuffix = `_${y}_${m}_${d}`;
  const wasTodayZero = !Object.entries(localDash.completions || {}).some(([ck, cv]) => ck.endsWith(todaySuffix) && isCompDone(cv, null) && ck !== k);

  localDash.completions[k] = true;
  triggerHaptic('heavy');
  showToast('🎉 완료!', 'done'); showConfettiSmall();
  if (!isOnce) checkWeekClear(idx);
  renderHabitCards(); renderAvatar();
  await saveDash();
  checkMilestone();
  renderMilestoneBar();

  // 오늘 첫 습관 완료 시 친구들에게 알림
  if (wasTodayZero && !isOnce) {
    notifyFriendsFirstActivity();
  }
}

async function notifyFriendsFirstActivity() {
  try {
    const grpSnap = await get(ref(db, 'groups'));
    if (!grpSnap.exists()) return;
    const groups = grpSnap.val();
    let friendIds = new Set();
    Object.values(groups).forEach(g => { if (g.members && Object.values(g.members).includes(currentUser.id)) Object.values(g.members).forEach(mid => { if (mid !== currentUser.id) friendIds.add(mid); }); });
    const myNick = localDash.nickname || currentUser.name;
    for (const fid of friendIds) {
      await createNotification(fid, 'activity', `${myNick}님이 오늘 첫 습관을 완료했어요! 🔥`);
    }
  } catch (e) {}
}

async function habitMarkUndo(idx) {
  const now = new Date();
  const g = migrateGoal(localDash.goals[idx]);
  const isOnce = g && g.unit === 'once';
  const k = isOnce ? `g${idx}_once` : `g${idx}_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}`;
  localDash.completions[k] = false;
  triggerHaptic('light');
  showToast('↩️ 취소', 'undo');
  renderHabitCards(); renderAvatar();
  checkMilestoneUndo();
  await saveDash();
  renderStageMessage();
  renderMilestoneBar();
}

// ===== 도전 카드 (2열 그리드) =====
window.changeChallengeViewMode = function(mode) { challengeViewMode = mode; localStorage.setItem('kw_challengeViewMode', mode); renderChallengeCards(); };

function generateChallengeCardHtml(c, idx) {
  if (c.type === 'bucket') {
    const done = c.done === true;
    return `<div class="challenge-card-outer" id="ccOuter_${idx}">
      <div class="challenge-swipe-bg ${done ? 'done' : 'todo'}">
        <div class="swipe-bg-text">${done ? '↩ 취소' : '✓ 완료'}</div>
      </div>
      <div class="challenge-card type-bucket ${done ? 'bucket-done' : ''}" id="cc_${idx}" data-idx="${idx}">
        ${done ? '<div class="challenge-card-done-badge">✓</div>' : ''}
        <div>
          <div class="challenge-card-title">${esc(c.title)}</div>
          <span class="challenge-card-type bucket">버킷리스트</span>
          ${c.public === false ? '<span class="private-badge">🔒</span>' : ''}
        </div>
        ${done ? '<div><div class="challenge-card-achieve">달성 완료</div></div>' : '<div></div>'}
      </div>
    </div>`;
  } else {
    const { done, total, pct } = getProjectProgress(c);
    const projDone = pct >= 100;
    return `<div class="challenge-card type-project ${projDone ? 'project-done' : ''}" id="cc_${idx}" data-idx="${idx}" onclick="openProjectDetail(${idx})">
      ${projDone ? '<div class="challenge-card-done-badge">✓</div>' : ''}
      <div>
        <div class="challenge-card-title">${esc(c.title)}</div>
        <div class="challenge-card-meta-row">
          <span class="challenge-card-type project">프로젝트</span>
          ${c.public === false ? '<span class="private-badge">🔒</span>' : ''}
          <span class="challenge-card-stage">${done}/${total} 단계</span>
        </div>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="challenge-card-bar" style="flex:1;"><div class="challenge-card-bar-fill project" style="width:${Math.min(pct,100)}%"></div></div>
          <div class="challenge-card-pct project">${pct}%</div>
        </div>
      </div>
    </div>`;
  }
}

function renderChallengeCards() {
  const challengesObj = localDash.challenges || {};
  const wrapper = $id('challengeListWrapper');
  let valid = [];
  Object.keys(challengesObj).forEach(key => {
    const idx = parseInt(key);
    const c = challengesObj[key];
    if (c && c.title) valid.push({ c, idx });
  });
  let filtered = valid;
  if (challengeFilter === 'active') filtered = valid.filter(({ c }) => !isChallengeComplete(c));
  $id('challengeCount').textContent = valid.length;

  let html = '';

  const cCardRender = ({ c, idx }) => generateChallengeCardHtml(c, idx);
  if (challengeViewMode === 'type') {
    const groups = { bucket: [], project: [] };
    filtered.forEach(v => { (groups[v.c.type || 'bucket'] || groups['bucket']).push(v); });
    html += renderGroupedGrid(groups, 'cg', TYPE_LABELS, cCardRender);
  } else if (challengeViewMode === 'category') {
    const groups = {};
    Object.keys(CAT_LABELS).forEach(k => { groups[k] = []; });
    filtered.forEach(v => { (groups[v.c.category || 'etc'] || groups['etc']).push(v); });
    html += renderGroupedGrid(groups, 'cg', CAT_LABELS, cCardRender);
  } else if (challengeViewMode === 'month') {
    const groups = {};
    filtered.forEach(v => { const tm = v.c.targetMonth || 'someday'; if (!groups[tm]) groups[tm] = []; groups[tm].push(v); });
    const sortedKeys = Object.keys(groups).sort((a, b) => a === 'someday' ? 1 : b === 'someday' ? -1 : a.localeCompare(b));
    // 월별은 동적 라벨이므로 직접 렌더링
    let gIdx = 0;
    sortedKeys.forEach(key => {
      if (groups[key].length === 0) return;
      const label = formatTargetMonth(key);
      html += `<div class="group-header" onclick="toggleGroupAccordion('cg_${gIdx}')">
        <div class="group-header-left">${groupLabel(label)} <span style="font-size:12px;color:var(--accent);">${groups[key].length}</span></div>
        <div class="group-toggle-icon" id="cgi_${gIdx}">▼</div>
      </div><div class="card-grid" id="cg_${gIdx}">`;
      groups[key].forEach(v => { html += cCardRender(v); });
      html += `</div>`;
      gIdx++;
    });
  } else {
    html += `<div class="card-grid">`;
    filtered.forEach(({ c, idx }) => { html += generateChallengeCardHtml(c, idx); });
    if (valid.length < MAX_CHALLENGES) html += `<div class="grid-add-btn" onclick="openAddChallengeSheet()"><div class="grid-add-btn-icon">＋</div><div class="grid-add-btn-text">도전 추가</div></div>`;
    html += `</div>`;
  }

  if (challengeViewMode !== 'all' && valid.length < MAX_CHALLENGES) {
    html += `<div class="card-grid" style="margin-top:12px;"><div class="grid-add-btn" onclick="openAddChallengeSheet()"><div class="grid-add-btn-icon">＋</div><div class="grid-add-btn-text">도전 추가</div></div></div>`;
  }

  wrapper.innerHTML = html;
  $id('challengeSwipeHint').style.display = filtered.length > 0 ? 'block' : 'none';
  // Init swipe + staggered entrance for ALL bucket cards
  wrapper.querySelectorAll('.challenge-card.type-bucket').forEach((el, i) => {
    const idx = parseInt(el.dataset.idx);
    el.style.animationDelay = `${i * 0.06}s`;
    if (!isNaN(idx)) initBucketSwipe(idx);
  });
  // Staggered entrance for project cards
  wrapper.querySelectorAll('.challenge-card.type-project').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.06}s`;
  });
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

// ===== 버킷 스와이프 =====
function initBucketSwipe(idx) {
  const card = $id(`cc_${idx}`);
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
    const elapsed = Date.now() - tapStart;
    if (Math.abs(dx) >= TH) { triggerHaptic('light'); const cW = card.offsetWidth || 200; card.style.transform = `translateX(${dx > 0 ? cW + 20 : -(cW + 20)}px)`; setTimeout(() => swipeBucket(idx), 350); }
    else {
      card.style.transform = 'translateX(0)';
      const totalMove = Math.abs(sx - (dx + sx));
      if (!swiping && elapsed < 600 && totalMove < 20) openBucketDetail(idx);
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
  if (!wasDone) { triggerHaptic('heavy'); showToast('🎉 버킷리스트 달성!', 'done'); showConfetti(); }
  else { triggerHaptic('light'); showToast('↩️ 취소', 'undo'); }
  renderChallengeCards();
  await saveDash();
}

// ===== 버킷 상세 =====
window.openBucketDetail = function (idx) {
  const c = localDash.challenges[idx];
  if (!c) return;
  $text('bsTitle', c.title);
  setChallengeMetaTags(c);
  const done = c.done === true;
  let h = `<div style="text-align:center;padding:30px 0;">
    <div style="font-size:48px;margin-bottom:12px;">${done ? '🏆' : '🎯'}</div>
    <span class="challenge-card-type bucket" style="background:${done?'#ecfdf5':'#fff0f3'};color:${done?'#10b981':'var(--accent2)'};border:1px solid ${done?'#d1fae5':'rgba(255,94,125,.2)'};font-size:12px;">버킷리스트</span>
    ${done ? '<div style="margin-top:12px;font-size:14px;font-weight:700;color:#10b981;">달성 완료! 🎉</div>' : '<div style="margin-top:12px;font-size:13px;color:var(--text-dim);">← 스와이프하여 완료 처리</div>'}
  </div>`;
  h += `<button class="proj-edit-btn" onclick="openBucketEdit(${idx})">✏️ 수정</button>`;
  h += `<button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteChallenge(${idx})">🗑 삭제</button>`;
  $html('bsBody', h);
  openBS();
};

window.openBucketEdit = function (idx) {
  const c = localDash.challenges[idx];
  if (!c) return;
  $text('bsTitle', '버킷리스트 수정');
  clearMetaTags();
  _bucketEditCat = c.category || 'etc';
  _bucketEditMonth = c.targetMonth || 'someday';
  const cat = c.category || 'etc';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">이름</div>`;
  h += `<input class="proj-edit-input" id="editBucketName" value="${esc(c.title)}" maxlength="30">`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">🏷 카테고리</div>`;
  h += `<div class="chip-group" id="bucketCatChips">`;
  Object.keys(CAT_LABELS).forEach(k => {
    h += `<div class="chip-opt ${cat === k ? 'selected' : ''}" onclick="selectBucketCat('${k}')">${CAT_LABELS[k]}</div>`;
  });
  h += `</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">📅 목표 시기</div>`;
  h += `<div id="bucketMonthArea">${getEditMonthChipsHTML(_bucketEditMonth, 'bucket')}</div>`;
  const bEditPriv = c.public === false;
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;margin:16px 0 0;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">
    <div><div style="font-size:13px;font-weight:700;color:var(--text);">🔒 비공개</div><div style="font-size:11px;color:var(--text-dim);">친구에게 이 도전을 숨겨요</div></div>
    <label class="toggle-switch"><input type="checkbox" id="editBucketPrivate" ${bEditPriv ? 'checked' : ''}><span class="toggle-slider"></span></label>
  </div>`;
  h += `<div class="proj-save-row" style="margin-top:24px;"><button class="proj-save-btn cancel" onclick="openBucketDetail(${idx})">취소</button><button class="proj-save-btn save" onclick="saveBucketEdit(${idx})">저장</button></div>`;
  $html('bsBody', h);
  setTimeout(() => $id('editBucketName')?.focus(), 200);
};

let _bucketEditCat = 'etc';
let _projEditCat = 'etc';
let _bucketEditMonth = 'someday';
let _projEditMonth = 'someday';

function getEditMonthChipsHTML(selectedMonth, prefix) {
  const now = new Date();
  const curY = now.getFullYear(), curM = now.getMonth();
  let h = `<div class="chip-group" id="${prefix}MonthChips"><div class="chip-opt ${selectedMonth === 'someday' ? 'selected' : ''}" onclick="selectEditMonth_${prefix}('someday')">☁️ 언젠가 할 일</div>`;
  for (let m = 0; m < 12; m++) {
    const val = `${curY}-${String(m+1).padStart(2,'0')}`;
    const lbl = `${curY}년 ${m+1}월`;
    const isPast = m < curM;
    if (isPast) {
      h += `<div class="chip-opt" style="opacity:0.35;cursor:not-allowed;pointer-events:none;">📅 ${lbl}</div>`;
    } else {
      h += `<div class="chip-opt ${selectedMonth === val ? 'selected' : ''}" onclick="selectEditMonth_${prefix}('${val}')">📅 ${lbl}</div>`;
    }
  }
  h += `</div>`;
  return h;
}

window.selectEditMonth_bucket = function(m) {
  _bucketEditMonth = m;
  const wrapper = $id('bucketMonthArea');
  if (wrapper) wrapper.innerHTML = getEditMonthChipsHTML(m, 'bucket');
};

window.selectEditMonth_proj = function(m) {
  _projEditMonth = m;
  const wrapper = $id('projMonthArea');
  if (wrapper) wrapper.innerHTML = getEditMonthChipsHTML(m, 'proj');
};

window.selectBucketCat = function (cat) {
  _bucketEditCat = cat;
  document.querySelectorAll('#bucketCatChips .chip-opt').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
};

window.selectProjEditCat = function (cat) {
  _projEditCat = cat;
  document.querySelectorAll('#projEditCatChips .chip-opt').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
};

window.saveBucketEdit = async function (idx) {
  const name = $id('editBucketName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }
  const selCat = document.querySelector('#bucketCatChips .chip-opt.selected');
  const cat = selCat ? [...document.querySelectorAll('#bucketCatChips .chip-opt')].indexOf(selCat) : -1;
  const catKey = cat >= 0 ? Object.keys(CAT_LABELS)[cat] : 'etc';
  localDash.challenges[idx].title = name;
  localDash.challenges[idx].targetMonth = _bucketEditMonth;
  localDash.challenges[idx].category = catKey;
  localDash.challenges[idx].public = !$id('editBucketPrivate')?.checked;
  delete localDash.challenges[idx].deadline;
  await saveDash();
  renderChallengeCards();
  closeBottomSheet();
  showToast('✅ 수정 완료', 'done');
};

// ===== 도전 추가 =====
// ===== 칩 헬퍼 =====
function getCatChipsHTML() {
  return `<div class="chip-group">` + Object.keys(CAT_LABELS).map(k => `<div class="chip-opt ${_createCat === k ? 'selected' : ''}" onclick="selectCreateCat('${k}')">${CAT_LABELS[k]}</div>`).join('') + `</div>`;
}
function getMonthChipsHTML() {
  const now = new Date();
  const curY = now.getFullYear(), curM = now.getMonth(); // 0-indexed
  let h = `<div class="chip-group"><div class="chip-opt ${_createMonth === 'someday' ? 'selected' : ''}" onclick="selectCreateMonth('someday')">☁️ 언젠가 할 일</div>`;
  for (let m = 0; m < 12; m++) {
    const val = `${curY}-${String(m+1).padStart(2,'0')}`;
    const lbl = `${curY}년 ${m+1}월`;
    const isPast = m < curM;
    if (isPast) {
      h += `<div class="chip-opt" style="opacity:0.35;cursor:not-allowed;pointer-events:none;">📅 ${lbl}</div>`;
    } else {
      h += `<div class="chip-opt ${_createMonth === val ? 'selected' : ''}" onclick="selectCreateMonth('${val}')">📅 ${lbl}</div>`;
    }
  }
  h += `</div>`;
  return h;
}
window.selectCreateCat = function(c) { _createCat = c; $id('createCatArea').innerHTML = getCatChipsHTML(); };
window.selectCreateMonth = function(m) { _createMonth = m; $id('createMonthArea').innerHTML = getMonthChipsHTML(); };

// ===== 단계 빌더 =====
function syncCreateStagesFromDOM() {
  const stages = [];
  let si = 0;
  while ($id(`pcStageName_${si}`)) {
    const name = $id(`pcStageName_${si}`).value;
    const tasks = [];
    let ti = 0;
    while ($id(`pcTask_${si}_${ti}`)) {
      tasks.push({ name: $id(`pcTask_${si}_${ti}`).value, done: false });
      ti++;
    }
    stages.push({ name, tasks });
    si++;
  }
  _createStages = stages;
}
function getCreateStagesHTML() {
  let h = '';
  _createStages.forEach((s, si) => {
    h += `<div class="proj-edit-stage-box" id="pcStage_${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="proj-stage-num">${si + 1}</div>
        <input class="proj-edit-task-input" id="pcStageName_${si}" value="${esc(s.name)}" placeholder="단계 이름" style="flex:1;">
        <button class="proj-edit-task-del" onclick="removeCreateStage(${si})" title="단계 삭제">✕</button>
      </div>`;
    (s.tasks || []).forEach((t, ti) => {
      h += `<div class="proj-edit-task-row"><input class="proj-edit-task-input" id="pcTask_${si}_${ti}" value="${esc(t.name)}" placeholder="세부 항목"><button class="proj-edit-task-del" onclick="removeCreateTask(${si},${ti})">✕</button></div>`;
    });
    h += `<button class="proj-add-task-btn" onclick="addCreateTask(${si})">+ 세부 항목 추가</button></div>`;
  });
  h += `<button class="proj-add-stage-btn" onclick="addCreateStage()">+ 새 단계 추가</button>`;
  return h;
}
window.addCreateTask = function(si) { syncCreateStagesFromDOM(); _createStages[si].tasks.push({name:'', done:false}); $id('createStagesArea').innerHTML = getCreateStagesHTML(); };
window.removeCreateTask = function(si, ti) { syncCreateStagesFromDOM(); _createStages[si].tasks.splice(ti, 1); $id('createStagesArea').innerHTML = getCreateStagesHTML(); };
window.addCreateStage = function() { syncCreateStagesFromDOM(); _createStages.push({name:'', tasks:[]}); $id('createStagesArea').innerHTML = getCreateStagesHTML(); };
window.removeCreateStage = function(si) { syncCreateStagesFromDOM(); _createStages.splice(si, 1); $id('createStagesArea').innerHTML = getCreateStagesHTML(); };

// ===== 도전 추가 위자드 =====
let _cwizStep = 0;
let _cwizTotalSteps = 5; // bucket: 5, project: 6

function cwizGoTo(step) {
  const container = $id('bsBody');
  if (!container) return;
  const slides = container.querySelectorAll('.wiz-slide');
  slides.forEach((s, i) => {
    s.classList.remove('active', 'exit-left');
    if (i < step) s.classList.add('exit-left');
    else if (i === step) s.classList.add('active');
  });
  _cwizStep = step;
  const summaryEl = $id('cAddSummary');
  const lastStep = _createType === 'project' ? 5 : 4;
  if (summaryEl) summaryEl.style.display = step === lastStep ? 'none' : 'flex';
  renderCAddSummary();
  renderCAddDots();
}

window.cwizGoTo = cwizGoTo;

function renderCAddSummary() {
  const el = $id('cAddSummary');
  if (!el) return;
  const chips = [];
  const typeLbl = _createType === 'bucket' ? '⭐ 버킷리스트' : _createType === 'project' ? '🗺️ 프로젝트' : null;
  if (_cwizStep > 0 && typeLbl) chips.push({ label: typeLbl, step: 0 });
  const name = $id('cAddName')?.value.trim();
  if (_cwizStep > 1 && name) chips.push({ label: name, step: 1 });
  if (_cwizStep > 2 && _createCat) {
    const cl = { health:'💪 건강', diet:'🥗 식단', study:'📚 학습', work:'💼 업무', finance:'💰 재무', life:'🌱 생활', home:'🧹 집안일', hobby:'🎨 취미', social:'🤝 관계', mental:'🧘 멘탈', etc:'📦 기타' };
    chips.push({ label: cl[_createCat] || _createCat, step: 2 });
  }
  if (_cwizStep > 3 && _createMonth) {
    const lbl = _createMonth === 'someday' ? '언젠가' : _createMonth;
    chips.push({ label: lbl, step: 3 });
  }
  if (_cwizStep > 4 && _createType === 'project') {
    chips.push({ label: `${_createStages.length}단계`, step: 4 });
  }
  el.innerHTML = chips.map(c => `<span class="wiz-chip" onclick="cwizGoTo(${c.step})">${esc(c.label)}</span>`).join('');
}

function renderCAddDots() {
  const els = document.querySelectorAll('.cAddDotsBar');
  const total = _createType === 'project' ? 6 : 5;
  let h = '';
  for (let i = 0; i < total; i++) {
    const cls = i === _cwizStep ? 'active' : i < _cwizStep ? 'done' : '';
    h += `<div class="wiz-dot ${cls}" onclick="cwizDotTap(${i})" style="cursor:pointer;"></div>`;
  }
  els.forEach(el => { el.innerHTML = h; });
}

window.cwizDotTap = function (step) {
  if (step < _cwizStep) cwizGoTo(step);
};

window.openAddChallengeSheet = function () {
  const count = Object.values(localDash.challenges || {}).filter(c => c && c.title).length;
  if (count >= MAX_CHALLENGES) { showToast(`도전은 최대 ${MAX_CHALLENGES}개까지 만들 수 있어요`, 'normal'); return; }
  _createType = null; _createCat = null; _createMonth = null;
  _createStages = [{ name: '', tasks: [] }];
  _cwizStep = 0;
  $text('bsTitle', '새로운 도전 만들기');
  clearMetaTags();

  let h = `<div class="wiz-summary" id="cAddSummary"></div>`;
  h += `<div class="wiz-wrap">`;

  // Slide 0: Type
  h += `<div class="wiz-slide active" id="cWiz0">
    <div class="pdisc-label">유형</div>
    <div class="challenge-type-grid">
      <div class="challenge-type-card" id="ctBucket2" onclick="cAddSelectType('bucket')">
        <span class="challenge-type-icon">⭐</span>
        <div class="challenge-type-name">버킷리스트</div>
        <div class="challenge-type-desc">한 번의 실천으로<br>완료되는 꿈</div>
      </div>
      <div class="challenge-type-card" id="ctProject2" onclick="cAddSelectType('project')">
        <span class="challenge-type-icon">🗺️</span>
        <div class="challenge-type-name">프로젝트</div>
        <div class="challenge-type-desc">단계별 로드맵이<br>필요한 목표</div>
      </div>
    </div>
    <div class="wiz-nav"><div class="wiz-dots cAddDotsBar"></div></div>
  </div>`;

  // Slide 1: Name
  h += `<div class="wiz-slide" id="cWiz1">
    <div class="pdisc-label">도전의 이름</div>
    <input class="proj-edit-input" id="cAddName" placeholder="어떤 도전을 시작하시나요?" maxlength="30">
    <div class="wiz-nav" style="flex-direction:column;gap:10px;"><div class="wiz-dots cAddDotsBar"></div><button class="unit-confirm-btn" style="width:100%;padding:12px 28px;" onclick="cWizNameNext()">다음</button></div>
  </div>`;

  // Slide 2: Category
  h += `<div class="wiz-slide" id="cWiz2">
    <div class="pdisc-label">카테고리</div>
    <div id="cAddCatArea"></div>
    <div class="wiz-nav"><div class="wiz-dots cAddDotsBar"></div></div>
  </div>`;

  // Slide 3: Target month
  h += `<div class="wiz-slide" id="cWiz3">
    <div class="pdisc-label">목표 시기</div>
    <div id="cAddMonthArea"></div>
    <div class="wiz-nav"><div class="wiz-dots cAddDotsBar"></div></div>
  </div>`;

  // Slide 4: Stages (project only) — will be skipped for bucket
  h += `<div class="wiz-slide" id="cWiz4">
    <div class="pdisc-label">단계 설정</div>
    <div id="cAddStagesArea"></div>
    <div class="wiz-nav" style="flex-direction:column;gap:10px;"><div class="wiz-dots cAddDotsBar"></div><button class="unit-confirm-btn" style="width:100%;padding:12px 28px;" onclick="cWizStagesNext()">다음</button></div>
  </div>`;

  // Slide 5: Confirm (project) / Slide 4: Confirm (bucket)
  h += `<div class="wiz-slide" id="cWiz5">
    <div style="text-align:center;padding:16px 0;">
      <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;" id="cWizConfirmTags"></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;margin:0 0 12px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text);">🔒 비공개</div>
        <div style="font-size:11px;color:var(--text-dim);">친구에게 이 도전을 숨겨요</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="cAddPrivate">
        <span class="toggle-slider"></span>
      </label>
    </div>
    <button class="unit-confirm-btn" onclick="cAddSave()">도전 시작하기</button>
    <div class="wiz-nav" style="border:none;margin-top:8px;"><div class="wiz-dots cAddDotsBar"></div></div>
  </div>`;

  h += `</div>`;

  $html('bsBody', h);
  openBS();
  renderCAddCat();
  renderCAddMonth();
  renderCAddDots();
};

window.cAddSelectType = function (type) {
  _createType = type;
  $id('ctBucket2').classList.toggle('selected', type === 'bucket');
  $id('ctProject2').classList.toggle('selected', type === 'project');
  cwizGoTo(1);
  setTimeout(() => $id('cAddName')?.focus(), 200);
};

window.cWizNameNext = function () {
  const v = $id('cAddName')?.value.trim();
  if (!v) { showToast('이름을 입력해주세요', 'normal'); $id('cAddName')?.focus(); return; }
  cwizGoTo(2);
};

function renderCAddCat() {
  const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
  let h = `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
  catOpts.forEach(([val, lbl]) => {
    const sel = _createCat === val;
    h += `<div class="unit-opt" style="font-size:11px;padding:6px 10px;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="cAddSelectCat('${val}')">${lbl}</div>`;
  });
  h += `</div>`;
  const el = $id('cAddCatArea');
  if (el) el.innerHTML = h;
}

window.cAddSelectCat = function (val) {
  _createCat = val;
  renderCAddCat();
  cwizGoTo(3);
};

function renderCAddMonth() {
  const now = new Date();
  const months = [['someday', '언젠가']];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push([key, `${d.getFullYear()}년 ${d.getMonth()+1}월`]);
  }
  let h = `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
  months.forEach(([val, lbl]) => {
    const sel = _createMonth === val;
    h += `<div class="unit-opt" style="font-size:11px;padding:6px 10px;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="cAddSelectMonth('${val}')">${lbl}</div>`;
  });
  h += `</div>`;
  const el = $id('cAddMonthArea');
  if (el) el.innerHTML = h;
}

window.cAddSelectMonth = function (val) {
  _createMonth = val;
  renderCAddMonth();
  if (_createType === 'project') {
    renderCAddStages();
    cwizGoTo(4);
  } else {
    renderCWizConfirm();
    // For bucket, slide 4 is stages (skip), go to 5 which is confirm
    // But we need to map: bucket confirm = slide index 5
    cwizGoTo(5);
  }
};

function renderCAddStages() {
  const area = $id('cAddStagesArea');
  if (!area) return;
  let h = '';
  _createStages.forEach((s, i) => {
    h += `<div style="margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div class="proj-stage-num">${i + 1}</div>
        <input class="proj-edit-task-input" id="cStageName_${i}" value="${esc(s.name)}" placeholder="${i + 1}단계 이름" style="flex:1;">
        ${_createStages.length > 1 ? `<button class="proj-edit-task-del" onclick="cRemoveStage(${i})">✕</button>` : ''}
      </div>`;
    // Sub-tasks
    (s.tasks || []).forEach((t, ti) => {
      h += `<div style="display:flex;align-items:center;gap:6px;margin-left:36px;margin-bottom:4px;">
        <input class="proj-edit-task-input" id="cTask_${i}_${ti}" value="${esc(t.name)}" placeholder="세부 항목" style="flex:1;font-size:12px;">
        <button class="proj-edit-task-del" onclick="cRemoveTask(${i},${ti})" style="font-size:11px;">✕</button>
      </div>`;
    });
    h += `<button class="proj-add-task-btn" style="margin-left:36px;font-size:11px;" onclick="cAddTask(${i})">＋ 세부 단계 추가</button>`;
    h += `</div>`;
  });
  if (_createStages.length < 10) {
    h += `<button class="proj-add-stage-btn" onclick="cAddStage()">＋ 단계 추가</button>`;
  }
  area.innerHTML = h;
}

window.cAddTask = function (si) {
  syncCStagesFromDOM();
  _createStages[si].tasks.push({ name: '', done: false });
  renderCAddStages();
  const ti = _createStages[si].tasks.length - 1;
  setTimeout(() => $id(`cTask_${si}_${ti}`)?.focus(), 100);
};

window.cRemoveTask = function (si, ti) {
  syncCStagesFromDOM();
  _createStages[si].tasks.splice(ti, 1);
  renderCAddStages();
};

window.cAddStage = function () {
  syncCStagesFromDOM();
  _createStages.push({ name: '', tasks: [] });
  renderCAddStages();
  setTimeout(() => $id(`cStageName_${_createStages.length - 1}`)?.focus(), 100);
};

window.cRemoveStage = function (i) {
  syncCStagesFromDOM();
  _createStages.splice(i, 1);
  renderCAddStages();
};

function syncCStagesFromDOM() {
  _createStages.forEach((s, i) => {
    const nameEl = $id(`cStageName_${i}`);
    if (nameEl) s.name = nameEl.value;
    (s.tasks || []).forEach((t, ti) => {
      const taskEl = $id(`cTask_${i}_${ti}`);
      if (taskEl) t.name = taskEl.value;
    });
  });
}

window.cWizStagesNext = function () {
  syncCStagesFromDOM();
  renderCWizConfirm();
  cwizGoTo(5);
};

function renderCWizConfirm() {
  const tagsEl = $id('cWizConfirmTags');
  if (!tagsEl) return;
  const name = $id('cAddName')?.value.trim() || '';
  const typeLbl = _createType === 'bucket' ? '⭐ 버킷리스트' : '🗺️ 프로젝트';
  const cl = { health:'💪 건강', diet:'🥗 식단', study:'📚 학습', work:'💼 업무', finance:'💰 재무', life:'🌱 생활', home:'🧹 집안일', hobby:'🎨 취미', social:'🤝 관계', mental:'🧘 멘탈', etc:'📦 기타' };
  const monthLbl = _createMonth === 'someday' ? '언젠가' : _createMonth;
  const tags = [
    { label: name, step: 1 },
    { label: typeLbl, step: 0 },
    { label: cl[_createCat], step: 2 },
    { label: monthLbl, step: 3 }
  ];
  if (_createType === 'project') {
    syncCStagesFromDOM();
    tags.push({ label: `${_createStages.length}단계`, step: 4 });
  }
  tagsEl.innerHTML = tags.filter(t => t.label).map(t => `<span class="wiz-chip" onclick="cwizGoTo(${t.step})">${t.label}</span>`).join('');
}

window.cAddSave = async function () {
  const name = $id('cAddName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }
  if (!_createType) { showToast('유형을 선택해주세요', 'normal'); return; }
  if (!localDash.challenges) localDash.challenges = {};
  let slot = -1;
  for (let i = 0; i < MAX_CHALLENGES; i++) { if (!localDash.challenges[i] || !localDash.challenges[i].title) { slot = i; break; } }
  if (slot === -1) { showToast('최대 25개까지 등록 가능합니다', 'normal'); return; }

  const cIsPrivate = $id('cAddPrivate')?.checked;

  if (_createType === 'bucket') {
    localDash.challenges[slot] = { type: 'bucket', title: name, done: false, category: _createCat || 'etc', targetMonth: _createMonth || 'someday', createdAt: new Date().toISOString(), public: !cIsPrivate };
  } else {
    syncCStagesFromDOM();
    _createStages.forEach((s, i) => {
      if (!s.name.trim()) s.name = `${i+1}단계`;
      (s.tasks || []).forEach(t => { if (!t.name.trim()) t.name = '항목'; });
    });
    localDash.challenges[slot] = { type: 'project', title: name, category: _createCat || 'etc', targetMonth: _createMonth || 'someday', stages: _createStages, createdAt: new Date().toISOString(), public: !cIsPrivate };
  }
  closeBottomSheet(); renderChallengeCards();
  showToast(_createType === 'bucket' ? '⭐ 도전 등록!' : '🗺️ 프로젝트 시작!', 'done');
  await saveDash();
};

// ===== 프로젝트 상세 =====
window.openProjectDetail = function (idx) {
  const c = localDash.challenges[idx];
  if (!c || c.type !== 'project') return;
  activeGoalIdx = idx;
  $text('bsTitle', c.title);
  setChallengeMetaTags(c);
  renderProjectDetail(idx);
  openBS();
};

function renderProjectDetail(idx) {
  const c = localDash.challenges[idx], body = $id('bsBody');
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
  h += `<div style="display:flex;align-items:center;gap:8px;padding:12px 0;"><div style="flex:1;height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;"><div style="height:100%;width:${Math.min(pct,100)}%;background:linear-gradient(90deg,#60a5fa,#6366f1);border-radius:100px;"></div></div><span style="font-family:var(--font-heading);font-size:16px;color:var(--accent);">${pct}%</span></div>`;
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

// ===== 프로젝트 편집 =====
window.openProjectEdit = function (idx) {
  const c = localDash.challenges[idx], body = $id('bsBody');
  $text('bsTitle', '프로젝트 수정');
  clearMetaTags();
  _projEditCat = c.category || 'etc';
  _projEditMonth = c.targetMonth || 'someday';
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>`;
  h += `<input class="proj-edit-input" id="peTitle" value="${esc(c.title)}" maxlength="30">`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">🏷 카테고리</div>`;
  h += `<div class="chip-group" id="projEditCatChips">`;
  Object.keys(CAT_LABELS).forEach(k => {
    h += `<div class="chip-opt ${_projEditCat === k ? 'selected' : ''}" onclick="selectProjEditCat('${k}')">${CAT_LABELS[k]}</div>`;
  });
  h += `</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">📅 목표 시기</div>`;
  h += `<div id="projMonthArea">${getEditMonthChipsHTML(_projEditMonth, 'proj')}</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">나의 궁극적인 목적 (WHY)</div>`;
  h += `<textarea class="proj-edit-input proj-edit-textarea" id="peWhy" maxlength="100">${esc(c.why || '')}</textarea>`;
  // Stages with task checkboxes
  const origStages = c.stages || [];
  origStages.forEach((s, si) => {
    h += `<div class="proj-edit-stage-box" id="peStage_${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="proj-stage-num">${si + 1}</div>
        <input class="proj-edit-task-input" id="peStageName_${si}" value="${esc(s.name)}" placeholder="단계 이름" style="flex:1;">
        <button class="proj-edit-task-del" onclick="removeEditStage(${si})" title="단계 삭제">✕</button>
      </div>`;
    (s.tasks || []).forEach((t, ti) => {
      const checked = t.done ? 'checked' : '';
      h += `<div class="proj-edit-task-row">
        <label class="task-check-label"><input type="checkbox" class="task-check" id="peTaskDone_${si}_${ti}" ${checked}><span class="task-check-mark"></span></label>
        <input class="proj-edit-task-input" id="peTask_${si}_${ti}" value="${esc(t.name)}" placeholder="세부 항목" style="${t.done ? 'text-decoration:line-through;color:var(--text-dim);' : ''}">
        <button class="proj-edit-task-del" onclick="removeEditTask(${si},${ti})">✕</button>
      </div>`;
    });
    h += `<button class="proj-add-task-btn" onclick="addEditTask(${si})">+ 세부 항목 추가</button></div>`;
  });
  h += `<button class="proj-add-stage-btn" onclick="addEditStage()">+ 새 단계 추가</button>`;
  const pEditPriv = c.public === false;
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;margin:16px 0 0;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">
    <div><div style="font-size:13px;font-weight:700;color:var(--text);">🔒 비공개</div><div style="font-size:11px;color:var(--text-dim);">친구에게 이 도전을 숨겨요</div></div>
    <label class="toggle-switch"><input type="checkbox" id="editProjPrivate" ${pEditPriv ? 'checked' : ''}><span class="toggle-slider"></span></label>
  </div>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="cancelProjectEdit(${idx})">취소</button><button class="proj-save-btn save" onclick="saveProjectEdit(${idx})">저장</button></div>`;
  body.innerHTML = h;
};

// Edit helpers - rebuild HTML each time for simplicity
let _editStages = [];
function getEditStagesFromDOM() {
  const stages = [];
  let si = 0;
  while ($id(`peStageName_${si}`)) {
    const name = $id(`peStageName_${si}`).value;
    const tasks = [];
    let ti = 0;
    while ($id(`peTask_${si}_${ti}`)) {
      const done = $id(`peTaskDone_${si}_${ti}`)?.checked || false;
      tasks.push({ name: $id(`peTask_${si}_${ti}`).value, done });
      ti++;
    }
    stages.push({ name, tasks });
    si++;
  }
  return stages;
}

window.addEditTask = function (si) {
  const stages = getEditStagesFromDOM();
  stages[si].tasks.push({ name: '', done: false });
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
  const title = $id('peTitle')?.value || c.title;
  const why = $id('peWhy')?.value || c.why || '';
  const stages = _editStages;
  const body = $id('bsBody');
  let h = `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">도전의 이름</div>`;
  h += `<input class="proj-edit-input" id="peTitle" value="${esc(title)}" maxlength="30">`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">🏷 카테고리</div>`;
  h += `<div class="chip-group" id="projEditCatChips">`;
  Object.keys(CAT_LABELS).forEach(k => {
    h += `<div class="chip-opt ${_projEditCat === k ? 'selected' : ''}" onclick="selectProjEditCat('${k}')">${CAT_LABELS[k]}</div>`;
  });
  h += `</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">📅 목표 시기</div>`;
  h += `<div id="projMonthArea">${getEditMonthChipsHTML(_projEditMonth, 'proj')}</div>`;
  h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">나의 궁극적인 목적 (WHY)</div>`;
  h += `<textarea class="proj-edit-input proj-edit-textarea" id="peWhy" maxlength="100">${esc(why)}</textarea>`;
  stages.forEach((s, si) => {
    h += `<div class="proj-edit-stage-box" id="peStage_${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="proj-stage-num">${si + 1}</div>
        <input class="proj-edit-task-input" id="peStageName_${si}" value="${esc(s.name)}" placeholder="단계 이름" style="flex:1;">
        <button class="proj-edit-task-del" onclick="removeEditStage(${si})">✕</button>
      </div>`;
    (s.tasks || []).forEach((t, ti) => {
      const checked = t.done ? 'checked' : '';
      h += `<div class="proj-edit-task-row">
        <label class="task-check-label"><input type="checkbox" class="task-check" id="peTaskDone_${si}_${ti}" ${checked}><span class="task-check-mark"></span></label>
        <input class="proj-edit-task-input" id="peTask_${si}_${ti}" value="${esc(t.name)}" placeholder="세부 항목" style="${t.done ? 'text-decoration:line-through;color:var(--text-dim);' : ''}">
        <button class="proj-edit-task-del" onclick="removeEditTask(${si},${ti})">✕</button>
      </div>`;
    });
    h += `<button class="proj-add-task-btn" onclick="addEditTask(${si})">+ 세부 항목 추가</button></div>`;
  });
  h += `<button class="proj-add-stage-btn" onclick="addEditStage()">+ 새 단계 추가</button>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="cancelProjectEdit(${activeGoalIdx})">취소</button><button class="proj-save-btn save" onclick="saveProjectEdit(${activeGoalIdx})">저장</button></div>`;
  body.innerHTML = h;
}

window.cancelProjectEdit = function (idx) {
  _editStages = [];
  $text('bsTitle', localDash.challenges[idx].title);
  renderProjectDetail(idx);
};

window.saveProjectEdit = async function (idx) {
  const title = $id('peTitle').value.trim();
  if (!title) { showToast('이름을 입력하세요', 'normal'); return; }
  const why = $id('peWhy').value.trim();
  const stages = getEditStagesFromDOM();
  stages.forEach((s, i) => {
    s.tasks.forEach((t, j) => {
      if (!t.name.trim()) t.name = '항목';
    });
    if (!s.name.trim()) s.name = `단계 ${i + 1}`;
  });
  const updated = { ...localDash.challenges[idx], title, why, targetMonth: _projEditMonth, stages, category: _projEditCat, public: !$id('editProjPrivate')?.checked };
  delete updated.deadline;
  localDash.challenges[idx] = updated;
  await saveDash();
  _editStages = [];
  renderChallengeCards();
  closeBottomSheet();
  showToast('✅ 저장 완료!', 'done');
};

window.deleteChallenge = async function (idx) {
  if (!confirm('이 도전을 삭제할까요?')) return;
  localDash.challenges.splice(idx, 1);
  await saveDash();
  closeBottomSheet(); renderChallengeCards();
  showToast('🗑 삭제됨', 'normal');
};

// ===== 습관 추가 위자드 =====
let _wizStep = 0;

function pdiscReveal(stepId) {
  const el = $id(stepId);
  if (!el || !el.classList.contains('pdisc-hidden')) return;
  el.classList.remove('pdisc-hidden');
  el.classList.add('pdisc-reveal');
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

window.wizGoTo = function (step) {
  const container = $id('bsBody');
  if (!container) return;
  const slides = container.querySelectorAll('.wiz-slide');
  slides.forEach((s, i) => {
    s.classList.remove('active', 'exit-left');
    if (i < step) s.classList.add('exit-left');
    else if (i === step) s.classList.add('active');
  });
  _wizStep = step;
  const summaryEl = $id('hAddSummary');
  if (summaryEl) summaryEl.style.display = step === 4 ? 'none' : 'flex';
  renderHAddSummary();
  renderHAddDots();
};

function renderHAddSummary() {
  const el = $id('hAddSummary');
  if (!el) return;
  const chips = [];
  const name = $id('hAddName')?.value.trim();
  if (name) chips.push({ label: name, step: 0 });
  if (_habitCycle1) {
    const cycleLabels = { daily: '매일', w1: '1주에', w2: '2주에', w3: '3주에', w4: '4주에', auto: '자동' };
    let lbl = cycleLabels[_habitCycle1] || _habitCycle1;
    if (_habitCycle1 === 'auto' && _habitCycle2) lbl = _habitCycle2 === 'health_sleep' ? '🌙 수면' : '💪 운동';
    else if (_habitCycle2 && typeof _habitCycle2 === 'number') lbl += ` ${_habitCycle2}회`;
    if (_workoutType) lbl += ` (${_workoutType})`;
    chips.push({ label: lbl, step: 1 });
  }
  if (_wizStep > 2 && _habitTime) {
    const tl = { any:'🔄 언제나', dawn:'🌅 새벽', morning:'🌤 아침', midday:'🏞 낮', afternoon:'🌇 오후', evening:'🌟 저녁', night:'🦉 밤' };
    chips.push({ label: tl[_habitTime] || _habitTime, step: 2 });
  }
  if (_wizStep > 3 && _habitCat) {
    const cl = { health:'💪 건강', diet:'🥗 식단', study:'📚 학습', work:'💼 업무', finance:'💰 재무', life:'🌱 생활', home:'🧹 집안일', hobby:'🎨 취미', social:'🤝 관계', mental:'🧘 멘탈', etc:'📦 기타' };
    chips.push({ label: cl[_habitCat] || _habitCat, step: 3 });
  }
  el.innerHTML = chips.map(c => `<span class="wiz-chip" onclick="wizGoTo(${c.step})">${esc(c.label)}</span>`).join('');
}

function renderHAddDots() {
  const els = document.querySelectorAll('.hAddDotsBar');
  const total = 5;
  let h = '';
  for (let i = 0; i < total; i++) {
    const cls = i === _wizStep ? 'active' : i < _wizStep ? 'done' : '';
    h += `<div class="wiz-dot ${cls}" onclick="wizDotTap(${i})" style="cursor:pointer;"></div>`;
  }
  els.forEach(el => { el.innerHTML = h; });
}

window.wizDotTap = function (step) {
  if (step < _wizStep) wizGoTo(step);
};

window.openAddHabitSheet = function () {
  const count = getAllGoals().filter(g => g && g.title).length;
  if (count >= MAX_HABITS) { showToast(`습관은 최대 ${MAX_HABITS}개까지 만들 수 있어요`, 'normal'); return; }
  _habitAddName = '';
  _habitCycle1 = null;
  _habitCycle2 = null;
  _workoutType = null;
  _habitTime = null;
  _habitCat = null;
  _wizStep = 0;
  $text('bsTitle', '습관 추가');
  clearMetaTags();

  let h = `<div class="wiz-summary" id="hAddSummary"></div>`;
  h += `<div class="wiz-wrap">`;

  // Slide 0: Name
  h += `<div class="wiz-slide active" id="hWiz0">
    <div class="pdisc-label">습관 이름</div>
    <input class="proj-edit-input" id="hAddName" placeholder="예: 매일 독서 20분" maxlength="20">
    <div class="wiz-nav" style="flex-direction:column;gap:10px;"><div class="wiz-dots hAddDotsBar"></div><button class="unit-confirm-btn" style="width:100%;padding:12px 28px;" onclick="hWizNameNext()">다음</button></div>
  </div>`;

  // Slide 1: Cycle
  h += `<div class="wiz-slide" id="hWiz1">
    <div class="pdisc-label">주기 <span style="font-weight:500;color:var(--text-dim);font-size:11px;margin-left:4px;">얼마나 자주 수행할 건가요?</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;" id="hAddCycle1Area"></div>
    <div id="hAddCycle2Area"></div>
    <div class="wiz-nav"><div class="wiz-dots hAddDotsBar"></div></div>
  </div>`;

  // Slide 2: Time
  h += `<div class="wiz-slide" id="hWiz2">
    <div class="pdisc-label">시간대</div>
    <div id="hAddTimeArea"></div>
    <div class="wiz-nav"><div class="wiz-dots hAddDotsBar"></div></div>
  </div>`;

  // Slide 3: Category
  h += `<div class="wiz-slide" id="hWiz3">
    <div class="pdisc-label">카테고리</div>
    <div id="hAddCatArea"></div>
    <div class="wiz-nav"><div class="wiz-dots hAddDotsBar"></div></div>
  </div>`;

  // Slide 4: Confirm
  h += `<div class="wiz-slide" id="hWiz4">
    <div style="text-align:center;padding:16px 0;">
      <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px;" id="hWizConfirmTags"></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;margin:0 0 12px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text);">🔒 비공개</div>
        <div style="font-size:11px;color:var(--text-dim);">친구에게 이 습관을 숨겨요</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="hAddPrivate">
        <span class="toggle-slider"></span>
      </label>
    </div>
    <button class="unit-confirm-btn" onclick="habitAddSave()">습관 등록하기</button>
    <div class="wiz-nav" style="border:none;margin-top:8px;"><div class="wiz-dots hAddDotsBar"></div></div>
  </div>`;

  h += `</div>`;

  $html('bsBody', h);
  openBS();
  setTimeout(() => $id('hAddName')?.focus(), 400);
  renderHAddCycle1();
  renderHAddTime();
  renderHAddCat();
  renderHAddDots();
};

window.hWizNameNext = function () {
  const v = $id('hAddName')?.value.trim();
  if (!v) { showToast('이름을 입력해주세요', 'normal'); $id('hAddName')?.focus(); return; }
  _habitAddName = v;
  wizGoTo(1);
};

function renderHAddCycle1() {
  const opts = [
    { label: '매일', val: 'daily' },
    { label: '1주에', val: 'w1' },
    { label: '2주에', val: 'w2' },
    { label: '3주에', val: 'w3' },
    { label: '4주에', val: 'w4' },
    { label: '⌚ 자동', val: 'auto' },
  ];
  let h = '';
  opts.forEach(o => {
    const sel = _habitCycle1 === o.val;
    h += `<div class="unit-opt ${sel ? 'selected' : ''}" onclick="hAddSelectCycle1('${o.val}')">${o.label}</div>`;
  });
  const el = $id('hAddCycle1Area');
  if (el) el.innerHTML = h;
}

window.hAddSelectCycle1 = function (val) {
  _habitCycle1 = val;
  _habitCycle2 = null;
  _workoutType = null;
  renderHAddCycle1();
  renderHAddCycle2();
  if (val === 'daily') {
    wizGoTo(2);
  }
};

function renderHAddCycle2() {
  const area = $id('hAddCycle2Area');
  if (!area) return;
  if (!_habitCycle1 || _habitCycle1 === 'daily') { area.innerHTML = ''; return; }

  let h = '';
  if (_habitCycle1 === 'auto') {
    const healthOpts = [
      { label: '🌙 수면', val: 'health_sleep' },
      { label: '💪 운동', val: 'health_workout' },
    ];
    h += `<div style="font-size:11px;color:var(--text-dim);font-weight:700;margin:8px 0;">⌚ 워치 연동 (자동 기록)</div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">`;
    healthOpts.forEach(o => {
      const sel = _habitCycle2 === o.val;
      h += `<div class="unit-opt ${sel ? 'selected' : ''}" onclick="hAddSelectHealth('${o.val}')">${o.label}</div>`;
    });
    h += `</div>`;
    if (_habitCycle2 === 'health_workout') {
      const workoutTypes = [
        ['🏃 달리기','달리기'],['🚴 자전거','자전거'],['🏊 수영','수영'],['🧘 요가','요가'],
        ['🏋️ 웨이트','웨이트'],['🥾 등산','등산'],['🚶 걷기','걷기'],['⚽ 구기','구기'],
        ['🏸 라켓','라켓'],['🤸 기타','기타']
      ];
      h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:8px 0;">운동 종류</div>`;
      h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">`;
      workoutTypes.forEach(([lbl, val]) => {
        const sel = _workoutType === val;
        h += `<div class="unit-opt" style="font-size:12px;padding:6px 10px;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="hAddSelectWorkout('${val}')">${lbl}</div>`;
      });
      h += `</div>`;
    }
  } else if (_habitCycle1.startsWith('w')) {
    const weekNum = parseInt(_habitCycle1[1]);
    const max = weekNum * 7;
    h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:8px 0;">횟수</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
    for (let i = 1; i <= Math.min(max, 14); i++) {
      const sel = _habitCycle2 === i;
      h += `<div class="unit-opt" style="min-width:36px;text-align:center;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="hAddSelectFreq(${i})">${i}회</div>`;
    }
    h += `</div>`;
  }
  area.innerHTML = h;
}

window.hAddSelectWorkout = function (val) {
  _workoutType = val;
  renderHAddCycle2();
  wizGoTo(2);
};

window.hAddSelectHealth = function (val) {
  _habitCycle2 = val;
  renderHAddCycle2();
  if (val === 'health_sleep') wizGoTo(2);
};

window.hAddSelectFreq = function (n) {
  _habitCycle2 = n;
  renderHAddCycle2();
  wizGoTo(2);
};

function renderHAddTime() {
  const timeOpts = [['any','🔄 언제나'],['dawn','🌅 새벽'],['morning','🌤 아침'],['midday','🏞 낮'],['afternoon','🌇 오후'],['evening','🌟 저녁'],['night','🦉 밤']];
  let h = `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
  timeOpts.forEach(([val, lbl]) => {
    const sel = _habitTime !== null && _habitTime === val;
    h += `<div class="unit-opt" style="font-size:12px;padding:6px 12px;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="hAddSelectTime('${val}')">${lbl}</div>`;
  });
  h += `</div>`;
  const el = $id('hAddTimeArea');
  if (el) el.innerHTML = h;
}

window.hAddSelectTime = function (val) {
  _habitTime = val;
  renderHAddTime();
  wizGoTo(3);
};

function renderHAddCat() {
  const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
  let h = `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
  catOpts.forEach(([val, lbl]) => {
    const sel = _habitCat !== null && _habitCat === val;
    h += `<div class="unit-opt" style="font-size:11px;padding:6px 10px;${sel ? 'background:var(--accent-light);border-color:var(--accent);color:var(--accent);' : ''}" onclick="hAddSelectCat('${val}')">${lbl}</div>`;
  });
  h += `</div>`;
  const el = $id('hAddCatArea');
  if (el) el.innerHTML = h;
}

window.hAddSelectCat = function (val) {
  _habitCat = val;
  renderHAddCat();
  // Render confirm slide
  const tagsEl = $id('hWizConfirmTags');
  if (tagsEl) {
    const name = _habitAddName || $id('hAddName')?.value.trim() || '';
    const cycleLabels = { daily:'매일', w1:'1주에', w2:'2주에', w3:'3주에', w4:'4주에', auto:'자동' };
    let cycleLbl = cycleLabels[_habitCycle1] || '';
    if (_habitCycle1 === 'auto' && _habitCycle2) cycleLbl = _habitCycle2 === 'health_sleep' ? '🌙 수면' : '💪 운동';
    else if (_habitCycle2 && typeof _habitCycle2 === 'number') cycleLbl += ` ${_habitCycle2}회`;
    if (_workoutType) cycleLbl += ` (${_workoutType})`;
    const tl = { any:'🔄 언제나', dawn:'🌅 새벽', morning:'🌤 아침', midday:'🏞 낮', afternoon:'🌇 오후', evening:'🌟 저녁', night:'🦉 밤' };
    const cl = { health:'💪 건강', diet:'🥗 식단', study:'📚 학습', work:'💼 업무', finance:'💰 재무', life:'🌱 생활', home:'🧹 집안일', hobby:'🎨 취미', social:'🤝 관계', mental:'🧘 멘탈', etc:'📦 기타' };
    const tags = [
      { label: name, step: 0 },
      { label: cycleLbl, step: 1 },
      { label: tl[_habitTime], step: 2 },
      { label: cl[_habitCat], step: 3 }
    ].filter(t => t.label);
    tagsEl.innerHTML = tags.map(t => `<span class="wiz-chip" onclick="wizGoTo(${t.step})">${t.label}</span>`).join('');
  }
  wizGoTo(4);
};

window.habitAddSave = async function () {
  const name = _habitAddName || $id('hAddName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }

  let unit, freq = 1;
  if (_habitCycle1 === 'auto') {
    unit = _habitCycle2 || 'health_sleep';
  } else if (_habitCycle1 === 'daily') {
    unit = 'daily';
  } else if (_habitCycle1 && _habitCycle1.startsWith('w')) {
    const wn = parseInt(_habitCycle1[1]);
    unit = wn === 1 ? 'weekly' : wn === 2 ? 'biweekly' : 'weekly';
    freq = _habitCycle2 || 1;
  } else {
    showToast('주기를 선택해주세요', 'normal'); return;
  }

  const time = _habitTime || 'any';
  const cat = _habitCat || 'etc';

  if (!localDash.goals) localDash.goals = [];
  let slot = -1;
  for (let i = 0; i < MAX_HABITS; i++) { if (!localDash.goals[i] || !localDash.goals[i].title) { slot = i; break; } }
  if (slot === -1) { showToast('최대 개수 도달', 'normal'); return; }

  const isPrivate = $id('hAddPrivate')?.checked;
  const goal = { title: name, unit, freq, time, category: cat, public: !isPrivate };
  if (unit === 'health_workout' && _workoutType) goal.workoutType = _workoutType;
  localDash.goals[slot] = goal;

  closeBottomSheet();
  renderHabitCards(); renderAvatar();
  showToast('🎯 습관 등록!', 'done');
  await saveDash();
};

// ===== 닉네임 편집 모달 (햄스터 3초 롱프레스) =====
let _nickLongTimer = null;
let _nickLongPressSetup = false;
function setupAvatarLongPress(container) {
  // avatar-section에 한 번만 등록
  const section = document.querySelector('.avatar-section');
  if (!section || _nickLongPressSetup) return;
  _nickLongPressSetup = true;
  const LONG_PRESS_MS = 3000;
  let moved = false;
  section.addEventListener('touchstart', () => {
    moved = false;
    if (_nickLongTimer) clearTimeout(_nickLongTimer);
    _nickLongTimer = setTimeout(() => {
      if (!moved) openNicknameModal();
    }, LONG_PRESS_MS);
  }, { passive: true });
  section.addEventListener('touchmove', () => {
    moved = true;
    if (_nickLongTimer) { clearTimeout(_nickLongTimer); _nickLongTimer = null; }
  }, { passive: true });
  section.addEventListener('touchend', () => {
    if (_nickLongTimer) { clearTimeout(_nickLongTimer); _nickLongTimer = null; }
  });
  section.addEventListener('touchcancel', () => {
    if (_nickLongTimer) { clearTimeout(_nickLongTimer); _nickLongTimer = null; }
  });
}

window.openNicknameModal = function () {
  const cur = localDash.nickname || (currentUser ? currentUser.name : '') || '';
  let overlay = $id('nickModalOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'nickModalOverlay';
  overlay.className = 'nick-modal-overlay';
  overlay.innerHTML = `
    <div class="nick-modal" onclick="event.stopPropagation()">
      <div class="nick-modal-view" id="nickViewMode">
        <span class="nick-modal-name" id="nickDisplayName">${esc(cur)}</span>
        <button class="nick-modal-edit-btn" onclick="switchNickEditMode()">✏️</button>
      </div>
      <div class="nick-modal-edit" id="nickEditMode" style="display:none;">
        <input class="nick-modal-input" id="nickModalInput" value="${esc(cur)}" maxlength="10" placeholder="닉네임">
        <div class="nick-modal-btns">
          <button class="nick-modal-cancel" onclick="closeNicknameModal()">취소</button>
          <button class="nick-modal-save" onclick="saveNicknameModal()">저장</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click', closeNicknameModal);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
};

window.switchNickEditMode = function () {
  $id('nickViewMode').style.display = 'none';
  $id('nickEditMode').style.display = '';
  const input = $id('nickModalInput');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
};

window.closeNicknameModal = function () {
  const overlay = $id('nickModalOverlay');
  if (overlay) { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); }
};

window.saveNicknameModal = async function () {
  const v = $id('nickModalInput').value.trim();
  if (!v) { showToast('닉네임을 입력해주세요', 'warn'); return; }
  localDash.nickname = v;
  await saveDash();
  closeNicknameModal();
  renderAvatar();
  showToast('✅ 닉네임이 변경되었어요!', 'done');
};

window.startEditMsg = function () {
  const wrap = $id('avatarMsgWrap');
  const cur = localDash.msg || '';
  wrap.innerHTML = `<div class="nickname-edit-row"><input class="nickname-input" id="msgInput" value="${esc(cur)}" maxlength="30" placeholder="상태 메시지"><button class="nickname-save-btn" onclick="saveMsg()">저장</button></div>`;
  $id('msgInput').focus();
};
window.saveMsg = async function () {
  const v = $id('msgInput').value.trim();
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
  for (let d = 0; d < 7; d++) { const dd = new Date(ws); dd.setDate(ws.getDate() + d); if (dd > now) break; if (isCompDone(localDash.completions[`g${idx}_${dd.getFullYear()}_${dd.getMonth()+1}_${dd.getDate()}`], localDash.goals[idx])) wd++; }
  if (wd === freq) setTimeout(() => { showConfetti(); const p = $id('weekClearPopup'); p.classList.add('show'); setTimeout(() => p.classList.remove('show'), 2800); }, 300);
}

// ===== 바텀시트 =====
window.openGoalBottomSheet = function (idx) {
  const g = getAllGoals()[idx];
  if (!g) { openAddHabitSheet(); return; }
  if (!g.unit) { openUnitSetupSheet(idx); return; }
  activeGoalIdx = idx;
  viewMonth = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  $text('bsTitle', g.title);
  setHabitMetaTags(g);
  renderBSBody(idx);
  openBS();
};

function openBS() {
  $id('bsOverlay').classList.add('open');
  $id('bottomSheet').classList.add('open');
}
window.closeBottomSheet = function () {
  $id('bsOverlay').classList.remove('open');
  $id('bottomSheet').classList.remove('open');
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
  const g = migrateGoal(localDash.goals[idx]), body = $id('bsBody');
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
<div class="wsb-title">목표 달성! 🎉</div>
          <div class="wsb-desc">이번 주 할당량(${freq}회)을 모두 채웠어요.</div>
        </div>
        <div class="wsb-icon">🏆</div>
      </div>`;
    } else {
      html += `<div class="week-status-banner">
        <div>
<div class="wsb-title">진행 중</div>
          <div class="wsb-desc">현재 ${curDone}회 완료! (앞으로 ${freq - curDone}번 더)</div>
        </div>
      </div>`;
    }
  }

  // 월 네비게이션
  html += `<div class="month-nav"><button class="month-nav-btn" onclick="bsMonthPrev()">‹</button><div class="month-label">${y}년 ${m}월</div>`;
  const isFutureBlocked = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  html += `<button class="month-nav-btn" ${isFutureBlocked ? 'disabled' : ''} onclick="bsMonthNext()">›</button></div>`;

  // 달력 (주간 하이라이트 포함)
  html += renderCalendar(idx, g, y, m, canEdit);

  // 6개월 통계
  html += renderStats6Month(idx, g);
  // 헬스 연동 정보 (health_sleep, health_workout)
  if (g.unit === 'health_sleep' || g.unit === 'health_workout') {
    const wType = g.workoutType ? ` (${g.workoutType})` : '';
    html += `<div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:12px;margin:12px 0;">
      <div style="font-size:12px;font-weight:700;color:#0284c7;margin-bottom:4px;">⌚ 자동 기록 연동</div>
      <div style="font-size:11px;color:#475569;">단축어에서 사용할 키: <b style="color:#0284c7;font-size:13px;">g${idx}</b>${wType}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">단축어가 completions/g${idx}_년_월_일 에 기록하면 자동 반영됩니다</div>
    </div>`;
  }
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

  let h = '';
  // 자동 습관 월간 요약
  const goal0 = localDash.goals[idx];
  if (goal0?.auto) {
    const unitLbl = getAutoUnitLabel(goal0);
    let vals = [], achieved = 0;
    for (let d = 1; d <= days; d++) {
      const av = getAutoValue(localDash.completions[`g${idx}_${y}_${m}_${d}`], goal0);
      if (av !== null) {
        vals.push(av);
        if (isCompDone(localDash.completions[`g${idx}_${y}_${m}_${d}`], goal0)) achieved++;
      }
    }
    const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    h += `<div class="auto-cal-summary"><span>평균 ${avg < 10 ? avg.toFixed(1) : Math.round(avg)}${unitLbl}</span><span class="auto-cal-sep">·</span><span>달성 ${achieved}/${vals.length}일</span></div>`;
  }
  h += `<div class="cal-day-row">`;
  ['일', '월', '화', '수', '목', '금', '토'].forEach(d => h += `<div class="cal-day-lbl">${d}</div>`);
  h += `</div><div class="cal-grid">`;

  // 빈 셀 (이전 달)
  for (let i = 0; i < fd; i++) {
    const dt = new Date(y, m - 1, -fd + i + 1);
    const wc = isWeekCleared(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    h += `<div class="cal-cell empty ${wc ? 'week-cleared' : ''}"></div>`;
  }

  // 날짜 셀
  const goal = localDash.goals[idx];
  const isAuto = goal?.auto;
  for (let d = 1; d <= days; d++) {
    const k = `g${idx}_${y}_${m}_${d}`, val = localDash.completions[k];
    const isDone = isCompDone(val, goal);
    const autoVal = isAuto ? getAutoValue(val, goal) : null;
    const cellDate = new Date(y, m - 1, d);
    const isToday = cellDate.getTime() === todayDate.getTime();
    const isFuture = cellDate > todayDate;
    const locked = !canEdit || isFuture || isAuto;
    const wc = isWeekCleared(y, m, d);
    const onclick = locked ? '' : `onclick="bsToggleDay(${idx},${y},${m},${d})"`;

    if (isAuto && autoVal !== null) {
      // 자동 습관: 수치 표시 + 색상 등급
      const unitLbl = getAutoUnitLabel(goal);
      const target = goal.autoTarget || 1;
      const ratio = autoVal / target;
      let bg = '';
      if (ratio >= 1) bg = 'background:#dbeafe;color:#1e40af;';
      else if (ratio >= 0.7) bg = 'background:#fef3c7;color:#92400e;';
      else bg = 'background:#fee2e2;color:#991b1b;';
      h += `<div class="cal-cell auto-val ${isToday ? 'cal-today' : ''} ${wc ? 'week-cleared' : ''}" style="${bg}"><span class="cal-dn">${d}</span><span class="cal-auto-num">${autoVal < 10 ? autoVal.toFixed(1) : Math.round(autoVal)}${unitLbl}</span></div>`;
    } else {
      h += `<div class="cal-cell ${isDone ? 'done' : ''} ${isToday ? 'cal-today' : ''} ${wc ? 'week-cleared' : ''} ${locked ? 'locked' : ''}" ${onclick}><span class="cal-dn">${d}</span><span class="cal-chk">${isDone ? '✓' : ''}</span></div>`;
    }
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
  const done = isCompDone(localDash.completions[`g${idx}_once`], localDash.goals[idx]);
  body.innerHTML = `<div style="text-align:center;padding:40px 0;">
    <div style="font-size:14px;color:var(--text-dim);margin-bottom:24px;">한 번 달성 목표</div>
    <button style="background:#fff;border:3px solid ${done ? 'var(--accent)' : 'var(--border)'};border-radius:50%;width:80px;height:80px;font-size:30px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;" onclick="bsToggleOnce(${idx})">${done ? '✅' : '⭕'}</button>
    ${done ? '<div style="margin-top:12px;font-family:var(--font-heading);font-size:15px;color:var(--accent);">달성 완료!</div>' : ''}
  </div>${renderStats6Month(idx, migrateGoal(localDash.goals[idx]))}
  <button class="proj-edit-btn" onclick="openHabitEdit(${idx})">✏️ 수정</button>
  <button class="proj-edit-btn" style="color:var(--danger);border-color:var(--danger);margin-top:8px;" onclick="deleteGoalFromBS(${idx})">🗑 삭제</button>`;
}

window.bsToggleOnce = async function (idx) {
  const k = `g${idx}_once`;
  const wasDone = isCompDone(localDash.completions[k], localDash.goals[idx]);
  localDash.completions[k] = !wasDone;
  await saveDash(); renderBSBody(idx); renderHabitCards(); renderAvatar();
  if (wasDone) { checkMilestoneUndo(); } else { checkMilestone(); }
  renderMilestoneBar();
};

// ===== 6개월 통계 =====
function renderStats6Month(idx, g) {
  const now = new Date(); let months = [];
  for (let i = 5; i >= 0; i--) { let mm = now.getMonth() + 1 - i, yy = now.getFullYear(); while (mm < 1) { mm += 12; yy--; } months.push({ y: yy, m: mm }); }
  const pcts = months.map(({ y, m }) => goalPct(g, idx, y, m).pct);
  const maxPct = Math.max(...pcts, 100); // 최소 100% 기준
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  const hasData = pcts.some(p => p > 0);
  const chartH = 160;

  let h = `<div class="stats-section"><div class="stats-title">📊 6개월 추이</div><div class="stats-chart">`;
  if (hasData && avg > 0) {
    const avgH = Math.max(8, avg / maxPct * chartH);
    h += `<div class="stats-avg-line" style="bottom:${avgH}px;"></div>`;
  }
  months.forEach(({ y, m }, i) => {
    const p = pcts[i], barH = p > 0 ? Math.max(8, p / maxPct * chartH) : 4;
    const isCur = y === now.getFullYear() && m === now.getMonth() + 1;
    h += `<div class="stats-bar-wrap"><div class="stats-bar-col"><div class="stats-bar ${isCur ? 'current-month' : 'past'}" style="height:${barH}px;${p === 0 ? 'opacity:0.3;' : ''}"><span class="stats-bar-pct">${p}%</span></div></div><div class="stats-bar-lbl ${isCur ? 'current' : ''}">${m}월</div></div>`;
  });
  h += `</div>`;
  const curPct = pcts[5], prevPct = pcts[4], diff = curPct - prevPct;
  h += `<div class="stats-insight">`;
  h += `<div class="stats-insight-row"><span class="stats-insight-icon">📈</span><span class="stats-insight-text">6개월 평균 <strong>${avg}%</strong></span></div>`;
  if (diff > 0) h += `<div class="stats-insight-row"><span class="stats-insight-icon">🚀</span><span class="stats-insight-text">지난달보다 <strong>+${diff}%p</strong> 상승!</span></div>`;
  else if (diff < 0) h += `<div class="stats-insight-row"><span class="stats-insight-icon">💪</span><span class="stats-insight-text">지난달보다 <strong>${diff}%p</strong> — 다시 힘내요!</span></div>`;
  if (!hasData) h += `<div class="stats-insight-row"><span class="stats-insight-icon">🌱</span><span class="stats-insight-text">아직 기록이 없어요. 오늘부터 시작해볼까요?</span></div>`;
  h += `</div></div>`;
  return h;
}

// ===== 습관 추가 (기존 방식) =====
let _habitAddName = '';
let _habitCycle1 = null; // 'daily','w1','w2','w3','w4','auto'
let _habitCycle2 = null; // number of times or 'health_sleep'/'health_workout'
let _habitTime = null;
let _habitCat = null;
let _workoutType = null; // workout subtype

window.habitAddStep2 = function () {
  const v = $id('newGoalInput').value.trim();
  if (!v) { showToast('이름을 입력해주세요', 'normal'); return; }
  _habitAddName = v;
  _habitCycle1 = null;
  _habitCycle2 = null;
  _workoutType = null;
  $text('bsTitle', '주기 설정');
  clearMetaTags();
  renderCycleStep();
};

function renderCycleStep() {
  const depth1Opts = [
    { label: '매일', val: 'daily' },
    { label: '1주에', val: 'w1' },
    { label: '2주에', val: 'w2' },
    { label: '3주에', val: 'w3' },
    { label: '4주에', val: 'w4' },
  ];
  const healthOpts = [
    { label: '🌙 수면', val: 'health_sleep' },
    { label: '💪 운동', val: 'health_workout' },
  ];
  let h = `<div style="font-size:14px;font-weight:700;margin-bottom:4px;">${esc(_habitAddName)}</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">얼마나 자주 수행할 건가요?</div>`;
  // depth 1
  h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">`;
  depth1Opts.forEach(o => {
    const sel = _habitCycle1 === o.val;
    h += `<div class="unit-opt ${sel?'selected':''}" onclick="selectCycle1('${o.val}')">${o.label}</div>`;
  });
  h += `</div>`;
  // 애플 헬스 연동
  h += `<div style="font-size:11px;color:var(--text-dim);font-weight:700;margin-bottom:8px;">⌚ 애플 헬스 연동 (단축어 자동 기록)</div>`;
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">`;
  healthOpts.forEach(o => {
    const sel = _habitCycle1 === o.val;
    h += `<div class="unit-opt ${sel?'selected':''}" onclick="selectCycle1('${o.val}')">${o.label}</div>`;
  });
  h += `</div>`;
  // depth 2 (only for w1~w4)
  h += `<div id="cycle2Area"></div>`;

  // 운동 종류 선택 (health_workout일 때)
  if (_habitCycle1 === 'health_workout') {
    const workoutTypes = [
      ['🏃 달리기','달리기'],['🚴 자전거','자전거'],['🏊 수영','수영'],['🧘 요가','요가'],
      ['🏋️ 웨이트','웨이트'],['🥾 등산','등산'],['🚶 걷기','걷기'],['⚽ 구기','구기'],
      ['🏸 라켓','라켓'],['🤸 기타','기타']
    ];
    h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;">운동 종류</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
    workoutTypes.forEach(([lbl, val]) => {
      const sel = _workoutType === val;
      h += `<div class="unit-opt" style="font-size:12px;padding:6px 10px;${sel?'background:var(--accent-light);border-color:var(--accent);color:var(--accent);':''}" onclick="_workoutType='${val}';renderCycleStep();">${lbl}</div>`;
    });
    h += `</div>`;
  }

  // 시간대 선택
  const canConfirm = _habitCycle1 === 'daily' || _habitCycle1 === 'health_sleep' || _habitCycle1 === 'health_workout' || (_habitCycle1 && _habitCycle2);
  if (canConfirm) {
    h += `<div style="font-size:12px;color:var(--accent);font-weight:700;margin:16px 0 8px;">시간대</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
    const timeOpts = [['any','🔄 언제나'],['dawn','🌅 새벽'],['morning','🌤 아침'],['midday','🏞 낮'],['afternoon','🌇 오후'],['evening','🌟 저녁'],['night','🦉 밤']];
    timeOpts.forEach(([val, lbl], i) => {
      h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:700;color:#4b5563;cursor:pointer;">
        <input type="radio" name="habitTime" value="${val}" ${i===0?'checked':''} style="margin:0;"> ${lbl}</label>`;
    });
    h += `</div>`;

    // 카테고리 선택
    h += `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin-bottom:8px;">카테고리</div>`;
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">`;
    const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
    catOpts.forEach(([val, lbl], i) => {
      h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:11px;font-weight:700;color:#4b5563;cursor:pointer;">
        <input type="radio" name="habitCat" value="${val}" ${val==='etc'?'checked':''} style="margin:0;"> ${lbl}</label>`;
    });
    h += `</div>`;
  }

  h += `<button class="unit-confirm-btn" id="cycleConfirmBtn" onclick="confirmHabitAdd()" ${canConfirm?'':'disabled'}>확인</button>`;
  $html('bsBody', h);
  if (_habitCycle1 && _habitCycle1 !== 'daily' && _habitCycle1 !== 'health_sleep' && _habitCycle1 !== 'health_workout') {
    renderCycle2();
  }
}

window.selectCycle1 = function (val) {
  _habitCycle1 = val;
  _habitCycle2 = null;
  renderCycleStep();
};

function renderCycle2() {
  const area = $id('cycle2Area');
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
  const ca = $id('cycle2CustomArea');
  if (!ca) return;
  ca.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">
    <input type="number" id="cycle2CustomInput" class="proj-edit-input" style="width:80px;" min="1" max="28" placeholder="횟수">
    <span style="font-size:13px;color:var(--text-dim);">회</span>
    <button class="btn-sm" style="background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700;" onclick="applyCycle2Custom()">적용</button>
  </div>`;
  setTimeout(() => $id('cycle2CustomInput')?.focus(), 100);
};

window.applyCycle2Custom = function () {
  const v = parseInt($id('cycle2CustomInput')?.value);
  if (!v || v < 1) { showToast('1 이상 입력', 'normal'); return; }
  _habitCycle2 = v;
  renderCycleStep();
};

window.confirmHabitAdd = async function () {
  if (!_habitCycle1) return;
  if (_habitCycle1 !== 'daily' && _habitCycle1 !== 'health_sleep' && _habitCycle1 !== 'health_workout' && !_habitCycle2) return;

  // find empty slot
  let slot = -1;
  for (let i = 0; i < MAX_HABITS; i++) {
    if (!localDash.goals[i] || !localDash.goals[i].title) { slot = i; break; }
  }
  if (slot === -1) { showToast('습관 최대 25개!', 'normal'); return; }

  let unit, freq, weeks;
  if (_habitCycle1 === 'daily') { unit = 'daily'; freq = 7; }
  else if (_habitCycle1 === 'health_sleep') { unit = 'health_sleep'; freq = 7; }
  else if (_habitCycle1 === 'health_workout') { unit = 'health_workout'; freq = 7; }
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
  if (unit === 'health_workout' && _workoutType) goalData.workoutType = _workoutType;
  localDash.goals[slot] = goalData;
  await saveDash();
  const isHealth = unit === 'health_sleep' || unit === 'health_workout';
  _habitAddName = ''; _habitCycle1 = null; _habitCycle2 = null; _workoutType = null;
  closeBottomSheet(); renderHabitCards(); renderAvatar();
  if (isHealth) {
    showToast(`✅ 등록 완료! 단축어 키: g${slot}`, 'done');
  } else {
    showToast('✅ 습관 등록 완료!', 'done');
  }
};

// unit setup (for existing goals without unit - backward compat)
function openUnitSetupSheet(idx) {
  _habitAddName = localDash.goals[idx].title;
  _habitCycle1 = null;
  _habitCycle2 = null;
  $text('bsTitle', '주기 설정');
  clearMetaTags();
  // override confirmHabitAdd to update existing slot
  const origConfirm = window.confirmHabitAdd;
  window.confirmHabitAdd = async function () {
    if (!_habitCycle1) return;
    if (_habitCycle1 !== 'daily' && _habitCycle1 !== 'health_sleep' && _habitCycle1 !== 'health_workout' && !_habitCycle2) return;
    let unit, freq;
    if (_habitCycle1 === 'daily') { unit = 'daily'; freq = 7; }
    else if (_habitCycle1 === 'health_sleep') { unit = 'health_sleep'; freq = 7; }
    else if (_habitCycle1 === 'health_workout') { unit = 'health_workout'; freq = 7; }
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
  const body = $id('bsBody');
  body.innerHTML += `<div style="margin-top:12px;"><button style="width:100%;background:transparent;border:2px solid var(--danger);border-radius:10px;padding:11px;font-size:13px;font-weight:700;color:var(--danger);cursor:pointer;font-family:var(--font-main);" onclick="deleteGoal(${idx})">🗑 습관 삭제</button></div>`;
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

// ===== 습관 편집 =====
window.openHabitEdit = function (idx) {
  const g = localDash.goals[idx];
  if (!g) return;
  $text('bsTitle', '습관 수정');
  clearMetaTags();
  const timeOpts = [['any','🔄 언제나'],['dawn','🌅 새벽'],['morning','🌤 아침'],['midday','🏞 낮'],['afternoon','🌇 오후'],['evening','🌟 저녁'],['night','🦉 밤']];
  const catOpts = [['health','💪 건강'],['diet','🥗 식단'],['study','📚 학습'],['work','💼 업무'],['finance','💰 재무'],['life','🌱 생활'],['home','🧹 집안일'],['hobby','🎨 취미'],['social','🤝 관계'],['mental','🧘 멘탈'],['etc','📦 기타']];
  let h = `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin-bottom:8px;">습관 이름</div>`;
  h += `<input class="proj-edit-input" id="editGoalName" value="${esc(g.title)}" maxlength="20">`;
  h += `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin:12px 0 4px;">주기: ${getUnitLabel(migrateGoal(g))}</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin:16px 0 8px;">시간대</div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
  timeOpts.forEach(([val, lbl]) => {
    const sel = (g.time || 'any') === val;
    h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 12px;background:${sel?'var(--accent-light)':'#f8fafc'};border:1.5px solid ${sel?'var(--accent)':'#e2e8f0'};border-radius:8px;font-size:12px;font-weight:700;color:${sel?'var(--accent)':'#4b5563'};cursor:pointer;">
      <input type="radio" name="editTime" value="${val}" ${sel?'checked':''} style="margin:0;"> ${lbl}</label>`;
  });
  h += `</div>`;
  h += `<div style="font-size:12px;color:var(--text-dim);font-weight:700;margin-bottom:8px;">카테고리</div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">`;
  catOpts.forEach(([val, lbl]) => {
    const sel = (g.category || 'etc') === val;
    h += `<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:${sel?'var(--accent-light)':'#f8fafc'};border:1.5px solid ${sel?'var(--accent)':'#e2e8f0'};border-radius:8px;font-size:11px;font-weight:700;color:${sel?'var(--accent)':'#4b5563'};cursor:pointer;">
      <input type="radio" name="editCat" value="${val}" ${sel?'checked':''} style="margin:0;"> ${lbl}</label>`;
  });
  h += `</div>`;
  const editPriv = g.public === false;
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;margin:0 0 16px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">
    <div><div style="font-size:13px;font-weight:700;color:var(--text);">🔒 비공개</div><div style="font-size:11px;color:var(--text-dim);">친구에게 이 습관을 숨겨요</div></div>
    <label class="toggle-switch"><input type="checkbox" id="editPrivate" ${editPriv ? 'checked' : ''}><span class="toggle-slider"></span></label>
  </div>`;
  h += `<div class="proj-save-row"><button class="proj-save-btn cancel" onclick="renderBSBody(${idx});document.getElementById('bsTitle').textContent='${esc(g.title)}';">취소</button><button class="proj-save-btn save" onclick="saveHabitEdit(${idx})">저장</button></div>`;
  $html('bsBody', h);
};

window.saveHabitEdit = async function (idx) {
  const name = $id('editGoalName')?.value.trim();
  if (!name) { showToast('이름을 입력해주세요', 'normal'); return; }
  const time = document.querySelector('input[name="editTime"]:checked')?.value || 'any';
  const cat = document.querySelector('input[name="editCat"]:checked')?.value || 'etc';
  localDash.goals[idx].title = name;
  localDash.goals[idx].time = time;
  localDash.goals[idx].category = cat;
  localDash.goals[idx].public = !$id('editPrivate')?.checked;
  await saveDash();
  renderHabitCards();
  closeBottomSheet();
  showToast('✅ 수정 완료', 'done');
};

// ===== 응원 =====
let _newCheerCount = 0;

async function renderMainCheers() {
  const el = $id('myCheersMain');
  const snap = await get(ref(db, `cheers/${currentUser.id}`));
  if (!snap.exists()) {
    el.innerHTML = `<div class="my-cheers-main-title">💬 받은 응원</div><div class="my-cheers-empty">아직 받은 응원이 없어요</div>`;
    updateCheerBubble(0);
    return;
  }
  const data = snap.val(); let all = [];
  // 호환: 새 flat 형식({ts: {from,text,ts}}) + 기존 goalIndex 형식({gi: {ts: {from,text,ts}}})
  Object.entries(data).forEach(([k, v]) => {
    if (v && typeof v === 'object' && v.from && v.text) {
      all.push({ ...v, ts: parseInt(k) });
    } else if (typeof v === 'object') {
      Object.entries(v).forEach(([ts, msg]) => {
        if (msg && msg.from) all.push({ ...msg, ts: parseInt(ts) });
      });
    }
  });
  all.sort((a, b) => b.ts - a.ts);

  // Read tracking
  const lastCheck = parseInt(localStorage.getItem('kw_lastCheerCheck') || '0');
  const newCheers = all.filter(c => c.ts > lastCheck);
  _newCheerCount = newCheers.length;
  updateCheerBubble(_newCheerCount);

  // 🎉 새 응원 도착 모달 (오래된 것부터 순차 표시)
  if (newCheers.length > 0 && !window._cheerModalShown) {
    window._cheerModalShown = true;
    const sorted = [...newCheers].sort((a, b) => a.ts - b.ts); // 오래된 것부터
    showCheerArrivalQueue(sorted);
  }

  const recent = all.slice(0, 10);
  const badgeHtml = _newCheerCount > 0 ? `<span class="cheer-count-badge">${_newCheerCount}</span>` : '';
  let h = `<div class="my-cheers-main-title" id="cheersAnchor">💬 받은 응원 <span style="font-size:12px;color:var(--text-dim);">(${all.length})</span>${badgeHtml}</div>`;
  if (recent.length === 0) { h += `<div class="my-cheers-empty">아직 받은 응원이 없어요</div>`; }
  else {
    recent.forEach(c => {
      const d = new Date(c.ts);
      const isNew = c.ts > lastCheck;
      const newLabel = isNew ? '<span class="cheer-new-badge">NEW</span>' : '';
      h += `<div class="my-cheer-card${isNew ? ' cheer-new' : ''}"><div class="my-cheer-from">${esc(c.from)}${newLabel}</div><div class="my-cheer-text">${esc(c.text)}</div><div class="my-cheer-time">${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}</div></div>`;
    });
  }
  el.innerHTML = h;

  // Intersection observer: mark as read when cheers section is visible
  if (_newCheerCount > 0) {
    const anchor = $id('cheersAnchor');
    if (anchor) {
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          markCheersRead();
          obs.disconnect();
        }
      }, { threshold: 0.5 });
      obs.observe(anchor);
    }
  }
}

function updateCheerBubble(count) {
  const bubble = $id('cheerBubble');
  if (!bubble) return;
  if (count > 0) {
    bubble.style.display = 'flex';
    bubble.innerHTML = `💬 새 응원 ${count}건`;
  } else {
    bubble.style.display = 'none';
  }
}

function markCheersRead() {
  localStorage.setItem('kw_lastCheerCheck', String(Date.now()));
  _newCheerCount = 0;
  updateCheerBubble(0);
  // Remove badge from title
  const badge = document.querySelector('.cheer-count-badge');
  if (badge) badge.remove();
  // Remove NEW labels with fade
  document.querySelectorAll('.cheer-new-badge').forEach(el => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  });
}

// ===== 응원 도착 모달 (순차 표시) =====
let _cheerQueue = [];
function showCheerArrivalQueue(cheers) {
  _cheerQueue = [...cheers];
  showNextCheerModal();
}

function showNextCheerModal() {
  if (_cheerQueue.length === 0) {
    // 모든 응원 확인 완료 → 읽음 처리
    markCheersRead();
    renderMainCheers();
    return;
  }
  const c = _cheerQueue.shift();
  const d = new Date(c.ts);
  const timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padLeft ? d.getMinutes().toString().padStart(2,'0') : String(d.getMinutes()).padStart(2,'0')}`;
  const remaining = _cheerQueue.length;

  // 화면 흔들기
  document.body.classList.add('cheer-shake');

  let overlay = $id('cheerArrivalOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'cheerArrivalOverlay';
  overlay.className = 'cheer-arrival-overlay';
  overlay.innerHTML = `
    <div class="cheer-arrival-modal">
      <div class="cheer-arrival-title">🎉 친구의 응원이 도착했어요!</div>
      <div class="cheer-arrival-body">
        <div class="cheer-arrival-from">${esc(c.from)}</div>
        <div class="cheer-arrival-text">"${esc(c.text)}"</div>
        <div class="cheer-arrival-time">${timeStr}</div>
      </div>
      ${remaining > 0 ? `<div class="cheer-arrival-remaining">📬 ${remaining}개 더 남았어요</div>` : ''}
      <button class="cheer-arrival-btn" onclick="closeCheerArrival()">확인</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

window.closeCheerArrival = function () {
  document.body.classList.remove('cheer-shake');
  const overlay = $id('cheerArrivalOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); showNextCheerModal(); }, 250);
  }
};

window.scrollToCheers = function () {
  const anchor = $id('cheersAnchor');
  if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ===== 인앱 알림 센터 =====
let _notiPanelOpen = false;

window.toggleNotiPanel = function () {
  _notiPanelOpen = !_notiPanelOpen;
  const panel = $id('notiPanel');
  const overlay = $id('notiPanelOverlay');
  if (_notiPanelOpen) {
    panel.style.display = '';
    overlay.style.display = '';
    requestAnimationFrame(() => { panel.classList.add('show'); overlay.classList.add('show'); });
    renderNotiPanel();
    markNotisRead();
  } else {
    panel.classList.remove('show');
    overlay.classList.remove('show');
    setTimeout(() => { panel.style.display = 'none'; overlay.style.display = 'none'; }, 200);
  }
};

async function loadNotifications() {
  if (!currentUser) return;
  try {
    const snap = await get(ref(db, `notifications/${currentUser.id}`));
    if (!snap.exists()) { updateNotiBadge(0); return; }
    const data = snap.val();
    const lastRead = parseInt(localStorage.getItem('kw_lastNotiRead') || '0');
    let unread = 0;
    Object.keys(data).forEach(k => { if (parseInt(k) > lastRead) unread++; });
    updateNotiBadge(unread);
  } catch (e) {}
}

function updateNotiBadge(count) {
  const badge = $id('notiBellBadge');
  if (!badge) return;
  if (count > 0) {
    badge.style.display = '';
    badge.textContent = count > 9 ? '9+' : count;
  } else {
    badge.style.display = 'none';
  }
}

async function renderNotiPanel() {
  const list = $id('notiPanelList');
  if (!currentUser) { list.innerHTML = '<div class="noti-empty">로그인 필요</div>'; return; }
  try {
    const snap = await get(ref(db, `notifications/${currentUser.id}`));
    if (!snap.exists()) { list.innerHTML = '<div class="noti-empty">알림이 없어요</div>'; return; }
    const data = snap.val();
    const lastRead = parseInt(localStorage.getItem('kw_lastNotiRead') || '0');
    const all = Object.entries(data).map(([k, v]) => ({ ...v, ts: parseInt(k) })).sort((a, b) => b.ts - a.ts).slice(0, 30);
    if (all.length === 0) { list.innerHTML = '<div class="noti-empty">알림이 없어요</div>'; return; }
    let h = '';
    all.forEach(n => {
      const isNew = n.ts > lastRead;
      const d = new Date(n.ts);
      const timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      const iconMap = { cheer: '💬', activity: '🔥', group: '👥' };
      const icon = iconMap[n.type] || '🔔';
      h += `<div class="noti-item${isNew ? ' noti-new' : ''}">`;
      h += `<div class="noti-item-icon">${icon}</div>`;
      h += `<div class="noti-item-body"><div class="noti-item-text">${esc(n.text)}</div><div class="noti-item-time">${timeStr}</div></div>`;
      if (isNew) h += `<div class="noti-item-dot"></div>`;
      h += `</div>`;
    });
    list.innerHTML = h;
  } catch (e) {
    list.innerHTML = '<div class="noti-empty">불러오기 실패</div>';
  }
}

function markNotisRead() {
  localStorage.setItem('kw_lastNotiRead', String(Date.now()));
  updateNotiBadge(0);
}

// 알림 생성 헬퍼 (다른 곳에서 호출)
async function createNotification(targetUid, type, text) {
  const ts = Date.now();
  await set(ref(db, `notifications/${targetUid}/${ts}`), { type, text, ts });
}

// ===== 공지 =====
async function loadNoticeBanner() {
  try {
    const snap = await get(ref(db, 'notices'));
    if (!snap.exists()) { $id('noticeBanner').classList.remove('visible'); return; }
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
        $id('noticeBannerTitle').textContent = latest.title;
        $id('noticeBanner').classList.add('visible');
        $id('noticeBanner')._noticeData = latest;
      } else { $id('noticeBanner').classList.remove('visible'); }
    } else { $id('noticeBanner').classList.remove('visible'); }
  } catch (e) {}
}
window.openNoticeModal = function () {
  const n = $id('noticeBanner')._noticeData;
  if (!n) return;
  const body = $id('noticeModalBody');
  let h = `<div class="notice-modal-title">${esc(n.title)}</div><div class="notice-modal-date">${new Date(n.createdAt).toLocaleDateString('ko')}</div>`;
  if (n.img) h += `<img class="notice-modal-img" src="${n.img}" onerror="this.style.display='none'">`;
  if (n.desc) h += `<div class="notice-modal-desc">${esc(n.desc)}</div>`;
  body.innerHTML = h;
  $id('noticeModalOverlay').classList.add('open');
  localStorage.setItem(`qb_notice_read_${n.id}`, '1');
  $id('noticeBanner').classList.remove('visible');
};
window.closeNoticeModal = function () { $id('noticeModalOverlay').classList.remove('open'); };

// ===== 친구 =====
let _friendActivityCache = []; // [{fid, nick, emoji, todayCount}]
let _friendHasHabitsCount = 0; // friends with at least 1 habit
let _friendTotalCount = 0; // total friends

async function checkFriendActivity() {
  try {
    const grpSnap = await get(ref(db, 'groups'));
    if (!grpSnap.exists()) return;
    const groups = grpSnap.val();
    let friendIds = new Set();
    Object.values(groups).forEach(g => { if (g.members && Object.values(g.members).includes(currentUser.id)) Object.values(g.members).forEach(m => { if (m !== currentUser.id) friendIds.add(m); }); });
    if (friendIds.size === 0) return;

    const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    const todayPrefix = `_${y}_${m}_${d}`;
    _friendActivityCache = [];
    _friendHasHabitsCount = 0;
    _friendTotalCount = friendIds.size;

    for (const fid of friendIds) {
      const dSnap = await get(ref(db, `dashboards/${fid}`));
      const uSnap = await get(ref(db, `users/${fid}`));
      if (!uSnap.exists()) continue;
      const u = uSnap.val(), dash = dSnap.exists() ? dSnap.val() : {};
      const nick = dash.nickname || u.name || fid;
      const comp = dash.completions || {};
      const goals = dash.goals || [];
      const hasHabits = Array.isArray(goals) ? goals.some(g => g && g.unit) : Object.values(goals).some(g => g && g.unit);
      if (hasHabits) _friendHasHabitsCount++;
      const totalHabits = Array.isArray(goals) ? goals.filter(g => g && g.unit).length : Object.values(goals).filter(g => g && g.unit).length;
      const todayCount = Object.entries(comp).filter(([k, v]) => k.endsWith(todayPrefix) && !!v).length;
      if (todayCount > 0) {
        _friendActivityCache.push({ fid, nick, emoji: getFriendEmoji(fid), todayCount, totalHabits });
      } else if (hasHabits) {
        _friendActivityCache.push({ fid, nick, emoji: getFriendEmoji(fid), todayCount: 0, totalHabits });
      } else {
        _friendActivityCache.push({ fid, nick, emoji: getFriendEmoji(fid), todayCount: 0, totalHabits: 0, noHabits: true });
      }
    }

    // Show/hide badge
    const badge = $id('friendTabBadge');
    const lastSeen = localStorage.getItem('kw_friendNotiDate');
    const today = `${y}-${m}-${d}`;
    if (_friendActivityCache.some(f => f.todayCount > 0) && lastSeen !== today) {
      if (badge) badge.style.display = '';
    } else {
      if (badge) badge.style.display = 'none';
    }

    // Render mini activity on main screen
    renderMainFriendActivity();
  } catch (e) {}
}

function getMyTodayProgress() {
  const goals = getAllGoals();
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  let total = 0, done = 0;
  goals.forEach((g, i) => {
    if (!g || !g.title) return;
    const mg = migrateGoal(g);
    if (!mg.unit) return;
    // Check if this habit is active today
    if (mg.unit === 'daily' || mg.unit === 'health_sleep' || mg.unit === 'health_workout') {
      total++;
    } else if (mg.unit === 'weekly' || mg.unit === 'biweekly') {
      total++;
    } else return;
    if (localDash.completions && isCompDone(localDash.completions[`g${i}_${y}_${m}_${d}`], localDash.goals[i])) done++;
  });
  return { total, done };
}

function renderMainFriendActivity() {
  renderStageMessage();
}

// 도트 프로그레스 헬퍼 (done/total → ●○ 문자열)
function buildDotProgress(done, total) {
  if (total <= 10) {
    return '<span class="dot filled">●</span>'.repeat(done) + '<span class="dot empty">○</span>'.repeat(total - done);
  }
  // 10개 넘으면 미니 바로 폴백
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  return `<span class="dot-bar"><span class="dot-bar-fill" style="width:${pct}%"></span></span>`;
}

async function renderFriends() {
  const sec = $id('friendsSection');
  sec.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim);">로딩 중...</div>';
  const grpSnap = await get(ref(db, 'groups'));
  if (!grpSnap.exists()) { sec.innerHTML = '<div class="friends-empty">그룹이 없어요</div>'; return; }
  const groups = grpSnap.val();
  let friendIds = new Set();
  Object.values(groups).forEach(g => { if (g.members && Object.values(g.members).includes(currentUser.id)) Object.values(g.members).forEach(m => { if (m !== currentUser.id) friendIds.add(m); }); });
  if (friendIds.size === 0) { sec.innerHTML = '<div class="friends-empty">아직 같은 그룹의 친구가 없어요</div>'; return; }

  // Clear badge on friends tab entry
  const now0 = new Date();
  localStorage.setItem('kw_friendNotiDate', `${now0.getFullYear()}-${now0.getMonth()+1}-${now0.getDate()}`);
  const badge = $id('friendTabBadge');
  if (badge) badge.style.display = 'none';

  // Activity summary card — all friends with dot progress
  let h = '';
  if (_friendActivityCache.length > 0) {
    const sorted = [..._friendActivityCache].sort((a, b) => b.todayCount - a.todayCount);
    const show = sorted.slice(0, 3);
    const rest = sorted.length - show.length;
    const activeCount = sorted.filter(f => f.todayCount > 0).length;
    const idleCount = sorted.length - activeCount;

    h += `<div class="friend-activity-card" onclick="switchTab('friends')">`;
    show.forEach(f => {
      if (f.noHabits) {
        h += `<div class="friend-progress-row">`;
        h += `<span class="friend-progress-name">${f.emoji} ${esc(f.nick)}</span>`;
        h += `<span class="friend-progress-dots" style="opacity:.4;font-size:11px;">습관 없음</span>`;
        h += `<span class="friend-progress-count">—</span>`;
        h += `</div>`;
      } else {
        const dots = buildDotProgress(f.todayCount, f.totalHabits);
        const statusIcon = f.todayCount >= f.totalHabits && f.totalHabits > 0 ? ' ⭐' : f.todayCount > 0 ? ' 🔥' : ' 😴';
        h += `<div class="friend-progress-row">`;
        h += `<span class="friend-progress-name">${f.emoji} ${esc(f.nick)}${statusIcon}</span>`;
        h += `<span class="friend-progress-dots">${dots}</span>`;
        h += `<span class="friend-progress-count">${f.todayCount}/${f.totalHabits}</span>`;
        h += `</div>`;
      }
    });
    if (rest > 0) h += `<div class="friend-progress-more">외 ${rest}명</div>`;
    let summaryMsg = '';
    if (activeCount > 0 && idleCount > 0) summaryMsg = `💪 ${activeCount}명 활동 중 · ${idleCount}명 대기 중`;
    else if (activeCount > 0) summaryMsg = `💪 모두 열심히 하는 중!`;
    else summaryMsg = `😴 아직 아무도 시작 안 했어요`;
    h += `<div class="friend-activity-sub">${summaryMsg}</div>`;
    h += `</div>`;
  } else if (_friendHasHabitsCount > 0) {
    h += `<div class="friend-activity-card idle" onclick="switchTab('friends')">
      <div class="friend-activity-text">아직 아무도 시작 안 했어요 😴</div>
      <div class="friend-activity-sub">먼저 시작해서 친구들을 자극해볼까요?</div>
    </div>`;
  } else if (_friendTotalCount > 0) {
    h += `<div class="friend-activity-card idle" onclick="switchTab('friends')">
      <div class="friend-activity-text">친구들이 아직 습관을 등록하지 않았어요</div>
      <div class="friend-activity-sub">습관을 등록하라고 알려주세요! 📢</div>
    </div>`;
  }
  h += '<div class="friend-list">';
  for (const fid of friendIds) {
    const uSnap = await get(ref(db, `users/${fid}`));
    const dSnap = await get(ref(db, `dashboards/${fid}`));
    if (!uSnap.exists()) continue;
    const u = uSnap.val(), d = dSnap.exists() ? dSnap.val() : {};
    const nick = d.nickname || u.name;
    h += `<div class="friend-card" onclick="openFriendDetail('${fid}')"><div class="friend-avatar">${getFriendEmoji(fid)}</div><div class="friend-info"><div class="friend-name">${esc(nick)}</div></div></div>`;
  }
  h += '</div><div id="friendDetailArea"></div>';
  sec.innerHTML = h;
  // Auto-expand if only 1 friend
  if (friendIds.size === 1) {
    const fid = [...friendIds][0];
    openFriendDetail(fid);
  }
}

window.openFriendDetail = async function (fid) {
  const area = $id('friendDetailArea');
  area.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim);">로딩 중...</div>';
  const dSnap = await get(ref(db, `dashboards/${fid}`));
  const uSnap = await get(ref(db, `users/${fid}`));
  const d = dSnap.exists() ? dSnap.val() : {}, u = uSnap.exists() ? uSnap.val() : {};
  const nick = d.nickname || u.name || fid;
  const goals = d.goals || [], comp = d.completions || {};
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, day = now.getDate();
  let h = `<div class="friend-detail"><div class="fgoal-grid">`;
  for (let i = 0; i < MAX_HABITS; i++) {
    const g = goals[i]; if (!g || !g.unit) continue;
    if (g.public === false) continue;
    const mg = migrateGoal(g);
    const mod = goalModulus(mg, i, y, m);
    let done = 0;
    if (mg.unit === 'once') done = isCompDone(comp[`g${i}_once`], mg) ? 1 : 0;
    else { const pfx = `g${i}_${y}_${m}_`; done = Object.entries(comp).filter(([k, v]) => k.startsWith(pfx) && isCompDone(v, mg)).length; }
    const pct = mod > 0 ? Math.round(done / mod * 100) : 0;
    const todayK = `g${i}_${y}_${m}_${day}`;
    const todayDone = isCompDone(comp[todayK], mg) || (mg.unit === 'once' && isCompDone(comp[`g${i}_once`], mg));
    h += `<button class="fgoal-btn ${todayDone ? 'fgoal-today-done' : ''}" id="fgoal_${i}" onclick="selectFriendGoal('${fid}',${i})"><div class="fgoal-name">${esc(g.title)}</div><div class="fgoal-pct">${pct}%</div><div class="fgoal-bar"><div class="fgoal-bar-fill" style="width:${Math.min(pct,100)}%"></div></div></button>`;
  }
  h += `</div><div id="friendGoalCal"></div>`;
  // 친구별 응원 (습관 무관)
  h += `<div class="cheer-box"><div class="cheer-box-title">💬 응원하기</div>`;
  const cheerSnap = await get(ref(db, `cheers/${fid}`));
  if (cheerSnap.exists()) {
    const raw = cheerSnap.val();
    // 호환: 기존 goalIndex 하위 + 새 flat 형식 모두 파싱
    let allCheers = [];
    Object.entries(raw).forEach(([k, v]) => {
      if (v && typeof v === 'object' && v.from && v.text) {
        allCheers.push({ ...v, ts: parseInt(k) });
      } else if (typeof v === 'object') {
        Object.entries(v).forEach(([ts2, msg]) => {
          if (msg && msg.from) allCheers.push({ ...msg, ts: parseInt(ts2) });
        });
      }
    });
    allCheers.sort((a, b) => b.ts - a.ts);
    const recent = allCheers.slice(0, 5);
    if (recent.length > 0) {
      h += `<div class="cheer-list">`;
      recent.forEach(c => {
        const dt = new Date(c.ts);
        h += `<div class="cheer-item"><div class="cheer-from">${esc(c.from)}</div><div class="cheer-text">${esc(c.text)}</div><div class="cheer-time">${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}</div></div>`;
      });
      h += `</div>`;
    }
  }
  h += `<div class="cheer-input-row"><input class="cheer-text-input" id="cheerInput" placeholder="응원 메시지 보내기" maxlength="50"><button class="cheer-send-btn" onclick="sendCheer('${fid}')">보내기</button></div></div>`;
  h += `</div>`;
  area.innerHTML = h;
  // Fix iOS keyboard scroll
  const cheerInput = $id('cheerInput');
  if (cheerInput) {
    cheerInput.addEventListener('focus', () => {
      setTimeout(() => { cheerInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 300);
    });
  }
};

window.selectFriendGoal = function (fid, gi) {
  // Remove active from all, add to selected
  document.querySelectorAll('.fgoal-btn').forEach(b => b.classList.remove('fg-active'));
  const btn = $id(`fgoal_${gi}`);
  if (btn) btn.classList.add('fg-active');
  showFriendGoalCal(fid, gi);
};

window.showFriendGoalCal = async function (fid, gi) {
  const area = $id('friendGoalCal');
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
    const k = `g${gi}_${y}_${m}_${dd}`, done = !!comp[k];
    const isToday = dd === now.getDate();
    h += `<div class="rocal-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}">${dd}</div>`;
  }
  h += `</div></div>`;
  area.innerHTML = h;
};

window.sendCheer = async function (fid) {
  const input = $id('cheerInput');
  const text = input.value.trim(); if (!text) return;
  const ts = Date.now();
  const myNick = localDash.nickname || currentUser.name;
  await set(ref(db, `cheers/${fid}/${ts}`), { from: myNick, text, ts });
  await createNotification(fid, 'cheer', `${myNick}님이 응원을 보냈어요: "${text}"`);
  showToast('💬 응원 전송!', 'done');
  openFriendDetail(fid);
};

// ===== 관리자 =====
const ADMIN_UNIT_LABELS = { once:'한 번', daily:'매일', w1:'주 1회', w2:'주 2~3회', w4:'주 4~5회', w6:'주 6회' };
const ADMIN_UNIT_FREQ = { once:0, daily:7, w1:1, w2:2, w4:4, w6:6 };
let _adminUsers = {}, _adminDash = {}, _adminGroups = {};
let _adminDetailTab = 'habit';

window.openAdminPanel = function () {
  if (!currentUser || currentUser.id !== 'jin') return;
  showScreen('adminScreen');
  renderAdminList();
};

window.adminGoBack = function () {
  if (localDash) {
    showScreen('dashboardScreen');
  } else {
    doLogout();
  }
};

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

// 어드민 섹션 탭 전환
window.switchAdminSection = function(sec) {
  ['user','group','notice'].forEach(s => {
    $id('aTab_'+s)?.classList.toggle('active', s===sec);
    const panel = $id('aSection_'+s);
    if(panel) {
      panel.classList.toggle('active', s===sec);
      panel.style.display = ''; // 인라인 style 제거, CSS 클래스로 제어
    }
  });
};

window.toggleAdminCreate = function() {
  const form = $id('adminUserCreateForm');
  const btn = $id('adminUserCreateToggle');
  if (form.style.display === 'none') {
    form.style.display = 'block';
    btn.style.display = 'none';
  } else {
    form.style.display = 'none';
    btn.style.display = 'block';
  }
};

function renderAdminUserTable() {
  const tbl = $id('adminUserTable');
  const users = Object.entries(_adminUsers).filter(([,u]) => u.role !== 'admin');
  if (users.length === 0) { tbl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:12px;text-align:center;">등록된 유저 없음</div>'; return; }
  let h = '';
  for (const [id, u] of users) {
    const dash = _adminDash[id] || {};
    const { habits, challenges } = adminCountData(dash);
    const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '없음';
    const tut = dash.tutorialDone;
    const pwMasked = (u.password||'').length > 0 ? '••••••' : '없음';

    h += `<div class="admin-user-card" onclick="showAdminUserDetail('${id}')">
      <div class="auc-top">
        <div><span class="auc-name">${esc(u.name)}</span> <span class="auc-id">@${esc(id)}</span></div>
        <span style="font-size:11px;color:var(--text-dim);">${lastLogin}</span>
      </div>
      <div class="auc-badges">
        <span class="auc-badge" style="background:rgba(25,82,245,.08);color:var(--accent);border:1px solid rgba(25,82,245,.15);">습관 ${habits}</span>
        <span class="auc-badge" style="background:rgba(255,94,125,.08);color:var(--accent2);border:1px solid rgba(255,94,125,.15);">도전 ${challenges}</span>
        <span class="auc-badge" style="background:${tut?'rgba(0,185,107,.08)':'var(--surface2)'};color:${tut?'#00b96b':'var(--text-dim)'};border:1px solid ${tut?'rgba(0,185,107,.2)':'var(--border)'};">${tut?'튜토리얼 ✓':'미완료'}</span>
      </div>
      <div class="auc-meta" onclick="event.stopPropagation()">
        <div class="auc-pw" id="pwArea_${id}">
          <span id="pwMask_${id}">${pwMasked}</span>
          <button class="btn-sm" style="padding:1px 6px;font-size:9px;margin-left:4px;" onclick="adminTogglePw('${id}')" id="pwToggleBtn_${id}">보기</button>
        </div>
        <div class="auc-actions">
          <button class="btn-sm" style="padding:2px 8px;font-size:10px;" onclick="adminStartEditPw('${id}')">비번 수정</button>
          <button class="btn-sm" style="padding:2px 8px;font-size:10px;color:var(--danger);border-color:var(--danger);" onclick="adminDeleteUser('${id}')">삭제</button>
        </div>
      </div>
      <div id="pwEdit_${id}" style="display:none;gap:6px;align-items:center;margin-top:6px;" onclick="event.stopPropagation()">
        <input id="pwInput_${id}" type="text" value="${esc(u.password||'')}" class="admin-input" style="flex:1;padding:6px 8px;font-size:11px;font-family:monospace;">
        <button class="btn-sm" style="padding:2px 8px;font-size:10px;background:var(--accent);color:#fff;border-color:var(--accent);" onclick="adminSavePw('${id}')">저장</button>
        <button class="btn-sm" style="padding:2px 8px;font-size:10px;" onclick="adminCancelPw('${id}')">취소</button>
      </div>
    </div>`;
  }
  tbl.innerHTML = h;
}

window.adminTogglePw = function(id) {
  const mask = $id('pwMask_'+id);
  const btn = $id('pwToggleBtn_'+id);
  const u = _adminUsers[id];
  if (btn.textContent === '보기') {
    mask.textContent = u?.password || '없음';
    btn.textContent = '숨김';
  } else {
    mask.textContent = (u?.password||'').length > 0 ? '••••••' : '없음';
    btn.textContent = '보기';
  }
};

window.adminStartEditPw = function(id) { $id('pwArea_'+id).style.display='none'; $id('pwEdit_'+id).style.display='flex'; };
window.adminCancelPw = function(id) { $id('pwArea_'+id).style.display=''; $id('pwEdit_'+id).style.display='none'; };
window.adminSavePw = async function(id) {
  const pw = $id('pwInput_'+id).value.trim();
  if (!pw) return;
  await set(ref(db, 'users/'+id+'/password'), pw);
  showToast('✅ 비밀번호 변경', 'done'); renderAdminList();
};
window.adminCreateUser = async function() {
  const name = $id('adminNewName').value.trim();
  const id = $id('adminNewId').value.trim();
  const pw = $id('adminNewPw').value.trim();
  if (!name||!id||!pw) { showToast('모든 항목 입력 필요', 'normal'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(id)) { showToast('아이디: 영문/숫자/_만', 'normal'); return; }
  if (_adminUsers[id]) { showToast('이미 존재하는 아이디', 'normal'); return; }
  await set(ref(db, 'users/'+id), { name: name, password: pw, role: 'user' });
  $id('adminNewName').value=''; $id('adminNewId').value=''; $id('adminNewPw').value='';
  $id('adminUserCreateForm').style.display='none';
  $id('adminUserCreateToggle').style.display='block';
  showToast('✅ '+name+' 생성!', 'done'); renderAdminList();
};
window.adminDeleteUser = async function(id) {
  if (!confirm((_adminUsers[id]?.name||id)+' 계정 삭제?')) return;
  await Promise.all([set(ref(db,'users/'+id),null), set(ref(db,'dashboards/'+id),null)]);
  showToast('🗑 삭제됨', 'normal'); renderAdminList();
};

// ===== 관리자 유저 상세 =====
window.showAdminUserDetail = function(uid) {
  _adminDetailTab = 'habit';
  renderAdminDetail(uid);
  $id('adminDetailOverlay').style.display = 'block';
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

  var panel = $id('adminDetailPanel');
  var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<div><div style="font-family:var(--font-heading);font-size:20px;">'+esc(u.name||uid)+'</div><div style="font-size:12px;color:var(--text-dim);">@'+esc(uid)+' · '+lastLogin+'</div></div>' +
    '<button class="btn-sm" onclick="document.getElementById(\'adminDetailOverlay\').style.display=\'none\'">✕</button></div>';
  // meta cards
  var hpCol = habitPct>=70?'var(--accent3)':habitPct>=40?'orange':'var(--danger)';
  var ppCol = projPct>=70?'var(--accent3)':projPct>=40?'orange':'var(--accent)';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;">' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">습관</div><div style="font-family:var(--font-heading);font-size:20px;color:var(--accent);">'+habits+'개</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">습관 달성률</div><div style="font-family:var(--font-heading);font-size:20px;color:'+hpCol+';">'+habitPct+'%</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">도전</div><div style="font-family:var(--font-heading);font-size:20px;color:var(--accent2);">'+challenges+'개</div></div>' +
    '<div style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:10px;"><div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">프로젝트</div><div style="font-family:var(--font-heading);font-size:20px;color:'+ppCol+';">'+projPct+'%</div></div></div>';
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
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:13px;font-weight:700;">'+esc(g.title)+'</div><div style="font-family:var(--font-heading);font-size:18px;color:'+col+';">'+pct+'%</div></div>' +
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
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:13px;font-weight:700;">'+esc(c.title)+'</div><div style="font-family:var(--font-heading);font-size:18px;color:'+col2+';">'+pp2+'%</div></div>' +
          '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:6px;"><div style="height:100%;width:'+pp2+'%;background:'+col2+';border-radius:2px;"></div></div>' +
          '<div style="display:flex;gap:4px;margin-bottom:4px;"><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:rgba(25,82,245,.08);border:1px solid rgba(25,82,245,.15);color:var(--accent);">프로젝트</span><span style="font-size:10px;padding:2px 8px;border-radius:100px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);">'+td2+'/'+tt2+'</span></div>' +
          stH + '</div>';
      }
    });
  }
  panel.innerHTML = h;
}

// ===== 관리자 그룹 =====
function renderAdminGroupList() {
  var gl = $id('adminGroupList');
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
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><div style="font-family:var(--font-heading);font-size:14px;">📁 '+esc(g.name)+'</div><button class="btn-sm" style="padding:2px 8px;font-size:10px;color:var(--danger);border-color:var(--danger);" onclick="adminDeleteGroup(\''+gid+'\')">삭제</button></div>' +
      '<div style="margin-bottom:8px;">'+(chips||'<span style="color:var(--text-dim);font-size:11px;">멤버 없음</span>')+'</div>' +
      (addOpts?'<div style="display:flex;gap:6px;"><select id="gsel_'+gid+'" style="flex:1;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:6px 8px;color:var(--text);font-size:12px;font-family:var(--font-main);outline:none;"><option value="">+ 멤버 추가</option>'+addOpts+'</select><button class="btn-sm" style="padding:4px 10px;font-size:11px;background:var(--accent);color:#fff;border-color:var(--accent);" onclick="adminAddMember(\''+gid+'\')">추가</button></div>':'') +
    '</div>';
  });
  gl.innerHTML = h;
}

window.adminCreateGroup = async function() {
  var name = $id('adminNewGroupName').value.trim();
  if (!name) return;
  await push(ref(db,'groups'), { name: name, members:{} });
  $id('adminNewGroupName').value = '';
  showToast('✅ "'+name+'" 그룹 생성!', 'done'); renderAdminList();
};
window.adminDeleteGroup = async function(gid) {
  if (!confirm('그룹 삭제?')) return;
  await set(ref(db,'groups/'+gid), null);
  showToast('🗑 삭제됨', 'normal'); renderAdminList();
};
window.adminAddMember = async function(gid) {
  var sel = $id('gsel_'+gid);
  var uid = sel?.value; if (!uid) return;
  await set(ref(db,'groups/'+gid+'/members/'+uid+'_'+Date.now()), uid);
  showToast('✅ 멤버 추가!', 'done'); renderAdminList();
};
window.adminRemoveMember = async function(gid, mk) {
  await set(ref(db,'groups/'+gid+'/members/'+mk), null);
  showToast('✅ 제거됨', 'done'); renderAdminList();
};

// ===== 관리자 공지 =====
async function renderAdminNoticeList() {
  var nl = $id('adminNoticeList');
  var nSnap = await get(ref(db, 'notices'));
  if (!nSnap.exists()) { nl.innerHTML = ''; return; }
  var nh = '';
  Object.entries(nSnap.val()).sort(function(a,b){return (b[1].createdAt||'').localeCompare(a[1].createdAt||'');}).forEach(function(entry){
    var nid=entry[0], n=entry[1];
    nh += '<div class="notice-card"><div class="notice-card-info"><div class="notice-card-title">'+esc(n.title)+'</div><div class="notice-card-meta">'+n.target+' · '+new Date(n.createdAt).toLocaleDateString('ko')+'</div></div><button class="notice-card-del" onclick="deleteNotice(\''+nid+'\')">삭제</button></div>';
  });
  nl.innerHTML = nh;
}

// ===== 공지 관리 =====
let _noticeTarget = 'all';
window.setNoticeTarget = function (t) {
  _noticeTarget = t;
  ['All', 'Group', 'User'].forEach(s => $id(`noticeTarget${s}`).classList.toggle('active', t === s.toLowerCase()));
  $id('noticeTargetDetail').style.display = t === 'all' ? 'none' : 'block';
  if (t === 'user') $id('noticeTargetDetail').innerHTML = `<input class="admin-notice-input" id="noticeTargetId" placeholder="유저 아이디 입력">`;
  else if (t === 'group') $id('noticeTargetDetail').innerHTML = `<input class="admin-notice-input" id="noticeTargetGroupId" placeholder="그룹 ID 입력">`;
};
window.submitNotice = async function () {
  const title = $id('noticeTitle').value.trim();
  if (!title) { showToast('제목을 입력하세요', 'normal'); return; }
  const desc = $id('noticeDesc').value.trim();
  const img = $id('noticeImg').value.trim();
  const notice = { title, desc, img, target: _noticeTarget, createdAt: new Date().toISOString() };
  if (_noticeTarget === 'user') notice.targetId = $id('noticeTargetId')?.value.trim();
  if (_noticeTarget === 'group') notice.targetGroupId = $id('noticeTargetGroupId')?.value.trim();
  await push(ref(db, 'notices'), notice);
  showToast('📢 공지 추가!', 'done');
  $id('noticeTitle').value = '';
  $id('noticeDesc').value = '';
  $id('noticeImg').value = '';
  renderAdminList();
};
window.deleteNotice = async function (nid) {
  if (!confirm('공지를 삭제할까요?')) return;
  await remove(ref(db, `notices/${nid}`));
  showToast('삭제됨', 'normal'); renderAdminList();
};

// ===== 튜토리얼 =====
let tutStep = 1, tutChecked = 0, tutGoalName = '12시 전에 자기';
function initTutorial() {
  tutStep = 1; tutChecked = 0;
  const dots = $id('tutDots');
  let dh = ''; for (let i = 1; i <= TUT_STEPS; i++) dh += `<div class="tut-dot ${i === 1 ? 'active' : ''}" id="tutDot${i}"></div>`;
  dots.innerHTML = dh;
  $id('tutFill').style.width = '0%';
}
function tutUpdateUI() {
  for (let i = 1; i <= TUT_STEPS; i++) {
    const d = $id(`tutDot${i}`);
    d.className = 'tut-dot' + (i === tutStep ? ' active' : i < tutStep ? ' done' : '');
  }
  $id('tutFill').style.width = ((tutStep - 1) / (TUT_STEPS - 1) * 100) + '%';
  for (let i = 1; i <= TUT_STEPS; i++) $id(`tutStep${i}`).classList.toggle('active', i === tutStep);
}
window.tutStep1Confirm = function () { $id('tutGoalBtn').style.background = 'var(--accent-light)'; $id('tutGoalBtn').style.borderColor = 'var(--accent)'; setTimeout(() => tutNextStep(2), 400); };
window.tutNextStep = function (s) {
  tutStep = s; tutUpdateUI();
  if (s === 2) { $id('tutGoalName2').textContent = tutGoalName; renderTutUnitOpts(); }
  if (s === 3) { $id('tutGoalName3').textContent = tutGoalName; renderTutCal(); }
  if (s === 4) { const pct = Math.round(tutChecked / 28 * 100); $id('tutGoalName4').textContent = tutGoalName; $id('tutGoalPct4').textContent = pct + '%'; $id('tutGoalBar4').style.width = pct + '%'; $id('tutGoalStat4').textContent = `${tutChecked}/28`; $id('tutGbFill').style.width = pct + '%'; $id('tutGbPct').textContent = pct + '%'; }
  if (s === 5) { $id('tutAvatarArt').innerHTML = AVATARS[0]; }
};
function renderTutUnitOpts() {
  const opts = [{ l: '매일', v: 'daily' }, { l: '주 2~3회', v: 'w23' }, { l: '주 4~5회', v: 'w45', target: true }, { l: '한 번', v: 'once' }];
  let h = '';
  opts.forEach(o => h += `<div class="unit-opt ${o.target ? 'tut-cal-cell target' : ''}" onclick="tutSelectUnit('${o.v}')" id="tutUopt_${o.v}">${o.l}</div>`);
  $id('tutUnitOpts').innerHTML = h;
}
window.tutSelectUnit = function (v) {
  document.querySelectorAll('#tutUnitOpts .unit-opt').forEach(e => e.classList.remove('selected'));
  $id(`tutUopt_${v}`)?.classList.add('selected');
  setTimeout(() => tutNextStep(3), 500);
};
function renderTutCal() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  const days = getMonthDays(y, m), fd = new Date(y, m - 1, 1).getDay();
  let dh = ''; ['일', '월', '화', '수', '목', '금', '토'].forEach(d => dh += `<div class="tut-cal-day">${d}</div>`);
  $id('tutCalDayRow').innerHTML = dh;
  let gh = '';
  for (let i = 0; i < fd; i++) gh += `<div class="tut-cal-cell empty"></div>`;
  for (let d = 1; d <= days; d++) gh += `<div class="tut-cal-cell" id="tutCal_${d}" onclick="tutToggleCal(${d})">${d}</div>`;
  $id('tutCalGrid').innerHTML = gh;
  tutChecked = 0; $id('tutStep3Status').textContent = '0 / 4 체크';
}
window.tutToggleCal = function (d) {
  const el = $id(`tutCal_${d}`);
  if (el.classList.contains('done')) { el.classList.remove('done'); tutChecked--; }
  else { el.classList.add('done'); tutChecked++; showConfettiSmall(); }
  $id('tutStep3Status').textContent = `${tutChecked} / 4 체크`;
  if (tutChecked >= 4) setTimeout(() => tutNextStep(4), 600);
};
window.tutFinish = async function () {
  localDash.tutorialDone = true; await saveDash();
  showScreen('dashboardScreen'); await setupDashTabs(currentUser.id); renderDashboard();
  showConfetti(); showToast('🎉 시작합니다!', 'done');
};

// ===== 3D 햄스터 =====
// ===== 햄스터 집 (수면 모드) =====
function initHamsterHouse(container) {
  if (typeof THREE !== 'undefined') { buildHamsterHouse(container); return; }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js';
  script.onload = () => buildHamsterHouse(container);
  document.head.appendChild(script);
}

function buildHamsterHouse(container) {
  if (typeof THREE === 'undefined') { container.innerHTML = '🏠'; return; }
  let scene, camera, renderer, leftEyeMesh, rightEyeMesh;
  let blinkState = { active: false, progress: 0 };
  const creamColor = 0xfffcf2;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2.5, 13);
  camera.lookAt(0, 2.2, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(220, 220);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 0.8);
  dl.position.set(3, 10, 8);
  scene.add(dl);

  const houseGroup = new THREE.Group();

  // Floor removed - no background circle
  
  // House body
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 3.5, 4),
    new THREE.MeshStandardMaterial({ color: creamColor, roughness: 0.8 })
  );
  base.position.y = 1.75;
  houseGroup.add(base);

  // Door (arch)
  const doorShape = new THREE.Shape();
  const dw = 2.4, dh = 3.6;
  doorShape.moveTo(-dw/2, 0);
  doorShape.lineTo(dw/2, 0);
  doorShape.lineTo(dw/2, dh * 0.6);
  doorShape.absarc(0, dh * 0.6, dw/2, 0, Math.PI, false);
  doorShape.lineTo(-dw/2, 0);
  const door = new THREE.Mesh(
    new THREE.ShapeGeometry(doorShape),
    new THREE.MeshBasicMaterial({ color: 0x1e293b })
  );
  door.position.set(0, 0, 2.01);
  houseGroup.add(door);

  // Sunflower seed on top
  const seedGroup = new THREE.Group();
  const seedShape = new THREE.Shape();
  seedShape.moveTo(0, 0.5);
  seedShape.quadraticCurveTo(0.35, 0.4, 0.35, -0.1);
  seedShape.quadraticCurveTo(0.35, -0.5, 0, -0.5);
  seedShape.quadraticCurveTo(-0.35, -0.5, -0.35, -0.1);
  seedShape.quadraticCurveTo(-0.35, 0.4, 0, 0.5);
  seedGroup.add(new THREE.Mesh(new THREE.ShapeGeometry(seedShape), new THREE.MeshBasicMaterial({ color: 0x2d2d2d })));
  const mkStripe = (x, r) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.01), new THREE.MeshBasicMaterial({ color: 0xfafafa }));
    m.position.set(x, -0.05, 0.01); m.rotation.z = r; return m;
  };
  seedGroup.add(mkStripe(0, 0), mkStripe(-0.15, 0.25), mkStripe(0.15, -0.25));
  seedGroup.position.set(0, 3.85, 2.05);
  seedGroup.scale.set(0.65, 0.65, 1);
  houseGroup.add(seedGroup);

  // Inner face (eyes + nose + mouth peeking from door - matching hamster proportions)
  const faceZ = 2.02;
  const faceCY = 1.65;
  // Nose - pink sphere like hamster
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 32), new THREE.MeshBasicMaterial({ color: 0xf5b0a0 }));
  nose.scale.set(1.2, 0.8, 1);
  nose.position.set(0, faceCY, faceZ);
  houseGroup.add(nose);
  // Mouth
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: 0x7a5a5a }));
  mouth.scale.set(1, 0.7, 0.5);
  mouth.position.set(0, faceCY - 0.1, faceZ);
  houseGroup.add(mouth);
  // Eyes - bright white with dark pupil, visible in dark doorway
  const mkEye = (x) => {
    const g = new THREE.Group();
    // White of eye
    const eWhite = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eWhite.scale.set(0.85, 1.1, 0.5);
    // Dark pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    pupil.position.set(0, 0, 0.05);
    pupil.scale.set(0.9, 1, 0.5);
    // Highlight
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0.03, 0.04, 0.08);
    g.add(eWhite, pupil, hl);
    g.position.set(x, faceCY + 0.33, faceZ);
    return { group: g, mesh: eWhite };
  };
  const le = mkEye(-0.33);
  const re = mkEye(0.33);
  leftEyeMesh = le.mesh; rightEyeMesh = re.mesh;
  houseGroup.add(le.group, re.group);

  // Gable walls
  const gableShape = new THREE.Shape();
  const gW = 4.5 / 2, gH = 1.35;
  gableShape.moveTo(-gW, 0); gableShape.lineTo(gW, 0);
  gableShape.lineTo(0, gH); gableShape.lineTo(-gW, 0);
  const gableMat = new THREE.MeshStandardMaterial({ color: creamColor, roughness: 0.8 });
  const fg = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), gableMat);
  fg.position.set(0, 3.5, 2);
  houseGroup.add(fg);
  const bg = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), gableMat);
  bg.position.set(0, 3.5, -2); bg.rotation.y = Math.PI;
  houseGroup.add(bg);

  // Roof
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2196f3, roughness: 0.9, side: THREE.DoubleSide });
  const roofGeo = new THREE.BoxGeometry(2.9, 0.3, 5.5);
  const roofAngle = Math.PI / 5.8;
  const lr = new THREE.Mesh(roofGeo, roofMat);
  lr.position.set(-1.23, 4.25, 0); lr.rotation.z = roofAngle;
  houseGroup.add(lr);
  const rr = new THREE.Mesh(roofGeo, roofMat);
  rr.position.set(1.23, 4.25, 0); rr.rotation.z = -roofAngle;
  houseGroup.add(rr);

  scene.add(houseGroup);

  // Drag rotation
  let isDragging = false, prevX = 0, prevY = 0;
  let rotY = 0, rotX = 0;
  container.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  container.addEventListener('mousemove', e => {
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * 0.008;
    rotX += (e.clientY - prevY) * 0.005;
    rotX = Math.max(-0.3, Math.min(0.3, rotX));
    prevX = e.clientX; prevY = e.clientY;
  });
  container.addEventListener('mouseup', () => { isDragging = false; });
  container.addEventListener('touchstart', e => { if (e.touches.length === 1) { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; } }, { passive: true });
  container.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    rotY += (t.clientX - prevX) * 0.008;
    rotX += (t.clientY - prevY) * 0.005;
    rotX = Math.max(-0.3, Math.min(0.3, rotX));
    prevX = t.clientX; prevY = t.clientY;
  }, { passive: true });
  container.addEventListener('touchend', () => { isDragging = false; });

  // Tap emoji + house bounce
  const emojis = ['💤','😴','🌙','⭐','✨','🐹','💫','🏠'];
  let bounceTime = 0;
  container.addEventListener('click', e => {
    if (isDragging) return;
    const r = container.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    // Confetti burst - more particles, longer travel
    for (let i = 0; i < 12; i++) {
      const em = document.createElement('div');
      em.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      em.style.cssText = `position:absolute;font-size:${18+Math.random()*16}px;pointer-events:none;z-index:10;left:${cx-10+(Math.random()-.5)*40}px;top:${cy-10}px;opacity:1;transition:none;`;
      container.style.position = 'relative';
      container.appendChild(em);
      const dx = (Math.random()-.5)*160, dy = -(60+Math.random()*120);
      requestAnimationFrame(() => {
        em.style.transition = 'all 2s cubic-bezier(.2,.8,.3,1)';
        em.style.transform = `translate(${dx}px,${dy}px) rotate(${(Math.random()-.5)*360}deg)`;
        em.style.opacity = '0';
      });
      setTimeout(() => em.remove(), 2200);
    }
    // Trigger house bounce
    bounceTime = 1.0;
  });
  setupAvatarLongPress(container);

  // Animate
  const clock = new THREE.Clock();
  function anim() {
    container._animId = requestAnimationFrame(anim);
    const t = clock.getElapsedTime();
    // Blink
    if (!blinkState.active && Math.random() < 0.008) { blinkState.active = true; blinkState.progress = 0; }
    if (blinkState.active) {
      blinkState.progress += 0.15;
      let sY = 1;
      if (blinkState.progress < Math.PI) sY = Math.abs(Math.cos(blinkState.progress));
      else { blinkState.active = false; sY = 1; }
      if (leftEyeMesh) leftEyeMesh.scale.y = sY * 1.1;
      if (rightEyeMesh) rightEyeMesh.scale.y = sY * 1.1;
    }
    // Drag rotation + idle wandering (noticeable)
    const idleY = Math.sin(t * 0.4) * 0.2 + Math.sin(t * 0.7) * 0.1 + Math.cos(t * 1.1) * 0.05;
    const idleX = Math.sin(t * 0.3) * 0.08 + Math.cos(t * 0.55) * 0.04;
    houseGroup.rotation.y = rotY + idleY;
    houseGroup.rotation.x = rotX + idleX;
    // Slight Z tilt for liveliness
    houseGroup.rotation.z = Math.sin(t * 0.6) * 0.03;
    // Bounce on tap
    let bounceScale = 1;
    if (bounceTime > 0) {
      bounceTime -= 0.05;
      bounceScale = 1 + Math.sin(bounceTime * Math.PI * 6) * bounceTime * 0.15;
    }
    // Breathing (visible pulsing) + bounce
    const br = (1 + Math.sin(t * 1.5) * 0.04 + Math.sin(t * 2.8) * 0.02) * bounceScale;
    houseGroup.scale.set(br, br * (1 + Math.sin(t * 2) * 0.015), br);
    renderer.render(scene, camera);
  }
  anim();
}

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
  const emojiPool = ['❤️','⭐','🌟','✨','💖','🎉','💕','🌈','🍀','👏'];
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
  renderer.setSize(220, 220);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.9);
  dirLight.position.set(2, 5, 4);
  scene.add(dirLight);

  // --- Materials ---
  const orangeMat = new THREE.MeshToonMaterial({ color: 0xfdd5a0 });
  const creamMat  = new THREE.MeshToonMaterial({ color: 0xfffdf5 });
  const pinkMat   = new THREE.MeshToonMaterial({ color: 0xffc4d0 });
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

  // --- Events: Drag rotation ---
  let isDragging = false, prevDragX = 0, prevDragY = 0;
  let dragRotY = 0, dragRotX = 0;
  container.addEventListener('mousedown', e => { isDragging = true; prevDragX = e.clientX; prevDragY = e.clientY; });
  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragRotY += (e.clientX - prevDragX) * 0.008;
    dragRotX += (e.clientY - prevDragY) * 0.005;
    dragRotX = Math.max(-0.3, Math.min(0.3, dragRotX));
    prevDragX = e.clientX; prevDragY = e.clientY;
  });
  container.addEventListener('mouseup', () => { isDragging = false; });
  container.addEventListener('touchstart', e => { if (e.touches.length === 1) { isDragging = true; prevDragX = e.touches[0].clientX; prevDragY = e.touches[0].clientY; } }, { passive: true });
  container.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    dragRotY += (t.clientX - prevDragX) * 0.008;
    dragRotX += (t.clientY - prevDragY) * 0.005;
    dragRotX = Math.max(-0.3, Math.min(0.3, dragRotX));
    prevDragX = t.clientX; prevDragY = t.clientY;
  }, { passive: true });
  container.addEventListener('touchend', () => { isDragging = false; });

  // 클릭/탭 시 이모지 파티클
  function onTap(e) {
    const r = container.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    spawnEmoji(cx, cy);
    // 햄스터 살짝 점프
    hamster._jumpT = clock.getElapsedTime();
    // iOS gyro 권한 요청 (첫 탭 시)
    if (!hamster._gyroReq && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      hamster._gyroReq = true;
      console.log('[GYRO] iOS detected, requesting permission...');
      DeviceOrientationEvent.requestPermission().then(r => { console.log('[GYRO] permission result:', r); if (r === 'granted') enableGyro(); }).catch(e => { console.log('[GYRO] permission error:', e); });
    } else if (!hamster._gyroReq) {
      console.log('[GYRO] tap detected, requestPermission not available, gyroActive:', gyroActive);
      hamster._gyroReq = true;
    }
  }
  container.addEventListener('click', onTap);
  container.addEventListener('touchstart', (e) => { if (e.touches.length === 1) onTap(e); }, { passive: true });
  setupAvatarLongPress(container);

  // --- Gyro (Device Orientation) ---
  let gyroTarget = { x: 0, y: 0 };
  let gyroActive = false;
  let gyroEventCount = 0;
  function enableGyro() {
    if (gyroActive) return;
    gyroActive = true;
    console.log('[GYRO] enableGyro called, listening for deviceorientation');
    window.addEventListener('deviceorientation', (e) => {
      const gamma = e.gamma || 0; // left-right tilt: -90 to 90
      const beta = e.beta || 0;   // front-back tilt: -180 to 180
      gyroTarget.y = Math.max(-1, Math.min(1, gamma / 30)) * 0.35;
      gyroTarget.x = Math.max(-1, Math.min(1, (beta - 45) / 30)) * -0.2;
      gyroEventCount++;
      if (gyroEventCount <= 3 || gyroEventCount % 100 === 0) {
        console.log(`[GYRO] event #${gyroEventCount} gamma:${gamma.toFixed(1)} beta:${beta.toFixed(1)} → y:${gyroTarget.y.toFixed(3)} x:${gyroTarget.x.toFixed(3)}`);
      }
    });
  }
  // Android: no permission needed, start right away
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    console.log('[GYRO] Android/non-iOS: auto-enabling gyro');
    enableGyro();
  } else {
    console.log('[GYRO] iOS detected or DeviceOrientationEvent not available, waiting for tap');
  }

  // --- Animate ---
  function animate() {
    container._animId = requestAnimationFrame(animate);
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

    // 마우스/터치 + 자이로 블렌딩
    const finalY = gyroActive ? gyroTarget.y : dragRotY;
    const finalX = gyroActive ? gyroTarget.x : dragRotX;
    hamster.rotation.y += (finalY - hamster.rotation.y) * 0.08;
    hamster.rotation.x += (finalX - hamster.rotation.x) * 0.08;

    renderer.render(scene, camera);
  }
  animate();
}

// ===== 이펙트 =====
function showToast(msg, type = 'normal') {
  const t = $id('toast');
  t.textContent = msg; t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 2200);
}
// ===== 축하 이펙트 =====
function triggerHaptic(style) {
  // Native vibration (Android)
  if (navigator.vibrate) {
    if (style === 'heavy') navigator.vibrate([30, 50, 30, 50, 60]);
    else if (style === 'light') navigator.vibrate(15);
    else navigator.vibrate(10);
  }
  // Visual haptic (all platforms)
  const body = document.body;
  const cls = style === 'heavy' ? 'vhap-heavy' : 'vhap-light';
  body.classList.remove('vhap-light', 'vhap-heavy');
  void body.offsetWidth;
  body.classList.add(cls);
  setTimeout(() => body.classList.remove(cls), style === 'heavy' ? 250 : 150);
}

function showConfetti() {
  const c = $id('confettiContainer');
  const colors = ['#1952f5', '#ff5e7d', '#f5c518', '#00b96b', '#a78bfa', '#ff9f43', '#38bdf8', '#e879f9'];
  const shapes = ['square', 'circle', 'strip'];
  for (let i = 0; i < 280; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 6 + Math.random() * 12;
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    if (shape === 'circle') { p.style.width = size + 'px'; p.style.height = size + 'px'; p.style.borderRadius = '50%'; }
    else if (shape === 'strip') { p.style.width = (3 + Math.random() * 5) + 'px'; p.style.height = (14 + Math.random() * 20) + 'px'; p.style.borderRadius = '2px'; }
    else { p.style.width = size + 'px'; p.style.height = size + 'px'; }
    // 더 긴 비행시간 + 다양한 딜레이
    p.style.animationDuration = (2.5 + Math.random() * 3.5) + 's';
    p.style.animationDelay = Math.random() * 1.2 + 's';
    // 좌우 흩뿌리기
    p.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
    c.appendChild(p); setTimeout(() => p.remove(), 8000);
  }
  triggerHaptic('heavy');
  shakeScreen();
}

function showConfettiSmall() {
  const c = $id('confettiContainer');
  const colors = ['#1952f5', '#a78bfa', '#ff5e7d', '#f5c518', '#00b96b', '#38bdf8'];
  for (let i = 0; i < 100; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    const size = 5 + Math.random() * 9;
    p.style.left = (15 + Math.random() * 70) + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = size + 'px'; p.style.height = size + 'px';
    if (Math.random() > 0.5) p.style.borderRadius = '50%';
    p.style.animationDuration = (1.8 + Math.random() * 2.5) + 's';
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    c.appendChild(p); setTimeout(() => p.remove(), 5000);
  }
  triggerHaptic('light');
}

function shakeScreen() {
  const el = document.querySelector('#dashboardScreen .mobile-wrap');
  if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 800); }
}


// ===== 요리 시스템 =====

// --- Milestone Check ---
let _milestoneToastQueue = [];
let _milestoneToastRunning = false;

function checkMilestone() {
  const ck = localDash.cooking; if (!ck) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  if (ck.milestoneToday !== todayStr) { ck.milestoneToday = todayStr; ck.milestoneReached = []; ck.milestoneDrops = {}; }
  // All recipes cleared? Skip drops but still update message
  const allCleared = ck.currentScenarioId >= 12;
  const { total, done } = getMyTodayProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  // Find newly crossed milestones
  const newMilestones = [];
  MILESTONE_STAGES.forEach(ms => {
    if (pct >= ms && !ck.milestoneReached.includes(ms)) {
      ck.milestoneReached.push(ms);
      newMilestones.push(ms);
    }
  });
  // Process rewards
  newMilestones.forEach(ms => {
    if (!ck.milestoneDrops) ck.milestoneDrops = {};
    if (allCleared) {
      _milestoneToastQueue.push({ ms, ingredient: null, allCleared: true });
    } else if (ms === 25) {
      _milestoneToastQueue.push({ ms, ingredient: null });
    } else if (ms === 50) {
      const ing = dropIngredient('normal');
      if (ing) ck.milestoneDrops[ms] = ing;
      _milestoneToastQueue.push({ ms, ingredient: ing });
    } else if (ms === 75 || ms === 100) {
      const ing = dropIngredient('special');
      if (ing) ck.milestoneDrops[ms] = ing;
      _milestoneToastQueue.push({ ms, ingredient: ing });
    }
  });
  if (newMilestones.length > 0) saveDash();
  renderStageMessage();
  runMilestoneToastQueue();
}

// --- Milestone Undo: reclaim ingredients when progress drops ---
function checkMilestoneUndo() {
  const ck = localDash.cooking; if (!ck) return;
  const { total, done } = getMyTodayProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const reached = ck.milestoneReached || [];
  const drops = ck.milestoneDrops || {};

  // Find milestones that were reached but now we're below
  const lostMilestones = [];
  MILESTONE_STAGES.forEach(ms => {
    if (pct < ms && reached.includes(ms)) {
      lostMilestones.push(ms);
    }
  });
  if (lostMilestones.length === 0) { renderStageMessage(); return; }

  // Process reclaims
  const reclaimedIngredients = [];
  lostMilestones.forEach(ms => {
    // Remove from reached
    ck.milestoneReached = ck.milestoneReached.filter(m => m !== ms);
    // Reclaim ingredient if exists
    if (drops[ms]) {
      const ingKey = drops[ms];
      const current = ck.inventory[ingKey] || 0;
      if (current > 0) {
        ck.inventory[ingKey] = current - 1;
        reclaimedIngredients.push(ingKey);
      }
      delete drops[ms];
    }
  });

  saveDash();
  renderStageMessage();

  // Show reclaim notification
  const fell25 = lostMilestones.includes(25);
  if (reclaimedIngredients.length > 0) {
    const emojis = reclaimedIngredients.map(k => INGREDIENTS[k]?.emoji || '❓').join('');
    const names = reclaimedIngredients.map(k => INGREDIENTS[k]?.name || k).join(', ');
    showReclaimModal(emojis, names);
  } else if (fell25) {
    showReclaimModal(null, null, true);
  }
}

function showReclaimModal(emojis, names, isSleepOnly) {
  // Remove existing
  document.querySelectorAll('.reclaim-modal-overlay').forEach(e => e.remove());

  const overlay = document.createElement('div');
  overlay.className = 'reclaim-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;';

  let title, body;
  if (isSleepOnly) {
    title = '햄스터가 다시 잠들었어요 💤';
    body = '25% 이상 달성하면 다시 깨울 수 있어요!';
  } else {
    title = '앗, 재료가 돌아갔어요!';
    body = `${emojis} ${names} 반납!\n다시 달성하면 새 재료를 받아요`;
  }

  const modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#3b1a1a,#2a1a2e);border-radius:20px;padding:28px 24px;max-width:300px;width:85%;text-align:center;color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.4);border:1px solid rgba(255,100,100,.2);animation:scaleIn .25s cubic-bezier(.175,.885,.32,1.275);';
  modal.innerHTML = `
    <div style="font-size:36px;margin-bottom:12px;">${isSleepOnly ? '😴' : '📤'}</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${title}</div>
    <div style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.5;white-space:pre-line;">${body}</div>
  `;
  overlay.appendChild(modal);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);

  // Auto close after 2.8s
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 2800);
}

function dropIngredient(type) {
  const ck = localDash.cooking;
  const scenarioId = ck.currentScenarioId;
  const recipe = RECIPES[scenarioId];
  // Build drop pool based on type and level gating
  let pool;
  if (type === 'normal') {
    pool = INGREDIENT_ORDER.filter(k => INGREDIENTS[k].type === 'normal');
  } else {
    pool = INGREDIENT_ORDER.filter(k => {
      if (INGREDIENTS[k].type !== 'special') return false;
      const minLv = INGREDIENTS[k].minLv || 0;
      return scenarioId >= minLv;
    });
  }
  // Remove capped ingredients
  pool = pool.filter(k => (ck.inventory[k] || 0) < INGREDIENT_CAP);
  if (pool.length === 0) return null;
  // Bias toward needed ingredients
  const biasChance = type === 'normal' ? 0.5 : 0.7;
  let needed = [];
  if (recipe) {
    needed = recipe.ingredients.filter(k => {
      return INGREDIENTS[k].type === type && (ck.inventory[k] || 0) < 1 && pool.includes(k);
    });
    // For normal type checking if recipe needs any normal ingredient
    if (type === 'normal') {
      needed = recipe.ingredients.filter(k => INGREDIENTS[k].type === 'normal' && (ck.inventory[k] || 0) < 1 && pool.includes(k));
    } else {
      needed = recipe.ingredients.filter(k => INGREDIENTS[k].type === 'special' && (ck.inventory[k] || 0) < 1 && pool.includes(k));
    }
  }
  let chosen;
  if (needed.length > 0 && Math.random() < biasChance) {
    chosen = needed[Math.floor(Math.random() * needed.length)];
  } else {
    chosen = pool[Math.floor(Math.random() * pool.length)];
  }
  ck.inventory[chosen] = (ck.inventory[chosen] || 0) + 1;
  return chosen;
}

function runMilestoneToastQueue() {
  if (_milestoneToastRunning || _milestoneToastQueue.length === 0) return;
  _milestoneToastRunning = true;
  const item = _milestoneToastQueue.shift();
  showMilestoneToast(item);
  setTimeout(() => { _milestoneToastRunning = false; runMilestoneToastQueue(); }, 1800);
}

function showMilestoneToast(item) {
  const { ms, ingredient, allCleared } = item;
  const overlay = document.createElement('div');
  overlay.className = 'milestone-toast';
  let bgClass = 'ms-25';
  if (ms === 50) bgClass = 'ms-50';
  else if (ms === 75) bgClass = 'ms-75';
  else if (ms === 100) bgClass = 'ms-100';
  overlay.classList.add(bgClass);
  let html = '';
  if (allCleared) {
    if (ms === 25) html = `<div class="ms-icon">🐹</div><div class="ms-text">${ms}% 달성!</div>`;
    else html = `<div class="ms-icon">🎉</div><div class="ms-text">${ms}% 달성! 모든 요리 완성!</div>`;
  } else if (ms === 25) {
    html = `<div class="ms-icon">🐹</div><div class="ms-text">앗, 햄스터 출몰!</div><div class="ms-sub">${ms}% 달성</div>`;
  } else if (ingredient) {
    const ing = INGREDIENTS[ingredient];
    html = `<div class="ms-icon">${ing.emoji}</div><div class="ms-text">${ing.name}을(를) 획득!</div><div class="ms-sub">${ms}% 달성 보상</div>`;
  } else {
    html = `<div class="ms-icon">📦</div><div class="ms-text">재료가 가득 찼어요!</div><div class="ms-sub">요리를 해보세요 🍳</div>`;
  }
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 400); }, 2500);
}

// --- Milestone Progress Bar ---
function renderMilestoneBar() {
  const el = $id('milestoneBar');
  if (!el) return;
  const { total, done } = getMyTodayProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const ck = localDash.cooking || {};
  const reached = ck.milestoneReached || [];
  const icons = [
    { ms: 0,   emoji: '💤', label: '0%' },
    { ms: 25,  emoji: '🐹', label: '25%' },
    { ms: 50,  emoji: '📦', label: '50%' },
    { ms: 75,  emoji: '✨', label: '75%' },
    { ms: 100, emoji: '👑', label: '100%' }
  ];
  let h = `<div class="ms-bar-wrap"><div class="ms-bar-pill">`;
  h += `<div class="ms-bar-track"><div class="ms-bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>`;
  h += `<div class="ms-bar-icons">`;
  icons.forEach(ic => {
    const active = pct >= ic.ms;
    const justReached = ic.ms > 0 && reached.includes(ic.ms);
    const isCrown = ic.ms === 100;
    const cls = [
      'ms-bar-icon',
      active ? 'active' : 'inactive',
      justReached ? 'bounce' : '',
      isCrown ? 'crown' : ''
    ].filter(Boolean).join(' ');
    h += `<div class="${cls}">`;
    h += `<span class="ms-bar-emoji">${ic.emoji}</span>`;
    h += `<span class="ms-bar-label">${ic.label}</span>`;
    h += `</div>`;
  });
  h += `</div></div></div>`;
  el.innerHTML = h;
}

// --- Stage Message ---
// --- 스테이지 메시지 타이핑 효과 ---
let _typingTimer = null;
let _typingInterval = null;
function startTypingLoop() {
  if (_typingTimer) return;
  function triggerTyping() {
    const msgEl = document.querySelector('.stage-msg');
    if (!msgEl || _typingInterval) return;
    const fullText = msgEl.textContent;
    msgEl.textContent = '';
    let i = 0;
    _typingInterval = setInterval(() => {
      if (i < fullText.length) {
        msgEl.textContent += fullText[i];
        i++;
      } else {
        clearInterval(_typingInterval);
        _typingInterval = null;
      }
    }, 50);
    _typingTimer = setTimeout(triggerTyping, 6000 + Math.random() * 4000);
  }
  _typingTimer = setTimeout(triggerTyping, 3000 + Math.random() * 2000);
}
function stopTypingLoop() {
  if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
  if (_typingInterval) { clearInterval(_typingInterval); _typingInterval = null; }
}

function renderStageMessage() {
  renderMilestoneBar();
  const el = $id('mainFriendActivity');
  if (!el) return;
  const goals = getAllGoals();
  const hasHabits = goals.some(g => g && g.title && migrateGoal(g).unit);
  if (!hasHabits) {
    el.innerHTML = `<div class="stage-msg-wrap"><div class="stage-msg">습관을 등록하고 요리 재료를 모아보자! 🍳</div></div>`;
    return;
  }
  const { total, done } = getMyTodayProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const sm = STAGE_MESSAGES.find(s => pct >= s.min && pct <= s.max) || STAGE_MESSAGES[0];
  // Build progress overlay (me + top friend)
  let meLabel = `오늘 (${done}/${total})`;
  if (pct === 0) meLabel += ' 🌙';
  else if (pct < 50) meLabel += ` <span class="prog-pct">${pct}%</span> 달성 중 🔥`;
  else if (pct < 100) meLabel += ` <span class="prog-pct">${pct}%</span> 달성 중 🔥`;
  else meLabel += ' <span class="prog-pct">올클리어!</span> 🎉';
  
  let progHTML = `<div class="progress-overlay"><span class="prog-me">${meLabel}</span>`;
  if (_friendActivityCache.length > 0) {
    const randIdx = Math.floor(Math.random() * _friendActivityCache.length);
    const top = _friendActivityCache[randIdx];
    const fLabel = top.todayCount > 0 
      ? `${top.emoji} ${top.nick}도 ${top.todayCount}개 완료` 
      : `${top.emoji} ${top.nick} 아직 시작 전`;
    progHTML += `<span class="prog-sep">·</span><span class="prog-friend" onclick="switchTab('friends')" style="cursor:pointer;">${fLabel}</span>`;
  }
  progHTML += `</div>`;
  el.innerHTML = progHTML + `<div class="stage-msg-wrap"><div class="stage-msg">${sm.msg}</div></div>`;
  startTypingLoop();
}

// --- Cooking Modal ---
function openCookingModal() {
  let overlay = $id('cookingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cookingOverlay';
    overlay.className = 'cooking-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) closeCookingModal(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = buildCookingModalHTML();
  requestAnimationFrame(() => overlay.classList.add('open'));
}
window.openCookingModal = openCookingModal;

function closeCookingModal() {
  const overlay = $id('cookingOverlay');
  if (overlay) { overlay.classList.remove('open'); setTimeout(() => { overlay.innerHTML = ''; }, 300); }
}
window.closeCookingModal = closeCookingModal;

function buildCookingModalHTML() {
  const ck = localDash.cooking;
  const sid = ck.currentScenarioId;
  const allCleared = sid >= 12;
  const clearedRecipes = (ck.clearedRecipes || []);
  let h = `<div class="cooking-modal">`;
  h += `<button class="cooking-close" onclick="closeCookingModal()">✕</button>`;
  h += `<div class="cooking-title">🍳 햄스터 주방</div>`;
  h += buildKitchenTab(ck, sid, allCleared);
  // Cleared recipes shelf
  h += `<div class="cooking-inv-divider">완성한 요리 ${clearedRecipes.length}/${RECIPES.length}</div>`;
  h += `<div class="cooking-shelf">`;
  RECIPES.forEach((r, i) => {
    const cleared = clearedRecipes.includes(i);
    h += `<div class="shelf-item ${cleared ? '' : 'shelf-locked'}">`;
    h += `<span class="shelf-emoji" style="${cleared ? '' : 'filter:blur(5px);opacity:.4;'}">${r.emoji}</span>`;
    h += `<span class="shelf-name">${cleared ? r.name : '❓❓'}</span>`;
    h += `</div>`;
  });
  h += `</div>`;
  h += `</div>`;
  return h;
}

window.switchCookingTab = function(tab) {
  const overlay = $id('cookingOverlay');
  if (overlay) overlay.innerHTML = buildCookingModalHTML();
};

function buildKitchenTab(ck, sid, allCleared) {
  let h = '';
  // Equation
  h += `<div class="cooking-equation">`;
  if (allCleared) {
    h += `<div class="cooking-complete">🎉 모든 요리를 완성했어요!</div>`;
    h += `<div class="cooking-complete-sub">총 ${RECIPES.length}종의 요리를 마스터했습니다</div>`;
  } else {
    const recipe = RECIPES[sid];
    const lvLabel = ['🟢 Lv.1','🟡 Lv.2','🟠 Lv.3','🔴 Lv.4'][recipe.lv - 1] || '';
    const preCanCook = recipe.ingredients.every(k => (ck.inventory[k] || 0) >= 1);
    const displayName = preCanCook ? `${recipe.emoji} ${recipe.name}` : '❓'.repeat(recipe.name.length);
    h += `<div class="cooking-lv">${lvLabel} — ${displayName}</div>`;
    h += `<div class="cooking-recipe-row">`;
    recipe.ingredients.forEach((key, i) => {
      const ing = INGREDIENTS[key];
      const has = (ck.inventory[key] || 0) >= 1;
      if (i > 0) h += `<span class="cooking-plus">+</span>`;
      h += `<div class="cooking-ing-slot ${has ? 'has' : 'missing'}">`;
      h += `<span class="cooking-ing-emoji">${ing.emoji}</span>`;
      h += `<span class="cooking-ing-name">${ing.name}</span>`;
      if (has) h += `<span class="cooking-ing-check">✓</span>`;
      h += `</div>`;
    });
    h += `<span class="cooking-equals">=</span>`;
    const canCook = recipe.ingredients.every(k => (ck.inventory[k] || 0) >= 1);
    h += `<div class="cooking-result-slot ${canCook ? 'ready' : 'locked'}">`;
    h += `<span class="cooking-result-emoji" style="${canCook ? '' : 'filter:blur(6px);opacity:.5;'}">${recipe.emoji}</span>`;
    h += `</div>`;
    h += `</div>`; // recipe-row
    // Cook button
    h += `<button class="cooking-btn ${canCook ? 'active' : 'disabled'}" ${canCook ? 'onclick="doCook()"' : 'disabled'}>`;
    h += canCook ? '🍳 요리하기' : '🔒 재료가 부족해요';
    h += `</button>`;
  }
  h += `</div>`; // equation
  // Inventory
  h += `<div class="cooking-inv-divider">내 재료</div>`;
  h += `<div class="cooking-inv">`;
  const visibleKeys = INGREDIENT_ORDER.filter(k => {
    const ing = INGREDIENTS[k];
    if (ing.type === 'normal') return true;
    return sid >= (ing.minLv || 0);
  });
  let hasAny = false;
  visibleKeys.forEach(k => {
    const qty = ck.inventory[k] || 0;
    if (qty > 0) hasAny = true;
    const ing = INGREDIENTS[k];
    const isSpecial = ing.type === 'special';
    h += `<div class="cooking-inv-item ${qty > 0 ? '' : 'empty'}">`;
    if (isSpecial && qty > 0) h += `<span class="cooking-inv-special">✨</span>`;
    h += `<span class="cooking-inv-emoji">${ing.emoji}</span>`;
    h += `<span class="cooking-inv-qty">${qty > 0 ? 'x' + qty : '-'}</span>`;
    h += `</div>`;
  });
  if (!hasAny && !allCleared) {
    h += `<div class="cooking-inv-empty">습관을 달성해서 재료를 모아보세요! 🐹</div>`;
  }
  h += `</div>`; // inv
  return h;
}



async function doCook() {
  const ck = localDash.cooking;
  const sid = ck.currentScenarioId;
  if (sid >= 12) return;
  const recipe = RECIPES[sid];
  // Verify ingredients
  if (!recipe.ingredients.every(k => (ck.inventory[k] || 0) >= 1)) return;
  // Deduct ingredients
  recipe.ingredients.forEach(k => { ck.inventory[k] = Math.max(0, (ck.inventory[k] || 0) - 1); });
  // Record clear
  if (!ck.clearedRecipes.includes(sid)) ck.clearedRecipes.push(sid);
  ck.currentScenarioId = sid + 1;
  await saveDash();
  // Play success animation
  showCookingSuccess(recipe, () => {
    // After animation, rebuild modal
    const overlay = $id('cookingOverlay');
    if (overlay && overlay.classList.contains('open')) {
      overlay.innerHTML = buildCookingModalHTML();
    }
  });
}
window.doCook = doCook;

function showCookingSuccess(recipe, callback) {
  const modal = document.querySelector('.cooking-modal');
  if (!modal) { if (callback) callback(); return; }
  // Overlay content with success animation
  const anim = document.createElement('div');
  anim.className = 'cooking-success-anim';
  anim.innerHTML = `
    <div class="cs-gather">
      ${recipe.ingredients.map(k => `<span class="cs-ing">${INGREDIENTS[k].emoji}</span>`).join('')}
    </div>
    <div class="cs-result">
      <span class="cs-result-emoji">${recipe.emoji}</span>
      <div class="cs-result-text">${recipe.emoji} ${recipe.name} 완성!</div>
    </div>
  `;
  modal.appendChild(anim);
  requestAnimationFrame(() => anim.classList.add('phase1'));
  setTimeout(() => anim.classList.add('phase2'), 600);
  setTimeout(() => {
    showConfettiSmall();
    triggerHaptic('heavy');
  }, 700);
  setTimeout(() => {
    anim.remove();
    if (callback) callback();
  }, 2800);
}

// --- FAB Button ---
function renderCookingFAB() {
  const section = document.querySelector('.avatar-section');
  if (!section) return;
  let fab = $id('cookingFab');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'cookingFab';
    fab.className = 'cooking-fab';
    fab.innerHTML = '🍳';
    fab.onclick = openCookingModal;
    section.style.position = 'relative';
    section.appendChild(fab);
  }
}

