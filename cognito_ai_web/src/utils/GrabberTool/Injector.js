(function () {
  if (document.getElementById('__grab_button__')) return;

  const grabBtn = document.createElement('div');
  grabBtn.id = '__grab_button__';
  grabBtn.innerText = 'Grab Elements';
  Object.assign(grabBtn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '10px 18px',
    zIndex: 99999,
    background: '#1e40af',
    color: '#fff',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  });
  document.body.appendChild(grabBtn);

  function generateXPath(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '//*[@id="' + el.id + '"]';
    if (el.name) return '//*[@name="' + el.name + '"]';
    const tag = el.tagName.toLowerCase();
    const siblings = Array.from(el.parentNode.children).filter(c => c.tagName === el.tagName);
    const index = siblings.length > 1 ? '[' + (siblings.indexOf(el) + 1) + ']' : '';
    const path = tag + index;
    return el.parentElement ? generateXPath(el.parentElement) + '/' + path : '/' + path;
  }

  grabBtn.onclick = async function () {
    const all = document.querySelectorAll('*');
    const grabbed = [];

    all.forEach(el => {
      const tag = el.tagName?.toLowerCase();
      if (!tag || tag === 'script' || tag === 'style' || el.offsetParent === null) return;

      const reactKey = Object.keys(el).find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
      let hasListener = false;
      if (
        el.onclick ||
        el.onchange ||
        el.oninput ||
        el.onmouseover ||
        el.onmouseenter ||
        (reactKey && el[reactKey] && Object.keys(el[reactKey]).some(k => k.startsWith('on')))
      ) {
        hasListener = true;
      }

      if (!hasListener) return;

      const name =
        el.getAttribute('name') ||
        el.getAttribute('id') ||
        el.getAttribute('placeholder') ||
        el.innerText?.trim() ||
        el.tagName;

      const locator = generateXPath(el);

      grabbed.push({
        name,
        type: el.tagName,
        locator,
        value: el.value || ''
      });
    });

    try {
      await fetch('https://yourtool.com/api/saveGrabbedElements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          timestamp: new Date().toISOString(),
          elements: grabbed
        })
      });
      alert('Elements sent to test tool!');
    } catch (err) {
      console.error('Error sending to API', err);
      alert('❌ Failed to send elements to tool');
    }
  };
})();


// <script src="https://devs.com/injector.js"></script>

