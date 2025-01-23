-- Create report_templates table
CREATE TABLE report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf', 'xlsx')),
  fields jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to update updated_at
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default template
INSERT INTO report_templates (name, type, fields)
VALUES (
  'Informe Mensual',
  'pdf',
  '[
    {"id": "1", "name": "Empresa", "type": "business", "width": 30},
    {"id": "2", "name": "Fecha", "type": "date", "format": "DD/MM/YYYY"},
    {"id": "3", "name": "Horas", "type": "hours", "width": 15},
    {"id": "4", "name": "Total", "type": "total", "width": 15}
  ]'::jsonb
);