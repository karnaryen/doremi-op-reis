# Product overview

## Problem

A piano teacher travels for one year and gives no lessons in her city. Parents of her students are ready to practise with their children at home. The teacher wants to stay in contact without calls or online lessons.

## Goal

A mobile web app where:

- the teacher assigns pieces of music with sheet music, an audio example and instructions;
- parents send video or audio recordings of the child playing (hands and keys only);
- the teacher reviews recordings when she has time and leaves feedback.

There are no weeks, deadlines or overdue states. Each piece has a status. The teacher decides when a piece is completed; the parent decides the practice speed.

## Scale and constraints

- 1 teacher, 20–30 families.
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

## Similar products

Practice Space, Note & Key, GimmeFeedback, Better Practice. They target full music studios and are too large for one teacher. Ideas taken from them are listed in [features.md](features.md#later).
