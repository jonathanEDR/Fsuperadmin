import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, BarChart3, Zap, Star, ChevronDown, Menu, X } from 'lucide-react';

function Home() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Shield,
      title: "Seguridad Avanzada",
      description: "Protección de datos de nivel empresarial con autenticación multifactor"
    },
    {
      icon: Users,
      title: "Gestión de Equipos",
      description: "Colabora eficientemente con tu equipo en tiempo real"
    },
    {
      icon: BarChart3,
      title: "Análisis Inteligente",
      description: "Insights profundos para tomar decisiones informadas"
    },
    {
      icon: Zap,
      title: "Rendimiento Óptimo",
      description: "Velocidad y eficiencia en cada proceso de tu negocio"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "CEO, TechInnovate",
      content: "Esta plataforma transformó completamente nuestra productividad. Increíble.",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      role: "Director de Operaciones",
      content: "La mejor inversión que hemos hecho para nuestro equipo de trabajo.",
      rating: 5
    },
    {
      name: "Ana Martínez",
      role: "Gerente General",
      content: "Interfaz intuitiva y potente. Exactamente lo que necesitábamos.",
      rating: 5
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100">
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200/40 to-cyan-200/40 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Header Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">AdminPro</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-800 transition-colors">Características</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors">Testimonios</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors">Precios</a>
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
              >
                Comenzar Gratis
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg">
              <div className="px-6 py-4 space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-gray-800 transition-colors">Características</a>
                <a href="#testimonials" className="block text-gray-600 hover:text-gray-800 transition-colors">Testimonios</a>
                <a href="#pricing" className="block text-gray-600 hover:text-gray-800 transition-colors">Precios</a>
                <button 
                  onClick={() => navigate('/login')}
                  className="block w-full text-left text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-center shadow-lg"
                >
                  Comenzar Gratis
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 px-6 py-20 md:py-32">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                <Star className="w-4 h-4" />
                Líder en gestión empresarial
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-800 mb-8 leading-tight">
              Gestiona tu
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Negocio
              </span>
              con Elegancia
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              La plataforma más avanzada para administrar tu empresa. Potencia tu productividad 
              con herramientas inteligentes y una experiencia excepcional.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-lg shadow-2xl flex items-center gap-2"
              >
                Empezar Ahora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate('/login')}
                className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-lg backdrop-blur-sm"
              >
                Ver Demo
              </button>
            </div>

            <div className="mt-16 flex justify-center">
              <ChevronDown className="w-8 h-8 text-gray-500 animate-bounce" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative z-10 px-6 py-20 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Características Excepcionales
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Diseñado para empresas que buscan la excelencia en cada detalle
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:bg-white/90 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-2xl transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Lo que Dicen Nuestros Clientes
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Empresas líderes confían en nuestra plataforma
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:bg-white/90 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-bold text-gray-800">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 px-6 py-20 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ¿Listo para Transformar tu Negocio?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Únete a miles de empresas que ya están revolucionando su forma de trabajar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-lg shadow-2xl flex items-center justify-center gap-2"
              >
                Comenzar Gratis Hoy
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-12 bg-white/60 backdrop-blur-sm border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">AdminPro</span>
              </div>
              <p className="text-gray-500 text-sm">
                © 2025 AdminPro. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

export default Home;
