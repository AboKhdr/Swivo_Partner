import React from 'react';
import {
  Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Droplets, X, Star, Sparkles, CheckCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const MOCK_NOTIFICATIONS = [
  {dateKey: 'today', items: [
    {id: '1', type: 'cancel',   titleKey: 'notifications.cancelledOrder', time: '3:00 PM - 3:56 PM'},
    {id: '2', type: 'cancel',   titleKey: 'notifications.cancelledOrder', time: '3:00 PM - 3:56 PM'},
    {id: '3', type: 'review',   titleKey: 'notifications.newReview',      time: '3:00 PM - 3:56 PM'},
    {id: '4', type: 'review',   titleKey: 'notifications.newReview',      time: '3:00 PM - 3:56 PM'},
    {id: '5', type: 'complete', titleKey: 'notifications.completedWash',  time: '3:00 PM - 3:56 PM'},
    {id: '6', type: 'cancel',   titleKey: 'notifications.cancelledOrder', time: '3:00 PM - 3:56 PM'},
  ]},
];

function NotifIcon({type}) {
  if (type === 'cancel') {
    return (
      <View style={[ic.wrap, {backgroundColor: '#FEECEC'}]}>
        <X size={20} color="#EF4444" strokeWidth={2.5} />
      </View>
    );
  }
  if (type === 'review') {
    return (
      <View style={[ic.wrap, {backgroundColor: '#EEF2FF'}]}>
        <Sparkles size={20} color="#6366F1" strokeWidth={2} />
      </View>
    );
  }
  if (type === 'complete') {
    return (
      <View style={[ic.wrap, {backgroundColor: '#E8F5E9'}]}>
        <CheckCircle size={20} color="#22C55E" strokeWidth={2} />
      </View>
    );
  }
  return (
    <View style={[ic.wrap, {backgroundColor: '#EFF6FF'}]}>
      <Droplets size={20} color="#1B7BF5" strokeWidth={2} />
    </View>
  );
}

const ic = StyleSheet.create({
  wrap: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
});

function NotifRow({item, colors, isLast}) {
  return (
    <>
      <View style={r.row}>
        <NotifIcon type={item.type} />
        <View style={r.text}>
          <Text style={[r.title, {color: colors.textPrimary}]} numberOfLines={2}>{item.title}</Text>
          <Text style={[r.time, {color: colors.textSecondary}]}>{item.time}</Text>
        </View>
      </View>
      {!isLast && <View style={[r.divider, {backgroundColor: colors.border}]} />}
    </>
  );
}

const r = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12},
  text: {flex: 1, gap: 4, alignItems: 'flex-end'},
  title: {fontSize: 13, fontWeight: '600', textAlign: 'right'},
  time: {fontSize: 11, textAlign: 'right'},
  divider: {height: 1, marginHorizontal: 16},
});

export default function NotificationsScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('notifications.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>

        {MOCK_NOTIFICATIONS.map(group => (
          <View key={group.dateKey} style={s.group}>
            <Text style={[s.dateLabel, {color: colors.textSecondary}]}>{t(`notifications.${group.dateKey}`)}</Text>
            <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {group.items.map((item, i) => (
                <NotifRow
                  key={item.id}
                  item={{...item, title: t(item.titleKey)}}
                  colors={colors}
                  isLast={i === group.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={{height: 24}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},
  scroll: {flex: 1},
  content: {padding: 16, gap: 12},
  group: {gap: 8},
  dateLabel: {fontSize: 13, fontWeight: '700', paddingHorizontal: 4},
  groupCard: {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
});
