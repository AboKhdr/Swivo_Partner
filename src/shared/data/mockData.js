export const MOCK_USER = {
  firstName: 'أحمد',
  lastName: 'محمد',
  rating: 4.7,
  wallet: {balance: 1250.0, monthlyEarnings: 850.0, weeklyEarnings: 320.0},
};

export const MOCK_ORDERS = [
  {
    _id: '1', orderNumber: 'ORD-1234', status: 'ASSIGNED', type: 'mobile',
    car: {brand: 'Toyota', model: 'Camry', color: 'أبيض', plateNumber: 'RTL 8756'},
    address: 'الرياض، حي الياسمين', scheduledAt: '10:30 ص', scheduledDate: 'اليوم',
    service: {name: 'غسيل خارجي', price: 50},
    client: {firstName: 'غيث', lastName: 'أحمد', phoneNumber: '0501234567'},
    extras: ['علبة مناديل', 'عطورات داخل السيارة'],
    bikerEarning: 45.00, createdAt: '2026-04-27T07:00:00.000Z',
  },
  {
    _id: '2', orderNumber: 'ORD-1235', status: 'ON_THE_WAY', type: 'onshop',
    car: {brand: 'Honda', model: 'Accord', color: 'أسود', plateNumber: 'XYZ 5678'},
    address: 'حي العليا، الرياض', scheduledAt: '11:00 ص', scheduledDate: 'اليوم',
    service: {name: 'غسيل داخلي', price: 40},
    client: {firstName: 'خالد', lastName: 'المطيري', phoneNumber: '0509876543'},
    extras: ['تلميع الإطارات'],
    bikerEarning: 36.00, createdAt: '2026-04-27T08:00:00.000Z',
  },
  {
    _id: '3', orderNumber: 'ORD-1236', status: 'STARTED', type: 'mobile',
    car: {brand: 'BMW', model: 'X5', color: 'رمادي', plateNumber: 'DEF 9012'},
    address: 'حي الملقا، الرياض', scheduledAt: '12:00 م', scheduledDate: 'اليوم',
    service: {name: 'تنظيف شامل', price: 80},
    client: {firstName: 'عمر', lastName: 'الشمري', phoneNumber: '0555551234'},
    extras: ['تلميع الإطارات', 'تعطير داخلي', 'تنظيف المحرك'],
    bikerEarning: 72.00, createdAt: '2026-04-27T09:00:00.000Z',
  },
];

export const MOCK_PAST_ORDERS = [
  {
    _id: '4', orderNumber: 'ORD-1230', status: 'COMPLETED',
    car: {brand: 'Lexus', model: 'ES350', color: 'فضي', plateNumber: 'GHI 3456'},
    address: 'حي الروضة، الرياض', scheduledAt: '09:00 ص', scheduledDate: 'الأمس',
    service: {name: 'غسيل كامل', price: 50},
    client: {firstName: 'فهد', lastName: 'السعيد', phoneNumber: '0512345678'},
    extras: ['علبة مناديل', 'تلميع الإطارات'],
    bikerEarning: 45.00, createdAt: '2026-04-26T06:00:00.000Z',
  },
  {
    _id: '5', orderNumber: 'ORD-1229', status: 'COMPLETED',
    car: {brand: 'Kia', model: 'Sportage', color: 'أزرق', plateNumber: 'JKL 7890'},
    address: 'حي الورود، الرياض', scheduledAt: '02:00 م', scheduledDate: 'الأمس',
    service: {name: 'غسيل خارجي', price: 30},
    client: {firstName: 'محمد', lastName: 'العتيبي', phoneNumber: '0566667777'},
    extras: [],
    bikerEarning: 27.00, createdAt: '2026-04-26T11:00:00.000Z',
  },
  {
    _id: '6', orderNumber: 'ORD-1225', status: 'CANCELLED',
    car: {brand: 'Hyundai', model: 'Sonata', color: 'أبيض', plateNumber: 'MNO 1122'},
    address: 'حي السليمانية، الرياض', scheduledAt: '11:00 ص', scheduledDate: '25 أبريل',
    service: {name: 'تنظيف شامل', price: 80},
    client: {firstName: 'عبدالله', lastName: 'الدوسري', phoneNumber: '0577778888'},
    extras: ['تعطير داخلي'],
    bikerEarning: 0, createdAt: '2026-04-25T08:00:00.000Z',
  },
];

export const MOCK_SERVICES_ALL = [
  {id: 's1', nameAr: 'غسلة سريعة',   category: 'غسيل'},
  {id: 's2', nameAr: 'غسلة متقدمة',  category: 'تلميع'},
  {id: 's3', nameAr: 'غسيل داخلي',   category: 'تعقيم'},
  {id: 's4', nameAr: 'تنظيف شامل',   category: 'غسيل'},
  {id: 's5', nameAr: 'تلميع الإطارات', category: 'تلميع'},
];

export const MOCK_BRANCHES = [
  {_id: '1', name: 'الفرع الرئيسي — الرياض'},
  {_id: '2', name: 'فرع العليا'},
  {_id: '3', name: 'فرع النزهة'},
  {_id: '4', name: 'فرع الملقا'},
];

export const MOCK_REVIEWS = [
  {_id: '1', client: 'سعد العتيبي',    rating: 5, comment: 'خدمة ممتازة وسريعة جداً!',      date: 'منذ يومين'},
  {_id: '2', client: 'خالد المطيري',   rating: 4, comment: 'عمل جيد، شكراً',               date: 'منذ أسبوع'},
  {_id: '3', client: 'فهد الشمري',     rating: 5, comment: 'أفضل بايكر تعاملت معه',         date: 'منذ أسبوعين'},
  {_id: '4', client: 'عبدالله السالم', rating: 3, comment: 'جيد لكن تأخر قليلاً',           date: 'منذ شهر'},
];
