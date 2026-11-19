// Hạt bay: bụi nhũ vàng, sao lấp lánh, cánh hoa. Canvas 2D, vẽ sẵn sprite để điện thoại vẫn mượt.
(function () {
  'use strict';

  const cv = document.getElementById('hat');
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!cv || giam) {
    window.HatBay = { bung() {}, ven() {}, mua() {}, chay() {} };
    return;
  }
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function doiCo() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  doiCo();
  addEventListener('resize', doiCo);

  function sprite(w, h, ve) {
    const c = document.createElement('canvas');
    c.width = w * 2; c.height = h * 2;
    const g = c.getContext('2d'); g.scale(2, 2); ve(g, w, h);
    return c;
  }

  const NHU = sprite(16, 16, (g) => {
    const r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    r.addColorStop(0, 'rgba(255,250,222,1)');
    r.addColorStop(.22, 'rgba(244,212,128,.95)');
    r.addColorStop(.55, 'rgba(214,170,80,.35)');
    r.addColorStop(1, 'rgba(214,170,80,0)');
    g.fillStyle = r; g.fillRect(0, 0, 16, 16);
  });

  const SAO = sprite(28, 28, (g) => {
    const r = g.createRadialGradient(14, 14, 0, 14, 14, 14);
    r.addColorStop(0, 'rgba(255,246,210,.9)'); r.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = r; g.fillRect(0, 0, 28, 28);
    g.fillStyle = 'rgba(255,252,236,1)';
    g.beginPath();
    g.moveTo(14, 1); g.quadraticCurveTo(15, 13, 27, 14); g.quadraticCurveTo(15, 15, 14, 27);
    g.quadraticCurveTo(13, 15, 1, 14); g.quadraticCurveTo(13, 13, 14, 1); g.fill();
  });

  const MAU_CANH = [['#f7c6cf', '#e98fa1'], ['#fbe3e7', '#f0b3bf'], ['#d9c8ee', '#b59ad9'], ['#fff3f0', '#f3cfc6']];
  const CANH = MAU_CANH.map(([a, b]) => sprite(18, 22, (g) => {
    const r = g.createLinearGradient(9, 0, 9, 22);
    r.addColorStop(0, a); r.addColorStop(1, b);
    g.fillStyle = r;
    g.beginPath();
    g.moveTo(9, 21);
    g.bezierCurveTo(1, 15, 1, 5, 6, 2);
    g.quadraticCurveTo(9, 4, 12, 2);
    g.bezierCurveTo(17, 5, 17, 15, 9, 21);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = .6;
    g.beginPath(); g.moveTo(9, 19); g.quadraticCurveTo(8, 11, 9, 5); g.stroke();
  }));

  const ds = [];
  let nen = false, chay = false, tCu = 0, henNen = 0;

  function them(p) { if (ds.length < 420) ds.push(p); }

  function capNhat(dt) {
    for (let i = ds.length - 1; i >= 0; i--) {
      const p = ds[i];
      p.t += dt;
      if (p.loai === 'canh') {
        p.vx += Math.sin(p.t * p.lac + p.pha) * 14 * dt;
        p.vy = Math.min(p.vy + 30 * dt, p.vmax);
        p.goc += p.vg * dt;
        p.lat = Math.sin(p.t * p.lac * 1.3 + p.pha);
      } else {
        p.vx *= 1 - p.can * dt;
        p.vy = p.vy * (1 - p.can * dt) + p.roi * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t > p.song || p.y > H + 40) ds.splice(i, 1);
    }
  }

  function ve() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of ds) {
      const vao = Math.min(1, p.t / 0.25), ra = Math.min(1, (p.song - p.t) / 0.8);
      let a = p.a * vao * ra;
      if (p.loai !== 'canh') a *= 0.65 + 0.35 * Math.sin(p.t * p.nhay + p.pha);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      if (p.loai === 'canh') {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.goc); ctx.scale(1, 0.35 + 0.65 * Math.abs(p.lat));
        ctx.drawImage(p.spr, -p.c / 2, -p.c * .61, p.c, p.c * 1.22);
        ctx.restore();
      } else {
        ctx.drawImage(p.spr, p.x - p.c / 2, p.y - p.c / 2, p.c, p.c);
      }
    }
    ctx.globalAlpha = 1;
  }

  function vong(ms) {
    const dt = Math.min(0.05, (ms - tCu) / 1000 || 0.016);
    tCu = ms;
    capNhat(dt); ve();
    if (ds.length || nen) requestAnimationFrame(vong); else { chay = false; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  function batDau() { if (!chay) { chay = true; tCu = performance.now(); requestAnimationFrame(vong); } }

  const ngau = (a, b) => a + Math.random() * (b - a);

  function hatNhu(x, y, o = {}) {
    them({
      loai: 'nhu', spr: Math.random() < (o.sao || 0) ? SAO : NHU,
      x, y, vx: o.vx || 0, vy: o.vy || 0, can: o.can ?? 1.6, roi: o.roi ?? 26,
      c: o.c || ngau(5, 11), a: o.a ?? ngau(.6, 1), t: 0, song: o.song || ngau(1.4, 2.6),
      nhay: ngau(5, 11), pha: ngau(0, 6.3)
    });
  }

  // vỡ dấu sáp: bụi nhũ toả tròn
  function bung(x, y, n = 46) {
    for (let i = 0; i < n; i++) {
      const g = Math.random() * Math.PI * 2, v = ngau(50, 260);
      hatNhu(x, y, { vx: Math.cos(g) * v, vy: Math.sin(g) * v - 40, c: ngau(5, 13), sao: .14, song: ngau(1.2, 2.4) });
    }
    batDau();
  }

  // nhũ rơi ở ngòi bút khi chữ hiện dần
  function ven(x, y) {
    hatNhu(x + ngau(-3, 3), y + ngau(-8, 8), { vx: ngau(-14, 14), vy: ngau(-20, 10), c: ngau(4, 9), sao: .08, song: ngau(.8, 1.6), roi: 40 });
    batDau();
  }

  // mưa cánh hoa + nhũ từ trên xuống
  function mua(n = 70) {
    for (let i = 0; i < n; i++) {
      const tre = Math.random() * 2.2;
      setTimeout(() => {
        if (Math.random() < .62) {
          them({
            loai: 'canh', spr: CANH[(Math.random() * CANH.length) | 0],
            x: ngau(-20, W + 20), y: ngau(-60, -10), vx: ngau(-12, 12), vy: ngau(20, 50), vmax: ngau(55, 95),
            c: ngau(11, 19), a: ngau(.75, 1), t: 0, song: 14, goc: ngau(0, 6.3), vg: ngau(-1.6, 1.6),
            lac: ngau(1.2, 2.4), pha: ngau(0, 6.3), lat: 1
          });
        } else {
          hatNhu(ngau(0, W), ngau(-30, 0), { vx: ngau(-8, 8), vy: ngau(30, 70), can: .2, roi: 6, c: ngau(5, 11), sao: .2, song: ngau(6, 10) });
        }
        batDau();
      }, tre * 1000);
    }
  }

  // bụi nhũ lơ lửng rất nhẹ trên nền
  function chayNen(bat) {
    nen = bat;
    clearInterval(henNen);
    if (!bat) return;
    henNen = setInterval(() => {
      if (document.hidden) return;
      hatNhu(ngau(0, W), ngau(0, H), { vx: ngau(-6, 6), vy: ngau(-10, -2), can: 0, roi: 0, c: ngau(4, 8), a: ngau(.25, .55), song: ngau(4, 7) });
    }, 380);
    batDau();
  }

  window.HatBay = { bung, ven, mua, chay: chayNen };
})();
