const LoadingPage = ({ message = 'Đang tải...' }) => (
  <main
    className="flex min-h-screen items-center justify-center bg-surface p-6 text-center font-body"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="border-[3px] border-pure-black bg-surface-container-lowest p-8 shadow-[8px_8px_0px_#000000]">
      <span
        className="material-symbols-outlined animate-spin text-[48px] text-bright-yellow"
        aria-hidden="true"
      >
        progress_activity
      </span>
      <p className="mt-4 font-headline text-headline-sm font-bold">{message}</p>
    </div>
  </main>
);

export default LoadingPage;
