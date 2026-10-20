import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  entityType: string;
  entityName: string;
  impactMessage: string;
  hasDependencies: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  entityType,
  entityName,
  impactMessage,
  hasDependencies,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
      <div className="modal-card">
        <div className="modal-header">
          <h3 id="delete-dialog-title" className="text-base font-bold text-slate-800">
            Confirm Deletion: {entityType}
          </h3>
          <button
            type="button"
            className="close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body p-4 text-xs space-y-3">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>{entityName}</strong>?
          </p>

          <div className={`p-3 rounded border ${hasDependencies ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <div className="font-semibold mb-1 flex items-center gap-1">
              <span>{hasDependencies ? '⚠️ Dependency & Relationship Impact:' : 'ℹ️ Safe Deletion Analysis:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {impactMessage}
            </p>
          </div>

          <p className="text-slate-500 text-[11px]">
            CloudPedagogy safe deletion ensures referential integrity: associated links will be unlinked safely without leaving orphaned references.
          </p>
        </div>

        <div className="modal-footer p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onConfirm}
          >
            Confirm Safe Deletion
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
