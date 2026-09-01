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
    existing = {f.name for f in html_files()}
    for f in html_files():
        text = f.read_text(encoding='utf-8')
        for href in re.findall(r'href="([^"#][^"]*\.html)(?:#[^"]*)?"', text):
            if href.startswith(('http://', 'https://', 'mailto:')):
                continue
            if href not in existing:
                fail(f'[broken link] {f.name}: href="{href}" does not exist')


def sidebar_links(text):
    m = re.search(r'<nav>(.*?)</nav>', text, re.DOTALL)
    if not m:
        return None
    return set(re.findall(r'<li><a href="([^"?]+\.html)"', m.group(1)))


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
        missing = canonical - links - {name}  # a page needn't link to itself
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
    sitemap_pages = {u for u in sitemap_urls if u.endswith('.html')}

    calculator_pages = {f.name for f in html_files() if f.name.endswith('-calculator.html')}

    missing = calculator_pages - sitemap_pages
    if missing:
        fail(f'[sitemap] missing from sitemap.xml: {sorted(missing)}')

    stray = sitemap_pages - {f.name for f in html_files()}
    if stray:
        fail(f'[sitemap] sitemap.xml references nonexistent files: {sorted(stray)}')


def main():
    check_tag_balance()
    check_label_for()
    check_internal_links()
    check_sidebar_consistency()
    check_sitemap()

    if errors:
        print(f'FAILED — {len(errors)}개 문제 발견:\n')
        for e in errors:
            print(' -', e)
        sys.exit(1)

    print(f'OK — {len(html_files())}개 HTML, {len(js_files())}개 JS 파일 검증 통과')


if __name__ == '__main__':
    main()
