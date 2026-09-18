import Header from '../components/Header';

const HomeLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#FFFCDD] flex flex-col font-['Roboto'] relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-10%] w-[500px] aspect-square rounded-full bg-[#FCCC0E]/10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] aspect-square rounded-full bg-[#F2D8A6]/30 pointer-events-none"></div>

      <Header />

      <main className="flex-1 flex flex-col items-center pt-12 pb-[40px] relative z-10">
        {children}

        
        <img
          src="../public/backgroundhome.png"
          alt="Illustration"
          className="w-[464px] h-[246px] object-cover mt-16"
        />

        <p className="font-['Supermercado_One',_cursive] text-[30px] text-black text-center mt-8">
          Bắt trọn mọi cảm xúc
        </p>
      </main>
    </div>
  );
};

export default HomeLayout;
