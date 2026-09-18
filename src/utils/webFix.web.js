// Web-only: let the page body scroll so long screens (ParentGate, menus…)
// are reachable even when an ancestor in the flex chain is unbounded.
// Native uses the no-op sibling file (webFix.js) instead.
if (typeof document !== 'undefined') {
  const css = [
    'html,body{height:auto !important;min-height:100% !important;}',
    'body{overflow-y:auto !important;}',
    '#root{height:auto !important;min-height:100% !important;}',
  ].join('\n');
  const tag = document.createElement('style');
  tag.setAttribute('data-abqarino', 'scroll-fix');
  tag.textContent = css;
  document.head.appendChild(tag);
}

export default null;
