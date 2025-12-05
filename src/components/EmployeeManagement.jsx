import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Archive, X, Save, UserPlus } from 'lucide-react';

export default function EmployeeManagement({ employees, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    skills: [],
    email: '',
    notes: ''
  });

  const availableSkills = ['DAR', 'Trace', 'CPOE', 'Float'];

  function resetForm() {
    setFormData({
      name: '',
      skills: [],
      email: '',
      notes: ''
    });
    setEditingEmployee(null);
    setShowAddModal(false);
  }

  function handleEdit(employee) {
    setFormData({
      name: employee.name || '',
      skills: employee.skills || [],
      email: employee.email || '',
      notes: employee.notes || ''
    });
    setEditingEmployee(employee);
    setShowAddModal(true);
  }

  function toggleSkill(skill) {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Employee name is required');
      return;
    }

    if (formData.skills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

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
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee');
    }
  }

  async function handleArchive(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to archive ${employee.name}? They will no longer appear in new schedules.`
    );

    if (!confirmed) return;

    try {
      const employeeRef = doc(db, 'employees', employee.id);
      await updateDoc(employeeRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      onUpdate();
    } catch (error) {
      console.error('Error archiving employee:', error);
      alert('Failed to archive employee');
    }
  }

  const activeEmployees = employees.filter(e => !e.archived);
  const archivedEmployees = employees.filter(e => e.archived);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage employees and their skills/training
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Employee
        </button>
      </div>

      {/* Active Employees */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Employees ({activeEmployees.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills/Training
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeEmployees.map(employee => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {employee.skills?.map(skill => (
                        <span
                          key={skill}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            skill === 'Float'
                              ? 'bg-purple-100 text-purple-800'
                              : skill === 'DAR'
                              ? 'bg-blue-100 text-blue-800'
                              : skill === 'Trace'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {employee.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {employee.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-thr-blue-600 hover:text-thr-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleArchive(employee)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Archive className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No employees yet. Click "Add Employee" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Archived Employees */}
      {archivedEmployees.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Archived Employees ({archivedEmployees.length})
          </h3>
          <div className="space-y-2">
            {archivedEmployees.map(employee => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {employee.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {employee.skills?.join(', ')}
                  </div>
                </div>
                <span className="text-xs text-gray-500">Archived</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Employee Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter full name"
                  required
                />
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
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="employee@email.com"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
