'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Badge,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  Pagination,
  CircularProgress,
  Snackbar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Publish as PublishIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  CourseWorkflowStage,
  getCourseWorkflowStageLabel,
} from '@/constants/workflow-statuses';
import {
  COURSE_WORKFLOW_STATUS_OPTIONS,
  getCourseTypeLabel,
  getStatusColor,
  getStatusLabel,
  getRawCourseStatuses,
  normalizeCourseWorkflowStatus,
} from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';

interface Course {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string;
  credits: number;
  theory_credit?: number;
  practical_credit?: number;
  type: string;
  status: string;
  workflow_stage: string;
  workflow_priority?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  OrgUnit?: {
    name: string;
  };
}

// Helper function to format decimal values
const formatCredit = (value: any): string => {
  if (value === null || value === undefined) return '0';
  
  // Handle Decimal objects from Prisma
  if (typeof value === 'object' && value.toNumber) {
    return value.toNumber().toString();
  }
  
  // Handle string numbers
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? '0' : num.toString();
  }
  
  // Handle regular numbers
  if (typeof value === 'number') {
    return value.toString();
  }
  
  return '0';
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Fetch faculties from API
  const fetchFaculties = async () => {
    try {
      const response = await fetch('/api/tms/faculties');
      const result = await response.json();

      if (response.ok) {
        setFaculties(result.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch faculties:', err);
    }
  };

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (selectedFaculty !== 'all') {
        params.append('orgUnitId', selectedFaculty);
      }

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (selectedStatus !== 'all') {
        const rawStatuses = getRawCourseStatuses(selectedStatus);
        if (rawStatuses.length === 1) {
          params.append('status', rawStatuses[0]);
        }
      }

      const response = await fetch(`/api/tms/courses?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch courses');
      }

      // Use the new API structure with data.items
      if (result.success && result.data) {
        setCourses(result.data.items || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [page, selectedStatus, selectedFaculty, debouncedSearchTerm]);

  const filteredCourses = useMemo(() => {
    if (selectedStatus === 'all') return courses;
    return courses.filter((course) => normalizeCourseWorkflowStatus(course.status) === selectedStatus);
  }, [courses, selectedStatus]);

  const handleViewDetails = (course: Course) => {
    router.push(`/tms/courses/${course.id}`);
  };

  const handleEditCourse = (course: Course) => {
    router.push(`/tms/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học phần này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tms/courses/${courseId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete course');
      }

      // Check if deletion was successful
      if (result.success) {
        setSuccessMessage('Xóa học phần thành công!');
        setShowSnackbar(true);
        // Refresh courses list
        fetchCourses();
      } else {
        throw new Error(result.error || 'Failed to delete course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleWorkflowAction = (action: string, subjectId: number) => {
    console.log(`Performing ${action} on subject ${subjectId}`);
  };

  const getActionButtons = (subject: any) => {
    const buttons = [];
    
    buttons.push(
      <Button
        key="view"
        size="small"
        startIcon={<VisibilityIcon />}
        onClick={() => handleViewDetails(subject)}
      >
        Xem
      </Button>
    );

    if (subject.status === WorkflowStatus.REVIEWING) {
      buttons.push(
        <Button
          key="review"
          size="small"
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={() => handleWorkflowAction('review', subject.id)}
        >
          Xem xét
        </Button>
      );
    }

    if (subject.status === WorkflowStatus.REVIEWING) {
      if (subject.workflowStage === CourseWorkflowStage.ACADEMIC_OFFICE) {
        buttons.push(
          <Button
            key="approve"
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleWorkflowAction('approve', subject.id)}
          >
            Phê duyệt
          </Button>
        );
        buttons.push(
          <Button
            key="reject"
            size="small"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleWorkflowAction('reject', subject.id)}
          >
            Từ chối
          </Button>
        );
      }
    }

    if (subject.status === WorkflowStatus.APPROVED) {
      buttons.push(
        <Button
          key="publish"
          size="small"
          variant="contained"
          color="info"
          startIcon={<PublishIcon />}
          onClick={() => handleWorkflowAction('publish', subject.id)}
        >
          Xuất bản
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/tms"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          TMS
        </Link>
        <Typography color="text.primary">Học phần</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AssignmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Quản lý học phần
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý và theo dõi các học phần trong hệ thống
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Học phần ({filteredCourses.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/tms/courses/create')}
          >
            Tạo học phần mới
          </Button>
        </Stack>
      </Paper>

      {/* Search and Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Tìm kiếm học phần..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as WorkflowStatus | 'all')}
              label="Trạng thái"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {COURSE_WORKFLOW_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Khoa</InputLabel>
            <Select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              label="Khoa"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <MenuItem value="all">Tất cả khoa</MenuItem>
              {faculties.map((faculty) => (
                <MenuItem key={faculty.id} value={faculty.id}>
                  {faculty.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setSelectedStatus('all');
              setSelectedFaculty('all');
              setSearchTerm('');
              setDebouncedSearchTerm('');
            }}
          >
            Xóa bộ lọc
          </Button>
        </Box>
      </Paper>

      {/* Subjects Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách học phần
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã môn</TableCell>
                <TableCell>Tên học phần</TableCell>
                <TableCell>Khoa</TableCell>
                <TableCell>Tín chỉ</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell>Ngày gửi</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography>Đang tải...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Không có học phần nào</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => {
                  const courseTypeLabel = getCourseTypeLabel(course.type);
                  return (
                  <TableRow 
                    key={course.id} 
                    hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/tms/courses/${course.id}`)}
                >
                  <TableCell>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold"
                      sx={{ 
                        cursor: 'pointer', 
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tms/courses/${course.id}`);
                      }}
                    >
                      {course.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tms/courses/${course.id}`);
                      }}
                    >
                      {course.name_vi}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {courseTypeLabel}
                    </Typography>
                  </TableCell>
                  <TableCell>{course.OrgUnit?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        Tổng: {course.credits} tín chỉ
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`LT: ${formatCredit(course.theory_credit)}`} 
                          size="small" 
                          variant="outlined" 
                          color="info"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Chip 
                          label={`TH: ${formatCredit(course.practical_credit)}`} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label="Kiến thức chuyên ngành" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(course.status)}
                      color={getStatusColor(course.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {course.created_at ? new Date(course.created_at).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tms/courses/${course.id}`);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tms/courses/${course.id}`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Paper>


      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={successMessage}
      />
    </Container>
  );
}
