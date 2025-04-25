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
import Papa from 'papaparse';

export default function GenderParticipation() {
  const [timelineData, setTimelineData] = useState([]);
  const [allSportGenderData, setAllSportGenderData] = useState([]);
  const [filteredSportData, setFilteredSportData] = useState([]);
  const [sportSearchTerm, setSportSearchTerm] = useState('');
  const [countryGenderData, setCountryGenderData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2016');
  const [isLoading, setIsLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [activeVisualization, setActiveVisualization] = useState('timeline');
  const [timelineStartYear, setTimelineStartYear] = useState(null);
  const [timelineEndYear, setTimelineEndYear] = useState(null);
  const [availableTimelineYears, setAvailableTimelineYears] = useState([]);
  const [countryDataByYear, setCountryDataByYear] = useState({});
  const [nocMap, setNocMap] = useState({});
  const [colorDomain, setColorDomain] = useState([0, 1, 2]);
  const [processedAthletes, setProcessedAthletes] = useState([]);
  const [selectedTimelineCountry, setSelectedTimelineCountry] = useState('all');
  const [selectedTimelineSport, setSelectedTimelineSport] = useState('all');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);

  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  const colorScale = useMemo(() => scaleLinear()
    .domain(colorDomain)
    .range(["#FFEDA0", "#FEB24C", "#F03b20"]),
    [colorDomain]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const athleteCsvPath = '/data/athlete_events.csv';
      const athleteResponse = await fetch(athleteCsvPath);
      if (!athleteResponse.ok) throw new Error(`Failed to fetch ${athleteCsvPath}`);
      const athleteCsvText = await athleteResponse.text();
      const athleteParseResult = Papa.parse(athleteCsvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      const athleteData = athleteParseResult.data.filter(row => row.ID && row.NOC);
      setProcessedAthletes(athleteData);

      const nocCsvPath = '/data/noc_regions.csv';
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
      setNocMap(regionMap);

      if (athleteData.length > 0 && Object.keys(regionMap).length > 0) {
        processRawData(athleteData, regionMap);
      } else {
        console.error("Data or NOC map missing.");
      }

    } catch (error) {
      console.error("Error fetching or processing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processRawData = (data, regionMap) => {
    console.log("Processing raw data:", data.length, "rows with NOC map");

    // --- Unique Athletes per Games Year ---
    const uniqueEntries = new Map();
    data.forEach(row => {
      if (!row || !row.ID || !row.Year || !row.Sex || !row.NOC || !row.Sport) return;
      const regionName = regionMap[row.NOC] || row.NOC;
      const key = `${row.ID}-${row.Year}`;
      if (!uniqueEntries.has(key)) {
        uniqueEntries.set(key, {
          id: row.ID,
          sex: row.Sex,
          age: row.Age,
          noc: row.NOC,
          country: regionName, // Mapped region name
          year: row.Year,
          sport: row.Sport,
        });
      }
    });
    const uniqueAthletesPerGames = Array.from(uniqueEntries.values());
    setProcessedAthletes(uniqueAthletesPerGames); // Store processed athletes
    console.log("Unique athletes per Games:", uniqueAthletesPerGames.length);

    // --- Extract Years, Countries, Sports for Filters/Sliders ---
    const allYears = new Set();
    const allCountries = new Set();
    const allSports = new Set();
    uniqueAthletesPerGames.forEach(athlete => {
        if (athlete.year && !isNaN(athlete.year)) allYears.add(athlete.year);
        if (athlete.country) allCountries.add(athlete.country);
        if (athlete.sport) allSports.add(athlete.sport);
    });

    const sortedYears = Array.from(allYears).sort((a, b) => a - b);
    setAvailableTimelineYears(sortedYears); // Set full range for sliders
    if (sortedYears.length > 0) {
      setTimelineStartYear(sortedYears[0]); // Set initial slider range
      setTimelineEndYear(sortedYears[sortedYears.length - 1]);
    } else {
      setTimelineStartYear(null);
      setTimelineEndYear(null);
    }

    const sortedCountries = [{ id: 'all', name: 'All Countries' }, ...Array.from(allCountries).sort().map(c => ({ id: c, name: c }))];
    setAvailableCountries(sortedCountries); // Set countries for timeline filter

    const sortedSports = [{ id: 'all', name: 'All Sports' }, ...Array.from(allSports).sort().map(s => ({ id: s, name: s }))];
    setAvailableSports(sortedSports); // Set sports for timeline filter

    // --- Sport Data (remains the same) ---
    const sportAgg = uniqueAthletesPerGames.reduce((acc, row) => {
      const sport = row.sport;
      if (!sport || !row.sex) return acc;

      if (!acc[sport]) {
        acc[sport] = { sport: sport, male: 0, female: 0, total: 0 };
      }
      acc[sport].total++;
      if (row.sex === 'M') acc[sport].male++;
      else if (row.sex === 'F') acc[sport].female++;
      return acc;
    }, {});
    const processedSportData = Object.values(sportAgg).map(d => ({
      ...d,
      femalePercentage: d.total > 0 ? parseFloat(((d.female / d.total) * 100).toFixed(1)) : 0,
      malePercentage: d.total > 0 ? parseFloat(((d.male / d.total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.femalePercentage - a.femalePercentage);
    setAllSportGenderData(processedSportData);
    setFilteredSportData(processedSportData);
    console.log("Processed Sport Data:", processedSportData.length, "sports");

    // --- Country Data By Year (for Map - remains the same) ---
    const countryYears = ['all', 2016, 2012, 2008];
    const processedCountryDataByYear = {};
    const allCountryAgg = {};

    uniqueAthletesPerGames.forEach(row => {
      const year = row.year;
      const countryName = row.country;
      if (!countryName || !year || isNaN(year) || !row.sex) return;

      if (!allCountryAgg[countryName]) {
        allCountryAgg[countryName] = { country: countryName, male: 0, female: 0, total: 0 };
      }
      allCountryAgg[countryName].total++;
      if (row.sex === 'M') allCountryAgg[countryName].male++;
      else if (row.sex === 'F') allCountryAgg[countryName].female++;

      if (countryYears.includes(year)) {
        const yearStr = String(year);
        if (!processedCountryDataByYear[yearStr]) {
          processedCountryDataByYear[yearStr] = {};
        }
        if (!processedCountryDataByYear[yearStr][countryName]) {
          processedCountryDataByYear[yearStr][countryName] = { country: countryName, male: 0, female: 0, total: 0 };
        }
        processedCountryDataByYear[yearStr][countryName].total++;
        if (row.sex === 'M') processedCountryDataByYear[yearStr][countryName].male++;
        else if (row.sex === 'F') processedCountryDataByYear[yearStr][countryName].female++;
      }
    });

    processedCountryDataByYear.all = Object.values(allCountryAgg);

    countryYears.forEach(year => {
      if (year === 'all') return;
      const yearStr = String(year);
      processedCountryDataByYear[yearStr] = processedCountryDataByYear[yearStr]
        ? Object.values(processedCountryDataByYear[yearStr])
        : [];
    });

    setCountryDataByYear(processedCountryDataByYear);
    const initialCountryData = processedCountryDataByYear[selectedYear] || processedCountryDataByYear.all || [];
    setCountryGenderData(initialCountryData);
    console.log("Processed Country Data By Year. Initial data for", selectedYear, ":", initialCountryData.length, "countries");

    let maxFemaleCount = 0;
    processedCountryDataByYear.all.forEach(d => {
      if (d.female > maxFemaleCount) maxFemaleCount = d.female;
    });
    const allFemaleCounts = processedCountryDataByYear.all.map(d => d.female).filter(c => c > 0).sort((a, b) => a - b);
    if (allFemaleCounts.length > 2) {
      const minCount = allFemaleCounts[0];
      const medianCount = allFemaleCounts[Math.floor(allFemaleCounts.length / 2)];
      const maxCount = allFemaleCounts[allFemaleCounts.length - 1];
      const newDomain = [
        minCount,
        Math.max(minCount + 1, Math.floor(medianCount)),
        Math.max(medianCount + 1, maxCount)
      ].filter((v, i, a) => a.indexOf(v) === i);
      if (newDomain.length < 2) newDomain.push(newDomain[0] + 1);
      if (newDomain.length < 3) newDomain.push(newDomain[1] + 1);
      console.log("Updating color scale domain:", newDomain.slice(0, 3));
      setColorDomain(newDomain.slice(0, 3));
    } else if (allFemaleCounts.length > 0) {
      const fallbackDomain = [0, allFemaleCounts[0], Math.max(1, allFemaleCounts[0] * 2)];
      console.log("Updating color scale domain (fallback):", fallbackDomain);
      setColorDomain(fallbackDomain);
    } else {
      console.log("No female counts found for color scale domain, using default.");
      setColorDomain([0, 1, 2]);
    }

    const mapYearOptions = ['all', ...countryYears.filter(y => y !== 'all').sort((a, b) => b - a)];
    setYears(mapYearOptions); // Keep this for the map dropdown

    console.log("Data processing complete (Timeline aggregation moved to useMemo).");
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
    if (isLoading || Object.keys(countryDataByYear).length === 0 || Object.keys(nocMap).length === 0) return;

    const newData = countryDataByYear[selectedYear] || countryDataByYear.all || [];
    setCountryGenderData(newData);

  }, [selectedYear, isLoading, countryDataByYear, nocMap]);

  // --- useMemo for Filtered and Aggregated Timeline Data ---
  const processedTimelineDataFiltered = useMemo(() => {
    if (!processedAthletes || processedAthletes.length === 0) {
      return [];
    }
    console.log(`Filtering timeline for Country: ${selectedTimelineCountry}, Sport: ${selectedTimelineSport}`);

    // Filter by country and sport
    const filteredAthletes = processedAthletes.filter(athlete => {
      const countryMatch = selectedTimelineCountry === 'all' || athlete.country === selectedTimelineCountry;
      const sportMatch = selectedTimelineSport === 'all' || athlete.sport === selectedTimelineSport;
      return countryMatch && sportMatch;
    });

    // Aggregate the filtered data by year
    const timelineAgg = filteredAthletes.reduce((acc, row) => {
      const year = row.year;
      if (!year || isNaN(year) || !row.sex) return acc;

      if (!acc[year]) {
        acc[year] = { year: year, male: 0, female: 0, total: 0 };
      }
      acc[year].total++;
      if (row.sex === 'M') acc[year].male++;
      else if (row.sex === 'F') acc[year].female++;
      return acc;
    }, {});

    // Format and sort
    const aggregatedData = Object.values(timelineAgg).map(d => ({
      ...d,
      femalePercentage: d.total > 0 ? parseFloat(((d.female / d.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.year - b.year);

    console.log("Aggregated Timeline Data (Filtered):", aggregatedData.length, "years");
    return aggregatedData;

  }, [processedAthletes, selectedTimelineCountry, selectedTimelineSport]); // Dependencies

  // --- useMemo for Map Data (remains the same) ---
  const countryDataMap = useMemo(() => {
    const map = {};
    if (Array.isArray(countryGenderData)) {
      countryGenderData.forEach(item => {
        let mapKey = item.country;
        if (mapKey === 'USA') mapKey = 'United States of America';
        if (mapKey === 'UK') mapKey = 'United Kingdom';
        if (mapKey === 'Czech Republic') mapKey = 'Czechia';
        map[mapKey] = item.female;
      });
    }
    return map;
  }, [countryGenderData, selectedYear]);

  // --- Update useMemo for Timeline YEAR RANGE Filtering ---
  const filteredTimelineData = useMemo(() => {
    // Now uses the already filtered/aggregated data
    if (!processedTimelineDataFiltered || timelineStartYear === null || timelineEndYear === null) {
      return [];
    }
    const start = Math.min(timelineStartYear, timelineEndYear);
    const end = Math.max(timelineStartYear, timelineEndYear);
    // Filter the aggregated data by the selected year range
    return processedTimelineDataFiltered.filter(d => d.year >= start && d.year <= end);
  }, [processedTimelineDataFiltered, timelineStartYear, timelineEndYear]); // Use processedTimelineDataFiltered

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
        </div>

        {activeVisualization === 'timeline' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Evolution of Gender Participation</h2>

            <div className="flex flex-wrap justify-center gap-4 mb-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="timeline-country-select" className="text-sm font-medium text-gray-300">Country:</label>
                <select
                  id="timeline-country-select"
                  value={selectedTimelineCountry}
                  onChange={(e) => setSelectedTimelineCountry(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 max-w-[200px]"
                >
                  {availableCountries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="timeline-sport-select" className="text-sm font-medium text-gray-300">Sport:</label>
                <select
                  id="timeline-sport-select"
                  value={selectedTimelineSport}
                  onChange={(e) => setSelectedTimelineSport(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 max-w-[200px]"
                >
                  {availableSports.map(sport => (
                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-6 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="start-year-select" className="text-sm font-medium text-gray-300">From:</label>
                <select
                  id="start-year-select"
                  value={timelineStartYear ?? ''}
                  onChange={(e) => setTimelineStartYear(parseInt(e.target.value, 10))}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                  disabled={!availableTimelineYears.length}
                >
                  {availableTimelineYears.map(year => (<option key={year} value={year}>{year}</option>))}
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
                  {availableTimelineYears.map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  <Area type="monotone" dataKey="male" name="Male Athletes" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="female" name="Female Athletes" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
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
                {years.map(year => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years (Total)' : year}
                  </option>
                ))}
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

        <div className="text-center text-sm text-gray-500 mt-12">
          <p>Data sourced from Kaggle Olympics dataset (athlete_events.csv and noc_regions.csv). Counts represent unique athletes per Games/Sport/Country as applicable.</p>
        </div>
      </div>
    </main>
  );
}