-- Remove the fixed synthetic identities used during the July 16 validation pass.
-- The IDs and reserved .synthetic addresses are intentionally specific so this
-- migration cannot affect real KLEIO accounts.

do $$
begin
  delete from auth.users
  where id in (
    '11000000-0000-4000-8000-000000000001'::uuid,
    '11000000-0000-4000-8000-000000000002'::uuid,
    '11000000-0000-4000-8000-000000000003'::uuid,
    '11000000-0000-4000-8000-000000000004'::uuid,
    '11000000-0000-4000-8000-000000000005'::uuid
  )
  and email like 'verify-%-20260716@kleio.synthetic';
end;
$$;
