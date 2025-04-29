'use client'; // This is a client component

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartJSTooltip, Legend as ChartJSLegend, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartJSTitle } from 'chart.js'; // Import necessary Chart.js elements
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts'; // Import Recharts components


// Register Chart.js components
ChartJS.register(ArcElement, ChartJSTooltip, ChartJSLegend, CategoryScale, LinearScale, PointElement, LineElement, ChartJSTitle);


// Helper function to process medal counts for Pie Chart
const processMedalData = (medalCounts) => {
  if (!medalCounts || Object.keys(medalCounts).length === 0) {
    return null; // No medal data
  }
  const labels = ['Gold', 'Silver', 'Bronze'];
  const data = [
    medalCounts.Gold || 0,
    medalCounts.Silver || 0,
    medalCounts.Bronze || 0,
  ];
   const backgroundColors = [
    '#FFD700', // Gold
    '#C0C0C0', // Silver
    '#CD7F32', // Bronze
  ];

  // Filter out labels with 0 data for a cleaner pie chart
  const filteredLabels = labels.filter((_, index) => data[index] > 0);
  const filteredData = data.filter(count => count > 0);
  const filteredBackgroundColors = backgroundColors.filter((_, index) => data[index] > 0);


  return {
    labels: filteredLabels,
    datasets: [
      {
        data: filteredData,
        backgroundColor: filteredBackgroundColors,
        borderColor: filteredBackgroundColors,
        borderWidth: 1,
      },
    ],
  };
};

// Helper function to process participation data for Line Chart
const processParticipationData = (participation) => {
  if (!participation || Object.keys(participation).length === 0) {
    return null; // No participation data
  }

  const years = Object.keys(participation).sort();
  const participantCounts = years.map(year => participation[year]);

  return {
    labels: years,
    datasets: [
      {
        label: 'Number of Participants',
        data: participantCounts,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };
};

// Helper function to process top sports data for Bar Chart
const processTopSportsData = (sportsStats) => {
    if (!sportsStats || sportsStats.length === 0) {
        return []; // No sports stats
    }

    // Sort by athlete_count descending and take top 10
    return sportsStats
        .sort((a, b) => b.athlete_count - a.athlete_count)
        .slice(0, 10)
        .map(sport => ({
            Sport: sport.Sport,
            AthleteCount: sport.athlete_count,
            // You can define colors for each bar if needed, or use a color scale in the chart
            // fill: '#8884d8' // Example color
        }));
};


export default function CompareCountriesPage() {
  const [country1, setCountry1] = useState(null);
  const [country2, setCountry2] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  const [country1Data, setCountry1Data] = useState(null);
  const [country2Data, setCountry2Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Processed data for charts and displays
  const country1MedalChartData = processMedalData(country1Data?.medal_counts);
  const country2MedalChartData = processMedalData(country2Data?.medal_counts);
  const country1ParticipationChartData = processParticipationData(country1Data?.participation);
  const country2ParticipationChartData = processParticipationData(country2Data?.participation);
  const country1TopSportsData = processTopSportsData(country1Data?.sports_stats);
  const country2TopSportsData = processTopSportsData(country2Data?.sports_stats);


  // Fetch the list of countries from the CSV in the public directory
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/noc_regions.csv');
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error fetching noc_regions.csv! Status: ${response.status}, Body: ${errorText}`);
          throw new Error(`Failed to fetch country list: HTTP status ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header row
        const options = lines
          .map(line => {
            const parts = line.split(',');
            if (parts.length < 2) return null;
            const noc = parts[0].trim(); // Trim NOC as well
            const region = parts[1] ? parts[1].trim() : noc;
            if (!noc || !region) return null; // Basic validation

            return { value: noc, label: region };
          })
          .filter(option => option !== null); // Filter out any null or invalid options


        setCountryOptions(options);
      } catch (e) {
        console.error("Failed to fetch country list:", e);
        setError("Could not load country list. Please ensure noc_regions.csv is in the public directory.");
      }
    };

    fetchCountries();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch data for selected countries
  useEffect(() => {
    const fetchData = async (noc, setCountryData) => {
      // Clear previous data when a country is unselected or changing
      if (!noc) {
        setCountryData(null);
        return;
      }

      setLoading(true);
      setError(null); // Clear previous errors

      try {
        const response = await fetch(`/countries/${noc}_data.json`);
        if (!response.ok) {
           console.warn(`Data not found for ${noc}: ${response.status}`);
           // Optionally set a specific "no data" state here instead of null
           setCountryData(null); // Set to null if data file doesn't exist
           return;
        }
        const data = await response.json();
        setCountryData(data);
      } catch (e) {
        console.error(`Failed to fetch data for ${noc}:`, e);
        setCountryData(null); // Clear data on error
        // You might want more granular error state per country
      } finally {
        // Only set loading to false if data fetch attempts for both countries have finished
        // This is a simplification, more robust loading might be needed
         setLoading(false);
      }
    };

    // Using a slight delay to allow both fetches to potentially start before setting loading=false
    const fetchBothCountries = async () => {
        setLoading(true); // Set loading true before starting fetches
        await Promise.all([
            fetchData(country1?.value, setCountry1Data),
            fetchData(country2?.value, setCountry2Data)
        ]);
         setLoading(false); // Set loading false after both fetches complete
    };

    fetchBothCountries();

  }, [country1, country2]); // Refetch when selected countries change


   // Custom styles for react-select
   const selectStyles = {
     control: (provided, state) => ({
       ...provided,
       backgroundColor: '#1f2937', // Dark gray background
       borderColor: state.isFocused ? '#60a5fa' : '#374151', // Blue border when focused, darker gray otherwise
       color: '#e5e7eb', // Light gray text color
       boxShadow: state.isFocused ? '0 0 0 1px #60a5fa' : null,
       '&:hover': {
         borderColor: '#60a5fa', // Blue border on hover
       },
     }),
     singleValue: (provided) => ({
       ...provided,
       color: '#e5e7eb', // Light gray text color for selected value
     }),
     input: (provided) => ({
       ...provided,
       color: '#e5e7eb', // Light gray text color for input
     }),
     placeholder: (provided) => ({
       ...provided,
       color: '#9ca3af', // Gray placeholder text
     }),
     menu: (provided) => ({
       ...provided,
       backgroundColor: '#1f2937', // Dark gray background for dropdown menu
       borderColor: '#374151', // Darker gray border
     }),
     option: (provided, state) => ({
       ...provided,
       backgroundColor: state.isHovered
         ? '#374151' // Darker gray on hover
         : state.isSelected
         ? '#4b5563' // Medium gray if selected
         : '#1f2937', // Dark gray otherwise
       color: '#e5e7eb', // Light gray text color for options
       '&:active': {
         backgroundColor: '#4b5563', // Medium gray on active
       },
     }),
   };


  return (
    <div className="container mx-auto p-4 text-gray-200 bg-gray-900 min-h-screen"> {/* Added dark mode background */}
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Compare Countries</h1>

      {error && <div className="bg-red-600 text-white p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> {/* Increased gap */}
        <div>
          <label htmlFor="country1-select" className="block text-sm font-medium text-blue-300 mb-2">Select Country 1</label>
          <Select
            id="country1-select"
            options={countryOptions}
            onChange={setCountry1}
            value={country1}
            isClearable
            classNamePrefix="react-select" // Add a prefix for custom styling if needed
            styles={selectStyles} // Apply custom styles
          />
        </div>
        <div>
          <label htmlFor="country2-select" className="block text-sm font-medium text-blue-300 mb-2">Select Country 2</label>
          <Select
            id="country2-select"
            options={countryOptions}
            onChange={setCountry2}
            value={country2}
            isClearable
             classNamePrefix="react-select" // Add a prefix for custom styling if needed
             styles={selectStyles} // Apply custom styles
          />
        </div>
      </div>

      {loading && <p className="text-center text-blue-400">Loading comparison data...</p>}

      {/* Comparison Display Area */}
      {(country1Data || country2Data) && !loading ? ( // Show content if at least one country has data and not loading
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
          {/* Display for Country 1 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700"> {/* Dark mode card styling */}
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">{country1Data?.country || (country1?.label || 'Select Country 1')}</h2>
            {country1Data ? (
              <div className="space-y-6"> {/* Added space between sections */}
                {/* Medal Counts Pie Chart */}
                 <div>
                     <h3 className="text-xl font-medium text-blue-400 mb-3">Medal Counts</h3>
                     {country1MedalChartData ? (
                         <div style={{ maxWidth: '300px', margin: 'auto' }}>
                           <Pie data={country1MedalChartData} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e5e7eb' } }, tooltip: { enabled: true } } }} />
                         </div>
                     ) : (
                        <p className="text-gray-400">No medal data available.</p>
                     )}
                 </div>

                 {/* Olympic Participation Line Chart */}
                 <div>
                     <h3 className="text-xl font-medium text-blue-400 mb-3">Olympic Participation Over the Years</h3>
                      {country1ParticipationChartData ? (
                         <div>
                           <Line data={country1ParticipationChartData} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e5e7eb' } }, tooltip: { enabled: true } }, scales: { x: { title: { display: true, text: 'Year', color: '#e5e7eb' }, ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }, y: { title: { display: true, text: 'Number of Participants', color: '#e5e7eb' }, ticks: { color: '#9ca3af' }, grid: { color: '#374151' } } } }} />
                         </div>
                     ) : (
                         <p className="text-gray-400">No participation data available.</p>
                     )}
                 </div>

                 {/* Top Sports by Athlete Count - Bar Chart */}
                 <div>
                    <h3 className="text-xl font-medium text-blue-400 mb-3">Top 10 Sports by Athlete Count</h3>
                    {country1TopSportsData && country1TopSportsData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={300}>
                           <BarChart data={country1TopSportsData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                             <XAxis type="number" stroke="#e2e8f0" />
                             <YAxis dataKey="Sport" type="category" width={120} stroke="#e2e8f0" tick={{ fill: '#e5e7eb' }} /> {/* Added tick color */}
                             <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                             <Bar dataKey="AthleteCount" fill="#8884d8"> {/* Added a default fill color */}
                               {/* You can use Cells here if you want to customize bar colors */}
                             </Bar>
                           </BarChart>
                         </ResponsiveContainer>
                    ) : (
                       <p className="text-gray-400">No sports statistics available.</p>
                    )}
                 </div>

              </div>
            ) : (
              <p className="text-gray-400">{country1 ? `No data available for ${country1.label}.` : 'Select a country to see data.'}</p>
            )}
          </div>

          {/* Display for Country 2 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700"> {/* Dark mode card styling */}
             <h2 className="text-2xl font-semibold text-blue-300 mb-4">{country2Data?.country || (country2?.label || 'Select Country 2')}</h2>
            {country2Data ? (
              <div className="space-y-6"> {/* Added space between sections */}
                {/* Medal Counts Pie Chart */}
                 <div>
                     <h3 className="text-xl font-medium text-blue-400 mb-3">Medal Counts</h3>
                     {country2MedalChartData ? (
                         <div style={{ maxWidth: '300px', margin: 'auto' }}>
                           <Pie data={country2MedalChartData} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e5e7eb' } }, tooltip: { enabled: true } } }} />
                         </div>
                     ) : (
                        <p className="text-gray-400">No medal data available.</p>
                     )}
                 </div>

                {/* Olympic Participation Line Chart */}
                 <div>
                     <h3 className="text-xl font-medium text-blue-400 mb-3">Olympic Participation Over the Years</h3>
                     {country2ParticipationChartData ? (
                         <div>
                           <Line data={country2ParticipationChartData} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e5e7eb' } }, tooltip: { enabled: true } }, scales: { x: { title: { display: true, text: 'Year', color: '#e5e7eb' }, ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }, y: { title: { display: true, text: 'Number of Participants', color: '#e5e7eb' }, ticks: { color: '#9ca3af' }, grid: { color: '#374151' } } } }} />
                         </div>
                     ) : (
                         <p className="text-gray-400">No participation data available.</p>
                     )}
                 </div>

                 {/* Top Sports by Athlete Count - Bar Chart */}
                 <div>
                    <h3 className="text-xl font-medium text-blue-400 mb-3">Top 10 Sports by Athlete Count</h3>
                    {country2TopSportsData && country2TopSportsData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={300}>
                           <BarChart data={country2TopSportsData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                             <XAxis type="number" stroke="#e2e8f0" />
                             <YAxis dataKey="Sport" type="category" width={120} stroke="#e2e8f0" tick={{ fill: '#e5e7eb' }} /> {/* Added tick color */}
                             <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                             <Bar dataKey="AthleteCount" fill="#82ca9d"> {/* Added a different default fill color */}
                               {/* You can use Cells here if you want to customize bar colors */}
                             </Bar>
                           </BarChart>
                         </ResponsiveContainer>
                    ) : (
                       <p className="text-gray-400">No sports statistics available.</p>
                    )}
                 </div>

              </div>
             ) : (
              <p className="text-gray-400">{country2 ? `No data available for ${country2.label}.` : 'Select a country to see data.'}</p>
             )}
          </div>
        </div>
      ) : (
         <p className="text-center text-gray-500">{!loading && !(country1Data || country2Data) ? 'Select two countries to compare.' : ''}</p>
      )}

    </div>
  );
}