'use client';

import React from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

interface BasicInfo {
  description: string;
  classification: string;
  prerequisites: string;
  course_type: string;
  total_weeks: string;
  total_hours: string;
  credit_distribution: string;
  objectives: string;
}

interface BasicInfoFormProps {
  basicInfo: BasicInfo;
  onChange: (basicInfo: BasicInfo) => void;
}

export default function BasicInfoForm({ basicInfo, onChange }: BasicInfoFormProps) {
  const updateField = (field: keyof BasicInfo, value: string) => {
    onChange({ ...basicInfo, [field]: value });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Thông tin cơ bản
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Mô tả môn học"
            multiline
            rows={4}
            value={basicInfo.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Mô tả tổng quan về môn học, nội dung chính, mục tiêu..."
          />
          
          <TextField
            fullWidth
            label="Mục tiêu học tập"
            multiline
            rows={3}
            value={basicInfo.objectives}
            onChange={(e) => updateField('objectives', e.target.value)}
            placeholder="Mục tiêu học tập tổng thể của môn học..."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Phân loại môn học"
              value={basicInfo.classification}
              onChange={(e) => updateField('classification', e.target.value)}
              placeholder="VD: Bắt buộc, Tự chọn, Cơ sở, Chuyên ngành..."
            />
            
            <TextField
              fullWidth
              label="Loại môn học"
              value={basicInfo.course_type}
              onChange={(e) => updateField('course_type', e.target.value)}
              placeholder="VD: Lý thuyết, Thực hành, Hỗn hợp..."
            />
          </Box>

          <TextField
            fullWidth
            label="Điều kiện tiên quyết"
            multiline
            rows={2}
            value={basicInfo.prerequisites}
            onChange={(e) => updateField('prerequisites', e.target.value)}
            placeholder="Các môn học tiên quyết, kiến thức cần có trước khi học môn này..."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Tổng số tuần"
              type="number"
              value={basicInfo.total_weeks}
              onChange={(e) => updateField('total_weeks', e.target.value)}
              placeholder="VD: 15"
              inputProps={{ min: 1, max: 20 }}
            />
            
            <TextField
              fullWidth
              label="Tổng số giờ"
              type="number"
              value={basicInfo.total_hours}
              onChange={(e) => updateField('total_hours', e.target.value)}
              placeholder="VD: 45"
              inputProps={{ min: 0, step: 0.5 }}
            />
            
            <TextField
              fullWidth
              label="Phân bổ tín chỉ"
              value={basicInfo.credit_distribution}
              onChange={(e) => updateField('credit_distribution', e.target.value)}
              placeholder="VD: 3 LT + 1 TH"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

