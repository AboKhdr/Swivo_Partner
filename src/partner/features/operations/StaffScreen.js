import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Plus, ToggleLeft, ToggleRight} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const TABS = [{key: 'bikers', label: 'البايكرز'}, {key: 'managers', label: 'المديرون'}];

const MOCK_STAFF = {
  bikers: [
    {id: 'b1', name: 'محمد علي',     phone: '0501111111', branch: 'الفرع الرئيسي', isOnDuty: true,  activeOrders: 1},
    {id: 'b2', name: 'أنس كريم',     phone: '0502222222', branch: 'الفرع الرئيسي', isOnDuty: true,  activeOrders: 0},
    {id: 'b3', name: 'يوسف إبراهيم', phone: '0503333333', branch: 'فرع العليا',    isOnDuty: false, activeOrders: 0},
  ],
  managers: [
    {id: 'm1', name: 'سالم العتيبي',  phone: '0504444444', branch: 'الفرع الرئيسي', isOnDuty: true,  activeOrders: 0},
    {id: 'm2', name: 'عبدالله الزهراني', phone: '0505555555', branch: 'فرع العليا', isOnDuty: false, activeOrders: 0},
  ],
};

function StaffCard({item, colors, onToggleDuty}) {
  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardRow}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.avatarText, {color: colors.primary}]}>{item.name[0]}</Text>
        </View>
        <View style={s.info}>
          <Text style={[s.name, {color: colors.textPrimary}]}>{item.name}</Text>
          <Text style={[s.phone, {color: colors.textSecondary}]}>{item.phone}</Text>
          <Text style={[s.branch, {color: colors.textSecondary}]}>{item.branch}</Text>
        </View>
        <View style={s.right}>
          <TouchableOpacity onPress={() => onToggleDuty(item)}>
            {item.isOnDuty
              ? <ToggleRight size={28} color={colors.success} />
              : <ToggleLeft  size={28} color={colors.textSecondary} />
            }
          </TouchableOpacity>
          <View style={[s.dutyBadge, {backgroundColor: item.isOnDuty ? colors.success + '18' : colors.bg, borderColor: item.isOnDuty ? colors.success : colors.border}]}>
            <Text style={[s.dutyText, {color: item.isOnDuty ? colors.success : colors.textSecondary}]}>
              {item.isOnDuty ? 'نشط' : 'غير نشط'}
            </Text>
          </View>
        </View>
      </View>
      {item.isOnDuty && item.activeOrders > 0 && (
        <View style={[s.ordersRow, {borderTopColor: colors.border}]}>
          <Text style={[s.ordersText, {color: colors.textSecondary}]}>{item.activeOrders} طلب نشط حالياً</Text>
        </View>
      )}
    </View>
  );
}

export default function StaffScreen() {
  const {colors} = useTheme();
  const [activeTab, setActiveTab] = useState('bikers');
  const [staff, setStaff] = useState(MOCK_STAFF);

  const handleToggleDuty = useCallback((item) => {
    setStaff(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(s => s.id === item.id ? {...s, isOnDuty: !s.isOnDuty} : s),
    }));
  }, [activeTab]);

  const renderItem = useCallback(({item}) => (
    <StaffCard item={item} colors={colors} onToggleDuty={handleToggleDuty} />
  ), [colors, handleToggleDuty]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الموظفون</Text>
        <TouchableOpacity style={[s.addBtn, {backgroundColor: colors.primary}]}>
          <Plus size={18} color="#FFF" />
          <Text style={s.addBtnText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.tabs, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[s.tabText, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
              {tab.label}
            </Text>
            <View style={[s.tabCount, {backgroundColor: activeTab === tab.key ? colors.primary + '18' : colors.bg}]}>
              <Text style={[s.tabCountText, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
                {staff[tab.key].length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={staff[activeTab]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle:  {fontSize: 22, fontWeight: '800'},
  addBtn:       {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12},
  addBtnText:   {color: '#FFF', fontSize: 13, fontWeight: '700'},
  tabs:         {flexDirection: 'row', borderBottomWidth: 1},
  tab:          {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14},
  tabText:      {fontSize: 14, fontWeight: '700'},
  tabCount:     {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  tabCountText: {fontSize: 12, fontWeight: '700'},
  list:         {padding: 16, gap: 10},
  card:         {borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  cardRow:      {flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12},
  avatar:       {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  avatarText:   {fontSize: 18, fontWeight: '800'},
  info:         {flex: 1, gap: 2},
  name:         {fontSize: 15, fontWeight: '700'},
  phone:        {fontSize: 12},
  branch:       {fontSize: 12},
  right:        {alignItems: 'center', gap: 4},
  dutyBadge:    {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1},
  dutyText:     {fontSize: 10, fontWeight: '700'},
  ordersRow:    {paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1},
  ordersText:   {fontSize: 12},
});
