-- ============================================
-- STOCK AUDIT SYSTEM - SUPABASE SQL SCHEMA
-- ============================================

-- 1. Create stock_audits table (main audit sessions)
CREATE TABLE IF NOT EXISTS stock_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    total_items_audited INTEGER DEFAULT 0,
    total_variance INTEGER DEFAULT 0,
    estimated_value_impact DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create stock_audit_items table (individual product audits)
CREATE TABLE IF NOT EXISTS stock_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES stock_audits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    system_stock INTEGER NOT NULL DEFAULT 0,
    physical_count INTEGER,
    variance INTEGER GENERATED ALWAYS AS (physical_count - system_stock) STORED,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'variance', 'critical')),
    notes TEXT,
    audited_by UUID REFERENCES auth.users(id),
    audited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create stock_adjustments table (track inventory corrections from audits)
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_item_id UUID REFERENCES stock_audit_items(id),
    product_id UUID NOT NULL,
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    adjustment_amount INTEGER GENERATED ALWAYS AS (quantity_after - quantity_before) STORED,
    reason VARCHAR(500),
    adjusted_by UUID REFERENCES auth.users(id),
    adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes on stock_audits
CREATE INDEX IF NOT EXISTS idx_stock_audits_date ON stock_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_stock_audits_status ON stock_audits(status);
CREATE INDEX IF NOT EXISTS idx_stock_audits_created_by ON stock_audits(created_by);

-- Indexes on stock_audit_items
CREATE INDEX IF NOT EXISTS idx_audit_items_audit_id ON stock_audit_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_product_id ON stock_audit_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_status ON stock_audit_items(status);
CREATE INDEX IF NOT EXISTS idx_audit_items_variance ON stock_audit_items(variance);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_audits
CREATE POLICY "Users can view their own audits" ON stock_audits
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create audits" ON stock_audits
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own audits" ON stock_audits
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for stock_audit_items
CREATE POLICY "Users can view audit items for their audits" ON stock_audit_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stock_audits 
            WHERE id = audit_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit items for their audits" ON stock_audit_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stock_audits 
            WHERE id = audit_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update audit items for their audits" ON stock_audit_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stock_audits 
            WHERE id = audit_id AND created_by = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_stock_audits_updated_at 
    BEFORE UPDATE ON stock_audits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_items_updated_at 
    BEFORE UPDATE ON stock_audit_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
