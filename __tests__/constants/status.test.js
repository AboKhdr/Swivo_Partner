/**
 * Tests for src/shared/constants/status.js
 * Covers: STATUS_MAP, STATUS_STEPS, STATUS_COLORS structure and values
 */

jest.mock('../../src/shared/constants/colors', () => ({
  Colors: {
    warning: '#F59E0B',
    primary: '#1B7BF5',
    purple:  '#8B5CF6',
    success: '#10B981',
    danger:  '#EF4444',
  },
}));

const {STATUS_MAP, STATUS_STEPS, STATUS_COLORS} =
  require('../../src/shared/constants/status');

// ── STATUS_MAP ────────────────────────────────────────────────────────────────

describe('STATUS_MAP', () => {
  const EXPECTED_KEYS = ['ASSIGNED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'];

  it('contains all expected status keys', () => {
    EXPECTED_KEYS.forEach(key => {
      expect(STATUS_MAP).toHaveProperty(key);
    });
  });

  it('each status has label and color', () => {
    EXPECTED_KEYS.forEach(key => {
      expect(typeof STATUS_MAP[key].label).toBe('string');
      expect(STATUS_MAP[key].label.length).toBeGreaterThan(0);
      expect(typeof STATUS_MAP[key].color).toBe('string');
    });
  });

  it('ASSIGNED label is مُسند', () => {
    expect(STATUS_MAP.ASSIGNED.label).toBe('مُسند');
  });

  it('COMPLETED label is مكتمل', () => {
    expect(STATUS_MAP.COMPLETED.label).toBe('مكتمل');
  });

  it('CANCELLED label is ملغي', () => {
    expect(STATUS_MAP.CANCELLED.label).toBe('ملغي');
  });

  it('does not contain ARRIVED or PENDING', () => {
    expect(STATUS_MAP).not.toHaveProperty('ARRIVED');
    expect(STATUS_MAP).not.toHaveProperty('PENDING');
  });
});

// ── STATUS_STEPS ──────────────────────────────────────────────────────────────

describe('STATUS_STEPS', () => {
  it('is an array of 5 steps', () => {
    expect(Array.isArray(STATUS_STEPS)).toBe(true);
    expect(STATUS_STEPS).toHaveLength(5);
  });

  it('starts with ASSIGNED', () => {
    expect(STATUS_STEPS[0]).toBe('ASSIGNED');
  });

  it('ends with COMPLETED', () => {
    expect(STATUS_STEPS[STATUS_STEPS.length - 1]).toBe('COMPLETED');
  });

  it('contains ARRIVED as step 3 (index 2)', () => {
    expect(STATUS_STEPS[2]).toBe('ARRIVED');
  });

  it('follows correct linear order', () => {
    expect(STATUS_STEPS).toEqual([
      'ASSIGNED',
      'ON_THE_WAY',
      'ARRIVED',
      'STARTED',
      'COMPLETED',
    ]);
  });

  it('each step is a non-empty string', () => {
    STATUS_STEPS.forEach(step => {
      expect(typeof step).toBe('string');
      expect(step.length).toBeGreaterThan(0);
    });
  });

  it('indexOf works correctly for navigation logic', () => {
    expect(STATUS_STEPS.indexOf('ON_THE_WAY')).toBe(1);
    expect(STATUS_STEPS.indexOf('STARTED')).toBe(3);
    expect(STATUS_STEPS.indexOf('NONEXISTENT')).toBe(-1);
  });
});

// ── STATUS_COLORS ─────────────────────────────────────────────────────────────

describe('STATUS_COLORS', () => {
  const COLOR_KEYS = ['ASSIGNED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'];

  it('contains all statuses', () => {
    COLOR_KEYS.forEach(key => {
      expect(STATUS_COLORS).toHaveProperty(key);
    });
  });

  it('each status has bg, text, dot fields', () => {
    COLOR_KEYS.forEach(key => {
      expect(STATUS_COLORS[key]).toHaveProperty('bg');
      expect(STATUS_COLORS[key]).toHaveProperty('text');
      expect(STATUS_COLORS[key]).toHaveProperty('dot');
    });
  });

  it('all color values are valid hex strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
    COLOR_KEYS.forEach(key => {
      expect(STATUS_COLORS[key].bg).toMatch(hexPattern);
      expect(STATUS_COLORS[key].text).toMatch(hexPattern);
      expect(STATUS_COLORS[key].dot).toMatch(hexPattern);
    });
  });

  it('COMPLETED uses green palette', () => {
    expect(STATUS_COLORS.COMPLETED.bg).toBe('#D1FAE5');
    expect(STATUS_COLORS.COMPLETED.dot).toBe('#10B981');
  });

  it('CANCELLED uses red palette', () => {
    expect(STATUS_COLORS.CANCELLED.bg).toBe('#FEE2E2');
    expect(STATUS_COLORS.CANCELLED.dot).toBe('#EF4444');
  });
});
