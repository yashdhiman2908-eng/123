const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize Database JSON File if not present
function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialDB = {
            users: [],
            payments: [],
            logs: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
        console.log('📁 Created database.json persistent file storage.');
    }
}

function readDB() {
    initDB();
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error('Error reading database.json:', e);
        return { users: [], payments: [], logs: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Error writing to database.json:', e);
        return false;
    }
}

// MIME types dictionary for static server
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Enable CORS for cross-device requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // REST API ENDPOINTS
    if (pathname.startsWith('/api/')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let jsonBody = {};
            try { if (body) jsonBody = JSON.parse(body); } catch (e) {}

            const db = readDB();

            // EXPORT COMPLETE MASTER DATABASE FILE
            if (pathname === '/api/database/export' && req.method === 'GET') {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="rishutrains_master_db.json"'
                });
                res.end(JSON.stringify(db, null, 2));
                return;
            }

            // GET ALL USERS
            if (pathname === '/api/users' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, users: db.users }));
                return;
            }

            // CLIENT SIGNUP
            if (pathname === '/api/signup' && req.method === 'POST') {
                const { name, email, phone, password, passwordHash } = jsonBody;
                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Email and Password are required.' }));
                    return;
                }

                if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'An account with this email address already exists!' }));
                    return;
                }

                const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                const newUser = {
                    userId: 'RT-' + Math.floor(100000 + Math.random() * 900000),
                    name: name || 'Client',
                    email: email,
                    phone: phone || '',
                    password: password,
                    passwordHash: passwordHash || '',
                    membershipStatus: 'INACTIVE',
                    activePlan: 'None',
                    calories: 2200,
                    protein: 150,
                    workoutSplit: 'Push Pull Legs',
                    notes: 'Follow your daily protein targets and log your morning body weight weekly.',
                    completedWorkouts: [],
                    createdAt: nowStr,
                    lastLogin: nowStr
                };

                db.users.push(newUser);
                db.logs.unshift({
                    id: 'LOG-' + Math.floor(100000 + Math.random() * 900000),
                    userId: newUser.userId,
                    userName: newUser.name,
                    userEmail: newUser.email,
                    action: "NEW CLIENT SIGN UP ✨",
                    device: req.headers['user-agent'] || 'Web Browser',
                    ip: req.socket.remoteAddress || 'Client Device',
                    timestamp: nowStr
                });
                writeDB(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: newUser }));
                return;
            }

            // CLIENT LOGIN
            if (pathname === '/api/login' && req.method === 'POST') {
                const { email, password, passwordHash } = jsonBody;
                const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No account found for this email address.' }));
                    return;
                }

                if (user.password === password || (passwordHash && user.passwordHash === passwordHash)) {
                    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                    user.lastLogin = nowStr;

                    db.logs.unshift({
                        id: 'LOG-' + Math.floor(100000 + Math.random() * 900000),
                        userId: user.userId,
                        userName: user.name,
                        userEmail: user.email,
                        action: "CLIENT LOGIN SUCCESS 🟢",
                        device: req.headers['user-agent'] || 'Web Browser',
                        ip: req.socket.remoteAddress || 'Client Device',
                        timestamp: nowStr
                    });
                    writeDB(db);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, user: user }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Incorrect password entered.' }));
                }
                return;
            }

            // SUBMIT PAYMENT PROOF
            if (pathname === '/api/payment/submit' && req.method === 'POST') {
                const { userId, userName, userEmail, plan, amount, utr, proofImage } = jsonBody;
                const txRecord = {
                    txId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
                    userId: userId || 'RT-000',
                    userName: userName || 'Client',
                    userEmail: userEmail || '',
                    plan: plan || 'Pro Tier',
                    amount: amount || '699',
                    utr: utr || '',
                    proofImage: proofImage || '',
                    status: 'PENDING',
                    submittedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                };

                db.payments.unshift(txRecord);
                writeDB(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, payment: txRecord }));
                return;
            }

            // GET ALL PAYMENTS
            if (pathname === '/api/payments' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, payments: db.payments }));
                return;
            }

            // APPROVE PAYMENT
            if (pathname === '/api/payment/approve' && req.method === 'POST') {
                const { txId } = jsonBody;
                const payment = db.payments.find(p => p.txId === txId);
                if (payment) {
                    payment.status = 'APPROVED';
                    const user = db.users.find(u => u.email.toLowerCase() === payment.userEmail.toLowerCase() || u.userId === payment.userId);
                    if (user) {
                        user.membershipStatus = 'ACTIVE';
                        user.activePlan = payment.plan;
                    }
                    writeDB(db);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, payment, user }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Payment record not found.' }));
                }
                return;
            }

            // REJECT PAYMENT
            if (pathname === '/api/payment/reject' && req.method === 'POST') {
                const { txId } = jsonBody;
                const payment = db.payments.find(p => p.txId === txId);
                if (payment) {
                    payment.status = 'REJECTED';
                    writeDB(db);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, payment }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Payment record not found.' }));
                }
                return;
            }

            // ADMIN CHANGE CLIENT PASSWORD
            if (pathname === '/api/user/password' && req.method === 'POST') {
                const { userId, newPassword, newPasswordHash } = jsonBody;
                const user = db.users.find(u => u.userId === userId);
                if (user) {
                    user.password = newPassword;
                    if (newPasswordHash) user.passwordHash = newPasswordHash;
                    writeDB(db);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, user }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'User not found.' }));
                }
                return;
            }

            // GET AUDIT LOGS
            if (pathname === '/api/logs' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, logs: db.logs }));
                return;
            }

            // PURGE ALL DATA
            if (pathname === '/api/purge' && req.method === 'POST') {
                db.users = [];
                db.payments = [];
                db.logs = [];
                writeDB(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Database purged successfully.' }));
                return;
            }

            // Fallback for unknown API
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Endpoint not found.' }));
        });
        return;
    }

    // STATIC FILE SERVER
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

initDB();
server.listen(PORT, () => {
    console.log(`🚀 @rishutrains Server running live on http://localhost:${PORT}`);
});
