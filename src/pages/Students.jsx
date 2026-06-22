import { useState, useEffect, useRef } from 'react';
import { Plus, MagnifyingGlass, Funnel, Trash, PencilSimple, UploadSimple, DownloadSimple } from '@phosphor-icons/react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import StudentForm from '../components/StudentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Papa from 'papaparse';
import { downloadSampleCSV } from '../utils/csv';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    });

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (s.phone || '').includes(searchTerm)
  );

  const handleAdd = () => {
    setFormMode('add');
    setSelectedStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student) => {
    setFormMode('edit');
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedStudent) {
      try {
        await deleteDoc(doc(db, 'students', selectedStudent.id));
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
    setShowConfirm(false);
    setSelectedStudent(null);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let successCount = 0;

        for (const row of rows) {
          try {
            // Map CSV headers to our Firestore fields
            const newStudent = {
              name: row.Name || row.name || '',
              phone: row.Phone || row.phone || '',
              class: row.Class || row.class || '',
              batch: row.Batch || row.batch || '',
              fee: row['Monthly Fee'] || row.fee || row.Fee || '',
              status: row.Status || row.status || 'Active'
            };

            // Only add if at least a name is present
            if (newStudent.name) {
              await addDoc(collection(db, 'students'), newStudent);
              successCount++;
            }
          } catch (err) {
            console.error("Error adding student from CSV:", err);
          }
        }

        setIsImporting(false);
        // Reset file input so the same file can be uploaded again if needed
        event.target.value = null;
        alert(`Successfully imported ${successCount} students.`);
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
        setIsImporting(false);
        alert("Failed to parse the CSV file. Please check its format.");
      }
    });
  };

  return (
    <div className="students-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Student Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Manage all enrolled students</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn" onClick={downloadSampleCSV} style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DownloadSimple size={20} /> Sample CSV
          </button>
          
          <button 
            className="btn" 
            onClick={handleImportClick} 
            disabled={isImporting}
            style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UploadSimple size={20} /> {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Add New Student
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlass size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
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
            <Funnel size={20} /> Filter
          </button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '1rem 0' }}>Name</th>
                <th style={{ padding: '1rem 0' }}>Phone</th>
                <th style={{ padding: '1rem 0' }}>Class & Batch</th>
                <th style={{ padding: '1rem 0' }}>Monthly Fee</th>
                <th style={{ padding: '1rem 0' }}>Status</th>
                <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{student.name}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--color-text-muted)' }}>{student.phone}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <div>{student.class}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{student.batch}</div>
                    </td>
                    <td style={{ padding: '1rem 0' }}>{student.fee}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        background: student.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: student.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-muted)'
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(student)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-info)', marginRight: '0.75rem' }}
                      >
                        <PencilSimple size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(student)}
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
        <StudentForm 
          mode={formMode} 
          student={selectedStudent} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)}
        />
      )}

      {showConfirm && (
        <ConfirmDialog 
          title="Delete Student"
          message={`Are you sure you want to delete ${selectedStudent?.name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
