import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';

class SkiConfigurator extends Component {
  state = {
    skiVariantId: null,
    skiVariantPrice: 0,
    quantity: 1,
    graphic: null,
    flex: null,
    binding: null,
    flow: null,
    travelling: null,
  };

  #variantUpdateController = null;

  connectedCallback() {
    super.connectedCallback();

    this.state.skiVariantId = parseInt(this.dataset.defaultVariantId, 10);
    this.state.skiVariantPrice = parseInt(this.dataset.defaultVariantPrice, 10);

    const checkedFlex = this.querySelector('input[name="flex"]:checked');
    if (checkedFlex) this.state.flex = checkedFlex.value;

    this.#renderPrice();
    this.#subscribeToVariantUpdates();
  }

  disconnectedCallback() {
    this.#variantUpdateController?.abort();
    super.disconnectedCallback?.();
  }

  #subscribeToVariantUpdates() {
    const target = this.closest('.shopify-section, dialog, product-card');
    if (!target) return;

    this.#variantUpdateController = new AbortController();
    target.addEventListener(
      ThemeEvents.variantUpdate,
      (event) => this.#onVariantUpdate(event),
      { signal: this.#variantUpdateController.signal }
    );
  }

  #onVariantUpdate(event) {
    const variant = event.detail?.resource;
    if (!variant?.id) return;

    this.state.skiVariantId = variant.id;
    if (typeof variant.price === 'number') {
      this.state.skiVariantPrice = variant.price;
    }
    this.#renderPrice();
  }

  handleGraphicChange(event) {
    const input = event.target;
    this.state.graphic = {
      variantId: parseInt(input.dataset.variantId, 10),
      title: input.dataset.title,
      imageUrl: input.dataset.image,
      price: parseInt(input.dataset.price, 10),
    };
    this.#renderPrice();
    this.#clearError('graphic');
  }

  handleFlexChange(event) {
    this.state.flex = event.target.value;
    this.#clearError('flex');
  }

  handleFlowChange(event) {
    const input = event.target;
    if (!input.checked) return;
    this.state.flow = {
      variantId: parseInt(input.value, 10),
      price: parseInt(input.dataset.price, 10),
    };
    this.#renderPrice();
  }

  handleBindingChange(event) {
    const input = event.target;
    this.state.binding = {
      variantId: parseInt(input.dataset.variantId, 10),
      title: input.dataset.title,
      price: parseInt(input.dataset.price, 10),
    };
    this.#renderPrice();
  }

  handleTripToggle(event) {
    const dateInput = this.querySelector('input[name="trip_date"]');
    if (!event.target.checked) {
      this.state.travelling = null;
      if (dateInput) dateInput.value = '';
      this.#clearError('travelling');
    }
  }

  handleTripDateChange(event) {
    this.state.travelling = event.target.value || null;
    if (this.state.travelling) this.#clearError('travelling');
  }

  handleTabSelect(event) {
    const target = event.target;
    const targetId =
      target.tagName === 'SELECT' ? target.value : target.dataset.tabTarget;
    if (!targetId) return;

    for (const button of this.querySelectorAll('.ski-configurator__tab-button')) {
      button.setAttribute('aria-selected', button.dataset.tabTarget === targetId ? 'true' : 'false');
    }
    for (const panel of this.querySelectorAll('.ski-configurator__tab-panel')) {
      panel.dataset.active = panel.id === targetId ? 'true' : 'false';
    }
  }

  handleQuantityChange(event) {
    const value = parseInt(event.target.value, 10);
    this.state.quantity = Number.isFinite(value) && value > 0 ? value : 1;
  }

  async handleSubmit(event) {
    event.preventDefault();

    const errors = this.#validate();
    this.#renderErrors(errors);
    if (errors.length > 0) return;

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton?.setAttribute('disabled', '');

    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.#buildPayload()),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        this.#renderErrors([data.description || 'Could not add to cart. Please try again.']);
        submitButton?.removeAttribute('disabled');
        return;
      }

      window.location.href = `${window.Shopify.routes.root}cart`;
    } catch (error) {
      this.#renderErrors(['Could not add to cart. Please check your connection and try again.']);
      submitButton?.removeAttribute('disabled');
    }
  }

  #validate() {
    const errors = [];
    if (!this.state.graphic) errors.push({ key: 'graphic', message: 'Please select a graphic.' });
    if (!this.state.flex) errors.push({ key: 'flex', message: 'Please choose your desired flex.' });

    const tripCheckbox = this.querySelector('input[name="upcoming_trip"]');
    if (tripCheckbox?.checked && !this.state.travelling) {
      errors.push({ key: 'travelling', message: 'Please enter the date of your upcoming trip.' });
    }
    return errors;
  }

  #buildPayload() {
    const { skiVariantId, graphic, flex, binding, flow, travelling, quantity } = this.state;
    const items = [];
    const properties = {};

    if (binding) {
      properties.Binding = binding.title;
      items.push({ quantity: 1, id: binding.variantId, properties: { _ski: skiVariantId } });
    }
    if (flow) {
      properties.Upgrades = 'Flow Bundle';
      items.push({ quantity: 1, id: flow.variantId, properties: { _ski: skiVariantId } });
    }

    properties.Graphic = graphic.title;
    properties._Graphic = graphic.imageUrl;
    items.push({ quantity: 1, id: graphic.variantId, properties: { _ski: skiVariantId } });

    if (travelling) properties.Travelling = travelling;
    properties.Flex = flex;
    properties._Price = this.#calculatePrice();

    items.push({ quantity, id: skiVariantId, properties });
    return { items };
  }

  #calculatePrice() {
    const { skiVariantPrice, graphic, flow, binding } = this.state;
    return skiVariantPrice + (graphic?.price ?? 0) + (flow?.price ?? 0) + (binding?.price ?? 0);
  }

  #renderPrice() {
    const node = this.querySelector('[data-ski-configurator-price]');
    if (!node) return;
    const price = this.#calculatePrice();
    node.textContent = this.#formatMoney(price);
  }

  #formatMoney(cents) {
    const currency = window.Shopify?.currency?.active ?? 'USD';
    const formatter = new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
      style: 'currency',
      currency,
    });
    return formatter.format(cents / 100);
  }

  #renderErrors(errors) {
    const list = this.querySelector('[data-ski-configurator-errors]');
    if (!list) return;
    list.innerHTML = '';
    if (errors.length === 0) {
      list.hidden = true;
      return;
    }
    list.hidden = false;
    for (const err of errors) {
      const li = document.createElement('li');
      li.textContent = typeof err === 'string' ? err : err.message;
      list.appendChild(li);
    }
  }

  #clearError(key) {
    const list = this.querySelector('[data-ski-configurator-errors]');
    if (!list || list.hidden) return;
    const remaining = Array.from(list.children).filter((li) => li.dataset.key !== key);
    if (remaining.length === 0) list.hidden = true;
  }
}

if (!customElements.get('ski-configurator')) {
  customElements.define('ski-configurator', SkiConfigurator);
}
