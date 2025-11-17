'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// PermissionGuard removed - using session permissions directly
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Badge,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Stack,
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
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Domain as DomainIcon,
  Science as ScienceIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  COURSE_PRIORITIES,
  COURSE_STATUSES,
  WORKFLOW_STAGES,
  COURSE_PERMISSIONS,
  CoursePriority,
  CourseStatus,
  WorkflowStage,
  getCourseTypeLabel,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getWorkflowStageLabel,
  normalizeCoursePriority,
} from '@/constants/courses';

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

export default function SubjectApprovalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<CoursePriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0
  });
  const [processIndex, setProcessIndex] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState<boolean>(false);
  const [overrideSubjectId, setOverrideSubjectId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{ action: string; id: number } | null>(null);
  const [confirmTitle, setConfirmTitle] = useState<string>('Xác nhận thao tác');
  const [confirmDesc, setConfirmDesc] = useState<string>('Bạn có chắc muốn thực hiện thao tác này?');
  const [focusedStatus, setFocusedStatus] = useState<CourseStatus | null>(null);
  const [focusedStage, setFocusedStage] = useState<WorkflowStage | null>(null);

  // Helper function to check permissions
  const hasPermission = (permission: string): boolean => {
    return session?.user?.permissions?.includes(permission) || false;
  };

  const approvalSteps = [
    { label: 'Trưởng bộ môn', status: 'completed' },
    { label: 'Phòng đào tạo', status: 'active' },
    { label: 'Hội đồng khoa học', status: 'pending' },
  ];


  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tms/courses/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats({
          pending: result.data.pending || 0,
          reviewing: result.data.reviewing || 0,
          approved: result.data.approved || 0,
          rejected: result.data.rejected || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  const fetchSubjectsData = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        list: 'true'
      });
          
      const response = await fetch(`/api/tms/courses?${params}`);
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        const transformedSubjects = result.data.items.map((course: any) => {
          const status = (course.status || CourseStatus.DRAFT) as CourseStatus;
          // Use unified workflow data if available, fallback to legacy workflow
          const workflowStage = course.unified_workflow ? 
            (course.unified_workflow.workflow.steps.find(step => step.step_order === course.unified_workflow.current_step)?.step_name || WorkflowStage.FACULTY) :
            (course.workflows?.[0]?.workflow_stage || WorkflowStage.FACULTY) as WorkflowStage;
          const priority = normalizeCoursePriority(course.workflows?.[0]?.priority || course.priority);

          return {
            id: course.id,
            code: course.code,
            name: course.name_vi,
            faculty: course.OrgUnit?.name || 'Chưa xác định',
            status,
            workflowStage,
            priority,
            submittedBy: 'System', // TODO: Get from audit data
            submittedAt: new Date(course.created_at).toISOString().split('T')[0],
            currentReviewer: null, // TODO: Get from workflow data
            credits: course.credits,
            theory_credit: course.theory_credit || 0,
            practical_credit: course.practical_credit || 0,
            type: getCourseTypeLabel(course.type),
            category: 'Kiến thức chuyên ngành', // Default category
          };
        });
        
        setSubjects(transformedSubjects);
      } else {
        setError('Không thể tải danh sách học phần');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Lỗi khi tải dữ liệu');
    }
  };

// Fetch subjects from API
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data
      await Promise.all([
        fetchSubjectsData(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  const getProcessIndexBySubject = (subject: any): number => {
    if (subject?.status === CourseStatus.DRAFT) return 0; // Faculty Head
    if (subject?.status === CourseStatus.APPROVED) return 2; // Academic Board approved
    if (subject?.status === CourseStatus.PUBLISHED) return 2; // Board published

    switch (subject?.workflowStage) {
      case WorkflowStage.FACULTY: return 0;
      case WorkflowStage.ACADEMIC_OFFICE: return 1;
      case WorkflowStage.ACADEMIC_BOARD: return 2;
      default: return 0;
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesStatus = selectedStatus === 'all' || subject.status === selectedStatus;
    const matchesStage = selectedStage === 'all' || subject.workflowStage === selectedStage;
    const matchesPriority = selectedPriority === 'all' || subject.priority === selectedPriority;
    const matchesSearch = searchTerm === '' || 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesStage && matchesPriority && matchesSearch;
  });

  const handleViewDetails = (subject: any) => {
    router.push(`/tms/courses/${subject.id}`);
  };

  const openConfirm = (action: string, subjectId: number) => {
    setPendingAction({ action, id: subjectId });
    const titleMap: Record<string, string> = {
      approve: 'Xác nhận phê duyệt',
      reject: 'Xác nhận từ chối',
      review: 'Xác nhận xem xét',
      publish: 'Xác nhận xuất bản',
    };
    const descMap: Record<string, string> = {
      approve: 'Bạn muốn phê duyệt học phần này và chuyển sang bước tiếp theo?',
      reject: 'Bạn muốn từ chối học phần này?',
      review: 'Bạn muốn nhận và xem xét học phần này?',
      publish: 'Bạn muốn phê duyệt cuối/xuất bản học phần này?',
    };
    setConfirmTitle(titleMap[action] || 'Xác nhận thao tác');
    setConfirmDesc(descMap[action] || 'Bạn có chắc muốn thực hiện thao tác này?');
    setConfirmOpen(true);
  };

  const handleApprovalAction = async (action: string, subjectId: number) => {
    try {
      console.log(`Performing ${action} on subject ${subjectId}`);
      
      if (action === 'review') {
        const response = await fetch(`/api/tms/courses/${subjectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_action: 'review',
            status: CourseStatus.REVIEWING
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          await fetchSubjectsData();
          await fetchStats();
          alert('Đã chuyển sang trạng thái ĐANG XEM XÉT');
        } else {
          alert('Lỗi khi xem xét: ' + result.error);
        }
      }

      if (action === 'approve') {
        const response = await fetch(`/api/tms/courses/${subjectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_action: 'approve',
            status: CourseStatus.APPROVED
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          // Refresh the data
          await fetchSubjectsData();
          await fetchStats();
          alert('Phê duyệt thành công! Trạng thái: ĐÃ PHÊ DUYỆT');
        } else {
          alert('Lỗi khi phê duyệt: ' + result.error);
        }
      }
      
      if (action === 'publish') {
        const response = await fetch(`/api/tms/courses/${subjectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_action: 'final_approve',
            status: CourseStatus.PUBLISHED
          }),
        });

        const result = await response.json();

        if (result.success) {
          await fetchSubjectsData();
          await fetchStats();
          alert('Xuất bản thành công!');
        } else {
          alert('Lỗi khi xuất bản: ' + result.error);
        }
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error performing approval action:', error);
      alert('Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  const getActionButtons = (subject: any) => {
    const buttons = [];
    
    buttons.push(
      <Button
        key="view"
        size="small"
        startIcon={<VisibilityIcon />}
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(subject);
        }}
      >
        Xem
      </Button>
    );

    if (subject.status === CourseStatus.DRAFT) {
      // Allow Academic Office to "Xem xét" directly from DRAFT
      if (hasPermission(COURSE_PERMISSIONS.REVIEW)) {
        buttons.push(
          <Button
            key="review-draft"
            size="small"
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openConfirm('review', subject.id);
            }}
          >
            Xem xét
          </Button>
        );
      }
      if (hasPermission(COURSE_PERMISSIONS.APPROVE)) {
        buttons.push(
          <Button
            key="approve-draft"
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={(e) => {
              e.stopPropagation();
              // Nếu người dùng KHÔNG thuộc Phòng đào tạo (không có quyền REVIEW), hiển thị cảnh báo gợi ý
              if (!hasPermission(COURSE_PERMISSIONS.APPROVE)) {
                setOverrideSubjectId(subject.id);
                setOverrideDialogOpen(true);
                return;
              }
              openConfirm('approve', subject.id);
            }}
          >
            Phê duyệt
          </Button>
        );
      }
    }

    if (subject.status === CourseStatus.SUBMITTED && subject.workflowStage === WorkflowStage.ACADEMIC_OFFICE) {
      if (hasPermission(COURSE_PERMISSIONS.REVIEW)) {
        buttons.push(
          <Button
            key="review"
            size="small"
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openConfirm('review', subject.id);
            }}
          >
            Xem xét
          </Button>
        );
      }
      if (hasPermission(COURSE_PERMISSIONS.APPROVE)) {
        buttons.push(
          <Button
            key="approve-from-ao"
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openConfirm('approve', subject.id);
            }}
          >
            Phê duyệt
          </Button>
        );
      }
    }

    if (subject.status === CourseStatus.REVIEWING) {
      if (subject.workflowStage === WorkflowStage.ACADEMIC_OFFICE) {
        // Show both Xem xét and Phê duyệt at AO stage as well
        if (hasPermission(COURSE_PERMISSIONS.REVIEW)) {
          buttons.push(
            <Button
              key="review-ao"
              size="small"
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('review', subject.id);
              }}
            >
              Xem xét
            </Button>
          );
        }
        if (hasPermission(COURSE_PERMISSIONS.APPROVE)) {
          buttons.push(
            <Button
              key="approve"
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('approve', subject.id);
              }}
            >
              Phê duyệt
            </Button>
          );
        }
        if (hasPermission(COURSE_PERMISSIONS.REJECT)) {
          buttons.push(
            <Button
              key="reject"
              size="small"
              color="error"
              startIcon={<CancelIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('reject', subject.id);
              }}
            >
              Từ chối
            </Button>
          );
        }
      }
      if (subject.workflowStage === WorkflowStage.ACADEMIC_BOARD) {
        if (hasPermission(COURSE_PERMISSIONS.APPROVE)) {
          buttons.push(
            <Button
              key="board-approve"
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('approve', subject.id);
              }}
            >
              Thẩm định đạt
            </Button>
          );
        }
        if (hasPermission(COURSE_PERMISSIONS.REJECT)) {
          buttons.push(
            <Button
              key="board-reject"
              size="small"
              color="error"
              startIcon={<CancelIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('reject', subject.id);
              }}
            >
              Thẩm định không đạt
            </Button>
          );
        }
      }
    }

    if (subject.status === CourseStatus.APPROVED || subject.workflowStage === WorkflowStage.ACADEMIC_BOARD) {
      if (hasPermission(COURSE_PERMISSIONS.PUBLISH)) {
        buttons.push(
          <Button
            key="publish"
            size="small"
            variant="contained"
            color="info"
            startIcon={<PublishIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openConfirm('publish', subject.id);
            }}
          >
            Phê duyệt cuối / Xuất bản
          </Button>
        );
      }
    }

    return buttons;
  };

  // Check if user has permission to view this page
  if (!hasPermission(COURSE_PERMISSIONS.APPROVE)) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '98vw', px: 1, py: 4 }}>
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Typography variant="h6" color="error">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: '98vw', px: 1, py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              color="inherit"
              href="/tms"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              TMS
            </Link>
            <Link
              color="inherit"
              href="/tms/courses"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Học phần
            </Link>
            <Typography color="text.primary">Phê duyệt</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" component="h1" gutterBottom>
            <AssessmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Phê duyệt học phần
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem xét và phê duyệt các học phần trong hệ thống
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setShowGuide((v) => !v)}
            >
              {showGuide ? 'Ẩn hướng dẫn quy trình' : 'Hiển thị hướng dẫn quy trình'}
            </Button>
          </Box>

          <Collapse in={showGuide} timeout="auto" unmountOnExit>
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'primary.light' }}>
              <CardHeader
                avatar={<SecurityIcon color="primary" />}
                title="Hướng dẫn phê duyệt học phần"
                subheader="Quy trình và phân quyền theo từng cấp"
              />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Quy trình */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Quy trình phê duyệt
                    </Typography>
                    <Stepper orientation="vertical" sx={{ mt: 1 }}>
                      <Step>
                        <StepLabel>
                          <Typography variant="body2" fontWeight="bold">Bước 1: Khoa khởi tạo</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tạo và hoàn thiện thông tin học phần
                          </Typography>
                        </StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>
                          <Typography variant="body2" fontWeight="bold">Bước 2: Phòng Đào tạo xem xét</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Phòng Đào tạo xem xét và phê duyệt
                          </Typography>
                        </StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>
                          <Typography variant="body2" fontWeight="bold">Bước 3: Hội đồng khoa học công bố</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hội đồng khoa học công bố học phần
                          </Typography>
                        </StepLabel>
                      </Step>
                    </Stepper>
                  </Grid>

                  {/* Phân quyền */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Phân quyền theo Role
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Role</TableCell>
                            <TableCell align="center">Submit</TableCell>
                            <TableCell align="center">Approve</TableCell>
                            <TableCell align="center">Reject</TableCell>
                            <TableCell align="center">Request Edit</TableCell>
                            <TableCell align="center">Publish</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell><Chip label="Khoa" size="small" variant="outlined" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><Chip label="Phòng Đào tạo" size="small" variant="outlined" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><Chip label="Hội đồng KH" size="small" variant="outlined" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><Chip label="Admin" size="small" color="primary" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                            <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom color="primary">
                  Lưu ý quan trọng
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="info" fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Quy trình 3 bước: Khoa → Phòng ĐT → Hội đồng KH" 
                      secondary="Mỗi bước có quyền hạn riêng, không thể bỏ qua" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="info" fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Thời gian xử lý quy định" 
                      secondary="Khoa: 5 ngày, Phòng ĐT: 7 ngày, HĐKH: 3 ngày làm việc" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="info" fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Chỉ Hội đồng khoa học mới có quyền công bố" 
                      secondary="Đảm bảo chất lượng học phần trước khi xuất bản chính thức" 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Collapse>
        </Box>

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Đang tải danh sách học phần...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
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
              onChange={(e) => setSelectedStatus(e.target.value as CourseStatus | 'all')}
              label="Trạng thái"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {COURSE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Giai đoạn</InputLabel>
            <Select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as WorkflowStage | 'all')}
              label="Giai đoạn"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {WORKFLOW_STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {getWorkflowStageLabel(stage)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Độ ưu tiên</InputLabel>
            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as CoursePriority | 'all')}
              label="Độ ưu tiên"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {COURSE_PRIORITIES.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {getPriorityLabel(priority)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setSelectedStatus('all');
              setSelectedStage('all');
              setSelectedPriority('all');
              setSearchTerm('');
            }}
          >
            Xóa bộ lọc
          </Button>
        </Box>
      </Paper>

      {/* Approval Process Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quy trình phê duyệt
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Enhanced animated progress bar with icons and knob */}
        <Box sx={{ position: 'relative', px: 1, py: 3 }}>
          {(() => {
            const progress = (() => {
              switch (focusedStatus) {
                case 'DRAFT': return 0;
                case 'REVIEWING': return 33.33;
                case 'APPROVED': return 66.66;
                case 'PUBLISHED': return 100;
                default: return 0;
              }
            })();
            const stages = [
              { label: 'Giảng viên soạn thảo', Icon: DescriptionIcon, status: 'DRAFT' },
              { label: 'Khoa xem xét', Icon: SchoolIcon, status: 'REVIEWING' },
              { label: 'Phòng đào tạo phê duyệt', Icon: DomainIcon, status: 'APPROVED' },
              { label: 'Hội đồng khoa học công bố', Icon: ScienceIcon, status: 'PUBLISHED' },
            ];
            return (
              <>
                {/* Keyframes */}
                <Box sx={{
                  '@keyframes glow': {
                    '0%': { boxShadow: '0 0 0 0 rgba(25,118,210,0.5)' },
                    '70%': { boxShadow: '0 0 0 12px rgba(25,118,210,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(25,118,210,0)' },
                  },
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.06)' },
                    '100%': { transform: 'scale(1)' },
                  }
                }} />

                {/* Track */}
                <Box sx={{ position: 'relative', height: 10, bgcolor: 'action.hover', borderRadius: 9999 }}>
                  {/* Fill */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: 10,
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #42a5f5 0%, #1e88e5 50%, #1565c0 100%)',
                      borderRadius: 9999,
                      transition: 'width 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />

                  {/* Knob removed per request */}
                </Box>

                {/* Stage markers */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                  {stages.map((s, idx) => {
                    const ActiveIcon = s.Icon as any;
                    const isCurrent = focusedStatus === s.status;
                    const isCompleted = (() => {
                      switch (focusedStatus) {
                        case 'DRAFT': return idx === 0;
                        case 'REVIEWING': return idx <= 1;
                        case 'APPROVED': return idx <= 2;
                        case 'PUBLISHED': return idx <= 3;
                        default: return false;
                      }
                    })();
                    const isActive = isCurrent || isCompleted;
                    
                    return (
                      <Box key={s.label} sx={{ textAlign: 'center', minWidth: 0 }}>
                        <Box sx={{ position: 'relative', height: 28 }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'primary.main' : 'divider',
                              color: isActive ? 'primary.contrastText' : 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 250ms ease',
                              animation: isCurrent ? 'pulse 1.8s infinite ease-in-out' : 'none',
                            }}
                          >
                            <ActiveIcon sx={{ fontSize: 16 }} />
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: isCurrent ? 600 : 400 }}>
                          {s.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
                {(() => {
                  let note: string | null = null;
                  switch (focusedStatus) {
                    case 'DRAFT':
                      note = 'Giảng viên đang soạn thảo khóa học';
                      break;
                    case 'REVIEWING':
                      note = 'Khoa đang xem xét và thẩm định';
                      break;
                    case 'APPROVED':
                      note = 'Phòng đào tạo đã phê duyệt';
                      break;
                    case 'PUBLISHED':
                      note = 'Hội đồng khoa học đã công bố';
                      break;
                  }
                })()}
              </>
            );
          })()}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">Chờ duyệt</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">{stats.reviewing}</Typography>
              <Typography variant="body2" color="text.secondary">Đang xem xét</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">{stats.approved}</Typography>
              <Typography variant="body2" color="text.secondary">Đã phê duyệt</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">{stats.rejected}</Typography>
              <Typography variant="body2" color="text.secondary">Từ chối</Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Subjects Table */}
      {!loading && !error && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Danh sách học phần ({filteredSubjects.length})
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
                <TableCell align="center">Giai đoạn</TableCell>
                <TableCell align="center">Độ ưu tiên</TableCell>
                <TableCell>Người gửi</TableCell>
                <TableCell>Ngày gửi</TableCell>
                <TableCell>Người xem xét</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow 
                  key={subject.id} 
                  hover
                  onClick={() => {
                    setProcessIndex(getProcessIndexBySubject(subject));
                    setFocusedStage(subject.workflowStage);
                    setFocusedStatus(subject.status);
                  }}
                  sx={{ cursor: 'default' }}
                >
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {subject.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {subject.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subject.type}
                    </Typography>
                  </TableCell>
                  <TableCell>{subject.faculty}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        Tổng: {subject.credits} tín chỉ
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`LT: ${formatCredit(subject.theory_credit)}`} 
                          size="small" 
                          variant="outlined" 
                          color="info"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Chip 
                          label={`TH: ${formatCredit(subject.practical_credit)}`} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={subject.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(subject.status)}
                      color={getStatusColor(subject.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getWorkflowStageLabel(subject.workflowStage)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getPriorityLabel(subject.priority)}
                      color={getPriorityColor(subject.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        {subject.submittedBy.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{subject.submittedBy}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{subject.submittedAt}</Typography>
                  </TableCell>
                  <TableCell>
                    {subject.currentReviewer ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                          {subject.currentReviewer.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{subject.currentReviewer}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Chưa phân công
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {getActionButtons(subject)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Paper>
      )}

      {/* Subject Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết học phần: {selectedSubject?.code} - {selectedSubject?.name}
        </DialogTitle>
        <DialogContent>
          {selectedSubject && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Mã học phần:</Typography>
                    <Typography variant="body1">{selectedSubject.code}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tên học phần:</Typography>
                    <Typography variant="body1">{selectedSubject.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Khoa:</Typography>
                    <Typography variant="body1">{selectedSubject.faculty}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Danh mục:</Typography>
                    <Typography variant="body1">{selectedSubject.category}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tín chỉ:</Typography>
                    <Typography variant="body1">{selectedSubject.credits}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Loại:</Typography>
                    <Typography variant="body1">{selectedSubject.type}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                    <Chip
                      label={getStatusLabel(selectedSubject.status)}
                      color={getStatusColor(selectedSubject.status) as any}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Giai đoạn:</Typography>
                    <Typography variant="body1">{getWorkflowStageLabel(selectedSubject.workflowStage)}</Typography>
                  </Box>
                </Box>
              </Box>

              {selectedSubject.status === 'REJECTED' && selectedSubject.rejectionReason && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Lý do từ chối:</Typography>
                  <Typography variant="body2">{selectedSubject.rejectionReason}</Typography>
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lịch sử phê duyệt
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tạo mới"
                      secondary={`Bởi ${selectedSubject.submittedBy} vào ${selectedSubject.submittedAt}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Đang chờ duyệt"
                      secondary={`Tại ${getWorkflowStageLabel(selectedSubject.workflowStage)}`}
                    />
                  </ListItem>
                </List>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Ghi chú và bình luận
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Thêm ghi chú..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button startIcon={<CommentIcon />} size="small">
                          Thêm
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Thực hiện thao tác
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override Suggestion Dialog for Draft approval by non-AO role */}
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Phê duyệt ở bước Khoa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Người dùng hiện không thuộc <strong>Phòng đào tạo</strong>. Nên để <strong>Phòng đào tạo</strong> xem xét ở bước tiếp theo.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Bạn vẫn có thể phê duyệt để chuyển hồ sơ sang <strong>Phòng đào tạo</strong> ngay bây giờ.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Hủy</Button>
          {hasPermission(COURSE_PERMISSIONS.APPROVE) && (
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                if (overrideSubjectId) {
                  await handleApprovalAction('approve', overrideSubjectId);
                }
                setOverrideDialogOpen(false);
                setOverrideSubjectId(null);
              }}
            >
              Vẫn phê duyệt
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Global Confirm Dialog for all actions */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">{confirmDesc}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (pendingAction) {
                await handleApprovalAction(pendingAction.action, pendingAction.id);
              }
              setConfirmOpen(false);
              setPendingAction(null);
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
  );
}
