import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../utils/api';
import { PlusCircle, Eye, Pencil, Trash2, BookOpen, FileQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import './HomePage.css';
import axios from 'axios';

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/questions`);
      setSets(res.data);
    } catch (err) {
      toast.error('Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await questionAPI.delete(id);
      setSets(sets.filter(s => s._id !== id));
      toast.success('Question set deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Loading question sets...</p>
    </div>
  );

  return (
    <div className="home-page fade-in">
      <div className="home-header">
        <div>
          <h1 className="home-title">Question Sets</h1>
          <p className="home-subtitle">Build, manage, and preview your exam papers</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/builder')}>
          <PlusCircle size={18} /> New Set
        </button>
      </div>

      {sets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen size={48} /></div>
          <h2>No question sets yet</h2>
          <p>Start building your first question set or import from Excel</p>
          <div className="empty-actions">
            <button className="btn-primary" onClick={() => navigate('/builder')}>
              <PlusCircle size={16} /> Create Set
            </button>
            <button className="btn-outline" onClick={() => navigate('/import')}>
              Import from Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="sets-grid">
          {sets.map(set => {
            const mcqCount = set.questions.filter(q => q.type === 'mcq').length;
            const normalCount = set.questions.filter(q => q.type === 'normal').length;
            return (
              <div className="set-card fade-in" key={set._id}>
                <div className="set-card-header">
                  <div className="set-icon"><FileQuestion size={20} /></div>
                  <div className="set-meta-chips">
                    {mcqCount > 0 && <span className="chip chip-teal">{mcqCount} MCQ</span>}
                    {normalCount > 0 && <span className="chip chip-gold">{normalCount} Normal</span>}
                  </div>
                </div>
                <h3 className="set-name">{set.setName}</h3>
                <p className="set-count">{set.questions.length} question{set.questions.length !== 1 ? 's' : ''}</p>
                <p className="set-date">{new Date(set.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <div className="set-actions">
                  <button className="icon-btn preview" title="Preview" onClick={() => navigate(`/preview/${set._id}`)}>
                    <Eye size={16} />
                  </button>
                  <button className="icon-btn edit" title="Edit" onClick={() => navigate(`/builder/${set._id}`)}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(set._id, set.setName)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}