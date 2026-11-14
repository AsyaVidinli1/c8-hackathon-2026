# Veliaht OS Module Architecture

## Product Positioning

Veliaht OS is a family business operating system.

It is not intended to be a generic ERP, CRM, HR platform, or project management application. Those categories usually focus on transactions, pipelines, personnel administration, or task throughput in isolation.

Veliaht OS focuses on a different problem:

- making the business operable beyond individuals
- defining who is responsible for what
- clarifying who can decide what
- creating management rhythm
- making execution measurable
- preserving organizational knowledge
- supporting owners, executives, and advisors with structured visibility

The product is designed for family businesses that need operational clarity, governance discipline, and continuity across generations, managers, and teams.

---

## Product Architecture Principles

- The company is the core operating unit of the platform.
- The system should connect structure, governance, execution, and performance.
- Every module should reinforce management discipline rather than become a disconnected tool.
- Owners, general managers, department leaders, employees, and advisors should each see a role-appropriate version of the same operating model.
- The product should evolve in phases, with a focused operational MVP first and broader intelligence and knowledge capabilities later.

---

## 1. Organization

### Purpose

The Organization module defines how the company is structurally arranged.

It provides the operating map of the business:

- departments
- employees
- reporting lines
- org chart visibility

Without this module, the rest of the system has no stable structure to attach governance, tasks, meetings, or KPIs to.

### Target User

- Owner / family business principal
- General manager
- Department manager
- HR / people operations
- Advisor / consultant

### Main Screens

- Organization dashboard
- Department list
- Employee directory
- Employee profile
- Reporting line editor
- Org chart view

### Data Entities

- Company
- Department
- Employee
- ReportingRelationship
- OrganizationalUnitHistory

### Phase Priority

Phase 1

---

## 2. Governance

### Purpose

The Governance module defines how authority, accountability, and decision rights are structured in the company.

This is one of the most important differentiators of Veliaht OS. The goal is not only to show who works where, but to clarify:

- what each role exists to do
- what each role owns
- what each role may decide alone
- what requires approval
- where authority overlaps or is unclear

This turns informal management into a system.

### Target User

- Owner
- General manager
- Department manager
- HR / organizational development
- Advisor / consultant

### Main Screens

- Position card list
- Position card detail
- Authority matrix
- Decision rights matrix
- Responsibility map
- Governance gap review

### Data Entities

- PositionCard
- PositionCardDuty
- PositionCardCollaboration
- AuthorityRule
- DecisionRight
- ResponsibilityAssignment

### Phase Priority

Phase 1

---

## 3. Execution

### Purpose

The Execution module turns structure and governance into day-to-day operational movement.

It should manage not only individual tasks, but repeatable work and operational discipline:

- tasks
- projects
- SOPs
- checklists
- workflows

This module is where defined responsibilities become actual execution.

### Target User

- General manager
- Department manager
- Employees
- Operations leads
- Advisor / consultant

### Main Screens

- Task board
- My tasks
- Team execution board
- Project overview
- SOP library
- Checklist runner
- Workflow builder
- Workflow history

### Data Entities

- Task
- TaskComment
- Project
- ProjectMilestone
- SOP
- SOPStep
- Checklist
- ChecklistRun
- Workflow
- WorkflowStep
- WorkflowExecution

### Phase Priority

Phase 1 for tasks  
Phase 2 for projects, SOPs, checklists, and workflows

---

## 4. Meetings

### Purpose

The Meetings module creates management rhythm.

In many family businesses, meetings happen inconsistently, decisions are forgotten, and actions are not tracked. This module formalizes meeting operating systems:

- meeting types
- agendas
- decisions
- action items
- meeting history

Meetings should not be passive calendar events; they should be structured control points for the company.

### Target User

- Owner
- General manager
- Department manager
- Executive assistant
- Advisor / consultant

### Main Screens

- Meeting type list
- Recurring meeting setup
- Meeting detail
- Agenda view
- Decision log
- Action item tracker
- Meeting history timeline

### Data Entities

- MeetingType
- MeetingTemplate
- MeetingOccurrence
- MeetingParticipant
- AgendaItem
- MeetingDecision
- MeetingActionItem
- MeetingNote

### Phase Priority

Phase 1 for meeting structure and participation  
Phase 2 for agendas, decisions, action items, and history

---

## 5. Performance

### Purpose

The Performance module measures whether the organization is healthy and whether execution is producing the expected outcomes.

It should support multiple performance lenses:

- KPIs
- OKRs
- department health
- employee scorecards
- trends

The purpose is not only reporting. It is to create early visibility for operational breakdowns and leadership misalignment.

### Target User

- Owner
- General manager
- Department manager
- Finance / strategy leads
- Advisor / consultant

### Main Screens

- Performance dashboard
- KPI list
- KPI detail
- OKR dashboard
- Department health view
- Employee scorecard
- Trend analysis screen

### Data Entities

- KPIDefinition
- KPIValue
- Objective
- KeyResult
- DepartmentHealthSnapshot
- EmployeeScorecard
- PerformanceTrend

### Phase Priority

Phase 2

---

## 6. Knowledge

### Purpose

The Knowledge module preserves how the company operates and communicates that knowledge consistently.

It should centralize the materials that normally live in scattered files, folders, and informal explanations:

- documents
- policies
- templates
- company handbook

This module helps reduce dependency on memory and specific individuals.

### Target User

- Owner
- General manager
- HR
- Employees
- Advisor / consultant

### Main Screens

- Knowledge home
- Document library
- Policy center
- Template library
- Company handbook
- Search and browse view

### Data Entities

- Document
- DocumentVersion
- Policy
- Template
- HandbookSection
- KnowledgeTag

### Phase Priority

Phase 3

---

## 7. AI

### Purpose

The AI module acts as an intelligence layer across the operating system.

It should not exist as a separate gimmick. It should analyze the company’s operating data and provide useful support:

- company health analysis
- suggestions
- risk detection
- executive assistant functions

AI in Veliaht OS should help leadership detect structural weakness, execution risk, governance gaps, and management blind spots earlier.

### Target User

- Owner
- General manager
- Department manager
- Advisor / consultant
- Executive assistant

### Main Screens

- AI insights dashboard
- Risk detection center
- Suggested actions panel
- Executive assistant chat/workspace
- Company health summary

### Data Entities

- AIInsight
- RiskSignal
- SuggestedAction
- AnalysisSnapshot
- AssistantConversation
- AssistantContextArtifact

### Phase Priority

Later

---

## 8. Administration

### Purpose

The Administration module governs the platform itself.

It is responsible for tenant setup, access control, and system-level management:

- companies
- users
- permissions
- integrations

This module ensures that the product can scale from one demo company to many client companies safely and systematically.

### Target User

- Platform admin
- Owner
- General manager
- IT / systems admin
- Advisor / consultant with admin scope

### Main Screens

- Company settings
- User management
- Permission matrix
- Access roles
- Integration settings
- Audit / admin overview

### Data Entities

- Company
- UserAccount
- Role
- Permission
- UserRoleAssignment
- Integration
- IntegrationCredential
- AuditLog

### Phase Priority

Phase 2 for user and permission foundations  
Phase 3 for integrations and broader admin tooling

---

## Cross-Module Relationships

Veliaht OS should be built as an integrated operating model, not as isolated feature buckets.

Key dependencies:

- Organization is the structural foundation for Governance, Execution, Meetings, and Performance.
- Governance defines role clarity that drives task ownership, decision-making, and meeting participation.
- Execution generates operational activity that should feed Performance.
- Meetings create decisions and action items that flow into Execution.
- Knowledge supports Governance and Execution by documenting how work should be done.
- AI consumes data from all major modules and produces analysis, warnings, and recommendations.
- Administration controls who can access and manage all of the above.

---

## Recommended MVP Scope

Phase 1 should stay intentionally focused on the minimum set of modules required to create a real family business operating system foundation.

### Phase 1 MVP

- Dashboard
- Organization
- Employees
- Position Cards
- Meetings
- Tasks

### Why This Is the Right MVP

This scope is enough to establish:

- who exists in the company
- who reports to whom
- what each role is responsible for
- which meetings structure the business
- which tasks drive execution
- what leaders need to see on a day-to-day basis

This gives Veliaht OS a clear identity from the beginning:

not a generic work app, but a structured family business operating system.

### What Phase 1 Should Not Try to Fully Solve

- advanced project management
- full document management
- complete KPI analytics
- AI assistant workflows
- complex integrations
- broad enterprise administration

Those should come after the operating foundation is stable.

---

## Summary

Veliaht OS should be architected as a layered operating system for family businesses:

- structure first
- governance second
- execution third
- performance on top
- knowledge across the system
- AI as an intelligence layer
- administration as the control layer

This architecture gives the product a clear long-term shape while keeping the MVP disciplined and realistic.
