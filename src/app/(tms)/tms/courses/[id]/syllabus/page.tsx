'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import BasicInfoForm from './components/BasicInfoForm';
import LearningOutcomesForm, { CLOItem } from './components/LearningOutcomesForm';
import WeeklyPlanForm, { WeekItem } from './components/WeeklyPlanForm';
import AssessmentPlanForm, { AssessmentComponent } from './components/AssessmentPlanForm';
import TeachingMethodsForm, { TeachingMethod } from './components/TeachingMethodsForm';
import PoliciesForm, { PoliciesData } from './components/PoliciesForm';
import RubricsForm, { RubricComponent } from './components/RubricsForm';
import MaterialsForm from './components/MaterialsForm';

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

interface CourseVersion {
  id: string;
  version: string;
  status: string;
}

interface CourseDetail {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  CourseVersion?: CourseVersion[];
}

export default function CourseSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [syllabus, setSyllabus] = useState<CourseSyllabus | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState({
    status: 'draft' as 'draft' | 'approved' | 'archived',
    language: 'vi' as 'vi' | 'en' | 'vi-en',
    effective_from: '',
    effective_to: '',
    is_current: false,
    basic_info: null as any,
    learning_outcomes: null as any,
    weekly_plan: null as any,
    assessment_plan: null as any,
    teaching_methods: null as any,
    materials: null as any,
    policies: null as any,
    rubrics: null as any,
  });

  const [basicInfo, setBasicInfo] = useState({
    description: '',
    classification: '',
    prerequisites: '',
    course_type: '',
    total_weeks: '',
    total_hours: '',
    credit_distribution: '',
    objectives: '',
  });

  const [learningOutcomes, setLearningOutcomes] = useState<CLOItem[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeekItem[]>([]);
  const [assessmentPlan, setAssessmentPlan] = useState<AssessmentComponent[]>([]);
  const [teachingMethods, setTeachingMethods] = useState<TeachingMethod[]>([]);
  const [teachingMethodsDescription, setTeachingMethodsDescription] = useState<string>('');
  const [policies, setPolicies] = useState<PoliciesData>({
    attendance: '',
    late_submission: '',
    academic_integrity: '',
    communication: {
      lecturer_email: '',
      office_hours: '',
    },
  });

  const [rubrics, setRubrics] = useState<RubricComponent[]>([]);

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
        const syllabusData = result.data.syllabus[0];
        setSyllabus(syllabusData);
        setFormData({
          status: syllabusData.status || 'draft',
          language: syllabusData.language || 'vi',
          effective_from: syllabusData.effective_from ? new Date(syllabusData.effective_from).toISOString().split('T')[0] : '',
          effective_to: syllabusData.effective_to ? new Date(syllabusData.effective_to).toISOString().split('T')[0] : '',
          is_current: syllabusData.is_current || false,
          basic_info: syllabusData.basic_info || null,
          learning_outcomes: syllabusData.learning_outcomes || null,
          weekly_plan: syllabusData.weekly_plan || null,
          assessment_plan: syllabusData.assessment_plan || null,
          teaching_methods: syllabusData.teaching_methods || null,
          materials: syllabusData.materials || null,
          policies: syllabusData.policies || null,
          rubrics: syllabusData.rubrics || null,
        });
        if (syllabusData.basic_info) {
          setBasicInfo({
            description: syllabusData.basic_info.description || '',
            classification: syllabusData.basic_info.classification || '',
            prerequisites: syllabusData.basic_info.prerequisites || '',
            course_type: syllabusData.basic_info.course_type || '',
            total_weeks: syllabusData.basic_info.total_weeks?.toString() || '',
            total_hours: syllabusData.basic_info.total_hours?.toString() || '',
            credit_distribution: syllabusData.basic_info.credit_distribution || '',
            objectives: syllabusData.basic_info.objectives || '',
          });
        }

        if (syllabusData.learning_outcomes) {
          if (Array.isArray(syllabusData.learning_outcomes.clo)) {
            setLearningOutcomes(syllabusData.learning_outcomes.clo.map((item: any, index: number) => ({
              id: item.id || `clo-${index}`,
              code: item.code || `CLO${index + 1}`,
              description: item.description || '',
              plo_mapping: item.plo_mapping || [],
            })));
          } else if (syllabusData.learning_outcomes.clo) {
            const cloObj = syllabusData.learning_outcomes.clo;
            setLearningOutcomes(Object.keys(cloObj).map((key, index) => ({
              id: key,
              code: key,
              description: cloObj[key] || '',
              plo_mapping: [],
            })));
          }
        }

        if (syllabusData.weekly_plan) {
          if (Array.isArray(syllabusData.weekly_plan)) {
            setWeeklyPlan(syllabusData.weekly_plan.map((item: any, index: number) => ({
              id: item.id || `week-${index}`,
              week_number: item.week_number || index + 1,
              topic: item.topic || '',
              objectives: item.objectives || '',
              teaching_methods: item.teaching_methods || '',
              materials: item.materials || '',
              materials_documents: item.materials_documents || [],
              assignments: item.assignments || '',
              duration_hours: item.duration_hours || 3,
              is_exam_week: item.is_exam_week || false,
              is_midterm_week: item.is_midterm_week || false,
              notes: item.notes || '',
            })));
          } else if (syllabusData.weekly_plan.weeks && Array.isArray(syllabusData.weekly_plan.weeks)) {
            setWeeklyPlan(syllabusData.weekly_plan.weeks.map((item: any, index: number) => ({
              id: item.id || `week-${index}`,
              week_number: item.week_number || index + 1,
              topic: item.topic || '',
              objectives: item.objectives || '',
              teaching_methods: item.teaching_methods || '',
              materials: item.materials || '',
              materials_documents: item.materials_documents || [],
              assignments: item.assignments || '',
              duration_hours: item.duration_hours || 3,
              is_exam_week: item.is_exam_week || false,
              is_midterm_week: item.is_midterm_week || false,
              notes: item.notes || '',
            })));
          }
        }

        if (syllabusData.assessment_plan) {
          if (Array.isArray(syllabusData.assessment_plan)) {
            setAssessmentPlan(syllabusData.assessment_plan.map((item: any, index: number) => ({
              id: item.id || `assessment-${index}`,
              name: item.name || '',
              type: item.type || 'assignment',
              weight: item.weight || 0,
              description: item.description || '',
              criteria: item.criteria || '',
            })));
          } else if (syllabusData.assessment_plan.components && Array.isArray(syllabusData.assessment_plan.components)) {
            setAssessmentPlan(syllabusData.assessment_plan.components.map((item: any, index: number) => ({
              id: item.id || `assessment-${index}`,
              name: item.name || '',
              type: item.type || 'assignment',
              weight: item.weight || 0,
              description: item.description || '',
              criteria: item.criteria || '',
            })));
          }
        }

        if (syllabusData.teaching_methods) {
          if (typeof syllabusData.teaching_methods === 'string') {
            setTeachingMethodsDescription(syllabusData.teaching_methods);
          } else if (syllabusData.teaching_methods.description) {
            setTeachingMethodsDescription(syllabusData.teaching_methods.description || '');
          }
          
          if (Array.isArray(syllabusData.teaching_methods)) {
            setTeachingMethods(syllabusData.teaching_methods.map((item: any, index: number) => ({
              id: item.id || `method-${index}`,
              method: item.method || item.name || '',
              description: item.description || '',
              frequency: item.frequency || '',
              duration: item.duration || '',
            })));
          } else if (syllabusData.teaching_methods.methods && Array.isArray(syllabusData.teaching_methods.methods)) {
            setTeachingMethods(syllabusData.teaching_methods.methods.map((item: any, index: number) => ({
              id: item.id || `method-${index}`,
              method: item.method || item.name || '',
              description: item.description || '',
              frequency: item.frequency || '',
              duration: item.duration || '',
            })));
          }
        }

        if (syllabusData.policies) {
          setPolicies({
            attendance: syllabusData.policies.attendance || '',
            late_submission: syllabusData.policies.late_submission || '',
            academic_integrity: syllabusData.policies.academic_integrity || '',
            communication: {
              lecturer_email: syllabusData.policies.communication?.lecturer_email || '',
              office_hours: syllabusData.policies.communication?.office_hours || '',
            },
          });
        }

        if (syllabusData.rubrics) {
          if (syllabusData.rubrics.components && Array.isArray(syllabusData.rubrics.components)) {
            setRubrics(syllabusData.rubrics.components.map((item: any, index: number) => ({
              id: item.id || `rubric-${index}`,
              code: item.code || '',
              name: item.name || '',
              criteria: (item.criteria || []).map((c: any) => ({
                name: c.name || '',
                weight: c.weight || 0,
              })),
            })));
          } else if (Array.isArray(syllabusData.rubrics)) {
            setRubrics(syllabusData.rubrics.map((item: any, index: number) => ({
              id: item.id || `rubric-${index}`,
              code: item.code || '',
              name: item.name || '',
              criteria: (item.criteria || []).map((c: any) => ({
                name: c.name || '',
                weight: c.weight || 0,
              })),
            })));
          }
        }
      } else {
        setSyllabus(null);
        setFormData({
          status: 'draft',
          language: 'vi',
          effective_from: '',
          effective_to: '',
          is_current: false,
          basic_info: null,
          learning_outcomes: null,
          weekly_plan: null,
          assessment_plan: null,
          teaching_methods: null,
          materials: null,
          policies: null,
          rubrics: null,
        });
        setBasicInfo({
          description: '',
          classification: '',
          prerequisites: '',
          course_type: '',
          total_weeks: '',
          total_hours: '',
          credit_distribution: '',
          objectives: '',
        });
        setLearningOutcomes([]);
        setWeeklyPlan([]);
        setAssessmentPlan([]);
        setTeachingMethods([]);
        setTeachingMethodsDescription('');
        setPolicies({
          attendance: '',
          late_submission: '',
          academic_integrity: '',
          communication: {
            lecturer_email: '',
            office_hours: '',
          },
        });
        setRubrics([]);
      }
    } catch (err) {
      console.error('Error fetching syllabus:', err);
    }
  };

  const handleVersionChange = async (versionId: string) => {
    setSelectedVersionId(versionId);
    await fetchSyllabus(versionId);
  };

  const handleSave = async () => {
    if (!selectedVersionId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn version', severity: 'error' });
      return;
    }

    try {
      setSaving(true);

      const basicInfoData: any = {};
      if (basicInfo.description) basicInfoData.description = basicInfo.description;
      if (basicInfo.classification) basicInfoData.classification = basicInfo.classification;
      if (basicInfo.prerequisites) basicInfoData.prerequisites = basicInfo.prerequisites;
      if (basicInfo.course_type) basicInfoData.course_type = basicInfo.course_type;
      if (basicInfo.total_weeks) basicInfoData.total_weeks = parseInt(basicInfo.total_weeks) || null;
      if (basicInfo.total_hours) basicInfoData.total_hours = parseFloat(basicInfo.total_hours) || null;
      if (basicInfo.credit_distribution) basicInfoData.credit_distribution = basicInfo.credit_distribution;
      if (basicInfo.objectives) basicInfoData.objectives = basicInfo.objectives;

      const learningOutcomesData: any = {};
      if (learningOutcomes.length > 0) {
        learningOutcomesData.clo = learningOutcomes.map(item => ({
          id: item.id,
          code: item.code,
          description: item.description,
          plo_mapping: item.plo_mapping || [],
        }));
      }

      const weeklyPlanData = weeklyPlan.length > 0 
        ? weeklyPlan.map(item => ({
            week_number: item.week_number,
            topic: item.topic,
            objectives: item.objectives || undefined,
            teaching_methods: item.teaching_methods || undefined,
            materials: item.materials || undefined,
            materials_documents: item.materials_documents && item.materials_documents.length > 0 
              ? item.materials_documents 
              : undefined,
            assignments: item.assignments || undefined,
            duration_hours: item.duration_hours || undefined,
            is_exam_week: item.is_exam_week || false,
            is_midterm_week: item.is_midterm_week || false,
            notes: item.notes || undefined,
          }))
        : null;

      const assessmentPlanData = assessmentPlan.length > 0
        ? {
            components: assessmentPlan.map(item => ({
              name: item.name,
              type: item.type,
              weight: item.weight,
              description: item.description || undefined,
              criteria: item.criteria || undefined,
            })),
            total_weight: assessmentPlan.reduce((sum, c) => sum + (c.weight || 0), 0),
          }
        : null;

      const teachingMethodsData = teachingMethods.length > 0 || teachingMethodsDescription
        ? {
            description: teachingMethodsDescription || undefined,
            methods: teachingMethods.map(item => ({
              method: item.method,
              description: item.description || undefined,
              frequency: item.frequency || undefined,
              duration: item.duration || undefined,
            })),
          }
        : null;

      const policiesData: PoliciesData = {
        ...(policies.attendance && { attendance: policies.attendance }),
        ...(policies.late_submission && { late_submission: policies.late_submission }),
        ...(policies.academic_integrity && { academic_integrity: policies.academic_integrity }),
        ...((policies.communication?.lecturer_email || policies.communication?.office_hours) && {
          communication: {
            ...(policies.communication?.lecturer_email && { lecturer_email: policies.communication.lecturer_email }),
            ...(policies.communication?.office_hours && { office_hours: policies.communication.office_hours }),
          },
        }),
      };

      const rubricsData = rubrics.length > 0
        ? {
            components: rubrics.map(item => ({
              code: item.code,
              name: item.name,
              criteria: item.criteria.map(c => ({
                name: c.name,
                weight: c.weight,
              })),
            })),
          }
        : null;

      const payload: any = {
        course_version_id: selectedVersionId,
        status: formData.status,
        language: formData.language,
        effective_from: formData.effective_from || undefined,
        effective_to: formData.effective_to || undefined,
        is_current: formData.is_current,
        basic_info: Object.keys(basicInfoData).length > 0 ? basicInfoData : null,
        learning_outcomes: Object.keys(learningOutcomesData).length > 0 ? learningOutcomesData : null,
        weekly_plan: weeklyPlanData,
        assessment_plan: assessmentPlanData,
        teaching_methods: teachingMethodsData,
        materials: formData.materials,
        policies: Object.keys(policiesData).length > 0 ? policiesData : null,
        rubrics: rubricsData,
      };

      const response = await fetch(API_ROUTES.TMS.COURSES_SYLLABUS(courseId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSnackbar({ open: true, message: 'Lưu đề cương thành công!', severity: 'success' });
        if (selectedVersionId) {
          await fetchSyllabus(selectedVersionId);
        }
      } else {
        setSnackbar({ open: true, message: result.error || 'Lỗi khi lưu đề cương', severity: 'error' });
      }
    } catch (err) {
      console.error('Error saving syllabus:', err);
      setSnackbar({ open: true, message: 'Lỗi khi lưu dữ liệu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateJsonField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      <Box sx={{ py: 4, px: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy học phần'}</Alert>
      </Box>
    );
  }

  const tabLabels = [
    'Thông tin cơ bản',
    'Mục tiêu học tập',
    'Kế hoạch tuần',
    'Kế hoạch đánh giá',
    'Phương pháp giảng dạy',
    'Tài liệu',
    'Quy định',
    'Rubrics',
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/tms/courses/${courseId}`)}>
          Quay lại
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Xây dựng đề cương chi tiết
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {courseDetail.code} - {courseDetail.name_vi}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {courseDetail.CourseVersion && courseDetail.CourseVersion.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Version</InputLabel>
                <Select
                  value={selectedVersionId || ''}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  label="Version"
                >
                  {courseDetail.CourseVersion.map((v: CourseVersion) => (
                    <MenuItem key={v.id} value={v.id}>
                      Version {v.version} - {v.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              variant="outlined"
              onClick={() => router.push(`/tms/courses/${courseId}/syllabus/view`)}
              sx={{ mr: 2 }}
            >
              Xem đề cương
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu đề cương'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => updateJsonField('status', e.target.value)}
              label="Trạng thái"
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Ngôn ngữ</InputLabel>
            <Select
              value={formData.language}
              onChange={(e) => updateJsonField('language', e.target.value)}
              label="Ngôn ngữ"
            >
              <MenuItem value="vi">Tiếng Việt</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="vi-en">Tiếng Việt - English</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Hiệu lực từ"
            type="date"
            value={formData.effective_from}
            onChange={(e) => updateJsonField('effective_from', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Hiệu lực đến"
            type="date"
            value={formData.effective_to}
            onChange={(e) => updateJsonField('effective_to', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel>Đang sử dụng</InputLabel>
            <Select
              value={formData.is_current ? 'yes' : 'no'}
              onChange={(e) => updateJsonField('is_current', e.target.value === 'yes')}
              label="Đang sử dụng"
            >
              <MenuItem value="no">Không</MenuItem>
              <MenuItem value="yes">Có</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <BasicInfoForm basicInfo={basicInfo} onChange={setBasicInfo} />
          )}

          {activeTab === 1 && (
            <LearningOutcomesForm learningOutcomes={learningOutcomes} onChange={setLearningOutcomes} />
          )}

          {activeTab === 2 && (
            <WeeklyPlanForm 
              weeklyPlan={weeklyPlan} 
              onChange={setWeeklyPlan}
              syllabusId={syllabus?.id || undefined}
              courseVersionId={selectedVersionId || undefined}
              courseId={courseId}
            />
          )}

          {activeTab === 3 && (
            <AssessmentPlanForm assessmentPlan={assessmentPlan} onChange={setAssessmentPlan} />
          )}

          {activeTab === 4 && (
            <TeachingMethodsForm 
              teachingMethods={teachingMethods} 
              generalDescription={teachingMethodsDescription}
              onChange={(methods, description) => {
                setTeachingMethods(methods);
                setTeachingMethodsDescription(description || '');
              }} 
            />
          )}

          {activeTab === 5 && (
            <MaterialsForm
              syllabusId={syllabus?.id || undefined}
              courseVersionId={selectedVersionId || undefined}
              courseId={courseId}
            />
          )}

          {activeTab === 6 && (
            <PoliciesForm policies={policies} onChange={setPolicies} />
          )}

          {activeTab === 7 && (
            <RubricsForm rubrics={rubrics} onChange={setRubrics} />
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}
