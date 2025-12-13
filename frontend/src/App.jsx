import { useEffect, useState, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import TextList from './components/TextList';
import CodeManager from './components/CodeManager';
import AdminForm from './components/AdminForm';
import SuggestionBox from './components/SuggestionBox';
import SuggestionManager from './components/SuggestionManager';
import { fetchMe, fetchTexts, logout } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState([]);
  const [editingText, setEditingText] = useState(null);
  const [error, setError] = useState(null);

  // Refs for navigation
  const formRef = useRef(null);
  const codesRef = useRef(null);
  const suggestionsRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function checkAuth() {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const data = await fetchTexts();
      setTexts(data);
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  }

  const handleCreated = (newText) => {
    setTexts(prev => [newText, ...prev]);
  };

  const handleUpdated = (updatedText) => {
    setTexts(prev => prev.map(t => t.id === updatedText.id ? updatedText : t));
    setEditingText(null);
  };

  const handleDeleted = (id) => {
    setTexts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setEditingText(null);
  };

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;

  if (!user) return <LoginScreen onLogin={setUser} />;

  const isAdmin = user.role === 'admin';
  const isMod = user.role === 'mod';

  const handleApprove = async (id) => {
    try {
      const { updateTextStatus } = await import('./api');
      const updated = await updateTextStatus(id, 'active');
      handleUpdated(updated);
    } catch (e) {
      console.error("Failed to approve", e);
      alert("Failed to approve text");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 text-slate-900 font-sans pb-20 relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-indigo-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md shadow-indigo-500/20 object-cover" />
            <h1 className="text-base font-bold tracking-tight text-slate-800">Primary Text Library</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${isAdmin ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : isMod ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
              {user.role}
            </span>
          </div>

          {/* Sticky Toolbar Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => scrollTo(codesRef)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/50 transition-all flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Codes
              </button>
            )}
            {isAdmin && (
              <button onClick={() => scrollTo(suggestionsRef)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-600 hover:bg-white/50 transition-all flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Suggestions
              </button>
            )}
            {(isAdmin || isMod) && (
              <button onClick={() => scrollTo(formRef)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/50 transition-all flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Text
              </button>
            )}
            <button onClick={() => scrollTo(listRef)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/50 transition-all flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Library
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {texts.length} Texts
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Library Table */}
        <div ref={listRef} className="scroll-mt-28">
          <TextList
            texts={texts}
            isAdmin={isAdmin}
            isMod={isMod}
            onApprove={handleApprove}
            onDeleted={handleDeleted}
            onEdit={(text) => {
              setEditingText(text);
              if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          />
        </div>

        {/* Form Area (Full Width) */}
        {(isAdmin || isMod) && (
          <div ref={formRef} className="scroll-mt-28">
            <AdminForm
              onCreated={handleCreated}
              onUpdated={handleUpdated}
              onCancel={() => setEditingText(null)}
              editingText={editingText}
              isMod={isMod}
            />
          </div>
        )}

        {/* Access Management (Before Library) */}
        {isAdmin && (
          <div ref={codesRef} className="scroll-mt-28">
            <CodeManager />
          </div>
        )}

        {/* Suggestion Manager (Admin Only) */}
        {isAdmin && (
          <div ref={suggestionsRef} className="scroll-mt-28">
            <SuggestionManager />
          </div>
        )}

      </main>

      <SuggestionBox user={user} />

      {/* Debug Info for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-2 text-center pointer-events-none z-[100]">
        API: {import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`} |
        {error ? <span className="text-red-400 font-bold"> Error: {error}</span> : <span className="text-green-400"> Status: OK</span>}
      </div>
    </div>
  );
}

export default App;
