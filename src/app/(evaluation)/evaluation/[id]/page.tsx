'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useEvaluation, useSubmitEvaluation } from '@/features/hr';
import {
    Box,
    Typography,
    Button,
    TextField,
    Card,
    CardContent,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    CircularProgress,
    Grid,
    Rating,
    Divider
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

export default function EvaluationFormPage() {
    const params = useParams();
    const evaluationId = params.id as string;

    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || undefined : undefined;
    const { data: evaluation, isLoading: loading, error: queryError } = useEvaluation(evaluationId, token);
    const { mutateAsync: submitEvaluation, isPending: submitting } = useSubmitEvaluation();

    const [formData, setFormData] = useState({
      score: 0,
      comments: ''
    });

    const error = submitError || (queryError ? (queryError as Error).message : null);

    const handleSubmit = async () => {
      if (formData.score === 0) {
        setSubmitError('Vui lòng chọn điểm đánh giá');
        return;
      }

      try {
        setSubmitError(null);
        await submitEvaluation({
          evaluationId,
          score: formData.score,
          comments: formData.comments,
        });
        setSuccess(true);
      } catch (err: any) {
        setSubmitError(err.message || 'Không thể gửi đánh giá');
      }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error && !evaluation) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (success) {
        return (
            <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h5" color="success.main" gutterBottom>
                            ✅ Đánh giá đã được gửi thành công!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Cảm ơn bạn đã dành thời gian đánh giá giảng viên.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Đánh Giá Hiệu Suất Giảng Viên
            </Typography>

            {evaluation && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Thông tin giảng viên
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Tên giảng viên:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {evaluation.Employee?.User?.full_name || 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Kỳ đánh giá:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {evaluation.review_period}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

      <Card>
        <CardContent>
          <Box sx={{ 
            bgcolor: 'info.light', 
            color: 'info.contrastText', 
            p: 2, 
            borderRadius: 1, 
            mb: 3 
          }}>
            <Typography variant="subtitle1" gutterBottom>
              🔒 Đánh giá ẩn danh
            </Typography>
            <Typography variant="body2">
              Đánh giá này hoàn toàn ẩn danh. Thông tin người đánh giá sẽ không được lưu trữ.
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Đánh giá hiệu suất
          </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Điểm đánh giá (1-5):
                            </Typography>
                            <Rating
                                value={formData.score}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, score: newValue || 0 });
                                }}
                                size="large"
                                max={5}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {formData.score === 1 && 'Rất kém'}
                                {formData.score === 2 && 'Kém'}
                                {formData.score === 3 && 'Trung bình'}
                                {formData.score === 4 && 'Tốt'}
                                {formData.score === 5 && 'Rất tốt'}
                            </Typography>
                        </Box>

            <TextField
              fullWidth
              label="Nhận xét chi tiết"
              multiline
              rows={6}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Hãy chia sẻ nhận xét chi tiết về giảng viên..."
              helperText="Nhận xét của bạn sẽ giúp giảng viên cải thiện hiệu suất giảng dạy. Thông tin này hoàn toàn ẩn danh."
            />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SendIcon />}
                            onClick={handleSubmit}
                            disabled={submitting || formData.score === 0}
                            sx={{ minWidth: 200 }}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
