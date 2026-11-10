/**
 * 우리 동네 안심 효도 지도 - 메인 스크립트 (app.js)
 * 초등학생도 이해할 수 있도록 명확하고 친절하게 작성되었습니다.
 */

// 1. 기본 제공 장소 데이터 (처음 실행 시 표시될 우리 동네 단골 장소들)
const DEFAULT_PLACES = [
  {
    id: 1,
    name: "우리 동네 큰병원",
    desc: "정기 검진 및 내과",
    address: "서울 강남구 강남대로 396",
    lat: 37.498095,
    lng: 127.027610,
    phone: "02-1234-5678",
    icon: "🏥",
    color: "#ffe5e5"
  },
  {
    id: 2,
    name: "행복 약국",
    desc: "병원 바로 앞 약국",
    address: "서울 강남구 테헤란로 101",
    lat: 37.497550,
    lng: 127.028500,
    phone: "02-2345-6789",
    icon: "💊",
    color: "#fff3e0"
  },
  {
    id: 3,
    name: "초록 산책 공원",
    desc: "매일 아침 걷기 운동",
    address: "서울 서초구 사임당로 150",
    lat: 37.499000,
    lng: 127.026000,
    phone: "02-3456-7890",
    icon: "🌳",
    color: "#e8f5e9"
  },
  {
    id: 4,
    name: "동네 어르신 복지관",
    desc: "바둑, 노래교실, 점심 식사",
    address: "서울 강남구 역삼로 120",
    lat: 37.496500,
    lng: 127.029000,
    phone: "02-4567-8901",
    icon: "👵",
    color: "#e3f2fd"
  },
  {
    id: 5,
    name: "단골 하나로마트",
    desc: "싱싱한 과일과 장보기",
    address: "서울 강남구 도곡로 200",
    lat: 37.495200,
    lng: 127.025500,
    phone: "02-5678-9012",
    icon: "🛒",
    color: "#f3e5f5"
  }
];

// 상태 저장 객체 (시냇물님의 최신 카카오 JavaScript 키가 기본으로 쏙 탑재되었어요!)
const KAKAO_DEFAULT_KEY = 'db2efb31592d0c8d56f03ce29093238b';

// 로컬스토리지에 예전 키가 남아있으면 새 키로 갱신
if (localStorage.getItem('kakao_app_key') && localStorage.getItem('kakao_app_key') !== KAKAO_DEFAULT_KEY) {
  localStorage.setItem('kakao_app_key', KAKAO_DEFAULT_KEY);
}

let appState = {
  kakaoKey: KAKAO_DEFAULT_KEY,
  places: JSON.parse(localStorage.getItem('my_favorite_places')) || DEFAULT_PLACES,
  selectedPlace: null,
  map: null,
  marker: null,
  isMapLoaded: false
};

// DOM 요소 모음
const elements = {
  keyNoticeBanner: document.getElementById('keyNoticeBanner'),
  placesGrid: document.getElementById('placesGrid'),
  mapContainer: document.getElementById('map'),
  mapFallback: document.getElementById('mapFallback'),
  selectedIcon: document.getElementById('selectedIcon'),
  selectedName: document.getElementById('selectedName'),
  selectedAddress: document.getElementById('selectedAddress'),
  navRouteBtn: document.getElementById('navRouteBtn'),
  callPhoneBtn: document.getElementById('callPhoneBtn'),
  myLocationBtn: document.getElementById('myLocationBtn'),
  
  // 모달 관련
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  kakaoAppKeyInput: document.getElementById('kakaoAppKey'),
  placeListEditor: document.getElementById('placeListEditor'),
  addNewPlaceBtn: document.getElementById('addNewPlaceBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  resetDefaultsBtn: document.getElementById('resetDefaultsBtn')
};

// ----------------------------------------------------
// 2. 초기화 실행
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  setupEventListeners();

  // 첫 번째 장소를 기본 선택
  if (appState.places.length > 0) {
    selectPlace(appState.places[0]);
  }

  // 카카오 키가 있으면 카카오 지도 불러오기
  if (appState.kakaoKey) {
    loadKakaoMapSDK(appState.kakaoKey);
    elements.keyNoticeBanner.style.display = 'none';
  } else {
    elements.keyNoticeBanner.style.display = 'block';
  }
});

// ----------------------------------------------------
// 3. UI 렌더링 함수들
// ----------------------------------------------------
function initUI() {
  renderPlaceButtons();
}

// 큰 버튼들 렌더링
function renderPlaceButtons() {
  elements.placesGrid.innerHTML = '';

  appState.places.forEach((place) => {
    const btn = document.createElement('button');
    btn.className = 'place-card-btn';
    btn.id = `place-btn-${place.id}`;
    if (appState.selectedPlace && appState.selectedPlace.id === place.id) {
      btn.classList.add('active');
    }

    btn.innerHTML = `
      <span class="place-card-icon">${place.icon || '📍'}</span>
      <div class="place-card-text">
        <span class="place-card-title">${place.name}</span>
        <span class="place-card-sub">${place.desc || place.address}</span>
      </div>
    `;

    btn.addEventListener('click', () => {
      selectPlace(place);
    });

    elements.placesGrid.appendChild(btn);
  });
}

// 특정 장소 선택 시 동작
function selectPlace(place) {
  appState.selectedPlace = place;

  // 버튼 active 표시 갱신
  document.querySelectorAll('.place-card-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`place-btn-${place.id}`);
  if (activeBtn) activeBtn.classList.add('active');

  // 상단 상세 정보 표시
  elements.selectedIcon.textContent = place.icon || '📍';
  elements.selectedName.textContent = place.name;
  elements.selectedAddress.textContent = place.address;

  // 길 찾기 링크 갱신 (카카오맵 연동 URL)
  // 도보/자동차 길안내: https://map.kakao.com/link/to/장소명,위도,경도
  const navUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
  elements.navRouteBtn.href = navUrl;
  elements.navRouteBtn.querySelector('span:last-child').textContent = `[${place.name}] 길 안내`;

  // 전화 걸기 버튼 갱신
  if (place.phone) {
    elements.callPhoneBtn.href = `tel:${place.phone.replace(/[^0-9]/g, '')}`;
    elements.callPhoneBtn.style.display = 'inline-flex';
    elements.callPhoneBtn.querySelector('span:last-child').textContent = `전화 걸기 (${place.phone})`;
  } else {
    elements.callPhoneBtn.style.display = 'none';
  }

  // 지도가 켜져 있으면 지도 이동
  if (appState.map && appState.isMapLoaded && window.kakao && window.kakao.maps) {
    const targetLatLng = new kakao.maps.LatLng(place.lat, place.lng);
    appState.map.panTo(targetLatLng);

    if (appState.marker) {
      appState.marker.setPosition(targetLatLng);
    } else {
      appState.marker = new kakao.maps.Marker({
        position: targetLatLng,
        map: appState.map
      });
    }
  }
}

// ----------------------------------------------------
// 4. 카카오 지도 SDK 동적 로딩 & 초기화
// ----------------------------------------------------
function loadKakaoMapSDK(appKey) {
  // 1) HTML head에 이미 kakao 객체가 준비되어 있는 경우
  if (window.kakao && window.kakao.maps) {
    kakao.maps.load(() => {
      initKakaoMap();
    });
    return;
  }

  // 2) 동적으로 스크립트 추가하기
  const oldScript = document.getElementById('kakao-sdk-script');
  if (oldScript) oldScript.remove();

  const script = document.createElement('script');
  script.id = 'kakao-sdk-script';
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;

  script.onload = () => {
    if (window.kakao && window.kakao.maps) {
      kakao.maps.load(() => {
        initKakaoMap();
      });
    } else {
      showMapError('카카오 지도 객체를 초기화하지 못했어요.');
    }
  };

  script.onerror = () => {
    showMapError('카카오 지도 연결에 실패했어요.');
  };

  document.head.appendChild(script);
}

function showMapError(reason) {
  elements.mapFallback.style.display = 'flex';
  elements.mapFallback.innerHTML = `
    <div style="padding: 10px; max-width: 90%;">
      <p style="font-size: 19px; color: #d6336c; font-weight: 800; margin-bottom: 8px;">⚠️ 카카오 지도를 불러오지 못했어요</p>
      <p style="font-size: 15px; color: #333; line-height: 1.5; margin-bottom: 12px;">
        카카오 개발자 사이트에 <strong>도메인 등록</strong>이 필요해요!<br>
        (도메인이 없으면 카카오가 지도를 잠시 잠가둬요)
      </p>
      <div style="background: #fff; padding: 10px 14px; border-radius: 10px; border: 1.5px dashed #ffa8a8; font-size: 14px; color: #495057; text-align: left; margin-bottom: 14px;">
        📌 <strong>해결 방법 1초 안내:</strong><br>
        1. 카카오 디벨로퍼스 접속<br>
        2. [앱 설정] > [플랫폼] > [Web]<br>
        3. 사이트 도메인에 <strong>http://localhost:3000</strong> 추가 후 저장!
      </div>
      <a href="https://developers.kakao.com/console/app/1644514/config/platform" target="_blank" style="display: inline-block; background: #fee500; color: #111; font-weight: 700; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px;">
        🔗 카카오 플랫폼 설정 바로가기
      </a>
    </div>
  `;
}

function initKakaoMap() {
  try {
    const centerLatLng = appState.selectedPlace 
      ? new kakao.maps.LatLng(appState.selectedPlace.lat, appState.selectedPlace.lng)
      : new kakao.maps.LatLng(37.498095, 127.027610);

    const mapOptions = {
      center: centerLatLng,
      level: 3
    };

    appState.map = new kakao.maps.Map(elements.mapContainer, mapOptions);

    // 컨트롤러(확대/축소 버튼) 추가
    const zoomControl = new kakao.maps.ZoomControl();
    appState.map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    // 마커 생성
    appState.marker = new kakao.maps.Marker({
      position: centerLatLng,
      map: appState.map
    });

    appState.isMapLoaded = true;
    elements.mapFallback.style.display = 'none';

    // 현재 선택된 장소로 지도 맞춰주기
    if (appState.selectedPlace) {
      selectPlace(appState.selectedPlace);
    }

  } catch (err) {
    console.error('카카오맵 초기화 에러:', err);
    showMapError(err.message || '지도 생성 중 오류가 발생했습니다.');
  }
}

// ----------------------------------------------------
// 5. 내 위치 찾기 (GPS)
// ----------------------------------------------------
function locateMyLocation() {
  if (!navigator.geolocation) {
    alert('이 스마트폰/브라우저는 현재 위치 찾기를 지원하지 않아요.');
    return;
  }

  elements.myLocationBtn.textContent = '⏳ 찾는 중...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      elements.myLocationBtn.textContent = '📍 내 위치';
      const myLat = position.coords.latitude;
      const myLng = position.coords.longitude;

      if (appState.map && appState.isMapLoaded) {
        const myLatLng = new kakao.maps.LatLng(myLat, myLng);
        appState.map.panTo(myLatLng);

        // 내 위치 마커 표시
        new kakao.maps.Marker({
          position: myLatLng,
          map: appState.map
        });
      }

      elements.selectedIcon.textContent = '🧍';
      elements.selectedName.textContent = '지금 내 현재 위치';
      elements.selectedAddress.textContent = `위도: ${myLat.toFixed(4)}, 경도: ${myLng.toFixed(4)}`;

      // 길 찾기 링크도 내 위치 기준으로
      elements.navRouteBtn.href = `https://map.kakao.com/link/map/내위치,${myLat},${myLng}`;
      elements.navRouteBtn.querySelector('span:last-child').textContent = '카카오맵에서 내 위치 보기';
    },
    (error) => {
      elements.myLocationBtn.textContent = '📍 내 위치';
      alert('위치 정보를 가져올 수 없어요. 브라우저 위치 권한을 허용해 주세요!');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ----------------------------------------------------
// 6. 설정 모달 및 장소 관리
// ----------------------------------------------------
function openSettings() {
  elements.kakaoAppKeyInput.value = appState.kakaoKey;
  renderPlaceEditorList();
  elements.settingsModal.classList.add('show');
}

function closeSettings() {
  elements.settingsModal.classList.remove('show');
}

function renderPlaceEditorList() {
  elements.placeListEditor.innerHTML = '';

  appState.places.forEach((place, index) => {
    const row = document.createElement('div');
    row.className = 'place-edit-item';
    row.innerHTML = `
      <input type="text" class="input-icon" value="${place.icon || '📍'}" title="아이콘(이모지)">
      <input type="text" class="input-name" value="${place.name}" placeholder="장소 이름">
      <input type="tel" class="input-phone" value="${place.phone || ''}" placeholder="전화번호">
      <button type="button" class="delete-item-btn" data-index="${index}">삭제</button>
    `;

    // 값 변경 감지
    const iconInput = row.querySelector('.input-icon');
    const nameInput = row.querySelector('.input-name');
    const phoneInput = row.querySelector('.input-phone');

    iconInput.addEventListener('input', (e) => { place.icon = e.target.value; });
    nameInput.addEventListener('input', (e) => { place.name = e.target.value; });
    phoneInput.addEventListener('input', (e) => { place.phone = e.target.value; });

    row.querySelector('.delete-item-btn').addEventListener('click', () => {
      if (appState.places.length <= 1) {
        alert('최소 1개의 장소는 남아있어야 해요!');
        return;
      }
      appState.places.splice(index, 1);
      renderPlaceEditorList();
    });

    elements.placeListEditor.appendChild(row);
  });
}

function addNewPlaceItem() {
  const newId = Date.now();
  appState.places.push({
    id: newId,
    name: "새 단골 장소",
    desc: "설명 입력",
    address: "서울 강남구",
    lat: 37.498095,
    lng: 127.027610,
    phone: "",
    icon: "⭐"
  });
  renderPlaceEditorList();
}

function saveSettings() {
  const newKey = elements.kakaoAppKeyInput.value.trim();
  appState.kakaoKey = newKey;
  localStorage.setItem('kakao_app_key', newKey);
  localStorage.setItem('my_favorite_places', JSON.stringify(appState.places));

  alert('설정이 저장되었어요! ✨');
  closeSettings();

  // 재렌더링 및 카카오맵 로드
  renderPlaceButtons();
  if (appState.places.length > 0) {
    selectPlace(appState.places[0]);
  }

  if (newKey) {
    elements.keyNoticeBanner.style.display = 'none';
    loadKakaoMapSDK(newKey);
  } else {
    elements.keyNoticeBanner.style.display = 'block';
  }
}

function resetToDefaults() {
  if (confirm('모든 장소 목록을 처음 기본값으로 되돌릴까요?')) {
    appState.places = JSON.parse(JSON.stringify(DEFAULT_PLACES));
    localStorage.removeItem('my_favorite_places');
    renderPlaceEditorList();
  }
}

// ----------------------------------------------------
// 7. 이벤트 리스너 연결
// ----------------------------------------------------
function setupEventListeners() {
  elements.myLocationBtn.addEventListener('click', locateMyLocation);
  elements.openSettingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.addNewPlaceBtn.addEventListener('click', addNewPlaceItem);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.resetDefaultsBtn.addEventListener('click', resetToDefaults);

  // 모달 바깥 배경 클릭 시 닫기
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettings();
  });
}
