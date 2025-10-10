'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
  getProgramBlockGroupTypeLabel,
  ProgramBlockGroupType,
} from '@/constants/programs';

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

interface ProgramDetailApiWrapper {
  success: boolean;
  data?: {
    id: string;
    code: string;
    name_vi: string;
    name_en?: string | null;
    description?: string | null;
    version?: string | null;
    total_credits?: number | null;
    status?: string | null;
    plo?: Record<string, string>;
    effective_from?: string | null;
    effective_to?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    org_unit_id?: string | null;
    major_id?: string | null;
    OrgUnit?: {
      id: string;
      code: string;
      name: string;
    } | null;
    blockAssignments?: Array<{
      id: string;
      display_order: number;
      is_required: boolean;
      is_active: boolean;
      custom_title?: string | null;
      custom_description?: string | null;
      assigned_at?: string | null;
      template: {
        id: string;
        code: string;
        title: string;
        title_en?: string | null;
        block_type: string;
        description?: string | null;
        min_credits?: number | null;
        max_credits?: number | null;
        category?: string | null;
        groups?: Array<{
          id: string;
          code: string;
          title: string;
          group_type: string;
          display_order: number;
          description?: string | null;
          rules?: Array<{
            id: string;
            min_credits: number;
            max_credits?: number | null;
            min_courses: number;
            max_courses?: number | null;
            rule_type: string;
          }>;
        }>;
        courses?: Array<{
          id: string;
          course_id: string;
          group_id: string;
          is_required: boolean;
          display_order: number;
          credits?: number | null;
          course: {
            id: string;
            code: string;
            name_vi: string;
            credits: number;
          };
        }>;
      };
    }>;
    _count?: {
      StudentAcademicProgress?: number;
      blockAssignments?: number;
    };
    stats?: {
      student_count?: number;
      block_count?: number;
      course_count?: number;
    };
    priority?: string | null;
    unified_workflow?: any;
  };
  error?: string;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

function ProgramSummary({ program }: { program: ProgramDetailApiWrapper['data'] }): JSX.Element {
  if (!program) return <></>;

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h5" component="span">
              {program.name_vi}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={getProgramStatusLabel(program.status as any)}
                color={getProgramStatusColor(program.status as any)}
                size="small"
              />
            </Stack>
          </Stack>
        }
        subheader={program.name_en || undefined}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Tải xuống khung chương trình (sắp ra mắt)">
              <span>
                <IconButton disabled>
                  <FileDownloadIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button component={Link} href={`/tms/programs/${program.id}/edit`} variant="outlined" size="small">
              Chỉnh sửa chương trình
            </Button>
          </Stack>
        }
      />
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Mã chương trình</Typography>
                <Typography fontWeight="medium">{program.code || '—'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Đơn vị quản lý</Typography>
                <Typography fontWeight="medium">
                  {program.OrgUnit ? `${program.OrgUnit.name} (${program.OrgUnit.code})` : 'Chưa cập nhật'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Tổng tín chỉ</Typography>
                <Typography fontWeight="medium">{program.total_credits ?? '—'}</Typography>
              </Stack>
            </Stack>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Hiệu lực từ</Typography>
                <Typography fontWeight="medium">{formatDate(program.effective_from)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Hiệu lực đến</Typography>
                <Typography fontWeight="medium">{formatDate(program.effective_to)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Số khối học phần</Typography>
                <Typography fontWeight="medium">{program.stats?.block_count ?? 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Số học phần</Typography>
                <Typography fontWeight="medium">{program.stats?.course_count ?? 0}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
        {program.description && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Mô tả
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {program.description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function RulesList({ rules }: { rules: Array<{
  id: string;
  min_credits: number;
  max_credits?: number | null;
  min_courses: number;
  max_courses?: number | null;
  rule_type: string;
}> }): JSX.Element {
  if (!rules || rules.length === 0) return <></>;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Quy tắc:
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {rules.map((rule) => (
          <Typography key={rule.id} variant="caption" color="text.secondary">
            • Tối thiểu {rule.min_credits} tín chỉ
            {rule.max_credits && `, tối đa ${rule.max_credits} tín chỉ`}
            • Tối thiểu {rule.min_courses} học phần
            {rule.max_courses && `, tối đa ${rule.max_courses} học phần`}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

export default function TrainingProgramFrameworkPage(): JSX.Element {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [programDetail, setProgramDetail] = useState<ProgramDetailApiWrapper['data'] | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const fetchPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const response = await fetch('/api/tms/programs?limit=200');
      const result = await response.json();

      if (response.ok && result.data?.items) {
        const mappedPrograms = result.data.items.map((program: any) => ({
          id: program.id,
          code: program.code || '—',
          name: program.name_vi || 'Chưa đặt tên',
          label: `${program.code || '—'} — ${program.name_vi || 'Chưa đặt tên'}`,
        }));
        setPrograms(mappedPrograms);
      }
    } catch (err) {
      console.error('Failed to fetch programs', err);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  const fetchProgramDetail = useCallback(async (programId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const response = await fetch(`/api/tms/programs/${programId}`);
      const result: ProgramDetailApiWrapper = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải thông tin chương trình');
      }

      setProgramDetail(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin chương trình');
      setProgramDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchProgramDetail(selectedProgramId);
    }
  }, [fetchProgramDetail, selectedProgramId]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const handleProgramChange = (_event: React.SyntheticEvent, option: ProgramOption | null) => {
    if (!option) return;
    setSelectedProgramId(option.id);
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const toggleAllBlocks = () => {
    if (!programDetail?.blockAssignments) return;
    
    setExpandedBlocks(prev => {
      const allBlockIds = new Set(programDetail.blockAssignments!.map(assignment => assignment.id));
      const allExpanded = programDetail.blockAssignments!.every(assignment => prev.has(assignment.id));
      
      if (allExpanded) {
        return new Set();
      } else {
        return allBlockIds;
      }
    });
  };

  const renderBlock = (assignment: any) => {
    const template = assignment.template;
    const groups = Array.isArray(template.groups) ? template.groups : [];
    const courses = Array.isArray(template.courses) ? template.courses : [];
    const isExpanded = expandedBlocks.has(assignment.id);

    // Calculate block summary
    const blockSummary = courses.reduce((acc: any, course: any) => {
      const credits = course.course?.credits ?? 0;
      acc.totalCredits += credits;
      if (course.is_required) {
        acc.requiredCount++;
      } else {
        acc.optionalCount++;
      }
      return acc;
    }, { totalCredits: 0, requiredCount: 0, optionalCount: 0 });

    const coursesByGroup = groups.reduce((acc: any, group: any) => {
      acc[group.id] = courses.filter((course: any) => course.group_id === group.id);
      return acc;
    }, {});

    // Sort groups by display order
    const sortedGroups = [...groups].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const renderGroupCard = (group: any, courses: any[]) => {
      const summary = courses.reduce((acc: any, course: any) => {
        const credits = course.course?.credits ?? 0;
        acc.totalCredits += credits;
        if (course.is_required) {
          acc.requiredCount++;
        } else {
          acc.optionalCount++;
        }
        return acc;
      }, { totalCredits: 0, requiredCount: 0, optionalCount: 0 });

      return (
        <Paper key={group.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography fontWeight={600}>{group.code} — {group.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getProgramBlockGroupTypeLabel(group.group_type as any)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`${courses.length} học phần`} size="small" variant="outlined" />
                <Chip label={`${summary.totalCredits} tín chỉ`} size="small" variant="outlined" />
              </Stack>
            </Stack>
            {group.rules && group.rules.length > 0 && (
              <RulesList rules={group.rules} />
            )}
            {courses.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {summary.requiredCount} học phần bắt buộc • {summary.optionalCount} học phần tự chọn
                </Typography>
                {courses.map((course: any) => (
                  <Paper key={course.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {course.course?.code} — {course.course?.name_vi}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.course?.credits} tín chỉ
                        </Typography>
                      </Box>
                      <Chip
                        label={course.is_required ? 'Bắt buộc' : 'Tự chọn'}
                        color={course.is_required ? 'primary' : 'default'}
                        size="small"
                        variant={course.is_required ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Chưa có học phần nào trong nhóm này
              </Typography>
            )}
          </Stack>
        </Paper>
      );
    };

    return (
      <Card key={assignment.id} variant="outlined">
        <CardHeader
          title={
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Typography variant="h6" component="span">
                {assignment.custom_title || template.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={getProgramBlockTypeLabel(template.block_type as any)}
                  size="small"
                  variant="outlined"
                />
                {assignment.is_required && (
                  <Chip label="Bắt buộc" color="primary" size="small" />
                )}
                {!assignment.is_active && (
                  <Chip label="Không hoạt động" color="error" size="small" />
                )}
              </Stack>
            </Stack>
          }
          subheader={template.description || undefined}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`${groups.length} nhóm`} size="small" variant="outlined" />
                <Chip label={`${courses.length} học phần`} size="small" variant="outlined" />
                <Chip label={`${blockSummary.totalCredits} tín chỉ`} size="small" variant="outlined" />
              </Stack>
              <IconButton
                onClick={() => toggleBlockExpanded(assignment.id)}
                size="small"
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          }
        />
        <Collapse in={isExpanded}>
          <CardContent>
            <Stack spacing={2}>
              {sortedGroups.length > 0 ? (
                sortedGroups.map((group) => (
                  <Box key={group.id}>
                    {renderGroupCard(group, coursesByGroup[group.id] || [])}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  Chưa có nhóm học phần nào trong khối này
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Khung chương trình đào tạo
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Làm mới">
                <span>
                  <IconButton onClick={() => selectedProgramId && fetchProgramDetail(selectedProgramId)} disabled={loadingDetail}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Autocomplete
                options={programs}
                value={selectedProgram}
                onChange={handleProgramChange}
                loading={loadingPrograms}
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
          </Box>

          {error && (
            <Alert severity="error" action={
              <Button color="inherit" size="small" onClick={() => selectedProgramId && fetchProgramDetail(selectedProgramId)}>
                Thử lại
              </Button>
            }>
              {error}
            </Alert>
          )}

          {loadingDetail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {programDetail && !loadingDetail && (
            <>
              <ProgramSummary program={programDetail} />

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Khung chương trình đào tạo</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={programDetail.blockAssignments?.every(assignment => expandedBlocks.has(assignment.id)) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={toggleAllBlocks}
                  >
                    {programDetail.blockAssignments?.every(assignment => expandedBlocks.has(assignment.id)) ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                  </Button>
                </Stack>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  {programDetail.blockAssignments
                    ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                    .map((assignment) => (
                      <Box key={assignment.id}>
                        {renderBlock(assignment)}
                      </Box>
                    ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}