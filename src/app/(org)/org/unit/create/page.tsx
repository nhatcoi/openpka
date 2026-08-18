'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Visibility as ReviewIcon,
  CheckCircle as ApproveIcon,
  PlayArrow as ActiveIcon,
  Assignment as MonitorIcon,
  Archive as ArchiveIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  CheckCircle,
} from '@mui/icons-material';
import { UnitFormData, UnitType, UNIT_TYPES, WORKFLOW_STEPS } from '@/features/org';

export default function CreateUnitPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<UnitFormData>({
    name: '',
    code: '',
    type: '',
    parent_id: '',
    description: '',
    effective_from: '',
    manager_id: '',
    manager_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UnitFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Draft step
        if (!formData.name.trim()) newErrors.name = 'Tên đơn vị không được để trống';
        if (!formData.code.trim()) newErrors.code = 'Mã code không được để trống';
        if (!formData.type) newErrors.type = 'Loại đơn vị không được để trống';
        if (!formData.effective_from) newErrors.effective_from = 'Ngày thành lập không được để trống';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or next step
    if (stepIndex <= activeStep || stepIndex === activeStep + 1) {
      setActiveStep(stepIndex);
    }
  };

  const handleSaveDraft = () => {
    if (validateStep(0)) {
      // TODO: Save draft to database
      console.log('Saving draft:', formData);
      alert('Đã lưu bản nháp thành công!');
    }
  };

  const handleSubmitForReview = () => {
    if (validateStep(0)) {
      // TODO: Submit for review
      console.log('Submitting for review:', formData);
      alert('Đã gửi yêu cầu thẩm định thành công!');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Draft
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Thông tin cơ bản
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Tên đơn vị *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Ví dụ: Khoa Công nghệ Thông tin"
              />
              <TextField
                fullWidth
                label="Mã code *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                error={!!errors.code}
                helperText={errors.code}
                placeholder="Ví dụ: IT"
              />
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Loại đơn vị *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Loại đơn vị *"
                >
                  {UNIT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {type.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.type}
                  </Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Ngày thành lập dự kiến *"
                type="date"
                value={formData.effective_from}
                onChange={(e) => handleInputChange('effective_from', e.target.value)}
                error={!!errors.effective_from}
                helperText={errors.effective_from}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả về chức năng, nhiệm vụ của đơn vị..."
                sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
              />
              <TextField
                fullWidth
                label="Người phụ trách dự kiến"
                value={formData.manager_name}
                onChange={(e) => handleInputChange('manager_name', e.target.value)}
                placeholder="Tên người sẽ phụ trách đơn vị"
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDraft}
                >
                  Lưu bản nháp
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmitForReview}
                >
                  Gửi thẩm định
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Tiếp theo
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 1: // Review
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <ReviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kiểm tra và thẩm định
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Quy trình thẩm định</AlertTitle>
              Cấp quản lý trực tiếp sẽ kiểm tra tính hợp lệ và nguồn lực trước khi phê duyệt.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Thông tin đã nhập
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><BusinessIcon /></ListItemIcon>
                    <ListItemText primary="Tên đơn vị" secondary={formData.name || 'Chưa nhập'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BusinessIcon /></ListItemIcon>
                    <ListItemText primary="Mã code" secondary={formData.code || 'Chưa nhập'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BusinessIcon /></ListItemIcon>
                    <ListItemText primary="Loại" secondary={UNIT_TYPES.find(t => t.value === formData.type)?.label || 'Chưa chọn'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><DateIcon /></ListItemIcon>
                    <ListItemText primary="Ngày thành lập" secondary={formData.effective_from || 'Chưa chọn'} />
                  </ListItem>
                </List>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Danh sách kiểm tra
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="✓ Kiểm tra tính hợp lệ của parent unit" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Kiểm tra trùng tên/mã code" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Đánh giá nguồn lực nhân sự" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Kiểm tra cơ sở vật chất" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Đối chiếu quy chế tổ chức" />
                  </ListItem>
                </List>
              </Paper>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box>
                <Button variant="outlined" onClick={handleBack}>
                  Quay lại chỉnh sửa
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="warning">
                  Yêu cầu chỉnh sửa
                </Button>
                <Button variant="contained" color="success" onClick={handleNext}>
                  Đồng ý trình phê duyệt
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 2: // Approve
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <ApproveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Phê duyệt chính thức
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Quyết định thành lập</AlertTitle>
              Hội đồng trường/Hiệu trưởng sẽ quyết định chính thức thành lập đơn vị.
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Đơn vị đề xuất thành lập:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label={formData.name} color="primary" />
                <Chip label={formData.code} color="secondary" />
                <Chip 
                  label={UNIT_TYPES.find(t => t.value === formData.type)?.label} 
                  color="info" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Ngày thành lập dự kiến: {formData.effective_from}
              </Typography>
              
              {formData.description && (
                <Typography variant="body2" paragraph>
                  <strong>Mô tả:</strong> {formData.description}
                </Typography>
              )}
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box>
                <Button variant="outlined" color="error">
                  Từ chối
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button variant="contained" color="success" onClick={handleNext}>
                  Phê duyệt thành lập
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 3: // Active
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <ActiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kích hoạt và bổ nhiệm
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Kích hoạt đơn vị</AlertTitle>
              Sau khi phê duyệt, đơn vị sẽ được kích hoạt và bổ nhiệm nhân sự phụ trách.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cấu hình phân quyền
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="✓ Thiết lập quyền truy cập hệ thống" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Cấu hình phân công giảng viên" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="✓ Thiết lập quản lý chương trình" />
                  </ListItem>
                </List>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Bổ nhiệm nhân sự
                </Typography>
                <TextField
                  fullWidth
                  label="Trưởng đơn vị"
                  value={formData.manager_name}
                  onChange={(e) => handleInputChange('manager_name', e.target.value)}
                  placeholder="Chọn người phụ trách đơn vị"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Phó đơn vị (nếu có)"
                  placeholder="Chọn phó đơn vị"
                />
              </Paper>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box>
                <Button variant="outlined" onClick={handleBack}>
                  Quay lại
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined">
                  Cấu hình sau
                </Button>
                <Button variant="contained" color="success" onClick={handleNext}>
                  Kích hoạt ngay
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 4: // Monitor
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <MonitorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Theo dõi và quản lý trạng thái
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Đơn vị đã được kích hoạt</AlertTitle>
              Đơn vị hiện đang hoạt động và có thể quản lý các trạng thái sau này.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Trạng thái hiện tại
                </Typography>
                <Chip label="Active" color="success" sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Đơn vị đang hoạt động bình thường
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Các trạng thái khác
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" color="warning" size="small">
                    Tạm ngừng (Suspended)
                  </Button>
                  <Button variant="outlined" color="error" size="small">
                    Ngừng hoạt động (Inactive)
                  </Button>
                  <Button variant="outlined" color="secondary" size="small">
                    Lưu trữ (Archived)
                  </Button>
                </Box>
              </Paper>
            </Box>

            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lịch sử thay đổi
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Tạo đơn vị" 
                    secondary={`${new Date().toLocaleString()} - Trạng thái: Draft`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Phê duyệt thành lập" 
                    secondary={`${new Date().toLocaleString()} - Trạng thái: Approved`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Kích hoạt đơn vị" 
                    secondary={`${new Date().toLocaleString()} - Trạng thái: Active`}
                  />
                </ListItem>
              </List>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box>
                <Button variant="outlined" onClick={handleBack}>
                  Quay lại
                </Button>
              </Box>
              <Box>
                <Button variant="contained" color="primary">
                  Hoàn thành
                </Button>
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Tạo đơn vị mới
      </Typography>

      {/* Quick Navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bước hiện tại: {WORKFLOW_STEPS[activeStep]?.label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {WORKFLOW_STEPS.map((step, index) => (
              <Chip
                key={step.key}
                label={`${index + 1}. ${step.label}`}
                color={index === activeStep ? 'primary' : index < activeStep ? 'success' : 'default'}
                onClick={() => handleStepClick(index)}
                clickable={index <= activeStep || index === activeStep + 1}
                variant={index === activeStep ? 'filled' : 'outlined'}
                icon={step.icon}
              />
            ))}
          </Box>
          
          {/* Demo buttons for testing */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setActiveStep(0)}
              disabled={activeStep === 0}
            >
              Reset về bước 1
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setActiveStep(Math.min(activeStep + 1, WORKFLOW_STEPS.length - 1))}
              disabled={activeStep === WORKFLOW_STEPS.length - 1}
            >
              Bước tiếp theo
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setActiveStep(WORKFLOW_STEPS.length - 1)}
              disabled={activeStep === WORKFLOW_STEPS.length - 1}
            >
              Đi đến bước cuối
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {WORKFLOW_STEPS.map((step, index) => (
              <Step key={step.key}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  icon={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {step.icon}
                      {activeStep > index && (
                        <CheckCircle sx={{ ml: 1, color: 'success.main' }} />
                      )}
                    </Box>
                  }
                  sx={{
                    cursor: index <= activeStep || index === activeStep + 1 ? 'pointer' : 'default',
                    '&:hover': index <= activeStep || index === activeStep + 1 ? {
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                    } : {},
                  }}
                >
                  <Typography variant="h6">
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
}
