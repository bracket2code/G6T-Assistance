/*
  # Remove unique constraint from tax_id

  1. Changes
    - Remove unique constraint from tax_id column in businesses table
    - This allows multiple businesses to share the same tax_id

  Note: This change enables businesses with the same CIF/NIF to be registered in the system
*/

ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS businesses_tax_id_key;