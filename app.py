# -*- coding: utf-8 -*-
import os
import sys
import logging
import math
import json
import uuid
import time
import random
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from functools import wraps
from bson.objectid import ObjectId

# ==============================================================================
# [SECTION 0] 프레임워크 및 필수 라이브러리 로드
# ==============================================================================
try:
    from flask import Flask, render_template_string, request, redirect, url_for, session, jsonify, flash
    from pymongo import MongoClient
    from bson.objectid import ObjectId
except ImportError:
    print("CRITICAL ERROR: 'pip install flask pymongo' 명령어를 실행하여 필수 라이브러리를 설치하십시오.")
    sys.exit()

# ==============================================================================
# [SECTION 1] 시스템 마스터 설정 (System Master Config)
# ==============================================================================
# 사장님의 제국을 위한 최고 수준의 로깅 및 보안 설정입니다.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("CheckCoin_Full_V7_2")

app = Flask(__name__)
# 세션 보안용 마스터 비밀키 (절대 노출 금지)
app.secret_key = "MASTER_VAULT_KEY_CHECKCOIN_V1_57_SUPREME_2026_GOD"

@app.after_request
def add_header(response):
    # 브라우저에게 "이 화면은 1초도 기억하지 마"라고 명령하는 부분
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=60)

game_state = {
    "is_playing": False,
    "current_turn_index": 0,  
    "participants": [],       
    "folded_users": []        
}

# 관리자(사장님) 전용 접속 정보
ADMIN_ID = os.environ.get("ADMIN_ID", "admin")
ADMIN_PW = os.environ.get("ADMIN_PW", "1234")

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "사장님메일@gmail.com"  # 사장님 지메일 주소
SENDER_PASSWORD = "xxxx xxxx xxxx xxxx" # 구글 앱 비밀번호 16자리 (환경변수 권장)

# 시스템 정책 변수 (모든 수치는 사장님의 요청을 반영함)
WELCOME_BONUS = 21000.0  # 신규 가입 축하금 (2.1억 원)
BANK_ID = "central_bank"  # 중앙은행 고유 식별자

# ==============================================================================
# [SECTION 2] 데이터베이스 아키텍처 (Database Infrastructure)
# ==============================================================================
# 사장님의 자산 데이터는 MongoDB를 통해 영구적으로 보존됩니다.
try:
    # 환경 변수 또는 로컬 호스트를 통해 데이터베이스 연결
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.checkcoin_v7_db
    
    # [데이터 컬렉션 정의]
    users_col = db.users            # 모든 VIP 회원 정보 및 개인 자산
    bet_col = db['bets'] 
    messages_col = db['messages']
    requests_col = db.requests      # 관리자 승인을 기다리는 입금 요청 대기열
    game_room_col = db.game_room    # 실시간 게임판, 판돈(POT), 턴 제어 데이터
    bank_col = db.bank              # 중앙은행 금고, 전체 자산 흐름, 누적 이자 수익
    mail_logs_col = db.mail_logs    # 시스템 알림 및 가상 이메일 전송 로그
    ticker_col = db.ticker_logs     # 실시간 전광판 알림 데이터 (최신 순)
    system_col = db.system_settings
    games_col = db['games']         # 시스템 전역 설정 (금리 등)
    TITLES = ["카드의 지배자", "코인의 지배자", "베팅의 신", "최고 지배자"]
    
    # 연결 상태 핑 테스트
    client.admin.command('ping')
    logger.info("✅ 체크코인 금융 제국 - 중앙 데이터 서버가 활성화되었습니다.")
except Exception as e:
    logger.error(f"❌ 데이터베이스 연결 실패: {e}")
    # 사장님께 경고 메시지 출력
    print("CRITICAL: 데이터베이스가 응답하지 않습니다. MongoDB 상태를 확인하십시오.")

def send_admin_join_email(new_user_name):
    """새로운 회원이 가입하면 사장님 지메일로 실제 메일을 발송합니다."""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = SENDER_EMAIL
        msg['Subject'] = f"🚀 [체크코인] 신규 회원 가입: {new_user_name}"
        
        body = f"체크코인 제국에 새로운 회원 [{new_user_name}] 님이 가입하였습니다.\n지금 바로 관리자 대시보드에서 확인하세요."
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"메일 발송 에러: {e}")

# 메시지 발송 함수 (간략 예시)
def send_message(sender_id, receiver_id, content):
    msg_data = {
        "sender": sender_id,
        "receiver": receiver_id,
        "content": content,
        "timestamp": datetime.now(),
        "is_read": False
    }
    db.messages.insert_one(msg_data)

def get_next_turn():
    original_idx = game_state["current_turn_idx"]
    while True:
        game_state["current_turn_idx"] = (game_state["current_turn_idx"] + 1) % len(game_state["participants"])
        next_user = game_state["participants"][game_state["current_turn_idx"]]
        
        # 포기하지 않은 유저를 찾으면 중단
        if next_user not in game_state["folded_users"]:
            break
        # 만약 한 바퀴 돌아 제자리면 (모두 포기 등) 중단
        if game_state["current_turn_idx"] == original_idx:
            break
 


def get_room_data(room_id):
    """특정 방의 정보를 가져오거나, 없으면 멀티룸 구조로 생성"""
    room = game_room_col.find_one({"_id": str(room_id)})
    if not room:
        new_room = {
            "_id": str(room_id),
            "pot": 0.0,
            "players": [],                 # [user_id1, user_id2]
            "turn_index": -1,
            "last_winner": None,
            "game_status": "WAITING",      # WAITING / PLAYING
            "spectators": [],              # 승인된 관전자 명단
            "waiting_spectators": [],      # 승인 대기 중인 관전자 명단
            "exit_queue": [],              # 퇴장 예약자 리스트
            "last_action_time": datetime.now()
        }
        game_room_col.insert_one(new_room)
        logger.info(f"🎮 신규 게임룸({room_id})이 생성되었습니다.")
        return new_room
    return room

def settle_champion_bet(room_id, winner_id):
    bets = db.champion_bets.find({"room_id": room_id, "status": "approved"})
    total_pot = sum(b['amount'] for b in bets)
    
    winners = [b for b in bets if b['target_player_id'] == winner_id]
    losers = [b for b in bets if b['target_player_id'] != winner_id]

    if winners and losers:
        # 1. 승리자들 (75% 분배)
        win_share = (total_pot * 0.75) / len(winners)
        for w in winners:
            update_balance(w['user_id'], win_share)
            
        # 2. 패배자들 (15% 분배)
        lose_share = (total_pot * 0.15) / len(losers)
        for l in losers:
            update_balance(l['user_id'], lose_share)
            
        # 3. 국고 (10% 환수)
        bank_profit = total_pot * 0.10
        update_bank_vault(bank_profit)

    elif len(winners) > 0 and not losers:
        # 모든 관전자가 맞춘 경우 원금 반환
        for w in winners:
            update_balance(w['user_id'], w['amount'])


def init_system_data():
    """시스템 최초 가동 시 중앙은행 금고 및 기본 1번 방 생성"""
    if not bank_col.find_one({"_id": BANK_ID}):
        bank_col.insert_one({
            "_id": BANK_ID,
            "total_asset": 172565250.0,
            "total_loaned": 0.0,
            "profit": 0.0,
            "status": "STABLE",
            "last_audit": datetime.now()
        })
        logger.info("🏢 중앙은행 금고가 신규 생성되었습니다.")
    
    # 기본으로 1번 방은 미리 만들어 둡니다.
    get_room_data("1")

# 유저 상태를 판단하는 함수 (이것도 이 근처에 같이 넣어두세요)
def get_user_status(user_id):
    """유저가 현재 어떤 방에서 어떤 역할인지 확인 (검색 조건 강화)"""
    
    # 1. 플레이어(전투원) 리스트 확인
    # user_id 자체가 리스트에 있거나, {user_id: user_id} 객체가 리스트에 있는 경우 모두 검색
    room_as_player = game_room_col.find_one({
        "$or": [
            {"players": user_id},
            {"players.user_id": user_id}
        ]
    })
    if room_as_player:
        return {"role": "player", "room_id": room_as_player['_id']}
    
    # 2. 관전자(승인됨) 리스트 확인
    room_as_spec = game_room_col.find_one({
        "$or": [
            {"spectators": user_id},
            {"spectators.user_id": user_id}
        ]
    })
    if room_as_spec:
        return {"role": "spectator", "room_id": room_as_spec['_id']}
    
    # 3. 관전 대기 중(waiting_spectators) 리스트 확인
    room_as_wait = game_room_col.find_one({
        "$or": [
            {"waiting_spectators": user_id},
            {"waiting_spectators.user_id": user_id}
        ]
    })
    if room_as_wait:
        return {"role": "waiting", "room_id": room_as_wait['_id']}
    
    # 4. 무소속
    return {"role": "free", "room_id": None}


# 시스템 시작 시 초기화 함수 실행
init_system_data()

# ==============================================================================
# [SECTION 3] 금융 연산 엔진 (Finance Calculation Engine)
# ==============================================================================
# 사장님이 요청하신 정밀한 이자 계산 및 화폐 단위 변환 로직이 포함되어 있습니다.

def f_money(value):
    """
    숫자 데이터를 '조', '억', '만' 단위의 한국 금융 형식으로 변환합니다.
    예: 21000 -> 2억 1000만 원
    """
    try:
        val = float(value or 0)
        is_minus = val < 0
        abs_v = abs(val)
        
        # 단위 계산
        jo = int(abs_v // 100000000)
        eok = int((abs_v % 100000000) // 10000)
        man = int(abs_v % 10000)
        
        result_parts = []
        if jo > 0: result_parts.append(f"{jo}조")
        if eok > 0: result_parts.append(f"{eok}억")
        if man > 0 or not result_parts:
            # 콤마 처리 포함 (예: 1,500만)
            result_parts.append(f"{man:,.0f}만")
        
        final_str = ("-" if is_minus else "") + " ".join(result_parts) + " 원"
        return final_str
    except Exception as e:
        logger.error(f"f_money 변환 오류: {e}")
        return "0만 원"



def get_tier(net_balance):
    """
    사용자의 순 자산(잔액 - 대출원금)을 기준으로 6단계 등급을 부여합니다.
    사장님의 '실버 등급 특명'이 완벽하게 반영되어 있습니다.
    """
    # 순 자산 기준 (단위: 만 원)
    if net_balance >= 150000: # 15억 이상
        return {
            "name": "VVIP", 
            "limit": 100000, 
            "txt": "15억", 
            "color": "linear-gradient(135deg, #4b0082, #ff00ff)",
            "desc": "제국의 최고 권위자"
        }
    elif net_balance >= 120000: # 12억 이상
        return {
            "name": "VIP", 
            "limit": 70000, 
            "txt": "8억", 
            "color": "linear-gradient(135deg, #b8860b, #ffd700)",
            "desc": "상위 1% 자산가"
        }
    elif net_balance >= 80000: # 7억 이상
        return {
            "name": "DIAMOND", 
            "limit": 45000, 
            "txt": "5억", 
            "color": "linear-gradient(135deg, #008b8b, #00ffff)",
            "desc": "고액 자산가"
        }
    elif net_balance >= 50000: # 4억 이상
        return {
            "name": "GOLD", 
            "limit": 20000, 
            "txt": "2억", 
            "color": "linear-gradient(135deg, #cc8800, #ffaa00)",
            "desc": "우수 고객"
        }
    elif net_balance >= 30000: # 2억 이상 (실버 등급)
        return {
            "name": "SILVER", 
            "limit": 10000, 
            "txt": "1억", 
            "color": "linear-gradient(135deg, #7f8c8d, #bdc3c7)",
            "desc": "중견 자산가"
        }
    else: # 기본 등급
        return {
            "name": "BRONZE", 
            "limit": 5000, 
            "txt": "5천만", 
            "color": "linear-gradient(135deg, #333, #666)",
            "desc": "일반 고객"
        }

def calc_loan_info(user):
    """
    정밀한 대출 이자 계산 알고리즘.
    1. 20일까지: 무이자
    2. 21일~34일: 일 복리 개념의 0.02%
    3. 35일 이후: 연체 가산금 적용 0.08%
    """
    # --- [에러 방지 안전 장치 추가] ---
    if isinstance(user, str):
        user = users_col.find_one({"user_id": user})
    
    if not user:
        return {
            "active": False, "pri": 0, "int": 0, "total": 0, 
            "days": 0, "rate": "정상(3)", "warning": ""
        }
    # ---------------------------------

    l_status = user.get('loan_status', {})
    principal = l_status.get('principal', 0)
    start_date = l_status.get('start_date')
    
    # 대출이 없는 경우 기본값 반환
    if principal <= 0 or not start_date:
        return {
            "active": False, "pri": 0, "int": 0, "total": 0, 
            "days": 0, "rate": "정상(3)", "warning": ""
        }
    
    # 경과 시간 계산
    now = datetime.now()
    delta = now - start_date
    days = delta.days
    
    interest = 0
    rate_name = "정상(3)"
    warning_msg = ""
    
    # 이자 구간별 연산
    if days < 21:
        interest = 0 # 20일까지 무이자
        rate_name = "정상(3)"
    elif 21 <= days < 35:
        # 21일차부터 일 0.02%
        interest = principal * (0.0002 * (days - 20))
        rate_name = "주의(4)"
        warning_msg = "이자가 발생 중입니다. 조기 상환을 권장합니다."
    else:
        # 35일차부터 연체료 폭탄 0.08%
        base_interest = principal * 0.0002 * 14 # 21~34일분
        overdue_interest = principal * 0.0008 * (days - 34) # 35일 이후분
        interest = base_interest + overdue_interest
        rate_name = "신용불량(5)"
        warning_msg = "연체 상태입니다! 자산이 강제로 동결될 수 있습니다."
        
    return {
        "active": True, 
        "pri": principal, 
        "int": round(interest, 2), 
        "total": round(principal + interest, 2), 
        "days": days, 
        "rate": rate_name,
        "warning": warning_msg
    }

def terminate_game(room_id):
    # 1. 방 상태를 종료로 변경
    rooms_col.update_one({"room_id": room_id}, {"$set": {"is_playing": False}})
    # 2. 해당 방의 모든 유저 폴드 해제 및 턴 초기화
    users_col.update_many(
        {"room_id": room_id}, 
        {"$set": {"is_folded": False, "is_my_turn": False}}
    )

# --- [SECTION 3: 유틸리티 및 전광판 로직] ---

# 1. 이름 가리기 (새로 추가)
def mask_name(name):
    if not name or len(name) < 2:
        return name
    if len(name) == 2:
        return name[0] + "@"
    return name[0] + "@" * (len(name) - 2) + name[-1]

# 2. 전광판 추가 (수정됨)
def add_ticker(message, original_name=None):
    processed_msg = message
    if original_name:
        masked = mask_name(original_name)
        processed_msg = message.replace(original_name, masked)

    ticker_col.insert_one({
        "msg": processed_msg,
        "created_at": datetime.now(),
        "type": "SYSTEM",
        "views": 0
    })

# 3. 전광판 출력 (수정됨)
def get_ticker_html():
    logs = list(ticker_col.find({"views": {"$lt": 3}}).sort("created_at", -1))
    
    if not logs:
        return '<div class="ticker-item">👑 제국에 오신 것을 환영합니다.</div>'
    
    html_bundle = ""
    for log in logs:
        timestamp = log['created_at'].strftime('%H:%M')
        html_bundle += f'<div class="ticker-item">[{timestamp}] {log["msg"]}</div>'
        ticker_col.update_one({"_id": log["_id"]}, {"$inc": {"views": 1}})
    
    ticker_col.delete_many({"views": {"$gte": 3}})
    return html_bundle

# ==============================================================================
# [SECTION 4] 마스터 프론트엔드 스타일 (Complete CSS/JS)
# ==============================================================================
# 사장님이 요청하신 블랙 & 골드 테마의 모든 애니메이션과 디테일이 포함된 스타일시트입니다.

MASTER_UI_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <link rel="icon" href="https://i.ibb.co/67FTnrr8/checkcoin-logo-v-1-01.png" type="image/png">
    <meta property="og:title" content="체크코인 V.3.47">
    <meta property="og:description" content="최고의 재미 최고의 시스템(위 사이트는 실제 돈이 들어가는 자금 관리 시스템이 아닙니다 사용에 오해 없으시길 바랍니다.)">
    <meta property="og:image" content="https://i.ibb.co/67FTnrr8/checkcoin-logo-v-1-01.png">
    <meta property="og:url" content="https://www.checkcoin.cloud">
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>CHECKCOIN V.3.47 </title>
    <style>
        /* [CSS 1] 구글 프리미엄 폰트 적용 */
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css');
        
        /* [CSS 2] 전역 변수 설정 */
        :root { 
            --gold: #d4af37; 
            --gold-bright: #ffdf00;
            --silver: #bdc3c7; 
            --bg-deep: #000000;
            --bg-card: #0a0a0a;
            --accent-red: #ff416c;
            --accent-green: #38ef7d;
            --text-main: #ffffff;
            --text-sub: #888888;
            --glass: rgba(255, 255, 255, 0.05);
        }

        /* [CSS 3] 레이아웃 초기화 */
        * { 
            box-sizing: border-box; 
            font-family: 'Pretendard', -apple-system, sans-serif; 
            outline: none; 
            -webkit-tap-highlight-color: transparent;
        }
        body { 
            background-color: var(--bg-deep); 
            color: var(--text-main); 
            margin: 0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            min-height: 100vh; 
            overflow-x: hidden; 
        }

        /* [CSS 4] 실시간 전광판 (Ticker) 스타일 */
        .ticker-container {
            width: 100%; 
            background: #050505; 
            border-bottom: 1px solid #151515; 
            overflow: hidden;
            white-space: nowrap; 
            padding: 12px 0; 
            position: sticky; 
            top: 0; 
            z-index: 1000;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
        .ticker-mover {
            display: inline-block; 
            padding-left: 100%; 
            animation: ticker-move 35s linear infinite;
            color: var(--gold); 
            font-weight: 800; 
            font-size: 0.95rem; 
            text-shadow: 0 0 8px rgba(212,175,55,0.4);
        }
        @keyframes ticker-move { 
            0% { transform: translate3d(0, 0, 0); } 
            100% { transform: translate3d(-100%, 0, 0); } 
        }
        .ticker-item { 
            margin-right: 80px; 
            display: inline-block; 
            letter-spacing: 1px;
        }

        /* [CSS 5] 메인 뷰포트 및 애니메이션 */
        .viewport { 
            width: 100%; 
            max-width: 480px; 
            padding: 30px 20px; 
            animation: page-in 0.8s cubic-bezier(0.23, 1, 0.32, 1); 
        }
        @keyframes page-in { 
            from { opacity: 0; transform: translateY(40px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        /* [CSS 6] 카드 프리미엄 스타일 */
        .premium-card {
            background: linear-gradient(145deg, #111111, #050505); 
            border-radius: 35px; 
            padding: 40px 30px;
            border: 1px solid rgba(255,255,255,0.08); 
            backdrop-filter: blur(25px);
            box-shadow: 0 40px 80px rgba(0,0,0,0.8); 
            margin-bottom: 30px; 
            position: relative; 
            overflow: hidden;
        }

        /* [CSS 7] 화려한 잔액 텍스트 */
        .balance-display { 
            font-size: 4.5rem; 
            font-weight: 900; 
            margin: 10px 0; 
            letter-spacing: -3px; 
            text-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }
        .balance-unit { font-size: 1.8rem; margin-left: 8px; font-weight: 700; color: #aaa; }

        /* [CSS 8] 버튼 시스템 마스터 */
        .btn-group { display: flex; flex-direction: column; gap: 15px; }
        .m-btn {
            width: 100%; 
            height: 78px; 
            border-radius: 24px; 
            border: none; 
            font-size: 1.3rem;
            font-weight: 800; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            text-decoration: none; 
            color: #fff; 
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }
        .m-btn:hover { transform: translateY(-4px); filter: brightness(1.2); }
        .m-btn:active { transform: scale(0.97); }

        .btn-prime { background: linear-gradient(135deg, #11998e, #38ef7d); }
        .btn-gold { 
            background: linear-gradient(135deg, #8e5800, #b8860b); 
            border: 1px solid var(--gold); 
            box-shadow: 0 15px 30px rgba(184,134,11,0.25);
        }
        .btn-dark { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); }
        .btn-red { background: linear-gradient(135deg, #ff416c, #ff4b2b); }

        /* [CSS 9] 숫자 패드 UI */
        .numpad-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin: 30px 0; 
        }
        .num-key {
            height: 70px; 
            background: rgba(255,255,255,0.04); 
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px; 
            color: #fff; 
            font-weight: 800; 
            cursor: pointer; 
            font-size: 1.1rem;
            transition: 0.2s;
        }
        .num-key:active { background: var(--gold); color: #000; }

        /* [CSS 10] 입력창 럭셔리 스타일 */
        input[type="text"], input[type="password"], input[type="number"] {
            width: 100%; 
            padding: 24px; 
            border-radius: 24px; 
            border: 1px solid #222;
            background: #000; 
            color: #fff; 
            font-size: 1.6rem; 
            text-align: center; 
            margin-bottom: 25px;
            font-weight: 900;
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
        }
        
        .footer-text { 
            text-align: center; 
            opacity: 0.2; 
            font-size: 0.8rem; 
            margin-top: 50px; 
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    {{ content | safe }}

    <script>
        /* [JS 1] 전역 상태 관리 */
        let currentBalance = 0;
        let accumulatedValue = 0;

        /* [JS 2] 잔액 롤링 애니메이션 */
        window.animateBalance = function(target) {
            const displayElement = document.getElementById('bal_num');
            if(!displayElement) return;
            
            const start = currentBalance;
            const duration = 500; 
            const startTime = performance.now();

            function update(currentTime) {
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const easeValue = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + (target - start) * easeValue);
                
                displayElement.innerText = current.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    currentBalance = target;
                }
            }
            requestAnimationFrame(update);
        };

        /* [JS 3] 숫자 패드 입력 제어 */
        function addAmount(value) {
            accumulatedValue += value;
            const accEl = document.getElementById('acc_num');
            if(accEl) accEl.innerText = accumulatedValue.toLocaleString();
            const totalDisp = document.getElementById('total_display_box');
            if(totalDisp) {
                totalDisp.style.transform = "scale(1.05)";
                setTimeout(() => totalDisp.style.transform = "scale(1)", 100);
            }
        }

        function resetAmount() {
            accumulatedValue = 0;
            const accEl = document.getElementById('acc_num');
            if(accEl) accEl.innerText = "0";
        }

        /* [JS 4] 통합 제출 핸들러 (f-string 충돌 방지 위해 백틱 제거) */
        function processTransaction(mode, userId) {
            if (accumulatedValue <= 0) {
                alert("금액을 선택해주십시오.");
                return;
            }
            const msg = accumulatedValue + "만 원을 " + (mode === 'pay' ? '결제/베팅' : '입금 요청') + " 하시겠습니까?";
            if (confirm(msg)) {
                if (mode === 'pay') {
                    location.href = "/action/pay/" + userId + "?amt=" + accumulatedValue;
                } else {
                    fetch("/action/req_charge/" + userId + "?amt=" + accumulatedValue)
                        .then(res => res.json())
                        .then(data => {
                            alert("중앙은행에 입금 승인 요청이 전달되었습니다.");
                            resetAmount();
                        });
                }
            }
        }

        /* [JS 5] 실시간 데이터 동기화 */
        setInterval(function() {
            const path = window.location.pathname;
            if (path.indexOf('/wallet/') !== -1) {
                const parts = path.split('/');
                const walletIdx = parts.indexOf('wallet');
                const userId = parts[walletIdx + 1].split('?')[0]; 
                
                if(!userId) return;
                
                fetch('/api/get_balance/' + userId)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const balEl = document.getElementById('bal_num');
                            if (balEl) {
                                const currentDisp = parseInt(balEl.innerText.replace(/,/g, '')) || 0;
                                if (currentDisp !== data.balance) {
                                    window.animateBalance(data.balance);
                                }
                            }

                            const payBtn = document.querySelector('.btn-prime');
                            if (payBtn) {
                                if (data.is_my_turn) {
                                    payBtn.disabled = false;
                                    payBtn.style.opacity = "1";
                                    payBtn.style.cursor = "pointer";
                                    payBtn.innerText = "💎 결제 및 게임 베팅";
                                } else {
                                    payBtn.disabled = true;
                                    payBtn.style.opacity = "0.3";
                                    payBtn.style.cursor = "not-allowed";
                                    payBtn.innerText = "⏳ 상대방의 턴 대기중...";
                                }
                            }
                        }
                    })
                    .catch(err => {}); 
            }
        }, 1000);

        function sendSecretMsg() {
    const receiver = document.getElementById('msg_receiver').value;
    const content = document.getElementById('msg_content').value;
    
    if(!receiver || !content) { 
        alert("수신 대상 VIP와 내용을 모두 입력해 주십시오."); 
        return; 
    }

    // FormData 대신 JSON 형식으로 더 깔끔하게 전송
    fetch('/api/send_msg', { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receiver_id: receiver,
            content: content
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            alert("🔱 제국 보안 서버를 통해 암호문이 전달되었습니다.");
            document.getElementById('msg_content').value = ""; 
        } else { 
            alert("⚠️ 통신 실패: " + data.msg); 
        }
    })
    .catch(err => {
        alert("📡 제국 통신망에 일시적인 교란이 발생했습니다.");
    });
    }
    </script>
</body>
</html>
"""
    

# ==============================================================================
# [SECTION 5] 핵심 라우트 - 메인 및 사용자 인터페이스
# ==============================================================================



@app.route('/')
def index():
    """메인 인덱스 페이지 - 뒤로가기 시에만 보안 세션 초기화"""
    
    # [핵심 보완] 뒤로가기 감지 로직
    # 정상적인 '버튼 클릭'이나 '링크 이동'을 통해 온 것이 아니라면(referrer가 없음),
    # 사용자가 뒤로가기를 눌렀거나 주소창에 직접 쳤다고 판단하여 세션을 초기화합니다.
    if not request.referrer:
        session['list_authorized'] = False
        session['admin_list_auth'] = False
    
    ticker_data = get_ticker_html()
    index_html = """
    <div class="ticker-container">
        <div class="ticker-mover">""" + ticker_data + """</div>
    </div>

    <div class="viewport" style="margin-top:60px; text-align:center;">
        <h1 style="font-size:3.5rem; font-weight:900; color:#fff;">CHECKCOIN</h1>
        <p style="color:var(--gold); font-weight:900; letter-spacing:5px;">V.3.47</p>
        <div class="premium-card" style="margin-top:40px;">
            <div class="btn-group">
                <a href="/join" class="m-btn btn-prime">👤 신규 VIP 카드 발급</a>
                <a href="/login_list" class="m-btn btn-dark">💳 기존 카드 접속</a>
                <a href="/admin/gate" class="m-btn btn-gold">🔱 관리자 로그인</a>
            </div>
        </div>
        <div class="footer-text">CENTRAL BANK SYSTEM &copy; 2026</div>
    </div>

        <div style="margin-top: 50px; padding-bottom: 30px; text-align: center; clear: both;">
        <p style="color: #555; font-size: 0.65rem; letter-spacing: 3px; font-family: 'Arial', sans-serif; text-transform: uppercase; opacity: 0.6;">
            PRODUCED BY 01&17
        </p>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=index_html)

@app.route('/api/transfer', methods=['POST'])
def transfer_funds():
    # 1. 폼 데이터 가져오기
    sender_id = request.form.get('sender_id')
    receiver_name = request.form.get('receiver_name')
    raw_amount = request.form.get('amount')

    # 2. 세션 보안 검증 (사장님 전용 auth 방식)
    if not sender_id or f"auth_{sender_id}" not in session:
        return jsonify({"success": False, "msg": "보안 세션이 만료되었습니다. 다시 시도해주세요."})

    # 3. 금액 숫자 변환 및 검증
    try:
        amount = int(raw_amount)
        if amount <= 0:
            return jsonify({"success": False, "msg": "양도 금액은 0보다 커야 합니다."})
    except (ValueError, TypeError):
        return jsonify({"success": False, "msg": "올바른 금액 형식이 아닙니다."})

    # 4. 데이터베이스에서 유저 조회
    sender = users_col.find_one({"user_id": sender_id})
    receiver = users_col.find_one({"name": receiver_name})

    if not sender:
        return jsonify({"success": False, "msg": "발신자 정보를 찾을 수 없습니다."})
    if not receiver:
        return jsonify({"success": False, "msg": f"수취인({receiver_name})을 찾을 수 없습니다."})
    
    # 5. 상태 검증
    if sender.get('is_frozen'): 
        return jsonify({"success": False, "msg": "동결된 계좌는 양도가 불가능합니다."})
    if sender['user_id'] == receiver['user_id']:
        return jsonify({"success": False, "msg": "본인에게는 양도할 수 없습니다."})

    # 6. 수수료 및 차감액 계산
    fee = int(amount * 0.05)
    total_deduct = amount + fee  # 보낼 금액 + 수수료가 총 차감액

    # 7. 잔액 확인
    if sender['balance'] < total_deduct:
        return jsonify({"success": False, "msg": f"잔액 부족! (수수료 포함 {total_deduct:,}원 필요)"})

    # 8. 자금 이동 (원자적 처리)
    # 보내는 이 차감 (보낼 금액 + 수수료 전체)
    users_col.update_one({"user_id": sender_id}, {"$inc": {"balance": -total_deduct}})
    
    # 받는 이 입금 (수수료 제외한 순수 금액만)
    users_col.update_one({"user_id": receiver['user_id']}, {"$inc": {"balance": amount}})
    
    # [핵심 수정] 제국 국고 수수료 적립 (settings 컬렉션의 central_bank 데이터에 누적)
    # 이 수치가 쌓여야 관리자 대시보드의 국고 잔액이 실시간으로 늘어납니다.
    db.settings.update_one(
        {"key": "central_bank"}, 
        {"$inc": {"accumulated_fees": fee}}, 
        upsert=True
    )

    # 9. 실시간 공지 기록
    add_ticker(f"🔔 [양도] {sender['name']} VIP님이 {receiver['name']}님께 {amount:,}원을 양도했습니다. (수수료 {fee:,}원 제국 귀속)")

    return jsonify({"success": True, "msg": f"{receiver_name}님께 양도가 완료되었습니다."})

@app.route('/transfer/<user_id>')
def transfer_page(user_id):
    """자금 양도 입력 페이지 - 제국 국고 징수 안내 보완"""
    
    # 1. 세션 보안 체크
    if f"auth_{user_id}" not in session:
        return redirect('/')
        
    # 2. HTML 구성 (디자인 강화 및 안내 문구 수정)
    transfer_html = """
    <div class="viewport">
        <div class="premium-card" style="border: 1px solid rgba(212, 175, 55, 0.3); background: linear-gradient(145deg, #0a0a0a, #1a1a1a);">
            <h2 style="text-align:center; color:var(--gold); margin-bottom:30px; letter-spacing:4px; font-weight:900;">🔱 EMPIRE TRANSFER</h2>
            
            <div style="background: rgba(212,175,55,0.05); border-radius: 15px; padding: 20px; margin-bottom: 25px; border: 1px dashed rgba(212,175,55,0.3);">
                <p style="font-size:0.85rem; color:#fff; text-align:center; margin:0; line-height:1.6;">
                    <span style="color:var(--gold); font-weight:bold;">[ 제국 법전 제 33조 ]</span><br>
                    자금 양도 시 총 금액의 <span style="color:#ff416c; font-weight:bold;">5%</span>는<br>
                    제국 중앙 국고로 실시간 <span style="text-decoration:underline;">강제 징수</span>됩니다.
                </p>
            </div>

            <form id="transferForm">
                <input type="hidden" name="sender_id" value="USER_ID_HERE">
                
                <div style="margin-bottom:15px;">
                    <label style="font-size:0.7rem; color:#666; margin-left:5px;">수취인 실명</label>
                    <input type="text" name="receiver_name" placeholder="받으실 분 성함" required 
                           style="width:100%; padding:15px; background:#000; border:1px solid #333; color:#fff; border-radius:12px; box-sizing:border-box; margin-top:5px;">
                </div>
                
                <div style="margin-bottom:25px;">
                    <label style="font-size:0.7rem; color:#666; margin-left:5px;">양도 금액 (만 원)</label>
                    <input type="number" name="amount" placeholder="양도 금액" required
                           style="width:100%; padding:15px; background:#000; border:1px solid #333; color:#fff; border-radius:12px; box-sizing:border-box; margin-top:5px;">
                </div>
                
                <button type="button" onclick="executeTransfer()" class="m-btn btn-gold" 
                        style="width:100%; height:65px; font-weight:900; border:none; border-radius:12px; cursor:pointer; font-size:1.1rem; letter-spacing:2px; box-shadow: 0 5px 15px rgba(212,175,55,0.2);">
                    양도 집행하기
                </button>
            </form>

            <center style="margin-top:25px;">
                <a href="/wallet/USER_ID_HERE" style="color:#555; text-decoration:none; font-size:0.85rem; letter-spacing:1px;">← 돌아가기</a>
            </center>
        </div>
    </div>

    <script>
    function executeTransfer() {
        const form = document.getElementById('transferForm');
        const formData = new FormData(form);
        
        if(!form.receiver_name.value || !form.amount.value) {
            alert("수취인과 금액을 정확히 입력하십시오.");
            return;
        }

        const amt = parseInt(form.amount.value);
        const fee = Math.floor(amt * 0.05);
        const total = amt + fee;

        if(!confirm(form.receiver_name.value + " 님에게 양도하시겠습니까?\\n(수수료 포함 총 " + total.toLocaleString() + "만 원 차감)")) return;

        fetch('/api/transfer', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            alert(data.msg);
            if(data.success) {
                location.href = '/wallet/USER_ID_HERE';
            }
        });
    }
    </script>
    """.replace("USER_ID_HERE", user_id)
    
    # 3. 템플릿 렌더링
    return render_template_string(MASTER_UI_TEMPLATE, content=transfer_html)


@app.route('/nfc/<user_id>')
def nfc_access(user_id):
    """
    NFC 카드를 찍었을 때 실행되는 자동 로그인 관문.
    수정 사항: wallet 입장을 위한 특수 세션 키 생성 및 경로 수정
    """
    # 1. DB에서 해당 카드의 주인(user_id)이 있는지 확인
    user = users_col.find_one({"user_id": user_id})
    
    if user:
        # [핵심] 로그인 세션 생성
        session['user_id'] = user_id
        session['name'] = user.get('name', '귀한 손님')
        
        # [필수] 사장님 지갑 보안 로직 통과를 위한 인증 키 생성
        # wallet 라우트의 if f"auth_{user_id}" not in session 로직을 통과시킵니다.
        session[f"auth_{user_id}"] = True
        session.modified = True 
        
        # 2. 지갑 메인 화면으로 리다이렉트 (아이디를 경로에 포함)
        return redirect(url_for('wallet', user_id=user_id))
    else:
        # 등록되지 않은 카드일 경우
        return f"""
        <script>
            alert('등록되지 않은 카드입니다. 회원가입 페이지로 이동합니다.');
            location.href = '/join?target_id={user_id}';
        </script>
        """

@app.route('/join_process', methods=['POST'])
def join_process():
    u_name = request.form.get('name')
    u_id = request.form.get('user_id')
    u_pw = request.form.get('password')
    
    # 1. DB에 유저 생성
    new_user = {
        "user_id": u_id,
        "password": u_pw, # 운영 시 암호화(hashing) 권장
        "name": u_name,
        "balance": 1000, 
        "is_new": True   
    }
    users_col.insert_one(new_user)
    
    # 2. 로그인 세션 생성
    # 지갑(wallet) 라우트의 보안 문지기를 통과하기 위해 auth_아이디 키를 생성합니다.
    session[f"auth_{u_id}"] = True 
    session['user_id'] = u_id
    session['name'] = u_name
    
    # [중요] 세션이 변경되었음을 서버에 알림 (지갑 이동 시 로그인 풀림 방지)
    session.modified = True 
    
    # 3. 지갑으로 즉시 이동 
    # user_id를 경로에 포함하고, is_new='true'를 전달하여 NFC 등록 팝업을 띄웁니다.
    return redirect(url_for('wallet', user_id=u_id, is_new='true'))

import threading  # 파일 최상단에 이 줄이 없다면 반드시 추가해주세요!

@app.route('/join', methods=['GET', 'POST'])
def join():
    """신규 회원 가입 - 가입 후 자동 NFC 카드 각인 로직 포함"""
    # [STEP 1] 관문(nfc_access)에서 넘어온 ID가 있다면 사용, 없으면 새로 생성
    target_id = request.args.get('target_id')
    if not target_id:
        target_id = f"VIP-{uuid.uuid4().hex[:6].upper()}"

    if request.method == 'POST':
        name = request.form.get('name')
        pin = request.form.get('pin')
        u_id = request.form.get('user_id') 
        
        if not name or not pin:
            return "<script>alert('성함과 PIN을 입력하세요.'); history.back();</script>"
        
        # 중복 가입 방지 체크
        if users_col.find_one({"user_id": u_id}):
            return "<script>alert('이미 등록된 ID입니다.'); location.href='/';</script>"

        # DB 등록 데이터 생성
        new_user = {
            "user_id": u_id,
            "name": name,
            "pin": pin,
            "balance": WELCOME_BONUS,
            "loan_status": {"principal": 0, "start_date": None},
            "created_at": datetime.now(),
            "last_login": datetime.now()
        }
        
        users_col.insert_one(new_user)
        
        # [실시간 공지 발송]
        try:
            add_ticker(f"🎊 [신규 가입] {name} VIP님께서 제국에 합류하셨습니다! 축하금 2억 1천만 원 지급.")
        except: pass
        
        # [해결포인트 1] 메일 에러로 인한 서버 멈춤 방지 (Thread 처리)
        try:
            # 메일 발송을 별도의 스레드에서 처리하여 가입 프로세스가 멈추지 않게 함
            threading.Thread(target=send_admin_join_email, args=(name,)).start()
        except: 
            pass

        # [해결포인트 2] 보안 세션 강화 및 튕김 방지
        session.clear() # 기존 찌꺼기 세션 삭제
        session[f"auth_{u_id}"] = True
        session['user_id'] = u_id
        session['name'] = name
        session.permanent = True # 세션 유효 기간 보존
        session.modified = True

        # [핵심] 자동 NFC 각인 화면 렌더링 (아이폰/안드로이드 대응)
        return render_template_string(MASTER_UI_TEMPLATE + """
        <div class="viewport">
            <div class="premium-card" style="text-align:center; padding: 60px 20px;">
                <h2 style="color:var(--gold); margin-bottom:10px; letter-spacing:2px;">🔱 제국 열쇠 부여</h2>
                <p id="sub-msg" style="color:#888; margin-bottom:40px;">아래 버튼을 누른 후<br>실물 카드를 휴대폰 뒷면에 대주세요.</p>
                
                <div id="nfc-visual" style="margin: 0 auto 40px; width: 120px; height: 120px; border-radius: 50%; border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; transition: all 0.5s; position: relative;">
                    <span id="nfc-icon" style="font-size: 50px;">📳</span>
                </div>

                <div id="status" style="font-size: 1.2rem; font-weight: 800; color: var(--gold-bright); min-height: 3em;">
                    준비 완료
                </div>
                
                <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 15px;">
                    <button onclick="startNfcWrite()" id="write-btn" class="m-btn btn-prime" style="width:100%; border:none; cursor:pointer;">카드 각인 시작</button>
                    
                    <button onclick="location.href='/wallet/""" + u_id + """'" id="skip-btn" style="background:none; border:none; color:#666; text-decoration:underline; font-size:1rem; cursor:pointer;">
                        지갑으로 직접 이동
                    </button>
                </div>
            </div>
        </div>

        <style>
            .pulse-anim { animation: pulse 1.5s infinite; }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>

        <script>
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const userId = \"""" + u_id + """\";

        // 아이폰 즉시 감지 로직
        if (isIOS) {
            document.getElementById('status').innerHTML = "⚠️ 아이폰은 직접 각인이 제한됩니다.<br><small style='font-weight:400; font-size:0.8rem; color:#666;'>사장님 단말기를 이용하시거나 아래 버튼을 누르세요.</small>";
            document.getElementById('write-btn').style.display = "none";
            const skipBtn = document.getElementById('skip-btn');
            skipBtn.innerText = "카드 없이 지갑으로 입장하기";
            skipBtn.style.color = "var(--gold)";
            skipBtn.style.textDecoration = "none";
            skipBtn.style.fontWeight = "800";
        }

        async function startNfcWrite() {
            const status = document.getElementById('status');
            const visual = document.getElementById('nfc-visual');
            const icon = document.getElementById('nfc-icon');
            const btn = document.getElementById('write-btn');

            if (!('NDEFReader' in window)) {
                status.innerHTML = "❌ NFC 미지원 브라우저입니다.<br><small>안드로이드 크롬을 사용하세요.</small>";
                return;
            }

            try {
                btn.disabled = true;
                btn.innerText = "접촉 대기 중...";
                icon.classList.add('pulse-anim');
                status.innerText = "카드를 폰 뒷면에 대주세요...";

                const ndef = new NDEFReader();
                // [해결포인트 3] 각인 경로를 지갑 주소로 직접 설정
                const writeUrl = window.location.origin + "/wallet/" + userId;
                await ndef.write(writeUrl);
                
                icon.classList.remove('pulse-anim');
                visual.style.background = "var(--gold)";
                visual.style.transform = "scale(1.2)";
                status.style.color = "#38ef7d";
                status.innerText = "✅ 제국 카드 활성화 완료!";
                
                setTimeout(() => {
                    location.href = '/wallet/' + userId;
                }, 1500);

            } catch (error) {
                console.error(error);
                status.innerText = "❌ 오류: 다시 시도해주세요.";
                btn.disabled = false;
                btn.innerText = "다시 시도";
                icon.classList.remove('pulse-anim');
            }
        }
        </script>
        """)
        
    # [GET] 가입 폼 렌더링
    return render_template_string(MASTER_UI_TEMPLATE + """
    <div class="viewport">
        <div class="premium-card">
            <h2 style="text-align:center; margin-bottom:10px; letter-spacing:3px; color:var(--gold);">VIP REGISTRATION</h2>
            <p style="text-align:center; color:#555; font-size:0.8rem; margin-bottom:30px;">ID: {{ target_id }}</p>
            
            <form method="post" action="/join">
                <input type="hidden" name="user_id" value="{{ target_id }}">
                <input type="text" name="name" placeholder="고객 성함 (실명)" required style="width:100%; padding:20px; margin-bottom:15px; border-radius:15px; border:1px solid #333; background:#000; color:#fff; font-size:1.2rem; text-align:center; font-weight:800;">
                <input type="password" name="pin" placeholder="보안 PIN (4~6자리)" required style="width:100%; padding:20px; margin-bottom:25px; border-radius:15px; border:1px solid #333; background:#000; color:#fff; font-size:1.2rem; text-align:center; font-weight:800;">
                <button type="submit" class="m-btn btn-prime" style="width:100%; border:none; font-weight:900;">등록 및 2.1억 원 수령</button>
            </form>
            
            <div style="text-align:center; margin-top:20px;">
                <a href="/" style="color:#444; text-decoration:none; font-size:0.9rem;">취소하고 돌아가기</a>
            </div>
        </div>
    </div>
    """, target_id=target_id)

@app.route('/login_list', methods=['GET', 'POST'])
def login_list():
    """기존 VIP 카드 접속 목록 - 암호 검문소 및 이름 가공 로직 적용"""
    
    # 0. 환경 변수에서 암호 가져오기
    SET_PASSWORD = os.environ.get("LIST_PASSWORD", "1234") 

    # [보완] 뒤로가기 대응 로직: 
    # 암호 입력창(GET)으로 돌아올 때, '이미 인증된 상태'인데 '외부(referrer 없음)'에서 왔다면 세션 파기
    if request.method == 'GET' and session.get('list_authorized') and not request.referrer:
        session['list_authorized'] = False

    # 1. [인증 성공 상태] 이미 암호를 맞춰서 세션에 기록이 있는 경우
    if session.get('list_authorized'):
        all_users = list(users_col.find())
        current_user_id = session.get('user_id')
        is_admin_val = session.get('is_admin')

        user_buttons = ""
        for u in all_users:
            loan = calc_loan_info(u)
            tier = get_tier(u['balance'] - loan['pri'])
            original_name = u.get('name', '미명')
            
            # [보완] 이름 마스킹 함수 (서버에서 아예 가려서 보냄 -> 맥북에서도 완벽 차단)
            def mask_name_at(name):
                if len(name) <= 1:
                    return name
                if len(name) == 2:
                    # 두 글자면 뒤에 글자를 가림 (예: 홍길 -> 홍@)
                    return name[0] + "@"
                # 세 글자 이상이면 성과 끝자만 남기고 중간은 모두 @ 처리
                return name[0] + ("@" * (len(name) - 2)) + name[-1]

            # 보안 및 노출 로직 (관리자나 본인이 아니면 무조건 마스킹 처리)
            if is_admin_val or (current_user_id and u['user_id'] == current_user_id):
                display_name = original_name
            else:
                display_name = mask_name_at(original_name) 

            user_buttons += f"""
            <a href="/login_process/{u['user_id']}" class="m-btn" 
                style="background:{tier['color']}; margin-bottom:15px; text-decoration:none; display:flex; flex-direction:column; height:auto; padding:15px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                <span style="font-size:1.2rem; font-weight:900; color:#fff;">{display_name.upper()}</span>
                <span style="font-size:0.75rem; opacity:0.9; color:#fff; font-weight:bold;">{tier['name']} CLUB</span>
            </a>
            """

        content_html = f"""
        <div class="viewport" style="max-width:500px; margin:0 auto; padding:20px;">
            <h2 style="text-align:center; color:var(--gold); letter-spacing:3px; font-weight:900; margin-bottom:10px;">VIP CARD LIST</h2>
            <p style="text-align:center; color:#666; font-size:0.8rem; margin-bottom:30px;">접속하실 카드(성함)를 선택하십시오.</p>
            <div style="margin-top:10px;">{user_buttons}</div>
            <center style="margin-top:40px; padding-bottom:30px;">
                <a href="/" style="color:#666; text-decoration:none; font-size:0.9rem; border-bottom:1px solid #444;">[ 중앙 광장으로 복귀 ]</a>
            </center>
        </div>
        """
        return render_template_string(MASTER_UI_TEMPLATE, content=content_html)

    # 2. [암호 제출 시점]
    if request.method == 'POST':
        entered_pw = request.form.get('pw')
        if entered_pw == SET_PASSWORD:
            session['list_authorized'] = True
            # url_for('login_list')가 작동하지 않을 경우를 대비해 직접 경로 지정
            return redirect('/login_list')
        else:
            return "<script>alert('암호가 올바르지 않습니다.'); history.back();</script>"

    # 3. [최초 접속 시점] GET 요청 (암호 입력 창)
    gate_html = """
    <div style="max-width:400px; margin:100px auto; padding:30px; background:#1a1a1a; border-radius:20px; text-align:center; border:1px solid #333;">
        <h2 style="color:#ffd700; letter-spacing:2px; margin-bottom:10px;">SECURITY CHECK</h2>
        <p style="color:#888; font-size:0.9rem; margin-bottom:10px;">인가된 인원만 접근 가능합니다.</p>
        
        <p style="color:#ffd700; font-weight:bold; font-size:1.1rem; margin-bottom:5px; border:1px dashed #444; padding:10px; border-radius:8px 8px 0 0; border-bottom:none;">
            ACCESS CODE : <span style="letter-spacing:2px;">""" + SET_PASSWORD + """</span>
        </p>
        <p style="color:#aaa; font-size:0.8rem; margin:0 0 25px 0; background:#222; padding:10px; border:1px dashed #444; border-top:none; border-radius:0 0 8px 8px;">
            (입력창에 "<span style="color:#ffd700;">""" + SET_PASSWORD + """</span>" 을 적고 로그인)
        </p>

        <form method="POST">
            <input type="password" name="pw" placeholder="코드를 입력하세요" 
                   style="width:100%; padding:15px; background:#222; border:1px solid #444; color:#fff; border-radius:10px; margin-bottom:20px; text-align:center; font-size:1.2rem;">
            <button type="submit" style="width:100%; padding:15px; background:#ffd700; color:#000; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">ENTER LIST</button>
        </form>
        <div style="margin-top:30px;">
            <a href="/" style="color:#555; text-decoration:none; font-size:0.8rem;">[ ABORT MISSION ]</a>
        </div>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=gate_html)

@app.route('/login_process/<user_id>', methods=['GET', 'POST'])
def login_process(user_id):
    """목록에서 선택한 유저의 비밀번호를 확인하고 지갑으로 보내주는 관문"""
    
    # 1. 1차 보안(전체 암호) 체크
    if not session.get('list_authorized'):
        return redirect('/login_list')

    # DB에서 유저 정보 가져오기
    user = users_col.find_one({"user_id": user_id})
    if not user:
        return redirect('/login_list')

    # 2. [POST] 비밀번호(PIN)를 입력하고 '엔터'를 눌렀을 때
    if request.method == 'POST':
        entered_pin = request.form.get('pin')
        
        # 가입할 때 설정한 pin과 입력한 pin이 일치하는지 확인
        if entered_pin == user.get('pin'):
            # [핵심] 지갑 함수가 요구하는 그 세션을 여기서 만들어줍니다!
            session[f"auth_{user_id}"] = True
            # 이제 지갑으로 당당하게 입장! (주소 형식을 /wallet/아이디 로 맞춤)
            return redirect(f'/wallet/{user_id}')
        else:
            return "<script>alert('보안 PIN이 일치하지 않습니다.'); history.back();</script>"

    # 3. [GET] 카드를 선택하자마자 보이는 '비밀번호 입력 화면'
    # 사장님의 럭셔리한 UI 스타일을 유지했습니다.
    login_html = f"""
    <div class="viewport" style="max-width:400px; margin:80px auto; padding:20px;">
        <div class="premium-card" style="text-align:center; border:1px solid #333; background:rgba(0,0,0,0.8); padding:40px; border-radius:30px;">
            <h2 style="color:var(--gold); letter-spacing:2px; margin-bottom:10px;">VIP AUTH</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:30px;">[ {user.get('name')} ] VIP님,<br>보안 PIN을 입력하십시오.</p>
            
            <form method="POST">
                <input type="password" name="pin" placeholder="••••" required 
                       style="width:100%; padding:20px; background:#111; border:1px solid #444; color:#fff; border-radius:15px; text-align:center; font-size:2rem; letter-spacing:10px; margin-bottom:20px;">
                <button type="submit" class="m-btn btn-gold" style="width:100%; padding:15px; font-weight:bold; border-radius:12px;">접속 승인</button>
            </form>
            
            <div style="margin-top:25px;">
                <a href="/login_list" style="color:#555; text-decoration:none; font-size:0.8rem;">[ 카드 다시 선택 ]</a>
            </div>
        </div>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=login_html)

@app.route('/api/send_msg', methods=['POST'])
def send_message():
    # [수정] 세션에서 유저 ID를 가져오는 방식을 더 확실하게 변경
    sender_id = session.get('user_id')
    if not sender_id:
        # 세션에 'user_id'가 없을 경우 기존 auth_ 방식 백업
        for key in session.keys():
            if key.startswith("auth_"):
                sender_id = key.replace("auth_", "")
                break
    
    # [수정] JSON 요청과 Form 요청 둘 다 대응할 수 있도록 처리
    if request.is_json:
        data = request.get_json()
        receiver_id = data.get('receiver_id')
        content = data.get('content')
    else:
        receiver_id = request.form.get('receiver_id')
        content = request.form.get('content')
    
    if not sender_id or sender_id == "UNKNOWN": 
        return jsonify({"success": False, "msg": "세션 만료. 다시 로그인하세요."})
    
    if not content: 
        return jsonify({"success": False, "msg": "통신 내용을 입력하세요."})

    # [핵심] DB 저장 - 관리자 '도청 센터'가 읽어가는 컬렉션명(messages_col) 확인
    messages_col.insert_one({
        "sender_id": sender_id,
        "receiver_id": receiver_id or "ALL", # 수신자 없으면 전체 공람용
        "content": content,
        "timestamp": datetime.now(),
        "is_intercepted": True # 도청 마크(사장님용 소소한 재미)
    })
    
    return jsonify({"success": True, "msg": "암호 통신 완료!"})



wallet_inner_html = """
    <style>
        /* 등급별 메탈릭 그라데이션 및 효과 (사장님 원본 유지) */
        .card-bronze { background: linear-gradient(135deg, #a87932, #6b4423); }
        .card-silver { background: linear-gradient(135deg, #d1d1d1, #757575); }
        .card-gold   { background: linear-gradient(135deg, #ffd700, #b8860b); }
        .card-dia    { background: linear-gradient(135deg, #e0f7fa, #4fc3f7); color: #111 !important; }
        .card-vip    { background: linear-gradient(135deg, #222, #000); border: 2px solid #ffd700; box-shadow: 0 0 15px rgba(212,175,55,0.4); }
        .card-vvip   { background: linear-gradient(135deg, #4b0082, #000); border: 2px solid #e0b0ff; box-shadow: 0 0 25px rgba(224, 176, 255, 0.4); }

        .premium-card-v2 {
            position: relative; border-radius: 25px; padding: 25px; height: 190px;
            color: white; overflow: hidden; transition: transform 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex;
            flex-direction: column; justify-content: space-between; margin-bottom: 25px; border: none;
        }

        .premium-card-v2::before {
            content: ''; position: absolute; top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent);
            transform: rotate(30deg); animation: shine 6s infinite linear;
        }

        @keyframes shine { 0% { transform: translateX(-100%) rotate(30deg); } 100% { transform: translateX(100%) rotate(30deg); } }
        @keyframes popIn { 0% { transform: translate(-50%, -60%) scale(0.8); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

        .room-item-card {
            background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 15px;
            padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;
        }

        .target-btn {
            padding: 10px; border-radius: 10px; background: #222; color: #888; border: 1px solid #444;
            text-align: center; cursor: pointer; transition: 0.3s; font-size: 0.8rem;
        }
        .target-btn.active {
            background: rgba(255, 215, 0, 0.15); border-color: #ffd700; color: #ffd700; font-weight: bold;
        }
        
        /* [추가] 통신창 스크롤바 디자인 */
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
    </style>

    <audio id="gameBGM" preload="auto" loop crossorigin="anonymous"></audio>

    <div id="game-start-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: none; align-items: center; justify-content: center; z-index: 150000;">
        <div style="background: #111; border: 2px solid #ffd700; padding: 40px; border-radius: 20px; text-align: center; max-width: 320px; width: 90%;">
            <div style="font-size: 50px; margin-bottom: 20px;">⚔️</div>
            <h2 style="color: #ffd700; margin-bottom: 10px;">GAME START</h2>
            <p style="color: #fff; margin-bottom: 20px;">대전 구역에 진입합니다.</p>
            <button onclick="confirmGameStart()" style="background: #ffd700; color: #000; border: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; width: 100%; cursor:pointer;">전투 개시</button>
        </div>
    </div>

    <div id="win_popup_overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:200000; justify-content:center; align-items:center;">
        <div id="win_popup_box" style="background:linear-gradient(135deg, #ffd700, #b8860b); color:#000; padding:40px; border-radius:30px; text-align:center; min-width:320px; border:5px solid #fff; animation: popIn 0.5s ease-out forwards; position:absolute; top:50%; left:50%;">
            <h1>🏆</h1><h2 id="win_msg_content">VICTORY</h2>
            <button onclick="closeVictoryPopup()" style="background:#000; color:#fff; border:none; padding:15px 40px; border-radius:15px; font-weight:900; cursor:pointer;">영광을 확인했습니다</button>
        </div>
    </div>

    <div class="viewport {% if t_name == 'VVIP' %}vvip-exclusive-bg{% endif %}">
        <div id="turn-display-panel" style="background: rgba(0,0,0,0.6); border: 1px solid #ffd700; border-radius: 15px; padding: 10px; margin-bottom: 15px; text-align: center;">
            <div id="turn_status_text" style="color: #ffd700; font-weight: bold; font-size: 0.9rem;">🎮 시스템 접속 중...</div>
        </div>

        <div class="premium-card-v2 card-{{ t_name|lower }}">
            <div style="display:flex; justify-content:space-between;">
                <div style="letter-spacing:4px; font-weight:900; font-size:0.85rem;">{{ t_name }} MEMBER</div>
                <div style="font-size: 0.7rem; opacity: 0.6;">EMPIRE DIGITAL ID</div>
            </div>
            <div>
                <div style="font-size: 0.65rem; opacity: 0.8; margin-bottom: 5px;">TOTAL ASSETS</div>
                <div style="font-size: 2.3rem; font-weight: 900; line-height: 1;">{{ f_bal }}</div>
            </div>
            <div style="font-weight: bold; font-size: 1.1rem;">{{ u_name }}</div>
        </div>

        <div style="margin-bottom: 25px; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 20px; border: 1px solid #222;">
            <h3 style="color:#ffd700; margin-bottom:12px; font-size:0.95rem; display:flex; justify-content:space-between;">
                <span>📡 제국 통신 기록</span>
                <small style="font-size:0.6rem; color:#555;">ENCRYPTED</small>
            </h3>
            
            <div id="chat-box" class="chat-scroll" style="height:150px; overflow-y:auto; margin-bottom:15px; display:flex; flex-direction:column; gap:8px; padding-right:5px;">
                {% if messages %}
                    {% for msg in messages %}
                    <div style="align-self: {{ 'flex-end' if msg.sender_id == u_id else 'flex-start' }}; max-width: 85%;">
                        <div style="font-size: 0.6rem; color: #555; margin-bottom: 2px; text-align: {{ 'right' if msg.sender_id == u_id else 'left' }};">
                            {{ '나' if msg.sender_id == u_id else msg.sender_id }} → {{ msg.receiver_id }}
                        </div>
                        <div style="padding: 8px 12px; border-radius: 12px; font-size: 0.8rem; line-height: 1.4;
                                    {{ 'background:#ffd700; color:#000; border-radius:12px 12px 0 12px;' if msg.sender_id == u_id else 'background:#1a1a1a; color:#eee; border:1px solid #333; border-radius:12px 12px 12px 0;' }}">
                            {{ msg.content }}
                        </div>
                    </div>
                    {% endfor %}
                {% else %}
                    <div style="text-align:center; color:#333; font-size:0.75rem; margin-top:50px;">교신 내역이 없습니다.</div>
                {% endif %}
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
                <select id="msg_receiver" style="width:100%; background:#111; color:#ffd700; border:1px solid #333; padding:10px; border-radius:10px; font-size:0.85rem;">
                    <option value="">수신인 선택 (VIP LIST)</option>
                    <option value="ALL" style="color:#ff416c;">📢 전체 공지사항</option>
                    {% for v in other_users %}
                        <option value="{{ v.user_id }}">{{ v.name }} ({{ v.user_id }})</option>
                    {% endfor %}
                </select>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="msg_content" placeholder="암호문 입력..." style="flex-grow:1; background:#000; color:#fff; border:1px solid #333; padding:10px; border-radius:10px; font-size:0.85rem;">
                    <button onclick="sendSecretMsg()" style="background:#ffd700; color:#000; border:none; padding:0 15px; border-radius:10px; font-weight:bold; cursor:pointer;">발송</button>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h3 style="color:#ffd700; margin-bottom:12px; font-size:0.95rem;">⚔️ 진행 중인 구역</h3>
            <div id="room-list-box">
                {% if rooms %}
                    {% for r in rooms %}
                    <div class="room-item-card">
                        <div>
                            <div style="font-weight:bold; color:#fff;">{{ r.room_name }}</div>
                            <div style="font-size:0.75rem; color:#888;">참여: {{ r.player_count }}명 | 판돈: {{ r.room_pot }}만</div>
                        </div>
                        <button onclick="requestObserve('{{ r.room_id }}', '{{ u_id }}')" style="background:transparent; border:1px solid #ffd700; color:#ffd700; padding:6px 15px; border-radius:10px; font-size:0.75rem; cursor:pointer;">관전 요청</button>
                    </div>
                    {% endfor %}
                {% else %}
                    <div style="text-align:center; padding:20px; border:1px dashed #444; border-radius:15px; color:#666; font-size:0.8rem;">
                        현재 진행 중인 구역이 없거나<br>데이터를 불러오는 중입니다.
                    </div>
                {% endif %}
            </div>
        </div>

        <div id="champion-target-selector" style="display:none; margin-bottom: 20px; background: rgba(255,215,0,0.05); padding: 15px; border-radius: 15px; border: 1px solid #ffd700;">
            <h4 style="color:#ffd700; margin: 0 0 10px 0; font-size: 0.85rem;">🎯 베팅 대상 플레이어 선택</h4>
            <div id="player-target-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;"></div>
        </div>

        <div id="total_display_box" style="text-align:center; margin-bottom:15px; background:rgba(255,255,255,0.03); padding:15px; border-radius:20px;">
            <div style="font-size:2.2rem; font-weight:900; color:#ffd700;"><span id="acc_num">0</span><small>만</small></div>
            <div onclick="resetAmount()" style="cursor:pointer; color:#ff416c; font-size:0.8rem; margin-top:5px;">[ ↺ 초기화 ]</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <button onclick="addAmount(100)" style="background:#222; color:#fff; border:1px solid #444; padding:12px; border-radius:12px; font-weight:bold;">+100만</button>
            <button onclick="addAmount(1000)" style="background:#222; color:#fff; border:1px solid #444; padding:12px; border-radius:12px; font-weight:bold;">+1000만</button>
            <button onclick="addAmount(10000)" style="background:#333; color:#ffd700; border:1px solid #ffd700; padding:12px; border-radius:12px; font-weight:bold;">+1억</button>
        </div>

        <div class="btn-group" style="display: flex; flex-direction: column; gap: 10px;">
            <button id="champ_bet_btn" onclick="executeChampionBet()" style="display:none; background:linear-gradient(45deg, #ffd700, #ffae00); height:55px; border-radius:15px; font-weight:900; font-size:1.1rem; cursor:pointer; color:#000; border:none; box-shadow: 0 0 15px rgba(255,174,0,0.4);">🏆 CHAMPION BET</button>
            <button id="pay_btn" onclick="processTransaction('pay', '{{ u_id }}')" style="height:55px; border-radius:15px; font-weight:bold; cursor:pointer;" disabled>🔒 권한 대기 중</button>
            <button id="fold_btn" onclick="handleFold('{{ u_id }}')" style="display:none; height:45px; border-radius:15px; background:#444; color:#fff; border:none; cursor:pointer;">🏳️ FOLD</button>
            <button onclick="processTransaction('req', '{{ u_id }}')" style="height:50px; background:#ffd700; border:none; border-radius:15px; font-weight:bold; cursor:pointer; color:#000;">💵 충전 승인 요청</button>
            <button onclick="location.href='/transfer/{{ u_id }}'" style="height:50px; background:#111; color:#ffd700; border:1px solid #ffd700; border-radius:15px; font-weight:bold; cursor:pointer;">💸 자금 양도</button>
            <button onclick="location.href='/'" style="height:40px; background:transparent; color:#555; border:1px solid #222; border-radius:15px; font-size:0.8rem; cursor:pointer;">🏠 메인 로비로 나가기</button>
        </div>
    </div>

    <div id="security-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 100000;">
        <div style="background: #111; border: 1px solid #4ade80; padding: 30px; border-radius: 15px; text-align: center; max-width: 320px;">
            <h2 style="color: #4ade80;">SECURITY CHECK</h2>
            <p style="color:#888; margin-bottom:15px; font-size:0.8rem;">자산 보호를 위해 세션 접속을 승인하십시오.</p>
            <button onclick="approveSecurity()" style="background: #4ade80; color: #000; border: none; padding: 12px; width: 100%; font-weight: bold; cursor:pointer;">접속 승인</button>
        </div>
    </div>

    <script>
    let lastStatus = null; let bgmReady = false; let selectedTargetId = null;
    let accAmount = 0; let currentIdx = 0; let gameStartAlerted = false;

    // [보안/통신] 비밀 통신 발송 함수 보완
    function sendSecretMsg() {
        const receiver = document.getElementById('msg_receiver').value;
        const content = document.getElementById('msg_content').value;
        
        if(!receiver || !content) { 
            alert("수신 대상 VIP와 내용을 모두 입력해 주십시오."); 
            return; 
        }

        fetch('/api/send_msg', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiver_id: receiver, content: content })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert("🔱 제국 보안 서버를 통해 암호문이 전달되었습니다.");
                document.getElementById('msg_content').value = ""; 
                location.reload(); // 메시지 보낸 후 내역 갱신
            } else { 
                alert("⚠️ 전송 실패: " + data.msg); 
            }
        })
        .catch(err => {
            alert("📡 통신망 교란이 발생했습니다.");
        });
    }

    async function writeNfcTag(userId) {
        if ('NDEFReader' in window) {
            try {
                const ndef = new NDEFReader();
                const nfcUrl = window.location.origin + "/nfc/" + userId;
                await ndef.write({ records: [{ recordType: "url", data: nfcUrl }] });
                alert("✅ NFC 카드 등록 성공!");
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                alert("❌ NFC 등록 실패: 카드를 밀착해 주세요.");
            }
        } else {
            alert("NFC 미지원 브라우저입니다.");
        }
    }

    const playlist = [
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm1.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm2.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm3.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm4.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm5.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm6.mp3",
        "https://raw.githubusercontent.com/songbeomjun/checkcoin-bgm/main/bgm7.mp3"
    ];

    const bgmPlayer = document.getElementById('gameBGM');
    bgmPlayer.onended = function() { currentIdx = (currentIdx + 1) % playlist.length; playBGM(); };

    function playBGM() {
        if (!bgmReady) return;
        const targetSrc = playlist[currentIdx];
        if (bgmPlayer.src !== targetSrc) { bgmPlayer.src = targetSrc; bgmPlayer.load(); }
        bgmPlayer.play().catch(e => { console.log("BGM Play Error:", e); });
    }

    function stopBGM() {
        bgmReady = false;
        if (bgmPlayer) { bgmPlayer.pause(); bgmPlayer.currentTime = 0; }
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            window.speechSynthesis.speak(utterance);
        }
    }

    function approveSecurity() {
        sessionStorage.setItem('security_approved', 'true');
        document.getElementById('security-modal').style.display = 'none';
        speak("지갑 접속 승인.");
        checkAccountStatus();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('is_new') === "true" || "{{ is_new }}" === "true") {
            setTimeout(() => {
                if (confirm("카드를 전용 열쇠로 등록하시겠습니까?")) {
                    writeNfcTag("{{ u_id }}");
                }
            }, 500);
        }
    }

    function confirmGameStart() {
        document.getElementById('game-start-modal').style.display = 'none';
        bgmReady = true; playBGM();
        checkAccountStatus();
    }

    function checkAccountStatus() {
        if (sessionStorage.getItem('security_approved') !== 'true') return;
        const userId = "{{ u_id }}";
        let roomId = "{{ u_room_id }}";
        const apiUrl = (roomId && roomId !== 'None' && roomId !== '') ? `/api/get_balance/${roomId}/${userId}` : `/api/get_balance/${userId}`;

        fetch(apiUrl).then(res => res.json()).then(data => {
            if (data.success) {
                lastStatus = data;
                const turnText = document.getElementById('turn_status_text');
                const payBtn = document.getElementById('pay_btn');
                const foldBtn = document.getElementById('fold_btn');
                const champBtn = document.getElementById('champ_bet_btn');
                const targetSelector = document.getElementById('champion-target-selector');

                if (data.is_observer) {
                    champBtn.style.display = 'block'; targetSelector.style.display = 'block';
                    turnText.innerText = "🏆 관전 중: 베팅 대상을 선택하세요.";
                    if (data.room_players) {
                        const listContainer = document.getElementById('player-target-list');
                        listContainer.innerHTML = '';
                        data.room_players.forEach(p => {
                            const btn = document.createElement('div');
                            btn.className = `target-btn ${selectedTargetId === p.id ? 'active' : ''}`;
                            btn.innerText = p.name;
                            btn.onclick = () => { selectedTargetId = p.id; checkAccountStatus(); };
                            listContainer.appendChild(btn);
                        });
                    }
                }
                
                if (!data.room_id || data.room_id === 'None') {
                    turnText.innerText = "🏠 로비 대기 중...";
                    payBtn.disabled = true; payBtn.innerText = "🔒 구역 입장 대기";
                } else if (data.is_playing) {
                    if (data.is_my_turn) {
                        turnText.innerText = "🔥 당신의 차례입니다!";
                        payBtn.disabled = false; payBtn.style.background = "#ff416c"; payBtn.innerText = "💸 자금 결정";
                        foldBtn.style.display = "block";
                    } else {
                        turnText.innerText = "⌛ 대기 중...";
                        payBtn.disabled = true; payBtn.style.background = "#222";
                    }
                }
                if (data.pending_win_msg) showVictoryPopup(data.pending_win_msg);
            }
        });
    }

    function addAmount(val) { accAmount += val; document.getElementById('acc_num').innerText = accAmount.toLocaleString(); }
    function resetAmount() { accAmount = 0; document.getElementById('acc_num').innerText = "0"; }
    function executeChampionBet() { /* 기존 로직 유지 */ }
    function requestObserve(roomId, userId) { /* 기존 로직 유지 */ }
    function processTransaction(type, userId) { /* 기존 로직 유지 */ }
    function handleFold(userId) { /* 기존 로직 유지 */ }
    function showVictoryPopup(msg) { document.getElementById('win_msg_content').innerText = msg; document.getElementById('win_popup_overlay').style.display = 'flex'; }
    function closeVictoryPopup() { fetch('/api/user/clear_win_msg', { method: 'POST' }).then(() => location.reload()); }
    
    setInterval(checkAccountStatus, 3000);
    window.onload = function() { if (sessionStorage.getItem('security_approved') === 'true') checkAccountStatus(); };
    </script>
    """





def get_ticker_data():
    """전광판 메시지를 가져오는 함수입니다."""
    return [
        "💰 제국 은행은 24시간 열려있습니다.",
        "🎲 매너 있는 베팅이 품격을 만듭니다.",
        "🚀 오늘도 큰 승리 거두시길 바랍니다!"
    ]


@app.route('/wallet/<user_id>', methods=['GET', 'POST'])
def wallet(user_id):
    # [1] 로그인 세션 및 사용자 확인 (기존 로직 유지)
    if f"auth_{user_id}" not in session:
        return redirect('/')

    user = users_col.find_one({"user_id": user_id})
    if not user: 
        return redirect('/')
    
    # [추가] 신규 가입 유저 여부 확인
    is_new_user = request.args.get('is_new', 'false')

    # [보안/기능 보완] 메시지 수신 대상 리스트 (자기 자신 제외)
    # 기존 other_users 변수를 활용하되, 메시지 선택창에서 쓰기 좋게 가공됨
    other_users = list(users_col.find({"user_id": {"$ne": user_id}}))

    # [신규 추가] 대화 내역 불러오기 (최신순 20개)
    # 해당 유저가 발신자이거나 수신자인 모든 메시지 + 전체공지(ALL) 포함
    user_messages = list(messages_col.find({
        "$or": [
            {"sender_id": user_id},
            {"receiver_id": user_id},
            {"receiver_id": "ALL"}
        ]
    }).sort("timestamp", -1).limit(20))

    # [2] 기본 데이터 준비 (티어 및 대출 - 기존 로직 유지)
    tier = get_tier(user['balance'])
    loan_info = calc_loan_info(user_id) 

    # [3] 유저 상태 및 방 목록 데이터 정의 (기존 로직 유지)
    status = get_user_status(user_id)
    u_role = status['role']
    u_room_id = status['room_id']
    
    rooms_for_render = []
    all_rooms = list(game_room_col.find())
    for r in all_rooms:
        rooms_for_render.append({
            "room_id": str(r.get('_id')),
            "room_name": r.get('room_name', '대전 구역'),
            "player_count": len(r.get('players', [])),
            "spectator_count": len(r.get('spectators', [])),
            "room_pot": format(r.get('pot', 0), ',')
        })

    room = None
    opponent_name = "대기 중"
    is_playing = False
    is_my_turn = False
    is_betting_active = False

    # [4] 유저가 특정 방에 들어가 있다면 상세 정보 업데이트 (기존 로직 유지)
    if u_room_id:
        room = game_room_col.find_one({"_id": u_room_id})
        if room:
            if u_role == 'player' or u_room_id:
                is_playing = True
            
            players = room.get('players', [])
            for p in players:
                if p['user_id'] != user_id:
                    opponent_name = p['name']
            
            t_idx = room.get('turn_index', 0)
            if players and 0 <= t_idx < len(players):
                is_my_turn = (players[t_idx]['user_id'] == user_id)
            
            is_betting_active = (u_role == 'spectator' and len(room.get('spectators', [])) >= 2)

    # [5] 마지막 리턴 (렌더링)
    # 보완 포인트: user_messages(대화내역)와 u_id를 추가로 전달하여 UI에서 매칭되게 함
    return render_template_string(MASTER_UI_TEMPLATE, content=render_template_string(
           wallet_inner_html, 
           u_id=user_id,
           u_name=user['name'],
           u_title=user.get('title'),
           u_bal_int=int(user.get('balance', 0)),
           f_bal=format(int(user.get('balance', 0)), ','),
           f_money=f_money, 
           t_name=tier['name'],
           t_color=tier['color'],
           l_active=loan_info.get('is_active', False),
           u_role=u_role,
           u_room_id=u_room_id,
           
           is_new=is_new_user, 
           
           rooms=rooms_for_render,
           all_rooms_info=rooms_for_render,
           
           is_betting_active=is_betting_active,
           is_playing=is_playing, 
           is_my_turn=is_my_turn, 
           is_folded=(user_id in room.get('folded_users', [])) if room else False,
           room=room,
           opponent_name=opponent_name,
           spectators=len(room.get('spectators', [])) if room else 0,

           other_users=other_users,
           messages=user_messages,  # [핵심 보완] 대화 내역 전달
           ticker_data=get_ticker_data()
    ))

    

# ==============================================================================
# [SECTION 6] 백엔드 금융 시스템 로직 (Backend Finance Logic)
# ==============================================================================
@app.route('/action/req_observe/<room_id>/<user_id>')
def req_observe(room_id, user_id):
    # [1] 유저 확인 (사장님 기존 로직 유지)
    user = users_col.find_one({"user_id": user_id})
    if not user:
        return jsonify({"success": False, "message": "유저 정보를 찾을 수 없습니다."})

    # [2] 방 이름 찾기 (ID가 '1'이어도 에러 나지 않게 처리)
    room_name = f"제 {room_id} 구역" # 기본값 설정
    try:
        # ID가 24자리라면 MongoDB 고유 ID로 조회, 아니면 일반 문자열로 조회
        query = {"_id": ObjectId(room_id)} if len(str(room_id)) == 24 else {"_id": room_id}
        room = game_room_col.find_one(query)
        if room and room.get('room_name'):
            room_name = room.get('room_name')
    except Exception as e:
        # 에러가 나더라도 중단하지 않고 진행
        print(f"Room Info Lookup Skip: {e}")

    # [3] 관리자 페이지 DB(requests_col)에 데이터 저장
    # 여기가 핵심입니다! 관리자 페이지가 읽어가는 'requests_col'에 정확히 쌓아야 합니다.
    observe_request = {
        "type": "observe",           # 관리자 페이지 필터용
        "user_id": user_id,
        "user_name": user.get('name', '익명'),
        "room_id": room_id,          # 방 번호 (예: 1)
        "room_name": room_name,      # 방 이름
        "status": "pending",         # 승인 대기 상태
        "timestamp": datetime.now()  # 신청 시간
    }
    
    try:
        # 관리자 페이지가 조회하는 컬렉션에 삽입
        requests_col.insert_one(observe_request)
        
        return jsonify({
            "success": True, 
            "message": f"⚔️ [{room_name}] 관전 승인 요청 완료!\n관리자의 승인을 기다려주세요."
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"시스템 오류: {str(e)}"})

@app.route('/action/place_bet', methods=['POST'])
def place_bet():
    if 'user_id' not in session: 
        return jsonify({"success": False, "message": "세션이 만료되었습니다. 다시 로그인해주세요."})
    
    user_id = session.get('user_id')
    # 지갑 스크립트에서 보낼 데이터: target_id(누구에게), amount(얼마를)
    target_id = request.form.get('target_id')
    try:
        amount = int(request.form.get('amount', 0))
    except ValueError:
        return jsonify({"success": False, "message": "금액 형식이 올바르지 않습니다."})
    
    user = users_col.find_one({"user_id": user_id})
    if not user:
        return jsonify({"success": False, "message": "존재하지 않는 유저입니다."})
    
    # 1. 제국 신규 헌법: 최대 1억 제한
    if amount > 10000: # 단위가 '만'원일 경우 10,000 = 1억
        return jsonify({"success": False, "message": "챔피언 베팅은 최대 1억 원까지만 가능합니다."})
    if amount <= 0:
        return jsonify({"success": False, "message": "베팅 금액을 설정해주세요."})

    # 2. 잔액 검증
    if user['balance'] < amount:
        return jsonify({"success": False, "message": "잔액이 부족합니다. 제국 은행에서 충전하십시오."})
    
    # 3. 중복 베팅 방지 (방 번호는 현재 room_01 고정)
    if bet_col.find_one({"sender_id": user_id, "room_id": "room_01"}):
        return jsonify({"success": False, "message": "이미 이 구역에 베팅을 완료하셨습니다."})

    # 4. [중요] 돈 차감 및 DB 기록
    # 나중에 정산(settle_game)할 때 이 기록을 기준으로 75/15/10을 나눕니다.
    users_col.update_one({"user_id": user_id}, {"$inc": {"balance": -amount}})
    bet_col.insert_one({
        "sender_id": user_id,
        "target_id": target_id,
        "amount": amount,
        "room_id": "room_01",
        "timestamp": datetime.now() # 기록 시간 추가
    })
    
    return jsonify({
        "success": True, 
        "message": f"🏆 챔피언 베팅 완료!\n대상: {target_id} 님\n금액: {amount}만 원"
    })



@app.route('/action/loan', methods=['POST'])
def action_loan():
    """사용자의 대출 요청을 처리하고 전광판에 알립니다."""
    u_id = request.form.get('user_id')
    amount = float(request.form.get('amount', 0))
    
    user = users_col.find_one({"user_id": u_id})
    if not user: return redirect('/')
    
    # 등급별 대출 한도 검증
    loan_data = calc_loan_info(user)
    tier_info = get_tier(user['balance'] - loan_data['pri'])
    
    if amount <= 0:
        return "<script>alert('정상적인 금액을 입력하세요.'); history.back();</script>"
    
    if amount > tier_info['limit']:
        return f"<script>alert('현재 {tier_info['name']} 등급의 대출 한도는 {tier_info['txt']}입니다.'); history.back();</script>"
    
    if user.get('loan_status', {}).get('principal', 0) > 0:
        return "<script>alert('이미 진행 중인 대출이 있습니다. 상환 후 다시 신청하세요.'); history.back();</script>"

    # 1. 유저 데이터 업데이트
    users_col.update_one({"user_id": u_id}, {
        "$inc": {"balance": amount},
        "$set": {"loan_status": {"principal": amount, "start_date": datetime.now()}}
    })
    
    # 2. 중앙은행 데이터 업데이트 (자산 유출 기록)
    bank_col.update_one({"_id": BANK_ID}, {
        "$inc": {"total_asset": -amount, "total_loaned": amount}
    })
    
    # 3. 전광판 공지
    add_ticker(f"🏦 [LOAN] {user['name']} VIP님께서 {f_money(amount)} 대출을 승인받았습니다. 건전한 상환을 기원합니다.")
    
    return redirect(url_for('wallet', user_id=u_id))

from bson.objectid import ObjectId  # 파일 상단에 이 임포트가 있는지 꼭 확인하세요!

@app.route('/admin/set_turn/<room_id>/<int:index>')
def admin_set_turn(room_id, index):
    """관리자가 강제로 몇 번째 사람(0, 1, 2...)의 턴인지 지정합니다."""
    # 1. 관리자 권한 체크
    if not session.get('is_admin'): 
        return redirect('/admin/gate')
    
    try:
        # [해결의 열쇠] DB 조회 시 room_id를 문자열로 강제 변환
        target_id = str(room_id)
        
        # 턴 인덱스 업데이트 수행
        result = game_room_col.update_one(
            {"_id": target_id}, 
            {"$set": {"turn_index": index}}
        )

        # 만약 업데이트된 게 없다면 (매칭 실패 시) 보험용 로직 실행
        if result.matched_count == 0:
            from bson.objectid import ObjectId
            try:
                # ObjectId로 한 번 더 시도
                game_room_col.update_one({"_id": ObjectId(room_id)}, {"$set": {"turn_index": index}})
            except:
                pass

        # 2. [수정] 성공 후 해당 방의 제어 페이지로 복귀 (매우 중요)
        # 사장님의 게임 제어 페이지 주소 형식인 /admin/game?room_id=... 로 맞췄습니다.
        return redirect(f'/admin/game?room_id={target_id}')

    except Exception as e:
        # 에러 내용을 터미널 창에 정확히 출력
        print(f"!!! 턴 변경 에러 발생 !!! : {e}")
        return f"서버 내부 오류: {e}. DB의 ID 형식을 확인하세요.", 500

@app.route('/action/repay/<user_id>')
def action_repay(user_id):
    """대출 원금 및 이자를 상환합니다."""
    user = users_col.find_one({"user_id": user_id})
    if not user: return redirect('/')
    
    loan_info = calc_loan_info(user)
    if not loan_info['active']:
        return "<script>alert('상환할 대출 내역이 없습니다.'); history.back();</script>"
    
    if user['balance'] < loan_info['total']:
        return "<script>alert('지갑의 잔액이 부족하여 상환할 수 없습니다. 충전 후 다시 시도하세요.'); history.back();</script>"

    # 1. 유저 잔액 차감 및 대출 상태 리셋
    users_col.update_one({"user_id": user_id}, {
        "$inc": {"balance": -loan_info['total']},
        "$set": {"loan_status": {"principal": 0, "start_date": None}}
    })
    
    # 2. 중앙은행 자산 회수 및 이자 수익 기록
    bank_col.update_one({"_id": BANK_ID}, {
        "$inc": {
            "total_asset": loan_info['total'], 
            "total_loaned": -loan_info['pri'],
            "profit": loan_info['int']
        }
    })
    
    # 3. 전광판 공지
    add_ticker(f"✅ [REPAY] {user['name']}님께서 대출금 {f_money(loan_info['total'])}원을 전액 상환하였습니다.")
    
    return redirect(url_for('wallet', user_id=user_id))

@app.route('/action/pay/<user_id>')
def action_pay(user_id):
    """사용자가 금액을 지불(게임 베팅)하고 관리자가 정한 순서대로 다음 턴으로 넘깁니다."""
    amt_raw = request.args.get('amt', 0)
    try:
        amt = float(amt_raw)
    except:
        amt = 0
        
    user = users_col.find_one({"user_id": user_id})
    if not user: return redirect('/')
    
    if user['balance'] < amt:
        return "<script>alert('잔액이 부족합니다.'); history.back();</script>"
    
    # [1] 유저가 속한 방을 찾습니다. (room_id 필드가 있다면 더 정확합니다)
    room = game_room_col.find_one({"players.user_id": user_id})
    
    # 1. 유저 잔액 차감
    users_col.update_one({"user_id": user_id}, {"$inc": {"balance": -amt}})
    
    if room:
        room_id = room['_id']
        # 관리자가 정한 순서 리스트를 가져옵니다.
        participants = room.get('participants', []) 
        folded_users = room.get('folded_users', [])
        
        if participants:
            # 2. 다음 배팅 가능한 사람 찾기 (포기자 제외 로직)
            current_idx = room.get('turn_index', 0)
            next_idx = current_idx
            
            # 최대 참여자 수만큼 돌면서 FOLD 하지 않은 다음 사람을 찾습니다.
            for _ in range(len(participants)):
                next_idx = (next_idx + 1) % len(participants)
                if participants[next_idx] not in folded_users:
                    break # 살아있는 유저를 찾으면 정지
            
            # 방 정보 업데이트 (판돈 증가 + 다음 턴 인덱스 설정)
            game_room_col.update_one({"_id": room_id}, {
                "$inc": {"pot": amt},
                "$set": {"turn_index": next_idx}
            })
            
            # 3. 전광판 공지 (기존 기능 유지 및 보강)
            new_pot = (room.get('pot', 0) or 0) + amt
            add_ticker(f"🎲 [BET] {user['name']}님 {f_money(amt)} 베팅! 총 판돈: {f_money(new_pot)}")
        else:
            # 관리자가 아직 순서를 정하지 않은 초기 상태일 때
            game_room_col.update_one({"_id": room_id}, {"$inc": {"pot": amt}})
            add_ticker(f"💸 [PAY] {user['name']}님께서 {f_money(amt)}원을 지불하셨습니다.")
    else:
        # 방에 속해있지 않은 유저의 일반 지불
        add_ticker(f"💸 [PAY] {user['name']}님께서 {f_money(amt)}원을 지불하셨습니다.")

    # [수정] 자바스크립트 alert 후 이동하여 유저가 지불 성공을 인지하게 합니다.
    return f"<script>alert('{f_money(amt)} 베팅 완료!'); location.href='/wallet/{user_id}';</script>"

@app.route('/action/req_charge/<user_id>')
def action_req_charge(user_id):
    """
    유저의 충전 요청을 기록합니다.
    계좌 동결(is_frozen) 상태와 상관없이 '입금'은 언제나 가능하도록 설계되었습니다.
    """
    # 1. 금액 및 유저 식별
    try:
        amt = float(request.args.get('amt', 0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "올바른 금액 형식이 아닙니다."})

    # 2. 유저 정보 조회
    user = users_col.find_one({"user_id": user_id})
    
    if not user:
        return jsonify({"status": "error", "message": "존재하지 않는 VIP 계정입니다."})

    # 3. 보안 세션 체크 (최소한의 본인 확인)
    if f"auth_{user_id}" not in session:
        return jsonify({"status": "error", "message": "보안 인증이 필요합니다."})

    # [핵심] 여기서 'is_frozen' 체크를 하지 않습니다. 
    # 덕분에 계좌가 얼어붙은 VIP도 '충전'을 통해 자금을 확보하고 빚을 갚을 수 있습니다.

    # 4. 승인 대기열(requests_col)에 기록
    request_doc = {
        "user_id": user_id,
        "name": user['name'],
        "amount": amt,
        "status": "PENDING", # 관리자 승인 대기 상태
        "created_at": datetime.now(),
        "type": "CHARGE"
    }
    requests_col.insert_one(request_doc)

    # 5. 전광판 알림 (선택 사항: 사장님이 원하시면 활성화)
    # add_ticker(f"💳 [입금 요청] {mask_name(user['name'])} 님께서 자금 충전을 요청하셨습니다.")

    return jsonify({
        "status": "success", 
        "message": f"{amt}만 원 충전 요청이 중앙은행으로 전달되었습니다."
    })

# ==============================================================================
# [SECTION 7] 관리자 제국 통제 센터 (Admin Control Panel)
# ==============================================================================

@app.route('/admin/approve_charge/<request_id>')
def approve_charge(request_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    # 1. 요청 데이터 가져오기 (ObjectId 처리 필수)
    req = requests_col.find_one({"_id": ObjectId(request_id)})
    if not req or req['status'] != 'PENDING':
        return "이미 처리되었거나 존재하지 않는 요청입니다."

    user_id = req['user_id']
    amount = req['amount']

    # 2. [중요] 은행 잔고 확인 (기존 로직 유지)
    bank = db.settings.find_one({"key": "central_bank"}) 
    if not bank or bank['balance'] < amount:
        return "중앙은행의 자금이 부족합니다!"

    # 3. 사용자 잔액 충전 & 은행 잔고 차감 (기존 로직 유지)
    users_col.update_one({"user_id": user_id}, {"$inc": {"balance": amount}})
    db.settings.update_one({"key": "central_bank"}, {"$inc": {"balance": -amount}})

    # 4. 요청 상태 완료로 변경 (SUCCESS로 유지)
    requests_col.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "SUCCESS"}})
    
    # 5. 전광판 공지 (사장님 옵션 유지)
    try:
        add_ticker(f"💰 [중앙은행] {req['user_name']} VIP님의 자금 충전이 승인되었습니다.")
    except:
        pass

    # [수정] 현재 사용 중인 관리자 페이지 주소로 리다이렉트
    return redirect('/admin/dash')


@app.route('/admin/spy_messages')
def admin_spy_messages():
    if not session.get('is_admin'): return "권한 없음", 403
    
    # 모든 메시지 최신순 정렬
    all_msgs = list(messages_col.find().sort("timestamp", -1))
    
    spy_content = """
    <div class='viewport' style='max-width:600px;'>
        <h2 style='color:var(--gold); text-align:center; letter-spacing:3px;'>🕵️ MASTER INTERCEPT CENTER</h2>
        <p style='color:#555; text-align:center; font-size:0.8rem; margin-bottom:30px;'>모든 기밀 교신을 실시간으로 감시합니다.</p>
    """

    for m in all_msgs:
        t = m['timestamp'].strftime('%m/%d %H:%M')
        sender = users_col.find_one({"user_id": m['sender_id']})
        receiver = users_col.find_one({"user_id": m['receiver_id']})
        
        # 이름 매칭 (없을 경우 퇴장회원)
        s_name = sender['name'] if sender else m['sender_id']
        r_name = receiver['name'] if receiver else m['receiver_id']

        # [문제 해결] 1. 한글 깨짐 방지 & 2. 반복되던 승자 선언 섹션 제거
        spy_content += f"""
        <div class="premium-card" style="padding:15px; margin-bottom:15px; border:1px solid rgba(212,175,55,0.2); background:rgba(10,10,10,0.8);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:var(--gold); font-weight:bold; font-size:1rem;">{s_name} ▶ {r_name}</span>
                <a href="/admin/del_msg/{m['_id']}" 
                   onclick="return confirm('이 기밀 기록을 영구 파기하시겠습니까?')"
                   style="color:var(--accent-red); text-decoration:none; font-weight:bold; font-size:0.8rem; border:1px solid var(--accent-red); padding:2px 8px; border-radius:5px;">삭제</a>
            </div>
            <div style="color:#eee; line-height:1.6; font-size:0.95rem; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">
                {m['content']}
            </div>
            <div style="text-align:right; color:#444; font-size:0.7rem; margin-top:8px;">
                Intercepted at {t}
            </div>
        </div>
        """

    # 하단 버튼부 (승자 선언 없이 기록 파기 및 복귀 기능 유지)
    spy_content += """
        <div style="margin-top:20px; display:flex; gap:10px;">
            <a href='/admin/clear_all_msg' onclick="return confirm('모든 메시지 기록을 초기화하시겠습니까?')" class='m-btn btn-red' style='height:50px; flex:1; font-size:0.9rem; text-decoration:none; display:flex; align-items:center; justify-content:center;'>기록 일괄 파기</a>
            <a href='/admin/dash' class='m-btn btn-dark' style='height:50px; flex:1; text-decoration:none; display:flex; align-items:center; justify-content:center;'>통제 센터 복귀</a>
        </div>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=spy_content)


@app.route('/admin/del_msg/<mid>')
def admin_del_msg(mid):
    """특정 메시지 단건 삭제"""
    if not session.get('is_admin'): return redirect('/admin/gate')
    messages_col.delete_one({"_id": ObjectId(mid)})
    return redirect('/admin/spy_messages')

@app.route('/admin/clear_all_msg')
def admin_clear_all_msg():
    """모든 메시지 기록 삭제"""
    if not session.get('is_admin'): return redirect('/admin/gate')
    messages_col.delete_many({})
    return redirect('/admin/spy_messages')


@app.route('/admin/gate', methods=['GET', 'POST'])
def admin_gate():
    """관리자 전용 로그인 화면 (1차 보안 분리 + 기존 기능 100% 보존)"""
    
    # [수정] 관리자 전용 1차 인증 세션(admin_list_auth)을 별도로 체크합니다.
    # 이렇게 해야 '기존 회원 목록' 인증과 '관리자' 인증이 따로 노옵니다.
    if not session.get('admin_list_auth'):
        return """
        <script>
            alert('관리자 전용 1차 보안 인증이 필요합니다.');
            location.href = '/admin_login_list'; 
        </script>
        """

    # 1. 이미 로그인된 상태라면 바로 대시보드로 보냄 (기존 기능 유지)
    if session.get('is_admin'):
        return redirect('/admin/dash')

    if request.method == 'POST':
        aid = request.form.get('admin_id')
        apw = request.form.get('admin_pw')
        
        # 관리자 체크 로직
        if aid == ADMIN_ID and apw == ADMIN_PW:
            # [수정] session.clear()는 1차 인증 기록까지 지우므로 사용하지 않습니다.
            # 대신 필요한 관리자 정보만 덮어씌웁니다.
            session['is_admin'] = True
            session['user_id'] = 'admin' # 관리자 식별자 주입
            session.permanent = False    # 브라우저 종료 시 로그아웃
            logger.info(f"마스터 접속 성공: {aid}")
            return redirect('/admin/dash')
        else:
            logger.warning(f"접속 실패 시도: {aid}")
            flash("관리자 자격 증명이 올바르지 않습니다.")
            return redirect('/admin/gate')

    # 2. GET 요청 시 보여줄 화면
    admin_login_html = """
    <div class="viewport">
        <div class="premium-card" style="margin-top:50px; border:2px solid var(--gold);">
            <h2 style="text-align:center; color:var(--gold); letter-spacing:5px;">MASTER GATE</h2>
            <p style="text-align:center; color:#555; font-size:0.8rem;">운영자 전용 보안 통로입니다.</p>
            
            <form method="post" style="margin-top:30px;">
                <input type="text" name="admin_id" placeholder="MASTER ID" required style="margin-bottom:15px; width:100%; padding:12px; background:#000; color:#fff; border:1px solid #333; border-radius:10px;">
                <input type="password" name="admin_pw" placeholder="MASTER PASSWORD" required style="width:100%; padding:12px; background:#000; color:#fff; border:1px solid #333; border-radius:10px;">
                <button class="m-btn btn-gold" style="margin-top:20px; width:100%; height:55px; font-weight:bold;">시스템 승인</button>
            </form>
            
            <div style="text-align:center; margin-top:20px;">
                <a href="/" style="color:#444; text-decoration:none; font-size:0.8rem;">[ 메인으로 돌아가기 ]</a>
            </div>
        </div>

        <div style="margin-top: 50px; padding-bottom: 30px; text-align: center;">
            <p style="color: #555; font-size: 0.65rem; letter-spacing: 3px; font-family: 'Arial', sans-serif; text-transform: uppercase; opacity: 0.6;">
                PRODUCED BY 01&17
            </p>
        </div>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=admin_login_html)

# --- [반드시 추가해야 할 관리자 전용 검문소 함수] ---
@app.route('/admin_login_list', methods=['GET', 'POST'])
def admin_login_list():
    # [보완] 일반 비번(LIST_PASSWORD)이 아닌 관리자 전용 비번 환경변수를 읽어옵니다.
    # 환경변수 설정 전까지는 기본값 'admin1234'로 작동합니다.
    ADMIN_SET_PW = os.environ.get("ADMIN_LIST_PASSWORD", "admin1234")
    
    # [보완] 뒤로가기 대응: 관리자 암호 입력창(GET)에 접속하는 순간 기존 인증 세션을 즉시 파기합니다.
    if request.method == 'GET':
        if not session.get('admin_list_auth'):
          session['admin_list_auth'] = False

    if request.method == 'POST':
        # 입력한 비번이 관리자 전용 1차 비번과 맞는지 확인
        if request.form.get('pw') == ADMIN_SET_PW:
            session['admin_list_auth'] = True # 관리자용 별도 열쇠 지급!
            return redirect('/admin/gate')
        else:
            return "<script>alert('인가되지 않은 접근입니다.'); history.back();</script>"

    # 1차 암호창 HTML (정답 가이드 삭제 및 문구 수정)
    gate_html = """
    <div style="max-width:400px; margin:100px auto; padding:30px; background:#1a1a1a; border-radius:20px; text-align:center; border:1px solid #333;">
        <h2 style="color:#ffd700; letter-spacing:2px; margin-bottom:10px;">ADMIN ACCESS</h2>
        <p style="color:#888; font-size:0.9rem; margin-bottom:30px;">인가된 운영자 전용 보안 구역입니다.</p>
        
        <form method="POST">
            <input type="password" name="pw" placeholder="보안 코드를 입력하세요" required
                   style="width:100%; padding:15px; background:#222; border:1px solid #444; color:#fff; border-radius:10px; margin-bottom:20px; text-align:center; font-size:1.2rem;">
            <button type="submit" style="width:100%; padding:15px; background:#ffd700; color:#000; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">VERIFY AUTHENTICITY</button>
        </form>
        
        <div style="margin-top:30px;">
            <a href="/" style="color:#444; text-decoration:none; font-size:0.8rem;">[ EXIT SYSTEM ]</a>
        </div>
    </div>
    """
    return render_template_string(MASTER_UI_TEMPLATE, content=gate_html)
    
@app.route('/admin/set_title/<user_id>', methods=['POST'])
def admin_set_title(user_id):
    """관리자 대시보드에서 VIP 칭호를 변경하는 로직"""
    # 1. 관리자 권한 체크 (보안)
    if not session.get('is_admin'):
        return redirect('/admin/gate')

    # 2. HTML에서 선택한 새로운 칭호 가져오기
    # <select name="new_title"> 이므로 'new_title'로 가져옵니다.
    new_title = request.form.get('new_title')

    # 3. 데이터베이스 업데이트
    # users_col은 사장님이 사용하시는 유저 컬렉션 변수명입니다.
    users_col.update_one(
        {"user_id": user_id}, 
        {"$set": {"title": new_title}}
    )

    # 4. 완료 후 다시 대시보드로 돌아가기
    # 뒤로가기보다는 대시보드를 새로고침하는게 정확합니다.
    return redirect('/admin/dash')


@app.route('/admin/dash')
def admin_dash():
    """중앙은행 자산 관리 대시보드 (순서 제어판 제거, 국고 모니터링 강화 버전)"""
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    # 1. 국고 및 유저 자산 계산 (사장님 원본 로직 완벽 유지)
    raw_users = list(users_col.find().sort("balance", -1))
    total_user_balance = sum(u.get('balance', 0) for u in raw_users)
    
    # [보완] 중앙은행 설정 데이터 로드
    bank_data = db.settings.find_one({"key": "central_bank"})
    accumulated_fees = bank_data.get('accumulated_fees', 0) if bank_data else 0
    
    # 제국 총 예산(333만) - 유저 보유 총액 + 누적 수수료 = 현재 국고 잔액
    empire_treasury = 3330000 - total_user_balance + accumulated_fees
    
    # [핵심 보완] 입금 요청과 관전 요청을 모두 불러오도록 수정
    # status가 대문자 'PENDING'이든 소문자 'pending'이든 모두 가져오며, 
    # 기존 충전 요청뿐만 아니라 'observe' 타입도 포함합니다.
    pending_reqs = list(requests_col.find({
        "status": {"$in": ["PENDING", "pending"]}
    }).sort("created_at", -1))
    
    all_users = []
    for u in raw_users:
        loan_info = calc_loan_info(u) # 기존 대출 계산 함수
        net_bal = u.get('balance', 0) - loan_info.get('pri', 0)
        tier = get_tier(net_bal)      # 기존 티어 계산 함수
        u['tier_name'] = tier['name']
        u['tier_color'] = tier['color']
        u['title'] = u.get('title', '')
        all_users.append(u)

    # 2. HTML 템플릿 (관전 요청 UI 보완 및 원본 유지)
    admin_inner_html = """
    <style>
        .card-treasury-admin { 
            background: linear-gradient(135deg, #0f172a, #1e293b); 
            border: 2px solid #94a3b8; border-radius: 25px; padding: 25px;
            position: relative; overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin-bottom: 35px;
        }
        .card-treasury-admin::before {
            content: ''; position: absolute; top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: linear-gradient(45deg, transparent, rgba(148,163,184,0.1), transparent);
            transform: rotate(30deg); animation: shine-admin 8s infinite linear;
        }
        @keyframes shine-admin {
            0% { transform: translateX(-100%) rotate(30deg); }
            100% { transform: translateX(100%) rotate(30deg); }
        }
        .admin-badge {
            display: inline-block; font-size: 0.7rem; font-weight: 900; padding: 4px 14px;
            border-radius: 50px; background: #94a3b8; color: #0f172a; letter-spacing: 1px;
        }
        .fee-badge {
            font-size: 0.75rem; background: rgba(74, 222, 128, 0.2); color: #4ade80;
            padding: 2px 8px; border-radius: 5px; border: 1px solid #4ade80; margin-top: 10px; display: inline-block;
        }
        .pulse-dot {
            height: 8px; width: 8px; background-color: #4ade80; border-radius: 50%; display: inline-block;
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
    </style>

    <div class="viewport" style="max-width:800px; margin: 0 auto; padding: 20px;">
        <h2 style="letter-spacing:6px; font-weight:900; margin-bottom:30px; text-align:center; color:#fff;">CENTRAL BANK MASTER</h2>
        
        <div class="card-treasury-admin">
            <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                <div style="letter-spacing:4px; font-weight:900; font-size:0.85rem; color: #cbd5e1;">EMPIRE TREASURY</div>
                <div class="admin-badge">GOVERNOR</div>
            </div>
            
            <div style="margin: 25px 0;">
                <div style="font-size: 0.65rem; opacity: 0.8; margin-bottom: 5px; color: #94a3b8; letter-spacing: 2px;">TOTAL RESERVE ASSETS</div>
                <div style="font-size: 3rem; font-weight: 900; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.3);">
                    {{ f_money(empire_treasury) }}
                </div>
                <div class="fee-badge">📈 누적 게임 수수료 수익: {{ f_money(accumulated_fees) }}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-weight: bold; font-size: 1.1rem; color: #f8fafc;">제국 중앙 국고 관리</div>
                <div style="font-family: 'Courier New', monospace; font-size: 0.7rem; opacity: 0.4; color:#fff;">SYSTEM_STATUS_STABLE</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1.5fr 1fr 1fr; gap:12px; margin-bottom:35px;">
            <a href="/admin/spy_messages" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e11d48, #9f1239); color:white; height:100px; text-decoration:none; border-radius:20px; font-weight:900; border: 1px solid #fb7185;">
                <span style="font-size:1.5rem;">🕵️</span> 도청 센터
            </a>
            <a href="/admin/game" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#111; color:#ffd700; border:1px solid #ffd700; text-decoration:none; border-radius:20px; font-weight:bold;">
                <span style="font-size:1.5rem;">🎰</span> 게임 관리 센터
            </a>
            <a href="/" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#111; color:#fff; border:1px solid #333; text-decoration:none; border-radius:20px; font-weight:bold;">
                <span style="font-size:1.5rem;">🏠</span> 관리자 로비로 돌아가기
            </a>
        </div>

        {% if pending_reqs %}
        <div style="margin-bottom:30px;">
            <h3 style="color:#4ade80; font-size:1rem; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                <span class="pulse-dot"></span> 미결 승인 요청 내역
            </h3>
            <div style="background:rgba(0,0,0,0.3); border:1px solid #4ade80; border-radius:20px; overflow:hidden;">
                {% for req in pending_reqs %}
                <div style="display:flex; justify-content:space-between; align-items:center; padding:18px; border-bottom:1px solid #222;">
                    <div>
                        <b style="color:#fff; font-size:1rem;">{{ req.user_name }}</b>
                        {% if req.type == 'observe' %}
                            <span style="background:#ff416c; color:#fff; font-size:0.6rem; padding:2px 6px; border-radius:4px; margin-left:5px;">관전 신청</span>
                            <br><span style="color:#888; font-size:0.85rem;">요청 구역: {{ req.room_name }}</span>
                        {% else %}
                            <span style="background:#ffd700; color:#000; font-size:0.6rem; padding:2px 6px; border-radius:4px; margin-left:5px;">충전 요청</span>
                            <br><span style="color:#ffd700; font-size:0.85rem;">요청액: {{ f_money(req.amount) }}</span>
                        {% endif %}
                    </div>
                    <div style="display:flex; gap:8px;">
                        {% if req.type == 'observe' %}
                            <a href="/admin/approve_observe/{{ req._id }}" style="padding:10px 18px; background:#4ade80; color:#000; text-decoration:none; border-radius:10px; font-weight:bold; font-size:0.8rem;">입장 승인</a>
                        {% else %}
                            <a href="/admin/approve_charge/{{ req._id }}" style="padding:10px 18px; background:#ffd700; color:#000; text-decoration:none; border-radius:10px; font-weight:bold; font-size:0.8rem;">승인</a>
                        {% endif %}
                        <a href="/admin/reject_request/{{ req._id }}" style="padding:10px 18px; background:#333; color:#fff; text-decoration:none; border-radius:10px; font-size:0.8rem;">거절</a>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
        {% endif %}

        <h3 style="margin-bottom:15px; color:#ffd700; font-size:1rem;">👥 VIP 고객 관리 리스트</h3>
        <div style="background:rgba(0,0,0,0.3); border:1px solid #333; border-radius:20px; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.05); color:#94a3b8; border-bottom:1px solid #333;">
                        <th style="padding:15px; text-align:left;">고객 정보</th>
                        <th style="padding:15px; text-align:center;">칭호 부여</th>
                        <th style="padding:15px; text-align:right;">현재 잔액</th>
                        <th style="padding:15px; text-align:center;">추방</th>
                    </tr>
                </thead>
                <tbody>
                    {% for u in all_users %}
                    <tr style="border-bottom:1px solid #222;">
                        <td style="padding:15px;">
                            <div style="color:#fff; font-weight:bold;">{{u.name}}</div>
                            <span style="display:inline-block; margin-top:4px; padding:2px 8px; border-radius:4px; background:{{u.tier_color}}; font-size:0.6rem; color:#fff; font-weight:900;">{{u.tier_name}}</span>
                        </td>
                        <td style="padding:15px; text-align:center;">
                            <form action="/admin/set_title/{{ u.user_id }}" method="POST" style="margin:0;">
                                <select name="new_title" onchange="this.form.submit()" style="padding:6px; background:#000; color:gold; border:1px solid gold; border-radius:8px; font-size:0.75rem;">
                                    <option value="">(칭호 없음)</option>
                                    {% for t in titles_list %}
                                        <option value="{{ t }}" {% if u.title == t %}selected{% endif %}>{{ t }}</option>
                                    {% endfor %}
                                </select>
                            </form>
                        </td>
                        <td style="padding:15px; text-align:right; color:#ffd700; font-weight:bold;">{{f_money(u.balance)}}</td>
                        <td style="padding:15px; text-align:center;">
                            <a href="/admin/user_del/{{u.user_id}}" style="color:#ff416c; text-decoration:none; font-size:1.1rem;" onclick="return confirm('추방 시 유저의 자산은 즉시 국고로 귀속됩니다.')">🗑️</a>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        
        <script>
            setTimeout(function(){ location.reload(); }, 15000);
        </script>
    </div>
    """

    return render_template_string(MASTER_UI_TEMPLATE, 
        content=render_template_string(admin_inner_html, 
            empire_treasury=empire_treasury, 
            accumulated_fees=accumulated_fees,
            pending_reqs=pending_reqs, 
            all_users=all_users, 
            f_money=f_money, 
            titles_list=TITLES
        ),
        is_admin=True
    )




@app.route('/api/admin/game_control/<room_id>/stop', methods=['POST'])
def admin_stop_game(room_id):
    """관리자의 강제 종료 - 모든 관전 권한도 함께 회수"""
    terminate_game(room_id)
    # [보완] 강제 종료 시 전광판 알림 추가
    add_ticker(f"⚠️ [시스템] 관리자가 구역({room_id})을 강제 폐쇄하였습니다.")
    return jsonify({"success": True, "message": "관리자가 게임을 강제 종료했습니다."})

# --- [조건 2: 폴드로 인한 자동 종료 및 상태 초기화] ---
def check_fold_victory(room_id):
    """생존자 체크 후 자동 승리 처리"""
    # [보안] 단순히 room_id만 체크하면 관전자(is_observer)까지 합산될 수 있어 
    # 실제 게임 중인(is_playing: True) 선수들만 정확히 필터링합니다.
    active_users = list(users_col.find({
        "room_id": room_id, 
        "is_folded": False, 
        "is_playing": True  # 실제 게임 중인 유저만 필터링 (사장님 로직 유지)
    }))
    
    if len(active_users) <= 1:
        if len(active_users) == 1:
            winner = active_users[0]
            # 승자에게 팝업 메시지 전송
            users_col.update_one(
                {"user_id": winner['user_id']}, 
                {"$set": {"pending_win_msg": "모든 경쟁자가 포기하여 최종 승리하셨습니다!"}}
            )
            # 승리 소식 전파
            add_ticker(f"🏆 [최종 승리] {winner.get('name')} 님이 구역을 평정하셨습니다!")
        
        # [핵심] 게임 종료 처리 (관전 권한 회수 포함)
        terminate_game(room_id) 
        return True
    return False

def terminate_game(room_id):
    """게임 종료 시 해당 방의 모든 유저 상태 초기화 (핵심 함수)"""
    # 1. 유저 상태 초기화 (사장님 원본 로직: 플레이어 + 관전자 모두 로비로)
    # 이 쿼리는 해당 방(room_id)에 발을 담근 모든 사람의 권한을 회수합니다.
    users_col.update_many(
        {"$or": [{"room_id": room_id}, {"observe_room": room_id}]}, # 플레이어와 관전자 모두 타겟팅
        {
            "$set": {
                "room_id": None,        # 방 퇴장
                "is_playing": False,    # 플레이 종료
                "is_folded": False,     # 기권 상태 해제
                "is_observer": False,   # [핵심] 관전 권한 회수 (지갑 버튼 제거)
                "observe_room": None    # 관전 방 초기화
            }
        }
    )
    
    # 2. [문제점 보완] 방(Room) 데이터 자체를 리셋
    # 유저만 쫓겨나고 방이 'is_playing: True' 상태면 다음 게임 시작이 안 됩니다.
    game_room_col.update_one(
        {"_id": room_id},
        {
            "$set": {
                "is_playing": False,     # 게임 종료 상태로 변경
                "participants": [],       # 참여자 명단 초기화
                "folded_users": [],       # 기권자 명단 초기화
                "pot": 0,                 # 판돈 초기화
                "turn_index": 0           # 턴 초기화
            }
        }
    )
    
    print(f"DEBUG: {room_id} 구역이 초기화되었습니다.")


@app.route('/admin_room/<room_id>')
def admin_room_control(room_id):
    """특정 방의 상태를 제어하고 관전자를 승인하는 개별 제어실"""
    if not session.get('is_admin'): 
        return redirect('/')
    
    # 1. 방 정보 로드
    room = game_room_col.find_one({"_id": room_id})
    if not room: 
        return "방 정보를 찾을 수 없습니다."
    
    # 2. 초기 렌더링용 승인 대기 명단 추출
    pending_reqs = list(requests_col.find({
        "room_id": str(room_id),
        "type": "observe",
        "status": "pending"
    }))
    
    waiting_list = ""
    for req in pending_reqs:
        u_name = req.get('user_name', '알 수 없음')
        req_id = str(req.get('_id'))
        waiting_list += """
        <div style="background:#222; padding:10px 15px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #4ade80;">
            <span style="color:#fff; font-weight:bold;">{} 님</span>
            <div>
                <button onclick="approveSpectator('{}')" style="background:#4ade80; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold; color:#000;">승인</button>
                <button onclick="rejectRequest('{}')" style="background:#f87171; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold; color:#fff; margin-left:5px;">거절</button>
            </div>
        </div>
        """.format(u_name, req_id, req_id)

    # 3. 현재 참여 중인 플레이어 정보
    players = room.get('participants', [])
    player_info = ""
    for pid in players:
        p_user = users_col.find_one({"user_id": pid})
        p_name = p_user['name'] if p_user else pid
        player_info += "<span style='background:#ffd700; color:#000; padding:4px 10px; border-radius:5px; margin-right:5px; font-weight:bold; font-size:0.85rem;'>{}</span>".format(p_name)

    # [해결책] f-string을 포기하고 .format()을 사용하여 중괄호 충돌을 원천 차단합니다.
    html_content = """
    <div class="viewport" style="max-width:600px; margin:0 auto; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <button onclick="location.href='/admin/dash'" style="background:none; border:1px solid #444; color:#888; padding:8px 15px; border-radius:10px; cursor:pointer;">◀ 대시보드로</button>
            <h3 style="color:#ffd700; margin:0;">{rid}번 구역 제어실</h3>
        </div>

        <div class="premium-card" style="margin-bottom:20px; border:1px solid #333; padding:15px; background:rgba(255,255,255,0.02); border-radius:15px;">
            <h4 style="color:#666; font-size:0.75rem; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">현재 전장 투입 멤버</h4>
            <div style="display:flex; flex-wrap:wrap; gap:5px;">{p_info}</div>
        </div>

        <div id="request-section" class="premium-card" style="border:1px solid #4ade80; background:rgba(74, 222, 128, 0.05); margin-bottom:20px; padding:15px; border-radius:15px;">
            <h4 style="color:#4ade80; margin-bottom:15px; display:flex; align-items:center; gap:8px;">📩 관전 참여 요청 <span id="req-count" style="background:#4ade80; color:#000; font-size:0.7rem; padding:2px 6px; border-radius:10px;">{req_len}</span></h4>
            <div id="waiting-list-container">
                {w_list}
            </div>
        </div>

        <div class="premium-card" style="border:1px solid #ffd700; padding:15px; background:rgba(255,215,0,0.02); border-radius:15px;">
            <h4 style="color:#ffd700; margin-bottom:15px;">⚙️ COMMAND CENTER</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button onclick="startGame('{rid}')" style="background:#ffd700; color:#000; font-weight:900; height:55px; border-radius:12px; cursor:pointer; border:none; font-size:1rem;">⚔️ 전투 개시</button>
                <button onclick="stopGame('{rid}')" style="background:#ff416c; color:#fff; font-weight:900; height:55px; border-radius:12px; cursor:pointer; border:none; font-size:1rem;">🛑 전투 중단</button>
            </div>
        </div>
    </div>

    <script>
    function fetchLiveRequests() {
        fetch('/api/admin/pending_requests')
            .then(res => res.json())
            .then(data => {
                const myReqs = data.filter(r => String(r.room_id) === "{rid}" && r.type === "observe");
                const container = document.getElementById('waiting-list-container');
                const countBadge = document.getElementById('req-count');
                countBadge.innerText = myReqs.length;
                if (myReqs.length > 0) {
                    let html = "";
                    myReqs.forEach(req => {
                        html += '<div style="background:#222; padding:10px 15px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #4ade80;">' +
                                '<span style="color:#fff; font-weight:bold;">' + req.user_name + ' 님</span>' +
                                '<div>' +
                                '<button onclick="approveSpectator(\'' + req.id + '\')" style="background:#4ade80; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold; color:#000;">승인</button>' +
                                '<button onclick="rejectRequest(\'' + req.id + '\')" style="background:#f87171; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold; color:#fff; margin-left:5px;">거절</button>' +
                                '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<p style="text-align:center; color:#555; font-size:0.8rem; padding:20px;">현재 이 구역에 대기 중인 요청이 없습니다.</p>';
                }
            });
    }
    function startGame(rid) {
        fetch('/api/admin/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: rid })
        }).then(res => res.json()).then(data => { alert(data.message); location.reload(); });
    }
    function stopGame(rid) {
        if(confirm("모든 게임 데이터를 리셋하고 강제 종료하시겠습니까?")) {
            fetch('/api/admin/game_control/' + rid + '/stop', { method: 'POST' })
            .then(res => res.json()).then(data => { alert(data.message); location.reload(); });
        }
    }
    function approveSpectator(reqId) { fetch("/admin/approve_observe/" + reqId).then(() => fetchLiveRequests()); }
    function rejectRequest(reqId) { if(confirm("거절하시겠습니까?")) { fetch("/admin/reject_request/" + reqId).then(() => fetchLiveRequests()); } }
    setInterval(fetchLiveRequests, 3000);
    </script>
    """.format(
        rid=room_id, 
        p_info=player_info if player_info else '<span style="color:#444;">플레이어 없음</span>',
        req_len=len(pending_reqs),
        w_list=waiting_list if waiting_list else '<p style="text-align:center; color:#555; font-size:0.8rem; padding:20px;">현재 이 구역에 대기 중인 요청이 없습니다.</p>'
    )
    
    return render_template_string(MASTER_UI_TEMPLATE, content=html_content, u_name="중앙통제실", f_bal="ADMIN", t_name="CONTROL", t_color="#ffd700")


@app.route('/api/spectator_control/<room_id>/<user_id>/<action>')
def api_spectator_control(room_id, user_id, action):
    if not session.get('is_admin'): return jsonify({"success": False})
    
    if action == "approve":
        # 1. 대기 명단에서 제거하고 승인 명단에 추가
        game_room_col.update_one({"_id": room_id}, {"$pull": {"waiting_spectators": user_id}})
        game_room_col.update_one({"_id": room_id}, {"$addToSet": {"spectators": user_id}})
        msg = "관전 요청을 승인하였습니다."
    else:
        # 2. 거절 시 대기 명단에서만 제거
        game_room_col.update_one({"_id": room_id}, {"$pull": {"waiting_spectators": user_id}})
        msg = "관전 요청을 거절하였습니다."
        
    return jsonify({"success": True, "message": msg})

# --- [유저용: 관전 신청 API] ---
@app.route('/api/request_spectate/<room_id>/<user_id>')
def api_request_spectate(room_id, user_id):
    # 1. 이미 어딘가에 소속되어 있는지 확인 (중복 신청 방지)
    status = get_user_status(user_id)
    if status['role'] != 'free':
        return jsonify({"success": False, "message": "이미 참여 중인 구역이 있거나 대기 중입니다."})

    # 2. 해당 방의 '대기 명단'에 유저 추가
    game_room_col.update_one(
        {"_id": str(room_id)},
        {"$addToSet": {"waiting_spectators": user_id}}
    )
    
    # 3. 로그 남기기 (선택 사항)
    logger.info(f"📩 관전 신청: 유저({user_id}) -> {room_id}번 구역")
    
    return jsonify({"success": True, "message": f"{room_id}번 구역에 관전 신청을 보냈습니다. 승인을 기다려주세요."})


# --- [유저용: 관전 퇴장 API] ---
@app.route('/api/exit_room/<user_id>')
def api_exit_room(user_id):
    # 유저가 속한 방을 찾아서 모든 명단(플레이어, 관전자, 대기자)에서 삭제
    result = game_room_col.update_many(
        {}, 
        {"$pull": {
            "players": {"user_id": user_id}, # 플레이어 구조가 딕셔너리일 경우
            "spectators": user_id,
            "waiting_spectators": user_id
        }}
    )
    
    # 만약 플레이어 리스트가 단순히 ID 리스트라면 아래 코드도 추가
    game_room_col.update_many({}, {"$pull": {"players": user_id}})
    
    return jsonify({"success": True, "message": "구역에서 퇴장하여 광장으로 이동합니다."})

@app.route('/action/fold/<user_id>')
def handle_fold(user_id):
    # 1. 해당 유저 폴드 처리 (DB 업데이트)
    game_room_col.update_one(
        {"participants": user_id},
        {"$set": {"is_folded." + user_id: True}}
    )
    
    # 최신 방 데이터 다시 가져오기
    room = game_room_col.find_one({"participants": user_id})
    if not room:
        return jsonify({"success": False, "message": "방을 찾을 수 없습니다."})

    # 2. 생존자(폴드 안 한 인원) 확인
    all_participants = room.get('participants', [])
    # 실시간 반영을 위해 방금 업데이트된 폴드 상태를 변수에 담음
    folded_dict = room.get('is_folded', {})
    survivors = [pid for pid in all_participants if not folded_dict.get(pid, False)]
    
    # 3. 상황 판정
    
    # CASE A: 생존자가 1명뿐이라면? -> 즉시 승자 처리 및 게임 종료
    if len(survivors) == 1:
        winner_id = survivors[0]
        winner_user = users_col.find_one({"user_id": winner_id})
        winner_name = winner_user['name'] if winner_user else "알 수 없음"
        
        pot_amount = room.get('room_pot', 0)
        # 승자에게 판돈 지급
        users_col.update_one({"user_id": winner_id}, {"$inc": {"balance": pot_amount}})
        # 승리 팝업 메시지 설정
        users_col.update_one({"user_id": winner_id}, {"$set": {"pending_win_msg": f"상대방의 기권으로 {pot_amount}만 원의 승리금을 획득했습니다!"}})
        
        # 게임판 초기화 (is_playing 종료)
        game_room_col.update_one(
            {"_id": room["_id"]},
            {"$set": {
                "is_playing": False,
                "room_pot": 0,
                "is_folded": {},
                "current_turn": None
            }}
        )
        return jsonify({"success": True, "message": f"기권하셨습니다. {winner_name} 님이 독식하며 게임이 종료되었습니다."})

    # CASE B: 생존자가 2명 이상이라면? -> 게임 유지 + 턴 넘기기
    else:
        # 만약 현재 기권한 사람이 자기 턴이었다면, 다음 생존자에게 턴을 강제로 넘김
        if room.get('current_turn') == user_id:
            # 생존자 리스트(survivors) 중에서 기권한 사람 다음 순번을 찾음
            # 간단하게 생존자 리스트의 첫 번째 사람에게 턴을 넘기는 로직
            next_player = survivors[0] 
            game_room_col.update_one(
                {"_id": room["_id"]},
                {"$set": {"current_turn": next_player}}
            )
            return jsonify({"success": True, "message": f"기권 처리되었습니다. 다음 턴은 {next_player} 님입니다."})
        
        return jsonify({"success": True, "message": "기권 처리되었습니다. 전투는 계속됩니다."})

@app.route('/api/admin/start_game', methods=['POST'])
def admin_start_game():
    if not session.get('is_admin'): 
        return jsonify({"success": False, "message": "권한이 없습니다."})
        
    data = request.json
    # [수정] 어떤 방인지 ID를 받아옵니다.
    room_id = data.get('room_id') 
    participants = data.get('participants', [])
    
    if not room_id:
        return jsonify({"success": False, "message": "방 ID 정보가 없습니다."})

    # [수정] "room_01" 고정이 아니라 넘겨받은 room_id로 업데이트
    game_room_col.update_one(
        {"_id": str(room_id)}, 
        {"$set": {
            "is_playing": True,
            "participants": participants,
            "turn_index": 0,
            "folded_users": []
        }}
    )
    
    add_ticker(f"🔱 [SYSTEM] 관리자가 #{room_id} 구역의 순서를 확정하고 게임을 시작했습니다!")
    
    # [수정] JS에서 alert(data.message)를 쓰므로 message를 꼭 넣어줍니다.
    return jsonify({"success": True, "message": f"#{room_id} 구역 순서 확정 및 시작!"})

@app.route('/admin/end_game/<room_id>')
def admin_end_game(room_id):
    if not session.get('is_admin'): return redirect('/')
    
    # 1. 방의 게임 진행 상태를 종료(False)로 변경
    # (사장님 DB 필드명에 맞춰 game_room_col 또는 rooms_col 확인)
    game_room_col.update_one(
        {"_id": room_id}, 
        {"$set": {
            "is_playing": False,
            "pot": 0,                # 판돈 초기화
            "game_status": "WAITING" # 상태 대기로 변경
        }}
    )
    
    # 2. 모든 유저의 게임 관련 상태 초기화 (매우 중요!)
    # 이걸 해야 다음 판에 유저들이 '폴드' 상태로 시작하지 않습니다.
    users_col.update_many(
        {"room_id": room_id}, 
        {"$set": {
            "is_folded": False, 
            "is_my_turn": False
        }}
    )
    
    # 종료 후 다시 제어실로 돌아갑니다.
    return redirect(f'/admin_room/{room_id}')

@app.route('/api/place_bet_spectator', methods=['POST'])
def place_bet_spectator():
    data = request.json
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    target_id = data.get('target_id')  # 누구에게 걸었는가?
    amount = float(data.get('amount', 0))

    user = users_col.find_one({"user_id": user_id})
    room = game_room_col.find_one({"_id": room_id})

    # 1. 유효성 검사
    if not user or not room:
        return jsonify({"success": False, "message": "데이터 오류"})
    
    if user['balance'] < amount:
        return jsonify({"success": False, "message": "자산이 부족합니다."})
    
    if amount <= 0:
        return jsonify({"success": False, "message": "금액을 입력해주세요."})

    # 2. 베팅 데이터 저장 (bets 컬렉션에 기록)
    bet_doc = {
        "user_id": user_id,
        "user_name": user['name'],
        "room_id": room_id,
        "target_id": target_id, # 베팅 대상 플레이어 ID
        "amount": amount,
        "bet_type": "SPECTATOR_CHAMPION",
        "status": "PENDING", # 경기 종료 전까지 대기
        "timestamp": datetime.now()
    }
    bet_col.insert_one(bet_doc)

    # 3. 유저 잔액 차감
    users_col.update_one({"user_id": user_id}, {"$inc": {"balance": -amount}})

    # 4. 방 데이터 업데이트 (해당 방 누적 관전자 판돈 기록 - 필요시)
    game_room_col.update_one({"_id": room_id}, {"$inc": {"spectator_pot": amount}})

    logger.info(f"💰 관전자 베팅: {user['name']} -> {target_id}에게 {amount}만 원")
    return jsonify({"success": True, "message": f"{amount}만 원 베팅이 완료되었습니다!"})

# --- [멀티룸 관리자 허브] ---
@app.route('/admin_hub')
def admin_hub():
    """모든 게임방의 현황을 한눈에 보고 관리하는 메인 페이지"""
    if not session.get('is_admin'): 
        return redirect('/')
    
    # DB에서 모든 방 정보를 가져옴 (방 번호 순서대로)
    all_rooms = list(game_room_col.find().sort("_id", 1))
    
    room_cards = ""
    for r in all_rooms:
        p_count = len(r.get('players', []))
        s_count = len(r.get('spectators', []))
        w_count = len(r.get('waiting_spectators', []))
        
        # 방 상태에 따른 색상 구분 (진행중: 녹색, 대기중: 회색)
        status_color = "#4ade80" if r.get('game_status') == "PLAYING" else "#888"
        status_text = "전투 진행 중" if r.get('game_status') == "PLAYING" else "대기 상태"
        
        room_cards += f"""
        <div style="background:#111; border:1px solid #333; padding:20px; border-radius:15px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center; border-left:5px solid {status_color};">
            <div>
                <h3 style="margin:0; color:var(--gold); font-size:1.2rem;">🏰 제 {r['_id']}구역 게임룸</h3>
                <p style="margin:8px 0 0; font-size:0.85rem; color:#aaa;">
                    <span style="color:{status_color};">● {status_text}</span> | 
                    플레이어: <b>{p_count}/2</b> | 관전자: <b>{s_count}</b> (대기: {w_count})
                </p>
            </div>
            <div style="display:flex; gap:10px;">
                <a href="/admin_room/{r['_id']}" class="m-btn" style="padding:10px 15px; background:rgba(212,175,55,0.1); color:var(--gold); text-decoration:none; border:1px solid var(--gold); border-radius:8px; font-size:0.8rem; font-weight:bold;">
                    제어실 입장
                </a>
            </div>
        </div>
        """

    html_content = f"""
    <div class="viewport" style="max-width:600px; margin:0 auto; padding:20px;">
        <div style="text-align:center; margin-bottom:30px;">
            <h2 style="color:var(--gold); letter-spacing:4px; font-weight:900; margin-bottom:5px;">EMPIRE HUB</h2>
            <div style="font-size:0.7rem; color:#666; letter-spacing:2px;">MULTI-ROOM MANAGEMENT SYSTEM</div>
        </div>
        
        <div style="margin-top:20px;">
            {room_cards if room_cards else '<p style="text-align:center; color:#444;">개설된 방이 없습니다.</p>'}
        </div>
        
        <div style="margin-top:40px; padding:20px; border-top:1px solid #222; text-align:center;">
            <button onclick="createNewRoom()" class="m-btn btn-dark" style="width:100%; height:55px; font-size:1rem; border:1px solid #444;">
                + 새로운 전투 구역 개설
            </button>
        </div>
    </div>
    
    <script>
    function createNewRoom() {{
        const roomId = prompt("생성할 방 번호 또는 이름을 입력하세요:");
        if (roomId) {{
            location.href = "/admin/create_room/" + roomId;
        }}
    }}
    </script>
    """
    # 기존에 사용하시던 MASTER_UI_TEMPLATE이나 지갑 템플릿에 입혀서 반환
    return render_template_string(MASTER_UI_TEMPLATE, content=html_content, u_name="관리자", f_bal="ADMIN", t_name="CENTER", t_color="linear-gradient(135deg, #111, #000)")

# --- [방 생성 기능 라우트] ---
@app.route('/admin/create_room/<room_id>')
def admin_create_room(room_id):
    if not session.get('is_admin'): return redirect('/')
    # 아까 만든 get_room_data 함수를 호출하여 방을 생성함
    get_room_data(room_id)
    return f"<script>alert('{room_id}번 방이 개설되었습니다.'); location.href='/admin_hub';</script>"


@app.route('/admin/game')
def admin_game_control():
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    # URL에서 어떤 방을 제어할지 ID를 받아옵니다.
    target_room_id = request.args.get('room_id')

    # [A] 방 선택이 안 된 경우: 전체 방 목록 출력 (디자인 유지)
    if not target_room_id:
        rooms = list(game_room_col.find().sort("_id", 1))
        list_html = """
        <div class="viewport">
            <div class="premium-card" style="border:1px solid var(--gold);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="color:var(--gold); margin:0;">🌐 구역 통합 관리</h2>
                    <button onclick="addRoom()" class="m-btn btn-gold" style="width:auto; padding:10px 20px; margin:0;">+ 구역 추가</button>
                </div>
                {% for rm in rooms %}
                <div style="background:#111; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #222;">
                    <div>
                        <b style="font-size:1.1rem; color:#fff;">#{{ rm._id|string }}</b>
                        <div style="font-size:0.75rem; color:#666;">전투원: {{ rm.players|length }} | 판돈: {{ f_money(rm.pot|default(0)) }}</div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <a href="/admin/game?room_id={{ rm._id|string }}" class="m-btn btn-prime" style="padding:8px 12px; font-size:0.75rem; width:auto; text-decoration:none;">제어 진입</a>
                        <button onclick="delRoom('{{ rm._id|string }}')" class="m-btn btn-red" style="padding:8px 12px; font-size:0.75rem; width:auto; background:#422; border:none; cursor:pointer;">폐쇄</button>
                    </div>
                </div>
                {% endfor %}
            </div>
            <a href="/admin/dash" class="m-btn btn-dark" style="margin-top:20px; text-decoration:none; display:block; text-align:center; line-height:60px;">뒤로가기</a>
        </div>
        <script>
            function addRoom() { 
                const n = prompt("새로운 방 ID를 입력하세요 (예: 4)"); 
                if(n) location.href="/admin/add_room/" + n; 
            }
            function delRoom(n) { 
                if(confirm("구역을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
                    location.href="/admin/delete_room/" + n; 
                }
            }
        </script>
        """
        return render_template_string(MASTER_UI_TEMPLATE, content=render_template_string(list_html, rooms=rooms, f_money=f_money))

    # [B] 특정 방이 선택된 경우: 상세 제어
    room = game_room_col.find_one({"_id": str(target_room_id)})
    if not room: 
        return "<script>alert('존재하지 않는 구역입니다.'); location.href='/admin/game';</script>"
        
    all_u = list(users_col.find().sort("name", 1))
    waiters = room.get('waiting_list', [])
    participants = room.get('participants', [])
    folded = room.get('folded_users', [])
    
    detail_html = """
    <div class="viewport">
        <div style="color:var(--gold); margin-bottom:10px; font-weight:bold; display:flex; justify-content:space-between;">
            <span>📍 제어 중: {{room_id}}</span>
            <span style="color:#666; font-size:0.8rem;">STATUS: {% if room.is_playing %}<b style="color:var(--accent-green);">ON GAME</b>{% else %}IDLE{% endif %}</span>
        </div>
        
        <div class="premium-card" style="border:2px solid var(--accent-red); margin-bottom:20px; background: rgba(255, 77, 77, 0.05);">
            <h3 style="color:var(--accent-red); margin-top:0; font-size:1rem;">🚨 입구 관전 승인 대기</h3>
            {% if not waiters %}
                <p style="color:#555; font-size:0.8rem; text-align:center; margin:10px 0;">대기 유저 없음</p>
            {% endif %}
            {% for w in waiters %}
            <div style="display:flex; justify-content:space-between; align-items:center; background:#111; padding:12px; border-radius:12px; margin-bottom:8px; border:1px solid #331111;">
                <span style="color:#eee; font-size:0.9rem;">{{w.name}}</span>
                <div style="display:flex; gap:5px;">
                    <a href="/admin/approve/{{room_id}}/{{w.user_id}}" class="m-btn btn-prime" style="width:60px; height:35px; line-height:35px; padding:0; font-size:0.7rem; text-decoration:none;">승인</a>
                    <a href="/admin/reject/{{room_id}}/{{w.user_id}}" class="m-btn btn-red" style="width:60px; height:35px; line-height:35px; padding:0; font-size:0.7rem; text-decoration:none; background:#422;">거절</a>
                </div>
            </div>
            {% endfor %}
        </div>

        <div class="premium-card" style="border:2px solid var(--accent-green); text-align:center; margin-bottom:20px;">
            <div style="font-size:0.9rem; color:#888; letter-spacing:3px;">CURRENT GAME POT</div>
            <h1 style="color:var(--accent-green); font-size:3.5rem; margin:10px 0;">{{f_money(room.pot)}}</h1>
            <div style="color:#555; font-size:0.75rem;">참가: {{room.players|length}}명 | 관전: {{room.spectators|length if room.spectators else 0}}명</div>
        </div>

        <h3 style="margin-left:10px; margin-bottom:15px; color:var(--gold);">🎮 플레이어 순서 지정 및 제어</h3>

        <!-- ✅ 순서 입력 강조 + 배지 표시용 CSS (기존 기능 영향 없음) -->
        <style>
          .order-badge{
            min-width: 44px;
            height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 2px solid #f1c40f;
            color: #f1c40f;
            font-weight: 900;
            letter-spacing: 0.5px;
            opacity: 0.35;
            transform: scale(0.98);
            transition: 0.15s ease;
            background: rgba(241, 196, 15, 0.06);
          }

          .turn-order-input.is-set{
            background: rgba(241, 196, 15, 0.10) !important;
            box-shadow: 0 0 0 3px rgba(241,196,15,0.25), 0 0 18px rgba(241,196,15,0.25);
            transform: scale(1.05);
          }

          .order-badge.is-set{
            opacity: 1;
            transform: scale(1.05);
            box-shadow: 0 0 0 3px rgba(241,196,15,0.18), 0 0 14px rgba(241,196,15,0.20);
          }
        </style>

        <div class="premium-card" style="padding:10px; margin-bottom:20px; border:1px solid #333;">
            {% for p in room.players %}
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222;">
                <div style="flex:1;">
                    <b style="font-size:1rem; color:#fff;">{{p.name}}</b>
                    {% if room.participants and room.participants[room.turn_index|default(0)] == p.user_id %}
                        <span style="color:var(--accent-green); font-size:0.7rem; margin-left:5px;">[현재 턴]</span>
                    {% endif %}
                    {% if p.user_id in folded %}
                        <span style="color:#ff416c; font-size:0.7rem; margin-left:5px;">[FOLD]</span>
                    {% endif %}
                </div>
                
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" class="turn-order-input" data-user-id="{{p.user_id}}" 
                           value="{% if p.user_id in participants %}{{ participants.index(p.user_id) + 1 }}{% else %}0{% endif %}"
                           style="width:50px; height:38px; background:#000; color:#f1c40f !important; -webkit-text-fill-color:#f1c40f !important; border:2px solid #f1c40f; text-align:center; border-radius:8px; font-weight:900; font-size:1.2rem;">
                    
                    <!-- ✅ 입력한 순서가 눈에 띄게 보이도록 배지 추가 (기존 기능 영향 없음) -->
                    <span class="order-badge" data-for="{{p.user_id}}"></span>

                    <button onclick="if(confirm('승리 처리하시겠습니까?')) location.href='/admin/win/{{room_id}}/{{p.user_id}}'" 
                            class="m-btn btn-prime" style="width:60px; height:35px; margin:0; font-size:0.7rem;">승리</button>
                </div>
            </div>
            {% endfor %}
            
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px; margin-top:15px; padding:10px;">
                <button onclick="applyOrder('{{room_id}}')" class="m-btn btn-gold" style="margin:0; height:45px; font-weight:bold;">순서 확정 및 게임 시작</button>
                <button onclick="location.href='/api/admin/force_next_turn?room_id={{room_id}}'" class="m-btn btn-dark" style="margin:0; height:45px; font-size:0.75rem;">강제 턴</button>
            </div>
        </div>

        <div class="premium-card" style="margin-bottom:20px;">
            <h3 style="margin-bottom:15px; color:var(--gold); font-size:0.9rem;">🎴 플레이어 강제 참가</h3>
            <form action="/admin/game_add/{{room_id}}" method="post" style="display:flex; gap:10px;">
                <select name="uid" style="flex:2; background:#000; color:#fff; border-radius:10px; padding:10px; border:1px solid #333;">
                    {% for u in all_u %}<option value="{{u.user_id}}">{{u.name}}</option>{% endfor %}
                </select>
                <button class="m-btn btn-prime" style="flex:1; margin:0; height:45px; font-size:0.85rem;">추가</button>
            </form>
        </div>

        <div class="btn-group" style="margin-top:20px;">
            <a href="/admin/game_reset/{{room_id}}" class="m-btn btn-red" onclick="return confirm('판돈과 플레이어를 모두 초기화합니까?')" style="height:55px; line-height:55px; text-decoration:none; text-align:center; background:#411; display:block; margin-bottom:10px; border-radius:15px; font-weight:bold;">🧨 이 구역 초기화</a>
            <a href="/admin/game" class="m-btn btn-dark" style="height:55px; line-height:55px; text-decoration:none; text-align:center; display:block; border-radius:15px;">구역 목록으로</a>
        </div>
    </div>
    
    <script>
    function applyOrder(roomId) {
        const inputs = document.querySelectorAll('.turn-order-input');
        let participants = [];
        inputs.forEach(input => {
            const order = parseInt(input.value);
            if (!isNaN(order) && order > 0) {
                participants.push({ id: input.dataset.userId, order: order });
            }
        });
        
        participants.sort((a, b) => a.order - b.order);
        const sortedIds = participants.map(p => p.id);
        
        if(sortedIds.length < 2) { 
            alert("최소 2명 이상의 순서를 1번부터 지정해주세요."); 
            return; 
        }

        fetch('/api/admin/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, participants: sortedIds })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            location.reload();
        })
        .catch(err => {
            alert("서버 통신 오류가 발생했습니다.");
        });
    }

    // ✅ 순서 입력값을 "눈에 띄게" 표시: input 강조 + #번호 배지
    function syncOrderUI(input){
        const v = parseInt(input.value, 10);
        const uid = input.dataset.userId;
        const badge = document.querySelector(`.order-badge[data-for="${uid}"]`);
        const ok = !isNaN(v) && v > 0;

        input.classList.toggle('is-set', ok);

        if(badge){
            badge.textContent = ok ? `#${v}` : '';
            badge.classList.toggle('is-set', ok);
        }
    }

    document.querySelectorAll('.turn-order-input').forEach(input => {
        // 초기 표시(서버에서 내려온 participants 반영)
        syncOrderUI(input);

        // 입력 즉시 반영
        input.addEventListener('input', () => syncOrderUI(input));
        input.addEventListener('change', () => syncOrderUI(input));
    });

    // ✅ 자동 리로드 기능은 유지하되, "무동작(Idle) 60초"일 때만 리로드
    let lastInteract = Date.now();
    function markInteract(){ lastInteract = Date.now(); }

    ['click','touchstart','touchmove','keydown','input','focus','scroll'].forEach(ev => {
        document.addEventListener(ev, markInteract, { passive: true });
    });

    // 5초마다 체크 → 60초 이상 무동작 + 편집중 아님이면 리로드
    setInterval(() => {
        const tag = document.activeElement?.tagName;
        const isEditing = (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA');
        const idleMs = Date.now() - lastInteract;

        if (!isEditing && idleMs >= 60000) {
            location.reload();
        }
    }, 5000);
    </script>
    """
    
    return render_template_string(
        MASTER_UI_TEMPLATE, 
        content=render_template_string(
            detail_html, 
            room=room, 
            room_id=target_room_id, 
            all_u=all_u, 
            waiters=waiters, 
            f_money=f_money, 
            folded=folded,
            participants=participants
        ), 
        is_admin=True
    )


@app.route('/admin/approve_observe/<request_id>')
def approve_observe(request_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    req = requests_col.find_one({"_id": ObjectId(request_id)})
    if req:
        user_id = req.get('user_id')
        
        # [핵심] 유저 데이터에 관전 권한(is_observer)을 부여합니다.
        users_col.update_one(
            {"user_id": user_id}, 
            {"$set": {"is_observer": True, "observe_room": req.get('room_id')}}
        )
        
        # 요청 상태 변경
        requests_col.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "APPROVED"}})
        
        add_ticker(f"⚔️ [관전 승인] {req.get('user_name')} 님이 베팅 권한을 획득하셨습니다.")
        return f"<script>alert('승인 완료! 이제 유저가 베팅할 수 있습니다.'); location.href='/admin/dash';</script>"
    
    return "<script>alert('요청을 찾을 수 없습니다.'); history.back();</script>"

# [승인 일꾼] 대기열에서 빼서 관전자 명단으로 이동
@app.route('/admin/approve/<room_id>/<user_id>')
def admin_approve(room_id, user_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    user = users_col.find_one({"user_id": user_id})
    if user:
        # 대기열(waiting_list)에서 제거하고 관전자(spectators) 리스트에 추가
        game_room_col.update_one({"_id": room_id}, {"$pull": {"waiting_list": {"user_id": user_id}}})
        game_room_col.update_one({"_id": room_id}, {"$push": {"spectators": {"user_id": user_id, "name": user['name']}}})
        add_ticker(f"🔔 [{room_id}] {user['name']}님의 관전 신청이 승인되었습니다.")
    return redirect(f'/admin/game?room_id={room_id}')

# [거절 일꾼] 대기열에서 그냥 삭제
@app.route('/admin/reject_charge/<request_id>')
def reject_charge(request_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    # 거절 시 상태만 변경
    requests_col.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "REJECTED"}})
    return redirect('/admin/dash')

@app.route('/admin/reject_request/<request_id>')
def reject_request(request_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    # 요청 삭제 또는 상태 변경 (여기서는 삭제 처리)
    result = requests_col.delete_one({"_id": ObjectId(request_id)})
    
    if result.deleted_count > 0:
        return "<script>alert('요청이 거절 및 삭제되었습니다.'); location.href='/admin/dash';</script>"
    
    return "<script>alert('이미 처리되었거나 없는 요청입니다.'); history.back();</script>"

@app.route('/apply_spectate/<room_id>/<user_id>')
def apply_spectate(room_id, user_id):
    # '신청 대기' 상태로 DB에 저장하거나 방의 대기열 필드에 추가
    game_room_col.update_one(
        {"_id": room_id},
        {"$push": {"waiting_list": {"user_id": user_id, "name": session.get('user_name', '무명')}}}
    )
    return f"<script>alert('{room_id} 구역에 관전 신청을 보냈습니다.'); location.href='/';</script>"

@app.route('/admin/game_add/<room_id>', methods=['POST'])
def admin_game_add_multi(room_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    uid = request.form.get('uid')
    user = users_col.find_one({"user_id": uid})
    
    if user:
        # [핵심 수정] room_id를 문자열로 변환하여 사장님의 DB 규칙과 일치시킵니다.
        target_room_id = str(room_id)
        room = game_room_col.find_one({"_id": target_room_id})
        
        if room:
            # 이미 있는지 확인 후 추가 (기존 로직 유지)
            if not any(p['user_id'] == uid for p in room.get('players', [])):
                game_room_col.update_one(
                    {"_id": target_room_id}, 
                    {"$push": {"players": {
                        "user_id": user['user_id'], 
                        "name": user['name']
                    }}}
                )
    
    # 리다이렉트 주소도 안전하게 target_room_id를 사용합니다.
    return redirect(f'/admin/game?room_id={room_id}')

@app.route('/admin/game_reset/<room_id>')
def admin_game_reset_multi(room_id):
    if not session.get('is_admin'): return redirect('/admin/gate')
    game_room_col.update_one({"_id": room_id}, {"$set": {
        "players": [], "spectators": [], "pot": 0, "turn_index": 0, "game_status": "WAITING"
    }})
    return redirect(f'/admin/game?room_id={room_id}')


@app.route('/admin/win/<room_id>/<uid>')
def admin_win(room_id, uid):
    if not session.get('is_admin'): return redirect('/admin/gate')
    
    # 사장님 DB 구조에 맞춰 collection 이름 확인 (game_room_col 또는 rooms_col)
    room = game_room_col.find_one({"_id": room_id})
    user = users_col.find_one({"user_id": uid})
    
    if room and user:
        pot_amount = room.get('pot', 0)
        
        # 1. 잔액 증가 (돈 지급)
        if pot_amount > 0:
            users_col.update_one({"user_id": uid}, {"$inc": {"balance": pot_amount}})
        
        # 2. 승리한 유저에게 팝업 메시지 전송
        win_text = f"축하합니다! {f_money(pot_amount)} 획득!" if pot_amount > 0 else "축하합니다! 승리하셨습니다!"
        users_col.update_one({"user_id": uid}, {"$set": {"pending_win_msg": win_text}})

        # 3. [핵심] 게임 종료 통합 로직 실행 (모든 유저 초기화)
        # -------------------------------------------------------
        # 방 상태 초기화
        game_room_col.update_one(
            {"_id": room_id}, 
            {"$set": {
                "pot": 0, 
                "is_playing": False,
                "game_status": "WAITING",
                "participants": [],
                "turn_index": 0
            }}
        )
        
        # 해당 방에 있던 모든 유저의 폴드 및 턴 상태 초기화 (다음 판 준비)
        users_col.update_many(
            {"room_id": room_id}, 
            {"$set": {"is_folded": False, "is_my_turn": False}}
        )
        # -------------------------------------------------------
        
        # 티커 알림
        msg = f"🏆 [{room_id}] 승리: {user['name']}님이 {f_money(pot_amount)}를 획득했습니다!"
        add_ticker(msg)

    return redirect(f'/admin/game?room_id={room_id}')



@app.route('/admin/add_room/<room_id>')
def admin_add_room(room_id):
    # 1. 관리자 권한 체크 (기존 코드 유지)
    if not session.get('is_admin'): 
        return redirect('/admin/gate')
    
    # [수정] 사장님의 get_room_data 함수와 일치시키기 위해 ID를 문자열로 강제 변환
    target_id = str(room_id)
    
    # 2. 방이 없을 때만 생성 (기존 로직 유지)
    if not game_room_col.find_one({"_id": target_id}):
        # [보강] 사장님의 시스템이 요구하는 모든 필드를 빠짐없이 채워넣어 에러를 방지합니다.
        game_room_col.insert_one({
            "_id": target_id,
            "id": target_id,                 # 조회용 필드 추가
            "players": [], 
            "spectators": [], 
            "waiting_spectators": [],       # 관전 승인을 위한 필수 필드
            "exit_queue": [],               # 퇴장 처리를 위한 필수 필드
            "pot": 0, 
            "turn_index": -1,               # 게임 시작 전이므로 -1로 초기화 권장
            "game_status": "WAITING",
            "last_winner": None,
            "last_action_time": datetime.now() # 시스템 관리용 시간 데이터
        })
    
    # 3. 리다이렉트 (기존 코드 유지)
    return redirect(url_for('admin_game_control'))


@app.route('/admin/delete_room/<room_id>')
def admin_delete_room(room_id):
    # 1. 관리자 체크 (기존 로직 유지)
    if not session.get('is_admin'): 
        return redirect('/admin/gate')
    
    try:
        # 2. 삭제 로직 보완
        # [보완] 만약 위에서 rooms_col로 정의하셨다면 변수명을 맞춰야 합니다.
        # 여기서는 사장님이 주신 game_room_col을 유지하되, ObjectId 변환을 최우선으로 합니다.
        result = game_room_col.delete_one({"_id": ObjectId(room_id)})
        
        # 만약 기본 _id(ObjectId)로 삭제가 안 됐다면 (deleted_count가 0이면)
        if result.deleted_count == 0:
            # 일반 문자열 형태의 _id나 별도의 room_id 필드로 한 번 더 시도
            game_room_col.delete_one({"_id": room_id}) 
            game_room_col.delete_one({"room_id": room_id}) 
            
    except Exception as e:
        print(f"삭제 중 에러 발생: {e}")
        # ID 형식이 ObjectId가 아닐 경우를 대비해 일반 문자열로 한 번 더 시도 (사장님 기존 예외처리 유지)
        try:
            game_room_col.delete_one({"room_id": room_id})
            game_room_col.delete_one({"_id": room_id})
        except:
            pass

    # 3. 목록 페이지로 복귀 (기존 로직 유지)
    return redirect(url_for('admin_game_control'))


@app.route('/admin/game_add', methods=['POST'])
def admin_game_add_player():
    """게임 플레이어를 명단에 추가합니다."""
    u_id = request.form.get('uid')
    user = users_col.find_one({"user_id": u_id})
    if user:
        game_room_col.update_one({"_id": "room_01"}, {
            "$push": {"players": {"user_id": u_id, "name": user['name']}},
            "$set": {"turn_index": 0}
        })
        add_ticker(f"🎴 [GAME] {user['name']}님이 게임에 공식 참가하셨습니다. 새로운 승부가 시작됩니다!")
    return redirect('/admin/game')

@app.route('/admin/win/<uid>')
def admin_game_winner(uid):
    """지정한 승자에게 POT 금액을 지급하고 게임을 종료합니다."""
    room = game_room_col.find_one({"_id": "room_01"})
    user = users_col.find_one({"user_id": uid})
    
    if room and user:
        win_amt = room['pot']
        # 1. 승자에게 입금
        users_col.update_one({"user_id": uid}, {"$inc": {"balance": win_amt}})
        # 2. 전광판 공지
        add_ticker(f"🏆 [WINNER] 축하합니다! {user['name']}님께서 게임에서 최종 승리하여 {f_money(win_amt)}의 판돈을 획득하셨습니다!")
        # 3. 게임룸 리셋
        game_room_col.update_one({"_id": "room_01"}, {
            "$set": {"pot": 0, "players": [], "turn_index": -1}
        })
    return redirect('/admin/game')

@app.route('/api/admin/reset_game')
def reset_game():
    db.settings.update_one(
        {"key": "game_state"},
        {"$set": {"is_playing": False, "participants": [], "folded_users": [], "current_turn_user": ""}}
    )
    return jsonify({"success": True, "message": "게임이 초기화되었습니다."})

@app.route('/admin/game_reset')
def admin_game_reset():
    """게임판을 강제로 비웁니다 (순서 및 포기자 명단 포함)"""
    game_room_col.update_one({"_id": "room_01"}, {
        "$set": {
            "pot": 0, 
            "players": [], 
            "turn_index": -1,
            "participants": [],    # [추가] 관리자가 정한 순서 초기화
            "folded_users": [],    # [추가] 포기한 사람 명단 초기화
            "is_playing": False    # [추가] 게임 진행 상태 꺼짐
        }
    })
    add_ticker("⚠️ [알림] 중앙 관리자에 의해 게임판이 완전히 초기화되었습니다.")
    return redirect('/admin/game')

@app.route('/admin/user_del/<uid>')
def admin_user_del(uid):
    """부적절한 유저 강제 삭제 (자산 국고 환수 로직 포함)"""
    if not session.get('is_admin'): # 세션 체크 변수명 수정
        return redirect('/admin/gate')
    
    # [보완] 삭제 전 해당 유저 정보를 가져와서 환수될 금액을 파악 (티커 표시용)
    user_to_del = users_col.find_one({"user_id": uid})
    refund_msg = ""
    if user_to_del:
        refund_bal = user_to_del.get('balance', 0)
        refund_msg = f" (잔액 {refund_bal}만 원 국고 환수)"

    # 유저 삭제 실행
    users_col.delete_one({"user_id": uid})
    
    # 티커에 제명 및 환수 사실 공표
    add_ticker(f"⚠️ [ADMIN] {uid} 회원이 제국에서 영구 제명되었습니다.{refund_msg}")
    
    return redirect('/admin/dash')

@app.route('/admin/next_turn')
def next_turn():
    if not session.get('is_admin'): return "권한 없음"
    
    room = game_room_col.find_one({"_id": "room_01"})
    players = room.get('players', [])
    if not players: return "플레이어 없음"

    new_index = (room.get('turn_index', 0) + 1) % len(players)
    game_room_col.update_one({"_id": "room_01"}, {"$set": {"turn_index": new_index}})
    
    add_ticker(f"📣 시스템: {players[new_index]['name']} 님의 턴으로 전환되었습니다.")
    return redirect('/admin/dashboard') # 관리자 화면으로 복귀

@app.route('/api/admin/force_next_turn')
def force_next_turn_logic():
    room = game_room_col.find_one({"_id": "room_01"})
    participants = room.get('participants', []) # 관리자가 정한 순서 리스트
    current_idx = room.get('turn_index', 0)
    folded = room.get('folded_users', [])

    if not participants:
        return jsonify({"success": False, "message": "설정된 게임 순서가 없습니다."})

    # 다음 사람 찾기 (포기한 사람은 건너뜀)
    for _ in range(len(participants)):
        current_idx = (current_idx + 1) % len(participants)
        next_user_id = participants[current_idx]
        
        if next_user_id not in folded:
            game_room_col.update_one({"_id": "room_01"}, {"$set": {"turn_index": current_idx}})
            return jsonify({"success": True, "message": "다음 턴으로 이동되었습니다."})

    return jsonify({"success": False, "message": "배팅 가능한 유저가 없습니다."})

@app.route('/admin/force_turn/<user_id>') # 중복 방지를 위해 경로명 변경
def admin_force_turn(user_id):
    """[관리자 전용] 특정 유저에게 턴을 강제로 부여하는 로직"""
    if not session.get('is_admin'):
        return redirect('/admin/gate')
        
    room = game_room_col.find_one({"_id": "room_01"})
    p_list = room.get('players', [])
    
    target_idx = -1
    for i, p in enumerate(p_list):
        if p['user_id'] == user_id:
            target_idx = i
            break
            
    if target_idx != -1:
        game_room_col.update_one({"_id": "room_01"}, {"$set": {"turn_index": target_idx}})
        add_ticker(f"⚖️ [ADMIN] 관리자가 {p_list[target_idx]['name']} 님에게 턴을 강제 부여했습니다.")
    
    return f"<script>alert('{user_id} 턴으로 변경됨'); location.href='/admin/game';</script>"

@app.route('/admin/settle_game/<room_id>/<winner_id>')
def settle_game(room_id, winner_id):
    if not session.get('is_admin'): return "권한 없음", 403

    # 1. 해당 방의 모든 챔피언 베팅 내역 가져오기 (방 ID 유연하게 처리)
    all_bets = list(bet_col.find({"room_id": room_id}))
    
    if not all_bets:
        return "<script>alert('베팅 내역이 없습니다.'); history.back();</script>"

    # 총 베팅 누적액 계산
    total_bet_pool = sum(b['amount'] for b in all_bets)
    
    # 승리자/패배자 분류 (베팅 대상이 실제 승리자와 일치하는지 확인)
    winners_bets = [b for b in all_bets if b['target_id'] == winner_id]
    losers_bets = [b for b in all_bets if b['target_id'] != winner_id]

    msg = ""
    dist_bank = 0

    # CASE 1: 승자와 패자가 모두 존재하는 경우 (사장님 전용 75/15/10 룰)
    if winners_bets and losers_bets:
        dist_winners = total_bet_pool * 0.75  # 승리 관전자 몫
        dist_losers = total_bet_pool * 0.15   # 패배 관전자 최소보상
        dist_bank = total_bet_pool * 0.10     # 국고 환수

        # [승리 관전자 정산]
        win_total_bet = sum(b['amount'] for b in winners_bets)
        for wb in winners_bets:
            # 베팅 비율에 따른 지분 계산
            my_share = (wb['amount'] / win_total_bet) * dist_winners
            users_col.update_one({"user_id": wb['sender_id']}, {"$inc": {"balance": int(my_share)}})

        # [패배 관전자 정산]
        lose_total_bet = sum(b['amount'] for b in losers_bets)
        for lb in losers_bets:
            my_share = (lb['amount'] / lose_total_bet) * dist_losers
            users_col.update_one({"user_id": lb['sender_id']}, {"$inc": {"balance": int(my_share)}})

        msg = f"황금 배분 완료! (승자:{f_money(dist_winners)}, 패자:{f_money(dist_losers)}, 국고:{f_money(dist_bank)})"

    # CASE 2: 모든 관전자가 승리자를 맞춘 경우 (원금 회수 및 국고 수수료 10%만 징수)
    elif winners_bets and not losers_bets:
        dist_bank = total_bet_pool * 0.10
        for wb in winners_bets:
            # 원금에서 10% 떼고 돌려줌 (국고 수익 확보)
            refund = wb['amount'] * 0.9
            users_col.update_one({"user_id": wb['sender_id']}, {"$inc": {"balance": int(refund)}})
        msg = "전원 적중! 수수료 10% 제외 후 원금이 반환되었습니다."

    # CASE 3: 모든 관전자가 틀린 경우 (전액 국고 환수)
    else:
        dist_bank = total_bet_pool
        msg = "전원 낙첨! 베팅금이 전액 국고로 귀속되었습니다."

    # 2. [보완] 국고 수익 통합 업데이트 (admin 잔액 + 수수료 로그)
    if dist_bank > 0:
        # admin 유저의 잔액 증가
        users_col.update_one({"user_id": "admin"}, {"$inc": {"balance": int(dist_bank)}})
        # 중앙은행 누적 수익 기록 (admin_dash 연동)
        db.settings.update_one(
            {"key": "central_bank"},
            {"$inc": {"accumulated_fees": int(dist_bank)}},
            upsert=True
        )

    # 3. [추가] 정산 로그 기록 (나중에 확인용)
    db.logs.insert_one({
        "type": "SETTLEMENT",
        "room_id": room_id,
        "total_pool": total_bet_pool,
        "bank_profit": dist_bank,
        "timestamp": datetime.now()
    })

    # 4. 베팅 기록 초기화
    bet_col.delete_many({"room_id": room_id})
    
    return f"<script>alert('{msg}'); location.href='/admin/dash';</script>"



# ==============================================================================
# [SECTION 8] 실시간 데이터 통신 API (브라우저 동기화용)
# ==============================================================================

# 1. 경로 두 개를 한 번에 등록 (어떤 요청이 와도 이 함수가 처리함)
@app.route('/api/get_balance/<user_id>')
@app.route('/api/get_balance/<room_id>/<user_id>')
def api_get_balance_integrated(user_id, room_id=None):
    """
    [제국 중앙은행 통합 자산/권한 API]
    기존의 모든 턴 계산, 폴드 체크 로직을 유지하면서 '관전 승인' 상태까지 실시간 전달합니다.
    """
    user = users_col.find_one({"user_id": user_id})
    
    # room_id가 인자로 오지 않은 경우, 유저 데이터에서 현재 속한 방이나 관전 방을 탐색
    target_room_id = room_id if room_id else (user.get('room_id') or user.get('observe_room'))
    room = game_room_col.find_one({"_id": target_room_id}) if target_room_id else None
    
    if user:
        # 사장님이 관리자 대시보드에서 [승인] 눌렀는지 확인하는 핵심 값
        is_observer = user.get('is_observer', False)
        
        # 기본값 설정 (사장님 원본 로직 기반)
        is_playing = False
        is_my_turn = False
        is_folded = False
        pot = 0
        room_players = []

        if room:
            is_playing = room.get('is_playing', False)
            participants = room.get('participants', [])
            folded_users = room.get('folded_users', [])
            t_idx = room.get('turn_index', -1)
            pot = room.get('pot', 0)

            # 1. 플레이어 턴 계산 (사장님 원본 로직 그대로)
            if is_playing and participants:
                if 0 <= t_idx < len(participants):
                    is_my_turn = (participants[t_idx] == user_id)
            
            # 2. 플레이어 폴드(기권) 확인
            is_folded = user_id in folded_users

            # 3. [관전자용] 현재 방에서 대결 중인 플레이어 이름들 가져오기
            # (이 데이터가 있어야 유저가 누구한테 베팅할지 버튼이 생깁니다)
            if is_observer:
                p_list = list(users_col.find({"user_id": {"$in": participants}}))
                room_players = [{"id": p['user_id'], "name": p['name']} for p in p_list]

        # 모든 데이터를 지갑(JS)으로 전송
        return jsonify({
            "success": True,
            "balance": user.get('balance', 0),
            "pot": pot,
            "is_playing": is_playing,
            "is_my_turn": is_my_turn,
            "is_folded": is_folded,
            "is_observer": is_observer,      # 이 값이 True로 바뀌면 유저 화면에 버튼이 열림!
            "room_id": str(target_room_id) if target_room_id else None,
            "room_players": room_players
        })
    
    return jsonify({"success": False, "msg": "정보를 찾을 수 없습니다."}), 404

@app.route('/logout/<user_id>')
def logout(user_id):
    # 1. 기존 기능 유지 (해당 유저의 개별 인증 세션 삭제)
    session.pop(f"auth_{user_id}", None)
    
    # 2. [추가] 1차 보안(명단 확인용) 인증 기록도 함께 삭제
    # 이렇게 해야 로그아웃 후 다시 접속할 때 1차 암호창부터 다시 만납니다.
    session.pop('list_authorized', None)
    
    # 3. 추가로 세션에 남아있는 유저 ID나 이름 정보도 정리 (권장)
    session.pop('user_id', None)
    session.pop('name', None)
    
    return redirect('/')

@app.route('/admin/logout')
def admin_logout():
    # 1. 기존 기능 유지 (관리자 권한 삭제)
    session.pop('is_admin', None)
    
    # 2. [추가] 관리자 1차 보안(검문소) 기록도 함께 삭제 (보안 보완)
    # 이 줄이 있어야 다음에 들어올 때 1차 암호부터 다시 물어봅니다.
    session.pop('admin_list_auth', None)
    
    return redirect('/')

# ==============================================================================
# [SYSTEM START]
# ==============================================================================
if __name__ == "__main__":
    # 포트 충돌 방지 및 외부 접속 허용
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)

