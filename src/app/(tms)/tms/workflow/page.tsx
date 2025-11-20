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
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Publish as PublishIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

export default function WorkflowPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const workflowSteps = [
    { label: 'Khoa tạo', status: 'completed' },
    { label: 'Văn phòng đào tạo', status: 'active' },
    { label: 'Hội đồng khoa học', status: 'pending' },
    { label: 'Phê duyệt', status: 'pending' },
    { label: 'Xuất bản', status: 'pending' }
  ];

  const courses = [
    {
      id: 1,
      code: 'CS101',
      name: 'Lập trình cơ bản',
      faculty: 'Công nghệ thông tin',
      status: 'REVIEWING',
      workflowStage: 'ACADEMIC_OFFICE',
      priority: 'HIGH',
      submittedBy: 'Nguyễn Văn A',
      submittedAt: '2024-01-15',
      currentReviewer: 'Trần Thị B',
      credits: 4,
      type: 'theory'
    },
    {
      id: 2,
      code: 'CS102',
      name: 'Cấu trúc dữ liệu',
      faculty: 'Công nghệ thông tin',
      status: 'REVIEWING',
      workflowStage: 'ACADEMIC_BOARD',
      priority: 'MEDIUM',
      submittedBy: 'Lê Văn C',
      submittedAt: '2024-01-14',
      currentReviewer: 'Phạm Thị D',
      credits: 3,
      type: 'theory'
    },
    {
      id: 3,
      code: 'CS103',
      name: 'Thuật toán',
      faculty: 'Công nghệ thông tin',
      status: 'APPROVED',
      workflowStage: 'ACADEMIC_BOARD',
      priority: 'HIGH',
      submittedBy: 'Hoàng Văn E',
      submittedAt: '2024-01-10',
      currentReviewer: null,
      credits: 3,
      type: 'theory'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'REVIEWING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PUBLISHED': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'REVIEWING': return 'Đang xem xét';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'PUBLISHED': return 'Đã xuất bản';
      default: return status;
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'FACULTY': return 'Khoa';
      case 'ACADEMIC_OFFICE': return 'Văn phòng đào tạo';
      case 'ACADEMIC_BOARD': return 'Hội đồng khoa học';
      default: return stage;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return priority;
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    const matchesStage = selectedStage === 'all' || course.workflowStage === selectedStage;
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesStage && matchesSearch;
  });

  const handleViewDetails = (course: any) => {
    setSelectedCourse(course);
    setOpenDialog(true);
  };

  const handleWorkflowAction = (action: string, courseId: number) => {
    console.log(`Performing ${action} on course ${courseId}`);
    // Implement workflow action logic
  };

  const getActionButtons = (course: any) => {
    const buttons = [];
    
    buttons.push(
      <Button
        key="view"
        size="small"
        startIcon={<VisibilityIcon />}
        onClick={() => handleViewDetails(course)}
      >
        Xem
      </Button>
    );

    if (course.status === 'DRAFT') {
      buttons.push(
        <Button
          key="edit"
          size="small"
          startIcon={<EditIcon />}
        >
          Sửa
        </Button>
      );
    }

    if (course.status === 'DRAFT') {
      buttons.push(
        <Button
          key="submit"
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => handleWorkflowAction('submit', course.id)}
        >
          Gửi duyệt
        </Button>
      );
    }

    if (course.status === 'REVIEWING') {
      if (course.workflowStage === 'ACADEMIC_OFFICE') {
        buttons.push(
          <Button
            key="approve"
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleWorkflowAction('approve', course.id)}
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
            onClick={() => handleWorkflowAction('reject', course.id)}
          >
            Từ chối
          </Button>
        );
        buttons.push(
          <Button
            key="return"
            size="small"
            startIcon={<ReplyIcon />}
            onClick={() => handleWorkflowAction('return', course.id)}
          >
            Trả về
          </Button>
        );
      }
    }

    if (course.status === 'APPROVED') {
      buttons.push(
        <Button
          key="publish"
          size="small"
          variant="contained"
          color="info"
          startIcon={<PublishIcon />}
          onClick={() => handleWorkflowAction('publish', course.id)}
        >
          Xuất bản
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AssignmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Quy trình phê duyệt học phần
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý quy trình phê duyệt và xem xét học phần
        </Typography>
      </Box>

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
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Trạng thái"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="DRAFT">Nháp</MenuItem>
              <MenuItem value="REVIEWING">Đang xem xét</MenuItem>
              <MenuItem value="APPROVED">Đã phê duyệt</MenuItem>
              <MenuItem value="REJECTED">Từ chối</MenuItem>
              <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Giai đoạn</InputLabel>
            <Select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              label="Giai đoạn"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="FACULTY">Khoa</MenuItem>
              <MenuItem value="ACADEMIC_OFFICE">Văn phòng đào tạo</MenuItem>
              <MenuItem value="ACADEMIC_BOARD">Hội đồng khoa học</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setSelectedStatus('all');
              setSelectedStage('all');
              setSearchTerm('');
            }}
          >
            Xóa bộ lọc
          </Button>
        </Box>
      </Paper>

      {/* Workflow Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tổng quan quy trình
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Stepper orientation="horizontal" activeStep={1} sx={{ mb: 3 }}>
          {workflowSteps.map((step, index) => (
            <Step key={index} completed={step.status === 'completed'} active={step.status === 'active'}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">5</Typography>
              <Typography variant="body2" color="text.secondary">Đang chờ duyệt</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">3</Typography>
              <Typography variant="body2" color="text.secondary">Đang xem xét</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">12</Typography>
              <Typography variant="body2" color="text.secondary">Đã phê duyệt</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">2</Typography>
              <Typography variant="body2" color="text.secondary">Từ chối</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">8</Typography>
              <Typography variant="body2" color="text.secondary">Đã xuất bản</Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Courses Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách học phần ({filteredCourses.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã môn</TableCell>
                <TableCell>Tên môn học</TableCell>
                <TableCell>Khoa</TableCell>
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
              {filteredCourses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {course.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {course.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course.credits} tín chỉ • {course.type}
                    </Typography>
                  </TableCell>
                  <TableCell>{course.faculty}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(course.status)}
                      color={getStatusColor(course.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStageLabel(course.workflowStage)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getPriorityLabel(course.priority)}
                      color={getPriorityColor(course.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        {course.submittedBy.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{course.submittedBy}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{course.submittedAt}</Typography>
                  </TableCell>
                  <TableCell>
                    {course.currentReviewer ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                          {course.currentReviewer.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{course.currentReviewer}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Chưa phân công
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {getActionButtons(course)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Course Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết học phần: {selectedCourse?.code} - {selectedCourse?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Mã môn học:</Typography>
                    <Typography variant="body1">{selectedCourse.code}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tên môn học:</Typography>
                    <Typography variant="body1">{selectedCourse.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Khoa:</Typography>
                    <Typography variant="body1">{selectedCourse.faculty}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tín chỉ:</Typography>
                    <Typography variant="body1">{selectedCourse.credits}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                    <Chip
                      label={getStatusLabel(selectedCourse.status)}
                      color={getStatusColor(selectedCourse.status) as any}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Giai đoạn:</Typography>
                    <Typography variant="body1">{getStageLabel(selectedCourse.workflowStage)}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lịch sử quy trình
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tạo mới"
                      secondary={`Bởi ${selectedCourse.submittedBy} vào ${selectedCourse.submittedAt}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Đang chờ duyệt"
                      secondary="Chờ Văn phòng đào tạo xem xét"
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
    </Container>
  );
}
