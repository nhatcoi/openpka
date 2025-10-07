'use client';

import { Box, Container, Typography } from '@mui/material';

export default function CurriculumAuditTrailPage(): JSX.Element {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1">
          Nhật ký kiểm tra chương trình
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tính năng đang được phát triển. Vui lòng quay lại sau để xem lịch sử kiểm tra chương trình đào tạo.
        </Typography>
      </Box>
    </Container>
  );
}
