'use client';

import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Box, 
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/lib/auth/permission-utils';

const PERMISSION_ICONS = {
  create: <AddIcon fontSize="small" />,
  read: <ViewIcon fontSize="small" />,
  update: <EditIcon fontSize="small" />,
  delete: <DeleteIcon fontSize="small" />,
  admin: <AdminIcon fontSize="small" />,
};

const PERMISSION_COLORS = {
  create: 'success',
  read: 'info',
  update: 'warning',
  delete: 'error',
  admin: 'secondary',
} as const;

export function UserPermissionInfo() {
  const { data: session } = useSession();
  const { 
    permissions, 
    canReadOrgUnits, 
    canCreateOrgUnits, 
    canUpdateOrgUnits, 
    canDeleteOrgUnits, 
    canAdminOrgUnits,
    isAdmin 
  } = usePermissions();

  if (!session?.user) {
    return null;
  }

  const orgPermissions = permissions.filter(p => p.startsWith('org_unit'));
  const otherPermissions = permissions.filter(p => !p.startsWith('org_unit'));

  const getPermissionIcon = (permission: string) => {
    const action = permission.split('.')[1];
    return PERMISSION_ICONS[action as keyof typeof PERMISSION_ICONS] || <SecurityIcon fontSize="small" />;
  };

  const getPermissionColor = (permission: string) => {
    const action = permission.split('.')[1];
    return PERMISSION_COLORS[action as keyof typeof PERMISSION_COLORS] || 'default';
  };

  const getActionLabel = (permission: string) => {
    const action = permission.split('.')[1];
    const labels: Record<string, string> = {
      create: 'Tạo',
      read: 'Xem',
      update: 'Sửa',
      delete: 'Xóa',
      admin: 'Quản trị',
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="h2">
            Quyền hạn của bạn
          </Typography>
        </Stack>

        {/* User Info */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PersonIcon color="action" />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {session.user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{session.user.username}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Quick Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quyền đơn vị tổ chức
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {isAdmin() && (
              <Chip 
                icon={<AdminIcon />} 
                label="Quản trị viên" 
                color="secondary" 
                size="small" 
              />
            )}
            {canReadOrgUnits() && (
              <Chip 
                icon={<ViewIcon />} 
                label="Xem đơn vị" 
                color="info" 
                size="small" 
              />
            )}
            {canCreateOrgUnits() && (
              <Chip 
                icon={<AddIcon />} 
                label="Tạo đơn vị" 
                color="success" 
                size="small" 
              />
            )}
            {canUpdateOrgUnits() && (
              <Chip 
                icon={<EditIcon />} 
                label="Sửa đơn vị" 
                color="warning" 
                size="small" 
              />
            )}
            {canDeleteOrgUnits() && (
              <Chip 
                icon={<DeleteIcon />} 
                label="Xóa đơn vị" 
                color="error" 
                size="small" 
              />
            )}
            {canAdminOrgUnits() && (
              <Chip 
                icon={<AdminIcon />} 
                label="Quản trị đơn vị" 
                color="secondary" 
                size="small" 
              />
            )}
          </Stack>
        </Box>

        {/* Org Permissions */}
        {orgPermissions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Quyền đơn vị tổ chức ({orgPermissions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {orgPermissions.map((permission) => (
                  <Chip
                    key={permission}
                    icon={getPermissionIcon(permission)}
                    label={getActionLabel(permission)}
                    color={getPermissionColor(permission) as never}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Other Permissions */}
        {otherPermissions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Quyền khác ({otherPermissions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {otherPermissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
