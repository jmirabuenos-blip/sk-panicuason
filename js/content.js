/* Keep basic announcement formatting without executing stored markup. */
window.safeAnnouncementHTML = function (value) {
  const source = document.createElement('template');
  source.innerHTML = String(value || '');
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'A']);
  function copy(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    if (['SCRIPT','STYLE','IFRAME','OBJECT'].includes(node.tagName)) return document.createTextNode('');
    const result = allowed.has(node.tagName) ? document.createElement(node.tagName) : document.createDocumentFragment();
    if (node.tagName === 'A' && /^https?:\/\//i.test(node.getAttribute('href') || '')) {
      result.href = node.getAttribute('href'); result.target = '_blank'; result.rel = 'noopener noreferrer';
    }
    node.childNodes.forEach(child => result.append(copy(child)));
    return result;
  }
  const output = document.createElement('div');
  source.content.childNodes.forEach(node => output.append(copy(node)));
  return output.innerHTML;
};
