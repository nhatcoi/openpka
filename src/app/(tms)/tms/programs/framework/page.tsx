'use client';

import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Container, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

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
        const response = await fetch('/api/tms/programs?limit=200');
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