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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl text-red-500">No data found for this country.</h2>
        <Link href="/countries" className="text-blue-600 underline mt-4 inline-block">
          &larr; Back to Countries
        </Link>
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
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-semibold">{`Year: ${label}`}</p>
          <p>{`Athletes: ${payload[0].value}`}</p>
          {/* <p>{`Total Medals: ${payload[0].payload.medals}`}</p> */}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-white text-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <Link href="/countries" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Countries
        </Link>

        <h1 className="text-4xl font-bold text-gray-900">
          {data.country} – Olympic Details
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Medal Count</h2>
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
                <ReTooltip />
                <ReLegend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top 10 Sports by Athlete Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSports} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="Sport" type="category" width={120} stroke="#666" />
                <ReTooltip />
                <Bar dataKey="AthleteCount">
                  {topSports.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Olympic Participation Over the Years</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Summer Olympics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summerData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
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
              <h3 className="text-xl font-medium text-gray-700 mb-2">Winter Olympics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={winterData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
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

        <footer className="text-center text-sm text-gray-600 mt-12 border-t pt-4">
          &copy; {new Date().getFullYear()} Olympic Insights
        </footer>
      </div>
    </main>
  );
}