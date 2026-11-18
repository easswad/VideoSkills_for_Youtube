// comic panel: white gutter + thick ink border around every shot (screen space, not zoomed)
function panelFrame(f = {}) {
  const m = 24, r = 18;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(m, m, W - 2 * m, H - 2 * m, r);
  ctx.fillStyle = '#FFFFFF'; ctx.fill('evenodd');
  ctx.lineWidth = 10; ctx.strokeStyle = '#1A1A1E'; ctx.beginPath(); ctx.roundRect(m, m, W - 2 * m, H - 2 * m, r); ctx.stroke();
  ctx.restore();
}
