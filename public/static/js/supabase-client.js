// Supabaseクライアント初期化
let supabaseClient = null;
let currentUser = null;

// Supabase設定を取得して初期化
async function initSupabase() {
  try {
    const response = await axios.get('/api/config');
    const { supabaseUrl, supabaseAnonKey } = response.data;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase未設定: モックモードで動作します');
      return null;
    }
    
    const { createClient } = supabase;
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // 現在のユーザーを取得
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;
    
    // 認証状態の変更を監視
    supabaseClient.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      updateUIForAuth();
    });
    
    updateUIForAuth();
    return supabaseClient;
  } catch (error) {
    console.error('Supabase初期化エラー:', error);
    return null;
  }
}

// 認証状態に応じてUIを更新
function updateUIForAuth() {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  
  if (currentUser) {
    loginBtn.innerHTML = '<i class="fas fa-user-circle text-green-500"></i>';
    loginBtn.title = currentUser.email;
  } else {
    loginBtn.innerHTML = '<i class="fas fa-user"></i>';
    loginBtn.title = 'ログイン';
  }
}

// メール認証でサインアップ
async function signUp(email, password, username, displayName) {
  if (!supabaseClient) {
    alert('Supabase未設定です。database/README.mdを参照してください。');
    return { error: { message: 'Supabase未設定' } };
  }
  
  try {
    // 1. ユーザー作成
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName
        }
      }
    });
    
    if (error) return { error };
    
    // 2. プロフィール作成（auth.users作成後に自動実行されるトリガーが必要）
    // または手動でprofilesテーブルに挿入
    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          display_name: displayName
        });
      
      if (profileError) console.error('プロフィール作成エラー:', profileError);
    }
    
    return { data, error: null };
  } catch (error) {
    return { error };
  }
}

// メール認証でログイン
async function signIn(email, password) {
  if (!supabaseClient) {
    alert('Supabase未設定です。database/README.mdを参照してください。');
    return { error: { message: 'Supabase未設定' } };
  }
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

// ログアウト
async function signOut() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
}

// 現在のユーザーを取得
function getCurrentUser() {
  return currentUser;
}

// ルート一覧を取得
async function getRoutes(options = {}) {
  if (!supabaseClient) {
    // モックデータを返す
    return {
      data: [
        {
          id: '1',
          title: '箱根湖畔散歩コース',
          description: '芦ノ湖周辺の静かな散歩道',
          distance: 2500,
          duration: 1800,
          difficulty: 'easy',
          like_count: 15,
          username: 'demo',
          display_name: 'デモユーザー',
          dog_name: 'ポチ',
          walked_at: new Date().toISOString()
        }
      ],
      error: null
    };
  }
  
  try {
    let query = supabaseClient
      .from('route_list')
      .select('*')
      .order('walked_at', { ascending: false })
      .limit(options.limit || 20);
    
    // 距離範囲検索（PostGIS）
    if (options.lat && options.lng && options.radius) {
      // ST_DWithin関数を使用（メートル単位）
      query = query.filter(
        'start_point',
        'st_dwithin',
        `POINT(${options.lng} ${options.lat})::geography,${options.radius}`
      );
    }
    
    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ルート詳細を取得
async function getRouteById(routeId) {
  if (!supabaseClient) {
    return {
      data: {
        id: routeId,
        title: 'デモルート',
        description: 'Supabase設定後に実データが表示されます',
        distance: 2500,
        duration: 1800,
        path: [[35.2041, 139.0258], [35.2045, 139.0260]],
        photos: []
      },
      error: null
    };
  }
  
  const { data, error } = await supabaseClient
    .from('routes')
    .select(`
      *,
      profiles:user_id(*),
      dogs:dog_id(*),
      route_photos(*)
    `)
    .eq('id', routeId)
    .single();
  
  return { data, error };
}

// ルートを保存
async function saveRoute(routeData) {
  if (!supabaseClient || !currentUser) {
    alert('ログインが必要です');
    return { error: { message: 'ログインが必要' } };
  }
  
  const { data, error } = await supabaseClient
    .from('routes')
    .insert({
      user_id: currentUser.id,
      ...routeData
    })
    .select()
    .single();
  
  return { data, error };
}

// いいねを追加/削除
async function toggleLike(routeId) {
  if (!supabaseClient || !currentUser) {
    alert('ログインが必要です');
    return { error: { message: 'ログインが必要' } };
  }
  
  // すでにいいねしているか確認
  const { data: existing } = await supabaseClient
    .from('likes')
    .select('id')
    .eq('route_id', routeId)
    .eq('user_id', currentUser.id)
    .single();
  
  if (existing) {
    // いいね削除
    return await supabaseClient
      .from('likes')
      .delete()
      .eq('id', existing.id);
  } else {
    // いいね追加
    return await supabaseClient
      .from('likes')
      .insert({
        route_id: routeId,
        user_id: currentUser.id
      });
  }
}
