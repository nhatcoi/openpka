'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Work as WorkIcon,
    Person as PersonIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import {HR_ROUTES, API_ROUTES} from '@/constants/routes';
import HrSearchBar from '@/components/hr/HrSearchBar';

interface Employee {
    id: string;
    employee_no: string | null;
    user: {
        full_name: string;
        username: string;
    } | null;
}

interface Employment {
    id: string;
    employee_id: string;
    contract_no: string;
    contract_type: string;
    start_date: string;
    end_date: string | null;
    fte: number;
    salary_band: string;
    employees: {
        id: string;
        employee_no: string | null;
        user: {
            full_name: string;
            username: string;
        } | null;
    } | null;
}

export default function EmploymentsPage() {
    const {data: session, status} = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();
    const [employments, setEmployments] = useState<Employment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEmployment, setEditingEmployment] = useState<Employment | null>(null);
    const [viewingEmployment, setViewingEmployment] = useState<Employment | null>(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        contract_no: '',
        contract_type: '',
        start_date: '',
        end_date: '',
        fte: '1.0',
        salary_band: ''
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const contractTypes = [
        {value: 'permanent', label: 'Hợp đồng không xác định thời hạn'},
        {value: 'temporary', label: 'Hợp đồng có thời hạn'},
        {value: 'internship', label: 'Thực tập sinh'},
        {value: 'consultant', label: 'Tư vấn'},
        {value: 'part_time', label: 'Bán thời gian'}
    ];

    const salaryBands = [
        'Band 1', 'Band 2', 'Band 3', 'Band 4', 'Band 5',
        'Senior Level', 'Manager Level', 'Director Level',
        'Entry Level', 'Mid Level', 'Expert Level'
    ];

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [session, status, router]);

    useEffect(() => {
        // Check for employee_id in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const employeeId = urlParams.get('employee_id');
        if (employeeId) {
            setFormData(prev => ({...prev, employee_id: employeeId}));
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Starting fetchData...');

            // Check for employee_id in URL params
            const urlParams = new URLSearchParams(window.location.search);
            const employeeId = urlParams.get('employee_id');
            console.log('Employee ID from URL:', employeeId);

            const employeesUrl = API_ROUTES.HR.EMPLOYEES;
            const employmentsUrl = employeeId ? `${API_ROUTES.HR.EMPLOYMENTS}?employee_id=${employeeId}` : API_ROUTES.HR.EMPLOYMENTS;

            console.log('Fetching from URLs:', {employeesUrl, employmentsUrl});

            const [employeesRes, employmentsRes] = await Promise.all([
                fetch(employeesUrl, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }),
                fetch(employmentsUrl, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
            ]);

            console.log('Response statuses:', {
                employeesStatus: employeesRes.status,
                employmentsStatus: employmentsRes.status
            });

            const [employeesResult, employmentsResult] = await Promise.all([
                employeesRes.json(),
                employmentsRes.json()
            ]);

            console.log('API Results:', {employeesResult, employmentsResult});

            if (employeesResult.success) {
                setEmployees(employeesResult.data);
                console.log('Employees set:', employeesResult.data.length);
            }
            if (employmentsResult.success) {
                setEmployments(employmentsResult.data);
                console.log('Employments set:', employmentsResult.data.length);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setError('Lỗi kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (employment?: Employment) => {
        if (employment) {
            setEditingEmployment(employment);
            setFormData({
                employee_id: employment.employee_id,
                contract_no: employment.contract_no,
                contract_type: employment.contract_type,
                start_date: employment.start_date.split('T')[0],
                end_date: employment.end_date ? employment.end_date.split('T')[0] : '',
                fte: employment.fte.toString(),
                salary_band: employment.salary_band
            });
        } else {
            setEditingEmployment(null);
            setFormData({
                employee_id: '',
                contract_no: '',
                contract_type: '',
                start_date: '',
                end_date: '',
                fte: '1.0',
                salary_band: ''
            });
        }
        setOpenDialog(true);
    };

    const handleViewEmployment = (employment: Employment) => {
        setViewingEmployment(employment);
        setOpenViewDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEmployment(null);
        setFormData({
            employee_id: '',
            contract_no: '',
            contract_type: '',
            start_date: '',
            end_date: '',
            fte: '1.0',
            salary_band: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.contract_no || !formData.contract_type || !formData.start_date || !formData.fte || !formData.salary_band) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSaving(true);
            const url = editingEmployment
                ? API_ROUTES.HR.EMPLOYMENTS_BY_ID(editingEmployment.id)
                : API_ROUTES.HR.EMPLOYMENTS;

            const method = editingEmployment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
                handleCloseDialog();
                setError(null);
            } else {
                setError(result.error || 'Lỗi khi lưu hợp đồng');
            }
        } catch (error) {
            setError('Lỗi kết nối đến server');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa hợp đồng lao động',
            message: 'Bạn có chắc chắn muốn xóa hợp đồng lao động này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.EMPLOYMENTS_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
                setError(null);
            } else {
                setError(result.error || 'Lỗi khi xóa hợp đồng');
            }
        } catch (error) {
            setError('Lỗi kết nối đến server');
        }
    };

    const getContractTypeLabel = (type: string) => {
        const contractType = contractTypes.find(ct => ct.value === type);
        return contractType ? contractType.label : type;
    };

    const getContractTypeColor = (type: string) => {
        switch (type) {
            case 'permanent':
                return 'success';
            case 'temporary':
                return 'warning';
            case 'internship':
                return 'info';
            case 'consultant':
                return 'secondary';
            case 'part_time':
                return 'default';
            default:
                return 'default';
        }
    };

    const filteredEmployments = useMemo(() => {
        if (!searchTerm.trim()) return employments;
        const term = searchTerm.trim().toLowerCase();
        return employments.filter((employment) => {
            const values = [
                employment.Employee?.User?.full_name,
                employment.Employee?.employee_no,
                employment.contract_no,
                getContractTypeLabel(employment.contract_type),
                employment.salary_band,
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [employments, searchTerm]);

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress/>
                <Typography variant="h6" sx={{ml: 2}}>
                    Đang tải danh sách hợp đồng lao động...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{p: 3}}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                gap={2}
                mb={2}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <WorkIcon sx={{mr: 2, fontSize: 32, color: 'primary.main'}}/>
                    <Box>
                        <Typography variant="h4" component="h1">
                            Quản lý Hợp đồng Lao động
                        </Typography>
                        {(() => {
                            const urlParams = new URLSearchParams(window.location.search);
                            const employeeId = urlParams.get('employee_id');
                            if (employeeId) {
                                const employee = employees.find(emp => emp.id === employeeId);
                                return (
                                    <Typography variant="subtitle1" color="text.secondary">
                                        Lịch sử hợp đồng của: {employee?.User?.full_name || 'Nhân viên'}
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    onClick={() => handleOpenDialog()}
                >
                    Thêm hợp đồng
                </Button>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo nhân viên, số hợp đồng, loại hợp đồng hoặc bậc lương"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 3}} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{width: '100%', overflow: 'hidden'}}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nhân viên</strong></TableCell>
                                <TableCell><strong>Số hợp đồng</strong></TableCell>
                                <TableCell><strong>Loại hợp đồng</strong></TableCell>
                                <TableCell><strong>Ngày bắt đầu</strong></TableCell>
                                <TableCell><strong>Ngày kết thúc</strong></TableCell>
                                <TableCell><strong>FTE</strong></TableCell>
                                <TableCell><strong>Bậc lương</strong></TableCell>
                                {/* <TableCell><strong>Hành động</strong></TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployments.length > 0 ? (
                                filteredEmployments.map((employment) => (
                                    <TableRow key={employment.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {employment.Employee?.User?.full_name || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {employment.Employee?.employee_no || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {employment.contract_no}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getContractTypeLabel(employment.contract_type)}
                                                color={getContractTypeColor(employment.contract_type) as never}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(employment.start_date).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {employment.end_date ? new Date(employment.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {employment.fte} ({Math.round(employment.fte * 100)}%)
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employment.salary_band}
                                                color="primary"
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm.trim()
                                                ? 'Không tìm thấy hợp đồng phù hợp'
                                                : 'Chưa có hợp đồng nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog thêm/sửa hợp đồng */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingEmployment ? 'Sửa hợp đồng lao động' : 'Thêm hợp đồng lao động mới'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, mt: 1}}>
                            <FormControl fullWidth required>
                                <InputLabel>Nhân viên</InputLabel>
                                <Select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    label="Nhân viên"
                                >
                                    {employees.map((employee) => (
                                        <MenuItem key={employee.id} value={employee.id}>
                                            {employee.User?.full_name} ({employee.employee_no})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Số hợp đồng"
                                value={formData.contract_no}
                                onChange={(e) => setFormData({...formData, contract_no: e.target.value})}
                                required
                                placeholder="VD: HD2024001"
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Loại hợp đồng</InputLabel>
                                <Select
                                    value={formData.contract_type}
                                    onChange={(e) => setFormData({...formData, contract_type: e.target.value})}
                                    label="Loại hợp đồng"
                                >
                                    {contractTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Ngày bắt đầu"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                required
                                InputLabelProps={{shrink: true}}
                            />

                            <TextField
                                fullWidth
                                label="Ngày kết thúc"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                InputLabelProps={{shrink: true}}
                                helperText="Để trống nếu hợp đồng không xác định thời hạn"
                            />

                            <TextField
                                fullWidth
                                label="FTE (Full-time Equivalent)"
                                type="number"
                                value={formData.fte}
                                onChange={(e) => setFormData({...formData, fte: e.target.value})}
                                required
                                inputProps={{min: 0, max: 1, step: 0.1}}
                                helperText="1.0 = 100%, 0.5 = 50%"
                            />

                            <FormControl fullWidth>
                                <InputLabel>Bậc lương</InputLabel>
                                <Select
                                    value={formData.salary_band}
                                    onChange={(e) => setFormData({...formData, salary_band: e.target.value})}
                                    label="Bậc lương"
                                >
                                    {salaryBands.map((band) => (
                                        <MenuItem key={band} value={band}>
                                            {band}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={saving}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20}/> : null}
                        >
                            {saving ? 'Đang lưu...' : (editingEmployment ? 'Cập nhật' : 'Thêm mới')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog xem chi tiết hợp đồng */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Chi tiết hợp đồng lao động
                </DialogTitle>
                <DialogContent>
                    {viewingEmployment && (
                        <Grid container spacing={2} sx={{mt: 1}}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Nhân viên
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {viewingEmployment.Employee?.User?.full_name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {viewingEmployment.Employee?.employee_no || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Số hợp đồng
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {viewingEmployment.contract_no}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Loại hợp đồng
                                </Typography>
                                <Chip
                                    label={getContractTypeLabel(viewingEmployment.contract_type)}
                                    color={getContractTypeColor(viewingEmployment.contract_type) as
                                        never

                                    }
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Bậc lương
                                </Typography>
                                <Chip
                                    label={viewingEmployment.salary_band}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ngày bắt đầu
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(viewingEmployment.start_date).toLocaleDateString('vi-VN')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ngày kết thúc
                                </Typography>
                                <Typography variant="body1">
                                    {viewingEmployment.end_date ? new Date(viewingEmployment.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    FTE (Full-time Equivalent)
                                </Typography>
                                <Typography variant="body1">
                                    {viewingEmployment.fte} ({Math.round(viewingEmployment.fte * 100)}%)
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Trạng thái hợp đồng
                                </Typography>
                                <Chip
                                    label={viewingEmployment.end_date && new Date(viewingEmployment.end_date) < new Date() ? 'Đã hết hạn' : 'Đang hiệu lực'}
                                    color={viewingEmployment.end_date && new Date(viewingEmployment.end_date) < new Date() ? 'error' : 'success'}
                                    size="small"
                                    variant="filled"
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenViewDialog(false)}>
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setOpenViewDialog(false);
                            handleOpenDialog(viewingEmployment!);
                        }}
                    >
                        Chỉnh sửa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
