# Veliaht OS — Product Blueprint v2.0

**Document type:** Master Product Specification  
**Supersedes:** PRODUCT_BLUEPRINT.md (v1.0)  
**Status:** Living document — update at every major version milestone  
**Scope:** Complete product architecture from v0.3 through v1.0 commercial release

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Platform-Level Systems](#2-platform-level-systems)
3. [User Roles](#3-user-roles)
4. [Left Navigation Structure](#4-left-navigation-structure)
5. [Module Specifications](#5-module-specifications)
   - 5.1 Dashboard
   - 5.2 Organization
   - 5.3 Governance (Corporate + Family)
   - 5.4 Meetings
   - 5.5 Execution
   - 5.6 Performance
   - 5.7 Knowledge
   - 5.8 AI Advisor
   - 5.9 Administration
6. [Role-Access Matrix](#6-role-access-matrix)
7. [Module Relationships](#7-module-relationships)
8. [Data Flow Architecture](#8-data-flow-architecture)
9. [AI Integration Plan](#9-ai-integration-plan)
10. [Cloud Architecture](#10-cloud-architecture)
11. [Sprint Roadmap v0.3 → v1.0](#11-sprint-roadmap)
12. [Post-v1.0 Backlog](#12-post-v10-backlog)

---

## 1. Product Vision

Veliaht OS is a **family business operating system**.

It is purpose-built for families who operate businesses together — covering organizational structure, governance, meetings, execution, performance, and knowledge in a single integrated platform.

It is **not**:
- An ERP (transactions, accounting, supply chain)
- A CRM (pipelines, leads, customer records)
- HR software (payroll, recruitment, compliance)
- Project management software (task throughput tools)

The core problem Veliaht OS solves is **operational clarity and continuity** in family-owned businesses: making the company operable beyond individuals, formalizing who decides what, establishing management rhythm, and preserving institutional knowledge across generations.

### What Makes Veliaht OS Different

Most business tools handle either the company or the family. Veliaht OS handles both. It is the only platform that connects:

- **Corporate governance** — authority, accountability, decision rights in the business
- **Family governance** — the charter, council, ownership register, and rules that govern the family's relationship to the business

Without this dual layer, Veliaht OS is just another operations tool. With it, it becomes something no competitor currently offers.

### Design Philosophy

> A family business should run with the discipline of a professionally managed company — without losing the human relationships that make it a family business.

Every screen and feature must serve one of seven outcomes:

| Outcome | Driver Module |
|---|---|
| Who is responsible for what | Organization + Corporate Governance |
| Who can decide what | Corporate Governance |
| How the family governs the business | Family Governance |
| How decisions get made operationally | Meetings |
| Whether work is getting done | Execution |
| Whether the business is healthy | Performance |
| How knowledge is preserved and shared | Knowledge |

---

## 2. Platform-Level Systems

These are not modules. They are cross-cutting systems that run underneath every module. They must be designed before v0.9 and cannot be bolted on afterward.

---

### 2.1 Notification System

Every significant event in the system produces a notification. Notifications surface in two places: the in-app notification center and email.

**In-App Notification Center**
- Bell icon in the top navigation bar, visible on every screen
- Shows unread count badge
- Notification feed lists events in reverse chronological order
- Each notification links to the relevant record
- User can mark individual notifications or all as read

**Email Notifications**
- Per-user preference: each user controls which event categories trigger email
- Digest option: daily summary email instead of per-event emails
- Meeting reminders: sent 24 hours and 1 hour before scheduled meetings
- Task overdue: sent on the morning a task becomes overdue
- Weekly summary: sent every Monday morning with open tasks, upcoming meetings, and open action items

**Notification Event Categories**

| Category | Events |
|---|---|
| Tasks | Assigned to you, overdue, commented on, status changed |
| Meetings | Upcoming reminder, you were added as participant, meeting was cancelled |
| Action Items | Assigned to you, overdue |
| KPIs | Threshold warning, threshold critical breach |
| Governance | Position card needs review, governance gap detected |
| System | New user invited to your company, role changed |

**Notification Settings**
- Per-user, per-category toggles: in-app on/off, email on/off
- Company-level defaults set by Owner or GM
- Accessible from user profile settings

---

### 2.2 Global Search

Global search is a platform-level feature. It is not the same as Knowledge content search.

**Trigger:** Cmd+K (Mac) / Ctrl+K (Windows/Linux) from any screen, or clicking the search icon in the top navigation bar.

**Command Palette Behavior**
- Opens a floating search overlay
- Results appear as the user types (debounced, minimum 2 characters)
- Results are grouped by type: Employees, Tasks, Meetings, Decisions, Documents, Policies
- Keyboard navigation: arrow keys to move, Enter to open, Escape to close
- Each result shows type icon, title, and a secondary context line (department, status, date)

**Scope**
- Searches: employees, departments, tasks, meetings, meeting decisions, documents, policies, position cards
- Results are filtered by the authenticated user's access permissions
- Employees can search only records they have access to

**This is separate from the Knowledge module's content search**, which filters specifically within the document library, policies, and handbook using full-text indexing.

---

### 2.3 Dashboard Progressive Disclosure

The dashboard adapts based on which modules are active. It never shows empty or broken widgets.

**Module activation states:**

| Module | Activates At | Dashboard Contribution |
|---|---|---|
| Organization | v0.2 | Headcount, department count, open role count |
| Governance | v0.3 | Governance completeness score, position card coverage |
| Meetings | v0.4 | Upcoming meetings, open action items |
| Execution | v0.5 | Task status summary, overdue count |
| Performance | v0.6 | KPI status snapshot, goal progress |
| Knowledge | v0.7 | Recently updated documents |
| AI | v0.8 | AI insight alerts |

Widgets for modules not yet active show a "Coming in v0.X" placeholder during development, and are simply hidden for external users once released.

---

## 3. User Roles

Veliaht OS defines four business roles. These map to real positions inside a family business, not abstract permission tiers.

---

### Owner

The family business owner, principal shareholder, or founding family member.

**Scope:** Full visibility and control across the entire platform.  
**Unique access:** Family governance data, ownership register, user management, billing, permission matrix.  
**Typical concerns:** Is the business working without me? Are the right people in the right roles? Is the family governance structure being respected?

---

### General Manager

The appointed executive responsible for day-to-day operations. May or may not be a family member.

**Scope:** Full operational access. View-only on succession data. No access to family governance, user management, or billing.  
**Typical concerns:** Are all departments executing? Where are the bottlenecks? Which meetings need follow-up?

---

### Manager

A department head or team leader.

**Scope:** Full access within their department. Read access to company-level shared resources.  
**Typical concerns:** Is my team clear on responsibilities? Are tasks being completed? What does my department look like this month?

---

### Employee

A frontline staff member or individual contributor.

**Scope:** Personal tasks, own profile (read), meetings they participate in, knowledge base (read).  
**Typical concerns:** What are my tasks today? When is my next meeting? Where do I find the process for this?

---

### Role Comparison Summary

| Capability | Owner | GM | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| View all departments | ✓ | ✓ | ✓ | read |
| Edit org structure | ✓ | ✓ | — | — |
| View all position cards | ✓ | ✓ | own dept | own card |
| Edit position cards | ✓ | ✓ | own dept | — |
| View authority matrix | ✓ | ✓ | read | — |
| View succession data | ✓ | read | — | — |
| Access family governance | ✓ | — | — | — |
| Create/manage meetings | ✓ | ✓ | ✓ | — |
| View meeting decisions | ✓ | ✓ | ✓ | participants |
| Manage tasks | ✓ | ✓ | own dept | own tasks |
| View company KPIs | ✓ | ✓ | — | — |
| View dept KPIs | ✓ | ✓ | own dept | — |
| View own scorecard | ✓ | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ | — |
| Edit policies | ✓ | ✓ | — | — |
| View AI insights | ✓ | ✓ | suggestions | — |
| Manage users | ✓ | — | — | — |
| View audit log | ✓ | ✓ | — | — |

---

## 4. Left Navigation Structure

The sidebar navigation is fixed and role-aware. Items not accessible to the current role are hidden entirely. The navigation is shallow: seven primary sections maximum.

```
┌─────────────────────────────┐
│  [Company Logo / Name]      │
├─────────────────────────────┤
│  🔍  [Search bar / Cmd+K]  │
├─────────────────────────────┤
│  ⌂  Dashboard               │
├─────────────────────────────┤
│  ▾ Organization             │
│     Overview                │
│     Departments             │
│     Employees               │
│     Org Chart               │
├─────────────────────────────┤
│  ▾ Governance               │
│  ── Corporate               │
│     Role Profiles           │
│     Decision Rights         │
│     Authority Matrix        │
│     Setup Health            │
│  ── Family                  │
│     Family Council          │
│     Ownership Register      │
│     Family Charter          │
│     Succession Plan         │
├─────────────────────────────┤
│  ▾ Meetings                 │
│     Schedule                │
│     Decisions Log           │
│     Action Items            │
│     Meeting History         │
├─────────────────────────────┤
│  ▾ Execution                │
│     My Tasks                │
│     Team Board              │
│     Projects                │
│     SOPs                    │
├─────────────────────────────┤
│  ▾ Performance              │
│     Company Overview        │
│     Department KPIs         │
│     Goals                   │
│     Employee Scorecards     │
│     Reports                 │
├─────────────────────────────┤
│  ▾ Knowledge                │
│     Documents               │
│     Policies                │
│     Handbook                │
├─────────────────────────────┤
│  ◈  AI Advisor              │
├─────────────────────────────┤
│  ⚙  Settings                │
├─────────────────────────────┤
│  [User avatar / name]       │
│  [Notification bell]        │
└─────────────────────────────┘
```

**Navigation design decisions:**
- Governance is split into two clearly labeled sub-sections: Corporate and Family. Family is visible only to Owner.
- "Position Cards" renamed to "Role Profiles" — clearer product language for non-consulting users.
- "Governance Gap Review" renamed to "Setup Health" — actionable framing.
- Meeting Types removed from navigation — it is a configuration option inside the Schedule screen, not a primary destination.
- Workflow Builder removed from navigation — moved to post-v1.0 backlog.
- OKR Dashboard replaced by "Goals" — simpler framework for the target audience.
- Template Library folded into Documents — reduces navigation depth.

---

## 5. Module Specifications

---

### 5.1 Dashboard

**Purpose:** A role-adapted command center. Each role sees a different composition of the same business data. Widgets appear only when their source module is active (see Platform-Level Systems §2.3).

**Status:** Released (v0.1) — widgets evolve with each module release

#### Screens

| Screen | Visible To | Description |
|---|---|---|
| Owner Dashboard | Owner | Company health at a glance: governance completeness, active KPIs, meeting rhythm, open decisions, AI alerts |
| Executive Dashboard | GM | Operational overview: department execution rates, upcoming meetings, open action items, department KPI snapshots |
| Manager Dashboard | Manager | Department view: team task status, upcoming meetings, open action items, department goals |
| Employee Dashboard | Employee | Personal view: my tasks today, upcoming meetings, recent announcements |

#### Widget Library

Each dashboard composes from this shared widget set, filtered by role and module activation:

| Widget | Available From | Roles |
|---|---|---|
| My tasks (due today / overdue) | v0.5 | All |
| Team task status summary | v0.5 | Owner, GM, Manager |
| Upcoming meetings (this week) | v0.4 | All |
| Open action items (unresolved) | v0.4 | All |
| KPI status snapshot | v0.6 | Owner, GM, Manager |
| Goal progress summary | v0.6 | Owner, GM, Manager |
| Governance completeness score | v0.3 | Owner, GM |
| AI insight alerts | v0.8 | Owner, GM |
| Recent decisions | v0.4 | Owner, GM, Manager |
| Recently updated documents | v0.7 | All |

#### Empty State Design

When a widget's source module is not yet active, the widget slot shows a brief explanation of what it will show and a link to the relevant setup screen. This prevents blank dashboards and guides setup.

---

### 5.2 Organization

**Purpose:** Defines the structural map of the business. Foundation for all other modules.

**Status:** Released (v0.2)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Organization Overview | All roles | Summary: total employees, departments, open roles. Shows org completeness score with action prompts |
| Department List | All roles | Paginated list with manager, headcount, and status |
| Department Detail | All roles | Department info, member list, linked meetings and KPIs, linked role profiles |
| Employee Directory | All roles | Searchable and filterable list with status, department, and role level |
| Employee Profile | All roles (own-scoped for Employees) | Contact info, department, reporting line, link to role profile in Governance, task history, meeting participation, scorecard link |
| Org Chart View | All roles | Visual hierarchy. Zoomable. Clicking a node shows a summary card with a link to the full Employee Profile. Access is role-scoped: Employee sees names and titles; Manager sees own department in full |
| Reporting Line Editor | Owner, GM | Dropdown-based interface to set manager-employee relationships |

#### Architectural Note

Employee Profile links to Role Profile (in Governance) — it does not embed it. This resolves the previous ownership conflict between Organization and Governance. The Role Profile is canonical to the Governance module.

#### Empty State

A new company with only an admin account shows a prompt: "Start by adding your first department and employees." A setup progress bar shows how complete the org structure is.

---

### 5.3 Governance

**Purpose:** Defines authority, accountability, and decision rights at both the corporate level and the family level. The family governance section is the core differentiator of Veliaht OS.

**Status:** Planned (v0.3)

The Governance module is divided into two sub-sections with separate nav labels.

---

#### Corporate Governance

Defines how authority flows through the business structure.

| Screen | Access | Description |
|---|---|---|
| Role Profiles List | Owner, GM, Manager (own dept) | All role profiles with status: draft, active, needs review. Filter by department. Shows coverage % |
| Role Profile Detail | Owner, GM, Manager (own dept), Employee (own, read) | Role summary, duties list, collaboration list, decision scope, approval scope, version history with timestamps |
| Role Profile Editor | Owner, GM, Manager (own dept) | Inline editor with auto-save drafts. Structured fields for duties (one per row) and collaborations |
| Decision Rights Matrix | Owner, GM, Manager (read) | Table mapping decision categories to roles: decides alone / advises / must approve. Editable by Owner and GM |
| Authority Matrix | Owner, GM | Cross-departmental authority map: which roles hold authority over which business domains |
| Setup Health | Owner, GM | Actionable checklist of what is incomplete: "7 employees have no role profile" with direct action buttons. Calculates and displays the Governance Completeness Score (0–100%) |

**Governance Completeness Score formula:**
- % of active employees with a published role profile
- % of senior roles (Manager+) with defined decision rights
- % of departments with an active manager assigned
- % of key decisions with a named owner

Score surfaces as a widget on the Owner and GM dashboards.

---

#### Family Governance

Defines how the owning family governs its relationship to the business. Visible only to the Owner role. This is unique to Veliaht OS.

| Screen | Access | Description |
|---|---|---|
| Family Council | Owner | Define the family council: members, meeting cadence, quorum rules, chairperson. Lists the family council's scheduled meetings (linked to the Meetings module with type = 'family_council') |
| Ownership Register | Owner | Record of ownership distribution: family member name, ownership %, share class, effective date. Version history. Not a legal instrument — a reference record |
| Family Charter | Owner | Structured document covering: family employment policy (rules for family members entering the business), conflict of interest policy, dividend and distribution principles, family communication norms. Editable as a structured text document |
| Succession Plan | Owner, GM (view) | Leadership depth map: which roles have named successors, readiness level (ready now / ready in 1–2 years / in development), last review date. Gap alerts for senior roles with no named successor |

**Why Family Governance is separate from Corporate Governance:**
Corporate governance answers "how does the business decide things." Family governance answers "how does the family decide its relationship to the business." These are different audiences, different conversations, and different sensitivities. Mixing them produces a module that serves neither well.

#### Key Data Entities

`RoleProfile` → `RoleProfileDuty` → `RoleProfileCollaboration`  
`DecisionRight` → `AuthorityRule`  
`FamilyCouncil` → `FamilyCouncilMember`  
`OwnershipRecord`  
`FamilyCharter` → `FamilyCharterSection`  
`SuccessionRecord`

---

### 5.4 Meetings

**Purpose:** Creates management rhythm. Transforms meetings from passive calendar events into operational control points with structured outcomes.

**Status:** Planned (v0.4)

**Architectural decision:** The three-level hierarchy (`MeetingType → MeetingTemplate → MeetingOccurrence`) from v1 blueprint is simplified to two levels: `MeetingTemplate → MeetingOccurrence`. Meeting type (board, weekly, one-on-one, family council, etc.) becomes a category field on the template. This removes an entire entity from the data model with no loss of functionality.

#### Screens

| Screen | Access | Description |
|---|---|---|
| Schedule | All roles (own-scoped for Employees) | Calendar + list hybrid view of all meetings. Filter by category, department, participant. Employees see only meetings they are invited to |
| Meeting Setup | Owner, GM, Manager | Create a meeting from a template or from scratch. Set category, participants, cadence (one-time or recurring), owner. Cadence is a simple field (weekly, monthly, quarterly, ad-hoc) — not a workflow engine |
| Meeting Templates | Owner, GM | Create and manage reusable meeting patterns: weekly team review, board meeting, family council, performance review. Templates include default participants, agenda structure, and expected duration |
| Meeting Detail | Owner, GM, Manager, Employee (participants) | The live/past meeting view: agenda, notes area, participant list, decisions recorded, action items created |
| Agenda Builder | Owner, GM, Manager (meeting owner) | Add, reorder, and time-box agenda items before or during a meeting. Simple list editor, not drag-and-drop in v0.4 |
| Decisions Log | Owner, GM, Manager | Searchable registry of all decisions made across all meetings. Filter by department, date range, decision owner. Each entry shows: decision text, meeting name, date, owner, and a "Promote to Policy" action |
| Action Items | All roles | Filtered view of tasks whose `source_type = 'meeting'`. This is **not a separate data store** — it is a filtered view of the Task entity managed in Execution. Users see their assigned action items; Managers see their department's; GM and Owner see all |
| Meeting History | Owner, GM, Manager | Timeline of past meetings with: attendance record, count of decisions made, count of action items created, completion rate of those action items |

#### Meeting Decision → Policy Promotion

From the Decisions Log, any decision record has a "Promote to Policy" button (visible to Owner and GM only). Clicking this opens a side panel that pre-fills a new Policy record in the Knowledge module with the decision text as the policy body, the meeting date as effective date, and the decision owner as policy owner. The user reviews and publishes. This makes the flow explicit, not just a concept in a data flow diagram.

#### Key Data Entities

`MeetingTemplate` → `MeetingOccurrence`  
`MeetingOccurrence` → `MeetingParticipant` (many-to-many with Employee)  
`MeetingOccurrence` → `AgendaItem`  
`MeetingOccurrence` → `MeetingDecision`  
`MeetingOccurrence` → `Task` (via source_type = 'meeting')

`MeetingTemplate.category` enum: `board`, `weekly_review`, `daily_standup`, `one_on_one`, `performance_review`, `family_council`, `ad_hoc`

---

### 5.5 Execution

**Purpose:** Turns governance structure and meeting decisions into day-to-day operational movement.

**Status:** Partially released (v0.5) — see the v0.5 sprint table in §11 for exactly what shipped vs. was deferred. My Tasks, Team Tasks, All Tasks, and Task Detail are live; Recurring Task Setup, Project Overview/Detail, SOP Library/Detail, and Checklist Runner are not built yet.

**Architectural decision:** The Workflow Builder is removed from this version and moved to the post-v1.0 backlog. The real underlying need — repeating work on a schedule — is addressed by recurring task support, which is simpler and covers 90% of the use case for this audience.

**v0.5 layout decision:** Team Board is implemented as a grouped-by-status list (section header per status, no drag-and-drop) rather than a literal 4-column Kanban grid, per this sprint's "do not over-engineer" instruction. The visual board layout described below remains the longer-term target if a future sprint wants it.

#### Screens

| Screen | Access | Description |
|---|---|---|
| My Tasks | All roles | Personal task list. Group by status, priority, or due date. Source badge shows origin: manual, meeting, KPI, recurring |
| Team Board | Owner, GM, Manager | Kanban board: To Do / In Progress / Blocked / Done. Manager sees own dept; GM sees all. Click any card to open Task Detail |
| Task Detail | All roles (assigned + creator) | Title, description, assignee, due date, priority, source reference, comments thread with @mention support, status history timeline (who changed what, when) |
| Recurring Task Setup | Owner, GM, Manager | Set a task to repeat on a cadence: daily, weekly, monthly, quarterly. On each cycle, a new Task instance is created. The original serves as the template. Missed instances are flagged |
| Project Overview | Owner, GM, Manager | List of active projects with: completion %, milestone count, owner, department, deadline |
| Project Detail | Owner, GM, Manager, Employee (assigned) | Project description, milestones, linked tasks, participants. A project is a container for related tasks — not a separate execution engine |
| SOP Library | All roles (Employee: read) | Standard operating procedures by department and process type. Each SOP has: title, owner, last reviewed date, step count, version number |
| SOP Detail | All roles | Step-by-step procedure view. Managers and above can edit; Employees read. Any user can start a Checklist Run from an SOP |
| Checklist Runner | All roles | Interactive execution of an SOP. Each step is checked off with a timestamp and optional note. The run is recorded as a `ChecklistRun` linked to the SOP and the employee |

#### Task Source Tracking

All tasks carry `source_type` and `source_id`. Valid source types:

| Source Type | Origin |
|---|---|
| `manual` | Created directly by a user |
| `meeting` | Created from a meeting action item |
| `governance` | Reserved for future Governance-triggered tasks (e.g. role-profile gap follow-up). No producing logic yet — Governance's Setup Health / Decision Rights Matrix screens don't exist yet either |
| `kpi` | Triggered by a KPI threshold breach (v0.6+) |
| `recurring` | Auto-created by a recurring task template |

**Note:** `workflow` source type is reserved for the post-v1.0 Workflow Builder. As of v0.5, `manual` and `meeting` are the only source types with any producing logic — the rest are reserved enum values only.

#### Task Comments and @Mentions

Every task has a comments thread. Any comment can @mention an employee by name. An @mention triggers a notification to that employee (in-app + email per their preferences). The commenter receives a reply notification if someone responds.

#### Key Data Entities

`Task` → `TaskComment`  
`Task` (with `is_recurring_template = true`) → `Task` instances  
`Project` → `ProjectMilestone` → `Task`  
`SOP` → `SOPStep`  
`Checklist` → `ChecklistRun` → `ChecklistStepCompletion`

---

### 5.6 Performance

**Purpose:** Measures whether the organization is healthy and whether execution is producing expected outcomes.

**Status:** Released (v0.6) — see the v0.6 sprint table in §11 for exactly what shipped vs. was deferred. PDF export, real charting (Trend Analysis uses a data table instead), the Meeting Rhythm Monitor, real meeting attendance-taking, and real in-app/email notifications are explicitly deferred.

**Architectural decision:** The OKR framework (`Objective → KeyResult → KeyResultCheckIn`) is replaced by a simpler **Goals** model for v0.6. Goals captures the real need of most family businesses — set a target, track progress, discuss in meetings — without the OKR methodology overhead. A full OKR mode is deferred to post-v1.0 as an optional feature.

**AI integration starts here:** Basic KPI signals (threshold alerts) are activated in v0.6. This does not require an LLM — it is pure rule-based logic. The AI module in v0.8 builds on these signals. **v0.6 note:** the Governance gap detector and Execution health score are folded into Company Overview's tiles rather than being separate standalone screens/jobs, since the blueprint describes them as feed-ins to Company Overview, not independent screens. The Meeting Rhythm Monitor is deferred — `meetingTemplates.freq` is free text, not a structured, parseable cadence, so detecting "hasn't happened in 3 weeks" isn't buildable without a Meetings-module data model change, which is out of scope for a Performance sprint.

#### Screens

| Screen | Access | Description |
|---|---|---|
| Company Overview | Owner, GM | Executive health view: company-wide KPI status grid, active goal summary, department health tiles. One-screen answer to "how is the business doing?" |
| KPI Management | Owner, GM | Create, edit, and archive KPI definitions. Set: name, unit, direction (higher/lower/target is better), target value, warning threshold, critical threshold, measurement frequency |
| KPI Detail | Owner, GM, Manager (own dept) | Historical value chart with trend line, target vs. actual overlay, period-over-period comparison, notes timeline |
| KPI Entry | Owner, GM, Manager (own dept) | Manual entry form for periodic KPI values. Fields: period, actual value, notes |
| Department KPIs | Owner, GM, Manager (own dept) | Department-scoped KPI grid with status indicators and comparison to prior period |
| Goals | Owner, GM, Manager | Company-level and department-level goals. Each goal has: title, owner, target date, current status (on track / at risk / achieved / missed), and check-in notes. Simple, non-OKR |
| Employee Scorecard | Owner, GM, Manager (own dept), Employee (own) | See §Employee Scorecard Process below |
| Trend Analysis | Owner, GM | Multi-KPI chart with time range and department filters |
| Reports | Owner, GM, Manager | Generate exportable reports: KPI summary, department performance, goal status. Output formats: PDF, CSV. Reports are point-in-time snapshots, not live dashboards |

#### Employee Scorecard Process

The scorecard is a process, not just a record. The following design governs it:

**Who can write:** Manager (for their direct reports), GM, Owner  
**Who can view:** The employee can see their own scorecard. A Manager sees their department's scorecards. GM and Owner see all.  
**Review cycle:** Quarterly (configurable per company in Settings)  
**Process flow:**
1. At the start of a review period, the system notifies the Manager to begin reviews for their team
2. The Manager completes the scorecard for each direct report: KPI attainment (auto-pulled from data), task completion rate (auto-calculated), qualitative notes (written by Manager)
3. The Manager marks the scorecard "ready for sharing"
4. The employee receives a notification that their scorecard is available
5. The employee can add a self-assessment note (optional)
6. The Manager marks the review "completed" after a 1:1 discussion

**Scorecard components:**
- KPI attainment (from assigned KPIs) — v0.6 approximates this as the employee's department's KPI on-track rate, since the data model doesn't support employee-level KPI assignment (see §5.6 Screens note above)
- Task completion rate (from Execution data)
- Meeting attendance rate (from Meetings data) — **v0.6 approximation:** every employee invited to a `completed` meeting occurrence counts as having attended, since there is no real attendance-taking feature anywhere in the app. Revisit this calculation if/when the Meetings module adds real attendance tracking.
- Qualitative notes (written by reviewer)
- Employee self-assessment (optional, written by employee)
- Review status: not started / in progress / shared / completed

The scorecard is never editable by the employee. Their only input is the self-assessment note.

#### KPI Signal to Notification

When a KPI value is entered and crosses a warning or critical threshold:
1. A `KPIAlert` record is created (not yet an AI concept — a simple rule-based event)
2. Owner and GM receive a notification (in-app + email per their preferences)
3. The KPI card on the dashboard shows a warning or critical badge
4. In v0.8, these alerts also feed the AI Insights module as `RiskSignal` records

#### Key Data Entities

`KPIDefinition` → `KPIValue` → `KPIAlert`  
`Goal` → `GoalCheckIn`  
`EmployeeScorecard` → `ScorecardReviewCycle`  
`DepartmentHealthSnapshot`  
`Report` → `ReportSnapshot`

---

### 5.7 Knowledge

**Purpose:** Preserves how the company operates and makes that knowledge consistently accessible. Reduces dependency on specific individuals.

**Status:** Released (v0.7) — see the v0.7 sprint table in §11 for exactly what shipped vs. was deferred. Documents, Policy Center, Company Handbook, Content Search, the completed Promote-to-Policy flow, and a rule-based Meeting Summary are live. Real file upload/object storage, real LLM-generated summaries, and Global Search (Cmd+K) are explicitly deferred.

**AI integration starts here — with a caveat:** Meeting summaries are activated in v0.7, but not as an LLM feature yet. The prototype has no backend (that's v0.9), so there is nowhere to safely hold an LLM provider API key or make a server-side call. `generateMeetingSummary()` deterministically derives the summary from agenda items, notes, recorded decisions, and action items already on the occurrence — disclosed to the user in-product as rule-based, not represented as real AI output. Real LLM generation is deferred to v0.9 (backend exists) or v0.8 (AI Settings adds provider config), whichever lands first.

**Architectural decision:** Template Library is merged into Documents as a filtered document category. It does not need its own navigation entry.

**Architectural decision:** Documents do not support real file upload. No object storage exists until v0.9, and base64 file blobs in `localStorage` risk quota errors and violate the Engineering Guide's "keep state lean" rule. Documents are structured text records with a version history; "download" exports the body as a `.txt` file via `Blob` + `<a download>`, the same zero-dependency pattern as v0.6's CSV export.

#### Screens

| Screen | Access | Description |
|---|---|---|
| Documents | All roles (Employee: read) | Full library of company documents organized by department and category. Categories include: templates, reports, contracts, reference. Each document shows: title, department, owner, last updated, version number |
| Document Detail | All roles | View the document, see version history (list of versions with dates and uploaders). Download current version. Owner/GM/Manager can upload new versions. No diff viewer — history list only |
| Policy Center | Owner, GM (edit), Manager, Employee (read) | Structured policy registry by category: HR, financial, operational, family (family policies visible to Owner only). Each policy: title, body text, effective date, owner, status (draft/active/archived), source (manual or promoted from meeting decision) |
| Company Handbook | Owner, GM (edit), Manager, Employee (read) | Multi-section structured handbook. Sections: About the Company, Our Organizational Structure, How We Work, Our Policies, Our Standards. Sections are plain-text documents, not a CMS |
| Content Search | All roles | Full-text search within the Knowledge module: searches document titles and content, policy text, and handbook sections. Distinct from Global Search (Cmd+K), which searches across all modules |
| AI Meeting Summary | Owner, GM, Manager (meeting owner) | After a meeting is marked complete, this screen shows the AI-generated summary: key points discussed, decisions extracted, action items extracted. The meeting facilitator reviews and approves before it is saved to the meeting record |

#### Meeting Decision → Policy Promotion (UI design)

In the Decisions Log (Meetings module), each decision row has a "Promote to Policy" action (Owner/GM only). Clicking opens a slide-over panel showing a pre-filled Policy form:
- Title: auto-filled from decision text (editable)
- Body: decision text (editable)
- Category: dropdown (default: operational)
- Owner: pre-filled with decision owner (editable)
- Effective date: meeting date (editable)
- Status: draft (user must explicitly publish)

The user reviews, edits, and saves. The policy is created in the Policy Center with `source_type = 'meeting_decision'`.

#### Key Data Entities

`Document` → `DocumentVersion`  
`Policy` → `PolicyVersion`  
`HandbookSection`  
`KnowledgeTag`  
`MeetingSummary` (linked to MeetingOccurrence)

---

### 5.8 AI Advisor

**Purpose:** An intelligence layer across the operating system. Analyzes company operating data to detect risks, recommend actions, and support decision-making. Not a gimmick — every AI feature must connect to a real operational signal.

**Status:** Released (v0.8) — see the v0.8 sprint table in §11 for exactly what shipped vs. was deferred. AI Insights, Suggested Actions (with per-type recommended actions), a 14-question Executive Assistant, and an enriched Company Health Brief are live, all rule-based. Real LLM generation (Role Profile Drafter), email delivery, and notification preferences are explicitly deferred.

**Architectural decision:** The previous "AI Insights Dashboard" and "Risk Detection Center" are merged into a single **AI Insights** screen with filter tabs. Two screens describing the same data type added complexity without value.

**Architectural decision — insights are computed, not stored:** `AIInsight` and `SuggestedAction` are not persisted entities. Both are fully derivable from data already in `roleCards`, `kpiAlerts`, `tasks`, and `scorecards`, so storing them would just be a second, sync-prone copy of the same information — exactly what the Engineering Guide's Performance Guidelines warn against. Insights are computed live by `computeAIInsights()` with a deterministic id per insight; only user actions that can't be re-derived (dismissal) are persisted, as a flat `dismissedInsightIds` list. Convert-to-task status needs no storage at all — it's answered by checking whether a `Task` already references the insight's id. See `DATA_MODEL.md` §16–17 for the full reasoning.

**Scope for v0.8:** The Executive Assistant is scoped to structured question templates — not open-ended RAG — and expanded from the original 5-question sketch to 14 questions spanning attention-today, department health, KPIs, goals, meetings, overdue work, recent changes, policy updates, scorecard completion, and priority risks. Full conversational RAG over all company data is deferred to post-v1.0 once the data model is mature and usage patterns are understood.

**Architectural decision — Role Profile Drafter is rule-based, not LLM.** Same gap as the v0.7 Meeting Summarizer: no backend exists to safely hold an LLM API key. The drafter pulls from an existing peer role profile in the same department when one exists, or a generic template otherwise, disclosed to the user as rule-based rather than presented as real AI output. Real LLM generation is deferred to v0.9.

**Architectural decision — Company Health Brief is generated on demand, not on a weekly schedule.** There is no background job runner in a browser-only prototype. A "Regenerate" button produces a fresh brief; automatic Monday delivery depends on both a job scheduler and email sending, neither of which can exist before v0.9.

#### Screens

| Screen | Access | Description |
|---|---|---|
| AI Insights | Owner, GM (read, dept-scoped) | Unified feed of all AI-generated insights. Filter tabs: All / Critical / Warning — simplified from the original "Risks / Recommendations / Trends" taxonomy, since none of the four structured signals below actually produce a "trend," and recommendations live on the Suggested Actions screen instead. Each card shows: insight title, type, severity, and (Owner only) a dismiss action |
| Suggested Actions | Owner, GM (dept-scoped) | Actionable recommendations generated from risk signals — each insight carries a tailored recommended action (specific title + recommended assignee, not a generic "create a task" prompt). Convertible to a Task in Execution with one click. Task is created with `source_type = 'kpi'` or `source_type = 'governance'` |
| Executive Assistant | Owner, GM (dept-scoped answers) | Structured question interface. User selects from a 14-question library; the system generates a rule-based answer from company data. Every answer is logged to `assistantQueries` for history |
| Company Health Brief | Owner (generate), GM (read) | On-demand brief. Contains: Executive Summary (a paragraph assembled from the fields below by string template — not LLM prose), Biggest Risk, Biggest Improvement, Suggested Priorities (top 3 uncoverted recommended actions), Improved, Declined, and Top Open Items |

#### AI Feature Breakdown

**Structured Signals (no LLM required):**

| Signal | Source | Output |
|---|---|---|
| Governance Gap | Role profile coverage + decision rights | "7 employees have no published role profile" |
| KPI Anomaly | KPI values vs. thresholds | "Revenue KPI crossed critical threshold" |
| Execution Health | Task overdue rate, action item closure rate | "Sales department: 40% of tasks are overdue this month" |
| Meeting Rhythm | Recurring meeting cadence vs. actual occurrence | "Weekly leadership review has not occurred in 3 weeks" |
| Scorecard Completion | Scorecard review cycle status | "Q2 reviews have not been started for 5 employees" |

**Language Generation (LLM required):**

| Feature | Input | Output |
|---|---|---|
| Meeting Summarizer | Meeting notes + agenda + participant list | Structured summary, extracted decisions, extracted action items — for review before saving |
| Role Profile Drafter | Role title + department + similar profiles | Draft role profile with duties and decision scope — for review and editing |

**Post-v1.0 AI (deferred):**
- Open-ended Executive Assistant chat (full RAG)
- Strategic pattern detection across time periods
- Proactive succession risk analysis
- Knowledge Assistant (semantic document Q&A)

#### AI Data Boundaries

- AI never modifies records directly. All outputs require human review and action.
- AI context is always scoped to the authenticated company tenant. No cross-tenant data.
- AI outputs that represent a point-in-time record (`AnalysisSnapshot`/Health Brief, `MeetingSummary`) are stored and never overwrite source data. `AIInsight`/`SuggestedAction` are computed live from source data instead of stored — see the architectural decision above.
- Users can accept, dismiss, or ignore any AI-generated suggestion. Dismissed insights are hidden, not deleted (tracked via `dismissedInsightIds`, not a stored flag on the insight — there is no stored insight record to flag).
- LLM provider: Anthropic Claude (preferred) or configurable in Admin settings. Inert in v0.8 — no backend exists yet to actually call it.

#### Key Data Entities

`AIInsight` (computed live, not stored — see `DATA_MODEL.md` §16)  
`SuggestedAction` (computed live, not stored — see `DATA_MODEL.md` §17)  
`AnalysisSnapshot` (stored — the Company Health Brief)  
`AssistantQuery` (stored — simplified from the original 3-entity `AssistantSession → AssistantQuery → AssistantResponse` chain since there is no real conversational session to group, see `DATA_MODEL.md` §19)  
`MeetingSummary` (shared with Knowledge module)

---

### 5.9 Administration

**Purpose:** Governs the platform itself. Controls tenant configuration, access, integrations, and system-level oversight.

**Status:** Foundational elements in v0.1. Full build in v0.9.

#### Screens

| Screen | Access | Description |
|---|---|---|
| Company Settings | Owner, GM | Company profile: name, logo, timezone, locale, industry, company founding year. Subscription plan display (read-only) |
| User Management | Owner | Full user list with: name, email, role, status (active/invited/inactive), linked employee record. Actions: invite, edit role, deactivate, resend invite |
| User Invite Flow | Owner | Invite by email. System sends an invitation email with a time-limited accept link. On accept, the new user sets their password and is linked to their employee record |
| Permission Matrix | Owner | Visual grid of all system permissions × roles. Custom toggles per role. Changes apply immediately and are logged in the Audit Log |
| Notification Settings | Owner, GM | Company-wide notification defaults. Individual users can override in their personal profile settings |
| AI Settings | Owner, GM | LLM provider selection, AI feature toggles (enable/disable specific AI features), AI usage summary |
| Audit Log | Owner, GM | Append-only log of significant operations: record creates/updates/deletes, role assignments, login events, export events. Filter by user, action type, date range. Not deletable |

---

## 6. Role-Access Matrix

Access levels: **Full** (read + write + delete), **Edit** (read + write), **Read**, **Own** (own records only), **—** (no access).

### Dashboard

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Owner/Executive Dashboard | Full | Full | — | — |
| Manager Dashboard | Full | Full | Full | — |
| Employee Dashboard | Full | Full | Full | Full |

### Organization

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Organization Overview | Full | Full | Read | Read |
| Department List | Full | Full | Read | Read |
| Department Detail | Full | Full | Edit (own) | Read (own) |
| Employee Directory | Full | Full | Read | Read |
| Employee Profile | Full | Full | Edit (own dept) | Own |
| Org Chart View | Full | Full | Read | Read (names/titles only) |
| Reporting Line Editor | Full | Edit | — | — |

### Corporate Governance

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Role Profiles List | Full | Full | Edit (own dept) | — |
| Role Profile Detail | Full | Full | Edit (own dept) | Read (own) |
| Role Profile Editor | Full | Full | Edit (own dept) | — |
| Decision Rights Matrix | Full | Full | Read | — |
| Authority Matrix | Full | Read | — | — |
| Setup Health | Full | Read | — | — |

### Family Governance

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Family Council | Full | — | — | — |
| Ownership Register | Full | — | — | — |
| Family Charter | Full | — | — | — |
| Succession Plan | Full | Read | — | — |

### Meetings

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Schedule | Full | Full | Full | Own |
| Meeting Setup | Full | Full | Full | — |
| Meeting Templates | Full | Edit | — | — |
| Meeting Detail | Full | Full | Full | Own (participant) |
| Agenda Builder | Full | Full | Own (owner) | — |
| Decisions Log | Full | Full | Read | — |
| Action Items (filtered Task view) | Full | Full | Full | Own |
| Meeting History | Full | Full | Read | — |

### Execution

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| My Tasks | Full | Full | Full | Full |
| Team Board | Full | Full | Edit (own dept) | — |
| Task Detail | Full | Full | Edit (own dept) | Own |
| Recurring Task Setup | Full | Full | Edit (own dept) | — |
| Project Overview | Full | Full | Read | — |
| Project Detail | Full | Full | Edit | Own (assigned) |
| SOP Library | Full | Full | Edit | Read |
| SOP Detail | Full | Full | Edit | Read |
| Checklist Runner | Full | Full | Full | Full |

### Performance

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Company Overview | Full | Read | — | — |
| KPI Management | Full | Full | — | — |
| KPI Detail | Full | Full | Own dept | — |
| KPI Entry | Full | Full | Own dept | — |
| Department KPIs | Full | Full | Own dept | — |
| Goals | Full | Full | Read | — |
| Employee Scorecard | Full | Full | Own dept | Own |
| Trend Analysis | Full | Read | — | — |
| Reports | Full | Full | Own dept | — |

### Knowledge

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Documents | Full | Full | Edit | Read |
| Document Detail | Full | Full | Edit | Read |
| Policy Center | Full | Edit | Read | Read |
| Company Handbook | Full | Edit | Read | Read |
| Content Search | Full | Full | Full | Read |
| AI Meeting Summary | Full | Full | Own (meeting owner) | — |

### AI Advisor

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| AI Insights | Full | Read | — | — |
| Suggested Actions | Full | Full | Own dept | — |
| Executive Assistant | Full | Full | — | — |
| Company Health Brief | Full | Read | — | — |

### Administration

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Company Settings | Full | Edit | — | — |
| User Management | Full | — | — | — |
| User Invite Flow | Full | — | — | — |
| Permission Matrix | Full | — | — | — |
| Notification Settings | Full | Edit | — | — |
| AI Settings | Full | Edit | — | — |
| Audit Log | Full | Read | — | — |

---

## 7. Module Relationships

```
                 ┌────────────────────────────────────────────┐
                 │              ADMINISTRATION                 │
                 │  (users, roles, permissions, tenancy)       │
                 └──────────────────┬─────────────────────────┘
                                    │ governs access to all
                 ┌──────────────────▼─────────────────────────┐
                 │             ORGANIZATION                    │
                 │     (Company → Department → Employee)       │
                 └───┬─────────────┬──────────────────────────┘
                     │             │
        ┌────────────▼──────┐  ┌──▼──────────────────────────┐
        │    GOVERNANCE     │  │           MEETINGS           │
        │  ┌─ Corporate     │  │  (templates, occurrences,    │
        │  │  (authority,   │  │   decisions, action items)   │
        │  │   decisions)   │  └────────────┬─────────────────┘
        │  └─ Family        │               │ action items → tasks
        │     (council,     │  ┌────────────▼─────────────────┐
        │      charter,     │  │          EXECUTION           │
        │      ownership)   │  │  (tasks, projects, SOPs,     │
        └───────────────────┘  │   checklists, recurring)     │
                               └────────────┬─────────────────┘
                                            │ completion data
                               ┌────────────▼─────────────────┐
                               │         PERFORMANCE          │
                               │  (KPIs, goals, scorecards,   │
                               │   reports)                   │
                               └────────────┬─────────────────┘
                                            │
                    ┌───────────────────────▼─────────────────┐
                    │              KNOWLEDGE                   │
                    │  (documents, policies, handbook,         │
                    │   meeting summaries)                     │
                    └───────────────────────┬─────────────────┘
                                            │
                    ┌───────────────────────▼─────────────────┐
                    │            AI ADVISOR                    │
                    │  consumes structured data from all       │
                    │  modules, produces insights +            │
                    │  suggestions                             │
                    └─────────────────────────────────────────┘

Platform layer (under all modules):
   ┌─────────────────────────────────────────────────────────┐
   │  NOTIFICATIONS  │  GLOBAL SEARCH  │  AUDIT LOG          │
   └─────────────────────────────────────────────────────────┘
```

### Dependency Map

| Module | Depends On | Feeds Into |
|---|---|---|
| Organization | — (foundation) | All modules |
| Corporate Governance | Organization | Meetings, Execution, Knowledge, AI |
| Family Governance | Organization | AI (succession signals) |
| Meetings | Organization, Corporate Governance | Execution (tasks), Knowledge (summaries, policies) |
| Execution | Organization, Meetings | Performance (completion data), Knowledge (SOPs) |
| Performance | Organization, Execution | AI (KPI signals, scorecard data) |
| Knowledge | Governance, Meetings, Execution | AI (RAG context, post-v1.0) |
| AI Advisor | All modules (read-only) | Dashboard (insight widgets), Execution (suggested tasks) |
| Administration | — (platform layer) | All modules (access enforcement) |

---

## 8. Data Flow Architecture

### Primary Data Flows

#### Flow 1: Meeting → Execution
```
MeetingOccurrence
  └── Action item captured during meeting
        └── Task record created
              ├── source_type = 'meeting'
              ├── source_id = meeting_occurrence.id
              ├── assignee_employee_id = named action owner
              └── due_at = stated deadline
                    └── Notification sent to assignee
```

#### Flow 2: Meeting → Knowledge (Decision Promotion)
```
MeetingDecision recorded in Decisions Log
  └── Owner/GM clicks "Promote to Policy"
        └── Slide-over panel opens with pre-filled Policy form
              └── User reviews and publishes
                    └── Policy record created in Knowledge
                          ├── source_type = 'meeting_decision'
                          └── source_id = meeting_decision.id
```

#### Flow 3: Meeting → Knowledge (AI Summary)
```
MeetingOccurrence marked complete by organizer
  └── AI Meeting Summarizer triggered (LLM)
        └── Draft summary generated:
              ├── Key discussion points
              ├── Extracted decisions (linked to MeetingDecision records)
              └── Extracted action items (linked to Task records)
                    └── Organizer reviews and approves
                          └── MeetingSummary saved to meeting record
```

#### Flow 4: KPI → Notification → AI
```
KPIValue entered
  └── System evaluates against thresholds
        ├── Warning threshold crossed:
        │     └── KPIAlert created (warning severity)
        │           └── Notification sent to Owner + GM
        └── Critical threshold crossed:
              └── KPIAlert created (critical severity)
                    ├── Notification sent to Owner + GM
                    └── AIInsight record created (type = 'kpi_anomaly')
                          └── Appears in AI Insights feed
                                └── AI generates SuggestedAction
                                      └── User converts to Task (source_type = 'kpi')
```

#### Flow 5: Execution → Performance
```
Task records (status + timestamps)
  └── Aggregated by employee, department, period
        └── Metrics computed:
              ├── TaskCompletionRate → feeds EmployeeScorecard
              ├── OverdueRate → feeds DepartmentHealthSnapshot
              └── ActionItemClosureRate → feeds AI Execution Health signal
```

#### Flow 6: Governance → AI
```
Nightly governance analysis job (no LLM):
  ├── Counts employees with no published role profile
  ├── Counts senior roles with undefined decision rights
  ├── Checks succession plan coverage for key roles
  └── Creates AIInsight records (type = 'governance_gap') for each gap found
        └── Surfaces in AI Insights feed and Setup Health screen
```

---

## 9. AI Integration Plan

### Architecture Approach

- Structured signals (rule-based): no LLM required, activated from v0.6
- Language generation (LLM): activated from v0.7 (meeting summaries) and v0.8 (role profile drafter, executive assistant templates)
- Open-ended RAG (full conversational assistant): post-v1.0 only
- LLM provider: Anthropic Claude API (preferred). Provider is configurable in Admin AI Settings
- All AI outputs are traceable to source records
- All AI outputs require human review before being saved as permanent records
- No cross-tenant data in any AI context

### AI Activation by Version

| Version | AI Capability | Type |
|---|---|---|
| v0.6 | KPI threshold alerts | Rule-based |
| v0.6 | Governance gap signals | Rule-based |
| v0.6 | Execution health score per department | Rule-based |
| v0.6 | Meeting rhythm monitor | Rule-based |
| v0.7 | Meeting summarizer | LLM |
| v0.8 | Role Profile drafter (from title + department) | LLM |
| v0.8 | Executive Assistant (structured question templates) | LLM with structured context |
| v0.8 | Company Health Weekly Brief | LLM + structured data |
| v0.8 | Suggested Actions from risk signals | Rule-based + LLM for text |
| Post-v1.0 | Open-ended Executive Assistant (RAG) | LLM + vector retrieval |
| Post-v1.0 | Document Q&A | LLM + vector retrieval |
| Post-v1.0 | Strategic pattern detection | ML/statistical |

### AI Data Boundaries

- AI reads company data but never writes to source records directly
- LLM prompts never include data from another tenant
- AI outputs are stored in their own entity types and linked to source records by reference
- Users can dismiss an insight — dismissed insights are hidden, not deleted, for audit purposes
- AI feature usage is logged in the Audit Log

---

## 10. Cloud Architecture

This section defines the target production architecture for v0.9 and the v1.0 commercial launch.

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           CDN                                    │
│                   (static frontend assets)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    API Layer (REST)                               │
│             Node.js + Express (or equivalent)                    │
│      Authentication middleware | Tenant isolation middleware     │
│      Rate limiting middleware  | Request logging                 │
└──┬─────────────────┬────────────────┬──────────────────────────┘
   │                 │                │
┌──▼─────┐   ┌───────▼──────┐  ┌──────▼──────────┐
│  Auth  │   │  PostgreSQL  │  │  Object Storage  │
│Service │   │  primary DB  │  │  (S3-compatible) │
│(JWT +  │   │  row-level   │  │  documents,      │
│ OAuth) │   │  security    │  │  exports,        │
└────────┘   └───────┬──────┘  │  report files    │
                     │         └─────────────────-┘
             ┌───────▼──────┐  ┌──────────────────┐
             │    Redis     │  │   Job Queue       │
             │  sessions,   │  │  (BullMQ)        │
             │  rate limit, │  │  AI jobs,         │
             │  short cache │  │  email notifs,    │
             └──────────────┘  │  recurring tasks, │
                               │  report gen       │
                               └──────────────────┘
```

### Multi-Tenancy Model

- Every business entity carries `company_id` as a foreign key
- API middleware validates on every request that the authenticated user's `company_id` matches the resource
- PostgreSQL row-level security as a defense-in-depth layer
- AI context constructed per-request using only records scoped to the authenticated company

### Authentication Roadmap

| Phase | Mechanism |
|---|---|
| v0.1–v0.8 | Local email/password, bcrypt hashing |
| v0.9 | JWT access tokens + refresh token rotation |
| v0.9 | Google OAuth |
| v0.9 | Email invitation flow (invite → accept → set password) |
| Post-v1.0 | Microsoft SSO, SAML (enterprise tier) |

### Data Persistence

| Data Type | Storage |
|---|---|
| All business entities | PostgreSQL (normalized, relational) |
| User sessions | Redis (TTL-based) |
| Documents and file uploads | Object storage |
| AI analysis snapshots | PostgreSQL (append-only) |
| AI conversation sessions | PostgreSQL (append-only) |
| Audit logs | PostgreSQL (append-only, never deletable) |
| Email notification queue | Redis (job queue) |

### Environments

| Environment | Purpose |
|---|---|
| `local` | Developer machines, localStorage prototype |
| `staging` | Pre-production validation, real backend, seeded demo company |
| `production` | Customer-facing, isolated from staging data |

### Backup and Recovery

- Automated daily PostgreSQL snapshots, 30-day retention
- Point-in-time recovery enabled
- Object storage with versioning enabled
- Audit logs are append-only and never purged

### Performance Targets (v1.0)

| Metric | Target |
|---|---|
| API p95 response time | < 300ms |
| Dashboard initial load | < 1.5s |
| Search results latency | < 200ms |
| Uptime SLA | 99.5% |
| Concurrent users per tenant | 50 (initial) |

---

## 11. Sprint Roadmap

Released: v0.1 (Foundation), v0.2 (Organization).  
Roadmap below: v0.3 through v1.0.

---

### v0.3 — Governance

**Goal:** Make authority and responsibility explicit. Introduce the family governance layer as a core differentiator.

| Sprint | Deliverable |
|---|---|
| 0.3.1 | Rename Position Cards → Role Profiles across the product |
| 0.3.2 | Role Profiles: version history, draft/active/archived states, improved editor |
| 0.3.3 | Duties and Collaborations as structured child records |
| 0.3.4 | Decision Rights Matrix screen |
| 0.3.5 | Authority Matrix screen |
| 0.3.6 | Setup Health screen + Governance Completeness Score |
| 0.3.7 | Family Governance: Family Council screen (members, cadence) |
| 0.3.8 | Family Governance: Ownership Register screen |
| 0.3.9 | Family Governance: Family Charter screen (structured text) |
| 0.3.10 | Succession Plan screen (Owner: edit; GM: view) |
| 0.3.11 | Platform: Notification Center (bell icon, in-app feed) — stub implementation with system notifications only |
| 0.3.12 | Regression testing + v0.3.0 commit |

---

### v0.4 — Meetings

**Goal:** Transform meetings into operational control points with full lifecycle and clear outcomes.

| Sprint | Deliverable | Status |
|---|---|---|
| 0.4.1 | Simplify meeting hierarchy: MeetingTemplate → MeetingOccurrence (remove MeetingType entity) | ✅ Delivered |
| 0.4.2 | Meeting Templates screen: category field, default participants, duration | ✅ Delivered |
| 0.4.3 | Meeting Setup: create occurrence from template or scratch, cadence field | ✅ Delivered (cadence is implied by template linkage rather than a separate field) |
| 0.4.4 | Meeting Detail: agenda editor, notes area, participant list | ✅ Delivered |
| 0.4.5 | Decision Recorder: inline decision capture during/after a meeting | ✅ Delivered |
| 0.4.6 | Meeting → Task bridge: action items create Task records (source_type = 'meeting') | ✅ Delivered (via extended `todos`, not a renamed `tasks` entity — rename deferred to v0.5 Execution) |
| 0.4.7 | Action Items screen: filtered Task view (source_type = 'meeting') — links to Execution module | ✅ Delivered |
| 0.4.8 | Decisions Log: searchable registry, "Promote to Policy" action stub (Knowledge not yet built) | ⚠️ Delivered with reduced scope — role-scoped list view; free-text search and department/date-range filters trimmed for v0.4. "Promote to Policy" is a disabled stub as specified |
| 0.4.9 | Meeting History: timeline with attendance, decision count, action item closure rate | ✅ Delivered |
| 0.4.10 | Notification events: meeting reminders, action item assignment | ❌ Deferred — the Notification Center (0.3.11) does not yet exist in the codebase to hook into; revisit once it's built |
| 0.4.11 | Regression testing + v0.4.0 commit | ✅ Delivered |

---

### v0.5 — Execution

**Goal:** Turn `state.todos` into a real Task entity and give every role a scoped place to
track work. This sprint was deliberately trimmed from the original table below — Projects,
SOPs, Checklists, the Workflow Builder, Recurring Task Setup, and comments/@mentions are
explicitly deferred (not silently dropped) to keep the sprint scope-boxed per
`ENGINEERING_GUIDE.md` §5. The actual delivered sprint plan:

| Sprint | Deliverable | Status |
|---|---|---|
| 0.5.1 | State schema: rename `todos` → `tasks`, status remap (`scheduled`/`pending` → `todo`, `done` stays `done`), add `priority`/`description`/`createdAt`; migration in `loadState()` | ✅ Delivered |
| 0.5.2 | Rename sweep across `dashboard.js`, `employees.js`, `meetings.js`, `app.js` | ✅ Delivered |
| 0.5.3 | `helpers.js`: `validateTaskPayload`, extended `statusLabel`/`statusTagClass`, `priorityLabel`/`priorityTagClass`, `taskDueDisplay` rename | ✅ Delivered |
| 0.5.4 | My Tasks screen + Task Setup modal (create/edit) | ✅ Delivered |
| 0.5.5 | Task Detail screen (view/edit/delete, source badge, link back to originating meeting) | ✅ Delivered |
| 0.5.6 | Team Tasks (Manager, dept-scoped) + All Tasks (Owner) — grouped-by-status lists, no Kanban grid, no drag-and-drop | ✅ Delivered |
| 0.5.7 | Nav/dispatch wiring (`app.js`, `index.html`) | ✅ Delivered |
| 0.5.8 | i18n sweep + removal of orphaned `status_pending`/`status_scheduled` keys | ✅ Delivered |
| 0.5.9 | Docs: `DATA_MODEL.md`, this table, `CLAUDE.md` roadmap row | ✅ Delivered |
| 0.5.10 | Full regression pass (browser-driven) + `v0.5.0` commit | ✅ Delivered |

**Explicitly deferred from the original v0.5 scope below** (not built, not stubbed):

| Original item | Reason deferred |
|---|---|
| Task board filter/sort/group-by toggle UI | Fixed group-by-status view shipped instead; toggle UI trimmed per "do not over-engineer" |
| Comments thread with @mention, status history timeline | Explicitly excluded by sprint scope — no `TaskComment` entity, no audit trail beyond current state |
| Recurring Task Setup | `source_type` reserves a `recurring` enum value with no producing logic; no cadence engine built |
| @mention → notification | Depends on both comments (not built) and the Notification Center (never built — see v0.4's audit note) |
| Project model, Project Overview/Detail | Not started; `source_type` does not yet reserve a `project` value since it wasn't part of this sprint's requirements |
| SOP Library, Checklist Runner | Explicitly excluded per this sprint's instructions |
| Notification events (task overdue, task assigned) | Same Notification Center dependency as v0.4's 0.4.10 |

---

### v0.6 — Performance

**Goal:** Give leadership a data-driven view of business health, with the first AI signals activated. Delivered as a functional-first sprint — no charts, no PDF export, no advanced visual design (per sprint instructions). The actual delivered sprint plan:

| Sprint | Deliverable | Status |
|---|---|---|
| 0.6.1 | State schema: `kpiDefinitions`, `kpiValues` + seed data; `loadState()` backfill; `kpiStatus()`, `validateKpiDefinitionPayload` in `helpers.js` | ✅ Delivered |
| 0.6.2 | KPI Management screen (create/edit/archive definitions, Owner only) | ✅ Delivered |
| 0.6.3 | KPI Detail + KPI Entry (historical values table, manual entry form, Owner/Manager own-dept) | ✅ Delivered |
| 0.6.4 | Department KPIs screen (grid, dept-scoped for Manager) | ✅ Delivered |
| 0.6.5 | State schema: `goals` + seed data; `validateGoalPayload`; Goals screen (create, check-ins, status) | ✅ Delivered |
| 0.6.6 | `helpers.js`: `taskCompletionRate()`, `meetingAttendanceRate()`, `departmentKpiOnTrackRate()`, `departmentHealthScore()` | ✅ Delivered |
| 0.6.7 | Company Overview screen (KPI status grid + goal summary + department health tiles + governance-gap reuse) | ✅ Delivered |
| 0.6.8 | State schema: `scorecards` + seed data; Scorecard workflow (Manager review flow + Employee self-assessment, collapsed single-screen entry point) | ✅ Delivered |
| 0.6.9 | Trend Analysis (data table, no chart) + Reports (CSV export only) | ✅ Delivered |
| 0.6.10 | KPI threshold alert: new `KPIAlert` record on warning/critical value entry, surfaced as a "Recent Alerts" list on Company Overview — no real notification (Notification Center doesn't exist) | ✅ Delivered (badge only, per decision) |
| 0.6.11 | Settings: scorecard review-cycle frequency field (monthly/quarterly/annual) | ✅ Delivered |
| 0.6.12 | Nav/dispatch wiring (`app.js`, `index.html`), including Employee's collapsed single-scorecard entry point | ✅ Delivered |
| 0.6.13 | Docs: `DATA_MODEL.md` (new Goal/Scorecard sections + attendance-approximation note), this table, `CLAUDE.md` roadmap row | ✅ Delivered |
| 0.6.14 | Full regression pass (browser-driven) + `v0.6.0` commit | ✅ Delivered |

**Explicitly deferred from the original v0.6 scope above** (not built, not stubbed):

| Original item | Reason deferred |
|---|---|
| PDF export | No external libraries allowed; generating real PDF bytes in vanilla JS is impractical. CSV export ships instead (plain `Blob` + `<a download>`, no library) |
| Multi-KPI chart (Trend Analysis) | No external charting library allowed; a data table ships instead, matching the "do not over-engineer" precedent from v0.4/v0.5's grouped-list decisions |
| Meeting Rhythm Monitor | `meetingTemplates.freq` is free text, not a structured cadence — building this properly needs a Meetings-module data model change, out of scope for a Performance sprint |
| Real meeting attendance-taking | No attendance feature exists in Meetings; Scorecard's attendance rate is a documented approximation (invited + meeting completed = attended) |
| Real in-app/email notifications (KPI alerts, scorecard sharing) | Same Notification Center dependency as v0.4's 0.4.10 and v0.5's deferred notification events |
| Employee-level KPI assignment | Not asked for by any v0.6 screen; would be speculative scope |

---

### v0.7 — Knowledge

**Goal:** Give the company a structured home for institutional knowledge and activate the first AI-adjacent feature. Delivered with three scope adaptations to the constraints of a backend-less prototype (see notes below the table) — not silently dropped, tracked the same way as v0.4–v0.6's deferrals. The actual delivered sprint plan:

| Sprint | Deliverable | Status |
|---|---|---|
| 0.7.1 | State schema: `documents`, `policies`, `handbookSections`, `meetingSummaries` + seed data; `loadState()` backfill | ✅ Delivered |
| 0.7.2 | `helpers.js`: validation functions, category/status label + tag-class helpers, `knowledgeSearchResults()` | ✅ Delivered |
| 0.7.3 | Documents: create, tag (category/department), organize, version history, detail view, `.txt` download | ✅ Delivered with reduced scope — no binary file upload (see note below), structured text records instead |
| 0.7.4 | Policy Center: create, edit, publish, archive, version history; `family` category visible to Owner (`patron`) only | ✅ Delivered |
| 0.7.5 | "Promote to Policy" flow: complete the stub from v0.4.8 | ✅ Delivered |
| 0.7.6 | Company Handbook: 5 fixed sections, read for all roles, inline edit for Owner/GM (`patron`/`mudur`) | ✅ Delivered |
| 0.7.7 | Content Search: full-text (substring) search within Documents/Policies/Handbook, role-filtered | ✅ Delivered |
| 0.7.8 | AI Meeting Summarizer: rule-based draft generation on demand, review/approve flow | ✅ Delivered with reduced scope — no LLM integration (see note below), deterministic generation from existing meeting data instead |
| 0.7.9 | Nav/dispatch wiring (`app.js`, `index.html`), i18n sweep (tr + en) | ✅ Delivered |
| 0.7.10 | Docs: `DATA_MODEL.md`, this table, `CLAUDE.md` roadmap row | ✅ Delivered |
| 0.7.11 | Full regression pass (browser-driven) + `v0.7.0` commit | ✅ Delivered |

**Explicitly deferred from the original v0.7 scope above** (not built, not stubbed):

| Original item | Reason deferred |
|---|---|
| Real file upload / binary document storage | No object storage until v0.9; storing file blobs in `localStorage` risks quota errors and violates the "keep state lean" Engineering Guide rule. Documents ship as structured text records with `.txt` export instead |
| Real LLM-generated meeting summaries | No backend/API integration point exists in the prototype — nowhere to safely hold a provider key or make a server call. A rule-based generator ships instead, disclosed to the user as such |
| Platform: Global Search (Cmd+K), searches all modules | Genuinely cross-cutting across Organization, Governance, Meetings, Execution, and Knowledge data — the kind of two-modules-in-one-sprint change the Engineering Guide's sprint rule warns against. Deferred to v0.8 (or a dedicated platform sprint). Knowledge's own module-scoped Content Search ships instead, satisfying the Knowledge module's own actual need |

---

### v0.8 — AI

**Goal:** Surface structured intelligence from operating data. Delivered entirely rule-based — no LLM integration point exists in this backend-less prototype (same constraint the v0.7 Meeting Summarizer hit). The actual delivered sprint plan:

| Sprint | Deliverable | Status |
|---|---|---|
| 0.8.1 | State schema: `dismissedInsightIds`, `healthBriefs`, `assistantQueries`, `aiSettings` + seed data; `loadState()` backfill | ✅ Delivered |
| 0.8.2 | `helpers.js`: overdue detection, governance-gap/scorecard-completion helpers, `computeAIInsights()` — consumes existing `roleCards`/`kpiAlerts`/`tasks`/`scorecards`, not stored (see `DATA_MODEL.md` §16) | ✅ Delivered |
| 0.8.3 | AI Insights screen: unified feed, All/Critical/Warning filter tabs | ✅ Delivered with reduced scope — see note below |
| 0.8.4 | Suggested Actions: per-insight-type recommended action (specific title + assignee, not a generic prompt), convert to Task with one click, activating the `kpi`/`governance` `source_type` enum values reserved since v0.5 | ✅ Delivered |
| 0.8.5 | AI Role Profile Drafter: rule-based "Draft with AI" button in the Role Profile editor | ✅ Delivered with reduced scope — see note below |
| 0.8.6 | Executive Assistant: 14-question rule-based template library (expanded from the original 5-question sketch), dept-scoped for GM, logged to `assistantQueries` | ✅ Delivered |
| 0.8.7 | Company Health Brief: on-demand generation with Executive Summary, Biggest Risk, Biggest Improvement, Suggested Priorities, Improved, Declined, Top Open Items | ✅ Delivered with reduced scope — see note below |
| 0.8.8 | AI Settings: feature toggles (fully functional) + LLM provider selector (visible, disabled, labeled "Available in v0.9") | ✅ Delivered |
| 0.8.9 | AI Advisor dashboard widget: critical-insight count + open-recommendation count, reusing `computeAIInsights()` — no separate computation | ✅ Delivered |
| 0.8.10 | Nav/dispatch wiring (`app.js`, `index.html`), i18n sweep (tr + en) | ✅ Delivered |
| 0.8.11 | Docs: `DATA_MODEL.md` (new §16–20), this table, `CLAUDE.md` roadmap row | ✅ Delivered |
| 0.8.12 | Full regression pass (browser-driven) + `v0.8.0` commit | ✅ Delivered |

**Explicitly deferred from the original v0.8 scope above** (not built, not stubbed):

| Original item | Reason deferred |
|---|---|
| LLM-generated role profile drafts | No backend/API integration point exists — same gap as v0.7's Meeting Summarizer. Rule-based drafter ships instead |
| "Risks / Recommendations / Trends" tabs on AI Insights | None of the four structured signals produce a genuine "trend," and recommendations already live on the Suggested Actions screen — an All/Critical/Warning severity filter ships instead, reflecting what the data actually supports |
| Automatic weekly Company Health Brief (scheduled + emailed every Monday) | No background job runner in a browser-only prototype. On-demand generation via a "Regenerate" button ships instead |
| Real email notifications (weekly digest, overdue summaries, meeting reminders) | Hard technical impossibility in a client-only prototype — no backend, no SMTP. Not a scope choice, not stubbed |
| Notification preferences (per-user in-app/email toggles) | Depends on the in-app Notification Center, deferred every sprint since v0.3.11 for the same reason (v0.4.10, v0.5, v0.6.10, and now v0.8). Recommend its own dedicated platform sprint before or alongside v0.9 |
| Meeting Rhythm structured signal | `meetingTemplates.freq` is still free text, unchanged blocker identified in the v0.6 audit |

---

### v0.9 — Cloud

**Goal:** Move from a browser-only prototype to a production-grade multi-tenant SaaS backend.

| Sprint | Deliverable |
|---|---|
| 0.9.1 | PostgreSQL schema: all entities from the normalized data model |
| 0.9.2 | Backend API: REST endpoints for all core entities |
| 0.9.3 | Authentication: JWT access + refresh tokens, bcrypt passwords |
| 0.9.4 | Google OAuth integration |
| 0.9.5 | User Invite flow: send invite email, accept invite screen, link to employee |
| 0.9.6 | Multi-tenancy middleware: company_id isolation on all API routes |
| 0.9.7 | Row-level security on PostgreSQL |
| 0.9.8 | Object storage: document upload and retrieval |
| 0.9.9 | Job queue: email notifications, AI background jobs, recurring task generation |
| 0.9.10 | Data migration: export localStorage data → import to backend API |
| 0.9.11 | Audit log: append-only, API-backed |
| 0.9.12 | Data export: company data as JSON and CSV |
| 0.9.13 | Staging environment: deploy all modules with seeded demo company |
| 0.9.14 | Smoke test suite across all modules on staging |
| 0.9.15 | Regression testing + v0.9.0 commit |

---

### v1.0 — Release

**Goal:** Commercial-grade quality, onboarding, and go-to-market readiness.

| Sprint | Deliverable |
|---|---|
| 1.0.1 | Onboarding wizard: new company setup flow — org structure, first employees, first meeting template, first role profile |
| 1.0.2 | Empty state design: actionable empty states for every module |
| 1.0.3 | Security audit: input validation, auth hardening, rate limiting, OWASP top 10 review |
| 1.0.4 | Performance optimization: query indexing, API caching, frontend bundle |
| 1.0.5 | Mobile-responsive polish: all critical screens validated on tablet and mobile |
| 1.0.6 | Localization: full Turkish and English across all modules |
| 1.0.7 | Subscription plan display: trial state, plan tier indicator, upgrade prompt |
| 1.0.8 | User acceptance testing: structured test with real family business users |
| 1.0.9 | User-facing help content for all modules |
| 1.0.10 | Final regression testing across all modules |
| 1.0.11 | Production deployment + v1.0.0 release commit |

---

## 12. Post-v1.0 Backlog

These features were considered for v1.0 and deliberately deferred. They are not abandoned — they are sequenced after the core platform is proven and the user base is established.

| Feature | Reason Deferred | Target |
|---|---|---|
| Workflow Builder (visual BPM) | Over-engineered for target audience; recurring tasks solve the real need | v1.2 |
| Open-ended RAG Executive Assistant | Requires mature data + vector infrastructure not justified pre-launch | v1.1 |
| Full OKR framework | Replaced by Goals; OKRs are appropriate for a subset of customers | v1.2 |
| Microsoft SSO / SAML | Enterprise-tier feature; not needed for initial market segment | v1.3 |
| Full billing infrastructure | Stripe, dunning, invoice management — beyond MVP billing hooks | v1.1 |
| Third-party integration API (webhooks, API keys) | No established integration demand to drive design | v1.2 |
| KVKK / GDPR compliance tooling | Data subject requests, DPA, retention policies | v1.1 |
| Document version diffing UI | History list is sufficient; diff viewer adds complexity | v1.2 |
| Knowledge Assistant (document Q&A, semantic search) | Requires vector embeddings infrastructure | v1.1 |
| Strategic pattern detection (ML-based) | Requires historical data depth not available at launch | v2.0 |
| Multi-company advisor view (Veliaht Akademi integration) | Cross-tenant features require separate architecture decisions | v2.0 |

---

## Appendix: Changes from Blueprint v1.0

| Area | v1.0 | v2.0 | Reason |
|---|---|---|---|
| Governance | Corporate only | Corporate + Family | Family governance is the core differentiator |
| Position Cards | Name | Renamed to Role Profiles | More intuitive product language |
| "Governance Gap Review" | Screen name | Renamed to Setup Health | Actionable, not consulting-language |
| Meeting hierarchy | 3 levels (Type + Template + Occurrence) | 2 levels (Template + Occurrence) | Type becomes a category field; one entity removed |
| OKR Dashboard | Full OKR system | Replaced by Goals | More appropriate for SMB family businesses |
| Workflow Builder | v0.5 | Post-v1.0 | Over-engineered; recurring tasks solve the real need |
| AI activation | v0.8 only | Structured signals v0.6, LLM v0.7, AI module v0.8 | Earlier signals = better v1.0 quality |
| AI Insights + Risk Center | Two separate screens | One unified AI Insights screen with tabs | Reduced duplication |
| Action Items | Separate screen/concept | Filtered Task view (source_type = 'meeting') | Resolved data model duplication |
| Search | Knowledge module only | Global Search (Cmd+K) + Knowledge Content Search | Search must be platform-wide |
| Notifications | Not designed | Platform-level system with in-app + email | Essential for adoption |
| Reports | Not present | Reports screen in Performance | Real user workflow |
| Employee Scorecard | Dashboard widget | Defined review process with roles and cycle | Avoids political and design harm |
| Dashboard | Static widget list | Progressive disclosure by module activation | Prevents empty dashboard at early versions |
| Post-v1.0 backlog | Not defined | Explicit deferred feature list with reasons | Reduces scope ambiguity |
