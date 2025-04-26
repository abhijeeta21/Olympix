'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';
import Papa from 'papaparse';

export default function Sports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYearData, setSelectedYearData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCountryData, setSelectedCountryData] = useState(null); // Now holds { countryName, sportsWithEvents: [{ sport, participatedEvents, totalEvents }] }
  const chartRef = useRef();
  const mapRef = useRef();
  const svgRef = useRef();
  const zoomBehaviorRef = useRef();

  const [isLoading, setIsLoading] = useState(true);
  const [olympicData, setOlympicData] = useState([]); // Will hold { year, sportsHeld, disciplines: {Sport: totalEventCount}, countries: {Country: {Sport: participatedEventCount}} }
  const [availableYears, setAvailableYears] = useState([]);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    async function fetchDataAndProcess() {
      setIsLoading(true);
      try {
        const [athleteRes, nocRes, geoRes] = await Promise.all([
          fetch('/data/athlete_events.csv'),
          fetch('/data/noc_regions.csv'),
          fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        ]);

        if (!athleteRes.ok || !nocRes.ok || !geoRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [athleteCsv, nocCsv, geoData] = await Promise.all([
          athleteRes.text(),
          nocRes.text(),
          geoRes.json()
        ]);

        setGeoJsonData(geoData);

        const athleteData = Papa.parse(athleteCsv, { header: true, skipEmptyLines: true, dynamicTyping: true }).data;
        const nocData = Papa.parse(nocCsv, { header: true, skipEmptyLines: true }).data;

        const nocMap = nocData.reduce((map, item) => {
          if (item.NOC && item.region) {
            map[item.NOC] = item.region;
          }
          return map;
        }, {});

        const summerAthletes = athleteData.filter(d => d.Season === 'Summer' && d.Year && d.Sport && d.NOC && d.Event);

        const processedData = {};
        const yearsSet = new Set();

        summerAthletes.forEach(d => {
          const year = d.Year;
          const sport = d.Sport;
          const country = nocMap[d.NOC] || d.NOC;
          const event = d.Event;

          yearsSet.add(year);

          if (!processedData[year]) {
            processedData[year] = {
              year: year,
              sports: new Set(),
              disciplines: {},
              countries: {}
            };
          }

          processedData[year].sports.add(sport);

          if (!processedData[year].disciplines[sport]) {
            processedData[year].disciplines[sport] = new Set();
          }
          processedData[year].disciplines[sport].add(event);

          if (!processedData[year].countries[country]) {
            processedData[year].countries[country] = {};
          }
          if (!processedData[year].countries[country][sport]) {
            processedData[year].countries[country][sport] = new Set();
          }
          processedData[year].countries[country][sport].add(event);
        });

        const finalDataArray = Object.values(processedData).map(yearData => ({
          year: yearData.year,
          sportsHeld: yearData.sports.size,
          disciplines: Object.fromEntries(
            Object.entries(yearData.disciplines).map(([sport, eventsSet]) => [sport, eventsSet.size])
          ),
          countries: Object.fromEntries(
            Object.entries(yearData.countries).map(([country, sportsEventsMap]) => [
              country,
              Object.fromEntries(
                Object.entries(sportsEventsMap).map(([sport, eventsSet]) => [sport, eventsSet.size])
              )
            ])
          )
        })).sort((a, b) => a.year - b.year);

        setOlympicData(finalDataArray);
        const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
        setAvailableYears(sortedYears);

        if (sortedYears.length > 0) {
          setStartYear(sortedYears[0]);
          setEndYear(sortedYears[sortedYears.length - 1]);
          setSelectedYear(sortedYears[sortedYears.length - 1]);
        }

      } catch (error) {
        console.error("Error fetching or processing data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDataAndProcess();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const filteredLineChartData = useMemo(() => {
    if (!olympicData || startYear === null || endYear === null) {
      return [];
    }
    const sYear = Math.min(startYear, endYear);
    const eYear = Math.max(startYear, endYear);
    return olympicData.filter(d => d.year >= sYear && d.year <= eYear);
  }, [olympicData, startYear, endYear]);

  useEffect(() => {
    if (isLoading || olympicData.length === 0 || startYear === null || endYear === null || !geoJsonData) return;

    if (activeTab === 'overview') {
      renderLineChart();
    } else if (activeTab === 'countries') {
      renderHeatMap();
    }
  }, [isLoading, olympicData, activeTab, selectedYear, startYear, endYear, filteredLineChartData, geoJsonData]);

  const renderLineChart = () => {
    if (!chartRef.current || filteredLineChartData.length === 0) return;

    const svgWidth = chartRef.current.offsetWidth;
    const svgHeight = 400;
    const margin = { top: 50, right: 30, bottom: 70, left: 80 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', svgHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const years = filteredLineChartData.map(d => d.year);
    const sportsHeld = filteredLineChartData.map(d => d.sportsHeld);

    const xScale = d3
      .scaleBand()
      .domain(years)
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(sportsHeld) || 1])
      .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d => d).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('fill', '#FFFFFF');

    svg
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#FFFFFF');

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .attr('text-anchor', 'middle')
      .style('fill', '#FFFFFF')
      .style('font-size', '14px')
      .text('Years');

    svg
      .append('text')
      .attr('x', -(height / 2))
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .style('fill', '#FFFFFF')
      .style('font-size', '14px')
      .text('Number of Unique Sports Held');

    const line = d3
      .line()
      .x(d => xScale(d.year) + xScale.bandwidth() / 2)
      .y(d => yScale(d.sportsHeld));

    svg
      .append('path')
      .datum(filteredLineChartData)
      .attr('fill', 'none')
      .attr('stroke', '#4F46E5')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg
      .selectAll('.dot')
      .data(filteredLineChartData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.sportsHeld))
      .attr('r', 4)
      .attr('fill', '#4F46E5')
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        const fullYearData = olympicData.find(item => item.year === d.year);
        setSelectedYearData(fullYearData);
      })
      .on('mouseover', function () {
        d3.select(this).attr('r', 6).attr('fill', '#FFFFFF');
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 4).attr('fill', '#4F46E5');
      });
  };

  const getCountryDetailsWithEvents = (countryName) => {
    const yearDataEntry = olympicData.find((data) => data.year === selectedYear);
    if (!yearDataEntry || !yearDataEntry.countries || !yearDataEntry.disciplines) {
      return { countryName, sportsWithEvents: [] };
    }

    const countrySportParticipation = yearDataEntry.countries[countryName] || {};
    const totalEventCounts = yearDataEntry.disciplines;

    const sportsWithEvents = Object.entries(countrySportParticipation)
      .map(([sport, participatedEvents]) => ({
        sport: sport,
        participatedEvents: participatedEvents,
        totalEvents: totalEventCounts[sport] || 0
      }))
      .sort((a, b) => a.sport.localeCompare(b.sport));

    return { countryName, sportsWithEvents };
  };

  const renderHeatMap = () => {
    if (!mapRef.current || !geoJsonData) return;

    const width = mapRef.current.offsetWidth || 800;
    const height = 500;

    d3.select(mapRef.current).selectAll("*").remove();

    const container = d3.select(mapRef.current).append("div").style("position", "relative");

    const svg = container
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("id", "heatmap-svg");
    svgRef.current = svg;

    const mapGroup = svg.append("g");

    zoomBehaviorRef.current = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

    svg.call(zoomBehaviorRef.current);

    const geoData = geoJsonData;
    const yearDataEntry = olympicData.find((data) => data.year === selectedYear);
    const countryParticipationData = yearDataEntry?.countries ?
      Object.fromEntries(Object.entries(yearDataEntry.countries).map(([country, sportsMap]) => [country, Object.keys(sportsMap).length]))
      : {};
    const maxParticipation = d3.max(Object.values(countryParticipationData)) || 1;

    const colorScale = d3
      .scaleLinear()
      .domain([0, maxParticipation])
      .range(["#e0f7fa", "#006064"]);

    const projection = d3
      .geoNaturalEarth1()
      .scale(150)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    mapGroup
      .selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => {
        const countryName = d.properties.name;
        const participationCount = countryParticipationData[countryName] || 0;
        return colorScale(participationCount);
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .attr("class", "country-path")
      .attr("data-country-name", d => d.properties.name)
      .style('cursor', 'pointer')
      .on("mouseover", function (event, d) {
        const countryName = d.properties.name;
        const participationCount = countryParticipationData[countryName] || 0;
        if (!d3.select(this).classed('searched')) {
          d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#fff");
        }
        d3.select(mapRef.current).select(".tooltip").remove();
        d3.select(mapRef.current)
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "#fff")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(
            `<strong>${countryName}</strong><br>${participationCount} Sport${participationCount !== 1 ? 's' : ''}`
          );
      })
      .on("mouseout", function () {
        if (!d3.select(this).classed('searched')) {
          d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#333");
        }
        d3.select(mapRef.current).select(".tooltip").remove();
      })
      .on("click", function (event, d) {
        const countryName = d.properties.name;
        const countryDetails = getCountryDetailsWithEvents(countryName);
        setSelectedCountryData(countryDetails);
        clearSearchHighlight();
        setSearchQuery('');
        setShowSuggestions(false);
      });

    const controls = container
      .append("div")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("display", "flex")
      .style("gap", "10px");

    controls
      .append("button")
      .text("+")
      .style("padding", "10px")
      .style("background", "#006064")
      .style("color", "#fff")
      .style("border", "none")
      .style("border-radius", "5px")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().call(zoomBehaviorRef.current.scaleBy, 1.2);
      });

    controls
      .append("button")
      .text("-")
      .style("padding", "10px")
      .style("background", "#006064")
      .style("color", "#fff")
      .style("border", "none")
      .style("border-radius", "5px")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().call(zoomBehaviorRef.current.scaleBy, 0.8);
      });
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query) {
      clearSearchHighlight();
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (geoJsonData) {
      const queryLower = query.toLowerCase();
      const filteredSuggestions = geoJsonData.features
        .map(f => f.properties.name)
        .filter(name => name.toLowerCase().startsWith(queryLower))
        .slice(0, 10);
      setSearchSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (countryName) => {
    setSearchQuery(countryName);
    setShowSuggestions(false);
    handleSearchSubmit(null, countryName);
  };

  const clearSearchHighlight = () => {
    if (!mapRef.current) return;
    d3.select(mapRef.current)
      .selectAll('.country-path.searched')
      .classed('searched', false)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);
  };

  const handleSearchSubmit = (event, directCountryName = null) => {
    if (event) event.preventDefault();

    const countryToSearch = directCountryName || searchQuery;

    if (!countryToSearch || !geoJsonData || !svgRef.current || !zoomBehaviorRef.current) return;

    clearSearchHighlight();

    const searchLower = countryToSearch.toLowerCase();
    const targetFeature = geoJsonData.features.find(
      (feature) => feature.properties.name.toLowerCase() === searchLower
    );

    if (targetFeature) {
      const targetPath = d3.select(mapRef.current)
        .select(`path[data-country-name="${targetFeature.properties.name}"]`);

      if (!targetPath.empty()) {
        targetPath.classed('searched', true)
          .attr('stroke', '#FFD700')
          .attr('stroke-width', 2)
          .raise();

        const countryDetails = getCountryDetailsWithEvents(targetFeature.properties.name);
        setSelectedCountryData(countryDetails);

        const projection = d3.geoNaturalEarth1().scale(150).translate([(mapRef.current.offsetWidth || 800) / 2, 500 / 2]);
        const pathGenerator = d3.geoPath().projection(projection);
        const bounds = pathGenerator.bounds(targetFeature);
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / (mapRef.current.offsetWidth || 800), dy / 500)));
        const translate = [(mapRef.current.offsetWidth || 800) / 2 - scale * x, 500 / 2 - scale * y];

        svgRef.current.transition().duration(750).call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      } else {
        console.warn(`Path not found for country: ${targetFeature.properties.name}`);
        setSelectedCountryData(null);
      }
    } else {
      console.warn(`Country not found in GeoJSON: ${countryToSearch}`);
      setSelectedCountryData(null);
    }
    setShowSuggestions(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <div className="text-sm font-medium py-1 px-3 bg-blue-800 rounded-full">Sports Analysis</div>
        </nav>
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Olympic Sports Analysis
          </h1>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Number of Sports Events
          </button>
          <button
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'countries' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => {
              setActiveTab('countries');
              setSelectedCountryData(null);
              clearSearchHighlight();
              setSearchQuery('');
              setShowSuggestions(false);
            }}
          >
            Countries Participation
          </button>
        </div>

        <div>
          {activeTab === 'overview' && (
            <section className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-white mb-4">Number of Unique Sports Held Over the Years</h2>
              <p className="text-gray-300 mb-4">
                Below is a visualization of the number of unique sports held in the Summer Olympics over the selected year range. Click on a data point to see the list of sports held that year, sorted by the number of events.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-6 items-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="start-year-select-overview" className="text-sm font-medium text-gray-300">From:</label>
                  <select
                    id="start-year-select-overview"
                    value={startYear ?? ''}
                    onChange={(e) => {
                      const newStartYear = parseInt(e.target.value, 10);
                      setStartYear(newStartYear);
                      // If end year is smaller than new start year, update end year to match
                      if (endYear < newStartYear) {
                        setEndYear(newStartYear);
                      }
                    }}
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                    disabled={!availableYears.length}
                  >
                    {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="end-year-select-overview" className="text-sm font-medium text-gray-300">To:</label>
                  <select
                    id="end-year-select-overview"
                    value={endYear ?? ''}
                    onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                    disabled={!availableYears.length}
                  >
                    {availableYears
                      .filter(year => year >= startYear) // Only show years >= start year
                      .map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400 -mt-3 mb-3">
                <p>Click on any data point in the chart to view details of sports held that year.</p>
              </div>

              <div ref={chartRef} className="w-full h-96"></div>
              {selectedYearData && (
                <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Sports & Events in {selectedYearData.year} ({selectedYearData.sportsHeld} total sports)
                  </h3>
                  <table className="table-auto w-full text-left text-gray-300 border-collapse rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-black">
                        <th className="px-6 py-3 text-sm font-semibold text-gray-100 uppercase tracking-wider">
                          Sport (Discipline)
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-100 uppercase tracking-wider text-right">
                          Number of Events
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedYearData.disciplines)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .map(([discipline, eventCount], index) => (
                        <tr
                          key={index}
                          className={`${
                            index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <td className="px-6 py-4">{discipline}</td>
                          <td className="px-6 py-4 text-right">{eventCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'countries' && (
            <section className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-white mb-4">Countries Participation by Number of Sports</h2>
              <p className="text-gray-300 mb-4">
                Heat map showing the number of unique sports each country participated in for the selected Summer Olympics year. Click on a country or use the search bar to see the events participated in per sport.
              </p>

              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="year-select" className="text-gray-300 mr-2">
                    Select Year:
                  </label>
                  <select
                    id="year-select"
                    value={selectedYear ?? ''}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                      setSelectedCountryData(null);
                      clearSearchHighlight();
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                    disabled={!availableYears.length}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative" ref={searchContainerRef}>
                  <div className="flex items-center gap-2">
                    <label htmlFor="country-search" className="sr-only">Search Country:</label>
                    <input
                      type="text"
                      id="country-search"
                      placeholder="Search Country..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setShowSuggestions(true)}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Search
                    </button>
                  </div>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchSuggestions.map((countryName) => (
                        <li
                          key={countryName}
                          className="px-4 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          onClick={() => handleSuggestionClick(countryName)}
                        >
                          {countryName}
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-300 text-sm">Low (0 Sports)</span>
                <div className="flex-grow h-4 bg-gradient-to-r from-[#e0f7fa] to-[#006064] rounded"></div>
                <span className="text-gray-300 text-sm">High ({d3.max(Object.values(olympicData.find(d => d.year === selectedYear)?.countries || {}).map(s => Object.keys(s).length)) || 0} Sports)</span>
              </div>

              <div ref={mapRef} className="w-full h-[500px] overflow-hidden border border-gray-700 rounded bg-gray-900"></div>

              {selectedCountryData && (
                <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Event Participation by {selectedCountryData.countryName} in {selectedYear}
                  </h3>
                  {selectedCountryData.sportsWithEvents.length > 0 ? (
                    <table className="table-auto w-full text-left text-gray-300 border-collapse rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-black">
                          <th className="px-6 py-3 text-sm font-semibold text-gray-100 uppercase tracking-wider">
                            Sport
                          </th>
                          <th className="px-6 py-3 text-sm font-semibold text-gray-100 uppercase tracking-wider text-right">
                            Events Participated / Total Events
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCountryData.sportsWithEvents
                          .sort((a, b) => a.sport.localeCompare(b.sport))
                          .map(({ sport, participatedEvents, totalEvents }, index) => (
                            <tr
                              key={sport}
                              className={`${
                                index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                              }`}
                            >
                              <td className="px-6 py-4">{sport}</td>
                              <td className="px-6 py-4 text-right">{`${participatedEvents} / ${totalEvents}`}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-400">No participation data found for {selectedCountryData.countryName} in {selectedYear}.</p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}