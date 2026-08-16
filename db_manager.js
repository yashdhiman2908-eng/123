/**
 * @rishutrains STANDALONE FILE DATABASE & MEMORY MANAGER
 * Allows full data purge so NOTHING stays saved on your computer disk!
 */

const DBManager = {
    KEYS: {
        USERS: 'rt_users_db',
        PAYMENTS: 'rt_payments_db',
        LOGS: 'rt_audit_logs_db',
        LOGGED_USER: 'rt_logged_user',
        ADMIN_LOGGED: 'rt_admin_logged_in',
        ADMIN_TOKEN: 'rt_admin_session_token'
    },

    // Get Master Database Object
    getMasterDB() {
        return {
            users: JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [],
            payments: JSON.parse(localStorage.getItem(this.KEYS.PAYMENTS)) || [],
            logs: JSON.parse(localStorage.getItem(this.KEYS.LOGS)) || [],
            exportedAt: new Date().toISOString()
        };
    },

    // Save Master Database Object
    saveMasterDB(data) {
        if (data.users) localStorage.setItem(this.KEYS.USERS, JSON.stringify(data.users));
        if (data.payments) localStorage.setItem(this.KEYS.PAYMENTS, JSON.stringify(data.payments));
        if (data.logs) localStorage.setItem(this.KEYS.LOGS, JSON.stringify(data.logs));
    },

    // Export Master Database File
    exportDBFile() {
        const dbData = this.getMasterDB();
        const jsonStr = JSON.stringify(dbData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `rishutrains_master_db_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Import Master Database File
    importDBFile(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.users || importedData.payments) {
                    this.saveMasterDB(importedData);
                    if (callback) callback(true, 'Database imported successfully!');
                } else {
                    if (callback) callback(false, 'Invalid database JSON structure.');
                }
            } catch (err) {
                if (callback) callback(false, 'Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    },

    // PURE MEMORY PURGE — WIPES OUT ALL STORED DATA FROM COMPUTER DISK
    purgeAllComputerStorage() {
        localStorage.clear();
        sessionStorage.clear();
        return true;
    }
};

window.DBManager = DBManager;
