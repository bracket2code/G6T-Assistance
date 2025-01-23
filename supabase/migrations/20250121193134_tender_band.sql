-- Add svg_logo column to report_templates
ALTER TABLE report_templates
ADD COLUMN svg_logo text;

-- Update styles default to remove logo
ALTER TABLE report_templates
ALTER COLUMN styles SET DEFAULT '{
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