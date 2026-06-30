import React, {
  useState, useRef, useEffect, useCallback, useLayoutEffect, createContext, useContext,
} from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../resumeTemplates/templateSchema.js';

export const SectionActiveContext = createContext({
  activeSectionId: null,
  setActiveSectionId: () => {},
  isSectionActive: false
});

// ─── EditableText ─────────────────────────────────────────────────────────────
export const EditableText = ({
  value = '',
  onChange,
  placeholder = '',
  bold = false,
  style = {},
  className = '',
}) => {
  const spanRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && spanRef.current && spanRef.current.innerHTML !== value) {
      spanRef.current.innerHTML = value || '';
    }
  }, [value, focused]);

  const handleBlur = () => {
    setFocused(false);
    const newVal = spanRef.current?.innerHTML?.trim() || '';
    if (newVal !== value) onChange?.(newVal);
  };

  const isEmpty = !value && !focused;

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); spanRef.current?.blur(); } }}
      style={{
        outline: 'none',
        cursor: 'text',
        fontWeight: bold ? 'bold' : undefined,
        minWidth: '4px',
        display: 'inline-block',
        borderBottom: focused ? '1.5px solid #6366f1' : '1px solid transparent',
        transition: 'border-color 0.15s',
        color: isEmpty ? '#9ca3af' : undefined,
        ...style,
      }}
      className={className}
      onMouseDown={(e) => e.stopPropagation()}
      dangerouslySetInnerHTML={{ __html: value || (isEmpty ? placeholder : '') }}
    />
  );
};

// ─── EditableMultiline ────────────────────────────────────────────────────────
export const EditableMultiline = ({
  value = '',
  onChange,
  placeholder = '',
  style = {},
  className = '',
}) => {
  const divRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && divRef.current && divRef.current.innerHTML !== value) {
      divRef.current.innerHTML = value || '';
    }
  }, [value, focused]);

  const handleBlur = () => {
    setFocused(false);
    const newVal = divRef.current?.innerHTML?.trim() || '';
    if (newVal !== value) onChange?.(newVal);
  };

  const isEmpty = !value && !focused;

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      style={{
        outline: 'none',
        cursor: 'text',
        minWidth: '4px',
        width: '100%',
        minHeight: '20px',
        display: 'block',
        whiteSpace: 'pre-wrap',
        borderBottom: focused ? '1.5px solid #6366f1' : '1px solid transparent',
        transition: 'border-color 0.15s',
        color: isEmpty ? '#9ca3af' : undefined,
        ...style,
      }}
      className={className}
      onMouseDown={(e) => e.stopPropagation()}
      dangerouslySetInnerHTML={{ __html: value || (isEmpty ? placeholder : '') }}
    />
  );
};

// ─── EditableBullets ──────────────────────────────────────────────────────────
export const EditableBullets = ({ items = [], onChange, editMode, style = {} }) => {
  const { isSectionActive } = useContext(SectionActiveContext);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!editMode && items.length === 0) return null;

  const update = (i, v) => {
    const next = [...items]; next[i] = v;
    onChange?.(next.filter(x => x !== ''));
  };
  const remove = (i) => onChange?.(items.filter((_, j) => j !== i));
  const addBullet = () => onChange?.([...items, '']);

  if (!editMode) {
    return (
      <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
        {items.map((b, i) => <li key={i} style={style}>{b}</li>)}
      </ul>
    );
  }

  return (
    <ul style={{ marginLeft: '16px', marginTop: '4px', listStyle: 'disc' }}>
      {items.map((b, i) => (
        <li
          key={i}
          style={{ ...style, position: 'relative', paddingRight: '20px' }}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => update(i, e.target.textContent.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addBullet(); }
              if (e.key === 'Backspace' && e.target.textContent === '') { e.preventDefault(); remove(i); }
            }}
            style={{ outline: 'none', minWidth: '4px', display: 'inline-block' }}
          >
            {b}
          </span>
          {isSectionActive && hoveredIdx === i && (
            <button
              onClick={() => remove(i)}
              onMouseDown={(e) => e.preventDefault()}
              style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '11px', lineHeight: '1', padding: '0 2px' }}
            >×</button>
          )}
        </li>
      ))}
      {isSectionActive && (
        <li style={{ listStyle: 'none', marginLeft: '-16px', marginTop: '3px' }}>
          <button
            onClick={addBullet}
            style={{ fontSize: '7.5pt', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <span style={{ fontSize: '10px' }}>+</span> Add bullet
          </button>
        </li>
      )}
    </ul>
  );
};

// ─── EditableSkillChips ───────────────────────────────────────────────────────
export const EditableSkillChips = ({
  items = [], onChange, editMode, chipStyle = {}, label, inline = false, separator = ', ',
}) => {
  const { isSectionActive } = useContext(SectionActiveContext);
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const remove = (i) => onChange?.(items.filter((_, j) => j !== i));
  const confirmAdd = () => {
    const v = inputVal.trim();
    if (v && !items.includes(v)) onChange?.([...items, v]);
    setInputVal(''); setAdding(false);
  };

  const isReallyEditing = editMode && isSectionActive;

  if (!isReallyEditing) {
    if (inline) return <span>{items.join(separator)}</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {items.map((s, i) => <span key={i} style={chipStyle}>{s}</span>)}
      </div>
    );
  }

  if (inline) {
    return (
      <span>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            <span style={chipStyle}>{item}</span>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '10px', lineHeight: '1', padding: '0' }}>×</button>
            {i < items.length - 1 && <span style={{ color: '#9ca3af' }}>{separator}</span>}
          </span>
        ))}
        {adding ? (
          <input ref={inputRef} value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); } if (e.key === 'Escape') { setAdding(false); setInputVal(''); } }}
            onBlur={confirmAdd}
            style={{ fontSize: 'inherit', border: 'none', borderBottom: '1px solid #6366f1', outline: 'none', width: '80px', background: 'transparent', fontFamily: 'inherit', color: 'inherit', padding: '0' }}
            placeholder="Add..." />
        ) : (
          <button onClick={() => setAdding(true)} style={{ fontSize: '7.5pt', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>+ Add</button>
        )}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
      {label && <span style={{ fontSize: '7.5pt', color: '#9ca3af', marginRight: '4px' }}>{label}:</span>}
      {items.map((item, i) => (
        <span key={i} style={{ ...chipStyle, display: 'inline-flex', alignItems: 'center', gap: '3px', paddingRight: '4px' }}>
          {item}
          <button onClick={() => remove(i)} onMouseDown={(e) => e.preventDefault()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '10px', lineHeight: '1', padding: '0', marginLeft: '2px' }}>×</button>
        </span>
      ))}
      {adding ? (
        <input ref={inputRef} value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); } if (e.key === 'Escape') { setAdding(false); setInputVal(''); } }}
          onBlur={confirmAdd}
          style={{ ...chipStyle, border: '1px solid #6366f1', outline: 'none', width: '90px', background: 'white', fontFamily: 'inherit', padding: '2px 8px' }}
          placeholder="Type..." />
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ ...chipStyle, background: 'transparent', border: '1px dashed #d1d5db', color: '#6b7280', cursor: 'pointer', fontSize: '7.5pt' }}>
          + Add
        </button>
      )}
    </div>
  );
};

// ─── BlockWrapper ─────────────────────────────────────────────────────────────
/**
 * data-block marks this element for the page-break engine.
 * The engine will inject marginTop if the block would cross a page boundary.
 */
export const BlockWrapper = ({ children, editMode, onDelete, onMoveUp, onMoveDown, id }) => {
  const { isSectionActive } = useContext(SectionActiveContext);
  const [active, setActive] = useState(false);
  const blockId = useRef(id || `block-${Math.random().toString(36).substr(2, 9)}`).current;
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active]);

  if (!editMode) return <>{children}</>;

  const showControls = active && isSectionActive;

  return (
    <div
      ref={wrapperRef}
      data-block
      data-block-id={blockId}
      style={{
        position: 'relative',
        borderRadius: '4px',
        outline: showControls ? '1.5px solid #6366f1' : '1.5px solid transparent',
        transition: 'outline 0.15s',
        marginBottom: '2px',
      }}
      onClick={() => setActive(true)}
      onFocus={() => setActive(true)}
    >
      {showControls && (
        <div
          style={{ position: 'absolute', top: '-22px', right: '0', display: 'flex', gap: '2px', background: '#1e1b4b', borderRadius: '5px', padding: '2px 4px', zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {onMoveUp && <button onClick={onMoveUp} title="Move up" style={toolbarBtnStyle}>↑</button>}
          {onMoveDown && <button onClick={onMoveDown} title="Move down" style={toolbarBtnStyle}>↓</button>}
          {onDelete && <button onClick={onDelete} title="Delete" style={{ ...toolbarBtnStyle, color: '#f87171' }}>✕</button>}
        </div>
      )}
      {children}
    </div>
  );
};

const toolbarBtnStyle = {
  background: 'none', border: 'none', color: 'white', cursor: 'pointer',
  fontSize: '11px', padding: '2px 5px', borderRadius: '3px', lineHeight: '1',
};

// ─── SectionWrapper ───────────────────────────────────────────────────────────
export const SectionWrapper = ({ children, editMode, id }) => {
  const context = useContext(SectionActiveContext);
  const sectionId = useRef(id || `sec-${Math.random().toString(36).substr(2, 9)}`).current;

  if (!editMode) return <>{children}</>;

  const isActive = context?.activeSectionId === sectionId;

  return (
    <SectionActiveContext.Provider value={{
      activeSectionId: context?.activeSectionId,
      setActiveSectionId: context?.setActiveSectionId,
      isSectionActive: isActive
    }}>
      <div 
        data-section 
        style={{ 
          position: 'relative', 
          outline: isActive ? '1px dashed rgba(99, 102, 241, 0.4)' : 'none',
          outlineOffset: '4px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          context?.setActiveSectionId?.(sectionId);
        }}
      >
        {children}
      </div>
    </SectionActiveContext.Provider>
  );
};

// ─── useDebounce ──────────────────────────────────────────────────────────────
export const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─── CVCanvas — single-render page-break engine ───────────────────────────────
const PAGE_GAP = 40;

const CVCanvas = ({ resumeData, onUpdate, TemplateComponent }) => {
  const cvRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [injectedStyles, setInjectedStyles] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(null);

  const runPageBreaks = useCallback(() => {
    const container = cvRef.current;
    if (!container) return;

    // ── Step 1: remove the injected style tag's effects by clearing state temporarily?
    // Actually, we don't need to clear the state, because if we do, we trigger a re-render
    // and have to wait. We can just temporarily disable the style block in the DOM.
    const styleEl = document.getElementById('cv-dynamic-margins');
    if (styleEl) styleEl.disabled = true;

    // Wait one rAF so the browser re-flows without margins
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();

      // Snapshot ALL natural positions
      const snapshots = Array.from(container.querySelectorAll('[data-block]')).map(block => {
        const rect = block.getBoundingClientRect();
        return {
          id: block.getAttribute('data-block-id'),
          naturalTop: rect.top - containerRect.top,
          height: rect.height,
        };
      });

      let cumulativePush = 0;
      let newCSS = '';

      snapshots.forEach(({ id, naturalTop, height }) => {
        if (!id) return;
        const effTop = naturalTop + cumulativePush;
        const effBottom = effTop + height;

        let pageIndex = 0;
        while (effTop > pageIndex * (A4_HEIGHT_PX + PAGE_GAP) + A4_HEIGHT_PX) {
          pageIndex++;
        }
        
        const pageEnd = pageIndex * (A4_HEIGHT_PX + PAGE_GAP) + A4_HEIGHT_PX;

        if (effBottom > pageEnd && height < A4_HEIGHT_PX * 0.95) {
          const nextPageStart = (pageIndex + 1) * (A4_HEIGHT_PX + PAGE_GAP);
          const push = nextPageStart - effTop;
          
          newCSS += `[data-block-id="${id}"] { margin-top: ${push}px !important; }\n`;
          cumulativePush += push;
        }
      });

      // Re-enable the style block and update state
      if (styleEl) styleEl.disabled = false;
      setInjectedStyles(newCSS);

      if (snapshots.length > 0) {
        const last = snapshots[snapshots.length - 1];
        const maxBottom = last.naturalTop + cumulativePush + last.height;
        
        let pIdx = 0;
        while (maxBottom > pIdx * (A4_HEIGHT_PX + PAGE_GAP) + A4_HEIGHT_PX) {
          pIdx++;
        }
        setPageCount(pIdx + 1);
      } else {
        setPageCount(1);
      }
    });
  }, []);

  useLayoutEffect(() => {
    if (!cvRef.current) return;
    const observer = new ResizeObserver(runPageBreaks);
    observer.observe(cvRef.current);
    runPageBreaks();
    return () => observer.disconnect();
  }, [runPageBreaks, TemplateComponent, resumeData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const canvasEl = cvRef.current;
      if (canvasEl && !canvasEl.contains(e.target)) {
        setActiveSectionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SectionActiveContext.Provider value={{ activeSectionId, setActiveSectionId }}>
      <div style={{ position: 'relative', width: `${A4_WIDTH_PX}px`, minHeight: `${A4_HEIGHT_PX}px` }}>
        <style>{`
          .cv-mask-layer > div {
            background: transparent !important;
          }
        `}</style>
        <style id="cv-dynamic-margins">{injectedStyles}</style>

        {/* ── Visual A4 Background Cards ── */}
        {Array.from({ length: Math.max(1, pageCount) }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${i * (A4_HEIGHT_PX + PAGE_GAP)}px`,
            left: 0,
            width: '100%',
            height: `${A4_HEIGHT_PX}px`,
            background: 'white',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            borderRadius: '4px',
            zIndex: 0,
            pointerEvents: 'none',
          }} />
        ))}

        {/* ── Single CV Render Layer ── */}
        <div
          ref={cvRef}
          className="cv-mask-layer"
          style={{
            width: '100%',
            position: 'relative',
            zIndex: 1,
            // The mask hides the continuous DOM exactly in the gap regions
            WebkitMaskImage: `repeating-linear-gradient(to bottom, black 0px, black ${A4_HEIGHT_PX}px, transparent ${A4_HEIGHT_PX}px, transparent ${A4_HEIGHT_PX + PAGE_GAP}px)`,
            maskImage: `repeating-linear-gradient(to bottom, black 0px, black ${A4_HEIGHT_PX}px, transparent ${A4_HEIGHT_PX}px, transparent ${A4_HEIGHT_PX + PAGE_GAP}px)`,
          }}
        >
          <TemplateComponent
            resumeData={resumeData}
            onUpdate={onUpdate}
            editMode
          />
        </div>
      </div>
    </SectionActiveContext.Provider>
  );
};

// ─── InlineCVEditor (main export) ────────────────────────────────────────────
const InlineCVEditor = ({ resumeData, onUpdate, selectedTemplate = 'classic' }) => {
  const [TemplateComponent, setTemplateComponent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { resolveTemplateComponent } = await import('../resumeTemplates/index.js');
        const loader = resolveTemplateComponent(selectedTemplate);
        const comp = await loader();
        if (!cancelled) setTemplateComponent(() => comp);
      } catch (e) {
        console.error('Template load error', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedTemplate]);

  if (!TemplateComponent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 24px 60px',
      background: '#f1f5f9',
      minHeight: '100%',
      width: '100%',
      position: 'relative',
    }}>
      <CVCanvas
        resumeData={resumeData}
        onUpdate={onUpdate}
        TemplateComponent={TemplateComponent}
      />
      <FloatingTextToolbar />
    </div>
  );
};

const FloatingTextToolbar = () => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setVisible(false);
        return;
      }

      const range = sel.getRangeAt(0);
      let node = range.commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode;

      let isEditable = false;
      let curr = node;
      while (curr) {
        if (curr.contentEditable === 'true') {
          isEditable = true;
          break;
        }
        curr = curr.parentNode;
      }

      if (!isEditable) {
        setVisible(false);
        return;
      }

      const rect = range.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 36, // float 36px above selection
        left: rect.left + window.scrollX + rect.width / 2
      });
      setVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateX(-50%)',
        background: '#1e1b4b',
        border: '1px solid #4338ca',
        borderRadius: '6px',
        padding: '3px 5px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => document.execCommand('bold')}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px',
        }}
      >
        B
      </button>
      <button
        onClick={() => {
          const url = prompt('Enter URL (e.g. https://example.com):');
          if (url) {
            document.execCommand('createLink', false, url);
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px',
        }}
      >
        🔗 Link
      </button>
      <button
        onClick={() => document.execCommand('unlink')}
        style={{
          background: 'none',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px',
        }}
      >
        Unlink
      </button>
    </div>
  );
};

export default InlineCVEditor;
