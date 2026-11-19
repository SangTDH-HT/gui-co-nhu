(() => {
  'use strict';

  const html = document.documentElement;
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const doi = ms => new Promise(r => setTimeout(r, ms));

  const canh = $('#canh');
  const phong = $('#phong');
  const niem = $('#niem');
  const laThu = $('#la-thu');
  const tieuDe = $('.tieu-de');
  const nutNhac = $('#nut-nhac');

  let daMo = false;

  async function moThu() {
    if (daMo) return;
    daMo = true;
    // nhạc phải bật ngay trong lượt chạm (điện thoại chặn nếu gọi muộn)
    if (window.HopNhac) { HopNhac.batDau(); html.classList.add('co-nhac'); }

    if (giam) {
      canh.remove();
      html.classList.remove('dong');
      html.classList.add('doc');
      laThu.focus({ preventScroll: true });
      return;
    }

    const r = niem.getBoundingClientRect();
    html.classList.add('vo-niem');
    HatBay.bung(r.left + r.width / 2, r.top + r.height / 2, 54);
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* bỏ qua */ } }

    await doi(420);
    html.classList.add('mo-nap');
    await doi(1000);
    html.classList.add('sau-nap', 'rut');
    await doi(1450);

    tieuDe.classList.add('cho');
    canh.classList.add('tan');
    html.classList.remove('dong');
    html.classList.add('doc');
    scrollTo(0, 0);
    HatBay.chay(true);
    await doi(850);
    canh.remove();
    laThu.focus({ preventScroll: true });
    await vietTieuDe();
  }

  function vietTieuDe() {
    const s = tieuDe.firstElementChild;
    tieuDe.classList.remove('cho');
    tieuDe.classList.add('dang');
    const dur = 2200;
    return new Promise(res => {
      const t0 = performance.now();
      const buoc = now => {
        const t = Math.min(1, (now - t0) / dur);
        const k = .8 * t + .2 * (.5 - .5 * Math.cos(Math.PI * t));
        s.style.setProperty('--p', k.toFixed(4));
        const b = s.getBoundingClientRect();
        const x = b.left + b.width * Math.min(1, Math.max(0, k * 1.04 - .02));
        HatBay.ven(x, b.top + b.height * (.5 + .18 * Math.sin(t * 30)));
        if (t < 1) requestAnimationFrame(buoc);
        else { tieuDe.classList.remove('dang'); s.style.removeProperty('--p'); res(); }
      };
      requestAnimationFrame(buoc);
    });
  }

  phong.addEventListener('click', moThu);

  nutNhac.addEventListener('click', () => {
    if (!window.HopNhac) return;
    if (HopNhac.dangChay) {
      HopNhac.dung();
      nutNhac.setAttribute('aria-pressed', 'false');
      nutNhac.setAttribute('aria-label', 'Bật nhạc');
    } else {
      HopNhac.batDau();
      nutNhac.setAttribute('aria-pressed', 'true');
      nutNhac.setAttribute('aria-label', 'Tắt nhạc');
    }
  });

  // đọc tới chữ ký thì cánh hoa và nhũ rơi (một lần)
  const ky = $('#ky');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting) && html.classList.contains('doc')) {
        io.disconnect();
        HatBay.mua(80);
      }
    }, { threshold: 1 });
    io.observe(ky);
  }
})();
