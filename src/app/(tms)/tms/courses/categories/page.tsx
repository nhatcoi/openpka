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
  Breadcrumbs,
  Link,
  TableContainer,
  TableHead,
  TableRow,
  Badge
} from '@mui/material';
import {
  Category as CategoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  BookOnline as BookOnlineIcon,
  Assessment as AssessmentIcon,
  Science as ScienceIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

export default function SubjectCategoriesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const categories = [
    {
      id: 1,
      name: 'Kiến thức giáo dục đại cương',
      code: 'GDTC',
      description: 'Các môn học cung cấp kiến thức nền tảng chung',
      color: '#1976d2',
      icon: <SchoolIcon />,
      subjects: 45,
      required: true,
      order: 1,
      subcategories: [
        { id: 1, name: 'Toán học', subjects: 12 },
        { id: 2, name: 'Vật lý', subjects: 8 },
        { id: 3, name: 'Hóa học', subjects: 6 },
        { id: 4, name: 'Ngoại ngữ', subjects: 10 },
        { id: 5, name: 'Khoa học xã hội', subjects: 9 }
      ]
    },
    {
      id: 2,
      name: 'Kiến thức cơ sở ngành',
      code: 'CSN',
      description: 'Kiến thức cơ sở của chuyên ngành',
      color: '#2e7d32',
      icon: <AssignmentIcon />,
      subjects: 35,
      required: true,
      order: 2,
      subcategories: [
        { id: 6, name: 'Lập trình cơ bản', subjects: 8 },
        { id: 7, name: 'Cấu trúc dữ liệu', subjects: 6 },
        { id: 8, name: 'Thuật toán', subjects: 6 },
        { id: 9, name: 'Cơ sở dữ liệu', subjects: 5 },
        { id: 10, name: 'Mạng máy tính', subjects: 4 },
        { id: 11, name: 'Hệ điều hành', subjects: 6 }
      ]
    },
    {
      id: 3,
      name: 'Kiến thức chuyên ngành',
      code: 'CNN',
      description: 'Kiến thức chuyên sâu của ngành',
      color: '#ed6c02',
      icon: <BookOnlineIcon />,
      subjects: 60,
      required: true,
      order: 3,
      subcategories: [
        { id: 12, name: 'Phát triển ứng dụng', subjects: 15 },
        { id: 13, name: 'Thiết kế hệ thống', subjects: 12 },
        { id: 14, name: 'An toàn thông tin', subjects: 8 },
        { id: 15, name: 'Trí tuệ nhân tạo', subjects: 10 },
        { id: 16, name: 'Khoa học dữ liệu', subjects: 15 }
      ]
    },
    {
      id: 4,
      name: 'Đồ án/Khóa luận',
      code: 'DA',
      description: 'Đồ án tốt nghiệp và khóa luận',
      color: '#9c27b0',
      icon: <AssessmentIcon />,
      subjects: 8,
      required: true,
      order: 4,
      subcategories: [
        { id: 17, name: 'Đồ án cơ sở', subjects: 3 },
        { id: 18, name: 'Đồ án chuyên ngành', subjects: 3 },
        { id: 19, name: 'Khóa luận tốt nghiệp', subjects: 2 }
      ]
    }
  ];

  const subjectTypes = [
    { value: 'theory', label: 'Lý thuyết' },
    { value: 'practice', label: 'Thực hành' },
    { value: 'mixed', label: 'Lý thuyết + Thực hành' },
    { value: 'project', label: 'Đồ án' },
    { value: 'thesis', label: 'Khóa luận' }
  ];

  const handleOpenDialog = (type: string, category?: any) => {
    setDialogType(type);
    setSelectedCategory(category || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setSelectedCategory(null);
  };

  const handleSaveCategory = () => {
    console.log('Saving category:', selectedCategory);
    handleCloseDialog();
  };

  const handleDeleteCategory = (categoryId: number) => {
    console.log('Deleting category:', categoryId);
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
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
        <Typography color="text.primary">Phân loại</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <CategoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Phân loại học phần
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các danh mục và phân loại học phần
        </Typography>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{categories.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Danh mục chính
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">{categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Danh mục con
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <BookOnlineIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6">{categories.reduce((sum, cat) => sum + cat.subjects, 0)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng học phần
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h6">{categories.filter(cat => cat.required).length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Danh mục bắt buộc
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Categories List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {categories.map((category) => (
          <Accordion key={category.id} sx={{ border: `2px solid ${category.color}20` }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ color: category.color, mr: 2 }}>
                  {category.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.code} • {category.subjects} học phần • Thứ tự: {category.order}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  <Chip
                    label={category.required ? 'Bắt buộc' : 'Tùy chọn'}
                    color={category.required ? 'primary' : 'default'}
                    size="small"
                  />
                  <Badge badgeContent={category.subcategories.length} color="secondary">
                    <SettingsIcon />
                  </Badge>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {category.description}
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {category.subcategories.map((subcategory) => (
                    <Card key={subcategory.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">{subcategory.name}</Typography>
                          <Chip label={`${subcategory.subjects} môn`} size="small" variant="outlined" />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleOpenDialog('view', category)}
                >
                  Xem chi tiết
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog('edit', category)}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Xóa
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Add Category Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Thêm danh mục mới
        </Button>
      </Box>

      {/* Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Thêm danh mục học phần'}
          {dialogType === 'edit' && 'Chỉnh sửa danh mục'}
          {dialogType === 'view' && 'Chi tiết danh mục'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Tên danh mục"
              value={selectedCategory?.name || ''}
              disabled={dialogType === 'view'}
            />
            <TextField
              fullWidth
              label="Mã danh mục"
              value={selectedCategory?.code || ''}
              disabled={dialogType === 'view'}
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={selectedCategory?.description || ''}
              disabled={dialogType === 'view'}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Số học phần"
                type="number"
                value={selectedCategory?.subjects || 0}
                disabled={dialogType === 'view'}
              />
              <TextField
                fullWidth
                label="Thứ tự hiển thị"
                type="number"
                value={selectedCategory?.order || 1}
                disabled={dialogType === 'view'}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedCategory?.required || false}
                  disabled={dialogType === 'view'}
                />
              }
              label="Danh mục bắt buộc"
            />
          </Box>
          
          {dialogType === 'view' && selectedCategory && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Danh mục con
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên danh mục con</TableCell>
                      <TableCell align="center">Số học phần</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedCategory.subcategories.map((subcategory: any) => (
                      <TableRow key={subcategory.id}>
                        <TableCell>{subcategory.name}</TableCell>
                        <TableCell align="center">{subcategory.subjects}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogType !== 'view' && (
            <Button variant="contained" onClick={handleSaveCategory}>
              Lưu
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
