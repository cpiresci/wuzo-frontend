/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  WUZO WebView Guard — Anti-Chrome-Escape v1.0       ║
 * ║  Porte de nexus-main/webview-guard.js (fase 10-pre) ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * O que faz:
 *  1. Remove todos os target="_blank" dinamicamente
 *  2. Intercepta window.open() para não abrir Chrome
 *  3. Bloqueia navegação para domínios externos não autorizados
 *  4. Domínios de pagamento (Stripe) navegam dentro do WebView
 *  5. Log de diagnóstico no console para debug
 */
(function () {
  "use strict";

  var INTERNAL = [
    "wuzo.com.br",
    "www.wuzo.com.br",
    "app.wuzo.com.br",
    "cpiresci.github.io",
    "localhost",
    "127.0.0.1",
  ];

  var ALLOWED_EXTERNAL = [
    "checkout.stripe.com",
    "stripe.com",
    "js.stripe.com",
    "hooks.stripe.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
  ];

  function isCapacitor() {
    return (
      typeof window.Capacitor !== "undefined" ||
      window.location.protocol === "capacitor:"
    );
  }

  function getHostname(url) {
    try {
      if (!url || url.charAt(0) === "/" || url.charAt(0) === "#" || url.startsWith("javascript:")) {
        return "__internal__";
      }
      return new URL(url, window.location.href).hostname;
    } catch (e) {
      return "__internal__";
    }
  }

  function isInternal(url) {
    var host = getHostname(url);
    if (host === "__internal__") return true;
    return INTERNAL.some(function (d) {
      return host === d || host.endsWith("." + d);
    });
  }

  function isAllowedExternal(url) {
    var host = getHostname(url);
    return ALLOWED_EXTERNAL.some(function (d) {
      return host === d || host.endsWith("." + d);
    });
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target;
      while (el && el.tagName !== "A") {
        el = el.parentElement;
      }
      if (!el || !el.href) return;

      var href = el.getAttribute("href") || el.href;

      if (el.target === "_blank" || el.target === "_new") {
        el.removeAttribute("target");
        el.target = "_self";
      }

      if (!isCapacitor()) return;
      if (isInternal(href)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (isAllowedExternal(href)) {
        console.log("[WuzoGuard] Externo permitido (WebView):", href);
        window.location.href = href;
      } else {
        console.warn("[WuzoGuard] Link externo bloqueado:", href);
      }
    },
    true
  );

  var _nativeOpen = window.open;
  window.open = function (url, target, features) {
    if (!isCapacitor()) {
      return _nativeOpen.apply(window, arguments);
    }
    if (!url) return null;

    if (isInternal(url)) {
      window.location.href = url;
      return null;
    }
    if (isAllowedExternal(url)) {
      console.log("[WuzoGuard] window.open permitido (WebView):", url);
      window.location.href = url;
      return null;
    }
    console.warn("[WuzoGuard] window.open bloqueado:", url);
    return null;
  };

  function sanitizeExistingLinks() {
    var links = document.querySelectorAll('a[target="_blank"], a[target="_new"]');
    links.forEach(function (a) {
      a.removeAttribute("target");
    });
    if (links.length > 0) {
      console.log("[WuzoGuard] " + links.length + " link(s) target=_blank removidos.");
    }
  }

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === "A") {
            node.removeAttribute("target");
          }
          var innerLinks = node.querySelectorAll ? node.querySelectorAll('a[target="_blank"]') : [];
          innerLinks.forEach(function (a) { a.removeAttribute("target"); });
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sanitizeExistingLinks);
  } else {
    sanitizeExistingLinks();
  }

  console.log(
    "[WuzoGuard] Ativo | Capacitor:",
    isCapacitor(),
    "| Protocol:",
    window.location.protocol
  );
})();
