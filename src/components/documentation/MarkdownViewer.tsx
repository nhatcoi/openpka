'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
// Use a more compatible highlight.js theme
// You can change this to other themes like 'github', 'atom-one-dark', etc.
import 'highlight.js/styles/github.css';

interface MarkdownViewerProps {
  content: string;
  loading?: boolean;
  error?: string;
}

export default function MarkdownViewer({ content, loading, error }: MarkdownViewerProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper
      sx={{
        p: 4,
        maxWidth: '100%',
        '& .markdown-body': {
          fontFamily: 'var(--font-inter), sans-serif',
          lineHeight: 1.6,
          color: 'text.primary',
          '& h1': {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginTop: '2rem',
            marginBottom: '1rem',
            borderBottom: '2px solid',
            borderColor: 'divider',
            paddingBottom: '0.5rem',
          },
          '& h2': {
            fontSize: '2rem',
            fontWeight: 'bold',
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            borderBottom: '1px solid',
            borderColor: 'divider',
            paddingBottom: '0.5rem',
          },
          '& h3': {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginTop: '1.25rem',
            marginBottom: '0.5rem',
          },
          '& h4': {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginTop: '1rem',
            marginBottom: '0.5rem',
          },
          '& p': {
            marginBottom: '1rem',
          },
          '& ul, & ol': {
            marginBottom: '1rem',
            paddingLeft: '2rem',
          },
          '& li': {
            marginBottom: '0.5rem',
          },
          '& code': {
            backgroundColor: 'action.hover',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.9em',
            fontFamily: 'var(--font-fira-code), monospace',
          },
          '& pre': {
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            padding: '1rem',
            overflowX: 'auto',
            marginBottom: '1rem',
            '& code': {
              backgroundColor: 'transparent',
              padding: 0,
            },
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            paddingLeft: '1rem',
            marginLeft: 0,
            marginBottom: '1rem',
            fontStyle: 'italic',
            color: 'text.secondary',
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1rem',
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              padding: '0.75rem',
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: 'action.hover',
              fontWeight: 'bold',
            },
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            margin: '1rem 0',
          },
        },
      }}
    >
      <Box className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
}

