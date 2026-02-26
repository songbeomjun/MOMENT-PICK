from flask import Flask, render_template, request, jsonify, session
import json
import random
import os
from datetime import datetime

app = Flask(__name__)
import os
app.secret_key = os.environ.get('SECRET_KEY', 'moment-pick-dev-secret-2026')

# 기본 미션 목록
DEFAULT_MISSIONS = [
    {
        'id': 1,
        'icon': '🙏',
        'name': '감사 메시지 작성',
        'desc': '오늘 감사한 일 3가지를 적어보세요',
        'type': 'text',
        'placeholder': '예) 오늘 맛있는 커피를 마셨다, 친구가 연락해줬다...',
        'minLength': 10,
    },
    {
        'id': 2,
        'icon': '📸',
        'name': '오늘의 순간 포착',
        'desc': '오늘 가장 의미 있는 순간을 사진으로 남겨보세요',
        'type': 'photo',
        'placeholder': '',
        'minLength': 0,
    },
    {
        'id': 3,
        'icon': '💌',
        'name': '소중한 사람에게 편지',
        'desc': '그리운 사람에게 짧은 편지를 써보세요',
        'type': 'text',
        'placeholder': '마음을 담아 편지를 써보세요...',
        'minLength': 20,
    },
    {
        'id': 4,
        'icon': '🎯',
        'name': '오늘의 목표 선언',
        'desc': '내일의 나에게 한 가지 약속을 해보세요',
        'type': 'text',
        'placeholder': '예) 나는 내일 30분 일찍 일어날 것이다...',
        'minLength': 10,
    },
    {
        'id': 5,
        'icon': '🎲',
        'name': '오늘의 행운 번호',
        'desc': '오늘의 행운 번호를 뽑아보세요',
        'type': 'random',
        'placeholder': '',
        'minLength': 0,
    },
]

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
    {'icon': '🌙', 'name': '오늘 하루 세 줄 회고', 'desc': '잘한 것, 아쉬운 것, 내일 할 것을 적어보세요', 'type': 'text', 'placeholder': '잘한 것:\n아쉬운 것:\n내일 할 것:'},
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
]


def get_missions():
    if 'missions' not in session:
        session['missions'] = json.dumps(DEFAULT_MISSIONS)
    return json.loads(session['missions'])


def get_state():
    if 'state' not in session:
        state = {}
        for m in DEFAULT_MISSIONS:
            state[str(m['id'])] = {'completed': False, 'value': '', 'lucky': None, 'fileName': ''}
        session['state'] = json.dumps(state)
    return json.loads(session['state'])


def save_missions(missions):
    session['missions'] = json.dumps(missions)


def save_state(state):
    session['state'] = json.dumps(state)


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
    value = data.get('value', '')
    file_name = data.get('fileName', '')
    lucky = data.get('lucky')

    state = get_state()
    if mission_id in state:
        state[mission_id]['completed'] = True
        state[mission_id]['value'] = value
        state[mission_id]['fileName'] = file_name
        state[mission_id]['lucky'] = lucky
        save_state(state)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Mission not found'}), 404


@app.route('/api/add_mission', methods=['POST'])
def add_mission():
    data = request.json
    missions = get_missions()
    state = get_state()

    new_id = max([m['id'] for m in missions], default=0) + 1
    new_mission = {
        'id': new_id,
        'icon': data.get('icon', '⭐'),
        'name': data.get('name', '새 미션'),
        'desc': data.get('desc', '나만의 특별한 미션'),
        'type': data.get('type', 'check'),
        'placeholder': data.get('placeholder', '내용을 입력해주세요...'),
        'minLength': 5,
    }
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
        return jsonify({'success': False, 'error': 'no_more'})

    pick = random.choice(available)
    new_id = max([m['id'] for m in missions], default=0) + 1
    new_mission = {
        'id': new_id,
        'icon': pick['icon'],
        'name': pick['name'],
        'desc': pick['desc'],
        'type': pick['type'],
        'placeholder': pick.get('placeholder', ''),
        'minLength': 5,
    }
    missions.append(new_mission)
    state[str(new_id)] = {'completed': False, 'value': '', 'lucky': None, 'fileName': ''}
    save_missions(missions)
    save_state(state)
    return jsonify({'success': True, 'mission': new_mission})


@app.route('/api/lucky', methods=['POST'])
def lucky_number():
    n = random.randint(1, 100)
    return jsonify({'number': n})


@app.route('/api/reset', methods=['POST'])
def reset():
    session.clear()
    return jsonify({'success': True})


@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json'), 200, {'Content-Type': 'application/json'}


@app.route('/sw.js')
def service_worker():
    return app.send_static_file('sw.js'), 200, {'Content-Type': 'application/javascript'}


if __name__ == '__main__':
    print("=" * 40)
    print("  MOMENT PICK 서버 시작!")
    print("  브라우저에서 http://127.0.0.1:5000 접속")
    print("=" * 40)
    app.run(debug=True)
