import {
  createPythonLifecycleSupervisorBridge,
  runAuthoritativeLedgerWaveWithAttachedHostTasks,
} from '../../../../scripts/lib/agentgraph-codex-task-runner.mjs';

export function createGovernedAgentGraphWaveController({
  pythonLifecycle,
  saveState,
  createLifecycleBridge = createPythonLifecycleSupervisorBridge,
  runWave = runAuthoritativeLedgerWaveWithAttachedHostTasks,
  ...waveInput
}) {
  const lifecycleSupervisor = createLifecycleBridge(pythonLifecycle);
  let preserved = false;
  let closed = false;
  const preservingSaveState = async (snapshot) => {
    await saveState(snapshot);
    preserved =
      ['complete', 'halted'].includes(snapshot.executionState?.status) ||
      ['prepared', 'finalized'].includes(snapshot.lifecycleFinalization?.phase);
  };
  return {
    async run(overrides = {}) {
      if (closed) throw new Error('governed wave controller is closed');
      return runWave({
        ...waveInput,
        ...overrides,
        lifecycleSupervisor,
        saveState: preservingSaveState,
      });
    },
    async close({ terminalPreserved = false } = {}) {
      if (!terminalPreserved || !preserved) {
        throw new Error('cannot close lifecycle supervisor before terminal preservation');
      }
      if (!closed) {
        await lifecycleSupervisor.close();
        closed = true;
      }
    },
  };
}
