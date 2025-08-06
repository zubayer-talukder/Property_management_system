// Theme Toggle Functionality
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'default';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
    }

    applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('minimalist');
        
        // Apply new theme
        if (theme === 'minimalist') {
            body.classList.add('minimalist');
        }
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update toggle button if it exists
        this.updateToggleButton();
    }

    createThemeToggle() {
        // Create theme toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'themeToggle';
        toggleButton.className = 'btn btn-secondary';
        toggleButton.innerHTML = '<i class="fas fa-palette"></i> Theme';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            border-radius: 50px;
            padding: 12px 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Add click event
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.body.appendChild(toggleButton);
        this.updateToggleButton();
    }

    updateToggleButton() {
        const button = document.getElementById('themeToggle');
        if (!button) return;
        
        if (this.currentTheme === 'minimalist') {
            button.innerHTML = '<i class="fas fa-magic"></i> Rich UI';
            button.title = 'Switch to Rich UI';
        } else {
            button.innerHTML = '<i class="fas fa-circle"></i> Minimal';
            button.title = 'Switch to Minimalist UI';
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'minimalist' ? 'default' : 'minimalist';
        this.applyTheme(newTheme);
        
        // Show notification
        this.showThemeNotification(newTheme);
    }

    showThemeNotification(theme) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.theme-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${theme === 'minimalist' ? 'Minimalist UI activated' : 'Rich UI activated'}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1001;
            background: ${theme === 'minimalist' ? '#059669' : '#667eea'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            font-weight: 500;
        `;
        
        // Add CSS animation keyframes if they don't exist
        if (!document.getElementById('themeAnimations')) {
            const style = document.createElement('style');
            style.id = 'themeAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

/*
 * =====================================
 * Copyright (c) 2025 Abdullah Zubayer Talukder
 * All Rights Reserved.
 * 
 * Theme Toggle System
 * Licensed under RMSL
 * =====================================
 */
