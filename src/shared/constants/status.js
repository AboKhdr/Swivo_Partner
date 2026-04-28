import {Colors} from './colors';

export const STATUS_MAP = {
  ASSIGNED:   {label: 'مُسند',        color: Colors.warning},
  ON_THE_WAY: {label: 'في الطريق',    color: Colors.primary},
  STARTED:    {label: 'جارٍ التنفيذ', color: Colors.purple},
  COMPLETED:  {label: 'مكتمل',        color: Colors.success},
  CANCELLED:  {label: 'ملغي',         color: Colors.danger},
};

export const STATUS_STEPS = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED'];

export const STATUS_COLORS = {
  ASSIGNED:   {bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B'},
  ON_THE_WAY: {bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6'},
  STARTED:    {bg: '#EDE9FE', text: '#6D28D9', dot: '#8B5CF6'},
  COMPLETED:  {bg: '#D1FAE5', text: '#065F46', dot: '#10B981'},
  CANCELLED:  {bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444'},
};
