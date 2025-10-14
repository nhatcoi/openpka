'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
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
  data?: {
    id: string;
    code: string;
    name_vi: string;
    name_en?: string;
    description?: string;
    version: string;
    total_credits: number;
    status: string;
    plo?: Array<{ id: string; label: string; category?: string }> | Record<string, string>;
    effective_from?: string;
    effective_to?: string;
    created_at?: string;
    updated_at?: string;
    org_unit_id?: string;
    major_id?: string;
    OrgUnit?: {
      id: string;
      code: string;
      name: string;
    };
    blockAssignments?: Array<{
      id: string;
      display_order: number;
      is_required: boolean;
      is_active: boolean;
      custom_title?: string;
      custom_description?: string;
      assigned_at: string;
      template: {
        id: string;
        code: string;
        title: string;
        title_en?: string;
        block_type: string;
        description?: string;
        min_credits?: number;
        max_credits?: number;
        category?: any;
        groups?: Array<{
          id: string;
          code: string;
          title: string;
          group_type: string;
          display_order: number;
          description?: string;
          rules?: Array<{
            id: string;
            min_credits?: number;
            max_credits?: number;
            min_courses?: number;
            max_courses?: number;
            rule_type?: string;
          }>;
        }>;
        courses?: Array<{
          id: string;
          course_id: string;
          group_id?: string;
          is_required: boolean;
          display_order: number;
          credits?: number;
          course?: {
            id: string;
            code: string;
            name_vi: string;
            credits: number;
          };
        }>;
      };
    }>;
    _count?: {
      StudentAcademicProgress: number;
      blockAssignments: number;
    };
    stats?: {
      student_count: number;
      block_count: number;
      course_count: number;
    };
    priority?: string;
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

function summarizeCourses(courses: any[]) {
  return courses.reduce(
    (acc, course) => {
      const credits = course.course?.credits ?? course.credits ?? 0;
      acc.totalCredits += credits;
      if (course.is_required) {
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
  rules: Array<{ id: string; min_credits: number | null; max_credits: number | null; min_courses: number | null; max_courses: number | null; rule_type?: string }>;
}): JSX.Element | null {
  if (!rules || rules.length === 0) return null;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Quy tắc áp dụng:
      </Typography>
      {rules.map((rule) => {
        const parts: string[] = [];

        if (rule.min_credits != null || rule.max_credits != null) {
          const creditRange = [rule.min_credits, rule.max_credits]
            .map((value) => (value != null ? `${value}` : '—'))
            .join(' - ');
          parts.push(`Tín chỉ: ${creditRange}`);
        }

        if (rule.min_courses != null || rule.max_courses != null) {
          const courseRange = [rule.min_courses, rule.max_courses]
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

const renderBlock = (blockAssignment: any, expandedBlocks: Set<string>, toggleBlockExpanded: (id: string) => void) => {
  const template = blockAssignment.template;
  const groups = Array.isArray(template?.groups) ? template.groups : [];
  const courses = Array.isArray(template?.courses) ? template.courses : [];
  const blockSummary = summarizeCourses(courses);
  const isExpanded = expandedBlocks.has(blockAssignment.id);

  const coursesByGroup = groups.reduce((acc: Record<string, typeof courses>, group: any) => {
    acc[group.id] = courses.filter((course: any) => course.group_id === group.id);
    return acc;
  }, {} as Record<string, typeof courses>);

  // Sort groups by display order
  const sortedGroups = [...groups].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const groupedCourseIds = new Set<string>();

  const renderGroupCard = (group: any, courses: any[]) => {
    courses.forEach((course: any) => groupedCourseIds.add(course.id));
    const summary = summarizeCourses(courses);

    return (
      <Paper key={group.id} variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontWeight={600}>{group.code} — {group.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {getProgramBlockGroupTypeLabel(group.group_type)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${courses.length} học phần`} size="small" variant="outlined" />
              <Chip label={`${summary.totalCredits} tín chỉ`} size="small" variant="outlined" />
            </Stack>
          </Stack>
          <RulesList rules={group.rules || []} />
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
                        {course.course?.code || course.code} — {course.course?.name_vi || course.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {course.course?.credits || course.credits} tín chỉ • Thứ tự: {course.display_order}
                      </Typography>
                    </Box>
                    <Chip
                      label={course.is_required ? 'Bắt buộc' : 'Tự chọn'}
                      color={course.is_required ? 'success' : 'default'}
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
    <Paper key={blockAssignment.id} variant="outlined" sx={{ p: 3, mb: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="span">
              {template?.code} — {blockAssignment.custom_title || template?.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={getProgramBlockTypeLabel(template?.block_type)} size="small" color="primary" variant="outlined" />
              {blockAssignment.is_required && <Chip label="Bắt buộc" size="small" color="success" variant="outlined" />}
              {!blockAssignment.is_active && <Chip label="Tạm dừng" size="small" color="warning" variant="outlined" />}
            </Stack>
            {blockAssignment.custom_description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {blockAssignment.custom_description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${courses.length} học phần`} size="small" variant="outlined" />
            <Chip label={`${blockSummary.totalCredits} tín chỉ`} size="small" variant="outlined" />
            <Chip label={`${groups.length} nhóm`} size="small" variant="outlined" />
            <Chip label={`${blockSummary.requiredCount} bắt buộc`} size="small" variant="outlined" color="success" />
            <Chip label={`${blockSummary.optionalCount} tự chọn`} size="small" variant="outlined" />
            <IconButton
              onClick={() => toggleBlockExpanded(blockAssignment.id)}
              size="small"
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={isExpanded}>
          {sortedGroups.length > 0 && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Nhóm khối học phần</Typography>
              <Stack spacing={2}>
                {sortedGroups.map((group) => renderGroupCard(group, coursesByGroup[group.id] ?? []))}
              </Stack>
            </Stack>
          )}

          {(() => {
            const ungroupedCourses = courses.filter((course: any) => !groupedCourseIds.has(course.id));
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
                  {ungroupedCourses.map((course: any) => (
                    <Paper key={course.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {course.course?.code || course.code} — {course.course?.name_vi || course.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.course?.credits || course.credits} tín chỉ • Thứ tự: {course.display_order}
                          </Typography>
                        </Box>
                        <Chip
                          label={course.is_required ? 'Bắt buộc' : 'Tự chọn'}
                          color={course.is_required ? 'success' : 'default'}
                          size="small"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            );
          })()}
        </Collapse>
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

  const [program, setProgram] = useState<ProgramDetailApiWrapper['data'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

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

      setProgram(result.data);
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
    if (!program?.blockAssignments) return;
    
    setExpandedBlocks(prev => {
      const allBlockIds = new Set(program.blockAssignments!.map(assignment => assignment.id));
      const allExpanded = program.blockAssignments!.every(assignment => prev.has(assignment.id));
      
      if (allExpanded) {
        return new Set();
      } else {
        return allBlockIds;
      }
    });
  };

  const ploItems = useMemo(() => {
    // New format: array of { id, label, category }
    if (Array.isArray(program?.plo)) {
      return program!.plo!.map((item) => ({
        id: item.id,
        label: item.label,
        category: (item as any).category ?? 'general',
      }));
    }

    // Backward compatibility: object map { id: label }
    if (program?.plo && typeof program.plo === 'object') {
      const ploEntries = Object.entries(program.plo as Record<string, string>);
      return ploEntries.map(([key, value]) => ({
        id: key,
        label: typeof value === 'string' ? value : 'Chưa cập nhật',
        category: 'general' as const,
      }));
    }

    // Fallback to legacy ProgramLearningOutcome if available in mapping layer
    if ((program as any)?.ProgramLearningOutcome) {
      try {
        const mapped = mapPloToOutcomeItems((program as any).ProgramLearningOutcome);
        return mapped.map((o: any) => ({
          id: o.id,
          label: (o.description_vi ?? o.label ?? '').toString(),
          category: 'general' as const,
        }));
      } catch {}
    }

    return [];
  }, [program]);

  if (!programId) {
    return (
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Alert severity="error">Không tìm thấy mã chương trình hợp lệ.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 2 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/tms/programs" color="inherit">
          Chương trình đào tạo
        </Link>
        <Typography color="text.primary">
          {program?.name_vi || 'Chi tiết chương trình đào tạo'}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Chi tiết chương trình đào tạo
      </Typography>

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
          <Paper sx={{ p: 3, width: '100%' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ width: '100%' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" fontWeight="bold">
                  {program.name_vi}
                </Typography>
                {program.name_en && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {program.name_en}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={getProgramStatusLabel(program.status)}
                    color={getProgramStatusColor(program.status)}
                    size="small"
                  />
                  <Chip
                    label={getProgramPriorityLabel(program.priority || 'MEDIUM')}
                    color={getProgramPriorityColor(program.priority || 'MEDIUM')}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ flexShrink: 0 }}>
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

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin chung
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Đơn vị quản lý</Typography>
                    <Typography fontWeight="medium">
                      {program.OrgUnit ? `${program.OrgUnit.name} (${program.OrgUnit.code})` : 'Chưa cập nhật'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Tổng tín chỉ</Typography>
                    <Typography fontWeight="medium">{program.total_credits}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Hiệu lực từ</Typography>
                    <Typography fontWeight="medium">{formatDate(program.effective_from)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Hiệu lực đến</Typography>
                    <Typography fontWeight="medium">{formatDate(program.effective_to)}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Thống kê
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Số khối kiến thức
                      </Typography>
                      <Typography variant="h5">{program.blockAssignments?.length || 0}</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tổng học phần
                      </Typography>
                      <Typography variant="h5">
                        {program.stats?.course_count || 0}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Sinh viên đang học
                      </Typography>
                      <Typography variant="h5">{program.stats?.student_count || 0}</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tổng tín chỉ
                      </Typography>
                      <Typography variant="h5">{program.total_credits || 0}</Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>

          {ploItems.length > 0 && (
            <Paper sx={{ p: 3, width: '100%' }}>
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

          <Paper sx={{ p: 3, width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, width: '100%' }}>
              <Typography variant="h6">
                Khung chương trình đào tạo 
              </Typography>
              <Button
                variant="contained"
                size="medium"
                startIcon={<SchoolIcon />}
                onClick={() => router.push(`/tms/programs/${programId}/structure`)}
              >
                Xem khung chương trình
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cập nhật
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography color="text.secondary">Ngày tạo</Typography>
                <Typography fontWeight="medium">{formatDate(program.created_at)}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography color="text.secondary">Lần cập nhật gần nhất</Typography>
                <Typography fontWeight="medium">{formatDate(program.updated_at)}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Container>
  );
}
