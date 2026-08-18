'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import { EvaluationUrl } from '@/features/hr';

export default function EvaluationDemoPage() {
    const [evaluationUrls, setEvaluationUrls] = useState<EvaluationUrl[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateUrls = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/hr/evaluation-urls?period=Học kỳ 1 - 2024');
            if (!response.ok) {
                throw new Error('Failed to generate evaluation URLs');
            }

            const data = await response.json();
            setEvaluationUrls(data.data || []);
        } catch (error) {
            console.error('Error generating URLs:', error);
            setError('Không thể tạo URL đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        alert('Đã copy URL vào clipboard!');
    };

    const handleOpenEvaluation = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Demo Hệ Thống Đánh Giá
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Hướng dẫn sử dụng
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>1. Tạo kỳ đánh giá:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Vào trang &quot;Quản lý kỳ đánh giá&quot;<br />
                                - Nhấn &quot;Tạo Kỳ Đánh Giá&quot;<br />
                                - Điền thông tin kỳ đánh giá
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>2. Tạo URL đánh giá:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Sau khi tạo kỳ, nhấn biểu tượng mắt<br />
                                - Hệ thống sẽ tạo URL cho từng giảng viên<br />
                                - Copy và gửi URL cho người đánh giá
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>3. Đánh giá:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Người đánh giá truy cập URL<br />
                                - Đánh giá ẩn danh (không cần đăng nhập)<br />
                                - Gửi đánh giá
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>4. Xem kết quả:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Giảng viên xem đánh giá tại &quot;Đánh giá của tôi&quot;<br />
                                - Admin xem tất cả đánh giá tại &quot;Đánh giá hiệu suất&quot;
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                            URL Đánh Giá - Học kỳ 1 - 2024
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleGenerateUrls}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <VisibilityIcon />}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo URL Đánh Giá'}
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {evaluationUrls.length > 0 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>STT</TableCell>
                                        <TableCell>Tên giảng viên</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>URL đánh giá</TableCell>
                                        <TableCell align="center">Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {evaluationUrls.map((url, index) => (
                                        <TableRow key={url.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {url.lecturerName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{url.lecturerEmail}</TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        maxWidth: 300,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {url.evaluationUrl}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<CopyIcon />}
                                                        onClick={() => handleCopyUrl(url.evaluationUrl)}
                                                    >
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handleOpenEvaluation(url.evaluationUrl)}
                                                    >
                                                        Mở
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {evaluationUrls.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                Nhấn &quot;Tạo URL Đánh Giá&quot; để tạo danh sách URL cho giảng viên
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Tính năng chính
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                🔒 Bảo mật & Ẩn danh
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - URL có token bảo mật<br />
                                - Đánh giá hoàn toàn ẩn danh<br />
                                - Không lưu trữ thông tin người đánh giá<br />
                                - Giảng viên chỉ thấy kết quả đánh giá
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                📊 Đánh giá
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Điểm từ 1-5 sao<br />
                                - Nhận xét chi tiết<br />
                                - Lưu trữ lịch sử đánh giá
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                📈 Báo cáo
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Xem kết quả theo kỳ<br />
                                - So sánh hiệu suất<br />
                                - Xuất báo cáo CSV
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
