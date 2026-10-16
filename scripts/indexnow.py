#!/usr/bin/env python3
"""
IndexNow 제출 + sitemap lastmod 갱신 스크립트.

IndexNow는 페이지가 바뀌었다는 사실을 검색엔진에 바로 알리는 프로토콜이다. 한 번
제출하면 참여 검색엔진(Bing·Naver·Yandex 등)이 서로 공유한다. 구글은 참여하지 않는다.
소유 증명용 키 파일(<KEY>.txt)은 저장소 루트에 있고 Cloudflare Pages로 함께 배포된다.

사용법 (변경을 push하고 Cloudflare 배포가 끝난 뒤에 실행):
  py scripts/indexnow.py                       # 최근 1일 안에 내용이 바뀐 페이지 제출
  py scripts/indexnow.py --days 7              # 최근 7일
  py scripts/indexnow.py mortgage-calculator   # 지정한 페이지만
  py scripts/indexnow.py --all                 # sitemap의 전체 URL
  py scripts/indexnow.py --lastmod-only        # 제출 없이 sitemap lastmod만 갱신

sitemap.xml의 <lastmod>는 실행할 때마다 각 페이지의 "내용이 실제로 바뀐" 마지막 커밋
날짜로 맞춘다. CSS·JS를 고칠 때마다 모든 HTML의 ?v=N이 함께 올라가므로, 그런 버전
숫자만 바뀐 커밋과 사이드바 링크만 바뀐 커밋은 건너뛰고, 그 페이지 전용 JS 파일의
변경은 페이지 변경으로 친다.
"""
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
HOST = 'kcalculator.net'
BASE = f'https://{HOST}'
ENDPOINT = 'https://api.indexnow.org/indexnow'
SHARED_JS = {'site.js', 'url-state.js', 'export.js'}
VERSION_RE = re.compile(r'\?v=\d+')
# 사이드바·전체 목록 같은 내비게이션 마크업 줄. 이런 줄만 바뀐 커밋(새 페이지 링크 추가 등)은
# 그 페이지 내용 변경으로 보지 않는다.
NAV_LINE_RE = re.compile(r'^(<li><a href="[^"]*"( class="active")?>[^<]*</a></li>|<div class="(menu-group|all-calcs-group)">|</div>|<ul>|</ul>|<h[23]>[^<]*</h[23]>)?$')
_date_cache = {}


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True,
                          text=True, encoding='utf-8').stdout.strip()


def find_key():
    keys = [p for p in ROOT.glob('*.txt') if re.fullmatch(r'[0-9a-f]{32}\.txt', p.name)]
    if len(keys) != 1:
        sys.exit(f'키 파일(32자리 hex .txt)이 루트에 정확히 1개 있어야 합니다: {[k.name for k in keys]}')
    key = keys[0].read_text(encoding='utf-8').strip()
    if key != keys[0].stem:
        sys.exit('키 파일 이름과 내용이 다릅니다')
    return key


def sitemap_urls():
    return re.findall(r'<loc>(.*?)</loc>', (ROOT / 'sitemap.xml').read_text(encoding='utf-8'))


def slug_of(url):
    return url.replace(BASE, '').strip('/') or 'index'


def url_of(slug):
    return f'{BASE}/' if slug == 'index' else f'{BASE}/{slug}'


def page_files(slug):
    """페이지 HTML + 그 페이지 전용 JS 파일 (공용 JS 제외)."""
    html = ROOT / f'{slug}.html'
    js = re.findall(r'src="js/([^"?]+)', html.read_text(encoding='utf-8'))
    return [f'{slug}.html'] + [f'js/{j}' for j in js if j not in SHARED_JS]


def content_date(slug):
    """내용이 실제로 바뀐 마지막 커밋 날짜(YYYY-MM-DD). ?v=N만 바뀐 커밋은 건너뛴다."""
    if slug in _date_cache:
        return _date_cache[slug]
    log = git('log', '--format=@@COMMIT %cs', '--unified=0', '--', *page_files(slug))
    result = ''
    for chunk in log.split('@@COMMIT ')[1:]:
        commit_date, _, diff = chunk.partition('\n')
        plus, minus = [], []
        for line in diff.split('\n'):
            if line.startswith('+++') or line.startswith('---'):
                continue
            norm = VERSION_RE.sub('', line[1:]).strip()
            if NAV_LINE_RE.match(norm):
                continue
            if line.startswith('+'):
                plus.append(norm)
            elif line.startswith('-'):
                minus.append(norm)
        if sorted(plus) != sorted(minus):
            result = commit_date.strip()
            break
    _date_cache[slug] = result
    return result


def update_lastmod():
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    changed = 0

    def repl(m):
        nonlocal changed
        loc, old = m.group(1), m.group(2)
        new = content_date(slug_of(loc))
        if new and new != old:
            changed += 1
            return f'<loc>{loc}</loc><lastmod>{new}</lastmod>'
        return m.group(0)

    text = re.sub(r'<loc>(.*?)</loc><lastmod>(.*?)</lastmod>', repl, text)
    path.write_text(text, encoding='utf-8')
    print(f'sitemap lastmod 갱신: {changed}개')


def recent_urls(days):
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    return [u for u in sitemap_urls() if content_date(slug_of(u)) >= cutoff]


def submit(urls, key):
    body = json.dumps({
        'host': HOST,
        'key': key,
        'keyLocation': f'{BASE}/{key}.txt',
        'urlList': urls,
    }).encode('utf-8')
    req = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            print(f'IndexNow 응답: {res.status} (200·202면 접수됨)')
    except urllib.error.HTTPError as e:
        print(f'IndexNow 오류: {e.code} {e.reason} — 403이면 키 파일이 아직 배포되지 않은 것')
        sys.exit(1)


def main():
    args = sys.argv[1:]
    update_lastmod()
    if '--lastmod-only' in args:
        return
    key = find_key()
    if '--all' in args:
        urls = sitemap_urls()
    elif '--days' in args:
        urls = recent_urls(int(args[args.index('--days') + 1]))
    elif args:
        urls = [url_of(a[:-5] if a.endswith('.html') else a) for a in args]
    else:
        urls = recent_urls(1)
    if not urls:
        print('제출할 URL이 없습니다')
        return
    print('제출 URL:')
    for u in urls:
        print('  ' + u)
    submit(urls, key)


if __name__ == '__main__':
    main()
