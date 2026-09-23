import React, { useState, useEffect } from 'react';

export default function App() {
  // Navigation screen states: 'welcome' | 'login' | 'signup' | 'dashboard' | 'services' | 'scholarship' | 'scholarship-apply' | 'requests' | 'document-requests' | 'notifications' | 'chatbot' | 'admin'
  const [currentScreen, setCurrentScreen] = useState<string>('welcome');
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('2024-08912');
  const [loginPassword, setLoginPassword] = useState<string>('secret123');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    termsAgreed: false
  });

  // Campus Info Modal state
  const [showCampusModal, setShowCampusModal] = useState<boolean>(false);

  // Document Request Modal state
  const [selectedDocOrder, setSelectedDocOrder] = useState<any>(null);
  const [requestPurpose, setRequestPurpose] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('digital');

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'model', text: 'Hello Maria! 👋 Welcome to the Student Life Support Assistant. How can we help you today with academic appeals, scholarship inquiries, or student services?' },
    { role: 'model', text: 'Strictly Confidential: Your submission is strictly confidential and reviewed directly by credentialed Student Life coordinators and the Dean\'s Office.', isNotice: true }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Request history state
  const [requestSearch, setRequestSearch] = useState<string>('');
  const [requestFilter, setRequestFilter] = useState<string>('all');

  // Admin portal state
  const [adminData, setAdminData] = useState<any>(null);

  // Check persisted session
  useEffect(() => {
    const savedUser = localStorage.getItem('swu_student_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchDashboardData(parsed.studentId);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchDashboardData = async (studentId: string) => {
    try {
      const res = await fetch(`/api/dashboard/${studentId}`);
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
        setNotifications(json.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const json = await res.json();
      setLoading(false);
      if (json.success) {
        setUser(json.user);
        localStorage.setItem('swu_student_user', JSON.stringify(json.user));
        fetchDashboardData(json.user.studentId);
        if (json.user.role === 'admin') {
          setCurrentScreen('admin');
          fetchAdminData();
        } else {
          setCurrentScreen('dashboard');
        }
      } else {
        setErrorMsg(json.message || 'Login failed');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error connecting to backend.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signupForm.termsAgreed) {
      setErrorMsg('You must agree to the Terms of Service.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const json = await res.json();
      setLoading(false);
      if (json.success) {
        setUser(json.user);
        localStorage.setItem('swu_student_user', JSON.stringify(json.user));
        fetchDashboardData(json.user.studentId);
        setCurrentScreen('dashboard');
      } else {
        setErrorMsg(json.message || 'Signup failed');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error connecting to backend.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('swu_student_user');
    setUser(null);
    setCurrentScreen('welcome');
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      const json = await res.json();
      if (json.success) {
        setAdminData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: newMessages })
      });
      const json = await res.json();
      setChatLoading(false);
      if (json.success) {
        setChatMessages(prev => [...prev, { role: 'model', text: json.reply }]);
      }
    } catch (err) {
      setChatLoading(false);
      setChatMessages(prev => [...prev, { role: 'model', text: 'I apologize, but I am having trouble connecting to support right now. Please try again shortly.' }]);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileRequestSubmit = async () => {
    if (!selectedDocOrder) return;
    setLoading(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.studentId || '2023-00456',
          title: selectedDocOrder.title,
          category: 'documents',
          office: selectedDocOrder.office
        })
      });
      setLoading(false);
      setSelectedDocOrder(null);
      setSuccessMsg('Document request successfully filed!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (user) fetchDashboardData(user.studentId);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Failed to submit document request.');
    }
  };

  // Render Bottom Floating Navigation
  const renderBottomNav = () => {
    if (!user || user.role === 'admin') return null;
    return (
      <nav className="fixed bottom-4 left-4 right-4 h-16 rounded-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(91,14,27,0.1),0_4px_12px_-2px_rgba(15,23,42,0.06)] z-50 flex items-center justify-around px-4">
        <button 
          onClick={() => setCurrentScreen('dashboard')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${currentScreen === 'dashboard' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: currentScreen === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-label-sm text-[10px] mt-0.5">Home</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('services')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${currentScreen === 'services' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: currentScreen === 'services' ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
          <span className="font-label-sm text-[10px] mt-0.5">Services</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('scholarship')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${currentScreen === 'scholarship' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: currentScreen === 'scholarship' ? "'FILL' 1" : "'FILL' 0" }}>school</span>
          <span className="font-label-sm text-[10px] mt-0.5">Scholarship</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('requests')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${currentScreen === 'requests' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: currentScreen === 'requests' ? "'FILL' 1" : "'FILL' 0" }}>description</span>
          <span className="font-label-sm text-[10px] mt-0.5">Requests</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('notifications')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors relative ${currentScreen === 'notifications' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: currentScreen === 'notifications' ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
          <span className="font-label-sm text-[10px] mt-0.5">Alerts</span>
          {notifications.some(n => n.unread) && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary"></span>
          )}
        </button>
      </nav>
    );
  };

  // Render Header Bar
  const renderHeader = (title: string, showBack = true) => {
    return (
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_12px_rgba(58,0,10,0.04)] border-b border-surface-container">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack && (
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            )}
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">SWU PHINMA Portal</span>
              <h1 className="font-headline-md text-headline-md text-primary font-extrabold tracking-tight truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentScreen('notifications')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {notifications.some(n => n.unread) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary"></span>
              )}
            </button>
            <div 
              onClick={() => {
                if (user?.role === 'admin') setCurrentScreen('admin');
                else setCurrentScreen('dashboard');
              }}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-sm text-on-primary font-bold text-xs"
              title={user?.firstName || 'User'}
            >
              {user?.firstName ? user.firstName[0] : 'U'}
            </div>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface relative selection:bg-primary-container selection:text-on-primary">
      
      {/* 1. WELCOME SCREEN */}
      {currentScreen === 'welcome' && (
        <main className="flex-1 flex flex-col w-full bg-primary-container text-on-primary relative min-h-screen">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-fixed-dim/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col justify-between items-center w-full px-6 py-6 min-h-screen">
            <div className="w-full flex justify-center pt-2">
              <button 
                onClick={() => setShowCampusModal(true)}
                className="bg-surface-container-lowest/10 backdrop-blur-md text-on-primary font-label-sm text-[11px] px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-primary-fixed leading-none">school</span>
                <span className="tracking-wider uppercase font-semibold text-primary-fixed">SOUTHWESTERN UNIVERSITY PHINMA</span>
                <span className="material-symbols-outlined text-[15px] opacity-75 leading-none">info</span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center text-center my-auto py-8">
              <div className="relative mb-6 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest/10 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary shadow-md">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
              </div>

              <h1 className="font-headline-xl-mobile text-[32px] text-on-primary tracking-tight font-extrabold">
                Student Life.
              </h1>
              <p className="font-body-lg text-[16px] text-primary-fixed-dim/90 max-w-xs mx-auto mt-3 font-normal">
                Your centralized hub for student life services.
              </p>

              <div className="space-y-3.5 w-full max-w-sm mx-auto mt-10">
                <button 
                  onClick={() => setCurrentScreen('login')}
                  className="w-full bg-surface-container-lowest text-primary-container font-label-lg text-[14px] py-4 px-6 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button 
                  onClick={() => setCurrentScreen('signup')}
                  className="w-full bg-surface-container-lowest/10 backdrop-blur-sm text-on-primary font-label-lg text-[14px] py-4 px-6 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            </div>

            <div className="w-full pb-2 text-center">
              <p className="font-label-sm text-[11px] text-primary-fixed-dim/50 tracking-wide uppercase">
                © 2026 Student Life Office · Cebu City
              </p>
            </div>
          </div>

          {/* Campus Info Modal */}
          {showCampusModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/80 backdrop-blur-md">
              <div className="bg-surface-container-lowest text-on-surface w-full max-w-xs rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative">
                <button 
                  onClick={() => setShowCampusModal(false)}
                  className="absolute top-4 right-4 text-on-surface-variant p-1 rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 text-primary-container">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>assured_workload</span>
                </div>
                <h3 className="font-headline-md text-[18px] text-primary-container mb-1 font-bold">Office of Student Life</h3>
                <p className="font-label-md text-[12px] text-secondary mb-3 uppercase tracking-wider font-semibold">Main Campus · Cebu City</p>
                <div className="bg-surface-container-low rounded-xl p-3 w-full mb-5 flex flex-col gap-1.5 text-left">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                    <span className="font-body-sm text-[13px] font-medium">Mon – Fri · 8:00 AM – 5:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                    <span className="font-body-sm text-[13px] font-medium">Student Pavilion, 2nd Floor</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCampusModal(false)}
                  className="w-full bg-primary-container text-on-primary font-label-md text-[12px] py-2.5 rounded-xl font-bold shadow-md"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* 2. LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <main className="flex-1 w-full bg-surface pt-safe pb-safe flex flex-col">
          <div className="flex flex-col w-full px-6 pb-12 pt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between w-full pt-2 mb-6">
              <button 
                onClick={() => setCurrentScreen('welcome')}
                className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                <span className="font-label-sm text-[11px] font-bold text-on-surface-variant">Secure Portal</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center w-full mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg mb-3 text-on-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <h1 className="font-headline-xl text-[28px] font-extrabold text-on-surface">Welcome back</h1>
              <p className="font-body-md text-[14px] text-on-surface-variant mt-1">Sign in to your Student Life account</p>
            </div>

            <div className="w-full bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container">
              <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container font-body-sm text-[13px]">
                    {errorMsg}
                  </div>
                )}
                
                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">Student ID or Email</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="2024-08912"
                      required
                      className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none focus:bg-surface-container-lowest shadow-inner"
                    />
                    <span className="absolute right-3.5 text-outline material-symbols-outlined text-xl">badge</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">Password</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-4 pr-11 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none focus:bg-surface-container-lowest shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-primary-container w-4 h-4" />
                    <span className="font-body-sm text-[13px] text-on-surface-variant">Remember me</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset instructions sent to institutional email.'); }} className="font-label-sm text-[12px] text-primary-container font-bold hover:underline">Forgot password?</a>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary-container text-on-primary font-label-lg text-[14px] rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mt-6">
              <p className="font-body-sm text-[13px] text-on-surface-variant">
                Don't have an account?{' '}
                <button onClick={() => setCurrentScreen('signup')} className="font-label-md text-[13px] text-primary-container font-bold hover:underline ml-1">
                  Sign up
                </button>
              </p>
            </div>

            {/* Demo Student Helper Card */}
            <div className="mt-6 w-full bg-surface-container-low rounded-2xl p-4 shadow-sm border border-surface-container">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-container shrink-0">
                  <span className="material-symbols-outlined text-base">info</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-[11px] font-bold text-on-surface uppercase">Demo Student Access</span>
                    <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">Active Term</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                    Test credentials pre-filled for Maria Santos (ID: <code className="font-mono text-on-surface font-bold">2023-00456</code>) or Admin (<code className="font-mono text-on-surface font-bold">ADMIN-01</code>).
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { setLoginIdentifier('2023-00456'); setLoginPassword('secret123'); }} className="px-2.5 py-1 bg-surface-container-lowest text-primary text-[11px] font-bold rounded-lg shadow-xs">Fill Student</button>
                    <button onClick={() => { setLoginIdentifier('ADMIN-01'); setLoginPassword('admin123'); }} className="px-2.5 py-1 bg-surface-container-lowest text-primary text-[11px] font-bold rounded-lg shadow-xs">Fill Admin</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 3. SIGN UP SCREEN */}
      {currentScreen === 'signup' && (
        <main className="flex-1 w-full bg-surface pt-safe pb-safe flex flex-col">
          <div className="flex flex-col w-full px-6 pb-12 pt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between w-full pt-2 mb-6">
              <button 
                onClick={() => setCurrentScreen('welcome')}
                className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                <span className="font-label-sm text-[11px] font-bold text-on-surface-variant">Step 1 of 2</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center w-full mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg mb-3 text-on-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <h1 className="font-headline-xl text-[28px] font-extrabold text-on-surface">Create Account</h1>
              <p className="font-body-md text-[14px] text-on-surface-variant mt-1">Sign up to get started with Student Life</p>
            </div>

            <div className="w-full bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container">
              <form onSubmit={handleSignup} className="flex flex-col space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container font-body-sm text-[13px]">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">First Name *</label>
                  <input 
                    type="text" 
                    value={signupForm.firstName}
                    onChange={e => setSignupForm({...signupForm, firstName: e.target.value})}
                    placeholder="e.g. Maria"
                    required
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Middle Name (Optional)</label>
                  <input 
                    type="text" 
                    value={signupForm.middleName}
                    onChange={e => setSignupForm({...signupForm, middleName: e.target.value})}
                    placeholder="e.g. Clara"
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">Last Name *</label>
                  <input 
                    type="text" 
                    value={signupForm.lastName}
                    onChange={e => setSignupForm({...signupForm, lastName: e.target.value})}
                    placeholder="e.g. Santos"
                    required
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">Student ID *</label>
                  <input 
                    type="text" 
                    value={signupForm.studentId}
                    onChange={e => setSignupForm({...signupForm, studentId: e.target.value})}
                    placeholder="e.g. 2024-09999"
                    required
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">University Email *</label>
                  <input 
                    type="email" 
                    value={signupForm.email}
                    onChange={e => setSignupForm({...signupForm, email: e.target.value})}
                    placeholder="student@suu.edu.ph"
                    required
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-label-md text-[12px] font-bold text-on-surface mb-1 uppercase tracking-wider">Password *</label>
                  <input 
                    type="password" 
                    value={signupForm.password}
                    onChange={e => setSignupForm({...signupForm, password: e.target.value})}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-[14px] outline-none"
                  />
                  <span className="text-[11px] text-on-surface-variant mt-1">Minimum 8 characters with letters & numbers</span>
                </div>

                <div className="flex items-start gap-2.5 pt-2">
                  <input 
                    type="checkbox" 
                    checked={signupForm.termsAgreed}
                    onChange={e => setSignupForm({...signupForm, termsAgreed: e.target.checked})}
                    required
                    className="mt-1 rounded accent-primary-container w-4 h-4"
                  />
                  <span className="font-body-sm text-[12px] text-on-surface-variant leading-snug">
                    I agree to the University Student Life Terms of Service and Privacy Policy.
                  </span>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary-container text-on-primary font-label-lg text-[14px] rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mt-6">
              <p className="font-body-sm text-[13px] text-on-surface-variant">
                Already have an account?{' '}
                <button onClick={() => setCurrentScreen('login')} className="font-label-md text-[13px] text-primary-container font-bold hover:underline ml-1">
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </main>
      )}

      {/* 4. DASHBOARD / HOME SCREEN */}
      {currentScreen === 'dashboard' && user && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Student Life', false)}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            {/* Greeting & Profile Intro */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-body-md text-[14px] text-on-surface-variant">Good morning</span>
                <span className="text-base animate-pulse">👋</span>
              </div>
              <h1 className="font-headline-xl text-[26px] text-primary tracking-tight font-extrabold">{user.firstName} {user.lastName}</h1>
              <p className="font-label-md text-[12px] text-on-surface-variant flex items-center gap-1 flex-wrap">
                <span>ID: <strong className="text-on-surface font-bold">{user.studentId}</strong></span>
                <span>•</span>
                <span>{user.course || 'BS Computer Science'}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold text-[11px]">{user.yearLevel || '3rd Year'}</span>
              </p>
            </div>

            {/* Academic / Requirements Progress Card */}
            <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-4 border border-surface-container">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-md text-[18px] text-on-surface font-bold">Academic Status</span>
                    </div>
                    <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Semester A.Y. 2026-2027
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Active
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-label-lg text-[14px] font-semibold">Requirements Submitted</span>
                  <span className="font-headline-md text-[18px] text-primary font-bold">67%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-primary-container transition-all duration-700 ease-out" style={{ width: '67%' }}></div>
                </div>
                <div className="flex items-center justify-between font-label-sm text-[11px] text-on-surface-variant pt-0.5">
                  <span>4 of 6 verified documents</span>
                  <span className="text-secondary font-bold">Renewal in 14 days</span>
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-md text-[18px] text-primary font-bold">Pending Actions</h2>
                  <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold flex items-center justify-center">2</span>
                </div>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Immediate tasks</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => setCurrentScreen('scholarship')} className="w-full text-left bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs flex items-center justify-between gap-3 group border border-surface-container">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-[14px] font-bold text-on-surface truncate group-hover:text-primary">Grade Slip (2nd Sem)</span>
                      <span className="font-body-sm text-[12px] text-error font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event_busy</span>
                        Due Aug 20, 2026 • Bursar Review
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
                </button>
                <button onClick={() => setCurrentScreen('scholarship')} className="w-full text-left bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs flex items-center justify-between gap-3 group border border-surface-container">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-[14px] font-bold text-on-surface truncate group-hover:text-primary">Enrollment Form</span>
                      <span className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Due Aug 25, 2026 • Registrar Signoff
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Quick Services */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="font-headline-md text-[18px] text-primary font-bold">Quick Services</h2>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Tap to launch</span>
              </div>
              <div className="flex items-center gap-3.5 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <button onClick={() => setCurrentScreen('scholarship')} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">school</span>
                  </div>
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">Scholarship</span>
                </button>
                <button onClick={() => setCurrentScreen('document-requests')} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary-container shadow-sm group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">description</span>
                  </div>
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">Documents</span>
                </button>
                <button onClick={() => setCurrentScreen('chatbot')} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant shadow-sm group-hover:bg-tertiary-container group-hover:text-tertiary-fixed transition-colors">
                    <span className="material-symbols-outlined text-[26px]">chat_bubble</span>
                  </div>
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">Concerns</span>
                </button>
                <button onClick={() => setCurrentScreen('document-requests')} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">badge</span>
                  </div>
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">Lost ID</span>
                </button>
                <button onClick={() => setCurrentScreen('requests')} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shadow-sm group-hover:bg-surface-tint group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-[26px]">history</span>
                  </div>
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">History</span>
                </button>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="font-headline-md text-[18px] text-primary font-bold">Recent Requests</h2>
                <button onClick={() => setCurrentScreen('requests')} className="font-label-md text-[12px] font-bold text-secondary hover:underline flex items-center gap-0.5">
                  View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {dashboardData?.requests?.slice(0, 2).map((req: any) => (
                  <div key={req.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-[14px] font-bold text-on-surface truncate">{req.title}</span>
                        <span className="font-label-sm text-[11px] text-on-surface-variant font-mono">{req.refNo}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold shrink-0 ${
                        req.status === 'completed' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                        req.status === 'processing' ? 'bg-surface-container-highest text-primary' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-[12px] pt-1">
                      <span>{req.date}</span>
                      <span className="font-label-sm text-[11px] text-on-surface font-semibold">{req.remarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidance Counselor Banner */}
            <div onClick={() => setCurrentScreen('chatbot')} className="relative overflow-hidden rounded-2xl bg-primary-container p-4 text-on-primary flex items-center justify-between gap-3 shadow-md cursor-pointer">
              <div className="flex flex-col gap-1 z-10 min-w-0">
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[10px] uppercase font-bold w-max">Need Guidance?</span>
                <h3 className="font-headline-md text-[16px] text-on-primary leading-snug">Connect with SWU Guidance Counselor</h3>
                <p className="font-body-sm text-[12px] text-primary-fixed-dim truncate">Free 1-on-1 virtual or in-campus confidential counseling.</p>
              </div>
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-inner">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpxREWRCTJmz7fXMerZ0yo2sx51sFHIVHudUTY0Cskpq166ohmy6bIas8qZNCrFR0MSg89IPwfRE9_DSH5dDv4JFlvDnWZHznxog-cBk7JvDyC1cSQdgl4zAvEnuQAcTMi8sXUWMSpUmgre-azxq5-Mw-NhOQ5z74-KkdMqbIeVTDBDbuYbg1kwDr7KkfYjuEByz7Cy_CordWnf1N0hcSiO7TopW1F3J8HZMlfAlmOS0_IxjMweYHm" alt="Advisor" />
              </div>
            </div>

            {/* Bottom Stat Cards */}
            <div className="grid grid-cols-3 gap-2.5 pb-6">
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col items-center text-center gap-1">
                <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                <span className="font-headline-xl text-[22px] font-extrabold text-primary">{dashboardData?.totalRequests || 12}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">Total Requests</span>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col items-center text-center gap-1">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">done_all</span>
                <span className="font-headline-xl text-[22px] font-extrabold text-emerald-600">{dashboardData?.completedRequests || 9}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">Completed</span>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col items-center text-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[18px]">pending_actions</span>
                <span className="font-headline-xl text-[22px] font-extrabold text-secondary">{dashboardData?.pendingRequests || 3}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">Pending</span>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 5. SERVICES DIRECTORY SCREEN */}
      {currentScreen === 'services' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Services Directory')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            {/* Visual Hero Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-primary-container text-on-primary p-5 flex flex-col justify-between min-h-[140px]">
              <div className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-secondary/20 blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface/15 text-primary-fixed font-label-sm text-[11px] mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                  One-Stop University Hub
                </span>
                <h1 className="font-headline-lg text-[20px] font-bold text-surface">Services Directory</h1>
                <p className="font-body-sm text-[13px] text-surface-variant/80 mt-1 max-w-[280px]">
                  Streamlined requests, official documents, and direct student council assistance.
                </p>
              </div>
              <div className="relative z-10 grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-surface/10">
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-surface-variant/70 uppercase">Active Grants</span>
                  <span className="font-headline-md text-[16px] font-bold text-surface">14</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-surface-variant/70 uppercase">Avg Turnaround</span>
                  <span className="font-headline-md text-[16px] font-bold text-surface">24 hrs</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-surface-variant/70 uppercase">Campus Desk</span>
                  <span className="font-headline-md text-[16px] font-bold text-tertiary-fixed">Online</span>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input 
                type="search" 
                placeholder="Search service, document, or form..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-[14px] shadow-xs border border-surface-container outline-none"
              />
            </div>

            {/* Section 1: Scholarship */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-headline-md text-[16px] text-primary font-bold">Scholarship</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px]">3 available</span>
              </div>
              <div onClick={() => setCurrentScreen('scholarship')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary-fixed/60 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-md text-[15px] text-on-surface font-bold">Apply / Continue Scholarship</span>
                      <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">AY 2024–25</span>
                    </div>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Submit a new application or renew credentials for your existing university scholarship.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                  <span className="font-label-sm text-[11px] text-on-surface-variant">Deadline: Sep 15, 2024</span>
                  <span className="font-label-md text-[12px] text-secondary font-bold flex items-center gap-0.5">
                    Apply Now <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </span>
                </div>
              </div>

              <div onClick={() => setCurrentScreen('scholarship')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed/70 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">fact_check</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-md text-[15px] text-on-surface font-bold">Scholarship Requirements</span>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">View, upload, and track pending evaluation documents.</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </div>
            </div>

            {/* Section 2: Student Support */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-headline-md text-[16px] text-primary font-bold">Student Support</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px]">2 channels</span>
              </div>
              <div onClick={() => setCurrentScreen('chatbot')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-tertiary-fixed/50 flex items-center justify-center text-on-tertiary-fixed-variant shrink-0">
                  <span className="material-symbols-outlined text-[22px]">contact_support</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-[15px] text-on-surface font-bold">Submit Student Concern</span>
                    <span className="font-label-sm text-[10px] uppercase font-bold text-emerald-600">Confidential</span>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Submit academic, mental wellness, or facility grievances.</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </div>

              <div onClick={() => setCurrentScreen('chatbot')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">forum</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-md text-[15px] text-on-surface font-bold">Inquiry Desk</span>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Chat directly with active Student Life officers & counselors.</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </div>
            </div>

            {/* Section 3: Documents & Records */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-headline-md text-[16px] text-primary font-bold">Documents & Records</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px]">3 requests</span>
              </div>
              <div onClick={() => setCurrentScreen('document-requests')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-md text-[15px] text-on-surface font-bold">Certificate of Completion (COC)</span>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Official certification verifying completed subjects or program.</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </div>

              <div onClick={() => setCurrentScreen('document-requests')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-md text-[15px] text-on-surface font-bold">Good Moral Certificate</span>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Request stamped conduct clearance for internship or transfer.</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 6. SCHOLARSHIP OVERVIEW & TRACKING SCREEN */}
      {currentScreen === 'scholarship' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Scholarship Overview')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-bold">Grants & Aids</span>
                  <h2 className="font-headline-lg text-[20px] text-on-surface font-bold">CHED Academic Excellence</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                </div>
              </div>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">AY 2024–2025 • Mid-Year Renewal Cycle</p>
            </div>

            {/* Segmented Tabs */}
            <div className="bg-surface-container-high p-1 rounded-full flex items-center justify-between shadow-inner">
              <button className="flex-1 py-2 px-3 rounded-full font-label-md text-[12px] font-bold text-center bg-primary-container text-on-primary shadow-xs">Overview</button>
              <button onClick={() => setCurrentScreen('scholarship-apply')} className="flex-1 py-2 px-3 rounded-full font-label-md text-[12px] font-bold text-center text-on-surface-variant hover:text-on-surface">Apply</button>
              <button onClick={() => setCurrentScreen('requests')} className="flex-1 py-2 px-3 rounded-full font-label-md text-[12px] font-bold text-center text-on-surface-variant hover:text-on-surface">Disbursements</button>
            </div>

            {/* Hero Progress Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-label-md text-[12px] font-bold text-on-surface">Grant Status</span>
                </div>
                <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Active Scholar
                </span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase">Checklist Compliance</p>
                  <h3 className="font-headline-md text-[18px] text-on-surface font-extrabold">3 of 6 Documents</h3>
                </div>
                <span className="font-headline-lg text-[24px] text-primary-container font-extrabold">50%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden mb-2 p-0.5">
                <div className="h-full bg-primary-container rounded-full transition-all duration-700" style={{ width: '50%' }}></div>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-on-surface-variant text-[12px]">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                <p>Next critical cutoff: <span className="font-bold text-on-surface">August 25, 2026</span></p>
              </div>
            </div>

            {/* Tri-Card Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-xs border border-surface-container flex flex-col items-center">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] mb-1">check_circle</span>
                <span className="font-headline-lg text-[20px] text-emerald-600 font-extrabold leading-none">3</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant mt-1">Approved</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-xs border border-surface-container flex flex-col items-center">
                <span className="material-symbols-outlined text-primary-container text-[18px] mb-1">hourglass_top</span>
                <span className="font-headline-lg text-[20px] text-on-surface font-extrabold leading-none">2</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant mt-1">In Review</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-xs border border-surface-container flex flex-col items-center">
                <span className="material-symbols-outlined text-error text-[18px] mb-1">priority_high</span>
                <span className="font-headline-lg text-[20px] text-error font-extrabold leading-none">1</span>
                <span className="font-label-sm text-[11px] text-error mt-1 font-bold">Required</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentScreen('scholarship-apply')} className="flex-1 py-3 px-3 bg-primary-container text-on-primary font-label-lg text-[13px] rounded-xl text-center shadow-xs font-bold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span> Submit New Files
              </button>
            </div>

            {/* Required Documents Stream */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-[16px] text-primary font-bold">Required Documents Checklist</h3>
                <span className="font-label-sm text-[11px] text-secondary font-bold">Step 2 of 4</span>
              </div>
              <div className="flex flex-col gap-2">
                {dashboardData?.scholarshipDocs?.map((doc: any) => (
                  <div key={doc.id} className="bg-surface-container-lowest rounded-xl p-3 shadow-xs border border-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-label-lg text-[13px] font-bold text-on-surface truncate">{doc.name}</h4>
                        <p className="font-body-sm text-[11px] text-on-surface-variant">{doc.info}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-label-sm text-[11px] font-bold shrink-0 ${
                      doc.status === 'Verified' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                      doc.status === 'Reviewing' ? 'bg-surface-container text-primary' : 'bg-error-container text-on-error-container'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 7. SCHOLARSHIP APPLICATION FORM SCREEN */}
      {currentScreen === 'scholarship-apply' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Scholarship Application')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg('Application successfully filed! Tracking ID: #CHED-2024-9812'); setTimeout(() => setCurrentScreen('scholarship'), 2500); }} className="flex flex-col space-y-4 bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-container">
              {successMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl font-label-md text-[13px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">task_alt</span> {successMsg}
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between font-label-sm text-[11px] text-on-surface-variant">
                  <span>Step 2 of 2: Submission</span>
                  <span className="font-bold text-primary">85% Completed</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full bg-primary-container w-[85%]"></div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[12px] font-bold text-on-surface">Scholarship Program *</label>
                <select className="w-full bg-surface-container-low text-on-surface font-body-md text-[14px] rounded-xl px-4 py-3 outline-none">
                  <option value="ched-merit">CHED Full Merit Scholarship Award (CMSP)</option>
                  <option value="swu-presidential">Presidential Academic Grant</option>
                  <option value="phinma-stem">PHINMA STEM Leaders Foundation</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[12px] font-bold text-on-surface">Application Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center p-3 rounded-xl bg-primary-container text-on-primary font-label-md text-[12px] font-bold cursor-pointer">
                    <input type="radio" name="appType" defaultChecked className="sr-only" /> New Application
                  </label>
                  <label className="flex items-center justify-center p-3 rounded-xl bg-surface-container-low text-on-surface font-label-md text-[12px] font-bold cursor-pointer">
                    <input type="radio" name="appType" className="sr-only" /> Continuing
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low space-y-2 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] uppercase text-on-surface-variant font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified Student Record
                  </span>
                  <span className="font-label-sm text-[10px] text-secondary bg-surface-container-lowest px-2 py-0.5 rounded-full font-bold">Auto-filled</span>
                </div>
                <div className="text-[13px] text-on-surface font-semibold">
                  <div>Student ID: <strong>{user?.studentId || '2023-00456'}</strong></div>
                  <div>Full Name: <strong>{user?.firstName} {user?.lastName}</strong></div>
                  <div>Program: <strong>{user?.course} — {user?.yearLevel}</strong></div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[12px] font-bold text-on-surface">Supporting Documents * (COG / ITR / Valid ID)</label>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low border-2 border-dashed border-outline/30 text-center cursor-pointer">
                  <span className="material-symbols-outlined text-[32px] text-secondary mb-1">cloud_upload</span>
                  <span className="font-label-lg text-[13px] text-primary font-bold">Drop files here or browse</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Supports PDF, JPG, PNG (Max 10MB per document)</span>
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input type="checkbox" required className="mt-1 accent-primary-container w-4 h-4" />
                <span className="font-body-sm text-[12px] text-on-surface-variant leading-tight">
                  I hereby certify that all statements made are true and correct under SWU PHINMA academic policies.
                </span>
              </label>

              <button type="submit" className="w-full py-4 rounded-2xl bg-primary-container text-on-primary font-label-lg text-[14px] font-bold shadow-md flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">send</span>
                <span>Submit Application</span>
              </button>
            </form>

          </div>
        </main>
      )}

      {/* 8. REQUEST HISTORY SCREEN */}
      {currentScreen === 'requests' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Request History')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-headline-lg text-[20px] text-on-surface font-extrabold">Request History</h1>
                <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Track all your submitted documents and inquiries.</p>
              </div>
              <button onClick={() => alert('Exporting request history PDF...')} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>

            {/* Live Statistics Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col shadow-xs border border-surface-container">
                <span className="font-label-sm text-[11px] text-on-surface-variant">Active</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-headline-md text-[18px] text-primary-container font-extrabold">2</span>
                  <span className="font-label-sm text-[10px] text-emerald-600 font-bold">in flight</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col shadow-xs border border-surface-container">
                <span className="font-label-sm text-[11px] text-on-surface-variant">Completed</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-headline-md text-[18px] text-on-surface font-extrabold">3</span>
                  <span className="font-label-sm text-[10px] text-outline font-bold">verified</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col shadow-xs border border-surface-container">
                <span className="font-label-sm text-[11px] text-on-surface-variant">Needs Action</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-headline-md text-[18px] text-secondary font-extrabold">1</span>
                  <span className="font-label-sm text-[10px] text-error font-bold">review</span>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline">search</span>
              <input 
                type="text" 
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                placeholder="Search by reference number or document..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-lowest font-body-md text-[14px] text-on-surface placeholder:text-outline shadow-xs border border-surface-container outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {['all', 'review', 'processing', 'completed', 'rejected'].map(f => (
                <button 
                  key={f}
                  onClick={() => setRequestFilter(f)}
                  className={`px-4 py-1.5 rounded-full font-label-md text-[12px] font-bold capitalize shrink-0 transition-all ${requestFilter === f ? 'bg-primary-container text-on-primary shadow-xs' : 'bg-surface-container-lowest text-on-surface-variant border border-surface-container'}`}
                >
                  {f === 'completed' ? 'Approved / Completed' : f}
                </button>
              ))}
            </div>

            {/* Request Cards Feed */}
            <div className="flex flex-col gap-3">
              {dashboardData?.requests
                ?.filter((req: any) => {
                  const matchFilter = requestFilter === 'all' || req.status === requestFilter;
                  const matchQuery = !requestSearch || req.title.toLowerCase().includes(requestSearch.toLowerCase()) || req.refNo.toLowerCase().includes(requestSearch.toLowerCase());
                  return matchFilter && matchQuery;
                })
                .map((req: any) => (
                  <article key={req.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
                          <span className="material-symbols-outlined text-[20px]">verified_user</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h2 className="font-headline-md text-[15px] text-on-surface font-bold truncate">{req.title}</h2>
                          <span className="font-label-sm text-[11px] text-outline">{req.office}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                        req.status === 'completed' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                        req.status === 'processing' ? 'bg-surface-container text-primary' :
                        req.status === 'review' ? 'bg-amber-100 text-amber-800' : 'bg-error-container text-on-error-container'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-surface-container/60 text-[12px]">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[11px] text-on-surface font-bold">{req.refNo}</span>
                        <span className="text-outline">{req.date}</span>
                      </div>
                      <button onClick={() => alert(`Viewing details for ${req.refNo} — Remarks: ${req.remarks}`)} className="flex items-center gap-1 text-primary-container font-label-sm text-[12px] font-bold hover:underline">
                        <span>View Details</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  </article>
                ))}
            </div>

            {/* Support Banner */}
            <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between shadow-xs border border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-[14px] font-bold text-on-surface">Need assistance?</h4>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">Live chat with student registrar desks</p>
                </div>
              </div>
              <button onClick={() => setCurrentScreen('chatbot')} className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary-container font-label-sm text-[12px] font-bold shadow-xs">
                Helpdesk
              </button>
            </div>

          </div>
        </main>
      )}

      {/* 9. DOCUMENT REQUESTS SCREEN */}
      {currentScreen === 'document-requests' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Document Requests')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            <div className="flex flex-col space-y-1">
              <span className="font-label-md text-[11px] text-secondary uppercase tracking-wider font-bold">Registrar Office</span>
              <h1 className="font-headline-xl text-[24px] text-on-surface font-extrabold tracking-tight">Document Requests</h1>
              <p className="font-body-md text-[13px] text-on-surface-variant">Request official university documents and certifications online.</p>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 shadow-xs flex items-start gap-3 border border-surface-container">
              <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary-container shrink-0">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <span className="font-label-lg text-[13px] font-bold text-on-surface">Digital & Physical Pick-up</span>
                <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">Approved credentials include cryptographic QR verification or direct registrar counter pickup.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider font-bold">Available Certifications</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">3 Services</span>
              </div>

              {/* Service 1 */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-medium">Free / Digital</span>
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-medium">2-3 Days</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-headline-md text-[16px] text-on-surface font-bold">Certificate of Completion (COC)</h2>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Official certification verifying completed subjects, units, or academic program graduation requirements.</p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                  <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">verified_user</span> Registrar Sealed</span>
                  <button onClick={() => setSelectedDocOrder({ title: 'Certificate of Completion (COC)', office: 'University Registrar', fee: 'Free / Digital' })} className="bg-primary-container text-on-primary font-label-lg text-[13px] px-4 py-2 rounded-xl font-bold shadow-xs flex items-center gap-1">
                    <span>Request Now</span> <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Service 2 */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-medium">Clearance</span>
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-medium">1-2 Days</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-headline-md text-[16px] text-on-surface font-bold">Good Moral Certificate</h2>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Stamped conduct clearance certificate for scholarship qualification, internship endorsement, or employment.</p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                  <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">military_tech</span> Dean of Student Affairs</span>
                  <button onClick={() => setSelectedDocOrder({ title: 'Good Moral Certificate', office: 'Dean of Student Affairs', fee: 'Free' })} className="bg-primary-container text-on-primary font-label-lg text-[13px] px-4 py-2 rounded-xl font-bold shadow-xs flex items-center gap-1">
                    <span>Request Now</span> <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Service 3 */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined text-[24px]">badge</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">₱150</span>
                    <span className="font-label-md text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-medium">3-5 Days</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-headline-md text-[16px] text-on-surface font-bold">Lost ID Replacement</h2>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">File an affidavit of loss and request a reprint of your high-frequency NFC student RFID smart card.</p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                  <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">nfc</span> Turnstile NFC Active</span>
                  <button onClick={() => setSelectedDocOrder({ title: 'Lost ID Replacement', office: 'Campus Security & Records', fee: '₱150' })} className="bg-primary-container text-on-primary font-label-lg text-[13px] px-4 py-2 rounded-xl font-bold shadow-xs flex items-center gap-1">
                    <span>Request Now</span> <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-center text-sm">
                {successMsg}
              </div>
            )}

            {/* Order Modal Sheet */}
            {selectedDocOrder && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
                <div className="bg-surface-container-lowest w-full rounded-t-3xl p-6 shadow-2xl space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto"></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-[11px] text-secondary uppercase font-bold">New Document Filing</span>
                      <h3 className="font-headline-md text-[18px] text-on-surface mt-0.5 font-bold">{selectedDocOrder.title}</h3>
                    </div>
                    <button onClick={() => setSelectedDocOrder(null)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="font-label-md text-[12px] font-bold text-on-surface block mb-1">Purpose of Request</label>
                      <input 
                        type="text" 
                        value={requestPurpose}
                        onChange={e => setRequestPurpose(e.target.value)}
                        placeholder="e.g. Scholarship Validation, Transfer, Internship" 
                        className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl font-body-md text-[14px] outline-none"
                      />
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-[13px]">
                      <span className="text-on-surface-variant">Fee & Turnaround</span>
                      <span className="font-bold text-on-surface">{selectedDocOrder.fee}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleFileRequestSubmit}
                    disabled={loading}
                    className="w-full bg-primary-container text-on-primary py-3.5 rounded-xl font-label-lg text-[14px] font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Submitting...' : 'Confirm & Submit Request'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      )}

      {/* 10. NOTIFICATIONS CENTER SCREEN */}
      {currentScreen === 'notifications' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Notifications Center')}
          <div className="flex flex-col w-full px-4 gap-4 pt-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-[18px] text-on-surface font-bold">Inbox</h2>
                <span className="bg-primary-container text-on-primary font-label-sm text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                  {notifications.filter(n => n.unread).length} unread
                </span>
              </div>
              <button onClick={handleMarkAllRead} className="font-label-md text-[12px] text-primary-container font-bold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Mark all read</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setNotifFilter('all')}
                className={`px-4 py-1.5 rounded-full font-label-md text-[12px] font-bold transition-all ${notifFilter === 'all' ? 'bg-primary-container text-on-primary shadow-xs' : 'bg-surface-container-lowest text-on-surface-variant border border-surface-container'}`}
              >
                All
              </button>
              <button 
                onClick={() => setNotifFilter('unread')}
                className={`px-4 py-1.5 rounded-full font-label-md text-[12px] font-bold transition-all ${notifFilter === 'unread' ? 'bg-primary-container text-on-primary shadow-xs' : 'bg-surface-container-lowest text-on-surface-variant border border-surface-container'}`}
              >
                Unread ({notifications.filter(n => n.unread).length})
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {notifications
                .filter(n => notifFilter === 'all' || n.unread)
                .map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                    }}
                    className={`relative bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container flex items-start gap-3.5 cursor-pointer transition-all ${n.unread ? 'font-semibold' : 'opacity-85'}`}
                  >
                    {n.unread && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-secondary"></span>}
                    <div className="w-10 h-10 rounded-full bg-surface-container-low text-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{n.category === 'Action required' ? 'error_outline' : 'school'}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h2 className="font-label-lg text-[14px] text-on-surface truncate">{n.title}</h2>
                      <p className="font-body-sm text-[13px] text-on-surface-variant mt-1 leading-snug">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2 font-label-sm text-[11px] text-outline">
                        <span>{n.timeAgo}</span>
                        <span>•</span>
                        <span className="font-bold text-primary-container">{n.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </main>
      )}

      {/* 11. STUDENT SUPPORT ASSISTANT CHATBOT */}
      {currentScreen === 'chatbot' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
          {renderHeader('Student Support Assistant')}
          <div className="flex flex-col w-full max-w-xl mx-auto flex-1 px-4 py-2 gap-3">
            
            <div className="flex items-center justify-center my-2">
              <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-semibold">Today, Dean of Student Affairs Desk</span>
            </div>

            <div className="flex flex-col gap-3 flex-1 pb-16">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  {msg.role === 'model' && !msg.isNotice && (
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0 shadow-sm mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">school</span>
                    </div>
                  )}
                  {msg.isNotice ? (
                    <div className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 flex items-start gap-2.5 my-1">
                      <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0">verified_user</span>
                      <p className="font-body-sm text-[12px] text-on-surface-variant leading-snug">{msg.text}</p>
                    </div>
                  ) : (
                    <div className={`p-3.5 rounded-2xl text-[14px] leading-relaxed max-w-[85%] shadow-xs ${
                      msg.role === 'user' ? 'bg-primary-container text-on-primary rounded-tr-sm' : 'bg-surface-container-lowest border border-surface-container text-on-surface rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="self-start bg-surface-container-lowest border border-surface-container rounded-2xl p-3 text-xs text-outline animate-pulse">
                  AI Support Assistant is typing...
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container shadow-lg z-40 pb-safe">
              <div className="max-w-xl mx-auto flex flex-col p-3 gap-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button onClick={() => handleSendMessage('I need help with an Academic Appeal')} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-label-sm text-[11px] font-bold">Academic Appeal</button>
                  <button onClick={() => handleSendMessage('Where is my scholarship disbursement?')} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-label-sm text-[11px] font-bold">Scholarship Inquiry</button>
                  <button onClick={() => handleSendMessage('Urgent document clearance assistance')} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-red-50 text-secondary font-label-sm text-[11px] font-bold">High Priority</button>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Describe your concern to AI Assistant..."
                    className="flex-1 pl-4 pr-4 py-3 bg-surface-container-low rounded-full text-on-surface font-body-md text-[14px] outline-none focus:bg-surface-container-lowest shadow-inner"
                  />
                  <button 
                    onClick={() => handleSendMessage()}
                    className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md hover:opacity-95 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 12. ADMIN PORTAL / STAFF MANAGEMENT VIEW */}
      {currentScreen === 'admin' && user?.role === 'admin' && (
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-32 bg-surface">
          {renderHeader('Admin & Staff Control Center', false)}
          <div className="flex flex-col w-full px-4 gap-5 pt-4">
            
            <div className="bg-primary-container text-on-primary rounded-2xl p-5 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-primary-fixed">Authorized Staff Portal</span>
              <h1 className="font-headline-lg text-[22px] font-extrabold mt-0.5">Student Life Administration</h1>
              <p className="text-sm text-primary-fixed-dim/90 mt-1">Review student document submissions, approve scholarship requirements, and process requests.</p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-headline-md text-[16px] text-primary font-bold">Submitted Document Requests Queue</h3>
              <div className="flex flex-col gap-3">
                {adminData?.requests?.map((req: any) => (
                  <div key={req.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-[11px] font-mono text-secondary font-bold">{req.refNo}</span>
                        <h4 className="font-headline-md text-[15px] font-bold text-on-surface">{req.title}</h4>
                        <span className="text-xs text-outline">Student ID: {req.studentId} · {req.office}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-bold uppercase">{req.status}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
                      <button 
                        onClick={async () => {
                          await fetch('/api/admin/update-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id, status: 'completed', remarks: 'Approved by Staff Admin' }) });
                          fetchAdminData();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Approve / Complete
                      </button>
                      <button 
                        onClick={async () => {
                          await fetch('/api/admin/update-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id, status: 'rejected', remarks: 'Rejected due to incorrect format' }) });
                          fetchAdminData();
                        }}
                        className="px-3 py-1.5 bg-error text-on-error text-xs font-bold rounded-xl shadow-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button onClick={handleLogout} className="w-full py-3 bg-surface-container-high text-primary font-bold rounded-xl">
                Log Out Admin
              </button>
            </div>

          </div>
        </main>
      )}

      {/* Floating Bottom Navigation */}
      {renderNavIfApplicable()}
    </div>
  );

  function renderNavIfApplicable() {
    if (!user || user.role === 'admin' || currentScreen === 'welcome' || currentScreen === 'login' || currentScreen === 'signup') {
      return null;
    }
    return renderBottomNav();
  }
}
