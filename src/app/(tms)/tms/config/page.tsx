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
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export default function ConfigPage() {
  const [settings, setSettings] = useState({
    autoApproval: false,
    emailNotifications: true,
    workflowEnabled: true,
    academicYear: '2024-2025',
    semesterDuration: 15,
    maxCreditsPerSemester: 30
  });

  const [workflowStages] = useState([
    { id: 1, name: 'Faculty Review', order: 1, required: true, duration: 3 },
    { id: 2, name: 'Academic Office', order: 2, required: true, duration: 5 },
    { id: 3, name: 'Academic Board', order: 3, required: true, duration: 7 }
  ]);

  const [academicPeriods] = useState([
    { id: 1, name: 'Học kỳ 1', startDate: '2024-09-01', endDate: '2024-12-31', status: 'active' },
    { id: 2, name: 'Học kỳ 2', startDate: '2025-01-15', endDate: '2025-05-15', status: 'upcoming' }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenDialog = (type: string) => {
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SettingsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Cấu hình TMS
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý cài đặt hệ thống quản lý đào tạo
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3 }}>
        {/* General Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cài đặt chung
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoApproval}
                  onChange={(e) => handleSettingChange('autoApproval', e.target.checked)}
                />
              }
              label="Phê duyệt tự động"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              }
              label="Thông báo email"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.workflowEnabled}
                  onChange={(e) => handleSettingChange('workflowEnabled', e.target.checked)}
                />
              }
              label="Bật workflow phê duyệt"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Năm học"
              value={settings.academicYear}
              onChange={(e) => handleSettingChange('academicYear', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Thời gian học kỳ (tuần)"
                type="number"
                value={settings.semesterDuration}
                onChange={(e) => handleSettingChange('semesterDuration', parseInt(e.target.value))}
              />
              <TextField
                fullWidth
                label="Tín chỉ tối đa/kỳ"
                type="number"
                value={settings.maxCreditsPerSemester}
                onChange={(e) => handleSettingChange('maxCreditsPerSemester', parseInt(e.target.value))}
              />
            </Box>
          </Box>
        </Paper>

        {/* Workflow Configuration */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Quy trình phê duyệt
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('workflow')}
            >
              Thêm giai đoạn
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {workflowStages.map((stage) => (
              <ListItem key={stage.id} divider>
                <ListItemText
                  primary={stage.name}
                  secondary={`Thứ tự: ${stage.order} | Thời hạn: ${stage.duration} ngày`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={stage.required ? 'Bắt buộc' : 'Tùy chọn'}
                    color={stage.required ? 'primary' : 'default'}
                    size="small"
                  />
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Academic Periods */}
        <Paper sx={{ p: 3, gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Kỳ học
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('period')}
            >
              Thêm kỳ học
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {academicPeriods.map((period) => (
              <Card key={period.id}>
                <CardHeader
                  title={period.name}
                  action={
                    <Chip
                      label={period.status === 'active' ? 'Đang hoạt động' : 'Sắp tới'}
                      color={period.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Từ: {period.startDate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đến: {period.endDate}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditIcon />}>
                      Sửa
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />}>
                      Xóa
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>

        {/* System Information */}
        <Paper sx={{ p: 3, gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Typography variant="h6" gutterBottom>
            Thông tin hệ thống
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">12</Typography>
                <Typography variant="body2" color="text.secondary">
                  Chương trình đào tạo
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6">156</Typography>
                <Typography variant="body2" color="text.secondary">
                  Học phần
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">8</Typography>
                <Typography variant="body2" color="text.secondary">
                  Đang chờ phê duyệt
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h6">3</Typography>
                <Typography variant="body2" color="text.secondary">
                  Người dùng
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Box>

      {/* Dialog for adding new items */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'workflow' ? 'Thêm giai đoạn phê duyệt' : 'Thêm kỳ học'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'workflow' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField fullWidth label="Tên giai đoạn" />
              <TextField fullWidth label="Thứ tự" type="number" />
              <TextField fullWidth label="Thời hạn (ngày)" type="number" />
              <FormControlLabel control={<Switch />} label="Bắt buộc" />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField fullWidth label="Tên kỳ học" />
              <TextField fullWidth label="Ngày bắt đầu" type="date" InputLabelProps={{ shrink: true }} />
              <TextField fullWidth label="Ngày kết thúc" type="date" InputLabelProps={{ shrink: true }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}