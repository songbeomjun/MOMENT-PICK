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
var LEVELS = [
  {min:0,   name:'씨앗',  icon:'🌱'},
  {min:10,  name:'새싹',  icon:'🌿'},
  {min:25,  name:'꽃',    icon:'🌸'},
  {min:50,  name:'나무',  icon:'🌳'},
  {min:100, name:'별',    icon:'⭐'},
  {min:200, name:'빛',    icon:'✨'},
];

function getTotalCompleted() {
  return parseInt(localStorage.getItem('mp_total_completed') || '0');
}

function addTotalCompleted() {
  var total = getTotalCompleted() + 1;
  localStorage.setItem('mp_total_completed', String(total));
  updateLevelDisplay();
  return total;
}

function getLevel(total) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (total >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function updateLevelDisplay() {
  var total = getTotalCompleted();
  var lv = getLevel(total);
  var el = document.getElementById('levelBadge');
  if (el) el.textContent = lv.icon + ' ' + lv.name + ' · ' + total + '개 완료';
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
  if (typeof showToast === 'function') showToast('🎉 레벨 UP! Lv.' + lv + ' 달성!');
  if (typeof spawnParticles === 'function') spawnParticles(window.innerWidth/2, window.innerHeight*0.4);
  if (typeof playSfx === 'function') playSfx();
  checkAchievements && checkAchievements();
}

function renderXPBar() {
  var el = document.getElementById('xpSection');
  if (!el) return;
  var xp = getXP();
  var lv = getLevel();
  var maxXp = MAX_LEVEL * XP_PER_LEVEL;

  if (lv >= MAX_LEVEL) {
    el.innerHTML = '<div class="xp-maxlevel">👑 MAX LEVEL 50 달성!</div>';
    return;
  }
  var curXp = xp % XP_PER_LEVEL;
  var pct = Math.round((curXp / XP_PER_LEVEL) * 100);
  var remaining = XP_PER_LEVEL - curXp;

  el.innerHTML =
    '<div class="xp-row">' +
      '<span class="xp-level">Lv.' + lv + '</span>' +
      '<span class="xp-info">' + curXp + ' / ' + XP_PER_LEVEL + ' XP · 다음 레벨까지 ' + remaining + ' XP</span>' +
    '</div>' +
    '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + pct + '%"></div></div>';
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
