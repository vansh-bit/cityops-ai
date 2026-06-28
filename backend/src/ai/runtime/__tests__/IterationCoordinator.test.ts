import { IterationCoordinator } from '../IterationCoordinator';
import { RuntimeStateManager } from '../RuntimeStateManager';
import { RuntimeExecutionError } from '../models/runtimeModels';
import { RuntimeLogger } from '../RuntimeLogger';

describe('IterationCoordinator', () => {
  let coordinator: IterationCoordinator;
  let stateManager: RuntimeStateManager;
  let mockLogger: jest.Mocked<RuntimeLogger>;

  beforeEach(() => {
    mockLogger = {
      logIterationStart: jest.fn(),
      logInitialization: jest.fn(),
      logCompletion: jest.fn(),
      logFailure: jest.fn()
    } as unknown as jest.Mocked<RuntimeLogger>;

    coordinator = new IterationCoordinator({ maxIterations: 3 }, mockLogger);
    stateManager = new RuntimeStateManager('r-1', 'c-1');
  });

  it('increments iteration count when within limits', () => {
    coordinator.prepareNextIteration(stateManager);
    expect(stateManager.getState().currentIteration).toBe(1);
    expect(mockLogger.logIterationStart).toHaveBeenCalledWith(1, 'c-1');
  });

  it('throws a fatal error when exceeding max iterations', () => {
    stateManager.incrementIteration();
    stateManager.incrementIteration();
    stateManager.incrementIteration(); // now at 3

    expect(() => coordinator.prepareNextIteration(stateManager)).toThrow(RuntimeExecutionError);
    try {
      coordinator.prepareNextIteration(stateManager);
    } catch (e: any) {
      expect(e.isRecoverable).toBe(false);
      expect(e.message).toContain('Maximum iterations (3) exceeded');
    }
  });
});
