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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AlertMessage, createSuccessAlert, createErrorAlert, closeAlert } from '@/utils/alert-utils';
import { PayloadKeyValueDisplay } from '@/components/PayloadKeyValueDisplay';
import { AttachmentList } from '@/components/AttachmentList';

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

export default function CreateReviewPage() {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<OrgStructureRequest | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [units, setUnits] = useState<Record<string, OrgUnit>>({});
  const [alert, setAlert] = useState<AlertMessage>(closeAlert());
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    review_by: '', // Thẩm định bởi
    review_comment: '', // Nhận xét
    review_suggest: '', // Gợi ý
    review_rating: '', // Đánh giá (1-5)
    review_priority: 'medium', // Độ ưu tiên
    review_deadline: '', // Thời hạn thực hiện
    review_conditions: '', // Điều kiện bổ sung
    review_risks: '', // Rủi ro
    review_benefits: '', // Lợi ích
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<OrgStructureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Fetch requests data
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_ROUTES.ORG.STRUCTURE_REQUESTS}?request_type=created&status=SUBMITTED`);
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setAlert(createErrorAlert('Failed to fetch requests'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenReviewDialog = (request: OrgStructureRequest) => {
    setSelectedRequest(request);
    setSelectedUnit(request.target_org_unit_id ? units[request.target_org_unit_id] : null);
    setCheckedItems({});
    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setSelectedRequest(null);
    setSelectedUnit(null);
    // Reset form
    setReviewForm({
      review_by: '',
      review_comment: '',
      review_suggest: '',
      review_rating: '',
      review_priority: 'medium',
      review_deadline: '',
      review_conditions: '',
      review_risks: '',
      review_benefits: '',
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
    if (!selectedRequest || !reviewForm.review_comment.trim()) {
      setAlert(createErrorAlert('Please enter review comments before approving'));
      return;
    }

    try {
      setIsReviewing(true);
      
      // 1. Create new review record
      const reviewPayload = {
        request_type: 'review',
        requester_id: '1', // TODO: Get from session/context
        target_org_unit_id: selectedRequest.target_org_unit_id,
        owner_org_id: selectedRequest.owner_org_id, // Preserve from original request
        attachments: selectedRequest.attachments, // Preserve from original request
        payload: {
          ...reviewForm,
          review_result: 'approved',
          original_request_id: selectedRequest.id
        },
        status: 'REVIEWED',
        workflow_step: 2
      };

      const reviewResponse = await fetch(API_ROUTES.ORG.STRUCTURE_REQUESTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload)
      });

      if (!reviewResponse.ok) {
        throw new Error('Failed to create review record');
      }

      // 2. Update original request status
      const updateResponse = await fetch(API_ROUTES.ORG.STRUCTURE_REQUESTS_BY_ID(selectedRequest.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVIEWED' })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update original request');
      }

      // 3. Update org unit status
      const unitStatusResponse = await fetch(API_ROUTES.ORG.UNITS_STATUS(selectedRequest.target_org_unit_id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'review' })
      });

      if (!unitStatusResponse.ok) {
        throw new Error('Failed to update unit status');
      }

      setAlert(createSuccessAlert('Request approved successfully!'));
      handleCloseReviewDialog();
      fetchRequests();
      
    } catch (error) {
      console.error('Error approving request:', error);
      setAlert(createErrorAlert(`Failed to approve request: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewForm.review_comment.trim()) {
      setAlert(createErrorAlert('Please enter review comments before rejecting'));
      return;
    }

    try {
      setIsReviewing(true);
      
      // 1. Create new review record
      const reviewPayload = {
        request_type: 'review',
        requester_id: '1', // TODO: Get from session/context
        target_org_unit_id: selectedRequest.target_org_unit_id,
        owner_org_id: selectedRequest.owner_org_id, // Preserve from original request
        attachments: selectedRequest.attachments, // Preserve from original request
        payload: {
          ...reviewForm,
          review_result: 'rejected',
          original_request_id: selectedRequest.id
        },
        status: 'REJECTED',
        workflow_step: 2
      };

      const reviewResponse = await fetch(API_ROUTES.ORG.STRUCTURE_REQUESTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload)
      });

      if (!reviewResponse.ok) {
        throw new Error('Failed to create review record');
      }

      // 2. Update original request status
      const updateResponse = await fetch(API_ROUTES.ORG.STRUCTURE_REQUESTS_BY_ID(selectedRequest.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update original request');
      }

      // 3. Update org unit status
      const unitStatusResponse = await fetch(API_ROUTES.ORG.UNITS_STATUS(selectedRequest.target_org_unit_id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!unitStatusResponse.ok) {
        throw new Error('Failed to update unit status');
      }

      setAlert(createSuccessAlert('Request rejected and returned for revision!'));
      handleCloseReviewDialog();
      fetchRequests();
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      setAlert(createErrorAlert(`Failed to reject request: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setIsReviewing(false);
    }
  };


  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        <ReviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Xem xét/Thẩm định (Review)
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>Quy trình thẩm định</AlertTitle>
        Cấp quản lý trực tiếp sẽ kiểm tra tính hợp lệ và nguồn lực trước khi phê duyệt.
      </Alert>

      {/* Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Requests: {isLoading ? <CircularProgress size={20} /> : requests.length}
          </Typography>
        </CardContent>
      </Card>

      {/* Alert Messages */}
      {alert.open && (
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert(closeAlert())}
          sx={{ mb: 3 }}
        >
          {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
          {alert.message}
        </Alert>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Review Requests
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchRequests}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'black' }}>Request ID</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Name</TableCell>
              <TableCell sx={{ color: 'black' }}>Unit Code</TableCell>
              <TableCell sx={{ color: 'black' }}>Type</TableCell>
              <TableCell sx={{ color: 'black' }}>Workflow Step</TableCell>
              <TableCell sx={{ color: 'black' }}>Status</TableCell>
              <TableCell sx={{ color: 'black' }}>Created</TableCell>
              <TableCell sx={{ color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No pending requests found
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
                      <Chip label={request.workflow_step?.toString() || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        size="small" 
                        color={request.status === 'SUBMITTED' ? 'warning' : 'default'}
                      />
                    </TableCell>
                  <TableCell>
                    {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReviewIcon />}
                      onClick={() => handleOpenReviewDialog(request)}
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

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'primary.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6">
              Review Request #{selectedRequest?.id}
            </Typography>
            <Typography variant="caption">
              Status: {selectedRequest?.status} | Step: {selectedRequest?.workflow_step}
            </Typography>
          </Box>
          <Chip 
            label={selectedRequest?.status || 'UNKNOWN'} 
            color={selectedRequest?.status === 'SUBMITTED' ? 'warning' : 'default'}
            size="small"
          />
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Basic Information */}
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
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Campus ID" secondary={selectedUnit.campus_id || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BusinessIcon /></ListItemIcon>
                          <ListItemText primary="Parent ID" secondary={selectedUnit.parent_id || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><DateIcon /></ListItemIcon>
                          <ListItemText primary="Created At" secondary={new Date(selectedUnit.created_at).toLocaleString()} />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unit information not available
                      </Typography>
                    )}
                  </Paper>
                </Box>

                {/* Additional Information */}
                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Information
                    </Typography>
                    <List dense>
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
                        <ListItemText primary="Request Type" secondary={selectedRequest.request_type || 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BusinessIcon /></ListItemIcon>
                        <ListItemText primary="Workflow Step" secondary={selectedRequest.workflow_step?.toString() || 'N/A'} />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>

                {/* Payload Information */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Request Details
                    </Typography>
                    <PayloadKeyValueDisplay payload={selectedRequest.payload} />
                  </Paper>
                </Box>

                {/* Attachments */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Attachments
                    </Typography>
                    <AttachmentList attachments={selectedRequest.attachments} />
                  </Paper>
                </Box>
              </Box>

              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Chi tiết thẩm định
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Cột 1 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Thẩm định bởi"
                      value={reviewForm.review_by}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_by: e.target.value }))}
                      placeholder="Tên người thẩm định"
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Đánh giá (1-5)"
                      type="number"
                      inputProps={{ min: 1, max: 5 }}
                      value={reviewForm.review_rating}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_rating: e.target.value }))}
                      placeholder="1 = Rất thấp, 5 = Rất cao"
                      variant="outlined"
                    />
                    
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Độ ưu tiên</InputLabel>
                      <Select
                        value={reviewForm.review_priority}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, review_priority: e.target.value }))}
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
                      value={reviewForm.review_deadline}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_deadline: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Cột 2 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Điều kiện bổ sung"
                      multiline
                      rows={2}
                      value={reviewForm.review_conditions}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_conditions: e.target.value }))}
                      placeholder="Các điều kiện cần thực hiện thêm..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Rủi ro"
                      multiline
                      rows={2}
                      value={reviewForm.review_risks}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_risks: e.target.value }))}
                      placeholder="Các rủi ro có thể xảy ra..."
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Lợi ích"
                      multiline
                      rows={2}
                      value={reviewForm.review_benefits}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_benefits: e.target.value }))}
                      placeholder="Các lợi ích dự kiến..."
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                {/* Nhận xét và Gợi ý - Full width */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Nhận xét"
                    multiline
                    rows={3}
                    value={reviewForm.review_comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, review_comment: e.target.value }))}
                    placeholder="Nhận xét chi tiết về yêu cầu..."
                    variant="outlined"
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Gợi ý"
                    multiline
                    rows={2}
                    value={reviewForm.review_suggest}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, review_suggest: e.target.value }))}
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
            onClick={handleCloseReviewDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={isReviewing ? <CircularProgress size={20} /> : <RejectIcon />}
            onClick={handleReject}
            disabled={!reviewForm.review_comment.trim() || isReviewing}
            sx={{ minWidth: 120 }}
          >
            {isReviewing ? 'Đang từ chối...' : 'Từ chối'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isReviewing ? <CircularProgress size={20} /> : <ApproveIcon />}
            onClick={handleApprove}
            disabled={!reviewForm.review_comment.trim() || isReviewing}
            sx={{ minWidth: 120 }}
          >
            {isReviewing ? 'Đang thẩm định...' : 'Thẩm định'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
