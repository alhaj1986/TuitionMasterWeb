import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, Wallet, Student, ArrowUpRight, ArrowDownRight, CurrencyInr, DownloadSimple, UserCheck } from '@phosphor-icons/react';
import { downloadSampleCSV } from '../utils/csv';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const studentsUnsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const paymentsQ = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const paymentsUnsub = onSnapshot(paymentsQ, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const attendanceUnsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      studentsUnsub();
      paymentsUnsub();
      attendanceUnsub();
    };
  }, []);

  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const currentMonth = todayDate.toISOString().slice(0, 7);

  const totalStudentsCount = students.length;

  const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.status === 'Paid');
  const monthlyCollection = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  let pendingFees = 0;
  students.forEach(student => {
    const hasPaid = payments.some(p => p.studentId === student.id && p.month === currentMonth && p.status === 'Paid');
    if (!hasPaid && student.status === 'Active') {
      pendingFees += Number(student.fee || 0);
    }
  });

  const todaysAttendance = attendance.filter(a => a.date === today);
  const presentCount = todaysAttendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = todaysAttendance.length > 0 
    ? Math.round((presentCount / todaysAttendance.length) * 100) 
    : 0;

  const revenueMap = {};
  payments.forEach(p => {
    if (p.status === 'Paid' && p.month) {
      revenueMap[p.month] = (revenueMap[p.month] || 0) + Number(p.amount || 0);
    }
  });
  
  const revenueData = Object.keys(revenueMap).sort().map(monthStr => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    const name = date.toLocaleString('default', { month: 'short' });
    return { name, amount: revenueMap[monthStr], fullDate: monthStr };
  }).slice(-6);

  const methodsMap = {};
  currentMonthPayments.forEach(p => {
    const method = p.method || 'Cash';
    methodsMap[method] = (methodsMap[method] || 0) + Number(p.amount || 0);
  });
  const collectionMethods = Object.keys(methodsMap).map(method => ({
    name: method, amount: methodsMap[method]
  }));

  const recentPayments = payments.slice(0, 4); // Show 4 instead of 5 to save vertical space

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.5rem' }}>Dashboard Overview</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Welcome back to TuitionMaster</p>
        </div>
        <button className="btn" onClick={downloadSampleCSV} style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <DownloadSimple size={16} /> Download Sample CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <SummaryCard 
          title="Total Students" 
          value={totalStudentsCount.toString()} 
          trend="Active Roster" 
          positive={true}
          icon={<Users size={20} weight="duotone" color="var(--color-primary)" />} 
        />
        <SummaryCard 
          title="Monthly Collection" 
          value={`₹${monthlyCollection.toLocaleString()}`} 
          trend="This Month" 
          positive={true}
          icon={<Wallet size={20} weight="duotone" color="var(--color-success)" />} 
        />
        <SummaryCard 
          title="Pending Fees" 
          value={`₹${pendingFees.toLocaleString()}`} 
          trend="Expected" 
          positive={false}
          icon={<CurrencyInr size={20} weight="duotone" color="var(--color-warning)" />} 
        />
        <SummaryCard 
          title="Today's Attendance" 
          value={`${attendancePercentage}%`} 
          trend={`${presentCount} Present Today`} 
          positive={attendancePercentage >= 80}
          icon={<UserCheck size={20} weight="duotone" color={attendancePercentage >= 80 ? "var(--color-success)" : "var(--color-error)"} />} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Monthly Revenue Growth</h3>
          <div style={{ height: '220px' }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{fontSize: 12}} />
                  <YAxis stroke="var(--color-text-muted)" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }} 
                    itemStyle={{ color: 'var(--color-primary)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No revenue data available yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Collection Methods</h3>
          <div style={{ height: '220px' }}>
            {collectionMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={collectionMethods} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{fontSize: 12}} />
                  <YAxis stroke="var(--color-text-muted)" tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'var(--color-surface-hover)'}}
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}
                    formatter={(value) => [`₹${value}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No collections this month.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Payments</h3>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>Student Name</th>
                <th style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>Amount</th>
                <th style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>Method</th>
                <th style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>Date</th>
                <th style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    No recent payments.
                  </td>
                </tr>
              ) : (
                recentPayments.map(payment => (
                  <ActivityRow 
                    key={payment.id}
                    name={payment.studentName} 
                    amount={`₹${payment.amount}`} 
                    method={payment.method !== '-' ? payment.method : 'N/A'} 
                    date={payment.date} 
                    status={payment.status} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, trend, positive, icon }) {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>{title}</span>
        <div style={{ padding: '0.4rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
          {icon}
        </div>
      </div>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: '0.1rem 0' }}>{value}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: positive ? 'var(--color-success)' : 'var(--color-warning)' }}>
        {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        <span>{trend}</span>
      </div>
    </div>
  );
}

function ActivityRow({ name, amount, method, date, status }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <td style={{ padding: '0.5rem 0', fontWeight: '500', fontSize: '0.9rem' }}>{name}</td>
      <td style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}>{amount}</td>
      <td style={{ padding: '0.5rem 0' }}>
        {method !== 'N/A' && (
          <span style={{ 
            padding: '0.2rem 0.4rem', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.7rem', 
            background: method === 'GPay' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            color: method === 'GPay' ? 'var(--color-secondary)' : '#8B5CF6'
          }}>
            {method}
          </span>
        )}
        {method === 'N/A' && <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
      </td>
      <td style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{date}</td>
      <td style={{ padding: '0.5rem 0' }}>
        <span style={{ 
          color: status === 'Paid' ? 'var(--color-success)' : 'var(--color-error)', 
          fontSize: '0.85rem', 
          fontWeight: '500' 
        }}>
          {status}
        </span>
      </td>
    </tr>
  );
}
