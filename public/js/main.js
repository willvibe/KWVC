document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('mainNav');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        if (backToTop) {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    var statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length > 0) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function (el) {
            observer.observe(el);
        });
    }

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'));
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(step);
    }

    var forms = document.querySelectorAll('form[novalidate]');
    forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            var phoneInput = form.querySelector('input[name="phone"]');
            if (phoneInput && phoneInput.value) {
                var phoneRegex = /^1[3-9]\d{9}$/;
                if (!phoneRegex.test(phoneInput.value)) {
                    e.preventDefault();
                    alert('请输入正确的11位手机号码');
                    phoneInput.focus();
                    return;
                }
            }

            var emailInput = form.querySelector('input[name="email"]');
            if (emailInput && emailInput.value) {
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    e.preventDefault();
                    alert('请输入正确的邮箱地址');
                    emailInput.focus();
                    return;
                }
            }
        });
    });

    var elements = document.querySelectorAll('.highlight-card, .track-card, .mission-card, .prize-card, .rule-item');
    if (elements.length > 0) {
        var fadeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(function (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            fadeObserver.observe(el);
        });
    }

    var particles = document.getElementById('particles');
    if (particles) {
        for (var i = 0; i < 30; i++) {
            var dot = document.createElement('div');
            dot.style.cssText = 'position:absolute;width:' + (Math.random() * 4 + 1) + 'px;height:' + (Math.random() * 4 + 1) + 'px;background:rgba(200,164,92,' + (Math.random() * 0.3 + 0.1) + ');border-radius:50%;left:' + Math.random() * 100 + '%;top:' + Math.random() * 100 + '%;animation:float ' + (Math.random() * 4 + 3) + 's ease-in-out infinite ' + (Math.random() * 2) + 's;';
            particles.appendChild(dot);
        }
    }
});
