/*!
 * export.js — CSV 다운로드(대출·예적금) + 결과 링크 공유(전체 계산기 공용) 유틸.
 * 공유는 이미지가 아니라 URL을 공유한다 — url-state.js가 이미 입력값을 URL에 반영해두므로
 * 링크를 타고 온 사람이 같은 계산 결과를 그대로 보게 된다.
 */
(function (global) {
  'use strict';

  function csvEscape(v){
    var s = String(v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function triggerDownload(blob, filename){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  function downloadCsv(filename, headers, rows, footnote, preamble){
    var lines = [];
    if (preamble && preamble.length){
      preamble.forEach(function(p){ lines.push(p.map(csvEscape).join(',')); });
      lines.push('');
    }
    lines.push(headers.map(csvEscape).join(','));
    rows.forEach(function(row){
      lines.push(row.map(csvEscape).join(','));
    });
    if (footnote){
      lines.push('');
      lines.push(csvEscape(footnote));
    }
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }

  function copyLink(url){
    if (global.navigator.clipboard && global.navigator.clipboard.writeText){
      return global.navigator.clipboard.writeText(url);
    }
    return new Promise(function(resolve, reject){
      try {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function shareLink(config){
    var url = config.url || global.location.href;
    if (global.navigator.share){
      return global.navigator.share({ title: config.title, text: config.text, url: url })
        .then(function(){ return 'shared'; })
        .catch(function(err){
          if (err && err.name === 'AbortError') return 'cancelled';
          return copyLink(url).then(function(){ return 'copied'; });
        });
    }
    return copyLink(url).then(function(){ return 'copied'; });
  }

  global.Export = { downloadCsv: downloadCsv, shareLink: shareLink };

  var btn = document.getElementById('shareBtn');
  if (btn){
    var originalLabel = btn.textContent;
    btn.addEventListener('click', function(){
      if (btn.disabled) return;
      var titleEl = document.querySelector('.page-title h2');
      var metaEl = document.getElementById('page-meta');
      var miniScreen = document.getElementById('miniScreen');
      var miniScreenSub = document.getElementById('miniScreenSub');
      var text = metaEl
        ? metaEl.textContent
        : [miniScreenSub && miniScreenSub.textContent, miniScreen && miniScreen.textContent].filter(Boolean).join(' ');
      shareLink({
        title: titleEl ? titleEl.textContent : document.title,
        text: text
      }).then(function(status){
        if (status === 'copied'){
          btn.disabled = true;
          btn.textContent = '링크 복사됨';
          setTimeout(function(){ btn.textContent = originalLabel; btn.disabled = false; }, 2000);
        }
      }).catch(function(err){
        console.error('[share link]', err);
        btn.textContent = '복사 실패';
        setTimeout(function(){ btn.textContent = originalLabel; }, 2000);
      });
    });
  }
})(window);
