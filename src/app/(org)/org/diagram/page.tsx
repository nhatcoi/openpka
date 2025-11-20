'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import { buildTree } from '@/utils/tree-utils';
import { useRouter } from 'next/navigation';

interface OrgUnit {
  id: string;
  parent_id: string | null;
  type: string | null;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  status: string | null;
  effective_from: string | null;
  effective_to: string | null;
}

interface OrgTreeNode {
  id: string;
  name: string;
  code: string;
  type: string | null;
  status: string | null;
  children: OrgTreeNode[];
  parent_id: string | null;
}

export default function OrgDiagramPage() {
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch org units data
  const fetchOrgUnitsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(buildUrl(API_ROUTES.ORG.UNITS, {
        status: 'ACTIVE',
        page: 1,
        size: 1000
      }));
      const result = await response.json();
      
      if (result.success) {
        const data = result.data.items || [];
        setOrgUnits(data);
        
        // Build tree structure for diagram
        const normalizedData = data.map(unit => ({
          ...unit,
          id: parseInt(unit.id, 10),
          parent_id: unit.parent_id ? parseInt(unit.parent_id, 10) : null,
        }));
        
        const tree = buildTree(normalizedData);
        
        // Convert back to string IDs and add children structure
        const convertedTree = tree.map(unit => ({
          ...unit,
          id: unit.id.toString(),
          parent_id: unit.parent_id?.toString() || null,
          children: (unit as { children?: unknown[] }).children || [],
        }));
        
        setTreeData(convertedTree);
      } else {
        setError('Failed to fetch org units');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch org units');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  React.useEffect(() => {
    fetchOrgUnitsData();
    
  }, []);

  // Refresh function
  const refetch = () => {
    fetchOrgUnitsData();
  };

  // Handle node click - navigate to unit detail page
  const handleNodeClick = (nodeId: string) => {
    router.push(`/org/unit/${nodeId}`);
  };


  // Component to render a single node
  const OrgChartNode = ({ node, level = 0 }: { node: OrgTreeNode; level?: number }) => {
    const getTypeColor = (type: string | null) => {
      switch (type?.toLowerCase()) {
        case 'u': return '#1976d2'; // University
        case 's': return '#2e7d32'; // School
        case 'f': return '#ed6c02'; // Faculty
        case 'd': return '#9c27b0'; // Department
        case 'gov': return '#d32f2f'; // Government
        case 'adm': return '#795548'; // Administration
        default: return '#666666';
      }
    };

    const getStatusColor = (status: string | null) => {
      switch (status?.toLowerCase()) {
        case 'active': return '#4caf50';
        case 'inactive': return '#f44336';
        default: return '#666666';
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          mb: 2,
        }}
      >
        {/* Connection line to parent */}
        {level > 0 && (
          <Box
            sx={{
              width: '2px',
              height: '30px',
              backgroundColor: '#2e4c92',
              mb: 1,
            }}
          />
        )}

        {/* Node Card */}
        <Paper
          elevation={2}
          onClick={() => handleNodeClick(node.id)}
          sx={{
            p: 2,
            minWidth: 200,
            maxWidth: 250,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: '#2e4c92',
              boxShadow: '0 4px 12px rgba(46, 76, 146, 0.15)',
              transform: 'translateY(-2px)',
              backgroundColor: '#f8f9ff',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 2px 8px rgba(46, 76, 146, 0.2)',
              backgroundColor: '#f0f2ff',
            },
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: getTypeColor(node.type),
              margin: '0 auto 12px',
            }}
          >
            <BusinessIcon />
          </Avatar>

          {/* Node Name */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: '#2e4c92',
              marginBottom: 1,
              fontSize: '0.9rem',
              lineHeight: 1.2,
            }}
          >
            {node.name}
          </Typography>
          
          {/* Click hint */}
          <Typography
            component="div"
            variant="caption"
            sx={{
              color: '#666',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              opacity: 0.8,
              display: 'block',
              marginTop: 0.5,
            }}
          >
            Click để xem chi tiết
          </Typography>

          {/* Code */}
          <Chip
            label={node.code}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              marginBottom: 1,
              borderColor: '#2e4c92',
              color: '#2e4c92',
            }}
          />

          {/* Type and Status Chips */}
          <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" sx={{ mb: 1 }}>
            {node.type && (
              <Chip
                label={node.type}
                size="small"
                sx={{
                  backgroundColor: getTypeColor(node.type),
                  color: 'white',
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            )}
            
            {node.status && (
              <Chip
                label={node.status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(node.status),
                  color: 'white',
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            )}
          </Stack>
        </Paper>

        {/* Connection line to children */}
        {node.children && node.children.length > 0 && (
          <Box
            sx={{
              width: '2px',
              height: '30px',
              backgroundColor: '#2e4c92',
              mt: 1,
              mb: 1,
            }}
          />
        )}

        {/* Children */}
        {node.children && node.children.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 2,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: node.children.length > 1 ? '100%' : '0px',
                height: '2px',
                backgroundColor: '#2e4c92',
              },
            }}
          >
            {node.children.map((child) => (
              <Box
                key={child.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '2px',
                    height: '30px',
                    backgroundColor: '#2e4c92',
                  },
                }}
              >
                <OrgChartNode node={child} level={level + 1} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: '#2e4c92',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
            S
          </Typography>
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Sơ đồ tổ chức
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem sơ đồ tổ chức dạng timeline và biểu đồ
          </Typography>
        </Box>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TimelineIcon sx={{ color: '#2e4c92' }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Sơ đồ tổ chức
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
                disabled={loading}
                sx={{ backgroundColor: '#2e4c92' }}
              >
                Làm mới
              </Button>
            </Stack>
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}


          {error && (
            <Alert severity="error">
              <AlertTitle>Lỗi</AlertTitle>
              {String(error) || 'Có lỗi xảy ra khi tải dữ liệu'}
            </Alert>
          )}

          {!loading && !error && orgUnits.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TimelineIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có dữ liệu tổ chức
              </Typography>
              <Typography color="text.secondary">
                Hãy thêm đơn vị tổ chức để hiển thị sơ đồ
              </Typography>
            </Box>
          )}

          {!loading && !error && orgUnits.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#2e4c92' }}>
                Tổng số đơn vị: {orgUnits.length} | Cấp độ gốc: {treeData.length}
              </Typography>
              
              {/* Organizational Chart */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  overflow: 'auto',
                  minHeight: '500px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    minWidth: 'fit-content',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#2e4c92', 
                      fontWeight: 'bold',
                      marginBottom: 2 
                    }}
                  >
                    Sơ đồ tổ chức
                  </Typography>
                  
                  <Stack direction="column" spacing={2} alignItems="center">
                    {treeData.map((rootNode) => (
                      <OrgChartNode
                        key={rootNode.id}
                        node={rootNode}
                        level={0}
                      />
                    ))}
                  </Stack>
                </Box>
              </Paper>

              {/* Legend */}
              <Card sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#2e4c92' }}>
                  Chú giải
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: '50%' }} />
                    <Typography variant="body2">U - University</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#2e7d32', borderRadius: '50%' }} />
                    <Typography variant="body2">S - School</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#ed6c02', borderRadius: '50%' }} />
                    <Typography variant="body2">F - Faculty</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#9c27b0', borderRadius: '50%' }} />
                    <Typography variant="body2">D - Department</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#d32f2f', borderRadius: '50%' }} />
                    <Typography variant="body2">GOV - Government</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: '#795548', borderRadius: '50%' }} />
                    <Typography variant="body2">ADM - Administration</Typography>
                  </Stack>
                </Stack>
              </Card>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
