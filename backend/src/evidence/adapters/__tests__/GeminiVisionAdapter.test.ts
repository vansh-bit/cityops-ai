import { GeminiVisionAdapter } from '../GeminiVisionAdapter';
import { GoogleGenerativeAI, FinishReason } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('GeminiVisionAdapter', () => {
  let adapter: GeminiVisionAdapter;
  let mockGetGenerativeModel: jest.Mock;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test_key';
    
    mockGenerateContent = jest.fn();
    mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });
    
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    adapter = new GeminiVisionAdapter();
    adapter.initialize();
  });

  it('returns structured JSON on successful response', async () => {
    const mockJson = {
      issueType: 'POTHOLE',
      severity: 'HIGH',
      description: 'A pothole',
      observations: ['Deep hole'],
      potentialHazards: ['Trip hazard'],
      infrastructure: 'ROAD',
      inspectionPriority: 'HIGH',
      reasoningSummary: 'Because it is deep',
      limitations: []
    };
    
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockJson)
      }
    });

    const result = await adapter.extractObservations(Buffer.from('test'), 'image/jpeg');
    
    expect(result).toEqual(mockJson);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    
    // Check if signal was passed
    const callArgs = mockGenerateContent.mock.calls[0];
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('throws an error on malformed JSON response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Not JSON'
      }
    });

    await expect(adapter.extractObservations(Buffer.from('test'), 'image/jpeg'))
      .rejects.toThrow(SyntaxError);
  });

  it('throws CONTENT_NOT_SUPPORTED on FinishReason.SAFETY', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        candidates: [{ finishReason: FinishReason.SAFETY }],
        text: () => ''
      }
    });

    await expect(adapter.extractObservations(Buffer.from('test'), 'image/jpeg'))
      .rejects.toThrow('CONTENT_NOT_SUPPORTED');
  });

  it('retries once on timeout or transient error', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('network error 503'))
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ issueType: 'POTHOLE' })
        }
      });

    const result = await adapter.extractObservations(Buffer.from('test'), 'image/jpeg');
    
    expect(result.issueType).toBe('POTHOLE');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('fails after max retries', async () => {
    mockGenerateContent.mockRejectedValue(new Error('TIMEOUT: Gemini request exceeded 30 seconds'));

    await expect(adapter.extractObservations(Buffer.from('test'), 'image/jpeg'))
      .rejects.toThrow('TIMEOUT');
      
    expect(mockGenerateContent).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });

  it('does not retry non-transient errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Invalid API Key'));

    await expect(adapter.extractObservations(Buffer.from('test'), 'image/jpeg'))
      .rejects.toThrow('Invalid API Key');
      
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
