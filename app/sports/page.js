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
  const [selectedSports, setSelectedSports] = useState([]);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [selectedSport, setSelectedSport] = useState(null);

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

    // Append the path for the line chart
    const path = svg
      .append('path')
      .datum(filteredLineChartData)
      .attr('fill', 'none')
      .attr('stroke', '#4F46E5')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add animation to the line being drawn
    const totalLength = path.node().getTotalLength();

    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000) // Animation duration in milliseconds
      .ease(d3.easeLinear) // Linear easing for smooth animation
      .attr('stroke-dashoffset', 0);

    svg
      .selectAll('.dot')
      .data(filteredLineChartData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.sportsHeld))
      .attr('r', 6) // Slightly larger radius for better visibility
      .attr('fill', '#4F46E5')
      .style('cursor', 'pointer') // Make the cursor a pointer
      .on('click', function (event, d) {
        const fullYearData = olympicData.find(item => item.year === d.year);
        setSelectedYearData(fullYearData);

        // Scroll to the details section
        const detailsSection = document.querySelector('.details-section');
        if (detailsSection) {
          detailsSection.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .on('mouseover', function () {
        d3.select(this)
          .attr('r', 8) // Increase the radius on hover
          .attr('fill', '#FFFFFF'); // Change the color on hover
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('r', 6) // Reset the radius
          .attr('fill', '#4F46E5'); // Reset the color
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
        
        // Add scroll behavior - wait briefly for the state update to render the details
        setTimeout(() => {
          const detailsSection = document.querySelector('.mt-6.bg-gray-700.p-4.rounded-lg');
          if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
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

  useEffect(() => {
    if (selectedCountryData && selectedCountryData.sportsWithEvents) {
      // Set all sports as selected by default
      setSelectedSports(selectedCountryData.sportsWithEvents.map((sportData) => sportData.sport));
    }
  }, [selectedCountryData]);

  // Add this useEffect to reset the focused suggestion index when suggestions change
  useEffect(() => {
    setFocusedSuggestionIndex(-1);
  }, [searchSuggestions]);

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
                Below is a visualization of the number of unique sports held in the Summer Olympics over the selected year range.
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
                      // Reset selected year data to close the horizontal bar chart
                      setSelectedYearData(null);
                    }}
                    className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                    disabled={!availableYears.length}
                  >
                    {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    id="end-year-select-overview"
                    value={endYear ?? ''}
                    onChange={(e) => {
                      setEndYear(parseInt(e.target.value, 10));
                      // Reset selected year data to close the horizontal bar chart
                      setSelectedYearData(null);
                    }}
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
                // Replace the table with this visualization
                <div className="mt-6 bg-gray-700 p-4 rounded-lg details-section">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Sports & Events in {selectedYearData.year} ({selectedYearData.sportsHeld} total sports)
                  </h3>
                  
                  <div className="w-full " ref={(ref) => {
                    if (ref) {
                      // Clear any existing content
                      d3.select(ref).selectAll('*').remove();
                      
                      // Get data sorted by count
                      const data = Object.entries(selectedYearData.disciplines)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .map(([sport, count]) => ({ sport, count }));
                      
                      const margin = { top: 20, right: 30, bottom: 40, left: 180 };
                      const width = ref.offsetWidth - margin.left - margin.right;
                      const height = 20 * data.length + margin.top + margin.bottom;
                      
                      const svg = d3.select(ref)
                        .append('svg')
                        .attr('width', ref.offsetWidth)
                        .attr('height', height)
                        .append('g')
                        .attr('transform', `translate(${margin.left},${margin.top})`);
                      
                      // Scales
                      const xScale = d3.scaleLinear()
                        .domain([0, d3.max(data, d => d.count)])
                        .range([0, width]);
                      
                      const yScale = d3.scaleBand()
                        .domain(data.map(d => d.sport))
                        .range([0, height - margin.top - margin.bottom])
                        .padding(0.3);
                      
                      // Bars with animation
                      svg.selectAll('.bar')
                        .data(data)
                        .enter()
                        .append('rect')
                        .attr('class', 'bar')
                        .attr('x', 0)
                        .attr('y', d => yScale(d.sport))
                        .attr('width', 0) // Start with zero width
                        .attr('height', yScale.bandwidth())
                        .attr('fill', '#4F46E5')
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .on('mouseover', function() {
                          d3.select(this).attr('fill', '#6366F1');
                        })
                        .on('mouseout', function() {
                          d3.select(this).attr('fill', '#4F46E5');
                        })
                        // Add the animation
                        .transition()
                        .duration(800) // Animation duration in milliseconds
                        .delay((d, i) => i * 50) // Stagger the animations
                        .attr('width', d => xScale(d.count)); // Animate to final width
                      
                      // Adjust value labels to appear after animation
                      svg.selectAll('.label')
                        .data(data)
                        .enter()
                        .append('text')
                        .attr('class', 'label')
                        .attr('x', 0) // Start at zero
                        .attr('y', d => yScale(d.sport) + yScale.bandwidth() / 2 + 5)
                        .attr('fill', 'white')
                        .attr('opacity', 0) // Start invisible
                        .text(d => d.count)
                        // Add animation
                        .transition()
                        .duration(800)
                        .delay((d, i) => i * 50 + 400) // Appear after bar animation starts
                        .attr('x', d => xScale(d.count) + 5) // Move to final position
                        .attr('opacity', 1); // Fade in
                      
                      // Sport labels
                      svg.selectAll('.sport-label')
                        .data(data)
                        .enter()
                        .append('text')
                        .attr('class', 'sport-label')
                        .attr('x', -5)
                        .attr('y', d => yScale(d.sport) + yScale.bandwidth() / 2 + 5)
                        .attr('fill', 'white')
                        .attr('text-anchor', 'end')
                        .text(d => d.sport);
                      
                      // X axis
                      svg.append('g')
                        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
                        .call(d3.axisBottom(xScale))
                        .selectAll('text')
                        .style('fill', 'white');

                      // Add X axis label
                      svg.append('text')
                        .attr('x', width / 2)
                        .attr('y', height - margin.top) // Position it below the axis
                        .attr('text-anchor', 'middle')
                        .style('fill', 'white')
                        .style('font-size', '14px')
                        .text('Number of Events');
                    }
                  }}></div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'countries' && (
            <section className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-white mb-4">Countries Participation by Number of Sports</h2>
              <p className="text-gray-300 mb-4">
                Heat map showing the number of sports each country participated in for the selected Summer Olympics year.
              </p>
              <p className="text-center text-sm text-gray-400 mb-4">
                Click on a country or use the search bar to see the events participated in per sport.
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
                    <>
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-white mb-2">Select Sports to Display:</h4>
                          <div className="flex gap-2">
                            <button
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                              onClick={() =>
                                setSelectedSports(
                                  selectedCountryData.sportsWithEvents.map((sportData) => sportData.sport)
                                )
                              }
                            >
                              Select All
                            </button>
                            <button
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                              onClick={() => setSelectedSports([])}
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-600 flex gap-4 items-start">
                          {/* Search Sport Feature */}
                          <div className="w-1/3">
                            <div className="flex flex-wrap gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                              {selectedSports.map((sport, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                                >
                                  {sport}
                                  <button
                                    className="text-white hover:text-gray-300"
                                    onClick={() =>
                                      setSelectedSports((prev) => prev.filter((s) => s !== sport))
                                    }
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add a sport..."
                                value={searchQuery}
                                onChange={(e) => {
                                  const query = e.target.value;
                                  setSearchQuery(query);

                                  // Filter suggestions based on the query
                                  if (query.trim() !== "") {
                                    const filteredSuggestions = selectedCountryData.sportsWithEvents
                                      .map((sportData) => sportData.sport)
                                      .filter((sport) =>
                                        sport.toLowerCase().includes(query.toLowerCase())
                                      )
                                      .slice(0, 5); // Limit suggestions to 5
                                    setSearchSuggestions(filteredSuggestions);
                                  } else {
                                    setSearchSuggestions([]);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (searchSuggestions.length > 0) {
                                    if (e.key === "ArrowDown") {
                                      // Move selection down
                                      e.preventDefault();
                                      setFocusedSuggestionIndex(prev => 
                                        prev < searchSuggestions.length - 1 ? prev + 1 : 0
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      // Move selection up
                                      e.preventDefault();
                                      setFocusedSuggestionIndex(prev => 
                                        prev > 0 ? prev - 1 : searchSuggestions.length - 1
                                      );
                                    } else if (e.key === "Enter") {
                                      e.preventDefault();
                                      // Use focused suggestion if available, otherwise use first suggestion
                                      const suggestionIndex = focusedSuggestionIndex >= 0 ? focusedSuggestionIndex : 0;
                                      const selectedSuggestion = searchSuggestions[suggestionIndex];
                                      
                                      if (selectedSuggestion && !selectedSports.includes(selectedSuggestion)) {
                                        setSelectedSports(prev => [...prev, selectedSuggestion]);
                                      }
                                      setSearchQuery("");
                                      setSearchSuggestions([]);
                                      setFocusedSuggestionIndex(-1);
                                    } else if (e.key === "Escape") {
                                      // Clear suggestions on Escape
                                      setSearchSuggestions([]);
                                      setFocusedSuggestionIndex(-1);
                                    }
                                  }
                                }}
                                className="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            {searchSuggestions.length > 0 && (
                              <ul className="bg-gray-800 border border-gray-600 rounded-lg mt-2 max-h-40 overflow-y-auto">
                                {searchSuggestions.map((suggestion, index) => (
                                  <li
                                    key={index}
                                    className={`px-3 py-2 text-white cursor-pointer ${
                                      index === focusedSuggestionIndex 
                                        ? "bg-gray-600" 
                                        : "hover:bg-gray-600"
                                    }`}
                                    onClick={() => {
                                      if (!selectedSports.includes(suggestion)) {
                                        setSelectedSports((prev) => [...prev, suggestion]);
                                      }
                                      setSearchQuery("");
                                      setSearchSuggestions([]);
                                      setFocusedSuggestionIndex(-1);
                                    }}
                                  >
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Checkbox List */}
                          <div className="w-2/3 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {selectedCountryData.sportsWithEvents.map((sportData) => (
                                <label
                                  key={sportData.sport}
                                  className="flex items-center gap-2 text-gray-300 bg-gray-700 px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-600 cursor-pointer transition"
                                >
                                  <input
                                    type="checkbox"
                                    value={sportData.sport}
                                    checked={selectedSports.includes(sportData.sport)}
                                    onChange={(e) => {
                                      const sport = e.target.value;
                                      setSelectedSports((prev) =>
                                        e.target.checked
                                          ? [...prev, sport]
                                          : prev.filter((s) => s !== sport)
                                      );
                                    }}
                                    className="form-checkbox text-blue-500"
                                  />
                                  {sportData.sport}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-400 mb-3">
                        <p>Click on any bar in the chart to view information for that sport.</p>
                      </div>

                      <div ref={(ref) => {
                        if (ref) {
                          // Clear any existing SVG
                          d3.select(ref).selectAll("*").remove();

                          if (selectedSports.length === 0) {
                            // Display message when no sports are selected
                            d3.select(ref)
                              .append("text")
                              .attr("x", "50%")
                              .attr("y", "50%")
                              .attr("text-anchor", "middle")
                              .attr("dominant-baseline", "middle")
                              .style("fill", "#FFFFFF")
                              .style("font-size", "16px")
                              .text("Select sports to display results");
                            return;
                          }

                          const width = ref.offsetWidth;
                          const height = 400;
                          const margin = { top: 20, right: 30, bottom: 100, left: 50 };

                          const svg = d3.select(ref)
                            .append("svg")
                            .attr("width", width)
                            .attr("height", height);

                          const chartWidth = width - margin.left - margin.right;
                          const chartHeight = height - margin.top - margin.bottom;

                          const g = svg.append("g")
                            .attr("transform", `translate(${margin.left},${margin.top})`);

                          // Filter data based on selected sports and sort by participation (descending)
                          const filteredData = selectedCountryData.sportsWithEvents
                            .filter((d) => selectedSports.includes(d.sport))
                            .sort((a, b) => b.participatedEvents - a.participatedEvents); // Sort in descending order

                          // Prepare data for stacking
                          const stackData = filteredData.map((d) => ({
                            sport: d.sport,
                            participated: d.participatedEvents,
                            remaining: d.totalEvents - d.participatedEvents
                          }));

                          const xScale = d3.scaleBand()
                            .domain(stackData.map((d) => d.sport))
                            .range([0, chartWidth])
                            .padding(0.2);

                          const yScale = d3.scaleLinear()
                            .domain([0, d3.max(stackData, (d) => d.participated + d.remaining)])
                            .range([chartHeight, 0]);

                          // Define the stack generator
                          const stack = d3.stack()
                            .keys(["participated", "remaining"]);

                          // Generate the stacked data
                          const stackedData = stack(stackData);

                          // Define colors for the stacks
                          const colors = ["#4F46E5", "#9CA3AF"];

                          // X-axis
                          g.append("g")
                            .attr("transform", `translate(0,${chartHeight})`)
                            .call(d3.axisBottom(xScale))
                            .selectAll("text")
                            .attr("transform", "rotate(-65)")  // Increase rotation angle
                            .style("text-anchor", "end")
                            .attr("dy", "0.5em")               // Adjust vertical offset
                            .attr("dx", "-0.8em")
                            .style("fill", "#FFFFFF")
                            .style("font-size", "10px");       // Reduce font size for better fit

                          // Y-axis
                          g.append("g")
                            .call(d3.axisLeft(yScale))
                            .selectAll("text")
                            .style("fill", "#FFFFFF");

                          // Adjust the position of the "Sports" label
                          g.append("text")
                            .attr("text-anchor", "middle")
                            .attr("x", chartWidth / 2)
                            .attr("y", chartHeight + margin.bottom - 15)  // Move label up a bit
                            .style("fill", "#FFFFFF")
                            .text("Sports");

                          g.append("text")
                            .attr("text-anchor", "middle")
                            .attr("transform", "rotate(-90)")
                            .attr("y", -margin.left + 20)
                            .attr("x", -chartHeight / 2)
                            .style("fill", "#FFFFFF")
                            .text("Number of Events");

                          // Create stacked bars
                          const layer = g.selectAll(".layer")
                            .data(stackedData)
                            .enter()
                            .append("g")
                            .attr("class", "layer")
                            .attr("fill", (d, i) => colors[i]);

                          // Update the bar creation code with click event handlers
                          layer.selectAll("rect")
                            .data(d => d)
                            .enter()
                            .append("rect")
                            .attr("x", d => xScale(d.data.sport))
                            .attr("y", d => yScale(d[1]))
                            .attr("height", d => yScale(d[0]) - yScale(d[1]))
                            .attr("width", xScale.bandwidth())
                            .style("cursor", "pointer") // Add pointer cursor to indicate clickable element
                            .on("click", function(event, d) {
                              // Get the sport name from the data
                              const sportName = d.data.sport;
                              
                              // Find the detailed sport data
                              const sportData = selectedCountryData.sportsWithEvents.find(
                                sport => sport.sport === sportName
                              );
                              
                              // Update the selected sport state instead of showing modal
                              setSelectedSport(sportData);
                              
                              // Scroll to the table after a short delay
                              setTimeout(() => {
                                const tableElement = document.getElementById('sport-events-table');
                                if (tableElement) {
                                  tableElement.scrollIntoView({ behavior: 'smooth' });
                                }
                              }, 100);
                            });

                          // Add legend - shift more to the right
                          const legend = g.append("g")
                            .attr("transform", `translate(${chartWidth - 130}, 10)`);

                          ["Participated Events", "Remaining Events"].forEach((text, i) => {
                            const legendRow = legend.append("g")
                              .attr("transform", `translate(0, ${i * 20})`);
                              
                            legendRow.append("rect")
                              .attr("width", 15)
                              .attr("height", 15)
                              .attr("fill", colors[i]);
                              
                            legendRow.append("text")
                              .attr("x", 20)
                              .attr("y", 12.5)
                              .attr("fill", "#FFFFFF")
                              .style("font-size", "12px")
                              .text(text);
                          });

                          // Add labels showing participated/total for each sport
                          g.selectAll(".stack-label")
                            .data(stackData)
                            .enter()
                            .append("text")
                            .attr("class", "stack-label")
                            .attr("x", d => xScale(d.sport) + xScale.bandwidth() / 2)
                            .attr("y", d => yScale(d.participated + d.remaining) - 5)
                            .attr("text-anchor", "middle")
                            .style("fill", "#FFFFFF")
                            .style("font-size", "10px")
                            .text(d => `${d.participated}/${d.participated + d.remaining}`);
                        }
                      }} className="w-full h-[400px]"></div>

                      {/* Add events table here, directly below the bar graph */}
                      {selectedSport && (
                        <div id="sport-events-table" className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">
                              {selectedSport.sport} Events
                            </h3>
                            <button
                              onClick={() => setSelectedSport(null)}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                            >
                              Close
                            </button>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-gray-300">
                              {selectedSport.sport} had {selectedSport.totalEvents} total events in the {selectedYear} Olympics.
                            </p>
                            <p className="text-gray-300">
                              {selectedCountryData.countryName} participated in {selectedSport.participatedEvents} of these events.
                            </p>
                          </div>
                          
                          <table className="w-full text-left text-gray-300 border-collapse rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gray-900">
                                <th className="px-4 py-2 border-b border-gray-700">Metric</th>
                                <th className="px-4 py-2 border-b border-gray-700">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="px-4 py-2 border-b border-gray-700">Total Events</td>
                                <td className="px-4 py-2 border-b border-gray-700">{selectedSport.totalEvents}</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 border-b border-gray-700">Events Participated</td>
                                <td className="px-4 py-2 border-b border-gray-700">{selectedSport.participatedEvents}</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 border-b border-gray-700">Participation Rate</td>
                                <td className="px-4 py-2 border-b border-gray-700">
                                  {Math.round((selectedSport.participatedEvents / selectedSport.totalEvents) * 100)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
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