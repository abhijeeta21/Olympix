'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule
} from "react-simple-maps";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Tooltip as ReactTooltip } from 'react-tooltip';

// URL for the world map data
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

export default function MedalDashboard() {
  const [selectedYear, setSelectedYear] = useState('all');
  const [medalType, setMedalType] = useState('total');
  const [countries, setCountries] = useState([]);
  const [medalData, setMedalData] = useState({});
  const [tooltipContent, setTooltipContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [olympicsYears, setOlympicsYears] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  const medalColors = {
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    total: "#3B82F6"
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch the summary data
        const summaryResponse = await fetch('/noc_summary.json');
        const summaryData = await summaryResponse.json();
        
        // Transform data for our needs
        const countryMedalData = Object.entries(summaryData).map(([noc, countryData]) => ({
          noc,
          id: noc.toLowerCase(),
          name: countryData.region,
          gold: countryData.medals.gold,
          silver: countryData.medals.silver,
          bronze: countryData.medals.bronze,
          total: countryData.medals.gold + countryData.medals.silver + countryData.medals.bronze
        }));

        setCountries(countryMedalData);
        
        // Create a map of countries with their medal data
        const medalDataMap = {};
        countryMedalData.forEach(country => {
          medalDataMap[country.noc.toLowerCase()] = country;
        });
        
        setMedalData(medalDataMap);
        
        // Set mock Olympic years - in a real app, fetch this from the API
        setOlympicsYears([
          { year: 'all', label: 'All Olympics' },
          { year: '2020', label: 'Tokyo 2020' },
          { year: '2016', label: 'Rio 2016' },
          { year: '2012', label: 'London 2012' },
          { year: '2008', label: 'Beijing 2008' },
          { year: '2004', label: 'Athens 2004' },
          { year: '2000', label: 'Sydney 2000' }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching medal data:", error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get the top 20 countries by medal count for the bar chart
  const getTopCountries = () => {
    return [...countries]
      .sort((a, b) => b[medalType] - a[medalType])
      .slice(0, 20);
  };

  // Get the appropriate fill color for the map based on medal count
  const getFillColor = (geo) => {
    const countryCode = geo.properties.ISO_A3 ? geo.properties.ISO_A3.toLowerCase() : '';
    const country = medalData[countryCode];
    
    if (!country) return "#F5F4F6"; // Default color for countries with no data
    
    const count = country[medalType];
    
    // Color scale based on medal count
    if (count === 0) return "#F5F4F6";
    if (count < 10) return "#EFF6FF";
    if (count < 50) return "#DBEAFE";
    if (count < 100) return "#BFDBFE";
    if (count < 200) return "#93C5FD";
    if (count < 500) return "#60A5FA";
    if (count < 1000) return "#3B82F6";
    if (count < 2000) return "#2563EB";
    return "#1E40AF";
  };

  const handleCountryClick = (geo) => {
    const countryCode = geo.properties.ISO_A3 ? geo.properties.ISO_A3.toLowerCase() : '';
    const country = medalData[countryCode];
    
    if (country) {
      setSelectedCountry(country);
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
            Olympic Medal Dashboard
          </h1>
          
          <div className="w-24"></div> {/* Empty div for balance */}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center bg-white p-4 rounded-lg shadow-md">
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
              Olympic Year
            </label>
            <select 
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              {olympicsYears.map((olympic) => (
                <option key={olympic.year} value={olympic.year}>
                  {olympic.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="medal-type" className="block text-sm font-medium text-gray-700 mb-1">
              Medal Type
            </label>
            <select 
              id="medal-type"
              value={medalType}
              onChange={(e) => setMedalType(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="total">Total Medals</option>
              <option value="gold">Gold Medals</option>
              <option value="silver">Silver Medals</option>
              <option value="bronze">Bronze Medals</option>
            </select>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Global Medal Distribution</h2>
          <div className="text-center text-sm text-gray-500 mb-4">
            Click on a country to view detailed medal information
          </div>
          
          <div className="h-[500px]">
            <ComposableMap
              projectionConfig={{
                rotate: [-10, 0, 0],
                scale: 147
              }}
              data-tip=""
              data-for="geo-tooltip"
            >
              <ZoomableGroup>
                <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
                <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(geo)}
                        stroke="#D6D6DA"
                        style={{
                          default: {
                            outline: "none"
                          },
                          hover: {
                            fill: "#F53",
                            outline: "none"
                          },
                          pressed: {
                            fill: "#E42",
                            outline: "none"
                          }
                        }}
                        onMouseEnter={() => {
                          const countryCode = geo.properties.ISO_A3 ? geo.properties.ISO_A3.toLowerCase() : '';
                          const country = medalData[countryCode];
                          
                          if (country) {
                            setTooltipContent(`
                              <div>
                                <strong>${country.name}</strong><br />
                                Gold: ${country.gold}<br />
                                Silver: ${country.silver}<br />
                                Bronze: ${country.bronze}<br />
                                Total: ${country.total}
                              </div>
                            `);
                          } else {
                            setTooltipContent(`${geo.properties.NAME}`);
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltipContent("");
                        }}
                        onClick={() => handleCountryClick(geo)}
                      />
                    ))
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>
        
        {/* Selected Country Details */}
        {selectedCountry && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCountry.name} ({selectedCountry.noc})
              </h2>
              <button 
                onClick={() => setSelectedCountry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">{selectedCountry.gold}</div>
                <div className="text-sm text-gray-600">Gold Medals</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-500">{selectedCountry.silver}</div>
                <div className="text-sm text-gray-600">Silver Medals</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-amber-700">{selectedCountry.bronze}</div>
                <div className="text-sm text-gray-600">Bronze Medals</div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href={`/countries/${selectedCountry.id}`}>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  View Full Country Analysis
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Top Countries Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Top 20 Countries by {medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals</h2>
          
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getTopCountries()}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 80,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={100}
                />
                <Tooltip 
                  formatter={(value, name) => [value, medalType === "total" ? "Total Medals" : `${medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals`]}
                  labelFormatter={(value) => `Country: ${value}`}
                />
                <Legend />
                <Bar 
                  dataKey={medalType} 
                  name={`${medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals`}
                >
                  {getTopCountries().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={medalColors[medalType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ReactTooltip 
        id="geo-tooltip"
        html={true}
        type="light"
        effect="float"
      >
        {tooltipContent}
      </ReactTooltip>
    </main>
  );
}