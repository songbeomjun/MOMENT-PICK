from flask import Flask, render_template, request, jsonify, session
import json, random, os, jwt, bcrypt
import anthropic
from datetime import datetime, timedelta
from functools import wraps
import requests as req

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'moment-pick-dev-secret-2026')

# ── Supabase 설정 ──
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://xyejwkjclcttgwzqttwu.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWp3a2pjbGN0dGd3enF0dHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTM1NTEsImV4cCI6MjA5NjM4OTU1MX0.biQ1VD61KgnRZO6CC3xbA9CnuI17fWvR65qik-XZ-Kk')
JWT_SECRET = os.environ.get('JWT_SECRET', 'moment-pick-jwt-secret-2026-change-in-prod')

# ── Supabase REST API 헬퍼 ──
def sb_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

def sb_select(table, filters=''):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{filters}'
    r = req.get(url, headers=sb_headers())
    return r.json() if r.ok else []

def sb_insert(table, data):
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    r = req.post(url, headers=sb_headers(), json=data)
    return r.json() if r.ok else []

def sb_update(table, data, filters):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{filters}'
    r = req.patch(url, headers=sb_headers(), json=data)
    return r.json() if r.ok else []

def sb_upsert(table, data):
    headers = {**sb_headers(), 'Prefer': 'resolution=merge-duplicates,return=representation'}
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    r = req.post(url, headers=headers, json=data)
    return r.json() if r.ok else []

# ── JWT 인증 데코레이터 ──
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': '로그인이 필요해요'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user_id = data['user_id']
            request.username = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': '토큰이 만료됐어요. 다시 로그인해주세요'}), 401
        except Exception:
            return jsonify({'error': '인증에 실패했어요'}), 401
        return f(*args, **kwargs)
    return decorated

# ── 미션 풀 ──
AUTO_MISSION_POOL = [
    {'icon': '🌅', 'name': '오늘의 첫 감정 기록', 'desc': '아침에 눈 뜬 순간의 감정을 솔직하게 적어보세요', 'type': 'text', 'placeholder': '오늘 아침 기분이 어떤가요?'},
    {'icon': '🧃', 'name': '수분 보충 인증', 'desc': '물 한 잔 마시고 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '🌳', 'name': '자연 사진 찍기', 'desc': '오늘 본 하늘, 나무, 꽃 무엇이든 담아보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '📝', 'name': '오늘 배운 것 한 줄', 'desc': '오늘 새롭게 알게 된 사실을 기록해보세요', 'type': 'text', 'placeholder': '오늘 처음 알게 된 것은...'},
    {'icon': '🧸', 'name': '나에게 응원 메시지', 'desc': '지금의 나에게 따뜻한 한마디를 남겨보세요', 'type': 'text', 'placeholder': '잘하고 있어, 왜냐하면...'},
    {'icon': '🎧', 'name': '지금 기분에 맞는 노래', 'desc': '지금 듣고 싶은 곡 제목과 이유를 적어보세요', 'type': 'text', 'placeholder': '지금 기분에 딱 맞는 노래는...'},
    {'icon': '🚶', 'name': '10분 산책 인증', 'desc': '잠깐이라도 밖을 걷고 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '🍽️', 'name': '오늘 먹은 것 기록', 'desc': '오늘 가장 맛있었던 음식을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '💬', 'name': '소중한 사람에게 연락', 'desc': '오랜만에 생각난 사람에게 안부를 전해봤나요?', 'type': 'check', 'placeholder': ''},
    {'icon': '🌙', 'name': '오늘 하루 세 줄 회고', 'desc': '잘한 것, 아쉬운 것, 내일 할 것을 적어보세요', 'type': 'text', 'placeholder': '잘한 것 / 아쉬운 것 / 내일 할 것'},
    {'icon': '🎯', 'name': '오늘의 집중 시간 선언', 'desc': '오늘 가장 집중하고 싶은 일 하나를 적어보세요', 'type': 'text', 'placeholder': '오늘 반드시 해낼 것은...'},
    {'icon': '🖼️', 'name': '오늘의 공간 사진', 'desc': '지금 있는 공간을 그대로 찍어보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🤲', 'name': '오늘의 감사 한 줄', 'desc': '작더라도 오늘 감사한 것 하나를 적어보세요', 'type': 'text', 'placeholder': '오늘 작지만 감사했던 것은...'},
    {'icon': '💤', 'name': '7시간 수면 도전', 'desc': '충분히 잤다면 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '🃏', 'name': '오늘의 행운 카드', 'desc': '1~100 사이의 행운 번호를 뽑아보세요', 'type': 'random', 'placeholder': ''},
    {'icon': '🌿', 'name': '스트레칭 5분', 'desc': '몸을 움직이고 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '📖', 'name': '책 한 페이지 읽기', 'desc': '짧더라도 오늘 읽은 내용을 기록해보세요', 'type': 'text', 'placeholder': '오늘 읽은 책과 기억에 남는 문장은...'},
    {'icon': '🎨', 'name': '낙서 또는 드로잉', 'desc': '뭔가를 그리고 사진으로 찍어 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🏠', 'name': '공간 정리 인증', 'desc': '책상이든 방이든 한 곳을 정리하고 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '📸', 'name': '지금 이 순간 포착', 'desc': '지금 눈앞에 보이는 것을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '☀️', 'name': '오늘의 날씨 감상', 'desc': '오늘 날씨를 보며 느낀 감정을 적어보세요', 'type': 'text', 'placeholder': '오늘 날씨가 주는 느낌은...'},
    {'icon': '🧠', 'name': '오늘 고민 해결하기', 'desc': '요즘 고민 중인 것을 써보고 해결책을 찾아보세요', 'type': 'text', 'placeholder': '고민 / 해결책'},
    {'icon': '💃', 'name': '오늘의 기분 점수', 'desc': '오늘 기분을 1~10점으로 점수 매기고 이유를 적어보세요', 'type': 'text', 'placeholder': '점수 / 이유'},
    {'icon': '🌺', 'name': '예쁜 것 찾기', 'desc': '오늘 주변에서 아름다운 것을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '✨', 'name': '오늘의 작은 성공', 'desc': '오늘 이뤄낸 작은 성취를 기록해보세요', 'type': 'text', 'placeholder': '오늘 내가 해낸 것은...'},
    {'icon': '🎬', 'name': '인상 깊은 장면 기록', 'desc': '오늘 본 영상이나 영화의 인상 깊은 장면을 적어보세요', 'type': 'text', 'placeholder': '장면과 그 이유는...'},
    {'icon': '🛏️', 'name': '일찍 자기 도전', 'desc': '오늘은 평소보다 30분 일찍 자보기!', 'type': 'check', 'placeholder': ''},
    {'icon': '🧊', 'name': '냉장고 정리', 'desc': '냉장고를 한 번 정리하고 완료 체크!', 'type': 'check', 'placeholder': ''},
    {'icon': '🙏', 'name': '감사 메시지 작성', 'desc': '오늘 감사한 일 3가지를 적어보세요', 'type': 'text', 'placeholder': '오늘 감사했던 일은...'},
    {'icon': '💌', 'name': '소중한 사람에게 편지', 'desc': '그리운 사람에게 짧은 편지를 써보세요', 'type': 'text', 'placeholder': '마음을 담아 편지를 써보세요...'},
    {'icon': '🌅', 'name': '오늘의 하늘 사진', 'desc': '지금 하늘을 올려다보고 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🍱', 'name': '오늘의 한 끼 인증', 'desc': '오늘 먹은 음식을 사진으로 기록해보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🪴', 'name': '내 공간의 식물 찍기', 'desc': '주변의 식물이나 자연물을 찍어보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '👟', 'name': '오늘의 발걸음 인증', 'desc': '오늘 걷거나 운동한 장면을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🌇', 'name': '창밖 풍경 담기', 'desc': '지금 창밖에 보이는 풍경을 사진으로 찍어보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '☕', 'name': '오늘의 음료 사진', 'desc': '오늘 마신 음료를 감성적으로 찍어보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '📚', 'name': '지금 읽는 책 사진', 'desc': '현재 읽고 있는 책을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': ''},
    {'icon': '🛋️', 'name': '나만의 공간 사진', 'desc': '편안한 내 공간을 사진으로 기록해보세요', 'type': 'photo', 'placeholder': '', 'category': 'daily', 'difficulty': 1},
    # 건강 카테고리
    {'icon': '🏃', 'name': '20분 유산소 운동', 'desc': '달리기, 줄넘기, 빠르게 걷기 등 유산소 운동을 해보세요', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 2},
    {'icon': '🥗', 'name': '채소 한 접시 먹기', 'desc': '오늘 식단에 채소를 한 접시 추가해보세요', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 1},
    {'icon': '🚴', 'name': '자전거 또는 산책 30분', 'desc': '야외에서 30분 이상 움직여보세요', 'type': 'photo', 'placeholder': '', 'category': 'health', 'difficulty': 2},
    {'icon': '💊', 'name': '비타민 챙겨 먹기', 'desc': '영양제나 비타민을 챙겨 먹고 완료 체크!', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 1},
    {'icon': '🧘', 'name': '10분 명상', 'desc': '눈을 감고 10분간 호흡에 집중해보세요', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 2},
    {'icon': '🏋️', 'name': '근력 운동 도전', 'desc': '팔굽혀펴기, 스쿼트 등 근력 운동을 20회씩 3세트', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 3},
    {'icon': '🌊', 'name': '냉수 샤워 도전', 'desc': '마지막 30초 냉수 샤워에 도전해보세요!', 'type': 'check', 'placeholder': '', 'category': 'health', 'difficulty': 3},
    # 마음챙김 카테고리
    {'icon': '🕯️', 'name': '디지털 디톡스 1시간', 'desc': '1시간 동안 스마트폰을 내려놓고 지내보세요', 'type': 'check', 'placeholder': '', 'category': 'mind', 'difficulty': 3},
    {'icon': '🌿', 'name': '자연 속 10분', 'desc': '공원, 정원, 산 어디든 자연에서 10분을 보내보세요', 'type': 'photo', 'placeholder': '', 'category': 'mind', 'difficulty': 1},
    {'icon': '📓', 'name': '감정 일기 쓰기', 'desc': '오늘 느낀 감정을 솔직하게 일기로 적어보세요', 'type': 'text', 'placeholder': '오늘 어떤 감정이 들었나요?', 'category': 'mind', 'difficulty': 2},
    {'icon': '🎵', 'name': '음악 감상 15분', 'desc': '좋아하는 음악을 틀고 아무것도 하지 않고 감상만 해보세요', 'type': 'check', 'placeholder': '', 'category': 'mind', 'difficulty': 1},
    {'icon': '🫁', 'name': '4-7-8 호흡법', 'desc': '4초 흡입, 7초 멈춤, 8초 내쉬기를 3번 반복해보세요', 'type': 'check', 'placeholder': '', 'category': 'mind', 'difficulty': 1},
    # 창의 카테고리
    {'icon': '✍️', 'name': '짧은 시 한 편 쓰기', 'desc': '오늘 느낀 감정을 시로 표현해보세요 (4줄 이상)', 'type': 'text', 'placeholder': '오늘을 시로 표현하면...', 'category': 'creative', 'difficulty': 3},
    {'icon': '📷', 'name': '미니멀 사진 찍기', 'desc': '단순하고 아름다운 구도의 사진 한 장을 찍어보세요', 'type': 'photo', 'placeholder': '', 'category': 'creative', 'difficulty': 2},
    {'icon': '🎸', 'name': '악기 연주 10분', 'desc': '피아노, 기타 등 악기를 10분 연습해보세요', 'type': 'check', 'placeholder': '', 'category': 'creative', 'difficulty': 2},
    {'icon': '🖊️', 'name': '손글씨 연습', 'desc': '좋아하는 문장을 예쁜 손글씨로 써보고 사진 찍기', 'type': 'photo', 'placeholder': '', 'category': 'creative', 'difficulty': 1},
    {'icon': '🌈', 'name': '색칠하기 또는 그림 그리기', 'desc': '색칠공부, 수채화, 낙서 무엇이든 그려보세요', 'type': 'photo', 'placeholder': '', 'category': 'creative', 'difficulty': 2},
    # 관계 카테고리
    {'icon': '🤗', 'name': '감사 편지 보내기', 'desc': '소중한 사람에게 감사한 마음을 담은 메시지를 보내보세요', 'type': 'text', 'placeholder': '어떤 감사를 전했나요?', 'category': 'relation', 'difficulty': 2},
    {'icon': '☎️', 'name': '오래된 친구에게 전화', 'desc': '오랫동안 연락하지 못한 친구에게 전화해보세요', 'type': 'check', 'placeholder': '', 'category': 'relation', 'difficulty': 2},
    {'icon': '🍳', 'name': '가족에게 요리해주기', 'desc': '가족이나 소중한 사람을 위해 음식을 만들어보세요', 'type': 'photo', 'placeholder': '', 'category': 'relation', 'difficulty': 3},
    {'icon': '👂', 'name': '경청의 시간', 'desc': '오늘 누군가의 이야기를 끝까지 들어주세요', 'type': 'text', 'placeholder': '어떤 이야기를 들었나요?', 'category': 'relation', 'difficulty': 2},
    # 성장 카테고리
    {'icon': '🎓', 'name': '새로운 것 배우기 30분', 'desc': '유튜브 강의, 책, 앱으로 30분간 무언가를 배워보세요', 'type': 'text', 'placeholder': '오늘 배운 것은?', 'category': 'growth', 'difficulty': 2},
    {'icon': '🗣️', 'name': '외국어 10문장 공부', 'desc': '영어, 일본어 등 외국어 문장 10개를 공부해보세요', 'type': 'text', 'placeholder': '공부한 문장들을 적어보세요', 'category': 'growth', 'difficulty': 2},
    {'icon': '📰', 'name': '뉴스 읽고 요약하기', 'desc': '오늘의 주요 뉴스 하나를 읽고 3줄로 요약해보세요', 'type': 'text', 'placeholder': '뉴스 제목 / 요약 3줄', 'category': 'growth', 'difficulty': 2},
    {'icon': '💰', 'name': '가계부 작성', 'desc': '오늘 지출한 내역을 기록해보세요', 'type': 'text', 'placeholder': '오늘의 지출 내역...', 'category': 'growth', 'difficulty': 1},
    {'icon': '🎯', 'name': '이번 주 목표 점검', 'desc': '이번 주에 세운 목표를 얼마나 달성했는지 점검해보세요', 'type': 'text', 'placeholder': '목표 / 달성 현황', 'category': 'growth', 'difficulty': 2},
    {'icon': '🔖', 'name': '책 챕터 하나 읽기', 'desc': '읽고 있는 책의 챕터 하나를 완독해보세요', 'type': 'text', 'placeholder': '읽은 챕터와 인상 깊은 내용', 'category': 'growth', 'difficulty': 2},
    # 일상 카테고리
    {'icon': '🧺', 'name': '빨래 개기', 'desc': '쌓아둔 빨래를 개어 제자리에 정리해보세요', 'type': 'check', 'placeholder': '', 'category': 'daily', 'difficulty': 1},
    {'icon': '🪥', 'name': '구석구석 청소하기', 'desc': '평소 잘 안 닦는 곳을 오늘 청소해보세요', 'type': 'check', 'placeholder': '', 'category': 'daily', 'difficulty': 2},
    {'icon': '🛒', 'name': '장보기 계획 세우기', 'desc': '이번 주 식재료 계획을 세우고 장을 봐보세요', 'type': 'text', 'placeholder': '이번 주 장볼 것들...', 'category': 'daily', 'difficulty': 1},
    {'icon': '📦', 'name': '안 쓰는 물건 정리', 'desc': '필요 없는 물건 5개를 골라 정리해보세요', 'type': 'check', 'placeholder': '', 'category': 'daily', 'difficulty': 2},
]

DEFAULT_MISSIONS = [
    {'id': 1, 'icon': '🙏', 'name': '감사 메시지 작성', 'desc': '오늘 감사한 일 3가지를 적어보세요', 'type': 'text', 'placeholder': '오늘 감사했던 일은...', 'minLength': 10},
    {'id': 2, 'icon': '📸', 'name': '오늘의 순간 포착', 'desc': '오늘 가장 의미 있는 순간을 사진으로 남겨보세요', 'type': 'photo', 'placeholder': '', 'minLength': 0},
    {'id': 3, 'icon': '💌', 'name': '소중한 사람에게 편지', 'desc': '그리운 사람에게 짧은 편지를 써보세요', 'type': 'text', 'placeholder': '마음을 담아 편지를 써보세요...', 'minLength': 20},
    {'id': 4, 'icon': '🎯', 'name': '오늘의 목표 선언', 'desc': '내일의 나에게 한 가지 약속을 해보세요', 'type': 'text', 'placeholder': '나는 내일...', 'minLength': 10},
    {'id': 5, 'icon': '🎲', 'name': '오늘의 행운 번호', 'desc': '오늘의 행운 번호를 뽑아보세요', 'type': 'random', 'placeholder': '', 'minLength': 0},
]

# ── 세션 기반 미션 헬퍼 (비로그인 fallback) ──
def get_missions():
    if 'missions' not in session:
        session['missions'] = json.dumps(DEFAULT_MISSIONS)
    return json.loads(session['missions'])

def get_state():
    if 'state' not in session:
        state = {str(m['id']): {'completed': False, 'value': '', 'lucky': None, 'fileName': ''} for m in DEFAULT_MISSIONS}
        session['state'] = json.dumps(state)
    return json.loads(session['state'])

def save_missions(m): session['missions'] = json.dumps(m)
def save_state(s): session['state'] = json.dumps(s)

# ════════════════════════════════════════
# ── 인증 API ──
# ════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if len(username) < 3:
        return jsonify({'success': False, 'message': '아이디는 3자 이상이어야 해요'})
    if len(username) > 20:
        return jsonify({'success': False, 'message': '아이디는 20자 이하여야 해요'})
    if not username.replace('_', '').replace('-', '').isalnum():
        return jsonify({'success': False, 'message': '아이디는 영문, 숫자, _, - 만 사용 가능해요'})
    if len(password) < 6:
        return jsonify({'success': False, 'message': '비밀번호는 6자 이상이어야 해요'})

    try:
        existing = sb_select('users', f'username=eq.{username}&select=id')
        if existing:
            return jsonify({'success': False, 'message': '이미 사용 중인 아이디예요'})

        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = sb_insert('users', {'username': username, 'password_hash': pw_hash})
        user_id = user[0]['id']
        sb_insert('user_data', {'user_id': user_id})

        token = jwt.encode({
            'user_id': user_id, 'username': username,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')

        return jsonify({'success': True, 'token': token, 'username': username})
    except Exception as e:
        return jsonify({'success': False, 'message': '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요'})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    try:
        result = sb_select('users', f'username=eq.{username}')
        if not result:
            return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 틀렸어요'})

        user = result[0]
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 틀렸어요'})

        sb_update('users', {'last_login': datetime.utcnow().isoformat()}, f"id=eq.{user['id']}")

        token = jwt.encode({
            'user_id': user['id'], 'username': username,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')

        return jsonify({'success': True, 'token': token, 'username': username})
    except Exception as e:
        return jsonify({'success': False, 'message': '서버 오류가 발생했어요'})


# ── 유저 데이터 동기화 ──
@app.route('/api/userdata', methods=['GET'])
@token_required
def get_userdata():
    try:
        result = sb_select('user_data', f'user_id=eq.{request.user_id}')
        return jsonify({'success': True, 'data': result[0] if result else {}})
    except:
        return jsonify({'success': True, 'data': {}})


@app.route('/api/userdata', methods=['POST'])
@token_required
def save_userdata():
    data = request.json
    allowed = ['streak_count', 'streak_last_date', 'total_completed',
               'calendar', 'routines', 'custom_missions',
               'daily_date', 'daily_missions', 'daily_state',
               'username', 'friend_code', 'xp', 'fc_last']
    payload = {k: data[k] for k in allowed if k in data}
    payload['user_id'] = request.user_id
    payload['updated_at'] = datetime.utcnow().isoformat()
    try:
        sb_upsert('user_data', payload)
        return jsonify({'success': True})
    except:
        return jsonify({'success': False})


# ════════════════════════════════════════
# ── 기존 API ──
# ════════════════════════════════════════

@app.route('/')
def index():
    missions = get_missions()
    state = get_state()
    today = datetime.now()
    days = ['월', '화', '수', '목', '금', '토', '일']
    today_str = f"{today.year}년 {today.month}월 {today.day}일 ({days[today.weekday()]})"
    return render_template('index.html', missions=missions, state=state, today=today_str)


@app.route('/api/complete', methods=['POST'])
def complete_mission():
    data = request.json
    mission_id = str(data.get('id'))
    state = get_state()
    if mission_id in state:
        state[mission_id].update({'completed': True, 'value': data.get('value', ''),
                                   'fileName': data.get('fileName', ''), 'lucky': data.get('lucky')})
        save_state(state)
        return jsonify({'success': True})
    return jsonify({'success': False}), 404


@app.route('/api/add_mission', methods=['POST'])
def add_mission():
    data = request.json
    missions = get_missions()
    state = get_state()
    new_id = max([m['id'] for m in missions], default=0) + 1
    new_mission = {'id': new_id, 'icon': data.get('icon', '⭐'), 'name': data.get('name', '새 미션'),
                   'desc': data.get('desc', '나만의 특별한 미션'), 'type': data.get('type', 'check'),
                   'placeholder': data.get('placeholder', ''), 'minLength': 5}
    missions.append(new_mission)
    state[str(new_id)] = {'completed': False, 'value': '', 'lucky': None, 'fileName': ''}
    save_missions(missions)
    save_state(state)
    return jsonify({'success': True, 'mission': new_mission})


@app.route('/api/auto_mission', methods=['POST'])
def auto_mission():
    missions = get_missions()
    state = get_state()
    existing_names = [m['name'] for m in missions]
    available = [m for m in AUTO_MISSION_POOL if m['name'] not in existing_names]
    if not available:
        return jsonify({'success': False})
    pick = random.choice(available)
    new_id = max([m['id'] for m in missions], default=0) + 1
    new_mission = {'id': new_id, 'icon': pick['icon'], 'name': pick['name'], 'desc': pick['desc'],
                   'type': pick['type'], 'placeholder': pick.get('placeholder', ''), 'minLength': 5}
    missions.append(new_mission)
    state[str(new_id)] = {'completed': False, 'value': '', 'lucky': None, 'fileName': ''}
    save_missions(missions)
    save_state(state)
    return jsonify({'success': True, 'mission': new_mission})


@app.route('/api/lucky', methods=['POST'])
def lucky_number():
    return jsonify({'number': random.randint(1, 100)})


@app.route('/api/reset', methods=['POST'])
def reset():
    session.clear()
    return jsonify({'success': True})



@app.route('/api/myfriendcode', methods=['GET'])
@token_required
def my_friend_code():
    import hashlib
    result = sb_select('user_data', f'user_id=eq.{request.user_id}&select=friend_code,username')
    if result and result[0].get('friend_code'):
        return jsonify({'success': True, 'code': result[0]['friend_code'], 'username': request.username})
    code = hashlib.md5(request.user_id.encode()).hexdigest()[:6].upper()
    sb_update('user_data', {'friend_code': code, 'username': request.username}, f'user_id=eq.{request.user_id}')
    return jsonify({'success': True, 'code': code, 'username': request.username})


@app.route('/api/friend/<code>', methods=['GET'])
def lookup_friend(code):
    result = sb_select('user_data', f'friend_code=eq.{code.upper()}&select=friend_code,streak_count,total_completed,username')
    if not result:
        return jsonify({'success': False, 'message': '코드를 찾을 수 없어요'})
    d = result[0]
    return jsonify({'success': True, 'username': d.get('username', '익명'), 'streak': d.get('streak_count', 0), 'total': d.get('total_completed', 0)})


# ── Anthropic 클라이언트 ──
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

def check_premium(user_id):
    result = sb_select('user_data', f'user_id=eq.{user_id}&select=is_premium')
    return result and result[0].get('is_premium', False)

# ════════════════════════════════════════
# ── 프리미엄 API ──
# ════════════════════════════════════════

@app.route('/api/premium/status', methods=['GET'])
@token_required
def premium_status():
    result = sb_select('user_data', f'user_id=eq.{request.user_id}&select=is_premium')
    is_p = result[0].get('is_premium', False) if result else False
    return jsonify({'success': True, 'is_premium': is_p, 'username': request.username})


@app.route('/api/premium/ai_mission', methods=['POST'])
@token_required
def ai_mission():
    if not check_premium(request.user_id):
        return jsonify({'success': False, 'error': 'premium_required'})
    if not ANTHROPIC_KEY:
        return jsonify({'success': False, 'error': 'api_key_missing'})
    data = request.json
    recent = data.get('recent_missions', [])
    mood = data.get('mood', '')
    streak = data.get('streak', 0)
    categories = data.get('categories', [])

    recent_str = ', '.join(recent[:5]) if recent else '없음'
    mood_str = mood if mood else '기록 없음'
    cat_str = ', '.join(categories) if categories else '다양'

    prompt = f"""사용자를 위한 오늘의 맞춤 미션 3개를 추천해주세요.

사용자 정보:
- 최근 완료 미션: {recent_str}
- 오늘 기분: {mood_str}
- 연속 달성일: {streak}일
- 선호 카테고리: {cat_str}

반드시 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
[
  {{"icon": "이모지", "name": "미션 이름 (10자 이내)", "desc": "미션 설명 (30자 이내)", "type": "check 또는 text", "placeholder": "텍스트 안내문구", "category": "health/mind/creative/relation/growth/daily", "difficulty": 1 또는 2 또는 3}},
  ...
]

type은 반드시 check 또는 text 중 하나여야 합니다. 사용자 상황에 딱 맞는 따뜻하고 실용적인 미션을 추천해주세요."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text.strip()
        # JSON 파싱
        import re
        json_match = re.search(r'[\[].*[\]]', text, re.DOTALL)
        if json_match:
            missions = json.loads(json_match.group())
            return jsonify({'success': True, 'missions': missions[:3]})
        return jsonify({'success': False, 'error': 'parse_error'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/premium/ai_diary', methods=['POST'])
@token_required
def ai_diary():
    if not check_premium(request.user_id):
        return jsonify({'success': False, 'error': 'premium_required'})
    if not ANTHROPIC_KEY:
        return jsonify({'success': False, 'error': 'api_key_missing'})
    data = request.json
    missions = data.get('completed_missions', [])
    mood = data.get('mood', '')
    streak = data.get('streak', 0)
    username = request.username

    if not missions:
        return jsonify({'success': False, 'error': 'no_missions'})

    missions_str = '\n'.join([f'- {m}' for m in missions])
    today = datetime.now()
    date_str = f"{today.year}년 {today.month}월 {today.day}일"

    prompt = f"""{date_str}에 {username}님이 완료한 미션들을 바탕으로 따뜻하고 감성적인 하루 일기를 써주세요.

완료한 미션:
{missions_str}

오늘 기분: {mood if mood else '기록 없음'}
연속 달성일: {streak}일

일기 작성 조건:
- 1인칭 시점으로 작성
- 3~4문단, 총 150~200자 내외
- 따뜻하고 진심 어린 톤
- 오늘 하루를 아름답게 마무리하는 느낌
- 마지막 문장은 내일에 대한 기대나 다짐으로 끝내기
- 날짜 헤더 없이 일기 본문만 작성"""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        diary = message.content[0].text.strip()
        return jsonify({'success': True, 'diary': diary, 'date': date_str})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/premium/export', methods=['GET'])
@token_required
def export_data():
    if not check_premium(request.user_id):
        return jsonify({'success': False, 'error': 'premium_required'})
    result = sb_select('user_data', f'user_id=eq.{request.user_id}')
    if not result:
        return jsonify({'success': False})
    d = result[0]
    export = {
        'username': request.username,
        'exported_at': datetime.utcnow().isoformat(),
        'streak_count': d.get('streak_count', 0),
        'total_completed': d.get('total_completed', 0),
        'calendar': d.get('calendar', {}),
        'routines': d.get('routines', []),
    }
    return jsonify({'success': True, 'data': export})


# ════════════════════════════════════════
# ── 가계부 API ──
# ════════════════════════════════════════

@app.route('/api/budget', methods=['GET'])
@token_required
def get_budget():
    try:
        result = sb_select('budget_data', f'user_id=eq.{request.user_id}')
        if result:
            return jsonify({'success': True, 'data': result[0]})
        # 첫 사용자 초기 데이터 생성
        init = {
            'user_id': request.user_id,
            'transactions': [],
            'accounts': [],
            'goals': [],
            'subscriptions': [],
            'wishlist': [],
            'settings': {'monthly_budget': 0, 'categories': []},
            'challenge_52week': [],
        }
        sb_insert('budget_data', init)
        return jsonify({'success': True, 'data': init})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/budget', methods=['POST'])
@token_required
def save_budget():
    data = request.json
    allowed = ['transactions','accounts','goals','subscriptions','wishlist','settings','challenge_52week']
    payload = {k: data[k] for k in allowed if k in data}
    payload['user_id'] = request.user_id
    payload['updated_at'] = datetime.utcnow().isoformat()
    try:
        sb_upsert('budget_data', payload)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/budget/export', methods=['GET'])
@token_required
def export_budget():
    result = sb_select('budget_data', f'user_id=eq.{request.user_id}')
    if not result:
        return jsonify({'success': False})
    transactions = result[0].get('transactions', [])
    # CSV 생성
    import io
    output = io.StringIO()
    output.write('날짜,유형,카테고리,내용,금액,메모,태그\n')
    for t in sorted(transactions, key=lambda x: x.get('date',''), reverse=True):
        output.write(f"{t.get('date','')},{t.get('type','')},{t.get('category','')},{t.get('name','')},{t.get('amount',0)},{t.get('memo','')},{t.get('tag','')}\n")
    csv_data = output.getvalue()
    from flask import Response
    return Response(
        csv_data.encode('utf-8-sig'),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=budget.csv'}
    )

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json'), 200, {'Content-Type': 'application/json'}


@app.route('/sw.js')
def service_worker():
    return app.send_static_file('sw.js'), 200, {'Content-Type': 'application/javascript'}


if __name__ == '__main__':
    app.run(debug=True)
