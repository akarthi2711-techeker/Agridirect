import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, Loader2, Wifi, ChevronDown, Trash2 } from 'lucide-react';
import { aiAPI } from '../../services/api';

// ─── Quick action buttons config ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '🌾', label: "Today's Market Price", message: 'What is the tomato price today?', intent: 'price' },
  { icon: '📈', label: 'Price Trend Analysis', message: 'Show tomato price trend for last 30 days', intent: 'trend' },
  { icon: '🏪', label: 'Best Nearby Market', message: 'Which nearby market gives better price for tomato?', intent: 'nearby' },
  { icon: '🚜', label: 'Crop Recommendation', message: 'What crops are suitable for my soil and season?', intent: 'recommend' },
  { icon: '💰', label: 'Should I Sell Now?', message: 'Should I sell my tomatoes now?', intent: 'sell' },
  { icon: '🌦', label: 'Seasonal Crop Advice', message: 'What crops should I grow this season?', intent: 'seasonal' },
];

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-paddy-green flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-paddy-green text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-700'
        }`}
      >
        {msg.text}
        <p className={`text-[10px] mt-1 ${isUser ? 'text-green-200 text-right' : 'text-gray-400 dark:text-gray-500'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-paddy-green flex items-center justify-center mr-2 flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 rounded-full bg-paddy-green animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-paddy-green animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-paddy-green animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AIAdvisor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history once on open
  useEffect(() => {
    if (!open || historyLoaded) return;
    aiAPI.chatHistory(30)
      .then(({ data }) => {
        if (data.success && data.messages.length > 0) {
          const loaded = data.messages.map(m => ({
            id: m.timestamp,
            role: m.role,
            text: m.message,
            timestamp: m.timestamp,
          }));
          setMessages(loaded);
        } else {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            text: "👋 Vanakkam! I'm your AgriDirect AI Market Advisor. Ask me about crop prices, market trends, or what to grow this season!",
            timestamp: new Date().toISOString(),
          }]);
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: "👋 Vanakkam! I'm your AgriDirect AI Market Advisor. Ask me about crop prices, market trends, or what to grow this season!",
          timestamp: new Date().toISOString(),
        }]);
        setHistoryLoaded(true);
      });
  }, [open, historyLoaded]);

  // Auto scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  }, []);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = useCallback(async (text, intent = null) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiAPI.chat(text.trim(), intent);
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errText = err.response?.data?.message || 'Service temporarily unavailable. Please try again in a moment.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `⚠️ ${errText}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleQuickAction = (action) => sendMessage(action.message, action.intent);

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: "Chat cleared. How can I help you with market information?",
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-paddy-green text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Open AI Advisor"
        title="AgriDirect AI Market Advisor"
      >
        <span className="text-2xl">🌾</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer ── */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-gray-50 dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="AI Market Advisor"
      >
        {/* Header */}
        <div className="bg-paddy-green text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">AgriDirect AI Market Advisor</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Wifi className="w-3 h-3 text-emerald-300" />
                <span className="text-[11px] text-emerald-200">Powered by Amazon Bedrock · Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} title="Clear chat" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.intent}
                onClick={() => handleQuickAction(a)}
                disabled={loading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-paddy-green text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder="Ask about prices, markets, crops..."
              rows={1}
              maxLength={500}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-paddy-green/50 disabled:opacity-60 max-h-28 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-paddy-green text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Send"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
            AI responses are based on available market data only. Not financial advice.
          </p>
        </div>
      </div>
    </>
  );
}
