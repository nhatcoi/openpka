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
import { API_ROUTES, HR_ROUTES } from '@/constants/routes';

interface Option {
  id: string;
  label: string;
}

interface AssignmentDetail {
  id: string;
  employee_id: string;
  org_unit_id: string;
  position_id?: string | null;
  is_primary: boolean;
  assignment_type: string;
  allocation: string | null;
  start_date: string;
  end_date?: string | null;
}

const ASSIGNMENT_TYPES = [
  { value: 'admin', label: 'Hành chính' },
  { value: 'academic', label: 'Học thuật' },
  { value: 'support', label: 'Hỗ trợ' },
];

export default function AssignmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [orgUnits, setOrgUnits] = useState<Option[]>([]);
  const [positions, setPositions] = useState<Option[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      signIn();
      return;
    }
    if (params.id) {
      void fetchInitialData(params.id as string);
    }
  }, [session, status, params.id]);

  const fetchInitialData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentRes, employeesRes, orgUnitsRes, positionsRes] = await Promise.all([
        fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), { credentials: 'include' }),
        fetch(API_ROUTES.HR.EMPLOYEES, { credentials: 'include' }),
        fetch(API_ROUTES.HR.ORG_UNITS_MINI, { credentials: 'include' }),
        fetch(API_ROUTES.HR.POSITIONS, { credentials: 'include' }),
      ]);

      if (!assignmentRes.ok) {
        const err = await assignmentRes.json();
        throw new Error(err.error || 'Không thể tải phân công');
      }

      const [assignmentData, employeesData, orgUnitsData, positionsData] = await Promise.all([
        assignmentRes.json(),
        employeesRes.json(),
        orgUnitsRes.json(),
        positionsRes.json(),
      ]);

      if (!assignmentData.success) {
        throw new Error(assignmentData.error || 'Không thể tải phân công');
      }

      setAssignment(assignmentData.data);
      setFormData({
        employee_id: assignmentData.data.employee_id || '',
        org_unit_id: assignmentData.data.org_unit_id || '',
        position_id: assignmentData.data.position_id || '',
        assignment_type: assignmentData.data.assignment_type || 'admin',
        is_primary: !!assignmentData.data.is_primary,
        allocation: assignmentData.data.allocation || '1.0',
        start_date: assignmentData.data.start_date?.substring(0, 10) || '',
        end_date: assignmentData.data.end_date?.substring(0, 10) || '',
      });

      if (employeesData.success) {
        setEmployees(
          employeesData.data.map((emp: any) => ({
            id: emp.id.toString(),
            label: `${emp.User?.full_name || 'N/A'} (${emp.employee_no || emp.id})`,
          }))
        );
      }

      if (orgUnitsData.success && Array.isArray(orgUnitsData.data)) {
        setOrgUnits(
          orgUnitsData.data.map((unit: any) => ({
            id: unit.id?.toString(),
            label: unit.name,
          }))
        );
      }

      if (positionsData.success && Array.isArray(positionsData.data)) {
        setPositions(
          positionsData.data.map((pos: any) => ({
            id: pos.id?.toString(),
            label: pos.title || pos.name || `Vị trí ${pos.id}`,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment) return;
    setError(null);
    setSuccessMessage(null);

    if (!formData.employee_id || !formData.org_unit_id || !formData.start_date) {
      setError('Vui lòng chọn nhân viên, đơn vị và ngày bắt đầu');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(assignment.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: formData.employee_id,
          org_unit_id: formData.org_unit_id,
          position_id: formData.position_id || null,
          assignment_type: formData.assignment_type,
          is_primary: formData.is_primary,
          allocation: parseFloat(formData.allocation || '1'),
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể cập nhật phân công');
      }

      setSuccessMessage('Cập nhật phân công thành công');
      setTimeout(() => {
        router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(assignment.id));
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể cập nhật phân công');
    } finally {
      setSaving(false);
    }
  };

  const employeeOptions = useMemo(() => employees, [employees]);

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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                  {orgUnits.map((unit) => (
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
                  {positions.map((position) => (
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

