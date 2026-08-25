/*!
 * url-state.js — 계산기 입력 상태를 주소창 쿼리에 반영/복원하는 공용 유틸.
 * pushState가 아니라 replaceState를 쓴다 (뒤로가기가 입력 한 글자씩 되짚는 것 방지).
 * 매 입력마다 바로 갱신하지 않고 디바운스한다.
 */
(function (global) {
  'use strict';

  var timer = null;

  function sync(params, defaults, wait){
    defaults = defaults || {};
    wait = (wait == null) ? 600 : wait;
    clearTimeout(timer);
    timer = setTimeout(function(){
      var sp = new URLSearchParams();
      Object.keys(params).forEach(function(k){
        var v = params[k];
        if (v === '' || v == null) return;
        if (defaults[k] != null && String(defaults[k]) === String(v)) return;
        sp.set(k, v);
      });
      var qs = sp.toString();
      var url = global.location.pathname + (qs ? '?' + qs : '') + global.location.hash;
      try { global.history.replaceState(null, '', url); } catch (e) {}
    }, wait);
  }

  function read(){
    var out = {};
    try {
      new URLSearchParams(global.location.search).forEach(function (v, k) { out[k] = v; });
    } catch (e) {}
    return out;
  }

  global.UrlState = { sync: sync, read: read };
})(window);
