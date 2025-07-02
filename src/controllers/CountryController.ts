import { Request, Response } from 'express';
import { createErrorResponse } from '../types';
import * as countryService from '../services/CountryService';

export const getCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    const countries = await countryService.getCountries();
    res.json({ success: true, message: 'Countries retrieved successfully', data: countries });
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch countries', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 