// ── MOMENT PICK 확장 기능 ──

// ── 테마 토글 ──
function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ── BGM (룩어헤드 스케줄러 - 끊김 없는 뉴에이지 피아노) ──
var bgmPlaying = false;
var bgmCtx = null;
var bgmTimer = null;
var bgmMasterGain = null;
var bgmNextTime = 0;
var bgmMelIdx = 0;
var bgmBassIdx = 0;

var BGM_BPM = 72;
var BGM_BEAT = 60 / BGM_BPM;
var LOOK_AHEAD = 0.25;   // 0.25초 앞서 스케줄
var SCHEDULE_MS = 40;    // 40ms마다 체크

// C 펜타토닉 스케일 (낮은 옥타브 ~ 높은 옥타브)
var SCALE = [
  130.81, 146.83, 164.81, 196.00, 220.00,  // C3 D3 E3 G3 A3
  261.63, 293.66, 329.63, 392.00, 440.00,  // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00   // C5 D5 E5 G5 A5
];

// 멜로디: {n: 스케일 인덱스, d: 박자 길이}
var MELODY = [
  {n:12,d:1},{n:11,d:0.5},{n:10,d:0.5},{n:11,d:1},{n:12,d:1},{n:14,d:2},
  {n:12,d:1},{n:10,d:0.5},{n:9,d:0.5},{n:10,d:1},{n:12,d:2},
  {n:11,d:1},{n:10,d:0.5},{n:9,d:0.5},{n:10,d:1},{n:11,d:1},{n:12,d:2},
  {n:10,d:1},{n:9,d:0.5},{n:7,d:0.5},{n:9,d:1.5},{n:10,d:0.5},{n:12,d:3},
  {n:14,d:1},{n:12,d:0.5},{n:11,d:0.5},{n:12,d:1},{n:11,d:1},{n:9,d:2},
  {n:10,d:1},{n:9,d:1},{n:7,d:1},{n:9,d:1},{n:10,d:2},
  {n:12,d:1.5},{n:11,d:0.5},{n:10,d:1},{n:9,d:1},{n:7,d:2},
  {n:9,d:1},{n:7,d:1},{n:5,d:1},{n:7,d:1},{n:9,d:4}
];

// 베이스라인
var BASS = [
  {n:0,d:4},{n:3,d:4},
  {n:5,d:4},{n:3,d:4},
  {n:0,d:4},{n:3,d:4},
  {n:2,d:4},{n:3,d:4}
];

function playPianoNote(freq, startTime, duration, volume) {
  var osc1 = bgmCtx.createOscillator();
  var osc2 = bgmCtx.createOscillator();
  var osc3 = bgmCtx.createOscillator();
  var gainNode = bgmCtx.createGain();

  osc1.type = 'triangle';  osc1.frequency.value = freq;
  osc2.type = 'sine';      osc2.frequency.value = freq * 2;
  osc3.type = 'sine';      osc3.frequency.value = freq * 0.5;

  var g1 = bgmCtx.createGain(); g1.gain.value = 0.6;
  var g2 = bgmCtx.createGain(); g2.gain.value = 0.3;
  var g3 = bgmCtx.createGain(); g3.gain.value = 0.15;

  osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);
  g1.connect(gainNode); g2.connect(gainNode); g3.connect(gainNode);

  // ADSR: 빠른 어택, 자연스러운 디케이, 긴 릴리즈
  var atk = 0.015;
  var dec = Math.min(0.4, duration * 0.35);
  var sus = volume * 0.35;
  var relStart = startTime + duration - Math.min(0.15, duration * 0.2);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + atk);
  gainNode.gain.exponentialRampToValueAtTime(sus, startTime + atk + dec);
  gainNode.gain.setValueAtTime(sus, relStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.08);

  gainNode.connect(bgmMasterGain);

  var stopTime = startTime + duration + 0.15;
  osc1.start(startTime); osc1.stop(stopTime);
  osc2.start(startTime); osc2.stop(stopTime);
  osc3.start(startTime); osc3.stop(stopTime);
}

function scheduleNotes() {
  while (bgmNextTime < bgmCtx.currentTime + LOOK_AHEAD) {
    var mel = MELODY[bgmMelIdx % MELODY.length];
    var bass = BASS[bgmBassIdx % BASS.length];
    var melDur = mel.d * BGM_BEAT;
    var bassDur = bass.d * BGM_BEAT;

    // 멜로디 재생
    playPianoNote(SCALE[mel.n], bgmNextTime, melDur, 0.22);

    // 베이스: 새 베이스 음표 시작 시점에 재생
    if (bgmMelIdx === 0 || bgmNextTime >= bgmBassNextTime) {
      playPianoNote(SCALE[bass.n], bgmNextTime, bassDur, 0.12);
      bgmBassNextTime = bgmNextTime + bassDur;
      bgmBassIdx++;
    }

    bgmNextTime += melDur;
    bgmMelIdx++;
    if (bgmMelIdx >= MELODY.length) bgmMelIdx = 0;
  }

  if (bgmPlaying) bgmTimer = setTimeout(scheduleNotes, SCHEDULE_MS);
}
var bgmBassNextTime = 0;

function createBGM() {
  bgmCtx = new (window.AudioContext || window.webkitAudioContext)();

  // 마스터 볼륨
  bgmMasterGain = bgmCtx.createGain();
  bgmMasterGain.gain.value = 0.55;

  // 딜레이(에코) 효과
  var delay = bgmCtx.createDelay(1.0);
  delay.delayTime.value = BGM_BEAT * 1.5;
  var delayFB = bgmCtx.createGain(); delayFB.gain.value = 0.28;
  var delayWet = bgmCtx.createGain(); delayWet.gain.value = 0.22;
  delay.connect(delayFB); delayFB.connect(delay);
  delay.connect(delayWet);

  bgmMasterGain.connect(delay);
  bgmMasterGain.connect(bgmCtx.destination);
  delayWet.connect(bgmCtx.destination);

  bgmMelIdx = 0;
  bgmBassIdx = 0;
  bgmNextTime = bgmCtx.currentTime + 0.05;
  bgmBassNextTime = bgmNextTime;
  scheduleNotes();
}

function toggleBGM() {
  var btn = document.getElementById('bgmToggle');
  if (!bgmPlaying) {
    bgmPlaying = true;
    if (!bgmCtx) {
      createBGM();
    } else {
      bgmCtx.resume();
      bgmNextTime = bgmCtx.currentTime + 0.05;
      bgmBassNextTime = bgmNextTime;
      scheduleNotes();
    }
    btn.textContent = '🎵';
    btn.style.borderColor = 'var(--gold)';
  } else {
    bgmPlaying = false;
    if (bgmTimer) clearTimeout(bgmTimer);
    bgmCtx.suspend();
    btn.textContent = '🔇';
    btn.style.borderColor = '';
  }
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
