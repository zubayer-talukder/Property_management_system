// Property Management System JavaScript

class PropertyManager {
    constructor() {
        this.properties = JSON.parse(localStorage.getItem('properties')) || [];
        this.currentPropertyId = null;
        this.currentRoomId = null;
        this.editingRoomId = null;
        this.editingTenant = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadElectricityBills(); // Load electricity bill data first
        this.renderProperties();
        this.showEmptyState();
    }

    // Load electricity bills from electricity management system
    loadElectricityBills() {
        try {
            const electricityData = localStorage.getItem('currentElectricityBill');
            if (!electricityData) {
                console.log('No electricity bill data found');
                return;
            }

            const electricityBillData = JSON.parse(electricityData);
            const roomElectricityData = electricityBillData.roomElectricityData || {};
            
            console.log('Loading electricity bills:', roomElectricityData);

            // Update each property's rooms with electricity bill data
            this.properties.forEach(property => {
                property.rooms.forEach(room => {
                    // For standard room numbers like 101, 102, 201, use exact matching
                    const roomKey = room.roomNumber?.toString().trim();
                    
                    if (roomKey && roomElectricityData[roomKey]) {
                        const matchedElectricityData = roomElectricityData[roomKey];
                        
                        // Update the current bill with electricity bill amount
                        const electricityBill = matchedElectricityData.currentBill || 0;
                        room.currentBill = electricityBill;
                        room.electricityUnits = matchedElectricityData.unitsUsed || 0;
                        room.electricityPerUnitCost = matchedElectricityData.perUnitCost || 0;
                        room.lastElectricityUpdate = matchedElectricityData.lastUpdated || new Date().toISOString();
                        
                        console.log(`✅ Updated room "${room.roomNumber}" with electricity bill: ৳${electricityBill.toFixed(2)}`);
                    } else {
                        console.log(`❌ No electricity data found for room: ${room.roomNumber}`);
                    }
                });
            });

            // Save updated properties
            this.saveProperties();
            
            // Show notification about electricity bill update
            this.showElectricityUpdateNotification(electricityBillData);
            
        } catch (error) {
            console.error('Error loading electricity bills:', error);
        }
    }

    // Add function to refresh electricity bills from electricity management system
    refreshElectricityBills() {
        this.loadElectricityBills();
        this.renderRooms();
        this.showAlert('Electricity bills refreshed from electricity management system', 'success');
    }

    // Manual function to force update electricity bills
    forceUpdateElectricityBills() {
        console.log('Force updating electricity bills...');
        this.loadElectricityBills();
        
        // Re-render the current view
        if (this.currentPropertyId) {
            const property = this.properties.find(p => p.id === this.currentPropertyId);
            if (property) {
                this.showPropertyDetails(this.currentPropertyId);
            }
        } else {
            this.renderProperties();
        }
        
        this.showAlert('Electricity bills force updated from electricity management system', 'success');
    }

    // Helper method to find matching electricity data for a room
    findMatchingElectricityData(roomKey, roomElectricityData) {
        console.log(`Trying to match room: "${roomKey}"`);
        console.log('Available electricity data keys:', Object.keys(roomElectricityData));
        
        // Simple exact match for standard room numbers (101, 102, 201, etc.)
        if (roomElectricityData[roomKey]) {
            console.log(`✅ Exact match found for: ${roomKey}`);
            return roomElectricityData[roomKey];
        }
        
        console.log(`❌ No match found for room: ${roomKey}`);
        return null;
    }

    // Show notification when electricity bills are updated
    showElectricityUpdateNotification(electricityBillData) {
        const notification = document.createElement('div');
        notification.className = 'electricity-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-bolt"></i>
                <div class="notification-text">
                    <strong>Electricity Bills Updated!</strong>
                    <p>${electricityBillData.totalRooms} rooms updated with total ৳${electricityBillData.totalElectricityBill.toFixed(2)}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
            min-width: 300px;
            overflow: hidden;
        `;
        
        // Add styles for notification content
        const style = document.createElement('style');
        style.textContent = `
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }
            .notification-content i.fas {
                font-size: 20px;
                color: #ffd700;
            }
            .notification-text strong {
                display: block;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .notification-text p {
                font-size: 12px;
                margin: 0;
                opacity: 0.9;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                margin-left: auto;
            }
            .notification-close:hover {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    bindEvents() {
        // Property events
        document.getElementById('addPropertyBtn').addEventListener('click', () => this.showAddPropertyModal());
        document.getElementById('addPropertyForm').addEventListener('submit', (e) => this.handleAddProperty(e));
        document.getElementById('editPropertyForm').addEventListener('submit', (e) => this.handleEditProperty(e));
        document.getElementById('deletePropertyBtn').addEventListener('click', () => this.confirmDeleteProperty());
        document.getElementById('deletePropertyDirectBtn').addEventListener('click', () => this.confirmDeleteProperty());
        document.getElementById('backToPropertiesBtn').addEventListener('click', () => this.showPropertiesView());
        document.getElementById('editPropertyBtn').addEventListener('click', () => this.showEditPropertyModal());

        // Room events
        document.getElementById('addRoomBtn').addEventListener('click', () => this.showAddRoomModal());
        document.getElementById('roomForm').addEventListener('submit', (e) => this.handleRoomSubmit(e));

        // Tenant events
        document.getElementById('backToPropertyBtn').addEventListener('click', () => this.showPropertyDetails(this.currentPropertyId));
        document.getElementById('addTenantBtn').addEventListener('click', () => this.showAddTenantModal());
        document.getElementById('editTenantBtn').addEventListener('click', () => this.showEditTenantModal());
        document.getElementById('deleteTenantBtn').addEventListener('click', () => this.confirmDeleteTenant());
        document.getElementById('tenantForm').addEventListener('submit', (e) => this.handleTenantSubmit(e));

        // File upload for NID picture
        document.getElementById('nidPicture').addEventListener('change', (e) => this.handleNidPictureUpload(e));

        // Real-time calculation for room form
        const roomInputs = ['roomRent', 'currentBill', 'waterBill', 'dustCollection'];
        roomInputs.forEach(inputId => {
            document.getElementById(inputId).addEventListener('input', () => this.calculateRoomTotal());
        });

        // Modal close events
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Property Management Methods
    showAddPropertyModal() {
        document.getElementById('addPropertyForm').reset();
        this.showModal('addPropertyModal');
    }

    showEditPropertyModal() {
        const property = this.getPropertyById(this.currentPropertyId);
        if (property) {
            document.getElementById('editPropertyName').value = property.name;
            document.getElementById('editPropertyAddress').value = property.address || '';
            this.showModal('editPropertyModal');
        }
    }

    handleAddProperty(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const property = {
            id: Date.now().toString(),
            name: document.getElementById('propertyName').value.trim(),
            address: document.getElementById('propertyAddress').value.trim(),
            roomCount: parseInt(document.getElementById('roomCount').value),
            rooms: [],
            createdAt: new Date().toISOString()
        };

        // Create default rooms based on room count
        for (let i = 1; i <= property.roomCount; i++) {
            property.rooms.push({
                id: `${property.id}_room_${i}`,
                number: i.toString(),
                rent: 0,
                currentBill: 0,
                waterBill: 0,
                dustCollection: 0,
                total: 0
            });
        }

        this.properties.push(property);
        this.saveProperties();
        this.renderProperties();
        this.closeModal('addPropertyModal');
        this.showMessage('Property added successfully!', 'success');
    }

    handleEditProperty(e) {
        e.preventDefault();
        const property = this.getPropertyById(this.currentPropertyId);
        if (property) {
            property.name = document.getElementById('editPropertyName').value.trim();
            property.address = document.getElementById('editPropertyAddress').value.trim();
            this.saveProperties();
            this.renderProperties();
            this.renderPropertyDetails(this.currentPropertyId);
            this.closeModal('editPropertyModal');
            this.showMessage('Property updated successfully!', 'success');
        }
    }

    confirmDeleteProperty() {
        const property = this.getPropertyById(this.currentPropertyId);
        if (property) {
            this.showConfirmDialog(
                `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
                () => this.deleteProperty()
            );
        }
    }

    deleteProperty() {
        this.properties = this.properties.filter(p => p.id !== this.currentPropertyId);
        this.saveProperties();
        this.renderProperties();
        this.showPropertiesView();
        this.closeModal('editPropertyModal');
        this.showMessage('Property deleted successfully!', 'success');
    }

    // Room Management Methods
    showAddRoomModal() {
        this.editingRoomId = null;
        document.getElementById('roomModalTitle').innerHTML = '<i class="fas fa-door-open"></i> Add Room';
        document.getElementById('roomSubmitBtn').textContent = 'Add Room';
        document.getElementById('roomForm').reset();
        this.showModal('roomModal');
    }

    showEditRoomModal(roomId) {
        const property = this.getPropertyById(this.currentPropertyId);
        const room = property.rooms.find(r => r.id === roomId);
        
        if (room) {
            this.editingRoomId = roomId;
            document.getElementById('roomModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Room';
            document.getElementById('roomSubmitBtn').textContent = 'Update Room';
            
            document.getElementById('roomNumber').value = room.number;
            document.getElementById('roomRent').value = room.rent;
            document.getElementById('currentBill').value = room.currentBill;
            document.getElementById('waterBill').value = room.waterBill;
            document.getElementById('dustCollection').value = room.dustCollection;
            
            this.calculateRoomTotal();
            this.showModal('roomModal');
        }
    }

    handleRoomSubmit(e) {
        e.preventDefault();
        const property = this.getPropertyById(this.currentPropertyId);
        
        const roomData = {
            number: document.getElementById('roomNumber').value.trim(),
            rent: parseFloat(document.getElementById('roomRent').value) || 0,
            currentBill: parseFloat(document.getElementById('currentBill').value) || 0,
            waterBill: parseFloat(document.getElementById('waterBill').value) || 0,
            dustCollection: parseFloat(document.getElementById('dustCollection').value) || 0
        };

        roomData.total = roomData.rent + roomData.currentBill + roomData.waterBill + roomData.dustCollection;

        if (this.editingRoomId) {
            // Edit existing room
            const roomIndex = property.rooms.findIndex(r => r.id === this.editingRoomId);
            if (roomIndex !== -1) {
                property.rooms[roomIndex] = { ...property.rooms[roomIndex], ...roomData };
                this.showMessage('Room updated successfully!', 'success');
            }
        } else {
            // Add new room
            const newRoom = {
                id: `${property.id}_room_${Date.now()}`,
                ...roomData
            };
            property.rooms.push(newRoom);
            this.showMessage('Room added successfully!', 'success');
        }

        this.saveProperties();
        this.renderPropertyDetails(this.currentPropertyId);
        this.closeModal('roomModal');
    }

    calculateRoomTotal() {
        const rent = parseFloat(document.getElementById('roomRent').value) || 0;
        const current = parseFloat(document.getElementById('currentBill').value) || 0;
        const water = parseFloat(document.getElementById('waterBill').value) || 0;
        const dust = parseFloat(document.getElementById('dustCollection').value) || 0;
        
        const total = rent + current + water + dust;
        document.getElementById('totalAmount').value = total.toFixed(2);
    }

    deleteRoom(roomId) {
        this.showConfirmDialog(
            'Are you sure you want to delete this room?',
            () => {
                const property = this.getPropertyById(this.currentPropertyId);
                property.rooms = property.rooms.filter(r => r.id !== roomId);
                this.saveProperties();
                this.renderPropertyDetails(this.currentPropertyId);
                this.showMessage('Room deleted successfully!', 'success');
            }
        );
    }

    // Rendering Methods
    renderProperties() {
        const grid = document.getElementById('propertiesGrid');
        
        if (this.properties.length === 0) {
            grid.innerHTML = '';
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        
        grid.innerHTML = this.properties.map(property => {
            const totalRent = property.rooms.reduce((sum, room) => sum + room.rent, 0);
            const totalIncome = property.rooms.reduce((sum, room) => sum + room.total, 0);
            
            return `
                <div class="property-card fade-in" onclick="propertyManager.showPropertyDetails('${property.id}')">
                    <h3>${property.name}</h3>
                    <p>${property.address || 'No address provided'}</p>
                    <div class="property-info">
                        <div class="property-stats">
                            <div class="stat">
                                <span class="number">${property.rooms.length}</span>
                                <span class="label">Rooms</span>
                            </div>
                            <div class="stat">
                                <span class="number">৳${totalRent.toLocaleString()}</span>
                                <span class="label">Base Rent</span>
                            </div>
                            <div class="stat">
                                <span class="number">৳${totalIncome.toLocaleString()}</span>
                                <span class="label">Total Income</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showPropertyDetails(propertyId) {
        this.currentPropertyId = propertyId;
        this.renderPropertyDetails(propertyId);
        document.getElementById('propertiesSection').style.display = 'none';
        document.getElementById('propertyDetailsSection').style.display = 'block';
    }

    renderPropertyDetails(propertyId) {
        const property = this.getPropertyById(propertyId);
        if (!property) return;

        // Load electricity bills first to get updated data
        this.loadElectricityBills();

        // Update header
        document.getElementById('propertyDetailsTitle').textContent = property.name;

        // Get electricity data for accurate totals calculation
        const electricityData = localStorage.getItem('currentElectricityBill');
        const roomElectricityData = electricityData ? JSON.parse(electricityData).roomElectricityData || {} : {};

        // Calculate totals with electricity data
        const totals = this.calculatePropertyTotalsWithElectricity(property.rooms, roomElectricityData);

        // Update summary cards with electricity-aware totals
        document.getElementById('totalRooms').textContent = property.rooms.length;
        document.getElementById('totalRent').textContent = `৳${totals.rent.toLocaleString()}`;
        document.getElementById('totalIncome').textContent = `৳${totals.total.toLocaleString()}`;

        // Render rooms table
        this.renderRoomsTable(property.rooms, totals);
    }

    renderRoomsTable(rooms, totals) {
        const tbody = document.getElementById('roomsTableBody');
        
        // Get electricity data for dynamic current bill display
        const electricityData = localStorage.getItem('currentElectricityBill');
        const roomElectricityData = electricityData ? JSON.parse(electricityData).roomElectricityData || {} : {};
        
        tbody.innerHTML = rooms.map(room => {
            // Check if there's electricity data for this room
            const roomKey = room.number?.toString().trim();
            const electricityBill = roomElectricityData[roomKey];
            
            // Use electricity bill if available, otherwise use stored currentBill
            const currentBillAmount = electricityBill ? electricityBill.currentBill : room.currentBill;
            const isFromElectricity = !!electricityBill;
            
            // Update room total with electricity bill if available
            const updatedTotal = room.rent + currentBillAmount + room.waterBill + room.dustCollection;
            
            return `
                <tr>
                    <td>${room.number}</td>
                    <td>৳${room.rent.toLocaleString()}</td>
                    <td class="${isFromElectricity ? 'electricity-bill-cell' : ''}" title="${isFromElectricity ? 'Updated from Electricity Management System' : 'Manual entry'}">
                        ৳${currentBillAmount.toLocaleString()}
                        ${isFromElectricity ? '<i class="fas fa-bolt electricity-icon" title="From Electricity Management"></i>' : ''}
                    </td>
                    <td>৳${room.waterBill.toLocaleString()}</td>
                    <td>৳${room.dustCollection.toLocaleString()}</td>
                    <td><strong>৳${updatedTotal.toLocaleString()}</strong></td>
                    <td>
                        ${room.tenant ? 
                            `<span class="tenant-name" onclick="propertyManager.viewTenantDetails('${room.id}')" title="Click to view details">${room.tenant.name}</span>` : 
                            `<button class="btn btn-primary btn-sm" onclick="propertyManager.showAddTenantModal('${room.id}')" title="Add tenant to this room">
                                <i class="fas fa-plus"></i> Add Tenant
                            </button>`
                        }
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-warning btn-sm" onclick="propertyManager.showEditRoomModal('${room.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="propertyManager.deleteRoom('${room.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update footer totals with electricity data
        const updatedTotals = this.calculatePropertyTotalsWithElectricity(rooms, roomElectricityData);
        document.getElementById('totalRentFooter').textContent = `৳${updatedTotals.rent.toLocaleString()}`;
        document.getElementById('totalCurrentFooter').textContent = `৳${updatedTotals.current.toLocaleString()}`;
        document.getElementById('totalWaterFooter').textContent = `৳${updatedTotals.water.toLocaleString()}`;
        document.getElementById('totalDustFooter').textContent = `৳${updatedTotals.dust.toLocaleString()}`;
        document.getElementById('totalIncomeFooter').textContent = `৳${updatedTotals.total.toLocaleString()}`;
    }

    calculatePropertyTotals(property) {
        return property.rooms.reduce((totals, room) => ({
            rent: totals.rent + room.rent,
            current: totals.current + room.currentBill,
            water: totals.water + room.waterBill,
            dust: totals.dust + room.dustCollection,
            total: totals.total + room.total
        }), { rent: 0, current: 0, water: 0, dust: 0, total: 0 });
    }

    calculatePropertyTotalsWithElectricity(rooms, roomElectricityData) {
        return rooms.reduce((totals, room) => {
            const roomKey = room.number?.toString().trim();
            const electricityBill = roomElectricityData[roomKey];
            const currentBillAmount = electricityBill ? electricityBill.currentBill : room.currentBill;
            const roomTotal = room.rent + currentBillAmount + room.waterBill + room.dustCollection;
            
            return {
                rent: totals.rent + room.rent,
                current: totals.current + currentBillAmount,
                water: totals.water + room.waterBill,
                dust: totals.dust + room.dustCollection,
                total: totals.total + roomTotal
            };
        }, { rent: 0, current: 0, water: 0, dust: 0, total: 0 });
    }

    showPropertiesView() {
        document.getElementById('propertyDetailsSection').style.display = 'none';
        document.getElementById('propertiesSection').style.display = 'block';
        this.currentPropertyId = null;
    }

    // Utility Methods
    getPropertyById(id) {
        return this.properties.find(property => property.id === id);
    }

    saveProperties() {
        localStorage.setItem('properties', JSON.stringify(this.properties));
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showConfirmDialog(message, onConfirm) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmBtn').onclick = () => {
            onConfirm();
            this.closeModal('confirmModal');
        };
        this.showModal('confirmModal');
    }

    showMessage(message, type = 'success') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        // Add to top of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageEl, mainContent.firstChild);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // Tenant Management Methods
    showAddTenantModal(roomId = null) {
        this.editingTenantRoomId = roomId;
        this.editingTenantId = null;
        document.getElementById('tenantModalTitle').textContent = 'Add New Tenant';
        document.getElementById('tenantSubmitBtn').textContent = 'Add Tenant';
        document.getElementById('tenantForm').reset();
        document.getElementById('nidPreview').style.display = 'none';
        document.getElementById('nidPreview').innerHTML = '';
        this.currentNidPicture = null;
        this.showModal('tenantModal');
    }

    showEditTenantModal(roomId) {
        const room = this.getRoomById(roomId);
        if (!room || !room.tenant) return;

        this.editingTenantRoomId = roomId;
        this.editingTenantId = room.tenant.id;
        
        document.getElementById('tenantModalTitle').textContent = 'Edit Tenant';
        document.getElementById('tenantSubmitBtn').textContent = 'Update Tenant';
        
        // Populate all fields
        document.getElementById('tenantName').value = room.tenant.name || '';
        document.getElementById('tenantContact').value = room.tenant.phone || '';
        document.getElementById('tenantEmail').value = room.tenant.email || '';
        document.getElementById('emergencyContact').value = room.tenant.emergencyContact || '';
        document.getElementById('emergencyContactName').value = room.tenant.emergencyContactName || '';
        document.getElementById('nidNumber').value = room.tenant.nidNumber || '';
        document.getElementById('tenantAddress').value = room.tenant.address || '';
        document.getElementById('tenantStatus').value = room.tenant.status || 'Active';
        document.getElementById('leaseStartDate').value = room.tenant.leaseStartDate || '';
        document.getElementById('leaseEndDate').value = room.tenant.leaseEndDate || '';
        document.getElementById('securityDeposit').value = room.tenant.securityDeposit || '';
        document.getElementById('tenantNotes').value = room.tenant.notes || '';
        
        // Show NID picture if exists
        if (room.tenant.nidPicture) {
            document.getElementById('nidPreview').style.display = 'block';
            document.getElementById('nidPreview').innerHTML = `
                <img id="nidImage" src="${room.tenant.nidPicture}" alt="NID Picture" style="max-width: 200px; max-height: 150px; margin-top: 10px; border-radius: 8px;">
                <button type="button" class="btn btn-sm btn-danger" onclick="propertyManager.removeNidPicture()" style="margin-left: 10px;">Remove</button>
            `;
        } else {
            document.getElementById('nidPreview').style.display = 'none';
        }
        
        this.showModal('tenantModal');
    }

    handleTenantSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const tenantData = {
            id: this.editingTenantId || this.generateId(),
            name: formData.get('tenantName'),
            phone: formData.get('tenantPhone'),
            email: formData.get('tenantEmail'),
            emergencyContact: formData.get('tenantEmergencyContact'),
            emergencyContactName: formData.get('emergencyContactName'),
            nidNumber: formData.get('nidNumber'),
            address: formData.get('tenantAddress'),
            status: formData.get('tenantStatus'),
            leaseStartDate: formData.get('leaseStartDate'),
            leaseEndDate: formData.get('leaseEndDate'),
            securityDeposit: parseFloat(formData.get('securityDeposit')) || 0,
            notes: formData.get('tenantNotes'),
            nidPicture: this.currentNidPicture || (this.editingTenantId ? this.getRoomById(this.editingTenantRoomId)?.tenant?.nidPicture : null),
            addedDate: this.editingTenantId ? this.getRoomById(this.editingTenantRoomId)?.tenant?.addedDate : new Date().toISOString()
        };

        if (this.editingTenantRoomId) {
            this.assignTenantToRoom(this.editingTenantRoomId, tenantData);
        }

        this.closeModal('tenantModal');
        this.currentNidPicture = null;
        this.renderCurrentView();
        this.showMessage(this.editingTenantId ? 'Tenant updated successfully!' : 'Tenant added successfully!');
    }

    assignTenantToRoom(roomId, tenantData) {
        const room = this.getRoomById(roomId);
        if (!room) return;

        room.tenant = tenantData;
        this.saveProperties();
    }

    removeTenantFromRoom(roomId) {
        const room = this.getRoomById(roomId);
        if (!room) return;

        delete room.tenant;
        this.saveProperties();
    }

    confirmDeleteTenant() {
        if (!this.editingTenantRoomId) return;
        
        if (confirm('Are you sure you want to remove this tenant from the room?')) {
            this.removeTenantFromRoom(this.editingTenantRoomId);
            this.closeModal('tenantDetailsModal');
            this.renderCurrentView();
            this.showMessage('Tenant removed successfully!');
        }
    }

    viewTenantDetails(roomId) {
        const room = this.getRoomById(roomId);
        if (!room || !room.tenant) return;

        this.editingTenantRoomId = roomId;
        const tenant = room.tenant;
        
        // Personal Information
        document.getElementById('tenantDetailName').textContent = tenant.name || 'N/A';
        document.getElementById('tenantDetailPhone').textContent = tenant.phone || 'N/A';
        document.getElementById('tenantDetailEmail').textContent = tenant.email || 'N/A';
        document.getElementById('tenantDetailStatus').textContent = tenant.status || 'N/A';
        
        // Emergency Contact
        document.getElementById('tenantDetailEmergencyContact').textContent = tenant.emergencyContact || 'N/A';
        document.getElementById('tenantDetailEmergencyContactName').textContent = tenant.emergencyContactName || 'N/A';
        document.getElementById('tenantDetailNidNumber').textContent = tenant.nidNumber || 'N/A';
        
        // Lease Information
        document.getElementById('tenantDetailLeaseStart').textContent = tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'N/A';
        document.getElementById('tenantDetailLeaseEnd').textContent = tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'N/A';
        document.getElementById('tenantDetailSecurityDeposit').textContent = tenant.securityDeposit ? `৳${tenant.securityDeposit.toLocaleString()}` : 'N/A';
        document.getElementById('tenantDetailAddedDate').textContent = tenant.addedDate ? new Date(tenant.addedDate).toLocaleDateString() : 'N/A';
        
        // Address & Notes
        document.getElementById('tenantDetailAddress').textContent = tenant.address || 'N/A';
        document.getElementById('tenantDetailNotes').textContent = tenant.notes || 'N/A';
        
        // Status badge styling
        const statusBadge = document.getElementById('tenantDetailStatus');
        statusBadge.className = `status-badge status-${(tenant.status || 'Active').toLowerCase()}`;
        
        // Show NID picture
        const nidContainer = document.getElementById('tenantDetailNid');
        if (tenant.nidPicture) {
            nidContainer.innerHTML = `
                <img src="${tenant.nidPicture}" alt="NID Picture" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            `;
        } else {
            nidContainer.innerHTML = '<p style="color: #999; font-style: italic;">No NID picture uploaded</p>';
        }
        
        this.showModal('tenantDetailsModal');
    }

    handleNidPictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentNidPicture = e.target.result;
            const preview = document.getElementById('nidPreview');
            const image = document.getElementById('nidImage');
            
            image.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    removeNidPicture() {
        this.currentNidPicture = null;
        document.getElementById('nidPreview').style.display = 'none';
        document.getElementById('nidPicture').value = '';
    }

    generateId() {
        return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderCurrentView() {
        if (this.currentPropertyId) {
            this.renderPropertyDetails(this.currentPropertyId);
        } else {
            this.renderProperties();
        }
    }

    getRoomById(roomId) {
        for (const property of this.properties) {
            const room = property.rooms?.find(r => r.id === roomId);
            if (room) return room;
        }
        return null;
    }
}

// Global functions for HTML onclick handlers
function showAddPropertyModal() {
    propertyManager.showAddPropertyModal();
}

function closeModal(modalId) {
    propertyManager.closeModal(modalId);
}

function showElectricityManagement() {
    // Hide all sections
    document.getElementById('propertiesSection').style.display = 'none';
    document.getElementById('propertyDetailsSection').style.display = 'none';
    document.getElementById('tenantDetailsSection').style.display = 'none';
    
    // Show electricity management section
    document.getElementById('electricityManagementSection').style.display = 'block';
    
    // Initialize electricity manager if not already done
    if (!window.electricityManager) {
        window.electricityManager = new ElectricityManager();
    }
}

function showPropertiesView() {
    // Hide all sections
    document.getElementById('electricityManagementSection').style.display = 'none';
    document.getElementById('propertyDetailsSection').style.display = 'none';
    document.getElementById('tenantDetailsSection').style.display = 'none';
    
    // Show properties section
    document.getElementById('propertiesSection').style.display = 'block';
}

// Electricity Management Integration
class ElectricityManager {
    constructor() {
        this.storageKey = 'electricityData';
        this.loadData();
        this.initElectricity();
    }

    initElectricity() {
        this.bindElectricityEvents();
        this.renderMainMeterTable();
        this.populateMainMeterSelect();
        this.renderCalculationTable();
        this.updateSummaryCards();
    }

    bindElectricityEvents() {
        // Real-time calculation for unit inputs
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('current-unit') || e.target.classList.contains('previous-unit')) {
                this.calculateSubMeterBill(e.target);
            }
        });

        // Add Main Meter button
        const addMainBtn = document.getElementById('addMainMeterBtn');
        if (addMainBtn) {
            addMainBtn.addEventListener('click', () => this.addMainMeter());
        }

        // Back from electricity button
        const backFromElectricityBtn = document.getElementById('backFromElectricityBtn');
        if (backFromElectricityBtn) {
            backFromElectricityBtn.addEventListener('click', () => showPropertiesView());
        }
    }

    // Real-time calculation for sub-meter bills
    calculateSubMeterBill(inputElement) {
        const roomIndex = inputElement.dataset.roomIndex;
        if (!roomIndex) return;
        
        const previousInput = document.querySelector(`.previous-unit[data-room-index="${roomIndex}"]`);
        const currentInput = document.querySelector(`.current-unit[data-room-index="${roomIndex}"]`);
        const unitsUsedInput = document.querySelector(`.units-used[data-room-index="${roomIndex}"]`);
        
        if (!previousInput || !currentInput || !unitsUsedInput) return;
        
        const previous = parseFloat(previousInput.value) || 0;
        const current = parseFloat(currentInput.value) || 0;
        
        if (current >= previous) {
            const unitsUsed = current - previous;
            unitsUsedInput.value = unitsUsed.toFixed(2);
        } else {
            unitsUsedInput.value = '';
        }
    }

    // Main Meter Management
    addMainMeter() {
        const ownerName = document.getElementById('meterOwnerName').value.trim();
        const meterNumber = document.getElementById('meterNumber').value.trim();
        const codeName = document.getElementById('meterCodeName').value.trim();
        const payableTaka = parseFloat(document.getElementById('payableTaka').value);
        
        if (!ownerName || !meterNumber || !codeName || isNaN(payableTaka) || payableTaka <= 0) {
            this.showAlert('Please fill all fields correctly', 'error');
            return;
        }
        
        if (this.mainMeters.some(meter => meter.meterNumber === meterNumber)) {
            this.showAlert('Meter number already exists', 'error');
            return;
        }
        
        const newMainMeter = {
            id: Date.now().toString(),
            ownerName,
            meterNumber,
            codeName,
            payableTaka,
            createdAt: new Date().toISOString(),
            subMeterCount: 0
        };
        
        this.mainMeters.push(newMainMeter);
        this.saveData();
        this.renderMainMeterTable();
        this.populateMainMeterSelect();
        this.clearMainMeterForm();
        this.updateSummaryCards();
        this.showAlert('Main meter added successfully', 'success');
    }

    deleteMainMeter(meterId) {
        if (confirm('Delete this main meter and all sub-meters?')) {
            this.mainMeters = this.mainMeters.filter(meter => meter.id !== meterId);
            this.subMeterData = this.subMeterData.filter(sub => sub.mainMeterId !== meterId);
            this.saveData();
            this.renderMainMeterTable();
            this.populateMainMeterSelect();
            this.renderCalculationTable();
            this.updateSummaryCards();
            this.showAlert('Main meter deleted successfully', 'success');
        }
    }

    renderMainMeterTable() {
        const tbody = document.querySelector('#mainMeterTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.mainMeters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No main meters available</td></tr>';
            return;
        }
        
        this.mainMeters.forEach(meter => {
            const subMeterCount = this.subMeterData.filter(sub => sub.mainMeterId === meter.id).length;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${meter.ownerName}</td>
                <td>${meter.meterNumber}</td>
                <td>${meter.codeName}</td>
                <td>৳${meter.payableTaka.toFixed(2)}</td>
                <td><span class="badge">${subMeterCount}</span></td>
                <td>
                    <button onclick="electricityManager.deleteMainMeter('${meter.id}')" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateMainMeterSelect() {
        const select = document.getElementById('selectedMainMeter');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a Main Meter</option>';
        this.mainMeters.forEach(meter => {
            const option = document.createElement('option');
            option.value = meter.id;
            option.textContent = `${meter.ownerName} - ${meter.meterNumber}`;
            select.appendChild(option);
        });
    }

    clearMainMeterForm() {
        document.getElementById('meterOwnerName').value = '';
        document.getElementById('meterNumber').value = '';
        document.getElementById('meterCodeName').value = '';
        document.getElementById('payableTaka').value = '';
    }

    // Sub-Meter Management
    generateSubMeterFields() {
        const selectedMainMeterId = document.getElementById('selectedMainMeter').value;
        const numberOfRooms = parseInt(document.getElementById('numberOfRooms').value);
        
        if (!selectedMainMeterId) {
            this.showAlert('Please select a main meter first', 'error');
            return;
        }
        
        if (isNaN(numberOfRooms) || numberOfRooms < 1 || numberOfRooms > 20) {
            this.showAlert('Please enter valid number of rooms (1-20)', 'error');
            return;
        }
        
        const container = document.getElementById('subMeterFieldsContainer');
        container.innerHTML = '';
        
        for (let i = 1; i <= numberOfRooms; i++) {
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'sub-meter-field-group';
            fieldGroup.innerHTML = `
                <h4>Room ${i}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Room Name/Number:</label>
                        <input type="text" class="form-control room-name" placeholder="e.g., ${100 + i}" data-room-index="${i}">
                    </div>
                    <div class="form-group">
                        <label>Previous Unit:</label>
                        <input type="number" class="form-control previous-unit" placeholder="Previous month units" min="0" step="0.01" data-room-index="${i}">
                    </div>
                    <div class="form-group">
                        <label>Current Unit:</label>
                        <input type="number" class="form-control current-unit" placeholder="Current month units" min="0" step="0.01" data-room-index="${i}">
                    </div>
                    <div class="form-group">
                        <label>Units Used:</label>
                        <input type="number" class="form-control units-used" readonly data-room-index="${i}">
                    </div>
                </div>
            `;
            container.appendChild(fieldGroup);
        }
        
        document.getElementById('saveSubMeterContainer').style.display = 'block';
    }

    saveSubMeterConfiguration() {
        const selectedMainMeterId = document.getElementById('selectedMainMeter').value;
        const selectedMeter = this.mainMeters.find(meter => meter.id === selectedMainMeterId);
        
        if (!selectedMeter) {
            this.showAlert('Please select a valid main meter', 'error');
            return;
        }
        
        const roomNames = document.querySelectorAll('.room-name');
        const previousUnits = document.querySelectorAll('.previous-unit');
        const currentUnits = document.querySelectorAll('.current-unit');
        const unitsUsed = document.querySelectorAll('.units-used');
        
        if (roomNames.length === 0) {
            this.showAlert('Please generate sub-meter fields first', 'error');
            return;
        }
        
        const subMeters = [];
        let totalUnitsUsed = 0;
        
        for (let i = 0; i < roomNames.length; i++) {
            const roomName = roomNames[i].value.trim();
            const previousUnit = parseFloat(previousUnits[i].value) || 0;
            const currentUnit = parseFloat(currentUnits[i].value) || 0;
            const unitsUsedValue = parseFloat(unitsUsed[i].value) || 0;
            
            if (!roomName) {
                this.showAlert(`Please enter name for room ${i + 1}`, 'error');
                return;
            }
            
            if (currentUnit < previousUnit) {
                this.showAlert(`Current unit cannot be less than previous unit for ${roomName}`, 'error');
                return;
            }
            
            totalUnitsUsed += unitsUsedValue;
            
            subMeters.push({
                id: `${selectedMainMeterId}_${Date.now()}_${i}`,
                mainMeterId: selectedMainMeterId,
                roomName,
                roomNumber: roomName,
                previousUnit,
                currentUnit,
                unitsUsed: unitsUsedValue
            });
        }
        
        if (totalUnitsUsed > selectedMeter.payableTaka) {
            this.showAlert('Total units used cannot exceed meter limit', 'error');
            return;
        }
        
        const perUnitCost = totalUnitsUsed > 0 ? selectedMeter.payableTaka / totalUnitsUsed : 0;
        
        subMeters.forEach(subMeter => {
            subMeter.perUnitCost = perUnitCost;
            subMeter.roomBill = subMeter.unitsUsed * perUnitCost;
        });
        
        // Remove existing sub-meters for this main meter
        this.subMeterData = this.subMeterData.filter(sub => sub.mainMeterId !== selectedMainMeterId);
        this.subMeterData.push(...subMeters);
        
        this.saveData();
        this.renderCalculationTable();
        this.clearSubMeterConfiguration();
        this.updateSummaryCards();
        this.renderMainMeterTable();
        this.updateIndexPageElectricityBill();
        
        this.showAlert(`Sub meter configuration saved! Per unit cost: ৳${perUnitCost.toFixed(2)}`, 'success');
    }

    clearSubMeterConfiguration() {
        document.getElementById('selectedMainMeter').value = '';
        document.getElementById('numberOfRooms').value = '';
        document.getElementById('subMeterFieldsContainer').innerHTML = '';
        document.getElementById('saveSubMeterContainer').style.display = 'none';
    }

    // Calculation Table
    renderCalculationTable() {
        const tbody = document.querySelector('#calculationTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.subMeterData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="no-data">No calculation data available</td></tr>';
            return;
        }
        
        const subMetersByMainMeter = {};
        this.subMeterData.forEach(subMeter => {
            if (!subMetersByMainMeter[subMeter.mainMeterId]) {
                subMetersByMainMeter[subMeter.mainMeterId] = [];
            }
            subMetersByMainMeter[subMeter.mainMeterId].push(subMeter);
        });
        
        Object.keys(subMetersByMainMeter).forEach(mainMeterId => {
            const mainMeter = this.mainMeters.find(m => m.id === mainMeterId);
            if (!mainMeter) return;
            
            const subMeters = subMetersByMainMeter[mainMeterId];
            
            subMeters.forEach((subMeter, index) => {
                const row = document.createElement('tr');
                
                if (index === 0) {
                    row.innerHTML = `
                        <td rowspan="${subMeters.length}" style="font-weight: 600; background: rgba(103, 110, 234, 0.1); border-left: 4px solid #676eea;">${mainMeter.ownerName}</td>
                        <td rowspan="${subMeters.length}" style="font-weight: 700; font-size: 1.1em; color: #e74c3c;">৳${mainMeter.payableTaka.toFixed(2)}</td>
                        <td rowspan="${subMeters.length}" style="font-weight: 500; color: #667eea;">${mainMeter.codeName}</td>
                        <td style="font-weight: 600; color: #2c3e50;">${subMeter.roomName}</td>
                        <td style="color: #27ae60; font-weight: 500;">${subMeter.currentUnit.toFixed(2)}</td>
                        <td style="color: #f39c12; font-weight: 500;">${subMeter.previousUnit.toFixed(2)}</td>
                        <td style="color: #8e44ad; font-weight: 600;">${subMeter.unitsUsed.toFixed(2)}</td>
                        <td style="color: #34495e; font-weight: 500;">৳${subMeter.perUnitCost.toFixed(2)}</td>
                        <td style="color: #e74c3c; font-weight: 700; font-size: 1.1em;">৳${subMeter.roomBill.toFixed(2)}</td>
                        <td>
                            <button onclick="electricityManager.deleteSubMeter('${subMeter.id}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                } else {
                    row.innerHTML = `
                        <td style="font-weight: 600; color: #2c3e50;">${subMeter.roomName}</td>
                        <td style="color: #27ae60; font-weight: 500;">${subMeter.currentUnit.toFixed(2)}</td>
                        <td style="color: #f39c12; font-weight: 500;">${subMeter.previousUnit.toFixed(2)}</td>
                        <td style="color: #8e44ad; font-weight: 600;">${subMeter.unitsUsed.toFixed(2)}</td>
                        <td style="color: #34495e; font-weight: 500;">৳${subMeter.perUnitCost.toFixed(2)}</td>
                        <td style="color: #e74c3c; font-weight: 700; font-size: 1.1em;">৳${subMeter.roomBill.toFixed(2)}</td>
                        <td>
                            <button onclick="electricityManager.deleteSubMeter('${subMeter.id}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                }
                tbody.appendChild(row);
            });
        });
    }

    deleteSubMeter(subMeterId) {
        if (confirm('Are you sure you want to delete this sub-meter?')) {
            this.subMeterData = this.subMeterData.filter(sub => sub.id !== subMeterId);
            this.saveData();
            this.renderCalculationTable();
            this.updateSummaryCards();
            this.renderMainMeterTable();
            this.updateIndexPageElectricityBill();
            this.showAlert('Sub-meter deleted successfully', 'success');
        }
    }

    // Update electricity bills for property management
    updateIndexPageElectricityBill() {
        try {
            const roomElectricityData = {};
            
            this.subMeterData.forEach(subMeter => {
                const mainMeter = this.mainMeters.find(m => m.id === subMeter.mainMeterId);
                const roomKey = subMeter.roomName.trim();
                
                if (roomKey) {
                    roomElectricityData[roomKey] = {
                        currentBill: subMeter.roomBill || 0,
                        unitsUsed: subMeter.unitsUsed || 0,
                        perUnitCost: subMeter.perUnitCost || 0,
                        mainMeter: mainMeter ? mainMeter.ownerName : 'Unknown',
                        meterNumber: mainMeter ? mainMeter.meterNumber : 'Unknown',
                        lastUpdated: new Date().toISOString()
                    };
                }
            });
            
            const totalElectricityBill = this.subMeterData.reduce((sum, sub) => sum + (sub.roomBill || 0), 0);
            const totalUnits = this.subMeterData.reduce((sum, sub) => sum + (sub.unitsUsed || 0), 0);
            const totalRoomsCount = this.subMeterData.length;
            
            const electricityBillData = {
                totalElectricityBill,
                totalUnits,
                totalRooms: totalRoomsCount,
                averageBillPerRoom: totalRoomsCount > 0 ? totalElectricityBill / totalRoomsCount : 0,
                roomElectricityData,
                lastUpdated: new Date().toISOString(),
                mainMetersCount: this.mainMeters.length,
                subMetersCount: this.subMeterData.length
            };
            
            localStorage.setItem('currentElectricityBill', JSON.stringify(electricityBillData));
            
            // Update property manager if available
            if (window.propertyManager) {
                propertyManager.loadElectricityBills();
                if (propertyManager.currentPropertyId) {
                    propertyManager.renderRooms();
                }
            }
            
        } catch (error) {
            console.error('Error updating electricity bill data:', error);
        }
    }

    // Summary Cards
    updateSummaryCards() {
        const totalMainMetersEl = document.getElementById('totalMainMeters');
        const totalSubMetersEl = document.getElementById('totalSubMeters');
        const totalUnitsUsedEl = document.getElementById('totalUnitsUsed');
        const totalBillAmountEl = document.getElementById('totalBillAmount');
        
        if (totalMainMetersEl) totalMainMetersEl.textContent = this.mainMeters.length;
        if (totalSubMetersEl) totalSubMetersEl.textContent = this.subMeterData.length;
        
        const totalUnits = this.subMeterData.reduce((sum, sub) => sum + (sub.unitsUsed || 0), 0);
        if (totalUnitsUsedEl) totalUnitsUsedEl.textContent = totalUnits.toFixed(2);
        
        const totalBill = this.subMeterData.reduce((sum, sub) => sum + (sub.roomBill || 0), 0);
        if (totalBillAmountEl) totalBillAmountEl.textContent = `৳${totalBill.toFixed(2)}`;
    }

    // Data Management
    saveData() {
        const data = {
            mainMeters: this.mainMeters,
            subMeterData: this.subMeterData
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.mainMeters = parsed.mainMeters || [];
                this.subMeterData = parsed.subMeterData || [];
            } else {
                this.mainMeters = [];
                this.subMeterData = [];
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.mainMeters = [];
            this.subMeterData = [];
        }
    }

    exportData() {
        try {
            const data = {
                mainMeters: this.mainMeters,
                subMeterData: this.subMeterData,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `electricity_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showAlert('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Error exporting data', 'error');
        }
    }

    importData(event) {
        try {
            const file = event.target.files[0];
            if (!file) {
                this.showAlert('No file selected', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.mainMeters && data.subMeterData) {
                        this.mainMeters = data.mainMeters;
                        this.subMeterData = data.subMeterData;
                        this.saveData();
                        this.initElectricity();
                        this.showAlert('Data imported successfully', 'success');
                    } else {
                        this.showAlert('Invalid data format', 'error');
                    }
                } catch (parseError) {
                    this.showAlert('Error reading file', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        } catch (error) {
            this.showAlert('Error importing data', 'error');
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all electricity data? This action cannot be undone.')) {
            this.mainMeters = [];
            this.subMeterData = [];
            localStorage.removeItem(this.storageKey);
            this.initElectricity();
            this.showAlert('All data cleared successfully', 'success');
        }
    }

    showAlert(message, type = 'info') {
        if (window.propertyManager && propertyManager.showAlert) {
            propertyManager.showAlert(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize the application
let propertyManager;

document.addEventListener('DOMContentLoaded', () => {
    propertyManager = new PropertyManager();
});


