import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Types
type City = {
  id: string;
  name: string;
  country: string;
  subcountry: string;
};

// Cache for parsed data
let citiesCache: City[] = [];
let countriesCache = new Set<string>();
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Function to load and parse CSV data
const loadData = async () => {
  const now = Date.now();
  if (citiesCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return;
  }

  try {
    const csvPath = path.join(process.cwd(), 'src', 'utils', 'world-cities.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    citiesCache = records.map((record: any) => ({
      id: record.geonameid,
      name: record.name,
      country: record.country,
      subcountry: record.subcountry
    }));

    // Build unique countries set
    countriesCache = new Set(citiesCache.map(city => city.country));

    cacheTimestamp = now;
    console.log(`Loaded ${citiesCache.length} cities and ${countriesCache.size} countries from CSV`);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw new Error('Failed to load city data');
  }
};

export const findById = async (id: string) => {
  await loadData();
  return citiesCache.find(city => city.id === id) || null;
};

export const findMany = async (query: any) => {
  await loadData();
  
  let filtered = [...citiesCache];
  
  // Apply filters
  if (query.country) {
    filtered = filtered.filter(city => 
      city.country === query.country
    );
  }

  if (query.search) {
    const search = query.search.toLowerCase();
    filtered = filtered.filter(city => 
      city.name.toLowerCase().includes(search)
    );
  }

  // Sort by name
  filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

  // If pagination is requested AND limit is provided
  if (query.page !== undefined) {
    const page = Math.max(1, Number(query.page));
    const limit = query.limit ? Math.max(1, Number(query.limit)) : filtered.length;
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);

    return {
      cities: paged,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: limit === 0 ? 0 : Math.ceil(filtered.length / limit),
        hasNext: limit === 0 ? false : page < Math.ceil(filtered.length / limit),
        hasPrev: page > 1
      }
    };
  }

  // Return all results if no pagination requested
  return {
    cities: filtered,
    pagination: {
      page: 1,
      limit: filtered.length,
      total: filtered.length,
      pages: 1,
      hasNext: false,
      hasPrev: false
    }
  };
};

export const findManyWithReviews = async (query: any) => {
  return findMany(query);
};

export const getAllCountries = async () => {
  await loadData();
  return Array.from(countriesCache)
    .sort()
    .map(name => ({ name }));
}; 