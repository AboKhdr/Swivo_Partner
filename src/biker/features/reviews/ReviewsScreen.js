import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  ActivityIndicator, Animated, FlatList, Platform,
  RefreshControl, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getBikerReviews, getBikerProfile} from '../../../services/biker';

const PAGE_SIZE = 20;

function StarRow({rating, size = 14, colors}) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[s.star, {fontSize: size, color: i <= rating ? '#F59E0B' : colors.border}]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({review, index, colors}) {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    {toValue: 1, duration: 350, delay: Math.min(index, 6) * 80, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay: Math.min(index, 6) * 80, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [index, opacity, translateY]);

  // user أو client حسب نسخة الـ backend
  const userObj    = review.user ?? review.client;
  const firstName  = typeof userObj === 'string' ? userObj : (userObj?.firstName ?? review.clientName ?? '؟');
  const lastName   = typeof userObj === 'object' ? (userObj?.lastName ?? '') : '';
  const fullName   = `${firstName} ${lastName}`.trim();
  const initial    = fullName.charAt(0) || '؟';
  // إخفاء باقي الاسم حفاظاً على الخصوصية
  const maskedName = firstName.charAt(0) + '*'.repeat(Math.max(0, firstName.length - 1));

  const dateStr    = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ar-SA', {year: 'numeric', month: 'long', day: 'numeric'})
    : '';
  const comment    = review.description ?? review.comment ?? '';

  const orderNum   = review.order?.orderNumber ?? '';
  const carBrand   = review.order?.car?.brand ?? review.order?.userCar?.brand?.name ?? '';
  const carModel   = review.order?.car?.model ?? review.order?.userCar?.model?.name ?? '';
  const carStr     = [carBrand, carModel].filter(Boolean).join(' ');

  return (
    <Animated.View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border, opacity, transform: [{translateY}]}]}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '20'}]}>
          <Text style={[s.avatarText, {color: colors.primary}]}>{initial}</Text>
        </View>
        <View style={s.cardMeta}>
          <Text style={[s.clientName, {color: colors.textPrimary}]}>{maskedName}</Text>
          <Text style={[s.dateText,   {color: colors.textSecondary}]}>{dateStr}</Text>
        </View>
        <StarRow rating={review.rating} colors={colors} />
      </View>

      {!!comment && (
        <View style={[s.commentBox, {backgroundColor: colors.bg}]}>
          <Text style={[s.commentText, {color: colors.textSecondary}]}>{comment}</Text>
        </View>
      )}

      {(!!carStr || !!orderNum) && (
        <View style={s.orderRow}>
          {!!carStr   && <Text style={[s.orderMeta, {color: colors.textSecondary}]}>🚗 {carStr}</Text>}
          {!!orderNum && <Text style={[s.orderMeta, {color: colors.textSecondary}]}>#{orderNum}</Text>}
        </View>
      )}
    </Animated.View>
  );
}

export default function ReviewsScreen() {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();

  const headerY      = useRef(new Animated.Value(-30)).current;
  const headerOp     = useRef(new Animated.Value(0)).current;
  const ratingScale  = useRef(new Animated.Value(0.8)).current;
  const ratingOp     = useRef(new Animated.Value(0)).current;

  const [reviews,       setReviews]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const loadingMoreRef                    = useRef(false);
  const [filter,        setFilter]        = useState('all');
  const [page,          setPage]          = useState(1);
  const [hasNext,       setHasNext]       = useState(false);
  const [avgRating,     setAvgRating]     = useState(0);
  const [totalCount,    setTotalCount]    = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp,    {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(headerY,     {toValue: 0, useNativeDriver: true, tension: 60, friction: 9}),
      Animated.spring(ratingScale, {toValue: 1, delay: 150, useNativeDriver: true, tension: 60, friction: 9}),
      Animated.timing(ratingOp,    {toValue: 1, duration: 400, delay: 150, useNativeDriver: true}),
    ]).start();
  }, [headerOp, headerY, ratingOp, ratingScale]);

  const fetchReviews = useCallback(async (pageNum = 1, append = false) => {
    const params = {page: pageNum, limit: PAGE_SIZE};
    if (filter !== 'all') params.rating = filter;

    const [reviewsRes, profileRes] = pageNum === 1
      ? await Promise.all([getBikerReviews(params), getBikerProfile()])
      : [await getBikerReviews(params), null];

    if (reviewsRes.success) {
      const raw  = reviewsRes.data;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
      setReviews(prev => append ? [...prev, ...list] : list);
      setHasNext(raw?.pagination?.hasNextPage ?? raw?.hasNext ?? false);
      setPage(pageNum);
      if (!append) {
        setTotalCount(raw?.total ?? list.length);
      }
    }

    if (profileRes?.success && profileRes.data?.data) {
      const p = profileRes.data.data;
      setAvgRating(p.rating?.avg ?? p.rating ?? 0);
      setTotalCount(prev => p.totalReviews ?? prev);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchReviews(1, false).finally(() => setLoading(false));
  }, [fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews(1, false);
    setRefreshing(false);
  }, [fetchReviews]);

  const onLoadMore = useCallback(async () => {
    if (!hasNext || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMoreUI(true);
    await fetchReviews(page + 1, true);
    loadingMoreRef.current = false;
    setLoadingMoreUI(false);
  }, [hasNext, page, fetchReviews]);

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   totalCount > 0 ? reviews.filter(r => r.rating === star).length / Math.max(reviews.length, 1) : 0,
  }));

  const renderItem = useCallback(({item, index}) => (
    <ReviewCard review={item} index={index} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback(item => item._id, []);

  const ListHeader = (
    <>
      <Animated.View style={[s.ratingCard, {backgroundColor: colors.card, borderColor: colors.border, opacity: ratingOp, transform: [{scale: ratingScale}]}]}>
        <View style={s.ratingLeft}>
          <Text style={[s.bigRating, {color: colors.textPrimary}]}>{Number(avgRating).toFixed(1)}</Text>
          <StarRow rating={Math.round(avgRating)} size={16} colors={colors} />
          <Text style={[s.ratingCount, {color: colors.textSecondary}]}>{totalCount} {t('reviews.rating')}</Text>
        </View>
        <View style={s.ratingRight}>
          {ratingCounts.map(({star, count, pct}) => (
            <View key={star} style={s.barRow}>
              <Text style={[s.barLabel, {color: colors.textSecondary}]}>{star}</Text>
              <Text style={s.barStar}>★</Text>
              <View style={[s.barTrack, {backgroundColor: colors.border}]}>
                <View style={[s.barFill, {
                  width: `${Math.round(pct * 100)}%`,
                  backgroundColor: star >= 4 ? colors.success : star === 3 ? '#F59E0B' : '#EF4444',
                }]} />
              </View>
              <Text style={[s.barCount, {color: colors.textSecondary}]}>{count}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <FlatList
        data={[
          {key: 'all', label: t('reviews.all')},
          {key: '5',   label: '★ 5'},
          {key: '4',   label: '★ 4'},
          {key: '3',   label: '★ 3'},
        ]}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f.key}
        contentContainerStyle={s.filterContent}
        style={s.filterScroll}
        renderItem={({item: f}) => (
          <TouchableOpacity
            style={[s.filterChip, {
              backgroundColor: filter === f.key ? colors.primary : colors.card,
              borderColor:     filter === f.key ? colors.primary : colors.border,
            }]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}>
            <Text style={[s.filterChipText, {color: filter === f.key ? '#fff' : colors.textSecondary}]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </>
  );

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <Animated.View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border, opacity: headerOp, transform: [{translateY: headerY}]}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('reviews.title')}</Text>
        <View style={[s.headerBadge, {backgroundColor: '#F59E0B'}]}>
          <Text style={s.headerBadgeText}>{totalCount}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMoreUI
              ? <ActivityIndicator size="small" color={colors.primary} style={s.footerLoader} />
              : <View style={{height: 24}} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>⭐</Text>
              <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('reviews.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            {flex: 1},
  center:          {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:          {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  headerTitle:     {fontSize: 20, fontWeight: '800'},
  headerBadge:     {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12},
  headerBadgeText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  list:            {padding: 16, gap: 12},
  ratingCard:      {borderRadius: 20, padding: 20, borderWidth: 1, flexDirection: 'row', gap: 16, marginBottom: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3},
  ratingLeft:      {alignItems: 'center', justifyContent: 'center', gap: 4},
  bigRating:       {fontSize: 48, fontWeight: '900'},
  ratingCount:     {fontSize: 12, marginTop: 4},
  ratingRight:     {flex: 1, gap: 6, justifyContent: 'center'},
  barRow:          {flexDirection: 'row', alignItems: 'center', gap: 4},
  barLabel:        {fontSize: 12, width: 12, textAlign: 'center'},
  barStar:         {fontSize: 10, color: '#F59E0B'},
  barTrack:        {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
  barFill:         {height: 6, borderRadius: 3},
  barCount:        {fontSize: 11, width: 16, textAlign: 'right'},
  starRow:         {flexDirection: 'row', gap: 2},
  star:            {},
  filterScroll:    {marginHorizontal: -16, marginTop: 12},
  filterContent:   {paddingHorizontal: 16, gap: 8, paddingBottom: 12},
  filterChip:      {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  filterChipText:  {fontSize: 13, fontWeight: '600'},
  card:            {borderRadius: 18, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 10},
  cardHeader:      {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar:          {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  avatarText:      {fontSize: 16, fontWeight: '800'},
  cardMeta:        {flex: 1},
  clientName:      {fontSize: 14, fontWeight: '700'},
  dateText:        {fontSize: 12, marginTop: 2},
  commentBox:      {borderRadius: 10, padding: 10},
  commentText:     {fontSize: 13, lineHeight: 20},
  orderRow:        {flexDirection: 'row', gap: 12, flexWrap: 'wrap'},
  orderMeta:       {fontSize: 12},
  empty:           {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},
  emptyIcon:       {fontSize: 48, marginBottom: 12},
  emptyText:       {fontSize: 15},
  footerLoader:    {paddingVertical: 16},
});
