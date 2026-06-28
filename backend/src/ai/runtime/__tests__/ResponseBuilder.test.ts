import { ResponseBuilder } from '../ResponseBuilder';
import { RuntimeState, RuntimeStatus } from '../models/runtimeModels';

describe('ResponseBuilder', () => {
  it('builds a successful response correctly', () => {
    const builder = new ResponseBuilder();
    const state: RuntimeState = {
      runtimeId: 'r-1',
      correlationId: 'c-1',
      status: RuntimeStatus.COMPLETED,
      currentIteration: 2,
      toolExecutions: 1,
      startTime: new Date(Date.now() - 1000).toISOString(),
      endTime: new Date().toISOString(),
      failureStatus: null
    };

    const response = builder.buildResponse(state, null, null);
    
    expect(response.correlationId).toBe('c-1');
    expect(response.runtimeId).toBe('r-1');
    expect(response.status).toBe(RuntimeStatus.COMPLETED);
    expect(response.runtimeMetadata.iterations).toBe(2);
    expect(response.runtimeMetadata.toolExecutions).toBe(1);
    expect(response.runtimeMetadata.durationMs).toBeGreaterThan(0);
    expect(response.failureDetails).toBeUndefined();
  });

  it('builds a failure response correctly', () => {
    const builder = new ResponseBuilder();
    const state: RuntimeState = {
      runtimeId: 'r-1',
      correlationId: 'c-1',
      status: RuntimeStatus.FAILED,
      currentIteration: 0,
      toolExecutions: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      failureStatus: 'Something broke'
    };

    const response = builder.buildResponse(state, null, null);
    
    expect(response.status).toBe(RuntimeStatus.FAILED);
    expect(response.failureDetails).toBeDefined();
    expect(response.failureDetails?.message).toBe('Something broke');
    expect(response.failureDetails?.isRecoverable).toBe(false);
  });
});
