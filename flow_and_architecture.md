# Job Apply Application - System Architecture and Functional Flows

This document details the system architecture, component relationships, data flow models, and step-by-step transaction logs for each major feature of the Job Apply Application.

---

## 1. High-Level Architecture Diagram

The system follows a decoupled client-server architecture with external service integrations.

```mermaid
graph TD
    subgraph Client Tier
        Ext["Chrome Extension (Scraper & Auto-Fill)"]
        FE["React Single Page App (Vite + Tailwind + Redux)"]
    end

    subgraph Application Tier
        API["Express.js Backend Server (Port 3000)"]
        Cron["Cron Service (Follow-up Dispatcher)"]
    end

    subgraph Data Tier
        DB[("MongoDB (Mongoose ODM)")]
        LocalFS["Local File System (Uploads/Resumes)"]
    end

    subgraph External Services
        Gemini["Google Gemini AI API"]
        SMTP["Nodemailer (Recruiter Outreach)"]
        GoogleMS["OAuth 2.0 (Google & Microsoft)"]
        StripePay["Stripe API (International Checkout)"]
        Razorpay["Razorpay API (Domestic Checkout)"]
    end

    %% Client Interactions
    FE <-->|HTTPS API requests with cookies| API
    Ext -->|POST /jobs/import| API
    Ext <-->|GET/POST Form-fill endpoints| API

    %% Backend Interactions
    API <-->|Read/Write Schemas| DB
    API -->|Write files| LocalFS
    API <-->|Generative & Parsing tasks| Gemini
    API -->|Send email outreach| SMTP
    API <-->|Validate login & tokens| GoogleMS
    API <-->|Dynamic checkout sessions| StripePay
    API <-->|Order IDs & payments| Razorpay
```

---

## 2. Core Backend Architecture Components

### Security and Sessions
* **Passport.js & OAuth 2.0**: Manages token exchanges with Google and Microsoft.
* **HTTP-Only Cookies**: JWT is stored securely in the browser's `jaa_session_token` cookie. The cookie is flag-hardened (`httpOnly: true`, `secure: true`, `sameSite: 'Lax'`) to shield the session against Cross-Site Scripting (XSS) attacks.
* **AES-256-GCM Encryption**: Implemented in `encryptionService.js` using Node's crypto library. Symmetrically encrypts payment API secrets in MongoDB using a 32-byte hex `ENCRYPTION_KEY`.

### Middlewares
* `authMiddleware.js`: Extract JWT from cookie, verify signatures, populate `req.user`, enforce RBAC (Role-Based Access Control) for admin/owner endpoints.
* `countryMiddleware.js`: Geolocates request origin based on incoming headers (`CF-IPCountry`, `X-Country-Code`, or body override) to serve regional configurations.
* `rateLimiter.js`: Enforces global limits on APIs and dedicated transaction counts on resource-heavy Gemini AI routes.
* `subscriptionMiddleware.js`: Intercepts user requests to check usage quotas (e.g., job limits, AI credits) based on their subscription tier (Free vs. Pro).

---

## 3. Detailed Functional Flows

Here is the step-by-step transaction flow from the User Interface (Frontend) to the Server and Database (Backend) for each functionality.

### 3.1 Authentication and Onboarding Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Frontend
    participant BE as Express Backend
    participant Auth as OAuth Provider (Google/MS)
    participant DB as MongoDB

    User->>FE: Click "Login with Google"
    FE->>BE: GET /auth/google
    BE->>Auth: Redirect user to OAuth consent page
    Auth-->>User: Present Consent Screen
    User->>Auth: Approve permissions
    Auth->>BE: GET /auth/google/callback?code=AUTH_CODE
    BE->>Auth: Exchange code for Access Token & Profile
    Auth-->>BE: Return user profile info (Email, Name, ID)
    BE->>DB: Check if user exists in Database
    alt User is new
        BE->>DB: Create User record (Free Tier, referral tracking init)
    else User exists
        BE->>DB: Update last login timestamp
    end
    BE->>BE: Generate JWT token containing User ID & Role
    BE-->>FE: Set HTTP-Only Cookie "jaa_session_token" & Redirect to Dashboard
    FE->>BE: GET /auth/status (with cookie)
    BE-->>FE: Return User JSON profile (Redux stores state)
```

---

### 3.2 Resume Parser and Builder Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Frontend
    participant BE as Express Backend
    participant Gemini as Gemini AI API
    participant DB as MongoDB

    User->>FE: Drag & Drop Resume file (PDF/Docx)
    FE->>BE: POST /upload-resume (multipart/form-data)
    BE->>BE: Multer saves file to public/uploads/resumes
    alt Document has text content
        BE->>BE: Extract text content directly
    else Document is image-based
        BE->>BE: Run Tesseract OCR engine to extract raw text
    end
    BE->>Gemini: Prompt to parse raw text into structured JSON
    Gemini-->>BE: Return parsed structured JSON
    BE->>DB: Save parsed JSON to Resume schema linked to User
    BE-->>FE: Return parsed resume JSON structure
    User->>FE: Make edits on the WYSIWYG A4 editor
    FE->>FE: Debounce edits locally (1.5 seconds)
    FE->>BE: PUT /resume/update (body: JSON structure)
    BE->>DB: Update active Resume record
    BE-->>FE: Return success status
```

---

### 3.3 Job Scraper and JD Extractor Flow

This handles two ingress paths: dragging/dropping a JD document in the app, or scraping a job using the Chrome Extension on third-party job boards.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Ext as Chrome Extension
    participant FE as React Frontend
    participant BE as Express Backend
    participant Gemini as Gemini AI API
    participant DB as MongoDB

    alt Path A: Manual File Upload
        User->>FE: Upload JD Document (PDF/Docx)
        FE->>BE: POST /jobs/extract-jd (multipart/form-data)
        BE->>BE: Extract text content
    else Path B: Chrome Extension Scraper
        User->>Ext: Browse Job Board (LinkedIn/Indeed) and click Scrape
        Ext->>Ext: Read active DOM nodes
        Ext->>BE: POST /jobs/import (Payload: job URL, parsed title, raw description)
    end
    BE->>Gemini: Parse text and extract structured parameters (Title, Company, Recruiter Email, Skills)
    Gemini-->>BE: Return structured metadata JSON
    BE->>DB: Save new Job record linked to User
    BE-->>FE/Ext: Return success status and created Job object
```

---

### 3.4 ATS Match Scoring Flow

Calculates the matching index of the applicant's primary resume against a specific job description.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Dashboard
    participant BE as Express Backend
    participant DB as MongoDB
    participant Gemini as Gemini AI API

    User->>FE: Open Job Card detail view
    FE->>BE: POST /resume/ats-score (Payload: jobId)
    BE->>DB: Fetch User's Primary Resume & target Job Description
    DB-->>BE: Return both documents
    BE->>Gemini: Prompt with Resume + Job Description to analyze match score (0-100%) and missing keywords
    Gemini-->>BE: Return JSON containing score and feedback lists
    BE->>DB: Save computed score directly to Job record
    BE-->>FE: Return score payload (FE renders circular progress bar)
```

---

### 3.5 Email Outreach with Open and Click Tracking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Dashboard
    participant BE as Express Backend
    participant DB as MongoDB
    participant SMTP as SMTP Email Server
    actor Recruiter

    User->>FE: Click "Send Outreach"
    FE->>BE: POST /apply (Payload: jobId, template parameters, attachment ids)
    BE->>DB: Retrieve Job metadata, Recruiter details, and Resume files
    DB-->>BE: Return metadata
    BE->>BE: Generate unique tracking IDs for Open and Click redirects
    BE->>BE: Embed 1x1 tracking pixel: <img src="https://api/tracking/open/TRACKING_ID" />
    BE->>BE: Wrap portfolio/social links with redirect URL: https://api/tracking/click/TRACKING_ID?url=TARGET
    BE->>SMTP: Connect & send email (attaching PDF files)
    SMTP-->>Recruiter: Deliver email to inbox
    BE->>DB: Set Job status to "Sent"
    BE-->>FE: Update UI to "Sent" state
    
    Note over Recruiter: Recruiter opens outreach email
    Recruiter->>BE: Browser requests 1x1 image at /tracking/open/TRACKING_ID
    BE->>DB: Find Job by tracking ID, update status to "Opened"
    BE-->>Recruiter: Serve transparent 1x1 pixel image
    
    Note over Recruiter: Recruiter clicks link in email body
    Recruiter->>BE: Browser requests redirect at /tracking/click/TRACKING_ID
    BE->>DB: Log click event, update click analytics
    BE-->>Recruiter: HTTP 302 Redirect to user's real portfolio / LinkedIn URL
```

---

### 3.6 Recruiter Inbox and AI Suggested Replies Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Chat Interface
    participant BE as Express Backend
    participant DB as MongoDB
    participant Gemini as Gemini AI API
    actor Recruiter

    Recruiter-->>BE: Inbound email reply caught (IMAP/Webhook) or User logs message manually
    BE->>DB: Save message to Job conversation thread
    User->>FE: Open Recruiter Messages Drawer
    FE->>BE: GET /jobs/:id/messages
    BE->>DB: Query message list for target job
    DB-->>BE: Return message thread
    BE-->>FE: Return message thread history
    User->>FE: Click "Suggest AI Reply"
    FE->>BE: POST /jobs/:id/suggest-reply
    BE->>DB: Fetch last message + user resume context
    DB-->>BE: Return documents
    BE->>Gemini: Prompt with thread context + user resume to draft three styled reply options
    Gemini-->>BE: Return response suggestions (e.g., Accept Interview, Negotiate, Decline)
    BE-->>FE: Return options array
    User->>FE: Select an option, edit the draft, and click Send
    FE->>BE: POST /apply (outbox reply dispatch)
```

---

### 3.7 Interactive Interview Simulator Flow

Covers both written practice prep and speech-based audio grading.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Simulator (Voice / Text)
    participant BE as Express Backend
    participant DB as MongoDB
    participant Gemini as Gemini AI API

    User->>FE: Click "Start Practice Prep"
    FE->>BE: POST /jobs/:id/interview-prep
    BE->>DB: Fetch target Job Description
    DB-->>BE: Return Job details
    BE->>Gemini: Generate 8 tailored questions (Technical, Behavioral, Situational)
    Gemini-->>BE: Return questions array
    BE->>DB: Save generated questions list to Job record
    BE-->>FE: Return questions to UI list
    
    alt Path A: Text Scratchpad response
        User->>FE: Type response in text area & click "Submit"
        FE->>BE: POST /jobs/:id/grade-answer (Payload: question index, answer text)
    else Path B: Voice Response
        User->>FE: Speak response into microphone
        FE->>FE: Capture audio stream via Web Audio API & transcribe speech to text
        FE->>BE: POST /jobs/:id/grade-voice-answer (Payload: question index, transcription)
    end

    BE->>Gemini: Evaluate response based on target JD parameters (Grade 1-10, missing points, suggested answer)
    Gemini-->>BE: Return grading feedback JSON
    BE->>DB: Save grade & user notes to Job database entry
    BE-->>FE: Render score, feedback notes, and "model response" suggestion
```

---

### 3.8 Payment Routing and Dynamic Checkout Flow

Demonstrates the geolocation-aware gateway router resolving Stripe vs. Razorpay, and decryption of credentials.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React checkout
    participant BE as Express Backend
    participant Geo as Geolocation Middleware
    participant Enc as Encryption Service
    participant DB as MongoDB
    participant Gateway as Stripe / Razorpay API

    User->>FE: Click "Upgrade to Pro"
    FE->>BE: POST /payment/create-order (Payload: packageId, couponCode)
    BE->>Geo: Inspect headers to resolve country of origin (e.g., 'IN' or 'US')
    BE->>DB: Fetch active PaymentConfig document matching country code
    DB-->>BE: Return masked configuration record
    BE->>Enc: Decrypt stored credentials object (API secret keys) using ENCRYPTION_KEY
    Enc-->>BE: Return decrypted credentials
    
    alt User country matches 'IN' (Razorpay)
        BE->>Gateway: Create order (amount, currency: INR)
        Gateway-->>BE: Return razorpay_order_id
        BE-->>FE: Return Razorpay keys & order ID
        FE->>FE: Load Razorpay Checkout frame
        FE->>User: Complete payment in popup
        User-->>FE: Payment verification credentials returned
        FE->>BE: POST /payment/verify (HMAC check)
        BE->>DB: Update User subscription status to "pro"
        BE-->>FE: Display success screen
    else User country matches 'US' / 'INTL' (Stripe)
        BE->>Gateway: Create checkout session (currencies: USD, Price ID)
        Gateway-->>BE: Return checkout session URL
        BE-->>FE: Return session URL
        FE->>User: Redirect user to Stripe secure hosted payment page
        User->>Gateway: Submit credit card details & approve payment
        Gateway->>BE: POST /payment/webhook/stripe (event: checkout.session.completed)
        BE->>DB: Find user by metadata, upgrade subscription status to "pro"
        Gateway-->>FE: Redirect user back to local success callback URL
    end
```

---

### 3.9 System Administration and Configuration Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant FE as React Admin Panel
    participant BE as Express Backend
    participant Enc as Encryption Service
    participant DB as MongoDB
    participant Gateway as External Gateway APIs

    Admin->>FE: Input Stripe/Razorpay keys and click Save
    FE->>BE: POST /admin/payment-config (Payload: plain credentials, country settings)
    BE->>Enc: Encrypt plain fields (keySecret, webhookSecret, etc.)
    Enc-->>BE: Return AES-256-GCM formatted cipher strings
    BE->>DB: Save config document under gateway key (unique)
    BE-->>FE: Return success (credentials masked, e.g. "••••••••1234")
    
    Admin->>FE: Click "Verify Connection Test"
    FE->>BE: POST /admin/payment-config/:id/test
    BE->>DB: Query config document
    DB-->>BE: Return config record
    BE->>Enc: Decrypt API credentials
    Enc-->>BE: Return raw active keys
    BE->>Gateway: Send ping query (fetch order list or retrieve account profile)
    Gateway-->>BE: Return authentication confirmation
    BE-->>FE: Return success status (connection verified)
```

### 3.10 Unified Multi-Provider AI Settings and Fallback Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Settings Tab
    participant BE as Express Backend
    participant DB as MongoDB
    participant AISvc as AI Completion Service (geminiService)
    participant Provider as Gemini / OpenAI / Claude API

    User->>FE: Select preferred AI Model (e.g., Claude 3.5 Sonnet)
    FE->>BE: POST /auth/profile/update (Payload: aiModelPreference)
    BE->>DB: Save user's model preference in User record
    DB-->>BE: Success
    BE-->>FE: Return updated user profile (Redux synced)
    
    Note over User, Provider: Sometime later: User triggers an AI action (e.g., ATS Score)
    
    User->>FE: Click "ATS Score"
    FE->>BE: POST /resume/ats-score (No model specified in client payload)
    BE->>DB: Fetch user's profile and active resume
    DB-->>BE: Return profile details (with aiModelPreference = claude-3-5-sonnet)
    BE->>AISvc: Request completion (prompt, model = claude-3-5-sonnet)
    
    alt Attempt 1: Try Preferred Provider (Claude)
        AISvc->>Provider: POST /v1/messages (Anthropic API)
        Provider-->>AISvc: Return completion
    else Attempt 1 fails (API error or key missing)
        Note over AISvc, Provider: Attempt 1 failed! Auto failover to next provider.
        alt Attempt 2: Try Secondary Backup (Gemini)
            AISvc->>Provider: POST /v1/chat/completions (Gemini API)
            Provider-->>AISvc: Return completion
        else Attempt 2 fails
            Note over AISvc, Provider: Attempt 2 failed! Auto failover to tertiary backup.
            alt Attempt 3: Try Tertiary Backup (OpenAI)
                AISvc->>Provider: POST /v1/chat/completions (OpenAI API)
                Provider-->>AISvc: Return completion
            end
        end
    end
    
    AISvc->>BE: Return structured response
    BE->>DB: Update token consumption usage metrics
    BE-->>FE: Return AI result payload
```

---

## 4. Database Schema Relationships

```mermaid
erDiagram
    USER {
        ObjectId id PK
        string email
        string subscriptionTier "free | pro"
        string role "member | admin | owner"
        string aiModelPreference "gemini-2.5-flash | gpt-4o | claude-3-5-sonnet etc"
        string referrerId
    }

    RESUME {
        ObjectId id PK
        ObjectId userId FK
        boolean isPrimary
        string templateName
        json parsedData "Experience, Education, Skills"
    }

    JOB {
        ObjectId id PK
        ObjectId userId FK
        string title
        string company
        string status "Pending | Sent | Opened | Replied | Interviewing | Rejected"
        string atsScore
        string rawJobDescription
        json interviewQuestions
        json messages
    }

    PAYMENT_CONFIG {
        ObjectId id PK
        string gateway "stripe | razorpay"
        boolean isEnabled
        boolean isDefault
        string countries "ISO 3166-1 alpha-2 array"
        json credentials "Encrypted keyId, keySecret, webhookSecret"
    }

    PACKAGE {
        ObjectId id PK
        string title
        number priceINR
        number priceUSD
        boolean isActive
    }

    COUPON {
        ObjectId id PK
        string code
        string discountType "flat | percentage"
        number discountValue
        number maxUses
        number usedCount
        array usedBy "User ID log"
    }

    USER ||--o{ RESUME : "owns"
    USER ||--o{ JOB : "tracks"
    USER ||--o{ COUPON : "applies"
    JOB }|--|| RESUME : "evaluates against"
```
