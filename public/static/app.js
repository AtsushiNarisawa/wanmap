// WanMap メインアプリケーション

// アプリケーション状態
const appState = {
  currentView: 'home',
  isRecording: false,
  recordingData: null
};

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
  // ローディング画面を表示
  const loading = document.getElementById('loading');
  
  // Supabase初期化
  await initSupabase();
  
  // 初期ビューをロード
  loadView('home');
  
  // ナビゲーションイベントリスナーを設定
  setupNavigation();
  
  // PWAインストールプロンプト
  setupPWAInstall();
  
  // ローディング画面を非表示
  setTimeout(() => {
    loading.classList.add('fade-out');
    setTimeout(() => {
      loading.style.display = 'none';
    }, 500);
  }, 1000);
});

// ナビゲーション設定
function setupNavigation() {
  document.getElementById('navHome')?.addEventListener('click', () => loadView('home'));
  document.getElementById('navMap')?.addEventListener('click', () => loadView('map'));
  document.getElementById('navRecord')?.addEventListener('click', () => loadView('record'));
  document.getElementById('navProfile')?.addEventListener('click', () => loadView('profile'));
  document.getElementById('navSettings')?.addEventListener('click', () => loadView('settings'));
  document.getElementById('loginBtn')?.addEventListener('click', () => showLoginModal());
}

// ビューを切り替え
function loadView(viewName) {
  appState.currentView = viewName;
  const app = document.getElementById('app');
  
  // ナビゲーションの選択状態を更新
  updateNavigation(viewName);
  
  switch (viewName) {
    case 'home':
      app.innerHTML = getHomeView();
      loadRoutes();
      break;
    case 'map':
      app.innerHTML = getMapView();
      setTimeout(() => {
        initializeMapView();
      }, 100);
      break;
    case 'record':
      app.innerHTML = getRecordView();
      setTimeout(() => {
        initializeRecordView();
      }, 100);
      break;
    case 'profile':
      app.innerHTML = getProfileView();
      loadUserProfile();
      break;
    case 'settings':
      app.innerHTML = getSettingsView();
      break;
  }
}

// ナビゲーションバーの選択状態を更新
function updateNavigation(viewName) {
  const navItems = ['navHome', 'navMap', 'navRecord', 'navProfile', 'navSettings'];
  
  navItems.forEach(item => {
    const element = document.getElementById(item);
    if (!element) return;
    
    const isActive = item.replace('nav', '').toLowerCase() === viewName;
    
    if (isActive) {
      element.classList.remove('text-gray-400');
      element.classList.add('text-green-500');
    } else {
      element.classList.remove('text-green-500');
      element.classList.add('text-gray-400');
    }
  });
}

// ===== ホーム画面 =====

function getHomeView() {
  return `
    <div class="container mx-auto px-4 py-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-route text-green-500"></i>
        最新のルート
      </h2>
      
      <!-- フィルター -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <div class="flex items-center space-x-4">
          <button class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
            <i class="fas fa-clock mr-2"></i>新着順
          </button>
          <button class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold">
            <i class="fas fa-heart mr-2"></i>人気順
          </button>
          <button class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold">
            <i class="fas fa-map-marker-alt mr-2"></i>近く
          </button>
        </div>
      </div>
      
      <!-- ルート一覧 -->
      <div id="routeList" class="space-y-4">
        <!-- JavaScriptで動的に追加 -->
      </div>
    </div>
  `;
}

async function loadRoutes() {
  const routeList = document.getElementById('routeList');
  if (!routeList) return;
  
  routeList.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-3xl text-green-500"></i></div>';
  
  try {
    const { data: routes, error } = await getRoutes({ limit: 20 });
    
    if (error) {
      console.error('ルート読み込みエラー:', error);
      routeList.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-dog text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">まだルートがありません</p>
          <p class="text-sm text-gray-400 mt-2">散歩を記録して最初のルートを共有しましょう！</p>
          <button onclick="loadView('record')" class="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
            <i class="fas fa-plus mr-2"></i>最初のルートを記録
          </button>
        </div>
      `;
      return;
    }
    
    if (!routes || routes.length === 0) {
      routeList.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-dog text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">まだルートがありません</p>
          <p class="text-sm text-gray-400 mt-2">散歩を記録して最初のルートを共有しましょう！</p>
          <button onclick="loadView('record')" class="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
            <i class="fas fa-plus mr-2"></i>最初のルートを記録
          </button>
        </div>
      `;
      return;
    }
    
    routeList.innerHTML = routes.map(route => createRouteCard(route)).join('');
  } catch (error) {
    console.error('ルート取得エラー:', error);
    routeList.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-dog text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">まだルートがありません</p>
        <p class="text-sm text-gray-400 mt-2">散歩を記録して最初のルートを共有しましょう！</p>
        <button onclick="loadView('record')" class="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
          <i class="fas fa-plus mr-2"></i>最初のルートを記録
        </button>
      </div>
    `;
  }
}

function createRouteCard(route) {
  const distance = (route.distance / 1000).toFixed(1);
  const duration = formatDuration(route.duration);
  const date = new Date(route.walked_at).toLocaleDateString('ja-JP');
  
  return `
    <div class="route-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onclick="viewRouteDetail('${route.id}')">
      <div class="aspect-video bg-gray-200 relative">
        ${route.thumbnail_url 
          ? `<img src="${route.thumbnail_url}" alt="${route.title}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-400"></i></div>`
        }
        <div class="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-sm font-semibold">
          <i class="fas fa-heart text-red-500"></i> ${route.like_count || 0}
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg text-gray-800 mb-2">${route.title}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">${route.description || ''}</p>
        
        <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span><i class="fas fa-route mr-1"></i>${distance} km</span>
          <span><i class="fas fa-clock mr-1"></i>${duration}</span>
          <span><i class="fas fa-signal mr-1"></i>${route.difficulty || 'easy'}</span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fas fa-user-circle text-2xl text-gray-400"></i>
            <div>
              <p class="text-sm font-semibold text-gray-800">${route.display_name || route.username}</p>
              ${route.dog_name ? `<p class="text-xs text-gray-500">🐕 ${route.dog_name}</p>` : ''}
            </div>
          </div>
          <span class="text-xs text-gray-400">${date}</span>
        </div>
      </div>
    </div>
  `;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  }
  return `${minutes}分`;
}

// ルート詳細を表示
async function viewRouteDetail(routeId) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-3xl text-green-500"></i></div>';
  
  const { data: route, error } = await getRouteById(routeId);
  
  if (error || !route) {
    app.innerHTML = '<div class="text-center py-12 text-red-500">ルートが見つかりませんでした</div>';
    return;
  }
  
  app.innerHTML = getRouteDetailView(route);
  
  // 地図を初期化してルートを表示
  setTimeout(() => {
    mapManager.initMap('detailMap');
    mapManager.displayRoute(route);
  }, 100);
}

function getRouteDetailView(route) {
  const distance = (route.distance / 1000).toFixed(1);
  const duration = formatDuration(route.duration);
  
  return `
    <div class="bg-white">
      <!-- 戻るボタン -->
      <div class="sticky top-16 bg-white border-b p-4 flex items-center space-x-3 z-30">
        <button onclick="loadView('home')" class="text-gray-600 hover:text-green-500">
          <i class="fas fa-arrow-left text-xl"></i>
        </button>
        <h2 class="text-xl font-bold text-gray-800">${route.title}</h2>
      </div>
      
      <!-- 地図 -->
      <div id="detailMap" style="height: 300px;"></div>
      
      <!-- ルート情報 -->
      <div class="p-6">
        <p class="text-gray-600 mb-4">${route.description || ''}</p>
        
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-500">${distance}</p>
            <p class="text-xs text-gray-500">km</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-500">${duration}</p>
            <p class="text-xs text-gray-500">時間</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">${route.difficulty || 'easy'}</p>
            <p class="text-xs text-gray-500">難易度</p>
          </div>
        </div>
        
        <!-- アクションボタン -->
        <div class="flex space-x-3 mb-6">
          <button class="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600">
            <i class="fas fa-heart mr-2"></i>いいね ${route.like_count || 0}
          </button>
          <button class="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600">
            <i class="fas fa-share mr-2"></i>共有
          </button>
        </div>
        
        <!-- 写真ギャラリー -->
        ${route.photos && route.photos.length > 0 ? `
          <h3 class="font-bold text-lg mb-3">写真</h3>
          <div class="grid grid-cols-3 gap-2 mb-6">
            ${route.photos.map(photo => `
              <img src="${photo.url}" alt="${photo.caption || ''}" class="w-full aspect-square object-cover rounded-lg">
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ===== マップ画面 =====

function getMapView() {
  return `
    <div class="h-full">
      <div id="map"></div>
    </div>
  `;
}

async function initializeMapView() {
  try {
    const position = await mapManager.getCurrentPosition();
    mapManager.initMap('map', [position.lat, position.lng], 14);
    
    // 近くのルートを表示
    const { data: routes } = await getRoutes({
      lat: position.lat,
      lng: position.lng,
      radius: 10000, // 10km
      limit: 10
    });
    
    if (routes && routes.length > 0) {
      mapManager.displayMultipleRoutes(routes);
    }
  } catch (error) {
    console.error('位置情報取得エラー:', error);
    mapManager.initMap('map');
  }
}

// ===== GPS記録画面 =====

function getRecordView() {
  return `
    <div class="h-full flex flex-col">
      <!-- 地図エリア -->
      <div id="recordMap" class="flex-1"></div>
      
      <!-- 記録情報パネル -->
      <div class="bg-white border-t p-6">
        <div id="recordStats" class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <p id="recordDistance" class="text-3xl font-bold text-green-500">0.0</p>
            <p class="text-xs text-gray-500">km</p>
          </div>
          <div class="text-center">
            <p id="recordDuration" class="text-3xl font-bold text-blue-500">00:00</p>
            <p class="text-xs text-gray-500">時間</p>
          </div>
          <div class="text-center">
            <p id="recordSpeed" class="text-3xl font-bold text-orange-500">0.0</p>
            <p class="text-xs text-gray-500">km/h</p>
          </div>
        </div>
        
        <!-- 記録ボタン -->
        <button id="recordBtn" 
                class="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg btn-ripple hover:bg-green-600"
                onclick="toggleRecording()">
          <i class="fas fa-play mr-2"></i>
          記録開始
        </button>
      </div>
    </div>
  `;
}

async function initializeRecordView() {
  try {
    const position = await mapManager.getCurrentPosition();
    mapManager.initMap('recordMap', [position.lat, position.lng], 15);
    
    // 現在位置にマーカーを表示
    L.circleMarker([position.lat, position.lng], {
      radius: 8,
      fillColor: '#10B981',
      color: 'white',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(mapManager.map).bindPopup('現在位置');
    
  } catch (error) {
    console.error('位置情報取得エラー:', error);
    // デフォルト位置（箱根）で地図を表示
    mapManager.initMap('recordMap', [35.2041, 139.0258], 13);
    
    // 通知を表示
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>位置情報が取得できませんでした。デフォルト位置（箱根）を表示しています。';
    document.body.appendChild(notification);
    
    // 5秒後に通知を削除
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// GPS記録の開始/停止
function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  
  if (!appState.isRecording) {
    // 記録開始
    mapManager.startRecording();
    appState.isRecording = true;
    
    btn.innerHTML = '<i class="fas fa-stop mr-2"></i>記録停止';
    btn.classList.remove('bg-green-500', 'hover:bg-green-600');
    btn.classList.add('bg-red-500', 'hover:bg-red-600', 'recording-pulse');
    
  } else {
    // 記録停止
    const recordingData = mapManager.stopRecording();
    appState.isRecording = false;
    appState.recordingData = recordingData;
    
    btn.innerHTML = '<i class="fas fa-play mr-2"></i>記録開始';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'recording-pulse');
    btn.classList.add('bg-green-500', 'hover:bg-green-600');
    
    // 保存画面を表示
    if (recordingData && recordingData.path.length > 1) {
      showSaveRouteModal(recordingData);
    } else {
      alert('記録されたデータが不十分です');
    }
  }
}

// 記録UIを更新（GPS更新時に呼ばれる）
window.updateRecordingUI = function(distance, duration) {
  const distanceEl = document.getElementById('recordDistance');
  const durationEl = document.getElementById('recordDuration');
  const speedEl = document.getElementById('recordSpeed');
  
  if (distanceEl) {
    distanceEl.textContent = (distance / 1000).toFixed(1);
  }
  
  if (durationEl) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    durationEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (speedEl && duration > 0) {
    const speed = (distance / 1000) / (duration / 3600); // km/h
    speedEl.textContent = speed.toFixed(1);
  }
};

// ルート保存モーダルを表示
function showSaveRouteModal(recordingData) {
  const user = getCurrentUser();
  if (!user) {
    alert('ログインしてください');
    showLoginModal();
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
  modal.style.zIndex = '9999';
  modal.innerHTML = `
    <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-save text-green-500 mr-2"></i>
          ルートを保存
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">タイトル *</label>
            <input type="text" id="routeTitle" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="例: 箱根湖畔散歩コース"
                   value="テスト散歩 ${new Date().toLocaleDateString('ja-JP')}">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">説明</label>
            <textarea id="routeDescription" rows="3"
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="このルートの特徴や見どころを教えてください"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">難易度</label>
            <select id="routeDifficulty" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="easy">簡単</option>
              <option value="moderate">普通</option>
              <option value="hard">難しい</option>
            </select>
          </div>
          
          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">記録データ:</p>
            <p class="font-semibold">距離: ${(recordingData.distance / 1000).toFixed(1)} km</p>
            <p class="font-semibold">時間: ${formatDuration(recordingData.duration)}</p>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button onclick="this.closest('.fixed').remove()" 
                  class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold">
            キャンセル
          </button>
          <button onclick="saveRecordedRoute()" 
                  class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600">
            保存
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// 記録したルートを保存
async function saveRecordedRoute() {
  const title = document.getElementById('routeTitle')?.value;
  const description = document.getElementById('routeDescription')?.value;
  const difficulty = document.getElementById('routeDifficulty')?.value;
  
  if (!title) {
    alert('タイトルを入力してください');
    return;
  }
  
  const recordingData = appState.recordingData;
  if (!recordingData) {
    alert('記録データがありません');
    return;
  }
  
  // PostGISのLINESTRING形式に変換
  const pathWKT = `LINESTRING(${recordingData.path.map(p => `${p[1]} ${p[0]}`).join(', ')})`;
  const startPoint = recordingData.path[0];
  const endPoint = recordingData.path[recordingData.path.length - 1];
  
  const routeData = {
    title,
    description,
    difficulty,
    path: pathWKT,
    start_point: `POINT(${startPoint[1]} ${startPoint[0]})`,
    end_point: `POINT(${endPoint[1]} ${endPoint[0]})`,
    distance: recordingData.distance,
    duration: recordingData.duration,
    walked_at: recordingData.startTime.toISOString()
  };
  
  // Supabaseに保存
  const { data, error } = await saveRoute(routeData);
  
  if (error) {
    console.error('保存エラー:', error);
    alert('保存に失敗しました: ' + error.message);
    return;
  }
  
  console.log('ルート保存成功:', data);
  
  // 全てのモーダルを閉じる
  const modals = document.querySelectorAll('.fixed');
  modals.forEach(modal => modal.remove());
  
  // ホーム画面に遷移
  loadView('home');
  
  // 遷移後に成功メッセージを表示
  setTimeout(() => {
    alert('ルートを保存しました！ホーム画面に保存したルートが表示されています。');
  }, 300);
}

// ===== プロフィール画面 =====

function getProfileView() {
  const user = getCurrentUser();
  
  if (!user) {
    return `
      <div class="container mx-auto px-4 py-12 text-center">
        <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 mb-6">プロフィールを表示するにはログインしてください</p>
        <button onclick="showLoginModal()" class="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
          ログイン
        </button>
      </div>
    `;
  }
  
  return `
    <div class="container mx-auto px-4 py-6">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center space-x-4 mb-4">
          <i class="fas fa-user-circle text-6xl text-gray-400"></i>
          <div>
            <h3 class="text-xl font-bold text-gray-800">${user.email}</h3>
            <p class="text-sm text-gray-500">@${user.email.split('@')[0]}</p>
          </div>
        </div>
        
        <button onclick="signOut(); loadView('home');" 
                class="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600">
          <i class="fas fa-sign-out-alt mr-2"></i>
          ログアウト
        </button>
      </div>
      
      <div id="userRoutes">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-route text-green-500 mr-2"></i>
          マイルート
        </h3>
        <p class="text-center text-gray-500 py-8">読み込み中...</p>
      </div>
    </div>
  `;
}

async function loadUserProfile() {
  // ユーザーのルートを読み込み（実装はSupabase設定後）
}

// ===== 設定画面 =====

function getSettingsView() {
  return `
    <div class="container mx-auto px-4 py-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-cog text-green-500"></i>
        設定
      </h2>
      
      <div class="bg-white rounded-lg shadow-md divide-y">
        <div class="p-4">
          <h3 class="font-semibold text-gray-800 mb-2">データベース設定</h3>
          <p class="text-sm text-gray-600 mb-3">Supabaseの接続状態を確認できます</p>
          <button onclick="checkSupabaseStatus()" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            接続テスト
          </button>
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-gray-800 mb-2">セットアップガイド</h3>
          <p class="text-sm text-gray-600 mb-3">データベースの設定方法</p>
          <a href="/database/README.md" target="_blank" class="text-green-500 text-sm underline">
            database/README.mdを見る
          </a>
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-gray-800 mb-2">アプリ情報</h3>
          <p class="text-sm text-gray-600">バージョン: 1.0.0</p>
          <p class="text-sm text-gray-600">開発: DogHub by 篤</p>
        </div>
      </div>
    </div>
  `;
}

async function checkSupabaseStatus() {
  try {
    const response = await axios.get('/api/health');
    const { supabase } = response.data;
    
    if (supabase) {
      alert('✅ Supabase接続: 正常\n\nデータベースが正しく設定されています。');
    } else {
      alert('⚠️ Supabase未設定\n\n.dev.varsファイルにSupabase APIキーを設定してください。\n詳細は database/README.md を参照してください。');
    }
  } catch (error) {
    alert('❌ 接続エラー\n\nサーバーに接続できません。');
  }
}

// ===== ログインモーダル =====

// モーダルを確実に閉じるヘルパー関数（data-modal属性でモーダルのみを対象）
function closeAllModals() {
  const modals = document.querySelectorAll('[data-modal="true"]');
  console.log('closeAllModals called, found:', modals.length, 'modals');
  modals.forEach(modal => {
    console.log('Removing modal:', modal);
    modal.remove();
  });
}

function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
  modal.style.zIndex = '9999';
  modal.setAttribute('data-modal', 'true');
  modal.innerHTML = `
    <div class="bg-white rounded-lg w-full max-w-md">
      <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-user-circle text-green-500 mr-2"></i>
          ログイン
        </h3>
        
        <div id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
            <input type="email" id="loginEmail" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="your@email.com">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">パスワード</label>
            <input type="password" id="loginPassword" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="••••••••">
          </div>
          
          <button onclick="handleLogin()" 
                  class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600">
            ログイン
          </button>
          
          <p class="text-center text-sm text-gray-600">
            アカウントをお持ちでない場合は
            <button onclick="showSignupForm()" class="text-green-500 font-semibold">
              新規登録
            </button>
          </p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;
  
  if (!email || !password) {
    alert('メールアドレスとパスワードを入力してください');
    closeAllModals();
    return;
  }
  
  try {
    const { data, error } = await signIn(email, password);
    
    if (error) {
      alert('ログインに失敗しました: ' + error.message);
      closeAllModals();
      return;
    }
    
    // ログイン成功
    console.log('ログイン成功:', data);
    console.log('モーダルを閉じます...');
    
    // モーダルを閉じる
    closeAllModals();
    
    // ホーム画面に遷移
    loadView('home');
    
    // 遷移後にメッセージを表示
    setTimeout(() => {
      alert('ログインしました！');
    }, 300);
  } catch (err) {
    console.error('ログインエラー:', err);
    alert('ログイン処理中にエラーが発生しました');
    closeAllModals();
  }
}

// ===== 新規登録モーダル =====

function showSignupForm() {
  // 既存のモーダルを削除
  closeAllModals();
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
  modal.style.zIndex = '9999';
  modal.setAttribute('data-modal', 'true');
  modal.innerHTML = `
    <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-user-plus text-green-500 mr-2"></i>
          新規登録
        </h3>
        
        <div id="signupForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス *</label>
            <input type="email" id="signupEmail" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="your@email.com">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">パスワード *</label>
            <input type="password" id="signupPassword" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="8文字以上">
            <p class="text-xs text-gray-500 mt-1">8文字以上の強力なパスワードを設定してください</p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">ユーザー名 *</label>
            <input type="text" id="signupUsername" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="例: atsushi_doghub">
            <p class="text-xs text-gray-500 mt-1">半角英数字とアンダースコアのみ</p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">表示名 *</label>
            <input type="text" id="signupDisplayName" 
                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="例: 篤志">
          </div>
          
          <button onclick="handleSignup()" 
                  class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600">
            登録
          </button>
          
          <p class="text-center text-sm text-gray-600">
            既にアカウントをお持ちの方は
            <button onclick="showLoginModal()" class="text-green-500 font-semibold">
              ログイン
            </button>
          </p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleSignup() {
  const email = document.getElementById('signupEmail')?.value;
  const password = document.getElementById('signupPassword')?.value;
  const username = document.getElementById('signupUsername')?.value;
  const displayName = document.getElementById('signupDisplayName')?.value;
  
  if (!email || !password || !username || !displayName) {
    alert('すべての項目を入力してください');
    closeAllModals();
    return;
  }
  
  if (password.length < 8) {
    alert('パスワードは8文字以上で設定してください');
    closeAllModals();
    return;
  }
  
  const { data, error } = await signUp(email, password, username, displayName);
  
  if (error) {
    alert('登録に失敗しました: ' + error.message);
    closeAllModals();
    return;
  }
  
  closeAllModals();
  alert('登録メールを送信しました！\n\nメールボックスを確認して、認証リンクをクリックしてください。');
}

// ===== PWAインストール =====

let deferredPrompt;

function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // インストールバナーを表示（オプション）
    showInstallBanner();
  });
}

function showInstallBanner() {
  // 実装は任意
}
