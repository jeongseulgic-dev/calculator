# 근로소득 간이세액표(소득세법 시행령 [별표 2]) PDF → js/wage-tax-table.js 의 데이터 부분 재생성.
# 사용: py scripts/build_wage_tax_table.py <별표2.pdf>
#   국가법령정보센터 소득세법 시행령 별표 2 PDF를 받아 넣는다. 표가 개정되면 이것만 돌리고,
#   js/wage-tax-table.js 의 WAGE_TAX_ROWS·WAGE_TAX_TOP 두 상수를 출력 결과로 바꾼다
#   (1,000만원 초과 계산식·비고는 원문과 대조해 직접 고친다). 그 뒤 ?v=N 캐시 버전을 올린다.
import re
import sys

import pypdf

sys.stdout.reconfigure(encoding='utf-8')
text = '\n'.join(p.extract_text() for p in pypdf.PdfReader(sys.argv[1]).pages)
num = r'(\d{1,3}(?:,\d{3})*|-)'
row_re = re.compile(r'^(\d{1,2},?\d{3}|\d{3}) (\d{1,2},?\d{3}|\d{3})((?: ' + num + r'){11})\s*$', re.M)
rows = []
for m in row_re.finditer(text):
    vals = [0 if v == '-' else int(v.replace(',', '')) for v in m.group(3).split()]
    rows.append([int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))] + vals)
top = [int(v.replace(',', '')) for v in re.search(r'^10,000천원((?: \d{1,3}(?:,\d{3})*){11})\s*$', text, re.M).group(1).split()]

assert all(a[1] == b[0] for a, b in zip(rows, rows[1:])), '구간 사이 빈틈'
assert rows[-1][1] == 10000, '마지막 구간이 10,000천원에서 끝나지 않음'
assert all(v % 10 == 0 for r in rows for v in r[2:]) and all(v % 10 == 0 for v in top)
print(f'// {len(rows)}구간, {rows[0][0]}~{rows[-1][1]}천원')
print('const WAGE_TAX_ROWS = [')
print(',\n'.join('[' + ','.join([str(r[0])] + [str(v // 10) for v in r[2:]]) + ']' for r in rows))
print('];')
print(f'const WAGE_TAX_TOP = {top};'.replace(' ', '').replace('constWAGE_TAX_TOP=', 'const WAGE_TAX_TOP = '))
