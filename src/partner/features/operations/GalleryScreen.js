import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, Camera, Clock, X, XCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getGallery, requestGalleryDeletion} from '../../../services/partner';

// ─── Fullscreen viewer ────────────────────────────────────────────────────────

function FullscreenViewer({photos, startIndex, onClose}) {
  const [current, setCurrent] = useState(startIndex);
  const flatRef = useRef(null);

  const onScroll = useCallback(e => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setCurrent(idx);
  }, []);

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[sv.root, {backgroundColor: '#000'}]}>
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
          getItemLayout={(_, i) => ({length: 390, offset: 390 * i, index: i})}
          initialScrollIndex={startIndex}
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
            <View key={i} style={[sv.dot, {backgroundColor: i === current ? '#FFF' : '#FFFFFF55'}]} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ─── Delete request modal ─────────────────────────────────────────────────────

function DeleteRequestModal({photo, colors, t, onClose, onRequested}) {
  const [reason,     setReason]     = useState('');
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) { setError(t('partner.gallery.reasonRequired')); return; }
    setError('');
    setSubmitting(true);
    const res = await requestGalleryDeletion(photo._id, reason.trim(), note.trim());
    setSubmitting(false);
    if (res.success) {
      onRequested(photo._id);
    } else if (res.error?.includes('409') || res.data?.status === 409) {
      setError(t('partner.gallery.pendingExists'));
    } else {
      setError(t('partner.gallery.requestError'));
    }
  }, [reason, note, photo, t, onRequested]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[am.root, {backgroundColor: colors.bg}]}>
        <View style={[am.header, {borderBottomColor: colors.border}]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.75}><X size={22} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={[am.title, {color: colors.textPrimary}]}>{t('partner.gallery.deleteTitle')}</Text>
          <View style={{width: 22}} />
        </View>

        <ScrollView contentContainerStyle={am.body} showsVerticalScrollIndicator={false}>
          <Image source={{uri: photo.url}} style={am.deletePreview} resizeMode="cover" />

          <Text style={[am.label, {color: colors.textSecondary}]}>{t('partner.gallery.reasonLabel')} *</Text>
          <TextInput
            style={[am.input, {borderColor: colors.border, backgroundColor: colors.card, color: colors.textPrimary}]}
            value={reason}
            onChangeText={setReason}
            placeholder={t('partner.gallery.reasonPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />

          <Text style={[am.label, {color: colors.textSecondary}]}>{t('partner.gallery.noteLabel')}</Text>
          <TextInput
            style={[am.input, {borderColor: colors.border, backgroundColor: colors.card, color: colors.textPrimary}]}
            value={note}
            onChangeText={setNote}
            placeholder={t('partner.gallery.notePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />

          {!!error && <Text style={am.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[am.submitBtn, {backgroundColor: '#EF4444'}, submitting && {opacity: 0.6}]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={am.submitTxt}>{t('partner.gallery.sendRequest')}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({item, colors, t, onPress, onDelete}) {
  const isPending  = item.status === 'pending_deletion';
  const isRejected = item.deletionRequest?.status === 'REJECTED';

  return (
    <TouchableOpacity style={[s.photoCard, {backgroundColor: colors.card}]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{uri: item.url}} style={s.photoImg} resizeMode="cover" />

      {isPending && (
        <View style={s.pendingBadge}>
          <Clock size={10} color="#92400E" />
          <Text style={s.pendingText}>{t('partner.gallery.pendingDeletion')}</Text>
        </View>
      )}

      {isRejected && !isPending && (
        <View style={s.rejectedBadge}>
          <XCircle size={10} color="#991B1B" />
          <Text style={s.rejectedText}>{t('partner.gallery.deletionRejected')}</Text>
        </View>
      )}

      {!isPending && (
        <TouchableOpacity
          style={[s.deleteBtn, {backgroundColor: colors.card}]}
          onPress={() => onDelete(item)}
          activeOpacity={0.8}>
          <XCircle size={16} color="#EF4444" />
        </TouchableOpacity>
      )}

      {!!item.caption && (
        <Text style={[s.captionTxt, {backgroundColor: colors.textPrimary + 'CC', color: '#FFF'}]} numberOfLines={1}>
          {item.caption}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GalleryScreen({onBack}) {
  const {colors}                    = useTheme();
  const {t}                         = useI18n();
  const [photos,      setPhotos]    = useState([]);
  const [meta,        setMeta]      = useState(null);
  const [loading,     setLoading]   = useState(true);
  const [deleteItem,  setDeleteItem]= useState(null);
  const [viewer,      setViewer]    = useState({visible: false, index: 0});

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const res = await getGallery();
    if (res.success) {
      setPhotos(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const handleRequested = useCallback(photoId => {
    setPhotos(prev => prev.map(p =>
      p._id === photoId ? {...p, status: 'pending_deletion'} : p,
    ));
    setDeleteItem(null);
  }, []);

  const renderItem = useCallback(({item, index}) => (
    <PhotoCard
      item={item}
      colors={colors}
      t={t}
      onPress={() => setViewer({visible: true, index})}
      onDelete={setDeleteItem}
    />
  ), [colors, t]);

  const keyExtractor = useCallback(item => item._id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.gallery.title')}</Text>
          {meta != null && (
            <Text style={[s.headerSub, {color: colors.textSecondary}]}>
              {meta.total} / {meta.max} {t('partner.gallery.photos')}
            </Text>
          )}
        </View>
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        : photos.length === 0
          ? (
            <View style={s.center}>
              <Camera size={52} color={colors.textSecondary} />
              <Text style={[s.empty, {color: colors.textSecondary}]}>{t('partner.gallery.empty')}</Text>
            </View>
          )
          : (
            <FlatList
              data={photos}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              numColumns={2}
              contentContainerStyle={s.grid}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={s.row}
            />
          )
      }

      {deleteItem && (
        <DeleteRequestModal
          photo={deleteItem}
          colors={colors}
          t={t}
          onClose={() => setDeleteItem(null)}
          onRequested={handleRequested}
        />
      )}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          {flex: 1},
  center:        {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  empty:         {fontSize: 14, fontWeight: '500'},

  header:        {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText:    {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle:   {fontSize: 24, fontWeight: '900'},
  headerSub:     {fontSize: 13},

  grid:          {paddingHorizontal: 12, paddingBottom: 32},
  row:           {gap: 10, marginBottom: 10},

  photoCard:     {flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},
  photoImg:      {width: '100%', aspectRatio: 1},
  deleteBtn:     {position: 'absolute', top: 6, left: 6, borderRadius: 12, padding: 2, elevation: 2},
  captionTxt:    {position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: 11, paddingHorizontal: 8, paddingVertical: 4},

  pendingBadge:  {position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3},
  pendingText:   {fontSize: 10, fontWeight: '700', color: '#92400E'},
  rejectedBadge: {position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3},
  rejectedText:  {fontSize: 10, fontWeight: '700', color: '#991B1B'},
});

const sv = StyleSheet.create({
  root:    {flex: 1},
  topBar:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12},
  closeBtn:{padding: 4},
  counter: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  page:    {width: 390, flex: 1, justifyContent: 'center', alignItems: 'center'},
  img:     {width: '100%', height: '70%'},
  caption: {color: '#FFF', fontSize: 14, marginTop: 16, paddingHorizontal: 24, textAlign: 'center'},
  dots:    {flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 32},
  dot:     {width: 6, height: 6, borderRadius: 3},
});

const am = StyleSheet.create({
  root:          {flex: 1},
  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1},
  title:         {fontSize: 17, fontWeight: '800'},
  body:          {padding: 20, gap: 12},
  label:         {fontSize: 13, fontWeight: '600'},
  deletePreview: {width: '100%', height: 180, borderRadius: 14, marginBottom: 4},
  input:         {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top'},
  errorText:     {color: '#EF4444', fontSize: 13, fontWeight: '500'},
  submitBtn:     {paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8},
  submitTxt:     {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
