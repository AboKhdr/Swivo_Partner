import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
// import {WebView} from 'react-native-webview';
import {Colors} from '../constants/colors';

const API_KEY = 'AIzaSyDKpfDr07ynPbVVkdeWg-3Cs9yH-rMQApE';
const DEFAULT_CENTER = {lat: 24.7136, lng: 46.6753};

/**
 * MapContainer
 *
 * Props:
 *   initialCenter  – { lat, lng }
 *   zoom           – number (default 15)
 *   height         – number dp (default 300) | undefined → flex:1
 */
export default function MapContainer({
  initialCenter = DEFAULT_CENTER,
  zoom = 15,
  height = 300,
}) {
  const [loading, setLoading] = useState(true);
  const {lat, lng} = initialCenter;

  const src =
    'https://www.google.com/maps/embed/v1/place' +
    '?key=' + API_KEY +
    '&q=' + lat + ',' + lng +
    '&zoom=' + zoom +
    '&maptype=roadmap';

  const html =
    '<!DOCTYPE html><html><head>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">' +
    '<style>*{margin:0;padding:0;}html,body,iframe{width:100%;height:100%;border:0;}</style>' +
    '</head><body>' +
    '<iframe src="' + src + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
    '</body></html>';

  const wrapStyle = height != null ? [s.wrap, {height}] : [s.wrap, s.wrapFlex];

  return (
    <View style={wrapStyle}>
     {/* <WebView
        style={s.webview}
        source={{html, baseUrl: 'https://www.google.com'}}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        onLoadEnd={() => setLoading(false)}
      />*/}
      {loading && (
        <View style={s.skeleton}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#E8EFF7',
  },
  wrapFlex: {flex: 1},
  webview: {flex: 1},
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EFF7',
  },
});
