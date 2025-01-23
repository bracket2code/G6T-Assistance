-- Add new report type
INSERT INTO report_types (name, description, icon)
SELECT 'Informe Detallado', 'Informe detallado con notas y horarios por día y empresa', 'FileText'
WHERE NOT EXISTS (
  SELECT 1 FROM report_types 
  WHERE name = 'Informe Detallado'
);

-- Add report options table for storing report preferences
CREATE TABLE report_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id uuid REFERENCES report_templates(id) ON DELETE CASCADE,
  show_shift_notes boolean DEFAULT true,
  show_daily_notes boolean DEFAULT true,
  show_times boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_options ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON report_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins and managers"
  ON report_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_report_options_updated_at
  BEFORE UPDATE ON report_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();