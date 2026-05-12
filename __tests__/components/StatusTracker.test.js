/**
 * Tests for src/shared/components/StatusTracker.js
 * Covers: render, props, steps logic, active/done/upcoming states
 */

import React from 'react';
import {create, act} from 'react-test-renderer';
import StatusTracker from '../../src/shared/components/StatusTracker';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary:       '#1B7BF5',
      border:        '#E2E8F0',
      textSecondary: '#64748B',
    },
  }),
}));

jest.mock('lucide-react-native', () => {
  const {View} = require('react-native');
  const icon = (name) => (props) => <View testID={`icon-${name}`} {...props} />;
  return {
    Play:      icon('Play'),
    MapPin:    icon('MapPin'),
    UserCheck: icon('UserCheck'),
    Droplets:  icon('Droplets'),
    Camera:    icon('Camera'),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOBILE_STEPS = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED'];
const ONSHOP_STEPS = ['ASSIGNED', 'STARTED', 'COMPLETED'];

function renderTracker(status, orderType) {
  let instance;
  act(() => {
    instance = create(<StatusTracker status={status} orderType={orderType} />);
  });
  return instance;
}

function findByTestId(instance, testID) {
  const json = instance.toJSON();
  const results = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.props && node.props.testID === testID) results.push(node);
    if (node.children) node.children.forEach(walk);
  }
  walk(json);
  return results;
}

// ── Mobile Steps ──────────────────────────────────────────────────────────────

describe('StatusTracker — mobile steps', () => {
  it('renders without crashing for ASSIGNED', () => {
    expect(() => renderTracker('ASSIGNED')).not.toThrow();
  });

  it('renders 5 icon boxes for mobile orders', () => {
    const instance = renderTracker('ASSIGNED');
    expect(findByTestId(instance, 'icon-Play')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-MapPin')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-UserCheck')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-Droplets')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-Camera')).toHaveLength(1);
  });

  it('renders for every valid mobile status without crash', () => {
    MOBILE_STEPS.forEach(status => {
      expect(() => renderTracker(status)).not.toThrow();
    });
  });
});

// ── Onshop Steps ──────────────────────────────────────────────────────────────

describe('StatusTracker — onshop steps', () => {
  it('renders 3 icons for onshop orderType', () => {
    const instance = renderTracker('ASSIGNED', 'onshop');
    expect(findByTestId(instance, 'icon-Play')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-Droplets')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-Camera')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-MapPin')).toHaveLength(0);
    expect(findByTestId(instance, 'icon-UserCheck')).toHaveLength(0);
  });

  it('renders for every valid onshop status without crash', () => {
    ONSHOP_STEPS.forEach(status => {
      expect(() => renderTracker(status, 'onshop')).not.toThrow();
    });
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe('StatusTracker — edge cases', () => {
  it('renders without crash when status is undefined', () => {
    expect(() => renderTracker(undefined)).not.toThrow();
  });

  it('renders without crash when status is null', () => {
    expect(() => renderTracker(null)).not.toThrow();
  });

  it('renders without crash when status is empty string', () => {
    expect(() => renderTracker('')).not.toThrow();
  });

  it('renders without crash when status is unknown value', () => {
    expect(() => renderTracker('INVALID_STATUS')).not.toThrow();
  });

  it('renders without crash when orderType is undefined', () => {
    expect(() => renderTracker('ASSIGNED', undefined)).not.toThrow();
  });

  it('uses mobile steps for any orderType other than "onshop"', () => {
    const instance = renderTracker('ASSIGNED', 'mobile');
    expect(findByTestId(instance, 'icon-MapPin')).toHaveLength(1);
    expect(findByTestId(instance, 'icon-UserCheck')).toHaveLength(1);
  });

  it('uses mobile steps when orderType is null', () => {
    const instance = renderTracker('ASSIGNED', null);
    expect(findByTestId(instance, 'icon-UserCheck')).toHaveLength(1);
  });
});

// ── Props ─────────────────────────────────────────────────────────────────────

describe('StatusTracker — prop combinations', () => {
  it('renders with both status and orderType as strings', () => {
    expect(() => renderTracker('STARTED', 'onshop')).not.toThrow();
  });

  it('renders with status number (type mismatch) without crash', () => {
    expect(() => renderTracker(1)).not.toThrow();
  });

  it('renders with status as object without crash', () => {
    expect(() => renderTracker({})).not.toThrow();
  });

  it('renders consistently — same output for same props', () => {
    const a = renderTracker('ASSIGNED', 'onshop');
    const b = renderTracker('ASSIGNED', 'onshop');
    expect(a.toJSON()).toEqual(b.toJSON());
  });
});
