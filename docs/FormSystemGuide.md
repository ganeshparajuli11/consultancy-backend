# Form Management System Documentation

## Overview
This comprehensive form management system allows administrators to create dynamic application forms and manage student applications with full email automation, status tracking, and advanced filtering capabilities.

## Key Features

### 🏗️ Form Builder
- **Dynamic Form Creation**: Create custom forms with 15+ field types
- **Field Validation**: Built-in validation with custom rules
- **Form Categories**: Organize forms by category (language-course, test-preparation, etc.)
- **Language-Specific Forms**: Link forms to specific languages or keep them general
- **Email Templates**: Customizable auto-reply and notification emails
- **Form Settings**: Submission limits, deadlines, approval workflows

### 📝 Application Management
- **Complete Student Profiles**: Personal, academic, course preferences
- **Status Tracking**: 6 status levels with history tracking
- **Priority Management**: 4 priority levels (low, medium, high, urgent)
- **Email Automation**: Status update notifications with custom templates
- **Note System**: Internal and public notes with timestamps
- **Document Management**: File uploads and categorization

### 📊 Analytics & Operations
- **Real-time Statistics**: Status breakdowns, priority analytics
- **Bulk Operations**: Mass status updates, assignments, archiving
- **Advanced Filtering**: Search, date ranges, status filters
- **Assignment System**: Assign applications to staff members
- **Archive System**: Soft delete with restoration capabilities

## API Endpoints

### Form Management (Admin Only)

```http
POST   /api/forms/create              # Create new form
GET    /api/forms                     # Get all forms (with filters)
GET    /api/forms/:identifier         # Get form by ID or slug
PUT    /api/forms/:id                 # Update form
DELETE /api/forms/:id                 # Delete/deactivate form
POST   /api/forms/:id/duplicate       # Duplicate existing form
```

### Language-Specific Form Management

```http
GET    /api/forms/languages           # Get all available languages
GET    /api/forms/by-language/:langId # Get forms for specific language
GET    /api/forms/general             # Get general forms (not language-specific)
```

### Application Management (Admin/Staff)

```http
GET    /api/forms/applications                    # Get all applications
GET    /api/forms/applications/stats              # Get statistics
POST   /api/forms/applications/bulk               # Bulk operations
GET    /api/forms/applications/:id                # Get single application
PUT    /api/forms/applications/:id/status         # Update status (with email)
PUT    /api/forms/applications/:id/assign         # Assign to staff
POST   /api/forms/applications/:id/notes          # Add note
POST   /api/forms/applications/:id/send-email     # Send custom email
PUT    /api/forms/applications/:id/archive        # Archive/unarchive
```

### Public Endpoints

```http
POST   /api/forms/:formId/submit                           # Submit application
GET    /api/forms/public/forms/:slug                       # Get public form
GET    /api/forms/public/applications/status/:email/:formId # Check status
```

## Data Models

### Application Form Schema
```javascript
{
  name: String,                    // Form name
  description: String,             // Form description
  slug: String,                    // URL-friendly identifier
  fields: [FieldSchema],          // Form fields array
  isActive: Boolean,              // Active status
  category: String,               // Form category
  language: ObjectId,             // Reference to Language model (optional)
  emailNotifications: {
    enabled: Boolean,
    adminEmails: [String],
    autoReplyTemplate: {
      subject: String,
      message: String
    }
  },
  settings: {
    allowMultipleSubmissions: Boolean,
    maxSubmissions: Number,
    submissionDeadline: Date,
    requiresApproval: Boolean
  },
  submissions: Number,            // Submission count
  createdBy: ObjectId,           // Creator reference
  updatedBy: ObjectId            // Last updater reference
}
```

### Student Application Schema
```javascript
{
  applicationForm: ObjectId,      // Form reference
  studentInfo: {
    fullName: String,
    email: String,
    phoneNumber: String,
    dateOfBirth: Date,
    address: AddressSchema,
    emergencyContact: ContactSchema
  },
  academicInfo: {
    education: [EducationSchema],
    englishProficiency: ProficiencySchema
  },
  coursePreferences: {
    interestedCourses: [String],
    preferredSchedule: String,
    learningGoals: String
  },
  documents: [DocumentSchema],
  formData: Map,                  // Custom form field data
  status: String,                 // Application status
  priority: String,               // Priority level
  assignedTo: ObjectId,          // Assigned staff member
  reviewNotes: [NoteSchema],     // Application notes
  statusHistory: [HistorySchema], // Status change history
  communication: {
    emailsSent: [EmailLogSchema],
    lastContactDate: Date
  },
  tags: [String],                // Custom tags
  isArchived: Boolean            // Archive status
}
```

## Field Types

### Basic Fields
- **text**: Single line text input
- **email**: Email validation
- **tel**: Phone number input
- **number**: Numeric input
- **textarea**: Multi-line text
- **date**: Date picker
- **time**: Time picker
- **url**: URL validation
- **password**: Password input
- **color**: Color picker
- **range**: Slider input

### Selection Fields
- **select**: Dropdown selection
- **multiselect**: Multiple selection
- **radio**: Radio buttons
- **checkbox**: Checkboxes

### File Fields
- **file**: File upload with type validation

### Field Configuration
```javascript
{
  name: "fieldName",              // Unique field identifier
  label: "Field Label",           // Display label
  type: "text",                   // Field type
  required: true,                 // Required validation
  placeholder: "Enter text...",   // Placeholder text
  helpText: "Help information",   // Additional help
  options: [                      // For select/radio/checkbox
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" }
  ],
  validation: {                   // Custom validation
    min: 0,
    max: 100,
    minLength: 5,
    maxLength: 200,
    pattern: "regex_pattern"
  },
  order: 1                        // Display order
}
```

## Email System

### Automated Emails
1. **Auto-reply**: Sent immediately upon form submission
2. **Admin Notifications**: Sent to configured admin emails
3. **Status Updates**: Sent when application status changes
4. **Custom Emails**: Manual emails from admin panel

### Email Templates
- **Approval Email**: Congratulatory message with next steps
- **Rejection Email**: Polite rejection with encouragement
- **Waitlist Email**: Waitlist notification with expectations
- **Review Email**: Under review notification

### Email Logging
All sent emails are logged with:
- Email type and subject
- Recipient information
- Timestamp
- Sender reference

## Language-Specific Forms

### Overview
Forms can be created as either **language-specific** or **general**:

- **Language-Specific Forms**: Linked to a particular language course (e.g., "Spanish Enrollment Form")
- **General Forms**: Not tied to any specific language (e.g., "General Inquiry Form")

### Benefits
1. **Organized Management**: Easily filter and manage forms by language
2. **Targeted Applications**: Students apply for specific language courses
3. **Language-Based Analytics**: Track applications per language
4. **Customized Workflows**: Different processes for different languages

### API Usage

#### Creating Language-Specific Forms
```javascript
POST /api/forms/create
{
  "name": "Spanish Course Application",
  "language": "507f1f77bcf86cd799439011", // Language ObjectId
  "category": "language-course",
  "fields": [...]
}
```

#### Filtering Forms by Language
```javascript
// Get all Spanish forms
GET /api/forms/by-language/507f1f77bcf86cd799439011

// Get general forms only
GET /api/forms/general

// Filter all forms by language
GET /api/forms?language=507f1f77bcf86cd799439011
```

### Form Management Helpers

#### Static Methods Available
```javascript
// Get forms for specific language
ApplicationForm.getByLanguage(languageId, options)

// Get general forms only
ApplicationForm.getGeneralForms(options)
```

#### Virtual Properties
```javascript
form.isLanguageSpecific  // Boolean: true if language is set
form.formType           // String: "Language-Specific" or "General"
```

## Status Workflow

### Status Levels
1. **pending**: Initial submission status
2. **under-review**: Application being reviewed
3. **approved**: Application accepted
4. **rejected**: Application declined
5. **waitlisted**: Placed on waiting list
6. **cancelled**: Application cancelled

### Status History
Every status change is logged with:
- Previous and new status
- Change reason
- Changed by (user reference)
- Timestamp

## Priority System

### Priority Levels
- **low**: Standard processing
- **medium**: Normal priority (default)
- **high**: Expedited processing
- **urgent**: Immediate attention required

## Advanced Features

### Bulk Operations
- Update status for multiple applications
- Assign multiple applications to staff
- Archive/unarchive in bulk
- Set priority levels in bulk

### Filtering & Search
- Search by name, email, phone
- Filter by status, priority, form type
- Date range filtering
- Assigned staff filtering
- Advanced pagination

### Analytics Dashboard
- Total application counts
- Status distribution charts
- Priority breakdowns
- Form-wise statistics
- Recent activity trends
- 30-day activity graphs

### Notes System
- **Internal Notes**: Visible only to admin/staff
- **Public Notes**: Visible to applicants
- Note author tracking
- Timestamp tracking
- Note categorization

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Admin, Super-admin, Staff roles
- Protected admin endpoints
- Public submission endpoints

### Data Validation
- Comprehensive input validation
- MongoDB ObjectId validation
- Email format validation
- File type restrictions
- Size limitations

### Rate Limiting
- API rate limiting
- Submission throttling
- Abuse prevention

## Usage Examples

### Creating a Form
```javascript
const formData = {
  name: "IELTS Application Form",
  description: "Application for IELTS preparation course",
  category: "test-preparation",
  fields: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      order: 1
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      order: 2
    }
  ],
  emailNotifications: {
    enabled: true,
    adminEmails: ["admin@langzy.co"],
    autoReplyTemplate: {
      subject: "Application Received",
      message: "Thank you for your application..."
    }
  }
};

// POST /api/forms/create
```

### Submitting Application
```javascript
const applicationData = {
  studentInfo: {
    fullName: "John Doe",
    email: "john@example.com",
    phoneNumber: "+977-9841234567"
  },
  formData: {
    fullName: "John Doe",
    email: "john@example.com"
  }
};

// POST /api/forms/{formId}/submit
```

### Updating Status with Email
```javascript
const statusUpdate = {
  status: "approved",
  reason: "Meets all requirements",
  notes: "Contact for enrollment",
  sendEmail: true
};

// PUT /api/forms/applications/{id}/status
```

## Database Indexes

### Performance Optimization
```javascript
// Application indexes
{ 'studentInfo.email': 1 }
{ status: 1, priority: 1 }
{ applicationForm: 1, status: 1 }
{ assignedTo: 1 }
{ createdAt: -1 }
{ 'studentInfo.fullName': 'text', 'studentInfo.email': 'text' }

// Form indexes
{ slug: 1 }
{ isActive: 1, category: 1 }
{ createdBy: 1 }
```

## Error Handling

### Common Error Responses
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate resource
- **500**: Internal Server Error - Server error

### Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  error: "Error details" // Only in development
}
```

## Testing

### Test Script Location
`consultancy-backend/test/formControllerTest.js`

### Test Coverage
- Form CRUD operations
- Application submission
- Status management
- Email notifications
- Bulk operations
- Public endpoints
- Authentication
- Error handling

## Deployment Considerations

### Environment Variables
```env
MONGO_URI=mongodb://...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@langzy.co
FRONTEND_URL=https://langzy.co
```

### Production Setup
1. Configure SMTP settings
2. Set up file upload storage
3. Configure CORS origins
4. Set up monitoring
5. Configure backup strategy

## Integration with Admin Panel

### Frontend Components
- Form builder interface
- Application management dashboard
- Status update modals
- Email composition interface
- Analytics dashboard
- Bulk operation interface

### Real-time Features
- Live application updates
- Real-time notifications
- Status change alerts
- Email delivery status

This form management system provides a complete solution for managing student applications with professional email automation, comprehensive tracking, and powerful administrative features. 