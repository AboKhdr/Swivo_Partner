import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Locate, RefreshCw} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';
import config from '../../config';

// react-native-webview — requires native build after: npm install react-native-webview
let WebView = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (_) {}

const GOOGLE_MAPS_API_KEY = config.GOOGLE_MAPS_API_KEY;
const MAPS_ORIGIN_WHITELIST = [
  'https://*.googleapis.com',
  'https://*.gstatic.com',
  'https://maps.google.com',
];

function buildHtml(apiKey, options) {
  const {
    initialCenter,
    initialZoom,
    initialPoints,
    editable,
    canDraw,
    mode,
  } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    #toolbar {
      position: absolute; top: 10px; right: 10px; z-index: 10;
      display: flex; flex-direction: column; gap: 8px;
    }
    .tool-btn {
      width: 40px; height: 40px; border-radius: 20px;
      background: white; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      font-size: 18px;
    }
    .tool-btn:active { background: #f0f0f0; }
    #hint {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.6); color: #fff; font-size: 12px;
      padding: 6px 14px; border-radius: 20px; pointer-events: none;
      font-family: sans-serif; white-space: nowrap;
    }
  </style>
</head>
<body>
<div id="map"></div>
<div id="toolbar">
  <button class="tool-btn" onclick="handleRefresh()" title="Refresh">↺</button>
  <button class="tool-btn" onclick="fitAll()" title="Fit All">⊕</button>
</div>
<div id="hint">${mode === 'edit' ? 'ارسم أو اسحب النقاط لضبط المنطقة' : 'عرض المنطقة'}</div>

<script>
  var map, dm;
  var polygons = [];
  var markers  = [];
  var initialCenter = ${JSON.stringify(initialCenter)};
  var initialZoom   = ${initialZoom};
  var normalizedZones = ${JSON.stringify(
    (Array.isArray(initialPoints) ? initialPoints : []).map(z => ({
      ...z,
      points: (z?.points || []).filter(
        p => typeof p?.lat === 'number' && typeof p?.lng === 'number',
      ),
    }))
  )};
  var editable = ${editable ? 'true' : 'false'};
  var canDraw  = ${canDraw  ? 'true' : 'false'};
  var mode     = '${mode}';

  function postMessage(type, payload) {
    var msg = JSON.stringify({type: type, payload: payload});
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  }

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Place a marker on the initial center (Riyadh by default)
    new google.maps.Marker({
      position: initialCenter,
      map: map,
      title: 'الرياض',
    });

    drawZones(normalizedZones);

    if (canDraw && mode === 'edit') {
      enableDrawingManager();
    }

    fitAll();
  }

  function drawZones(zones) {
    zones.forEach(function(z) {
      if (!z.points || !z.points.length) return;
      var poly = new google.maps.Polygon({
        paths: z.points,
        editable: editable && mode === 'edit',
        draggable: false,
        fillColor: '#1B7BF5',
        strokeColor: '#1B7BF5',
        fillOpacity: 0.15,
        strokeWeight: 2,
      });
      poly.setMap(map);
      polygons.push(poly);
      if (editable && mode === 'edit') attachVertexMarkers(poly);
    });
  }

  function enableDrawingManager() {
    dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon'],
      },
      polygonOptions: {
        editable: editable,
        draggable: false,
        fillColor: '#1B7BF5',
        strokeColor: '#1B7BF5',
        fillOpacity: 0.15,
        strokeWeight: 2,
      },
    });
    dm.setMap(map);

    google.maps.event.addListener(dm, 'polygoncomplete', function(poly) {
      polygons.push(poly);
      var points = poly.getPath().getArray().map(function(p) {
        return {lat: p.lat(), lng: p.lng()};
      });
      postMessage('polygonComplete', {points: points});
      if (editable) attachVertexMarkers(poly);
    });
  }

  function attachVertexMarkers(poly) {
    var path = poly.getPath();

    function refreshMarkers() {
      markers.forEach(function(m) { m.setMap(null); });
      markers = [];
      for (var i = 0; i < path.getLength(); i++) {
        (function(idx) {
          var marker = new google.maps.Marker({
            position: path.getAt(idx),
            map: map,
            label: String(idx + 1),
            draggable: true,
          });
          google.maps.event.addListener(marker, 'dragend', function() {
            path.setAt(idx, marker.getPosition());
            var updated = [];
            for (var j = 0; j < path.getLength(); j++) {
              updated.push({lat: path.getAt(j).lat(), lng: path.getAt(j).lng()});
            }
            postMessage('markerDrag', {points: updated});
          });
          markers.push(marker);
        })(i);
      }
    }

    refreshMarkers();
    path.addListener('insert_at', refreshMarkers);
    path.addListener('remove_at', refreshMarkers);
    path.addListener('set_at',    refreshMarkers);
  }

  function fitAll() {
    if (!map) return;
    var bounds = new google.maps.LatLngBounds();
    var added = false;
    polygons.forEach(function(poly) {
      poly.getPath().getArray().forEach(function(coord) {
        bounds.extend(coord);
        added = true;
      });
    });
    if (!added) {
      map.setCenter(initialCenter);
      map.setZoom(initialZoom);
      return;
    }
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setCenter(bounds.getCenter());
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 48);
    }
  }

  function handleRefresh() {
    markers.forEach(function(m) { m.setMap(null); });
    markers = [];
    polygons.forEach(function(p) { p.setMap(null); });
    polygons = [];
    if (dm) { dm.setMap(null); dm = null; }

    if (mode === 'edit') {
      if (canDraw) enableDrawingManager();
      postMessage('refresh', {});
    } else {
      fitAll();
    }
  }

  // listen for messages from React Native
  document.addEventListener('message', function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'fitAll') fitAll();
      if (msg.type === 'refresh') handleRefresh();
    } catch(_) {}
  });
  window.addEventListener('message', function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'fitAll') fitAll();
      if (msg.type === 'refresh') handleRefresh();
    } catch(_) {}
  });
</script>

<script
  src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,places&callback=initMap"
  async defer>
</script>
</body>
</html>
  `.trim();
}

export default function MapContainer({
  height            = 800,
  initialCenter     = {lat: 24.7136, lng: 46.6753},
  initialZoom       = 12,
  editable          = true,
  initialPoints     = [],
  canDraw           = true,
  mode              = 'edit',
  onPolygonComplete = null,
  onMarkerDrag      = null,
}) {
  const {colors, isDark} = useTheme();
  const webViewRef = useRef(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const html = buildHtml(GOOGLE_MAPS_API_KEY, {
    initialCenter,
    initialZoom,
    initialPoints,
    editable,
    canDraw,
    mode,
  });

  const handleMessage = useCallback(e => {
    try {
      const {type, payload} = JSON.parse(e.nativeEvent.data);
      if (type === 'polygonComplete') onPolygonComplete?.(payload.points);
      if (type === 'markerDrag')      onMarkerDrag?.(payload.points);
    } catch (_) {}
  }, [onPolygonComplete, onMarkerDrag]);

  const postMsg = useCallback(type => {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'${type}'})})); true;`
    );
  }, []);

  const containerHeight = height == null ? {flex: 1} : {height};

  if (!WebView) {
    return (
      <View style={[s.fallback, containerHeight, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <Text style={[s.fallbackText, {color: colors.textSecondary}]}>
          الخريطة غير متاحة
        </Text>
        <Text style={[s.fallbackSub, {color: colors.textSecondary}]}>
          npm install react-native-webview
        </Text>
      </View>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={[s.fallback, containerHeight, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <Text style={[s.fallbackText, {color: colors.textSecondary}]}>
          الخريطة غير متاحة
        </Text>
        <Text style={[s.fallbackSub, {color: colors.textSecondary}]}>
          أضف GOOGLE_MAPS_API_KEY في MapContainer.js
        </Text>
      </View>
    );
  }

  const mapHeight = height == null ? {flex: 1} : {height: height - 52};

  return (
    <View style={[s.root, containerHeight]}>
      {/* Toolbar */}
      <View style={[s.toolbar, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TouchableOpacity
          style={[s.toolBtn, {backgroundColor: colors.bg}]}
          onPress={() => postMsg('refresh')}
          activeOpacity={0.7}>
          <RefreshCw size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <TouchableOpacity
          style={[s.toolBtn, {backgroundColor: colors.bg}]}
          onPress={() => postMsg('fitAll')}
          activeOpacity={0.7}>
          <Locate size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <Text style={[s.hint, {color: colors.textSecondary}]} numberOfLines={1}>
          {mode === 'edit' ? 'ارسم المنطقة أو اسحب النقاط' : 'عرض المنطقة'}
        </Text>
      </View>

      {/* Map */}
      <View style={[s.mapWrap, mapHeight, {borderColor: colors.border}]}>
        <WebView
          ref={webViewRef}
          source={{html, baseUrl: 'https://maps.google.com'}}
          originWhitelist={MAPS_ORIGIN_WHITELIST}
          onMessage={handleMessage}
          onLoadStart={() => { setLoading(true);  setError(false); }}
          onLoadEnd={()   => setLoading(false)}
          onError={()     => { setLoading(false); setError(true); }}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          allowsInlineMediaPlayback
          mixedContentMode="never"
          style={s.webview}
          scrollEnabled={false}
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        />

        {loading && !error && (
          <View style={[s.overlay, {backgroundColor: isDark ? '#1E293B' : '#F1F5F9'}]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {error && (
          <View style={[s.overlay, {backgroundColor: colors.card}]}>
            <Text style={[s.errorText, {color: colors.danger}]}>
              تعذّر تحميل الخريطة
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {width: '100%', gap: 8},

  // Toolbar
  toolbar: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:   14,
    borderWidth:    1,
  },
  toolBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  divider:  {width: 1, height: 18},
  hint:     {flex: 1, fontSize: 12},

  // Map
  mapWrap: {
    width: '100%', borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
  },
  webview:  {width: '100%', height: '100%', backgroundColor: 'transparent'},
  overlay:  {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: {fontSize: 14, fontWeight: '600'},

  // Fallback
  fallback: {
    width: '100%', borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fallbackText: {fontSize: 14, fontWeight: '600'},
  fallbackSub:  {fontSize: 11},
});
