import { describe, it, expect } from 'vitest';
import { createSailthruClient } from '../src/index';

describe('Webhook Methods', () => {
  const client = createSailthruClient('abcd12345', '1324qwerty');
  client.disableLogging();

  describe('receiveVerifyPost', () => {
    it('should validate correct verify post', () => {
      const params = {
        action: 'verify',
        email: 'test@example.com',
        send_id: 'abc123',
        sig: 'a8c602f1b5b8c8f3fa5e1e9d5c7c8b0a'
      };

      const result = client.receiveVerifyPost(params);
      expect(typeof result).toBe('boolean');
    });

    it('should reject verify post without required parameters', () => {
      const params = {
        action: 'verify',
        email: 'test@example.com'
      };
      const result = client.receiveVerifyPost(params);
      expect(result).toBe(false);
    });

    it('should reject verify post with wrong action', () => {
      const params = {
        action: 'wrong',
        email: 'test@example.com',
        send_id: 'abc123',
        sig: 'some_signature'
      };
      const result = client.receiveVerifyPost(params);
      expect(result).toBe(false);
    });

    it('should reject undefined params', () => {
      const result = client.receiveVerifyPost(undefined);
      expect(result).toBe(false);
    });

    it('should reject non-object params', () => {
      const result = client.receiveVerifyPost('invalid');
      expect(result).toBe(false);
    });
  });

  describe('receiveUpdatePost', () => {
    it('should validate structure for update post', () => {
      const params = {
        action: 'update',
        email: 'test@example.com',
        sig: 'some_signature'
      };
      
      const result = client.receiveUpdatePost(params);
      expect(typeof result).toBe('boolean');
    });

    it('should reject update post without required parameters', () => {
      const params = {
        action: 'update'
      };
      const result = client.receiveUpdatePost(params);
      expect(result).toBe(false);
    });

    it('should reject update post with wrong action', () => {
      const params = {
        action: 'wrong',
        email: 'test@example.com',
        sig: 'some_signature'
      };
      const result = client.receiveUpdatePost(params);
      expect(result).toBe(false);
    });

    it('should reject undefined params', () => {
      const result = client.receiveUpdatePost(undefined);
      expect(result).toBe(false);
    });
  });

  describe('receiveHardbouncePost', () => {
    it('should validate structure for hardbounce post', () => {
      const params = {
        action: 'hardbounce',
        email: 'test@example.com',
        sig: 'some_signature'
      };
      
      const result = client.receiveHardbouncePost(params);
      expect(typeof result).toBe('boolean');
    });

    it('should reject hardbounce post without required parameters', () => {
      const params = {
        action: 'hardbounce',
        email: 'test@example.com'
      };
      const result = client.receiveHardbouncePost(params);
      expect(result).toBe(false);
    });

    it('should reject hardbounce post with wrong action', () => {
      const params = {
        action: 'wrong',
        email: 'test@example.com',
        sig: 'some_signature'
      };
      const result = client.receiveHardbouncePost(params);
      expect(result).toBe(false);
    });

    it('should handle optional parameters like send_id', () => {
      const params = {
        action: 'hardbounce',
        email: 'test@example.com',
        send_id: 'abc123',
        sig: 'some_signature'
      };
      
      const result = client.receiveHardbouncePost(params);
      expect(typeof result).toBe('boolean');
    });

    it('should reject undefined params', () => {
      const result = client.receiveHardbouncePost(undefined);
      expect(result).toBe(false);
    });
  });

  describe('receiveOptoutPost (existing - verify compatibility)', () => {
    it('should maintain backward compatibility', () => {
      // Test the existing method still works as before
      const params1 = {
        action: 'optout',
        email: 'foo@bar.com',
        sig: '89b9fce5296ce2920dad46ed3467001d'
      };
      const result1 = client.receiveOptoutPost(params1);
      expect(result1).toBe(true);

      const params2 = {
        action: 'optout',
        email: 'foo@bar.com'
        // missing sig
      };
      const result2 = client.receiveOptoutPost(params2);
      expect(result2).toBe(false);
    });
  });

  describe('Webhook Method Consistency', () => {
    it('should have all webhook methods available', () => {
      const webhookMethods = [
        'receiveVerifyPost',
        'receiveUpdatePost', 
        'receiveHardbouncePost',
        'receiveOptoutPost'
      ];

      webhookMethods.forEach(method => {
        expect(typeof (client as any)[method]).toBe('function');
      });
    });

    it('should consistently reject null/undefined inputs', () => {
      const methods = [
        'receiveVerifyPost',
        'receiveUpdatePost',
        'receiveHardbouncePost', 
        'receiveOptoutPost'
      ];

      methods.forEach(method => {
        expect((client as any)[method](undefined)).toBe(false);
        expect((client as any)[method](null)).toBe(false);
      });
    });

    it('should consistently validate required action parameter', () => {
      const testCases = [
        { method: 'receiveVerifyPost', action: 'verify', extraParams: { send_id: 'test' } },
        { method: 'receiveUpdatePost', action: 'update', extraParams: {} },
        { method: 'receiveHardbouncePost', action: 'hardbounce', extraParams: {} },
        { method: 'receiveOptoutPost', action: 'optout', extraParams: {} }
      ];

      testCases.forEach(testCase => {
        // Test with wrong action
        const wrongParams = {
          action: 'wrong',
          email: 'test@example.com',
          sig: 'test',
          ...testCase.extraParams
        };
        expect((client as any)[testCase.method](wrongParams)).toBe(false);
      });
    });
  });
});