import { useEffect, useState, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { PiRobotDuotone } from 'react-icons/pi';
import { FiSend } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './ChatBox.css';

const defaultOptions = [
  'Bạn là ai ?',
  'Tìm sản phẩm dưới 10 triệu',
  'Tư vấn mẫu điện thoại quốc dân',
  'Tư vấn MacBook chuyên đồ họa',
];

const sessionId = crypto.randomUUID()
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
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isBotTyping]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const createMessage = (from, text) => ({
    from,
    text,
    timestamp: new Date().toISOString(),
  });

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
        body: JSON.stringify({ chatInput: text, sessionId: sessionId }),
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

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = createMessage('bot', 'Bạn cần hỗ trợ gì?');
      setMessages([welcome]);
      setShowOptions(true);
    }
  }, [isOpen, messages.length]);

  return (
    <div className="chatbox-container">
      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            <img src="/lkn.png" alt="Logo" className="chatbox-logo" />
            <span>AI Agent Assistant</span>
            <IoClose onClick={toggleChat} className="close-btn" />
          </div>

          <div className="chatbox-body">
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
            <div ref={bottomRef} />
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              rows={2}
            />
            <button onClick={() => handleSend(input)} title="Gửi">
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