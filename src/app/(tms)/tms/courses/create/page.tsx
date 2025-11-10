'use client';

import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  InputAdornment,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Attachment as AttachmentIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  COURSE_PRIORITIES,
  COURSE_TYPES,
  CoursePriority,
  CourseType,
  getCourseTypeLabel,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from '@/constants/courses';

interface FormData {
  basicInfo: {
    code: string;
    nameVi: string;
    nameEn: string;
    credits: number;
    theory_credit?: number;
    practical_credit?: number;
    orgUnitId: string;
    type: CourseType;
    description: string;
  };
  prerequisites: (string | {id: string, code: string, name_vi: string, name_en: string, credits: number, status: string, label: string, value: string})[];
  learningObjectives: Array<{
    id: string;
    objective: string;
    type: 'knowledge' | 'skill' | 'attitude';
  }>;
  syllabus: Array<{
    week: number;
    topic: string;
    objectives: string;
    materials: string;
    assignments: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  }>;
  assessment: {
    methods: Array<{
      id: string;
      method: string;
      weight: number;
      description: string;
    }>;
    passingGrade: number;
    description: string;
  };
  workflow: {
    priority: CoursePriority;
    notes: string;
    attachments: string[];
  };
}

const steps = [
  'Thông tin cơ bản',
  'Điều kiện tiên quyết',
  'Mục tiêu học tập',
  'Chương trình học',
  'Đánh giá',
  'Xác nhận'
];

const courseTypeOptions = COURSE_TYPES.map((type) => ({
  value: type,
  label: getCourseTypeLabel(type),
}));

const assessmentMethods = [
  { value: 'midterm', label: 'Giữa kỳ' },
  { value: 'final', label: 'Cuối kỳ' },
  { value: 'assignment', label: 'Bài tập' },
  { value: 'project', label: 'Dự án' },
  { value: 'presentation', label: 'Thuyết trình' },
  { value: 'participation', label: 'Tham gia' },
  { value: 'attendance', label: 'Chuyên cần' }
];

// OrgUnits will be fetched from API

// Helper function to create default syllabus weeks
const createDefaultSyllabus = () => {
  return Array.from({ length: 10 }, (_, index) => ({
    week: index + 1,
    topic: '',
    objectives: '',
    materials: '',
    assignments: '',
    attachments: []
  }));
};

export default function CreateCoursePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [orgUnits, setOrgUnits] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{id: string, code: string, name_vi: string, name_en: string, credits: number, status: string, label: string, value: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    basicInfo: {
      code: '',
      nameVi: '',
      nameEn: '',
      credits: 0,
      theory_credit: undefined,
      practical_credit: undefined,
      orgUnitId: '',
      type: CourseType.THEORY,
      description: ''
    },
    prerequisites: [] as (string | {id: string, code: string, name_vi: string, name_en: string, credits: number, status: string, label: string, value: string})[],
    learningObjectives: [] as Array<{
      id: string;
      objective: string;
      type: 'knowledge' | 'skill' | 'attitude';
    }>,
    syllabus: createDefaultSyllabus(),
    assessment: {
      methods: [] as Array<{
        id: string;
        method: string;
        weight: number;
        description: string;
      }>,
      passingGrade: 5.0,
      description: ''
    },
    workflow: {
      priority: CoursePriority.MEDIUM,
      notes: '',
      attachments: [] as string[]
    }
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare data for API - convert formData to API format
      const courseData = {
        // Basic Info
        code: formData.basicInfo.code,
        name_vi: formData.basicInfo.nameVi,
        name_en: formData.basicInfo.nameEn,
        credits: formData.basicInfo.credits,
        theory_credit: formData.basicInfo.theory_credit,
        practical_credit: formData.basicInfo.practical_credit,
        org_unit_id: parseInt(formData.basicInfo.orgUnitId),
        type: formData.basicInfo.type,
        description: formData.basicInfo.description,
        
        // Prerequisites - send full course object as-is
        prerequisites: formData.prerequisites || [],
        
        // Learning Objectives - extract objective and type
        learning_objectives: formData.learningObjectives?.map(obj => ({
          objective: obj.objective,
          type: obj.type
        })) || [],
        
        // Assessment Methods - extract method, weight, description
        assessment_methods: formData.assessment?.methods?.map(method => ({
          method: method.method,
          weight: method.weight,
          description: method.description
        })) || [],
        
        // Passing Grade
        passing_grade: formData.assessment?.passingGrade || 5.0,
        
        // Syllabus - keep as is
        syllabus: formData.syllabus || [],
        
        // Workflow
        workflow_priority: formData.workflow.priority.toLowerCase(),
        workflow_notes: 'Draft course saved'
      };

      const response = await fetch('/api/tms/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save course');
      }

      console.log('Course saved successfully:', result);
      router.push('/tms/courses');
    } catch (error: any) {
      console.error('Error saving course:', error);
      alert('Lỗi khi lưu khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare data for API - convert formData to API format
      const courseData = {
        // Basic Info
        code: formData.basicInfo.code,
        name_vi: formData.basicInfo.nameVi,
        name_en: formData.basicInfo.nameEn,
        credits: formData.basicInfo.credits,
        theory_credit: formData.basicInfo.theory_credit,
        practical_credit: formData.basicInfo.practical_credit,
        org_unit_id: parseInt(formData.basicInfo.orgUnitId),
        type: formData.basicInfo.type,
        description: formData.basicInfo.description,
        
        // Prerequisites - send full course object as-is
        prerequisites: formData.prerequisites || [],
        
        // Learning Objectives - extract objective and type
        learning_objectives: formData.learningObjectives?.map(obj => ({
          objective: obj.objective,
          type: obj.type
        })) || [],
        
        // Assessment Methods - extract method, weight, description
        assessment_methods: formData.assessment?.methods?.map(method => ({
          method: method.method,
          weight: method.weight,
          description: method.description
        })) || [],
        
        // Passing Grade
        passing_grade: formData.assessment?.passingGrade || 5.0,
        
        // Syllabus - keep as is
        syllabus: formData.syllabus || [],
        
        // Workflow
        workflow_priority: formData.workflow.priority.toLowerCase(),
        workflow_notes: 'Course submitted for approval'
      };

      const response = await fetch('/api/tms/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit course');
      }

      console.log('Course submitted successfully:', result);
      router.push('/tms/courses');
    } catch (error: any) {
      console.error('Error submitting course:', error);
      alert('Lỗi khi gửi khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orgUnits from API
  const fetchOrgUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tms/faculties');
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setOrgUnits(result.data.items);
      }
    } catch (error) {
      console.error('Error fetching orgUnits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course options for prerequisites
  const fetchCourseOptions = async (searchTerm = '') => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');
      
      const response = await fetch(`/api/tms/courses/list?${params}`);
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setCourseOptions(result.data.items);
      }
    } catch (error) {
      console.error('Error fetching course options:', error);
    }
  };

  // Fetch orgUnits and initial course options on component mount
  React.useEffect(() => {
    fetchOrgUnits();
    fetchCourseOptions();
  }, []);

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, weekIndex: number) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // Temporary URL for preview
      }));

      setFormData(prev => ({
        ...prev,
        syllabus: prev.syllabus.map((week, index) => 
          index === weekIndex 
            ? { 
                ...week, 
                attachments: [...(week.attachments || []), ...newAttachments] 
              }
            : week
        )
      }));
    }
  };

  const removeAttachment = (weekIndex: number, fileIndex: number) => {
    setFormData(prev => ({
      ...prev,
      syllabus: prev.syllabus.map((week, index) => 
        index === weekIndex 
          ? { 
              ...week, 
              attachments: week.attachments?.filter((_, i) => i !== fileIndex) 
            }
          : week
      )
    }));
  };

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  // Validation helper for credits
  const validateCredits = (theory: number | undefined, practical: number | undefined, total: number) => {
    const theoryNum = theory || 0;
    const practicalNum = practical || 0;
    return theoryNum + practicalNum <= total;
  };

  const getCreditsValidationError = () => {
    const { theory_credit, practical_credit, credits } = formData.basicInfo;
    if (!validateCredits(theory_credit, practical_credit, credits)) {
      return `Tổng tín chỉ lý thuyết (${theory_credit || 0}) + thực hành (${practical_credit || 0}) = ${(theory_credit || 0) + (practical_credit || 0)} vượt quá tổng tín chỉ (${credits})`;
    }
    return null;
  };

  const addLearningObjective = () => {
    const newObjective = {
      id: Date.now().toString(),
      objective: '',
      type: 'knowledge' as const
    };
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, newObjective]
    }));
  };

  const updateLearningObjective = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.map(obj =>
        obj.id === id ? { ...obj, [field]: value } : obj
      )
    }));
  };

  const removeLearningObjective = (id: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(obj => obj.id !== id)
    }));
  };

  const addSyllabusWeek = () => {
    const weekNumber = formData.syllabus.length + 1;
    const newWeek = {
      week: weekNumber,
      topic: '',
      objectives: '',
      materials: '',
      assignments: '',
      attachments: []
    };
    setFormData(prev => ({
      ...prev,
      syllabus: [...prev.syllabus, newWeek]
    }));
  };

  const updateSyllabusWeek = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      syllabus: prev.syllabus.map((week, i) =>
        i === index ? { ...week, [field]: value } : week
      )
    }));
  };

  const removeSyllabusWeek = (index: number) => {
    setFormData(prev => ({
      ...prev,
      syllabus: prev.syllabus.filter((_, i) => i !== index)
    }));
  };

  const addAssessmentMethod = () => {
    const newMethod = {
      id: Date.now().toString(),
      method: '',
      weight: 0,
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        methods: [...prev.assessment.methods, newMethod]
      }
    }));
  };

  const updateAssessmentMethod = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        methods: prev.assessment.methods.map(method =>
          method.id === id ? { ...method, [field]: value } : method
        )
      }
    }));
  };

  const removeAssessmentMethod = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        methods: prev.assessment.methods.filter(method => method.id !== id)
      }
    }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Mã môn học *"
                value={formData.basicInfo.code}
                onChange={(e) => updateFormData('basicInfo', { code: e.target.value })}
                placeholder="VD: CS101"
              />
              <FormControl fullWidth>
                <InputLabel>Đơn vị tổ chức *</InputLabel>
                <Select
                  value={formData.basicInfo.orgUnitId}
                  onChange={(e) => updateFormData('basicInfo', { orgUnitId: e.target.value })}
                  label="Đơn vị tổ chức *"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: 'auto',
                      },
                    },
                  }}
                >
                  {orgUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      <Box>
                        <Typography variant="body1">{unit.name}</Typography>
                        {/* <Typography variant="caption" color="text.secondary">
                          {unit.code}
                        </Typography> */}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tên môn học (Tiếng Việt) *"
                value={formData.basicInfo.nameVi}
                onChange={(e) => updateFormData('basicInfo', { nameVi: e.target.value })}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                fullWidth
                label="Tên môn học (Tiếng Anh)"
                value={formData.basicInfo.nameEn}
                onChange={(e) => updateFormData('basicInfo', { nameEn: e.target.value })}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                fullWidth
                label="Số tín chỉ *"
                type="number"
                value={formData.basicInfo.credits}
                onChange={(e) => updateFormData('basicInfo', { credits: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 10, step: 0.5 }}
              />
              <TextField
                fullWidth
                label="Tín chỉ lý thuyết"
                type="number"
                value={formData.basicInfo.theory_credit || ''}
                onChange={(e) => updateFormData('basicInfo', { theory_credit: parseFloat(e.target.value) || undefined })}
                inputProps={{ min: 0, max: formData.basicInfo.credits, step: 0.5 }}
                helperText={`Tối đa ${formData.basicInfo.credits} tín chỉ`}
                error={!!getCreditsValidationError()}
              />
              <TextField
                fullWidth
                label="Tín chỉ thực hành"
                type="number"
                value={formData.basicInfo.practical_credit || ''}
                onChange={(e) => updateFormData('basicInfo', { practical_credit: parseFloat(e.target.value) || undefined })}
                inputProps={{ min: 0, max: formData.basicInfo.credits, step: 0.5 }}
                helperText={`Tối đa ${formData.basicInfo.credits} tín chỉ`}
                error={!!getCreditsValidationError()}
              />
              {getCreditsValidationError() && (
                <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>
                  {getCreditsValidationError()}
                </Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Loại môn học *</InputLabel>
                <Select
                  value={formData.basicInfo.type}
                  onChange={(e) => updateFormData('basicInfo', { type: e.target.value as CourseType })}
                  label="Loại môn học *"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: 'auto',
                      },
                    },
                  }}
                >
                  {courseTypeOptions.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Mô tả môn học"
                multiline
                rows={4}
                value={formData.basicInfo.description}
                onChange={(e) => updateFormData('basicInfo', { description: e.target.value })}
                placeholder="Mô tả tổng quan về môn học, nội dung chính, mục tiêu..."
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Điều kiện tiên quyết
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={courseOptions}
              value={formData.prerequisites}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, prerequisites: newValue }))}
              onInputChange={(_, newInputValue) => {
                if (newInputValue.length >= 2) {
                  fetchCourseOptions(newInputValue);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.label || `${option.code} - ${option.name_vi}`;
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    variant="outlined" 
                    label={typeof option === 'string' ? option : option.label} 
                    {...getTagProps({ index })} 
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Môn học tiên quyết"
                  placeholder="Nhập mã môn học hoặc chọn từ danh sách"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  {typeof option === 'string' ? (
                    <Typography variant="body1">{option}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body1">
                        {option.code} - {option.name_vi}
                      </Typography>
                      {option.name_en && (
                        <Typography variant="caption" color="text.secondary">
                          {option.name_en}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={`${option.credits} tín chỉ`} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                        <Chip 
                          label={getStatusLabel(option.status || '')} 
                          size="small" 
                          variant="outlined"
                          color={getStatusColor(option.status || '') as any}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              ListboxProps={{
                style: {
                  maxHeight: 300,
                  overflow: 'auto',
                },
              }}
              loading={loading}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Nhập mã môn học hoặc chọn từ danh sách gợi ý. Sinh viên phải hoàn thành các môn này trước khi đăng ký môn học này.
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Mục tiêu học tập
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addLearningObjective}>
                Thêm mục tiêu
              </Button>
            </Box>
            
            {formData.learningObjectives.map((objective, index) => (
              <Card key={objective.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      label={`Mục tiêu ${index + 1}`}
                      value={objective.objective}
                      onChange={(e) => updateLearningObjective(objective.id, 'objective', e.target.value)}
                      multiline
                      rows={2}
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Loại</InputLabel>
                      <Select
                        value={objective.type}
                        onChange={(e) => updateLearningObjective(objective.id, 'type', e.target.value)}
                        label="Loại"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              overflow: 'auto',
                            },
                          },
                        }}
                      >
                        <MenuItem value="knowledge">Kiến thức</MenuItem>
                        <MenuItem value="skill">Kỹ năng</MenuItem>
                        <MenuItem value="attitude">Thái độ</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      color="error"
                      onClick={() => removeLearningObjective(objective.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
            
            {formData.learningObjectives.length === 0 && (
              <Alert severity="info">
                Chưa có mục tiêu học tập nào. Nhấn "Thêm mục tiêu" để bắt đầu.
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Chương trình học (10 tuần)
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addSyllabusWeek}>
                Thêm tuần
              </Button>
            </Box>
            
            {formData.syllabus.map((week, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Tuần {week.week}: {week.topic || 'Chưa có chủ đề'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Chủ đề"
                      value={week.topic}
                      onChange={(e) => updateSyllabusWeek(index, 'topic', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Mục tiêu tuần"
                      multiline
                      rows={2}
                      value={week.objectives}
                      onChange={(e) => updateSyllabusWeek(index, 'objectives', e.target.value)}
                    />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Tài liệu học tập
                      </Typography>
                      <TextField
                        fullWidth
                        label="Mô tả tài liệu"
                        multiline
                        rows={2}
                        value={week.materials}
                        onChange={(e) => updateSyllabusWeek(index, 'materials', e.target.value)}
                        placeholder="Mô tả ngắn về tài liệu học tập cho tuần này..."
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          Tải lên file
                          <input
                            type="file"
                            hidden
                            multiple
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, index)}
                          />
                        </Button>
                        {week.attachments && week.attachments.length > 0 && (
                          <Chip
                            label={`${week.attachments.length} file đã tải lên`}
                            color="primary"
                            size="small"
                          />
                        )}
                      </Box>
                      {week.attachments && week.attachments.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Files đã tải lên:
                          </Typography>
                          {week.attachments.map((file: any, fileIndex: number) => (
                            <Box key={fileIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <AttachmentIcon sx={{ fontSize: 16 }} />
                              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                {file.name}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeAttachment(index, fileIndex)}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label="Bài tập/Nhiệm vụ"
                      multiline
                      rows={2}
                      value={week.assignments}
                      onChange={(e) => updateSyllabusWeek(index, 'assignments', e.target.value)}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton
                        color="error"
                        onClick={() => removeSyllabusWeek(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
            
            {formData.syllabus.length === 0 && (
              <Alert severity="info">
                Chưa có chương trình học nào. Nhấn "Thêm tuần" để bắt đầu.
              </Alert>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Phương pháp đánh giá
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addAssessmentMethod}>
                Thêm phương pháp
              </Button>
            </Box>
            
            {formData.assessment.methods.map((method, index) => (
              <Card key={method.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'center' }}>
                    <FormControl fullWidth>
                      <InputLabel>Phương pháp</InputLabel>
                      <Select
                        value={method.method}
                        onChange={(e) => updateAssessmentMethod(method.id, 'method', e.target.value)}
                        label="Phương pháp"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              overflow: 'auto',
                            },
                          },
                        }}
                      >
                        {assessmentMethods.map((methodOption) => (
                          <MenuItem key={methodOption.value} value={methodOption.value}>
                            {methodOption.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Trọng số (%)"
                      type="number"
                      value={method.weight}
                      onChange={(e) => updateAssessmentMethod(method.id, 'weight', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, max: 100 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeAssessmentMethod(method.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Mô tả"
                      multiline
                      rows={2}
                      value={method.description}
                      onChange={(e) => updateAssessmentMethod(method.id, 'description', e.target.value)}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Điểm đạt (thang 10)"
                type="number"
                value={formData.assessment.passingGrade}
                onChange={(e) => updateFormData('assessment', { passingGrade: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 10, step: 0.1 }}
              />
              <TextField
                fullWidth
                label="Quy định đánh giá"
                multiline
                rows={3}
                value={formData.assessment.description}
                onChange={(e) => updateFormData('assessment', { description: e.target.value })}
                placeholder="Mô tả quy định về đánh giá, cách tính điểm, điều kiện qua môn..."
                sx={{ gridColumn: { xs: '1 / -1', sm: '2 / -1' } }}
              />
            </Box>
            
            {formData.assessment.methods.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Chưa có phương pháp đánh giá nào. Nhấn "Thêm phương pháp" để bắt đầu.
              </Alert>
            )}
          </Box>
        );

      case 5:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Thông tin môn học đã được điền đầy đủ. Vui lòng kiểm tra lại trước khi lưu hoặc gửi duyệt.
            </Alert>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Độ ưu tiên</InputLabel>
                <Select
                  value={formData.workflow.priority}
                  onChange={(e) => updateFormData('workflow', { priority: e.target.value as CoursePriority })}
                  label="Độ ưu tiên"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: 'auto',
                      },
                    },
                  }}
                >
                  {COURSE_PRIORITIES.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {getPriorityLabel(priority)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ghi chú (nếu có)"
                multiline
                rows={3}
                value={formData.workflow.notes}
                onChange={(e) => updateFormData('workflow', { notes: e.target.value })}
                placeholder="Thêm ghi chú cho người xem xét..."
                sx={{ gridColumn: { xs: '1 / -1', sm: '2 / -1' } }}
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Tóm tắt thông tin
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Mã môn học:</Typography>
                <Typography variant="body1">{formData.basicInfo.code || 'Chưa điền'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tên môn học:</Typography>
                <Typography variant="body1">{formData.basicInfo.nameVi || 'Chưa điền'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Số tín chỉ:</Typography>
                <Typography variant="body1">{formData.basicInfo.credits || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Mục tiêu học tập:</Typography>
                <Typography variant="body1">{formData.learningObjectives.length}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Chương trình học:</Typography>
                <Typography variant="body1">{formData.syllabus.length} tuần</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Phương pháp đánh giá:</Typography>
                <Typography variant="body1">{formData.assessment.methods.length}</Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
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
          <Typography color="text.primary">Tạo mới</Typography>
        </Breadcrumbs>
        
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Quay lại
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {activeStep === 0 ? 'Tạo môn học mới' : 'Chỉnh sửa môn học'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Điền đầy đủ thông tin để tạo môn học mới
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Quay lại
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Lưu nháp
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<CheckCircleIcon />}
                >
                  Gửi duyệt
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
