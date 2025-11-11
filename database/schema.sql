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
  weight DECIMAL(5,2),
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
  path GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  start_point GEOGRAPHY(POINT, 4326) NOT NULL,
  end_point GEOGRAPHY(POINT, 4326) NOT NULL,
  distance DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  elevation_gain DECIMAL(10,2),
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  surface_type TEXT[],
  features TEXT[],
  best_season TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  walked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ルート写真テーブル
CREATE TABLE IF NOT EXISTS route_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_routes_start_point ON routes USING GIST(start_point);
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_walked_at ON routes(walked_at DESC);
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_route_photos_route_id ON route_photos(route_id);

-- RLSポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "犬プロフィールは誰でも閲覧可能" ON dogs FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分の犬のみ管理可能" ON dogs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ルートは誰でも閲覧可能" ON routes FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のルートのみ管理可能" ON routes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "写真は誰でも閲覧可能" ON route_photos FOR SELECT USING (true);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "いいねは誰でも閲覧可能" ON likes FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のいいねのみ管理可能" ON likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "コメントは誰でも閲覧可能" ON comments FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のコメントのみ管理可能" ON comments FOR ALL USING (auth.uid() = user_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "フォローは誰でも閲覧可能" ON follows FOR SELECT USING (true);
CREATE POLICY "ユーザーは自分のフォローのみ管理可能" ON follows FOR ALL USING (auth.uid() = follower_id);
