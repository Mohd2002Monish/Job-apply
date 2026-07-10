# Job Apply App 🚀

A comprehensive AI-powered job application suite that includes a **Job Tracker**, **AI Cover Letter Generator**, **Resume Parser & Multi-Resume Manager**, **Job Description (JD) Extractor**, **Chrome Extension Scraper**, **Interview Prep Simulator**, and an **Interactive Recruiter Inbox** with AI suggested replies. Powered by Google's **Gemini AI**.

---

## 📊 Architecture Diagram

The diagram below outlines how the client services, the backend server, and external APIs communicate with each other:

```mermaid
graph TD
    subgraph Client Services
        Ext["Chrome Extension (Scraper)"]
        FE["React + Tailwind + Chakra UI"]
    end

    subgraph Backend Application
        API["Express.js Server (Port 3000)"]
        DB[("MongoDB Database")]
    end

    subgraph External APIs & Services
        Gemini["Gemini AI API"]
        SMTP["Nodemailer SMTP Server"]
        OAuth["Google & Microsoft OAuth 2.0"]
    end

    %% Client communication
    Ext -->|POST /jobs/import| API
    FE -->|API Requests with Cookies| API
    
    %% Backend internal/external communication
    API <--> DB
    API <--> Gemini
    API -->|Sends Outreach & Follow-up| SMTP
    API <--> OAuth
```

---

## ✨ Features

### 🔐 1. Authentication & Profile Settings
* **Secure OAuth 2.0 Integration**: Supports fast and secure single sign-on (SSO) using Google and Microsoft OAuth providers. Passwords are never stored or managed locally.
* **Persistent Session Management**: Uses secure HTTP-only cookies (`jaa_session_token`) infused with JSON Web Tokens (JWT) to maintain authenticated sessions across browser restarts without exposing tokens to client-side scripts.
* **Profile Customization**: Users can seamlessly update their personal information, preferred email signatures, and upload profile pictures. Profile pictures are processed and securely stored locally using Multer.

### 📄 2. Resume Builder & Multi-Resume Manager
* **Intelligent Resume Parsing**: Users can drag and drop their existing resumes in multiple formats (PDF, DOCX, PNG, JPG). The backend leverages Gemini AI to extract structured JSON data (Experience, Education, Skills) and falls back to Tesseract OCR for image-based documents.
* **WYSIWYG A4 Resume Editor**: A powerful inline visual editor built directly onto physically-scaled A4 pages. Features a smart, synchronous React-driven page-break engine that calculates natural positions by subtracting active margins and handles canvas zooming dynamically, ensuring zero flicker during typing and automatic snap-to-page behavior.
* **Real-time Auto-Save**: Any changes made in the visual editor are instantly captured in local state and automatically debounced (saved to the database after 1-2 seconds of inactivity), completely eliminating the need for a manual "Save" button.
* **Multiple Layout Templates**: Switch instantly between aesthetic designs (Classic, Modern, Minimal) without losing any resume data. The JSON structure remains decoupled from the visual presentation layer.
* **Multi-Resume Management**: Upload, generate, and store multiple distinct versions of a resume for different industries. Select a specific "Primary Resume" that acts as the source-of-truth when generating ATS scores and cover letters.
* **Pixel-Perfect PDF Exports**: Export beautifully formatted PDFs generated via headless browser (Puppeteer). Integrates a deterministic style-matching pipeline that aligns backend HTML structure (Classic, Modern, Minimal) with frontend design tokens, and passes pre-normalized margin overrides to guarantee matching screen and print layouts. Also supports fully editable DOCX files.

### 📋 3. Job Tracking Dashboard & Kanban
* **Centralized Job Board & Kanban**: A high-performance interactive interface that organizes all applied jobs, current statuses, and target companies, supporting responsive drag-and-drop workflow updates.
* **Dynamic Status Workflow**: Track job progression through customizable tags (*Pending*, *Sent*, *Opened*, *Replied*, *Interviewing*, *Rejected*).
* **Circular ATS Score Rings**: Automatically computes an ATS match percentage by analyzing your primary resume against the saved Job Description. Displays a color-coded circular progress ring directly on the dashboard.
* **Analytics Panel**: Real-time chart visualization showing funnel drop-offs (e.g., Applications Sent vs. Interviews Secured) and overall response rates to help optimize job hunting strategies.

![Interactive Kanban Outreach Board](./screenshots/outreach_dashboard.png)

### 📥 4. Smart Job Import & JD Parsing
* **JD File Extraction**: Drag and drop a Job Description document. The backend automatically parses the text and uses AI to extract key metadata: Job Title, Company Name, Recruiter Name, Recruiter Email, and the core responsibilities.
* **Chrome Extension Importer**: A Manifest V3 Chrome Extension that lives in the browser. While browsing job boards like LinkedIn or Indeed, a single click scrapes the active job posting and beams it directly into the application's database via a secure REST API.

### ✉️ 5. AI Cover Letter Generator & Outreach
* **Context-Aware Letter Generation**: By combining the active Job Description with the user's Primary Resume, the AI drafts highly personalized cover letters that explicitly map the user's past experience to the employer's requirements.
* **Tone & Length Sliders**: Customize the generated letter's tone (Professional, Confident, Passionate) and strictly control word count using an interactive length slider.
* **Direct Email Outreach**: Send the generated cover letter and automatically attach the primary PDF resume directly to the recruiter's inbox using the built-in SMTP/Nodemailer engine.

### 🕵️ 6. Open & Click Tracking
* **Open Tracking Pixel**: When sending outreach emails, the system injects a hidden 1x1 tracking pixel (`/jobs/tracking/open/:id`). When the recruiter opens the email, the dashboard instantly updates the status to *Opened*.
* **Click Redirection Engine**: Automatically wraps portfolio and LinkedIn links inside the email with a secure redirect endpoint (`/jobs/tracking/click/:id`). Logs exactly when and which links the recruiter clicked.
* **Automated Follow-ups**: If an email is sent but receives no reply within a configured timeframe, the system can automatically draft and send a polite follow-up email.

### 🎙️ 7. Interview Prep Simulator
* **AI Question Generator**: Analyzes the specific Job Description and generates 8 highly relevant interview questions categorized into Technical, Behavioral, and Situational buckets.
* **Interactive Practice Interface**: A built-in scratchpad allows users to type out their answers under simulated pressure.
* **AI Grading & Feedback Loop**: Upon submitting an answer, the AI grades it on a scale of 1-10, provides a comprehensive critique on what was missing, and offers a polished, "perfect" response suggestion.

### 📥 8. Recruiter Inbox & Communications
* **Message Logger**: A centralized hub to manually log or automatically capture email threads, LinkedIn messages, and interview requests.
* **Interactive Chat UI**: A slide-out drawer presenting a thread-style, iMessage-like bubble history to keep recruiter discussions historically organized.
* **AI Suggested Replies**: Context-aware AI reads the latest recruiter message and auto-generates professional reply drafts (e.g., accepting an interview slot, negotiating salary, or asking for feedback).

### 9. Packages, Coupons and Subscription Referral Systems
* **Personalized Referral URLs**: Every user receives a unique referral code and link (`http://localhost:3000/r/CODE`) directly in their settings panel.
* **Real-time Analytics**: Displays referral link clicks and tracks referred users who upgrade to paid Pro subscriptions.
* **Subscription Package System**: Administrators can define distinct packages with custom features, pricing, and currency allotments (INR/USD) in the database.
* **Promotional Coupon Engine**: Supports custom discount coupon codes (flat or percentage rates) featuring expiration dates, max usage ceilings, and usage logs.
* **Easy Sharing**: Features a single-click copy utility for sharing links instantly.

![Outreach Analytics Panel](./screenshots/outreach_dashboard.png)

### 10. Owner Admin Console and System Metrics
* **Administrative Intelligence**: Owner accounts gain access to a secure, premium admin dashboard tracking global stats (Total Users, conversion percentages, cumulative LLM Prompt & Completion token consumption).
* **Member Controls**: Search and filter members, upgrade/downgrade subscription tiers, and edit user roles directly from the directory table.
* **Package & Coupon Administration**: Full CRUD panel for setting up pricing packages and creating/managing coupons.
* **Payment Gateway Management**: Securely create and manage credentials (masked in UI), set default gateways, toggle live/sandbox status, and restrict gateways by country lists.
* **Live Connection Tests**: Test integration keys with Stripe and Razorpay directly from the admin dashboard with real-time API response checks.
* **Responsive Visual Table**: Designed with the premium, theme-adaptive Slate Ocean design layout.

#### Light Theme Dashboard Console
![Owner Admin Console - Light Theme](./screenshots/admin_console_light.png)

#### Dark Theme Dashboard Console
![Owner Admin Console - Dark Theme](./screenshots/admin_console_dark.png)

### 11. Geolocation-Aware Payment Routing and AES-256-GCM Encryption
* **Dynamic Regional Selector**: Automatically detects user location (via Cloudflare headers, custom proxy headers, or client request body) to serve Stripe (for international cards/USD) or Razorpay (for domestic cards/INR).
* **AES-256-GCM Secure Encryption**: Key credentials (secret keys, publishable keys, webhook secrets, price IDs) are encrypted symmetrically on the server before database storage. Raw keys are never queried or returned in plain text.
* **Webhook Listeners**: Dedicated webhooks catch subscription lifecycle events (`subscription.activated`, `customer.subscription.deleted`, etc.) to update membership tier status automatically.
* **Sandbox Simulators**: Includes mock checkouts and test verification loops to simulate complete payment pipelines in local development.

### 12. Shared Jobs and Recruiter Contact Finder
* **Collaborative Directory**: A shared listing where users can search for active job titles, companies, and locations.
* **Recruiter Email Extractor**: Displays and allows easy copying of recruiter contact details.
* **Single-Click Import**: Lets users immediately import shared listings into their personalized Job Tracking Kanban board.

### 13. Custom AI Model Selection and Voice Practice
* **Dynamic Model Switcher**: Change the active Google Gemini LLM version (e.g., Gemini 1.5 Pro, Gemini 1.5 Flash) directly from the UI config to balance latency, speed, and intelligence.
* **Voice Interview Practice**: Grade vocal interview responses and record notes directly in the practice simulator.

---

## Tech Stack

* **Frontend**: React, Vite, Tailwind CSS, Chakra UI, Redux Toolkit, Axios, Framer Motion
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Multer, Nodemailer, Passport.js, Tesseract.js (OCR), Razorpay / Stripe SDKs
* **Chrome Extension**: Manifest V3 (JavaScript content scripts & popup panel)
* **AI Engine**: Gemini AI via OpenAI-compatible SDK

---

## Directory Structure

```text
Job-apply-app/
├── package.json          # Root runner config (concurrently script)
├── Back-end/
│   ├── controllers/      # Route logic (includes auth, jobs, paymentConfig, package, coupon)
│   ├── middlewares/      # Auth, country (geolocation router), and upload middlewares
│   ├── models/           # Mongoose schemas (User, Job, Resume, Package, Coupon, PaymentConfig)
│   ├── routes/           # Express router endpoints
│   ├── utils/            # Services (encryption, Gemini AI, Nodemailer, OAuth, OCR parser)
│   ├── public/           # Static uploads directory and Swagger API docs
│   ├── index.js          # Main application entry point
│   └── package.json
├── Front-end/
│   ├── src/
│   │   ├── components/   # Reusable UI (ResumeBuilder, JobsTable, PaymentGatewayPanel, Finder)
│   │   ├── redux/        # Redux state slices
│   │   └── App.jsx       # Main router & page assembler
│   └── package.json
└── chrome-extension/
    ├── manifest.json     # Extension setup & permissions
    ├── content.js        # Site scraping scripts for LinkedIn/Indeed
    ├── popup.html        # Interactive extension UI
    └── popup.js          # Scraped data transmitter
```

---

## Environment Variables (.env)

Create a `.env` file inside the `Back-end/` directory and populate it with the following configuration:

```env
# Server Port
PORT=3000

# Database
MONGODB_URI=your_mongodb_connection_uri

# Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key

# OpenAI API Configuration (Backup/Fallback & ChatGPT support)
OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude API Configuration (Backup/Fallback & Claude support)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Nodemailer SMTP Configuration
EMAIL_USER=your_email_address@gmail.com
EMAIL_PASSWORD=your_email_app_password

# Google OAuth2 Credentials (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Microsoft OAuth2 Credentials (https://portal.azure.com)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback

# Security Keys
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# Encryption Key (32-byte hex string for AES-256-GCM credentials)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Tracking Settings
TRACKING_BASE_URL=http://localhost:3000
```

---

## API Endpoints Reference

### Authentication (/auth)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/auth/google` | Public | Initiates the Google OAuth 2.0 login flow |
| `GET` | `/auth/google/callback` | Public | Google OAuth redirect handler callback |
| `GET` | `/auth/microsoft` | Public | Initiates the Microsoft OAuth 2.0 login flow |
| `GET` | `/auth/microsoft/callback` | Public | Microsoft OAuth redirect handler callback |
| `GET` | `/auth/status` | Authenticated | Verifies user session and returns profile data |
| `POST` | `/auth/logout` | Public | Logs out user and clears session cookies |
| `POST` | `/auth/profile/update` | Authenticated | Updates user profile and uploads photo (file field: `picture`) |

### Job Management (/jobs)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/jobs` | Authenticated | Retrieves all tracked job applications |
| `POST` | `/jobs` | Authenticated | Manually adds a new job application |
| `PATCH` | `/jobs/:id` | Authenticated | Updates an existing job application |
| `DELETE` | `/jobs/:id` | Authenticated | Removes a job application |
| `GET` | `/jobs/analytics` | Authenticated | Fetches application counts and response rate analytics |
| `GET` | `/jobs/due-followups` | Authenticated | Lists automated follow-ups that are due |
| `GET` | `/jobs/finder` | Authenticated | Searches and lists active jobs in the shared directory |
| `POST` | `/jobs/finder/import/:id` | Authenticated | Imports a job from the shared directory to user's Kanban board |
| `POST` | `/jobs/import` | Authenticated | Imports a scraped job from the Chrome Extension |
| `POST` | `/jobs/extract-jd` | Authenticated | Parses job details from uploaded JD file (file field: `jdFile`) |
| `POST` | `/jobs/extract-url` | Authenticated | Parses job details from an external job post URL |
| `POST` | `/jobs/:id/upload-jd` | Authenticated | Associates and extracts a JD document for an existing job |
| `POST` | `/jobs/:id/generate-cover-letter` | Authenticated | Generates custom cover letter for the job details |
| `POST` | `/jobs/:id/interview-prep` | Authenticated | Generates 8 tailored interview preparation questions |
| `PATCH` | `/jobs/:id/interview-notes` | Authenticated | Updates practice answers / scratchpad notes for questions |
| `POST` | `/jobs/:id/grade-answer` | Authenticated | Grades a specific practice answer and yields AI suggestions |
| `POST` | `/jobs/:id/grade-voice-answer` | Authenticated | Grades spoken/voice answers using AI review guidelines |
| `GET` | `/jobs/:id/messages` | Authenticated | Fetches logged recruiter chat message history |
| `POST` | `/jobs/:id/messages` | Authenticated | Logs a new incoming/outgoing recruiter message |
| `POST` | `/jobs/:id/suggest-reply` | Authenticated | Generates an AI-suggested reply to a recruiter message |
| `POST` | `/jobs/:id/salary-negotiation` | Authenticated | Provides automated salary negotiation suggestions based on JD |
| `GET` | `/jobs/:id/form-fields` | Authenticated | Generates profile fields map for auto-filling application forms |
| `POST` | `/jobs/:id/form-fill` | Authenticated | Submits extracted profile data to the extension form fill executor |

### Resume Management (Root Mounted)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `POST` | `/upload-resume` | Authenticated | Uploads and parses a new resume (file field: `resume`) |
| `GET` | `/resume-data` | Authenticated | Retrieves current primary resume data (structured JSON) |
| `POST` | `/export-resume` | Authenticated | Generates and exports primary resume as tailored PDF |
| `POST` | `/preview-template` | Authenticated | Returns HTML template preview of user resume |
| `GET` | `/resume/list` | Authenticated | Retrieves a list of all uploaded resumes |
| `POST` | `/resume/select` | Authenticated | Sets an active primary resume |
| `POST` | `/resume/delete` | Authenticated | Deletes a specific resume |
| `PUT` | `/resume/update` | Authenticated | Directly updates structured JSON sections of active resume |
| `POST` | `/resume/ats-score` | Authenticated | Computes match percentage between resume and JD text |
| `POST` | `/resume/cover-letter` | Authenticated | Generates general cover letter based on active resume |
| `POST` | `/resume/cover-letter/export` | Authenticated | Exports cover letter to DOCX file format |
| `POST` | `/resume/tailor` | Authenticated | Optimizes resume data for a specific JD to match ATS criteria |

### Email and Tracking (Root Mounted)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `POST` | `/apply` | Authenticated | Sends recruiter outreach email via SMTP with multiple attachments |
| `GET` | `/emails/replies` | Authenticated | Scrapes inbound inbox replies from recruiter |
| `POST` | `/apply/follow-up` | Authenticated | Sends an automated follow-up email if recruiter is unresponsive |
| `GET` | `/jobs/tracking/open/:id` | Public | 1x1 image tracker to log email opens |
| `GET` | `/jobs/tracking/click/:id` | Public | Logs link click redirection activity |

### Payment and Subscription Management (Root Mounted)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/packages` | Public | Lists all active subscription packages |
| `POST` | `/payment/coupon/validate` | Authenticated | Validates a coupon code against price/user limits |
| `POST` | `/payment/create-order` | Authenticated | Creates a checkout session (Stripe) or order ID (Razorpay) depending on country |
| `POST` | `/payment/verify` | Authenticated | Verifies HMAC signature for Razorpay mock or live payments |
| `POST` | `/payment/webhook/:gateway` | Public | Webhook listener for Stripe or Razorpay subscription events |
| `POST` | `/payment/cancel` | Authenticated | Cancels the active subscription and downgrades user to the free tier |

### Owner Administration (/admin)
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/admin/stats` | Owner | Fetches global platform analytics and token utilization metrics |
| `GET` | `/admin/users` | Owner | Retrieves user directory listing |
| `PATCH` | `/admin/users/:id/role` | Owner | Modifies user security role (e.g., standard, admin, owner) |
| `PATCH` | `/admin/users/:id/tier` | Owner | Directly changes user subscription tier |
| `GET` | `/admin/packages` | Owner | Retrieves all subscription packages |
| `POST` | `/admin/packages` | Owner | Creates a new subscription package |
| `PUT` | `/admin/packages/:id` | Owner | Updates an existing subscription package |
| `DELETE` | `/admin/packages/:id` | Owner | Deletes a subscription package |
| `GET` | `/admin/coupons` | Owner | Retrieves all coupons |
| `POST` | `/admin/coupons` | Owner | Creates a new promotional coupon code |
| `PATCH` | `/admin/coupons/:id/toggle` | Owner | Toggles coupon active status |
| `DELETE` | `/admin/coupons/:id` | Owner | Deletes a coupon |
| `GET` | `/admin/payment-config` | Owner | Lists all payment gateway configurations (masked credentials) |
| `POST` | `/admin/payment-config` | Owner | Creates or updates a payment gateway configuration (AES-256 encrypted) |
| `DELETE` | `/admin/payment-config/:id` | Owner | Deletes a payment gateway configuration |
| `POST` | `/admin/payment-config/:id/test` | Owner | Runs connection verification test for a gateway credentials |

### Swagger API Documentation
An interactive Swagger UI is built into the backend to view detailed API paths, parameters, schemas, and live test payload examples.
* **Swagger Documentation URL**: `http://localhost:3000/api-docs`
* **Raw OpenAPI Specification JSON**: `http://localhost:3000/openapi.json`

---

## Installation and Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **MongoDB** (Local instance or MongoDB Atlas URI)
* **Gemini API Key** (or compatible OpenAI keys)

---

### Quick Start (Recommended)
You can start both the backend server and the frontend React application concurrently using a single command from the project root directory:

```bash
# Install root dependencies
npm install

# Run backend and frontend concurrently
npm run dev
```

*This starts the Backend at **`http://localhost:3000`** and the Frontend at **`http://localhost:5173`**.*

---

### Manual Step-by-Step Run

#### 1️⃣ Step 1: Run the Backend
Navigate into the `Back-end` directory and initialize the server:

```bash
# Go to Back-end folder
cd Back-end

# Install dependencies
npm install

# Create/Update .env variables
# Copy configuration sample from environment section above into .env

# Run the server in development mode
npm start
```
*The server will boot up at **`http://localhost:3000`**.*

---

#### 2️⃣ Step 2: Run the Frontend
Open a new terminal session, navigate to the `Front-end` folder, and initialize Vite:

```bash
# Go to Front-end folder
cd Front-end

# Install dependencies
npm install

# Run the React application
npm run dev
```
*The React app will boot up at **`http://localhost:5173`**.*

---

### 3️⃣ Step 3: Install the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer Mode** using the toggle in the upper-right corner.
3. Click on the **Load unpacked** button in the upper-left corner.
4. Select the `chrome-extension/` directory of this repository.
5. Pins the extension to your browser toolbar. Refresh active LinkedIn or Indeed pages to allow the scraper script to load.

---

### Running Tests
The suite includes isolated unit and integration tests for both frontend and backend to check schema validation, regex escaping, and helper logic.
* **Backend Tests**: Run the following from the `Back-end` directory:
  ```bash
  node --test tests/*.test.js
  ```
* **Frontend Tests**: Run the following from the `Front-end` directory:
  ```bash
  node --test src/tests/*.test.js
  ```

---

## 🤝 Troubleshooting & Tips

* **Tesseract OCR**: When uploading an image version of a resume or JD, the backend uses Tesseract.js. It requires `eng.traineddata` (located in the backend root directory) to correctly extract English language characters.
* **CORS Settings**: The backend allows requests from `http://localhost:5173`, `http://localhost:5174`, `http://localhost:4173`, and Chrome Extensions (`chrome-extension://`). If you configure different local ports, make sure to add them to `index.js`.
* **OAuth Redirection**: Make sure redirect URIs are configured correctly in the Google Cloud Console and Azure Portal matching the values inside your backend `.env`.
