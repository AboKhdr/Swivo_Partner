import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, ChevronDown, Check, Pencil, Plus, Trash2} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getAdditionalServices, deleteAdditionalService, getCategoryServices} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';
import AddAddonScreen from './AddAddonScreen';

function AddonCard({item, colors, t, serviceMap, onEdit, onDelete}) {
  const addonNameAr = item.nameAr ?? item.name?.ar ?? '';
  const addonNameEn = item.nameEn ?? item.name?.en ?? '';

  const sid = item.service?._id ?? item.service ?? item.serviceId ?? null;
  const baseServiceName =
    item.service?.name?.ar
    ?? item.service?.name?.en
    ?? item.serviceName
    ?? (sid ? serviceMap[sid] : '')
    ?? '';

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardMain}>
        <Text style={[s.nameAr, {color: colors.textPrimary}]} numberOfLines={1}>
          {addonNameAr || addonNameEn || '—'}
        </Text>
        {!!addonNameEn && addonNameEn !== addonNameAr && (
          <Text style={[s.nameEn, {color: colors.textSecondary}]} numberOfLines={1}>{addonNameEn}</Text>
        )}
        {!!baseServiceName && (
          <View style={s.svcRow}>
            <Text style={[s.svcLabel, {color: colors.textSecondary}]}>
              {t('partner.addons.service')}:
            </Text>
            <Text style={[s.svcName, {color: colors.textPrimary}]} numberOfLines={1}>
              {baseServiceName}
            </Text>
          </View>
        )}
        <View style={[s.priceBadge, s.priceRow, {backgroundColor: colors.primary + '15'}]}>
          <RiyalIcon size={13} color={colors.primary} />
          <Text style={[s.priceTxt, {color: colors.primary}]}>{item.price}</Text>
        </View>
      </View>
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.iconBtn, {backgroundColor: colors.primary + '15'}]}
          onPress={() => onEdit(item)}
          activeOpacity={0.75}>
          <Pencil size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.iconBtn, s.deleteBtn]}
          onPress={() => onDelete(item)}
          activeOpacity={0.75}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddonsScreen({onBack}) {
  const {colors}    = useTheme();
  const {t}         = useI18n();

  const [items,        setItems]        = useState([]);
  const [serviceMap,   setServiceMap]   = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [deletingId,   setDeletingId]   = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [pickerOpen,   setPickerOpen]   = useState(false);

  const fetchData = useCallback(async () => {
    const [addonsRes, catsRes] = await Promise.all([
      getAdditionalServices(),
      getCategoryServices(),
    ]);
    const list = addonsRes.success ? (addonsRes.data?.data ?? addonsRes.data ?? []) : [];
    setItems(Array.isArray(list) ? list : []);

    const cats = catsRes.success ? (catsRes.data?.data ?? catsRes.data ?? []) : [];
    const map = {};
    (Array.isArray(cats) ? cats : []).forEach(cat => {
      (cat.services ?? []).forEach(sv => {
        const id = sv._id ?? sv.id;
        if (id) map[id] = sv.name?.ar ?? sv.name?.en ?? '';
      });
    });
    setServiceMap(map);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Build unique service options from the loaded items
  const serviceOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    items.forEach(item => {
      const sid  = item.service?._id ?? item.service ?? item.serviceId ?? null;
      const name = item.service?.name?.ar ?? item.service?.name?.en
        ?? item.serviceName ?? (sid ? serviceMap[sid] : '') ?? '';
      if (sid && !seen.has(sid) && name) {
        seen.add(sid);
        opts.push({id: sid, name});
      }
    });
    return opts;
  }, [items, serviceMap]);

  const filtered = useMemo(() => {
    if (!activeFilter) return items;
    return items.filter(item => {
      const sid = item.service?._id ?? item.service ?? item.serviceId ?? null;
      return sid === activeFilter;
    });
  }, [items, activeFilter]);

  const activeFilterName = useMemo(() => {
    if (!activeFilter) return t('partner.addons.filterAll');
    return serviceOptions.find(o => o.id === activeFilter)?.name ?? t('partner.addons.filterAll');
  }, [activeFilter, serviceOptions, t]);

  const performDelete = useCallback(async (item) => {
    const id = item._id ?? item.id;
    if (!id || deletingId) return;
    setDeletingId(id);
    const prev = items;
    setItems(curr => curr.filter(it => (it._id ?? it.id) !== id));
    const res = await deleteAdditionalService(id);
    setDeletingId(null);
    if (!res.success) {
      setItems(prev);
      Alert.alert(t('partner.addons.deleteTitle'), res.error || '');
    }
  }, [items, deletingId, t]);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      t('partner.addons.deleteTitle'),
      t('partner.addons.deleteBody'),
      [
        {text: t('partner.addons.cancel'), style: 'cancel'},
        {text: t('partner.addons.delete'), style: 'destructive', onPress: () => performDelete(item)},
      ],
    );
  }, [performDelete, t]);

  const renderItem = useCallback(({item}) => (
    <AddonCard
      item={item}
      colors={colors}
      t={t}
      serviceMap={serviceMap}
      onEdit={(it) => setEditing(it)}
      onDelete={handleDelete}
    />
  ), [colors, t, serviceMap, handleDelete]);

  const keyExtractor = useCallback(it => it._id ?? it.id, []);

  const handleSaved = useCallback(() => {
    setShowAdd(false);
    setEditing(null);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const showList = !showAdd && !editing;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? null : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.addons.title')}</Text>
              <Text style={[s.headerSub, {color: colors.textSecondary}]}>
                {filtered.length} {t('partner.addons.countSuffix')}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Service filter select */}
          {!loading && serviceOptions.length > 0 && (
            <View style={[s.filterWrap, {borderBottomColor: colors.border}]}>
              <TouchableOpacity
                style={[s.selectBtn, {backgroundColor: colors.card, borderColor: activeFilter ? colors.primary : colors.border}]}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.75}>
                <Text style={[s.selectTxt, {color: activeFilter ? colors.primary : colors.textSecondary}]} numberOfLines={1}>
                  {activeFilterName}
                </Text>
                <ChevronDown size={16} color={activeFilter ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              {!!activeFilter && (
                <TouchableOpacity
                  style={[s.clearBtn, {borderColor: colors.border}]}
                  onPress={() => setActiveFilter(null)}
                  activeOpacity={0.75}>
                  <Text style={[s.clearTxt, {color: colors.textSecondary}]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {loading ? (
            <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
              }
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={[s.emptyTxt, {color: colors.textSecondary}]}>{t('partner.addons.empty')}</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Picker modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={[s.modalSheet, {backgroundColor: colors.card}]}>
            <Text style={[s.modalTitle, {color: colors.textPrimary}]}>{t('partner.addons.filterByService')}</Text>

            <TouchableOpacity
              style={[s.optionRow, {borderBottomColor: colors.border}]}
              onPress={() => { setActiveFilter(null); setPickerOpen(false); }}
              activeOpacity={0.75}>
              <Text style={[s.optionTxt, {color: activeFilter === null ? colors.primary : colors.textPrimary, fontWeight: activeFilter === null ? '800' : '500'}]}>
                {t('partner.addons.filterAll')}
              </Text>
              {activeFilter === null && <Check size={16} color={colors.primary} />}
            </TouchableOpacity>

            {serviceOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[s.optionRow, {borderBottomColor: colors.border}]}
                onPress={() => { setActiveFilter(opt.id); setPickerOpen(false); }}
                activeOpacity={0.75}>
                <Text style={[s.optionTxt, {color: activeFilter === opt.id ? colors.primary : colors.textPrimary, fontWeight: activeFilter === opt.id ? '800' : '500'}]}>
                  {opt.name}
                </Text>
                {activeFilter === opt.id && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showAdd && (
        <View style={s.flex}>
          <AddAddonScreen onBack={() => setShowAdd(false)} onSaved={handleSaved} />
        </View>
      )}
      {editing && (
        <View style={s.flex}>
          <AddAddonScreen initialData={editing} onBack={() => setEditing(null)} onSaved={handleSaved} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:         {flex: 1},
  hidden:       {display: 'none'},
  root:         {flex: 1},
  center:       {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:       {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:   {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle:  {fontSize: 26, fontWeight: '900'},
  headerSub:    {fontSize: 13},

  filterWrap:   {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8, borderBottomWidth: 1},
  selectBtn:    {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10},
  selectTxt:    {flex: 1, fontSize: 14, fontWeight: '600'},
  clearBtn:     {width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  clearTxt:     {fontSize: 14, fontWeight: '700'},

  list:         {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 10, flexGrow: 1},
  empty:        {flex: 1, paddingVertical: 60, alignItems: 'center'},
  emptyTxt:     {fontSize: 14},

  card:         {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12},
  cardMain:     {flex: 1, gap: 4},
  nameAr:       {fontSize: 15, fontWeight: '800'},
  nameEn:       {fontSize: 12, fontWeight: '500'},
  svcRow:       {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2},
  svcLabel:     {fontSize: 11, fontWeight: '600'},
  svcName:      {fontSize: 12, fontWeight: '700', flexShrink: 1},
  priceBadge:   {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4},
  priceRow:     {flexDirection: 'row', alignItems: 'center', gap: 3},
  priceTxt:     {fontSize: 13, fontWeight: '800'},
  actions:      {flexDirection: 'row', gap: 8},
  iconBtn:      {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  deleteBtn:    {backgroundColor: 'rgba(239,68,68,0.12)'},

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'},
  modalSheet:   {borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingBottom: 32},
  modalTitle:   {fontSize: 15, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12},
  optionRow:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1},
  optionTxt:    {fontSize: 15},
});
