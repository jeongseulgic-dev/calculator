// 사칙연산 + 삼각함수/로그/제곱근을 처리하는 자체 수식 파서 (재귀 하강).
// math.js(716KB, evaluate() 한 줄 용도) 대체 — main-calc.js가 이미 퍼센트·
// 암시적곱셈·괄호자동닫기·deg 삽입까지 문자열 단계에서 끝내 두므로, 여기서는
// +  -  *  /  ^  ( )  숫자  pi  e  sin/cos/tan/sqrt/log10/log  그리고
// 삼각함수 인자 뒤에 붙는 접미사 deg(도→라디안)만 처리하면 된다.
const ExprEval = (() => {
  const FUNCS = {
    sin: x => Math.sin(x),
    cos: x => Math.cos(x),
    tan: x => Math.tan(x),
    sqrt: x => Math.sqrt(x),
    log10: x => Math.log10(x),
    log: x => Math.log(x), // main-calc.js에서 ln( -> log(로 치환해 넘어옴
  };
  const CONSTS = { pi: Math.PI, e: Math.E };

  function tokenize(src){
    const tokens = [];
    let i = 0;
    while (i < src.length){
      const c = src[i];
      if (c === ' '){ i++; continue; }
      if ('+-*/^()'.includes(c)){ tokens.push(c); i++; continue; }
      if (/[0-9.]/.test(c)){
        let j = i+1;
        while (j < src.length && /[0-9.]/.test(src[j])) j++;
        tokens.push({num: parseFloat(src.slice(i, j))});
        i = j; continue;
      }
      if (/[a-z]/.test(c)){
        let j = i+1;
        while (j < src.length && /[a-z0-9]/.test(src[j])) j++;
        tokens.push({id: src.slice(i, j)});
        i = j; continue;
      }
      throw new Error(`unexpected character: ${c}`);
    }
    return tokens;
  }

  function parse(tokens){
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseAtom(){
      const t = peek();
      if (t === undefined) throw new Error('unexpected end of expression');
      if (t === '('){
        next();
        const v = parseAddSub();
        if (next() !== ')') throw new Error('missing )');
        return v;
      }
      if (typeof t === 'object' && 'num' in t){ next(); return t.num; }
      if (typeof t === 'object' && 'id' in t){
        next();
        if (t.id in FUNCS){
          if (next() !== '(') throw new Error(`${t.id} requires (`);
          const arg = parseAddSub();
          if (next() !== ')') throw new Error('missing )');
          return FUNCS[t.id](arg);
        }
        if (t.id in CONSTS) return CONSTS[t.id];
        throw new Error(`unknown identifier: ${t.id}`);
      }
      throw new Error(`unexpected token: ${t}`);
    }

    function parsePostfix(){
      let v = parseAtom();
      if (peek() && peek().id === 'deg'){ next(); v = v * Math.PI / 180; }
      return v;
    }

    function parsePower(){
      const base = parsePostfix();
      if (peek() === '^'){ next(); return Math.pow(base, parseUnary()); }
      return base;
    }

    function parseUnary(){
      if (peek() === '-'){ next(); return -parseUnary(); }
      if (peek() === '+'){ next(); return parseUnary(); }
      return parsePower();
    }

    function startsAtom(t){
      if (t === '(') return true;
      if (typeof t === 'object' && t !== null && 'num' in t) return true;
      if (typeof t === 'object' && t !== null && 'id' in t && t.id !== 'deg') return true;
      return false;
    }

    function parseMulDiv(){
      let v = parseUnary();
      while (true){
        const t = peek();
        if (t === '*' || t === '/'){
          const op = next();
          const rhs = parseUnary();
          v = op === '*' ? v * rhs : v / rhs;
        } else if (startsAtom(t)){
          // 전처리가 못 잡은 암시적 곱셈(예: 함수 호출 바로 뒤에 또 다른 함수/숫자)도
          // math.js 파서처럼 연산자 없이 인접하면 곱셈으로 처리한다
          v = v * parseUnary();
        } else {
          break;
        }
      }
      return v;
    }

    function parseAddSub(){
      let v = parseMulDiv();
      while (peek() === '+' || peek() === '-'){
        const op = next();
        const rhs = parseMulDiv();
        v = op === '+' ? v + rhs : v - rhs;
      }
      return v;
    }

    const result = parseAddSub();
    if (pos !== tokens.length) throw new Error('unexpected trailing input');
    return result;
  }

  function evaluate(expr){
    return parse(tokenize(expr));
  }

  return { evaluate };
})();
