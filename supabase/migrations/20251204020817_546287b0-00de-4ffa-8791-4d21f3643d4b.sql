-- Migrate existing client addresses to client_addresses table
-- Only insert if the client has an address AND doesn't already have a primary address in client_addresses

INSERT INTO client_addresses (client_id, address, city, postal_code, country, label, is_primary, address_type)
SELECT 
  c.id as client_id,
  c.address,
  c.city,
  c.postal_code,
  c.country,
  'Main Office' as label,
  true as is_primary,
  'office' as address_type
FROM clients c
WHERE c.address IS NOT NULL 
  AND c.address != ''
  AND NOT EXISTS (
    SELECT 1 FROM client_addresses ca 
    WHERE ca.client_id = c.id AND ca.is_primary = true
  );

-- Note: We're keeping the columns in clients table for now to avoid breaking changes
-- They can be dropped in a future migration after verifying all code uses client_addresses