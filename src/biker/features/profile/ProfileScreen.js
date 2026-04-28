import React, {useRef, useEffect, useState} from 'react';
import {Animated, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../../shared/constants/colors';
import {MOCK_USER} from '../../../shared/data/mockData';

function InfoRow({emoji, label, value}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoEmoji}>{emoji}</Text>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({emoji, label, onPress, danger}) {
  return (
    <TouchableOpacity style={s.actionRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.actionEmoji}>{emoji}</Text>
      <Text style={[s.actionLabel, danger && {color: Colors.danger}]}>{label}</Text>
      <Text style={[s.actionArrow, danger && {color: Colors.danger}]}>‹</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.7)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 60, friction: 9}),
      Animated.spring(avatarScale, {toValue: 1, delay: 100, useNativeDriver: true, tension: 60, friction: 8}),
      Animated.timing(avatarOpacity, {toValue: 1, duration: 350, delay: 100, useNativeDriver: true}),
    ]).start();
  }, [avatarOpacity, avatarScale, headerOpacity, headerY]);

  const stars = Math.round(MOCK_USER.rating);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />

      <Animated.View style={[s.header, {opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <Text style={s.headerTitle}>الملف الشخصي</Text>
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Animated.View style={[s.avatarWrap, {opacity: avatarOpacity, transform: [{scale: avatarScale}]}]}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{MOCK_USER.firstName.charAt(0)}</Text>
            </View>
            <View style={s.onlineDot} />
          </Animated.View>
          <Text style={s.heroName}>{MOCK_USER.firstName} {MOCK_USER.lastName}</Text>
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Text key={i} style={[s.star, {color: i <= stars ? '#F59E0B' : Colors.border}]}>★</Text>
            ))}
            <Text style={s.ratingNum}>{MOCK_USER.rating}</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>﷼ {MOCK_USER.wallet.monthlyEarnings.toFixed(0)}</Text>
              <Text style={s.statLabel}>هذا الشهر</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>﷼ {MOCK_USER.wallet.weeklyEarnings.toFixed(0)}</Text>
              <Text style={s.statLabel}>هذا الأسبوع</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>﷼ {MOCK_USER.wallet.balance.toFixed(0)}</Text>
              <Text style={s.statLabel}>الرصيد</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>المعلومات الشخصية</Text>
          <View style={s.sectionCard}>
            <InfoRow emoji="👤" label="الاسم الأول" value={MOCK_USER.firstName} />
            <View style={s.divider} />
            <InfoRow emoji="👤" label="اسم العائلة" value={MOCK_USER.lastName} />
            <View style={s.divider} />
            <InfoRow emoji="📱" label="رقم الهاتف" value="+966 50 123 4567" />
            <View style={s.divider} />
            <InfoRow emoji="📍" label="المدينة" value="الرياض" />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>الإعدادات</Text>
          <View style={s.sectionCard}>
            <ActionRow emoji="🔔" label="الإشعارات" onPress={() => {}} />
            <View style={s.divider} />
            <ActionRow emoji="🔒" label="تغيير كلمة المرور" onPress={() => {}} />
            <View style={s.divider} />
            <ActionRow emoji="🌐" label="اللغة" onPress={() => {}} />
            <View style={s.divider} />
            <ActionRow emoji="❓" label="المساعدة والدعم" onPress={() => {}} />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionCard}>
            <ActionRow emoji="🚪" label="تسجيل الخروج" onPress={() => {}} danger />
          </View>
        </View>

        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.bg},
  header: {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center'},
  headerTitle: {fontSize: 20, fontWeight: '800', color: Colors.textPrimary},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 16},
  heroCard: {backgroundColor: Colors.card, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4},
  avatarWrap: {position: 'relative', marginBottom: 12},
  avatar: {width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 32, fontWeight: '900', color: '#fff'},
  onlineDot: {position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#fff'},
  heroName: {fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 16},
  star: {fontSize: 16},
  ratingNum: {fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginLeft: 4},
  statsRow: {flexDirection: 'row', width: '100%', justifyContent: 'space-around'},
  statItem: {alignItems: 'center', gap: 4},
  statValue: {fontSize: 16, fontWeight: '800', color: Colors.textPrimary},
  statLabel: {fontSize: 11, color: Colors.textSecondary},
  statDivider: {width: 1, height: 32, backgroundColor: Colors.border},
  section: {gap: 8},
  sectionTitle: {fontSize: 13, fontWeight: '700', color: Colors.textSecondary, paddingHorizontal: 4},
  sectionCard: {backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden'},
  divider: {height: 1, backgroundColor: Colors.border, marginHorizontal: 16},
  infoRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12},
  infoEmoji: {fontSize: 18, width: 24, textAlign: 'center'},
  infoText: {flex: 1},
  infoLabel: {fontSize: 11, color: Colors.textSecondary, marginBottom: 2},
  infoValue: {fontSize: 14, fontWeight: '600', color: Colors.textPrimary},
  actionRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12},
  actionEmoji: {fontSize: 18, width: 24, textAlign: 'center'},
  actionLabel: {flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary},
  actionArrow: {fontSize: 18, color: Colors.textSecondary, transform: [{rotate: '180deg'}]},
});
