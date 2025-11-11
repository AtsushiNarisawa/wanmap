# WanMap - 愛犬の散歩ルート共有PWAアプリ

愛犬との散歩ルートをGPSで記録・共有できるPWA（Progressive Web App）。旅行先での「どこを散歩すればいいかわからない」問題を解決し、全国の飼い主コミュニティを形成します。

## 🌐 公開URL

- **開発環境**: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai
- **本番環境**: （Cloudflare Pagesデプロイ後に追加）

## ✨ 実装済み機能

### Phase 1 - MVP（現在完了）

- ✅ **ユーザー認証**
  - Supabaseメール認証によるログイン・サインアップ
  - セキュアなRow Level Security (RLS)
  
- ✅ **GPSルート記録**
  - リアルタイムGPSトラッキング
  - 距離・時間・速度の自動計算
  - Haversine公式による正確な距離測定
  
- ✅ **OpenStreetMap統合**
  - Leaflet.jsによる地図表示
  - ルート経路の可視化
  - スタート/ゴール地点のマーカー表示
  
- ✅ **ルート管理**
  - ルート一覧表示（カード形式）
  - ルート詳細ビュー
  - 難易度・タグ設定
  
- ✅ **PWA対応**
  - オフライン動作（Service Worker）
  - ホーム画面追加可能
  - manifest.json完備
  
- ✅ **レスポンシブUI**
  - Tailwind CSSによるモダンデザイン
  - モバイルファースト設計
  - ボトムナビゲーション

## 📂 プロジェクト構造

```
wanmap/
├── src/
│   └── index.tsx              # Honoバックエンド（API + SSR）
├── public/
│   ├── static/
│   │   ├── styles.css         # カスタムCSS
│   │   ├── app.js             # メインアプリケーションロジック
│   │   ├── manifest.json      # PWA manifest
│   │   └── js/
│   │       ├── supabase-client.js  # Supabase統合
│   │       └── map-manager.js      # GPS & 地図管理
│   └── service-worker.js      # PWA Service Worker
├── database/
│   ├── schema.sql             # Supabase/PostgreSQL + PostGISスキーマ
│   └── README.md              # データベースセットアップガイド
├── ecosystem.config.cjs       # PM2設定
├── package.json               # 依存関係
├── wrangler.jsonc             # Cloudflare Pages設定
└── README.md                  # このファイル
```

## 🗄️ データベース構造

### 主要テーブル

- **profiles** - ユーザープロフィール
- **dogs** - 犬プロフィール
- **routes** - 散歩ルート（PostGIS地理データ）
  - `path`: LINESTRING（経路座標）
  - `start_point`: POINT（開始地点）
  - `end_point`: POINT（終了地点）
  - 距離、時間、難易度、タグなど
- **route_photos** - ルート写真（Cloudflare R2のURL）
- **likes** - いいね
- **comments** - コメント
- **follows** - フォロー関係

### 地理空間機能

- **PostGIS拡張**: 地理座標の高度な検索・計算
- **距離範囲検索**: ST_DWithin関数で近くのルートを検索
- **地理インデックス**: GIST indexで高速検索

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクト作成

詳細は `database/README.md` を参照してください。

1. https://supabase.com でプロジェクト作成
2. PostGIS拡張を有効化
3. `database/schema.sql` を実行
4. Project URLとAnon Keyを取得

### 3. 環境変数設定

プロジェクトルートに `.dev.vars` ファイルを作成：

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. ローカル開発

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# または直接起動
npm run dev:sandbox
```

### 5. 本番デプロイ（Cloudflare Pages）

```bash
# ビルド
npm run build

# デプロイ
npm run deploy

# または手動デプロイ
npx wrangler pages deploy dist --project-name wanmap
```

## 📱 API エンドポイント

### ヘルスチェック
```
GET /api/health
```

### 設定取得
```
GET /api/config
```

### ルート一覧
```
GET /api/routes?lat=35.2041&lng=139.0258&radius=10000&limit=20
```

### ルート詳細
```
GET /api/routes/:id
```

### ルート作成
```
POST /api/routes
Body: { title, description, path, distance, duration, ... }
```

### 写真アップロード（R2）
```
POST /api/photos/upload
Body: FormData with 'file' field
```

## 🔧 技術スタック

### フロントエンド
- **HTML/CSS/JavaScript** - PWA標準技術
- **Tailwind CSS** - ユーティリティファーストCSS
- **Leaflet.js** - OpenStreetMap表示
- **Font Awesome** - アイコン
- **Axios** - HTTPクライアント

### バックエンド
- **Hono** - 軽量Webフレームワーク
- **Cloudflare Workers/Pages** - エッジランタイム
- **Supabase** - BaaS（PostgreSQL + Auth）
- **PostGIS** - 地理空間データ拡張

### インフラ
- **Cloudflare Pages** - ホスティング（無料）
- **Cloudflare R2** - 画像ストレージ（10GB無料）
- **OpenStreetMap** - 地図タイル（完全無料）

## 🎯 未実装機能（Phase 2）

- ⏳ ルート検索（エリア、距離、難易度フィルタ）
- ⏳ いいね機能の完全統合
- ⏳ コメント機能
- ⏳ フォロー機能
- ⏳ DogHub宣伝バナー
- ⏳ ルート写真ギャラリー（R2統合）
- ⏳ 犬プロフィール詳細管理
- ⏳ プッシュ通知

## 💡 開発のポイント

### GPS記録の精度向上

```javascript
// 高精度GPSを有効化
navigator.geolocation.watchPosition(callback, errorCallback, {
  enableHighAccuracy: true,  // 高精度モード
  timeout: 5000,             // タイムアウト5秒
  maximumAge: 0              # キャッシュを使わない
});
```

### PostGIS地理検索

```sql
-- 10km圏内のルートを検索
SELECT * FROM routes
WHERE ST_DWithin(
  start_point,
  ST_MakePoint(139.0258, 35.2041)::geography,
  10000  -- メートル
);
```

### PWAオフライン対応

Service Workerのキャッシュ戦略:
- **静的リソース**: Cache First
- **APIリクエスト**: Network Only
- **動的コンテンツ**: Network First, fallback to Cache

## 📊 パフォーマンス目標

- **初回ロード**: < 3秒
- **GPS精度**: ± 10メートル
- **地図レンダリング**: < 1秒
- **PWAインストールサイズ**: < 5MB

## 🤝 コントリビューション

プルリクエスト歓迎！以下の点にご注意ください：

1. Supabase APIキーは `.dev.vars` に保存（Gitに含めない）
2. モックデータでの動作確認を優先
3. モバイルファーストで実装
4. PostGISの地理関数を活用

## 📄 ライセンス

MIT License

## 👤 開発者

**篤（Atsushi）**
- DogHub運営者（箱根のドッグホテル・カフェ）
- マーケティングスペシャリスト
- 電通・ADK出身

---

## 🐕 DogHubについて

WanMapは、箱根で運営するドッグホテル・カフェ「DogHub」の宣伝ツールとして開発されました。

- **所在地**: 神奈川県足柄下郡箱根町
- **サービス**: ドッグホテル（¥5,500/泊〜）、愛犬同伴カフェ
- **コンセプト**: ペットと飼い主の両方に愛される空間

WanMapを通じて、全国の愛犬家が箱根の魅力的な散歩コースを発見し、DogHubを訪れていただけることを願っています。
