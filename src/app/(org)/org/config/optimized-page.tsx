'use client';

import React, { useState } from 'react';
import { useOrgConfig } from '@/contexts/OrgConfigContext';
// ... other imports

export default function OptimizedConfigPage() {
  const {
    types,
    statuses,
    loading,
    error,
    addType,
    updateType,
    removeType,
    addStatus,
    updateStatus,
    removeStatus,
  } = useOrgConfig();

  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  // ... rest of component logic

  const handleSave = async () => {
    try {
      // ... save logic
      
      // Update cache immediately (optimistic update)
      if (activeTab === 0) {
        addType(newType); // Update cache instantly
      } else {
        addStatus(newStatus); // Update cache instantly
      }
      
      // Refresh from server in background
      await refreshAll();
    } catch (err) {
      // Revert cache on error
      await refreshAll();
    }
  };

  // ... rest of component
}
