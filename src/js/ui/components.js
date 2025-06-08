export class UIComponents {
    static createButton({ id, classes = '', text, icon, onClick, title }) {
        const button = document.createElement('button');
        if (id) button.id = id;
        button.className = classes;
        button.innerHTML = icon ? `<i class="${icon}"></i>${text ? ` ${text}` : ''}` : text;
        if (title) button.title = title;
        if (onClick) button.addEventListener('click', onClick);
        return button;
    }

    static createTable({ id, classes = 'table table-striped table-sm', headers, data, onRowClick }) {
        const table = document.createElement('table');
        if (id) table.id = id;
        table.className = classes;
        
        // Create header
        if (headers && headers.length > 0) {
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            headers.forEach(header => {
                const th = document.createElement('th');
                if (typeof header === 'string') {
                    th.textContent = header;
                } else {
                    th.innerHTML = header.content || header.text || '';
                    if (header.width) th.style.width = header.width;
                    if (header.classes) th.className = header.classes;
                }
                headerRow.appendChild(th);
            });
        }
        
        // Create body
        if (data && data.length > 0) {
            const tbody = table.createTBody();
            data.forEach((row, index) => {
                const tr = tbody.insertRow();
                if (onRowClick) tr.addEventListener('click', () => onRowClick(row, index));
                
                row.forEach(cell => {
                    const td = tr.insertCell();
                    if (typeof cell === 'string') {
                        td.innerHTML = cell;
                    } else {
                        td.innerHTML = cell.content || cell.text || '';
                        if (cell.classes) td.className = cell.classes;
                    }
                });
            });
        }
        
        return table;
    }

    static createCard({ title, content, classes = 'card shadow-sm', headerClasses = 'card-header bg-info text-white' }) {
        const card = document.createElement('div');
        card.className = classes;
        
        let html = '';
        if (title) {
            html += `<div class="${headerClasses}"><h5 class="mb-0">${title}</h5></div>`;
        }
        html += `<div class="card-body">${content}</div>`;
        
        card.innerHTML = html;
        return card;
    }

    static createLoadingSpinner(type = 'ring', message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        let spinnerClass = 'ring-spinner';
        if (type === 'dots') spinnerClass = 'modern-spinner';
        if (type === 'gradient') spinnerClass = 'gradient-spinner';
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="${spinnerClass}"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        return overlay;
    }

    static createErrorToast(message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="error-toast-close">&times;</button>
            </div>
        `;
        
        const closeBtn = toast.querySelector('.error-toast-close');
        const closeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeToast);
        
        document.body.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-remove
        if (duration > 0) {
            setTimeout(closeToast, duration);
        }
        
        return toast;
    }
}