# Crowdfunding Platform - Development Specification

**Version:** 2.0
**Date:** October 2025
**Status:** Planning Phase

---

## 🎯 Overview

Upgrade dari single-campaign MVP menjadi multi-campaign platform dengan factory pattern. Users dapat create, browse, dan donate ke multiple campaigns.

---

## 📋 Approved Features

### **Phase 1: Smart Contracts**

#### **1. Factory Contract (NEW)**
Contract yang manage creation dan tracking semua campaigns.

**Functions:**
- `create_campaign(title, description, goal, deadline, category)` → campaign_id
- `get_campaign(campaign_id)` → campaign_address
- `get_all_campaigns()` → Vec<CampaignInfo>
- `get_campaigns_by_owner(owner)` → Vec<campaign_id>
- `get_campaign_count()` → u64

**Storage:**
- Campaign counter (u64)
- Map<campaign_id, campaign_address>
- Map<campaign_id, CampaignMetadata> (cache for listing)

**CampaignMetadata cached:**
- title: String
- category: Symbol
- owner: Address
- created_at: u64

---

#### **2. Campaign Contract (UPDATED)**

**New Functions:**
- `withdraw()` - Owner withdraw funds after goal reached + ended
- `get_metadata()` - Returns title, description, category
- `get_donation_history(limit, offset)` - Returns recent donations

**Updated Storage:**
- `CAMPAIGN_TITLE: String`
- `CAMPAIGN_DESCRIPTION: String`
- `CAMPAIGN_CATEGORY: Symbol`
- `DONATION_HISTORY: Vec<DonationRecord>`
- `WITHDRAWN: bool`

**DonationRecord Structure:**
```rust
struct DonationRecord {
    donor: Address,
    amount: i128,
    timestamp: u64,
}
```

**Existing Functions (unchanged):**
- initialize()
- donate()
- get_total_raised()
- get_donation()
- get_goal()
- get_deadline()
- is_goal_reached()
- is_ended()
- get_progress_percentage()
- get_owner()
- refund()

---

### **Phase 2: Frontend**

#### **1. Homepage - Campaigns List**
**Route:** `/`

**Layout:**
- Header with "Create Campaign" button
- Filter dropdown (All/My Campaigns/Active/Ended/Success/Failed)
- Grid of campaign cards (3 columns desktop, 1 mobile)

**Campaign Card Shows:**
- Title (truncated if > 60 chars)
- Description preview (first 100 chars)
- Progress bar + percentage
- "X / Y XLM raised"
- Time remaining or "Ended"
- Status badge (Active/Success/Failed/Ended)
- "OWNER" badge (if current wallet = owner)
- Category tag

**Data Source:**
- Fetch from Factory: `get_all_campaigns()`
- Client-side filtering

**Sort Order:**
- Default: Newest first (by created_at desc)

---

#### **2. Create Campaign Page**
**Route:** `/create`

**Form Fields:**
1. **Title** (required)
   - Input text
   - Max 100 characters
   - Validation: Non-empty

2. **Description** (required)
   - Textarea
   - Max 500 characters
   - Validation: Non-empty

3. **Goal Amount** (required)
   - Number input
   - Min: 10 XLM
   - Validation: >= 10

4. **Duration**
   - Number input
   - Unit dropdown: Minutes / Hours / Days
   - Converts to deadline timestamp

5. **Category** (required)
   - Dropdown:
     - Technology
     - Education
     - Health
     - Community
     - Environment
     - Arts & Culture
     - Emergency

**Flow:**
1. User fills form
2. Click "Create Campaign"
3. Calculate deadline: `current_timestamp + (duration_value * unit_multiplier)`
4. Call Factory: `create_campaign()`
5. Get new campaign_id
6. Redirect to `/campaign/:id`

---

#### **3. Campaign Detail Page**
**Route:** `/campaign/:id`

**Layout: 2 Columns**

**Left Column:**
- Back button
- Campaign title
- Owner address (truncated)
- Full description
- Category badge
- Created date
- Donate section (if active + not owner)
  - Amount input
  - "Donate Now" button
- Withdraw section (if owner + goal reached + ended)
  - Available amount
  - "Withdraw Funds" button

**Right Column:**
- Progress card
  - Percentage (large)
  - Progress bar
  - Raised / Goal
  - Time remaining
- Stats cards (3 grid)
  - Goal
  - Deadline
  - Status
- Donation History
  - Last 20 donations
  - Format: "GBVH...Q7ZO donated 20 XLM"
  - Relative time ("2 hours ago")
  - "Load More" button if > 20
- Owner address (truncated)

**Data Source:**
- Campaign contract: All getter functions
- Donation history: `get_donation_history()`

---

## 🏗️ Architecture Decisions

### **Contract Architecture**

**Pattern:** Factory + Individual Campaigns

```
Factory Contract
├─ Create new campaigns
├─ Track all campaigns
└─ Cache metadata for listing

Campaign Contract (multiple instances)
├─ Store campaign data
├─ Handle donations
├─ Track donors
└─ Manage withdrawals/refunds
```

**Why Factory Pattern?**
- Scalability: Each campaign isolated
- Security: Campaign logic separated
- Flexibility: Can upgrade campaign template
- Clear ownership: Each campaign has own state

---

### **Data Flow**

**Campaign Creation:**
```
Frontend → Factory.create_campaign()
         → Deploys new Campaign contract
         → Returns campaign_id
         → Frontend redirects to detail
```

**Campaign Listing:**
```
Frontend → Factory.get_all_campaigns()
         → Returns Vec<CampaignInfo>
         → Filter/sort in frontend
         → Display cards
```

**Donation:**
```
Frontend → Campaign.donate()
         → Emits event
         → Frontend refreshes
```

**Withdrawal:**
```
Frontend → Campaign.withdraw()
         → Transfer to owner
         → Mark as withdrawn
```

---

## 📊 Business Rules

### **Campaign Creation**
- ✅ Free to create
- ✅ Min goal: 10 XLM
- ✅ Title max: 100 chars
- ✅ Description max: 500 chars
- ✅ Duration: Flexible (minutes to days)
- ✅ Category: Required (predefined list)
- ❌ No photos/images
- ❌ Cannot edit after creation
- ❌ Cannot cancel after creation

### **Donations**
- ✅ Min amount: 0.1 XLM
- ✅ Multiple donations allowed per user
- ✅ Donations tracked in history
- ✅ Over-funding allowed (can go > 100%)
- ❌ No donations after deadline
- ❌ No donations to withdrawn campaigns

### **Withdrawals**
- ✅ Owner only
- ✅ Only after: goal reached AND ended
- ✅ Full amount only (not partial)
- ✅ One-time withdrawal
- ❌ Cannot withdraw if goal not reached
- ❌ Cannot withdraw before deadline

### **Refunds**
- ✅ Available if: ended AND goal NOT reached
- ✅ Manual claim (donor triggers)
- ✅ Returns full donation amount
- ❌ No refund if goal reached
- ❌ No refund if already withdrawn

---

## 🎨 UI/UX Specifications

### **Campaign States & Badges**

| State | Condition | Badge Color | Actions Available |
|-------|-----------|-------------|-------------------|
| Active | Not ended, goal not reached | Blue | Donate, Refund (n/a) |
| Success | Goal reached | Green | Donate (if not ended), Withdraw (if ended + owner) |
| Failed | Ended, goal not reached | Red | Refund (donors only) |
| Ended | Past deadline | Gray | Withdraw (owner if success), Refund (donors if failed) |
| Withdrawn | Owner withdrew | Purple | View only |

### **Time Display**

**Relative Time:**
- "X minutes ago"
- "X hours ago"
- "X days ago"
- "X days Y hours remaining"

**Tooltip:** Absolute timestamp on hover

### **Address Truncation**

**Format:** `GBVHOGR6...QQ7ZO` (first 8, last 6 chars)

**Tooltip:** Full address on hover

### **Progress Bar**

**Visual:**
- 0-50%: Blue gradient
- 51-99%: Blue to purple gradient
- 100%+: Purple to green gradient

**Animation:** Smooth width transition on update

---

## 🔧 Technical Specifications

### **Smart Contract**

**Language:** Rust
**SDK:** Soroban SDK v23.0.3
**Network:** Stellar Testnet

**Storage Limits:**
- Title: 100 bytes (String)
- Description: 500 bytes (String)
- Category: Symbol (max 32 bytes)
- Donation history: Vec (grows with donations)

**Gas Optimization:**
- Factory caches metadata (avoid multi-contract calls)
- Donation history paginated (limit queries)
- Events emitted for off-chain indexing

---

### **Frontend**

**Framework:** React Router v7
**Language:** TypeScript
**Styling:** Tailwind CSS + shadcn/ui
**State:** React Context + custom hooks

**Routes:**
```
/                    - Homepage (campaigns list)
/create              - Create campaign form
/campaign/:id        - Campaign detail page
```

**Key Libraries:**
- `@stellar/stellar-sdk` - Contract interaction
- Freighter wallet integration
- Date-fns - Time formatting
- React Router - Navigation

**State Management:**
```typescript
CampaignsContext {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  refetch: () => void
}

WalletContext {
  address: string
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}
```

---

## 📝 Contract Functions Reference

### **Factory Contract**

```rust
// Create new campaign
create_campaign(
  env: Env,
  owner: Address,
  title: String,
  description: String,
  goal: i128,
  deadline: u64,
  category: Symbol,
  xlm_token: Address
) -> u64  // returns campaign_id

// Get campaign address
get_campaign(env: Env, id: u64) -> Address

// Get all campaigns with metadata
get_all_campaigns(env: Env) -> Vec<CampaignInfo>

// Get campaigns by owner
get_campaigns_by_owner(env: Env, owner: Address) -> Vec<u64>

// Get total count
get_campaign_count(env: Env) -> u64
```

### **Campaign Contract (New/Updated)**

```rust
// NEW: Withdraw funds
withdraw(env: Env, owner: Address) -> i128

// NEW: Get metadata
get_metadata(env: Env) -> CampaignMetadata

// NEW: Get donation history
get_donation_history(
  env: Env,
  limit: u32,   // default 20
  offset: u32   // default 0
) -> Vec<DonationRecord>

// Updated: Initialize with metadata
initialize(
  env: Env,
  owner: Address,
  title: String,
  description: String,
  goal: i128,
  deadline: u64,
  category: Symbol,
  xlm_token: Address
)

// Existing functions remain unchanged
```

---

## 🧪 Testing Requirements

### **Contract Tests**

**Factory Contract:**
- ✅ Create campaign successfully
- ✅ Get campaign by ID
- ✅ List all campaigns
- ✅ Filter campaigns by owner
- ✅ Campaign counter increments
- ✅ Prevent duplicate IDs

**Campaign Contract:**
- ✅ Initialize with metadata
- ✅ Withdraw after goal + ended (success)
- ✅ Withdraw fails before deadline
- ✅ Withdraw fails if goal not reached
- ✅ Withdraw fails if not owner
- ✅ Donation history tracking
- ✅ Multiple donations per user
- ✅ Over-funding allowed
- ✅ All existing tests still pass (21 tests)

**Target:** 35+ tests total

---

### **Frontend Tests**

**Critical User Flows:**
1. Create campaign → redirect to detail
2. Donate to campaign → balance updates
3. Owner withdraw → funds received
4. Failed campaign → refund available
5. Filter campaigns → correct list
6. Campaign detail → all data loads

---

## 🚀 Implementation Roadmap

### **Week 1: Smart Contracts**

**Day 1-2: Factory Contract**
- Create contract structure
- Implement create_campaign()
- Implement getters
- Write tests (10+)

**Day 3-4: Update Campaign Contract**
- Add metadata storage
- Add withdraw function
- Add donation history
- Update initialize()
- Update tests (15+)

**Day 5: Deploy & Test**
- Deploy factory to testnet
- Create test campaigns
- Verify all functions
- Document contract IDs

---

### **Week 2: Frontend Development**

**Day 1-2: Core Setup**
- Setup routing (/create, /campaign/:id)
- Create context providers
- Build contract interaction hooks
- TypeScript bindings generation

**Day 3-4: UI Implementation**
- Homepage campaigns list
- Create campaign form
- Campaign detail page
- Donation history component

**Day 5: Integration & Polish**
- Connect all pages to contracts
- Loading states
- Error handling
- Responsive design
- Testing

---

### **Week 3: Testing & Deployment**

**Day 1-2: Testing**
- Manual testing all flows
- Fix bugs
- Edge case handling

**Day 3-4: Polish**
- UI improvements
- Performance optimization
- Documentation

**Day 5: Deploy**
- Deploy to Vercel
- Update README
- Announcement

---

## 📚 Key Data Structures

### **CampaignInfo (Factory)**
```rust
struct CampaignInfo {
    id: u64,
    address: Address,
    title: String,
    category: Symbol,
    owner: Address,
    created_at: u64,
}
```

### **CampaignMetadata (Campaign)**
```rust
struct CampaignMetadata {
    title: String,
    description: String,
    category: Symbol,
    owner: Address,
    goal: i128,
    deadline: u64,
    created_at: u64,
}
```

### **DonationRecord**
```rust
struct DonationRecord {
    donor: Address,
    amount: i128,
    timestamp: u64,
}
```

---

## 🔐 Security Considerations

### **Access Control**
- ✅ Only owner can withdraw
- ✅ Only owner can initialize
- ✅ Only donor can refund their own donation
- ✅ Factory deployment permissionless (anyone can create)

### **Validation**
- ✅ Goal >= 10 XLM (min requirement)
- ✅ Donation >= 0.1 XLM (prevent dust)
- ✅ Title/description length limits (prevent bloat)
- ✅ Deadline in future (sensible campaigns)
- ✅ Category from predefined list (data integrity)

### **State Management**
- ✅ Withdrawn flag prevents double withdrawal
- ✅ Refund checks campaign failure
- ✅ Immutable metadata (no bait-and-switch)

### **Edge Cases**
- ✅ Zero donations campaign (mark failed)
- ✅ Exact deadline timestamp (reject)
- ✅ Over-funding (allow, track percentage > 100%)
- ✅ Multiple donations from same user (aggregate)

---

## 🐛 Known Limitations

1. **No campaign editing** - Metadata immutable after creation
2. **No campaign cancellation** - Owner can't cancel
3. **Full withdrawal only** - Can't withdraw partial amounts
4. **No photo support** - Text-only campaigns
5. **Manual refund** - Donors must claim refund
6. **No pagination** - Load all campaigns (optimize later)
7. **No search** - Filter only (add later if needed)

---

## 📖 Reference Documentation

**Existing Contracts:**
- Token Contract: `CAPTNYMZVV7EXLAJQJQQ755FUTR62GUHKYPMWIAQONTCODY7JL3MZERJ`
- Old Crowdfund (single): `CBNB37OEW7XFHGEBMEIRSNZY3LYI4ZJQIXH43S2ES3VP65DMNVA66AWF`

**New Contracts (✅ Deployed on Testnet):**
- Factory Contract: `CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA`
  - Wasm Hash: `bfb54d9c4d9c3f1b844b75d805f5a54c363ee7af36304d2910db7747f4bd852c`
  - Explorer: https://stellar.expert/explorer/testnet/contract/CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA
- Campaign Template (Wasm): `1d2ffcd587471c38c00b1bfa10c2baf26cd4147cef4b9703658d466c50c405f0`
- Campaign Template (deployed instance for testing): `CCIA7NUYQ55XSI3QTV6M57JDM6X3Q6DDDACIDD7DRN7VR6LPGSPHC74Z`
  - Explorer: https://stellar.expert/explorer/testnet/contract/CCIA7NUYQ55XSI3QTV6M57JDM6X3Q6DDDACIDD7DRN7VR6LPGSPHC74Z

**Test Campaign (Created via Factory):**
- Campaign ID: `0`
- Campaign Address: `CAHWJK26JM6OMZVXHED76NDKL7PJ7FH3EVFSDT54FENZVF2ERN6WLDRK`
- Title: "Test Campaign"
- Goal: 10 XLM
- Status: Active ✅

**External Resources:**
- Workshop Notes: https://blockdev-stellar.pages.dev/
- Soroban Docs: https://soroban.stellar.org
- Stellar SDK: https://stellar.github.io/js-stellar-sdk/

---

## 🎯 Success Metrics

**MVP Success Criteria:**
- ✅ Factory contract deployed & working
- ✅ Can create multiple campaigns
- ✅ Can donate to any campaign
- ✅ Owner can withdraw after success
- ✅ Donors can refund after failure
- ✅ UI shows all campaigns
- ✅ All 35+ tests passing
- ✅ Responsive on mobile & desktop
- ✅ Deployed to production (Vercel)

---

## 💡 Future Enhancements (Post-MVP)

**Phase 3 (Optional):**
- Campaign search functionality
- Pagination for campaigns list
- Email/push notifications
- Campaign updates/comments section
- Multi-token support (USDC, etc)
- Milestone-based funding
- NFT rewards for donors
- Analytics dashboard
- Owner campaign management page
- Referral system

---

## 📞 Development Notes

**Important Context:**
- User wallet: `GBVHOGR6242EDPYER3WF6KPYFMYSTFVLSARUPAUH6LQI3KIUQ5XQQ7ZO`
- Network: Stellar Testnet
- Current codebase: `/my-token-project/` (contracts), `/crowdfund/` (frontend)

**Code Style:**
- Rust: Standard Soroban conventions
- TypeScript: Strict mode, explicit types
- React: Functional components, hooks
- CSS: Tailwind utility-first

**Git Workflow:**
- Branch: `feature/multi-campaign`
- Commit messages: Conventional commits format
- PR before merge to main

---

**Document Version:** 1.0
**Last Updated:** 19 Oct 2025
**Next Review:** After Phase 1 completion

---

*This spec is approved and ready for implementation. All design decisions have been confirmed.*

**Status: 🟢 Ready to Code**
