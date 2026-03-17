# Repo Map — Sarthak Tour and Travels

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma v7 · PostgreSQL (Neon) · Auth.js v5

---

## Root Config

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript config |
| `eslint.config.mjs` | ESLint rules |
| `postcss.config.mjs` | PostCSS / Tailwind v4 |
| `components.json` | shadcn/ui registry |
| `prisma.config.ts` | Prisma CLI config |

## prisma/

| File | Purpose |
|------|---------|
| `schema.prisma` | All database models and enums |
| `seed.ts` | Seed script for initial data |

---

## src/app/ — Pages & API

### Root

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout — fonts, metadata, providers |
| `page.tsx` | Public homepage |
| `globals.css` | Global Tailwind styles |
| `error.tsx` | Root error boundary |
| `not-found.tsx` | 404 page |
| `robots.ts` | SEO robots.txt |
| `sitemap.ts` | SEO sitemap.xml |

### (customer)/ — Public Pages

| File | Purpose |
|------|---------|
| `layout.tsx` | Customer layout wrapper |
| `booking/page.tsx` | Booking request form |
| `contact/page.tsx` | Contact / enquiry page |
| `track/page.tsx` | Booking tracking page |

### admin/ — Admin Dashboard

| File | Purpose |
|------|---------|
| `layout.tsx` | Admin layout with sidebar/topbar |
| `page.tsx` | Dashboard home |
| `login/page.tsx` | Admin login page |
| `bookings/page.tsx` | Bookings list |
| `bookings/[id]/page.tsx` | Booking detail (includes duty slip card) |
| `customers/page.tsx` | Customers list |
| `customers/[id]/page.tsx` | Customer profile |
| `drivers/page.tsx` | Drivers list + add/edit with vehicle fields |
| `vendors/page.tsx` | Vendors list |
| `duty-slips/page.tsx` | Duty slips list |
| `invoices/page.tsx` | Invoices list |
| `payments/page.tsx` | Payments list |
| `refunds/page.tsx` | Refunds list |
| `expenses/page.tsx` | Expenses list |
| `reports/page.tsx` | Reports hub |
| `reports/revenue/page.tsx` | Revenue report |
| `reports/profit-loss/page.tsx` | P&L report |
| `reports/outstanding-dues/page.tsx` | Outstanding dues report |
| `reminders/page.tsx` | Reminders list |
| `activity-logs/page.tsx` | Audit trail |
| `settings/page.tsx` | Company info + notification settings |

### driver/ — Driver Portal (token-gated)

| File | Purpose |
|------|---------|
| `layout.tsx` | Driver portal layout |
| `ride/[token]/page.tsx` | Ride detail — duty slip form, pricing, payments |

### invoice/ — Public Invoice

| File | Purpose |
|------|---------|
| `[token]/page.tsx` | Shareable invoice view |

### api/ — REST API Routes

#### Auth
| Route | File | Purpose |
|-------|------|---------|
| `/api/auth/[...nextauth]` | `auth/[...nextauth]/route.ts` | Auth.js handler |

#### Bookings
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/bookings` | `bookings/route.ts` | List / create bookings |
| `GET /api/bookings/admin` | `bookings/admin/route.ts` | Admin bookings with filters |
| `GET/PATCH /api/bookings/[id]` | `bookings/[id]/route.ts` | Get / update booking |
| `PATCH /api/bookings/[id]/status` | `bookings/[id]/status/route.ts` | Update booking status |
| `GET/POST /api/bookings/[id]/notes` | `bookings/[id]/notes/route.ts` | Booking internal notes |
| `PATCH /api/bookings/[id]/assign-driver` | `bookings/[id]/assign-driver/route.ts` | Assign driver + auto-create duty slip |
| `PATCH /api/bookings/[id]/assign-pricing` | `bookings/[id]/assign-pricing/route.ts` | Set pricing details |
| `PATCH /api/bookings/[id]/car-source` | `bookings/[id]/car-source/route.ts` | Update vehicle source |
| `GET /api/bookings/[id]/driver-link` | `bookings/[id]/driver-link/route.ts` | Generate driver portal link |

#### Customers
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/customers` | `customers/route.ts` | List / create customers |
| `GET/PATCH/DELETE /api/customers/[id]` | `customers/[id]/route.ts` | Single customer CRUD |

#### Drivers
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/drivers` | `drivers/route.ts` | List / create drivers |
| `GET/PATCH/DELETE /api/drivers/[id]` | `drivers/[id]/route.ts` | Single driver CRUD |

#### Vendors
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/vendors` | `vendors/route.ts` | List / create vendors |
| `GET/PATCH/DELETE /api/vendors/[id]` | `vendors/[id]/route.ts` | Single vendor CRUD |

#### Duty Slips
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/duty-slips` | `duty-slips/route.ts` | List all duty slips |

#### Invoices
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/invoices` | `invoices/route.ts` | List / create invoices |
| `GET/PATCH/DELETE /api/invoices/[id]` | `invoices/[id]/route.ts` | Single invoice CRUD |
| `GET /api/invoices/[id]/pdf` | `invoices/[id]/pdf/route.ts` | Generate invoice HTML/PDF |
| `POST /api/invoices/[id]/share` | `invoices/[id]/share/route.ts` | Generate shareable link |
| `GET /api/invoices/public/[token]` | `invoices/public/[token]/route.ts` | Public invoice by token |
| `POST /api/invoices/sign` | `invoices/sign/route.ts` | Sign/finalize invoice |

#### Payments
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/payments` | `payments/route.ts` | List / record payments |
| `GET/PATCH/DELETE /api/payments/[id]` | `payments/[id]/route.ts` | Single payment CRUD |

#### Refunds
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/refunds` | `refunds/route.ts` | List / create refunds |
| `GET/PATCH/DELETE /api/refunds/[id]` | `refunds/[id]/route.ts` | Single refund CRUD |

#### Expenses
| Route | File | Purpose |
|-------|------|---------|
| `GET/POST /api/expenses` | `expenses/route.ts` | List / create expenses |
| `GET/PATCH/DELETE /api/expenses/[id]` | `expenses/[id]/route.ts` | Single expense CRUD |

#### Driver Portal (token-gated, no auth)
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/driver/ride/[token]` | `driver/ride/[token]/route.ts` | Ride info by token |
| `GET /api/driver/ride/[token]/pricing` | `driver/ride/[token]/pricing/route.ts` | View/confirm pricing |
| `GET /api/driver/ride/[token]/invoice` | `driver/ride/[token]/invoice/route.ts` | Fetch invoice for ride |
| `POST /api/driver/ride/[token]/payment` | `driver/ride/[token]/payment/route.ts` | Record payment collected |
| `PATCH/POST /api/driver/ride/[token]/duty-slip` | `driver/ride/[token]/duty-slip/route.ts` | Save draft / submit duty slip |
| `POST /api/driver/ride/[token]/share` | `driver/ride/[token]/share/route.ts` | Share ride link |

#### Reports
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/reports/summary` | `reports/summary/route.ts` | Dashboard summary stats |
| `GET /api/reports/revenue` | `reports/revenue/route.ts` | Revenue data |
| `GET /api/reports/profit-loss` | `reports/profit-loss/route.ts` | P&L data |
| `GET /api/reports/outstanding` | `reports/outstanding/route.ts` | Outstanding dues |
| `GET /api/reports/charts` | `reports/charts/route.ts` | Dashboard chart data |
| `GET /api/reports/export` | `reports/export/route.ts` | CSV/Excel export |

#### Misc
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/notifications` | `notifications/route.ts` | List notifications |
| `GET/POST /api/reminders` | `reminders/route.ts` | Reminders CRUD |
| `GET /api/activity-logs` | `activity-logs/route.ts` | Audit log entries |
| `GET/PATCH /api/settings` | `settings/route.ts` | Agency settings |
| `GET /api/track` | `track/route.ts` | Public booking tracking |

---

## src/components/

### admin/
| File | Purpose |
|------|---------|
| `sidebar.tsx` | Navigation sidebar |
| `sidebar-context.tsx` | Sidebar collapse state context |
| `topbar.tsx` | Top navigation bar |
| `mobile-nav.tsx` | Mobile drawer navigation |
| `dashboard-view.tsx` | Dashboard stats/charts |
| `dashboard-actions.tsx` | Dashboard quick actions |
| `admin-booking-form.tsx` | Admin booking create/edit form |
| `booking-calendar.tsx` | Calendar view of bookings |

### customer/
| File | Purpose |
|------|---------|
| `header.tsx` | Public site header/navbar |
| `footer.tsx` | Public site footer |
| `image-carousel.tsx` | Fleet image carousel |
| `testimonials.tsx` | Testimonials section |

### shared/
| File | Purpose |
|------|---------|
| `providers.tsx` | App providers (session, toaster, i18n) |
| `page-header.tsx` | Reusable page title header |
| `empty-state.tsx` | Empty list state UI |
| `loading-spinner.tsx` | Loading spinner |
| `confirm-dialog.tsx` | Confirmation modal |
| `status-badge.tsx` | Status badge chip |
| `language-switcher.tsx` | EN/HI/MR language switcher |
| `structured-data.tsx` | JSON-LD SEO data |

### ui/ (shadcn/ui)
`avatar` · `badge` · `button` · `calendar` · `card` · `checkbox` · `command` · `dialog` · `dropdown-menu` · `form` · `input` · `label` · `popover` · `radio-group` · `select` · `separator` · `sheet` · `skeleton` · `sonner` · `switch` · `table` · `tabs` · `textarea` · `tooltip`

---

## src/lib/

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma client singleton with Neon adapter |
| `auth.ts` | Auth.js server config with Prisma adapter |
| `auth.config.ts` | Edge-safe Auth.js config (no DB) |
| `utils.ts` | Tailwind `cn()` merge utility |
| `constants.ts` | App constants (statuses, enums, labels) |
| `api-helpers.ts` | API response helpers, pagination, auth guards |
| `rate-limit.ts` | In-memory rate limiter |

### lib/helpers/
| File | Purpose |
|------|---------|
| `date.ts` | Date formatting utilities |
| `currency.ts` | Currency formatting (INR) |
| `gst.ts` | GST calculation helpers |
| `booking-id.ts` | Booking ID generator |
| `download-pdf.ts` | Client-side PDF download helper |

### lib/i18n/
| File | Purpose |
|------|---------|
| `index.ts` | i18n entry + interpolation |
| `types.ts` | Translation key types |
| `language-context.tsx` | Language state context |
| `label-maps.ts` | Enum-to-label translation maps |
| `en.ts` | English translations |
| `hi.ts` | Hindi translations |
| `mr.ts` | Marathi translations |

---

## src/services/

| File | Purpose |
|------|---------|
| `email.service.ts` | Email via Resend (lazy init) |
| `whatsapp.service.ts` | WhatsApp via Twilio (lazy init) |
| `notification.service.ts` | Orchestrates email + WhatsApp |
| `invoice.service.ts` | Invoice creation/computation |
| `pdf.service.ts` | Invoice HTML/PDF generation |
| `export.service.ts` | CSV/Excel report exports |
| `activity-log.service.ts` | Audit trail logging |

---

## src/validators/

| File | Purpose |
|------|---------|
| `auth.validator.ts` | Login credentials schema |
| `booking.validator.ts` | Booking create/update schema |
| `common.validator.ts` | Shared reusable field schemas |
| `driver.validator.ts` | Driver create/update schema |
| `duty-slip.validator.ts` | Duty slip draft/submit schema |
| `expense.validator.ts` | Expense create/update schema |
| `invoice.validator.ts` | Invoice creation schema |
| `payment.validator.ts` | Payment recording schema |
| `refund.validator.ts` | Refund creation schema |
| `settings.validator.ts` | Agency settings schema |
| `vendor.validator.ts` | Vendor create/update schema |

---

## src/types/

| File | Purpose |
|------|---------|
| `next-auth.d.ts` | Auth.js session type augmentation |

## src/middleware.ts
Auth.js edge middleware guarding `/admin` and `/driver` routes.

---

## Notes
- `total expense = tollCharges + driverAllowance + extraCharges`
- External SDK clients (Resend, Twilio) use lazy initialization pattern
- Prisma v7 requires explicit Neon adapter in client constructor
- Zod v4 — use `parsed.error.issues[0]` not `parsed.error.errors[0]`
- i18n: three languages (EN/HI/MR) with `useT()` hook
