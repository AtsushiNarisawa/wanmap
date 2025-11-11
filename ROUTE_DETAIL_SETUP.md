# ルート詳細画面の設定手順

## 📋 概要

ルート詳細画面を正しく動作させるには、Supabase側にRPC関数を作成する必要があります。

PostGISの`GEOGRAPHY`型はデフォルトでWKT形式で返されるため、JavaScript（Leaflet.js）で使える座標配列に変換するRPC関数が必要です。

## 🔧 設定手順

### 1. Supabaseダッシュボードにログイン

https://supabase.com → あなたのプロジェクトを選択

### 2. SQL Editorを開く

左サイドバー → **SQL Editor** → **New Query**

### 3. RPC関数を作成

以下のSQLをコピーして実行してください：

```sql
-- RPC関数: ルートの地理データをGeoJSON形式で取得
CREATE OR REPLACE FUNCTION get_route_geometry(route_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'path', ST_AsGeoJSON(path)::json,
      'start_point', ST_AsGeoJSON(start_point)::json,
      'end_point', ST_AsGeoJSON(end_point)::json
    )
    FROM routes
    WHERE id = route_id
  );
END;
$$ LANGUAGE plpgsql;

-- RPC関数: ルート詳細をGeoJSON形式で取得
CREATE OR REPLACE FUNCTION get_route_with_geojson(route_id UUID)
RETURNS JSON AS $$
DECLARE
  route_data JSON;
  geo_data JSON;
BEGIN
  -- ルート基本情報を取得
  SELECT json_build_object(
    'id', r.id,
    'title', r.title,
    'description', r.description,
    'distance', r.distance,
    'duration', r.duration,
    'difficulty', r.difficulty,
    'like_count', r.like_count,
    'view_count', r.view_count,
    'walked_at', r.walked_at,
    'created_at', r.created_at,
    'profiles', json_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ),
    'dogs', CASE 
      WHEN d.id IS NOT NULL THEN json_build_object(
        'id', d.id,
        'name', d.name,
        'breed', d.breed,
        'avatar_url', d.avatar_url
      )
      ELSE NULL
    END,
    'route_photos', COALESCE(
      (SELECT json_agg(json_build_object('url', url, 'order_index', order_index))
       FROM route_photos WHERE route_photos.route_id = r.id
       ORDER BY order_index),
      '[]'::json
    )
  ) INTO route_data
  FROM routes r
  JOIN profiles p ON r.user_id = p.id
  LEFT JOIN dogs d ON r.dog_id = d.id
  WHERE r.id = route_id;
  
  -- 地理データをGeoJSON形式で取得
  SELECT json_build_object(
    'path', ST_AsGeoJSON(path)::json,
    'start_point', ST_AsGeoJSON(start_point)::json,
    'end_point', ST_AsGeoJSON(end_point)::json
  ) INTO geo_data
  FROM routes
  WHERE id = route_id;
  
  -- 結合して返す
  RETURN route_data || geo_data;
END;
$$ LANGUAGE plpgsql;
```

### 4. 実行確認

**Run** ボタンをクリックして実行します。

成功メッセージが表示されればOKです：
```
Success. No rows returned
```

### 5. 関数のテスト

以下のSQLで関数が正しく動作するか確認できます：

```sql
-- テストルートIDを使用（実際のルートIDに置き換えてください）
SELECT get_route_geometry('あなたのルートID'::UUID);
```

## 🧪 動作確認

### フロントエンドでの確認

1. WanMapアプリを開く
2. ホーム画面でルートカードをクリック
3. ルート詳細画面が表示される
4. 地図上にルート経路、スタート/ゴールマーカーが表示される

### 正常な動作

- ✅ 地図が表示される
- ✅ 青色の経路線が描画される
- ✅ スタート地点に青いマーカー
- ✅ ゴール地点に赤いマーカー
- ✅ ルート情報（距離、時間、難易度）が表示される

### トラブルシューティング

#### RPC関数が見つからない場合

コンソールに以下のエラーが表示されます：
```
RPC関数が見つかりません。代替方法を使用します
```

この場合、**代替方法**として直接SQL クエリを使用しますが、パフォーマンスが低下する可能性があります。

**解決策**: 上記の手順3を再度実行し、RPC関数を作成してください。

#### 地図が表示されない場合

1. ブラウザのコンソールを確認（F12 → Console）
2. エラーメッセージを確認
3. `styles.css` の `#detailMap` スタイルを確認：
```css
#detailMap {
  width: 100%;
  height: calc(100vh - 128px);
  min-height: 400px;
}
```

#### 経路が表示されない場合

1. コンソールで `parseGeoJSONCoordinates` エラーを確認
2. ルートデータの `path` フィールドを確認：
```javascript
console.log('Route data:', route);
console.log('Path:', route.path);
```

## 📚 関連ファイル

- **`database/rpc_functions.sql`** - RPC関数のSQL定義
- **`public/static/js/supabase-client.js`** - Supabase統合、`getRouteById()` 関数
- **`public/static/js/map-manager.js`** - 地図管理、`displayRoute()` 関数
- **`public/static/app.js`** - `viewRouteDetail()` 関数

## 🎯 次のステップ

ルート詳細画面が正常に動作したら：

1. **いいね機能のテスト** - いいねボタンをクリック
2. **写真ギャラリー** - Cloudflare R2統合（Phase 2）
3. **コメント機能** - コメント投稿（Phase 2）

---

**作成日**: 2025-01-11  
**対象**: WanMap Phase 1 MVP - ルート詳細画面
