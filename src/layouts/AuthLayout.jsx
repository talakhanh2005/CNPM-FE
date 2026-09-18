// File: src/layouts/AuthLayout.jsx
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#FFFEDD] flex overflow-hidden">
      
      
      <div className="hidden md:block w-[40%] xl:w-[467px] h-auto bg-[#8D2F15] relative shrink-0 overflow-hidden">
        
        {/* Các vòng tròn trang trí */}
        <div className="absolute top-[-10%] right-[-15%] w-[260px] aspect-square rounded-full bg-[#FCCC0E]/15"></div>
        <div className="absolute bottom-[-10%] left-[-20%] w-[250px] aspect-square rounded-full bg-white/10"></div>

        {/* Cụm Logo AI System (Căn lề trái 10% đồng bộ với logo camera bên dưới) */}
        <div className="absolute top-[12%] left-[10%] flex items-center gap-3 z-10">
          <div className="flex w-[48px] h-[48px] bg-[#f5e6e3] text-[#8D2F15] rounded-[14px] items-center justify-center font-black text-xl shadow-md">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-[0.2em] text-[15px] uppercase">System</span>
            <span className="text-white/70 text-[14px]">Emotion recognition</span>
          </div>
        </div>

        {/* Logo Camera */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-[85%] max-w-[380px] z-10">
          <img 
            src="/logo.png" 
            alt="Camera Logo" 
            className="w-full h-auto object-contain drop-shadow-2xl" 
          />
        </div>

      </div>

      
      <div className="flex-1 flex items-center justify-center relative p-6">
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] min-w-[280px] aspect-square rounded-full bg-[#F2D8A6]/55"></div>
        
        <div className="relative z-10 w-full max-w-[460px]">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;