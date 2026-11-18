      if (w.hi) {   // highlighted keyword: yellow marker box with ink border + hard shadow, ink text
        const px = size * 0.16, bh = size * 1.06, bx = x - px, by = y - bh / 2 - 4, bw = w.w + px * 2;
        ctx.save(); ctx.translate(bx + bw / 2, y); ctx.rotate(-0.025); ctx.translate(-(bx + bw / 2), -y);
        ctx.fillStyle = C.ink; ctx.fillRect(bx + 9, by + 11, bw, bh);
        ctx.fillStyle = C.yellow; ctx.fillRect(bx, by, bw, bh); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = C.ink; ctx.fillText(w.txt, x, y + 2); ctx.restore();
        x += w.w + sp + px * 0.6; continue;
      }
      ctx.lineWidth = 26; ctx.strokeStyle = C.ink; ctx.strokeText(w.txt, x, y + 9); ctx.strokeText(w.txt, x, y);
      ctx.fillStyle = C.white; ctx.fillText(w.txt, x, y); x += w.w + sp;
