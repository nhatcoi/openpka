'use client';

import { IconButton, Tooltip } from '@mui/material';
import { LightMode as LightModeIcon} from '@mui/icons-material';

export function ThemeToggle() {
  
  return (
    <Tooltip title="Light mode">
      <IconButton color="inherit">
        <LightModeIcon />
      </IconButton>
    </Tooltip>
  );
}
