'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';


export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mapRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/noc_summary.json');
        const data = await response.json();
        
        const nocArray = Object.entries(data).map(([noc, details]) => ({
          noc,
          ...details
        }));

        // Fix for Canada - ensure we use "CAN" instead of "NFL" for Canadian data
        const canadaData = nocArray.find(country => country.noc === "CAN");
        if (canadaData && nocArray.find(country => country.noc === "NFL" && country.region === "Canada")) {
          console.log("Fixing Canada data - using CAN instead of NFL");
          // Remove any data incorrectly labeled as NFL for Canada
          const filteredArray = nocArray.filter(country => !(country.noc === "NFL" && country.region === "Canada"));
          setCountries(filteredArray);
        } else {
          setCountries(nocArray);
        }
        
        setIsLoading(false);
        
        // Create map after data is loaded (Note: createWorldMap function is not included in this snippet)
        // If createWorldMap relies on D3 or similar, ensure the library is loaded and the function is defined elsewhere
        // if (nocArray.length > 0) {
        //   setTimeout(() => createWorldMap(nocArray), 500);
        // }
      } catch (error) {
        console.error('Error fetching countries data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <div className="text-sm font-medium py-1 px-3 bg-blue-800 rounded-full">Country Analysis</div>
        </nav>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Olympic Countries
          </h1>
          <p className="text-xl text-blue-300 max-w-2xl mx-auto">
            Explore medal counts and performance metrics for countries in the Olympic Games
          </p>
        </div>

        {/* Search Bar and Compare Button */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a country..."
              className="w-full p-2 pl-10 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Link href="/countries/compare" className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out">
            Compare Two Countries
          </Link>
        </div>

        {/* Countries Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {countries.filter(country =>
              !searchQuery || (country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                country?.noc?.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length > 0 ? (
              countries
                .filter(country =>
                  !searchQuery || (country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    country?.noc?.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .sort((a, b) => {
                  // Default sort by total medals (descending)
                  const aTotal = a.medals.gold + a.medals.silver + a.medals.bronze;
                  const bTotal = b.medals.gold + b.medals.silver + b.medals.bronze;
                  return bTotal - aTotal;
                })
                .map((country) => (
                <Link key={country.noc} href={`/countries/${country.noc.toLowerCase()}`}>
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all hover:shadow-blue-900/20 hover:shadow-lg cursor-pointer">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-blue-300">{country.region}</h2>
                          <p className="text-gray-400 text-sm">{country.noc}</p>
                        </div>
                        <div className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          {country.medals.gold + country.medals.silver + country.medals.bronze} Medals
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-300 mb-3">Medal Count</h3>
                        <div className="flex space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.gold}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Gold</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.silver}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Silver</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.bronze}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Bronze</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-700">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Top Sport</p>
                            <p className="font-medium text-gray-300">{country.topSport}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Athletes</p>
                            <p className="font-medium text-gray-300">{country.totalAthletes}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center text-blue-400 hover:text-blue-300">
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-400">No countries found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pt-6">
          <p>Olympic Data Analysis Project - {new Date().getFullYear()}</p>
          <p className="mt-2">Built with D3.js and React</p>
        </footer>
      </div>
    </main>
  );
}