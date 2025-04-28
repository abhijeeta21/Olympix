import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

const athletesFilePath = path.join(process.cwd(), 'public', 'data', 'athlete_events.csv'); 
const regionsFilePath = path.join(process.cwd(), 'public', 'data', 'noc_regions.csv');

export async function processOlympicsData() {
  return new Promise((resolve, reject) => {
    let athleteData = [];
    let regionData = {};

    // Load regions first
    fs.createReadStream(regionsFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.NOC) {
          regionData[row.NOC] = row.region || 'Unknown';
        }
      })
      .on('end', () => {
        let countryStats = {};

        fs.createReadStream(athletesFilePath)
          .pipe(csvParser())
          .on('data', (row) => {
            const noc = row.NOC;
            if (!noc) return;

            if (!countryStats[noc]) {
              countryStats[noc] = {
                noc,
                region: regionData[noc] || 'Unknown',
                medals: { gold: 0, silver: 0, bronze: 0 },
                totalAthletes: new Set(),
                sportCount: {},
              };
            }

            // Track total athletes (by unique Name)
            countryStats[noc].totalAthletes.add(row.Name);

            // Count medals
            if (row.Medal === 'Gold') countryStats[noc].medals.gold++;
            if (row.Medal === 'Silver') countryStats[noc].medals.silver++;
            if (row.Medal === 'Bronze') countryStats[noc].medals.bronze++;

            // Track most common sport
            if (row.Sport) {
              countryStats[noc].sportCount[row.Sport] = 
                (countryStats[noc].sportCount[row.Sport] || 0) + 1;
            }
          })
          .on('end', () => {
            // Finalize stats
            const finalData = Object.values(countryStats).map((country) => ({
              noc: country.noc,
              region: country.region,
              medals: country.medals,
              totalAthletes: country.totalAthletes.size,
              topSport: Object.keys(country.sportCount).reduce((a, b) =>
                country.sportCount[a] > country.sportCount[b] ? a : b, "Unknown"),
            }));

            resolve(finalData);
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}
