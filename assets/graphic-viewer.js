import { Component } from '@theme/component';

class GraphicViewer extends Component {
  #gridPanel = null;

  state = {
    activeHandle: null,
    activeTier: 'all',
    activeLayer: 'a',
    mode: 'viewer',
  };

  connectedCallback() {
    super.connectedCallback();

    this.#gridPanel = document.getElementById(this.dataset.gridPanelId);

    // Show first thumbnail without a fade transition on initial load
    this.classList.add('graphic-viewer--init');
    const firstThumb = this.refs.thumbs?.[0];
    if (firstThumb) {
      this.#selectThumb(firstThumb);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.classList.remove('graphic-viewer--init');
      });
    });
  }

  // ─── Public event handlers (routed via on: attributes) ──────

  handleThumbClick(event) {
    const thumb = event.target.closest('[data-handle]');
    if (!thumb || thumb.hidden) return;
    event.preventDefault();
    this.#selectThumb(thumb);
  }

  handleThumbKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.target.closest('[data-handle]')?.click();
    }
  }

  handleTierFilter(event) {
    const btn = event.target.closest('[data-tier]');
    if (!btn) return;

    this.state.activeTier = btn.dataset.tier;

    for (const b of (this.refs.tierBtns || [])) {
      const isActive = b === btn;
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    this.#applyFilters();
  }

  handleModeToggle(event) {
    const btn = event.target.closest('[data-mode]');
    if (!btn) return;

    const newMode = btn.dataset.mode;
    if (newMode === this.state.mode) return;
    this.state.mode = newMode;

    for (const b of (this.refs.modeBtns || [])) {
      b.setAttribute('aria-pressed', b.dataset.mode === newMode ? 'true' : 'false');
    }

    const viewerPanel = this.refs.viewerPanel;
    if (viewerPanel) viewerPanel.hidden = newMode !== 'viewer';
    if (this.#gridPanel) this.#gridPanel.hidden = newMode !== 'grid';
    this.classList.toggle('graphic-viewer--grid-mode', newMode === 'grid');
  }

  // ─── Private methods ─────────────────────────────────────────

  #selectThumb(thumb) {
    if (!thumb) return;

    for (const t of (this.refs.thumbs || [])) {
      t.setAttribute('aria-pressed', t === thumb ? 'true' : 'false');
    }

    this.state.activeHandle = thumb.dataset.handle;

    if (thumb.dataset.image) {
      this.#crossFade(thumb.dataset.image);
    }

    this.#updateMetadata(thumb);
    this.#updatePrice(thumb);
    this.#updateCTAs(thumb.dataset.url);
  }

  #crossFade(imageUrl) {
    const current = this.state.activeLayer;
    const next = current === 'a' ? 'b' : 'a';

    const layers = this.refs.stageLayers || [];
    const currentLayer = layers.find(l => l.dataset.layer === current);
    const nextLayer = layers.find(l => l.dataset.layer === next);
    if (!currentLayer || !nextLayer) return;

    nextLayer.style.backgroundImage = `url('${imageUrl}')`;
    nextLayer.style.opacity = '1';
    currentLayer.style.opacity = '0';

    this.state.activeLayer = next;
  }

  #applyFilters() {
    const { activeTier } = this.state;
    let firstVisible = null;

    for (const thumb of (this.refs.thumbs || [])) {
      const matches = activeTier === 'all' || thumb.dataset.tier === activeTier;
      thumb.hidden = !matches;
      if (matches && !firstVisible) firstVisible = thumb;
    }

    if (firstVisible && firstVisible.dataset.handle !== this.state.activeHandle) {
      this.#selectThumb(firstVisible);
    } else if (!firstVisible) {
      for (const el of [this.refs.metaName, this.refs.metaSeries, this.refs.msrpValue]) {
        if (el) el.textContent = '';
      }
    }
  }

  #updateMetadata(thumb) {
    if (this.refs.metaName) {
      this.refs.metaName.textContent = thumb.dataset.title || '';
    }
    if (this.refs.metaSeries) {
      this.refs.metaSeries.textContent = thumb.dataset.collection || '';
    }
  }

  #updatePrice(thumb) {
    if (!this.refs.msrpValue) return;
    const price = parseInt(thumb.dataset.price, 10);
    if (!isNaN(price) && price > 0) {
      this.refs.msrpValue.textContent = this.#formatMoney(price);
    } else {
      this.refs.msrpValue.textContent = '';
    }
  }

  #updateCTAs(url) {
    if (!url) return;
    if (this.refs.ctaPrimary) this.refs.ctaPrimary.href = url;
    if (this.refs.ctaSecondary) this.refs.ctaSecondary.href = url;
  }

  #formatMoney(cents) {
    const currency = window.Shopify?.currency?.active || 'USD';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }
}

customElements.define('graphic-viewer', GraphicViewer);
