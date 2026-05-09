import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Droplets, Bell, Sparkles, CheckCircle, AlertCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAuthStore from '../../../store/authStore';
import {getNotifications, markNotificationRead, markAllNotificationsRead} from '../../../services/biker';

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

function NotifRow({item, userId, onPress, colors}) {
  const isRead = Array.isArray(item.readBy) && item.readBy.includes(userId);
  const timeStr = item.createdAt
    ? new Date(item.createdAt).toLocaleString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity
      style={[r.row, !isRead && {backgroundColor: colors.primary + '08'}]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}>
      <NotifIcon type={item.type} />
      <View style={r.text}>
        <Text style={[r.title, {color: colors.textPrimary}]} numberOfLines={2}>{item.title}</Text>
        {!!item.body && <Text style={[r.body, {color: colors.textSecondary}]} numberOfLines={2}>{item.body}</Text>}
        <Text style={[r.time, {color: colors.textSecondary}]}>{timeStr}</Text>
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
  dot:  {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
});

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
    const date = n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : 'unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  return Object.entries(groups).map(([date, data]) => ({date, data}));
}

export default function NotificationsScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, lang} = useI18n();
  const user = useAuthStore(s => s.user);
  const userId = user?._id ?? null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const pageRef                           = useRef(1);
  const loadingMoreRef                    = useRef(false);

  const fetchNotifications = useCallback(async (page, replace) => {
    const res = await getNotifications({page, limit: 20});
    if (res.success) {
      const data = res.data?.data ?? [];
      if (replace) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      setHasMore(res.data?.pagination?.hasNextPage ?? false);
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

  const handlePress = useCallback(async (item) => {
    const isRead = Array.isArray(item.readBy) && item.readBy.includes(userId);
    if (!isRead) {
      await markNotificationRead(item._id);
      setNotifications(prev =>
        prev.map(n => n._id === item._id ? {...n, readBy: [...(n.readBy ?? []), userId]} : n)
      );
    }
  }, [userId]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications(prev =>
      prev.map(n => ({...n, readBy: Array.isArray(n.readBy) && n.readBy.includes(userId) ? n.readBy : [...(n.readBy ?? []), userId]}))
    );
  }, [userId]);

  const unreadCount = notifications.filter(
    n => !(Array.isArray(n.readBy) && n.readBy.includes(userId))
  ).length;

  const groups = groupByDate(notifications);

  const renderGroup = useCallback(({item: group}) => (
    <View style={s.group}>
      <Text style={[s.dateLabel, {color: colors.textSecondary}]}>
        {formatDateLabel(group.date, lang)}
      </Text>
      <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        {group.data.map((item, i) => (
          <View key={item._id}>
            <NotifRow item={item} userId={userId} onPress={handlePress} colors={colors} />
            {i < group.data.length - 1 && <View style={[s.divider, {backgroundColor: colors.border}]} />}
          </View>
        ))}
      </View>
    </View>
  ), [colors, handlePress, userId, lang]);

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
        <TouchableOpacity
          style={s.readAllBtn}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Bell size={18} color={unreadCount > 0 ? colors.primary : colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
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
            <Text style={[s.empty, {color: colors.textSecondary}]}>{t('notifications.empty')}</Text>
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
  readAllBtn:  {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  scroll:      {flex: 1},
  content:     {padding: 16, gap: 12},
  group:       {gap: 8},
  dateLabel:   {fontSize: 13, fontWeight: '700', paddingHorizontal: 4},
  groupCard:   {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  divider:     {height: 1, marginHorizontal: 16},
  empty:       {textAlign: 'center', marginTop: 48, fontSize: 14},
  footerLoader:{paddingVertical: 16},
});
