'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface CourseOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  label: string;
}
import {
  PROGRAM_STATUSES,
  PROGRAM_BLOCK_TYPES,
  PROGRAM_BLOCK_GROUP_TYPES,
  ProgramStatus,
  ProgramBlockType,
  ProgramBlockGroupType,
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
  getProgramBlockGroupTypeLabel,
} from '@/constants/programs';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  ProgramBlockFormItem,
  ProgramCourseFormItem,
  ProgramFormState,
  ProgramOutcomeFormItem,
  ProgramBlockGroupItem,
  buildProgramPayloadFromForm,
  createDefaultProgramForm,
  createEmptyBlock,
  createEmptyCourse,
  createEmptyOutcome,
  mapOrgUnitOptions,
} from '../program-utils';

export default function CreateProgramPage(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<ProgramFormState>(createDefaultProgramForm());
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [blockCourseSelections, setBlockCourseSelections] = useState<Record<string, CourseOption | null>>({});
  const [standaloneCourseSelection, setStandaloneCourseSelection] = useState<CourseOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helpers to create empty group and rule (aligned with edit page)
  const createEmptyBlockGroup = (): ProgramBlockGroupItem => ({
    id: `group-${Math.random().toString(36).slice(2)}`,
    code: '',
    title: '',
    groupType: 'REQUIRED' as ProgramBlockGroupType,
    rawGroupType: '',
    displayOrder: 1,
    rules: [],
  });

  const createEmptyGroupRule = () => ({
    id: `rule-${Math.random().toString(36).slice(2)}`,
    minCredits: null,
    maxCredits: null,
    minCourses: null,
    maxCourses: null,
  });

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/faculties?limit=200');
      const result = (await response.json()) as {
        data?: { items?: OrgUnitApiItem[] };
      };

      if (response.ok && result?.data?.items) {
        setOrgUnits(mapOrgUnitOptions(result.data.items));
      }
    } catch (err) {
      console.error('Failed to fetch org units', err);
    }
  }, []);

  const fetchCourseOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/courses?list=true&limit=200');
      const result = (await response.json()) as {
        success: boolean;
        data?: { items?: Array<{ id: string | number; code: string; name_vi?: string | null; credits?: number | string | null }> };
      };

      if (response.ok && result?.success && Array.isArray(result.data?.items)) {
        const mapped: CourseOption[] = result.data.items.map((item) => {
          const id = item.id != null ? item.id.toString() : '';
          const name = item.name_vi ?? '';
          const credits = Number(item.credits ?? 0);
          return {
            id,
            code: item.code,
            name,
            credits: Number.isFinite(credits) ? credits : 0,
            label: `${item.code} - ${name}`.trim(),
          };
        });
        setCourseOptions(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  }, []);

  useEffect(() => {
    fetchOrgUnits();
    fetchCourseOptions();
  }, [fetchOrgUnits, fetchCourseOptions]);

  const updateForm = <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const courseExistsInState = (state: ProgramFormState, courseId: string): boolean =>
    state.blocks.some((block) => block.courses.some((course) => course.courseId === courseId)) ||
    state.standaloneCourses.some((course) => course.courseId === courseId);

  const updateBlocks = (
    updater: (blocks: ProgramBlockFormItem[]) => ProgramBlockFormItem[],
  ) => {
    setForm((prev) => {
      const updatedBlocks = updater(prev.blocks).map((block, blockIndex) => ({
        ...block,
        displayOrder: block.displayOrder || blockIndex + 1,
        courses: block.courses.map((course, courseIndex) => ({
          ...course,
          displayOrder: course.displayOrder || courseIndex + 1,
        })),
      }));
      return { ...prev, blocks: updatedBlocks };
    });
  };

  const updateStandaloneCourses = (
    updater: (courses: ProgramCourseFormItem[]) => ProgramCourseFormItem[],
  ) => {
    setForm((prev) => ({
      ...prev,
      standaloneCourses: updater(prev.standaloneCourses).map((course, index) => ({
        ...course,
        displayOrder: course.displayOrder || index + 1,
      })),
    }));
  };

  const handleAddBlock = () => {
    const newBlock = {
      ...createEmptyBlock(),
      displayOrder: form.blocks.length + 1,
    };
    updateBlocks((blocks) => [...blocks, newBlock]);
    setBlockCourseSelections((prev) => ({ ...prev, [newBlock.id]: null }));
  };

  const handleBlockFieldChange = (
    blockId: string,
    key: keyof ProgramBlockFormItem,
    value: string | number,
  ) => {
    updateBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              [key]:
                key === 'displayOrder'
                  ? Number(value) || 1
                  : key === 'blockType'
                  ? (value as ProgramBlockFormItem['blockType'])
                  : value,
            }
          : block,
      ),
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    updateBlocks((blocks) => blocks.filter((block) => block.id !== blockId));
    setBlockCourseSelections((prev) => {
      const clone = { ...prev };
      delete clone[blockId];
      return clone;
    });
  };

  const handleAddCourseToBlock = (blockId: string) => {
    const selection = blockCourseSelections[blockId];
    if (!selection) return;

    setForm((prev) => {
      if (courseExistsInState(prev, selection.id)) {
        setError('Học phần đã được thêm vào chương trình.');
        return prev;
      }

      const updatedBlocks = prev.blocks.map((block) => {
        if (block.id !== blockId) return block;
        const newCourse: ProgramCourseFormItem = {
          id: createEmptyCourse().id,
          courseId: selection.id,
          courseCode: selection.code,
          courseName: selection.name,
          credits: selection.credits,
          required: true,
          displayOrder: block.courses.length + 1,
        };
        return {
          ...block,
          courses: [...block.courses, newCourse],
        };
      });

      return {
        ...prev,
        blocks: updatedBlocks,
      };
    });

    setBlockCourseSelections((prevSelections) => ({
      ...prevSelections,
      [blockId]: null,
    }));
    setError(null);
  };

  const handleBlockCourseChange = (
    blockId: string,
    courseId: string,
    key: keyof ProgramCourseFormItem,
    value: string | number | boolean | null,
  ) => {
    updateBlocks((blocks) =>
      blocks.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          courses: block.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  [key]: key === 'displayOrder' ? Number(value) || 1 : value,
                }
              : course,
          ),
        };
      }),
    );
  };

  const handleRemoveCourseFromBlock = (blockId: string, courseId: string) => {
    updateBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              courses: block.courses.filter((course) => course.id !== courseId),
            }
          : block,
      ),
    );
  };

  const handleAddStandaloneCourse = () => {
    if (!standaloneCourseSelection) return;

    setForm((prev) => {
      if (courseExistsInState(prev, standaloneCourseSelection.id)) {
        setError('Học phần đã được thêm vào chương trình.');
        return prev;
      }

      const newCourse: ProgramCourseFormItem = {
        id: createEmptyCourse().id,
        courseId: standaloneCourseSelection.id,
        courseCode: standaloneCourseSelection.code,
        courseName: standaloneCourseSelection.name,
        credits: standaloneCourseSelection.credits,
        required: true,
        displayOrder: prev.standaloneCourses.length + 1,
      };

      return {
        ...prev,
        standaloneCourses: [...prev.standaloneCourses, newCourse],
      };
    });

    setStandaloneCourseSelection(null);
    setError(null);
  };

  const handleStandaloneCourseChange = (
    courseId: string,
    key: keyof ProgramCourseFormItem,
    value: string | number | boolean,
  ) => {
    updateStandaloneCourses((courses) =>
      courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              [key]: key === 'displayOrder' ? Number(value) || 1 : value,
            }
          : course,
      ),
    );
  };

  const handleRemoveStandaloneCourse = (courseId: string) => {
    updateStandaloneCourses((courses) => courses.filter((course) => course.id !== courseId));
  };

  const handleAddOutcome = () => {
    setForm((prev) => ({ ...prev, outcomes: [...prev.outcomes, createEmptyOutcome()] }));
  };

  const handleOutcomeChange = (id: string, key: keyof ProgramOutcomeFormItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      outcomes: prev.outcomes.map((outcome) =>
        outcome.id === id ? { ...outcome, [key]: value } : outcome,
      ),
    }));
  };

  const handleOutcomeRemove = (id: string) => {
    setForm((prev) => ({
      ...prev,
      outcomes: prev.outcomes.filter((outcome) => outcome.id !== id),
    }));
  };

  const isValid = useMemo(() => {
    return Boolean(form.code.trim() && form.nameVi.trim());
  }, [form.code, form.nameVi]);

  const totalBlockCourses = useMemo(
    () => form.blocks.reduce((sum, block) => sum + block.courses.length, 0),
    [form.blocks],
  );

  const totalStandaloneCourses = form.standaloneCourses.length;
  const totalCourses = totalBlockCourses + totalStandaloneCourses;

  // Group management handlers (aligned with edit page)
  const handleAddGroupToBlock = (blockId: string) => {
    const newGroup = createEmptyBlockGroup();
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? { ...block, groups: [...(block.groups || []), newGroup] }
          : block,
      ),
    }));
  };

  const handleRemoveGroupFromBlock = (blockId: string, groupId: string) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              groups: (block.groups || []).filter((g) => g.id !== groupId),
              courses: block.courses.map((c) => (c.groupId === groupId ? { ...c, groupId: null } : c)),
            }
          : block,
      ),
    }));
  };

  const handleGroupFieldChange = (
    blockId: string,
    groupId: string,
    key: keyof ProgramBlockGroupItem,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              groups: (block.groups || []).map((group) =>
                group.id === groupId
                  ? { ...group, [key]: key === 'displayOrder' ? (Number(value) || 1) : value }
                  : group,
              ),
            }
          : block,
      ),
    }));
  };

  const handleAddRuleToGroup = (blockId: string, groupId: string) => {
    const newRule = createEmptyGroupRule();
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              groups: (block.groups || []).map((group) =>
                group.id === groupId ? { ...group, rules: [...(group.rules || []), newRule] } : group,
              ),
            }
          : block,
      ),
    }));
  };

  const handleRemoveRuleFromGroup = (blockId: string, groupId: string, ruleId: string) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              groups: (block.groups || []).map((group) =>
                group.id === groupId
                  ? { ...group, rules: (group.rules || []).filter((r) => r.id !== ruleId) }
                  : group,
              ),
            }
          : block,
      ),
    }));
  };

  const handleRuleFieldChange = (
    blockId: string,
    groupId: string,
    ruleId: string,
    key: string,
    value: number | null,
  ) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              groups: (block.groups || []).map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      rules: (group.rules || []).map((rule) =>
                        rule.id === ruleId ? { ...rule, [key]: value } : rule,
                      ),
                    }
                  : group,
              ),
            }
          : block,
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Vui lòng điền đầy đủ Mã chương trình và Tên chương trình.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = buildProgramPayloadFromForm(form);

      const response = await fetch('/api/tms/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tạo chương trình');
      }

      setSuccessMessage('Đã tạo chương trình đào tạo thành công.');
      setTimeout(() => router.push('/tms/programs'), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo chương trình';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Quay lại
        </Button>
        <Typography variant="h4" component="h1">
          Tạo chương trình đào tạo mới
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Mã chương trình *"
                  value={form.code}
                  onChange={(event) => updateForm('code', event.target.value.toUpperCase())}
                  required
                  fullWidth
                />
                <TextField
                  label="Phiên bản"
                  value={form.version}
                  onChange={(event) => updateForm('version', event.target.value)}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Tên chương trình (Tiếng Việt) *"
                value={form.nameVi}
                onChange={(event) => updateForm('nameVi', event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Tên chương trình (Tiếng Anh)"
                value={form.nameEn}
                onChange={(event) => updateForm('nameEn', event.target.value)}
                fullWidth
              />
              <TextField
                label="Mô tả"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Tổng số tín chỉ"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={form.totalCredits}
                  onChange={(event) => updateForm('totalCredits', Number(event.target.value) || 0)}
                  fullWidth
                />
                <Select
                  value={form.orgUnitId}
                  onChange={(event) => updateForm('orgUnitId', event.target.value)}
                  displayEmpty
                  fullWidth
                  renderValue={(value) => {
                    if (!value) {
                      return <span style={{ color: '#9e9e9e' }}>Chọn đơn vị quản lý</span>;
                    }
                    const unit = orgUnits.find((item) => item.id === value);
                    return unit?.label ?? value;
                  }}
                >
                  <MenuItem value="">
                    <em>Chọn đơn vị quản lý</em>
                  </MenuItem>
                  {orgUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <TextField
                label="Mã ngành (tuỳ chọn)"
                value={form.majorId}
                onChange={(event) => updateForm('majorId', event.target.value)}
                helperText="Nhập ID ngành đào tạo nếu có"
                fullWidth
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Chuẩn đầu ra chương trình</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddOutcome}>
                Thêm chuẩn đầu ra
              </Button>
            </Stack>
            {form.outcomes.length === 0 && (
              <Alert severity="info">Chưa có chuẩn đầu ra nào. Thêm mới để mô tả PLO.</Alert>
            )}
            <Stack spacing={2}>
              {form.outcomes.map((outcome) => (
                <Paper key={outcome.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Select
                        value={outcome.category}
                        onChange={(event) => handleOutcomeChange(outcome.id, 'category', event.target.value)}
                        sx={{ minWidth: 160 }}
                      >
                        <MenuItem value="general">Chuẩn chung</MenuItem>
                        <MenuItem value="specific">Chuẩn cụ thể</MenuItem>
                      </Select>
                      <Box sx={{ flexGrow: 1 }}>
                        <TextField
                          value={outcome.label}
                          onChange={(event) => handleOutcomeChange(outcome.id, 'label', event.target.value)}
                          placeholder="Mô tả chuẩn đầu ra"
                          fullWidth
                        />
                      </Box>
                      <IconButton color="error" onClick={() => handleOutcomeRemove(outcome.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Khối học phần</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddBlock}>
                Thêm khối học phần
              </Button>
            </Stack>
            {form.blocks.length === 0 ? (
              <Alert severity="info">Chưa có khối học phần nào.</Alert>
            ) : (
              <Stack spacing={2}>
                {form.blocks.map((block) => (
                  <Paper key={block.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <TextField
                          label="Mã khối"
                          value={block.code}
                          onChange={(event) => handleBlockFieldChange(block.id, 'code', event.target.value)}
                          sx={{ minWidth: 160 }}
                        />
                        <TextField
                          label="Tên khối"
                          value={block.title}
                          onChange={(event) => handleBlockFieldChange(block.id, 'title', event.target.value)}
                          fullWidth
                        />
                        <Select
                          value={block.blockType}
                          onChange={(event) => handleBlockFieldChange(block.id, 'blockType', event.target.value as ProgramBlockType)}
                          sx={{ minWidth: 160 }}
                        >
                          {PROGRAM_BLOCK_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {getProgramBlockTypeLabel(type)}
                            </MenuItem>
                          ))}
                        </Select>
                        <TextField
                          label="Thứ tự"
                          type="number"
                          value={block.displayOrder}
                          onChange={(event) => handleBlockFieldChange(block.id, 'displayOrder', Number(event.target.value) || 1)}
                          sx={{ width: 120 }}
                          inputProps={{ min: 1 }}
                        />
                        <IconButton color="error" onClick={() => handleRemoveBlock(block.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>

                      {block.courses.length === 0 ? (
                        <Alert severity="info">Khối này chưa có học phần nào.</Alert>
                      ) : (
                        <Stack spacing={1.5}>
                          {/* Ungrouped courses section */}
                          {block.courses.filter((c) => !c.groupId).length === 0 ? (
                            <Alert severity="info">Tất cả học phần đã được gán vào các nhóm.</Alert>
                          ) : (
                            <Stack spacing={1.5}>
                              <Typography variant="subtitle2">Học phần chưa được gán nhóm</Typography>
                              {block.courses
                                .filter((c) => !c.groupId)
                                .map((course) => (
                                  <Paper key={course.id} variant="outlined" sx={{ p: 1.5 }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2">{course.courseCode} — {course.courseName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{course.credits} tín chỉ</Typography>
                                      </Box>
                                      <Select
                                        value={course.required ? 'required' : 'optional'}
                                        onChange={(event: SelectChangeEvent<string>) =>
                                          handleBlockCourseChange(block.id, course.id, 'required', event.target.value === 'required')
                                        }
                                        sx={{ minWidth: 140 }}
                                      >
                                        <MenuItem value="required">Bắt buộc</MenuItem>
                                        <MenuItem value="optional">Tự chọn</MenuItem>
                                      </Select>
                                      <TextField
                                        label="Thứ tự"
                                        type="number"
                                        value={course.displayOrder}
                                        onChange={(event) =>
                                          handleBlockCourseChange(block.id, course.id, 'displayOrder', Number(event.target.value) || 1)
                                        }
                                        sx={{ width: 120 }}
                                        inputProps={{ min: 1 }}
                                      />
                                      <IconButton color="error" onClick={() => handleRemoveCourseFromBlock(block.id, course.id)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    </Stack>
                                  </Paper>
                                ))}
                            </Stack>
                          )}
                        </Stack>
                      )}

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Autocomplete
                          value={blockCourseSelections[block.id] ?? null}
                          onChange={(_, option) => setBlockCourseSelections((prev) => ({ ...prev, [block.id]: option }))}
                          options={courseOptions}
                          getOptionLabel={(option) => option.label}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => <TextField {...params} label="Thêm học phần" placeholder="Chọn học phần" />}
                          sx={{ flexGrow: 1, minWidth: 240 }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => handleAddCourseToBlock(block.id)}
                          disabled={!blockCourseSelections[block.id] || courseOptions.length === 0}
                        >
                          Thêm học phần
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Block Groups Management aligned with edit page */}
          {form.blocks.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Nhóm khối học phần (Program Block Groups)</Typography>
                <Stack spacing={2}>
                  {form.blocks.map((block) => (
                    <Paper key={block.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight="medium">
                            {block.code || 'Chưa có mã khối'} — Nhóm học phần
                          </Typography>
                          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => handleAddGroupToBlock(block.id)}>
                            Thêm nhóm
                          </Button>
                        </Stack>

                        {(block.groups || []).length === 0 ? (
                          <Alert severity="info">Chưa có nhóm nào trong khối này.</Alert>
                        ) : (
                          <Stack spacing={2}>
                            {(block.groups || []).map((group) => (
                              <Paper key={group.id} variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                    <TextField label="Mã nhóm" value={group.code} onChange={(e) => handleGroupFieldChange(block.id, group.id, 'code', e.target.value)} sx={{ minWidth: 140 }} />
                                    <TextField label="Tên nhóm" value={group.title} onChange={(e) => handleGroupFieldChange(block.id, group.id, 'title', e.target.value)} fullWidth />
                                    <Select value={group.groupType} onChange={(e) => handleGroupFieldChange(block.id, group.id, 'groupType', e.target.value as ProgramBlockGroupType)} sx={{ minWidth: 140 }}>
                                      {PROGRAM_BLOCK_GROUP_TYPES.map((t) => (
                                        <MenuItem key={t} value={t}>{getProgramBlockGroupTypeLabel(t)}</MenuItem>
                                      ))}
                                    </Select>
                                    <TextField label="Thứ tự" type="number" value={group.displayOrder} onChange={(e) => handleGroupFieldChange(block.id, group.id, 'displayOrder', Number(e.target.value) || 1)} sx={{ width: 100 }} inputProps={{ min: 1 }} />
                                    <IconButton color="error" onClick={() => handleRemoveGroupFromBlock(block.id, group.id)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  </Stack>

                                  <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Typography variant="subtitle2">Quy tắc nhóm</Typography>
                                      <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => handleAddRuleToGroup(block.id, group.id)}>
                                        Thêm quy tắc
                                      </Button>
                                    </Stack>

                                    {(group.rules || []).length === 0 ? (
                                      <Alert severity="info" sx={{ py: 1 }}>Chưa có quy tắc nào.</Alert>
                                    ) : (
                                      <Stack spacing={1}>
                                        {(group.rules || []).map((rule) => (
                                          <Paper key={rule.id} variant="outlined" sx={{ p: 1.5 }}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                              <TextField label="Tín chỉ tối thiểu" type="number" value={rule.minCredits || ''} onChange={(e) => handleRuleFieldChange(block.id, group.id, rule.id, 'minCredits', e.target.value ? Number(e.target.value) : null)} sx={{ width: 140 }} inputProps={{ min: 0 }} />
                                              <TextField label="Tín chỉ tối đa" type="number" value={rule.maxCredits || ''} onChange={(e) => handleRuleFieldChange(block.id, group.id, rule.id, 'maxCredits', e.target.value ? Number(e.target.value) : null)} sx={{ width: 140 }} inputProps={{ min: 0 }} />
                                              <TextField label="Số học phần tối thiểu" type="number" value={rule.minCourses || ''} onChange={(e) => handleRuleFieldChange(block.id, group.id, rule.id, 'minCourses', e.target.value ? Number(e.target.value) : null)} sx={{ width: 160 }} inputProps={{ min: 0 }} />
                                              <TextField label="Số học phần tối đa" type="number" value={rule.maxCourses || ''} onChange={(e) => handleRuleFieldChange(block.id, group.id, rule.id, 'maxCourses', e.target.value ? Number(e.target.value) : null)} sx={{ width: 160 }} inputProps={{ min: 0 }} />
                                              <IconButton color="error" onClick={() => handleRemoveRuleFromGroup(block.id, group.id, rule.id)}>
                                                <DeleteIcon />
                                              </IconButton>
                                            </Stack>
                                          </Paper>
                                        ))}
                                      </Stack>
                                    )}
                                  </Stack>

                                  {/* Courses in group */}
                                  <Stack spacing={1}>
                                    <Typography variant="subtitle2">Học phần trong nhóm</Typography>
                                    <Stack spacing={1}>
                                      {block.courses.filter((c) => c.groupId === group.id).map((course) => (
                                        <Paper key={course.id} variant="outlined" sx={{ p: 1.5 }}>
                                          <Stack spacing={2}>
                                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                              <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>{course.courseCode} — {course.courseName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{course.credits} tín chỉ</Typography>
                                              </Box>
                                              <Button size="small" variant="outlined" onClick={() => handleBlockCourseChange(block.id, course.id, 'groupId', null)}>
                                                Gỡ khỏi nhóm
                                              </Button>
                                            </Stack>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                              <Select value={course.required ? 'required' : 'optional'} onChange={(e: SelectChangeEvent<string>) => handleBlockCourseChange(block.id, course.id, 'required', e.target.value === 'required')} sx={{ minWidth: 140 }}>
                                                <MenuItem value="required">Bắt buộc</MenuItem>
                                                <MenuItem value="optional">Tự chọn</MenuItem>
                                              </Select>
                                              <TextField label="Thứ tự" type="number" value={course.displayOrder} onChange={(e) => handleBlockCourseChange(block.id, course.id, 'displayOrder', Number(e.target.value) || 1)} sx={{ width: 120 }} inputProps={{ min: 1 }} />
                                              <IconButton color="error" onClick={() => handleRemoveCourseFromBlock(block.id, course.id)}>
                                                <DeleteIcon />
                                              </IconButton>
                                            </Stack>
                                          </Stack>
                                        </Paper>
                                      ))}
                                    </Stack>

                                    {/* Assign ungrouped courses */}
                                    {block.courses.filter((c) => !c.groupId).length > 0 && (
                                      <Stack spacing={1}>
                                        <Typography variant="caption" color="text.secondary">Gán học phần chưa thuộc nhóm:</Typography>
                                        {block.courses.filter((c) => !c.groupId).map((course) => (
                                          <Button key={course.id} size="small" variant="outlined" onClick={() => handleBlockCourseChange(block.id, course.id, 'groupId', group.id)} sx={{ justifyContent: 'flex-start' }}>
                                            {course.courseCode} — {course.courseName}
                                          </Button>
                                        ))}
                                      </Stack>
                                    )}
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          )}

          <Paper sx={{ p: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Học phần độc lập</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddStandaloneCourse}>
                Thêm học phần
              </Button>
            </Stack>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Autocomplete
                  value={standaloneCourseSelection}
                  onChange={(_, option) => setStandaloneCourseSelection(option)}
                  options={courseOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Chọn học phần" placeholder="Học phần" />}
                  sx={{ flexGrow: 1, minWidth: 240 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddStandaloneCourse}
                  disabled={!standaloneCourseSelection || courseOptions.length === 0}
                >
                  Thêm
                </Button>
              </Stack>

              {form.standaloneCourses.length === 0 ? (
                <Alert severity="info">Chưa có học phần độc lập nào.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {form.standaloneCourses.map((course) => (
                    <Paper key={course.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">{course.courseCode} — {course.courseName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.credits} tín chỉ
                          </Typography>
                        </Box>
                        <Select
                          value={course.required ? 'required' : 'optional'}
                          onChange={(event: SelectChangeEvent<string>) =>
                            handleStandaloneCourseChange(course.id, 'required', event.target.value === 'required')
                          }
                          sx={{ minWidth: 140 }}
                        >
                          <MenuItem value="required">Bắt buộc</MenuItem>
                          <MenuItem value="optional">Tự chọn</MenuItem>
                        </Select>
                        <TextField
                          label="Thứ tự"
                          type="number"
                          value={course.displayOrder}
                          onChange={(event) =>
                            handleStandaloneCourseChange(course.id, 'displayOrder', Number(event.target.value) || 1)
                          }
                          sx={{ width: 120 }}
                          inputProps={{ min: 1 }}
                        />
                        <IconButton color="error" onClick={() => handleRemoveStandaloneCourse(course.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thiết lập phê duyệt
            </Typography>
            <Stack spacing={2}>
              <Select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value as ProgramStatus)}
                fullWidth
              >
                {PROGRAM_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {getProgramStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Trạng thái hiện tại:
                </Typography>
                <Chip
                  label={getProgramStatusLabel(form.status)}
                  color={getProgramStatusColor(form.status)}
                  size="small"
                />
              </Stack>
              <TextField
                label="Hiệu lực từ"
                type="date"
                value={form.effectiveFrom}
                onChange={(event) => updateForm('effectiveFrom', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hiệu lực đến"
                type="date"
                value={form.effectiveTo}
                onChange={(event) => updateForm('effectiveTo', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Mã chương trình
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.code || '—'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tên chương trình
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ maxWidth: '55%', textAlign: 'right' }}>
                  {form.nameVi || '—'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tổng tín chỉ
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.totalCredits}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Chuẩn đầu ra
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.outcomes.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Số khối học phần
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.blocks.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tổng số học phần
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {totalCourses}
                </Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu chương trình'}
            </Button>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
}
