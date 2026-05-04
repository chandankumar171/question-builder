import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { questionAPI } from '../utils/api';
import { ArrowLeft, Printer, Eye, CheckSquare, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './PreviewPage.css';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// ─── Token parsers ─────────────────────────────────────────────────────────
// Token format written by BuilderPage: [IMG:publicId|||https://...]
// Older format (fallback):             [IMG:https://...]
function parseImgToken(tok) {
  const inner = tok.slice(5, -1); // strip [IMG: and ]
  if (inner.includes('|||')) {
    return inner.split('|||')[1]; // new format → get url after |||
  }
  // old format → inner IS the url
  return inner;
}

function renderContent(text) {
  if (!text) return null;
  // Split on image tokens and math tokens
  const parts = text.split(/(\[IMG:[^\]]+\]|\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('[IMG:')) {
      const url = parseImgToken(part);
      return (
        <img
          key={i}
          src={url}
          alt=""
          className="q-img"
          style={{ display:'block', maxWidth:'100%', maxHeight:'280px', objectFit:'contain', margin:'8px 0', borderRadius:'6px', border:'1px solid #e0e0e0' }}
        />
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.slice(1, -1)} />; }
      catch { return <code key={i}>{part}</code>; }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('questions');
  const printRef = useRef();

  useEffect(() => {
    // Use data passed from builder for instant load
    if (location.state?.data) {
      setSet(location.state.data);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await questionAPI.getOne(id);
        setSet(res.data);
      } catch {
        toast.error('Failed to load question set');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, location.state]);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html>
      <head>
        <title>${set?.setName || 'Question Paper'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" rel="stylesheet">
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'DM Sans',sans-serif;font-size:12pt;color:#1a1a2e;background:white;padding:40px 50px;max-width:800px;margin:0 auto}
          .paper-title{font-family:'Playfair Display',serif;font-size:20pt;font-weight:700;text-align:center}
          .paper-header{text-align:center;border-bottom:3px double #1a1a2e;padding-bottom:14px;margin-bottom:22px}
          .paper-meta{display:flex;justify-content:space-between;margin-top:10px;font-size:10pt;color:#555;flex-wrap:wrap;gap:4px}
          .question-block{margin-bottom:20px;page-break-inside:avoid}
          .question-row{display:flex;gap:10px}
          .q-num{font-weight:700;min-width:28px;flex-shrink:0;padding-top:1px}
          .q-body{flex:1;line-height:1.65}
          .q-img{display:block;max-width:100%;max-height:260px;object-fit:contain;margin:8px 0;border-radius:5px;border:1px solid #ddd}
          .options-list{margin-top:8px;display:flex;flex-direction:column;gap:4px}
          .option-item{display:flex;gap:8px;font-size:0.9rem}
          .option-label{font-weight:700;min-width:26px;color:#555;flex-shrink:0}
          .correct-tick{color:#27ae60;margin-left:5px;font-weight:700}
          .answer-block{margin-top:8px;padding:8px 12px;background:#f0faf5;border-left:3px solid #27ae60;border-radius:0 4px 4px 0;font-size:0.87rem}
          .answer-label{font-weight:700;color:#27ae60}
          .answer-line{border-bottom:1px solid #aaa;height:24px;margin-bottom:6px}
          @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.answer-block{background:#f0faf5!important}}
        </style>
      </head>
      <body>${content}</body>
    </html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>;
  if (!set) return <div className="error-screen"><p>Not found</p></div>;

  return (
    <div className="preview-page">
      {/* Top bar */}
      <div className="preview-topbar">
        <button className="back-btn" onClick={() => navigate('/')}><ArrowLeft size={18} /> Back</button>
        <div className="mode-tabs">
          <button className={`mode-tab ${mode === 'questions'    ? 'active' : ''}`} onClick={() => setMode('questions')}>
            <Eye size={15} /> Questions
          </button>
          <button className={`mode-tab ${mode === 'with-answers' ? 'active' : ''}`} onClick={() => setMode('with-answers')}>
            <CheckSquare size={15} /> With Answers
          </button>
          <button className={`mode-tab ${mode === 'answers-only' ? 'active' : ''}`} onClick={() => setMode('answers-only')}>
            <EyeOff size={15} /> Answer Key
          </button>
        </div>
        <button className="btn-primary" onClick={handlePrint}><Printer size={16} /> Print / PDF</button>
      </div>

      {/* Paper */}
      <div className="paper-wrapper">
        <div className="paper" ref={printRef}>
          <div className="paper-header">
            <div className="paper-title">{set.setName}</div>
            <div className="paper-meta">
              <span>Total Questions: {set.questions.length}</span>
              <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* All questions — simple sequential numbering, no sections */}
          {set.questions.map((q, i) => (
            <div key={i} className="question-block">
              <div className="question-row">
                <span className="q-num">{i + 1}.</span>
                <div className="q-body">

                  {/* Question text + images */}
                  {mode !== 'answers-only' && (
                    <div className="q-text">{renderContent(q.question)}</div>
                  )}

                  {/* MCQ options */}
                  {q.type === 'mcq' && mode !== 'answers-only' && (
                    <div className="options-list">
                      {['A','B','C','D'].map(k => {
                        if (!q.options?.[k]) return null;
                        const isCorrect = mode === 'with-answers' && q.correctOption === k;
                        return (
                          <div key={k} className={`option-item${isCorrect ? ' correct-option' : ''}`}>
                            <span className="option-label">({k})</span>
                            <span>
                              {renderContent(q.options[k])}
                              {isCorrect && <span className="correct-tick">✓</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MCQ answer */}
                  {q.type === 'mcq' && mode !== 'questions' && (
                    <div className="answer-block">
                      <span className="answer-label">Answer: </span>
                      {q.correctOption
                        ? <>({q.correctOption}) {renderContent(q.options?.[q.correctOption])}</>
                        : <span style={{color:'#bbb',fontStyle:'italic'}}>No answer selected</span>
                      }
                    </div>
                  )}

                  {/* Normal question answer / lines */}
                  {q.type === 'normal' && mode === 'with-answers' && (
                    <div className="answer-block">
                      <span className="answer-label">Answer: </span>
                      {renderContent(q.answer) || <span style={{color:'#bbb',fontStyle:'italic'}}>No answer provided</span>}
                    </div>
                  )}

                  {q.type === 'normal' && mode === 'answers-only' && (
                    <div className="answer-block">
                      <span className="answer-label">Q{i+1}: </span>
                      {renderContent(q.answer) || <span style={{color:'#bbb',fontStyle:'italic'}}>No answer</span>}
                    </div>
                  )}

                  {q.type === 'normal' && mode === 'questions' && (
                    <div className="answer-lines">
                      {[0,1,2,3].map(j => <div key={j} className="answer-line" />)}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}