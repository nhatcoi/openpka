'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  Layers as LayersIcon,
  Timeline as TimelineIcon,
  InfoOutlined as InfoIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { ApiResponse } from '@/lib/api/api-handler';
import {
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
  getProgramBlockGroupTypeLabel,
} from '@/constants/programs';
import {
  getCurriculumStatusColor,
  getCurriculumStatusLabel,
} from '@/constants/curriculum';
import {
  ProgramDetail,
  ProgramBlockItem,
  ProgramCourseItem,
  mapProgramDetail,
} from '@/app/(tms)/tms/programs/program-utils';
import {
  CurriculumCourseItem,
  CurriculumDetailResponse,
  CurriculumProgramSummary,
  CurriculumStructure,
  CurriculumVersionItem,
} from '@/types/curriculum';

interface ProgramOption {
  id: string;
  label: string;
  code: string | null;
  name: string | null;
  status: string | null;
  orgUnit?: {
    name: string;
    code: string;
  } | null;
}

interface CurriculumDetailState {
  program: ProgramDetail;
  versions: CurriculumVersionItem[];
  stats: {
    versionCount: number;
    activeVersionId: string | null;
  };
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const summarizeBlock = (block: ProgramBlockItem) => {
  return block.courses.reduce(
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
};

const summarizeCurriculumStructure = (structure: CurriculumStructure) => {
  return {
    semesters: structure.summary.semesters,
    courseCount: structure.summary.courseCount,
    totalCredits: structure.summary.totalCredits,
    requiredCredits: structure.summary.requiredCredits,
    optionalCredits: structure.summary.optionalCredits,
  };
};

const buildProgramOptions = (programs: CurriculumProgramSummary[]): ProgramOption[] =>
  programs.map((program) => ({
    id: program.id,
    code: program.code,
    name: program.nameVi,
    status: program.status,
    orgUnit: program.orgUnit ? { code: program.orgUnit.code, name: program.orgUnit.name } : null,
    label: [program.code, program.nameVi ?? program.nameEn].filter(Boolean).join(' • ') || `CTDT ${program.id}`,
  }));

const renderCourseRow = (course: ProgramCourseItem | CurriculumCourseItem) => {
  const isProgramCourse = 'mapId' in course;
  const key = isProgramCourse ? course.mapId : course.id;
  const required = course.required;
  const credits = course.credits ?? 0;
  const code = course.code;
  const name = course.name;
  const groupCode = isProgramCourse ? course.groupId : course.groupCode;
  const groupTitle = !isProgramCourse ? course.groupTitle : null;
  const blockCode = !isProgramCourse ? course.blockCode : null;

  return (
    <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" fontWeight={600}>
            {code} — {name}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            <Chip size="small" label={`${credits} tín chỉ`} color="primary" variant="outlined" />
            <Chip
              size="small"
              label={required ? 'Bắt buộc' : 'Tự chọn'}
              color={required ? 'success' : 'default'}
              variant={required ? 'filled' : 'outlined'}
            />
            {blockCode && (
              <Chip size="small" label={`Khối: ${blockCode}`} variant="outlined" />
            )}
            {groupCode && (
              <Chip
                size="small"
                label={`Nhóm: ${groupTitle ?? groupCode}`}
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

const renderProgramBlock = (block: ProgramBlockItem) => {
  const totals = summarizeBlock(block);
  const groupedCourses = block.groups.map((group) => ({
    group,
    courses: block.courses.filter((course) => course.groupId === group.id),
  }));
  const ungroupedCourses = block.courses.filter((course) => !course.groupId);

  return (
    <Paper key={block.id} variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            {block.title}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={getProgramBlockTypeLabel(block.blockType)}
              color="info"
              variant="outlined"
            />
            <Chip size="small" label={`${block.courses.length} học phần`} variant="outlined" />
            <Chip size="small" label={`${totals.totalCredits} tín chỉ`} color="primary" variant="outlined" />
          </Stack>
        </Stack>

        {groupedCourses.length > 0 && (
          <Stack spacing={2}>
            {groupedCourses.map(({ group, courses }) => (
              <Box key={group.id}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {group.title}
                  </Typography>
                  <Chip size="small" label={getProgramBlockGroupTypeLabel(group.groupType)} variant="outlined" />
                </Stack>
                <Stack spacing={1}>{courses.length > 0 ? courses.map(renderCourseRow) : (
                  <Alert severity="info" variant="outlined">Chưa có học phần trong nhóm này.</Alert>
                )}</Stack>
              </Box>
            ))}
          </Stack>
        )}

        {ungroupedCourses.length > 0 && (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Học phần chưa gán nhóm
              </Typography>
              <Chip size="small" label={`${ungroupedCourses.length}`} variant="outlined" />
            </Stack>
            <Stack spacing={1}>{ungroupedCourses.map(renderCourseRow)}</Stack>
          </Box>
        )}

        {block.courses.length === 0 && (
          <Alert severity="info" variant="outlined">
            Khối học phần chưa có dữ liệu học phần.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

const renderStandaloneCourses = (courses: ProgramCourseItem[]) => {
  if (courses.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6">Học phần độc lập</Typography>
        <Stack spacing={1}>{courses.map(renderCourseRow)}</Stack>
      </Stack>
    </Paper>
  );
};

const renderCurriculumStructure = (structure: CurriculumStructure) => {
  if (!structure || structure.semesters.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Phiên bản này chưa có cấu trúc học kỳ chi tiết. Hãy cập nhật <b>curriculum_structure</b> để hiển thị khung chương trình.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {structure.semesters.map((semester) => (
        <Grid key={semester.id} item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
                  {semester.name}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`${semester.totalCredits} tín chỉ`} color="primary" variant="outlined" />
                  <Chip size="small" label={`${semester.courseCount} học phần`} variant="outlined" />
                  <Chip size="small" label={`Thứ tự ${semester.order}`} variant="outlined" />
                </Stack>
              </Stack>

              {semester.note && (
                <Alert severity="info" variant="outlined">
                  {semester.note}
                </Alert>
              )}

              <Stack spacing={1}>{semester.courses.map(renderCourseRow)}</Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default function CurriculumPage(): JSX.Element {
  const [programs, setPrograms] = useState<CurriculumProgramSummary[]>([]);
  const [programsLoading, setProgramsLoading] = useState<boolean>(false);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [detail, setDetail] = useState<CurriculumDetailState | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const programOptions = useMemo(() => {
    const options = buildProgramOptions(programs);
    if (!searchTerm) return options;

    const normalized = searchTerm.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [programs, searchTerm]);

  const selectedProgramOption = useMemo(() => {
    return programOptions.find((option) => option.id === selectedProgramId) ?? null;
  }, [programOptions, selectedProgramId]);

  const selectedVersion = useMemo(() => {
    if (!detail || !selectedVersionId) return null;
    return detail.versions.find((version) => version.id === selectedVersionId) ?? null;
  }, [detail, selectedVersionId]);

  const structureSummary = useMemo(() => {
    if (!selectedVersion) return null;
    return summarizeCurriculumStructure(selectedVersion.structure);
  }, [selectedVersion]);

  const statsSummary = useMemo(() => {
    const totalPrograms = programs.length;
    const totalVersions = programs.reduce((sum, program) => sum + (program.stats.curriculumVersionCount ?? 0), 0);
    const activePrograms = programs.filter((program) => program.latestVersion).length;
    return { totalPrograms, totalVersions, activePrograms };
  }, [programs]);

  const fetchPrograms = useCallback(async () => {
    try {
      setProgramsLoading(true);
      setProgramsError(null);
      const response = await fetch('/api/tms/curriculum?limit=100');
      const result = (await response.json()) as ApiResponse<{ items: CurriculumProgramSummary[] }>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      setPrograms(result.data.items);
      if (!selectedProgramId && result.data.items.length > 0) {
        setSelectedProgramId(result.data.items[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách chương trình';
      setProgramsError(message);
    } finally {
      setProgramsLoading(false);
    }
  }, [selectedProgramId]);

  const fetchDetail = useCallback(async (programId: string) => {
    if (!programId) return;

    try {
      setDetailLoading(true);
      setDetailError(null);
      const response = await fetch(`/api/tms/curriculum/${programId}`);
      const result = (await response.json()) as ApiResponse<CurriculumDetailResponse>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải thông tin chương trình');
      }

      const programDetail = mapProgramDetail(result.data.program);
      const mergedDetail: CurriculumDetailState = {
        program: programDetail,
        versions: result.data.versions,
        stats: result.data.stats,
      };

      setDetail(mergedDetail);
      const activeVersionId = result.data.stats.activeVersionId ?? result.data.versions[0]?.id ?? null;
      setSelectedVersionId(activeVersionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải thông tin chương trình';
      setDetailError(message);
      setDetail(null);
      setSelectedVersionId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchDetail(selectedProgramId);
    }
  }, [selectedProgramId, fetchDetail]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBookIcon />
              Khung chương trình đào tạo
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Tải lại danh sách chương trình">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchPrograms()}
                    disabled={programsLoading}
                  >
                    Làm mới
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Chức năng đang phát triển">
                <span>
                  <Button variant="outlined" startIcon={<UploadIcon />} disabled>
                    Nhập từ file
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Chức năng đang phát triển">
                <span>
                  <Button variant="outlined" startIcon={<FileDownloadIcon />} disabled>
                    Xuất dữ liệu
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Chọn chương trình đào tạo, xem các phiên bản khung chương trình và cấu trúc học phần theo từng học kỳ.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Chọn chương trình đào tạo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tìm kiếm theo mã hoặc tên chương trình để xem chi tiết khung đào tạo.
                </Typography>
              </Box>
              <Box sx={{ width: { xs: '100%', md: 420 } }}>
                <Autocomplete<ProgramOption>
                  options={programOptions}
                  value={selectedProgramOption}
                  loading={programsLoading}
                  onChange={(_, option) => {
                    setSelectedProgramId(option ? option.id : '');
                    setSelectedVersionId(null);
                  }}
                  onInputChange={(_, value) => setSearchTerm(value)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chương trình đào tạo"
                      placeholder="Nhập mã hoặc tên chương trình"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {programsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            </Stack>

            {programsError && (
              <Alert severity="error">
                {programsError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <SchoolIcon color="primary" />
                    <Typography variant="h6">{statsSummary.totalPrograms}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Số chương trình hiện có
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <TimelineIcon color="success" />
                    <Typography variant="h6">{statsSummary.totalVersions}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số phiên bản khung chương trình
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <CheckCircleIcon color="info" />
                    <Typography variant="h6">{statsSummary.activePrograms}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chương trình có phiên bản hiệu lực gần nhất
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {!selectedProgramId && (
          <Alert severity="info" variant="outlined">
            Vui lòng chọn một chương trình để xem chi tiết.
          </Alert>
        )}

        {selectedProgramId && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
              {detailLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              )}

              {!detailLoading && detailError && (
                <Alert severity="error">{detailError}</Alert>
              )}

              {!detailLoading && !detailError && detail && (
                <Stack spacing={3}>
                  <Box>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
                        {detail.program.nameVi}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={getProgramStatusLabel(detail.program.status)}
                          color={getProgramStatusColor(detail.program.status)}
                        />
                        <Chip label={`Mã: ${detail.program.code}`} variant="outlined" />
                        <Chip label={`Tổng tín chỉ: ${detail.program.totalCredits}`} variant="outlined" />
                      </Stack>
                    </Stack>
                    {detail.program.orgUnit && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Đơn vị quản lý: {detail.program.orgUnit.name} ({detail.program.orgUnit.code})
                      </Typography>
                    )}
                    {detail.program.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {detail.program.description}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <LayersIcon color="primary" />
                      <Typography variant="h6">
                        Phiên bản khung chương trình ({detail.stats.versionCount})
                      </Typography>
                    </Stack>
                    {detail.versions.length === 0 && (
                      <Alert severity="info" variant="outlined">
                        Chưa có phiên bản khung chương trình nào được tạo cho chương trình này.
                      </Alert>
                    )}

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                      {detail.versions.map((version) => {
                        const isSelected = version.id === selectedVersionId;
                        const summary = summarizeCurriculumStructure(version.structure);
                        return (
                          <Card
                            key={version.id}
                            variant={isSelected ? 'elevation' : 'outlined'}
                            sx={{
                              minWidth: { xs: '100%', md: 320 },
                              borderColor: isSelected ? 'primary.main' : 'divider',
                            }}
                          >
                            <CardActionArea onClick={() => setSelectedVersionId(version.id)}>
                              <CardContent>
                                <Stack spacing={1.5}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {version.title || `Phiên bản ${version.version}`}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={getCurriculumStatusLabel(version.status)}
                                      color={getCurriculumStatusColor(version.status)}
                                    />
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    Hiệu lực: {formatDate(version.effectiveFrom)} — {formatDate(version.effectiveTo)}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" label={`${summary.totalCredits} tín chỉ`} variant="outlined" />
                                    <Chip size="small" label={`${summary.courseCount} học phần`} variant="outlined" />
                                    <Chip size="small" label={`${summary.semesters} học kỳ`} variant="outlined" />
                                  </Stack>
                                  {version.approvalNotes && (
                                    <Alert severity="info" variant="outlined">
                                      {version.approvalNotes}
                                    </Alert>
                                  )}
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        );
                      })}
                    </Stack>
                  </Box>

                  <Divider />

                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimelineIcon color="primary" />
                      <Typography variant="h6">
                        Cấu trúc học kỳ
                      </Typography>
                      {structureSummary && (
                        <Chip
                          size="small"
                          label={`${structureSummary.totalCredits} tín chỉ / ${structureSummary.courseCount} học phần / ${structureSummary.semesters} học kỳ`}
                        />
                      )}
                      {!structureSummary && detail.versions.length > 0 && (
                        <Tooltip title="Chưa có cấu trúc chi tiết từ curriculum_structure">
                          <InfoIcon color="action" fontSize="small" />
                        </Tooltip>
                      )}
                    </Stack>
                    {selectedVersion && renderCurriculumStructure(selectedVersion.structure)}
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MenuBookIcon color="primary" />
                      <Typography variant="h6">
                        Cấu trúc khối học phần hiện tại
                      </Typography>
                    </Stack>
                    {detail.program.blocks.length === 0 && (
                      <Alert severity="info" variant="outlined">
                        Chương trình chưa có khối học phần nào.
                      </Alert>
                    )}
                    <Stack spacing={2}>
                      {detail.program.blocks.map(renderProgramBlock)}
                    </Stack>
                  </Stack>

                  {renderStandaloneCourses(detail.program.standaloneCourses)}
                </Stack>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
