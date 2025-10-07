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
} from '@mui/icons-material';
import Link from 'next/link';
import {
  getProgramPriorityColor,
  getProgramPriorityLabel,
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
  getProgramBlockGroupTypeLabel,
  ProgramBlockGroupType,
} from '@/constants/programs';
import {
  ProgramDetail,
  ProgramApiResponseItem,
  ProgramListApiResponse,
  ProgramBlockGroupItem,
  mapProgramDetail,
  mapProgramResponse,
} from '../program-utils';

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

interface ProgramDetailApiWrapper {
  success: boolean;
  data?: ProgramApiResponseItem;
  error?: string;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

function ProgramSummary({ program }: { program: ProgramDetail }): JSX.Element {
  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h5" component="span">
              {program.nameVi}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={getProgramStatusLabel(program.status)}
                color={getProgramStatusColor(program.status)}
                size="small"
              />
              <Chip
                label={getProgramPriorityLabel(program.priority)}
                color={getProgramPriorityColor(program.priority)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Stack>
        }
        subheader={program.nameEn || undefined}
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
                  {program.orgUnit ? `${program.orgUnit.name} (${program.orgUnit.code})` : 'Chưa cập nhật'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Tổng tín chỉ</Typography>
                <Typography fontWeight="medium">{program.totalCredits ?? '—'}</Typography>
              </Stack>
            </Stack>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Hiệu lực từ</Typography>
                <Typography fontWeight="medium">{formatDate(program.effectiveFrom)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Hiệu lực đến</Typography>
                <Typography fontWeight="medium">{formatDate(program.effectiveTo)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Số khối học phần</Typography>
                <Typography fontWeight="medium">{program.stats.blockCount}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Số học phần</Typography>
                <Typography fontWeight="medium">{program.stats.courseCount}</Typography>
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

function RulesList({
  rules,
}: {
  rules: Array<{ id: string; minCredits: number | null; maxCredits: number | null; minCourses: number | null; maxCourses: number | null }>;
}): JSX.Element | null {
  if (!rules || rules.length === 0) return null;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Quy tắc áp dụng:
      </Typography>
      {rules.map((rule) => {
        const parts: string[] = [];

        if (rule.minCredits != null || rule.maxCredits != null) {
          const creditRange = [rule.minCredits, rule.maxCredits]
            .map((value) => (value != null ? `${value}` : '—'))
            .join(' - ');
          parts.push(`Tín chỉ: ${creditRange}`);
        }

        if (rule.minCourses != null || rule.maxCourses != null) {
          const courseRange = [rule.minCourses, rule.maxCourses]
            .map((value) => (value != null ? `${value}` : '—'))
            .join(' - ');
          parts.push(`Số học phần: ${courseRange}`);
        }

        return (
          <Typography key={rule.id} variant="caption" color="text.secondary">
            • {parts.join(' • ')}
          </Typography>
        );
      })}
    </Stack>
  );
}

function summarizeCourses(courses: ProgramDetail['blocks'][number]['courses']) {
  return courses.reduce(
    (acc, course) => {
      const credits = course.credits ?? 0;
      acc.totalCredits += credits;
      if (course.required) {
        acc.requiredCredits += credits;
        acc.requiredCount += 1;
      } else {
        acc.optionalCredits += credits;
        acc.optionalCount += 1;
      }
      return acc;
    },
    { totalCredits: 0, requiredCredits: 0, optionalCredits: 0, requiredCount: 0, optionalCount: 0 },
  );
}

export default function TrainingProgramFrameworkPage(): JSX.Element {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const response = await fetch('/api/tms/programs/list?limit=200');
      const result: ProgramListApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      const items = result.data?.items ?? [];
      const mapped = items.map(mapProgramResponse);
      const options: ProgramOption[] = mapped.map((program) => ({
        id: program.id,
        code: program.code,
        name: program.nameVi,
        label: `${program.code} — ${program.nameVi}`,
      }));

      setPrograms(options);
      if (!selectedProgramId && options.length > 0) {
        setSelectedProgramId(options[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách chương trình');
    } finally {
      setLoadingPrograms(false);
    }
  }, [selectedProgramId]);

  const fetchProgramDetail = useCallback(async (programId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const response = await fetch(`/api/tms/programs/${programId}`);
      const result: ProgramDetailApiWrapper = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải thông tin chương trình');
      }

      setProgramDetail(mapProgramDetail(result.data));
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

  const renderBlock = (block: ProgramDetail['blocks'][number]) => {
    const groups = Array.isArray(block.groups) ? block.groups : [];
    const blockSummary = summarizeCourses(block.courses);

    const coursesByGroup = groups.reduce<Record<string, typeof block.courses>>((acc, group) => {
      acc[group.id] = block.courses.filter((course) => course.groupId === group.id);
      return acc;
    }, {});

    // Sort groups by display order
    const sortedGroups = [...groups].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const groupedCourseIds = new Set<string>();

    const renderGroupCard = (group: ProgramBlockGroupItem, courses: ProgramDetail['blocks'][number]['courses']) => {
      courses.forEach((course) => groupedCourseIds.add(course.mapId));
      const summary = summarizeCourses(courses);
      const rawTypeLabel = group.rawGroupType && !group.rawGroupType.toLowerCase().startsWith(group.groupType)
        ? group.rawGroupType
        : null;

      return (
        <Paper key={group.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography fontWeight={600}>{group.code} — {group.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getProgramBlockGroupTypeLabel(group.groupType)}
                  {rawTypeLabel ? ` • ${rawTypeLabel}` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`${courses.length} học phần`} size="small" variant="outlined" />
                <Chip label={`${summary.totalCredits} tín chỉ`} size="small" variant="outlined" />
              </Stack>
            </Stack>
            <RulesList rules={group.rules} />
            {courses.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {summary.requiredCount} học phần bắt buộc • {summary.optionalCount} học phần tự chọn
                </Typography>
                {courses.map((course) => (
                  <Paper key={course.mapId} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {course.code} — {course.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.credits} tín chỉ • Thứ tự: {course.displayOrder}
                        </Typography>
                      </Box>
                      <Chip
                        label={course.required ? 'Bắt buộc' : 'Tự chọn'}
                        color={course.required ? 'success' : 'default'}
                        size="small"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Chưa có học phần trong nhóm.
              </Typography>
            )}
          </Stack>
        </Paper>
      );
    };

    return (
      <Card key={block.id} variant="outlined">
        <CardHeader
          title={
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Typography variant="h6" component="span">
                {block.code} — {block.title}
              </Typography>
              <Chip label={getProgramBlockTypeLabel(block.blockType)} size="small" color="primary" variant="outlined" />
            </Stack>
          }
          subheader={`${block.courses.length} học phần • ${blockSummary.totalCredits} tín chỉ • ${groups.length} nhóm`}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${blockSummary.requiredCount} bắt buộc`} size="small" variant="outlined" color="success" />
              <Chip label={`${blockSummary.optionalCount} tự chọn`} size="small" variant="outlined" />
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            {sortedGroups.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2">Nhóm khối học phần</Typography>
                <Stack spacing={2}>
                  {sortedGroups.map((group) => renderGroupCard(group, coursesByGroup[group.id] ?? []))}
                </Stack>
              </Stack>
            )}

            {(() => {
              const ungroupedCourses = block.courses.filter((course) => !groupedCourseIds.has(course.mapId));
              if (ungroupedCourses.length === 0) return null;
              const summary = summarizeCourses(ungroupedCourses);
              return (
                <Stack spacing={1.5}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2">Học phần không thuộc nhóm</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.totalCredits} tín chỉ • {summary.requiredCount} bắt buộc • {summary.optionalCount} tự chọn
                  </Typography>
                  <Stack spacing={1}>
                    {ungroupedCourses.map((course) => (
                      <Paper key={course.mapId} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {course.code} — {course.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {course.credits} tín chỉ • Thứ tự: {course.displayOrder}
                            </Typography>
                          </Box>
                          <Chip
                            label={course.required ? 'Bắt buộc' : 'Tự chọn'}
                            color={course.required ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              );
            })()}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderStandaloneCourses = () => {
    if (!programDetail || programDetail.standaloneCourses.length === 0) return null;

    return (
      <Card variant="outlined">
        <CardHeader
          title="Học phần độc lập"
          subheader={`${programDetail.standaloneCourses.length} học phần nằm ngoài các khối`}
        />
        <CardContent>
          <Stack spacing={1.5}>
            {programDetail.standaloneCourses.map((course) => (
              <Paper key={course.mapId} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {course.code} — {course.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course.credits} tín chỉ • Thứ tự: {course.displayOrder}
                    </Typography>
                  </Box>
                  <Chip
                    label={course.required ? 'Bắt buộc' : 'Tự chọn'}
                    color={course.required ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
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
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn chương trình"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPrograms ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loadingDetail && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loadingDetail && programDetail && (
        <Stack spacing={3}>
          <ProgramSummary program={programDetail} />

          <Stack spacing={2}>
            <Typography variant="h6">Khung chương trình đào tạo</Typography>
            <Stack spacing={3}>
              {programDetail.blocks.map((block) => (
                <Box key={block.id}>
                  {renderBlock(block)}
                </Box>
              ))}
            </Stack>
          </Stack>

          {renderStandaloneCourses()}
        </Stack>
      )}
    </Container>
  );
}
