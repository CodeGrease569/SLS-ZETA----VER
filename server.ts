import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory persistent data stores (seeded with realistic student records)
let studentsStore = [
  {
    id: 1,
    studentId: '2023-00456',
    firstName: 'Maria',
    middleName: 'Clara',
    lastName: 'Santos',
    email: 'maria.santos@swu.edu.ph',
    course: 'BS Computer Science',
    yearLevel: '3rd Year',
    role: 'student',
    passwordHash: 'secret123'
  },
  {
    id: 2,
    studentId: '2024-08912',
    firstName: 'Juan',
    middleName: 'D.',
    lastName: 'Reyes',
    email: 'juan.reyes@swu.edu.ph',
    course: 'BS Information Technology',
    yearLevel: '2nd Year',
    role: 'student',
    passwordHash: 'secret123'
  },
  {
    id: 99,
    studentId: 'ADMIN-01',
    firstName: 'Dean',
    middleName: 'Office',
    lastName: 'Admin',
    email: 'admin@swu.edu.ph',
    course: 'Student Life Office',
    yearLevel: 'Staff / Admin',
    role: 'admin',
    passwordHash: 'admin123'
  }
];

let requestsStore = [
  {
    id: 101,
    studentId: '2023-00456',
    title: 'Good Moral Certificate',
    category: 'documents',
    office: 'Dean of Student Affairs',
    refNo: 'SL-2026-000121',
    status: 'processing',
    date: 'Aug 10, 2026',
    remarks: 'Ready for pick-up in 2 days'
  },
  {
    id: 102,
    studentId: '2023-00456',
    title: 'Scholarship — Grade Slip',
    category: 'scholarship',
    office: 'Academic Registrar',
    refNo: 'SL-2026-000115',
    status: 'review',
    date: 'Aug 8, 2026',
    remarks: 'Under evaluation by Bursar'
  },
  {
    id: 103,
    studentId: '2023-00456',
    title: 'Scholarship — Enrollment Form',
    category: 'scholarship',
    office: 'Bursar & Grants Office',
    refNo: 'SL-2026-000098',
    status: 'completed',
    date: 'Aug 5, 2026',
    remarks: 'Approved and credited'
  },
  {
    id: 104,
    studentId: '2023-00456',
    title: 'Academic Advising Consultation',
    category: 'support',
    office: 'Guidance & Counseling',
    refNo: 'SL-2026-000087',
    status: 'completed',
    date: 'Jul 30, 2026',
    remarks: 'Resolved'
  },
  {
    id: 105,
    studentId: '2023-00456',
    title: 'Certificate of Completion (COC)',
    category: 'documents',
    office: 'University Registrar',
    refNo: 'SL-2026-000065',
    status: 'completed',
    date: 'Jul 20, 2026',
    remarks: 'Digital copy issued'
  },
  {
    id: 106,
    studentId: '2023-00456',
    title: 'Lost ID Replacement',
    category: 'documents',
    office: 'Campus Security & Records',
    refNo: 'SL-2026-000042',
    status: 'rejected',
    date: 'Jul 10, 2026',
    remarks: 'Affidavit of loss signature unclear'
  }
];

let notificationsStore = [
  {
    id: 201,
    studentId: '2023-00456',
    title: 'Scholarship Requirement Approved',
    message: 'Your Grade Slip (2nd Sem) has been approved by the Student Life Office.',
    timeAgo: '2 hours ago',
    category: 'Verified',
    unread: true
  },
  {
    id: 202,
    studentId: '2023-00456',
    title: 'Document Request Update',
    message: 'Your Good Moral Certificate request (SL-2026-000121) is now being processed and ready for release.',
    timeAgo: '1 day ago',
    category: 'Processing',
    unread: true
  },
  {
    id: 203,
    studentId: '2023-00456',
    title: 'Missing Scholarship Requirement',
    message: 'Please submit your Grade Slip (1st Sem, AY 2025-2026) before August 20, 2026 to maintain active status.',
    timeAgo: '2 days ago',
    category: 'Action required',
    unread: true
  },
  {
    id: 204,
    studentId: '2023-00456',
    title: 'Inquiry Response Received',
    message: 'The Student Life Office has responded to your inquiry regarding scholarship renewal requirements.',
    timeAgo: '3 days ago',
    category: 'Helpdesk',
    unread: false
  },
  {
    id: 205,
    studentId: '2023-00456',
    title: 'Student Life Announcement',
    message: 'Scholarship renewal period is now open for 1st Semester. Submit requirements by August 25, 2026.',
    timeAgo: '1 week ago',
    category: 'Official Notice',
    unread: false
  }
];

let scholarshipDocumentsStore = [
  { id: 301, studentId: '2023-00456', name: 'Certificate of Grades (COG)', info: '2nd Sem • 1.35 GWA verified', status: 'Verified' },
  { id: 302, studentId: '2023-00456', name: 'Certificate of Good Moral', info: 'Issued by Office of Student Affairs', status: 'Verified' },
  { id: 303, studentId: '2023-00456', name: 'Enrollment Assessment Form', info: 'Validated 21 Academic Units', status: 'Verified' },
  { id: 304, studentId: '2023-00456', name: 'Income Tax Return / Affidavit', info: 'Submitted July 18 • Bursar queue', status: 'Reviewing' },
  { id: 305, studentId: '2023-00456', name: 'Barangay Indigency Certificate', info: 'Submitted July 19 • Office validation', status: 'Reviewing' },
  { id: 306, studentId: '2023-00456', name: 'Scholarship Agreement', info: 'Missing student signature', status: 'Upload Required' },
];

// REST Endpoints
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  const student = studentsStore.find(
    s => s.studentId === identifier || s.email === identifier
  );

  if (!student || student.passwordHash !== password) {
    return res.status(401).json({ success: false, message: 'Invalid Student ID/Email or Password' });
  }

  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      email: student.email,
      course: student.course,
      yearLevel: student.yearLevel,
      role: student.role
    }
  });
});

app.post('/api/signup', (req, res) => {
  const { firstName, middleName, lastName, studentId, email, password } = req.body;
  if (!firstName || !lastName || !studentId || !email || !password) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  if (studentsStore.some(s => s.studentId === studentId || s.email === email)) {
    return res.status(400).json({ success: false, message: 'Student ID or Email already registered' });
  }

  const newStudent = {
    id: studentsStore.length + 1,
    studentId,
    firstName,
    middleName: middleName || '',
    lastName,
    email,
    course: 'BS Computer Science',
    yearLevel: '1st Year',
    role: 'student',
    passwordHash: password
  };

  studentsStore.push(newStudent);
  res.json({
    success: true,
    message: 'Account created successfully',
    user: {
      id: newStudent.id,
      studentId: newStudent.studentId,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      email: newStudent.email,
      course: newStudent.course,
      yearLevel: newStudent.yearLevel,
      role: newStudent.role
    }
  });
});

app.get('/api/dashboard/:studentId', (req, res) => {
  const { studentId } = req.params;
  const studentReqs = requestsStore.filter(r => r.studentId === studentId);
  const studentNotifs = notificationsStore.filter(n => n.studentId === studentId);

  res.json({
    success: true,
    data: {
      totalRequests: studentReqs.length,
      completedRequests: studentReqs.filter(r => r.status === 'completed').length,
      pendingRequests: studentReqs.filter(r => r.status === 'processing' || r.status === 'review').length,
      requirementsPercentage: 67,
      requests: studentReqs,
      notifications: studentNotifs,
      scholarshipDocs: scholarshipDocumentsStore
    }
  });
});

app.get('/api/requests/:studentId', (req, res) => {
  const { studentId } = req.params;
  const reqs = requestsStore.filter(r => r.studentId === studentId);
  res.json({ success: true, data: reqs });
});

app.post('/api/requests', (req, res) => {
  const { studentId, title, category, office } = req.body;
  const refNo = `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const newReq = {
    id: requestsStore.length + 1,
    studentId: studentId || '2023-00456',
    title: title || 'Document Request',
    category: category || 'documents',
    office: office || 'University Registrar',
    refNo,
    status: 'processing',
    date: 'Today',
    remarks: 'Received and queued for processing'
  };
  requestsStore.unshift(newReq);
  res.json({ success: true, message: 'Request filed successfully', data: newReq });
});

app.get('/api/notifications/:studentId', (req, res) => {
  const { studentId } = req.params;
  const notifs = notificationsStore.filter(n => n.studentId === studentId);
  res.json({ success: true, data: notifs });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { notificationId } = req.body;
  if (notificationId) {
    const notif = notificationsStore.find(n => n.id === notificationId);
    if (notif) notif.unread = false;
  } else {
    notificationsStore.forEach(n => n.unread = false);
  }
  res.json({ success: true, message: 'Notifications marked as read' });
});

// Admin endpoints for staff management
app.get('/api/admin/data', (req, res) => {
  res.json({
    success: true,
    data: {
      students: studentsStore.filter(s => s.role === 'student'),
      requests: requestsStore,
      scholarshipDocs: scholarshipDocumentsStore
    }
  });
});

app.post('/api/admin/update-request', (req, res) => {
  const { requestId, status, remarks } = req.body;
  const r = requestsStore.find(reqItem => reqItem.id === requestId);
  if (r) {
    if (status) r.status = status;
    if (remarks) r.remarks = remarks;
    return res.json({ success: true, message: 'Request updated successfully', data: r });
  }
  res.status(404).json({ success: false, message: 'Request not found' });
});

// AI Chat proxy endpoint using @google/genai
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: "Hello! I am your SWU PHINMA Student Support Assistant. I can help with scholarship appeals, document requests, and campus inquiries. (Note: GEMINI_API_KEY is not configured, so I am operating in offline support mode)."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are the SWU PHINMA Student Life Support Assistant, a warm, professional academic advisor and administrative assistant for Southwestern University PHINMA in Cebu City. You help students with scholarship applications, document requests (Certificate of Completion, Good Moral Certificate, Lost ID), grade evaluations, academic appeals, and campus guidelines. Keep responses encouraging, helpful, concise, and structured.`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    chatHistory.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model,
      contents: chatHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "I'm here to help with your student life needs. How else can I assist?";
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.json({
      success: true,
      reply: "I received your message regarding student support. Our office coordinators will review your inquiry shortly."
    });
  }
});

// Vite middleware integration for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' }
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
