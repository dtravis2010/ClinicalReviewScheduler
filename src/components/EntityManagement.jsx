import { useState } from 'react';
import { logger } from '../utils/logger';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditService } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Trash2, Save, Building2, Check, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './atoms/Button';
import EmptyState from './EmptyState';
import FormInput from './FormInput';
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
        try {
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
        } catch (e) {
            // Local fallback
            console.warn('DB update failed, using local fallback', e);
            const local = JSON.parse(sessionStorage.getItem('demo_entities') || '[]');
            const idx = local.findIndex(x => x.id === editingEntity.id);
            if (idx >= 0) {
                local[idx] = { ...local[idx], ...formData };
                sessionStorage.setItem('demo_entities', JSON.stringify(local));
            }
        }
      } else {
        // Add new entity
        try {
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
        } catch (e) {
            // Local fallback
            console.warn('DB add failed, using local fallback', e);
            const newEntity = { id: 'local_' + Date.now(), ...formData };
            const local = JSON.parse(sessionStorage.getItem('demo_entities') || '[]');
            local.push(newEntity);
            sessionStorage.setItem('demo_entities', JSON.stringify(local));
        }
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
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Entity
        </Button>
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
          <div className="col-span-full">
            <EmptyState
              icon={Building2}
              title="No entities yet"
              description="Start by adding your first entity or location. Entities represent the different facilities or departments where employees can be assigned."
              action={() => setShowAddModal(true)}
              actionLabel="Add First Entity"
              actionIcon={<Plus className="w-4 h-4" />}
              variant="primary"
            />
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
          <FormInput
            id="entity-name"
            name="name"
            label="Entity Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            touched={touched.name}
            required={true}
            placeholder="e.g., Texas Health Arlington Memorial"
            autoComplete="organization"
            autoCapitalize="words"
          />

          <FormInput
            id="entity-code"
            name="code"
            label="Entity Code"
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="e.g., THAM"
            helpText="Optional short code for the entity (used in abbreviations)"
          />

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
            <Button
              type="submit"
              variant="primary"
              fullWidth={true}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              {editingEntity ? 'Update Entity' : 'Add Entity'}
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
    </div>
  );
}
