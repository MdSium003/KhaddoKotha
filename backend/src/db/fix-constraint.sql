
-- Fix unique constraint for expiration_risk_scores
DO $$
BEGIN
    -- Check if the constraint exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expiration_risk_scores_inventory_item_id_key'
    ) THEN
        -- First ensure there are no duplicates
        DELETE FROM expiration_risk_scores a USING expiration_risk_scores b
        WHERE a.id < b.id AND a.inventory_item_id = b.inventory_item_id;

        -- Add the unique constraint
        ALTER TABLE expiration_risk_scores ADD CONSTRAINT expiration_risk_scores_inventory_item_id_key UNIQUE (inventory_item_id);
    END IF;
END $$;
