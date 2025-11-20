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
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Badge,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Breadcrumbs,
  Link
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CourseWorkflowStage,
  getCourseWorkflowStageLabel,
} from '@/constants/workflow-statuses';
import {
  COURSE_WORKFLOW_STATUS_OPTIONS,
  CoursePrerequisiteType,
  CoursePriority,
  CourseType,
  getCourseTypeLabel,
  getPrereqChipColor,
  getPrereqLabelVi,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  normalizeCoursePriority,
} from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';

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

interface CourseDetail {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  credits: number;
  theory_credit?: number;
  practical_credit?: number;
  type: CourseType | string;
  status: string;
  org_unit_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  OrgUnit?: {
    name: string;
    code?: string;
  };
  workflows?: Array<{
    id: string;
    status: string;
    workflow_stage: CourseWorkflowStage | string;
    priority: CoursePriority | string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;
  contents?: Array<{
    id: string;
    prerequisites?: string;
    learning_objectives?: Array<{
      type: string;
      objective: string;
    }>;
    assessment_methods?: Array<{
      method: string;
      weight: number;
  description: string;
    }>;
    passing_grade: number;
    created_at: string;
    updated_at: string;
  }>;
  course_approval_history?: Array<{
    id: string;
    action: string;
    from_status: string;
    to_status: string;
    reviewer_role: string;
    comments: string;
    created_at: string;
  }>;
  // Unified workflow data
  unified_workflow?: {
    id: string;
    status: string;
    current_step: number;
    initiated_at: string;
    completed_at?: string;
    workflow: {
      workflow_name: string;
      steps: Array<{
        step_order: number;
        step_name: string;
        approver_role: string;
        timeout_days: number;
      }>;
    };
    approval_records: Array<{
      id: string;
      action: string;
      comments?: string;
      approved_at?: string;
      approver: {
        id: string;
        full_name: string;
        email: string;
      };
    }>;
  };
  instructor_qualifications?: any[];
  course_syllabus?: any[];
  prerequisites?: Array<{
    id: string;
    course_id: string;
    prerequisite_course_id: string;
    prerequisite_type: string;
    description?: string;
    created_at: string;
    prerequisite_course?: {
      id: string;
      code: string;
      name_vi: string;
    };
  }>;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const routeId = routeParams?.id as string;
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userRoles, setUserRoles] = useState<Array<{ name: string; description?: string }>>([]);
  const hasAcademicBoardRole = userRoles.some(r => r.name === 'academic_board');
  
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [draftChanges, setDraftChanges] = useState<any[]>([]);
  const [editingAssessment, setEditingAssessment] = useState(false);
  const [assessmentMethods, setAssessmentMethods] = useState<any[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<any[]>([]);
  const [openAssessmentModal, setOpenAssessmentModal] = useState(false);
  const [openObjectivesModal, setOpenObjectivesModal] = useState(false);
  const [openBasicInfoModal, setOpenBasicInfoModal] = useState(false);
  const [openPrerequisiteModal, setOpenPrerequisiteModal] = useState(false);
  const [editingPrerequisite, setEditingPrerequisite] = useState<any | null>(null);
  const [prerequisiteForm, setPrerequisiteForm] = useState({
    prerequisite_course_id: '',
    prerequisite_type: CoursePrerequisiteType.PREREQUISITE,
    description: ''
  });
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    if (openBasicInfoModal && courseDetail) {
      setEditData({
        name_vi: courseDetail.name_vi || '',
        name_en: courseDetail.name_en || '',
        code: courseDetail.code || '',
        credits: courseDetail.credits || 0,
        theory_credit: courseDetail.theory_credit || null,
        practical_credit: courseDetail.practical_credit || null,
        description: courseDetail.description || '',
        status: courseDetail.status || WorkflowStatus.DRAFT,
        org_unit_id: courseDetail.org_unit_id || '',
        type: courseDetail.type || ''
      });
    }
  }, [openBasicInfoModal, courseDetail]);

  
  const [editData, setEditData] = useState({
    name_vi: '',
    name_en: '',
    code: '',
    credits: 0,
    theory_credit: null as number | null,
    practical_credit: null as number | null,
    description: '',
    status: '',
    org_unit_id: '',
    type: ''
  });

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await fetch('/api/tms/courses/list?limit=100');
        const result = await response.json();
        if (result.success && result.data?.items) {
          const filtered = result.data.items.filter((c: any) => c.id !== routeId);
          setCoursesList(filtered);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };
    if (openPrerequisiteModal) {
      fetchCourses();
    }
  }, [openPrerequisiteModal, routeId]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesRes = await fetch('/api/hr/user-roles/current');
        const rolesJson: { success: boolean; data?: Array<{ role?: { name?: string; description?: string } }> } = await rolesRes.json();
        if (rolesJson?.success && Array.isArray(rolesJson.data)) {
          const roles: Array<{ name: string; description?: string }> = rolesJson.data
            .map((ur) => ({ name: ur?.role?.name || '', description: ur?.role?.description }))
            .filter((r) => !!r.name);
          const uniqueByName = Array.from(new Map(roles.map((r) => [r.name, r])).values());
          setUserRoles(uniqueByName);
        }
      } catch (e) {
        console.error('Failed to fetch user roles', e);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!courseDetail) return;
    setEditData({
      name_vi: courseDetail.name_vi || '',
      name_en: courseDetail.name_en || '',
      code: courseDetail.code || '',
      credits: courseDetail.credits || 0,
      theory_credit: courseDetail.theory_credit || null,
      practical_credit: courseDetail.practical_credit || null,
      description: courseDetail.description || '',
      status: courseDetail.status || '',
      org_unit_id: courseDetail.org_unit_id || '',
      type: courseDetail.type || ''
    });

    if (!editingAssessment) {
      setAssessmentMethods(courseDetail.contents?.[0]?.assessment_methods || []);
      setLearningObjectives(courseDetail.contents?.[0]?.learning_objectives || []);
    }
  }, [courseDetail]);


  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/tms/courses/${routeId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const courseData = result.data;

          const versions = Array.isArray(courseData.CourseVersion) ? courseData.CourseVersion : [];
          // Flatten syllabus_data from JSONB - each CourseSyllabus row contains an array of weeks
          const syllabusApi = versions
            .flatMap((v: any) => 
              Array.isArray(v.CourseSyllabus) 
                ? v.CourseSyllabus.flatMap((s: any) => {
                    // syllabus_data is a JSONB array of weeks
                    if (s.syllabus_data && Array.isArray(s.syllabus_data)) {
                      return s.syllabus_data;
                    }
                    return [];
                  })
                : []
            )
            .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0));

          const transformedCourse: CourseDetail = {
            ...courseData,
            id: courseData.id.toString(),
            org_unit_id: courseData.org_unit_id?.toString(),
            course_syllabus: syllabusApi,
          };
          
          setCourseDetail(transformedCourse);
        } else {
          setError('Không thể tải thông tin học phần');
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

      if (routeId) {
        fetchCourseDetail();
      }
    }, [routeId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/tms/courses/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editData,
          status: WorkflowStatus.REVIEWING,
          workflow_stage: CourseWorkflowStage.ACADEMIC_OFFICE
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCourseDetail(prev => prev ? {
          ...prev,
          name_vi: editData.name_vi,
          name_en: editData.name_en,
          code: editData.code,
          credits: editData.credits,
          description: editData.description
        } : null);
        
        setToast({ open: true, message: 'Đã gửi yêu cầu phê duyệt!', severity: 'success' });
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lưu thông tin');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu thông tin');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDraft = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/tms/courses/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: WorkflowStatus.REVIEWING, workflow_stage: CourseWorkflowStage.ACADEMIC_OFFICE })
      });
      const result = await response.json();
      if (result.success) {
        setCourseDetail(prev => prev ? {
          ...prev,
          status: WorkflowStatus.REVIEWING,
          // Update unified workflow status
          unified_workflow: prev.unified_workflow ? {
            ...prev.unified_workflow,
            status: 'IN_PROGRESS'
          } : prev.unified_workflow,
          workflows: prev.workflows ? [{
            ...prev.workflows[0],
            status: WorkflowStatus.REVIEWING,
            workflow_stage: CourseWorkflowStage.ACADEMIC_OFFICE
          }, ...prev.workflows.slice(1)] : prev.workflows
        } : prev);
        setToast({ open: true, message: 'Đã gửi xem xét. Học phần chuyển sang trạng thái Đang xem xét.', severity: 'success' });
      } else {
        setError(result.error || 'Không thể gửi yêu cầu');
      }
    } catch (err) {
      setError('Có lỗi khi gửi yêu cầu');
      console.error('Request draft error:', err);
    } finally {
      setSaving(false);
    }
  };



  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch org units for dropdown
  const fetchOrgUnits = async () => {
    try {
      const response = await fetch('/api/org/units?limit=100');
      const result = await response.json();
      if (result.success) {
        setOrgUnits(result.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch org units:', error);
    }
  };

  const handleAssessmentMethodChange = (index: number, field: string, value: any) => {
    setAssessmentMethods(prev => prev.map((method, i) => 
      i === index ? { ...method, [field]: value } : method
    ));
  };

  const addAssessmentMethod = () => {
    setAssessmentMethods(prev => [...prev, {
      method: 'assignment',
      weight: 0,
      description: ''
    }]);
  };

  const removeAssessmentMethod = (index: number) => {
    setAssessmentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const handleLearningObjectiveChange = (index: number, field: string, value: string) => {
    setLearningObjectives(prev => prev.map((objective, i) => 
      i === index ? { ...objective, [field]: value } : objective
    ));
  };

  const addLearningObjective = () => {
    setLearningObjectives(prev => [...prev, {
      type: 'knowledge',
      objective: ''
    }]);
  };

  const removeLearningObjective = (index: number) => {
    setLearningObjectives(prev => prev.filter((_, i) => i !== index));
  };

  const handleAssessmentSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/tms/courses/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_methods: assessmentMethods,
          learning_objectives: learningObjectives
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Cập nhật courseDetail với dữ liệu mới
        setCourseDetail(result.data);
        
        // Cập nhật local state để hiển thị ngay lập tức
        const newAssessmentMethods = result.data.contents?.[0]?.assessment_methods || [];
        const newLearningObjectives = result.data.contents?.[0]?.learning_objectives || [];
        
        setAssessmentMethods(newAssessmentMethods);
        setLearningObjectives(newLearningObjectives);
        
        setOpenAssessmentModal(false);
        alert('Cập nhật thành công!');
      } else {
        alert('Lỗi khi cập nhật: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleObjectivesSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/tms/courses/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learning_objectives: learningObjectives
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCourseDetail(result.data);
        const newLearningObjectives = result.data.contents?.[0]?.learning_objectives || [];
        setLearningObjectives(newLearningObjectives);
        setOpenObjectivesModal(false);
        alert('Cập nhật thành công!');
      } else {
        alert('Lỗi khi cập nhật: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving objectives:', error);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleBasicInfoSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/tms/courses/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_vi: editData.name_vi,
          name_en: editData.name_en,
          code: editData.code,
          credits: editData.credits,
          theory_credit: editData.theory_credit,
          practical_credit: editData.practical_credit,
          description: editData.description,
          status: editData.status,
          org_unit_id: editData.org_unit_id,
          type: editData.type
        })
      });
      const result = await response.json();
      if (result.success) {
        setCourseDetail(result.data);
        setOpenBasicInfoModal(false);
        setToast({ open: true, message: 'Cập nhật thông tin cơ bản thành công!', severity: 'success' });
      } else {
        setError(result.error || 'Có lỗi khi cập nhật thông tin');
        setToast({ open: true, message: result.error || 'Có lỗi khi cập nhật', severity: 'error' });
      }
    } catch (error) {
      setError('Có lỗi khi cập nhật thông tin');
      setToast({ open: true, message: 'Có lỗi khi cập nhật thông tin', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Đang tải thông tin học phần...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !courseDetail) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Không tìm thấy thông tin học phần'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </Container>
    );
  }
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenPrerequisiteModal = (prereq?: any) => {
    if (prereq) {
      setEditingPrerequisite(prereq);
      setPrerequisiteForm({
        prerequisite_course_id: prereq.prerequisite_course_id,
        prerequisite_type: prereq.prerequisite_type,
        description: prereq.description || ''
      });
    } else {
      setEditingPrerequisite(null);
      setPrerequisiteForm({
        prerequisite_course_id: '',
        prerequisite_type: CoursePrerequisiteType.PREREQUISITE,
        description: ''
      });
    }
    setOpenPrerequisiteModal(true);
  };

  const handleClosePrerequisiteModal = () => {
    setOpenPrerequisiteModal(false);
    setEditingPrerequisite(null);
    setPrerequisiteForm({
      prerequisite_course_id: '',
      prerequisite_type: CoursePrerequisiteType.PREREQUISITE,
      description: ''
    });
  };

  const handleSavePrerequisite = async () => {
    if (!prerequisiteForm.prerequisite_course_id) {
      setToast({ open: true, message: 'Vui lòng chọn học phần điều kiện', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const url = editingPrerequisite
        ? `/api/tms/courses/${routeId}/prerequisites/${editingPrerequisite.id}`
        : `/api/tms/courses/${routeId}/prerequisites`;
      const method = editingPrerequisite ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prerequisite_course_id: prerequisiteForm.prerequisite_course_id,
          prerequisite_type: prerequisiteForm.prerequisite_type,
          description: prerequisiteForm.description || null
        })
      });

      const result = await response.json();

      if (response.ok) {
        const courseResponse = await fetch(`/api/tms/courses/${routeId}`);
        const courseResult = await courseResponse.json();
        if (courseResult.success && courseResult.data) {
          setCourseDetail(courseResult.data);
        }
        handleClosePrerequisiteModal();
        setToast({
          open: true,
          message: editingPrerequisite ? 'Cập nhật điều kiện thành công!' : 'Thêm điều kiện thành công!',
          severity: 'success'
        });
      } else {
        setToast({ open: true, message: result.error || 'Có lỗi xảy ra', severity: 'error' });
      }
    } catch (error) {
      setToast({ open: true, message: 'Có lỗi xảy ra khi lưu điều kiện', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrerequisite = async (prereqId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa điều kiện này?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/tms/courses/${routeId}/prerequisites/${prereqId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        const courseResponse = await fetch(`/api/tms/courses/${routeId}`);
        const courseResult = await courseResponse.json();
        if (courseResult.success && courseResult.data) {
          setCourseDetail(courseResult.data);
        }
        setToast({ open: true, message: 'Xóa điều kiện thành công!', severity: 'success' });
      } else {
        setToast({ open: true, message: result.error || 'Có lỗi xảy ra', severity: 'error' });
      }
    } catch (error) {
      setToast({ open: true, message: 'Có lỗi xảy ra khi xóa điều kiện', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const TabPanel = ({ children, value, index }: any) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // --

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast(prev => ({ ...prev, open: false }))} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

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
        <Typography color="text.primary">
          {courseDetail?.code || 'Chi tiết học phần'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {courseDetail.name_vi}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {courseDetail.code} - {courseDetail.credits} tín chỉ
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={`LT: ${formatCredit(courseDetail.theory_credit)}`} 
                size="small" 
                variant="outlined" 
                color="info"
              />
              <Chip 
                label={`TH: ${formatCredit(courseDetail.practical_credit)}`} 
                size="small" 
                variant="outlined" 
                color="secondary"
              />
            </Box>
          {userRoles.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {userRoles.map((r) => (
                <Tooltip key={r.name} title={r.description || ''}>
                  <Chip size="small" label={`Vai trò: ${r.name} - ${r.description}`} />
                </Tooltip>
              ))}
            </Box>
          )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={getStatusLabel(courseDetail.status || WorkflowStatus.DRAFT)}
              color={getStatusColor(courseDetail.status || WorkflowStatus.DRAFT) as any}
              sx={{ mr: 1 }}
            />
            <Chip
              label={courseDetail.unified_workflow && courseDetail.unified_workflow.workflow ? 
                (courseDetail.unified_workflow.workflow.steps.find(step => step.step_order === (courseDetail.unified_workflow?.current_step || 1))?.step_name || 'Unknown Step') :
                getCourseWorkflowStageLabel(courseDetail.workflows?.[0]?.workflow_stage || CourseWorkflowStage.FACULTY)
              }
              variant="outlined"
              sx={{ mr: 1 }}
            />
            {(courseDetail.status === WorkflowStatus.DRAFT || courseDetail.status === WorkflowStatus.REJECTED) && (
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                disabled={saving}
                onClick={handleRequestDraft}
              >
                Gửi xem xét lại
              </Button>
            )}
          </Box>
        </Box>
      </Box>

    {courseDetail.status === WorkflowStatus.REJECTED && (
      <Alert severity="error" sx={{ mb: 3 }}>
        Học phần bị từ chối - thực hiện chỉnh sửa lại và gửi yêu cầu đi
      </Alert>
    )}

      {/* Course Information Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{courseDetail.credits}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tín chỉ
            </Typography>
          </CardContent>
        </Card>
        
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h6">{getCourseTypeLabel(courseDetail.type || '')}</Typography>
            <Typography variant="body2" color="text.secondary">
              Loại học phần
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Thông tin chung" />
            <Tab label="Đánh giá" />
          </Tabs>
        </Box>

        {/* General Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3 }}>
            <Card>
              <CardHeader 
                title="Thông tin cơ bản" 
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setOpenBasicInfoModal(true)}
                  >
                    Chỉnh sửa
                  </Button>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                      Tên học phần (Tiếng Việt)
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {courseDetail.name_vi}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                      Tên học phần (Tiếng Anh)
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {courseDetail.name_en || 'Chưa có'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                      Mã học phần
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {courseDetail.code}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                      Số tín chỉ
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, mb: 1 }}>
                      Tổng: {courseDetail.credits} tín chỉ
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`Lý thuyết: ${formatCredit(courseDetail.theory_credit)}`} 
                        size="small" 
                        variant="outlined" 
                        color="info"
                      />
                      <Chip 
                        label={`Thực hành: ${formatCredit(courseDetail.practical_credit)}`} 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                      Mô tả
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {courseDetail.description || 'Chưa có mô tả'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader 
                title="Điều kiện học phần"
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenPrerequisiteModal()}
                  >
                    Thêm
                  </Button>
                }
              />
              <CardContent>
                {courseDetail.prerequisites && courseDetail.prerequisites.length > 0 ? (
                <List>
                    {courseDetail.prerequisites.map((prereq: any, index: number) => (
                      <ListItem 
                        key={prereq.id || index} 
                        sx={{ px: 0, py: 1 }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPrerequisiteModal(prereq)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePrerequisite(prereq.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {prereq.prerequisite_course?.code}
                            </Typography>
                            <Chip 
                              label={getPrereqLabelVi(prereq.prerequisite_type)} 
                              size="small" 
                              color={getPrereqChipColor(prereq.prerequisite_type) as any}
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {prereq.prerequisite_course?.name_vi}
                          </Typography>
                          {prereq.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {prereq.description}
                            </Typography>
                          )}
                        </Box>
                  </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có điều kiện tiên quyết
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader title="Thông tin bổ sung" />
              <CardContent>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                        Đơn vị
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {courseDetail.OrgUnit?.name || 'Chưa xác định'}
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AssignmentIcon color="primary" />
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                        Chương trình
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Công nghệ thông tin
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                        Người tạo
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        System
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                        Ngày nộp
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {new Date(courseDetail.created_at).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
          
        </TabPanel>

        {/* Assessment Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3 }}>
            <Card>
    <CardHeader 
      title="Phương thức đánh giá" 
      action={
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setOpenAssessmentModal(true)}
        >
          Chỉnh sửa
        </Button>
      }
    />
              <CardContent>
                {assessmentMethods.length > 0 ? (
                  <List>
                    {assessmentMethods.map((method, index) => (
                      <ListItem key={`assessment-display-${index}-${method.method}`} sx={{ px: 0 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                            {method.method === 'attendance' ? 'Điểm danh' :
                             method.method === 'assignment' ? 'Bài tập' :
                             method.method === 'midterm' ? 'Giữa kỳ' :
                             method.method === 'final' ? 'Cuối kỳ' :
                             method.method === 'participation' ? 'Tham gia' :
                             method.method}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                            {method.weight}%
                          </Typography>
                          {method.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                              {method.description}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có phương thức đánh giá nào.
                  </Typography>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader 
                title="Mục tiêu học tập" 
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setOpenObjectivesModal(true)}
                  >
                    Chỉnh sửa
                  </Button>
                }
              />
              <CardContent>
                {learningObjectives.length > 0 ? (
                  <List>
                    {learningObjectives.map((objective, index) => (
                      <ListItem key={`objective-display-${index}-${objective.type}`} sx={{ px: 0 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            <Typography component="span" variant="body2" color="primary" fontWeight="bold" sx={{ mr: 1 }}>
                              {index + 1}.
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 1, fontStyle: 'italic' }}>
                              [{objective.type === 'knowledge' ? 'Kiến thức' :
                                objective.type === 'skill' ? 'Kỹ năng' :
                                objective.type === 'attitude' ? 'Thái độ' :
                                objective.type}]
                            </Typography>
                            {objective.objective}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có mục tiêu học tập nào.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

      </Paper>

      {/* Assessment Methods Modal */}
      <Dialog open={openAssessmentModal} onClose={() => setOpenAssessmentModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa phương thức đánh giá</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {assessmentMethods.map((method, index) => (
              <Card key={`modal-assessment-${index}-${method.method}`} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={method.method}
                      onChange={(e) => handleAssessmentMethodChange(index, 'method', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="attendance">Điểm danh</MenuItem>
                      <MenuItem value="assignment">Bài tập</MenuItem>
                      <MenuItem value="midterm">Giữa kỳ</MenuItem>
                      <MenuItem value="final">Cuối kỳ</MenuItem>
                      <MenuItem value="participation">Tham gia</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Trọng số (%)"
                    type="number"
                    value={method.weight}
                    onChange={(e) => handleAssessmentMethodChange(index, 'weight', parseInt(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => removeAssessmentMethod(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <TextField
                  label="Mô tả"
                  value={method.description}
                  onChange={(e) => handleAssessmentMethodChange(index, 'description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              </Card>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addAssessmentMethod}
              sx={{ alignSelf: 'flex-start' }}
            >
              Thêm phương thức
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssessmentModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAssessmentSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openObjectivesModal} onClose={() => setOpenObjectivesModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa mục tiêu học tập</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {learningObjectives.map((objective, index) => (
              <Card key={`modal-objective-${index}-${objective.type}`} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={objective.type}
                      onChange={(e) => handleLearningObjectiveChange(index, 'type', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="knowledge">Kiến thức</MenuItem>
                      <MenuItem value="skill">Kỹ năng</MenuItem>
                      <MenuItem value="attitude">Thái độ</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Mục tiêu"
                    value={objective.objective}
                    onChange={(e) => handleLearningObjectiveChange(index, 'objective', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <IconButton
                    color="error"
                    onClick={() => removeLearningObjective(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addLearningObjective}
              sx={{ alignSelf: 'flex-start' }}
            >
              Thêm mục tiêu
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenObjectivesModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleObjectivesSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBasicInfoModal} onClose={() => setOpenBasicInfoModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa thông tin cơ bản</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Tên học phần (Tiếng Việt)"
              value={editData.name_vi}
              onChange={(e) => handleInputChange('name_vi', e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Tên học phần (Tiếng Anh)"
              value={editData.name_en}
              onChange={(e) => handleInputChange('name_en', e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Mã học phần"
              value={editData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Số tín chỉ"
              type="number"
              value={editData.credits}
              onChange={(e) => handleInputChange('credits', parseInt(e.target.value) || 0)}
              variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Tín chỉ lý thuyết"
                type="number"
                value={editData.theory_credit || ''}
                onChange={(e) => handleInputChange('theory_credit', parseFloat(e.target.value) || null)}
                variant="outlined"
                inputProps={{ step: 0.5, min: 0 }}
              />
              <TextField
                fullWidth
                label="Tín chỉ thực hành"
                type="number"
                value={editData.practical_credit || ''}
                onChange={(e) => handleInputChange('practical_credit', parseFloat(e.target.value) || null)}
                variant="outlined"
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={editData.status}
                onChange={(e) => handleInputChange('status', e.target.value as string)}
                variant="outlined"
              >
                {COURSE_WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={4}
              value={editData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBasicInfoModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleBasicInfoSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPrerequisiteModal} onClose={handleClosePrerequisiteModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrerequisite ? 'Chỉnh sửa điều kiện học phần' : 'Thêm điều kiện học phần'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={coursesList}
              getOptionLabel={(option) => `${option.code} - ${option.name_vi}`}
              value={coursesList.find(c => c.id === prerequisiteForm.prerequisite_course_id) || null}
              onChange={(_, newValue) => {
                setPrerequisiteForm(prev => ({
                  ...prev,
                  prerequisite_course_id: newValue?.id || ''
                }));
              }}
              loading={coursesLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Học phần điều kiện *"
                  variant="outlined"
                  placeholder="Chọn học phần điều kiện"
                />
              )}
              disabled={!!editingPrerequisite}
            />

            <FormControl fullWidth>
              <InputLabel>Loại điều kiện *</InputLabel>
              <Select
                value={prerequisiteForm.prerequisite_type}
                onChange={(e) => setPrerequisiteForm(prev => ({
                  ...prev,
                  prerequisite_type: e.target.value as CoursePrerequisiteType
                }))}
                label="Loại điều kiện *"
              >
                <MenuItem value={CoursePrerequisiteType.PREREQUISITE}>
                  {getPrereqLabelVi(CoursePrerequisiteType.PREREQUISITE)}
                </MenuItem>
                <MenuItem value={CoursePrerequisiteType.PRIOR}>
                  {getPrereqLabelVi(CoursePrerequisiteType.PRIOR)}
                </MenuItem>
                <MenuItem value={CoursePrerequisiteType.COREQUISITE}>
                  {getPrereqLabelVi(CoursePrerequisiteType.COREQUISITE)}
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô tả"
              value={prerequisiteForm.description}
              onChange={(e) => setPrerequisiteForm(prev => ({
                ...prev,
                description: e.target.value
              }))}
              variant="outlined"
              multiline
              rows={3}
              helperText="Mô tả thêm về điều kiện (tùy chọn)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrerequisiteModal}>Hủy</Button>
          <Button variant="contained" onClick={handleSavePrerequisite} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}
