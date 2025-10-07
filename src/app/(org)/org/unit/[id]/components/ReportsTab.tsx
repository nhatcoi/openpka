'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Avatar,
  Paper,
  Button,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorAccountIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/use-org-units';

interface ReportsTabProps {
  unit: OrgUnit;
}

interface OrgAssignment {
  id: string;
  employee_id: string;
  org_unit_id: string;
  job_position_id?: string;
  start_date: string;
  end_date?: string;
  assignment_type: string;
  is_primary: boolean;
  allocation: string;
  Employee: {
    id: string;
    employee_no: string;
    User: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  JobPosition?: {
    id: string;
    title: string;
    code: string;
  };
}

export default function ReportsTab({ unit }: ReportsTabProps) {
  // Assignment data state
  const [assignments, setAssignments] = useState<OrgAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assignments data
  useEffect(() => {
    loadAssignments();
  }, [unit.id]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/org/assignments?org_unit_id=${unit.id}`);
      const result = await response.json();
      
      if (result.success) {
        setAssignments(result.data);
      } else {
        setError(result.error || 'Failed to load assignments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from assignments data
  const totalAssignments = assignments.length;
  const totalChildren = unit.children?.length || 0;
  const totalSubEmployees = 0; // Not available from assignments API
  
  // Get assigned employees
  const assignedEmployees = assignments.map(assignment => ({
    id: assignment.Employee.id,
    name: assignment.Employee.User.full_name,
    employee_no: assignment.Employee.employee_no,
    position: assignment.JobPosition?.title || 'Chưa phân công',
    assignment_type: assignment.assignment_type,
    is_primary: assignment.is_primary,
    allocation: assignment.allocation,
  }));

  const managementCount = assignedEmployees.filter(emp => 
    emp.position?.toLowerCase().includes('trưởng') || 
    emp.position?.toLowerCase().includes('giám đốc') ||
    emp.position?.toLowerCase().includes('phó') ||
    emp.position?.toLowerCase().includes('head') ||
    emp.position?.toLowerCase().includes('manager')
  ).length;

  const staffCount = totalAssignments - managementCount;
  const primaryAssignments = assignedEmployees.filter(emp => emp.is_primary).length;
  const adminAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'admin').length;
  const academicAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'academic').length;
  const supportAssignments = assignedEmployees.filter(emp => emp.assignment_type === 'support').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải dữ liệu thống kê...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="error">
          Lỗi: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Báo cáo & Thống kê
      </Typography>

      <Stack spacing={3}>
        {/* Executive Summary */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Tổng quan
            </Typography>
            
            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#1976d2', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                  <BusinessIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalChildren}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đơn vị con
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#2e7d32', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                  <GroupIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng phân công
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#ed6c02', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                  <SupervisorAccountIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {managementCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Avatar sx={{ backgroundColor: '#9c27b0', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                  <PersonIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {staffCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nhân viên
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Organizational Structure Report */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Cơ cấu tổ chức
              </Typography>
              <Button variant="outlined" startIcon={<PieChartIcon />}>
                Xem biểu đồ
              </Button>
            </Stack>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Paper variant="outlined" sx={{ p: 2, minWidth: '300px', flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Phân bổ theo loại đơn vị
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tổng đơn vị:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {1 + totalChildren}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Đơn vị hiện tại:</Typography>
                    <Typography variant="body2">1</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Đơn vị con:</Typography>
                    <Typography variant="body2">{totalChildren}</Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, minWidth: '300px', flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Phân bổ nhân sự
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Nhân viên trực tiếp:</Typography>
                    <Typography variant="body2">{totalAssignments}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Nhân viên đơn vị con:</Typography>
                    <Typography variant="body2">{totalSubEmployees}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tổng cộng:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {totalAssignments}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </CardContent>
        </Card>

        {/* Personnel Analysis */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Phân tích nhân sự
              </Typography>
              <Button variant="outlined" startIcon={<BarChartIcon />}>
                Xem chi tiết
              </Button>
            </Stack>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '200px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {totalAssignments > 0 ? Math.round((managementCount / totalAssignments) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ quản lý
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '200px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {totalAssignments > 0 ? Math.round((staffCount / totalAssignments) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ nhân viên
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '200px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                  {totalChildren > 0 ? Math.round((totalAssignments / (1 + totalChildren)) * 10) / 10 : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nhân viên/đơn vị TB
                </Typography>
              </Paper>
            </Stack>
          </CardContent>
        </Card>

        {/* Assignment Type Statistics */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Thống kê loại phân công
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {adminAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hành chính
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalAssignments > 0 ? Math.round((adminAssignments / totalAssignments) * 100) : 0}%
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {academicAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Học thuật
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalAssignments > 0 ? Math.round((academicAssignments / totalAssignments) * 100) : 0}%
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {supportAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hỗ trợ
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalAssignments > 0 ? Math.round((supportAssignments / totalAssignments) * 100) : 0}%
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: '150px', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                  {primaryAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phân công chính
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalAssignments > 0 ? Math.round((primaryAssignments / totalAssignments) * 100) : 0}%
                </Typography>
              </Paper>
            </Stack>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Thao tác nhanh
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                startIcon={<AssessmentIcon />}
                sx={{ backgroundColor: '#2e4c92' }}
              >
                Xuất báo cáo PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<TrendingUpIcon />}
              >
                Báo cáo xu hướng
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PieChartIcon />}
              >
                Biểu đồ cơ cấu
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<BarChartIcon />}
              >
                So sánh đơn vị
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Placeholder for future charts */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Biểu đồ & Phân tích nâng cao
            </Typography>
            
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              border: '2px dashed #ccc'
            }}>
              <Stack alignItems="center" spacing={2}>
                <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                  Biểu đồ sẽ được hiển thị ở đây
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tính năng đang được phát triển
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
