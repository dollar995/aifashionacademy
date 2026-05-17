# AI Fashion Academy — Static Platform

Premium written course platform (Arabic, RTL) covering 32 modules and ~170 written lessons. Static HTML/CSS/vanilla JS — ready for Netlify, Memberstack, and Lemon Squeezy.

---

## ✨ What was improved in this upgrade

1. **Premium visual polish layer** appended to `css/style.css`:
   - Gold (sand) accents added on top of the existing navy/cyan system for a luxury fashion-tech feel.
   - Refined typography rhythm, spacing, hover transitions, and focus rings.
   - Better exercise / note / checklist callout styling.
   - Responsive tables, safe overflow on `<pre>` / `<code>` blocks.
   - Logo size capped (`.logo-img` height = 36px, scales down on mobile).
   - Buttons get a subtle pulse, footer + login card get gold trim.
   - Print stylesheet hides chrome when students print lessons/worksheets.

2. **Local progress tracking (`js/progress.js`)** — `localStorage`-only:
   - Adds a *"اعتبر الدرس مكتمل"* (Mark as complete) button to every lesson page.
   - Adds a top reading-progress bar on every lesson page.
   - Tracks the last visited lesson and updates the dashboard *Continue learning* CTA.
   - Updates the dashboard progress ring + percentage in real time.
   - Updates each module card's progress bar & "X/Y دروس" counter on the dashboard.
   - Marks completed lessons on module pages.
   - Computes per-module totals from a built-in `LESSONS_PER_MODULE` map.

3. **Mobile / tablet pass** — collapsible sidebars, single-column lesson nav buttons, capped headings, no horizontal scroll.

4. **No content was removed.** No video sections were added. No fake auth, no real payment URL, no backend.

---

## 🧠 How progress tracking works (read this!)

> ⚠️ **This is local browser tracking only.**
> Progress is stored in `localStorage` under the keys `aifa_completed_lessons_v1` and `aifa_last_lesson_v1`.
> It is **NOT** synced to any server, **NOT** tied to the Memberstack account, and will reset if the student clears browser data or switches device.

### Upgrading to account-based tracking later

Open `js/progress.js`. Replace the three helpers at the top:

- `loadCompleted()` / `saveCompleted(map)` — read/write a `{ "1-1": true, ... }` map.
- `setLastLesson(id, href)` / `getLastLesson()` — read/write `{ id, href, ts }`.

Wire them to Memberstack member metadata or Supabase. Nothing else needs to change.

---

## 🚀 Deploy to Netlify

1. Drag-and-drop the entire `academy/` folder onto https://app.netlify.com/drop **OR** connect this folder to a Netlify site.
2. The included `netlify.toml` is already configured.
3. No build step. Pure static files.

All asset paths are **relative**, so the site also works opened locally or under a sub-path.

---

## 🔐 Memberstack integration

Memberstack-ready placeholders are already inside every page:

```html
<!-- MEMBERSTACK SCRIPT GOES HERE -->
<!-- MEMBERSTACK LOGIN FORM -->
<!-- MEMBERSTACK LOGIN BUTTON -->
<!-- MEMBERSTACK LOGOUT BUTTON -->
<!-- MEMBERSTACK REDIRECT AFTER LOGIN -->
<!-- MEMBERSTACK FULL ACCESS PLAN REQUIRED -->
<!-- PROTECTED MEMBER-ONLY CONTENT -->
```

- The Memberstack `<script>` tag at the top of each page already references `data-memberstack-app="..."`. Replace the app ID with your own if needed.
- Login form (`login.html`) uses `data-ms-form="login"` plus `data-ms-member="email|password"` — works out of the box once your Memberstack app is configured.
- Logout button on `dashboard.html` uses `data-ms-action="logout"`.

### Pages

| Public                       | Protected (Memberstack — Full Access plan) |
| ---------------------------- | ------------------------------------------- |
| `index.html`                 | `dashboard.html`                            |
| `login.html`                 | `modules/*.html`                            |
| `privacy-policy.html`        | `lessons/*.html`                            |
| `terms-of-use.html`          | `prompt-library.html`                       |
| `refund-policy.html`         | `worksheets.html`                           |
| `thank-you.html`             | `downloads.html`                            |
| `payment.html`               | `roadmap.html`                              |

In Memberstack, gate all the **Protected** pages behind the *Full Access* plan.

---

## 💳 Lemon Squeezy checkout

The pricing / CTA buttons in `index.html` and `payment.html` are wrapped with placeholder comments:

```html
<!-- REPLACE WITH LEMON SQUEEZY CHECKOUT URL -->
<a href="#" class="btn btn-primary cta-hero">اشترك الآن</a>
```

Replace `href="#"` with your real Lemon Squeezy hosted checkout URL when launching.

> **Refund policy reminder** — copy in the offer section explicitly says *14 days only*. Keep this consistent with `refund-policy.html`.

---

## 📁 Project structure

```
academy/
├── index.html              ← sales page (public)
├── login.html              ← Memberstack login (public)
├── dashboard.html          ← student dashboard (protected)
├── modules/                ← 32 module overview pages (protected)
├── lessons/                ← ~170 written lesson pages (protected)
├── prompt-library.html     ← (protected)
├── worksheets.html         ← (protected)
├── downloads.html          ← (protected)
├── roadmap.html            ← (protected)
├── payment.html            ← (public)
├── thank-you.html          ← (public)
├── privacy-policy.html     ← (public)
├── terms-of-use.html       ← (public)
├── refund-policy.html      ← (public)
├── css/style.css           ← single global stylesheet (premium polish layer at the bottom)
├── js/main.js              ← header / nav / FAQ / copy-prompt / countdown
├── js/progress.js          ← localStorage progress tracker (added in upgrade)
├── assets/                 ← logo, mockups, lesson visuals, downloads, etc.
├── downloads/              ← worksheets PDFs etc.
├── resources/
├── netlify.toml
└── robots.txt
```

---

## ✅ Final QA checklist

- [x] Every lesson page exposes a “mark complete” control.
- [x] Dashboard progress ring + per-module bars reflect localStorage state on load.
- [x] Continue-learning CTA jumps to the next unfinished lesson (or last visited).
- [x] No fake auth, no real Lemon Squeezy URL, no backend dependency.
- [x] Logo height is controlled across desktop & mobile.
- [x] Tables, prompts, and code blocks scroll safely on mobile.
- [x] All Memberstack & Lemon Squeezy placeholder comments are preserved.

Enjoy shipping ✨
