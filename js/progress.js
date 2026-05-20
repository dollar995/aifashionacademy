/* ═══════════════════════════════════════════════════════════════
   AI Fashion Academy — Progress Tracker v2
   Supabase-based tracking (server-side, cross-device)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://frlsurwwumzcqckwkmnv.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybHN1cnd3dW16Y3Fja3drbW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTIzMDAsImV4cCI6MjA5NDU4ODMwMH0.mnGsAdIgi5m2hAWMQvPHDuQXWs7JPvAjm9Zct73w8aE';

  var LESSONS_PER_MODULE = {
    1:6, 2:6, 3:6, 4:6, 5:6, 6:7, 7:5, 8:5, 9:6, 10:5,
    11:7, 12:6, 13:6, 14:7, 15:6, 16:8, 17:6, 18:5, 19:5, 20:5,
    21:5, 22:7, 23:6, 24:5, 25:5, 26:5, 27:4, 28:4, 29:4, 30:4,
    31:4, 32:5
  };
  var TOTAL_LESSONS = Object.keys(LESSONS_PER_MODULE)
    .reduce(function (s, k) { return s + LESSONS_PER_MODULE[k]; }, 0);

  // ── Supabase client ──────────────────────────────────────────
  function getClient() {
    if (window._aifaClient) return window._aifaClient;
    if (window.supabase && window.supabase.createClient) {
      window._aifaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, storageKey: 'aifa-auth' }
      });
    }
    return window._aifaClient || null;
  }

  function getCurrentUser() {
    var client = getClient();
    if (!client) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) {
      return res.data.session ? res.data.session.user : null;
    });
  }

  // ── Storage helpers (Supabase) ───────────────────────────────
  function loadCompleted(userId) {
    var client = getClient();
    if (!client) return Promise.resolve({});
    return client
      .from('user_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .then(function (res) {
        var map = {};
        (res.data || []).forEach(function (row) {
          if (row.completed) map[row.lesson_id] = true;
        });
        return map;
      });
  }

  function toggleCompleted(userId, lessonId, currentMap) {
    var client = getClient();
    if (!client) return Promise.resolve(currentMap);
    var newVal = !currentMap[lessonId];
    return client
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
        last_visited_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' })
      .then(function () {
        var updated = Object.assign({}, currentMap);
        if (newVal) updated[lessonId] = true;
        else delete updated[lessonId];
        return updated;
      });
  }

  function setLastLesson(userId, id, href) {
    var client = getClient();
    if (!client) return;
    client.from('user_last_lesson').upsert({
      user_id: userId,
      lesson_id: id,
      lesson_href: href,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }

  function getLastLesson(userId) {
    var client = getClient();
    if (!client) return Promise.resolve(null);
    return client
      .from('user_last_lesson')
      .select('lesson_id, lesson_href')
      .eq('user_id', userId)
      .maybeSingle()
      .then(function (res) { return res.data || null; });
  }

  // ── Helpers ──────────────────────────────────────────────────
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

  // ── LESSON PAGE ───────────────────────────────────────────────
  function setupLessonPage(user) {
    var info = parseLessonFromPath(window.location.pathname);
    if (!info) return;

    setLastLesson(user.id, info.id, 'lessons/lesson-' + info.id + '.html');

    // Reading progress bar
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    var fill = bar.firstElementChild;
    function updateBar() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      fill.style.width = Math.max(0, Math.min(100, (window.scrollY / max) * 100)) + '%';
    }
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();

    loadCompleted(user.id).then(function (map) {
      var content = document.querySelector('.lesson-content');
      if (!content) return;

      var nav = content.querySelector('.lesson-nav-bottom');
      var wrap = document.createElement('div');
      wrap.className = 'mark-complete-wrap';
      wrap.innerHTML =
        '<button type="button" class="mark-complete-btn" aria-pressed="false">' +
        '<span class="mc-icon" aria-hidden="true">○</span>' +
        '<span class="mc-text">اعتبر الدرس مكتمل</span>' +
        '</button>';
      if (nav) content.insertBefore(wrap, nav);
      else content.appendChild(wrap);

      var btn = wrap.querySelector('.mark-complete-btn');

      function reflect(m) {
        var done = !!m[info.id];
        btn.classList.toggle('is-done', done);
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        btn.querySelector('.mc-icon').textContent = done ? '✓' : '○';
        btn.querySelector('.mc-text').textContent = done ? 'تم إنجاز الدرس ✓' : 'اعتبر الدرس مكتمل';
        btn.disabled = false;
      }

      btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.querySelector('.mc-text').textContent = 'جاري الحفظ...';
        toggleCompleted(user.id, info.id, map).then(function (updated) {
          map = updated;
          reflect(map);
        });
      });

      reflect(map);
    });
  }

  // ── DASHBOARD ─────────────────────────────────────────────────
  function setupDashboard(user) {
    Promise.all([loadCompleted(user.id), getLastLesson(user.id)]).then(function (results) {
      var map = results[0];
      var last = results[1];
      var done = completedCount(map);
      var pct = Math.round((done / TOTAL_LESSONS) * 100);

      // Progress ring
      var ring = document.querySelector('.progress-ring-fill');
      if (ring) {
        var c = 2 * Math.PI * 36;
        ring.style.strokeDasharray = c;
        ring.dataset.progress = pct;
        ring.style.strokeDashoffset = c - (pct / 100) * c;
      }
      var pctEl = document.querySelector('.progress-text');
      if (pctEl) pctEl.textContent = pct + '%';

      // Summary
      var welcome = document.querySelector('.dashboard-welcome');
      if (welcome && !welcome.querySelector('.progress-summary')) {
        var s = document.createElement('p');
        s.className = 'progress-summary';
        s.innerHTML = 'أنجزت <strong>' + done + '</strong> من أصل <strong>' + TOTAL_LESSONS + '</strong> درس';
        welcome.appendChild(s);
      }

      // Module cards
      document.querySelectorAll('.module-progress-card').forEach(function (card) {
        var href = card.getAttribute('href') || '';
        var mm = href.match(/module-(\d+)\.html/);
        if (!mm) return;
        var mod = parseInt(mm[1], 10);
        var total = LESSONS_PER_MODULE[mod] || 0;
        var d = completedInModule(map, mod);
        var p = total ? Math.round((d / total) * 100) : 0;
        var fillEl = card.querySelector('.module-progress-fill');
        var status = card.querySelector('.module-progress-status');
        if (fillEl) fillEl.style.width = p + '%';
        if (status) status.textContent = d + '/' + total + ' دروس';
        if (p === 100) card.classList.add('is-complete');
      });

      // Continue CTA
      var next = last && !map[last.lesson_id] ? { id: last.lesson_id, href: last.lesson_href }
               : (function () { var n = findNextUnfinished(map); return n ? { id: n.id, href: lessonHrefFromDashboard(n.id) } : null; })();
      if (!next) next = { id: '1-1', href: 'lessons/lesson-1-1.html' };

      document.querySelectorAll('.continue-btn').forEach(function (a) {
        a.setAttribute('href', next.href);
        a.innerHTML = '▶️ ' + (done > 0 ? 'تابع من حيث توقفت — الدرس ' + next.id : 'ابدأ الدرس الأول');
      });

      // Welcome banner
      var banner = document.querySelector('.welcome-banner');
      if (banner && done > 0) {
        var bp = banner.querySelector('p');
        if (bp) bp.textContent = 'استمر في رحلتك — أنت أنجزت ' + pct + '٪ من الدورة.';
        var bh = banner.querySelector('h2');
        if (bh) bh.textContent = 'تابع من حيث توقفت';
      }
    });
  }

  // ── MODULE PAGES ──────────────────────────────────────────────
  function setupModulePage(user) {
    if (!/\/modules\//.test(window.location.pathname)) return;
    loadCompleted(user.id).then(function (map) {
      document.querySelectorAll('.lesson-card, .module-nav a').forEach(function (el) {
        var href = el.getAttribute('href') || '';
        var m = href.match(/lesson-(\d+)-(\d+)\.html/);
        if (!m) return;
        var id = m[1] + '-' + m[2];
        if (map[id]) {
          el.classList.add('is-complete');
          var num = el.querySelector('.lesson-card-num');
          if (num) num.textContent = '✓';
        }
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Wait for Supabase to load (auth-gate loads it)
    function init() {
      getCurrentUser().then(function (user) {
        if (!user) return; // auth-gate handles redirect
        setupLessonPage(user);
        setupDashboard(user);
        setupModulePage(user);
      });
    }

    if (getClient()) {
      init();
    } else {
      // Wait for auth-gate to load Supabase
      var tries = 0;
      var interval = setInterval(function () {
        tries++;
        if (getClient()) { clearInterval(interval); init(); }
        if (tries > 20) clearInterval(interval);
      }, 200);
    }
  });

  // Public API
  window.AIFAProgress = {
    totals: { perModule: LESSONS_PER_MODULE, total: TOTAL_LESSONS }
  };
})();
