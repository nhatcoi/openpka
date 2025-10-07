'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Avatar,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
} from '@mui/material';
import { 
  orgApi,
  type OrgUnit,
  type PaginationParams
} from '@/features/org/api/api';
import {
  getStatusColor,
  getTypeColor,
  getTypeIcon,
  canDeleteOrgUnit,
  getDeleteErrorMessage,
  getInitialFormData,
  mapUnitToFormData,
  getOrgUnitTypes,
  getOrgUnitStatuses,
} from '@/utils/org-unit-utils';
import { useOrgTypesStatuses } from '@/hooks/use-org-types-statuses';
import {
  convertTypesToOptions,
  convertStatusesToOptions,
  getTypeColorFromApi,
  getStatusColorFromApi,
  getTypeNameFromApi,
  getStatusNameFromApi,
  isStatusDeletableFromApi,
} from '@/utils/org-data-converters';
// import { ORG_UNIT_ALERTS } from '@/utils/alert-utils';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useOrgUnitsPagination } from '@/hooks/use-org-units-pagination';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface CreateUnitData {
  name: string;
  code: string;
  type: string;
  description: string;
  parent_id: number | null;
  status: string;
  effective_from: string;
  effective_to: string;
}

export default function OrgUnitManagementPage() {
  const router = useRouter();

  // Fetch real types and statuses from API
  const {
    types: apiTypes,
    statuses: apiStatuses,
    typesLoading,
    statusesLoading,
    error: apiError,
    refreshAll: refreshTypesStatuses,
  } = useOrgTypesStatuses();

  // Simple state management
  const [orgUnits, setOrgUnits] = React.useState<OrgUnit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [paginationState, setPaginationState] = React.useState({
    page: 1,
    size: 10,
    sort: 'name',
    order: 'asc' as 'asc' | 'desc',
    search: '',
    type: 'all',
    status: 'all',
  });

  // Async searchable parent unit options (independent from paginated orgUnits)
  const [parentOptions, setParentOptions] = React.useState<OrgUnit[]>([]);
  const [parentQuery, setParentQuery] = React.useState('');
  const [parentLoading, setParentLoading] = React.useState(false);

  // Debounced fetch for parent options
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const trimmed = parentQuery.trim();

    // Only fetch when user types at least 2 characters
    if (trimmed.length < 2) {
      setParentOptions([]);
      setParentLoading(false);
      return () => {
        active = false;
        controller.abort();
      };
    }

    const timeout = setTimeout(async () => {
      try {
        setParentLoading(true);
        const params = new URLSearchParams({
          page: '1',
          size: '10',
          sort: 'name',
          order: 'asc',
        });
        params.set('search', trimmed);
        const res = await fetch(`/api/org/units?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch units');
        const items = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data?.items)
          ? json.data.items
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        if (active) setParentOptions(items as any);
      } catch (e) {
        if (active) setParentOptions([]);
        // swallow for now
      } finally {
        if (active) setParentLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [parentQuery]);

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: PaginationParams = {
        page: paginationState.page,
        size: paginationState.size,
        sort: paginationState.sort,
        order: paginationState.order,
        search: paginationState.search,
        type: paginationState.type !== 'all' ? paginationState.type : undefined,
        status: paginationState.status !== 'all' ? paginationState.status : undefined,
      };

      console.log('Fetching with params:', params);

      const response = await orgApi.units.getAll(params);

      console.log('API Response:', response);

      
      if (response.success) {
        setOrgUnits(response.data?.items || []);
        setTotalCount(response.data?.pagination?.total || 0);
        console.log('orgUnits state updated, totalCount:', response.data?.pagination?.total);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when pagination changes
  React.useEffect(() => {
    console.log('useEffect triggered, fetching data...');
    fetchData();
  }, [paginationState.page, paginationState.size, paginationState.sort, paginationState.order, paginationState.search, paginationState.type, paginationState.status]);

  // Debug log for orgUnits state changes
  React.useEffect(() => {
    console.log('orgUnits state changed:', orgUnits);
  }, [orgUnits]);

  // Debug log for totalCount state changes
  React.useEffect(() => {
    console.log('totalCount state changed:', totalCount);
  }, [totalCount]);

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPaginationState(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationState(prev => ({ ...prev, size: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setPaginationState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    setPaginationState(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleFilterChange = (filters: { type?: string; status?: string }) => {
    setPaginationState(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const getFilterValue = (key: 'type' | 'status') => {
    return paginationState[key];
  };

  const updateFilter = (key: 'type' | 'status', value: string) => {
    setPaginationState(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Custom hooks for API operations (simplified - no mutations for now)
  // const createMutation = useCreateOrgUnit();
  // const updateMutation = useUpdateOrgUnit();
  // const deleteMutation = useDeleteOrgUnit();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreateUnitData>(getInitialFormData());

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateUnit = async () => {
    try {
      const result = await orgApi.units.create(formData);
      
      if (result.success) {
        setOpenCreateDialog(false);
        setFormData(getInitialFormData());
        fetchData(); // Refresh data
        setSuccessMessage('Tạo đơn vị thành công!');
        setError(null);
      } else {
        setError(result.error || 'Failed to create unit');
      }
    } catch (err) {
      setError('Failed to create unit');
    }
  };

  const handleEditUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      const result = await orgApi.units.update(selectedUnit.id, formData);
      
      if (result.success) {
        setOpenEditDialog(false);
        setSelectedUnit(null);
        fetchData(); // Refresh data
        setSuccessMessage('Cập nhật đơn vị thành công!');
        setError(null);
      } else {
        setError(result.error || 'Failed to update unit');
      }
    } catch (err) {
      setError('Failed to update unit');
    }
  };

  const handleDeleteUnit = async () => {
    console.log("handleDeleteUnit called - selectedUnit:", selectedUnit);
    if (!selectedUnit) {
      console.log("selectedUnit is null/undefined, returning");
      return;
    }
    
    try {
      const result = await orgApi.units.delete(selectedUnit.id);
      
      if (result.success) {
        setOpenDeleteDialog(false);
        setSelectedUnit(null);
        fetchData(); // Refresh data
        setSuccessMessage('Xóa đơn vị thành công!');
        setError(null);
      } else {
        setError(result.error || 'Failed to delete unit');
      }
    } catch (err) {
      setError('Failed to delete unit');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, unit: OrgUnit) => {
    setAnchorEl(event.currentTarget);
    setSelectedUnit(unit);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUnit(null);
  };

  const handleEditClick = () => {
    if (selectedUnit) {
      setFormData(mapUnitToFormData(selectedUnit));
      setOpenEditDialog(true);
      setAnchorEl(null); // Only close menu, keep selectedUnit
    }
  };

  const handleDeleteClick = () => {
    console.log('handleDeleteClick - selectedUnit:', selectedUnit);
    setOpenDeleteDialog(true);
    setAnchorEl(null); // Only close menu, keep selectedUnit
  };

  const handleRowClick = (unit: OrgUnit) => {
    router.push(`/org/unit/${unit.id}`);
  };


  // Handlers are now provided by the pagination hook

  // if (isLoading) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
  //       <CircularProgress size={60} />
  //     </Box>
  //   );
  // }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: '#2e4c92',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BusinessIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Quản lý đơn vị
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý các đơn vị tổ chức trong hệ thống
          </Typography>
        </Box>
      </Stack>

      {(error || apiError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Lỗi</AlertTitle>
          {error || apiError}
        </Alert>
      )}

      {/* Loading indicator for types/statuses */}
      {(typesLoading || statusesLoading) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Đang tải dữ liệu</AlertTitle>
          Đang tải danh sách loại đơn vị và trạng thái...
        </Alert>
      )}

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          <AlertTitle>Thành công</AlertTitle>
          {successMessage}
        </Alert>
      )}

      {/* Action Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
               <TextField
                 placeholder="Tìm kiếm đơn vị..."
                 value={paginationState.search}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 size="small"
                 sx={{ minWidth: 250 }}
                 InputProps={{
                   startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                 }}
               />
               
               <FormControl size="small" sx={{ minWidth: 120 }}>
                 <InputLabel>Loại</InputLabel>
                 <Select
                   value={getFilterValue('type')}
                   label="Loại"
                   onChange={(e) => updateFilter('type', e.target.value)}
                   disabled={typesLoading}
                 >
                   <MenuItem value="all">Tất cả</MenuItem>
                   {convertTypesToOptions(apiTypes).map((type) => (
                     <MenuItem key={type.value} value={type.value}>
                       {type.label}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>

               <FormControl size="small" sx={{ minWidth: 120 }}>
                 <InputLabel>Trạng thái</InputLabel>
                 <Select
                   value={getFilterValue('status')}
                   label="Trạng thái"
                   onChange={(e) => updateFilter('status', e.target.value)}
                   disabled={statusesLoading}
                 >
                   <MenuItem value="all">Tất cả</MenuItem>
                   {convertStatusesToOptions(apiStatuses).map((status) => (
                     <MenuItem key={status.value} value={status.value}>
                       {status.label}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchData();
                  refreshTypesStatuses();
                }}
                disabled={isLoading || typesLoading || statusesLoading}
              >
                Làm mới
              </Button>
              <PermissionGuard permission="org_unit.unit.create">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  sx={{ backgroundColor: '#2e4c92' }}
                >
                  Thêm đơn vị
                </Button>
              </PermissionGuard>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Pagination Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Hiển thị {((paginationState.page - 1) * paginationState.size) + 1}-{Math.min(paginationState.page * paginationState.size, totalCount)} của {totalCount} đơn vị
              </Typography>
            </Stack>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleSortChange('name')}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Đơn vị</span>
                    {paginationState.sort === 'name' && (
                      <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Stack>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleSortChange('code')}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Mã</span>
                    {paginationState.sort === 'code' && (
                      <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Đơn vị cha</TableCell>
                <TableCell>Nhân viên</TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleSortChange('created_at')}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Ngày tạo</span>
                    {paginationState.sort === 'created_at' && (
                      <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orgUnits.map((unit) => (
                <TableRow 
                  key={unit.id} 
                  hover 
                  onClick={() => handleRowClick(unit)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(46, 76, 146, 0.04)',
                    }
                  }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ backgroundColor: getTypeColorFromApi(unit.type, apiTypes) }}>
                        {React.createElement(getTypeIcon(unit.type))}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {unit.name}
                        </Typography>
                        {unit.description && (
                          <Typography variant="caption" color="text.secondary">
                            {String(unit.description)}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={unit.code}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={String(unit.type || 'N/A')}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColorFromApi(String(unit.type), apiTypes),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={String(unit.status || 'N/A')}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColorFromApi(String(unit.status), apiStatuses),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {unit.parent ? (
                      <Typography variant="body2">
                        {String(unit.parent.name)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Không có
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {String(unit.Employee?.length || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(String(unit.created_at)).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, unit);
                      }}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
         <TablePagination
           rowsPerPageOptions={[5, 10, 25]}
           component="div"
           count={totalCount}
           rowsPerPage={paginationState.size}
           page={paginationState.page - 1} // Convert to 0-based
           onPageChange={handleChangePage}
           onRowsPerPageChange={handleChangeRowsPerPage}
           labelRowsPerPage="Số dòng mỗi trang:"
           labelDisplayedRows={({ from, to, count }) => 
             `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
           }
         />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            '& .MuiMenuItem-root, & .MuiListItemText-root, & .MuiListItemText-primary': {
              color: '#000000 !important',
            },
          }
        }}
      >
        <MenuItem 
          onClick={handleEditClick}
          sx={{
            '&:hover': { backgroundColor: 'rgba(46, 76, 146, 0.08)' },
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#2e4c92' }} />
          </ListItemIcon>
          <ListItemText primary="Chỉnh sửa" />
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteClick}
          sx={{
            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' },
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText primary="Vô hiệu hóa" />
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Thêm đơn vị mới</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Tên đơn vị"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Mã đơn vị"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Loại đơn vị</InputLabel>
              <Select
                value={formData.type}
                label="Loại đơn vị"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={typesLoading}
              >
                {convertTypesToOptions(apiTypes).map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <Autocomplete
              fullWidth
              options={Array.isArray(parentOptions) ? parentOptions : []}
              getOptionLabel={(option) => option.name || ''}
              value={(Array.isArray(parentOptions) ? parentOptions : []).find(u => String(u.id) === String(formData.parent_id ?? '')) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, parent_id: newValue ? Number(newValue.id) : null });
              }}
              onInputChange={(_, value) => setParentQuery(value)}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              loading={parentLoading}
              ListboxProps={{
                style: { maxHeight: 320, overflow: 'auto' },
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị cha" placeholder="Tìm kiếm đơn vị..." />
              )}
              onOpen={() => {
                if (!parentOptions || parentOptions.length === 0) setParentQuery('');
              }}
              clearOnEscape
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                label="Trạng thái"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={statusesLoading}
              >
                {convertStatusesToOptions(apiStatuses).map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ngày hiệu lực từ"
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ngày hiệu lực đến"
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Hủy</Button>
          <Button onClick={handleCreateUnit} variant="contained" sx={{ backgroundColor: '#2e4c92' }}>
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => {
        setOpenEditDialog(false);
        setSelectedUnit(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Tên đơn vị"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Mã đơn vị"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Loại đơn vị</InputLabel>
              <Select
                value={formData.type}
                label="Loại đơn vị"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={typesLoading}
              >
                {convertTypesToOptions(apiTypes).map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <Autocomplete
              fullWidth
              options={(Array.isArray(parentOptions) ? parentOptions : []).filter(unit => String(unit.id) !== String(selectedUnit?.id ?? ''))}
              getOptionLabel={(option) => option.name || ''}
              value={parentOptions.find(u => String(u.id) === String(formData.parent_id ?? '')) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, parent_id: newValue ? Number(newValue.id) : null });
              }}
              onInputChange={(_, value) => setParentQuery(value)}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              loading={parentLoading}
              ListboxProps={{
                style: { maxHeight: 320, overflow: 'auto' },
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị cha" placeholder="Tìm kiếm đơn vị..." />
              )}
              onOpen={() => {
                // trigger initial fetch when opening if options empty
                if (parentOptions.length === 0) setParentQuery('');
              }}
              clearOnEscape
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                label="Trạng thái"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={statusesLoading}
              >
                {convertStatusesToOptions(apiStatuses).map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ngày hiệu lực từ"
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ngày hiệu lực đến"
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEditDialog(false);
            setSelectedUnit(null);
          }}>Hủy</Button>
          <Button onClick={handleEditUnit} variant="contained" sx={{ backgroundColor: '#2e4c92' }}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => {
        setOpenDeleteDialog(false);
        setSelectedUnit(null);
      }}>
        <DialogTitle>Xác nhận vô hiệu hóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn vô hiệu hóa đơn vị "{selectedUnit?.name}"? 
            Đơn vị sẽ bị xóa khỏi hệ thống và không thể khôi phục.
          </Typography>
          {selectedUnit?.status === 'active' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Cảnh báo</AlertTitle>
              Đây là đơn vị đang hoạt động. Việc vô hiệu hóa có thể ảnh hưởng đến các chức năng liên quan.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setSelectedUnit(null);
          }}>Hủy</Button>
          <Button onClick={handleDeleteUnit} variant="contained" color="error">
            Vô hiệu hóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
