-- Add new report type
INSERT INTO report_types (name, description, icon)
SELECT 'Horas por Semana y Empresa', 'Informe de horas trabajadas por semana y empresa', 'CalendarDays'
WHERE NOT EXISTS (
  SELECT 1 FROM report_types 
  WHERE name = 'Horas por Semana y Empresa'
);

-- Add show_welcome_splash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_welcome_splash boolean DEFAULT true;