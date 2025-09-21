# Church Management Tracker - Ministry Leader Workflows

Target role: Ministry Leaders — evangelism leads, follow-up coordinators, department heads coordinating people engagement, overseeing first-timer nurturing, and monitoring team performance within Church Management Tracker.

Responsibilities
- Coordinate evangelism contacts and follow-up tasks
- Identify first-timers and move them toward membership readiness
- Review Sunday attendance patterns to guide ministry actions
- Assign work to team members and track completions
- Monitor performance metrics and report outcomes to leadership

## Related Modules
- [Evangelism and Contacts](../modules/evangelism.md) - Outreach contact tracking and follow-up workflows
- [First Timers](../modules/first-timers.md) - Visitor identification and nurturing processes
- [Sunday Service](../modules/sunday-service.md) - Attendance recording and analysis
- [Central Members](../modules/central-members.md) - Member directory and engagement tracking
- [Dashboard and Analytics](../modules/dashboard-analytics.md) - Performance monitoring and KPIs
- [Import and Export](../modules/import-export.md) - Team coordination and data exports

Screenshot: Evangelism Dashboard — Contacts tab

1. Evangelism contact management and follow-up tracking

Goal: capture outreach interactions within Church Management Tracker, prioritize follow-up, and measure outcomes.

Procedure — add and classify contacts
1. Navigate to Evangelism.
2. Click Add Contact and enter name, phone, date, and category for example responsive, has church.
3. Attribute the inviter invitedBy invitedById by selecting from Central Members where known.
4. Set spiritual indicators saved, attendedChurch, likelyToCome when applicable.
5. Save to add the record and appear in filters and analytics.

Procedure — track follow-up with comments
1. Open a contact.
2. Add a comment with a clear action, outcome, and next step.
3. Use time stamped comments to maintain history across multiple touchpoints.

Procedure — filter and prioritize
1. Use the filters bar to select category responsive, likelyToCome true, date range last 14 days.
2. Sort by updatedAt to work the freshest items first.
3. Create a saved view by noting the filter combination you reuse often.

Pro tips
- Use likelyToCome true to create weekly outreach shortlists.
- Attribute inviters consistently to unlock recognition reporting.
- Keep comments short and action oriented to improve team handoffs.

Common pitfalls and how to avoid them
- Missing phone numbers: add at least one reliable contact method during the first interaction.
- Overuse of non responsive: if a contact attends an event, reclassify to reflect current engagement.

Success metrics
- Follow-up completion within 72 hours of contact creation
- Increase in saved and attendedChurch ratios month over month
- Coverage rate percentage of contacts with at least one follow-up comment in the last 30 days

Integration points
- Central Members provides inviter directory and attribution.
- Dashboard shows conversion funnel from contact to saved to attendee to member.
- First Timers receives contacts who start attending Sunday services.

Screenshot: Evangelism — Contact detail with Comments panel

2. First-timer identification and nurturing processes

Goal: ensure every new visitor is captured, contacted, and progressed toward membership.

Procedure — find new first timers
1. Go to First Timers.
2. Filter by followUpStatus Pending and sort by firstServiceDate newest first.
3. Open each record to confirm details and add initial notes.

Procedure — manage follow-up
1. Update followUpStatus as you progress Pending → Contacted → Scheduled.
2. Add notes with next appointment date and who is responsible.
3. If the person attends again, visitCount increments automatically from Sunday Service integration.

Procedure — convert to member
1. Filter for visitCount greater than 1 or eligibility flagged.
2. For single conversion, open the record and click Convert to Member, validate fields, and save.
3. For bulk conversion, select multiple eligible visitors and run Bulk Convert.

Pro tips
- Include invitedById where possible to connect outcomes to inviters.
- Use ageGroup and address when known to plan integration into the right groups.

Common pitfalls and how to avoid them
- Manual member creation: always use Convert to Member to prevent duplicates and preserve visit history.
- Stale follow-ups: review Pending contacts weekly to reassign or close as Inactive if unresponsive.

Success metrics
- Median time from first visit to contact under 3 days
- Conversion rate from recurring visitor to member trending upward
- Reduced number of Pending first timers older than 14 days

Integration points
- Sunday Service auto creates and updates first timers on save.
- Central Members receives new member records on conversion.
- Dashboard reports first timer trends and conversion counts.

Screenshot: First Timers — Follow-up status board

3. Sunday service attendance recording and analysis

Goal: partner with service admins to ensure accurate attendance and glean insights for ministry planning.

Procedure — coordinate attendance capture
1. Before service, confirm the assigned data entry personnel for attendance.
2. After service, review the created service entry and check attendee counts and first timers.
3. Use the Enhanced Attendee Manager to verify key team members were marked present.

Procedure — analyze attendance
1. In Sunday Service, apply a monthly date range and review attendance trends.
2. Compare adult and children subtotals and first timer counts per service.
3. Note anomalies for investigation, for example unusually low counts or unexpected spikes.

Pro tips
- Cross check converts and tithers if tracked locally to maintain consistent KPIs.
- Review image uploads to add context in reports where appropriate.

Common pitfalls and how to avoid them
- Late service entries: set a standard to finalize records within 48 hours.
- First timers not captured: encourage ushers and greeters to identify and submit names promptly.

Success metrics
- On time completion rate of service entries within 48 hours
- Consistent week over week attendance patterns with explained variances
- First timer capture rate percentage of reported visitors recorded

Integration points
- First Timers updates visitCount and eligibility based on services.
- Dashboard attendance charts reflect trends and drive planning.
- Central Members supports consistent attendee selection to reduce duplicates.

Screenshot: Sunday Service — Attendance trend view

4. Team coordination and task assignment

Goal: organize follow-up actions across a team with clarity and accountability.

Procedure — assign work
1. From Evangelism or First Timers filters, create a list of items to assign.
2. Export filtered rows via Universal Export if you manage tasks externally.
3. Share assignments with team members specifying due dates and outcomes expected.
4. Track completions by scanning for new comments and updated followUpStatus.

Procedure — weekly standup routine
1. Review dashboard trends and funnel metrics with the team.
2. Highlight wins saved, returned visitors, conversions and discuss blockers.
3. Rebalance assignments based on workload and response rates.

Pro tips
- Keep a simple assignment naming convention for exported lists including date and owner.
- Use comments to record who handled the interaction for traceability.

Common pitfalls and how to avoid them
- Double contacting: coordinate assignments to avoid multiple calls to the same person.
- Unclear ownership: always record the responsible person in the first comment.

Success metrics
- Follow-up SLA adherence percentage on time follow-ups
- Assignment completion rate week over week
- Increased likelyToCome true ratio after engagement

Integration points
- Import and Export supports list handoffs to external tools if needed.
- Dashboard activity feed provides recent changes across modules.

Screenshot: Evangelism — Filtered list ready for export

5. Performance monitoring and reporting

Goal: demonstrate ministry effectiveness and guide decisions with data.

Procedure — review dashboard KPIs
1. Navigate to the Dashboard.
2. Set a relevant date range example last 90 days.
3. Review conversion funnel, growth metrics, and category distributions.
4. Drill into trends that need action for example low saved to attendance conversion.

Procedure — prepare a monthly report
1. Export key datasets Evangelism segments, First Timers conversions, Sunday attendance.
2. Summarize highlights wins and challenges.
3. Present focused actions for the coming month based on data.

Pro tips
- Keep a consistent reporting template to compare month over month.
- Celebrate inviters with strong attribution outcomes to reinforce behaviors.

Common pitfalls and how to avoid them
- Cherry picking data: use the same filters and time windows for comparability.
- Overreacting to single week spikes: emphasize trend lines rather than single points.

Success metrics
- Month over month improvement in conversion funnel stages
- Sustained attendance growth rate in target bands
- Reduced backlog of Pending first timers

Mermaid overview
```mermaid
flowchart LR
A[Evangelism contacts] --> B[Saved]
B --> C[Attended Church]
C --> D[First Timers follow-up]
D --> E[Eligible for Conversion]
E --> F[Central Members]
F --> G[Dashboard KPIs updated]
```

## Related Documentation
- [Documentation Hub](../README.md) - Main documentation index for Church Management Tracker
- [User Guide Index](README.md) - Overview of all user workflows
- [Leadership Analytics Guide](leadership-analytics.md) - Strategic decision support using Church Management Tracker data
- [Common Procedures](common-procedures.md) - Foundational workflows used across modules