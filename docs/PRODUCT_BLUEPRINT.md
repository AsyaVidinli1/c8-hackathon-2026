# Veliaht OS — Product Blueprint v1.0

**Document type:** Master Product Specification  
**Status:** Living document — update at every major version milestone  
**Scope:** Complete product architecture from v0.3 through v1.0 commercial release

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Roles](#2-user-roles)
3. [Left Navigation Structure](#3-left-navigation-structure)
4. [Module Specifications](#4-module-specifications)
   - 4.1 Dashboard
   - 4.2 Organization
   - 4.3 Governance
   - 4.4 Meetings
   - 4.5 Execution
   - 4.6 Performance
   - 4.7 Knowledge
   - 4.8 AI Advisor
   - 4.9 Administration
5. [Role-Access Matrix](#5-role-access-matrix)
6. [Module Relationships](#6-module-relationships)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [AI Integration Plan](#8-ai-integration-plan)
9. [Cloud Architecture](#9-cloud-architecture)
10. [Sprint Roadmap v0.3 → v1.0](#10-sprint-roadmap)

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

### Design Philosophy

> A family business should be able to run with the same discipline as a professionally managed company — without losing the human relationships that make it a family business.

Every screen and feature must serve one of these six outcomes:

| Outcome | Driver Module |
|---|---|
| Who is responsible for what | Organization + Governance |
| Who can decide what | Governance |
| How decisions get made | Meetings |
| Whether work is getting done | Execution |
| Whether the business is healthy | Performance |
| How knowledge is preserved and shared | Knowledge |

---

## 2. User Roles

Veliaht OS defines four business-level roles. These map to real positions inside a family business, not abstract permission tiers.

---

### Owner

The family business owner, principal shareholder, or founding family patriarch/matriarch.

**Scope:** Full visibility and control across the entire platform.  
**Distinguishing access:** Succession planning, ownership structure, strategic KPI views, all governance records, user management.  
**Typical concerns:** Is the business working without me? Are the right people in the right roles? Is governance being respected?

---

### General Manager

The appointed executive responsible for day-to-day operations. May or may not be a family member.

**Scope:** Full operational access. Restricted from ownership, succession, and user management by default.  
**Distinguishing access:** Company-wide execution oversight, all department dashboards, meeting facilitation, KPI entry and review, AI insights.  
**Typical concerns:** Are all departments executing? Where are the bottlenecks? Which meetings need follow-up?

---

### Manager

A department head or team leader. Has deep access within their department and read access to cross-functional information they need to collaborate effectively.

**Scope:** Department-level read/write, company-level read for shared resources.  
**Distinguishing access:** Their department's employees, tasks, meetings, KPIs, position cards.  
**Typical concerns:** Is my team clear on responsibilities? Are tasks being completed? What does my department KPI look like this month?

---

### Employee

A frontline staff member or individual contributor. Access is narrowed to their own work and the shared resources relevant to their role.

**Scope:** Personal tasks, their own profile and position card (read), meetings they participate in, knowledge base (read).  
**Typical concerns:** What are my tasks today? When is my next meeting? Where do I find the SOP for this process?

---

### Role Comparison Summary

| Capability | Owner | General Manager | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| View all departments | ✓ | ✓ | ✓ | read |
| Edit org structure | ✓ | ✓ | — | — |
| View all position cards | ✓ | ✓ | own dept | own card |
| Edit position cards | ✓ | ✓ | own dept | — |
| View authority matrix | ✓ | ✓ | read | — |
| Succession planning | ✓ | — | — | — |
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

## 3. Left Navigation Structure

The sidebar navigation is fixed and role-aware. Items not accessible to the current role are hidden, not disabled.

```
┌─────────────────────────────┐
│  [Company Logo / Name]      │
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
│     Position Cards          │
│     Authority Matrix        │
│     Decision Rights         │
│     Succession Planning     │
│     Governance Gaps         │
├─────────────────────────────┤
│  ▾ Meetings                 │
│     Schedule                │
│     Meeting Types           │
│     Decisions Log           │
│     Action Items            │
│     Meeting History         │
├─────────────────────────────┤
│  ▾ Execution                │
│     My Tasks                │
│     Team Board              │
│     Projects                │
│     SOPs                    │
│     Workflows               │
├─────────────────────────────┤
│  ▾ Performance              │
│     Company Dashboard       │
│     Department KPIs         │
│     OKR Dashboard           │
│     Employee Scorecards     │
│     Trend Analysis          │
├─────────────────────────────┤
│  ▾ Knowledge                │
│     Document Library        │
│     Policy Center           │
│     Template Library        │
│     Company Handbook        │
├─────────────────────────────┤
│  ◈  AI Advisor              │
├─────────────────────────────┤
│  ⚙  Settings                │
└─────────────────────────────┘
```

Navigation collapses to icon-only mode on narrow viewports. Active module section stays expanded. Role-restricted sections are not rendered.

---

## 4. Module Specifications

---

### 4.1 Dashboard

**Purpose:** A role-adapted command center. Each role sees a different composition of the same business data.

**Status:** Released (v0.1)

#### Screens

| Screen | Description |
|---|---|
| Owner Dashboard | Company health summary: KPI status, meeting cadence health, execution rate, governance completeness, AI risk signals |
| Executive Dashboard | Operational overview: team task status, upcoming meetings, open decisions, department KPI snapshots |
| Manager Dashboard | Department view: team task board summary, upcoming meetings, open action items, department KPI |
| Employee Dashboard | Personal view: my tasks today, upcoming meetings, recent announcements |

#### Key Widgets (all dashboards)

- Tasks due today / overdue count
- Upcoming meetings this week
- Open action items (unresolved from meetings)
- KPI status snapshot (role-scoped)
- Governance completeness indicator (Owner/GM only)
- AI alert banner (Owner/GM only)

---

### 4.2 Organization

**Purpose:** Defines the structural map of the business. Foundation for all other modules.

**Status:** Released (v0.2)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Organization Overview | All roles | Summary card: total employees, departments, open roles, org completeness score |
| Department List | All roles | Paginated list of all departments with manager, headcount, status |
| Department Detail | All roles | Individual department: description, manager, member list, linked meetings and KPIs |
| Employee Directory | All roles | Searchable, filterable list of all employees with status and department |
| Employee Profile | All roles (own-scoped for Employees) | Full profile: contact info, department, reporting line, position card summary, task history, meeting participation |
| Org Chart View | All roles | Visual hierarchy of the company. Zoomable. Clickable nodes open Employee Profile |
| Reporting Line Editor | Owner, GM | Drag-and-drop or dropdown interface to edit manager-employee relationships |

#### Key Data Entities

`Company` → `Department` → `Employee` → `UserAccount`  
`Employee` → `ReportingRelationship` (self-referential)

---

### 4.3 Governance

**Purpose:** Defines authority, accountability, and decision rights. Turns informal management into a structured system.

**Status:** Planned (v0.3)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Position Cards List | Owner, GM, Manager (own dept) | All role cards with status indicator: draft, active, needs update. Filterable by department |
| Position Card Detail | Owner, GM, Manager (own), Employee (own, read) | Full role card: role summary, duties list, collaboration list, decision scope, approval scope, version history |
| Position Card Editor | Owner, GM, Manager (own dept) | Inline editor for duties, collaborations, decision and approval scopes. Auto-saves drafts |
| Authority Matrix | Owner, GM | Cross-departmental view of who holds authority over what domain |
| Decision Rights Matrix | Owner, GM, Manager (read) | Table mapping decision types to roles: who decides alone, who advises, who must approve |
| Succession Planning | Owner only | Leadership depth map: which roles have named successors, readiness ratings, gap alerts |
| Governance Gap Review | Owner, GM | Auto-generated list of structural issues: missing position cards, undefined decision rights, roles with no clear owner |

#### Key Data Entities

`PositionCard` → `PositionCardDuty` → `PositionCardCollaboration`  
`AuthorityRule` → `DecisionRight` → `SuccessionRecord`

#### Governance Health Score

The system automatically calculates a **Governance Completeness Score** (0–100%) based on:
- % of employees with active position cards
- % of departments with defined decision rights
- % of senior roles with named successors
- Number of open governance gaps

This score surfaces on the Owner and GM dashboards.

---

### 4.4 Meetings

**Purpose:** Creates management rhythm. Transforms meetings from passive calendar events into structured operational control points.

**Status:** Planned (v0.4)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Meeting Schedule | Owner, GM, Manager, Employee (own meetings) | Calendar + list hybrid view of all upcoming meetings. Filter by type, department, participant |
| Meeting Types | Owner, GM | Define and manage meeting templates: weekly review, board meeting, one-on-one, performance review |
| Meeting Setup | Owner, GM, Manager | Create a meeting occurrence from a template or from scratch. Set participants, cadence, owner |
| Meeting Detail | Owner, GM, Manager, Employee (participants) | Live meeting view: agenda, notes editor, participants, status tracker |
| Agenda Builder | Owner, GM, Manager (owner) | Drag-and-drop agenda items before and during meetings. Time estimates per item |
| Decision Recorder | Owner, GM, Manager (owner) | Inline decision capture during a meeting. Each decision gets a record with owner and date |
| Action Item Tracker | All roles | Open action items from all past meetings. Filter by owner, status, meeting. Links to Execution tasks |
| Decisions Log | Owner, GM, Manager | Searchable registry of all decisions made across all meetings and departments |
| Meeting History | Owner, GM, Manager | Timeline view of past meetings with attendance, decisions made, and action items created |

#### Key Data Entities

`MeetingType` → `MeetingTemplate` → `MeetingOccurrence`  
`MeetingOccurrence` → `MeetingParticipant` (many-to-many with Employee)  
`MeetingOccurrence` → `AgendaItem`  
`MeetingOccurrence` → `MeetingDecision`  
`MeetingOccurrence` → `MeetingActionItem` → links to `Task`

#### Meeting → Execution Bridge

Every action item created in a meeting automatically creates a linked `Task` record in the Execution module, with `source_type = 'meeting'` and `source_id = meeting_occurrence.id`. This is the primary data flow between Meetings and Execution.

---

### 4.5 Execution

**Purpose:** Turns governance structure and meeting decisions into day-to-day operational movement.

**Status:** Planned (v0.5)

#### Screens

| Screen | Access | Description |
|---|---|---|
| My Tasks | All roles | Personal task list filtered to the logged-in user. Group by status, priority, or due date |
| Team Board | Owner, GM, Manager | Kanban-style board showing team task status. Manager sees own dept; GM sees all |
| Task Detail | All roles (assigned + creator) | Full task view: description, assignee, due date, comments, status history, source reference (meeting/KPI/manual) |
| Project Overview | Owner, GM, Manager | List of all active projects with completion percentage, owner, department, and milestone status |
| Project Detail | Owner, GM, Manager, Employee (assigned) | Milestones, linked tasks, project timeline, participants |
| SOP Library | All roles (Employees: read) | Indexed list of standard operating procedures by department and process type. Version history shown |
| SOP Detail | All roles | Step-by-step procedure view. Owner/GM/Manager can edit; Employees read and run checklists |
| Checklist Runner | All roles | Interactive checklist execution view for running an SOP step-by-step. Captures completion timestamps |
| Workflow Builder | Owner, GM | Visual step-based workflow designer. Define triggers, steps, assignees, and conditions |
| Workflow History | Owner, GM, Manager | Log of all workflow executions with step-by-step completion status |

#### Key Data Entities

`Task` → `TaskComment`  
`Project` → `ProjectMilestone` → `Task`  
`SOP` → `SOPStep`  
`Checklist` → `ChecklistRun`  
`Workflow` → `WorkflowStep` → `WorkflowExecution`

#### Task Source Tracking

All tasks carry `source_type` and `source_id` fields. Valid source types:

| Source Type | Origin |
|---|---|
| `manual` | Created directly by a user |
| `meeting` | Created from a meeting action item |
| `kpi` | Triggered by a KPI warning or critical threshold breach |
| `recurring` | Generated by a workflow on a schedule |
| `workflow` | Created as a step in a workflow execution |

---

### 4.6 Performance

**Purpose:** Measures whether the organization is healthy and whether execution is producing expected outcomes. Creates early visibility into operational breakdowns.

**Status:** Planned (v0.6)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Company Performance Dashboard | Owner, GM | Top-level health view: company-wide KPI status grid, executive OKR summary, trend indicators |
| KPI Management | Owner, GM | Create, edit, and deactivate KPI definitions. Set targets, warning thresholds, and measurement frequency |
| KPI Detail | Owner, GM, Manager (own dept KPIs) | Historical value chart, trend line, target vs actual, notes timeline |
| KPI Entry | Owner, GM, Manager (own dept) | Manual data entry form for periodic KPI values. Supports bulk entry |
| Department KPI Dashboard | Owner, GM, Manager (own dept) | Department-scoped KPI status grid with comparison to prior period |
| OKR Dashboard | Owner, GM, Manager | Company-level and department-level Objectives and Key Results. Progress bars and check-in history |
| Employee Scorecard | Owner, GM, Manager (own dept), Employee (own) | Individual performance view: assigned KPIs, task completion rate, meeting attendance, scorecard notes |
| Trend Analysis | Owner, GM | Multi-KPI trend view. Cross-filter by department, time range, or KPI category |

#### Key Data Entities

`KPIDefinition` → `KPIValue`  
`Objective` → `KeyResult` → `KeyResultCheckIn`  
`EmployeeScorecard` → `ScorecardEntry`  
`DepartmentHealthSnapshot`

#### KPI → AI Bridge

When a KPI value is entered and crosses a warning or critical threshold, the system automatically generates a `RiskSignal` in the AI module. This signal appears in the AI Advisor and optionally triggers a suggested action or task.

---

### 4.7 Knowledge

**Purpose:** Preserves how the company operates and makes that knowledge consistently accessible. Reduces dependency on specific individuals.

**Status:** Planned (v0.7)

#### Screens

| Screen | Access | Description |
|---|---|---|
| Knowledge Home | All roles | Curated landing page: recently updated documents, pinned policies, featured handbook sections, search bar |
| Document Library | All roles | Full library of company documents organized by department, category, and tag. Version history visible |
| Document Detail | All roles | View a document, see version history, download. Owner/GM/Manager can upload new versions |
| Policy Center | Owner, GM (edit), Manager, Employee (read) | Structured policy registry: HR policies, financial policies, operational rules. Status: draft, active, archived |
| Template Library | Owner, GM (edit), Manager, Employee (read) | Reusable document templates: meeting agendas, position card templates, report formats |
| Company Handbook | Owner, GM (edit), Manager, Employee (read) | Structured multi-section handbook. Sections map to departments and functional areas |
| Search | All roles | Full-text search across all knowledge content. Filter by type, department, date |

#### Key Data Entities

`Document` → `DocumentVersion`  
`Policy` → `PolicyVersion`  
`Template`  
`HandbookSection`  
`KnowledgeTag`

#### Knowledge ← Meetings Bridge

Meeting decisions can be promoted to a Policy or Document record directly from the Decisions Log. This is the primary path from operational activity to institutional knowledge.

---

### 4.8 AI Advisor

**Purpose:** An intelligence layer across the operating system. Analyzes company operating data to detect risks, recommend actions, and support executive decision-making. Not a gimmick — every AI feature must connect to a real operational signal.

**Status:** Planned (v0.8)

#### Screens

| Screen | Access | Description |
|---|---|---|
| AI Insights Dashboard | Owner, GM | Curated feed of AI-generated insights across all modules. Ranked by severity and relevance |
| Risk Detection Center | Owner, GM | Categorized risk signals: governance gaps, stalled execution, declining KPIs, meeting rhythm breakdown |
| Suggested Actions | Owner, GM, Manager (dept-scoped) | Actionable recommendations generated from risk signals. Each suggestion can be converted to a Task |
| Executive Assistant | Owner, GM | Conversational interface over the company's operating data. Ask natural language questions and receive structured answers with source references |
| Company Health Summary | Owner, GM | Auto-generated weekly or monthly summary: what's working, what needs attention, what has improved since last period |

#### Key Data Entities

`AIInsight` → `RiskSignal` → `SuggestedAction`  
`AnalysisSnapshot`  
`AssistantConversation` → `AssistantContextArtifact`

#### AI Feature Breakdown

| Feature | Input | Output |
|---|---|---|
| Meeting Summarizer | Meeting notes + agenda | Structured summary, extracted decisions, extracted action items |
| Governance Gap Detector | Position card coverage + decision rights coverage | Gap list with severity score |
| KPI Trend Analyzer | KPI value history | Trend classification, anomaly flag, suggested corrective action |
| Execution Monitor | Task status + overdue rate | Blocked team alerts, velocity trend, burndown risk |
| Succession Analyzer | Org chart + succession records | Leadership depth score, single-point-of-failure roles |
| Knowledge Assistant | Document library + policies + handbook | Semantic search, document Q&A, auto-draft position cards from similar templates |

---

### 4.9 Administration

**Purpose:** Governs the platform itself. Controls tenant configuration, access, integrations, and system-level oversight.

**Status:** Foundational elements in v0.1. Full build in v0.9.

#### Screens

| Screen | Access | Description |
|---|---|---|
| Company Settings | Owner, GM | Company profile: name, logo, timezone, locale, industry. Subscription plan display |
| User Management | Owner | Invite, edit, deactivate user accounts. Assign employees to user accounts |
| Permission Matrix | Owner | Visual grid of all roles × permissions. Toggle individual permissions per role |
| Role Assignment | Owner, GM | Assign business roles to user accounts (Owner, GM, Manager, Employee) |
| Integration Settings | Owner, GM | Configure third-party integrations: calendar sync, SSO, export destinations |
| Audit Log | Owner, GM | Append-only log of all significant system actions: record creates, edits, deletes, role changes, logins |

---

## 5. Role-Access Matrix

Full permission reference for all screens. Access levels: **Full** (read + write + delete), **Edit** (read + write), **Read**, **Own** (access limited to own records), **—** (no access).

### Dashboard

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Executive/Company Dashboard | Full | Full | — | — |
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
| Org Chart View | Full | Full | Read | Read |
| Reporting Line Editor | Full | Edit | — | — |

### Governance

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Position Cards List | Full | Full | Edit (own dept) | — |
| Position Card Detail | Full | Full | Edit (own dept) | Read (own) |
| Position Card Editor | Full | Full | Edit (own dept) | — |
| Authority Matrix | Full | Read | — | — |
| Decision Rights Matrix | Full | Full | Read | — |
| Succession Planning | Full | — | — | — |
| Governance Gap Review | Full | Read | — | — |

### Meetings

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Meeting Schedule | Full | Full | Full | Own |
| Meeting Types | Full | Edit | — | — |
| Meeting Setup | Full | Full | Full | — |
| Meeting Detail | Full | Full | Full | Own (participant) |
| Agenda Builder | Full | Full | Own (meeting owner) | — |
| Decision Recorder | Full | Full | Own (meeting owner) | — |
| Action Item Tracker | Full | Full | Full | Own |
| Decisions Log | Full | Full | Read | — |
| Meeting History | Full | Full | Read | — |

### Execution

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| My Tasks | Full | Full | Full | Full |
| Team Board | Full | Full | Edit (own dept) | — |
| Task Detail | Full | Full | Edit (own dept) | Own |
| Project Overview | Full | Full | Read | — |
| Project Detail | Full | Full | Edit | Own (assigned) |
| SOP Library | Full | Full | Read | Read |
| Checklist Runner | Full | Full | Full | Full |
| Workflow Builder | Full | Edit | — | — |
| Workflow History | Full | Full | Read | — |

### Performance

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Company Performance Dashboard | Full | Read | — | — |
| KPI Management | Full | Full | — | — |
| KPI Detail | Full | Full | Own dept | — |
| KPI Entry | Full | Full | Own dept | — |
| Department KPI Dashboard | Full | Full | Own dept | — |
| OKR Dashboard | Full | Full | Read | — |
| Employee Scorecard | Full | Full | Own dept | Own |
| Trend Analysis | Full | Read | — | — |

### Knowledge

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Knowledge Home | Full | Full | Full | Read |
| Document Library | Full | Full | Edit | Read |
| Document Detail | Full | Full | Edit | Read |
| Policy Center | Full | Edit | Read | Read |
| Template Library | Full | Edit | Read | Read |
| Company Handbook | Full | Edit | Read | Read |
| Search | Full | Full | Full | Read |

### AI Advisor

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| AI Insights Dashboard | Full | Read | — | — |
| Risk Detection Center | Full | Read | — | — |
| Suggested Actions | Full | Full | Own dept | — |
| Executive Assistant | Full | Full | — | — |
| Company Health Summary | Full | Read | — | — |

### Administration

| Screen | Owner | GM | Manager | Employee |
|---|---|---|---|---|
| Company Settings | Full | Edit | — | — |
| User Management | Full | — | — | — |
| Permission Matrix | Full | — | — | — |
| Role Assignment | Full | Edit | — | — |
| Integration Settings | Full | Edit | — | — |
| Audit Log | Full | Read | — | — |

---

## 6. Module Relationships

Veliaht OS is an integrated operating system, not a collection of isolated features. Each module depends on and feeds into others.

```
                    ┌──────────────────────────────────────────┐
                    │           ADMINISTRATION                 │
                    │  (users, roles, permissions, tenancy)    │
                    └────────────────┬─────────────────────────┘
                                     │ governs access to all
                    ┌────────────────▼─────────────────────────┐
                    │            ORGANIZATION                  │
                    │    (Company → Department → Employee)     │
                    └────┬─────────┬──────────┬────────────────┘
                         │         │          │
            ┌────────────▼──┐  ┌───▼──────┐  └─────────────────┐
            │  GOVERNANCE   │  │ MEETINGS │                     │
            │  (authority,  │  │ (rhythm, │                     │
            │   decisions,  │  │  agenda, │                     │
            │   succession) │  │  action  │                     │
            └───────────────┘  │  items)  │                     │
                    │          └─────┬────┘                     │
                    │                │                          │
                    │         ┌──────▼──────────────────────┐   │
                    │         │         EXECUTION           │   │
                    │         │  (tasks, projects, SOPs,    │   │
                    │         │   workflows, checklists)    │   │
                    │         └──────────────┬──────────────┘   │
                    │                        │                  │
                    └────────────────────────▼──────────────────▼
                                    PERFORMANCE
                              (KPIs, OKRs, scorecards,
                               department health)
                                        │
                              ┌─────────▼──────────┐
                              │     KNOWLEDGE      │
                              │  (documents,       │
                              │   policies,        │
                              │   handbook)        │
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │    AI ADVISOR      │
                              │  consumes all      │
                              │  module outputs    │
                              └────────────────────┘
```

### Dependency Map

| Module | Depends On | Feeds Into |
|---|---|---|
| Organization | — (foundation) | All modules |
| Governance | Organization | Meetings, Execution, Knowledge |
| Meetings | Organization, Governance | Execution (action items → tasks), Knowledge (decisions → policies) |
| Execution | Organization, Meetings, Governance | Performance (task completion rates), Knowledge (SOPs) |
| Performance | Organization, Execution | AI Advisor (KPI signals), Knowledge (reports) |
| Knowledge | Governance, Meetings, Execution | AI Advisor (RAG context) |
| AI Advisor | All modules | Dashboard (insights), Execution (suggested tasks) |
| Administration | — (platform layer) | All modules (access control) |

---

## 7. Data Flow Architecture

### Primary Data Flows

#### Flow 1: Meeting → Execution
```
Meeting Occurrence
  └── Action Item created during meeting
        └── Task record created automatically
              ├── source_type = 'meeting'
              ├── source_id = meeting_occurrence.id
              ├── assignee_employee_id = action item owner
              └── due_at = action item deadline
```

#### Flow 2: KPI Breach → AI → Execution
```
KPI Value entered
  └── System checks against warning_threshold / critical_threshold
        └── Threshold crossed → RiskSignal created (AI module)
              └── AI generates SuggestedAction
                    └── Owner/GM converts suggestion to Task
                          ├── source_type = 'kpi'
                          └── source_id = kpi_definition.id
```

#### Flow 3: Governance → Knowledge
```
Meeting Decision recorded
  └── Owner/GM promotes decision to Policy
        └── Policy record created in Knowledge
              ├── source_type = 'meeting_decision'
              └── source_id = meeting_decision.id
```

#### Flow 4: Execution → Performance
```
Task records (all statuses, timestamps)
  └── Aggregated by department, period
        └── TaskCompletionRate metric computed
              └── Feeds EmployeeScorecard and DepartmentHealthSnapshot
```

#### Flow 5: All Modules → AI
```
Nightly or on-demand analysis job:
  ├── Reads KPI values (trend analysis)
  ├── Reads Task statuses (execution health)
  ├── Reads Meeting action item closure rates
  ├── Reads Position card coverage (governance completeness)
  └── Writes AIInsight and RiskSignal records
        └── Surfaces on AI Advisor screens and Dashboard
```

#### Flow 6: Organization → All Modules
```
Employee / Department created or modified
  └── Cascades availability to:
        ├── Meeting participant picker
        ├── Task assignee picker
        ├── Position card assignment
        ├── KPI scope (department_id / employee_id)
        └── Role-based access enforcement
```

---

## 8. AI Integration Plan

AI in Veliaht OS is an intelligence layer, not a feature. It is only as valuable as the quality and completeness of the operational data in the system.

### Architecture Approach

- LLM integration via API (Anthropic Claude or OpenAI)
- Retrieval-Augmented Generation (RAG) over company operating data
- Company data is never shared across tenants
- AI context is always scoped to the authenticated user's company
- Every AI-generated output is traceable to its source records

### AI Feature Roadmap

#### Phase 1: Structured Signals (v0.8 launch)

These features operate on structured data — no free-text generation required. Low risk, high value.

| Feature | How It Works |
|---|---|
| Governance Gap Detector | Counts missing position cards, undefined decision rights, unassigned successors. Outputs a scored gap list |
| KPI Anomaly Detection | Statistical comparison of KPI values against historical baseline and target. Flags deviations |
| Execution Health Score | Aggregates task overdue rate, blocked task count, and action item closure rate into a health score per department |
| Meeting Rhythm Monitor | Detects when a recurring meeting type has not occurred within its expected cadence |

#### Phase 2: Language Generation (v0.8 advanced)

These features use an LLM to produce or interpret natural language.

| Feature | Input | Output |
|---|---|---|
| Meeting Summarizer | Raw meeting notes (text) | Structured summary: key decisions, extracted action items, open issues |
| Position Card Drafter | Role title + department + similar cards | Draft position card with duties and decision scope |
| Policy Drafter | Meeting decision + context | Draft policy document for review |
| Executive Assistant | Natural language question + company data context | Structured answer with source references |

#### Phase 3: Proactive Recommendations (v0.9+)

| Feature | Description |
|---|---|
| Company Health Weekly Brief | Auto-generated weekly digest: what improved, what declined, what needs attention |
| Succession Risk Report | Analyzes org chart depth and flags critical single-point-of-failure roles |
| Strategic Pattern Detection | Identifies recurring execution failures, governance violations, or KPI patterns that indicate systemic issues |

### AI Data Boundaries

- AI never modifies records directly. It generates suggestions and drafts that require human review and action.
- AI context windows are scoped to the authenticated company tenant.
- AI outputs are stored as `AIInsight`, `SuggestedAction`, or `AssistantConversation` records — never overwriting source data.
- Users can accept, reject, or ignore any AI-generated suggestion.

---

## 9. Cloud Architecture

This section defines the target production architecture for v0.9 and the v1.0 commercial launch.

### Infrastructure Overview

```
┌────────────────────────────────────────────────────────────────┐
│                          CDN                                    │
│                    (static frontend assets)                     │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                     API Layer (REST)                            │
│              Node.js / Express or equivalent                    │
│       Authentication middleware, tenant isolation middleware    │
└───┬────────────────┬──────────────────┬─────────────────────────┘
    │                │                  │
┌───▼────┐    ┌──────▼──────┐    ┌──────▼──────────┐
│  Auth  │    │  PostgreSQL  │    │  Object Storage │
│ Service│    │  (primary    │    │  (S3-compatible)│
│ (JWT + │    │  database,   │    │  documents,     │
│  OAuth)│    │  per-tenant  │    │  exports,       │
└────────┘    │  row-level   │    │  backups)       │
             │  isolation)  │    └─────────────────┘
             └──────┬───────┘
                    │
             ┌──────▼───────┐    ┌────────────────────┐
             │    Redis     │    │   Job Queue        │
             │  (session    │    │  (BullMQ or equiv) │
             │   cache,     │    │  nightly AI jobs,  │
             │   rate limit)│    │  recurring tasks,  │
             └──────────────┘    │  notifications)    │
                                 └────────────────────┘
```

### Multi-Tenancy Model

- Every business entity carries a `company_id` foreign key.
- API middleware validates that the authenticated user's `company_id` matches the resource being accessed.
- No cross-tenant data leakage is architecturally possible at the query level.
- Row-level security enforced at the database layer as a defense-in-depth measure.
- AI context is scoped to a single tenant per session.

### Authentication

| Phase | Mechanism |
|---|---|
| v0.1–v0.8 | Local email/password with bcrypt hashing |
| v0.9 | JWT-based session tokens, refresh token rotation |
| v0.9 | Google OAuth integration |
| v1.0+ | Microsoft SSO, optional SAML for enterprise |

### Data Persistence

| Data Type | Storage |
|---|---|
| All business entities | PostgreSQL (normalized, relational) |
| User sessions | Redis (TTL-based) |
| Documents and file uploads | Object storage (S3-compatible) |
| AI conversation history | PostgreSQL (append-only) |
| Audit logs | PostgreSQL (append-only, never deletable) |

### Deployment Environments

| Environment | Purpose |
|---|---|
| `local` | Developer machines, localStorage-backed prototype |
| `staging` | Pre-production validation, real backend, seeded demo data |
| `production` | Live customer-facing environment |

### Backup and Recovery

- Automated daily database snapshots with 30-day retention.
- Point-in-time recovery enabled for PostgreSQL.
- Object storage with versioning enabled.
- Audit logs are append-only and never purged.

### Performance Targets (v1.0)

| Metric | Target |
|---|---|
| API response time (p95) | < 300ms |
| Dashboard load time | < 1.5s |
| Uptime SLA | 99.5% |
| Concurrent users per tenant | 50 (initial) |

---

## 10. Sprint Roadmap

All previous versions have been released. Roadmap below covers v0.3 through v1.0.

---

### v0.3 — Governance

**Goal:** Make authority and responsibility explicit inside the platform.

| Sprint | Deliverable |
|---|---|
| 0.3.1 | Position Cards: version history, draft/active/archived states, improved editor |
| 0.3.2 | Duties and Collaborations as structured child records (not free text) |
| 0.3.3 | Decision Rights Matrix screen: who decides what, who approves what |
| 0.3.4 | Authority Matrix screen: cross-department authority map |
| 0.3.5 | Governance Gap Review screen + Governance Completeness Score on dashboard |
| 0.3.6 | Succession Planning screen (Owner only) |
| 0.3.7 | Regression testing + v0.3.0 commit |

---

### v0.4 — Meetings

**Goal:** Transform meetings from static records into operational control points with full lifecycle.

| Sprint | Deliverable |
|---|---|
| 0.4.1 | Separate MeetingTemplate from MeetingOccurrence in data model and UI |
| 0.4.2 | Meeting Setup screen: create occurrence from template, set participants and cadence |
| 0.4.3 | Agenda Builder: drag-and-drop agenda items with time estimates |
| 0.4.4 | Decision Recorder: inline decision capture during/after a meeting |
| 0.4.5 | Action Item Tracker: link action items to Execution tasks (source_type = 'meeting') |
| 0.4.6 | Decisions Log: searchable registry of all decisions across meetings |
| 0.4.7 | Meeting History Timeline: past meetings with attendance, decisions, action items |
| 0.4.8 | Regression testing + v0.4.0 commit |

---

### v0.5 — Execution

**Goal:** Deepen execution management from a task list to a full operational execution layer.

| Sprint | Deliverable |
|---|---|
| 0.5.1 | Task board improvements: filter, sort, group by status/priority/assignee |
| 0.5.2 | Task Detail screen: description, comments, status history, source reference |
| 0.5.3 | Project model: create projects, add milestones, link tasks to projects |
| 0.5.4 | Project Overview and Project Detail screens |
| 0.5.5 | SOP Library: create, read, and version standard operating procedures |
| 0.5.6 | Checklist Runner: run an SOP step-by-step with completion timestamps |
| 0.5.7 | Workflow Builder: define multi-step workflows with assignees and triggers |
| 0.5.8 | Workflow execution + Workflow History screen |
| 0.5.9 | Regression testing + v0.5.0 commit |

---

### v0.6 — Performance

**Goal:** Give leadership a structured, data-driven view of business health.

| Sprint | Deliverable |
|---|---|
| 0.6.1 | KPI Definition management: create, edit, set targets and thresholds |
| 0.6.2 | KPI Value entry screen: manual periodic data entry |
| 0.6.3 | Department KPI Dashboard: status grid with period comparison |
| 0.6.4 | Company Performance Dashboard: executive-level KPI overview |
| 0.6.5 | OKR model: create Objectives, define Key Results, enter check-ins |
| 0.6.6 | OKR Dashboard screen |
| 0.6.7 | Employee Scorecard: task completion rate, meeting attendance, KPI status |
| 0.6.8 | Trend Analysis screen: multi-KPI historical chart with cross-filtering |
| 0.6.9 | KPI breach → RiskSignal bridge (foundation for v0.8 AI) |
| 0.6.10 | Regression testing + v0.6.0 commit |

---

### v0.7 — Knowledge

**Goal:** Give the company a structured home for institutional knowledge.

| Sprint | Deliverable |
|---|---|
| 0.7.1 | Document Library: upload, tag, organize documents by department and type |
| 0.7.2 | Document versioning: upload new versions, view version history |
| 0.7.3 | Policy Center: create, edit, publish, and archive policies |
| 0.7.4 | Template Library: reusable document templates |
| 0.7.5 | Company Handbook: multi-section structured handbook builder |
| 0.7.6 | Knowledge Search: full-text search across all knowledge content |
| 0.7.7 | Meeting Decision → Policy promotion flow |
| 0.7.8 | Regression testing + v0.7.0 commit |

---

### v0.8 — AI

**Goal:** Layer intelligence across operating data to detect risks and support executive decision-making.

| Sprint | Deliverable |
|---|---|
| 0.8.1 | AI infrastructure: LLM API integration, prompt scaffolding, tenant-scoped context |
| 0.8.2 | Governance Gap Detector: structured signal, no LLM required |
| 0.8.3 | KPI Anomaly Detection: threshold breach signals, trend classification |
| 0.8.4 | Execution Health Score: per-department score from task and action item data |
| 0.8.5 | Meeting Rhythm Monitor: cadence deviation alerts |
| 0.8.6 | AI Insights Dashboard: curated feed of all signals |
| 0.8.7 | Suggested Actions: convert signals to recommended tasks |
| 0.8.8 | Meeting Summarizer: LLM-generated summary from raw meeting notes |
| 0.8.9 | Executive Assistant: conversational interface over company data (RAG) |
| 0.8.10 | Company Health Summary: weekly auto-generated brief for Owner/GM |
| 0.8.11 | Regression testing + v0.8.0 commit |

---

### v0.9 — Cloud

**Goal:** Move from a browser-only prototype to a production-grade multi-tenant SaaS backend.

| Sprint | Deliverable |
|---|---|
| 0.9.1 | Backend API: define REST endpoints for all core entities |
| 0.9.2 | PostgreSQL schema: implement normalized production data model |
| 0.9.3 | Authentication service: JWT, refresh tokens, email/password login |
| 0.9.4 | Google OAuth integration |
| 0.9.5 | Multi-tenancy middleware: company_id isolation on all API routes |
| 0.9.6 | Data migration utility: export localStorage data → import to backend |
| 0.9.7 | Object storage integration: document upload and retrieval |
| 0.9.8 | Job queue: background AI jobs, recurring task generation, notifications |
| 0.9.9 | Audit log: append-only log for all significant operations |
| 0.9.10 | Invitation flow: invite users by email, accept invite, set password |
| 0.9.11 | Data export: company data export as JSON or CSV |
| 0.9.12 | Staging environment setup and smoke tests |
| 0.9.13 | Regression testing + v0.9.0 commit |

---

### v1.0 — Release

**Goal:** Commercial-grade quality, onboarding, and go-to-market readiness.

| Sprint | Deliverable |
|---|---|
| 1.0.1 | Security audit: input validation, auth hardening, rate limiting, OWASP review |
| 1.0.2 | Performance optimization: query indexing, caching strategy, frontend bundle optimization |
| 1.0.3 | Onboarding flow: new company wizard, sample data seeding, guided tour |
| 1.0.4 | Mobile-responsive polish: all critical screens validated on tablet and phone |
| 1.0.5 | Localization: full Turkish and English support across all new modules |
| 1.0.6 | Subscription and billing hooks: plan tiers, trial expiration, upgrade prompts |
| 1.0.7 | User acceptance testing: structured test with real users across all modules |
| 1.0.8 | Documentation: user-facing help content for all modules |
| 1.0.9 | Final regression testing across all modules |
| 1.0.10 | Production deployment + v1.0.0 release commit |

---

## Appendix: Module Version Summary

| Version | Module | Core Deliverable |
|---|---|---|
| v0.1 | Foundation | App shell, auth, navigation, settings, i18n |
| v0.2 | Organization | Departments, employees, org chart, reporting lines |
| v0.3 | Governance | Position cards (full), authority matrix, decision rights, succession |
| v0.4 | Meetings | Meeting lifecycle, agenda, decisions, action items |
| v0.5 | Execution | Task board, projects, SOPs, checklists, workflows |
| v0.6 | Performance | KPIs, OKRs, scorecards, trend analysis |
| v0.7 | Knowledge | Documents, policies, templates, handbook, search |
| v0.8 | AI | Signals, insights, meeting summarizer, executive assistant |
| v0.9 | Cloud | Backend API, auth, multi-tenancy, migration, infra |
| v1.0 | Release | Security, performance, onboarding, billing, launch |
