import { logger } from '../utils/logger';

/**
 * Advanced Analytics Service
 * Provides intelligent insights, gap detection, and recommendations
 */
export class AdvancedAnalyticsService {
  /**
   * Detect coverage gaps - entities without sufficient assignment coverage
   * @param {Array} entities - All entities
   * @param {Object} schedule - Current schedule with assignments
   * @returns {Array} - Entities with coverage issues
   */
  static detectCoverageGaps(entities, schedule) {
    const gaps = [];

    if (!schedule || !schedule.assignments) {
      return entities.map(entity => ({
        entity: entity.name,
        severity: 'critical',
        issue: 'No schedule data available',
        assignedCount: 0,
        recommendedCount: 2
      }));
    }

    // Track which entities are assigned
    const entityAssignments = {};

    // Count assignments per entity from all assignment types
    Object.values(schedule.assignments).forEach(assignment => {
      // DAR assignments
      if (assignment.dars && Array.isArray(assignment.dars)) {
        assignment.dars.forEach(darIndex => {
          const darEntities = schedule.darEntities?.[darIndex] || [];
          darEntities.forEach(entityName => {
            entityAssignments[entityName] = (entityAssignments[entityName] || 0) + 1;
          });
        });
      }

      // New Incoming assignments
      if (assignment.newIncoming && Array.isArray(assignment.newIncoming)) {
        assignment.newIncoming.forEach(entityName => {
          entityAssignments[entityName] = (entityAssignments[entityName] || 0) + 1;
        });
      }

      // Cross Training assignments
      if (assignment.crossTraining && Array.isArray(assignment.crossTraining)) {
        assignment.crossTraining.forEach(entityName => {
          entityAssignments[entityName] = (entityAssignments[entityName] || 0) + 1;
        });
      }
    });

    // Check each entity for coverage
    entities.forEach(entity => {
      const assignedCount = entityAssignments[entity.name] || 0;
      const recommendedCount = 2; // Minimum recommended coverage

      if (assignedCount === 0) {
        gaps.push({
          entity: entity.name,
          severity: 'critical',
          issue: 'No coverage assigned',
          assignedCount: 0,
          recommendedCount,
          recommendation: `Assign at least ${recommendedCount} reviewers to ${entity.name}`
        });
      } else if (assignedCount < recommendedCount) {
        gaps.push({
          entity: entity.name,
          severity: 'warning',
          issue: 'Insufficient coverage',
          assignedCount,
          recommendedCount,
          recommendation: `Add ${recommendedCount - assignedCount} more reviewer(s) to ${entity.name}`
        });
      }
    });

    return gaps.sort((a, b) => {
      // Sort by severity (critical first) then by entity name
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return a.entity.localeCompare(b.entity);
    });
  }

  /**
   * Analyze workload balance across employees
   * @param {Array} employees - All employees
   * @param {Object} schedule - Current schedule with assignments
   * @returns {Object} - Workload analysis with balance metrics
   */
  static analyzeWorkloadBalance(employees, schedule) {
    if (!schedule || !schedule.assignments) {
      return {
        balanced: false,
        averageWorkload: 0,
        standardDeviation: 0,
        overloaded: [],
        underutilized: [],
        recommendations: ['No schedule data available for analysis']
      };
    }

    const workloads = [];
    const employeeWorkloads = {};

    employees.forEach(employee => {
      const assignment = schedule.assignments[employee.id];
      let workloadScore = 0;

      if (assignment) {
        // Weight different assignment types
        if (assignment.dars) workloadScore += assignment.dars.length * 3; // DARs are heavy
        if (assignment.newIncoming) workloadScore += assignment.newIncoming.length * 2;
        if (assignment.crossTraining) workloadScore += assignment.crossTraining.length * 1.5;
        if (assignment.cpoe) workloadScore += 2;
        if (assignment.specialProjects) {
          if (assignment.specialProjects.float) workloadScore += 1;
          if (assignment.specialProjects.threePEmail) workloadScore += 1.5;
          if (assignment.specialProjects.threePBackupEmail) workloadScore += 1;
        }
      }

      workloads.push(workloadScore);
      employeeWorkloads[employee.id] = {
        name: employee.name,
        score: workloadScore
      };
    });

    // Calculate statistics
    const average = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const variance = workloads.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / workloads.length;
    const stdDev = Math.sqrt(variance);

    // Identify overloaded and underutilized employees
    const threshold = average * 0.3; // 30% deviation threshold
    const overloaded = [];
    const underutilized = [];

    Object.entries(employeeWorkloads).forEach(([id, data]) => {
      if (data.score > average + threshold) {
        overloaded.push({
          id,
          name: data.name,
          score: data.score,
          deviation: ((data.score - average) / average * 100).toFixed(1)
        });
      } else if (data.score < average - threshold && data.score > 0) {
        underutilized.push({
          id,
          name: data.name,
          score: data.score,
          deviation: ((average - data.score) / average * 100).toFixed(1)
        });
      }
    });

    // Generate recommendations
    const recommendations = [];
    if (overloaded.length > 0) {
      overloaded.forEach(emp => {
        recommendations.push(`Consider reducing workload for ${emp.name} (${emp.deviation}% above average)`);
      });
    }
    if (underutilized.length > 0) {
      underutilized.forEach(emp => {
        recommendations.push(`${emp.name} has capacity for additional assignments (${emp.deviation}% below average)`);
      });
    }
    if (stdDev > average * 0.5) {
      recommendations.push('High workload variance detected - consider redistributing assignments');
    }

    return {
      balanced: stdDev < average * 0.3,
      averageWorkload: parseFloat(average.toFixed(2)),
      standardDeviation: parseFloat(stdDev.toFixed(2)),
      coefficient: average > 0 ? parseFloat((stdDev / average).toFixed(2)) : 0,
      overloaded: overloaded.sort((a, b) => b.score - a.score),
      underutilized: underutilized.sort((a, b) => a.score - b.score),
      recommendations,
      employeeWorkloads: Object.entries(employeeWorkloads).map(([id, data]) => ({
        id,
        ...data,
        percentOfAverage: average > 0 ? parseFloat(((data.score / average) * 100).toFixed(1)) : 0
      }))
    };
  }

  /**
   * Analyze rotation patterns across schedules
   * @param {Array} schedules - Historical schedules
   * @param {Array} employees - All employees
   * @returns {Object} - Rotation analysis
   */
  static analyzeRotationPatterns(schedules, employees) {
    if (!schedules || schedules.length < 2) {
      return {
        hasPattern: false,
        message: 'Need at least 2 schedules to analyze rotation patterns',
        employeeRotations: []
      };
    }

    const employeeRotations = {};

    // Initialize tracking for each employee
    employees.forEach(emp => {
      employeeRotations[emp.id] = {
        name: emp.name,
        scheduleCount: 0,
        darAssignments: [],
        entityAssignments: new Set(),
        cpoeCount: 0,
        floatCount: 0
      };
    });

    // Analyze each schedule
    schedules.slice(0, 6).forEach((schedule, idx) => {
      if (!schedule.assignments) return;

      Object.entries(schedule.assignments).forEach(([empId, assignment]) => {
        if (!employeeRotations[empId]) return;

        const rotation = employeeRotations[empId];
        rotation.scheduleCount++;

        // Track DAR rotations
        if (assignment.dars && assignment.dars.length > 0) {
          rotation.darAssignments.push({
            scheduleIndex: idx,
            darColumns: assignment.dars
          });
        }

        // Track entity exposure
        if (assignment.newIncoming) {
          assignment.newIncoming.forEach(entity => rotation.entityAssignments.add(entity));
        }
        if (assignment.crossTraining) {
          assignment.crossTraining.forEach(entity => rotation.entityAssignments.add(entity));
        }

        // Track special assignments
        if (assignment.cpoe) rotation.cpoeCount++;
        if (assignment.specialProjects?.float) rotation.floatCount++;
      });
    });

    // Calculate rotation metrics
    const rotationAnalysis = Object.values(employeeRotations).map(rotation => {
      const entityVariety = rotation.entityAssignments.size;
      const scheduleParticipation = rotation.scheduleCount / Math.min(schedules.length, 6) * 100;

      return {
        name: rotation.name,
        scheduleParticipation: parseFloat(scheduleParticipation.toFixed(1)),
        entityVariety,
        darRotationCount: rotation.darAssignments.length,
        cpoeAssignments: rotation.cpoeCount,
        floatAssignments: rotation.floatCount,
        isRotating: rotation.darAssignments.length > 1,
        diversityScore: entityVariety + rotation.darAssignments.length
      };
    }).filter(r => r.scheduleParticipation > 0);

    // Generate insights
    const recommendations = [];
    rotationAnalysis.forEach(analysis => {
      if (analysis.entityVariety < 3 && analysis.scheduleParticipation > 50) {
        recommendations.push(`${analysis.name} could benefit from more entity variety (currently ${analysis.entityVariety} entities)`);
      }
      if (analysis.darRotationCount === 0 && analysis.scheduleParticipation > 30) {
        recommendations.push(`Consider rotating ${analysis.name} through different DAR columns`);
      }
    });

    return {
      hasPattern: rotationAnalysis.some(r => r.isRotating),
      employeeRotations: rotationAnalysis.sort((a, b) => b.diversityScore - a.diversityScore),
      recommendations,
      averageEntityVariety: rotationAnalysis.length > 0
        ? parseFloat((rotationAnalysis.reduce((sum, r) => sum + r.entityVariety, 0) / rotationAnalysis.length).toFixed(1))
        : 0
    };
  }

  /**
   * Calculate overall schedule health score
   * @param {Object} schedule - Current schedule
   * @param {Array} employees - All employees
   * @param {Array} entities - All entities
   * @returns {Object} - Health score and breakdown
   */
  static calculateScheduleHealth(schedule, employees, entities) {
    let healthScore = 100;
    const issues = [];
    const breakdown = {};

    // Coverage completeness (40 points)
    const gaps = this.detectCoverageGaps(entities, schedule);
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
    const warningGaps = gaps.filter(g => g.severity === 'warning').length;

    const coverageScore = Math.max(0, 40 - (criticalGaps * 5) - (warningGaps * 2));
    breakdown.coverage = coverageScore;
    healthScore -= (40 - coverageScore);

    if (criticalGaps > 0) {
      issues.push(`${criticalGaps} entit${criticalGaps === 1 ? 'y' : 'ies'} with no coverage`);
    }
    if (warningGaps > 0) {
      issues.push(`${warningGaps} entit${warningGaps === 1 ? 'y' : 'ies'} with low coverage`);
    }

    // Workload balance (30 points)
    const workloadAnalysis = this.analyzeWorkloadBalance(employees, schedule);
    const balanceScore = workloadAnalysis.balanced ? 30 : Math.max(0, 30 - (workloadAnalysis.coefficient * 20));
    breakdown.balance = parseFloat(balanceScore.toFixed(1));
    healthScore -= (30 - breakdown.balance);

    if (workloadAnalysis.overloaded.length > 0) {
      issues.push(`${workloadAnalysis.overloaded.length} overloaded employee(s)`);
    }

    // Assignment completeness (30 points)
    const assignedEmployees = schedule?.assignments ? Object.keys(schedule.assignments).length : 0;
    const assignmentRate = employees.length > 0 ? assignedEmployees / employees.length : 0;
    const completenessScore = assignmentRate * 30;
    breakdown.completeness = parseFloat(completenessScore.toFixed(1));
    healthScore -= (30 - breakdown.completeness);

    if (assignmentRate < 0.9) {
      issues.push(`${employees.length - assignedEmployees} employee(s) not assigned`);
    }

    // Final health score
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      score: parseFloat(healthScore.toFixed(1)),
      grade: healthScore >= 90 ? 'A' : healthScore >= 80 ? 'B' : healthScore >= 70 ? 'C' : healthScore >= 60 ? 'D' : 'F',
      breakdown,
      issues,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'fair' : 'needs-attention'
    };
  }

  /**
   * Generate smart recommendations for schedule improvements
   * @param {Object} schedule - Current schedule
   * @param {Array} employees - All employees
   * @param {Array} entities - All entities
   * @param {Array} schedules - Historical schedules
   * @returns {Array} - Prioritized recommendations
   */
  static generateRecommendations(schedule, employees, entities, schedules = []) {
    const recommendations = [];

    // Coverage gap recommendations
    const gaps = this.detectCoverageGaps(entities, schedule);
    gaps.forEach(gap => {
      recommendations.push({
        priority: gap.severity === 'critical' ? 'high' : 'medium',
        category: 'coverage',
        title: gap.issue,
        description: gap.recommendation,
        entity: gap.entity,
        action: 'assign_coverage'
      });
    });

    // Workload balance recommendations
    const workloadAnalysis = this.analyzeWorkloadBalance(employees, schedule);
    if (!workloadAnalysis.balanced) {
      recommendations.push({
        priority: 'medium',
        category: 'balance',
        title: 'Workload Imbalance Detected',
        description: `Workload variation is ${(workloadAnalysis.coefficient * 100).toFixed(0)}%. Consider redistributing assignments.`,
        action: 'rebalance_workload'
      });
    }

    // Rotation recommendations
    if (schedules.length >= 2) {
      const rotationAnalysis = this.analyzeRotationPatterns(schedules, employees);
      rotationAnalysis.recommendations.forEach(rec => {
        recommendations.push({
          priority: 'low',
          category: 'rotation',
          title: 'Rotation Suggestion',
          description: rec,
          action: 'improve_rotation'
        });
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}
