import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const STATUS_COLORS = {
  PENDING_PARTNER: '#F59E0B',
  ACCEPTED:        '#3B9EFF',
  ASSIGNED:        '#8B5CF6',
  ON_THE_WAY:      '#1B7BF5',
  STARTED:         '#F59E0B',
  COMPLETED:       '#22C55E',
  REJECTED:        '#EF4444',
  CANCELLED:       '#EF4444',
};

const MOCK_ORDERS = [
  {id: '1', customerName: 'أحمد محمد',    service: 'غسيل خارجي', status: 'PENDING_PARTNER', time: '10:30', price: '80',  plate: 'ABC 1234', biker: null},
  {id: '2', customerName: 'سارة العمري',  service: 'غسيل كامل',  status: 'ON_THE_WAY',      time: '10:15', price: '150', plate: 'XYZ 5678', biker: 'محمد علي'},
  {id: '3', customerName: 'خالد الغامدي', service: 'تلميع',       status: 'COMPLETED',       time: '09:00', price: '200', plate: 'DEF 9012', biker: 'أنس كريم'},
  {id: '4', customerName: 'منى السعيد',   service: 'غسيل داخلي', status: 'STARTED',         time: '10:00', price: '120', plate: 'GHI 3456', biker: 'محمد علي'},
  {id: '5', customerName: 'فيصل الحربي',  service: 'غسيل خارجي', status: 'ASSIGNED',        time: '09:45', price: '80',  plate: 'JKL 7890', biker: 'أنس كريم'},
  {id: '6', customerName: 'ريم الدوسري',  service: 'غسيل كامل',  status: 'ACCEPTED',        time: '09:30', price: '150', plate: 'MNO 1234', biker: null},
];

function OrderCard({item, colors, t, onPress}) {
  const color = STATUS_COLORS[item.status] || '#64748B';
  const statusLabel = t(`partner.orders.status.${item.status}`) || item.status;
  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardTop}>
        <Text style={[s.cardId, {color: colors.primary}]}>#{item.id ? `KF-${item.id.padStart(4, '0')}` : ''}</Text>
        <View style={[s.badge, {backgroundColor: color + '18'}]}>
          <Text style={[s.badgeText, {color: color}]}>• {statusLabel}</Text>
        </View>
      </View>

      <Text style={[s.serviceName, {color: colors.textPrimary}]}>{item.service}</Text>

      <View style={s.cardMeta}>
        <Text style={[s.metaText, {color: colors.textSecondary}]}>📍 {item.location || 'حي الملقا، الرياض'}</Text>
        <Text style={[s.metaText, {color: colors.textSecondary}]}>📅 {item.date || `اليوم، ${item.time} - 13 أكتوبر`}</Text>
      </View>

      <View style={[s.cardDivider, {backgroundColor: colors.border}]} />

      <View style={s.cardBottom}>
        <View style={s.priceCol}>
          <Text style={[s.priceLabel, {color: colors.textSecondary}]}>{t('partner.orders.fullAmount')}</Text>
          <Text style={[s.priceValue, {color: colors.textPrimary}]}>{item.price}</Text>
        </View>
        <TouchableOpacity style={{backgroundColor: colors.primary + '10', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 2}} onPress={() => onPress(item)}>
          <Text style={[s.badge, {color: colors.primary}]}>{t('partner.orders.viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersScreen({onSelectOrder}) {
  const {colors} = useTheme();
  const {t, isRTL} = useI18n();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [refreshing, setRefreshing]     = useState(false);

  const FILTERS = [
    {key: 'all',             label: t('partner.orders.all')},
    {key: 'PENDING_PARTNER', label: t('partner.orders.status.PENDING_PARTNER')},
    {key: 'COMPLETED',       label: t('partner.orders.status.COMPLETED')},
    {key: 'STARTED',         label: t('partner.orders.status.STARTED')},
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = MOCK_ORDERS.filter(o => {
    const matchFilter = activeFilter === 'all' || o.status === activeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || o.customerName.includes(q) || o.plate.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const renderItem = useCallback(({item}) => (
    <OrderCard item={item} colors={colors} t={t} onPress={onSelectOrder || (() => {})} />
  ), [colors, t, onSelectOrder]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.orders.title')}</Text>

        <View style={[s.searchBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.searchInput, {color: colors.textPrimary}]}
            placeholder={t('partner.orders.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <FlatList
          data={FILTERS}
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={s.filters}
          renderItem={({item: f}) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                style={[s.filterChip, {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor:     isActive ? colors.primary : colors.border,
                }]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}>
                <Text style={[s.filterText, {color: isActive ? '#fff' : colors.textSecondary}]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('partner.orders.noOrders')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4},
  headerTitle:  {fontSize: 26, fontWeight: '800', marginBottom: 14},
  searchBox:    {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 50, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12},
  searchInput:  {flex: 1, fontSize: 14, padding: 0},
  filters:      {gap: 8, paddingBottom: 10, flexDirection: 'row'},
  filterChip:   {paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50, borderWidth: 1},
  filterText:   {fontSize: 13, fontWeight: '600'},
  list:         {paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8},
  card:         {borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 16, gap: 10},
  cardTop:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  cardId:       {fontSize: 13, fontWeight: '700'},
  badge:        {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText:    {fontSize: 11, fontWeight: '700'},
  serviceName:  {fontSize: 18, fontWeight: '800'},
  cardMeta:     {gap: 6},
  metaText:     {fontSize: 13},
  cardDivider:  {height: 1},
  cardBottom:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  detailsBtn:   {fontSize: 14, fontWeight: '700'},
  priceLabel:   {fontSize: 11},
  priceValue:   {fontSize: 24, fontWeight: '800'},
  empty:        {alignItems: 'center', paddingTop: 60},
  emptyText:    {fontSize: 14},
});
