'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignmentIndIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/use-org-units';
import { useEmployeeSearch } from '@/hooks/use-employee-search';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';

interface PersonnelTabProps {
  unit: OrgUnit;
}

interface OrgAssignment {
  id: string;
  employee_id: string;
  org_unit_id: string;
  job_position_id?: string;
  start_date: string;
  end_date?: string;
  assignment_type: string;
  is_primary: boolean;
  allocation: string;
  Employee: {
    id: string;
    employee_no: string;
    User: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  JobPosition?: {
    id: string;
    title: string;
    code: string;
  };
}

interface JobPosition {
  id: string;
  title: string;
  code: string;
}

interface AssignedEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_no: string;
  position: string;
  status: string;
  assignment_type: string;
  is_primary: boolean;
  allocation: string;
  start_date: string;
  end_date?: string;
}


export default function PersonnelTab({ unit }: PersonnelTabProps) {
  // Assignment management state
  const [assignments, setAssignments] = useState<OrgAssignment[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<OrgAssignment | null>(null);
  
  // Employee search hook
  const { employees, loading: searchLoading, error: searchError, searchEmployees, loadAllEmployees } = useEmployeeSearch();
  const confirmDialog = useConfirmDialog();
  
  // Track user input to prevent search loop
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    employee_id: '',
    job_position_id: '',
    start_date: '',
    end_date: '',
    assignment_type: 'admin',
    is_primary: true,
    allocation: '1.00',
  });

  // Load assignments and job positions
  useEffect(() => {
    loadAssignments();
    loadJobPositions();
  }, [unit.id]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/org/assignments?org_unit_id=${unit.id}`);
      const result = await response.json();
      
      if (result.success) {
        setAssignments(result.data);
      } else {
        setError(result.error || 'Failed to load assignments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadJobPositions = async () => {
    try {
      const response = await fetch('/api/hr/job-positions');
      const result = await response.json();
      
      if (result.success) {
        setJobPositions(result.data);
      }
    } catch (err: any) {
      console.error('Failed to load job positions:', err);
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setFormData({
      employee_id: '',
      job_position_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      assignment_type: 'admin',
      is_primary: true,
      allocation: '1.00',
    });
    // Reset typing state and load all employees when opening modal
    setIsUserTyping(false);
    setError(null); // Clear any previous errors
    loadAllEmployees();
    setOpenDialog(true);
  };

  const handleEditAssignment = (assignment: OrgAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      employee_id: assignment.employee_id,
      job_position_id: assignment.job_position_id || '',
      start_date: assignment.start_date.split('T')[0],
      end_date: assignment.end_date ? assignment.end_date.split('T')[0] : '',
      assignment_type: assignment.assignment_type,
      is_primary: assignment.is_primary,
      allocation: Number(assignment.allocation).toString(),
    });
    // Reset typing state and load all employees when opening modal
    setIsUserTyping(false);
    setError(null); // Clear any previous errors
    loadAllEmployees();
    setOpenDialog(true);
  };

  const handleSaveAssignment = async () => {
    try {
      const url = editingAssignment 
        ? `/api/org/assignments/${editingAssignment.id}`
        : '/api/org/assignments';
      
      const method = editingAssignment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          org_unit_id: unit.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setOpenDialog(false);
        loadAssignments();
      } else {
        setError(result.details || result.error || 'Failed to save assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Xóa phân công nhân sự',
      message: 'Bạn có chắc chắn muốn xóa phân công này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/org/assignments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        loadAssignments();
      } else {
        setError(result.error || 'Failed to delete assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'primary';
      case 'academic': return 'success';
      case 'support': return 'warning';
      default: return 'default';
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return 'Hành chính';
      case 'academic': return 'Học thuật';
      case 'support': return 'Hỗ trợ';
      default: return type;
    }
  };

  const isManagement = (position: string): boolean => {
    const posLower = position?.toLowerCase() || '';
    return posLower.includes('trưởng') || 
           posLower.includes('giám đốc') ||
           posLower.includes('phó') ||
           posLower.includes('head') ||
           posLower.includes('manager');
  };

  // Get employees from assignments data
  const assignedEmployees: AssignedEmployee[] = assignments.map(assignment => ({
    id: assignment.Employee.id,
    name: assignment.Employee.User.full_name,
    email: assignment.Employee.User.email,
    phone: '', // Phone not available in assignment data
    employee_no: assignment.Employee.employee_no,
    position: assignment.JobPosition?.title || 'Chưa phân công',
    status: 'active', // Assuming assigned employees are active
    assignment_type: assignment.assignment_type,
    is_primary: assignment.is_primary,
    allocation: Number(assignment.allocation).toString(),
    start_date: assignment.start_date,
    end_date: assignment.end_date,
  }));

  // Find unit head/manager from assignments
  const unitHead: AssignedEmployee | undefined = assignedEmployees.find(emp => 
    isManagement(emp.position)
  );

  // Group employees by position type from assignments
  const management: AssignedEmployee[] = assignedEmployees.filter(emp => 
    isManagement(emp.position)
  );

  const staff: AssignedEmployee[] = assignedEmployees.filter(emp => 
    !isManagement(emp.position)
  );

  // Calculate statistics from assignments
  const totalEmployees = assignedEmployees.length;
  const managementCount = management.length;
  const staffCount = staff.length;
  const primaryAssignments = assignedEmployees.filter(emp => emp.is_primary).length;
  const adminAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'admin').length;
  const academicAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'academic').length;
  const supportAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'support').length;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Nhân sự & Quản lý
      </Typography>

      <Stack spacing={3}>
        {/* Unit Head/Manager */}
        {unitHead && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                <SupervisorAccountIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Người đứng đầu đơn vị
              </Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar sx={{ backgroundColor: '#2e4c92', width: 64, height: 64 }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {unitHead.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {unitHead.employee_no}
                      </Typography>
                      <Chip
                        label={unitHead.position || 'Chưa xác định'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Stack spacing={1}>
                        {unitHead.email && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EmailIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {unitHead.email}
                            </Typography>
                          </Stack>
                        )}
                        {unitHead.phone && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PhoneIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {unitHead.phone}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Personnel Statistics */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Thống kê nhân sự
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#2e7d32', mx: 'auto', mb: 1 }}>
                  <GroupIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng phân công
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#1976d2', mx: 'auto', mb: 1 }}>
                  <SupervisorAccountIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {managementCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#ed6c02', mx: 'auto', mb: 1 }}>
                  <WorkIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {staffCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nhân viên
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#9c27b0', mx: 'auto', mb: 1 }}>
                  <AssignmentIndIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {primaryAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phân công chính
                </Typography>
              </Box>
            </Stack>

            {/* Assignment Type Statistics */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', mt: 2 }}>
              <Box sx={{ textAlign: 'center', minWidth: '120px', flex: 1 }}>
                <Chip 
                  label={`Hành chính: ${adminAssignments}`}
                  color="primary"
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '120px', flex: 1 }}>
                <Chip 
                  label={`Học thuật: ${academicAssignments}`}
                  color="success"
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '120px', flex: 1 }}>
                <Chip 
                  label={`Hỗ trợ: ${supportAssignments}`}
                  color="warning"
                  size="small"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Assignment Management */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                <AssignmentIndIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quản lý phân công nhân sự
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAssignment}
                size="small"
              >
                Thêm phân công
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : assignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssignmentIndIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Chưa có phân công nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy thêm phân công nhân sự cho đơn vị này
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* Management Staff */}
                {management.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Ban quản lý ({management.length})
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Vị trí công việc</TableCell>
                            <TableCell>Ngày bắt đầu</TableCell>
                            <TableCell>Ngày kết thúc</TableCell>
                            <TableCell>Loại phân công</TableCell>
                            <TableCell>Phân bổ</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assignments
                            .filter((assignment) => {
                              const position = assignment.JobPosition?.title || 'Chưa phân công';
                              return isManagement(position);
                            })
                            .map((assignment) => (
                              <TableRow key={assignment.id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ backgroundColor: '#1976d2' }}>
                                      <PersonIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {assignment.Employee.User.full_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {assignment.Employee.employee_no}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.JobPosition?.title || 'Chưa phân công'}
                                  </Typography>
                                  {assignment.JobPosition?.code && (
                                    <Typography variant="caption" color="text.secondary">
                                      {assignment.JobPosition.code}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(assignment.start_date).toLocaleDateString('vi-VN')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.end_date 
                                      ? new Date(assignment.end_date).toLocaleDateString('vi-VN')
                                      : 'Không xác định'
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getAssignmentTypeLabel(assignment.assignment_type)}
                                    color={getAssignmentTypeColor(assignment.assignment_type) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.is_primary ? 'Chính' : 'Phụ'} ({Number(assignment.allocation)}%)
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} justifyContent="center">
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditAssignment(assignment)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Regular Staff */}
                {staff.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Nhân viên ({staff.length})
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Vị trí công việc</TableCell>
                            <TableCell>Ngày bắt đầu</TableCell>
                            <TableCell>Ngày kết thúc</TableCell>
                            <TableCell>Loại phân công</TableCell>
                            <TableCell>Phân bổ</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assignments
                            .filter((assignment) => {
                              const position = assignment.JobPosition?.title || 'Chưa phân công';
                              return !isManagement(position);
                            })
                            .map((assignment) => (
                              <TableRow key={assignment.id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ backgroundColor: '#ed6c02' }}>
                                      <PersonIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {assignment.Employee.User.full_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {assignment.Employee.employee_no}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.JobPosition?.title || 'Chưa phân công'}
                                  </Typography>
                                  {assignment.JobPosition?.code && (
                                    <Typography variant="caption" color="text.secondary">
                                      {assignment.JobPosition.code}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(assignment.start_date).toLocaleDateString('vi-VN')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.end_date 
                                      ? new Date(assignment.end_date).toLocaleDateString('vi-VN')
                                      : 'Không xác định'
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getAssignmentTypeLabel(assignment.assignment_type)}
                                    color={getAssignmentTypeColor(assignment.assignment_type) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {assignment.is_primary ? 'Chính' : 'Phụ'} ({Number(assignment.allocation)}%)
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} justifyContent="center">
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditAssignment(assignment)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Chỉnh sửa phân công' : 'Thêm phân công mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Error Display */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {/* Employee Selection */}
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.User?.full_name || 'Unknown'} (${option.employee_no})`}
              value={employees.find(emp => emp.id === formData.employee_id) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, employee_id: newValue?.id || '' }));
              }}
              onInputChange={(event, newInputValue, reason) => {
                // Only search when user is typing, not when selecting an option
                if (reason === 'input') {
                  setIsUserTyping(true);
                  if (newInputValue.length >= 1) {
                    searchEmployees(newInputValue);
                  } else if (newInputValue.length === 0) {
                    // Load all employees when input is cleared
                    loadAllEmployees();
                  }
                } else if (reason === 'reset') {
                  setIsUserTyping(false);
                }
              }}
              noOptionsText={searchLoading ? "Đang tải..." : "Không tìm thấy nhân viên"}
              loading={searchLoading}
              filterOptions={(options) => options} // Disable client-side filtering since we're doing server-side search
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nhân viên"
                  placeholder="Tìm kiếm nhân viên..."
                  required
                  error={!!searchError}
                  helperText={searchError || "Nhập tên nhân viên để tìm kiếm"}
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
                      {option.employee_no} • {option.User?.email || 'No email'}
                    </Typography>
                  </Box>
                </Box>
              )}
              clearOnEscape
              selectOnFocus
              handleHomeEndKeys
            />

            {/* Job Position Selection */}
            <Autocomplete
              options={jobPositions}
              getOptionLabel={(option) => `${option.title} (${option.code})`}
              value={jobPositions.find(pos => pos.id === formData.job_position_id) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, job_position_id: newValue?.id || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vị trí công việc"
                  placeholder="Tìm kiếm vị trí..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Date Fields */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {/* Assignment Type */}
            <FormControl fullWidth>
              <InputLabel>Loại phân công</InputLabel>
              <Select
                value={formData.assignment_type}
                onChange={(e) => setFormData(prev => ({ ...prev, assignment_type: e.target.value }))}
                label="Loại phân công"
              >
                <MenuItem value="admin">Hành chính</MenuItem>
                <MenuItem value="academic">Học thuật</MenuItem>
                <MenuItem value="support">Hỗ trợ</MenuItem>
              </Select>
            </FormControl>

            {/* Primary Assignment */}
            <FormControl fullWidth>
              <InputLabel>Phân công chính</InputLabel>
              <Select
                value={formData.is_primary}
                onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.value === 'true' }))}
                label="Phân công chính"
              >
                <MenuItem value="true">Có</MenuItem>
                <MenuItem value="false">Không</MenuItem>
              </Select>
            </FormControl>

            {/* Allocation */}
            <TextField
              fullWidth
              label="Phân bổ (%)"
              type="number"
              value={formData.allocation}
              onChange={(e) => setFormData(prev => ({ ...prev, allocation: e.target.value }))}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveAssignment} variant="contained">
            {editingAssignment ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
