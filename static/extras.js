// ── MOMENT PICK 확장 기능 ──

// ── 테마 토글 ──
function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ── BGM ──
var bgmPlaying = false;
var bgmCtx = null;
var bgmTimer = null;

// 뉴에이지 피아노 음계 (C Major 펜타토닉)
var PIANO_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
var MELODY = [0, 2, 4, 5, 4, 2, 0, 1, 2, 4, 5, 7, 5, 4, 2, 1];
var melodyIdx = 0;

function playPianoNote(freq, time) {
  var osc = bgmCtx.createOscillator();
  var osc2 = bgmCtx.createOscillator();
  var gainNode = bgmCtx.createGain();
  var master = bgmCtx.createGain();

  // 피아노 특유의 배음
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, time);

  // 어택 → 디케이 → 서스테인 → 릴리즈 (피아노 엔벨로프)
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02);   // 빠른 어택
  gainNode.gain.exponentialRampToValueAtTime(0.15, time + 0.3); // 디케이
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.5); // 릴리즈

  master.gain.setValueAtTime(0.18, time);

  osc.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(master);
  master.connect(bgmCtx.destination);

  osc.start(time);
  osc2.start(time);
  osc.stop(time + 3);
  osc2.stop(time + 3);
}

function playNextNote() {
  if (!bgmPlaying) return;
  var noteIdx = MELODY[melodyIdx % MELODY.length];
  var freq = PIANO_NOTES[noteIdx];
  playPianoNote(freq, bgmCtx.currentTime);

  // 가끔 화음 추가 (3도 위)
  if (melodyIdx % 4 === 0) {
    var harmIdx = Math.min(noteIdx + 2, PIANO_NOTES.length - 1);
    playPianoNote(PIANO_NOTES[harmIdx] * 0.5, bgmCtx.currentTime);
  }

  melodyIdx++;
  // 음표마다 간격 랜덤 (0.8~1.8초) → 자연스러운 리듬
  var interval = 800 + Math.random() * 1000;
  bgmTimer = setTimeout(playNextNote, interval);
}

function createBGM() {
  bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
  melodyIdx = 0;
  playNextNote();
}

function toggleBGM() {
  var btn = document.getElementById('bgmToggle');
  if (!bgmPlaying) {
    bgmPlaying = true;
    if (!bgmCtx) {
      createBGM();
    } else {
      bgmCtx.resume();
      playNextNote();
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
