import { useState, useEffect } from 'react';
import { Plus, Receipt, Funnel, MagnifyingGlass, CurrencyInr, PencilSimple, Trash, Wallet } from '@phosphor-icons/react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import PaymentForm from '../components/PaymentForm';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default selected month to current month in YYYY-MM format
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Fetch payments
    const paymentsQuery = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
    });

    // Fetch students
    const studentsQuery = query(collection(db, 'students'), orderBy('name'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    });

    return () => {
      unsubscribePayments();
      unsubscribeStudents();
    };
  }, []);

  // Derive table data for the selected month
  const tableData = students.map(student => {
    // Find if this student has a payment for the selected month
    const paymentRecord = payments.find(p => p.studentId === student.id && p.month === selectedMonth);

    if (paymentRecord) {
      return {
        ...paymentRecord,
        isPending: false,
        studentClass: student.class // for display if needed
      };
    } else {
      return {
        id: `pending-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        month: selectedMonth,
        date: '-',
        amount: student.fee || 0,
        method: '-',
        status: 'Pending',
        transactionId: '',
        isPending: true,
        studentClass: student.class
      };
    }
  });

  const filteredData = tableData.filter(item => 
    (item.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (item.transactionId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormMode('add');
    setSelectedPayment(null);
    setShowForm(true);
  };

  const handlePayNow = (pendingRecord) => {
    setFormMode('add'); // We are adding a new payment record
    setSelectedPayment(pendingRecord); // Pass the pending record as initial data
    setShowForm(true);
  };

  const handleEdit = (payment) => {
    setFormMode('edit');
    setSelectedPayment(payment);
    setShowForm(true);
  };

  const handleDeleteClick = (payment) => {
    setSelectedPayment(payment);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedPayment && !selectedPayment.isPending) {
      try {
        await deleteDoc(doc(db, 'payments', selectedPayment.id));
      } catch (err) {
        console.error("Error deleting payment:", err);
      }
    }
    setShowConfirm(false);
    setSelectedPayment(null);
  };

  const totalCollected = tableData
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPending = tableData
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="payments-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Fee Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Track and record student payments for {formatMonthDisplay(selectedMonth)}</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} /> Record Payment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '50%' }}>
            <CurrencyInr size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Collected</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>₹{totalCollected.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: '50%' }}>
            <CurrencyInr size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Pending Fees</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>₹{totalPending.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)', borderRadius: '50%' }}>
            <Receipt size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Paid Students</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{tableData.filter(p => p.status === 'Paid').length} / {students.length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlass size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by student name or transaction ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Select Month:</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '1rem 0' }}>Student Name</th>
                <th style={{ padding: '1rem 0' }}>Date Paid</th>
                <th style={{ padding: '1rem 0' }}>Amount</th>
                <th style={{ padding: '1rem 0' }}>Method</th>
                <th style={{ padding: '1rem 0' }}>Status</th>
                <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No records found for the selected month.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>
                      {item.studentName}
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatMonthDisplay(item.month)}</div>
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--color-text-muted)' }}>{item.date}</td>
                    <td style={{ padding: '1rem 0', fontWeight: '600' }}>₹{item.amount}</td>
                    <td style={{ padding: '1rem 0' }}>
                      {item.method !== '-' && (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: '0.75rem', 
                          background: item.method === 'GPay' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                          color: item.method === 'GPay' ? 'var(--color-secondary)' : '#8B5CF6'
                        }}>
                          {item.method}
                        </span>
                      )}
                      {item.method === '-' && <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                      {item.transactionId && item.transactionId !== '-' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{item.transactionId}</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                       <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        background: item.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.status === 'Paid' ? 'var(--color-success)' : 'var(--color-error)'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                      {item.isPending ? (
                        <button 
                          onClick={() => handlePayNow(item)}
                          className="btn"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                        >
                          <Wallet size={16} style={{ marginRight: '0.25rem' }} /> Pay Now
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(item)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-info)' }}
                            title="Edit Payment"
                          >
                            <PencilSimple size={20} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(item)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                            title="Delete Payment"
                          >
                            <Trash size={20} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PaymentForm 
          mode={formMode} 
          payment={selectedPayment} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)}
        />
      )}

      {showConfirm && (
        <ConfirmDialog 
          title="Delete Payment"
          message={`Are you sure you want to delete this payment for ${selectedPayment?.studentName}?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
