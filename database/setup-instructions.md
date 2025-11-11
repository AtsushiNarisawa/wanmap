# Supabase セットアップ手順

## 1. Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. プロジェクト名: `wanmap`
4. データベースパスワードを設定（メモしておく）
5. リージョン: `Northeast Asia (Tokyo)` を選択

## 2. データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `/database/schema.sql` の内容をコピー
3. 「New query」をクリックして貼り付け
4. 「Run」をクリックして実行

## 3. API設定の取得

### Project URL と anon key を取得
1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (長い文字列)

### `.dev.vars` ファイルに設定
```bash
# /home/user/wanmap/.dev.vars
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

## 4. Cloudflare R2 セットアップ（写真保存用）

1. Cloudflare ダッシュボードで「R2」を開く
2. 「Create bucket」をクリック
3. バケット名: `wanmap-photos`
4. 「API Tokens」→「Create API Token」
   - Token name: `wanmap-r2-token`
   - Permissions: `Object Read & Write`
5. 以下をコピー：
   - **Account ID**: `xxxx`
   - **Access Key ID**: `xxxx`
   - **Secret Access Key**: `xxxx`

### `.dev.vars` に追加
```bash
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=wanmap-photos
```

## 5. 本番環境へのデプロイ時

```bash
# Cloudflare Pagesにシークレットを設定
npx wrangler pages secret put SUPABASE_URL
npx wrangler pages secret put SUPABASE_ANON_KEY
npx wrangler pages secret put R2_ACCOUNT_ID
npx wrangler pages secret put R2_ACCESS_KEY_ID
npx wrangler pages secret put R2_SECRET_ACCESS_KEY
npx wrangler pages secret put R2_BUCKET_NAME
```

## 6. 動作確認

```bash
cd /home/user/wanmap
npm run build
npm run dev
```

ブラウザで http://localhost:3000 を開く
