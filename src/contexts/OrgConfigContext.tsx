'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';

interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

interface OrgConfigContextType {
  types: OrgUnitType[];
  statuses: OrgUnitStatus[];
  loading: boolean;
  error: string | null;
  refreshTypes: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addType: (type: OrgUnitType) => void;
  updateType: (id: string, type: OrgUnitType) => void;
  removeType: (id: string) => void;
  addStatus: (status: OrgUnitStatus) => void;
  updateStatus: (id: string, status: OrgUnitStatus) => void;
  removeStatus: (id: string) => void;
}

const OrgConfigContext = createContext<OrgConfigContextType | undefined>(undefined);

export const useOrgConfig = () => {
  const context = useContext(OrgConfigContext);
  if (!context) {
    throw new Error('useOrgConfig must be used within an OrgConfigProvider');
  }
  return context;
};

interface OrgConfigProviderProps {
  children: ReactNode;
}

export const OrgConfigProvider: React.FC<OrgConfigProviderProps> = ({ children }) => {
  const [types, setTypes] = useState<OrgUnitType[]>([]);
  const [statuses, setStatuses] = useState<OrgUnitStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    try {
      const response = await fetch(buildUrl(API_ROUTES.ORG.TYPES, { include_inactive: true }));
      const result = await response.json();
      if (result.success) {
        setTypes(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch types');
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(buildUrl(API_ROUTES.ORG.STATUSES, { include_inactive: true }));
      const result = await response.json();
      if (result.success) {
        setStatuses(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch statuses');
    }
  };

  const refreshTypes = async () => {
    setLoading(true);
    setError(null);
    await fetchTypes();
    setLoading(false);
  };

  const refreshStatuses = async () => {
    setLoading(true);
    setError(null);
    await fetchStatuses();
    setLoading(false);
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchTypes(), fetchStatuses()]);
    setLoading(false);
  };

  // Cache management functions
  const addType = (type: OrgUnitType) => {
    setTypes(prev => [...prev, type]);
  };

  const updateType = (id: string, updatedType: OrgUnitType) => {
    setTypes(prev => prev.map(type => type.id === id ? updatedType : type));
  };

  const removeType = (id: string) => {
    setTypes(prev => prev.filter(type => type.id !== id));
  };

  const addStatus = (status: OrgUnitStatus) => {
    setStatuses(prev => [...prev, status]);
  };

  const updateStatus = (id: string, updatedStatus: OrgUnitStatus) => {
    setStatuses(prev => prev.map(status => status.id === id ? updatedStatus : status));
  };

  const removeStatus = (id: string) => {
    setStatuses(prev => prev.filter(status => status.id !== id));
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  const value: OrgConfigContextType = {
    types,
    statuses,
    loading,
    error,
    refreshTypes,
    refreshStatuses,
    refreshAll,
    addType,
    updateType,
    removeType,
    addStatus,
    updateStatus,
    removeStatus,
  };

  return (
    <OrgConfigContext.Provider value={value}>
      {children}
    </OrgConfigContext.Provider>
  );
};
