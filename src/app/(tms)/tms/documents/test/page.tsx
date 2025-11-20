'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import UploadButton from '@/components/documents/UploadButton';
import DocumentList from '@/components/documents/DocumentList';

export default function DocumentsTestPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test Documents System
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Trang này để test hệ thống quản lý tài liệu với Cloudinary integration.
        Bạn có thể upload file và xem danh sách tài liệu đã upload.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Tài liệu
            </Typography>
            <UploadButton 
              entityType="org_unit"
              entityId="1"
              folder="test-documents"
              onUploadSuccess={() => {
                console.log('Upload successful!');
                // Có thể thêm notification ở đây
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Danh sách Tài liệu
            </Typography>
            <DocumentList 
              entityType="org_unit"
              entityId="1"
              showUploadButton={false}
            />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Endpoints
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Upload:</strong> POST /api/upload<br/>
          <strong>List Documents:</strong> GET /api/documents<br/>
          <strong>Get Document:</strong> GET /api/documents/[id]<br/>
          <strong>Update Document:</strong> PUT /api/documents/[id]<br/>
          <strong>Delete Document:</strong> DELETE /api/documents/[id]<br/>
          <strong>Entity Documents:</strong> GET /api/documents/entity/[entityType]/[entityId]
        </Typography>
      </Paper>
    </Box>
  );
}
