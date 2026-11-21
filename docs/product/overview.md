# Product overview

## Problem

A music teacher travels and gives no lessons in their city for some time. Parents of the students are ready to practise with their children at home. The teacher wants to stay in contact without calls or online lessons.

## Goal

A mobile web app where:

- the teacher assigns pieces of music with sheet music, an audio example and instructions;
- parents send video or audio recordings of the child playing (only hands and instrument);
- the teacher reviews recordings when they have time and leaves feedback.

Several teachers can use the app. Each teacher creates accounts for their own parents.

There are no weeks, deadlines or overdue states. Each piece has a status. The teacher decides when a piece is completed; the parent decides the practice speed.

## Scale and constraints

- The app works for any music instrument.
- First user: 1 piano teacher with 20–30 families. Other teachers can sign up.
- 1 developer, no budget: free tiers where possible.
- Mobile-first: both roles use the app mainly on a phone. See [mobile-design.md](mobile-design.md).
- App languages: English and Dutch. See [features.md](features.md#languages).

## Out of scope

- Weeks, deadlines, overdue warnings, calendars, schedules.
- "Lessons" or "Courses" sections.
- Daily practice logs, gamification, points, streaks.
- Chat and video calls. Comments belong to one Assignment only, so the teacher does not have to answer messages all the time.
- AI analysis of playing.
- Payments.
- An own email service for sending attachments.
- History of attempts: only the latest recordings and the latest feedback are stored.
