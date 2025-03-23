// app/sports/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Sports() {
  const [sportsData, setSportsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the sports data from the JSON file
    fetch('/sports_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.sports) {
          setSportsData(data.sports);
        } else {
          console.error('Invalid data format:', data);
          setSportsData([]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading sports data:', error);
        setIsLoading(false);
      });
  }, []);

  // Filter sports based on search query
  const filteredSports = searchQuery.trim() === '' 
    ? sportsData 
    : sportsData.filter(sport => 
        sport.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 tracking-tight">
            Olympic Sports
          </h1>
          <p className="text-xl text-blue-700 max-w-2xl mx-auto">
            Explore medal counts and performance metrics by sport
          </p>
        </div>
        
        {/* Search Box */}
        <div className="w-full max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a sport..."
              className="w-full p-4 pr-12 text-lg rounded-full border-2 border-blue-300 focus:border-blue-500 focus:outline-none shadow-md"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Sports Cards Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-xl text-blue-700">Loading sports data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSports.length > 0 ? (
              filteredSports.map((sport) => (
                <div key={sport.name} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">{sport.name}</h2>
                        <p className="text-gray-600 text-sm">
                          {sport.first_appearance} - {sport.latest_appearance}
                        </p>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {sport.total_medals} Medals
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Medal Count</h3>
                      <div className="flex justify-between">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Countries</p>
                          <p className="text-xl font-bold text-blue-600">
                            {sport.participating_countries}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Events</p>
                          <p className="text-xl font-bold text-blue-600">
                            {sport.total_events}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Athletes</p>
                          <p className="text-xl font-bold text-blue-600">
                            {sport.total_athletes}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Countries</h3>
                      <div className="space-y-2">
                        {sport.top_countries && sport.top_countries.length > 0 ? (
                          sport.top_countries.map((country, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <p className="text-gray-800">{country.NOC}</p>
                              <p className="font-medium text-blue-700">{country.medal_count} medals</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No medal data available</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link href={`/sports/${encodeURIComponent(sport.name)}`} className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-600">No sports found matching your search.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Back to Home Button */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}