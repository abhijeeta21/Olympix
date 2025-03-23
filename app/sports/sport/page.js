// app/sports/[sport]/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SportDetail() {
  const params = useParams();
  const sportName = decodeURIComponent(params.sport);
  
  const [sportData, setSportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the sports data from the JSON file
    fetch('/data/sports_data.json')
      .then(response => response.json())
      .then(data => {
        const sport = data.sports.find(s => s.name === sportName);
        setSportData(sport);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading sport data:', error);
        setIsLoading(false);
      });
  }, [sportName]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-4xl mx-auto py-8 text-center">
          <p className="text-xl text-blue-700">Loading sport data...</p>
        </div>
      </main>
    );
  }

  if (!sportData) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-4xl mx-auto py-8 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Sport Not Found</h1>
          <p className="text-xl text-gray-700 mb-8">
            We couldn't find information for {sportName}.
          </p>
          <Link href="/sports" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Back to Sports
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">{sportData.name}</h1>
            <p className="text-xl text-blue-700">
              Olympic History: {sportData.first_appearance} - {sportData.latest_appearance}
            </p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Total Athletes</p>
              <p className="text-3xl font-bold text-blue-800">{sportData.total_athletes.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Participating Countries</p>
              <p className="text-3xl font-bold text-blue-800">{sportData.participating_countries}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-blue-800">{sportData.total_events}</p>
            </div>
          </div>
          
          {/* Gender Breakdown */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gender Breakdown</h2>
            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600" 
                style={{ width: `${sportData.gender_breakdown.male}%` }}
              >
                <div className="flex justify-between px-4 items-center h-full">
                  <span className="text-white font-medium">Male</span>
                  <span className="text-white font-medium">{sportData.gender_breakdown.male}%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Male: {sportData.gender_breakdown.male}%</span>
              <span className="text-sm text-gray-600">Female: {sportData.gender_breakdown.female}%</span>
            </div>
          </div>
          
          {/* Top Countries */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top Performing Countries</h2>
            <div className="grid grid-cols-3 gap-4">
              {sportData.top_countries.map((country, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-medium text-gray-800">{country.NOC}</p>
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      #{index + 1}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 mt-2">{country.medal_count}</p>
                  <p className="text-sm text-gray-600">medals</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Popular Events */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Popular Events</h2>
            <ul className="list-disc pl-5 space-y-2">
              {sportData.popular_events.map((event, index) => (
                <li key={index} className="text-lg text-gray-700">{event}</li>
              ))}
            </ul>
          </div>
          
          {/* Back Button */}
          <div className="text-center mt-8">
            <Link href="/sports" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Back to All Sports
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}