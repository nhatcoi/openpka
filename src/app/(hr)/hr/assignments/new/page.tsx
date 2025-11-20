'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface EmployeeOption {
  id: string;
  displayName: string;
}

interface OrgUnitOption {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  title: string;
}

const ASSIGNMENT_TYPES = [
  { value: 'admin', label: 'Hành chính' },
  { value: 'academic', label: 'Học thuật' },
  { value: 'support', label: 'Hỗ trợ' },
];

export default function AssignmentCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      signIn();
      return;
    }

    void fetchInitialData();
  }, [session, status]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesRes, orgUnitsRes, positionsRes] = await Promise.all([
        fetch(API_ROUTES.HR.EMPLOYEES, { credentials: 'include' }),
        fetch(API_ROUTES.HR.ORG_UNITS_MINI, { credentials: 'include' }),
        fetch(API_ROUTES.HR.POSITIONS, { credentials: 'include' }),
      ]);

      if (!employeesRes.ok || !orgUnitsRes.ok || !positionsRes.ok) {
        throw new Error('Không thể tải dữ liệu cần thiết');
      }

      const [employeesData, orgUnitsData, positionsData] = await Promise.all([
        employeesRes.json(),
        orgUnitsRes.json(),
        positionsRes.json(),
      ]);

      if (employeesData.success) {
        setEmployees(
          employeesData.data.map((emp: any) => ({
            id: emp.id.toString(),
            displayName: `${emp.User?.full_name || 'N/A'} (${emp.employee_no || emp.id})`,
          }))
        );
      }

      if (orgUnitsData.success && Array.isArray(orgUnitsData.data)) {
        setOrgUnits(
          orgUnitsData.data.map((unit: any) => ({
            id: unit.id?.toString(),
            name: unit.name,
          }))
        );
      } else {
        setOrgUnits([]);
      }

      if (positionsData?.success && Array.isArray(positionsData.data)) {
        setPositions(
          positionsData.data.map((pos: any) => ({
            id: pos.id?.toString(),
            title: pos.title || pos.name || `Vị trí ${pos.id}`,
          }))
        );
      } else {
        setPositions([]);
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
    setError(null);
    setSuccessMessage(null);

    if (!formData.employee_id || !formData.org_unit_id || !formData.start_date) {
      setError('Vui lòng chọn nhân viên, đơn vị và ngày bắt đầu');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: formData.employee_id,
          org_unit_id: formData.org_unit_id,
          position_id: formData.position_id || undefined,
          is_primary: formData.is_primary,
          assignment_type: formData.assignment_type,
          allocation: parseFloat(formData.allocation || '1'),
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tạo phân công');
      }

      setSuccessMessage('Tạo phân công thành công');
      setTimeout(() => {
        router.push(HR_ROUTES.ASSIGNMENTS);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tạo phân công');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = useMemo(() => employees, [employees]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(HR_ROUTES.ASSIGNMENTS)}>
          Quay lại danh sách
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mt: 1 }}>
          Thêm phân công mới
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gán nhân viên vào đơn vị tổ chức với tỷ lệ phân bổ cụ thể.
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
                  {filteredEmployees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.displayName}
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
                      {unit.name}
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
                      {position.title}
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
            {saving ? 'Đang lưu...' : 'Tạo phân công'}
          </Button>
          <Button variant="outlined" onClick={() => router.push(HR_ROUTES.ASSIGNMENTS)}>
            Hủy
          </Button>
        </Box>
      </form>
    </Box>
  );
}

