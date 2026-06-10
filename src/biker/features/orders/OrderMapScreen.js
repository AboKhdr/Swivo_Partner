import React, {useState, useRef} from 'react';
import {
  ActivityIndicator, Linking, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, MapPin, MessageCircle, Phone, Play} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import config from '../../../config';

let WebView = null;
try { WebView = require('react-native-webview').WebView; } catch (_) {}

const GOOGLE_MAPS_API_KEY = config.GOOGLE_MAPS_API_KEY;

function buildMapHtml(apiKey, lat, lng, label) {
  const safeLabel = (label ?? '').replace(/'/g, "\\'");
  return `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>* {margin:0;padding:0;box-sizing:border-box} html,body,#map{width:100%;height:100%}</style>
</head>
<body>
<div id="map"></div>
<script>
function initMap() {
  var pos = {lat: ${lat}, lng: ${lng}};
  var map = new google.maps.Map(document.getElementById('map'), {
    center: pos, zoom: 16,
    mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
  });
  var marker = new google.maps.Marker({
    position: pos, map: map,
    title: '${safeLabel}',
    animation: google.maps.Animation.DROP,
  });
  var info = new google.maps.InfoWindow({content: '<div style="font-family:sans-serif;font-size:13px;padding:4px 2px">${safeLabel}</div>'});
  marker.addListener('click', function(){ info.open(map, marker); });
  info.open(map, marker);
}
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap" async defer></script>
</body></html>`.trim();
}

export default function OrderMapScreen({order, onBack, onGoToDetail}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError,   setMapError]   = useState(false);
  const webViewRef = useRef(null);

  // ── data — supports new shape (location.coordinates, car, services) and legacy ──
  const snap        = order.addressSnapshot ?? {};
  const coords      = order.location?.coordinates ?? {};
  const lat         = coords.lat ?? snap.lat ?? order.location?.lat ?? 24.7136;
  const lng         = coords.lng ?? snap.lng ?? order.location?.lng ?? 46.6753;
  const addressText = order.location?.addressText ?? snap.addressText ?? snap.district ?? order.branch?.address ?? '';
  const district    = snap.district ?? '';
  const city        = snap.city ?? '';
  const fullAddress = [addressText, district, city].filter(Boolean).join('، ');

  // client — new: client.name  |  legacy: firstName + lastName
  const clientName  = order.client?.name
    ?? (order.client ? `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim() : '');
  const clientPhone = order.client?.phoneNumber ?? order.client?.phone ?? '';

  // service — new: services[0].name  |  legacy: itemsSnapshot[0].nameSnapshot
  const strVal      = v => (!v ? '' : typeof v === 'string' ? v : v.ar ?? v.en ?? '');
  const firstSvc    = order.services?.[0];
  const firstItem   = order.itemsSnapshot?.[0];
  const serviceName = strVal(firstSvc?.name)
    || strVal(firstItem?.nameSnapshot)
    || strVal(order.service?.name);

  const scheduledAt = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString('ar-SA', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
      })
    : '';

  // ── actions ───────────────────────────────────────────────────────────
  const callClient = () => {
    if (clientPhone) Linking.openURL(`tel:${clientPhone}`);
  };

  const openWhatsApp = () => {
    if (!clientPhone) return;
    const clean = clientPhone.replace(/[\s+\-()]/g, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() => {});
  };

  const html = buildMapHtml(GOOGLE_MAPS_API_KEY, lat, lng, fullAddress || clientName);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('orderMap.title')}</Text>
          {!!fullAddress && (
            <Text style={[s.headerSub, {color: colors.textSecondary}]} numberOfLines={1}>
              {fullAddress}
            </Text>
          )}
        </View>
        <View style={[s.headerIcon, {backgroundColor: colors.primary + '15'}]}>
          <MapPin size={18} color={colors.primary} strokeWidth={2} />
        </View>
      </View>

      {/* Info strip */}
      <View style={[s.strip, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.customer')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]} numberOfLines={1}>{clientName}</Text>
        </View>
        <View style={[s.stripDivider, {backgroundColor: colors.border}]} />
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.service')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]} numberOfLines={1}>{serviceName}</Text>
        </View>
        <View style={[s.stripDivider, {backgroundColor: colors.border}]} />
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.time')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]}>{scheduledAt}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={s.mapWrap}>
        {!WebView ? (
          <View style={[s.fallback, {backgroundColor: colors.card}]}>
            <Text style={[s.fallbackIcon]}>🗺️</Text>
            <Text style={[s.fallbackTitle, {color: colors.textPrimary}]}>{t('orderMap.mapUnavailable')}</Text>
            <Text style={[s.fallbackSub, {color: colors.textSecondary}]}>{t('orderMap.webviewNotInstalled')}</Text>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{html, baseUrl: 'https://maps.google.com'}}
              originWhitelist={[
                'https://*.googleapis.com',
                'https://*.gstatic.com',
                'https://maps.google.com',
              ]}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              mixedContentMode="never"
              onLoadStart={() => { setMapLoading(true); setMapError(false); }}
              onLoadEnd={()   => setMapLoading(false)}
              onError={()     => { setMapLoading(false); setMapError(true); }}
              style={s.webview}
              scrollEnabled={false}
              androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
            />
            {mapLoading && !mapError && (
              <View style={[s.overlay, {backgroundColor: isDark ? '#1E293B' : '#F1F5F9'}]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[s.overlayText, {color: colors.textSecondary}]}>{t('orderMap.mapLoading')}</Text>
              </View>
            )}
            {mapError && (
              <View style={[s.overlay, {backgroundColor: colors.card}]}>
                <Text style={s.fallbackIcon}>⚠️</Text>
                <Text style={[s.fallbackTitle, {color: colors.textPrimary}]}>{t('orderMap.mapError')}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Action buttons */}
      <View style={[s.actions, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        {!!clientPhone && (
          <TouchableOpacity
            style={[s.actionBtn, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={callClient}
            activeOpacity={0.8}>
            <Phone size={18} color={colors.primary} strokeWidth={2} />
            <Text style={[s.actionBtnText, {color: colors.primary}]}>{t('orderMap.call')}</Text>
          </TouchableOpacity>
        )}
        {!!clientPhone && (
          <TouchableOpacity
            style={[s.actionBtn, {backgroundColor: '#25D366' + '15', borderColor: '#25D366' + '40'}]}
            onPress={openWhatsApp}
            activeOpacity={0.8}>
            <MessageCircle size={18} color="#25D366" strokeWidth={2} />
            <Text style={[s.actionBtnText, {color: '#25D366'}]}>{t('orderMap.whatsapp')}</Text>
          </TouchableOpacity>
        )}
        {!!onGoToDetail && (
          <TouchableOpacity
            style={[s.actionBtn, {backgroundColor: colors.primary, borderColor: colors.primary}]}
            onPress={() => onGoToDetail(order)}
            activeOpacity={0.8}>
            <Play size={18} color="#fff" strokeWidth={2} />
            <Text style={[s.actionBtnText, {color: '#fff'}]}>{t('orderMap.startOrder')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:      {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerCenter: {flex: 1},
  headerTitle:  {fontSize: 16, fontWeight: '700'},
  headerSub:    {fontSize: 12, marginTop: 2},
  headerIcon:   {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  strip:        {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1,
  },
  stripItem:    {flex: 1, alignItems: 'center'},
  stripLabel:   {fontSize: 10, marginBottom: 3},
  stripValue:   {fontSize: 13, fontWeight: '700'},
  stripDivider: {width: 1, height: 32},
  mapWrap:      {flex: 1, overflow: 'hidden'},
  webview:      {flex: 1, backgroundColor: 'transparent'},
  overlay:      {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  overlayText:  {fontSize: 13},
  fallback:     {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},
  fallbackIcon: {fontSize: 40},
  fallbackTitle:{fontSize: 15, fontWeight: '700'},
  fallbackSub:  {fontSize: 12},
  actions:      {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
  },
  actionBtn:    {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText:{fontSize: 14, fontWeight: '700'},
  navBtn:       {borderWidth: 0},
  navBtnText:   {fontSize: 14, fontWeight: '700', color: '#fff'},
});
