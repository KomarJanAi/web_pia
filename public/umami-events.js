/* Umami eventy pro kliky, které jinak nejsou vidět (bez cookies, nic osobního):
   telefon, email, odchozi-odkaz, soubor – s vlastností `misto` (kde na stránce se klikalo).
   Vlastní event bez zdržení odkazu: data-umami-klik="nazev" (+ data-umami-klik-<vlastnost>="…").
   Prvky s data-umami-event měří přímo Umami, tenhle skript je přeskočí.
   Místo: nejbližší [data-umami-misto], jinak hlavicka / paticka / menu, jinak sekce (id nebo
   aria-labelledby bez „-title“), jinak „obsah“. */
(function () {
  'use strict';
  var FILES = /\.(pdf|docx?|xlsx?|zip|rar|7z|dwg|dxf)$/i;
  var host = location.hostname.replace(/^www\./, '');

  function misto(el) {
    var m = el.closest('[data-umami-misto]');
    if (m) return m.getAttribute('data-umami-misto');
    if (el.closest('header')) return 'hlavicka';
    if (el.closest('footer')) return 'paticka';
    if (el.closest('nav')) return 'menu';
    var s = el.closest('section[id], section[aria-labelledby]');
    if (s) return s.id || s.getAttribute('aria-labelledby').replace(/-(title|heading|nadpis|h[1-6])$/, '');
    return 'obsah';
  }

  function track(name, data) {
    if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data);
  }

  function klik(el) {
    var data = { misto: misto(el) };
    for (var i = 0; i < el.attributes.length; i++) {
      var m = el.attributes[i].name.match(/^data-umami-klik-([\w-]+)$/);
      if (m) data[m[1]] = el.attributes[i].value;
    }
    track(el.getAttribute('data-umami-klik'), data);
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t || t.closest('[data-umami-event]')) return;
    var k = t.closest('[data-umami-klik]');
    if (k) return klik(k);
    var a = t.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^tel:/i.test(href)) return track('telefon', { cislo: href.slice(4), misto: misto(a) });
    if (/^mailto:/i.test(href)) return track('email', { adresa: href.slice(7).split('?')[0], misto: misto(a) });
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    if (FILES.test(url.pathname)) {
      return track('soubor', { soubor: decodeURIComponent(url.pathname.split('/').pop()), misto: misto(a) });
    }
    if (url.hostname.replace(/^www\./, '') !== host) {
      return track('odchozi-odkaz', { cil: url.hostname.replace(/^www\./, ''), url: url.href.slice(0, 500), misto: misto(a) });
    }
  }, true);
})();
