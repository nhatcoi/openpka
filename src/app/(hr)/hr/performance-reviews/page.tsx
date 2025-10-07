'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    Rating,
    Avatar,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Assessment as AssessmentIcon,
    Person as PersonIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface User {
    id: string;
    username: string;
    email: string | null;
    full_name: string;
    dob: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
}

interface Employee {
    id: string;
    employee_no: string | null;
    employment_type: string | null;
    status: string | null;
    hired_at: string | null;
    terminated_at: string | null;
    User: User | null;
}

interface PerformanceReview {
    id: string;
    employee_id: string;
    review_period: string | null;
    score: string | null;
    comments: string | null;
    created_at: string;
    updated_at: string;
    Employee: Employee | null;
}

function PerformanceReviewsPageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        review_period: '',
        score: '',
        comments: '',
    });

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [session, status, router, searchParams]);

    useEffect(() => {
        // Check for employee_id in URL params and pre-fill form data
        const employeeId = searchParams.get('employee_id');
        if (employeeId) {
            setFormData(prev => ({
                ...prev,
                employee_id: employeeId
            }));
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Check for employee_id in URL params
            const employeeId = searchParams.get('employee_id');

            const [performanceReviewsRes, employeesRes] = await Promise.all([
                fetch(employeeId ? `${API_ROUTES.HR.PERFORMANCE_REVIEWS}?employee_id=${employeeId}` : API_ROUTES.HR.PERFORMANCE_REVIEWS),
                fetch(API_ROUTES.HR.EMPLOYEES)
            ]);

            const [performanceReviewsResult, employeesResult] = await Promise.all([
                performanceReviewsRes.json(),
                employeesRes.json()
            ]);

            if (performanceReviewsResult.success) {
                setPerformanceReviews(performanceReviewsResult.data);
            } else {
                setError(performanceReviewsResult.error || 'Không thể tải danh sách đánh giá');
            }

            if (employeesResult.success) {
                setEmployees(employeesResult.data);
            } else {
                setError(employeesResult.error || 'Không thể tải danh sách nhân viên');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('submit');

        try {
            const url = editingReview
                ? API_ROUTES.HR.PERFORMANCE_REVIEWS_BY_ID(editingReview.id)
                : API_ROUTES.HR.PERFORMANCE_REVIEWS;

            const method = editingReview ? 'PUT' : 'POST';

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
                setOpenDialog(false);
                setEditingReview(null);
                setFormData({
                    employee_id: '',
                    review_period: '',
                    score: '',
                    comments: '',
                });
            } else {
                setError(result.error || 'Không thể lưu đánh giá');
            }
        } catch (error) {
            console.error('Error saving performance review:', error);
            setError('Lỗi khi lưu đánh giá');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (review: PerformanceReview) => {
        setEditingReview(review);
        setFormData({
            employee_id: review.employee_id,
            review_period: review.review_period || '',
            score: review.score || '',
            comments: review.comments || '',
        });
        setOpenDialog(true);
    };

    const handleDelete = async (reviewId: string, employeeName: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa đánh giá của ${employeeName}?`)) {
            try {
                setActionLoading(`delete-${reviewId}`);
                const response = await fetch(API_ROUTES.HR.PERFORMANCE_REVIEWS_BY_ID(reviewId), {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    await fetchData();
                } else {
                    setError(result.error || 'Không thể xóa đánh giá');
                }
            } catch (error) {
                console.error('Error deleting performance review:', error);
                setError('Lỗi khi xóa đánh giá');
            } finally {
                setActionLoading(null);
            }
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingReview(null);
        setFormData({
            employee_id: '',
            review_period: '',
            score: '',
            comments: '',
        });
    };

    const getScoreColor = (score: string | null) => {
        if (!score) return 'default';
        const numScore = parseFloat(score);
        if (numScore >= 4.0) return 'success';
        if (numScore >= 3.0) return 'warning';
        return 'error';
    };

    const getScoreLabel = (score: string | null) => {
        if (!score) return 'Chưa đánh giá';
        const numScore = parseFloat(score);
        if (numScore >= 4.5) return 'Xuất sắc';
        if (numScore >= 4.0) return 'Tốt';
        if (numScore >= 3.0) return 'Đạt';
        if (numScore >= 2.0) return 'Cần cải thiện';
        return 'Không đạt';
    };

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải dữ liệu...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h4" component="h1">
                            Đánh giá Nhân viên
                        </Typography>
                        {(() => {
                            const employeeId = searchParams.get('employee_id');
                            if (employeeId) {
                                const employee = employees.find(emp => emp.id === employeeId);
                                return (
                                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                        Lịch sử đánh giá của: <strong>{employee?.User?.full_name || 'N/A'}</strong>
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
                    </Box>
                </Box>
                {/* <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Thêm đánh giá
                </Button> */}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Kỳ đánh giá</TableCell>
                            <TableCell>Điểm số</TableCell>
                            <TableCell>Nhận xét</TableCell>
                            <TableCell>Ngày tạo</TableCell>
                            {/* <TableCell>Thao tác</TableCell> */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {performanceReviews.map((review) => (
                            <TableRow key={review.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                            {review.Employee?.User?.full_name?.charAt(0) || 'N/A'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {review.Employee?.User?.full_name || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {review.Employee?.employee_no || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={review.review_period || 'N/A'}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Rating
                                            value={review.score ? parseFloat(review.score) : 0}
                                            precision={0.1}
                                            readOnly
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`${review.score || 'N/A'} - ${getScoreLabel(review.score)}`}
                                            color={getScoreColor(review.score)}
                                            variant="filled"
                                            size="small"
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{
                                        maxWidth: 200,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {review.comments || 'Không có nhận xét'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                </TableCell>
                                {/* <TableCell>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEdit(review)}
                                        disabled={actionLoading === `edit-${review.id}`}
                                        title="Chỉnh sửa đánh giá"
                                    >
                                        {actionLoading === `edit-${review.id}` ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <EditIcon />
                                        )}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(review.id, review.Employee?.User?.full_name || 'N/A')}
                                        disabled={actionLoading === `delete-${review.id}`}
                                        title="Xóa đánh giá"
                                    >
                                        {actionLoading === `delete-${review.id}` ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <DeleteIcon />
                                        )}
                                    </IconButton>
                                </TableCell> */}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {performanceReviews.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Chưa có đánh giá nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Hãy thêm đánh giá đầu tiên cho nhân viên
                    </Typography>
                    {/* <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Thêm đánh giá
                    </Button> */}
                </Box>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingReview ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Nhân viên</InputLabel>
                                <Select
                                    value={formData.employee_id}
                                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
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
                                label="Kỳ đánh giá"
                                value={formData.review_period}
                                onChange={(e) => handleInputChange('review_period', e.target.value)}
                                placeholder="VD: Q1-2024, 2024"
                            />

                            <TextField
                                fullWidth
                                label="Điểm số (0-5)"
                                type="number"
                                inputProps={{ min: 0, max: 5, step: 0.1 }}
                                value={formData.score}
                                onChange={(e) => handleInputChange('score', e.target.value)}
                                placeholder="4.5"
                            />

                            <TextField
                                fullWidth
                                label="Nhận xét"
                                multiline
                                rows={4}
                                value={formData.comments}
                                onChange={(e) => handleInputChange('comments', e.target.value)}
                                placeholder="Nhận xét về hiệu suất làm việc..."
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={actionLoading === 'submit'}
                            startIcon={actionLoading === 'submit' ? <CircularProgress size={20} /> : <AddIcon />}
                        >
                            {actionLoading === 'submit' ? 'Đang lưu...' : (editingReview ? 'Cập nhật' : 'Thêm')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}


export default function PerformanceReviewsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PerformanceReviewsPageContent />
        </Suspense>
    );
}