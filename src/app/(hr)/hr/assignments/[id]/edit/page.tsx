'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { HR_ROUTES } from '@/constants/routes';
import { useAssignment, useUpdateAssignment, useEmployeeSearch, useJobPositions } from '@/features/hr';
import { useAllOrgUnits } from '@/features/org';

const ASSIGNMENT_TYPES = [
  { value: 'admin', label: 'Hành chính' },
  { value: 'academic', label: 'Học thuật' },
  { value: 'support', label: 'Hỗ trợ' },
];

export default function AssignmentEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: assignment, isLoading: assignmentLoading, error: assignmentError } = useAssignment(id);
  const { employees = [], loading: employeesLoading } = useEmployeeSearch();
  const { data: orgUnits = [], isLoading: orgUnitsLoading } = useAllOrgUnits();
  const { data: positions = [], isLoading: positionsLoading } = useJobPositions();
  const { mutateAsync: updateAssignment } = useUpdateAssignment();

  const loading = assignmentLoading || employeesLoading || orgUnitsLoading || positionsLoading;
  const [formData, setFormData] = useState({
    employee_id: '',
    org_unit_id: '',
    position_id: '',
    assignment_type: 'admin',
    is_primary: true,
    allocation: '1.0',
    start_date: '',
    end_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      signIn();
    }
  }, [session, status]);

  useEffect(() => {
    if (assignment) {
      setFormData({
        employee_id: assignment.employee_id || '',
        org_unit_id: assignment.org_unit_id || '',
        position_id: assignment.position_id || '',
        assignment_type: assignment.assignment_type || 'admin',
        is_primary: !!assignment.is_primary,
        allocation: assignment.allocation ? String(assignment.allocation) : '1.0',
        start_date: assignment.start_date ? assignment.start_date.substring(0, 10) : '',
        end_date: assignment.end_date ? assignment.end_date.substring(0, 10) : '',
      });
    }
  }, [assignment]);

  const error = actionError || (assignmentError ? (assignmentError as Error).message : null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment) return;
    setActionError(null);
    setSuccessMessage(null);

    if (!formData.employee_id || !formData.org_unit_id || !formData.start_date) {
      setActionError('Vui lòng chọn nhân viên, đơn vị và ngày bắt đầu');
      return;
    }

    try {
      setSaving(true);
      await updateAssignment({
        id: assignment.id,
        data: {
          employee_id: formData.employee_id,
          org_unit_id: formData.org_unit_id,
          position_id: formData.position_id || null,
          assignment_type: formData.assignment_type,
          is_primary: formData.is_primary,
          allocation: parseFloat(formData.allocation || '1'),
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        },
      });

      setSuccessMessage('Cập nhật phân công thành công');
      setTimeout(() => {
        router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(assignment.id));
      }, 800);
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật phân công');
    } finally {
      setSaving(false);
    }
  };

  const employeeOptions = useMemo(() => {
    return employees.map((emp: any) => ({
      id: emp.id.toString(),
      label: `${emp.User?.full_name || emp.user?.full_name || 'N/A'} (${emp.employee_no || emp.id})`,
    }));
  }, [employees]);

  const orgUnitOptions = useMemo(() => {
    return (orgUnits as any[]).map((unit: any) => ({
      id: unit.id?.toString(),
      label: unit.name,
    }));
  }, [orgUnits]);

  const positionOptions = useMemo(() => {
    return (positions as any[]).map((pos: any) => ({
      id: pos.id?.toString(),
      label: pos.title || pos.name || `Vị trí ${pos.id}`,
    }));
  }, [positions]);

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  if (!assignment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Không tìm thấy phân công</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(assignment.id))}>
          Quay lại chi tiết
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mt: 1 }}>
          Chỉnh sửa phân công
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cập nhật thông tin phân công của nhân viên.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <FormControl fullWidth required>
                <InputLabel>Nhân viên</InputLabel>
                <Select
                  value={formData.employee_id}
                  label="Nhân viên"
                  onChange={(event) => handleChange('employee_id', event.target.value)}
                >
                  {employeeOptions.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Đơn vị</InputLabel>
                <Select
                  value={formData.org_unit_id}
                  label="Đơn vị"
                  onChange={(event) => handleChange('org_unit_id', event.target.value)}
                >
                  {orgUnitOptions.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Chức vụ</InputLabel>
                <Select
                  value={formData.position_id}
                  label="Chức vụ"
                  onChange={(event) => handleChange('position_id', event.target.value)}
                >
                  <MenuItem value="">-- Không chọn --</MenuItem>
                  {positionOptions.map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Loại phân công</InputLabel>
                <Select
                  value={formData.assignment_type}
                  label="Loại phân công"
                  onChange={(event) => handleChange('assignment_type', event.target.value)}
                >
                  {ASSIGNMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Tỷ lệ phân bổ (0 - 1)"
                value={formData.allocation}
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                onChange={(event) => handleChange('allocation', event.target.value)}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_primary}
                    onChange={(event) => handleChange('is_primary', event.target.checked)}
                  />
                }
                label="Phân công chính"
              />

              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(event) => handleChange('start_date', event.target.value)}
              />

              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={(event) => handleChange('end_date', event.target.value)}
              />
            </Stack>
          </CardContent>
        </Card>

        <Box mt={3} display="flex" gap={2}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(assignment.id))}
          >
            Hủy
          </Button>
        </Box>
      </form>
    </Box>
  );
}

