import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
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

// Helper function to validate version ID
const validateVersionId = (id: string): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new Error('Invalid version ID');
  }
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

// GET /api/tms/courses/[id]/versions/[versionId] - Get specific version
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.view');

    const resolvedParams = await params;
    const courseId = validateCourseId(resolvedParams.id);
    const versionId = validateVersionId(resolvedParams.versionId);

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: BigInt(courseId) },
      select: { id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Get version
    const version = await db.courseVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Verify version belongs to this course
    if (version.course_id.toString() !== courseId.toString()) {
      throw new Error('Version does not belong to this course');
    }

    return { version: serializeVersion(version) };
  },
  'fetch version'
);

// PUT /api/tms/courses/[id]/versions/[versionId] - Update version
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const resolvedParams = await params;
    const courseId = validateCourseId(resolvedParams.id);
    const versionId = validateVersionId(resolvedParams.versionId);

    const body = await request.json();

    const versionData = body as {
      version?: string;
      status?: string;
      effective_from?: string;
      effective_to?: string;
    };

    const result = await db.$transaction(async (tx) => {
      // Verify course exists
      const course = await tx.course.findUnique({
        where: { id: BigInt(courseId) },
        select: { id: true },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get existing version
      const existingVersion = await tx.courseVersion.findUnique({
        where: { id: versionId },
      });

      if (!existingVersion) {
        throw new Error('Version not found');
      }

      // Verify version belongs to this course
      if (existingVersion.course_id.toString() !== courseId.toString()) {
        throw new Error('Version does not belong to this course');
      }

      // Check if new version number conflicts with existing version
      if (versionData.version && versionData.version !== existingVersion.version) {
        const conflictingVersion = await tx.courseVersion.findUnique({
          where: {
            course_id_version: {
              course_id: BigInt(courseId),
              version: versionData.version,
            },
          },
        });

        if (conflictingVersion && conflictingVersion.id.toString() !== versionId.toString()) {
          throw new Error(`Version ${versionData.version} already exists for this course`);
        }
      }

      // Build update data
      const updateData: any = {
        updated_at: new Date(),
      };

      if (versionData.version !== undefined) updateData.version = versionData.version;
      if (versionData.status !== undefined) updateData.status = versionData.status;
      if (versionData.effective_from !== undefined) {
        updateData.effective_from = versionData.effective_from ? new Date(versionData.effective_from) : null;
      }
      if (versionData.effective_to !== undefined) {
        updateData.effective_to = versionData.effective_to ? new Date(versionData.effective_to) : null;
      }

      // Update version
      const updatedVersion = await tx.courseVersion.update({
        where: { id: versionId },
        data: updateData,
      });

      return serializeVersion(updatedVersion);
    });

    return createSuccessResponse({ version: result });
  },
  'update version'
);

// DELETE /api/tms/courses/[id]/versions/[versionId] - Delete version
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.delete');

    const resolvedParams = await params;
    const courseId = validateCourseId(resolvedParams.id);
    const versionId = validateVersionId(resolvedParams.versionId);

    await db.$transaction(async (tx) => {
      // Verify course exists
      const course = await tx.course.findUnique({
        where: { id: BigInt(courseId) },
        select: { id: true },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get existing version
      const existingVersion = await tx.courseVersion.findUnique({
        where: { id: versionId },
        select: { course_id: true },
      });

      if (!existingVersion) {
        throw new Error('Version not found');
      }

      // Verify version belongs to this course
      if (existingVersion.course_id.toString() !== courseId.toString()) {
        throw new Error('Version does not belong to this course');
      }

      // Check if version has associated syllabus or class sections
      const [syllabusCount, classSectionCount] = await Promise.all([
        tx.courseSyllabus.count({
          where: { course_version_id: versionId },
        }),
        tx.classSection.count({
          where: { course_version_id: versionId },
        }),
      ]);

      if (syllabusCount > 0 || classSectionCount > 0) {
        throw new Error('Cannot delete version with associated syllabus or class sections');
      }

      // Delete version
      await tx.courseVersion.delete({
        where: { id: versionId },
      });
    });

    return createSuccessResponse({ message: 'Version deleted successfully' });
  },
  'delete version'
);

