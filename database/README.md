# WanMap Database Setup Guide

## Supabaseセットアップ手順

### 1. Supabaseプロジェクト作成

1. https://supabase.com/ にアクセス
2. "Start your project" をクリック
3. GitHubアカウントでサインイン
4. "New project" をクリック
5. 以下を入力：
   - Project name: `wanmap`
   - Database Password: 強力なパスワード（メモ必須）
   - Region: `Northeast Asia (Tokyo)`（日本のユーザー向け）
6. "Create new project" をクリック（2-3分待機）

### 2. PostGIS拡張を有効化

1. 左サイドバー → "Database" → "Extensions"
2. 検索バーに "postgis" と入力
3. "postgis" の右側にある "Enable" をクリック

### 3. スキーマを実行

1. 左サイドバー → "SQL Editor"
2. "New query" をクリック
3. `database/schema.sql` の内容を全てコピー＆ペースト
4. "Run" ボタンをクリック
5. 成功メッセージを確認

### 4. API認証情報を取得

1. 左サイドバー → "Project Settings" (⚙️アイコン)
2. "API" セクションをクリック
3. 以下をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. .dev.vars ファイルに設定

プロジェクトルートに `.dev.vars` ファイルを作成：

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. 本番環境に設定

```bash
# Cloudflare Pagesのシークレット設定
npx wrangler pages secret put SUPABASE_URL --project-name wanmap
npx wrangler pages secret put SUPABASE_ANON_KEY --project-name wanmap
```

## データベース構造

### テーブル一覧

- `profiles` - ユーザープロフィール
- `dogs` - 犬プロフィール
- `routes` - 散歩ルート（PostGIS地理データ）
- `route_photos` - ルート写真（Cloudflare R2のURL）
- `likes` - いいね
- `comments` - コメント
- `follows` - フォロー関係

### 主要な機能

- **PostGIS地理空間データ**: ルートの経路、開始/終了地点を地理座標で保存
- **Row Level Security (RLS)**: ユーザーごとのデータアクセス制御
- **自動トリガー**: `updated_at` の自動更新、いいね数のカウント
