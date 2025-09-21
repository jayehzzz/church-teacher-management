# Church Management Tracker - Quick Reference Guide

Target users: All roles — leadership, admins, ministry leaders, data entry. Use this as a fast, practical lookup for Church Management Tracker terms, tips, FAQs, support, and system requirements.

## Related Modules
- [Application Overview](../overview/application-overview.md) - Getting started with Church Management Tracker
- [Central Members](../modules/central-members.md) - Member directory and data quality management
- [Evangelism and Contacts](../modules/evangelism.md) - Outreach contact tracking and follow-up
- [First Timers](../modules/first-timers.md) - Visitor identification and nurturing processes
- [Sunday Service](../modules/sunday-service.md) - Attendance recording and analysis
- [Dashboard and Analytics](../modules/dashboard-analytics.md) - Cross-module KPIs and trends
- [Import and Export](../modules/import-export.md) - Bulk data movement and templates

Screenshot: Global Navigation — Module list

1. Key terminology and definitions

Core data concepts
- Central Member — a person record in Church Management Tracker's authoritative directory; supports lifecycle, engagement, roles, and data quality scoring. See [Central Members](../modules/central-members.md)
- First Timer — a visitor captured from Sunday Service or manual entry with visit tracking and follow-up status. See [First Timers](../modules/first-timers.md)
- Evangelism Contact — outreach contact with spiritual indicators and inviter attribution. See [Evangelism](../modules/evangelism.md)
- Sunday Service — an attendance record with attendee selections, first-timer detection, and derived KPIs. See [Sunday Service](../modules/sunday-service.md)
- Dashboard — cross-module KPIs, trends, funnels, engagement, and quality within Church Management Tracker. See [Dashboard and Analytics](../modules/dashboard-analytics.md)

Common fields and flags
- member_type — visitor, potential, member; determines lifecycle in Central Members
- member_status — Regular, Irregular, Dormant; reflects engagement among members
- member_number — system-assigned sequential identifier for full members
- data_quality.score — 0 to 100 indicator of record completeness and validity
- needs_review — validation flag signaling missing or suspect data
- duplicate_detected — flag that the record may match another; resolve via merge
- visitCount — number of recorded visits for a first-timer
- saved — boolean on Evangelism contact for profession of faith
- attendedChurch — boolean on Evangelism contact indicating church attendance after contact
- likelyToCome — boolean readiness signal used to prioritize outreach
- invitedBy, invitedById — attribution to a Central Member as the inviter

Import and export language
- Universal Import Wizard — guided data mapping, validation-only preview, batch import with progress
- Universal Export — filtered dataset exports to structured data formats

Screenshot: Central Members — Profile with data quality flags

2. Common shortcuts and tips

Navigation and search
- Use the sidebar to switch modules quickly; keep one tab per module during heavy work
- In lists, combine filters with free-text search for fast narrowing by name or phone
- Date range presets on Dashboard and Sunday Service keep reports consistent

Attendance capture
- Enhanced Attendee Manager supports type-to-search and bulk select or clear
- Add newcomers as first-timers by name; conversion to member comes later

Follow-up efficiency
- In Evangelism and First Timers, start notes with an action verb and end with next step
- Use likelyToCome true and recent date ranges to build weekly outreach lists

Data quality hygiene
- Normalize phone numbers to one national format for reliable matching
- Use canonical_name and name_variations to fix spelling and preserve searchability

Exports
- Export filtered cohorts from any module; include module, cohort, date in filenames

Screenshot: Filter bar — Combined filters and search

3. Frequently asked questions

Q: I cannot find a person in Central Members
- Try alternate spellings, then search by phone number
- Check First Timers; they may not be converted yet
- If still missing, add as first-timer during Sunday Service or create a minimal central member with required fields

Q: How do I prevent duplicates
- Prefer selecting existing Central Members rather than typing new names
- Use Convert to Member for first-timers instead of creating a new member manually
- Ask admins to review the duplicates queue for merges

Q: Can I edit service attendance after saving
- Yes, open the service, adjust attendees or first-timers, then Save Service to recompute totals

Q: Exports do not match my dashboard counts
- Align date ranges and filters; dashboards and exports must use the same window and criteria

Q: My data import fails validation
- Run Validate only for a quality report, fix headers and required fields, standardize dates, then re-run
- Use skipDuplicates if the list likely overlaps existing data

Q: A first-timer returned and visitCount did not increase
- Ensure the person was captured again in Sunday Service as a returning first-timer; verify the name match and that Save Service was clicked

Q: We converted a first-timer but lost their visit history
- Use the conversion flow; manual member creation will not carry history

Q: How do I attribute inviters on contacts
- In Evangelism, select invitedBy from Central Members to link outcomes to inviters

Screenshot: Evangelism — Contact detail with inviter set

4. Contact information for support

- Functional owner: your church administrator or data steward
- Technical owner: your system maintainer or implementation partner
- Recommended placeholders to replace during deployment:
  - Admin email: admin@your-church-domain
  - Tech support email: support@your-church-domain
  - Escalation channel: leadership@your-church-domain

Pro tips
- Maintain a small internal runbook with local conventions phone format, address format, export naming
- Review access and deprovisioning monthly with church administrators

Screenshot: Settings — Support contacts placeholder

5. System requirements and browser compatibility

Supported browsers
- Latest stable versions of Chrome and Edge recommended
- Recent Firefox and Safari supported for standard features
- Enable cookies and local storage for persistent sessions

Device and connectivity
- Desktop or laptop with 8 GB RAM recommended for dashboard-heavy use
- Minimum screen resolution 1366x768; 1440x900 or higher preferred
- Stable internet connection required for real-time updates

Operational notes
- Keep one active session per user to reduce merge conflicts during edits
- If the app appears offline, check the connectivity banner and retry actions after network recovers

Security and access
- Use named accounts per user; avoid credential sharing
- Apply least privilege roles Admin, Ministry Leader, Data Entry based on duties

Screenshot: Dashboard — Connectivity banner example

## Related Documentation
- [Documentation Hub](../README.md) - Main documentation index for Church Management Tracker
- [User Guide Index](README.md) - Overview of all user workflows
- [Common Procedures](common-procedures.md) - Foundational workflows used across Church Management Tracker

### Cross-reference map
- Member directory and data quality — [Central Members](../modules/central-members.md)
- Attendance capture and first-timer detection — [Sunday Service](../modules/sunday-service.md)
- Visitor nurturing and conversion — [First Timers](../modules/first-timers.md)
- Outreach tracking and inviter attribution — [Evangelism](../modules/evangelism.md)
- KPIs, trends, and funnel — [Dashboard and Analytics](../modules/dashboard-analytics.md)
- Bulk data movement and templates — [Import and Export](../modules/import-export.md)

Mermaid overview
```mermaid
flowchart LR
A[Evangelism Contacts] --> B[Sunday Attendance]
B --> C[First Timers]
C --> D[Convert to Members]
D --> E[Central Members Directory]
E --> F[Dashboard KPIs and Trends]