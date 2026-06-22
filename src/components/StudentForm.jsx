import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function StudentForm({ mode, student, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    class: '',
    batch: '',
    status: 'Active',
    fee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        class: student.class || '',
        batch: student.batch || '',
        status: student.status || 'Active',
        fee: student.fee || ''
      });
    }
  }, [mode, student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'add') {
        await addDoc(collection(db, 'students'), formData);
      } else if (mode === 'edit' && student?.id) {
        await updateDoc(doc(db, 'students', student.id), formData);
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving student:", err);
      setError("Failed to save student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: 0 }}>
          {mode === 'add' ? 'Add New Student' : 'Edit Student'}
        </h2>
        {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Phone</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Class</label>
              <input 
                type="text" 
                name="class" 
                value={formData.class} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Batch</label>
              <input 
                type="text" 
                name="batch" 
                value={formData.batch} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Monthly Fee</label>
              <input 
                type="text" 
                name="fee" 
                value={formData.fee} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-text-muted)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-main)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};
