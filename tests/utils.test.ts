import { describe, it, expect } from 'vitest';
import { SailthruUtil } from '../src/utils';

describe('SailthruUtil', () => {
  describe('extractParamValues', () => {
    it('should extract array values', () => {
      const expected = [1, 2, 3];
      const result = SailthruUtil.extractParamValues(expected);
      expect(result).toEqual(expected);
    });

    it('should extract object values', () => {
      const expected = ['unix', 'linux', 'windows'];
      const params = {
        os1: 'unix',
        os2: 'linux',
        os3: 'windows'
      };
      const result = SailthruUtil.extractParamValues(params);
      expect(result).toEqual(expected);
    });

    it('should extract nested object and array values', () => {
      const expected = ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx'];
      const params = {
        os: ['unix', 'linux', 'windows'],
        linux: {
          server: ['apache', 'nginx']
        },
        windows: {
          server: ['IIS', 'apache', 'nginx']
        }
      };
      const result = SailthruUtil.extractParamValues(params);
      expect(result).toEqual(expected);
    });

    it('should convert boolean values to numbers', () => {
      const expected = ['unix', 'linux', 1, 0];
      const params = {
        os: ['unix', 'linux'],
        vals: {
          type1: true,
          type2: false
        }
      };
      const result = SailthruUtil.extractParamValues(params);
      expect(result).toEqual(expected);
    });
  });

  describe('getSignatureString', () => {
    const secret = '12534sbgsd';

    it('should generate signature string with array', () => {
      const expected = secret + '123';
      const params = [1, 2, 3];
      const result = SailthruUtil.getSignatureString(params, secret);
      expect(result).toBe(expected);
    });

    it('should generate signature string with object (sorted)', () => {
      const expected = secret + ['unix', 'linux', 'windows'].sort().join('');
      const params = {
        os1: 'unix',
        os2: 'linux',
        os3: 'windows'
      };
      const result = SailthruUtil.getSignatureString(params, secret);
      expect(result).toBe(expected);
    });

    it('should generate signature string with nested objects', () => {
      const expected = secret + ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx'].sort().join('');
      const params = {
        os: ['unix', 'linux', 'windows'],
        linux: {
          server: ['apache', 'nginx']
        },
        windows: {
          server: ['IIS', 'apache', 'nginx']
        }
      };
      const result = SailthruUtil.getSignatureString(params, secret);
      expect(result).toBe(expected);
    });

    it('should handle boolean values', () => {
      const expected = secret + ['unix', 'linux', 1, 0].sort().join('');
      const params = {
        os: ['unix', 'linux'],
        vals: {
          type1: true,
          type2: false
        }
      };
      const result = SailthruUtil.getSignatureString(params, secret);
      expect(result).toBe(expected);
    });
  });

  describe('getSignatureHash', () => {
    it('should generate correct signature hash', () => {
      const secret = '1246helloMan';
      const expected = SailthruUtil.md5(secret + ['sailthru', 1, 2].sort().join(''));
      const params = {
        a: ['sailthru', 1, 2]
      };
      const result = SailthruUtil.getSignatureHash(params, secret);
      expect(result).toBe(expected);
    });
  });

  describe('md5', () => {
    it('should generate correct MD5 hash for simple text', () => {
      const data = 'simple_text';
      const expected = 'b7f6e77dceccceaedc3756be73fa5d63';
      const result = SailthruUtil.md5(data);
      expect(result).toBe(expected);
    });

    it('should generate correct MD5 hash for unicode text', () => {
      const data = 'नमस्ते विश्व';
      const expected = 'a76a7baf44b70ec7b2ab63a71fb0ce8c';
      const result = SailthruUtil.md5(data);
      expect(result).toBe(expected);
    });
  });
});