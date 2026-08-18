'use client';

import React from 'react';
import {
  TextField,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

interface JsonFieldEditorProps {
  title: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}

export default function JsonFieldEditor({ title, value, onChange, placeholder }: JsonFieldEditorProps) {
  const handleTextChange = (text: string) => {
    try {
      const parsed = text.trim() ? JSON.parse(text) : null;
      onChange(parsed);
    } catch (e) {
      // Invalid JSON, keep as is
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={12}
          label="JSON Data"
          value={value ? JSON.stringify(value, null, 2) : ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
        />
      </CardContent>
    </Card>
  );
}

