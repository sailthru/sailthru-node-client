import { describe, it, expect } from 'vitest';
import { createSailthruClient } from '../src/index';

describe('New API Methods', () => {
  const client = createSailthruClient('test-key', 'test-secret');
  client.disableLogging();

  describe('List Methods', () => {
    it('should have getList method', () => {
      expect(typeof client.getList).toBe('function');
    });

    it('should handle getList with options callback overload', () => {
      // Test that the method exists and can handle callback-only call
      expect(() => {
        (client as any).getList('test-list', () => {});
      }).not.toThrow();
    });

    it('should handle getList with options and callback', () => {
      expect(() => {
        (client as any).getList('test-list', { format: 'json' }, () => {});
      }).not.toThrow();
    });

    it('should have saveList method', () => {
      expect(typeof client.saveList).toBe('function');
    });

    it('should handle saveList with array of emails', () => {
      expect(() => {
        (client as any).saveList('test-list', ['email1@test.com', 'email2@test.com'], () => {});
      }).not.toThrow();
    });
  });

  describe('Alert Methods', () => {
    it('should have getAlert method', () => {
      expect(typeof client.getAlert).toBe('function');
    });

    it('should handle getAlert call', () => {
      expect(() => {
        (client as any).getAlert('test@example.com', () => {});
      }).not.toThrow();
    });

    it('should have saveAlert method', () => {
      expect(typeof client.saveAlert).toBe('function');
    });

    it('should handle saveAlert with minimal parameters', () => {
      expect(() => {
        (client as any).saveAlert('test@example.com', 'daily', 'template-name', () => {});
      }).not.toThrow();
    });

    it('should handle saveAlert with when parameter', () => {
      expect(() => {
        (client as any).saveAlert('test@example.com', 'daily', 'template-name', 'morning', () => {});
      }).not.toThrow();
    });

    it('should handle saveAlert with options', () => {
      expect(() => {
        (client as any).saveAlert('test@example.com', 'daily', 'template-name', 'morning', { vars: {} }, () => {});
      }).not.toThrow();
    });

    it('should have deleteAlert method', () => {
      expect(typeof client.deleteAlert).toBe('function');
    });

    it('should handle deleteAlert call', () => {
      expect(() => {
        (client as any).deleteAlert('test@example.com', 'alert123', () => {});
      }).not.toThrow();
    });
  });

  describe('Import Contacts Method', () => {
    it('should have importContacts method', () => {
      expect(typeof client.importContacts).toBe('function');
    });

    it('should handle importContacts with minimal parameters', () => {
      expect(() => {
        (client as any).importContacts('user@gmail.com', 'password', () => {});
      }).not.toThrow();
    });

    it('should handle importContacts with include_name parameter', () => {
      expect(() => {
        (client as any).importContacts('user@gmail.com', 'password', true, () => {});
      }).not.toThrow();
    });

    it('should handle importContacts callback overload', () => {
      expect(() => {
        (client as any).importContacts('user@gmail.com', 'password', false, () => {});
      }).not.toThrow();
    });
  });

  describe('Method Availability', () => {
    it('should have all new API methods available', () => {
      const newMethods = [
        'getList',
        'saveList', 
        'getAlert',
        'saveAlert',
        'deleteAlert',
        'importContacts'
      ];

      newMethods.forEach(method => {
        expect(typeof (client as any)[method]).toBe('function');
      });
    });

    it('should maintain existing methods', () => {
      const existingMethods = [
        'getLists',
        'deleteList',
        'apiGet',
        'apiPost',
        'send',
        'multiSend'
      ];

      existingMethods.forEach(method => {
        expect(typeof (client as any)[method]).toBe('function');
      });
    });
  });

  describe('Parameter Handling', () => {
    it('should handle overloaded parameters correctly', () => {
      // Test that methods don't throw with various parameter combinations
      const testMethods = [
        () => (client as any).getList('test', () => {}),
        () => (client as any).getList('test', {}, () => {}),
        () => (client as any).saveAlert('email', 'type', 'template', () => {}),
        () => (client as any).saveAlert('email', 'type', 'template', 'when', () => {}),
        () => (client as any).importContacts('email', 'pass', () => {}),
        () => (client as any).importContacts('email', 'pass', true, () => {})
      ];

      testMethods.forEach((testMethod, index) => {
        expect(testMethod).not.toThrow();
      });
    });
  });
});