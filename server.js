import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import OpenAI from "openai";

import PrescriptionSecurity from "./security/prescription-security.js";
import PQCIntegration from "./security/pqc-integration.js";
import QuantumSecurityMonitor from "./security/quantum-monitor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const port = 3001;

const dataFilePath = path.join(__dirname, "data.json");
const usersFilePath = path.join(__dirname, "users.json");
const hospitalsFilePath = path.join(__dirname, "hospitals.json");
const doctorsFilePath = path.join(__dirname, "doctors.json");
const prescriptionsFilePath = path.join(__dirname, "prescriptions.json");

const prescriptionSecurity = new PrescriptionSecurity();
const pqcIntegration = new PQCIntegration();
const quantumMonitor = new QuantumSecurityMonitor();

const quantumKeyStore = new Map();
const quantumSessions = new Map();
const prescriptionsStore = new Map();


// Initialize data files
function initializeDataFiles() {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = {
            queue: [],
            dailyTokens: {},
            severityQueue: [],
            slotAllocations: {}
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    }

    if (!fs.existsSync(usersFilePath)) {
        const hashedPassword = bcrypt.hashSync("admin123", 10);
        const initialUsers = [
            {
                id: 1,
                username: "admin",
                password: hashedPassword,
                name: "System Administrator",
                role: "admin",
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(usersFilePath, JSON.stringify(initialUsers, null, 2));
    }

    if (!fs.existsSync(hospitalsFilePath)) {
        const initialHospitals = [
            {
                id: 1,
                name: "General Hospital",
                locality: "Hyderabad",
                address: "123 Main Street, Hyderabad",
                specialties: ["Cardiology", "Orthopedics", "Pediatrics", "Neurology"],
                doctors: [1, 2, 3, 4],
                contact: "+1-555-0101",
                prioritySlots: 2,
                normalSlots: 5,
                totalSlots: 7
            },
            {
                id: 2,
                name: "Vandalur Medical Center",
                locality: "Vandalur",
                address: "456 Oak Avenue, Vandalur",
                specialties: ["Cardiology", "Dermatology", "ENT", "General Surgery"],
                doctors: [5, 6, 7],
                contact: "+1-555-0102",
                prioritySlots: 2,
                normalSlots: 5,
                totalSlots: 7
            },
            {
                id: 3,
                name: "Chettinad Hospital",
                locality: "Chennai",
                address: "789 Pine Road, Chennai",
                specialties: ["Pediatrics", "Gynecology", "Ophthalmology", "Dentistry"],
                doctors: [8, 9],
                contact: "+1-555-0103",
                prioritySlots: 2,
                normalSlots: 5,
                totalSlots: 7
            },
            {
                id: 4,
                name: "Keelambaakam Healthcare",
                locality: "Keelambaakam",
                address: "321 Elm Street, Keelambaakam",
                specialties: ["Neurology", "Psychiatry", "Physiotherapy", "Urology"],
                doctors: [10, 11, 12],
                contact: "+1-555-0104",
                prioritySlots: 2,
                normalSlots: 5,
                totalSlots: 7
            }
        ];
        fs.writeFileSync(hospitalsFilePath, JSON.stringify(initialHospitals, null, 2));
    }

    if (!fs.existsSync(doctorsFilePath)) {
        const initialDoctors = [
            { id: 1, name: "Dr. Sarah", specialty: "Cardiology", hospitalId: 1, available: true },
            { id: 2, name: "Dr. Michael", specialty: "Orthopedics", hospitalId: 1, available: true },
            { id: 3, name: "Dr. Emily", specialty: "Pediatrics", hospitalId: 1, available: true },
            { id: 4, name: "Dr. Robert", specialty: "Neurology", hospitalId: 1, available: true },
            { id: 5, name: "Dr. Lisa", specialty: "Cardiology", hospitalId: 2, available: true },
            { id: 6, name: "Dr. James", specialty: "Dermatology", hospitalId: 2, available: true },
            { id: 7, name: "Dr. Maria", specialty: "ENT", hospitalId: 2, available: true },
            { id: 8, name: "Dr. David", specialty: "Pediatrics", hospitalId: 3, available: true },
            { id: 9, name: "Dr. Jennifer", specialty: "Gynecology", hospitalId: 3, available: true },
            { id: 10, name: "Dr. Thomas", specialty: "Neurology", hospitalId: 4, available: true },
            { id: 11, name: "Dr. Susan", specialty: "Psychiatry", hospitalId: 4, available: true },
            { id: 12, name: "Dr. Kevin", specialty: "Physiotherapy", hospitalId: 4, available: true }
        ];
        fs.writeFileSync(doctorsFilePath, JSON.stringify(initialDoctors, null, 2));
    }

    if (!fs.existsSync(prescriptionsFilePath)) {
        const initialPrescriptions = {
            prescriptions: [],
            quantumKeys: [],
            securityLogs: []
        };
        fs.writeFileSync(prescriptionsFilePath, JSON.stringify(initialPrescriptions, null, 2));
    }
}

// Helper functions
function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) {
            initializeDataFiles();
        }
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading data:", error);
        return { queue: [], dailyTokens: {}, severityQueue: [], slotAllocations: {} };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing data:", error);
    }
}

function readUsers() {
    try {
        if (!fs.existsSync(usersFilePath)) {
            initializeDataFiles();
        }
        const users = fs.readFileSync(usersFilePath);
        return JSON.parse(users);
    } catch (error) {
        console.error("Error reading users:", error);
        return [];
    }
}

function readHospitals() {
    try {
        if (!fs.existsSync(hospitalsFilePath)) {
            initializeDataFiles();
        }
        const hospitals = fs.readFileSync(hospitalsFilePath);
        return JSON.parse(hospitals);
    } catch (error) {
        console.error("Error reading hospitals:", error);
        return [];
    }
}

function readDoctors() {
    try {
        if (!fs.existsSync(doctorsFilePath)) {
            initializeDataFiles();
        }
        const doctors = fs.readFileSync(doctorsFilePath);
        return JSON.parse(doctors);
    } catch (error) {
        console.error("Error reading doctors:", error);
        return [];
    }
}

function readPrescriptions() {
    try {
        if (!fs.existsSync(prescriptionsFilePath)) {
            initializeDataFiles();
        }
        const prescriptions = fs.readFileSync(prescriptionsFilePath);
        return JSON.parse(prescriptions);
    } catch (error) {
        console.error("Error reading prescriptions:", error);
        return { prescriptions: [], quantumKeys: [], securityLogs: [] };
    }
}

function writePrescriptions(data) {
    try {
        fs.writeFileSync(prescriptionsFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing prescriptions:", error);
    }
}

function getAvailableDoctors(hospitalId) {
    const doctors = readDoctors();
    return doctors.filter(doctor => 
        doctor.hospitalId == hospitalId && doctor.available === true
    );
}

function assignDoctorToPatient(hospitalId) {
    const availableDoctors = getAvailableDoctors(hospitalId);
    if (availableDoctors.length === 0) return null;
    
    const data = readData();
    const hospitalPatients = data.queue.filter(p => 
        p.hospitalId == hospitalId && p.status === 'Waiting'
    );
    
    const doctorIndex = hospitalPatients.length % availableDoctors.length;
    return availableDoctors[doctorIndex];
}

// Symptom severity detection
/*function detectSeverity(symptoms) {
    if (!symptoms || symptoms.trim() === '') {
        return 'normal';
    }
    
    const severeKeywords = [
        'chest pain', 'heart attack','cancer','laddu', 'stroke', 'severe bleeding', 'unconscious',
        'difficulty breathing', 'choking', 'severe burn', 'head injury',
        'broken bone', 'severe pain', 'emergency', 'critical', 'fainting',
        'seizure', 'paralysis', 'poisoning', 'allergic reaction', 'anaphylaxis'
    ];
    
    const symptomsLower = symptoms.toLowerCase();
    
    for (const keyword of severeKeywords) {
        if (symptomsLower.includes(keyword)) {
            return 'severity';
        }
    }
    
    return 'normal';
}*/


export async function detectSeverity(symptoms) {
    if (!symptoms || symptoms.trim() === '') {
        return { isSeverity: false, explanation: 'Please describe your symptoms' };
    }

    const prompt = `
You are an intelligent medical triage assistant.
Analyze the following patient symptom description and decide if it requires **immediate medical attention** (high severity) or not (low severity).

Give your answer in **strict JSON format**:
{
  "isSeverity": true/false,
  "level": "priority" or "normal",
  "explanation": "short explanation in plain language"
}

Symptom description: "${symptoms}"
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // fast, cheap, accurate
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
        });

        const content = completion.choices[0].message.content.trim();
        const result = JSON.parse(content);
        return result;

    } catch (error) {
        console.error("Error detecting severity:", error);
        return {
            isSeverity: false,
            level: 'normal',
            explanation: 'Unable to determine severity. Please describe more clearly or consult a doctor.'
        };
    }
}

// Slot management functions
function initializeSlotAllocation(hospitalId, dateString) {
    const data = readData();
    
    if (!data.slotAllocations) {
        data.slotAllocations = {};
    }
    
    const allocationKey = `${hospitalId}-${dateString}`;
    
    if (!data.slotAllocations[allocationKey]) {
        data.slotAllocations[allocationKey] = {
            prioritySlots: Array(2).fill(null),
            normalSlots: Array(5).fill(null),
            nextSlotNumber: 1
        };
        writeData(data);
    }
    
    return data.slotAllocations[allocationKey];
}

function getAvailableSlots(hospitalId, dateString) {
    const allocation = initializeSlotAllocation(hospitalId, dateString);
    
    const availablePrioritySlots = allocation.prioritySlots.filter(slot => slot === null).length;
    const availableNormalSlots = allocation.normalSlots.filter(slot => slot === null).length;
    
    return {
        availablePrioritySlots,
        availableNormalSlots,
        totalPrioritySlots: allocation.prioritySlots.length,
        totalNormalSlots: allocation.normalSlots.length
    };
}

function allocateSlot(hospitalId, dateString, isSeverity, patientToken) {
    const data = readData();
    const allocationKey = `${hospitalId}-${dateString}`;
    const allocation = data.slotAllocations[allocationKey];
    
    let slotNumber = null;
    let slotType = null;
    
    if (isSeverity) {
        for (let i = 0; i < allocation.prioritySlots.length; i++) {
            if (allocation.prioritySlots[i] === null) {
                allocation.prioritySlots[i] = patientToken;
                slotNumber = i + 1;
                slotType = 'priority';
                break;
            }
        }
        
        if (slotNumber === null) {
            for (let i = 0; i < allocation.normalSlots.length; i++) {
                if (allocation.normalSlots[i] === null) {
                    allocation.normalSlots[i] = patientToken;
                    slotNumber = allocation.prioritySlots.length + i + 1;
                    slotType = 'normal';
                    break;
                }
            }
        }
    } else {
        for (let i = 0; i < allocation.normalSlots.length; i++) {
            if (allocation.normalSlots[i] === null) {
                allocation.normalSlots[i] = patientToken;
                slotNumber = allocation.prioritySlots.length + i + 1;
                slotType = 'normal';
                break;
            }
        }
        
        if (slotNumber === null) {
            for (let i = 0; i < allocation.prioritySlots.length; i++) {
                if (allocation.prioritySlots[i] === null) {
                    allocation.prioritySlots[i] = patientToken;
                    slotNumber = i + 1;
                    slotType = 'priority';
                    break;
                }
            }
        }
    }
    
    data.slotAllocations[allocationKey] = allocation;
    writeData(data);
    
    return { slotNumber, slotType };
}

function getTokenCounterForDate(dateString, hospitalId) {
    const data = readData();
   
    if (!data.dailyTokens) {
        data.dailyTokens = {};
    }
   
    const key = `${dateString}-${hospitalId}`;
   
    if (!data.dailyTokens[key]) {
        data.dailyTokens[key] = 1;
        writeData(data);
    }
   
    return data.dailyTokens[key];
}

function incrementTokenCounterForDate(dateString, hospitalId) {
    const data = readData();
   
    if (!data.dailyTokens) {
        data.dailyTokens = {};
    }
   
    const key = `${dateString}-${hospitalId}`;
   
    if (!data.dailyTokens[key]) {
        data.dailyTokens[key] = 1;
    } else {
        data.dailyTokens[key]++;
    }
   
    writeData(data);
    return data.dailyTokens[key];
}

// Quantum Security Helper Functions
function generateQuantumKeyId() {
    return 'QK-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generatePrescriptionId() {
    return 'RX-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function logQuantumSecurityEvent(event) {
    const prescriptionsData = readPrescriptions();
    event.timestamp = new Date().toISOString();
    event.id = crypto.randomBytes(4).toString('hex');
    
    prescriptionsData.securityLogs.push(event);
    writePrescriptions(prescriptionsData);
    
    console.log(`🔐 Quantum Security Event: ${event.type} - ${event.message}`);
}

// Session management
const sessions = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data files
initializeDataFiles();

// Middleware
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
   
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length === 2) {
                req.cookies[parts[0]] = decodeURIComponent(parts[1]);
            }
        });
    }
   
    next();
});

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function requireAuth(req, res, next) {
    const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;
   
    if (sessionToken && sessions.has(sessionToken)) {
        req.adminSession = sessions.get(sessionToken);
        next();
    } else {
        res.setHeader('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        res.status(401).json({
            error: "Authentication required",
            redirect: "/login"
        });
    }
}

function requireAuthPage(req, res, next) {
    const sessionToken = req.cookies?.sessionToken;
   
    if (sessionToken && sessions.has(sessionToken)) {
        req.adminSession = sessions.get(sessionToken);
        next();
    } else {
        res.setHeader('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        res.redirect('/login');
    }
}

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "queue-management-system.html"));
});

app.get("/login", (req, res) => {
    const sessionToken = req.cookies?.sessionToken;
    if (sessionToken && sessions.has(sessionToken)) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/admin", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "admin-panel.html"));
});

// Quantum Security API Routes
app.get("/api/quantum-security-status", (req, res) => {
    try {
        const status = {
            quantumSecurity: true,
            version: 'QSC-v1.0',
            status: 'ACTIVE',
            algorithms: ['BB84-QKD', 'RSA-QUANTUM-HYBRID', 'AES-256-GCM'],
            module: 'QuantumEnhancedSecurity',
            timestamp: new Date().toISOString(),
            statistics: {
                activeSessions: quantumSessions.size,
                totalPrescriptions: prescriptionsStore.size,
                quantumKeys: quantumKeyStore.size
            }
        };
        
        res.json({ success: true, ...status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/api/quantum-keys/generate", async (req, res) => {
    try {
        const { userId, userType } = req.body;
        
        if (!userId || !userType) {
            return res.status(400).json({ 
                success: false, 
                error: "User ID and type are required" 
            });
        }

        const keyPair = await pqcIntegration.generateKeyPair();
        const keyId = generateQuantumKeyId();
        
        const quantumKey = {
            keyId: keyId,
            userId: userId,
            userType: userType,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey, // In production, this should be stored securely
            algorithm: keyPair.algorithm,
            createdAt: new Date().toISOString(),
            quantumEntropy: keyPair.quantumEntropy
        };
        
        quantumKeyStore.set(keyId, quantumKey);
        
        // Log the event
        logQuantumSecurityEvent({
            type: 'KEY_GENERATION',
            message: `Quantum keys generated for ${userType} ${userId}`,
            keyId: keyId,
            algorithm: keyPair.algorithm
        });
        
        res.json({
            success: true,
            keyId: keyId,
            publicKey: keyPair.publicKey,
            algorithm: keyPair.algorithm,
            timestamp: quantumKey.createdAt
        });
        
    } catch (error) {
        console.error('Quantum key generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Quantum key generation failed',
            details: error.message 
        });
    }
});

app.post("/api/secure-prescription", async (req, res) => {
    try {
        const { patientId, doctorId, medication, dosage, instructions, notes } = req.body;
        
        if (!patientId || !doctorId || !medication) {
            return res.status(400).json({
                success: false,
                error: "Patient ID, doctor ID, and medication are required"
            });
        }

        // Find quantum keys
        const patientKey = Array.from(quantumKeyStore.values())
            .find(key => key.userId === patientId && key.userType === 'patient');
        const doctorKey = Array.from(quantumKeyStore.values())
            .find(key => key.userId === doctorId && key.userType === 'doctor');

        if (!patientKey || !doctorKey) {
            return res.status(400).json({
                success: false,
                error: "Quantum keys not found for patient or doctor"
            });
        }

        const prescriptionData = {
            patientId,
            doctorId,
            medication,
            dosage: dosage || "As prescribed",
            instructions: instructions || "",
            notes: notes || "",
            date: new Date().toISOString(),
            status: 'active'
        };

        const securePrescription = await prescriptionSecurity.createSecurePrescription(
            prescriptionData,
            patientKey.publicKey,
            doctorKey.privateKey
        );

        // Store the prescription
        prescriptionsStore.set(securePrescription.id, securePrescription);
        
        // Also save to file for persistence
        const prescriptionsData = readPrescriptions();
        prescriptionsData.prescriptions.push(securePrescription);
        writePrescriptions(prescriptionsData);

        // Log the event
        logQuantumSecurityEvent({
            type: 'PRESCRIPTION_CREATED',
            message: `Quantum-secured prescription created for patient ${patientId}`,
            prescriptionId: securePrescription.id,
            securityLevel: securePrescription.security.status
        });

        res.json({
            success: true,
            prescriptionId: securePrescription.id,
            security: securePrescription.security,
            timestamp: securePrescription.timestamp,
            message: 'Prescription created with quantum security'
        });

    } catch (error) {
        console.error('Prescription creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Prescription creation failed',
            details: error.message
        });
    }
});

app.get("/api/prescriptions/:patientId", (req, res) => {
    try {
        const { patientId } = req.params;
        
        const prescriptions = Array.from(prescriptionsStore.values())
            .filter(p => p.patientId === patientId)
            .map(p => ({
                id: p.id,
                medication: p.medication,
                dosage: p.dosage,
                date: p.timestamp,
                doctorId: p.doctorId,
                status: p.status,
                security: p.security
            }));
        
        res.json({
            success: true,
            prescriptions: prescriptions,
            count: prescriptions.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve prescriptions'
        });
    }
});

app.get("/api/quantum-security-logs", requireAuth, (req, res) => {
    try {
        const prescriptionsData = readPrescriptions();
        const logs = prescriptionsData.securityLogs.slice(-50); // Last 50 logs
        
        res.json({
            success: true,
            logs: logs,
            total: prescriptionsData.securityLogs.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve security logs'
        });
    }
});

// Original MediQueue API Routes (unchanged)
app.get("/api/localities", (req, res) => {
    try {
        const hospitals = readHospitals();
        const localities = [...new Set(hospitals.map(h => h.locality))];
        res.json({ success: true, localities });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch localities" });
    }
});

app.get("/api/hospitals/:locality", (req, res) => {
    try {
        const { locality } = req.params;
        const hospitals = readHospitals();
        const filteredHospitals = hospitals.filter(h => h.locality === locality);
        res.json({ success: true, hospitals: filteredHospitals });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch hospitals" });
    }
});

app.get("/api/hospital/:id", (req, res) => {
    try {
        const { id } = req.params;
        const hospitals = readHospitals();
        const hospital = hospitals.find(h => h.id == id);
       
        if (hospital) {
            const today = new Date().toISOString().split('T')[0];
            const slotInfo = getAvailableSlots(hospital.id, today);
            
            res.json({ 
                success: true, 
                hospital: {
                    ...hospital,
                    availableSeveritySlots: slotInfo.availablePrioritySlots,
                    availableNormalSlots: slotInfo.availableNormalSlots
                }
            });
        } else {
            res.status(404).json({ success: false, error: "Hospital not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch hospital" });
    }
});

app.get("/api/doctors/:hospitalId", (req, res) => {
    try {
        const { hospitalId } = req.params;
        const doctors = getAvailableDoctors(hospitalId);
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch doctors" });
    }
});

app.post("/api/add-appointment", (req, res) => {
    try {
        const { patientName, mobileNumber, hospitalId, symptoms, appointmentDate } = req.body;
       
        // Validate required fields
        if (!patientName || patientName.trim() === '') {
            return res.status(400).json({ success: false, error: "Patient name is required" });
        }
        if (!mobileNumber || mobileNumber.trim() === '') {
            return res.status(400).json({ success: false, error: "Mobile number is required" });
        }
        if (!hospitalId) {
            return res.status(400).json({ success: false, error: "Hospital selection is required" });
        }
        if (!symptoms || symptoms.trim() === '') {
            return res.status(400).json({ success: false, error: "Symptoms description is required" });
        }
        if (!appointmentDate) {
            return res.status(400).json({ success: false, error: "Appointment date is required" });
        }
       
        const data = readData();
        const hospitals = readHospitals();
        const hospital = hospitals.find(h => h.id == hospitalId);
       
        if (!hospital) {
            return res.status(404).json({ success: false, error: "Hospital not found" });
        }
       
        const dateObj = new Date(appointmentDate);
        const dateString = dateObj.toISOString().split('T')[0];
        const isSeverity = detectSeverity(symptoms) === 'severity';
       
        // Check total slot availability
        const slotInfo = getAvailableSlots(hospitalId, dateString);
        const totalAvailableSlots = slotInfo.availablePrioritySlots + slotInfo.availableNormalSlots;
        
        if (totalAvailableSlots === 0) {
            return res.status(400).json({
                success: false,
                error: `No available slots for ${hospital.name} on ${dateString}`
            });
        }
       
        // Generate token number
        let tokenNumber = getTokenCounterForDate(dateString, hospitalId);
        const prefix = isSeverity ? 'S' : 'N';
        const token = `${prefix}-${hospitalId}-${String(tokenNumber).padStart(3, '0')}`;
       
        // Allocate slot
        const slotAllocation = allocateSlot(hospitalId, dateString, isSeverity, token);
        
        if (!slotAllocation.slotNumber) {
            return res.status(400).json({
                success: false,
                error: `No suitable slot available for ${isSeverity ? 'priority' : 'normal'} case`
            });
        }
       
        // Assign a doctor
        const assignedDoctor = assignDoctorToPatient(hospitalId);
       
        const patient = {
            token,
            patientName: patientName.trim(),
            mobileNumber: mobileNumber.trim(),
            hospitalId: parseInt(hospitalId),
            hospitalName: hospital.name,
            doctorId: assignedDoctor ? assignedDoctor.id : null,
            doctorName: assignedDoctor ? assignedDoctor.name : "Doctor will be assigned",
            appointmentType: isSeverity ? 'severity' : 'normal',
            isSeverity: isSeverity,
            symptoms: symptoms || '',
            appointmentDate,
            appointmentTime: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            }),
            status: "Waiting",
            priority: isSeverity ? 1 : 2,
            slotNumber: slotAllocation.slotNumber,
            slotType: slotAllocation.slotType,
            createdAt: new Date().toISOString()
        };
       
        data.queue.push(patient);
        writeData(data);
       
        incrementTokenCounterForDate(dateString, hospitalId);
       
        res.json({
            success: true,
            patient,
            message: "Appointment booked successfully",
            detectedSeverity: isSeverity,
            slotNumber: slotAllocation.slotNumber,
            slotType: slotAllocation.slotType
        });
    } catch (error) {
        console.error("Error adding appointment:", error);
        res.status(500).json({ success: false, error: "Failed to add appointment" });
    }
});

app.get("/api/queue/:hospitalId?", (req, res) => {
    try {
        const { hospitalId } = req.params;
        const data = readData();
        const doctors = readDoctors();
       
        let queue = data.queue.map(patient => {
            if (patient.doctorId) {
                const doctor = doctors.find(d => d.id === patient.doctorId);
                if (doctor) {
                    patient.doctorName = doctor.name;
                }
            }
            
            if (!patient.appointmentTime && patient.createdAt) {
                patient.appointmentTime = new Date(patient.createdAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
            }
            
            return patient;
        });
        
        if (hospitalId) {
            queue = queue.filter(p => p.hospitalId == hospitalId);
        }
       
        queue.sort((a, b) => {
            if (a.slotNumber !== b.slotNumber) {
                return a.slotNumber - b.slotNumber;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
       
        res.json({
            success: true,
            queue,
            totalCount: queue.length,
            waitingCount: queue.filter(p => p.status === 'Waiting').length,
            completedCount: queue.filter(p => p.status === 'Completed').length
        });
    } catch (error) {
        console.error("Error getting queue:", error);
        res.status(500).json({ success: false, error: "Failed to get queue" });
    }
});

app.post("/api/admin-login", (req, res) => {
    try {
        const { username, password } = req.body;
       
        const users = readUsers();
        const user = users.find(u => u.username === username);
       
        if (user && bcrypt.compareSync(password, user.password)) {
            const sessionToken = generateSessionToken();
            const sessionData = {
                userId: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                loginTime: new Date().toISOString()
            };
           
            sessions.set(sessionToken, sessionData);
            res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
           
            res.json({
                success: true,
                message: "Login successful",
                sessionToken,
                username: user.username,
                name: user.name,
                redirect: "/admin"
            });
        } else {
            res.status(401).json({
                success: false,
                error: "Invalid username or password"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error during login"
        });
    }
});

app.post("/api/admin-logout", (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
       
        if (sessionToken) {
            if (sessions.has(sessionToken)) {
                sessions.delete(sessionToken);
            }
           
            res.setHeader('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
        }
       
        res.json({
            success: true,
            message: "Logout successful",
            redirect: "/login"
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            error: "Server error during logout"
        });
    }
});

app.get("/api/auth-status", (req, res) => {
    const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
   
    if (sessionToken && sessions.has(sessionToken)) {
        const sessionData = sessions.get(sessionToken);
        res.json({
            isAuthenticated: true,
            username: sessionData.username,
            name: sessionData.name
        });
    } else {
        if (req.cookies?.sessionToken) {
            res.setHeader('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        }
        res.json({
            isAuthenticated: false,
            username: null,
            name: null
        });
    }
});

app.post("/api/complete", requireAuth, (req, res) => {
    try {
        const { token } = req.body;
       
        if (!token) {
            return res.status(400).json({ success: false, error: "Token is required" });
        }
       
        const data = readData();
        const patientIndex = data.queue.findIndex(p => p.token === token);
       
        if (patientIndex !== -1) {
            data.queue[patientIndex].status = "Completed";
            data.queue[patientIndex].completedAt = new Date().toISOString();
            writeData(data);
           
            res.json({
                success: true,
                message: "Patient marked as completed",
                patient: data.queue[patientIndex]
            });
        } else {
            res.status(404).json({ success: false, error: "Patient not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to complete appointment" });
    }
});

app.post("/api/remove", requireAuth, (req, res) => {
    try {
        const { token } = req.body;
       
        if (!token) {
            return res.status(400).json({ success: false, error: "Token is required" });
        }
       
        const data = readData();
        const patientIndex = data.queue.findIndex(p => p.token === token);
       
        if (patientIndex !== -1) {
            const removedPatient = data.queue.splice(patientIndex, 1)[0];
            writeData(data);
           
            res.json({
                success: true,
                message: "Patient removed from queue",
                removedPatient
            });
        } else {
            res.status(404).json({ success: false, error: "Patient not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to remove appointment" });
    }
});

// Demo data initialization for quantum security
app.post("/api/init-demo-quantum-keys", (req, res) => {
    try {
        // Create demo quantum keys for testing
        const demoUsers = [
            { userId: 'demo-patient-001', userType: 'patient', name: 'Demo Patient' },
            { userId: 'demo-doctor-001', userType: 'doctor', name: 'Demo Doctor' }
        ];
        
        const results = [];
        
        demoUsers.forEach(user => {
            const keyId = generateQuantumKeyId();
            const quantumKey = {
                keyId: keyId,
                userId: user.userId,
                userType: user.userType,
                publicKey: `DEMO-PUBLIC-KEY-${user.userId}`,
                privateKey: `DEMO-PRIVATE-KEY-${user.userId}`,
                algorithm: 'RSA-QUANTUM-HYBRID',
                createdAt: new Date().toISOString(),
                quantumEntropy: crypto.randomBytes(32).toString('hex')
            };
            
            quantumKeyStore.set(keyId, quantumKey);
            results.push({ user: user.name, keyId: keyId, status: 'created' });
        });
        
        res.json({
            success: true,
            message: 'Demo quantum keys initialized',
            results: results
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});

app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
});

// Session cleanup
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;
   
    for (const [token, session] of sessions) {
        if (new Date(session.loginTime) < oneHourAgo) {
            sessions.delete(token);
            cleaned++;
        }
    }
   
    if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} old sessions`);
    }
}, 60 * 60 * 1000);

// Quantum security monitoring
quantumMonitor.startMonitoring();

// Initialize demo data on startup
setTimeout(() => {
    console.log('🔐 Initializing demo quantum security data...');
    // Auto-create demo keys for testing
    fetch(`http://localhost:${port}/api/init-demo-quantum-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              console.log('✅ Demo quantum keys initialized');
          }
      })
      .catch(err => console.log('Demo initialization skipped:', err.message));
}, 2000);

app.listen(port, () => {
    console.log(`✅ MediQueue Server with Quantum Security running at http://localhost:${port}`);
    console.log(`🔐 Quantum Security Status: ACTIVE`);
    console.log(`📋 Queue Management: http://localhost:${port}`);
    console.log(`🔐 Admin Panel: http://localhost:${port}/admin`);
    console.log(`💊 Quantum Prescriptions: http://localhost:${port}/api/quantum-security-status`);
    console.log(`⚛️ Security Algorithms: BB84-QKD + RSA-QUANTUM-HYBRID + AES-256-GCM`);
});