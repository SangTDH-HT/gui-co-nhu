(() => {
  'use strict';

  const html = document.documentElement;
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const doi = ms => new Promise(r => setTimeout(r, ms));

  const manThu = $('#man-thu');
  const phong = $('#phong');
  const niem = $('#niem');
  const laThu = $('#la-thu');
  const tieuDe = $('.tieu-de');
  const nutNhac = $('#nut-nhac');

  // Bó hoa khô (flora.js) — cùng bộ vẽ với thiệp cưới
  const HOA_BIA = { w: 300, h: 300, goc: [150, 300], vung: { cx: 150, cy: 112, rx: 128, ry: 92 }, so: 15, hat: 23, nhip: .06, tre: .2, co: 6, laRong: 2, boCongAnh: [{ dx: -.42, dy: -.5, s: .8 }] };
  const HOA_DAU = { w: 620, h: 470, goc: [650, 485], vung: { cx: 318, cy: 172, rx: 272, ry: 136 }, so: 26, hat: 5, nhip: .05, boCongAnh: [{ dx: .22, dy: -.42 }, { dx: -.72, dy: .12, s: .6 }] };
  const HOA_CUOI = { w: 170, h: 230, goc: [85, 226], vung: { cx: 85, cy: 64, rx: 50, ry: 44 }, so: 7, hat: 8, boCongAnh: false, loai: { cucBe: 2, coThi: 2, nu: 3, biBi: 1 }, co: 3, laRong: 1 };

  const boBia = $('#bo-bia');
  boBia.innerHTML = HoaKho.bo(HOA_BIA);
  $('#hoa-dau').innerHTML = HoaKho.bo(HOA_DAU);
  $('#hoa-cuoi').innerHTML = HoaKho.bo(HOA_CUOI);

  // màn đầu: hoa mọc, hạt bồ công anh + nhũ bay sẵn
  requestAnimationFrame(() => {
    boBia.classList.add('moc-hoa');
    HatBay.nguon($$('#bo-bia .bca'));
    HatBay.chay(true);
  });

  let daMo = false;

  async function moThu() {
    if (daMo) return;
    daMo = true;
    // nhạc phải bật ngay trong lượt chạm (điện thoại chặn nếu gọi muộn)
    if (window.HopNhac) { HopNhac.batDau(); html.classList.add('co-nhac'); }

    if (giam) {
      manThu.remove();
      html.classList.remove('dong');
      html.classList.add('doc');
      laThu.focus({ preventScroll: true });
      return;
    }

    const r = niem.getBoundingClientRect();
    html.classList.add('vo-niem');
    HatBay.bung(r.left + r.width / 2, r.top + r.height / 2, { hat: 30, vun: 60, sao: 18, luc: 1.05 });
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* bỏ qua */ } }

    await doi(420);
    html.classList.add('mo-nap');
    await doi(1000);
    html.classList.add('sau-nap', 'rut');
    await doi(1450);

    tieuDe.classList.add('cho');
    manThu.classList.add('tan');
    html.classList.remove('dong');
    html.classList.add('doc');
    scrollTo(0, 0);
    laThu.classList.add('moc-hoa');
    HatBay.nguon($$('#la-thu .bca'));
    await doi(850);
    manThu.remove();
    laThu.focus({ preventScroll: true });
    await vietTieuDe();
  }

  function vietTieuDe() {
    const s = tieuDe.firstElementChild;
    tieuDe.classList.remove('cho');
    tieuDe.classList.add('dang');
    const dur = 2200;
    let lan = 0;
    return new Promise(res => {
      const t0 = performance.now();
      const buoc = now => {
        const t = Math.min(1, (now - t0) / dur);
        const k = .8 * t + .2 * (.5 - .5 * Math.cos(Math.PI * t));
        s.style.setProperty('--p', k.toFixed(4));
        const b = s.getBoundingClientRect();
        if (++lan % 5 === 0) {
          const x = b.left + b.width * Math.min(1, Math.max(0, k * 1.04 - .02));
          HatBay.sao(x, b.top + b.height * (.4 + .2 * Math.random()), .28 + Math.random() * .4);
        }
        if (t < 1) requestAnimationFrame(buoc);
        else {
          tieuDe.classList.remove('dang');
          s.style.removeProperty('--p');
          for (let i = 0; i < 5; i++) HatBay.sao(b.left + b.width * Math.random(), b.top + b.height * (.2 + Math.random() * .6), .4 + Math.random() * .5, i * .08);
          res();
        }
      };
      requestAnimationFrame(buoc);
    });
  }

  phong.addEventListener('click', moThu);

  // chạm màn hình sau khi mở thư: thổi bay hạt quanh ngón tay (như thiệp cưới)
  addEventListener('pointerdown', e => {
    if (!daMo || e.target.closest('button')) return;
    HatBay.thoi(e.clientX, e.clientY);
  });

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
})();
