const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};

const Fmt = {
  removeCommas(s){ return s.toString().replace(/,/g,''); },
  display(v){
    if (v==='Error'||v==='NaN') return 'Error';
    let clean = Fmt.removeCommas(v);
    return clean.replace(/\b\d+(\.\d+)?\b/g, m=>{
      const p=m.split('.'); p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.');
    });
  },
  toSup(n){ return n.toString().split('').map(c=>SUP[c]||c).join(''); }
};

// 괄호 깊이를 추적해 중첩된 sin/cos/tan도 정확히 deg로 감싸는 변환기
function convertTrigToDeg(expr){
  let out = ''; let i = 0;
  const fns = ['sin','cos','tan'];
  while (i < expr.length){
    let matched = fns.find(fn => expr.startsWith(fn+'(', i));
    if (matched){
      out += matched + '(';
      i += matched.length + 1;
      let depth = 1, inner = '';
      while (i < expr.length && depth > 0){
        if (expr[i] === '(') depth++;
        if (expr[i] === ')'){ depth--; if (depth===0) break; }
        inner += expr[i]; i++;
      }
      out += convertTrigToDeg(inner) + ' deg)';
      i++;
    } else {
      out += expr[i]; i++;
    }
  }
  return out;
}

class Engine {
  static evaluate(expression){
    let expr = Fmt.removeCommas(expression);

    expr = expr.replace(/[⎕□]/g, '');
    expr = expr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m=>{
      const normal = m.split('').map(c => Object.keys(SUP).find(k=>SUP[k]===c) || c).join('');
      return `^${normal}`;
    });

    const open = (expr.match(/\(/g)||[]).length;
    const close = (expr.match(/\)/g)||[]).length;
    if (open > close) expr += ')'.repeat(open-close);

    expr = expr.replace(/(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)%/g, (m,a,op,b)=>`${a} * (1 ${op} (${b}/100))`);
    expr = expr.replace(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)%/g, '$1 * ($2/100)');
    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // 괄호 앞뒤 암시적 곱셈은 log/ln -> log10/log 치환보다 먼저 처리해야 한다.
    // 순서가 바뀌면 "log10"의 끝자리 숫자 0을 괄호 앞 숫자로 오인해
    // "log10(100)"이 "log10 * (100)"으로 깨지는 버그가 있었다(log10을 값이
    // 아닌 함수로 곱하려다 에러 발생 — 실사용 시 상용로그 계산이 전부 실패).
    expr = expr.replace(/(\d)\s*\(/g, '$1 * (');
    expr = expr.replace(/\)\s*(\d)/g, ') * $1');
    expr = expr.replace(/\)\s*\(/g, ') * (');

    expr = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/π/g,'pi')
                .replace(/√\(/g,'sqrt(').replace(/log\(/g,'log10(').replace(/ln\(/g,'log(');

    expr = expr.replace(/(\d)\s*(pi|e|sqrt|log10|log|sin|cos|tan)\b/g, '$1 * $2');

    expr = convertTrigToDeg(expr);

    const num = ExprEval.evaluate(expr);
    if (!isFinite(num) || isNaN(num)) throw new Error('invalid result');
    return Math.round(num * 1e8) / 1e8;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const screenMain = document.getElementById('screenMain');
  const screenHistory = document.getElementById('screenHistory');
  const modeToggle = document.getElementById('modeToggle');
  const padStandard = document.getElementById('pad-standard');
  const padScientific = document.getElementById('pad-scientific');
  const historyBody = document.getElementById('historyBody');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const mobileHistoryBtn = document.getElementById('mobileHistoryBtn');
  const receiptPanel = document.querySelector('.receipt');

  if (!screenMain) return; // this page doesn't have the casio calculator

  let current = '0';
  let expr = '';
  let resetNext = false;
  let expMode = false;
  let mem = 0;
  let gt = 0;
  let log = []; // in-memory only

  function renderScreen(){
    const text = Fmt.display(current);
    screenMain.textContent = text;
    screenHistory.textContent = expr;
    screenMain.classList.remove('md','sm','xs');
    const len = text.length;
    if (len>13) screenMain.classList.add('xs');
    else if (len>10) screenMain.classList.add('sm');
    else if (len>7) screenMain.classList.add('md');
  }

  function renderHistory(){
    if (!historyBody) return;
    if (log.length === 0){
      historyBody.innerHTML = '<div class="h-empty">아직 계산 기록이 없습니다</div>';
      return;
    }
    historyBody.innerHTML = log.map((e,idx)=>`
      <div class="h-entry">
        <div class="h-expr" data-idx="${idx}" data-type="expr">${e.expr} =</div>
        <div class="h-res" data-idx="${idx}" data-type="res">${Fmt.display(String(e.result))}</div>
      </div>
    `).join('');
    historyBody.querySelectorAll('[data-type="expr"]').forEach(el=>{
      el.addEventListener('click', ()=>{ expr = log[el.dataset.idx].expr + ' '; renderScreen(); });
    });
    historyBody.querySelectorAll('[data-type="res"]').forEach(el=>{
      el.addEventListener('click', ()=>{ current = String(log[el.dataset.idx].result); resetNext = true; renderScreen(); });
    });
    historyBody.scrollTop = historyBody.scrollHeight;
  }

  clearHistoryBtn?.addEventListener('click', ()=>{ log = []; renderHistory(); });
  mobileHistoryBtn?.addEventListener('click', ()=> receiptPanel.classList.toggle('open'));

  function execute(){
    if (!expr && (current==='0'||current==='')) return;
    try{
      let full = expr ? expr + current : current;
      const o=(full.match(/\(/g)||[]).length, c=(full.match(/\)/g)||[]).length;
      if (o>c){ const fill=')'.repeat(o-c); current+=fill; full+=fill; }

      const res = Engine.evaluate(full);
      gt += res;
      log.push({expr: full, result: res});
      if (log.length>50) log.shift();
      renderHistory();

      current = String(res);
      expr = '';
      resetNext = true;
      expMode = false;
    } catch(e){
      current = 'Error';
      resetNext = true;
      expMode = false;
    }
    renderScreen();
  }

  function press(key){
    if (key==='Escape'){ current='0'; expr=''; resetNext=false; expMode=false; }
    else if (key==='Backspace'){
      if (current.length>1 && current!=='Error') current = current.slice(0,-1);
      else { current='0'; expMode=false; }
    }
    else if (['+','-','*','/','×','÷'].includes(key)){
      const map={'*':'×','/':'÷'}; const op = map[key]||key;
      expMode=false;
      if (resetNext){ expr = current+' '+op+' '; resetNext=false; current='0'; }
      else { expr += (current!=='0'?current:'')+' '+op+' '; current='0'; }
    }
    else if (key==='Enter'){ execute(); return; }
    else if (!isNaN(key) && key!==' '){
      if (expMode){
        if (current.endsWith('⎕')) current = current.slice(0,-1)+Fmt.toSup(key);
        else current += Fmt.toSup(key);
      } else {
        if (resetNext){ current=key; resetNext=false; }
        else if (current==='0') current=key;
        else if (current==='-0') current='-'+key;
        else if (current.replace(/,/g,'').length<18) current+=key;
      }
    }
    else if (key==='00'){
      if (expMode) current += Fmt.toSup('00');
      else if (resetNext){ current='0'; resetNext=false; }
      else if (current!=='0' && current!=='-0' && current.replace(/,/g,'').length<16) current+='00';
    }
    else if (key==='.'){
      if (resetNext){ current='0.'; resetNext=false; }
      else if (!current.includes('.')) current+='.';
    }
    else if (key==='^'||key==='x^y'){
      expMode=true;
      if (!/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(current) && !current.endsWith('⎕')) current+='⎕';
    }
    else if (key==='('){
      expMode=false;
      if (resetNext||current==='0'){ current='('; resetNext=false; } else current+='(';
    }
    else if (key===')'){
      expMode=false;
      const full = expr+current;
      const o=(full.match(/\(/g)||[]).length, c=(full.match(/\)/g)||[]).length;
      if (o>c) current+=')';
    }
    else if (['sin','cos','tan','log','ln'].includes(key)){
      expMode=false;
      if (resetNext||current==='0'){ current=key+'('; resetNext=false; } else current+=key+'(';
    }
    else if (key==='√'){
      expMode=false;
      if (resetNext||current==='0'){ current='√('; resetNext=false; } else current+='√(';
    }
    else if (key==='+/-'){
      if (current==='0') current='-0';
      else if (current==='-0') current='0';
      else if (current!=='Error') current = current.startsWith('-') ? current.slice(1) : '-'+current;
    }
    else if (key==='%'){ if (!current.endsWith('%') && current!=='Error') current+='%'; }
    else if (key==='π'){ current = (resetNext||current==='0') ? 'π' : current+'π'; resetNext=false; }
    else if (key==='e'){ current = (resetNext||current==='0') ? 'e' : current+'e'; resetNext=false; }
    else if (key==='M+'){ try{ mem += Engine.evaluate(current); resetNext=true; }catch(e){} }
    else if (key==='M-'){ try{ mem -= Engine.evaluate(current); resetNext=true; }catch(e){} }
    else if (key==='MR'){ current=String(mem); resetNext=true; }
    else if (key==='MC'){ mem=0; }
    else if (key==='GT'){ current=String(gt); resetNext=true; }

    renderScreen();
  }

  document.querySelectorAll('.key').forEach(btn=>{
    btn.addEventListener('click', ()=> press(btn.getAttribute('data-key') || btn.textContent.trim()));
  });

  window.addEventListener('keydown', (e)=>{
    if (['INPUT','SELECT'].includes(e.target.tagName)) return;
    let key = e.key === 'NumpadEnter' ? 'Enter' : e.key;
    const target = document.querySelector(`.key[data-key="${key}"]`);
    if (target){
      target.classList.add('pressed');
      setTimeout(()=>target.classList.remove('pressed'), 100);
      press(key);
    }
  });

  modeToggle?.addEventListener('change', e=>{
    padStandard.classList.toggle('hidden', e.target.checked);
    padScientific.classList.toggle('hidden', !e.target.checked);
  });

  renderScreen();
});
