/**
 * Recovery-Aware Intervention Selection Engine (RAISE)
 * v2 — Hint Ledger, HDI, Self-Recovery Prediction, Minimum Sufficient Help,
 * Progress Verification, Integrity Risk Adjustment, SUPPORT_NOTIFY, Evidence Logging
 */

const store = require('./raiseStore');

const CONFIG = {
  ALPHA: 0.35,           // EMA Smoothing Factor
  BETA: 0.5,             // Momentum Acceleration
  TAU_REC: 0.35,         // Recovery Gating Threshold for P_sr
  TAU_FRICT: 45.0,       // Minimum Friction Activation
  TAU_CRITICAL: 80.0,    // Critical Friction for Faculty Alert
  COOLDOWN_ATTEMPTS: 2,  // Minimum attempts before next intervention
  STUCK_EPSILON: 2.0,    // Momentum threshold for stagnation
  STUCK_S_ATTEMPTS: 3,   // Attempts needed for stagnation
  DARS_EVAL_WINDOW: 3,   // V attempts for evaluating DARS
  DARS_DISCOUNT: 0.6,    // gamma (hint dependency penalty)
  LEARNING_RATE: 0.2,    // eta
  TARGET_REDUCTION: 0.25,// Fraction of S_k to reduce per intervention
  SUPPORT_FRICT_MIN: 35.0, // Friction that triggers SUPPORT_NOTIFY when stuck
  INTEGRITY_HINT_PENALTY: 15, // Max integrity risk penalty for hint over-reliance
  INTEGRITY_CREDIT: 10,      // Max integrity credit for corroborating progress
};

const DEFAULT_Q = { l1: 20.0, l2: 30.0, l3: 40.0 };

const HINT_LEVELS = ['l1', 'l2', 'l3'];

function emptyState() {
  return {
    S_k: 0.0,
    M_k: 0.0,
    attemptsSinceLastIntervention: 100,
    pendingEvaluation: null,
    rawFrictionCount: 0,
    hintRequestsCount: 0,
    successCount: 0,
    failCount: 0,
    independentRecoveryCount: 0,
    hintMediatedRecoveryCount: 0,
    consistentProgress: 0.0,
    verifiedProgress: 0.0,
    lastFriction: 0.0,
    lastMomentum: 0.0,
    lastStuck: false,
    lastHintLevel: null,
    lastAction: null,
    lastDecisionReason: null,
    consecutiveFails: 0,
  };
}

async function loadState(studentId) {
  const row = await store.getState(studentId);
  if (!row) return emptyState();
  return {
    ...emptyState(),
    ...row,
    S_k: row.S_k || 0,
    M_k: row.M_k || 0,
    attemptsSinceLastIntervention: row.attempts_since_last_intervention ?? 100,
    pendingEvaluation: row.pendingEvaluation,
    rawFrictionCount: row.raw_friction_count || 0,
    hintRequestsCount: row.hint_requests_count || 0,
    successCount: row.success_count || 0,
    failCount: row.fail_count || 0,
    independentRecoveryCount: row.independent_recovery_count || 0,
    hintMediatedRecoveryCount: row.hint_mediated_recovery_count || 0,
    consistentProgress: row.consistent_progress || 0,
    verifiedProgress: row.verified_progress || 0,
    lastFriction: row.last_friction || 0,
    lastMomentum: row.last_momentum || 0,
    lastStuck: !!row.last_stuck,
    lastHintLevel: row.last_hint_level || null,
    lastAction: row.last_action || null,
    lastDecisionReason: row.last_decision_reason || null,
    consecutiveFails: row.consecutive_fails || 0,
    q: row.q ? row.q : { ...DEFAULT_Q },
  };
}

function hintContentFor(level) {
  const templates = {
    l1: 'Review the concept and locate the specific syntax/step that failed. Try it once more on your own.',
    l2: 'Break the problem into smaller parts. Identify which table/algorithm rule your attempt violates.',
    l3: 'Guided walkthrough: compare your query/output to the expected schema and trace each step.',
  };
  return templates[level] || templates.l1;
}

async function computeHDI(studentId) {
  const state = await loadState(studentId);
  const total = state.independentRecoveryCount + state.hintMediatedRecoveryCount;
  if (total === 0) return 0.0;
  return Math.min(1.0, state.hintMediatedRecoveryCount / total);
}

async function predictRecovery(studentId) {
  const state = await loadState(studentId);
  const total = state.independentRecoveryCount + state.hintMediatedRecoveryCount;
  const empirical = total > 0 ? state.independentRecoveryCount / total : 0.5;
  let p = 0.5 * empirical + 0.25; // blend with prior
  if (state.lastStuck) p -= 0.15;
  if (state.S_k >= CONFIG.TAU_CRITICAL) p -= 0.2;
  if (state.consecutiveFails >= 2) p -= Math.min(0.3, 0.1 * state.consecutiveFails);
  if (state.S_k < CONFIG.TAU_FRICT) p += 0.1;
  if (state.lastAction === 'DELIVER_INTERVENTION' || state.lastAction === 'SUPPORT_NOTIFY') p -= 0.05;
  return Math.min(1.0, Math.max(0.0, p));
}

async function adjustIntegrityRisk(studentId, baseRisk = 0) {
  const state = await loadState(studentId);
  const hdi = await computeHDI(studentId);
  const totalRecovery = state.independentRecoveryCount + state.hintMediatedRecoveryCount;

  // Over-reliance on hints raises integrity concern (possible external help).
  let penalty = 0;
  if (hdi > 0.5 && totalRecovery >= 2) {
    penalty = Math.min(CONFIG.INTEGRITY_HINT_PENALTY, Math.round(hdi * CONFIG.INTEGRITY_HINT_PENALTY));
  }

  // Corroborating evidence: consistent independent progress + low anomaly lowers risk.
  let credit = 0;
  if (state.consistentProgress >= 60 && hdi < 0.4) {
    credit = CONFIG.INTEGRITY_CREDIT;
  }

  const adjusted = Math.min(100, Math.max(0, Math.round(baseRisk + penalty - credit)));
  return { adjusted, hdi, penalty, credit, baseRisk };
}

async function selectMinSufficientHelp(studentId, S_k) {
  const state = await loadState(studentId);
  const total = state.independentRecoveryCount + state.hintMediatedRecoveryCount;
  const hdi = total > 0 ? state.hintMediatedRecoveryCount / total : 0.0;
  const q = state.q || { ...DEFAULT_Q };

  const target = CONFIG.TARGET_REDUCTION * S_k;
  for (const lvl of HINT_LEVELS) {
    if (q[lvl] !== undefined && q[lvl] >= target) {
      // Prefer a smaller step (l1) when dependency is high: avoid reinforcing reliance.
      if (hdi > 0.6 && lvl === 'l3') continue;
      return { level: lvl, targetReduction: target, expectedGain: q[lvl] };
    }
  }
  return null;
}

/**
 * Record a hint request into the ledger and return a level + content.
 */
async function requestHint({ studentId, question = '', currentProgress = 0, hintLevelOverride = null, skipLedger = false }) {
  const state = await loadState(studentId);
  state.hintRequestsCount += 1;

  let level = hintLevelOverride;
  if (!level) {
    const choice = await selectMinSufficientHelp(studentId, state.S_k || 50);
    level = choice ? choice.level : 'l1';
  }
  state.lastHintLevel = level;
  state.lastAction = 'HINT_GRANTED';

  // No-ledger mode (ablation): deliver generic help without recording dependency evidence.
  if (skipLedger) {
    level = hintLevelOverride || 'l3';
    state.lastHintLevel = level;
    await store.upsertState(studentId, state);
    return {
      id: null,
      level,
      content: hintContentFor(level),
      question,
      beforeProgress: currentProgress,
      ledgerRecorded: false,
    };
  }

  const ledger = await store.addHintLedger({
    studentId,
    hintLevel: level,
    hintContent: hintContentFor(level),
    question,
    beforeProgress: currentProgress,
    afterProgress: 0,
    progressDelta: 0,
    outcome: 'PENDING',
    recovered: false,
  });

  await store.upsertState(studentId, state);
  await store.addEvidence({
    studentId,
    eventType: 'HINT_REQUEST',
    decision: `HINT_GRANTED_${level.toUpperCase()}`,
    contributingSignals: { S_k: state.S_k, hintRequests: state.hintRequestsCount },
    scores: {},
    hintReference: ledger.lastID,
  });

  return {
    id: ledger.lastID,
    level,
    content: hintContentFor(level),
    question,
    beforeProgress: currentProgress,
  };
}

/**
 * Verify whether a provided hint led to recovery. Update ledger outcome,
 * classify recovery (independent vs hint-mediated), and run DARS evaluation.
 */
async function verifyRecovery({ studentId, hintId = null, recovered = false, afterProgress = 0, independent = false }) {
  const state = await loadState(studentId);

  if (independent) {
    state.independentRecoveryCount += 1;
  } else if (recovered) {
    state.hintMediatedRecoveryCount += 1;
  }

  if (hintId) {
    const before = (await store.getHintLedger(studentId, 100)).find((h) => h.id === hintId);
    const beforeProgress = before ? before.beforeProgress : state.consistentProgress;
    const delta = Math.max(0, afterProgress - beforeProgress);
    await store.updateHintLedger(hintId, {
      afterProgress,
      progressDelta: delta,
      outcome: recovered ? 'RECOVERED' : 'NOT_RECOVERED',
      recovered,
    });
    if (recovered) state.consistentProgress = afterProgress;
  }

  // Progress verification: independent progress is the only "verified" progress.
  state.verifiedProgress = independent
    ? Math.max(state.verifiedProgress, afterProgress)
    : state.verifiedProgress;

  // DARS evaluator: reward/punish the last intervention level based on recovery outcome.
  if (state.pendingEvaluation && (recovered || independent)) {
    const evalState = state.pendingEvaluation;
    evalState.S_kSum += state.S_k;
    evalState.attemptsPassed += 1;
    if (state.hintRequestsCount > 0) evalState.hintRequests += 1;

    if (evalState.attemptsPassed >= CONFIG.DARS_EVAL_WINDOW) {
      const avgPostS = evalState.S_kSum / evalState.attemptsPassed;
      const deltaS = Math.max(0, evalState.start_S_k - avgPostS);
      const dependencyRatio = Math.min(1.0, evalState.hintRequests / evalState.attemptsPassed);
      const dars = deltaS * (1 - CONFIG.DARS_DISCOUNT * dependencyRatio);
      const q = state.q ? { ...state.q } : { ...DEFAULT_Q };
      const lvl = evalState.level;
      q[lvl] = (1 - CONFIG.LEARNING_RATE) * (q[lvl] || 0) + CONFIG.LEARNING_RATE * dars;
      state.q = q;
      state.pendingEvaluation = null;
    }
  }

  await store.upsertState(studentId, state);
  await store.addEvidence({
    studentId,
    eventType: 'RECOVERY_VERIFICATION',
    decision: independent ? 'INDEPENDENT_RECOVERY' : recovered ? 'HINT_MEDIATED_RECOVERY' : 'NO_RECOVERY',
    contributingSignals: { hintId, afterProgress },
    scores: {},
    hintReference: hintId,
  });

  return {
    hintId,
    recovered,
    independent,
    HDI: await computeHDI(studentId),
    P_sr: await predictRecovery(studentId),
  };
}

/**
 * Process a new execution attempt (RUN event). Updates friction/momentum,
 * detects stagnation, gates on recovery probability, and selects an action.
 */
async function processAttempt({ studentId, rawFriction = 0, hintRequests = 0, success = true, progress = 0, baseIntegrityRisk = 0 }) {
  const state = await loadState(studentId);

  state.rawFrictionCount += 1;
  if (success) {
    state.successCount += 1;
    state.consecutiveFails = 0;
  } else {
    state.failCount += 1;
    state.consecutiveFails += 1;
  }
  state.hintRequestsCount += hintRequests;

  // 1. Exponential Smoothing and Momentum
  state.S_k_prev = state.lastFriction;
  state.S_k = CONFIG.ALPHA * rawFriction + (1 - CONFIG.ALPHA) * state.S_k;
  state.M_k = (state.S_k - state.S_k_prev) + CONFIG.BETA * (state.M_k || 0);
  state.lastFriction = state.S_k;
  state.lastMomentum = state.M_k;

  state.attemptsSinceLastIntervention += 1;

  // 2. Stagnation Indicator (stuck_k) - persistent friction w/o momentum
  let stuck = false;
  if (state.S_k >= CONFIG.TAU_FRICT && Math.abs(state.M_k) <= CONFIG.STUCK_EPSILON) {
    if (state.S_k_prev !== undefined && state.S_k_prev >= CONFIG.TAU_FRICT) {
      stuck = true;
    }
  }
  state.lastStuck = stuck;

  // 3. Cooldown
  if (state.attemptsSinceLastIntervention < CONFIG.COOLDOWN_ATTEMPTS) {
    state.lastAction = 'WAIT';
    state.lastDecisionReason = 'Cooldown active';
    await store.upsertState(studentId, state);
    await store.addEvidence({
      studentId,
      eventType: 'ATTEMPT',
      decision: 'WAIT', // cooldown
      contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck },
      scores: {},
    });
    return {
      action: 'WAIT',
      reason: 'Cooldown active',
      S_k: state.S_k, M_k: state.M_k, stuck,
      HDI: await computeHDI(studentId),
      P_sr: await predictRecovery(studentId),
      integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
    };
  }

  // 4. Critical friction -> faculty alert
  if (state.S_k >= CONFIG.TAU_CRITICAL) {
    state.attemptsSinceLastIntervention = 0;
    state.lastAction = 'FACULTY_ALERT';
    state.lastDecisionReason = 'Critical friction threshold exceeded';
    await store.upsertState(studentId, state);
    await store.addEvidence({
      studentId,
      eventType: 'ATTEMPT',
      decision: 'FACULTY_ALERT',
      contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck },
      scores: { TAU_CRITICAL: CONFIG.TAU_CRITICAL },
    });
    return {
      action: 'FACULTY_ALERT', level: 'l4',
      reason: 'Critical friction threshold exceeded',
      S_k: state.S_k, M_k: state.M_k, stuck,
      HDI: await computeHDI(studentId),
      P_sr: await predictRecovery(studentId),
      integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
    };
  }

  // 5. Recovery probability gating
  const p_rec = await predictRecovery(studentId);
  const hdi = await computeHDI(studentId);

  // 6. SUPPORT_NOTIFY — stuck learner (no momentum, repeated failures): faculty support, NOT a violation
  if (stuck && state.S_k >= CONFIG.SUPPORT_FRICT_MIN && state.failCount >= 2 && p_rec < CONFIG.TAU_REC) {
    state.attemptsSinceLastIntervention = 0;
    state.lastAction = 'SUPPORT_NOTIFY';
    state.lastDecisionReason = 'Struggling learner flagged for faculty support (not a violation)';
    await store.upsertState(studentId, state);
    await store.addEvidence({
      studentId,
      eventType: 'ATTEMPT',
      decision: 'SUPPORT_NOTIFY',
      contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck, p_rec, hdi, consecutiveFails: state.consecutiveFails },
      scores: {},
    });
    return {
      action: 'SUPPORT_NOTIFY',
      reason: 'Struggling learner flagged for faculty support (not a violation)',
      S_k: state.S_k, M_k: state.M_k, stuck,
      HDI: hdi, P_sr: p_rec,
      supportType: 'SUPPORT_NOTIFY',
      integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
    };
  }

  // 7. Min-Sufficient Help — active learner (momentum > 0), hint pipeline appropriate
  if (p_rec < CONFIG.TAU_REC && state.S_k >= CONFIG.TAU_FRICT && state.M_k > 0) {
    // 6. Min-Sufficient Help Selection
    const choice = await selectMinSufficientHelp(studentId, state.S_k);

    if (!choice) {
      state.attemptsSinceLastIntervention = 0;
      state.lastAction = 'FACULTY_ALERT';
      state.lastDecisionReason = 'Max expected DARS gain across automated levels < target';
      await store.upsertState(studentId, state);
      await store.addEvidence({
        studentId,
        eventType: 'ATTEMPT',
        decision: 'FACULTY_ALERT',
        contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck, p_rec, hdi },
        scores: {},
      });
      return {
        action: 'FACULTY_ALERT', level: 'l4',
        reason: 'Max expected gain below target; faculty required',
        S_k: state.S_k, M_k: state.M_k, stuck,
        HDI: hdi, P_sr: p_rec,
        integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
      };
    }

    state.attemptsSinceLastIntervention = 0;
    state.lastAction = 'DELIVER_INTERVENTION';
    state.lastDecisionReason = `Min-sufficient help L${choice.level.slice(1)}`;

    // DARS evaluator armed for the selected level
    state.pendingEvaluation = {
      level: choice.level,
      start_S_k: state.S_k,
      attemptsPassed: 0,
      hintRequests: 0,
      S_kSum: 0,
    };

    await store.upsertState(studentId, state);
    await store.addEvidence({
      studentId,
      eventType: 'ATTEMPT',
      decision: `INTERVENE_${choice.level.toUpperCase()}`,
      contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck, p_rec, hdi },
      scores: { targetReduction: choice.targetReduction, expectedGain: choice.expectedGain },
    });

    return {
      action: 'DELIVER_INTERVENTION', level: choice.level,
      reason: 'Intervention pipeline triggered',
      S_k: state.S_k, M_k: state.M_k, stuck,
      HDI: hdi, P_sr: p_rec,
      targetReduction: choice.targetReduction,
      expectedGain: choice.expectedGain,
      integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
    };
  }

  // 8. Otherwise WAIT (productive struggle or below threshold)
  state.lastAction = 'WAIT';
  state.lastDecisionReason = p_rec >= CONFIG.TAU_REC && state.S_k >= CONFIG.TAU_FRICT
    ? 'Productive struggle (p_rec >= tau_rec)'
    : 'Friction below threshold or negative momentum';
  await store.upsertState(studentId, state);
  await store.addEvidence({
    studentId,
    eventType: 'ATTEMPT',
    decision: 'WAIT',
    contributingSignals: { S_k: state.S_k, M_k: state.M_k, stuck, p_rec, hdi },
    scores: {},
  });
  return {
    action: 'WAIT', level: null,
    reason: state.lastDecisionReason,
    S_k: state.S_k, M_k: state.M_k, stuck,
    HDI: hdi, P_sr: p_rec,
    integrity: await adjustIntegrityRisk(studentId, baseIntegrityRisk),
  };
}

async function getDiagnostics(studentId) {
  const state = await loadState(studentId);
  return {
    studentId,
    S_k: state.lastFriction || state.S_k,
    M_k: state.lastMomentum || state.M_k,
    stuck: state.lastStuck,
    HDI: await computeHDI(studentId),
    P_sr: await predictRecovery(studentId),
    hintRequests: state.hintRequestsCount,
    successes: state.successCount,
    failures: state.failCount,
    independentRecoveries: state.independentRecoveryCount,
    hintMediatedRecoveries: state.hintMediatedRecoveryCount,
    consistentProgress: state.consistentProgress,
    verifiedProgress: state.verifiedProgress,
    lastAction: state.lastAction,
    lastReason: state.lastDecisionReason,
    lastHintLevel: state.lastHintLevel,
  };
}

module.exports = {
  CONFIG,
  DEFAULT_Q,
  processAttempt,
  requestHint,
  verifyRecovery,
  getDiagnostics,
  computeHDI,
  predictRecovery,
  adjustIntegrityRisk,
  selectMinSufficientHelp,
  hintContentFor,
  resetStudent: store.resetStudent,
};