# Opportunity research and application preparation

## Purpose

KLEIO now creates an artist-owned research session when an artist opens a source-backed opportunity in the application preparation workspace. The workflow reviews public opportunity sources, records what was accessible, extracts explicit application requirements, and refreshes the existing Creative Passport readiness comparison.

The workflow prepares information for artist review. It does not guarantee eligibility, submit external forms, send email, bypass access controls, or claim that an inaccessible source was verified.

## User experience

The preparation page displays a discreet, minimizable research panel with these user-facing stages:

1. Reviewing the opportunity listing.
2. Opening the official application page.
3. Verifying eligibility details.
4. Checking submission requirements.
5. Confirming deadline, fees, and submission method.
6. Matching requirements with the Creative Passport.
7. Building the review-ready application package.

The panel exposes reviewed source links, access outcomes, requirement wording, and confidence labels. It never displays hidden chain-of-thought reasoning.

## Source priority and access rules

The worker begins with the stored application URL, canonical listing URL, and guidelines URL. It may follow a small number of same-organization public links whose labels or paths indicate applications, guidelines, eligibility, requirements, FAQs, submissions, or equivalent Spanish-language terms.

The worker:

- accepts public HTTP and HTTPS sources only;
- rejects credential-bearing, localhost, local-network, and private-address URLs;
- checks `robots.txt` conservatively;
- stops on login walls, CAPTCHAs, access-denied pages, and human-verification gates;
- limits the number of sources, response size, and fetch duration;
- records inaccessible or unsupported sources rather than guessing;
- does not use a search-engine API in this phase.

## Requirement extraction

The current worker recognizes explicit public-source language for common materials, including:

- biography;
- artist statement;
- CV or résumé;
- portfolio or work samples;
- project proposal;
- cover letter or letter of intent;
- budget;
- timeline or work plan;
- references;
- recommendation letters;
- application questions;
- accessibility information;
- proof of residency or identity;
- declarations and certifications.

Where wording is explicit, it also attempts to normalize word or character limits, work-sample counts, accepted file types, and maximum file size. Every extracted requirement retains its original wording, source URL, source title, retrieval time, confidence, and research-session reference.

## Confidence states

- **Verified** — explicit wording found on an official public source.
- **Corroborated** — substantially matching requirement language found on more than one public source.
- **Likely** — relevant wording found on a supporting source but still requiring artist verification.
- **Unresolved** — unavailable, contradictory, unsupported, or not safely extractable.
- **Outdated** — schema-supported for older source material; the current worker does not automatically promote old wording.

Only confirmed or ambiguous source requirements enter the existing readiness calculation. Unresolved source findings remain visible for review and do not become completed requirements.

## Creative Passport comparison

After research completes, the preparation workspace reloads and uses the existing requirement-by-requirement readiness logic. Readiness is based on actual stored requirements and currently approved Creative Passport content, including portfolio counts and supported word limits. Application-specific items, declarations, payments, third-party references, and human-verification steps remain artist-review items.

A readiness percentage is not a guarantee of eligibility or selection. Critical missing or unverified requirements remain blockers even when other materials are complete.

## Submission methods

The existing preparation workflow supports:

- native KLEIO submission for an authenticated internal open call;
- a reviewable `.eml` draft for source-verified email submissions;
- a downloadable JSON application manifest;
- an external-portal handoff;
- artist-reported external submission history.

KLEIO does not represent Gmail OAuth, external portal automation, or one-click external submission as connected unless a real integration is implemented and tested. Nothing is sent without explicit artist approval.

## Data and security

Research sessions, steps, sources, and findings are stored in dedicated tables with row-level security. An artist can create and read only their own sessions for currently visible opportunities. Artists cannot edit worker-generated findings or progress states. The Edge Function validates the signed-in user before using server credentials.

## Current limitations

- Public PDFs are recorded for manual review but are not parsed by this worker.
- JavaScript-only forms may expose too little server-rendered text for reliable extraction.
- The worker does not bypass account creation, authentication, CAPTCHAs, paywalls, or robots restrictions.
- It does not perform general web search or inspect social profiles without a stored public link.
- Heuristic extraction is intentionally conservative and will miss requirements whose wording is indirect or highly unusual.
- Generated project narratives remain artist-authored or artist-approved; this release does not add a model that invents application-specific facts.

## Recommended next phase

1. Add a safe PDF text-extraction service with page-level source citations.
2. Add an approved search provider for finding official organization pages when stored URLs are incomplete.
3. Add structured extraction review for administrators before new parsers can mark requirements verified at scale.
4. Add source-diff alerts when guidelines, deadlines, or requirements change.
5. Add portal-specific integrations only where terms, authentication, and technical reliability permit an honest submission claim.

## Verification checklist

- Database migrations applied to the KLEIO Supabase project.
- Research Edge Function deployed with manual bearer-token validation.
- Owner-scoped RLS added and hardened.
- Preparation page connected to session creation, polling, minimization, evidence display, and workspace refresh.
- Existing artist approvals and submission safeguards preserved.
- Security and performance advisors reviewed after schema changes.
