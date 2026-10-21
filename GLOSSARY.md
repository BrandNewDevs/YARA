# YARA

A mobile assistant that helps elderly people remember their routines and appointments, and get help, through plain-language conversation.

## Language

**User**:
The elderly person who uses YARA. There is no separate caregiver account.
_Avoid_: Senior, patient, customer

**Assistant**:
YARA's conversational side, which understands what the User says and replies in warm, plain language.
_Avoid_: Bot, AI, chatbot

**Memory**:
What YARA knows about the User, kept as short dated facts that the User can see and edit.
_Avoid_: Profile, knowledge base, context

### Tasks

**Task**:
Something the User needs to do on a schedule. Is either a Routine or an Appointment.
_Avoid_: To-do, item

**Routine**:
A Task that repeats at fixed times and needs only a nudge and a "done", such as taking medicine or measuring blood pressure.
_Avoid_: Habit, scheduled task

**Appointment**:
A Task tied to a person or place, such as a doctor's visit or weekly therapy, which may repeat and gets lead-up Reminders.
_Avoid_: Long-term task, event

**Reminder**:
A single alert, with text and a voice, that a Task produces at a given time.
_Avoid_: Alarm, notification

**Check-in**:
A short conversation the Assistant starts when a Reminder is due, asking the User about it. The User's answer can mark the Task done or postpone it.
_Avoid_: Follow-up, prompt

### Help

**Trusted Contact**:
A person the User chooses at the start, with a name and phone number, whom YARA shows for the User to call.
_Avoid_: Emergency contact, caregiver, family member

**Emergency Number**:
The public emergency phone number for the User's country, which YARA shows when the User needs urgent help.
_Avoid_: Hotline, helpline
