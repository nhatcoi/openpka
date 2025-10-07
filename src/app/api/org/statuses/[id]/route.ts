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

    return db.orgUnitStatus.update({
        where: {id: BigInt(id)},
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
      return db.orgUnitStatus.update({
          where: {id: BigInt(id)},
          data: {is_active: false}
      });
  },
  'delete org status'
);
