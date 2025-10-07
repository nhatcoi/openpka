import { z } from 'zod';

/*
* validate với zod
*/

const AssignmentCreate = z.object({
  employee_id: z.string().min(1),
  org_unit_id: z.string().min(1),
  job_position_id: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  assignment_type: z.enum(['admin', 'academic', 'support', 'management']).default('admin'),
  is_primary: z.boolean().default(true),
  allocation: z.number().min(0).max(1).default(1.0),
});

const OrgStatusCreate = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  workflow_step: z.number().optional(),
  is_active: z.boolean().default(true),
});

const HistoryCreate = z.object({
  org_unit_id: z.string().min(1),
  old_name: z.string().optional(),
  new_name: z.string().optional(),
  change_type: z.string().min(1),
  details: z.string().optional(),
});

// Export
export const Schemas = {
  Assignment: {
    Create: AssignmentCreate,
    Update: AssignmentCreate.partial(),
  },
  OrgStatus: {
    Create: OrgStatusCreate,
    Update: OrgStatusCreate.partial(),
  },
  History: {
    Create: HistoryCreate,
  },
};
