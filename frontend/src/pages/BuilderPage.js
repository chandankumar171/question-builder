import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { questionAPI, imageAPI } from "../utils/api";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Eye,
  ArrowLeft, Keyboard, CheckCircle2, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import "mathlive";
import "./BuilderPage.css";

// ─── Token: [IMG:publicId|||url] ─────────────────────────────────────────────
// We embed both publicId (for deletion) and url (for display).
// Using ||| as separator so it doesn't clash with URLs that contain colons.
function makeImgToken(publicId, url) {
  return `[IMG:${publicId}|||${url}]`;
}

// ─── Image upload button ──────────────────────────────────────────────────────
function ImageUploadBtn({ onInsert }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const res = await imageAPI.upload(file);
      const { url, publicId } = res.data;
      onInsert(makeImgToken(publicId, url));
      toast.success("Image inserted");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" hidden accept="image/*" onChange={handleFile} />
      <button
        type="button"
        className="toolbar-img-btn"
        onClick={() => inputRef.current.click()}
        disabled={uploading}
        title="Insert image at cursor"
      >
        {uploading ? <Loader size={14} className="spin" /> : "🖼"}
      </button>
    </>
  );
}

// ─── Math keyboard popup ──────────────────────────────────────────────────────
const MATH_TABS = {
  Basic: [
    { label: "x²",    latex: "x^{2}" },
    { label: "xⁿ",    latex: "x^{n}" },
    { label: "x₁",    latex: "x_{1}" },
    { label: "a/b",   latex: "\\frac{a}{b}" },
    { label: "√",     latex: "\\sqrt{x}" },
    { label: "ⁿ√",    latex: "\\sqrt[n]{x}" },
    { label: "±",     latex: "\\pm" },
    { label: "×",     latex: "\\times" },
    { label: "÷",     latex: "\\div" },
    { label: "≠",     latex: "\\neq" },
    { label: "≤",     latex: "\\leq" },
    { label: "≥",     latex: "\\geq" },
    { label: "≈",     latex: "\\approx" },
    { label: "∞",     latex: "\\infty" },
    { label: "|x|",   latex: "\\left|x\\right|" },
    { label: "(  )",  latex: "\\left(x\\right)" },
  ],
  Greek: [
    { label: "α", latex: "\\alpha" },
    { label: "β", latex: "\\beta" },
    { label: "γ", latex: "\\gamma" },
    { label: "δ", latex: "\\delta" },
    { label: "ε", latex: "\\epsilon" },
    { label: "θ", latex: "\\theta" },
    { label: "λ", latex: "\\lambda" },
    { label: "μ", latex: "\\mu" },
    { label: "π", latex: "\\pi" },
    { label: "σ", latex: "\\sigma" },
    { label: "φ", latex: "\\phi" },
    { label: "ω", latex: "\\omega" },
    { label: "Δ", latex: "\\Delta" },
    { label: "Σ", latex: "\\Sigma" },
    { label: "Π", latex: "\\Pi" },
    { label: "Ω", latex: "\\Omega" },
  ],
  Calculus: [
    { label: "∫",         latex: "\\int" },
    { label: "∫ᵃᵇ",      latex: "\\int_{a}^{b}" },
    { label: "∬",         latex: "\\iint" },
    { label: "∂",         latex: "\\partial" },
    { label: "d/dx",      latex: "\\frac{d}{dx}" },
    { label: "dy/dx",     latex: "\\frac{dy}{dx}" },
    { label: "∂f/∂x",    latex: "\\frac{\\partial f}{\\partial x}" },
    { label: "Σ",         latex: "\\sum_{i=1}^{n}" },
    { label: "Π",         latex: "\\prod_{i=1}^{n}" },
    { label: "lim",       latex: "\\lim_{x \\to \\infty}" },
    { label: "→",         latex: "\\to" },
    { label: "∇",         latex: "\\nabla" },
  ],
  Trig: [
    { label: "sin",     latex: "\\sin" },
    { label: "cos",     latex: "\\cos" },
    { label: "tan",     latex: "\\tan" },
    { label: "sin⁻¹",  latex: "\\sin^{-1}" },
    { label: "cos⁻¹",  latex: "\\cos^{-1}" },
    { label: "tan⁻¹",  latex: "\\tan^{-1}" },
    { label: "sec",     latex: "\\sec" },
    { label: "cosec",   latex: "\\csc" },
    { label: "cot",     latex: "\\cot" },
    { label: "log",     latex: "\\log" },
    { label: "ln",      latex: "\\ln" },
    { label: "logₐ",   latex: "\\log_{a}" },
  ],
  Sets: [
    { label: "∈",   latex: "\\in" },
    { label: "∉",   latex: "\\notin" },
    { label: "⊂",   latex: "\\subset" },
    { label: "⊃",   latex: "\\supset" },
    { label: "⊆",   latex: "\\subseteq" },
    { label: "∪",   latex: "\\cup" },
    { label: "∩",   latex: "\\cap" },
    { label: "∅",   latex: "\\emptyset" },
    { label: "ℝ",   latex: "\\mathbb{R}" },
    { label: "ℕ",   latex: "\\mathbb{N}" },
    { label: "ℤ",   latex: "\\mathbb{Z}" },
    { label: "ℚ",   latex: "\\mathbb{Q}" },
  ],
  Logic: [
    { label: "∀",  latex: "\\forall" },
    { label: "∃",  latex: "\\exists" },
    { label: "¬",  latex: "\\neg" },
    { label: "∧",  latex: "\\land" },
    { label: "∨",  latex: "\\lor" },
    { label: "⟹",  latex: "\\Rightarrow" },
    { label: "⟺",  latex: "\\Leftrightarrow" },
    { label: "⊕",  latex: "\\oplus" },
    { label: "⊤",  latex: "\\top" },
    { label: "⊥",  latex: "\\bot" },
  ],
  Matrix: [
    { label: "[  ]",   latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
    { label: "(  )",   latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
    { label: "|  |",   latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}" },
    { label: "3×3",    latex: "\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}" },
  ],
};

function MathKeyboardPopup({ onInsert, onClose }) {
  const mathRef = useRef(null);
  const [tab, setTab] = useState("Basic");

  useEffect(() => {
    const el = mathRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.mathVirtualKeyboardPolicy = "manual";
      el.focus?.();
      window.mathVirtualKeyboard?.show?.();
    }, 100);
    return () => {
      clearTimeout(t);
      window.mathVirtualKeyboard?.hide?.();
    };
  }, []);

  // Insert a symbol directly into the math-field
  const insertSymbol = (latex) => {
    const el = mathRef.current;
    if (!el) return;
    el.insert(latex);
    el.focus();
  };

  // Insert from the math-field into the textarea
  const handleInsert = () => {
    const el = mathRef.current;
    const latex = el?.value?.trim();
    if (!latex) { toast.error("Type a math expression first"); return; }
    onInsert(latex);
    el.value = "";
    el.focus();
  };

  return (
    <div className="math-popup-pro">
      <div className="math-popup-header">
        <span className="math-popup-title">Math Keyboard</span>
        <button className="math-popup-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Category tabs */}
      <div className="math-tabs">
        {Object.keys(MATH_TABS).map(t => (
          <button
            key={t}
            className={`math-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>

      {/* Symbol grid */}
      <div className="math-symbol-grid">
        {MATH_TABS[tab].map((s, i) => (
          <button
            key={i}
            className="math-symbol-btn"
            onClick={() => insertSymbol(s.latex)}
            title={s.latex}
          >{s.label}</button>
        ))}
      </div>

      {/* MathLive input field */}
      <math-field
        ref={mathRef}
        class="mathlive-field-pro"
        virtual-keyboard-mode="onfocus"
      />

      <div className="math-popup-footer">
        <span className="math-popup-hint">Edit in field above, then click Insert →</span>
        <button className="math-insert-btn" onClick={handleInsert}>Insert →</button>
      </div>
    </div>
  );
}

// ─── QuestionField ────────────────────────────────────────────────────────────
function QuestionField({ value, onChange, singleLine = false, placeholder = "Type here..." }) {
  const inputRef = useRef(null);
  const cursor   = useRef({ start: 0, end: 0 });
  const [showMath, setShowMath] = useState(false);

  const saveCursor = () => {
    const el = inputRef.current;
    if (el) cursor.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const insertText = (text) => {
    const { start, end } = cursor.current;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    const pos = start + text.length;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(pos, pos); }
      cursor.current = { start: pos, end: pos };
    });
  };

  const insertMath  = (latex) => { insertText(`$${latex}$`); setShowMath(false); };
  const insertImage = (token) => { insertText(token); };

  const commonProps = {
    ref: inputRef,
    className: "q-textarea",
    value,
    placeholder,
    onChange: e => onChange(e.target.value),
    onBlur: saveCursor, onMouseUp: saveCursor, onKeyUp: saveCursor,
  };

  return (
    <div className="qf-wrapper">
      <div className="qf-input-row">
        {singleLine
          ? <input {...commonProps} type="text" />
          : <textarea {...commonProps} rows={2} />
        }
        <div className="qf-btns">
          <button
            type="button"
            className={`math-toggle-btn${showMath ? " active" : ""}`}
            onClick={() => { saveCursor(); setShowMath(v => !v); }}
            title="Math keyboard"
          >
            <Keyboard size={16} />
          </button>
          <ImageUploadBtn onInsert={insertImage} />
        </div>
      </div>

      {showMath && (
        <MathKeyboardPopup
          onInsert={insertMath}
          onClose={() => setShowMath(false)}
        />
      )}
    </div>
  );
}

// ─── Empty factories ──────────────────────────────────────────────────────────
const emptyNormal = () => ({ type: "normal", question: "", answer: "", options: { A:"",B:"",C:"",D:"" }, correctOption: "" });
const emptyMCQ    = () => ({ type: "mcq",    question: "", answer: "", options: { A:"",B:"",C:"",D:"" }, correctOption: "" });

// ─── Main BuilderPage ─────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setName, setSetName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    questionAPI.getOne(id)
      .then(res => {
        setSetName(res.data.setName);
        setQuestions(res.data.questions.map(q => ({
          ...emptyNormal(), ...q,
          options: { A:"",B:"",C:"",D:"", ...q.options },
        })));
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const addQuestion = (type) => {
    setQuestions(p => [...p, type === "mcq" ? emptyMCQ() : emptyNormal()]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const removeQuestion = (i) => setQuestions(p => p.filter((_, idx) => idx !== i));

  const moveQuestion = (i, dir) => {
    const arr = [...questions];
    const n = i + dir;
    if (n < 0 || n >= arr.length) return;
    [arr[i], arr[n]] = [arr[n], arr[i]];
    setQuestions(arr);
  };

  const updateQ = (i, field, val) =>
    setQuestions(p => { const a = [...p]; a[i] = { ...a[i], [field]: val }; return a; });

  const updateOption = (i, key, val) =>
    setQuestions(p => { const a = [...p]; a[i] = { ...a[i], options: { ...a[i].options, [key]: val } }; return a; });

  const selectCorrect = (i, key) =>
    setQuestions(p => { const a = [...p]; a[i] = { ...a[i], correctOption: key, answer: a[i].options[key] }; return a; });

  const handleSave = async () => {
    if (!setName.trim())       return toast.error("Please enter a set name");
    if (!questions.length)      return toast.error("Add at least one question");
    const bad = questions.findIndex(q => !q.question.trim());
    if (bad !== -1) return toast.error(`Question ${bad + 1} is empty`);

    setSaving(true);
    try {
      if (id) {
        await questionAPI.update(id, { setName, questions });
        toast.success("Saved!");
      } else {
        const res = await questionAPI.create({ setName, questions });
        toast.success("Saved!");
        navigate(`/builder/${res.data._id}`);
      }
    } catch { toast.error("Save failed"); }
    finally  { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>;

  return (
    <div className="builder-page fade-in">
      {/* Top bar */}
      <div className="builder-topbar">
        <button className="back-btn" onClick={() => navigate("/")}><ArrowLeft size={18} /> Back</button>
      </div>

      {/* Set name */}
      <div className="set-name-field">
        <label>Question Set Name</label>
        <input
          type="text" className="set-name-input"
          placeholder="e.g. Chapter 5 – Biology MCQ"
          value={setName} onChange={e => setSetName(e.target.value)}
        />
      </div>

      {/* Questions */}
      <div className="questions-list">
        {questions.length === 0 && (
          <div className="no-questions"><p>No questions yet. Use the buttons below to add.</p></div>
        )}

        {questions.map((q, i) => (
          <div className={`question-card ${q.type}`} key={i}>
            <div className="question-card-header">
              <div className="q-number-badge">{i + 1}</div>
              <span className={`q-type-badge ${q.type}`}>{q.type === "mcq" ? "MCQ" : "Normal"}</span>
              <div className="q-header-actions">
                <button className="icon-btn" onClick={() => moveQuestion(i, -1)} disabled={i === 0} title="Move up"><ChevronUp size={15} /></button>
                <button className="icon-btn" onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} title="Move down"><ChevronDown size={15} /></button>
                <button className="icon-btn delete" onClick={() => removeQuestion(i)} title="Delete"><Trash2 size={15} /></button>
              </div>
            </div>

            {/* Question text */}
            <div className="field-group">
              <label>Question <span className="required">*</span></label>
              <QuestionField
                value={q.question}
                onChange={v => updateQ(i, "question", v)}
                placeholder="Type question. Use 🎹 for math, 🖼 for image."
              />
            </div>

            {/* Normal answer */}
            {q.type === "normal" && (
              <div className="field-group">
                <label>Answer <span className="optional">(optional)</span></label>
                <QuestionField
                  value={q.answer}
                  onChange={v => updateQ(i, "answer", v)}
                  placeholder="Type answer here..."
                />
              </div>
            )}

            {/* MCQ options */}
            {q.type === "mcq" && (
              <div className="mcq-options">
                <label>Options <span className="optional">– click circle to mark correct</span></label>
                <div className="options-grid">
                  {["A","B","C","D"].map(key => (
                    <div className={`option-row${q.correctOption === key ? " correct" : ""}`} key={key}>
                      <button
                        type="button"
                        className={`option-selector${q.correctOption === key ? " selected" : ""}`}
                        onClick={() => q.options[key] && selectCorrect(i, key)}
                      >
                        {q.correctOption === key ? <CheckCircle2 size={16} /> : <span className="option-key">{key}</span>}
                      </button>
                      <div className="option-content">
                        <QuestionField
                          value={q.options[key]}
                          onChange={v => updateOption(i, key, v)}
                          singleLine
                          placeholder={`Option ${key}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {q.correctOption
                  ? <div className="answer-preview">✓ Answer: <strong>{q.correctOption}.</strong> {q.options[q.correctOption]}</div>
                  : <p className="answer-hint">Click a circle to mark the correct answer (optional)</p>
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="add-question-bar">
        <span className="add-label">Add:</span>
        <button className="add-btn normal" onClick={() => addQuestion("normal")}><Plus size={15} /> Normal</button>
        <button className="add-btn mcq"    onClick={() => addQuestion("mcq")}><Plus size={15} /> MCQ</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          {id && (
            <button className="btn-outline" onClick={() => navigate(`/preview/${id}`)}>
              <Eye size={15} /> Preview
            </button>
          )}
          <button className="btn-primary gold" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? "Saving..." : "Save Set"}
          </button>
        </div>
      </div>
    </div>
  );
}