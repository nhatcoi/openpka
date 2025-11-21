'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';

interface CourseSyllabus {
  id: string;
  course_version_id: string;
  version_no: number;
  status: 'draft' | 'approved' | 'archived';
  language: 'vi' | 'en' | 'vi-en';
  effective_from?: string;
  effective_to?: string;
  is_current: boolean;
  basic_info?: any;
  learning_outcomes?: any;
  weekly_plan?: any;
  assessment_plan?: any;
  teaching_methods?: any;
  materials?: any;
  policies?: any;
  rubrics?: any;
  created_at: string;
  updated_at: string;
}

interface CourseDetail {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  CourseVersion?: Array<{
    id: string;
    version: string;
    status: string;
  }>;
}

export default function SyllabusViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState<CourseSyllabus | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ROUTES.TMS.COURSES_BY_ID(courseId));
        const result = await response.json();

        if (result.success && result.data) {
          const course = result.data;
          setCourseDetail({
            id: course.id.toString(),
            code: course.code,
            name_vi: course.name_vi,
            name_en: course.name_en,
            CourseVersion: course.CourseVersion?.map((v: any) => ({
              id: v.id.toString(),
              version: v.version,
              status: v.status,
            })) || [],
          });

          if (course.CourseVersion && course.CourseVersion.length > 0) {
            const firstVersionId = course.CourseVersion[0].id.toString();
            setSelectedVersionId(firstVersionId);
            await fetchSyllabus(firstVersionId);
          }
        } else {
          setError('Không thể tải thông tin học phần');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchSyllabus = async (versionId: string) => {
    try {
      let response = await fetch(`${API_ROUTES.TMS.COURSES_SYLLABUS(courseId)}?version_id=${versionId}&is_current=true`);
      let result = await response.json();

      if (!result.success || !result.data?.syllabus || result.data.syllabus.length === 0) {
        response = await fetch(`${API_ROUTES.TMS.COURSES_SYLLABUS(courseId)}?version_id=${versionId}`);
        result = await response.json();
      }

      if (result.success && result.data?.syllabus && result.data.syllabus.length > 0) {
        setSyllabus(result.data.syllabus[0]);
      } else {
        setSyllabus(null);
      }
    } catch (err) {
      console.error('Error fetching syllabus:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, px: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !courseDetail) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Không tìm thấy học phần'}</Alert>
      </Container>
    );
  }

  if (!syllabus) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/tms/courses/${courseId}`)}>
            Quay lại
          </Button>
        </Box>
        <Alert severity="info">Chưa có đề cương cho học phần này.</Alert>
      </Container>
    );
  }

  const basicInfo = syllabus.basic_info || {};
  const learningOutcomes = syllabus.learning_outcomes || {};
  const weeklyPlan = Array.isArray(syllabus.weekly_plan) 
    ? syllabus.weekly_plan 
    : syllabus.weekly_plan?.weeks || [];
  const assessmentPlan = Array.isArray(syllabus.assessment_plan)
    ? syllabus.assessment_plan
    : syllabus.assessment_plan?.components || [];
  const teachingMethods = syllabus.teaching_methods || {};
  const materials = syllabus.materials || {};
  const policies = syllabus.policies || {};
  const rubrics = Array.isArray(syllabus.rubrics)
    ? syllabus.rubrics
    : syllabus.rubrics?.components || [];

  const cloList = Array.isArray(learningOutcomes.clo) 
    ? learningOutcomes.clo 
    : learningOutcomes.clo 
      ? Object.entries(learningOutcomes.clo).map(([code, desc]: [string, any]) => ({ code, description: desc }))
      : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/tms/courses/${courseId}`)}>
          Quay lại
        </Button>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<PrintIcon />} variant="outlined" onClick={handlePrint}>
            In
          </Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => router.push(`/tms/courses/${courseId}/syllabus`)}>
            Chỉnh sửa
          </Button>
        </Stack>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 4, '@media print': { boxShadow: 'none' } }}>
        {/* Course Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            ĐỀ CƯƠNG CHI TIẾT HỌC PHẦN
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {courseDetail.code} - {courseDetail.name_vi}
          </Typography>
          {courseDetail.name_en && (
            <Typography variant="h6" color="text.secondary">
              {courseDetail.name_en}
            </Typography>
          )}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            <Chip label={syllabus.status === 'approved' ? 'Đã phê duyệt' : syllabus.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'} color={syllabus.status === 'approved' ? 'success' : 'default'} />
            <Chip label={`Version ${syllabus.version_no}`} variant="outlined" />
            {syllabus.is_current && <Chip label="Đang sử dụng" color="primary" />}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Basic Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            1. THÔNG TIN CƠ BẢN
          </Typography>
          <Grid container spacing={2}>
            {basicInfo.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Mô tả học phần:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{basicInfo.description}</Typography>
              </Grid>
            )}
            {basicInfo.classification && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Phân loại:</Typography>
                <Typography variant="body1">{basicInfo.classification}</Typography>
              </Grid>
            )}
            {basicInfo.course_type && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Loại học phần:</Typography>
                <Typography variant="body1">{basicInfo.course_type}</Typography>
              </Grid>
            )}
            {basicInfo.total_weeks && (
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Số tuần:</Typography>
                <Typography variant="body1">{basicInfo.total_weeks}</Typography>
              </Grid>
            )}
            {basicInfo.total_hours && (
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Tổng số giờ:</Typography>
                <Typography variant="body1">{basicInfo.total_hours}</Typography>
              </Grid>
            )}
            {basicInfo.credit_distribution && (
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Phân bổ tín chỉ:</Typography>
                <Typography variant="body1">{basicInfo.credit_distribution}</Typography>
              </Grid>
            )}
            {basicInfo.prerequisites && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Học phần tiên quyết:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{basicInfo.prerequisites}</Typography>
              </Grid>
            )}
            {basicInfo.objectives && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Mục tiêu học phần:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{basicInfo.objectives}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Learning Outcomes */}
        {cloList.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              2. CHUẨN ĐẦU RA (CLO)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mã CLO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
                    {cloList[0]?.plo_mapping && <TableCell sx={{ fontWeight: 'bold' }}>Ánh xạ PLO</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cloList.map((clo: any, index: number) => (
                    <TableRow key={clo.id || index}>
                      <TableCell>{clo.code || `CLO${index + 1}`}</TableCell>
                      <TableCell>{clo.description || ''}</TableCell>
                      {clo.plo_mapping && (
                        <TableCell>
                          {Array.isArray(clo.plo_mapping) ? clo.plo_mapping.join(', ') : ''}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Assessment Plan */}
        {assessmentPlan.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                3. KẾ HOẠCH ĐÁNH GIÁ
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Thành phần</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Trọng số (%)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assessmentPlan.map((item: any, index: number) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.name || ''}</TableCell>
                        <TableCell>{item.type || ''}</TableCell>
                        <TableCell align="right">{item.weight || 0}%</TableCell>
                        <TableCell>{item.description || item.criteria || ''}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Tổng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {assessmentPlan.reduce((sum: number, item: any) => sum + (item.weight || 0), 0)}%
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {/* Teaching Methods */}
        {(teachingMethods.description || (teachingMethods.methods && teachingMethods.methods.length > 0)) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                4. PHƯƠNG PHÁP GIẢNG DẠY
              </Typography>
              {teachingMethods.description && (
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {teachingMethods.description}
                </Typography>
              )}
              {teachingMethods.methods && Array.isArray(teachingMethods.methods) && teachingMethods.methods.length > 0 && (
                <Stack spacing={2}>
                  {teachingMethods.methods.map((method: any, index: number) => (
                    <Card key={method.id || index} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {method.method || method.name || ''}
                        </Typography>
                        {method.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {method.description}
                          </Typography>
                        )}
                        {(method.frequency || method.duration) && (
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            {method.frequency && (
                              <Typography variant="caption">Tần suất: {method.frequency}</Typography>
                            )}
                            {method.duration && (
                              <Typography variant="caption">Thời lượng: {method.duration}</Typography>
                            )}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </>
        )}

        {/* Weekly Plan */}
        {weeklyPlan.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                5. KẾ HOẠCH TUẦN
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tuần</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Chủ đề</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mục tiêu</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nội dung</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Giờ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weeklyPlan.map((week: any, index: number) => (
                      <TableRow key={week.id || index}>
                        <TableCell>
                          {week.week_number || index + 1}
                          {week.is_exam_week && <Chip label="Thi" size="small" color="error" sx={{ ml: 1 }} />}
                          {week.is_midterm_week && <Chip label="GK" size="small" color="warning" sx={{ ml: 1 }} />}
                        </TableCell>
                        <TableCell>{week.topic || ''}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {week.objectives || ''}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {week.materials || week.teaching_methods || ''}
                          </Typography>
                          {week.assignments && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              BT: {week.assignments}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{week.duration_hours || 3}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {/* Materials */}
        {materials && Object.keys(materials).length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                6. TÀI LIỆU HỌC TẬP
              </Typography>
              {materials.textbooks && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Giáo trình chính:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{materials.textbooks}</Typography>
                </Box>
              )}
              {materials.references && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tài liệu tham khảo:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{materials.references}</Typography>
                </Box>
              )}
              {materials.online_resources && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tài nguyên trực tuyến:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{materials.online_resources}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Policies */}
        {(policies.attendance || policies.late_submission || policies.academic_integrity || policies.communication) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                7. QUY ĐỊNH
              </Typography>
              {policies.attendance && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Quy định về tham gia:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{policies.attendance}</Typography>
                </Box>
              )}
              {policies.late_submission && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Quy định về nộp bài muộn:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{policies.late_submission}</Typography>
                </Box>
              )}
              {policies.academic_integrity && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Quy định về đạo đức học thuật:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{policies.academic_integrity}</Typography>
                </Box>
              )}
              {policies.communication && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin liên hệ:
                  </Typography>
                  {policies.communication.lecturer_email && (
                    <Typography variant="body1">Email: {policies.communication.lecturer_email}</Typography>
                  )}
                  {policies.communication.office_hours && (
                    <Typography variant="body1">Giờ tiếp sinh viên: {policies.communication.office_hours}</Typography>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Rubrics */}
        {rubrics.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                8. RUBRICS ĐÁNH GIÁ
              </Typography>
              <Stack spacing={3}>
                {rubrics.map((rubric: any, index: number) => (
                  <Card key={rubric.id || index} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {rubric.code && `${rubric.code}: `}{rubric.name || ''}
                      </Typography>
                      {rubric.criteria && Array.isArray(rubric.criteria) && rubric.criteria.length > 0 && (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tiêu chí</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Trọng số (%)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rubric.criteria.map((criterion: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{criterion.name || ''}</TableCell>
                                  <TableCell align="right">{criterion.weight || 0}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Footer */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="caption">
            Ngày hiệu lực: {syllabus.effective_from ? formatDate(syllabus.effective_from) : '—'} 
            {syllabus.effective_to && ` - ${formatDate(syllabus.effective_to)}`}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Cập nhật lần cuối: {formatDate(syllabus.updated_at)}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

