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
  Checkbox,
  FormControlLabel,
  Breadcrumbs,
  Link,
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
  PROGRAM_BLOCK_TYPES,
  PROGRAM_BLOCK_GROUP_TYPES,
  PROGRAM_WORKFLOW_STATUS_OPTIONS,
  ProgramBlockType,
  ProgramBlockGroupType,
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
  getProgramBlockGroupTypeLabel,
} from '@/constants/programs';
import { API_ROUTES } from '@/constants/routes';
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

interface ProgramOption {
  id: string;
  code: string;
  nameVi: string;
  totalCredits: number;
}

export default function CreateProgramPage(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<ProgramFormState>(createDefaultProgramForm());
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [blockCourseSelections, setBlockCourseSelections] = useState<Record<string, CourseOption | null>>({});
  const [standaloneCourseSelection, setStandaloneCourseSelection] = useState<CourseOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [enableCopyStructure, setEnableCopyStructure] = useState(false);

  // Program code suggestions
  const programCodeSuggestions = [
    'CNTT-19', 'KTPM-19', 'KTMT-19', 'QTKD-19', 'KHDL-19', 'CNTP-19', 'CNÔT-19',
    'TCNH-19', 'MKT-19', 'KTE-19', 'LOG-19', 'DLNH-19', 'QTKS-19',
    'CNTT-20', 'KTPM-20', 'KTMT-20', 'QTKD-20', 'KHDL-20', 'CNTP-20', 'CNÔT-20',
    'TCNH-20', 'MKT-20', 'KTE-20', 'LOG-20', 'DLNH-20', 'QTKS-20'
  ];

  // PLO templates
  const ploTemplates = [
    "Có khả năng áp dụng kiến thức toán học, khoa học tự nhiên và kỹ thuật vào các vấn đề kỹ thuật phức tạp",
    "Có khả năng thiết kế và tiến hành thí nghiệm, phân tích và giải thích dữ liệu",
    "Có khả năng thiết kế hệ thống, thành phần hoặc quy trình đáp ứng các yêu cầu kỹ thuật cụ thể",
    "Có khả năng làm việc hiệu quả trong nhóm đa ngành để giải quyết vấn đề kỹ thuật",
    "Có khả năng xác định, xây dựng và giải quyết các vấn đề kỹ thuật phức tạp",
    "Có khả năng giao tiếp hiệu quả với các đối tượng khác nhau về các vấn đề kỹ thuật",
    "Có khả năng nhận biết và đánh giá tác động của các giải pháp kỹ thuật trong bối cảnh xã hội và môi trường",
    "Có khả năng học tập suốt đời và phát triển nghề nghiệp",
    "Có khả năng sử dụng các kỹ thuật, kỹ năng và công cụ kỹ thuật hiện đại cần thiết cho thực hành kỹ thuật",
    "Có khả năng áp dụng kiến thức về quản lý dự án, tài chính và kinh tế trong các dự án kỹ thuật",
    "Có khả năng phân tích và đánh giá rủi ro trong các dự án kỹ thuật",
    "Có khả năng thiết kế và triển khai các giải pháp bảo mật thông tin",
    "Có khả năng phát triển và triển khai các ứng dụng phần mềm",
    "Có khả năng quản lý và phân tích dữ liệu lớn",
    "Có khả năng thiết kế và triển khai các hệ thống mạng và bảo mật",
    "Có khả năng phát triển các ứng dụng di động và web",
    "Có khả năng làm việc với các công nghệ trí tuệ nhân tạo và machine learning",
    "Có khả năng thiết kế và triển khai các hệ thống IoT",
    "Có khả năng quản lý và tối ưu hóa cơ sở dữ liệu",
    "Có khả năng phát triển và triển khai các giải pháp cloud computing"
  ];

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
      const response = await fetch(API_ROUTES.TMS.FACULTIES);
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

  const fetchMajors = useCallback(async (orgUnitId?: string) => {
    try {
      const qs = new URLSearchParams();
      if (orgUnitId) qs.set('org_unit_id', orgUnitId);
      const response = await fetch(`${API_ROUTES.TMS.MAJORS}?${qs.toString()}`);
      const result = await response.json();
      
      if (response.ok && result?.success && Array.isArray(result.data?.items)) {
        setMajors(result.data.items.map((item: any) => ({
          id: item.id?.toString?.() ?? '',
          name_vi: item.name_vi,
          code: item.code,
          org_unit_id: item.org_unit_id?.toString?.() ?? (item.OrgUnit?.id?.toString?.() ?? ''),
        })));
      }
    } catch (err) {
      console.error('Failed to fetch majors', err);
    }
  }, []);

  const fetchCourseOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_ROUTES.TMS.COURSES}?list=true`);
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

  const fetchProgramOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_ROUTES.TMS.PROGRAMS}?page=1&limit=100`);
      const result = await response.json();

      if (response.ok && result?.success && Array.isArray(result.data?.items)) {
        const mapped: ProgramOption[] = result.data.items.map((item: any) => ({
          id: item.id?.toString() ?? '',
          code: item.code ?? '',
          nameVi: item.name_vi ?? '',
          totalCredits: Number(item.total_credits ?? 0),
        }));
        setProgramOptions(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch programs', err);
    }
  }, []);

  useEffect(() => {
    fetchOrgUnits();
    fetchCourseOptions();
    fetchProgramOptions();
  }, [fetchOrgUnits, fetchCourseOptions, fetchProgramOptions]);

  useEffect(() => {
    if (form.orgUnitId) {
      fetchMajors(form.orgUnitId);
    } else {
      setMajors([]);
      setForm((prev) => ({ ...prev, majorId: '' }));
    }
  }, [form.orgUnitId, fetchMajors]);

  // Đồng bộ ngành theo đơn vị: nếu ngành hiện tại không thuộc đơn vị được chọn thì xóa chọn ngành
  useEffect(() => {
    if (!form.orgUnitId) return;
    const ok = majors.some((m: any) => m.id === form.majorId && m.org_unit_id === form.orgUnitId);
    if (!ok && form.majorId) {
      setForm((prev) => ({ ...prev, majorId: '' }));
    }
  }, [form.orgUnitId, form.majorId, majors]);

  // Prefill 5 default blocks with heuristic course assignments
  useEffect(() => {
    if (form.blocks.length > 0) return;
    if (courseOptions.length === 0) return;

    // Categorize courses heuristically by code/name
    const toLowerNoAccents = (s: string) => s.toLowerCase();
    const hasAny = (text: string, keywords: string[]) => keywords.some(k => toLowerNoAccents(text).includes(k));

    const categories: Record<string, CourseOption[]> = {
      GENERAL: [],
      FOUNDATION: [],
      SUPPORT: [],
      MAJOR: [],
      CAPSTONE: [],
    };

    const generalKw = ['đại cương', 'triết', 'pháp luật', 'tư tưởng', 'giáo dục thể chất', 'anh', 'english', 'gen'];
    const foundationKw = ['cơ sở', 'toán', 'xác suất', 'thống kê', 'linear', 'giải tích', 'foundation'];
    const supportKw = ['bổ trợ', 'kỹ năng', 'kỹ năng mềm', 'nhập môn', 'cơ bản', 'intro', 'fundamentals'];
    const majorKw = ['chuyên ngành', 'nâng cao', 'chuyên sâu', 'major', 'core'];
    const capstoneKw = ['đồ án', 'khóa luận', 'thực tập', 'intern', 'thesis', 'capstone'];

    courseOptions.forEach((c) => {
      const text = `${c.code} ${c.name}`;
      if (hasAny(text, capstoneKw)) {
        categories.CAPSTONE.push(c);
      } else if (hasAny(text, generalKw)) {
        categories.GENERAL.push(c);
      } else if (hasAny(text, foundationKw)) {
        categories.FOUNDATION.push(c);
      } else if (hasAny(text, majorKw)) {
        categories.MAJOR.push(c);
      } else if (hasAny(text, supportKw)) {
        categories.SUPPORT.push(c);
      } else {
        // fallback sprinkle into SUPPORT/MAJOR
        (categories.SUPPORT.length <= categories.MAJOR.length ? categories.SUPPORT : categories.MAJOR).push(c);
      }
    });

    const pick = (arr: CourseOption[], n: number) => arr.slice(0, n);

    const defs: Array<{ code: string; title: string; blockType: ProgramBlockType; pickFrom: CourseOption[]; requiredCount: number }> = [
      { code: 'GEN', title: 'Khối kiến thức giáo dục đại cương', blockType: 'GENERAL' as ProgramBlockType, pickFrom: pick(categories.GENERAL, 6), requiredCount: 3 },
      { code: 'FND', title: 'Khối kiến thức cơ sở ngành', blockType: 'FOUNDATION' as ProgramBlockType, pickFrom: pick(categories.FOUNDATION, 6), requiredCount: 3 },
      { code: 'SUP', title: 'Khối kiến thức bổ trợ', blockType: 'ELECTIVE' as ProgramBlockType, pickFrom: pick(categories.SUPPORT, 6), requiredCount: 2 },
      { code: 'MAJ', title: 'Khối kiến thức chuyên ngành', blockType: 'MAJOR' as ProgramBlockType, pickFrom: pick(categories.MAJOR, 6), requiredCount: 4 },
      { code: 'CAP', title: 'Thực tập, Đồ án/Khóa luận tốt nghiệp', blockType: 'THESIS' as ProgramBlockType, pickFrom: pick(categories.CAPSTONE, 3), requiredCount: 1 },
    ];

    const blocks: ProgramBlockFormItem[] = defs.map((d, idx) => {
      const courses: ProgramCourseFormItem[] = d.pickFrom.map((c, i) => ({
        id: createEmptyCourse().id,
        courseId: c.id,
        courseCode: c.code,
        courseName: c.name,
        credits: c.credits,
        required: i < d.requiredCount,
        displayOrder: i + 1,
        groupId: null,
      }));

      return {
        ...createEmptyBlock(),
        code: d.code,
        title: d.title,
        blockType: d.blockType,
        displayOrder: idx + 1,
        courses,
        groups: [],
      };
    });

    setForm((prev) => ({ ...prev, blocks }));
  }, [courseOptions, form.blocks.length]);

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

  const handleAddOutcomeFromTemplate = (template: string) => {
    const newOutcome = {
      ...createEmptyOutcome(),
      label: template,
    };
    setForm((prev) => ({ ...prev, outcomes: [...prev.outcomes, newOutcome] }));
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

    // Validate copy structure option
    if (enableCopyStructure && !form.copyFromProgramId) {
      setError('Vui lòng chọn chương trình đào tạo để sao chép cấu trúc.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = buildProgramPayloadFromForm(form, false);

      const response = await fetch(API_ROUTES.TMS.PROGRAMS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const msg = (result && (result.details || result.error)) || 'Không thể tạo chương trình';
        throw new Error(msg);
      }

      const programId = result?.data?.id;
      
      if (!programId) {
        throw new Error('Không nhận được ID chương trình sau khi tạo');
      }

      // Apply default framework if requested
      if (form.applyDefaultFramework) {
        const frameworkResponse = await fetch(API_ROUTES.TMS.PROGRAMS_APPLY_FRAMEWORK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_id: Number(programId) }),
        });
        
        if (!frameworkResponse.ok) {
          const frameworkResult = await frameworkResponse.json();
          throw new Error(frameworkResult.error || 'Không thể áp dụng khung chuẩn');
        }
      }

      // Copy structure from another program if requested
      if (enableCopyStructure && form.copyFromProgramId) {
        const copyResponse = await fetch(API_ROUTES.TMS.PROGRAMS_COPY_STRUCTURE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_program_id: Number(form.copyFromProgramId),
            target_program_id: Number(programId),
          }),
        });
        
        if (!copyResponse.ok) {
          const copyResult = await copyResponse.json();
          throw new Error(copyResult.error || 'Không thể sao chép cấu trúc CTĐT');
        }
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
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/tms"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          TMS
        </Link>
        <Link
          color="inherit"
          href="/tms/programs"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Chương trình đào tạo
        </Link>
        <Typography color="text.primary">Tạo mới</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Quay lại
          </Button>
          <Typography variant="h4" component="h1">
            Tạo chương trình đào tạo mới
          </Typography>
        </Stack>
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
                 <Autocomplete
                   freeSolo
                   options={programCodeSuggestions}
                   value={form.code}
                   onInputChange={(_, newValue) => updateForm('code', newValue.toUpperCase())}
                   renderInput={(params) => (
                     <TextField
                       {...params}
                       label="Mã chương trình *"
                       required
                       fullWidth
                     />
                   )}
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
               <Select
                 value={form.majorId}
                 onChange={(event) => updateForm('majorId', event.target.value)}
                 displayEmpty
                 fullWidth
                 renderValue={(value) => {
                   if (!value) {
                     return <span style={{ color: '#9e9e9e' }}>Chọn ngành đào tạo (lọc theo đơn vị)</span>;
                   }
                   const major = majors.find((item: any) => item.id === value);
                   return major ? `${major.code} - ${major.name_vi}` : value;
                 }}
                 disabled={!form.orgUnitId}
               >
                 <MenuItem value="">
                   <em>Chọn ngành đào tạo (tùy chọn)</em>
                 </MenuItem>
                 {majors
                   .filter((m: any) => !form.orgUnitId || m.org_unit_id === form.orgUnitId)
                   .map((major: any) => (
                     <MenuItem key={major.id} value={major.id}>
                       {major.code} - {major.name_vi}
                     </MenuItem>
                   ))}
               </Select>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.applyDefaultFramework}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        setEnableCopyStructure(false);
                        updateForm('copyFromProgramId', '');
                      }
                      updateForm('applyDefaultFramework', e.target.checked);
                    }}
                  />
                }
                label="Áp dụng khung chuẩn"
              />
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={enableCopyStructure}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEnableCopyStructure(e.target.checked);
                        if (e.target.checked) {
                          updateForm('applyDefaultFramework', false);
                        } else {
                          updateForm('copyFromProgramId', '');
                        }
                      }}
                    />
                  }
                  label="Sao chép cấu trúc CTĐT"
                />
                {enableCopyStructure && (
                  <Select
                    value={form.copyFromProgramId || ''}
                    onChange={(event) => updateForm('copyFromProgramId', event.target.value)}
                    displayEmpty
                    fullWidth
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#9e9e9e' }}>Chọn chương trình đào tạo để sao chép</span>;
                      }
                      const program = programOptions.find((p) => p.id === value);
                      return program ? `${program.code} - ${program.nameVi} (${program.totalCredits} TC)` : value;
                    }}
                  >
                    <MenuItem value="">
                      <em>Chọn chương trình đào tạo</em>
                    </MenuItem>
                    {programOptions.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.code} - {program.nameVi} ({program.totalCredits} TC)
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Stack>
            </Stack>
          </Paper>

           <Paper sx={{ p: 3, mt: 3 }}>
             <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
               <Typography variant="h6">Chuẩn đầu ra chương trình</Typography>
               <Button startIcon={<AddIcon />} onClick={handleAddOutcome}>
                 Thêm chuẩn đầu ra
               </Button>
             </Stack>
             
             {/* PLO Templates */}
             <Box sx={{ mb: 3 }}>
               <Typography variant="subtitle2" gutterBottom>
                 Mẫu chuẩn đầu ra có sẵn:
               </Typography>
               <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                 {ploTemplates.slice(0, 10).map((template, index) => (
                   <Chip
                     key={index}
                     label={`PLO ${index + 1}`}
                     onClick={() => handleAddOutcomeFromTemplate(template)}
                     variant="outlined"
                     size="small"
                     sx={{ mb: 1 }}
                   />
                 ))}
               </Stack>
               <Button
                 size="small"
                 onClick={() => {
                   // Add all remaining templates
                   ploTemplates.slice(10).forEach(template => {
                     handleAddOutcomeFromTemplate(template);
                   });
                 }}
                 sx={{ mt: 1 }}
               >
                 Thêm tất cả mẫu
               </Button>
             </Box>
             
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
                           multiline
                           rows={1}
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
{/* 
          <Paper sx={{ p: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Xây dựng Khung chương trình đào tạo</Typography>
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
*/}

          {/* Simplified model: hide group/rule management */}

          {/* <Paper sx={{ p: 3, mt: 3 }}>
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
          </Paper> */}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trạng thái (quản lý)
            </Typography>
            <Stack spacing={2}>
              <Select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value as string)}
                fullWidth
              >
                {PROGRAM_WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
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
