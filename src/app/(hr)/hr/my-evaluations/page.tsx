'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';

interface EvaluationData {
    id: string;
    employee_id: string;
    review_period: string;
    score: number | null;
    comments: string | null;
    created_at: string;
    updated_at: string;
    Employee: {
        id: string;
        User: {
            id: string;
            full_name: string;
            email: string;
        };
    };
}

export default function MyEvaluationsPage() {
    const { data: session } = useSession();
    const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            fetchMyEvaluations();
        } else if (session === null) {
            // Session is loaded but user is not authenticated
            setError('Vui lòng đăng nhập để xem đánh giá của bạn');
            setLoading(false);
        }
    }, [session]);

    const fetchMyEvaluations = async () => {
        try {
            setLoading(true);

            // Get current user's employee record
            const employeeResponse = await fetch('/api/hr/me');
            if (!employeeResponse.ok) {
                throw new Error('Không thể lấy thông tin nhân viên');
            }

            const employeeData = await employeeResponse.json();
            const employeeId = employeeData.data?.Employee?.[0]?.id;

            if (!employeeId) {
                throw new Error('Không tìm thấy thông tin nhân viên');
            }

            // Get evaluations for this employee
            const evaluationsResponse = await fetch(`/api/hr/performance-reviews?employeeId=${employeeId}`);
            if (!evaluationsResponse.ok) {
                throw new Error('Không thể lấy thông tin đánh giá');
            }

            const evaluationsData = await evaluationsResponse.json();
            setEvaluations(evaluationsData.data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            setError(error instanceof Error ? error.message : 'Không thể tải thông tin đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getScoreLabel = (score: number | null) => {
        if (!score) return 'Chưa đánh giá';
        if (score >= 4.5) return 'Xuất sắc';
        if (score >= 4) return 'Rất tốt';
        if (score >= 3.5) return 'Tốt';
        if (score >= 3) return 'Trung bình';
        if (score >= 2.5) return 'Kém';
        return 'Rất kém';
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return 'default';
        if (score >= 4) return 'success';
        if (score >= 3) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                {error.includes('đăng nhập') && (
                    <Alert severity="info">
                        <Typography variant="body2">
                            Để xem đánh giá hiệu suất của bạn, vui lòng đăng nhập vào hệ thống.
                        </Typography>
                    </Alert>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AssessmentIcon sx={{ mr: 2, fontSize: 32 }} />
                <Typography variant="h4" component="h1">
                    Đánh Giá Hiệu Suất Của Tôi
                </Typography>
            </Box>

            {evaluations.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            Chưa có đánh giá nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Các đánh giá hiệu suất sẽ xuất hiện ở đây khi được tạo.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {evaluations.map((evaluation) => (
                        <Accordion key={evaluation.id} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6">
                                            Kỳ đánh giá: {evaluation.review_period}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Cập nhật lần cuối: {formatDate(evaluation.updated_at)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {evaluation.score ? (
                                            <>
                                                <Rating
                                                    value={evaluation.score}
                                                    readOnly
                                                    precision={0.1}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={getScoreLabel(evaluation.score)}
                                                    color={getScoreColor(evaluation.score) as unknown}
                                                    size="small"
                                                />
                                            </>
                                        ) : (
                                            <Chip
                                                label="Chưa đánh giá"
                                                color="default"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Điểm đánh giá
                                        </Typography>
                                        {evaluation.score && typeof evaluation.score === 'number' ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h4" color="primary">
                                                    {evaluation.score.toFixed(1)}
                                                </Typography>
                                                <Rating
                                                    value={evaluation.score}
                                                    readOnly
                                                    precision={0.1}
                                                    size="large"
                                                />
                                            </Box>
                                        ) : (
                                            <Typography variant="body1" color="text.secondary">
                                                Chưa có điểm đánh giá
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Thông tin kỳ đánh giá
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="body2">
                                                <strong>Kỳ:</strong> {evaluation.review_period}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Tạo lúc:</strong> {formatDate(evaluation.created_at)}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Cập nhật:</strong> {formatDate(evaluation.updated_at)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {evaluation.comments && (
                                        <>
                                            <Box sx={{ gridColumn: '1 / -1' }}>
                                                <Divider />
                                            </Box>
                                            <Box sx={{ gridColumn: '1 / -1' }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Nhận xét
                                                </Typography>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {evaluation.comments}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Lưu ý:</strong> Thông tin đánh giá được cập nhật theo thời gian thực.
                    Bạn có thể xem tất cả các đánh giá hiệu suất của mình tại đây.
                </Typography>
            </Box>
        </Box>
    );
}
