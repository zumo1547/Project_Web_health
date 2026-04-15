# Appointment Scheduling System Configuration Guide

## Overview
This document describes how to configure and use the appointment scheduling system for doctors and elderly patients.

## Features

### 1. Doctor Appointment Creation
- Doctors can create appointments for elderly patients
- Appointment includes date, time, and optional notes
- Confirmation SMS is automatically sent to patients (if Twilio is configured)

### 2. Elderly Patient Appointment Management
- View upcoming appointments
- Reschedule appointments with reason
- Cancel appointments
- View appointment notifications

### 3. SMS Reminders
- **3 days before**: Automatic SMS reminder
- **On the day**: Same-day confirmation reminder
- Reminders include appointment date and doctor name

### 4. Admin Dashboard
- View all appointments across the system
- Filter by status (SCHEDULED, RESCHEDULED, COMPLETED, CANCELLED)
- Complete or cancel appointments
- View appointment statistics

### 5. Appointment History
- All completed appointments are saved to history
- Visible in patient's medical records
- Accessible to doctors and admins

## Environment Variables

### SMS Configuration (Optional)
If using Twilio for SMS notifications:

```
# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Cron Jobs
CRON_SECRET=your_secret_token_for_cron_jobs
```

## Database Schema

### New Models Added:
- **Appointment**: Main appointment records
- **AppointmentReschedule**: History of rescheduled appointments
- **AppointmentHistory**: Completed appointment records

### Appointment Status:
- `SCHEDULED`: Initial appointment creation
- **RESCHEDULED**: Appointment has been moved to a new date
- **COMPLETED**: Appointment completed and moved to history
- **CANCELLED**: Appointment cancelled

### Reschedule Reasons:
- `DOCTOR_UNAVAILABLE`: Doctor is not available
- `DOCTOR_EMERGENCY`: Emergency situation
- `ELDERLY_REQUEST`: Patient's request
- `ADMIN_REQUEST**: Admin's decision
- `OTHER`: Other reasons with customdetail

## API Endpoints

### POST /api/appointments?action=create
Create a new appointment
```json
{
  "elderlyId": "string",
  "appointmentDate": "2024-05-15T14:30:00.000Z",
  "notes": "optional notes"
}
```

### POST /api/appointments?action=reschedule
Reschedule an appointment
```json
{
  "appointmentId": "string",
  "newDate": "2024-05-20T14:30:00.000Z",
  "reason": "DOCTOR_UNAVAILABLE",
  "reasonDetail": "optional detail"
}
```

### POST /api/appointments?action=cancel
Cancel an appointment
```json
{
  "appointmentId": "string",
  "cancellationReason": "optional reason"
}
```

### POST /api/appointments?action=complete
Complete an appointment (mark as done)
```json
{
  "appointmentId": "string"
}
```

### GET /api/appointments?type=upcoming
Get upcoming appointments for current user (elderly)

### GET /api/appointments?type=doctor
Get appointments for logged-in doctor

### GET /api/appointments?type=all
Get all appointments (admin only)

## Cron Jobs

### Send 3-Day Reminders
```
GET /api/appointments/cron?type=reminder
POST /api/appointments/cron?type=reminder
```
Triggers SMS reminders 3 days before appointments

### Send Same-Day Reminders
```
GET /api/appointments/cron?type=today
POST /api/appointments/cron?type=today
```
Triggers SMS reminders on the day of appointment

### Send All Reminders
```
POST /api/appointments/cron
POST /api/appointments/cron?type=all
```
Runs both reminder types

## SMS Integration

### Current Implementation
The SMS service is set up with placeholder support. To enable actual SMS:

1. **Install Twilio** (or your preferred SMS provider):
```bash
npm install twilio
```

2. **Update `/src/lib/appointment-sms.ts`**:
Replace the placeholder SMS function with actual Twilio call:
```typescript
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: input.message,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: input.phoneNumber,
});
```

3. **Set environment variables** in `.env.local`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Components

### Doctor-Side Components
- `DoctorAppointmentForm`: Create appointments for patients
- `DoctorAppointmentList`: View upcoming appointments

### Elderly-Side Components
- `ElderlyAppointmentPanel`: View, reschedule, cancel appointments

### Admin Components
- `AdminAppointmentManagement`: Dashboard for managing all appointments

## Testing

### Test Creating an Appointment
1. Login as a doctor
2. Visit the elderly patient's profile
3. Click "Create Appointment"
4. Select date/time and add notes
5. Click confirmt
6. Verify appointment appears in doctor's appointment list

### Test SMS Reminders
1. Create an appointment 3 days from now
2. Run `GET /api/appointments/cron?type=reminder`
3. Check console logs for SMS output
4. If Twilio is configured, SMS will be sent

### Test Rescheduling
1. View upcoming appointments
2. Click "Reschedule Appointment"
3. Select new date and reason
4. Confirm reschedule

## Notes

- All appointments are stored in PostgreSQL via Prisma ORM
- SMS reminders use Thai language messages
- Timezone handling is automatic via date-fns
- The system supports soft-delete through status tracking
- Audit logs are created for all appointment changes

## Future Enhancements

- Email notifications as alternative to SMS
- Calendar integration (Google Calendar, Outlook)
- Automated follow-up reminders
- Video consultation support
- Appointment analytics and reporting
- Patient no-show tracking
