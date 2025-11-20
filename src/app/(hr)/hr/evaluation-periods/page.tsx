'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    CardActions,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as VisibilityIcon,
    GetApp as DownloadIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import HrSearchBar from '@/components/hr/HrSearchBar';

interface EvaluationPeriod {
    review_period: string;
    created_at: string;
    updated_at: string;
    _count: {
        id: number;
    };
}

interface EvaluationUrl {
    id: string;
    employeeId: string;
    lecturerName: string;
    lecturerEmail: string;
    period: string;
    evaluationUrl: string;
    token: string;
    createdAt: string;
}

export default function EvaluationPeriodsPage() {
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [urlsDialogOpen, setUrlsDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
    const [evaluationUrls, setEvaluationUrls] = useState<EvaluationUrl[]>([]);
    const [urlsLoading, setUrlsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form data for creating new period
    const [formData, setFormData] = useState({
        period: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/hr/evaluation-periods', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch evaluation periods');
            }
            const data = await response.json();
            setPeriods(data.data || []);
        } catch (error) {
            console.error('Error fetching periods:', error);
            setError(error instanceof Error ? error.message : 'Không thể tải danh sách kỳ đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async () => {
        try {
            const response = await fetch('/api/hr/evaluation-periods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create evaluation period');
            }

            const result = await response.json();
            setCreateDialogOpen(false);
            setFormData({ period: '', description: '', startDate: '', endDate: '' });
            fetchPeriods();

            // Show success message
            alert(`Tạo kỳ đánh giá thành công! Đã tạo ${result.lecturerCount} đánh giá cho giảng viên.`);
        } catch (error) {
            console.error('Error creating period:', error);
            setError(error instanceof Error ? error.message : 'Không thể tạo kỳ đánh giá');
        }
    };

    const handleGenerateUrls = async (period: string) => {
        try {
            setUrlsLoading(true);
            setSelectedPeriod(period);

            const response = await fetch(`/api/hr/evaluation-urls?period=${encodeURIComponent(period)}`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to generate evaluation URLs');
            }

            const data = await response.json();
            setEvaluationUrls(data.data || []);
            setUrlsDialogOpen(true);
        } catch (error) {
            console.error('Error generating URLs:', error);
            setError(error instanceof Error ? error.message : 'Không thể tạo URL đánh giá');
        } finally {
            setUrlsLoading(false);
        }
    };

    const handleDownloadUrls = () => {
        if (evaluationUrls.length === 0) return;

        const csvContent = [
            ['Tên giảng viên', 'Email', 'URL đánh giá'],
            ...evaluationUrls.map(url => [
                url.lecturerName,
                url.lecturerEmail,
                url.evaluationUrl
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `evaluation-urls-${selectedPeriod}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const filteredPeriods = useMemo(() => {
        if (!searchTerm.trim()) return periods;
        const term = searchTerm.trim().toLowerCase();
        return periods.filter((period) =>
            [
                period.review_period,
                formatDate(period.created_at),
                formatDate(period.updated_at),
                period._count.id?.toString(),
            ].some((value) => value?.toLowerCase().includes(term))
        );
    }, [periods, searchTerm]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                gap={2}
                mb={2}
            >
                <Typography variant="h4" component="h1">
                    Quản lý Kỳ Đánh Giá
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchPeriods}
                        sx={{ mr: 2 }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Tạo Kỳ Đánh Giá
                    </Button>
                </Box>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo tên kỳ đánh giá hoặc ngày tạo"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Kỳ đánh giá</TableCell>
                                    <TableCell>Số lượng đánh giá</TableCell>
                                    <TableCell>Ngày tạo</TableCell>
                                    <TableCell>Ngày cập nhật</TableCell>
                                    <TableCell align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPeriods.length > 0 ? (
                                    filteredPeriods.map((period) => (
                                        <TableRow key={period.review_period}>
                                            <TableCell>
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {period.review_period}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={period._count.id}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(period.created_at)}</TableCell>
                                            <TableCell>{formatDate(period.updated_at)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleGenerateUrls(period.review_period)}
                                                    disabled={urlsLoading}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {searchTerm.trim()
                                                    ? 'Không tìm thấy kỳ đánh giá phù hợp'
                                                    : 'Chưa có kỳ đánh giá nào'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Create Period Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Tạo Kỳ Đánh Giá Mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Tên kỳ đánh giá"
                            value={formData.period}
                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                            required
                            placeholder="VD: Học kỳ 1 - 2024"
                            helperText="Tên kỳ đánh giá sẽ được sử dụng để phân biệt các kỳ"
                        />
                        <TextField
                            fullWidth
                            label="Mô tả"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            placeholder="Mô tả chi tiết về kỳ đánh giá..."
                        />
                        <TextField
                            fullWidth
                            label="Ngày bắt đầu"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth
                            label="Ngày kết thúc"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
                    <Button
                        onClick={handleCreatePeriod}
                        variant="contained"
                        disabled={!formData.period}
                    >
                        Tạo Kỳ Đánh Giá
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Evaluation URLs Dialog */}
            <Dialog open={urlsDialogOpen} onClose={() => setUrlsDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    URL Đánh Giá - {selectedPeriod}
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadUrls}
                        sx={{ ml: 2 }}
                    >
                        Tải CSV
                    </Button>
                </DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tên giảng viên</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>URL đánh giá</TableCell>
                                    <TableCell align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {evaluationUrls.map((url) => (
                                    <TableRow key={url.id}>
                                        <TableCell>{url.lecturerName}</TableCell>
                                        <TableCell>{url.lecturerEmail}</TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 300,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {url.evaluationUrl}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(url.evaluationUrl);
                                                    alert('Đã copy URL vào clipboard!');
                                                }}
                                            >
                                                Copy
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUrlsDialogOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
