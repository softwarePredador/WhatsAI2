import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const COLORS = [
  "#2563eb", // azul profissional
  "#6366f1", // roxo suave
  "#64748b", // cinza azulado
  "#0ea5e9"  // azul claro
];
function HomePage() {
  const color = useMotionValue(COLORS[0]);
  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%,
      ${'#fff'} 50%,${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;
  const navigate = useNavigate();

  useEffect(() => {
    animate(color, COLORS, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  return (
    <div className="homepage-wrapper">
      <motion.section
        style={{
          backgroundImage,
        }}
        className={`relative grid min-h-screen 
          place-content-center overflow-hidden bg-gray-950 px-4
          py-24 ${'text-gray-800'}`}
      >
        <div className='relative z-10 flex flex-col items-center justify-center text-center'>

          <h1 className='mb-4 text-5xl font-bold tracking-tight sm:text-6xl'>
            Welcome to WhatsAI
          </h1>  
          <p className='mb-8 text-lg font-normal sm:text-xl'>
            Your all-in-one finance management app.
          </p>
          
          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <motion.button 
              onClick={() => navigate('/register')}
              className={`group relative flex w-fit items-center
                gap-1.5 rounded-full bg-gray-950/10 px-6 py-3
                ${'text-gray-800'} transition-colors hover:bg-gray-950/50`}
              whileHover={{
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.985,
              }}
              style={{
                border,
                boxShadow,
              }}
            >
              Start Tracking Now 
              <motion.span
                initial={{ x: 0 }}
                className="inline-block"
                whileHover={{ x: 3, transition: { repeat: Infinity, repeatType: "reverse", duration: 0.6 } }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </motion.button>

            <motion.button 
              onClick={() => navigate('/instances')}
              className={`group relative flex w-fit items-center
                gap-1.5 rounded-full bg-transparent px-6 py-3
                ${'text-gray-800'} transition-colors hover:bg-gray-950/10`}
              whileHover={{
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.985,
              }}
              style={{
                border,
              }}
            >
              Ver Minhas Instâncias
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </motion.button>
          </div>
          {/* Floating decorations */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        </div>
      </motion.section>
    </div>
  );
}

export default HomePage;