import { RuntimeStateManager } from '../RuntimeStateManager';
import { RuntimeStatus } from '../models/runtimeModels';

describe('RuntimeStateManager', () => {
  it('initializes correctly', () => {
    const manager = new RuntimeStateManager('r-1', 'c-1');
    const state = manager.getState();
    expect(state.runtimeId).toBe('r-1');
    expect(state.correlationId).toBe('c-1');
    expect(state.status).toBe(RuntimeStatus.INITIALIZED);
    expect(state.currentIteration).toBe(0);
    expect(state.toolExecutions).toBe(0);
    expect(state.endTime).toBeNull();
  });

  it('updates status and sets endTime on completion', () => {
    const manager = new RuntimeStateManager('r-1', 'c-1');
    manager.setStatus(RuntimeStatus.COMPLETED);
    const state = manager.getState();
    expect(state.status).toBe(RuntimeStatus.COMPLETED);
    expect(state.endTime).not.toBeNull();
  });

  it('increments iterations and tools', () => {
    const manager = new RuntimeStateManager('r-1', 'c-1');
    manager.incrementIteration();
    manager.incrementToolExecutions();
    const state = manager.getState();
    expect(state.currentIteration).toBe(1);
    expect(state.toolExecutions).toBe(1);
  });

  it('sets failure correctly', () => {
    const manager = new RuntimeStateManager('r-1', 'c-1');
    manager.setFailure('Network error');
    const state = manager.getState();
    expect(state.status).toBe(RuntimeStatus.FAILED);
    expect(state.failureStatus).toBe('Network error');
    expect(state.endTime).not.toBeNull();
  });
});
