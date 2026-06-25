import React from 'react';
import { Plus, MapPin, Calendar, Edit, Trash2 } from 'lucide-react';

export default function ProjectTasks({
  jobs,
  deleteJob,
  startEditJob,
  setShowAddTaskForm,
  showToast
}) {
  const handleDeleteJob = async (job) => {
    if (window.confirm(`Are you sure you want to delete project task "${job.title}"?`)) {
      await deleteJob(job.id);
      showToast(`Deleted project task "${job.title}"`, 'info');
    }
  };

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Project Tasks & Sites</h2>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddTaskForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Create Project Task
        </button>
      </div>

      {/* Project Task List Table */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Task Title & Site Location</th>
              <th>Scheduled At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No project tasks scheduled yet. Create one above!
                </td>
              </tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{job.title}</div>
                    {job.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.description}>
                        {job.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={12} /> {job.locationName}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {job.date}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {job.time}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => startEditJob(job)}
                        title="Edit Project"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="btn btn-danger-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDeleteJob(job)}
                        title="Delete Project Task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
