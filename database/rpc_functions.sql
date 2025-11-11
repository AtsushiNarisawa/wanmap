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

-- コメント
COMMENT ON FUNCTION get_route_geometry(UUID) IS 'ルートの地理データ（path, start_point, end_point）をGeoJSON形式で取得';
COMMENT ON FUNCTION get_route_with_geojson(UUID) IS 'ルート詳細情報をGeoJSON形式の地理データと共に取得';
