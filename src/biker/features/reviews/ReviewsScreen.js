import React, {useRef, useEffect, useState} from 'react';
import {Animated, Platform, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {MOCK_REVIEWS} from '../../../shared/data/mockData';

function StarRow({rating, colors}) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[s.star, {color: i <= rating ? '#F59E0B' : colors.border}]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({review, index, colors}) {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay: index * 80, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border, opacity, transform: [{translateY}]}]}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '20'}]}>
          <Text style={[s.avatarText, {color: colors.primary}]}>{review.client.charAt(0)}</Text>
        </View>
        <View style={s.cardMeta}>
          <Text style={[s.clientName, {color: colors.textPrimary}]}>{review.client.charAt(0)}{'*'.repeat(Math.max(0, review.client.length - 1))}</Text>
          <Text style={[s.dateText, {color: colors.textSecondary}]}>{review.date}</Text>
        </View>
        <StarRow rating={review.rating} colors={colors} />
      </View>
      {!!review.comment && (
        <View style={[s.commentBox, {backgroundColor: colors.bg}]}>
          <Text style={[s.commentText, {color: colors.textSecondary}]}>{review.comment}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function ReviewsScreen() {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const ratingScale = useRef(new Animated.Value(0.8)).current;
  const ratingOpacity = useRef(new Animated.Value(0)).current;

  const totalRatings = MOCK_REVIEWS.length;
  const avgRating = MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? MOCK_REVIEWS : MOCK_REVIEWS.filter(r => r.rating === Number(filter));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 60, friction: 9}),
      Animated.spring(ratingScale, {toValue: 1, delay: 150, useNativeDriver: true, tension: 60, friction: 9}),
      Animated.timing(ratingOpacity, {toValue: 1, duration: 400, delay: 150, useNativeDriver: true}),
    ]).start();
  }, [headerOpacity, headerY, ratingOpacity, ratingScale]);

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: MOCK_REVIEWS.filter(r => r.rating === star).length,
    pct: MOCK_REVIEWS.filter(r => r.rating === star).length / totalRatings,
  }));

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <Animated.View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border, opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('reviews.title')}</Text>
        <View style={[s.headerBadge, {backgroundColor: colors.warning}]}>
          <Text style={s.headerBadgeText}>{totalRatings}</Text>
        </View>
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.ratingCard, {backgroundColor: colors.card, borderColor: colors.border, opacity: ratingOpacity, transform: [{scale: ratingScale}]}]}>
          <View style={s.ratingLeft}>
            <Text style={[s.bigRating, {color: colors.textPrimary}]}>{avgRating.toFixed(1)}</Text>
            <StarRow rating={Math.round(avgRating)} colors={colors} />
            <Text style={[s.ratingCount, {color: colors.textSecondary}]}>{totalRatings} {t('reviews.rating')}</Text>
          </View>
          <View style={s.ratingRight}>
            {ratingCounts.map(({star, count, pct}) => (
              <View key={star} style={s.barRow}>
                <Text style={[s.barLabel, {color: colors.textSecondary}]}>{star}</Text>
                <Text style={s.barStar}>★</Text>
                <View style={[s.barTrack, {backgroundColor: colors.border}]}>
                  <View style={[s.barFill, {width: `${Math.round(pct * 100)}%`, backgroundColor: star >= 4 ? colors.success : star === 3 ? colors.warning : colors.danger}]} />
                </View>
                <Text style={[s.barCount, {color: colors.textSecondary}]}>{count}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
          {[{key: 'all', label: t('reviews.all')}, {key: '5', label: '★ 5'}, {key: '4', label: '★ 4'}, {key: '3', label: '★ 3'}].map(f => (
            <View key={f.key} style={[s.filterChip, {backgroundColor: filter === f.key ? colors.primary : colors.card, borderColor: filter === f.key ? colors.primary : colors.border}]}>
              <Text style={[s.filterChipText, {color: filter === f.key ? '#fff' : colors.textSecondary}]} onPress={() => setFilter(f.key)}>
                {f.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⭐</Text>
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('reviews.empty')}</Text>
          </View>
        ) : (
          filtered.map((review, i) => <ReviewCard key={review._id} review={review} index={i} colors={colors} />)
        )}

        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  headerTitle: {fontSize: 20, fontWeight: '800'},
  headerBadge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12},
  headerBadgeText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  ratingCard: {borderRadius: 20, padding: 20, borderWidth: 1, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3},
  ratingLeft: {alignItems: 'center', justifyContent: 'center', gap: 4},
  bigRating: {fontSize: 48, fontWeight: '900'},
  ratingCount: {fontSize: 12, marginTop: 4},
  ratingRight: {flex: 1, gap: 6, justifyContent: 'center'},
  barRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  barLabel: {fontSize: 12, width: 12, textAlign: 'center'},
  barStar: {fontSize: 10, color: '#F59E0B'},
  barTrack: {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
  barFill: {height: 6, borderRadius: 3},
  barCount: {fontSize: 11, width: 16, textAlign: 'right'},
  starRow: {flexDirection: 'row', gap: 2},
  star: {fontSize: 14},
  filterScroll: {marginHorizontal: -16},
  filterContent: {paddingHorizontal: 16, gap: 8},
  filterChip: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  filterChipText: {fontSize: 13, fontWeight: '600'},
  card: {borderRadius: 18, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2},
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 16, fontWeight: '800'},
  cardMeta: {flex: 1},
  clientName: {fontSize: 14, fontWeight: '700'},
  dateText: {fontSize: 12, marginTop: 2},
  commentBox: {marginTop: 10, borderRadius: 10, padding: 10},
  commentText: {fontSize: 13, lineHeight: 20},
  empty: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyText: {fontSize: 15},
});
