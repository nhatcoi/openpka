'use client';

import { useState } from 'react';
import { AcademicHistoryEntry, AcademicHistoryPagination } from '@/hooks/use-academic-history';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Pagination,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Eye as EyeIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AcademicHistoryTableProps {
  data: AcademicHistoryEntry[];
  loading: boolean;
  pagination: AcademicHistoryPagination;
  onPageChange: (page: number) => void;
}

export function AcademicHistoryTable({
  data,
  loading,
  pagination,
  onPageChange,
}: AcademicHistoryTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<AcademicHistoryEntry | null>(null);
  const [open, setOpen] = useState(false);

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'approve':
        return 'success';
      case 'reject':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatValue = (value: string | null | undefined) => {
    if (!value) return '-';
    if (value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('vi-VN'),
        time: date.toLocaleTimeString('vi-VN'),
        relative: formatDistanceToNow(date, { addSuffix: true }),
      };
    } catch {
      return {
        date: '-',
        time: '-',
        relative: '-',
      };
    }
  };

  const handleViewDetails = (entry: AcademicHistoryEntry) => {
    setSelectedEntry(entry);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEntry(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          No academic history entries found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Entity</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Field</TableCell>
              <TableCell>Changes</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell width={50}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((entry) => {
              const dateInfo = formatDateTime(entry.created_at);
              
              return (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {entry.entity_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {entry.entity_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.action}
                      color={getActionBadgeColor(entry.action) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.field_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box maxWidth={200}>
                      {entry.old_value && (
                        <Typography variant="caption" color="error.main" display="block">
                          <strong>From:</strong> {formatValue(entry.old_value)}
                        </Typography>
                      )}
                      {entry.new_value && (
                        <Typography variant="caption" color="success.main" display="block">
                          <strong>To:</strong> {formatValue(entry.new_value)}
                        </Typography>
                      )}
                      {entry.change_summary && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          {formatValue(entry.change_summary)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {entry.actor_name || '-'}
                      </Typography>
                      {entry.actor_id && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {entry.actor_id}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{dateInfo.date}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {dateInfo.time}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {dateInfo.relative}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(entry)}
                      >
                        <EyeIcon size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Page {pagination.page} of {pagination.totalPages}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeft size={16} />}
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRight size={16} />}
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </Stack>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Academic History Details</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Entity Type
                      </Typography>
                      <Typography variant="body1">
                        {selectedEntry.entity_type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Entity ID
                      </Typography>
                      <Typography variant="body1">
                        {selectedEntry.entity_id}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Action
                      </Typography>
                      <Typography variant="body1">
                        {selectedEntry.action}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Field Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedEntry.field_name || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {selectedEntry.old_value && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Old Value
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                        >
                          {selectedEntry.old_value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {selectedEntry.new_value && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      New Value
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                        >
                          {selectedEntry.new_value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {selectedEntry.change_summary && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Change Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEntry.change_summary}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Actor
                      </Typography>
                      <Typography variant="body1">
                        {selectedEntry.actor_name || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(selectedEntry.created_at).date} at{' '}
                        {formatDateTime(selectedEntry.created_at).time}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {selectedEntry.metadata && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Metadata
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                        >
                          {JSON.stringify(selectedEntry.metadata, null, 2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}