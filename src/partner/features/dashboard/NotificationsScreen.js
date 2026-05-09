import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, ShoppingBag, Star, CreditCard, Bike, Bell} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getNotifications} from '../../../services/partner';

const ICON_MAP = {
  order:   {Icon: ShoppingBag, color: '#1B7BF5'},
  review:  {Icon: Star,        color: '#8B5CF6'},
  payment: {Icon: CreditCard,  color: '#22C55E'},
  biker:   {Icon: Bike,        color: '#F59E0B'},
};

function iconForType(type) {
  if (!type || typeof type !== 'string') return ICON_MAP.order;
  const lower = type.toLowerCase();
  const key = Object.keys(ICON_MAP).find(k => lower.includes(k));
  return ICON_MAP[key] ?? ICON_MAP.order;
}

function NotifItem({item, colors}) {
  const rawType = item.type ?? item.icon;
  const typeStr = typeof rawType === 'string' ? rawType : '';
  const {Icon, color} = iconForType(typeStr);
  const title = item.title?.ar ?? item.title?.en ?? (typeof item.title === 'string' ? item.title : '')
    ?? item.titleAr ?? item.body ?? '';
  const body  = item.body?.ar ?? item.body?.en ?? (typeof item.body === 'string' ? item.body : '')
    ?? item.message ?? item.content ?? '';
  const time  = item.createdAt
    ? new Date(item.createdAt).toLocaleString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : item.time ?? '';

  return (
    <View style={s.itemWrapper}>
      <View style={s.dotCol}>
        {!item.read && <View style={[s.unreadDot, {backgroundColor: colors.primary}]} />}
      </View>
      <View style={[s.card, {backgroundColor: colors.card}]}>
        <View style={[s.iconBox, {backgroundColor: color + '18'}]}>
          <Icon size={20} color={color} />
        </View>
        <View style={s.cardContent}>
          <Text style={[s.itemTime, {color: colors.textSecondary}]}>{time}</Text>
          <Text style={[s.itemTitle, {color: colors.textPrimary}]} numberOfLines={1}>{title}</Text>
          <Text style={[s.itemBody, {color: colors.textSecondary}]} numberOfLines={2}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen({onBack}) {
  const {colors} = useTheme();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications({limit: 50}).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setItems(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    });
  }, []);

  const renderItem = useCallback(({item}) => (
    <NotifItem item={item} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item, index) => item._id ?? item.id ?? String(index), []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الاشعارات</Text>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Bell size={40} color={colors.border} />
              <Text style={[s.emptyText, {color: colors.textSecondary}]}>لا توجد إشعارات</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  center:       {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:       {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingTop:       56,
    paddingBottom:    16,
  },
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  list:         {paddingHorizontal: 16, paddingBottom: 32},
  itemWrapper:  {flexDirection: 'row', alignItems: 'stretch', marginBottom: 10},
  dotCol:       {width: 20, alignItems: 'center', justifyContent: 'center'},
  unreadDot:    {width: 8, height: 8, borderRadius: 4},
  card:         {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderRadius:  16,
  },
  iconBox:      {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  cardContent:  {flex: 1, gap: 2},
  itemTitle:    {fontSize: 14, fontWeight: '800'},
  itemTime:     {fontSize: 11},
  itemBody:     {fontSize: 12, lineHeight: 18},
  empty:        {alignItems: 'center', gap: 12, paddingTop: 80},
  emptyText:    {fontSize: 14},
});
