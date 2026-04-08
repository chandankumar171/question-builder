import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI } from '../utils/api';
import { ArrowLeft, Printer, Eye, EyeOff, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import './PreviewPage.css';
// import { BlockMath } from 'react-katex';
import { InlineMath } from 'react-katex';

export default function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('questions'); // 'questions' | 'with-answers' | 'answers-only'
  const printRef = useRef();

  useEffect(() => {
    questionAPI.getOne(id)
      .then(res => setSet(res.data))
      .catch(() => toast.error('Failed to load question set'))
      .finally(() => setLoading(false));
  }, [id]);
 
  // Helper to render text with inline math
//   function renderTextWithMath(text) {
//   const parts = text.split(/(\$.*?\$)/g);

//   return parts.map((part, i) => {
//     if (part.startsWith('$') && part.endsWith('$')) {
//       return <InlineMath key={i} math={part.slice(1, -1)} />;
//     }
//     return <span key={i}>{part}</span>;
//   });
// }

function renderTextWithMath(text) {
  if (!text) return null;

  // Split by $...$ OR LaTeX commands
  const parts = text.split(/(\$.*?\$|\\[a-zA-Z]+(?:\{.*?\})*)/g);

  return parts.map((part, i) => {
    if (!part) return null;

    // Case 1: $...$
    if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={i} math={part.slice(1, -1)} />;
    }

    // Case 2: LaTeX commands from MathLive
    if (part.startsWith('\\')) {
      return <InlineMath key={i} math={part} />;
    }

    // Case 3: Normal text (preserve spaces)
    return <span key={i}>{part}</span>;
  });
}




  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${set?.setName || 'Question Paper'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'DM Sans', sans-serif;
              font-size: 12pt;
              color: #1a1a2e;
              background: white;
            }
            .paper { padding: 40px 50px; max-width: 800px; margin: 0 auto; }
            .paper-header { text-align: center; border-bottom: 3px double #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
            .paper-title { font-family: 'Playfair Display', serif; font-size: 20pt; font-weight: 700; }
            .paper-subtitle { font-size: 10pt; color: #666; margin-top: 4px; }
            .paper-meta { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10pt; }
            .question-block { margin-bottom: 20px; page-break-inside: avoid; }
            .question-row { display: flex; gap: 10px; }
            .q-num { font-weight: 700; min-width: 30px; }
            .q-text { flex: 1; line-height: 1.6; }
            .options-list { margin: 8px 0 0 40px; }
            .option-item { display: flex; gap: 8px; margin-bottom: 4px; }
            .option-label { font-weight: 600; min-width: 20px; }
            .answer-block { margin: 6px 0 0 40px; padding: 8px 12px; background: #f0faf5; border-left: 3px solid #27ae60; }
            .answer-label { font-weight: 700; color: #27ae60; }
            .answer-lines { margin: 10px 0 0 40px; }
            .answer-line { border-bottom: 1px solid #ccc; height: 20px; margin-bottom: 6px; }
            .answers-section-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  if (loading) return <div className="loading-screen"><p>Loading preview...</p></div>;
  if (!set) return <div className="error-screen"><p>Question set not found.</p></div>;

  const totalQ = set.questions.length;

  return (
    <div className="preview-page fade-in">
      
      {/* Top Controls */}
      {/* <div className="preview-topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="mode-tabs">
          <button onClick={() => setMode('questions')}>
            <Eye size={15} /> Questions
          </button>
          <button onClick={() => setMode('with-answers')}>
            <CheckSquare size={15} /> With Answers
          </button>
          <button onClick={() => setMode('answers-only')}>
            <EyeOff size={15} /> Answer Key
          </button>
        </div>

        <button onClick={handlePrint}>
          <Printer size={16} /> Print
        </button>
      </div> */}

      <div className="preview-topbar">
  <button className="back-btn" onClick={() => navigate('/')}>
    <ArrowLeft size={18} /> Back
  </button>

  <div className="mode-tabs">
    <button
      className={`mode-tab ${mode === 'questions' ? 'active' : ''}`}
      onClick={() => setMode('questions')}
    >
      <Eye size={15} /> Questions Only
    </button>

    <button
      className={`mode-tab ${mode === 'with-answers' ? 'active' : ''}`}
      onClick={() => setMode('with-answers')}
    >
      <CheckSquare size={15} /> With Answers
    </button>

    {/* <button
      className={`mode-tab ${mode === 'answers-only' ? 'active' : ''}`}
      onClick={() => setMode('answers-only')}
    >
      <EyeOff size={15} /> Answer Key
    </button> */}
  </div>

  <button className="btn-primary" onClick={handlePrint}>
    <Printer size={16} /> Print / PDF
  </button>
</div>

      {/* Paper */}
      <div className="paper" ref={printRef}>
        
        {/* Header */}
        <div className="paper-header">
          <div className="paper-title">{set.setName}</div>
          <div className="paper-subtitle">Question Paper</div>
          <div className="paper-meta">
            <span>Total Questions: {totalQ}</span>
            <span>
              Date: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Answer Key Mode */}
        {mode === 'answers-only' ? (
          <div>
            <div className="answers-section-title">Answer Key</div>

            {set.questions.map((q, idx) => (
              <div key={idx} className="question-block">
                <div className="question-row">
                  <span className="q-num">{idx + 1}.</span>

                  <div>
                    <div>{q.question}</div>

                    {(q.answer || q.correctOption) ? (
                      <div className="answer-block">
                        <span className="answer-label">Answer: </span>
                        {q.type === 'mcq'
                          ? `(${q.correctOption}) ${q.options?.[q.correctOption] || ''}`
                          : q.answer}
                      </div>
                    ) : (
                      <div>No answer provided</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (

          /* Questions Mode */
          <div>
            {set.questions.map((q, idx) => (
              <div className="question-block" key={idx}>
                <div className="question-row">
                  <span className="q-num">{idx + 1}.</span>

                  <div className="q-body">
                    {/* <div className="q-text">{q.question}</div> */}
                    {/* <div className="q-text">
  <InlineMath math={q.question} />
</div> */}
                    <div className="q-text">
  {renderTextWithMath(q.question)}
</div>

                    {/* MCQ */}
                    {q.type === 'mcq' && (
                      <>
                        <div className="options-list">
                          {['A', 'B', 'C', 'D'].map(key => (
                            q.options?.[key] && (
                              <div key={key} className="option-item">
                                <span className="option-label">({key})</span>
                                {/* <span>{q.options[key]}</span> */}
                                  <span>{renderTextWithMath(q.options[key])}</span>

                                {mode === 'with-answers' && q.correctOption === key && (
                                  <span> ✓</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>

                        {mode === 'with-answers' && q.correctOption && (
                          <div className="answer-block">
                            <span className="answer-label">Ans: </span>
                            {/* ({q.correctOption}) {q.options?.[q.correctOption]} */}
                            ({q.correctOption}) {renderTextWithMath(q.options?.[q.correctOption])}
                          </div>
                        )}
                      </>
                    )}

                    {/* NORMAL */}
                    {q.type === 'normal' && (
                      <>
                        {mode === 'with-answers' && q.answer && (
                          <div className="answer-block">
                            <span className="answer-label">Ans: </span>
                            {q.answer}
                            
                          </div>
                        )}

                        {mode === 'questions' && (
                          <div className="answer-lines">
                            <div className="answer-line" />
                            <div className="answer-line" />
                            <div className="answer-line" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}