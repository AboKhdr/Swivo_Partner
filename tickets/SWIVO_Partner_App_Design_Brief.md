# 🎨 SWIVO Partner App — Figma Design Brief

> **For:** UI/UX Designer (Figma)
> **Project:** SWIVO Partner Mobile Application (React Native)
> **Prepared by:** Senior Frontend Developer
> **Target Market:** Saudi Arabia (Riyadh first) — Arabic primary, English secondary, Hindi tertiary
> **Platforms:** iOS + Android (React Native)

---

## 1. 🎯 Application Overview

**SWIVO Partner** is a mobile application used by **two distinct user types** inside the same app, with role-based navigation:

1. **Tenant (Business Owner / Manager)** — Car wash business operator who receives orders, manages branches, staff, services, and packages.
2. **Biker (Field Worker / Technician)** — The employee who physically executes the order: goes to customer location (Mobile) or works at the shop (In-Shop), uploads proof photos, updates order status.

Both roles share the **same app binary** but see completely different screens after login, determined by the JWT role.

### Core Business Logic the App Must Support

- **Ring-Until-Accept:** Incoming orders must ring loudly until the tenant accepts or rejects (like a food delivery app for restaurants).
- **Payment is already authorized** before the tenant sees the order — the tenant just confirms acceptance.
- **Proof-of-Work is mandatory:** No order can be marked COMPLETED without an "After" photo — or an officially approved skip request with a mandatory reason.
- **Multi-branch support:** One tenant can have multiple branches, each with its own working hours, slot capacity, and assigned staff.
- **Real-time status updates:** Every status change (Accepted → Assigned → On The Way → Started → Completed) triggers a push notification to the customer and updates a visible timeline.

---

## 2. 👥 User Roles & Screen Split

### 2.1 TENANT Role (Owner or Manager)

The tenant manages the business side. Screens they need:

| Screen | Purpose |
|---|---|
| **Dashboard / Home** | Today's orders summary, pending acceptance, revenue snapshot, active bikers on duty |
| **Incoming Orders (Ring Screen)** | Full-screen modal when a new order arrives — ACCEPT / REJECT with 60-second countdown |
| **Orders List** | All orders filterable by status (Pending, Accepted, In Progress, Completed, Cancelled) |
| **Order Details** | Full order info: customer, vehicle, services, address (if Mobile), timeline, payment status, assign biker button |
| **Assign Biker Modal** | List of available bikers (OnDuty + not busy) with one-tap assignment |
| **Branches Management** | CRUD for branches — name, address, map pin, service areas |
| **Working Hours Setup** | Per-branch, per-day interval-based editor (e.g. 08:00-13:00, 16:00-22:00) + slot duration + buffer time |
| **Services Catalog** | Create/edit services with multilingual name, description, price per vehicle size, image |
| **Packages Builder** | Bundle services into discounted packages with expiry and usage count |
| **Staff Management** | Add/remove bikers, assign to branches, view OnDuty status |
| **Skip Photo Approval Queue** | Review biker skip requests — approve/reject with reason shown |
| **Subscription & Plan** | View current plan, commission rules applied, billing history (read-only in MVP) |
| **Settings** | Auto-accept toggle, notifications, language, logout |

### 2.2 BIKER Role (Field Technician)

The biker executes orders. Screens they need:

| Screen | Purpose |
|---|---|
| **OnDuty Toggle (Home)** | Big prominent switch: ON DUTY / OFF DUTY — with current location status indicator |
| **Assigned Orders List** | Chronologically sorted, showing next upcoming order prominently |
| **Order Details (Biker View)** | Customer contact (masked phone + call button), vehicle info, services checklist, address + navigation link |
| **Status Update Actions** | Large action buttons: ON_THE_WAY → STARTED → COMPLETED (each triggers GPS capture) |
| **Before Photo Upload** | Camera-first UI, allow up to 5 photos, auto-upload with progress indicator |
| **After Photo Upload** | Same as Before but **BLOCKING** — order cannot complete without this |
| **Skip Photo Request** | Form with mandatory reason dropdown (6 enum values) + free-text note (mandatory if "OTHER") |
| **Navigation Integration** | Deep link to Google Maps / Apple Maps / Waze with customer address |
| **Order History** | Personal history of executed orders |
| **Earnings (read-only)** | Completed orders count (no payout in MVP) |

---

## 3. 📱 Complete Screen Inventory (Shared + Role-Specific)

### Shared Screens (Both Roles)

1. **Splash Screen** — Logo + loading spinner
2. **Language Selector** (first launch only) — AR / EN / HI
3. **OTP Login — Phone Number Entry** — Saudi format (+966) with country flag
4. **OTP Login — Code Verification** — 4 or 6 digit code input with auto-submit, resend timer
5. **Role Detection Loading** — Brief screen post-login while JWT role is resolved
6. **Notifications Inbox** — List of all received push notifications
7. **Profile / Account Settings** — Name, phone, language, FCM permissions
8. **Support / Contact Us** — WhatsApp deep link + FAQ
9. **About / Terms / Privacy** — Static pages
10. **Error States** — No internet, server error, session expired
11. **Empty States** — No orders yet, no bikers yet, no packages yet

### Tenant-Only Screens

12. **Tenant Dashboard** (home)
13. **Incoming Order Ringing Modal** (full-screen, urgent)
14. **Orders List** (with filters + search)
15. **Order Details (Tenant View)** — includes Assign Biker button
16. **Assign Biker Bottom Sheet**
17. **Branches List**
18. **Branch Create/Edit** — with map picker
19. **Working Hours Editor** — week view with time intervals
20. **Services List**
21. **Service Create/Edit** — multilingual form, image upload, size pricing grid
22. **Packages List**
23. **Package Create/Edit** — service selector, discount, expiry
24. **Staff List**
25. **Add/Edit Staff Member** — select branch, role (biker/manager)
26. **Skip Approvals Queue**
27. **Skip Approval Details** — photo context + approve/reject CTA
28. **Subscription Plan View** (read-only)
29. **Tenant Settings** — auto-accept toggle, default branch, etc.

### Biker-Only Screens

30. **Biker Home** — OnDuty toggle hero + next order card
31. **My Assigned Orders**
32. **Order Details (Biker View)**
33. **Status Update Screen** — big action button per current state
34. **Before Photos Capture** — camera UI + gallery
35. **After Photos Capture** — camera UI + gallery (mandatory)
36. **Skip Photo Request Form**
37. **Skip Request Pending/Approved/Rejected States**
38. **Biker Order History**

---

## 4. 🎨 Design System Requirements

### 4.1 Brand & Visual Direction

- **Industry tone:** Automotive / service-industry — clean, trustworthy, efficient. Avoid overly playful.
- **Energy level:** Professional but approachable. This is a working tool, not a lifestyle app.
- **Primary color suggestion:** Deep blue or teal (trust + automotive). Designer has creative freedom but should align with SWIVO brand if one exists.
- **Accent color:** Bright action color (orange/yellow) for urgent actions — accept order, mark complete, upload photo.
- **Status colors (strict semantic use):**
  - Pending = amber/yellow
  - Accepted/In Progress = blue
  - Completed = green
  - Cancelled/Rejected = red
  - Skip Requested = purple/violet

### 4.2 Typography

- **Arabic:** Use a professional Arabic UI font (IBM Plex Sans Arabic, Almarai, or similar). Must support numbers cleanly.
- **English:** Inter, SF Pro, or system default.
- **Hindi:** Noto Sans Devanagari.
- **Sizes:** Establish a clear scale (H1/H2/H3/Body/Caption). Minimum body size 14sp for readability in bright outdoor conditions (bikers use the app in sunlight).

### 4.3 RTL Support (Critical)

- **Arabic must be RTL by default.** Every layout must have a mirrored variant.
- Icons that have directional meaning (arrows, chevrons, back buttons) must flip.
- Numbers and phone numbers stay LTR inside RTL text.
- Date/time formatting must respect locale (Gregorian + Hijri aware if possible).

### 4.4 Accessibility

- **Touch targets:** Minimum 44×44 points for all tappable elements — bikers may wear gloves.
- **Contrast:** WCAG AA minimum — this app is used outdoors in sunlight.
- **Loading states:** Every async action needs a visible state.
- **Error recovery:** Clear retry buttons, never dead-ends.

### 4.5 Component Library (Must Be Designed)

1. **Buttons:** Primary, Secondary, Destructive, Icon-only, Loading state, Disabled state
2. **Input fields:** Text, Phone (with country code), OTP cells, Search, Textarea, Number
3. **Selectors:** Dropdown, Bottom sheet picker, Date picker, Time picker, Image picker
4. **Cards:** Order card (3 variants: pending / in-progress / completed), Branch card, Service card, Staff card, Package card
5. **Status badges:** One for every order status + skip request statuses
6. **Modals:** Confirmation, Full-screen ringing modal, Bottom sheet, Alert
7. **Navigation:** Tab bar (role-specific), Stack header (with RTL back arrow), Drawer (optional)
8. **Lists:** Pull-to-refresh, Infinite scroll, Empty state, Skeleton loading
9. **Toasts / Snackbars:** Success, Error, Info, Warning
10. **Timeline component:** Vertical stepper showing order status progression with timestamps
11. **Photo upload tile:** Before/After proof photo grid with add/remove/preview
12. **Map component:** Full-screen map picker + static map thumbnail for order address
13. **Ringing screen:** Full-bleed attention-grabbing incoming-order screen

### 4.6 Icon Library

Use a consistent set — Lucide, Feather, or custom. Must include: car, calendar, clock, camera, check, x, arrow (directional), map pin, phone, bell, menu, user, settings, wallet, branch/store, biker/motorcycle.

---

## 5. 🧭 Navigation Architecture

### Tenant Bottom Tab Bar (4 tabs)

1. **Home** (Dashboard) — house icon
2. **Orders** — list icon with badge for pending count
3. **Manage** — store icon (opens menu: Branches, Services, Packages, Staff, Working Hours)
4. **Profile** — user icon

### Biker Bottom Tab Bar (3 tabs)

1. **Orders** (home) — list icon
2. **History** — clock icon
3. **Profile** — user icon

### Stack navigation

All deeper screens push on top of the tab. Back button always present in RTL-correct position.

---

## 6. ⚡ Key Interaction Flows (For Prototyping)

The designer should prototype these critical flows end-to-end:

### Flow 1: Tenant Accepts Incoming Order (Most Critical)
New order arrives → push notification + ringing sound → full-screen modal with countdown → ACCEPT → order moves to "Needs Assignment" → tap to open details → Assign Biker bottom sheet → select biker → biker gets push → tenant sees order in "Assigned" state.

### Flow 2: Biker Executes Order
OFF DUTY → tap to go ON DUTY → receive assigned order notification → open order → tap ON_THE_WAY → navigate via maps → arrive → tap STARTED → capture Before photos → perform work → capture After photos → tap COMPLETED → success state.

### Flow 3: Biker Requests Photo Skip (Edge Case)
At After photo screen → tap "Cannot upload photo" → form opens → select reason from dropdown → if "OTHER" → note becomes required → submit → pending state shown → push notification on approval → if approved, COMPLETED unlocks.

### Flow 4: Tenant Onboards a New Branch
Profile → Branches → Add Branch → fill name (AR + EN) → pick location on map → define service areas → save → configure working hours per day → done.

### Flow 5: Tenant Creates a Service
Manage → Services → Add Service → select category → fill multilingual name + description → upload image → set price for Small/Medium/Large → select availability (Mobile/InShop/Both) → save.

### Flow 6: OTP Login (Both Roles)
Open app → language select (first time) → phone number input with +966 → send OTP → 6-digit code screen with auto-read SMS → loading while role resolves → land on correct role home.

---

## 7. 🔔 Special UI States to Design

These are easy to forget but critical:

- **No internet connection** — banner at top + retry
- **Session expired** — modal forcing re-login
- **Order auto-cancelled** (timeout) — notification + strikethrough in list
- **Order being captured** (payment processing after COMPLETED) — loading overlay on order card
- **Wallet/refund notifications** (for customer-facing FCM, but tenant sees commission notice)
- **Skip request pending / approved / rejected** — 3 distinct visual states
- **Biker OnDuty but GPS outdated** — warning banner (GPS must update every 5 minutes)
- **Biker assigned to overlapping time slots** — prevented at backend, but UI must warn visually
- **Tenant auto-accept enabled** — banner on dashboard showing "Auto-accept ON"
- **After photo mandatory warning** — disabled COMPLETED button with tooltip explaining why

---

## 8. 📐 Technical Constraints Designer Must Respect

- **React Native rendering:** Avoid extreme blur effects, complex gradients, or heavy shadows — they degrade performance on Android mid-range devices.
- **Image sizes:** Uploaded photos go through Google Cloud Storage — design thumbnails at reasonable sizes (max 300×300 in lists).
- **Offline-first considerations:** Some screens (like assigned orders list) should indicate cached vs. live data.
- **Push notification deep-linking:** Design notification banners + tapping them lands on specific screens (order details, skip approval, etc.).
- **Camera permissions:** First-time photo capture needs a permission priming screen.
- **Keyboard behavior:** Forms must avoid keyboard overlapping inputs — design with safe areas in mind.
- **Dark mode:** Optional for MVP but structure design tokens to support it later.

---

## 9. 📦 Deliverables Expected From Designer

1. **Design file in Figma** with pages organized as:
   - Cover / Overview
   - Design System (colors, typography, components, icons)
   - Flows (each major flow on its own page)
   - Tenant Screens
   - Biker Screens
   - Shared Screens (Auth, Profile, Errors)
   - Prototypes (interactive for the 6 key flows above)

2. **All screens in 3 languages:** AR (RTL), EN (LTR), HI (LTR) — at minimum key screens.

3. **Responsive frames:** iPhone 14 (390×844), Android (360×800) at minimum.

4. **Asset exports:** Icons as SVG, images as PNG @1x/@2x/@3x.

5. **Handoff-ready:** Auto-layout everywhere, named layers, documented spacing tokens.

---

## 10. ⏱️ Suggested Timeline

- **Week 1:** Design system + low-fi wireframes for all screens
- **Week 2:** Hi-fi tenant screens + key flow prototypes
- **Week 3:** Hi-fi biker screens + shared screens + RTL variants
- **Week 4:** Polish + handoff + asset export

---

---

# 🤖 FIGMA AI DESIGN PROMPT

Copy-paste this into Figma AI, Uizard, Galileo AI, or any AI design tool:

---

> Design a production-ready React Native mobile application called **SWIVO Partner** — a dual-role app for car wash business operators in Saudi Arabia. The app serves two user types in one binary: **Tenants** (car wash business owners/managers) and **Bikers** (field technicians who execute the orders).
>
> **Brand & tone:** Professional, automotive, trustworthy. Primary color: deep teal or navy blue. Accent color: bright orange for urgent CTAs. Clean minimalist aesthetic, inspired by Careem Captain and Talabat Merchant apps, but more premium. Designed for outdoor sunlight visibility with high contrast (WCAG AA minimum).
>
> **Languages:** Arabic (RTL, primary), English, and Hindi. Use IBM Plex Sans Arabic for Arabic and Inter for Latin. Every screen must have both RTL and LTR variants. Numbers stay LTR inside Arabic text.
>
> **Target device:** iPhone 14 (390×844) and standard Android (360×800). All touch targets minimum 44×44pt (users may wear gloves).
>
> **Required screens (38 total):**
>
> **Shared (11):** Splash, Language selector, OTP phone entry with +966 country code, OTP code verification with auto-read SMS, role detection loader, notifications inbox, profile/account, support/WhatsApp, about/terms, error states (no internet, session expired, server error), empty states.
>
> **Tenant screens (18):** Dashboard with today's orders and active bikers summary, full-screen ringing modal for incoming orders with 60-second countdown and large ACCEPT/REJECT buttons, orders list with status filters and search, order details with customer info and timeline, assign-biker bottom sheet, branches list, branch create/edit with map picker, weekly working hours editor with time intervals, services list, service create/edit with multilingual fields and size-based pricing grid (Small/Medium/Large), packages list, package builder with service selector and discount, staff list, add/edit staff with branch assignment, skip photo approval queue, skip approval details with context photos, subscription plan read-only view, tenant settings with auto-accept toggle.
>
> **Biker screens (9):** Biker home with prominent OnDuty/OffDuty toggle and next-order card, assigned orders list sorted chronologically, order details for biker with call customer button and navigate-via-maps button, status update screen with large action button for current state (ON_THE_WAY → STARTED → COMPLETED), before-photos capture with camera-first UI and up to 5 photos, after-photos capture same style but blocking until uploaded, skip photo request form with mandatory reason dropdown (6 enum values) and conditional note field, skip request status screens (pending/approved/rejected), biker order history.
>
> **Design system to produce:** Color tokens including semantic status colors (pending=amber, in-progress=blue, completed=green, cancelled=red, skip=purple), typography scale (H1/H2/H3/Body/Caption), spacing scale (4/8/12/16/24/32), component library (primary/secondary/destructive buttons with loading and disabled states, input fields, OTP cells, dropdowns, bottom sheets, date/time pickers, order cards in 3 variants, branch/service/staff cards, status badges, confirmation and alert modals, full-bleed ringing modal, bottom tab bars — 4 tabs for tenant, 3 for biker — stack headers with RTL-aware back arrows, pull-to-refresh lists, skeleton loaders, empty states, toasts, vertical timeline stepper for order progression, photo upload grid tiles, map picker, static map thumbnails), icon set from Lucide or Feather.
>
> **Critical flows to prototype end-to-end (6):** (1) Tenant accepts a ringing incoming order and assigns a biker, (2) Biker goes OnDuty and executes an order from assigned to completed including before/after photos, (3) Biker requests a photo skip with mandatory reason, (4) Tenant onboards a new branch with map and working hours, (5) Tenant creates a new service with multilingual fields and size pricing, (6) OTP login flow for both roles with role-based landing.
>
> **Special states to include:** No internet banner, session expired modal, order auto-cancelled strikethrough, payment capture loading overlay, skip request 3-state visualization, biker OnDuty with outdated GPS warning, auto-accept-enabled banner, disabled COMPLETED button with tooltip when after photo is missing.
>
> **Navigation:** Tenant has bottom tab bar with 4 tabs (Home, Orders with pending count badge, Manage, Profile). Biker has bottom tab bar with 3 tabs (Orders, History, Profile). All stack screens push on top with back arrows that respect RTL mirroring.
>
> **Technical constraints:** Avoid heavy blurs, complex gradients, and large shadows to preserve Android performance. Design for offline-first awareness — cached-vs-live data indicators. Include camera permission priming screens. Keyboard-safe form layouts. Structure design tokens to support future dark mode.
>
> **Deliverables:** Organized Figma file with pages for Cover, Design System, Flows, Tenant, Biker, Shared screens, and Interactive Prototypes. Auto-layout on every frame. Named layers. Exports ready for developer handoff (SVG icons, PNG images at @1x/@2x/@3x).
>
> **Reference inspiration:** Careem Captain, Talabat Merchant, HungerStation Partner, Uber Driver — but cleaner, more premium, and Saudi-market localized.

---

**End of brief.**
