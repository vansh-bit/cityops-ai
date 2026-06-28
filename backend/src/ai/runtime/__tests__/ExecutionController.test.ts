import { ExecutionController } from '../ExecutionController';
import { DecisionEngine } from '../../reasoning/DecisionEngine';
import { ToolDispatcher } from '../../../tools/registry/ToolDispatcher';
import { IterationCoordinator } from '../IterationCoordinator';
import { RuntimeStateManager } from '../RuntimeStateManager';
import { DecisionState } from '../../reasoning/models/decisionModels';

describe('ExecutionController', () => {
  let controller: ExecutionController;
  let mockDecisionEngine: jest.Mocked<DecisionEngine>;
  let mockToolDispatcher: jest.Mocked<ToolDispatcher>;
  let mockIterationCoordinator: jest.Mocked<IterationCoordinator>;

  beforeEach(() => {
    mockDecisionEngine = {
      startReasoning: jest.fn(),
      processObservationAndContinue: jest.fn()
    } as unknown as jest.Mocked<DecisionEngine>;

    mockToolDispatcher = {
      dispatch: jest.fn()
    } as unknown as jest.Mocked<ToolDispatcher>;

    mockIterationCoordinator = {
      prepareNextIteration: jest.fn()
    } as unknown as jest.Mocked<IterationCoordinator>;

    controller = new ExecutionController(
      mockDecisionEngine,
      mockToolDispatcher,
      mockIterationCoordinator
    );
  });

  it('runs reasoning loop until stopped immediately', async () => {
    const decisionState: DecisionState = {
      stopped: true,
      toolRequests: [],
      observations: []
    } as unknown as DecisionState;
    const stateManager = new RuntimeStateManager('r-1', 'c-1');

    mockDecisionEngine.startReasoning.mockResolvedValue({
      state: decisionState,
      isComplete: true
    });

    await controller.executeReasoningLoop({} as any, stateManager);

    expect(mockDecisionEngine.startReasoning).toHaveBeenCalledTimes(1);
    expect(mockIterationCoordinator.prepareNextIteration).not.toHaveBeenCalled();
    expect(mockToolDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches tools when requests exist', async () => {
    const stateManager = new RuntimeStateManager('r-1', 'c-1');

    mockDecisionEngine.startReasoning.mockResolvedValue({
      state: {} as any,
      toolRequest: { requestId: 'req-1' } as any,
      isComplete: false
    });

    mockToolDispatcher.dispatch.mockResolvedValue({ requestId: 'req-1', observationId: 'obs-1' } as any);

    mockDecisionEngine.processObservationAndContinue.mockResolvedValue({
      state: { stopped: true } as any,
      isComplete: true
    });

    await controller.executeReasoningLoop({} as any, stateManager);

    expect(mockDecisionEngine.startReasoning).toHaveBeenCalledTimes(1);
    expect(mockIterationCoordinator.prepareNextIteration).toHaveBeenCalledTimes(1);
    expect(mockToolDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockDecisionEngine.processObservationAndContinue).toHaveBeenCalledTimes(1);
    expect(stateManager.getState().toolExecutions).toBe(1);
  });
});
