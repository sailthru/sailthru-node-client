import { describe, it, expect } from 'vitest';
import { createSailthruClient, SailthruClient, VERSION } from '../src/index';
import { SailthruUtil } from '../src/utils';

describe('Basic Functionality', () => {
  describe('Version and Exports', () => {
    it('should export VERSION', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
      expect(VERSION).toBe('5.0.5');
    });

    it('should create client via factory function', () => {
      const client = createSailthruClient('test-key', 'test-secret');
      expect(client).toBeInstanceOf(SailthruClient);
    });

    it('should create client via constructor', () => {
      const client = new SailthruClient('test-key', 'test-secret');
      expect(client).toBeInstanceOf(SailthruClient);
    });
  });

  describe('Client Methods', () => {
    const client = createSailthruClient('test-key', 'test-secret');

    it('should have all expected methods', () => {
      const expectedMethods = [
        'apiGet', 'apiPost', 'apiDelete',
        'send', 'multiSend', 'getSend',
        'getUserBySid', 'getUserByKey',
        'enableLogging', 'disableLogging',
        'getLastRateLimitInfo'
      ];

      expectedMethods.forEach(method => {
        expect(typeof (client as any)[method]).toBe('function');
      });
    });

    it('should handle logging toggle', () => {
      client.enableLogging();
      expect(client.logging).toBe(true);
      
      client.disableLogging();
      expect(client.logging).toBe(false);
    });
  });

  describe('URL Configuration', () => {
    it('should use default API URL', () => {
      const client = new SailthruClient('key', 'secret');
      expect((client as any).api_url).toBe('https://api.sailthru.com');
    });

    it('should accept custom API URL', () => {
      const client = new SailthruClient('key', 'secret', {
        apiUrl: 'https://custom.api.com'
      });
      expect((client as any).api_url).toBe('https://custom.api.com');
    });

    it('should throw error for invalid protocol', () => {
      expect(() => {
        new SailthruClient('key', 'secret', {
          apiUrl: 'ftp://invalid.com'
        });
      }).toThrow('Must specify protocol of http:// or https://');
    });
  });

  describe('receiveOptoutPost', () => {
    const client = createSailthruClient('abcd12345', '1324qwerty');

    it('should validate correct optout post', () => {
      const params = {
        action: 'optout',
        email: 'foo@bar.com',
        sig: '89b9fce5296ce2920dad46ed3467001d'
      };
      const result = client.receiveOptoutPost(params);
      expect(result).toBe(true);
    });

    it('should reject optout post without sig', () => {
      const params = {
        action: 'optout',
        email: 'foo@bar.com'
      };
      const result = client.receiveOptoutPost(params);
      expect(result).toBe(false);
    });

    it('should reject undefined params', () => {
      const result = client.receiveOptoutPost(undefined);
      expect(result).toBe(false);
    });
  });

  describe('SailthruUtil', () => {
    it('should generate correct MD5 hash', () => {
      const result = SailthruUtil.md5('simple_text');
      expect(result).toBe('b7f6e77dceccceaedc3756be73fa5d63');
    });

    it('should extract parameter values correctly', () => {
      const params = { key1: 'value1', key2: 'value2' };
      const result = SailthruUtil.extractParamValues(params);
      expect(result).toContain('value1');
      expect(result).toContain('value2');
    });

    it('should generate signature hash', () => {
      const params = { api_key: 'test', format: 'json' };
      const secret = 'secret';
      const result = SailthruUtil.getSignatureHash(params, secret);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(32); // MD5 length
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain same API as v5', () => {
      const sailthru = { createSailthruClient, VERSION };
      
      // Test that we can use it exactly like the old API
      expect(sailthru.VERSION).toBeDefined();
      expect(typeof sailthru.createSailthruClient).toBe('function');
      
      const client = sailthru.createSailthruClient('key', 'secret');
      expect(typeof client.apiGet).toBe('function');
      expect(typeof client.apiPost).toBe('function');
      expect(typeof client.send).toBe('function');
      expect(typeof client.enableLogging).toBe('function');
    });
  });
});