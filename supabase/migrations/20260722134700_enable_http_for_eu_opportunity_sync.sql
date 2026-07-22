-- Enabled only to test the official European Commission API through an
-- independent PostgreSQL/libcurl transport after the Edge runtime request failed.
-- The source remains inactive because the upstream service terminated both transports.
create extension if not exists http with schema extensions;
