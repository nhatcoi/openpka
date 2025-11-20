import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withIdAndBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { WorkflowStatus } from '@/constants/workflow-statuses';

// POST /api/tms/courses/[id]/versions - Create new version
export const POST = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      throw new Error('Invalid course ID');
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: BigInt(courseId) },
      select: { id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const result = await db.$transaction(async (tx) => {
      // Find latest version to increment
      const latestVersion = await tx.courseVersion.findFirst({
        where: { course_id: BigInt(courseId) },
        orderBy: { created_at: 'desc' },
        select: { version: true },
      });

      // Calculate next version number
      let nextVersion = '1';
      if (latestVersion) {
        const currentVersionNum = parseInt(latestVersion.version) || 0;
        nextVersion = String(currentVersionNum + 1);
      }

      // Create new version
      const newVersion = await tx.courseVersion.create({
        data: {
          course_id: BigInt(courseId),
          version: nextVersion,
          status: WorkflowStatus.DRAFT,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Optionally copy syllabus from latest version
      if (latestVersion) {
        const latestVersionFull = await tx.courseVersion.findFirst({
          where: { course_id: BigInt(courseId) },
          orderBy: { created_at: 'desc' },
          include: {
            CourseSyllabus: {
              select: {
                syllabus_data: true,
              },
            },
          },
        });

        if (latestVersionFull?.CourseSyllabus && latestVersionFull.CourseSyllabus.length > 0) {
          const latestSyllabus = latestVersionFull.CourseSyllabus[0];
          if (latestSyllabus.syllabus_data) {
            await tx.courseSyllabus.create({
              data: {
                course_version_id: newVersion.id,
                syllabus_data: latestSyllabus.syllabus_data,
                created_by: BigInt(session.user.id),
                created_at: new Date(),
              },
            });
          }
        }
      }

      return {
        id: newVersion.id.toString(),
        version: newVersion.version,
        status: newVersion.status,
        created_at: newVersion.created_at,
      };
    });

    return createSuccessResponse(result);
  },
  'create version'
);

