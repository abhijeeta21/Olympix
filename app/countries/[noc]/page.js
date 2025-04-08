'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/countries" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Countries
        </Link>

        <h1 className="text-4xl font-bold text-blue-900">
          {data.country} – Olympic Details
        </h1>

        {/* Medal Counts */}
        <div className="bg-blue-50 rounded-lg p-4 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Medal Count</h2>
          <div className="flex space-x-8">
            {Object.entries(data.medal_counts).map(([medal, count]) => (
              <div key={medal} className="text-center">
                <p className="text-xl font-bold">
                  {count}
                </p>
                <p className="capitalize text-gray-600">{medal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Participation Over Years */}
        <div className="bg-gray-100 rounded-lg p-4 shadow">
          <h2 className="text-2xl font-semibold mb-4">Olympic Participation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.participation).map(([year, athletes]) => (
              <div key={year} className="text-sm">
                <p className="font-semibold text-gray-700">{year}</p>
                <p className="text-gray-500">{athletes} athletes</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sport Stats */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-2xl font-semibold mb-4">Sport Statistics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2">Sport</th>
                  <th className="px-4 py-2">Avg Age</th>
                  <th className="px-4 py-2">Avg Height</th>
                  <th className="px-4 py-2">Avg Weight</th>
                  <th className="px-4 py-2">Athlete Count</th>
                </tr>
              </thead>
              <tbody>
                {data.sports_stats.map((sport) => (
                  <tr key={sport.Sport} className="border-t">
                    <td className="px-4 py-2">{sport.Sport}</td>
                    <td className="px-4 py-2">{sport.avg_age?.toFixed(1) ?? '–'}</td>
                    <td className="px-4 py-2">{sport.avg_height?.toFixed(1) ?? '–'}</td>
                    <td className="px-4 py-2">{sport.avg_weight?.toFixed(1) ?? '–'}</td>
                    <td className="px-4 py-2">{sport.athlete_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-12 border-t pt-4">
          &copy; {new Date().getFullYear()} Olympic Insights
        </footer>
      </div>
    </main>
  );
}