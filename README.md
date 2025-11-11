# 🐕 WanMap - 愛犬の散歩ルート共有PWA

愛犬との散歩ルートをGPSで記録・共有できるプログレッシブウェブアプリ（PWA）。
旅行先での「どこを散歩すればいいかわからない」問題を解決し、全国の飼い主コミュニティを形成します。

## 🎯 プロジェクト概要

- **目的**: 飼い主が愛犬との散歩ルートを記録・共有するプラットフォーム
- **ターゲット**: 犬飼育世帯（日本の約680万世帯）、ペットツーリズム参加者
- **ビジネス目標**: Phase 1は完全無料・広告なし、DogHub（箱根のドッグホテル・カフェ）の宣伝ツール

## ✨ 実装済み機能

### Phase 1（MVP）
- ✅ ユーザー登録・ログイン（Supabase認証）
- ✅ GPSルート記録（リアルタイムトラッキング）
- ✅ OpenStreetMap表示（Leaflet.js）
- ✅ ルート一覧・詳細表示
- ✅ レスポンシブUI（Tailwind CSS）
- ✅ PWA対応（オフライン、ホーム画面追加）
- ✅ モックデータ表示

### 未実装機能（Phase 2）
- ⏳ 写真アップロード（Cloudflare R2）
- ⏳ ルート保存（Supabase + PostGIS）
- ⏳ 犬プロフィール管理
- ⏳ いいね・コメント機能
- ⏳ フォロー機能
- ⏳ ルート検索（エリア、距離、難易度）
- ⏳ DogHub宣伝バナー

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Vanilla JavaScript（CDN経由）
- **UI**: Tailwind CSS（CDN）
- **地図**: Leaflet.js + OpenStreetMap（完全無料）
- **アイコン**: Font Awesome 6

### バックエンド
- **フレームワーク**: Hono（軽量Webフレームワーク）
- **ランタイム**: Cloudflare Workers（エッジコンピューティング）
- **ホスティング**: Cloudflare Pages（無料枠）

### データベース・ストレージ
- **データベース**: Supabase PostgreSQL 15+ with PostGIS（無料枠500MB）
- **認証**: Supabase Auth（メール認証）
- **写真保存**: Cloudflare R2（10GB無料枠、未設定）

### PWA機能
- **Service Worker**: オフライン対応、キャッシュ管理
- **Manifest**: ホーム画面追加、スプラッシュスクリーン
- **GPS API**: 高精度位置情報取得

## 📁 プロジェクト構造

```
wanmap/
├── src/
│   └── index.tsx              # Honoバックエンド（API Routes）
├── public/
│   └── static/
│       ├── app.js             # フロントエンドJavaScript
│       ├── styles.css         # カスタムCSS
│       ├── manifest.json      # PWA Manifest
│       └── sw.js              # Service Worker
├── database/
│   ├── schema.sql             # Supabaseスキーマ（PostGIS対応）
│   └── README.md              # データベースセットアップ手順
├── .dev.vars.example          # 環境変数テンプレート
├── ecosystem.config.cjs       # PM2設定
├── wrangler.jsonc             # Cloudflare設定
└── README.md                  # このファイル
```

## 🚀 セットアップ手順

### 1. 依存関係インストール

```bash
cd /home/user/wanmap
npm install
```

### 2. Supabaseプロジェクト作成（必須）

1. [Supabase](https://supabase.com)で新規プロジェクト作成
2. プロジェクト名: `wanmap`
3. Region: `Northeast Asia (Tokyo)`
4. SQL Editorで`database/schema.sql`を実行
5. API設定から以下を取得:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 3. 環境変数設定

```bash
# .dev.varsファイルを作成
cp .dev.vars.example .dev.vars

# 取得したSupabase情報を記入
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Cloudflare R2設定（オプション、写真機能用）

1. [Cloudflare Dashboard](https://dash.cloudflare.com)でR2バケット作成
2. Bucket name: `wanmap-photos`
3. APIトークン取得
4. `wrangler.jsonc`でR2設定をコメント解除

### 5. ローカル開発

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# 動作確認
curl http://localhost:3000
```

ブラウザで http://localhost:3000 にアクセス

## 📱 機能説明

### ホーム画面
- 人気ルート一覧
- クイック統計（ルート数、ユーザー数、いいね数）
- DogHub宣伝バナー

### マップ画面
- OpenStreetMapでルート表示
- 現在地取得・追従
- エリア検索（未実装）

### 記録画面
- リアルタイムGPSトラッキング
- 距離・時間・速度表示
- ルート軌跡表示（緑色のライン）
- ルート保存（未実装）

### プロフィール画面
- ユーザー情報表示
- マイルート一覧（未実装）
- ログアウト

## 🗄️ データベース構造

### メインテーブル
- **profiles**: ユーザープロフィール
- **dogs**: 犬のプロフィール
- **routes**: 散歩ルート（PostGIS GEOGRAPHY型でGPS軌跡保存）
- **route_photos**: ルート写真（R2のURL）
- **likes**: いいね
- **comments**: コメント
- **follows**: フォロー関係

### PostGIS機能
- `GEOGRAPHY(POINT)`: GPS座標（緯度・経度）
- `GEOGRAPHY(LINESTRING)`: ルートの軌跡
- 地理空間インデックス（GIST）で高速検索
- `ST_Distance()`: 2点間の距離計算
- `ST_DWithin()`: 範囲内検索

### Row Level Security（RLS）
- すべてのテーブルでRLS有効化
- ユーザーは自分のデータのみ編集可能
- 閲覧は全ユーザーに公開

## 🌐 API エンドポイント

### 基本
- `GET /api/health` - ヘルスチェック
- `GET /api/config` - Supabase設定取得

### ルート
- `GET /api/routes` - ルート一覧（クエリ: `lat`, `lng`, `radius`, `limit`）
- `GET /api/routes/:id` - ルート詳細
- `POST /api/routes` - ルート作成（未実装）

### 写真
- `POST /api/photos/upload` - 写真アップロード（R2、未実装）

## 🎨 デザインシステム

### カラーパレット
- **Primary**: Green-500 (#10B981) - 自然・健康・安心
- **Secondary**: Blue-500 - 信頼・冷静
- **Accent**: Orange-500 - 活力・楽しさ
- **Error**: Red-500 - 警告
- **Background**: Gray-50 - 明るい背景

### タイポグラフィ
- システムフォント（San Francisco, Segoe UI, Roboto）
- Heading: Bold, 2xl~3xl
- Body: Regular, base
- Caption: Regular, sm~xs

## 📊 開発状況

### 完了（Development）
- ✅ プロジェクト初期化
- ✅ データベース設計
- ✅ Honoバックエンド実装
- ✅ Leafletマップ統合
- ✅ GPS追跡機能
- ✅ PWA対応
- ✅ レスポンシブUI

### 次のステップ（TODO）
1. **Supabase APIキー設定** - ユーザー認証を有効化
2. **ルート保存機能** - 記録したルートをデータベースに保存
3. **写真アップロード** - R2統合で写真機能追加
4. **犬プロフィール** - 愛犬情報登録
5. **ルート検索** - エリア・距離・難易度で絞り込み
6. **ソーシャル機能** - いいね・コメント・フォロー

## 🔐 セキュリティ

- Supabase RLS（Row Level Security）でデータアクセス制限
- 環境変数で機密情報管理（`.dev.vars`）
- CORS設定でAPI保護
- HTTPS必須（Cloudflare Pages）

## 💰 コスト試算

### 開発コスト
- **実質0円**（Claude + Genspark AI Developer活用）

### ランニングコスト（年間）
- **Cloudflare Pages**: 0円（無料枠: 500ビルド/月）
- **Cloudflare Workers**: 0円（無料枠: 100,000リクエスト/日）
- **Cloudflare R2**: 0円（無料枠: 10GB）
- **Supabase**: 0円（無料枠: 500MBデータベース、5GBストレージ）
- **ドメイン代**: 約1,200円（`.com`ドメイン）

**合計: 年間1,200円以下**

## 🚢 デプロイ方法

### Cloudflare Pages

```bash
# ビルド
npm run build

# デプロイ
npm run deploy
```

デプロイ後、`https://wanmap.pages.dev`でアクセス可能

### カスタムドメイン設定

Cloudflare Pagesダッシュボードで独自ドメイン追加可能

## 📚 参考資料

- [Hono Documentation](https://hono.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [PostGIS Documentation](https://postgis.net/docs/)

## 📄 ライセンス

MIT License

## 👤 開発者

篤（Atsushi）
- 大手広告代理店出身のマーケティングスペシャリスト
- DogHub（箱根のドッグホテル・カフェ）運営者

---

Made with ❤️ for dog lovers by Claude & Genspark AI Developer
