CREATE OR REPLACE FUNCTION get_distinct_activity_types(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE(activity_type TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT b.badge_type::TEXT
  FROM public.badges b
  JOIN public.scout_badges sb ON b.id = sb.badge_id
  WHERE (start_date IS NULL OR sb.date_earned >= start_date)
    AND (end_date IS NULL OR sb.date_earned <= end_date);
END;
$$;