// CarLedgr Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.apiBase = '';
        this.organizations = [];
        this.users = [];
        this.licenseTiers = [];
        this.userRoles = [];
        this.currentEditingOrgId = null;
        this.currentEditingUserId = null;
        this.filteredOrganizations = [];
        this.filteredUsers = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.loadOrganizations();
    }

    setupEventListeners() {
        // Health check
        document.getElementById('healthCheck').addEventListener('click', () => this.checkHealth());
        
        // Tab change events
        document.getElementById('users-tab').addEventListener('click', () => this.loadUsers());
        
        // Organization events
        document.getElementById('addOrganization').addEventListener('click', () => this.showOrganizationModal());
        document.getElementById('organizationForm').addEventListener('submit', (e) => this.saveOrganization(e));
        document.getElementById('searchOrganizations').addEventListener('input', () => this.applyOrganizationFilters());
        document.getElementById('sortOrganizations').addEventListener('change', () => this.applyOrganizationFilters());
        document.getElementById('filterOrganizationsLicense').addEventListener('change', () => this.applyOrganizationFilters());
        
        // User events
        document.getElementById('addUser').addEventListener('click', () => this.showUserModal());
        document.getElementById('userForm').addEventListener('submit', (e) => this.saveUser(e));
        document.getElementById('filterOrganization').addEventListener('change', () => this.applyUsersFilters());
        document.getElementById('filterUserRole').addEventListener('change', () => this.applyUsersFilters());
        document.getElementById('searchUsers').addEventListener('input', () => this.applyUsersFilters());
        document.getElementById('sortUsers').addEventListener('change', () => this.applyUsersFilters());
        
        // License type change
        document.getElementById('licenseType').addEventListener('change', (e) => this.handleLicenseTypeChange(e.target.value));
        
        // Free account checkbox
        document.getElementById('isFreeAccount').addEventListener('change', (e) => this.handleFreeAccountChange(e.target.checked));
        
        // Confirmation modal
        document.getElementById('confirmAction').addEventListener('click', () => this.executeConfirmedAction());
        
        // Handle close after user creation
        document.getElementById('closeAfterCreate').addEventListener('click', () => this.resetUserModal());
        document.getElementById('userModal').addEventListener('hidden.bs.modal', () => this.resetUserModal());
        
        // Copy password functionality
        document.getElementById('copyPassword').addEventListener('click', () => this.copyPasswordToClipboard());
    }

    async loadInitialData() {
        try {
            // Load license tiers
            const tiersResponse = await this.apiCall('/api/organizations/data/license-tiers');
            if (tiersResponse.success) {
                this.licenseTiers = tiersResponse.data;
                this.populateLicenseDropdown();
            }

            // Load user roles
            const rolesResponse = await this.apiCall('/api/users/data/roles');
            if (rolesResponse.success) {
                this.userRoles = rolesResponse.data;
                this.populateRoleDropdown();
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // API Helper
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(this.apiBase + endpoint, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    // Health Check
    async checkHealth() {
        try {
            const response = await this.apiCall('/api/health');
            const alert = this.createAlert('success', `
                <strong>Health Check Results:</strong><br>
                Status: ${response.status}<br>
                Database: <span class="health-status health-${response.services.database === 'connected' ? 'connected' : 'disconnected'}">${response.services.database}</span><br>
                Email: <span class="health-status health-${response.services.email === 'configured' ? 'connected' : 'disconnected'}">${response.services.email}</span>
            `);
            this.showAlert(alert);
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Health check failed: ${error.message}`));
        }
    }

    // Organizations Management
    async loadOrganizations() {
        const loading = document.getElementById('organizationsLoading');
        const table = document.getElementById('organizationsTable');
        
        loading.style.display = 'block';
        table.style.display = 'none';

        try {
            const response = await this.apiCall('/api/organizations');
            if (response.success) {
                this.organizations = response.data;
                this.filteredOrganizations = [...this.organizations];
                this.populateOrganizationFilter();
                this.applyOrganizationFilters();
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to load organizations: ${error.message}`));
        } finally {
            loading.style.display = 'none';
            table.style.display = 'block';
        }
    }

    renderOrganizationsTable() {
        const container = document.getElementById('organizationsTable');
        
        if (this.filteredOrganizations.length === 0) {
            const isFiltered = this.organizations.length > 0;
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-building"></i>
                    <h5>${isFiltered ? 'No Organizations Found' : 'No Organizations'}</h5>
                    <p>${isFiltered ? 'Try adjusting your search or filters.' : 'Create your first organization to get started.'}</p>
                    ${isFiltered ? '<button class="btn btn-outline-primary btn-sm" onclick="adminPanel.clearOrganizationFilters()">Clear Filters</button>' : ''}
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-responsive">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">Showing ${this.filteredOrganizations.length} of ${this.organizations.length} organizations</small>
                </div>
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Email</th>
                            <th>Users</th>
                            <th>License</th>
                            <th>Status</th>
                            <th>Subscription</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredOrganizations.map(org => this.renderOrganizationRow(org)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderOrganizationRow(org) {
        const licenseClass = org.license_type ? `license-${org.license_type}` : 'license-free';
        const statusClass = org.license_active ? 'status-active' : 'status-inactive';
        const statusText = org.license_active ? 'Active' : 'Inactive';
        const escapedName = this.escapeHtml(org.name);
        const escapedEmail = this.escapeHtml(org.email);
        
        return `
            <tr>
                <td>
                    <div>
                        <strong>${escapedName}</strong>
                    </div>
                </td>
                <td class="text-truncate-150">${escapedEmail}</td>
                <td>
                    <span class="badge bg-secondary">${org.user_count} users</span>
                </td>
                <td>
                    <span class="${licenseClass}">
                        ${org.license_display_name || 'No License'}
                        ${org.car_limit ? `<br><small>${org.car_limit} cars</small>` : ''}
                    </span>
                </td>
                <td>
                    <span class="${statusClass}">${statusText}</span>
                    ${org.is_free_account ? '<br><small class="text-muted">Free Account</small>' : ''}
                </td>
                <td>
                    ${org.subscription_status ? `<span class="badge bg-${this.getSubscriptionStatusColor(org.subscription_status)}">${this.capitalizeFirst(org.subscription_status)}</span>` : '<small class="text-muted">No Subscription</small>'}
                    ${org.stripe_customer_id ? '<br><small class="text-muted">Stripe Customer</small>' : ''}
                </td>
                <td>
                    <small>${this.formatDate(org.created_at)}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-action" 
                                onclick="adminPanel.confirmEditOrganization('${org.id}')" 
                                title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${org.license_active ? 
                            `<button class="btn btn-outline-warning btn-action" 
                                    onclick="adminPanel.confirmToggleOrganizationStatus('${org.id}', '${escapedName}', false)" 
                                    title="Deactivate">
                                <i class="bi bi-pause-circle"></i>
                            </button>` :
                            `<button class="btn btn-outline-success btn-action" 
                                    onclick="adminPanel.confirmToggleOrganizationStatus('${org.id}', '${escapedName}', true)" 
                                    title="Activate">
                                <i class="bi bi-play-circle"></i>
                            </button>`
                        }
                        <button class="btn btn-outline-danger btn-action" 
                                onclick="adminPanel.confirmDeleteOrganization('${org.id}', '${escapedName}')" 
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    showOrganizationModal(organizationId = null) {
        const modal = new bootstrap.Modal(document.getElementById('organizationModal'));
        const form = document.getElementById('organizationForm');
        const title = document.getElementById('organizationModalTitle');
        
        // Reset form and state
        form.reset();
        document.getElementById('licenseOptions').style.display = 'none';
        document.getElementById('freeAccountFields').style.display = 'none';
        document.getElementById('stripeFields').style.display = 'none';
        document.getElementById('periodFields').style.display = 'none';
        this.currentEditingOrgId = organizationId;
        
        if (organizationId) {
            title.textContent = 'Edit Organization';
            this.loadOrganizationForEdit(organizationId);
        } else {
            title.textContent = 'Add Organization';
        }
        
        modal.show();
    }

    async loadOrganizationForEdit(organizationId) {
        try {
            const response = await this.apiCall(`/api/organizations/${organizationId}`);
            if (response.success) {
                const org = response.data;
                
                // Populate form fields
                document.getElementById('orgName').value = org.name || '';
                document.getElementById('orgEmail').value = org.email || '';
                document.getElementById('orgPhone').value = org.phone || '';
                document.getElementById('orgAddress').value = org.address || '';
                
                if (org.license_type) {
                    document.getElementById('licenseType').value = org.license_type;
                    document.getElementById('carLimit').value = org.car_limit || '';
                    document.getElementById('isFreeAccount').checked = org.is_free_account || false;
                    document.getElementById('isActive').checked = org.license_active !== false;
                    document.getElementById('freeReason').value = org.free_reason || '';
                    document.getElementById('subscriptionStatus').value = org.subscription_status || '';
                    document.getElementById('stripeCustomerId').value = org.stripe_customer_id || '';
                    document.getElementById('stripeSubscriptionId').value = org.stripe_subscription_id || '';
                    
                    // Handle datetime fields
                    if (org.current_period_start) {
                        document.getElementById('currentPeriodStart').value = this.formatDateTimeLocal(org.current_period_start);
                    }
                    if (org.current_period_end) {
                        document.getElementById('currentPeriodEnd').value = this.formatDateTimeLocal(org.current_period_end);
                    }
                    
                    this.handleLicenseTypeChange(org.license_type);
                    if (org.is_free_account) {
                        this.handleFreeAccountChange(true);
                    }
                }
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to load organization: ${error.message}`));
        }
    }

    async saveOrganization(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const spinner = submitButton.querySelector('.spinner-border');
        const formData = new FormData(form);
        
        // Show loading state
        submitButton.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            const data = {};
            for (let [key, value] of formData.entries()) {
                if (key === 'is_free_account' || key === 'is_active') {
                    data[key] = true; // Checkbox was checked
                } else if (value && value.trim()) {
                    data[key] = value.trim();
                } else if (value === '') {
                    // Explicitly set empty strings to null for optional fields
                    data[key] = null;
                }
            }
            
            // Convert car_limit to number if present
            if (data.car_limit) {
                data.car_limit = parseInt(data.car_limit);
            }
            
            // Handle datetime fields
            if (data.current_period_start) {
                data.current_period_start = new Date(data.current_period_start).toISOString();
            }
            if (data.current_period_end) {
                data.current_period_end = new Date(data.current_period_end).toISOString();
            }
            
            // If is_active checkbox wasn't checked, set it to false
            if (!formData.has('is_active')) {
                data.is_active = false;
            }
            
            // If is_free_account checkbox wasn't checked, set it to false
            if (!formData.has('is_free_account')) {
                data.is_free_account = false;
            }
            
            const isEdit = this.currentEditingOrgId !== null;
            const url = isEdit ? `/api/organizations/${this.currentEditingOrgId}` : '/api/organizations';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await this.apiCall(url, {
                method: method,
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                this.showAlert(this.createAlert('success', response.message));
                bootstrap.Modal.getInstance(document.getElementById('organizationModal')).hide();
                await this.loadOrganizations();
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to save organization: ${error.message}`));
        } finally {
            submitButton.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    async editOrganization(organizationId) {
        this.showOrganizationModal(organizationId);
    }

        async deleteOrganization(organizationId, organizationName) {
        this.showConfirmDialog(
            `⚠️ PERMANENT DELETE WARNING ⚠️
            
Are you sure you want to delete the organization "${organizationName}"?

🗑️ This will permanently delete:
• The organization and all its data
• All users in this organization  
• All cars and their maintenance records
• All expenses and attachments
• All custom categories
• License and billing information

⚠️ This action CANNOT be undone!`,
            async () => {
                try {
                    const response = await this.apiCall(`/api/organizations/${organizationId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.success) {
                        // Show detailed success message with what was deleted
                        let alertMessage = response.message;
                        if (response.deletedCounts) {
                            const counts = response.deletedCounts;
                            const details = [];
                            if (counts.users > 0) details.push(`${counts.users} users`);
                            if (counts.cars > 0) details.push(`${counts.cars} cars`);
                            if (counts.expenses > 0) details.push(`${counts.expenses} expenses`);
                            if (counts.maintenanceRecords > 0) details.push(`${counts.maintenanceRecords} maintenance records`);
                            
                            if (details.length > 0) {
                                alertMessage += `\n\n📊 Deletion Summary: ${details.join(', ')}`;
                            }
                        }
                        
                        this.showAlert(this.createAlert('success', alertMessage));
                        await this.loadOrganizations();
                    }
                } catch (error) {
                    this.showAlert(this.createAlert('danger', `Failed to delete organization: ${error.message}`));
                }
            }
        );
    }

    // Users Management
    async loadUsers() {
        const loading = document.getElementById('usersLoading');
        const table = document.getElementById('usersTable');
        
        loading.style.display = 'block';
        table.style.display = 'none';

        try {
            const response = await this.apiCall('/api/users');
            if (response.success) {
                this.users = response.data;
                this.filteredUsers = [...this.users];
                this.populateUserRoleFilter();
                this.applyUsersFilters();
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to load users: ${error.message}`));
        } finally {
            loading.style.display = 'none';
            table.style.display = 'block';
        }
    }

    renderUsersTable() {
        const container = document.getElementById('usersTable');
        
        if (this.filteredUsers.length === 0) {
            const isFiltered = this.users.length > 0;
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-people"></i>
                    <h5>${isFiltered ? 'No Users Found' : 'No Users'}</h5>
                    <p>${isFiltered ? 'Try adjusting your search or filters.' : 'Create your first user to get started.'}</p>
                    ${isFiltered ? '<button class="btn btn-outline-primary btn-sm" onclick="adminPanel.clearUsersFilters()">Clear Filters</button>' : ''}
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-responsive">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">Showing ${this.filteredUsers.length} of ${this.users.length} users</small>
                </div>
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Organization</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredUsers.map(user => this.renderUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderUserRow(user) {
        const roleClass = `role-${user.role_name.toLowerCase()}`;
        const escapedFirstName = this.escapeHtml(user.first_name);
        const escapedLastName = this.escapeHtml(user.last_name);
        const escapedEmail = this.escapeHtml(user.email);
        const escapedOrgName = this.escapeHtml(user.organization_name);
        const userFullName = `${escapedFirstName} ${escapedLastName}`;
        
        return `
            <tr>
                <td>
                    <strong>${userFullName}</strong>
                </td>
                <td class="text-truncate-200">${escapedEmail}</td>
                <td>${escapedOrgName}</td>
                <td>
                    <span class="${roleClass}">${this.capitalizeFirst(user.role_name)}</span>
                </td>
                <td>
                    <small>${this.formatDate(user.created_at)}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-action" 
                                onclick="adminPanel.confirmEditUser('${user.id}')" 
                                title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-action" 
                                onclick="adminPanel.confirmResetUserPassword('${user.id}', '${userFullName}')" 
                                title="Reset Password">
                            <i class="bi bi-key"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" 
                                onclick="adminPanel.confirmDeleteUser('${user.id}', '${userFullName}')" 
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    showUserModal(userId = null) {
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        
        // Reset modal completely
        this.resetUserModal();
        
        // Set up for edit or create
        this.currentEditingUserId = userId;
        if (userId) {
            document.querySelector('#userModal .modal-title').textContent = 'Edit User';
            document.getElementById('sendEmail').checked = false; // Don't send email for edits by default
            this.loadUserForEdit(userId);
        } else {
            document.querySelector('#userModal .modal-title').textContent = 'Add User';
            document.getElementById('sendEmail').checked = true; // Send email for new users by default
        }
        
        modal.show();
    }

    async loadUserForEdit(userId) {
        try {
            const response = await this.apiCall(`/api/users/${userId}`);
            if (response.success) {
                const user = response.data;
                
                // Populate form fields
                document.getElementById('userOrganization').value = user.organization_id || '';
                document.getElementById('userRole').value = user.role_id || '';
                document.getElementById('userFirstName').value = user.first_name || '';
                document.getElementById('userLastName').value = user.last_name || '';
                document.getElementById('userEmail').value = user.email || '';
                document.getElementById('sendEmail').checked = false; // Don't send email for edits
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to load user: ${error.message}`));
        }
    }

    async saveUser(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const spinner = submitButton.querySelector('.spinner-border');
        const formData = new FormData(form);
        
        // Show loading state
        submitButton.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            const data = {};
            for (let [key, value] of formData.entries()) {
                if (key === 'send_email') {
                    data[key] = true;
                } else if (key === 'role_id' && value) {
                    data[key] = parseInt(value);
                } else if (value.trim()) {
                    data[key] = value.trim();
                }
            }
            
            const isEdit = this.currentEditingUserId !== null;
            const url = isEdit ? `/api/users/${this.currentEditingUserId}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await this.apiCall(url, {
                method: method,
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                let message = response.message;
                
                // Show temporary password if generated (only for new users)
                if (response.temp_password && !isEdit) {
                    document.getElementById('tempPassword').textContent = response.temp_password;
                    document.getElementById('passwordDisplay').classList.remove('d-none');
                    
                    if (response.email_sent) {
                        message += ` Email sent successfully.`;
                    } else if (response.email_error) {
                        message += ` Warning: Email failed to send - ${response.email_error}`;
                    }
                    
                    // Hide the submit button and show a "Close" button instead
                    submitButton.style.display = 'none';
                    const closeButton = document.getElementById('closeAfterCreate');
                    closeButton.style.display = 'inline-block';
                    closeButton.textContent = 'Close & Create Another User';
                    
                    // Change modal title to indicate success
                    document.querySelector('#userModal .modal-title').textContent = '✅ User Created Successfully';
                } else {
                    // For edits or when no password shown, close modal normally
                    bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
                }
                
                this.showAlert(this.createAlert('success', message));
                await this.loadUsers();
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to save user: ${error.message}`));
        } finally {
            submitButton.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    async editUser(userId) {
        this.showUserModal(userId);
    }

    async resetUserPassword(userId, userName) {
        this.showConfirmDialog(
            `Reset password for ${userName}? A new temporary password will be generated and emailed to the user.`,
            async () => {
                try {
                    const response = await this.apiCall(`/api/users/${userId}/reset-password`, {
                        method: 'POST',
                        body: JSON.stringify({ send_email: true })
                    });
                    
                    if (response.success) {
                        let message = `Password reset for ${userName}. New password: ${response.temp_password}`;
                        
                        if (response.email_sent) {
                            message += ` Email sent successfully.`;
                        } else if (response.email_error) {
                            message += ` Warning: Email failed to send - ${response.email_error}`;
                        }
                        
                        this.showAlert(this.createAlert('success', message));
                    }
                } catch (error) {
                    this.showAlert(this.createAlert('danger', `Failed to reset password: ${error.message}`));
                }
            }
        );
    }

    async deleteUser(userId, userName) {
        this.showConfirmDialog(
            `Are you sure you want to delete the user "${userName}"?`,
            async () => {
                try {
                    const response = await this.apiCall(`/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.success) {
                        this.showAlert(this.createAlert('success', response.message));
                        await this.loadUsers();
                    }
                } catch (error) {
                    this.showAlert(this.createAlert('danger', `Failed to delete user: ${error.message}`));
                }
            }
        );
    }

    resetUserModal() {
        // Reset form
        document.getElementById('userForm').reset();
        
        // Reset modal state
        this.currentEditingUserId = null;
        document.querySelector('#userModal .modal-title').textContent = 'Add User';
        
        // Hide password display
        document.getElementById('passwordDisplay').classList.add('d-none');
        
        // Reset buttons
        const submitButton = document.querySelector('#userForm button[type="submit"]');
        const closeButton = document.getElementById('closeAfterCreate');
        
        submitButton.style.display = 'inline-block';
        submitButton.disabled = false;
        submitButton.querySelector('.spinner-border').classList.add('d-none');
        
        closeButton.style.display = 'none';
    }

    // Confirmation methods for organizations
    confirmEditOrganization(organizationId) {
        this.showConfirmDialog(
            `⚠️ Edit Organization
            
Are you sure you want to edit this organization?

💡 You'll be able to modify organization details and license settings.`,
            () => this.editOrganization(organizationId),
            'info'
        );
    }

    confirmToggleOrganizationStatus(organizationId, organizationName, activate) {
        const action = activate ? 'activate' : 'deactivate';
        const actionCaps = activate ? 'Activate' : 'Deactivate';
        const warning = activate ? 
            '✅ This will restore access to the organization and all its features.' :
            '⚠️ This will suspend access to the organization. Users will not be able to log in.';
            
        this.showConfirmDialog(
            `🔄 ${actionCaps} Organization
            
Are you sure you want to ${action} "${organizationName}"?

${warning}

💡 This is a soft delete alternative - you can easily reverse this action later.`,
            () => this.toggleOrganizationStatus(organizationId, activate),
            activate ? 'success' : 'warning'
        );
    }

    confirmDeleteOrganization(organizationId, organizationName) {
        // Use existing deleteOrganization method which already has comprehensive warning
        this.deleteOrganization(organizationId, organizationName);
    }

    // Confirmation methods for users  
    confirmEditUser(userId) {
        this.showConfirmDialog(
            `⚠️ Edit User
            
Are you sure you want to edit this user?

💡 You'll be able to modify user details, organization, and role.`,
            () => this.editUser(userId),
            'info'
        );
    }

    confirmResetUserPassword(userId, userName) {
        this.showConfirmDialog(
            `🔑 Reset Password for ${userName}
            
Are you sure you want to reset this user's password?

📧 A new temporary password will be generated and emailed to the user.
⚠️ Their current password will be invalidated immediately.`,
            () => this.resetUserPassword(userId, userName),
            'warning'
        );
    }

    confirmDeleteUser(userId, userName) {
        this.showConfirmDialog(
            `⚠️ PERMANENT DELETE WARNING ⚠️
            
Are you sure you want to delete the user "${userName}"?

🗑️ This will permanently delete:
• The user account and all their data
• All records created by this user
• Access permissions and login credentials

⚠️ This action CANNOT be undone!`,
            () => this.deleteUser(userId, userName)
        );
    }

    // Toggle organization status
    async toggleOrganizationStatus(organizationId, activate) {
        try {
            const response = await this.apiCall(`/api/organizations/${organizationId}/toggle-status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: activate })
            });
            
            if (response.success) {
                this.showAlert(this.createAlert('success', response.message));
                await this.loadOrganizations();
            }
        } catch (error) {
            this.showAlert(this.createAlert('danger', `Failed to ${activate ? 'activate' : 'deactivate'} organization: ${error.message}`));
        }
    }

    async copyPasswordToClipboard() {
        const password = document.getElementById('tempPassword').textContent;
        const copyButton = document.getElementById('copyPassword');
        
        try {
            await navigator.clipboard.writeText(password);
            
            // Provide visual feedback
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '✅ Copied!';
            copyButton.classList.remove('btn-outline-success');
            copyButton.classList.add('btn-success');
            
            setTimeout(() => {
                copyButton.innerHTML = originalText;
                copyButton.classList.remove('btn-success');
                copyButton.classList.add('btn-outline-success');
            }, 2000);
            
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = password;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copyButton.innerHTML = '✅ Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '📋 Copy';
            }, 2000);
        }
    }

    // Organization filtering and sorting
    applyOrganizationFilters() {
        let filtered = [...this.organizations];
        
        // Apply search filter
        const searchTerm = document.getElementById('searchOrganizations').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(org => 
                org.name.toLowerCase().includes(searchTerm) ||
                org.email.toLowerCase().includes(searchTerm) ||
                (org.address && org.address.toLowerCase().includes(searchTerm)) ||
                (org.phone && org.phone.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply license filter
        const licenseFilter = document.getElementById('filterOrganizationsLicense').value;
        if (licenseFilter) {
            filtered = filtered.filter(org => {
                switch (licenseFilter) {
                    case 'active':
                        return org.license_active;
                    case 'inactive':
                        return !org.license_active;
                    case 'free':
                        return org.is_free_account;
                    default:
                        return true;
                }
            });
        }
        
        // Apply sorting
        const sortBy = document.getElementById('sortOrganizations').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'created_asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'users_desc':
                    return (b.user_count || 0) - (a.user_count || 0);
                case 'users_asc':
                    return (a.user_count || 0) - (b.user_count || 0);
                default:
                    return 0;
            }
        });
        
        this.filteredOrganizations = filtered;
        this.renderOrganizationsTable();
    }
    
    clearOrganizationFilters() {
        document.getElementById('searchOrganizations').value = '';
        document.getElementById('sortOrganizations').value = 'name_asc';
        document.getElementById('filterOrganizationsLicense').value = '';
        this.applyOrganizationFilters();
    }

    // Helper Functions
    populateLicenseDropdown() {
        const select = document.getElementById('licenseType');
        select.innerHTML = '<option value="">No License</option>';
        
        this.licenseTiers.forEach(tier => {
            const option = document.createElement('option');
            option.value = tier.tier_name;
            option.textContent = `${tier.display_name} (${tier.car_limit} cars, $${tier.monthly_price}/mo)`;
            select.appendChild(option);
        });
    }

    populateRoleDropdown() {
        const select = document.getElementById('userRole');
        select.innerHTML = '<option value="">Select Role</option>';
        
        this.userRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = this.capitalizeFirst(role.role_name);
            select.appendChild(option);
        });
    }

    populateOrganizationFilter() {
        const select = document.getElementById('filterOrganization');
        const userOrgSelect = document.getElementById('userOrganization');
        
        // Update filter dropdown
        select.innerHTML = '<option value="">All Organizations</option>';
        this.organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = org.name;
            select.appendChild(option);
        });

        // Update user organization dropdown
        userOrgSelect.innerHTML = '<option value="">Select Organization</option>';
        this.organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = org.name;
            userOrgSelect.appendChild(option);
        });
    }

    populateUserRoleFilter() {
        const select = document.getElementById('filterUserRole');
        select.innerHTML = '<option value="">All Roles</option>';
        
        this.userRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.role_name;
            option.textContent = this.capitalizeFirst(role.role_name);
            select.appendChild(option);
        });
    }

    // User filtering and sorting
    applyUsersFilters() {
        let filtered = [...this.users];
        
        // Apply search filter
        const searchTerm = document.getElementById('searchUsers').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.first_name.toLowerCase().includes(searchTerm) ||
                user.last_name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.organization_name.toLowerCase().includes(searchTerm) ||
                user.role_name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply organization filter
        const orgFilter = document.getElementById('filterOrganization').value;
        if (orgFilter) {
            filtered = filtered.filter(user => user.organization_id === orgFilter);
        }
        
        // Apply role filter
        const roleFilter = document.getElementById('filterUserRole').value;
        if (roleFilter) {
            filtered = filtered.filter(user => user.role_name === roleFilter);
        }
        
        // Apply sorting
        const sortBy = document.getElementById('sortUsers').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
                case 'name_desc':
                    return (b.first_name + ' ' + b.last_name).localeCompare(a.first_name + ' ' + a.last_name);
                case 'email_asc':
                    return a.email.localeCompare(b.email);
                case 'email_desc':
                    return b.email.localeCompare(a.email);
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'created_asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'org_asc':
                    return a.organization_name.localeCompare(b.organization_name);
                default:
                    return 0;
            }
        });
        
        this.filteredUsers = filtered;
        this.renderUsersTable();
    }
    
    clearUsersFilters() {
        document.getElementById('searchUsers').value = '';
        document.getElementById('filterOrganization').value = '';
        document.getElementById('filterUserRole').value = '';
        document.getElementById('sortUsers').value = 'name_asc';
        this.applyUsersFilters();
    }

    handleLicenseTypeChange(licenseType) {
        const licenseOptions = document.getElementById('licenseOptions');
        const freeAccountFields = document.getElementById('freeAccountFields');
        const stripeFields = document.getElementById('stripeFields');
        const periodFields = document.getElementById('periodFields');
        const carLimitField = document.getElementById('carLimit');
        
        if (licenseType && licenseType !== '') {
            licenseOptions.style.display = 'block';
            
            // Set default car limit based on tier (only if field is empty)
            const tier = this.licenseTiers.find(t => t.tier_name === licenseType);
            if (tier && !carLimitField.value) {
                carLimitField.value = tier.car_limit;
            }
            
            // Show advanced fields for admin use
            freeAccountFields.style.display = 'block';
            stripeFields.style.display = 'block';
            periodFields.style.display = 'block';
        } else {
            licenseOptions.style.display = 'none';
            freeAccountFields.style.display = 'none';
            stripeFields.style.display = 'none';
            periodFields.style.display = 'none';
        }
    }

    handleFreeAccountChange(isChecked) {
        // Free account fields are always visible in admin mode
        // This method can be used for future enhancements
    }

    // UI Helper Functions
    showConfirmDialog(message, onConfirm, actionType = 'danger') {
        const messageElement = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmAction');
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        
        messageElement.textContent = message;
        this.pendingConfirmAction = onConfirm;
        
        // Style based on action type
        messageElement.className = `alert border-2`;
        confirmButton.className = `btn`;
        
        switch(actionType) {
            case 'warning':
                messageElement.classList.add('alert-warning', 'border-warning');
                confirmButton.classList.add('btn-warning');
                confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm d-none" role="status"></span> Deactivate';
                break;
            case 'success':
                messageElement.classList.add('alert-success', 'border-success');
                confirmButton.classList.add('btn-success');
                confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm d-none" role="status"></span> Activate';
                break;
            case 'info':
                messageElement.classList.add('alert-info', 'border-info');
                confirmButton.classList.add('btn-primary');
                confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm d-none" role="status"></span> Confirm';
                break;
            default: // danger
                messageElement.classList.add('alert-danger', 'border-danger');
                confirmButton.classList.add('btn-danger');
                confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm d-none" role="status"></span> Delete';
        }
        
        messageElement.style.whiteSpace = 'pre-line';
        modal.show();
    }

    async executeConfirmedAction() {
        const button = document.getElementById('confirmAction');
        const spinner = button.querySelector('.spinner-border');
        
        button.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            if (this.pendingConfirmAction) {
                await this.pendingConfirmAction();
                bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
            }
        } catch (error) {
            console.error('Confirmed action failed:', error);
        } finally {
            button.disabled = false;
            spinner.classList.add('d-none');
            this.pendingConfirmAction = null;
        }
    }

    createAlert(type, message) {
        return `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    showAlert(alertHtml) {
        const alertArea = document.getElementById('alertArea');
        alertArea.innerHTML = alertHtml;
        
        // Auto-dismiss after 5 seconds for success alerts
        if (alertHtml.includes('alert-success')) {
            setTimeout(() => {
                const alert = alertArea.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }

    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    getSubscriptionStatusColor(status) {
        const colors = {
            'active': 'success',
            'trialing': 'info',
            'past_due': 'warning',
            'canceled': 'secondary',
            'incomplete': 'warning',
            'unpaid': 'danger'
        };
        return colors[status] || 'secondary';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    formatDateTimeLocal(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Format for datetime-local input (YYYY-MM-DDTHH:MM)
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0') + 'T' + 
               String(date.getHours()).padStart(2, '0') + ':' + 
               String(date.getMinutes()).padStart(2, '0');
    }
}

// Initialize the application
const adminPanel = new AdminPanel(); 