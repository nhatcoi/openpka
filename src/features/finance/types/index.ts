export interface TuitionFeeRate {
  id: string;
  program_id: string;
  academic_year: string;
  per_credit_fee: number;
  currency?: string;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  Program?: {
    id: string;
    code: string;
    name: string;
  } | null;
}
