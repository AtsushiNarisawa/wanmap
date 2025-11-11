// WanMap メインアプリケーション

class WanMapApp {
  constructor() {
    this.currentView = 'home';
    this.mapManager = null;
    this.supabaseClient = null;
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  async init() {
    console.log('Initializing WanMap...');

    // Supabase設定を取得
    await this.loadSupabaseConfig();

    // イベントリスナーを設定
    this.setupEventListeners();

    // 初期ビューを表示
    this.showHome();

    // ローディング画面を非表示
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 1000);

    // PWAインストールプロンプト
    this.setupPWAPrompt();
  }

  // Supabase設定を読み込み
  async loadSupabaseConfig() {
    try {
      const response = await axios.get('/api/config');
      const { supabaseUrl, supabaseAnonKey } = response.data;

      if (supabaseUrl && supabaseAnonKey && window.supabaseClient) {
        await window.supabaseClient.init(supabaseUrl, supabaseAnonKey);
        this.supabaseClient = window.supabaseClient;
        
        // 認証状態を確認
        const user = this.supabaseClient.getCurrentUser();
        if (user) {
          this.isAuthenticated = true;
          this.currentUser = user;
        }
      } else {
        console.warn('Supabase未設定。一部機能が制限されます。');
      }
    } catch (error) {
      console.error('Supabase設定の読み込みエラー:', error);
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    // ボトムナビゲーション
    document.getElementById('navHome')?.addEventListener('click', () => this.showHome());
    document.getElementById('navMap')?.addEventListener('click', () => this.showMap());
    document.getElementById('navRecord')?.addEventListener('click', () => this.showRecording());
    document.getElementById('navProfile')?.addEventListener('click', () => this.showProfile());
    document.getElementById('navSettings')?.addEventListener('click', () => this.showSettings());

    // トップバーボタン
    document.getElementById('loginBtn')?.addEventListener('click', () => this.showAuth());
    document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMenu());
  }

  // ナビゲーションボタンの状態を更新
  updateNavigation(activeNav) {
    const navButtons = ['navHome', 'navMap', 'navProfile', 'navSettings'];
    navButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        if (btnId === activeNav) {
          btn.classList.remove('text-gray-400');
          btn.classList.add('text-green-500');
        } else {
          btn.classList.remove('text-green-500');
          btn.classList.add('text-gray-400');
        }
      }
    });
  }

  // ===== ビュー表示メソッド =====

  // ホーム画面
  showHome() {
    this.currentView = 'home';
    this.updateNavigation('navHome');

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container mx-auto px-4 py-6">
        <!-- ヘッダー -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">
            <i class="fas fa-home text-green-500"></i> ホーム
          </h1>
          <p class="text-gray-600">愛犬との散歩ルートを記録・共有しよう</p>
        </div>

        <!-- クイックアクション -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <button onclick="wanmap.showRecording()" class="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-xl shadow-lg active:scale-95 transition-transform">
            <i class="fas fa-plus-circle text-3xl mb-2"></i>
            <p class="font-semibold">散歩を記録</p>
          </button>
          <button onclick="wanmap.showMap()" class="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-xl shadow-lg active:scale-95 transition-transform">
            <i class="fas fa-map-marked-alt text-3xl mb-2"></i>
            <p class="font-semibold">ルートを探す</p>
          </button>
        </div>

        <!-- 人気のルート -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-fire text-orange-500"></i> 人気のルート
            </h2>
            <button class="text-green-500 text-sm font-semibold">もっと見る</button>
          </div>
          <div id="popularRoutes" class="space-y-4">
            <div class="text-center py-8">
              <div class="spinner mx-auto mb-4"></div>
              <p class="text-gray-500">ルートを読み込み中...</p>
            </div>
          </div>
        </div>

        <!-- DogHub 宣伝バナー -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg mt-6">
          <div class="flex items-start space-x-4">
            <i class="fas fa-hotel text-3xl"></i>
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-2">DogHub - 箱根のドッグホテル＆カフェ</h3>
              <p class="text-sm text-green-100 mb-3">愛犬と一緒に箱根を楽しもう！ドッグホテル・カフェを運営しています。</p>
              <button class="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-50 active:scale-95 transition-transform">
                詳しく見る <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 人気ルートを読み込み
    this.loadPopularRoutes();
  }

  // マップ画面
  showMap() {
    this.currentView = 'map';
    this.updateNavigation('navMap');

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="h-full">
        <div id="map-container"></div>
        
        <!-- 検索バー（地図上に浮かぶ） -->
        <div class="absolute top-4 left-4 right-4 z-10">
          <div class="bg-white rounded-full shadow-lg px-4 py-3 flex items-center space-x-3">
            <i class="fas fa-search text-gray-400"></i>
            <input 
              type="text" 
              placeholder="場所やルート名で検索..." 
              class="flex-1 outline-none text-sm"
              id="mapSearch"
            />
            <button class="text-green-500" onclick="wanmap.filterMap()">
              <i class="fas fa-filter"></i>
            </button>
          </div>
        </div>

        <!-- 現在地ボタン -->
        <button 
          onclick="wanmap.showCurrentLocation()"
          class="absolute bottom-24 right-4 bg-white text-green-500 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform"
        >
          <i class="fas fa-crosshairs text-xl"></i>
        </button>
      </div>
    `;

    // 地図を初期化
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  // 散歩記録画面
  showRecording() {
    this.currentView = 'recording';

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="h-full">
        <div id="map-container"></div>
        
        <!-- 記録中のステータス -->
        <div class="absolute top-4 left-4 right-4 z-10">
          <div id="trackingStatus" class="bg-white rounded-2xl shadow-lg p-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="stat-card border-0 shadow-none p-2">
                <div class="stat-value text-xl" id="distanceValue">0.0</div>
                <div class="stat-label text-xs">距離(km)</div>
              </div>
              <div class="stat-card border-0 shadow-none p-2">
                <div class="stat-value text-xl" id="durationValue">00:00</div>
                <div class="stat-label text-xs">時間</div>
              </div>
              <div class="stat-card border-0 shadow-none p-2">
                <div class="stat-value text-xl" id="paceValue">0</div>
                <div class="stat-label text-xs">ペース</div>
              </div>
            </div>
          </div>
        </div>

        <!-- コントロールボタン -->
        <div class="absolute bottom-24 left-0 right-0 z-10 px-4">
          <div class="flex justify-center space-x-4">
            <button 
              id="startBtn"
              onclick="wanmap.startTracking()"
              class="btn-primary text-lg px-8"
            >
              <i class="fas fa-play mr-2"></i> 記録開始
            </button>
            <button 
              id="stopBtn"
              onclick="wanmap.stopTracking()"
              class="btn-danger text-lg px-8 hidden"
            >
              <i class="fas fa-stop mr-2"></i> 記録停止
            </button>
          </div>
        </div>
      </div>
    `;

    // 地図を初期化
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  // プロフィール画面
  showProfile() {
    this.currentView = 'profile';
    this.updateNavigation('navProfile');

    if (!this.isAuthenticated) {
      this.showAuth();
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container mx-auto px-4 py-6">
        <!-- プロフィールヘッダー -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-6">
          <div class="flex items-center space-x-4">
            <img src="https://via.placeholder.com/80" alt="Avatar" class="avatar-lg">
            <div class="flex-1">
              <h2 class="text-xl font-bold text-gray-800">篤</h2>
              <p class="text-gray-600 text-sm">@atsushi</p>
              <p class="text-gray-500 text-sm mt-2">DogHub運営者、箱根在住</p>
            </div>
          </div>
          
          <!-- 統計 -->
          <div class="grid grid-cols-3 gap-4 mt-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500">12</div>
              <div class="text-sm text-gray-600">ルート</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500">45</div>
              <div class="text-sm text-gray-600">フォロワー</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500">28</div>
              <div class="text-sm text-gray-600">フォロー</div>
            </div>
          </div>
        </div>

        <!-- 犬プロフィール -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">
              <i class="fas fa-dog text-green-500"></i> 愛犬プロフィール
            </h3>
            <button class="text-green-500 text-sm font-semibold">
              <i class="fas fa-plus"></i> 追加
            </button>
          </div>
          <div class="bg-white rounded-xl shadow-md p-4">
            <div class="flex items-center space-x-3">
              <img src="https://via.placeholder.com/60" alt="Dog" class="w-16 h-16 rounded-full object-cover">
              <div>
                <h4 class="font-bold text-gray-800">ポチ</h4>
                <p class="text-sm text-gray-600">柴犬 • 5歳 • 10.5kg</p>
              </div>
            </div>
          </div>
        </div>

        <!-- マイルート -->
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fas fa-route text-green-500"></i> マイルート
          </h3>
          <div class="empty-state">
            <i class="fas fa-map"></i>
            <p>まだルートがありません</p>
            <button onclick="wanmap.showRecording()" class="btn-primary mt-4">
              最初のルートを記録
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 設定画面
  showSettings() {
    this.currentView = 'settings';
    this.updateNavigation('navSettings');

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-cog text-green-500"></i> 設定
        </h1>

        <div class="space-y-4">
          <!-- アカウント -->
          <div class="bg-white rounded-xl shadow-md">
            <button class="w-full px-6 py-4 flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <i class="fas fa-user-circle text-gray-600"></i>
                <span class="font-semibold text-gray-800">アカウント設定</span>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>

          <!-- 通知 -->
          <div class="bg-white rounded-xl shadow-md">
            <button class="w-full px-6 py-4 flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <i class="fas fa-bell text-gray-600"></i>
                <span class="font-semibold text-gray-800">通知設定</span>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>

          <!-- プライバシー -->
          <div class="bg-white rounded-xl shadow-md">
            <button class="w-full px-6 py-4 flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <i class="fas fa-shield-alt text-gray-600"></i>
                <span class="font-semibold text-gray-800">プライバシー</span>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>

          <!-- ヘルプ -->
          <div class="bg-white rounded-xl shadow-md">
            <button class="w-full px-6 py-4 flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <i class="fas fa-question-circle text-gray-600"></i>
                <span class="font-semibold text-gray-800">ヘルプ・サポート</span>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>

          <!-- バージョン情報 -->
          <div class="bg-white rounded-xl shadow-md px-6 py-4">
            <div class="text-center text-gray-500 text-sm">
              <p>WanMap v1.0.0</p>
              <p class="mt-1">© 2025 DogHub</p>
            </div>
          </div>

          ${this.isAuthenticated ? `
            <button onclick="wanmap.logout()" class="w-full btn-danger">
              <i class="fas fa-sign-out-alt mr-2"></i> ログアウト
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 認証画面
  showAuth() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content p-6">
          <button onclick="wanmap.showHome()" class="float-right text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
          
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-dog text-green-500"></i> WanMapへようこそ
          </h2>

          <div class="mb-6">
            <p class="text-gray-600 text-center">
              愛犬との散歩ルートを記録・共有するには<br>アカウント登録が必要です
            </p>
          </div>

          <!-- 認証フォーム -->
          <form id="authForm" class="space-y-4">
            <div>
              <label class="form-label">メールアドレス</label>
              <input type="email" id="authEmail" class="form-input" placeholder="your@email.com" required>
            </div>
            <div>
              <label class="form-label">パスワード</label>
              <input type="password" id="authPassword" class="form-input" placeholder="6文字以上" required>
            </div>
            <button type="submit" class="w-full btn-primary">
              <i class="fas fa-user-plus mr-2"></i> 登録・ログイン
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-500">
            <p>登録することで、<a href="#" class="text-green-500">利用規約</a>と<a href="#" class="text-green-500">プライバシーポリシー</a>に同意したものとみなされます。</p>
          </div>
        </div>
      </div>
    `;

    // フォーム送信処理
    document.getElementById('authForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      
      try {
        if (this.supabaseClient) {
          await this.supabaseClient.signIn(email, password);
          this.showToast('ログイン成功！');
          this.showHome();
        } else {
          this.showToast('Supabaseが設定されていません', 'error');
        }
      } catch (error) {
        console.error('認証エラー:', error);
        this.showToast('認証に失敗しました', 'error');
      }
    });
  }

  // ===== ユーティリティメソッド =====

  // トースト通知を表示
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
      ${message}
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // メニュートグル
  toggleMenu() {
    this.showToast('メニュー機能は開発中です');
  }

  // PWAインストールプロンプト
  setupPWAPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // インストールプロンプトを表示
      const prompt = document.createElement('div');
      prompt.className = 'install-prompt';
      prompt.innerHTML = `
        <div class="flex-1">
          <p class="font-semibold">WanMapをインストール</p>
          <p class="text-sm text-green-100">ホーム画面に追加してすぐアクセス！</p>
        </div>
        <div class="flex space-x-2">
          <button id="installYes" class="bg-white text-green-500 px-4 py-2 rounded-lg font-semibold text-sm">
            インストール
          </button>
          <button id="installNo" class="text-white">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      document.body.appendChild(prompt);

      document.getElementById('installYes')?.addEventListener('click', async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA install outcome:', outcome);
        prompt.remove();
      });

      document.getElementById('installNo')?.addEventListener('click', () => {
        prompt.remove();
      });
    });
  }

  // 地図を初期化
  initMap() {
    if (this.mapManager) {
      this.mapManager.destroy();
    }

    this.mapManager = new MapManager('map-container', {
      center: [35.2332, 139.1066], // 箱根（DogHub）
      zoom: 13
    });
    
    this.mapManager.init();
  }

  // 現在地を表示
  async showCurrentLocation() {
    if (!this.mapManager) return;

    try {
      await this.mapManager.showCurrentLocation();
      this.showToast('現在地を表示しました');
    } catch (error) {
      this.showToast('位置情報の取得に失敗しました', 'error');
    }
  }

  // トラッキング開始
  startTracking() {
    if (!this.mapManager) return;

    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');

    this.mapManager.startTracking(
      (data) => {
        // 統計を更新
        document.getElementById('distanceValue').textContent = (data.distance / 1000).toFixed(2);
        const minutes = Math.floor(data.duration / 60);
        const seconds = data.duration % 60;
        document.getElementById('durationValue').textContent = 
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      },
      (error) => {
        this.showToast('位置情報の取得に失敗しました', 'error');
      }
    );

    this.showToast('記録を開始しました');
  }

  // トラッキング停止
  stopTracking() {
    if (!this.mapManager) return;

    const trackData = this.mapManager.stopTracking();
    
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('startBtn').classList.remove('hidden');

    if (trackData && trackData.points.length > 1) {
      this.showSaveRouteDialog(trackData);
    } else {
      this.showToast('記録データが不足しています', 'error');
    }
  }

  // ルート保存ダイアログ
  showSaveRouteDialog(trackData) {
    const app = document.getElementById('app');
    app.innerHTML += `
      <div class="modal-backdrop">
        <div class="modal-content p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">ルートを保存</h3>
          
          <div class="mb-4">
            <p class="text-gray-600">
              距離: <strong>${(trackData.distance / 1000).toFixed(2)} km</strong><br>
              時間: <strong>${Math.floor(trackData.duration / 60)}分</strong>
            </p>
          </div>

          <form id="saveRouteForm" class="space-y-4">
            <div>
              <label class="form-label">ルート名</label>
              <input type="text" id="routeTitle" class="form-input" placeholder="例: 箱根湖畔散歩コース" required>
            </div>
            <div>
              <label class="form-label">説明</label>
              <textarea id="routeDescription" class="form-textarea" rows="3" placeholder="このルートについて..."></textarea>
            </div>
            <div class="flex space-x-3">
              <button type="submit" class="flex-1 btn-primary">
                <i class="fas fa-save mr-2"></i> 保存
              </button>
              <button type="button" onclick="wanmap.showHome()" class="flex-1 btn-secondary">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('saveRouteForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      // TODO: ルート保存処理
      this.showToast('ルートを保存しました（開発中）');
      this.showHome();
    });
  }

  // 人気ルートを読み込み
  async loadPopularRoutes() {
    try {
      const response = await axios.get('/api/routes?limit=5');
      const routes = response.data.routes;

      const container = document.getElementById('popularRoutes');
      if (routes.length === 0) {
        container.innerHTML = `
          <div class="empty-state py-8">
            <i class="fas fa-map"></i>
            <p>まだルートがありません</p>
          </div>
        `;
        return;
      }

      container.innerHTML = routes.map(route => `
        <div class="route-card">
          <img src="${route.thumbnail_url || 'https://via.placeholder.com/400x200'}" alt="${route.title}">
          <div class="p-4">
            <h3 class="font-bold text-gray-800 mb-2">${route.title}</h3>
            <p class="text-sm text-gray-600 mb-3">${route.description}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span><i class="fas fa-route mr-1"></i> ${(route.distance / 1000).toFixed(1)}km</span>
              <span><i class="fas fa-clock mr-1"></i> ${Math.floor(route.duration / 60)}分</span>
              <span><i class="fas fa-heart text-red-500 mr-1"></i> ${route.like_count}</span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('ルート読み込みエラー:', error);
      document.getElementById('popularRoutes').innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
          <p>ルートの読み込みに失敗しました</p>
        </div>
      `;
    }
  }

  // ログアウト
  async logout() {
    if (this.supabaseClient) {
      await this.supabaseClient.signOut();
    }
    this.isAuthenticated = false;
    this.currentUser = null;
    this.showToast('ログアウトしました');
    this.showHome();
  }
}

// グローバルインスタンス
const wanmap = new WanMapApp();

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
  wanmap.init();
});
