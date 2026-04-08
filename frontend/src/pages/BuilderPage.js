import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI } from '../utils/api';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Eye,
  ArrowLeft, CheckCircle2, Keyboard, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './BuilderPage.css';
import 'mathlive';

const emptyNormal = () => ({ type: 'normal', question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });
const emptyMCQ   = () => ({ type: 'mcq',    question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });

// ─────────────────────────────────────────────────────────────────────────────
// MathKeyboardPopup
// A floating panel with a fresh empty math-field.
// The user types an expression → clicks Insert → it is wrapped in $...$ and
// injected at the cursor position in the textarea.
// The textarea value is NEVER passed into the math-field, so MathLive can
// never mangle plain text.
// ─────────────────────────────────────────────────────────────────────────────
function MathKeyboardPopup({ onInsert, onClose }) {
  const mathRef = useRef(null);

  useEffect(() => {
    const el = mathRef.current;
    if (!el) return;
    const t = setTimeout(() => el.focus?.(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleInsert = () => {
    const el = mathRef.current;
    if (!el) return;
    const latex = el.value?.trim();
    if (!latex) { toast.error('Enter a math expression first'); return; }
    onInsert(latex);   // caller wraps in $...$
    el.value = '';
  };

  // Allow Enter key to insert
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInsert(); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="math-popup" onKeyDown={handleKeyDown}>
      <div className="math-popup-header">
        <span className="math-popup-label">Math Keyboard — type expression, then click Insert</span>
        <button className="math-popup-close" onClick={onClose} title="Close"><X size={16} /></button>
      </div>
      <math-field ref={mathRef} class="mathlive-popup-field" />
      <div className="math-popup-footer">
        <span className="math-popup-hint">Inserts as <code>$…$</code> at your cursor position</span>
        <button className="math-insert-btn" onClick={handleInsert}>
          <Check size={15} /> Insert
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuestionField
// The textarea is ALWAYS the single source of truth.
// The keyboard icon opens MathKeyboardPopup.
// On Insert, the latex string is wrapped in $...$ and spliced into the
// textarea at the saved cursor position.
// ─────────────────────────────────────────────────────────────────────────────
function QuestionField({ value, onChange }) {
  const [showMath, setShowMath] = useState(false);
  const textareaRef = useRef(null);
  const cursorPos   = useRef({ start: 0, end: 0 });

  // Save cursor whenever the textarea loses focus or the user clicks ⌨
  const saveCursor = () => {
    const el = textareaRef.current;
    if (el) cursorPos.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const handleOpenMath = () => {
    saveCursor();
    setShowMath(true);
  };

  const handleInsert = useCallback((latex) => {
    // Wrap the raw LaTeX in $ delimiters automatically
    const snippet = `$${latex}$`;
    const { start, end } = cursorPos.current;
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    onChange(newValue);
    setShowMath(false);

    // Move textarea cursor to just after the inserted snippet
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }, [value, onChange]);

  return (
    <div className="math-input-wrapper">
      <div className="question-input-row">
        <textarea
          ref={textareaRef}
          className="q-textarea"
          placeholder="Type your question. Use ⌨ to insert math symbols."
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={saveCursor}
          onMouseUp={saveCursor}
          onKeyUp={saveCursor}
          rows={2}
        />
        <button
          type="button"
          className={`math-toggle-btn${showMath ? ' active' : ''}`}
          onClick={() => showMath ? setShowMath(false) : handleOpenMath()}
          title="Insert math expression"
        >
          <Keyboard size={18} />
        </button>
      </div>

      {showMath && (
        <MathKeyboardPopup
          onInsert={handleInsert}
          onClose={() => setShowMath(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main BuilderPage
// ─────────────────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setName, setSetName]     = useState('');
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(!!id);

  useEffect(() => {
    if (id) {
      questionAPI.getOne(id)
        .then(res => { setSetName(res.data.setName); setQuestions(res.data.questions); })
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const addQuestion = (type) => {
    setQuestions(prev => [...prev, type === 'normal' ? emptyNormal() : emptyMCQ()]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuestion = (idx) => setQuestions(q => q.filter((_, i) => i !== idx));

  const moveQuestion = (idx, dir) => {
    const arr = [...questions];
    const n = idx + dir;
    if (n < 0 || n >= arr.length) return;
    [arr[idx], arr[n]] = [arr[n], arr[idx]];
    setQuestions(arr);
  };

  const updateQuestion = (idx, field, val) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: val };
      return arr;
    });
  };

  const updateOption = (idx, key, val) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], options: { ...arr[idx].options, [key]: val } };
      return arr;
    });
  };

  const selectCorrectOption = (idx, key) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], correctOption: key, answer: arr[idx].options[key] };
      return arr;
    });
  };

  const handleSave = async () => {
    if (!setName.trim()) return toast.error('Please enter a set name');
    if (questions.length === 0) return toast.error('Add at least one question');
    const bad = questions.findIndex(q => !q.question.trim());
    if (bad !== -1) return toast.error(`Question ${bad + 1} is empty`);
    setSaving(true);
    try {
      if (id) {
        await questionAPI.update(id, { setName, questions });
        toast.success('Question set updated!');
      } else {
        const res = await questionAPI.create({ setName, questions });
        toast.success('Question set saved!');
        navigate(`/builder/${res.data._id}`);
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>
  );

  return (
    <div className="builder-page fade-in">
      <div className="builder-topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="builder-actions">
          {id && (
            <button className="btn-outline" onClick={() => navigate(`/preview/${id}`)}>
              <Eye size={16} /> Preview
            </button>
          )}
        </div>
      </div>

      <div className="set-name-field">
        <label>Question Set Name</label>
        <input
          type="text"
          className="set-name-input"
          placeholder="e.g. Chapter 5 – Biology MCQ"
          value={setName}
          onChange={e => setSetName(e.target.value)}
        />
      </div>

      <div className="questions-list">
        {questions.length === 0 && (
          <div className="no-questions">
            <p>No questions added yet. Use the buttons below to add questions.</p>
          </div>
        )}

        {questions.map((q, idx) => (
          <div className={`question-card slide-in ${q.type}`} key={idx}>
            <div className="question-card-header">
              <div className="q-number-badge">{idx + 1}</div>
              <span className={`q-type-badge ${q.type}`}>{q.type === 'mcq' ? 'MCQ' : 'Normal'}</span>
              <div className="q-header-actions">
                <button className="icon-btn" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Move up">
                  <ChevronUp size={16} />
                </button>
                <button className="icon-btn" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Move down">
                  <ChevronDown size={16} />
                </button>
                <button className="icon-btn delete" onClick={() => removeQuestion(idx)} title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="field-group">
              <label>Question <span className="required">*</span></label>
              <QuestionField
                value={q.question}
                onChange={val => updateQuestion(idx, 'question', val)}
              />
            </div>

            {q.type === 'normal' && (
              <div className="field-group">
                <label>Answer <span className="optional">(optional)</span></label>
                <textarea
                  className="q-textarea"
                  placeholder="Enter the answer..."
                  value={q.answer}
                  onChange={e => updateQuestion(idx, 'answer', e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {q.type === 'mcq' && (
              <div className="mcq-options">
                <label>Options <span className="optional">– click correct option to mark answer</span></label>
                <div className="options-grid">
                  {['A', 'B', 'C', 'D'].map(key => (
                    <div className={`option-row ${q.correctOption === key ? 'correct' : ''}`} key={key}>
                      <button
                        className={`option-selector ${q.correctOption === key ? 'selected' : ''}`}
                        onClick={() => q.options[key] && selectCorrectOption(idx, key)}
                        title="Mark as correct"
                        type="button"
                      >
                        {q.correctOption === key ? <CheckCircle2 size={18} /> : <span className="option-key">{key}</span>}
                      </button>
                      <input
                        type="text"
                        className="option-input"
                        placeholder={`Option ${key}`}
                        value={q.options[key]}
                        onChange={e => updateOption(idx, key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                {q.correctOption && (
                  <div className="answer-preview">
                    ✓ Answer: <strong>{q.correctOption}. {q.options[q.correctOption]}</strong>
                  </div>
                )}
                {!q.correctOption && (
                  <p className="answer-hint">Click an option label to mark the correct answer (optional)</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="add-question-bar">
        <span className="add-label">Add Question:</span>
        <button className="add-btn normal" onClick={() => addQuestion('normal')}>
          <Plus size={16} /> Normal Question
        </button>
        <button className="add-btn mcq" onClick={() => addQuestion('mcq')}>
          <Plus size={16} /> MCQ Question
        </button>
        <button className="btn-primary gold" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Set'}
        </button>
      </div>
    </div>
  );
}