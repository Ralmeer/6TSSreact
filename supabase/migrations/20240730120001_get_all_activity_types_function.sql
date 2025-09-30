CREATE OR REPLACE FUNCTION get_all_activity_types()
RETURNS SETOF jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object('activity_type', activity_type)
  FROM (
    SELECT DISTINCT a.activity_type
    FROM public.attendance a
    WHERE a.activity_type IS NOT NULL
    ORDER BY a.activity_type
  ) AS distinct_activity_types;
END;
$$;