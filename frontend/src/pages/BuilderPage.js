// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { questionAPI } from '../utils/api';
// import { Plus, Trash2, ChevronUp, ChevronDown, Save, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react';
// import toast from 'react-hot-toast';
// import './BuilderPage.css';
// import 'mathlive';// for math input support
// import { Keyboard } from 'lucide-react'; // for math input support

// const emptyNormal = () => ({ type: 'normal', question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });
// const emptyMCQ = () => ({ type: 'mcq', question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });

// export default function BuilderPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [setName, setSetName] = useState('');
//   const [questions, setQuestions] = useState([]);
//   const [saving, setSaving] = useState(false);
//   const [loading, setLoading] = useState(!!id);
//   const [activeMathIndex, setActiveMathIndex] = useState(null);//added

//   useEffect(() => {
//     if (id) {
//       questionAPI.getOne(id).then(res => {
//         setSetName(res.data.setName);
//         setQuestions(res.data.questions);
//       }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
//     }
//   }, [id]);

//   const addQuestion = (type) => {
//     setQuestions([...questions, type === 'normal' ? emptyNormal() : emptyMCQ()]);
//     setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
//   };

//   const removeQuestion = (idx) => {
//     setQuestions(questions.filter((_, i) => i !== idx));
//   };

//   const moveQuestion = (idx, dir) => {
//     const arr = [...questions];
//     const newIdx = idx + dir;
//     if (newIdx < 0 || newIdx >= arr.length) return;
//     [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
//     setQuestions(arr);
//   };

//   const updateQuestion = (idx, field, value) => {
//     const arr = [...questions];
//     arr[idx] = { ...arr[idx], [field]: value };
//     setQuestions(arr);
//   };

//   const updateOption = (idx, key, value) => {
//     const arr = [...questions];
//     arr[idx] = { ...arr[idx], options: { ...arr[idx].options, [key]: value } };
//     setQuestions(arr);
//   };

//   const selectCorrectOption = (idx, key) => {
//     const arr = [...questions];
//     const answer = arr[idx].options[key];
//     arr[idx] = { ...arr[idx], correctOption: key, answer };
//     setQuestions(arr);
//   };

//   const handleSave = async () => {
//     if (!setName.trim()) return toast.error('Please enter a set name');
//     if (questions.length === 0) return toast.error('Add at least one question');
//     const invalid = questions.findIndex(q => !q.question.trim());
//     if (invalid !== -1) return toast.error(`Question ${invalid + 1} is empty`);

//     setSaving(true);
//     try {
//       if (id) {
//         await questionAPI.update(id, { setName, questions });
//         toast.success('Question set updated!');
//       } else {
//         const res = await questionAPI.create({ setName, questions });
//         toast.success('Question set saved!');
//         navigate(`/builder/${res.data._id}`);
//       }
//     } catch {
//       toast.error('Failed to save');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return (
//     <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>
//   );

//   return (
//     <div className="builder-page fade-in">
//       <div className="builder-topbar">
//         <button className="back-btn" onClick={() => navigate('/')}>
//           <ArrowLeft size={18} /> Back
//         </button>
//         <div className="builder-actions">
//           {id && (
//             <button className="btn-outline" onClick={() => navigate(`/preview/${id}`)}>
//               <Eye size={16} /> Preview
//             </button>
//           )}
//           <button className="btn-primary gold" onClick={handleSave} disabled={saving}>
//             <Save size={16} /> {saving ? 'Saving...' : 'Save Set'}
//           </button>
//         </div>
//       </div>

//       <div className="set-name-field">
//         <label>Question Set Name</label>
//         <input
//           type="text"
//           className="set-name-input"
//           placeholder="e.g. Chapter 5 – Biology MCQ"
//           value={setName}
//           onChange={e => setSetName(e.target.value)}
//         />
//       </div>

//       <div className="questions-list">
//         {questions.length === 0 && (
//           <div className="no-questions">
//             <p>No questions added yet. Use the buttons below to add questions.</p>
//           </div>
//         )}

//         {questions.map((q, idx) => (
//           <div className={`question-card slide-in ${q.type}`} key={idx}>
//             <div className="question-card-header">
//               <div className="q-number-badge">{idx + 1}</div>
//               <span className={`q-type-badge ${q.type}`}>{q.type === 'mcq' ? 'MCQ' : 'Normal'}</span>
//               <div className="q-header-actions">
//                 <button className="icon-btn" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Move up">
//                   <ChevronUp size={16} />
//                 </button>
//                 <button className="icon-btn" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Move down">
//                   <ChevronDown size={16} />
//                 </button>
//                 <button className="icon-btn delete" onClick={() => removeQuestion(idx)} title="Remove">
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//             </div>

//             <div className="field-group">
//               <label>Question <span className="required">*</span></label>
//               {/* <textarea
//                 className="q-textarea"
//                 placeholder="Enter your question here..."
//                 value={q.question}
//                 onChange={e => updateQuestion(idx, 'question', e.target.value)}
//                 rows={2}
//               /> */}
//               <div className="math-input-wrapper">
//   <div className="input-with-icon">
    
//     {activeMathIndex === idx ? (
//       <math-field
//         value={q.question}
//         onInput={(e) => updateQuestion(idx, 'question', e.target.value)}
//         class="mathlive-field"
//       />
//     ) : (
//       <textarea
//         className="q-textarea"
//         placeholder="Enter your question here..."
//         value={q.question}
//         onChange={e => updateQuestion(idx, 'question', e.target.value)}
//         rows={2}
//       />
//     )}

//     <button
//       type="button"
//       className="math-toggle-btn"
//       onClick={() =>
//         setActiveMathIndex(activeMathIndex === idx ? null : idx)
//       }
//       title="Use Math Keyboard"
//     >
//       <Keyboard size={18} />
//     </button>

//   </div>
// </div>
//             </div>


//             {q.type === 'normal' && (
//               <div className="field-group">
//                 <label>Answer <span className="optional">(optional)</span></label>
//                 <textarea
//                   className="q-textarea"
//                   placeholder="Enter the answer..."
//                   value={q.answer}
//                   onChange={e => updateQuestion(idx, 'answer', e.target.value)}
//                   rows={2}
//                 />
//               </div>
//             )}

//             {q.type === 'mcq' && (
//               <div className="mcq-options">
//                 <label>Options <span className="optional">– click correct option to mark answer</span></label>
//                 <div className="options-grid">
//                   {['A', 'B', 'C', 'D'].map(key => (
//                     <div className={`option-row ${q.correctOption === key ? 'correct' : ''}`} key={key}>
//                       <button
//                         className={`option-selector ${q.correctOption === key ? 'selected' : ''}`}
//                         onClick={() => q.options[key] && selectCorrectOption(idx, key)}
//                         title="Mark as correct"
//                         type="button"
//                       >
//                         {q.correctOption === key ? <CheckCircle2 size={18} /> : <span className="option-key">{key}</span>}
//                       </button>
//                       <input
//                         type="text"
//                         className="option-input"
//                         placeholder={`Option ${key}`}
//                         value={q.options[key]}
//                         onChange={e => updateOption(idx, key, e.target.value)}
//                       />
//                     </div>
//                   ))}
//                 </div>
//                 {q.correctOption && (
//                   <div className="answer-preview">
//                     ✓ Answer: <strong>{q.correctOption}. {q.options[q.correctOption]}</strong>
//                   </div>
//                 )}
//                 {!q.correctOption && (
//                   <p className="answer-hint">Click an option label to mark the correct answer (optional)</p>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <div className="add-question-bar">
//         <span className="add-label">Add Question:</span>
//         <button className="add-btn normal" onClick={() => addQuestion('normal')}>
//           <Plus size={16} /> Normal Question
//         </button>
//         <button className="add-btn mcq" onClick={() => addQuestion('mcq')}>
//           <Plus size={16} /> MCQ Question
//         </button>
//       </div>
//     </div>
//   );
// }










import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI } from '../utils/api';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Eye, ArrowLeft, CheckCircle2, Keyboard } from 'lucide-react';
import toast from 'react-hot-toast';
import './BuilderPage.css';
import 'mathlive';

const emptyNormal = () => ({ type: 'normal', question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });
const emptyMCQ   = () => ({ type: 'mcq',    question: '', answer: '', options: { A:'', B:'', C:'', D:'' }, correctOption: '' });

// ── MathField wrapper ────────────────────────────────────────────────────────
// Renders the <math-field> web component properly in React.
// Uses a ref + addEventListener so the value is never mangled by React's
// synthetic event system, and the field is never unmounted (avoiding the
// "space-eating / katex contamination" problem).
function MathInput({ value, onChange, visible }) {
  const ref = useRef(null);

  // Sync incoming value → math-field (only when it actually changes)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.value !== value) el.value = value;
  }, [value]);

  // Listen for changes from the math-field → call onChange once
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onChange(el.value);
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [onChange]);

  return (
    <math-field
      ref={ref}
      class={`mathlive-field${visible ? '' : ' mathlive-hidden'}`}
    />
  );
}

// ── Question field with toggle ───────────────────────────────────────────────
function QuestionField({ value, onChange }) {
  const [mathMode, setMathMode] = useState(false);

  return (
    <div className="math-input-wrapper">
      {/* <div className="input-with-icon"> */}

        {/* Normal textarea — hidden (not unmounted) when math mode is on */}
        <textarea
          className={`q-textarea${mathMode ? ' field-hidden' : ''}`}
          placeholder="Enter your question here..."
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
        />

        {/* Math field — always in DOM, shown/hidden via CSS */}
        <MathInput
          value={value}
          onChange={onChange}
          visible={mathMode}
        />

        <button
          type="button"
          className={`math-toggle-btn${mathMode ? ' active' : ''}`}
          onClick={() => setMathMode(m => !m)}
          title={mathMode ? 'Switch to plain text' : 'Use Math Keyboard'}
        >
          <Keyboard size={18} />
        </button>
      </div>
    // </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setName, setSetName]   = useState('');
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(!!id);

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

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
  };

  const updateOption = (idx, key, value) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], options: { ...arr[idx].options, [key]: value } };
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
          {/* <button className="btn-primary gold" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Set'}
          </button> */}
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
              {/* Each question gets its own QuestionField with its own mathMode state */}
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