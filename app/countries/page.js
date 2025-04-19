'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';

export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalMedals');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const mapRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/noc_summary.json');
        const data = await response.json();
        
        const nocArray = Object.entries(data).map(([noc, details]) => ({
          noc,
          ...details
        }));

        setCountries(nocArray);
        setTimeout(() => {
          if (nocArray.length > 0) {
            createWorldMap(nocArray);
          }
        }, 500);
      } catch (error) {
        console.error('Error fetching countries data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create world map visualization
  const createWorldMap = (countriesData) => {
    if (!mapRef.current) return;

    // Clear previous content
    d3.select(mapRef.current).selectAll("*").remove();
    
    const width = mapRef.current.clientWidth;
    const height = 500;
    
    // Create SVG
    const svg = d3.select(mapRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create a group for the map
    const g = svg.append("g");
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create tooltip
    const tooltip = d3.select(mapRef.current)
      .append("div")
      .attr("class", "absolute bg-gray-900 text-white p-3 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200")
      .style("z-index", "10")
      .style("min-width", "200px");
    
    // Create a color scale for medal counts
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(countriesData, d => {
        const totalMedals = d.medals ? 
          d.medals.gold + d.medals.silver + d.medals.bronze : 0;
        return totalMedals;
      })]);
    
    // Load world map data
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(worldData => {
        // Create projection and path
        const projection = d3.geoMercator()
          .fitSize([width, height], worldData);
        
        const path = d3.geoPath()
          .projection(projection);
        
        // Create a map of country codes to medal data
        const countryMedalMap = {};
        countriesData.forEach(country => {
          if (country.region) {
            // Convert country name to ISO code for mapping
            countryMedalMap[country.region] = {
              noc: country.noc,
              medals: country.medals ? 
                country.medals.gold + country.medals.silver + country.medals.bronze : 0,
              region: country.region
            };
          }
        });
        
        // Draw map
        g.selectAll("path")
          .data(worldData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", d => {
            const countryName = d.properties.name;
            const countryData = countryMedalMap[countryName];
            return countryData ? colorScale(countryData.medals) : "#2d3748";
          })
          .attr("stroke", "#1a202c")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event, d) {
            const countryName = d.properties.name;
            const countryData = countryMedalMap[countryName];
            
            d3.select(this)
              .attr("stroke", "#60a5fa")
              .attr("stroke-width", 2);
            
            if (countryData) {
              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`)
                .html(`
                  <div class="font-bold text-lg">${countryName} (${countryData.noc})</div>
                  <div class="mt-1">Total Medals: ${countryData.medals}</div>
                `);
            } else {
              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`)
                .html(`
                  <div class="font-bold text-lg">${countryName}</div>
                  <div class="mt-1">No Olympic data available</div>
                `);
            }
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke", "#1a202c")
              .attr("stroke-width", 0.5);
            
            tooltip.style("opacity", 0);
          })
          .on("click", function(event, d) {
            const countryName = d.properties.name;
            const countryData = countryMedalMap[countryName];
            
            if (countryData && countryData.noc) {
              window.location.href = `/countries/${countryData.noc.toLowerCase()}`;
            }
          });
        
        // Add legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = width - legendWidth - 20;
        const legendY = height - 50;
        
        const legendScale = d3.scaleLinear()
          .domain([0, d3.max(countriesData, d => {
            const totalMedals = d.medals ? 
              d.medals.gold + d.medals.silver + d.medals.bronze : 0;
            return totalMedals;
          })])
          .range([0, legendWidth]);
        
        const legendAxis = d3.axisBottom(legendScale)
          .ticks(5);
        
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "medal-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");
        
        linearGradient.selectAll("stop")
          .data([
            {offset: "0%", color: "#f7fafc"},
            {offset: "100%", color: "#3182ce"}
          ])
          .enter().append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);
        
        svg.append("g")
          .attr("transform", `translate(${legendX}, ${legendY})`)
          .append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#medal-gradient)");
        
        svg.append("g")
          .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
          .call(legendAxis)
          .selectAll("text")
          .style("font-size", "10px")
          .style("fill", "#e2e8f0");
        
        svg.append("text")
          .attr("x", legendX)
          .attr("y", legendY - 10)
          .style("font-size", "12px")
          .style("fill", "#e2e8f0")
          .text("Medal Count");
      })
      .catch(error => console.error("Error loading world map data:", error));
  };

  // Filter logic
  const filteredCountries = countries.filter(country => {
    if (searchQuery && !(country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country?.noc?.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    if (activeFilter === 'noMedals') {
      return country.medals.gold + country.medals.silver + country.medals.bronze === 0;
    }
    
    if (activeFilter === 'withMedals') {
      return country.medals.gold + country.medals.silver + country.medals.bronze > 0;
    }
    
    return true;
  });

  // Sort logic
  const sortedCountries = [...filteredCountries].sort((a, b) => {
    let aValue, bValue;
    
    switch(sortBy) {
      case 'totalMedals':
        aValue = (a.medals.gold + a.medals.silver + a.medals.bronze);
        bValue = (b.medals.gold + b.medals.silver + b.medals.bronze);
        break;
      case 'gold':
        aValue = a.medals.gold;
        bValue = b.medals.gold;
        break;
      case 'name':
        aValue = a.region || '';
        bValue = b.region || '';
        return sortDirection === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      case 'athletes':
        aValue = a.totalAthletes;
        bValue = b.totalAthletes;
        break;
      default:
        aValue = (a.medals.gold + a.medals.silver + a.medals.bronze);
        bValue = (b.medals.gold + b.medals.silver + b.medals.bronze);
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <div className="text-sm font-medium py-1 px-3 bg-blue-800 rounded-full">Country Analysis</div>
        </nav>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Olympic Countries
          </h1>
          <p className="text-xl text-blue-300 max-w-2xl mx-auto">
            Explore medal counts and performance metrics for countries in the Olympic Games
          </p>
        </div>

        {/* Interactive Map */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Interactive World Map</h2>
          <div className="relative" style={{ height: "500px" }}>
            {isLoading ? (
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full relative"></div>
            )}
            <p className="absolute bottom-2 left-4 text-sm text-gray-400">Click on a country to view detailed Olympic performance</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 md:justify-between items-center bg-gray-800 p-4 rounded-lg">
          {/* Search */}
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a country..."
              className="w-full md:w-64 p-2 pl-10 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
            {/* Filter */}
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-sm ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('withMedals')}
                className={`px-3 py-1 text-sm ${activeFilter === 'withMedals' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                With Medals
              </button>
              <button 
                onClick={() => setActiveFilter('noMedals')}
                className={`px-3 py-1 text-sm ${activeFilter === 'noMedals' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                No Medals
              </button>
            </div>

            {/* Sort */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg p-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="totalMedals">Sort by Total Medals</option>
              <option value="gold">Sort by Gold Medals</option>
              <option value="name">Sort by Country Name</option>
              <option value="athletes">Sort by Athlete Count</option>
            </select>

            <button 
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-1 flex items-center gap-1 transition-colors text-sm"
            >
              {sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}
            </button>
          </div>
        </div>

        {/* Countries Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCountries.length > 0 ? (
              sortedCountries.map((country) => (
                <Link key={country.noc} href={`/countries/${country.noc.toLowerCase()}`}>
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all hover:shadow-blue-900/20 hover:shadow-lg cursor-pointer">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-blue-300">{country.region}</h2>
                          <p className="text-gray-400 text-sm">{country.noc}</p>
                        </div>
                        <div className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          {country.medals.gold + country.medals.silver + country.medals.bronze} Medals
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-300 mb-3">Medal Count</h3>
                        <div className="flex space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.gold}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Gold</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.silver}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Silver</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-gray-800 font-bold">
                              {country.medals.bronze}
                            </div>
                            <span className="text-xs mt-1 text-gray-400">Bronze</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-700">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Top Sport</p>
                            <p className="font-medium text-gray-300">{country.topSport}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Athletes</p>
                            <p className="font-medium text-gray-300">{country.totalAthletes}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center text-blue-400 hover:text-blue-300">
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-400">No countries found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pt-6">
          <p>Olympic Data Analysis Project - {new Date().getFullYear()}</p>
          <p className="mt-2">Built with D3.js and React</p>
        </footer>
      </div>
    </main>
  );
}