'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import Papa from 'papaparse';

export default function GenderParticipation() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeVisualization, setActiveVisualization] = useState('timeline');
  const [timelineStartYear, setTimelineStartYear] = useState(null);
  const [timelineEndYear, setTimelineEndYear] = useState(null);
  const [availableTimelineYears, setAvailableTimelineYears] = useState([]);
  const [processedAthletes, setProcessedAthletes] = useState([]);
  const [selectedTimelineCountry, setSelectedTimelineCountry] = useState('all');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [selectedSportYear, setSelectedSportYear] = useState('all');
  const [sportCheckboxList, setSportCheckboxList] = useState([]);
  const [timelineSportCheckboxList, setTimelineSportCheckboxList] = useState([]);

  const [timelineSearchQuery, setTimelineSearchQuery] = useState('All Countries');
  const [timelineSearchSuggestions, setTimelineSearchSuggestions] = useState([]);
  const [showTimelineSuggestions, setShowTimelineSuggestions] = useState(false);
  const timelineSearchContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (timelineSearchContainerRef.current && !timelineSearchContainerRef.current.contains(event.target)) {
        setShowTimelineSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [timelineSearchContainerRef]);

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
      const athleteData = athleteParseResult.data.filter(row => row.ID && row.NOC && row.Year && row.Sex && row.Sport);

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

    const uniqueEntries = new Map();
    data.forEach(row => {
      if (!row || !row.ID || !row.Year || !row.Sex || !row.NOC || !row.Sport || !row.Season) return;
      const regionName = regionMap[row.NOC] || row.NOC;
      const key = `${row.ID}-${row.Year}`;
      if (!uniqueEntries.has(key)) {
        uniqueEntries.set(key, {
          id: row.ID,
          sex: row.Sex,
          noc: row.NOC,
          country: regionName,
          year: row.Year,
          sport: row.Sport,
          season: row.Season // Add season field
        });
      }
    });
    const uniqueAthletesPerGames = Array.from(uniqueEntries.values());
    setProcessedAthletes(uniqueAthletesPerGames);
    console.log("Unique athletes per Games:", uniqueAthletesPerGames.length);

    const allYears = new Set();
    const allCountries = new Set();
    const allSports = new Set();
    uniqueAthletesPerGames.forEach(athlete => {
        if (athlete.year && !isNaN(athlete.year)) allYears.add(athlete.year);
        if (athlete.country) allCountries.add(athlete.country);
        if (athlete.sport) allSports.add(athlete.sport);
    });

    const sortedYears = Array.from(allYears).sort((a, b) => a - b);
    setAvailableTimelineYears(sortedYears);
    if (sortedYears.length > 0) {
      setTimelineStartYear(sortedYears[0]);
      setTimelineEndYear(sortedYears[sortedYears.length - 1]);
    } else {
      setTimelineStartYear(null);
      setTimelineEndYear(null);
    }

    const sortedCountries = [{ id: 'all', name: 'All Countries' }, ...Array.from(allCountries).sort().map(c => ({ id: c, name: c }))];
    setAvailableCountries(sortedCountries);

    const sortedSports = Array.from(allSports).sort();
    setAvailableSports(sortedSports);

    console.log("Data processing complete.");
  };

  const processedTimelineDataFiltered = useMemo(() => {
    if (!processedAthletes || processedAthletes.length === 0 || timelineSportCheckboxList.length === 0) {
      return [];
    }
    const checkedTimelineSports = new Set(timelineSportCheckboxList.filter(s => s.checked).map(s => s.id));
    if (checkedTimelineSports.size === 0) {
        return [];
    }
    console.log(`Filtering timeline for Country ID: ${selectedTimelineCountry}, ${checkedTimelineSports.size} Sports`);
    const filteredAthletes = processedAthletes.filter(athlete => {
      const countryMatch = selectedTimelineCountry === 'all' || athlete.country === selectedTimelineCountry;
      const sportMatch = checkedTimelineSports.has(athlete.sport);
      return countryMatch && sportMatch;
    });
    const timelineAgg = filteredAthletes.reduce((acc, row) => {
      const year = row.year;
      if (!year || isNaN(year) || !row.sex) return acc;
      
      // Use year-season as the key to separate Summer and Winter Olympics in the same year
      const seasonKey = row.season || "Summer"; // Default to Summer if not available
      const key = `${year}-${seasonKey}`;
      
      if (!acc[key]) {
        acc[key] = { 
          year: year, 
          season: seasonKey, 
          male: 0, 
          female: 0, 
          total: 0 
        };
      }
      
      acc[key].total++;
      if (row.sex === 'M') acc[key].male++;
      else if (row.sex === 'F') acc[key].female++;
      return acc;
    }, {});
    const aggregatedData = Object.values(timelineAgg).map(d => ({
      ...d,
      femalePercentage: d.total > 0 ? parseFloat(((d.female / d.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.year - b.year);
    console.log("Aggregated Timeline Data (Counts + %):", aggregatedData.length, "years");
    return aggregatedData;
  }, [processedAthletes, selectedTimelineCountry, timelineSportCheckboxList]);

  const processedSportDataFiltered = useMemo(() => {
    if (!processedAthletes || processedAthletes.length === 0 || sportCheckboxList.length === 0) {
      return [];
    }
    console.log(`Filtering sports for Year: ${selectedSportYear}`);
    const checkedSports = new Set(sportCheckboxList.filter(s => s.checked).map(s => s.id));
    if (checkedSports.size === 0) {
        return [];
    }
    const yearFilteredAthletes = selectedSportYear === 'all'
      ? processedAthletes
      : processedAthletes.filter(athlete => athlete.year === parseInt(selectedSportYear, 10));
    const sportFilteredAthletes = yearFilteredAthletes.filter(athlete => checkedSports.has(athlete.sport));
    const sportAgg = sportFilteredAthletes.reduce((acc, row) => {
      const sport = row.sport;
      if (!row.sex) return acc;
      if (!acc[sport]) {
        acc[sport] = { sport: sport, male: 0, female: 0, total: 0 };
      }
      acc[sport].total++;
      if (row.sex === 'M') acc[sport].male++;
      else if (row.sex === 'F') acc[sport].female++;
      return acc;
    }, {});
    const aggregatedData = Object.values(sportAgg).map(d => ({
      ...d,
      femalePercentage: d.total > 0 ? parseFloat(((d.female / d.total) * 100).toFixed(1)) : 0,
      malePercentage: d.total > 0 ? parseFloat(((d.male / d.total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.femalePercentage - a.femalePercentage);
    console.log("Aggregated Sport Data (Filtered):", aggregatedData.length, "sports");
    return aggregatedData;
  }, [processedAthletes, selectedSportYear, sportCheckboxList]);

  const filteredTimelineDataForDisplay = useMemo(() => {
    if (!processedTimelineDataFiltered || timelineStartYear === null || timelineEndYear === null) {
      return [];
    }
    const start = Math.min(timelineStartYear, timelineEndYear);
    const end = Math.max(timelineStartYear, timelineEndYear);
    return processedTimelineDataFiltered.filter(d => d.year >= start && d.year <= end);
  }, [processedTimelineDataFiltered, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!processedAthletes || processedAthletes.length === 0 || !availableSports.length) {
      setSportCheckboxList([]);
      return;
    }
    console.log(`Updating sport checkboxes for year: ${selectedSportYear}`);
    const sortedAllSports = availableSports;
    const sportsInSelectedYearSet = new Set();
    if (selectedSportYear === 'all') {
      sortedAllSports.forEach(sport => sportsInSelectedYearSet.add(sport));
    } else {
      const yearFilteredAthletes = processedAthletes.filter(athlete => athlete.year === parseInt(selectedSportYear, 10));
      yearFilteredAthletes.forEach(athlete => {
        if (athlete.sport) sportsInSelectedYearSet.add(athlete.sport);
      });
    }
    setSportCheckboxList(sortedAllSports.map(sport => {
        const isAvailable = sportsInSelectedYearSet.has(sport);
        return {
          id: sport,
          name: sport,
          checked: isAvailable,
          disabled: !isAvailable
        };
      })
    );
  }, [processedAthletes, selectedSportYear, availableSports]);

  useEffect(() => {
    if (!processedAthletes || processedAthletes.length === 0 || timelineStartYear === null || timelineEndYear === null || !availableSports.length) {
      setTimelineSportCheckboxList([]);
      return;
    }
    console.log(`Updating timeline sport checkboxes for range: ${timelineStartYear}-${timelineEndYear}`);
    const start = Math.min(timelineStartYear, timelineEndYear);
    const end = Math.max(timelineStartYear, timelineEndYear);
    const sortedAllSports = availableSports;
    const sportsInRangeSet = new Set();
    const rangeFilteredAthletes = processedAthletes.filter(athlete => athlete.year >= start && athlete.year <= end);
    rangeFilteredAthletes.forEach(athlete => {
      if (athlete.sport) sportsInRangeSet.add(athlete.sport);
    });
    setTimelineSportCheckboxList(sortedAllSports.map(sport => {
        const isAvailable = sportsInRangeSet.has(sport);
        return {
          id: sport,
          name: sport,
          checked: isAvailable,
          disabled: !isAvailable
        };
      })
    );
  }, [processedAthletes, timelineStartYear, timelineEndYear, availableSports]);

  const handleSportCheckboxChange = (sportId) => {
    setSportCheckboxList(prevList =>
      prevList.map(sport =>
        sport.id === sportId ? { ...sport, checked: !sport.checked } : sport
      )
    );
  };
  const handleSelectAllSports = () => {
    setSportCheckboxList(prevList =>
      prevList.map(sport =>
        !sport.disabled ? { ...sport, checked: true } : sport
      )
    );
  };
  const handleDeselectAllSports = () => {
    setSportCheckboxList(prevList =>
      prevList.map(sport => ({ ...sport, checked: false }))
    );
  };
  const handleTimelineSportCheckboxChange = (sportId) => {
    setTimelineSportCheckboxList(prevList =>
      prevList.map(sport =>
        sport.id === sportId ? { ...sport, checked: !sport.checked } : sport
      )
    );
  };
  const handleTimelineSelectAllSports = () => {
    setTimelineSportCheckboxList(prevList =>
      prevList.map(sport =>
        !sport.disabled ? { ...sport, checked: true } : sport
      )
    );
  };
  const handleTimelineDeselectAllSports = () => {
    setTimelineSportCheckboxList(prevList =>
      prevList.map(sport => ({ ...sport, checked: false }))
    );
  };

  const handleTimelineSearchChange = (event) => {
    const query = event.target.value;
    setTimelineSearchQuery(query);

    if (!query) {
      setTimelineSearchSuggestions([]);
      setShowTimelineSuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = availableCountries
      .filter(country => country.name.toLowerCase().startsWith(queryLower))
      .slice(0, 10);

    setTimelineSearchSuggestions(filtered);
    setShowTimelineSuggestions(filtered.length > 0);
  };

  const handleTimelineSuggestionClick = (country) => {
    setTimelineSearchQuery(country.name);
    setSelectedTimelineCountry(country.id);
    setShowTimelineSuggestions(false);
  };

  const handleTimelineSearchSubmit = (event) => {
    event.preventDefault();
    const queryLower = timelineSearchQuery.toLowerCase();
    const matchedCountry = availableCountries.find(c => c.name.toLowerCase() === queryLower);

    if (matchedCountry) {
      setSelectedTimelineCountry(matchedCountry.id);
    } else {
      const allCountriesOption = availableCountries.find(c => c.id === 'all');
      if (allCountriesOption) {
          setTimelineSearchQuery(allCountriesOption.name);
          setSelectedTimelineCountry(allCountriesOption.id);
      }
    }
    setShowTimelineSuggestions(false);
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
            Gender Participation Analysis
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'timeline' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('timeline')}
          >
            Timeline & Female %
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeVisualization === 'sports' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveVisualization('sports')}
          >
            By Sport
          </button>
        </div>

        {activeVisualization === 'timeline' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-start">
                <div className="md:col-span-1 flex flex-col relative" ref={timelineSearchContainerRef}>
                  <label htmlFor="timeline-country-search" className="text-sm font-medium text-gray-300 mb-1">Country:</label>
                  <div className="flex flex-col gap-2">
                    <form onSubmit={handleTimelineSearchSubmit} className="flex gap-2">
                      <div className="flex-grow">
                        <input
                          id="timeline-country-search"
                          type="text"
                          value={timelineSearchQuery}
                          onChange={handleTimelineSearchChange}
                          onFocus={() => setShowTimelineSuggestions(timelineSearchSuggestions.length > 0)}
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
                        setTimelineSearchQuery('All Countries');
                        setSelectedTimelineCountry('all');
                        setShowTimelineSuggestions(false);
                      }}
                      className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm w-full"
                    >
                      All Countries
                    </button>
                  </div>
                  
                  {showTimelineSuggestions && timelineSearchSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-20 bg-gray-600 border border-gray-500 rounded-md shadow-lg max-h-60 overflow-auto">
                      {timelineSearchSuggestions.map((country) => (
                        <li
                          key={country.id}
                          className="px-4 py-2 text-white hover:bg-gray-500 cursor-pointer"
                          onClick={() => handleTimelineSuggestionClick(country)}
                        >
                          {country.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="md:col-span-2">
                   <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-medium text-gray-300">Select Sports (Available in Range):</label>
                     <div className="space-x-2">
                       <button onClick={handleTimelineSelectAllSports} className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">Select All</button>
                       <button onClick={handleTimelineDeselectAllSports} className="text-xs px-2 py-0..5 bg-gray-600 hover:bg-gray-700 text-white rounded disabled:opacity-50">Deselect All</button>
                     </div>
                   </div>
                   <div className="h-32 overflow-y-auto border border-gray-600 rounded-lg p-2 bg-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                     {timelineSportCheckboxList.map(sport => (
                       <div key={sport.id} className="flex items-center">
                         <input id={`timeline-sport-checkbox-${sport.id}`} type="checkbox" checked={sport.checked} onChange={() => handleTimelineSportCheckboxChange(sport.id)} disabled={sport.disabled} className={`w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 ${sport.disabled ? 'cursor-not-allowed opacity-50' : ''}`} />
                         <label htmlFor={`timeline-sport-checkbox-${sport.id}`} className={`ml-2 text-sm font-medium truncate ${sport.disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300'}`} title={sport.name}>{sport.name}</label>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="start-year-select" className="text-sm font-medium text-gray-300">From:</label>
                  <select 
                    id="start-year-select" 
                    value={timelineStartYear ?? ''} 
                    onChange={(e) => {
                      const newStartYear = parseInt(e.target.value, 10);
                      setTimelineStartYear(newStartYear);
                      // If end year is smaller than start year, update end year to match start year
                      if (timelineEndYear < newStartYear) {
                        setTimelineEndYear(newStartYear);
                      }
                    }} 
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5" 
                    disabled={!availableTimelineYears.length}
                  >
                    {availableTimelineYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="end-year-select" className="text-sm font-medium text-gray-300">To:</label>
                  <select 
                    id="end-year-select" 
                    value={timelineEndYear ?? ''} 
                    onChange={(e) => setTimelineEndYear(parseInt(e.target.value, 10))} 
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5" 
                    disabled={!availableTimelineYears.length}
                  >
                    {availableTimelineYears
                      .filter(year => year >= timelineStartYear) // Only show years >= start year
                      .map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Athlete Counts Over Time</h2>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTimelineDataForDisplay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="year" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }} content={({ active, payload, label }) => {
                       if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const season = data.season || "Summer"; // Default to Summer if not specified
                        return (
                          <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                            <p className="label font-bold mb-1">{`${label} ${season} Olympics`}</p>
                            <p className="intro" style={{ color: '#8884d8' }}>{`Male Athletes: ${data.male}`}</p>
                            <p className="intro" style={{ color: '#82ca9d' }}>{`Female Athletes: ${data.female}`}</p>
                            <p className="intro" style={{ color: '#FFB74D' }}>{`Total Athletes: ${data.total}`}</p>
                            <p className="intro" style={{ color: '#FFC0CB' }}>{`Female %: ${data.femalePercentage.toFixed(1)}%`}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Area type="monotone" dataKey="male" name="Male Athletes" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="female" name="Female Athletes" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Female Participation Percentage Over Time</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTimelineDataForDisplay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="year" stroke="#ccc" />
                    <YAxis domain={[0, 100]} stroke="#ccc" tickFormatter={(tick) => `${tick}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }}
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Female Athletes']}
                      labelFormatter={(value) => {
                        const dataPoint = filteredTimelineDataForDisplay.find(item => item.year === value);
                        const season = dataPoint?.season || "Summer"; // Default to Summer if not found
                        return `${value} ${season} Olympics`;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#ccc" }} />
                    <Line type="monotone" dataKey="femalePercentage" name="Female Athletes (%)" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeVisualization === 'sports' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Gender Distribution by Sport</h2>
            <p className="text-gray-400 mb-2">Sports sorted by female participation rate.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1">
                <label htmlFor="sport-year-select" className="block text-sm font-medium text-gray-300 mb-1">Select Year:</label>
                <select id="sport-year-select" value={selectedSportYear} onChange={(e) => setSelectedSportYear(e.target.value)} className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                  <option value="all">All Years</option>
                  {availableTimelineYears.map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
              </div>
              <div className="md:col-span-2">
                 <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-medium text-gray-300">Select Sports:</label>
                   <div className="space-x-2">
                     <button onClick={handleSelectAllSports} className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">Select All</button>
                     <button onClick={handleDeselectAllSports} className="text-xs px-2 py-0.5 bg-gray-600 hover:bg-gray-700 text-white rounded disabled:opacity-50">Deselect All</button>
                   </div>
                 </div>
                 <div className="h-32 overflow-y-auto border border-gray-600 rounded-lg p-2 bg-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                   {sportCheckboxList.map(sport => (
                     <div key={sport.id} className="flex items-center">
                       <input id={`sport-checkbox-${sport.id}`} type="checkbox" checked={sport.checked} onChange={() => handleSportCheckboxChange(sport.id)} disabled={sport.disabled} className={`w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 ${sport.disabled ? 'cursor-not-allowed opacity-50' : ''}`} />
                       <label htmlFor={`sport-checkbox-${sport.id}`} className={`ml-2 text-sm font-medium truncate ${sport.disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300'}`} title={sport.name}>{sport.name}</label>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={processedSportDataFiltered} margin={{ top: 5, right: 50, left: 90, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" domain={[0, 100]} stroke="#ccc" tickFormatter={(tick) => `${tick}%`} />
                  <YAxis type="category" dataKey="sport" stroke="#ccc" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#333", borderColor: "#555", color: "#fff" }} content={({ active, payload, label }) => {
                     if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 bg-gray-700 border border-gray-600 rounded shadow-lg text-sm text-gray-200">
                            <p className="label font-bold mb-1">{`${label}`}</p>
                            <p className="intro" style={{ color: '#82ca9d' }}>{`Female: ${data.female} (${data.femalePercentage.toFixed(1)}%)`}</p>
                            <p className="intro" style={{ color: '#8884d8' }}>{`Male: ${data.male} (${data.malePercentage.toFixed(1)}%)`}</p>
                            <p className="intro" style={{ color: '#FFB74D' }}>{`Total: ${data.total}`}</p>
                          </div>
                        );
                      }
                      return null;
                  }} />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar dataKey="femalePercentage" name="Female Athletes %" stackId="a" fill="#82ca9d">
                    <LabelList dataKey="femalePercentage" position="center" formatter={(value) => value > 5 ? `${value.toFixed(0)}%` : ''} style={{ fill: '#1a202c', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="malePercentage" name="Male Athletes %" stackId="a" fill="#8884d8">
                    <LabelList dataKey="malePercentage" position="center" formatter={(value) => value > 5 ? `${value.toFixed(0)}%` : ''} style={{ fill: 'white', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Data sourced from Kaggle Olympics dataset (athlete_events.csv and noc_regions.csv). Counts represent unique athletes per Games/Sport/Country as applicable.</p>
        </div>
      </div>
    </main>
  );
}