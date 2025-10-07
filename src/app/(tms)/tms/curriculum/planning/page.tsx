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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';

export default function CurriculumPlanningPage() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

  const programs = [
    { id: '1', name: 'Công nghệ thông tin', code: 'CNTT', credits: 140 },
    { id: '2', name: 'Kỹ thuật phần mềm', code: 'KTPM', credits: 135 },
    { id: '3', name: 'Khoa học dữ liệu', code: 'KHDL', credits: 130 }
  ];

  const academicYears = [
    { id: '1', year: '2024-2025', status: 'active' },
    { id: '2', year: '2025-2026', status: 'upcoming' },
    { id: '3', year: '2023-2024', status: 'completed' }
  ];

  const planningSteps = [
    'Chọn chương trình',
    'Chọn năm học',
    'Lập kế hoạch học kỳ',
    'Phân bổ môn học',
    'Xác nhận và lưu'
  ];

  const curriculumPlans = [
    {
      id: 1,
      programName: 'Công nghệ thông tin',
      programCode: 'CNTT',
      academicYear: '2024-2025',
      status: 'DRAFT',
      createdBy: 'Nguyễn Văn A',
      createdAt: '2024-01-15',
      totalSemesters: 8,
      totalCredits: 140,
      semesters: [
        {
          semester: 1,
          credits: 18,
          subjects: ['CS101', 'MATH101', 'PHYS101', 'ENG101'],
          status: 'planned'
        },
        {
          semester: 2,
          credits: 17,
          subjects: ['CS102', 'MATH102', 'PHYS102', 'ENG102'],
          status: 'planned'
        }
      ]
    },
    {
      id: 2,
      programName: 'Kỹ thuật phần mềm',
      programCode: 'KTPM',
      academicYear: '2024-2025',
      status: 'APPROVED',
      createdBy: 'Lê Văn B',
      createdAt: '2024-01-10',
      totalSemesters: 8,
      totalCredits: 135,
      semesters: [
        {
          semester: 1,
          credits: 17,
          subjects: ['SE101', 'MATH101', 'ENG101'],
          status: 'active'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'primary';
      case 'APPROVED': return 'success';
      case 'ACTIVE': return 'info';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'SUBMITTED': return 'Đã gửi';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'ACTIVE': return 'Đang áp dụng';
      case 'COMPLETED': return 'Hoàn thành';
      default: return status;
    }
  };

  const handleOpenDialog = (type: string, planning?: any) => {
    setDialogType(type);
    setSelectedPlanning(planning || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setSelectedPlanning(null);
  };

  const handleSavePlanning = () => {
    console.log('Saving planning:', selectedPlanning);
    handleCloseDialog();
  };

  const handleDeletePlanning = (planningId: number) => {
    console.log('Deleting planning:', planningId);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chọn chương trình đào tạo
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Chương trình đào tạo *</InputLabel>
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                label="Chương trình đào tạo *"
              >
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name} ({program.code}) - {program.credits} tín chỉ
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chọn năm học
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Năm học *</InputLabel>
              <Select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                label="Năm học *"
              >
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.year} ({year.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lập kế hoạch học kỳ
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Chương trình sẽ được chia thành 8 học kỳ, mỗi học kỳ từ 15-20 tín chỉ.
            </Alert>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                <Card key={semester} variant="outlined">
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">Học kỳ {semester}</Typography>
                    <TextField
                      size="small"
                      label="Tín chỉ"
                      type="number"
                      defaultValue={semester <= 4 ? 18 : 17}
                      sx={{ mt: 1, width: '100%' }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Phân bổ môn học
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Hệ thống sẽ tự động đề xuất phân bổ môn học dựa trên chương trình đào tạo.
            </Alert>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Học kỳ</TableCell>
                    <TableCell>Môn học</TableCell>
                    <TableCell>Tín chỉ</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>CS101 - Lập trình cơ bản</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>
                      <Chip label="Bắt buộc" color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>MATH101 - Toán cao cấp</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>
                      <Chip label="Bắt buộc" color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Xác nhận và lưu
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Kế hoạch đào tạo đã được tạo thành công. Vui lòng kiểm tra lại thông tin.
            </Alert>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Chương trình:</Typography>
                <Typography variant="body1">
                  {programs.find(p => p.id === selectedProgram)?.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Năm học:</Typography>
                <Typography variant="body1">
                  {academicYears.find(y => y.id === selectedAcademicYear)?.year}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tổng học kỳ:</Typography>
                <Typography variant="body1">8 học kỳ</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tổng tín chỉ:</Typography>
                <Typography variant="body1">
                  {programs.find(p => p.id === selectedProgram)?.credits} tín chỉ
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <TimelineIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Lập kế hoạch đào tạo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tạo và quản lý kế hoạch đào tạo cho các chương trình
        </Typography>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{curriculumPlans.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Kế hoạch đã tạo
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">{curriculumPlans.filter(p => p.status === 'ACTIVE').length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Đang áp dụng
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6">{curriculumPlans.filter(p => p.status === 'DRAFT').length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Đang soạn thảo
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h6">{curriculumPlans.reduce((sum, p) => sum + p.totalSemesters, 0)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng học kỳ
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Create New Planning */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tạo kế hoạch đào tạo mới
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Tạo mới
          </Button>
        </Box>
        
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
          {planningSteps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep < planningSteps.length && (
          <Box sx={{ minHeight: 200 }}>
            {getStepContent(activeStep)}
          </Box>
        )}

        {activeStep < planningSteps.length && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Quay lại
            </Button>
            <Button variant="contained" onClick={handleNext}>
              {activeStep === planningSteps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Existing Plans */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kế hoạch đào tạo hiện có
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {curriculumPlans.map((plan) => (
            <Card key={plan.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {plan.programName} ({plan.programCode})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Năm học: {plan.academicYear} • {plan.totalSemesters} học kỳ • {plan.totalCredits} tín chỉ
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tạo bởi: {plan.createdBy} vào {plan.createdAt}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={getStatusLabel(plan.status)}
                      color={getStatusColor(plan.status) as any}
                      size="small"
                    />
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                  {plan.semesters.map((semester) => (
                    <Card key={semester.semester} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2" align="center">
                        Học kỳ {semester.semester}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {semester.credits} tín chỉ
                      </Typography>
                      <Typography variant="caption" align="center" display="block">
                        {semester.subjects.length} môn
                      </Typography>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Planning Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Tạo kế hoạch đào tạo mới'}
          {dialogType === 'edit' && 'Chỉnh sửa kế hoạch đào tạo'}
          {dialogType === 'view' && 'Chi tiết kế hoạch đào tạo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Chương trình đào tạo</InputLabel>
              <Select
                value={selectedPlanning?.programId || ''}
                disabled={dialogType === 'view'}
                label="Chương trình đào tạo"
              >
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Năm học</InputLabel>
              <Select
                value={selectedPlanning?.academicYearId || ''}
                disabled={dialogType === 'view'}
                label="Năm học"
              >
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              placeholder="Thêm ghi chú cho kế hoạch đào tạo..."
              disabled={dialogType === 'view'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogType !== 'view' && (
            <Button variant="contained" onClick={handleSavePlanning}>
              Lưu
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
