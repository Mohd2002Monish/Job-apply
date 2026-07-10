# Mobile-App Roadmap — remaining web-app parity features

Self-contained work list for finishing the mobile ⇄ web feature sync. Every backend
contract below was verified against `Back-end/routes/*.js` and the web components on
2026-07-11 — you can start any item without re-researching.

**Auth for every call:** `Authorization: Bearer <token>` header (`useAuth().token`),
URLs built with `api('/path')` from `src/constants/api.ts`.

**Testing recipe:** see `.claude/skills/verify/SKILL.md` (repo root) — run the app in
Chrome via `expo start --web --port 8081` against a backend on `:3001`, seed
`localStorage.reco_jwt` with a minted JWT.

---

## ✅ Already synced (don't redo)

Jobs list + URL extraction + delete + tracking badges · Outreach modal (tailor / ATS /
AI cover letter / send via `/apply`) · Interview Prep (text Q&A + grading) · Salary
negotiation · Discover (scraped-job digest + import) · Finder (shared jobs + import) ·
Settings modal (profile, upgrade via web pricing, logout) · Analytics · Recruiter Inbox
with AI suggest-reply · Builder (upload, edit details, PDF export via share sheet) ·
Web tab bar (`app-tabs.web.tsx`) de-templated.

---

## 1. Job status pipeline (Kanban parity) — HIGHEST PRIORITY, ~half a day

**Why first:** you can *see* a job's tracking badge on mobile but can't move it through
the pipeline. Checking your pipeline on the go is the #1 mobile use case.

**Backend (exists, no changes needed):**
- `PATCH /jobs/:id` body `{ status }` — enum: `saved | applied | opened | interview | offer | rejected`
  (`Back-end/middlewares/validate.js` → `updateJobSchema`).
- `statusHistory` is appended automatically server-side on every status change
  (`jobController.js updateJob`) — you get the timeline for free.
- Web reference: `Front-end/src/components/KanbanBoard.jsx:75`.

**Mobile plan:**
- `src/app/index.tsx`: make the job card's status area tappable → open a small
  bottom-sheet `Modal` listing the 6 statuses (reuse the pageSheet-modal pattern already
  in the file). On pick: optimistic `setJobs` update, `PATCH`, roll back + `Alert` on
  failure (mirrors web's optimistic Kanban).
- Add a horizontal status filter row above the FlatList (`All / Saved / Applied /
  Interview / Offer / Rejected`) — this is the mobile stand-in for Kanban columns.
- Optional polish: render `job.statusHistory` as a simple timeline in the status sheet
  (web equivalent: `JobTimeline.jsx`).

**Gotcha:** the card currently shows the *email tracking* badge (Sent/Opened/Replied).
Keep both: tracking badge top-right (read-only), pipeline status as the new tappable
chip. They are different dimensions (email outcome vs. your pipeline stage).

---

## 2. Multi-resume switching — ~half a day

**Why:** mobile always operates on the active resume; web users with several tailored
resumes can't switch on mobile.

**Backend (exists):**
- `GET /resume/list` → `{ resumes: [{ id, title }], activeResumeId }`
- `POST /resume/select` body `{ id }` → `{ resumeFileName, resumeData }`
- `POST /resume/delete` body `{ id }` → `{ resumes, activeResumeId }`

**Mobile plan:**
- `src/app/builder.tsx`: replace the single "Current Resume" line with a resume list —
  fetch `/resume/list` on focus, render rows (title + active check), tap → `/resume/select`
  → `await refreshUser()` (already exists in `useAuth`). Long-press or trash icon →
  confirm `Alert` → `/resume/delete`.
- Upload keeps working as-is; after upload re-fetch the list (backend adds the new
  resume and makes it active).

**Gotcha:** `refreshUser()` re-pulls `/auth/status`, which returns the *active* resume's
`resumeName`/`resumeData` — so the Parsed Data card updates automatically after select.

---

## 3. Cover-letter export (finish the flow) — ~2–3 hours

**Why:** mobile can generate + edit + send a cover letter (Outreach modal), but web can
also export it as PDF/DOCX. Small addition, completes the flow.

**Backend (exists):**
- Persist first: `PATCH /jobs/:id` body `{ coverLetter, templateId }`
  (mobile OutreachModal already PATCHes coverLetter before send).
- `POST /resume/cover-letter/export` body `{ jobId, format: 'pdf' | 'docx', templateId }`
  → binary (web ref: `CoverLetterTab.jsx:199`).

**Mobile plan:**
- `src/components/OutreachModal.tsx`: add an "Export PDF" button next to Generate.
  Copy the exact download pattern from `builder.tsx handleDownloadPdf`:
  `expoFetch` → `res.bytes()` → `new File(Paths.cache, name).write(bytes)` →
  `Sharing.shareAsync(file.uri)`. Persist the edited letter first.
- A dedicated "Letters" tab (web has one) is **not** worth it on mobile — per-job
  letters in Outreach cover the use case. Skip unless users ask.

---

## 4. Referrals card — ~2 hours

**Why:** referral program exists (web profile modal) but is invisible on mobile.

**Backend (exists, zero new calls needed):**
- `/auth/status` already returns `referralCode`, `referralClicks`, `referralConversions`
  — all in `useAuth().user` right now.
- Share link format (web ref `App.jsx:873`): `${API_BASE_URL}/r/${user.referralCode}`
  (the backend `GET /r/:code` counts the click and redirects).

**Mobile plan:**
- `src/components/SettingsModal.tsx`: add a "Refer & Earn" card — show the link,
  clicks, conversions; button uses React Native's built-in `Share.share({ message })`
  (no new dependency).

**Gotcha:** use `API_BASE_URL` (not `WEB_URL`) in the link — `/r/:code` lives on the
backend.

---

## 5. Voice interview practice — ~2–3 days, needs a dev build

**Why last:** highest effort, needs native modules, and the text-based Interview Prep
modal already covers the core need.

**Backend (exists):**
- Questions: reuse `POST /jobs/:id/interview-prep` (already used by InterviewPrepModal).
- Grading: `POST /jobs/:id/grade-voice-answer` body
  `{ questionId, transcript, durationSeconds, pacingWpm, fillerCount }`
  (web ref: `VoiceInterviewTab.jsx:315`).

**Mobile plan:**
- Web uses browser `SpeechRecognition` + `getUserMedia` — neither exists in RN. Use the
  `expo-speech-recognition` community package (config plugin; supports iOS
  `SFSpeechRecognizer` / Android `SpeechRecognizer`).
- ⚠️ This is a **native module**: it will NOT run in Expo Go or the web target. You need
  `npx expo prebuild` + a development build (`npx expo run:ios` / `run:android`), plus
  `NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription` in `app.json`.
- Client-side metrics, same as web: `durationSeconds` from a timer,
  `pacingWpm = words / (duration/60)`, `fillerCount` = regex count of
  `um|uh|like|you know` in the transcript.
- New `src/components/VoiceInterviewModal.tsx`, launched from a "Voice" button inside
  InterviewPrepModal.
- Fallback: if speech recognition is unavailable (Expo Go / web), show a "type your
  answer" input and post it as the transcript — the grader only needs text.

---

## 6. Housekeeping (do alongside any item above)

- [ ] **Delete `src/app/explore.tsx`** — dead Expo-template screen, not in the tab bar,
      but still a live route (`/explore`) via expo-router file routing. Check whether
      `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`, `external-link.tsx` become
      unused after deleting it, and remove those too.
- [ ] **Test the PDF share sheet on a real device/simulator** — the export request is
      verified end-to-end, but `expo-sharing`'s sheet is native-only and hasn't been
      tapped on-device yet (web target can't exercise it).
- [ ] **`inbox.tsx` pull-to-refresh** — inbox fetches once on mount; add
      `RefreshControl` to the FlatList (jobs screen could use it too).
- [ ] Consider surfacing `aiModelPreference` in SettingsModal — note: on web this is
      client-side localStorage (`AiModelSelector`), not a server setting; models list
      comes from `GET /auth/ai-models` (public).

## Fixed during planning (2026-07-11) — no action needed

- `OutreachModal.tsx` and `InterviewPrepModal.tsx` were calling `PUT /jobs/:id`, which
  doesn't exist (only `PATCH` does) — edited cover letters and typed interview answers
  were silently never persisted. Both now use `PATCH`.

## Suggested order

1 (status pipeline) → 2 (multi-resume) → 3 (cover-letter export) → 4 (referrals)
→ 6 (housekeeping) → 5 (voice, when you're ready for a dev build).

Items 1–4 are each a self-contained PR, safe to ship independently, and need no new
native dependencies — all four run in Expo Go and the web target.
