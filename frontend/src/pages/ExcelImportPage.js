import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { excelAPI, questionAPI } from '../utils/api';
import { Download, FileSpreadsheet, FileText, AlertCircle, Trash2, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import './ExcelImportPage.css';

export default function ExcelImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [setName, setSetName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState(''); // 'excel' | 'word'

  const handleDownloadExcel = async () => {
    try {
      await excelAPI.downloadTemplate();
      toast.success('Excel template downloaded!');
    } catch {
      toast.error('Failed to download template. Is the server running?');
    }
  };

  const handleDownloadWordGuide = async () => {
    try {
      await excelAPI.downloadWordTemplate();
      toast.success('Word format guide downloaded!');
    } catch {
      toast.error('Failed to download guide.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isExcel = file.name.match(/\.(xlsx|xls)$/i);
    const isWord  = file.name.match(/\.(docx|doc)$/i);

    if (!isExcel && !isWord) {
      toast.error('Please upload an Excel (.xlsx) or Word (.docx) file');
      return;
    }

    setFileName(file.name);
    setFileType(isWord ? 'word' : 'excel');
    setUploading(true);
    setParsedQuestions([]);
    setErrors([]);

    try {
      const res = await excelAPI.parseFile(file);
      setParsedQuestions(res.data.questions);
      setErrors(res.data.errors);
      if (res.data.questions.length > 0) {
        toast.success(`${res.data.questions.length} questions parsed successfully`);
      } else {
        toast.error('No questions found in the file');
      }
      if (res.data.errors.length > 0) {
        toast.error(`${res.data.errors.length} issue(s) detected`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to parse file';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeQuestion = (idx) => setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!setName.trim()) return toast.error('Please enter a set name');
    if (parsedQuestions.length === 0) return toast.error('No questions to save');
    setSaving(true);
    try {
      const res = await questionAPI.create({ setName, questions: parsedQuestions });
      toast.success('Question set saved!');
      navigate(`/preview/${res.data._id}`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="excel-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Import Questions</h1>
        <p className="page-subtitle">Upload an Excel or Word file to bulk-import your questions</p>
      </div>

      {/* Step 1 — Download templates */}
      <div className="step-card">
        <div className="step-number">1</div>
        <div className="step-content">
          <h2 className="step-title">Download a Template</h2>
          <p className="step-desc">Choose the format you prefer — Excel or Word.</p>

          <div className="template-grid">
            {/* Excel */}
            <div className="template-box">
              <div className="template-box-header excel">
                <FileSpreadsheet size={22} />
                <strong>Excel Template</strong>
              </div>
              <p className="template-box-desc">Fill a spreadsheet with columns for type, question, answer, and MCQ options. Both normal and MCQ rows can be mixed in one file.</p>
              <div className="template-cols">
                <code>type</code><code>question</code><code>answer</code>
                <code>option_a</code><code>option_b</code><code>option_c</code><code>option_d</code><code>correct_answer</code>
              </div>
              <button className="btn-download excel" onClick={handleDownloadExcel}>
                <Download size={15} /> Download .xlsx
              </button>
            </div>

            {/* Word */}
            <div className="template-box">
              <div className="template-box-header word">
                <FileText size={22} />
                <strong>Word Format Guide</strong>
              </div>
              <p className="template-box-desc">Write questions in a Word document using a simple structured format. Download the guide to see exactly how to write them.</p>
              <div className="word-format-preview">
                <div className="wfp-block">
                  <span className="wfp-tag normal-tag">Normal</span>
                  <pre>{`Q: Your question here\nA: Your answer here`}</pre>
                </div>
                <div className="wfp-block">
                  <span className="wfp-tag mcq-tag">MCQ</span>
                  <pre>{`Q: Your question here\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\nANS: B`}</pre>
                </div>
              </div>
              <button className="btn-download word" onClick={handleDownloadWordGuide}>
                <Download size={15} /> Download Format Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 — Upload */}
      <div className="step-card">
        <div className="step-number">2</div>
        <div className="step-content">
          <h2 className="step-title">Upload Your File</h2>
          <p className="step-desc">Upload your filled Excel or Word file. Both formats are detected automatically.</p>

          <div
            className="upload-zone"
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileChange({ target: { files: [file], value: '' } });
            }}
          >
            <input
              type="file"
              ref={fileRef}
              accept=".xlsx,.xls,.docx,.doc"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <div className="upload-uploading">
                <div className="loading-spinner" />
                <p>Parsing {fileType === 'word' ? 'Word document' : 'Excel file'}...</p>
              </div>
            ) : (
              <>
                <div className="upload-icons">
                  <FileSpreadsheet size={32} className="upload-icon-excel" />
                  <FileText size={32} className="upload-icon-word" />
                </div>
                <p className="upload-text">Click or drag & drop your file here</p>
                <p className="upload-sub">Supported: .xlsx, .xls, .docx, .doc</p>
                {fileName && (
                  <p className="upload-filename">
                    {fileType === 'word' ? '📝' : '📊'} {fileName}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="upload-note">
            <Info size={14} />
            <span>Word documents must follow the format shown in the guide above. Free-form text without <code>Q:</code> prefixes will not be parsed.</span>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="errors-card">
          <div className="errors-header">
            <AlertCircle size={18} /> <strong>{errors.length} Issue{errors.length > 1 ? 's' : ''} Found</strong>
          </div>
          <ul className="errors-list">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Step 3 — Review & Save */}
      {parsedQuestions.length > 0 && (
        <div className="step-card">
          <div className="step-number">3</div>
          <div className="step-content">
            <h2 className="step-title">Review & Save</h2>
            <p className="step-desc">
              {parsedQuestions.length} question{parsedQuestions.length !== 1 ? 's' : ''} parsed
              {fileType === 'word' ? ' from Word document' : ' from Excel file'}.
              Remove any you don't need, then save.
            </p>

            <div className="set-name-field" style={{ marginBottom: '1.5rem' }}>
              <label>Question Set Name</label>
              <input
                type="text"
                className="set-name-input"
                placeholder="e.g. Chapter 3 – Chemistry"
                value={setName}
                onChange={e => setSetName(e.target.value)}
              />
            </div>

            <div className="parsed-list">
              {parsedQuestions.map((q, idx) => (
                <div className={`parsed-card ${q.type}`} key={idx}>
                  <div className="parsed-header">
                    <span className="parsed-num">Q{idx + 1}</span>
                    <span className={`q-type-badge ${q.type}`}>{q.type === 'mcq' ? 'MCQ' : 'Normal'}</span>
                    <button className="icon-btn delete" onClick={() => removeQuestion(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="parsed-question">{q.question}</p>
                  {q.type === 'mcq' && (
                    <div className="parsed-options">
                      {['A', 'B', 'C', 'D'].map(k => q.options[k] && (
                        <span key={k} className={`parsed-option ${q.correctOption === k ? 'correct' : ''}`}>
                          ({k}) {q.options[k]} {q.correctOption === k && '✓'}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.type === 'normal' && q.answer && (
                    <p className="parsed-answer"><strong>Ans:</strong> {q.answer}</p>
                  )}




                </div>
              ))}
            </div>

            <button className="btn-primary gold save-btn" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : `Save ${parsedQuestions.length} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}