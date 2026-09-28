DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM leads
    WHERE archived_at IS NULL
    GROUP BY organization_id, phone
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce active lead phone uniqueness: duplicate phone values exist. Review duplicates before applying migration 008.';
  END IF;
END $$;

CREATE UNIQUE INDEX leads_org_active_phone_unique_idx
  ON leads (organization_id, phone)
  WHERE archived_at IS NULL;
