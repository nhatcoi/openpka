'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/use-org-units';

interface OrgTreeNodeProps {
  unit: OrgUnit;
  level: number;
}

export function OrgTreeNode({ unit, level }: OrgTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = unit.children && unit.children.length > 0;
  const employeeCount = unit.employees?.length || 0;

  const toggleExpanded = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#2e4c92';
      case 'inactive':
        return '#ff8c00';
      case 'pending':
        return '#ff8c00';
      default:
        return '#666666';
    }
  };

  const getTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'department':
        return '#2e4c92';
      case 'division':
        return '#2e4c92';
      case 'team':
        return '#ff8c00';
      case 'branch':
        return '#ff8c00';
      default:
        return '#666666';
    }
  };

  return (
    <Paper elevation={1} sx={{ mb: 1, ml: level * 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          cursor: hasChildren ? 'pointer' : 'default',
          '&:hover': hasChildren ? { backgroundColor: 'rgba(46, 76, 146, 0.04)' } : {},
        }}
        onClick={toggleExpanded}
      >
        {/* Expand/Collapse Icon */}
        <Box sx={{ width: 24, display: 'flex', justifyContent: 'center', mr: 2 }}>
          {hasChildren ? (
            expanded ? <ExpandMoreIcon color="primary" /> : <ChevronRightIcon color="primary" />
          ) : (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'grey.400' }} />
          )}
        </Box>

        {/* Unit Icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            backgroundColor: 'rgba(46, 76, 146, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          <BusinessIcon sx={{ color: '#2e4c92', fontSize: 20 }} />
        </Box>

        {/* Unit Info */}
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {unit.name}
            </Typography>
            <Chip
              label={unit.code}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Stack>
          
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {unit.type && (
              <Chip
                label={unit.type}
                size="small"
                sx={{ 
                  backgroundColor: getTypeColor(unit.type),
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}
            
            {unit.status && (
              <Chip
                label={unit.status}
                size="small"
                sx={{ 
                  backgroundColor: getStatusColor(unit.status),
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}
            
            {employeeCount > 0 && (
              <Chip
                icon={<PeopleIcon />}
                label={employeeCount}
                size="small"
                sx={{ 
                  backgroundColor: '#ff8c00',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Stack>
        </Box>
      </Box>

      {/* Children */}
      {expanded && hasChildren && (
        <Box sx={{ ml: 2 }}>
          {unit.children!.map((child) => (
            <OrgTreeNode key={child.id} unit={child} level={level + 1} />
          ))}
        </Box>
      )}
    </Paper>
  );
}