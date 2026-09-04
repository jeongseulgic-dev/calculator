#!/usr/bin/env python3
"""
정적 사이트 일관성 검증 스크립트.

세션 내내 새 계산기 페이지를 추가할 때마다 손으로 돌리던 체크(HTML div 균형,
사이드바 링크 일관성, label-for 연결, 내부 링크 깨짐, sitemap 누락)를 한 번에 모아
자동화했다. GitHub Actions에서 push/PR마다 돌아간다 (.github/workflows/verify.yml).
JS 문법 검사는 여기서 하지 않는다 — 괄호를 문자 개수로 세면 정규식 리터럴 안의
괄호까지 잘못 세어 오탐이 나서(예: main-calc.js), 워크플로우에서 `node --check`로
따로 검사한다.

실패하면 non-zero exit code로 종료해서 CI가 빨간불을 띄운다.
"""
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
errors = []


def fail(msg):
    errors.append(msg)


def html_files():
    return sorted(ROOT.glob('*.html'))


def js_files():
    return sorted((ROOT / 'js').glob('*.js'))


def check_tag_balance():
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        open_count = len(re.findall(r'<div[\s>]', text))
        close_count = text.count('</div>')
        if open_count != close_count:
            fail(f'[div balance] {f.name}: <div> {open_count} vs </div> {close_count}')


def check_label_for():
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        ids = set(re.findall(r'\bid="([^"]+)"', text))
        for target in re.findall(r'<label for="([^"]+)"', text):
            if target not in ids:
                fail(f'[label for=] {f.name}: for="{target}" has no matching id')


def check_internal_links():
    # Cloudflare Pages가 .html을 벗겨 서빙하므로 내부 링크는 확장자 없이 쓴다
    # (index.html만 "/"). existing은 그 확장자 없는 슬러그 집합.
    existing = {f.stem for f in html_files() if f.name not in ('index.html', '404.html')}
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        for href in re.findall(r'href="([^"]*)"', text):
            if href.startswith(('http://', 'https://', 'mailto:', '#')):
                continue
            if href == '/':
                continue
            slug = href.lstrip('/').split('#')[0].split('?')[0]
            # 확장자가 있는 정적 파일(style.css, favicon.png 등)은 실제 파일
            # 존재 여부로, 계산기 페이지 슬러그는 확장자 없는 존재 집합으로 확인
            # (캐시 버스팅용 ?v= 쿼리는 파일 존재 확인 전에 떼어낸다)
            if '.' in slug:
                if not (ROOT / slug).exists():
                    fail(f'[broken link] {f.name}: href="{href}" does not exist')
            elif slug not in existing:
                fail(f'[broken link] {f.name}: href="{href}" does not exist')


def sidebar_links(text):
    m = re.search(r'<nav>(.*?)</nav>', text, re.DOTALL)
    if not m:
        return None
    return set(re.findall(r'<li><a href="([^"?]+)"', m.group(1)))


def check_sidebar_consistency():
    per_file = {}
    for f in html_files():
        links = sidebar_links(f.read_text(encoding='utf-8'))
        if links is not None:
            per_file[f.name] = links

    if not per_file:
        return

    canonical = set()
    for links in per_file.values():
        canonical |= links

    for name, links in per_file.items():
        slug = name[:-5]  # name.html -> name (sidebar hrefs are extensionless)
        missing = canonical - links - {slug}  # a page needn't link to itself
        extra = links - canonical
        if missing:
            fail(f'[sidebar] {name}: missing links to {sorted(missing)}')
        if extra:
            fail(f'[sidebar] {name}: links to nonexistent/stray pages {sorted(extra)}')


def check_sitemap():
    sitemap_path = ROOT / 'sitemap.xml'
    if not sitemap_path.exists():
        fail('[sitemap] sitemap.xml not found')
        return
    text = sitemap_path.read_text(encoding='utf-8')
    sitemap_urls = set(re.findall(r'<loc>https://kcalculator\.net/([^<]*)</loc>', text))
    sitemap_slugs = {u for u in sitemap_urls if u}  # 빈 문자열('/'=홈)은 제외

    calculator_pages = {f.stem for f in html_files() if f.name.endswith('-calculator.html')}
    noindexed = {
        f.stem for f in html_files()
        if re.search(r'<meta\s+name="robots"\s+content="noindex', f.read_text(encoding='utf-8'))
    }
    calculator_pages -= noindexed

    missing = calculator_pages - sitemap_slugs
    if missing:
        fail(f'[sitemap] missing from sitemap.xml: {sorted(missing)}')

    stray = sitemap_slugs - {f.stem for f in html_files()}
    if stray:
        fail(f'[sitemap] sitemap.xml references nonexistent files: {sorted(stray)}')


def check_heading_order():
    # 사이드바(<nav>)는 자체 그룹 제목(금융/건강/수학/생활)이 h2라 본문 헤딩
    # 순서와 별개 트리로 취급한다 — 제외하고 본문 흐름만 검사한다.
    # 레벨이 내려가는 건(h3 뒤에 h2 등, 새 섹션 시작) 항상 허용하고, 레벨을
    # 건너뛰며 올라가는 것만(h1 다음 h3처럼 h2 없이 깊어짐) 위반으로 본다 —
    # 접근성 도구(axe-core heading-order 규칙)가 쓰는 것과 같은 기준.
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        text = re.sub(r'<nav>.*?</nav>', '', text, flags=re.DOTALL)
        headings = re.findall(r'<h([1-6])[\s>]', text)
        prev = None
        for level in (int(h) for h in headings):
            if prev is not None and level > prev + 1:
                fail(f'[heading order] {f.name}: h{prev} 다음에 h{level} (h{prev + 1} 건너뜀)')
            prev = level


def check_asset_version():
    # style.css·js/*.js는 전부 같은 ?v=N 캐시 버스팅 쿼리를 달고 있어야 한다
    # (CLAUDE.md 파일 구조 섹션 참고) — 하나라도 빠지거나 값이 어긋나면 배포
    # 직후 일부 방문자가 옛 자산을 계속 캐시해서 쓰는 사고로 이어진다.
    versions = set()
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        for href in re.findall(r'href="(style\.css[^"]*)"', text):
            m = re.search(r'\?v=(\d+)$', href)
            if not m:
                fail(f'[asset version] {f.name}: href="{href}" missing ?v= query')
            else:
                versions.add(m.group(1))
        for src in re.findall(r'src="(js/[a-z0-9-]+\.js[^"]*)"', text):
            m = re.search(r'\?v=(\d+)$', src)
            if not m:
                fail(f'[asset version] {f.name}: src="{src}" missing ?v= query')
            else:
                versions.add(m.group(1))
    if len(versions) > 1:
        fail(f'[asset version] 여러 버전이 섞여 있음: {sorted(versions)} (전체가 같은 값이어야 함)')


def main():
    check_tag_balance()
    check_label_for()
    check_internal_links()
    check_sidebar_consistency()
    check_sitemap()
    check_heading_order()
    check_asset_version()

    if errors:
        print(f'FAILED — {len(errors)}개 문제 발견:\n')
        for e in errors:
            print(' -', e)
        sys.exit(1)

    print(f'OK — {len(html_files())}개 HTML, {len(js_files())}개 JS 파일 검증 통과')


if __name__ == '__main__':
    main()
