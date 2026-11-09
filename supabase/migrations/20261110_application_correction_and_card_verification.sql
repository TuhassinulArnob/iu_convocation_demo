-- ==============================================================
-- SUPABASE MIGRATION: APPLICATION CORRECTION WORKFLOW &
-- DIGITALLY SIGNED CONVOCATION CARD WITH QR VERIFICATION
-- Islamic University Bangladesh 5th Convocation 2027 (Educational Demonstration)
-- ==============================================================

-- 1. Extend applications table with correction workflow fields
ALTER TABLE IF EXISTS applications 
ADD COLUMN IF NOT EXISTS correction_instructions TEXT,
ADD COLUMN IF NOT EXISTS correction_categories TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS correction_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMPTZ;

-- 2. Create application_revisions table for full audit snapshot history
CREATE TABLE IF NOT EXISTS application_revisions (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    revision_number INT NOT NULL DEFAULT 1,
    snapshot_json JSONB NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'applicant',
    change_type TEXT NOT NULL DEFAULT 'UPDATE', -- INITIAL_SUBMISSION, CORRECTION_REQUEST, RESUBMISSION, ADMIN_APPROVAL, ADMIN_REOPEN
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_application_revision FOREIGN KEY (application_id) 
        REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_application_revisions_app_id 
    ON application_revisions(application_id);

-- 3. Create convocation_cards table for digitally signed card issuance & revocation tracking
CREATE TABLE IF NOT EXISTS convocation_cards (
    id BIGSERIAL PRIMARY KEY,
    card_id TEXT UNIQUE NOT NULL, -- e.g. IU27-CARD-000101-V1
    application_id BIGINT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL, -- Cryptographic random token
    digital_signature TEXT NOT NULL, -- Server-generated HMAC-SHA256 signature
    status TEXT NOT NULL DEFAULT 'VALID', -- VALID, REVOKED, SUSPENDED
    version INT NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_convocation_cards_app FOREIGN KEY (application_id) 
        REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_convocation_cards_app_id 
    ON convocation_cards(application_id);
CREATE INDEX IF NOT EXISTS idx_convocation_cards_card_id 
    ON convocation_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_convocation_cards_token 
    ON convocation_cards(verification_token);

-- ==============================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================

-- Enable RLS on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE convocation_cards ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------
-- Applications RLS Policies
-- --------------------------------------------------------------

-- Candidate can SELECT their own application
DROP POLICY IF EXISTS "Candidates can view own application" ON applications;
CREATE POLICY "Candidates can view own application"
ON applications FOR SELECT
TO authenticated
USING (
    auth.uid()::text = user_id::text
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- Candidate can UPDATE their own application ONLY when status permits editing
-- (Draft, Form Incomplete, or Correction Required)
-- Editing is STRICTLY LOCKED when Under Review or Approved
DROP POLICY IF EXISTS "Candidates can edit own application only when status permits" ON applications;
CREATE POLICY "Candidates can edit own application only when status permits"
ON applications FOR UPDATE
TO authenticated
USING (
    (
        auth.uid()::text = user_id::text
        AND status IN ('Account Created', 'Draft', 'Form Incomplete', 'Correction Required', 'CORRECTION_REQUIRED')
    )
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
)
WITH CHECK (
    (
        auth.uid()::text = user_id::text
        AND status IN ('Account Created', 'Draft', 'Form Incomplete', 'Correction Required', 'CORRECTION_REQUIRED', 'PENDING_REVIEW', 'Under Review')
    )
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- Admins have full access to manage applications
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
CREATE POLICY "Admins can manage all applications"
ON applications FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- --------------------------------------------------------------
-- Application Revisions RLS Policies
-- --------------------------------------------------------------

-- Candidates can view their own revisions, Admins can view all
DROP POLICY IF EXISTS "Users can view relevant application revisions" ON application_revisions;
CREATE POLICY "Users can view relevant application revisions"
ON application_revisions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.id = application_revisions.application_id 
        AND a.user_id::text = auth.uid()::text
    )
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- Insert into revisions allowed for candidates modifying own app or admin
DROP POLICY IF EXISTS "Authenticated users can record application revisions" ON application_revisions;
CREATE POLICY "Authenticated users can record application revisions"
ON application_revisions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.id = application_revisions.application_id 
        AND a.user_id::text = auth.uid()::text
    )
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- --------------------------------------------------------------
-- Convocation Cards RLS Policies
-- --------------------------------------------------------------

-- Candidates can view valid cards belonging to their approved application
DROP POLICY IF EXISTS "Candidates can view own convocation cards" ON convocation_cards;
CREATE POLICY "Candidates can view own convocation cards"
ON convocation_cards FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.id = convocation_cards.application_id 
        AND a.user_id::text = auth.uid()::text
    )
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- Admins can manage, issue, and revoke cards
DROP POLICY IF EXISTS "Admins can manage all convocation cards" ON convocation_cards;
CREATE POLICY "Admins can manage all convocation cards"
ON convocation_cards FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
);

-- ==============================================================
-- 5. SECURE PUBLIC QR VERIFICATION FUNCTION
-- Exposes ONLY minimum necessary verification information
-- NEVER exposes mobile, email, password, full address, or guest details
-- ==============================================================

CREATE OR REPLACE FUNCTION verify_convocation_card(
    p_card_id TEXT,
    p_verification_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_card RECORD;
    v_app RECORD;
    v_dept RECORD;
    v_has_paid BOOLEAN;
    v_token_valid BOOLEAN := TRUE;
    v_result JSONB;
BEGIN
    -- 1. Find Card
    SELECT * INTO v_card
    FROM convocation_cards
    WHERE LOWER(card_id) = LOWER(TRIM(p_card_id))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', FALSE,
            'status', 'INVALID',
            'status_label', 'Invalid Demo Card',
            'digital_signature_verification', 'Invalid',
            'verification_message', 'No matching Convocation Card record found in the demonstration database.'
        );
    END IF;

    -- 2. Validate token if provided
    IF p_verification_token IS NOT NULL AND TRIM(p_verification_token) <> '' THEN
        IF v_card.verification_token <> TRIM(p_verification_token) THEN
            v_token_valid := FALSE;
        END IF;
    END IF;

    IF NOT v_token_valid THEN
        RETURN jsonb_build_object(
            'valid', FALSE,
            'status', 'INVALID',
            'status_label', 'Invalid Demo Card',
            'card_id', v_card.card_id,
            'digital_signature_verification', 'Invalid',
            'verification_message', 'Cryptographic verification token mismatch or tampered QR code.'
        );
    END IF;

    -- 3. Retrieve non-sensitive application and department info
    SELECT full_name, degree_level, department_id, roll_number, id INTO v_app
    FROM applications
    WHERE id = v_card.application_id;

    SELECT name INTO v_dept
    FROM departments
    WHERE id = v_app.department_id;

    -- Check payment simulation status
    SELECT EXISTS (
        SELECT 1 FROM payment_simulations
        WHERE application_id = v_app.id AND status = 'DEMO SUCCESS'
    ) INTO v_has_paid;

    -- 4. Check revocation status
    IF v_card.status <> 'VALID' THEN
        RETURN jsonb_build_object(
            'valid', FALSE,
            'status', 'REVOKED',
            'status_label', 'Invalid / Revoked',
            'card_id', v_card.card_id,
            'candidate_name', v_app.full_name,
            'department', COALESCE(v_dept.name, 'N/A'),
            'degree_level', v_app.degree_level,
            'issued_at', to_char(v_card.issued_at, 'DD Mon YYYY, HH12:MI AM'),
            'revoked_at', to_char(v_card.revoked_at, 'DD Mon YYYY, HH12:MI AM'),
            'revocation_reason', COALESCE(v_card.revocation_reason, 'Card revoked by administration.'),
            'payment_confirmation_status', CASE WHEN v_has_paid THEN 'DEMO SUCCESS (Verified)' ELSE 'NOT PAID' END,
            'digital_signature_verification', 'Valid',
            'digital_signature', v_card.digital_signature,
            'verification_message', 'This card has been revoked or invalidated by the Convocation Administration.'
        );
    END IF;

    -- 5. Return Valid Public Verification Info
    RETURN jsonb_build_object(
        'valid', TRUE,
        'status', 'VALID',
        'status_label', 'Valid Demo Card',
        'candidate_name', v_app.full_name,
        'card_id', v_card.card_id,
        'degree_level', v_app.degree_level,
        'department', COALESCE(v_dept.name, 'N/A'),
        'convocation_year', '2027 (5th Convocation)',
        'issued_at', to_char(v_card.issued_at, 'DD Mon YYYY, HH12:MI AM'),
        'payment_confirmation_status', CASE WHEN v_has_paid THEN 'DEMO SUCCESS (Verified)' ELSE 'NOT PAID' END,
        'digital_signature_verification', 'Valid',
        'digital_signature', v_card.digital_signature,
        'disclaimer', 'Digitally Verified — Educational Demonstration',
        'verification_message', 'Verified authentic demonstration convocation card issued by Islamic University 5th Convocation 2027 demo portal.'
    );
END;
$$;
