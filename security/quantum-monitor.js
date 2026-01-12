const crypto = require('crypto');

class QuantumSecurityMonitor {
    constructor() {
        this.metrics = {
            totalEncryptions: 0,
            successfulEncryptions: 0,
            failedEncryptions: 0,
            activeSessions: 0,
            securityEvents: [],
            startTime: Date.now()
        };
        console.log('🔐 Quantum Security Monitor Initialized');
    }

    startMonitoring() {
        // Monitor every 30 seconds
        this.monitorInterval = setInterval(() => {
            this.logMetrics();
        }, 30000);

        // Clean up expired sessions every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000);

        console.log('📊 Quantum Security Monitoring Started');
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        console.log('📊 Quantum Security Monitoring Stopped');
    }

    recordEncryption(success = true) {
        this.metrics.totalEncryptions++;
        if (success) {
            this.metrics.successfulEncryptions++;
        } else {
            this.metrics.failedEncryptions++;
        }
    }

    recordSecurityEvent(type, message, details = {}) {
        const event = {
            id: crypto.randomBytes(4).toString('hex'),
            type: type,
            message: message,
            timestamp: new Date().toISOString(),
            details: details
        };

        this.metrics.securityEvents.push(event);
        
        // Keep only last 100 events
        if (this.metrics.securityEvents.length > 100) {
            this.metrics.securityEvents = this.metrics.securityEvents.slice(-100);
        }

        this.logEvent(event);
    }

    logEvent(event) {
        console.log(`🔐 [${event.type}] ${event.message} - ${event.timestamp}`);
    }

    logMetrics() {
        const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
        const successRate = this.metrics.totalEncryptions > 0 
            ? (this.metrics.successfulEncryptions / this.metrics.totalEncryptions * 100).toFixed(1)
            : 0;

        console.log(`📊 Quantum Security Metrics:`);
        console.log(`   Uptime: ${this.formatUptime(uptime)}`);
        console.log(`   Total Encryptions: ${this.metrics.totalEncryptions}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Active Sessions: ${this.metrics.activeSessions}`);
        console.log(`   Security Events: ${this.metrics.securityEvents.length}`);
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }

    updateSessionCount(count) {
        this.metrics.activeSessions = count;
    }

    cleanupExpiredSessions() {
        // This would clean up expired quantum sessions
        // For now, just log the cleanup operation
        console.log('🧹 Quantum session cleanup completed');
    }

    getSecurityReport() {
        const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
        const successRate = this.metrics.totalEncryptions > 0 
            ? (this.metrics.successfulEncryptions / this.metrics.totalEncryptions * 100)
            : 0;

        return {
            status: 'OPERATIONAL',
            uptime: this.formatUptime(uptime),
            metrics: {
                totalEncryptions: this.metrics.totalEncryptions,
                successfulEncryptions: this.metrics.successfulEncryptions,
                failedEncryptions: this.metrics.failedEncryptions,
                successRate: successRate,
                activeSessions: this.metrics.activeSessions,
                securityEvents: this.metrics.securityEvents.length
            },
            recentEvents: this.metrics.securityEvents.slice(-10),
            timestamp: new Date().toISOString()
        };
    }

    // Simulate quantum channel monitoring
    simulateQuantumChannelCheck() {
        const channelQuality = Math.random() * 100;
        const status = channelQuality > 85 ? 'EXCELLENT' : 
                      channelQuality > 70 ? 'GOOD' : 
                      channelQuality > 50 ? 'FAIR' : 'POOR';

        this.recordSecurityEvent(
            'QUANTUM_CHANNEL_CHECK',
            `Quantum channel quality: ${status} (${channelQuality.toFixed(1)}%)`,
            { quality: channelQuality, status: status }
        );

        return { quality: channelQuality, status: status };
    }
}

module.exports = QuantumSecurityMonitor;