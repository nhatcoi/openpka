import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface PayloadKeyValueDisplayProps {
  payload: Record<string, any>;
}

export const PayloadKeyValueDisplay: React.FC<PayloadKeyValueDisplayProps> = ({ payload }) => {
  if (!payload || typeof payload !== 'object') {
    return (
      <Typography variant="body2" color="text.secondary">
        No payload data available
      </Typography>
    );
  }

  const formatValue = (value: unknown): string => {
    if (typeof value === 'number') {
      // Format numbers with commas for better readability
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const formatKey = (key: string): string => {
    // Convert snake_case to Title Case
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const entries = Object.entries(payload);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data available
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
              Field
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
              Value
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(([key, value], index) => (
            <TableRow key={index}>
              <TableCell sx={{ fontWeight: 'medium' }}>
                {formatKey(key)}
              </TableCell>
              <TableCell>
                {formatValue(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
