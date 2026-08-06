# KLEIO Visual Obstruction Audit

Generated from the current branch. This is an inventory, not an automatic verdict: every flagged surface requires product review.

- Files scanned: 266
- Files flagged: 106
- Flagged lines: 261

## Highest-priority files

### `components/kleio/live-artist-discovery.tsx` — score 36

clipped_overflow: 4, fixed: 2, large_min_height: 2, nested_scroll: 2, sticky: 1, viewport_edge: 4

- L18 · clipped_overflow: `const card = "overflow-hidden border border-[#E7E1F7] bg-white shadow-[0_18px_48px_rgba(82,64,130,0.06)]"`
- L32 · large_min_height: `<article className={`${card} group flex min-h-[460px] flex-col`}>`
- L33 · clipped_overflow: `<button type="button" onClick={onOpen} className="relative block min-h-[245px] overflow-hidden bg-[#F3EFF8] text-left">`
- L35 · viewport_edge: `<div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />`
- L51 · fixed, nested_scroll, viewport_edge: `return <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#201B2B]/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`${artist.professional_name} discovery profile`}>`
- L53 · sticky, viewport_edge: `<div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E7E1F7] bg-white/95 px-4 py-3 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Institution discovery profile</p><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-[#E7E1F7]" aria-label="Close profile"><X className="size-4" /></button></div>`
- L55 · clipped_overflow, large_min_height: `<div><div className="relative overflow-hidden bg-[#F3EFF8]">{artist.selected_works[0]?.image_url ? <img src={artist.selected_works[0].image_url || ""} alt={artist.selected_works[0].title} className="max-h-[620px] w-full object-contain" /> : <div className="grid min-h-[420px] place-items-center"><ImageIcon className="size-10 text-[#7867AA]" /></div>}{artist.profile_image_url && <img src={artist.profile_image_url} alt={`${artist.professional_name} portrait`} className="absolute bottom-5 right-5 as`
- L56 · clipped_overflow: `<div className="mt-8 grid gap-5 sm:grid-cols-2">{artist.selected_works.slice(1).map((work) => <figure key={work.id}><div className="grid min-h-52 place-items-center overflow-hidden bg-[#F3EFF8]">{work.image_url ? <img src={work.image_url} alt={work.title} className="max-h-[420px] w-full object-contain" /> : <ImageIcon className="size-6 text-[#7867AA]" />}</div><figcaption className="mt-2 border-t border-[#DDD7E7] pt-2 text-xs text-[#746F7C]"><strong className="text-[#292631]">{work.title}</stron`
- L70 · fixed, viewport_edge: `return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#201B2B]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite artist"><div className="w-full max-w-xl rounded-3xl border border-[#E7E1F7] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Opportunity-linked outreach</p><h2 className="mt-2 font-serif text-2xl">Invite {artist.professional_n`
- L88 · nested_scroll: `return <main className="h-full overflow-y-auto bg-[#FCFBFD] px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1320px] space-y-5"><WorkspacePageHeader eyebrow="Institution workspace" title="Artist Discovery" description="Browse artwork-led profiles that artists have explicitly chosen to share with authenticated institutions. Discovery is not an applicant ranking or a public social directory." secondaryCta={{ label: "Applicant records", href: "/artists/applicants/" }} />{message && <p role`

### `components/kleio/live-artist-message-center.tsx` — score 28

fixed: 3, nested_scroll: 1, viewport_edge: 2

- L242 · fixed: `className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A] shadow-[0_18px_50px_rgba(82,64,130,0.18)]"`
- L249 · fixed, nested_scroll, viewport_edge: `<div className="fixed inset-0 z-[90] overflow-y-auto bg-[#201B2B]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Institution opportunity invitations">`
- L295 · fixed, viewport_edge: `<div className="fixed inset-0 z-[100] grid place-items-center bg-[#201B2B]/65 p-4" role="dialog" aria-modal="true" aria-label="Report outreach">`

### `components/kleio/kleio-demo-guide.tsx` — score 22

clipped_overflow: 1, fixed: 2, nested_scroll: 2, viewport_edge: 1

- L383 · fixed: `<div className="kleio-demo-guide-anchor pointer-events-none fixed bottom-4 right-4 z-40 max-md:bottom-3 max-md:right-3">`
- L398 · fixed: `<div className="kleio-demo-guide-anchor fixed bottom-4 right-4 z-40 w-[min(100vw-1.5rem,21rem)] max-md:bottom-3 max-md:right-3" role="complementary" aria-label={locale === "es" ? "Demo guiado de KLEIO" : "KLEIO guided demo"}>`
- L408 · clipped_overflow: `<div className="kleio-demo-guide-panel max-h-[min(72dvh,38rem)] overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">`
- L422 · nested_scroll: `<div className="max-h-[min(54dvh,29rem)] overflow-y-auto px-3.5 py-3">`
- L456 · nested_scroll: `<ul className="mt-2 max-h-[18rem] space-y-2 overflow-y-auto pr-1">`
- L489 · viewport_edge: `<div className="absolute left-[0.875rem] top-5 bottom-5 border-l border-dashed border-[#D8D0F2]" aria-hidden />`

### `components/kleio/top-bar.tsx` — score 22

clipped_overflow: 2, high_z_index: 2, nested_scroll: 2, sticky: 1, viewport_edge: 3

- L85 · sticky, viewport_edge: `<header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 overflow-x-auto border-b border-border bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-4 xl:px-5">`
- L104 · clipped_overflow, viewport_edge, high_z_index: `<div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">`
- L112 · nested_scroll: `<div className="max-h-[23rem] overflow-y-auto p-1.5">`
- L138 · clipped_overflow, viewport_edge, high_z_index: `<div className="absolute right-0 top-11 z-50 w-[22rem] overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">`
- L140 · nested_scroll: `<div className="max-h-[20rem] overflow-y-auto p-1.5">{notificationThreads.map((thread) => { const linkedMessage = getDemoMessageForThread(thread.linkedMessageId); const task = taskForThread(thread, locale); const TaskIcon = task.icon; return <Link key={thread.id} href={`/messages/?thread=${thread.id}`} onClick={() => setNotificationsOpen(false)} className="block rounded-lg px-2.5 py-2.5 transition-colors hover:bg-accent/40"><div className="flex items-start gap-2.5"><InitialAvatar name={thread.co`

### `components/kleio/application-recipient-loop-panel.tsx` — score 21

clipped_overflow: 1, fixed: 2, high_z_index: 1, nested_scroll: 1, viewport_edge: 1

- L256 · fixed: `<button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#332A4D] px-5 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(51,42,77,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/30">`
- L261 · fixed, viewport_edge, high_z_index: `<div className="fixed inset-0 z-50 bg-[#201A2E]/35 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>`
- L262 · clipped_overflow: `<div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="recipient-loop-title" className="ml-auto flex h-full w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-[#E7E1F7] bg-[#F9F8FC] shadow-[0_30px_90px_rgba(32,26,46,0.28)]">`
- L268 · nested_scroll: `<div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">`

### `components/kleio/demo-internal-messenger-accent.tsx` — score 20

clipped_overflow: 1, fixed: 1, high_z_index: 1, nested_scroll: 2, viewport_height: 1

- L117 · fixed, high_z_index: `<div className="fixed bottom-4 right-5 z-50 max-lg:right-3">`
- L120 · viewport_height, clipped_overflow: `{open && selectedThread && <section className="flex max-h-[min(680px,calc(100vh-2rem))] w-[390px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-white shadow-[0_24px_72px_rgba(82,64,130,0.18)]">`
- L123 · nested_scroll: `<aside className="min-h-0 overflow-y-auto border-r border-[#E7E1F7] bg-[#FDFBFF] p-2">{visibleThreads.map((thread) => { const active = thread.id === selectedThread.id; const pageMatch = threadMatchesPath(thread, pathname); return <button key={thread.id} type="button" onClick={() => { setSelectedThreadId(thread.id); setDraft(""); setConfirmation(null) }} className={cn("mb-1 w-full rounded-2xl border px-2.5 py-2 text-left transition-colors", active ? "border-[#D8D0F2] bg-white shadow-sm" : "border`
- L126 · nested_scroll: `<ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">{selectedMessages.map((message) => <InternalMessageBubble key={message.id} message={message} self={message.author === session.name} es={es} />)}</ul>`

### `components/kleio/institution-messenger-live.tsx` — score 20

clipped_overflow: 1, fixed: 1, high_z_index: 1, nested_scroll: 2, viewport_height: 1

- L349 · fixed, high_z_index: `<div className="fixed bottom-4 right-5 z-50 max-lg:right-3">`
- L358 · viewport_height, clipped_overflow: `<section className="flex max-h-[min(720px,calc(100vh-2rem))] w-[440px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-white shadow-[0_24px_72px_rgba(82,64,130,0.18)]" aria-label={es ? "Mensajería interna de la institución" : "Internal institution messenger"}>`
- L375 · nested_scroll: `<aside className="min-h-0 overflow-y-auto border-r border-[#E7E1F7] bg-[#FDFBFF] p-2">`
- L396 · nested_scroll: `<ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">`

### `components/kleio/media-import/quick-media-import.tsx` — score 18

clipped_overflow: 2, fixed: 1, large_min_height: 1, nested_scroll: 1, viewport_edge: 1, viewport_height: 1

- L131 · fixed, viewport_height, clipped_overflow, viewport_edge: `className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-auto sm:max-h-[min(820px,calc(100dvh-32px))] sm:w-[min(920px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]"`
- L133 · large_min_height: `<div className="flex max-h-full min-h-full flex-col bg-[#FCFBFE] sm:min-h-[620px]">`
- L145 · nested_scroll: `<main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">`
- L158 · clipped_overflow: `<button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item)} className={`overflow-hidden rounded-2xl border bg-white text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}>`

### `components/kleio/artist-import-studio.tsx` — score 17

clipped_overflow: 2, fixed: 1, nested_scroll: 1, viewport_edge: 1, viewport_height: 1

- L511 · fixed, viewport_height, clipped_overflow, viewport_edge: `<dialog ref={dialogRef} aria-labelledby="drive-import-title" aria-describedby="drive-import-description" className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-[min(840px,calc(100dvh-32px))] sm:w-[min(1120px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]" onCancel={() => setStatus("Import progress is saved. Reopen the Studi`
- L520 · nested_scroll: `<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">`
- L544 · clipped_overflow: `<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{draft.items.map((item) => <article key={item.id} className="overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)]"><div className="grid aspect-[4/3] place-items-center bg-[#F4F1F8]">{previewUrls[item.id] ? <img src={previewUrls[item.id]} alt={item.fields.altText.value || "Selected artwork preview"} className="size-full object-cover" /> : <Loader2 className="size-4 animate-spin" />}`

### `components/kleio/instagram-import-gallery-ui.tsx` — score 14

clipped_overflow: 5, fixed: 1, high_z_index: 1, nested_scroll: 1, viewport_edge: 1

- L55 · clipped_overflow: `<div key={index} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white">`
- L100 · clipped_overflow: `<article className={`group overflow-hidden rounded-2xl border bg-white transition [content-visibility:auto] [contain-intrinsic-size:320px] ${selected ? "border-[#8C78BF] ring-2 ring-[#A997E8]/25" : "border-[#E7E1F7] hover:border-[#CFC4E8]"}`} aria-label={`${assetName(asset)}${selected ? ", selected" : ""}${saved ? ", already saved" : ""}`}>`
- L101 · clipped_overflow: `<div className="relative aspect-square overflow-hidden bg-[#F2EFF7]">`
- L192 · fixed, viewport_edge, high_z_index: `<div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211B2E]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>`
- L193 · clipped_overflow: `<div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="instagram-preview-title" aria-describedby="instagram-preview-description" className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[28px] border border-[#DED7EF] bg-white shadow-[0_30px_100px_rgba(25,18,40,0.3)] sm:max-h-[90vh] sm:rounded-[28px] lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.65fr)]">`
- L207 · nested_scroll: `<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">`
- L209 · clipped_overflow: `{carouselAssets.length > 1 && <div className="mt-4" aria-label="Carousel images"><p className="mb-2 text-xs font-semibold text-[#625C70]">Carousel images</p><div className="flex gap-2 overflow-x-auto pb-1">{carouselAssets.map((item) => <button key={item.id} type="button" className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#F3F0F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 ${item.id === asset.id ? "border-[#7964AD]" : "border-transpa`

### `components/kleio/profile/editorial-artist-profile.tsx` — score 14

clipped_overflow: 6, viewport_edge: 7

- L76 · clipped_overflow, viewport_edge: `<div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">`
- L77 · viewport_edge: `<div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(169,151,232,0.24),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(216,208,242,0.3),transparent_30%),linear-gradient(135deg,rgba(247,244,255,0.9),rgba(255,255,255,0.2))]" />`
- L79 · viewport_edge: `className="absolute inset-0 opacity-[0.075] mix-blend-multiply"`
- L103 · clipped_overflow: `<div className={`relative isolate overflow-hidden bg-[#F3EFF8] ${aspect}`}>`
- L107 · viewport_edge: `<img aria-hidden="true" src={src} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl saturate-75" />`
- L108 · viewport_edge: `<div className="absolute inset-0 bg-white/16" />`
- L145 · clipped_overflow: `<div className="absolute bottom-4 right-4 z-20 w-24 overflow-hidden border-[5px] border-[#FCFBFD] bg-[#EEE9F4] shadow-[0_18px_50px_rgba(40,32,52,0.2)] sm:w-32 lg:-right-16 lg:bottom-8 lg:w-36">`
- L210 · clipped_overflow: `<article className="relative mx-auto w-full max-w-[1440px] overflow-hidden bg-[#FCFBFD] text-[#242129]">`
- L212 · viewport_edge: `<div aria-hidden="true" className="absolute -left-44 top-[54rem] size-[380px] rounded-full bg-[#F5F1FC]/70 blur-3xl" />`
- L243 · viewport_edge: `<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-[#201C25]/42 via-[#201C25]/10 to-transparent" />`
- L279 · clipped_overflow: `<div className="relative overflow-hidden border border-[#E2DCEE] bg-white px-6 py-14 text-center">`
- L288 · clipped_overflow: `<div className="relative overflow-hidden border-y border-[#DDD7E7] bg-white/84 px-1 py-5 backdrop-blur-sm sm:px-5 lg:border lg:p-5">`

### `components/kleio/instagram-import-assist.tsx` — score 13

large_min_height: 1, sticky: 2

- L545 · large_min_height: `return <section className="grid min-h-[420px] place-items-center rounded-[28px] border border-[#E2DCF1] bg-[#FCFBFE] p-6" aria-labelledby="instagram-callback-title">`
- L606 · sticky: `{selectedCount > 0 && <div className="sticky bottom-3 z-30 mt-6 rounded-2xl border border-[#CFC4E8] bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_18px_60px_rgba(64,45,105,0.18)] backdrop-blur-md sm:p-4" aria-label="Instagram selection actions">`
- L648 · sticky: `{preparedPending.length > 0 && <section className="sticky bottom-3 z-20 mt-6 rounded-[22px] border border-[#CFC4E8] bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_18px_60px_rgba(64,45,105,0.18)] backdrop-blur-md" aria-labelledby="instagram-save-summary-title"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h4 id="instagram-save-summary-title" className="text-sm font-semibold text-[#292631]">Save this group once</h4><div className="m`

### `components/kleio/artist-sidebar.tsx` — score 12

fixed: 1, nested_scroll: 1, viewport_edge: 1

- L163 · fixed, viewport_edge: `<div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E7E1F7] bg-white px-3 md:hidden">`
- L195 · nested_scroll: `<nav className="flex-1 overflow-y-auto px-2.5 pb-3">`

### `components/kleio/landing-page.tsx` — score 12

clipped_overflow: 2, high_z_index: 1, sticky: 1, viewport_edge: 2

- L106 · sticky, viewport_edge, high_z_index: `<header className="sticky top-0 z-50 border-b border-[#EEEAF4] bg-white/95 backdrop-blur-xl">`
- L124 · viewport_edge: `<div aria-hidden="true" className="absolute left-[12%] top-12 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(229,221,247,0.55),rgba(255,255,255,0)_70%)]" />`
- L151 · clipped_overflow: `<section className="relative isolate overflow-hidden bg-white px-0 pb-10 sm:pb-16" aria-labelledby="landing-visual-title">`
- L156 · clipped_overflow: `<div className="relative mx-auto mt-4 max-w-[1440px] overflow-hidden bg-white">`

### `components/kleio/live-institution-opportunity-workspace.tsx` — score 12

clipped_overflow: 1, fixed: 1, nested_scroll: 1, viewport_edge: 1

- L91 · fixed, nested_scroll, clipped_overflow, viewport_edge: `return <div className="relative h-full"><LiveInstitutionCallsWithImages /><button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A] shadow-[0_18px_50px_rgba(82,64,130,0.18)]"><ImagePlus className="size-4" />Submission covers</button>{open && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#201B2B]/55 p-4 backdrop-blur-sm" role="dial`

### `components/kleio/sidebar.tsx` — score 12

fixed: 1, nested_scroll: 1, viewport_edge: 1

- L88 · fixed, viewport_edge: `<div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-3 md:hidden">`
- L97 · nested_scroll: `<nav className="flex-1 overflow-y-auto px-2.5 pb-3">`

### `app/globals.css` — score 11

sticky: 1, viewport_height: 1

- L319 · sticky: `position: sticky;`
- L321 · viewport_height: `max-height: calc(100dvh - 2rem);`

### `components/kleio/auth-gate.tsx` — score 10

viewport_height: 2

- L85 · viewport_height: `<div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">`
- L152 · viewport_height: `if (!auth || onboarding) return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-6"><div className="max-w-sm"><KleioAssistObject mode="reviewing" title={t("assist.object.complete.title")} description={t("assist.object.complete.description")} size="sm" compact /></div></div>`

### `components/kleio/live-institution-workspace.tsx` — score 10

high_z_index: 1, nested_scroll: 2, viewport_edge: 1

- L44 · nested_scroll: `return <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1180px] space-y-5"><WorkspacePageHeader eyebrow="Institution workspace" title={title} description={description} />{children}</div></main>`
- L128 · nested_scroll, viewport_edge, high_z_index: `return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm"><Bell className="size-4" />{unread > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">{unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-[mi`

### `components/kleio/public-pages/about-image-slideshow.tsx` — score 10

clipped_overflow: 2, sticky: 1, viewport_edge: 2

- L79 · sticky: `<aside className="relative mx-auto w-full max-w-[400px] lg:sticky lg:top-28 lg:mx-auto xl:max-w-[430px]">`
- L84 · clipped_overflow: `<div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-[1.45rem] bg-[#F7F4FF] shadow-[0_18px_46px_rgba(31,27,41,0.12)]">`
- L94 · viewport_edge: `"absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out [backface-visibility:hidden]",`
- L101 · viewport_edge: `<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1F1B29]/78 via-[#1F1B29]/24 to-transparent p-4 pt-16 text-white">`
- L123 · clipped_overflow: `className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]"`

### `components/kleio/application-preparation-workspace.tsx` — score 9

nested_scroll: 3

- L372 · nested_scroll: `return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto flex max-w-[1120px] items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing the application workspace…</div></main>`
- L376 · nested_scroll: `return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto max-w-[1120px] space-y-4"><Link className={secondary} href="/artist-dashboard/opportunities/"><ArrowLeft className="size-4" />Back to opportunities</Link><div role="alert" className={`${surface} border-red-200 text-sm text-red-700`}>{error}</div></div></main>`
- L385 · nested_scroll: `<main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">`

### `components/kleio/artist-workspace/artist-opportunities-page-view.tsx` — score 9

nested_scroll: 1, sticky: 1

- L99 · sticky: `<aside className="sticky top-6 rounded-2xl border bg-white" style={cardStyle}>`
- L185 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/demo-proof-links.tsx` — score 9

fixed: 1, high_z_index: 1

- L11 · fixed, high_z_index: `<div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1.5 rounded-full border border-[#E7E1F7] bg-white/90 px-2.5 py-2 shadow-[0_12px_34px_rgba(82,64,130,0.12)] backdrop-blur-sm max-md:hidden">`

### `components/kleio/messages-view.tsx` — score 9

clipped_overflow: 2, nested_scroll: 3

- L58 · nested_scroll: `<main className="flex h-full min-h-0 flex-col overflow-auto px-5 py-6 xl:px-7 xl:py-7">`
- L63 · clipped_overflow: `<section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">`
- L65 · nested_scroll: `<ul className="min-h-0 flex-1 overflow-y-auto">`
- L70 · clipped_overflow: `{selected && <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">`
- L73 · nested_scroll: `<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">{visibleMessages.map((message) => <div key={message.id} className="flex items-start gap-3"><InitialAvatar name={message.role === "System" ? "KLEIO" : message.author} className="size-8 text-[0.65rem]" /><div className="min-w-0 flex-1 rounded-2xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{message.author}</p><p classNa`

### `components/kleio/member-opportunity-directory.tsx` — score 8

sticky: 1, viewport_edge: 1

- L136 · sticky, viewport_edge: `<header className="sticky top-0 z-40 border-b border-[#E7E1F7] bg-white/95 backdrop-blur">`

### `components/kleio/demo-click-feedback-layer.tsx` — score 7

fixed: 1

- L210 · fixed: `<div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] w-[min(100vw-2rem,26rem)] -translate-x-1/2 rounded-2xl border border-[#E7E1F7] bg-white/95 px-4 py-3 shadow-[0_18px_48px_rgba(82,64,130,0.16)] backdrop-blur-md">`

### `components/kleio/demo-return-control.tsx` — score 7

fixed: 1

- L63 · fixed: `className="fixed bottom-3 left-3 z-[55] inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#5B4B8A] shadow-[0_10px_30px_rgba(82,64,130,0.14)] backdrop-blur-sm transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 md:bottom-4 md:left-4"`

### `app/artist-dashboard/applications/prepare/page.tsx` — score 6

nested_scroll: 2

- L19 · nested_scroll: `return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto max-w-[1120px] rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground">Preparing the application workspace…</div></main>`
- L33 · nested_scroll: `<div className="min-h-0 flex-1 overflow-y-auto">`

### `components/kleio/adaptive-artist-passport-experience.tsx` — score 6

clipped_overflow: 1, nested_scroll: 2

- L254 · nested_scroll: `{mode === "import" && <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl"><ArtistImportReview onPassportChanged={() => void reloadPassport()} /></div></main>}`
- L255 · nested_scroll, clipped_overflow: `{mode === "guided" && <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl">{loading ? <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />{es ? "Cargando tu Pasaporte…" : "Loading your Passport…"}</div> : <section className={card}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">{es ? `

### `components/kleio/artist-dashboard-view.tsx` — score 6

nested_scroll: 2

- L82 · nested_scroll: `<main className="kleio-artist-dashboard-main h-full overflow-y-auto bg-white text-[#292631]">`
- L122 · nested_scroll: `<main className="kleio-artist-dashboard-main h-full overflow-y-auto bg-white text-[#292631]">`

### `components/kleio/live-reviewer-workspace.tsx` — score 6

clipped_overflow: 1, nested_scroll: 2

- L98 · clipped_overflow: `<article className={`${surface} overflow-hidden`}>`
- L211 · nested_scroll: `if (loading) return <main className="h-full overflow-y-auto px-6 py-6"><div className="mx-auto flex max-w-[1120px] items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading assigned reviews…</div></main>`
- L214 · nested_scroll: `<main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">`

### `app/auth/accept-invite/page.tsx` — score 5

viewport_height: 1

- L8 · viewport_height: `<main className="grid min-h-screen place-items-center bg-[oklch(0.985_0.005_287)] px-5">`

### `components/kleio/artists-directory.tsx` — score 5

clipped_overflow: 3, nested_scroll: 1, viewport_edge: 1

- L64 · clipped_overflow: `<div className="size-16 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">`
- L113 · nested_scroll: `<main className="h-full overflow-auto px-6 py-6">`
- L151 · clipped_overflow, viewport_edge: `<div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_16px_40px_rgba(82,64,130,0.12)]">`
- L234 · clipped_overflow: `<div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">`

### `components/kleio/auth/accept-invitation.tsx` — score 5

viewport_height: 1

- L24 · viewport_height: `return <main className="grid min-h-screen place-items-center bg-[oklch(0.985_0.005_287)] px-5"><section className="w-full max-w-lg rounded-2xl border border-[#E7E1F7] bg-white p-7 shadow-sm">{accepted ? <><CheckCircle2 className="size-8 text-emerald-600" /><h1 className="mt-4 font-serif text-2xl font-semibold">Invitation accepted</h1><p className="mt-2 text-sm text-muted-foreground">Your institution membership is active and ready to use.</p><Link href="/collaborator-dashboard/" className="mt-5 i`

### `components/kleio/auth/auth-callback-client.tsx` — score 5

viewport_height: 1

- L128 · viewport_height: `<main className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">`

### `components/kleio/collaborator-shell.tsx` — score 5

viewport_height: 1

- L24 · viewport_height: `<div className="relative flex h-screen overflow-x-auto overflow-y-hidden bg-background text-foreground">`

### `components/kleio/public-page-shell.tsx` — score 5

viewport_height: 1

- L36 · viewport_height: `<div className="min-h-screen bg-white text-[#292631]">`

### `components/kleio/signup/signup-landing.tsx` — score 5

viewport_height: 1

- L8 · viewport_height: `<div className="flex min-h-screen flex-col bg-[oklch(0.985_0.005_287)]">`

### `components/kleio/signup/signup-shell.tsx` — score 5

clipped_overflow: 1, viewport_height: 1

- L28 · viewport_height: `<div className="min-h-screen bg-[oklch(0.985_0.005_287)]">`
- L68 · clipped_overflow: `<div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border">`

### `components/kleio/demo-safe-action.tsx` — score 4

high_z_index: 1, viewport_edge: 1

- L38 · viewport_edge, high_z_index: `<span className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-left text-[0.7rem] leading-snug text-[#6F6882] shadow-[0_14px_38px_rgba(82,64,130,0.12)]">`

### `components/kleio/opportunity-preview-image.tsx` — score 4

clipped_overflow: 1, viewport_edge: 2

- L71 · clipped_overflow: `<div className={`relative w-full overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br shadow-[0_18px_44px_rgba(70,54,114,0.10)] ${sizeClass} ${visual.classes}`}>`
- L77 · viewport_edge: `className="absolute inset-0 block size-full object-cover"`
- L79 · viewport_edge: `/> : <div className="absolute inset-0 flex min-w-0 flex-col justify-between p-4 sm:p-5">`

### `components/kleio/visual-artist-portfolio-studio.tsx` — score 4

clipped_overflow: 6, large_min_height: 1, nested_scroll: 1

- L53 · clipped_overflow: `<section className={`${surface} overflow-hidden`} aria-labelledby="new-work-editor-title">`
- L55 · large_min_height: `<div className="relative min-h-[320px] bg-[#F2EFF7] p-4 sm:p-6 lg:min-h-[620px] lg:p-8">`
- L56 · clipped_overflow: `<div className="flex h-full items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(58,43,92,0.14)]">`
- L158 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">`
- L162 · clipped_overflow: `<section className="relative overflow-hidden rounded-[28px] border border-[#DED7EF] bg-[linear-gradient(135deg,#F5F0FE_0%,#FFFFFF_55%,#F7F4FF_100%)] p-5 shadow-[0_24px_70px_rgba(82,64,130,0.08)] sm:p-7">`
- L169 · clipped_overflow: `{drafts.length > 0 && <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">New work queue</p><p className="mt-1 text-sm text-[#746E80]">Review one image at a time. The rest stay safely in the tray.</p></div><span className="rounded-full bg-[#EEE8FA] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]">{activeDraft + 1} of {drafts.length}</span></div><div className="flex `
- L171 · clipped_overflow: `{editing && <section className={`${surface} overflow-hidden`}><div className="flex items-center justify-between border-b border-[#E7E1F7] px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">Edit existing work</p><h2 className="mt-1 font-serif text-2xl font-semibold">{editing.title}</h2></div><button type="button" className="grid size-10 place-items-center rounded-xl border border-[#E7E1F7]" onClick={() => setEditing(null)} aria-label="Close artwork edi`
- L174 · clipped_overflow: `{loading ? <div className={`${surface} flex items-center justify-center p-8 text-sm text-[#746E80]`}><Loader2 className="mr-2 size-4 animate-spin" />Loading your portfolio…</div> : visibleWorks.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleWorks.map((work) => <article key={work.id} className="group overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_`

### `app/activity-log/page.tsx` — score 3

nested_scroll: 1

- L69 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `app/artist-dashboard/settings/page.tsx` — score 3

nested_scroll: 1

- L16 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">`

### `app/opportunities/submit/page.tsx` — score 3

nested_scroll: 1

- L12 · nested_scroll: `return <main className="h-full overflow-y-auto px-6 py-8"><div className="mx-auto max-w-3xl rounded-2xl border border-[#E7E1F7] bg-white p-6"><h1 className="font-serif text-2xl font-semibold">Submit an opportunity</h1><p className="mt-2 text-sm text-muted-foreground">Provider submissions are available only in an authenticated institution workspace. Guided-demo records remain synthetic and are not submitted for publication.</p></div></main>`

### `app/programs/[programId]/page.tsx` — score 3

nested_scroll: 1

- L53 · nested_scroll: `<main className="h-full overflow-auto px-6 py-6">`

### `app/submissions/[submissionId]/page.tsx` — score 3

nested_scroll: 1

- L45 · nested_scroll: `<main className="h-full overflow-auto px-6 py-6">`

### `app/submissions/page.tsx` — score 3

nested_scroll: 1

- L40 · nested_scroll: `<main className="h-full overflow-auto px-6 py-6">`

### `components/kleio/applicant-records-preview.tsx` — score 3

clipped_overflow: 1, nested_scroll: 1

- L10 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFD] px-4 py-5 sm:px-6 sm:py-6">`
- L22 · clipped_overflow: `<div className="size-14 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">`

### `components/kleio/artist-import-studio-page.tsx` — score 3

nested_scroll: 1

- L11 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8">`

### `components/kleio/artist-media-library.tsx` — score 3

clipped_overflow: 2, nested_scroll: 1

- L112 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">`
- L137 · clipped_overflow: `{loading ? <div className="flex items-center justify-center rounded-[22px] border border-[#E7E1F7] bg-white p-10 text-sm text-[#746E80]"><Loader2 className="mr-2 size-4 animate-spin" />Loading your private media library…</div> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => <article key={item.id} className="group overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)]">`
- L138 · clipped_overflow: `<div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#F4F1F8]">{item.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" loading="lazy" /> : item.mediaKind === "document" ? <FileText className="size-9 text-[#75639E]" /> : <ImageIcon className="size-9 text-[#75639E]" />}<span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A]">{`

### `components/kleio/artist-passport-view.tsx` — score 3

clipped_overflow: 2, nested_scroll: 1

- L64 · clipped_overflow: `<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">`
- L117 · clipped_overflow: `<div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">`
- L242 · nested_scroll: `<main className="h-full overflow-y-auto bg-background">`

### `components/kleio/artist-profile-page-view.tsx` — score 3

nested_scroll: 1

- L25 · nested_scroll: `<main className="h-full overflow-y-auto bg-white px-4 py-4 sm:px-6">`

### `components/kleio/artist-recipient-conversation.tsx` — score 3

nested_scroll: 1

- L94 · nested_scroll: `<div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4">`

### `components/kleio/artist-workspace/artist-applications-page-view.tsx` — score 3

nested_scroll: 1

- L35 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-calendar-page-view.tsx` — score 3

nested_scroll: 1

- L50 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-collaborators-page-view.tsx` — score 3

nested_scroll: 1

- L17 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-funding-page-view.tsx` — score 3

clipped_overflow: 1, nested_scroll: 1

- L24 · clipped_overflow: `<div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">`
- L43 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-insights-page-view.tsx` — score 3

nested_scroll: 1

- L47 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-messages-page-view.tsx` — score 3

nested_scroll: 1

- L25 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-opportunity-detail-page-view.tsx` — score 3

nested_scroll: 1

- L48 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/artist-workspace/artist-passport-page-view.tsx` — score 3

clipped_overflow: 1, nested_scroll: 1

- L33 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`
- L84 · clipped_overflow: `<div className="size-14 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">`

### `components/kleio/artist-workspace/artist-portfolio-page-view.tsx` — score 3

clipped_overflow: 2, nested_scroll: 1

- L26 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`
- L39 · clipped_overflow: `<article key={work.title} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: lavenderSoftLine }}>`
- L40 · clipped_overflow: `<div className="relative aspect-[4/3] overflow-hidden bg-[#F7F4FF]">`

### `components/kleio/artist-workspace/artist-settings-page-view.tsx` — score 3

nested_scroll: 1

- L36 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/collaborator-assignments-page-view.tsx` — score 3

nested_scroll: 1

- L49 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/collaborator-dashboard-view.tsx` — score 3

clipped_overflow: 1, nested_scroll: 1

- L30 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`
- L44 · clipped_overflow: `<div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${analytics.completionRate}%` }} /></div>`

### `components/kleio/collaborator-guidelines-page-view.tsx` — score 3

nested_scroll: 1

- L50 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/collaborator-messages-page-view.tsx` — score 3

nested_scroll: 1

- L24 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/collaborator-review-queue-page-view.tsx` — score 3

nested_scroll: 1

- L24 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/collaborator-sidebar.tsx` — score 3

nested_scroll: 1

- L100 · nested_scroll: `<nav className="flex-1 overflow-y-auto px-3 pb-4">`

### `components/kleio/collaborator-submitted-page-view.tsx` — score 3

nested_scroll: 1

- L20 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/creative-passport-workspace.tsx` — score 3

clipped_overflow: 1, nested_scroll: 1

- L93 · nested_scroll: `<main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">`
- L95 · clipped_overflow: `<header className={`${surface} overflow-hidden`}>`

### `components/kleio/demo-page-shell.tsx` — score 3

nested_scroll: 1

- L49 · nested_scroll: `<main data-kleio-guide-target={target} className="flex h-full min-h-0 flex-col overflow-auto px-5 py-6 xl:px-7 xl:py-7">`

### `components/kleio/forms/artist-beta-taxonomy-fields.tsx` — score 3

nested_scroll: 1

- L187 · nested_scroll: `<div id={`${id}-listbox`} role="listbox" className="mt-1 max-h-56 overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg">`

### `components/kleio/forms/artist-term-fields.tsx` — score 3

nested_scroll: 1

- L116 · nested_scroll: `<div id={`${id}-listbox`} role="listbox" className="mt-1 max-h-52 overflow-auto rounded-lg border border-[#E7E1F7] bg-white py-1 shadow-lg">`

### `components/kleio/institution-workspace/institution-settings-page-view.tsx` — score 3

nested_scroll: 1

- L30 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/institution-workspace/reports-new-page-view.tsx` — score 3

nested_scroll: 1

- L15 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/institution-workspace/templates-new-page-view.tsx` — score 3

nested_scroll: 1

- L25 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/institution-workspace/templates-page-view.tsx` — score 3

nested_scroll: 1

- L34 · nested_scroll: `<main className="h-full overflow-y-auto px-6 py-6">`

### `components/kleio/live-artist-identity-settings.tsx` — score 3

clipped_overflow: 3, nested_scroll: 1

- L103 · nested_scroll: `<main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">`
- L112 · clipped_overflow: `<div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-[#D8D0F2] bg-[#F7F4FF]">`
- L130 · clipped_overflow: `<section className={`${card} relative overflow-hidden`}>`
- L147 · clipped_overflow: `<div><div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#292631]">Works included in discovery</h3><p className="mt-1 text-xs text-[#7F7890]">Choose up to eight works. Other portfolio records remain private unless submitted in an application.</p></div><span className="text-xs font-semibold text-[#6A5896]">{selectedWorkIds.length}/8</span></div>{works.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{works.map((work) => <but`
