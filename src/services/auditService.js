import { db } from '../firebase.js';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger.js';
import { auditLogSchema } from '../schemas/index.js';

/**
 * Service for managing audit trail
 * Logs all changes to schedules, employees, and entities
 * Provides methods to query audit logs
 */
export class AuditService {
  static COLLECTION_NAME = 'auditLogs';

  /**
   * Log an audit entry
   * @param {Object} entry - Audit log entry
   * @param {string} entry.userId - ID of user performing action
   * @param {string} entry.userEmail - Email of user performing action
   * @param {string} entry.action - Action performed (e.g., 'schedule.create')
   * @param {string} entry.resourceType - Type of resource ('schedule', 'employee', 'entity')
   * @param {string} entry.resourceId - ID of the resource
   * @param {Object} [entry.changes] - Object containing changed fields (for updates)
   * @param {Object} [entry.metadata] - Additional metadata
   * @returns {Promise<string|null>} Document ID of created audit log, or null on error
   */
  static async log(entry) {
    try {
      // Add timestamp
      const auditEntry = {
        ...entry,
        timestamp: Timestamp.now()
      };

      // Validate entry
      const validation = auditLogSchema.safeParse(auditEntry);
      if (!validation.success) {
        logger.error('Audit log validation failed', { 
          errors: validation.error.issues,
          entry: auditEntry 
        });
        // Don't throw - audit logging should never break main operations
        return null;
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), auditEntry);
      
      logger.info('Audit log created', { 
        id: docRef.id, 
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId
      });

      return docRef.id;
    } catch (error) {
      // Log error but don't throw - audit logging should never break main operations
      logger.error('Failed to create audit log', { error, entry });
      return null;
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resourceType - Type of resource ('schedule', 'employee', 'entity')
   * @param {string} resourceId - ID of the resource
   * @param {number} [maxResults=50] - Maximum number of results to return
   * @returns {Promise<Array>} Array of audit log entries
   */
  static async getLogsForResource(resourceType, resourceId, maxResults = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      const logs = [];

      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      logger.debug('Retrieved audit logs for resource', { 
        resourceType, 
        resourceId, 
        count: logs.length 
      });

      return logs;
    } catch (error) {
      logger.error('Failed to retrieve audit logs for resource', { 
        error, 
        resourceType, 
        resourceId 
      });
      return [];
    }
  }

  /**
   * Get recent audit logs across all resources
   * @param {number} [maxResults=100] - Maximum number of results to return
   * @param {string} [resourceType] - Optional filter by resource type
   * @returns {Promise<Array>} Array of audit log entries
   */
  static async getRecentLogs(maxResults = 100, resourceType = null) {
    try {
      let q;
      
      if (resourceType) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('resourceType', '==', resourceType),
          orderBy('timestamp', 'desc'),
          limit(maxResults)
        );
      } else {
        q = query(
          collection(db, this.COLLECTION_NAME),
          orderBy('timestamp', 'desc'),
          limit(maxResults)
        );
      }

      const querySnapshot = await getDocs(q);
      const logs = [];

      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      logger.debug('Retrieved recent audit logs', { 
        count: logs.length,
        resourceType: resourceType || 'all'
      });

      return logs;
    } catch (error) {
      logger.error('Failed to retrieve recent audit logs', { error, resourceType });
      return [];
    }
  }

  /**
   * Get audit logs for a specific user
   * @param {string} userId - ID of the user
   * @param {number} [maxResults=50] - Maximum number of results to return
   * @returns {Promise<Array>} Array of audit log entries
   */
  static async getLogsForUser(userId, maxResults = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      const logs = [];

      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      logger.debug('Retrieved audit logs for user', { userId, count: logs.length });

      return logs;
    } catch (error) {
      logger.error('Failed to retrieve audit logs for user', { error, userId });
      return [];
    }
  }

  /**
   * Helper method to detect changes between old and new objects
   * @param {Object} oldData - Original data
   * @param {Object} newData - Updated data
   * @param {Array<string>} [fieldsToCompare] - Optional list of fields to compare
   * @returns {Object} Object containing only changed fields with before/after values
   */
  static detectChanges(oldData, newData, fieldsToCompare = null) {
    const changes = {};
    const fields = fieldsToCompare || Object.keys({ ...oldData, ...newData });

    fields.forEach(field => {
      const oldValue = oldData[field];
      const newValue = newData[field];

      // Deep comparison for objects and arrays
      const oldJson = JSON.stringify(oldValue);
      const newJson = JSON.stringify(newValue);

      if (oldJson !== newJson) {
        changes[field] = {
          before: oldValue,
          after: newValue
        };
      }
    });

    return changes;
  }
}
