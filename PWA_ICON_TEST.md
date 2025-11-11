# 🎨 PWAアイコンのテスト

## ✅ 完了した作業

### 生成したアイコン
- ✅ **favicon.ico** - ブラウザタブのアイコン（32x32）
- ✅ **icon-72.png** - PWA用（72x72）
- ✅ **icon-96.png** - PWA用（96x96）
- ✅ **icon-128.png** - PWA用（128x128）
- ✅ **icon-144.png** - PWA用（144x144）
- ✅ **icon-152.png** - PWA用（152x152）
- ✅ **icon-192.png** - Androidホーム画面用（192x192）
- ✅ **icon-384.png** - PWA用（384x384）
- ✅ **icon-512.png** - Androidスプラッシュ画面用（512x512）
- ✅ **apple-touch-icon.png** - iOSホーム画面用（180x180）

### 設定の変更
- ✅ `src/index.tsx` - manifest.json、favicon、apple-touch-iconのリンクを有効化
- ✅ すべてのアイコンが `/public/static/` に配置済み

## 🧪 テスト手順

### テスト1: ブラウザタブのアイコン（Favicon）

1. **WanMapアプリを開く**
   - URL: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai

2. **ブラウザタブを確認**
   - タブに**緑色の背景に白い犬のアイコン**が表示される

**期待される結果**: ✅ ブラウザタブに緑の犬アイコンが表示される

---

### テスト2: PWAインストールプロンプト（デスクトップ）

#### Chrome/Edge（デスクトップ）

1. **WanMapアプリを開く**
2. アドレスバーの右側に**インストールアイコン（⊕）**が表示される
3. クリックして「インストール」を選択

**期待される結果**:
- ✅ インストールプロンプトが表示される
- ✅ アプリ名「WanMap」とアイコンが表示される
- ✅ インストール後、デスクトップアプリとして起動する

#### Firefox（デスクトップ）

1. **WanMapアプリを開く**
2. アドレスバーの右側に**ホーム画面に追加アイコン**が表示される
3. クリックして追加

**期待される結果**: ✅ アプリがブックマークに追加される

---

### テスト3: PWAインストール（Android）

#### Chrome（Android）

1. **スマートフォンでWanMapアプリを開く**
   - URL: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai

2. **メニュー（⋮）をタップ**
3. **「ホーム画面に追加」を選択**
4. アプリ名「WanMap」とアイコンを確認
5. **「追加」をタップ**

**期待される結果**:
- ✅ ホーム画面に緑色の犬アイコンが追加される
- ✅ アイコンをタップするとスタンドアロンアプリとして起動
- ✅ アドレスバーが表示されない（フルスクリーン）

---

### テスト4: PWAインストール（iOS）

#### Safari（iPhone/iPad）

1. **SafariでWanMapアプリを開く**
   - URL: https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai

2. **共有ボタン（□↑）をタップ**
3. **「ホーム画面に追加」を選択**
4. アプリ名「WanMap」とアイコンを確認
5. **「追加」をタップ**

**期待される結果**:
- ✅ ホーム画面に緑色の犬アイコンが追加される
- ✅ アイコンをタップするとスタンドアロンアプリとして起動
- ✅ Safariのツールバーが表示されない

---

### テスト5: アイコンの視認性

以下のURLを直接ブラウザで開いて、アイコンが正しく表示されるか確認：

1. **Favicon**
   ```
   https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/static/favicon.ico
   ```

2. **icon-192.png**（Android用）
   ```
   https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/static/icon-192.png
   ```

3. **icon-512.png**（スプラッシュ画面用）
   ```
   https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/static/icon-512.png
   ```

4. **apple-touch-icon.png**（iOS用）
   ```
   https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/static/apple-touch-icon.png
   ```

**期待される結果**: ✅ すべてのアイコンが緑色の背景に白い犬のデザインで表示される

---

### テスト6: manifest.jsonの確認

1. **manifest.jsonを開く**
   ```
   https://3000-ifptz010rbeusa0fgwxvk-2b54fc91.sandbox.novita.ai/static/manifest.json
   ```

2. **内容を確認**
   - `name`: "WanMap - 愛犬の散歩ルート共有"
   - `short_name`: "WanMap"
   - `theme_color`: "#10B981"（緑色）
   - `icons`: 8つのアイコンが定義されている

**期待される結果**: ✅ manifest.jsonが正しく表示される

---

## 🐛 トラブルシューティング

### 問題1: ブラウザタブにアイコンが表示されない

**原因**: ブラウザのキャッシュが古い

**解決策**:
1. ハードリロード（Ctrl+Shift+R または Cmd+Shift+R）
2. ブラウザのキャッシュをクリア
3. ページを再読み込み

---

### 問題2: インストールプロンプトが表示されない

**原因**: PWAの要件を満たしていない可能性

**確認事項**:
- ✅ HTTPSで接続されているか（開発環境はlocalhostでOK）
- ✅ manifest.jsonが正しく読み込まれているか
- ✅ Service Workerが登録されているか

**確認方法**:
1. ブラウザの開発者ツールを開く（F12）
2. **Application** タブをクリック
3. **Manifest** セクションを確認
4. **Service Workers** セクションを確認

---

### 問題3: アイコンが404エラー

**原因**: アイコンファイルのパスが正しくない

**解決策**:
1. `/home/user/wanmap/public/static/` にアイコンファイルがあるか確認
   ```bash
   ls -lh /home/user/wanmap/public/static/icon-*.png
   ```

2. ビルドして再起動
   ```bash
   cd /home/user/wanmap && npm run build && pm2 restart wanmap
   ```

---

### 問題4: iOSでアイコンが表示されない

**原因**: `apple-touch-icon`のリンクが正しくない

**解決策**:
1. `src/index.tsx` の以下の行を確認：
   ```html
   <link rel="apple-touch-icon" href="/static/apple-touch-icon.png">
   ```

2. ファイルが存在するか確認：
   ```bash
   ls -lh /home/user/wanmap/public/static/apple-touch-icon.png
   ```

---

## 📊 テスト結果チェックリスト

### デスクトップ（Chrome/Edge）
- [ ] ブラウザタブにfaviconが表示される
- [ ] インストールプロンプトが表示される
- [ ] アプリ名とアイコンが正しく表示される
- [ ] インストール後、スタンドアロンアプリとして動作する

### Android（Chrome）
- [ ] ホーム画面に追加できる
- [ ] ホーム画面アイコンが正しく表示される（緑色の犬）
- [ ] タップするとフルスクリーンで起動する
- [ ] スプラッシュ画面にアイコンが表示される

### iOS（Safari）
- [ ] ホーム画面に追加できる
- [ ] ホーム画面アイコンが正しく表示される（緑色の犬）
- [ ] タップするとスタンドアロンアプリとして起動する
- [ ] Safariのツールバーが表示されない

### アイコン視認性
- [ ] すべてのアイコンURLで画像が表示される
- [ ] デザインが一貫している（緑色の背景 + 白い犬）
- [ ] 小さいサイズでも見やすい

---

## 🎯 テスト完了後

すべてのチェックリストが ✅ になったら：

1. **スクリーンショットを撮影**
   - ブラウザタブのfavicon
   - ホーム画面のアイコン
   - スタンドアロンアプリの起動画面

2. **次のタスクに進む**:
   - ✅ PWAアイコン生成 - **完了！**
   - ⏳ Cloudflare Pagesデプロイ - **次のステップ**

---

**テスト担当**: 篤志さん  
**テスト日**: 2025-01-11  
**テスト環境**: 開発環境（Sandbox）  
**次のステップ**: Cloudflare Pagesデプロイ
