# WanMap データベースセットアップ手順

## Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `wanmap`
4. Database Password: 安全なパスワードを生成
5. Region: `Northeast Asia (Tokyo)` を選択
6. 「Create new project」をクリック

## データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `database/schema.sql`の内容を貼り付け
3. 「Run」をクリック

## 認証設定

1. 「Authentication」→「Providers」を開く
2. Email providerを有効化
3. 「Confirm email」をオンに設定（後で本番環境用）

## API情報の取得

1. 「Settings」→「API」を開く
2. 以下をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

## 環境変数の設定（後で実施）

`.dev.vars`ファイルに以下を追加:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

## Cloudflare R2の設定（写真保存用）

### R2バケット作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com)にログイン
2. 「R2」→「Create bucket」
3. Bucket name: `wanmap-photos`
4. Location: `Asia-Pacific (APAC)`

### APIトークン取得

1. 「R2」→「Manage R2 API Tokens」
2. 「Create API Token」
3. Permissions: `Object Read & Write`
4. 「Create API Token」
5. 以下をコピー:
   - **Access Key ID**
   - **Secret Access Key**

### Wrangler設定

`wrangler.jsonc`に追加:

```jsonc
{
  "r2_buckets": [
    {
      "binding": "PHOTOS",
      "bucket_name": "wanmap-photos"
    }
  ]
}
```

`.dev.vars`に追加:

```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
```

## テストデータの挿入（開発用）

認証後、以下のSQLを実行してテストユーザーを作成:

```sql
-- まず、Supabaseの認証でユーザーを作成
-- その後、プロフィールを追加
INSERT INTO profiles (id, username, display_name, bio) VALUES
  (auth.uid(), 'testuser', 'テストユーザー', '開発用アカウント');
```

## データベース構造

### メインテーブル

- **profiles**: ユーザープロフィール
- **dogs**: 犬のプロフィール
- **routes**: 散歩ルート（PostGISの地理空間データ）
- **route_photos**: ルート写真（R2のURL）
- **likes**: いいね
- **comments**: コメント
- **follows**: フォロー関係

### PostGIS機能

このスキーマはPostGISの地理空間機能を使用:

- `GEOGRAPHY(POINT)`: GPS座標（緯度・経度）
- `GEOGRAPHY(LINESTRING)`: ルートの軌跡
- `ST_Distance()`: 2点間の距離計算
- `ST_DWithin()`: 範囲内検索

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、ユーザーは自分のデータのみ編集可能。
閲覧は全ユーザーに公開。
