'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function AgePerformance() {
  const [ageData, setAgeData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [countryAgeData, setCountryAgeData] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2016');
  const [selectedAgeThreshold, setSelectedAgeThreshold] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [sports, setSports] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    // In a real application, we would fetch this data from an API
    // For now, we'll use mock data
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    // Mock age trend data (youngest, oldest, average by year)
    const mockAgeData = [
      { year: 1896, youngest: 10, oldest: 47, average: 23.4 },
      { year: 1900, youngest: 12, oldest: 51, average: 25.1 },
      { year: 1904, youngest: 11, oldest: 54, average: 24.8 },
      { year: 1908, youngest: 10, oldest: 60, average: 26.2 },
      { year: 1912, youngest: 11, oldest: 58, average: 25.7 },
      { year: 1920, youngest: 12, oldest: 65, average: 26.9 },
      { year: 1924, youngest: 11, oldest: 62, average: 27.1 },
      { year: 1928, youngest: 13, oldest: 60, average: 26.8 },
      { year: 1932, youngest: 13, oldest: 58, average: 27.2 },
      { year: 1936, youngest: 12, oldest: 61, average: 27.5 },
      { year: 1948, youngest: 12, oldest: 66, average: 28.1 },
      { year: 1952, youngest: 13, oldest: 64, average: 28.4 },
      { year: 1956, youngest: 14, oldest: 70, average: 28.6 },
      { year: 1960, youngest: 13, oldest: 67, average: 28.9 },
      { year: 1964, youngest: 13, oldest: 66, average: 28.7 },
      { year: 1968, youngest: 14, oldest: 68, average: 28.5 },
      { year: 1972, youngest: 14, oldest: 69, average: 28.3 },
      { year: 1976, youngest: 14, oldest: 70, average: 28.2 },
      { year: 1980, youngest: 13, oldest: 67, average: 28.1 },
      { year: 1984, youngest: 12, oldest: 65, average: 27.9 },
      { year: 1988, youngest: 12, oldest: 64, average: 27.6 },
      { year: 1992, youngest: 11, oldest: 63, average: 27.8 },
      { year: 1996, youngest: 14, oldest: 61, average: 27.5 },
      { year: 2000, youngest: 13, oldest: 60, average: 27.7 },
      { year: 2004, youngest: 14, oldest: 65, average: 27.9 },
      { year: 2008, youngest: 14, oldest: 67, average: 28.2 },
      { year: 2012, youngest: 13, oldest: 71, average: 28.5 },
      { year: 2016, youngest: 14, oldest: 62, average: 28.4 },
      { year: 2020, youngest: 13, oldest: 66, average: 28.7 },
    ];

    // Mock sports data for scatter plot
    const mockSports = [
      { id: 'all', name: 'All Sports' },
      { id: 'swimming', name: 'Swimming' },
      { id: 'gymnastics', name: 'Gymnastics' },
      { id: 'athletics', name: 'Athletics' },
      { id: 'cycling', name: 'Cycling' },
      { id: 'weightlifting', name: 'Weightlifting' },
      { id: 'shooting', name: 'Shooting' },
      { id: 'archery', name: 'Archery' },
      { id: 'skiing', name: 'Alpine Skiing' }
    ];

    // Mock age vs performance data (scatter plot)
    const generateScatterData = (sport = 'all') => {
      const baseData = [];
      // Generate 300 random points
      for (let i = 0; i < 300; i++) {
        const sportId = mockSports[Math.floor(Math.random() * mockSports.length)].id;
        if (sport === 'all' || sportId === sport) {
          // Age between 15 and 40
          const age = Math.floor(15 + Math.random() * 25);
          // Performance score between 0 and 100
          let performance = null;
          
          // Different sports have different age-performance curves
          if (sportId === 'swimming' || sportId === 'gymnastics') {
            // Younger is better for these sports (with some randomness)
            performance = Math.max(0, 100 - (age - 18) * 3 + Math.random() * 20);
          } else if (sportId === 'shooting' || sportId === 'archery') {
            // Experience helps - middle age is better
            performance = Math.max(0, 70 + Math.abs(age - 30) * -1.5 + Math.random() * 20);
          } else {
            // General case - slight curve favoring mid-late 20s
            performance = Math.max(0, 80 - Math.abs(age - 27) * 1.5 + Math.random() * 25);
          }
          
          // Medal status (1=gold, 2=silver, 3=bronze, 4=no medal)
          let medalStatus = 4;
          if (performance > 90) medalStatus = 1;
          else if (performance > 85) medalStatus = 2;
          else if (performance > 80) medalStatus = 3;
          
          baseData.push({
            age,
            performance: Math.round(performance),
            sport: sportId,
            medalStatus
          });
        }
      }
      return baseData;
    };

    // Mock country-wise data for athletes above age threshold
    const mockCountries = [
      'USA', 'China', 'Japan', 'Great Britain', 'Russia',
      'Australia', 'France', 'Germany', 'Italy', 'Canada'
    ];

    const generateCountryAgeData = (ageThreshold) => {
      return mockCountries.map(country => {
        let count;
        // Generate somewhat realistic numbers with some countries having more veteran athletes
        if (['USA', 'Russia', 'Germany'].includes(country)) {
          count = Math.floor(30 + Math.random() * 20);
        } else if (['China', 'Japan'].includes(country)) {
          count = Math.floor(15 + Math.random() * 15);
        } else {
          count = Math.floor(20 + Math.random() * 15);
        }
        
        return {
          country,
          count
        };
      }).sort((a, b) => b.count - a.count);
    };

    // Set up the state
    setAgeData(mockAgeData);
    setSports(mockSports);
    setYears(mockAgeData.map(d => ({ year: d.year.toString() })));
    setScatterData(generateScatterData());
    setCountryAgeData(generateCountryAgeData(selectedAgeThreshold));
    setIsLoading(false);
  };

  // Update scatter data when sport changes
  useEffect(() => {
    if (isLoading) return;
    // In a real app, this would be a new API call
    // Here we're just filtering the mock data
    const newData = scatterData.filter(d => selectedSport === 'all' || d.sport === selectedSport);
    setScatterData(newData);
  }, [selectedSport, isLoading]);

  // Update country age data when threshold changes
  useEffect(() => {
    if (isLoading) return;
    // In a real app, this would be a new API call
    const mockCountries = [
      'USA', 'China', 'Japan', 'Great Britain', 'Russia',
      'Australia', 'France', 'Germany', 'Italy', 'Canada'
    ];

    const newData = mockCountries.map(country => {
      // Generate realistic numbers with fewer athletes as age threshold increases
      const baseCount = Math.floor(50 - selectedAgeThreshold * 0.8 + Math.random() * 10);
      let count = Math.max(0, baseCount);
      
      // Some countries tend to have more veteran athletes
      if (['USA', 'Russia', 'Germany'].includes(country)) {
        count += Math.floor(5 + Math.random() * 5);
      } else if (['China', 'Japan'].includes(country)) {
        count -= Math.floor(3 + Math.random() * 3);
      }
      
      return {
        country,
        count: Math.max(0, count)
      };
    }).sort((a, b) => b.count - a.count);
    
    setCountryAgeData(newData);
  }, [selectedAgeThreshold, isLoading]);

  const getMedalColor = (medalStatus) => {
    switch (medalStatus) {
      case 1: return '#FFD700'; // gold
      case 2: return '#C0C0C0'; // silver
      case 3: return '#CD7F32'; // bronze
      default: return '#95A5A6'; // no medal (gray)
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
            Age vs Performance Analysis
          </h1>
          
          <div className="w-24"></div> {/* Empty div for balance */}
        </div>

        {/* Age Trends Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Age Trends in the Olympics</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ageData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year"
                  tick={{ fontSize: 12 }}
                  interval={2}
                />
                <YAxis yAxisId="left" />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'youngest' ? 'Youngest Athlete' : name === 'oldest' ? 'Oldest Athlete' : 'Average Age']}
                  labelFormatter={(value) => `Year: ${value}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="youngest" 
                  name="Youngest Athlete"
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="oldest" 
                  name="Oldest Athlete"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="average" 
                  name="Average Age"
                  stroke="#ff7300"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age vs Performance Scatter Plot */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Age vs Performance</h2>
          
          <div className="mb-6">
            <label htmlFor="sport-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Sport
            </label>
            <select 
              id="sport-select"
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          
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
                  dataKey="age" 
                  name="Age" 
                  unit=" years"
                  domain={[15, 40]}
                />
                <YAxis 
                  type="number" 
                  dataKey="performance" 
                  name="Performance" 
                  unit=" points"
                  domain={[0, 100]}
                />
                <ZAxis 
                  type="number"
                  range={[100, 500]}
                  dataKey="medalStatus"
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'Age') return [value, 'Age (years)'];
                    if (name === 'Performance') return [value, 'Performance Score'];
                    return [value, name];
                  }}
                  labelFormatter={() => ''}
                />
                <Legend />
                <Scatter 
                  name="Athletes" 
                  data={scatterData} 
                  fill="#8884d8"
                  shape={(props) => {
                    const { cx, cy, fill, medalStatus } = props;
                    const color = getMedalColor(medalStatus);
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill={color} 
                        stroke="none"
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <span className="w-4 h-4 inline-block mr-2 rounded-full bg-[#FFD700]"></span>
              <span className="text-sm text-gray-700">Gold Medal</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 inline-block mr-2 rounded-full bg-[#C0C0C0]"></span>
              <span className="text-sm text-gray-700">Silver Medal</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 inline-block mr-2 rounded-full bg-[#CD7F32]"></span>
              <span className="text-sm text-gray-700">Bronze Medal</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 inline-block mr-2 rounded-full bg-[#95A5A6]"></span>
              <span className="text-sm text-gray-700">No Medal</span>
            </div>
          </div>
        </div>

        {/* Country-wise Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Countries with Athletes Above Age {selectedAgeThreshold}
          </h2>
          
          <div className="mb-6">
            <label htmlFor="age-threshold" className="block text-sm font-medium text-gray-700 mb-1">
              Age Threshold: {selectedAgeThreshold}
            </label>
            <input
              id="age-threshold"
              type="range"
              min="20"
              max="40"
              value={selectedAgeThreshold}
              onChange={(e) => setSelectedAgeThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryAgeData}
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
                  formatter={(value, name) => [value, `Number of Athletes`]}
                  labelFormatter={(value) => `Country: ${value}`}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name={`Athletes ${selectedAgeThreshold}+ years old`} 
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Note: This page uses simulated data for visualization purposes.</p>
        </div>
      </div>
    </main>
  );
}