'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Refresh as RefreshIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { OrgTreeNode } from '@/components/tree/OrgTreeNode';
import { buildTree } from '@/utils/tree-utils';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';

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
  campus_id?: string | null;
}

export default function OrgTreePage() {
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setOrgUnits(result.data.items || []);
      } else {
        setError('Failed to fetch org units');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch org units');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrgUnitsData();
  }, []);

  const refetch = () => {
    fetchOrgUnitsData();
  };



  // Build cấu trúc cây từ mảng flat
  const normalizedOrgUnits = orgUnits.map(unit => ({
    ...unit,
    id: parseInt(unit.id, 10),
    parent_id: unit.parent_id ? parseInt(unit.parent_id, 10) : null,
  }));

  const treeData = buildTree(normalizedOrgUnits);

  const convertedTreeData = treeData.map(unit => ({
    ...unit,
    id: unit.id.toString(),
    parent_id: unit.parent_id?.toString() || null,
  }));

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
            T
          </Typography>
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Cây tổ chức
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem cấu trúc tổ chức theo dạng cây phân cấp
          </Typography>
        </Box>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ApartmentIcon sx={{ color: '#2e4c92' }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Cây tổ chức
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

          {!loading && !error && convertedTreeData.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ApartmentIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có đơn vị tổ chức
              </Typography>
              <Typography color="text.secondary">
                Hãy thêm đơn vị tổ chức đầu tiên để bắt đầu
              </Typography>
            </Box>
          )}

          {!loading && !error && convertedTreeData.length > 0 && (
            <Box>
              {/* Tree View - hiển thị cây hiện tại */}
              {convertedTreeData.map((unit) => (
                <OrgTreeNode key={unit.id} unit={unit} level={0} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}