'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/api';
import { API_ROUTES } from '@/constants/routes';
import { useOrgTypesStatuses } from '@/hooks/use-org-types-statuses';
import {
  getTypeNameFromApi,
  getStatusNameFromApi,
} from '@/utils/org-data-converters';

import BasicInfoTab from './components/BasicInfoTab';
import PersonnelTab from './components/PersonnelTab';
import ReportsTab from './components/ReportsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`unit-tabpanel-${index}`}
      aria-labelledby={`unit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `unit-tab-${index}`,
    'aria-controls': `unit-tabpanel-${index}`,
  };
}

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  
  const [tabValue, setTabValue] = useState(0);
  const [unit, setUnit] = useState<OrgUnit | null>(null);
  const [childUnits, setChildUnits] = useState<OrgUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    types: apiTypes,
    statuses: apiStatuses,
  } = useOrgTypesStatuses();

  const fetchUnitData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ROUTES.ORG.UNITS_BY_ID(unitId));
      const data = await response.json();
      
      if (data.success) {
        setUnit(data.data);
      } else {
        setError(data.error || 'Failed to fetch unit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unit');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChildUnits = async () => {
    if (!unitId) return;
    
    try {
      setIsLoadingChildren(true);
      const url = new URL(API_ROUTES.ORG.UNITS, window.location.origin);
      url.searchParams.set('parent_id', unitId);
      url.searchParams.set('size', '100');
      url.searchParams.set('sort', 'name');
      url.searchParams.set('order', 'asc');
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        const items = data.data?.items || data.data || [];
        setChildUnits(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('Failed to fetch child units:', err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  React.useEffect(() => {
    if (unitId) {
      fetchUnitData();
      fetchChildUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const updateUnit = async (data: { name?: string; description?: string; [key: string]: unknown }) => {
    try {
      const response = await fetch(API_ROUTES.ORG.UNITS_BY_ID(unitId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (result.success) {
        setUnit(result.data);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to update unit');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateUnit = async (updateData: Partial<OrgUnit>) => {
    if (!unit?.id) throw new Error('Unit ID not found');
    
    const cleanedData: { [key: string]: unknown; name?: string; description?: string } = {
      ...updateData,
      description: updateData.description === null ? undefined : updateData.description,
    };
    
    await updateUnit(cleanedData);
  };

  const handleBack = () => {
    router.push('/org/unit');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Lỗi</AlertTitle>
          {error || 'Failed to fetch unit details'}
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Quay lại
        </Button>
      </Box>
    );
  }

  if (!unit) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Không tìm thấy</AlertTitle>
          Không tìm thấy đơn vị với ID: {unitId}
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Quay lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push('/org/unit')}
          sx={{ textDecoration: 'none' }}
        >
          Quản lý đơn vị
        </Link>
        <Typography color="text.primary">{unit.name}</Typography>
      </Breadcrumbs>

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
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {unit.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Chi tiết đơn vị tổ chức
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Quay lại
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tên đơn vị
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {unit.name}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Mã đơn vị
                </Typography>
                <Typography variant="body1">
                  {unit.code}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Loại
                </Typography>
                <Typography variant="body1">
                  {getTypeNameFromApi(unit.type, apiTypes) || unit.type || '—'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái
                </Typography>
                <Typography variant="body1">
                  {getStatusNameFromApi(unit.status, apiStatuses) || unit.status || '—'}
                </Typography>
              </Box>
            </Stack>

            {unit.description && (
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <BusinessIcon color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mô tả
                  </Typography>
                  <Typography variant="body1">
                    {unit.description}
                  </Typography>
                </Box>
              </Stack>
            )}

            {unit.effective_from && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày hiệu lực từ
                  </Typography>
                  <Typography variant="body1">
                    {new Date(unit.effective_from).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Stack>
            )}

            {unit.effective_to && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày hiệu lực đến
                  </Typography>
                  <Typography variant="body1">
                    {new Date(unit.effective_to).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Stack>
            )}

          </Stack>
        </CardContent>
      </Card>

      {childUnits.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Quan hệ đơn vị ({childUnits.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tên đơn vị</TableCell>
                    <TableCell>Mã đơn vị</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {childUnits.map((child) => (
                    <TableRow
                      key={child.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/org/unit/${child.id}`)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {child.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{child.code}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getTypeNameFromApi(child.type, apiTypes) || child.type || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getStatusNameFromApi(child.status, apiStatuses) || child.status || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="unit detail tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<BusinessIcon />} 
              label="Thông tin cơ bản" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<PersonIcon />} 
              label="Nhân sự" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<AssessmentIcon />} 
              label="Báo cáo" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <BasicInfoTab unit={unit} onUpdate={handleUpdateUnit} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PersonnelTab unit={unit as any} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ReportsTab unit={unit as any} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
