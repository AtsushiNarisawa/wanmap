-- WanMap Database Schema for Supabase
-- PostGIS拡張を有効化（地理空間データ用）
CREATE EXTENSION IF NOT EXISTS postgis;

-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 犬プロフィールテーブル
CREATE TABLE IF NOT EXISTS dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight DECIMAL(5,2), -- kg
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 散歩ルートテーブル
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- 地理空間データ（PostGISのLINESTRING型）
  path GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  -- 開始地点・終了地点（検索用）
  start_point GEOGRAPHY(POINT, 4326) NOT NULL,
  end_point GEOGRAPHY(POINT, 4326) NOT NULL,
  -- ルート統計
  distance DECIMAL(10,2) NOT NULL, -- メートル
  duration INTEGER NOT NULL, -- 秒
  elevation_gain DECIMAL(10,2), -- メートル
  -- メタデータ
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  surface_type TEXT[], -- ['paved', 'gravel', 'dirt', 'grass']
  features TEXT[], -- ['water', 'shade', 'dog_park', 'cafe', 'restroom']
  best_season TEXT[], -- ['spring', 'summer', 'fall', 'winter']
  -- 統計
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  -- 日時
  walked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ルート写真テーブル（Cloudflare R2のURLを保存）
CREATE TABLE IF NOT EXISTS route_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  url TEXT NOT NULL, -- R2のURL
  thumbnail_url TEXT,
  caption TEXT,
  -- 写真の位置（ルート上のどこで撮影したか）
  location GEOGRAPHY(POINT, 4326),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フォローテーブル
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ===== インデックス =====

-- 地理空間インデックス（高速な地理検索用）
CREATE INDEX IF NOT EXISTS idx_routes_start_point ON routes USING GIST(start_point);
CREATE INDEX IF NOT EXISTS idx_routes_end_point ON routes USING GIST(end_point);
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_route_photos_location ON route_photos USING GIST(location);

-- 通常のインデックス
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_walked_at ON routes(walked_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_like_count ON routes(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_route_photos_route_id ON route_photos(route_id);
CREATE INDEX IF NOT EXISTS idx_likes_route_id ON likes(route_id);
CREATE INDEX IF NOT EXISTS idx_comments_route_id ON comments(route_id);

-- ===== RLS（Row Level Security）ポリシー =====

-- プロフィール
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールは誰でも閲覧可能"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 犬プロフィール
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "犬プロフィールは誰でも閲覧可能"
  ON dogs FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分の犬プロフィールのみ作成・更新・削除可能"
  ON dogs FOR ALL
  USING (auth.uid() = user_id);

-- ルート
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ルートは誰でも閲覧可能"
  ON routes FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のルートのみ作成・更新・削除可能"
  ON routes FOR ALL
  USING (auth.uid() = user_id);

-- ルート写真
ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ルート写真は誰でも閲覧可能"
  ON route_photos FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のルートの写真のみ作成・削除可能"
  ON route_photos FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM routes WHERE id = route_id
  ));

-- いいね
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "いいねは誰でも閲覧可能"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のいいねのみ作成・削除可能"
  ON likes FOR ALL
  USING (auth.uid() = user_id);

-- コメント
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントは誰でも閲覧可能"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のコメントのみ作成・更新・削除可能"
  ON comments FOR ALL
  USING (auth.uid() = user_id);

-- フォロー
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "フォローは誰でも閲覧可能"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のフォローのみ作成・削除可能"
  ON follows FOR ALL
  USING (auth.uid() = follower_id);

-- ===== トリガー（自動更新） =====

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- いいね数を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_route_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE routes SET like_count = like_count + 1 WHERE id = NEW.route_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE routes SET like_count = like_count - 1 WHERE id = OLD.route_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_route_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_route_like_count();

-- ===== ビュー（便利なクエリ） =====

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

-- ===== サンプルデータ（開発用） =====

-- サンプルユーザー（実際のauth.usersには手動で作成が必要）
-- INSERT INTO profiles (id, username, display_name, bio) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'atsushi', '篤', 'DogHub運営者、箱根在住');

-- サンプル犬プロフィール
-- INSERT INTO dogs (user_id, name, breed, age, weight) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'ポチ', '柴犬', 5, 10.5);
