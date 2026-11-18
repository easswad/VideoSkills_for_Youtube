"""Turn a fresh faceless-shorts project into a 2D-VID project (our comic / 3D kit + house caption look).

  python3 apply_kit.py <project> comic     2D comic look  (project made with: new_video.sh inside-out <name>)
  python3 apply_kit.py <project> lab       3D hacker lab  (project made with: new_video.sh night-file <name>)
  python3 apply_kit.py <project> studio    3D real studio (project made with: new_video.sh night-file <name>)

Idempotent: running it twice changes nothing the second time. Prints what it did.
"""
import shutil, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / 'kit'


def patch(path, old, new, label):
    s = path.read_text()
    if new in s: print(f'  = {label} (already applied)'); return
    if old not in s: sys.exit(f'  ! {label}: anchor not found in {path}. The faceless-shorts engine changed; apply by hand (see kit/patches).')
    path.write_text(s.replace(old, new, 1)); print(f'  + {label}')


def comic(P):
    shutil.copy(KIT / 'comic.js', P / 'src/core/comic.js'); print('  + src/core/comic.js')
    cap = P / 'src/core/captions.js'
    patch(cap, 'export const CAP = { y: 1400, size: 150, maxW: 900 };', 'export const CAP = { y: 1420, size: 116, maxW: 820 };', 'captions: safe-zone size/position')
    patch(cap, 'const width = (ws) => ws.reduce((a, w) => a + w.w, 0) + sp * (ws.length - 1);',
          'const width = (ws) => ws.reduce((a, w) => a + w.w + (w.hi ? size * 0.42 : 0), 0) + sp * (ws.length - 1);', 'captions: marker width')
    patch(cap, 'let x = -width(ln) / 2; const y = y0 + li * lh;',
          'let x = -width(ln) / 2 + (ln[0].hi ? size * 0.16 : 0); const y = y0 + li * lh * 1.12;', 'captions: line spacing')
    patch(cap, (KIT / 'patches/captions-old.js').read_text().strip(), (KIT / 'patches/captions-marker.js').read_text().strip(), 'captions: yellow marker keyword')
    main = P / 'src/main.js'
    patch(main, '  sh.draw(lt, d, t);\n  ctx.restore();\n', '  sh.draw(lt, d, t);\n  ctx.restore();\n  panelFrame(sh.frame);\n', 'main: call panelFrame')
    s = main.read_text()
    if 'function panelFrame' not in s:
        main.write_text(s.rstrip() + '\n\n' + (KIT / 'patches/panel-frame.js').read_text()); print('  + main: panelFrame()')


def three(P, which):
    src = {'lab': 'lab.js', 'studio': 'studio.js'}[which]
    shutil.copy(KIT / src, P / 'src/core' / src); print(f'  + src/core/{src}')
    kit = P / 'src/core/kit.js'
    look = ("export const CAPLOOK = { font: '900 96px Inter', y: 1430, maxW: 960, fg: '#FFFFFF', hi: '#FFD43B' };")
    patch(kit, 'export const CAPLOOK = { font: `700 86px ${MONO}`, y: 1560, maxW: 940, fg: P.cream, hi: P.red };', look, 'kit: CAPLOOK safe zone + yellow')
    patch(kit, "  words.forEach((w, i) => { ctx.fillStyle = w.hi ? look.hi : look.fg; ctx.fillText(w.txt, cx, 0); cx += ws[i] + sp; });",
          "  ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#000'; words.forEach((w, i) => { ctx.strokeText(w.txt, cx, 0); ctx.fillStyle = w.hi ? look.hi : look.fg; ctx.fillText(w.txt, cx, 0); cx += ws[i] + sp; });",
          'kit: black caption stroke')
    (P / 'img').mkdir(exist_ok=True)


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[2] not in ('comic', 'lab', 'studio'): sys.exit(__doc__)
    P = Path(sys.argv[1]).expanduser().resolve()
    if not (P / 'src/main.js').exists(): sys.exit(f'{P} is not a faceless-shorts project (no src/main.js)')
    print(f'applying 2D-VID kit "{sys.argv[2]}" to {P}')
    comic(P) if sys.argv[2] == 'comic' else three(P, sys.argv[2])
    print('done. Next: write script.json + src/shots.js (start from examples/), then scripts/multivoice.py')
