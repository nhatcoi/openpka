'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { ProgramDetail, ProgramBlockItem, ProgramCourseItem } from '@/app/(tms)/tms/programs/program-utils';

interface ProgramStructureViewProps {
  program: ProgramDetail;
}

const ProgramStructureView: React.FC<ProgramStructureViewProps> = ({ program }) => {
  const getBlockTypeColor = (blockType: string) => {
    switch (blockType) {
      case 'GENERAL': return 'primary';
      case 'FOUNDATION': return 'secondary';
      case 'SPECIALIZED': return 'success';
      case 'COMPLEMENTARY': return 'warning';
      case 'END': return 'error';
      default: return 'default';
    }
  };

  const getBlockTypeLabel = (blockType: string) => {
    switch (blockType) {
      case 'GENERAL': return 'Giáo dục đại cương';
      case 'FOUNDATION': return 'Cơ sở ngành';
      case 'SPECIALIZED': return 'Chuyên ngành';
      case 'COMPLEMENTARY': return 'Bổ trợ';
      case 'END': return 'Tốt nghiệp';
      default: return blockType;
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType) {
      case 'core': return 'primary';
      case 'elective': return 'secondary';
      default: return 'default';
    }
  };

  const getGroupTypeLabel = (groupType: string) => {
    switch (groupType) {
      case 'core': return 'Bắt buộc';
      case 'elective': return 'Tự chọn';
      default: return groupType;
    }
  };

  const renderCourse = (course: ProgramCourseItem) => (
    <TableRow key={course.id}>
      <TableCell>{course.code}</TableCell>
      <TableCell>{course.name}</TableCell>
      <TableCell align="center">{course.credits}</TableCell>
      <TableCell align="center">
        <Chip
          label={course.required ? 'Bắt buộc' : 'Tự chọn'}
          color={course.required ? 'primary' : 'secondary'}
          size="small"
        />
      </TableCell>
    </TableRow>
  );

  const renderBlock = (block: ProgramBlockItem) => (
    <Accordion key={block.id} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <SchoolIcon color="primary" />
          <Box flexGrow={1}>
            <Typography variant="h6" component="div">
              {block.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {block.code} • {block.courses.length} môn học
            </Typography>
          </Box>
          <Chip
            label={getBlockTypeLabel(block.blockType)}
            color={getBlockTypeColor(block.blockType) as any}
            variant="outlined"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {/* Groups */}
          {block.groups.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Nhóm học phần:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {block.groups.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.title}
                    color={getGroupTypeColor(group.groupType) as any}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Courses */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Danh sách môn học:
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mã môn</TableCell>
                    <TableCell>Tên môn học</TableCell>
                    <TableCell align="center">TC</TableCell>
                    <TableCell align="center">Loại</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {block.courses.map(renderCourse)}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <BookIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h4" component="h1">
                {program.nameVi}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {program.code} • {program.totalCredits} tín chỉ
              </Typography>
            </Box>
          </Box>

          <Stack spacing={2}>
            {program.blocks.map(renderBlock)}
          </Stack>

          {program.standaloneCourses.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Môn học độc lập
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã môn</TableCell>
                      <TableCell>Tên môn học</TableCell>
                      <TableCell align="center">TC</TableCell>
                      <TableCell align="center">Loại</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {program.standaloneCourses.map(renderCourse)}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgramStructureView;
