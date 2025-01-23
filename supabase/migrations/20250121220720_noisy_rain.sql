-- Drop existing tables
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS report_types CASCADE;

-- Create report_types table
CREATE TABLE report_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create report_templates table
CREATE TABLE report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf', 'xlsx')),
  report_type_id uuid REFERENCES report_types(id),
  fields jsonb NOT NULL DEFAULT '[]',
  styles jsonb NOT NULL DEFAULT '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#1F2937",
      "text": "#111827",
      "background": "#FFFFFF"
    },
    "fonts": {
      "title": "Helvetica",
      "body": "Arial"
    },
    "header": {
      "show": true,
      "height": 80,
      "alignment": "left"
    },
    "footer": {
      "show": true,
      "height": 50,
      "text": "Página {page} de {pages}"
    },
    "texts": {
      "title": "Informe de Horas",
      "period": "Período: {start} - {end}"
    }
  }'::jsonb,
  svg_logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable read access for authenticated users"
  ON report_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins and managers"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Insert default report types
INSERT INTO report_types (name, description, icon) VALUES
  ('Horas por Empresa', 'Informe detallado de horas trabajadas por empresa', 'Building2'),
  ('Horas por Día', 'Informe de horas trabajadas por día', 'Calendar'),
  ('Horas por Semana', 'Informe semanal de horas trabajadas', 'CalendarDays'),
  ('Resumen Mensual', 'Resumen mensual de horas trabajadas', 'CalendarRange'),
  ('Comparativa', 'Comparativa de horas entre períodos', 'BarChart2');

-- Create trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();