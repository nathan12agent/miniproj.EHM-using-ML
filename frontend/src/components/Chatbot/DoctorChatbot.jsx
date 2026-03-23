import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

const QUICK_CHIPS = [
  'How many beds are available?',
  'Which nurses are on duty?',
  'Hospital summary',
  'Active patient count',
  'Available doctors',
];

const styles = {
  bubble: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
    zIndex: 9999,
    transition: 'transform 0.2s',
  },
  panel: {
    position: 'fixed',
    bottom: 88,
    right: 24,
    width: 380,
    height: 500,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  header: {
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#fff',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: 700, fontSize: 15, margin: 0 },
  headerSub: { fontSize: 11, opacity: 0.85, margin: 0 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  msgBot: {
    alignSelf: 'flex-start',
    background: '#f3f4f6',
    borderRadius: '12px 12px 12px 2px',
    padding: '8px 12px',
    fontSize: 13,
    maxWidth: '85%',
    color: '#1f2937',
    lineHeight: 1.5,
  },
  msgUser: {
    alignSelf: 'flex-end',
    background: '#dc2626',
    color: '#fff',
    borderRadius: '12px 12px 2px 12px',
    padding: '8px 12px',
    fontSize: 13,
    maxWidth: '85%',
    lineHeight: 1.5,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 14px',
    borderTop: '1px solid #f3f4f6',
  },
  chip: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px',
    borderTop: '1px solid #e5e7eb',
    background: '#fafafa',
  },
  input: {
    flex: 1,
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: '8px 14px',
    fontSize: 13,
    outline: 'none',
    background: '#fff',
  },
  sendBtn: {
    background: '#dc2626',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adminBtn: {
    background: 'none',
    border: '1px solid #dc2626',
    color: '#dc2626',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    marginTop: 4,
    display: 'block',
  },
  typing: {
    alignSelf: 'flex-start',
    background: '#f3f4f6',
    borderRadius: '12px 12px 12px 2px',
    padding: '8px 14px',
    fontSize: 13,
    color: '#9ca3af',
  },
};

const CONTACT_TRIGGERS = ['contact admin', 'send to admin', 'notify admin', 'request admin', 'escalate'];

export default function DoctorChatbot({ doctorName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Hi Dr. ${doctorName || 'Doctor'} 👋 I can help you check bed availability, nurse status, patient counts, and more. What do you need?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  const bottomRef = useRef(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [chatLockedMessage, setChatLockedMessage] = useState('');
  const [chatAccessChecked, setChatAccessChecked] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !chatAccessChecked) {
      api.post('/chatbot/query', { message: 'ping' })
        .then(() => {
          setChatLocked(false);
          setChatAccessChecked(true);
        })
        .catch(err => {
          if (err.response?.status === 403) {
            setChatLocked(true);
            setChatLockedMessage(err.response.data.message || 'Chat access not enabled.');
          }
          setChatAccessChecked(true);
        });
    }
  }, [open, chatAccessChecked]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const isContactAdmin = CONTACT_TRIGGERS.some(t => msg.toLowerCase().includes(t));

    setMessages(prev => [...prev, { from: 'user', text: msg }]);

    if (isContactAdmin) {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: "Sure, I'll help you contact the admin. What message would you like to send?",
        showAdminInput: true
      }]);
      setAdminMode(true);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/chatbot/query', { message: msg });
      setMessages(prev => [...prev, { from: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I had trouble fetching that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendAdminRequest = async () => {
    if (!adminMsg.trim()) return;
    setLoading(true);
    try {
      await api.post('/chatbot/contact-admin', { message: adminMsg, type: 'general', priority: 'medium' });
      setMessages(prev => [...prev, { from: 'bot', text: '✅ Your message has been sent to the admin. They will respond shortly.' }]);
      setAdminMode(false);
      setAdminMsg('');
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Failed to send message to admin. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      if (adminMode) sendAdminRequest();
      else sendMessage();
    }
  };

  return (
    <>
      <button
        style={styles.bubble}
        onClick={() => setOpen(o => !o)}
        title="Hospital Assistant"
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <div>
              <p style={styles.headerTitle}>🏥 Hospital Assistant</p>
              <p style={styles.headerSub}>Ask about beds, nurses, patients & more</p>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div style={styles.messages}>
            {chatLocked ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
                <div style={{ fontSize: 40 }}>🔒</div>
                <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>Chat access not enabled</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{chatLockedMessage || 'Contact your administrator to enable chatbot access for your account.'}</p>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
              <div key={i} style={m.from === 'bot' ? styles.msgBot : styles.msgUser}>
                {m.text}
                {m.showAdminInput && (
                  <button style={styles.adminBtn} onClick={() => setAdminMode(true)}>
                    Type your admin message below ↓
                  </button>
                )}
              </div>
            ))}
                {loading && <div style={styles.typing}>Thinking...</div>}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {!adminMode && !chatLocked && (
            <div style={styles.chips}>
              {QUICK_CHIPS.map(c => (
                <button key={c} style={styles.chip} onClick={() => sendMessage(c)}>{c}</button>
              ))}
            </div>
          )}

          <div style={styles.inputRow}>
            <input
              style={{ ...styles.input, opacity: chatLocked ? 0.5 : 1 }}
              value={adminMode ? adminMsg : input}
              disabled={chatLocked}
              onChange={e => adminMode ? setAdminMsg(e.target.value) : setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={adminMode ? 'Type your message to admin...' : 'Ask me anything...'}
            />
            <button
              style={styles.sendBtn}
              onClick={() => adminMode ? sendAdminRequest() : sendMessage()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
