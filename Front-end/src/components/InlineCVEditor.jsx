import React, {
  useState, useRef, useEffect, useCallback, useLayoutEffect, createContext, useContext,
} from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../resumeTemplates/templateSchema.js';

export const SectionActiveContext = createContext({
  activeSectionId: null,
  setActiveSectionId: () => {},
  isSectionActive: false
});

// ─── SVG Icons for editor components ───
const MailIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const PhoneIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.09h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69A16 16 0 0 0 16 16.73l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23.73 18z"/></svg>;
const MapPinIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const LinkedInIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const GitHubIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;

const ArrowUpIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="18 15 12 9 6 15"/></svg>;
const ArrowDownIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>;
const CopyIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const TrashIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const HandleIcon = () => (
  <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, flexShrink: 0 }}>
    <circle cx="9" cy="5" r="1.5" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9" cy="19" r="1.5" fill="currentColor" />
    <circle cx="15" cy="5" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15" cy="19" r="1.5" fill="currentColor" />
  </svg>
);
const BulletTrashIcon = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const AddChipIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

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
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); spanRef.current?.blur(); } }}
      style={{
        outline: 'none',
        cursor: 'text',
        fontWeight: bold ? 'bold' : undefined,
        minWidth: '4px',
        display: 'inline-block',
        borderRadius: '3px',
        padding: '1px 2px',
        background: focused ? 'rgba(99, 102, 241, 0.04)' : (hovered ? 'rgba(99, 102, 241, 0.02)' : 'transparent'),
        borderBottom: focused ? '1.5px solid #6366f1' : '1.5px solid transparent',
        transition: 'background-color 0.15s, border-color 0.15s',
        color: isEmpty ? '#9ca3af' : undefined,
        ...style,
      }}
      className={className}
      data-placeholder={isEmpty ? 'true' : undefined}
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
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        outline: 'none',
        cursor: 'text',
        minWidth: '4px',
        width: '100%',
        minHeight: '20px',
        display: 'block',
        whiteSpace: 'pre-wrap',
        borderRadius: '3px',
        padding: '2px 4px',
        background: focused ? 'rgba(99, 102, 241, 0.04)' : (hovered ? 'rgba(99, 102, 241, 0.02)' : 'transparent'),
        borderBottom: focused ? '1.5px solid #6366f1' : '1.5px solid transparent',
        transition: 'background-color 0.15s, border-color 0.15s',
        color: isEmpty ? '#9ca3af' : undefined,
        ...style,
      }}
      className={className}
      data-placeholder={isEmpty ? 'true' : undefined}
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
          style={{ ...style, position: 'relative', paddingRight: '24px' }}
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
            style={{
              outline: 'none',
              minWidth: '4px',
              display: 'inline-block',
              borderBottom: '1px solid transparent',
              borderRadius: '2px',
              padding: '1px 2px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.02)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {b}
          </span>
          {isSectionActive && hoveredIdx === i && (
            <button
              onClick={() => remove(i)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                right: '2px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                borderRadius: '4px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <BulletTrashIcon />
            </button>
          )}
        </li>
      ))}
      {isSectionActive && (
        <li style={{ listStyle: 'none', marginLeft: '-16px', marginTop: '3px' }}>
          <button
            onClick={addBullet}
            style={{
              fontSize: '7.5pt',
              color: '#6366f1',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <AddChipIcon />
            <span>Add bullet</span>
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
            <button
              onClick={() => remove(i)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                padding: '2px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <BulletTrashIcon />
            </button>
            {i < items.length - 1 && <span style={{ color: '#9ca3af' }}>{separator}</span>}
          </span>
        ))}
        {adding ? (
          <input ref={inputRef} value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); } if (e.key === 'Escape') { setAdding(false); setInputVal(''); } }}
            onBlur={confirmAdd}
            style={{ fontSize: 'inherit', border: 'none', borderBottom: '1.5px solid #6366f1', outline: 'none', width: '80px', background: 'transparent', fontFamily: 'inherit', color: 'inherit', padding: '0' }}
            placeholder="Add..." />
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              fontSize: '7.5pt',
              color: '#6366f1',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <AddChipIcon />
            <span>Add</span>
          </button>
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
          <button
            onClick={() => remove(i)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444',
              padding: '2px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <BulletTrashIcon />
          </button>
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
          style={{
            ...chipStyle,
            background: 'transparent',
            border: '1px dashed #d1d5db',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '7.5pt',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            transition: 'border-color 0.15s, color 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <AddChipIcon />
          <span>Add</span>
        </button>
      )}
    </div>
  );
};

// ─── Block context menu primitives ───────────────────────────────────────────
const BlockMenuItem = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
    onMouseDown={(e) => e.preventDefault()}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 10px', background: 'none', border: 'none', borderRadius: '6px',
      cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit',
      color: danger ? '#ef4444' : '#374151', textAlign: 'left',
      transition: 'background 0.15s, color 0.15s'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = danger ? '#fef2f2' : '#f8fafc'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
  >
    <span style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.7, color: danger ? '#ef4444' : '#475569' }}>
      {icon}
    </span>
    {label}
  </button>
);

const BlockMenuDivider = () => (
  <div style={{ height: '1px', background: '#f1f5f9', margin: '3px 4px' }} />
);

// ─── BlockWrapper ─────────────────────────────────────────────────────────────
export const BlockWrapper = ({ children, editMode, onDelete, onMoveUp, onMoveDown, onDuplicate, id }) => {
  const { isSectionActive } = useContext(SectionActiveContext);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const blockId = useRef(id || `block-${Math.random().toString(36).substr(2, 9)}`).current;
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!editMode) return <>{children}</>;

  const showHandle = (hovered || menuOpen) && isSectionActive;

  return (
    <div
      ref={wrapperRef}
      data-block
      data-block-id={blockId}
      style={{
        position: 'relative',
        borderRadius: '6px',
        transition: 'background 0.12s, box-shadow 0.12s',
        background: showHandle ? 'rgba(99,102,241,0.015)' : 'transparent',
        boxShadow: showHandle ? '0 0 0 1px rgba(99,102,241,0.06)' : 'none',
        padding: '4px',
        margin: '-4px',
        marginBottom: '12px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!menuOpen) setHovered(false); }}
    >
      {/* Notion-style floating handle — sits in the left margin */}
      {showHandle && (
        <div style={{ position: 'absolute', left: '-22px', top: '50%', transform: 'translateY(-50%)', zIndex: 50 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
            onMouseDown={(e) => e.preventDefault()}
            title="Block options"
            style={{
              width: '18px', height: '24px',
              background: menuOpen ? '#f1f5f9' : 'none',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '4px', padding: '0',
              color: menuOpen ? '#475569' : '#94a3b8',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <HandleIcon />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-40%)',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)',
                minWidth: '150px',
                zIndex: 200,
              }}
            >
              {onMoveUp && (
                <BlockMenuItem icon={<ArrowUpIcon />} label="Move Up" onClick={() => { onMoveUp(); setMenuOpen(false); }} />
              )}
              {onMoveDown && (
                <BlockMenuItem icon={<ArrowDownIcon />} label="Move Down" onClick={() => { onMoveDown(); setMenuOpen(false); }} />
              )}
              {onDuplicate && (onMoveUp || onMoveDown) && <BlockMenuDivider />}
              {onDuplicate && (
                <BlockMenuItem icon={<CopyIcon />} label="Duplicate" onClick={() => { onDuplicate(); setMenuOpen(false); }} />
              )}
              {onDelete && <BlockMenuDivider />}
              {onDelete && (
                <BlockMenuItem icon={<TrashIcon />} label="Delete" onClick={() => { onDelete(); setMenuOpen(false); }} danger />
              )}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

// ─── SectionWrapper ───────────────────────────────────────────────────────────
export const SectionWrapper = ({ children, editMode, id, sectionLabel, onAdd, onDelete }) => {
  const context = useContext(SectionActiveContext);
  const sectionId = useRef(id || `sec-${Math.random().toString(36).substr(2, 9)}`).current;
  const [hovered, setHovered] = useState(false);

  if (!editMode) return <>{children}</>;

  const isActive = context?.activeSectionId === sectionId;
  const showControls = hovered || isActive;

  return (
    <SectionActiveContext.Provider value={{
      activeSectionId: context?.activeSectionId,
      setActiveSectionId: context?.setActiveSectionId,
      isSectionActive: isActive
    }}>
      <div 
        data-section 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ 
          position: 'relative', 
          outline: isActive ? '1.5px solid rgba(99, 102, 241, 0.25)' : '1.5px solid transparent',
          outlineOffset: '4px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'outline-color 0.15s',
          padding: '2px',
          margin: '-2px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          context?.setActiveSectionId?.(sectionId);
        }}
      >
        {showControls && sectionLabel && (
          <div style={{
            position: 'absolute',
            top: '-14px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02)',
            borderRadius: '8px',
            padding: '3px 6px',
            zIndex: 40,
            userSelect: 'none',
          }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', paddingRight: '6px', borderRight: '1px solid #f1f5f9', marginRight: '2px' }}>
              {sectionLabel}
            </span>
            {onAdd && (
              <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                title={`Add item to ${sectionLabel}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#475569', borderRadius: '4px', transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <AddChipIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Are you sure you want to clear/hide this ${sectionLabel} section?`)) onDelete(); }}
                title={`Hide ${sectionLabel} section`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#ef4444', borderRadius: '4px', transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
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

const CVCanvas = ({ resumeData, onUpdate, TemplateComponent, zoom = 1, onPageCountChange }) => {
  const cvRef = useRef(null);
  const screenStyleRef = useRef(null); // imperative <style> for on-screen page-break margins
  const [pageCount, setPageCount] = useState(1);
  const [injectedPdfStyles, setInjectedPdfStyles] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(null);

  const runPageBreaks = useCallback(() => {
    const container = cvRef.current;
    const styleEl = screenStyleRef.current;
    if (!container || !styleEl) return;

    // ── Measure-clean pass ──
    // Zero out previously injected margins so every element sits at its true
    // natural flow position. This sidesteps margin-collapsing bookkeeping
    // entirely — no drift, no oscillation. The browser only paints after this
    // function returns, so the reset is never visible.
    styleEl.textContent = '';

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return;

    // Blocks are atomic sub-sections (experience items, education entries…).
    // Headings are section titles that must never be orphaned at a page bottom.
    const items = Array.from(container.querySelectorAll('[data-block], [data-heading]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-block-id'),
          top: (rect.top - containerRect.top) / zoom,
          height: rect.height / zoom,
          isHeading: el.hasAttribute('data-heading'),
        };
      })
      .filter(it => it.id)
      .sort((a, b) => a.top - b.top);

    // ── Decide page breaks once, in pure content space (no visual gap) ──
    // An element must start a new page when it cannot fit whole on its
    // current page (unless it is taller than ~a page itself, in which case
    // splitting is unavoidable). Headings are kept with the block that
    // follows them so a section title is never stranded at a page bottom.
    const overflows = (top, height) => {
      const pageEnd = Math.floor(top / A4_HEIGHT_PX) * A4_HEIGHT_PX + A4_HEIGHT_PX;
      return top + height > pageEnd && height < A4_HEIGHT_PX * 0.9;
    };

    const pushedIds = new Set();
    let cumulativePush = 0;
    items.forEach((it, i) => {
      const effTop = it.top + cumulativePush;
      let mustPush = overflows(effTop, it.height);

      // Keep-with-next: a heading that fits but whose first following block
      // gets pushed would be orphaned — push the heading too, and the block
      // (plus everything after) flows down with it.
      if (!mustPush && it.isHeading) {
        const next = items[i + 1];
        if (next && !next.isHeading) {
          const gapBetween = next.top - (it.top + it.height);
          if (gapBetween < 80 && overflows(next.top + cumulativePush, next.height)) {
            mustPush = true;
          }
        }
      }

      if (mustPush) {
        const nextPageStart = (Math.floor(effTop / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;
        pushedIds.add(it.id);
        cumulativePush += nextPageStart - effTop;
      }
    });

    // ── Emit the two stylesheets from the same decisions ──
    // Screen: pixel margin pushes in gap-inclusive canvas space.
    // PDF: forced fragmentation breaks — Chrome's paginator starts each
    // decided block at an exact page top, so sub-pixel page-size rounding
    // can never accumulate into visible drift across pages.
    const pageLength = A4_HEIGHT_PX + PAGE_GAP;
    let screenPush = 0;
    let screenCSS = '';
    let pdfCSS = '';
    items.forEach((it) => {
      if (!pushedIds.has(it.id)) return;
      const effTop = it.top + screenPush;
      const nextPageStart = (Math.floor(effTop / pageLength) + 1) * pageLength;
      const push = nextPageStart - effTop;
      screenCSS += `[data-block-id="${it.id}"] { margin-top: ${push}px !important; }\n`;
      pdfCSS += `[data-block-id="${it.id}"] { break-before: page; page-break-before: always; margin-top: 0 !important; }\n`;
      screenPush += push;
    });

    // Apply the screen margins imperatively (synchronous, same frame).
    styleEl.textContent = screenCSS;

    // The PDF margins are stored for export capture only — rendered with
    // media="not all" so they NEVER affect the on-screen layout.
    setInjectedPdfStyles(prev => (prev === pdfCSS ? prev : pdfCSS));

    // Page count from the real rendered height (transforms don't affect
    // scrollHeight, so no zoom compensation needed).
    const totalHeight = container.scrollHeight;
    let pIdx = 0;
    while (totalHeight > pIdx * pageLength + A4_HEIGHT_PX) pIdx++;
    const computedPages = Math.max(1, pIdx + 1);
    setPageCount(computedPages);
    onPageCountChange?.(computedPages);
  }, [onPageCountChange, zoom]);

  useLayoutEffect(() => {
    if (!cvRef.current) return;
    const observer = new ResizeObserver(runPageBreaks);
    observer.observe(cvRef.current);
    runPageBreaks();
    // Run a late pass in case custom web fonts shift the heights after rendering
    const t = setTimeout(runPageBreaks, 150);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
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

  const fontHeading = resumeData.theme?.fontHeading || 'Poppins';
  const fontBody = resumeData.theme?.fontBody || 'Inter';
  
  const styleOverride = `
    @import url('https://fonts.googleapis.com/css2?family=${fontHeading.replace(/\s+/g, '+')}:wght@300;400;550;700;800&family=${fontBody.replace(/\s+/g, '+')}:wght@300;400;500;700&display=swap');
    .cv-mask-layer, .cv-mask-layer * {
      --font-heading: '${fontHeading}', sans-serif !important;
      --font-body: '${fontBody}', sans-serif !important;
    }
  `;

  // Size-compensating dimensions for zoom
  const naturalH = pageCount * (A4_HEIGHT_PX + PAGE_GAP);
  const scaledW = Math.round(A4_WIDTH_PX * zoom);
  const scaledH = Math.round(naturalH * zoom);

  return (
    <SectionActiveContext.Provider value={{ activeSectionId, setActiveSectionId }}>
      {/*
       * Size-compensating shell: tells the flexbox parent exactly how much
       * space the scaled canvas occupies, so scrollbars / centering stay correct.
       */}
      <div style={{ width: `${scaledW}px`, height: `${scaledH}px`, position: 'relative', flexShrink: 0 }}>
        {/* CSS transform zoom — origin top-left so maths are simple */}
        <div style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${A4_WIDTH_PX}px`,
        }}>
          <style>{`
            .cv-mask-layer > div {
              background: transparent !important;
            }
          `}</style>
          <style id="cv-dynamic-fonts">{styleOverride}</style>
          {/* On-screen page-break margins — written imperatively by runPageBreaks */}
          <style id="cv-dynamic-margins" ref={screenStyleRef} />
          {/* Gap-free margins for the PDF exporter. media="not all" keeps them
              from EVER applying on screen (they previously overrode the screen
              margins and shifted content into the page gaps). */}
          <style id="cv-pdf-margins" media="not all">{injectedPdfStyles}</style>

          <div style={{ position: 'relative', width: `${A4_WIDTH_PX}px`, minHeight: `${A4_HEIGHT_PX}px` }}>
            {/* ── Visual A4 Background Cards ── */}
            {Array.from({ length: Math.max(1, pageCount) }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${i * (A4_HEIGHT_PX + PAGE_GAP)}px`,
                left: 0,
                width: '100%',
                height: `${A4_HEIGHT_PX}px`,
                background: 'white',
                boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
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
        </div>
      </div>
    </SectionActiveContext.Provider>
  );
};

// ─── InlineCVEditor (main export) ────────────────────────────────────────────
const InlineCVEditor = ({ resumeData, onUpdate, selectedTemplate = 'classic', zoom = 1, onPageCountChange }) => {
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
      padding: '28px min(60px, 4vw) 60px',
      background: '#f1f5f9',
      minHeight: '100%',
      width: '100%',
      position: 'relative',
      overflowX: 'auto',
    }}>
      <CVCanvas
        resumeData={resumeData}
        onUpdate={onUpdate}
        TemplateComponent={TemplateComponent}
        zoom={zoom}
        onPageCountChange={onPageCountChange}
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Link
        </span>
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
