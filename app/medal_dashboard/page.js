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
import { scaleLinear, scaleOrdinal } from "d3-scale";
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
    <div className="my-2">
      <div className="relative">
        <svg width={width} height={height}>
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
        <div className="flex w-full absolute top-full left-0">
          {domain.map((d, i) => {
            const position = `${(i / (domain.length - 1)) * 100}%`;
            const offsetX = i === 0 ? 0 : i === domain.length - 1 ? -20 : -10;
            return (
              <div 
                key={i} 
                className="absolute text-xs text-gray-300"
                style={{
                  left: position,
                  transform: `translateX(${offsetX}px)`,
                  whiteSpace: 'nowrap'
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6" /> {/* Spacer for the labels */}
      <span className="text-xs text-gray-400 mt-6">
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
  const [tooltipPosition, setTooltipPosition] = useState(null); // Change to null instead of {x:0, y:0}
  const [showTooltip, setShowTooltip] = useState(false);

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

  const handleMouseEnter = (event, geo) => {
    console.debug("Mouse enter:", geo.properties?.name);
    const content = getTooltipContent(geo);
    
    // Use a standard class name instead of Tailwind's utility class with brackets
    const mapContainer = event.currentTarget.closest('.map-container');
    const rect = mapContainer.getBoundingClientRect();
    const x = event.clientX - rect.left + 10;
    const y = event.clientY - rect.top + 10;
    
    // Set both the tooltip content and position
    setTooltipContent(content);
    setTooltipPosition({ x, y });
    setShowTooltip(true);
    
    console.debug("Tooltip position set to:", x, y);
  };

  const handleMouseMove = (event) => {
    if (showTooltip) {
      // Use the same standard class name here
      const mapContainer = event.currentTarget.closest('.map-container');
      const rect = mapContainer.getBoundingClientRect();
      const x = event.clientX - rect.left + 10;
      const y = event.clientY - rect.top + 10;
      setTooltipPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    console.debug("Mouse leave");
    setShowTooltip(false);
  };

  return (
    <section className="bg-gray-900 p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Region-Wise Medal Count</h2>
      <div className="flex flex-wrap justify-between items-center mb-4">
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
        <div className="flex items-center space-x-2 my-2">
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
      <div className="flex flex-col items-start mb-4 bg-gray-800 p-2 rounded">
        <div className="flex flex-wrap mb-2">
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
        <HeatMapLegend colorScale={colorScale} domain={colorDomain} selectedMedalType={selectedMedalType} />
      </div>
      <div className="h-[500px] map-container relative" id="map-container" onMouseMove={handleMouseMove}>
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
        {showTooltip && tooltipPosition && (
          <div
            className="absolute z-50 bg-gray-800 text-white p-3 rounded-md shadow-lg border border-gray-700 animate-fadeIn"
            style={{
              left: tooltipPosition.x + 'px',
              top: tooltipPosition.y + 'px',
              minWidth: '180px',
              pointerEvents: 'none'
            }}
          >
            <div className="font-bold mb-2 text-center border-b border-gray-600 pb-1">
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

// --- Top Medal-Winning Countries Bar Chart ---
function TopMedalCountriesBarChart({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [medalType, setMedalType] = useState('total');
  const [topCount, setTopCount] = useState(10);
  const [sortBy, setSortBy] = useState('desc');
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  
  // Create refs for container measurement
  const chartContainerRef = useRef(null);
  
  // Update dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth;
        setDimensions({
          width: containerWidth - 40, // Account for padding
          height: Math.min(500, window.innerHeight * 0.6) // Responsive height
        });
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const margin = { top: 30, right: 30, bottom: 70, left: 100 };
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;
  
  // Get data source based on year selection
  let dataToUse = countries;
  if (selectedYear && yearData[selectedYear]) {
    dataToUse = Object.values(yearData[selectedYear])
      .filter(c => c && typeof c === 'object');
  }
  
  // Sort and filter top countries
  const topCountries = [...dataToUse]
    .sort((a, b) => {
      const valA = a?.[medalType] || 0;
      const valB = b?.[medalType] || 0;
      return sortBy === 'desc' ? valB - valA : valA - valB;
    })
    .slice(0, topCount);
  
  // Calculate scales
  const xScale = scaleLinear()
    .domain([0, Math.max(...topCountries.map(c => c[medalType] || 0), 1)])
    .range([0, innerWidth]);
  
  const barHeight = innerHeight / topCountries.length * 0.7;
  
  // Color mapping for medal types
  const medalColors = {
    gold: "#fbbf24",
    silver: "#d1d5db", 
    bronze: "#92400e",
    total: "#3b82f6"
  };
  
  return (
    <section className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-md mt-8 w-full max-w-full mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-white">
          Top Medal-Winning Countries
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-white mr-2">Year:</label>
            <select 
              value={selectedYear || ''}
              onChange={e => setSelectedYear(parseInt(e.target.value) || null)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value="">All Time</option>
              {olympicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2">Medal:</label>
            <select
              value={medalType}
              onChange={e => setMedalType(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value="total">Total</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2">Show:</label>
            <select
              value={topCount}
              onChange={e => setTopCount(Number(e.target.value))}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2">Sort:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-2 md:p-4 rounded overflow-x-auto" ref={chartContainerRef}>
        <svg 
          width="100%" 
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMinYMin meet"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* X Axis */}
            {xScale.ticks(5).map(tick => (
              <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                <line
                  y1={0}
                  y2={innerHeight}
                  stroke="#444"
                  strokeWidth={0.5}
                />
                <text
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fill="#aaa"
                  fontSize={12}
                >
                  {tick}
                </text>
              </g>
            ))}
            
            {/* Y Axis (Countries) */}
            {topCountries.map((country, i) => (
              <g key={country.noc || i} transform={`translate(0,${i * (innerHeight / topCountries.length)})`}>
                <text
                  x={-10}
                  y={barHeight / 2 + 5}
                  textAnchor="end"
                  fill="#fff"
                  fontSize={10}
                >
                  {(country.name || country.region) && (country.name || country.region).trim() !== '' 
                    ? ((country.name || country.region).length > 15 
                        ? `${(country.name || country.region).substring(0, 15)}...` 
                        : (country.name || country.region)) 
                    : 'No Data'}
                </text>
              </g>
            ))}
            
            {/* Bars */}
            {topCountries.map((country, i) => (
              <g 
                key={country.noc || i} 
                transform={`translate(0,${i * (innerHeight / topCountries.length)})`}
              >
                <rect
                  y={barHeight * 0.15}
                  width={xScale(country[medalType] || 0)}
                  height={barHeight}
                  fill={medalColors[medalType]}
                  opacity={0.8}
                >
                  <title>{country.name}: {country[medalType] || 0} {medalType === 'total' ? 'total medals' : `${medalType} medals`}</title>
                </rect>
                <text
                  x={xScale(country[medalType] || 0) + 5}
                  y={barHeight / 2 + 5}
                  fill="#fff"
                  fontSize={12}
                >
                  {country[medalType] || 0}
                </text>
              </g>
            ))}
            
            {/* X Axis Title */}
            <text
              transform={`translate(${innerWidth / 2}, ${innerHeight + 45})`}
              textAnchor="middle"
              fill="#fff"
              fontSize={16}
            >
              {medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals
            </text>
            
            {/* Y Axis Title */}
            <text
              transform={`translate(-60, ${innerHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fill="#fff"
              fontSize={16}
            >
              Countries
            </text>
          </g>
        </svg>
      </div>
    </section>
  );
}
// --- Medal Distribution by Continent Pie Chart ---
// --- Medal Distribution by Continent Pie Chart (Enhanced) ---
function ContinentDistributionChart({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [medalType, setMedalType] = useState('total');
  const [highlightedContinent, setHighlightedContinent] = useState(null);
  const [focusedContinent, setFocusedContinent] = useState(null);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'donut'
  const [showDetails, setShowDetails] = useState(false);
  
  const width = 600; // Increased width
  const height = 500; // Increased height
  const outerRadius = Math.min(width, height) / 2 - 40;
  const innerRadius = chartType === 'donut' ? outerRadius * 0.5 : 0; // For donut chart
  
  // Country to continent mapping (unchanged)
  const continentMapping = {
    'africa': ['alg', 'ang', 'ben', 'bot', 'bur', 'bdi', 'cmr', 'cgo', 'civ', 'dji', 'egy', 'eri', 'eth', 'gab', 'gam', 'gha', 'gui', 'ken', 'les', 'lbr', 'lba', 'mad', 'maw', 'mli', 'mtn', 'mri', 'mar', 'moz', 'nam', 'nig', 'ngr', 'rsa', 'rwa', 'sen', 'sey', 'sle', 'som', 'ssd', 'sud', 'swz', 'tan', 'tog', 'tun', 'uga', 'zam', 'zim', 'com', 'cpv', 'caf', 'tcd', 'cod', 'gnq', 'gnb', 'stp'],
    'asia': ['afg', 'bah', 'ban', 'bhu', 'bru', 'cam', 'chn', 'hkg', 'ind', 'ina', 'irq', 'iri', 'jpn', 'jor', 'kaz', 'prk', 'kor', 'kuw', 'kgz', 'lao', 'lbn', 'mas', 'mdv', 'mgl', 'mya', 'nep', 'oma', 'pak', 'ple', 'phi', 'qat', 'ksa', 'sin', 'sri', 'syr', 'tpe', 'tjk', 'tha', 'tkm', 'uae', 'uzb', 'vie', 'yem'],
    'europe': ['alb', 'and', 'arm', 'aut', 'aze', 'blr', 'bel', 'bih', 'bul', 'cro', 'cyp', 'cze', 'den', 'est', 'fin', 'fra', 'geo', 'ger', 'gbr', 'gre', 'hun', 'isl', 'irl', 'isr', 'ita', 'kos', 'lat', 'lie', 'ltu', 'lux', 'mkd', 'mlt', 'mda', 'mon', 'mne', 'ned', 'nor', 'pol', 'por', 'rou', 'rus', 'smr', 'srb', 'svk', 'slo', 'esp', 'swe', 'sui', 'tur', 'ukr', 'eun', 'saa', 'scg', 'gdr', 'urs', 'yug'],
    'north_america': ['ant', 'aru', 'bah', 'bar', 'ber', 'can', 'cay', 'crc', 'cub', 'dma', 'dom', 'esa', 'grn', 'gua', 'hai', 'hon', 'jam', 'mex', 'aho', 'pan', 'pur', 'skn', 'lca', 'vin', 'tto', 'usa', 'ivb', 'isv'],
    'south_america': ['arg', 'bol', 'bra', 'chi', 'col', 'ecu', 'guy', 'par', 'per', 'sur', 'uru', 'ven'],
    'oceania': ['aus', 'cok', 'fij', 'fsm', 'kir', 'mhl', 'nru', 'nzl', 'plw', 'png', 'sam', 'sol', 'tga', 'tuv', 'van']
  };
  
  // Continent display names
  const continentNames = {
    'africa': 'Africa',
    'asia': 'Asia',
    'europe': 'Europe',
    'north_america': 'North America',
    'south_america': 'South America',
    'oceania': 'Oceania'
  };

  // Continent icons/emojis
  const continentIcons = {
    'africa': '🌍',
    'asia': '🌏',
    'europe': '🇪🇺',
    'north_america': '🌎',
    'south_america': '🌎',
    'oceania': '🏝️'
  };
  
  // Get the appropriate data source
  let dataToUse = countries;
  if (selectedYear && yearData[selectedYear]) {
    dataToUse = Object.values(yearData[selectedYear])
      .filter(c => c && typeof c === 'object');
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
      total: totalGold + totalSilver + totalBronze
    };
  }).sort((a, b) => b[medalType] - a[medalType]);
  
  // Create pie chart data
  const pieData = pie().value(d => d[medalType])(continentMedals);
  
  // Create arc generator
  const arcGenerator = arc()
    .innerRadius(innerRadius)
    .outerRadius((d) => {
      // Expand the arc when hovered
      return d.data.continent === highlightedContinent ? outerRadius * 1.08 : outerRadius;
    });
  
  // Enhanced color scale with gradients
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

  // Handle slice hover
  const handleSliceHover = (continent) => {
    setHighlightedContinent(continent);
  };

  // Handle slice click
  const handleSliceClick = (continent) => {
    if (focusedContinent === continent) {
      setFocusedContinent(null);
      setShowDetails(false);
    } else {
      setFocusedContinent(continent);
      setShowDetails(true);
    }
  };

  // Get details for focused continent
  const focusedContinentData = focusedContinent 
    ? continentMedals.find(c => c.continent === focusedContinent)
    : null;

  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Medal Distribution by Continent
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>

        <div className="flex flex-wrap items-center space-x-3 mt-2 sm:mt-0">
          <div>
            <label className="text-white mr-2">Year:</label>
            <select 
              value={selectedYear || ''}
              onChange={e => setSelectedYear(parseInt(e.target.value) || null)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value="">All Time</option>
              {olympicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-white mr-2">Medal Type:</label>
            <select
              value={medalType}
              onChange={e => setMedalType(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              <option value="total">Total</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>

          <div>
            <label className="text-white mr-2">Chart Type:</label>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 text-sm rounded-l-md ${chartType === 'pie' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300'}`}
              >
                Pie
              </button>
              <button
                onClick={() => setChartType('donut')}
                className={`px-3 py-1 text-sm rounded-r-md ${chartType === 'donut' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300'}`}
              >
                Donut
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col ${showDetails ? 'lg:flex-row' : 'md:flex-row'} bg-gray-900 p-4 rounded-lg transition-all`}>
        {/* Chart and Legend Container */}
        <div className={`flex-1 flex flex-col md:flex-row ${showDetails ? 'lg:w-1/2' : ''}`}>
          {/* Pie Chart with Gradients */}
          <div className="flex-1 flex justify-center items-center transition-all duration-300 min-h-[400px]">
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                {/* Define gradients for each continent */}
                {continentMedals.map((d, i) => (
                  <radialGradient
                    key={`gradient-${d.continent}`}
                    id={`gradient-${d.continent}`}
                    cx="50%"
                    cy="50%"
                    r="70%"
                    fx="50%"
                    fy="50%"
                  >
                    <stop
                      offset="0%"
                      stopColor={colorScale(d.continent)}
                      stopOpacity="0.9"
                    />
                    <stop
                      offset="100%"
                      stopColor={colorScale(d.continent)}
                      stopOpacity="0.7"
                    />
                  </radialGradient>
                ))}
              </defs>
              
              {/* Add subtle glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Center text for donut chart */}
              {chartType === 'donut' && (
                <g transform={`translate(${width / 2}, ${height / 2})`}>
                  <text 
                    textAnchor="middle" 
                    className="font-bold" 
                    fill="#fff" 
                    fontSize="20"
                  >
                    {medalType.charAt(0).toUpperCase() + medalType.slice(1)}
                  </text>
                  <text 
                    textAnchor="middle" 
                    y="25" 
                    className="font-bold" 
                    fill="#fff" 
                    fontSize="18"
                  >
                    {formatNumber(totalMedals)}
                  </text>
                  <text 
                    textAnchor="middle" 
                    y="45" 
                    fill="#aaa" 
                    fontSize="14"
                  >
                    medals total
                  </text>
                </g>
              )}
              
              <g 
                transform={`translate(${width / 2}, ${height / 2})`}
                className="transition-all duration-500 ease-in-out"
              >
                {pieData.map((d, i) => (
                  <g 
                    key={d.data.continent}
                    className="transition-all duration-300"
                    onMouseEnter={() => handleSliceHover(d.data.continent)}
                    onMouseLeave={() => handleSliceHover(null)}
                    onClick={() => handleSliceClick(d.data.continent)}
                    style={{ cursor: 'pointer' }}
                  >
                    <path
                      d={arcGenerator(d)}
                      fill={`url(#gradient-${d.data.continent})`}
                      stroke="#222"
                      strokeWidth={1}
                      filter={d.data.continent === highlightedContinent ? "url(#glow)" : ""}
                      className="transition-all duration-300"
                    >
                      <title>{d.data.name}: {formatNumber(d.data[medalType])} medals ({d.data.percentage}%)</title>
                    </path>
                    
                    {/* Add percentage label if slice is big enough */}
                    {d.data.percentage > 5 && (
                      <g className="transition-all duration-300">
                        <text
                          transform={`translate(${arcGenerator.centroid(d)})`}
                          textAnchor="middle"
                          fill="#fff"
                          fontWeight="bold"
                          fontSize={14}
                          strokeWidth={0.5}
                          stroke="#00000044"
                        >
                          {d.data.percentage}%
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>
          
          {/* Enhanced Legend & Stats */}
          <div className="lg:w-72 mt-4 md:mt-0 md:ml-6 flex flex-col justify-center">
            <h3 className="text-white font-bold mb-3 text-center text-lg border-b border-gray-700 pb-2">
              {medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medals
            </h3>
            <div className="space-y-3">
              {continentMedals.map(d => (
                <div 
                  key={d.continent} 
                  className={`flex items-center p-2 rounded-md transition-all duration-200 
                  ${d.continent === highlightedContinent ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                  onMouseEnter={() => handleSliceHover(d.continent)}
                  onMouseLeave={() => handleSliceHover(null)}
                  onClick={() => handleSliceClick(d.continent)}
                  style={{ cursor: 'pointer' }}
                >
                  <span 
                    className="w-6 h-6 mr-3 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: colorScale(d.continent) }}
                  >
                    {d.icon}
                  </span>
                  <span className="text-white flex-1 font-medium">{d.name}</span>
                  <span className="text-white font-bold">{formatNumber(d[medalType])}</span>
                  <span className="text-gray-400 w-16 text-right">{d.percentage}%</span>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-700 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white">Total:</span>
                  <span className="text-white font-bold text-lg">{formatNumber(totalMedals)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed View of Selected Continent */}
        {showDetails && focusedContinentData && (
          <div className="lg:w-1/2 mt-6 lg:mt-0 lg:ml-6 bg-gray-850 rounded-md border border-gray-700 p-4 animate-fadeIn">
            <div className="flex items-center mb-4 pb-3 border-b border-gray-700">
              <span 
                className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: colorScale(focusedContinentData.continent) }}
              >
                {focusedContinentData.icon}
              </span>
              <h3 className="text-xl font-bold text-white ml-3">
                {focusedContinentData.name}
              </h3>
              <button 
                className="ml-auto text-gray-400 hover:text-white"
                onClick={() => {
                  setFocusedContinent(null);
                  setShowDetails(false);
                }}
              >
                &times; Close
              </button>
            </div>
            
            <div className="flex justify-between mb-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xl mb-2">
                  {formatNumber(focusedContinentData.gold)}
                </div>
                <div className="text-yellow-400">Gold</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold text-xl mb-2">
                  {formatNumber(focusedContinentData.silver)}
                </div>
                <div className="text-gray-300">Silver</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-black font-bold text-xl mb-2">
                  {formatNumber(focusedContinentData.bronze)}
                </div>
                <div className="text-amber-700">Bronze</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                  {formatNumber(focusedContinentData.total)}
                </div>
                <div className="text-blue-400">Total</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Medal Distribution</h4>
              <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500"
                  style={{ 
                    width: `${(focusedContinentData.gold / focusedContinentData.total * 100).toFixed(1)}%`,
                    float: 'left'
                  }}
                  title={`Gold: ${formatNumber(focusedContinentData.gold)} (${(focusedContinentData.gold / focusedContinentData.total * 100).toFixed(1)}%)`}
                ></div>
                <div 
                  className="h-full bg-gray-300"
                  style={{ 
                    width: `${(focusedContinentData.silver / focusedContinentData.total * 100).toFixed(1)}%`,
                    float: 'left'
                  }}
                  title={`Silver: ${formatNumber(focusedContinentData.silver)} (${(focusedContinentData.silver / focusedContinentData.total * 100).toFixed(1)}%)`}
                ></div>
                <div 
                  className="h-full bg-amber-700"
                  style={{ 
                    width: `${(focusedContinentData.bronze / focusedContinentData.total * 100).toFixed(1)}%`,
                    float: 'left'
                  }}
                  title={`Bronze: ${formatNumber(focusedContinentData.bronze)} (${(focusedContinentData.bronze / focusedContinentData.total * 100).toFixed(1)}%)`}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <div>Gold: {(focusedContinentData.gold / focusedContinentData.total * 100).toFixed(1)}%</div>
                <div>Silver: {(focusedContinentData.silver / focusedContinentData.total * 100).toFixed(1)}%</div>
                <div>Bronze: {(focusedContinentData.bronze / focusedContinentData.total * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-800 p-3 rounded text-sm text-gray-300 leading-relaxed">
              <p className="mb-2">
                <strong className="text-white">{focusedContinentData.name}</strong> has won a total of 
                <strong className="text-white"> {formatNumber(focusedContinentData.total)}</strong> medals 
                {selectedYear ? ` in the ${selectedYear} Olympics` : ' throughout Olympic history'}, 
                representing <strong>{focusedContinentData.percentage}%</strong> of all medals.
              </p>
              <p>
                The continent's medal collection includes 
                <strong className="text-yellow-400"> {formatNumber(focusedContinentData.gold)} gold</strong>, 
                <strong className="text-gray-300"> {formatNumber(focusedContinentData.silver)} silver</strong>, and 
                <strong className="text-amber-700"> {formatNumber(focusedContinentData.bronze)} bronze</strong> medals.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="text-gray-400 text-xs mt-4 text-center">
        Click on a continent in the chart or legend to see detailed statistics
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </section>
  );
}

// --- Top Countries Table Visualization ---
function TopCountriesTable({ countries, selectedYear, yearData, olympicYears, setSelectedYear }) {
  const [topN, setTopN] = useState(10);
  const [sortBy, setSortBy] = useState('gold');
  
  let dataToUse = countries;
  if (selectedYear && yearData[selectedYear]) {
    dataToUse = Object.values(yearData[selectedYear])
      .filter(c => c && typeof c === 'object');
  }
  
  const topCountries = [...dataToUse]
    .sort((a, b) => {
      if (sortBy === 'total') {
        return b.total - a.total;
      } else if (sortBy === 'silver') {
        if (b.silver !== a.silver) return b.silver - a.silver;
        if (b.gold !== a.gold) return b.gold - a.gold;
        return b.bronze - a.bronze;
      } else if (sortBy === 'bronze') {
        if (b.bronze !== a.bronze) return b.bronze - a.bronze;
        if (b.gold !== a.gold) return b.gold - a.gold;
        return b.silver - a.silver;
      } else { // default is gold
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        return b.bronze - a.bronze;
      }
    })
    .slice(0, topN);
    
  return (
    <section className="bg-gray-800 p-4 rounded-lg shadow-md mt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
        <h2 className="text-xl font-bold text-white">
          Top {topN} Countries by Medal Count
          {selectedYear && <span className="text-blue-400 ml-2">({selectedYear})</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <label className="text-white">Year:</label>
          <select 
            value={selectedYear || ''}
            onChange={e => setSelectedYear(parseInt(e.target.value) || null)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="">All Time</option>
            {olympicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <label className="text-white ml-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="gold">Gold Medals</option>
            <option value="silver">Silver Medals</option>
            <option value="bronze">Bronze Medals</option>
            <option value="total">Total Medals</option>
          </select>
          <label className="text-white ml-2">Show:</label>
          <select
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value={10}>Top 10</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead className="bg-gray-700">
            <tr className="text-left">
              <th className="py-2 px-3 rounded-tl-lg">Rank</th>
              <th className="py-2 px-3">Country</th>
              <th className={`py-2 px-3 text-center ${sortBy === 'gold' ? 'bg-gray-600' : ''}`}>
                <span className="text-yellow-400">Gold</span>
              </th>
              <th className={`py-2 px-3 text-center ${sortBy === 'silver' ? 'bg-gray-600' : ''}`}>
                <span className="text-gray-300">Silver</span>
              </th>
              <th className={`py-2 px-3 text-center ${sortBy === 'bronze' ? 'bg-gray-600' : ''}`}>
                <span className="text-amber-700">Bronze</span>
              </th>
              <th className={`py-2 px-3 rounded-tr-lg text-center ${sortBy === 'total' ? 'bg-gray-600' : ''}`}>
                <span className="text-blue-400">Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topCountries.map((country, index) => (
              <tr 
                key={country.noc || index} 
                className={index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}
              >
                <td className="py-2 px-3">{index + 1}</td>
                <td className="py-2 px-3 font-medium">
                  {(country.name || country.region) && (country.name || country.region).trim() !== '' 
                    ? (country.name || country.region)
                    : 'Unknown Country'}
                </td>
                <td className="py-2 px-3 text-center">{country.gold || 0}</td>
                <td className="py-2 px-3 text-center">{country.silver || 0}</td>
                <td className="py-2 px-3 text-center">{country.bronze || 0}</td>
                <td className="py-2 px-3 text-center font-bold">{country.total || 0}</td>
              </tr>
            ))}
            {topCountries.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">No medal data available</td>
              </tr>
            )}
          </tbody>
        </table>
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
      // In MedalDashboard's return
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