import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function PaymentForm({ mode, payment, onClose, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7), // Default to current YYYY-MM
    amount: '',
    method: 'Cash',
    status: 'Paid',
    transactionId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch students to populate the dropdown
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (payment) {
      setFormData({
        studentId: payment.studentId || '',
        studentName: payment.studentName || '',
        date: payment.date && payment.date !== '-' ? payment.date : new Date().toISOString().split('T')[0],
        month: payment.month || new Date().toISOString().slice(0, 7),
        amount: payment.amount || '',
        method: payment.method && payment.method !== '-' ? payment.method : 'Cash',
        status: 'Paid', // Pre-fill with Paid when opening from Pay Now
        transactionId: payment.transactionId || ''
      });
    } else {
      setFormData({
        studentId: '',
        studentName: '',
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7),
        amount: '',
        method: 'Cash',
        status: 'Paid',
        transactionId: ''
      });
    }
  }, [mode, payment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'studentId') {
      const selectedStudent = students.find(s => s.id === value);
      setFormData(prev => ({ 
        ...prev, 
        studentId: value,
        studentName: selectedStudent ? selectedStudent.name : '',
        amount: selectedStudent ? selectedStudent.fee : prev.amount
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError("Please select a student.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'add') {
        await addDoc(collection(db, 'payments'), formData);
      } else if (mode === 'edit' && payment?.id) {
        await updateDoc(doc(db, 'payments', payment.id), formData);
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError("Failed to save payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: 0 }}>
          {mode === 'add' ? 'Record Payment' : 'Edit Payment'}
        </h2>
        {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Student</label>
            <select 
              name="studentId" 
              value={formData.studentId} 
              onChange={handleChange} 
              required 
              style={inputStyle}
            >
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Month</label>
              <input 
                type="month" 
                name="month" 
                value={formData.month} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Amount</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Payment Method</label>
              <select 
                name="method" 
                value={formData.method} 
                onChange={handleChange} 
                style={inputStyle}
              >
                <option value="Cash">Cash</option>
                <option value="GPay">GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Transaction ID (Optional)</label>
              <input 
                type="text" 
                name="transactionId" 
                value={formData.transactionId} 
                onChange={handleChange} 
                style={inputStyle}
              />
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
              {loading ? 'Saving...' : 'Save Payment'}
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
