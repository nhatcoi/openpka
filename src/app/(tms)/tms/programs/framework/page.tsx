'use client';

import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Container, Stack, TextField, Typography, Breadcrumbs, Link } from '@mui/material';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

export default function TrainingProgramFrameworkPage(): JSX.Element {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ROUTES.TMS.PROGRAMS}?limit=200`);
        const result = await response.json();
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        const mappedPrograms: ProgramOption[] = items.map((program: any) => ({
          id: program.id,
          code: program.code || '—',
          name: program.name_vi || 'Chưa đặt tên',
          label: `${program.code || '—'} — ${program.name_vi || 'Chưa đặt tên'}`,
        }));
        if (isMounted) setPrograms(mappedPrograms);
      } catch (err) {
        // swallow errors for simple picker
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPrograms();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/tms"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            TMS
          </Link>
          <Link
            color="inherit"
            href="/tms/programs"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Chương trình đào tạo
          </Link>
          <Typography color="text.primary">Khung chương trình</Typography>
        </Breadcrumbs>

        <Stack spacing={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Khung chương trình đào tạo
          </Typography>
          <Autocomplete
            options={programs}
            loading={loading}
            onChange={(_event, option) => {
              if (option) router.push(`/tms/programs/${option.id}/structure`);
            }}
            sx={{ minWidth: { xs: 240, sm: 320 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn chương trình đào tạo"
                placeholder="Tìm kiếm chương trình..."
              />
            )}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Stack>
      </Container>
    </Box>
  );
}