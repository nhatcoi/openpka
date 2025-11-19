'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
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
  Autocomplete,
} from '@mui/material';
import { 
  orgApi,
  type OrgUnit,
  type PaginationParams
} from '@/features/org/api/api';
import {
  getInitialFormData,
  mapUnitToFormData,
} from '@/utils/org-unit-utils';
import { useOrgTypesStatuses } from '@/hooks/use-org-types-statuses';
import {
  convertTypesToOptions,
  convertStatusesToOptions,
  getTypeNameFromApi,
  getStatusNameFromApi,
} from '@/utils/org-data-converters';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Pause as PauseIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { usePermissions } from '@/lib/auth/permission-utils';

interface CreateUnitData {
  name: string;
  code: string;
  type: string;
  description: string;
  parent_id: string | null;
  status: string;
  effective_from: string;
  effective_to: string;
}

export default function OrgUnitManagementPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const {
    types: apiTypes,
    statuses: apiStatuses,
    typesLoading,
    statusesLoading,
    error: apiError,
    refreshAll: refreshTypesStatuses,
  } = useOrgTypesStatuses();

  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationState, setPaginationState] = useState({
    page: 1,
    size: 10,
    sort: 'name',
    order: 'asc' as 'asc' | 'desc',
    search: '',
    type: 'all',
    status: 'all',
    parent_id: '',
  });

  const [parentOptions, setParentOptions] = useState<OrgUnit[]>([]);
  const [parentLoading, setParentLoading] = useState(false);

  const fetchParentOptions = useCallback(async () => {
    try {
      setParentLoading(true);
      const params = new URLSearchParams({
        page: '1',
        size: '100',
        sort: 'name',
        order: 'asc',
      });
      const res = await fetch(`/api/org/units?${params.toString()}`);
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
      setParentOptions(items as any);
    } catch (e) {
      console.error('Failed to fetch parent options:', e);
      setParentOptions([]);
    } finally {
      setParentLoading(false);
    }
  }, []);

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
        parent_id: paginationState.parent_id ? paginationState.parent_id : undefined,
      };

      const response = await orgApi.units.getAll(params);
      
      if (response.success) {
        const responseData = response.data as any;
        if (responseData?.items && Array.isArray(responseData.items)) {
          setOrgUnits(responseData.items || []);
          setTotalCount(responseData.pagination?.total || 0);
        } else if (Array.isArray(responseData)) {
          setOrgUnits(responseData || []);
          setTotalCount(responseData?.length || 0);
        } else {
          setOrgUnits([]);
          setTotalCount(0);
        }
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationState.page, paginationState.size, paginationState.sort, paginationState.order, paginationState.search, paginationState.type, paginationState.status, paginationState.parent_id]);

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

  const getFilterValue = (key: 'type' | 'status' | 'parent_id') => {
    return paginationState[key];
  };

  const updateFilter = (key: 'type' | 'status' | 'parent_id', value: string) => {
    setPaginationState(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  
  const [formData, setFormData] = useState<CreateUnitData>(getInitialFormData());

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
        fetchData();
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
        fetchData();
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
    if (!selectedUnit) return;
    
    try {
      const result = await orgApi.units.delete(selectedUnit.id);
      
      if (result.success) {
        setOpenDeleteDialog(false);
        setSelectedUnit(null);
        fetchData();
        setSuccessMessage('Xóa đơn vị thành công!');
        setError(null);
      } else {
        const errorMessage = (result as any).details || result.error || 'Failed to delete unit';
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.details || err?.message || 'Failed to delete unit';
      setError(errorMessage);
    }
  };

  const handleArchiveUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      const result = await orgApi.units.archive(selectedUnit.id);
      
      if (result.success) {
        setOpenArchiveDialog(false);
        setSelectedUnit(null);
        fetchData();
        setSuccessMessage('Lưu trữ đơn vị thành công!');
        setError(null);
      } else {
        const errorMessage = (result as any).details || result.error || 'Failed to archive unit';
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.details || err?.message || 'Failed to archive unit';
      setError(errorMessage);
    }
  };

  const handleDeactivateUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      const result = await orgApi.units.deactivate(selectedUnit.id);
      
      if (result.success) {
        setOpenDeactivateDialog(false);
        setSelectedUnit(null);
        fetchData();
        setSuccessMessage('Dừng hoạt động đơn vị thành công!');
        setError(null);
      } else {
        const errorMessage = (result as any).details || result.error || 'Failed to deactivate unit';
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.details || err?.message || 'Failed to deactivate unit';
      setError(errorMessage);
    }
  };

  const handleEditClick = (unit: OrgUnit) => {
    const formData = mapUnitToFormData(unit as any) as CreateUnitData;
    setFormData(formData);
    setSelectedUnit(unit);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOpenDeleteDialog(true);
  };

  const handleArchiveClick = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOpenArchiveDialog(true);
  };

  const handleDeactivateClick = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOpenDeactivateDialog(true);
  };

  const handleRowClick = (unit: OrgUnit) => {
    router.push(`/org/unit/${unit.id}`);
  };

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
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

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
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
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
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

              <FormControl size="small" sx={{ minWidth: 150 }}>
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

              <Autocomplete
                size="small"
                sx={{ minWidth: 250 }}
                options={parentOptions}
                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                loading={parentLoading}
                value={parentOptions.find((u) => String(u.id) === paginationState.parent_id) || null}
                onChange={(_, newValue) => {
                  updateFilter('parent_id', newValue ? String(newValue.id) : '');
                }}
                filterOptions={(options, params) => {
                  const searchText = params.inputValue.toLowerCase();
                  return options.filter((option) => 
                    option.name?.toLowerCase().includes(searchText) ||
                    option.code?.toLowerCase().includes(searchText)
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Đơn vị cha"
                    placeholder="Tìm kiếm đơn vị cha..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                )}
                onOpen={() => {
                  if (!parentOptions || parentOptions.length === 0) {
                    fetchParentOptions();
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BusinessIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.code}
                        </Typography>
                      </Box>
                    </Stack>
                  </li>
                )}
              />
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
              {hasPermission('org_unit.unit.create') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  sx={{ backgroundColor: '#2e4c92' }}
                >
                  Thêm đơn vị
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Hiển thị {((paginationState.page - 1) * paginationState.size) + 1}-{Math.min(paginationState.page * paginationState.size, totalCount)} của {totalCount} đơn vị
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => handleSortChange('name')}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <strong>Đơn vị</strong>
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
                      <strong>Mã</strong>
                      {paginationState.sort === 'code' && (
                        <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell><strong>Loại</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell><strong>Đơn vị cha</strong></TableCell>
                  <TableCell><strong>Nhân viên</strong></TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => handleSortChange('created_at')}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <strong>Ngày tạo</strong>
                      {paginationState.sort === 'created_at' && (
                        <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => handleSortChange('updated_at')}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <strong>Ngày cập nhật</strong>
                      {paginationState.sort === 'updated_at' && (
                        <span>{paginationState.order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : orgUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {paginationState.search ? 'Không tìm thấy đơn vị nào' : 'Chưa có đơn vị nào'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orgUnits.map((unit) => (
                    <TableRow 
                      key={unit.id} 
                      hover
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <BusinessIcon color="primary" />
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              onClick={() => handleRowClick(unit)}
                              sx={{
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
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
                        <Typography variant="body2">
                          {unit.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getTypeNameFromApi(unit.type, apiTypes) || unit.type || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getStatusNameFromApi(unit.status, apiStatuses) || unit.status || '—'}
                        </Typography>
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
                          {String((unit as any).Employee?.length || (unit as any).OrgAssignment?.length || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(String(unit.created_at)).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {unit.updated_at ? new Date(String(unit.updated_at)).toLocaleDateString('vi-VN') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(unit)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {(unit.status === 'ACTIVE' || unit.status === 'APPROVED') && (
                            <Tooltip title="Dừng hoạt động">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivateClick(unit);
                                }}
                              >
                                <PauseIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Lưu trữ">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveClick(unit);
                              }}
                            >
                              <ArchiveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(unit);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={paginationState.size}
            page={paginationState.page - 1}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
            }
          />
        </CardContent>
      </Card>

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
              options={parentOptions}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={parentOptions.find(u => String(u.id) === String(formData.parent_id ?? '')) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, parent_id: newValue ? String(newValue.id) : null });
              }}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              loading={parentLoading}
              filterOptions={(options, params) => {
                const searchText = params.inputValue.toLowerCase();
                return options.filter((option) => 
                  option.name?.toLowerCase().includes(searchText) ||
                  option.code?.toLowerCase().includes(searchText)
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị cha" placeholder="Tìm kiếm đơn vị..." />
              )}
              onOpen={() => {
                if (!parentOptions || parentOptions.length === 0) {
                  fetchParentOptions();
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              )}
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
              options={parentOptions.filter(unit => String(unit.id) !== String(selectedUnit?.id ?? ''))}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={parentOptions.find(u => String(u.id) === String(formData.parent_id ?? '')) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, parent_id: newValue ? String(newValue.id) : null });
              }}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              loading={parentLoading}
              filterOptions={(options, params) => {
                const searchText = params.inputValue.toLowerCase();
                return options.filter((option) => 
                  option.name?.toLowerCase().includes(searchText) ||
                  option.code?.toLowerCase().includes(searchText)
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị cha" placeholder="Tìm kiếm đơn vị..." />
              )}
              onOpen={() => {
                if (!parentOptions || parentOptions.length === 0) {
                  fetchParentOptions();
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              )}
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

      <Dialog open={openArchiveDialog} onClose={() => {
        setOpenArchiveDialog(false);
        setSelectedUnit(null);
      }}>
        <DialogTitle>Xác nhận lưu trữ</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn lưu trữ đơn vị "{selectedUnit?.name}"? 
            Đơn vị sẽ được chuyển sang trạng thái lưu trữ.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenArchiveDialog(false);
            setSelectedUnit(null);
          }}>Hủy</Button>
          <Button onClick={handleArchiveUnit} variant="contained" color="warning">
            Lưu trữ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeactivateDialog} onClose={() => {
        setOpenDeactivateDialog(false);
        setSelectedUnit(null);
      }}>
        <DialogTitle>Xác nhận dừng hoạt động</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn dừng hoạt động đơn vị "{selectedUnit?.name}"? 
            Đơn vị sẽ được chuyển sang trạng thái không hoạt động (INACTIVE).
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Lưu ý:</strong> Không thể dừng hoạt động đơn vị nếu còn đơn vị con đang hoạt động.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeactivateDialog(false);
            setSelectedUnit(null);
          }}>Hủy</Button>
          <Button onClick={handleDeactivateUnit} variant="contained" color="warning">
            Dừng hoạt động
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => {
        setOpenDeleteDialog(false);
        setSelectedUnit(null);
      }}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa đơn vị "{selectedUnit?.name}"? 
            Đơn vị sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setSelectedUnit(null);
          }}>Hủy</Button>
          <Button onClick={handleDeleteUnit} variant="contained" color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
