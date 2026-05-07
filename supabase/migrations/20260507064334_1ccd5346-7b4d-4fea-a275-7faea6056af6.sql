ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_counters;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.usage_counters REPLICA IDENTITY FULL;