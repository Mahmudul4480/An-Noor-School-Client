import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  GraduationCap, 
  Languages, 
  ShieldCheck, 
  Gamepad2, 
  Tv, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter,
  ArrowRight,
  Menu,
  X,
  Users,
  Compass,
  Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-school-blue backdrop-blur-sm border-b border-white/10 h-24 flex items-center shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
             <motion.img 
               src="https://i.postimg.cc/15vr8swG/Logo-For-SMC-02.png" 
               alt="An-Noor Logo" 
               className="h-[80px] w-auto drop-shadow-md"
               referrerPolicy="no-referrer"
               whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
               transition={{ 
                 default: { type: "spring", stiffness: 300 },
                 rotate: { type: "tween", duration: 0.5 } 
               }}
             />
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <a href="#home" className="text-xs font-black text-white uppercase tracking-widest hover:text-school-gold transition-colors">Home</a>
            <a href="#about" className="text-xs font-black text-white uppercase tracking-widest hover:text-school-gold transition-colors">Academics</a>
            <a href="#facilities" className="text-xs font-black text-white uppercase tracking-widest hover:text-school-gold transition-colors">Facilities</a>
            <a href="#admission" className="text-xs font-black text-white uppercase tracking-widest hover:text-school-gold transition-colors">Admission</a>
            <a href="#contact" className="text-xs font-black text-white uppercase tracking-widest hover:text-school-gold transition-colors">Contact Us</a>
            <Link to="/login" className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-black/20">
              User Dashboard
            </Link>
          </div>
          
          <button className="lg:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-24 left-0 right-0 bg-school-blue border-b border-white/10 px-6 py-8 flex flex-col gap-6 z-50 shadow-2xl"
          >
            <a href="#home" className="text-sm font-black text-white uppercase tracking-widest" onClick={() => setIsOpen(false)}>Home</a>
            <a href="#about" className="text-sm font-black text-white uppercase tracking-widest" onClick={() => setIsOpen(false)}>Academics</a>
            <a href="#facilities" className="text-sm font-black text-white uppercase tracking-widest" onClick={() => setIsOpen(false)}>Facilities</a>
            <a href="#admission" className="text-sm font-black text-white uppercase tracking-widest" onClick={() => setIsOpen(false)}>Admission</a>
            <a href="#contact" className="text-sm font-black text-white uppercase tracking-widest" onClick={() => setIsOpen(false)}>Contact Us</a>
            <Link to="/login" className="w-full text-center px-6 py-4 bg-school-gold text-school-blue rounded-xl text-sm font-black uppercase tracking-widest">
              User Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HeroSlider = () => {
  const slides = [
    {
      image: "https://i.postimg.cc/0N7h7z8D/Classroom.jpg",
      title: "SHAPING THE LEADERS OF TOMORROW",
      subtitle: "Committed to building a moral foundation through English & Arabic based education."
    },
    {
      image: "https://i.postimg.cc/PJ7SgHXG/Classroom-01.jpg",
      title: "EXTENDING MODERN FACILITIES",
      subtitle: "Experience a tech-enabled learning environment paired with deep Islamic culture."
    },
    {
      image: "https://i.postimg.cc/rsHfBTVX/Classroom-02.jpg",
      title: "EXCELLENCE IN EDUCATION",
      subtitle: "Preparing our students for academic success and moral leadership in the modern world."
    }
  ];

  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative h-screen min-h-[700px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {/* Dark Overlay for Text Visibility */}
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img 
            src={slides[currentSlide].image} 
            alt="School Slide" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 h-full flex items-center justify-center text-center px-4 pt-24">
        <div className="max-w-5xl">
          <motion.h1 
            key={`title-${currentSlide}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] uppercase tracking-tight mb-8"
          >
            {slides[currentSlide].title}
          </motion.h1>
          <motion.p 
            key={`subtitle-${currentSlide}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-white/90 font-medium mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            {slides[currentSlide].subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <button className="px-12 py-5 bg-school-gold text-school-blue rounded-xl font-black uppercase tracking-widest text-sm hover:bg-white hover:scale-105 transition-all shadow-2xl shadow-black/30">
              Admission Open 2024
            </button>
            <Link to="/login" className="px-12 py-5 bg-school-blue border-2 border-white/20 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-white/10 hover:scale-105 transition-all shadow-2xl shadow-black/30 backdrop-blur-sm">
              Parent Portal Login
            </Link>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-4">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              "h-2 transition-all rounded-full",
              currentSlide === idx ? "bg-school-gold w-16" : "bg-white/30 w-4"
            )}
          />
        ))}
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-school-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-school-gold font-black uppercase tracking-widest text-xs mb-4 block">Our Heritage • Estd 2023</span>
            <h2 className="text-4xl md:text-5xl font-black text-school-blue uppercase tracking-tight mb-8 leading-tight">English & Arabic <br/><span className="text-school-gold">Based Education</span></h2>
            <div className="w-20 h-2 bg-school-blue mb-8 rounded-full" />
            <p className="text-slate-600 text-lg leading-relaxed mb-6 font-medium">
              An-Noor International School is a premier educational institution in Chattogram, dedicated to merging modern academic excellence with sacred moral foundations.
            </p>
            <p className="text-slate-600 mb-10 leading-relaxed">
              Our unique approach combines British curriculum rigour with specialized Arabic linguistics and a world-class Hifz department. We believe that true leaders are built on a bedrock of knowledge and character.
            </p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-xl bg-school-blue/5 flex items-center justify-center text-school-blue flex-shrink-0">
                    <BookOpen />
                 </div>
                 <div>
                    <h4 className="font-black text-school-blue uppercase text-sm mb-1 tracking-tight">Modern Academic</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">World-Class Standards</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-xl bg-school-gold/10 flex items-center justify-center text-school-gold flex-shrink-0">
                    <Languages />
                 </div>
                 <div>
                    <h4 className="font-black text-school-gold uppercase text-sm mb-1 tracking-tight">Islamic Values</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rooted in Faith</p>
                 </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white group">
              <img 
                src="https://i.postimg.cc/cCzFpWsV/Teachers-01.jpg" 
                alt="Our Dedicated Team" 
                className="w-full h-auto aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-school-blue p-10 rounded-[2.5rem] shadow-2xl hidden md:block max-w-[240px] text-center border-4 border-white">
              <p className="text-school-gold font-black text-4xl mb-2">100%</p>
              <p className="text-xs font-black text-white uppercase tracking-widest leading-relaxed">Secured Islamic Environment</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Facilities = () => {
  const facilityItems = [
    {
      title: "Smart Classrooms",
      subtext: "Multimedia-equipped learning environment.",
      icon: <Tv className="text-blue-500" />,
      image: "https://i.postimg.cc/0N7h7z8D/Classroom.jpg",
      bg: "bg-blue-50"
    },
    {
      title: "Expert Teachers",
      subtext: "Highly qualified and dedicated educators.",
      icon: <Users className="text-amber-500" />,
      image: "https://i.postimg.cc/vm5C54Q5/Teachers.jpg",
      bg: "bg-amber-50"
    },
    {
      title: "Hifz Department",
      subtext: "Dedicated program for Quranic mastery and Hifz.",
      icon: <BookOpen className="text-emerald-500" />,
      image: "https://picsum.photos/seed/quran-hifz/600/400",
      bg: "bg-emerald-50"
    },
    {
      title: "Safe Play Zone",
      subtext: "Engaging and secure physical play areas for kids.",
      icon: <Gamepad2 className="text-purple-500" />,
      image: "https://picsum.photos/seed/playground-safe/600/400",
      bg: "bg-purple-50"
    }
  ];

  return (
    <section id="facilities" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-school-gold font-black uppercase tracking-widest text-xs mb-4 block">World-Class Highlights</span>
          <h2 className="text-4xl font-black text-school-blue uppercase tracking-tight">Our Facilities & Departments</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {facilityItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", item.bg)}>
                    {item.icon}
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-black text-school-blue uppercase tracking-tight mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.subtext}</p>
                <button className="mt-6 text-xs font-black text-school-gold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  Details <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatsCounter = () => {
  const stats = [
    { value: "50+", label: "Expert Teachers", icon: <Users size={32} /> },
    { value: "10+", label: "Modern Classrooms", icon: <Tv size={32} /> },
    { value: "100%", label: "Islamic Environment", icon: <Compass size={32} /> }
  ];

  return (
    <section className="py-20 bg-school-blue relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 border-8 border-white rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 border-8 border-white rounded-full" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-12">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-school-gold mb-6 flex justify-center">{stat.icon}</div>
              <div className="text-5xl lg:text-6xl font-black text-white mb-2 leading-none uppercase tracking-tighter">{stat.value}</div>
              <div className="text-sm font-black text-white/60 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-16 mb-20">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-school-blue font-black text-2xl border-2 border-school-gold">
                A
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">An-Noor</h1>
                <p className="text-[10px] text-school-gold font-black uppercase tracking-widest">International School</p>
              </div>
            </div>
            <p className="text-slate-400 max-w-md mb-8 leading-relaxed font-medium">
              A pioneering institution in Chattogram, merging worldly academic excellence with sacred moral foundations. Built to inspire, educate, and lead.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                 <MapPin className="text-school-gold mt-1" size={20} />
                 <p className="text-slate-400 text-sm font-medium">Near Goni Bakery, Rahamotgonj,<br/>Chittagong, Bangladesh</p>
              </div>
              <div className="flex items-center gap-4">
                 <Phone className="text-school-gold" size={20} />
                 <p className="text-slate-400 text-sm font-medium">+880 1234 567890</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-10 text-white border-b border-white/10 pb-4">Quick Links</h4>
            <ul className="space-y-6">
              <li><a href="#" className="font-bold text-slate-400 hover:text-school-gold transition-colors block text-sm">Notice Board</a></li>
              <li><a href="#" className="font-bold text-slate-400 hover:text-school-gold transition-colors block text-sm">Fees Policy</a></li>
              <li><a href="#" className="font-bold text-slate-400 hover:text-school-gold transition-colors block text-sm">School Gallery</a></li>
              <li><a href="#" className="font-bold text-slate-400 hover:text-school-gold transition-colors block text-sm">Academic Calendar</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-10 text-white border-b border-white/10 pb-4">Connect With Us</h4>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Stay updated with our latest activities and achievements.</p>
            <div className="flex gap-4 mb-8">
              <a href="https://facebook.com/An.Noor.International.School" target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-school-gold hover:text-school-blue transition-all">
                <Facebook size={24} />
              </a>
              <a href="#" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-school-gold hover:text-school-blue transition-all">
                <Instagram size={24} />
              </a>
              <a href="#" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-school-gold hover:text-school-blue transition-all">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">© 2024 An-Noor International School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSlider />
        <AboutSection />
        <Facilities />
        <StatsCounter />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
