/* ═══════════════════════════════════════════════════════════════
   AI Fashion Academy — Auth Gate v4
   Supabase Auth — No Memberstack
   ✅ Protected pages require login + any role in user_roles table
   ✅ Unprotected pages show normally
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://frlsurwwumzcqckwkmnv.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybHN1cnd3dW16Y3Fja3drbW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTIzMDAsImV4cCI6MjA5NDU4ODMwMH0.mnGsAdIgi5m2hAWMQvPHDuQXWs7JPvAjm9Zct73w8aE';
  var PAYMENT_URL = '../payment.html';
  var LOGIN_URL = '../login.html';

  // Detect depth
  var depth = (location.pathname.match(/\//g) || []).length;
  var isRoot = depth <= 2;
  if (isRoot) {
    PAYMENT_URL = 'payment.html';
    LOGIN_URL = 'login.html';
  }

  var PROTECTED_PAGES = ['prompt-library.html','worksheets.html','dashboard.html','downloads.html'];
  var PROTECTED_FOLDERS = ['/lessons/','/modules/'];

  function isProtected(pathname) {
    if (PROTECTED_FOLDERS.some(function(f){ return pathname.indexOf(f) !== -1; })) return true;
    var file = pathname.split('/').pop();
    return PROTECTED_PAGES.indexOf(file) !== -1;
  }

  if (!isProtected(location.pathname)) return;

  // Hide page immediately
  document.documentElement.style.visibility = 'hidden';

  function loadSupabase(cb) {
    if (window.supabase && window.supabase.createClient) {
      return cb(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, storageKey: 'aifa-auth' }
      }));
    }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = function() {
      cb(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, storageKey: 'aifa-auth' }
      }));
    };
    document.head.appendChild(s);
  }

  function showScreen(html) {
    var d = document.createElement('div');
    d.id = 'aifa-gate';
    d.setAttribute('dir','rtl');
    d.innerHTML = '<style>' +
      '#aifa-gate{position:fixed;inset:0;background:linear-gradient(135deg,#070707,#141414);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:Tajawal,sans-serif}' +
      '.aifa-card{background:rgba(20,20,20,.92);border:1px solid rgba(212,165,116,.35);border-radius:24px;padding:3rem 2.5rem;max-width:440px;width:90%;text-align:center;box-shadow:0 22px 60px rgba(0,0,0,.5)}' +
      '.aifa-card .ico{font-size:3rem;margin-bottom:1rem}' +
      '.aifa-card h2{color:#d4a574;font-size:1.5rem;margin-bottom:.75rem;font-weight:700}' +
      '.aifa-card p{color:#cbd5e1;font-size:1rem;line-height:1.7;margin-bottom:1.5rem}' +
      '.btn-g{display:inline-block;background:linear-gradient(135deg,#d4a574,#b08d5f);color:#070707;padding:.9rem 2rem;border-radius:12px;font-weight:700;text-decoration:none;margin:.3rem;font-size:1rem}' +
      '.btn-s{display:inline-block;border:1px solid rgba(212,165,116,.4);color:#d4a574;padding:.85rem 1.75rem;border-radius:12px;font-weight:600;text-decoration:none;margin:.3rem;font-size:.95rem}' +
      'button.btn-s{background:transparent;cursor:pointer;font-family:Tajawal,sans-serif}' +
      '</style>' +
      '<div class="aifa-card">' + html + '</div>';
    document.body.appendChild(d);
    d.style.visibility = 'visible';
  }

  function showLoginScreen() {
    showScreen(
      '<div class="ico">🔒</div>' +
      '<h2>محتوى للأعضاء فقط</h2>' +
      '<p>سجّل دخولك للوصول إلى الدروس والموارد الحصرية.</p>' +
      '<a class="btn-g" href="' + LOGIN_URL + '?redirect=' + encodeURIComponent(location.pathname) + '">تسجيل الدخول</a>' +
      '<br/><a class="btn-s" href="' + (isRoot ? 'index.html' : '../index.html') + '">الرئيسية</a>'
    );
  }

  function showPaymentScreen(client) {
    showScreen(
      '<div class="ico">💳</div>' +
      '<h2>يجب إتمام الدفع للوصول</h2>' +
      '<p>حسابك مسجّل لكن لم يتم تفعيل الوصول بعد.<br/>أتمّ عملية الشراء للوصول الفوري لجميع الدروس.</p>' +
      '<a class="btn-g" href="' + PAYMENT_URL + '">اشترِ الدورة الآن</a>' +
      '<br/><button class="btn-s" id="aifa-out">تسجيل الخروج</button>'
    );
    document.getElementById('aifa-out').addEventListener('click', function() {
      client.auth.signOut().then(function() { location.href = isRoot ? 'index.html' : '../index.html'; });
    });
  }

  loadSupabase(function(client) {
    client.auth.getSession().then(function(res) {
      var session = res.data.session;

      if (!session) { showLoginScreen(); return; }

      // Check paid role
      client.from('user_roles').select('role').eq('user_id', session.user.id)
        .then(function(result) {
          var roles = (result.data || []).map(function(r){ return r.role; });
          var hasPaid = roles.length > 0;

          if (!hasPaid) { showPaymentScreen(client); return; }

          // ✅ Access granted
          document.documentElement.style.visibility = '';

          // Add logout button to header
          var nav = document.querySelector('.nav-desktop, .header-actions');
          if (nav && !nav.querySelector('[data-aifa-logout]')) {
            var btn = document.createElement('button');
            btn.setAttribute('data-aifa-logout','');
            btn.textContent = 'تسجيل الخروج';
            btn.style.cssText = 'background:transparent;border:1px solid rgba(212,165,116,.4);color:#d4a574;padding:.5rem 1rem;border-radius:8px;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:600;font-size:.9rem';
            btn.addEventListener('click', function() {
              client.auth.signOut().then(function() { location.href = isRoot ? 'index.html' : '../index.html'; });
            });
            nav.appendChild(btn);
          }
        });
    });
  });
})();
