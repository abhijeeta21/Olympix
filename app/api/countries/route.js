import { processOlympicsData } from '../../../utils/processOlympicsData';

export async function GET(req, res) {
  try {
    const data = await processOlympicsData();
    const cleanedCountries = data.filter(
        (c) => c.name && c.name.trim() !== ""
      );
    return Response.json(cleanedCountries);
  } catch (error) {
    console.error('Error processing Olympics data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
