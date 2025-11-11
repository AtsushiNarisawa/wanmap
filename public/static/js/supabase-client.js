// Supabaseクライアント（フロントエンド用）
// CDN版のSupabase JSライブラリを使用

class SupabaseClient {
  constructor() {
    this.client = null;
    this.user = null;
  }

  // 初期化（HTMLから環境変数を渡す）
  async init(supabaseUrl, supabaseKey) {
    if (!window.supabase) {
      console.error('Supabase JS library not loaded');
      return false;
    }

    this.client = window.supabase.createClient(supabaseUrl, supabaseKey);
    
    // 現在のセッションを確認
    const { data: { session } } = await this.client.auth.getSession();
    if (session) {
      this.user = session.user;
    }

    // 認証状態の変更を監視
    this.client.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.user = session.user;
        this.onAuthStateChanged(session.user);
      } else {
        this.user = null;
        this.onAuthStateChanged(null);
      }
    });

    return true;
  }

  // 認証状態変更時のコールバック（オーバーライド可能）
  onAuthStateChanged(user) {
    console.log('Auth state changed:', user);
    // UIを更新する処理をここに追加
  }

  // ===== 認証関連 =====

  // メールアドレスでサインアップ
  async signUp(email, password, metadata = {}) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    return data;
  }

  // メールアドレスでログイン
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    this.user = data.user;
    return data;
  }

  // ログアウト
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
    this.user = null;
  }

  // 現在のユーザーを取得
  getCurrentUser() {
    return this.user;
  }

  // ===== プロフィール関連 =====

  // プロフィール作成
  async createProfile(username, displayName, bio = '') {
    const { data, error } = await this.client
      .from('profiles')
      .insert({
        id: this.user.id,
        username,
        display_name: displayName,
        bio
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // プロフィール取得
  async getProfile(userId) {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // プロフィール更新
  async updateProfile(updates) {
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', this.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== ルート関連 =====

  // ルート一覧取得
  async getRoutes(limit = 20, offset = 0) {
    const { data, error } = await this.client
      .from('routes')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        dogs:dog_id (name, avatar_url),
        route_photos (url, thumbnail_url)
      `)
      .order('walked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // ルート詳細取得
  async getRoute(routeId) {
    const { data, error } = await this.client
      .from('routes')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        dogs:dog_id (name, breed, avatar_url),
        route_photos (id, url, thumbnail_url, caption, location, order_index),
        comments (id, content, created_at, profiles (username, display_name, avatar_url))
      `)
      .eq('id', routeId)
      .single();

    if (error) throw error;
    return data;
  }

  // ルート作成
  async createRoute(routeData) {
    const { data, error } = await this.client
      .from('routes')
      .insert({
        user_id: this.user.id,
        ...routeData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ルート削除
  async deleteRoute(routeId) {
    const { error } = await this.client
      .from('routes')
      .delete()
      .eq('id', routeId)
      .eq('user_id', this.user.id);

    if (error) throw error;
  }

  // ===== 犬プロフィール関連 =====

  // 犬プロフィール取得（自分の犬）
  async getMyDogs() {
    const { data, error } = await this.client
      .from('dogs')
      .select('*')
      .eq('user_id', this.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // 犬プロフィール作成
  async createDog(dogData) {
    const { data, error } = await this.client
      .from('dogs')
      .insert({
        user_id: this.user.id,
        ...dogData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== いいね関連 =====

  // いいねを追加
  async likeRoute(routeId) {
    const { data, error } = await this.client
      .from('likes')
      .insert({
        user_id: this.user.id,
        route_id: routeId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // いいねを削除
  async unlikeRoute(routeId) {
    const { error } = await this.client
      .from('likes')
      .delete()
      .eq('user_id', this.user.id)
      .eq('route_id', routeId);

    if (error) throw error;
  }

  // ===== コメント関連 =====

  // コメント追加
  async addComment(routeId, content) {
    const { data, error } = await this.client
      .from('comments')
      .insert({
        user_id: this.user.id,
        route_id: routeId,
        content
      })
      .select(`
        *,
        profiles (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}

// グローバルインスタンス
window.supabaseClient = new SupabaseClient();
