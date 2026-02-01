import { BaseElement } from '@ui/base.js';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('site-counter')
export class CounterElement extends BaseElement {
	static styles = css`
    button {
      padding: 0.5rem 1rem;
    }
  `;

	@state()
	private count = 0;

	render() {
		return html`
      <button @click=${this._increment}>Count: ${this.count}</button>
    `;
	}

	private _increment() {
		this.count++;
	}
}
