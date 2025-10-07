'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

// Types for API responses
interface OrgStats {
  totalUnits: number;
  totalEmployees: number;
  activeUnits: number;
  inactiveUnits: number;
  departments: number;
  divisions: number;
  teams: number;
  branches: number;
  topUnits: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    employeeCount: number;
  }>;
}

interface UnitTypeStats {
  type: string;
  count: number;
  percentage: number;
}

interface UnitWithoutHead {
  id: string;
  name: string;
  code: string;
  type: string | null;
  days: number;
}

interface UnitWithoutStaff {
  id: string;
  name: string;
  code: string;
  type: string | null;
  employeeCount: number;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // State for report data
  const [reportData, setReportData] = useState({
    overview: {
      totalUnits: 0,
      totalEmployees: 0,
      activeUnits: 0,
      inactiveUnits: 0,
      departments: 0,
      divisions: 0,
      teams: 0,
      branches: 0,
      topUnits: [] as Array<{
        id: string;
        name: string;
        code: string;
        type: string;
        employeeCount: number;
      }>,
    },
    byType: [] as UnitTypeStats[],
    unitsWithoutHead: [] as UnitWithoutHead[],
    unitsWithoutStaff: [] as UnitWithoutStaff[],
  });

  // API functions
  const fetchOrgStats = async (): Promise<OrgStats | null> => {
    try {
      const response = await fetch('/api/org/reports?type=overview');
      const result = await response.json();
      if (result.success) {
        return {
          totalUnits: result.data.totalUnits,
          totalEmployees: result.data.totalEmployees,
          activeUnits: result.data.activeUnits,
          inactiveUnits: result.data.inactiveUnits,
          departments: result.data.unitsWithEmployees,
          divisions: 0,
          teams: 0,
          branches: 0,
          topUnits: []
        };
      }
      throw new Error(result.error || 'Failed to fetch org stats');
    } catch (error) {
      console.error('Error fetching org stats:', error);
      throw error;
    }
  };

  const fetchUnitsByType = async (): Promise<UnitTypeStats[]> => {
    try {
      // Get all units to calculate type distribution
      const response = await fetch(buildUrl(API_ROUTES.ORG.UNITS, { page: 1, size: 1000, sort: 'name', order: 'asc' }));
      const result = await response.json();
      if (result.success) {
        const units = result.data?.items || result.data || [];
        const typeCounts: Record<string, number> = {};
        
        // Count units by type
        units.forEach((unit: { type: string | null }) => {
          const type = unit.type || 'unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const total = units.length;
        
        // Convert to array with percentages
        return Object.entries(typeCounts).map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
        }));
      }
      throw new Error(result.error || 'Failed to fetch units');
    } catch (error) {
      console.error('Error fetching units by type:', error);
      throw error;
    }
  };

  const fetchUnitsWithoutHead = async (): Promise<UnitWithoutHead[]> => {
    try {
      const response = await fetch('/api/org/reports?type=units-without-head');
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch units without head');
    } catch (error) {
      console.error('Error fetching units without head:', error);
      throw error;
    }
  };

  const fetchUnitsWithoutStaff = async (): Promise<UnitWithoutStaff[]> => {
    try {
      const response = await fetch('/api/org/reports?type=units-without-staff');
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch units without staff');
    } catch (error) {
      console.error('Error fetching units without staff:', error);
      throw error;
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [orgStats, unitsByType, unitsWithoutHead, unitsWithoutStaff] = await Promise.all([
        fetchOrgStats(),
        fetchUnitsByType(),
        fetchUnitsWithoutHead(),
        fetchUnitsWithoutStaff(),
      ]);

      if (orgStats) {
        setReportData({
          overview: {
            totalUnits: orgStats.totalUnits,
            totalEmployees: orgStats.totalEmployees,
            activeUnits: orgStats.activeUnits,
            inactiveUnits: orgStats.inactiveUnits,
            departments: orgStats.departments,
            divisions: orgStats.divisions,
            teams: orgStats.teams,
            branches: orgStats.branches,
            topUnits: orgStats.topUnits,
          },
          byType: unitsByType,
          unitsWithoutHead,
          unitsWithoutStaff,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load report data';
      setError(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadReportData();
  }, []);

  const handleRefresh = () => {
    loadReportData();
  };

  const reportTypes = [
    {
      id: 'overview',
      title: 'Tổng quan',
      description: 'Thống kê tổng quan về tổ chức',
      icon: <AssessmentIcon />,
      color: '#2e4c92',
    },
    {
      id: 'by_campus',
      title: 'Theo campus',
      description: 'Phân bố đơn vị và nhân sự theo campus',
      icon: <BusinessIcon />,
      color: '#1976d2',
    },
    {
      id: 'by_type',
      title: 'Theo loại đơn vị',
      description: 'Thống kê theo loại đơn vị tổ chức',
      icon: <PieChartIcon />,
      color: '#388e3c',
    },
    {
      id: 'missing_head',
      title: 'Thiếu trưởng đơn vị',
      description: 'Danh sách đơn vị chưa có trưởng',
      icon: <SupervisorAccountIcon />,
      color: '#f57c00',
    },
    {
      id: 'missing_staff',
      title: 'Thiếu nhân sự',
      description: 'Đơn vị chưa có nhân viên',
      icon: <GroupIcon />,
      color: '#d32f2f',
    },
  ];

  const renderOverviewReport = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon sx={{ color: '#2e4c92', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : reportData.overview.totalUnits}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số đơn vị
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <GroupIcon sx={{ color: '#1976d2', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : reportData.overview.totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng nhân viên
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TrendingUpIcon sx={{ color: '#388e3c', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : reportData.overview.activeUnits}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đơn vị hoạt động
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <WarningIcon sx={{ color: '#f57c00', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : reportData.unitsWithoutHead.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thiếu trưởng đơn vị
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <GroupIcon sx={{ color: '#d32f2f', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : reportData.unitsWithoutStaff.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thiếu nhân sự
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderByCampusReport = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Phân bố theo Campus
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Alert severity="info">
            Báo cáo phân bố theo campus đang được phát triển. Vui lòng sử dụng báo cáo "Theo loại đơn vị" để xem thống kê chi tiết.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderByTypeReport = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Phân bố theo loại đơn vị
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : reportData.byType.length === 0 ? (
          <Alert severity="info">
            Không có dữ liệu đơn vị để hiển thị.
          </Alert>
        ) : (
          <List>
            {(reportData.byType || []).map((type, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <PieChartIcon color="primary" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#000000',
                        fontSize: '14px',
                        fontWeight: 'medium'
                      }}
                    >
                      {type.type}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666666',
                        fontSize: '12px'
                      }}
                    >
                      {type.count} đơn vị
                    </Typography>
                  </Box>
                  <Chip
                    label={`${type.percentage}%`}
                    color="secondary"
                    variant="outlined"
                  />
                </ListItem>
                {index < reportData.byType.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderMissingHeadReport = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Đơn vị thiếu trưởng
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : reportData.unitsWithoutHead.length === 0 ? (
          <Alert severity="success">
            Tất cả đơn vị đều đã có trưởng đơn vị.
          </Alert>
        ) : (
          <List>
            {(reportData.unitsWithoutHead || []).map((unit, index) => (
              <React.Fragment key={unit.id}>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#000000',
                        fontSize: '14px',
                        fontWeight: 'medium'
                      }}
                    >
                      {unit.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666666',
                        fontSize: '12px'
                      }}
                    >
                      {unit.code} • {unit.type || 'Không xác định'}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${unit.days} ngày`}
                    color="warning"
                    variant="outlined"
                  />
                </ListItem>
                {index < reportData.unitsWithoutHead.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderMissingStaffReport = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Đơn vị thiếu nhân sự
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : reportData.unitsWithoutStaff.length === 0 ? (
          <Alert severity="success">
            Tất cả đơn vị đều đã có nhân sự.
          </Alert>
        ) : (
          <List>
            {(reportData.unitsWithoutStaff || []).map((unit, index) => (
              <React.Fragment key={unit.id}>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="error" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#000000',
                        fontSize: '14px',
                        fontWeight: 'medium'
                      }}
                    >
                      {unit.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666666',
                        fontSize: '12px'
                      }}
                    >
                      {unit.code} • {unit.type || 'Không xác định'}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${unit.employeeCount} nhân viên`}
                    color="error"
                    variant="outlined"
                  />
                </ListItem>
                {index < reportData.unitsWithoutStaff.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'by_campus':
        return renderByCampusReport();
      case 'by_type':
        return renderByTypeReport();
      case 'missing_head':
        return renderMissingHeadReport();
      case 'missing_staff':
        return renderMissingStaffReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AssessmentIcon sx={{ color: 'primary.contrastText', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Báo cáo tổ chức
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thống kê và phân tích cấu trúc tổ chức
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Report Types Sidebar */}
        <Box sx={{ flex: { xs: 'none', md: '0 0 300px' } }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <FilterListIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Loại báo cáo
                </Typography>
              </Stack>
              
              <List>
                {reportTypes.map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem
                      onClick={() => setSelectedReport(report.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedReport === report.id ? `${report.color}15` : 'transparent',
                        '&:hover': {
                          backgroundColor: selectedReport === report.id ? `${report.color}25` : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: selectedReport === report.id ? report.color : 'text.secondary' }}>
                        {report.icon}
                      </ListItemIcon>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: selectedReport === report.id ? 'bold' : 'normal',
                            color: selectedReport === report.id ? report.color : '#000000',
                            fontSize: '14px'
                          }}
                        >
                          {report.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666666',
                            fontSize: '12px'
                          }}
                        >
                          {report.description}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < reportTypes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Report Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {reportTypes.find(r => r.id === selectedReport)?.title}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Làm mới dữ liệu">
                    <IconButton onClick={handleRefresh} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ backgroundColor: '#2e4c92' }}
                    disabled={loading}
                  >
                    Xuất báo cáo
                  </Button>
                </Stack>
              </Stack>

              {renderReportContent()}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
