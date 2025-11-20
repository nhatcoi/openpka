-- Create table to store per-credit tuition for each program/major/year
CREATE TABLE IF NOT EXISTS finance.tuition_credit_rates (
    id              BIGSERIAL PRIMARY KEY,
    major_id        BIGINT      NOT NULL REFERENCES academic.majors(id),
    program_id      BIGINT          REFERENCES academic.programs(id),
    academic_year   VARCHAR(9)  NOT NULL,
    per_credit_fee  NUMERIC(12,0) NOT NULL CHECK (per_credit_fee > 0),
    currency        VARCHAR(3)  NOT NULL DEFAULT 'VND',
    effective_from  DATE        NOT NULL DEFAULT CURRENT_DATE,
    effective_to    DATE,
    status          VARCHAR(16) NOT NULL DEFAULT 'active',
    note            TEXT,
    created_by      BIGINT          REFERENCES auth.users(id),
    updated_by      BIGINT          REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_tuition_rates_major ON finance.tuition_credit_rates(major_id);
CREATE INDEX IF NOT EXISTS idx_fin_tuition_rates_program ON finance.tuition_credit_rates(program_id);
CREATE INDEX IF NOT EXISTS idx_fin_tuition_rates_year ON finance.tuition_credit_rates(academic_year);
CREATE INDEX IF NOT EXISTS idx_fin_tuition_rates_status ON finance.tuition_credit_rates(status);

-- Only one active tuition per program per academic year
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_tuition_rates_program_year_active
    ON finance.tuition_credit_rates(program_id, academic_year)
    WHERE status = 'active';

-- Fallback unique rule for majors without specific program
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_tuition_rates_major_year_active
    ON finance.tuition_credit_rates(major_id, academic_year)
    WHERE status = 'active' AND program_id IS NULL;

CREATE TRIGGER trg_fin_tuition_credit_rates_updated_at
    BEFORE UPDATE ON finance.tuition_credit_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit log for tuition changes
CREATE TABLE IF NOT EXISTS finance.tuition_rate_logs (
    id              BIGSERIAL PRIMARY KEY,
    tuition_rate_id BIGINT      NOT NULL REFERENCES finance.tuition_credit_rates(id) ON DELETE CASCADE,
    action          VARCHAR(20) NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    changed_by      BIGINT          REFERENCES auth.users(id),
    note            TEXT,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_tuition_rate_logs_rate ON finance.tuition_rate_logs(tuition_rate_id);
CREATE INDEX IF NOT EXISTS idx_fin_tuition_rate_logs_actor ON finance.tuition_rate_logs(changed_by);

-- View to expose computed minimum tuition per CTDT
CREATE OR REPLACE VIEW finance.program_min_tuition AS
SELECT
    tcr.id                 AS tuition_rate_id,
    tcr.program_id,
    tcr.major_id,
    tcr.academic_year,
    m.name_vi              AS major_name,
    p.name_vi              AS program_name,
    COALESCE(p.total_credits, m.total_credits_min) AS total_credits_min,
    tcr.per_credit_fee,
    COALESCE(p.total_credits, m.total_credits_min)::NUMERIC(12,0) * tcr.per_credit_fee AS min_tuition,
    tcr.currency
FROM finance.tuition_credit_rates tcr
JOIN academic.majors m ON m.id = tcr.major_id
LEFT JOIN academic.programs p ON p.id = tcr.program_id
WHERE tcr.status = 'active';

