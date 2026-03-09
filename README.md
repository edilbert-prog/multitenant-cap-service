# Multitenant CAP Service

A multi-tenant SaaS backend built using the **SAP Cloud Application Programming Model (CAP)** and **Node.js**, designed for deployment on **SAP Business Technology Platform (BTP)** with **PostgreSQL**.

This project demonstrates how to create a scalable SaaS application with tenant onboarding, authentication, and database isolation.

---

# Technologies

- Node.js
- SAP Cloud Application Programming Model (CAP)
- PostgreSQL
- SAP Application Router
- SAP XSUAA Authentication
- SAP SaaS Registry
- SAP BTP Cloud Foundry

---

# Project Structure

```
multitenant-cap-service
│
├── approuter/          Application router configuration
├── db/                 Data models and schema definitions
│   └── schema.cds
│
├── srv/                Service implementation
│   ├── service.cds
│   └── service.js
│
├── mta.yaml            Multi-Target Application descriptor
├── xs-security.json    Authentication configuration
├── package.json
└── README.md
```

---

# Prerequisites

Install the following tools:

- Node.js
- npm
- SAP CAP CLI
- Cloud Foundry CLI

Install CAP CLI globally:

```
npm install -g @sap/cds-dk
```

---

# Installation

Clone the repository:

```
git clone https://github.com/edilbert-prog/multitenant-cap-service.git
```

Navigate to the project folder:

```
cd multitenant-cap-service
```

Install dependencies:

```
npm install
```

---

# Run the Application Locally

Start the CAP service:

```
cds run
```

The service will start at:

```
http://localhost:4004
```

---

# Deploy to SAP BTP

Login to Cloud Foundry:

```
cf login
```

Build the multi-target application:

```
mbt build
```

Deploy the generated `.mtar` file to SAP BTP.

---

# Features

- Multi-tenant SaaS architecture
- PostgreSQL database integration
- Tenant subscription via SaaS Registry
- Secure authentication using XSUAA
- CAP service implementation

---

# Author

Edilbert
