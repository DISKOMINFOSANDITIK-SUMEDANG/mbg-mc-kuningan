-- =====================================================
-- MIGRATION: Stock Management & Sales Transaction System
-- Description: Add tables for stock movements and sales transactions
-- Date: 2026-12-22
-- =====================================================

-- 1. Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_product_id UUID NOT NULL REFERENCES public.supplier_products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('manual_in', 'manual_out', 'sales_transaction', 'adjustment', 'initial_stock')),
    reference_id UUID NULL, -- ID dari sales_transaction jika reference_type = 'sales_transaction'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 2. Create sales_transactions table
CREATE TABLE IF NOT EXISTS public.sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT UNIQUE NOT NULL, -- Format: TRX-YYYYMMDD-XXXXX
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    sppg_id UUID NOT NULL REFERENCES public.sppgs(id) ON DELETE RESTRICT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'credit')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 3. Create sales_transaction_items table
CREATE TABLE IF NOT EXISTS public.sales_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_transaction_id UUID NOT NULL REFERENCES public.sales_transactions(id) ON DELETE CASCADE,
    supplier_product_id UUID NOT NULL REFERENCES public.supplier_products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(supplier_product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_supplier ON public.sales_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_sppg ON public.sales_transactions(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON public.sales_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_number ON public.sales_transactions(transaction_number);

CREATE INDEX IF NOT EXISTS idx_sales_items_transaction ON public.sales_transaction_items(sales_transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product ON public.sales_transaction_items(supplier_product_id);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function: Auto-generate transaction number
-- Note: This function has been updated via migration to use DAY/WEEK/MONTH/YEAR format (e.g., 15/03/01/2026)
-- See migration: update_sales_transaction_number_format
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_num INT;
    new_number TEXT;
BEGIN
    -- Format: TRX-20261222-00001 (OLD FORMAT - See migration for new format)
    date_part := TO_CHAR(NEW.transaction_date, 'YYYYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 14) AS INT)), 0) + 1
    INTO sequence_num
    FROM public.sales_transactions
    WHERE transaction_number LIKE 'TRX-' || date_part || '-%';
    
    -- Generate new transaction number
    new_number := 'TRX-' || date_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    NEW.transaction_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_transaction_number ON public.sales_transactions;
CREATE TRIGGER trigger_generate_transaction_number
BEFORE INSERT ON public.sales_transactions
FOR EACH ROW
WHEN (NEW.transaction_number IS NULL OR NEW.transaction_number = '')
EXECUTE FUNCTION generate_transaction_number();

-- Function: Auto-calculate subtotal for sales items
CREATE OR REPLACE FUNCTION calculate_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_subtotal ON public.sales_transaction_items;
CREATE TRIGGER trigger_calculate_subtotal
BEFORE INSERT OR UPDATE ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION calculate_item_subtotal();

-- Function: Auto-update transaction total
CREATE OR REPLACE FUNCTION update_transaction_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.sales_transactions
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM public.sales_transaction_items
        WHERE sales_transaction_id = COALESCE(NEW.sales_transaction_id, OLD.sales_transaction_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.sales_transaction_id, OLD.sales_transaction_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_total_on_insert ON public.sales_transaction_items;
CREATE TRIGGER trigger_update_total_on_insert
AFTER INSERT ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION update_transaction_total();

DROP TRIGGER IF EXISTS trigger_update_total_on_update ON public.sales_transaction_items;
CREATE TRIGGER trigger_update_total_on_update
AFTER UPDATE ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION update_transaction_total();

DROP TRIGGER IF EXISTS trigger_update_total_on_delete ON public.sales_transaction_items;
CREATE TRIGGER trigger_update_total_on_delete
AFTER DELETE ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION update_transaction_total();

-- Function: Auto-create stock OUT movement when sales transaction item created
CREATE OR REPLACE FUNCTION create_stock_movement_from_sales()
RETURNS TRIGGER AS $$
BEGIN
    -- Create stock OUT movement
    INSERT INTO public.stock_movements (
        supplier_product_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
    )
    VALUES (
        NEW.supplier_product_id,
        'OUT',
        NEW.quantity,
        'sales_transaction',
        NEW.sales_transaction_id,
        'Auto stock deduction from transaction',
        (SELECT created_by FROM public.sales_transactions WHERE id = NEW.sales_transaction_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_stock_movement ON public.sales_transaction_items;
CREATE TRIGGER trigger_create_stock_movement
AFTER INSERT ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION create_stock_movement_from_sales();

-- Function: Update stock movement when sales item quantity changed
CREATE OR REPLACE FUNCTION update_stock_movement_from_sales()
RETURNS TRIGGER AS $$
BEGIN
    -- Update existing stock movement
    UPDATE public.stock_movements
    SET quantity = NEW.quantity
    WHERE reference_type = 'sales_transaction'
      AND reference_id = NEW.sales_transaction_id
      AND supplier_product_id = NEW.supplier_product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_movement ON public.sales_transaction_items;
CREATE TRIGGER trigger_update_stock_movement
AFTER UPDATE ON public.sales_transaction_items
FOR EACH ROW
WHEN (OLD.quantity != NEW.quantity)
EXECUTE FUNCTION update_stock_movement_from_sales();

-- Function: Delete stock movement when sales item deleted
CREATE OR REPLACE FUNCTION delete_stock_movement_from_sales()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.stock_movements
    WHERE reference_type = 'sales_transaction'
      AND reference_id = OLD.sales_transaction_id
      AND supplier_product_id = OLD.supplier_product_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_stock_movement ON public.sales_transaction_items;
CREATE TRIGGER trigger_delete_stock_movement
AFTER DELETE ON public.sales_transaction_items
FOR EACH ROW
EXECUTE FUNCTION delete_stock_movement_from_sales();

-- =====================================================
-- VIEWS for Easy Querying
-- =====================================================

-- View: Current stock per product (real-time calculation)
CREATE OR REPLACE VIEW public.current_stock_view AS
SELECT 
    sp.id AS supplier_product_id,
    sp.supplier_id,
    sp.commodity_id,
    c.name AS commodity_name,
    c.unit,
    sp.stock AS initial_stock,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END), 0) AS total_in,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS total_out,
    sp.stock + 
    COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS current_stock
FROM public.supplier_products sp
LEFT JOIN public.stock_movements sm ON sp.id = sm.supplier_product_id
LEFT JOIN public.commodities c ON sp.commodity_id = c.id
GROUP BY sp.id, sp.supplier_id, sp.commodity_id, c.name, c.unit, sp.stock;

-- Access control is enforced by the Express API in this Docker/PostgreSQL setup.
-- The original Supabase RLS policies used auth.uid() and the authenticated role,
-- which are not available in the plain Postgres container.

-- =====================================================
-- END OF MIGRATION
-- =====================================================
