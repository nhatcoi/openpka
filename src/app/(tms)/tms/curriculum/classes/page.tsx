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
  StepContent,
  Tabs,
  Tab,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Class as ClassIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
  Group as GroupIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material';

export default function CurriculumClassesPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);

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

  const classes = [
    {
      id: 1,
      name: 'CNTT2024A',
      program: 'Công nghệ thông tin',
      programCode: 'CNTT',
      academicYear: '2024-2025',
      semester: 'Học kỳ 1',
      maxStudents: 40,
      currentStudents: 35,
      status: 'ACTIVE',
      advisor: 'Nguyễn Văn A',
      createdAt: '2024-09-01',
      subjects: [
        { code: 'CS101', name: 'Lập trình cơ bản', credits: 4, instructor: 'Trần Thị B' },
        { code: 'MATH101', name: 'Toán cao cấp', credits: 4, instructor: 'Lê Văn C' },
        { code: 'PHYS101', name: 'Vật lý đại cương', credits: 3, instructor: 'Phạm Thị D' }
      ],
      students: [
        { id: 1, name: 'Nguyễn Văn Nam', studentId: '2024001', status: 'ACTIVE' },
        { id: 2, name: 'Trần Thị Hoa', studentId: '2024002', status: 'ACTIVE' },
        { id: 3, name: 'Lê Văn Minh', studentId: '2024003', status: 'ACTIVE' }
      ]
    },
    {
      id: 2,
      name: 'CNTT2024B',
      program: 'Công nghệ thông tin',
      programCode: 'CNTT',
      academicYear: '2024-2025',
      semester: 'Học kỳ 1',
      maxStudents: 40,
      currentStudents: 32,
      status: 'ACTIVE',
      advisor: 'Hoàng Văn E',
      createdAt: '2024-09-01',
      subjects: [
        { code: 'CS101', name: 'Lập trình cơ bản', credits: 4, instructor: 'Nguyễn Thị F' },
        { code: 'MATH101', name: 'Toán cao cấp', credits: 4, instructor: 'Vũ Văn G' }
      ],
      students: [
        { id: 4, name: 'Phạm Văn Đức', studentId: '2024004', status: 'ACTIVE' },
        { id: 5, name: 'Bùi Thị Lan', studentId: '2024005', status: 'ACTIVE' }
      ]
    },
    {
      id: 3,
      name: 'KTPM2024A',
      program: 'Kỹ thuật phần mềm',
      programCode: 'KTPM',
      academicYear: '2024-2025',
      semester: 'Học kỳ 1',
      maxStudents: 35,
      currentStudents: 28,
      status: 'ACTIVE',
      advisor: 'Đỗ Văn H',
      createdAt: '2024-09-01',
      subjects: [
        { code: 'SE101', name: 'Nhập môn kỹ thuật phần mềm', credits: 3, instructor: 'Lý Thị I' }
      ],
      students: []
    }
  ];

  const advisors = [
    { id: '1', name: 'Nguyễn Văn A', department: 'Công nghệ thông tin', experience: 10 },
    { id: '2', name: 'Hoàng Văn E', department: 'Công nghệ thông tin', experience: 8 },
    { id: '3', name: 'Đỗ Văn H', department: 'Kỹ thuật phần mềm', experience: 12 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'FULL': return 'warning';
      case 'CLOSED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Không hoạt động';
      case 'FULL': return 'Đã đầy';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  };

  const getStudentStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'warning';
      case 'GRADUATED': return 'info';
      default: return 'default';
    }
  };

  const getStudentStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Đang học';
      case 'INACTIVE': return 'Nghỉ học';
      case 'SUSPENDED': return 'Tạm dừng';
      case 'GRADUATED': return 'Đã tốt nghiệp';
      default: return status;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, classItem?: any) => {
    setDialogType(type);
    setSelectedClass(classItem || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setSelectedClass(null);
  };

  const handleSaveClass = () => {
    console.log('Saving class:', selectedClass);
    handleCloseDialog();
  };

  const handleDeleteClass = (classId: number) => {
    console.log('Deleting class:', classId);
  };

  const renderClassesList = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên lớp</TableCell>
            <TableCell>Chương trình</TableCell>
            <TableCell>Năm học</TableCell>
            <TableCell>Sinh viên</TableCell>
            <TableCell>Cố vấn học tập</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Môn học</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow key={classItem.id} hover>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  {classItem.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tạo ngày: {classItem.createdAt}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{classItem.program}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ({classItem.programCode})
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{classItem.academicYear}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {classItem.semester}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    {classItem.currentStudents}/{classItem.maxStudents}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(classItem.currentStudents / classItem.maxStudents) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                    {classItem.advisor.charAt(0)}
                  </Avatar>
                  <Typography variant="body2">{classItem.advisor}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={getStatusLabel(classItem.status)}
                  color={getStatusColor(classItem.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {classItem.subjects.length} môn học
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => handleOpenDialog('view', classItem)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog('edit', classItem)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteClass(classItem.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderClassDetails = (classItem: any) => (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">Tên lớp:</Typography>
          <Typography variant="body1">{classItem.name}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Chương trình:</Typography>
          <Typography variant="body1">{classItem.program}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Năm học:</Typography>
          <Typography variant="body1">{classItem.academicYear}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Số sinh viên:</Typography>
          <Typography variant="body1">
            {classItem.currentStudents}/{classItem.maxStudents}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Cố vấn học tập:</Typography>
          <Typography variant="body1">{classItem.advisor}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
          <Chip
            label={getStatusLabel(classItem.status)}
            color={getStatusColor(classItem.status) as any}
            size="small"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Môn học trong lớp
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã môn</TableCell>
              <TableCell>Tên môn</TableCell>
              <TableCell>Tín chỉ</TableCell>
              <TableCell>Giảng viên</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classItem.subjects.map((subject: any, index: number) => (
              <TableRow key={index}>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.credits}</TableCell>
                <TableCell>{subject.instructor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Danh sách sinh viên ({classItem.students.length})
      </Typography>
      {classItem.students.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã SV</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classItem.students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStudentStatusLabel(student.status)}
                      color={getStudentStatusColor(student.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          Lớp chưa có sinh viên nào được phân công.
        </Alert>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ClassIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Quản lý lớp học
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tạo và quản lý các lớp học trong chương trình đào tạo
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Chương trình</InputLabel>
            <Select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              label="Chương trình"
            >
              {programs.map((program) => (
                <MenuItem key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Năm học</InputLabel>
            <Select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              label="Năm học"
            >
              {academicYears.map((year) => (
                <MenuItem key={year.id} value={year.id}>
                  {year.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              In danh sách
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Xuất Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('create')}>
              Tạo lớp mới
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ClassIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{classes.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng số lớp
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">{classes.reduce((sum, c) => sum + c.currentStudents, 0)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng sinh viên
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SupervisorAccountIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6">{advisors.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Cố vấn học tập
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h6">{classes.reduce((sum, c) => sum + c.subjects.length, 0)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng môn học
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Danh sách lớp" />
          <Tab label="Chi tiết lớp" />
          <Tab label="Phân công sinh viên" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: 500 }}>
        {selectedTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Danh sách lớp học ({classes.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderClassesList()}
          </Paper>
        )}

        {selectedTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chi tiết lớp học
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {classes.map((classItem) => (
                <Accordion key={classItem.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {classItem.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                        <Chip
                          label={`${classItem.currentStudents}/${classItem.maxStudents} SV`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={getStatusLabel(classItem.status)}
                          color={getStatusColor(classItem.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderClassDetails(classItem)}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Paper>
        )}

        {selectedTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Phân công sinh viên vào lớp
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info">
              Tính năng phân công sinh viên vào lớp sẽ được phát triển trong phiên bản tiếp theo.
            </Alert>
          </Paper>
        )}
      </Box>

      {/* Class Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Tạo lớp học mới'}
          {dialogType === 'edit' && 'Chỉnh sửa lớp học'}
          {dialogType === 'view' && 'Chi tiết lớp học'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Tên lớp"
              value={selectedClass?.name || ''}
              disabled={dialogType === 'view'}
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Chương trình *</InputLabel>
                <Select
                  value={selectedClass?.programId || ''}
                  disabled={dialogType === 'view'}
                  label="Chương trình *"
                >
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Năm học *</InputLabel>
                <Select
                  value={selectedClass?.academicYearId || ''}
                  disabled={dialogType === 'view'}
                  label="Năm học *"
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Số lượng sinh viên tối đa"
                type="number"
                value={selectedClass?.maxStudents || ''}
                disabled={dialogType === 'view'}
              />
              
              <FormControl fullWidth>
                <InputLabel>Cố vấn học tập *</InputLabel>
                <Select
                  value={selectedClass?.advisorId || ''}
                  disabled={dialogType === 'view'}
                  label="Cố vấn học tập *"
                >
                  {advisors.map((advisor) => (
                    <MenuItem key={advisor.id} value={advisor.id}>
                      {advisor.name} ({advisor.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              placeholder="Thêm ghi chú cho lớp học..."
              disabled={dialogType === 'view'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogType !== 'view' && (
            <Button variant="contained" onClick={handleSaveClass}>
              Lưu
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
