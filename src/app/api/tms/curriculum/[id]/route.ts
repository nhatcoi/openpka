import { withIdParam } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { selectProgramDetail } from '@/lib/api/selects/program';
import { ProgramPriority } from '@/constants/programs';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { CurriculumStatus, normalizeCurriculumStatus } from '@/constants/curriculum';
import { parseCurriculumStructure } from '@/lib/curriculum/structure';

const CONTEXT = 'get curriculum detail';

export const GET = withIdParam(async (id: string) => {
  const programId = Number(id);
  if (Number.isNaN(programId)) {
    throw new Error('Invalid program id');
  }

  const program = await db.program.findUnique({
    where: { id: BigInt(programId) },
    select: {
      ...selectProgramDetail,
      curriculum_versions: {
        select: {
          id: true,
          version: true,
          title: true,
          description: true,
          status: true,
          effective_from: true,
          effective_to: true,
          total_credits: true,
          curriculum_structure: true,
          approval_notes: true,
          approved_by: true,
          approved_at: true,
          created_by: true,
          created_at: true,
        },
        orderBy: [
          { effective_from: 'desc' },
          { created_at: 'desc' },
        ],
      },
    },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  const { curriculum_versions: curriculumVersions = [], ...programFields } = program;

  const programPayload = {
    ...programFields,
    status: (programFields.status ?? WorkflowStatus.DRAFT) as string,
    stats: {
      student_count: programFields._count?.StudentAcademicProgress ?? 0,
      block_count: programFields._count?.ProgramBlock ?? 0,
      course_count: programFields._count?.ProgramCourseMap ?? 0,
    },
    priority: ProgramPriority.MEDIUM,
  };

  const versions = curriculumVersions.map((version) => {
    const normalizedStatus = normalizeCurriculumStatus(version.status ?? CurriculumStatus.DRAFT);
    return {
      id: version.id.toString(),
      version: version.version,
      title: version.title,
      description: version.description ?? null,
      status: normalizedStatus,
      effectiveFrom: version.effective_from ?? null,
      effectiveTo: version.effective_to ?? null,
      totalCredits: version.total_credits ?? programFields.total_credits ?? 0,
      approvalNotes: version.approval_notes ?? null,
      approvedBy: version.approved_by ? version.approved_by.toString() : null,
      approvedAt: version.approved_at ?? null,
      createdBy: version.created_by ? version.created_by.toString() : null,
      createdAt: version.created_at ?? null,
      structure: parseCurriculumStructure(version.curriculum_structure),
    };
  });

  const activeVersion =
    versions.find((version) =>
      version.status === CurriculumStatus.APPROVED || version.status === CurriculumStatus.PUBLISHED,
    ) || versions[0] || null;

  return {
    program: programPayload,
    versions,
    stats: {
      versionCount: versions.length,
      activeVersionId: activeVersion ? activeVersion.id : null,
    },
  };
}, CONTEXT);
