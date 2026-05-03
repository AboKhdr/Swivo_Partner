import React from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, ShoppingBag, Star, CreditCard, Bike, Bell} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title:   'اوردر جديد نزل خوييبي',
    body:    'لا تتمادى تخيرك خبر العبااساس لا تتمادى تخيرك خبر.',
    time:    '10:42 AM',
    icon:    'bag',
    read:    false,
    section: 'اليوم',
  },
  {
    id: '2',
    title:   'اوردر جديد نزل خوييبي',
    body:    'لا تتمادى تخيرك خبر العبااساس لا تتمادى تخيرك خبر.',
    time:    '10:42 AM',
    icon:    'star',
    read:    true,
    section: 'اليوم',
  },
  {
    id: '3',
    title:   'اوردر جديد نزل خوييبي',
    body:    'لا تتمادى تخيرك خبر العبااساس لا تتمادى تخيرك خبر.',
    time:    '10:42 AM',
    icon:    'card',
    read:    true,
    section: 'اليوم',
  },
  {
    id: '4',
    title:   'اوردر جديد نزل خوييبي',
    body:    'لا تتمادى تخيرك خبر العبااساس لا تتمادى تخيرك خبر.',
    time:    '10:42 AM',
    icon:    'bike',
    read:    true,
    section: 'أمس',
  },
  {
    id: '5',
    title:   'اوردر جديد نزل خوييبي',
    body:    'لا تتمادى تخيرك خبر العبااساس لا تتمادى تخيرك خبر.',
    time:    '09:15 AM',
    icon:    'bag',
    read:    true,
    section: 'أمس',
  },
];

const ICON_MAP = {
  bag:  {Icon: ShoppingBag, color: '#1B7BF5'},
  star: {Icon: Star,        color: '#8B5CF6'},
  card: {Icon: CreditCard,  color: '#22C55E'},
  bike: {Icon: Bike,        color: '#F59E0B'},
};

function NotifItem({item, colors}) {
  const {Icon, color} = ICON_MAP[item.icon] || ICON_MAP.bag;
  return (
    <View style={s.itemWrapper}>
      {/* Unread dot — left of card */}
      <View style={s.dotCol}>
        {!item.read && <View style={[s.unreadDot, {backgroundColor: colors.primary}]} />}
      </View>

      <View style={[s.card, {backgroundColor: colors.card}]}>
        {/* Icon on the right */}
        <View style={[s.iconBox, {backgroundColor: color + '18'}]}>
          <Icon size={20} color={color} />
        </View>

        {/* Content */}
        <View style={s.cardContent}>
          <Text style={[s.itemTime, {color: colors.textSecondary}]}>{item.time}</Text>
          <Text style={[s.itemTitle, {color: colors.textPrimary}]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.itemBody, {color: colors.textSecondary}]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen({onBack}) {
  const {colors} = useTheme();

  // Build flat list with section headers
  const data = [];
  const seen = {};
  MOCK_NOTIFICATIONS.forEach(n => {
    if (!seen[n.section]) {
      seen[n.section] = true;
      data.push({type: 'header', id: `h_${n.section}`, title: n.section});
    }
    data.push({type: 'item', ...n});
  });

  const renderItem = ({item}) => {
    if (item.type === 'header') {
      return (
        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{item.title}</Text>
      );
    }
    return <NotifItem item={item} colors={colors} />;
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الاشعارات</Text>
        <View style={s.backBtn} />
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
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
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
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
  sectionTitle: {fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10},
  // Row: dot + card
  itemWrapper:  {flexDirection: 'row', alignItems: 'stretch', marginBottom: 10},
  dotCol:       {width: 20, alignItems: 'center', justifyContent: 'center'},
  unreadDot:    {width: 8, height: 8, borderRadius: 4},
  // Card
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
