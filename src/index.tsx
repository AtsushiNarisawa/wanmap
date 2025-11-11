import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// Cloudflare環境の型定義
type Bindings = {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  PHOTOS?: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// CORSを有効化
app.use('/api/*', cors())

// 静的ファイルの配信
app.use('/static/*', serveStatic({ root: './public' }))

// ===== API Routes =====

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: !!c.env.SUPABASE_URL
  })
})

// Supabase設定を取得（フロントエンド用）
app.get('/api/config', (c) => {
  return c.json({
    supabaseUrl: c.env.SUPABASE_URL || '',
    supabaseAnonKey: c.env.SUPABASE_ANON_KEY || ''
  })
})

// ルート一覧取得（距離範囲検索対応）
app.get('/api/routes', async (c) => {
  const { lat, lng, radius, limit = '20' } = c.req.query()
  
  // TODO: Supabase APIキー設定後に実装
  // 現在はモックデータを返す
  const mockRoutes = [
    {
      id: '1',
      title: '箱根湖畔散歩コース',
      description: '芦ノ湖周辺の静かな散歩道。景色が最高です。',
      distance: 2500,
      duration: 1800,
      difficulty: 'easy',
      thumbnail_url: '/static/sample-route.jpg',
      username: 'atsushi',
      display_name: '篤',
      dog_name: 'ポチ',
      like_count: 15,
      walked_at: '2025-01-10T10:00:00Z'
    }
  ]
  
  return c.json({ routes: mockRoutes })
})

// ルート詳細取得
app.get('/api/routes/:id', async (c) => {
  const routeId = c.req.param('id')
  
  // TODO: Supabase APIキー設定後に実装
  const mockRoute = {
    id: routeId,
    title: '箱根湖畔散歩コース',
    description: '芦ノ湖周辺の静かな散歩道。景色が最高です。',
    distance: 2500,
    duration: 1800,
    elevation_gain: 50,
    difficulty: 'easy',
    surface_type: ['paved', 'gravel'],
    features: ['water', 'shade', 'cafe'],
    path: [
      [35.2041, 139.0258],
      [35.2045, 139.0260],
      [35.2050, 139.0265]
    ],
    photos: [],
    username: 'atsushi',
    display_name: '篤',
    dog_name: 'ポチ',
    like_count: 15,
    view_count: 120,
    walked_at: '2025-01-10T10:00:00Z'
  }
  
  return c.json(mockRoute)
})

// ルート作成
app.post('/api/routes', async (c) => {
  // TODO: 認証チェック & Supabase保存
  const body = await c.req.json()
  
  return c.json({ 
    success: true, 
    message: 'Supabase APIキー設定後に実装されます',
    received: body 
  })
})

// 写真アップロード（Cloudflare R2）
app.post('/api/photos/upload', async (c) => {
  const { PHOTOS } = c.env
  
  if (!PHOTOS) {
    return c.json({ error: 'R2バケットが設定されていません' }, 503)
  }
  
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'ファイルがありません' }, 400)
    }
    
    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const key = `photos/${timestamp}-${randomStr}.${extension}`
    
    // R2にアップロード
    await PHOTOS.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    // 公開URLを生成（後でR2のPublic URLを設定）
    const url = `https://photos.wanmap.com/${key}`
    
    return c.json({ 
      success: true, 
      url,
      key 
    })
  } catch (error) {
    return c.json({ error: 'アップロード失敗' }, 500)
  }
})

// ===== メインページ =====

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="description" content="愛犬との散歩ルートを記録・共有するPWAアプリ">
        <meta name="theme-color" content="#10B981">
        <title>WanMap - 愛犬の散歩ルート共有</title>
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/static/manifest.json">
        <link rel="icon" href="/static/favicon.ico">
        <link rel="apple-touch-icon" href="/static/icon-192.png">
        
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Leaflet CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        
        <!-- Font Awesome -->
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- ローディング画面 -->
        <div id="loading" class="fixed inset-0 bg-green-500 flex items-center justify-center z-50">
            <div class="text-center text-white">
                <i class="fas fa-dog text-6xl mb-4 animate-bounce"></i>
                <h1 class="text-3xl font-bold">WanMap</h1>
                <p class="text-sm mt-2">愛犬の散歩ルート共有</p>
            </div>
        </div>

        <!-- ナビゲーションバー -->
        <nav class="bg-white shadow-lg fixed top-0 left-0 right-0 z-40">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-dog text-green-500 text-2xl"></i>
                        <span class="text-xl font-bold text-gray-800">WanMap</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="loginBtn" class="text-gray-600 hover:text-green-500">
                            <i class="fas fa-user"></i>
                        </button>
                        <button id="menuBtn" class="text-gray-600 hover:text-green-500">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- メインコンテンツ -->
        <main class="pt-16 pb-20">
            <div id="app">
                <!-- 動的にコンテンツを読み込み -->
            </div>
        </main>

        <!-- ボトムナビゲーション -->
        <nav class="bg-white shadow-lg fixed bottom-0 left-0 right-0 z-40 border-t">
            <div class="flex justify-around items-center h-16">
                <button id="navHome" class="flex flex-col items-center justify-center flex-1 text-green-500">
                    <i class="fas fa-home text-xl"></i>
                    <span class="text-xs mt-1">ホーム</span>
                </button>
                <button id="navMap" class="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <i class="fas fa-map text-xl"></i>
                    <span class="text-xs mt-1">マップ</span>
                </button>
                <button id="navRecord" class="relative flex flex-col items-center justify-center flex-1 text-gray-400">
                    <div class="absolute -top-6 bg-green-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
                        <i class="fas fa-plus text-2xl"></i>
                    </div>
                    <span class="text-xs mt-6 invisible">記録</span>
                </button>
                <button id="navProfile" class="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <i class="fas fa-user text-xl"></i>
                    <span class="text-xs mt-1">プロフィール</span>
                </button>
                <button id="navSettings" class="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <i class="fas fa-cog text-xl"></i>
                    <span class="text-xs mt-1">設定</span>
                </button>
            </div>
        </nav>

        <!-- Leaflet JS -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        
        <!-- Supabase Client -->
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        
        <!-- Axios -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        <!-- カスタムJS -->
        <script src="/static/js/supabase-client.js"></script>
        <script src="/static/js/map-manager.js"></script>
        <script src="/static/app.js"></script>
        
        <!-- Service Worker登録 -->
        <script>
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                  console.log('SW registered:', registration);
                })
                .catch((error) => {
                  console.error('SW registration failed:', error);
                });
            });
          }
        </script>
    </body>
    </html>
  `)
})

export default app
