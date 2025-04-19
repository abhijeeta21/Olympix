'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function GenderParticipation() {
  const [timelineData, setTimelineData] = useState([]);
  const [sportGenderData, setSportGenderData] = useState([]);
  const [countryGenderData, setCountryGenderData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2016');
  const [isLoading, setIsLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // In a real application, this data would come from an API
    // For now, we'll use mock data
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    // Mock data for gender participation timeline
    const mockTimelineData = [
      { year: 1896, male: 241, female: 0, total: 241, femalePercentage: 0 },
      { year: 1900, male: 975, female: 22, total: 997, femalePercentage: 2.2 },
      { year: 1904, male: 645, female: 6, total: 651, femalePercentage: 0.9 },
      { year: 1908, male: 1971, female: 37, total: 2008, femalePercentage: 1.8 },
      { year: 1912, male: 2359, female: 48, total: 2407, femalePercentage: 2.0 },
      { year: 1920, male: 2561, female: 65, total: 2626, femalePercentage: 2.5 },
      { year: 1924, male: 2954, female: 135, total: 3089, femalePercentage: 4.4 },
      { year: 1928, male: 2606, female: 277, total: 2883, femalePercentage: 9.6 },
      { year: 1932, male: 1206, female: 126, total: 1332, femalePercentage: 9.5 },
      { year: 1936, male: 3632, female: 331, total: 3963, femalePercentage: 8.3 },
      { year: 1948, male: 3714, female: 390, total: 4104, femalePercentage: 9.5 },
      { year: 1952, male: 4436, female: 519, total: 4955, femalePercentage: 10.5 },
      { year: 1956, male: 2938, female: 376, total: 3314, femalePercentage: 11.3 },
      { year: 1960, male: 4727, female: 611, total: 5338, femalePercentage: 11.4 },
      { year: 1964, male: 4473, female: 678, total: 5151, femalePercentage: 13.2 },
      { year: 1968, male: 4735, female: 781, total: 5516, femalePercentage: 14.2 },
      { year: 1972, male: 6075, female: 1059, total: 7134, femalePercentage: 14.8 },
      { year: 1976, male: 4824, female: 1260, total: 6084, femalePercentage: 20.7 },
      { year: 1980, male: 4064, female: 1115, total: 5179, femalePercentage: 21.5 },
      { year: 1984, male: 5263, female: 1566, total: 6829, femalePercentage: 22.9 },
      { year: 1988, male: 6197, female: 2194, total: 8391, femalePercentage: 26.1 },
      { year: 1992, male: 6652, female: 2704, total: 9356, femalePercentage: 28.9 },
      { year: 1996, male: 6806, female: 3512, total: 10318, femalePercentage: 34.0 },
      { year: 2000, male: 6582, female: 4069, total: 10651, femalePercentage: 38.2 },
      { year: 2004, male: 6296, female: 4329, total: 10625, femalePercentage: 40.7 },
      { year: 2008, male: 6305, female: 4746, total: 11051, femalePercentage: 42.9 },
      { year: 2012, male: 5992, female: 4776, total: 10768, femalePercentage: 44.4 },
      { year: 2016, male: 6178, female: 5059, total: 11237, femalePercentage: 45.0 },
      { year: 2020, male: 5982, female: 5494, total: 11476, femalePercentage: 47.9 }
    ];

    // Mock data for sports gender distribution
    const mockSportGenderData = [
      { sport: 'Gymnastics', male: 45, female: 55, total: 100, femalePercentage: 55 },
      { sport: 'Swimming', male: 51, female: 49, total: 100, femalePercentage: 49 },
      { sport: 'Athletics', male: 52, female: 48, total: 100, femalePercentage: 48 },
      { sport: 'Volleyball', male: 50, female: 50, total: 100, femalePercentage: 50 },
      { sport: 'Tennis', male: 50, female: 50, total: 100, femalePercentage: 50 },
      { sport: 'Basketball', male: 54, female: 46, total: 100, femalePercentage: 46 },
      { sport: 'Hockey', male: 55, female: 45, total: 100, femalePercentage: 45 },
      { sport: 'Rowing', male: 60, female: 40, total: 100, femalePercentage: 40 },
      { sport: 'Cycling', male: 65, female: 35, total: 100, femalePercentage: 35 },
      { sport: 'Football', male: 68, female: 32, total: 100, femalePercentage: 32 },
      { sport: 'Boxing', male: 75, female: 25, total: 100, femalePercentage: 25 },
      { sport: 'Wrestling', male: 80, female: 20, total: 100, femalePercentage: 20 },
      { sport: 'Weightlifting', male: 82, female: 18, total: 100, femalePercentage: 18 }
    ].sort((a, b) => b.femalePercentage - a.femalePercentage);

    // Mock data for country gender distribution
    const mockCountryGenderData = {
      all: [
        { country: 'USA', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Australia', male: 46, female: 54, total: 100, femalePercentage: 54 },
        { country: 'Canada', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Great Britain', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'France', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Germany', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Japan', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'China', male: 53, female: 47, total: 100, femalePercentage: 47 },
        { country: 'Russia', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Brazil', male: 60, female: 40, total: 100, femalePercentage: 40 }
      ],
      '2016': [
        { country: 'USA', male: 45, female: 55, total: 100, femalePercentage: 55 },
        { country: 'Australia', male: 45, female: 55, total: 100, femalePercentage: 55 },
        { country: 'Canada', male: 46, female: 54, total: 100, femalePercentage: 54 },
        { country: 'Great Britain', male: 51, female: 49, total: 100, femalePercentage: 49 },
        { country: 'France', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Germany', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Japan', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'China', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'Russia', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Brazil', male: 58, female: 42, total: 100, femalePercentage: 42 }
      ],
      '2012': [
        { country: 'USA', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Australia', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Canada', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Great Britain', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'France', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Germany', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'Japan', male: 58, female: 42, total: 100, femalePercentage: 42 },
        { country: 'China', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Russia', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Brazil', male: 62, female: 38, total: 100, femalePercentage: 38 }
      ]
    };

    setTimelineData(mockTimelineData);
    setSportGenderData(mockSportGenderData);
    setCountryGenderData(mockCountryGenderData[selectedYear]);
    
    // Extract years and add 'all' option
    const yearOptions = [...new Set(mockTimelineData.map(item => item.year))].map(year => String(year));
    yearOptions.unshift('all');
    setYears(yearOptions);
    
    // Extract countries
    setCountries([
      { id: 'all', name: 'All Countries' },
      { id: 'USA', name: 'United States' },
      { id: 'Australia', name: 'Australia' },
      { id: 'Canada', name: 'Canada' },
      { id: 'Great Britain', name: 'Great Britain' },
      { id: 'France', name: 'France' },
      { id: 'Germany', name: 'Germany' },
      { id: 'Japan', name: 'Japan' },
      { id: 'China', name: 'China' },
      { id: 'Russia', name: 'Russia' },
      { id: 'Brazil', name: 'Brazil' }
    ]);
    
    setIsLoading(false);
  };

  // Update country gender data when year changes
  useEffect(() => {
    if (isLoading) return;
    
    // In a real app, this would be a new API call
    const mockCountryGenderData = {
      all: [
        { country: 'USA', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Australia', male: 46, female: 54, total: 100, femalePercentage: 54 },
        { country: 'Canada', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Great Britain', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'France', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Germany', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Japan', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'China', male: 53, female: 47, total: 100, femalePercentage: 47 },
        { country: 'Russia', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Brazil', male: 60, female: 40, total: 100, femalePercentage: 40 }
      ],
      '2016': [
        { country: 'USA', male: 45, female: 55, total: 100, femalePercentage: 55 },
        { country: 'Australia', male: 45, female: 55, total: 100, femalePercentage: 55 },
        { country: 'Canada', male: 46, female: 54, total: 100, femalePercentage: 54 },
        { country: 'Great Britain', male: 51, female: 49, total: 100, femalePercentage: 49 },
        { country: 'France', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Germany', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Japan', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'China', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'Russia', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Brazil', male: 58, female: 42, total: 100, femalePercentage: 42 }
      ],
      '2012': [
        { country: 'USA', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Australia', male: 47, female: 53, total: 100, femalePercentage: 53 },
        { country: 'Canada', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Great Britain', male: 52, female: 48, total: 100, femalePercentage: 48 },
        { country: 'France', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Germany', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'Japan', male: 58, female: 42, total: 100, femalePercentage: 42 },
        { country: 'China', male: 54, female: 46, total: 100, femalePercentage: 46 },
        { country: 'Russia', male: 56, female: 44, total: 100, femalePercentage: 44 },
        { country: 'Brazil', male: 62, female: 38, total: 100, femalePercentage: 38 }
      ],
      '2008': [
        { country: 'USA', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Australia', male: 48, female: 52, total: 100, femalePercentage: 52 },
        { country: 'Canada', male: 49, female: 51, total: 100, femalePercentage: 51 },
        { country: 'Great Britain', male: 53, female: 47, total: 100, femalePercentage: 47 },
        { country: 'France', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'Germany', male: 58, female: 42, total: 100, femalePercentage: 42 },
        { country: 'Japan', male: 59, female: 41, total: 100, femalePercentage: 41 },
        { country: 'China', male: 55, female: 45, total: 100, femalePercentage: 45 },
        { country: 'Russia', male: 57, female: 43, total: 100, femalePercentage: 43 },
        { country: 'Brazil', male: 64, female: 36, total: 100, femalePercentage: 36 }
      ]
    };

    if (mockCountryGenderData[selectedYear]) {
      setCountryGenderData(mockCountryGenderData[selectedYear]);
    } else {
      setCountryGenderData(mockCountryGenderData.all);
    }
  }, [selectedYear, isLoading]);

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
            Gender Participation Analysis
          </h1>
          
          <div className="w-24"></div> {/* Empty div for balance */}
        </div>

        {/* Gender Participation Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Evolution of Gender Participation (1896-2020)</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [value, name === 'male' ? 'Male Athletes' : name === 'female' ? 'Female Athletes' : 'Total Athletes']}
                  labelFormatter={(value) => `Year: ${value}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="male" 
                  name="Male Athletes"
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                />
                <Area 
                  type="monotone" 
                  dataKey="female" 
                  name="Female Athletes"
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Female Participation Percentage */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Female Participation Percentage Over Time</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Female Athletes']}
                  labelFormatter={(value) => `Year: ${value}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="femalePercentage"
                  name="Female Athletes (%)"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sports with Highest/Lowest Female Participation */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Gender Distribution by Sport</h2>
          <p className="text-gray-600 mb-6">Sports with highest and lowest female participation rates</p>
          
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sportGenderData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 90,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="sport" 
                />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name === 'male' ? 'Male Athletes' : 'Female Athletes']}
                />
                <Legend />
                <Bar dataKey="male" name="Male Athletes %" stackId="a" fill="#8884d8" />
                <Bar dataKey="female" name="Female Athletes %" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Country Gender Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Gender Distribution by Country</h2>
          
          <div className="mb-6">
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Olympic Year
            </label>
            <select 
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="all">All Years</option>
              <option value="2016">Rio 2016</option>
              <option value="2012">London 2012</option>
              <option value="2008">Beijing 2008</option>
            </select>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryGenderData}
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
                  formatter={(value, name) => [`${value}%`, name === 'male' ? 'Male Athletes' : 'Female Athletes']}
                />
                <Legend />
                <Bar dataKey="male" name="Male Athletes %" fill="#8884d8" />
                <Bar dataKey="female" name="Female Athletes %" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Note: This page uses simulated gender distribution data for visualization purposes.</p>
        </div>
      </div>
    </main>
  );
}