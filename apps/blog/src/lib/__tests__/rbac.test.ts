import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc } from 'firebase/firestore';
import {
  hasPermission,
  getAllPermissions,
  isRoleHigherOrEqual,
  getRoleLabel,
  getRoleBadgeColor,
  canPerformAction,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  type Permission,
} from '@/lib/rbac';
import { mockFirestoreDoc } from '@/test/firestore-helpers';

describe('RBAC', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // -----------------------------------------------------------------------
  // ROLE_PERMISSIONS completeness
  // -----------------------------------------------------------------------
  describe('ROLE_PERMISSIONS', () => {
    it('defines permissions for all four roles', () => {
      expect(Object.keys(ROLE_PERMISSIONS)).toEqual(
        expect.arrayContaining(['owner', 'admin', 'editor', 'viewer']),
      );
      expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(4);
    });

    it('owner has all 11 permissions', () => {
      expect(ROLE_PERMISSIONS.owner).toHaveLength(11);
    });

    it('admin has all permissions except manage_billing', () => {
      expect(ROLE_PERMISSIONS.admin).not.toContain('manage_billing');
      expect(ROLE_PERMISSIONS.admin).toHaveLength(10);
    });

    it('editor has read, write, view_analytics, export_data', () => {
      expect(ROLE_PERMISSIONS.editor).toEqual(
        expect.arrayContaining(['read', 'write', 'view_analytics', 'export_data']),
      );
      expect(ROLE_PERMISSIONS.editor).toHaveLength(4);
    });

    it('viewer has read and view_analytics only', () => {
      expect(ROLE_PERMISSIONS.viewer).toEqual(['read', 'view_analytics']);
    });
  });

  // -----------------------------------------------------------------------
  // hasPermission
  // -----------------------------------------------------------------------
  describe('hasPermission', () => {
    it('owner has every permission', () => {
      const all: Permission[] = [
        'read', 'write', 'delete', 'manage_members', 'manage_settings',
        'manage_theme', 'manage_billing', 'manage_experiments',
        'manage_integrations', 'view_analytics', 'export_data',
      ];
      for (const perm of all) {
        expect(hasPermission('owner', perm)).toBe(true);
      }
    });

    it('viewer cannot write', () => {
      expect(hasPermission('viewer', 'write')).toBe(false);
    });

    it('editor cannot delete', () => {
      expect(hasPermission('editor', 'delete')).toBe(false);
    });

    it('admin cannot manage_billing', () => {
      expect(hasPermission('admin', 'manage_billing')).toBe(false);
    });

    it('editor can read', () => {
      expect(hasPermission('editor', 'read')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getAllPermissions
  // -----------------------------------------------------------------------
  describe('getAllPermissions', () => {
    it('returns a copy, not the original array', () => {
      const perms = getAllPermissions('owner');
      perms.push('read'); // mutate
      expect(ROLE_PERMISSIONS.owner).toHaveLength(11); // original unchanged
    });

    it('returns correct permissions for viewer', () => {
      expect(getAllPermissions('viewer')).toEqual(['read', 'view_analytics']);
    });
  });

  // -----------------------------------------------------------------------
  // isRoleHigherOrEqual
  // -----------------------------------------------------------------------
  describe('isRoleHigherOrEqual', () => {
    it('owner >= every role', () => {
      for (const role of ROLE_HIERARCHY) {
        expect(isRoleHigherOrEqual('owner', role)).toBe(true);
      }
    });

    it('viewer is not >= editor', () => {
      expect(isRoleHigherOrEqual('viewer', 'editor')).toBe(false);
    });

    it('same role is equal', () => {
      expect(isRoleHigherOrEqual('admin', 'admin')).toBe(true);
    });

    it('admin >= editor', () => {
      expect(isRoleHigherOrEqual('admin', 'editor')).toBe(true);
    });

    it('editor is not >= admin', () => {
      expect(isRoleHigherOrEqual('editor', 'admin')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Display helpers
  // -----------------------------------------------------------------------
  describe('getRoleLabel', () => {
    it('returns capitalized labels', () => {
      expect(getRoleLabel('owner')).toBe('Owner');
      expect(getRoleLabel('admin')).toBe('Admin');
      expect(getRoleLabel('editor')).toBe('Editor');
      expect(getRoleLabel('viewer')).toBe('Viewer');
    });
  });

  describe('getRoleBadgeColor', () => {
    it('returns a non-empty string for every role', () => {
      for (const role of ROLE_HIERARCHY) {
        expect(getRoleBadgeColor(role).length).toBeGreaterThan(0);
      }
    });
  });

  // -----------------------------------------------------------------------
  // canPerformAction (Firestore-dependent)
  // -----------------------------------------------------------------------
  describe('canPerformAction', () => {
    it('returns true when member has the required permission', async () => {
      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue(
        mockFirestoreDoc({ userId: 'user1', role: 'owner', joinedAt: '2026-01-01' }) as never,
      );

      const result = await canPerformAction('user1', 'ws1', 'manage_billing');
      expect(result).toBe(true);
    });

    it('returns false when member lacks the permission', async () => {
      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue(
        mockFirestoreDoc({ userId: 'user1', role: 'viewer', joinedAt: '2026-01-01' }) as never,
      );

      const result = await canPerformAction('user1', 'ws1', 'write');
      expect(result).toBe(false);
    });

    it('returns false when member document does not exist', async () => {
      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue(mockFirestoreDoc(null) as never);

      const result = await canPerformAction('user1', 'ws1', 'read');
      expect(result).toBe(false);
    });

    it('returns false when Firestore throws', async () => {
      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockRejectedValue(new Error('network failure'));

      const result = await canPerformAction('user1', 'ws1', 'read');
      expect(result).toBe(false);
    });
  });
});
