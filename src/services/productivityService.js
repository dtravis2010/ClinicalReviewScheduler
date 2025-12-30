import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitQuery,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

/**
 * ProductivityService - Manages productivity data in Firestore
 *
 * Collections structure:
 * - productivity/{periodId} - Productivity period metadata
 * - productivity/{periodId}/entities/{entityId} - Entity productivity data
 * - productivity/{periodId}/employees/{employeeId} - Employee productivity data
 */
export class ProductivityService {
  /**
   * Save productivity data for a period
   * @param {Object} periodData - Period metadata (startDate, endDate, uploadedBy, etc.)
   * @param {Array} entityData - Array of entity productivity records
   * @param {Array} employeeData - Array of employee productivity records
   * @returns {Promise<string>} - The period ID
   */
  static async savePeriodData(periodData, entityData = [], employeeData = []) {
    try {
      // Generate period ID from date range
      const periodId = `${periodData.startDate}_${periodData.endDate}`;
      const periodRef = doc(db, 'productivity', periodId);

      // Save period metadata
      await setDoc(periodRef, {
        ...periodData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        entityCount: entityData.length,
        employeeCount: employeeData.length
      });

      // Save entity data
      for (const entity of entityData) {
        const entityRef = doc(db, 'productivity', periodId, 'entities', entity.id || entity.name);
        await setDoc(entityRef, {
          ...entity,
          periodId,
          updatedAt: serverTimestamp()
        });
      }

      // Save employee data
      for (const employee of employeeData) {
        const employeeRef = doc(db, 'productivity', periodId, 'employees', employee.id || employee.name);
        await setDoc(employeeRef, {
          ...employee,
          periodId,
          updatedAt: serverTimestamp()
        });
      }

      logger.info(`Saved productivity data for period ${periodId}`);
      return periodId;
    } catch (error) {
      logger.error('Error saving productivity data:', error);
      throw new Error(`Failed to save productivity data: ${error.message}`);
    }
  }

  /**
   * Get all productivity periods
   * @param {number} limitCount - Max number of periods to fetch
   * @returns {Promise<Array>} - Array of period metadata
   */
  static async getAllPeriods(limitCount = 50) {
    try {
      const periodsRef = collection(db, 'productivity');
      const q = query(periodsRef, orderBy('startDate', 'desc'), limitQuery(limitCount));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error fetching productivity periods:', error);
      throw new Error(`Failed to fetch periods: ${error.message}`);
    }
  }

  /**
   * Get productivity data for a specific period
   * @param {string} periodId - The period ID
   * @returns {Promise<Object>} - Period data with entities and employees
   */
  static async getPeriodData(periodId) {
    try {
      const periodRef = doc(db, 'productivity', periodId);
      const periodDoc = await getDoc(periodRef);

      if (!periodDoc.exists()) {
        throw new Error(`Period ${periodId} not found`);
      }

      // Get entities for this period
      const entitiesRef = collection(db, 'productivity', periodId, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      const entities = entitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get employees for this period
      const employeesRef = collection(db, 'productivity', periodId, 'employees');
      const employeesSnapshot = await getDocs(employeesRef);
      const employees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        period: {
          id: periodDoc.id,
          ...periodDoc.data()
        },
        entities,
        employees
      };
    } catch (error) {
      logger.error('Error fetching period data:', error);
      throw new Error(`Failed to fetch period data: ${error.message}`);
    }
  }

  /**
   * Get entity productivity history across all periods
   * @param {string} entityName - The entity name
   * @param {number} limitCount - Max number of records to fetch
   * @returns {Promise<Array>} - Array of productivity records
   */
  static async getEntityHistory(entityName, limitCount = 12) {
    try {
      const periods = await this.getAllPeriods(limitCount);
      const history = [];

      for (const period of periods) {
        try {
          const entityRef = doc(db, 'productivity', period.id, 'entities', entityName);
          const entityDoc = await getDoc(entityRef);

          if (entityDoc.exists()) {
            history.push({
              periodId: period.id,
              startDate: period.startDate,
              endDate: period.endDate,
              ...entityDoc.data()
            });
          }
        } catch (error) {
          logger.warn(`Error fetching entity ${entityName} for period ${period.id}:`, error);
        }
      }

      return history.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } catch (error) {
      logger.error('Error fetching entity history:', error);
      throw new Error(`Failed to fetch entity history: ${error.message}`);
    }
  }

  /**
   * Get employee productivity history across all periods
   * @param {string} employeeName - The employee name or ID
   * @param {number} limitCount - Max number of records to fetch
   * @returns {Promise<Array>} - Array of productivity records
   */
  static async getEmployeeHistory(employeeName, limitCount = 12) {
    try {
      const periods = await this.getAllPeriods(limitCount);
      const history = [];

      for (const period of periods) {
        try {
          const employeeRef = doc(db, 'productivity', period.id, 'employees', employeeName);
          const employeeDoc = await getDoc(employeeRef);

          if (employeeDoc.exists()) {
            history.push({
              periodId: period.id,
              startDate: period.startDate,
              endDate: period.endDate,
              ...employeeDoc.data()
            });
          }
        } catch (error) {
          logger.warn(`Error fetching employee ${employeeName} for period ${period.id}:`, error);
        }
      }

      return history.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } catch (error) {
      logger.error('Error fetching employee history:', error);
      throw new Error(`Failed to fetch employee history: ${error.message}`);
    }
  }

  /**
   * Calculate aggregated statistics across periods
   * @returns {Promise<Object>} - Aggregated statistics
   */
  static async getAggregatedStats() {
    try {
      const periods = await this.getAllPeriods(12); // Last 12 periods

      let totalCases = 0;
      let totalEntities = 0;
      let totalEmployees = 0;
      const entityStats = {};
      const employeeStats = {};

      for (const period of periods) {
        const periodData = await this.getPeriodData(period.id);

        // Aggregate entity stats
        periodData.entities.forEach(entity => {
          if (!entityStats[entity.name || entity.id]) {
            entityStats[entity.name || entity.id] = {
              name: entity.name || entity.id,
              totalCases: 0,
              periods: 0,
              avgReviewTime: []
            };
          }

          const stats = entityStats[entity.name || entity.id];
          stats.totalCases += entity.casesReviewed || 0;
          stats.periods += 1;
          if (entity.avgReviewTime) {
            stats.avgReviewTime.push(entity.avgReviewTime);
          }

          totalCases += entity.casesReviewed || 0;
        });

        // Aggregate employee stats
        periodData.employees.forEach(employee => {
          if (!employeeStats[employee.name || employee.id]) {
            employeeStats[employee.name || employee.id] = {
              name: employee.name || employee.id,
              totalCases: 0,
              periods: 0,
              qualityScores: []
            };
          }

          const stats = employeeStats[employee.name || employee.id];
          stats.totalCases += employee.casesReviewed || 0;
          stats.periods += 1;
          if (employee.qualityScore) {
            stats.qualityScores.push(employee.qualityScore);
          }
        });

        totalEntities = Math.max(totalEntities, periodData.entities.length);
        totalEmployees = Math.max(totalEmployees, periodData.employees.length);
      }

      // Calculate averages
      Object.values(entityStats).forEach(stat => {
        if (stat.avgReviewTime.length > 0) {
          stat.averageReviewTime = stat.avgReviewTime.reduce((a, b) => a + b, 0) / stat.avgReviewTime.length;
        }
        delete stat.avgReviewTime;
      });

      Object.values(employeeStats).forEach(stat => {
        if (stat.qualityScores.length > 0) {
          stat.averageQuality = stat.qualityScores.reduce((a, b) => a + b, 0) / stat.qualityScores.length;
        }
        delete stat.qualityScores;
      });

      return {
        totalCases,
        totalEntities,
        totalEmployees,
        periodsAnalyzed: periods.length,
        topEntities: Object.values(entityStats)
          .sort((a, b) => b.totalCases - a.totalCases)
          .slice(0, 10),
        topPerformers: Object.values(employeeStats)
          .sort((a, b) => b.totalCases - a.totalCases)
          .slice(0, 10)
      };
    } catch (error) {
      logger.error('Error calculating aggregated stats:', error);
      return {
        totalCases: 0,
        totalEntities: 0,
        totalEmployees: 0,
        periodsAnalyzed: 0,
        topEntities: [],
        topPerformers: []
      };
    }
  }

  /**
   * Delete a productivity period and all its data
   * @param {string} periodId - The period ID to delete
   * @returns {Promise<void>}
   */
  static async deletePeriod(periodId) {
    try {
      // Delete all entities for this period
      const entitiesRef = collection(db, 'productivity', periodId, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      for (const doc of entitiesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete all employees for this period
      const employeesRef = collection(db, 'productivity', periodId, 'employees');
      const employeesSnapshot = await getDocs(employeesRef);
      for (const doc of employeesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete the period document
      const periodRef = doc(db, 'productivity', periodId);
      await deleteDoc(periodRef);

      logger.info(`Deleted productivity period ${periodId}`);
    } catch (error) {
      logger.error('Error deleting period:', error);
      throw new Error(`Failed to delete period: ${error.message}`);
    }
  }

  /**
   * Parse trace report CSV for New Incoming productivity data
   * @param {string} csvText - Raw CSV text content
   * @returns {Object} Parsed data with entities array
   */
  static parseTraceReportCSV(csvText) {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty');
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['TeamName', 'ClearedFromListCount', 'InboundFaxCount', 'NewInboundItemsRemainingLast60Days'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Find column indices
      const indices = {
        teamName: headers.indexOf('TeamName'),
        cleared: headers.indexOf('ClearedFromListCount'),
        inbound: headers.indexOf('InboundFaxCount'),
        remaining: headers.indexOf('NewInboundItemsRemainingLast60Days'),
        deleted: headers.indexOf('DeletedCount'),
        indexed: headers.indexOf('IndexedCount'),
        unindexed: headers.indexOf('UnindexedCount')
      };

      // Parse data rows
      const entityMap = {};
      const entityMapping = {
        'Enterprise Women\'s Allen': 'Enterprise Allen',
        'Enterprise Women\'s Plano': 'Enterprise Plano'
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const teamName = values[indices.teamName];

        // Map enterprise women's locations to parent entities
        const mappedName = entityMapping[teamName] || teamName;

        const entityData = {
          clearedFromList: parseInt(values[indices.cleared]) || 0,
          inboundFaxCount: parseInt(values[indices.inbound]) || 0,
          remaining: parseInt(values[indices.remaining]) || 0,
          deletedCount: indices.deleted >= 0 ? parseInt(values[indices.deleted]) || 0 : 0,
          indexedCount: indices.indexed >= 0 ? parseInt(values[indices.indexed]) || 0 : 0,
          unindexedCount: indices.unindexed >= 0 ? parseInt(values[indices.unindexed]) || 0 : 0
        };

        // If entity already exists (from women's location), combine the data
        if (entityMap[mappedName]) {
          entityMap[mappedName].clearedFromList += entityData.clearedFromList;
          entityMap[mappedName].inboundFaxCount += entityData.inboundFaxCount;
          entityMap[mappedName].remaining += entityData.remaining;
          entityMap[mappedName].deletedCount += entityData.deletedCount;
          entityMap[mappedName].indexedCount += entityData.indexedCount;
          entityMap[mappedName].unindexedCount += entityData.unindexedCount;
          entityMap[mappedName].sources.push(teamName);
        } else {
          entityMap[mappedName] = {
            name: mappedName,
            ...entityData,
            sources: [teamName]
          };
        }
      }

      const entities = Object.values(entityMap);
      return { entities, totalEntities: entities.length };
    } catch (error) {
      logger.error('Error parsing trace report CSV:', error);
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  }

  /**
   * Upload trace report for New Incoming productivity
   * @param {File} file - CSV file object
   * @param {Object} dateRange - { start, end } date range
   * @param {string} userId - User ID uploading the report
   * @returns {Promise<Object>} Upload result with periodId
   */
  static async uploadTraceReport(file, dateRange, userId) {
    try {
      // Read file contents
      const csvText = await file.text();

      // Parse CSV
      const { entities } = this.parseTraceReportCSV(csvText);

      // Create period data
      const periodData = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        reportType: 'newIncoming',
        uploadedBy: userId
      };

      // Save to Firestore using existing savePeriodData method
      const periodId = await this.savePeriodData(periodData, entities, []);

      logger.info(`Trace report uploaded successfully: ${periodId}`);
      return { success: true, periodId, entitiesCount: entities.length };
    } catch (error) {
      logger.error('Error uploading trace report:', error);
      throw new Error(`Failed to upload trace report: ${error.message}`);
    }
  }
}
