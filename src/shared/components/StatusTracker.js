import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Play, MapPin, UserCheck, Droplets, Camera} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';
import {STATUS_STEPS} from '../constants/status';

const STEPS = [
  {key: 'ASSIGNED',   Icon: Play},
  {key: 'ON_THE_WAY', Icon: MapPin},
  {key: 'ARRIVED',    Icon: UserCheck},
  {key: 'STARTED',    Icon: Droplets},
  {key: 'COMPLETED',  Icon: Camera},
];

const BOX = 38;

export default function StatusTracker({status}) {
  const {colors} = useTheme();
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <View style={s.root}>
      {STEPS.map(({key, Icon}, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;

        return (
          <React.Fragment key={key}>
            {i > 0 && (
              <View style={[s.line, {backgroundColor: (done || active) ? colors.primary : colors.border}]} />
            )}
            <View style={[
              s.box,
              {backgroundColor: done ? colors.primary + '18' : colors.border + '80'},
              active && {backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: {width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:5},
            ]}>
              <Icon size={16} strokeWidth={2} color={active ? '#fff' : done ? colors.primary : colors.textSecondary} />
              {active && <View style={[s.pulse, {borderColor: colors.primary + '35'}]} />}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12},
  line: {flex: 1, height: 2, maxWidth: 32},
  box: {width: BOX, height: BOX, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  pulse: {position: 'absolute', width: BOX + 10, height: BOX + 10, borderRadius: 16, borderWidth: 1.5},
});
