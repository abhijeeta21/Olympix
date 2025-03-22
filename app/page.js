// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;
    
    // Add search to history
    const newHistory = [searchQuery, ...searchHistory.slice(0, 9)]; // Keep only the 10 most recent searches
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    // Here you would typically redirect to search results page
    // For now, we'll just clear the search field
    setSearchQuery('');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-4xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-blue-900 tracking-tight">
            Olympics Data Analysis
          </h1>
          
          <p className="text-xl text-blue-700 max-w-2xl mx-auto">
            Explore historical Olympic Games data across countries and sports
          </p>
        </div>
        
        {/* Search Section */}
        <div className="w-full">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a country, athlete, or sport..."
              className="w-full p-4 pr-12 text-lg rounded-full border-2 border-blue-300 focus:border-blue-500 focus:outline-none shadow-md"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
          
          {/* History Tab */}
          <div className="mt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <span>Search History</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-1 transform transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showHistory && (
              <div className="mt-2 p-4 bg-white rounded-lg shadow-md">
                {searchHistory.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-700">Recent Searches</h3>
                      <button
                        onClick={clearHistory}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Clear All
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {searchHistory.map((query, index) => (
                        <li key={index} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          {query}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No recent searches</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Browse Section */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">browse by country or sport</p>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <Link href="/countries" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md text-center">
              Browse Countries
            </Link>
            <Link href="/sports" className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md text-center">
              Browse Sports
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12">
          &copy; {new Date().getFullYear()} Olympics Data Analysis Project
        </footer>
      </div>
    </main>
  );
}