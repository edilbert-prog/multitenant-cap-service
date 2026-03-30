import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';
import axios from 'axios';

const GrabberTool = ({ url: defaultUrl = '', onSelect = () => {} }) => {
  const [url, setUrl] = useState(defaultUrl);
  const [screenName, setScreenName] = useState('');
  const [elements, setElements] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const selectAllRef = useRef();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'GRABBED_ELEMENTS') {
        setElements(event.data.elements);
        setSelectedElements([]);
        setShowOverlay(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!selectAllRef.current) return;
    if (selectedElements.length === 0) {
      selectAllRef.current.indeterminate = false;
      selectAllRef.current.checked = false;
    } else if (selectedElements.length === elements.length) {
      selectAllRef.current.indeterminate = false;
      selectAllRef.current.checked = true;
    } else {
      selectAllRef.current.indeterminate = true;
    }
  }, [selectedElements, elements]);

  useEffect(() => {
    onSelect(selectedElements);
  }, [selectedElements]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedElements(elements);
    } else {
      setSelectedElements([]);
    }
  };

  const handleSelectRow = (element) => {
    const exists = selectedElements.find((el) => el.locator === element.locator);
    if (exists) {
      setSelectedElements(selectedElements.filter((el) => el.locator !== element.locator));
    } else {
      setSelectedElements([...selectedElements, element]);
    }
  };

  const injectOverlayScript = (win) => {
    win.eval(`
    (function() {
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
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      });
      document.body.appendChild(grabBtn);

      const trackedTags = ['input', 'select', 'textarea', 'button', 'a'];
      const interactiveEvents = ['click', 'change', 'input', 'mousedown', 'mouseup', 'keydown', 'submit', 'mouseover', 'drag', 'dragstart', 'dragend'];

      function getLabelText(el) {
        const id = el.getAttribute('id');
        if (id) {
          const label = document.querySelector('label[for="' + id + '"]');
          if (label) return label.innerText.trim();
        }
        let sibling = el.previousElementSibling;
        while (sibling) {
          if (sibling.tagName.toLowerCase() === 'label') return sibling.innerText.trim();
          sibling = sibling.previousElementSibling;
        }
        const wrapper = el.closest('label');
        if (wrapper) return wrapper.innerText.trim();
        return '';
      }

      function getEventListeners(el) {
        const types = [];
        for (const type of interactiveEvents) {
          if (typeof el['on' + type] === 'function') types.push(type);
        }

        const attrs = el.getAttributeNames?.() || [];
        for (const attr of attrs) {
          if (attr.startsWith('on')) {
            const evt = attr.slice(2).toLowerCase();
            if (!types.includes(evt)) types.push(evt);
          }
        }
        return [...new Set(types)];
      }

      function getDefaultEventType(tag, inputType = '') {
        if (tag === 'input') {
          if (['checkbox', 'radio'].includes(inputType)) return 'change';
          if (['range', 'number', 'color'].includes(inputType)) return 'input';
          return 'change,input';
        }
        if (tag === 'select') return 'change';
        if (tag === 'textarea') return 'input';
        if (['button', 'a'].includes(tag)) return 'click';
        return 'click';
      }

      function generateXPath(el) {
        if (!el || el.nodeType !== 1) return '';

        if (el.id) return '//*[@id="' + el.id + '"]';
        if (el.getAttribute('name')) return '//*[@name="' + el.getAttribute('name') + '"]';

        const tag = el.tagName.toLowerCase();
        const text = (el.innerText || '').trim();

        // Try exact text match
        if (text && ['button', 'a', 'span', 'div'].includes(tag)) {
          const exactCount = document.evaluate("count(//" + tag + "[text()='" + text + "'])", document, null, XPathResult.NUMBER_TYPE, null).numberValue;
          if (exactCount === 1) {
            return "//" + tag + "[text()='" + text + "']";
          }

          const containsCount = document.evaluate("count(//" + tag + "[contains(text(),'" + text + "')])", document, null, XPathResult.NUMBER_TYPE, null).numberValue;
          if (containsCount === 1) {
            return "//" + tag + "[contains(text(),'" + text + "')]";
          }
        }

        // Fallback: full DOM path
        const getIndex = (node) => {
          let i = 1;
          let sibling = node;
          while ((sibling = sibling.previousElementSibling)) {
            if (sibling.tagName === node.tagName) i++;
          }
          return i;
        };

        const segments = [];
        while (el && el.nodeType === 1 && el !== document.body) {
          const index = getIndex(el);
          segments.unshift(el.tagName.toLowerCase() + '[' + index + ']');
          el = el.parentNode;
        }

        return '/html/body/' + segments.join('/');
      }

      grabBtn.onclick = function() {
        const all = document.querySelectorAll('*');
        const grabbed = [];

        all.forEach(el => {
          const tag = el.tagName?.toLowerCase();
          if (!tag) return;

          const typeAttr = el.getAttribute('type') || '';
          const nameAttr = el.getAttribute('name') || '';
          const idAttr = el.getAttribute('id') || '';
          const placeholder = el.getAttribute('placeholder') || '';
          const ariaLabel = el.getAttribute('aria-label') || '';
          const label = getLabelText(el);
          const inlineEvents = getEventListeners(el);
          const isVisible = el.offsetParent !== null;

          const shouldInclude = ['input', 'select', 'textarea', 'button', 'a'].includes(tag) ||
            inlineEvents.length > 0 ||
            el.hasAttribute('tabindex') ||
            el.hasAttribute('role');

          if (!shouldInclude || !isVisible) return;

          const name = label || ariaLabel || placeholder || nameAttr || idAttr || tag;
          const locator = generateXPath(el);
          const value = el.value || el.innerText?.trim() || '';
          const inputType = typeAttr;
          const eventType = inlineEvents.length > 0 ? inlineEvents.join(', ') : getDefaultEventType(tag, inputType);

          grabbed.push({
            name,
            type: tag,
            locator,
            value,
            inputType,
            eventType
          });
        });

        const unique = new Map();
        grabbed.forEach(el => {
          if (!unique.has(el.locator)) unique.set(el.locator, el);
        });

        window.opener.postMessage({
          type: 'GRABBED_ELEMENTS',
          elements: Array.from(unique.values())
        }, '*');
      };
    })();
  `);
  };

  const openNewWindow = () => {
    const newWin = window.open(url, '_blank', 'width=1200,height=800');
    const interval = setInterval(() => {
      try {
        if (newWin.document.readyState === 'complete') {
          clearInterval(interval);
          injectOverlayScript(newWin);
        }
      } catch {
        clearInterval(interval);
        alert('Cannot inject into a different-origin window. Make sure the domain is same.');
      }
    }, 600);
  };

  const handleInputChange = (i, val) => {
    const updated = [...elements];
    updated[i].value = val;
    setElements(updated);
  };

  const handleSubmit = async () => {
    const payload = {
      screenName,
      data: elements
    };
    await axios.post('/api/saveGrabbedElements', payload);
    alert('Saved Successfully');
  };

  const isRowSelected = (element) =>
    selectedElements.find((el) => el.locator === element.locator) !== undefined;

  return (
    <div className="max-w-8xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Grabber Tool</h1>
      <div className="flex gap-4">
        <input
          className="flex-1 border border-gray-300 shadow p-2 rounded-lg"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="bg-[#0071E9] hover:bg-[#005ABA]  text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={openNewWindow}
        >
          <ExternalLink size={18} /> Open Grabber
        </button>
      </div>

      {showOverlay && (
        <motion.div
          className="mt-6 bg-white shadow-xl rounded-xl p-6 border border-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4">
            <input
              className="w-full border p-2 rounded-lg border-gray-400"
              placeholder="Enter Screen Name"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
            />
          </div>
          <table className="w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 border-gray-400">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      onChange={handleSelectAll}
                      disabled={elements.length === 0}
                    />
                    <span className="checkmark" />
                  </label>
                </th>
                <th className="border p-2 border-gray-400">Name</th>
                <th className="border p-2 border-gray-400">Type</th>
                <th className="border p-2 border-gray-400 ">XPath</th>
                <th className="border p-2 border-gray-400">Events</th>
                <th className="border p-2 border-gray-400">Test Data</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((el, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-400 p-2 text-center">
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={isRowSelected(el)}
                        onChange={() => handleSelectRow(el)}
                      />
                      <span className="checkmark" />
                    </label>
                  </td>
                  <td className="border border-gray-400 p-2">{el.name}</td>
                  <td className="border border-gray-400 p-2">{el.type}</td>
                  <td className="border border-gray-400 p-2 text-blue-600 break-all">{el.locator}</td>
                  <td className="border border-gray-400 p-2 text-purple-600">{el.eventType || '—'}</td>
                  <td className="border border-gray-400 p-2">
                    {['input', 'textarea'].includes(el.type) ? (
                      <input
                        type={el.inputType || 'text'}
                        className="border p-1 w-full rounded-md"
                        value={el.value}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                      />
                    ) : el.value ? (
                      <span>{el.value}</span>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
            >
              <Download size={18} className="inline mr-2" /> Save
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GrabberTool;
