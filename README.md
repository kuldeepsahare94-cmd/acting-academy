# Acting Academy CRM — Mobile App (Phase 1)

React Native (Expo) app covering: login, a redesigned dashboard (greeting header,
quick actions, sectioned stat cards with icons — Leads/Followups/Academy),
lead list with search/filters (status, date range, source, State→City,
drill-down from dashboard), Add Lead form, lead detail with Call/WhatsApp/
SMS/Email/Maps actions, the post-call outcome modal with real date/time
pickers, activity timeline, manual Add Followup, followups screen (today +
missed), and a **More** tab with full Courses, Students, and Workshops
modules (add course, student profile with payment history and workshop
attendance, schedule workshops, register students and mark attendance).

This is the **mobile app only** — the piece you asked to build first. It
expects a Supabase backend with the tables in `supabase/schema_mobile_subset.sql`
and `supabase/schema_full_addon.sql`.

## 1. Prerequisites
- Node.js 18+
- An Expo account (free) — https://expo.dev
- A Supabase project (free tier is fine to start)
- Android device or emulator for testing

## 2. Set up the backend
1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema_mobile_subset.sql`, then
   `supabase/schema_full_addon.sql` (adds Courses, Students, Workshops,
   Payments, Activity Timeline, Notifications, Role Permissions, Audit Log —
   see `MODULES.md` for the full field/relationship reference).
3. Create at least one user via Supabase Auth, then insert a matching row
   into `user_profiles` with their role.
4. Copy your Project URL and anon key from Supabase → Settings → API.

## 3. Configure the app
```bash
cp .env.example .env
# then edit .env with your Supabase URL + anon key
```

## 4. Install and run
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go on an Android phone, or press `a` to launch
an emulator.

## 5. Build a real APK (no Mac/Android Studio required)
This project uses EAS Build, which builds the APK on Expo's servers.
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
When the build finishes, EAS gives you a direct download link to a
signed, installable `.apk`. Fill in `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` inside `eas.json` (or as EAS secrets)
before building, since `.env` isn't uploaded to the build servers.

## 6. Known limitation — call-end detection
Expo/React Native can't natively detect "the phone call just ended" —
Android doesn't expose that to third-party apps without a native
`BroadcastReceiver` on `PHONE_STATE`, which requires ejecting from the
managed Expo workflow. This app uses the practical, widely-used
workaround: when the user returns to the app after the native dialer
closes (`AppState` goes `background` → `active`), it opens the call
outcome modal and calculates duration from tap-to-call to that moment.
This is accurate for how the feature is actually used. If you need
telecom-level exactness (e.g. detecting duration even if the user leaves
the app open in the background), that's a bare-workflow addition — ask
and I'll scope it.

## What's next
- Web portal (React) — dashboard, lead management, admin, reports
- Payments module screens (record a payment against a student — schema
  already exists, see `MODULES.md`)
- Backend: Supabase Edge Functions for round-robin assignment, FB/IG lead
  webhook ingestion, scheduled push notifications (missed followup, payment
  due, workshop tomorrow)
- Full permissions-editor UI (role_permissions table is seeded for `leads`
  only so far)
