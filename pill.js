/**
 * 똑똑한 약 챙김이 - 메인 스크립트 (pill.js)
 * 시니어 어르신들이 쉽고 즐겁게 복용을 체크할 수 있도록 돕습니다.
 */

// 카카오 앱 키 (시냇물님의 JavaScript 키)
const KAKAO_KEY = 'db2efb31592d0c8d56f03ce29093238b';

// 기본 알약 데이터 목록
const DEFAULT_PILLS = [
  {
    id: 'pill_1',
    name: '아침 혈압약 & 비타민',
    time: '아침 08:00',
    desc: '식사 후 미온수와 함께 복용',
    emoji: '🌅'
  },
  {
    id: 'pill_2',
    name: '점심 관절약 & 소화제',
    time: '점심 12:30',
    desc: '점심 식사 직후 복용',
    emoji: '☀️'
  },
  {
    id: 'pill_3',
    name: '저녁 당뇨약 & 오메가3',
    time: '저녁 19:00',
    desc: '저녁 식사 30분 후 복용',
    emoji: '🌙'
  },
  {
    id: 'pill_4',
    name: '취침 전 칼슘 & 수면 안정제',
    time: '취침 전 22:00',
    desc: '잠들기 30분 전 복용',
    emoji: '🛌'
  }
];

// 오늘 날짜 문자열 구하기 (YYYY-MM-DD 형식)
function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 오늘 날짜 한글 표시 (예: 2026년 11월 10일 화요일)
function getTodayDateKorean() {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`;
}

// 상태 관리
let pillState = {
  pills: JSON.parse(localStorage.getItem('my_pill_list')) || DEFAULT_PILLS,
  todayLog: JSON.parse(localStorage.getItem(`pill_log_${getTodayDateKey()}`)) || {}
};

// DOM 요소 모음
const elements = {
  todayDateStr: document.getElementById('todayDateStr'),
  progressText: document.getElementById('progressText'),
  progressBarFill: document.getElementById('progressBarFill'),
  pillListContainer: document.getElementById('pillListContainer'),
  shareKakaoBtn: document.getElementById('shareKakaoBtn'),
  
  // 모달 관련
  openPillSettingsBtn: document.getElementById('openPillSettingsBtn'),
  closePillModalBtn: document.getElementById('closePillModalBtn'),
  pillModal: document.getElementById('pillModal'),
  pillEditorList: document.getElementById('pillEditorList'),
  addNewPillBtn: document.getElementById('addNewPillBtn'),
  savePillsBtn: document.getElementById('savePillsBtn'),
  resetPillsBtn: document.getElementById('resetPillsBtn')
};

// ----------------------------------------------------
// 초기화
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  elements.todayDateStr.textContent = getTodayDateKorean();
  initKakaoSDK();
  renderPillCards();
  updateProgress();
  setupEventListeners();
});

// ----------------------------------------------------
// 카카오 SDK 초기화
// ----------------------------------------------------
function initKakaoSDK() {
  if (window.Kakao && !Kakao.isInitialized()) {
    try {
      Kakao.init(KAKAO_KEY);
      console.log('카카오 SDK 초기화 완료!');
    } catch (e) {
      console.warn('카카오 SDK 초기화 실패:', e);
    }
  }
}

// ----------------------------------------------------
// 알약 카드 렌더링
// ----------------------------------------------------
function renderPillCards() {
  elements.pillListContainer.innerHTML = '';

  pillState.pills.forEach((pill) => {
    const isDone = !!pillState.todayLog[pill.id];

    const card = document.createElement('article');
    card.className = `pill-card ${isDone ? 'done' : ''}`;
    card.id = `card-${pill.id}`;

    card.innerHTML = `
      <div class="pill-card-top">
        <div class="pill-emoji-badge">${pill.emoji || '💊'}</div>
        <div class="pill-details">
          <span class="pill-time-tag">⏰ ${pill.time}</span>
          <h2 class="pill-name">${pill.name}</h2>
          <p class="pill-instructions">${pill.desc || '복용 안내 없음'}</p>
        </div>
        <button class="btn-speak" title="음성으로 듣기" onclick="speakPill('${pill.time}', '${pill.name}')">
          🔊
        </button>
      </div>

      <button class="pill-check-btn" onclick="togglePillDone('${pill.id}')">
        <span class="btn-check-icon">${isDone ? '✅' : '⭕'}</span>
        <span class="btn-check-text">${isDone ? '오늘 복용 완료 (참 잘하셨어요!)' : '약 먹었어요! (터치하기)'}</span>
      </button>
    `;

    elements.pillListContainer.appendChild(card);
  });
}

// ----------------------------------------------------
// 복용 체크 토글
// ----------------------------------------------------
function togglePillDone(pillId) {
  const currentStatus = !!pillState.todayLog[pillId];
  pillState.todayLog[pillId] = !currentStatus;

  // 로컬스토리지에 저장
  localStorage.setItem(`pill_log_${getTodayDateKey()}`, JSON.stringify(pillState.todayLog));

  // 재렌더링 및 진행바 갱신
  renderPillCards();
  updateProgress();

  // 방금 체크했을 때 축하 음성 칭찬
  if (!currentStatus) {
    speakText('약 복용을 완료하셨습니다. 건강한 하루 보내세요!');
  }
}

// ----------------------------------------------------
// 진행률 업데이트
// ----------------------------------------------------
function updateProgress() {
  const total = pillState.pills.length;
  if (total === 0) {
    elements.progressText.textContent = '등록된 약이 없어요';
    elements.progressBarFill.style.width = '0%';
    return;
  }

  const doneCount = pillState.pills.filter(p => !!pillState.todayLog[p.id]).length;
  const percentage = Math.round((doneCount / total) * 100);

  elements.progressText.textContent = `총 ${total}개 중 ${doneCount}개 완료 (${percentage}%)`;
  elements.progressBarFill.style.width = `${percentage}%`;
}

// ----------------------------------------------------
// 음성 안내 (TTS)
// ----------------------------------------------------
function speakPill(time, name) {
  const text = `${time}, ${name} 드실 시간입니다.`;
  speakText(text);
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // 이전 음성 중단

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9; // 어르신을 위해 천천히
  window.speechSynthesis.speak(utterance);
}

// ----------------------------------------------------
// 카카오톡 안심 메시지 전송
// ----------------------------------------------------
function shareToKakao() {
  if (!window.Kakao) {
    alert('카카오톡 연결을 준비하는 중이에요. 잠시 후 다시 눌러주세요!');
    return;
  }

  const total = pillState.pills.length;
  const doneCount = pillState.pills.filter(p => !!pillState.todayLog[p.id]).length;
  const dateStr = getTodayDateKorean();

  const title = `💊 [약 챙김이] ${dateStr} 안심 보고`;
  const description = doneCount === total 
    ? `오늘 약을 모두 꼼꼼하게 다 챙겨 드셨어요! 👍 (${doneCount}/${total}개 완료)`
    : `오늘 약을 ${doneCount}개 챙겨 드셨어요! (${doneCount}/${total}개 완료)`;

  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: title,
        description: description,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href
        }
      },
      buttons: [
        {
          title: '약 챙김이 열어보기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href
          }
        }
      ]
    });
  } catch (err) {
    console.error('카카오 공유 실패:', err);
    // 기본 브라우저 공유 폴백
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `${title}\n${description}`,
        url: window.location.href
      });
    } else {
      alert(`[안심 메시지]\n${title}\n${description}`);
    }
  }
}

// ----------------------------------------------------
// 모달 및 약 관리 편집
// ----------------------------------------------------
function openModal() {
  renderEditorList();
  elements.pillModal.classList.add('show');
}

function closeModal() {
  elements.pillModal.classList.remove('show');
}

function renderEditorList() {
  elements.pillEditorList.innerHTML = '';

  pillState.pills.forEach((pill, index) => {
    const row = document.createElement('div');
    row.className = 'pill-edit-row';

    row.innerHTML = `
      <div class="pill-edit-top-row">
        <input type="text" class="edit-emoji" value="${pill.emoji || '💊'}" placeholder="아이콘">
        <input type="text" class="edit-name" value="${pill.name}" placeholder="약 이름">
        <input type="text" class="edit-time" value="${pill.time}" placeholder="복용 시간">
      </div>
      <div class="pill-edit-bottom-row">
        <input type="text" class="edit-desc" value="${pill.desc || ''}" placeholder="복용 방법 (예: 식후 30분)">
        <button type="button" class="btn-delete-row" data-index="${index}">삭제</button>
      </div>
    `;

    // 인풋 변경 감지
    row.querySelector('.edit-emoji').addEventListener('input', e => { pill.emoji = e.target.value; });
    row.querySelector('.edit-name').addEventListener('input', e => { pill.name = e.target.value; });
    row.querySelector('.edit-time').addEventListener('input', e => { pill.time = e.target.value; });
    row.querySelector('.edit-desc').addEventListener('input', e => { pill.desc = e.target.value; });

    row.querySelector('.btn-delete-row').addEventListener('click', () => {
      if (pillState.pills.length <= 1) {
        alert('최소 1개의 약은 등록되어 있어야 해요!');
        return;
      }
      pillState.pills.splice(index, 1);
      renderEditorList();
    });

    elements.pillEditorList.appendChild(row);
  });
}

function addNewPillItem() {
  const newId = `pill_${Date.now()}`;
  pillState.pills.push({
    id: newId,
    name: '새로운 약',
    time: '시간 입력',
    desc: '복용 안내',
    emoji: '💊'
  });
  renderEditorList();
}

function savePills() {
  localStorage.setItem('my_pill_list', JSON.stringify(pillState.pills));
  alert('약 목록이 저장되었어요! ✨');
  closeModal();
  renderPillCards();
  updateProgress();
}

function resetPills() {
  if (confirm('모든 약 목록을 처음 기본값으로 되돌릴까요?')) {
    pillState.pills = JSON.parse(JSON.stringify(DEFAULT_PILLS));
    localStorage.removeItem('my_pill_list');
    renderEditorList();
  }
}

// ----------------------------------------------------
// 이벤트 리스너 연결
// ----------------------------------------------------
function setupEventListeners() {
  elements.shareKakaoBtn.addEventListener('click', shareToKakao);
  elements.openPillSettingsBtn.addEventListener('click', openModal);
  elements.closePillModalBtn.addEventListener('click', closeModal);
  elements.addNewPillBtn.addEventListener('click', addNewPillItem);
  elements.savePillsBtn.addEventListener('click', savePills);
  elements.resetPillsBtn.addEventListener('click', resetPills);

  // 모달 배경 클릭 시 닫기
  elements.pillModal.addEventListener('click', e => {
    if (e.target === elements.pillModal) closeModal();
  });
}
