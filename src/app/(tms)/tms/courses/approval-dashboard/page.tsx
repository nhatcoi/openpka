'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

interface DraftChange {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  current_step: number;
  initiated_by: string;
  initiated_at: string;
  completed_at?: string;
  metadata: {
    course_id: string;
    change_type: string;
    old_data?: any;
    new_data: any;
    change_reason?: string;
    change_notes?: string;
    status: string;
    submitted_at?: string;
    approved_at?: string;
    rejected_at?: string;
    approved_by?: string;
    rejected_by?: string;
    approval_comment?: string;
    rejection_reason?: string;
  };
  workflow: {
    workflow_name: string;
    description: string;
  };
  approval_records: Array<{
    id: string;
    action: string;
    comments?: string;
    approved_at: string;
    approver: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
}

export default function CourseApprovalDashboard() {
  const [draftChanges, setDraftChanges] = useState<DraftChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<DraftChange | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    loadDraftChanges();
  }, []);

  const loadDraftChanges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tms/courses/approval-dashboard');
      const result = await response.json();
      
      if (result.success) {
        setDraftChanges(result.data);
      } else {
        setError(result.error || 'Failed to load draft changes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load draft changes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (change: DraftChange) => {
    setSelectedChange(change);
    setOpenDetailDialog(true);
  };

  const handleApprove = (change: DraftChange) => {
    setSelectedChange(change);
    setOpenApproveDialog(true);
  };

  const handleReject = (change: DraftChange) => {
    setSelectedChange(change);
    setOpenRejectDialog(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedChange) return;

    try {
      const response = await fetch(`/api/tms/courses/${selectedChange.metadata.course_id}/draft-changes/${selectedChange.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: approveComment })
      });

      const result = await response.json();
      
      if (result.success) {
        setToast({ 
          open: true, 
          message: 'Draft change approved successfully', 
          severity: 'success' 
        });
        setOpenApproveDialog(false);
        setApproveComment('');
        loadDraftChanges();
      } else {
        setError(result.error || 'Failed to approve draft change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve draft change');
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedChange) return;

    try {
      const response = await fetch(`/api/tms/courses/${selectedChange.metadata.course_id}/draft-changes/${selectedChange.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: rejectReason })
      });

      const result = await response.json();
      
      if (result.success) {
        setToast({ 
          open: true, 
          message: 'Draft change rejected successfully', 
          severity: 'warning' 
        });
        setOpenRejectDialog(false);
        setRejectReason('');
        loadDraftChanges();
      } else {
        setError(result.error || 'Failed to reject draft change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject draft change');
    }
  };

  const getStatusColor = (change: DraftChange) => {
    const status = change.metadata?.status || 'DRAFT';
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (change: DraftChange) => {
    const status = change.metadata?.status || 'DRAFT';
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'PENDING_APPROVAL': return 'Chờ phê duyệt';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  const getStatusIcon = (change: DraftChange) => {
    const status = change.metadata?.status || 'DRAFT';
    switch (status) {
      case 'APPROVED': return <CheckCircleIcon color="success" />;
      case 'REJECTED': return <CancelIcon color="error" />;
      case 'PENDING_APPROVAL': return <SendIcon color="warning" />;
      case 'DRAFT': return <EditIcon color="action" />;
      default: return <EditIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Phê Duyệt Thay Đổi Học Phần
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Quản lý và phê duyệt các thay đổi học phần đang chờ xử lý
      </Typography>

      {draftChanges.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              Không có thay đổi nào đang chờ phê duyệt
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {draftChanges.map((change) => (
            <Grid item xs={12} md={6} lg={4} key={change.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Thay đổi #{change.id}
                    </Typography>
                    <Chip 
                      label={getStatusText(change)} 
                      color={getStatusColor(change)}
                      icon={getStatusIcon(change)}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Course ID: {change.metadata.course_id}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Loại: {change.metadata.change_type}
                  </Typography>
                  
                  {change.metadata.change_reason && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Lý do:</strong> {change.metadata.change_reason}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tạo lúc: {new Date(change.initiated_at).toLocaleString('vi-VN')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(change)}
                    >
                      Xem chi tiết
                    </Button>
                    
                    {change.metadata.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(change)}
                        >
                          Phê duyệt
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleReject(change)}
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết thay đổi #{selectedChange?.id}
        </DialogTitle>
        <DialogContent>
          {selectedChange && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Course ID:</strong> {selectedChange.metadata.course_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Loại thay đổi:</strong> {selectedChange.metadata.change_type}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Lý do:</strong> {selectedChange.metadata.change_reason || 'Không có lý do'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Tạo lúc:</strong> {new Date(selectedChange.initiated_at).toLocaleString('vi-VN')}
              </Typography>
              
              {selectedChange.metadata.old_data && selectedChange.metadata.new_data && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chi tiết thay đổi:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="error" gutterBottom>
                      <strong>Dữ liệu cũ:</strong>
                    </Typography>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                      {JSON.stringify(selectedChange.metadata.old_data, null, 2)}
                    </pre>
                    
                    <Typography variant="body2" color="success" gutterBottom sx={{ mt: 2 }}>
                      <strong>Dữ liệu mới:</strong>
                    </Typography>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                      {JSON.stringify(selectedChange.metadata.new_data, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}

              {selectedChange.approval_records.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Lịch sử phê duyệt:
                  </Typography>
                  <List dense>
                    {selectedChange.approval_records.map((record) => (
                      <ListItem key={record.id}>
                        <ListItemIcon>
                          {record.action === 'APPROVE' && <CheckCircleIcon color="success" />}
                          {record.action === 'REJECT' && <CancelIcon color="error" />}
                          {record.action === 'RETURN' && <SendIcon color="warning" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={record.comments || `Hành động: ${record.action}`}
                          secondary={`${record.approver.full_name} - ${new Date(record.approved_at).toLocaleString('vi-VN')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
        <DialogTitle>Phê duyệt thay đổi</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Bình luận phê duyệt"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>Hủy</Button>
          <Button onClick={handleApproveSubmit} variant="contained" color="success">
            Phê duyệt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Từ chối thay đổi</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do từ chối"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleRejectSubmit} 
            variant="contained" 
            color="error"
            disabled={!rejectReason.trim()}
          >
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
      />
    </Box>
  );
}