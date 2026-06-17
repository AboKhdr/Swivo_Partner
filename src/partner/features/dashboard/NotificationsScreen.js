import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, Bell, ShoppingBag} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getNotifications, markAllNotificationsRead} from '../../../services/partner';
import {handleNavigate} from '../../../shared/context/FirebaseContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const ORDER_TYPE = 0;

const ACTION_LABELS = {
  photo_skip_decision: 'قرار تخطي الصورة',
  photo_skip_review:   'طلب تخطي الصورة',
  new_order:           'طلب جديد',
  order_updates:       'تحديث الطلب',
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

function NotifItem({item, colors, lang, onPress}) {
  const lc    = item.localizedContent ?? {};
  const title = lc[lang]?.title ?? lc.ar?.title ?? lc.en?.title ?? item.title ?? '';
  const body  = lc[lang]?.body  ?? lc.ar?.body  ?? lc.en?.body  ?? item.body  ?? '';

  const action     = item.data?.action ?? item.data?.notificationType ?? '';
  const actionLabel = ACTION_LABELS[action] ?? '';
  const isRead = item.isRead ?? item.read ?? (item.readAt != null) ?? false;
  const timeStr    = timeAgo(item.sentAt ?? item.scheduledAt ?? item.createdAt);

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      style={[
        st.card,
        {
          backgroundColor: isRead ? colors.card : colors.primary + '0D',
          borderColor:     isRead ? colors.border : colors.primary + '40',
          borderWidth:     isRead ? 1 : 1.5,
        },
      ]}>

      {!isRead && <View style={[st.unreadBar, {backgroundColor: colors.primary}]} />}

      <View style={[st.iconWrap, {backgroundColor: isRead ? colors.border + '60' : colors.primary + '20'}]}>
        <ShoppingBag size={20} color={isRead ? colors.textSecondary : colors.primary} />
      </View>

      <View style={st.content}>
        <View style={st.topRow}>
          {!!actionLabel && (
            <View style={[st.actionBadge, {backgroundColor: isRead ? colors.border + '80' : colors.primary + '18'}]}>
              <Text style={[st.actionText, {color: isRead ? colors.textSecondary : colors.primary}]}>{actionLabel}</Text>
            </View>
          )}
          <Text style={[st.time, {color: colors.textSecondary}]}>{timeStr}</Text>
        </View>
        <Text style={[st.title, {color: colors.textPrimary, fontWeight: isRead ? '600' : '800'}]} numberOfLines={2}>
          {title}
        </Text>
        {!!body && (
          <Text style={[st.body, {color: colors.textSecondary}]} numberOfLines={2}>
            {body}
          </Text>
        )}
      </View>

      {!isRead && <View style={[st.unreadDot, {backgroundColor: colors.primary}]} />}

    </TouchableOpacity>
  );
}

export default function NotificationsScreen({onBack}) {
  const {colors}   = useTheme();
  const {lang}     = useI18n();

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getNotifications({limit: 50, page: 1});
    if (res.success) {
      const list   = res.data?.data ?? res.data ?? [];
      setItems(list);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetch(true);
    setRefreshing(false);
  }, [fetch]);

  const handlePress = useCallback((item) => {
    handleNavigate({
      ...(item.data ?? {}),
      _itemType: item.type,
      action: item.data?.action ?? '',
    });
    onBack?.();
  }, [onBack]);

  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    await markAllNotificationsRead().catch(() => {});
    setItems(prev => prev.map(n => ({...n, isRead: true})));
    setMarkingAll(false);
  }, [markingAll]);

  const unreadCount = items.filter(n => !(n.isRead ?? n.read ?? (n.readAt != null))).length;

  const renderItem = useCallback(({item}) => (
    <NotifItem item={item} colors={colors} lang={lang} onPress={handlePress} />
  ), [colors, lang, handlePress]);

  const keyExtractor = useCallback(
    (item, i) => item._id ?? item.id ?? String(i),
    [],
  );

  return (
    <View style={[st.root, {backgroundColor: colors.bg}]}>

      <View style={[st.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={st.headerBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, {color: colors.textPrimary}]}>الإشعارات</Text>
          {unreadCount > 0 && (
            <View style={[st.badge, {backgroundColor: colors.primary}]}>
              <Text style={st.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={[st.markAllBtn, {borderColor: colors.primary + '40'}]}
            activeOpacity={0.75}>
            {markingAll
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={[st.markAllTxt, {color: colors.primary}]}>تعيين الكل كمقروء</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[st.list, items.length === 0 && st.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={st.empty}>
              <View style={[st.emptyIcon, {backgroundColor: colors.primary + '10'}]}>
                <Bell size={36} color={colors.primary} />
              </View>
              <Text style={[st.emptyTitle, {color: colors.textPrimary}]}>لا توجد إشعارات</Text>
              <Text style={[st.emptySub,   {color: colors.textSecondary}]}>
                ستظهر هنا إشعارات الطلبات الجديدة
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const st = StyleSheet.create({
  root:   {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:       {flexDirection: 'row', alignItems: 'center',
                 paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12},
  headerBtn:    {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  markAllBtn:   {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1},
  markAllTxt:   {fontSize: 12, fontWeight: '700'},
  headerCenter: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  badge:        {minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
                 alignItems: 'center', justifyContent: 'center'},
  badgeText:    {color: '#FFF', fontSize: 11, fontWeight: '800'},
  list:      {padding: 16, gap: 10},
  listEmpty: {flexGrow: 1},
  card:       {flexDirection: 'row', alignItems: 'flex-start', gap: 12,
               borderRadius: 16, padding: 14, overflow: 'hidden'},
  unreadBar:  {position: 'absolute', top: 0, bottom: 0, width: 4, borderRadius: 2},
  unreadDot:  {width: 9, height: 9, borderRadius: 5, alignSelf: 'center', flexShrink: 0},
  iconWrap:   {width: 44, height: 44, borderRadius: 22,
               alignItems: 'center', justifyContent: 'center', marginRight: 2},
  content:    {flex: 1, gap: 4},
  topRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  actionBadge:{paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20},
  actionText: {fontSize: 10, fontWeight: '700'},
  time:       {fontSize: 11},
  title:      {fontSize: 14, fontWeight: '700', lineHeight: 20},
  body:       {fontSize: 12, lineHeight: 18},
  empty:      {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80},
  emptyIcon:  {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center'},
  emptyTitle: {fontSize: 16, fontWeight: '700'},
  emptySub:   {fontSize: 13, textAlign: 'center', paddingHorizontal: 40},
});
