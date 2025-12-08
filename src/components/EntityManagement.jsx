import { useState } from 'react';
import { logger } from '../utils/logger';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditService } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Trash2, Save, Building2, Check, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useFormValidation, validationPresets } from '../hooks/useFormValidation';
import { useToast } from '../hooks/useToast';

export default function EntityManagement({ entities, onUpdate }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showConfirm } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form validation
  const {
    values: formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm: resetValidation,
    setValues
  } = useFormValidation(
    {
      name: '',
      description: '',
      code: ''
    },
    {
      name: validationPresets.entityName
    }
  );

  function resetForm() {
    resetValidation({
      name: '',
      description: '',
      code: ''
    });
    setEditingEntity(null);
    setShowAddModal(false);
    setIsSubmitting(false);
  }

  function handleEdit(entity) {
    setValues({
      name: entity.name || '',
      description: entity.description || '',
      code: entity.code || ''
    });
    setEditingEntity(entity);
    setShowAddModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingEntity) {
        // Update existing entity
        const changes = AuditService.detectChanges(editingEntity, formData);
        const entityRef = doc(db, 'entities', editingEntity.id);
        await updateDoc(entityRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });

        // Log audit trail
        await AuditService.log({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          action: 'entity.update',
          resourceType: 'entity',
          resourceId: editingEntity.id,
          changes: changes,
          metadata: { entityName: formData.name }
        });
      } else {
        // Add new entity
        const docRef = await addDoc(collection(db, 'entities'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Log audit trail
        await AuditService.log({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          action: 'entity.create',
          resourceType: 'entity',
          resourceId: docRef.id,
          metadata: { entityName: formData.name }
        });
      }

      resetForm();
      onUpdate();
      showSuccess(editingEntity ? 'Entity updated successfully!' : 'Entity added successfully!');
    } catch (error) {
      logger.error('Error saving entity:', error);
      showError('Failed to save entity');
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entity) {
    if (isDeleting) return;

    const confirmed = await showConfirm(
      `Are you sure you want to delete ${entity.name}? This action cannot be undone.`,
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'entities', entity.id));

      // Log audit trail
      await AuditService.log({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'entity.delete',
        resourceType: 'entity',
        resourceId: entity.id,
        metadata: { entityName: entity.name }
      });

      onUpdate();
      showSuccess('Entity deleted successfully!');
    } catch (error) {
      logger.error('Error deleting entity:', error);
      showError('Failed to delete entity');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-slate-900 dark:text-slate-100">Entity Management</h2>
          <p className="text-body-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage locations and entities for assignment
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Entity
        </button>
      </div>

      {/* Entities Grid - 3 columns responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map(entity => (
          <div 
            key={entity.id} 
            className="card card-interactive group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Building2 className="w-5 h-5 text-thr-blue-500" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-thr-blue-600 dark:group-hover:text-thr-blue-400 transition-colors">{entity.name}</h3>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(entity);
                  }}
                  className="p-2 rounded-lg text-thr-blue-600 dark:text-thr-blue-400 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 transition-colors"
                  aria-label={`Edit ${entity.name}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entity);
                  }}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label={`Delete ${entity.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {entity.code && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Code: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{entity.code}</span>
              </div>
            )}

            {entity.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{entity.description}</p>
            )}
          </div>
        ))}

        {entities.length === 0 && (
          <div className="col-span-full card text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">No entities yet. Click "Add Entity" to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingEntity ? 'Edit Entity' : 'Add New Entity'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Entity Name *</label>
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
                placeholder="e.g., Texas Health Arlington Memorial"
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
            <label className="label">Entity Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className="input-field"
              placeholder="e.g., THAM"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional short code for the entity
            </p>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Optional description or notes about this entity..."
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
                  {editingEntity ? 'Update Entity' : 'Add Entity'}
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
    </div>
  );
}
