// ── MOMENT PICK 확장 기능 ──

// ── 테마 토글 ──
function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ── 캘린더 ──
var calYear, calMonth;

function getCalData() {
  try { return JSON.parse(localStorage.getItem('mp_calendar') || '{}'); }
  catch(e) { return {}; }
}

function saveCalToday(missions, state) {
  var data = getCalData();
  var today = new Date();
  var key = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  var completed = missions.filter(function(m) { return state[String(m.id)] && state[String(m.id)].completed; });
  if (completed.length > 0) {
    data[key] = completed.map(function(m) { return m.icon + ' ' + m.name; });
    localStorage.setItem('mp_calendar', JSON.stringify(data));
  }
}

function openCalendar() {
  var now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
  document.getElementById('calModal').classList.add('show');
}

function closeCalendar() {
  document.getElementById('calModal').classList.remove('show');
}

function calPrevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }

function renderCalendar() {
  var data = getCalData();
  var now = new Date();
  document.getElementById('calMonthLabel').textContent = calYear + '년 ' + (calMonth+1) + '월';
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  var grid = document.getElementById('calGrid');
  var dayLabels = ['일','월','화','수','목','금','토'];
  var html = dayLabels.map(function(d) { return '<div class="cal-day-label">' + d + '</div>'; }).join('');
  for (var i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (var d = 1; d <= daysInMonth; d++) {
    var key = calYear + '-' + (calMonth+1) + '-' + d;
    var isToday = d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    var hasRecord = !!data[key];
    var cls = (isToday ? 'today ' : '') + (hasRecord ? 'has-record' : '');
    html += '<div class="cal-day ' + cls + '" onclick="showCalRecord(\'' + key + '\')">' + d + '</div>';
  }
  grid.innerHTML = html;
  document.getElementById('calRecord').style.display = 'none';
}

function showCalRecord(key) {
  var data = getCalData();
  var box = document.getElementById('calRecord');
  if (!data[key]) { box.style.display = 'none'; return; }
  var parts = key.split('-');
  box.style.display = 'block';
  box.innerHTML = '<h3>' + parts[0] + '년 ' + parts[1] + '월 ' + parts[2] + '일 완료 미션</h3>' +
    data[key].map(function(n) { return '<div class="cal-record-item">' + n + '</div>'; }).join('');
}

// ── 데일리 미션 ──
var ALL_POOL = [{"icon": "🌅", "name": "오늘의 첫 감정 기록", "desc": "아침에 눈 뜬 순간의 감정을 솔직하게 적어보세요", "type": "text", "placeholder": "오늘 아침 기분이 어떤가요?"}, {"icon": "🧃", "name": "수분 보충 인증", "desc": "물 한 잔 마시고 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "🌳", "name": "자연 사진 찍기", "desc": "오늘 본 하늘, 나무, 꽃 무엇이든 담아보세요", "type": "photo", "placeholder": ""}, {"icon": "📝", "name": "오늘 배운 것 한 줄", "desc": "오늘 새롭게 알게 된 사실을 기록해보세요", "type": "text", "placeholder": "오늘 처음 알게 된 것은..."}, {"icon": "🧸", "name": "나에게 응원 메시지", "desc": "지금의 나에게 따뜻한 한마디를 남겨보세요", "type": "text", "placeholder": "잘하고 있어, 왜냐하면..."}, {"icon": "🎧", "name": "지금 기분에 맞는 노래", "desc": "지금 듣고 싶은 곡 제목과 이유를 적어보세요", "type": "text", "placeholder": "지금 기분에 딱 맞는 노래는..."}, {"icon": "🚶", "name": "10분 산책 인증", "desc": "잠깐이라도 밖을 걷고 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "🍽️", "name": "오늘 먹은 것 기록", "desc": "오늘 가장 맛있었던 음식을 사진으로 남겨보세요", "type": "photo", "placeholder": ""}, {"icon": "💬", "name": "소중한 사람에게 연락", "desc": "오랜만에 생각난 사람에게 안부를 전해봤나요?", "type": "check", "placeholder": ""}, {"icon": "🌙", "name": "오늘 하루 세 줄 회고", "desc": "잘한 것, 아쉬운 것, 내일 할 것을 적어보세요", "type": "text", "placeholder": "잘한 것 / 아쉬운 것 / 내일 할 것"}, {"icon": "🎯", "name": "오늘의 집중 시간 선언", "desc": "오늘 가장 집중하고 싶은 일 하나를 적어보세요", "type": "text", "placeholder": "오늘 반드시 해낼 것은..."}, {"icon": "🖼️", "name": "오늘의 공간 사진", "desc": "지금 있는 공간을 그대로 찍어보세요", "type": "photo", "placeholder": ""}, {"icon": "🤲", "name": "오늘의 감사 한 줄", "desc": "작더라도 오늘 감사한 것 하나를 적어보세요", "type": "text", "placeholder": "오늘 작지만 감사했던 것은..."}, {"icon": "💤", "name": "7시간 수면 도전", "desc": "충분히 잤다면 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "🃏", "name": "오늘의 행운 카드", "desc": "1~100 사이의 행운 번호를 뽑아보세요", "type": "random", "placeholder": ""}, {"icon": "🌿", "name": "스트레칭 5분", "desc": "몸을 움직이고 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "📖", "name": "책 한 페이지 읽기", "desc": "짧더라도 오늘 읽은 내용을 기록해보세요", "type": "text", "placeholder": "오늘 읽은 책과 기억에 남는 문장은..."}, {"icon": "🎨", "name": "낙서 또는 드로잉", "desc": "뭔가를 그리고 사진으로 찍어 남겨보세요", "type": "photo", "placeholder": ""}, {"icon": "🏠", "name": "공간 정리 인증", "desc": "책상이든 방이든 한 곳을 정리하고 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "📸", "name": "지금 이 순간 포착", "desc": "지금 눈앞에 보이는 것을 사진으로 남겨보세요", "type": "photo", "placeholder": ""}, {"icon": "☀️", "name": "오늘의 날씨 감상", "desc": "오늘 날씨를 보며 느낀 감정을 적어보세요", "type": "text", "placeholder": "오늘 날씨가 주는 느낌은..."}, {"icon": "🧠", "name": "오늘 고민 해결하기", "desc": "요즘 고민 중인 것을 써보고 해결책을 찾아보세요", "type": "text", "placeholder": "고민 / 해결책"}, {"icon": "💃", "name": "오늘의 기분 점수", "desc": "오늘 기분을 1~10점으로 점수 매기고 이유를 적어보세요", "type": "text", "placeholder": "점수 / 이유"}, {"icon": "🌺", "name": "예쁜 것 찾기", "desc": "오늘 주변에서 아름다운 것을 사진으로 남겨보세요", "type": "photo", "placeholder": ""}, {"icon": "✨", "name": "오늘의 작은 성공", "desc": "오늘 이뤄낸 작은 성취를 기록해보세요", "type": "text", "placeholder": "오늘 내가 해낸 것은..."}, {"icon": "🎬", "name": "인상 깊은 장면 기록", "desc": "오늘 본 영상이나 영화의 인상 깊은 장면을 적어보세요", "type": "text", "placeholder": "장면과 그 이유는..."}, {"icon": "🛏️", "name": "일찍 자기 도전", "desc": "오늘은 평소보다 30분 일찍 자보기!", "type": "check", "placeholder": ""}, {"icon": "🧊", "name": "냉장고 정리", "desc": "냉장고를 한 번 정리하고 완료 체크!", "type": "check", "placeholder": ""}, {"icon": "🙏", "name": "감사 메시지 작성", "desc": "오늘 감사한 일 3가지를 적어보세요", "type": "text", "placeholder": "오늘 감사했던 일은..."}, {"icon": "💌", "name": "소중한 사람에게 편지", "desc": "그리운 사람에게 짧은 편지를 써보세요", "type": "text", "placeholder": "마음을 담아 편지를 써보세요..."}];

function getDailyMissions() {
  var today = new Date();
  var seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  function seededRand(s) { var x = Math.sin(s) * 10000; return x - Math.floor(x); }
  var indices = Array.from(Array(ALL_POOL.length).keys());
  indices.sort(function(a, b) { return seededRand(seed + a) - seededRand(seed + b); });
  return indices.slice(0, 5).map(function(i, idx) {
    var m = Object.assign({}, ALL_POOL[i]);
    m.id = idx + 100;
    m.minLength = ALL_POOL[i].type === 'text' ? 5 : 0;
    return m;
  });
}

// ── 초기화 ──
(function() {
  // 테마
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
  }

  // 데일리 미션
  var today = new Date();
  var todayKey = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  var savedKey = localStorage.getItem('mp_daily_date');
  if (savedKey !== todayKey) {
    var daily = getDailyMissions();
    window.MISSIONS = daily;
    window.state = {};
    daily.forEach(function(m) {
      window.state[String(m.id)] = {completed:false, expanded:false, value:'', lucky:null, fileName:''};
    });
    localStorage.setItem('mp_daily_date', todayKey);
    localStorage.setItem('mp_daily_missions', JSON.stringify(daily));
    localStorage.setItem('mp_daily_state', JSON.stringify(window.state));
  } else {
    var saved = localStorage.getItem('mp_daily_missions');
    var savedState = localStorage.getItem('mp_daily_state');
    if (saved) window.MISSIONS = JSON.parse(saved);
    if (savedState) window.state = JSON.parse(savedState);
  }
})();

// ════════════════════════════════════════
// ── 스트릭 ──
// ════════════════════════════════════════
function getStreak() {
  return parseInt(localStorage.getItem('mp_streak_count') || '0');
}

function updateStreak() {
  var today = new Date();
  var todayKey = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  var lastDate = localStorage.getItem('mp_streak_last_date');
  if (lastDate === todayKey) { updateStreakDisplay(); return; }
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var yKey = yesterday.getFullYear() + '-' + (yesterday.getMonth()+1) + '-' + yesterday.getDate();
  var streak = lastDate === yKey ? getStreak() + 1 : 1;
  localStorage.setItem('mp_streak_count', String(streak));
  localStorage.setItem('mp_streak_last_date', todayKey);
  updateStreakDisplay();
}

function updateStreakDisplay() {
  var el = document.getElementById('streakBadge');
  var s = getStreak();
  if (el) el.textContent = '🔥 ' + s + '일 연속';
}

// ════════════════════════════════════════
// ── 레벨 & 뱃지 ──
// ════════════════════════════════════════
// 레벨 이름은 XP 시스템의 getLevelName() 사용
var LEVELS = []; // 하위호환성용 빈 배열

function getTotalCompleted() {
  return parseInt(localStorage.getItem('mp_total_completed') || '0');
}

function addTotalCompleted() {
  var total = getTotalCompleted() + 1;
  localStorage.setItem('mp_total_completed', String(total));
  updateLevelDisplay();
  return total;
}

function getLevelTier(total) { return {name:'', icon:''}; } // 레거시 함수, 미사용

function updateLevelDisplay() {
  renderXPBar && renderXPBar();
}

// ════════════════════════════════════════
// ── 기분 기록 ──
// ════════════════════════════════════════
function openMoodPicker() {
  document.getElementById('moodModal').classList.add('show');
}
function closeMoodModal() {
  document.getElementById('moodModal').classList.remove('show');
}
function saveMood(mood) {
  var today = new Date();
  var key = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  localStorage.setItem('mp_mood_' + key, mood);
  closeMoodModal();
  if (typeof showToast === 'function') showToast('오늘의 기분이 기록됐어요 ' + mood);
}
function getTodayMood() {
  var today = new Date();
  var key = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
  return localStorage.getItem('mp_mood_' + key) || '';
}

// ════════════════════════════════════════
// ── 통계 ──
// ════════════════════════════════════════
function openStats() {
  renderStats();
  document.getElementById('statsModal').classList.add('show');
}
function closeStats() {
  document.getElementById('statsModal').classList.remove('show');
}
function renderStats() {
  var data = getCalData();
  var today = new Date();
  var days = ['일','월','화','수','목','금','토'];
  var weekData = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    weekData.push({ label: days[d.getDay()], count: data[key] ? data[key].length : 0 });
  }
  var maxCount = Math.max(1, Math.max.apply(null, weekData.map(function(d){ return d.count; })));
  var totalDays = Object.keys(data).length;
  var total = getTotalCompleted();
  var streak = getStreak();
  var lv = getLevel(total);
  var html = '<div class="stats-summary">' +
    '<div class="stat-card"><div class="stat-num">' + streak + '</div><div class="stat-lbl">🔥 연속</div></div>' +
    '<div class="stat-card"><div class="stat-num">' + totalDays + '</div><div class="stat-lbl">📅 활동일</div></div>' +
    '<div class="stat-card"><div class="stat-num">' + total + '</div><div class="stat-lbl">✅ 총 완료</div></div>' +
    '<div class="stat-card"><div class="stat-num">' + lv.icon + '</div><div class="stat-lbl">' + lv.name + '</div></div>' +
    '</div>' +
    '<div class="stats-chart-title">최근 7일 완료 미션</div>' +
    '<div class="stats-chart">' +
    weekData.map(function(d) {
      var h = Math.round((d.count / maxCount) * 100);
      return '<div class="stat-bar-wrap">' +
        '<div class="stat-bar-val">' + (d.count || '') + '</div>' +
        '<div class="stat-bar-outer"><div class="stat-bar-inner" style="height:' + h + '%"></div></div>' +
        '<div class="stat-bar-lbl">' + d.label + '</div></div>';
    }).join('') + '</div>';
  document.getElementById('statsContent').innerHTML = html;
}

// ════════════════════════════════════════
// ── 알림 ──
// ════════════════════════════════════════
function requestNotification() {
  if (!('Notification' in window)) { if(typeof showToast==='function') showToast('알림 미지원 브라우저예요', '#c97b4c'); return; }
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      localStorage.setItem('mp_notify', '1');
      if(typeof showToast==='function') showToast('알림이 설정됐어요! 🔔');
      scheduleNotification();
    } else {
      if(typeof showToast==='function') showToast('알림 권한이 거부됐어요', '#c97b4c');
    }
  });
}
function scheduleNotification() {
  var hour = 20;
  var now = new Date();
  var next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(function() {
    new Notification('MOMENT PICK ✨', { body: '오늘 미션을 완료해볼까요? 지금 바로 시작해보세요!', icon: '/static/logo-splash-192.png' });
    scheduleNotification();
  }, next - now);
}

// ════════════════════════════════════════
// ── 완료 카드 공유 ──
// ════════════════════════════════════════
function shareCard() {
  var canvas = document.createElement('canvas');
  canvas.width = 800; canvas.height = 900;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, 800, 900);
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 764, 864);
  ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('MOMENT PICK', 400, 90);
  var today = new Date();
  ctx.fillStyle = '#888'; ctx.font = '22px sans-serif';
  ctx.fillText(today.getFullYear() + '년 ' + (today.getMonth()+1) + '월 ' + today.getDate() + '일', 400, 135);
  ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
  ctx.fillText('✨ 오늘의 완료 미션', 400, 195);
  ctx.beginPath(); ctx.moveTo(60, 215); ctx.lineTo(740, 215);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
  var completed = (window.MISSIONS || []).filter(function(m) {
    return window.state && window.state[String(m.id)] && window.state[String(m.id)].completed;
  });
  ctx.textAlign = 'left';
  completed.forEach(function(m, i) {
    ctx.fillStyle = '#c9a84c'; ctx.font = '30px sans-serif';
    ctx.fillText(m.icon, 70, 275 + i * 75);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif';
    ctx.fillText(m.name, 120, 275 + i * 75);
  });
  var mood = getTodayMood();
  if (mood) { ctx.textAlign='center'; ctx.font='36px sans-serif'; ctx.fillText('오늘의 기분: ' + mood, 400, 830); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#444'; ctx.font = '18px sans-serif';
  ctx.fillText('momentpick.site', 400, 870);
  canvas.toBlob(function(blob) {
    var file = new File([blob], 'moment-pick.png', {type:'image/png'});
    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
      navigator.share({ title:'MOMENT PICK', text:'오늘의 미션을 완료했어요! ✨', files:[file] }).catch(function(){});
    } else {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'moment-pick.png'; a.click();
      URL.revokeObjectURL(url);
    }
  });
}

// ════════════════════════════════════════
// ── 루틴 미션 ──
// ════════════════════════════════════════
function getRoutines() {
  try { return JSON.parse(localStorage.getItem('mp_routines') || '[]'); } catch(e) { return []; }
}
function saveRoutines(r) { localStorage.setItem('mp_routines', JSON.stringify(r)); }

function openRoutine() { renderRoutines(); document.getElementById('routineModal').classList.add('show'); }
function closeRoutine() { document.getElementById('routineModal').classList.remove('show'); }

function renderRoutines() {
  var routines = getRoutines();
  var box = document.getElementById('routineList');
  if (!box) return;
  if (!routines.length) {
    box.innerHTML = '<div style="text-align:center;color:#888;padding:24px 0">아직 루틴 미션이 없어요!<br>아래에서 추가해보세요 😊</div>';
    return;
  }
  box.innerHTML = routines.map(function(r, i) {
    return '<div class="routine-item"><span>' + r.icon + ' ' + r.name + '</span>' +
      '<button onclick="deleteRoutine(' + i + ')">✕</button></div>';
  }).join('');
}

function addRoutine() {
  var name = document.getElementById('routineName').value.trim();
  if (!name) { if(typeof showToast==='function') showToast('루틴 이름을 입력해주세요', '#c97b4c'); return; }
  var icon = document.getElementById('routineIcon').value || '🔄';
  var routines = getRoutines();
  routines.push({icon:icon, name:name, type:'check', desc:'나만의 루틴 미션', placeholder:''});
  saveRoutines(routines);
  document.getElementById('routineName').value = '';
  renderRoutines();
  loadRoutinesToday();
  if(typeof renderMissions==='function') renderMissions();
  if(typeof showToast==='function') showToast('루틴 미션이 추가됐어요! 🔄');
}

function deleteRoutine(idx) {
  var routines = getRoutines();
  routines.splice(idx, 1);
  saveRoutines(routines);
  renderRoutines();
}

function loadRoutinesToday() {
  var routines = getRoutines();
  if (!routines.length) return;
  var startId = 200;
  routines.forEach(function(r, i) {
    var rid = startId + i;
    if (!(window.MISSIONS || []).find(function(m){ return m.id === rid; })) {
      var m = Object.assign({}, r);
      m.id = rid; m.minLength = 0;
      (window.MISSIONS || MISSIONS).push(m);
      if (!window.state) window.state = {};
      window.state[String(rid)] = {completed:false, expanded:false, value:'', lucky:null, fileName:''};
    }
  });
}

// ════════════════════════════════════════
// ── 온보딩 ──
// ════════════════════════════════════════
var _onboardStep = 0;
var _onboardTotal = 4;

function checkOnboarding() {
  if (!localStorage.getItem('mp_onboarded')) {
    _onboardStep = 0;
    showOnboardSlide(0);
    document.getElementById('onboardingOverlay').classList.add('show');
  }
}

function showOnboardSlide(idx) {
  document.querySelectorAll('.onboard-slide').forEach(function(el, i) {
    el.style.display = i === idx ? 'flex' : 'none';
  });
  document.getElementById('onboardDot').textContent = (idx + 1) + ' / ' + _onboardTotal;
}

function nextOnboard() {
  _onboardStep++;
  if (_onboardStep >= _onboardTotal) {
    localStorage.setItem('mp_onboarded', '1');
    document.getElementById('onboardingOverlay').classList.remove('show');
    return;
  }
  showOnboardSlide(_onboardStep);
}

function skipOnboard() {
  localStorage.setItem('mp_onboarded', '1');
  document.getElementById('onboardingOverlay').classList.remove('show');
}

// ── 초기화에 새 기능 추가 ──
document.addEventListener('DOMContentLoaded', function() {
  updateStreakDisplay();
  updateLevelDisplay();
  if (localStorage.getItem('mp_notify') === '1') scheduleNotification();
  loadRoutinesToday();
  setTimeout(checkOnboarding, 800);
});

// ════════════════════════════════════════
// ── 로그인 시스템 ──
// ════════════════════════════════════════
var _authMode = 'login';
var _authToken = localStorage.getItem('mp_token') || '';
var _authUsername = localStorage.getItem('mp_username') || '';

function getAuthHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _authToken };
}

function switchAuthTab(mode) {
  _authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? '✦ 로그인' : '✦ 회원가입';
  document.getElementById('authError').classList.remove('show');
}

function showAuthError(msg) {
  var el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.add('show');
}

async function submitAuth() {
  var username = document.getElementById('authUsername').value.trim();
  var password = document.getElementById('authPassword').value;
  var btn = document.getElementById('authSubmitBtn');

  if (!username || !password) { showAuthError('아이디와 비밀번호를 입력해주세요'); return; }

  btn.disabled = true;
  btn.textContent = '처리 중...';
  document.getElementById('authError').classList.remove('show');

  try {
    var endpoint = _authMode === 'login' ? '/api/login' : '/api/register';
    var res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    var data = await res.json();

    if (data.success) {
      _authToken = data.token;
      _authUsername = data.username;
      localStorage.setItem('mp_token', _authToken);
      localStorage.setItem('mp_username', _authUsername);
      document.getElementById('authOverlay').classList.add('hidden');
      updateUserBar();
      await syncUserData();
    } else {
      showAuthError(data.message || '오류가 발생했어요');
    }
  } catch(e) {
    showAuthError('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요');
  }

  btn.disabled = false;
  btn.textContent = _authMode === 'login' ? '✦ 로그인' : '✦ 회원가입';
}

function updateUserBar() {
  var badge = document.getElementById('userNameBadge');
  var btn = document.getElementById('logoutBtn');
  if (_authUsername && badge) {
    badge.textContent = '👤 ' + _authUsername;
    if (btn) btn.style.display = 'inline-block';
  }
}

function logout() {
  if (!confirm('로그아웃 하시겠어요?')) return;
  _authToken = '';
  _authUsername = '';
  localStorage.removeItem('mp_token');
  localStorage.removeItem('mp_username');
  localStorage.removeItem('mp_guest_mode');
  document.getElementById('authOverlay').classList.remove('hidden');
  document.getElementById('userNameBadge').textContent = '';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('guestModeBar').style.display = 'none';
  document.getElementById('authUsername').value = '';
  document.getElementById('authPassword').value = '';
}

// ── 서버 데이터 동기화 ──
async function syncUserData() {
  if (!_authToken) return;
  try {
    var res = await fetch('/api/userdata', { headers: getAuthHeaders() });
    if (res.status === 401) { logout(); return; }
    var json = await res.json();
    if (!json.success || !json.data) return;
    var d = json.data;

    // localStorage에 덮어씌우기
    if (d.streak_count != null) localStorage.setItem('mp_streak_count', String(d.streak_count));
    if (d.streak_last_date) localStorage.setItem('mp_streak_last_date', d.streak_last_date);
    if (d.total_completed != null) localStorage.setItem('mp_total_completed', String(d.total_completed));
    if (d.calendar) localStorage.setItem('mp_calendar', JSON.stringify(d.calendar));
    if (d.routines) localStorage.setItem('mp_routines', JSON.stringify(d.routines));
    if (d.custom_missions) localStorage.setItem('mp_custom_missions', JSON.stringify(d.custom_missions));
    if (d.daily_date) localStorage.setItem('mp_daily_date', d.daily_date);
    if (d.daily_missions) localStorage.setItem('mp_daily_missions', JSON.stringify(d.daily_missions));
    if (d.daily_state) localStorage.setItem('mp_daily_state', JSON.stringify(d.daily_state));

    updateStreakDisplay();
    updateLevelDisplay();
    if (typeof renderMissions === 'function') renderMissions();
  } catch(e) {}
}

async function pushUserData() {
  if (!_authToken) return;
  try {
    var calRaw = localStorage.getItem('mp_calendar');
    var routinesRaw = localStorage.getItem('mp_routines');
    var customRaw = localStorage.getItem('mp_custom_missions');
    var dailyMissionsRaw = localStorage.getItem('mp_daily_missions');
    var dailyStateRaw = localStorage.getItem('mp_daily_state');

    await fetch('/api/userdata', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        streak_count: parseInt(localStorage.getItem('mp_streak_count') || '0'),
        streak_last_date: localStorage.getItem('mp_streak_last_date') || '',
        total_completed: parseInt(localStorage.getItem('mp_total_completed') || '0'),
        calendar: calRaw ? JSON.parse(calRaw) : {},
        routines: routinesRaw ? JSON.parse(routinesRaw) : [],
        custom_missions: customRaw ? JSON.parse(customRaw) : [],
        daily_date: localStorage.getItem('mp_daily_date') || '',
        daily_missions: dailyMissionsRaw ? JSON.parse(dailyMissionsRaw) : [],
        daily_state: dailyStateRaw ? JSON.parse(dailyStateRaw) : {}
      })
    });
  } catch(e) {}
}

// ── 로그인 화면 초기화 ──
// ── 게스트 모드 ──
function tryGuest() {
  document.getElementById('guestWarnOverlay').classList.add('show');
}

function confirmGuest() {
  localStorage.setItem('mp_guest_mode', '1');
  document.getElementById('guestWarnOverlay').classList.remove('show');
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('guestModeBar').style.display = 'block';
}

function cancelGuest() {
  document.getElementById('guestWarnOverlay').classList.remove('show');
}

function showAuthOverlay() {
  document.getElementById('authOverlay').classList.remove('hidden');
  document.getElementById('guestWarnOverlay').classList.remove('show');
}

(function initAuth() {
  // 엔터키로 제출
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !document.getElementById('authOverlay').classList.contains('hidden')) {
      submitAuth();
    }
  });

  if (_authToken && _authUsername) {
    // 로그인 상태
    document.getElementById('authOverlay').classList.add('hidden');
    updateUserBar();
    syncUserData();
  } else if (localStorage.getItem('mp_guest_mode') === '1') {
    // 게스트 모드
    document.getElementById('authOverlay').classList.add('hidden');
    document.getElementById('guestModeBar').style.display = 'block';
  }
  // 둘 다 아니면 로그인 화면 표시
})();

// ════════════════════════════════════════
// ── 오늘의 명언 ──
// ════════════════════════════════════════
var QUOTES = [
  {t:"작은 것들이 모여 위대한 것을 이룬다.", a:"빈센트 반 고흐"},
  {t:"시작이 반이다.", a:"아리스토텔레스"},
  {t:"오늘 할 수 있는 일을 내일로 미루지 마라.", a:"벤자민 프랭클린"},
  {t:"자신을 믿어라. 당신이 생각하는 것보다 훨씬 강하다.", a:"테오도어 루즈벨트"},
  {t:"성공은 매일의 작은 노력들이 반복된 결과다.", a:"로버트 콜리어"},
  {t:"행복은 습관이다. 그것을 몸에 지녀라.", a:"허버트 새뮤얼"},
  {t:"당신이 포기하지 않는 한 실패는 없다.", a:"토니 로빈스"},
  {t:"꿈을 꾸는 것을 두려워하지 마라. 꿈을 이루는 것을 두려워하라.", a:"작자 미상"},
  {t:"하루하루가 새로운 기회다.", a:"작자 미상"},
  {t:"변화는 불편함에서 시작된다.", a:"작자 미상"},
  {t:"완벽함보다 진정성이 중요하다.", a:"브레네 브라운"},
  {t:"지금 이 순간이 당신이 가진 전부다.", a:"오프라 윈프리"},
  {t:"실패는 성공의 어머니다.", a:"토마스 에디슨"},
  {t:"천리 길도 한 걸음부터.", a:"노자"},
  {t:"자신을 사랑하는 것이 평생의 로맨스의 시작이다.", a:"오스카 와일드"},
  {t:"인생에서 가장 중요한 것은 무엇을 아는가가 아니라 누구를 아는가도 아니다. 자신이 무엇인가이다.", a:"작자 미상"},
  {t:"지금 당장 완벽하지 않아도 괜찮다. 그것이 바로 성장이 존재하는 이유다.", a:"작자 미상"},
  {t:"어제보다 오늘 조금 더 나은 사람이 되어라.", a:"작자 미상"},
  {t:"당신의 에너지는 당신의 의도를 따른다.", a:"작자 미상"},
  {t:"삶은 당신이 만들어가는 것이다. 항상 그래왔고, 항상 그럴 것이다.", a:"엘리너 루즈벨트"},
  {t:"포기하지 않으면 진 것이 아니다.", a:"작자 미상"},
  {t:"좋은 하루를 기다리지 말고, 좋은 하루를 만들어라.", a:"작자 미상"},
  {t:"모든 위대한 여정은 첫 발걸음으로 시작된다.", a:"작자 미상"},
  {t:"당신이 집중하는 곳에 에너지가 흐른다.", a:"작자 미상"},
  {t:"오늘의 나는 내가 어제 한 일들의 결과다.", a:"작자 미상"},
  {t:"두려움은 목적지가 아니라 통과해야 할 관문이다.", a:"작자 미상"},
  {t:"기회는 찾는 사람에게만 온다.", a:"작자 미상"},
  {t:"작은 진전도 여전히 진전이다.", a:"작자 미상"},
  {t:"나는 할 수 있다. 나는 할 것이다.", a:"작자 미상"},
  {t:"매일이 새로운 시작이다.", a:"작자 미상"},
];

function initQuote() {
  var today = new Date();
  var seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  var q = QUOTES[seed % QUOTES.length];
  var el = document.getElementById('quoteText');
  var au = document.getElementById('quoteAuthor');
  if (el) el.textContent = '"' + q.t + '"';
  if (au) au.textContent = '— ' + q.a;
}

// ════════════════════════════════════════
// ── 미션 카테고리 & 난이도 ──
// ════════════════════════════════════════
var CATEGORIES = [
  {id:'all', label:'전체', emoji:'✨'},
  {id:'health', label:'건강', emoji:'💪'},
  {id:'mind', label:'마음', emoji:'🧘'},
  {id:'creative', label:'창의', emoji:'🎨'},
  {id:'relation', label:'관계', emoji:'💬'},
  {id:'growth', label:'성장', emoji:'📚'},
  {id:'daily', label:'일상', emoji:'🏠'},
];
var _activeCat = 'all';

function initCatFilter() {
  var wrap = document.getElementById('catFilter');
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(function(c) {
    return '<button class="cat-btn' + (c.id === _activeCat ? ' active' : '') + '" onclick="setCat(\'' + c.id + '\')">' + c.emoji + ' ' + c.label + '</button>';
  }).join('');
}

function setCat(id) {
  _activeCat = id;
  initCatFilter();
  if (typeof renderMissions === 'function') renderMissions();
}

function getFilteredMissions() {
  if (_activeCat === 'all') return window.MISSIONS || MISSIONS;
  return (window.MISSIONS || MISSIONS).filter(function(m) {
    return !m.category || m.category === _activeCat;
  });
}

function getDiffLabel(diff) {
  if (!diff || diff === 1) return '';
  if (diff === 2) return '<span class="diff-badge diff-2">보통</span>';
  if (diff === 3) return '<span class="diff-badge diff-3">어려움</span>';
  return '';
}

// ════════════════════════════════════════
// ── 테마 컬러 ──
// ════════════════════════════════════════
var THEMES = [
  {id:'gold',   label:'골드',   color:'#c9a84c'},
  {id:'purple', label:'퍼플',   color:'#a78bfa'},
  {id:'blue',   label:'블루',   color:'#60a5fa'},
  {id:'green',  label:'그린',   color:'#34d399'},
  {id:'pink',   label:'핑크',   color:'#f472b6'},
  {id:'coral',  label:'코랄',   color:'#fb923c'},
];

function openThemeModal() {
  renderThemeGrid();
  document.getElementById('themeModal').classList.add('show');
}
function closeThemeModal() {
  document.getElementById('themeModal').classList.remove('show');
}

function renderThemeGrid() {
  var cur = localStorage.getItem('mp_theme_color') || 'gold';
  var grid = document.getElementById('themeGrid');
  if (!grid) return;
  grid.innerHTML = THEMES.map(function(t) {
    return '<div class="theme-option' + (t.id === cur ? ' active' : '') + '" onclick="applyTheme(\'' + t.id + '\')">' +
      '<div class="theme-dot" style="background:' + t.color + '"></div>' +
      '<span>' + t.label + '</span></div>';
  }).join('');
}

function applyTheme(id) {
  THEMES.forEach(function(t) { document.body.classList.remove('theme-' + t.id); });
  if (id !== 'gold') document.body.classList.add('theme-' + id);
  localStorage.setItem('mp_theme_color', id);
  renderThemeGrid();
  if (typeof showToast === 'function') showToast('테마가 변경됐어요 🎨');
}

function initTheme() {
  var saved = localStorage.getItem('mp_theme_color') || 'gold';
  if (saved !== 'gold') document.body.classList.add('theme-' + saved);
}

// ════════════════════════════════════════
// ── 파티클 효과 ──
// ════════════════════════════════════════
var _particles = [];
var _particleRAF = null;

function spawnParticles(x, y) {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var colors = ['#c9a84c','#e8c96a','#ffffff','#ffd700','#fffacd','#ffec8b'];
  // 테마 색상 반영
  var themeId = localStorage.getItem('mp_theme_color') || 'gold';
  var found = THEMES.find(function(t){ return t.id === themeId; });
  if (found) colors[0] = found.color;

  for (var i = 0; i < 60; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 3 + Math.random() * 6;
    _particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.02,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'circle' : 'star'
    });
  }
  if (!_particleRAF) animateParticles();
}

function animateParticles() {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  _particles = _particles.filter(function(p) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= p.decay;
    if (p.life <= 0) return false;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2); ctx.fill();
    } else {
      drawStar(ctx, p.x, p.y, p.size/2);
    }
    return true;
  });

  ctx.globalAlpha = 1;
  if (_particles.length > 0) {
    _particleRAF = requestAnimationFrame(animateParticles);
  } else {
    _particleRAF = null;
  }
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (var i = 0; i < 5; i++) {
    var a = (i * 4 * Math.PI / 5) - Math.PI/2;
    var b = ((i * 4 + 2) * Math.PI / 5) - Math.PI/2;
    if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
    else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    ctx.lineTo(x + (r*0.4) * Math.cos(b), y + (r*0.4) * Math.sin(b));
  }
  ctx.closePath(); ctx.fill();
}

// completeMission 완료 시 파티클 트리거 (글로벌로 노출)
window.triggerParticle = function(buttonEl) {
  if (!buttonEl) { spawnParticles(window.innerWidth/2, window.innerHeight/2); return; }
  var rect = buttonEl.getBoundingClientRect();
  spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
};

// ════════════════════════════════════════
// ── 친구 시스템 ──
// ════════════════════════════════════════
var _myFriendCode = '';

function openFriendModal() {
  document.getElementById('friendModal').classList.add('show');
  loadFriendCode();
  renderFriendList();
}
function closeFriendModal() {
  document.getElementById('friendModal').classList.remove('show');
}

async function loadFriendCode() {
  var el = document.getElementById('myFriendCode');
  if (!el) return;
  // 로그인 상태면 서버에서 가져오기
  if (window._authToken) {
    try {
      var res = await fetch('/api/myfriendcode', { headers: { 'Authorization': 'Bearer ' + window._authToken } });
      var data = await res.json();
      if (data.success) { _myFriendCode = data.code; el.textContent = data.code; return; }
    } catch(e) {}
  }
  // 게스트: username 기반 코드
  var code = localStorage.getItem('mp_friend_code');
  if (!code) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code = '';
    for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    localStorage.setItem('mp_friend_code', code);
  }
  _myFriendCode = code;
  el.textContent = code;
}

function copyFriendCode() {
  if (!_myFriendCode) return;
  navigator.clipboard.writeText(_myFriendCode).then(function() {
    if (typeof showToast === 'function') showToast('친구 코드가 복사됐어요! 🎉');
  });
}

async function addFriend() {
  var input = document.getElementById('friendCodeInput');
  var code = input.value.trim().toUpperCase();
  if (code.length !== 6) { if(typeof showToast==='function') showToast('6자리 코드를 입력해주세요', '#c97b4c'); return; }
  if (code === _myFriendCode) { if(typeof showToast==='function') showToast('내 코드는 추가할 수 없어요 😅', '#c97b4c'); return; }

  var friends = getFriends();
  if (friends.find(function(f){ return f.code === code; })) {
    if(typeof showToast==='function') showToast('이미 추가된 친구예요', '#c97b4c'); return;
  }

  // 서버에서 친구 정보 조회
  try {
    var res = await fetch('/api/friend/' + code);
    var data = await res.json();
    if (!data.success) { if(typeof showToast==='function') showToast(data.message || '친구를 찾을 수 없어요', '#c97b4c'); return; }
    friends.push({ code: code, username: data.username, streak: data.streak, total: data.total, updated: Date.now() });
    saveFriends(friends);
    input.value = '';
    renderFriendList();
    if(typeof showToast==='function') showToast(data.username + ' 님을 추가했어요! 👥');
  } catch(e) {
    if(typeof showToast==='function') showToast('서버에 연결할 수 없어요', '#c97b4c');
  }
}

function getFriends() {
  try { return JSON.parse(localStorage.getItem('mp_friends') || '[]'); } catch(e) { return []; }
}
function saveFriends(f) { localStorage.setItem('mp_friends', JSON.stringify(f)); }

function removeFriend(code) {
  saveFriends(getFriends().filter(function(f){ return f.code !== code; }));
  renderFriendList();
}

function renderFriendList() {
  var friends = getFriends();
  var box = document.getElementById('friendList');
  if (!box) return;
  if (!friends.length) {
    box.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:13px">아직 친구가 없어요<br>코드를 공유해서 친구를 추가해보세요 😊</div>';
    return;
  }
  box.innerHTML = friends.map(function(f) {
    return '<div class="friend-item">' +
      '<div class="friend-avatar">👤</div>' +
      '<div class="friend-info">' +
        '<div class="friend-name">' + f.username + '</div>' +
        '<div class="friend-stats">🔥 ' + f.streak + '일 연속 · ✅ ' + f.total + '개 완료</div>' +
      '</div>' +
      '<button class="friend-remove" onclick="removeFriend(\'' + f.code + '\')">✕</button>' +
      '</div>';
  }).join('');
}

// ── 전체 초기화 ──
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initQuote();
  initCatFilter();
});

// ════════════════════════════════════════
// ── 효과음 시스템 ──
// ════════════════════════════════════════
var _sfxCtx = null;

function getSfxCtx() {
  if (!_sfxCtx) _sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _sfxCtx;
}

// 효과음 목록
var SFX_LIST = [
  {
    id: 'chime',
    name: '맑은 차임',
    desc: '청명한 벨 소리',
    icon: '🔔',
    play: function() {
      var ctx = getSfxCtx();
      [523.25, 659.25, 783.99].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        var t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.3);
      });
    }
  },
  {
    id: 'piano',
    name: '피아노 화음',
    desc: '따뜻한 피아노 코드',
    icon: '🎹',
    play: function() {
      var ctx = getSfxCtx();
      [261.63, 329.63, 392.00, 523.25].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var osc2 = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = freq;
        osc2.type = 'sine'; osc2.frequency.value = freq * 2;
        var g2 = ctx.createGain(); g2.gain.value = 0.3;
        var t = ctx.currentTime + i * 0.05;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(gain); osc2.connect(g2); g2.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.6);
        osc2.start(t); osc2.stop(t + 1.6);
      });
    }
  },
  {
    id: 'star',
    name: '별똥별',
    desc: '반짝이는 상승 효과',
    icon: '🌟',
    play: function() {
      var ctx = getSfxCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.9);
      // 하이햇 느낌의 노이즈
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      var noise = ctx.createBufferSource();
      var ng = ctx.createGain();
      noise.buffer = buf;
      ng.gain.setValueAtTime(0.3, ctx.currentTime + 0.35);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      noise.connect(ng); ng.connect(ctx.destination);
      noise.start(ctx.currentTime + 0.35);
    }
  },
  {
    id: 'fanfare',
    name: '팡파르',
    desc: '작은 승리의 팡파르',
    icon: '🏆',
    play: function() {
      var ctx = getSfxCtx();
      var melody = [392, 523, 659, 784, 659, 784];
      var times  = [0, 0.1, 0.2, 0.3, 0.45, 0.55];
      melody.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        var t = ctx.currentTime + times[i];
        var dur = i === melody.length-1 ? 0.6 : 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        // 로우패스 필터로 부드럽게
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass'; filt.frequency.value = 1800;
        osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + dur + 0.05);
      });
    }
  },
  {
    id: 'retro',
    name: '레트로',
    desc: '레트로 게임 효과음',
    icon: '🎮',
    play: function() {
      var ctx = getSfxCtx();
      var seq = [220, 330, 440, 660, 880];
      seq.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = freq;
        var t = ctx.currentTime + i * 0.07;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.setValueAtTime(0, t + 0.06);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.07);
      });
    }
  },
  {
    id: 'water',
    name: '물방울',
    desc: '청량한 물방울 소리',
    icon: '💧',
    play: function() {
      var ctx = getSfxCtx();
      [800, 1000, 1200, 900].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        var t = ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.12);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.25);
      });
    }
  },
  {
    id: 'magic',
    name: '마법',
    desc: '신비로운 마법 효과',
    icon: '✨',
    play: function() {
      var ctx = getSfxCtx();
      for (var i = 0; i < 8; i++) {
        (function(idx) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          var freq = 400 + Math.random() * 800;
          osc.type = 'sine'; osc.frequency.value = freq;
          var t = ctx.currentTime + idx * 0.06 + Math.random() * 0.03;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.45);
        })(i);
      }
    }
  },
  {
    id: 'soft',
    name: '부드러운 알림',
    desc: '조용한 소프트 알림',
    icon: '🌙',
    play: function() {
      var ctx = getSfxCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 528;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.1);
    }
  },
];

function getCurrentSfx() {
  var id = localStorage.getItem('mp_sfx') || 'chime';
  return SFX_LIST.find(function(s){ return s.id === id; }) || SFX_LIST[0];
}

function isSfxEnabled() {
  return localStorage.getItem('mp_sfx_enabled') !== '0';
}

// 미션 완료 시 호출
window.playSfx = function() {
  if (!isSfxEnabled()) return;
  try { getCurrentSfx().play(); } catch(e) {}
};

// ── 설정 모달 ──
function openSettingsModal() {
  renderSfxGrid();
  var toggle = document.getElementById('sfxToggle');
  if (toggle) toggle.checked = isSfxEnabled();
  var section = document.getElementById('sfxPickerSection');
  if (section) section.style.display = isSfxEnabled() ? '' : 'none';
  document.getElementById('settingsModal').classList.add('show');
}
function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('show');
}

function toggleSfx(enabled) {
  localStorage.setItem('mp_sfx_enabled', enabled ? '1' : '0');
  var section = document.getElementById('sfxPickerSection');
  if (section) section.style.display = enabled ? '' : 'none';
  if (enabled) { try { getCurrentSfx().play(); } catch(e) {} }
}

function renderSfxGrid() {
  var cur = localStorage.getItem('mp_sfx') || 'chime';
  var grid = document.getElementById('sfxGrid');
  if (!grid) return;
  grid.innerHTML = SFX_LIST.map(function(s) {
    return '<div class="sfx-card' + (s.id === cur ? ' active' : '') + '" onclick="selectSfx(\'' + s.id + '\')">' +
      '<span class="sfx-icon">' + s.icon + '</span>' +
      '<div class="sfx-info"><h4>' + s.name + '</h4><p>' + s.desc + '</p></div>' +
      '<button class="sfx-preview" onclick="event.stopPropagation();previewSfx(\'' + s.id + '\')">▶</button>' +
      '</div>';
  }).join('');
}

function selectSfx(id) {
  localStorage.setItem('mp_sfx', id);
  renderSfxGrid();
  try {
    SFX_LIST.find(function(s){ return s.id === id; }).play();
  } catch(e) {}
  if (typeof showToast === 'function') showToast('효과음이 변경됐어요 🎵');
}

function previewSfx(id) {
  try { SFX_LIST.find(function(s){ return s.id === id; }).play(); } catch(e) {}
}

// ════════════════════════════════════════
// ── 도전 과제 (업적) ──
// ════════════════════════════════════════
var ACHIEVEMENTS = [
  {id:'first',    icon:'🌱', name:'첫 발걸음',      desc:'처음으로 미션을 완료',    check: function(s){ return s.total>=1; }},
  {id:'total10',  icon:'💪', name:'10개 돌파',       desc:'총 10개 미션 완료',       check: function(s){ return s.total>=10; }},
  {id:'total50',  icon:'🏆', name:'미션 달인',       desc:'총 50개 미션 완료',       check: function(s){ return s.total>=50; }},
  {id:'total100', icon:'👑', name:'레전드',          desc:'총 100개 미션 완료',      check: function(s){ return s.total>=100; }},
  {id:'streak3',  icon:'🔥', name:'3일 연속',        desc:'3일 연속 미션 완료',      check: function(s){ return s.streak>=3; }},
  {id:'streak7',  icon:'⭐', name:'일주일의 기적',   desc:'7일 연속 미션 완료',      check: function(s){ return s.streak>=7; }},
  {id:'streak30', icon:'🌙', name:'한 달의 습관',    desc:'30일 연속 미션 완료',     check: function(s){ return s.streak>=30; }},
  {id:'goal1',    icon:'🎯', name:'목표 달성자',     desc:'일일 목표 첫 달성',       check: function(s){ return s.goalAchieved>=1; }},
  {id:'goal10',   icon:'🎖️', name:'목표 전문가',    desc:'일일 목표 10회 달성',     check: function(s){ return s.goalAchieved>=10; }},
  {id:'mood10',   icon:'😊', name:'감정 기록가',     desc:'기분을 10번 기록',        check: function(s){ return s.moodCount>=10; }},
  {id:'focus5',   icon:'🔒', name:'집중의 달인',     desc:'집중 모드 5회 완료',      check: function(s){ return s.focusCount>=5; }},
  {id:'early',    icon:'🌅', name:'아침형 인간',     desc:'오전 7시 이전 미션 완료', check: function(s){ return s.earlyBird; }},
  {id:'night',    icon:'🦉', name:'밤의 올빼미',     desc:'자정 이후 미션 완료',     check: function(s){ return s.nightOwl; }},
  {id:'routine5', icon:'🔄', name:'루틴 마스터',     desc:'루틴 미션 5개 추가',      check: function(s){ return s.routines>=5; }},
  {id:'allcat',   icon:'🌈', name:'전방위 활동가',   desc:'모든 카테고리 완료',      check: function(s){ return s.cats>=5; }},
];

function getAchieveStats() {
  var now = new Date();
  var h = now.getHours();
  var calData = getCalData ? getCalData() : {};
  var moodCount = 0;
  for (var i = 0; i < 365; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var k = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if (localStorage.getItem('mp_mood_'+k)) moodCount++;
  }
  return {
    total:   parseInt(localStorage.getItem('mp_total_completed')||'0'),
    streak:  parseInt(localStorage.getItem('mp_streak_count')||'0'),
    goalAchieved: parseInt(localStorage.getItem('mp_goal_achieved')||'0'),
    focusCount:   parseInt(localStorage.getItem('mp_focus_count')||'0'),
    moodCount:    moodCount,
    earlyBird: localStorage.getItem('mp_early_bird')==='1',
    nightOwl:  localStorage.getItem('mp_night_owl')==='1',
    routines:  (getRoutines ? getRoutines().length : 0),
    cats:      parseInt(localStorage.getItem('mp_cats_used')||'0'),
  };
}

function getUnlockedAchievements() {
  try { return JSON.parse(localStorage.getItem('mp_achievements')||'[]'); } catch(e) { return []; }
}

function checkAchievements() {
  var stats = getAchieveStats();
  var unlocked = getUnlockedAchievements();
  var h = new Date().getHours();
  if (h < 7) localStorage.setItem('mp_early_bird', '1');
  if (h >= 0 && h < 4) localStorage.setItem('mp_night_owl', '1');

  ACHIEVEMENTS.forEach(function(a) {
    if (unlocked.indexOf(a.id) === -1 && a.check(stats)) {
      unlocked.push(a.id);
      localStorage.setItem('mp_achievements', JSON.stringify(unlocked));
      showAchievementToast(a);
    }
  });
}

function showAchievementToast(a) {
  var toast = document.getElementById('achieveToast');
  var icon = document.getElementById('achieveToastIcon');
  var name = document.getElementById('achieveToastName');
  if (!toast) return;
  icon.textContent = a.icon;
  name.textContent = a.name + ' — ' + a.desc;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3500);
  if (typeof playSfx === 'function') playSfx();
}

function openAchieveModal() {
  renderAchieveGrid();
  document.getElementById('achieveModal').classList.add('show');
}
function closeAchieveModal() {
  document.getElementById('achieveModal').classList.remove('show');
}

function renderAchieveGrid() {
  var unlocked = getUnlockedAchievements();
  var grid = document.getElementById('achieveGrid');
  var sub = document.getElementById('achieveSubtitle');
  if (!grid) return;
  if (sub) sub.textContent = unlocked.length + ' / ' + ACHIEVEMENTS.length + ' 달성';
  grid.innerHTML = ACHIEVEMENTS.map(function(a) {
    var isUnlocked = unlocked.indexOf(a.id) !== -1;
    return '<div class="achieve-item ' + (isUnlocked ? 'unlocked' : 'locked') + '">' +
      '<div class="achieve-icon">' + a.icon + '</div>' +
      '<div class="achieve-name">' + a.name + '</div>' +
      '<div class="achieve-desc">' + a.desc + '</div>' +
      '</div>';
  }).join('');
}

// ════════════════════════════════════════
// ── 일일 목표 ──
// ════════════════════════════════════════
function getGoal() { return parseInt(localStorage.getItem('mp_daily_goal')||'3'); }

function openGoalSetting() { document.getElementById('goalModal').classList.add('show'); }
function closeGoalModal()  { document.getElementById('goalModal').classList.remove('show'); }

function setGoal(n) {
  localStorage.setItem('mp_daily_goal', String(n));
  closeGoalModal();
  updateGoalBar();
  if (typeof showToast === 'function') showToast(n > 0 ? '오늘 목표: ' + n + '개 미션 💪' : '목표를 해제했어요');
}

function updateGoalBar() {
  var goal = getGoal();
  var completed = parseInt(localStorage.getItem('mp_total_completed')||'0');
  var todayCompleted = 0;
  try {
    var todayKey = (function() {
      var d = new Date();
      return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    })();
    var calData = getCalData ? getCalData() : {};
    todayCompleted = calData[todayKey] ? calData[todayKey].length : 0;
  } catch(e) {}

  var section = document.getElementById('goalSection');
  var countEl = document.getElementById('goalCount');
  var fillEl  = document.getElementById('goalBarFill');
  if (!section) return;

  if (!goal) { section.style.display = 'none'; return; }
  section.style.display = '';
  if (countEl) countEl.textContent = todayCompleted + ' / ' + goal;
  var pct = Math.min(100, Math.round((todayCompleted / goal) * 100));
  if (fillEl) fillEl.style.width = pct + '%';

  // 목표 달성
  if (todayCompleted >= goal && todayCompleted > 0) {
    var ga = parseInt(localStorage.getItem('mp_goal_achieved')||'0');
    var todayGoalKey = 'mp_goal_done_' + (new Date().toDateString());
    if (!localStorage.getItem(todayGoalKey)) {
      localStorage.setItem(todayGoalKey, '1');
      localStorage.setItem('mp_goal_achieved', String(ga + 1));
      setTimeout(function() {
        if (typeof showToast === 'function') showToast('🎯 오늘 목표 달성! 보너스 XP +10 ✨');
        addTotalCompleted && addTotalCompleted(9); // 보너스 XP
        checkAchievements();
      }, 800);
    }
  }
}

// ════════════════════════════════════════
// ── 집중 모드 ──
// ════════════════════════════════════════
var _focusMissionId = null;
var _focusTimer = null;
var _focusSeconds = 300;
var _focusRunning = false;

function startFocusMode() {
  var missions = window.MISSIONS || MISSIONS || [];
  var pending = missions.filter(function(m) {
    return window.state && window.state[String(m.id)] && !window.state[String(m.id)].completed;
  });
  if (!pending.length) {
    if (typeof showToast === 'function') showToast('완료할 미션이 없어요! 🎉');
    return;
  }
  // 진행률 도트
  var dots = document.getElementById('focusProgress');
  if (dots) {
    dots.innerHTML = pending.slice(0, 5).map(function(_, i) {
      return '<div class="focus-dot' + (i === 0 ? ' current' : '') + '"></div>';
    }).join('');
  }
  loadFocusMission(pending[0]);
  document.getElementById('focusOverlay').classList.add('show');
  startFocusTimer();
}

function loadFocusMission(m) {
  _focusMissionId = m.id;
  document.getElementById('focusMissionIcon').textContent = m.icon;
  document.getElementById('focusMissionName').textContent = m.name;
  document.getElementById('focusMissionDesc').textContent = m.desc;
  var inp = document.getElementById('focusInput');
  var btn = document.getElementById('focusCompleteBtn');
  if (m.type === 'text') {
    inp.style.display = ''; inp.placeholder = m.placeholder || '내용을 입력하세요...'; inp.value = '';
  } else {
    inp.style.display = 'none';
  }
}

function startFocusTimer() {
  _focusSeconds = 300; _focusRunning = true;
  updateFocusTimerDisplay();
  _focusTimer = setInterval(function() {
    if (!_focusRunning) return;
    _focusSeconds--;
    updateFocusTimerDisplay();
    if (_focusSeconds <= 0) {
      clearInterval(_focusTimer);
      if (typeof playSfx === 'function') playSfx();
    }
  }, 1000);
}

function updateFocusTimerDisplay() {
  var m = Math.floor(_focusSeconds / 60);
  var s = _focusSeconds % 60;
  var el = document.getElementById('focusTimer');
  if (el) el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function focusComplete() {
  if (!_focusMissionId) return;
  clearInterval(_focusTimer);
  _focusRunning = false;

  // 집중 카운트 증가
  var fc = parseInt(localStorage.getItem('mp_focus_count')||'0');
  localStorage.setItem('mp_focus_count', String(fc + 1));

  // 실제 미션 완료 처리
  var inp = document.getElementById('focusInput');
  var value = inp ? inp.value.trim() : '';

  fetch('/api/complete', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id: _focusMissionId, value: value, fileName:'', lucky:null})
  }).then(function(r){ return r.json(); }).then(function(data) {
    if (data.success && window.state) {
      window.state[String(_focusMissionId)] = Object.assign(
        window.state[String(_focusMissionId)] || {},
        {completed:true, expanded:false, value:value}
      );
      if (typeof addTotalCompleted === 'function') addTotalCompleted();
      if (typeof updateStreak === 'function') updateStreak();
      if (typeof playSfx === 'function') playSfx();
      if (typeof triggerParticle === 'function') triggerParticle(null);
      checkAchievements();
      updateGoalBar();
      if (typeof renderMissions === 'function') renderMissions();
      if (typeof updateProgress === 'function') updateProgress();
    }
  });

  // 다음 미션으로
  var missions = window.MISSIONS || MISSIONS || [];
  var pending = missions.filter(function(m) {
    return window.state && window.state[String(m.id)] && !window.state[String(m.id)].completed && m.id !== _focusMissionId;
  });

  if (pending.length) {
    _focusSeconds = 300; _focusRunning = true;
    loadFocusMission(pending[0]);
    // 도트 업데이트
    var dots = document.querySelectorAll('.focus-dot');
    dots.forEach(function(d, i) {
      d.className = 'focus-dot' + (i === 0 ? ' done' : i === 1 ? ' current' : '');
    });
    startFocusTimer();
  } else {
    exitFocusMode();
    if (typeof showToast === 'function') showToast('모든 미션 완료! 🎉');
  }
}

function exitFocusMode() {
  clearInterval(_focusTimer);
  _focusRunning = false;
  document.getElementById('focusOverlay').classList.remove('show');
}

// ── 초기화에 목표바 & 업적 체크 추가 ──
document.addEventListener('DOMContentLoaded', function() {
  updateGoalBar();
  checkAchievements();
});

// ════════════════════════════════════════
// ── 하단 네비 & 더보기 드로어 ──
// ════════════════════════════════════════
function navTo(id) {
  ['home','cal','stats','focus','more'].forEach(function(n) {
    var btn = document.getElementById('nav' + n.charAt(0).toUpperCase() + n.slice(1));
    if (btn) btn.classList.remove('active');
  });
  var active = document.getElementById('nav' + id.charAt(0).toUpperCase() + id.slice(1));
  if (active) active.classList.add('active');

  if (id === 'home') window.scrollTo({top:0, behavior:'smooth'});
  else if (id === 'cal') openCalendar();
  else if (id === 'stats') openStats();
  else if (id === 'focus') startFocusMode();

  // 홈 버튼은 항상 active 유지
  setTimeout(function() {
    if (id !== 'home') {
      if (active) active.classList.remove('active');
      var home = document.getElementById('navHome');
      if (home) home.classList.add('active');
    }
  }, 300);
}

function openMoreDrawer() {
  document.getElementById('moreDrawerOverlay').classList.add('show');
}
function closeMoreDrawer() {
  document.getElementById('moreDrawerOverlay').classList.remove('show');
}

// ════════════════════════════════════════
// ── XP & 레벨 시스템 ──
// ════════════════════════════════════════
var XP_PER_LEVEL = 120;
var MAX_LEVEL = 50;
var XP_NORMAL = 5;
var XP_FOCUS = 15;

function getXP() { return parseInt(localStorage.getItem('mp_xp') || '0'); }
function getLevel() { return Math.min(MAX_LEVEL, Math.floor(getXP() / XP_PER_LEVEL)); }

function addXP(amount) {
  var oldLevel = getLevel();
  var xp = Math.min(getXP() + amount, MAX_LEVEL * XP_PER_LEVEL);
  localStorage.setItem('mp_xp', String(xp));
  var newLevel = getLevel();
  if (newLevel > oldLevel) showLevelUp(newLevel);
  renderXPBar();
  if (typeof pushUserData === 'function') pushUserData();
}

function showLevelUp(lv) {
  var tn = getLevelName(lv);
  if (typeof showToast === 'function') showToast('🎉 레벨 UP! ' + tn.icon + ' ' + tn.name + ' (Lv.' + lv + ') 달성!');
  if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, window.innerHeight*0.4);
  if (typeof playSfx === 'function') playSfx();
  checkAchievements && checkAchievements();
}

var LEVEL_TIERS = [
  {min:0,  max:4,  name:'씨앗',    icon:'🌱'},
  {min:5,  max:9,  name:'새싹',    icon:'🌿'},
  {min:10, max:14, name:'꽃봉오리', icon:'🌸'},
  {min:15, max:19, name:'꽃',      icon:'🌺'},
  {min:20, max:24, name:'나무',    icon:'🌳'},
  {min:25, max:29, name:'숲',      icon:'🌲'},
  {min:30, max:34, name:'별',      icon:'⭐'},
  {min:35, max:39, name:'빛',      icon:'✨'},
  {min:40, max:44, name:'달',      icon:'🌙'},
  {min:45, max:49, name:'태양',    icon:'☀️'},
  {min:50, max:50, name:'전설',    icon:'👑'},
];

function getLevelName(lv) {
  for (var i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (lv >= LEVEL_TIERS[i].min) return LEVEL_TIERS[i];
  }
  return LEVEL_TIERS[0];
}

function renderXPBar() {
  var el = document.getElementById('xpSection');
  if (!el) return;
  var xp = getXP();
  var lv = getLevel();
  var tier = getLevelName(lv);

  // levelBadge도 업데이트
  var badge = document.getElementById('levelBadge');
  if (badge) badge.textContent = tier.icon + ' ' + tier.name;

  // streakBadge 업데이트
  var streak = document.getElementById('streakBadge');
  if (streak) streak.textContent = '🔥 ' + getStreak() + '일 연속';

  if (lv >= MAX_LEVEL) {
    el.innerHTML =
      '<div class="xp-card">' +
        '<div class="xp-card-top">' +
          '<div class="xp-name-block"><span class="xp-tier-icon">👑</span><span class="xp-tier-name">전설</span></div>' +
          '<span class="xp-lv-num">Lv.50 MAX</span>' +
        '</div>' +
        '<div class="xp-bar"><div class="xp-bar-fill" style="width:100%"></div></div>' +
        '<div class="xp-maxlevel-msg">최고 레벨 달성! 당신은 진정한 전설이에요 👑</div>' +
      '</div>';
    return;
  }

  var curXp = xp % XP_PER_LEVEL;
  var pct = Math.round((curXp / XP_PER_LEVEL) * 100);
  var remaining = XP_PER_LEVEL - curXp;
  var nextTier = getLevelName(lv + 1);

  el.innerHTML =
    '<div class="xp-card">' +
      '<div class="xp-card-top">' +
        '<div class="xp-name-block">' +
          '<span class="xp-tier-icon">' + tier.icon + '</span>' +
          '<span class="xp-tier-name">' + tier.name + '</span>' +
          '<span class="xp-lv-num">Lv.' + lv + '</span>' +
        '</div>' +
        '<span class="xp-next">다음: ' + nextTier.name + ' ' + nextTier.icon + ' · ' + remaining + ' XP</span>' +
      '</div>' +
      '<div class="xp-bar">' +
        '<div class="xp-bar-fill" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<div class="xp-nums"><span>' + curXp + ' / ' + XP_PER_LEVEL + ' XP</span><span>' + pct + '%</span></div>' +
    '</div>';
}

// ════════════════════════════════════════
// ── 집중 챌린지 ──
// ════════════════════════════════════════
var FC_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3시간
var FC_DURATION_SEC = 300; // 5분
var _fcTimer = null;
var _fcSeconds = FC_DURATION_SEC;
var _fcMissions = [];
var _fcCompleted = [];
var _fcExpanded = null;
var _fcFailed = false;

var FOCUS_MISSION_POOL = [
  {id:'f1',  icon:'🧠', text:'오늘 해결해야 할 문제 하나를 쓰고, 지금 당장 실행 가능한 해결책 3가지를 적어보세요.', type:'text', min:30},
  {id:'f2',  icon:'💌', text:'10년 후의 나에게 보내는 편지를 최소 3문장 이상 써보세요.', type:'text', min:30},
  {id:'f3',  icon:'🌟', text:'나의 가장 큰 강점 3가지를 쓰고, 각각 실제로 도움이 됐던 순간을 적어보세요.', type:'text', min:40},
  {id:'f4',  icon:'🎯', text:'이번 달 이루고 싶은 목표 하나를 정하고, 매일 할 수 있는 작은 행동 3가지를 적어보세요.', type:'text', min:30},
  {id:'f5',  icon:'🔍', text:'지금 내 삶에서 바꾸고 싶은 것 하나와, 그것을 바꾸지 못하는 이유를 솔직하게 적어보세요.', type:'text', min:30},
  {id:'f6',  icon:'🌈', text:'좋아하는 음식의 맛과 향을 한 번도 먹어본 적 없는 사람에게 설명하듯 자세히 써보세요.', type:'text', min:40},
  {id:'f7',  icon:'⏰', text:'오늘 하루 중 가장 의미 있었던 1시간은 언제인가요? 그 이유를 구체적으로 적어보세요.', type:'text', min:30},
  {id:'f8',  icon:'🤔', text:'만약 오늘이 인생의 마지막 날이라면 무엇을 하겠나요? 3가지를 이유와 함께 적어보세요.', type:'text', min:40},
  {id:'f9',  icon:'💡', text:'세상을 더 나은 곳으로 만들기 위해 내가 지금 당장 할 수 있는 일 3가지를 적어보세요.', type:'text', min:30},
  {id:'f10', icon:'😤', text:'지금 나를 가장 힘들게 하는 것은 무엇인가요? 그것과 함께 살아가는 방법을 생각해 적어보세요.', type:'text', min:40},
  {id:'f11', icon:'🏆', text:'지금까지 살면서 가장 자랑스러운 순간 3가지를 골라 그 이유와 함께 적어보세요.', type:'text', min:40},
  {id:'f12', icon:'👁️', text:'지금 창밖이나 주변을 보고 눈에 띄는 것 5가지를 골라 각각 한 문장으로 묘사해보세요.', type:'text', min:30},
  {id:'f13', icon:'🕊️', text:'지금 당장 누군가에게 진심으로 사과하고 싶다면 누구에게, 무슨 말을 할 건가요?', type:'text', min:30},
  {id:'f14', icon:'🌱', text:'5년 전의 나에게 꼭 해주고 싶은 조언 3가지와 그 이유를 구체적으로 적어보세요.', type:'text', min:40},
  {id:'f15', icon:'🎭', text:'지금 이 순간 내 감정을 날씨로 표현한다면? 그 날씨가 된 이유를 자세히 설명해보세요.', type:'text', min:30},
  {id:'f16', icon:'📚', text:'오늘 배운 것 하나를 선생님처럼 다른 사람에게 가르치듯이 쉽고 자세하게 설명해보세요.', type:'text', min:40},
];

function getFcCooldownRemaining() {
  var last = parseInt(localStorage.getItem('mp_fc_last') || '0');
  var remaining = last + FC_COOLDOWN_MS - Date.now();
  return Math.max(0, remaining);
}

function formatCooldown(ms) {
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  var s = Math.floor((ms % 60000) / 1000);
  return (h > 0 ? h + ':' : '') + (m < 10 && h > 0 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function initFocusChallenge() {
  var remaining = getFcCooldownRemaining();
  var btn = document.getElementById('fcStartBtn');
  var cdMsg = document.getElementById('fcCooldownMsg');
  var cdTime = document.getElementById('fcCooldownTime');
  if (!btn) return;
  if (remaining > 0) {
    btn.disabled = true;
    btn.textContent = '⏳ 쿨다운 중';
    if (cdMsg) cdMsg.style.display = '';
    if (cdTime) cdTime.textContent = formatCooldown(remaining);
    setTimeout(initFocusChallenge, 1000);
  } else {
    btn.disabled = false;
    btn.textContent = '⚡ 챌린지 시작';
    if (cdMsg) cdMsg.style.display = 'none';
  }
}

function startFocusChallenge() {
  if (getFcCooldownRemaining() > 0) return;
  localStorage.setItem('mp_fc_last', String(Date.now()));

  // 미션 4개 랜덤 선택
  var shuffled = FOCUS_MISSION_POOL.slice().sort(function() { return Math.random() - 0.5; });
  _fcMissions = shuffled.slice(0, 4);
  _fcCompleted = [];
  _fcExpanded = null;
  _fcFailed = false;
  _fcSeconds = FC_DURATION_SEC;

  document.getElementById('fcDefaultView').style.display = 'none';
  document.getElementById('fcActiveView').style.display = '';
  renderFcMissions();
  startFcTimer();
}

function startFcTimer() {
  clearInterval(_fcTimer);
  updateFcTimerUI();
  _fcTimer = setInterval(function() {
    _fcSeconds--;
    updateFcTimerUI();
    if (_fcSeconds <= 0) {
      clearInterval(_fcTimer);
      endFocusChallenge(false);
    }
  }, 1000);
}

function updateFcTimerUI() {
  var m = Math.floor(_fcSeconds / 60);
  var s = _fcSeconds % 60;
  var numEl = document.getElementById('fcTimerNum');
  var ring = document.getElementById('fcRing');
  if (numEl) numEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  if (ring) {
    var pct = _fcSeconds / FC_DURATION_SEC;
    ring.style.strokeDashoffset = 188.5 * (1 - pct);
    ring.style.stroke = _fcSeconds < 60 ? '#e55' : 'var(--gold)';
  }
  var prog = document.getElementById('fcProgressText');
  if (prog) prog.textContent = _fcCompleted.length + ' / 4 완료';
}

function renderFcMissions() {
  var list = document.getElementById('fcMissionList');
  if (!list) return;
  list.innerHTML = _fcMissions.map(function(m, i) {
    var done = _fcCompleted.indexOf(m.id) !== -1;
    var expanded = _fcExpanded === m.id && !done;
    return '<div class="fc-mission-item' + (done ? ' done' : '') + (expanded ? ' active-fc' : '') + '" id="fcm-' + m.id + '">' +
      '<div class="fc-mission-header" onclick="toggleFcMission(\'' + m.id + '\')">' +
        '<div class="fc-mission-num">' + (done ? '✓' : (i+1)) + '</div>' +
        '<div class="fc-mission-text">' + m.icon + ' ' + m.text + '</div>' +
        '<span class="fc-mission-xp">+' + XP_FOCUS + ' XP</span>' +
      '</div>' +
      (expanded ? '<div class="fc-mission-expand">' +
        '<textarea class="fc-mission-ta" id="fct-' + m.id + '" rows="3" placeholder="여기에 작성하세요..."></textarea>' +
        '<button class="fc-mission-btn" onclick="completeFcMission(\'' + m.id + '\')">✦ 완료</button>' +
      '</div>' : '') +
    '</div>';
  }).join('');
}

function toggleFcMission(id) {
  if (_fcCompleted.indexOf(id) !== -1) return;
  _fcExpanded = _fcExpanded === id ? null : id;
  renderFcMissions();
}

function completeFcMission(id) {
  var ta = document.getElementById('fct-' + id);
  var m = _fcMissions.find(function(x){ return x.id === id; });
  if (!m) return;
  if (ta && ta.value.trim().length < (m.min || 10)) {
    if (typeof showToast === 'function') showToast('조금 더 자세히 작성해주세요 ✏️', '#c97b4c');
    return;
  }
  _fcCompleted.push(id);
  _fcExpanded = null;
  addXP(XP_FOCUS);
  if (typeof playSfx === 'function') playSfx();
  if (typeof triggerParticle === 'function') triggerParticle(document.getElementById('fcm-' + id));
  renderFcMissions();
  updateFcTimerUI();
  if (_fcCompleted.length >= 4) endFocusChallenge(true);
}

function endFocusChallenge(success) {
  clearInterval(_fcTimer);
  var msg = document.getElementById('fcResultMsg');
  if (success) {
    if (msg) msg.innerHTML = '<div class="fc-complete-msg">🎉 챌린지 완료! ' + (XP_FOCUS * 4) + ' XP 획득!</div>';
    if (typeof showToast === 'function') showToast('🏆 집중 챌린지 완료! 60 XP 획득!');
    checkAchievements && checkAchievements();
    setTimeout(resetFocusChallenge, 2500);
  } else {
    if (msg) msg.innerHTML = '<div class="fc-fail-msg">⏰ 시간 초과! ' + (XP_FOCUS * _fcCompleted.length) + ' XP 획득 (' + _fcCompleted.length + '/4 완료)</div>';
    setTimeout(resetFocusChallenge, 3000);
  }
}

function resetFocusChallenge() {
  document.getElementById('fcActiveView').style.display = 'none';
  document.getElementById('fcDefaultView').style.display = '';
  document.getElementById('fcResultMsg').innerHTML = '';
  initFocusChallenge();
}

// ── 기존 미션 완료 시 XP 추가 (일반 5 XP) ──
// addTotalCompleted를 래핑해서 XP도 같이 증가
var _origAddTotal = window.addTotalCompleted;
window.addTotalCompleted = function(bonus) {
  if (_origAddTotal) _origAddTotal(bonus);
  if (!bonus) addXP(XP_NORMAL);
};

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', function() {
  renderXPBar();
  initFocusChallenge();
});

// ════════════════════════════════════════
// ── 프리미엄 시스템 ──
// ════════════════════════════════════════
var _isPremium = false;
var _premiumPrice = 'monthly';

// 프리미엄 상태 로드
async function loadPremiumStatus() {
  if (!window._authToken) { applyPremiumUI(false); return; }
  try {
    var res = await fetch('/api/premium/status', {
      headers: { 'Authorization': 'Bearer ' + window._authToken }
    });
    var data = await res.json();
    _isPremium = data.is_premium || false;
    applyPremiumUI(_isPremium);
  } catch(e) { applyPremiumUI(false); }
}

function applyPremiumUI(isPremium) {
  _isPremium = isPremium;
  // 프리미엄 배지 표시
  var badge = document.getElementById('userNameBadge');
  if (badge && isPremium && window._authUsername) {
    badge.innerHTML = '👤 ' + window._authUsername + ' <span class="premium-badge">💎</span>';
  }
  // AI 섹션 잠금/해제
  var aiMs = document.getElementById('aiMissionSection');
  var aiDs = document.getElementById('aiDiarySection');
  if (aiMs) aiMs.classList.toggle('lock-overlay', !isPremium);
  if (aiDs) aiDs.classList.toggle('lock-overlay', !isPremium);
  if (aiMs) aiMs.onclick = !isPremium ? openPremiumModal : null;
  if (aiDs) aiDs.onclick = !isPremium ? openPremiumModal : null;
  // 프리미엄 테마 적용
  if (isPremium) applyPremiumThemes();
}

// 프리미엄 테마 추가
function applyPremiumThemes() {
  var existing = document.getElementById('premiumThemeStyles');
  if (existing) return;
  var style = document.createElement('style');
  style.id = 'premiumThemeStyles';
  style.textContent = [
    'body.theme-aurora { --gold:#7c3aed; --gold-light:#a78bfa; --gold-dim:rgba(124,58,237,.12); }',
    'body.theme-midnight { --gold:#e2e8f0; --gold-light:#f8fafc; --gold-dim:rgba(226,232,240,.08); --surface:#0f172a; --surface2:#1e293b; }',
    'body.theme-cherry { --gold:#e11d48; --gold-light:#fb7185; --gold-dim:rgba(225,29,72,.12); }',
  ].join('\n');
  document.head.appendChild(style);
  // 테마 그리드에 프리미엄 테마 추가
  var cur = localStorage.getItem('mp_theme_color') || 'gold';
  var grid = document.getElementById('themeGrid');
  if (!grid) return;
  var premiumThemes = [
    {id:'aurora',   label:'오로라',    color:'#7c3aed'},
    {id:'midnight', label:'미드나잇',   color:'#e2e8f0'},
    {id:'cherry',   label:'체리블라썸', color:'#e11d48'},
  ];
  premiumThemes.forEach(function(t) {
    var div = document.createElement('div');
    div.className = 'theme-option' + (t.id === cur ? ' active' : '');
    div.onclick = function() { applyTheme(t.id); };
    div.innerHTML = '<div class="theme-dot" style="background:' + t.color + '"></div>' +
      '<span>' + t.label + '</span><div style="font-size:9px;color:var(--gold);margin-top:2px">💎</div>';
    grid.appendChild(div);
  });
}

// 프리미엄 모달
function openPremiumModal() {
  document.getElementById('premiumModal').classList.add('show');
}
function closePremiumModal() {
  document.getElementById('premiumModal').classList.remove('show');
}
function selectPrice(type) {
  _premiumPrice = type;
  document.getElementById('priceMonthly').classList.toggle('selected', type === 'monthly');
  document.getElementById('priceYearly').classList.toggle('selected', type === 'yearly');
}
function purchasePremium() {
  // 실제 결제 연동 전 안내
  closePremiumModal();
  if (typeof showToast === 'function') showToast('결제 시스템 준비 중이에요! 곧 만나요 😊');
}

// ── AI 맞춤 미션 생성 ──
async function generateAiMissions() {
  if (!_isPremium) { openPremiumModal(); return; }
  var btn = document.getElementById('aiMissionBtn');
  var result = document.getElementById('aiMissionResult');
  if (!btn || !result) return;
  btn.disabled = true; btn.textContent = '생성 중...';
  result.innerHTML = '<div class="ai-loading">🤖 AI가 미션을 분석 중이에요...</div>';

  // 최근 완료 미션 수집
  var calData = getCalData ? getCalData() : {};
  var recentMissions = [];
  var today = new Date();
  for (var i = 0; i < 7; i++) {
    var d = new Date(today); d.setDate(d.getDate() - i);
    var k = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if (calData[k]) recentMissions = recentMissions.concat(calData[k]);
  }
  var todayKey = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var mood = localStorage.getItem('mp_mood_' + todayKey) || '';

  try {
    var res = await fetch('/api/premium/ai_mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window._authToken },
      body: JSON.stringify({
        recent_missions: recentMissions.slice(0, 10),
        mood: mood,
        streak: parseInt(localStorage.getItem('mp_streak_count') || '0'),
        categories: ['health','mind','creative','relation','growth','daily']
      })
    });
    var data = await res.json();
    if (data.success && data.missions) {
      result.innerHTML = data.missions.map(function(m) {
        return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:20px">' + (m.icon||'✨') + '</span>' +
          '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">' + m.name + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted)">' + m.desc + '</div></div>' +
          '<button onclick="addAiMission(this)" data-mission=\'' + JSON.stringify(m).replace(/'/g,"&#39;") + '\' style="padding:5px 10px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">추가</button>' +
          '</div>';
      }).join('');
    } else {
      result.innerHTML = '<div class="ai-loading" style="color:#e55">생성에 실패했어요. 다시 시도해주세요.</div>';
    }
  } catch(e) {
    result.innerHTML = '<div class="ai-loading" style="color:#e55">오류가 발생했어요.</div>';
  }
  btn.disabled = false; btn.textContent = '다시 생성';
}

async function addAiMission(btn) {
  try {
    var m = JSON.parse(btn.getAttribute('data-mission').replace(/&#39;/g,"'"));
    var res = await fetch('/api/add_mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
    var data = await res.json();
    if (data.success) {
      MISSIONS.push(data.mission);
      window.state[String(data.mission.id)] = {completed:false, expanded:false, value:'', lucky:null, fileName:''};
      if (typeof saveCustomMissions === 'function') saveCustomMissions();
      if (typeof renderMissions === 'function') renderMissions();
      if (typeof updateProgress === 'function') updateProgress();
      btn.textContent = '✓ 추가됨'; btn.disabled = true;
      if (typeof showToast === 'function') showToast('"' + m.name + '" 미션이 추가됐어요! ✨');
    }
  } catch(e) {}
}

// ── AI 하루 일기 ──
async function generateAiDiary() {
  if (!_isPremium) { openPremiumModal(); return; }
  var btn = document.getElementById('aiDiaryBtn');
  var result = document.getElementById('aiDiaryResult');
  if (!btn || !result) return;
  btn.disabled = true; btn.textContent = '작성 중...';
  result.innerHTML = '<div class="ai-loading">✍️ AI가 오늘의 일기를 쓰고 있어요...</div>';

  var calData = getCalData ? getCalData() : {};
  var today = new Date();
  var todayKey = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var completed = calData[todayKey] || [];
  var mood = localStorage.getItem('mp_mood_' + todayKey) || '';

  if (!completed.length) {
    result.innerHTML = '<div class="ai-loading" style="color:var(--text-muted)">오늘 완료한 미션이 없어요. 미션을 완료하고 다시 시도해보세요!</div>';
    btn.disabled = false; btn.textContent = '작성';
    return;
  }

  try {
    var res = await fetch('/api/premium/ai_diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window._authToken },
      body: JSON.stringify({
        completed_missions: completed,
        mood: mood,
        streak: parseInt(localStorage.getItem('mp_streak_count') || '0')
      })
    });
    var data = await res.json();
    if (data.success) {
      result.innerHTML =
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">📅 ' + data.date + '</div>' +
        '<div class="ai-diary-text">' + data.diary + '</div>' +
        '<button onclick="copyDiary(this)" style="margin-top:8px;padding:7px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text-muted);font-size:12px;cursor:pointer;font-family:inherit">📋 복사</button>';
    } else {
      result.innerHTML = '<div class="ai-loading" style="color:#e55">작성에 실패했어요. 다시 시도해주세요.</div>';
    }
  } catch(e) {
    result.innerHTML = '<div class="ai-loading" style="color:#e55">오류가 발생했어요.</div>';
  }
  btn.disabled = false; btn.textContent = '다시 작성';
}

function copyDiary(btn) {
  var text = document.querySelector('.ai-diary-text');
  if (!text) return;
  navigator.clipboard.writeText(text.textContent).then(function() {
    btn.textContent = '✓ 복사됨';
    setTimeout(function() { btn.textContent = '📋 복사'; }, 2000);
  });
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', function() {
  loadPremiumStatus();
});

// ════════════════════════════════════════
// ── 가계부 시스템 ──
// ════════════════════════════════════════

// 데이터 구조
var _budget = {
  transactions: [],
  accounts: [],
  goals: [],
  subscriptions: [],
  wishlist: [],
  settings: { monthly_budget: 0 },
  challenge_52week: []
};

var _budgetTab = 'home';
var _budgetYear = new Date().getFullYear();
var _budgetMonth = new Date().getMonth() + 1;
var _budgetFormType = 'expense';
var _budgetFormTag = '';
var _budgetEditId = null;
var _budgetFormCat = '';

var BUDGET_CATS_EXPENSE = [
  {id:'food', icon:'🍚', label:'식비'},
  {id:'cafe', icon:'☕', label:'카페'},
  {id:'transport', icon:'🚇', label:'교통'},
  {id:'shopping', icon:'🛍️', label:'쇼핑'},
  {id:'medical', icon:'💊', label:'의료'},
  {id:'culture', icon:'🎬', label:'문화'},
  {id:'beauty', icon:'💄', label:'미용'},
  {id:'living', icon:'🏠', label:'생활'},
  {id:'edu', icon:'📚', label:'교육'},
  {id:'travel', icon:'✈️', label:'여행'},
  {id:'sub', icon:'📱', label:'구독'},
  {id:'etc', icon:'💸', label:'기타'},
];

var BUDGET_CATS_INCOME = [
  {id:'salary', icon:'💰', label:'급여'},
  {id:'bonus', icon:'🎁', label:'보너스'},
  {id:'freelance', icon:'💼', label:'프리랜서'},
  {id:'investment', icon:'📈', label:'투자'},
  {id:'gift', icon:'🎀', label:'용돈'},
  {id:'etc_in', icon:'💵', label:'기타'},
];

// ── 데이터 로드/저장 ──
function getBudgetData() { return _budget; }

function saveBudget() {
  localStorage.setItem('mp_budget', JSON.stringify(_budget));
  if (window._authToken) {
    fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window._authToken },
      body: JSON.stringify(_budget)
    }).catch(function(){});
  }
}

async function loadBudget() {
  var local = localStorage.getItem('mp_budget');
  if (local) try { _budget = JSON.parse(local); } catch(e) {}
  if (window._authToken) {
    try {
      var res = await fetch('/api/budget', { headers: { 'Authorization': 'Bearer ' + window._authToken } });
      var data = await res.json();
      if (data.success && data.data && data.data.transactions) {
        _budget = data.data;
        localStorage.setItem('mp_budget', JSON.stringify(_budget));
      }
    } catch(e) {}
  }
}

// ── 페이지 열기/닫기 ──
function openBudget() {
  document.getElementById('budgetPage').classList.add('show');
  document.querySelector('.container') && (document.querySelector('.container').style.display = 'none');
  // 상단 고정 버튼 숨기기
  var themeBtn = document.getElementById('themeToggle');
  var calBtn = document.getElementById('calToggle');
  if (themeBtn) themeBtn.style.display = 'none';
  if (calBtn) calBtn.style.display = 'none';
  loadBudget().then(function() { renderBudgetTab(); });
}

function closeBudget() {
  document.getElementById('budgetPage').classList.remove('show');
  document.querySelector('.container') && (document.querySelector('.container').style.display = '');
  // 상단 고정 버튼 다시 보이기
  var themeBtn = document.getElementById('themeToggle');
  var calBtn = document.getElementById('calToggle');
  if (themeBtn) themeBtn.style.display = '';
  if (calBtn) calBtn.style.display = '';
}

// ── 월 네비 ──
function budgetPrevMonth() {
  _budgetMonth--;
  if (_budgetMonth < 1) { _budgetMonth = 12; _budgetYear--; }
  updateBudgetMonthLabel();
  renderBudgetTab();
}
function budgetNextMonth() {
  _budgetMonth++;
  if (_budgetMonth > 12) { _budgetMonth = 1; _budgetYear++; }
  updateBudgetMonthLabel();
  renderBudgetTab();
}
function updateBudgetMonthLabel() {
  var el = document.getElementById('budgetMonthLabel');
  if (el) el.textContent = _budgetYear + '년 ' + _budgetMonth + '월';
}

// ── 탭 전환 ──
function switchBudgetTab(tab) {
  _budgetTab = tab;
  document.querySelectorAll('.budget-tab').forEach(function(btn, i) {
    var tabs = ['home','tx','analysis','asset','tools'];
    btn.classList.toggle('active', tabs[i] === tab);
  });
  renderBudgetTab();
}

function renderBudgetTab() {
  var content = document.getElementById('budgetContent');
  if (!content) return;
  updateBudgetMonthLabel();
  if (_budgetTab === 'home') content.innerHTML = renderBudgetHome();
  else if (_budgetTab === 'tx') content.innerHTML = renderBudgetTx();
  else if (_budgetTab === 'analysis') content.innerHTML = renderBudgetAnalysis();
  else if (_budgetTab === 'asset') content.innerHTML = renderBudgetAsset();
  else if (_budgetTab === 'tools') content.innerHTML = renderBudgetTools();
}

// ── 이번달 거래 필터 ──
function getMonthTx() {
  return _budget.transactions.filter(function(t) {
    var d = new Date(t.date);
    return d.getFullYear() === _budgetYear && d.getMonth()+1 === _budgetMonth;
  });
}

function getMonthSummary() {
  var txs = getMonthTx();
  var income = txs.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+t.amount; },0);
  var expense = txs.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+t.amount; },0);
  return { income: income, expense: expense, balance: income - expense };
}

function fmt(n) {
  if (Math.abs(n) >= 10000) return (n/10000).toFixed(0) + '만원';
  return n.toLocaleString() + '원';
}

// ── 홈 렌더링 ──
function renderBudgetHome() {
  var s = getMonthSummary();
  var budget = _budget.settings.monthly_budget || 0;
  var score = calcHealthScore();

  // 최근 거래 5개
  var recent = getMonthTx().sort(function(a,b){ return b.date.localeCompare(a.date); }).slice(0,5);

  // 카테고리 상위 3개
  var catTotals = {};
  getMonthTx().filter(function(t){ return t.type==='expense'; }).forEach(function(t) {
    catTotals[t.category] = (catTotals[t.category]||0) + t.amount;
  });
  var topCats = Object.entries(catTotals).sort(function(a,b){ return b[1]-a[1]; }).slice(0,3);

  // 구독 합계
  var subTotal = _budget.subscriptions.reduce(function(s,x){ return s+x.amount; },0);

  return [
    // 재정 건강 점수
    '<div class="b-card" style="background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(167,139,250,.1));border-color:rgba(201,168,76,.3)">',
      '<div class="health-score-wrap">',
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;letter-spacing:1px">재정 건강 점수</div>',
        '<div class="health-score-num">' + score.total + '</div>',
        '<div class="health-score-label">' + score.label + '</div>',
      '</div>',
      '<div class="health-badges">',
        score.badges.map(function(b){ return '<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(52,211,153,.15);color:#34d399;border:1px solid rgba(52,211,153,.3)">' + b + '</span>'; }).join(''),
      '</div>',
    '</div>',

    // 수입/지출/잔액
    '<div class="budget-summary">',
      '<div class="b-sum-card"><div class="b-sum-label">수입</div><div class="b-sum-amount b-sum-income">+' + fmt(s.income) + '</div></div>',
      '<div class="b-sum-card"><div class="b-sum-label">지출</div><div class="b-sum-amount b-sum-expense">-' + fmt(s.expense) + '</div></div>',
      '<div class="b-sum-card"><div class="b-sum-label">잔액</div><div class="b-sum-amount b-sum-balance">' + fmt(s.balance) + '</div></div>',
    '</div>',

    // 예산
    budget > 0 ? [
      '<div class="b-card">',
        '<div class="b-card-title">🎯 이번달 예산 <span style="font-size:11px;color:var(--text-muted)">' + fmt(s.expense) + ' / ' + fmt(budget) + '</span></div>',
        '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + Math.min(100,Math.round((s.expense/budget)*100)) + '%;background:' + (s.expense>budget?'#f87171':'var(--gold)') + '"></div></div>',
        '<div style="font-size:11px;color:var(--text-muted);margin-top:6px">' + Math.round((s.expense/budget)*100) + '% 사용' + (s.expense>budget?' · <span style="color:#f87171">예산 초과!</span>':' · ' + fmt(budget-s.expense) + ' 남음') + '</div>',
      '</div>',
    ].join('') : '<div class="b-card" style="text-align:center;cursor:pointer" onclick="openBudgetSettings()"><div style="font-size:13px;color:var(--text-muted)">🎯 이번달 예산을 설정해보세요 →</div></div>',

    // 카테고리 상위
    topCats.length > 0 ? [
      '<div class="b-card">',
        '<div class="b-card-title">📊 지출 상위</div>',
        topCats.map(function(c){
          var catObj = BUDGET_CATS_EXPENSE.find(function(x){ return x.id===c[0]; }) || {icon:'💸', label:c[0]};
          var pct = s.expense > 0 ? Math.round((c[1]/s.expense)*100) : 0;
          return '<div style="margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
              '<span style="font-size:12px;color:var(--text)">' + catObj.icon + ' ' + catObj.label + '</span>' +
              '<span style="font-size:12px;color:var(--text-muted)">' + fmt(c[1]) + ' (' + pct + '%)</span>' +
            '</div>' +
            '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + pct + '%;background:var(--gold)"></div></div>' +
          '</div>';
        }).join(''),
      '</div>',
    ].join('') : '',

    // 최근 거래
    '<div class="b-card">',
      '<div class="b-card-title">🕐 최근 거래 <span style="font-size:11px;color:var(--gold);cursor:pointer" onclick="switchBudgetTab(\'tx\')">전체보기</span></div>',
      recent.length > 0 ? recent.map(renderTxItem).join('') :
        '<div class="b-empty"><div class="b-empty-icon">📭</div>이번달 거래 내역이 없어요<br>+ 입력 버튼을 눌러 추가해보세요!</div>',
    '</div>',

    // 구독
    subTotal > 0 ? [
      '<div class="b-card">',
        '<div class="b-card-title">📱 이번달 구독료 <span style="font-size:13px;color:#a78bfa;font-weight:800">' + fmt(subTotal) + '</span></div>',
        _budget.subscriptions.map(function(s){
          return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
            '<span style="font-size:18px">' + s.icon + '</span>' +
            '<div style="flex:1"><div style="font-size:13px;color:var(--text)">' + s.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">매월 ' + s.billing_day + '일</div></div>' +
            '<span style="font-size:13px;font-weight:700;color:#a78bfa">' + s.amount.toLocaleString() + '원</span>' +
          '</div>';
        }).join(''),
      '</div>',
    ].join('') : '',

  ].join('');
}

function renderTxItem(t) {
  var cats = _budgetFormType === 'income' ? BUDGET_CATS_INCOME : BUDGET_CATS_EXPENSE;
  var catAll = BUDGET_CATS_EXPENSE.concat(BUDGET_CATS_INCOME);
  var catObj = catAll.find(function(c){ return c.id===t.category; }) || {icon:'💸', label:t.category};
  var tagHtml = t.tag ? '<span class="tx-tag tag-' + t.tag + '">' + {plan:'📋계획',impulse:'⚡충동',fixed:'🔄고정'}[t.tag] + '</span>' : '';
  return '<div class="tx-item" onclick="editBudgetTx(\'' + t.id + '\')">' +
    '<div class="tx-icon-wrap">' + catObj.icon + '</div>' +
    '<div class="tx-info">' +
      '<div class="tx-name">' + t.name + '</div>' +
      '<div class="tx-meta">' + catObj.label + ' · ' + t.date + tagHtml + '</div>' +
    '</div>' +
    '<div class="tx-amount ' + (t.type==='income'?'tx-income':'tx-expense') + '">' +
      (t.type==='income'?'+':'-') + t.amount.toLocaleString() + '원' +
    '</div>' +
  '</div>';
}

// ── 내역 탭 ──
function renderBudgetTx() {
  var txs = getMonthTx().sort(function(a,b){ return b.date.localeCompare(a.date); });
  // 날짜별 그룹핑
  var groups = {};
  txs.forEach(function(t) {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });
  var html = '';
  if (Object.keys(groups).length === 0) {
    return '<div class="b-empty" style="padding-top:60px"><div class="b-empty-icon">📭</div>이번달 거래 내역이 없어요<br><br>' +
      '<button onclick="openBudgetForm()" style="padding:10px 20px;background:var(--gold);border:none;border-radius:12px;color:#0a0a0f;font-weight:700;cursor:pointer;font-family:inherit">첫 내역 추가하기</button></div>';
  }
  Object.keys(groups).sort(function(a,b){ return b.localeCompare(a); }).forEach(function(date) {
    var dayTxs = groups[date];
    var dayExp = dayTxs.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+t.amount; },0);
    var dayInc = dayTxs.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+t.amount; },0);
    html += '<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;padding:6px 4px 4px">' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-muted)">' + date + '</span>' +
      '<span style="font-size:11px;color:var(--text-muted)">' +
        (dayInc > 0 ? '<span style="color:#34d399">+' + dayInc.toLocaleString() + '</span> ' : '') +
        (dayExp > 0 ? '<span style="color:#f87171">-' + dayExp.toLocaleString() + '</span>' : '') +
      '</span></div>';
    dayTxs.forEach(function(t) { html += renderTxItem(t); });
    html += '</div>';
  });
  return html;
}

// ── 분석 탭 ──
function renderBudgetAnalysis() {
  var txs = getMonthTx();
  var expenses = txs.filter(function(t){ return t.type==='expense'; });
  var totalExp = expenses.reduce(function(s,t){ return s+t.amount; },0);

  // 카테고리 합계
  var catTotals = {};
  expenses.forEach(function(t) {
    catTotals[t.category] = (catTotals[t.category]||0) + t.amount;
  });
  var catList = Object.entries(catTotals).sort(function(a,b){ return b[1]-a[1]; });

  // 요일별
  var dayTotals = [0,0,0,0,0,0,0];
  expenses.forEach(function(t) {
    var d = new Date(t.date).getDay();
    dayTotals[d] += t.amount;
  });
  var maxDay = Math.max(1, Math.max.apply(null,dayTotals));
  var dayLabels = ['일','월','화','수','목','금','토'];

  // 감정 소비
  var impulse = expenses.filter(function(t){ return t.tag==='impulse'; });
  var planned = expenses.filter(function(t){ return t.tag==='plan'; });

  // 지난달 비교
  var prevYear = _budgetMonth === 1 ? _budgetYear-1 : _budgetYear;
  var prevMonth = _budgetMonth === 1 ? 12 : _budgetMonth-1;
  var prevExp = _budget.transactions.filter(function(t) {
    var d = new Date(t.date);
    return t.type==='expense' && d.getFullYear()===prevYear && d.getMonth()+1===prevMonth;
  }).reduce(function(s,t){ return s+t.amount; },0);

  var DONUT_COLORS = ['#c9a84c','#a78bfa','#60a5fa','#34d399','#f87171','#fb923c'];

  return [
    // 지난달 비교
    '<div class="b-card">',
      '<div class="b-card-title">📈 지난달 비교</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
        '<div style="background:var(--surface);border-radius:12px;padding:12px;text-align:center">',
          '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">이번달 지출</div>',
          '<div style="font-size:18px;font-weight:800;color:var(--text)">' + fmt(totalExp) + '</div>',
          prevExp > 0 ? '<div style="font-size:11px;color:' + (totalExp<prevExp?'#34d399':'#f87171') + ';margin-top:2px">' + (totalExp<prevExp?'▼ ':'▲ ') + Math.abs(totalExp-prevExp).toLocaleString() + '원</div>' : '',
        '</div>',
        '<div style="background:var(--surface);border-radius:12px;padding:12px;text-align:center">',
          '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">저축률</div>',
          '<div style="font-size:18px;font-weight:800;color:var(--gold)">',
            (function(){ var s=getMonthSummary(); return s.income>0 ? Math.round(((s.income-s.expense)/s.income)*100)+'%' : '-'; })(),
          '</div>',
        '</div>',
      '</div>',
    '</div>',

    // 카테고리별
    catList.length > 0 ? [
      '<div class="b-card">',
        '<div class="b-card-title">🗂️ 카테고리별 지출</div>',
        catList.map(function(c, i) {
          var catObj = BUDGET_CATS_EXPENSE.find(function(x){ return x.id===c[0]; }) || {icon:'💸', label:c[0]};
          var pct = totalExp > 0 ? Math.round((c[1]/totalExp)*100) : 0;
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
            '<div style="width:10px;height:10px;border-radius:3px;background:' + DONUT_COLORS[i%DONUT_COLORS.length] + ';flex-shrink:0"></div>' +
            '<div style="flex:1">' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:3px">' +
                '<span style="font-size:12px;color:var(--text)">' + catObj.icon + ' ' + catObj.label + '</span>' +
                '<span style="font-size:12px;color:var(--text-muted)">' + pct + '% · ' + c[1].toLocaleString() + '원</span>' +
              '</div>' +
              '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + pct + '%;background:' + DONUT_COLORS[i%DONUT_COLORS.length] + '"></div></div>' +
            '</div>' +
          '</div>';
        }).join(''),
      '</div>',
    ].join('') : '',

    // 요일별 패턴
    '<div class="b-card">',
      '<div class="b-card-title">📅 요일별 지출 패턴</div>',
      '<div class="b-bar-chart">',
        dayLabels.map(function(d,i) {
          var h = Math.round((dayTotals[i]/maxDay)*80);
          return '<div class="b-bar-col">' +
            '<div class="b-bar-val">' + (dayTotals[i]>0?(dayTotals[i]/10000).toFixed(0)+'만':'') + '</div>' +
            '<div class="b-bar-inner" style="height:' + h + 'px;background:' + (dayTotals[i]===Math.max.apply(null,dayTotals)?'var(--gold)':'var(--purple,#a78bfa)') + ';opacity:' + (dayTotals[i]===Math.max.apply(null,dayTotals)?1:0.6) + '"></div>' +
            '<div class="b-bar-lbl">' + d + '</div>' +
          '</div>';
        }).join(''),
      '</div>',
    '</div>',

    // 감정 소비
    '<div class="b-card">',
      '<div class="b-card-title">💭 감정 소비 분석</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
        '<div style="background:var(--surface);border-radius:12px;padding:12px;text-align:center">',
          '<div style="font-size:24px">⚡</div>',
          '<div style="font-size:12px;font-weight:700;color:#f87171;margin-top:4px">충동구매</div>',
          '<div style="font-size:16px;font-weight:800;color:var(--text)">' + impulse.length + '회</div>',
          '<div style="font-size:11px;color:var(--text-muted)">' + impulse.reduce(function(s,t){return s+t.amount;},0).toLocaleString() + '원</div>',
        '</div>',
        '<div style="background:var(--surface);border-radius:12px;padding:12px;text-align:center">',
          '<div style="font-size:24px">📋</div>',
          '<div style="font-size:12px;font-weight:700;color:#34d399;margin-top:4px">계획 소비</div>',
          '<div style="font-size:16px;font-weight:800;color:var(--text)">' + planned.length + '회</div>',
          '<div style="font-size:11px;color:var(--text-muted)">' + planned.reduce(function(s,t){return s+t.amount;},0).toLocaleString() + '원</div>',
        '</div>',
      '</div>',
    '</div>',

  ].join('');
}

// ── 자산 탭 ──
function renderBudgetAsset() {
  var totalAsset = _budget.accounts.filter(function(a){ return !a.is_debt; }).reduce(function(s,a){ return s+a.balance; },0);
  var totalDebt = Math.abs(_budget.accounts.filter(function(a){ return a.is_debt; }).reduce(function(s,a){ return s+a.balance; },0));
  var netWorth = totalAsset - totalDebt;

  return [
    // 순자산
    '<div class="b-card" style="background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(96,165,250,.1));border-color:rgba(201,168,76,.3)">',
      '<div class="asset-total">',
        '<div class="asset-total-label">순자산</div>',
        '<div class="asset-total-amount">' + netWorth.toLocaleString() + '원</div>',
        '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px">',
          '<span style="font-size:12px;color:#34d399">↑ 자산 ' + totalAsset.toLocaleString() + '원</span>',
          '<span style="font-size:12px;color:#f87171">↓ 부채 ' + totalDebt.toLocaleString() + '원</span>',
        '</div>',
      '</div>',
    '</div>',

    // 계좌
    '<div class="b-card">',
      '<div class="b-card-title">💳 계좌 · 카드 <span style="font-size:11px;color:var(--gold);cursor:pointer" onclick="openAddAccount()">+ 추가</span></div>',
      _budget.accounts.length > 0 ? _budget.accounts.map(function(a) {
        return '<div class="tx-item" style="margin-bottom:6px">' +
          '<div class="tx-icon-wrap" style="font-size:22px">' + a.icon + '</div>' +
          '<div class="tx-info"><div class="tx-name">' + a.name + '</div>' +
          '<div class="tx-meta">' + (a.is_debt ? '신용카드' : '예금·현금') + '</div></div>' +
          '<div style="font-size:15px;font-weight:800;color:' + (a.is_debt?'#f87171':'#34d399') + '">' +
            (a.is_debt?'-':'+') + Math.abs(a.balance).toLocaleString() + '원</div>' +
        '</div>';
      }).join('') :
        '<div class="b-empty"><div class="b-empty-icon">🏦</div>계좌를 추가해보세요<br><button onclick="openAddAccount()" style="margin-top:10px;padding:8px 16px;background:var(--gold);border:none;border-radius:10px;color:#0a0a0f;font-weight:700;cursor:pointer;font-family:inherit">계좌 추가</button></div>',
    '</div>',

    // 저축 목표
    '<div class="b-card">',
      '<div class="b-card-title">🎯 저축 목표 <span style="font-size:11px;color:var(--gold);cursor:pointer" onclick="openAddGoal()">+ 추가</span></div>',
      _budget.goals.length > 0 ? _budget.goals.map(function(g) {
        var pct = g.target > 0 ? Math.min(100,Math.round((g.current/g.target)*100)) : 0;
        return '<div style="margin-bottom:12px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span style="font-size:22px">' + g.icon + '</span>' +
              '<div><div style="font-size:13px;font-weight:700;color:var(--text)">' + g.name + '</div>' +
              '<div style="font-size:11px;color:var(--text-muted)">목표 ' + (g.deadline||'-') + '</div></div>' +
            '</div>' +
            '<div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--gold)">' + pct + '%</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + g.current.toLocaleString() + '원</div></div>' +
          '</div>' +
          '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + pct + '%;background:' + (pct>=100?'#34d399':'var(--gold)') + '"></div></div>' +
        '</div>';
      }).join('') :
        '<div class="b-empty"><div class="b-empty-icon">🎯</div>저축 목표를 설정해보세요</div>',
    '</div>',

    // 위시리스트
    '<div class="b-card">',
      '<div class="b-card-title">💝 위시리스트 <span style="font-size:11px;color:var(--gold);cursor:pointer" onclick="openAddWish()">+ 추가</span></div>',
      _budget.wishlist.length > 0 ? _budget.wishlist.map(function(w) {
        var pct = w.price > 0 ? Math.min(100,Math.round((w.saved/w.price)*100)) : 0;
        return '<div style="margin-bottom:10px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
            '<span style="font-size:13px;color:var(--text)">' + w.name + '</span>' +
            '<span style="font-size:12px;color:' + (pct>=100?'#34d399':'var(--text-muted)') + '">' + (pct>=100?'✅ 달성!':w.price.toLocaleString()+'원') + '</span>' +
          '</div>' +
          '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + pct + '%;background:' + (pct>=100?'#34d399':'#60a5fa') + '"></div></div>' +
        '</div>';
      }).join('') :
        '<div class="b-empty"><div class="b-empty-icon">💝</div>갖고 싶은 것을 추가해보세요</div>',
    '</div>',

  ].join('');
}

// ── 도구 탭 ──
function renderBudgetTools() {
  var w52done = _budget.challenge_52week || [];
  var w52total = w52done.reduce(function(s,w){ return s+w*1000; },0);

  return [
    // 더치페이
    '<div class="b-card">',
      '<div class="b-card-title">🧮 더치페이 계산기</div>',
      '<div style="display:flex;gap:8px;margin-bottom:10px">',
        '<input id="dutch_total" type="number" placeholder="총 금액" class="b-input" style="flex:2;margin:0" inputmode="numeric">',
        '<input id="dutch_people" type="number" placeholder="인원" class="b-input" style="flex:1;margin:0" inputmode="numeric">',
        '<button onclick="calcDutch()" style="padding:0 14px;background:var(--gold);border:none;border-radius:12px;color:#0a0a0f;font-weight:800;cursor:pointer;font-size:13px;font-family:inherit">계산</button>',
      '</div>',
      '<div id="dutch_result"></div>',
    '</div>',

    // 환율
    '<div class="b-card">',
      '<div class="b-card-title">💱 환율 계산기 <span style="font-size:10px;color:var(--text-muted)">기준 환율 적용</span></div>',
      '<div style="display:flex;gap:8px;margin-bottom:10px">',
        '<select id="currency_from" class="b-input" style="flex:1;margin:0">',
          '<option value="1385">USD (1달러=1,385원)</option>',
          '<option value="9.2">JPY (100엔=920원)</option>',
          '<option value="1490">EUR (1유로=1,490원)</option>',
          '<option value="175">CNY (1위안=175원)</option>',
        '</select>',
        '<input id="currency_amount" type="number" placeholder="금액" class="b-input" style="flex:1;margin:0" inputmode="numeric">',
        '<button onclick="calcCurrency()" style="padding:0 14px;background:#60a5fa;border:none;border-radius:12px;color:#fff;font-weight:800;cursor:pointer;font-size:13px;font-family:inherit">환산</button>',
      '</div>',
      '<div id="currency_result"></div>',
    '</div>',

    // 52주 챌린지
    '<div class="b-card">',
      '<div class="b-card-title">🏆 52주 저축 챌린지 <span style="font-size:11px;color:var(--text-muted)">목표: 1,378,000원</span></div>',
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">완료한 주를 탭해서 체크하세요! (' + w52done.length + '/52주 · ' + w52total.toLocaleString() + '원)</div>',
      '<div class="week52-grid">',
        Array.from({length:52},function(_,i){
          var w = i+1;
          var done = w52done.indexOf(w) !== -1;
          return '<div class="w52-cell ' + (done?'w52-done':'w52-todo') + '" onclick="toggleW52(' + w + ')" title="' + w + '주 · ' + (w*1000).toLocaleString() + '원">' + w + '</div>';
        }).join(''),
      '</div>',
    '</div>',

    // 예산 설정
    '<div class="b-card">',
      '<div class="b-card-title">⚙️ 이번달 예산 설정</div>',
      '<div style="display:flex;gap:8px">',
        '<input id="budget_limit" type="number" placeholder="월 예산 (원)" class="b-input" style="flex:1;margin:0" value="' + (_budget.settings.monthly_budget||'') + '" inputmode="numeric">',
        '<button onclick="saveBudgetLimit()" style="padding:0 16px;background:var(--gold);border:none;border-radius:12px;color:#0a0a0f;font-weight:800;cursor:pointer;font-family:inherit">저장</button>',
      '</div>',
    '</div>',

    // CSV 내보내기
    window._authToken ? [
      '<div class="b-card" style="cursor:pointer" onclick="exportBudgetCSV()">',
        '<div style="text-align:center;color:var(--text);font-size:14px;font-weight:700">💾 거래 내역 CSV로 내보내기</div>',
        '<div style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:4px">전체 내역을 엑셀 파일로 다운로드</div>',
      '</div>',
    ].join('') : '',

  ].join('');
}

// ── 도구 함수들 ──
function calcDutch() {
  var total = parseInt(document.getElementById('dutch_total').value);
  var people = parseInt(document.getElementById('dutch_people').value);
  var el = document.getElementById('dutch_result');
  if (!total || !people || people < 1) { el.innerHTML = ''; return; }
  var per = Math.ceil(total / people);
  el.innerHTML = '<div class="tool-result"><div class="tool-result-label">1인당 금액</div><div class="tool-result-amount">' + per.toLocaleString() + '원</div></div>';
}

function calcCurrency() {
  var rate = parseFloat(document.getElementById('currency_from').value);
  var amount = parseFloat(document.getElementById('currency_amount').value);
  var el = document.getElementById('currency_result');
  if (!amount) { el.innerHTML = ''; return; }
  var result = Math.round(amount * rate);
  el.innerHTML = '<div class="tool-result"><div class="tool-result-label">한국 원화</div><div class="tool-result-amount">' + result.toLocaleString() + '원</div></div>';
}

function toggleW52(week) {
  var idx = _budget.challenge_52week.indexOf(week);
  if (idx === -1) _budget.challenge_52week.push(week);
  else _budget.challenge_52week.splice(idx, 1);
  saveBudget();
  renderBudgetTab();
}

function saveBudgetLimit() {
  var val = parseInt(document.getElementById('budget_limit').value);
  if (!isNaN(val)) {
    _budget.settings.monthly_budget = val;
    saveBudget();
    if (typeof showToast === 'function') showToast('예산이 설정됐어요! 🎯');
    renderBudgetTab();
  }
}

async function exportBudgetCSV() {
  if (!window._authToken) return;
  window.location.href = '/api/budget/export';
}

// ── 재정 건강 점수 ──
function calcHealthScore() {
  var s = getMonthSummary();
  var score = 50;
  var badges = [];
  if (s.income > 0) {
    var saveRate = (s.income - s.expense) / s.income;
    if (saveRate >= 0.3) { score += 20; badges.push('저축률 우수'); }
    else if (saveRate >= 0.1) { score += 10; badges.push('저축률 양호'); }
  }
  var budget = _budget.settings.monthly_budget;
  if (budget > 0 && s.expense <= budget) { score += 15; badges.push('예산 준수'); }
  if (getMonthTx().filter(function(t){ return t.tag==='impulse'; }).length < 3) { score += 15; badges.push('소비 안정'); }
  score = Math.min(100, score);
  var label = score >= 80 ? '매우 좋음 🌟' : score >= 60 ? '좋음 😊' : score >= 40 ? '보통 😐' : '개선 필요 💪';
  return { total: score, label: label, badges: badges };
}

// ── 입력 폼 ──
function openBudgetForm(editId) {
  _budgetEditId = editId || null;
  _budgetFormTag = '';
  _budgetFormCat = '';
  var form = document.getElementById('budgetFormOverlay');
  var today = new Date().toISOString().split('T')[0];

  if (editId) {
    var tx = _budget.transactions.find(function(t){ return t.id === editId; });
    if (tx) {
      setBudgetType(tx.type);
      document.getElementById('bAmount').value = tx.amount;
      document.getElementById('bName').value = tx.name;
      document.getElementById('bDate').value = tx.date;
      document.getElementById('bMemo').value = tx.memo || '';
      _budgetFormCat = tx.category;
      _budgetFormTag = tx.tag || '';
    }
  } else {
    setBudgetType('expense');
    document.getElementById('bAmount').value = '';
    document.getElementById('bName').value = '';
    document.getElementById('bDate').value = today;
    document.getElementById('bMemo').value = '';
  }

  renderCatGrid();
  document.getElementById('budgetFormTitle').textContent = editId ? '내역 수정' : '내역 추가';
  form.classList.add('show');
}

function closeBudgetForm() {
  document.getElementById('budgetFormOverlay').classList.remove('show');
}

function setBudgetType(type) {
  _budgetFormType = type;
  _budgetFormCat = '';
  document.getElementById('btnExpense').classList.toggle('active', type === 'expense');
  document.getElementById('btnIncome').classList.toggle('active', type === 'income');
  renderCatGrid();
}

function renderCatGrid() {
  var cats = _budgetFormType === 'income' ? BUDGET_CATS_INCOME : BUDGET_CATS_EXPENSE;
  var grid = document.getElementById('bCatGrid');
  if (!grid) return;
  grid.innerHTML = cats.map(function(c) {
    return '<div class="cat-select-item' + (_budgetFormCat===c.id?' selected':'') + '" onclick="selectCat(\'' + c.id + '\')">' +
      '<div class="cat-emoji">' + c.icon + '</div>' +
      '<div class="cat-label">' + c.label + '</div>' +
    '</div>';
  }).join('');
}

function selectCat(id) {
  _budgetFormCat = id;
  renderCatGrid();
}

function selectBudgetTag(tag) {
  _budgetFormTag = tag;
  ['plan','impulse','fixed',''].forEach(function(t) {
    var el = document.getElementById('tag' + (t===''?'None':t.charAt(0).toUpperCase()+t.slice(1)));
    if (el) el.classList.toggle('selected', t === tag);
  });
}

function submitBudgetTx() {
  var amount = parseInt(document.getElementById('bAmount').value);
  var name = document.getElementById('bName').value.trim();
  var date = document.getElementById('bDate').value;
  var memo = document.getElementById('bMemo').value.trim();

  if (!amount || amount <= 0) { if(typeof showToast==='function') showToast('금액을 입력해주세요', '#c97b4c'); return; }
  if (!name) { if(typeof showToast==='function') showToast('내용을 입력해주세요', '#c97b4c'); return; }
  if (!date) { if(typeof showToast==='function') showToast('날짜를 선택해주세요', '#c97b4c'); return; }

  if (_budgetEditId) {
    var idx = _budget.transactions.findIndex(function(t){ return t.id === _budgetEditId; });
    if (idx !== -1) {
      _budget.transactions[idx] = Object.assign(_budget.transactions[idx], {
        type: _budgetFormType, amount: amount, name: name,
        category: _budgetFormCat || 'etc', date: date, memo: memo, tag: _budgetFormTag
      });
    }
  } else {
    _budget.transactions.push({
      id: Date.now().toString(),
      type: _budgetFormType, amount: amount, name: name,
      category: _budgetFormCat || (_budgetFormType==='income'?'salary':'etc'),
      date: date, memo: memo, tag: _budgetFormTag
    });
  }

  saveBudget();
  closeBudgetForm();
  renderBudgetTab();
  if (typeof showToast === 'function') showToast(_budgetEditId ? '내역이 수정됐어요!' : '내역이 추가됐어요! 💵');
}

function editBudgetTx(id) {
  openBudgetForm(id);
}

// ── 자산 탭 입력 (심플 팝업) ──
function openAddAccount() {
  var name = prompt('계좌/카드 이름을 입력하세요 (예: 토스뱅크)');
  if (!name) return;
  var icon = prompt('아이콘 이모지를 입력하세요', '🏦');
  var balance = parseInt(prompt('잔액을 입력하세요 (원)', '0'));
  var isDebt = confirm('부채(신용카드 등)인가요?');
  if (isNaN(balance)) return;
  _budget.accounts.push({ id: Date.now().toString(), name: name, icon: icon||'🏦', balance: Math.abs(balance), is_debt: isDebt });
  saveBudget();
  renderBudgetTab();
}

function openAddGoal() {
  var name = prompt('목표 이름을 입력하세요 (예: 유럽여행)');
  if (!name) return;
  var icon = prompt('아이콘 이모지', '🎯');
  var target = parseInt(prompt('목표 금액 (원)'));
  var current = parseInt(prompt('현재 모은 금액 (원)', '0'));
  var deadline = prompt('목표 기간 (예: 2026.12)', '');
  if (isNaN(target)) return;
  _budget.goals.push({ id: Date.now().toString(), name: name, icon: icon||'🎯', target: target, current: current||0, deadline: deadline||'' });
  saveBudget();
  renderBudgetTab();
}

function openAddWish() {
  var name = prompt('원하는 것의 이름을 입력하세요');
  if (!name) return;
  var price = parseInt(prompt('가격 (원)'));
  var saved = parseInt(prompt('현재 모은 금액 (원)', '0'));
  if (isNaN(price)) return;
  _budget.wishlist.push({ id: Date.now().toString(), name: name, price: price, saved: saved||0 });
  saveBudget();
  renderBudgetTab();
}

// ── navTo 연결 ──
var _origNavTo = window.navTo;
window.navTo = function(id) {
  if (id === 'budget') {
    ['home','cal','stats','focus','more','budget'].forEach(function(n) {
      var el = document.getElementById('nav' + n.charAt(0).toUpperCase() + n.slice(1));
      if (el) el.classList.remove('active');
    });
    var bNav = document.getElementById('navBudget');
    if (bNav) bNav.classList.add('active');
    openBudget();
    return;
  }
  // 가계부 닫기
  var page = document.getElementById('budgetPage');
  if (page && page.classList.contains('show')) closeBudget();
  if (_origNavTo) _origNavTo(id);
};

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', function() {
  loadBudget();
});

// ════════════════════════════════════════
// ── 앱 잠금 (PIN) ──
// ════════════════════════════════════════
var _pinBuffer = '';
var _pinMode = 'check'; // check | set | confirm

function initPinLock() {
  var pin = localStorage.getItem('mp_pin');
  if (pin) {
    _pinMode = 'check';
    document.getElementById('pinLabel').textContent = 'PIN을 입력하세요';
    document.getElementById('pinOverlay').classList.add('show');
  }
}

function pinInput(n) {
  if (_pinBuffer.length >= 4) return;
  _pinBuffer += String(n);
  updatePinDots();
  if (_pinBuffer.length === 4) {
    setTimeout(function() { processPinInput(); }, 150);
  }
}

function pinDelete() {
  _pinBuffer = _pinBuffer.slice(0, -1);
  updatePinDots();
}

function updatePinDots(error) {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById('pd' + i);
    dot.className = 'pin-dot';
    if (error) dot.classList.add('error');
    else if (i < _pinBuffer.length) dot.classList.add('filled');
  }
}

function processPinInput() {
  var pin = localStorage.getItem('mp_pin');
  if (_pinMode === 'check') {
    if (_pinBuffer === pin) {
      document.getElementById('pinOverlay').classList.remove('show');
      _pinBuffer = '';
    } else {
      updatePinDots(true);
      document.getElementById('pinLabel').textContent = '잘못된 PIN이에요. 다시 입력하세요';
      setTimeout(function() { _pinBuffer = ''; updatePinDots(); }, 800);
    }
  } else if (_pinMode === 'set') {
    window._pinTemp = _pinBuffer;
    _pinMode = 'confirm';
    _pinBuffer = '';
    updatePinDots();
    document.getElementById('pinLabel').textContent = 'PIN을 한 번 더 입력하세요';
  } else if (_pinMode === 'confirm') {
    if (_pinBuffer === window._pinTemp) {
      localStorage.setItem('mp_pin', _pinBuffer);
      document.getElementById('pinOverlay').classList.remove('show');
      _pinBuffer = '';
      _pinMode = 'check';
      if (typeof showToast === 'function') showToast('PIN이 설정됐어요! 🔒');
    } else {
      updatePinDots(true);
      document.getElementById('pinLabel').textContent = '일치하지 않아요. 처음부터 다시';
      setTimeout(function() { _pinMode = 'set'; _pinBuffer = ''; updatePinDots(); document.getElementById('pinLabel').textContent = '새 PIN 4자리를 입력하세요'; }, 1000);
    }
  }
}

function openPinSetting() {
  _pinMode = 'set';
  _pinBuffer = '';
  updatePinDots();
  document.getElementById('pinLabel').textContent = '새 PIN 4자리를 입력하세요';
  document.getElementById('pinOverlay').classList.add('show');
}

function removePinLock() {
  localStorage.removeItem('mp_pin');
  if (typeof showToast === 'function') showToast('PIN 잠금이 해제됐어요');
}

// ════════════════════════════════════════
// ── 사진 갤러리 ──
// ════════════════════════════════════════
function openGallery() {
  var grid = document.getElementById('galleryGrid');
  var photos = [];

  // localStorage에서 미션 상태 수집
  var calData = getCalData ? getCalData() : {};
  var missionState = {};
  try { missionState = JSON.parse(localStorage.getItem('mp_daily_state') || '{}'); } catch(e) {}

  // previewUrl 수집
  Object.keys(missionState).forEach(function(id) {
    var s = missionState[id];
    if (s && s.previewUrl) {
      photos.push({ url: s.previewUrl, name: s.fileName || '사진', date: new Date().toLocaleDateString('ko-KR') });
    }
  });

  if (!grid) return;

  if (photos.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,.4);font-size:14px">아직 업로드한 사진이 없어요<br>사진 미션을 완료하면 여기에 모여요 📸</div>';
  } else {
    grid.innerHTML = photos.map(function(p, i) {
      return '<div class="gallery-cell" onclick="openGalleryFull(' + i + ')">' +
        '<img src="' + p.url + '" alt="">' +
        '<div class="gallery-cell-label">' + p.date + '</div>' +
      '</div>';
    }).join('');
  }

  window._galleryPhotos = photos;
  document.getElementById('galleryOverlay').classList.add('show');
}

function closeGallery() {
  document.getElementById('galleryOverlay').classList.remove('show');
}

function openGalleryFull(idx) {
  var p = (window._galleryPhotos || [])[idx];
  if (!p) return;
  document.getElementById('galleryFullImg').src = p.url;
  document.getElementById('galleryFullCaption').textContent = p.name + ' · ' + p.date;
  document.getElementById('galleryFullscreen').classList.add('show');
}

function closeGalleryFull() {
  document.getElementById('galleryFullscreen').classList.remove('show');
}

// ════════════════════════════════════════
// ── 도움말 ──
// ════════════════════════════════════════
function openHelp() {
  document.getElementById('helpModal').classList.add('show');
}
function closeHelp() {
  document.getElementById('helpModal').classList.remove('show');
}

// ════════════════════════════════════════
// ── 시스템 테마 연동 ──
// ════════════════════════════════════════
function initSystemTheme() {
  var saved = localStorage.getItem('mp_theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
  } else if (!saved) {
    // 시스템 테마 감지
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.body.classList.add('light');
      var btn2 = document.getElementById('themeToggle');
      if (btn2) btn2.textContent = '☀️';
    }
    // 변경 감지 리스너
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
      if (!localStorage.getItem('mp_theme')) {
        document.body.classList.toggle('light', e.matches);
        var btn3 = document.getElementById('themeToggle');
        if (btn3) btn3.textContent = e.matches ? '☀️' : '🌙';
      }
    });
  }
}

// ════════════════════════════════════════
// ── 메모장 ──
// ════════════════════════════════════════
var _memos = [];
var _currentMemoId = null;

function getMemos() {
  try { return JSON.parse(localStorage.getItem('mp_memos') || '[]'); } catch(e) { return []; }
}
function saveMemos(m) { localStorage.setItem('mp_memos', JSON.stringify(m)); }

function openMemo() {
  _memos = getMemos();
  document.getElementById('memoOverlay').classList.add('show');
  document.getElementById('memoEditor').classList.remove('show');
  document.getElementById('memoList').style.display = '';
  document.getElementById('memoAddBtn').style.display = '';
  document.getElementById('memoHeaderTitle').textContent = '📝 메모장';
  renderMemoList();
}

function closeMemo() {
  document.getElementById('memoOverlay').classList.remove('show');
}

function renderMemoList() {
  var list = document.getElementById('memoList');
  if (!list) return;
  _memos = getMemos();
  if (!_memos.length) {
    list.innerHTML = '<div style="text-align:center;padding:48px 0;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:10px">📝</div>아직 메모가 없어요<br>+ 새 메모 버튼을 눌러보세요</div>';
    return;
  }
  list.innerHTML = _memos.sort(function(a,b){ return b.updated.localeCompare(a.updated); }).map(function(m) {
    return '<div class="memo-item" onclick="openMemoEdit(\'' + m.id + '\')">' +
      '<div class="memo-item-title">' + (m.title || '제목 없음') + '</div>' +
      '<div class="memo-item-preview">' + (m.body || '') + '</div>' +
      '<div class="memo-item-date">' + m.updated.slice(0,10) + '</div>' +
    '</div>';
  }).join('');
}

function newMemo() {
  _currentMemoId = Date.now().toString();
  document.getElementById('memoTitleInput').value = '';
  document.getElementById('memoBodyInput').value = '';
  document.getElementById('memoList').style.display = 'none';
  document.getElementById('memoAddBtn').style.display = 'none';
  document.getElementById('memoHeaderTitle').textContent = '새 메모';
  document.getElementById('memoEditor').classList.add('show');
  document.getElementById('memoTitleInput').focus();
}

function openMemoEdit(id) {
  _memos = getMemos();
  var m = _memos.find(function(x){ return x.id === id; });
  if (!m) return;
  _currentMemoId = id;
  document.getElementById('memoTitleInput').value = m.title || '';
  document.getElementById('memoBodyInput').value = m.body || '';
  document.getElementById('memoList').style.display = 'none';
  document.getElementById('memoAddBtn').style.display = 'none';
  document.getElementById('memoHeaderTitle').textContent = '메모 편집';
  document.getElementById('memoEditor').classList.add('show');
}

function saveMemoEdit() {
  _memos = getMemos();
  var title = document.getElementById('memoTitleInput').value.trim();
  var body = document.getElementById('memoBodyInput').value.trim();
  var idx = _memos.findIndex(function(x){ return x.id === _currentMemoId; });
  var now = new Date().toISOString();
  if (idx !== -1) {
    _memos[idx].title = title;
    _memos[idx].body = body;
    _memos[idx].updated = now;
  } else {
    _memos.push({ id: _currentMemoId, title: title, body: body, created: now, updated: now });
  }
  saveMemos(_memos);
  backToMemoList();
  if (typeof showToast === 'function') showToast('메모가 저장됐어요 📝');
}

function deleteMemo() {
  if (!confirm('이 메모를 삭제할까요?')) return;
  _memos = getMemos();
  _memos = _memos.filter(function(x){ return x.id !== _currentMemoId; });
  saveMemos(_memos);
  backToMemoList();
}

function backToMemoList() {
  document.getElementById('memoEditor').classList.remove('show');
  document.getElementById('memoList').style.display = '';
  document.getElementById('memoAddBtn').style.display = '';
  document.getElementById('memoHeaderTitle').textContent = '📝 메모장';
  renderMemoList();
}

// ════════════════════════════════════════
// ── 가계부: 정기 지출 자동화 ──
// ════════════════════════════════════════
function autoAddRecurring() {
  var subs = (_budget && _budget.subscriptions) || [];
  if (!subs.length) return;
  var now = new Date();
  var key = 'mp_recurring_' + now.getFullYear() + '_' + (now.getMonth()+1);
  if (localStorage.getItem(key)) return;
  subs.forEach(function(s) {
    if (s.auto_add) {
      (_budget.transactions || []).push({
        id: Date.now().toString() + Math.random(),
        type: 'expense', amount: s.amount, name: s.name,
        category: 'sub', date: now.toISOString().slice(0,10),
        memo: '정기 지출 자동 추가', tag: 'fixed'
      });
    }
  });
  localStorage.setItem(key, '1');
  if (typeof saveBudget === 'function') saveBudget();
}

// ════════════════════════════════════════
// ── 가계부: 예산 초과 알림 ──
// ════════════════════════════════════════
function checkBudgetAlert(newAmount) {
  var budget = (_budget && _budget.settings && _budget.settings.monthly_budget) || 0;
  if (!budget) return;
  var now = new Date();
  var monthTx = (_budget.transactions || []).filter(function(t) {
    var d = new Date(t.date);
    return t.type==='expense' && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  });
  var total = monthTx.reduce(function(s,t){ return s+t.amount; },0) + newAmount;
  var pct = total / budget;
  if (pct >= 1 && typeof showToast === 'function') {
    showToast('⚠️ 이번달 예산을 초과했어요!', '#f87171');
  } else if (pct >= 0.8 && typeof showToast === 'function') {
    showToast('⚡ 예산의 80%를 사용했어요. 주의하세요!', '#fb923c');
  }
}

// ════════════════════════════════════════
// ── 가계부: 연간 통계 ──
// ════════════════════════════════════════
function renderBudgetAnnual() {
  var year = new Date().getFullYear();
  var months = Array.from({length:12},function(_,i){ return i+1; });
  var monthLabels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var incomes = months.map(function(m) {
    return (_budget.transactions||[]).filter(function(t){
      var d=new Date(t.date); return t.type==='income' && d.getFullYear()===year && d.getMonth()+1===m;
    }).reduce(function(s,t){return s+t.amount;},0);
  });
  var expenses = months.map(function(m) {
    return (_budget.transactions||[]).filter(function(t){
      var d=new Date(t.date); return t.type==='expense' && d.getFullYear()===year && d.getMonth()+1===m;
    }).reduce(function(s,t){return s+t.amount;},0);
  });
  var maxVal = Math.max(1, Math.max.apply(null, incomes.concat(expenses)));
  var totalIncome = incomes.reduce(function(s,x){return s+x;},0);
  var totalExpense = expenses.reduce(function(s,x){return s+x;},0);

  return '<div class="b-card">' +
    '<div class="b-card-title">📈 ' + year + '년 연간 통계</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">' +
      '<div style="background:var(--surface);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">연 수입</div><div style="font-size:14px;font-weight:800;color:#34d399">' + (totalIncome/10000).toFixed(0) + '만원</div></div>' +
      '<div style="background:var(--surface);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">연 지출</div><div style="font-size:14px;font-weight:800;color:#f87171">' + (totalExpense/10000).toFixed(0) + '만원</div></div>' +
      '<div style="background:var(--surface);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">연 저축</div><div style="font-size:14px;font-weight:800;color:var(--gold)">' + ((totalIncome-totalExpense)/10000).toFixed(0) + '만원</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;align-items:flex-end;height:90px">' +
      months.map(function(m,i) {
        var inH = Math.round((incomes[i]/maxVal)*80);
        var exH = Math.round((expenses[i]/maxVal)*80);
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%;justify-content:flex-end">' +
          '<div style="width:100%;border-radius:3px 3px 0 0;height:' + inH + 'px;background:#34d399;opacity:.7"></div>' +
          '<div style="width:100%;border-radius:3px 3px 0 0;height:' + exH + 'px;background:#f87171;opacity:.7;margin-top:1px"></div>' +
          '<div style="font-size:8px;color:var(--text-muted)">' + monthLabels[i].replace('월','') + '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;gap:12px;margin-top:8px"><span style="font-size:10px;color:#34d399">■ 수입</span><span style="font-size:10px;color:#f87171">■ 지출</span></div>' +
  '</div>';
}

// ════════════════════════════════════════
// ── 30일 챌린지 (프리미엄) ──
// ════════════════════════════════════════
var CHALLENGE_PLANS = [
  { id:'health', icon:'💪', name:'건강 챌린지', desc:'매일 몸을 움직이고 건강을 챙겨요', color:'#34d399',
    missions: ['스트레칭 5분','물 2L 마시기','10분 산책','계단 이용하기','야채 한 접시','일찍 자기','8시간 수면','가벼운 운동','건강한 아침식사','휴식 시간 갖기','명상 5분','깊게 호흡하기','규칙적인 식사','과자 없는 하루','물 충분히 마시기','30분 걷기','스트레칭 루틴','수면 전 스마트폰 끄기','비타민 챙기기','몸 상태 체크하기','근력 운동','균형 잡힌 식단','피부 관리','족욕하기','일찍 일어나기','오전 운동','저녁 산책','핵심 근육 운동','수분 보충','한 달 완료 축하!']
  },
  { id:'gratitude', icon:'🙏', name:'감사 챌린지', desc:'매일 감사함을 기록하고 마음을 채워요', color:'#c9a84c',
    missions: ['감사한 것 3가지 적기','소중한 사람에게 연락','오늘의 좋은 일 기록','칭찬 메모 작성','자연에 감사하기','음식에 감사하기','건강에 감사하기','가족에게 감사 표현','친구에게 감사 메시지','오늘 행운 찾기','작은 기쁨 발견하기','감사 편지 쓰기','도움받은 것 기록','긍정적 생각 10가지','오늘 웃은 순간','좋아하는 것 목록','나의 능력에 감사','오늘의 성취 기록','주변 아름다움 찾기','감사 일기 쓰기','소중한 추억 떠올리기','나에게 감사하기','오늘의 배움에 감사','삶의 풍요로움 기록','감사 명언 찾기','감사 습관 돌아보기','소소한 행복 기록','감사 표현 실천','감사의 파급 효과 생각','한 달 감사 여정 완료!']
  },
  { id:'creative', icon:'🎨', name:'창의 챌린지', desc:'매일 창의력을 자극하는 활동을 해요', color:'#a78bfa',
    missions: ['낙서하기','시 한 줄 쓰기','새로운 레시피 시도','다른 길로 출퇴근','손편지 쓰기','사진 한 장 찍기','노래 흥얼거리기','상상일기 쓰기','색칠하기','새 음악 장르 듣기','이야기 시작하기','DIY 프로젝트','마인드맵 그리기','새로운 언어 단어','꿈 일기 쓰기','요리 창작하기','방 재배치하기','새 취미 시도','단편소설 아이디어','춤 동작 만들기','자연물로 예술','감정을 색으로','하루 주제 정하기','콜라주 만들기','새 스타일 시도','음악 플레이리스트','창작 시간 갖기','미래 편지 쓰기','창의력 돌아보기','창의 챌린지 완료!']
  },
  { id:'mindfulness', icon:'🧘', name:'마음챙김 챌린지', desc:'매일 마음을 돌보고 내면의 평화를 찾아요', color:'#60a5fa',
    missions: ['5분 명상','감정 일기','디지털 디톡스 1시간','자연 속 시간','호흡법 연습','긍정 확언','마음 챙김 식사','감사 명상','바디 스캔','자기 연민 연습','현재 순간 집중','판단 없이 관찰','마음 챙김 걷기','소음 없는 시간','자기 돌봄 시간','감정 수용하기','스트레스 해소법','평화로운 공간 만들기','마음 챙김 대화','내면의 소리 듣기','자기 이해 넓히기','비교하지 않기','자신을 용서하기','경계 설정하기','나만의 의식 만들기','내면 아이 돌보기','자기 신뢰 키우기','마음 챙김 독서','삶의 가치 확인','마음챙김 한 달 완료!']
  },
];

var _activeChallengeId = null;

function openChallengeOverlay() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  renderChallengeContent();
  document.getElementById('challengeOverlay').classList.add('show');
}
function closeChallengeOverlay() {
  document.getElementById('challengeOverlay').classList.remove('show');
}

function renderChallengeContent() {
  var el = document.getElementById('challengeContent');
  if (!el) return;
  var active = localStorage.getItem('mp_challenge_active');
  var activeData = active ? JSON.parse(active) : null;
  var doneDays = activeData ? (activeData.done || []) : [];
  var today = new Date().toDateString();

  if (activeData) {
    var plan = CHALLENGE_PLANS.find(function(p){ return p.id === activeData.planId; });
    var startDate = new Date(activeData.startDate);
    var daysSince = Math.floor((Date.now() - startDate.getTime()) / 86400000);
    var todayDone = doneDays.indexOf(today) !== -1;

    el.innerHTML = [
      '<div class="challenge-plan active">',
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">',
          '<span style="font-size:28px">' + plan.icon + '</span>',
          '<div><div style="font-size:14px;font-weight:700;color:var(--text)">' + plan.name + '</div>',
          '<div style="font-size:11px;color:var(--text-muted)">' + doneDays.length + '/30일 완료 · ' + daysSince + '일째 진행 중</div></div>',
        '</div>',
        '<div class="challenge-prog-grid">',
          Array.from({length:30}, function(_,i) {
            var d = new Date(startDate); d.setDate(d.getDate()+i);
            var isDone = doneDays.length > i;
            var isToday = d.toDateString() === today;
            return '<div class="ch-day ' + (isDone?'ch-done':isToday?'ch-today':'ch-todo') + '">' + (i+1) + '</div>';
          }).join(''),
        '</div>',
        !todayDone ? '<div style="margin-top:12px"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">오늘의 미션:</div><div style="font-size:13px;font-weight:700;color:var(--text)">📌 ' + (plan.missions[doneDays.length] || '모든 미션 완료!') + '</div></div>' : '',
        '<div style="display:flex;gap:8px;margin-top:12px">',
          !todayDone ? '<button onclick="completeChallengeDay()" style="flex:1;padding:10px;background:linear-gradient(135deg,var(--gold),var(--gold-light));border:none;border-radius:10px;color:#0a0a0f;font-weight:700;cursor:pointer;font-family:inherit">✓ 오늘 완료</button>' : '<div style="flex:1;text-align:center;color:#34d399;font-size:13px;font-weight:700;padding:10px">오늘 미션 완료! ✅</div>',
          '<button onclick="quitChallenge()" style="padding:10px 14px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);cursor:pointer;font-family:inherit">포기</button>',
        '</div>',
      '</div>',
    ].join('');
  } else {
    el.innerHTML = CHALLENGE_PLANS.map(function(p) {
      return '<div class="challenge-plan" onclick="startChallenge(\'' + p.id + '\')">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:28px">' + p.icon + '</span>' +
          '<div><div style="font-size:14px;font-weight:700;color:var(--text)">' + p.name + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted)">' + p.desc + '</div></div>' +
        '</div>' +
        '<div style="font-size:11px;color:' + p.color + ';margin-top:8px;font-weight:700">→ 챌린지 시작하기</div>' +
      '</div>';
    }).join('');
  }
}

function startChallenge(planId) {
  if (!confirm('이 챌린지를 시작할까요? 30일 동안 매일 미션을 완료해야 해요!')) return;
  localStorage.setItem('mp_challenge_active', JSON.stringify({
    planId: planId, startDate: new Date().toISOString(), done: []
  }));
  renderChallengeContent();
  if (typeof showToast === 'function') showToast('🏆 30일 챌린지 시작! 화이팅!');
}

function completeChallengeDay() {
  var active = localStorage.getItem('mp_challenge_active');
  if (!active) return;
  var data = JSON.parse(active);
  var today = new Date().toDateString();
  if (data.done.indexOf(today) === -1) {
    data.done.push(today);
    localStorage.setItem('mp_challenge_active', JSON.stringify(data));
    if (typeof addXP === 'function') addXP(10);
    if (typeof showToast === 'function') showToast('✅ 오늘 챌린지 완료! +10 XP');
    if (data.done.length >= 30 && typeof showToast === 'function') {
      setTimeout(function() { showToast('🎉 30일 챌린지 완주! 대단해요!'); }, 1000);
    }
  }
  renderChallengeContent();
}

function quitChallenge() {
  if (!confirm('챌린지를 포기할까요? 진행 기록이 삭제돼요.')) return;
  localStorage.removeItem('mp_challenge_active');
  renderChallengeContent();
}

// ════════════════════════════════════════
// ── 미션 즐겨찾기 (프리미엄) ──
// ════════════════════════════════════════
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('mp_favorites') || '[]'); } catch(e) { return []; }
}
function toggleFavorite(missionId) {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  var favs = getFavorites();
  var id = String(missionId);
  var idx = favs.indexOf(id);
  if (idx !== -1) { favs.splice(idx, 1); if (typeof showToast === 'function') showToast('즐겨찾기 해제됐어요'); }
  else { favs.push(id); if (typeof showToast === 'function') showToast('⭐ 즐겨찾기에 추가됐어요!'); }
  localStorage.setItem('mp_favorites', JSON.stringify(favs));
  if (typeof renderMissions === 'function') renderMissions();
}
function isFavorite(missionId) {
  return getFavorites().indexOf(String(missionId)) !== -1;
}

// ════════════════════════════════════════
// ── 날씨 기반 미션 (프리미엄) ──
// ════════════════════════════════════════
var WEATHER_MISSIONS = {
  sunny: [
    {icon:'🌅', name:'오늘의 하늘 사진', desc:'맑은 하늘을 사진으로 담아보세요', type:'photo', placeholder:''},
    {icon:'🚴', name:'야외 자전거 타기', desc:'좋은 날씨에 자전거로 바람을 느껴보세요', type:'check', placeholder:''},
    {icon:'🌳', name:'공원 산책 30분', desc:'맑은 날씨를 만끽하며 공원을 걸어보세요', type:'check', placeholder:''},
  ],
  cloudy: [
    {icon:'📖', name:'책 한 챕터 읽기', desc:'흐린 날엔 독서가 제격이에요', type:'text', placeholder:'읽은 내용은?'},
    {icon:'🎨', name:'실내 창작 활동', desc:'그림 그리기, 만들기 등 창의 활동을 해보세요', type:'photo', placeholder:''},
    {icon:'☕', name:'따뜻한 음료 즐기기', desc:'흐린 날씨에 따뜻한 음료 한 잔 어떤가요?', type:'photo', placeholder:''},
  ],
  rainy: [
    {icon:'🌧️', name:'빗소리 명상', desc:'빗소리를 들으며 10분 명상해보세요', type:'check', placeholder:''},
    {icon:'📝', name:'오늘의 감정 일기', desc:'비 오는 날 감정을 솔직하게 적어보세요', type:'text', placeholder:'오늘 기분은?'},
    {icon:'🍜', name:'따뜻한 음식 만들기', desc:'비 오는 날엔 따뜻한 음식이 최고예요', type:'photo', placeholder:''},
  ],
  snowy: [
    {icon:'❄️', name:'눈 오는 풍경 사진', desc:'특별한 설경을 사진으로 남겨보세요', type:'photo', placeholder:''},
    {icon:'🧦', name:'따뜻하게 입기', desc:'두꺼운 양말과 따뜻한 옷차림 체크!', type:'check', placeholder:''},
    {icon:'📺', name:'영화 한 편 감상', desc:'눈 오는 날 영화 감상으로 힐링해요', type:'text', placeholder:'감상한 영화는?'},
  ],
};

var _weatherMissions = null;

async function loadWeatherMissions() {
  if (!_isPremium) return;
  var weatherSection = document.getElementById('weatherMissionSection');
  if (!weatherSection) return;

  try {
    // Open-Meteo API (무료, 인천 기본)
    var lat = 37.46; var lon = 126.71;
    var res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=weathercode,temperature_2m&timezone=Asia/Seoul');
    var data = await res.json();
    var code = data.current.weathercode;
    var temp = data.current.temperature_2m;

    var weatherType = 'sunny';
    if (code >= 51 && code <= 99) weatherType = 'rainy';
    else if (code >= 71 && code <= 77) weatherType = 'snowy';
    else if (code >= 1 && code <= 3) weatherType = 'cloudy';

    var weatherEmoji = {sunny:'☀️', cloudy:'⛅', rainy:'🌧️', snowy:'❄️'}[weatherType];
    var weatherName = {sunny:'맑음', cloudy:'흐림', rainy:'비', snowy:'눈'}[weatherType];

    _weatherMissions = WEATHER_MISSIONS[weatherType];

    weatherSection.innerHTML = [
      '<div class="weather-section">',
        '<div class="weather-top">',
          '<span class="weather-icon">' + weatherEmoji + '</span>',
          '<div class="weather-info">',
            '<h3>날씨 기반 미션 <span class="premium-badge">💎 프리미엄</span></h3>',
            '<p>' + weatherName + ' · ' + Math.round(temp) + '°C · 오늘 날씨에 딱 맞는 미션이에요</p>',
          '</div>',
        '</div>',
        _weatherMissions.map(function(m, i) {
          return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:20px">' + m.icon + '</span>' +
            '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">' + m.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + m.desc + '</div></div>' +
            '<button onclick="addWeatherMission(' + i + ')" style="padding:5px 10px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">추가</button>' +
          '</div>';
        }).join(''),
      '</div>',
    ].join('');
  } catch(e) {
    if (weatherSection) weatherSection.innerHTML = '';
  }
}

async function addWeatherMission(idx) {
  if (!_weatherMissions) return;
  var m = _weatherMissions[idx];
  try {
    var res = await fetch('/api/add_mission', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(m)
    });
    var data = await res.json();
    if (data.success) {
      MISSIONS.push(data.mission);
      if (window.state) window.state[String(data.mission.id)] = {completed:false, expanded:false, value:'', lucky:null, fileName:''};
      if (typeof saveCustomMissions === 'function') saveCustomMissions();
      if (typeof renderMissions === 'function') renderMissions();
      if (typeof showToast === 'function') showToast('"' + m.name + '" 미션 추가! ✨');
    }
  } catch(e) {}
}

// ════════════════════════════════════════
// ── 주간 리포트 (프리미엄) ──
// ════════════════════════════════════════
function renderWeeklyReport() {
  if (!_isPremium) return;
  var el = document.getElementById('weeklyReportSection');
  if (!el) return;

  var today = new Date();
  var weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  var weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

  var calData = getCalData ? getCalData() : {};
  var weekMissions = 0;
  var weekDays = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    var k = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if (calData[k] && calData[k].length > 0) {
      weekMissions += calData[k].length;
      weekDays++;
    }
  }

  var weekIncome = 0; var weekExpense = 0;
  if (_budget && _budget.transactions) {
    _budget.transactions.forEach(function(t) {
      var d = new Date(t.date);
      if (d >= weekStart && d <= weekEnd) {
        if (t.type==='income') weekIncome += t.amount;
        else weekExpense += t.amount;
      }
    });
  }

  var streak = parseInt(localStorage.getItem('mp_streak_count')||'0');
  var xp = parseInt(localStorage.getItem('mp_xp')||'0');

  var dateLabel = (weekStart.getMonth()+1) + '/' + weekStart.getDate() + ' ~ ' + (weekEnd.getMonth()+1) + '/' + weekEnd.getDate();

  el.innerHTML = [
    '<div class="weekly-section">',
      '<div class="weekly-badge">📊 주간 리포트 · ' + dateLabel + '</div>',
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">',
        '<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center">',
          '<div style="font-size:10px;color:var(--text-muted)">완료 미션</div>',
          '<div style="font-size:20px;font-weight:800;color:var(--gold)">' + weekMissions + '개</div>',
          '<div style="font-size:10px;color:var(--text-muted)">' + weekDays + '일 활동</div>',
        '</div>',
        '<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center">',
          '<div style="font-size:10px;color:var(--text-muted)">현재 스트릭</div>',
          '<div style="font-size:20px;font-weight:800;color:#f97316">🔥' + streak + '일</div>',
          '<div style="font-size:10px;color:var(--text-muted)">누적 ' + xp + ' XP</div>',
        '</div>',
        weekExpense > 0 ? '<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">이번주 지출</div><div style="font-size:16px;font-weight:800;color:#f87171">-' + (weekExpense/10000).toFixed(1) + '만원</div></div>' : '',
        weekIncome > 0 ? '<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">이번주 수입</div><div style="font-size:16px;font-weight:800;color:#34d399">+' + (weekIncome/10000).toFixed(1) + '만원</div></div>' : '',
      '</div>',
      '<div style="font-size:12px;color:rgba(167,139,250,.8);text-align:center">',
        weekMissions >= 20 ? '🌟 이번 주 정말 열심히 했어요! 대단해요!' :
        weekMissions >= 10 ? '👍 꾸준히 잘하고 있어요. 이번 주도 수고했어요!' :
        '💪 다음 주엔 더 많은 미션에 도전해봐요!',
      '</div>',
    '</div>',
  ].join('');
}

// ── 프리미엄 섹션 HTML 삽입 ──
document.addEventListener('DOMContentLoaded', function() {
  initPinLock();
  initSystemTheme();

  // 날씨 미션 & 주간 리포트 섹션 삽입
  var quoteSection = document.getElementById('quoteSection');
  if (quoteSection && quoteSection.parentNode) {
    var weatherDiv = document.createElement('div');
    weatherDiv.id = 'weatherMissionSection';
    quoteSection.parentNode.insertBefore(weatherDiv, quoteSection.nextSibling);

    var weeklyDiv = document.createElement('div');
    weeklyDiv.id = 'weeklyReportSection';
    quoteSection.parentNode.insertBefore(weeklyDiv, weatherDiv.nextSibling);
  }

  // 프리미엄 기능 초기화
  setTimeout(function() {
    if (typeof _isPremium !== 'undefined' && _isPremium) {
      loadWeatherMissions();
      renderWeeklyReport();
    }
  }, 1000);
});

// 설정 모달에 PIN, 갤러리 버튼 추가
document.addEventListener('DOMContentLoaded', function() {
  var settingsSection = document.querySelector('.settings-section');
  if (settingsSection) {
    var pinRow = document.createElement('div');
    pinRow.className = 'settings-row';
    pinRow.innerHTML = '<span>🔒 앱 PIN 잠금</span>' +
      '<div style="display:flex;gap:6px">' +
        '<button onclick="openPinSetting()" style="padding:4px 10px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;color:var(--gold);font-size:11px;cursor:pointer;font-family:inherit">설정</button>' +
        '<button onclick="removePinLock()" style="padding:4px 10px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);font-size:11px;cursor:pointer;font-family:inherit">해제</button>' +
      '</div>';
    settingsSection.appendChild(pinRow);
  }
});

// 가계부 연간 통계 탭에 추가
var _origRenderBudgetTools = window.renderBudgetTools;
if (typeof renderBudgetTools === 'function') {
  var origTools = renderBudgetTools;
  window.renderBudgetTools = function() {
    return origTools() + renderBudgetAnnual();
  };
}

// ════════════════════════════════════════
// ── 별빛(⭐) 재화 시스템 ──
// ════════════════════════════════════════
function getStars() { return parseInt(localStorage.getItem('mp_stars') || '0'); }
function addStars(n) {
  var s = getStars() + n;
  localStorage.setItem('mp_stars', String(s));
  updateStarDisplays();
  if (n > 0 && typeof showToast === 'function') showToast('⭐ 별빛 +' + n + '개 획득!');
}
function spendStars(n) {
  var s = getStars();
  if (s < n) { if(typeof showToast==='function') showToast('별빛이 부족해요! (' + s + '/' + n + '⭐)', '#c97b4c'); return false; }
  localStorage.setItem('mp_stars', String(s - n));
  updateStarDisplays();
  return true;
}
function updateStarDisplays() {
  var s = getStars();
  var els = document.querySelectorAll('#marketStarBalance, .star-balance-display');
  els.forEach(function(el) { el.textContent = s; });
}
function showStarInfo() {
  if(typeof showToast==='function') showToast('⭐ 미션 완료, 스트릭, 업적으로 별빛을 모으세요!');
}

// 별빛 획득 트리거 (미션 완료 시 연결)
window._starOnComplete = function() {
  var total = getTotalCompleted ? getTotalCompleted() : 0;
  if (total % 10 === 0) addStars(2); // 10개마다 2별
  if (total % 50 === 0) addStars(5); // 50개마다 5별
};

// ════════════════════════════════════════
// ── 습관 히트맵 (프리미엄) ──
// ════════════════════════════════════════
function openHeatmap() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  renderHeatmap();
  document.getElementById('heatmapOverlay').classList.add('show');
}
function closeHeatmap() {
  document.getElementById('heatmapOverlay').classList.remove('show');
}

function renderHeatmap() {
  var calData = getCalData ? getCalData() : {};
  var today = new Date();
  var start = new Date(today);
  start.setDate(today.getDate() - 363);
  // 일요일로 맞추기
  start.setDate(start.getDate() - start.getDay());

  var grid = document.getElementById('heatmapGrid');
  var statsEl = document.getElementById('hmStats');
  if (!grid) return;

  var totalDays = 0, totalMissions = 0, maxStreak = 0, curStreak = 0;
  var cells = [];
  var d = new Date(start);
  var prevKey = null;

  while (d <= today) {
    var key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    var count = calData[key] ? calData[key].length : 0;
    var level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
    cells.push({ key: key, count: count, level: level, future: d > today });
    if (count > 0) {
      totalDays++;
      totalMissions += count;
      curStreak++;
      maxStreak = Math.max(maxStreak, curStreak);
    } else {
      curStreak = 0;
    }
    d.setDate(d.getDate() + 1);
  }

  grid.innerHTML = cells.map(function(c) {
    if (c.future) return '<div class="hm-cell hm-0" style="opacity:0"></div>';
    return '<div class="hm-cell hm-' + c.level + '" title="' + c.key + ': ' + c.count + '개" onclick="showHmDay(\'' + c.key + '\',' + c.count + ')"></div>';
  }).join('');

  if (statsEl) {
    statsEl.innerHTML = [
      {num: totalDays, lbl: '활동 일수'},
      {num: totalMissions, lbl: '총 완료'},
      {num: maxStreak, lbl: '최장 연속'},
      {num: Object.keys(calData).length > 0 ? Math.round(totalMissions/totalDays) : 0, lbl: '일 평균'},
    ].map(function(s) {
      return '<div class="hm-stat"><div class="hm-stat-num">' + (isNaN(s.num)?0:s.num) + '</div><div class="hm-stat-lbl">' + s.lbl + '</div></div>';
    }).join('');
  }

  // 월 레이블
  var months = document.getElementById('hmMonths');
  if (months) {
    var labels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    months.innerHTML = labels.map(function(l){ return '<span>' + l + '</span>'; }).join('');
  }
}

function showHmDay(key, count) {
  if (typeof showToast === 'function') showToast(key + ': ' + count + '개 완료');
}

// ════════════════════════════════════════
// ── XP 상점 (프리미엄) ──
// ════════════════════════════════════════
var SHOP_CATEGORIES = ['테마', '배지', '아이템'];
var _shopCat = '테마';

var SHOP_ITEMS = [
  // 테마
  {id:'th_spring', cat:'테마', icon:'🌸', name:'봄 벚꽃', desc:'따뜻한 핑크빛 봄 테마', price:300, themeId:'spring'},
  {id:'th_summer', cat:'테마', icon:'🌊', name:'여름 바다', desc:'시원한 블루 여름 테마', price:300, themeId:'summer'},
  {id:'th_autumn', cat:'테마', icon:'🍂', name:'가을 단풍', desc:'따뜻한 오렌지 가을 테마', price:300, themeId:'autumn'},
  {id:'th_winter', cat:'테마', icon:'❄️', name:'겨울 설경', desc:'차가운 블루그레이 겨울 테마', price:300, themeId:'winter'},
  // 배지
  {id:'badge_fire', cat:'배지', icon:'🔥', name:'불꽃 배지', desc:'스트릭 옆에 표시되는 특별 배지', price:150},
  {id:'badge_crown', cat:'배지', icon:'👑', name:'왕관 배지', desc:'최고 레벨 도달 기념 배지', price:200},
  {id:'badge_gem', cat:'배지', icon:'💎', name:'다이아 배지', desc:'희귀 배지, 특별한 날에만 판매', price:500},
  {id:'badge_rainbow', cat:'배지', icon:'🌈', name:'무지개 배지', desc:'모든 카테고리 완료 기념', price:180},
  // 아이템
  {id:'item_skip', cat:'아이템', icon:'⏭️', name:'미션 스킵권', desc:'미션 1개를 건너뛸 수 있어요', price:80, consumable:true},
  {id:'item_boost', cat:'아이템', icon:'⚡', name:'XP 2배 부스터', desc:'24시간 XP 2배 획득', price:150, consumable:true},
  {id:'item_cooldown', cat:'아이템', icon:'⏱️', name:'쿨다운 초기화', desc:'집중 챌린지 쿨다운 즉시 해제', price:100, consumable:true},
  {id:'item_stars', cat:'아이템', icon:'⭐', name:'별빛 50개', desc:'마켓에서 쓸 수 있는 별빛 구매', price:200, consumable:true},
];

function getOwned() { try { return JSON.parse(localStorage.getItem('mp_shop_owned') || '[]'); } catch(e) { return []; } }
function isOwned(id) { return getOwned().indexOf(id) !== -1; }

function openShop() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  renderShop();
  document.getElementById('shopOverlay').classList.add('show');
}
function closeShop() { document.getElementById('shopOverlay').classList.remove('show'); }

function renderShop() {
  var xp = getXP ? getXP() : 0;
  var el = document.getElementById('shopXpBalance');
  if (el) el.textContent = xp + ' XP';

  var tabs = document.getElementById('shopTabs');
  if (tabs) tabs.innerHTML = SHOP_CATEGORIES.map(function(c) {
    return '<button class="shop-tab' + (c===_shopCat?' active':'') + '" onclick="switchShopCat(\'' + c + '\')">' + c + '</button>';
  }).join('');

  var items = SHOP_ITEMS.filter(function(i){ return i.cat === _shopCat; });
  var grid = document.getElementById('shopGrid');
  if (!grid) return;
  grid.innerHTML = items.map(function(item) {
    var owned = isOwned(item.id);
    var canBuy = (getXP ? getXP() : 0) >= item.price;
    var btnClass = owned && !item.consumable ? 'owned-btn' : item.themeId ? 'use-btn' : '';
    var btnText = owned && !item.consumable ? '✓ 보유중' : (item.consumable && owned) ? '사용하기' : 'XP ' + item.price;
    return '<div class="shop-item' + (owned&&!item.consumable?' owned':'') + '">' +
      '<div class="shop-item-icon">' + item.icon + '</div>' +
      '<div class="shop-item-name">' + item.name + '</div>' +
      '<div class="shop-item-desc">' + item.desc + '</div>' +
      '<div class="shop-item-price"><span>⚡</span>' + item.price + ' XP</div>' +
      '<button class="shop-buy-btn ' + btnClass + '" onclick="buyShopItem(\'' + item.id + '\')" ' + (owned&&!item.consumable?'disabled':'') + '>' + btnText + '</button>' +
    '</div>';
  }).join('');
}

function switchShopCat(cat) { _shopCat = cat; renderShop(); }

function buyShopItem(id) {
  var item = SHOP_ITEMS.find(function(i){ return i.id===id; });
  if (!item) return;
  var xp = getXP ? getXP() : 0;
  if (xp < item.price) { if(typeof showToast==='function') showToast('XP가 부족해요! (' + xp + '/' + item.price + ')', '#c97b4c'); return; }

  var owned = getOwned();
  if (owned.indexOf(id) !== -1 && !item.consumable) { useShopItem(id, item); return; }

  if (!confirm('"' + item.name + '"을(를) ' + item.price + ' XP로 구매할까요?')) return;

  localStorage.setItem('mp_xp', String(xp - item.price));
  if (typeof renderXPBar === 'function') renderXPBar();

  if (item.consumable) {
    useShopItemEffect(id, item);
  } else {
    owned.push(id);
    localStorage.setItem('mp_shop_owned', JSON.stringify(owned));
  }
  renderShop();
  if(typeof showToast==='function') showToast('"' + item.name + '" 구매 완료! 🎉');
}

function useShopItemEffect(id, item) {
  if (item.themeId) {
    if (typeof applyTheme === 'function') applyTheme(item.themeId);
  } else if (id === 'item_boost') {
    localStorage.setItem('mp_xp_boost', String(Date.now() + 86400000));
    if(typeof showToast==='function') showToast('⚡ 24시간 XP 2배 부스터 활성화!');
  } else if (id === 'item_cooldown') {
    localStorage.removeItem('mp_fc_last');
    if(typeof showToast==='function') showToast('⏱️ 집중 챌린지 쿨다운 초기화!');
    if(typeof initFocusChallenge==='function') initFocusChallenge();
  } else if (id === 'item_stars') {
    addStars(50);
  }
}

// XP 부스터 적용
var _origAddXP = window.addXP;
window.addXP = function(amount) {
  var boost = localStorage.getItem('mp_xp_boost');
  var boosted = boost && Date.now() < parseInt(boost);
  if (_origAddXP) _origAddXP(boosted ? amount * 2 : amount);
};

// ════════════════════════════════════════
// ── 미션 마켓플레이스 ──
// ════════════════════════════════════════
var MISSION_PACKS = [
  {
    id:'pack_basic_gratitude', icon:'🙏', name:'감사 기초 팩', desc:'매일 감사함을 기록하는 기본 미션 모음',
    tags:['감사','일상','마음'], price:0, type:'free', count:5,
    missions:[
      {icon:'🙏', name:'오늘 감사한 것 3가지', desc:'작은 것도 좋아요', type:'text', placeholder:'감사한 것들...', category:'mind', difficulty:1},
      {icon:'💌', name:'감사 메시지 보내기', desc:'소중한 사람에게 감사를 전해요', type:'check', placeholder:'', category:'relation', difficulty:1},
      {icon:'🌟', name:'오늘의 좋은 일 기록', desc:'오늘 좋았던 순간을 적어요', type:'text', placeholder:'오늘 좋았던 일은...', category:'mind', difficulty:1},
      {icon:'🤗', name:'나에게 칭찬하기', desc:'오늘 잘한 것을 스스로 칭찬해요', type:'text', placeholder:'오늘 나는...', category:'mind', difficulty:1},
      {icon:'☀️', name:'긍정 확언 5가지', desc:'나를 응원하는 말을 적어보세요', type:'text', placeholder:'나는...', category:'mind', difficulty:1},
    ]
  },
  {
    id:'pack_health_basic', icon:'💪', name:'건강 기초 팩', desc:'간단하게 시작하는 건강 습관 미션',
    tags:['건강','운동','생활'], price:0, type:'free', count:5,
    missions:[
      {icon:'💧', name:'물 2L 마시기', desc:'하루 권장 수분을 채워요', type:'check', placeholder:'', category:'health', difficulty:1},
      {icon:'🚶', name:'10분 걷기', desc:'짧아도 괜찮아요', type:'check', placeholder:'', category:'health', difficulty:1},
      {icon:'🌿', name:'스트레칭 5분', desc:'몸을 깨워보세요', type:'check', placeholder:'', category:'health', difficulty:1},
      {icon:'🥗', name:'채소 한 접시', desc:'건강한 식단 시작', type:'check', placeholder:'', category:'health', difficulty:1},
      {icon:'💤', name:'7시간 수면 도전', desc:'충분한 수면이 최고의 약', type:'check', placeholder:'', category:'health', difficulty:1},
    ]
  },
  {
    id:'pack_study', icon:'📚', name:'독서 챌린지 팩', desc:'매일 책을 읽고 기록하는 지식 쌓기 팩',
    tags:['독서','성장','교육'], price:5, type:'star', count:7,
    missions:[
      {icon:'📖', name:'책 20페이지 읽기', desc:'조금씩이라도 꾸준히', type:'check', placeholder:'', category:'growth', difficulty:1},
      {icon:'✍️', name:'오늘 읽은 내용 요약', desc:'내 말로 정리해보세요', type:'text', placeholder:'오늘 읽은 내용...', category:'growth', difficulty:2},
      {icon:'💡', name:'인상 깊은 문장 기록', desc:'마음에 남는 문장을 적어요', type:'text', placeholder:'인상 깊은 문장...', category:'growth', difficulty:1},
      {icon:'🤔', name:'오늘 배운 것 적용하기', desc:'책에서 배운 것을 실생활에', type:'text', placeholder:'적용해본 것...', category:'growth', difficulty:2},
      {icon:'📚', name:'읽고 싶은 책 목록 추가', desc:'다음 읽을 책을 정해두세요', type:'text', placeholder:'책 제목...', category:'growth', difficulty:1},
      {icon:'🗣️', name:'책 내용 누군가에게 설명', desc:'가르치면서 배워요', type:'text', placeholder:'설명한 내용...', category:'growth', difficulty:2},
      {icon:'⭐', name:'책 별점 & 한줄평', desc:'읽은 책을 평가해봐요', type:'text', placeholder:'별점: /한줄평:', category:'growth', difficulty:1},
    ]
  },
  {
    id:'pack_mindful', icon:'🧘', name:'마음챙김 디럭스', desc:'깊이 있는 마음챙김과 명상 미션 모음',
    tags:['명상','마음','힐링'], price:8, type:'star', count:7,
    missions:[
      {icon:'🧘', name:'10분 명상', desc:'아무 생각 없이 호흡에만 집중', type:'check', placeholder:'', category:'mind', difficulty:2},
      {icon:'🫁', name:'4-7-8 호흡법 3세트', desc:'과학적인 이완 호흡법', type:'check', placeholder:'', category:'mind', difficulty:1},
      {icon:'📓', name:'감정 일기', desc:'오늘 감정을 솔직하게 기록', type:'text', placeholder:'오늘 내 감정은...', category:'mind', difficulty:2},
      {icon:'🌿', name:'자연 속 10분', desc:'밖에서 아무것도 안 하기', type:'check', placeholder:'', category:'mind', difficulty:1},
      {icon:'📱', name:'디지털 디톡스 1시간', desc:'스마트폰 없는 한 시간', type:'check', placeholder:'', category:'mind', difficulty:3},
      {icon:'💭', name:'걱정 내려놓기 쓰기', desc:'걱정을 종이에 쓰고 내려놓기', type:'text', placeholder:'걱정하는 것들...', category:'mind', difficulty:2},
      {icon:'🌙', name:'잠들기 전 바디스캔', desc:'발끝부터 머리끝까지 의식하기', type:'check', placeholder:'', category:'mind', difficulty:2},
    ]
  },
  {
    id:'pack_creator', icon:'🎨', name:'크리에이터 팩', desc:'창의력을 폭발시키는 예술·창작 미션',
    tags:['창의','예술','표현'], price:10, type:'star', count:8,
    missions:[
      {icon:'✏️', name:'5분 낙서', desc:'뭐든 그려보세요', type:'photo', placeholder:'', category:'creative', difficulty:1},
      {icon:'📸', name:'오늘의 감성 사진', desc:'아름다운 것을 담아보세요', type:'photo', placeholder:'', category:'creative', difficulty:1},
      {icon:'✍️', name:'시 한 편 쓰기', desc:'4줄이면 충분해요', type:'text', placeholder:'나만의 시...', category:'creative', difficulty:3},
      {icon:'🎵', name:'오늘의 사운드트랙', desc:'오늘 기분에 맞는 노래 선곡', type:'text', placeholder:'곡 제목/이유...', category:'creative', difficulty:1},
      {icon:'🌈', name:'색으로 감정 표현', desc:'오늘 감정을 색으로 표현', type:'photo', placeholder:'', category:'creative', difficulty:2},
      {icon:'📖', name:'단편소설 첫 문장', desc:'이야기의 시작을 써보세요', type:'text', placeholder:'옛날에...', category:'creative', difficulty:2},
      {icon:'🎭', name:'롤플레이 일기', desc:'다른 누군가가 되어 하루 기록', type:'text', placeholder:'나는 오늘...', category:'creative', difficulty:3},
      {icon:'🏺', name:'DIY 프로젝트 시작', desc:'무언가를 직접 만들어보세요', type:'photo', placeholder:'', category:'creative', difficulty:2},
    ]
  },
  {
    id:'pack_productivity', icon:'⚡', name:'생산성 마스터 팩', desc:'업무와 목표 달성을 위한 프리미엄 미션 세트',
    tags:['업무','성장','목표'], price:0, type:'premium', count:8,
    missions:[
      {icon:'📋', name:'오늘 최우선 과제 3개', desc:'가장 중요한 것만 집중', type:'text', placeholder:'1. / 2. / 3.', category:'growth', difficulty:2},
      {icon:'⏰', name:'딥 워크 90분', desc:'방해 없이 완전 집중', type:'check', placeholder:'', category:'growth', difficulty:3},
      {icon:'📊', name:'주간 목표 점검', desc:'얼마나 달성했는지 체크', type:'text', placeholder:'달성/미달성...', category:'growth', difficulty:2},
      {icon:'🐸', name:'오늘의 개구리 먹기', desc:'가장 하기 싫은 일 먼저', type:'check', placeholder:'', category:'growth', difficulty:3},
      {icon:'📧', name:'이메일 제로 인박스', desc:'모든 이메일 처리하기', type:'check', placeholder:'', category:'growth', difficulty:2},
      {icon:'🧠', name:'브레인덤프', desc:'머릿속 생각 모두 종이에', type:'text', placeholder:'지금 생각나는 것...', category:'growth', difficulty:1},
      {icon:'🔄', name:'작업 회고 15분', desc:'오늘 일을 돌아보며 개선점 찾기', type:'text', placeholder:'잘한 것/개선점...', category:'growth', difficulty:2},
      {icon:'🎯', name:'내일 계획 세우기', desc:'내일을 준비하는 5분', type:'text', placeholder:'내일 할 일...', category:'growth', difficulty:1},
    ]
  },
];

var _marketFilter = '전체';
var _marketOwnedPacks = [];

function getOwnedPacks() {
  try { return JSON.parse(localStorage.getItem('mp_owned_packs') || '[]'); } catch(e) { return []; }
}

function openMarket() {
  _marketOwnedPacks = getOwnedPacks();
  updateStarDisplays();
  renderMarket();
  document.getElementById('marketOverlay').classList.add('show');
  // 시장 열기 버튼 고정 버튼 숨기기
  var themeBtn = document.getElementById('themeToggle');
  var calBtn = document.getElementById('calToggle');
  if (themeBtn) themeBtn.style.display = 'none';
  if (calBtn) calBtn.style.display = 'none';
}

function closeMarket() {
  document.getElementById('marketOverlay').classList.remove('show');
  var themeBtn = document.getElementById('themeToggle');
  var calBtn = document.getElementById('calToggle');
  if (themeBtn) themeBtn.style.display = '';
  if (calBtn) calBtn.style.display = '';
}

function renderMarket() {
  var filters = ['전체','무료','별빛','프리미엄'];
  var filterEl = document.getElementById('marketFilter');
  if (filterEl) filterEl.innerHTML = filters.map(function(f) {
    return '<button class="market-filter-btn' + (f===_marketFilter?' active':'') + '" onclick="setMarketFilter(\'' + f + '\')">' +
      {전체:'전체',무료:'🆓 무료',별빛:'⭐ 별빛',프리미엄:'💎 프리미엄'}[f] + '</button>';
  }).join('');

  var packs = MISSION_PACKS.filter(function(p) {
    if (_marketFilter === '전체') return true;
    if (_marketFilter === '무료') return p.type === 'free';
    if (_marketFilter === '별빛') return p.type === 'star';
    if (_marketFilter === '프리미엄') return p.type === 'premium';
    return true;
  });

  var list = document.getElementById('marketPackList');
  if (!list) return;
  list.innerHTML = packs.map(function(pack) {
    var owned = _marketOwnedPacks.indexOf(pack.id) !== -1;
    var canGet = pack.type === 'free' || (pack.type === 'star' && getStars() >= pack.price) || (pack.type === 'premium' && _isPremium);

    var priceHtml = pack.type === 'free'
      ? '<span class="price-free">🆓 무료</span>'
      : pack.type === 'star'
      ? '<span class="price-star">⭐ ' + pack.price + ' 별빛</span>'
      : '<span class="price-premium">💎 프리미엄 전용</span>';

    var btnClass = owned ? 'owned' : pack.type === 'free' ? 'free' : pack.type === 'star' ? 'star' : 'prem';
    var btnText = owned ? '✓ 보유중' : pack.type === 'free' ? '무료 받기' : pack.type === 'star' ? '⭐ 구매 (' + pack.price + ')' : '💎 프리미엄 전용';

    return '<div class="market-pack">' +
      '<div class="market-pack-top">' +
        '<span class="market-pack-icon">' + pack.icon + '</span>' +
        '<div class="market-pack-info"><h3>' + pack.name + '</h3><p>' + pack.desc + '</p></div>' +
      '</div>' +
      '<div class="market-pack-tags">' +
        pack.tags.map(function(t){ return '<span class="market-pack-tag">' + t + '</span>'; }).join('') +
        '<span class="market-pack-tag">' + pack.count + '개 미션</span>' +
      '</div>' +
      '<div class="market-pack-footer">' +
        priceHtml +
        '<button class="market-get-btn ' + btnClass + '" onclick="getPack(\'' + pack.id + '\')" ' + (owned?'disabled':'') + '>' + btnText + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function setMarketFilter(f) { _marketFilter = f; renderMarket(); }

function getPack(packId) {
  var pack = MISSION_PACKS.find(function(p){ return p.id === packId; });
  if (!pack) return;

  var owned = _marketOwnedPacks.indexOf(packId) !== -1;
  if (owned) return;

  if (pack.type === 'premium' && !_isPremium) { openPremiumModal && openPremiumModal(); return; }
  if (pack.type === 'star') {
    if (!spendStars(pack.price)) return;
  }

  if (!confirm('"' + pack.name + '" ' + pack.count + '개 미션을 추가할까요?')) return;

  // 미션들을 앱에 추가
  var added = 0;
  pack.missions.forEach(function(m) {
    fetch('/api/add_mission', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(m)
    }).then(function(r){ return r.json(); }).then(function(data) {
      if (data.success) {
        MISSIONS.push(data.mission);
        if (window.state) window.state[String(data.mission.id)] = {completed:false, expanded:false, value:'', lucky:null, fileName:''};
        added++;
        if (added === pack.missions.length) {
          if (typeof saveCustomMissions === 'function') saveCustomMissions();
          if (typeof renderMissions === 'function') renderMissions();
          if (typeof showToast === 'function') showToast('"' + pack.name + '" ' + pack.count + '개 미션 추가! 🎉');
        }
      }
    });
  });

  _marketOwnedPacks.push(packId);
  localStorage.setItem('mp_owned_packs', JSON.stringify(_marketOwnedPacks));
  renderMarket();
}

// ════════════════════════════════════════
// ── 계절 테마 추가 (applyTheme 확장) ──
// ════════════════════════════════════════
var _origApplyTheme = window.applyTheme;
window.applyTheme = function(id) {
  if (_origApplyTheme) _origApplyTheme(id);
  // 계절 테마 추가 적용
  ['spring','summer','autumn','winter'].forEach(function(t) {
    document.body.classList.remove('theme-' + t);
  });
  if (['spring','summer','autumn','winter'].indexOf(id) !== -1) {
    document.body.classList.add('theme-' + id);
  }
};

// 상점에서 계절 테마 구매 후 테마 그리드에 추가
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof applyPremiumThemes === 'function') applyPremiumThemes();
  }, 1200);
});

// ════════════════════════════════════════
// ── 물 섭취 트래커 (무료) ──
// ════════════════════════════════════════
function getWaterToday() {
  var today = new Date().toDateString();
  var saved = localStorage.getItem('mp_water');
  try {
    var data = JSON.parse(saved || '{}');
    if (data.date !== today) return { date: today, cups: 0 };
    return data;
  } catch(e) { return { date: today, cups: 0 }; }
}
function saveWater(cups) {
  var today = new Date().toDateString();
  localStorage.setItem('mp_water', JSON.stringify({ date: today, cups: cups }));
}

function renderWaterTracker() {
  var el = document.getElementById('waterTrackerSection');
  if (!el) return;
  var data = getWaterToday();
  var goal = 8;
  var cups = data.cups;
  el.innerHTML = [
    '<div class="water-section">',
      '<div class="water-title">💧 물 섭취 트래커',
        '<span style="font-size:12px;color:rgba(14,165,233,.8)">' + cups + '/' + goal + ' 잔 · ' + (cups*250) + 'ml</span>',
      '</div>',
      '<div class="water-cups">',
        Array.from({length:goal}, function(_,i) {
          return '<span class="water-cup' + (i<cups?' filled':'') + '" onclick="addWaterCup(' + i + ')">💧</span>';
        }).join(''),
      '</div>',
      '<div class="water-progress">',
        cups >= goal
          ? '🎉 오늘 목표 달성! 건강한 하루예요'
          : '목표까지 ' + (goal-cups) + '잔 남았어요',
      '</div>',
    '</div>',
  ].join('');
}

function addWaterCup(idx) {
  var data = getWaterToday();
  var newCups = idx < data.cups ? idx : Math.min(8, idx + 1);
  saveWater(newCups);
  if (newCups >= 8 && data.cups < 8) {
    if (typeof addXP === 'function') addXP(5);
    if (typeof showToast === 'function') showToast('💧 오늘 물 목표 달성! +5 XP');
  }
  renderWaterTracker();
}

// ════════════════════════════════════════
// ── 수면 트래커 (무료) ──
// ════════════════════════════════════════
function renderSleepTracker() {
  var el = document.getElementById('sleepTrackerSection');
  if (!el) return;
  var today = new Date().toDateString();
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('mp_sleep_today') || '{}'); } catch(e) {}

  el.innerHTML = [
    '<div class="sleep-section">',
      '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">🌙 수면 트래커</div>',
      '<div class="sleep-inputs">',
        '<div class="sleep-input-wrap">',
          '<div class="sleep-input-label">취침 시간</div>',
          '<input class="sleep-time-input" type="time" id="sleepBedtime" value="' + (saved.bedtime||'23:00') + '" onchange="calcSleep()">',
        '</div>',
        '<div class="sleep-input-wrap">',
          '<div class="sleep-input-label">기상 시간</div>',
          '<input class="sleep-time-input" type="time" id="sleepWaketime" value="' + (saved.waketime||'07:00') + '" onchange="calcSleep()">',
        '</div>',
      '</div>',
      '<div class="sleep-result" id="sleepResult">' + calcSleepHours(saved.bedtime||'23:00', saved.waketime||'07:00') + '</div>',
    '</div>',
  ].join('');
}

function calcSleepHours(bed, wake) {
  var bedParts = bed.split(':').map(Number);
  var wakeParts = wake.split(':').map(Number);
  var bedMins = bedParts[0] * 60 + bedParts[1];
  var wakeMins = wakeParts[0] * 60 + wakeParts[1];
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  var totalMins = wakeMins - bedMins;
  var h = Math.floor(totalMins / 60);
  var m = totalMins % 60;
  var msg = h >= 7 ? ' 😊 충분한 수면이에요!' : h >= 6 ? ' 😐 조금 부족해요' : ' 😴 수면이 너무 부족해요!';
  return h + '시간 ' + m + '분' + msg;
}

function calcSleep() {
  var bed = document.getElementById('sleepBedtime');
  var wake = document.getElementById('sleepWaketime');
  var result = document.getElementById('sleepResult');
  if (!bed || !wake || !result) return;
  var bedTime = bed.value;
  var wakeTime = wake.value;
  result.textContent = calcSleepHours(bedTime, wakeTime);
  localStorage.setItem('mp_sleep_today', JSON.stringify({ date: new Date().toDateString(), bedtime: bedTime, waketime: wakeTime }));

  // 7시간 이상이면 XP 보상
  var bedParts = bedTime.split(':').map(Number);
  var wakeParts = wakeTime.split(':').map(Number);
  var bedMins = bedParts[0]*60+bedParts[1];
  var wakeMins = wakeParts[0]*60+wakeParts[1];
  if (wakeMins <= bedMins) wakeMins += 1440;
  if (wakeMins - bedMins >= 420) {
    var key = 'mp_sleep_xp_' + new Date().toDateString();
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      if (typeof addXP === 'function') addXP(3);
      if (typeof showToast === 'function') showToast('🌙 7시간 이상 수면! +3 XP');
    }
  }
}

// ════════════════════════════════════════
// ── 전체 검색 (무료) ──
// ════════════════════════════════════════
function openSearch() {
  document.getElementById('searchOverlay').classList.add('show');
  setTimeout(function() { var el = document.getElementById('searchInput'); if(el) el.focus(); }, 200);
}
function closeSearch() { document.getElementById('searchOverlay').classList.remove('show'); }

function doSearch(query) {
  var el = document.getElementById('searchResults');
  if (!el) return;
  if (!query || query.length < 1) {
    el.innerHTML = '<div class="search-empty">🔍<br><br>검색어를 입력하세요</div>';
    return;
  }
  query = query.toLowerCase();
  var results = { missions:[], notes:[], budget:[] };

  // 미션 검색
  (window.MISSIONS || MISSIONS || []).forEach(function(m) {
    if (m.name.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query)) {
      results.missions.push(m);
    }
  });

  // 메모 검색
  try {
    var memos = JSON.parse(localStorage.getItem('mp_memos') || '[]');
    memos.forEach(function(m) {
      if ((m.title||'').toLowerCase().includes(query) || (m.body||'').toLowerCase().includes(query)) {
        results.notes.push(m);
      }
    });
  } catch(e) {}

  // 가계부 검색
  if (window._budget && _budget.transactions) {
    _budget.transactions.forEach(function(t) {
      if ((t.name||'').toLowerCase().includes(query) || (t.memo||'').toLowerCase().includes(query)) {
        results.budget.push(t);
      }
    });
  }

  var html = '';
  if (results.missions.length) {
    html += '<div class="search-section-title">🎯 미션 (' + results.missions.length + ')</div>';
    html += results.missions.slice(0,5).map(function(m) {
      return '<div class="search-result-item"><div class="search-result-icon">' + m.icon + '</div>' +
        '<div class="search-result-text"><div class="search-result-name">' + m.name + '</div>' +
        '<div class="search-result-sub">' + m.desc + '</div></div></div>';
    }).join('');
  }
  if (results.notes.length) {
    html += '<div class="search-section-title">📝 메모 (' + results.notes.length + ')</div>';
    html += results.notes.slice(0,3).map(function(n) {
      return '<div class="search-result-item" onclick="closeSearch();openMemo();openMemoEdit(\'' + n.id + '\')">' +
        '<div class="search-result-icon">📝</div>' +
        '<div class="search-result-text"><div class="search-result-name">' + (n.title||'제목없음') + '</div>' +
        '<div class="search-result-sub">' + (n.body||'').slice(0,50) + '</div></div></div>';
    }).join('');
  }
  if (results.budget.length) {
    html += '<div class="search-section-title">💵 가계부 (' + results.budget.length + ')</div>';
    html += results.budget.slice(0,3).map(function(t) {
      return '<div class="search-result-item">' +
        '<div class="search-result-icon">' + (t.type==='income'?'💰':'💸') + '</div>' +
        '<div class="search-result-text"><div class="search-result-name">' + t.name + '</div>' +
        '<div class="search-result-sub">' + t.date + ' · ' + t.amount.toLocaleString() + '원</div></div></div>';
    }).join('');
  }
  if (!html) html = '<div class="search-empty">검색 결과가 없어요 🔍<br>"' + query + '"에 대한 결과 없음</div>';
  el.innerHTML = html;
}

// ════════════════════════════════════════
// ── 트래커 섹션 DOM 삽입 & 초기화 ──
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  updateStarDisplays();

  // 물/수면 트래커 삽입 (명언 섹션 아래)
  var quoteSection = document.getElementById('quoteSection');
  if (quoteSection && quoteSection.parentNode) {
    var waterDiv = document.createElement('div');
    waterDiv.id = 'waterTrackerSection';
    var sleepDiv = document.createElement('div');
    sleepDiv.id = 'sleepTrackerSection';
    quoteSection.parentNode.insertBefore(sleepDiv, quoteSection.nextSibling);
    quoteSection.parentNode.insertBefore(waterDiv, quoteSection.nextSibling);
  }

  renderWaterTracker();
  renderSleepTracker();

  // 미션 완료 시 별빛 획득 연동
  var origComplete = window.completeMission;
  if (typeof origComplete === 'function') {
    // addTotalCompleted 감싸기
    var origAdd = window.addTotalCompleted;
    window.addTotalCompleted = function(n) {
      if (origAdd) origAdd(n);
      if (!n) window._starOnComplete && window._starOnComplete();
    };
  }
});

// ════════════════════════════════════════════════════════════
// ── 미션 펫 키우기 (프리미엄) ──
// ════════════════════════════════════════════════════════════
var PET_STAGES = [
  { id:0, name:'알',     emoji:'🥚', label:'알 단계',       minExp:0,  desc:'곧 부화할 것 같아요...' },
  { id:1, name:'아기',   emoji:'🐣', label:'아기 단계',     minExp:5,  desc:'방금 태어났어요!' },
  { id:2, name:'청소년', emoji:'🐥', label:'청소년 단계',   minExp:15, desc:'무럭무럭 자라고 있어요' },
  { id:3, name:'성인',   emoji:'🐔', label:'성인 단계',     minExp:30, desc:'든든하게 컸어요!' },
  { id:4, name:'전설',   emoji:'🦅', label:'전설 단계',     minExp:50, desc:'전설의 경지에 올랐어요!' },
];

function getPet() {
  try {
    var p = JSON.parse(localStorage.getItem('mp_pet') || 'null');
    if (p) {
      // 시간 경과에 따른 스탯 감소 계산
      var now = Date.now();
      var hoursPassed = (now - (p.lastUpdate || now)) / 3600000;
      if (hoursPassed > 0) {
        p.happy = Math.max(0, p.happy - Math.floor(hoursPassed * 3));
        p.energy = Math.max(0, p.energy - Math.floor(hoursPassed * 4));
        p.lastUpdate = now;
      }
      return p;
    }
  } catch(e) {}
  return { name:'알', exp:0, happy:100, energy:100, stage:0, lastUpdate:Date.now(), lastFed:0, lastPlay:0 };
}

function savePet(p) {
  p.lastUpdate = Date.now();
  localStorage.setItem('mp_pet', JSON.stringify(p));
}

function getPetStage(exp) {
  var stage = PET_STAGES[0];
  for (var i = PET_STAGES.length - 1; i >= 0; i--) {
    if (exp >= PET_STAGES[i].minExp) { stage = PET_STAGES[i]; break; }
  }
  return stage;
}

function openPet() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  renderPet();
  document.getElementById('petOverlay').classList.add('show');
}
function closePet() { document.getElementById('petOverlay').classList.remove('show'); }

function renderPet() {
  var p = getPet();
  savePet(p);
  var stage = getPetStage(p.exp);
  var nextStage = PET_STAGES[Math.min(stage.id + 1, PET_STAGES.length - 1)];

  var char = document.getElementById('petCharacter');
  char.textContent = stage.emoji;
  char.className = 'pet-character' + (p.happy < 30 ? ' sad' : '');

  document.getElementById('petName').textContent = p.name === '알' ? stage.name : p.name;
  document.getElementById('petNameHeader').textContent = p.name === '알' ? '나의 펫' : p.name;
  document.getElementById('petStageLabel').textContent = stage.label + ' · ' + stage.desc;
  document.getElementById('petLevelBadge').textContent = 'Lv.' + (stage.id + 1);

  document.getElementById('petHappyVal').textContent = Math.round(p.happy) + '%';
  document.getElementById('petHappyBar').style.width = p.happy + '%';
  document.getElementById('petEnergyVal').textContent = Math.round(p.energy) + '%';
  document.getElementById('petEnergyBar').style.width = p.energy + '%';

  // 성장 진행도
  var expInStage = p.exp - stage.minExp;
  var expNeeded = stage.id < 4 ? nextStage.minExp - stage.minExp : 1;
  var expPct = stage.id < 4 ? Math.min(100, (expInStage / expNeeded) * 100) : 100;
  document.getElementById('petExpVal').textContent = stage.id < 4 ? p.exp + '/' + nextStage.minExp : 'MAX';
  document.getElementById('petExpBar').style.width = expPct + '%';
}

function showPetBubble(text) {
  var area = document.querySelector('.pet-stage-area');
  var existing = area.querySelector('.pet-mood-bubble');
  if (existing) existing.remove();
  var bubble = document.createElement('div');
  bubble.className = 'pet-mood-bubble';
  bubble.textContent = text;
  area.appendChild(bubble);
  setTimeout(function() { if (bubble.parentNode) bubble.remove(); }, 2000);
}

function petBounce() {
  var char = document.getElementById('petCharacter');
  char.classList.remove('happy'); void char.offsetWidth; char.classList.add('happy');
}

function petPoke() {
  var p = getPet();
  var reactions = ['꺄르륵!', '간지러워~', '히힛', '또 해줘!', '♪~', '좋아!'];
  if (p.happy < 30) { showPetBubble('흑흑... 외로웠어'); }
  else showPetBubble(reactions[Math.floor(Math.random()*reactions.length)]);
  petBounce();
  if (typeof playSfx === 'function') playSfx();
}

function petFeed() {
  var p = getPet();
  var now = Date.now();
  if (now - (p.lastFed || 0) < 3600000) {
    showPetBubble('아직 배불러요!');
    return;
  }
  p.energy = Math.min(100, p.energy + 30);
  p.lastFed = now;
  savePet(p);
  showPetBubble('냠냠! 맛있어 🍖');
  petBounce();
  renderPet();
  if (typeof playSfx === 'function') playSfx();
}

function petPlay() {
  var p = getPet();
  if (p.energy < 20) { showPetBubble('너무 피곤해요... 💤'); return; }
  var now = Date.now();
  if (now - (p.lastPlay || 0) < 1800000) {
    showPetBubble('방금 놀았어요!');
    return;
  }
  p.happy = Math.min(100, p.happy + 25);
  p.energy = Math.max(0, p.energy - 15);
  p.lastPlay = now;
  savePet(p);
  showPetBubble('신난다! 🎾');
  petBounce();
  renderPet();
  if (typeof playSfx === 'function') playSfx();
}

function petPet() {
  var p = getPet();
  p.happy = Math.min(100, p.happy + 10);
  savePet(p);
  showPetBubble('포근해... 💖');
  petBounce();
  renderPet();
}

function renamePet() {
  var p = getPet();
  var name = prompt('펫의 이름을 지어주세요!', p.name === '알' ? '' : p.name);
  if (name && name.trim()) {
    p.name = name.trim().slice(0, 10);
    savePet(p);
    renderPet();
    if (typeof showToast === 'function') showToast('펫 이름이 "' + p.name + '"(으)로 정해졌어요! 🐾');
  }
}

// 미션 완료 시 펫 성장 (전역 연동)
window._petOnMissionComplete = function() {
  if (!_isPremium) return;
  var p = getPet();
  var oldStage = getPetStage(p.exp);
  p.exp += 1;
  p.happy = Math.min(100, p.happy + 5);
  var newStage = getPetStage(p.exp);
  savePet(p);
  if (newStage.id > oldStage.id) {
    showPetEvolve(newStage);
  }
};

function showPetEvolve(stage) {
  var overlay = document.getElementById('petEvolveOverlay');
  document.getElementById('petEvolveGlow').textContent = stage.emoji;
  document.getElementById('petEvolveSub').textContent = stage.name + ' 단계로 진화! ' + stage.desc;
  overlay.classList.add('show');
  if (typeof playSfx === 'function') playSfx();
  if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
  setTimeout(function() { overlay.classList.remove('show'); }, 4000);
}

// ════════════════════════════════════════════════════════════
// ── 미션 룰렛 ──
// ════════════════════════════════════════════════════════════
var ROULETTE_COLORS = ['#c9a84c','#a78bfa','#60a5fa','#34d399','#f87171','#fb923c','#ec4899','#14b8a6'];
var _rouletteSpinning = false;

function openRoulette() {
  buildRouletteWheel();
  document.getElementById('rouletteResult').classList.remove('show');
  document.getElementById('rouletteOverlay').classList.add('show');
}
function closeRoulette() { document.getElementById('rouletteOverlay').classList.remove('show'); }

function getRouletteMissions() {
  var missions = (window.MISSIONS || MISSIONS || []).filter(function(m) {
    return window.state && window.state[String(m.id)] && !window.state[String(m.id)].completed;
  });
  if (missions.length < 2) missions = (window.MISSIONS || MISSIONS || []);
  return missions.slice(0, 8);
}

function buildRouletteWheel() {
  var missions = getRouletteMissions();
  var wheel = document.getElementById('rouletteWheel');
  if (!missions.length) {
    wheel.innerHTML = '';
    wheel.style.background = 'var(--surface2)';
    return;
  }
  var n = missions.length;
  var seg = 360 / n;
  // conic-gradient로 칸 나누기
  var gradient = missions.map(function(m, i) {
    var c = ROULETTE_COLORS[i % ROULETTE_COLORS.length];
    return c + ' ' + (seg*i) + 'deg ' + (seg*(i+1)) + 'deg';
  }).join(', ');
  wheel.style.background = 'conic-gradient(' + gradient + ')';
  wheel.style.transform = 'rotate(0deg)';

  // 이모지 라벨 배치
  wheel.innerHTML = missions.map(function(m, i) {
    var angle = seg * i + seg/2;
    return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(' + angle + 'deg) translateY(-105px) rotate(-' + angle + 'deg);font-size:24px">' + m.icon + '</div>';
  }).join('');
  window._rouletteMissions = missions;
}

function spinRoulette() {
  if (_rouletteSpinning) return;
  var missions = window._rouletteMissions || getRouletteMissions();
  if (!missions.length) { if(typeof showToast==='function') showToast('미션이 없어요!'); return; }

  _rouletteSpinning = true;
  localStorage.setItem('mp_roulette_used', '1');
  document.getElementById('rouletteSpinBtn').disabled = true;
  document.getElementById('rouletteResult').classList.remove('show');

  var n = missions.length;
  var seg = 360 / n;
  var winIdx = Math.floor(Math.random() * n);
  // 포인터(위)가 가리키는 위치로 회전
  var targetAngle = 360 * 5 + (360 - (winIdx * seg + seg/2));

  var wheel = document.getElementById('rouletteWheel');
  wheel.style.transform = 'rotate(' + targetAngle + 'deg)';

  if (typeof playSfx === 'function') playSfx();

  setTimeout(function() {
    var win = missions[winIdx];
    var result = document.getElementById('rouletteResult');
    result.innerHTML = '🎯 ' + win.icon + ' ' + win.name + '<br><span style="font-size:13px;color:rgba(255,255,255,.6)">' + win.desc + '</span>';
    result.classList.add('show');
    _rouletteSpinning = false;
    document.getElementById('rouletteSpinBtn').disabled = false;
    document.getElementById('rouletteSpinBtn').textContent = '다시 돌리기';
    if (typeof playSfx === 'function') playSfx();
    if (typeof showToast === 'function') showToast('🎯 "' + win.name + '" 미션 당첨!');
  }, 4200);
}

// ════════════════════════════════════════════════════════════
// ── 미래 편지함 ──
// ════════════════════════════════════════════════════════════
var _letterPeriod = 30;

function getLetters() {
  try { return JSON.parse(localStorage.getItem('mp_letters') || '[]'); } catch(e) { return []; }
}
function saveLetters(l) { localStorage.setItem('mp_letters', JSON.stringify(l)); }

function openLetters() {
  renderLetters();
  document.getElementById('letterOverlay').classList.add('show');
}
function closeLetters() { document.getElementById('letterOverlay').classList.remove('show'); }

function renderLetters() {
  var letters = getLetters().sort(function(a,b){ return a.openDate - b.openDate; });
  var list = document.getElementById('letterList');
  if (!letters.length) {
    list.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:12px">📭</div>아직 편지가 없어요<br><br>미래의 나에게 첫 편지를 써보세요.<br>시간이 흐른 뒤 다시 열어볼 수 있어요 ✨</div>';
    return;
  }
  var now = Date.now();
  list.innerHTML = letters.map(function(l) {
    var canOpen = now >= l.openDate;
    var daysLeft = Math.ceil((l.openDate - now) / 86400000);
    var writeDate = new Date(l.writeDate);
    var openDate = new Date(l.openDate);
    var dateStr = (writeDate.getMonth()+1) + '/' + writeDate.getDate() + ' 작성';
    var openStr = (openDate.getFullYear()) + '.' + (openDate.getMonth()+1) + '.' + openDate.getDate();

    if (canOpen) {
      return '<div class="letter-card" onclick="readLetter(\'' + l.id + '\')">' +
        '<div class="letter-wax">💌</div>' +
        '<div class="letter-card-date">' + dateStr + '</div>' +
        '<div class="letter-card-title">미래의 나에게</div>' +
        '<span class="letter-dday open">✨ 지금 열어보기!</span>' +
      '</div>';
    } else {
      return '<div class="letter-card sealed">' +
        '<div class="letter-wax">🔒</div>' +
        '<div class="letter-card-date">' + dateStr + '</div>' +
        '<div class="letter-card-title">봉인된 편지</div>' +
        '<span class="letter-dday">D-' + daysLeft + ' · ' + openStr + ' 개봉</span>' +
      '</div>';
    }
  }).join('');
}

function openLetterForm() {
  _letterPeriod = 30;
  document.getElementById('letterText').value = '';
  document.querySelectorAll('.letter-period-btn').forEach(function(b, i) {
    b.classList.toggle('active', b.getAttribute('data-days') === '30');
  });
  document.getElementById('letterFormOverlay').classList.add('show');
}
function closeLetterForm() { document.getElementById('letterFormOverlay').classList.remove('show'); }

function selectLetterPeriod(btn, days) {
  _letterPeriod = days;
  document.querySelectorAll('.letter-period-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

function sealLetter() {
  var text = document.getElementById('letterText').value.trim();
  if (text.length < 5) { if(typeof showToast==='function') showToast('편지 내용을 적어주세요', '#c97b4c'); return; }
  var letters = getLetters();
  var now = Date.now();
  letters.push({
    id: now.toString(),
    body: text,
    writeDate: now,
    openDate: now + _letterPeriod * 86400000,
    period: _letterPeriod
  });
  saveLetters(letters);
  closeLetterForm();
  renderLetters();
  var periodLabel = {30:'1개월',90:'3개월',180:'6개월',365:'1년'}[_letterPeriod];
  if (typeof showToast === 'function') showToast('🔒 편지가 봉인됐어요! ' + periodLabel + ' 후에 만나요');
  if (typeof playSfx === 'function') playSfx();
}

function readLetter(id) {
  var letters = getLetters();
  var l = letters.find(function(x){ return x.id === id; });
  if (!l) return;
  var writeDate = new Date(l.writeDate);
  document.getElementById('letterReadSeal').innerHTML = '<div class="seal-break">💌</div>';
  document.getElementById('letterReadDate').textContent = writeDate.getFullYear() + '년 ' + (writeDate.getMonth()+1) + '월 ' + writeDate.getDate() + '일의 내가';
  document.getElementById('letterReadBody').textContent = l.body;
  document.getElementById('letterReadOverlay').classList.add('show');
  if (typeof playSfx === 'function') playSfx();
}
function closeLetterRead() { document.getElementById('letterReadOverlay').classList.remove('show'); }

// ════════════════════════════════════════════════════════════
// ── 오늘의 타로 ──
// ════════════════════════════════════════════════════════════
var TAROT_CARDS = [
  { emoji:'☀️', name:'태양', msgs:['오늘은 당신의 에너지가 빛나는 날이에요. 미션을 술술 해낼 거예요!','밝은 기운이 가득해요. 새로운 도전에 딱 좋은 날!','자신감이 넘치는 하루가 될 거예요.'] },
  { emoji:'🌙', name:'달', msgs:['내면의 목소리에 귀 기울여보세요. 직감이 길을 알려줄 거예요.','조용히 자신을 돌아보기 좋은 날이에요.','감정의 흐름을 받아들이면 마음이 편안해져요.'] },
  { emoji:'⭐', name:'별', msgs:['희망이 가득한 날! 작은 소원을 빌어보세요.','당신의 꿈이 한 걸음 가까워지고 있어요.','반짝이는 영감이 찾아올 거예요.'] },
  { emoji:'🌊', name:'물결', msgs:['흐름에 몸을 맡겨보세요. 순리대로 풀릴 거예요.','감정이 풍부해지는 날, 창의력을 발휘해보세요.','변화의 물결이 좋은 방향으로 흐르고 있어요.'] },
  { emoji:'🔥', name:'불꽃', msgs:['열정이 타오르는 날! 미뤘던 일에 도전해보세요.','강한 의지로 무엇이든 해낼 수 있어요.','당신의 추진력이 빛을 발하는 하루예요.'] },
  { emoji:'🌳', name:'나무', msgs:['꾸준함이 결실을 맺는 날이에요. 인내가 보상받을 거예요.','단단하게 뿌리내린 당신, 흔들림 없이 나아가요.','성장의 기운이 가득한 하루입니다.'] },
  { emoji:'🦋', name:'나비', msgs:['변화와 성장의 날! 새로운 나를 발견해보세요.','가볍고 자유로운 마음으로 하루를 즐겨보세요.','아름다운 변화가 시작되고 있어요.'] },
  { emoji:'🗝️', name:'열쇠', msgs:['닫혀있던 문이 열릴 거예요. 기회를 놓치지 마세요!','해답은 이미 당신 안에 있어요.','새로운 가능성이 열리는 날입니다.'] },
  { emoji:'🌈', name:'무지개', msgs:['비 온 뒤 맑음! 힘든 일이 끝나고 좋은 날이 와요.','다채로운 행운이 당신을 기다리고 있어요.','희망의 신호가 보이는 하루예요.'] },
  { emoji:'🎁', name:'선물', msgs:['예상치 못한 기쁨이 찾아올 거예요.','오늘 누군가에게 친절을 베풀면 더 큰 행복이 돌아와요.','뜻밖의 좋은 소식이 있을지도 몰라요!'] },
  { emoji:'⚓', name:'닻', msgs:['안정이 필요한 날, 기본에 충실해보세요.','흔들리지 않는 마음이 당신을 지켜줄 거예요.','든든한 하루의 기반을 다지기 좋아요.'] },
  { emoji:'🕊️', name:'평화', msgs:['마음의 평온을 찾는 날이에요. 잠시 쉬어가도 좋아요.','갈등이 풀리고 화해의 기운이 감돌아요.','고요한 행복이 함께하는 하루입니다.'] },
];
var TAROT_POSITIONS = ['과거', '현재', '미래'];
var _tarotFlipped = 0;
var _tarotSelected = [];

function openTarot() {
  var today = new Date();
  var seed = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
  // 날짜 기반 시드로 3장 선택
  _tarotSelected = [];
  var pool = TAROT_CARDS.slice();
  var s = seed;
  for (var i = 0; i < 3; i++) {
    s = (s * 9301 + 49297) % 233280;
    var idx = Math.floor((s / 233280) * pool.length);
    _tarotSelected.push(pool.splice(idx, 1)[0]);
  }
  // 메시지도 시드 기반 선택
  _tarotSelected.forEach(function(c, i) {
    s = (s * 9301 + 49297) % 233280;
    c._msg = c.msgs[Math.floor((s/233280) * c.msgs.length)];
  });

  _tarotFlipped = 0;
  var savedToday = localStorage.getItem('mp_tarot_date');
  var alreadyDone = savedToday === today.toDateString();

  var cardsEl = document.getElementById('tarotCards');
  cardsEl.innerHTML = _tarotSelected.map(function(c, i) {
    return '<div class="tarot-card-slot">' +
      '<div class="tarot-position">' + TAROT_POSITIONS[i] + '</div>' +
      '<div class="tarot-card' + (alreadyDone?' flipped':'') + '" id="tarotCard' + i + '" onclick="flipTarot(' + i + ')">' +
        '<div class="tarot-card-inner">' +
          '<div class="tarot-card-face tarot-card-back"></div>' +
          '<div class="tarot-card-face tarot-card-front">' +
            '<div class="tarot-card-emoji">' + c.emoji + '</div>' +
            '<div class="tarot-card-name">' + c.name + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('tarotMessages').innerHTML = '';
  document.getElementById('tarotIntro').textContent = alreadyDone ? '오늘의 타로 결과예요 ✨' : '카드 3장을 탭해서 오늘의 운세를 확인하세요 ✨';

  if (alreadyDone) {
    _tarotFlipped = 3;
    showTarotMessages();
  }

  document.getElementById('tarotOverlay').classList.add('show');
}
function closeTarot() { document.getElementById('tarotOverlay').classList.remove('show'); }

function flipTarot(i) {
  var card = document.getElementById('tarotCard' + i);
  if (card.classList.contains('flipped')) return;
  card.classList.add('flipped');
  _tarotFlipped++;
  if (typeof playSfx === 'function') playSfx();
  if (_tarotFlipped >= 3) {
    localStorage.setItem('mp_tarot_date', new Date().toDateString());
    setTimeout(showTarotMessages, 700);
  }
}

function showTarotMessages() {
  var el = document.getElementById('tarotMessages');
  el.innerHTML = _tarotSelected.map(function(c, i) {
    return '<div class="tarot-msg-card" id="tarotMsg' + i + '">' +
      '<div class="tarot-msg-pos">' + TAROT_POSITIONS[i] + ' · ' + c.emoji + ' ' + c.name + '</div>' +
      '<div class="tarot-msg-text">' + c._msg + '</div>' +
    '</div>';
  }).join('') + '<div class="tarot-done">🔮 내일 또 새로운 카드를 만나요</div>';
  // 순차 등장
  _tarotSelected.forEach(function(_, i) {
    setTimeout(function() {
      var m = document.getElementById('tarotMsg' + i);
      if (m) m.classList.add('show');
    }, i * 300);
  });
  document.getElementById('tarotIntro').textContent = '오늘의 타로 결과예요 ✨';
}

// ════════════════════════════════════════════════════════════
// ── 스티커 수집북 ──
// ════════════════════════════════════════════════════════════
var STICKERS = [
  { id:'first', emoji:'🌱', name:'첫걸음', cond:function(s){ return s.total>=1; } },
  { id:'ten', emoji:'🔟', name:'열 개 달성', cond:function(s){ return s.total>=10; } },
  { id:'fifty', emoji:'🏅', name:'50 클럽', cond:function(s){ return s.total>=50; } },
  { id:'hundred', emoji:'💯', name:'백 개 돌파', cond:function(s){ return s.total>=100; } },
  { id:'streak3', emoji:'🔥', name:'3일 연속', cond:function(s){ return s.streak>=3; } },
  { id:'streak7', emoji:'⚡', name:'일주일', cond:function(s){ return s.streak>=7; } },
  { id:'streak30', emoji:'👑', name:'한 달', cond:function(s){ return s.streak>=30; } },
  { id:'early', emoji:'🌅', name:'아침형', cond:function(s){ return s.early; } },
  { id:'night', emoji:'🦉', name:'올빼미', cond:function(s){ return s.night; } },
  { id:'level5', emoji:'🌿', name:'새싹', cond:function(s){ return s.level>=5; } },
  { id:'level10', emoji:'🌸', name:'꽃봉오리', cond:function(s){ return s.level>=10; } },
  { id:'level20', emoji:'🌳', name:'나무', cond:function(s){ return s.level>=20; } },
  { id:'level30', emoji:'⭐', name:'별', cond:function(s){ return s.level>=30; } },
  { id:'level50', emoji:'🏆', name:'전설', cond:function(s){ return s.level>=50; } },
  { id:'pet', emoji:'🐾', name:'펫 주인', cond:function(s){ return s.hasPet; } },
  { id:'letter', emoji:'💌', name:'편지왕', cond:function(s){ return s.letters>=1; } },
  { id:'tarot', emoji:'🔮', name:'점술가', cond:function(s){ return s.tarot; } },
  { id:'budget', emoji:'💰', name:'알뜰살뜰', cond:function(s){ return s.budgetTx>=10; } },
  { id:'water', emoji:'💧', name:'물마시기', cond:function(s){ return s.water; } },
  { id:'sleep', emoji:'😴', name:'꿀잠', cond:function(s){ return s.sleep; } },
  { id:'mood', emoji:'😊', name:'감정기록', cond:function(s){ return s.moods>=5; } },
  { id:'memo', emoji:'📝', name:'메모광', cond:function(s){ return s.memos>=3; } },
  { id:'focus', emoji:'🎯', name:'집중력', cond:function(s){ return s.focus>=3; } },
  { id:'theme', emoji:'🎨', name:'멋쟁이', cond:function(s){ return s.themeChanged; } },
  { id:'friend', emoji:'🤝', name:'인싸', cond:function(s){ return s.friends>=1; } },
  { id:'roulette', emoji:'🎰', name:'룰렛러', cond:function(s){ return s.roulette; } },
  { id:'memory', emoji:'🃏', name:'기억의달인', cond:function(s){ return s.memoryWin; } },
  { id:'market', emoji:'🏪', name:'쇼핑러', cond:function(s){ return s.packs>=1; } },
  { id:'challenge', emoji:'📅', name:'도전자', cond:function(s){ return s.challenge; } },
  { id:'allstar', emoji:'🌟', name:'올스타', cond:function(s){ return s.total>=200 && s.streak>=14; } },
];

function getStickerStats() {
  var calData = getCalData ? getCalData() : {};
  var moods = 0;
  for (var i = 0; i < 60; i++) {
    var d = new Date(); d.setDate(d.getDate()-i);
    var k = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if (localStorage.getItem('mp_mood_'+k)) moods++;
  }
  var memos = 0, letters = 0, packs = 0, friends = 0;
  try { memos = JSON.parse(localStorage.getItem('mp_memos')||'[]').length; } catch(e) {}
  try { letters = JSON.parse(localStorage.getItem('mp_letters')||'[]').length; } catch(e) {}
  try { packs = JSON.parse(localStorage.getItem('mp_owned_packs')||'[]').length; } catch(e) {}
  try { friends = JSON.parse(localStorage.getItem('mp_friends')||'[]').length; } catch(e) {}
  var budgetTx = 0;
  try { budgetTx = (JSON.parse(localStorage.getItem('mp_budget')||'{}').transactions||[]).length; } catch(e) {}

  return {
    total: parseInt(localStorage.getItem('mp_total_completed')||'0'),
    streak: parseInt(localStorage.getItem('mp_streak_count')||'0'),
    level: (typeof getLevel==='function') ? getLevel() : 0,
    early: localStorage.getItem('mp_early_bird')==='1',
    night: localStorage.getItem('mp_night_owl')==='1',
    hasPet: !!localStorage.getItem('mp_pet'),
    letters: letters,
    tarot: !!localStorage.getItem('mp_tarot_date'),
    budgetTx: budgetTx,
    water: !!localStorage.getItem('mp_water'),
    sleep: !!localStorage.getItem('mp_sleep_today'),
    moods: moods,
    memos: memos,
    focus: parseInt(localStorage.getItem('mp_focus_count')||'0'),
    themeChanged: localStorage.getItem('mp_theme_color') && localStorage.getItem('mp_theme_color')!=='gold',
    friends: friends,
    roulette: !!localStorage.getItem('mp_roulette_used'),
    memoryWin: !!localStorage.getItem('mp_memory_win'),
    packs: packs,
    challenge: !!localStorage.getItem('mp_challenge_active'),
  };
}

function openStickers() {
  renderStickers();
  document.getElementById('stickerOverlay').classList.add('show');
}
function closeStickers() { document.getElementById('stickerOverlay').classList.remove('show'); }

function renderStickers() {
  var stats = getStickerStats();
  var unlocked = 0;
  var grid = document.getElementById('stickerGrid');
  grid.innerHTML = STICKERS.map(function(s) {
    var got = s.cond(stats);
    if (got) unlocked++;
    return '<div class="sticker-item ' + (got?'unlocked':'locked') + '" onclick="' + (got?'showStickerInfo':'showStickerLocked') + '(\'' + s.id + '\')">' +
      '<div class="sticker-emoji">' + (got ? s.emoji : '❓') + '</div>' +
      '<div class="sticker-name">' + (got ? s.name : '???') + '</div>' +
    '</div>';
  }).join('');
  document.getElementById('stickerProgressNum').textContent = unlocked + ' / ' + STICKERS.length;
}

function showStickerInfo(id) {
  var s = STICKERS.find(function(x){ return x.id===id; });
  if (s && typeof showToast === 'function') showToast(s.emoji + ' ' + s.name + ' 스티커 획득!');
}
function showStickerLocked(id) {
  if (typeof showToast === 'function') showToast('🔒 아직 잠겨있는 스티커예요');
}

// ════════════════════════════════════════════════════════════
// ── 데일리 랜덤 이벤트 ──
// ════════════════════════════════════════════════════════════
var EVENT_PRIZES = [
  { emoji:'⚡', text:'XP 2배 부스터!', desc:'오늘 하루 XP를 2배로 받아요', action:function(){ localStorage.setItem('mp_xp_boost', String(Date.now()+86400000)); } },
  { emoji:'⭐', text:'별빛 10개 획득!', desc:'마켓에서 사용할 수 있어요', action:function(){ if(typeof addStars==='function') addStars(10); } },
  { emoji:'💎', text:'보너스 XP 30!', desc:'오늘의 행운 보너스', action:function(){ if(typeof addXP==='function') addXP(30); } },
  { emoji:'🎁', text:'미션 스킵권 1개!', desc:'미션 하나를 건너뛸 수 있어요', action:function(){ var n=parseInt(localStorage.getItem('mp_skip_tokens')||'0'); localStorage.setItem('mp_skip_tokens',String(n+1)); } },
  { emoji:'🍀', text:'행운의 날!', desc:'오늘 완료하는 미션 XP +2', action:function(){ localStorage.setItem('mp_lucky_day', new Date().toDateString()); } },
  { emoji:'🌟', text:'별빛 5개 + XP 15!', desc:'더블 보너스!', action:function(){ if(typeof addStars==='function') addStars(5); if(typeof addXP==='function') addXP(15); } },
  { emoji:'🔥', text:'스트릭 보호권!', desc:'하루 미션을 놓쳐도 스트릭이 유지돼요', action:function(){ localStorage.setItem('mp_streak_shield','1'); } },
  { emoji:'💖', text:'펫 행복 가득!', desc:'펫의 행복도가 가득 채워졌어요', action:function(){ try{ var p=JSON.parse(localStorage.getItem('mp_pet')||'null'); if(p){ p.happy=100; p.energy=100; localStorage.setItem('mp_pet',JSON.stringify(p)); } }catch(e){} } },
];

var _eventResult = null;
var _eventSpinning = false;

function checkDailyEvent() {
  var today = new Date().toDateString();
  var lastEvent = localStorage.getItem('mp_event_date');
  if (lastEvent !== today) {
    // 앱 열고 잠시 후 이벤트 표시
    setTimeout(function() { openEvent(); }, 1500);
  }
}

function closeEvent() {
  var el = document.getElementById("eventOverlay");
  if (el) el.classList.remove("show");
}

function openEvent() {
  var today = new Date().toDateString();
  if (localStorage.getItem('mp_event_date') === today) {
    if (typeof showToast === 'function') showToast('오늘의 행운은 이미 받았어요! 내일 또 와요 🎲');
    return;
  }
  document.getElementById('eventResultText').textContent = '';
  document.getElementById('eventResultDesc').textContent = '';
  document.getElementById('eventClaimBtn').style.display = 'none';
  buildEventReel();
  document.getElementById('eventOverlay').classList.add('show');
  setTimeout(spinEvent, 600);
}

function buildEventReel() {
  var reel = document.getElementById('eventReel');
  // 여러 이모지를 세로로 배치 (슬롯 효과)
  var items = [];
  for (var i = 0; i < 20; i++) {
    items.push(EVENT_PRIZES[Math.floor(Math.random()*EVENT_PRIZES.length)].emoji);
  }
  _eventResult = EVENT_PRIZES[Math.floor(Math.random()*EVENT_PRIZES.length)];
  items.push(_eventResult.emoji);
  reel.innerHTML = items.map(function(e){ return '<div class="event-slot-item">' + e + '</div>'; }).join('');
  reel.style.transform = 'translateY(0)';
}

function spinEvent() {
  if (_eventSpinning) return;
  _eventSpinning = true;
  var reel = document.getElementById('eventReel');
  var total = 20; // 마지막이 결과
  var duration = 2500;
  var start = Date.now();

  if (typeof playSfx === 'function') playSfx();

  function animate() {
    var elapsed = Date.now() - start;
    var progress = Math.min(1, elapsed / duration);
    // ease-out
    var eased = 1 - Math.pow(1 - progress, 3);
    var offset = eased * total * 120;
    reel.style.transform = 'translateY(-' + offset + 'px)';
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      _eventSpinning = false;
      showEventResult();
    }
  }
  requestAnimationFrame(animate);
}

function showEventResult() {
  document.getElementById('eventResultText').textContent = _eventResult.text;
  document.getElementById('eventResultDesc').textContent = _eventResult.desc;
  document.getElementById('eventClaimBtn').style.display = 'inline-block';
  if (typeof playSfx === 'function') playSfx();
  if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
}

function claimEvent() {
  if (_eventResult && _eventResult.action) _eventResult.action();
  localStorage.setItem('mp_event_date', new Date().toDateString());
  document.getElementById('eventOverlay').classList.remove('show');
  if (typeof showToast === 'function') showToast('🎉 ' + _eventResult.text + ' 받았어요!');
}

// ════════════════════════════════════════════════════════════
// ── 카드 매칭 게임 ──
// ════════════════════════════════════════════════════════════
var MEMORY_EMOJIS = ['🎯','⭐','🔥','💎','🌟','🎨','🌈','🚀','🎵','💪','📚','🧘','☕','🌳','🦋','🏆'];
var _memoryDiff = 4;
var _memoryCards = [];
var _memoryFlipped = [];
var _memoryMatched = 0;
var _memoryMoves = 0;
var _memoryTimer = null;
var _memorySeconds = 0;
var _memoryLock = false;

function openMemory() {
  document.getElementById('memoryStats').style.display = 'none';
  document.getElementById('memoryBoard').style.display = 'none';
  document.getElementById('memoryDiffSelect').style.display = 'flex';
  document.getElementById('memoryStart').style.display = 'block';
  document.getElementById('memoryBoard').innerHTML = '';
  document.getElementById('memoryOverlay').classList.add('show');
}
function closeMemory() {
  clearInterval(_memoryTimer);
  document.getElementById('memoryOverlay').classList.remove('show');
}

function setMemoryDiff(btn, n) {
  _memoryDiff = n;
  document.querySelectorAll('.memory-diff-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

function startMemory() {
  var pairs = _memoryDiff === 4 ? 8 : 12; // 4x4=16(8쌍), 6x4=24(12쌍)
  var cols = 4;
  var emojis = MEMORY_EMOJIS.slice(0, pairs);
  _memoryCards = emojis.concat(emojis);
  // 셔플
  for (var i = _memoryCards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i+1));
    var t = _memoryCards[i]; _memoryCards[i] = _memoryCards[j]; _memoryCards[j] = t;
  }
  _memoryFlipped = [];
  _memoryMatched = 0;
  _memoryMoves = 0;
  _memorySeconds = 0;
  _memoryLock = false;

  var board = document.getElementById('memoryBoard');
  board.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  board.innerHTML = _memoryCards.map(function(e, i) {
    return '<div class="memory-card" id="memCard' + i + '" onclick="flipMemory(' + i + ')">' +
      '<div class="memory-card-inner">' +
        '<div class="memory-card-face memory-card-back"></div>' +
        '<div class="memory-card-face memory-card-front">' + e + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('memoryDiffSelect').style.display = 'none';
  document.getElementById('memoryStart').style.display = 'none';
  document.getElementById('memoryBoard').style.display = 'grid';
  document.getElementById('memoryStats').style.display = 'flex';
  document.getElementById('memMatches').textContent = '0';
  document.getElementById('memMoves').textContent = '0';
  document.getElementById('memTime').textContent = '0:00';

  clearInterval(_memoryTimer);
  _memoryTimer = setInterval(function() {
    _memorySeconds++;
    var m = Math.floor(_memorySeconds/60);
    var s = _memorySeconds%60;
    document.getElementById('memTime').textContent = m + ':' + (s<10?'0':'') + s;
  }, 1000);
}

function flipMemory(i) {
  if (_memoryLock) return;
  var card = document.getElementById('memCard' + i);
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (_memoryFlipped.length >= 2) return;

  card.classList.add('flipped');
  _memoryFlipped.push(i);
  if (typeof playSfx === 'function') playSfx();

  if (_memoryFlipped.length === 2) {
    _memoryMoves++;
    document.getElementById('memMoves').textContent = _memoryMoves;
    _memoryLock = true;
    var a = _memoryFlipped[0], b = _memoryFlipped[1];
    if (_memoryCards[a] === _memoryCards[b]) {
      // 매치 성공
      setTimeout(function() {
        document.getElementById('memCard'+a).classList.add('matched');
        document.getElementById('memCard'+b).classList.add('matched');
        _memoryMatched++;
        document.getElementById('memMatches').textContent = _memoryMatched;
        _memoryFlipped = [];
        _memoryLock = false;
        var totalPairs = _memoryDiff === 4 ? 8 : 12;
        if (_memoryMatched >= totalPairs) winMemory();
      }, 500);
    } else {
      // 실패 - 다시 뒤집기
      setTimeout(function() {
        document.getElementById('memCard'+a).classList.remove('flipped');
        document.getElementById('memCard'+b).classList.remove('flipped');
        _memoryFlipped = [];
        _memoryLock = false;
      }, 900);
    }
  }
}

function winMemory() {
  clearInterval(_memoryTimer);
  localStorage.setItem('mp_memory_win', '1');
  var xpReward = _memoryDiff === 4 ? 10 : 20;
  if (typeof addXP === 'function') addXP(xpReward);

  // 최고 기록 저장
  var recordKey = 'mp_memory_record_' + _memoryDiff;
  var best = parseInt(localStorage.getItem(recordKey) || '99999');
  var isNewRecord = _memorySeconds < best;
  if (isNewRecord) localStorage.setItem(recordKey, String(_memorySeconds));

  var m = Math.floor(_memorySeconds/60);
  var s = _memorySeconds%60;
  var timeStr = m + ':' + (s<10?'0':'') + s;

  var board = document.getElementById('memoryBoard');
  document.getElementById('memoryStats').style.display = 'none';
  board.style.display = 'block';
  board.innerHTML = '<div class="memory-win">' +
    '<div class="memory-win-emoji">🎉</div>' +
    '<div style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:8px">클리어!</div>' +
    '<div style="font-size:14px;color:var(--text-muted);margin-bottom:4px">시간: ' + timeStr + ' · 시도: ' + _memoryMoves + '회</div>' +
    (isNewRecord ? '<div style="font-size:13px;color:var(--gold);font-weight:700;margin-bottom:8px">🏆 신기록 달성!</div>' : '') +
    '<div style="font-size:15px;color:var(--gold);font-weight:700;margin-bottom:20px">+' + xpReward + ' XP 획득!</div>' +
    '<button class="b-submit-btn" style="max-width:200px;margin:0 auto" onclick="openMemory()">다시 하기</button>' +
  '</div>';

  if (typeof playSfx === 'function') playSfx();
  if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
  if (typeof showToast === 'function') showToast('🎉 카드 매칭 클리어! +' + xpReward + ' XP');
}

// ════════════════════════════════════════════════════════════
// ── 미션 어드벤처 RPG (프리미엄) ──
// 미션 1개 완료 = 1챕터 진행. 선택지 분기 스토리.
// ════════════════════════════════════════════════════════════
var ADV_STORY = {
  start: {
    scene:'village', char:'🧙', location:'📍 시작의 마을', chapter:'프롤로그',
    speaker:'늙은 현자',
    text:'여행자여, 잘 왔네. 이 세계 "모멘티아"는 시간의 균열로 위기에 빠졌어. 매일 작은 행동(미션)으로 빛의 조각을 모아야만 세계를 구할 수 있네. 준비됐는가?',
    choices:[
      { text:'⚔️ 운명을 받아들이겠습니다', next:'village_2', primary:true },
      { text:'🤔 더 자세히 들려주세요', next:'village_info' },
    ]
  },
  village_info: {
    scene:'village', char:'🧙', location:'📍 시작의 마을', chapter:'프롤로그',
    speaker:'늙은 현자',
    text:'시간의 마왕 "크로노스"가 세계의 시간을 멈추려 하네. 자네가 현실에서 미션을 완료할 때마다 이 세계에 빛이 깃들고, 이야기가 한 걸음씩 나아간다네. 작은 실천이 곧 영웅의 여정이지.',
    choices:[
      { text:'⚔️ 이제 떠날 준비가 됐어요', next:'village_2', primary:true },
    ]
  },
  village_2: {
    scene:'village', char:'🧝', location:'📍 시작의 마을', chapter:'1장 · 출발',
    speaker:'마을 소녀 리아',
    text:'영웅님! 마을 밖 "속삭이는 숲"에 빛의 조각이 있대요. 하지만 길이 어두워서... 미션을 완료하면 길에 빛이 들어올 거예요!',
    requireMission:true,
    choices:[
      { text:'🌲 숲으로 떠난다', next:'forest_1', primary:true },
    ]
  },
  forest_1: {
    scene:'forest', char:'🧙', location:'📍 속삭이는 숲', chapter:'2장 · 숲의 시련',
    speaker:'???',
    text:'숲 깊은 곳에서 목소리가 들린다. "빛을 모으는 자여... 나를 지나가려면 마음의 용기를 보여라." 거대한 그림자가 나타났다!',
    requireMission:true,
    choices:[
      { text:'🗡️ 정면으로 맞선다', next:'forest_fight', primary:true },
      { text:'🕊️ 대화를 시도한다', next:'forest_talk' },
    ]
  },
  forest_fight: {
    scene:'forest', char:'⚔️', location:'📍 속삭이는 숲', chapter:'2장 · 숲의 시련',
    speaker:'숲의 수호자',
    text:'"용감하구나!" 그림자는 빛으로 변했다. "너의 꾸준함이 진정한 힘이다. 이 빛의 조각을 받아라." 첫 번째 조각을 얻었다! ✨',
    requireMission:true,
    choices:[
      { text:'🏔️ 산맥으로 향한다', next:'mountain_1', primary:true },
    ]
  },
  forest_talk: {
    scene:'forest', char:'🕊️', location:'📍 속삭이는 숲', chapter:'2장 · 숲의 시련',
    speaker:'숲의 수호자',
    text:'"지혜로운 선택이군." 수호자가 미소지었다. "폭력이 아닌 이해를 택하는 자만이 진정한 빛을 안다." 빛의 조각과 함께 지혜의 축복을 받았다! ✨🌟',
    requireMission:true,
    choices:[
      { text:'🏔️ 산맥으로 향한다', next:'mountain_1', primary:true },
    ]
  },
  mountain_1: {
    scene:'mountain', char:'🧗', location:'📍 서리 산맥', chapter:'3장 · 험준한 길',
    speaker:'나레이션',
    text:'차가운 바람이 부는 산맥. 정상에는 두 번째 빛의 조각이 있다. 하지만 길은 험하고, 포기하고 싶은 유혹이 밀려온다...',
    requireMission:true,
    choices:[
      { text:'🔥 의지로 추위를 이겨낸다', next:'mountain_2', primary:true },
      { text:'🏕️ 잠시 쉬며 힘을 모은다', next:'mountain_rest' },
    ]
  },
  mountain_rest: {
    scene:'mountain', char:'🏕️', location:'📍 서리 산맥', chapter:'3장 · 험준한 길',
    speaker:'나레이션',
    text:'잠시 쉬어가는 것도 지혜다. 모닥불 옆에서 체력을 회복한 당신은 다시 힘차게 일어섰다. 휴식도 여정의 일부니까.',
    requireMission:true,
    choices:[
      { text:'⛰️ 정상으로 오른다', next:'mountain_2', primary:true },
    ]
  },
  mountain_2: {
    scene:'mountain', char:'🦅', location:'📍 서리 산맥 정상', chapter:'3장 · 험준한 길',
    speaker:'산의 정령',
    text:'정상에 도달했다! 산의 정령이 나타나 말한다. "여기까지 포기하지 않고 온 너에게 두 번째 빛의 조각을 주겠다. 이제 마지막 관문, 크로노스의 성으로 가거라."',
    requireMission:true,
    choices:[
      { text:'🏰 크로노스의 성으로', next:'castle_1', primary:true },
    ]
  },
  castle_1: {
    scene:'castle', char:'🚪', location:'📍 크로노스의 성', chapter:'4장 · 운명의 성',
    speaker:'나레이션',
    text:'거대한 성문이 열린다. 성 안은 멈춰버린 시간으로 가득하다. 복도 끝에서 마왕 크로노스의 기운이 느껴진다. 마지막 조각이 가까워졌다.',
    requireMission:true,
    choices:[
      { text:'⚔️ 마왕에게 향한다', next:'castle_boss', primary:true },
      { text:'🔍 성을 먼저 탐색한다', next:'castle_explore' },
    ]
  },
  castle_explore: {
    scene:'castle', char:'🔍', location:'📍 크로노스의 성', chapter:'4장 · 운명의 성',
    speaker:'나레이션',
    text:'성을 탐색하던 중 숨겨진 보물상자를 발견했다! 안에는 "영웅의 검"이 들어있다. 이 검은 시간의 마법도 베어낼 수 있다고 한다. 든든한 무기를 얻었다! ⚔️✨',
    requireMission:true,
    choices:[
      { text:'⚔️ 이제 마왕에게 향한다', next:'castle_boss', primary:true },
    ]
  },
  castle_boss: {
    scene:'final', char:'🐉', location:'📍 옥좌의 방', chapter:'최종장 · 시간의 마왕',
    speaker:'시간의 마왕 크로노스',
    text:'"하찮은 인간이 여기까지... 하지만 네가 모은 빛의 조각으로는 나를 막을 수 없다!" 크로노스가 시간을 멈추려 한다. 모든 것이 당신에게 달렸다!',
    requireMission:true,
    choices:[
      { text:'✨ 빛의 조각을 모두 발한다', next:'ending_good', primary:true },
      { text:'💪 마지막 힘을 짜낸다', next:'ending_good' },
    ]
  },
  ending_good: {
    scene:'final', char:'🌟', location:'📍 옥좌의 방', chapter:'엔딩',
    speaker:'나레이션',
    text:'당신이 모은 빛의 조각들이 하나로 합쳐져 눈부신 빛을 발했다! "이럴 수가...!" 크로노스가 빛 속으로 사라진다. 멈췄던 시간이 다시 흐르기 시작한다. 모멘티아 세계가 구원받았다! 🎉',
    choices:[
      { text:'🎊 영웅의 여정을 완료한다', next:'ending_final', primary:true },
    ]
  },
  ending_final: {
    scene:'village', char:'👑', location:'📍 시작의 마을', chapter:'에필로그',
    speaker:'늙은 현자',
    text:'"자네는 진정한 영웅이 되었네. 매일의 작은 실천이 세계를 구한 거야." 마을 사람들이 당신을 환호한다. 당신의 꾸준함이 만든 기적이었다. 새로운 모험은 언제든 다시 시작할 수 있다네. ✨',
    choices:[
      { text:'🔄 새로운 모험 시작하기', next:'RESTART', primary:true },
    ]
  },
};

var _advMissionGate = false;

function getAdvState() {
  try { return JSON.parse(localStorage.getItem('mp_adventure') || 'null') || { node:'start', missionsAtNode:0 }; }
  catch(e) { return { node:'start', missionsAtNode:0 }; }
}
function saveAdvState(s) { localStorage.setItem('mp_adventure', JSON.stringify(s)); }

function openAdventure() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  renderAdventure();
  document.getElementById('advOverlay').classList.add('show');
}
function closeAdventure() { document.getElementById('advOverlay').classList.remove('show'); }

function renderAdventure() {
  var state = getAdvState();
  var node = ADV_STORY[state.node] || ADV_STORY.start;

  // 배경
  var bg = document.getElementById('advSceneBg');
  bg.className = 'adv-scene-bg scene-' + node.scene;

  // 헤더
  document.getElementById('advChapterLabel').textContent = node.chapter;
  document.getElementById('advLocation').textContent = node.location;
  var level = (typeof getLevel === 'function') ? getLevel() : 1;
  document.getElementById('advHeroLevel').textContent = 'Lv.' + (level+1);

  // 캐릭터 & 대사
  document.getElementById('advCharacter').textContent = node.char;
  document.getElementById('advSpeaker').textContent = node.speaker;
  document.getElementById('advText').textContent = node.text;

  // 미션 게이트 체크
  var totalCompleted = (typeof getTotalCompleted === 'function') ? getTotalCompleted() : 0;
  var progressEl = document.getElementById('advProgressInfo');
  var choicesEl = document.getElementById('advChoices');

  if (node.requireMission) {
    var needed = (state.missionsAtNode || 0) + 1;
    var savedBaseline = state.baseline !== undefined ? state.baseline : totalCompleted;
    if (state.baseline === undefined) {
      state.baseline = totalCompleted;
      saveAdvState(state);
    }
    var doneSinceNode = totalCompleted - state.baseline;

    if (doneSinceNode < 1) {
      // 미션 완료 필요
      progressEl.innerHTML = '🔒 다음 이야기를 보려면 <b style="color:var(--gold)">미션 1개</b>를 완료하세요!';
      choicesEl.innerHTML = node.choices.map(function(c) {
        return '<button class="adv-choice-btn locked" onclick="advNeedMission()">' + c.text +
          '<span class="choice-hint">🔒 미션 완료 후 선택 가능</span></button>';
      }).join('');
      return;
    }
  }

  // 선택지 표시
  progressEl.textContent = node.requireMission ? '✨ 빛의 조각을 얻었다! 이야기를 이어가세요' : '';
  choicesEl.innerHTML = node.choices.map(function(c, i) {
    return '<button class="adv-choice-btn ' + (c.primary?'primary':'') + '" onclick="advChoose(\'' + c.next + '\')">' + c.text + '</button>';
  }).join('');
}

function advNeedMission() {
  if (typeof showToast === 'function') showToast('🔒 미션을 먼저 완료해주세요!');
  closeAdventure();
}

function advChoose(next) {
  var state = getAdvState();
  if (next === 'RESTART') {
    state = { node:'start', missionsAtNode:0 };
    delete state.baseline;
    saveAdvState(state);
    renderAdventure();
    if (typeof showToast === 'function') showToast('🔄 새로운 모험이 시작됐어요!');
    return;
  }
  state.node = next;
  // 새 노드의 baseline 초기화
  delete state.baseline;
  saveAdvState(state);
  if (typeof playSfx === 'function') playSfx();
  renderAdventure();

  // 엔딩 도달 시 보상
  if (next === 'ending_final') {
    if (typeof addXP === 'function') addXP(50);
    if (typeof addStars === 'function') addStars(20);
    setTimeout(function() {
      if (typeof showToast === 'function') showToast('🎉 어드벤처 클리어! +50 XP, +20⭐');
    }, 500);
  }
}

// ════════════════════════════════════════════════════════════
// ── 미션 완료 시 모든 기능 연동 (통합 훅) ──
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  // 데일리 이벤트 체크
  // checkDailyEvent는 더보기 메뉴에서 수동으로만 실행

  // addTotalCompleted 통합 훅
  var origAddTotal = window.addTotalCompleted;
  window.addTotalCompleted = function(n) {
    if (origAddTotal) origAddTotal(n);
    if (!n) {
      // 펫 성장
      if (window._petOnMissionComplete) window._petOnMissionComplete();
      // 별빛 획득
      if (window._starOnComplete) window._starOnComplete();
      // 룰렛 사용 표시
    }
  };
});

// ════════════════════════════════════════
// ── 🎰 미션 룰렛 ──
// ════════════════════════════════════════
var _rouletteResult = null;
var _rouletteSpinning = false;
var ROULETTE_COLORS = ['#c9a84c','#a78bfa','#60a5fa','#34d399','#f87171','#fb923c','#f472b6','#38bdf8'];

function openRoulette() {
  var overlay = document.getElementById('rouletteOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  var res = document.getElementById('rouletteResult');
  if (res) res.classList.remove('show');
  var btn = document.getElementById('rouletteSpinBtn');
  if (btn) { btn.disabled = false; btn.textContent = '🎰 SPIN!'; }
  setTimeout(function() { drawRoulette(0); }, 100);
}
function closeRoulette() {
  var overlay = document.getElementById('rouletteOverlay');
  if (overlay) overlay.classList.remove('show');
}

function getRouletteItems() {
  var items = (window.MISSIONS || []).filter(function(m) {
    return window.state && window.state[String(m.id)] && !window.state[String(m.id)].completed;
  });
  if (items.length < 4) items = window.MISSIONS || [];
  if (!items.length) return [{icon:'✨', name:'새 미션 추가하기', desc:'미션을 추가해보세요'}];
  var shuffled = items.slice().sort(function(){ return Math.random()-.5; });
  return shuffled.slice(0, Math.min(8, shuffled.length));
}

function drawRoulette(rotation) {
  var canvas = document.getElementById('rouletteCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var cx = 140, cy = 140, r = 134;
  var items = getRouletteItems();
  var n = items.length;
  var arc = (Math.PI * 2) / n;
  ctx.clearRect(0, 0, 280, 280);
  for (var i = 0; i < n; i++) {
    var start = rotation + i * arc - Math.PI/2;
    var end = start + arc;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = ROULETTE_COLORS[i % ROULETTE_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,15,.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Noto Sans KR, sans-serif';
    var name = items[i].name.length > 8 ? items[i].name.slice(0,8)+'...' : items[i].name;
    ctx.fillText(items[i].icon + ' ' + name, r - 8, 4);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI*2);
  ctx.fillStyle = '#0a0a0f';
  ctx.fill();
  ctx.strokeStyle = ROULETTE_COLORS[0];
  ctx.lineWidth = 2;
  ctx.stroke();
}

function spinRoulette() {
  if (_rouletteSpinning) return;
  _rouletteSpinning = true;
  var btn = document.getElementById('rouletteSpinBtn');
  btn.disabled = true;
  btn.textContent = '🌀 돌아가는 중...';
  document.getElementById('rouletteResult').classList.remove('show');

  var items = getRouletteItems();
  var n = items.length;
  var arc = (Math.PI * 2) / n;
  var totalSpins = 5 + Math.floor(Math.random() * 3);
  var targetIdx = Math.floor(Math.random() * n);
  var targetAngle = (Math.PI * 2 * totalSpins) + (arc * (n - targetIdx) - arc/2);
  var startTime = null;
  var duration = 4000;
  var startRot = 0;

  function animate(ts) {
    if (!startTime) startTime = ts;
    var elapsed = ts - startTime;
    var progress = Math.min(1, elapsed / duration);
    var eased = 1 - Math.pow(1 - progress, 4);
    var rot = startRot + targetAngle * eased;
    drawRoulette(rot % (Math.PI*2));
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      _rouletteSpinning = false;
      _rouletteResult = items[targetIdx];
      btn.disabled = false;
      btn.textContent = '🎰 다시 돌리기!';
      var res = document.getElementById('rouletteResult');
      document.getElementById('rouletteResultIcon').textContent = _rouletteResult.icon;
      document.getElementById('rouletteResultName').textContent = _rouletteResult.name;
      document.getElementById('rouletteResultDesc').textContent = _rouletteResult.desc;
      res.classList.add('show');
      if (typeof playSfx === 'function') playSfx();
      if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, 300);
    }
  }
  requestAnimationFrame(animate);
}

function addRouletteResult() {
  if (!_rouletteResult) return;
  closeRoulette();
  if (typeof showToast === 'function') showToast('"' + _rouletteResult.name + '" 미션이 선택됐어요! 🎰');
}

// ════════════════════════════════════════
// ── 📮 미래 편지함 ──
// ════════════════════════════════════════
var _letterPeriod = '1month';
var _showingWriteForm = false;

function getLetters() { try { return JSON.parse(localStorage.getItem('mp_letters')||'[]'); } catch(e){ return []; } }
function saveLetters(l) { localStorage.setItem('mp_letters', JSON.stringify(l)); }

function openLetterBox() {
  _showingWriteForm = false;
  document.getElementById('letterOverlay').classList.add('show');
  document.getElementById('letterWriteBtn').style.display = '';
  renderLetterList();
}
function closeLetterBox() { document.getElementById('letterOverlay').classList.remove('show'); }

function renderLetterList() {
  var letters = getLetters();
  var now = Date.now();
  var el = document.getElementById('letterContent');
  if (!el) return;

  if (_showingWriteForm) {
    el.innerHTML = [
      '<div class="letter-write-form">',
        '<h3>✉️ 미래의 나에게</h3>',
        '<input class="letter-input" id="letterTitle" placeholder="편지 제목">',
        '<textarea class="letter-textarea" id="letterBody" placeholder="미래의 나에게 하고 싶은 말을 적어보세요...\n\n지금 이 순간의 감정, 목표, 고민, 응원의 말 무엇이든 괜찮아요. 미래의 당신이 읽을 거예요 😊" rows="6"></textarea>',
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">언제 개봉할까요?</div>',
        '<div class="letter-period-grid">',
          '<button class="letter-period-btn' + (_letterPeriod==='1month'?' selected':'') + '" onclick="setLetterPeriod(\'1month\')">1개월</button>',
          '<button class="letter-period-btn' + (_letterPeriod==='3month'?' selected':'') + '" onclick="setLetterPeriod(\'3month\')">3개월</button>',
          '<button class="letter-period-btn' + (_letterPeriod==='6month'?' selected':'') + '" onclick="setLetterPeriod(\'6month\')">6개월</button>',
          '<button class="letter-period-btn' + (_letterPeriod==='1year'?' selected':'') + '" onclick="setLetterPeriod(\'1year\')">1년</button>',
        '</div>',
        '<button class="letter-seal-btn" onclick="sealLetter()">🔒 봉인하기</button>',
        '<button onclick="closeLetterWrite()" style="width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:14px;color:var(--text-muted);font-family:\'Noto Sans KR\',sans-serif;cursor:pointer;margin-top:8px">취소</button>',
      '</div>',
    ].join('');
    document.getElementById('letterWriteBtn').style.display = 'none';
    return;
  }

  if (!letters.length) {
    el.innerHTML = '<div class="letter-empty"><span class="letter-empty-icon">📮</span><div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">편지함이 비어있어요</div><div style="font-size:13px;color:var(--text-muted)">아래 ✉️ 버튼을 눌러<br>미래의 나에게 편지를 써보세요</div></div>';
    return;
  }

  el.innerHTML = letters.map(function(l) {
    var isOpen = now >= l.openAt;
    var ddays = Math.ceil((l.openAt - now) / 86400000);
    var _periodMap = {'1month':'1개월','3month':'3개월','6month':'6개월','1year':'1년'};
    var periodLabel = _periodMap[l.period] || '?';
    var color = isOpen ? 'rgba(52,211,153,.2)' : 'rgba(201,168,76,.2)';
    var borderColor = isOpen ? 'rgba(52,211,153,.5)' : 'rgba(201,168,76,.3)';
    var badgeColor = isOpen ? '#34d399' : 'var(--gold)';
    var badgeText = isOpen ? '📬 개봉 가능!' : '🔒 D-' + ddays;
    var writeDate = new Date(l.createdAt).toLocaleDateString('ko-KR');

    return '<div class="letter-card ' + (isOpen?'openable':'sealed') + '" onclick="tryOpenLetter(\'' + l.id + '\')" style="background:' + color + ';border-color:' + borderColor + '">' +
      '<div class="letter-date-badge" style="background:' + badgeColor + '22;color:' + badgeColor + ';border:1px solid ' + badgeColor + '44">' + badgeText + '</div>' +
      '<div class="letter-title">' + (l.title || '제목 없는 편지') + '</div>' +
      '<div class="letter-meta">' + writeDate + ' 작성 · ' + periodLabel + ' 후 개봉 예정</div>' +
    '</div>';
  }).join('');
}

function openLetterWrite() { _showingWriteForm = true; renderLetterList(); }
function closeLetterWrite() { _showingWriteForm = false; renderLetterList(); document.getElementById('letterWriteBtn').style.display = ''; }
function setLetterPeriod(p) { _letterPeriod = p; renderLetterList(); }

function sealLetter() {
  var title = document.getElementById('letterTitle').value.trim();
  var body = document.getElementById('letterBody').value.trim();
  if (!body) { if(typeof showToast==='function') showToast('편지 내용을 입력해주세요 ✉️', '#c97b4c'); return; }

  var periodMs = {'1month':30*86400000, '3month':90*86400000, '6month':180*86400000, '1year':365*86400000};
  var letters = getLetters();
  letters.push({
    id: Date.now().toString(), title: title || '미래의 나에게',
    body: body, period: _letterPeriod,
    createdAt: Date.now(), openAt: Date.now() + periodMs[_letterPeriod]
  });
  saveLetters(letters);
  _showingWriteForm = false;
  renderLetterList();
  document.getElementById('letterWriteBtn').style.display = '';
  if(typeof showToast==='function') showToast('편지가 봉인됐어요! 🔒 소중히 간직할게요');
  if(typeof playSfx==='function') playSfx();
}

function tryOpenLetter(id) {
  var letters = getLetters();
  var letter = letters.find(function(l){ return l.id === id; });
  if (!letter) return;
  if (Date.now() < letter.openAt) {
    var ddays = Math.ceil((letter.openAt - Date.now()) / 86400000);
    if(typeof showToast==='function') showToast('아직 열 수 없어요. D-' + ddays + '일 남았어요 🔒', '#c97b4c');
    return;
  }
  openLetterRead(letter);
}

function openLetterRead(letter) {
  var paper = document.getElementById('letterPaper');
  var writeDate = new Date(letter.createdAt).toLocaleDateString('ko-KR');
  paper.innerHTML =
    '<div class="seal-animation"></div>' +
    '<div class="letter-paper-date">' + writeDate + '의 나로부터</div>' +
    '<div class="letter-paper-title">' + (letter.title || '미래의 나에게') + '</div>' +
    '<div class="letter-paper-body">' + letter.body + '</div>' +
    '<div class="letter-paper-sig">— 과거의 나로부터</div>';
  document.getElementById('letterOpenOverlay').classList.add('show');
  if(typeof playSfx==='function') playSfx();
  if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
}

function closeLetterOpen() { document.getElementById('letterOpenOverlay').classList.remove('show'); }

// ════════════════════════════════════════
// ── 🔮 오늘의 타로 ──
// ════════════════════════════════════════
var TAROT_CARDS = [
  {id:0, name:'바보', icon:'🤡', bg:'linear-gradient(135deg,#fbbf24,#f59e0b)', readings:{past:'새로운 시작의 씨앗이 뿌려졌어요. 순수한 마음으로 내딛은 첫걸음이 지금의 당신을 만들었어요.',present:'두려움 없이 뛰어들 시간이에요. 논리보다 직관을 믿어요. 오늘은 모험이 당신을 기다려요!',future:'예상치 못한 기회가 찾아올 거예요. 열린 마음으로 받아들이면 놀라운 일이 펼쳐져요.'}},
  {id:1, name:'마법사', icon:'🧙', bg:'linear-gradient(135deg,#8b5cf6,#7c3aed)', readings:{past:'당신은 이미 필요한 모든 것을 갖고 있었어요. 그 능력들이 지금을 만들었죠.',present:'집중력이 최고조에 달했어요. 원하는 것에 온 에너지를 쏟아부으세요. 기적이 일어날 거예요.',future:'창의력이 폭발하는 시기가 와요. 새로운 프로젝트나 아이디어를 시작하기 딱 좋은 때예요.'}},
  {id:2, name:'여사제', icon:'🌙', bg:'linear-gradient(135deg,#6366f1,#4f46e5)', readings:{past:'내면의 지혜가 묵묵히 당신을 안내해왔어요. 그 목소리를 들었기에 여기까지 왔어요.',present:'답은 이미 당신 안에 있어요. 조용히 귀 기울이면 들려올 거예요. 서두르지 마세요.',future:'직관이 강해지는 시기예요. 꿈과 영감을 주의 깊게 살펴보세요. 중요한 메시지가 있어요.'}},
  {id:3, name:'여황제', icon:'👸', bg:'linear-gradient(135deg,#10b981,#059669)', readings:{past:'풍요와 돌봄의 에너지가 당신의 성장을 지탱해왔어요.',present:'창조의 시간이에요. 무언가를 만들고 키워보세요. 당신의 손길이 닿는 곳에 꽃이 피어요.',future:'물질적 풍요와 따뜻한 관계가 찾아와요. 감사하는 마음을 키워가세요.'}},
  {id:4, name:'황제', icon:'👑', bg:'linear-gradient(135deg,#c9a84c,#e8c96a)', readings:{past:'강인한 의지로 기반을 쌓아왔어요. 그 노력이 오늘의 당신입니다.',present:'리더십을 발휘할 순간이에요. 결단력 있게 행동하세요. 당신의 판단을 믿어요.',future:'안정과 성공이 기다려요. 꾸준함이 결실을 맺는 시기가 올 거예요.'}},
  {id:5, name:'교황', icon:'📿', bg:'linear-gradient(135deg,#f59e0b,#d97706)', readings:{past:'전통과 지혜가 당신의 가치관을 형성했어요.',present:'스승이나 멘토의 조언을 구해보세요. 배움에 열린 자세가 큰 성장을 가져다줘요.',future:'중요한 인연이 찾아올 거예요. 그 만남이 당신의 삶을 변화시킬 거예요.'}},
  {id:6, name:'연인', icon:'💕', bg:'linear-gradient(135deg,#f472b6,#ec4899)', readings:{past:'마음을 열고 선택했던 순간들이 지금의 관계를 만들었어요.',present:'중요한 선택의 기로에 서 있어요. 머리가 아닌 가슴으로 결정하세요.',future:'아름다운 인연이 기다려요. 진심을 다하면 사랑이 당신에게 찾아올 거예요.'}},
  {id:7, name:'전차', icon:'🏆', bg:'linear-gradient(135deg,#60a5fa,#3b82f6)', readings:{past:'강한 의지로 장애물을 극복해왔어요. 그 경험이 당신을 단단하게 만들었어요.',present:'앞으로 전진할 때예요! 두 가지 상반된 힘을 균형있게 다루면 승리해요.',future:'목표를 향한 질주가 시작돼요. 집중력을 유지하면 원하는 것을 손에 넣을 수 있어요.'}},
  {id:8, name:'힘', icon:'🦁', bg:'linear-gradient(135deg,#fb923c,#f97316)', readings:{past:'내면의 힘이 당신을 지탱해왔어요. 진정한 용기는 두려움을 느끼면서도 앞으로 나아가는 것이에요.',present:'부드러운 강함으로 도전을 극복하세요. 분노보다 침착함이 더 강력해요.',future:'내면의 힘이 더욱 강해질 거예요. 자신을 믿으세요.'}},
  {id:9, name:'은둔자', icon:'🕯️', bg:'linear-gradient(135deg,#6b7280,#4b5563)', readings:{past:'홀로 걸어온 시간들이 깊은 통찰을 가져다줬어요.',present:'잠시 물러서서 내면을 들여다볼 시간이에요. 고독 속에서 답을 찾을 수 있어요.',future:'깨달음의 시기가 와요. 명상이나 혼자만의 시간이 큰 도움이 될 거예요.'}},
  {id:10, name:'운명의 수레', icon:'☸️', bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', readings:{past:'운명의 흐름이 여러 기회들을 당신 앞에 가져다줬어요.',present:'운이 바뀌는 시점이에요. 변화에 저항하지 말고 흐름에 올라타세요.',future:'행운의 바람이 불어와요. 새로운 사이클이 시작되는 시기예요.'}},
  {id:11, name:'정의', icon:'⚖️', bg:'linear-gradient(135deg,#34d399,#10b981)', readings:{past:'공정한 선택들이 지금의 결과를 만들었어요.',present:'균형이 중요한 시기예요. 진실과 정직을 최우선으로 하세요.',future:'노력한 만큼 정확하게 돌아올 거예요. 바른 행동이 보상을 가져다줘요.'}},
  {id:12, name:'매달린 사람', icon:'🌀', bg:'linear-gradient(135deg,#06b6d4,#0891b2)', readings:{past:'잠시 멈추고 다른 관점으로 보았던 경험이 지혜를 줬어요.',present:'통제를 내려놓는 용기가 필요해요. 기다림 속에 깨달음이 있어요.',future:'새로운 관점이 열려요. 예상치 못한 방향에서 해답이 와요.'}},
  {id:13, name:'변환', icon:'🦋', bg:'linear-gradient(135deg,#1f2937,#111827)', readings:{past:'끝이라고 생각했던 것들이 사실 새로운 시작의 문이었어요.',present:'오래된 것을 내려놓을 시간이에요. 변화는 두렵지만 더 나은 것이 기다려요.',future:'완전한 변화가 찾아와요. 과거의 껍질을 벗고 새로운 당신으로 탄생해요.'}},
  {id:14, name:'절제', icon:'🌊', bg:'linear-gradient(135deg,#38bdf8,#0ea5e9)', readings:{past:'균형을 찾아가는 과정이 당신을 성숙하게 만들었어요.',present:'인내와 절제가 필요한 시기예요. 극단보다 중용이 최선의 결과를 가져다줘요.',future:'조화로운 시기가 펼쳐져요. 목표를 꾸준히 향해 가면 반드시 이뤄져요.'}},
  {id:15, name:'악마', icon:'🔗', bg:'linear-gradient(135deg,#dc2626,#b91c1c)', readings:{past:'집착이나 두려움이 발목을 잡았던 시간들이 있었어요. 그게 당신을 더 강하게 만들었어요.',present:'무엇에 얽매여 있나요? 그 사슬은 사실 당신이 언제든 풀 수 있어요.',future:'집착을 내려놓을 기회가 와요. 자유를 선택하면 놀라운 변화가 찾아와요.'}},
  {id:16, name:'탑', icon:'⚡', bg:'linear-gradient(135deg,#f59e0b,#dc2626)', readings:{past:'무너진 것들이 있었지만, 그것은 더 강한 기반을 위한 과정이었어요.',present:'급격한 변화가 찾아올 수 있어요. 충격적이겠지만 더 나은 것을 위한 과정이에요.',future:'예상치 못한 변화가 와도 당신은 이겨낼 수 있어요. 변화 뒤에 성장이 있어요.'}},
  {id:17, name:'별', icon:'🌟', bg:'linear-gradient(135deg,#a78bfa,#7c3aed)', readings:{past:'희망의 빛이 어두운 시간을 비춰줬어요. 그 빛을 따라왔기에 여기까지 왔어요.',present:'희망을 잃지 마세요. 지금이 가장 어두운 시간이라면 곧 새벽이 와요.',future:'꿈이 이루어질 조짐이 보여요. 믿음을 갖고 계속 앞으로 나아가세요.'}},
  {id:18, name:'달', icon:'🌕', bg:'linear-gradient(135deg,#6366f1,#4338ca)', readings:{past:'불확실한 시간들이 직관을 키워줬어요.',present:'혼란스러워 보여도 괜찮아요. 안개는 결국 걷혀요. 직관을 믿으세요.',future:'감춰진 진실이 드러날 거예요. 꿈에 주의를 기울이세요. 중요한 메시지가 있어요.'}},
  {id:19, name:'태양', icon:'☀️', bg:'linear-gradient(135deg,#fcd34d,#f59e0b)', readings:{past:'빛나는 에너지가 지금까지의 여정을 밝혀줬어요.',present:'기쁨과 활력이 넘치는 날이에요. 당신의 빛을 마음껏 발산하세요!',future:'행복하고 성공적인 시기가 와요. 자신감을 갖고 나아가면 빛나는 결과가 기다려요.'}},
  {id:20, name:'심판', icon:'🎺', bg:'linear-gradient(135deg,#e2e8f0,#94a3b8)', readings:{past:'중요한 깨달음의 순간들이 당신을 변화시켰어요.',present:'과거를 용서하고 새로운 시작을 선택할 때예요. 자신에게도 관대해지세요.',future:'큰 변화와 갱생의 기회가 와요. 과거에서 벗어나 완전히 새로운 장을 열 수 있어요.'}},
  {id:21, name:'세계', icon:'🌍', bg:'linear-gradient(135deg,#34d399,#7c3aed)', readings:{past:'완성과 성취의 에너지가 당신의 여정을 마무리 지었어요.',present:'하나의 사이클이 완성되고 있어요. 지금까지의 성취를 기뻐하세요!',future:'완전한 성취와 새로운 시작이 기다려요. 최고의 순간이 찾아올 거예요.'}}
];

var _tarotRevealed = false;

function openTarot() {
  var today = new Date().toDateString();
  var saved = localStorage.getItem('mp_tarot_date');
  _tarotRevealed = false;
  renderTarotStars();
  renderTarotCards();
  document.getElementById('tarotReading').style.display = 'none';
  document.getElementById('tarotRevealBtn').style.display = '';
  document.getElementById('tarotOverlay').classList.add('show');
}

function closeTarot() { document.getElementById('tarotOverlay').classList.remove('show'); }

function renderTarotStars() {
  var bg = document.getElementById('tarotStarsBg');
  if (!bg) return;
  var stars = '';
  for (var i = 0; i < 60; i++) {
    var x = Math.random()*100, y = Math.random()*100;
    var size = (Math.random()*2+1).toFixed(1);
    var dur = (Math.random()*3+2).toFixed(1);
    stars += '<div class="tarot-star" style="left:'+x+'%;top:'+y+'%;width:'+size+'px;height:'+size+'px;--dur:'+dur+'s;animation-delay:'+(Math.random()*3)+'s"></div>';
  }
  bg.innerHTML = stars;
}

function getTarotCards() {
  var today = new Date();
  var seed = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
  var indices = [];
  var pool = TAROT_CARDS.slice();
  var r = seed;
  for (var i = 0; i < 3; i++) {
    r = (r * 1664525 + 1013904223) & 0xffffffff;
    var idx = Math.abs(r) % pool.length;
    indices.push(pool.splice(idx, 1)[0]);
  }
  return indices;
}

function renderTarotCards() {
  var cards = getTarotCards();
  var row = document.getElementById('tarotCards');
  var pos = document.getElementById('tarotPositions');
  if (!row) return;
  row.innerHTML = cards.map(function(c, i) {
    return '<div class="tarot-card" id="tarotCard'+i+'" onclick="flipTarotCard('+i+')">' +
      '<div class="tarot-card-inner">' +
        '<div class="tarot-card-back">🔮</div>' +
        '<div class="tarot-card-front"><div class="tarot-card-gradient" style="background:'+c.bg+'">' +
          '<div style="width:100%;height:20px"></div>' +
          '<div class="tarot-card-icon">'+c.icon+'</div>' +
          '<div class="tarot-card-name">'+c.name+'</div>' +
        '</div></div>' +
      '</div>' +
    '</div>';
  }).join('');
  var positions = ['과거', '현재', '미래'];
  pos.innerHTML = positions.map(function(p) {
    return '<div style="width:88px;text-align:center;font-size:11px;color:rgba(232,201,106,.5);letter-spacing:1px">'+p+'</div>';
  }).join('');
}

function flipTarotCard(idx) {
  var card = document.getElementById('tarotCard' + idx);
  if (card) card.classList.add('flipped');
  if (typeof playSfx === 'function') playSfx();
}

function revealAllTarot() {
  var cards = getTarotCards();
  for (var i = 0; i < 3; i++) flipTarotCard(i);
  setTimeout(function() {
    var positions = ['past','present','future'];
    var posNames = ['과거', '현재', '미래'];
    var reading = document.getElementById('tarotReading');
    reading.style.display = 'block';
    reading.innerHTML = '<div class="tarot-reading">' +
      cards.map(function(c, i) {
        return '<div class="tarot-reading-card">' +
          '<div class="tarot-reading-pos">'+posNames[i]+' · '+c.name+' '+c.icon+'</div>' +
          '<div class="tarot-reading-msg">'+c.readings[positions[i]]+'</div>' +
        '</div>';
      }).join('') +
    '</div>';
    document.getElementById('tarotRevealBtn').style.display = 'none';
    if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, 300);
  }, 600);
}

// ════════════════════════════════════════
// ── 🎴 스티커 수집북 ──
// ════════════════════════════════════════
var STICKERS = [
  // 미션 완료
  {id:'s1', emoji:'🌱', name:'첫 씨앗', desc:'첫 번째 미션을 완료했어요', cond:'미션 첫 완료', cat:'미션', check:function(s){ return s.total>=1; }},
  {id:'s2', emoji:'🌿', name:'새싹 성장', desc:'미션을 10개 완료했어요', cond:'미션 10개 완료', cat:'미션', check:function(s){ return s.total>=10; }},
  {id:'s3', emoji:'🌸', name:'꽃이 피다', desc:'미션을 30개 완료했어요', cond:'미션 30개 완료', cat:'미션', check:function(s){ return s.total>=30; }},
  {id:'s4', emoji:'🌳', name:'나무가 되다', desc:'미션을 100개 완료했어요', cond:'미션 100개 완료', cat:'미션', check:function(s){ return s.total>=100; }},
  {id:'s5', emoji:'⭐', name:'별이 되다', desc:'미션을 500개 완료했어요', cond:'미션 500개 완료', cat:'미션', check:function(s){ return s.total>=500; }},
  // 스트릭
  {id:'s6', emoji:'🔥', name:'불꽃 시작', desc:'3일 연속 달성', cond:'3일 연속', cat:'스트릭', check:function(s){ return s.streak>=3; }},
  {id:'s7', emoji:'🌊', name:'파도처럼', desc:'7일 연속 달성', cond:'7일 연속', cat:'스트릭', check:function(s){ return s.streak>=7; }},
  {id:'s8', emoji:'💫', name:'빛나는 30일', desc:'30일 연속 달성', cond:'30일 연속', cat:'스트릭', check:function(s){ return s.streak>=30; }},
  {id:'s9', emoji:'👑', name:'연속의 왕', desc:'100일 연속 달성', cond:'100일 연속', cat:'스트릭', check:function(s){ return s.streak>=100; }},
  // 카테고리
  {id:'s10', emoji:'💪', name:'건강 전사', desc:'건강 카테고리 10개 완료', cond:'건강 미션 10개', cat:'카테고리', check:function(s){ return s.cats.health>=10; }},
  {id:'s11', emoji:'🧘', name:'마음의 평화', desc:'마음 카테고리 10개 완료', cond:'마음 미션 10개', cat:'카테고리', check:function(s){ return s.cats.mind>=10; }},
  {id:'s12', emoji:'🎨', name:'창의 폭발', desc:'창의 카테고리 10개 완료', cond:'창의 미션 10개', cat:'카테고리', check:function(s){ return s.cats.creative>=10; }},
  {id:'s13', emoji:'💬', name:'관계의 달인', desc:'관계 카테고리 10개 완료', cond:'관계 미션 10개', cat:'카테고리', check:function(s){ return s.cats.relation>=10; }},
  {id:'s14', emoji:'📚', name:'성장주의자', desc:'성장 카테고리 10개 완료', cond:'성장 미션 10개', cat:'카테고리', check:function(s){ return s.cats.growth>=10; }},
  {id:'s15', emoji:'🌈', name:'전방위 활동가', desc:'모든 카테고리 완료', cond:'모든 카테고리 1회 이상', cat:'카테고리', check:function(s){ return s.cats.health>=1&&s.cats.mind>=1&&s.cats.creative>=1&&s.cats.relation>=1&&s.cats.growth>=1; }},
  // 시간
  {id:'s16', emoji:'🌅', name:'아침을 여는 자', desc:'오전 7시 이전 미션 완료', cond:'새벽/아침 미션 완료', cat:'시간', check:function(s){ return s.earlyBird; }},
  {id:'s17', emoji:'🌙', name:'밤의 집중', desc:'자정 이후 미션 완료', cond:'자정 이후 미션 완료', cat:'시간', check:function(s){ return s.nightOwl; }},
  {id:'s18', emoji:'⚡', name:'번개 속도', desc:'집중 챌린지 1분 안에 시작', cond:'앱 열자마자 집중 챌린지', cat:'시간', check:function(s){ return s.fastStart; }},
  // 레벨
  {id:'s19', emoji:'🥚', name:'알에서 태어나', desc:'레벨 5 달성', cond:'Lv.5 달성', cat:'레벨', check:function(s){ return s.level>=5; }},
  {id:'s20', emoji:'🌺', name:'꽃처럼 피다', desc:'레벨 15 달성', cond:'Lv.15 달성', cat:'레벨', check:function(s){ return s.level>=15; }},
  {id:'s21', emoji:'🌲', name:'숲의 정령', desc:'레벨 25 달성', cond:'Lv.25 달성', cat:'레벨', check:function(s){ return s.level>=25; }},
  {id:'s22', emoji:'🏆', name:'전설의 시작', desc:'레벨 50 달성', cond:'최고 레벨 달성!', cat:'레벨', check:function(s){ return s.level>=50; }},
  // 가계부
  {id:'s23', emoji:'💰', name:'첫 가계부', desc:'첫 가계부 내역 입력', cond:'가계부 내역 1개', cat:'가계부', check:function(s){ return s.budgetTx>=1; }},
  {id:'s24', emoji:'🏦', name:'재테크 입문', desc:'가계부 내역 50개 입력', cond:'가계부 내역 50개', cat:'가계부', check:function(s){ return s.budgetTx>=50; }},
  {id:'s25', emoji:'💎', name:'절약의 달인', desc:'한 달 예산을 지켰어요', cond:'월 예산 달성 1회', cat:'가계부', check:function(s){ return s.budgetGoal>=1; }},
  // 특별
  {id:'s26', emoji:'🎰', name:'룰렛 마니아', desc:'룰렛을 5번 돌렸어요', cond:'룰렛 5회 이상', cat:'특별', check:function(s){ return s.roulette>=5; }},
  {id:'s27', emoji:'📮', name:'미래 작가', desc:'미래 편지를 3통 썼어요', cond:'편지 3통 이상', cat:'특별', check:function(s){ return s.letters>=3; }},
  {id:'s28', emoji:'🔮', name:'타로 마스터', desc:'타로를 7번 뽑았어요', cond:'타로 7회 이상', cat:'특별', check:function(s){ return s.tarot>=7; }},
  {id:'s29', emoji:'🃏', name:'카드 고수', desc:'카드게임을 5번 클리어', cond:'카드게임 5회 클리어', cat:'특별', check:function(s){ return s.cardgame>=5; }},
  {id:'s30', emoji:'🌟', name:'완벽한 하루', desc:'하루에 5개 미션 완료', cond:'하루 5미션 완료', cat:'특별', check:function(s){ return s.perfectDay; }},
  {id:'s31', emoji:'🐾', name:'펫 마스터', desc:'펫이 전설 단계로 진화', cond:'펫 전설 달성', cat:'특별', check:function(s){ return s.petLegend; }},
  {id:'s32', emoji:'⚔️', name:'용사', desc:'어드벤처 챕터 10 달성', cond:'어드벤처 10챕터', cat:'특별', check:function(s){ return s.advChapter>=10; }},
  {id:'s33', emoji:'💫', name:'슈퍼스타', desc:'모든 스티커 절반 획득', cond:'17개 이상 스티커 수집', cat:'특별', check:function(s){ return s.stickerCount>=17; }},
  {id:'s34', emoji:'🌍', name:'세계 정복', desc:'모든 스티커 획득!', cond:'전체 스티커 수집', cat:'특별', check:function(s){ return s.stickerCount>=34; }},
  {id:'s35', emoji:'✨', name:'모먼트 픽 레전드', desc:'진정한 모먼트픽 레전드!', cond:'레벨50 + 미션100 + 30일 연속', cat:'특별', check:function(s){ return s.level>=50&&s.total>=100&&s.streak>=30; }},
];
var _stickerCat = '전체';

function getStickerStats() {
  var total = parseInt(localStorage.getItem('mp_total_completed')||'0');
  var streak = parseInt(localStorage.getItem('mp_streak_count')||'0');
  var level = typeof getLevel === 'function' ? getLevel() : 0;
  var calData = getCalData ? getCalData() : {};
  var budgetTx = window._budget ? (_budget.transactions||[]).length : 0;
  var advChapter = parseInt(localStorage.getItem('mp_adv_chapter')||'0');
  var earned = getEarnedStickers();

  // 카테고리별 집계
  var cats = {health:0,mind:0,creative:0,relation:0,growth:0};
  (window.MISSIONS||[]).forEach(function(m) {
    if (window.state && window.state[String(m.id)] && window.state[String(m.id)].completed && m.category) {
      cats[m.category] = (cats[m.category]||0)+1;
    }
  });

  // 하루 5개 완료 여부
  var today = new Date(); var todayKey = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var perfectDay = calData[todayKey] && calData[todayKey].length >= 5;

  return {
    total, streak, level, cats, budgetTx, advChapter,
    earlyBird: localStorage.getItem('mp_early_bird')==='1',
    nightOwl: localStorage.getItem('mp_night_owl')==='1',
    fastStart: false,
    budgetGoal: parseInt(localStorage.getItem('mp_goal_achieved')||'0'),
    roulette: parseInt(localStorage.getItem('mp_roulette_count')||'0'),
    letters: getLetters().length,
    tarot: parseInt(localStorage.getItem('mp_tarot_count')||'0'),
    cardgame: parseInt(localStorage.getItem('mp_cardgame_wins')||'0'),
    perfectDay,
    petLegend: parseInt(localStorage.getItem('mp_pet_stage')||'0') >= 4,
    stickerCount: earned.length,
  };
}

function getEarnedStickers() { try { return JSON.parse(localStorage.getItem('mp_stickers')||'[]'); } catch(e){ return []; } }

function checkAndEarnStickers() {
  var stats = getStickerStats();
  var earned = getEarnedStickers();
  var newlyEarned = [];
  STICKERS.forEach(function(s) {
    if (earned.indexOf(s.id) === -1 && s.check(stats)) {
      earned.push(s.id);
      newlyEarned.push(s);
    }
  });
  if (newlyEarned.length) {
    localStorage.setItem('mp_stickers', JSON.stringify(earned));
    newlyEarned.forEach(function(s) {
      setTimeout(function() {
        if(typeof showToast==='function') showToast('🎴 새 스티커 획득: ' + s.emoji + ' ' + s.name + '!');
      }, 500);
    });
  }
}

function openSticker() {
  checkAndEarnStickers();
  renderStickerBook();
  document.getElementById('stickerOverlay').classList.add('show');
}
function closeSticker() { document.getElementById('stickerOverlay').classList.remove('show'); }

function renderStickerBook() {
  var earned = getEarnedStickers();
  var cats = ['전체','미션','스트릭','카테고리','시간','레벨','가계부','특별'];
  var tabEl = document.getElementById('stickerCatTabs');
  if (tabEl) tabEl.innerHTML = cats.map(function(c) {
    return '<button class="sticker-cat-tab' + (c===_stickerCat?' active':'') + '" onclick="setStickerCat(\'' + c + '\')">' + c + '</button>';
  }).join('');
  var filtered = _stickerCat === '전체' ? STICKERS : STICKERS.filter(function(s){ return s.cat === _stickerCat; });
  var grid = document.getElementById('stickerGrid');
  if (grid) grid.innerHTML = filtered.map(function(s) {
    var isEarned = earned.indexOf(s.id) !== -1;
    return '<div class="sticker-item' + (isEarned?' earned':' locked') + '" onclick="showStickerDetail(\'' + s.id + '\')">' +
      '<div class="sticker-emoji">' + s.emoji + '</div>' +
      '<div class="sticker-name">' + s.name + '</div>' +
    '</div>';
  }).join('');
  var countEl = document.getElementById('stickerCount');
  var barEl = document.getElementById('stickerProgressBar');
  if (countEl) countEl.textContent = earned.length + ' / ' + STICKERS.length;
  if (barEl) barEl.style.width = Math.round((earned.length/STICKERS.length)*100) + '%';
}

function setStickerCat(cat) { _stickerCat = cat; renderStickerBook(); }

function showStickerDetail(id) {
  var s = STICKERS.find(function(x){ return x.id===id; });
  if (!s) return;
  var earned = getEarnedStickers().indexOf(id) !== -1;
  document.getElementById('sdEmoji').textContent = s.emoji;
  document.getElementById('sdName').textContent = s.name;
  document.getElementById('sdDesc').textContent = earned ? s.desc : '???';
  document.getElementById('sdCond').textContent = '획득 조건: ' + s.cond;
  document.getElementById('stickerDetail').classList.add('show');
}
function closeStickerDetail() { document.getElementById('stickerDetail').classList.remove('show'); }

// ════════════════════════════════════════
// ── 🎲 데일리 랜덤 이벤트 ──
// ════════════════════════════════════════
var SLOT_ITEMS = [
  {emoji:'⭐', label:'별빛'},
  {emoji:'⚡', label:'XP'},
  {emoji:'🔥', label:'부스터'},
  {emoji:'🎯', label:'미션'},
  {emoji:'💎', label:'다이아'},
  {emoji:'🌈', label:'무지개'},
  {emoji:'🍀', label:'행운'},
  {emoji:'🎁', label:'선물'},
];

var SLOT_EVENTS = [
  {combo:[0,0,0], title:'⭐ 별빛 폭탄!', desc:'별빛 20개를 획득했어요!', reward:function(){ addStars(20); }},
  {combo:[1,1,1], title:'⚡ XP 대폭발!', desc:'XP 100을 획득했어요!', reward:function(){ if(typeof addXP==='function') addXP(100); }},
  {combo:[2,2,2], title:'🔥 부스터 발동!', desc:'24시간 XP 2배 부스터!', reward:function(){ localStorage.setItem('mp_xp_boost', String(Date.now()+86400000)); }},
  {combo:[4,4,4], title:'💎 대박!', desc:'별빛 50개 + XP 200 획득!', reward:function(){ addStars(50); if(typeof addXP==='function') addXP(200); }},
  {default:true, title:'🎁 작은 행운!', desc:'별빛 5개를 획득했어요!', reward:function(){ addStars(5); }},
];

function openSlot() {
  var today = new Date().toDateString();
  var used = localStorage.getItem('mp_slot_date');
  var btn = document.getElementById('slotLever');
  var res = document.getElementById('slotResult');
  if (res) res.innerHTML = '';
  if (btn) {
    btn.disabled = used === today;
    btn.textContent = (used === today) ? '🌙 오늘은 이미 뽑았어요' : '🎰 행운을 뽑아라!';
  }
  initSlotReels();
  var overlay = document.getElementById('slotOverlay');
  if (overlay) overlay.classList.add('show');
}
function closeSlot() {
  var overlay = document.getElementById('slotOverlay');
  if (overlay) overlay.classList.remove('show');
}

function initSlotReels() {
  for (var i = 0; i < 3; i++) {
    var reel = document.getElementById('slotReel' + i);
    if (!reel) continue;
    reel.innerHTML = SLOT_ITEMS.concat(SLOT_ITEMS).map(function(item) {
      return '<div class="slot-reel-item">' + item.emoji + '</div>';
    }).join('');
    reel.style.top = '0px';
  }
}

function spinSlot() {
  var today = new Date().toDateString();
  if (localStorage.getItem('mp_slot_date') === today) return;
  localStorage.setItem('mp_slot_date', today);
  var btn = document.getElementById('slotLever');
  btn.disabled = true;
  btn.textContent = '🌀 돌아가는 중...';

  var results = [
    Math.floor(Math.random() * SLOT_ITEMS.length),
    Math.floor(Math.random() * SLOT_ITEMS.length),
    Math.floor(Math.random() * SLOT_ITEMS.length),
  ];

  results.forEach(function(idx, ri) {
    var reel = document.getElementById('slotReel' + ri);
    if (!reel) return;
    var delay = ri * 300;
    setTimeout(function() {
      var targetTop = -(idx * 88 + 88 * SLOT_ITEMS.length);
      reel.style.transition = 'top ' + (1.5 + ri * 0.3) + 's cubic-bezier(.25,.1,.25,1)';
      reel.style.top = targetTop + 'px';
    }, delay);
  });

  setTimeout(function() {
    btn.textContent = '완료!';
    var event = SLOT_EVENTS.find(function(e) {
      return !e.default && e.combo[0]===results[0] && e.combo[1]===results[1] && e.combo[2]===results[2];
    }) || SLOT_EVENTS.find(function(e){ return e.default; });

    event.reward();
    var res = document.getElementById('slotResult');
    if (res) res.innerHTML =
      '<div class="slot-result">' +
        '<div class="slot-result-emoji">' + (results[0]===results[1]&&results[1]===results[2]?'🎊':'🎁') + '</div>' +
        '<div class="slot-result-title">' + event.title + '</div>' +
        '<div class="slot-result-desc">' + event.desc + '</div>' +
        '<button onclick="closeSlot()" style="padding:12px 28px;background:linear-gradient(135deg,var(--gold),var(--gold-light));border:none;border-radius:12px;color:#0a0a0f;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit">확인!</button>' +
      '</div>';
    if(typeof playSfx==='function') playSfx();
    if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
  }, 2500);
}

// ════════════════════════════════════════
// ── 🃏 카드 매칭 게임 ──
// ════════════════════════════════════════
var CG_EMOJIS = ['🎯','🌟','💫','🔥','⚡','🎨','🏆','💎','🌈','🍀','🎭','🎪'];
var _cgCards = [], _cgFlipped = [], _cgMatched = 0, _cgMoves = 0, _cgTimer = 0, _cgInterval = null, _cgRunning = false;

function openCardGame() {
  document.getElementById('cardgameOverlay').classList.add('show');
  document.getElementById('cardgameResult').classList.remove('show');
  initCardGame();
}
function closeCardGame() {
  clearInterval(_cgInterval);
  document.getElementById('cardgameOverlay').classList.remove('show');
}

function initCardGame() {
  clearInterval(_cgInterval);
  _cgMoves = 0; _cgTimer = 0; _cgMatched = 0; _cgFlipped = []; _cgRunning = false;
  document.getElementById('cgTimer').textContent = '0';
  document.getElementById('cgMoves').textContent = '0';
  document.getElementById('cardgameResult').classList.remove('show');

  var diff = parseInt(document.getElementById('cardgameDiff').value);
  var pairs = diff === 4 ? 8 : 12;
  var emojis = CG_EMOJIS.slice(0, pairs);
  var cards = emojis.concat(emojis).sort(function(){ return Math.random()-.5; });
  _cgCards = cards;

  var grid = document.getElementById('cardgameGrid');
  var cols = diff === 4 ? 4 : 6;
  grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  grid.style.width = (cols * 52 + (cols-1)*8) + 'px';
  grid.style.maxWidth = '100%';
  grid.innerHTML = cards.map(function(emoji, i) {
    return '<div class="cardgame-card" id="cgCard'+i+'" onclick="cgFlip('+i+')">' +
      '<div class="cardgame-card-inner">' +
        '<div class="cardgame-card-back">✦</div>' +
        '<div class="cardgame-card-front">' + emoji + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function cgFlip(idx) {
  if (!_cgRunning) { _cgRunning = true; _cgInterval = setInterval(function(){ _cgTimer++; document.getElementById('cgTimer').textContent = _cgTimer; }, 1000); }
  var card = document.getElementById('cgCard' + idx);
  if (!card || card.classList.contains('flipped') || card.classList.contains('matched') || _cgFlipped.length >= 2) return;
  card.classList.add('flipped');
  _cgFlipped.push(idx);
  if (_cgFlipped.length === 2) {
    _cgMoves++;
    document.getElementById('cgMoves').textContent = _cgMoves;
    var a = _cgFlipped[0], b = _cgFlipped[1];
    if (_cgCards[a] === _cgCards[b]) {
      setTimeout(function() {
        document.getElementById('cgCard'+a).classList.add('matched');
        document.getElementById('cgCard'+b).classList.add('matched');
        _cgMatched++;
        _cgFlipped = [];
        if(typeof playSfx==='function') playSfx();
        if (_cgMatched >= _cgCards.length / 2) cgWin();
      }, 300);
    } else {
      setTimeout(function() {
        var ca = document.getElementById('cgCard'+a);
        var cb = document.getElementById('cgCard'+b);
        if(ca) { ca.classList.add('wrong-shake'); ca.classList.remove('flipped'); setTimeout(function(){ ca.classList.remove('wrong-shake'); }, 400); }
        if(cb) { cb.classList.add('wrong-shake'); cb.classList.remove('flipped'); setTimeout(function(){ cb.classList.remove('wrong-shake'); }, 400); }
        _cgFlipped = [];
      }, 700);
    }
  }
}

function cgWin() {
  clearInterval(_cgInterval);
  var wins = parseInt(localStorage.getItem('mp_cardgame_wins')||'0') + 1;
  localStorage.setItem('mp_cardgame_wins', String(wins));
  var xpReward = Math.max(5, 50 - Math.floor(_cgTimer/10));
  if(typeof addXP==='function') addXP(xpReward);
  var res = document.getElementById('cardgameResult');
  document.getElementById('cgResultStats').innerHTML = '⏱ 클리어 시간: ' + _cgTimer + '초<br>🔄 이동 횟수: ' + _cgMoves + '회<br>⚡ XP +' + xpReward;
  res.classList.add('show');
  if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
  checkAndEarnStickers();
}

// ════════════════════════════════════════
// ── 🐾 미션 펫 (프리미엄) ──
// ════════════════════════════════════════
var PET_STAGES = [
  {id:0, name:'알',   badge:'🥚 알',   html:function(){ return '<div class="pet-egg-body"><div class="pet-egg-crack">✧</div></div>'; }, missions:0, desc:'아직 알 속에서 자라고 있어요...'},
  {id:1, name:'아기', badge:'👶 아기', html:function(){ return '<div class="pet-baby"><div class="pet-baby-body"></div><div class="pet-baby-eye left"></div><div class="pet-baby-eye right"></div><div class="pet-baby-cheek left"></div><div class="pet-baby-cheek right"></div><div class="pet-baby-mouth"></div><div class="pet-baby-ear left"></div><div class="pet-baby-ear right"></div></div>'; }, missions:5, desc:'아기가 태어났어요! 잘 돌봐주세요 💛'},
  {id:2, name:'청소년', badge:'🌱 청소년', html:function(){ return '<div class="pet-teen"><div class="pet-teen-body"></div><div class="pet-teen-head"></div><div class="pet-teen-eye left"></div><div class="pet-teen-eye right"></div><div class="pet-teen-arm left"></div><div class="pet-teen-arm right"></div><div class="pet-teen-star">✦</div></div>'; }, missions:20, desc:'쑥쑥 자라고 있어요! 미션을 많이 완료해줘요 🌱'},
  {id:3, name:'성인', badge:'🌟 성인', html:function(){ return '<div class="pet-adult"><div class="pet-adult-aura"></div><div class="pet-adult-body"></div><div class="pet-adult-head"></div><div class="pet-adult-crown">👑</div><div class="pet-adult-eye left"></div><div class="pet-adult-eye right"></div><div class="pet-adult-smile"></div></div>'; }, missions:50, desc:'드디어 어른이 됐어요! 멋진 모습이죠 ✨'},
  {id:4, name:'전설', badge:'✨ 전설', html:function(){ return '<div class="pet-legend"><div class="pet-legend-aura"></div><div class="pet-legend-wings"><div class="pet-legend-wing left"></div><div class="pet-legend-wing right"></div></div><div class="pet-legend-body"></div><div class="pet-legend-head"></div><div class="pet-legend-halo"></div><div class="pet-legend-eye left"></div><div class="pet-legend-eye right"></div><div class="pet-legend-sparkle" style="--d:2s;--delay:0s;top:-20px;left:10px">✦</div><div class="pet-legend-sparkle" style="--d:2.5s;--delay:.5s;top:-10px;right:5px">⭐</div><div class="pet-legend-sparkle" style="--d:3s;--delay:1s;bottom:40px;left:-10px">✨</div></div>'; }, missions:100, desc:'전설이 되었어요! 이 세계에서 가장 빛나는 존재예요 👑'},
];

var PET_SPEECHES = {
  happy: ['미션 하나 더 해줘! 나도 같이 응원할게 🎉','오늘도 최고야! 너무 좋아! 💛','같이 있어서 행복해 ✨','와! 또 미션 완료했어? 대단해! 🌟','우리 오늘 같이 열심히 하자! 💪'],
  hungry: ['배고파... 미션 완료하면 먹을 수 있어...','밥 줘... 제발... 미션 해줘...','꼬르륵... 언제 미션 해줄 거야...'],
  bored: ['심심해... 같이 놀자 🥺','아무것도 안 하면 슬퍼져...','나 혼자 두지 마 😢'],
  evolved: ['와! 진화했어! 나 멋있지?! ✨','새로운 나를 봐봐! 엄청 강해졌어! 💫','레벨업! 너 덕분이야 감사해 🎉'],
  greeting: ['안녕! 오늘도 잘 부탁해 😊','왔어? 기다리고 있었어! 🎵','만나서 반가워! 오늘도 함께하자 💛'],
};

function getPetData() {
  try { return JSON.parse(localStorage.getItem('mp_pet')||'{}'); } catch(e){ return {}; }
}
function savePetData(d) { localStorage.setItem('mp_pet', JSON.stringify(d)); }

function getCurrentPetStage() {
  var total = parseInt(localStorage.getItem('mp_total_completed')||'0');
  var stage = 0;
  PET_STAGES.forEach(function(s, i) { if (total >= s.missions) stage = i; });
  return stage;
}

function openPet() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  initPetBgStars();
  renderPet();
  document.getElementById('petOverlay').classList.add('show');
  var btn1 = document.getElementById('themeToggle'), btn2 = document.getElementById('calToggle');
  if(btn1) btn1.style.display='none'; if(btn2) btn2.style.display='none';
  petDecayCheck();
}
function closePet() {
  document.getElementById('petOverlay').classList.remove('show');
  var btn1 = document.getElementById('themeToggle'), btn2 = document.getElementById('calToggle');
  if(btn1) btn1.style.display=''; if(btn2) btn2.style.display='';
}

function initPetBgStars() {
  var bg = document.getElementById('petBgStars');
  if (!bg) return;
  var html = '';
  for (var i = 0; i < 80; i++) {
    var x = Math.random()*100, y = Math.random()*70;
    var size = (Math.random()*2.5+0.5).toFixed(1);
    var dur = (Math.random()*3+2).toFixed(1);
    html += '<div class="pet-bg-star" style="left:'+x+'%;top:'+y+'%;width:'+size+'px;height:'+size+'px;--dur:'+dur+'s;animation-delay:'+(Math.random()*4)+'s"></div>';
  }
  bg.innerHTML = html;
}

function renderPet() {
  var stageId = getCurrentPetStage();
  var stage = PET_STAGES[stageId];
  var petData = getPetData();
  var charEl = document.getElementById('petCharacter');
  var nameEl = document.getElementById('petName');
  var badgeEl = document.getElementById('petStageBadge');
  var happyEl = document.getElementById('petHappyBar');
  var fullEl = document.getElementById('petFullBar');
  var happyValEl = document.getElementById('petHappyVal');
  var fullValEl = document.getElementById('petFullVal');

  if (!petData.name) { petData.name = '모먼이'; petData.happy=100; petData.full=100; petData.lastFed=Date.now(); savePetData(petData); }

  if (charEl) charEl.innerHTML = stage.html();
  if (nameEl) nameEl.textContent = petData.name;
  if (badgeEl) badgeEl.textContent = stage.badge;

  var happy = Math.max(0, Math.min(100, petData.happy||100));
  var full = Math.max(0, Math.min(100, petData.full||100));
  if (happyEl) happyEl.style.width = happy+'%';
  if (fullEl) fullEl.style.width = full+'%';
  if (happyValEl) happyValEl.textContent = Math.round(happy);
  if (fullValEl) fullValEl.textContent = Math.round(full);

  // 이전 스테이지 체크
  var savedStage = parseInt(localStorage.getItem('mp_pet_stage')||'0');
  if (stageId > savedStage) {
    localStorage.setItem('mp_pet_stage', String(stageId));
    setTimeout(function() { showPetEvolve(stage.name); }, 500);
    checkAndEarnStickers();
  }
  setTimeout(function() { petSpeak('greeting'); }, 800);
}

function petDecayCheck() {
  var petData = getPetData();
  var hoursElapsed = (Date.now() - (petData.lastFed||Date.now())) / 3600000;
  petData.happy = Math.max(0, (petData.happy||100) - hoursElapsed * 5);
  petData.full = Math.max(0, (petData.full||100) - hoursElapsed * 8);
  savePetData(petData);
  renderPet();
}

function petAction(type) {
  var petData = getPetData();
  if (type === 'feed') {
    var total = parseInt(localStorage.getItem('mp_total_completed')||'0');
    if (total <= (petData.lastFeedTotal||0)) {
      petSpeak('hungry');
      if(typeof showToast==='function') showToast('미션을 완료해야 먹이를 줄 수 있어요!', '#c97b4c');
      return;
    }
    petData.full = Math.min(100, (petData.full||0) + 25);
    petData.happy = Math.min(100, (petData.happy||0) + 10);
    petData.lastFeedTotal = total;
    petData.lastFed = Date.now();
    savePetData(petData);
    renderPet();
    petSpeak('happy');
    if(typeof showToast==='function') showToast('냠냠! 맛있다 🍖 +25 포만감');
  } else if (type === 'play') {
    petData.happy = Math.min(100, (petData.happy||0) + 20);
    savePetData(petData);
    renderPet();
    petSpeak('happy');
    if(typeof showToast==='function') showToast('신난다! 같이 놀아서 행복해 🎾 +20 행복도');
  } else if (type === 'talk') {
    var msgs = ['오늘 미션 많이 해줘서 고마워 💛','우리 함께하면 못할 게 없어 ✨','나는 네가 있어서 정말 행복해 😊','오늘도 최고야! 내일도 기대돼 🌟','네 덕분에 이렇게 성장했어. 고마워 🌱'];
    var msg = msgs[Math.floor(Math.random() * msgs.length)];
    petSpeak('happy');
    if(typeof showToast==='function') showToast('💬 ' + msg);
  }
  if(typeof playSfx==='function') playSfx();
}

function petRename() {
  var name = prompt('펫의 새 이름을 입력해주세요!', getPetData().name || '모먼이');
  if (!name) return;
  var petData = getPetData();
  petData.name = name;
  savePetData(petData);
  document.getElementById('petName').textContent = name;
  petSpeak('evolved');
  if(typeof showToast==='function') showToast('이름이 "' + name + '"으로 바뀌었어요 ✏️');
}

function petSpeak(mood) {
  var speeches = PET_SPEECHES[mood] || PET_SPEECHES.greeting;
  var speech = speeches[Math.floor(Math.random() * speeches.length)];
  var el = document.getElementById('petSpeech');
  if (!el) return;
  el.textContent = speech;
  el.classList.add('show');
  clearTimeout(window._petSpeechTimer);
  window._petSpeechTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
}

function showPetEvolve(stageName) {
  var anim = document.getElementById('petEvolveAnim');
  var text = document.getElementById('petEvolveText');
  if (!anim || !text) return;
  text.textContent = '✨ ' + stageName + ' 진화! ✨';
  anim.classList.add('show');
  if(typeof playSfx==='function') playSfx();
  if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
  setTimeout(function() { anim.classList.remove('show'); }, 2500);
}

// 미션 완료 시 펫 먹이 자동 연동
window._origAddTotalForPet = window.addTotalCompleted;
window.addTotalCompleted = function(n) {
  if (window._origAddTotalForPet) window._origAddTotalForPet(n);
  if (!n) {
    var petData = getPetData();
    petData.happy = Math.min(100, (petData.happy||0) + 5);
    savePetData(petData);
  }
};

// ════════════════════════════════════════
// ── ⚔️ 미션 어드벤처 (프리미엄) ──
// ════════════════════════════════════════
var ADV_CHAPTERS = [
  {
    id:0, location:'kingdom', scene:'🌅', bg:'kingdom', title:'프롤로그: 빛의 용사',
    art:'🌅', hero:false, enemy:false,
    text:'태초의 빛이 세상을 창조했을 때, 어둠도 함께 태어났다.\n\n평화롭던 빛의 왕국에 고대의 봉인이 풀리기 시작했다. 왕궁의 마법사들은 고대 예언서에서 운명을 찾았다.\n\n"빛과 의지를 가진 용사가 나타나 세계를 구하리라."',
    speaker:'📜 고대 예언서',
    choices:[{icon:'⚔️', text:'운명을 받아들이고 여정을 시작한다', next:1}]
  },
  {
    id:1, location:'village', scene:'🏘️', bg:'village', title:'Chapter 1: 출발의 아침',
    art:'🌄', hero:true, enemy:false,
    text:'마을 어귀에 서서 당신은 칼자루를 쥐었다.\n\n마을 장로가 조용히 다가온다. "용사여, 이 여정은 쉽지 않을 거요. 그러나 당신의 의지와 매일의 노력이 어둠을 몰아낼 유일한 힘이라오."\n\n첫걸음을 내딛을 준비가 됐나?',
    speaker:'🧓 마을 장로',
    missionRequired:true,
    missionText:'첫 번째 미션을 완료해야 여정을 시작할 수 있어요',
    choices:[{icon:'🗡️', text:'마을을 출발해 숲으로 향한다', next:2}]
  },
  {
    id:2, location:'forest', scene:'🌲', bg:'forest', title:'Chapter 2: 어두운 숲',
    art:'🌲', hero:true, enemy:false,
    text:'울창한 숲에 들어서자 주변이 캄캄해졌다. 어디선가 이상한 소리가 들려온다.\n\n"이 숲에는 고대의 마물들이 살고 있지. 하지만 두려워하지 마라. 빛의 용사에게는 어둠도 물러난단다."\n\n갑자기 나뭇가지 사이로 빨간 눈이 반짝인다...',
    speaker:'🦉 숲의 부엉이',
    choices:[
      {icon:'⚔️', text:'당당히 앞으로 나아간다', next:3},
      {icon:'🌿', text:'주변 환경을 먼저 살핀다', next:3}
    ]
  },
  {
    id:3, location:'forest', scene:'⚔️', bg:'forest', title:'Chapter 3: 첫 번째 전투',
    art:'🐺', hero:true, enemy:true, enemyHp:100,
    text:'어둠의 늑대가 당신 앞에 나타났다!\n\n이빨을 드러내며 으르렁거리는 늑대. 하지만 당신의 눈에는 두려움이 없다. 오늘 완료한 미션들이 당신에게 힘을 주고 있다.\n\n전투 준비!',
    speaker:'💥 전투 시작',
    battle:true, battleEnemy:'🐺 어둠의 늑대', enemyMaxHp:100,
    missionRequired:true,
    missionText:'미션을 완료해서 전투력을 높이세요!',
    choices:[{icon:'⚡', text:'필살기로 마무리!', next:4}]
  },
  {
    id:4, location:'forest', scene:'🏆', bg:'forest', title:'Chapter 4: 첫 승리',
    art:'✨', hero:true, enemy:false,
    text:'어둠의 늑대가 빛으로 흩어지며 사라졌다!\n\n"처음 전투에서 이기다니, 정말 대단한 용사로군." 숲 속 요정이 당신 앞에 나타났다. 그녀는 마법의 빛을 당신에게 불어넣었다.\n\n레벨업! 당신이 강해지는 것이 느껴진다.',
    speaker:'🧚 숲의 요정',
    reward:true, rewardXp:20,
    choices:[{icon:'🗡️', text:'더 깊은 숲으로 들어간다', next:5}]
  },
  {
    id:5, location:'dungeon', scene:'🗿', bg:'dungeon', title:'Chapter 5: 고대 던전',
    art:'🏰', hero:true, enemy:false,
    text:'숲을 지나니 거대한 고대 던전이 나타났다. 입구에는 고대 문자가 새겨진 돌판이 있다.\n\n"지혜로운 자만이 이 문을 열 수 있다."\n\n수수께끼: 나는 아침에 4개의 다리, 낮에 2개, 밤에 3개의 다리를 가진다. 나는 누구인가?',
    speaker:'🗿 고대의 돌',
    choices:[
      {icon:'🧠', text:'인간이다! (시간에 따라 변하는 존재)', next:6},
      {icon:'❓', text:'잘 모르겠다... 다른 방법을 찾는다', next:6}
    ]
  },
  {
    id:6, location:'dungeon', scene:'💎', bg:'dungeon', title:'Chapter 6: 던전 내부',
    art:'🔮', hero:true, enemy:false,
    text:'던전 안으로 들어서자 눈부신 보물들이 가득했다. 하지만 빛나는 것만이 가치있는 것은 아니다.\n\n구석에서 낡은 책 한 권을 발견했다. "빛의 검을 단련하는 법"이라고 쓰여 있다.\n\n이 지식이 앞으로의 여정에 큰 도움이 될 것이다.',
    speaker:'📚 고대의 서',
    missionRequired:true,
    missionText:'지식을 얻으려면 오늘의 미션을 완료해야 해요',
    choices:[{icon:'⚔️', text:'단련법을 익히고 앞으로 나아간다', next:7}]
  },
  {
    id:7, location:'dungeon', scene:'👹', bg:'dungeon', title:'Chapter 7: 던전 수호자',
    art:'👹', hero:true, enemy:true, enemyHp:150,
    text:'던전 깊숙한 곳에서 거대한 수호자가 깨어났다!\n\n"감히 이 성역에 들어오다니... 하지만 네 눈에서 진정한 의지가 느껴진다. 내 시험을 통과한다면 더 강한 힘을 주마."\n\n강적이다! 하지만 당신은 물러서지 않는다!',
    speaker:'👹 던전 수호자',
    battle:true, battleEnemy:'👹 던전 수호자', enemyMaxHp:150,
    missionRequired:true, missionText:'강적과 싸우려면 미션 완료로 힘을 길러야 해요',
    choices:[{icon:'🌟', text:'수호자의 힘을 흡수하고 전진!', next:8}]
  },
  {
    id:8, location:'ruins', scene:'🌿', bg:'ruins', title:'Chapter 8: 고대 유적',
    art:'🗺️', hero:true, enemy:false,
    text:'던전을 넘어서니 신비로운 고대 유적이 펼쳐졌다. 여기는 빛의 용사들이 쉬어가던 성지다.\n\n오래된 제단 위에 검은 수정이 놓여있다. 그 안에서 목소리가 들린다.\n\n"용사여... 당신의 진정한 힘은 매일의 작은 노력 속에 있다는 것을 잊지 마라."',
    speaker:'✨ 빛의 정령',
    reward:true, rewardXp:30,
    choices:[{icon:'🗡️', text:'빛의 검을 더욱 단련한다', next:9}]
  },
  {
    id:9, location:'ruins', scene:'🌒', bg:'ruins', title:'Chapter 9: 어둠의 기운',
    art:'🌑', hero:true, enemy:false,
    text:'갑자기 하늘이 어두워지고 차가운 바람이 불어왔다.\n\n"드디어 찾아왔구나, 용사여..." 어둠 속에서 웅장한 목소리가 울려퍼졌다.\n\n저 멀리 어두운 성에서 붉은 빛이 이글이글 타오르고 있었다. 최후의 적이 기다리고 있다.',
    speaker:'🌑 어둠의 목소리',
    choices:[
      {icon:'⚔️', text:'두려워하지 않고 어둠의 성으로 향한다', next:10},
      {icon:'💭', text:'잠시 힘을 모은다', next:10}
    ]
  },
  {
    id:10, location:'kingdom', scene:'🏰', bg:'kingdom', title:'Chapter 10: 어둠의 성',
    art:'🏰', hero:true, enemy:true, enemyHp:200,
    text:'마침내 어둠의 성 문 앞에 도달했다!\n\n성 안에서 어둠의 마왕이 나타났다. 그는 수백 년 동안 세상의 빛을 갉아먹으며 힘을 키워온 존재다.\n\n"네가 그 유명한 빛의 용사인가? 이미 많이 지쳤겠지. 하지만 나는 이제 시작이다!"\n\n최후의 결전이다!',
    speaker:'👿 어둠의 마왕',
    battle:true, battleEnemy:'👿 어둠의 마왕', enemyMaxHp:200,
    missionRequired:true, missionText:'최후의 전투! 모든 힘을 미션으로 모아주세요',
    choices:[{icon:'🌟', text:'빛의 힘으로 마왕을 쓰러뜨린다!', next:11}]
  },
  {
    id:11, location:'sky', scene:'🌈', bg:'sky', title:'에필로그: 빛의 귀환',
    art:'🌈', hero:true, enemy:false,
    text:'마왕이 빛의 검 앞에 무릎을 꿇었다!\n\n"불가능해... 이런 힘이 어디서...""\n\n당신은 조용히 말한다. "매일 포기하지 않은 작은 노력들이 이 힘이 됐어."\n\n어둠이 사라지자 온 세상에 빛이 돌아왔다. 새는 노래하고, 꽃이 피어났다.\n\n당신은 진정한 빛의 용사가 되었다. ✨\n\n하지만 여정은 끝나지 않는다. 매일의 미션이 당신을 더욱 강하게 만들 것이다!',
    speaker:'📜 빛의 왕국 연대기',
    reward:true, rewardXp:100,
    final:true,
    choices:[{icon:'🌟', text:'새로운 여정을 시작한다 (처음부터)', next:0}]
  }
];

var _advState = { chapter:0, hp:100, herLv:1, herXp:0, inventory:[], battleHp:0 };

function loadAdvState() {
  try { var s = JSON.parse(localStorage.getItem('mp_adv_state')||'{}'); if(s.chapter!==undefined) _advState = Object.assign(_advState, s); } catch(e){}
}
function saveAdvState() { localStorage.setItem('mp_adv_state', JSON.stringify(_advState)); localStorage.setItem('mp_adv_chapter', String(_advState.chapter)); }

function openAdv() {
  if (!_isPremium) { openPremiumModal && openPremiumModal(); return; }
  loadAdvState();
  initAdvParticles();
  renderAdv();
  document.getElementById('advOverlay').classList.add('show');
  var b1=document.getElementById('themeToggle'),b2=document.getElementById('calToggle');
  if(b1)b1.style.display='none'; if(b2)b2.style.display='none';
}
function closeAdv() {
  document.getElementById('advOverlay').classList.remove('show');
  var b1=document.getElementById('themeToggle'),b2=document.getElementById('calToggle');
  if(b1)b1.style.display=''; if(b2)b2.style.display='';
}

function initAdvParticles() {
  var container = document.getElementById('advParticles');
  if (!container) return;
  var html = '';
  for (var i = 0; i < 20; i++) {
    var x = Math.random()*100;
    var size = (Math.random()*4+2).toFixed(1);
    var dur = (Math.random()*6+6).toFixed(1);
    var delay = (Math.random()*8).toFixed(1);
    var colors = ['rgba(201,168,76,.6)','rgba(167,139,250,.6)','rgba(255,255,255,.4)','rgba(96,165,250,.4)'];
    var color = colors[Math.floor(Math.random()*colors.length)];
    html += '<div class="adv-particle" style="left:'+x+'%;width:'+size+'px;height:'+size+'px;background:'+color+';--dur:'+dur+'s;animation-delay:'+delay+'s"></div>';
  }
  container.innerHTML = html;
}

function renderAdv() {
  var ch = ADV_CHAPTERS[_advState.chapter] || ADV_CHAPTERS[ADV_CHAPTERS.length-1];
  var bg = document.getElementById('advBg');
  var labelEl = document.getElementById('advChapterLabel');
  var locEl = document.getElementById('advLocation');
  var artEl = document.getElementById('advSceneArt');
  var heroEl = document.getElementById('advHero');
  var enemyEl = document.getElementById('advEnemy');
  var storyEl = document.getElementById('advStory');
  var hpBar = document.getElementById('advHpBar');
  var hpVal = document.getElementById('advHpVal');
  var xpBar = document.getElementById('advXpBar');
  var lvVal = document.getElementById('advLvVal');

  if (bg) bg.className = 'adv-bg ' + ch.bg;
  if (labelEl) labelEl.textContent = ch.title;
  if (locEl) locEl.textContent = '✦ ' + {village:'마을',forest:'어두운 숲',dungeon:'고대 던전',ruins:'고대 유적',kingdom:'빛의 왕국',sky:'하늘'}[ch.bg];
  if (artEl) artEl.textContent = ch.art;
  if (heroEl) { heroEl.style.display = ch.hero ? '' : 'none'; heroEl.textContent = '🧙'; }
  if (enemyEl) { enemyEl.style.display = ch.enemy ? '' : 'none'; enemyEl.textContent = ch.art; }
  if (hpBar) hpBar.style.width = _advState.hp + '%';
  if (hpVal) hpVal.textContent = _advState.hp;
  var xpPct = (_advState.herXp % 100);
  if (xpBar) xpBar.style.width = xpPct + '%';
  if (lvVal) lvVal.textContent = 'Lv.' + _advState.herLv;

  // 스토리 렌더링
  var html = '<div class="adv-narrative">';
  if (ch.speaker) html += '<div class="adv-narrative-speaker">' + ch.speaker + '</div>';
  html += '<div class="adv-narrative-text">' + ch.text.replace(/\n/g,'<br>') + '</div>';
  html += '</div>';

  if (ch.battle) {
    if (_advState.battleHp === undefined || _advState.battleHp <= 0) _advState.battleHp = ch.enemyMaxHp;
    var enemyHpPct = Math.round((_advState.battleHp / ch.enemyMaxHp) * 100);
    html += '<div class="adv-battle">' +
      '<div class="adv-battle-title">⚔️ ' + ch.battleEnemy + '</div>' +
      '<div class="adv-battle-bars">' +
        '<div><div class="adv-battle-bar-label"><span>🧙 용사</span><span>' + _advState.hp + '/100</span></div>' +
        '<div class="adv-battle-bar"><div class="adv-battle-bar-fill adv-hero-hp" style="width:' + _advState.hp + '%"></div></div></div>' +
        '<div><div class="adv-battle-bar-label"><span>' + ch.battleEnemy + '</span><span>' + _advState.battleHp + '/' + ch.enemyMaxHp + '</span></div>' +
        '<div class="adv-battle-bar"><div class="adv-battle-bar-fill adv-enemy-hp" style="width:' + enemyHpPct + '%"></div></div></div>' +
      '</div></div>';
  }

  if (ch.missionRequired) {
    html += '<div class="adv-mission-req"><div class="adv-mission-req-text">⚡ ' + ch.missionText + '</div>' +
      '<button class="adv-complete-mission-btn" onclick="advMissionComplete()">✦ 미션 완료 처리</button></div>';
  }

  if (ch.reward) {
    html += '<div style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:12px;text-align:center;margin-top:8px">' +
      '<div style="font-size:13px;color:var(--gold);font-weight:700">🎁 보상: XP +' + ch.rewardXp + '</div></div>';
  }

  if (ch.choices) {
    html += '<div class="adv-choices">' + ch.choices.map(function(c) {
      return '<button class="adv-choice" onclick="advChoice(' + c.next + ')">' +
        '<span class="adv-choice-icon">' + c.icon + '</span>' +
        '<span>' + c.text + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  if (storyEl) storyEl.innerHTML = html;

  var nextBtn = document.getElementById('advNextBtn');
  if (nextBtn) nextBtn.style.display = 'none';
}

function advChoice(nextChapter) {
  var ch = ADV_CHAPTERS[_advState.chapter];
  if (ch && ch.missionRequired) {
    if(typeof showToast==='function') showToast('미션을 먼저 완료해야 해요! ⚡', '#c97b4c');
    return;
  }
  if (ch && ch.reward) {
    if(typeof addXP==='function') addXP(ch.rewardXp);
    if(typeof showToast==='function') showToast('🎁 XP +' + ch.rewardXp + ' 획득!');
  }
  _advState.chapter = nextChapter;
  if (nextChapter === 0) _advState = {chapter:0, hp:100, herLv:1, herXp:0, inventory:[], battleHp:0};
  saveAdvState();
  checkAndEarnStickers();
  setTimeout(function() { renderAdv(); initAdvParticles(); }, 200);
  if(typeof playSfx==='function') playSfx();
}

function advMissionComplete() {
  var ch = ADV_CHAPTERS[_advState.chapter];
  if (!ch) return;
  if (ch.battle) {
    var damage = 30 + Math.floor(Math.random()*20);
    var enemyDmg = 15 + Math.floor(Math.random()*10);
    _advState.battleHp = Math.max(0, (_advState.battleHp||ch.enemyMaxHp) - damage);
    _advState.hp = Math.max(1, _advState.hp - enemyDmg);
    _advState.herXp += 20;
    if (_advState.herXp >= 100) { _advState.herLv++; _advState.herXp -= 100; }
    if(typeof showToast==='function') showToast('⚔️ 공격! ' + damage + ' 데미지! (적 체력: ' + _advState.battleHp + ')');
    var flash = document.getElementById('advAttackFlash');
    if (flash) { flash.style.background='rgba(248,113,113,.3)'; flash.style.animation='none'; void flash.offsetWidth; flash.style.animation='attackFlash .4s forwards'; }
    saveAdvState();
    renderAdv();
    if (_advState.battleHp <= 0) {
      setTimeout(function() {
        if(typeof showToast==='function') showToast('🏆 승리! ' + ch.battleEnemy + ' 격파!');
        if(typeof spawnParticles==='function') spawnParticles(window.innerWidth/2, window.innerHeight/2);
        _advState.battleHp = 0;
        saveAdvState();
        renderAdv();
      }, 1000);
    }
  } else {
    if(typeof showToast==='function') showToast('✨ 미션 완료! 다음으로 넘어갈 수 있어요');
    // missionRequired 제거
    _advState['ch'+_advState.chapter+'_done'] = true;
    saveAdvState();
    renderAdv();
  }
}

function advNext() { }

// ── 통계 업데이트 (룰렛, 타로 카운터) ──
var _origOpenRoulette = window.openRoulette;
window.openRoulette = function() {
  var n = parseInt(localStorage.getItem('mp_roulette_count')||'0')+1;
  localStorage.setItem('mp_roulette_count', String(n));
  if (_origOpenRoulette) _origOpenRoulette();
};
var _origOpenTarot = window.openTarot;
window.openTarot = function() {
  var n = parseInt(localStorage.getItem('mp_tarot_count')||'0')+1;
  localStorage.setItem('mp_tarot_count', String(n));
  if (_origOpenTarot) _origOpenTarot();
};
