import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ArrowRight, ChevronDown, Check, Minus, Plus} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getServices, createPackage, updatePackage} from '../../../services/partner';

function ServicesModal({visible, allServices, selected, onToggle, onClose, colors}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ms.overlay} />
      </TouchableWithoutFeedback>
      <View style={ms.sheet}>
        <View style={[ms.card, {backgroundColor: colors.card}]}>
          <Text style={[ms.title, {color: colors.textPrimary}]}>الخدمات ضمن الباقة</Text>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {allServices.map((srv, i) => {
              const id     = srv._id ?? srv.id;
              const nameAr = srv.name?.ar ?? srv.name?.en ?? '';
              const active = selected.includes(id);
              return (
                <View key={id}>
                  <TouchableOpacity
                    style={ms.row}
                    onPress={() => onToggle(id)}
                    activeOpacity={0.75}>
                    <Text style={[ms.rowTxt, {
                      color:      active ? colors.primary : colors.textPrimary,
                      fontWeight: active ? '700' : '500',
                    }]}>
                      {nameAr}
                    </Text>
                    {active && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                  {i < allServices.length - 1 && (
                    <View style={[ms.sep, {backgroundColor: colors.border}]} />
                  )}
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[ms.doneBtn, {backgroundColor: colors.primary}]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={ms.doneTxt}>تم</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ServiceStepper({service, count, onIncrement, onDecrement, onRemove, colors}) {
  const nameAr = service.name?.ar ?? service.name?.en ?? '';
  return (
    <View style={[ss.row, {backgroundColor: colors.card}]}>
      <View style={ss.nameWrap}>
        <Text style={[ss.name, {color: colors.textPrimary}]}>{nameAr}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={8} activeOpacity={0.7}>
          <Text style={[ss.remove, {color: colors.danger ?? '#EF4444'}]}>إزالة</Text>
        </TouchableOpacity>
      </View>
      <View style={[ss.stepper, {borderColor: colors.border}]}>
        <TouchableOpacity
          style={[ss.stepBtn, {backgroundColor: colors.bg}]}
          onPress={onDecrement}
          activeOpacity={0.75}>
          <Minus size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[ss.stepVal, {color: colors.textPrimary}]}>{count}</Text>
        <TouchableOpacity
          style={[ss.stepBtn, {backgroundColor: colors.bg}]}
          onPress={onIncrement}
          activeOpacity={0.75}>
          <Plus size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  row:      {borderRadius: 14, padding: 14, gap: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  nameWrap: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  name:     {fontSize: 14, fontWeight: '700'},
  remove:   {fontSize: 12, fontWeight: '600'},
  stepper:  {flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden'},
  stepBtn:  {width: 44, height: 40, alignItems: 'center', justifyContent: 'center'},
  stepVal:  {flex: 1, fontSize: 16, fontWeight: '800', textAlign: 'center'},
});

export default function AddPackageScreen({onBack, onSaved, initialData}) {
  const {colors} = useTheme();
  const isEdit = !!initialData?._id;

  const [nameAr,           setNameAr]           = useState(initialData?.name?.ar ?? '');
  const [nameEn,           setNameEn]           = useState(initialData?.name?.en ?? '');
  const [selectedServices, setSelectedServices]  = useState(() => {
    if (initialData?.services) return initialData.services.map(s => s._id ?? s.id ?? s);
    if (initialData?.serviceIds) return initialData.serviceIds;
    return [];
  });
  const [counts,           setCounts]           = useState({});
  const [showServices,     setShowServices]     = useState(false);
  const [allServices,      setAllServices]      = useState([]);
  const [loadingSvcs,      setLoadingSvcs]      = useState(true);
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    getServices().then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setAllServices(Array.isArray(list) ? list : []);
      }
      setLoadingSvcs(false);
    });
  }, []);

  const toggleService = id => {
    setSelectedServices(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(s => s !== id);
        setCounts(c => { const cp = {...c}; delete cp[id]; return cp; });
        return next;
      }
      setCounts(c => ({...c, [id]: c[id] ?? 1}));
      return [...prev, id];
    });
  };

  const setCount = (id, val) =>
    setCounts(prev => ({...prev, [id]: Math.max(1, val)}));

  const selectedServiceObjs = allServices.filter(s => selectedServices.includes(s._id ?? s.id));

  const summaryTxt = selectedServiceObjs.length > 0
    ? selectedServiceObjs.map(s => `${counts[s._id ?? s.id] ?? 1}× ${s.name?.ar ?? ''}`).join(' ، ')
    : '—';

  const canSave = nameAr.trim() && selectedServices.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      name:       {ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim()},
      serviceIds: selectedServices,
    };
    if (isEdit) {
      await updatePackage(initialData._id, payload);
    } else {
      await createPackage(payload);
    }
    setSaving(false);
    onSaved?.();
    onBack();
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          {isEdit ? 'تعديل الباقة' : 'إضافة باقة'}
        </Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={[s.summaryCard, {backgroundColor: colors.card}]}>
          <Text style={[s.summaryLabel, {color: colors.textSecondary}]}>ملخص الباقة</Text>
          <Text style={[s.summaryTxt, {color: colors.primary}]}>{summaryTxt}</Text>
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الباقة (عربي)</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="مثال: باقة شهرية"
            placeholderTextColor={colors.textSecondary}
            value={nameAr}
            onChangeText={setNameAr}
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الباقة (إنجليزي)</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="Example: Monthly Package"
            placeholderTextColor={colors.textSecondary}
            value={nameEn}
            onChangeText={setNameEn}
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>الخدمات ضمن الباقة</Text>
        <TouchableOpacity
          style={[s.trigger, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setShowServices(true)}
          activeOpacity={0.8}
          disabled={loadingSvcs}>
          <Text style={[s.triggerTxt, {color: selectedServices.length > 0 ? colors.textPrimary : colors.textSecondary}]}>
            {loadingSvcs ? 'جاري التحميل...' : selectedServices.length > 0 ? `${selectedServices.length} خدمات مختارة` : 'اختر الخدمات'}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {selectedServiceObjs.length > 0 && (
          <View style={s.steppersWrap}>
            <Text style={[s.label, {color: colors.textPrimary}]}>العدد لكل خدمة</Text>
            {selectedServiceObjs.map(srv => {
              const id = srv._id ?? srv.id;
              return (
                <ServiceStepper
                  key={id}
                  service={srv}
                  count={counts[id] ?? 1}
                  onIncrement={() => setCount(id, (counts[id] ?? 1) + 1)}
                  onDecrement={() => setCount(id, (counts[id] ?? 1) - 1)}
                  onRemove={() => toggleService(id)}
                  colors={colors}
                />
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: canSave && !saving ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={s.saveTxt}>{isEdit ? 'حفظ التعديلات' : 'حفظ الباقة'}</Text>
          }
        </TouchableOpacity>

      </ScrollView>

      <ServicesModal
        visible={showServices}
        allServices={allServices}
        selected={selectedServices}
        onToggle={toggleService}
        onClose={() => setShowServices(false)}
        colors={colors}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  scroll:       {paddingHorizontal: 16, paddingBottom: 40, gap: 12},

  summaryCard:  {borderRadius: 16, padding: 16, gap: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  summaryLabel: {fontSize: 13, fontWeight: '600'},
  summaryTxt:   {fontSize: 14, fontWeight: '600', lineHeight: 22},

  label:        {fontSize: 14, fontWeight: '700', marginTop: 4},
  inputBox:     {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:        {fontSize: 14, padding: 0},

  trigger:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  triggerTxt:   {fontSize: 14},

  steppersWrap: {gap: 10},

  saveBtn:      {paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8},
  saveTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

const ms = StyleSheet.create({
  overlay:  {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)'},
  sheet:    {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:     {borderRadius: 20, paddingTop: 8, paddingBottom: 16, maxHeight: 420},
  title:    {fontSize: 16, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 12},
  row:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14},
  rowTxt:   {fontSize: 15},
  sep:      {height: 1, marginHorizontal: 16},
  doneBtn:  {marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  doneTxt:  {color: '#FFF', fontSize: 15, fontWeight: '700'},
});
