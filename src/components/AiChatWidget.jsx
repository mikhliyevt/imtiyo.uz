import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, MessageSquareText, Send, Sparkles, X } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

export default function AiChatWidget() {
  const location = useLocation();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: 'welcome-1', sender: 'bot', textKey: 'ai.welcome' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  const isAdminRoute = String(location?.pathname || '').startsWith('/admin');

  const quickPrompts = [t('ai.q1'), t('ai.q2'), t('ai.q3')];

  const getSmartReply = (question) => {
    const q = question.toLowerCase();
    if (
      q.includes('tasdiq') ||
      q.includes('hujjat') ||
      q.includes('guvohnoma') ||
      q.includes('hemis') ||
      q.includes('verify') ||
      q.includes('status') ||
      q.includes('подтверд') ||
      q.includes('статус')
    ) {
      return t('ai.replyVerify');
    }
    if (
      q.includes('chegirma') ||
      q.includes('aksiya') ||
      q.includes('brend') ||
      q.includes('discount') ||
      q.includes('deal') ||
      q.includes('скидк')
    ) {
      return t('ai.replyDeals');
    }
    if (q.includes('promo') || q.includes('kod') || q.includes('code') || q.includes('qr') || q.includes('промо')) {
      return t('ai.replyPromo');
    }
    return t('ai.replyDefault');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open, lang]);

  const sendMessage = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    const userMsg = { id: 'u-' + Date.now(), sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botMsg = {
        id: 'b-' + Date.now(),
        sender: 'bot',
        text: getSmartReply(trimmed),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (isAdminRoute) return null;

  return (
    <div className="fixed right-5 bottom-5 z-50 hidden md:block">
      {open && (
        <div className="mb-2.5 flex h-[410px] w-[310px] flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-[0_22px_60px_-15px_rgba(0,45,150,0.45)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#002D96] via-[#1D6FF2] to-[#00A9FF] px-3.5 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-[13px] font-extrabold leading-none">IMTIYO AI</h3>
                <p className="mt-0.5 text-[10px] text-white/80">{t('ai.subtitle')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn('flex items-end gap-1.5', isUser ? 'justify-end' : 'justify-start')}
                >
                  {!isUser && (
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#002D96]/10 text-[#002D96] dark:bg-sky-500/15 dark:text-sky-400">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-[12px] font-medium leading-relaxed',
                      isUser
                        ? 'rounded-br-sm bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white'
                        : 'rounded-bl-sm border border-slate-100 bg-slate-50 text-[#08123A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    )}
                  >
                    {msg.textKey ? t(msg.textKey) : msg.text}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="text-[11px] font-semibold text-slate-400">{t('ai.typing')}</div>
            )}

            <div className="flex flex-wrap gap-1 pt-1">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-[#1D6FF2]/30 bg-[#1D6FF2]/[0.06] px-2.5 py-1 text-[10.5px] font-bold text-[#002D96] hover:bg-[#1D6FF2]/15 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 border-t border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className="h-8 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-[#08123A] outline-none focus:border-[#1D6FF2] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#002D96] to-[#1D6FF2] text-white disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* IXCHAMLASHTIRILGAN TUGMA (enidan qisqa) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/80 bg-gradient-to-r from-[#002D96] via-[#1D6FF2] to-[#00A9FF] py-1.5 pl-1.5 pr-3.5 text-white shadow-[0_14px_32px_-8px_rgba(0,45,150,0.85)] transition-transform hover:scale-[1.03]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
          {open ? <X className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
        </span>
        <span className="text-[12px] font-extrabold tracking-tight">AI Yordamchi</span>
      </button>
    </div>
  );
}