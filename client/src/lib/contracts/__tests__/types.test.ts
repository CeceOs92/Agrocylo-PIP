import { describe, it, expect } from 'vitest';
import { ContractError, AmountFormatter } from '../types';

describe('ContractError', () => {
  it('creates error from raw string', () => {
    const error = ContractError.fromRaw('Test error');
    expect(error).toBeInstanceOf(ContractError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('maps campaign not accepting contributions error', () => {
    const rawError = new Error('campaign not accepting contributions');
    const error = ContractError.fromRaw(rawError);
    expect(error.code).toBe('CAMPAIGN_NOT_ACCEPTING');
    expect(error.message).toBe('Campaign is not accepting contributions');
  });

  it('maps campaign already exists error', () => {
    const rawError = new Error('campaign already exists');
    const error = ContractError.fromRaw(rawError);
    expect(error.code).toBe('CAMPAIGN_EXISTS');
  });

  it('maps not authorized error', () => {
    const rawError = new Error('not authorized to do this');
    const error = ContractError.fromRaw(rawError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('maps user declined error', () => {
    const rawError = new Error('user declined the transaction');
    const error = ContractError.fromRaw(rawError);
    expect(error.code).toBe('USER_REJECTED');
  });

  it('preserves ContractError instance', () => {
    const original = new ContractError('Test', 'TEST_CODE');
    const error = ContractError.fromRaw(original);
    expect(error).toBe(original);
  });
});

describe('AmountFormatter', () => {
  describe('with 7 decimals (default)', () => {
    const formatter = new AmountFormatter(7);

    it('converts stroops to decimal', () => {
      expect(formatter.toDecimal(10000000n)).toBe('1');
      expect(formatter.toDecimal(12345678n)).toBe('1.2345678');
      expect(formatter.toDecimal(100n)).toBe('0.00001');
    });

    it('converts decimal to stroops', () => {
      expect(formatter.fromDecimal('1')).toBe(10000000n);
      expect(formatter.fromDecimal('1.2345678')).toBe(12345678n);
      expect(formatter.fromDecimal('0.00001')).toBe(100n);
    });

    it('trims trailing zeros in decimal', () => {
      expect(formatter.toDecimal(10000000n)).toBe('1');
      expect(formatter.toDecimal(12300000n)).toBe('1.23');
    });

    it('handles zero', () => {
      expect(formatter.toDecimal(0n)).toBe('0');
      expect(formatter.fromDecimal('0')).toBe(0n);
    });

    it('formats with symbol', () => {
      expect(formatter.format(10000000n, 'USDC')).toBe('1 USDC');
      expect(formatter.format(12345678n, 'XLM')).toBe('1.2345678 XLM');
    });

    it('formats without symbol', () => {
      expect(formatter.format(10000000n)).toBe('1');
    });

    it('throws on excessive decimal precision', () => {
      expect(() => formatter.fromDecimal('1.12345678')).toThrow(
        'Decimal precision exceeds 7 places',
      );
    });

    it('handles large amounts', () => {
      const large = 123456789012345n;
      const decimal = formatter.toDecimal(large);
      const restored = formatter.fromDecimal(decimal);
      expect(restored).toBe(large);
    });
  });

  describe('with 2 decimals', () => {
    const formatter = new AmountFormatter(2);

    it('converts with correct precision', () => {
      expect(formatter.toDecimal(100n)).toBe('1');
      expect(formatter.toDecimal(123n)).toBe('1.23');
      expect(formatter.fromDecimal('1.23')).toBe(123n);
    });

    it('throws on excessive precision', () => {
      expect(() => formatter.fromDecimal('1.234')).toThrow(
        'Decimal precision exceeds 2 places',
      );
    });
  });

  describe('round-trip conversion', () => {
    const formatter = new AmountFormatter(7);

    it('preserves value through round-trip', () => {
      const amounts = [0n, 1n, 100n, 10000000n, 12345678n, 999999999999n];

      for (const amount of amounts) {
        const decimal = formatter.toDecimal(amount);
        const restored = formatter.fromDecimal(decimal);
        expect(restored).toBe(amount);
      }
    });
  });
});
