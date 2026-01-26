import { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditService } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Archive, Save, UserPlus, Check, Loader2, Users, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import Button from './atoms/Button';
import EmptyState from './EmptyState';
import FormInput from './FormInput';
import SearchFilter from './SearchFilter';
import { useFormValidation, validationPresets } from '../hooks/useFormValidation';
import { useToast } from '../hooks/useToast';

export default function EmployeeManagement({ employees, onUpdate }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeToArchive, setEmployeeToArchive] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  const availableSkills = ['DAR', 'Trace', 'CPOE', 'Float'];

  // Form validation
  const {
    values: formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm: resetValidation,
    setValues,
    getFieldProps
  } = useFormValidation(
    {
      name: '',
      skills: [],
      position: '',
      can3PEmail: false,
      email: '',
      notes: ''
    },
    {
      name: validationPresets.name,
      email: validationPresets.optionalEmail,
      skills: [
        { type: 'required', message: 'Please select at least one skill' }
      ]
    }
  );

  function resetForm() {
    resetValidation({
      name: '',
      skills: [],
      position: '',
      can3PEmail: false,
      email: '',
      notes: ''
    });
    setEditingEmployee(null);
    setShowAddModal(false);
    setIsSubmitting(false);
  }

  function handleEdit(employee) {
    setValues({
      name: employee.name || '',
      skills: employee.skills || [],
      position: employee.position || '',
      can3PEmail: employee.can3PEmail || false,
      email: employee.email || '',
      notes: employee.notes || ''
    });
    setEditingEmployee(employee);
    setShowAddModal(true);
  }

  function toggleSkill(skill) {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter(s => s !== skill)
      : [...formData.skills, skill];
    handleChange('skills', newSkills);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        // Update existing employee
        const changes = AuditService.detectChanges(editingEmployee, formData);
        const employeeRef = doc(db, 'employees', editingEmployee.id);
        await updateDoc(employeeRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });

        // Log audit trail
        await AuditService.log({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          action: 'employee.update',
          resourceType: 'employee',
          resourceId: editingEmployee.id,
          changes: changes,
          metadata: { employeeName: formData.name }
        });
      } else {
        // Add new employee
        const docRef = await addDoc(collection(db, 'employees'), {
          ...formData,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Log audit trail
        await AuditService.log({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          action: 'employee.create',
          resourceType: 'employee',
          resourceId: docRef.id,
          metadata: { employeeName: formData.name, skills: formData.skills }
        });
      }

      resetForm();
      onUpdate();
      showSuccess(editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
    } catch (error) {
      logger.error('Error saving employee:', error);
      showError('Failed to save employee');
      setIsSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!employeeToArchive || isArchiving) return;

    setIsArchiving(true);
    try {
      const employeeRef = doc(db, 'employees', employeeToArchive.id);
      await updateDoc(employeeRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log audit trail
      await AuditService.log({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'employee.archive',
        resourceType: 'employee',
        resourceId: employeeToArchive.id,
        metadata: { employeeName: employeeToArchive.name }
      });

      setEmployeeToArchive(null);
      onUpdate();
      showSuccess('Employee archived successfully!');
    } catch (error) {
      logger.error('Error archiving employee:', error);
      showError('Failed to archive employee');
    } finally {
      setIsArchiving(false);
    }
  }

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Status filter
      if (filterStatus === 'active' && employee.archived) return false;
      if (filterStatus === 'archived' && !employee.archived) return false;

      // Search filter (name, position, email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = employee.name?.toLowerCase().includes(query);
        const matchesPosition = employee.position?.toLowerCase().includes(query);
        const matchesEmail = employee.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesPosition && !matchesEmail) return false;
      }

      // Skill filter
      if (filterSkill !== 'all') {
        if (!employee.skills?.includes(filterSkill)) return false;
      }

      return true;
    });
  }, [employees, searchQuery, filterSkill, filterStatus]);

  const activeEmployees = filteredEmployees.filter(e => !e.archived);
  const archivedEmployees = filteredEmployees.filter(e => e.archived);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterSkill('all');
    setFilterStatus('active');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-slate-900 dark:text-slate-100">Employee Management</h2>
          <p className="text-body-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage employees and their skills/training
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Employee
        </Button>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search employees by name, position, or email..."
        filters={[
          {
            label: 'Skill',
            value: filterSkill,
            onChange: setFilterSkill,
            allValue: 'all',
            options: availableSkills.map(skill => ({
              value: skill,
              label: skill
            }))
          },
          {
            label: 'Status',
            value: filterStatus,
            onChange: setFilterStatus,
            allValue: 'all',
            options: [
              { value: 'active', label: 'Active Only' },
              { value: 'archived', label: 'Archived Only' }
            ]
          }
        ]}
        onClearFilters={handleClearFilters}
        showClearFilters={true}
      />

      {/* Active Employees */}
      <div className="card card-hover">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Active Employees ({activeEmployees.length})
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Skills/Training
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  3P Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {activeEmployees.map((employee, idx) => (
                <tr 
                  key={employee.id} 
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {employee.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.position ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-thr-blue-100 text-thr-blue-700 dark:bg-thr-blue-900/30 dark:text-thr-blue-300">
                        {employee.position}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {employee.skills?.map(skill => (
                        <span
                          key={skill}
                          className={`skill-tag ${
                            skill === 'Float'
                              ? 'skill-tag-float'
                              : skill === 'DAR'
                              ? 'skill-tag-dar'
                              : skill === 'Trace'
                              ? 'bg-role-cr/10 text-role-cr'
                              : skill === 'CPOE'
                              ? 'skill-tag-cpoe'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {employee.can3PEmail ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-thr-green-100 text-thr-green-700 dark:bg-thr-green-900/30 dark:text-thr-green-300">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {employee.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {employee.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 rounded-lg text-thr-blue-600 dark:text-thr-blue-400 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 transition-colors mr-2"
                      aria-label={`Edit ${employee.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEmployeeToArchive(employee)}
                      className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`Archive ${employee.name}`}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeEmployees.length === 0 && (
            <EmptyState
              icon={Users}
              title="No employees yet"
              description="Get started by adding your first employee. You can assign skills, positions, and manage their schedule assignments."
              action={() => setShowAddModal(true)}
              actionLabel="Add First Employee"
              actionIcon={<Plus className="w-4 h-4" />}
              variant="primary"
            />
          )}
        </div>
      </div>

      {/* Archived Employees */}
      {archivedEmployees.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Archived Employees ({archivedEmployees.length})
          </h3>
          <div className="space-y-2">
            {archivedEmployees.map(employee => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600"
              >
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {employee.skills?.join(', ')}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  Archived
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="employee-name"
            name="name"
            label="Employee Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            touched={touched.name}
            required={true}
            placeholder="Enter full name"
            autoComplete="name"
            autoCapitalize="words"
          />

          <div>
            <label className="label">Skills/Training *</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.skills.includes(skill)
                      ? 'border-thr-blue-500 bg-thr-blue-50 text-thr-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Float = Trained in all skills (DAR, Trace, CPOE)
            </p>
            {touched.skills && errors.skills && (
              <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
            )}
          </div>

          <div>
            <label className="label">Position</label>
            <select
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="input-field"
            >
              <option value="">Select position...</option>
              <option value="CR I">CR I</option>
              <option value="CR II">CR II</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can3PEmail}
                onChange={(e) => handleChange('can3PEmail', e.target.checked)}
                className="w-4 h-4 text-thr-blue-500 rounded focus:ring-2 focus:ring-thr-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Can do 3P Email
              </span>
              <span title="Employees who can receive and process third-party emails" className="cursor-help">
                <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
              </span>
            </label>
          </div>

          <FormInput
            id="employee-email"
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            placeholder="employee@email.com"
            autoComplete="email"
            inputMode="email"
            helpText="Optional: Employee's email address for notifications"
          />

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth={true}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
            <Button
              type="button"
              onClick={resetForm}
              variant="outline"
              fullWidth={true}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!employeeToArchive}
        onClose={() => !isArchiving && setEmployeeToArchive(null)}
        onConfirm={handleArchive}
        title="Archive Employee"
        message={`Are you sure you want to archive ${employeeToArchive?.name}? They will no longer appear in new schedules.`}
        confirmText={isArchiving ? 'Archiving...' : 'Archive'}
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
}
