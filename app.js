(() => {
  'use strict';

  const html = document.documentElement;
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const doi = ms => new Promise(r => setTimeout(r, ms));
  const khung = () => new Promise(r => requestAnimationFrame(r));

  const trang = $('#trang');
  const lop = $('#lop-bia');
  const nutMo = $('#mo-vo');
  const ngoi = $('#ngoi');
  const ngoiDung = $('#ngoi-dung');
  const nutCham = $('#nut-cham');
  const bao = $('#bao');

  let LI = 8, R = 32, exTay = 0.42;
  let viTri = null;

  /* ---------- đo đạc ---------- */

  function doLuoi() {
    LI = parseFloat(getComputedStyle(html).getPropertyValue('--li')) || 8;
    R = LI * 4;
  }

  function doEx() {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '340 200px "Playwrite VN"';
    const m = c.measureText('x');
    const v = (m.actualBoundingBoxAscent || 0) / 200;
    return v > 0.2 && v < 0.8 ? v : 0.42;
  }

  // khoảng cách từ mép trên phần tử tới đường chân chữ dòng đầu
  function duongChan(el) {
    const p = document.createElement('span');
    p.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
    el.insertBefore(p, el.firstChild);
    const y = p.getBoundingClientRect().top - el.getBoundingClientRect().top;
    p.remove();
    return y;
  }

  // đặt chân chữ đúng lên dòng kẻ đậm thứ `de` tính từ mép trên khối `goc`
  function datLenDong(el, goc, de) {
    el.style.top = '0px';
    const t = goc.getBoundingClientRect().top - trang.getBoundingClientRect().top;
    const dong = Math.round(t / R) * R;
    const b = (el.getBoundingClientRect().top - goc.getBoundingClientRect().top) + duongChan(el);
    el.style.top = (dong + de * R - (t + b)) + 'px';
  }

  function coChu() {
    $$('.trang .viet').forEach(p => {
      const s = p.firstElementChild;
      const xh = parseFloat(p.dataset.xh) || 1.5;
      const f = xh * LI / exTay;
      s.style.fontSize = f + 'px';
      const cs = getComputedStyle(p);
      const cho = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const w = s.getBoundingClientRect().width;
      if (w > cho) s.style.fontSize = (f * cho / w * 0.98) + 'px';
    });
    // cùng nhóm thì cùng cỡ (lấy cỡ nhỏ nhất)
    const nhom = {};
    $$('.trang .viet[data-nhom]').forEach(p => (nhom[p.dataset.nhom] ||= []).push(p.firstElementChild));
    Object.values(nhom).forEach(ds => {
      const nho = Math.min(...ds.map(s => parseFloat(s.style.fontSize)));
      ds.forEach(s => { s.style.fontSize = nho + 'px'; });
    });
  }

  function vuaNhan() {
    $$('.nhan-viet').forEach(el => {
      el.style.fontSize = '';
      if (el.scrollWidth > el.clientWidth + 1) {
        const f = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = (f * el.clientWidth / el.scrollWidth * 0.97) + 'px';
      }
    });
  }

  function canhDong() {
    $$('.trang .viet').forEach(p => datLenDong(p.firstElementChild, p, parseFloat(p.dataset.de) || 1));
    $$('.trang .in').forEach(p => datLenDong(p, p, 1));
  }

  /* ---------- dòng tập viết ---------- */

  function ngauNhien(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NET = [
    (x, t, b, h) => `M${x} ${t + h * .5}H${x + h * 1.05}`,
    (x, t, b, h) => `M${x + h * .5} ${t}V${b}`,
    (x, t, b, h) => `M${x + h * .1} ${b}L${x + h * .85} ${t}`,
    (x, t, b, h) => `M${x + h * .1} ${t}L${x + h * .85} ${b}`,
    (x, t, b, h) => `M${x} ${t + h * .32}C${x + h * .14} ${t - h * .06} ${x + h * .55} ${t - h * .06} ${x + h * .55} ${t + h * .32}V${b}`,
    (x, t, b, h) => `M${x + h * .3} ${t}V${b - h * .32}C${x + h * .3} ${b + h * .06} ${x + h * .72} ${b + h * .06} ${x + h * .9} ${b - h * .38}`,
    (x, t, b, h) => `M${x} ${t + h * .32}C${x + h * .12} ${t - h * .06} ${x + h * .42} ${t - h * .06} ${x + h * .42} ${t + h * .32}V${b - h * .32}C${x + h * .42} ${b + h * .06} ${x + h * .82} ${b + h * .06} ${x + h * .98} ${b - h * .38}`,
    (x, t, b, h) => `M${x + h * .82} ${t + h * .2}C${x + h * .6} ${t - h * .08} ${x} ${t} ${x} ${t + h * .5}C${x} ${b} ${x + h * .6} ${b + h * .08} ${x + h * .84} ${b - h * .2}`,
    (x, t, b, h) => `M${x} ${t + h * .2}C${x + h * .24} ${t - h * .08} ${x + h * .84} ${t} ${x + h * .84} ${t + h * .5}C${x + h * .84} ${b} ${x + h * .24} ${b + h * .08} ${x} ${b - h * .2}`,
    (x, t, b, h) => `M${x + h * .45} ${t}C${x + h * .02} ${t} ${x - h * .02} ${b} ${x + h * .45} ${b}C${x + h * .92} ${b} ${x + h * .9} ${t} ${x + h * .45} ${t}`,
  ];

  function lechLuoi(row) {
    const t = row.getBoundingClientRect().top - trang.getBoundingClientRect().top;
    return Math.round(t / R) * R - t;
  }

  function veNetCoBan(o, W, r, lech) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'net-tv');
    svg.setAttribute('width', W);
    svg.setAttribute('height', R * 2);
    const h = LI * 2;
    const b = lech + R;
    const t = b - h;
    const o1 = R;
    let x = R * .3;
    let k = 0;
    while (x + h <= W) {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', NET[Math.floor(k / 2) % NET.length](x + (r() - .5) * 1.4, t + (r() - .5) * 1.2, b + (r() - .5) * 1.2, h));
      p.setAttribute('stroke-width', (1.55 + r() * .55).toFixed(2));
      p.setAttribute('opacity', (.82 + r() * .18).toFixed(2));
      svg.appendChild(p);
      x += o1;
      k++;
    }
    o.appendChild(svg);
  }

  function dungTapViet() {
    $$('.dong-tv').forEach((row, i) => {
      const cu = row.querySelector('.o');
      if (cu) cu.remove();
      const o = document.createElement('div');
      o.className = 'o';
      o.setAttribute('aria-hidden', 'true');
      row.appendChild(o);
      const W = o.clientWidth;
      const r = ngauNhien(29 + i * 11);
      const lech = lechLuoi(row);
      if (row.dataset.kieu === 'net') { veNetCoBan(o, W, r, lech); return; }

      const mau = row.dataset.mau.split(' ');
      const soTo = +(row.dataset.to || 0);
      const f = 2 * LI / exTay;

      const tao = (chu, lop) => {
        const s = document.createElement('span');
        s.className = 'chu-tv ' + lop;
        s.textContent = chu;
        s.style.fontSize = f + 'px';
        o.appendChild(s);
        return s;
      };

      const thu = tao(mau[0], 'mau');
      const chan = duongChan(thu);
      thu.remove();
      const tren = lech + R - chan;

      let x = R * .15;
      let k = 0;
      for (;;) {
        const chu = mau[k % mau.length];
        const lop = k === 0 ? 'mau' : (k <= soTo ? 'rong' : 'muc');
        const s = tao(chu, lop);
        const w = s.getBoundingClientRect().width;
        const o1 = Math.ceil((w + R * .45) / (R / 2)) * (R / 2);
        if (x + o1 > W + 1) { s.remove(); break; }
        const trai = x + (o1 - w) / 2;
        s.style.left = trai + 'px';
        s.style.top = tren + 'px';
        if (lop === 'rong') {
          const m = tao(chu, 'muc');
          m.style.left = (trai + (r() - .5) * 1.6) + 'px';
          m.style.top = (tren + (r() - .5) * 1.4) + 'px';
          m.style.opacity = (.55 + r() * .25).toFixed(2);
          m.style.clipPath = `inset(0 ${Math.round(18 + r() * 40)}% 0 0)`;
        }
        if (lop === 'muc') {
          s.style.transform = `translate(${((r() - .5) * 1.8).toFixed(2)}px, ${((r() - .5) * 2).toFixed(2)}px) rotate(${((r() - .5) * 5).toFixed(2)}deg)`;
          s.style.fontWeight = Math.round(300 + r() * 100);
          s.style.opacity = (.8 + r() * .2).toFixed(2);
        }
        x += o1;
        k++;
      }
    });
  }

  function datLai() {
    doLuoi();
    coChu();
    vuaNhan();
    canhDong();
    dungTapViet();
  }

  /* ---------- ngòi bút ---------- */

  function datNgoi(x, y) {
    viTri = { x, y };
    ngoi.style.transform = `translate(${x}px, ${y}px)`;
  }

  function diToi(x, y, ms) {
    if (!viTri) { datNgoi(x, y); return Promise.resolve(); }
    const a = viTri;
    const t0 = performance.now();
    return new Promise(res => {
      const buoc = now => {
        const t = Math.min(1, (now - t0) / ms);
        const k = t * t * (3 - 2 * t);
        datNgoi(a.x + (x - a.x) * k, a.y + (y - a.y) * k - Math.sin(Math.PI * t) * 10);
        if (t < 1) requestAnimationFrame(buoc); else res();
      };
      requestAnimationFrame(buoc);
    });
  }

  function cmBut(loai, co) {
    ngoiDung.setAttribute('href', loai === 'bi' ? '#but-bi' : '#but-may');
    ngoi.style.setProperty('--s', co.toFixed(2));
  }

  async function viet(p, toc = 300) {
    const s = p.firstElementChild;
    const r = s.getBoundingClientRect();
    const cs = getComputedStyle(s);
    const pad = parseFloat(cs.paddingLeft);
    const f = parseFloat(cs.fontSize);
    const x0 = r.left + scrollX + pad * .7;
    const w = Math.max(10, r.width - pad * 1.7);
    const yb = r.top + scrollY + duongChan(s);
    const dur = Math.min(2800, Math.max(800, w / toc * 1000));
    const nhip = Math.max(3, Math.round(w / (f * .42)));
    const bien = Math.min(f * .16, 9);

    await diToi(x0, yb - f * .25, 260);
    p.classList.add('dang');
    p.classList.remove('cho');
    s.style.setProperty('--p', 0);

    await new Promise(res => {
      const t0 = performance.now();
      const buoc = now => {
        const t = Math.min(1, (now - t0) / dur);
        const k = .82 * t + .18 * (.5 - .5 * Math.cos(Math.PI * t));
        s.style.setProperty('--p', k.toFixed(4));
        datNgoi(x0 + w * k, yb - f * .25 + Math.sin(t * nhip * Math.PI * 2) * bien);
        if (t < 1) requestAnimationFrame(buoc); else res();
      };
      requestAnimationFrame(buoc);
    });
    p.classList.remove('dang');
    s.style.removeProperty('--p');
  }

  function veNetDo(path, ms) {
    const L = path.getTotalLength();
    return new Promise(res => {
      const t0 = performance.now();
      const buoc = now => {
        const t = Math.min(1, (now - t0) / ms);
        const k = 1 - Math.pow(1 - t, 1.5);
        path.style.strokeDashoffset = (1 - k).toFixed(4);
        const pt = path.getPointAtLength(k * L);
        const q = new DOMPoint(pt.x, pt.y).matrixTransform(path.getScreenCTM());
        datNgoi(q.x + scrollX, q.y + scrollY);
        if (t < 1) requestAnimationFrame(buoc); else res();
      };
      requestAnimationFrame(buoc);
    });
  }

  function diemDau(path) {
    const pt = path.getPointAtLength(0);
    const q = new DOMPoint(pt.x, pt.y).matrixTransform(path.getScreenCTM());
    return [q.x + scrollX, q.y + scrollY];
  }

  /* ---------- kịch bản ---------- */

  let sanSang;

  async function moVo() {
    if (html.classList.contains('mo')) return;
    html.classList.add('mo');
    nutMo.disabled = true;
    if (giam) {
      lop.remove();
      moKhoa();
      return;
    }
    await doi(950);
    lop.classList.add('tan');
    await doi(620);
    lop.remove();
    moKhoa();
    await sanSang;
    await doi(200);

    const butTim = $('.but-tim');
    butTim.classList.add('cam');
    const dau = $('.mo-dau .viet').firstElementChild.getBoundingClientRect();
    cmBut('may', .8);
    viTri = null;
    datNgoi(dau.left + scrollX, dau.top + scrollY + dau.height * .5);
    ngoi.classList.add('hien');
    const cacDong = $$('.mo-dau .viet');
    for (const p of cacDong) {
      const f = parseFloat(getComputedStyle(p.firstElementChild).fontSize);
      cmBut('may', Math.min(1.15, Math.max(.62, f / 46)));
      await viet(p, p.classList.contains('tieu-de') ? 300 : 360);
      await doi(120);
    }
    ngoi.classList.remove('hien');
    butTim.classList.remove('cam');
  }

  function moKhoa() {
    html.classList.remove('khoa');
    trang.inert = false;
    trang.focus({ preventScroll: true });
  }

  async function cham() {
    if (nutCham.disabled) return;
    nutCham.disabled = true;
    const net = $$('.net-do');
    const phe = $$('.o-phe .viet');

    if (!giam) {
      const butDo = $('.but-do');
      butDo.classList.add('cam');
      cmBut('bi', .62);
      viTri = null;
      const [x, y] = diemDau(net[0]);
      datNgoi(x + 30, y - 30);
      ngoi.classList.add('hien');
      const thoiGian = [520, 820, 320, 280];
      for (let i = 0; i < net.length; i++) {
        const [a, b] = diemDau(net[i]);
        await diToi(a, b, i === 0 ? 260 : 170);
        await veNetDo(net[i], thoiGian[i]);
      }
      await doi(220);
      for (const p of phe) {
        await viet(p, 260);
        await doi(100);
      }
      ngoi.classList.remove('hien');
      butDo.classList.remove('cam');
    } else {
      net.forEach(n => { n.style.strokeDashoffset = 0; });
      phe.forEach(p => p.classList.remove('cho'));
    }
    nutCham.textContent = 'Đã chấm điểm';
    bao.textContent = 'Đã chấm điểm 10. Lời phê: ' + phe.map(p => p.textContent).join(' ');
  }

  /* ---------- khởi động ---------- */

  trang.inert = true;
  if (!giam) $$('.mo-dau .viet').forEach(p => p.classList.add('cho'));
  $$('.o-phe .viet').forEach(p => p.classList.add('cho'));

  nutMo.addEventListener('click', moVo);
  nutCham.addEventListener('click', cham);

  const choFont = Promise.race([
    Promise.all([
      document.fonts.load('340 100px "Playwrite VN"', 'Chúc mừng cô'),
      document.fonts.load('350 18px "Lexend"', 'Người ta'),
    ]).then(() => document.fonts.ready),
    doi(3500),
  ]);

  sanSang = choFont.then(async () => {
    exTay = doEx();
    await khung();
    datLai();
    html.classList.add('san');
  });

  let rongCu = innerWidth;
  let hen;
  addEventListener('resize', () => {
    if (innerWidth === rongCu) return;
    rongCu = innerWidth;
    clearTimeout(hen);
    hen = setTimeout(datLai, 150);
  });
})();
