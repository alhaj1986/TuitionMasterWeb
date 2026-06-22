import { useState, useEffect } from 'react';
import { Plus, MagnifyingGlass, Funnel, Trash, PencilSimple } from '@phosphor-icons/react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import AttendanceForm from '../components/AttendanceForm';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(recordsData);
    });

    return () => unsubscribe();
  }, []);

  const filteredAttendance = attendanceRecords.filter(a => 
    (a.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormMode('add');
    setSelectedRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record) => {
    setFormMode('edit');
    setSelectedRecord(record);
    setShowForm(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedRecord) {
      try {
        await deleteDoc(doc(db, 'attendance', selectedRecord.id));
      } catch (err) {
        console.error("Error deleting attendance record:", err);
      }
    }
    setShowConfirm(false);
    setSelectedRecord(null);
  };

  return (
    <div className="attendance-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Attendance Tracking</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Mark and view daily student attendance</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} /> Mark Attendance
        </button>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlass size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by student name..." 
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
          <button className="btn" style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}>
            <Funnel size={20} /> Filter Date
          </button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '1rem 0' }}>Student Name</th>
                <th style={{ padding: '1rem 0' }}>Date</th>
                <th style={{ padding: '1rem 0' }}>Status</th>
                <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{record.studentName}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--color-text-muted)' }}>{record.date}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        background: record.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 
                                    record.status === 'Late' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: record.status === 'Present' ? 'var(--color-success)' : 
                               record.status === 'Late' ? 'var(--color-warning)' : 'var(--color-error)'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(record)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-info)', marginRight: '0.75rem' }}
                      >
                        <PencilSimple size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(record)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                      >
                        <Trash size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <AttendanceForm 
          mode={formMode} 
          attendance={selectedRecord} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)}
        />
      )}

      {showConfirm && (
        <ConfirmDialog 
          title="Delete Attendance Record"
          message={`Are you sure you want to delete this attendance record for ${selectedRecord?.studentName}?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
