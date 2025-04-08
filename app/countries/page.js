'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/noc_summary.json'); // Fetch from public folder
        const data = await response.json();
        
        // Convert object to an array if needed
        const nocArray = Object.entries(data).map(([noc, details]) => ({
          noc,
          ...details
        }));

        setCountries(nocArray);
      } catch (error) {
        console.error('Error fetching countries data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic remains the same
  const filteredCountries = countries.filter(country => 
    country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country?.noc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block mb-6 text-blue-600 hover:text-blue-800">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 tracking-tight">
            Olympic Countries
          </h1>
          <p className="text-xl text-blue-700 max-w-2xl mx-auto">
            Explore medal counts and performance metrics by country
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a country..."
            className="w-full p-3 pl-10 text-lg rounded-full border-2 border-blue-300 focus:border-blue-500 focus:outline-none shadow-md text-blue-700 placeholder-gray-600"
          />
        </div>

        {/* Country Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCountries.map((country) => (
              <div key={country.noc} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{country.region}</h2>
                      <p className="text-gray-500 text-sm">{country.noc}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {country.medals.gold + country.medals.silver + country.medals.bronze} Medals
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Medal Count</h3>
                    <div className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                          {country.medals.gold}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">Gold</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                          {country.medals.silver}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">Silver</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold">
                          {country.medals.bronze}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">Bronze</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Top Sport</p>
                        <p className="font-medium">{country.topSport}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Athletes</p>
                        <p className="font-medium">{country.totalAthletes}</p>
                      </div>
                    </div>
                  </div>

                  {country && (
                    <Link href={`/countries/${country.noc.toLowerCase()}`}>

                    <button 
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      onClick={() => console.log(`View details for ${country.region}`)}
                    >
                      View Details
                    </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredCountries.length === 0 && (

          <div className="text-center py-10">
            <p className="text-lg text-gray-600">No countries found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pt-6 border-t border-gray-200">
          <p>&copy; {new Date().getFullYear()} Olympics Data Analysis Project</p>
        </footer>
      </div>
    </main>
  );
}