// Test script for Form Controller
console.log('Form Controller Test Suite');

// This file contains sample data and API endpoint examples
// Run: node test/formControllerTest.js

const testEndpoints = {
  // Form Management (Admin)
  createForm: 'POST /api/forms/create',
  getAllForms: 'GET /api/forms',
  getFormById: 'GET /api/forms/:id',
  updateForm: 'PUT /api/forms/:id',
  deleteForm: 'DELETE /api/forms/:id',
  duplicateForm: 'POST /api/forms/:id/duplicate',
  
  // Application Management
  submitApplication: 'POST /api/forms/:formId/submit',
  getAllApplications: 'GET /api/forms/applications',
  getApplicationById: 'GET /api/forms/applications/:id',
  updateStatus: 'PUT /api/forms/applications/:id/status',
  assignApplication: 'PUT /api/forms/applications/:id/assign',
  addNote: 'POST /api/forms/applications/:id/notes',
  sendEmail: 'POST /api/forms/applications/:id/send-email',
  getStats: 'GET /api/forms/applications/stats',
  bulkActions: 'POST /api/forms/applications/bulk',
  
  // Public Endpoints
  publicForm: 'GET /api/forms/public/forms/:slug',
  publicStatus: 'GET /api/forms/public/applications/status/:email/:formId'
};

// Sample form data
const sampleForm = {
  name: 'IELTS Preparation Application',
  description: 'Application for IELTS course enrollment',
  category: 'test-preparation',
  fields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      order: 1
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      order: 2
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      order: 3
    },
    {
      name: 'targetScore',
      label: 'Target IELTS Score',
      type: 'select',
      options: [
        { value: '6.0', label: '6.0' },
        { value: '6.5', label: '6.5' },
        { value: '7.0', label: '7.0' },
        { value: '7.5', label: '7.5' },
        { value: '8.0', label: '8.0+' }
      ],
      required: true,
      order: 4
    }
  ],
  emailNotifications: {
    enabled: true,
    adminEmails: ['admin@langzy.co'],
    autoReplyTemplate: {
      subject: 'Application Received',
      message: 'Thank you for your application. We will review it soon.'
    }
  }
};

// Sample application data
const sampleApplication = {
  studentInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+977-9841234567',
    dateOfBirth: '1995-05-15',
    address: {
      street: 'Thamel',
      city: 'Kathmandu',
      country: 'Nepal'
    }
  },
  academicInfo: {
    education: [{
      level: 'bachelor',
      institution: 'TU',
      fieldOfStudy: 'Computer Science',
      graduationYear: 2020
    }],
    englishProficiency: {
      level: 'intermediate'
    }
  },
  coursePreferences: {
    interestedCourses: ['IELTS'],
    preferredSchedule: 'evening',
    learningGoals: 'Score 7.0 in IELTS'
  },
  formData: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+977-9841234567',
    targetScore: '7.0'
  }
};

console.log('✅ Available endpoints:', Object.keys(testEndpoints).length);
console.log('📋 Sample form created');
console.log('📝 Sample application data ready');
console.log('\n🚀 Form Controller is ready for testing!');

module.exports = {
  testEndpoints,
  sampleForm,
  sampleApplication
}; 