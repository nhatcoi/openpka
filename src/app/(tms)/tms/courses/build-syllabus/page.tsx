'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  Search as SearchIcon,
  BookOnline as BookOnlineIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  getStatusColor,
  getStatusLabel,
} from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';

interface Course {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string;
  credits: number;
  type: string;
  status: string;
  created_at: string;
  OrgUnit?: {
    name: string;
  };
}

export default function BuildSyllabusPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      console.error('Error fetching faculties:', err);
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
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedFaculty !== 'all' && { orgUnitId: selectedFaculty }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });

      const response = await fetch(`/api/tms/courses?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch courses');
      }

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
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [page, selectedStatus, selectedFaculty, debouncedSearchTerm]);

  const handleSelectCourse = (courseId: number) => {
    router.push(`/tms/courses/${courseId}/syllabus`);
  };

  if (loading && courses.length === 0) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/tms/courses')}>
          Quay lại
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <BookOnlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Xây dựng giáo trình
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chọn học phần để xây dựng giáo trình
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Tìm kiếm theo mã hoặc tên học phần..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={selectedStatus}
              label="Trạng thái"
              onChange={(e) => {
                setSelectedStatus(e.target.value as string | 'all');
                setPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value={WorkflowStatus.DRAFT}>Bản nháp</MenuItem>
              <MenuItem value={WorkflowStatus.REVIEWING}>Đang xem xét</MenuItem>
              <MenuItem value={WorkflowStatus.APPROVED}>Đã phê duyệt</MenuItem>
              <MenuItem value={WorkflowStatus.PUBLISHED}>Đã công bố</MenuItem>
              <MenuItem value={WorkflowStatus.REJECTED}>Bị từ chối</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Khoa</InputLabel>
            <Select
              value={selectedFaculty}
              label="Khoa"
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {faculties.map((faculty) => (
                <MenuItem key={faculty.id} value={faculty.id.toString()}>
                  {faculty.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Course List - Card View */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : courses.length === 0 ? (
          <Alert severity="info">
            Không tìm thấy học phần nào. Vui lòng thử lại với bộ lọc khác.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2 }}>
              {courses.map((course) => (
                <Card
                  key={course.id}
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleSelectCourse(course.id)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6" component="div" fontWeight="bold">
                          {course.code}
                        </Typography>
                        <Chip
                          label={getStatusLabel(course.status)}
                          color={getStatusColor(course.status) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body1" gutterBottom>
                        {course.name_vi}
                      </Typography>
                      {course.name_en && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {course.name_en}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {course.OrgUnit?.name || '—'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Tín chỉ:</strong> {course.credits}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

