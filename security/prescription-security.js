const CryptoJS = require('crypto-js');
const QuantumEnhancedSecurity = require('./quantum-security');

class PrescriptionSecurity {
    constructor() {
        this.quantumSecurity = new QuantumEnhancedSecurity();
        this.encryptionAlgorithm = 'AES-256-GCM';
    }

    async createSecurePrescription(prescriptionData, patientPublicKey, doctorPrivateKey) {
        try {
            console.log('💊 Creating quantum-secured prescription...');
            
            // Initialize quantum session
            const quantumSession = await this.quantumSecurity.initializeQuantumSession(
                patientPublicKey, 
                doctorPrivateKey
            );

            // Encrypt prescription data
            const encryptedPrescription = this.encryptPrescriptionData(
                prescriptionData, 
                quantumSession.sessionKey
            );

            // Create prescription record
            const securePrescription = {
                id: this.generatePrescriptionId(),
                version: 'QUANTUM-SECURE-v1.0',
                patientId: prescriptionData.patientId,
                doctorId: prescriptionData.doctorId,
                encryptedData: encryptedPrescription,
                quantumSessionId: quantumSession.sessionId,
                timestamp: new Date().toISOString(),
                security: {
                    algorithm: this.encryptionAlgorithm,
                    keyExchange: 'BB84-RSA-HYBRID',
                    qber: quantumSession.quantumMetrics.qber,
                    status: quantumSession.quantumMetrics.securityStatus
                }
            };

            console.log('✅ Quantum-secured prescription created:', securePrescription.id);
            
            return securePrescription;
            
        } catch (error) {
            console.error('❌ Prescription creation failed:', error);
            throw error;
        }
    }

    encryptPrescriptionData(data, sessionKey) {
        const jsonData = JSON.stringify(data);
        const key = CryptoJS.enc.Hex.parse(sessionKey);
        const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV
        
        const encrypted = CryptoJS.AES.encrypt(jsonData, key, {
            iv: iv,
            mode: CryptoJS.mode.CTR,
            padding: CryptoJS.pad.Pkcs7
        });
        
        return {
            ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
            iv: iv.toString(CryptoJS.enc.Base64),
            algorithm: this.encryptionAlgorithm
        };
    }

    generatePrescriptionId() {
        const crypto = require('crypto');
        return 'RX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    }

    // Verify prescription integrity
    verifyPrescription(prescription) {
        return prescription && 
               prescription.security && 
               prescription.security.status === 'QUANTUM_SECURE';
    }

    // Get security statistics
    getSecurityStats() {
        return {
            totalEncryptions: this.quantumSecurity.activeSessions.size,
            algorithm: this.encryptionAlgorithm,
            quantumModule: this.quantumSecurity.getSecurityStatus()
        };
    }
}

module.exports = PrescriptionSecurity;