import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdAndBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { WorkflowStatus } from '@/constants/workflow-statuses';

// Helper function to validate course ID
const validateCourseId = (id: string): number => {
  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('Invalid course ID');
  }
  return courseId;
};

// Helper function to serialize version for JSON response
const serializeVersion = (v: any) => ({
  id: v.id.toString(),
  course_id: v.course_id.toString(),
  version: v.version,
  status: v.status,
  effective_from: v.effective_from,
  effective_to: v.effective_to,
  created_at: v.created_at,
  updated_at: v.updated_at,
});

// GET /api/tms/courses/[id]/versions - Get all versions for a course
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.view');

    const resolvedParams = await params;
    const courseId = validateCourseId(resolvedParams.id);

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: BigInt(courseId) },
      select: { id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      course_id: BigInt(courseId),
    };

    if (status) {
      where.status = status;
    }

    const versions = await db.courseVersion.findMany({
      where,
      orderBy: [
        { created_at: 'desc' },
      ],
    });

    return { versions: versions.map(serializeVersion) };
  },
  'fetch versions'
);

// POST /api/tms/courses/[id]/versions - Create new version
export const POST = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = validateCourseId(id);

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: BigInt(courseId) },
      select: { id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const versionData = body as {
      version?: string;
      status?: string;
      effective_from?: string;
      effective_to?: string;
    };

    const result = await db.$transaction(async (tx) => {
      // Find latest version to increment if version not provided
      let nextVersion = versionData.version;
      if (!nextVersion) {
        const latestVersion = await tx.courseVersion.findFirst({
          where: { course_id: BigInt(courseId) },
          orderBy: { created_at: 'desc' },
          select: { version: true },
        });

        if (latestVersion) {
          const currentVersionNum = parseInt(latestVersion.version) || 0;
          nextVersion = String(currentVersionNum + 1);
        } else {
          nextVersion = '1';
        }
      }

      // Check if version already exists
      const existingVersion = await tx.courseVersion.findUnique({
        where: {
          course_id_version: {
            course_id: BigInt(courseId),
            version: nextVersion,
          },
        },
      });

      if (existingVersion) {
        throw new Error(`Version ${nextVersion} already exists for this course`);
      }

      // Create new version
      const newVersion = await tx.courseVersion.create({
        data: {
          course_id: BigInt(courseId),
          version: nextVersion,
          status: versionData.status || WorkflowStatus.DRAFT,
          effective_from: versionData.effective_from ? new Date(versionData.effective_from) : null,
          effective_to: versionData.effective_to ? new Date(versionData.effective_to) : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return serializeVersion(newVersion);
    });

    return createSuccessResponse({ version: result });
  },
  'create version'
);

