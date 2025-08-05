class ElectricityManager {
    constructor() {
        this.storageKey = 'electricityData';
        this.loadData();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderMainMeterTable();
        this.populateMainMeterSelect();
        this.renderCalculationTable();
        this.updateSummaryCards();
    }

    bindEvents() {
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
                        <input type="text" class="form-control room-name" placeholder="e.g., Room A${i}" data-room-index="${i}">
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

    // Calculation Table with Fixed Blur Issue
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
                
                // Fix blur issue by ensuring proper text rendering
                row.style.webkitFontSmoothing = 'antialiased';
                row.style.mozOsxFontSmoothing = 'grayscale';
                row.style.textRendering = 'optimizeLegibility';
                
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
                        <td style="color: #e74c3c; font-weight: 700; font-size: 1.1em; text-shadow: none;">৳${subMeter.roomBill.toFixed(2)}</td>
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
                        <td style="color: #e74c3c; font-weight: 700; font-size: 1.1em; text-shadow: none;">৳${subMeter.roomBill.toFixed(2)}</td>
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

    // Update Index Page with Electricity Bill Data
    updateIndexPageElectricityBill() {
        try {
            console.log('Starting updateIndexPageElectricityBill...');
            console.log('Current subMeterData:', this.subMeterData);
            console.log('Current mainMeters:', this.mainMeters);
            
            const roomElectricityData = {};
            
            // Process sub-meter data for each room
            this.subMeterData.forEach(subMeter => {
                const mainMeter = this.mainMeters.find(m => m.id === subMeter.mainMeterId);
                const roomName = subMeter.roomName || subMeter.roomNumber || 'Unknown Room';
                
                // Create room data object
                const roomData = {
                    currentBill: subMeter.roomBill || 0,
                    unitsUsed: subMeter.unitsUsed || 0,
                    perUnitCost: subMeter.perUnitCost || 0,
                    mainMeter: mainMeter ? mainMeter.ownerName : 'Unknown',
                    meterNumber: mainMeter ? mainMeter.meterNumber : 'Unknown',
                    lastUpdated: new Date().toISOString()
                };
                
                // Store with room number as key (e.g., 101, 102, 201, etc.)
                const roomKey = roomName.trim();
                if (roomKey) {
                    roomElectricityData[roomKey] = roomData;
                }
                
                console.log(`Processed room: ${roomName}`, roomData);
                console.log(`Room keys created:`, roomKeys);
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
            
            // Save to localStorage
            localStorage.setItem('currentElectricityBill', JSON.stringify(electricityBillData));
            
            console.log('Electricity bill data updated for index page:', electricityBillData);
            
            // Verify the data was saved correctly
            const savedData = localStorage.getItem('currentElectricityBill');
            if (!savedData) {
                throw new Error('Failed to save electricity bill data to localStorage');
            }
            
            console.log('Data successfully saved to localStorage');
            
        } catch (error) {
            console.error('Error updating electricity bill for index page:', error);
            throw error; // Re-throw so calling function can handle it
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
            console.log('Export completed successfully');
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
                        this.init();
                        this.showAlert('Data imported successfully', 'success');
                        console.log('Import completed successfully');
                    } else {
                        this.showAlert('Invalid data format - missing required fields', 'error');
                    }
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    this.showAlert('Error reading file - invalid JSON format', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        } catch (error) {
            console.error('Import error:', error);
            this.showAlert('Error importing data', 'error');
        }
    }

    clearAllData() {
        try {
            if (confirm('Are you sure you want to clear all electricity data? This action cannot be undone.')) {
                this.mainMeters = [];
                this.subMeterData = [];
                localStorage.removeItem(this.storageKey);
                this.init();
                this.showAlert('All data cleared successfully', 'success');
                console.log('All data cleared successfully');
            }
        } catch (error) {
            console.error('Clear data error:', error);
            this.showAlert('Error clearing data', 'error');
        }
    }

    linkToIndexPage() {
        try {
            // First check if there's any data to link
            if (this.subMeterData.length === 0) {
                this.showAlert('No electricity bill data found. Please add some main meters and sub-meters first.', 'error');
                return;
            }

            // Update the index page with electricity bill data
            this.updateIndexPageElectricityBill();
            
            // Get the updated data for confirmation
            const electricityData = JSON.parse(localStorage.getItem('currentElectricityBill') || '{}');
            
            // Show detailed success message
            const totalBill = electricityData.totalElectricityBill || 0;
            const totalRooms = electricityData.totalRooms || 0;
            
            this.showAlert(
                `✅ Successfully linked ${totalRooms} rooms with total bill ৳${totalBill.toFixed(2)} to index page! 
                 You can now view updated electricity bills in the main dashboard.`, 
                'success'
            );
            
            console.log('Index page linked successfully with data:', electricityData);
            
            // Ask if user wants to navigate to index page
            if (confirm('Electricity bills have been updated! Would you like to go to the main dashboard to see the changes?')) {
                window.open('index.html', '_blank');
            }
            
        } catch (error) {
            console.error('Link to index error:', error);
            this.showAlert('Error linking to index page: ' + error.message, 'error');
        }
    }

    // Utility Functions
    showAlert(message, type = 'info') {
        const existingAlerts = document.querySelectorAll('.alert-message');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-message`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
            <button onclick="this.parentElement.remove()" class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = document.querySelector('.container');
        const header = container.querySelector('.header');
        container.insertBefore(alertDiv, header.nextSibling);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize
let electricityManager;
document.addEventListener('DOMContentLoaded', function() {
    electricityManager = new ElectricityManager();
});

// Global functions for button onclick events
function addMainMeter() {
    console.log('addMainMeter called');
    if (electricityManager) electricityManager.addMainMeter();
}

function generateSubMeterFields() {
    console.log('generateSubMeterFields called');
    if (electricityManager) electricityManager.generateSubMeterFields();
}

function saveSubMeterConfiguration() {
    console.log('saveSubMeterConfiguration called');
    if (electricityManager) electricityManager.saveSubMeterConfiguration();
}

function exportElectricityData() {
    console.log('exportElectricityData called');
    if (electricityManager) {
        electricityManager.exportData();
    } else {
        console.error('electricityManager not initialized');
        alert('System not ready. Please refresh the page.');
    }
}

function importElectricityData(event) {
    console.log('importElectricityData called', event);
    if (electricityManager) {
        electricityManager.importData(event);
    } else {
        console.error('electricityManager not initialized');
        alert('System not ready. Please refresh the page.');
    }
}

function clearAllElectricityData() {
    console.log('clearAllElectricityData called');
    if (electricityManager) {
        electricityManager.clearAllData();
    } else {
        console.error('electricityManager not initialized');
        alert('System not ready. Please refresh the page.');
    }
}

function linkToIndexPage() {
    console.log('linkToIndexPage called');
    if (electricityManager) {
        electricityManager.linkToIndexPage();
    } else {
        console.error('electricityManager not initialized');
        alert('System not ready. Please refresh the page.');
    }
}

// Test function to verify localStorage integration
function testElectricityBillData() {
    console.log('Testing electricity bill data...');
    const data = localStorage.getItem('currentElectricityBill');
    if (data) {
        const parsed = JSON.parse(data);
        console.log('Current electricity bill data:', parsed);
        
        // Show detailed room data
        const roomKeys = Object.keys(parsed.roomElectricityData || {});
        const roomInfo = roomKeys.map(key => {
            const room = parsed.roomElectricityData[key];
            return `${key}: ৳${room.currentBill?.toFixed(2) || '0.00'}`;
        }).join('\n');
        
        alert(`Found electricity bill data:
Total Rooms: ${parsed.totalRooms}
Total Bill: ৳${parsed.totalElectricityBill?.toFixed(2) || '0.00'}
Last Updated: ${new Date(parsed.lastUpdated).toLocaleString()}

Room Details:
${roomInfo}

Check console for full data structure.`);
    } else {
        console.log('No electricity bill data found');
        alert('No electricity bill data found in localStorage');
    }
}

// Function to debug room matching - simplified for standard room numbers
function debugRoomMatching() {
    const electricityData = localStorage.getItem('currentElectricityBill');
    const propertyData = localStorage.getItem('properties');
    
    if (!electricityData || !propertyData) {
        alert('Missing data! Make sure you have both electricity data and property data.');
        return;
    }
    
    const electricity = JSON.parse(electricityData);
    const properties = JSON.parse(propertyData);
    
    console.log('=== SIMPLIFIED ROOM MATCHING DEBUG ===');
    console.log('Electricity room keys:', Object.keys(electricity.roomElectricityData || {}));
    
    properties.forEach(property => {
        console.log(`\nProperty: ${property.name}`);
        property.rooms.forEach(room => {
            const roomKey = room.roomNumber?.toString().trim();
            const hasMatch = electricity.roomElectricityData && electricity.roomElectricityData[roomKey];
            console.log(`  Room: "${roomKey}" - ${hasMatch ? '✅ MATCHED' : '❌ NO MATCH'} (Current Bill: ৳${room.currentBill || 0})`);
        });
    });
    
    alert('Room matching debug complete. Check console for details.');
}
