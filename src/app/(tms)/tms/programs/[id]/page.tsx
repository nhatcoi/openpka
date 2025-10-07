'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
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
  ProgramBlockGroupItem,
  mapPloToOutcomeItems,
  mapProgramDetail,
} from '../program-utils';

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
    <Paper key={block.id} variant="outlined" sx={{ p: 3, mb: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="span">
              {block.code} — {block.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={getProgramBlockTypeLabel(block.blockType)} size="small" color="primary" variant="outlined" />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${block.courses.length} học phần`} size="small" variant="outlined" />
            <Chip label={`${blockSummary.totalCredits} tín chỉ`} size="small" variant="outlined" />
            <Chip label={`${groups.length} nhóm`} size="small" variant="outlined" />
            <Chip label={`${blockSummary.requiredCount} bắt buộc`} size="small" variant="outlined" color="success" />
            <Chip label={`${blockSummary.optionalCount} tự chọn`} size="small" variant="outlined" />
          </Stack>
        </Stack>

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
    </Paper>
  );
};

const renderStandaloneCourses = (program: ProgramDetail) => {
  if (!program || program.standaloneCourses.length === 0) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Học phần độc lập</Typography>
        <Typography variant="body2" color="text.secondary">
          {program.standaloneCourses.length} học phần nằm ngoài các khối
        </Typography>
        <Stack spacing={1.5}>
          {program.standaloneCourses.map((course) => (
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
    </Paper>
  );
};

export default function ProgramDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const programId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!programId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tms/programs/${programId}`);
      const result = (await response.json()) as ProgramDetailApiWrapper;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải thông tin chương trình');
      }

      setProgram(mapProgramDetail(result.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin chương trình';
      setError(message);
      setProgram(null);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const ploItems = useMemo(() => mapPloToOutcomeItems(program?.plo), [program?.plo]);

  if (!programId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy mã chương trình hợp lệ.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Quay lại
        </Button>
        <Typography variant="h4" component="h1">
          Chi tiết chương trình đào tạo
        </Typography>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && program && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {program.nameVi}
                </Typography>
                {program.nameEn && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {program.nameEn}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
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
              </Box>
              <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mã chương trình
                </Typography>
                <Typography variant="h6">{program.code}</Typography>
                {program.version && (
                  <Typography variant="body2" color="text.secondary">
                    Phiên bản: {program.version}
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/tms/programs/${programId}/edit`)}
                >
                  Chỉnh sửa
                </Button>
              </Stack>
            </Stack>
            {program.description && (
              <Typography variant="body1" sx={{ mt: 3 }}>
                {program.description}
              </Typography>
            )}
          </Paper>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin chung
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Đơn vị quản lý</Typography>
                    <Typography fontWeight="medium">
                      {program.orgUnit ? `${program.orgUnit.name} (${program.orgUnit.code})` : 'Chưa cập nhật'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Tổng tín chỉ</Typography>
                    <Typography fontWeight="medium">{program.totalCredits}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Hiệu lực từ</Typography>
                    <Typography fontWeight="medium">{formatDate(program.effectiveFrom)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Hiệu lực đến</Typography>
                    <Typography fontWeight="medium">{formatDate(program.effectiveTo)}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Thống kê
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Số khối kiến thức
                      </Typography>
                      <Typography variant="h5">{program.blocks.length}</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Học phần thuộc khối
                      </Typography>
                      <Typography variant="h5">
                        {program.blocks.reduce((acc, block) => acc + block.courses.length, 0)}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Học phần độc lập
                      </Typography>
                      <Typography variant="h5">{program.standaloneCourses.length}</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Sinh viên đang học
                      </Typography>
                      <Typography variant="h5">{program.stats.studentCount}</Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>

          {ploItems.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Chuẩn đầu ra chương trình
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {ploItems.map((item, index) => (
                  <Box key={item.id || index}>
                    <Typography fontWeight="medium">
                      {index + 1}. {item.label || 'Chưa cập nhật'}
                    </Typography>
                    {item.category && (
                      <Typography variant="caption" color="text.secondary">
                        Loại: {item.category === 'general' ? 'Chuẩn chung' : 'Chuẩn cụ thể'}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Khung chương trình đào tạo 
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {program.blocks.length === 0 ? (
              <Alert severity="info">Chưa có khối kiến thức nào được cấu hình.</Alert>
            ) : (
              <Stack spacing={3}>
                {program.blocks.map((block) => renderBlock(block))}
              </Stack>
            )}
          </Paper>

          {renderStandaloneCourses(program)}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cập nhật
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Ngày tạo</Typography>
                <Typography fontWeight="medium">{formatDate(program.createdAt)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Lần cập nhật gần nhất</Typography>
                <Typography fontWeight="medium">{formatDate(program.updatedAt)}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Container>
  );
}
