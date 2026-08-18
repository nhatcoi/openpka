import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Role, Permission, RolePermission, UserRole } from '../types';
import { API_ROUTES } from '@/constants/routes';

// ROLES
export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['hr', 'roles'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.ROLES);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch roles');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Role, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.ROLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create role');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Role> }) => {
      const response = await fetch(API_ROUTES.HR.ROLES_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update role');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.ROLES_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete role');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'roles'] });
    },
  });
}

// PERMISSIONS
export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ['hr', 'permissions'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.PERMISSIONS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch permissions');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Permission, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.PERMISSIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create permission');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'permissions'] });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Permission> }) => {
      const response = await fetch(API_ROUTES.HR.PERMISSIONS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update permission');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'permissions'] });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.PERMISSIONS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete permission');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'permissions'] });
    },
  });
}

// ROLE PERMISSIONS
export function useRolePermissions() {
  return useQuery<RolePermission[]>({
    queryKey: ['hr', 'role-permissions'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.ROLE_PERMISSIONS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch role permissions');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { role_id: string; permission_id: string }) => {
      const response = await fetch(API_ROUTES.HR.ROLE_PERMISSIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create role permission');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'role-permissions'] });
    },
  });
}

export function useDeleteRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.ROLE_PERMISSIONS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete role permission');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'role-permissions'] });
    },
  });
}

// USER ROLES
export function useUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ['hr', 'user-roles'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.USER_ROLES);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch user roles');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { user_id: string; role_id: string }) => {
      const response = await fetch(API_ROUTES.HR.USER_ROLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create user role');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-roles'] });
    },
  });
}

export function useDeleteUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.USER_ROLES_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete user role');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-roles'] });
    },
  });
}

// USERS
export function useUsers() {
  return useQuery<any[]>({
    queryKey: ['hr', 'users'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.USERS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

