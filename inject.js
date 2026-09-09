(() => {
  "use strict";

  const EMPTY_VAST =
    '<?xml version="1.0" encoding="UTF-8"?><VAST version="3.0"></VAST>';

  const AD_HOST_RE =
    /(?:^|\.)(?:targetads\.io|serving-sys\.ru|buzzoola\.com|snsv\.ru|ufouxbwn\.com|bidster\.net|kimberlite\.io|moe\.video|vidalak\.com|suprion\.ru|s2517\.com|videohead\.tech|adtec\.ru|programmatica\.com|widdimo\.com|flyroll\.ru|adseedtech\.com|getads\.ru|xcec\.ru|moviead55\.ru|traffaret\.com|sape\.ru|betweendigital\.com|adfinity\.pro|iabvast\.ru|punchmedia\.ru|inplayer\.ru|hybrid\.ai|ohmy\.bid|adiam\.tech|adspector\.io|giraff\.io|lotus-dsp\.ru|ussp\.io|adhigh\.net|acint\.net|timing-js-menu\.xyz|adriver\.ru|adfox\.ru|advertur\.ru|doubleclick\.net|googlesyndication\.com)(?:$|:|\/)/i;

  function isAdUrl(url) {
    if (!url) return false;
    const s = String(url);
    if (/\/adsbygoogle\.js(?:\?|$)/i.test(s)) return true;
    if (/yandex\.ru\/ads/i.test(s)) return true;
    if (/ad\.mail\.ru/i.test(s)) return true;
    try {
      return AD_HOST_RE.test(new URL(s, location.href).hostname);
    } catch (e) {
      return AD_HOST_RE.test(s);
    }
  }

  function scrubFtor(text) {
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") return text;
      if ("vast" in data || "reserve_vast" in data || "advert_script" in data) {
        data.vast = [];
        data.reserve_vast = [];
        data.advert_script = "";
        return JSON.stringify(data);
      }
    } catch (e) {}
    return text;
  }

  function isFtorUrl(url) {
    return /\/ftor(?:\?|$)/.test(String(url || ""));
  }

  const xhrOpen = XMLHttpRequest.prototype.open;
  const nativeResponseText = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype,
    "responseText"
  ).get;
  const nativeResponse = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype,
    "response"
  ).get;

  Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
    configurable: true,
    get: function () {
      const text = nativeResponseText.call(this);
      if (this.__kabFtor && this.readyState === 4) return scrubFtor(text);
      if (this.__kabAd && this.readyState === 4) return EMPTY_VAST;
      return text;
    },
  });

  Object.defineProperty(XMLHttpRequest.prototype, "response", {
    configurable: true,
    get: function () {
      if (this.__kabFtor && this.readyState === 4) {
        return scrubFtor(nativeResponseText.call(this));
      }
      if (this.__kabAd && this.readyState === 4) return EMPTY_VAST;
      return nativeResponse.call(this);
    },
  });

  XMLHttpRequest.prototype.open = function (method, url) {
    const u = String(url || "");
    this.__kabFtor = isFtorUrl(u);
    this.__kabAd = !this.__kabFtor && isAdUrl(u);
    return xhrOpen.apply(this, arguments);
  };

  const nativeFetch = window.fetch;
  window.fetch = function (input, init) {
    const url =
      typeof input === "string"
        ? input
        : input && typeof input.url === "string"
          ? input.url
          : String(input);

    if (isAdUrl(url) && !isFtorUrl(url)) {
      return Promise.resolve(
        new Response(EMPTY_VAST, {
          status: 200,
          headers: { "Content-Type": "application/xml" },
        })
      );
    }

    return nativeFetch.apply(this, arguments).then(function (res) {
      if (!isFtorUrl(url)) return res;
      return res.text().then(function (text) {
        return new Response(scrubFtor(text), {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      });
    });
  };

  setInterval(function () {
    document
      .querySelectorAll(
        "#vpaid_iframe, #vpaid_div, #vpaid_video, #vpaid_play_button"
      )
      .forEach(function (el) {
        el.remove();
      });
    document
      .querySelectorAll(".skip_adv, a.skip_adv, .adv_close, .mobile_continue")
      .forEach(function (el) {
        try {
          el.click();
        } catch (e) {}
      });
  }, 800);
})();
