-- Keep Google social login convenient without allowing OAuth metadata or callback
-- query parameters to rewrite an established KLEIO account role.
--
-- New Google identities are created by Supabase before the application callback.
-- KLEIO's auth trigger intentionally defaults identities without a role to artist.
-- This RPC permits one narrowly-scoped artist -> institution bootstrap only when:
--   * the caller owns the authenticated Google identity,
--   * the account is brand new,
--   * onboarding is still incomplete,
--   * no artist/institution owner record has been created yet.
-- Existing accounts can never use this RPC to switch workspace type.

create or replace function public.claim_fresh_google_signup_role(requested_role text)
returns table (
  resolved_role public.kleio_role,
  role_changed boolean,
  existing_account boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_role public.kleio_role;
  onboarding_done boolean;
  user_created_at timestamptz;
  google_identity_exists boolean;
  owner_state_exists boolean;
  desired_role public.kleio_role;
begin
  if caller_id is null then
    raise exception 'authentication_required';
  end if;

  if requested_role not in ('artist', 'institution') then
    raise exception 'invalid_signup_role';
  end if;
  desired_role := requested_role::public.kleio_role;

  select
    p.role,
    p.onboarding_completed,
    u.created_at,
    exists (
      select 1
      from auth.identities i
      where i.user_id = caller_id
        and i.provider = 'google'
    )
  into current_role, onboarding_done, user_created_at, google_identity_exists
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = caller_id;

  if not found then
    raise exception 'kleio_profile_required';
  end if;

  if not google_identity_exists then
    raise exception 'google_identity_required';
  end if;

  -- Returning users and correctly defaulted artist signups need no mutation.
  if current_role = desired_role then
    return query
      select current_role, false, (onboarding_done or user_created_at < now() - interval '15 minutes');
    return;
  end if;

  -- Role changes are never allowed for established accounts.
  if onboarding_done or user_created_at < now() - interval '15 minutes' then
    raise exception 'account_role_mismatch';
  end if;

  -- The only bootstrap mutation is the known OAuth-default case:
  -- brand-new artist default -> explicitly selected institution signup.
  if current_role <> 'artist'::public.kleio_role or desired_role <> 'institution'::public.kleio_role then
    raise exception 'account_role_mismatch';
  end if;

  select
    exists (select 1 from public.artist_profiles ap where ap.user_id = caller_id)
    or exists (select 1 from public.institutions ins where ins.owner_user_id = caller_id)
  into owner_state_exists;

  if owner_state_exists then
    raise exception 'account_role_already_in_use';
  end if;

  update public.profiles
  set
    role = 'institution'::public.kleio_role,
    display_name = coalesce(
      nullif(display_name, ''),
      nullif((select raw_user_meta_data ->> 'full_name' from auth.users where id = caller_id), ''),
      nullif((select raw_user_meta_data ->> 'name' from auth.users where id = caller_id), '')
    ),
    updated_at = now()
  where id = caller_id;

  return query select 'institution'::public.kleio_role, true, false;
end;
$$;

revoke all on function public.claim_fresh_google_signup_role(text) from public, anon;
grant execute on function public.claim_fresh_google_signup_role(text) to authenticated;

comment on function public.claim_fresh_google_signup_role(text) is
  'One-time role bootstrap for a fresh Google OAuth signup. Never changes an established KLEIO account role.';
