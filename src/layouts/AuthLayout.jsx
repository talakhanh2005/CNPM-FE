import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface flex flex-col">
      {/* Neo-Bauhaus Top Header */}
      <header className="w-full bg-surface/90 backdrop-blur-xl border-b-[3px] border-pure-black px-gutter py-space-md flex items-center justify-between shrink-0 z-20">
        <Link to="/" className="flex items-center gap-space-sm hover:opacity-90 transition-opacity">
          <img
            alt="Neo-Learn AI Logo"
            className="h-8 w-auto object-contain"
            src="/bauhaus-logo.png"
          />
          <span className="font-headline text-headline-md font-bold text-on-surface tracking-tight">
            Neo-Learn AI
          </span>
        </Link>

        <div className="flex items-center gap-space-md">
          <div className="hidden sm:flex items-center gap-space-xs text-label-md text-on-surface-variant px-space-sm py-space-xs border-[3px] border-pure-black bg-surface-container-lowest shadow-[2px_2px_0px_#000000]">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-bold">Bauhaus Edu</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center border-[3px] border-pure-black shadow-[2px_2px_0px_#000000]">
            <span className="material-symbols-outlined text-on-primary-container text-[20px]">
              school
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full bg-surface flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;