import { useState, useEffect } from 'react';
import { Users, Wallet, CalendarCheck, DownloadSimple } from '@phosphor-icons/react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

// Utility to trigger CSV download
const downloadCSV = (data, filename) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Reports() {
  // ----- Global data needed for cross‑referencing -----
  const [studentsMap, setStudentsMap] = useState({}); // id -> student data
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    // Load all students once – needed for class / batch lists and for attendance/payments joins
    const loadStudents = async () => {
      const snapshot = await getDocs(collection(db, 'students'));
      const map = {};
      const classSet = new Set();
      const batchSet = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        map[doc.id] = data;
        if (data.class) classSet.add(data.class);
        if (data.batch) batchSet.add(data.batch);
      });
      setStudentsMap(map);
      setClasses(Array.from(classSet).sort());
      setBatches(Array.from(batchSet).sort());
    };
    loadStudents();
  }, []);

  // ----- Loading state -----
  const [loading, setLoading] = useState(null); // 'students' | 'attendance' | 'payments' | null

  // ----- Filter states -----
  const [studentsFilter, setStudentsFilter] = useState({ class: '', batch: '', startDate: '', endDate: '' });
  const [attendanceFilter, setAttendanceFilter] = useState({ class: '', batch: '', status: '', startDate: '', endDate: '' });
  const [paymentsFilter, setPaymentsFilter] = useState({ class: '', batch: '', method: '', startDate: '', endDate: '' });

  // ----- Export handlers -----
  const exportStudents = async () => {
    setLoading('students');
    try {
      const constraints = [];
      if (studentsFilter.class) constraints.push(where('class', '==', studentsFilter.class));
      if (studentsFilter.batch) constraints.push(where('batch', '==', studentsFilter.batch));
      if (studentsFilter.startDate) constraints.push(where('joiningDate', '>=', studentsFilter.startDate));
      if (studentsFilter.endDate) constraints.push(where('joiningDate', '<=', studentsFilter.endDate));
      const q = constraints.length ? query(collection(db, 'students'), ...constraints, orderBy('name')) : query(collection(db, 'students'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const s = doc.data();
        return {
          "Student Name": s.name || '',
          "Joining Date": s.joiningDate || '-',
          "Class": s.class || '-',
          "Batch": s.batch || '-',
          "Contact Number": s.phone || '-'
        };
      });
      downloadCSV(data, 'students_report.csv');
    } catch (e) {
      console.error(e);
      alert('Failed to export students report');
    } finally { setLoading(null); }
  };

  const exportAttendance = async () => {
    setLoading('attendance');
    try {
      // First fetch attendance within date range (if any)
      const constraints = [];
      if (attendanceFilter.startDate) constraints.push(where('date', '>=', attendanceFilter.startDate));
      if (attendanceFilter.endDate) constraints.push(where('date', '<=', attendanceFilter.endDate));
      const q = constraints.length ? query(collection(db, 'attendance'), ...constraints, orderBy('date', 'desc')) : query(collection(db, 'attendance'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Enrich with student info & apply client‑side filters for class/batch/status
      const data = raw
        .map(rec => {
          const stu = studentsMap[rec.studentId] || {};
          return {
            "Student Name": rec.studentName || stu.name || '-',
            "Class": stu.class || '-',
            "Batch": stu.batch || '-',
            "Attendance Status": rec.status || '-',
            "Date": rec.date || '-'
          };
        })
        .filter(row => {
          if (attendanceFilter.class && row.Class !== attendanceFilter.class) return false;
          if (attendanceFilter.batch && row.Batch !== attendanceFilter.batch) return false;
          if (attendanceFilter.status && row["Attendance Status"] !== attendanceFilter.status) return false;
          return true;
        });
      downloadCSV(data, 'attendance_report.csv');
    } catch (e) {
      console.error(e);
      alert('Failed to export attendance report');
    } finally { setLoading(null); }
  };

  const exportPayments = async () => {
    setLoading('payments');
    try {
      const constraints = [];
      if (paymentsFilter.startDate) constraints.push(where('date', '>=', paymentsFilter.startDate));
      if (paymentsFilter.endDate) constraints.push(where('date', '<=', paymentsFilter.endDate));
      if (paymentsFilter.method) constraints.push(where('method', '==', paymentsFilter.method));
      const q = constraints.length ? query(collection(db, 'payments'), ...constraints, orderBy('date', 'desc')) : query(collection(db, 'payments'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const data = raw
        .map(pay => {
          const stu = studentsMap[pay.studentId] || {};
          return {
            "Student Name": pay.studentName || stu.name || '-',
            "Class": stu.class || '-',
            "Batch": stu.batch || '-',
            "Contact Number": stu.phone || '-',
            "Payment Date": pay.date || '-',
            "Month of Payment": pay.month || '-',
            "Mode of Payment": pay.method || '-',
            "Amount": pay.amount || '-',
            "Status": pay.status || '-'
          };
        })
        .filter(row => {
          if (paymentsFilter.class && row.Class !== paymentsFilter.class) return false;
          if (paymentsFilter.batch && row.Batch !== paymentsFilter.batch) return false;
          return true;
        });
      downloadCSV(data, 'payments_report.csv');
    } catch (e) {
      console.error(e);
      alert('Failed to export payments report');
    } finally { setLoading(null); }
  };

  // ----- Helper UI -----
  const renderSelect = (label, value, onChange, options, placeholder = 'All') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)', fontSize: '0.85rem' }}>
        <option value="">{placeholder}</option>
        {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  );

  const renderDateInput = (label, value, onChange) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)', fontSize: '0.85rem' }} />
    </div>
  );

  // ----- Render -----
  return (
    <div className="reports-container" style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Custom Data Reports</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Apply filters below and export the matching records as CSV.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* ----- Students Card ----- */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.6rem', borderRadius: '50%' }}><Users size={28} weight="duotone" color="var(--color-primary)" /></div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Students Report</h3>
          </div>
          {/* Filters */}
          {renderSelect('Class', studentsFilter.class, v => setStudentsFilter(f => ({ ...f, class: v })), classes)}
          {renderSelect('Batch', studentsFilter.batch, v => setStudentsFilter(f => ({ ...f, batch: v })), batches)}
          {renderDateInput('Joining Date From', studentsFilter.startDate, v => setStudentsFilter(f => ({ ...f, startDate: v })))}
          {renderDateInput('Joining Date To', studentsFilter.endDate, v => setStudentsFilter(f => ({ ...f, endDate: v })))}
          <button className="btn btn-primary" onClick={exportStudents} disabled={loading === 'students'} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DownloadSimple size={16} />{loading === 'students' ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* ----- Attendance Card ----- */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '0.6rem', borderRadius: '50%' }}><CalendarCheck size={28} weight="duotone" color="var(--color-secondary)" /></div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Attendance Report</h3>
          </div>
          {renderSelect('Class', attendanceFilter.class, v => setAttendanceFilter(f => ({ ...f, class: v })), classes)}
          {renderSelect('Batch', attendanceFilter.batch, v => setAttendanceFilter(f => ({ ...f, batch: v })), batches)}
          {renderSelect('Status', attendanceFilter.status, v => setAttendanceFilter(f => ({ ...f, status: v })), ['Present', 'Absent', 'Late'])}
          {renderDateInput('Date From', attendanceFilter.startDate, v => setAttendanceFilter(f => ({ ...f, startDate: v })))}
          {renderDateInput('Date To', attendanceFilter.endDate, v => setAttendanceFilter(f => ({ ...f, endDate: v })))}
          <button className="btn btn-primary" onClick={exportAttendance} disabled={loading === 'attendance'} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-secondary)', boxShadow: '0 4px 14px 0 rgba(6, 182, 212, 0.39)' }}>
            <DownloadSimple size={16} />{loading === 'attendance' ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* ----- Payments Card ----- */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '50%' }}><Wallet size={28} weight="duotone" color="var(--color-success)" /></div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Payments Report</h3>
          </div>
          {renderSelect('Class', paymentsFilter.class, v => setPaymentsFilter(f => ({ ...f, class: v })), classes)}
          {renderSelect('Batch', paymentsFilter.batch, v => setPaymentsFilter(f => ({ ...f, batch: v })), batches)}
          {renderSelect('Method', paymentsFilter.method, v => setPaymentsFilter(f => ({ ...f, method: v })), ['Cash', 'GPay', 'Bank Transfer', 'Other'])}
          {renderDateInput('Payment Date From', paymentsFilter.startDate, v => setPaymentsFilter(f => ({ ...f, startDate: v })))}
          {renderDateInput('Payment Date To', paymentsFilter.endDate, v => setPaymentsFilter(f => ({ ...f, endDate: v })))}
          <button className="btn btn-primary" onClick={exportPayments} disabled={loading === 'payments'} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}>
            <DownloadSimple size={16} />{loading === 'payments' ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
