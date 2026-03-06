
import React, { useState, useEffect } from 'react';

// --- Global Constants and Sample Data ---

// RBAC Roles configuration
const ROLES = {
  ADMIN: {
    canCreateLoan: true,
    canEditLoan: true,
    canApproveLoan: true,
    canRejectLoan: true,
    canViewAllLogs: true,
    canExportReports: true,
    canManageUsers: true,
  },
  LOAN_OFFICER: {
    canCreateLoan: true,
    canEditLoan: true,
    canApproveLoan: false,
    canRejectLoan: false,
    canViewAllLogs: false,
    canExportReports: false,
    canManageUsers: false,
  },
  CREDIT_ANALYST: {
    canCreateLoan: false,
    canEditLoan: true, // Can update credit assessment
    canApproveLoan: false,
    canRejectLoan: false,
    canViewAllLogs: false,
    canExportReports: false,
    canManageUsers: false,
  },
  RISK_MANAGER: {
    canCreateLoan: false,
    canEditLoan: true, // Can update risk evaluation
    canApproveLoan: false,
    canRejectLoan: false,
    canViewAllLogs: true,
    canExportReports: true,
    canManageUsers: false,
  },
  APPROVAL_MANAGER: {
    canCreateLoan: false,
    canEditLoan: false,
    canApproveLoan: true,
    canRejectLoan: true,
    canViewAllLogs: true,
    canExportReports: true,
    canManageUsers: false,
  },
};

// Status mapping for UI colors
const STATUS_COLORS_MAP = {
  Approved: {
    bg: 'var(--status-approved-bg)',
    border: 'var(--status-approved-border)',
    text: 'var(--status-approved-text)',
    className: 'status-badge-Approved',
  },
  'In Progress': {
    bg: 'var(--status-in-progress-bg)',
    border: 'var(--status-in-progress-border)',
    text: 'var(--status-in-progress-text)',
    className: 'status-badge-InProgress',
  },
  Pending: {
    bg: 'var(--status-pending-bg)',
    border: 'var(--status-pending-border)',
    text: 'var(--status-pending-text)',
    className: 'status-badge-Pending',
  },
  Rejected: {
    bg: 'var(--status-rejected-bg)',
    border: 'var(--status-rejected-border)',
    text: 'var(--status-rejected-text)',
    className: 'status-badge-Rejected',
  },
  Exception: {
    bg: 'var(--status-exception-bg)',
    border: 'var(--status-exception-border)',
    text: 'var(--status-exception-text)',
    className: 'status-badge-Exception',
  },
};

// Workflow stages
const LOAN_STAGES = [
  'Application',
  'Document Verification',
  'Credit Assessment',
  'Risk Evaluation',
  'Approval',
  'Disbursement',
];

// Sample Data
const sampleLoans = [
  {
    id: 'L001',
    applicantName: 'Alice Johnson',
    loanType: 'Home Loan',
    amount: 350000,
    status: 'In Progress',
    currentStage: 'Document Verification',
    submittedDate: '2023-10-26',
    lastUpdated: '2023-11-01',
    progress: 2, // Index in LOAN_STAGES
    sla: {
      'Document Verification': { deadline: '2023-11-03', breached: false },
      'Credit Assessment': { deadline: '2023-11-08', breached: false },
    },
    riskScore: 'Medium',
    creditScore: 720,
    documents: [
      { id: 'doc1', name: 'Application Form.pdf', type: 'PDF' },
      { id: 'doc2', name: 'ID Proof.jpg', type: 'Image' },
    ],
    comments: [],
  },
  {
    id: 'L002',
    applicantName: 'Bob Smith',
    loanType: 'Auto Loan',
    amount: 45000,
    status: 'Pending',
    currentStage: 'Credit Assessment',
    submittedDate: '2023-10-20',
    lastUpdated: '2023-10-30',
    progress: 3,
    sla: {
      'Credit Assessment': { deadline: '2023-11-02', breached: true }, // Example breach
      'Risk Evaluation': { deadline: '2023-11-05', breached: false },
    },
    riskScore: 'Low',
    creditScore: 780,
    documents: [
      { id: 'doc3', name: 'Loan Application.pdf', type: 'PDF' },
      { id: 'doc4', name: 'Bank Statement.pdf', type: 'PDF' },
    ],
    comments: [],
  },
  {
    id: 'L003',
    applicantName: 'Charlie Brown',
    loanType: 'Personal Loan',
    amount: 15000,
    status: 'Approved',
    currentStage: 'Disbursement',
    submittedDate: '2023-10-15',
    lastUpdated: '2023-10-25',
    progress: 5,
    sla: {},
    riskScore: 'Low',
    creditScore: 680,
    documents: [
      { id: 'doc5', name: 'Signed Agreement.pdf', type: 'PDF' },
    ],
    comments: [],
  },
  {
    id: 'L004',
    applicantName: 'Diana Prince',
    loanType: 'Business Loan',
    amount: 1200000,
    status: 'Rejected',
    currentStage: 'Approval',
    submittedDate: '2023-09-01',
    lastUpdated: '2023-10-10',
    progress: 4,
    sla: {},
    riskScore: 'High',
    creditScore: 600,
    documents: [
      { id: 'doc6', name: 'Business Plan.pdf', type: 'PDF' },
    ],
    comments: [],
  },
  {
    id: 'L005',
    applicantName: 'Eve Adams',
    loanType: 'Education Loan',
    amount: 80000,
    status: 'Exception',
    currentStage: 'Document Verification',
    submittedDate: '2023-11-01',
    lastUpdated: '2023-11-02',
    progress: 1,
    sla: {
      'Document Verification': { deadline: '2023-11-05', breached: false },
    },
    riskScore: 'Medium',
    creditScore: 700,
    documents: [
      { id: 'doc7', name: 'Admission Letter.pdf', type: 'PDF' },
    ],
    comments: [],
  },
];

const sampleActivities = [
  { id: 'act1', type: 'status_update', loanId: 'L001', description: 'Loan L001 status changed to In Progress by Alice Johnson.', timestamp: '2023-11-01 10:30 AM' },
  { id: 'act2', type: 'document_upload', loanId: 'L001', description: 'ID Proof uploaded for L001 by Alice Johnson.', timestamp: '2023-11-01 10:25 AM' },
  { id: 'act3', type: 'comment_added', loanId: 'L002', description: 'Credit Analyst added comment: Waiting for updated bank statements.', timestamp: '2023-10-30 03:00 PM' },
  { id: 'act4', type: 'status_update', loanId: 'L002', description: 'Loan L002 status changed to Pending by Bob Smith.', timestamp: '2023-10-30 02:50 PM' },
  { id: 'act5', type: 'loan_creation', loanId: 'L005', description: 'New Education Loan L005 created by Loan Officer.', timestamp: '2023-11-02 09:00 AM' },
  { id: 'act6', type: 'sla_breach', loanId: 'L002', description: 'SLA breached for Credit Assessment on L002.', timestamp: '2023-11-02 08:30 AM' },
];

const App = () => {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [currentUserRole, setCurrentUserRole] = useState('LOAN_OFFICER'); // Default role
  const [loans, setLoans] = useState(sampleLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'All', loanType: 'All', applicant: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false); // For web side panel filters

  // --- Handlers ---

  const handleNavigate = (screen, params = {}) => {
    setView({ screen, params });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setShowFilterPanel(false); // Close panel after applying
  };

  const handleClearFilters = () => {
    setFilters({ status: 'All', loanType: 'All', applicant: '' });
  };

  const handleCreateNewLoan = () => {
    handleNavigate('LOAN_FORM');
  };

  const handleDeleteLoan = (loanId) => {
    // In a real app, this would be an API call
    if (window.confirm(`Are you sure you want to delete loan ${loanId}?`)) {
      setLoans(prevLoans => prevLoans.filter(loan => loan.id !== loanId));
      if (view.screen === 'LOAN_DETAIL' && view.params.id === loanId) {
        handleNavigate('LOAN_LIST');
      }
    }
  };

  const handleQuickAction = (action, loanId) => {
    // Placeholder for quick actions like 'Approve', 'Edit', etc.
    console.log(`${action} triggered for ${loanId}`);
    // Example: If 'Edit', navigate to form
    if (action === 'Edit') {
      handleNavigate('LOAN_FORM', { id: loanId });
    } else if (action === 'Approve') {
      setLoans(prevLoans =>
        prevLoans.map(loan =>
          loan.id === loanId ? { ...loan, status: 'Approved', currentStage: 'Disbursement', progress: 5 } : loan
        )
      );
    }
  };

  const handleSaveLoanForm = (formData) => {
    setLoans(prevLoans => {
      if (formData.id) {
        // Edit existing loan
        return prevLoans.map(loan =>
          loan.id === formData.id ? { ...loan, ...formData, lastUpdated: new Date().toISOString().slice(0, 10) } : loan
        );
      } else {
        // Create new loan
        const newId = `L${(prevLoans.length + 1).toString().padStart(3, '0')}`;
        return [...prevLoans, {
          id: newId,
          ...formData,
          status: 'Pending',
          currentStage: 'Application',
          submittedDate: new Date().toISOString().slice(0, 10),
          lastUpdated: new Date().toISOString().slice(0, 10),
          progress: 0,
          sla: {},
          riskScore: 'N/A',
          creditScore: null,
          documents: [],
          comments: [],
        }];
      }
    });
    handleNavigate('LOAN_LIST');
  };

  // --- Filtered & Searched Data ---
  const filteredLoans = loans.filter(loan => {
    const searchMatch = loan.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        loan.loanType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filters.status === 'All' || loan.status === filters.status;
    const loanTypeMatch = filters.loanType === 'All' || loan.loanType === filters.loanType;
    const applicantMatch = filters.applicant === '' || loan.applicantName.toLowerCase().includes(filters.applicant.toLowerCase());
    return searchMatch && statusMatch && loanTypeMatch && applicantMatch;
  });

  // Dashboard KPI data
  const totalLoans = loans.length;
  const approvedLoans = loans.filter(l => l.status === 'Approved').length;
  const pendingLoans = loans.filter(l => l.status === 'Pending').length;
  const inProgressLoans = loans.filter(l => l.status === 'In Progress').length;
  const rejectedLoans = loans.filter(l => l.status === 'Rejected').length;
  const approvalRate = totalLoans > 0 ? ((approvedLoans / totalLoans) * 100).toFixed(1) : 0;

  // --- Components ---

  const Header = () => (
    <div className="header">
      <div className="logo">LoanFlow</div>
      <div className="global-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Global Search (Loans, Applicants, Docs...)"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="user-controls">
        <select value={currentUserRole} onChange={(e) => setCurrentUserRole(e.target.value)} style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}>
          {Object.keys(ROLES).map(role => (
            <option key={role} value={role}>{role.replace('_', ' ')}</option>
          ))}
        </select>
        <button className="ghost">🔔</button>
        <button className="ghost">⚙️</button>
        <button className="ghost">👤 {currentUserRole.replace('_', ' ')}</button>
      </div>
    </div>
  );

  const Breadcrumbs = ({ path }) => (
    <div className="breadcrumbs">
      <a onClick={() => handleNavigate('DASHBOARD')}>Dashboard</a>
      {path.map((item, index) => (
        <React.Fragment key={index}>
          <span>/</span>
          {index === path.length - 1 ? (
            <span className="current">{item.label}</span>
          ) : (
            <a onClick={() => handleNavigate(item.screen, item.params)}>{item.label}</a>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const Dashboard = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2>Loan Overview Dashboard <span className="live-indicator" style={{ marginLeft: 'var(--spacing-sm)' }}></span></h2>
        {ROLES[currentUserRole]?.canExportReports && (
          <button className="secondary">Export Dashboard (PDF/Excel)</button>
        )}
      </div>

      <div className="dashboard-metrics">
        <div className="card metric-card">
          <div className="value">{totalLoans}</div>
          <div className="label">Total Applications</div>
        </div>
        <div className="card metric-card">
          <div className="value" style={{ color: 'var(--status-approved-border)' }}>{approvedLoans}</div>
          <div className="label">Approved Loans</div>
        </div>
        <div className="card metric-card">
          <div className="value" style={{ color: 'var(--status-pending-border)' }}>{pendingLoans}</div>
          <div className="label">Pending Review</div>
        </div>
        <div className="card metric-card">
          <div className="value" style={{ color: 'var(--color-primary-blue)' }}>{approvalRate}%</div>
          <div className="label">Approval Rate</div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h4>Loan Applications by Type</h4>
          <span className="chart-placeholder">Bar Chart Placeholder</span>
          <button className="ghost chart-export-btn">📊 Export</button>
        </div>
        <div className="chart-container">
          <h4>Approval Rate Trends</h4>
          <span className="chart-placeholder">Line Chart Placeholder (AI-powered trends)</span>
          <button className="ghost chart-export-btn">📊 Export</button>
        </div>
        <div className="chart-container">
          <h4>Loan Status Distribution</h4>
          <span className="chart-placeholder">Donut Chart Placeholder</span>
          <button className="ghost chart-export-btn">📊 Export</button>
        </div>
        <div className="chart-container">
          <h4>SLA Adherence Rate</h4>
          <span className="chart-placeholder">Gauge Chart Placeholder</span>
          <button className="ghost chart-export-btn">📊 Export</button>
        </div>
      </div>

      <div className="card recent-activity-feed">
        <h3>Recent Activities <span className="live-indicator"></span></h3>
        {sampleActivities.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {sampleActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-icon">
                  {activity.type === 'status_update' ? '🔄' :
                   activity.type === 'document_upload' ? '📄' :
                   activity.type === 'comment_added' ? '💬' :
                   activity.type === 'loan_creation' ? '➕' :
                   activity.type === 'sla_breach' ? '🚨' : 'ℹ️'}
                </span>
                <div className="activity-details">
                  <p>{activity.description}</p>
                  <span className="timestamp">{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-light)' }}>No recent activity.</p>
        )}
      </div>
    </>
  );

  const LoanCard = ({ loan, onClick, currentUserRole, onQuickAction }) => {
    const statusInfo = STATUS_COLORS_MAP[loan.status] || STATUS_COLORS_MAP.Exception;
    const canEdit = ROLES[currentUserRole]?.canEditLoan;
    const canApprove = ROLES[currentUserRole]?.canApproveLoan;

    return (
      <div
        className={`card loan-card clickable-card status-${loan.status.replace(/\s/g, '')}`}
        onClick={() => onClick(loan.id)}
      >
        <div className="loan-card-quick-actions" onClick={(e) => e.stopPropagation()}>
          {canEdit && <button className="ghost" onClick={() => onQuickAction('Edit', loan.id)}>✏️ Edit</button>}
          {canApprove && loan.status === 'Pending' && <button className="ghost" onClick={() => onQuickAction('Approve', loan.id)}>✅ Approve</button>}
          <button className="ghost" onClick={() => onQuickAction('View', loan.id)}>👁️ View</button>
        </div>
        <div className="loan-card-meta">
          <div style={{ fontWeight: 600 }}>{loan.id}</div>
          <span className={`loan-card-status-badge ${statusInfo.className}`}>{loan.status}</span>
        </div>
        <h3>{loan.applicantName}</h3>
        <p><strong>Type:</strong> {loan.loanType}</p>
        <p><strong>Amount:</strong> ${loan.amount?.toLocaleString()}</p>
        <p><strong>Current Stage:</strong> {loan.currentStage}</p>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-light)' }}>
          Last Updated: {loan.lastUpdated}
        </div>
      </div>
    );
  };

  const LoanList = () => (
    <>
      <Breadcrumbs path={[{ label: 'Loan Applications', screen: 'LOAN_LIST' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2>Loan Applications ({filteredLoans.length})</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="secondary" onClick={() => setShowFilterPanel(prev => !prev)}>
            {showFilterPanel ? 'Hide Filters' : 'Show Filters'} 🔎
          </button>
          {ROLES[currentUserRole]?.canCreateLoan && (
            <button className="primary" onClick={handleCreateNewLoan}>➕ Create New Loan</button>
          )}
          {ROLES[currentUserRole]?.canExportReports && (
            <button className="secondary">⬇️ Export List</button>
          )}
          {/* Bulk Actions Placeholder */}
          {filteredLoans.length > 0 && <button className="secondary">📦 Bulk Actions</button>}
        </div>
      </div>

      <div className="filter-main-content">
        <div className="list-content-area">
          {filteredLoans.length > 0 ? (
            <div className="card-grid">
              {filteredLoans.map(loan => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onClick={(id) => handleNavigate('LOAN_DETAIL', { id })}
                  currentUserRole={currentUserRole}
                  onQuickAction={handleQuickAction}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">📄</span>
              <h3>No Loans Found</h3>
              <p>It looks like there are no loan applications matching your criteria. Try adjusting your filters or search terms.</p>
              {ROLES[currentUserRole]?.canCreateLoan && (
                <button className="primary" onClick={handleCreateNewLoan}>➕ Create First Loan</button>
              )}
            </div>
          )}
        </div>

        {showFilterPanel && (
          <div className="filter-panel">
            <h4>Filter Loans</h4>
            <div className="filter-group">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.keys(STATUS_COLORS_MAP).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="loanTypeFilter">Loan Type</label>
              <select
                id="loanTypeFilter"
                value={filters.loanType}
                onChange={(e) => handleFilterChange('loanType', e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Auto Loan">Auto Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Education Loan">Education Loan</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="applicantFilter">Applicant Name</label>
              <input
                id="applicantFilter"
                type="text"
                placeholder="e.g., Alice Johnson"
                value={filters.applicant}
                onChange={(e) => handleFilterChange('applicant', e.target.value)}
              />
            </div>
            <div className="filter-panel-actions">
              <button className="secondary" onClick={handleClearFilters}>Clear All</button>
              <button className="primary" onClick={handleApplyFilters}>Apply Filters</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const LoanDetail = ({ loanId }) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return <div className="card">Loan not found.</div>;

    const canEdit = ROLES[currentUserRole]?.canEditLoan;
    const canApprove = ROLES[currentUserRole]?.canApproveLoan;
    const canReject = ROLES[currentUserRole]?.canRejectLoan;
    const canViewAudit = ROLES[currentUserRole]?.canViewAllLogs;

    const statusInfo = STATUS_COLORS_MAP[loan.status] || STATUS_COLORS_MAP.Exception;

    return (
      <>
        <Breadcrumbs path={[{ label: 'Loan Applications', screen: 'LOAN_LIST' }, { label: `${loan.id} - ${loan.applicantName}`, screen: 'LOAN_DETAIL', params: { id: loan.id } }]} />
        <div className="detail-page-layout">
          <div className="detail-main-content">
            <div className="card record-summary-card">
              <div className="record-summary-header">
                <h2>{loan.applicantName} - {loan.loanType} ({loan.id})</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <span className={`loan-card-status-badge ${statusInfo.className}`}>{loan.status}</span>
                  {canEdit && <button className="secondary" onClick={() => handleNavigate('LOAN_FORM', { id: loan.id })}>✏️ Edit Loan</button>}
                  {canApprove && loan.status === 'Pending' && <button className="primary">✅ Approve</button>}
                  {canReject && (loan.status === 'Pending' || loan.status === 'In Progress') && <button className="secondary">❌ Reject</button>}
                  {ROLES[currentUserRole]?.canManageUsers && <button className="secondary" onClick={() => handleDeleteLoan(loan.id)}>🗑️ Delete</button>}
                </div>
              </div>
              <div className="record-summary-info">
                <div className="record-summary-item">
                  <label>Loan Type</label>
                  <span>{loan.loanType}</span>
                </div>
                <div className="record-summary-item">
                  <label>Amount</label>
                  <span>${loan.amount?.toLocaleString()}</span>
                </div>
                <div className="record-summary-item">
                  <label>Submitted Date</label>
                  <span>{loan.submittedDate}</span>
                </div>
                <div className="record-summary-item">
                  <label>Last Updated</label>
                  <span>{loan.lastUpdated}</span>
                </div>
                <div className="record-summary-item">
                  <label>Credit Score</label>
                  <span>{loan.creditScore || 'N/A'}</span>
                </div>
                <div className="record-summary-item">
                  <label>Risk Score</label>
                  <span>{loan.riskScore}</span>
                </div>
              </div>

              <div className="milestone-tracker">
                <h3>Workflow Progress (Milestone Tracker)</h3>
                <div className="milestone-steps">
                  {LOAN_STAGES.map((stage, index) => {
                    const isCompleted = index <= loan.progress;
                    const isCurrent = index === loan.progress;
                    const slaForStage = loan.sla?.[stage];
                    const isSlaBreached = slaForStage?.breached;

                    return (
                      <div
                        key={stage}
                        className={`milestone-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isSlaBreached ? 'sla-breach' : ''}`}
                      >
                        <div className="milestone-icon">
                          {isCompleted ? '✔️' : index + 1}
                        </div>
                        <div className="milestone-label">{stage}</div>
                        {isSlaBreached && <div className="milestone-sla breached">SLA Breached!</div>}
                        {slaForStage && !isSlaBreached && <div className="milestone-sla">Due: {slaForStage.deadline}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            {canViewAudit && (
              <div className="card audit-feed-card">
                <h3>News / Audit Feed <span className="live-indicator"></span></h3>
                {sampleActivities.filter(a => a.loanId === loanId).length > 0 ? (
                  <div>
                    {sampleActivities.filter(a => a.loanId === loanId).map(activity => (
                      <div key={activity.id} className="activity-item">
                        <span className="activity-icon">
                        {activity.type === 'status_update' ? '🔄' :
                        activity.type === 'document_upload' ? '📄' :
                        activity.type === 'comment_added' ? '💬' :
                        activity.type === 'loan_creation' ? '➕' :
                        activity.type === 'sla_breach' ? '🚨' : 'ℹ️'}
                        </span>
                        <div className="activity-details">
                          <p>{activity.description}</p>
                          <span className="timestamp">{activity.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-light)' }}>No audit history for this loan.</p>
                )}
              </div>
            )}

            <div className="card related-documents-card">
              <h3>Related Documents ({loan.documents?.length || 0})</h3>
              {loan.documents?.length > 0 ? (
                <div>
                  {loan.documents.map(doc => (
                    <div key={doc.id} className="document-item">
                      <span className="doc-name">📄 {doc.name}</span>
                      <div className="doc-actions">
                        <button className="ghost">Preview</button>
                        <button className="ghost">Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-light)' }}>No documents uploaded.</p>
              )}
              {canEdit && <button className="primary" style={{ marginTop: 'var(--spacing-md)' }}>Upload Document</button>}
            </div>
          </div>
        </div>
      </>
    );
  };

  const LoanForm = ({ loanId }) => {
    const isEdit = !!loanId;
    const existingLoan = isEdit ? loans.find(l => l.id === loanId) : null;

    const [formData, setFormData] = useState({
      applicantName: existingLoan?.applicantName || '',
      loanType: existingLoan?.loanType || 'Home Loan',
      amount: existingLoan?.amount || '',
      ...existingLoan, // Spread existing properties, but override with form-specific initial values if needed
    });

    const [errors, setErrors] = useState({});

    const handleFormChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear error for this field on change
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
      let newErrors = {};
      if (!formData.applicantName) newErrors.applicantName = 'Applicant Name is mandatory.';
      if (!formData.loanType) newErrors.loanType = 'Loan Type is mandatory.';
      if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be a positive number.';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        handleSaveLoanForm(formData);
      }
    };

    const handleFileUpload = (e) => {
      // Placeholder for file upload logic
      console.log('File uploaded:', e.target.files[0]?.name);
      // In a real app, this would upload the file and update loan.documents
    };

    return (
      <>
        <Breadcrumbs path={[
          { label: 'Loan Applications', screen: 'LOAN_LIST' },
          { label: isEdit ? `Edit ${existingLoan?.id}` : 'Create New Loan', screen: 'LOAN_FORM', params: { id: loanId } }
        ]} />
        <div className="form-page-layout">
          <div className="card form-card">
            <h2>{isEdit ? `Edit Loan: ${existingLoan?.applicantName} (${existingLoan?.id})` : 'Create New Loan Application'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="applicantName">Applicant Name <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="applicantName"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleFormChange}
                  readOnly={!ROLES[currentUserRole]?.canEditLoan && isEdit} // Field-level security
                />
                {errors.applicantName && <p className="error-message">{errors.applicantName}</p>}
                <p className="field-description">Full legal name of the loan applicant.</p>
              </div>

              <div className="form-group">
                <label htmlFor="loanType">Loan Type <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="loanType"
                  name="loanType"
                  value={formData.loanType}
                  onChange={handleFormChange}
                  disabled={!ROLES[currentUserRole]?.canEditLoan && isEdit}
                >
                  <option value="Home Loan">Home Loan</option>
                  <option value="Auto Loan">Auto Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Business Loan">Business Loan</option>
                  <option value="Education Loan">Education Loan</option>
                </select>
                {errors.loanType && <p className="error-message">{errors.loanType}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="amount">Loan Amount <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  readOnly={!ROLES[currentUserRole]?.canEditLoan && isEdit}
                />
                {errors.amount && <p className="error-message">{errors.amount}</p>}
              </div>

              {isEdit && (
                <div className="form-group">
                  <label htmlFor="currentStage">Current Stage (Auto-populated)</label>
                  <input
                    type="text"
                    id="currentStage"
                    name="currentStage"
                    value={formData.currentStage}
                    readOnly
                    style={{ backgroundColor: 'var(--color-dark-gray)' }}
                  />
                  <p className="field-description">This field is updated automatically by the workflow.</p>
                </div>
              )}

              {ROLES[currentUserRole]?.canEditLoan && (
                <div className="form-group">
                  <label>Document Upload</label>
                  <div className="file-upload-area">
                    <input type="file" id="fileUpload" onChange={handleFileUpload} />
                    <label htmlFor="fileUpload">Click to upload files or drag & drop</label>
                    <p style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                  {/* Display existing documents if editing */}
                  {isEdit && formData.documents?.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <p>Attached Documents:</p>
                      <ul>
                        {formData.documents.map(doc => <li key={doc.id}>{doc.name}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => handleNavigate('LOAN_LIST')}>
                  Cancel
                </button>
                {(ROLES[currentUserRole]?.canCreateLoan && !isEdit) || (ROLES[currentUserRole]?.canEditLoan && isEdit) ? (
                  <button type="submit" className="primary">
                    {isEdit ? 'Save Changes' : 'Submit Loan'}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

  // --- Main App Render ---
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {view.screen === 'DASHBOARD' && <Dashboard />}
        {view.screen === 'LOAN_LIST' && <LoanList />}
        {view.screen === 'LOAN_DETAIL' && <LoanDetail loanId={view.params.id} />}
        {view.screen === 'LOAN_FORM' && <LoanForm loanId={view.params.id} />}
      </main>
    </div>
  );
};

export default App;