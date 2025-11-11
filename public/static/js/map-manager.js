// GPS記録とマップ管理クラス
class MapManager {
  constructor() {
    this.map = null;
    this.recording = false;
    this.path = [];
    this.markers = [];
    this.polyline = null;
    this.watchId = null;
    this.startTime = null;
    this.distance = 0;
  }

  // 地図を初期化
  initMap(containerId, center = [35.2041, 139.0258], zoom = 13) {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(containerId).setView(center, zoom);

    // OpenStreetMapタイルレイヤー
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    return this.map;
  }

  // 現在位置を取得
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation APIがサポートされていません'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: false, // 高精度をオフにして速度優先
          timeout: 30000, // 30秒に延長
          maximumAge: 60000 // 1分以内のキャッシュを許可
        }
      );
    });
  }

  // GPS記録を開始
  startRecording() {
    if (this.recording) return;

    this.recording = true;
    this.path = [];
    this.distance = 0;
    this.startTime = new Date();

    // ポリライン（経路線）を作成
    this.polyline = L.polyline([], {
      color: '#10B981',
      weight: 5,
      opacity: 0.7
    }).addTo(this.map);

    // GPS位置監視を開始
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point = [position.coords.latitude, position.coords.longitude];
        this.path.push(point);

        // ポリラインを更新
        this.polyline.addLatLng(point);

        // 距離を計算
        if (this.path.length > 1) {
          const lastPoint = this.path[this.path.length - 2];
          this.distance += this.calculateDistance(
            lastPoint[0], lastPoint[1],
            point[0], point[1]
          );
        }

        // 地図の中心を現在位置に移動
        this.map.setView(point, this.map.getZoom());

        // UIを更新（外部から呼び出し）
        if (window.updateRecordingUI) {
          window.updateRecordingUI(this.distance, this.getDuration());
        }
      },
      (error) => {
        console.error('GPS位置取得エラー:', error);
        alert('GPS位置が取得できません');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return true;
  }

  // GPS記録を停止
  stopRecording() {
    if (!this.recording) return null;

    this.recording = false;

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    const result = {
      path: this.path,
      distance: this.distance,
      duration: this.getDuration(),
      startTime: this.startTime,
      endTime: new Date()
    };

    return result;
  }

  // 経過時間を取得（秒）
  getDuration() {
    if (!this.startTime) return 0;
    return Math.floor((new Date() - this.startTime) / 1000);
  }

  // 2点間の距離を計算（Haversine公式、メートル単位）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球の半径（メートル）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ルートを地図に表示
  displayRoute(routeData) {
    if (!this.map) return;

    // 既存のマーカー・ポリラインをクリア
    this.clearMap();

    const { path, start_point, end_point } = routeData;

    // 経路線を描画
    if (path && path.length > 0) {
      this.polyline = L.polyline(path, {
        color: '#10B981',
        weight: 5,
        opacity: 0.7
      }).addTo(this.map);

      // 地図の表示範囲を経路に合わせる
      this.map.fitBounds(this.polyline.getBounds(), { padding: [50, 50] });
    }

    // スタート地点マーカー
    if (start_point) {
      const startMarker = L.circleMarker(start_point, {
        radius: 10,
        fillColor: '#3B82F6',
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(this.map);
      startMarker.bindPopup('<b>スタート地点</b>');
      this.markers.push(startMarker);
    }

    // ゴール地点マーカー
    if (end_point) {
      const endMarker = L.circleMarker(end_point, {
        radius: 10,
        fillColor: '#EF4444',
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(this.map);
      endMarker.bindPopup('<b>ゴール地点</b>');
      this.markers.push(endMarker);
    }
  }

  // 地図をクリア
  clearMap() {
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }

    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
  }

  // 複数のルートを表示（一覧表示用）
  displayMultipleRoutes(routes) {
    if (!this.map) return;

    this.clearMap();

    routes.forEach((route, index) => {
      if (!route.path) return;

      // 各ルートに異なる色を付ける
      const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
      const color = colors[index % colors.length];

      const polyline = L.polyline(route.path, {
        color,
        weight: 4,
        opacity: 0.6
      }).addTo(this.map);

      polyline.bindPopup(`
        <b>${route.title}</b><br>
        距離: ${(route.distance / 1000).toFixed(1)}km
      `);

      this.markers.push(polyline);
    });

    // すべてのルートが見えるように地図を調整
    const group = L.featureGroup(this.markers);
    if (group.getBounds().isValid()) {
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  // 地図のサイズを再調整（コンテナサイズ変更時）
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

// グローバルインスタンス
const mapManager = new MapManager();
