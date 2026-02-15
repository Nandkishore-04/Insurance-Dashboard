# Claude Code Instructions: Insurance Dashboard Implementation

This document provides updated, finalized instructions for building the **Customer Master Screen** and the **Electron/SQLite** data layer.

## 1. Customer Master Logic
Each customer must have a unique **Customer Code** (e.g., ASHOK identified as `A0001`).
- **Generation Logic**: [First Letter of Name] + [4-digit incrementing number].
- **Schema `customers`**:
  - `id` (UUID)
  - `name` (Required)
  - `cust_code` (Unique, e.g., A0001)
  - `phone`
  - `address`

## 2. Insurance Policy Fields
The system must handle three main categories of insurance with the following specific fields:

### A. Motor Insurance (Two Wheeler / Pvt Car / Commercial)
- **Identity**: `regn_no`, `make`, `model`, `mfg_year`, `cc`, `gvw`
- **Validity/Expiry**: `regn_validity`, `od_expiry`, `tp_expiry`, `cpa_expiry`, `comp_expiry`
- **Details**: `idv`, `insurer`, `nil_depreciation` (Yes/No), `agency_code`

### B. Mediclaim
- **Proposer Info**: `proposer_name`, `prop_dob`, `family_size`
- **Policy Info**: `insurer`, `scheme`, `sum_insured`, `policy_expiry`, `agency_code`

### C. General/Life Policy
- **Base Info**: `policy_no`, `insurer`, `premium`, `plan`, `term`, `ppt`
- **Payment**: `mode` (YLY, HLY, QLY, MLY), `due_date`

## 3. Normalized Database Schema (`db.cjs`)
Use a `policies` table linked to the `customers` table.
- **`policies` table**:
  - `id` (UUID)
  - `customer_id` (FK)
  - `policy_type` (Motor, Mediclaim, General)
  - `details` (JSON string or specific columns for all fields above)

## 4. UI Requirements
- **Customer Onboarding**: When adding a new policy, first search for an existing customer by `name` or `cust_code`. 
- **Dynamic Forms**: The form fields must change based on the `policy_type` selected (Motor vs Mediclaim vs General).
- **Grouped Search**: Searching for a customer should display their master info followed by a list of all their linked policies.

## 5. Desktop & Offline Status
- **Shell**: Electron (v40.3.0) is configured and running via `main.cjs`.
- **Database**: SQLite is initialized in `db.cjs`.
- **Preload**: IPC handlers are exposed in `preload.cjs`.
- **Recommendation**: Always write to the local SQLite database first for speed.
