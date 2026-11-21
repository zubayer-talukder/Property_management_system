/**
 * ============================================================
 *  Property Management System — Firebase Configuration
 * ============================================================
 *  DEMO / TEST MODE : Leave FIREBASE_CONFIG empty  → OTP = 123456
 *  PRODUCTION MODE  : Paste your Firebase project keys below
 * ============================================================
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCQgKeKDSotHwrdXn5U4ZDQCIlkFhasIe8",
  authDomain: "my-ppm-app-9fe93.firebaseapp.com",
  projectId: "my-ppm-app-9fe93",
  storageBucket: "my-ppm-app-9fe93.firebasestorage.app",
  messagingSenderId: "623413062824",
  appId: "1:623413062824:web:bed09ca4d04ac55a60669d",
  measurementId: "G-ZNCE0H6B3S"
};

const IS_FIREBASE_ENABLED = !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

/* ── Lazy-loaded Firebase module references ─────────────────── */
let _db = null;
let _auth = null;
let _confirmationResult = null;
let _recaptchaVerifier = null;

async function _init() {
    if (!IS_FIREBASE_ENABLED) return {};
    if (_db) return { db: _db, auth: _auth };

    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js");
    const fsModule = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js");

    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _auth = authModule.getAuth(app);
    _db = fsModule.getFirestore(app);

    try { await fsModule.enableIndexedDbPersistence(_db); } catch (_) { }

    return { db: _db, auth: _auth };
}

/* ── Firestore Helpers ──────────────────────────────────────── */
async function fsSet(path, data) {
    if (!IS_FIREBASE_ENABLED) return;
    const { db } = await _init();
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");
    await setDoc(doc(db, ...path.split("/")), data, { merge: true });
}

async function fsGet(path) {
    if (!IS_FIREBASE_ENABLED) return null;
    const { db } = await _init();
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");
    const snap = await getDoc(doc(db, ...path.split("/")));
    return snap.exists() ? snap.data() : null;
}

async function fsDelete(path) {
    if (!IS_FIREBASE_ENABLED) return;
    const { db } = await _init();
    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");
    await deleteDoc(doc(db, ...path.split("/")));
}

/* ── Phone Auth Helpers ─────────────────────────────────────── */
async function sendOTP(phoneE164, containerId) {
    if (!IS_FIREBASE_ENABLED) {
        window._demoPhone = phoneE164;
        return { demo: true };
    }
    const { auth } = await _init();
    const { RecaptchaVerifier, signInWithPhoneNumber } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js");
    if (_recaptchaVerifier) {
        try { _recaptchaVerifier.clear(); } catch (_) {}
        _recaptchaVerifier = null;
    }
    const container = typeof containerId === 'string' ? (document.getElementById(containerId) || containerId) : containerId;
    _recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: "invisible",
        callback: () => {}
    });
    _confirmationResult = await signInWithPhoneNumber(auth, phoneE164, _recaptchaVerifier);
    return _confirmationResult;
}

async function verifyOTP(code) {
    if (!IS_FIREBASE_ENABLED) {
        return code === "123456"
            ? { user: { uid: "demo-phone-" + Date.now(), phoneNumber: window._demoPhone || "+8801712345678", displayName: "Demo Landlord" } }
            : null;
    }
    if (!_confirmationResult) return null;
    return await _confirmationResult.confirm(code);
}

/* ── Google Sign-In Helper ──────────────────────────────────── */
async function signInWithGoogle() {
    if (!IS_FIREBASE_ENABLED) {
        return {
            user: {
                uid: "demo-google-" + Date.now(),
                displayName: "Demo Property Owner",
                email: "owner.demo@gmail.com",
                photoURL: ""
            }
        };
    }
    const { auth } = await _init();
    const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js");
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
}

/* ── Auth State & Logout Helpers ────────────────────────────── */
async function logOut() {
    if (IS_FIREBASE_ENABLED) {
        const { auth } = await _init();
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js");
        await signOut(auth);
    }
}

async function onAuthChange(callback) {
    if (!IS_FIREBASE_ENABLED) return;
    const { auth } = await _init();
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js");
    onAuthStateChanged(auth, callback);
}

/* ── Cloud Backup / Restore ─────────────────────────────────── */
async function backupToCloud(ownerUID, payload) {
    if (!IS_FIREBASE_ENABLED) {
        console.warn("[PMS] Firebase not configured — cloud backup skipped.");
        return false;
    }
    try {
        let safePayload = payload;
        const serialized = JSON.stringify(payload);
        if (serialized.length > 850000 && payload.properties) {
            safePayload = JSON.parse(serialized);
            safePayload.properties.forEach(p => {
                (p.rooms || []).forEach(r => {
                    if (r.tenant) {
                        if (r.tenant.photo && r.tenant.photo.startsWith('data:')) {
                            r.tenant.photo = '';
                        }
                        if (r.tenant.nidImage && r.tenant.nidImage.startsWith('data:')) {
                            r.tenant.nidImage = '';
                        }
                    }
                });
            });
        }
        const now = new Date().toISOString();
        const theme = localStorage.getItem('pms_theme') || 'bluish';
        const clientId = window._pmsClientId || 'client_' + Date.now();
        await fsSet(`owners/${ownerUID}/backup/latest`, {
            ...safePayload,
            theme,
            clientId,
            clientOrigin: window.location.origin,
            backedUpAt: now
        });
        localStorage.setItem('pms_updated_at_' + ownerUID, now);
        return true;
    } catch (err) {
        console.error("backupToCloud error:", err);
        return false;
    }
}

async function restoreFromCloud(ownerUID) {
    if (!IS_FIREBASE_ENABLED) return null;
    return await fsGet(`owners/${ownerUID}/backup/latest`);
}

async function listenToCloudBackup(ownerUID, callback) {
    if (!IS_FIREBASE_ENABLED || !ownerUID) return () => {};
    try {
        const { db } = await _init();
        const { doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");
        const unsub = onSnapshot(doc(db, "owners", ownerUID, "backup", "latest"), (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        }, (err) => {
            console.warn("Real-time cloud listener error:", err);
        });
        return unsub;
    } catch (e) {
        console.warn("Failed to attach cloud listener:", e);
        return () => {};
    }
}

/* ── Firebase Storage & KYC Helpers ─────────────────────────── */
let _storage = null;
async function _initStorage(customBucket) {
    if (!IS_FIREBASE_ENABLED) return null;
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js");
    const { getStorage } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    return customBucket ? getStorage(app, customBucket) : getStorage(app);
}

async function uploadFile(path, blobOrFile) {
    if (!IS_FIREBASE_ENABLED) return null;
    const bucketsToTry = [
        FIREBASE_CONFIG.storageBucket,
        `${FIREBASE_CONFIG.projectId}.firebasestorage.app`,
        `${FIREBASE_CONFIG.projectId}.appspot.com`
    ].filter(Boolean);
    const uniqueBuckets = [...new Set(bucketsToTry)];

    const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js");
    const metadata = {
        contentType: (blobOrFile && blobOrFile.type) ? blobOrFile.type : 'image/jpeg'
    };

    for (const bucket of uniqueBuckets) {
        try {
            const storage = await _initStorage(`gs://${bucket}`);
            if (!storage) continue;
            const storageRef = ref(storage, path);
            const uploadPromise = uploadBytes(storageRef, blobOrFile, metadata);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Storage timeout')), 2500)
            );
            const snap = await Promise.race([uploadPromise, timeoutPromise]);
            const downloadUrl = await getDownloadURL(snap.ref);
            console.log(`[Firebase Storage] Uploaded successfully to gs://${bucket}/${path}`);
            return downloadUrl;
        } catch (err) {
            // Bucket failed or timed out, silently proceed to fallback
        }
    }
    console.warn("[Firebase Storage] Storage bucket not ready or timed out. Falling back to Cloud Firestore storage.");
    return null;
}

async function saveTenantKYC(ownerUID, roomId, kycData) {
    if (!IS_FIREBASE_ENABLED || !ownerUID) return false;
    try {
        await fsSet(`owners/${ownerUID}/tenants/${roomId}`, {
            ...kycData,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (err) {
        console.error("Firestore saveTenantKYC error:", err);
        return false;
    }
}

async function getTenantKYC(ownerUID, roomId) {
    if (!IS_FIREBASE_ENABLED || !ownerUID) return null;
    return await fsGet(`owners/${ownerUID}/tenants/${roomId}`);
}

async function deleteTenantKYC(ownerUID, roomId) {
    if (!IS_FIREBASE_ENABLED || !ownerUID) return false;
    try {
        await fsDelete(`owners/${ownerUID}/tenants/${roomId}`);
        return true;
    } catch (err) {
        console.error("Firestore deleteTenantKYC error:", err);
        return false;
    }
}

/* ── Public API ─────────────────────────────────────────────── */
window.PMS_FB = {
    isEnabled: IS_FIREBASE_ENABLED,
    sendOTP,
    verifyOTP,
    signInWithGoogle,
    logOut,
    onAuthChange,
    backupToCloud,
    restoreFromCloud,
    listenToCloudBackup,
    uploadFile,
    saveTenantKYC,
    getTenantKYC,
    deleteTenantKYC,
    fsSet,
    fsGet,
    fsDelete
};
console.log(`[PMS Firebase] ${IS_FIREBASE_ENABLED ? "PRODUCTION (Firebase connected)" : "DEMO MODE (OTP = 123456)"}`);


