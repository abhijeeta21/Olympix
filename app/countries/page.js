'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';

export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

        // Fix for Canada - ensure we use "CAN" instead of "NFL" for Canadian data
        const canadaData = nocArray.find(country => country.noc === "CAN");
        if (canadaData && nocArray.find(country => country.noc === "NFL" && country.region === "Canada")) {
          console.log("Fixing Canada data - using CAN instead of NFL");
          // Remove any data incorrectly labeled as NFL for Canada
          const filteredArray = nocArray.filter(country => !(country.noc === "NFL" && country.region === "Canada"));
          setCountries(filteredArray);
        } else {
          setCountries(nocArray);
        }
        
        setIsLoading(false);
        
        // Create map after data is loaded
        if (nocArray.length > 0) {
          setTimeout(() => createWorldMap(nocArray), 500);
        }
      } catch (error) {
        console.error('Error fetching countries data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create world map visualization using the local worldmap.json file
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
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "absolute bg-gray-900 text-white p-3 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200")
      .style("z-index", "10")
      .style("position", "absolute")
      .style("min-width", "200px");
    
    // Create a more distinguishing color scale (using a better color scheme for differentiation)
    // Using the viridis color scheme which provides better visual distinction
    const maxMedals = d3.max(countriesData, d => {
      const totalMedals = d.medals ? 
        d.medals.gold + d.medals.silver + d.medals.bronze : 0;
      return totalMedals;
    });
    
    // Using a logarithmic scale to better differentiate between countries with fewer medals
    const colorScale = d3.scaleSequentialLog(d3.interpolateViridis)
      .domain([1, maxMedals]) // Using 1 as the min to handle log scale (can't have log(0))
      .clamp(true); // Prevents errors with zeros
    
    // Function to determine color based on medal count
    const getColor = (medals) => {
      if (!medals || medals === 0) return "#2d3748"; // Default color for countries with no medals
      return colorScale(medals);
    };
    
    // Create a map of country ISO codes to medal data
    const countryMedalMap = {};
    countriesData.forEach(country => {
      if (country.region) {
        // Make sure we prioritize "CAN" for Canada and not "NFL"
        if (country.region === "Canada" && country.noc !== "CAN") {
          return; // Skip non-CAN entries for Canada
        }
        
        // Map the country data by both region name and country code
        // This improves matching chances
        countryMedalMap[country.region] = {
          noc: country.noc,
          region: country.region,
          medals: country.medals ? 
            country.medals.gold + country.medals.silver + country.medals.bronze : 0,
          details: country
        };
        
        // Also add by NOC code for alternative matching
        countryMedalMap[country.noc] = {
          noc: country.noc,
          region: country.region,
          medals: country.medals ? 
            country.medals.gold + country.medals.silver + country.medals.bronze : 0,
          details: country
        };
      }
    });
    
    // Load the local world map data
    d3.json("/worldmap.json")
      .then(worldData => {

        // Filter out Antarctica from the map
        worldData.features = worldData.features.filter(feature => 
        feature.properties.name !== "Antarctica" && 
        feature.properties.name_en !== "Antarctica" &&
        feature.properties.iso_a3 !== "ATA");

        // Create projection and path
        const projection = d3.geoMercator()
          .fitSize([width, height], worldData);
        
        const path = d3.geoPath()
          .projection(projection);
        
        // Helper function to find country data using various properties
        const findCountryData = (feature) => {
          // Special case for Canada - ensure we use CAN and not NFL
          if (feature.properties.name === "Canada" || 
              feature.properties.name_en === "Canada" || 
              feature.properties.iso_a3 === "CAN") {
            return countryMedalMap["CAN"] || countryMedalMap["Canada"];
          }
          if (feature.properties.name === "Germany" ||
            feature.properties.name_en === "Germany" ||
            feature.properties.iso_a3 === "GER"
          ){
            return countryMedalMap["GER"] || countryMedalMap["Germany"]
          }
          // Try different properties to match with our medal data
          const options = [
            feature.properties.name,
            feature.properties.name_en,
            feature.properties.sov_a3,
            feature.properties.adm0_a3,
            feature.properties.iso_a3,
            feature.properties.formal_en
          ];
          
          for (const option of options) {
            if (option && countryMedalMap[option]) {
              return countryMedalMap[option];
            }
          }
          
          // Also try to match with any NOC that might be related
          // This is a fallback approach for countries with name mismatches
          if (feature.properties.iso_a3) {
            const iso = feature.properties.iso_a3;
            // Find any NOC that might contain this ISO code
            const matchingCountry = countriesData.find(c => 
              c.noc.includes(iso) || 
              iso.includes(c.noc) || 
              (c.region && c.region.includes(feature.properties.name))
            );
            
            if (matchingCountry) {
              return {
                noc: matchingCountry.noc,
                region: matchingCountry.region,
                medals: matchingCountry.medals ? 
                  matchingCountry.medals.gold + matchingCountry.medals.silver + matchingCountry.medals.bronze : 0,
                details: matchingCountry
              };
            }
          }
          
          return null;
        };
        
        // Draw map
        g.selectAll("path")
          .data(worldData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", d => {
            const countryData = findCountryData(d);
            return countryData ? getColor(countryData.medals) : "#2d3748";
          })
          .attr("stroke", "#1a202c")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event, d) {
            const countryData = findCountryData(d);
            
            d3.select(this)
              .attr("stroke", "#60a5fa")
              .attr("stroke-width", 2);
            
            const countryName = d.properties.name || d.properties.name_en;
            
            if (countryData) {
              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`)
                .html(`
                  <div class="font-bold text-lg">${countryData.region} (${countryData.noc})</div>
                  <div class="mt-1">Total Medals: ${countryData.medals}</div>
                  <div class="mt-1">Gold: ${countryData.details.medals.gold} | Silver: ${countryData.details.medals.silver} | Bronze: ${countryData.details.medals.bronze}</div>
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
            const countryData = findCountryData(d);
            
            if (countryData && countryData.noc) {
              window.location.href = `/countries/${countryData.noc.toLowerCase()}`;
            }
          })
          .style("cursor", d => findCountryData(d) ? "pointer" : "default");
        
        // Add legend with improved color scale (logarithmic)
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = width - legendWidth - 20;
        const legendY = height - 50;
        
        // For legend, create a linear scale but with custom tick values that reflect log distribution
        const logTickValues = [1, 10, 50, 100, 500, maxMedals];
        const legendScale = d3.scaleLinear()
          .domain([0, 100])
          .range([0, legendWidth]);
        
        const legendAxis = d3.axisBottom()
          .scale(legendScale)
          .tickValues([0, 20, 40, 60, 80, 100])
          .tickFormat((d, i) => {
            // Map the linear scale position to our log-distributed values
            return logTickValues[i] || "";
          });
        
        // Create gradient for legend
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "medal-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");
        
        // Add stops for viridis color scheme (reversed to have dark purple for high values)
        // We sample the viridis color scheme at different points
        linearGradient.selectAll("stop")
          .data([
            {offset: "0%", color: d3.interpolateViridis(0)},  // Highest (purple)
            {offset: "25%", color: d3.interpolateViridis(0.75)},
            {offset: "50%", color: d3.interpolateViridis(0.5)},
            {offset: "75%", color: d3.interpolateViridis(0.25)},
            {offset: "100%", color: d3.interpolateViridis(1)} // Lowest (dark yellow)
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
          .text("Medal Count (Log Scale)");
      })
      .catch(error => {
        console.error("Error loading world map data:", error);
        // Show error message in the UI
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("fill", "#e2e8f0")
          .style("font-size", "16px")
          .text("Error loading map data. Please check console for details.");
      });
  };

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

        {/* Simplified Search Bar (without filters and sorting) */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a country..."
              className="w-full p-2 pl-10 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Countries Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {countries.filter(country => 
              !searchQuery || (country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                country?.noc?.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length > 0 ? (
              countries
                .filter(country => 
                  !searchQuery || (country?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    country?.noc?.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .sort((a, b) => {
                  // Default sort by total medals (descending)
                  const aTotal = a.medals.gold + a.medals.silver + a.medals.bronze;
                  const bTotal = b.medals.gold + b.medals.silver + b.medals.bronze;
                  return bTotal - aTotal;
                })
                .map((country) => (
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