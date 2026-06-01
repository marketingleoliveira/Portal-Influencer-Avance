GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

UPDATE storage.buckets
SET file_size_limit = NULL, allowed_mime_types = NULL
WHERE id = 'influencer-uploads';