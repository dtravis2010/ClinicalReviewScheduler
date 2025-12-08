/**
 * Export utility functions
 * Contains logic for exporting schedules to various formats
 */

import * as XLSX from 'xlsx';
import { calculateWorkload } from './conflictDetection';
import { formatEntityList } from './scheduleUtils';

/**
 * Check if employee can be assigned to DAR
 * @param {Object} employee - Employee object
 * @returns {boolean} True if employee has DAR or Float skill
 */
function canAssignDAR(employee) {
  return employee.skills?.includes('DAR') || employee.skills?.includes('Float');
}

/**
 * Export schedule to Excel format
 * @param {Object} params - Export parameters
 * @param {string} params.scheduleName - Name of the schedule
 * @param {string} params.startDate - Start date
 * @param {Array} params.employees - List of employees
 * @param {Object} params.assignments - Assignment data
 * @param {Array} params.darColumns - DAR column names
 * @param {Object} params.darEntities - DAR entity assignments
 * @param {number} params.avgWorkload - Average workload score
 */
export function exportToExcel({
  scheduleName,
  startDate,
  employees,
  assignments,
  darColumns,
  darEntities,
  avgWorkload
}) {
  // Create main schedule data
  const data = employees.filter(e => !e.archived).map(employee => {
    const assignment = assignments[employee.id] || {};
    const row = { 'TEAM MEMBER': employee.name };

    // Add DAR columns
    darColumns.forEach((dar, idx) => {
      const isDarTrained = canAssignDAR(employee);
      const entityList = darEntities[idx] || [];
      const entityNames = Array.isArray(entityList) ? entityList.join('/') : (entityList || '');
      const columnName = entityNames ? `${dar}\n${entityNames}` : dar;

      if (isDarTrained && assignment.dars?.includes(idx)) {
        row[columnName] = entityNames;
      } else {
        row[columnName] = '';
      }
    });

    // Add other assignment columns
    row['CPOE'] = assignment.cpoe ? 'CPOE' : '';
    row['New Incoming Items'] = formatEntityList(assignment.newIncoming);
    row['Cross-Training'] = formatEntityList(assignment.crossTraining);
    row['Special Projects/Assignments'] = formatEntityList(assignment.specialProjects);
    
    // Add workload score
    row['Workload Score'] = calculateWorkload(assignment, darEntities);

    return row;
  });

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  
  // Add workload summary sheet
  const workloadSummary = [
    { Metric: 'Average Workload', Value: avgWorkload.toFixed(1) },
    { Metric: 'Total Employees', Value: employees.filter(e => !e.archived).length },
    { Metric: 'Employees with Assignments', Value: Object.keys(assignments).length }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(workloadSummary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Workload Summary');
  
  // Generate filename and download
  const fileName = `${scheduleName || 'Schedule'}_${startDate || 'export'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
