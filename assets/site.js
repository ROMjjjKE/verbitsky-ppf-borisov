document.documentElement.classList.add('js');

/* меню */
(function () {
  var b = document.getElementById('burger'), n = document.getElementById('nav');
  if (!b || !n) return;
  b.addEventListener('click', function () {
    var open = n.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  n.addEventListener('click', function (e) { if (e.target.tagName === 'A') n.classList.remove('open'); });
})();

/* появление блоков */
(function () {
  var els = document.querySelectorAll('.fx');
  if (!els.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* гравийный обстрел */
(function () {
  var stage = document.getElementById('hits');
  var btn = document.getElementById('throw');
  var film = document.getElementById('film');
  var nHits = document.getElementById('nHits');
  var nSaved = document.getElementById('nSaved');
  var note = document.getElementById('note');
  if (!stage || !btn) return;

  var hits = 0, saved = 0, busy = false;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function point() {
    // случайная точка в пределах капота (приближённо, по эллипсу)
    var cx = 210, cy = 126, rx = 118, ry = 74;
    var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * .82;
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function impact() {
    var p = point();
    var withFilm = film.checked;
    var g = svgEl('g', {});
    var core = svgEl('circle', { cx: p.x, cy: p.y, r: 0, fill: withFilm ? '#C42BAF' : '#3A3D45', opacity: .95 });
    g.appendChild(core);
    var ring = svgEl('circle', { cx: p.x, cy: p.y, r: 0, fill: 'none', stroke: withFilm ? '#C42BAF' : '#6B6F7A', 'stroke-width': 1.4, opacity: .8 });
    g.appendChild(ring);
    if (!withFilm) {
      for (var i = 0; i < 3; i++) {
        var a = Math.random() * Math.PI * 2;
        var crack = svgEl('line', {
          x1: p.x, y1: p.y,
          x2: p.x + Math.cos(a) * rand(5, 11), y2: p.y + Math.sin(a) * rand(5, 11),
          stroke: '#6B6F7A', 'stroke-width': .9, opacity: .75
        });
        g.appendChild(crack);
      }
    }
    stage.appendChild(g);

    var t0 = performance.now(), dur = withFilm ? 700 : 260;
    function anim(t) {
      var k = Math.min(1, (t - t0) / dur);
      var r = withFilm ? 3.4 + k * 4 : 2.6;
      core.setAttribute('r', r.toFixed(2));
      ring.setAttribute('r', (r + 2 + k * 6).toFixed(2));
      if (withFilm) {
        core.setAttribute('opacity', (0.95 * (1 - k)).toFixed(2));
        ring.setAttribute('opacity', (0.8 * (1 - k)).toFixed(2));
      }
      if (k < 1) requestAnimationFrame(anim);
      else if (withFilm) g.remove();
    }
    requestAnimationFrame(anim);

    if (withFilm) { saved++; nSaved.textContent = saved; }
    else { hits++; nHits.textContent = hits; }
  }

  btn.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    var left = 10;
    var timer = setInterval(function () {
      impact();
      left--;
      if (left <= 0) {
        clearInterval(timer);
        busy = false;
        btn.disabled = false;
        note.textContent = film.checked
          ? 'Плёнка погасила все 10 ударов: следов на лаке нет. Мелкие риски на самой плёнке затягиваются от тепла.'
          : 'На лаке осталось ' + hits + ' сколов. Включите плёнку и бросьте снова — сравните.';
      }
    }, 130);
  });

  film.addEventListener('change', function () {
    note.textContent = film.checked
      ? 'Плёнка включена: удары гасятся в полиуретане, следы затягиваются.'
      : 'Плёнка выключена: каждый камень оставляет скол на лаке.';
  });
})();

/* форма */
(function () {
  var f = document.getElementById('reqForm');
  if (!f) return;
  var note = document.getElementById('note');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var car = document.getElementById('q-car');
    var name = document.getElementById('q-name');
    var tel = document.getElementById('q-tel');
    var zone = document.getElementById('q-zone');
    var bad = 0;
    [[car, car.value.trim().length < 2], [name, name.value.trim().length < 2],
     [tel, tel.value.replace(/\D/g, '').length < 9]].forEach(function (pair) {
      var wrap = pair[0].closest('.field');
      if (pair[1]) { wrap.classList.add('err'); bad++; } else wrap.classList.remove('err');
    });
    if (bad) { note.textContent = 'Заполните марку авто, имя и телефон.'; return; }
    var text = 'Заявка на оклейку PPF\nАвто: ' + car.value.trim() + '\nЧто закрываем: ' + zone.value +
      '\nИмя: ' + name.value.trim() + '\nТелефон: ' + tel.value.trim();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    } catch (err) {}
    note.textContent = 'Заявка готова и скопирована. Позвоните по номеру или отправьте текст в мессенджер.';
    f.reset();
  });
})();
