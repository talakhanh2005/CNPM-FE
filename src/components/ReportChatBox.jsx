import { useEffect, useRef, useState } from 'react';

const EMPTY_MESSAGES = [];

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
});

const ReportChatBox = ({ meetingCode, isOpen, onOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messagesByMeeting, setMessagesByMeeting] = useState({});
  const messagesEndRef = useRef(null);
  const messages = messagesByMeeting[meetingCode] || EMPTY_MESSAGES;
  const messageCount = messages.length;

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messageCount]);

  if (!meetingCode) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;

    setMessagesByMeeting((current) => ({
      ...current,
      [meetingCode]: [
        ...(current[meetingCode] || []),
        createMessage('user', content),
        createMessage('assistant', 'đéo biết'),
      ],
    }));
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setInput('');
          onOpen();
        }}
        aria-label="Mở trợ lý báo cáo"
        title="Mở trợ lý báo cáo"
        data-meeting-code={meetingCode}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-pure-black bg-role-accent text-role-contrast shadow-[5px_5px_0px_#000000] transition-transform hover:-translate-y-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000000]"
      >
        <span className="material-symbols-outlined text-[30px]">chat</span>
      </button>
    );
  }

  return (
    <section
      aria-label="Trợ lý báo cáo"
      data-meeting-code={meetingCode}
      className="fixed bottom-4 right-4 z-50 flex h-[min(32rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden border-[3px] border-pure-black bg-off-white shadow-[7px_7px_0px_#000000] sm:bottom-6 sm:right-6 sm:w-96"
    >
      <header className="flex shrink-0 items-center gap-3 border-b-[3px] border-pure-black bg-role-accent text-role-contrast px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Thu nhỏ khung chat"
          title="Thu nhỏ"
          className="flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-pure-black bg-off-white shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <span className="material-symbols-outlined text-[22px]">remove</span>
        </button>
        <div className="min-w-0">
          <h2 className="font-headline text-body-md font-bold">Trợ lý báo cáo</h2>
          <p className="truncate font-mono text-[11px] text-role-contrast/80" title={meetingCode}>
            Mã phòng: {meetingCode}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-container-low p-4" aria-live="polite">
        {!messages.length && (
          <div className="border-[2px] border-dashed border-pure-black bg-surface p-4 text-center text-body-sm text-on-surface-variant">
            Nhập câu hỏi về báo cáo meeting này.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[82%] border-[2px] border-pure-black px-3 py-2 text-body-sm font-medium shadow-[2px_2px_0px_#000000] ${
              message.role === 'user'
                ? 'bg-role-accent text-role-contrast'
                : 'bg-bright-yellow text-pure-black'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex shrink-0 gap-2 border-t-[3px] border-pure-black bg-off-white p-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập câu hỏi..."
          aria-label="Nội dung câu hỏi"
          className="min-w-0 flex-1 border-[2px] border-pure-black bg-white px-3 py-2 text-body-sm outline-none focus:bg-role-soft"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Gửi câu hỏi"
          className="flex h-10 w-11 shrink-0 items-center justify-center border-[2px] border-pure-black bg-role-accent text-role-contrast shadow-[2px_2px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[21px]">send</span>
        </button>
      </form>
    </section>
  );
};

export default ReportChatBox;
