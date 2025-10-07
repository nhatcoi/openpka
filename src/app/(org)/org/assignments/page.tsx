'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
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
  Divider,
} from '@mui/material';
import {
  AssignmentInd as AssignmentIndIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

// Types
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
  OrgUnit: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  JobPosition?: {
    id: string;
    title: string;
    code: string;
  };
}

interface Employee {
  id: string;
  employee_no: string;
  User: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface OrgUnit {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface JobPosition {
  id: string;
  title: string;
  code: string;
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<OrgAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<OrgAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    employee_id: '',
    org_unit_id: '',
    job_position_id: '',
    start_date: '',
    end_date: '',
    assignment_type: 'admin',
    is_primary: true,
    allocation: '1.00',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentsRes, employeesRes, orgUnitsRes, jobPositionsRes] = await Promise.all([
        fetch(API_ROUTES.ORG.ASSIGNMENTS),
        fetch(API_ROUTES.HR.EMPLOYEES),
        fetch(buildUrl(API_ROUTES.ORG.UNITS, { page: 1, size: 1000 })),
        fetch(API_ROUTES.HR.POSITIONS),
      ]);

      const [assignmentsData, employeesData, orgUnitsData, jobPositionsData] = await Promise.all([
        assignmentsRes.json(),
        employeesRes.json(),
        orgUnitsRes.json(),
        jobPositionsRes.json(),
      ]);

      if (assignmentsData.success) {
        setAssignments(Array.isArray(assignmentsData.data) ? assignmentsData.data : []);
      }
      if (employeesData.success) {
        setEmployees(Array.isArray(employeesData.data) ? employeesData.data : []);
      }
      if (orgUnitsData.success) {
        setOrgUnits(orgUnitsData.data.items || []);
      }
      if (jobPositionsData.success) {
        setJobPositions(Array.isArray(jobPositionsData.data) ? jobPositionsData.data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setFormData({
      employee_id: '',
      org_unit_id: '',
      job_position_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      assignment_type: 'admin',
      is_primary: true,
      allocation: '1.00',
    });
    setOpenDialog(true);
  };

  const handleEditAssignment = (assignment: OrgAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      employee_id: assignment.employee_id,
      org_unit_id: assignment.org_unit_id,
      job_position_id: assignment.job_position_id || '',
      start_date: assignment.start_date.split('T')[0],
      end_date: assignment.end_date ? assignment.end_date.split('T')[0] : '',
      assignment_type: assignment.assignment_type,
      is_primary: assignment.is_primary,
      allocation: Number(assignment.allocation).toString(),
    });
    setOpenDialog(true);
  };

  const handleSaveAssignment = async () => {
    try {
      const url = editingAssignment 
        ? API_ROUTES.ORG.ASSIGNMENTS_BY_ID(editingAssignment.id)
        : API_ROUTES.ORG.ASSIGNMENTS;
      
      const method = editingAssignment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setOpenDialog(false);
        loadData();
      } else {
        setError(result.error || 'Failed to save assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return;
    
    try {
      const response = await fetch(API_ROUTES.ORG.ASSIGNMENTS_BY_ID(id), {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        loadData();
      } else {
        setError(result.error || 'Failed to delete assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const filteredAssignments = (assignments || []).filter(assignment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      assignment.Employee.User.full_name.toLowerCase().includes(query) ||
      assignment.Employee.employee_no.toLowerCase().includes(query) ||
      assignment.OrgUnit.name.toLowerCase().includes(query) ||
      assignment.OrgUnit.code.toLowerCase().includes(query) ||
      (assignment.JobPosition?.title.toLowerCase().includes(query)) ||
      assignment.assignment_type.toLowerCase().includes(query)
    );
  });

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AssignmentIndIcon sx={{ color: 'primary.contrastText', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Phân công nhân sự
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý phân công nhân viên vào các đơn vị tổ chức
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Tìm kiếm phân công..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAssignment}
              >
                Thêm phân công
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Vị trí công việc</TableCell>
                  <TableCell>Ngày bắt đầu</TableCell>
                  <TableCell>Ngày kết thúc</TableCell>
                  <TableCell>Loại phân công</TableCell>
                  <TableCell>Phân bổ</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {assignment.Employee.User.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.Employee.employee_no}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <BusinessIcon color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {assignment.OrgUnit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.OrgUnit.code} • {assignment.OrgUnit.type}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {assignment.JobPosition ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <WorkIcon color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {assignment.JobPosition.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.JobPosition.code}
                            </Typography>
                          </Box>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa phân công
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

          {filteredAssignments.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {searchQuery ? 'Không tìm thấy phân công nào' : 'Chưa có phân công nào'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Chỉnh sửa phân công' : 'Thêm phân công mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Employee Selection */}
            <Autocomplete
              options={employees || []}
              getOptionLabel={(option) => `${option.User.full_name} (${option.employee_no})`}
              value={(employees || []).find(emp => emp.id === formData.employee_id) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, employee_id: newValue?.id || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nhân viên"
                  placeholder="Tìm kiếm nhân viên..."
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.User.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.employee_no} • {option.User.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Org Unit Selection */}
            <Autocomplete
              options={orgUnits || []}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={(orgUnits || []).find(unit => unit.id === formData.org_unit_id) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, org_unit_id: newValue?.id || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Đơn vị tổ chức"
                  placeholder="Tìm kiếm đơn vị..."
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code} • {option.type}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Job Position Selection */}
            <Autocomplete
              options={jobPositions || []}
              getOptionLabel={(option) => `${option.title} (${option.code})`}
              value={(jobPositions || []).find(pos => pos.id === formData.job_position_id) || null}
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
