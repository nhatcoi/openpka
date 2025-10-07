'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { useAcademicWorkflows, useAcademicWorkflowDashboard, useWorkflowAction } from '@/hooks/use-academic-workflows';
import { WorkflowDisplay } from '@/components/academic/WorkflowDisplay';

const AcademicApprovalsPage: React.FC = () => {
  const [entityType, setEntityType] = useState<'COURSE' | 'PROGRAM' | 'MAJOR' | ''>('');
  const [status, setStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionComments, setActionComments] = useState('');

  const { workflows, loading, error } = useAcademicWorkflows(
    entityType || undefined,
    status || undefined
  );
  const { dashboard, loading: dashboardLoading } = useAcademicWorkflowDashboard();
  const { processAction, loading: actionLoading } = useWorkflowAction();

  const handleWorkflowAction = async (action: string, comments?: string) => {
    if (!selectedWorkflow) return;

    try {
      await processAction(selectedWorkflow.id, action, comments);
      setActionDialog(false);
      setActionComments('');
      setSelectedWorkflow(null);
      // Refresh workflows
      window.location.reload();
    } catch (error) {
      console.error('Failed to process workflow action:', error);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'COURSE':
        return <SchoolIcon />;
      case 'PROGRAM':
        return <AssignmentIcon />;
      case 'MAJOR':
        return <ScienceIcon />;
      default:
        return <SchoolIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'APPROVED':
        return 'Đã phê duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.workflow.workflow_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Phê duyệt Học thuật
      </Typography>

      {/* Dashboard Cards */}
      {dashboard && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PendingIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{dashboard.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ScheduleIcon color="warning" />
                  <Box>
                    <Typography variant="h6">{dashboard.pending}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chờ xử lý
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CheckCircleIcon color="success" />
                  <Box>
                    <Typography variant="h6">{dashboard.completed}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hoàn thành
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SchoolIcon color="info" />
                  <Box>
                    <Typography variant="h6">{dashboard.byEntity.COURSE}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Khóa học
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm workflow..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Loại thực thể</InputLabel>
              <Select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                label="Loại thực thể"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="COURSE">Khóa học</MenuItem>
                <MenuItem value="PROGRAM">Chương trình</MenuItem>
                <MenuItem value="MAJOR">Ngành học</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                <MenuItem value="IN_PROGRESS">Đang xử lý</MenuItem>
                <MenuItem value="APPROVED">Đã phê duyệt</MenuItem>
                <MenuItem value="REJECTED">Đã từ chối</MenuItem>
                <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Workflows Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workflow</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Bước hiện tại</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có workflow nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id.toString()}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {workflow.workflow.workflow_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getEntityIcon(workflow.entity_type)}
                        label={workflow.entity_type}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(workflow.status)}
                        color={getStatusColor(workflow.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {workflow.current_step} / {workflow.workflow.steps.length}
                    </TableCell>
                    <TableCell>
                      {new Date(workflow.initiated_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedWorkflow(workflow);
                          setActionDialog(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết Workflow</DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <WorkflowDisplay
              workflowInstance={selectedWorkflow}
              canApprove={true}
              onAction={(action) => {
                if (action === 'APPROVE' || action === 'REJECT' || action === 'RETURN') {
                  handleWorkflowAction(action, actionComments);
                }
              }}
            />
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nhận xét (tùy chọn)"
              multiline
              rows={3}
              value={actionComments}
              onChange={(e) => setActionComments(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Đóng</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleWorkflowAction('APPROVE', actionComments)}
            disabled={actionLoading}
          >
            Phê duyệt
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleWorkflowAction('REJECT', actionComments)}
            disabled={actionLoading}
          >
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AcademicApprovalsPage;
