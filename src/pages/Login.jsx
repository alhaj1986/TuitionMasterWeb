import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from '@phosphor-icons/react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Setup invisible reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error('Google sign‑in error →', err.code, err.message);
      // If the popup is blocked, fall back to redirect flow
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, new GoogleAuthProvider());
      } else {
        setError(err.message || 'Google sign‑in failed');
      }
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check the number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await window.confirmationResult.confirm(otp);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.brand}>
          <GraduationCap size={48} weight="fill" color="var(--color-primary)" />
          <h1 style={{ fontFamily: 'var(--font-heading)', marginTop: '1rem' }}>TuitionMaster</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Admin Portal Login</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div id="recaptcha-container"></div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP via SMS'}
            </button>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              Note: For local testing, ensure your Firebase Auth Settings allow localhost domains and use a test phone number.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep('phone')} 
              style={{ ...styles.linkBtn, marginTop: '1rem' }}
            >
              Back to Phone Input
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-surface-hover) 100%)',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '2.5rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-main)',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-main)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--color-error)',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  linkBtn: {
    color: 'var(--color-primary)',
    fontSize: '0.875rem',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  }
};
