'use client';
import { useState, useEffect, useMemo } from 'react';
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
  LabelList
} from 'recharts';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip as ReactTooltip } from 'react-tooltip'; // Use named import

export default function GenderParticipation() {
  const [timelineData, setTimelineData] = useState([]);
  const [allSportGenderData, setAllSportGenderData] = useState([]);
  const [filteredSportData, setFilteredSportData] = useState([]);
  const [sportSearchTerm, setSportSearchTerm] = useState('');
  const [countryGenderData, setCountryGenderData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2016');
  const [isLoading, setIsLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [countries, setCountries] = useState([]);
  const [activeVisualization, setActiveVisualization] = useState('timeline');
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [medalGenderData, setMedalGenderData] = useState([]);
  const [continentGenderData, setContinentGenderData] = useState([]);
  const [timelineStartYear, setTimelineStartYear] = useState(null);
  const [timelineEndYear, setTimelineEndYear] = useState(null);
  const [availableTimelineYears, setAvailableTimelineYears] = useState([]);
  const [countryDataByYear, setCountryDataByYear] = useState({}); // <-- Add this state

  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  const colorScale = useMemo(() => scaleLinear()
    // Adjust domain based on expected range of female COUNTS
    // Example using mock data range (approx 35 to 55)
    .domain([35, 45, 55]) 
    .range(["#FFEDA0", "#FEB24C", "#F03b20"]), // Keep the color range or change as desired
    []
  );

  useEffect(() => {
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    setIsLoading(true);

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

    const yearsInData = mockTimelineData.map(d => d.year).sort((a, b) => a - b);
    setAvailableTimelineYears(yearsInData);
    setTimelineStartYear(yearsInData[0]);
    setTimelineEndYear(yearsInData[yearsInData.length - 1]);

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

    const mockCountryGenderDataByYear = {
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

    const mockAgeData = [
      { ageBracket: '15-19', male: 850, female: 950 },
      { ageBracket: '20-24', male: 2500, female: 2600 },
      { ageBracket: '25-29', male: 2200, female: 1800 },
      { ageBracket: '30-34', male: 900, female: 600 },
      { ageBracket: '35+', male: 350, female: 200 }
    ];

    const mockMedalData = [
      { gender: 'Male', gold: 1500, silver: 1450, bronze: 1600 },
      { gender: 'Female', gold: 1200, silver: 1250, bronze: 1300 }
    ];

    const continentMapping = {
      'USA': 'North America',
      'Canada': 'North America',
      'Brazil': 'South America',
      'Great Britain': 'Europe',
      'France': 'Europe',
      'Germany': 'Europe',
      'Russia': 'Europe',
      'China': 'Asia',
      'Japan': 'Asia',
      'Australia': 'Oceania'
    };

    const continentDataAggregated = mockCountryGenderDataByYear.all.reduce((acc, countryData) => {
      const continent = continentMapping[countryData.country] || 'Other';
      if (!acc[continent]) {
        acc[continent] = { continent: continent, male: 0, female: 0, total: 0 };
      }
      acc[continent].male += countryData.male;
      acc[continent].female += countryData.female;
      acc[continent].total += countryData.male + countryData.female;
      return acc;
    }, {});

    const mockContinentData = Object.values(continentDataAggregated).map(continent => ({
      ...continent,
      malePercentage: continent.total > 0 ? parseFloat(((continent.male / continent.total) * 100).toFixed(1)) : 0,
      femalePercentage: continent.total > 0 ? parseFloat(((continent.female / continent.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.femalePercentage - a.femalePercentage);

    setTimelineData(mockTimelineData);
    setAvailableTimelineYears(yearsInData);
    setTimelineStartYear(yearsInData[0]);
    setTimelineEndYear(yearsInData[yearsInData.length - 1]);
    setAllSportGenderData(mockSportGenderData);
    setFilteredSportData(mockSportGenderData);
    setCountryDataByYear(mockCountryGenderDataByYear); // <-- Set the state with the full object
    // Set initial countryGenderData based on default selectedYear
    setCountryGenderData(mockCountryGenderDataByYear[selectedYear] || mockCountryGenderDataByYear.all || []);
    setAgeDistributionData(mockAgeData);
    setMedalGenderData(mockMedalData);
    setContinentGenderData(mockContinentData);

    const yearOptions = ['all', '2016', '2012', '2008'];
    setYears(yearOptions);

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

  useEffect(() => {
    if (!allSportGenderData) return;

    const lowerCaseSearchTerm = sportSearchTerm.toLowerCase();
    const filtered = allSportGenderData.filter(sport =>
      sport.sport.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredSportData(filtered);
  }, [sportSearchTerm, allSportGenderData]);

  useEffect(() => {
    // Check if data is loaded and countryDataByYear has keys
    if (isLoading || Object.keys(countryDataByYear).length === 0) return;

    // Read from the state variable
    const newData = countryDataByYear[selectedYear] || countryDataByYear.all || [];
    setCountryGenderData(newData);

  }, [selectedYear, isLoading, countryDataByYear]); // <-- Add countryDataByYear dependency

  const countryDataMap = useMemo(() => {
    console.log("Recalculating countryDataMap (Female Count) for year:", selectedYear);
    const map = {};
    countryGenderData.forEach(item => {
      let mapKey = item.country;
      if (mapKey === 'USA') mapKey = 'United States of America';
      if (mapKey === 'Great Britain') mapKey = 'United Kingdom';
      map[mapKey] = item.female; 
    });
    console.log("Generated countryDataMap (Female Count):", map);
    return map;
  }, [countryGenderData, selectedYear]);

  const filteredTimelineData = useMemo(() => {
    if (!timelineData || timelineStartYear === null || timelineEndYear === null) {
      return [];
    }
    const start = Math.min(timelineStartYear, timelineEndYear);
    const end = Math.max(timelineStartYear, timelineEndYear);
    return timelineData.filter(d => d.year >= start && d.year <= end);
  }, [timelineData, timelineStartYear, timelineEndYear]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 p-4">
      <div className="w-full max-w-7xl mx-auto space-y-8 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-blue-400 hover:text-blue-600">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-blue-300 text-center">
            Gender Participation Analysis
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'timeline' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('timeline')}
          >
            Timeline
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'femalePercentage' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('femalePercentage')}
          >
            Female %
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'sports' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('sports')}
          >
            By Sport
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'countries' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('countries')}
          >
            By Country
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'age' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('age')}
          >
            By Age
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'medals' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('medals')}
          >
            By Medals
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'continents' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('continents')}
          >
            By Continent
          </button>
        </div>

        {activeVisualization === 'timeline' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Evolution of Gender Participation</h2>

            <div className="flex flex-wrap justify-center gap-4 mb-6 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="start-year-select" className="text-sm font-medium text-gray-300">
                  From:
                </label>
                <select
                  id="start-year-select"
                  value={timelineStartYear ?? ''}
                  onChange={(e) => setTimelineStartYear(parseInt(e.target.value, 10))}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                  disabled={!availableTimelineYears.length}
                >
                  {availableTimelineYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="end-year-select" className="text-sm font-medium text-gray-300">
                  To:
                </label>
                <select
                  id="end-year-select"
                  value={timelineEndYear ?? ''}
                  onChange={(e) => setTimelineEndYear(parseInt(e.target.value, 10))}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                  disabled={!availableTimelineYears.length}
                >
                  {availableTimelineYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredTimelineData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="year" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                            <p className="label font-bold mb-1">{`Year: ${label}`}</p>
                            <p className="intro" style={{ color: '#8884d8' }}>{`Male Athletes: ${data.male}`}</p>
                            <p className="intro" style={{ color: '#82ca9d' }}>{`Female Athletes: ${data.female}`}</p>
                            <p className="intro" style={{ color: '#FFB74D' }}>{`Total Athletes: ${data.total}`}</p>
                            <p className="intro" style={{ color: '#FFC0CB' }}>{`Female %: ${data.femalePercentage.toFixed(1)}%`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
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
        )}

        {activeVisualization === 'femalePercentage' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Female Participation Percentage Over Time</h2>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="year" stroke="#ccc" />
                  <YAxis domain={[0, 100]} stroke="#ccc" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Female Athletes']}
                    labelFormatter={(value) => `Year: ${value}`}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
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
        )}

        {activeVisualization === 'sports' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Gender Distribution by Sport</h2>
            <p className="text-gray-400 mb-2">Sports sorted by female participation rate.</p>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search sports..."
                value={sportSearchTerm}
                onChange={(e) => setSportSearchTerm(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={filteredSportData}
                  margin={{
                    top: 5,
                    right: 50,
                    left: 90,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" domain={[0, 100]} stroke="#ccc" tickFormatter={(tick) => `${tick}%`} />
                  <YAxis
                    type="category"
                    dataKey="sport"
                    stroke="#ccc"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const sportData = allSportGenderData.find(s => s.sport === label);
                        if (sportData) {
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`${label}`}</p>
                              <p className="intro" style={{ color: '#82ca9d' }}>{`Female: ${sportData.female.toFixed(1)}%`}</p>
                              <p className="intro" style={{ color: '#8884d8' }}>{`Male: ${sportData.male.toFixed(1)}%`}</p>
                            </div>
                          );
                        }
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar dataKey="female" name="Female Athletes %" stackId="a" fill="#82ca9d">
                    <LabelList
                      dataKey="female"
                      position="center"
                      formatter={(value) => `${value}%`}
                      style={{ fill: '#1a202c', fontSize: '10px', fontWeight: 'bold' }}
                    />
                  </Bar>
                  <Bar dataKey="male" name="Male Athletes %" stackId="a" fill="#8884d8">
                    <LabelList
                      dataKey="male"
                      position="center"
                      formatter={(value) => `${value}%`}
                      style={{ fill: 'white', fontSize: '10px', fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeVisualization === 'countries' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Female Athlete Count by Country</h2>
            <div className="mb-6">
              <label htmlFor="year-select-map" className="block text-sm font-medium text-gray-300 mb-1">
                Select Olympic Year
              </label>
              <select
                id="year-select-map"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-1/3 p-2.5"
              >
                <option value="all">All Years (Avg)</option>
                <option value="2016">Rio 2016</option>
                <option value="2012">London 2012</option>
                <option value="2008">Beijing 2008</option>
              </select>
            </div>

            <div className="h-[500px] border border-gray-700 rounded overflow-hidden relative bg-gray-900">
              <ComposableMap
                data-tooltip-id="country-tooltip"
                projectionConfig={{ scale: 147 }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup center={[0, 0]} zoom={1}>
                  <Sphere stroke="#555" strokeWidth={0.5} fill="transparent" />
                  <Graticule stroke="#555" strokeWidth={0.5} />
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const countryName = geo.properties.NAME;
                        const femaleCount = countryDataMap[countryName];
                        const displayCount = femaleCount !== undefined ? femaleCount : 'N/A';
                        const tooltipText = `${countryName} — Female Athletes: ${displayCount}`;
                        
                        const fillColor = femaleCount !== undefined ? colorScale(femaleCount) : "#4B5563";

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            data-tooltip-id="country-tooltip"
                            data-tooltip-content={tooltipText}
                            style={{
                              default: {
                                fill: fillColor,
                                stroke: "#374151",
                                strokeWidth: 0.5,
                                outline: "none"
                              },
                              hover: {
                                fill: "#A78BFA",
                                stroke: "#FFF",
                                strokeWidth: 0.75,
                                outline: "none",
                                cursor: "pointer"
                              },
                              pressed: {
                                fill: "#8B5CF6",
                                outline: "none"
                              }
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
              <Tooltip id="country-tooltip" />
            </div>
            <div className="flex justify-center items-center space-x-4 mt-4 text-xs text-gray-400">
              <span>Low Count</span>
              <div className="flex">
                <div className="w-8 h-4" style={{ backgroundColor: colorScale.range()[0] }}></div>
                <div className="w-8 h-4" style={{ backgroundColor: colorScale.range()[1] }}></div>
                <div className="w-8 h-4" style={{ backgroundColor: colorScale.range()[2] }}></div>
              </div>
              <span>High Count</span>
            </div>
          </div>
        )}

        {activeVisualization === 'age' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Athlete Age Distribution by Gender (Mock Data)</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageDistributionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="ageBracket" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                     contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                     formatter={(value, name) => [value, name === 'male' ? 'Male Athletes' : 'Female Athletes']}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar dataKey="male" name="Male Athletes" fill="#8884d8" />
                  <Bar dataKey="female" name="Female Athletes" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeVisualization === 'medals' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Total Medals Won by Gender (Mock Data)</h2>
             <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart
                   data={medalGenderData}
                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                   <XAxis dataKey="gender" stroke="#ccc" />
                   <YAxis stroke="#ccc" />
                   <Tooltip contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}/>
                   <Legend wrapperStyle={{ color: "#ccc" }} />
                   <Bar dataKey="gold" name="Gold" fill="#FFD700" />
                   <Bar dataKey="silver" name="Silver" fill="#C0C0C0" />
                   <Bar dataKey="bronze" name="Bronze" fill="#CD7F32" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}

        {activeVisualization === 'continents' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Gender Distribution by Continent (% - Mock Data)</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={continentGenderData}
                  layout="vertical"
                  margin={{ top: 5, right: 50, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" domain={[0, 100]} stroke="#ccc" tickFormatter={(tick) => `${tick}%`} />
                  <YAxis type="category" dataKey="continent" stroke="#ccc" width={90} tick={{ fontSize: 12 }}/>
                  <Tooltip
                     contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                     formatter={(value, name) => [`${value.toFixed(1)}%`, name === 'malePercentage' ? 'Male %' : 'Female %']}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar dataKey="femalePercentage" name="Female %" stackId="a" fill="#82ca9d">
                    <LabelList dataKey="femalePercentage" position="center" formatter={(value) => `${value}%`} style={{ fill: '#1a202c', fontSize: '10px', fontWeight: 'bold' }}/>
                  </Bar>
                  <Bar dataKey="malePercentage" name="Male %" stackId="a" fill="#8884d8">
                     <LabelList dataKey="malePercentage" position="center" formatter={(value) => `${value}%`} style={{ fill: 'white', fontSize: '10px', fontWeight: 'bold' }}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Note: This page uses simulated/mock gender distribution, age, medal, and continental data for visualization purposes.</p>
        </div>
      </div>
    </main>
  );
}