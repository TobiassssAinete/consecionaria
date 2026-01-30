
CREATE OR REPLACE FUNCTION sell_vehicle(
  p_vehicle_id UUID,
  p_sold_price NUMERIC,
  p_sold_at TIMESTAMPTZ,
  p_notes TEXT
) RETURNS VOID AS $$
DECLARE
  v_missing_critical_count INT;
  v_status vehicle_status;
BEGIN
  -- 1. Check if vehicle exists and its status
  SELECT status INTO v_status FROM vehicles WHERE id = p_vehicle_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle not found.';
  END IF;

  IF v_status = 'sold' THEN
    RAISE EXCEPTION 'Vehicle is already sold.';
  END IF;

  -- 2. Check for critical documents
  -- A vehicle can be sold ONLY if all doc_types where is_critical=true have status='ok'
  -- First, count how many critical doc types exist
  -- Then, count how many of those are 'ok' for this vehicle
  SELECT COUNT(*)
  INTO v_missing_critical_count
  FROM catalog_doc_types dt
  LEFT JOIN vehicle_documents vd ON vd.doc_type_id = dt.id AND vd.vehicle_id = p_vehicle_id
  WHERE dt.is_critical = true 
    AND (vd.status IS NULL OR vd.status != 'ok');

  IF v_missing_critical_count > 0 THEN
    RAISE EXCEPTION 'Cannot sell vehicle. % critical documents are missing or not OK.', v_missing_critical_count;
  END IF;

  -- 3. Insert into sales
  INSERT INTO sales (vehicle_id, sold_price, sold_at, notes, created_by)
  VALUES (p_vehicle_id, p_sold_price, p_sold_at, p_notes, auth.uid());

  -- 4. Update vehicle status
  UPDATE vehicles
  SET status = 'sold',
      sold_at = p_sold_at,
      sold_price = p_sold_price,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = p_vehicle_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
