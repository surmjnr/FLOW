# FLOW

A web-based frontend application for tracking document transfers with configurable forms, recipients, and send/receive workflow.

## User types

- **Regular user**: Does not record anything (no Send). Only signs/approves: sees **Receive** (accept or correction needed) and **Records**. No Configuration.
- **Secretary**: Has the “book” — can **Send** (record transfers), **Receive**, **Records**, and **Configuration** (Forms and Link only; cannot configure Recipients).
- **Admin**: Full access — **Send**, **Receive**, **Records**, and **Configuration** (Recipient, Forms, Link). Only admin can configure recipients.

## Features

- **Sidebar** (by role): Regular user sees Receive, Records. Secretary and Admin see Send, Receive, Records, Configuration.
- **Configuration**:
  - **Recipient** (admin only): Enter recipient name and save.
  - **Forms** (admin + secretary): Add question types — Date, Short input, Long input, Code. For Code, define the pattern (e.g. `26EDRnumber`).
  - **Link** (admin + secretary): Link forms to recipients (one form per recipient).
- **Send** (secretary + admin): Choose a recipient, fill the linked form, submit. Regular users cannot access Send.
- **Receive**: List of records sent to the current user; accept or indicate correction needed (all roles).
- **Records**: List of all completed transfers (all roles).

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Navigation and routing
- **Context API** - State management (Auth, Document, Config)
- **Vite** - Build tool and dev server
- **date-fns** - Date formatting utilities
- **LocalStorage** - Mock data persistence

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx       # Main layout with sidebar
│   ├── Sidebar.jsx      # Navigation: Send, Receive, Records, Configuration
│   └── PrivateRoute.jsx # Route protection
├── context/
│   ├── AuthContext.jsx  # Authentication state
│   ├── DocumentContext.jsx # Document state (legacy)
│   └── ConfigContext.jsx  # Recipients, forms, links
├── pages/
│   ├── Login.jsx
│   ├── SendPage.jsx     # Send: recipient + form table + cell input
│   ├── ReceivePage.jsx  # Receive: accept / correction needed
│   ├── RecordsPage.jsx  # Completed transfers
│   ├── Configuration.jsx # Tabs: Recipient, Forms, Link
│   ├── ConfigRecipient.jsx
│   ├── ConfigForms.jsx
│   └── ConfigLink.jsx
├── services/
│   └── mockApi.js      # Mock API (recipients, forms, links, transfers)
├── App.jsx
└── main.jsx
```

## Installation

```bash
npm install
```

## Running the Application

```bash
npm run dev
```

The application opens at `http://localhost:5173` (or the port shown).

## Usage

### Login

**Default credentials (from `mockApi`):**

| Role       | Username   | Password  | Division   |
|-----------|------------|-----------|------------|
| Admin     | `admin`    | `admin`   | Admin      |
| Secretary | `secretary`| `password`| Secretary  |
| User      | `ddg-t0`   | `password`| DDG-T0     |
| User      | `dg`       | `password`| DG         |
| User      | `all-units`| `password`| ALL UNITS  |
| User      | `finance`  | `password`| Finance    |
| User      | `hr`       | `password`| HR         |
| User      | `it`       | `password`| IT         |
| User      | `operations`| `password`| Operations |
| User      | `marketing`| `password`| Marketing  |

All regular users use password `password` except Admin (`admin`/`admin`).

### Flow

1. **Configuration**: Admin adds recipients (e.g. Finance, HR). Admin or Secretary creates forms and links forms to recipients (Configuration → Forms, Configuration → Link).
2. **Send** (secretary or admin): Select a recipient. Fill the linked form. Submit to send. Regular users do not see Send; they only sign/approve on Receive.
3. **Receive**: Users whose division matches the recipient name see pending transfers. They Accept or mark Correction needed (with a note). All roles can use Receive.
4. **Records**: View all completed (accepted) transfers. All roles can view Records.



## Data Persistence

Data is stored in browser LocalStorage (recipients, forms, links, transfers). Clear LocalStorage to reset.

## License

Internal use only.
