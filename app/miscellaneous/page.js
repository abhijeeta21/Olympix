"use client";

import React, { useState, useEffect } from 'react';
import HostCountryAdvantage from '../components/HostCountryAdvantage';
import Papa from 'papaparse';

const MiscellaneousPage = () => {
  const [olympicData, setOlympicData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setIsLoading(true);
    try {
      // Fetch the CSV file from the public directory
      fetch('/year_host_country.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(csvText => {
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true, // Convert numeric strings to numbers
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                console.warn('CSV parsing had errors:', results.errors);
              }
              setOlympicData(results.data);
              setIsLoading(false);
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
              setError('Failed to parse the data file');
              setIsLoading(false);
            }
          });
        })
        .catch(error => {
          console.error('Error loading Olympic data:', error);
          setError('Failed to load the data file');
          setIsLoading(false);
        });
    } catch (error) {
      console.error('Error in data loading process:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 border border-red-300 rounded bg-red-50">
        <p>Error: {error}</p>
        <p>Please check that your data file is in the correct location and format.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Olympic Data Insights</h1>
      
      {olympicData.length > 0 ? (
        <HostCountryAdvantage data={olympicData} />
      ) : (
        <p>No data available. Please check your data source.</p>
      )}
    </div>
  );
};

export default MiscellaneousPage;