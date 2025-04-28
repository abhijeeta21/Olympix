"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HostCountryAdvantage = ({ data }) => {
  const [isToggled, setIsToggled] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [hostCountryStats, setHostCountryStats] = useState({
    totalMedals: 0,
    hostMedals: 0,
    hostAdvantagePercent: 0
  });

  // Country development status mapping
  const countryStatusMap = {
    // Developed countries
    'United States': 'developed',
    'Japan': 'developed',
    'United Kingdom': 'developed',
    'Germany': 'developed',
    'France': 'developed',
    'Italy': 'developed',
    'Canada': 'developed',
    'Australia': 'developed',
    'Spain': 'developed',
    'South Korea': 'developed',
    'Netherlands': 'developed',
    'Switzerland': 'developed',
    'Sweden': 'developed',
    'Belgium': 'developed',
    'Norway': 'developed',
    
    // Developing countries
    'China': 'developing',
    'Brazil': 'developing',
    'Russia': 'developing',
    'India': 'developing',
    'Mexico': 'developing',
    'Turkey': 'developing',
    'Greece': 'developing',
    'Poland': 'developing',
    'Argentina': 'developing',
    'South Africa': 'developing',
    'Thailand': 'developing',
    'Malaysia': 'developing',
    
    // Underdeveloped countries
    'Ethiopia': 'underdeveloped',
    'Kenya': 'underdeveloped',
    'Afghanistan': 'underdeveloped',
    'Haiti': 'underdeveloped',
    'Nepal': 'underdeveloped',
    'Yemen': 'underdeveloped',
    'Mali': 'underdeveloped',
    'Uganda': 'underdeveloped',
    'Rwanda': 'underdeveloped',
    // Add more countries as needed
  };

  // Filter data and calculate statistics when toggle or status changes
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Group by Olympic year and host country
    const olympicEvents = {};
    data.forEach(entry => {
      if (!olympicEvents[entry.Year]) {
        olympicEvents[entry.Year] = {
          hostCountry: entry.Country,
          medals: [],
          hostMedals: 0,
          totalMedals: 0
        };
      }
      
      if (entry.Medal && entry.Medal !== 'NA') {
        olympicEvents[entry.Year].totalMedals++;
        
        if (entry.Team === entry.Country) {
          olympicEvents[entry.Year].hostMedals++;
        }
      }
    });

    // Filter by development status if needed
    let filteredEvents = { ...olympicEvents };
    if (isToggled && selectedStatus !== 'all') {
      filteredEvents = Object.keys(olympicEvents).reduce((acc, year) => {
        const hostCountry = olympicEvents[year].hostCountry;
        const hostStatus = countryStatusMap[hostCountry] || 'unknown';
        
        if (hostStatus === selectedStatus) {
          acc[year] = olympicEvents[year];
        }
        return acc;
      }, {});
    }

    // Calculate totals
    const totalStats = Object.values(filteredEvents).reduce(
      (stats, event) => {
        stats.totalMedals += event.totalMedals;
        stats.hostMedals += event.hostMedals;
        return stats;
      },
      { totalMedals: 0, hostMedals: 0 }
    );

    const hostAdvantagePercent = totalStats.totalMedals > 0 
      ? (totalStats.hostMedals / totalStats.totalMedals * 100).toFixed(2) 
      : 0;

    setHostCountryStats({
      totalMedals: totalStats.totalMedals,
      hostMedals: totalStats.hostMedals,
      hostAdvantagePercent
    });

    // Update filtered data for display
    const filtered = Object.keys(filteredEvents).map(year => ({
      year,
      hostCountry: filteredEvents[year].hostCountry,
      hostMedals: filteredEvents[year].hostMedals,
      totalMedals: filteredEvents[year].totalMedals,
      percentage: (filteredEvents[year].hostMedals / filteredEvents[year].totalMedals * 100).toFixed(2)
    }));

    setFilteredData(filtered);
  }, [data, isToggled, selectedStatus]);

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  return (
    <div className="host-country-advantage mt-6 p-6 bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">🏅 Host Country Advantage</h2>
  
      <div className="mb-6 flex items-center">
        <label className="inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isToggled} 
            onChange={handleToggle} 
          />
          <div className="relative w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
          <span className="ml-4 text-md font-semibold text-gray-700">Filter by Country Status</span>
        </label>
      </div>
  
      {isToggled && (
        <div className="mb-6">
          <label className="block text-md font-semibold mb-3 text-gray-700">Development Status:</label>
          <div className="flex flex-wrap gap-4">
            {['all', 'developed', 'developing', 'underdeveloped'].map((status) => (
              <label key={status} className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="status" 
                  value={status} 
                  checked={selectedStatus === status} 
                  onChange={() => handleStatusChange(status)}
                  className="form-radio text-blue-600 h-5 w-5"
                />
                <span className="ml-2 capitalize font-medium text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}
  
      <div className="stats-summary mb-8 p-6 bg-blue-100 rounded-2xl shadow-inner">
        <h3 className="text-lg font-bold mb-4 text-gray-800">📊 Overall Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Medals</p>
            <p className="text-2xl font-extrabold text-blue-800">{hostCountryStats.totalMedals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Host Country Medals</p>
            <p className="text-2xl font-extrabold text-green-700">{hostCountryStats.hostMedals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Host Advantage</p>
            <p className="text-2xl font-extrabold text-purple-700">{hostCountryStats.hostAdvantagePercent}%</p>
          </div>
        </div>
      </div>
  
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-blue-100 text-blue-800 text-sm uppercase font-semibold">
            <tr>
              <th className="py-3 px-6 text-left">Year</th>
              <th className="py-3 px-6 text-left">Host Country</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-right">Host Medals</th>
              <th className="py-3 px-6 text-right">Total Medals</th>
              <th className="py-3 px-6 text-right">Advantage (%)</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredData.map((item) => (
              <tr key={item.year} className="hover:bg-blue-50 transition">
                <td className="py-4 px-6">{item.year}</td>
                <td className="py-4 px-6">{item.hostCountry}</td>
                <td className="py-4 px-6 capitalize">{countryStatusMap[item.hostCountry] || 'Unknown'}</td>
                <td className="py-4 px-6 text-right">{item.hostMedals}</td>
                <td className="py-4 px-6 text-right">{item.totalMedals}</td>
                <td className={`py-4 px-6 text-right font-bold ${item.percentage >= 50 ? 'text-green-600' : item.percentage >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {item.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      <div className="mt-8 p-6 bg-gray-50 rounded-2xl shadow-inner">
        <h3 className="text-lg font-bold mb-4 text-gray-800">🌎 About Country Development Status</h3>
        <div className="text-md text-gray-700 leading-relaxed space-y-3">
          <p><strong>Developed Countries:</strong> High-income economies with advanced infrastructure, technology, and high human development index.</p>
          <p><strong>Developing Countries:</strong> Middle-income economies transitioning to modern industrialization with moderate human development index.</p>
          <p><strong>Underdeveloped Countries:</strong> Low-income economies with limited industrialization and lower human development index.</p>
        </div>
      </div>
      <div className="w-full h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis domain={[0, 100]} label={{ value: 'Advantage %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="percentage" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
        </div>

    </div>
    
  );
  
};

export default HostCountryAdvantage;