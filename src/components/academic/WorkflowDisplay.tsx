'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

interface WorkflowStep {
  step_order: number;
  step_name: string;
  approver_role: string;
  approver_org_level: string;
  timeout_days: number;
}

interface ApprovalRecord {
  id: bigint;
  action: string;
  comments?: string;
  approved_at?: Date;
  approver: {
    id: bigint;
    name: string;
    email: string;
  };
}

interface WorkflowInstance {
  id: bigint;
  status: string;
  current_step: number;
  initiated_at: Date;
  completed_at?: Date;
  workflow: {
    workflow_name: string;
    steps: WorkflowStep[];
  };
  approval_records: ApprovalRecord[];
}

interface WorkflowDisplayProps {
  workflowInstance: WorkflowInstance;
  onAction?: (action: string, comments?: string) => void;
  canApprove?: boolean;
}

export const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({
  workflowInstance,
  onAction,
  canApprove = false
}) => {
  const { workflow, status, current_step, approval_records } = workflowInstance;

  const getStepStatus = (stepOrder: number) => {
    if (stepOrder < current_step) return 'completed';
    if (stepOrder === current_step) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepOrder: number) => {
    const stepStatus = getStepStatus(stepOrder);
    switch (stepStatus) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'active':
        return <PendingIcon color="primary" />;
      default:
        return <ScheduleIcon color="disabled" />;
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

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            {workflow.workflow_name}
          </Typography>
          <Chip 
            label={getStatusLabel(status)} 
            color={getStatusColor(status) as any}
            size="small"
          />
        </Stack>

        <Stepper activeStep={current_step - 1} orientation="vertical">
          {workflow.steps.map((step, index) => {
            const stepStatus = getStepStatus(step.step_order);
            const stepApprovals = approval_records.filter(
              record => record.approver.role === step.approver_role
            );

            return (
              <Step key={step.step_order} completed={stepStatus === 'completed'}>
                <StepLabel
                  icon={getStepIcon(step.step_order)}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {step.approver_role} • {step.approver_org_level}
                    </Typography>
                  }
                >
                  {step.step_name}
                </StepLabel>
                <StepContent>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Thời gian: {step.timeout_days} ngày
                    </Typography>
                    
                    {stepApprovals.length > 0 && (
                      <List dense>
                        {stepApprovals.map((approval) => (
                          <ListItem key={approval.id.toString()} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                <PersonIcon fontSize="small" />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2">
                                    {approval.approver.name}
                                  </Typography>
                                  <Chip 
                                    label={approval.action}
                                    size="small"
                                    color={approval.action === 'APPROVE' ? 'success' : 'error'}
                                  />
                                </Stack>
                              }
                              secondary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {approval.comments && (
                                    <Typography variant="caption" color="text.secondary">
                                      <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                                      {approval.comments}
                                    </Typography>
                                  )}
                                  {approval.approved_at && (
                                    <Typography variant="caption" color="text.secondary">
                                      <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                      {new Date(approval.approved_at).toLocaleString('vi-VN')}
                                    </Typography>
                                  )}
                                </Stack>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {stepStatus === 'active' && canApprove && (
                      <Box mt={2}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => onAction?.('APPROVE')}
                          >
                            Phê duyệt
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => onAction?.('REJECT')}
                          >
                            Từ chối
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onAction?.('RETURN')}
                          >
                            Yêu cầu sửa
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

        {status === 'REJECTED' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Workflow đã bị từ chối. Vui lòng kiểm tra và chỉnh sửa trước khi gửi lại.
          </Alert>
        )}

        {status === 'COMPLETED' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Workflow đã hoàn thành thành công.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
