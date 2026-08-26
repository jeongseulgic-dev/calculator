/*!
 * export.js — CSV 다운로드(대출·예적금) + 결과 이미지 저장(전체 계산기 공용) 유틸.
 * html2canvas는 무겁기 때문에 버튼을 실제로 클릭한 시점에만 CDN에서 불러온다.
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

  var H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var loadingPromise = null;

  function ensureHtml2Canvas(){
    if (global.html2canvas) return Promise.resolve(global.html2canvas);
    if (loadingPromise) return loadingPromise;
    loadingPromise = new Promise(function(resolve, reject){
      var script = document.createElement('script');
      script.src = H2C_URL;
      script.onload = function(){
        if (global.html2canvas) resolve(global.html2canvas);
        else reject(new Error('html2canvas load failed'));
      };
      script.onerror = function(){
        loadingPromise = null;
        reject(new Error('html2canvas script load error'));
      };
      document.body.appendChild(script);
    });
    return loadingPromise;
  }

  function drawWatermark(canvas, srcWidth){
    var ctx = canvas.getContext('2d');
    var scale = canvas.width / srcWidth;
    ctx.save();
    ctx.font = (12 * scale) + 'px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(100,103,108,0.85)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('참고용 계산 결과 · 실제 값은 다를 수 있습니다', canvas.width - 12 * scale, canvas.height - 8 * scale);
    ctx.restore();
  }

  function saveElementAsImage(el, filename){
    var srcWidth = el.offsetWidth;
    return ensureHtml2Canvas().then(function(html2canvas){
      return html2canvas(el, {
        backgroundColor: '#fffdf5',
        scale: Math.min(2, global.devicePixelRatio || 1)
      });
    }).then(function(canvas){
      drawWatermark(canvas, srcWidth);
      return new Promise(function(resolve, reject){
        canvas.toBlob(function(blob){
          if (!blob) { reject(new Error('canvas.toBlob returned null')); return; }
          triggerDownload(blob, filename);
          resolve();
        }, 'image/png');
      });
    });
  }

  global.Export = {
    downloadCsv: downloadCsv,
    ensureHtml2Canvas: ensureHtml2Canvas,
    saveElementAsImage: saveElementAsImage,
    shareLink: shareLink
  };

  var btn = document.getElementById('imageExportBtn');
  if (btn){
    var originalLabel = btn.textContent;
    btn.addEventListener('click', function(){
      if (btn.disabled) return;
      var target = document.querySelector(btn.dataset.target || '.receipt-strip');
      if (!target) return;
      btn.disabled = true;
      btn.textContent = '저장 중…';
      var d = new Date();
      var dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      var filename = (btn.dataset.filename || '계산결과') + '_' + dateStr + '.png';
      saveElementAsImage(target, filename).then(function(){
        btn.disabled = false;
        btn.textContent = originalLabel;
      }).catch(function(err){
        console.error('[image export]', err);
        btn.textContent = '저장 실패 (다시 시도)';
        setTimeout(function(){ btn.textContent = originalLabel; }, 2500);
        btn.disabled = false;
      });
    });
  }
})(window);
