create or replace function public.get_kleio_admin_analytics_snapshot(
  range_start timestamptz default (now() - interval '30 days'),
  range_end timestamptz default now(),
  requested_traffic_class text default 'real_user',
  requested_acquisition_source text default null,
  requested_viewport text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_kleio_admin() then
    raise exception using
      errcode = '42501',
      message = 'kleio_admin_required';
  end if;

  if range_start is null
    or range_end is null
    or range_start >= range_end
    or range_end - range_start > interval '366 days'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_analytics_date_range';
  end if;

  if requested_traffic_class not in (
    'real_user',
    'internal_qa',
    'guided_demo',
    'synthetic_preview',
    'automated_test'
  ) then
    raise exception using
      errcode = '22023',
      message = 'invalid_analytics_traffic_class';
  end if;

  if requested_acquisition_source is not null
    and requested_acquisition_source not in (
      'direct_outreach',
      'artist_referral',
      'institution_referral',
      'linkedin',
      'instagram',
      'organic_search',
      'direct',
      'opportunity_entry',
      'unknown'
    )
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_analytics_acquisition_source';
  end if;

  if requested_viewport is not null
    and requested_viewport not in ('mobile','tablet','desktop','unknown')
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_analytics_viewport';
  end if;

  with filtered_events as (
    select event_row.*
    from public.product_events event_row
    where event_row.occurred_at >= range_start
      and event_row.occurred_at < range_end
      and event_row.traffic_class = requested_traffic_class
      and (
        requested_acquisition_source is null
        or event_row.acquisition_source = requested_acquisition_source
      )
      and (
        requested_viewport is null
        or event_row.viewport = requested_viewport
      )
  ),
  session_actor as (
    select
      event_row.anonymous_session_id,
      min(event_row.actor_user_id::text)::uuid as actor_user_id
    from filtered_events event_row
    where event_row.anonymous_session_id is not null
      and event_row.actor_user_id is not null
    group by event_row.anonymous_session_id
  ),
  base as (
    select
      event_row.*,
      case
        when event_row.actor_user_id is not null
          then 'u:' || event_row.actor_user_id::text
        when session_actor.actor_user_id is not null
          then 'u:' || session_actor.actor_user_id::text
        else 's:' || event_row.anonymous_session_id::text
      end as person_key
    from filtered_events event_row
    left join session_actor
      on session_actor.anonymous_session_id = event_row.anonymous_session_id
  ),
  person_totals as (
    select count(distinct person_key) as people
    from base
    where person_key is not null
  ),
  overview as (
    select
      count(distinct person_key) filter (
        where event_name = 'landing_viewed'
      ) as visitors,
      count(distinct person_key) filter (
        where event_name = 'signup_started'
      ) as signup_starts,
      count(distinct actor_user_id) filter (
        where event_name = 'confirmation_completed'
      ) as confirmed_accounts,
      count(distinct actor_user_id) filter (
        where event_name = 'onboarding_completed'
      ) as onboarding_completions,
      count(distinct actor_user_id) filter (
        where event_name = 'first_value_reached'
      ) as first_value_artists,
      count(distinct actor_user_id) filter (
        where event_name = 'artist_activated'
      ) as activated_artists,
      count(*) filter (
        where event_name in ('import_completed','import_partially_completed')
      ) as successful_imports,
      count(*) filter (
        where event_name = 'import_started'
      ) as import_starts,
      count(distinct actor_user_id) filter (
        where event_name in (
          'opportunity_saved',
          'readiness_viewed',
          'application_preparation_started'
        )
      ) as opportunity_engaged_artists,
      count(distinct workflow_id) filter (
        where workflow_id is not null
      ) as workflows,
      count(distinct workflow_id) filter (
        where workflow_id is not null
          and event_name in (
            'user_visible_error',
            'upload_failed',
            'import_failed',
            'autosave_failed',
            'passport_save_failed',
            'onboarding_save_failed'
          )
      ) as failed_workflows
    from base
  ),
  stages(ordinal, stage, event_name) as (
    values
      (1,'Landing viewed','landing_viewed'),
      (2,'Artist signup selected','artist_signup_selected'),
      (3,'Signup started','signup_started'),
      (4,'Account created','account_created'),
      (5,'Confirmation completed','confirmation_completed'),
      (6,'Onboarding completed','onboarding_completed'),
      (7,'First value reached','first_value_reached'),
      (8,'Artist activated','artist_activated')
  ),
  stage_counts as (
    select
      stages.ordinal,
      stages.stage,
      stages.event_name,
      count(distinct base.person_key) as people
    from stages
    left join base on base.event_name = stages.event_name
    group by stages.ordinal, stages.stage, stages.event_name
  ),
  stage_first as (
    select
      base.person_key,
      stages.ordinal,
      min(base.occurred_at) as reached_at
    from base
    join stages on stages.event_name = base.event_name
    where base.person_key is not null
    group by base.person_key, stages.ordinal
  ),
  stage_medians as (
    select
      current_stage.ordinal,
      percentile_cont(0.5) within group (
        order by extract(
          epoch from (current_stage.reached_at - previous_stage.reached_at)
        ) / 3600.0
      ) filter (
        where previous_stage.reached_at is not null
          and current_stage.reached_at >= previous_stage.reached_at
      ) as median_hours
    from stage_first current_stage
    left join stage_first previous_stage
      on previous_stage.person_key = current_stage.person_key
     and previous_stage.ordinal = current_stage.ordinal - 1
    group by current_stage.ordinal
  ),
  stage_metrics as (
    select
      stage_counts.*,
      lag(stage_counts.people) over (
        order by stage_counts.ordinal
      ) as previous_people,
      stage_medians.median_hours
    from stage_counts
    left join stage_medians using (ordinal)
  ),
  funnel as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'ordinal', ordinal,
          'stage', stage,
          'event_name', event_name,
          'people', people,
          'conversion_from_previous_pct', case
            when previous_people > 0
              then round(100.0 * people / previous_people, 1)
            else null
          end,
          'dropoff_from_previous_pct', case
            when previous_people > 0
              then round(100.0 * (previous_people - people) / previous_people, 1)
            else null
          end,
          'median_hours_from_previous', round(median_hours::numeric, 1)
        )
        order by ordinal
      ),
      '[]'::jsonb
    ) as value
    from stage_metrics
  ),
  onboarding_friction as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'step', step,
          'viewport', viewport,
          'views', views,
          'completed', completed,
          'skipped', skipped,
          'validation_failures', validation_failures,
          'save_failures', save_failures,
          'saved_and_exited', saved_and_exited,
          'resumed', resumed
        )
        order by views desc, step, viewport
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        coalesce(nullif(metadata->>'step',''), 'unspecified') as step,
        viewport,
        count(*) filter (where event_name = 'onboarding_step_viewed') as views,
        count(*) filter (where event_name = 'onboarding_step_completed') as completed,
        count(*) filter (where event_name = 'onboarding_step_skipped') as skipped,
        count(*) filter (where event_name = 'onboarding_validation_failed') as validation_failures,
        count(*) filter (where event_name = 'onboarding_save_failed') as save_failures,
        count(*) filter (where event_name = 'onboarding_saved_and_exited') as saved_and_exited,
        count(*) filter (where event_name = 'onboarding_resumed') as resumed
      from base
      where event_name in (
        'onboarding_step_viewed',
        'onboarding_step_completed',
        'onboarding_step_skipped',
        'onboarding_validation_failed',
        'onboarding_save_failed',
        'onboarding_saved_and_exited',
        'onboarding_resumed'
      )
      group by coalesce(nullif(metadata->>'step',''), 'unspecified'), viewport
    ) grouped
  ),
  import_performance as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'source', source,
          'viewport', viewport,
          'starts', starts,
          'completed', completed,
          'partially_completed', partially_completed,
          'failed', failed,
          'completion_rate_pct', case
            when starts > 0
              then round(100.0 * (completed + partially_completed) / starts, 1)
            else null
          end,
          'median_completion_minutes', round(median_completion_minutes::numeric, 1),
          'artwork_records_saved', artwork_records_saved,
          'portfolio_inclusions', portfolio_inclusions
        )
        order by starts desc, source, viewport
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        source_counts.source,
        source_counts.viewport,
        source_counts.starts,
        source_counts.completed,
        source_counts.partially_completed,
        source_counts.failed,
        source_counts.artwork_records_saved,
        source_counts.portfolio_inclusions,
        duration_stats.median_completion_minutes
      from (
        select
          coalesce(nullif(metadata->>'source',''), 'unknown') as source,
          viewport,
          count(*) filter (where event_name = 'import_started') as starts,
          count(*) filter (where event_name = 'import_completed') as completed,
          count(*) filter (where event_name = 'import_partially_completed') as partially_completed,
          count(*) filter (where event_name = 'import_failed') as failed,
          count(*) filter (where event_name = 'artwork_record_saved') as artwork_records_saved,
          count(*) filter (where event_name = 'portfolio_inclusion_confirmed') as portfolio_inclusions
        from base
        where event_name in (
          'import_started',
          'import_completed',
          'import_partially_completed',
          'import_failed',
          'artwork_record_saved',
          'portfolio_inclusion_confirmed'
        )
        group by coalesce(nullif(metadata->>'source',''), 'unknown'), viewport
      ) source_counts
      left join (
        select
          coalesce(nullif(start_event.metadata->>'source',''), 'unknown') as source,
          start_event.viewport,
          percentile_cont(0.5) within group (
            order by extract(epoch from (finish_event.occurred_at - start_event.occurred_at)) / 60.0
          ) as median_completion_minutes
        from base start_event
        join lateral (
          select finish.occurred_at
          from base finish
          where finish.workflow_id = start_event.workflow_id
            and finish.event_name in ('import_completed','import_partially_completed')
            and finish.occurred_at >= start_event.occurred_at
          order by finish.occurred_at
          limit 1
        ) finish_event on start_event.workflow_id is not null
        where start_event.event_name = 'import_started'
        group by coalesce(nullif(start_event.metadata->>'source',''), 'unknown'), start_event.viewport
      ) duration_stats
        on duration_stats.source = source_counts.source
       and duration_stats.viewport = source_counts.viewport
    ) combined
  ),
  passport_usage as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'event_name', event_name,
          'mode', mode,
          'section', section,
          'people', people,
          'events', events
        )
        order by people desc, events desc, event_name
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        event_name,
        coalesce(nullif(metadata->>'mode',''), 'unspecified') as mode,
        coalesce(nullif(metadata->>'section',''), 'unspecified') as section,
        count(distinct person_key) as people,
        count(*) as events
      from base
      where event_name in (
        'passport_started',
        'passport_mode_selected',
        'passport_section_started',
        'passport_section_completed',
        'proposal_review_opened',
        'proposal_approved',
        'proposal_rejected',
        'passport_record_confirmed',
        'draft_restored',
        'autosave_succeeded',
        'autosave_failed'
      )
      group by event_name,
        coalesce(nullif(metadata->>'mode',''), 'unspecified'),
        coalesce(nullif(metadata->>'section',''), 'unspecified')
    ) grouped
  ),
  opportunity_engagement as (
    select jsonb_build_object(
      'directory_viewers', count(distinct person_key) filter (
        where event_name = 'opportunity_directory_viewed'
      ),
      'search_users', count(distinct person_key) filter (
        where event_name = 'search_performed'
      ),
      'filter_users', count(distinct person_key) filter (
        where event_name = 'filter_applied'
      ),
      'no_result_searches', count(*) filter (
        where event_name = 'search_no_results'
      ),
      'opportunity_openers', count(distinct person_key) filter (
        where event_name = 'opportunity_opened'
      ),
      'official_source_openers', count(distinct person_key) filter (
        where event_name = 'official_source_opened'
      ),
      'opportunity_savers', count(distinct actor_user_id) filter (
        where event_name = 'opportunity_saved'
      ),
      'readiness_viewers', count(distinct actor_user_id) filter (
        where event_name = 'readiness_viewed'
      ),
      'preparation_starters', count(distinct actor_user_id) filter (
        where event_name = 'application_preparation_started'
      )
    ) as value
    from base
  ),
  reliability as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'event_name', event_name,
          'error_code', error_code,
          'step', step,
          'source', source,
          'viewport', viewport,
          'count', event_count
        )
        order by event_count desc, event_name
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        event_name,
        coalesce(
          nullif(metadata->>'error_code',''),
          nullif(metadata->>'reason',''),
          'unspecified'
        ) as error_code,
        coalesce(nullif(metadata->>'step',''), 'unspecified') as step,
        coalesce(nullif(metadata->>'source',''), 'unknown') as source,
        viewport,
        count(*) as event_count
      from base
      where event_name in (
        'signup_validation_failed',
        'login_failed',
        'onboarding_validation_failed',
        'onboarding_save_failed',
        'passport_save_failed',
        'upload_failed',
        'import_failed',
        'autosave_failed',
        'session_expired',
        'user_visible_error'
      )
      group by event_name,
        coalesce(nullif(metadata->>'error_code',''), nullif(metadata->>'reason',''), 'unspecified'),
        coalesce(nullif(metadata->>'step',''), 'unspecified'),
        coalesce(nullif(metadata->>'source',''), 'unknown'),
        viewport
      order by event_count desc
      limit 30
    ) ranked
  ),
  recovery as (
    select jsonb_build_object(
      'recovery_offered', count(*) filter (
        where event_name = 'workflow_recovery_offered'
      ),
      'workflow_recovered', count(*) filter (
        where event_name = 'workflow_recovered'
      ),
      'session_recovered', count(*) filter (
        where event_name = 'session_recovered'
      ),
      'draft_restored', count(*) filter (
        where event_name = 'draft_restored'
      ),
      'recovery_success_rate_pct', case
        when count(*) filter (where event_name = 'workflow_recovery_offered') > 0
          then round(
            100.0 * count(*) filter (where event_name = 'workflow_recovered')
            / count(*) filter (where event_name = 'workflow_recovery_offered'),
            1
          )
        else null
      end
    ) as value
    from base
    where event_name in (
      'workflow_recovery_offered',
      'workflow_recovered',
      'session_recovered',
      'draft_restored'
    )
  ),
  feature_adoption as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'event_name', event_name,
          'people', people,
          'events', events
        )
        order by people desc, events desc, event_name
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        event_name,
        count(distinct person_key) as people,
        count(*) as events
      from base
      where event_name in (
        'import_source_selected',
        'import_completed',
        'import_partially_completed',
        'passport_mode_selected',
        'passport_section_completed',
        'proposal_approved',
        'proposal_rejected',
        'search_performed',
        'filter_applied',
        'opportunity_saved',
        'readiness_viewed',
        'application_preparation_started'
      )
      group by event_name
    ) grouped
  ),
  activation_cohorts as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'activation_week', activation_week,
          'activated_artists', activated_artists,
          'same_day_returned', same_day_returned,
          'day_1_returned', day_1_returned,
          'day_7_returned', day_7_returned,
          'day_14_returned', day_14_returned
        )
        order by activation_week
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        date_trunc('week', activated.occurred_at)::date as activation_week,
        count(distinct activated.actor_user_id) as activated_artists,
        count(distinct activated.actor_user_id) filter (
          where exists (
            select 1
            from public.product_events returned
            where returned.actor_user_id = activated.actor_user_id
              and returned.traffic_class = requested_traffic_class
              and returned.occurred_at > activated.occurred_at
              and returned.occurred_at < date_trunc('day', activated.occurred_at) + interval '1 day'
          )
        ) as same_day_returned,
        count(distinct activated.actor_user_id) filter (
          where exists (
            select 1
            from public.product_events returned
            where returned.actor_user_id = activated.actor_user_id
              and returned.traffic_class = requested_traffic_class
              and returned.occurred_at >= activated.occurred_at + interval '1 day'
              and returned.occurred_at < activated.occurred_at + interval '2 days'
          )
        ) as day_1_returned,
        count(distinct activated.actor_user_id) filter (
          where exists (
            select 1
            from public.product_events returned
            where returned.actor_user_id = activated.actor_user_id
              and returned.traffic_class = requested_traffic_class
              and returned.occurred_at >= activated.occurred_at + interval '7 days'
              and returned.occurred_at < activated.occurred_at + interval '8 days'
          )
        ) as day_7_returned,
        count(distinct activated.actor_user_id) filter (
          where exists (
            select 1
            from public.product_events returned
            where returned.actor_user_id = activated.actor_user_id
              and returned.traffic_class = requested_traffic_class
              and returned.occurred_at >= activated.occurred_at + interval '14 days'
              and returned.occurred_at < activated.occurred_at + interval '15 days'
          )
        ) as day_14_returned
      from base activated
      where activated.event_name = 'artist_activated'
        and activated.actor_user_id is not null
      group by date_trunc('week', activated.occurred_at)::date
    ) cohorts
  ),
  traffic_quality as (
    select coalesce(
      jsonb_object_agg(traffic_class, event_count),
      '{}'::jsonb
    ) as value
    from (
      select
        event_row.traffic_class,
        count(*) as event_count
      from public.product_events event_row
      where event_row.occurred_at >= range_start
        and event_row.occurred_at < range_end
      group by event_row.traffic_class
    ) grouped
  ),
  data_quality as (
    select jsonb_build_object(
      'traffic_classes', traffic_quality.value,
      'rejected_events', (
        select count(*)
        from private.product_event_ingestion_rejections rejection
        where rejection.created_at >= range_start
          and rejection.created_at < range_end
      ),
      'duplicate_attempts', (
        select count(*)
        from private.product_event_ingestion_rejections rejection
        where rejection.rejection_code = 'duplicate_event_ignored'
          and rejection.created_at >= range_start
          and rejection.created_at < range_end
      ),
      'unknown_traffic_events', (
        select count(*)
        from public.product_events event_row
        where event_row.occurred_at >= range_start
          and event_row.occurred_at < range_end
          and event_row.acquisition_source = 'unknown'
      ),
      'missing_event_versions', (
        select count(*)
        from public.product_events event_row
        where event_row.occurred_at >= range_start
          and event_row.occurred_at < range_end
          and event_row.event_version is null
      ),
      'last_successful_ingestion_at', (
        select max(event_row.created_at)
        from public.product_events event_row
      ),
      'last_rejection_at', (
        select max(rejection.created_at)
        from private.product_event_ingestion_rejections rejection
      )
    ) as value
    from traffic_quality
  )
  select jsonb_build_object(
    'range', jsonb_build_object(
      'start', range_start,
      'end', range_end,
      'traffic_class', requested_traffic_class,
      'acquisition_source', requested_acquisition_source,
      'viewport', requested_viewport
    ),
    'overview', jsonb_build_object(
      'visitors', overview.visitors,
      'signup_starts', overview.signup_starts,
      'confirmed_accounts', overview.confirmed_accounts,
      'onboarding_completions', overview.onboarding_completions,
      'first_value_artists', overview.first_value_artists,
      'activated_artists', overview.activated_artists,
      'upload_success_rate_pct', case
        when overview.import_starts > 0
          then round(100.0 * overview.successful_imports / overview.import_starts, 1)
        else null
      end,
      'opportunity_engaged_artists', overview.opportunity_engaged_artists,
      'error_free_workflow_rate_pct', case
        when overview.workflows > 0
          then round(
            100.0 * (overview.workflows - overview.failed_workflows)
            / overview.workflows,
            1
          )
        else null
      end
    ),
    'funnel', funnel.value,
    'onboarding_friction', onboarding_friction.value,
    'import_performance', import_performance.value,
    'passport_usage', passport_usage.value,
    'opportunity_engagement', opportunity_engagement.value,
    'reliability', reliability.value,
    'recovery', recovery.value,
    'feature_adoption', feature_adoption.value,
    'cohorts', activation_cohorts.value,
    'data_quality', data_quality.value,
    'sample_warnings', to_jsonb(array_remove(array[
      case
        when person_totals.people < 10
          then 'Fewer than 10 relevant people are represented; percentages are directional only.'
      end,
      case
        when coalesce(
          (data_quality.value->'traffic_classes'->>'internal_qa')::integer,
          0
        ) > coalesce(
          (data_quality.value->'traffic_classes'->>'real_user')::integer,
          0
        )
          then 'Internal QA activity exceeds real-user activity in this range.'
      end,
      case
        when coalesce(
          (data_quality.value->>'unknown_traffic_events')::integer,
          0
        ) > 0
          then 'Some acquisition sources remain unknown; source comparisons are incomplete.'
      end,
      'Analytics definitions changed with the founding artist beta architecture; compare counts alongside percentages.'
    ]::text[], null))
  )
  into result
  from overview,
    person_totals,
    funnel,
    onboarding_friction,
    import_performance,
    passport_usage,
    opportunity_engagement,
    reliability,
    recovery,
    feature_adoption,
    activation_cohorts,
    data_quality;

  return result;
end;
$$;

revoke all on function public.get_kleio_admin_analytics_snapshot(
  timestamptz,
  timestamptz,
  text,
  text,
  text
) from public;

grant execute on function public.get_kleio_admin_analytics_snapshot(
  timestamptz,
  timestamptz,
  text,
  text,
  text
) to authenticated;

comment on function public.get_kleio_admin_analytics_snapshot(
  timestamptz,
  timestamptz,
  text,
  text,
  text
) is
  'Administrator-only aggregate analytics snapshot. Returns counts, rates and privacy-safe dimensions without user UUIDs, private artist content or unrestricted raw events.';
