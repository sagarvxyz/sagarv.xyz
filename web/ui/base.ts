import { LitElement, css } from 'lit';

export class BaseElement extends LitElement {
	static styles = css`
    :host {
      display: block;
    }
  `;
}
