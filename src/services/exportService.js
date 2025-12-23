/**
 * Export Service
 * Handles PDF and Excel export functionality with enhanced features
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { logger } from '../utils/logger';
import { calculateWorkload } from '../utils/conflictDetection';
import { formatEntityList, getEmployeeInitials } from '../utils/scheduleUtils';

class ExportService {
  /**
   * Export schedule to PDF
   * @param {Object} params - Export parameters
   */
  async exportScheduleToPDF({
    scheduleName,
    startDate,
    employees,
    assignments,
    darColumns,
    darEntities,
    avgWorkload,
    includeStats = true,
    orientation = 'landscape'
  }) {
    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add header
      this.addPDFHeader(doc, scheduleName, startDate);

      // Prepare table data
      const tableData = this.prepareScheduleTableData(
        employees,
        assignments,
        darColumns,
        darEntities
      );

      // Add schedule table
      doc.autoTable({
        head: [tableData.headers],
        body: tableData.rows,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Add statistics if requested
      if (includeStats) {
        const finalY = doc.lastAutoTable.finalY + 10;
        this.addStatisticsSection(doc, finalY, {
          avgWorkload,
          totalEmployees: employees.filter(e => !e.archived).length,
          assignedEmployees: Object.keys(assignments).length,
        });
      }

      // Add footer
      this.addPDFFooter(doc);

      // Save PDF
      const fileName = `${scheduleName || 'Schedule'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      logger.info('PDF exported successfully:', fileName);
      return { success: true, fileName };
    } catch (error) {
      logger.error('Error exporting PDF:', error);
      throw error;
    }
  }

  /**
   * Export dashboard to PDF
   * @param {Object} params - Dashboard export parameters
   */
  async exportDashboardToPDF({
    title,
    dateRange,
    stats,
    charts,
    includeCharts = true
  }) {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(title, 20, 20);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Report Period: ${dateRange}`, 20, 28);
      doc.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 34);

      // Add statistics
      let yPos = 45;
      if (stats && stats.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Key Metrics', 20, yPos);
        yPos += 10;

        const statsData = stats.map(stat => [stat.label, stat.value]);
        doc.autoTable({
          body: statsData,
          startY: yPos,
          theme: 'striped',
          styles: { fontSize: 10 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Add footer
      this.addPDFFooter(doc);

      const fileName = `Dashboard_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      logger.error('Error exporting dashboard PDF:', error);
      throw error;
    }
  }

  /**
   * Export data to Excel
   * @param {Object} params - Export parameters
   */
  async exportToExcel({
    scheduleName,
    startDate,
    employees,
    assignments,
    darColumns,
    darEntities,
    avgWorkload
  }) {
    try {
      // Create main schedule data
      const data = employees.filter(e => !e.archived).map(employee => {
        const assignment = assignments[employee.id] || {};
        const row = { 'TEAM MEMBER': employee.name };

        // Add DAR columns
        darColumns.forEach((dar, idx) => {
          const isDarTrained = this.canAssignDAR(employee);
          const entityList = darEntities[idx] || [];
          const entityNames = Array.isArray(entityList) ? entityList.join('/') : (entityList || '');
          const columnName = entityNames ? `${dar}\n${entityNames}` : dar;

          if (isDarTrained && assignment.dars?.includes(idx)) {
            row[columnName] = 'X';
          } else {
            row[columnName] = '';
          }
        });

        // Add other assignment columns
        row['CPOE'] = assignment.cpoe ? 'X' : '';
        row['New Incoming Items'] = (Array.isArray(assignment.newIncoming) && assignment.newIncoming.length > 0)
          ? getEmployeeInitials(employee.name)
          : '';
        row['Cross-Training'] = formatEntityList(assignment.crossTraining);
        row['Special Projects/Assignments'] = formatEntityList(assignment.specialProjects);
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

      logger.info('Excel exported successfully:', fileName);
      return { success: true, fileName };
    } catch (error) {
      logger.error('Error exporting Excel:', error);
      throw error;
    }
  }

  // Helper methods

  addPDFHeader(doc, scheduleName, startDate) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(scheduleName || 'Clinical Review Schedule', 20, 15);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Week of: ${startDate || 'N/A'}`, 20, 22);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 27);
  }

  addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  }

  prepareScheduleTableData(employees, assignments, darColumns, darEntities) {
    const headers = [
      'Team Member',
      ...darColumns,
      'CPOE',
      'New Items',
      'Cross-Training',
      'Special Projects',
      'Workload'
    ];

    const rows = employees.filter(e => !e.archived).map(employee => {
      const assignment = assignments[employee.id] || {};
      const row = [employee.name];

      // DAR columns
      darColumns.forEach((dar, idx) => {
        const isDarTrained = this.canAssignDAR(employee);
        if (isDarTrained && assignment.dars?.includes(idx)) {
          row.push('X');
        } else {
          row.push('');
        }
      });

      // Other columns
      row.push(assignment.cpoe ? 'X' : '');
      row.push(
        (Array.isArray(assignment.newIncoming) && assignment.newIncoming.length > 0)
          ? getEmployeeInitials(employee.name)
          : ''
      );
      row.push(formatEntityList(assignment.crossTraining) || '');
      row.push(formatEntityList(assignment.specialProjects) || '');
      row.push(calculateWorkload(assignment, darEntities).toString());

      return row;
    });

    return { headers, rows };
  }

  addStatisticsSection(doc, yPos, stats) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Statistics Summary', 20, yPos);

    const statsData = [
      ['Average Workload', stats.avgWorkload.toFixed(1)],
      ['Total Employees', stats.totalEmployees.toString()],
      ['Assigned Employees', stats.assignedEmployees.toString()],
    ];

    doc.autoTable({
      body: statsData,
      startY: yPos + 5,
      theme: 'plain',
      styles: { fontSize: 9 },
    });
  }

  canAssignDAR(employee) {
    return employee.skills?.includes('DAR') || employee.skills?.includes('Float');
  }
}

export const exportService = new ExportService();
export default exportService;
