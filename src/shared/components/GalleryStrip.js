import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {X} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import {getTenantGallery} from '../../services/biker';

// ─── Fullscreen viewer ────────────────────────────────────────────────────────

function FullscreenViewer({photos, startIndex, onClose}) {
  const [current, setCurrent] = useState(startIndex);
  const flatRef = useRef(null);

  const onScroll = useCallback(e => {
    const idx = Math.round(
      e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width,
    );
    setCurrent(idx);
  }, []);

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={sv.root}>
        <View style={sv.topBar}>
          <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.8}>
            <X size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={sv.counter}>{current + 1} / {photos.length}</Text>
        </View>

        <FlatList
          ref={flatRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item._id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({length: 390, offset: 390 * i, index: i})}
          renderItem={({item}) => (
            <View style={sv.page}>
              <Image source={{uri: item.url}} style={sv.img} resizeMode="contain" />
              {!!item.caption && (
                <Text style={sv.caption}>{item.caption}</Text>
              )}
            </View>
          )}
        />

        <View style={sv.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[sv.dot, {opacity: i === current ? 1 : 0.35}]} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function Skeleton() {
  return (
    <View style={sk.row}>
      {[0, 1, 2].map(i => (
        <View key={i} style={sk.box} />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GalleryStrip({tenantId}) {
  const {colors}                  = useTheme();
  const {t}                       = useI18n();
  const [photos,  setPhotos]      = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewer,  setViewer]      = useState({visible: false, index: 0});

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    getTenantGallery(tenantId)
      .then(res => {
        if (res.success) setPhotos(res.data?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <Skeleton />;
  if (photos.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={[s.title, {color: colors.textPrimary}]}>{t('partner.gallery.title')}</Text>
      <FlatList
        data={photos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item._id}
        contentContainerStyle={s.list}
        renderItem={({item, index}) => (
          <TouchableOpacity
            onPress={() => setViewer({visible: true, index})}
            activeOpacity={0.85}
            style={s.thumb}>
            <Image source={{uri: item.url}} style={s.img} resizeMode="cover" />
            {!!item.caption && (
              <Text style={[s.caption, {color: colors.textSecondary}]} numberOfLines={1}>
                {item.caption}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      {viewer.visible && (
        <FullscreenViewer
          photos={photos}
          startIndex={viewer.index}
          onClose={() => setViewer({visible: false, index: 0})}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    {gap: 10},
  title:   {fontSize: 15, fontWeight: '800', paddingHorizontal: 16},
  list:    {paddingHorizontal: 16, gap: 8},
  thumb:   {gap: 4},
  img:     {width: 140, height: 100, borderRadius: 10},
  caption: {fontSize: 11, width: 140},
});

const sk = StyleSheet.create({
  row:  {flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4},
  box:  {width: 140, height: 100, borderRadius: 10, backgroundColor: '#E5E7EB'},
});

const sv = StyleSheet.create({
  root:    {flex: 1, backgroundColor: '#000'},
  topBar:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12},
  closeBtn:{padding: 4},
  counter: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  page:    {width: 390, flex: 1, justifyContent: 'center', alignItems: 'center'},
  img:     {width: '100%', height: '70%'},
  caption: {color: '#FFF', fontSize: 14, marginTop: 16, paddingHorizontal: 24, textAlign: 'center'},
  dots:    {flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 32},
  dot:     {width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF'},
});
