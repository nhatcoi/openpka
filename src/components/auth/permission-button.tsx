'use client';

import { Button, ButtonProps, Tooltip } from '@mui/material';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface PermissionButtonProps extends Omit<ButtonProps, 'onClick'> {
  requiredPermissions: string[];
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  noPermissionTooltip?: string;
}

export function PermissionButton({
  requiredPermissions,
  onClick,
  children,
  noPermissionTooltip = 'Bạn không có quyền thực hiện thao tác này',
  disabled,
  ...buttonProps
}: PermissionButtonProps) {
  const { data: session } = useSession();

  const hasPermission = () => {
    if (!session?.user?.permissions) return false;
    const userPermissions = session.user.permissions;
    return requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );
  };

  const userHasPermission = hasPermission();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!userHasPermission) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  };

  const button = (
    <Button
      {...buttonProps}
      disabled={disabled || !userHasPermission}
      onClick={handleClick}
      sx={{
        ...buttonProps.sx,
        ...(userHasPermission ? {} : {
          opacity: 0.6,
          cursor: 'not-allowed',
        }),
      }}
    >
      {children}
    </Button>
  );

  if (!userHasPermission) {
    return (
      <Tooltip title={noPermissionTooltip} arrow>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
