from flask import Flask, render_template, request, jsonify, session
import json, random, os, jwt, bcrypt
from datetime import datetime, timedelta
from functools import wraps
from supabase import create_client

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'moment-pick-dev-secret-2026')

# ── Supabase 설정 ──
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://xyejwkjclcttgwzqttwu.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWp3a2pjbGN0dGd3enF0dHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTM1NTEsImV4cCI6MjA5NjM4OTU1MX0.biQ1VD61KgnRZO6CC3xbA9CnuI17fWvR65qik-XZ-Kk')
JWT_SECRET = os.environ.get('JWT_SECRET', 'moment-pick-jwt-secret-2026-change-in-prod')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    {'icon': '🛋️', 'name': '나만의 공간 사진', 'desc': '편안한 내 공간을 사진으로 기록해보세요', 'type': 'photo', 'placeholder': ''},
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
        existing = supabase.table('users').select('id').eq('username', username).execute()
        if existing.data:
            return jsonify({'success': False, 'message': '이미 사용 중인 아이디예요'})

        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = supabase.table('users').insert({'username': username, 'password_hash': pw_hash}).execute()
        user_id = user.data[0]['id']
        supabase.table('user_data').insert({'user_id': user_id}).execute()

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
        result = supabase.table('users').select('*').eq('username', username).execute()
        if not result.data:
            return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 틀렸어요'})

        user = result.data[0]
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 틀렸어요'})

        supabase.table('users').update({'last_login': datetime.utcnow().isoformat()}).eq('id', user['id']).execute()

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
        result = supabase.table('user_data').select('*').eq('user_id', request.user_id).execute()
        return jsonify({'success': True, 'data': result.data[0] if result.data else {}})
    except:
        return jsonify({'success': True, 'data': {}})


@app.route('/api/userdata', methods=['POST'])
@token_required
def save_userdata():
    data = request.json
    allowed = ['streak_count', 'streak_last_date', 'total_completed',
               'calendar', 'routines', 'custom_missions',
               'daily_date', 'daily_missions', 'daily_state']
    payload = {k: data[k] for k in allowed if k in data}
    payload['user_id'] = request.user_id
    payload['updated_at'] = datetime.utcnow().isoformat()
    try:
        supabase.table('user_data').upsert(payload, on_conflict='user_id').execute()
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
