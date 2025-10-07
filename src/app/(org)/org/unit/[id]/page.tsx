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
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  AccountTree as AccountTreeIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/api';
import { API_ROUTES } from '@/constants/routes';
import { 
  getStatusColor, 
  getTypeColor, 
  getTypeIcon
} from '@/utils/org-unit-utils';

// Import tab components
import BasicInfoTab from './components/BasicInfoTab';
import RelationsTab from './components/RelationsTab';
import PersonnelTab from './components/PersonnelTab';
import HistoryTab from './components/HistoryTab';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch unit data
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

  // Fetch data on mount
  React.useEffect(() => {
    if (unitId) {
      fetchUnitData();
    }
  }, [unitId]);

  // Update unit function
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
    
    await updateUnit(updateData);
  };


  const handleDelete = () => {
    console.log('Delete unit:', unit?.id);
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
      <Box>
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
      <Box>
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
    <Box>
      {/* Breadcrumbs */}
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

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Quay lại
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>

        </Stack>
      </Stack>

      {/* Unit Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: getTypeColor(unit.type),
                fontSize: 32,
              }}
            >
              {React.createElement(getTypeIcon(unit.type))}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {unit.name}
                </Typography>
                <Chip
                  label={unit.code}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.875rem' }}
                />
              </Stack>
              
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={unit.type || 'Chưa xác định'}
                  size="small"
                  sx={{
                    backgroundColor: getTypeColor(unit.type || ''),
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
                <Chip
                  label={unit.status || 'Chưa xác định'}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(unit.status || ''),
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
                {unit.effective_from && (
                  <Chip
                    label={`Từ ${new Date(unit.effective_from).toLocaleDateString('vi-VN')}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Stack>

              {unit.description && (
                <Typography variant="body1" color="text.secondary">
                  {unit.description}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
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
              icon={<AccountTreeIcon />} 
              label="Quan hệ" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<PersonIcon />} 
              label="Nhân sự" 
              {...a11yProps(2)} 
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Lịch sử thay đổi" 
              {...a11yProps(3)} 
            />
            <Tab 
              icon={<AssessmentIcon />} 
              label="Báo cáo" 
              {...a11yProps(4)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <BasicInfoTab unit={unit} onUpdate={handleUpdateUnit} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RelationsTab unitId={unitId} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <PersonnelTab unit={unit} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <HistoryTab unitId={unitId} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <ReportsTab unit={unit} />
        </TabPanel>
      </Paper>
    </Box>
  );
}