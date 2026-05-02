import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, UserCheck, Circle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const MOCK_BIKERS = [
  {id: 'b1', name: 'محمد علي',    activeOrders: 1, isOnDuty: true},
  {id: 'b2', name: 'أنس كريم',    activeOrders: 0, isOnDuty: true},
  {id: 'b3', name: 'يوسف إبراهيم', activeOrders: 2, isOnDuty: true},
  {id: 'b4', name: 'عمر حسن',     activeOrders: 0, isOnDuty: false},
];

function BikerCard({item, selected, onPress, colors}) {
  return (
    <TouchableOpacity
      style={[s.card, {backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border}, !item.isOnDuty && s.cardDisabled]}
      onPress={() => item.isOnDuty && onPress(item)}
      activeOpacity={item.isOnDuty ? 0.75 : 1}>
      <View style={s.cardLeft}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.avatarText, {color: colors.primary}]}>{item.name[0]}</Text>
        </View>
        <View style={s.bikerInfo}>
          <Text style={[s.bikerName, {color: item.isOnDuty ? colors.textPrimary : colors.textSecondary}]}>{item.name}</Text>
          <View style={s.bikerMeta}>
            <View style={[s.dutyDot, {backgroundColor: item.isOnDuty ? '#22C55E' : '#94A3B8'}]} />
            <Text style={[s.dutyText, {color: item.isOnDuty ? '#22C55E' : colors.textSecondary}]}>
              {item.isOnDuty ? 'نشط' : 'غير نشط'}
            </Text>
            {item.isOnDuty && (
              <Text style={[s.ordersCount, {color: colors.textSecondary}]}>• {item.activeOrders} طلب نشط</Text>
            )}
          </View>
        </View>
      </View>
      {item.isOnDuty && (
        <View style={[s.radio, {borderColor: selected ? colors.primary : colors.border}]}>
          {selected && <View style={[s.radioDot, {backgroundColor: colors.primary}]} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AssignBikerScreen({order, onBack, onAssigned}) {
  const {colors} = useTheme();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAssigned(selected);
    }, 800);
  }, [selected, onAssigned]);

  const renderItem = useCallback(({item}) => (
    <BikerCard
      item={item}
      selected={selected?.id === item.id}
      onPress={setSelected}
      colors={colors}
    />
  ), [selected, colors]);

  const keyExtractor = useCallback(item => item.id, []);

  const available = MOCK_BIKERS.filter(b => b.isOnDuty);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>اختر بايكر</Text>
        <View style={{width: 36}} />
      </View>

      <View style={[s.orderSummary, {backgroundColor: colors.primary + '12', borderColor: colors.primary + '30'}]}>
        <Text style={[s.orderSummaryLabel, {color: colors.primary}]}>
          تعيين بايكر للطلب: {order?.customerName}
        </Text>
      </View>

      <FlatList
        data={MOCK_BIKERS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <Text style={[s.listHeader, {color: colors.textSecondary}]}>
            {available.length} بايكر متاح من أصل {MOCK_BIKERS.length}
          </Text>
        }
      />

      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[s.confirmBtn, {backgroundColor: selected && !loading ? colors.primary : colors.border}]}
          onPress={handleConfirm}
          disabled={!selected || loading}
          activeOpacity={0.8}>
          <UserCheck size={20} color="#FFF" />
          <Text style={s.confirmText}>{loading ? 'جاري التعيين...' : 'تأكيد التعيين'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:               {flex: 1},
  header:             {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  backBtn:            {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle:        {fontSize: 18, fontWeight: '800'},
  orderSummary:       {marginHorizontal: 16, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1},
  orderSummaryLabel:  {fontSize: 13, fontWeight: '600', textAlign: 'center'},
  list:               {padding: 16, gap: 10},
  listHeader:         {fontSize: 12, fontWeight: '500', marginBottom: 4},
  card:               {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1.5},
  cardDisabled:       {opacity: 0.5},
  cardLeft:           {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar:             {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  avatarText:         {fontSize: 18, fontWeight: '800'},
  bikerInfo:          {gap: 4},
  bikerName:          {fontSize: 15, fontWeight: '700'},
  bikerMeta:          {flexDirection: 'row', alignItems: 'center', gap: 6},
  dutyDot:            {width: 8, height: 8, borderRadius: 4},
  dutyText:           {fontSize: 12, fontWeight: '600'},
  ordersCount:        {fontSize: 12},
  radio:              {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot:           {width: 10, height: 10, borderRadius: 5},
  footer:             {padding: 20, borderTopWidth: 1},
  confirmBtn:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16},
  confirmText:        {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
