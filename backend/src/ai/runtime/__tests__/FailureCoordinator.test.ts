import { FailureCoordinator } from '../FailureCoordinator';
import { RuntimeExecutionError } from '../models/runtimeModels';
import { RuntimeStateManager } from '../RuntimeStateManager';

describe('FailureCoordinator', () => {
  let coordinator: FailureCoordinator;
  let stateManager: RuntimeStateManager;

  beforeEach(() => {
    coordinator = new FailureCoordinator();
    stateManager = new RuntimeStateManager('r-1', 'c-1');
  });

  it('ignores recoverable errors without failing the runtime', () => {
    const error = new RuntimeExecutionError('Timeout', true);
    expect(() => coordinator.handleFailure(error, stateManager)).not.toThrow();
    
    // Status should still be initialized/running, not failed
    expect(stateManager.getState().status).not.toBe('FAILED');
  });

  it('throws and fails state on non-recoverable runtime errors', () => {
    const error = new RuntimeExecutionError('Fatal', false);
    expect(() => coordinator.handleFailure(error, stateManager)).toThrow('Fatal');
    expect(stateManager.getState().status).toBe('FAILED');
    expect(stateManager.getState().failureStatus).toBe('Fatal');
  });

  it('throws and fails state on unknown errors', () => {
    const error = new Error('Random explosion');
    expect(() => coordinator.handleFailure(error, stateManager)).toThrow(RuntimeExecutionError);
    expect(stateManager.getState().status).toBe('FAILED');
    expect(stateManager.getState().failureStatus).toBe('Random explosion');
  });
});
