import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('layout-base')
export class BaseLayout extends LitElement {
	static styles = css`
    :host {
      display: block;
    }
  `;

	@property()
	title = '';

	render() {
		return html`
      <main>
        <slot></slot>
      </main>
    `;
	}
}
