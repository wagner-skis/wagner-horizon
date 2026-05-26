class BlogTagFilter extends HTMLElement {
  #tiles = [];
  #observer = null;
  #raf = 0;

  connectedCallback() {
    const row = this.querySelector('.blog-tag-filter__row');
    if (!row) return;

    this.#tiles = Array.from(row.querySelectorAll('.blog-tag-tile'));
    if (this.#tiles.length === 0) return;

    this.#buildSelect();
    this.#measure();

    this.#observer = new ResizeObserver(() => {
      cancelAnimationFrame(this.#raf);
      this.#raf = requestAnimationFrame(() => this.#measure());
    });
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    cancelAnimationFrame(this.#raf);
  }

  #buildSelect() {
    const select = document.createElement('select');
    select.className = 'blog-tag-filter__select';
    select.setAttribute('aria-label', 'Filter journal by category');

    for (const tile of this.#tiles) {
      const option = document.createElement('option');
      option.value = tile.getAttribute('href') || '';
      option.textContent = tile.querySelector('.blog-tag-tile__label')?.textContent?.trim() || '';
      if (tile.hasAttribute('aria-current')) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener('change', (event) => {
      const url = event.target.value;
      if (url) window.location.href = url;
    });

    this.appendChild(select);
  }

  /**
   * Compute the row's required width from tile count and CSS vars rather than
   * measuring the DOM. Measuring scrollWidth would force a row->measure->dropdown
   * mode flip that retriggers ResizeObserver and produces a visible flash.
   */
  #measure() {
    const styles = getComputedStyle(this);
    const tileSize = parseFloat(styles.getPropertyValue('--blog-tag-tile-size')) || 110;
    const gap = parseFloat(styles.getPropertyValue('--blog-tag-filter-gap')) || 20;
    const count = this.#tiles.length;
    const required = count * tileSize + Math.max(0, count - 1) * gap;
    const available = this.clientWidth;

    const next = required > available ? 'dropdown' : 'row';
    if (this.dataset.mode !== next) this.dataset.mode = next;
  }
}

if (!customElements.get('blog-tag-filter')) {
  customElements.define('blog-tag-filter', BlogTagFilter);
}
