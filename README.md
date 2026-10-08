# CIBC Money Intelligence: Money Outlook

**An interactive iPhone prototype of a proposed Money Outlook capability inside a CIBC-style mobile banking app, delivered as three epics: Predict → Advise → Act.**

> **Unofficial concept prototype.** Built to support a Product Owner interview. It is not an official CIBC application and is not affiliated with or endorsed by CIBC. CIBC names and visual styling appear for illustration only. All people, accounts, merchants and amounts are fictional. The app makes no network calls, uses no credentials, and never moves real money.

---

## The idea in one screen

The current home feed has an **INSIGHTS** heading followed by an empty area. This prototype puts **Money Outlook** in that slot. It is a compact card that answers one question: *"How much can I safely spend before payday?"*

```
Safe to spend            $1,080        Until October 15
Current balance          $3,420
Upcoming expenses       −$1,840
Recommended buffer        −$500
```

Everything else in the feed (accounts, credit card, lending, promos, Help Centre, floating chat button and the Home / Move money / Advice / More tab bar) stays as it is in the existing app.

| Epic | What the client gets | Where in the app |
| --- | --- | --- |
| **1. Predict**: cash-flow forecasting | A 14-day forecast of income and bills, a transparent Safe-to-Spend amount, and controls to correct it | Home card → **View my outlook** |
| **2. Advise**: personalized guidance | Explainable, dismissible recommendations that respond to the forecast | Home card → **See recommendations** (also the **Advice** tab) |
| **3. Act**: smart financial actions | A savings transfer from a recommendation in a few taps, Smart Savings Rules that only *suggest*, and goal progress | **Move $200 to savings**, **Move money** tab |

---

## 3-minute demo script

1. **Home.** Scroll one flick. Money Outlook sits where Insights used to be, with Safe to Spend, the reconciliation, a 14-day chart you can tap or drag, and three intelligence bullets.
2. **Predict.** Tap **View my outlook**. Drag across the chart, switch between 7 and 14 days, tap **How was this calculated?** to show the formula and every assumption in a bottom sheet.
3. **Advise.** Go back and tap **See recommendations**. Open **Why am I seeing this?** on the $200 savings opportunity.
4. **Act.** Tap **Move $200 to savings** → **Review transfer** (shows every balance that changes) → **Confirm transfer**.
5. **Updated outlook.** Tap **Back to Home**. Safe to Spend animates from $1,080 to **$880**, chequing reads **$3,220.00**, savings **$12,600.00**, and the goal shows **50.4%**.

To replay: **More → Reset demo** (or **More → Demo Guide → Reset demo**).

Optional extras if there's time: edit the predicted Phone bill (Safe to Spend recalculates live), exclude StreamPlus, change the safety buffer, tap **Review upcoming expenses** on the shortfall card to see the expenses that drive the low point highlighted, or save a Smart Savings Rule and watch a rule-based suggestion appear in Advice.

---

## Run it on an iPhone with Expo Go

**You need**
- A computer with **Node.js 20.19.4+, 22.13+ or 24.3+** ([nodejs.org](https://nodejs.org), LTS recommended).
- An iPhone with **Expo Go** from the App Store. This project uses **Expo SDK 57**, which the current Expo Go supports.
- The phone and computer on the same Wi-Fi network.

**Steps**

```bash
npm install
npx expo start
```

1. A QR code appears in the terminal.
2. Open the iPhone **Camera** app, point it at the QR code, and tap the banner to open the project in **Expo Go**.
3. The first load bundles the app (about 30–60 seconds). After that, edits reload instantly.

If the phone can't reach your computer (corporate Wi-Fi, VPN, guest network), use a tunnel:

```bash
npx expo start --tunnel
```

**Optional web preview** (renders inside a phone-width column; the iPhone is the intended device):

```bash
npm run web
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server (scan the QR code with your iPhone) |
| `npm run web` | Start the dev server and open the web preview |
| `npm run typecheck` | TypeScript, strict mode, no emit |
| `npm run lint` | ESLint with `eslint-config-expo` (including React Compiler rules) |
| `npm test` | Jest unit tests for forecast arithmetic, recommendations and transfers |
| `npm run verify` | Typecheck, lint and test in one go |

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs typecheck, lint and tests on every push and pull request.

---

## How Safe to Spend is calculated

```
Safe to Spend = Current Balance − Upcoming Expenses − Safety Buffer
```

More precisely, Safe to Spend is the **most the client can spend today and still keep the safety buffer intact on every day until payday**. The forecast projects the chequing balance day by day and finds the lowest point:

```
Safe to Spend = lowest projected balance − buffer
              = current balance
                + income that arrives before the lowest point
                − expenses up to and including the lowest point
                − buffer
```

Rules this enforces (all covered by tests):

- **Income only counts if it arrives before the spending it would cover.** Payroll on October 15 arrives after every bill, so it isn't counted. Move payday earlier in the app and it starts protecting later bills.
- **Same-day conservatism.** Within a day, expenses are assumed to leave before income arrives.
- **No double counting.** Card purchases aren't forecast separately; only the scheduled Visa payment from chequing is. A transfer to savings lowers the chequing balance once and is never added as an upcoming expense.
- **Deterministic dates.** Everything is anchored to a configurable demo date (Thursday, October 1, 2026), never the device clock.
- **Exact money.** All amounts are integer cents.

### Demo data reconciliation

| Date | Item | Status | Amount | Projected balance |
| --- | --- | --- | ---: | ---: |
| Thu, Oct 1 | Current balance (CIBC Smart Account) | | | **$3,420.00** |
| Fri, Oct 2 | Rent | Scheduled | −$1,250.00 | $2,170.00 |
| Mon, Oct 5 | Internet | Confirmed | −$85.00 | $2,085.00 |
| Wed, Oct 7 | Phone | Predicted | −$75.00 | $2,010.00 |
| Fri, Oct 9 | StreamPlus subscription | Predicted | −$19.99 | $1,990.01 |
| Tue, Oct 13 | CIBC Visa payment | Scheduled | −$410.01 | **$1,580.00** (lowest) |
| Thu, Oct 15 | Payroll | Predicted | +$2,450.00 | $4,030.00 |

Upcoming expenses = 1,250 + 85 + 75 + 19.99 + 410.01 = **$1,840.00**.
Safe to Spend = 3,420 − 1,840 − 500 = **$1,080.00** (= lowest balance $1,580 − $500 buffer).
After the $200 transfer: chequing $3,220, Safe to Spend **$880**, savings $12,600, goal 12,600 / 25,000 = **50.4%**.

**Statuses**
- **Confirmed**: amount and date are known (for example from an eBill).
- **Scheduled**: set up by the client (scheduled e-Transfer, automatic payment).
- **Predicted**: detected from recurring history; the client can edit or exclude it.

---

## Epics, user stories and acceptance criteria

### Epic 1: Predict

| Story / criterion | How the prototype meets it |
| --- | --- |
| **US1** Recurring income and expenses identified automatically | Six recurring items with detection explanations ("Detected from 6 monthly payments…") |
| **US2** Projected balance before payday | 14-day interactive chart, lowest point, payday marker, daily readout |
| Forecast recalculates when a transaction is modified | Edit amount/date of predicted items with a live "Safe to spend would change" preview |
| Confirmed vs predicted activity is distinguishable | Status chips with icon, colour and border style, plus a legend |
| Calculations stay consistent | One forecast function feeds every screen; tests assert the arithmetic |
| Assumptions visible | **How was this calculated?** sheet and an assumptions card |
| Return home without losing changes | Single in-memory store for the session |
| Client controls | Edit, exclude/restore, change the buffer, 7- / 14-day view |

### Epic 2: Advise

| Story / criterion | How the prototype meets it |
| --- | --- |
| **US3** Warning about a projected shortfall | Shortfall card: a "watch" when the low point is below the client's usual; becomes an alert if the balance is forecast to dip below the buffer |
| **US4** Tailored recommendations | Shortfall, savings opportunity ($200 = 20% of Safe to Spend rounded down to $50), subscription insight, plus rule-based suggestions |
| Respond to forecast changes | Amounts and wording are derived from the live forecast (e.g. "$1,080" → "$880") |
| Show reasoning | **Why am I seeing this?** on every card |
| Dismissible, stays dismissed for the session | Dismiss with Undo; "Show again" restores |
| No guaranteed outcomes | Conditional wording plus a disclaimer; a test checks for guarantee language |
| Never suggest breaching the buffer | Suggestions are capped at Safe to Spend and hidden when the outlook is tight; a test sweeps buffers from $0 to $3,000 |

### Epic 3: Act

| Story / criterion | How the prototype meets it |
| --- | --- |
| **US5** Act on a recommendation immediately | Move $200 → Review → Confirm, three taps from the recommendation |
| **US6** Configure and control savings rules | Smart Savings Rules: threshold, amount, on/off, live preview against today's forecast, save |
| Transfers require confirmation | Separate review screen with a **Confirm transfer** step and processing state |
| Simulated transfers update all balances consistently | One reducer action updates chequing, savings (= goal), forecast and the recommendation |
| Goals reflect transfers | Animated progress 49.6% → 50.4% |
| Rules can be edited or disabled | Toggle plus Save; rules only create suggestions |
| No real transaction | All state is local and in memory; confirmations say "Simulated" |
| Clear confirmation and error feedback | Inline validation (over buffer, over balance, empty), toasts and a success screen with a confirmation number |

---

## Architecture

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19.2, TypeScript (strict) |
| Navigation | Expo Router: native stack for push transitions and swipe-back, plus a custom floating tab bar matching the reference app |
| Animation | React Native Reanimated 4 (press states, sheets, progress bars, success mark) and an animated count-up for balances |
| Gestures | React Native Gesture Handler (chart scrubbing, drag-to-dismiss sheets) |
| Charts | `react-native-svg` with `d3-shape` for curve generation |
| Haptics | `expo-haptics` (selection, impact, success; skipped on web) |
| State | One `useReducer` store ([`src/domain/reducer.ts`](src/domain/reducer.ts)); every figure on screen is derived from it |
| Tests | Jest via `jest-expo` |

```
src/
  app/                    Expo Router screens
    (tabs)/               Home, Move money, Advice, More
    outlook.tsx           Epic 1: forecast detail
    recommendations.tsx   Epic 2
    transfer*.tsx         Epic 3: amount → review → success
    savings-rules.tsx     Epic 3: Smart Savings Rules
    goal.tsx              Epic 3: goal progress
    demo-guide.tsx        Presenter aid (More → Demo Guide)
  domain/                 Pure TypeScript, no React
    mockData.ts           Single source of truth for demo data and the demo date
    forecast.ts           Daily projection, lowest point, Safe to Spend
    recommendations.ts    Recommendation engine and guardrails
    transfers.ts          Validation, preview, apply (idempotent)
    rules.ts              Smart Savings Rules validation and evaluation
    reducer.ts            All state transitions
    __tests__/            Unit tests
  components/             UI building blocks, sheets, chart, tab bar
  state/MoneyProvider.tsx React context exposing state plus derived forecast
  theme/tokens.ts         Colours, type scale, spacing
```

**Changing the demo:** edit [`src/domain/mockData.ts`](src/domain/mockData.ts). `DEMO_CONFIG.demoDate` moves "today"; recurring items, balances, the goal and the buffer are all defined there. Run `npm test` afterwards. The tests pin the interview numbers, so update them if you change the data on purpose.

**Design decisions**
- Bottom sheets are built on React Native `Modal` with Reanimated and Gesture Handler, so they behave the same in Expo Go and the web preview (grabber, drag to dismiss, tap outside, keyboard-aware).
- State is session-only. Relaunching starts a clean demo, which keeps interviews repeatable.
- The CIBC wordmark is drawn in code as an approximation, and the app icon is neutral. No official brand assets are bundled.

## Out of scope

Real account data, authentication, bank APIs, Interac e-Transfer, bill payments and card payments. **Pay card** explains that it's outside the prototype and links to the outlook instead of dead-ending.

## License

No license is specified. Add one before making the repository public if you want others to reuse the code.
