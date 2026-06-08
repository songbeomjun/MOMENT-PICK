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
