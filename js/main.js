/* ═══════════════════════════════════════════════════════════════
   AI Fashion Academy — Main JavaScript
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function() {
      mobileNav.classList.toggle('active');
      this.setAttribute('aria-expanded', mobileNav.classList.contains('active'));
    });

    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header scroll effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function() {
        const isActive = item.classList.contains('active');

        // Close all others
        faqItems.forEach(other => {
          other.classList.remove('active');
        });

        // Toggle current
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // Copy prompt button
  document.querySelectorAll('.prompt-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      const promptBox = this.closest('.prompt-box');
      const promptContent = promptBox.querySelector('.prompt-content');

      if (promptContent) {
        navigator.clipboard.writeText(promptContent.textContent).then(() => {
          const originalText = this.textContent;
          this.textContent = '✓ تم النسخ!';
          this.style.background = 'rgba(34, 197, 94, 0.15)';
          this.style.color = '#22c55e';
          this.style.borderColor = '#22c55e';

          setTimeout(() => {
            this.textContent = originalText;
            this.style.background = '';
            this.style.color = '';
            this.style.borderColor = '';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy:', err);
          // Fallback
          const textArea = document.createElement('textarea');
          textArea.value = promptContent.textContent;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        });
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Active lesson highlighting in sidebar
  const currentLessonPath = window.location.pathname;
  document.querySelectorAll('.lesson-nav-list a').forEach(link => {
    if (link.getAttribute('href') === currentLessonPath || 
        link.getAttribute('href') === currentLessonPath.split('/').pop()) {
      link.classList.add('active');
    }
  });

  // Progress ring animation
  const progressRing = document.querySelector('.progress-ring-fill');
  if (progressRing) {
    const circumference = 2 * Math.PI * 36;
    progressRing.style.strokeDasharray = circumference;

    const targetPercent = parseInt(progressRing.dataset.progress || 0);
    const offset = circumference - (targetPercent / 100) * circumference;

    setTimeout(() => {
      progressRing.style.strokeDashoffset = offset;
    }, 500);
  }

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card, .module-card, .pricing-card, .faq-item, .roadmap-item').forEach(el => {
    fadeObserver.observe(el);
  });

  // Form validation helper
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#ef4444';
        } else {
          field.style.borderColor = '';
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });
  });

  // Countdown timer for pricing (if exists)
  const countdownEl = document.querySelector('.countdown');
  if (countdownEl) {
    const targetDate = new Date(countdownEl.dataset.target).getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        countdownEl.innerHTML = '<span class="text-red">انتهى العرض</span>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.innerHTML = `
        <div class="countdown-item"><span>${days}</span> يوم</div>
        <div class="countdown-item"><span>${hours}</span> ساعة</div>
        <div class="countdown-item"><span>${minutes}</span> دقيقة</div>
        <div class="countdown-item"><span>${seconds}</span> ثانية</div>
      `;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Print functionality for worksheets
  document.querySelectorAll('.print-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      window.print();
    });
  });

  // Tab switching (for any tab components)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabGroup = this.closest('.tabs');
      const targetId = this.dataset.tab;

      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

      this.classList.add('active');
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

});

// Utility: Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility: Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}
