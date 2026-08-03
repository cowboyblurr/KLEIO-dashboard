# KLEIO Product Analytics Release Order

Apply the founding artist-beta analytics migrations in this order:

1. `20260803162000_product_analytics_event_contract.sql`
2. `20260803162100_product_analytics_milestones.sql`
3. `20260803162200_product_analytics_admin_snapshot.sql`
4. `20260803162300_product_analytics_acquisition_attribution.sql`
5. `20260803162400_product_analytics_legacy_internal_actors.sql`

The fifth migration establishes the founding real-user baseline conservatively. Every authenticated actor observed in the verified pre-architecture event dataset is added to the private internal-QA registry. Their historical and durable-backfill events are excluded from real-user reporting.

This decision is grounded in the August 3, 2026 audit: the existing event history was dominated by KLEIO development, landing-page and carousel testing. The data did not support treating those actors as verified beta artists.

The migration stores no public identity list. The actor registry remains in the private schema and contains only user IDs, an internal-QA classification and a short operational note.

## Rollback

To reverse only the baseline classification while preserving event history:

1. Remove the relevant rows from `private.analytics_internal_actors` after a reviewed determination that an actor represents verified real usage.
2. Reclassify only the explicitly reviewed events.
3. Do not expose the private actor registry to browser roles.
4. Re-run the aggregate snapshot and data-quality checks before presenting real-user percentages.

Do not delete product events to correct classification. Classification changes must remain auditable and deliberate.
