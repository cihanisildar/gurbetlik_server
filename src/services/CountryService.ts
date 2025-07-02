import { getAllCountries } from '../repositories/CityRepository';

export const getCountries = async () => {
  try {
    const countries = await getAllCountries();
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries');
  }
}; 