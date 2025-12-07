import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Archive, Save, UserPlus, Check, Loader2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useFormValidation, validationPresets } from '../hooks/useFormValidation';
import { useToast } from '../hooks/useToast';

export default function EmployeeManagement({ employees, onUpdate }) {
  const { showSuccess, showError } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeToArchive, setEmployeeToArchive] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

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
        const employeeRef = doc(db, 'employees', editingEmployee.id);
        await updateDoc(employeeRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new employee
        await addDoc(collection(db, 'employees'), {
          ...formData,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      resetForm();
      onUpdate();
      showSuccess(editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
    } catch (error) {
      console.error('Error saving employee:', error);
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

      setEmployeeToArchive(null);
      onUpdate();
      showSuccess('Employee archived successfully!');
    } catch (error) {
      console.error('Error archiving employee:', error);
      showError('Failed to archive employee');
    } finally {
      setIsArchiving(false);
    }
  }

  const activeEmployees = employees.filter(e => !e.archived);
  const archivedEmployees = employees.filter(e => e.archived);

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
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

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
                  Skills/Training
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
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p>No employees yet. Click "Add Employee" to get started.</p>
            </div>
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
          <div>
            <label className="label">Employee Name *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`input-field pr-10 ${
                  touched.name && errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : touched.name && formData.name
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                placeholder="Enter full name"
              />
              {touched.name && !errors.name && formData.name && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

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
            <label className="label">Email</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`input-field pr-10 ${
                  touched.email && errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : touched.email && formData.email
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                placeholder="employee@email.com"
              />
              {touched.email && !errors.email && formData.email && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

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
            <button
              type="submit"
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
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
