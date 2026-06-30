# KLEIO Demo Realism Patch v1

Copy these files into your Cursor project, replacing existing files where paths match.

Main changes:
- Replaces demo data with KLEIO Arthouse synthetic institution/program/collaborator/artist data.
- Analytics now calculate from `lib/kleio-data.ts` instead of disconnected dashboard numbers.
- Status donut center total now reads from analytics.
- Applications chart axis adapts to the real synthetic dataset.
- Review queue tabs and sidebar badges use calculated counts.
- Sidebar now shows KLEIO Arthouse and Mara Voss instead of ISCP/Olivia.
- Top bar buttons now point to relevant routes: Submissions, Shortlist, Messages, and `/programs/new`.
- Adds a subtle `KLEIO assist` analytics insight widget that supports the program team without making AI the product center.
- Selected Submission drawer now changes actions based on scenario/status.
- Adds `/programs/new` route for Open Call setup demo.

After copying:

```bash
npm run dev
```

If localhost works:

```bash
git add lib/kleio-data.ts lib/kleio-nav.ts components/kleio app/programs/new
git commit -m "Make KLEIO demo data calculated and scenario-driven"
git push
```

Then wait for GitHub Actions and refresh:
https://cowboyblurr.github.io/KLEIO-dashboard/
