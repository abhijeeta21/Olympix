'use client'; // This is a client component

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Pie, Line, Bar } from 'react-chartjs-2'; // Import Bar chart component as well
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement
} from 'chart.js'; // Import necessary Chart.js elements

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement
);

// Helper function to process medal counts for Pie Chart
const processMedalData = (medalCounts) => {
  if (!medalCounts || Object.keys(medalCounts).length === 0) {
    return null; // No medal data
  }
  
  // Define all three medal types even if some are missing in the data
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

  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };
};

// Helper function to separate summer and winter participation data
const processSummerWinterData = (participation) => {
  if (!participation || Object.keys(participation).length === 0) {
    return { summer: null, winter: null };
  }

  // Sort years numerically
  const years = Object.keys(participation).sort((a, b) => parseInt(a) - parseInt(b));
  
  // Separate summer and winter games based on year
  // Summer Olympics are typically held in even-numbered years divisible by 4
  // Winter Olympics were held in the same years until 1992, then shifted to 2 years after summer games
  
  const summerYears = [];
  const summerCounts = [];
  const winterYears = [];
  const winterCounts = [];
  
  years.forEach(year => {
    const yearNum = parseInt(year);
    
    // Summer Olympics years (approximate logic - all years divisible by 4 before 1994)
    // After 1994, summer games still every 4 years on years divisible by 4
    if (yearNum % 4 === 0) {
      summerYears.push(year);
      summerCounts.push(participation[year]);
    } 
    // Winter Olympics (approximate logic)
    // Before 1994: same years as summer Olympics
    // After 1994: years divisible by 4 plus 2 (1994, 1998, 2002, etc.)
    else if ((yearNum % 4 === 2 && yearNum >= 1994) || (yearNum % 4 === 0 && yearNum < 1994)) {
      winterYears.push(year);
      winterCounts.push(participation[year]);
    }
    // Handle any other years that might be in the data
    else {
      // For simplicity, let's add non-standard years to summer data
      summerYears.push(year);
      summerCounts.push(participation[year]);
    }
  });

  return {
    summer: {
      labels: summerYears,
      datasets: [
        {
          label: 'Summer Olympic Athletes',
          data: summerCounts,
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
      ],
    },
    winter: {
      labels: winterYears,
      datasets: [
        {
          label: 'Winter Olympic Athletes',
          data: winterCounts,
          fill: false,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1,
        },
      ],
    }
  };
};

// Helper function to process top sports data for bar chart
const processTopSportsData = (sportsStats) => {
  if (!sportsStats || sportsStats.length === 0) {
    return null;
  }

  // Sort sports by athlete count descending and take top 10
  const topSports = [...sportsStats]
    .sort((a, b) => b.athlete_count - a.athlete_count)
    .slice(0, 10);

  return {
    labels: topSports.map(sport => sport.Sport),
    datasets: [
      {
        label: 'Athlete Count',
        data: topSports.map(sport => sport.athlete_count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
};

export default function CompareCountriesPage() {
  const [country1, setCountry1] = useState(null);
  const [country2, setCountry2] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  const [country1Data, setCountry1Data] = useState(null);
  const [country2Data, setCountry2Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Processed data for charts
  const country1MedalChartData = processMedalData(country1Data?.medal_counts);
  const country2MedalChartData = processMedalData(country2Data?.medal_counts);
  
  // Process summer and winter participation data
  const country1OlympicsData = processSummerWinterData(country1Data?.participation);
  const country2OlympicsData = processSummerWinterData(country2Data?.participation);
  
  // Top sports data
  const country1TopSportsData = processTopSportsData(country1Data?.sports_stats);
  const country2TopSportsData = processTopSportsData(country2Data?.sports_stats);

  // Fetch the list of countries from the CSV
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // Fetching directly from the public directory
        const response = await fetch('/noc_regions.csv');
        if (!response.ok) {
          // It's helpful to log the response status and text for debugging
          const errorText = await response.text();
          console.error(`HTTP error fetching noc_regions.csv! Status: ${response.status}, Body: ${errorText}`);
          throw new Error(`Failed to fetch country list: HTTP status ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header row
        const options = lines
          .map(line => {
            const parts = line.split(',');
            // Ensure line has enough parts to avoid errors
            if (parts.length < 2) return null;
            const noc = parts[0];
            // Use the region from the second column, trim whitespace
            const region = parts[1] ? parts[1].trim() : noc;
            return { value: noc, label: region };
          })
          .filter(option => option !== null && option.value && option.label); // Filter out any null or invalid options

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
      if (!noc) {
        setCountryData(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/countries/${noc}_data.json`);
        if (!response.ok) {
          console.warn(`Data not found for ${noc}`);
          setCountryData(null);
          return;
        }
        const data = await response.json();
        setCountryData(data);
      } catch (e) {
        console.error(`Failed to fetch data for ${noc}:`, e);
        setCountryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData(country1?.value, setCountry1Data);
    fetchData(country2?.value, setCountry2Data);

  }, [country1, country2]); // Refetch when selected countries change

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Compare Olympic Performance</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="country1-select" className="block text-sm font-medium text-gray-700">Select Country 1</label>
          <Select
            id="country1-select"
            options={countryOptions}
            onChange={setCountry1}
            value={country1}
            isClearable
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <label htmlFor="country2-select" className="block text-sm font-medium text-gray-700">Select Country 2</label>
          <Select
            id="country2-select"
            options={countryOptions}
            onChange={setCountry2}
            value={country2}
            isClearable
            className="mt-1 block w-full"
          />
        </div>
      </div>

      {loading && <p className="text-center">Loading comparison data...</p>}

      {/* Comparison Display Area */}
      {country1Data || country2Data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display for Country 1 */}
          <div className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">{country1Data?.country || (country1?.label || 'Select Country 1')}</h2>
            {country1Data ? (
              <div>
                {/* Medal Counts Pie Chart */}
                <h3 className="text-lg font-medium mb-2">Medal Counts</h3>
                {country1MedalChartData ? (
                  <div className="mb-6" style={{ maxWidth: '300px', margin: 'auto' }}>
                    <Pie data={country1MedalChartData} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' }, 
                        title: { display: true, text: 'Medal Distribution' } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No medal data available.</p>
                )}

                {/* Summer Olympic Athletes Line Chart */}
                <h3 className="text-lg font-medium mb-2">Summer Olympic Athletes</h3>
                {country1OlympicsData.summer ? (
                  <div className="mb-6">
                    <Line data={country1OlympicsData.summer} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' } 
                      }, 
                      scales: { 
                        x: { title: { display: true, text: 'Year' } }, 
                        y: { title: { display: true, text: 'Number of Athletes' } } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No summer Olympics data available.</p>
                )}

                {/* Winter Olympic Athletes Line Chart */}
                <h3 className="text-lg font-medium mb-2">Winter Olympic Athletes</h3>
                {country1OlympicsData.winter ? (
                  <div className="mb-6">
                    <Line data={country1OlympicsData.winter} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' } 
                      }, 
                      scales: { 
                        x: { title: { display: true, text: 'Year' } }, 
                        y: { title: { display: true, text: 'Number of Athletes' } } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No winter Olympics data available.</p>
                )}

                {/* Top Sports by Athlete Count Bar Chart */}
                <h3 className="text-lg font-medium mb-2">Top 10 Sports by Athlete Count</h3>
                {country1TopSportsData ? (
                  <div className="mb-4">
                    <Bar data={country1TopSportsData} options={{ 
                      responsive: true, 
                      indexAxis: 'y', // Horizontal bar chart for better readability
                      plugins: { 
                        legend: { display: false } 
                      },
                      scales: {
                        x: { title: { display: true, text: 'Number of Athletes' } }
                      }
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500">No sports statistics available.</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">{country1 ? `No data available for ${country1.label}.` : 'Select a country to see data.'}</p>
            )}
          </div>

          {/* Display for Country 2 */}
          <div className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">{country2Data?.country || (country2?.label || 'Select Country 2')}</h2>
            {country2Data ? (
              <div>
                {/* Medal Counts Pie Chart */}
                <h3 className="text-lg font-medium mb-2">Medal Counts</h3>
                {country2MedalChartData ? (
                  <div className="mb-6" style={{ maxWidth: '300px', margin: 'auto' }}>
                    <Pie data={country2MedalChartData} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' }, 
                        title: { display: true, text: 'Medal Distribution' } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No medal data available.</p>
                )}

                {/* Summer Olympic Athletes Line Chart */}
                <h3 className="text-lg font-medium mb-2">Summer Olympic Athletes</h3>
                {country2OlympicsData.summer ? (
                  <div className="mb-6">
                    <Line data={country2OlympicsData.summer} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' } 
                      }, 
                      scales: { 
                        x: { title: { display: true, text: 'Year' } }, 
                        y: { title: { display: true, text: 'Number of Athletes' } } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No summer Olympics data available.</p>
                )}

                {/* Winter Olympic Athletes Line Chart */}
                <h3 className="text-lg font-medium mb-2">Winter Olympic Athletes</h3>
                {country2OlympicsData.winter ? (
                  <div className="mb-6">
                    <Line data={country2OlympicsData.winter} options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'top' } 
                      }, 
                      scales: { 
                        x: { title: { display: true, text: 'Year' } }, 
                        y: { title: { display: true, text: 'Number of Athletes' } } 
                      } 
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">No winter Olympics data available.</p>
                )}

                {/* Top Sports by Athlete Count Bar Chart */}
                <h3 className="text-lg font-medium mb-2">Top 10 Sports by Athlete Count</h3>
                {country2TopSportsData ? (
                  <div className="mb-4">
                    <Bar data={country2TopSportsData} options={{ 
                      responsive: true, 
                      indexAxis: 'y', // Horizontal bar chart for better readability
                      plugins: { 
                        legend: { display: false } 
                      },
                      scales: {
                        x: { title: { display: true, text: 'Number of Athletes' } }
                      }
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-500">No sports statistics available.</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">{country2 ? `No data available for ${country2.label}.` : 'Select a country to see data.'}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Select two countries to compare their Olympic performances.</p>
      )}
    </div>
  );
}