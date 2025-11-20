import {db} from '@/lib/db';
import {validateSchema, withBody, withErrorHandling} from '@/lib/api/api-handler';
import {Schemas} from '@/lib/api/api-schemas';

export const GET = withErrorHandling(
  async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const whereClause = includeInactive ? {} : { is_active: true };

    const statuses = await db.orgUnitStatus.findMany({
      where: whereClause,
      orderBy: [
        { workflow_step: 'asc' },
        { name: 'asc' }
      ]
    });

    return statuses;
  },
  'fetch org statuses'
);

export const POST = withBody(
  async (body: unknown) => {
    const validatedData = validateSchema(Schemas.OrgStatus.Create, body);
    const { code, name, description, color, workflow_step } = validatedData;

    const codeUpper = code.toUpperCase();

    // Check for duplicate code
    const existingByCode = await db.orgUnitStatus.findUnique({
      where: { code: codeUpper }
    });

    if (existingByCode) {
      throw new Error(`Mã trạng thái "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
    }

    // Check for duplicate name
    const existingByName = await db.orgUnitStatus.findFirst({
      where: { name }
    });

    if (existingByName) {
      throw new Error(`Tên trạng thái "${name}" đã tồn tại, vui lòng nhập tên khác.`);
    }

    return db.orgUnitStatus.create({
        data: {
            code: codeUpper,
            name,
            description: description || null,
            color: color || '#757575',
            workflow_step: workflow_step || 0,
            is_active: true
        }
    });
  },
  'create org status'
);