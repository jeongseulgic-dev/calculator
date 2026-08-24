document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('sidebarToggle');
  const menu = document.getElementById('sidebarMenu');
  toggle?.addEventListener('click', () => menu.classList.toggle('open'));
});

function formatInputComma(el){
  let val = el.value.replace(/,/g, '');
  el.value = (!isNaN(val) && val !== '') ? Number(val).toLocaleString('ko-KR') : '';
}

function addAmount(inputId, addVal){
  const input = document.getElementById(inputId);
  let current = Number(input.value.replace(/,/g, '')) || 0;
  current += addVal;
  input.value = current.toLocaleString('ko-KR');
}

function resetAmount(inputId){
  document.getElementById(inputId).value = '';
}

function attachDateMask(inputId, onChange){
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', () => {
    const digits = el.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits.slice(0, 4);
    if (digits.length > 4) formatted += '-' + digits.slice(4, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
    el.value = formatted;
    if (onChange) onChange();
  });
}

function parseIsoDate(val){
  if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return null;
  const d = new Date(val + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}
