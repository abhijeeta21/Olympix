'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart, 
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function Miscellaneous() {
  const [gdpData, setGdpData] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [athleteLongevityData, setAthleteLongevityData] = useState([]);
  const [hostsData, setHostsData] = useState([]);
  const [selectedMedalType, setSelectedMedalType] = useState('total');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll use mock data
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    // Mock data for GDP vs Medal count correlation
    const mockGdpData = [
      { country: 'USA', gdp: 21400, goldMedals: 1061, silverMedals: 830, bronzeMedals: 738, total: 2629 },
      { country: 'China', gdp: 14000, goldMedals: 224, silverMedals: 167, bronzeMedals: 155, total: 546 },
      { country: 'Japan', gdp: 5100, goldMedals: 156, silverMedals: 158, bronzeMedals: 183, total: 497 },
      { country: 'Germany', gdp: 3800, goldMedals: 283, silverMedals: 282, bronzeMedals: 290, total: 855 },
      { country: 'UK', gdp: 2800, goldMedals: 263, silverMedals: 295, bronzeMedals: 293, total: 851 },
      { country: 'India', gdp: 2700, goldMedals: 10, silverMedals: 9, bronzeMedals: 16, total: 35 },
      { country: 'France', gdp: 2600, goldMedals: 212, silverMedals: 241, bronzeMedals: 263, total: 716 },
      { country: 'Italy', gdp: 1900, goldMedals: 206, silverMedals: 178, bronzeMedals: 193, total: 577 },
      { country: 'Canada', gdp: 1700, goldMedals: 64, silverMedals: 105, bronzeMedals: 128, total: 297 },
      { country: 'South Korea', gdp: 1600, goldMedals: 90, silverMedals: 87, bronzeMedals: 90, total: 267 },
      { country: 'Australia', gdp: 1400, goldMedals: 147, silverMedals: 163, bronzeMedals: 187, total: 497 },
      { country: 'Brazil', gdp: 1400, goldMedals: 30, silverMedals: 36, bronzeMedals: 63, total: 129 },
      { country: 'Spain', gdp: 1300, goldMedals: 45, silverMedals: 64, bronzeMedals: 41, total: 150 },
      { country: 'Mexico', gdp: 1100, goldMedals: 13, silverMedals: 24, bronzeMedals: 28, total: 65 }
    ];

    // Mock data for medals per capita
    const mockPopulationData = [
      { country: 'USA', population: 331, goldPerMillion: 3.2, silverPerMillion: 2.5, bronzePerMillion: 2.2, totalPerMillion: 7.9 },
      { country: 'China', population: 1411, goldPerMillion: 0.16, silverPerMillion: 0.12, bronzePerMillion: 0.11, totalPerMillion: 0.39 },
      { country: 'Jamaica', population: 2.8, goldPerMillion: 7.5, silverPerMillion: 3.9, bronzePerMillion: 4.3, totalPerMillion: 15.7 },
      { country: 'New Zealand', population: 4.9, goldPerMillion: 9.2, silverPerMillion: 3.1, bronzePerMillion: 4.5, totalPerMillion: 16.8 },
      { country: 'Australia', population: 25.7, goldPerMillion: 5.7, silverPerMillion: 6.3, bronzePerMillion: 7.3, totalPerMillion: 19.3 },
      { country: 'Norway', population: 5.4, goldPerMillion: 13.8, silverPerMillion: 14.6, bronzePerMillion: 11.8, totalPerMillion: 40.2 },
      { country: 'Switzerland', population: 8.6, goldPerMillion: 3.4, silverPerMillion: 3.7, bronzePerMillion: 4.7, totalPerMillion: 11.8 },
      { country: 'Hungary', population: 9.7, goldPerMillion: 17.6, silverPerMillion: 14.3, bronzePerMillion: 18.4, totalPerMillion: 50.3 },
      { country: 'Sweden', population: 10.4, goldPerMillion: 14.5, silverPerMillion: 17.8, bronzePerMillion: 16.3, totalPerMillion: 48.6 },
      { country: 'Cuba', population: 11.3, goldPerMillion: 8.2, silverPerMillion: 6.9, bronzePerMillion: 8.1, totalPerMillion: 23.2 }
    ].sort((a, b) => b.totalPerMillion - a.totalPerMillion);

    // Mock data for athlete longevity (number of Olympics participated)
    const mockAthleteLongevityData = [
      { name: 'Nino Salukvadze', country: 'Georgia', sport: 'Shooting', appearances: 9, firstOlympics: 1988, lastOlympics: 2020, medals: 3 },
      { name: 'Ian Millar', country: 'Canada', sport: 'Equestrian', appearances: 10, firstOlympics: 1972, lastOlympics: 2012, medals: 1 },
      { name: 'Afanasijs Kuzmins', country: 'Latvia', sport: 'Shooting', appearances: 9, firstOlympics: 1976, lastOlympics: 2012, medals: 2 },
      { name: 'Lesley Thompson', country: 'Canada', sport: 'Rowing', appearances: 8, firstOlympics: 1984, lastOlympics: 2016, medals: 5 },
      { name: 'Jeannie Longo', country: 'France', sport: 'Cycling', appearances: 7, firstOlympics: 1984, lastOlympics: 2008, medals: 4 },
      { name: 'Oksana Chusovitina', country: 'Uzbekistan', sport: 'Gymnastics', appearances: 8, firstOlympics: 1992, lastOlympics: 2020, medals: 2 },
      { name: 'Hiroshi Hoketsu', country: 'Japan', sport: 'Equestrian', appearances: 7, firstOlympics: 1964, lastOlympics: 2012, medals: 0 },
      { name: 'Michael Phelps', country: 'USA', sport: 'Swimming', appearances: 5, firstOlympics: 2000, lastOlympics: 2016, medals: 28 },
      { name: 'Hubert Raudaschl', country: 'Austria', sport: 'Sailing', appearances: 9, firstOlympics: 1964, lastOlympics: 1996, medals: 2 },
      { name: 'Merlene Ottey', country: 'Jamaica', sport: 'Athletics', appearances: 7, firstOlympics: 1980, lastOlympics: 2004, medals: 8 }
    ].sort((a, b) => b.appearances - a.appearances);

    // Mock data for host country advantage
    const mockHostsData = [
      { year: 2016, host: 'Brazil', beforeHost: { gold: 17, silver: 17, bronze: 45, total: 79 }, asHost: { gold: 7, silver: 6, bronze: 6, total: 19 }, afterHost: { gold: 6, silver: 13, bronze: 12, total: 31 } },
      { year: 2012, host: 'Great Britain', beforeHost: { gold: 9, silver: 13, bronze: 17, total: 39 }, asHost: { gold: 29, silver: 17, bronze: 19, total: 65 }, afterHost: { gold: 27, silver: 23, bronze: 17, total: 67 } },
      { year: 2008, host: 'China', beforeHost: { gold: 32, silver: 17, bronze: 14, total: 63 }, asHost: { gold: 48, silver: 22, bronze: 30, total: 100 }, afterHost: { gold: 38, silver: 32, bronze: 18, total: 88 } },
      { year: 2004, host: 'Greece', beforeHost: { gold: 0, silver: 4, bronze: 6, total: 10 }, asHost: { gold: 6, silver: 6, bronze: 4, total: 16 }, afterHost: { gold: 0, silver: 2, bronze: 2, total: 4 } },
      { year: 2000, host: 'Australia', beforeHost: { gold: 9, silver: 9, bronze: 23, total: 41 }, asHost: { gold: 16, silver: 25, bronze: 17, total: 58 }, afterHost: { gold: 17, silver: 16, bronze: 16, total: 49 } },
      { year: 1996, host: 'USA', beforeHost: { gold: 37, silver: 34, bronze: 37, total: 108 }, asHost: { gold: 44, silver: 32, bronze: 25, total: 101 }, afterHost: { gold: 39, silver: 25, bronze: 33, total: 97 } }
    ];

    setGdpData(mockGdpData);
    setPopulationData(mockPopulationData);
    setAthleteLongevityData(mockAthleteLongevityData);
    setHostsData(mockHostsData);
    setIsLoading(false);
  };

  // Helper function to get medal data based on selected type
  const getMedalValue = (country, type) => {
    switch (type) {
      case 'gold': return country.goldMedals || 0;
      case 'silver': return country.silverMedals || 0;
      case 'bronze': return country.bronzeMedals || 0;
      case 'total': return country.total || 0;
      default: return 0;
    }
  };

  const getMedalPerCapitaValue = (country, type) => {
    switch (type) {
      case 'gold': return country.goldPerMillion || 0;
      case 'silver': return country.silverPerMillion || 0;
      case 'bronze': return country.bronzePerMillion || 0;
      case 'total': return country.totalPerMillion || 0;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-7xl mx-auto space-y-8 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-blue-900 text-center">
            Miscellaneous Olympic Analysis
          </h1>
          
          <div className="w-24"></div> {/* Empty div for balance */}
        </div>
        
        {/* Medal Type Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                selectedMedalType === 'total' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedMedalType('total')}
            >
              Total Medals
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                selectedMedalType === 'gold' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedMedalType('gold')}
            >
              Gold
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                selectedMedalType === 'silver' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedMedalType('silver')}
            >
              Silver
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                selectedMedalType === 'bronze' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedMedalType('bronze')}
            >
              Bronze
            </button>
          </div>
        </div>

        {/* Economic Analysis - GDP vs Medal Count */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Economic Analysis</h2>
          <p className="text-gray-600 mb-6">Correlation between country GDP (billions USD) and Olympic medal count</p>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="gdp" 
                  name="GDP (Billions USD)" 
                  domain={[0, 22000]}
                  label={{ value: 'GDP (Billions USD)', position: 'insideBottomRight', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey={(data) => getMedalValue(data, selectedMedalType)}
                  name="Medal Count"
                  label={{ value: 'Medal Count', angle: -90, position: 'insideLeft' }}
                />
                <ZAxis range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'GDP (Billions USD)') return [value, 'GDP (Billions USD)'];
                    return [value, `${selectedMedalType.charAt(0).toUpperCase() + selectedMedalType.slice(1)} Medals`];
                  }}
                  labelFormatter={(value, entry) => entry[0]?.payload?.country}
                />
                <Legend />
                <Scatter 
                  name={`${selectedMedalType.charAt(0).toUpperCase() + selectedMedalType.slice(1)} Medals vs GDP`} 
                  data={gdpData} 
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medals Per Capita */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Medals Per Million Population</h2>
          <p className="text-gray-600 mb-6">Top 10 countries by medal count normalized by population</p>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={populationData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)} medals per million`, `${selectedMedalType.charAt(0).toUpperCase() + selectedMedalType.slice(1)} Medals`]}
                />
                <Legend />
                <Bar 
                  dataKey={(data) => getMedalPerCapitaValue(data, selectedMedalType)}
                  name={`${selectedMedalType.charAt(0).toUpperCase() + selectedMedalType.slice(1)} Medals per million`}
                  fill="#82ca9d"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Athlete Longevity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Athlete Longevity</h2>
          <p className="text-gray-600 mb-6">Athletes with the most Olympic appearances</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Athlete</th>
                  <th className="py-3 px-4 text-left">Country</th>
                  <th className="py-3 px-4 text-left">Sport</th>
                  <th className="py-3 px-4 text-center">Olympic Appearances</th>
                  <th className="py-3 px-4 text-center">First Olympics</th>
                  <th className="py-3 px-4 text-center">Last Olympics</th>
                  <th className="py-3 px-4 text-center">Total Medals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {athleteLongevityData.map((athlete, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{athlete.name}</td>
                    <td className="py-3 px-4">{athlete.country}</td>
                    <td className="py-3 px-4">{athlete.sport}</td>
                    <td className="py-3 px-4 text-center font-semibold">{athlete.appearances}</td>
                    <td className="py-3 px-4 text-center">{athlete.firstOlympics}</td>
                    <td className="py-3 px-4 text-center">{athlete.lastOlympics}</td>
                    <td className="py-3 px-4 text-center font-semibold">{athlete.medals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Host Country Advantage Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Host Country Advantage</h2>
          <p className="text-gray-600 mb-6">Comparing medal performance before, during, and after hosting the Olympics</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hostsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="host" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Before') return [value, 'Medals Before Hosting'];
                        if (name === 'During') return [value, 'Medals As Host'];
                        if (name === 'After') return [value, 'Medals After Hosting'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey={`beforeHost.${selectedMedalType}`} 
                      name="Before" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey={`asHost.${selectedMedalType}`} 
                      name="During" 
                      fill="#82ca9d" 
                    />
                    <Bar 
                      dataKey={`afterHost.${selectedMedalType}`} 
                      name="After" 
                      fill="#ffc658" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Insights:</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Host countries typically see a significant increase in medal counts during their hosting year.</li>
                <li>Many countries maintain elevated performance after hosting due to increased sports investment.</li>
                <li>Some countries (like Brazil) see a temporary boost that isn't sustained long-term.</li>
                <li>Great Britain saw the most dramatic sustained improvement after hosting in 2012.</li>
                <li>The "host advantage" applies to both Summer and Winter Olympics.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Note: This page uses simulated data for visualization purposes.</p>
        </div>
      </div>
    </main>
  );
}