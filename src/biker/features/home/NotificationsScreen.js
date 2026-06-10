import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Droplets, Bell, Sparkles, CheckCircle, AlertCircle, CheckCheck} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getNotifications, markAllNotificationsRead} from '../../../services/biker';
import {handleNavigate} from '../../../shared/context/FirebaseContext';

// type: 0=order 1=promo 2=system 3=reminder 4=voucher 5=gift
function NotifIcon({type}) {
  if (type === 1) return <View style={[ic.wrap, {backgroundColor: '#EEF2FF'}]}><Sparkles size={20} color="#6366F1" strokeWidth={2} /></View>;
  if (type === 2) return <View style={[ic.wrap, {backgroundColor: '#FFF7ED'}]}><AlertCircle size={20} color="#F97316" strokeWidth={2} /></View>;
  if (type === 3) return <View style={[ic.wrap, {backgroundColor: '#E8F5E9'}]}><CheckCircle size={20} color="#22C55E" strokeWidth={2} /></View>;
  if (type === 4 || type === 5) return <View style={[ic.wrap, {backgroundColor: '#FEF3C7'}]}><Sparkles size={20} color="#F59E0B" strokeWidth={2} /></View>;
  return <View style={[ic.wrap, {backgroundColor: '#EFF6FF'}]}><Droplets size={20} color="#1B7BF5" strokeWidth={2} /></View>;
}

const ic = StyleSheet.create({
  wrap: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
});

// ── helpers ───────────────────────────────────────────────────────────────────

function resolveText(item, lang, field) {
  const lc = item.localizedContent ?? {};
  return lc[lang]?.[field] ?? lc.ar?.[field] ?? lc.en?.[field] ?? item[field] ?? '';
}

function formatDateLabel(dateStr, lang) {
  if (!dateStr || dateStr === 'unknown') return '';
  try {
    return new Date(dateStr).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : lang === 'hi' ? 'hi-IN' : 'en-US',
      {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'},
    );
  } catch {
    return dateStr;
  }
}

function groupByDate(items) {
  const groups = {};
  items.forEach(n => {
    const ts = n.sentAt ?? n.scheduledAt ?? n.createdAt;
    const date = ts ? new Date(ts).toISOString().split('T')[0] : 'unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  // Sort dates descending (newest first)
  return Object.entries(groups)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, data]) => ({date, data}));
}

// ── NotifRow ──────────────────────────────────────────────────────────────────

function NotifRow({item, lang, onPress, colors}) {
  const isRead = item.isRead ?? item.read ?? (item.readAt != null) ?? false;
  const title   = resolveText(item, lang, 'title');
  const body    = resolveText(item, lang, 'body');
  const ts      = item.sentAt ?? item.scheduledAt ?? item.createdAt;
  const timeStr = ts
    ? new Date(ts).toLocaleString('ar-SA', {
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity
      style={[r.row, !isRead && {backgroundColor: colors.primary + '0D', borderRightWidth: 3, borderRightColor: colors.primary}]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}>
      <NotifIcon type={item.type} />
      <View style={r.text}>
        {!!title && (
          <Text style={[r.title, {color: colors.textPrimary, fontWeight: isRead ? '600' : '800'}]} numberOfLines={2}>{title}</Text>
        )}
        {!!body && (
          <Text style={[r.body, {color: isRead ? colors.textSecondary : colors.textPrimary + 'CC'}]} numberOfLines={2}>{body}</Text>
        )}
        {!!timeStr && (
          <Text style={[r.time, {color: isRead ? colors.textSecondary : colors.primary + 'AA'}]}>{timeStr}</Text>
        )}
      </View>
      {!isRead && <View style={[r.dot, {backgroundColor: colors.primary}]} />}
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row:  {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12},
  text: {flex: 1, gap: 3},
  title:{fontSize: 13, fontWeight: '600'},
  body: {fontSize: 12},
  time: {fontSize: 11},
  dot:  {width: 9, height: 9, borderRadius: 5, flexShrink: 0},
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen({onBack, onUnreadCountChange}) {
  const {colors, isDark} = useTheme();
  const {t, lang}        = useI18n();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const [hasMore, setHasMore]             = useState(false);
  const pageRef                           = useRef(1);
  const loadingMoreRef                    = useRef(false);

  const fetchNotifications = useCallback(async (page, replace) => {
    const res = await getNotifications({page, limit: 20});
    if (res.success) {
      // Backend: { success, data: [...], pagination: { hasNextPage, ... } }
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data) ? res.data.data : [];

      if (replace) {
        setNotifications(list);
      } else {
        setNotifications(prev => [...prev, ...list]);
      }

      setHasMore(
        res.data?.pagination?.hasNextPage ??
        (Array.isArray(res.data) ? false : false),
      );
      pageRef.current = page;
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, true).finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1, true);
    setRefreshing(false);
  }, [fetchNotifications]);

  const onLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMoreUI(true);
    await fetchNotifications(pageRef.current + 1, false);
    loadingMoreRef.current = false;
    setLoadingMoreUI(false);
  }, [hasMore, fetchNotifications]);

  const handlePress = useCallback((item) => {
    handleNavigate({
      ...(item.data ?? {}),
      _itemType: item.type,
      action: item.data?.action ?? '',
    });
    onBack?.();
  }, [onBack]);

  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !(n.isRead ?? n.read ?? (n.readAt != null))).length;

  useEffect(() => {
    if (!loading) onUnreadCountChange?.(unreadCount);
  }, [unreadCount, loading, onUnreadCountChange]);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    await markAllNotificationsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    setMarkingAll(false);
  }, [markingAll]);

  const groups = groupByDate(notifications);

  const renderGroup = useCallback(({item: group}) => (
    <View style={s.group}>
      <Text style={[s.dateLabel, {color: colors.textSecondary}]}>
        {formatDateLabel(group.date, lang)}
      </Text>
      <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        {group.data.map((item, i) => (
          <View key={item._id ?? item.id ?? String(i)}>
            <NotifRow item={item} lang={lang} onPress={handlePress} colors={colors} />
            {i < group.data.length - 1 && <View style={[s.divider, {backgroundColor: colors.border}]} />}
          </View>
        ))}
      </View>
    </View>
  ), [colors, handlePress, lang]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.titleRow}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={[s.badge, {backgroundColor: colors.primary}]}>
              <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : `${unreadCount}`}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={[s.readAllBtn, s.readAllBtnActive, {borderColor: colors.primary + '40'}]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            {markingAll
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <>
                  <CheckCheck size={15} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[s.readAllTxt, {color: colors.primary}]}>{t('notifications.markAllRead')}</Text>
                </>
            }
          </TouchableOpacity>
        ) : (
          <View style={s.readAllBtn} />
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.date}
          renderItem={renderGroup}
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={[s.emptyIcon, {backgroundColor: colors.primary + '10'}]}>
                <Bell size={36} color={colors.primary} />
              </View>
              <Text style={[s.emptyTitle, {color: colors.textPrimary}]}>{t('notifications.empty')}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMoreUI
              ? <ActivityIndicator size="small" color={colors.primary} style={s.footerLoader} />
              : <View style={{height: 24}} />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:      {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1},
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  titleRow:    {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  headerTitle: {fontSize: 18, fontWeight: '800'},
  badge:       {minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4},
  badgeText:   {color: '#fff', fontSize: 10, fontWeight: '800'},
  readAllBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  readAllBtnActive:{flexDirection: 'row', width: 'auto', paddingHorizontal: 10, borderWidth: 1, gap: 4},
  readAllTxt:     {fontSize: 11, fontWeight: '700'},
  scroll:      {flex: 1},
  content:     {padding: 16, gap: 12, paddingBottom: 40},
  group:       {gap: 8},
  dateLabel:   {fontSize: 13, fontWeight: '700', paddingHorizontal: 4},
  groupCard:   {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  divider:     {height: 1, marginHorizontal: 16},
  emptyWrap:   {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80},
  emptyIcon:   {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center'},
  emptyTitle:  {fontSize: 14, textAlign: 'center'},
  footerLoader:{paddingVertical: 16},
});
