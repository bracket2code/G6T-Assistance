-- Add styles column to report_templates
ALTER TABLE report_templates
ADD COLUMN styles jsonb NOT NULL DEFAULT '{
  "logo": null,
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
  }
}'::jsonb;

-- Update default template with styles
UPDATE report_templates
SET styles = '{
  "logo": null,
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
  }
}'::jsonb
WHERE name = 'Informe Mensual';