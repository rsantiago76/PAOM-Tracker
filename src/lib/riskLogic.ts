/**
 * Risk and Business Logic for Prioritization and SLA Tracking
 */

export const Severity = {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};

export const Likelihood = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
};

export const Impact = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
};

export const Status = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    MITIGATED: 'MITIGATED',
    ACCEPTED_RISK: 'ACCEPTED_RISK',
    FALSE_POSITIVE: 'FALSE_POSITIVE',
};

/**
 * Calculates Risk Score (1-9)
 * Maps LOW=1, MEDIUM=2, HIGH=3
 * @param {string} likelihood 
 * @param {string} impact 
 * @returns {number} 1-9
 */
export function calculateRiskScore(likelihood, impact) {
    const map = {
        [Likelihood.LOW]: 1,
        [Likelihood.MEDIUM]: 2,
        [Likelihood.HIGH]: 3,
        // Impact uses same keys
        'LOW': 1,
        'MEDIUM': 2,
        'HIGH': 3 // assuming Impact enums align
    };

    // Default to 1 if missing
    const L = map[likelihood] || 1;
    const I = map[impact] || 1;
    return L * I;
}

/**
 * Calculates Due Date based on Severity
 * CRITICAL: 7 days
 * HIGH: 30 days
 * MODERATE: 90 days
 * LOW: 180 days
 * @param {string} severity 
 * @param {Date} [startDate=new Date()] 
 * @returns {Date}
 */
export function calculateDueDate(severity, startDate = new Date()) {
    const date = new Date(startDate);
    switch (severity) {
        case Severity.CRITICAL:
            date.setDate(date.getDate() + 7);
            break;
        case Severity.HIGH:
            date.setDate(date.getDate() + 30);
            break;
        case Severity.MODERATE:
            date.setDate(date.getDate() + 90);
            break;
        case Severity.LOW:
            date.setDate(date.getDate() + 180);
            break;
        default:
            date.setDate(date.getDate() + 90); // Default to Moderate
    }
    return date;
}

/**
 * Checks if a finding is overdue
 * @param {object} finding - must have status and dueDate
 * @returns {boolean}
 */
export function isFindingOverdue(finding) {
    if (!finding.dueDate) return false;

    const isClosed = [Status.MITIGATED, Status.ACCEPTED_RISK, Status.FALSE_POSITIVE].includes(finding.status);
    if (isClosed) return false;

    const due = new Date(finding.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return due < today;
}

/**
 * Validates Status Transition
 * @param {string} newStatus 
 * @param {object} findingContext - needs evidence count or milestones
 * @returns {object} { valid: boolean, error: string }
 */
export function validateStatusTransition(newStatus, findingContext) {
    if (newStatus === Status.MITIGATED) {
        if ((findingContext.evidenceCount || 0) === 0 && (findingContext.completedMilestones || 0) === 0) {
            return { valid: false, error: "MITIGATED status requires at least one Evidence item or completed Milestone." };
        }
    }

    if (newStatus === Status.ACCEPTED_RISK) {
        if (!findingContext.riskAcceptanceRationale) {
            return { valid: false, error: "ACCEPTED_RISK requires a risk acceptance rationale." };
        }
    }

    return { valid: true };
}
