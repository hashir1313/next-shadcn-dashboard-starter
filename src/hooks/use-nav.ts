'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC
 *
 * Uses Better Auth's session and organization client hooks for filtering.
 * This is for UX visibility only — actual security checks happen server-side.
 */

import { useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import type { NavItem, NavGroup } from '@/types';

/**
 * Hook to filter navigation items based on RBAC (fully client-side)
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const session = sessionData?.session;

  // Memoize context
  const accessContext = useMemo(() => {
    return {
      user: user ?? undefined,
      hasSession: !!session,
      // Organization checks would go here if using the org plugin
      hasOrg: false, // Placeholder — implement when org plugin is active
      permissions: [] as string[],
      role: undefined as string | undefined
    };
  }, [user?.id, session?.id]);

  // Filter items synchronously (all client-side)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // No access restrictions
        if (!item.access) {
          return true;
        }

        // Check requireOrg
        if (item.access.requireOrg && !accessContext.hasOrg) {
          return false;
        }

        // Check permission
        if (item.access.permission) {
          if (!accessContext.hasOrg) {
            return false;
          }
          if (!accessContext.permissions.includes(item.access.permission)) {
            return false;
          }
        }

        // Check role
        if (item.access.role) {
          if (!accessContext.hasOrg) {
            return false;
          }
          if (accessContext.role !== item.access.role) {
            return false;
          }
        }

        // Plan/feature checks require server-side verification
        if (item.access.plan || item.access.feature) {
          // Show it — page-level protection handles it
        }

        return true;
      })
      .map((item) => {
        // Recursively filter child items
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            if (!childItem.access) return true;
            if (childItem.access.requireOrg && !accessContext.hasOrg) return false;
            if (childItem.access.permission) {
              if (!accessContext.hasOrg) return false;
              if (!accessContext.permissions.includes(childItem.access.permission)) return false;
            }
            if (childItem.access.role) {
              if (!accessContext.hasOrg) return false;
              if (accessContext.role !== childItem.access.role) return false;
            }
            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, accessContext]);

  return filteredItems;
}

/**
 * Hook to filter navigation groups based on RBAC (fully client-side)
 *
 * @param groups - Array of navigation groups to filter
 * @returns Filtered groups (empty groups are removed)
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
