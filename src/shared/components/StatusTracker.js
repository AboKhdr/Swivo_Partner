import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Play, MapPin, UserCheck, Droplets, Camera} from 'lucide-react-native';
import {Colors} from '../constants/colors';
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
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <View style={s.root}>
      {STEPS.map(({key, Icon}, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;

        return (
          <React.Fragment key={key}>
            {/* separator line between boxes */}
            {i > 0 && (
              <View style={[s.line, (done || active) && s.lineActive]} />
            )}

            <View style={[s.box, done && s.boxDone, active && s.boxActive]}>
              <Icon
                size={16}
                strokeWidth={2}
                color={active ? '#fff' : done ? Colors.primary : '#CBD5E1'}
              />
              {active && <View style={s.pulse} />}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    maxWidth: 32,
  },
  lineActive: {backgroundColor: Colors.primary},
  box: {
    width: BOX,
    height: BOX,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: {backgroundColor: Colors.primary + '18'},
  boxActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  pulse: {
    position: 'absolute',
    width: BOX + 10,
    height: BOX + 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '35',
  },
});
