// 地図管理クラス（Leaflet.js + OpenStreetMap）

class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.currentTrack = [];
    this.trackingLine = null;
    this.isTracking = false;
    this.watchId = null;
    
    // デフォルトオプション
    this.options = {
      center: [35.2332, 139.1066], // 箱根（DogHub所在地）
      zoom: 13,
      minZoom: 5,
      maxZoom: 18,
      ...options
    };
  }

  // 地図を初期化
  init() {
    // Leaflet地図を作成
    this.map = L.map(this.containerId).setView(
      this.options.center,
      this.options.zoom
    );

    // OpenStreetMapタイルレイヤーを追加
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom
    }).addTo(this.map);

    // 地図のリサイズを監視
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);

    return this;
  }

  // 現在地を取得して地図に表示
  async showCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // 地図を現在地に移動
          this.map.setView([lat, lng], 15);
          
          // 現在地マーカーを追加
          this.addMarker(lat, lng, {
            icon: this.createCustomIcon('🐾', '#FF6B6B'),
            title: '現在地'
          });

          resolve({ lat, lng });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // カスタムアイコンを作成
  createCustomIcon(emoji, color = '#3B82F6') {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transform: rotate(-45deg);
        ">
          <span style="transform: rotate(45deg);">${emoji}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });
  }

  // マーカーを追加
  addMarker(lat, lng, options = {}) {
    const markerOptions = {
      icon: options.icon || this.createCustomIcon('📍'),
      title: options.title || ''
    };

    const marker = L.marker([lat, lng], markerOptions).addTo(this.map);
    
    if (options.popup) {
      marker.bindPopup(options.popup);
    }

    this.markers.push(marker);
    return marker;
  }

  // すべてのマーカーをクリア
  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  // ===== GPSトラッキング機能 =====

  // トラッキング開始
  startTracking(onUpdate, onError) {
    if (this.isTracking) {
      console.warn('Tracking is already started');
      return;
    }

    this.isTracking = true;
    this.currentTrack = [];

    // 既存のトラッキングラインをクリア
    if (this.trackingLine) {
      this.trackingLine.remove();
      this.trackingLine = null;
    }

    // 位置情報の監視を開始
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const timestamp = position.timestamp;

        // トラックに追加
        this.currentTrack.push({
          lat,
          lng,
          accuracy,
          timestamp,
          altitude: position.coords.altitude,
          speed: position.coords.speed
        });

        // トラッキングラインを更新
        this.updateTrackingLine();

        // 地図の中心を現在地に移動
        this.map.setView([lat, lng], this.map.getZoom());

        // コールバック実行
        if (onUpdate) {
          onUpdate({
            lat,
            lng,
            accuracy,
            distance: this.calculateTrackDistance(),
            duration: this.calculateTrackDuration(),
            points: this.currentTrack.length
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (onError) {
          onError(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  // トラッキング停止
  stopTracking() {
    if (!this.isTracking) {
      return null;
    }

    this.isTracking = false;

    // 位置情報の監視を停止
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // トラッキングデータを返す
    const trackData = {
      points: [...this.currentTrack],
      distance: this.calculateTrackDistance(),
      duration: this.calculateTrackDuration(),
      startPoint: this.currentTrack[0],
      endPoint: this.currentTrack[this.currentTrack.length - 1]
    };

    return trackData;
  }

  // トラッキングラインを更新
  updateTrackingLine() {
    // 既存のラインを削除
    if (this.trackingLine) {
      this.trackingLine.remove();
    }

    // 新しいラインを描画
    if (this.currentTrack.length > 1) {
      const latlngs = this.currentTrack.map(point => [point.lat, point.lng]);
      
      this.trackingLine = L.polyline(latlngs, {
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(this.map);
    }
  }

  // トラック距離を計算（メートル）
  calculateTrackDistance() {
    if (this.currentTrack.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < this.currentTrack.length; i++) {
      const prev = this.currentTrack[i - 1];
      const curr = this.currentTrack[i];
      totalDistance += this.haversineDistance(
        prev.lat, prev.lng,
        curr.lat, curr.lng
      );
    }

    return totalDistance;
  }

  // トラック時間を計算（秒）
  calculateTrackDuration() {
    if (this.currentTrack.length < 2) return 0;

    const start = this.currentTrack[0].timestamp;
    const end = this.currentTrack[this.currentTrack.length - 1].timestamp;
    
    return Math.floor((end - start) / 1000);
  }

  // Haversine距離計算（メートル）
  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ===== ルート表示機能 =====

  // 保存されたルートを地図に表示
  displayRoute(routeData) {
    // マーカーとラインをクリア
    this.clearMarkers();
    if (this.trackingLine) {
      this.trackingLine.remove();
    }

    // GeoJSONからポイントを抽出
    const points = this.parseGeoJSON(routeData.path);
    
    if (points.length === 0) return;

    // ルートラインを描画
    const latlngs = points.map(p => [p.lat, p.lng]);
    this.trackingLine = L.polyline(latlngs, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.8
    }).addTo(this.map);

    // 開始地点マーカー
    this.addMarker(points[0].lat, points[0].lng, {
      icon: this.createCustomIcon('🏁', '#10B981'),
      title: 'スタート',
      popup: '<b>スタート地点</b>'
    });

    // 終了地点マーカー
    const lastPoint = points[points.length - 1];
    this.addMarker(lastPoint.lat, lastPoint.lng, {
      icon: this.createCustomIcon('🎯', '#EF4444'),
      title: 'ゴール',
      popup: '<b>ゴール地点</b>'
    });

    // 地図をルート全体に合わせる
    this.map.fitBounds(this.trackingLine.getBounds(), {
      padding: [50, 50]
    });
  }

  // GeoJSON LINESTRINGをパース
  parseGeoJSON(geoJsonPath) {
    try {
      const parsed = typeof geoJsonPath === 'string' 
        ? JSON.parse(geoJsonPath) 
        : geoJsonPath;

      if (parsed.type === 'LineString') {
        return parsed.coordinates.map(coord => ({
          lng: coord[0],
          lat: coord[1]
        }));
      }
    } catch (e) {
      console.error('Failed to parse GeoJSON:', e);
    }
    return [];
  }

  // トラックデータをGeoJSON形式に変換
  trackToGeoJSON() {
    if (this.currentTrack.length < 2) return null;

    return {
      type: 'LineString',
      coordinates: this.currentTrack.map(point => [
        point.lng,
        point.lat
      ])
    };
  }

  // 地図を破棄
  destroy() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    if (this.map) {
      this.map.remove();
    }
  }
}

// グローバルインスタンス
window.MapManager = MapManager;
