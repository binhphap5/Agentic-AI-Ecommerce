import { useEffect, useState, useRef } from 'react';
import { IoClose, IoTrashOutline } from 'react-icons/io5';
import { PiRobotDuotone } from 'react-icons/pi';
import { FiSend } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './ChatBox.css';

const defaultOptions = [
  'Bạn là ai ?',
  'Tìm sản phẩm dưới 10 triệu',
  'Giá của iPad Air (M3) 11 inch Wi-Fi',
  'Tư vấn MacBook chuyên đồ họa',
];

// Function to get or create a session ID
const getSessionId = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user._id) {
    console.log("User ID found:", user._id);
    return user._id;
  }
  let anonymousId = localStorage.getItem('anonymous_session_id');
  console.log("Anonymous session ID found:", anonymousId);
  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    localStorage.setItem('anonymous_session_id', anonymousId);
  }
  return anonymousId;
};

const sessionId = getSessionId();

// Custom Confirmation Modal Component
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="confirm-modal-overlay">
    <div className="confirm-modal">
      <p>{message}</p>
      <div className="confirm-modal-buttons">
        <button onClick={onCancel} className="cancel-btn">Hủy</button>
        <button onClick={onConfirm} className="confirm-btn">Xác nhận</button>
      </div>
    </div>
  </div>
);

// Component to render markdown content
const MarkdownMessage = ({ text }) => (
  <ReactMarkdown
    children={text}
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={{
      img: ({ node, ...props }) => (
        <img
          {...props}
          style={{
            maxWidth: '100%',
            borderRadius: 8,
            margin: '8px 0'
          }}
        />
      ),
      a: ({ node, ...props }) => (
        <a {...props} style={{ color: '#007bff' }}>
          {props.children}
        </a>
      ),
      table: ({ node, ...props }) => (
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table
            {...props}
            style={{ width: '100%', maxWidth: '100%', borderCollapse: 'collapse' }}
          />
        </div>
      ),
      th: ({ node, ...props }) => (
        <th {...props} style={{ padding: '8px', backgroundColor: '#F3F4F6', textAlign: 'left' }} />
      ),
      td: ({ node, ...props }) => (
        <td {...props} style={{ padding: '8px' }} />
      ),
      code: ({ inline, children, className, ...props }) =>
        inline ? (
          <code className={className} {...props}>{children}</code>
        ) : (
          <pre className="bg-gray-800 text-white p-2 rounded">
            <code {...props}>{children}</code>
          </pre>
        )
    }}
  />
);

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const chatBodyRef = useRef(null);
  const createMessage = (from, text) => ({
    from,
    text,
    timestamp: new Date().toISOString(),
  });

  // Fetch history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;
      try {
        const response = await fetch(`http://localhost:8055/history/${sessionId}`);
        const history = await response.json();
        if (history && history.length > 0) {
          setMessages(history.map(msg => ({ ...msg, from: msg.from === 'human' ? 'user' : 'bot' })));
          setShowOptions(false);
        } else {
          const welcome = createMessage('bot', 'Bạn cần hỗ trợ gì?');
          setMessages([welcome]);
          setShowOptions(true);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
        const welcome = createMessage('bot', 'Chào bạn, tôi có thể giúp gì cho bạn?');
        setMessages([welcome]);
      }
    };

    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      const timer = setTimeout(() => {
        chatBody.scrollTo({
          top: chatBody.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [messages, isBotTyping]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = createMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowOptions(false);
    setIsBotTyping(true);

    let accumulatedResponse = "";

    try {
      const response = await fetch('http://localhost:8055/invoke-python-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: text, sessionId: sessionId,
          userID: JSON.parse(localStorage.getItem("user"))?._id || null
        }),

      });

      if (!response.body) {
        setIsBotTyping(false);
        return;
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let firstChunkReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setIsBotTyping(false);
          break;
        }

        if (!firstChunkReceived) {
          setIsBotTyping(false);
          setMessages((prev) => [...prev, createMessage('bot', '')]);
          firstChunkReceived = true;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonData = JSON.parse(line.substring(5));
              if (jsonData.chunk) {
                accumulatedResponse += jsonData.chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsgIndex = updated.length - 1;
                  if (lastMsgIndex >= 0 && updated[lastMsgIndex].from === 'bot') {
                    updated[lastMsgIndex] = { ...updated[lastMsgIndex], text: accumulatedResponse };
                    return updated;
                  }
                  return prev;
                });
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      setIsBotTyping(false);
      console.error('Failed to fetch from agent:', error);
      setMessages((prev) => {
        const filtered = prev.filter(msg => msg.from !== 'bot-loading');
        return [...filtered, createMessage('bot', 'Sorry, I am having trouble connecting.')];
      });
    }
  };

  const handleDeleteHistory = () => {
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!sessionId) return;
    setShowConfirmModal(false);
    try {
      const response = await fetch(`http://localhost:8055/history/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete history on the server.');
      }

      const welcome = createMessage('bot', 'Lịch sử trò chuyện đã được xóa. Bạn cần hỗ trợ gì?');
      setMessages([welcome]);
      setShowOptions(true);

    } catch (error) {
      console.error('Failed to delete history:', error);
      const errorMsg = createMessage('bot', 'Đã có lỗi xảy ra khi xóa lịch sử. Vui lòng thử lại.');
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chatbox-container">
      {showConfirmModal && (
        <ConfirmationModal
          message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            <img src="/lkn.png" alt="Logo" className="chatbox-logo" />
            <span className="header-title">AI Agent Assistant</span>
            <div className="header-buttons">
              <button onClick={handleDeleteHistory} className="header-btn" title="Xóa lịch sử">
                <IoTrashOutline size={20} />
              </button>
              <button onClick={toggleChat} className="header-btn" title="Đóng">
                <IoClose size={22} />
              </button>
            </div>
          </div>

          <div className="chatbox-body" ref={chatBodyRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg-wrapper ${msg.from}`}>
                {msg.from === 'bot' && (
                  <img src="/lkn.png" alt="Bot" className="chatbox-logo" />
                )}

                <div className={`chat-msg ${msg.from}`}>
                  <>
                    <div className="msg-text">
                      <MarkdownMessage text={msg.text} />
                    </div>
                    <div className="timestamp">{formatTime(msg.timestamp)}</div>
                  </>
                </div>
              </div>
            ))}
            {isBotTyping && (
              <div className="chat-msg-wrapper bot">
                <img src="/lkn.png" alt="Bot" className="chatbox-logo" />
                <div className="chat-msg bot">
                  <div className="loading-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>

          {showOptions && (
            <div className="chatbox-options">
              {defaultOptions.map((opt, i) => (
                <button key={i} onClick={() => handleSend(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="chatbox-footer">
            <textarea
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isBotTyping) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              rows={2}
              disabled={isBotTyping}  
              style={{
                cursor: isBotTyping ? 'not-allowed' : 'text',
                backgroundColor: isBotTyping ? '#f3f4f6' : undefined,
              }}
            />
            <button
              onClick={() => handleSend(input)}
              title="Gửi"
              disabled={isBotTyping}  
              style={{
                cursor: isBotTyping ? 'not-allowed' : 'pointer',
                opacity: isBotTyping ? 0.5 : 1
              }}
            >
              <FiSend size={25} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>

        </div>
      )}

      {!isOpen && (
        <div className="chat-toggle-btn shake" onClick={toggleChat}>
          <PiRobotDuotone size={26} />
        </div>
      )}
    </div>
  );
};

export default ChatBox;

