import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    primary: {
      main: '#2e4c92',
      light: '#3d5ba3',
      dark: '#1f3a7a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff8c00',
      light: '#ffa726',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: {
      fontSize: '2.375rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2e4c92',
          color: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2e4c92',
          color: '#ffffff',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#3d5ba3',
          },
          '&.Mui-selected': {
            backgroundColor: '#3d5ba3',
            '&:hover': {
              backgroundColor: '#3d5ba3',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          minWidth: '40px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#ffffff',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
  },
});
