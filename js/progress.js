/* ═══════════════════════════════════════════════════════════════
   AI Fashion Academy — Local Progress Tracker
   ───────────────────────────────────────────────────────────────
   IMPORTANT (READ BEFORE EDITING):
   - This is **local browser progress tracking only** (localStorage).
   - Progress is stored in the current browser/device only.
   - It is **NOT** server-side tracking. Nothing is saved to any database.
   - If the student clears browser data or uses another device,
     progress will reset.
   - To upgrade to account-based tracking later, replace the helpers
     `loadCompleted()` / `saveCompleted()` / `setLastLesson()` with calls
     to Memberstack metadata or Supabase. The rest of the UI logic
     will continue to work unchanged.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Lessons per module — used for percentage calculations on dashboard / modules.
  var LESSONS_PER_MODULE = {
    1:6, 2:6, 3:6, 4:6, 5:6, 6:7, 7:5, 8:5, 9:6, 10:5,
    11:7, 12:6, 13:6, 14:7, 15:6, 16:8, 17:6, 18:5, 19:5, 20:5,
    21:5, 22:7, 23:6, 24:5, 25:5, 26:5, 27:4, 28:4, 29:4, 30:4,
    31:4, 32:5
  };
  var TOTAL_LESSONS = Object.keys(LESSONS_PER_MODULE)
    .reduce(function (s, k) { return s + LESSONS_PER_MODULE[k]; }, 0);

  var STORE_KEY = 'aifa_completed_lessons_v1';
  var LAST_KEY  = 'aifa_last_lesson_v1';

  // ----- Storage helpers (swap these for backend later) -----
  function loadCompleted() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : {};
    } catch (e) { return {}; }
  }
  function saveCompleted(map) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function setLastLesson(id, href) {
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ id: id, href: href, ts: Date.now() })); } catch (e) {}
  }
  function getLastLesson() {
    try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch (e) { return null; }
  }

  // ----- Lesson ID parsing from URL: lesson-3-4.html -> {mod:3, les:4, id:"3-4"} -----
  function parseLessonFromPath(path) {
    var m = (path || '').match(/lesson-(\d+)-(\d+)\.html/i);
    if (!m) return null;
    return { mod: parseInt(m[1], 10), les: parseInt(m[2], 10), id: m[1] + '-' + m[2] };
  }

  function completedCount(map) {
    return Object.keys(map).filter(function (k) { return map[k]; }).length;
  }
  function completedInModule(map, mod) {
    var n = 0;
    Object.keys(map).forEach(function (k) {
      if (map[k] && k.indexOf(mod + '-') === 0) n++;
    });
    return n;
  }

  // ----- Find the next lesson to continue from -----
  function findNextUnfinished(map) {
    var mods = Object.keys(LESSONS_PER_MODULE).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < mods.length; i++) {
      var mod = mods[i];
      for (var l = 1; l <= LESSONS_PER_MODULE[mod]; l++) {
        if (!map[mod + '-' + l]) return { mod: mod, les: l, id: mod + '-' + l };
      }
    }
    return null;
  }

  function lessonHrefFromDashboard(id) { return 'lessons/lesson-' + id + '.html'; }
  function moduleHrefFromDashboard(mod) { return 'modules/module-' + mod + '.html'; }

  // ============================================================
  // LESSON PAGES — inject "Mark as complete" + reading progress
  // ============================================================
  function setupLessonPage() {
    var info = parseLessonFromPath(window.location.pathname);
    if (!info) return;

    // Track last visited lesson
    setLastLesson(info.id, 'lessons/lesson-' + info.id + '.html');

    var map = loadCompleted();
    var content = document.querySelector('.lesson-content');
    if (!content) return;

    // Reading progress bar (top of viewport)
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    var fill = bar.firstElementChild;
    function updateBar() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      var pct = Math.max(0, Math.min(100, (window.scrollY / max) * 100));
      fill.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();

    // Mark-as-complete UI inside the lesson content
    var nav = content.querySelector('.lesson-nav-bottom');
    var wrap = document.createElement('div');
    wrap.className = 'mark-complete-wrap';
    wrap.innerHTML =
      '<button type="button" class="mark-complete-btn" aria-pressed="false">' +
      '<span class="mc-icon" aria-hidden="true">○</span>' +
      '<span class="mc-text">اعتبر الدرس مكتمل</span>' +
      '</button>' +
      '<p class="mark-complete-hint">يتم حفظ التقدم محلياً في هذا المتصفح فقط.</p>';
    if (nav) content.insertBefore(wrap, nav);
    else content.appendChild(wrap);

    var btn = wrap.querySelector('.mark-complete-btn');
    function reflect() {
      var done = !!map[info.id];
      btn.classList.toggle('is-done', done);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      btn.querySelector('.mc-icon').textContent = done ? '✓' : '○';
      btn.querySelector('.mc-text').textContent = done ? 'تم إنجاز الدرس' : 'اعتبر الدرس مكتمل';
    }
    btn.addEventListener('click', function () {
      map = loadCompleted();
      map[info.id] = !map[info.id];
      saveCompleted(map);
      reflect();
    });
    reflect();
  }

  // ============================================================
  // DASHBOARD — overall percentage, module bars, continue CTA
  // ============================================================
  function setupDashboard() {
    var map = loadCompleted();
    var done = completedCount(map);
    var pct = Math.round((done / TOTAL_LESSONS) * 100);

    // Overall progress ring
    var ring = document.querySelector('.progress-ring-fill');
    if (ring) {
      var c = 2 * Math.PI * 36;
      ring.style.strokeDasharray = c;
      ring.dataset.progress = pct;
      ring.style.strokeDashoffset = c - (pct / 100) * c;
    }
    var pctEl = document.querySelector('.progress-text');
    if (pctEl) pctEl.textContent = pct + '%';

    // Optional summary line
    var welcome = document.querySelector('.dashboard-welcome');
    if (welcome && !welcome.querySelector('.progress-summary')) {
      var s = document.createElement('p');
      s.className = 'progress-summary';
      s.innerHTML = 'أنجزت <strong>' + done + '</strong> من أصل <strong>' +
        TOTAL_LESSONS + '</strong> درس';
      welcome.appendChild(s);
    }

    // Per-module cards
    document.querySelectorAll('.module-progress-card').forEach(function (card) {
      var href = card.getAttribute('href') || '';
      var mm = href.match(/module-(\d+)\.html/);
      if (!mm) return;
      var mod = parseInt(mm[1], 10);
      var total = LESSONS_PER_MODULE[mod] || 0;
      var d = completedInModule(map, mod);
      var p = total ? Math.round((d / total) * 100) : 0;
      var fill = card.querySelector('.module-progress-fill');
      var status = card.querySelector('.module-progress-status');
      if (fill) fill.style.width = p + '%';
      if (status) status.textContent = d + '/' + total + ' دروس';
      if (p === 100) card.classList.add('is-complete');
    });

    // Continue-learning CTA → last visited, fallback to next unfinished
    var last = getLastLesson();
    var target = last && last.id && !map[last.id] ? last
              : (function () { var n = findNextUnfinished(map); return n ? { id: n.id, href: lessonHrefFromDashboard(n.id) } : null; })();
    if (!target) target = { id: '1-1', href: 'lessons/lesson-1-1.html' };

    document.querySelectorAll('.continue-btn, a[href="lessons/lesson-1-1.html"]').forEach(function (a) {
      // Only update visible "continue learning" buttons, not the welcome-banner if user explicitly wants module 1
      if (a.classList.contains('continue-btn')) {
        a.setAttribute('href', target.href);
        a.innerHTML = '▶️ ' + (done > 0 ? 'تابع من حيث توقفت — الدرس ' + target.id : 'ابدأ الدرس الأول');
      }
    });

    // Sidebar "Continue learning" link
    var sideContinue = document.querySelector('.sidebar-nav a[href="lessons/lesson-1-1.html"]');
    if (sideContinue) sideContinue.setAttribute('href', target.href);

    // Welcome banner subtext if any
    var banner = document.querySelector('.welcome-banner');
    if (banner && done > 0) {
      var p = banner.querySelector('p');
      if (p) p.textContent = 'استمر في رحلتك — أنت أنجزت ' + pct + '٪ من الدورة.';
      var h2 = banner.querySelector('h2');
      if (h2) h2.textContent = 'تابع من حيث توقفت';
    }
  }

  // ============================================================
  // MODULE PAGES — mark completed lesson cards visually
  // ============================================================
  function setupModulePage() {
    if (!/\/modules\//.test(window.location.pathname)) return;
    var map = loadCompleted();
    document.querySelectorAll('.lesson-card, .module-nav a').forEach(function (el) {
      var href = el.getAttribute('href') || '';
      var m = href.match(/lesson-(\d+)-(\d+)\.html/);
      if (!m) return;
      var id = m[1] + '-' + m[2];
      if (map[id]) {
        el.classList.add('is-complete');
        // Replace the number bubble with a check when present
        var num = el.querySelector('.lesson-card-num');
        if (num) num.textContent = '✓';
      }
    });
  }

  // ----- Public hook in case other scripts want the data -----
  window.AIFAProgress = {
    getCompleted: loadCompleted,
    getLast: getLastLesson,
    totals: { perModule: LESSONS_PER_MODULE, total: TOTAL_LESSONS }
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupLessonPage();
    setupDashboard();
    setupModulePage();
  });
})();
