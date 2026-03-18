# MoeTrackIT - Comprehensive System Documentation

## 🎯 Project Overview
MoeTrackIT is a state-of-the-art Government Revenue and Expenditure Management System. It provides a centralized platform for tracking financial activities, automating revenue collection through multiple gateways (Remita & Paystack), and managing departmental expenditures with strict budgetary controls and geographical scoping (RBAC).

---

## 🏗️ Technical Architecture

### 1. Technology Stack
- **Frontend**: Next.js 14+, Tailwind CSS, Lucide React, SweetAlert2, React Table.
- **Backend**: Node.js, Express.js, Sequelize ORM.
- **Database**: PostgreSQL / MySQL (Sequelize compatible).
- **Integrations**: Remita Inline v2 API, Paystack API, PDFKit for invoicing.

### 2. Core Modules

#### A. Revenue Management (Income)
- **Assessment Engine**: 
  - Dynamic bill calculation based on fixed rates or student population.
  - Automated RRR (Remita Retrieval Reference) generation.
- **Payment Pathways**:
  - **Remita Inline**: Integrated widget for instant payment and automated background verification via webhooks.
  - **Paystack**: Standard online payment gateway integration.
  - **Manual Recording**: Support for bank-teller and cash payment entries for offline transactions.
- **Invoicing System**: Automated PDF receipt generation and emailing for confirmed payments.

#### B. Expenditure & Budgeting
- **Budgetary Control**: Allocation of funds to specific MDAs and Budget Line Items.
- **Expenditure Lifecycle**: 
  - `Draft` → `Submitted` → `Review` → `Approved/Rejected`.
  - Automatic balance deduction upon final approval.
- **Retirement Workflow**: Tracking of disbursed funds with multi-stage verification to ensure retirement compliance.

#### C. RBAC & Geographical Scoping
- **LGA-Based Scoping**: Officers (AEOs) are restricted to viewing and managing data only within their assigned Local Government Areas.
- **Role Hierarchy**:
  - **Super Admin**: Global visibility and system configuration.
  - **Admin / System Admin**: Departmental management.
  - **AEO**: Field-level supervision within LGAs.
  - **Principal**: Institution-specific access (Revenue only).

---

## 🔄 Business Workflows

### 1. The Revenue Cycle
1. **Creation**: Assessment is generated for an institution.
2. **Billing**: System generates an RRR for the specific amount.
3. **Payment**: User pays via Remita (Online/Bank) or Paystack.
4. **Verification**: 
   - **Manual**: User clicks "Verify" in the UI.
   - **Automatic**: Background webhook listener confirms transaction status.
5. **Finalization**: Assessment status updates to `Paid` or `Part Paid`, and a receipt is issued.

### 2. The Expenditure Cycle
1. **Initiation**: Officer creates an expenditure request against a budget line.
2. **Submission**: Request is submitted for departmental review.
3. **Approval**: Authorized personnel review and approve the spend.
4. **Execution**: Funds are marked as spent in the budget.
5. **Retirement**: Supporting documents are uploaded and verified to close the loop.

---

## 🛠️ Key API Endpoints (v1)

### Revenue & Payments
- `GET /api/v1/assessments`: List and filter assessments.
- `POST /api/v1/payments/remita/initiate`: Generate RRR for an assessment.
- `GET /api/v1/payments/remita/verify/:rrr`: Manual verification of Remita status.
- `POST /api/v1/payments/webhook/remita`: Background listener for Remita notifications.

### Expenditure
- `GET /api/v1/expenditure`: List and filter expenditures.
- `POST /api/v1/expenditure/:id/approve`: Multi-stage approval endpoint.
- `GET /api/v1/expenditure-retirement`: Manage fund retirements.

---

## 🛡️ Security & Permissions
- **Authentication**: JWT (JSON Web Token) with secure HTTP headers.
- **Permissions**: Resource-based permission strings (e.g., `expenditure:approve`, `assessment:read`).
- **Data Integrity**: Global transaction wrappers for all financial mutations to prevent partial data writes.

---

## 📊 Future Enhancements
- **Push Notifications**: Real-time alerts for payment confirmations and approval requests.
- **Advanced Forecasting**: AI-driven revenue prediction based on historical trends.
- **Mobile App Expansion**: Full offline support for field assessments in remote LGAs.

---
*Documentation Generated: March 2026*
