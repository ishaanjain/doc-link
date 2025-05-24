import axios from 'axios';
import { ConversionResponse, ErrorResponse } from '../types';

const API_URL = 'http://localhost:8000/api';

export const convertPdfsToText = async (files: File[]): Promise<ConversionResponse> => {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('pdfs', file);
    });
    
    const response = await axios.post<ConversionResponse>(
      `${API_URL}/convert`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as ErrorResponse;
    }
    throw { error: 'Failed to connect to server' };
  }
};

export const downloadTextFile = (filename: string): string => {
  return `${API_URL}/texts/${filename}`;
};