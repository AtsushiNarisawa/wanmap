-- ルート一覧ビュー（関連データを結合）
CREATE OR REPLACE VIEW route_list AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.distance,
  r.duration,
  r.difficulty,
  r.like_count,
  r.view_count,
  r.walked_at,
  r.created_at,
  -- ユーザー情報
  p.username,
  p.display_name,
  p.avatar_url AS user_avatar,
  -- 犬情報
  d.name AS dog_name,
  d.avatar_url AS dog_avatar,
  -- 開始地点の座標
  ST_X(r.start_point::geometry) AS start_lng,
  ST_Y(r.start_point::geometry) AS start_lat,
  -- 最初の写真
  (SELECT url FROM route_photos WHERE route_id = r.id ORDER BY order_index LIMIT 1) AS thumbnail_url
FROM routes r
JOIN profiles p ON r.user_id = p.id
LEFT JOIN dogs d ON r.dog_id = d.id;
