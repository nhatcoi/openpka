'use client';

import React from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';

export interface PoliciesData {
  attendance?: string;
  late_submission?: string;
  academic_integrity?: string;
  communication?: {
    lecturer_email?: string;
    office_hours?: string;
  };
}

interface PoliciesFormProps {
  policies: PoliciesData;
  onChange: (policies: PoliciesData) => void;
}

export default function PoliciesForm({ policies, onChange }: PoliciesFormProps) {
  const updateField = (field: keyof PoliciesData, value: any) => {
    onChange({ ...policies, [field]: value });
  };

  const updateCommunicationField = (field: 'lecturer_email' | 'office_hours', value: string) => {
    onChange({
      ...policies,
      communication: {
        ...policies.communication,
        [field]: value,
      },
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Quy định (Policies)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Quy định về điểm danh"
            multiline
            rows={3}
            value={policies.attendance || ''}
            onChange={(e) => updateField('attendance', e.target.value)}
            placeholder="VD: Vắng quá 20% số buổi sẽ không được thi cuối kỳ..."
            helperText="Quy định về việc điểm danh, vắng mặt, và hậu quả"
          />

          <TextField
            fullWidth
            label="Quy định về nộp bài trễ"
            multiline
            rows={3}
            value={policies.late_submission || ''}
            onChange={(e) => updateField('late_submission', e.target.value)}
            placeholder="VD: Trễ 1–3 ngày trừ 10%, sau 3 ngày không chấm..."
            helperText="Quy định về việc nộp bài tập, báo cáo trễ hạn"
          />

          <TextField
            fullWidth
            label="Quy định về tính trung thực học thuật"
            multiline
            rows={3}
            value={policies.academic_integrity || ''}
            onChange={(e) => updateField('academic_integrity', e.target.value)}
            placeholder="VD: Mọi hành vi gian lận sẽ bị xử lý theo quy chế..."
            helperText="Quy định về đạo văn, gian lận, và tính trung thực trong học tập"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Thông tin liên hệ
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Email giảng viên"
              type="email"
              value={policies.communication?.lecturer_email || ''}
              onChange={(e) => updateCommunicationField('lecturer_email', e.target.value)}
              placeholder="gv@example.edu.vn"
              helperText="Email để sinh viên liên hệ với giảng viên"
            />

            <TextField
              fullWidth
              label="Giờ làm việc (Office Hours)"
              value={policies.communication?.office_hours || ''}
              onChange={(e) => updateCommunicationField('office_hours', e.target.value)}
              placeholder="VD: Thứ 3, 9:00–11:00"
              helperText="Thời gian giảng viên có thể tiếp sinh viên"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

