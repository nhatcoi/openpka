'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon
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

interface CourseDraftChangeManagerProps {
  courseId: string;
  onDraftChange?: (draftChange: DraftChange) => void;
}

export default function CourseDraftChangeManager({ 
  courseId, 
  onDraftChange 
}: CourseDraftChangeManagerProps) {
  const [draftChanges, setDraftChanges] = useState<DraftChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load draft changes
  const loadDraftChanges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tms/courses/${courseId}/draft-changes`);
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

  useEffect(() => {
    loadDraftChanges();
  }, [courseId]);

  // Lắng nghe event refresh từ parent component
  useEffect(() => {
    const handleRefresh = () => {
      loadDraftChanges();
    };

    window.addEventListener('refreshDraftChanges', handleRefresh);
    return () => {
      window.removeEventListener('refreshDraftChanges', handleRefresh);
    };
  }, []);

  // Create draft change
  const handleCreateDraftChange = async (changeData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tms/courses/${courseId}/draft-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change_type: 'UPDATE',
          new_data: changeData,
          change_reason: changeReason,
          change_notes: changeNotes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setToast({ 
          open: true, 
          message: 'Draft change created successfully', 
          severity: 'success' 
        });
        setOpenDialog(false);
        setChangeReason('');
        setChangeNotes('');
        loadDraftChanges();
        if (onDraftChange) {
          onDraftChange(result.data);
        }
      } else {
        setError(result.error || 'Failed to create draft change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create draft change');
    } finally {
      setLoading(false);
    }
  };

  // Submit draft change
  const handleSubmitDraftChange = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tms/courses/${courseId}/draft-changes/${workflowId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        setToast({ 
          open: true, 
          message: 'Draft change submitted for approval', 
          severity: 'success' 
        });
        loadDraftChanges();
      } else {
        setError(result.error || 'Failed to submit draft change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit draft change');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (draftChange: DraftChange) => {
    const status = draftChange.metadata?.status || 'DRAFT';
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (draftChange: DraftChange) => {
    const status = draftChange.metadata?.status || 'DRAFT';
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'PENDING_APPROVAL': return 'Chờ phê duyệt';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="Quản lý thay đổi nháp"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setOpenHistoryDialog(true)}
              >
                Lịch sử
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Tạo thay đổi
              </Button>
            </Box>
          }
        />
        <CardContent>
          {draftChanges.length === 0 ? (
            <Typography color="text.secondary">
              Chưa có thay đổi nháp nào
            </Typography>
          ) : (
            <List>
              {draftChanges.map((draft) => (
                <React.Fragment key={draft.id}>
                  <ListItem>
                    <ListItemIcon>
                      {draft.metadata?.status === 'APPROVED' && <CheckCircleIcon color="success" />}
                      {draft.metadata?.status === 'REJECTED' && <CancelIcon color="error" />}
                      {draft.metadata?.status === 'PENDING_APPROVAL' && <SendIcon color="warning" />}
                      {draft.metadata?.status === 'DRAFT' && <EditIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" color="text.secondary">
                            Thay đổi #{draft.id}
                          </Typography>
                          <Chip 
                            label={getStatusText(draft)} 
                            color={getStatusColor(draft)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Lý do: {draft.metadata?.change_reason || 'Không có lý do'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tạo lúc: {new Date(draft.initiated_at).toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {draft.metadata?.status === 'DRAFT' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<SendIcon />}
                          onClick={() => handleSubmitDraftChange(draft.id)}
                        >
                          Gửi yêu cầu
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Draft Change Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo thay đổi nháp</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Lý do thay đổi"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Ghi chú thêm"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={() => handleCreateDraftChange({})}
            disabled={!changeReason.trim()}
          >
            Tạo thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Lịch sử thay đổi</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {draftChanges.map((draft) => (
              <Card key={draft.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Thay đổi #{draft.id}
                    </Typography>
                    <Chip 
                      label={getStatusText(draft)} 
                      color={getStatusColor(draft)}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tạo bởi: User ID {draft.initiated_by} - {new Date(draft.initiated_at).toLocaleString('vi-VN')}
                  </Typography>
                  
                  {draft.metadata?.change_reason && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Lý do:</strong> {draft.metadata.change_reason}
                    </Typography>
                  )}
                  
                  {draft.metadata?.change_notes && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Ghi chú:</strong> {draft.metadata.change_notes}
                    </Typography>
                  )}

                  {draft.metadata?.old_data && draft.metadata?.new_data && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Chi tiết thay đổi:
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="error" gutterBottom>
                          <strong>Dữ liệu cũ:</strong>
                        </Typography>
                        <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                          {JSON.stringify(draft.metadata.old_data, null, 2)}
                        </pre>
                        
                        <Typography variant="body2" color="success" gutterBottom sx={{ mt: 2 }}>
                          <strong>Dữ liệu mới:</strong>
                        </Typography>
                        <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                          {JSON.stringify(draft.metadata.new_data, null, 2)}
                        </pre>
                      </Box>
                    </Box>
                  )}

                  {draft.approval_records.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Lịch sử phê duyệt:
                      </Typography>
                      <List dense>
                        {draft.approval_records.map((record) => (
                          <ListItem key={record.id}>
                            <ListItemText
                              primary={
                                <span style={{ color: '#1976d2' }}>
                                  {record.comments || `Hành động: ${record.action}`}
                                </span>
                              }
                              secondary={`${record.approver.full_name} - ${new Date(record.approved_at).toLocaleString('vi-VN')}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
