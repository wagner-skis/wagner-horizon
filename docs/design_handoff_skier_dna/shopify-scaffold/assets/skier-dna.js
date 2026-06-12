/* ============================================================================
 * Skier DNA — island mount stub
 * ----------------------------------------------------------------------------
 * This file is a STARTING POINT, not the finished island. It shows the one
 * contract that matters: read EVERYTHING merchant-/designer-configurable from
 * the Liquid block, then hand it to your app. The five-act flow, the live SVG
 * ski, and all state live in the app you build here (React/Preact recommended,
 * matching whatever the rest of the theme/app already uses).
 *
 * Do NOT hard-code copy, colors, fonts, card lists, or integration URLs in the
 * island — they come from the block so Roland can change them in the theme
 * editor (see README §5 Theme Contract). The wireframe's grayscale is just the
 * unstyled fallback; real styling = the --sd-* CSS vars set on the root.
 * ==========================================================================*/

(function () {
  function boot(root) {
    if (!root || root.dataset.sdBooted) return;
    root.dataset.sdBooted = '1';

    // --- 1. Read the block config (copy + content collections) -------------
    var cfgEl = root.querySelector('script[data-skier-dna-config]');
    var config = {};
    try { config = JSON.parse(cfgEl.textContent); } catch (e) { console.error('[SkierDNA] bad config JSON', e); }

    // --- 2. Read integration + behavior flags from data attributes ---------
    var settings = {
      calendlyUrl:        root.dataset.calendlyUrl || '',
      klaviyoListId:      root.dataset.klaviyoList || '',
      showPackages:       root.dataset.showPackages === 'true',
      trueScaleAnchor:    root.dataset.trueScale === 'true',
      graphicsCollection: root.dataset.graphicsCollection || null
    };

    // --- 3. Design tokens already live as --sd-* CSS vars on `root`. --------
    //     Style every island element with var(--sd-accent) etc. — never literals.

    // --- 4. Hand off to the actual experience ------------------------------
    //     Replace this with your framework mount. Suggested shape:
    //
    //     import { mountSkierDNA } from './skier-dna/app';
    //     mountSkierDNA(root, { config: config, settings: settings, api: '/apps/skier-dna' });
    //
    //     The app then:
    //       • drives the Act 1→5 state machine (see README §6 + the flow diagram)
    //       • renders the layered, true-to-scale SVG ski (README §7, 8 states)
    //       • POSTs a draft to the app backend on every act advance (README §8)
    //       • opens Save / Book-Call / Resume modals (README §6 Modals)
    //       • fires Klaviyo on email capture, embeds Calendly with the design id

    console.info('[SkierDNA] mounted — config + settings ready', { config: config, settings: settings });
  }

  // Hydrate now, and again if the merchant re-renders the block in the theme editor.
  function init() {
    document.querySelectorAll('#skier-dna-root, [data-skier-dna]').forEach(boot);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('shopify:section:load', function (e) {
    e.target.querySelectorAll('#skier-dna-root, [data-skier-dna]').forEach(boot);
  });
})();
