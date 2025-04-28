"use client";

import React, { useState, useEffect } from 'react';
import HostCountryAdvantage from '../components/HostCountryAdvantage.js';
import Papa from 'papaparse';

const MiscellaneousPage = () => {
  const [olympicData, setOlympicData] = useState([]);
  
  useEffect(() => {
    try {
      // For CSV files
      fetch('/data/olympics_dataset_with_country.csv')
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              setOlympicData(results.data);
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
            }
          });
        })
        .catch(error => {
          console.error('Error loading Olympic data:', error);
        });
    } catch (error) {
      console.error('Error loading Olympic data:', error);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Olympic Data Insights</h1>
      
      {olympicData.length > 0 ? (
        <HostCountryAdvantage data={olympicData} />
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default MiscellaneousPage;