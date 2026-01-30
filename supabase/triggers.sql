
-- 1. Auto updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Generic Audit Log Trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB := NULL;
  new_data JSONB := NULL;
  user_id UUID := auth.uid();
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
  ELSIF (TG_OP = 'INSERT') THEN
    new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_log (entity_type, entity_id, action, before, after, user_id)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, old_data, new_data, user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_vehicles_audit AFTER INSERT OR UPDATE OR DELETE ON vehicles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER tr_vehicle_docs_audit AFTER INSERT OR UPDATE OR DELETE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER tr_vehicle_expenses_audit AFTER INSERT OR UPDATE OR DELETE ON vehicle_expenses FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER tr_sales_audit AFTER INSERT OR UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 3. Protect Audit Log from modification
CREATE OR REPLACE FUNCTION protect_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'The audit log is immutable.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_log_protect
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION protect_audit_log();
