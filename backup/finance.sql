-- -------------------------------------------------------------
-- TablePlus 6.7.0(634)
--
-- https://tableplus.com/
--
-- Database: training_system
-- Generation Time: 2025-11-20 14:07:53.1100
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "finance"."tuition_rules";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS finance.tuition_rule_id_seq;

-- Table Definition
CREATE TABLE "finance"."tuition_rules" (
    "id" int4 NOT NULL DEFAULT nextval('finance.tuition_rule_id_seq'::regclass),
    "scope" varchar(1) CHECK ((scope)::text = ANY ((ARRAY['U'::character varying, 'S'::character varying])::text[])),
    "program_id" int4,
    "per_credit_fee" numeric(10,2) NOT NULL,
    "misc_fee" numeric(10,2) DEFAULT 0,
    "effective_from" date NOT NULL,
    "effective_to" date,
    "status" varchar(20) DEFAULT 'active'::character varying,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "finance"."invoices";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS finance.invoice_id_seq;

-- Table Definition
CREATE TABLE "finance"."invoices" (
    "id" int4 NOT NULL DEFAULT nextval('finance.invoice_id_seq'::regclass),
    "student_id" int4 NOT NULL,
    "term_id" int4 NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "due_date" date NOT NULL,
    "status" varchar(20) DEFAULT 'pending'::character varying CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[])),
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "finance"."tuition_credit_rates";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS finance.tuition_credit_rates_id_seq;

-- Table Definition
CREATE TABLE "finance"."tuition_credit_rates" (
    "id" int8 NOT NULL DEFAULT nextval('finance.tuition_credit_rates_id_seq'::regclass),
    "program_id" int8 NOT NULL,
    "major_id" int8 NOT NULL,
    "academic_year" varchar(9) NOT NULL,
    "per_credit_fee" numeric(12,2) NOT NULL CHECK (per_credit_fee > (0)::numeric),
    "currency" varchar(10) NOT NULL DEFAULT 'VND'::character varying,
    "status" varchar(16) NOT NULL DEFAULT 'active'::character varying,
    "note" text,
    "effective_from" date NOT NULL DEFAULT CURRENT_DATE,
    "effective_to" date,
    "created_by" int8,
    "updated_by" int8,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "finance"."tuition_rate_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS finance.tuition_rate_logs_id_seq;

-- Table Definition
CREATE TABLE "finance"."tuition_rate_logs" (
    "id" int8 NOT NULL DEFAULT nextval('finance.tuition_rate_logs_id_seq'::regclass),
    "tuition_rate_id" int8 NOT NULL,
    "action" varchar(32) NOT NULL,
    "old_value" jsonb,
    "new_value" jsonb,
    "note" text,
    "changed_by" int8,
    "changed_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

INSERT INTO "finance"."tuition_credit_rates" ("id", "program_id", "major_id", "academic_year", "per_credit_fee", "currency", "status", "note", "effective_from", "effective_to", "created_by", "updated_by", "created_at", "updated_at") VALUES
(1, 220, 4, '2025-2026', 1000000.00, 'VND', 'archived', '1000000', '2025-11-19', NULL, 1, 1, '2025-11-19 14:33:13.624+00', '2025-11-19 14:35:18.755668+00'),
(2, 220, 4, '2024-2025', 900000.00, 'VND', 'active', '900000', '2025-11-19', NULL, 1, 1, '2025-11-19 14:34:29.165+00', '2025-11-19 14:34:29.165+00'),
(3, 220, 4, '2023-2024', 800000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:34:50.489+00', '2025-11-19 14:34:50.489+00'),
(4, 220, 4, '2025-2026', 1100000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:35:14.715+00', '2025-11-19 14:35:14.715+00'),
(5, 117, 4, '2025-2026', 1300000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:36:42.472+00', '2025-11-19 14:36:42.472+00'),
(6, 117, 4, '2024-2025', 900000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:37:05.221+00', '2025-11-19 14:37:05.221+00'),
(7, 117, 4, '2023-2024', 800000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:37:15.136+00', '2025-11-19 14:37:15.136+00'),
(8, 117, 4, '2022-2023', 700000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:37:23.067+00', '2025-11-19 14:37:23.067+00'),
(9, 117, 4, '2021-2022', 600000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:37:32.635+00', '2025-11-19 14:37:32.635+00'),
(10, 117, 4, '2020-2021', 500000.00, 'VND', 'active', NULL, '2025-11-19', NULL, 1, 1, '2025-11-19 14:37:46.651+00', '2025-11-19 14:37:46.651+00');

INSERT INTO "finance"."tuition_rate_logs" ("id", "tuition_rate_id", "action", "old_value", "new_value", "note", "changed_by", "changed_at") VALUES
(1, 1, 'CREATE', NULL, '{"id": "1", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2025-2026", "per_credit_fee": "1000000"}', '1000000', 1, '2025-11-19 14:33:13.64+00'),
(2, 2, 'CREATE', NULL, '{"id": "2", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2024-2025", "per_credit_fee": "900000"}', '900000', 1, '2025-11-19 14:34:29.182+00'),
(3, 3, 'CREATE', NULL, '{"id": "3", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2023-2024", "per_credit_fee": "800000"}', NULL, 1, '2025-11-19 14:34:50.506+00'),
(4, 1, 'ARCHIVE', '{"id": "1", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2025-2026", "per_credit_fee": "1000000"}', NULL, 'Auto archive before creating new rate', 1, '2025-11-19 14:35:14.699+00'),
(5, 4, 'UPDATE', '{"id": "1", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2025-2026", "per_credit_fee": "1000000"}', '{"id": "4", "status": "active", "currency": "VND", "major_id": "4", "program_id": "220", "academic_year": "2025-2026", "per_credit_fee": "1100000"}', NULL, 1, '2025-11-19 14:35:14.937+00'),
(6, 5, 'CREATE', NULL, '{"id": "5", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2025-2026", "per_credit_fee": "1300000"}', NULL, 1, '2025-11-19 14:36:42.489+00'),
(7, 6, 'CREATE', NULL, '{"id": "6", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2024-2025", "per_credit_fee": "900000"}', NULL, 1, '2025-11-19 14:37:05.238+00'),
(8, 7, 'CREATE', NULL, '{"id": "7", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2023-2024", "per_credit_fee": "800000"}', NULL, 1, '2025-11-19 14:37:15.144+00'),
(9, 8, 'CREATE', NULL, '{"id": "8", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2022-2023", "per_credit_fee": "700000"}', NULL, 1, '2025-11-19 14:37:23.075+00'),
(10, 9, 'CREATE', NULL, '{"id": "9", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2021-2022", "per_credit_fee": "600000"}', NULL, 1, '2025-11-19 14:37:32.653+00'),
(11, 10, 'CREATE', NULL, '{"id": "10", "status": "active", "currency": "VND", "major_id": "4", "program_id": "117", "academic_year": "2020-2021", "per_credit_fee": "500000"}', NULL, 1, '2025-11-19 14:37:46.66+00');



-- Comments
COMMENT ON TABLE "finance"."tuition_rules" IS 'Bảng quy tắc học phí';


-- Indices
CREATE UNIQUE INDEX tuition_rule_pkey ON finance.tuition_rules USING btree (id);


-- Comments
COMMENT ON TABLE "finance"."invoices" IS 'Danh sách hóa đơn';


-- Indices
CREATE UNIQUE INDEX invoice_pkey ON finance.invoices USING btree (id);
ALTER TABLE "finance"."tuition_credit_rates" ADD FOREIGN KEY ("major_id") REFERENCES "academic"."majors"("id") ON DELETE CASCADE;
ALTER TABLE "finance"."tuition_credit_rates" ADD FOREIGN KEY ("program_id") REFERENCES "academic"."programs"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX uq_tuition_credit_rates_program_year ON finance.tuition_credit_rates USING btree (program_id, academic_year) WHERE ((status)::text = 'active'::text);
CREATE INDEX idx_tuition_credit_rates_major ON finance.tuition_credit_rates USING btree (major_id);
CREATE INDEX idx_tuition_credit_rates_status ON finance.tuition_credit_rates USING btree (status);
CREATE INDEX idx_fin_tuition_rates_major ON finance.tuition_credit_rates USING btree (major_id);
CREATE INDEX idx_fin_tuition_rates_program ON finance.tuition_credit_rates USING btree (program_id);
CREATE INDEX idx_fin_tuition_rates_year ON finance.tuition_credit_rates USING btree (academic_year);
CREATE INDEX idx_fin_tuition_rates_status ON finance.tuition_credit_rates USING btree (status);
CREATE UNIQUE INDEX uq_fin_tuition_rates_program_year_active ON finance.tuition_credit_rates USING btree (program_id, academic_year) WHERE ((status)::text = 'active'::text);
CREATE UNIQUE INDEX uq_fin_tuition_rates_major_year_active ON finance.tuition_credit_rates USING btree (major_id, academic_year) WHERE (((status)::text = 'active'::text) AND (program_id IS NULL));
ALTER TABLE "finance"."tuition_rate_logs" ADD FOREIGN KEY ("tuition_rate_id") REFERENCES "finance"."tuition_credit_rates"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_tuition_rate_logs_rate ON finance.tuition_rate_logs USING btree (tuition_rate_id);
CREATE INDEX idx_fin_tuition_rate_logs_rate ON finance.tuition_rate_logs USING btree (tuition_rate_id);
CREATE INDEX idx_fin_tuition_rate_logs_actor ON finance.tuition_rate_logs USING btree (changed_by);
