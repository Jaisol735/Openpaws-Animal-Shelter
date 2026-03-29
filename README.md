## OpenPaws – Shelter Assessment & Placement Dashboard

OpenPaws is a small, full‑stack web app that helps animal shelters **quickly assess animals and decide safe, appropriate placements**.  
Staff can log in, search animals, complete a structured behavior/health assessment, and see a clear placement recommendation (with risk level and follow‑up actions) based on rules stored in the database.

The goal is to:
- **Standardize decisions** instead of relying only on memory or paper.
- **Keep animals and people safe** by tracking behavior, health, and risk.
- **Make the workflow simple** enough that any shelter staff member can use it after a short intro.

---

## 1. Frontend

**Stack**
- React + Vite (SPA, no routing library – simple internal page state).
- Tailwind CSS 4 with custom design tokens in `src/index.css`.
- Talks **only to the backend API**, never directly to Supabase.

**Key screens**
- `Login` – staff sign in.
- `Home` – main menu cards (New Assessment, Animals, Organization, Admin, Account).
- `Assessment` – 4‑step flow:
  1. Enter animal code.
  2. Confirm animal details and unlock assessment.
  3. Answer form questions (behavior, health, past risk).
  4. View recommended placement and risk level.
- `Animals` – adoption‑style cards showing animals and their past assessments.
- `Organization` – view staff list and roles.
- `Admin` – manage staff, animals, forms, rules, placements.
- `Account` – staff profile, role, and avatar.

**How the frontend talks to the backend**
- All requests go through `src/api.js`, which wraps `fetch`:
  - Base URL: `VITE_API_BASE` (defaults to `http://localhost:3000`).
  - JSON requests/responses.
  - Endpoints like:
    - `POST /api/login`
    - `GET /api/animals`
    - `GET /api/animals/:id/assessments`
    - `POST /api/assessments/submit`
    - `GET/POST/PUT/DELETE /api/admin/...`

**Running the frontend**
```bash
cd frontend
npm install
npm run dev
```
Then open `http://localhost:5173`.

---

## 2. Backend

**Stack**
- Node.js + Express.
- Supabase (PostgreSQL) as the database.
- `dotenv` for configuration, `cors` for frontend access, `bcrypt` for password security.

**Main entry**
- `backend/main.js`
  - Loads `.env`.
  - Configures CORS for `FRONTEND_URL` (default `http://localhost:5173`).
  - Registers all `/api/...` routes and starts the server on `PORT` (default `3000`).

**Services**
- `loginService`
  - `POST /api/login`
  - Looks up user (`users` table) by name.
  - Uses `bcrypt.compare` to check the plain password against the stored bcrypt hash.
- `organizationService`
  - Staff listing for non‑admin views.
- `animalService`
  - List/search animals.
  - Get assessments for a given animal.
- `assessmentService`
  - Create and update assessment sessions.
  - Save answers.
  - Lock/unlock assessments.
  - Compute and store scores / totals.
- `adminService`
  - Manage staff (`/api/admin/staff`).
    - On create: **hashes passwords with `bcrypt.hash` before inserting** into `users`.
  - Manage animals, forms, placement rules, placement options, and risks.
- `scoringService`
  - Given behavior, health, and past scores, computes:
    - total score,
    - matching placement rule,
    - risk level and recommended action.

**Running the backend**
```bash
cd backend
npm install
node main.js
```

Required `.env` (simplified):
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## 3. Supabase (Database Tables)

Supabase is used only by the **backend**. Key tables (taken from the screenshots / schema):

- **`animals`**
  - `id` (uuid, PK)
  - `animal_code` (varchar, unique identifier – shown to staff)
  - `species`, `breed`, `gender`
  - `image_url` (text)
  - `arrival_date` (timestamptz)
  - `created_at` (timestamptz)
  - `behavioral_score` (int)
  - `health_score` (int)
  - `past_score` (int)
  - `status` (text – e.g. locked/unlocked/adopted)
  - `placement` (text – e.g. “Adoption”, “Foster”, etc.)

- **`assessments`**
  - `id` (uuid, PK)
  - `animal_id` (uuid → `animals.id`)
  - `staff_id` (uuid → `users.id`)
  - `total_score` (int)
  - `recommendation` (text – chosen placement)
  - `reason` (text – explanation or notes)
  - `assessed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `behavioral_score` (int)
  - `health_score` (int)
  - `past_score` (int)

- **`assessment_answers`**
  - `id` (uuid, PK)
  - `assessment_id` (uuid → `assessments.id`)
  - `question_id` (text – matches question IDs in `form_schemas.schema`)
  - `answer` (text – may be free text or option label)
  - `score` (int – numeric contribution of the answer)
  - `created_at` (timestamptz)

- **`form_schemas`**
  - `id` (uuid, PK)
  - `form_name` (text)
  - `schema` (jsonb – list of questions, options, scores, required flags, etc.)
  - `version` (int)
  - `created_at` (timestamptz)

- **`placement_lookup`**
  - `placement` (text, PK)
  - `importance` (int – ranking to choose between options)
  - `description` (text)

- **`placement_rules`**
  - `id` (uuid, PK)
  - `rule_type` (text – e.g. “default”, “health‑priority”)
  - `min_score`, `max_score` (int)
  - `placement` (text – FK to `placement_lookup.placement`)
  - `risk_level` (text – “Low”, “Medium”, “High”)
  - `action_required` (text – e.g. “Behavior training required”)
  - `monitoring_level` (text – e.g. “Daily check‑ins”)
  - `reassessment_hours` (int)
  - `contract_duration_days` (int)
  - `created_at` (timestamp)

- **`users`**
  - `id` (uuid, PK)
  - `name` (text, required)
  - `email` (text)
  - `role` (text – `staff` or `admin`, more later)
  - `image_url` (text)
  - `created_at` (timestamptz)
  - `password` (text – bcrypt hash compatible with `crypt(..., gen_salt('bf'))`)

- **`risk_lookup`**
  - `risk_level` (text – e.g. “Low”, “Medium”, “High”)
  - `weight` (int – how strong this risk is when scoring)

---

## 4. Forms

Forms are **dynamic** and stored in the `form_schemas` table.  
Each row’s `schema` JSON describes a versioned form, including:
- Question IDs and text.
- Section/category (behavior vs health).
- Options (with labels and scores).
- Whether multiple answers are allowed.
- Whether a question is required.

When starting an assessment the backend:
1. Loads the **latest** form from `form_schemas` (highest `created_at`).
2. Sends the schema to the frontend.
3. The React `Assessment` page renders questions based on that schema.
4. When the user submits, the backend stores both:
   - summarized scores, and  
   - detailed answers in `assessment_answers`.

Because forms live in the database, admins can change or add questions without redeploying the frontend.

---

## 5. Rules

Rules control how scores become placements and risk levels.  
They are stored in:
- `placement_rules` – each row defines a score range and what should happen.
- `placement_lookup` – describes each placement type and importance.
- `risk_lookup` – labels and weights for risk levels.

Typical rule logic:
1. Combine `behavioral_score`, `health_score`, and `past_score` into `total_score`.
2. Find a rule where `min_score <= total_score <= max_score`.
3. Return:
   - `placement` (e.g. “Standard Adoption”, “Foster Only”, “Behavioral Program”).
   - `risk_level` (Low/Medium/High).
   - Any `action_required` (e.g. “Training needed before adoption”).
   - Suggested `monitoring_level` and `reassessment_hours`.

This makes the system **transparent** and easy to tune by just editing database rows.

---

## 6. Assumptions

**7.1 Animal code scanning**
- In a real shelter, staff will **scan an animal’s barcode** to fill in `animal_code`.
- For now, the app expects users to **type the code manually** on the Assessment screen, because there is no physical scanner integration yet.

**7.2 Roles and forms can grow**
- `role` is currently simple (`staff`, `admin`) but is designed to expand later (e.g. `vet`, `volunteer`, `behaviorist`).
- Forms are versioned and read from the database, so **more detailed forms** (or different forms for different species) can be added later without code changes.

Other implicit assumptions:
- All times are stored in UTC (Supabase defaults) and displayed in local time in the UI.
- Only authenticated staff can access the dashboard; authentication is handled by the backend using the `users` table.

---

## 7. How the website works (step‑by‑step)

Think of OpenPaws like a **smart notebook** for a shelter.

### 7.1 Logging in
1. Open the website in your browser.
2. On the **Login** page, type your **name** and **password**.
3. Click the big **blue Login button**.
4. If your details are correct, you go to the **Home** page with colorful cards.
### 7.2 Home page
On the Home page you see several big buttons (cards), for example:
- **New Assessment** – check how an animal is doing.
- **Animals** – see all animals and their past checks.
- **Organization** – see the people who work here.
- **Admin** (only for admins) – change staff, forms, and rules.
- **Account** – see your own information.

Click a card to go to that part of the app.

### 7.3 Doing a new assessment
1. From Home, click **New Assessment**.
2. You will see a box that says **“Animal Code”**.
3. Type the code written on the animal’s kennel card (later this could be scanned).
4. Click **Search**.
5. If the animal exists, you will see:
   - its code, species, breed, gender,
   - old scores from past checks.
6. Click **“Unlock & Start Assessment”**.
7. Now you go through 3 parts:
   - **Behavior questions** – how the animal acts.
   - **Health questions** – how healthy the animal is.
   - **Past score** – any serious history (bite history, illness, etc.).
8. For each question, choose the best answer (or several if allowed).
9. When you’re done, click the **Next** buttons for each part, then **Submit Assessment**.
10. The website:
    - adds up the scores,
    - looks at the rules,
    - shows a clear result:
      - behavior, health, and past scores,
      - **placement recommendation** (like “Adoption” or “Foster Only”),
      - **risk level** (Low / Medium / High),
      - any notes about what to do next.
11. Click **Back to Home** when you’re finished.

### 7.4 Looking at animals
1. From Home, click **Animals**.
2. You’ll see cards, one for each animal, with:
   - a picture,
   - species and breed,
   - gender,
   - code.
3. Click a card (or the **View Assessments** button) to see:
   - a list of assessments,
   - who did them,
   - when,
   - scores and placement.
4. Click **Back to Animals** or **Back to Home** when you’re done.

### 7.5 Organization (staff list)
1. Click **Organization**.
2. You see cards for each staff member:
   - name, email,
   - role badge (Admin / Staff),
   - picture if available.
3. This is a quick “who works here” view.

### 7.6 Admin area (for grown‑ups / power users)
Only admins see the **Admin** card.

Inside Admin there are different sections (tabs), such as:
- **Users** – add, change, or delete staff accounts.
  - When you create a new user, the password is **encrypted** before saving.
- **Animals** – add new animals or update existing ones.
- **Forms** – change the questions used in assessments.
- **Rules** – change how scores turn into placements and risk levels.
- **Placements / Risks** – manage lookup options used by the rules.

These screens are meant for shelter managers or project owners, not for kids.

---

## 8. Summary

OpenPaws connects:
- a **React/Tailwind frontend**,
- an **Express backend**, and
- a **Supabase database**

to give shelters an easy, rule‑based way to assess animals and decide where they should go.  
The system is designed to be **simple to use**, but **flexible to extend** with new roles, forms, and placement rules as the shelter’s needs grow.

