import React, {useRef, useEffect, useState} from 'react';
import {Animated, Platform, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {Colors} from '../../../shared/constants/colors';
import {MOCK_REVIEWS, MOCK_USER} from '../../../shared/data/mockData';

function StarRow({rating}) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[s.star, {color: i <= rating ? '#F59E0B' : Colors.border}]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({review, index}) {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay: index * 80, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[s.card, {opacity, transform: [{translateY}]}]}>
      <View style={s.cardHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{review.client.charAt(0)}</Text>
        </View>
        <View style={s.cardMeta}>
          <Text style={s.clientName}>{review.client}</Text>
          <Text style={s.dateText}>{review.date}</Text>
        </View>
        <StarRow rating={review.rating} />
      </View>
      {!!review.comment && (
        <View style={s.commentBox}>
          <Text style={s.commentText}>{review.comment}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function ReviewsScreen() {
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
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />

      <Animated.View style={[s.header, {opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <Text style={s.headerTitle}>التقييمات</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{totalRatings}</Text>
        </View>
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.ratingCard, {opacity: ratingOpacity, transform: [{scale: ratingScale}]}]}>
          <View style={s.ratingLeft}>
            <Text style={s.bigRating}>{avgRating.toFixed(1)}</Text>
            <StarRow rating={Math.round(avgRating)} />
            <Text style={s.ratingCount}>{totalRatings} تقييم</Text>
          </View>
          <View style={s.ratingRight}>
            {ratingCounts.map(({star, count, pct}) => (
              <View key={star} style={s.barRow}>
                <Text style={s.barLabel}>{star}</Text>
                <Text style={s.barStar}>★</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, {width: `${Math.round(pct * 100)}%`, backgroundColor: star >= 4 ? Colors.success : star === 3 ? Colors.warning : Colors.danger}]} />
                </View>
                <Text style={s.barCount}>{count}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
          {[{key: 'all', label: 'الكل'}, {key: '5', label: '★ 5'}, {key: '4', label: '★ 4'}, {key: '3', label: '★ 3'}].map(f => (
            <View key={f.key} style={[s.filterChip, filter === f.key && s.filterChipActive]}>
              <Text
                style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}
                onPress={() => setFilter(f.key)}>
                {f.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⭐</Text>
            <Text style={s.emptyText}>لا توجد تقييمات بهذا الفلتر</Text>
          </View>
        ) : (
          filtered.map((review, i) => <ReviewCard key={review._id} review={review} index={i} />)
        )}

        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.bg},
  header: {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  headerTitle: {fontSize: 20, fontWeight: '800', color: Colors.textPrimary},
  headerBadge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: Colors.warning},
  headerBadgeText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  ratingCard: {backgroundColor: Colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3},
  ratingLeft: {alignItems: 'center', justifyContent: 'center', gap: 4},
  bigRating: {fontSize: 48, fontWeight: '900', color: Colors.textPrimary},
  ratingCount: {fontSize: 12, color: Colors.textSecondary, marginTop: 4},
  ratingRight: {flex: 1, gap: 6, justifyContent: 'center'},
  barRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  barLabel: {fontSize: 12, color: Colors.textSecondary, width: 12, textAlign: 'center'},
  barStar: {fontSize: 10, color: '#F59E0B'},
  barTrack: {flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden'},
  barFill: {height: 6, borderRadius: 3},
  barCount: {fontSize: 11, color: Colors.textSecondary, width: 16, textAlign: 'right'},
  starRow: {flexDirection: 'row', gap: 2},
  star: {fontSize: 14},
  filterScroll: {marginHorizontal: -16},
  filterContent: {paddingHorizontal: 16, gap: 8},
  filterChip: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border},
  filterChipActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  filterChipText: {fontSize: 13, fontWeight: '600', color: Colors.textSecondary},
  filterChipTextActive: {color: '#fff'},
  card: {backgroundColor: Colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2},
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 16, fontWeight: '800', color: Colors.primary},
  cardMeta: {flex: 1},
  clientName: {fontSize: 14, fontWeight: '700', color: Colors.textPrimary},
  dateText: {fontSize: 12, color: Colors.textSecondary, marginTop: 2},
  commentBox: {marginTop: 10, backgroundColor: Colors.bg, borderRadius: 10, padding: 10},
  commentText: {fontSize: 13, color: Colors.textSecondary, lineHeight: 20},
  empty: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyText: {fontSize: 15, color: Colors.textSecondary},
});
