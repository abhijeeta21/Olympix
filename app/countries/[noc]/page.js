'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function CountryDetails() {
  const { noc } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await fetch(`/countries/${noc}_data.json`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching country-specific data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryData();
  }, [noc]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="text-center mt-10">
          <h2 className="text-xl text-red-400">No data found for this country.</h2>
          <Link href="/countries" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            &larr; Back to Countries
          </Link>
        </div>
      </div>
    );
  }

  const medalData = [
    { name: 'Gold', value: data.medal_counts.Gold || 0 },
    { name: 'Silver', value: data.medal_counts.Silver || 0 },
    { name: 'Bronze', value: data.medal_counts.Bronze || 0 }
  ];
  const medalColors = {
    Gold: '#FFD700',
    Silver: '#C0C0C0',
    Bronze: '#CD7F32'
  };

  // Calculate yearly medal counts (for tooltips)
  const yearlyMedals = {};
  if (data.yearly_medals) {
    Object.entries(data.yearly_medals).forEach(([year, medals]) => {
      yearlyMedals[year] = medals.reduce((sum, medal) => sum + medal.count, 0);
    });
  }

  // Process participation data to separate Summer and Winter Olympics
  const summerData = [];
  const winterData = [];
  
  Object.entries(data.participation).forEach(([year, athletes]) => {
    const numYear = Number(year);
    // Winter Olympics are typically held in even years that are not divisible by 4
    // Summer Olympics are typically held in years divisible by 4
    const isWinter = numYear % 4 !== 0;
    
    if (isWinter) {
      winterData.push({
        year: numYear,
        athletes,
        medals: yearlyMedals[year] || 0
      });
    } else {
      summerData.push({
        year: numYear,
        athletes,
        medals: yearlyMedals[year] || 0
      });
    }
  });
  
  // Sort both datasets by year
  summerData.sort((a, b) => a.year - b.year);
  winterData.sort((a, b) => a.year - b.year);

  const topSports = [...data.sports_stats]
    .sort((a, b) => b.athlete_count - a.athlete_count)
    .slice(0, 10)
    .map((sport, index) => ({
      Sport: sport.Sport,
      AthleteCount: sport.athlete_count,
      fill: index % 2 === 0 ? '#3B82F6' : '#60A5FA' // Alternate between darker and lighter blue
    }));

  // Custom tooltip for Olympic participation charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 shadow-md rounded text-white">
          <p className="font-semibold">{`Year: ${label}`}</p>
          <p>{`Athletes: ${payload[0].value}`}</p>
          <p>{`Total Medals: ${payload[0].payload.medals}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-6xl mx-auto space-y-8 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center">
          <Link href="/countries" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Countries
          </Link>
          <div className="text-sm font-medium py-1 px-3 bg-blue-800 rounded-full">Country Details</div>
        </nav>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {data.country}
          </h1>
          <p className="text-xl text-blue-300 max-w-2xl mx-auto">
            Olympic Performance Analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">Medal Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={medalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {medalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={medalColors[entry.name]} />
                  ))}
                </Pie>
                <ReTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                <ReLegend formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">Top 10 Sports by Athlete Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSports} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#e2e8f0" />
                <YAxis dataKey="Sport" type="category" width={120} stroke="#e2e8f0" />
                <ReTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                <Bar dataKey="AthleteCount">
                  {topSports.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-blue-300 mb-6">Olympic Participation Over the Years</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium text-blue-200 mb-4">Summer Olympics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summerData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="year" stroke="#e2e8f0" />
                  <YAxis stroke="#e2e8f0" />
                  <ReTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="athletes" 
                    name="Summer Olympics" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-xl font-medium text-blue-200 mb-4">Winter Olympics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={winterData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="year" stroke="#e2e8f0" />
                  <YAxis stroke="#e2e8f0" />
                  <ReTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="athletes" 
                    name="Winter Olympics" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pt-6 border-t border-gray-700">
          <p>Olympic Data Analysis Project - {new Date().getFullYear()}</p>
          <p className="mt-2">Built with D3.js and React</p>
        </footer>
      </div>
    </main>
  );
}