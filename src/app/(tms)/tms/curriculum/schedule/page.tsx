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
  Avatar
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
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
  Download as DownloadIcon
} from '@mui/icons-material';

export default function CurriculumSchedulePage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const semesters = [
    { id: '1', name: 'Học kỳ 1 (2024-2025)', startDate: '2024-09-01', endDate: '2024-12-31' },
    { id: '2', name: 'Học kỳ 2 (2024-2025)', startDate: '2025-01-15', endDate: '2025-05-31' }
  ];

  const classes = [
    { id: '1', name: 'CNTT2024A', program: 'Công nghệ thông tin', students: 35 },
    { id: '2', name: 'CNTT2024B', program: 'Công nghệ thông tin', students: 32 },
    { id: '3', name: 'KTPM2024A', program: 'Kỹ thuật phần mềm', students: 28 }
  ];

  const timeSlots = [
    { id: '1', start: '07:00', end: '08:30', name: 'Tiết 1' },
    { id: '2', start: '08:30', end: '10:00', name: 'Tiết 2' },
    { id: '3', start: '10:15', end: '11:45', name: 'Tiết 3' },
    { id: '4', start: '13:00', end: '14:30', name: 'Tiết 4' },
    { id: '5', start: '14:30', end: '16:00', name: 'Tiết 5' },
    { id: '6', start: '16:15', end: '17:45', name: 'Tiết 6' }
  ];

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const schedules = [
    {
      id: 1,
      subject: 'CS101 - Lập trình cơ bản',
      class: 'CNTT2024A',
      instructor: 'Nguyễn Văn A',
      room: 'A101',
      timeSlot: 'Tiết 1',
      day: 'Thứ 2',
      semester: 'Học kỳ 1 (2024-2025)',
      credits: 4,
      type: 'Lý thuyết',
      status: 'ACTIVE'
    },
    {
      id: 2,
      subject: 'CS102 - Cấu trúc dữ liệu',
      class: 'CNTT2024A',
      instructor: 'Trần Thị B',
      room: 'A102',
      timeSlot: 'Tiết 2',
      day: 'Thứ 2',
      semester: 'Học kỳ 1 (2024-2025)',
      credits: 3,
      type: 'Lý thuyết + Thực hành',
      status: 'ACTIVE'
    },
    {
      id: 3,
      subject: 'MATH101 - Toán cao cấp',
      class: 'CNTT2024A',
      instructor: 'Lê Văn C',
      room: 'B201',
      timeSlot: 'Tiết 3',
      day: 'Thứ 3',
      semester: 'Học kỳ 1 (2024-2025)',
      credits: 4,
      type: 'Lý thuyết',
      status: 'ACTIVE'
    }
  ];

  const instructors = [
    { id: '1', name: 'Nguyễn Văn A', department: 'Công nghệ thông tin', subjects: ['CS101', 'CS201'] },
    { id: '2', name: 'Trần Thị B', department: 'Công nghệ thông tin', subjects: ['CS102', 'CS202'] },
    { id: '3', name: 'Lê Văn C', department: 'Toán - Tin', subjects: ['MATH101', 'MATH102'] }
  ];

  const rooms = [
    { id: '1', name: 'A101', capacity: 40, type: 'Lý thuyết', equipment: ['Projector', 'Whiteboard'] },
    { id: '2', name: 'A102', capacity: 35, type: 'Thực hành', equipment: ['Computers', 'Projector'] },
    { id: '3', name: 'B201', capacity: 50, type: 'Lý thuyết', equipment: ['Projector', 'Sound System'] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'CONFLICT': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Không hoạt động';
      case 'CONFLICT': return 'Xung đột';
      case 'PENDING': return 'Chờ xác nhận';
      default: return status;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, schedule?: any) => {
    setDialogType(type);
    setSelectedSchedule(schedule || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setSelectedSchedule(null);
  };

  const handleSaveSchedule = () => {
    console.log('Saving schedule:', selectedSchedule);
    handleCloseDialog();
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    console.log('Deleting schedule:', scheduleId);
  };

  const renderScheduleGrid = () => {
    const gridData = Array(weekDays.length).fill(null).map(() => Array(timeSlots.length).fill(null));
    
    schedules.forEach(schedule => {
      const dayIndex = weekDays.indexOf(schedule.day);
      const timeIndex = timeSlots.findIndex(ts => ts.name === schedule.timeSlot);
      if (dayIndex !== -1 && timeIndex !== -1) {
        gridData[dayIndex][timeIndex] = schedule;
      }
    });

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 100 }}>Thời gian</TableCell>
              {weekDays.map((day) => (
                <TableCell key={day} align="center" sx={{ minWidth: 150 }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((timeSlot, timeIndex) => (
              <TableRow key={timeSlot.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {timeSlot.start} - {timeSlot.end}
                </TableCell>
                {weekDays.map((day, dayIndex) => {
                  const schedule = gridData[dayIndex][timeIndex];
                  return (
                    <TableCell key={day} align="center" sx={{ p: 1 }}>
                      {schedule ? (
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            cursor: 'pointer',
                            border: `2px solid ${schedule.status === 'CONFLICT' ? 'red' : 'green'}`
                          }}
                          onClick={() => handleOpenDialog('view', schedule)}
                        >
                          <Typography variant="caption" fontWeight="bold">
                            {schedule.subject.split(' - ')[0]}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {schedule.instructor.split(' ').slice(-2).join(' ')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {schedule.room}
                          </Typography>
                          <Chip 
                            label={schedule.class} 
                            size="small" 
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Card>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog('create')}
                          sx={{ minHeight: 60, width: '100%' }}
                        >
                          <AddIcon />
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderScheduleList = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Môn học</TableCell>
            <TableCell>Lớp</TableCell>
            <TableCell>Giảng viên</TableCell>
            <TableCell>Phòng</TableCell>
            <TableCell>Thời gian</TableCell>
            <TableCell>Ngày</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id} hover>
              <TableCell>
                <Typography variant="subtitle2">{schedule.subject}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {schedule.credits} tín chỉ • {schedule.type}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={schedule.class} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                    {schedule.instructor.charAt(0)}
                  </Avatar>
                  <Typography variant="body2">{schedule.instructor}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <RoomIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">{schedule.room}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{schedule.timeSlot}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{schedule.day}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={getStatusLabel(schedule.status)}
                  color={getStatusColor(schedule.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => handleOpenDialog('view', schedule)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog('edit', schedule)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ScheduleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Thời khóa biểu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý và xem thời khóa biểu các lớp học
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Học kỳ</InputLabel>
            <Select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              label="Học kỳ"
            >
              {semesters.map((semester) => (
                <MenuItem key={semester.id} value={semester.id}>
                  {semester.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Lớp học</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Lớp học"
            >
              {classes.map((classItem) => (
                <MenuItem key={classItem.id} value={classItem.id}>
                  {classItem.name} ({classItem.students} sinh viên)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              In thời khóa biểu
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Xuất Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('create')}>
              Thêm lịch học
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Xem dạng lưới" />
          <Tab label="Xem danh sách" />
          <Tab label="Xung đột lịch" />
          <Tab label="Thống kê" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: 500 }}>
        {selectedTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thời khóa biểu dạng lưới
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderScheduleGrid()}
          </Paper>
        )}

        {selectedTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Danh sách lịch học ({schedules.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderScheduleList()}
          </Paper>
        )}

        {selectedTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Xung đột lịch học
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info">
              Hiện tại không có xung đột lịch học nào được phát hiện.
            </Alert>
          </Paper>
        )}

        {selectedTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thống kê thời khóa biểu
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">{schedules.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số lịch học
                  </Typography>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <GroupIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">{classes.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số lớp học
                  </Typography>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">{instructors.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số giảng viên
                  </Typography>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <RoomIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  <Typography variant="h6">{rooms.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số phòng học
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Schedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Thêm lịch học mới'}
          {dialogType === 'edit' && 'Chỉnh sửa lịch học'}
          {dialogType === 'view' && 'Chi tiết lịch học'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Môn học *</InputLabel>
              <Select
                value={selectedSchedule?.subjectId || ''}
                disabled={dialogType === 'view'}
                label="Môn học *"
              >
                <MenuItem value="1">CS101 - Lập trình cơ bản</MenuItem>
                <MenuItem value="2">CS102 - Cấu trúc dữ liệu</MenuItem>
                <MenuItem value="3">MATH101 - Toán cao cấp</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Lớp học *</InputLabel>
                <Select
                  value={selectedSchedule?.classId || ''}
                  disabled={dialogType === 'view'}
                  label="Lớp học *"
                >
                  {classes.map((classItem) => (
                    <MenuItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Giảng viên *</InputLabel>
                <Select
                  value={selectedSchedule?.instructorId || ''}
                  disabled={dialogType === 'view'}
                  label="Giảng viên *"
                >
                  {instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Phòng học *</InputLabel>
                <Select
                  value={selectedSchedule?.roomId || ''}
                  disabled={dialogType === 'view'}
                  label="Phòng học *"
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} ({room.capacity} chỗ)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Thời gian *</InputLabel>
                <Select
                  value={selectedSchedule?.timeSlotId || ''}
                  disabled={dialogType === 'view'}
                  label="Thời gian *"
                >
                  {timeSlots.map((timeSlot) => (
                    <MenuItem key={timeSlot.id} value={timeSlot.id}>
                      {timeSlot.name} ({timeSlot.start} - {timeSlot.end})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Ngày trong tuần *</InputLabel>
              <Select
                value={selectedSchedule?.day || ''}
                disabled={dialogType === 'view'}
                label="Ngày trong tuần *"
              >
                {weekDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={2}
              placeholder="Thêm ghi chú..."
              disabled={dialogType === 'view'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogType !== 'view' && (
            <Button variant="contained" onClick={handleSaveSchedule}>
              Lưu
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
