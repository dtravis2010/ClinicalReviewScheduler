import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToExcel } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}));

describe('exportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should create workbook with schedule data', () => {
      const params = {
        scheduleName: 'Test Schedule',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'John Doe', skills: ['DAR'], archived: false },
          { id: '2', name: 'Jane Smith', skills: ['CPOE'], archived: false }
        ],
        assignments: {
          '1': { dars: [0], cpoe: false },
          '2': { cpoe: true }
        },
        darColumns: ['DAR 1', 'DAR 2'],
        darEntities: { 0: ['Entity A'], 1: [] },
        avgWorkload: 50.5
      };

      exportToExcel(params);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        'Test Schedule_2024-01-01.xlsx'
      );
    });

    it('should filter out archived employees', () => {
      const params = {
        scheduleName: 'Test',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'Active', skills: [], archived: false },
          { id: '2', name: 'Archived', skills: [], archived: true }
        ],
        assignments: {},
        darColumns: [],
        darEntities: {},
        avgWorkload: 0
      };

      exportToExcel(params);

      const firstCall = XLSX.utils.json_to_sheet.mock.calls[0][0];
      expect(firstCall).toHaveLength(1);
      expect(firstCall[0]['TEAM MEMBER']).toBe('Active');
    });

    it('should include workload scores', () => {
      const params = {
        scheduleName: 'Test',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'John', skills: ['DAR'], archived: false }
        ],
        assignments: {
          '1': { dars: [0, 1], cpoe: true }
        },
        darColumns: ['DAR 1', 'DAR 2'],
        darEntities: { 0: ['Entity A'], 1: ['Entity B'] },
        avgWorkload: 50
      };

      exportToExcel(params);

      const firstCall = XLSX.utils.json_to_sheet.mock.calls[0][0];
      expect(firstCall[0]).toHaveProperty('Workload Score');
      expect(typeof firstCall[0]['Workload Score']).toBe('number');
    });

    it('should create workload summary sheet', () => {
      const params = {
        scheduleName: 'Test',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'John', skills: [], archived: false },
          { id: '2', name: 'Jane', skills: [], archived: false }
        ],
        assignments: { '1': { cpoe: true } },
        darColumns: [],
        darEntities: {},
        avgWorkload: 25.5
      };

      exportToExcel(params);

      const summaryCall = XLSX.utils.json_to_sheet.mock.calls[1][0];
      expect(summaryCall).toEqual([
        { Metric: 'Average Workload', Value: '25.5' },
        { Metric: 'Total Employees', Value: 2 },
        { Metric: 'Employees with Assignments', Value: 1 }
      ]);
    });

    it('should handle empty assignments', () => {
      const params = {
        scheduleName: 'Empty',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'John', skills: [], archived: false }
        ],
        assignments: {},
        darColumns: ['DAR 1'],
        darEntities: {},
        avgWorkload: 0
      };

      exportToExcel(params);

      const firstCall = XLSX.utils.json_to_sheet.mock.calls[0][0];
      expect(firstCall[0]['CPOE']).toBe('');
      expect(firstCall[0]['New Incoming Items']).toBe('');
    });

    it('should use default filename when schedule name is missing', () => {
      const params = {
        scheduleName: '',
        startDate: '',
        employees: [],
        assignments: {},
        darColumns: [],
        darEntities: {},
        avgWorkload: 0
      };

      exportToExcel(params);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        'Schedule_export.xlsx'
      );
    });

    it('should format DAR columns with entity names', () => {
      const params = {
        scheduleName: 'Test',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'John', skills: ['DAR'], archived: false }
        ],
        assignments: {
          '1': { dars: [0] }
        },
        darColumns: ['DAR 1'],
        darEntities: { 0: ['Entity A', 'Entity B'] },
        avgWorkload: 0
      };

      exportToExcel(params);

      const firstCall = XLSX.utils.json_to_sheet.mock.calls[0][0];
      const columnName = Object.keys(firstCall[0]).find(key => key.startsWith('DAR 1'));
      expect(columnName).toContain('Entity A/Entity B');
    });

    it('should only show DAR assignments for trained employees', () => {
      const params = {
        scheduleName: 'Test',
        startDate: '2024-01-01',
        employees: [
          { id: '1', name: 'Trained', skills: ['DAR'], archived: false },
          { id: '2', name: 'Untrained', skills: ['CPOE'], archived: false }
        ],
        assignments: {
          '1': { dars: [0] },
          '2': { dars: [0] } // Should not appear
        },
        darColumns: ['DAR 1'],
        darEntities: { 0: ['Entity A'] },
        avgWorkload: 0
      };

      exportToExcel(params);

      const firstCall = XLSX.utils.json_to_sheet.mock.calls[0][0];
      const trainedRow = firstCall.find(row => row['TEAM MEMBER'] === 'Trained');
      const untrainedRow = firstCall.find(row => row['TEAM MEMBER'] === 'Untrained');
      
      const columnName = Object.keys(trainedRow).find(key => key.startsWith('DAR 1'));
      expect(trainedRow[columnName]).toBe('Entity A');
      expect(untrainedRow[columnName]).toBe('');
    });
  });
});
