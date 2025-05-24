export interface FileWithPreview extends File {
  preview?: string;
}

export interface ConversionResult {
  originalName: string;
  textFilename: string;
  textContent: string;
  size: number;
}

export interface ConversionResponse {
  success: boolean;
  results: ConversionResult[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
}