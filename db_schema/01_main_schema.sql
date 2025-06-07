-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- e.g., view-own-attendance, manage-all-attendance
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Role_Permissions Junction Table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth.users table
    full_name TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL -- User must have a role
);

-- Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clock_in_time TIMESTAMPTZ DEFAULT now(),
    clock_out_time TIMESTAMPTZ,
    clock_in_latitude NUMERIC,
    clock_in_longitude NUMERIC,
    clock_out_latitude NUMERIC,
    clock_out_longitude NUMERIC,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance
CREATE TRIGGER set_attendance_timestamp
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Leave Types Table
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    default_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Leave Applications Table
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE RESTRICT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    approved_by UUID REFERENCES auth.users(id), -- User who approved/rejected
    comments TEXT, -- Comments from approver
    requested_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for leave_applications
CREATE TRIGGER set_leave_applications_timestamp
BEFORE UPDATE ON leave_applications
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Laborers Table
CREATE TABLE laborers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    contact_info TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Labor Attendance Table
CREATE TABLE labor_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laborer_id UUID REFERENCES laborers(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- present, absent, half-day
    wage_for_day NUMERIC(10, 2) DEFAULT 0.00,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (laborer_id, date) -- Ensures one attendance record per laborer per day
);

-- Payment Accounts Table
CREATE TABLE payment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    type TEXT, -- Bank, Cash, UPI
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_account_id UUID REFERENCES payment_accounts(id) ON DELETE RESTRICT NOT NULL,
    type TEXT NOT NULL, -- expense, labor_advance, wage_settlement, fund_transfer
    amount NUMERIC(10, 2) NOT NULL, -- Positive for income/credit, Negative for expense/debit
    transaction_date DATE DEFAULT CURRENT_DATE NOT NULL,
    description TEXT,
    category TEXT, -- For expenses: Travel, Food, Materials
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For employee expenses
    related_laborer_id UUID REFERENCES laborers(id) ON DELETE SET NULL, -- For laborer advances/settlements
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Wage Settlements Table
CREATE TABLE wage_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laborer_id UUID REFERENCES laborers(id) ON DELETE CASCADE NOT NULL,
    settlement_period_start DATE NOT NULL,
    settlement_period_end DATE NOT NULL,
    total_attended_days INTEGER NOT NULL,
    total_wages_earned NUMERIC(10, 2) NOT NULL,
    total_advances_paid NUMERIC(10, 2) DEFAULT 0.00,
    final_settlement_amount NUMERIC(10, 2) NOT NULL,
    payment_account_id UUID REFERENCES payment_accounts(id) ON DELETE RESTRICT NOT NULL,
    settlement_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    settled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial data
INSERT INTO roles (name, description) VALUES ('Admin', 'Full access to all features');
INSERT INTO roles (name, description) VALUES ('Supervisor', 'Manages daily labor and attendance');
INSERT INTO roles (name, description) VALUES ('Employee', 'Standard employee access');

INSERT INTO permissions (name, description) VALUES ('manage-users', 'Create, edit, delete users');
INSERT INTO permissions (name, description) VALUES ('manage-roles', 'Create, edit, delete roles and permissions');
INSERT INTO permissions (name, description) VALUES ('view-own-attendance', 'View personal attendance records');
INSERT INTO permissions (name, description) VALUES ('manage-all-attendance', 'View and manage all attendance records');
INSERT INTO permissions (name, description) VALUES ('submit-leave-request', 'Submit a leave application');
INSERT INTO permissions (name, description) VALUES ('approve-leave-request', 'Approve or reject leave applications');
INSERT INTO permissions (name, description) VALUES ('manage-laborers', 'Add, edit, view laborers');
INSERT INTO permissions (name, description) VALUES ('record-labor-attendance', 'Record daily attendance for laborers');
INSERT INTO permissions (name, description) VALUES ('record-labor-advances', 'Record cash advances to laborers');
INSERT INTO permissions (name, description) VALUES ('perform-wage-settlement', 'Settle wages for laborers');
INSERT INTO permissions (name, description) VALUES ('manage-payment-accounts', 'Create, edit, view payment accounts');
INSERT INTO permissions (name, description) VALUES ('record-expenses', 'Record business expenses');
INSERT INTO permissions (name, description) VALUES ('view-all-expenses', 'View all expense records');

-- Example: Assign all permissions to Admin (can be done via app logic or more complex script)
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r, permissions p
-- WHERE r.name = 'Admin';

-- Note: The ALTER TABLE statement for adding foreign key from transactions to wage_settlements
-- (related_settlement_id) should be run after wage_settlements table is created.
-- For simplicity in a single script, it's often handled by ensuring creation order
-- or adding it in a separate migration step. If wage_settlements is created before transactions,
-- this is not an issue. In this script, wage_settlements is created before transactions,
-- so the FK could be added directly to transactions table.
-- However, the provided plan had it as a separate ALTER TABLE, so keeping that in mind.
-- For now, it's commented out as in the plan.
-- ALTER TABLE transactions ADD COLUMN related_settlement_id UUID REFERENCES wage_settlements(id) ON DELETE SET NULL;
