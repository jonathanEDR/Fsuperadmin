import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, Clock, Pizza, User, CheckCircle } from 'lucide-react';

function Home() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const quickAccess = [
    {
      icon: Users,
      title: "Personal de Cocina",
      description: "Chefs, ayudantes y pizzeros",
      role: "kitchen",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "Administración",
      description: "Gerentes y supervisores", 
      role: "admin",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Clock,
      title: "Delivery",
      description: "Repartidores y coordinadores",
      role: "delivery",
      color: "from-green-500 to-green-600"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-orange-900 relative">
        {/* Efectos de fondo mejorados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradientes animados más sutiles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-red-400/5 to-orange-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          
          {/* Patrón de pizza más elegante */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute top-20 left-20">
              <Pizza className="w-32 h-32 text-white rotate-12" />
            </div>
            <div className="absolute bottom-32 right-32">
              <Pizza className="w-24 h-24 text-white -rotate-12" />
            </div>
            <div className="absolute top-1/2 left-10">
              <Pizza className="w-20 h-20 text-white rotate-45" />
            </div>
            <div className="absolute bottom-20 left-1/3">
              <Pizza className="w-16 h-16 text-white -rotate-45" />
            </div>
          </div>

          {/* Líneas decorativas */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
          </div>
        </div>

        {/* Container principal mejorado */}
        <div className="relative z-10 min-h-screen flex flex-col">
          
          {/* Header profesional */}
          <header className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {/* Branding con Logo */}
              <div className="flex flex-col items-center mb-8 lg:mb-12">
                <div className="relative mb-4">
                  <div className="w-56 h-16 lg:w-72 lg:h-20 flex items-center justify-center">
                    <img
                      src="/roxi3.png"
                      alt="Roxi Pizzas"
                      className="max-w-full max-h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                </div>
                <p className="text-red-200 font-medium text-sm lg:text-base">
                  Sistema de Gestión Interno
                </p>

                {/* Badge de estado */}
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-2 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-medium">Sistema Operativo</span>
                </div>
              </div>
            </div>
          </header>

          {/* Contenido principal mejorado */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                
                {/* Panel de Acceso rediseñado */}
                <div className="order-2 lg:order-1">
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/20 hover:shadow-3xl transition-all duration-500">
                    
                    {/* Header del panel */}
                    <div className="text-center mb-8 lg:mb-10">
                      <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl overflow-hidden shadow-2xl">
                          <img
                            src="/logocuadrado.png"
                            alt="Roxi Pizzas"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 tracking-tight">
                        Acceso al Sistema
                      </h2>
                      <p className="text-gray-600 text-base lg:text-lg leading-relaxed max-w-sm mx-auto">
                        Elige tu método de acceso para comenzar a trabajar
                      </p>
                    </div>

                    {/* Botones de acceso mejorados */}
                    <div className="space-y-4 lg:space-y-5">
                      <button
                        onClick={() => navigate('/login')}
                        className="group relative w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 lg:py-5 rounded-2xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold text-lg lg:text-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <Shield className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" />
                        <span className="relative z-10">Iniciar Sesión</span>
                        <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />
                      </button>

                      <button
                        onClick={() => navigate('/signup')}
                        className="group relative w-full bg-white border-2 border-red-600 text-red-600 py-4 lg:py-5 rounded-2xl hover:bg-red-50 hover:border-red-700 hover:text-red-700 transition-all duration-300 font-semibold text-lg lg:text-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-50/0 via-red-50/50 to-red-50/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <User className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" />
                        <span className="relative z-10">Registrarse</span>
                        <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />
                      </button>
                    </div>

                    {/* Footer del panel */}
                    <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-gray-200">
                      <p className="text-center text-sm lg:text-base text-gray-500 leading-relaxed">
                        ¿Problemas para acceder?{' '}
                        <button className="text-red-600 hover:text-red-700 font-medium underline decoration-red-600/30 hover:decoration-red-700 underline-offset-2 transition-colors">
                          Contacta al administrador
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panel de Información rediseñado */}
                <div className="order-1 lg:order-2 space-y-6 lg:space-y-8">
                  
                  {/* Título de bienvenida */}
                  <div className="text-center lg:text-left">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-6 tracking-tight leading-tight">
                      Bienvenido al
                      <span className="block bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                        Sistema
                      </span>
                    </h3>
                    <p className="text-red-100 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
                      Accede a todas las herramientas que necesitas para gestionar tu trabajo 
                      en <span className="font-semibold text-orange-200">Pizzas Roxi</span> de manera eficiente y profesional.
                    </p>
                  </div>

                  {/* Cards de acceso rápido mejoradas */}
                  <div className="grid gap-4 lg:gap-5">
                    {quickAccess.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => navigate('/login')}
                        className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        {/* Efecto de brillo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex items-center gap-4 lg:gap-6">
                          <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r ${item.color} rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                            <item.icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl lg:text-2xl font-bold text-white mb-1 lg:mb-2 group-hover:text-orange-200 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-red-100 text-sm lg:text-base leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estado del sistema mejorado */}
                  <div className="relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl lg:rounded-3xl p-6 lg:p-8 backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-400/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 lg:gap-4 mb-4">
                        <div className="relative">
                          <CheckCircle className="w-7 h-7 lg:w-8 lg:h-8 text-green-400" />
                          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h4 className="text-lg lg:text-xl font-bold text-white">Sistema Operativo</h4>
                        <div className="ml-auto bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                          En línea
                        </div>
                      </div>
                      <p className="text-green-100 text-sm lg:text-base leading-relaxed">
                        Todos los módulos están funcionando correctamente. 
                        <br className="hidden sm:block" />
                        <span className="font-medium text-green-200">Última actualización:</span> Hoy 8:30 AM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer mejorado */}
          <footer className="relative px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-t border-white/10 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img
                      src="/logocuadrado.png"
                      alt="Roxi Pizzas"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-red-200 text-sm lg:text-base font-medium">
                      © 2025 Pizzas Roxi - Sistema de Gestión Interno
                    </p>
                    <p className="text-red-300/70 text-xs lg:text-sm">
                      Versión 2.1.0 • 
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-red-200/80 text-xs lg:text-sm">
                  <span>Soporte técnico disponible 24/7</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return null;
}

export default Home;
