/**
 * Deskwork Tools - Anonymous Privacy-Preserving Telemetry (Phase 3)
 * 
 * - Zero third-party scripts or tracking cookies.
 * - No IP addresses or device fingerprints collected by the browser.
 * - No form inputs, query parameters, or personal data transmitted.
 * - Non-blocking: Uses navigator.sendBeacon with fetch fallback.
 * - Completely silent on network failure to guarantee zero user impact.
 */
(function () {
  'use strict';

  var ENDPOINT = '/api/analytics/event';
  var lastEventTime = 0;
  var THROTTLE_MS = 600;

  // On static GitHub Pages hosting (*.github.io), /api endpoints do not exist.
  // We cleanly skip dispatch to prevent 404/405 network traffic while keeping full local dev analytics.
  var isStaticHost = typeof window !== 'undefined' && (
    window.location.hostname.endsWith('github.io') ||
    window.location.protocol === 'file:'
  );

  function sendEvent(type, data) {
    if (isStaticHost) {
      // Clean silent no-op on static hosting: zero console noise, zero failed requests
      return;
    }

    try {
      var now = Date.now();
      if (now - lastEventTime < THROTTLE_MS && type !== 'page_view') {
        return; // Throttle rapid repeated triggers
      }
      lastEventTime = now;

      var payload = { type: type };
      if (data) {
        if (data.path) payload.path = data.path;
        if (data.tool) payload.tool = data.tool;
        if (data.slug) payload.slug = data.slug;
        if (data.template) payload.template = data.template;
      }

      var body = JSON.stringify(payload);

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, blob);
      } else if (typeof fetch === 'function') {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {
      // Intentionally silent
    }
  }

  function getCleanPath() {
    try {
      var p = window.location.pathname || '/';
      return p.split('?')[0].split('#')[0];
    } catch (e) {
      return '/';
    }
  }

  function getActiveTemplate() {
    try {
      // Check if Japan panel is active
      var japanPanel = document.getElementById('japan');
      if (japanPanel && japanPanel.classList.contains('active')) {
        return 'japan-rirekisho';
      }
      // Check if Letter panel is active
      var letterPanel = document.getElementById('letter');
      if (letterPanel && letterPanel.classList.contains('active')) {
        return 'letter';
      }
      // Check active template button
      var activeTmplBtn = document.querySelector('.tmpl-btn.active');
      if (activeTmplBtn && activeTmplBtn.getAttribute('data-tmpl')) {
        return activeTmplBtn.getAttribute('data-tmpl');
      }
    } catch (e) {}
    return 'classic';
  }

  function init() {
    var path = getCleanPath();

    // 1. Record Page View (stripping queries)
    sendEvent('page_view', { path: path });

    // 2. Check for Blog Article View
    if (path.indexOf('/blog/') !== -1) {
      var slugMatch = path.match(/\/blog\/([a-zA-Z0-9\-]+)(?:\.html)?$/);
      if (slugMatch && slugMatch[1] && slugMatch[1] !== 'index') {
        sendEvent('blog_view', { slug: slugMatch[1] });
      }
    }

    // 3. Delegate click events for tools and PDF exports
    document.addEventListener('click', function (e) {
      try {
        var target = e.target;
        if (!target || !target.closest) return;

        // Tool Tab Opens
        var tabBtn = target.closest('[data-panel]');
        if (tabBtn) {
          var panel = tabBtn.getAttribute('data-panel');
          var toolMap = {
            'resume': 'resume-builder',
            'japan': 'japan-rirekisho',
            'letter': 'letter-builder',
            'convert': 'document-converter',
            'student': 'gpa-calculator',
            'blogwriter': 'blog-writer'
          };
          if (panel && toolMap[panel]) {
            sendEvent('tool_opened', { tool: toolMap[panel] });
          }
          return;
        }

        // PDF Export Triggers
        var isPdfDownload =
          target.id === 'doc-modal-btn-download' ||
          target.closest('#doc-modal-btn-download') ||
          (target.getAttribute('onclick') && target.getAttribute('onclick').indexOf('executeDownloadPdf') !== -1);

        if (isPdfDownload) {
          var currentTmpl = getActiveTemplate();
          sendEvent('export_completed', { template: currentTmpl });
          sendEvent('tool_used', { tool: 'resume-builder' });
          return;
        }

        // Other Tool Action Usages
        var onclickAttr = target.getAttribute('onclick') || '';
        var btnText = (target.textContent || '').trim().toLowerCase();

        if (onclickAttr.indexOf('calcGPA') !== -1 || target.id === 'btn-gpa-calc') {
          sendEvent('tool_used', { tool: 'gpa-calculator' });
        } else if (onclickAttr.indexOf('resizeImage') !== -1) {
          sendEvent('tool_used', { tool: 'image-converter' });
        } else if (onclickAttr.indexOf('convertPdfToWord') !== -1 || onclickAttr.indexOf('compressPdfFile') !== -1 || onclickAttr.indexOf('convertDocxToPdf') !== -1) {
          sendEvent('tool_used', { tool: 'document-converter' });
        } else if (onclickAttr.indexOf('applyScanCrop') !== -1 || onclickAttr.indexOf('downloadScanAsPdf') !== -1) {
          sendEvent('tool_used', { tool: 'document-scanner' });
        }
      } catch (err) {}
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
