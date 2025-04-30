'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule
} from "react-simple-maps";
import { scaleLinear, scaleOrdinal,scalePoint } from "d3-scale";
import { arc, pie } from "d3-shape";
import { format } from "d3-format";
import { select, selectAll } from "d3-selection";
import { brushX } from "d3-brush";
import Papa from 'papaparse';



const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const olympicYears = [
  1896, 1900, 1904, 1908, 1912,
  1920, 1924, 1928, 1932, 1936,
  1948, 1952, 1956, 1960, 1964,
  1968, 1972, 1976, 1980, 1984,
  1988, 1992, 1996, 2000, 2004,
  2008, 2012, 2016
];

// --- HeatMap Legend ---
function HeatMapLegend({ colorScale, domain, selectedMedalType }) {
  const gradientId = "heatmap-gradient";
  const width = 450, height = 16;
  
  return (
    <div className="my-2 w-full max-w-[450px]">
      <div className="relative">
        <svg width="100%" height={height} preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {domain.map((d, i) => (
                <stop
                  key={i}
                  offset={`${(i / (domain.length - 1)) * 100}%`}
                  stopColor={colorScale(d)}
                />
              ))}
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
        </svg>
        
        {/* Labels container with proper spacing */}
        <div className="flex justify-between w-full mt-2 px-1">
          {domain.map((d, i) => (
            <div 
              key={i} 
              className="text-xs text-gray-300"
              style={{
                textAlign: i === 0 ? 'left' : i === domain.length - 1 ? 'right' : 'center',
                width: i === 0 || i === domain.length - 1 ? 'auto' : `${100 / (domain.length - 1)}%`,
                overflow: 'visible',
                whiteSpace: 'nowrap'
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
      <div className="h-6" /> {/* Spacer for the labels */}
      <span className="text-xs text-gray-400 mt-6 block">
        ({selectedMedalType.charAt(0).toUpperCase() + selectedMedalType.slice(1)} medals)
      </span>
    </div>
  );
}

// --- Region Map Visualization ---
function RegionMapVisualization({
  countries, medalData, yearData, selectedYear, setSelectedYear,
  selectedMedalType, setSelectedMedalType,
  mapZoom, setMapZoom, setSelectedRegion, colorScale, colorDomain
}) {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const mapContainerRef = useRef(null);

  const getCountryCode = (geo) => {
    if (!geo?.properties) return "";
    if (geo.properties.ISO_A3) return geo.properties.ISO_A3.toLowerCase();
    if (geo.properties.id) return geo.properties.id.toLowerCase();
    const nameToCode = {
      // Existing entries
      'united states of america': 'usa',
      'united states': 'usa',
      'united kingdom': 'gbr',
      'great britain': 'gbr',
      'russian federation': 'rus',
      'russia': 'rus',
      'people\'s republic of china': 'chn',
      'china': 'chn',
      'japan': 'jpn',
      'australia': 'aus',
      'federal republic of germany': 'ger',
      'germany': 'ger',
      'france': 'fra',
      'italy': 'ita',
      'spain': 'esp',
      'canada': 'can',
      'brazil': 'bra',
      'india': 'ind',
      'south africa': 'rsa',
      'mexico': 'mex',
      'netherlands': 'ned',
      'south korea': 'kor',
      'republic of korea': 'kor',
      'north korea': 'prk',
      'sweden': 'swe',
      'norway': 'nor',
      'finland': 'fin',
      'denmark': 'den',
    
      // New entries from NOC list
      'afghanistan': 'afg',
      'curacao': 'aho',
      'netherlands antilles': 'aho',
      'albania': 'alb',
      'algeria': 'alg',
      'andorra': 'and',
      'angola': 'ang',
      'antigua': 'ant',
      'antigua and barbuda': 'ant',
      'australasia': 'anz',
      'argentina': 'arg',
      'armenia': 'arm',
      'aruba': 'aru',
      'american samoa': 'asa',
      'austria': 'aut',
      'azerbaijan': 'aze',
      'bahamas': 'bah',
      'bangladesh': 'ban',
      'barbados': 'bar',
      'burundi': 'bdi',
      'belgium': 'bel',
      'benin': 'ben',
      'bermuda': 'ber',
      'bhutan': 'bhu',
      'bosnia and herzegovina': 'bih',
      'belize': 'biz',
      'belarus': 'blr',
      'bohemia': 'boh',
      'bolivia': 'bol',
      'botswana': 'bot',
      'bahrain': 'brn',
      'brunei': 'bru',
      'bulgaria': 'bul',
      'burkina faso': 'bur',
      'central african republic': 'caf',
      'cambodia': 'cam',
      'cayman islands': 'cay',
      'republic of congo': 'cgo',
      'chad': 'cha',
      'chile': 'chi',
      'ivory coast': 'civ',
      'cameroon': 'cmr',
      'democratic republic of the congo': 'cod',
      'cook islands': 'cok',
      'colombia': 'col',
      'comoros': 'com',
      'cape verde': 'cpv',
      'costa rica': 'crc',
      'croatia': 'cro',
      'crete': 'crt',
      'cuba': 'cub',
      'cyprus': 'cyp',
      'czech republic': 'cze',
      'djibouti': 'dji',
      'dominica': 'dma',
      'dominican republic': 'dom',
      'ecuador': 'ecu',
      'egypt': 'egy',
      'eritrea': 'eri',
      'el salvador': 'esa',
      'estonia': 'est',
      'ethiopia': 'eth',
      'russia': 'eun', // Note: EUN was Unified Team (ex-USSR)
      'fiji': 'fij',
      'micronesia': 'fsm',
      'gabon': 'gab',
      'gambia': 'gam',
      'guinea-bissau': 'gbs',
      'east germany': 'gdr',
      'georgia': 'geo',
      'equatorial guinea': 'geq',
      'ghana': 'gha',
      'grenada': 'grn',
      'guatemala': 'gua',
      'guinea': 'gui',
      'guam': 'gum',
      'guyana': 'guy',
      'haiti': 'hai',
      'hong kong': 'hkg',
      'honduras': 'hon',
      'hungary': 'hun',
      'indonesia': 'ina',
      'individual olympic athletes': 'ioa',
      'iran': 'iri',
      'iraq': 'irq',
      'iceland': 'isl',
      'israel': 'isr',
      'virgin islands': 'isv',
      'british virgin islands': 'ivb',
      'jamaica': 'jam',
      'jordan': 'jor',
      'kazakhstan': 'kaz',
      'kenya': 'ken',
      'kyrgyzstan': 'kgz',
      'kiribati': 'kir',
      'kosovo': 'kos',
      'saudi arabia': 'ksa',
      'kuwait': 'kuw',
      'laos': 'lao',
      'latvia': 'lat',
      'libya': 'lba',
      'liberia': 'lbr',
      'saint lucia': 'lca',
      'lesotho': 'les',
      'lebanon': 'lib',
      'liechtenstein': 'lie',
      'lithuania': 'ltu',
      'luxembourg': 'lux',
      'madagascar': 'mad',
      'malaysia': 'mas',
      'morocco': 'mar',
      'malawi': 'maw',
      'moldova': 'mda',
      'maldives': 'mdv',
      'mongolia': 'mgl',
      'marshall islands': 'mhl',
      'north macedonia': 'mkd',
      'mali': 'mli',
      'malta': 'mlt',
      'montenegro': 'mne',
      'monaco': 'mon',
      'mozambique': 'moz',
      'mauritius': 'mri',
      'mauritania': 'mtn',
      'myanmar': 'mya',
      'namibia': 'nam',
      'north borneo': 'nbo',
      'nicaragua': 'nca',
      'nepal': 'nep',
      'newfoundland': 'nfl',
      'nigeria': 'ngr',
      'niger': 'nig',
      'nauru': 'nru',
      'new zealand': 'nzl',
      'oman': 'oma',
      'pakistan': 'pak',
      'panama': 'pan',
      'paraguay': 'par',
      'peru': 'per',
      'philippines': 'phi',
      'palestine': 'ple',
      'palau': 'plw',
      'papua new guinea': 'png',
      'poland': 'pol',
      'portugal': 'por',
      'puerto rico': 'pur',
      'qatar': 'qat',
      'zimbabwe': 'rho',
      'refugee olympic team': 'rot',
      'romania': 'rou',
      'rwanda': 'rwa',
      'saar': 'saa',
      'samoa': 'sam',
      'serbia and montenegro': 'scg',
      'senegal': 'sen',
      'seychelles': 'sey',
      'singapore': 'sin',
      'saint kitts': 'skn',
      'sierra leone': 'sle',
      'slovenia': 'slo',
      'san marino': 'smr',
      'solomon islands': 'sol',
      'somalia': 'som',
      'serbia': 'srb',
      'sri lanka': 'sri',
      'south sudan': 'ssd',
      'sao tome and principe': 'stp',
      'sudan': 'sud',
      'switzerland': 'sui',
      'suriname': 'sur',
      'slovakia': 'svk',
      'eswatini': 'swz',
      'swaziland': 'swz',
      'syria': 'syr',
      'tanzania': 'tan',
      'tonga': 'tga',
      'thailand': 'tha',
      'tajikistan': 'tjk',
      'turkmenistan': 'tkm',
      'timor-leste': 'tls',
      'togo': 'tog',
      'taiwan': 'tpe',
      'trinidad': 'tto',
      'trinidad and tobago': 'tto',
      'tunisia': 'tun',
      'turkey': 'tur',
      'tuvalu': 'tuv',
      'united arab emirates': 'uae',
      'uganda': 'uga',
      'ukraine': 'ukr',
      'unknown': 'unk',
      'soviet union': 'urs',
      'uruguay': 'uru',
      'uzbekistan': 'uzb',
      'vanuatu': 'van',
      'venezuela': 'ven',
      'vietnam': 'vie',
      'saint vincent': 'vin',
      'west indies federation': 'wif',
      'yemen': 'yem',
      'north yemen': 'yar',
      'south yemen': 'ymd',
      'yugoslavia': 'yug',
      'zambia': 'zam'
    };
    const normalizedName = geo.properties.name?.toLowerCase();
    return nameToCode[normalizedName] || "";
  };

  const getTooltipContent = (geo) => {
    const countryName = geo.properties?.name || 'Unknown';
    const countryCode = getCountryCode(geo);
    let dataSource = medalData;
    if (selectedYear && yearData[selectedYear]) {
      dataSource = yearData[selectedYear];
    }
    const countryMedalData = dataSource[countryCode];
    if (!countryMedalData) {
      return {
        name: countryName,
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0,
        year: selectedYear || null
      };
    }
    return {
      name: countryName,
      gold: countryMedalData.gold || 0,
      silver: countryMedalData.silver || 0,
      bronze: countryMedalData.bronze || 0,
      total: countryMedalData.total || 0,
      year: selectedYear || null
    };
  };

  const getCountryFillColor = (geo) => {
    const countryCode = getCountryCode(geo);
    let dataSource = medalData;
    if (selectedYear && yearData[selectedYear]) {
      dataSource = yearData[selectedYear];
    }
    const countryData = dataSource[countryCode];
    if (!countryData) return "#151522"; // same dark color for countries without data
    const medalCount = countryData[selectedMedalType] || 0;
    return colorScale(medalCount);
  };

  const handleRegionClick = (geo) => {
    const countryName = geo.properties?.name || 'Unknown';
    const countryCode = getCountryCode(geo);
    let dataSource = medalData;
    if (selectedYear && yearData[selectedYear]) {
      dataSource = yearData[selectedYear];
    }
    const countryMedalData = dataSource[countryCode];
    if (countryMedalData) {
      setSelectedRegion({
        ...countryMedalData,
        name: countryMedalData.name || countryName,
        year: selectedYear || null
      });
    } else {
      setSelectedRegion({
        name: countryName,
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0,
        year: selectedYear || null
      });
    }
  };

  // const handleMouseEnter = (event, geo) => {
  //   console.debug("Mouse enter:", geo.properties?.name);
  //   const content = getTooltipContent(geo);
    
  //   const mapContainer = event.currentTarget.closest('.map-container');
  //   const rect = mapContainer.getBoundingClientRect();
    
  //   // Calculate safe tooltip position (prevent overflow)
  //   const safePosition = calculateTooltipPosition(event, rect);
    
  //   // Set both the tooltip content and position
  //   setTooltipContent(content);
  //   setTooltipPosition(safePosition);
  //   setShowTooltip(true);
  // };
  

  // const handleMouseMove = (event) => {
  //   if (showTooltip) {
  //     const mapContainer = event.currentTarget.closest('.map-container');
  //     const rect = mapContainer.getBoundingClientRect();
      
  //     // Use the same safe positioning logic
  //     const safePosition = calculateTooltipPosition(event, rect);
  //     setTooltipPosition(safePosition);
  //   }
  // };
  // New function to calculate safe tooltip position
  const calculateTooltipPosition = (event, containerRect) => {
    const TOOLTIP_WIDTH = 180;
    const TOOLTIP_HEIGHT = 140;
    const MARGIN = 10;
    
    // Get cursor position relative to container
    let x = event.clientX - containerRect.left;
    let y = event.clientY - containerRect.top;
    
    // Initial position (right-bottom of cursor)
    let posX = x + MARGIN;
    let posY = y + MARGIN;
    
    // Check for right edge overflow
    if (posX + TOOLTIP_WIDTH > containerRect.width) {
      posX = x - TOOLTIP_WIDTH - MARGIN; // Place to left of cursor
    }
    
    // Check for bottom edge overflow
    if (posY + TOOLTIP_HEIGHT > containerRect.height) {
      posY = y - TOOLTIP_HEIGHT - MARGIN; // Place above cursor
    }
    
    // Ensure tooltip doesn't go outside the container bounds
    posX = Math.max(MARGIN, Math.min(containerRect.width - TOOLTIP_WIDTH - MARGIN, posX));
    posY = Math.max(MARGIN, Math.min(containerRect.height - TOOLTIP_HEIGHT - MARGIN, posY));
    
    return { x: posX, y: posY };
  };

  const handleMouseEnter = (event, geo) => {
    const content = getTooltipContent(geo);
    
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    
    // Calculate safe tooltip position
    const safePosition = calculateTooltipPosition(event, rect);
    
    // Set both the tooltip content and position
    setTooltipContent(content);
    setTooltipPosition(safePosition);
    setShowTooltip(true);
  };

  const handleMouseMove = (event) => {
    if (showTooltip && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const safePosition = calculateTooltipPosition(event, rect);
      setTooltipPosition(safePosition);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <section className="bg-gray-900 p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Region-Wise Medal Count</h2>
      
      {/* Responsive controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setMapZoom(prev => Math.min(prev + 0.5, 4))}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Zoom In +
          </button>
          <button 
            onClick={() => setMapZoom(prev => Math.max(prev - 0.5, 0.8))}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Zoom Out -
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-white">Year:</label>
          <select 
            value={selectedYear || ''}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="">All Time</option>
            {olympicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Medal type selector and legend - now more responsive */}
      <div className="flex flex-col items-start mb-4 bg-gray-800 p-2 rounded overflow-x-auto w-full">
        <div className="flex flex-wrap mb-2 w-full">
          <button 
            onClick={() => setSelectedMedalType('total')}
            className={`px-3 py-1 m-1 rounded ${selectedMedalType === 'total' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}
          >
            Total Medals
          </button>
          <button 
            onClick={() => setSelectedMedalType('gold')}
            className={`px-3 py-1 m-1 rounded ${selectedMedalType === 'gold' ? 'bg-yellow-500 text-black' : 'bg-gray-300 text-gray-800'}`}
          >
            Gold
          </button>
          <button 
            onClick={() => setSelectedMedalType('silver')}
            className={`px-3 py-1 m-1 rounded ${selectedMedalType === 'silver' ? 'bg-gray-400 text-black' : 'bg-gray-300 text-gray-800'}`}
          >
            Silver
          </button>
          <button 
            onClick={() => setSelectedMedalType('bronze')}
            className={`px-3 py-1 m-1 rounded ${selectedMedalType === 'bronze' ? 'bg-amber-700 text-white' : 'bg-gray-300 text-gray-800'}`}
          >
            Bronze
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <HeatMapLegend colorScale={colorScale} domain={colorDomain} selectedMedalType={selectedMedalType} />
        </div>
      </div>
      
      {/* Map container with ref for positioning */}
      <div 
        className="h-[500px] map-container relative" 
        id="map-container" 
        ref={mapContainerRef}
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 147 * mapZoom
          }}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#fff"
          }}
        >
          <ZoomableGroup center={[0, 0]} zoom={1.5}>
            <Sphere stroke="#333" strokeWidth={0.5} fill="#fff" />
            <Graticule stroke="#333" strokeWidth={0.5} />
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFillColor(geo)}
                    stroke="#222"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#333" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(event, geo)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleRegionClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Improved tooltip with fixed positioning */}
        {showTooltip && tooltipPosition && (
          <div
            className="absolute z-50 bg-gray-800 text-white p-3 rounded-md shadow-lg border border-gray-700 animate-fadeIn"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              maxWidth: '220px',
              width: 'auto',
              pointerEvents: 'none'
            }}
          >
            <div className="font-bold mb-2 text-center border-b border-gray-600 pb-1 text-sm truncate">
              {tooltipContent.name}
              {tooltipContent.year ? (
                <span className="text-blue-400 ml-1">({tooltipContent.year})</span>
              ) : (
                <span className="text-blue-400 ml-1">(All Time)</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold mb-1">
                  {tooltipContent.gold}
                </div>
                <div className="text-yellow-400 text-xs">Gold</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold mb-1">
                  {tooltipContent.silver}
                </div>
                <div className="text-gray-300 text-xs">Silver</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-black font-bold mb-1">
                  {tooltipContent.bronze}
                </div>
                <div className="text-amber-700 text-xs">Bronze</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-1">
                  {tooltipContent.total}
                </div>
                <div className="text-blue-400 text-xs">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// --- Selected Region Details Visualization ---
function SelectedRegionDetails({ selectedRegion, olympicYears, selectedYear, setSelectedYear }) {
  if (!selectedRegion) return null;
  return (
    <section className="bg-gray-800 p-4 rounded-lg shadow-md mt-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white">
          {selectedRegion.name}
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-white">Year:</label>
          <select 
            value={selectedYear || ''}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="">All Time</option>
            {olympicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap justify-around bg-gray-900 p-3 rounded">
        <div className="text-center p-2">
          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xl font-bold mx-auto mb-1">
            {selectedRegion.gold}
          </div>
          <div className="text-yellow-400 font-medium">Gold</div>
        </div>
        <div className="text-center p-2">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-black text-xl font-bold mx-auto mb-1">
            {selectedRegion.silver}
          </div>
          <div className="text-gray-300 font-medium">Silver</div>
        </div>
        <div className="text-center p-2">
          <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-black text-xl font-bold mx-auto mb-1">
            {selectedRegion.bronze}
          </div>
          <div className="text-amber-700 font-medium">Bronze</div>
        </div>
        <div className="text-center p-2">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-1">
            {selectedRegion.total}
          </div>
          <div className="text-blue-400 font-medium">Total</div>
        </div>
      </div>
    </section>
  );
}

// --- Medal Trend LineChart Visualization ---
function MedalTrendChart({ yearData, olympicYears, selectedCountry, selectedYear, setSelectedYear }) {
  if (!selectedCountry) return null;
  const countryCode = selectedCountry.noc?.toLowerCase();
  if (!countryCode) return null;
  const data = olympicYears.map(year => {
    const yData = yearData[year]?.[countryCode];
    return {
      year,
      gold: yData?.gold || 0,
      silver: yData?.silver || 0,
      bronze: yData?.bronze || 0,
      total: yData?.total || 0,
    };
  });
  const width = 400, height = 180, margin = 30;
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const getY = val => height - margin - (val / maxTotal) * (height - 2 * margin);
  const [hoverIdx, setHoverIdx] = useState(null);
  return (
    <section className="bg-gray-800 p-4 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white">
          Medal Trend: <span className="text-blue-400">{selectedCountry.name}</span>
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-white">Year:</label>
          <select 
            value={selectedYear || ''}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="">All Time</option>
            {olympicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      <svg width={width} height={height} className="bg-gray-900 rounded">
        <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="#aaa" />
        <line x1={margin} y1={margin} x2={margin} y2={height - margin} stroke="#aaa" />
        {olympicYears.map((year, i) => (
          <text key={year} x={margin + i * ((width - 2 * margin) / (olympicYears.length - 1))} y={height - 10} fontSize="12" fill="#ccc" textAnchor="middle">{year}</text>
        ))}
        <polyline
          fill="none"
          stroke="#60a5fa"
          strokeWidth={3}
          points={data.map((d, i) => {
            const x = margin + i * ((width - 2 * margin) / (olympicYears.length - 1));
            const y = getY(d.total);
            return `${x},${y}`;
          }).join(' ')}
        />
        <polyline
          fill="none"
          stroke="#facc15"
          strokeWidth={2}
          points={data.map((d, i) => {
            const x = margin + i * ((width - 2 * margin) / (olympicYears.length - 1));
            const y = getY(d.gold);
            return `${x},${y}`;
          }).join(' ')}
        />
        {data.map((d, i) => {
          const x = margin + i * ((width - 2 * margin) / (olympicYears.length - 1));
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={getY(d.total)}
                r={hoverIdx === i ? 7 : 4}
                fill="#60a5fa"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
              <circle
                cx={x}
                cy={getY(d.gold)}
                r={hoverIdx === i ? 6 : 3}
                fill="#facc15"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
              {hoverIdx === i && (
                <g>
                  <rect x={x-40} y={getY(d.total)-40} width="80" height="32" rx="6" fill="#222" stroke="#60a5fa" />
                  <text x={x} y={getY(d.total)-25} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">
                    {d.year}
                  </text>
                  <text x={x} y={getY(d.total)-10} textAnchor="middle" fill="#60a5fa" fontSize="12">
                    Total: {d.total}
                  </text>
                  <text x={x} y={getY(d.total)+5} textAnchor="middle" fill="#facc15" fontSize="12">
                    Gold: {d.gold}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-gray-400 mt-2">
        <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1"></span> Total &nbsp;
        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1"></span> Gold
      </div>
    </section>
  );
}

// --- Medal Trends Over Time For Multiple Countries ---
function MultiCountryTrendChart({ yearData, olympicYears, countries, selectedYear, setSelectedYear }) {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [hoverData, setHoverData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [brushRange, setBrushRange] = useState([olympicYears[0], olympicYears[olympicYears.length - 1]]);
  const svgRef = useRef(null);
  const brushRef = useRef(null);
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 400
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        const containerWidth = chartRef.current.clientWidth;
        // Adjust width to account for padding and ensure it fits within the container
        setDimensions({
          width: Math.max(300, containerWidth - 40),
          height: 400
        });
      }
    };

    // Initial measurement after component mounts
    setTimeout(handleResize, 0);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get filtered years based on brush selection
  const filteredYears = olympicYears.filter(
    year => year >= brushRange[0] && year <= brushRange[1]
  );

  // Define color palette for selected countries
  const colorPalette = [
    "#2563eb", "#dc2626", "#16a34a", "#9333ea", 
    "#ea580c", "#0891b2", "#a16207", "#4f46e5",
    "#be185d", "#0d9488", "#b45309", "#7c3aed"
  ];
  
  // Create color mapping only for selected countries
  const countryColors = useMemo(() => {
    const colors = {};
    selectedCountries.forEach((country, index) => {
      colors[country.noc] = colorPalette[index % colorPalette.length];
    });
    return colors;
  }, [selectedCountries]);
  
  // Chart dimensions calculated based on container size
  const margin = { top: 40, right: 80, bottom: 80, left: 80 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;

  useEffect(() => {
    if (brushRef.current && olympicYears.length > 0) {
      const svg = select(brushRef.current);
      
      // Clear previous brush
      svg.selectAll("*").remove();
      
      // Create x scale for the brush
      const xScale = scaleLinear()
        .domain([0, olympicYears.length - 1]) // Use indices instead of years
        .range([0, chartWidth]);
      
      // Setup brush
      const brush = brushX()
        .extent([[0, 0], [chartWidth, 30]])
        .on("end", (event) => {
          if (!event.selection) return;
          
          const [x0, x1] = event.selection;
          
          // Convert pixel positions to indices
          const i0 = Math.max(0, Math.floor(xScale.invert(x0)));
          const i1 = Math.min(olympicYears.length - 1, Math.ceil(xScale.invert(x1)));
          
          // Only update if values actually changed
          const newMin = olympicYears[i0];
          const newMax = olympicYears[i1];
          
          if (brushRange[0] !== newMin || brushRange[1] !== newMax) {
            setBrushRange([newMin, newMax]);
          }
        });
      
      // Draw the brush
      svg.append("g")
        .call(brush)
        .call(brush.move, [
          xScale(olympicYears.indexOf(brushRange[0])),
          xScale(olympicYears.indexOf(brushRange[1]))
        ]);
    }
  }, [dimensions.width, olympicYears, chartWidth, brushRange]);

  const toggleCountry = (country) => {
    if (selectedCountries.some(c => c.noc === country.noc)) {
      setSelectedCountries(selectedCountries.filter(c => c.noc !== country.noc));
    } else if (selectedCountries.length < 6) { // Limit to 6 countries for readability
      setSelectedCountries([...selectedCountries, country]);
    } else {
      alert("Maximum 6 countries can be selected for comparison");
    }
  };

  // Filter countries by search term
  const filteredCountries = countries
    .filter(c => c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b?.total || 0) - (a?.total || 0))
    .slice(0, 50); // Limit to top 50 for performance

  // X scale maps year indices to x positions
  const xScale = scaleLinear()
    .domain([0, filteredYears.length - 1])
    .range([0, chartWidth]);

  // Find the maximum medal count for y scale
  let maxMedals = 10;  // Default minimum
  if (selectedCountries.length > 0) {
    selectedCountries.forEach(country => {
      filteredYears.forEach(year => {
        const countryData = yearData[year]?.[country.noc] || yearData[year]?.[country.noc.toLowerCase()];
        if (countryData) {
          maxMedals = Math.max(maxMedals, countryData.total);
        }
      });
    });
  }

  // Y scale maps medal counts to y positions
  const yScale = scaleLinear()
    .domain([0, maxMedals])
    .range([chartHeight, 0]);

  // Calculate tooltip positioning to prevent overflow
  const getTooltipTransform = (x, y) => {
    // Check if tooltip would overflow to the right
    const rightOverflow = x + 190 > chartWidth;
    // Check if tooltip would overflow to the top
    const topOverflow = y - 40 < 0;
    
    // Adjust position based on overflow
    const adjustedX = rightOverflow ? x - 200 : x + 10;
    const adjustedY = topOverflow ? y + 10 : y - 40;
    
    return `translate(${adjustedX}, ${adjustedY})`;
  };

  return (
    <section className="bg-gray-800 p-4 rounded-lg shadow-md mt-6" ref={containerRef}>
      <div className="flex flex-wrap justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-white">
          Medal Trends Over Time
          <span className="text-blue-400 ml-2">
            ({brushRange[0]} - {brushRange[1]})
          </span>
        </h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-48"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Country Selection */}
        <div className="w-full lg:w-64 bg-gray-900 p-2 rounded lg:mr-4 mb-4 lg:mb-0 overflow-y-auto h-64 lg:h-[400px] flex-shrink-0">
          <h3 className="text-white font-bold mb-2">Select Countries (max 6):</h3>
          <ul className="space-y-1">
            {filteredCountries.map(country => {
              // Find color for selected countries or use a placeholder gray
              const color = selectedCountries.some(c => c.noc === country.noc) 
                ? countryColors[country.noc] 
                : "#666";
              
              return (
                <li key={country.noc} className="flex items-center">
                  <label className="flex items-center cursor-pointer w-full p-1 hover:bg-gray-800 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCountries.some(c => c.noc === country.noc)}
                      onChange={() => toggleCountry(country)}
                      className="mr-2"
                    />
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="text-sm text-white truncate">{country.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Chart */}
        <div className="flex-1 flex flex-col bg-gray-900 rounded overflow-hidden min-w-0" ref={chartRef}>
          {/* Chart SVG Container */}
          <div className="relative w-full overflow-hidden" style={{ height: dimensions.height }}>
            <svg
              ref={svgRef}
              width="100%"
              height={dimensions.height}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="overflow-visible"
            >
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Y-axis */}
                {yScale.ticks(5).map(tick => (
                  <g key={tick} transform={`translate(0,${yScale(tick)})`}>
                    <line
                      x1={0}
                      x2={chartWidth}
                      stroke="#444"
                      strokeWidth={0.5}
                    />
                    <text
                      x={-10}
                      y={4}
                      fontSize={12}
                      textAnchor="end"
                      fill="#aaa"
                    >
                      {tick}
                    </text>
                  </g>
                ))}
                
                {/* X-axis (tick marks and year labels) */}
                {filteredYears.map((year, i) => (
                  <g key={year} transform={`translate(${xScale(i)},${chartHeight})`}>
                    <line
                      y1={0}
                      y2={5}
                      stroke="#aaa"
                      strokeWidth={1}
                    />
                    <text
                      y={20}
                      fontSize={12}
                      textAnchor="middle"
                      fill="#aaa"
                      style={{
                        display: i % Math.max(1, Math.floor(filteredYears.length / 10)) === 0 ? 'block' : 'none'
                      }}
                    >
                      {year}
                    </text>
                  </g>
                ))}

                {/* Lines for each country */}
                {selectedCountries.map(country => {
                  // Get data points for this country
                  const dataPoints = filteredYears.map((year, i) => {
                    // Try both regular and lowercase NOC
                    const countryData = 
                      yearData[year]?.[country.noc] || 
                      yearData[year]?.[country.noc.toLowerCase()];
                    
                    return {
                      x: xScale(i),
                      y: yScale(countryData?.total || 0),
                      year,
                      medals: countryData?.total || 0
                    };
                  });

                  return (
                    <g key={country.noc}>
                      {dataPoints.length > 1 && (
                        <path
                          d={`M ${dataPoints.map(d => `${d.x},${d.y}`).join(' L ')}`}
                          stroke={countryColors[country.noc]}
                          strokeWidth={3}
                          fill="none"
                        />
                      )}
                      {dataPoints.map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r={5}
                          fill={countryColors[country.noc]}
                          onMouseEnter={() => setHoverData({
                            country: country.name,
                            year: point.year,
                            medals: point.medals,
                            x: point.x,
                            y: point.y
                          })}
                          onMouseLeave={() => setHoverData(null)}
                        />
                      ))}
                    </g>
                  );
                })}
                
                {/* Y-axis label */}
                <text
                  transform={`translate(-50, ${chartHeight / 2}) rotate(-90)`}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={14}
                >
                  Total Medals
                </text>
                
                {/* X-axis label */}
                <text
                  transform={`translate(${chartWidth / 2}, ${chartHeight + 45})`}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={14}
                >
                  Olympic Year
                </text>
                
                {/* Hover tooltip with overflow prevention */}
                {hoverData && (
                  <g transform={getTooltipTransform(hoverData.x, hoverData.y)}>
                    <rect
                      width={180}
                      height={60}
                      fill="#333"
                      stroke="#555"
                      rx={5}
                    />
                    <text x={10} y={20} fontSize={12} fill="#fff">
                      {hoverData.country}
                    </text>
                    <text x={10} y={40} fontSize={12} fill="#fff">
                      Year: {hoverData.year}, Medals: {hoverData.medals}
                    </text>
                  </g>
                )}
              </g>
            </svg>
            
            {/* Legend overlay - positioned in top right corner */}
            <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-80 p-2 rounded">
              {selectedCountries.map((country, i) => (
                <div key={country.noc} className="flex items-center mb-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: countryColors[country.noc] }}
                  ></div>
                  <span className="text-xs text-white truncate max-w-[100px]">
                    {country.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Brush control below chart (no year labels, just ticks and brush) */}
          <div className="mt-2 px-4 pb-2">
            <svg width="100%" height={50} preserveAspectRatio="xMidYMid meet">
              <g transform={`translate(${margin.left}, 10)`}>
                <g ref={brushRef}></g>
              </g>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>Select countries from the list to compare medal trends over time. Use the brush below the chart to zoom in on specific time periods.</p>
      </div>
    </section>
  );
}

// --- Enhanced Top Medal-Winning Countries Bar Chart ---
// --- Enhanced Top Medal-Winning Countries Bar Chart ---
function TopMedalCountriesBarChart({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [medalType, setMedalType] = useState('total');
  const [topCount, setTopCount] = useState(10);
  const [sortBy, setSortBy] = useState('desc');
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [showMedalBreakdown, setShowMedalBreakdown] = useState(false);
  
  // Create refs for container measurement
  const chartContainerRef = useRef(null);
  
  // Update dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth;
        setDimensions({
          width: containerWidth - 40,
          height: Math.min(500, window.innerHeight * 0.6)
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const margin = { top: 30, right: 30, bottom: 70, left: 100 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;
  
  // Get data source based on year selection and ensure each country has a proper ID
  // Within the TopMedalCountriesBarChart function, update the data processing code:

// Get data source based on year selection and ensure each country has a proper ID and NAME
// Get data source based on year selection and ensure each country has a proper ID and NAME
// Update the dataToUse code in the TopCountriesTable component:

let dataToUse = countries;
if (selectedYear && yearData[selectedYear]) {
  dataToUse = Object.entries(yearData[selectedYear])
    .filter(([_, c]) => c && typeof c === 'object')
    .map(([noc, data]) => {
      // First look for a matching country in the all-time data to get its name
      const matchingCountry = countries.find(c => 
        c.noc?.toLowerCase() === noc.toLowerCase() || 
        c.id?.toLowerCase() === noc.toLowerCase()
      );
      
      return {
        ...data,
        noc: noc,
        // Use a more robust name resolution approach
        name: data.name || 
              data.region || 
              matchingCountry?.name || 
              yearData[selectedYear][noc]?.region || 
              `Country ${noc.toUpperCase()}`,
        id: noc || `unknown-${Math.random().toString(36).substr(2, 9)}`
      };
    });
}

// Sort and filter top countries
const topCountries = [...dataToUse]
  .sort((a, b) => {
    const valA = a?.[medalType] || 0;
    const valB = b?.[medalType] || 0;
    return sortBy === 'desc' ? valB - valA : valA - valB;
  })
  .slice(0, topCount)
  .map((country, index) => {
    // Look for matching country again to ensure we have the best name
    const matchingCountry = countries.find(c => 
      c.noc?.toLowerCase() === country.noc?.toLowerCase() || 
      c.id?.toLowerCase() === country.noc?.toLowerCase()
    );
    
    return {
      ...country,
      id: country.noc || country.id || `country-${index}`,
      name: country.name || 
            country.region || 
            matchingCountry?.name || 
            `Country ${country.noc?.toUpperCase() || index + 1}`
    };
  });
  
  // Calculate scales
    // Calculate scales
    const maxValue = showMedalBreakdown 
    ? Math.max(...topCountries.map(c => c.total || 0), 1) // Use total medals for breakdown view
    : Math.max(...topCountries.map(c => c[medalType] || 0), 1);
  
  const xScale = scaleLinear()
    .domain([0, maxValue])
    .range([0, innerWidth]);
  
  const barHeight = innerHeight / topCountries.length * 0.7;
  const barPadding = innerHeight / topCountries.length * 0.3;
  
  // Enhanced color mapping for medal types with gradients
  const medalColors = {
    gold: { main: "#fbbf24", gradient: ["#fef3c7", "#f59e0b", "#92400e"] },
    silver: { main: "#d1d5db", gradient: ["#f3f4f6", "#9ca3af", "#4b5563"] },
    bronze: { main: "#92400e", gradient: ["#fed7aa", "#c2410c", "#7c2d12"] },
    total: { main: "#3b82f6", gradient: ["#dbeafe", "#2563eb", "#1e40af"] }
  };
  
  // Grid lines to improve readability
  const gridLines = xScale.ticks(5);
  
  return (
    <section className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-md mt-8 w-full max-w-full mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">🏅</span>
          Top Medal-Winning Countries
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-white mr-2 text-sm">Year:</label>
            <select 
              value={selectedYear || ''}
              onChange={e => setSelectedYear(parseInt(e.target.value) || null)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value="">All Time</option>
              {olympicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2 text-sm">Medal:</label>
            <select
              value={medalType}
              onChange={e => setMedalType(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value="total">Total</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2 text-sm">Show:</label>
            <select
              value={topCount}
              onChange={e => setTopCount(Number(e.target.value))}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2 text-sm">Sort:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
          
          <div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showMedalBreakdown}
                onChange={() => setShowMedalBreakdown(!showMedalBreakdown)}
              />
              <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              <span className="ms-3 text-sm font-medium text-white">Medal Breakdown</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-2 md:p-4 rounded overflow-x-auto" ref={chartContainerRef}>
        <svg 
          width="100%" 
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMinYMin meet"
          className="overflow-visible"
        >
          <defs>
            {/* Define gradients for bars */}
            {Object.entries(medalColors).map(([type, colors]) => (
              <linearGradient
                key={`gradient-${type}`}
                id={`gradient-${type}`}
                x1="0%" y1="0%" x2="100%" y2="0%"
              >
                <stop offset="0%" stopColor={colors.gradient[0]} stopOpacity={0.8} />
                <stop offset="50%" stopColor={colors.main} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors.gradient[2]} stopOpacity={1} />
              </linearGradient>
            ))}
            
            {/* Shadow filter for hover effect */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.6"/>
            </filter>
          </defs>
          
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines for better readability */}
            {gridLines.map(tick => (
              <line
                key={`grid-${tick}`}
                x1={xScale(tick)}
                y1={0}
                x2={xScale(tick)}
                y2={innerHeight}
                stroke="#333"
                strokeWidth={1}
                strokeDasharray="5,5"
                opacity={0.5}
              />
            ))}
            
            {/* X Axis with improved styling */}
            <line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="#666"
              strokeWidth={1}
            />
            
            {xScale.ticks(5).map(tick => (
              <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                <line
                  y1={innerHeight}
                  y2={innerHeight + 5}
                  stroke="#666"
                  strokeWidth={1}
                />
                <text
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fill="#bbb"
                  fontSize={12}
                  fontWeight="light"
                >
                  {tick}
                </text>
              </g>
            ))}
            
            {/* Y Axis (Countries) with improved styling */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="#666"
              strokeWidth={1}
            />
            
            {/* Countries and Bars with improved styling and animations */}
            {topCountries.map((country, i) => {
              // Use the unique ID to track hover state
              const isHovered = hoveredCountry === country.id;
              const barY = i * (innerHeight / topCountries.length) + barPadding / 2;
              
              return (
                <g 
                  key={country.id} 
                  className="transition-all duration-300 ease-in-out"
                  onMouseEnter={() => setHoveredCountry(country.id)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Country name */}
                  <text
                    x={-10}
                    y={barY + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill={isHovered ? "#fff" : "#ccc"}
                    fontSize={isHovered ? 12 : 11}
                    fontWeight={isHovered ? "bold" : "normal"}
                    className="transition-all duration-300"
                  >
                    {country.name.length > 15 
                      ? `${country.name.substring(0, 13)}...` 
                      : country.name}
                  </text>
                  
                  {showMedalBreakdown ? (
                    // Show stacked bars with medal breakdown
                    <g>
                      {/* Gold */}
                      <rect
                        y={barY}
                        width={xScale(country.gold || 0)}
                        height={barHeight}
                        fill="url(#gradient-gold)"
                        rx={3}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-300"
                        filter={isHovered ? "url(#shadow)" : ""}
                        transform={isHovered ? "scale(1.02)" : ""}
                      >
                        <title>{country.name}: {country.gold || 0} gold medals</title>
                      </rect>
                      
                      {/* Silver */}
                      <rect
                        y={barY}
                        x={xScale(country.gold || 0)}
                        width={xScale(country.silver || 0)}
                        height={barHeight}
                        fill="url(#gradient-silver)"
                        rx={3}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-300"
                      >
                        <title>{country.name}: {country.silver || 0} silver medals</title>
                      </rect>
                      
                      {/* Bronze */}
                      <rect
                        y={barY}
                        x={xScale((country.gold || 0) + (country.silver || 0))}
                        width={xScale(country.bronze || 0)}
                        height={barHeight}
                        fill="url(#gradient-bronze)"
                        rx={3}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-300"
                      >
                        <title>{country.name}: {country.bronze || 0} bronze medals</title>
                      </rect>
                      
                      {/* Medal count labels (show on hover) */}
                      {isHovered && (
                        <g className="transition-opacity duration-300">
                          <text
                            x={xScale(country.gold / 2 || 0)}
                            y={barY + barHeight / 2}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="#000"
                            fontSize={10}
                            fontWeight="bold"
                            opacity={country.gold > maxValue * 0.05 ? 1 : 0}
                          >
                            {country.gold || 0}
                          </text>
                          <text
                            x={xScale(country.gold || 0) + xScale(country.silver / 2 || 0)}
                            y={barY + barHeight / 2}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="#000"
                            fontSize={10}
                            fontWeight="bold"
                            opacity={country.silver > maxValue * 0.05 ? 1 : 0}
                          >
                            {country.silver || 0}
                          </text>
                          <text
                            x={xScale((country.gold || 0) + (country.silver || 0)) + xScale(country.bronze / 2 || 0)}
                            y={barY + barHeight / 2}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="#fff"
                            fontSize={10}
                            fontWeight="bold"
                            opacity={country.bronze > maxValue * 0.05 ? 1 : 0}
                          >
                            {country.bronze || 0}
                          </text>
                        </g>
                      )}
                      
                      {/* Total medal count (always visible) */}
                      <text
                        x={xScale(country.total || 0) + 8}
                        y={barY + barHeight / 2}
                        alignmentBaseline="middle"
                        fill="#fff"
                        fontSize={isHovered ? 13 : 12}
                        fontWeight="bold"
                        className="transition-all duration-300"
                      >
                        {country.total || 0}
                      </text>
                    </g>
                  ) : (
                    // Show single bar based on selected medal type
                    <g>
                      <rect
                        y={barY}
                        width={xScale(country[medalType] || 0)}
                        height={barHeight}
                        fill={`url(#gradient-${medalType})`}
                        rx={3}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-300"
                        filter={isHovered ? "url(#shadow)" : ""}
                        transform={isHovered ? "scale(1.02)" : ""}
                      >
                        <title>{country.name}: {country[medalType] || 0} {medalType} medals</title>
                      </rect>
                      
                      <text
                        x={xScale(country[medalType] || 0) + 8}
                        y={barY + barHeight / 2}
                        alignmentBaseline="middle"
                        fill="#fff"
                        fontSize={isHovered ? 13 : 12}
                        fontWeight="bold"
                        className="transition-all duration-300"
                      >
                        {country[medalType] || 0}
                        
                        {/* Show percentage for top 3 countries
                        {i < 3 && (
                          <tspan 
                            fill="#aaa" 
                            fontSize={isHovered ? 11 : 10}
                            dx={4}
                          >
                            ({((country[medalType] || 0) / topCountries.reduce((sum, c) => sum + (c[medalType] || 0), 0) * 100).toFixed(1)}%)
                          </tspan>
                        )} */}
                      </text>
                      
                      {isHovered && (
                        <g className="animate-fade-in">
                          <text
                            x={Math.min(innerWidth - 100, xScale(country[medalType] || 0) + 60)}
                            y={barY + barHeight / 2}
                            alignmentBaseline="middle"
                            fill="#9ca3af"
                            fontSize={10}
                          >
                            {/* 🥇 {country.gold || 0} &nbsp; 🥈 {country.silver || 0} &nbsp; 🥉 {country.bronze || 0} */}
                          </text>
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            
            {/* X Axis Title */}
            <text
              transform={`translate(${innerWidth / 2}, ${innerHeight + 45})`}
              textAnchor="middle"
              fill="#fff"
              fontSize={16}
              fontWeight="bold"
            >
              {medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals
            </text>
            
            {/* Y Axis Title */}
            <text
              transform={`translate(-60, ${innerHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fill="#fff"
              fontSize={16}
              fontWeight="bold"
            >
              Countries
            </text>
            
            {/* Medal type legend for stacked bars */}
            {showMedalBreakdown && (
              <g transform={`translate(${innerWidth - 180}, ${innerHeight + 45})`}>
                <text textAnchor="middle" fontSize={12} fill="#fff" fontWeight="bold">Medal Types</text>
                <rect x="-80" y="10" width="15" height="15" fill="url(#gradient-gold)" rx={2} />
                <text x="-60" y="22" fontSize={10} fill="#fff">Gold</text>
                <rect x="-30" y="10" width="15" height="15" fill="url(#gradient-silver)" rx={2} />
                <text x="-10" y="22" fontSize={10} fill="#fff">Silver</text>
                <rect x="20" y="10" width="15" height="15" fill="url(#gradient-bronze)" rx={2} />
                <text x="40" y="22" fontSize={10} fill="#fff">Bronze</text>
              </g>
            )}
          </g>
        </svg>
      </div>
      
      {/* Additional context and insights */}
      {topCountries.length > 0 && (
        <div className="mt-3 text-sm text-gray-300 p-2">
          <p>
            <span className="font-medium">{topCountries[0]?.name || 'Unknown'}</span> leads with 
            <span className="font-bold text-blue-300"> {topCountries[0]?.[medalType] || 0}</span> {medalType} medals
            {selectedYear ? ` in the ${selectedYear} Olympics` : ''}, followed by 
            <span className="font-medium"> {topCountries[1]?.name || 'Unknown'}</span> with 
            <span className="font-bold text-blue-300"> {topCountries[1]?.[medalType] || 0}</span> medals.
          </p>
        </div>
      )}
    </section>
  );
}
// --- Medal Distribution by Continent Pie Chart ---
// --- Medal Distribution by Continent Pie Chart (Enhanced) ---
// --- Medal Distribution by Continent Pie Chart (Enhanced) ---
function ContinentDistributionChart({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [medalType, setMedalType] = useState('total');
  const [highlightedContinent, setHighlightedContinent] = useState(null);
  const [focusedContinent, setFocusedContinent] = useState(null);
  const [sliderValue, setSliderValue] = useState(olympicYears.indexOf(selectedYear) !== -1 ? 
    olympicYears.indexOf(selectedYear) : olympicYears.length - 1);
  
  // Container ref for responsive sizing
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  // Update dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setDimensions({
          width: containerWidth - 40,
          height: 400
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Sync slider with selectedYear prop changes
  useEffect(() => {
    if (selectedYear) {
      const yearIndex = olympicYears.indexOf(selectedYear);
      if (yearIndex !== -1) {
        setSliderValue(yearIndex);
      }
    }
  }, [selectedYear, olympicYears]);

  // Handle slider change
  const handleSliderChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    setSliderValue(newIndex);
    setSelectedYear(olympicYears[newIndex]);
  };
  
  // Continent mapping remains the same
  const continentMapping = {
    'africa': ['alg', 'ang', 'ben', 'bot', 'bur', 'bdi', 'cmr', 'cgo', 'civ', 'dji', 'egy', 'eri', 'eth', 'gab', 'gam', 'gha', 'gui', 'ken', 'les', 'lbr', 'lba', 'mad', 'maw', 'mli', 'mtn', 'mri', 'mar', 'moz', 'nam', 'nig', 'ngr', 'rsa', 'rwa', 'sen', 'sey', 'sle', 'som', 'ssd', 'sud', 'swz', 'tan', 'tog', 'tun', 'uga', 'zam', 'zim', 'com', 'cpv', 'caf', 'tcd', 'cod', 'gnq', 'gnb', 'stp'],
    'asia': ['afg', 'bah', 'ban', 'bhu', 'bru', 'cam', 'chn', 'hkg', 'ind', 'ina', 'irq', 'iri', 'jpn', 'jor', 'kaz', 'prk', 'kor', 'kuw', 'kgz', 'lao', 'lbn', 'mas', 'mdv', 'mgl', 'mya', 'nep', 'oma', 'pak', 'ple', 'phi', 'qat', 'ksa', 'sin', 'sri', 'syr', 'tpe', 'tjk', 'tha', 'tkm', 'uae', 'uzb', 'vie', 'yem'],
    'europe': ['alb', 'and', 'arm', 'aut', 'aze', 'blr', 'bel', 'bih', 'bul', 'cro', 'cyp', 'cze', 'den', 'est', 'fin', 'fra', 'geo', 'ger', 'gbr', 'gre', 'hun', 'isl', 'irl', 'isr', 'ita', 'kos', 'lat', 'lie', 'ltu', 'lux', 'mkd', 'mlt', 'mda', 'mon', 'mne', 'ned', 'nor', 'pol', 'por', 'rou', 'rus', 'smr', 'srb', 'svk', 'slo', 'esp', 'swe', 'sui', 'tur', 'ukr', 'eun', 'saa', 'scg', 'gdr', 'urs', 'yug'],
    'north_america': ['ant', 'aru', 'bah', 'bar', 'ber', 'can', 'cay', 'crc', 'cub', 'dma', 'dom', 'esa', 'grn', 'gua', 'hai', 'hon', 'jam', 'mex', 'aho', 'pan', 'pur', 'skn', 'lca', 'vin', 'tto', 'usa', 'ivb', 'isv'],
    'south_america': ['arg', 'bol', 'bra', 'chi', 'col', 'ecu', 'guy', 'par', 'per', 'sur', 'uru', 'ven'],
    'oceania': ['aus', 'cok', 'fij', 'fsm', 'kir', 'mhl', 'nru', 'nzl', 'plw', 'png', 'sam', 'sol', 'tga', 'tuv', 'van']
  };
  
  const continentNames = {
    'africa': 'Africa', 'asia': 'Asia', 'europe': 'Europe',
    'north_america': 'North America', 'south_america': 'South America', 'oceania': 'Oceania'
  };
  
  const continentIcons = {
    'africa': '🌍', 'asia': '🌏', 'europe': '🇪🇺',
    'north_america': '🌎', 'south_america': '🌎', 'oceania': '🏝️'
  };
  
  // Get data source based on year selection
  let dataToUse = countries;
  if (selectedYear && yearData[selectedYear]) {
    dataToUse = Object.entries(yearData[selectedYear])
      .filter(([_, c]) => c && typeof c === 'object')
      .map(([noc, data]) => ({
        ...data,
        noc: noc
      }));
  }
  
  // Group medals by continent
  const continentMedals = Object.keys(continentMapping).map(continent => {
    const countriesInContinent = continentMapping[continent];
    let totalGold = 0, totalSilver = 0, totalBronze = 0;

    dataToUse.forEach(country => {
      if (country.noc && countriesInContinent.includes(country.noc.toLowerCase())) {
        totalGold += country.gold || 0;
        totalSilver += country.silver || 0;
        totalBronze += country.bronze || 0;
      }
    });

    return {
      continent,
      name: continentNames[continent],
      icon: continentIcons[continent],
      gold: totalGold,
      silver: totalSilver,
      bronze: totalBronze,
      total: totalGold + totalSilver + totalBronze,
    };
  }).sort((a, b) => b[medalType] - a[medalType]);
  
  // Color scale for continents
  const colorScale = scaleOrdinal()
    .domain(Object.keys(continentNames))
    .range([
      "#3b82f6", // blue - Europe
      "#ef4444", // red - Asia
      "#10b981", // green - Africa
      "#f59e0b", // amber - North America
      "#8b5cf6", // purple - South America
      "#ec4899"  // pink - Oceania
    ]);
  
  // Format large numbers
  const formatNumber = format(",");
  
  // Total medals
  const totalMedals = continentMedals.reduce((sum, c) => sum + c[medalType], 0);
  
  // Calculate percentages
  continentMedals.forEach(c => {
    c.percentage = (c[medalType] / totalMedals * 100).toFixed(1);
  });

  // Calculate bar dimensions
  const margin = { top: 20, right: 120, bottom: 10, left: 180 };
  const barHeight = 40;
  const barPadding = 10;
  const chartHeight = continentMedals.length * (barHeight + barPadding) + margin.top + margin.bottom;
  const chartWidth = dimensions.width - margin.left - margin.right;
  
  // Find max value for scale
  const maxValue = Math.max(...continentMedals.map(d => d[medalType]));
  
  // Handle bar hover
  const handleContinentHover = (continent) => {
    setHighlightedContinent(continent);
  };

  // Handle bar click for details
  const handleContinentClick = (continent) => {
    setFocusedContinent(continent === focusedContinent ? null : continent);
  };

  // Get focused continent data
  const focusedContinentData = focusedContinent 
    ? continentMedals.find(c => c.continent === focusedContinent)
    : null;

  // Get all time option handler
  const handleAllTimeClick = () => {
    setSelectedYear(null);
  };

  return (
    <section className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mt-6" ref={containerRef}>
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-white">
          Medal Distribution by Continent
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-white mr-1 text-sm">Medal:</label>
            <select
              value={medalType}
              onChange={e => setMedalType(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-1 py-1 text-sm"
            >
              <option value="total">Total</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Year Slider */}
      <div className="mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm">Olympic Year:</span>
          <span className="text-blue-400 font-bold">
            {selectedYear ? selectedYear : "All Time"}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAllTimeClick}
            className={`px-2 py-1 text-xs rounded ${!selectedYear ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            All Time
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={olympicYears.length - 1}
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            
            <div className="relative mt-1">
    {/* Generate more year labels at regular intervals */}
    {olympicYears.map((year, index) => {
      // Show approximately 7-8 labels across the slider
      if (index === 0 || index === olympicYears.length - 1 || index % Math.ceil(olympicYears.length / 7) === 0) {
        return (
          <div 
            key={year}
            className="absolute text-xs text-gray-400 transform -translate-x-1/2"
            style={{
              left: `${(index / (olympicYears.length - 1)) * 100}%`
            }}
          >
            {year}
          </div>
        );
      }
      return null;
    })}
  </div>
</div>
        </div>
        
        {/* Year ticks for context
        <div className="mt-4 relative h-6">
          <div className="absolute left-0 right-0 h-0.5 bg-gray-700"></div>
          {olympicYears.map((year, index) => {
            // Show every 4th year or so to avoid overcrowding
            if (index % 4 === 0 || index === olympicYears.length - 1) {
              return (
                <div
                  key={year}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `${(index / (olympicYears.length - 1)) * 100}%`,
                    top: '-4px'
                  }}
                >
                  <div className="w-0.5 h-3 bg-gray-500"></div>
                  <span className="text-xs text-gray-400 block mt-1">{year}</span>
                </div>
              );
            }
            return null;
          })}
          
          {/* Indicator for currently selected year */}
          {/* {selectedYear && (
            <div 
              className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-glow"
              style={{
                left: `${(sliderValue / (olympicYears.length - 1)) * 100}%`,
                top: '0px'
              }}
            ></div>
          )}
        // </div> */} */
      </div>
      
      {/* Horizontal Bar Chart */}
      <div className="bg-gray-900 p-3 rounded-lg">
        <svg 
          width="100%" 
          height={chartHeight} 
          viewBox={`0 0 ${dimensions.width} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Draw bars */}
            {continentMedals.map((d, i) => {
              const barWidth = (d[medalType] / maxValue) * chartWidth;
              const y = i * (barHeight + barPadding);
              const isHighlighted = d.continent === highlightedContinent;
              
              return (
                <g 
                  key={d.continent}
                  onMouseEnter={() => handleContinentHover(d.continent)}
                  onMouseLeave={() => handleContinentHover(null)}
                  onClick={() => handleContinentClick(d.continent)}
                  style={{ cursor: 'pointer' }}
                  className="transition-all duration-200"
                >
                  {/* Continent label */}
                  <text
                    x={-10}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill={isHighlighted ? "#fff" : "#ccc"}
                    fontSize={isHighlighted ? 15 : 14}
                    fontWeight={isHighlighted ? "bold" : "normal"}
                    className="transition-all duration-200"
                  >
                    {d.icon} {d.name}
                  </text>
                  
                  {/* Background bar */}
                  <rect
                    x={0}
                    y={y}
                    width={chartWidth}
                    height={barHeight}
                    fill="#222"
                    rx={4}
                  />
                  
                  {/* Value bar */}
                  <rect
                    x={0}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={colorScale(d.continent)}
                    opacity={isHighlighted ? 1 : 0.8}
                    rx={4}
                    className="transition-opacity duration-200"
                  />
                  
                  {/* Medal count */}
                  <text
                    x={barWidth + 10}
                    y={y + barHeight / 2}
                    alignmentBaseline="middle"
                    fill={isHighlighted ? "#fff" : "#ddd"}
                    fontSize={isHighlighted ? 15 : 14}
                    fontWeight="bold"
                    className="transition-all duration-200"
                  >
                    {formatNumber(d[medalType])}
                  </text>
                  
                  {/* Percentage */}
                  <text
                    x={barWidth + 80}
                    y={y + barHeight / 2}
                    alignmentBaseline="middle"
                    fill={isHighlighted ? colorScale(d.continent) : "#888"}
                    fontSize={14}
                  >
                    {d.percentage}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      
      {/* Detailed view when a continent is selected */}
      {focusedContinentData && (
        <div className="mt-4 bg-gray-850 rounded-md border border-gray-700 p-3 animate-fadeIn">
          <div className="flex items-center mb-3 pb-1 border-b border-gray-700">
            <span 
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: colorScale(focusedContinentData.continent) }}
            >
              {focusedContinentData.icon}
            </span>
            <h3 className="text-lg font-bold text-white ml-3">
              {focusedContinentData.name}
            </h3>
            <button 
              className="ml-auto text-gray-400 hover:text-white"
              onClick={() => setFocusedContinent(null)}
            >
              &times; Close
            </button>
          </div>
          
          <div className="flex flex-wrap justify-between mb-3 text-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm mb-1">
                {formatNumber(focusedContinentData.gold)}
              </div>
              <div className="text-yellow-400 text-xs">Gold</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold text-sm mb-1">
                {formatNumber(focusedContinentData.silver)}
              </div>
              <div className="text-gray-300 text-xs">Silver</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-black font-bold text-sm mb-1">
                {formatNumber(focusedContinentData.bronze)}
              </div>
              <div className="text-amber-700 text-xs">Bronze</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mb-1">
                {formatNumber(focusedContinentData.total)}
              </div>
              <div className="text-blue-400 text-xs">Total</div>
            </div>
          </div>
          
          {/* Medal distribution bar */}
          <div className="mt-2">
            <h4 className="text-white font-medium mb-1 text-xs">Medal Distribution</h4>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-yellow-500"
                style={{ 
                  width: `${(focusedContinentData.gold / focusedContinentData.total * 100).toFixed(1)}%`
                }}
              ></div>
              <div 
                className="h-full bg-gray-300"
                style={{ 
                  width: `${(focusedContinentData.silver / focusedContinentData.total * 100).toFixed(1)}%`
                }}
              ></div>
              <div 
                className="h-full bg-amber-700"
                style={{ 
                  width: `${(focusedContinentData.bronze / focusedContinentData.total * 100).toFixed(1)}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <div>Gold: {(focusedContinentData.gold / focusedContinentData.total * 100).toFixed(1)}%</div>
              <div>Silver: {(focusedContinentData.silver / focusedContinentData.total * 100).toFixed(1)}%</div>
              <div>Bronze: {(focusedContinentData.bronze / focusedContinentData.total * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-gray-400 text-xs mt-2 text-center">
        Click on a continent to see detailed statistics
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .shadow-glow {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
        }
        /* Custom range slider styling for better appearance */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </section>
  );
}
// --- Top Countries Table Visualization ---
// --- Enhanced Top Countries Table Visualization ---
function TopCountriesTable({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [topN, setTopN] = useState(10);
  const [sortBy, setSortBy] = useState('gold');
  const [sortDir, setSortDir] = useState('desc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [expandedCountry, setExpandedCountry] = useState(null);
  
  let dataToUse = countries;
  if (selectedYear && yearData[selectedYear]) {
    dataToUse = Object.entries(yearData[selectedYear])
      .filter(([_, c]) => c && typeof c === 'object')
      .map(([noc, data]) => ({
        ...data,
        noc: noc,
        id: noc || `unknown-${Math.random().toString(36).substr(2, 9)}`
      }));
  }
  
  const topCountries = [...dataToUse]
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'total') {
        comparison = (b.total || 0) - (a.total || 0);
      } else if (sortBy === 'silver') {
        comparison = (b.silver || 0) - (a.silver || 0);
        if (comparison === 0) comparison = (b.gold || 0) - (a.gold || 0);
        if (comparison === 0) comparison = (b.bronze || 0) - (a.bronze || 0);
      } else if (sortBy === 'bronze') {
        comparison = (b.bronze || 0) - (a.bronze || 0);
        if (comparison === 0) comparison = (b.gold || 0) - (a.gold || 0);
        if (comparison === 0) comparison = (b.silver || 0) - (a.silver || 0);
      } else { // default is gold
        comparison = (b.gold || 0) - (a.gold || 0);
        if (comparison === 0) comparison = (b.silver || 0) - (a.silver || 0);
        if (comparison === 0) comparison = (b.bronze || 0) - (a.bronze || 0);
      }
      
      return sortDir === 'desc' ? comparison : -comparison;
    })
    .slice(0, topN);
  
  // Calculate total medals for percentage
  const totalMedals = topCountries.reduce((sum, country) => sum + (country[sortBy] || 0), 0);
  
  // Handle sort toggle
  const handleSortToggle = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };
  
  // Calculate the maximum medal count for bar sizing
  const maxMedals = {
    gold: Math.max(...topCountries.map(c => c.gold || 0), 1),
    silver: Math.max(...topCountries.map(c => c.silver || 0), 1),
    bronze: Math.max(...topCountries.map(c => c.bronze || 0), 1),
    total: Math.max(...topCountries.map(c => c.total || 0), 1)
  };
  
  return (
    <section className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">🏆</span>
          Top {topN} Countries by Medal Count
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <label className="text-white text-sm mr-2">Year:</label>
            <select 
              value={selectedYear || ''}
              onChange={e => setSelectedYear(parseInt(e.target.value) || null)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value="">All Time</option>
              {olympicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="text-white text-sm mr-2">Show:</label>
            <select
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            >
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-2 md:p-3 overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs uppercase tracking-wider text-gray-400 font-semibold border-b border-gray-700">Rank</th>
              <th className="p-2 text-left text-xs uppercase tracking-wider text-gray-400 font-semibold border-b border-gray-700">Country</th>
              <th className="p-2 text-center cursor-pointer group" onClick={() => handleSortToggle('gold')}>
                <div className={`flex items-center justify-center space-x-1 ${sortBy === 'gold' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">G</span>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold">Gold</span>
                  {sortBy === 'gold' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortDir === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="p-2 text-center cursor-pointer group" onClick={() => handleSortToggle('silver')}>
                <div className={`flex items-center justify-center space-x-1 ${sortBy === 'silver' ? 'text-gray-300' : 'text-gray-400'}`}>
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">S</span>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold">Silver</span>
                  {sortBy === 'silver' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortDir === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="p-2 text-center cursor-pointer group" onClick={() => handleSortToggle('bronze')}>
                <div className={`flex items-center justify-center space-x-1 ${sortBy === 'bronze' ? 'text-amber-700' : 'text-gray-400'}`}>
                  <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">B</span>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold">Bronze</span>
                  {sortBy === 'bronze' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortDir === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="p-2 text-center cursor-pointer group" onClick={() => handleSortToggle('total')}>
                <div className={`flex items-center justify-center space-x-1 ${sortBy === 'total' ? 'text-blue-400' : 'text-gray-400'}`}>
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">T</span>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold">Total</span>
                  {sortBy === 'total' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortDir === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {topCountries.map((country, index) => {
              const isHovered = hoveredRow === country.id;
              const isExpanded = expandedCountry === country.id;
              const countryName = (country.name || country.region || 'Unknown Country');
              // In TopCountriesTable component, add this right before the return statement:

// Ensure the top country always has a valid name for the summary line
if (topCountries.length > 0 && (!topCountries[0].name || topCountries[0].name === 'Unknown')) {
  const matchingCountry = countries.find(c => 
    c.noc?.toLowerCase() === topCountries[0].noc?.toLowerCase() || 
    c.id?.toLowerCase() === topCountries[0].noc?.toLowerCase()
  );
  
  topCountries[0] = {
    ...topCountries[0],
    name: topCountries[0].name || 
          topCountries[0].region || 
          matchingCountry?.name || 
          `Country ${topCountries[0].noc?.toUpperCase() || ''}` 
  };
}
              return (
                <React.Fragment key={country.id || index}>
                  <tr 
                    className={`
                      ${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-900'}
                      ${isHovered ? 'bg-gray-700' : ''}
                      transition-colors cursor-pointer
                    `}
                    onMouseEnter={() => setHoveredRow(country.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => setExpandedCountry(isExpanded ? null : country.id)}
                  >
                    <td className="p-3 font-mono text-sm">
                      {index < 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full 
                          ${index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-300 text-black' : 
                            'bg-amber-700 text-black'}
                          font-bold`}
                        >
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-400 ml-2">{index + 1}</span>
                      )}
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center">
                        <span className={`font-medium ${isHovered ? 'text-white' : ''}`}>
                          {countryName}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`bg-yellow-500 h-full rounded-full transition-all duration-500 ${isHovered ? 'opacity-90' : 'opacity-70'}`}
                            style={{ width: `${Math.max((country.gold || 0) / maxMedals.gold * 100, 3)}%` }}
                          ></div>
                        </div>
                        <span className={`ml-3 font-mono font-bold ${sortBy === 'gold' ? 'text-yellow-400' : 'text-gray-300'} ${isHovered ? 'text-lg' : 'text-sm'} transition-all`}>
                          {country.gold || 0}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`bg-gray-300 h-full rounded-full transition-all duration-500 ${isHovered ? 'opacity-90' : 'opacity-70'}`}
                            style={{ width: `${Math.max((country.silver || 0) / maxMedals.silver * 100, 3)}%` }}
                          ></div>
                        </div>
                        <span className={`ml-3 font-mono font-bold ${sortBy === 'silver' ? 'text-gray-300' : 'text-gray-300'} ${isHovered ? 'text-lg' : 'text-sm'} transition-all`}>
                          {country.silver || 0}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`bg-amber-700 h-full rounded-full transition-all duration-500 ${isHovered ? 'opacity-90' : 'opacity-70'}`}
                            style={{ width: `${Math.max((country.bronze || 0) / maxMedals.bronze * 100, 3)}%` }}
                          ></div>
                        </div>
                        <span className={`ml-3 font-mono font-bold ${sortBy === 'bronze' ? 'text-amber-700' : 'text-gray-300'} ${isHovered ? 'text-lg' : 'text-sm'} transition-all`}>
                          {country.bronze || 0}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`bg-blue-500 h-full rounded-full transition-all duration-500 ${isHovered ? 'opacity-90' : 'opacity-70'}`}
                            style={{ width: `${Math.max((country.total || 0) / maxMedals.total * 100, 3)}%` }}
                          ></div>
                        </div>
                        <span className={`ml-3 font-mono font-bold ${sortBy === 'total' ? 'text-blue-400' : 'text-gray-300'} ${isHovered ? 'text-lg' : 'text-sm'} transition-all`}>
                          {country.total || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-gray-700/30 animate-fadeIn">
                      <td colSpan={5} className="p-4">
                        <div className="flex flex-col gap-3">
                          <h4 className="font-medium text-white">{countryName} - Medal Details</h4>
                          
                          <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xl mb-1">
                                {country.gold || 0}
                              </div>
                              <div className="text-yellow-400 text-sm">Gold</div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold text-xl mb-1">
                                {country.silver || 0}
                              </div>
                              <div className="text-gray-300 text-sm">Silver</div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-black font-bold text-xl mb-1">
                                {country.bronze || 0}
                              </div>
                              <div className="text-amber-700 text-sm">Bronze</div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mb-1">
                                {country.total || 0}
                              </div>
                              <div className="text-blue-400 text-sm">Total</div>
                            </div>
                            
                            <div className="flex flex-col justify-center ml-4">
                              <div className="text-sm text-gray-300">
                                <div className="mb-1">
                                  <span className="inline-block w-3 h-3 bg-yellow-500 mr-2 rounded-sm"></span>
                                  Gold: {((country.gold || 0) / (country.total || 1) * 100).toFixed(1)}%
                                </div>
                                <div className="mb-1">
                                  <span className="inline-block w-3 h-3 bg-gray-300 mr-2 rounded-sm"></span>
                                  Silver: {((country.silver || 0) / (country.total || 1) * 100).toFixed(1)}%
                                </div>
                                <div>
                                  <span className="inline-block w-3 h-3 bg-amber-700 mr-2 rounded-sm"></span>
                                  Bronze: {((country.bronze || 0) / (country.total || 1) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Medal distribution bar */}
                          <div className="mt-2">
                            <div className="text-sm text-gray-400 mb-1">Medal Distribution</div>
                            <div className="flex h-6 rounded-md overflow-hidden w-full">
                              <div 
                                className="bg-yellow-500 h-full transition-all duration-300"
                                style={{ width: `${(country.gold || 0) / (country.total || 1) * 100}%` }}
                              ></div>
                              <div 
                                className="bg-gray-300 h-full transition-all duration-300"
                                style={{ width: `${(country.silver || 0) / (country.total || 1) * 100}%` }}
                              ></div>
                              <div 
                                className="bg-amber-700 h-full transition-all duration-300"
                                style={{ width: `${(country.bronze || 0) / (country.total || 1) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {topCountries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg font-medium">No medal data available</span>
                    <p className="text-sm mt-2">Try selecting a different year or dataset</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary statistics */}
      {topCountries.length > 0 && (
        <div className="mt-4 p-3 bg-gray-900 rounded-lg text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">{topCountries[0]?.name || 'Unknown'}</span> leads with 
            <span className="font-bold text-blue-400"> {topCountries[0]?.[sortBy] || 0}</span> {sortBy} medals
            {selectedYear ? ` in the ${selectedYear} Olympics` : ''}, representing 
            <span className="font-bold text-blue-400"> {((topCountries[0]?.[sortBy] || 0) / totalMedals * 100).toFixed(1)}%</span> of the total among top {topN} countries.
          </p>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; max-height: 0; }
          100% { opacity: 1; max-height: 500px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
}

// --- Country Rank Tracker Visualization ---
function CountryRankTracker({ countries, yearData, olympicYears }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [medalType, setMedalType] = useState("total");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredYear, setHoveredYear] = useState(null);
  const chartRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({
    width: 900,
    height: 500
  });
  
  // Get container width for responsive design
  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.clientWidth;
        setDimensions({
          width: containerWidth - 40,
          height: 500
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Define margins and chart area dimensions
  const margin = { top: 50, right: 80, bottom: 80, left: 80 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;
  
  // Filter countries by search term
  const filteredCountries = countries
    .filter(c => c?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b?.total || 0) - (a?.total || 0));
  
  // Calculate ranks for each Olympic year
  const countryRanks = useMemo(() => {
    if (!selectedCountry) return [];
    
    return olympicYears.map(year => {
      const yearMedals = yearData[year];
      if (!yearMedals) return { year, rank: null, medals: 0 };
      
      // Convert year data to array and sort by medal count
      const yearCountries = Object.entries(yearMedals)
        .filter(([_, data]) => data && typeof data === 'object')
        .map(([noc, data]) => ({
          noc,
          medalCount: data[medalType] || 0
        }))
        .sort((a, b) => b.medalCount - a.medalCount);
      
      // Find selected country's rank
      const countryNoc = selectedCountry.noc.toLowerCase();
      const rank = yearCountries.findIndex(c => 
        c.noc.toLowerCase() === countryNoc
      ) + 1;
      
      // Get medal data for selected country
      const countryData = yearMedals[countryNoc] || {};
      
      return {
        year,
        rank: rank > 0 ? rank : null,
        gold: countryData.gold || 0,
        silver: countryData.silver || 0,
        bronze: countryData.bronze || 0,
        total: countryData.total || 0,
        medalCount: countryData[medalType] || 0
      };
    });
  }, [selectedCountry, yearData, olympicYears, medalType]);
  
  // Find best and worst rank for Y-axis scaling
  const validRanks = countryRanks.filter(d => d.rank !== null).map(d => d.rank);
  const maxRank = Math.max(...validRanks, 10);
  const minRank = Math.min(...validRanks, 1);
  const paddedMaxRank = Math.ceil(maxRank * 1.2); // Add 20% padding
  
  // Define scales
  const xScale = scalePoint()
    .domain(olympicYears)
    .range([0, innerWidth])
    .padding(0.5);
  
  const yScale = scaleLinear()
    .domain([paddedMaxRank, 0.5]) // Reversed axis (1 at top)
    .range([innerHeight, 0])
    .nice();
  
  // Medal colors for various UI elements
  const medalColors = {
    total: "#3b82f6",
    gold: "#fbbf24",
    silver: "#d1d5db",
    bronze: "#92400e"
  };
  
  // Handle medal type change
  const handleMedalTypeChange = (type) => {
    setMedalType(type);
  };
  
  // Country selection handler
  const selectCountry = (country) => {
    setSelectedCountry(country);
    setSearchTerm("");
  };
  
  // Generate the path for the rank line
  const generateRankPath = () => {
    if (!countryRanks.length) return "";
    
    const validPoints = countryRanks.filter(d => d.rank !== null);
    if (validPoints.length < 2) return "";
    
    return validPoints.map((d, i) => {
      const x = xScale(d.year);
      const y = yScale(d.rank);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };
  
  // Format rank with suffix (1st, 2nd, 3rd, etc.)
  const formatRank = (rank) => {
    if (!rank) return "N/A";
    
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix = rank % 100 >= 11 && rank % 100 <= 13 ? 
      suffixes[0] : 
      suffixes[Math.min(rank % 10, 3)];
    
    return `${rank}${suffix}`;
  };

  return (
    <section className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">📈</span>
          Country Ranking Tracker
          {selectedCountry && <span className="text-blue-400 ml-2">({selectedCountry.name})</span>}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Country selector with search */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search for a country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white w-full border border-gray-600 rounded px-3 py-2 text-sm hover:border-blue-400 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            />
            
            {searchTerm && (
              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-gray-700 rounded shadow-lg border border-gray-600 z-50">
                {filteredCountries.length === 0 ? (
                  <div className="p-2 text-gray-400 text-sm">No countries found</div>
                ) : (
                  filteredCountries.slice(0, 10).map(country => (
                    <div
                      key={country.noc}
                      className="p-2 hover:bg-gray-600 cursor-pointer text-white text-sm flex items-center"
                      onClick={() => selectCountry(country)}
                    >
                      <span className="font-medium">{country.name}</span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {country.total} medals
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Medal type selector */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => handleMedalTypeChange("total")}
              className={`px-2 py-1 rounded text-sm ${medalType === "total" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"}`}
            >
              Total
            </button>
            <button 
              onClick={() => handleMedalTypeChange("gold")}
              className={`px-2 py-1 rounded text-sm ${medalType === "gold" ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-300"}`}
            >
              Gold
            </button>
            <button 
              onClick={() => handleMedalTypeChange("silver")}
              className={`px-2 py-1 rounded text-sm ${medalType === "silver" ? "bg-gray-300 text-black" : "bg-gray-700 text-gray-300"}`}
            >
              Silver
            </button>
            <button 
              onClick={() => handleMedalTypeChange("bronze")}
              className={`px-2 py-1 rounded text-sm ${medalType === "bronze" ? "bg-amber-700 text-white" : "bg-gray-700 text-gray-300"}`}
            >
              Bronze
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-4 rounded-lg" ref={chartRef}>
        {!selectedCountry ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300">Select a country to track its Olympic ranking</h3>
            <p className="text-gray-400 mt-2">Search for a country using the search box above</p>
          </div>
        ) : countryRanks.filter(d => d.rank !== null).length < 2 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300">Not enough ranking data available</h3>
            <p className="text-gray-400 mt-2">This country has competed in fewer than 2 Olympic Games or has no medal data</p>
            <button 
              onClick={() => setSelectedCountry(null)} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Select a different country
            </button>
          </div>
        ) : (
          <svg
            width="100%"
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradient for the line */}
              <linearGradient id="rankLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={medalColors[medalType]} stopOpacity={0.7} />
                <stop offset="100%" stopColor={medalColors[medalType]} stopOpacity={1} />
              </linearGradient>
              
              {/* Filter for hover glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Y-axis grid lines */}
              {yScale.ticks(10).map(tick => (
                <g key={`grid-${tick}`}>
                  <line 
                    x1={0} 
                    y1={yScale(tick)} 
                    x2={innerWidth} 
                    y2={yScale(tick)}
                    stroke="#333"
                    strokeWidth={1}
                    strokeDasharray={tick === 0 ? "" : "5,5"}
                  />
                  <text
                    x={-10}
                    y={yScale(tick)}
                    dy=".32em"
                    textAnchor="end"
                    fill="#aaa"
                    fontSize={12}
                  >
                    {tick === 0 ? "" : formatRank(tick)}
                  </text>
                </g>
              ))}
              
              {/* X-axis (Olympic years) */}
              {olympicYears.map(year => (
                <g key={`year-${year}`} transform={`translate(${xScale(year)}, ${innerHeight})`}>
                  <line 
                    y1={0} 
                    y2={5} 
                    stroke="#666"
                    strokeWidth={1}
                  />
                  <text
                    y={15}
                    textAnchor="middle"
                    fill="#bbb"
                    fontSize={10}
                    transform="rotate(-45) translate(-20, 0)"
                  >
                    {year}
                  </text>
                </g>
              ))}
              
              {/* Rank line */}
              <path
                d={generateRankPath()}
                stroke={`url(#rankLineGradient)`}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points with medal counts */}
              {countryRanks.filter(d => d.rank !== null).map(d => (
                <g 
                  key={d.year}
                  transform={`translate(${xScale(d.year)}, ${yScale(d.rank)})`}
                  onMouseEnter={() => setHoveredYear(d.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
                  <circle
                    r={hoveredYear === d.year ? 8 : 6}
                    fill={medalColors[medalType]}
                    stroke="#fff"
                    strokeWidth={2}
                    filter={hoveredYear === d.year ? "url(#glow)" : ""}
                    className="cursor-pointer transition-all duration-200"
                  />
                  {hoveredYear === d.year && (
                    <g>
                      <rect
                        x={-75}
                        y={-80}
                        width={150}
                        height={65}
                        rx={5}
                        fill="#222"
                        stroke="#444"
                      />
                      <text
                        y={-65}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                        fontWeight="bold"
                      >
                        {d.year} Olympics
                      </text>
                      <text
                        y={-45}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                      >
                        Rank: {formatRank(d.rank)}
                      </text>
                      <text
                        y={-25}
                        textAnchor="middle"
                        fill={medalColors[medalType]}
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {d.medalCount} {medalType} medal{d.medalCount !== 1 ? 's' : ''}
                      </text>
                    </g>
                  )}
                </g>
              ))}
              
              {/* Axis labels */}
              <text
                transform={`translate(${innerWidth / 2}, ${innerHeight + 60})`}
                textAnchor="middle"
                fill="#fff"
                fontSize={14}
                fontWeight="bold"
              >
                Olympic Year
              </text>
              
              <text
                transform={`translate(-60, ${innerHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fill="#fff"
                fontSize={14}
                fontWeight="bold"
              >
                Ranking
              </text>
              
              {/* Chart title */}
              <text
                transform={`translate(${innerWidth / 2}, -20)`}
                textAnchor="middle"
                fill="#fff"
                fontSize={18}
                fontWeight="bold"
              >
                {selectedCountry.name}'s Olympic Rankings Based on {medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals
              </text>
            </g>
          </svg>
        )}
      </div>
      
      {/* Medal summary for selected country */}
      {selectedCountry && (
        <div className="mt-4 bg-gray-900 p-4 rounded-lg">
          <h3 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">
            {selectedCountry.name} - Olympic Medal History
          </h3>
          
          <div className="flex flex-wrap gap-3 justify-around">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xl mb-1">
                {selectedCountry.gold || 0}
              </div>
              <div className="text-yellow-400 text-sm">Gold</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold text-xl mb-1">
                {selectedCountry.silver || 0}
              </div>
              <div className="text-gray-300 text-sm">Silver</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-black font-bold text-xl mb-1">
                {selectedCountry.bronze || 0}
              </div>
              <div className="text-amber-700 text-sm">Bronze</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mb-1">
                {selectedCountry.total || 0}
              </div>
              <div className="text-blue-400 text-sm">Total</div>
            </div>
          </div>
          
          {/* Stats table - best/worst performance */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 text-left text-gray-300">Statistic</th>
                  <th className="py-2 text-left text-gray-300">Year</th>
                  <th className="py-2 text-left text-gray-300">Rank</th>
                  <th className="py-2 text-left text-gray-300">Medals</th>
                </tr>
              </thead>
              <tbody>
                {/* Best Rank */}
                {countryRanks.filter(d => d.rank !== null).length > 0 && (
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">Best Ranking</td>
                    <td className="py-2 text-blue-400">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current.rank < best.rank ? current : best
                        ).year}
                    </td>
                    <td className="py-2 text-green-400">
                      {formatRank(countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current.rank < best.rank ? current : best
                        ).rank)}
                    </td>
                    <td className="py-2 text-white">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current.rank < best.rank ? current : best
                        )[medalType]}
                    </td>
                  </tr>
                )}
                
                {/* Most medals */}
                {countryRanks.filter(d => d.rank !== null).length > 0 && (
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">Most {medalType} medals</td>
                    <td className="py-2 text-blue-400">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current[medalType] > best[medalType] ? current : best
                        ).year}
                    </td>
                    <td className="py-2 text-white">
                      {formatRank(countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current[medalType] > best[medalType] ? current : best
                        ).rank)}
                    </td>
                    <td className="py-2 text-yellow-400 font-bold">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((best, current) => 
                          current[medalType] > best[medalType] ? current : best
                        )[medalType]}
                    </td>
                  </tr>
                )}
                
                {/* Most recent */}
                {countryRanks.filter(d => d.rank !== null).length > 0 && (
                  <tr>
                    <td className="py-2 text-white">Most recent</td>
                    <td className="py-2 text-blue-400">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((latest, current) => 
                          current.year > latest.year ? current : latest
                        ).year}
                    </td>
                    <td className="py-2 text-white">
                      {formatRank(countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((latest, current) => 
                          current.year > latest.year ? current : latest
                        ).rank)}
                    </td>
                    <td className="py-2 text-white">
                      {countryRanks
                        .filter(d => d.rank !== null)
                        .reduce((latest, current) => 
                          current.year > latest.year ? current : latest
                        )[medalType]}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2">
        <p>Select a country to see how its Olympic ranking has changed over time. Hover over data points for details.</p>
      </div>
    </section>
  );
}


export default function MedalDashboard() {
  const [mapZoom, setMapZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [medalData, setMedalData] = useState({});
  const [countries, setCountries] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedMedalType, setSelectedMedalType] = useState('total');
  const [selectedYear, setSelectedYear] = useState(null); // Add this line
  
  const [mapSelectedYear, setMapSelectedYear] = useState(null);
  const [regionDetailsSelectedYear, setRegionDetailsSelectedYear] = useState(null);
  const [trendChartSelectedYear, setTrendChartSelectedYear] = useState(null);
  const [topCountriesSelectedYear, setTopCountriesSelectedYear] = useState(null);
  const [multiTrendSelectedYear, setMultiTrendSelectedYear] = useState(null);
  const [barChartSelectedYear, setBarChartSelectedYear] = useState(null);
  const [pieChartSelectedYear, setPieChartSelectedYear] = useState(null);
  
  const [yearData, setYearData] = useState({});
  const [activeTab, setActiveTab] = useState('map');

  // Medal color palettes for heatmap - updated to match the image scale
  const colorDomain = [0, 5, 10, 25, 50, 100, 500, 1000, 2500];
  const medalColorScales = {
    gold: scaleLinear()
      .domain(colorDomain)
      .range([
        "#1a1a1a",   // Almost black for 0 medals
        "#5c4d1a",   // Dark gold
        "#7a671e",   // Medium-dark gold
        "#9a832c",   // Medium gold
        "#b89d35",   // Medium-bright gold
        "#d6b83e",   // Bright gold
        "#f4d247",   // Very bright gold
        "#ffeb57",   // Vibrant gold
        "#ffff8f"    // Super bright gold
      ]),
    silver: scaleLinear()
      .domain(colorDomain)
      .range([
        "#1a1a1a",   // Almost black for 0 medals
        "#343434",   // Very dark gray
        "#4e4e4e",   // Dark gray
        "#6e6e6e",   // Medium gray
        "#8e8e8e",   // Medium-light gray
        "#aeaeae",   // Light gray
        "#cfcfcf",   // Very light gray
        "#efefef",   // Almost white
        "#ffffff"    // White
      ]),
    bronze: scaleLinear()
      .domain(colorDomain)
      .range([
        "#1a1a1a",   // Almost black for 0 medals
        "#3d2314",   // Very dark bronze
        "#5e321b",   // Dark bronze
        "#7d4325",   // Medium-dark bronze
        "#9c572f",   // Medium bronze
        "#b8683a",   // Medium-bright bronze
        "#d47c45",   // Bright bronze
        "#e89156",   // Very bright bronze
        "#ffa66b"    // Vibrant bronze
      ]),
    total: scaleLinear()
      .domain(colorDomain)
      .range([
        "#1a1a1a",   // Almost black for 0 medals
        "#1e3a5f",   // Very dark blue
        "#2b578a",   // Dark blue
        "#3874b5",   // Medium blue
        "#4293e6",   // Bright blue
        "#5fb0f9",   // Very bright blue
        "#7dd3ff",   // Light blue
        "#a2e1d2",   // Teal
        "#c6ff9e"    // Bright green-yellow
      ])
  };

  // Pick color scale based on selectedMedalType
  const colorScale = medalColorScales[selectedMedalType];

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch athlete events data
        const athleteResponse = await fetch('/data/cleaned_athlete_events.csv');
        const athleteCsvText = await athleteResponse.text();
        const athleteParseResult = Papa.parse(athleteCsvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        const athleteData = athleteParseResult.data.filter(row => row.NOC && row.Year && row.Medal);

        // Fetch NOC regions data
        const nocResponse = await fetch('./data/noc_regions.csv');
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

        // Process the data to get medal counts
        const medalCounts = {};
        
        // Initialize medal counts for all years
        olympicYears.forEach(year => {
          medalCounts[year] = {};
        });

        // Count medals by country and year
        athleteData.forEach(athlete => {
          if (!olympicYears.includes(athlete.Year)) return;
          
          const noc = athlete.NOC.toLowerCase();
          const year = athlete.Year;
          const medal = athlete.Medal.toLowerCase();
          
          if (!medalCounts[year][noc]) {
            medalCounts[year][noc] = {
              gold: 0,
              silver: 0,
              bronze: 0,
              total: 0,
              region: regionMap[athlete.NOC] || athlete.NOC
            };
          }
          
          if (medal === 'gold') {
            medalCounts[year][noc].gold += 1;
            medalCounts[year][noc].total += 1;
          } else if (medal === 'silver') {
            medalCounts[year][noc].silver += 1;
            medalCounts[year][noc].total += 1;
          } else if (medal === 'bronze') {
            medalCounts[year][noc].bronze += 1;
            medalCounts[year][noc].total += 1;
          }
        });

        // Create country medal data for all years combined
        const combinedMedalCounts = {};
        Object.values(medalCounts).forEach(yearData => {
          Object.entries(yearData).forEach(([noc, counts]) => {
            if (!combinedMedalCounts[noc]) {
              combinedMedalCounts[noc] = {
                ...counts,
                gold: 0,
                silver: 0,
                bronze: 0,
                total: 0
              };
            }
            combinedMedalCounts[noc].gold += counts.gold;
            combinedMedalCounts[noc].silver += counts.silver;
            combinedMedalCounts[noc].bronze += counts.bronze;
            combinedMedalCounts[noc].total += counts.total;
          });
        });

        // Format the data for your components
        const countryMedalData = Object.entries(combinedMedalCounts).map(([noc, counts]) => ({
          noc,
          id: noc.toLowerCase(),
          name: counts.region,
          gold: counts.gold,
          silver: counts.silver,
          bronze: counts.bronze,
          total: counts.total
        }));

        setCountries(countryMedalData);
        setMedalData(combinedMedalCounts);
        setYearData(medalCounts);

        const lastOlympicYear = olympicYears[olympicYears.length - 1];
        setSelectedYear(lastOlympicYear);
        setMapSelectedYear(lastOlympicYear);
        setBarChartSelectedYear(lastOlympicYear);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      {/* // In MedalDashboard's return */}
      <div className="w-full max-w-[1800px] mx-auto space-y-8 py-6">  
        <div className="flex justify-between items-center">
          <Link href="/" className="text-blue-500 hover:text-blue-400">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white text-center">
            Olympic Medal Dashboard
          </h1>
          <div className="w-24"></div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700 mb-4 flex-wrap">
          <button 
            className={`px-4 py-2 focus:outline-none ${activeTab === 'map' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('map')}
          >
            Map View
          </button>
          <button 
            className={`px-4 py-2 focus:outline-none ${activeTab === 'trends' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('trends')}
          >
            Medal Trends
          </button>
          <button 
            className={`px-4 py-2 focus:outline-none ${activeTab === 'bars' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('bars')}
          >
            Country Rankings
          </button>
          <button 
            className={`px-4 py-2 focus:outline-none ${activeTab === 'continent' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('continent')}
          >
            Continent Analysis
          </button>
          <button 
  className={`px-4 py-2 focus:outline-none ${activeTab === 'data' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
  onClick={() => setActiveTab('data')}
>
  Data Tables
</button>
<button 
  className={`px-4 py-2 focus:outline-none ${activeTab === 'ranks' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
  onClick={() => setActiveTab('ranks')}
>
  Time vs Rank
</button>
        </div>
        
        {/* Content based on active tab */}
        {activeTab === 'map' && (
          <>
            <RegionMapVisualization
              countries={countries}
              medalData={medalData}
              yearData={yearData}
              selectedYear={mapSelectedYear}
              setSelectedYear={setMapSelectedYear}
              selectedMedalType={selectedMedalType}
              setSelectedMedalType={setSelectedMedalType}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
              setSelectedRegion={setSelectedRegion}
              colorScale={colorScale}
              colorDomain={colorDomain}
            />
            
            {/* Add a legend to explain countries with no data */}
            <div className="text-xs text-gray-400 mt-2">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-800 mr-1"></span> No medal data available
            </div>
            
            <SelectedRegionDetails
              selectedRegion={selectedRegion}
              olympicYears={olympicYears}
              selectedYear={regionDetailsSelectedYear}
              setSelectedYear={setRegionDetailsSelectedYear}
            />
            
            <MedalTrendChart
              yearData={yearData}
              olympicYears={olympicYears}
              selectedCountry={selectedRegion}
              selectedYear={trendChartSelectedYear}
              setSelectedYear={setTrendChartSelectedYear}
            />
          </>
        )}
        
        {activeTab === 'trends' && (
          <MultiCountryTrendChart
            yearData={yearData}
            olympicYears={olympicYears}
            countries={countries}
            selectedYear={multiTrendSelectedYear}
            setSelectedYear={setMultiTrendSelectedYear}
          />
        )}
        
        {activeTab === 'bars' && (
          <TopMedalCountriesBarChart
            countries={countries}
            selectedYear={barChartSelectedYear}
            yearData={yearData}
            olympicYears={olympicYears}
            setSelectedYear={setBarChartSelectedYear}
          />
        )}
        
        {activeTab === 'continent' && (
          <ContinentDistributionChart
            countries={countries}
            selectedYear={pieChartSelectedYear}
            yearData={yearData}
            olympicYears={olympicYears}
            setSelectedYear={setPieChartSelectedYear}
          />
        )}
        
        {activeTab === 'data' && (
          <TopCountriesTable
            countries={countries}
            selectedYear={topCountriesSelectedYear}
            yearData={yearData}
            olympicYears={olympicYears}
            setSelectedYear={setTopCountriesSelectedYear}
          />
        )}
            {activeTab === 'ranks' && (
      <CountryRankTracker
        countries={countries}
        yearData={yearData}
        olympicYears={olympicYears}
      />
    )}
        
        {/* <section className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">About This Visualization</h2>
          <p className="text-gray-700 mb-2">
            Explore Olympic medal data through multiple interactive visualizations. Use the tabs above to switch between different views.
          </p>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li><span className="font-bold">Map View:</span> Geographic distribution of medals with heat map options</li>
            <li><span className="font-bold">Medal Trends:</span> Compare multiple countries' performance over time with zoom capabilities</li>
            <li><span className="font-bold">Country Rankings:</span> Bar chart visualization of top medal-winning countries</li>
            <li><span className="font-bold">Continent Analysis:</span> See how medals are distributed across continents</li>
            <li><span className="font-bold">Data Tables:</span> Detailed tabular data for medal counts</li>
          </ul>
        </section> */}
      </div>
    </main>
  );
}