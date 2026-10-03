/**
 * Deskwork Tools - Safe Deferred Public Ad Loader (Phase 4)
 * 
 * Lightweight, zero-dependency, crash-proof client script.
 * Only targets explicitly designated inert ad containers.
 * Strictly avoids Resume Builder, PDF export modals, and print layouts.
 */
(function () {
  'use strict';

  // Defensive isolation
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Prevent multiple executions
  if (window.__DESKWORK_ADS_LOADED__) {
    return;
  }
  window.__DESKWORK_ADS_LOADED__ = true;

  var SCRIPT_ID_ADSENSE = 'deskwork-adsense-script';

  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var trimmed = url.trim().toLowerCase();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/uploads/');
  }

  function isProtectedZone(element) {
    if (!element || !element.closest) return false;
    // Strictly protect resume builder, print canvas, preview modal, and form zones
    return Boolean(
      element.closest('#resume') ||
      element.closest('#doc-preview-modal') ||
      element.closest('.doc-preview-modal') ||
      element.closest('.preview') ||
      element.closest('.modal') ||
      element.closest('.canvas-area') ||
      element.closest('.resume-preview-wrapper') ||
      element.closest('form') ||
      element.closest('.tool-card') ||
      element.closest('.interactive-tool')
    );
  }

  function loadAdSenseScript(publisherId) {
    if (document.getElementById(SCRIPT_ID_ADSENSE)) return;
    try {
      var s = document.createElement('script');
      s.id = SCRIPT_ID_ADSENSE;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(publisherId);
      document.head.appendChild(s);
    } catch (e) {
      // Fail silently
    }
  }

  function renderCustomBanner(container, banner) {
    if (!banner || !isSafeUrl(banner.imageUrl) || !isSafeUrl(banner.destinationUrl)) {
      return false;
    }

    try {
      container.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'deskwork-ad-banner-inner';
      wrapper.style.cssText = 'text-align:center;margin:12px auto;max-width:100%;';

      var link = document.createElement('a');
      link.href = banner.destinationUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer sponsored';
      link.style.cssText = 'display:inline-block;max-width:100%;text-decoration:none;';

      var img = document.createElement('img');
      img.src = banner.imageUrl;
      img.alt = banner.altText || 'Advertisement';
      if (banner.title) img.title = banner.title;
      img.loading = 'lazy';
      img.style.cssText = 'max-width:100%;height:auto;border-radius:6px;border:1px solid #E2E8F0;display:block;margin:0 auto;';

      if (banner.width && banner.width > 0) img.width = banner.width;
      if (banner.height && banner.height > 0) img.height = banner.height;

      link.appendChild(img);
      wrapper.appendChild(link);
      container.appendChild(wrapper);

      container.style.display = 'block';
      container.removeAttribute('aria-hidden');
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderAdSenseSlot(container, publisherId, adUnitId, format) {
    if (!publisherId) return false;

    try {
      loadAdSenseScript(publisherId);

      container.innerHTML = '';
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', publisherId);
      if (adUnitId) ins.setAttribute('data-ad-slot', adUnitId);
      ins.setAttribute('data-ad-format', format || 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(ins);
      container.style.display = 'block';
      container.removeAttribute('aria-hidden');

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (pushErr) {
        // Adsbygoogle may initialize later asynchronously
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  var isSidebarAdAuthorized = false;
  var authorizedSidebarKey = '';

  function renderAdsterraNative(container, key) {
    if (!container || isProtectedZone(container) || !key) return false;
    var containerKey = key;
    var containerId = 'container-' + containerKey;

    // Prevent duplicate rendering
    if (document.getElementById(containerId) && document.getElementById(containerId).hasChildNodes()) {
      return false;
    }

    try {
      container.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'deskwork-ad-native-wrapper';
      wrapper.style.cssText = 'margin:28px auto 16px;padding:16px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;text-align:center;box-sizing:border-box;max-width:100%;';

      var label = document.createElement('div');
      label.className = 'deskwork-ad-label';
      label.textContent = 'Advertisement';
      label.style.cssText = 'font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;user-select:none;';

      var adDiv = document.createElement('div');
      adDiv.id = containerId;
      adDiv.style.cssText = 'min-height:90px;width:100%;max-width:100%;margin:0 auto;';

      wrapper.appendChild(label);
      wrapper.appendChild(adDiv);
      container.appendChild(wrapper);

      container.style.display = 'block';
      container.removeAttribute('aria-hidden');

      // Load invoke.js once
      if (!document.querySelector('script[src*="' + containerKey + '"]')) {
        var s = document.createElement('script');
        s.async = true;
        s.setAttribute('data-cfasync', 'false');
        s.src = 'https://pl31602465.profitableratecpmnetwork.com/' + containerKey + '/invoke.js';
        document.body.appendChild(s);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderAdsterra160x300(container, key) {
    if (!container || isProtectedZone(container) || !key) return false;
    // Strictly desktop only - hide completely on narrow mobile screens
    if (window.innerWidth < 1024) {
      container.style.display = 'none';
      return false;
    }
    var unitKey = key;

    // Prevent duplicate rendering
    if (container.querySelector('iframe[data-adsterra-key="' + unitKey + '"]')) {
      return false;
    }

    try {
      container.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'deskwork-ad-sidebar-wrapper';
      wrapper.style.cssText = 'margin:0 auto;text-align:center;box-sizing:border-box;width:160px;';

      var label = document.createElement('div');
      label.className = 'deskwork-ad-label';
      label.textContent = 'Advertisement';
      label.style.cssText = 'font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#94A3B8;margin-bottom:8px;user-select:none;';

      var iframe = document.createElement('iframe');
      iframe.setAttribute('data-adsterra-key', unitKey);
      iframe.width = '160';
      iframe.height = '300';
      iframe.title = 'Advertisement';
      iframe.setAttribute('scrolling', 'no');
      iframe.style.cssText = 'border:none;overflow:hidden;width:160px;height:300px;display:block;margin:0 auto;';
      iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><base target="_blank"><style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>' +
        '<script>' +
        'atOptions = {' +
          "'key' : '" + unitKey + "'," +
          "'format' : 'iframe'," +
          "'height' : 300," +
          "'width' : 160," +
          "'params' : {}" +
        '};' +
        '<\/script>' +
        '<script src="https://www.highrevenueformat.com/' + unitKey + '/invoke.js"><\/script>' +
        '</body></html>';

      wrapper.appendChild(label);
      wrapper.appendChild(iframe);
      container.appendChild(wrapper);

      container.style.display = 'block';
      container.removeAttribute('aria-hidden');
      return true;
    } catch (e) {
      return false;
    }
  }

  function resolveContainersForPlacement(placement) {
    var loc = placement.location;
    var containers = [];

    if (loc === 'header') {
      var hdr = document.getElementById('ad-slot-header');
      if (hdr) containers.push(hdr);
    } else if (loc === 'homepage') {
      var home = document.getElementById('ad-slot-homepage');
      if (home) containers.push(home);
    } else if (loc === 'footer') {
      var ftr = document.getElementById('ad-slot-footer');
      if (ftr) containers.push(ftr);
    } else if (loc === 'tools') {
      var tools = document.getElementById('ad-slot-tools');
      if (tools) containers.push(tools);
    } else if (loc === 'mobile') {
      var mob = document.getElementById('ad-slot-mobile');
      if (mob) containers.push(mob);
    } else if (loc === 'sidebar' || loc === 'blog-sidebar') {
      var sidebarSlot = document.getElementById('ad-slot-blog-sidebar');
      if (sidebarSlot) {
        containers.push(sidebarSlot);
      } else {
        var sidebars = document.querySelectorAll('.ad-slot-sidebar');
        sidebars.forEach(function (el) { containers.push(el); });
      }
    } else if (loc === 'blog' || loc === 'content') {
      var nativeSlot = document.getElementById('ad-slot-blog-native');
      if (nativeSlot) {
        containers.push(nativeSlot);
      } else {
        // Look for existing blog article .ad-slot placeholders
        var blogSlots = document.querySelectorAll('.ad-slot');
        if (blogSlots && blogSlots.length > 0) {
          // If blog top vs mid content
          if (loc === 'blog') {
            containers.push(blogSlots[0]);
          } else if (loc === 'content') {
            if (blogSlots.length > 1) {
              containers.push(blogSlots[1]);
            } else {
              containers.push(blogSlots[0]);
            }
          }
        }
      }
    }

    return containers.filter(function (c) {
      return c && !isProtectedZone(c);
    });
  }

  function initAds() {
    try {
      // Determine base URL relative to current location so both apex and subpaths resolve
      var currentPath = window.location.pathname || '';
      var isInSubfolder = currentPath.indexOf('blog/') !== -1 || currentPath.indexOf('/blog/') !== -1;
      var staticAdsUrl = isInSubfolder ? '../data/ads-active.json' : 'data/ads-active.json';

      // Strictly fetch data/ads-active.json as the single source of truth
      fetch(staticAdsUrl)
        .then(function (res) {
          if (res.ok) return res.json();
          return null;
        })
        .then(function (data) {
          if (!data || !data.globalEnabled || !Array.isArray(data.placements) || data.placements.length === 0) {
            return;
          }

          var isMobile = window.innerWidth <= 768;
          var adsensePub = data.providers && data.providers.adsense ? data.providers.adsense.publisherId : '';
          var autoAds = Boolean(data.providers && data.providers.adsense && data.providers.adsense.autoAdsEnabled);

          if (autoAds && adsensePub) {
            loadAdSenseScript(adsensePub);
          }

          data.placements.forEach(function (slot) {
            // Check device target
            if (slot.device === 'desktop' && isMobile) return;
            if (slot.device === 'mobile' && !isMobile) return;

            var containers = resolveContainersForPlacement(slot);
            containers.forEach(function (container) {
              if (slot.provider === 'custom' && slot.customBanner) {
                renderCustomBanner(container, slot.customBanner);
              } else if (slot.provider === 'adsense') {
                renderAdSenseSlot(container, adsensePub, slot.adUnitId, slot.format);
              } else if (slot.provider === 'adsterra') {
                if (slot.location === 'sidebar' || slot.format === 'banner') {
                  var sKey = slot.adUnitId || (data.providers && data.providers.adsterra ? data.providers.adsterra.placementKey : '');
                  if (sKey) {
                    isSidebarAdAuthorized = true;
                    authorizedSidebarKey = sKey;
                    renderAdsterra160x300(container, sKey);
                  }
                } else {
                  var nKey = slot.adUnitId || (data.providers && data.providers.adsterra ? data.providers.adsterra.placementKey : '');
                  if (nKey) {
                    renderAdsterraNative(container, nKey);
                  }
                }
              }
            });
          });
        })
        .catch(function () {
          // Fail silently - do not render ads if manifest cannot be loaded
        });
    } catch (err) {
      // Defensive outer trap
    }
  }

  // Safe window resize listener: strictly toggles authorized sidebar visibility without independent ad injection
  window.addEventListener('resize', function () {
    try {
      var sidebarSlot = document.getElementById('ad-slot-blog-sidebar');
      if (sidebarSlot && isSidebarAdAuthorized) {
        if (window.innerWidth < 1024) {
          sidebarSlot.style.display = 'none';
        } else {
          if (sidebarSlot.querySelector('iframe')) {
            sidebarSlot.style.display = 'block';
          }
        }
      }
    } catch (e) {}
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAds);
  } else {
    initAds();
  }
})();
