import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request, { params }) {
  try {
    const year = params.year;
    
    // Read the CSV files
    const athleticEventsPath = path.join(process.cwd(), 'public', 'athletic_events.csv');
    const nocRegionsPath = path.join(process.cwd(), 'public', 'noc_regions.csv');
    
    const athleticEventsData = fs.readFileSync(athleticEventsPath, 'utf8');
    const nocRegionsData = fs.readFileSync(nocRegionsPath, 'utf8');
    
    // Parse the CSV data
    const athleticEvents = parse(athleticEventsData, { 
      columns: true,
      skip_empty_lines: true
    });
    
    const nocRegions = parse(nocRegionsData, { 
      columns: true,
      skip_empty_lines: true
    });
    
    // Create a mapping of NOC codes to region names
    const nocToRegion = {};
    nocRegions.forEach(row => {
      nocToRegion[row.NOC] = row.region;
    });
    
    // Filter events by year if year parameter is provided
    const filteredEvents = year ? 
      athleticEvents.filter(event => event.Year === year) : 
      athleticEvents;
    
    // Process the athletic events to count medals by NOC
    const nocSummary = {};
    
    filteredEvents.forEach(event => {
      const noc = event.NOC;
      const medal = event.Medal;
      
      if (!nocSummary[noc]) {
        nocSummary[noc] = {
          region: nocToRegion[noc] || noc,
          medals: {
            gold: 0,
            silver: 0,
            bronze: 0
          },
          totalAthletes: 0,
          sportCounts: {},
          athleteIds: new Set()
        };
      }
      
      // Count medals
      if (medal && medal !== 'NA') {
        if (medal.toLowerCase() === 'gold') {
          nocSummary[noc].medals.gold += 1;
        } else if (medal.toLowerCase() === 'silver') {
          nocSummary[noc].medals.silver += 1;
        } else if (medal.toLowerCase() === 'bronze') {
          nocSummary[noc].medals.bronze += 1;
        }
      }
      
      // Count unique athletes
      nocSummary[noc].athleteIds.add(event.ID);
      
      // Count sports for top sport calculation
      const sport = event.Sport;
      if (sport) {
        nocSummary[noc].sportCounts[sport] = (nocSummary[noc].sportCounts[sport] || 0) + 1;
      }
    });
    
    // Calculate total athletes and find top sport for each NOC
    Object.keys(nocSummary).forEach(noc => {
      nocSummary[noc].totalAthletes = nocSummary[noc].athleteIds.size;
      delete nocSummary[noc].athleteIds; // Remove the set of IDs
      
      // Find top sport
      let topSport = '';
      let maxCount = 0;
      Object.entries(nocSummary[noc].sportCounts).forEach(([sport, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topSport = sport;
        }
      });
      nocSummary[noc].topSport = topSport;
      delete nocSummary[noc].sportCounts; // Remove the sport counts
    });
    
    // Return the processed data
    return NextResponse.json(nocSummary);
  } catch (error) {
    console.error('Error processing Olympic data:', error);
    return NextResponse.json({ error: 'Failed to process Olympic data' }, { status: 500 });
  }
}
