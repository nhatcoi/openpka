'use client';

import { useState } from 'react';
import { AcademicHistoryFilters } from '@/hooks/use-academic-history';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { X } from 'lucide-react';

interface AcademicHistoryFiltersProps {
  filters: AcademicHistoryFilters;
  onFiltersChange: (filters: AcademicHistoryFilters) => void;
}

const ENTITY_TYPES = [
  'major',
  'program',
  'course',
  'curriculum',
  'student',
  'instructor',
  'org_unit',
];

const ACTIONS = [
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'submit',
  'publish',
  'archive',
];

export function AcademicHistoryFilters({
  filters,
  onFiltersChange,
}: AcademicHistoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AcademicHistoryFilters>(filters);

  const handleFilterChange = (key: keyof AcademicHistoryFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };


  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters: AcademicHistoryFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card>
        <CardHeader>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filters</Typography>
            {hasActiveFilters && (
              <IconButton
                size="small"
                onClick={clearFilters}
                color="inherit"
              >
                <X size={16} />
              </IconButton>
            )}
          </Box>
        </CardHeader>
        <CardContent>
          <Stack spacing={3}>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
              {/* Entity Type Filter */}
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={localFilters.entity_type || ''}
                  label="Entity Type"
                  onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {ENTITY_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Entity ID Filter */}
              <TextField
                label="Entity ID"
                size="small"
                placeholder="Enter entity ID"
                value={localFilters.entity_id || ''}
                onChange={(e) => handleFilterChange('entity_id', e.target.value)}
                fullWidth
              />

              {/* Action Filter */}
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={localFilters.action || ''}
                  label="Action"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {ACTIONS.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Actor ID Filter */}
              <TextField
                label="Actor ID"
                size="small"
                placeholder="Enter actor ID"
                value={localFilters.actor_id || ''}
                onChange={(e) => handleFilterChange('actor_id', e.target.value)}
                fullWidth
              />

              {/* Start Date Filter */}
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={localFilters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              {/* End Date Filter */}
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={localFilters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" gap={1} pt={2} borderTop={1} borderColor="divider">
              <Button variant="outlined" onClick={clearFilters}>
                Clear
              </Button>
              <Button variant="contained" onClick={applyFilters}>
                Apply Filters
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
  );
}