-- Create report types table
CREATE TABLE report_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON report_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins and managers"
  ON report_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Add type reference to report_templates
ALTER TABLE report_templates
ADD COLUMN report_type_id uuid REFERENCES report_types(id);

-- Insert default report types
INSERT INTO report_types (name, description, icon) VALUES
  ('Horas por Empresa', 'Informe detallado de horas trabajadas por empresa', 'Building2'),
  ('Horas por Día', 'Informe de horas trabajadas por día', 'Calendar'),
  ('Horas por Semana', 'Informe semanal de horas trabajadas', 'CalendarDays'),
  ('Resumen Mensual', 'Resumen mensual de horas trabajadas', 'CalendarRange'),
  ('Comparativa', 'Comparativa de horas entre períodos', 'BarChart2');