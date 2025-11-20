import {db} from '@/lib/db';
import {validateSchema, withIdAndBody, withIdParam} from '@/lib/api/api-handler';
import {Schemas} from '@/lib/api/api-schemas';

export const GET = withIdParam(
  async (id: string) => {
    const status = await db.orgUnitStatus.findUnique({
      where: { id: BigInt(id) }
    });

    if (!status) {
      throw new Error('Status not found');
    }

    return status;
  },
  'fetch org status'
);

export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    const validatedData = validateSchema(Schemas.OrgStatus.Update, body);
    const { code, name, description, color, workflow_step, is_active } = validatedData;

    const statusId = BigInt(id);

    // Check if status exists
    const existingStatus = await db.orgUnitStatus.findUnique({
      where: { id: statusId }
    });

    if (!existingStatus) {
      throw new Error('Status not found');
    }

    // Check for duplicate code if code is being updated
    if (code) {
      const codeUpper = code.toUpperCase();
      if (codeUpper !== existingStatus.code) {
        const existingByCode = await db.orgUnitStatus.findUnique({
          where: { code: codeUpper }
        });

        if (existingByCode) {
          throw new Error(`Mã trạng thái "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (name) {
      if (name !== existingStatus.name) {
        const existingByName = await db.orgUnitStatus.findFirst({
          where: { name }
        });

        if (existingByName) {
          throw new Error(`Tên trạng thái "${name}" đã tồn tại, vui lòng nhập tên khác.`);
        }
      }
    }

    return db.orgUnitStatus.update({
        where: {id: statusId},
        data: {
            ...(code && {code: code.toUpperCase()}),
            ...(name && {name}),
            ...(description !== undefined && {description}),
            ...(color && {color}),
            ...(workflow_step !== undefined && {workflow_step}),
            ...(is_active !== undefined && {is_active})
        }
    });
  },
  'update org status'
);

export const DELETE = withIdParam(
  async (id: string) => {
    const statusId = BigInt(id);

    // Check if status exists
    const existingStatus = await db.orgUnitStatus.findUnique({
      where: { id: statusId }
    });

    if (!existingStatus) {
      throw new Error('Status not found');
    }

    // Check if status is being used by any org units
    const unitsUsingStatus = await db.orgUnit.count({
      where: { status: existingStatus.code }
    });

    if (unitsUsingStatus > 0) {
      throw new Error(`Không thể xóa trạng thái vì đang được sử dụng bởi ${unitsUsingStatus} đơn vị. Vui lòng xử lý các đơn vị này trước.`);
    }

    // Soft delete (set is_active to false)
    return db.orgUnitStatus.update({
        where: {id: statusId},
        data: {is_active: false}
    });
  },
  'delete org status'
);
