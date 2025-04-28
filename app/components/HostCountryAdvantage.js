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

  // Key fix: Ensure each country is properly categorized in only one status
  const countryStatusMap = {
    // Developed countries
    'United States': 'Developed',
    'Japan': 'Developed',
    'United Kingdom': 'Developed',
    'Germany': 'Developed',
    'France': 'Developed',
    'Finland': 'Developed',
    'Italy': 'Developed',
    'Canada': 'Developed',
    'Australia': 'Developed', // Australia is correctly defined once here
    'Spain': 'Developed',
    'South Korea': 'Developed',
    'Netherlands': 'Developed',
    'Switzerland': 'Developed',
    'Sweden': 'Developed',
    'Belgium': 'Developed',
    'Norway': 'Developed',
    // Developing
    'China': 'Developing',
    'Brazil': 'Developing',
    'Russia': 'Developing',
    'India': 'Developing',
    'Mexico': 'Developing',
    'Turkey': 'Developing',
    'Greece': 'Developing',
    'Poland': 'Developing',
    'Argentina': 'Developing',
    'South Africa': 'Developing',
    'Thailand': 'Developing',
    'Malaysia': 'Developing',
    'Soviet Union': 'Developing',
    // Underdeveloped
    'Ethiopia': 'Underdeveloped',
    'Kenya': 'Underdeveloped',
    'Afghanistan': 'Underdeveloped',
    'Haiti': 'Underdeveloped',
    'Nepal': 'Underdeveloped',
    'Yemen': 'Underdeveloped',
    'Mali': 'Underdeveloped',
    'Uganda': 'Underdeveloped',
    'Rwanda': 'Underdeveloped',
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Copy the data to avoid mutating the original
    let processedData = [...data];
    
    // Apply status filtering if toggle is on and a status is selected
    if (isToggled && selectedStatus !== 'all') {
      processedData = data.filter(item => {
        const countryStatus = countryStatusMap[item.Country];
        return countryStatus === selectedStatus;
      });
    }

    // Calculate statistics from filtered data
    const totalStats = processedData.reduce(
      (stats, item) => {
        stats.totalMedals += parseInt(item.Total_medal) || 0;
        stats.hostMedals += parseInt(item.Num_Medals) || 0;
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

    // Add percentage calculation to each item
    const enhancedData = processedData.map(item => ({
      ...item,
      percentage: item.Total_medal > 0 
        ? ((item.Num_Medals / item.Total_medal) * 100).toFixed(2) 
        : 0
    }));

    setFilteredData(enhancedData);
  }, [data, isToggled, selectedStatus]);

  const handleToggle = () => setIsToggled(!isToggled);

  const handleStatusChange = (status) => setSelectedStatus(status);

  return (
    <div className="host-country-advantage mt-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-extrabold text-blue-300 mb-6">🏆 Host Country Advantage</h2>

      <div className="flex items-center mb-6">
        <label className="flex items-center cursor-pointer space-x-3">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isToggled}
            onChange={handleToggle}
          />
          <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-blue-600 relative transition-all">
            <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md peer-checked:translate-x-6 transform transition-transform"></div>
          </div>
          <span className="text-md font-semibold  text-blue-300">Filter by Country Status</span>
        </label>
      </div>

      {isToggled && (
        <div className="mb-6">
          <label className="block text-md font-medium text-white mb-2">Development Status:</label>
          <div className="flex flex-wrap gap-4 text-white">
            {["all", "developed", "developing", "underdeveloped"].map(status => (
              <label key={status} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => handleStatusChange(status)}
                  className="form-radio text-white focus:ring-blue-400"
                />
                <span className="capitalize text-whitefont-medium">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="stats-summary mb-8 p-6 bg-gray-700 rounded-xl border border-blue-100 shadow">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">Overall Stats</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-white">Total Medals</p>
            <p className="text-2xl font-bold text-slate-900">{hostCountryStats.totalMedals}</p>
          </div>
          <div>
            <p className="text-sm text-white">Host Country Medals</p>
            <p className="text-2xl font-bold text-slate-900">{hostCountryStats.hostMedals}</p>
          </div>
          <div>
            <p className="text-sm text-white">Host Advantage</p>
            <p className="text-2xl font-bold text-green-600">{hostCountryStats.hostAdvantagePercent}%</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full text-sm border rounded-xl overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              {["Year", "Host Country", "Status", "Host Medals", "Total Medals", "Advantage (%)"].map(header => (
                <th key={header} className="px-6 py-3 text-left font-bold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-700">
            {filteredData.map((item, index) => (
              <tr key={`${item.Year}-${item.Country}-${index}`} className="hover:bg-blue-300 text-white hover:text-blue-900 transition-all">
                <td className="px-6 py-4">{item.Year}</td>
                <td className="px-6 py-4">{item.Country}</td>
                <td className="px-6 py-4">{countryStatusMap[item.Country] || "Unknown"}</td>
                <td className="px-6 py-4 text-right">{item.Num_Medals}</td>
                <td className="px-6 py-4 text-right">{item.Total_medal}</td>
                <td className="px-6 py-4 text-right">{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">🌍 About Country Development Status</h3>
        <div className="text-gray-700 leading-relaxed space-y-3">
          <p><strong className="text-blue-600">Developed Countries:</strong > High-income economies with advanced infrastructure, technology, and a high human development index.</p>
          <p><strong className="text-green-600">Developing Countries:</strong> Middle-income economies transitioning to modern industrialization with a moderate human development index.</p>
          <p><strong className="text-yellow-600">Underdeveloped Countries:</strong> Low-income economies with limited industrialization and lower human development index.</p>
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