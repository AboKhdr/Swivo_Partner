import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ArrowRight, Plus, Pencil, Tag, ChevronDown, Trash2, CalendarDays} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getOffers, getCategoryServices, createOffer, updateOffer, deleteOffer, toggleOffer} from '../../../services/partner';

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

// ─── Date picker modal ────────────────────────────────────────────────────────
function DatePickerModal({visible, date, onChange, onClose, colors}) {
  const now = new Date();
  const [day,   setDay]   = useState(date?.day   ?? now.getDate());
  const [month, setMonth] = useState(date?.month ?? now.getMonth() + 1);
  const [year,  setYear]  = useState(date?.year  ?? now.getFullYear());

  const maxDay = daysInMonth(month, year);
  const safeDay = Math.min(day, maxDay);

  const confirm = () => {
    onChange({day: safeDay, month, year});
    onClose();
  };

  const pad = n => String(n).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={dp.overlay} />
      </TouchableWithoutFeedback>
      <View style={dp.sheet}>
        <View style={[dp.card, {backgroundColor: colors.card}]}>
          <View style={[dp.handle, {backgroundColor: colors.border}]} />
          <Text style={[dp.title, {color: colors.textPrimary}]}>تاريخ انتهاء العرض</Text>

          <View style={dp.preview}>
            <Text style={[dp.previewTxt, {color: colors.primary}]}>
              {pad(safeDay)} / {pad(month)} / {year}
            </Text>
          </View>

          {/* Day */}
          <View style={dp.section}>
            <Text style={[dp.sectionLabel, {color: colors.textSecondary}]}>اليوم</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dp.chips}>
              {Array.from({length: maxDay}, (_, i) => i + 1).map(d => (
                <TouchableOpacity
                  key={d}
                  style={[dp.chip, {backgroundColor: safeDay === d ? colors.primary : colors.bg, borderColor: safeDay === d ? colors.primary : colors.border}]}
                  onPress={() => setDay(d)}
                  activeOpacity={0.75}>
                  <Text style={[dp.chipTxt, {color: safeDay === d ? '#FFF' : colors.textPrimary}]}>{pad(d)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Month */}
          <View style={dp.section}>
            <Text style={[dp.sectionLabel, {color: colors.textSecondary}]}>الشهر</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dp.chips}>
              {MONTHS_AR.map((name, i) => {
                const m = i + 1;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[dp.chip, {backgroundColor: month === m ? colors.primary : colors.bg, borderColor: month === m ? colors.primary : colors.border}]}
                    onPress={() => setMonth(m)}
                    activeOpacity={0.75}>
                    <Text style={[dp.chipTxt, {color: month === m ? '#FFF' : colors.textPrimary}]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Year */}
          <View style={dp.section}>
            <Text style={[dp.sectionLabel, {color: colors.textSecondary}]}>السنة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dp.chips}>
              {[0,1,2,3,4].map(offset => {
                const y = now.getFullYear() + offset;
                return (
                  <TouchableOpacity
                    key={y}
                    style={[dp.chip, {backgroundColor: year === y ? colors.primary : colors.bg, borderColor: year === y ? colors.primary : colors.border}]}
                    onPress={() => setYear(y)}
                    activeOpacity={0.75}>
                    <Text style={[dp.chipTxt, {color: year === y ? '#FFF' : colors.textPrimary}]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity style={[dp.confirmBtn, {backgroundColor: colors.primary}]} onPress={confirm} activeOpacity={0.85}>
            <Text style={dp.confirmTxt}>تأكيد</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Service picker modal (single select) ────────────────────────────────────
function ServicePickerModal({visible, selectedId, onSelect, onClose, colors, allServices}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ms.overlay} />
      </TouchableWithoutFeedback>
      <View style={ms.sheet}>
        <View style={[ms.card, {backgroundColor: colors.card}]}>
          <Text style={[ms.title, {color: colors.textPrimary}]}>اختر الخدمة</Text>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {allServices.map((srv, i) => {
              const id = srv._id ?? srv.id;
              const active = selectedId === id;
              return (
                <View key={id}>
                  <TouchableOpacity
                    style={ms.row}
                    onPress={() => { onSelect(id); onClose(); }}
                    activeOpacity={0.75}>
                    <View style={[ms.radio, {borderColor: active ? colors.primary : colors.border}]}>
                      {active && <View style={[ms.radioDot, {backgroundColor: colors.primary}]} />}
                    </View>
                    <Text style={[ms.rowTxt, {color: active ? colors.primary : colors.textPrimary, fontWeight: active ? '700' : '500'}]}>
                      {srv.name?.ar ?? srv.nameAr ?? ''}
                    </Text>
                  </TouchableOpacity>
                  {i < allServices.length - 1 && <View style={[ms.sep, {backgroundColor: colors.border}]} />}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Price row per service ────────────────────────────────────────────────────
function ServicePriceRow({service, prices, onChange, colors, sizeLabelMap}) {
  const labels = sizeLabelMap ?? {small: 'صغير', medium: 'وسط', large: 'كبير'};
  return (
    <View style={[sp.wrap, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      <View style={sp.header}>
        <Text style={[sp.name, {color: colors.textPrimary}]}>{service.nameAr}</Text>
      </View>
      <View style={sp.sizesRow}>
        {['small', 'medium', 'large'].map(size => (
          <View key={size} style={sp.sizeCol}>
            <Text style={[sp.sizeLabel, {color: colors.textSecondary}]}>{labels[size]}</Text>
            <View style={[sp.inputBox, {backgroundColor: colors.card, borderColor: prices[size] ? colors.primary + '60' : colors.border}]}>
              <TextInput
                style={[sp.input, {color: colors.textPrimary}]}
                value={prices[size]}
                onChangeText={v => onChange(size, v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                textAlign="center"
              />
            </View>
            {prices[size] ? (
              <View style={[sp.activeDot, {backgroundColor: colors.primary}]} />
            ) : (
              <View style={[sp.activeDot, {backgroundColor: 'transparent'}]} />
            )}
          </View>
        ))}
      </View>
      <Text style={[sp.hint, {color: colors.textSecondary}]}>
        اتركها فارغة لعدم تطبيق العرض على هذا الحجم
      </Text>
    </View>
  );
}

// ─── Add / Edit offer screen ──────────────────────────────────────────────────
function AddOfferScreen({onBack, onSave, initialData, allServices}) {
  const {colors} = useTheme();
  const isEdit = !!initialData;

  const rawFirst      = initialData?.serviceIds?.[0] ?? null;
  const initServiceId = rawFirst ? (typeof rawFirst === 'object' ? (rawFirst._id ?? rawFirst.id) : rawFirst) : null;
  const initPrices    = initServiceId ? (initialData?.prices?.[initServiceId] ?? {small: '', medium: '', large: ''}) : {small: '', medium: '', large: ''};

  const [name,          setName]          = useState(initialData?.name?.ar ?? initialData?.name?.en ?? (typeof initialData?.name === 'string' ? initialData.name : ''));
  const [serviceId,     setServiceId]     = useState(initServiceId);
  const [prices,        setPrices]        = useState(initPrices);
  const [endDate,       setEndDate]       = useState(() => {
    if (!initialData?.endDate) return null;
    const d = new Date(initialData.endDate);
    if (isNaN(d.getTime())) return null;
    return {day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear()};
  });
  const [showPicker,    setShowPicker]    = useState(false);
  const [showDatePicker,setShowDatePicker]= useState(false);
  const [saving,        setSaving]        = useState(false);

  const pad = n => String(n).padStart(2, '0');
  const endDateLabel = endDate ? `${pad(endDate.day)} / ${pad(endDate.month)} / ${endDate.year}` : null;

  const selectedService = allServices.find(s => (s._id ?? s.id) === serviceId) ?? null;

  const handleSelectService = id => {
    setServiceId(id);
    setPrices({small: '', medium: '', large: ''});
  };

  const updatePrice = (size, val) =>
    setPrices(p => ({...p, [size]: val.replace(/[^0-9.]/g, '')}));

  const hasAtLeastOnePrice = ['small', 'medium', 'large'].some(sz => prices[sz]?.trim());
  const canSave = name.trim() && serviceId && hasAtLeastOnePrice && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const endDateIso = endDate
      ? new Date(endDate.year, endDate.month - 1, endDate.day).toISOString()
      : undefined;
    await onSave?.({
      name: {ar: name, en: name},
      serviceIds: [serviceId],
      prices: {[serviceId]: prices},
      ...(endDateIso ? {endDate: endDateIso} : {}),
      isActive: true,
    });
    setSaving(false);
    onBack();
  };

  const SIZE_LABELS_FULL = {small: 'صغير', medium: 'وسط', large: 'كبير'};

  return (
    <View style={[a.root, {backgroundColor: colors.bg}]}>
      <View style={[a.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={a.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[a.headerTitle, {color: colors.textPrimary}]}>
          {isEdit ? 'تعديل العرض' : 'إضافة عرض'}
        </Text>
        <View style={a.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={a.scroll} keyboardShouldPersistTaps="handled">

        {/* Offer name */}
        <Text style={[a.label, {color: colors.textPrimary}]}>اسم العرض</Text>
        <View style={[a.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[a.input, {color: colors.textPrimary}]}
            placeholder="مثال: عرض نهاية الأسبوع"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* End date */}
        <Text style={[a.label, {color: colors.textPrimary}]}>تاريخ انتهاء العرض</Text>
        <TouchableOpacity
          style={[a.trigger, {backgroundColor: colors.card, borderColor: endDate ? colors.primary + '60' : colors.border}]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}>
          <Text style={[a.triggerTxt, {color: endDateLabel ? colors.textPrimary : colors.textSecondary}]}>
            {endDateLabel ?? 'اختر تاريخ الانتهاء'}
          </Text>
          <CalendarDays size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Service picker */}
        <Text style={[a.label, {color: colors.textPrimary}]}>الخدمة الشاملة في العرض</Text>
        <TouchableOpacity
          style={[a.trigger, {backgroundColor: colors.card, borderColor: serviceId ? colors.primary + '60' : colors.border}]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}>
          <Text style={[a.triggerTxt, {color: selectedService ? colors.textPrimary : colors.textSecondary}]}>
            {selectedService ? (selectedService.name?.ar ?? selectedService.nameAr ?? '') : 'اختر الخدمة'}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Price inputs */}
        {selectedService && (
          <ServicePriceRow
            service={{...selectedService, nameAr: selectedService.name?.ar ?? selectedService.nameAr ?? ''}}
            prices={prices}
            onChange={updatePrice}
            colors={colors}
            sizeLabelMap={SIZE_LABELS_FULL}
          />
        )}

        <TouchableOpacity
          style={[a.saveBtn, {backgroundColor: canSave ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={a.saveTxt}>{isEdit ? 'حفظ التعديلات' : 'إضافة العرض'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <ServicePickerModal
        visible={showPicker}
        selectedId={serviceId}
        onSelect={handleSelectService}
        onClose={() => setShowPicker(false)}
        colors={colors}
        allServices={allServices}
      />

      <DatePickerModal
        visible={showDatePicker}
        date={endDate}
        onChange={setEndDate}
        onClose={() => setShowDatePicker(false)}
        colors={colors}
      />
    </View>
  );
}

const SIZE_LABELS = {small: 'صغير', medium: 'وسط', large: 'كبير'};

// ─── Offer card ───────────────────────────────────────────────────────────────
function OfferCard({item, colors, onEdit, onToggleActive, onDelete, allServices}) {
  const id       = item._id ?? item.id;
  const isActive = item.isActive ?? item.active ?? false;
  const label    = item.name?.ar ?? item.name?.en ?? (typeof item.name === 'string' ? item.name : '');
  const serviceIds = item.serviceIds ?? [];

  const activeSizes = serviceIds.map(svcEntry => {
    const id      = typeof svcEntry === 'object' ? (svcEntry._id ?? svcEntry.id) : svcEntry;
    const nameAr  = typeof svcEntry === 'object' ? (svcEntry.name?.ar ?? svcEntry.name?.en ?? '') : '';
    const srvName = nameAr || String(id ?? '');
    const filled  = ['small', 'medium', 'large'].filter(sz => item.prices?.[id]?.[sz]?.toString().trim());
    return {id: String(id ?? ''), name: srvName, sizes: filled};
  });

  const endDateLabel = item.endDate
    ? new Date(item.endDate).toLocaleDateString('ar-SA')
    : null;

  return (
    <View style={[oc.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={oc.topRow}>
        <View style={[oc.tagBadge, {backgroundColor: colors.primary + '15'}]}>
          <Tag size={13} color={colors.primary} />
          <Text style={[oc.tagTxt, {color: colors.primary}]}>عرض</Text>
        </View>
        <Text style={[oc.name, {color: colors.textPrimary}]}>{label}</Text>
        <View style={oc.actions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={oc.actionBtn} activeOpacity={0.7}>
            <Pencil size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(id)} style={oc.actionBtn} activeOpacity={0.7}>
            <Trash2 size={15} color={colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onToggleActive(id, isActive)}
            style={[oc.statusPill, {backgroundColor: isActive ? colors.primary + '15' : colors.border}]}
            activeOpacity={0.75}>
            <View style={[oc.statusDot, {backgroundColor: isActive ? colors.primary : colors.textSecondary}]} />
            <Text style={[oc.statusTxt, {color: isActive ? colors.primary : colors.textSecondary}]}>
              {isActive ? 'فعال' : 'معطل'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[oc.divider, {backgroundColor: colors.border}]} />

      <View style={oc.servicesList}>
        {activeSizes.map(({id: srvId, name: srvName, sizes}) => (
          <View key={srvId} style={oc.serviceRow}>
            <View style={oc.sizeChips}>
              {sizes.map(sz => (
                <View key={sz} style={[oc.chip, {backgroundColor: colors.primary + '12'}]}>
                  <Text style={[oc.chipTxt, {color: colors.primary}]}>{SIZE_LABELS[sz]}</Text>
                </View>
              ))}
            </View>
            <Text style={[oc.srvName, {color: colors.textPrimary}]}>{srvName}</Text>
          </View>
        ))}
      </View>

      {endDateLabel ? (
        <View style={[oc.endDateRow, {backgroundColor: colors.warning + '15'}]}>
          <Text style={[oc.endDateTxt, {color: colors.warning}]}>ينتهي: {endDateLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OffersScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [offers,          setOffers]          = useState([]);
  const [allServices,     setAllServices]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showAdd,         setShowAdd]         = useState(false);
  const [editing,         setEditing]         = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchOffers = useCallback(async (withInactive) => {
    setLoading(true);
    const params = {limit: 100};
    if (withInactive) params.includeInactive = true;
    const res = await getOffers(params);
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setOffers(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOffers({limit: 100}),
      getCategoryServices(),
    ]).then(([offRes, srvRes]) => {
      if (offRes.success) {
        const list = offRes.data?.data ?? offRes.data ?? [];
        setOffers(Array.isArray(list) ? list : []);
      }
      if (srvRes.success) {
        const cats = srvRes.data?.data ?? srvRes.data ?? [];
        const flat = (Array.isArray(cats) ? cats : []).flatMap(c => c.services ?? []);
        setAllServices(flat);
      }
      setLoading(false);
    });
  }, []);

  const handleToggleFilter = useCallback((val) => {
    setIncludeInactive(val);
    fetchOffers(val);
  }, [fetchOffers]);

  const handleToggleActive = useCallback(async (id, currentActive) => {
    setOffers(prev => prev.map(o => (o._id ?? o.id) === id ? {...o, isActive: !currentActive} : o));
    await toggleOffer(id, !currentActive);
  }, []);

  const handleSave = useCallback(async data => {
    if (editing) {
      const id = editing._id ?? editing.id;
      await updateOffer(id, data);
    } else {
      await createOffer(data);
    }
    setEditing(null);
    setShowAdd(false);
    fetchOffers(includeInactive);
  }, [editing, fetchOffers, includeInactive]);

  const handleEdit   = useCallback(item => setEditing(item), []);

  const handleDelete = useCallback(async id => {
    setOffers(prev => prev.filter(o => (o._id ?? o.id) !== id));
    await deleteOffer(id);
  }, []);

  const renderItem = useCallback(({item}) => (
    <OfferCard
      item={item}
      colors={colors}
      onEdit={handleEdit}
      onToggleActive={handleToggleActive}
      onDelete={handleDelete}
      allServices={allServices}
    />
  ), [colors, handleEdit, handleToggleActive, handleDelete, allServices]);

  const keyExtractor = useCallback(item => item._id ?? item.id ?? Math.random().toString(), []);

  const showList = !showAdd && !editing;
  const activeCount = offers.filter(o => o.isActive ?? o.active).length;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? null : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.operations.menu.offers')}</Text>
              <Text style={[s.headerSub, {color: colors.textSecondary}]}>
                {activeCount} عروض فعالة
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={s.filterRow}>
            {[
              {key: false, label: 'الفعالة فقط'},
              {key: true,  label: 'الكل'},
            ].map(f => {
              const active = includeInactive === f.key;
              return (
                <TouchableOpacity
                  key={String(f.key)}
                  style={[s.filterChip, {backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border}]}
                  onPress={() => handleToggleFilter(f.key)}
                  activeOpacity={0.75}>
                  <Text style={[s.filterChipTxt, {color: active ? '#FFF' : colors.textSecondary}]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading
            ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            : (
              <FlatList
                data={offers}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={s.center}>
                    <Text style={{color: colors.textSecondary, fontSize: 14}}>لا توجد عروض</Text>
                  </View>
                }
              />
            )
          }
        </View>
      </View>

      {showAdd && (
        <View style={s.flex}>
          <AddOfferScreen onBack={() => setShowAdd(false)} onSave={handleSave} allServices={allServices} />
        </View>
      )}
      {editing && (
        <View style={s.flex}>
          <AddOfferScreen initialData={editing} onBack={() => setEditing(null)} onSave={handleSave} allServices={allServices} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  hidden:      {display: 'none'},
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},
  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 14},
  filterRow:      {flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12},
  filterChip:     {paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50, borderWidth: 1},
  filterChipTxt:  {fontSize: 13, fontWeight: '600'},
});

const a = StyleSheet.create({
  root:          {flex: 1},
  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:   {fontSize: 20, fontWeight: '800'},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  scroll:        {paddingHorizontal: 16, paddingBottom: 40, gap: 12},
  label:         {fontSize: 14, fontWeight: '700', marginTop: 4},
  inputBox:      {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:         {fontSize: 14, padding: 0},
  trigger:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  triggerTxt:    {fontSize: 14},
  saveBtn:       {paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8},
  saveTxt:       {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

const sp = StyleSheet.create({
  wrap:       {borderRadius: 16, borderWidth: 1, padding: 14, gap: 10},
  header:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  name:       {flex: 1, fontSize: 14, fontWeight: '700'},
  sizesRow:   {flexDirection: 'row', gap: 10},
  sizeCol:    {flex: 1, alignItems: 'center', gap: 6},
  sizeLabel:  {fontSize: 12, fontWeight: '600'},
  inputBox:   {width: '100%', borderRadius: 10, borderWidth: 1.5, height: 44, alignItems: 'center', justifyContent: 'center'},
  input:      {width: '100%', fontSize: 15, fontWeight: '700', padding: 0, textAlign: 'center'},
  activeDot:  {width: 6, height: 6, borderRadius: 3},
  hint:       {fontSize: 10, textAlign: 'center'},
});

const oc = StyleSheet.create({
  card:        {borderRadius: 18, borderWidth: 1, padding: 16, gap: 12},
  topRow:      {flexDirection: 'row', alignItems: 'center', gap: 8},
  tagBadge:    {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20},
  tagTxt:      {fontSize: 11, fontWeight: '700'},
  name:        {flex: 1, fontSize: 15, fontWeight: '800'},
  actions:     {flexDirection: 'row', alignItems: 'center', gap: 8},
  actionBtn:   {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  statusPill:  {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  statusDot:   {width: 6, height: 6, borderRadius: 3},
  statusTxt:   {fontSize: 11, fontWeight: '700'},
  divider:     {height: 1},
  servicesList:{gap: 8},
  serviceRow:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  srvName:     {fontSize: 13, fontWeight: '600'},
  sizeChips:   {flexDirection: 'row', gap: 6},
  chip:        {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8},
  chipTxt:     {fontSize: 11, fontWeight: '700'},
  endDateRow:  {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start'},
  endDateTxt:  {fontSize: 11, fontWeight: '700'},
});

const dp = StyleSheet.create({
  overlay:    {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:      {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:       {borderRadius: 24, padding: 20, gap: 16},
  handle:     {width: 40, height: 4, borderRadius: 2, alignSelf: 'center'},
  title:      {fontSize: 17, fontWeight: '800', textAlign: 'center'},
  preview:    {alignItems: 'center'},
  previewTxt: {fontSize: 22, fontWeight: '900'},
  section:    {gap: 8},
  sectionLabel:{fontSize: 12, fontWeight: '700'},
  chips:      {gap: 8, paddingHorizontal: 2},
  chip:       {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5},
  chipTxt:    {fontSize: 13, fontWeight: '700'},
  confirmBtn: {paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4},
  confirmTxt: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

const ms = StyleSheet.create({
  overlay:  {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)'},
  sheet:    {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:     {borderRadius: 20, paddingTop: 8, paddingBottom: 16, maxHeight: 420},
  title:    {fontSize: 16, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 12},
  row:      {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14},
  radio:    {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot: {width: 10, height: 10, borderRadius: 5},
  rowTxt:   {flex: 1, fontSize: 15},
  sep:      {height: 1, marginHorizontal: 16},
});
