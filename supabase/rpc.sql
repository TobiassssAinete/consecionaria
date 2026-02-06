
-- Eliminamos la función compleja anterior
DROP FUNCTION IF EXISTS sell_vehicle_complex;

-- Función de venta simple y directa
CREATE OR REPLACE FUNCTION sell_vehicle(
  p_vehicle_id UUID,
  p_sold_price NUMERIC,
  p_sold_at TIMESTAMPTZ,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  v_missing_critical_count INT;
  v_status vehicle_status;
  v_sale_id UUID;
BEGIN
  -- 1. Validaciones básicas
  SELECT status INTO v_status FROM vehicles WHERE id = p_vehicle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehículo no encontrado.'; END IF;
  IF v_status = 'sold' THEN RAISE EXCEPTION 'El vehículo ya figura como vendido.'; END IF;

  -- 2. Validación de documentación crítica (Semáforo en Rojo bloquea)
  SELECT COUNT(*) INTO v_missing_critical_count
  FROM catalog_doc_types dt
  LEFT JOIN vehicle_documents vd ON vd.doc_type_id = dt.id AND vd.vehicle_id = p_vehicle_id
  WHERE dt.is_critical = true AND (vd.status IS NULL OR vd.status != 'ok');

  IF v_missing_critical_count > 0 THEN
    RAISE EXCEPTION 'Bloqueo legal: Faltan % documentos críticos en estado OK.', v_missing_critical_count;
  END IF;

  -- 3. Registrar la venta
  INSERT INTO sales (vehicle_id, sold_price, sold_at, notes, created_by)
  VALUES (p_vehicle_id, p_sold_price, p_sold_at, p_notes, auth.uid())
  RETURNING id INTO v_sale_id;

  -- 4. Actualizar estado del vehículo
  UPDATE vehicles
  SET status = 'sold',
      sold_at = p_sold_at,
      sold_price = p_sold_price,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = p_vehicle_id;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
