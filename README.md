# 🐾 WanMap - 愛犬の散歩ルート共有PWA

**旅行先での「どこを散歩すればいいかわからない」を解決**

愛犬との散歩ルートをGPSで記録・共有できるプログレッシブWebアプリ（PWA）。全国の飼い主コミュニティで安全で楽しい散歩コースを見つけよう。

---

## 🌟 プロジェクト概要

- **名前**: WanMap（わんマップ）
- **目的**: 愛犬と旅行する飼い主の散歩ルート発見・共有プラットフォーム
- **ターゲット**: 日本の犬飼育世帯 約680万世帯
- **Phase 1**: 完全無料・広告なし（DogHub宣伝ツール）

---

## ✅ 現在完了している機能

### コア機能
- ✅ **PWA対応** - ホーム画面に追加、オフライン動作
- ✅ **GPS記録** - リアルタイムで散歩ルートを追跡
- ✅ **OpenStreetMap統合** - 無料の地図表示（Leaflet.js）
- ✅ **レスポンシブUI** - スマホ・タブレット対応
- ✅ **ボトムナビゲーション** - 直感的な5画面構成

### 実装済み画面
1. **ホーム** - 人気ルート一覧、DogHub宣伝バナー
2. **マップ** - OpenStreetMap表示、現在地取得
3. **散歩記録** - GPS追跡、距離・時間計測
4. **プロフィール** - ユーザー・犬情報管理
5. **設定** - アカウント・通知設定

### バックエンド
- ✅ **Hono + Cloudflare Pages** - 超軽量エッジデプロイ
- ✅ **Supabase統合準備** - PostgreSQL + PostGIS（地理空間データ）
- ✅ **R2ストレージ統合準備** - 写真保存用
- ✅ **RESTful API** - ルート取得・作成エンドポイント

---

## 🚀 デプロイURL

### 開発環境（サンドボックス）
- **URL**: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai
- **APIヘルスチェック**: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/api/health
- **ステータス**: ✅ 動作中

### 本番環境（Cloudflare Pages）
- **URL**: 未デプロイ（Supabase設定後）
- **予定ドメイン**: wanmap.pages.dev

---

## 📊 データアーキテクチャ

### データベーススキーマ（Supabase PostgreSQL + PostGIS）

#### テーブル構成
1. **profiles** - ユーザープロフィール
2. **dogs** - 愛犬プロフィール
3. **routes** - 散歩ルート（GEOGRAPHY型で地理データ保存）
4. **route_photos** - ルート写真（R2 URL）
5. **likes** - いいね
6. **comments** - コメント
7. **follows** - フォロー関係

#### 地理空間機能（PostGIS）
- `GEOGRAPHY(LINESTRING)` - GPS軌跡を正確に保存
- `GEOGRAPHY(POINT)` - 開始・終了地点、写真位置
- GISTインデックス - 高速地理検索

### ストレージ構成
- **Supabase Storage** - プロフィール画像（無料1GB）
- **Cloudflare R2** - ルート写真（無料10GB）

---

## 🛠️ 技術スタック

### フロントエンド
- **Vanilla JavaScript** - 軽量・高速
- **TailwindCSS (CDN)** - ユーティリティファーストCSS
- **Leaflet.js** - OpenStreetMap表示
- **Font Awesome** - アイコン
- **Supabase JS Client (CDN)** - 認証・データベース

### バックエンド
- **Hono** - 超軽量Webフレームワーク
- **Cloudflare Pages** - エッジデプロイ（完全無料）
- **Supabase** - BaaS（認証・PostgreSQL・Storage）
- **Cloudflare R2** - オブジェクトストレージ

### 開発ツール
- **Vite** - 高速ビルドツール
- **Wrangler** - Cloudflare CLI
- **PM2** - プロセス管理（開発環境）
- **Git** - バージョン管理

---

## 📱 ユーザーガイド

### 基本的な使い方

1. **アプリを開く**
   - ブラウザでURLにアクセス
   - 「ホーム画面に追加」でPWAインストール

2. **散歩を記録する**
   - ボトムバーの「+」ボタンをタップ
   - 「記録開始」で GPS追跡開始
   - 散歩が終わったら「記録停止」
   - タイトル・説明を入力して保存

3. **ルートを探す**
   - 「マップ」タブで近くのルートを表示
   - 検索バーで場所・ルート名で検索
   - ルートカードをタップで詳細表示

4. **プロフィール設定**
   - 「プロフィール」タブで情報編集
   - 愛犬プロフィールを追加
   - マイルート一覧を確認

---

## ⚙️ セットアップ手順

### 前提条件
- Node.js 18+
- npm または yarn
- Supabaseアカウント（無料）
- Cloudflareアカウント（無料）

### 1. プロジェクトをクローン
```bash
git clone https://github.com/yourusername/wanmap.git
cd wanmap
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. Supabase設定

#### 3.1 Supabaseプロジェクト作成
1. https://supabase.com でプロジェクト作成
2. `database/schema.sql` を SQL Editor で実行

#### 3.2 API設定を `.dev.vars` に保存
```bash
# .dev.vars
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Cloudflare R2設定（写真保存用）

#### 4.1 R2バケット作成
```bash
npx wrangler r2 bucket create wanmap-photos
```

#### 4.2 API トークン作成
- Cloudflare Dashboard → R2 → API Tokens
- `.dev.vars` に追加:
```bash
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
```

### 5. 開発サーバー起動
```bash
npm run build
npm run dev:sandbox
```

ブラウザで http://localhost:3000 を開く

### 6. 本番デプロイ（Cloudflare Pages）

#### 6.1 Cloudflare認証設定
```bash
# Cloudflare API キーをサンドボックスに設定（自動）
# 手動の場合: npx wrangler login
```

#### 6.2 Pagesプロジェクト作成
```bash
npx wrangler pages project create wanmap --production-branch main
```

#### 6.3 環境変数を設定
```bash
npx wrangler pages secret put SUPABASE_URL
npx wrangler pages secret put SUPABASE_ANON_KEY
```

#### 6.4 デプロイ実行
```bash
npm run deploy
```

---

## 📁 プロジェクト構成

```
wanmap/
├── src/
│   └── index.tsx              # Honoメインアプリ
├── public/
│   ├── static/
│   │   ├── js/
│   │   │   ├── supabase-client.js  # Supabaseクライアント
│   │   │   └── map-manager.js      # 地図・GPS管理
│   │   ├── app.js             # メインアプリロジック
│   │   ├── styles.css         # カスタムスタイル
│   │   └── manifest.json      # PWAマニフェスト
│   └── service-worker.js      # PWA Service Worker
├── database/
│   ├── schema.sql             # Supabaseデータベーススキーマ
│   └── setup-instructions.md  # セットアップ手順
├── dist/                      # ビルド出力（自動生成）
├── .dev.vars.example          # 環境変数テンプレート
├── ecosystem.config.cjs       # PM2設定
├── package.json
├── vite.config.ts
├── wrangler.jsonc
└── README.md
```

---

## 🔧 開発コマンド

```bash
# 開発サーバー起動（Vite）
npm run dev

# サンドボックス開発（Wrangler）
npm run dev:sandbox

# ビルド
npm run build

# プレビュー
npm run preview

# デプロイ（Cloudflare Pages）
npm run deploy

# ポート3000をクリーンアップ
npm run clean-port

# ヘルスチェック
npm test

# Git操作
npm run git:status
npm run git:commit "メッセージ"
npm run git:log
```

---

## 🔮 今後の実装予定（Phase 2）

### 🚧 未実装機能

#### コミュニティ機能
- [ ] ルート検索（エリア、距離、難易度フィルター）
- [ ] いいね・コメント機能
- [ ] ユーザーフォロー機能
- [ ] 通知システム

#### ルート機能強化
- [ ] 写真アップロード（カメラ・ギャラリー）
- [ ] ルート難易度自動判定（標高データ）
- [ ] オフラインルート保存（IndexedDB）
- [ ] ルート共有（Twitter、LINE）

#### プロフィール
- [ ] 複数の愛犬プロフィール
- [ ] アバター画像アップロード
- [ ] 統計ダッシュボード（総距離、時間）

#### 地図機能
- [ ] ヒートマップ表示
- [ ] ルートクラスター表示
- [ ] カスタムマーカー
- [ ] ストリートビュー連携

#### DogHub連携
- [ ] DogHub予約システム統合
- [ ] 箱根エリア特別表示
- [ ] キャンペーン情報表示

---

## 💰 コスト構造

### Phase 1（現在）
- **Cloudflare Pages**: 無料（帯域100GB/月）
- **Supabase Free Tier**: 無料（500MB DB、1GB Storage）
- **Cloudflare R2**: 無料（10GB Storage）
- **ドメイン**: 約1,200円/年（.com）
- **合計**: **年間1,200円**

### Phase 2（有料プラン移行時）
- **Supabase Pro**: $25/月（8GB DB、100GB Storage）
- **Cloudflare Pages**: 無料（引き続き）
- **Cloudflare R2**: 従量課金（10GB超過時）
- **予想コスト**: $30-50/月

---

## 🎯 ビジネス目標

### Phase 1（初年度）
- ✅ 完全無料運用
- ✅ 広告なし
- ✅ DogHub（箱根ドッグホテル・カフェ）の宣伝ツール
- 目標ユーザー数: 1,000人

### Phase 2（2年目以降）
- 有料プレミアムプラン導入
- 広告収益モデル検討
- ペット関連企業とのタイアップ

---

## 🤝 推奨次のステップ

1. **Supabase設定**
   - アカウント作成
   - データベーススキーマ適用
   - API情報を `.dev.vars` に設定

2. **Cloudflare R2設定**
   - バケット作成
   - API トークン取得

3. **機能テスト**
   - GPS記録動作確認
   - 地図表示確認
   - PWAインストール確認

4. **本番デプロイ**
   - Cloudflare Pages デプロイ
   - カスタムドメイン設定
   - SSL証明書確認

5. **フィードバック収集**
   - ベータテスト実施
   - ユーザー体験改善

---

## 📞 サポート・お問い合わせ

- **開発者**: 篤（Atsushi）
- **所属**: DogHub（箱根ドッグホテル・カフェ）
- **場所**: 神奈川県足柄下郡箱根町

---

## 📄 ライセンス

このプロジェクトは個人プロジェクトです。商用利用の際はご相談ください。

---

## 🙏 謝辞

- **OpenStreetMap** - 無料地図データ提供
- **Supabase** - オープンソースBaaS
- **Cloudflare** - 無料エッジホスティング
- **Leaflet.js** - オープンソース地図ライブラリ

---

**🐾 愛犬との散歩がもっと楽しくなる！ WanMapで新しい冒険を始めよう！**
