/**
 * Angular-style @Component decorator and BaseComponent lifecycle
 */

export interface ComponentMetadata {
  selector: string;
  template?: string;
  styles?: string;
}

export abstract class BaseComponent extends HTMLElement {
  protected isInitialized = false;

  connectedCallback() {
    this.render();
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.ngOnInit();
    }
  }

  disconnectedCallback() {
    this.ngOnDestroy();
  }

  /**
   * Lifecycle hook invoked once the component is attached
   */
  ngOnInit(): void {}

  /**
   * Lifecycle hook invoked when the component is destroyed/detached
   */
  ngOnDestroy(): void {}

  /**
   * Renders or re-renders the component template
   */
  render(): void {}

  /**
   * Dispatch custom event (Angular @Output equivalent)
   */
  protected emit<T = any>(eventName: string, detail?: T): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  /**
   * Scoped query selector helper
   */
  protected $<E extends HTMLElement = HTMLElement>(selector: string): E | null {
    return this.querySelector<E>(selector);
  }

  /**
   * Scoped query selector all helper
   */
  protected $$<E extends HTMLElement = HTMLElement>(selector: string): NodeListOf<E> {
    return this.querySelectorAll<E>(selector);
  }
}

export function Component(metadata: ComponentMetadata) {
  return function <T extends typeof BaseComponent>(target: T) {
    if (!customElements.get(metadata.selector)) {
      customElements.define(metadata.selector, target);
    }
    (target as any).__metadata = metadata;
    return target;
  };
}
