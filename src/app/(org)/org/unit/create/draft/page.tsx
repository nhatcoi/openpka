'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useOrgUnits, useParentUnits } from '@/features/org/api/use-org-units';
import { useCampuses } from '@/features/org/api/use-campuses';
import { useOrgTypesStatuses } from '@/hooks/use-org-types-statuses';
import { convertTypesToOptions, convertStatusesToOptions } from '@/utils/org-data-converters';
import { AlertMessage, createSuccessAlert, createErrorAlert, closeAlert } from '@/utils/alert-utils';
import { useSession } from 'next-auth/react';



// Campus and parent units data will be fetched from API

interface DraftUnitFormData {
  // SECTION 1: THÔNG TIN CƠ BẢN
  code: string;
  name: string;
  type: string;
  campus_id: string;
  
  // SECTION 2: THÔNG TIN BỔ SUNG
  parent_id: string;
  description: string;
  planned_establishment_date: string;
  
  // SECTION 3: THÔNG TIN WORKFLOW
  owner_org_id: string;
  requester_id: string; // Auto-fill từ session
  
  // SECTION 4: THÔNG TIN BỔ SUNG WORKFLOW
  request_details: string;
  attachments: Array<{ id: string; name: string; url: string; [key: string]: unknown }>;
}

export default function CreateDraftPage() {
  const [editingUnit, setEditingUnit] = useState<{ [key: string]: unknown } | null>(null);
  const [formData, setFormData] = useState<DraftUnitFormData>({
    code: '',
    name: '',
    type: 'F',
    campus_id: '1',
    parent_id: '',
    description: '',
    planned_establishment_date: '',
    owner_org_id: '',
    requester_id: '1',
    request_details: '{"budget": 2000000, "staff": 20, "equipment": "computers"}',
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<AlertMessage>(closeAlert());

  // Key-value pairs for additional workflow information
  const [workflowInfo, setWorkflowInfo] = useState<Array<{key: string, value: string}>>([
    { key: 'budget', value: '2000000' },
    { key: 'staff', value: '20' },
    { key: 'equipment', value: 'computers' }
  ]);

  // Fetch draft units from API
  const { data: draftUnitsResponse, isLoading, error, refetch } = useOrgUnits({
    status: 'DRAFT',
    page: 1,
    size: 50,
    sort: 'created_at',
    order: 'desc',
  });

  // Fetch rejected units from API
  const { data: rejectedUnitsResponse, isLoading: rejectedLoading } = useOrgUnits({
    status: 'REJECTED',
    page: 1,
    size: 50,
    sort: 'created_at',
    order: 'desc',
  });

  // Fetch campuses from API
  const { data: campusesResponse, isLoading: campusesLoading } = useCampuses({
    status: 'ACTIVE',
  });

  // Fetch parent units from API
  const { data: parentUnitsResponse, isLoading: parentUnitsLoading } = useParentUnits();

  // Fetch types and statuses from API
  const { types: apiTypes, statuses: apiStatuses, typesLoading, statusesLoading, error: apiError } = useOrgTypesStatuses();

  // Get current user session
  const { data: session, status: sessionStatus } = useSession();

  const draftUnits = draftUnitsResponse?.items || [];
  const rejectedUnits = rejectedUnitsResponse?.items || [];

  // Create dynamic types from API data
  const dynamicTypes = [
    { value: '', label: 'Chưa xác định', description: 'Loại đơn vị sẽ được xác định sau' },
    ...convertTypesToOptions(apiTypes).map(type => ({
      value: type.value,
      label: type.label,
      description: `Cấp ${type.label.toLowerCase()}`
    }))
  ];

  // Group and sort parent units by type with group headers
  const getSortedParentUnitsWithGroups = () => {
    if (!parentUnitsResponse) return [];
    
    // Group units by type
    const groupedUnits = parentUnitsResponse.items.reduce((acc: any, unit: any) => {
      const type = unit.type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(unit);
      return acc;
    }, {});

    // Sort types based on hierarchy (University -> Faculty -> Department -> etc.)
    const typeOrder = ['UNIVERSITY', 'FACULTY', 'DEPARTMENT', 'DIVISION', 'CENTER', 'INSTITUTE', 'OFFICE', 'BAN', 'UNKNOWN'];
    
    // Create sorted array with group headers
    const sortedUnitsWithGroups: any[] = [];
    typeOrder.forEach(type => {
      if (groupedUnits[type] && groupedUnits[type].length > 0) {
        // Add group header
        sortedUnitsWithGroups.push({
          id: `group-${type}`,
          isGroupHeader: true,
          type: type,
          name: getTypeLabel(type),
          count: groupedUnits[type].length
        });
        
        // Sort units within each type by name
        const sortedByType = groupedUnits[type].sort((a: any, b: any) => 
          a.name.localeCompare(b.name, 'vi-VN')
        );
        sortedUnitsWithGroups.push(...sortedByType);
      }
    });

    return sortedUnitsWithGroups;
  };

  // Auto-select first parent unit for owner_org_id when data is loaded
  useEffect(() => {
    if (parentUnitsResponse?.items && parentUnitsResponse.items.length > 0 && !formData.owner_org_id) {
      setFormData(prev => ({
        ...prev,
        owner_org_id: parentUnitsResponse.items[0].id
      }));
    }
  }, [parentUnitsResponse, formData.owner_org_id]);

  // Auto-fill current user ID into requester field when session is loaded
  useEffect(() => {
    if (session?.user?.id && !formData.requester_id) {
      setFormData(prev => ({
        ...prev,
        requester_id: session.user.id
      }));
    }
  }, [session, formData.requester_id]);

  const handleInputChange = (field: keyof DraftUnitFormData, value: string | null | Array<{ [key: string]: unknown }>) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // SECTION 1: THÔNG TIN CƠ BẢN
    if (!formData.code.trim()) newErrors.code = 'Mã code không được để trống';
    if (!formData.name.trim()) newErrors.name = 'Tên đơn vị không được để trống';
    if (!formData.type || formData.type === '') newErrors.type = 'Loại đơn vị không được để trống';
    if (!formData.campus_id || formData.campus_id === '') newErrors.campus_id = 'Campus không được để trống';
    
    // SECTION 3: THÔNG TIN WORKFLOW
    if (!formData.owner_org_id || formData.owner_org_id === '') newErrors.owner_org_id = 'Đơn vị chủ quản không được để trống';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForReview = async () => {
    if (validateForm()) {
      try {
        const response = await fetch(API_ROUTES.ORG.INITIAL_UNITS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // SECTION 1: THÔNG TIN CƠ BẢN
            code: formData.code,
            name: formData.name,
            type: formData.type || null,
            campus_id: formData.campus_id,
            
            // SECTION 2: THÔNG TIN BỔ SUNG
            parent_id: formData.parent_id || null,
            description: formData.description || null,
            planned_establishment_date: formData.planned_establishment_date || null,
            
            // SECTION 3: THÔNG TIN WORKFLOW
            owner_org_id: formData.owner_org_id,
            requester_id: formData.requester_id,
            
            // SECTION 4: THÔNG TIN BỔ SUNG WORKFLOW
            request_details: getWorkflowInfoJson() ? (() => {
              try {
                return JSON.parse(getWorkflowInfoJson());
              } catch {
                // If not valid JSON, treat as plain text
                return { description: getWorkflowInfoJson() };
              }
            })() : null,
            attachments: formData.attachments,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Unit submitted for review:', result);
          setAlert(createSuccessAlert('Đã gửi yêu cầu thẩm định thành công!', 'Thành công'));
          // Refresh data after submitting
          refetch();
          // Reset form
          handleResetForm();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to submit for review');
        }
      } catch (error) {
        console.error('Error submitting for review:', error);
        setAlert(createErrorAlert(`Có lỗi xảy ra khi gửi thẩm định: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Lỗi'));
      }
    }
  };

  const handleEditUnit = (unit: { id: string; name: string; [key: string]: unknown }) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code || '',
      name: unit.name || '',
      type: unit.type || 'F',
      campus_id: unit.campus_id || '1',
      parent_id: unit.parent_id || '',
      description: unit.description || '',
      planned_establishment_date: unit.planned_establishment_date || '',
      owner_org_id: '',
      requester_id: '1',
      request_details: '{"budget": 2000000, "staff": 20, "equipment": "computers"}',
      attachments: [],
    });
  };

  const handleResetForm = () => {
    setEditingUnit(null);
    setFormData({
      code: '',
      name: '',
      type: 'F', // Default to Faculty
      campus_id: '1', // Default to first campus
      parent_id: '',
      description: '',
      planned_establishment_date: '',
      owner_org_id: '', // Will be set from API data
      requester_id: '1', // Mock user ID - in real app, get from session
      request_details: '{"budget": 2000000, "staff": 20, "equipment": "computers"}',
      attachments: [],
    });
    setErrors({});
  };

  const getTypeLabel = (type: string | null) => {
    if (!type || type === '') return 'Chưa xác định';
    return dynamicTypes.find(t => t.value === type)?.label || type;
  };

  const getRequesterDisplay = () => {
    if (sessionStatus === 'loading') return 'Đang tải...';
    if (!session?.user) return 'Chưa đăng nhập';
    const user = session.user;
    return `${user.name || user.email || 'User'} (ID: ${user.id})`;
  };

  // Functions to manage workflow info key-value pairs
  const addWorkflowInfo = () => {
    setWorkflowInfo(prev => [...prev, { key: '', value: '' }]);
  };

  const removeWorkflowInfo = (index: number) => {
    setWorkflowInfo(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorkflowInfo = (index: number, field: 'key' | 'value', value: string) => {
    setWorkflowInfo(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Convert workflow info to JSON string
  const getWorkflowInfoJson = () => {
    const obj: Record<string, string> = {};
    workflowInfo.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        obj[item.key.trim()] = item.value.trim();
      }
    });
    return JSON.stringify(obj);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Đề xuất đơn vị mới
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Quy trình khởi tạo</AlertTitle>
        Tạo đơn vị mới ở trạng thái nháp với thông tin cơ bản. Sau khi hoàn thành có thể gửi cấp trên thẩm định.
      </Alert>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
          Không thể tải danh sách loại đơn vị và trạng thái: {apiError}
        </Alert>
      )}

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Đơn vị đang đề xuất
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {isLoading ? <CircularProgress size={20} /> : draftUnits.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đơn vị đang soạn thảo
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Đơn vị bị từ chối
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {rejectedLoading ? <CircularProgress size={20} /> : rejectedUnits.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đơn vị bị từ chối
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {editingUnit ? 'Chỉnh sửa đề xuất' : 'Tạo mới một đề xuất đơn vị'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
              >
                Làm mới
              </Button>
              {editingUnit && (
                <Button
                  variant="outlined"
                  onClick={handleResetForm}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>

          {/* Alert Messages */}
          {alert.open && (
            <Alert 
              severity={alert.severity} 
              sx={{ mb: 3 }}
              onClose={() => setAlert(closeAlert())}
            >
              <AlertTitle>{alert.title}</AlertTitle>
              {alert.message}
            </Alert>
          )}

          {/* Basic Info */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Thông tin cơ bản
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <TextField
              fullWidth
              label="Mã code *"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              error={!!errors.code}
              helperText={errors.code}
              placeholder="Ví dụ: IT"
            />
            <TextField
              fullWidth
              label="Tên đơn vị *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Ví dụ: Khoa Công nghệ Thông tin"
            />
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Loại đơn vị *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Loại đơn vị *"
                disabled={typesLoading}
              >
                {typesLoading ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Đang tải...</Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  dynamicTypes.map((type) => (
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
                  ))
                )}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.type}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth error={!!errors.campus_id}>
              <InputLabel>Campus *</InputLabel>
              <Select
                value={formData.campus_id}
                onChange={(e) => handleInputChange('campus_id', e.target.value)}
                label="Campus *"
                disabled={campusesLoading}
              >
                {campusesResponse?.map((campus: { id: string; name: string; [key: string]: unknown }) => (
                  <MenuItem key={campus.id} value={campus.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {campus.name_vi}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {campus.code} {campus.address && `- ${campus.address}`}
                      </Typography>
                    </Box>
                  </MenuItem>
                )) || []}
              </Select>
              {campusesLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                  Đang tải danh sách campus...
                </Typography>
              )}
              {errors.campus_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.campus_id}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Additional Info */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Additional Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Đơn vị cha</InputLabel>
              <Select
                value={formData.parent_id}
                onChange={(e) => handleInputChange('parent_id', e.target.value)}
                label="Đơn vị cha"
                disabled={parentUnitsLoading}
              >
                <MenuItem value="">
                  <em>Không có đơn vị cha</em>
                </MenuItem>
                {parentUnitsLoading ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <span>Đang tải...</span>
                    </Box>
                  </MenuItem>
                ) : (
                  getSortedParentUnitsWithGroups().map((item: any) => {
                    if (item.isGroupHeader) {
                      return (
                        <MenuItem key={item.id} disabled sx={{ 
                          backgroundColor: 'grey.100',
                          fontWeight: 'bold',
                          '&:hover': { backgroundColor: 'grey.100' }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({item.count} đơn vị)
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    }
                    
                    return (
                      <MenuItem key={item.id} value={item.id} sx={{ pl: 3 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.code} • {getTypeLabel(item.type)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Ngày thành lập dự kiến"
              type="date"
              value={formData.planned_establishment_date}
              onChange={(e) => handleInputChange('planned_establishment_date', e.target.value)}
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
          </Box>

          {/* Workflow Info */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Workflow Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <FormControl fullWidth error={!!errors.owner_org_id}>
              <InputLabel>Đơn vị chủ quản *</InputLabel>
              <Select
                value={formData.owner_org_id}
                onChange={(e) => handleInputChange('owner_org_id', e.target.value)}
                label="Đơn vị chủ quản *"
                disabled={parentUnitsLoading}
              >
                {parentUnitsLoading ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <span>Đang tải...</span>
                    </Box>
                  </MenuItem>
                ) : (
                  getSortedParentUnitsWithGroups().map((item: any) => {
                    if (item.isGroupHeader) {
                      return (
                        <MenuItem key={item.id} disabled sx={{ 
                          backgroundColor: 'grey.100',
                          fontWeight: 'bold',
                          '&:hover': { backgroundColor: 'grey.100' }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({item.count} đơn vị)
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    }
                    
                    return (
                      <MenuItem key={item.id} value={item.id} sx={{ pl: 3 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.code} • {getTypeLabel(item.type)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
              {errors.owner_org_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.owner_org_id}
                </Typography>
              )}
            </FormControl>
            <TextField
              fullWidth
              label="Người yêu cầu"
              value={getRequesterDisplay()}
              disabled
              
            />
          </Box>

          {/* Additional Workflow Info */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Additional Workflow Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Chi tiết yêu cầu 
              </Typography>
              
              {workflowInfo.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Yêu cầu"
                    value={item.key}
                    onChange={(e) => updateWorkflowInfo(index, 'key', e.target.value)}
                    placeholder="Ví dụ: budget"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Giá trị"
                    value={item.value}
                    onChange={(e) => updateWorkflowInfo(index, 'value', e.target.value)}
                    placeholder="Ví dụ: 2000000"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={() => removeWorkflowInfo(index)}
                    color="error"
                    disabled={workflowInfo.length <= 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                onClick={addWorkflowInfo}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Thêm thông tin
              </Button>
              
              {/* <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  JSON Preview:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {getWorkflowInfoJson()}
                </Typography>
              </Box> */}
            </Box>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                File đính kèm (Tùy chọn)
              </Typography>
              <Button variant="outlined" component="label" startIcon={<AddIcon />}>
                Chọn file
                <input 
                  type="file" 
                  hidden 
                  multiple 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const fileAttachments = files.map(file => ({
                      file_name: file.name,
                      file_path: `/uploads/${file.name}`,
                      file_size: file.size,
                      mime_type: file.type,
                      description: `File đính kèm: ${file.name}`
                    }));
                    handleInputChange('attachments', fileAttachments);
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
              </Typography>
              {formData.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Files đã chọn:
                  </Typography>
                  {formData.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={`${attachment.file_name} (${(attachment.file_size / 1024).toFixed(1)}KB)`}
                      onDelete={() => {
                        const newAttachments = formData.attachments.filter((_, i) => i !== index);
                        handleInputChange('attachments', newAttachments);
                      }}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>


          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSubmitForReview}
            >
              Submit for Review
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Draft Units List
        </Typography>
        {error && (
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
            {error.message || 'Không thể tải danh sách đơn vị'}
          </Alert>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Loading...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : draftUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No draft units found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              draftUnits.map((unit: { id: string; name: string; [key: string]: unknown }) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {unit.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={unit.code} size="small" />
                  </TableCell>
                  <TableCell>{getTypeLabel(unit.type || '')}</TableCell>
                  <TableCell>
                    {unit.parent ? unit.parent.name : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(unit.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={unit.status || 'draft'} 
                      color="primary" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleEditUnit(unit)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rejected Units Table */}
      {rejectedUnits.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main' }}>
            Rejected Units ({rejectedUnits.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rejectedLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Loading rejected units...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rejectedUnits.map((unit: { id: string; name: string; [key: string]: unknown }) => (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {unit.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={unit.code} size="small" />
                      </TableCell>
                      <TableCell>{getTypeLabel(unit.type || '')}</TableCell>
                      <TableCell>
                        {unit.parent ? unit.parent.name : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(unit.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={unit.status || 'rejected'} 
                          color="error" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => handleEditUnit(unit)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <RefreshIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

    </Box>
  );
}
