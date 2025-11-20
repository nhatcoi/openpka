'use client';

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

export interface TreeNodeProps {
  id: string | number;
  name: string;
  code: string;
  type?: string | null;
  status?: string | null;
  employeeCount?: number;
  children?: TreeNodeProps[];
  level?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  code,
  type,
  status,
  employeeCount = 0,
  children = [],
  level = 0,
}) => {
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

  const hasChildren = children && children.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Node Container */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          minWidth: 200,
          maxWidth: 250,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '2px solid #e0e0e0',
          borderRadius: 2,
          '&:hover': {
            borderColor: '#2e4c92',
            boxShadow: '0 4px 12px rgba(46, 76, 146, 0.15)',
          },
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 48,
            height: 48,
            backgroundColor: '#2e4c92',
            margin: '0 auto 12px',
          }}
        >
          <BusinessIcon />
        </Avatar>

        {/* Node Name */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: '#2e4c92',
            marginBottom: 1,
            fontSize: '0.9rem',
            lineHeight: 1.2,
          }}
        >
          {name}
        </Typography>

        {/* Code */}
        <Chip
          label={code}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.7rem',
            marginBottom: 1,
            borderColor: '#2e4c92',
            color: '#2e4c92',
          }}
        />

        {/* Status and Type Chips */}
        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" sx={{ mb: 1 }}>
          {type && (
            <Chip
              label={type}
              size="small"
              sx={{
                backgroundColor: getTypeColor(type),
                color: 'white',
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          )}
          
          {status && (
            <Chip
              label={status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(status),
                color: 'white',
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          )}
        </Stack>

        {/* Employee Count */}
        {employeeCount > 0 && (
          <Chip
            icon={<PeopleIcon sx={{ fontSize: '0.8rem' }} />}
            label={employeeCount}
            size="small"
            sx={{
              backgroundColor: '#ff8c00',
              color: 'white',
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}
      </Paper>

      {/* Connection Line to Children */}
      {hasChildren && (
        <Box
          sx={{
            width: '2px',
            height: '30px',
            backgroundColor: '#2e4c92',
            marginTop: 1,
            marginBottom: 1,
          }}
        />
      )}

      {/* Children */}
      {hasChildren && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 2,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: children.length > 1 ? '100%' : '0px',
              height: '2px',
              backgroundColor: '#2e4c92',
            },
          }}
        >
          {children.map((child) => (
            <Box
              key={child.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  backgroundColor: '#2e4c92',
                },
              }}
            >
              <TreeNode
                {...child}
                level={level + 1}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TreeNode;
