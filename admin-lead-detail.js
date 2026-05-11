// Lead Detail Modal and Document Preview
// Displays comprehensive lead information and uploaded documents

function openLeadDetailModal(lead) {
  const modal = document.createElement('div');
  modal.id = 'leadDetailModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: var(--dark-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 32px;
  `;

  const scoringData = lead.scoring || {};
  const documents = lead.uploadedFiles || [];
  const businessGoals = lead.businessGoals || [];

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; margin: 0 0 8px 0;">${lead.companyName || 'Unknown Company'}</h2>
        <p style="color: var(--text-secondary); margin: 0;">${lead.industry || 'N/A'} • ${lead.headcount || 0} employees</p>
      </div>
      <button onclick="closeLeadDetailModal()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 24px;">✕</button>
    </div>

    <!-- Score Summary -->
    <div style="background: rgba(186, 117, 23, 0.08); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
        <div>
          <div style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Overall Score</div>
          <div style="font-size: 32px; font-weight: 700; color: var(--gold);">${scoringData.totalScore || 0}</div>
          <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">${lead.priority || 'N/A'} Priority</div>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">ROI Potential</div>
          <div style="font-size: 28px; font-weight: 700; color: var(--gold);">${scoringData.roi || 0}%</div>
          <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">Annual ROI</div>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Payback Period</div>
          <div style="font-size: 28px; font-weight: 700; color: var(--gold);">${scoringData.payback || 0}</div>
          <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">Months</div>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Annual Savings</div>
          <div style="font-size: 28px; font-weight: 700; color: var(--gold);">$${(scoringData.savings / 1000).toFixed(0)}K</div>
          <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">Estimated</div>
        </div>
      </div>
    </div>

    <!-- Score Breakdown -->
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 16px; margin: 0 0 16px 0; color: var(--text-primary);">Score Breakdown</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">ROI Score (40%)</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--gold);">${scoringData.roiScore || 0}</div>
          <div style="background: rgba(186, 117, 23, 0.1); height: 4px; border-radius: 2px; margin-top: 8px;">
            <div style="background: var(--gold); height: 100%; width: ${Math.min(100, (scoringData.roiScore / 40) * 100)}%; border-radius: 2px;"></div>
          </div>
        </div>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Engagement (30%)</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--gold);">${scoringData.engagementScore || 0}</div>
          <div style="background: rgba(186, 117, 23, 0.1); height: 4px; border-radius: 2px; margin-top: 8px;">
            <div style="background: var(--gold); height: 100%; width: ${Math.min(100, (scoringData.engagementScore / 30) * 100)}%; border-radius: 2px;"></div>
          </div>
        </div>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Company (30%)</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--gold);">${scoringData.companyScore || 0}</div>
          <div style="background: rgba(186, 117, 23, 0.1); height: 4px; border-radius: 2px; margin-top: 8px;">
            <div style="background: var(--gold); height: 100%; width: ${Math.min(100, (scoringData.companyScore / 30) * 100)}%; border-radius: 2px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Company Details -->
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 16px; margin: 0 0 16px 0; color: var(--text-primary);">Company Details</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Email</div>
          <div style="color: var(--text-primary); font-weight: 500;">${lead.email || 'N/A'}</div>
        </div>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Annual Revenue</div>
          <div style="color: var(--text-primary); font-weight: 500;">$${(parseInt(lead.revenue) / 1000000).toFixed(1)}M</div>
        </div>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Labor Rate</div>
          <div style="color: var(--text-primary); font-weight: 500;">$${lead.laborRate}/hour</div>
        </div>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Automation Level</div>
          <div style="color: var(--text-primary); font-weight: 500;">${lead.automationLevel}%</div>
        </div>
      </div>
    </div>

    <!-- Business Goals -->
    ${businessGoals.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; margin: 0 0 16px 0; color: var(--text-primary);">Business Goals</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${businessGoals.map(goal => `
            <span style="background: rgba(186, 117, 23, 0.1); color: var(--gold); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              ${goal}
            </span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Additional Comments -->
    ${lead.additionalComments ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; margin: 0 0 16px 0; color: var(--text-primary);">Additional Comments</h3>
        <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; color: var(--text-secondary); line-height: 1.6;">
          ${lead.additionalComments}
        </div>
      </div>
    ` : ''}

    <!-- Documents -->
    ${documents.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; margin: 0 0 16px 0; color: var(--text-primary);">Uploaded Documents</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
          ${documents.map((doc, idx) => `
            <div style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer;" onclick="previewDocument('${doc.name}', '${doc.type}')">
              <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
              <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); word-break: break-word;">${doc.name}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${(doc.size / 1024 / 1024).toFixed(1)}MB</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Action Buttons -->
    <div style="display: flex; gap: 12px; margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 24px;">
      <button onclick="contactLeadEmail('${lead.email}')" style="flex: 1; padding: 12px 20px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
        Send Email
      </button>
      <button onclick="updateLeadStatus('${lead.id}', 'contacted')" style="flex: 1; padding: 12px 20px; background: var(--dark-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
        Mark as Contacted
      </button>
      <button onclick="closeLeadDetailModal()" style="flex: 1; padding: 12px 20px; background: var(--dark-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
        Close
      </button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLeadDetailModal();
  });
}

function closeLeadDetailModal() {
  const modal = document.getElementById('leadDetailModal');
  if (modal) modal.remove();
}

function previewDocument(docName, docType) {
  alert(`Document Preview: ${docName}\nType: ${docType}\n\nFull preview functionality would open the document in a viewer.`);
}

function contactLeadEmail(email) {
  if (email) {
    window.location.href = `mailto:${email}?subject=Micap AI - ROI Analysis Follow-up&body=Hi,\n\nThank you for using our ROI Calculator. We'd like to discuss your automation opportunities further.\n\nBest regards,\nMicap AI Team`;
  }
}

function updateLeadStatus(leadId, status) {
  // API call to update lead status should be implemented here
  // For now, status updates are handled via admin dashboard
  alert(`Lead status updated to: ${status}`);
  // Note: Persistence requires backend API integration
}
