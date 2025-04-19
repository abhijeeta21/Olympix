'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const visualizationsRef = useRef(null);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Check if visualization section is in view
      if (visualizationsRef.current) {
        const rect = visualizationsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          setShowCards(true);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToVisualizations = (e) => {
    e.preventDefault();
    setShowCards(true);
    visualizationsRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
  
  // Define visualization categories with their corresponding routes and colors
  const visualizationCategories = [
    { 
      name: 'Medal Dashboard', 
      route: '/medal_dashboard', 
      description: 'Interactive global medal counts and rankings',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      borderColor: 'border-blue-400',
      icon: '🏅'
    },
    { 
      name: 'Age vs Performance', 
      route: '/age_performance', 
      description: 'Analyze how age affects Olympic performance',
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      borderColor: 'border-green-400',
      icon: '📊'
    },
    { 
      name: 'Gender Participation', 
      route: '/gender_participation', 
      description: 'Evolution of gender balance in Olympics',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      borderColor: 'border-purple-400',
      icon: '⚖️'
    },
    { 
      name: 'Sports Analysis', 
      route: '/sports', 
      description: 'Compare metrics across different sports',
      color: 'bg-amber-600',
      hoverColor: 'hover:bg-amber-700',
      borderColor: 'border-amber-400',
      icon: '🏊'
    },
    { 
      name: 'Country Analysis', 
      route: '/countries', 
      description: 'Nation-specific Olympic performance data',
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      borderColor: 'border-red-400',
      icon: '🌎'
    },
    { 
      name: 'Miscellaneous', 
      route: '/miscellaneous', 
      description: 'Additional interesting Olympic insights',
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      borderColor: 'border-indigo-400',
      icon: '🔍'
    }
  ];

  return (
    <main className="min-h-screen relative text-white overflow-hidden">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.4) saturate(1.2)' }}
        >
          <source src="/project_video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0"></div>
      </div>
      
      {/* Navigation Bar */}
      <nav className={`w-full backdrop-blur fixed top-0 left-0 z-20 transition-all duration-300 ${
        scrolled ? 'bg-black/70 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl">🏆</span>
                <span className="text-white font-bold text-xl tracking-tight">Olympics Viz</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {visualizationCategories.map((category) => (
                  <Link 
                    key={category.route}
                    href={category.route} 
                    className={`text-gray-200 ${category.hoverColor} hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:shadow-md hover:shadow-${category.color.split('-')[1]}-500/30`}
                  >
                    <span className="mr-1">{category.icon}</span> {category.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-blue-700 focus:outline-none transition-colors"
                aria-expanded="false"
              >
                <svg
                  className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/90 backdrop-blur shadow-xl">
            {visualizationCategories.map((category) => (
              <Link 
                key={category.route}
                href={category.route} 
                className={`${category.color} text-white flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="w-full mx-auto flex flex-col min-h-screen relative z-10 pt-16 pb-12 px-4">
        {/* Hero Section */}
        <div className="text-center space-y-8 py-16 md:py-24">
          <div className="relative inline-block mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-tight drop-shadow-lg">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Olympics</span> Data
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Visualization</span>
            </h1>
            <div className="absolute -top-6 -left-6 w-12 h-12 border-t-4 border-l-4 border-blue-400 opacity-70"></div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 border-b-4 border-r-4 border-pink-400 opacity-70"></div>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light drop-shadow-md">
            Explore interactive visualizations of Olympic Games data across time, countries, and sports
          </p>
          
          <div className="flex justify-center space-x-4">
            <a 
              href="#visualizations" 
              onClick={scrollToVisualizations}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center"
            >
              Explore Visualizations
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Visualization Categories - Card Grid */}
        <div id="visualizations" ref={visualizationsRef} className="max-w-6xl mx-auto w-full py-8">
          <h2 className="text-3xl font-bold text-center mb-12 relative drop-shadow-md">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Interactive Visualizations
            </span>
            <div className="absolute w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 bottom-0 left-1/2 transform -translate-x-1/2 mt-2"></div>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {visualizationCategories.map((category, index) => (
              <Link 
                key={category.name}
                href={category.route} 
                className={`group transition-all duration-500 ${showCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
                style={{ 
                  transitionDelay: showCards ? `${index * 100}ms` : '0ms'
                }}
              >
                <div 
                  className={`h-full ${category.color} rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-xl relative border ${category.borderColor} border-opacity-30 backdrop-blur-sm`}
                  style={{
                    backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent)'
                  }}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="text-4xl mb-4 opacity-90">{category.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-white/80 text-sm flex-grow">{category.description}</p>
                    <div className="mt-4 flex items-center text-sm text-white/90 font-medium">
                      <span>Explore</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transition-transform duration-300 transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-auto pt-12 pb-6 text-center text-gray-400 text-sm border-t border-white/10 mt-12">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
            <div className="flex space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-black border border-white/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <p className="font-medium text-white/80 mb-1">Olympic Data Visualization Project</p>
            <p className="text-gray-400">Built with D3.js and React</p>
            <div className="mt-4 text-xs">
              <p>© 2023 Olympics Visualization | All rights reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}