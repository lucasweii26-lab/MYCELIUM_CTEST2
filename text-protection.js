// Discourage casual copying from the public community pages while preserving form-field copy.
(() => {
  const editableSelector = 'input, textarea, [contenteditable="true"], [role="textbox"]';
  document.addEventListener("copy", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(editableSelector) || document.activeElement?.matches?.(editableSelector)) return;
    event.preventDefault();
  });
})();
