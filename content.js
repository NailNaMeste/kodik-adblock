(() => {
  "use strict";

  const AD_URL_RE =
    /targetads\.io|serving-sys\.ru|buzzoola|snsv\.ru|ufouxbwn|bidster|kimberlite|moe\.video|vidalak|suprion|s2517\.com|videohead\.tech|adtec\.ru|programmatica|widdimo|flyroll|adseedtech|getads\.ru|xcec\.ru|moviead55|traffaret|sape\.ru|betweendigital|adfinity|iabvast|punchmedia|inplayer\.ru|timing-js-menu|yandex\.ru\/ads|doubleclick|googlesyndication|adsbygoogle/i;

  function isAdUrl(url) {
    return Boolean(url) && AD_URL_RE.test(String(url));
  }

  function looksLikeOverlay(el) {
    if (!(el instanceof HTMLElement)) return false;
    const style = el.getAttribute("style") || "";
    if (!/position\s*:\s*(absolute|fixed)/i.test(style)) return false;
    return (
      /width\s*:\s*100%/i.test(style) ||
      /height\s*:\s*100%/i.test(style) ||
      /inset\s*:\s*0/i.test(style) ||
      (/top\s*:\s*0/i.test(style) && /left\s*:\s*0/i.test(style))
    );
  }

  function scrub(root) {
    root = root || document;
    if (!root || !root.querySelectorAll) return;

    root
      .querySelectorAll(
        "#vpaid_iframe, #vpaid_div, #vpaid_video, #vpaid_play_button, a[href*='targetads'], iframe[src*='buzzoola'], iframe[src*='vpaid'], script[src*='adsbygoogle']"
      )
      .forEach(function (el) {
        el.remove();
      });

    root.querySelectorAll("a").forEach(function (a) {
      const href = a.getAttribute("href") || "";
      const empty = !(a.textContent || "").trim() && a.children.length === 0;
      if (isAdUrl(href) || (looksLikeOverlay(a) && empty)) a.remove();
    });

    root.querySelectorAll(".skip_adv, a.skip_adv, .adv_close").forEach(function (el) {
      try {
        el.click();
      } catch (e) {}
    });
  }

  const mo = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j] instanceof Element) scrub(nodes[j]);
      }
    }
  });

  function start() {
    scrub(document);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.documentElement) start();
  else {
    var boot = new MutationObserver(function () {
      if (document.documentElement) {
        boot.disconnect();
        start();
      }
    });
    boot.observe(document, { childList: true });
  }

  setInterval(function () {
    scrub(document);
  }, 1000);
})();
