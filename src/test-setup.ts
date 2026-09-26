// jsdom's attachShadow() doesn't initialize ShadowRoot.adoptedStyleSheets as an array, but it
// does support the CSSStyleSheet constructor/replaceSync — so Stencil (used by Ionic/Kirby web
// components) detects constructable-stylesheet support, then crashes calling
// `shadowRoot.adoptedStyleSheets.push(...)` on undefined. Patch it so every shadow root gets one.
const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (init: ShadowRootInit): ShadowRoot {
  const root = originalAttachShadow.call(this, init);
  if (!root.adoptedStyleSheets) {
    root.adoptedStyleSheets = [];
  }
  return root;
};

// jsdom has no layout engine, so it doesn't implement scroll methods at all (not even as no-ops).
// ion-segment calls Element#scrollTo to bring the active segment button into view.
if (!Element.prototype.scrollTo) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollTo = () => {};
}

// jsdom doesn't implement ResizeObserver at all (real browsers do). Kirby's ResizeObserverFactory
// checks `typeof ResizeObserver === 'undefined'` and returns null when absent — most consumers
// (e.g. ResizeObserverService) null-check that, but kirby-stock-chart's base-chart component
// doesn't, and crashes calling `.observe()` on it. A no-op stub is enough for either case.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    observe(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unobserve(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect(): void {}
  };
}

// ion-icon fetches its SVG source at runtime (e.g. "assets/kirby/icons/svg/arrow-down.svg" for
// kirby-dropdown's chevron). Node's fetch can't turn a relative path into a URL without a page
// origin, which jsdom doesn't provide here, so it throws ERR_INVALID_URL. Assets aren't served in
// unit tests anyway, so return an empty SVG for any relative request instead of hitting fetch.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : (input as Request).url;
  if (!/^https?:\/\//.test(url)) {
    return Promise.resolve(
      new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
      }),
    );
  }
  return originalFetch(input, init);
};
