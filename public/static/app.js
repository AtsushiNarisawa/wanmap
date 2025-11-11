// WanMap Frontend Application

// グローバル変数
let supabase = null;
let currentUser = null;
let map = null;
let currentLocation = null;
let recordingRoute = false;
let routePoints = [];
let routePolyline = null;
let watchId = null;

// ===== 初期化 =====

async function init() {
  try {
    // Supabase設定を取得
    const configResponse = await axios.get('/api/config');
    const { supabaseUrl, supabaseAnonKey } = configResponse.data;
    
    if (supabaseUrl && supabaseAnonKey) {
      supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase初期化完了');
      
      // セッションチェック
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        currentUser = data.session.user;
        console.log('✅ ユーザーログイン済み:', currentUser.email);
      }
    } else {
      console.warn('⚠️ Supabase未設定（モックモード）');
    }
  } catch (error) {
    console.error('❌ 初期化エラー:', error);
  }
  
  // イベントリスナー設定
  setupEventListeners();
  
  // ホーム画面を表示
  showHome();
  
  // ローディング画面を非表示
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 1000);
  
  // PWAインストールプロンプト
  setupPWAPrompt();
}

// ===== イベントリスナー =====

function setupEventListeners() {
  // ナビゲーション
  document.getElementById('navHome').addEventListener('click', showHome);
  document.getElementById('navMap').addEventListener('click', showMap);
  document.getElementById('navRecord').addEventListener('click', showRecord);
  document.getElementById('navProfile').addEventListener('click', showProfile);
  document.getElementById('navSettings').addEventListener('click', showSettings);
  
  // ログインボタン
  document.getElementById('loginBtn').addEventListener('click', () => {
    if (currentUser) {
      showProfile();
    } else {
      showLogin();
    }
  });
}

// ===== ナビゲーション =====

function updateNavigation(activeId) {
  const navButtons = ['navHome', 'navMap', 'navProfile', 'navSettings'];
  navButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (id === activeId) {
      btn.classList.remove('text-gray-400');
      btn.classList.add('text-green-500');
    } else {
      btn.classList.remove('text-green-500');
      btn.classList.add('text-gray-400');
    }
  });
}

// ===== ホーム画面 =====

async function showHome() {
  updateNavigation('navHome');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container mx-auto px-4 py-6 space-y-6">
      <!-- ヒーローセクション -->
      <div class="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold mb-2">
          <i class="fas fa-dog mr-2"></i>
          愛犬と一緒に散歩しよう
        </h2>
        <p class="text-green-100 mb-4">
          全国の飼い主が共有する散歩ルートを探索
        </p>
        <button onclick="showRecord()" class="bg-white text-green-600 px-6 py-2 rounded-full font-bold hover:bg-green-50 transition">
          <i class="fas fa-plus mr-2"></i>
          ルートを記録
        </button>
      </div>

      <!-- クイック統計 -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 text-center shadow">
          <i class="fas fa-route text-green-500 text-2xl mb-2"></i>
          <div class="text-2xl font-bold text-gray-800">1,234</div>
          <div class="text-xs text-gray-500">ルート</div>
        </div>
        <div class="bg-white rounded-xl p-4 text-center shadow">
          <i class="fas fa-users text-blue-500 text-2xl mb-2"></i>
          <div class="text-2xl font-bold text-gray-800">567</div>
          <div class="text-xs text-gray-500">ユーザー</div>
        </div>
        <div class="bg-white rounded-xl p-4 text-center shadow">
          <i class="fas fa-heart text-red-500 text-2xl mb-2"></i>
          <div class="text-2xl font-bold text-gray-800">8,901</div>
          <div class="text-xs text-gray-500">いいね</div>
        </div>
      </div>

      <!-- 人気ルート -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-fire text-orange-500 mr-2"></i>
          人気ルート
        </h3>
        <div id="popularRoutes" class="space-y-4">
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl"></i>
          </div>
        </div>
      </div>

      <!-- DogHub宣伝バナー -->
      <div class="bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl p-6 text-white">
        <h3 class="text-xl font-bold mb-2">
          <i class="fas fa-hotel mr-2"></i>
          DogHub 箱根
        </h3>
        <p class="text-purple-100 mb-4">
          愛犬と泊まれるホテル＆カフェ<br>
          箱根の大自然で特別な時間を
        </p>
        <a href="https://doghub.jp" target="_blank" class="inline-block bg-white text-purple-600 px-6 py-2 rounded-full font-bold hover:bg-purple-50 transition">
          詳しく見る
          <i class="fas fa-external-link-alt ml-2"></i>
        </a>
      </div>
    </div>
  `;
  
  // 人気ルートを読み込み
  loadPopularRoutes();
}

async function loadPopularRoutes() {
  try {
    const response = await axios.get('/api/routes?limit=5');
    const routes = response.data.routes || [];
    
    const container = document.getElementById('popularRoutes');
    if (routes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <i class="fas fa-paw text-3xl mb-2"></i>
          <p>まだルートがありません</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = routes.map(route => `
      <div class="route-card bg-white rounded-xl shadow-md overflow-hidden cursor-pointer" onclick="showRouteDetail('${route.id}')">
        <div class="flex">
          <div class="w-24 h-24 bg-gray-200 flex-shrink-0">
            ${route.thumbnail_url ? `
              <img src="${route.thumbnail_url}" alt="${route.title}" class="w-full h-full object-cover">
            ` : `
              <div class="w-full h-full flex items-center justify-center text-gray-400">
                <i class="fas fa-image text-2xl"></i>
              </div>
            `}
          </div>
          <div class="flex-1 p-4">
            <h4 class="font-bold text-gray-800 mb-1">${route.title}</h4>
            <p class="text-sm text-gray-600 mb-2 line-clamp-1">${route.description || ''}</p>
            <div class="flex items-center space-x-3 text-xs text-gray-500">
              <span><i class="fas fa-route mr-1"></i>${(route.distance / 1000).toFixed(1)}km</span>
              <span><i class="fas fa-clock mr-1"></i>${Math.floor(route.duration / 60)}分</span>
              <span><i class="fas fa-heart text-red-400 mr-1"></i>${route.like_count}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('❌ ルート読み込みエラー:', error);
  }
}

// ===== マップ画面 =====

function showMap() {
  updateNavigation('navMap');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="relative">
      <div id="mapContainer" class="map-container"></div>
      
      <!-- 検索バー -->
      <div class="absolute top-4 left-4 right-4 z-10">
        <div class="bg-white rounded-full shadow-lg p-2 flex items-center">
          <i class="fas fa-search text-gray-400 ml-3"></i>
          <input 
            type="text" 
            placeholder="エリアで検索..." 
            class="flex-1 px-4 py-2 outline-none"
          >
          <button class="bg-green-500 text-white px-4 py-2 rounded-full">
            検索
          </button>
        </div>
      </div>
      
      <!-- 現在地ボタン -->
      <button 
        onclick="centerMapToCurrentLocation()" 
        class="absolute bottom-4 right-4 bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition z-10"
      >
        <i class="fas fa-crosshairs text-xl"></i>
      </button>
    </div>
  `;
  
  // Leafletマップ初期化
  setTimeout(initMap, 100);
}

function initMap() {
  if (map) {
    map.remove();
  }
  
  // デフォルト位置（箱根）
  const defaultLat = 35.2041;
  const defaultLng = 139.0258;
  
  map = L.map('mapContainer').setView([defaultLat, defaultLng], 13);
  
  // OpenStreetMapタイル
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  // 現在地を取得
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocation = [latitude, longitude];
        map.setView(currentLocation, 15);
        
        // 現在地マーカー
        L.marker(currentLocation, {
          icon: L.divIcon({
            className: 'current-location-marker',
            iconSize: [20, 20]
          })
        }).addTo(map);
      },
      (error) => {
        console.warn('位置情報取得失敗:', error);
      }
    );
  }
  
  // サンプルルートを表示
  loadRoutesOnMap();
}

async function loadRoutesOnMap() {
  try {
    const response = await axios.get('/api/routes');
    const routes = response.data.routes || [];
    
    routes.forEach(route => {
      // マーカーを追加（実際はルートの開始地点）
      // TODO: 実際のルート座標を使用
    });
  } catch (error) {
    console.error('❌ マップルート読み込みエラー:', error);
  }
}

function centerMapToCurrentLocation() {
  if (map && currentLocation) {
    map.setView(currentLocation, 15);
  }
}

// ===== 記録画面 =====

function showRecord() {
  if (!supabase) {
    alert('⚠️ Supabase未設定です。先にAPIキーを設定してください。');
    return;
  }
  
  if (!currentUser) {
    alert('ログインが必要です');
    showLogin();
    return;
  }
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="relative">
      <div id="recordMapContainer" class="map-container"></div>
      
      <!-- 記録情報パネル -->
      <div class="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-lg p-4 z-10">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-green-600" id="recordDistance">0.0</div>
            <div class="text-xs text-gray-500">距離 (km)</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600" id="recordTime">00:00</div>
            <div class="text-xs text-gray-500">時間</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-600" id="recordSpeed">0.0</div>
            <div class="text-xs text-gray-500">速度 (km/h)</div>
          </div>
        </div>
      </div>
      
      <!-- 記録ボタン -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <button 
          id="recordBtn"
          onclick="toggleRecording()"
          class="record-button bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
        >
          <i class="fas fa-play text-3xl"></i>
        </button>
      </div>
    </div>
  `;
  
  // 記録用マップ初期化
  setTimeout(initRecordMap, 100);
}

function initRecordMap() {
  if (map) {
    map.remove();
  }
  
  const defaultLat = 35.2041;
  const defaultLng = 139.0258;
  
  map = L.map('recordMapContainer').setView([defaultLat, defaultLng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  // 現在地を取得
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocation = [latitude, longitude];
        map.setView(currentLocation, 16);
        
        L.marker(currentLocation, {
          icon: L.divIcon({
            className: 'current-location-marker',
            iconSize: [20, 20]
          })
        }).addTo(map);
      }
    );
  }
}

let recordingStartTime = null;
let recordingInterval = null;

function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  const icon = btn.querySelector('i');
  
  if (!recordingRoute) {
    // 記録開始
    startRecording();
    recordingRoute = true;
    btn.classList.add('recording');
    icon.classList.remove('fa-play');
    icon.classList.add('fa-stop');
  } else {
    // 記録停止
    stopRecording();
    recordingRoute = false;
    btn.classList.remove('recording');
    icon.classList.remove('fa-stop');
    icon.classList.add('fa-play');
  }
}

function startRecording() {
  routePoints = [];
  recordingStartTime = Date.now();
  
  // GPS追跡開始
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // 精度が50m以下の場合のみ記録
        if (accuracy <= 50) {
          const point = [latitude, longitude];
          routePoints.push(point);
          
          // マップ上にルートを描画
          if (routePolyline) {
            map.removeLayer(routePolyline);
          }
          
          routePolyline = L.polyline(routePoints, {
            color: '#10B981',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          
          // マップを現在地に追従
          map.setView(point, 16);
          
          // 統計を更新
          updateRecordingStats();
        }
      },
      (error) => {
        console.error('GPS追跡エラー:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  }
  
  // タイマー開始
  recordingInterval = setInterval(updateRecordingStats, 1000);
}

function stopRecording() {
  // GPS追跡停止
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  // タイマー停止
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  
  // ルート保存画面を表示
  if (routePoints.length >= 2) {
    showSaveRouteDialog();
  } else {
    alert('ルートが短すぎます。もう少し移動してください。');
  }
}

function updateRecordingStats() {
  if (!recordingStartTime) return;
  
  // 経過時間
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById('recordTime').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // 距離計算
  let totalDistance = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const dist = calculateDistance(routePoints[i-1], routePoints[i]);
    totalDistance += dist;
  }
  document.getElementById('recordDistance').textContent = (totalDistance / 1000).toFixed(2);
  
  // 速度計算
  if (elapsed > 0) {
    const speedKmh = (totalDistance / elapsed) * 3.6;
    document.getElementById('recordSpeed').textContent = speedKmh.toFixed(1);
  }
}

function calculateDistance(point1, point2) {
  const R = 6371000; // 地球の半径（メートル）
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
  const deltaLng = (point2[1] - point1[1]) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function showSaveRouteDialog() {
  // TODO: ルート保存ダイアログ実装
  alert('ルート保存機能は開発中です');
}

// ===== プロフィール画面 =====

function showProfile() {
  updateNavigation('navProfile');
  
  if (!currentUser) {
    showLogin();
    return;
  }
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container mx-auto px-4 py-6">
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-3xl text-gray-400"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">${currentUser.email}</h2>
            <p class="text-gray-500">@${currentUser.email.split('@')[0]}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 text-center py-4 border-t">
          <div>
            <div class="text-2xl font-bold text-gray-800">12</div>
            <div class="text-xs text-gray-500">ルート</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800">145</div>
            <div class="text-xs text-gray-500">フォロワー</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800">98</div>
            <div class="text-xs text-gray-500">フォロー中</div>
          </div>
        </div>
      </div>
      
      <button 
        onclick="logout()"
        class="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition"
      >
        <i class="fas fa-sign-out-alt mr-2"></i>
        ログアウト
      </button>
    </div>
  `;
}

// ===== 設定画面 =====

function showSettings() {
  updateNavigation('navSettings');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container mx-auto px-4 py-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">設定</h2>
      
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <button class="w-full px-6 py-4 text-left hover:bg-gray-50 transition flex items-center justify-between border-b">
          <span><i class="fas fa-bell mr-3 text-gray-400"></i>通知設定</span>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </button>
        
        <button class="w-full px-6 py-4 text-left hover:bg-gray-50 transition flex items-center justify-between border-b">
          <span><i class="fas fa-lock mr-3 text-gray-400"></i>プライバシー</span>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </button>
        
        <button class="w-full px-6 py-4 text-left hover:bg-gray-50 transition flex items-center justify-between border-b">
          <span><i class="fas fa-question-circle mr-3 text-gray-400"></i>ヘルプ</span>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </button>
        
        <button class="w-full px-6 py-4 text-left hover:bg-gray-50 transition flex items-center justify-between">
          <span><i class="fas fa-info-circle mr-3 text-gray-400"></i>アプリについて</span>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </button>
      </div>
      
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>WanMap v1.0.0</p>
        <p class="mt-2">Made with ❤️ for dog lovers</p>
      </div>
    </div>
  `;
}

// ===== ログイン画面 =====

function showLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-md mx-auto">
        <div class="text-center mb-8">
          <i class="fas fa-dog text-6xl text-green-500 mb-4"></i>
          <h2 class="text-3xl font-bold text-gray-800">WanMap</h2>
          <p class="text-gray-600 mt-2">愛犬の散歩ルート共有</p>
        </div>
        
        <div class="bg-white rounded-2xl shadow-lg p-8">
          <form onsubmit="handleLogin(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input 
                type="email" 
                id="loginEmail"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input 
                type="password" 
                id="loginPassword"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              >
            </div>
            
            <button 
              type="submit"
              class="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition"
            >
              ログイン
            </button>
          </form>
          
          <div class="mt-6 text-center">
            <button 
              onclick="showSignup()"
              class="text-green-500 hover:text-green-600 font-medium"
            >
              アカウントを作成
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(event) {
  event.preventDefault();
  
  if (!supabase) {
    alert('⚠️ Supabase未設定です。管理者にお問い合わせください。');
    return;
  }
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    currentUser = data.user;
    alert('✅ ログイン成功！');
    showHome();
  } catch (error) {
    alert('❌ ログイン失敗: ' + error.message);
  }
}

function showSignup() {
  alert('新規登録機能は開発中です。\n\n現在はSupabaseダッシュボードから直接ユーザーを作成してください。');
}

async function logout() {
  if (!supabase) return;
  
  try {
    await supabase.auth.signOut();
    currentUser = null;
    alert('✅ ログアウトしました');
    showHome();
  } catch (error) {
    alert('❌ ログアウト失敗: ' + error.message);
  }
}

// ===== ルート詳細 =====

async function showRouteDetail(routeId) {
  try {
    const response = await axios.get(`/api/routes/${routeId}`);
    const route = response.data;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container mx-auto px-4 py-6">
        <button onclick="showHome()" class="mb-4 text-green-500 hover:text-green-600">
          <i class="fas fa-arrow-left mr-2"></i>戻る
        </button>
        
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div id="routeDetailMap" class="h-64"></div>
          
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">${route.title}</h2>
            <p class="text-gray-600 mb-4">${route.description || ''}</p>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-gray-500 text-sm mb-1">距離</div>
                <div class="text-2xl font-bold text-green-600">${(route.distance / 1000).toFixed(1)} km</div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-gray-500 text-sm mb-1">時間</div>
                <div class="text-2xl font-bold text-blue-600">${Math.floor(route.duration / 60)} 分</div>
              </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t">
              <div class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div class="font-medium text-gray-800">${route.display_name}</div>
                  <div class="text-sm text-gray-500">@${route.username}</div>
                </div>
              </div>
              
              <button class="bg-red-100 text-red-600 px-4 py-2 rounded-full hover:bg-red-200 transition">
                <i class="fas fa-heart mr-2"></i>${route.like_count}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // ルート詳細マップを表示
    setTimeout(() => {
      const detailMap = L.map('routeDetailMap').setView([route.path[0][0], route.path[0][1]], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(detailMap);
      
      L.polyline(route.path, {
        color: '#10B981',
        weight: 4,
        opacity: 0.8
      }).addTo(detailMap);
    }, 100);
  } catch (error) {
    console.error('❌ ルート詳細読み込みエラー:', error);
  }
}

// ===== PWAインストールプロンプト =====

let deferredPrompt = null;

function setupPWAPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // インストールバナーを表示
    showInstallBanner();
  });
}

function showInstallBanner() {
  // TODO: PWAインストールバナー実装
}

// ===== Service Worker登録 =====

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker登録成功:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker登録失敗:', error);
      });
  });
}

// ===== ページ読み込み時に初期化 =====

document.addEventListener('DOMContentLoaded', init);
