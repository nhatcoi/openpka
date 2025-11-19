'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SyllabusWeek {
  id?: string;
  week_number: number;
  topic: string;
  teaching_methods?: string;
  materials?: string;
  assignments?: string;
  duration_hours: number;
  is_exam_week: boolean;
}

interface CourseVersion {
  id: string;
  version: string;
  status: string;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  syllabus?: SyllabusWeek[];
}

interface CourseDetail {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  versions?: CourseVersion[];
}

export default function CourseSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const courseId = params.id as string;

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [syllabusData, setSyllabusData] = useState<SyllabusWeek[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tms/courses/${courseId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const course = result.data;
          setCourseDetail({
            id: course.id.toString(),
            code: course.code,
            name_vi: course.name_vi,
            name_en: course.name_en,
            versions: course.CourseVersion?.map((v: any) => ({
              id: v.id.toString(),
              version: v.version,
              status: v.status,
              effective_from: v.effective_from,
              effective_to: v.effective_to,
              created_at: v.created_at,
              syllabus: v.CourseSyllabus?.flatMap((s: any) => {
                // syllabus_data is a JSONB array of weeks
                if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                  return s.syllabus_data.map((week: any) => ({
                    id: `${s.id}-${week.week_number}`,
                    week_number: week.week_number,
                    topic: week.topic,
                    teaching_methods: week.teaching_methods,
                    materials: week.materials,
                    assignments: week.assignments,
                    duration_hours: parseFloat(week.duration_hours || '3'),
                    is_exam_week: week.is_exam_week || false,
                  }));
                }
                return [];
              }) || [],
            })) || [],
          });

          // Select first version or create new one
          if (course.CourseVersion && course.CourseVersion.length > 0) {
            setSelectedVersionId(course.CourseVersion[0].id.toString());
            const firstVersion = course.CourseVersion[0];
            setSyllabusData(
              firstVersion.CourseSyllabus?.flatMap((s: any) => {
                if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                  return s.syllabus_data.map((week: any) => ({
                    id: `${s.id}-${week.week_number}`,
                    week_number: week.week_number,
                    topic: week.topic,
                    teaching_methods: week.teaching_methods,
                    materials: week.materials,
                    assignments: week.assignments,
                    duration_hours: parseFloat(week.duration_hours || '3'),
                    is_exam_week: week.is_exam_week || false,
                  }));
                }
                return [];
              }) || []
            );
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

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    const version = courseDetail?.versions?.find((v: CourseVersion) => v.id === versionId);
    setSyllabusData(version?.syllabus || []);
    setActiveTab(0);
  };

  const handleAddWeek = () => {
    const newWeekNumber = Math.max(...syllabusData.map((s) => s.week_number), 0) + 1;
    setEditingIndex(syllabusData.length);
    setSyllabusData([
      ...syllabusData,
      {
        week_number: newWeekNumber,
        topic: '',
        teaching_methods: '',
        materials: '',
        assignments: '',
        duration_hours: 3,
        is_exam_week: false,
      },
    ]);
    setOpenDialog(true);
  };

  const handleEditWeek = (index: number) => {
    setEditingIndex(index);
    setOpenDialog(true);
  };

  const handleDeleteWeek = async (index: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tuần học này?')) {
      const newData = syllabusData.filter((_, i) => i !== index);
      setSyllabusData(newData);
      await handleSave(newData);
    }
  };

  const handleSave = async (data?: SyllabusWeek[]) => {
    if (!selectedVersionId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn version', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const syllabusToSave = data || syllabusData;

      const response = await fetch(`/api/tms/courses/${courseId}/syllabus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version_id: selectedVersionId,
          syllabus: syllabusToSave,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSnackbar({ open: true, message: 'Lưu giáo trình thành công!', severity: 'success' });
        // Refresh data
        const refreshResponse = await fetch(`/api/tms/courses/${courseId}`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success && refreshResult.data) {
          const course = refreshResult.data;
          const updatedVersions =
            course.CourseVersion?.map((v: any) => ({
              id: v.id.toString(),
              version: v.version,
              status: v.status,
              effective_from: v.effective_from,
              effective_to: v.effective_to,
              created_at: v.created_at,
              syllabus: v.CourseSyllabus?.flatMap((s: any) => {
                // syllabus_data is a JSONB array of weeks
                if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                  return s.syllabus_data.map((week: any) => ({
                    id: `${s.id}-${week.week_number}`,
                    week_number: week.week_number,
                    topic: week.topic,
                    teaching_methods: week.teaching_methods,
                    materials: week.materials,
                    assignments: week.assignments,
                    duration_hours: parseFloat(week.duration_hours || '3'),
                    is_exam_week: week.is_exam_week || false,
                  }));
                }
                return [];
              }) || [],
            })) || [];
          setCourseDetail((prev) => (prev ? { ...prev, versions: updatedVersions } : prev));
          const currentVersion = updatedVersions.find((v: CourseVersion) => v.id === selectedVersionId);
          if (currentVersion) {
            setSyllabusData(
              currentVersion.syllabus?.flatMap((s: any) => {
                if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                  return s.syllabus_data.map((week: any) => ({
                    id: `${s.id}-${week.week_number}`,
                    week_number: week.week_number,
                    topic: week.topic,
                    teaching_methods: week.teaching_methods,
                    materials: week.materials,
                    assignments: week.assignments,
                    duration_hours: parseFloat(week.duration_hours || '3'),
                    is_exam_week: week.is_exam_week || false,
                  }));
                }
                return [];
              }) || []
            );
          }
        }
      } else {
        setSnackbar({ open: true, message: result.error || 'Lỗi khi lưu giáo trình', severity: 'error' });
      }
    } catch (err) {
      console.error('Error saving syllabus:', err);
      setSnackbar({ open: true, message: 'Lỗi khi lưu dữ liệu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDialogSave = () => {
    if (editingIndex !== null) {
      // Already updated in state
      setOpenDialog(false);
      setEditingIndex(null);
    }
  };

  const handleSyllabusChange = (index: number, field: keyof SyllabusWeek, value: any) => {
    setSyllabusData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !courseDetail) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy học phần'}</Alert>
      </Box>
    );
  }

  const selectedVersion = courseDetail.versions?.find((v: CourseVersion) => v.id === selectedVersionId);

  const handleCreateNewVersion = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/tms/courses/${courseId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        setSnackbar({ open: true, message: 'Tạo version mới thành công!', severity: 'success' });
        
        // Refresh course data
        const refreshResponse = await fetch(`/api/tms/courses/${courseId}`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success && refreshResult.data) {
          const course = refreshResult.data;
          const updatedVersions =
            course.CourseVersion?.map((v: any) => ({
              id: v.id.toString(),
              version: v.version,
              status: v.status,
              effective_from: v.effective_from,
              effective_to: v.effective_to,
              created_at: v.created_at,
              syllabus: v.CourseSyllabus?.flatMap((s: any) => {
                if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                  return s.syllabus_data.map((week: any) => ({
                    id: `${s.id}-${week.week_number}`,
                    week_number: week.week_number,
                    topic: week.topic,
                    teaching_methods: week.teaching_methods,
                    materials: week.materials,
                    assignments: week.assignments,
                    duration_hours: parseFloat(week.duration_hours || '3'),
                    is_exam_week: week.is_exam_week || false,
                  }));
                }
                return [];
              }) || [],
            })) || [];
          setCourseDetail((prev) => (prev ? { ...prev, versions: updatedVersions } : prev));
          
          // Select the newly created version
          if (result.data?.id) {
            setSelectedVersionId(result.data.id);
            const newVersion = updatedVersions.find((v: CourseVersion) => v.id === result.data.id);
            if (newVersion) {
              setSyllabusData(newVersion.syllabus || []);
            }
          }
        }
      } else {
        setSnackbar({ open: true, message: result.error || 'Lỗi khi tạo version mới', severity: 'error' });
      }
    } catch (err) {
      console.error('Error creating version:', err);
      setSnackbar({ open: true, message: 'Lỗi khi tạo version mới', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/tms/courses/${courseId}`)}>
          Quay lại
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Xây dựng giáo trình
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {courseDetail.code} - {courseDetail.name_vi}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {courseDetail.versions && courseDetail.versions.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Version</InputLabel>
                <Select
                  value={selectedVersionId || ''}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  label="Version"
                >
                  {courseDetail.versions.map((v: CourseVersion) => (
                    <MenuItem key={v.id} value={v.id}>
                      Version {v.version} - {v.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateNewVersion}
              disabled={saving}
            >
              Tạo version mới
            </Button>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Danh sách tuần học" />
          <Tab label="Xem dạng bảng" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {syllabusData.map((week, index) => (
              <Card key={index} variant="outlined">
                <CardHeader
                  title={`Tuần ${week.week_number}${week.is_exam_week ? ' - Tuần thi' : ''}`}
                  action={
                    <Box>
                      <IconButton size="small" onClick={() => handleEditWeek(index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteWeek(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {week.topic || 'Chưa có chủ đề'}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Thời lượng
                      </Typography>
                      <Typography variant="body1">{week.duration_hours} giờ</Typography>
                    </Box>
                    {week.teaching_methods && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Phương pháp giảng dạy
                        </Typography>
                        <Typography variant="body1">{week.teaching_methods}</Typography>
                      </Box>
                    )}
                  </Box>
                  {week.materials && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tài liệu học tập
                      </Typography>
                      <Typography variant="body2">{week.materials}</Typography>
                    </Box>
                  )}
                  {week.assignments && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Bài tập
                      </Typography>
                      <Typography variant="body2">{week.assignments}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddWeek} sx={{ alignSelf: 'flex-start' }}>
              Thêm tuần học
            </Button>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => router.push(`/tms/courses/${courseId}`)}>Hủy</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave()} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu giáo trình'}
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tuần</TableCell>
                  <TableCell>Chủ đề</TableCell>
                  <TableCell>Phương pháp giảng dạy</TableCell>
                  <TableCell>Tài liệu</TableCell>
                  <TableCell>Bài tập</TableCell>
                  <TableCell>Thời lượng (giờ)</TableCell>
                  <TableCell>Tuần thi</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syllabusData.map((week, index) => (
                  <TableRow key={index}>
                    <TableCell>{week.week_number}</TableCell>
                    <TableCell>{week.topic}</TableCell>
                    <TableCell>{week.teaching_methods || '—'}</TableCell>
                    <TableCell>{week.materials || '—'}</TableCell>
                    <TableCell>{week.assignments || '—'}</TableCell>
                    <TableCell>{week.duration_hours}</TableCell>
                    <TableCell>
                      <Chip
                        label={week.is_exam_week ? 'Có' : 'Không'}
                        color={week.is_exam_week ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditWeek(index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteWeek(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? `Chỉnh sửa tuần ${syllabusData[editingIndex]?.week_number}` : 'Thêm tuần học mới'}
        </DialogTitle>
        <DialogContent>
          {editingIndex !== null && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Số tuần"
                type="number"
                value={syllabusData[editingIndex]?.week_number || 1}
                onChange={(e) => handleSyllabusChange(editingIndex, 'week_number', parseInt(e.target.value) || 1)}
                fullWidth
                required
              />
              <TextField
                label="Chủ đề"
                value={syllabusData[editingIndex]?.topic || ''}
                onChange={(e) => handleSyllabusChange(editingIndex, 'topic', e.target.value)}
                fullWidth
                required
                multiline
                rows={2}
              />
              <TextField
                label="Phương pháp giảng dạy"
                value={syllabusData[editingIndex]?.teaching_methods || ''}
                onChange={(e) => handleSyllabusChange(editingIndex, 'teaching_methods', e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Tài liệu học tập"
                value={syllabusData[editingIndex]?.materials || ''}
                onChange={(e) => handleSyllabusChange(editingIndex, 'materials', e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Bài tập"
                value={syllabusData[editingIndex]?.assignments || ''}
                onChange={(e) => handleSyllabusChange(editingIndex, 'assignments', e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Thời lượng (giờ)"
                  type="number"
                  value={syllabusData[editingIndex]?.duration_hours || 3}
                  onChange={(e) => handleSyllabusChange(editingIndex, 'duration_hours', parseFloat(e.target.value) || 3)}
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Tuần thi</InputLabel>
                  <Select
                    value={syllabusData[editingIndex]?.is_exam_week ? 'yes' : 'no'}
                    onChange={(e) => handleSyllabusChange(editingIndex, 'is_exam_week', e.target.value === 'yes')}
                    label="Tuần thi"
                  >
                    <MenuItem value="no">Không</MenuItem>
                    <MenuItem value="yes">Có</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleDialogSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

