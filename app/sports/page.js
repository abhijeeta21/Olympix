// app/sports/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';

export default function Sports() {
  const [sportsData, setSportsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('medals');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    // Load the sports data from the JSON file
    fetch('/sports_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.sports) {
          setSportsData(data.sports);
          setTimeout(() => {
            createVisualization(data.sports);
          }, 100);
        } else {
          console.error('Invalid data format:', data);
          setSportsData([]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading sports data:', error);
        setIsLoading(false);
      });
  }, []);

  // Create a D3 visualization for sports data
  const createVisualization = (data) => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 40, right: 20, bottom: 50, left: 70 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by total medals
    const sortedData = [...data]
      .sort((a, b) => b.total_medals - a.total_medals)
      .slice(0, 20); // Show top 20 sports

    // Create scales
    const xScale = d3.scaleBand()
      .domain(sortedData.map(d => d.name))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.total_medals)])
      .range([height, 0]);

    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(sortedData.map(d => d.name))
      .range(d3.schemeCategory10);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        // Shorten sport names if they're too long
        return d.length > 10 ? d.substring(0, 10) + '...' : d;
      });

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g")
      .call(yAxis);

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "currentColor")
      .text("Total Medals");

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Create and animate bars
    svg.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.name))
      .attr("width", xScale.bandwidth())
      .attr("y", height) // Start from bottom for animation
      .attr("height", 0) // Start with 0 height for animation
      .attr("fill", d => colorScale(d.name))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8)
          .attr("stroke", "#333")
          .attr("stroke-width", 2);

        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .html(`
            <div class="font-bold">${d.name}</div>
            <div>Total Medals: ${d.total_medals}</div>
            <div>Athletes: ${d.total_athletes}</div>
            <div>Countries: ${d.participating_countries}</div>
          `);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke", "none");

        tooltip
          .style("opacity", 0);
      })
      .on("click", function(event, d) {
        window.location.href = `/sports/${encodeURIComponent(d.name)}`;
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("y", d => yScale(d.total_medals))
      .attr("height", d => height - yScale(d.total_medals));
  };

  // Update chart based on selected metric and sort direction
  useEffect(() => {
    if (sportsData.length > 0) {
      let metric = selectedMetric;
      let sortedData = [...sportsData];
      
      // Sort data based on selected metric and direction
      switch (metric) {
        case 'medals':
          sortedData.sort((a, b) => sortDirection === 'desc' ? 
            b.total_medals - a.total_medals : 
            a.total_medals - b.total_medals);
          break;
        case 'athletes':
          sortedData.sort((a, b) => sortDirection === 'desc' ? 
            b.total_athletes - a.total_athletes : 
            a.total_athletes - b.total_athletes);
          break;
        case 'countries':
          sortedData.sort((a, b) => sortDirection === 'desc' ? 
            b.participating_countries - a.participating_countries : 
            a.participating_countries - b.participating_countries);
          break;
      }

      // Update visualization with new sorted data
      createVisualization(sortedData);
    }
  }, [sportsData, selectedMetric, sortDirection]);

  // Filter sports based on search query
  const filteredSports = searchQuery.trim() === '' 
    ? sportsData 
    : sportsData.filter(sport => 
        sport.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

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
          <div className="text-sm font-medium py-1 px-3 bg-blue-800 rounded-full">Sports Analysis</div>
        </nav>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Olympic Sports Analysis
          </h1>
          <p className="text-xl text-blue-300 max-w-2xl mx-auto">
            Explore interactive visualizations of Olympic sports data
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-800 p-4 rounded-lg">
          {/* Search Box */}
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a sport..."
              className="w-full md:w-64 p-2 pl-10 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Visualization Controls */}
          <div className="flex gap-4">
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="medals">Total Medals</option>
              <option value="athletes">Total Athletes</option>
              <option value="countries">Participating Countries</option>
            </select>

            <button 
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-2 flex items-center gap-1 transition-colors"
              title={sortDirection === 'desc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {sortDirection === 'desc' ? (
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                ) : (
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                )}
              </svg>
              {sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}
            </button>
          </div>
        </div>

        {/* D3 Visualization Container */}
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
              <div className="min-w-full" style={{ minHeight: "500px" }} ref={svgRef}></div>
              
              {/* Tooltip for visualization */}
              <div
                ref={tooltipRef}
                className="absolute bg-gray-900 text-white p-3 rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-200"
                style={{
                  minWidth: "150px",
                  zIndex: 10
                }}
              ></div>
            </div>
            <p className="text-center text-gray-400 mt-2 italic">Click on any bar to see detailed information about that sport</p>
          </div>
        )}
        
        {/* Sports Cards Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Sports Details</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-xl text-blue-400">Loading sports data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSports.length > 0 ? (
                filteredSports.map((sport) => (
                  <div 
                    key={sport.name} 
                    className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700 hover:border-blue-500 transition-all"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-blue-400 mb-2">{sport.name}</h2>
                          <p className="text-gray-400 text-sm">
                            {sport.first_appearance} - {sport.latest_appearance}
                          </p>
                        </div>
                        <div className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          {sport.total_medals} Medals
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center bg-gray-900 p-2 rounded">
                            <p className="text-sm text-gray-400">Countries</p>
                            <p className="text-xl font-bold text-blue-300">
                              {sport.participating_countries}
                            </p>
                          </div>
                          <div className="text-center bg-gray-900 p-2 rounded">
                            <p className="text-sm text-gray-400">Events</p>
                            <p className="text-xl font-bold text-blue-300">
                              {sport.total_events}
                            </p>
                          </div>
                          <div className="text-center bg-gray-900 p-2 rounded">
                            <p className="text-sm text-gray-400">Athletes</p>
                            <p className="text-xl font-bold text-blue-300">
                              {sport.total_athletes}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Top Countries</h3>
                          <div className="space-y-2">
                            {sport.top_countries && sport.top_countries.length > 0 ? (
                              sport.top_countries.map((country, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                                  <p className="text-gray-300">{country.NOC}</p>
                                  <p className="font-medium text-blue-300">{country.medal_count} medals</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400">No medal data available</p>
                            )}
                          </div>
                        </div>

                        <Link href={`/sports/${encodeURIComponent(sport.name)}`} className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-center mt-4">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-xl text-gray-400">No sports found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}