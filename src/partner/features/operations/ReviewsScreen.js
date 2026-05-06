import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Star, GitBranch, MessageSquare} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getReviews, getBranches} from '../../../services/partner';

function StarRow({rating, size = 14}) {
  return (
    <View style={ss.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} color="#F59E0B" fill={i <= rating ? '#F59E0B' : 'transparent'} strokeWidth={1.5} />
      ))}
    </View>
  );
}

function SummaryCard({reviews, colors}) {
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
    pct:   reviews.length ? reviews.filter(r => r.rating === n).length / reviews.length : 0,
  }));
  return (
    <View style={[ss.summary, {backgroundColor: colors.card}]}>
      <View style={ss.summaryLeft}>
        <Text style={[ss.avgNum, {color: colors.textPrimary}]}>{avg}</Text>
        <StarRow rating={Math.round(parseFloat(avg))} size={16} />
        <Text style={[ss.totalTxt, {color: colors.textSecondary}]}>{reviews.length} تقييم</Text>
      </View>
      <View style={ss.summaryRight}>
        {dist.map(({n, count, pct}) => (
          <View key={n} style={ss.barRow}>
            <Text style={[ss.barLabel, {color: colors.textSecondary}]}>{n}</Text>
            <View style={[ss.barTrack, {backgroundColor: colors.border}]}>
              <View style={[ss.barFill, {width: `${pct * 100}%`, backgroundColor: '#F59E0B'}]} />
            </View>
            <Text style={[ss.barCount, {color: colors.textSecondary}]}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReviewCard({item, colors}) {
  const customer = item.user
    ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim()
    : item.customer ?? '';
  const comment  = item.comment ?? item.content ?? '';
  const date     = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('ar-SA')
    : item.date ?? '';
  const rating   = item.rating ?? 0;

  return (
    <View style={[ss.card, {backgroundColor: colors.card}]}>
      <View style={ss.cardTop}>
        <View style={[ss.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[ss.avatarTxt, {color: colors.primary}]}>{(customer || '؟').charAt(0)}</Text>
        </View>
        <View style={ss.cardMeta}>
          <Text style={[ss.customerName, {color: colors.textPrimary}]}>{customer}</Text>
          <Text style={[ss.dateTxt, {color: colors.textSecondary}]}>{date}</Text>
        </View>
        <StarRow rating={rating} />
      </View>
      {!!comment && (
        <View style={[ss.commentBox, {backgroundColor: colors.bg}]}>
          <MessageSquare size={13} color={colors.textSecondary} style={{marginTop: 1}} />
          <Text style={[ss.commentTxt, {color: colors.textSecondary}]}>{comment}</Text>
        </View>
      )}
    </View>
  );
}

export default function ReviewsScreen({onBack}) {
  const {colors} = useTheme();
  const [reviews,      setReviews]      = useState([]);
  const [branches,     setBranches]     = useState([{_id: 'all', name: {ar: 'كل الفروع'}}]);
  const [activeBranch, setActiveBranch] = useState('all');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      getReviews({limit: 100}),
      getBranches(),
    ]).then(([revRes, brRes]) => {
      if (revRes.success) {
        const list = revRes.data?.data ?? revRes.data ?? [];
        setReviews(Array.isArray(list) ? list : []);
      }
      if (brRes.success) {
        const list = brRes.data?.data ?? brRes.data ?? [];
        setBranches([{_id: 'all', name: {ar: 'كل الفروع'}}, ...(Array.isArray(list) ? list : [])]);
      }
      setLoading(false);
    });
  }, []);

  const filtered = activeBranch === 'all'
    ? reviews
    : reviews.filter(r => (r.branchId ?? r.branch?._id ?? r.branch) === activeBranch);

  const renderItem = useCallback(({item}) => {
    if (item.type === 'summary') return <SummaryCard reviews={filtered} colors={colors} />;
    if (item.type === 'filter') return (
      <View>
        <View style={ss.filterRow}>
          {branches.map(b => {
            const id    = b._id ?? b.id;
            const label = b.name?.ar ?? b.nameAr ?? '';
            return (
              <TouchableOpacity
                key={id}
                style={[ss.chip, {
                  backgroundColor: activeBranch === id ? colors.primary : colors.card,
                  borderColor:     activeBranch === id ? colors.primary : colors.border,
                }]}
                onPress={() => setActiveBranch(id)}
                activeOpacity={0.75}>
                {id !== 'all' && (
                  <GitBranch size={12} color={activeBranch === id ? '#FFF' : colors.textSecondary} />
                )}
                <Text style={[ss.chipTxt, {color: activeBranch === id ? '#FFF' : colors.textPrimary}]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {filtered.length === 0 && (
          <View style={ss.empty}>
            <Star size={36} color={colors.border} />
            <Text style={[ss.emptyTxt, {color: colors.textSecondary}]}>لا توجد تقييمات لهذا الفرع</Text>
          </View>
        )}
      </View>
    );
    return <ReviewCard item={item} colors={colors} />;
  }, [colors, filtered, branches, activeBranch]);

  const data = [
    {id: '__summary', type: 'summary'},
    {id: '__filter',  type: 'filter'},
    ...filtered.map(r => ({...r, type: 'review', id: r._id ?? r.id})),
  ];

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>التقييمات</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]}>
            {reviews.length} تقييم من العملاء
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},
  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 12},
});

const ss = StyleSheet.create({
  summary:      {flexDirection: 'row', borderRadius: 20, padding: 16, gap: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  summaryLeft:  {alignItems: 'center', justifyContent: 'center', gap: 6, width: 80},
  avgNum:       {fontSize: 36, fontWeight: '900'},
  totalTxt:     {fontSize: 12},
  summaryRight: {flex: 1, justifyContent: 'center', gap: 6},
  barRow:       {flexDirection: 'row', alignItems: 'center', gap: 8},
  barLabel:     {fontSize: 12, fontWeight: '600', width: 14, textAlign: 'center'},
  barTrack:     {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
  barFill:      {height: 6, borderRadius: 3},
  barCount:     {fontSize: 11, width: 18, textAlign: 'center'},
  starRow:      {flexDirection: 'row', gap: 2},
  filterRow:    {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4},
  chip:         {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1},
  chipTxt:      {fontSize: 12, fontWeight: '600'},
  empty:        {alignItems: 'center', gap: 10, paddingVertical: 40},
  emptyTxt:     {fontSize: 14},
  card:         {borderRadius: 16, padding: 14, gap: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  cardTop:      {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar:       {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  avatarTxt:    {fontSize: 16, fontWeight: '800'},
  cardMeta:     {flex: 1, gap: 2},
  customerName: {fontSize: 14, fontWeight: '700'},
  dateTxt:      {fontSize: 11},
  commentBox:   {flexDirection: 'row', gap: 8, borderRadius: 10, padding: 10},
  commentTxt:   {flex: 1, fontSize: 13, lineHeight: 20},
});
