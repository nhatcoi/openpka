'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Assignment as MonitorIcon,
  Pause as SuspendIcon,
  Stop as InactiveIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  DateRange as DateIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { AlertMessage, createSuccessAlert, createErrorAlert, closeAlert } from '@/utils/alert-utils';

// Types
interface OrgUnit {
  id: string;
  name: string;
  code: string;
  type: string | null;
  status: string | null;
  description: string | null;
  campus_id: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  effective_from: string | null;
  effective_to: string | null;
  planned_establishment_date: string | null;
}

interface OrgUnitHistory {
  id: string;
  org_unit_id: string;
  old_name: string | null;
  new_name: string | null;
  change_type: string;
  details: { [key: string]: unknown };
  changed_at: string;
  changed_by: string | null;
}

interface AuditResponse {
  items: OrgUnit[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  statusCounts: Array<{ status: string; count: number }>;
}

interface HistoryResponse {
  items: OrgUnitHistory[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động', color: 'success' },
  { value: 'approved', label: 'Đã phê duyệt', color: 'success' },
  { value: 'draft', label: 'Nháp', color: 'warning' },
  { value: 'rejected', label: 'Từ chối', color: 'error' },
  { value: 'suspended', label: 'Tạm ngừng', color: 'warning' },
  { value: 'inactive', label: 'Ngừng hoạt động', color: 'error' },
  { value: 'archived', label: 'Lưu trữ', color: 'secondary' },
];

const CHANGE_TYPE_OPTIONS = [
  { value: 'created', label: 'Tạo mới', color: 'primary' },
  { value: 'updated', label: 'Cập nhật', color: 'info' },
  { value: 'status_change', label: 'Thay đổi trạng thái', color: 'warning' },
  { value: 'deleted', label: 'Xóa', color: 'error' },
  { value: 'activated', label: 'Kích hoạt', color: 'success' },
  { value: 'suspended', label: 'Tạm ngừng', color: 'warning' },
];

export default function CreateAuditPage() {
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [alert, setAlert] = useState<AlertMessage>(closeAlert());
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
    size: 50,
    sort: 'created_at',
    order: 'desc' as 'asc' | 'desc',
  });

  // State for audit data
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for history data
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch audit data
  const fetchAuditData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.size) queryParams.append('size', filters.size.toString());
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.order) queryParams.append('order', filters.order);

      const response = await fetch(`/api/org/units/audit?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAuditData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch audit data');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch audit data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unit history
  const fetchUnitHistory = async (unitId: string) => {
    if (!unitId) return;
    
    try {
      setHistoryLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('size', '100');
      queryParams.append('sort', 'changed_at');
      queryParams.append('order', 'desc');

      const response = await fetch(`/api/org/units/${unitId}/history?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch unit history');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setHistoryData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch unit history');
      }
    } catch (err) {
      console.error('Error fetching unit history:', err);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load data on component mount and when filters change
  React.useEffect(() => {
    fetchAuditData();
  }, [filters.status, filters.type, filters.page, filters.size, filters.sort, filters.order]);

  const handleOpenStatusDialog = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setNewStatus('');
    setStatusReason('');
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedUnit(null);
    setNewStatus('');
    setStatusReason('');
  };

  const handleOpenHistoryDialog = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOpenHistoryDialog(true);
    fetchUnitHistory(unit.id);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedUnit(null);
  };

  const handleNavigateToUnit = (unitId: string) => {
    if (unitId) {
      router.push(`/org/unit/${unitId}`);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedUnit || !newStatus || !statusReason) {
      setAlert(createErrorAlert('Please select a new status and provide a reason'));
      return;
    }

    try {
      // Update unit status
      const response = await fetch(`/api/org/units/${selectedUnit.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update unit status');
      }

      // Create history record
      await fetch(API_ROUTES.ORG.HISTORY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_unit_id: selectedUnit.id,
          change_type: 'status_change',
          details: {
            old_status: selectedUnit.status,
            new_status: newStatus,
            reason: statusReason,
            changed_by: '1' // TODO: Get from session/context
          }
        })
      });

      setAlert(createSuccessAlert(`Unit status changed to "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"!`));
      handleCloseStatusDialog();
      fetchAuditData();
      
    } catch (error) {
      console.error('Error changing status:', error);
      setAlert(createErrorAlert(`Error changing status: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.label || status;
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'created': return <BusinessIcon />;
      case 'updated': return <EditIcon />;
      case 'status_change': return <MonitorIcon />;
      case 'activated': return <MonitorIcon />;
      case 'suspended': return <SuspendIcon />;
      case 'deleted': return <DeleteIcon />;
      default: return <HistoryIcon />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'created': return 'primary';
      case 'updated': return 'info';
      case 'status_change': return 'warning';
      case 'activated': return 'success';
      case 'suspended': return 'warning';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const typeOption = CHANGE_TYPE_OPTIONS.find(t => t.value === type);
    return typeOption?.label || type;
  };

  const formatDetails = (details: { [key: string]: unknown }) => {
    if (!details) return 'No details available';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      return Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(', ');
    }
    return String(details);
  };

  const units = auditData?.items || [];
  const statusCounts = auditData?.statusCounts || [];
  
  // Convert array to object for easier access
  const statusCountsMap = statusCounts.reduce((acc, item) => {
    acc[item.status.toLowerCase()] = item.count;
    return acc;
  }, {} as Record<string, number>);

  console.log('auditData:', auditData);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Theo dõi & Biến đổi (Audit/History)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Quản lý trạng thái và lịch sử</AlertTitle>
        Theo dõi và quản lý trạng thái hoạt động của các đơn vị trong hệ thống.
      </Alert>

      {/* Alert Messages */}
      {alert.open && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(closeAlert())}
        >
          <AlertTitle>{alert.title}</AlertTitle>
          {alert.message}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="FACULTY">Faculty</MenuItem>
              <MenuItem value="DEPARTMENT">Department</MenuItem>
              <MenuItem value="OFFICE">Office</MenuItem>
              <MenuItem value="CENTER">Center</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Header với thống kê */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="success.main">
              {statusCountsMap.active || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đang hoạt động
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {statusCountsMap.approved || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đã phê duyệt
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {statusCountsMap.rejected || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Từ chối
              </Typography>
            </CardContent>
          </Card>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" color="secondary.main">
              {statusCountsMap.draft || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nháp
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Danh sách đơn vị theo dõi ({units.length})
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'black' }}>Unit Name</TableCell>
              <TableCell sx={{ color: 'black' }}>Type</TableCell>
              <TableCell sx={{ color: 'black' }}>Status</TableCell>
              <TableCell sx={{ color: 'black' }}>Created</TableCell>
              <TableCell sx={{ color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Loading...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No units found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{ 
                        color: 'primary.main', 
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleNavigateToUnit(unit.id)}
                    >
                      {unit.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {unit.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={unit.type || 'N/A'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(unit.status || 'unknown')} 
                      size="small" 
                      color={getStatusColor(unit.status || 'unknown') as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {unit.created_at ? new Date(unit.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleNavigateToUnit(unit.id)}
                        title="View Unit"
                      >
                        <ViewIcon />
                      </IconButton>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={() => handleOpenHistoryDialog(unit)}
                      >
                        History
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<MonitorIcon />}
                        onClick={() => handleOpenStatusDialog(unit)}
                      >
                        Change Status
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Change Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Thay đổi trạng thái: {selectedUnit?.name}
        </DialogTitle>
        <DialogContent>
          {selectedUnit && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin đơn vị
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText primary="Tên đơn vị" secondary={selectedUnit.name} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText primary="Mã code" secondary={selectedUnit.code} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText primary="Loại" secondary={selectedUnit.type || 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><DateIcon /></ListItemIcon>
                      <ListItemText primary="Ngày tạo" secondary={new Date(selectedUnit.created_at).toLocaleDateString('vi-VN')} />
                    </ListItem>
                  </List>
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thay đổi trạng thái
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Trạng thái mới</InputLabel>
                    <Select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      label="Trạng thái mới"
                    >
                      {STATUS_OPTIONS.filter(status => status.value !== selectedUnit.status).map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={status.label} 
                              size="small" 
                              color={status.color as string}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Lý do thay đổi"
                    multiline
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Nhập lý do thay đổi trạng thái đơn vị..."
                  />
                </Paper>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <AlertTitle>Lưu ý quan trọng</AlertTitle>
                Việc thay đổi trạng thái đơn vị sẽ ảnh hưởng đến:
                <ul>
                  <li>Quyền truy cập hệ thống của nhân viên</li>
                  <li>Khả năng đăng ký sinh viên</li>
                  <li>Phân công giảng viên</li>
                  <li>Báo cáo và thống kê</li>
                </ul>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangeStatus}
            disabled={!newStatus || !statusReason}
          >
            Change Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={handleCloseHistoryDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Lịch sử thay đổi: {selectedUnit?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUnit && (
            <Box sx={{ mt: 2 }}>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {historyData?.items?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No history records found
                    </Typography>
                  ) : (
                    historyData?.items?.map((event: OrgUnitHistory, index: number) => (
                      <ListItem 
                        key={index} 
                        sx={{ 
                          borderLeft: `4px solid`, 
                          borderLeftColor: getActionColor(event.change_type) + '.main',
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: 'grey.50'
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: getActionColor(event.change_type) + '.main' }}>
                            {getActionIcon(event.change_type)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="h6" component="span">
                                {getChangeTypeLabel(event.change_type)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {new Date(event.changed_at).toLocaleDateString('vi-VN')} - {event.changed_by || 'System'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {formatDetails(event.details)}
                              </Typography>
                              {event.old_name && event.new_name && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                  {event.old_name} → {event.new_name}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}