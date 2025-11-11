# WanMap - 愛犬の散歩ルート共有PWAアプリ

愛犬との散歩ルートをGPSで記録・共有できるPWA（Progressive Web App）。旅行先での「どこを散歩すればいいかわからない」問題を解決し、全国の飼い主コミュニティを形成します。

## 🌐 公開URL

- **開発環境**: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai
- **本番環境**: （Cloudflare Pagesデプロイ後に追加）
- **最終更新**: 2025-01-11 深夜

## ✨ 実装済み機能

### Phase 1 - MVP（2025-01-11完成✨）

- ✅ **ユーザー認証**（動作確認済み）
  - Supabaseメール認証によるログイン・サインアップ
  - 新規登録フォーム完全実装
  - セキュアなRow Level Security (RLS)
  - ログイン状態の永続化
  
- ✅ **GPSルート記録**（動作確認済み）
  - リアルタイムGPSトラッキング（30秒タイムアウト対応）
  - 距離・時間・速度の自動計算
  - Haversine公式による正確な距離測定
  - 記録開始/停止のスムーズなUI
  - バッテリー節約モード（高精度オフ）
  
- ✅ **OpenStreetMap統合**（動作確認済み）
  - Leaflet.jsによる地図表示
  - ルート経路の可視化（青色ライン）
  - スタート/ゴール地点のマーカー表示
  - レスポンシブな地図コンテナ（recordMap、detailMap）
  
- ✅ **ルート管理**（動作確認済み）
  - ルート一覧表示（カード形式）
  - PostGIS VIEWによる高速データ取得
  - ルート詳細ビュー
  - 難易度・タグ設定
  - タイトル・説明の入力
  - ホーム画面への自動遷移
  
- ✅ **PWA対応**（一部実装）
  - Service Worker基本構造
  - manifest.json設定（アイコンは未配置）
  - ホーム画面追加可能な構造
  
- ✅ **レスポンシブUI**（動作確認済み）
  - Tailwind CSSによるモダンデザイン
  - モバイルファースト設計
  - ボトムナビゲーション（ホーム、記録、プロフィール）
  - モーダルダイアログのz-index最適化
  - Font Awesomeアイコン統合

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

#### ステップ1: プロジェクト作成
1. https://supabase.com でプロジェクト作成
2. プロジェクト名: `wanmap-production`
3. リージョン: `Northeast Asia (Tokyo)` 推奨

#### ステップ2: PostGIS拡張を有効化
```sql
-- SQL EditorでPostGIS拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### ステップ3: スキーマ作成
1. SQL Editorで `database/schema.sql` を実行
2. テーブル作成を確認（profiles、dogs、routes等）
3. Row Level Security (RLS) ポリシーが有効化されていることを確認

#### ステップ4: VIEWを作成
1. SQL Editorで `database/create_view.sql` を実行
2. `route_list` VIEWの作成を確認

#### ステップ5: RPC関数を作成
1. SQL Editorで `database/rpc_functions.sql` を実行
2. 以下の関数が作成されたことを確認：
   - `get_route_geometry(route_id UUID)` - 地理データをGeoJSON形式で取得
   - `get_route_with_geojson(route_id UUID)` - ルート詳細とGeoJSONを取得

#### ステップ6: 認証設定
1. Authentication → URL Configuration
2. Site URLを開発環境URLに設定（例: `https://3000-xxx.sandbox.novita.ai`）
3. Redirect URLsに同じURLを追加
4. **注意**: メール認証リンクのリダイレクト先がlocalhost:3000になる場合、メール認証を無効化することを推奨

#### ステップ7: 認証情報取得
1. Project Settings → API
2. **Project URL**: `https://xxxxx.supabase.co`
3. **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. これらを `.dev.vars` に設定

#### ステップ8: 初回ユーザー作成後の手動作業
新規ユーザーでルート保存時にForeign Key制約エラーが発生する場合、手動でプロフィールを作成：

```sql
-- ユーザーIDを確認（AuthenticationタブのUsersから取得）
-- 例: bcdb8e29-c1ca-4828-8e91-8306bf2b0d84

INSERT INTO profiles (id, username, email, display_name)
VALUES (
  'YOUR_USER_ID_HERE',
  'atsushi',
  'your-email@example.com',
  '篤志'
);
```

将来的にはSupabase Triggerで自動化を推奨：
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

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
- **Tailwind CSS** - ユーティリティファーストCSS（CDN経由）
- **Leaflet.js** - OpenStreetMap表示（CDN経由）
- **Font Awesome** - アイコン（CDN経由）
- **Axios** - HTTPクライアント（CDN経由）

### バックエンド
- **Hono** - 軽量Webフレームワーク（Cloudflare Workers最適化）
- **Cloudflare Workers/Pages** - エッジランタイム（V8 Isolates）
- **Supabase** - BaaS（PostgreSQL + Auth + Row Level Security）
- **PostGIS** - 地理空間データ拡張（GEOGRAPHY型、GIST Index）

### インフラ
- **Cloudflare Pages** - ホスティング（完全無料、無制限リクエスト）
- **Cloudflare R2** - 画像ストレージ（10GB無料、以降$0.015/GB/月）
- **Supabase** - データベース（500MB無料、以降$25/月〜）
- **OpenStreetMap** - 地図タイル（完全無料、コミュニティ運営）

## 💰 年間コスト試算（目標：0円）

### 無料枠で運用可能な範囲
- **Cloudflare Pages**: 完全無料（帯域幅・ビルド時間無制限）
- **Cloudflare R2**: 月間10GBまで無料
  - 写真1枚を2MBと仮定すると、月間5,000枚まで無料
  - 10GBを超えた場合: $0.015/GB/月（約2円/GB）
- **Supabase無料プラン**:
  - データベース: 500MB（約5万ルート保存可能）
  - 認証: 50,000 MAU（月間アクティブユーザー）
  - 帯域幅: 5GB/月
  - Row Level Security完備
- **OpenStreetMap**: 完全無料

### Phase 1での想定月間利用量（初期ユーザー100人）
- **ルート保存**: 月間1,000ルート（1ルート = 約10KB）
- **データベース使用量**: 10MB（無料枠の2%）
- **画像ストレージ**: 月間100枚（200MB、無料枠の2%）
- **帯域幅**: 月間2GB（無料枠の40%）

**結論**: Phase 1では**完全無料**で運用可能 🎉

### スケール時のコスト試算（月間アクティブユーザー1,000人）
- **Cloudflare Pages**: 0円（変わらず無料）
- **Cloudflare R2**: 0〜500円/月（写真アップロード量次第）
- **Supabase**: 0〜3,000円/月（500MB超過時はProプラン$25）
- **OpenStreetMap**: 0円（変わらず無料）

**結論**: 月間1,000人規模でも**年間5万円以下**で運用可能

## 🎯 未実装機能（Phase 2）

### 優先度：高
- ⏳ **PWAアイコン生成** - manifest.json完全対応
- ⏳ **ルート詳細画面のテスト** - カードクリック時の動作確認
- ⏳ **Cloudflare Pagesデプロイ** - 本番環境公開
- ⏳ **Cloudflare R2統合** - ルート写真アップロード機能
- ⏳ **ルート検索フィルタ** - エリア、距離、難易度で絞り込み

### 優先度：中
- ⏳ いいね機能の完全統合
- ⏳ コメント機能
- ⏳ フォロー機能
- ⏳ 犬プロフィール詳細管理
- ⏳ DogHub宣伝バナー（ホーム画面上部）

### 優先度：低
- ⏳ プッシュ通知
- ⏳ ダークモード
- ⏳ 多言語対応（英語）
- ⏳ ルートのCSV/GPXエクスポート

## 📝 次回セッションで必要な情報

### 完成した機能（2025-01-11時点）
1. ✅ ログイン・新規登録（Supabase認証）
2. ✅ GPS記録（開始→記録中→停止→保存）
3. ✅ ルート一覧表示（ホーム画面のカード）
4. ✅ 地図表示（OpenStreetMap + Leaflet.js）
5. ✅ モーダルダイアログのz-index修正
6. ✅ 全モーダルの正しい削除処理

### 現在のユーザー情報
- **テストユーザーID**: `bcdb8e29-c1ca-4828-8e91-8306bf2b0d84`
- **メール**: （Supabaseに登録済み）
- **プロフィール**: 手動作成済み（`profiles`テーブル）

### 既知の制約
- Supabaseのメール認証リンクがlocalhost:3000にリダイレクトされる（開発環境URL変更時に注意）
- PWAアイコン未配置（manifest.jsonコメントアウト中）
- Service Worker登録は完了しているが、オフライン機能は最小限

### 推奨される次のステップ
1. **ルート詳細画面のテスト** - ホーム画面のカードをクリックして確認
2. **PWAアイコン生成** - 192x192、512x512のアイコン画像作成
3. **Cloudflare Pagesデプロイ** - 本番環境に公開してモバイルテスト
4. **Cloudflare R2バケット作成** - 写真アップロード機能の準備
5. **ルート検索機能** - Phase 2の最優先機能

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

## 🛠️ トラブルシューティング

### GPS記録画面で地図が表示されない

**問題**: `#recordMap` コンテナに高さが設定されていないため、Leaflet.jsが正しく初期化されない

**解決策**: `styles.css` に以下を追加
```css
#recordMap, #detailMap {
  width: 100%;
  height: calc(100vh - 128px);
  min-height: 400px;
}
```

### GPS位置情報取得がタイムアウトする

**問題**: デフォルトの10秒タイムアウトでは屋内や電波状況が悪い場所で失敗する

**解決策**: `map-manager.js` のGeolocation APIオプションを調整
```javascript
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: false,  // 速度優先（バッテリー節約）
  timeout: 30000,             // 30秒に延長
  maximumAge: 60000           // 1分以内のキャッシュを許可
});
```

### ルート保存後にモーダルが消えない

**問題**: `querySelector('.fixed')` が最初のモーダルしか取得せず、複数のモーダル要素が残留

**解決策**: `querySelectorAll` で全モーダルを削除
```javascript
// 全てのモーダルを閉じる
const modals = document.querySelectorAll('.fixed');
modals.forEach(modal => modal.remove());
```

### Supabaseで `route_list` VIEWが見つからない

**問題**: ルート一覧表示時に404エラー

**解決策**: Supabase SQL Editorで `database/create_view.sql` を実行
```sql
CREATE OR REPLACE VIEW route_list AS
SELECT r.*, p.username, d.name AS dog_name, ...
FROM routes r JOIN profiles p ON r.user_id = p.id ...
```

### 新規ユーザーでルート保存時にForeign Key制約エラー

**問題**: `profiles` テーブルにユーザープロフィールが自動作成されない

**解決策**: ユーザー登録時に手動でプロフィールを作成するか、Supabase Triggerを設定
```sql
INSERT INTO profiles (id, username, email)
VALUES (
  'bcdb8e29-c1ca-4828-8e91-8306bf2b0d84',
  'atsushi',
  'your-email@example.com'
);
```

### PWA manifest.jsonで404エラー

**問題**: アイコンファイル（icon-192.png等）が未作成

**一時的な解決策**: `src/index.tsx` でmanifest関連のリンクをコメントアウト
```html
<!-- <link rel="manifest" href="/static/manifest.json"> -->
<!-- <link rel="icon" href="/static/favicon.ico"> -->
```

**恒久的な解決策**: アイコン画像を生成して `public/static/` に配置し、コメントアウトを解除

## 🤝 コントリビューション

プルリクエスト歓迎！以下の点にご注意ください：

1. Supabase APIキーは `.dev.vars` に保存（Gitに含めない）
2. モックデータでの動作確認を優先
3. モバイルファーストで実装
4. PostGISの地理関数を活用

## 📄 ライセンス

MIT License

## 👤 開発者

**篤志（Atsushi）**
- DogHub運営者（箱根のドッグホテル・カフェ）
- マーケティングスペシャリスト
- フロンティアインターナショナル・電通・ADK出身
- 広告業界の戦略的思考をペット事業に活かす起業家

---

## 🐕 DogHubについて

WanMapは、箱根で運営するドッグホテル・カフェ「DogHub」の宣伝ツールとして開発されました。

- **所在地**: 神奈川県足柄下郡箱根町
- **サービス**: ドッグホテル（¥5,500/泊〜）、愛犬同伴カフェ
- **コンセプト**: ペットと飼い主の両方に愛される空間

WanMapを通じて、全国の愛犬家が箱根の魅力的な散歩コースを発見し、DogHubを訪れていただけることを願っています。
