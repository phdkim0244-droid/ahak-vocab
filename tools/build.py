#!/usr/bin/env python3
"""src/ 의 부품(css·js·html)을 모아 vocab/ card/ admin/ 의 index.html, manifest, sw.js 를 만든다.
사용: python3 tools/build.py   (파일을 고친 뒤 꼭 다시 실행 — 서비스 워커 버전이 자동으로 바뀜)"""
import hashlib, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
CARD_URL = os.environ.get('CARD_URL', 'https://phdkim0244-droid.github.io/ahak-vocab/card/')

def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s):
    os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
    open(p, 'w', encoding='utf-8').write(s); print('wrote', p, len(s.encode()))
def digest(paths):
    h = hashlib.sha1()
    for p in paths: h.update(open(p, 'rb').read())
    return h.hexdigest()[:10]

FONT_FACE = '''@font-face{font-family:"AhakSerif";src:url(../shared/fonts/NotoSerifKR-hanja.woff2) format("woff2");font-weight:100 900;font-display:swap;unicode-range:U+2E80-2FDF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+20000-2FA1F}'''

SW_REG = '''<script>
/* PWA: 서비스 워커 등록 — 처음 열 때 전체 자산을 저장해 두고, 그다음부터는 오프라인에서도 열립니다. 새 버전이 올라오면 자동으로 새로고침합니다. */
if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
  window.addEventListener('load',()=>{
    let had=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(had){ console.log('[pwa] 새 버전으로 새로고침'); location.reload(); } had=true; });
    navigator.serviceWorker.register('./sw.js').then(reg=>{ console.log('[pwa] service worker 등록 · scope='+reg.scope); }).catch(e=>console.warn('[pwa] 등록 실패',e));
  });
}
</script>'''

def sw(prefix, assets, version):
    return f'''/* {prefix} 서비스 워커 — 설치 시 전체 자산 프리캐시, 캐시 우선, 새 버전 자동 교체 (tools/build.py 가 생성) */
const VERSION='{version}';
const CACHE='{prefix}-'+VERSION;
const ASSETS={json.dumps(assets, ensure_ascii=False)};
self.addEventListener('install',e=>{{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
}});
self.addEventListener('activate',e=>{{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('{prefix}-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
}});
self.addEventListener('fetch',e=>{{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(
    caches.match(req,{{ignoreSearch:true}}).then(hit=>hit||fetch(req).then(res=>{{
      if(res&&res.ok&&res.type==='basic'){{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }}
      return res;
    }}).catch(()=>req.mode==='navigate'?caches.match('./index.html'):undefined))
  );
}});
'''

def manifest(name, short, desc, theme, bg, start=True):
    m = {"name": name, "short_name": short, "description": desc, "lang": "ko", "dir": "ltr",
         "display": "standalone", "orientation": "any", "background_color": bg, "theme_color": theme, "scope": "./",
         "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                   {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                   {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
    if start: m["start_url"] = "./"
    return json.dumps(m, ensure_ascii=False, indent=1)

def head(title, short, desc, theme, bg, extra_css='', pwa=True):
    h = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="{theme}">
'''
    if pwa:
        h += f'''<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{short}">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
'''
    h += f'<style>\n{extra_css}\n</style>\n</head>\n'
    return h

# ---------------- vocab ----------------
BASE_CSS = ''':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}'''
vocab_html = (head('청자골 아학 어휘력', '아학 어휘력', '초등 3~6학년 교과서 어휘력 교재 — 학년·학기·교과·단원별 어휘 카드와 골든벨 퀴즈', '#2E7D6E', '#EEF4F1',
                   BASE_CSS + '\n' + FONT_FACE + '\n' + rd('src/vocab/app.css'))
              + '<body>\n' + rd('src/vocab/body.html').strip() + '\n<script src="data.js"></script>\n<script>\n' + rd('src/vocab/app.js').strip() + '\n</script>\n' + SW_REG + '\n</body>\n</html>\n')
wr('vocab/index.html', vocab_html)
wr('vocab/manifest.webmanifest', manifest('청자골 아학 어휘력', '아학 어휘력', '초등 3~6학년 교과서 어휘력 교재', '#2E7D6E', '#EEF4F1'))
vocab_assets = ['./', './index.html', './data.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', '../shared/fonts/NotoSerifKR-hanja.woff2']
wr('vocab/sw.js', sw('ahak-vocab', vocab_assets, digest(['vocab/index.html', 'vocab/data.js', 'vocab/manifest.webmanifest', 'shared/fonts/NotoSerifKR-hanja.woff2'])))

# ---------------- card ----------------
card_html = (head('청자골 아학 어휘카드', '어휘카드', '우리 학급 교과서 어휘 카드 학습과 어휘력 퀴즈 — 홈 화면에 추가하면 인터넷 없이도 쓸 수 있어요', '#2563eb', '#f3f4f6',
                  FONT_FACE + '\n' + rd('src/card/app.css'))
             + '<body>\n' + rd('src/card/body.html').strip() + '\n<script src="../shared/data.js"></script>\n<script>\n' + rd('src/card/setup.js').strip()
             + '\n</script>\n<script>\n' + rd('src/card/app.js').strip() + '\n</script>\n' + SW_REG + '\n</body>\n</html>\n')
wr('card/index.html', card_html)
# 학생용은 start_url 을 두지 않는다: 홈 화면에 추가할 때 학급 설정이 담긴 현재 주소(해시 포함)가 시작 주소가 되도록.
wr('card/manifest.webmanifest', manifest('청자골 아학 어휘카드', '어휘카드', '우리 학급 교과서 어휘 카드 학습', '#2563eb', '#f3f4f6', start=False))
card_assets = ['./', './index.html', './cover.jpg', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', '../shared/data.js', '../shared/fonts/NotoSerifKR-hanja.woff2']
wr('card/sw.js', sw('ahak-card', card_assets, digest(['card/index.html', 'card/cover.jpg', 'card/manifest.webmanifest', 'shared/data.js', 'shared/fonts/NotoSerifKR-hanja.woff2'])))

# ---------------- admin ----------------
admin_js = rd('src/admin/app.js').replace('__CARD_URL__', CARD_URL)
admin_html = (head('청자골 아학-교과서 어휘력 카드 · 교사 배포도구', '배포도구', '학급별 어휘카드 링크·QR 생성 도구(교사용)', '#2563eb', '#f3f4f6', rd('src/admin/app.css'), pwa=False)
              .replace('</head>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js" defer></script>\n</head>')
              + '<body>\n' + rd('src/admin/body.html').strip() + '\n<script src="../shared/data.js"></script>\n<script>\n' + admin_js.strip() + '\n</script>\n</body>\n</html>\n')
wr('admin/index.html', admin_html)
print('done')
