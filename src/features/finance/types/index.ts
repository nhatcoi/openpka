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

export type ProgramOption = {
  id: string;
  code: string | null;
  name_vi: string | null;
  name_en: string | null;
  total_credits: number | null;
  status: string;
};

export type TuitionRate = {
  id: string;
  academicYear: string;
  perCreditFee: number;
  currency: string;
  totalCredits: number;
  minTuition: number;
  updatedAt: string;
  major: { id: string; name: string };
  program: { id: string | null; name: string | null } | null;
};

export type MinTuitionRow = {
  tuitionRateId: string;
  academicYear: string;
  majorId: string;
  majorName: string | null;
  programId: string | null;
  programName: string | null;
  totalCreditsMin: number | null;
  perCreditFee: number;
  minTuition: number;
  currency: string;
};

export type ToastState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

