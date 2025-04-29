'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import Papa from 'papaparse';

export default function AgePerformance() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeVisualization, setActiveVisualization] = useState('ageDistribution');
  const [processedAthletes, setProcessedAthletes] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedMedal, setSelectedMedal] = useState('all');
  
  // For country search
  const [countrySearchQuery, setCountrySearchQuery] = useState('All Countries');
  const [countrySearchSuggestions, setCountrySearchSuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const countrySearchContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (countrySearchContainerRef.current && !countrySearchContainerRef.current.contains(event.target)) {
        setShowCountrySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [countrySearchContainerRef]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const athleteCsvPath = './data/athlete_events.csv';
      const athleteResponse = await fetch(athleteCsvPath);
      if (!athleteResponse.ok) throw new Error(`Failed to fetch ${athleteCsvPath}`);
      const athleteCsvText = await athleteResponse.text();
      const athleteParseResult = Papa.parse(athleteCsvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      const athleteData = athleteParseResult.data.filter(row => 
        row.ID && row.NOC && row.Year && row.Age
      );

      const nocCsvPath = './data/noc_regions.csv';
      const nocResponse = await fetch(nocCsvPath);
      if (!nocResponse.ok) throw new Error(`Failed to fetch ${nocCsvPath}`);
      const nocCsvText = await nocResponse.text();
      const nocParseResult = Papa.parse(nocCsvText, {
        header: true,
        skipEmptyLines: true,
      });
      
      const regionMap = nocParseResult.data.reduce((map, row) => {
        if (row.NOC && row.region) {
          map[row.NOC] = row.region;
        }
        return map;
      }, {});

      if (athleteData.length > 0 && Object.keys(regionMap).length > 0) {
        processRawData(athleteData, regionMap);
      } else {
        console.error("Athlete data or NOC map missing.");
      }
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processRawData = (data, regionMap) => {
    console.log("Processing raw data:", data.length, "rows");

    // Process athletes with age data
    const athletes = data
      .filter(row => row.Age && !isNaN(row.Age))
      .map(row => {
        const regionName = regionMap[row.NOC] || row.NOC;
        return {
          id: row.ID,
          name: row.Name,
          sex: row.Sex,
          age: row.Age,
          height: row.Height,
          weight: row.Weight,
          noc: row.NOC,
          country: regionName,
          year: row.Year,
          sport: row.Sport,
          event: row.Event,
          medal: row.Medal,
          season: row.Season
        };
      });

    setProcessedAthletes(athletes);
    console.log("Processed athletes with age data:", athletes.length);

    // Extract available filter options
    const allYears = new Set();
    const allSports = new Set();
    const allCountries = new Set();

    athletes.forEach(athlete => {
      if (athlete.year) allYears.add(athlete.year);
      if (athlete.sport) allSports.add(athlete.sport);
      if (athlete.country) allCountries.add(athlete.country);
    });

    setAvailableYears(Array.from(allYears).sort((a, b) => a - b));
    setAvailableSports(Array.from(allSports).sort());
    
    const sortedCountries = [
      { id: 'all', name: 'All Countries' }, 
      ...Array.from(allCountries).sort().map(c => ({ id: c, name: c }))
    ];
    setAvailableCountries(sortedCountries);

    console.log("Data processing complete.");
  };

  const filteredAthleteData = useMemo(() => {
    if (!processedAthletes.length) return [];
    
    return processedAthletes.filter(athlete => {
      const yearMatch = selectedYear === 'all' || athlete.year === parseInt(selectedYear, 10);
      const sportMatch = selectedSport === 'all' || athlete.sport === selectedSport;
      const countryMatch = selectedCountry === 'all' || athlete.country === selectedCountry;
      const medalMatch = selectedMedal === 'all' || 
                         (selectedMedal === 'any' && athlete.medal) || 
                         athlete.medal === selectedMedal;
      
      return yearMatch && sportMatch && countryMatch && medalMatch;
    });
  }, [processedAthletes, selectedYear, selectedSport, selectedCountry, selectedMedal]);

  // 1. Age Distribution Data
  const ageDistributionData = useMemo(() => {
    if (!filteredAthleteData.length) return [];
    
    // Group athletes by age
    const ageGroups = {};
    filteredAthleteData.forEach(athlete => {
      const age = Math.floor(athlete.age);
      if (!ageGroups[age]) {
        ageGroups[age] = { 
          age: age, 
          count: 0,
          medalCount: 0
        };
      }
      
      ageGroups[age].count++;
      if (athlete.medal) ageGroups[age].medalCount++;
    });
    
    return Object.values(ageGroups).sort((a, b) => a.age - b.age);
  }, [filteredAthleteData]);

  // 2. Age vs Medal Performance Data
  const ageMedalData = useMemo(() => {
    if (!filteredAthleteData.length) return [];
    
    // Group athletes by age and calculate medal percentage
    const ageGroups = {};
    
    filteredAthleteData.forEach(athlete => {
      const age = Math.floor(athlete.age);
      if (!ageGroups[age]) {
        ageGroups[age] = { 
          age: age, 
          totalAthletes: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0,
          medalCount: 0
        };
      }
      
      ageGroups[age].totalAthletes++;
      
      if (athlete.medal === 'Gold') ageGroups[age].goldCount++;
      else if (athlete.medal === 'Silver') ageGroups[age].silverCount++;
      else if (athlete.medal === 'Bronze') ageGroups[age].bronzeCount++;
      
      if (athlete.medal) ageGroups[age].medalCount++;
    });
    
    // Calculate percentages
    return Object.values(ageGroups)
      .map(group => ({
        ...group,
        medalPercentage: parseFloat(((group.medalCount / group.totalAthletes) * 100).toFixed(1)),
        goldPercentage: parseFloat(((group.goldCount / group.totalAthletes) * 100).toFixed(1)),
        silverPercentage: parseFloat(((group.silverCount / group.totalAthletes) * 100).toFixed(1)),
        bronzePercentage: parseFloat(((group.bronzeCount / group.totalAthletes) * 100).toFixed(1))
      }))
      .sort((a, b) => a.age - b.age);
  }, [filteredAthleteData]);

  // 3. Peak Performance Age Data (Medal count by age)
  const medalsByAgeData = useMemo(() => {
    if (!filteredAthleteData.length) return [];
    
    // Group medals by age
    const ageGroups = {};
    filteredAthleteData.forEach(athlete => {
      if (!athlete.age || !athlete.medal) return;
      
      const age = Math.floor(athlete.age);
      if (!ageGroups[age]) {
        ageGroups[age] = { 
          age: age, 
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0,
          totalMedals: 0,
          athleteCount: 0
        };
      }
      
      if (athlete.medal === 'Gold') ageGroups[age].goldCount++;
      else if (athlete.medal === 'Silver') ageGroups[age].silverCount++;
      else if (athlete.medal === 'Bronze') ageGroups[age].bronzeCount++;
      
      ageGroups[age].totalMedals++;
      ageGroups[age].athleteCount++;
    });
    
    return Object.values(ageGroups)
      .sort((a, b) => a.age - b.age);
  }, [filteredAthleteData]);

  // 4. Age by Sport Comparison
  const ageBySportData = useMemo(() => {
    if (!filteredAthleteData.length) return [];
    
    const sportAgeGroups = {};
    
    filteredAthleteData.forEach(athlete => {
      if (!athlete.sport) return;
      
      if (!sportAgeGroups[athlete.sport]) {
        sportAgeGroups[athlete.sport] = {
          sport: athlete.sport,
          ages: [],
          medalAges: []
        };
      }
      
      sportAgeGroups[athlete.sport].ages.push(athlete.age);
      if (athlete.medal) {
        sportAgeGroups[athlete.sport].medalAges.push(athlete.age);
      }
    });
    
    // Calculate statistics for each sport
    return Object.values(sportAgeGroups)
      .map(group => {
        const ages = group.ages;
        const medalAges = group.medalAges;
        
        // Only include sports with sufficient data
        if (ages.length < 10) return null;
        
        // Calculate average age
        const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
        
        // Calculate average medal age if there are medal winners
        const avgMedalAge = medalAges.length > 0 
          ? medalAges.reduce((sum, age) => sum + age, 0) / medalAges.length 
          : null;
        
        // Calculate min and max ages
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        
        return {
          sport: group.sport,
          avgAge: parseFloat(avgAge.toFixed(1)),
          avgMedalAge: avgMedalAge !== null ? parseFloat(avgMedalAge.toFixed(1)) : null,
          minAge: minAge,
          maxAge: maxAge,
          athleteCount: ages.length,
          medalCount: medalAges.length
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => a.avgAge - b.avgAge);
  }, [filteredAthleteData]);


  // Age Trends Over Time
const ageTrendsOverTimeData = useMemo(() => {
  if (!filteredAthleteData.length) return [];
  
  // Group athletes by year
  const yearGroups = {};
  
  filteredAthleteData.forEach(athlete => {
    if (!athlete.year || !athlete.age) return;
    
    const year = athlete.year;
    if (!yearGroups[year]) {
      yearGroups[year] = {
        year: year,
        ages: []
      };
    }
    
    yearGroups[year].ages.push(athlete.age);
  });
  
  // Calculate statistics for each year
  return Object.values(yearGroups)
    .map(group => {
      const ages = group.ages;
      
      // Skip years with insufficient data
      if (ages.length < 5) return null;
      
      // Calculate statistics
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);
      const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      
      return {
        year: group.year,
        minAge: minAge,
        maxAge: maxAge,
        avgAge: parseFloat(avgAge.toFixed(1)),
        athleteCount: ages.length
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => a.year - b.year);
}, [filteredAthleteData]);


  // Handle country search
  const handleCountrySearchChange = (event) => {
    const query = event.target.value;
    setCountrySearchQuery(query);

    if (!query) {
      setCountrySearchSuggestions([]);
      setShowCountrySuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = availableCountries
      .filter(country => country.name.toLowerCase().startsWith(queryLower))
      .slice(0, 10);

    setCountrySearchSuggestions(filtered);
    setShowCountrySuggestions(filtered.length > 0);
  };

  const handleCountrySuggestionClick = (country) => {
    setCountrySearchQuery(country.name);
    setSelectedCountry(country.id);
    setShowCountrySuggestions(false);
  };

  const handleCountrySearchSubmit = (event) => {
    event.preventDefault();
    const queryLower = countrySearchQuery.toLowerCase();
    const matchedCountry = availableCountries.find(c => c.name.toLowerCase() === queryLower);

    if (matchedCountry) {
      setSelectedCountry(matchedCountry.id);
    } else {
      const allCountriesOption = availableCountries.find(c => c.id === 'all');
      if (allCountriesOption) {
        setCountrySearchQuery(allCountriesOption.name);
        setSelectedCountry(allCountriesOption.id);
      }
    }
    setShowCountrySuggestions(false);
  };

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
            Age vs Performance Analysis
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'ageDistribution' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('ageDistribution')}
          >
            Age Distribution
          </button>
          {/* <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'ageMedalRate' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('ageMedalRate')}
          >
            Age vs Medal Rate
          </button> */}
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'peakPerformance' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('peakPerformance')}
          >
            Peak Performance Age
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'ageTrends' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('ageTrends')}
          >
            Age Trends Over Time
          </button>


          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'ageBySport' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('ageBySport')}
          >
            Age by Sport
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-300 mb-1">Year:</label>
              <select 
                id="year-select" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="sport-select" className="block text-sm font-medium text-gray-300 mb-1">Sport:</label>
              <select 
                id="sport-select" 
                value={selectedSport} 
                onChange={(e) => setSelectedSport(e.target.value)} 
                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="all">All Sports</option>
                {availableSports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div className="relative" ref={countrySearchContainerRef}>
              <label htmlFor="country-search" className="block text-sm font-medium text-gray-300 mb-1">Country:</label>
              <div className="flex flex-col gap-2">
                <form onSubmit={handleCountrySearchSubmit} className="flex gap-2">
                  <div className="flex-grow">
                    <input
                      id="country-search"
                      type="text"
                      value={countrySearchQuery}
                      onChange={handleCountrySearchChange}
                      onFocus={() => setShowCountrySuggestions(countrySearchSuggestions.length > 0)}
                      placeholder="Search Country..."
                      className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                  >
                    Search
                  </button>
                </form>
                
                <button 
                  type="button"
                  onClick={() => {
                    setCountrySearchQuery('All Countries');
                    setSelectedCountry('all');
                    setShowCountrySuggestions(false);
                  }}
                  className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm w-full"
                >
                  All Countries
                </button>
              </div>
              
              {showCountrySuggestions && countrySearchSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-gray-600 border border-gray-500 rounded-md shadow-lg max-h-60 overflow-auto">
                  {countrySearchSuggestions.map((country) => (
                    <li
                      key={country.id}
                      className="px-4 py-2 text-white hover:bg-gray-500 cursor-pointer"
                      onClick={() => handleCountrySuggestionClick(country)}
                    >
                      {country.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="medal-select" className="block text-sm font-medium text-gray-300 mb-1">Medal:</label>
              <select 
                id="medal-select" 
                value={selectedMedal} 
                onChange={(e) => setSelectedMedal(e.target.value)} 
                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="all">All Athletes</option>
                {/* <option value="any">Any Medal</option> */}
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
            
            <div className="col-span-2 p-3 bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-sm font-medium text-gray-300">
                {filteredAthleteData.length} athletes match your filters
              </p>
            </div>
          </div>

          {/* Age Distribution Visualization */}
          {activeVisualization === 'ageDistribution' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Age Distribution of Olympic Athletes</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="age" stroke="#ccc" label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#ccc' }} />
                    <YAxis stroke="#ccc" label={{ value: 'Number of Athletes', angle: -90, position: 'insideLeft', fill: '#ccc' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`Age: ${label}`}</p>
                              <p className="intro" style={{ color: '#82ca9d' }}>{`Total Athletes: ${data.count}`}</p>
                              {/* <p className="intro" style={{ color: '#FFC0CB' }}>{`Medal Winners: ${data.medalCount}`}</p> */}
                              {/* <p className="intro" style={{ color: '#FFB74D' }}>{`Medal Rate: ${((data.medalCount / data.count) * 100).toFixed(1)}%`}</p> */}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Bar dataKey="count" name="Number of Athletes" fill="#82ca9d">
                      {ageDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.medalCount > 0 ? '#82ca9d' : '#555'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Age vs Medal Rate Visualization
          {activeVisualization === 'ageMedalRate' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Medal Win Rate by Age</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ageMedalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="age" stroke="#ccc" label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#ccc' }} />
                    <YAxis stroke="#ccc" label={{ value: 'Medal Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#ccc' }} domain={[0, 'dataMax + 5']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`Age: ${label}`}</p>
                              <p className="intro" style={{ color: '#FFD700' }}>{`Gold: ${data.goldCount} (${data.goldPercentage.toFixed(1)}%)`}</p>
                              <p className="intro" style={{ color: '#C0C0C0' }}>{`Silver: ${data.silverCount} (${data.silverPercentage.toFixed(1)}%)`}</p>
                              <p className="intro" style={{ color: '#CD7F32' }}>{`Bronze: ${data.bronzeCount} (${data.bronzePercentage.toFixed(1)}%)`}</p>
                              {/* <p className="intro" style={{ color: '#FF6B6B' }}>{`Any Medal: ${data.medalCount} (${data.medalPercentage.toFixed(1)}%)`}</p> */}
                              {/* <p className="intro" style={{ color: '#FFB74D' }}>{`Total Athletes: ${data.totalAthletes}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Line type="monotone" dataKey="medalPercentage" name="Any Medal %" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="goldPercentage" name="Gold %" stroke="#FFD700" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="silverPercentage" name="Silver %" stroke="#C0C0C0" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="bronzePercentage" name="Bronze %" stroke="#CD7F32" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )} */}

          {/* Peak Performance Age Visualization */}
          {activeVisualization === 'peakPerformance' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Peak Performance Age: Medal Count by Age</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={medalsByAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="age" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`Age: ${label}`}</p>
                              <p className="intro" style={{ color: '#FFD700' }}>{`Gold: ${data.goldCount}`}</p>
                              <p className="intro" style={{ color: '#C0C0C0' }}>{`Silver: ${data.silverCount}`}</p>
                              <p className="intro" style={{ color: '#CD7F32' }}>{`Bronze: ${data.bronzeCount}`}</p>
                              {/* <p className="intro" style={{ color: '#FF6B6B' }}>{`Total Medals: ${data.totalMedals}`}</p> */}
                              {/* <p className="intro" style={{ color: '#FFB74D' }}>{`Medalists: ${data.athleteCount}`}</p> */}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Bar dataKey="goldCount" name="Gold Medals" stackId="a" fill="#FFD700" />
                    <Bar dataKey="silverCount" name="Silver Medals" stackId="a" fill="#C0C0C0" />
                    <Bar dataKey="bronzeCount" name="Bronze Medals" stackId="a" fill="#CD7F32" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          )}

          {/* Age Trends Over Time Visualization */}
          {activeVisualization === 'ageTrends' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Age Trends Over Olympic History</h2>
              <p className="text-gray-400 mb-2">Shows how minimum, maximum, and average ages have changed over time.</p>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ageTrendsOverTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="year" stroke="#ccc" />
                    <YAxis stroke="#ccc" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`Year: ${label}`}</p>
                              <p className="intro" style={{ color: '#FF8042' }}>{`Maximum Age: ${data.maxAge}`}</p>
                              <p className="intro" style={{ color: '#82ca9d' }}>{`Average Age: ${data.avgAge}`}</p>
                              <p className="intro" style={{ color: '#8884d8' }}>{`Minimum Age: ${data.minAge}`}</p>
                              <p className="intro" style={{ color: '#FFB74D' }}>{`Athletes: ${data.athleteCount}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Line type="monotone" dataKey="maxAge" name="Maximum Age" stroke="#FF8042" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="avgAge" name="Average Age" stroke="#82ca9d" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="minAge" name="Minimum Age" stroke="#8884d8" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}


          {/* Age by Sport Visualization */}
          {activeVisualization === 'ageBySport' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Average Age by Sport</h2>
              <p className="text-gray-400 mb-2">Sports are sorted from youngest to oldest average age.</p>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={ageBySportData.slice(0, 20)} 
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" domain={[0, 'dataMax + 5']} stroke="#ccc" />
                    <YAxis 
                      type="category" 
                      dataKey="sport" 
                      stroke="#ccc" 
                      width={90} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                              <p className="label font-bold mb-1">{`${label}`}</p>
                              <p className="intro" style={{ color: '#82ca9d' }}>{`Average Age: ${data.avgAge}`} </p>
                              <p className="intro" style={{ color: '#8884d8' }}>{`Age Range: ${data.minAge} - ${data.maxAge}`}</p>
                              <p className="intro" style={{ color: '#FFB74D' }}>{`Athletes: ${data.athleteCount}`}</p>
                              {/* <p className="intro" style={{ color: '#FFC0CB' }}>{`Medal Winners: ${data.medalCount}`}</p> */}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Bar dataKey="avgAge" name="Average Age" fill="#82ca9d">
                      <LabelList dataKey="avgAge" position="right" formatter={(value) => value.toFixed(1)} style={{ fill: 'white' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Data sourced from Kaggle Olympics dataset (athlete_events.csv). Analysis shows age patterns for Olympic athletes and their medal performances.</p>
        </div>
      </div>
    </main>
  );
}
