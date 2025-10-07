'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import { useEmployeeSearch } from '@/hooks/use-employee-search';
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
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  PlayArrow as ActiveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DateRange as DateIcon,
  CheckCircle as CompleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { AlertMessage, createSuccessAlert, createErrorAlert, closeAlert } from '@/utils/alert-utils';
import { PayloadKeyValueDisplay } from '@/components/PayloadKeyValueDisplay';
import { AttachmentList } from '@/components/AttachmentList';

interface OrgStructureRequest {
  id: string;
  requester_id: string | null;
  request_type: string;
  target_org_unit_id: string | null;
  payload: unknown;
  status: string;
  workflow_step: number;
  created_at: string | null;
  updated_at: string | null;
  owner_org_id?: string | null;
  attachments?: unknown;
}

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
}

const STAFF_ROLES = [
  { value: 'HEAD', label: 'Trưởng đơn vị', description: 'Người đứng đầu đơn vị' },
  { value: 'DEPUTY_HEAD', label: 'Phó đơn vị', description: 'Phó trưởng đơn vị' },
  { value: 'SECRETARY', label: 'Thư ký', description: 'Thư ký đơn vị' },
  { value: 'COORDINATOR', label: 'Điều phối viên', description: 'Điều phối hoạt động' },
];

const ACTIVATION_TASKS = [
  { name: 'Thiết lập quyền truy cập hệ thống', required: true },
  { name: 'Cấu hình phân công giảng viên', required: true },
  { name: 'Thiết lập quản lý chương trình', required: true },
  { name: 'Bổ nhiệm trưởng đơn vị', required: true },
  { name: 'Thiết lập phân quyền', required: true },
  { name: 'Tạo tài khoản hệ thống', required: false },
  { name: 'Cấu hình email và thông báo', required: false },
];

export default function CreateActivatePage() {
  const router = useRouter();
  const { employees, loading: searchLoading, error: searchError, searchEmployees } = useEmployeeSearch();
  const [selectedRequest, setSelectedRequest] = useState<OrgStructureRequest | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [units, setUnits] = useState<Record<string, OrgUnit>>({});
  const [alert, setAlert] = useState<AlertMessage>(closeAlert());
  const [openActivateDialog, setOpenActivateDialog] = useState(false);
  const [activateForm, setActivateForm] = useState({
    activated_by: '', // Kích hoạt bởi
    activation_comment: '', // Nhận xét kích hoạt
    activation_conditions: '', // Điều kiện kích hoạt
    activation_date: '', // Ngày kích hoạt
    activation_priority: 'medium', // Độ ưu tiên
    activation_rating: '', // Đánh giá (1-5)
    activation_risks: '', // Rủi ro
    activation_benefits: '', // Lợi ích
    activation_suggestions: '', // Gợi ý
  });
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>({});
  const [systemConfigs, setSystemConfigs] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<OrgStructureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Fetch approved requests from API
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/org/structure-requests?request_type=approval&status=APPROVED');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const requestsData = data.data.items || [];
        setRequests(requestsData);
        
        // Fetch unit details for each request
        const unitsData: Record<string, OrgUnit> = {};
        for (const request of requestsData) {
          if (request.target_org_unit_id) {
            try {
              const unitResponse = await fetch(API_ROUTES.ORG.UNITS_BY_ID(request.target_org_unit_id));
              if (unitResponse.ok) {
                const unitData = await unitResponse.json();
                if (unitData.success) {
                  unitsData[request.target_org_unit_id] = unitData.data;
                }
              }
            } catch (error) {
              console.error(`Failed to fetch unit ${request.target_org_unit_id}:`, error);
            }
          }
        }
        setUnits(unitsData);
      } else {
        throw new Error(data.error || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch requests'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenActivateDialog = (request: OrgStructureRequest) => {
    setSelectedRequest(request);
    setSelectedUnit(request.target_org_unit_id ? units[request.target_org_unit_id] : null);
    setStaffAssignments({});
    setSystemConfigs({});
    setOpenActivateDialog(true);
  };

  const handleCloseActivateDialog = () => {
    setOpenActivateDialog(false);
    setSelectedRequest(null);
    setSelectedUnit(null);
    // Reset form
    setActivateForm({
      activated_by: '',
      activation_comment: '',
      activation_conditions: '',
      activation_date: '',
      activation_priority: 'medium',
      activation_rating: '',
      activation_risks: '',
      activation_benefits: '',
      activation_suggestions: '',
    });
    setStaffAssignments({});
    setSystemConfigs({});
  };

  const handleNavigateToUnit = (targetOrgUnitId: string) => {
    if (targetOrgUnitId) {
      router.push(`/org/unit/${targetOrgUnitId}`);
    }
  };

  const handleStaffAssignmentChange = (role: string, staffId: string) => {
    setStaffAssignments(prev => ({
      ...prev,
      [role]: staffId,
    }));
  };

  const handleSystemConfigChange = (config: string, enabled: boolean) => {
    setSystemConfigs(prev => ({
      ...prev,
      [config]: enabled,
    }));
  };

  const getCompletedTasksCount = () => {
    return Object.values(systemConfigs).filter(Boolean).length;
  };

  const handleActivate = async () => {
    if (!selectedRequest || !activateForm.activation_comment.trim()) {
      setAlert(createErrorAlert('Please enter activation comments before activating'));
      return;
    }

    try {
      setIsActivating(true);
      
      // 1. Create new activation record
      const activationPayload = {
        request_type: 'activation',
        requester_id: '1', // TODO: Get from session/context
        target_org_unit_id: selectedRequest.target_org_unit_id,
        owner_org_id: selectedRequest.owner_org_id, // Preserve from original request
        attachments: selectedRequest.attachments, // Preserve from original request
        payload: {
          ...activateForm,
          staff_assignments: staffAssignments,
          system_configs: systemConfigs,
          activation_result: 'activated',
          original_request_id: selectedRequest.id
        },
        status: 'ACTIVATED',
        workflow_step: 4
      };

      const activationResponse = await fetch('/api/org/structure-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activationPayload)
      });

      if (!activationResponse.ok) {
        throw new Error('Failed to create activation record');
      }

      // 2. Update original request status
      const updateResponse = await fetch(`/api/org/structure-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVATED'
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update original request');
      }

      // 3. Update target org unit status
      if (selectedRequest.target_org_unit_id) {
        const unitUpdateResponse = await fetch(`/api/org/units/${selectedRequest.target_org_unit_id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'active'
          })
        });

        if (!unitUpdateResponse.ok) {
          throw new Error('Failed to update unit status');
        }
      }

      setAlert(createSuccessAlert('Unit activated successfully!'));
      handleCloseActivateDialog();
      fetchRequests();
      
    } catch (error) {
      console.error('Error activating unit:', error);
      setAlert(createErrorAlert(`Error activating unit: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <ActiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Kích hoạt (Activate)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Kích hoạt đơn vị</AlertTitle>
        Sau khi phê duyệt, đơn vị sẽ được kích hoạt và bổ nhiệm nhân sự phụ trách.
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

      {/* Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Activations: {isLoading ? <CircularProgress size={20} /> : requests.length}
          </Typography>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'black' }}>Request ID</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Name</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Code</TableCell>
              <TableCell sx={{ color: 'black' }}>Type</TableCell>
              <TableCell sx={{ color: 'black' }}>Workflow Step</TableCell>
              <TableCell sx={{ color: 'black' }}>Status</TableCell>
              <TableCell sx={{ color: 'black' }}>Created</TableCell>
              <TableCell sx={{ color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Loading...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No pending activations found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const unit = request.target_org_unit_id ? units[request.target_org_unit_id] : null;
                return (
                  <TableRow key={request.id}>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>
                      {request.target_org_unit_id ? (
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          sx={{ 
                            color: 'primary.main', 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => handleNavigateToUnit(request.target_org_unit_id)}
                        >
                          {unit?.name || request.target_org_unit_id}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={unit?.code || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {unit?.type || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={request.workflow_step?.toString() || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status || 'UNKNOWN'} 
                        color={request.status === 'APPROVED' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ActiveIcon />}
                        onClick={() => handleOpenActivateDialog(request)}
                      >
                        Activate
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Activate Dialog */}
      <Dialog open={openActivateDialog} onClose={handleCloseActivateDialog} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: 'info.main', 
          color: 'info.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6">Activation Process</Typography>
            <Typography variant="body2">Request ID: {selectedRequest?.id} | Status: {selectedRequest?.status} | Step: {selectedRequest?.workflow_step}</Typography>
          </Box>
          <Chip 
            label={selectedRequest?.status || 'UNKNOWN'} 
            color={selectedRequest?.status === 'APPROVED' ? 'success' : 'default'}
            size="small"
          />
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Request Information */}
                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Request Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Request ID" secondary={selectedRequest.id} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary="Requester ID" secondary={selectedRequest.requester_id || 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Target Unit ID" 
                          secondary={
                            selectedRequest.target_org_unit_id ? (
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  color: 'primary.main', 
                                  cursor: 'pointer',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => handleNavigateToUnit(selectedRequest.target_org_unit_id)}
                              >
                                {selectedRequest.target_org_unit_id}
                              </Typography>
                            ) : 'N/A'
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Owner Org ID" secondary={selectedRequest.owner_org_id || 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Status" secondary={selectedRequest.status} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Workflow Step" secondary={selectedRequest.workflow_step} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><DateIcon /></ListItemIcon>
                        <ListItemText primary="Created" secondary={selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'} />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>

                {/* Unit Information */}
                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Unit Information
                    </Typography>
                    {selectedUnit ? (
                      <List dense>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Name" secondary={selectedUnit.name} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Code" secondary={selectedUnit.code} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Type" secondary={selectedUnit.type || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Status" secondary={selectedUnit.status || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Description" secondary={selectedUnit.description || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Campus ID" secondary={selectedUnit.campus_id || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Parent ID" secondary={selectedUnit.parent_id || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><DateIcon /></ListItemIcon>
                          <ListItemText primary="Created At" secondary={new Date(selectedUnit.created_at).toLocaleString()} />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unit information not available
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Box>

              {/* Payload Details */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Approval Details
                </Typography>
                <PayloadKeyValueDisplay payload={selectedRequest.payload || {}} />
              </Paper>

              {/* Attachments */}
              {selectedRequest.attachments && (
                <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Attachments
                  </Typography>
                  <AttachmentList attachments={selectedRequest.attachments} />
                </Paper>
              )}

              {/* Staff Assignment */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Bổ nhiệm nhân sự
                </Typography>
                {searchError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Lỗi tìm kiếm nhân viên</AlertTitle>
                    {searchError}
                  </Alert>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {STAFF_ROLES.map((role) => (
                    <Autocomplete
                      key={role.value}
                      options={employees}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option.User?.full_name || option.User?.email || 'Unknown';
                      }}
                      value={employees.find(emp => emp.id === staffAssignments[role.value]) || null}
                      onChange={(event, newValue) => {
                        handleStaffAssignmentChange(role.value, newValue?.id || '');
                      }}
                      onInputChange={(event, newInputValue) => {
                        if (newInputValue.length >= 2) {
                          searchEmployees(newInputValue);
                        }
                      }}
                      loading={searchLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={role.label}
                          placeholder="Tìm kiếm nhân viên..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.User?.full_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.User?.email} • {option.employee_no}
                            </Typography>
                            {option.OrgAssignment.length > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {option.OrgAssignment[0].OrgUnit?.name} • {option.OrgAssignment[0].JobPosition?.title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      noOptionsText="Không tìm thấy nhân viên"
                      clearOnEscape
                      selectOnFocus
                      handleHomeEndKeys
                    />
                  ))}
                </Box>
              </Paper>

              {/* System Configuration */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Cấu hình hệ thống
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                  {ACTIVATION_TASKS.map((task, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={systemConfigs[task.name] || false}
                        onChange={(e) => handleSystemConfigChange(task.name, e.target.checked)}
                      />
                      <Box>
                        <Typography variant="body2">
                          {task.name}
                          {task.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Progress: {getCompletedTasksCount()}/{ACTIVATION_TASKS.length} tasks completed
                </Typography>
              </Paper>

              {/* Activation Form */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Chi tiết kích hoạt
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Cột 1 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Kích hoạt bởi"
                      value={activateForm.activated_by}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activated_by: e.target.value }))}
                      placeholder="Tên người kích hoạt"
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Đánh giá (1-5)"
                      type="number"
                      inputProps={{ min: 1, max: 5 }}
                      value={activateForm.activation_rating}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activation_rating: e.target.value }))}
                      placeholder="1 = Rất thấp, 5 = Rất cao"
                      variant="outlined"
                    />
                    
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Độ ưu tiên</InputLabel>
                      <Select
                        value={activateForm.activation_priority}
                        onChange={(e) => setActivateForm(prev => ({ ...prev, activation_priority: e.target.value }))}
                        label="Độ ưu tiên"
                      >
                        <MenuItem value="low">Thấp</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="high">Cao</MenuItem>
                        <MenuItem value="urgent">Khẩn cấp</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Ngày kích hoạt"
                      type="date"
                      value={activateForm.activation_date}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activation_date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Cột 2 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Điều kiện kích hoạt"
                      multiline
                      rows={2}
                      value={activateForm.activation_conditions}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activation_conditions: e.target.value }))}
                      placeholder="Các điều kiện cần thực hiện..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Rủi ro"
                      multiline
                      rows={2}
                      value={activateForm.activation_risks}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activation_risks: e.target.value }))}
                      placeholder="Các rủi ro có thể xảy ra..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Lợi ích"
                      multiline
                      rows={2}
                      value={activateForm.activation_benefits}
                      onChange={(e) => setActivateForm(prev => ({ ...prev, activation_benefits: e.target.value }))}
                      placeholder="Các lợi ích dự kiến..."
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                {/* Nhận xét và Gợi ý - Full width */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Nhận xét kích hoạt"
                    multiline
                    rows={3}
                    value={activateForm.activation_comment}
                    onChange={(e) => setActivateForm(prev => ({ ...prev, activation_comment: e.target.value }))}
                    placeholder="Nhận xét chi tiết về việc kích hoạt..."
                    variant="outlined"
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Gợi ý"
                    multiline
                    rows={2}
                    value={activateForm.activation_suggestions}
                    onChange={(e) => setActivateForm(prev => ({ ...prev, activation_suggestions: e.target.value }))}
                    placeholder="Các gợi ý cải thiện..."
                    variant="outlined"
                  />
                </Box>
              </Paper>

              <Alert severity="success" sx={{ mt: 3 }}>
                <AlertTitle>Thông tin kích hoạt</AlertTitle>
                Sau khi kích hoạt, đơn vị sẽ:
                <ul>
                  <li>Được chuyển sang trạng thái "active"</li>
                  <li>Có thể sử dụng trong phân quyền và phân công</li>
                  <li>Được tạo bản ghi trong <strong>org_assignment</strong></li>
                  <li>Có thể mở ngành/chương trình đào tạo</li>
                </ul>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: 'grey.50', gap: 2 }}>
          <Button 
            onClick={handleCloseActivateDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isActivating ? <CircularProgress size={20} /> : <CompleteIcon />}
            onClick={handleActivate}
            disabled={!activateForm.activation_comment.trim() || isActivating}
            sx={{ minWidth: 120 }}
          >
            {isActivating ? 'Activating...' : 'Activate Unit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}