import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';

interface Attachment {
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
}

interface AttachmentListProps {
  attachments: string; // JSON string
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments }) => {
  const parseAttachments = (): Attachment[] => {
    try {
      if (!attachments || attachments === '[]') return [];
      const parsed = JSON.parse(attachments);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing attachments:', error);
      return [];
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <PdfIcon color="error" />;
    if (mimeType.startsWith('image/')) return <ImageIcon color="primary" />;
    if (mimeType.startsWith('video/')) return <VideoIcon color="secondary" />;
    if (mimeType.startsWith('audio/')) return <AudioIcon color="info" />;
    if (mimeType.includes('text/') || mimeType.includes('document')) return <DocumentIcon color="warning" />;
    return <AttachFileIcon />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const attachmentList = parseAttachments();

  if (attachmentList.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No attachments found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {attachmentList.map((attachment, index) => (
        <ListItem key={index} sx={{ px: 0 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              width: '100%',
              '&:hover': {
                backgroundColor: 'grey.50',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                {getFileIcon(attachment.mime_type)}
              </ListItemIcon>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {attachment.file_name}
                </Typography>
                {attachment.description && (
                  <Typography variant="caption" color="text.secondary">
                    {attachment.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip 
                    label={formatFileSize(attachment.file_size)} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={attachment.mime_type} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </ListItem>
      ))}
    </List>
  );
};
