-- Security definer function to allow public anonymous lookups of beneficiary safety status without login
CREATE OR REPLACE FUNCTION public.quick_inquiry_search(search_query TEXT)
RETURNS TABLE (
  full_name TEXT,
  camp_name TEXT,
  district TEXT,
  village TEXT,
  priority TEXT,
  is_safe BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Search by full name (case insensitive matching) or Aadhaar number or QR code
  RETURN QUERY
  SELECT 
    b.full_name,
    COALESCE(c.name, 'Out-of-camp') AS camp_name,
    COALESCE(c.district, b.district) AS district,
    b.village,
    b.priority::text,
    TRUE as is_safe
  FROM public.beneficiaries b
  LEFT JOIN public.camps c ON c.id = b.camp_id
  WHERE (b.full_name ILIKE '%' || search_query || '%' AND LENGTH(search_query) >= 3)
     OR b.aadhaar = search_query
     OR b.qr_code = search_query;
END; $$;

GRANT EXECUTE ON FUNCTION public.quick_inquiry_search(TEXT) TO anon, authenticated;
