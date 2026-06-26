# Product Requirements Document (PRD)
**Project Title:** Online Communication Book (Buku Penghubung Online)
**Target Launch:** Next Month
**Tech Stack:** Next.js, Supabase (Free Tier Deployment)
**School:** PAUD Islam Terpadu Darul Khairat

---

## 1. Overview
The Online Communication Book is a custom web application designed for PAUD Islam Terpadu Darul Khairat to seamlessly connect teachers and parents. Replacing the traditional paper-based communication book, this digital platform provides a fast, documented, and sustainable solution to track daily student activities, milestones, and home habits. It positions the school as a digitally innovative educational institution that prioritizes transparent and continuous communication.

## 2. Problem Statement
The current paper-based communication book is inefficient, prone to physical damage or loss, and difficult to compile for long-term tracking. It limits the ability to have interactive and reliable two-way communication between the school educators and parents regarding a child's daily progress and well-being.

## 3. Objectives
1. **Enhance Communication:** Improve the speed, transparency, and reliability of daily communication between teachers and parents.
2. **Digital Documentation:** Provide a securely stored, easily accessible digital history of a child's daily activities, meals, and development.
3. **Operational Efficiency:** Reduce reliance on physical paper and streamline the reporting workflow for educators.
4. **Parental Engagement:** Encourage active parental participation by allowing them to report home-based activities and habits.

## 4. Constraints
1. **Aggressive Timeline:** The initial Minimum Viable Product (MVP) must be developed and ready for deployment within one month.
2. **Resource & Budget Constraints:** The application must utilize free-tier infrastructure (Next.js deployed on Vercel, Supabase for backend/DB/Auth) to ensure zero initial operational costs.

## 5. Persona

| Persona | Description |
| :--- | :--- |
| **Key Persona: Teacher (Educator)** | Needs a flexible, hassle-free way to log student activities (either sequentially or in bulk) and review home activity updates submitted by parents. |
| **Secondary Persona: Parent/Guardian** | Wants to monitor their specific child's daily school activities and needs a platform to log home-based routines and provide notes to the teacher. |

## 6. Use Cases

### Scenario 1: Flexible Activity Logging by Teacher
A teacher conducts a morning gymnastics session. They can immediately open the web app, check off the gymnastics activity for the students, add an optional note, and save it before moving to the next activity. Alternatively, the teacher can wait until the end of the school day to check off all completed daily activities (meals, naps, prayers, learning) at once and add specific behavioral notes in the provided columns.

### Scenario 2: Home Activity Tracking by Parent
A parent monitors their child completing home assignments or daily evening habits. The parent opens the web platform, checks off the corresponding home activities, writes a note detailing the child's behavior or progress, and submits it.

### Scenario 3: Cross-Monitoring and Archiving
A parent logs into the platform to view the daily report card, seeing exactly what their child did at school that day. They then click the "Download Summary" button to export a PDF report for personal archiving. Conversely, the teacher reviews the home activity logs submitted by the parents to gain holistic insights into the child's behavior outside of school hours.

---

## 7. Features In (Scope for V1 MVP)
These are the prioritized features required for the launch next month:
* **Authentication & Role-Based Access Control (RBAC):** Secure login utilizing Supabase Auth, separating views and permissions for 'Teachers' and 'Parents'. Row Level Security (RLS) ensures parents only see their own child's data.
* **Teacher Activity Dashboard:** A flexible UI allowing teachers to check off daily activities (e.g., attendance, learning, meals, naps, prayers) per student, either in real-time or bulk at the end of the day.
* **Parent Activity Dashboard:** A UI for parents to log home-based routines and view the teacher's daily updates.
* **Notes/Remarks Fields:** Text input columns linked to every activity checklist for additional context.
* **PDF Export/Download:** A feature allowing users (teachers or parents) to generate and download a PDF summary of the daily or weekly communication logs.

## 8. Features Out (Out of Scope for V1)
These features are intentionally excluded from the first release to meet the 1-month deadline:
* In-app real-time chat/messaging (users will use existing WhatsApp channels for urgent matters).
* Push notifications (SMS or Mobile App notifications).
* Custom analytics dashboards or complex data visualization graphs.
* Native iOS/Android mobile applications (sticking to a responsive web app first).

## 9. Technical Considerations
* **Frontend:** Next.js (React framework) for a fast, responsive user interface. Deployed on Vercel for free hosting and CI/CD.
* **Backend & Database:** Supabase (PostgreSQL) for relational data management.
* **Security:** Supabase Row Level Security (RLS) is critical to ensure data privacy (parents must absolutely not be able to access other children's records).
* **PDF Generation:** Utilize a lightweight Next.js compatible library (e.g., `jspdf`, `html2canvas`, or `@react-pdf/renderer`) to handle client-side or server-side PDF exports.

## 10. Success Metrics
* **Teacher Adoption:** 100% of teachers successfully logging daily activities via the app within the first week of launch.
* **Parent Engagement:** A high daily active user rate among parents (e.g., 80%+) successfully logging home activities and viewing school reports.
* **System Stability:** Zero downtime and zero critical database errors during peak usage hours (typically student drop-off and pick-up times).

## 11. GTM (Go-to-Market) Approach
* **Account Pre-creation:** To minimize friction, the school admin will pre-create accounts for all teachers and parents directly in the Supabase database.
* **Internal Training:** Conduct a brief, hands-on training session for teachers to familiarize them with the flexible logging workflow and UI.
* **Parent Onboarding:** Distribute the platform link along with login credentials via existing class WhatsApp groups. Include a short tutorial video or infographic explaining how to view reports, log home activities, and download the PDF summaries.

## 12. Open Issues
* Determine the specific format and styling required for the PDF export (e.g., does it need the school logo, formal header, etc.?).
* Finalize the exhaustive list of predefined daily activities that will appear on the checklist.

## 13. Feature Timeline and Phasing
| Phase | Status | Target Date |
| :--- | :--- | :--- |
| Database Schema & Auth Setup | Not Started | Week 1 |
| Core UI/UX Development (Dashboards) | Not Started | Week 2 |
| PDF Export & Integration Testing | Not Started | Week 3 |
| User Acceptance Testing (UAT) & Bug Fixes | Not Started | Week 4 |
| Launch / Go-Live | Backlog | Next Month |