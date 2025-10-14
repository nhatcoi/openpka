'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ReviewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Business as BusinessIcon,
  DateRange as DateIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { AlertMessage, createSuccessAlert, createErrorAlert, closeAlert } from '@/utils/alert-utils';
import { PayloadKeyValueDisplay } from '@/components/misc/PayloadKeyValueDisplay';
import { AttachmentList } from '@/components/misc/AttachmentList';

interface OrgStructureRequest {
  id: string;
  requester_id: string | null;
  request_type: string;
  target_org_unit_id: string | null;
  payload: { [key: string]: unknown };
  status: string;
  workflow_step: number;
  created_at: string | null;
  updated_at: string | null;
  owner_org_id?: string | null;
  attachments?: Array<{ id: string; name: string; url: string; [key: string]: unknown }>;
}

interface OrgUnit {
  id: string;
  name: string;
  code: string;
  type: string | null;
  status: string | null;
  description: string | null;
  campus_id: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function CreateApprovePage() {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<OrgStructureRequest | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [alert, setAlert] = useState<AlertMessage>(closeAlert());
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [approveForm, setApproveForm] = useState({
    approved_by: '', // Phê duyệt bởi
    approval_comment: '', // Nhận xét phê duyệt
    approval_conditions: '', // Điều kiện phê duyệt
    approval_deadline: '', // Thời hạn thực hiện
    approval_priority: 'medium', // Độ ưu tiên
    approval_rating: '', // Đánh giá (1-5)
    approval_risks: '', // Rủi ro
    approval_benefits: '', // Lợi ích
    approval_suggestions: '', // Gợi ý
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<OrgStructureRequest[]>([]);
  const [units, setUnits] = useState<Record<string, OrgUnit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch approved requests from API
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/org/structure-requests?request_type=review&status=REVIEWED');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const requestsData = data.data.items || [];
        setRequests(requestsData);
        
        // Fetch unit details for each request
        const unitsData: Record<string, OrgUnit> = {};
        for (const request of requestsData) {
          if (request.target_org_unit_id) {
            try {
              const unitResponse = await fetch(API_ROUTES.ORG.UNITS_BY_ID(request.target_org_unit_id));
              if (unitResponse.ok) {
                const unitData = await unitResponse.json();
                if (unitData.success) {
                  unitsData[request.target_org_unit_id] = unitData.data;
                }
              }
            } catch (error) {
              console.error(`Failed to fetch unit ${request.target_org_unit_id}:`, error);
            }
          }
        }
        setUnits(unitsData);
      } else {
        throw new Error(data.error || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch requests'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenApproveDialog = (request: OrgStructureRequest) => {
    setSelectedRequest(request);
    setSelectedUnit(request.target_org_unit_id ? units[request.target_org_unit_id] : null);
    setCheckedItems({});
    setOpenApproveDialog(true);
  };

  const handleCloseApproveDialog = () => {
    setOpenApproveDialog(false);
    setSelectedRequest(null);
    setSelectedUnit(null);
    // Reset form
    setApproveForm({
      approved_by: '',
      approval_comment: '',
      approval_conditions: '',
      approval_deadline: '',
      approval_priority: 'medium',
      approval_rating: '',
      approval_risks: '',
      approval_benefits: '',
      approval_suggestions: '',
    });
  };

  const handleNavigateToUnit = (targetOrgUnitId: string) => {
    if (targetOrgUnitId) {
      router.push(`/org/unit/${targetOrgUnitId}`);
    }
  };

  const handleCheckboxChange = (checkName: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [checkName]: !prev[checkName],
    }));
  };

  const handleApprove = async () => {
    if (!selectedRequest || !approveForm.approval_comment.trim()) {
      setAlert(createErrorAlert('Please enter approval comments before approving'));
      return;
    }

    try {
      setIsApproving(true);
      
      // 1. Create new approval record
      const approvalPayload = {
        request_type: 'approval',
        requester_id: '1', // TODO: Get from session/context
        target_org_unit_id: selectedRequest.target_org_unit_id,
        owner_org_id: selectedRequest.owner_org_id, // Preserve from original request
        attachments: selectedRequest.attachments, // Preserve from original request
        payload: {
          ...approveForm,
          approval_result: 'approved',
          original_request_id: selectedRequest.id
        },
        status: 'APPROVED',
        workflow_step: 3
      };

      const approvalResponse = await fetch('/api/org/structure-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      });

      if (!approvalResponse.ok) {
        throw new Error('Failed to create approval record');
      }

      // 2. Update original request status
      const updateResponse = await fetch(`/api/org/structure-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED'
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update original request');
      }

      // 3. Update target org unit status
      if (selectedRequest.target_org_unit_id) {
        const unitUpdateResponse = await fetch(`/api/org/units/${selectedRequest.target_org_unit_id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved'
          })
        });

        if (!unitUpdateResponse.ok) {
          throw new Error('Failed to update unit status');
        }
      }

      setAlert(createSuccessAlert('Request approved successfully!'));
      handleCloseApproveDialog();
      fetchRequests();
      
    } catch (error) {
      console.error('Error approving request:', error);
      setAlert(createErrorAlert(`Error approving request: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !approveForm.approval_comment.trim()) {
      setAlert(createErrorAlert('Please enter approval comments before rejecting'));
      return;
    }

    try {
      setIsApproving(true);
      
      // 1. Create new approval record
      const approvalPayload = {
        request_type: 'approval',
        requester_id: '1', // TODO: Get from session/context
        target_org_unit_id: selectedRequest.target_org_unit_id,
        owner_org_id: selectedRequest.owner_org_id, // Preserve from original request
        attachments: selectedRequest.attachments, // Preserve from original request
        payload: {
          ...approveForm,
          approval_result: 'rejected',
          original_request_id: selectedRequest.id
        },
        status: 'REJECTED',
        workflow_step: 3
      };

      const approvalResponse = await fetch('/api/org/structure-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      });

      if (!approvalResponse.ok) {
        throw new Error('Failed to create approval record');
      }

      // 2. Update original request status
      const updateResponse = await fetch(`/api/org/structure-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED'
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update original request');
      }

      // 3. Update target org unit status
      if (selectedRequest.target_org_unit_id) {
        const unitUpdateResponse = await fetch(`/api/org/units/${selectedRequest.target_org_unit_id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'rejected'
          })
        });

        if (!unitUpdateResponse.ok) {
          throw new Error('Failed to update unit status');
        }
      }

      setAlert(createSuccessAlert('Request rejected successfully!'));
      handleCloseApproveDialog();
      fetchRequests();
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      setAlert(createErrorAlert(`Error rejecting request: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <ApproveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Phê duyệt (Approve)
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <AlertTitle>Quyết định thành lập</AlertTitle>
        Hội đồng trường/Hiệu trưởng sẽ quyết định chính thức thành lập đơn vị.
      </Alert>

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

      {/* Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Approvals: {isLoading ? <CircularProgress size={20} /> : requests.length}
          </Typography>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'black' }}>Request ID</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Name</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Code</TableCell>
              <TableCell sx={{ color: 'black' }}>Type</TableCell>
              <TableCell sx={{ color: 'black' }}>Status</TableCell>
              <TableCell sx={{ color: 'black' }}>Created</TableCell>
              <TableCell sx={{ color: 'black' }}>Actions</TableCell>
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No pending approvals found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const unit = request.target_org_unit_id ? units[request.target_org_unit_id] : null;
                return (
                  <TableRow key={request.id}>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>
                      {request.target_org_unit_id ? (
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          sx={{ 
                            color: 'primary.main', 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => handleNavigateToUnit(request.target_org_unit_id)}
                        >
                          {unit?.name || request.target_org_unit_id}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={unit?.code || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {unit?.type || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status || 'UNKNOWN'} 
                        color={request.status === 'REVIEWED' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ReviewIcon />}
                        onClick={() => handleOpenApproveDialog(request)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={handleCloseApproveDialog} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: 'success.main', 
          color: 'success.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6">Approval Decision</Typography>
            <Typography variant="body2">Request ID: {selectedRequest?.id} | Status: {selectedRequest?.status} | Step: {selectedRequest?.workflow_step}</Typography>
          </Box>
          <Chip 
            label={selectedRequest?.status || 'UNKNOWN'} 
            color={selectedRequest?.status === 'REVIEWED' ? 'success' : 'default'}
            size="small"
          />
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Request Information */}
                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Request Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Request ID" secondary={selectedRequest.id} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary="Requester ID" secondary={selectedRequest.requester_id || 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Target Unit ID" 
                          secondary={
                            selectedRequest.target_org_unit_id ? (
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  color: 'primary.main', 
                                  cursor: 'pointer',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => handleNavigateToUnit(selectedRequest.target_org_unit_id)}
                              >
                                {selectedRequest.target_org_unit_id}
                              </Typography>
                            ) : 'N/A'
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Owner Org ID" secondary={selectedRequest.owner_org_id || 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Status" secondary={selectedRequest.status} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Workflow Step" secondary={selectedRequest.workflow_step} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><DateIcon /></ListItemIcon>
                        <ListItemText primary="Created" secondary={selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'} />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>

                {/* Unit Information */}
                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Unit Information
                    </Typography>
                    {selectedUnit ? (
                      <List dense>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Name" secondary={selectedUnit.name} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Code" secondary={selectedUnit.code} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Type" secondary={selectedUnit.type || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Unit Status" secondary={selectedUnit.status || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Description" secondary={selectedUnit.description || 'N/A'} />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unit information not available
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Box>

              {/* Payload Details */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Review Details
                </Typography>
                <PayloadKeyValueDisplay payload={selectedRequest.payload || {}} />
              </Paper>

              {/* Attachments */}
              {selectedRequest.attachments && (
                <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Attachments
                  </Typography>
                  <AttachmentList attachments={selectedRequest.attachments} />
                </Paper>
              )}

              {/* Approval Form */}
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Chi tiết phê duyệt
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Cột 1 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Phê duyệt bởi"
                      value={approveForm.approved_by}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approved_by: e.target.value }))}
                      placeholder="Tên người phê duyệt"
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Đánh giá (1-5)"
                      type="number"
                      inputProps={{ min: 1, max: 5 }}
                      value={approveForm.approval_rating}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approval_rating: e.target.value }))}
                      placeholder="1 = Rất thấp, 5 = Rất cao"
                      variant="outlined"
                    />
                    
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Độ ưu tiên</InputLabel>
                      <Select
                        value={approveForm.approval_priority}
                        onChange={(e) => setApproveForm(prev => ({ ...prev, approval_priority: e.target.value }))}
                        label="Độ ưu tiên"
                      >
                        <MenuItem value="low">Thấp</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="high">Cao</MenuItem>
                        <MenuItem value="urgent">Khẩn cấp</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Thời hạn thực hiện"
                      type="date"
                      value={approveForm.approval_deadline}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approval_deadline: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Cột 2 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Điều kiện phê duyệt"
                      multiline
                      rows={2}
                      value={approveForm.approval_conditions}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approval_conditions: e.target.value }))}
                      placeholder="Các điều kiện cần thực hiện..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Rủi ro"
                      multiline
                      rows={2}
                      value={approveForm.approval_risks}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approval_risks: e.target.value }))}
                      placeholder="Các rủi ro có thể xảy ra..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Lợi ích"
                      multiline
                      rows={2}
                      value={approveForm.approval_benefits}
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approval_benefits: e.target.value }))}
                      placeholder="Các lợi ích dự kiến..."
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                {/* Nhận xét và Gợi ý - Full width */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Nhận xét phê duyệt"
                    multiline
                    rows={3}
                    value={approveForm.approval_comment}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, approval_comment: e.target.value }))}
                    placeholder="Nhận xét chi tiết về việc phê duyệt..."
                    variant="outlined"
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Gợi ý"
                    multiline
                    rows={2}
                    value={approveForm.approval_suggestions}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, approval_suggestions: e.target.value }))}
                    placeholder="Các gợi ý cải thiện..."
                    variant="outlined"
                  />
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: 'grey.50', gap: 2 }}>
          <Button 
            onClick={handleCloseApproveDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={isApproving ? <CircularProgress size={20} /> : <RejectIcon />}
            onClick={handleReject}
            disabled={!approveForm.approval_comment.trim() || isApproving}
            sx={{ minWidth: 120 }}
          >
            {isApproving ? 'Rejecting...' : 'Reject Request'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isApproving ? <CircularProgress size={20} /> : <ApproveIcon />}
            onClick={handleApprove}
            disabled={!approveForm.approval_comment.trim() || isApproving}
            sx={{ minWidth: 120 }}
          >
            {isApproving ? 'Approving...' : 'Approve Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}