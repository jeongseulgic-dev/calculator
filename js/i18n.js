/*!
 * i18n.js — 사이트 전체 공용 다국어 전환. 기본은 한국어(HTML 원문 그대로).
 * 영어 사전(i18n/en.json)은 필요할 때(lang=en 저장돼 있을 때)만 지연 로드한다 —
 * 한국어로만 보는 방문자에게는 추가 요청이 전혀 없다.
 */
(function (global) {
  'use strict';

  var lang = localStorage.getItem('lang') || 'ko';
  var dict = {};

  function applyStatic(){
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = dict[el.getAttribute('data-i18n')];
      if (val != null) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var val = dict[el.getAttribute('data-i18n-placeholder')];
      if (val != null) el.setAttribute('placeholder', val);
    });
    document.documentElement.lang = lang;
  }

  var ready = (lang === 'en')
    ? fetch('i18n/en.json').then(function (r) { return r.json(); }).then(function (json) {
        dict = json;
        applyStatic();
      }).catch(function () { /* 사전을 못 받아도 한국어로 그대로 보여준다 */ })
    : Promise.resolve();

  function t(key, fallbackKo){
    if (lang !== 'en') return fallbackKo;
    return (dict[key] != null) ? dict[key] : fallbackKo;
  }

  function switchTo(next){
    localStorage.setItem('lang', next);
    location.reload();
  }

  global.I18n = { lang: lang, ready: ready, t: t, switchTo: switchTo };

  var LANG_NAMES = { ko: '한국어', en: 'English' };

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('langSwitchBtn');
    var menu = document.getElementById('langSwitchMenu');
    var label = document.getElementById('langSwitchLabel');
    if (!btn || !menu) return;

    label.textContent = LANG_NAMES[lang] || LANG_NAMES.ko;

    menu.querySelectorAll('button').forEach(function (item) {
      item.classList.toggle('active', item.dataset.value === lang);
      item.addEventListener('click', function () {
        if (item.dataset.value !== lang) switchTo(item.dataset.value);
        else menu.classList.remove('open');
      });
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== btn) {
        menu.classList.remove('open');
      }
    });
  });
})(window);
