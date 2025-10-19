# Frontend Development Guide - Multi-Campaign Platform

## 🎉 Backend Complete Status

### ✅ Smart Contracts (Week 1) - DONE

**Factory Contract:**
- Address: `CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA`
- Functions: create_campaign, get_all_campaigns, get_campaign, get_campaigns_by_owner, get_campaign_count
- Status: Deployed & Tested ✅

**Campaign Contract:**
- Template Wasm Hash: `1d2ffcd587471c38c00b1bfa10c2baf26cd4147cef4b9703658d466c50c405f0`
- Test Instance: `CAHWJK26JM6OMZVXHED76NDKL7PJ7FH3EVFSDT54FENZVF2ERN6WLDRK`
- Functions: 15 (initialize, donate, withdraw, get_metadata, get_donation_history, refund, etc.)
- Status: Deployed & Tested ✅

**Test Campaign:**
- ID: 0
- Title: "Test Campaign"
- Goal: 10 XLM
- Status: Active

---

## 📦 Generated TypeScript Bindings

**Location:** `packages/`
- ✅ `packages/factory/` - Factory contract bindings
- ✅ `packages/campaign/` - Campaign contract bindings

**Built & Ready to use!**

---

## 🗂️ Frontend Structure

### Routes (React Router v7)
```
/                    → Homepage (campaigns list)
/create              → Create campaign form
/campaign/:id        → Campaign detail page
```

### Files Created

**1. Contract Constants**
- `app/lib/contracts.ts`
  - Factory & XLM addresses
  - Category list
  - Helper functions: xlmToStroops(), stroopsToXlm(), formatXlm()

**2. Routes**
- `app/routes.ts` - Routing configuration ✅
- `app/routes/home.new.tsx` - New homepage template ✅
- `app/routes/create.tsx` - TODO
- `app/routes/campaign.$id.tsx` - TODO

**3. Hooks (TODO)**
- `app/hooks/use-factory.ts` - Factory contract interactions
- `app/hooks/use-campaign.ts` - Campaign contract interactions
- `app/hooks/use-campaigns.ts` - Fetch & manage campaigns list

---

## 🚀 Next Steps to Complete Frontend

### Step 1: Replace Homepage
```bash
# Backup old home
mv app/routes/home.tsx app/routes/home.old.tsx

# Use new multi-campaign homepage
mv app/routes/home.new.tsx app/routes/home.tsx
```

### Step 2: Create Contract Hooks

**use-factory.ts** - Interact with Factory
```typescript
import { useWallet } from './use-wallet';
import * as Factory from '../../packages/factory';

export function useFactory() {
  const { address } = useWallet();

  // Create campaign
  // Get all campaigns
  // Get campaign by ID

  return { ... };
}
```

**use-campaigns.ts** - Fetch & cache campaigns
```typescript
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from factory
  // Fetch metadata for each campaign

  return { campaigns, loading, refetch };
}
```

### Step 3: Build Create Campaign Page

**app/routes/create.tsx**
- Form fields: title, description, goal, duration, category
- Duration picker (convert to deadline timestamp)
- Call factory.create_campaign()
- Redirect to /campaign/:id on success

### Step 4: Build Campaign Detail Page

**app/routes/campaign.$id.tsx**
- Left column: Campaign info + Donate/Withdraw form
- Right column: Progress + Stats + Donation History
- Call campaign.donate(), campaign.withdraw()

### Step 5: Connect Homepage to Real Data

Update `app/routes/home.tsx`:
- Use `useCampaigns()` hook
- Fetch real campaigns from factory
- Show progress, goal, deadline
- Filter by status (active/ended)

---

## 📝 Contract Usage Examples

### Factory Contract

```typescript
import * as Factory from '../../packages/factory';
import { CONTRACTS, xlmToStroops } from '~/lib/contracts';

const factoryClient = new Factory.Client({
  ...Factory.networks.testnet,
  contractId: CONTRACTS.FACTORY,
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// Create campaign
const campaignId = await factoryClient.create_campaign({
  owner: walletAddress,
  title: "My Campaign",
  description: "Description here",
  goal: xlmToStroops(100), // 100 XLM
  deadline: Math.floor(Date.now() / 1000) + 7 * 86400, // 7 days
  category: 'tech',
  xlm_token: CONTRACTS.XLM_TOKEN,
  campaign_wasm_hash: CONTRACTS.CAMPAIGN_WASM_HASH,
});

// Get all campaigns
const campaigns = await factoryClient.get_all_campaigns();
```

### Campaign Contract

```typescript
import * as Campaign from '../../packages/campaign';

const campaignClient = new Campaign.Client({
  ...Campaign.networks.testnet,
  contractId: campaignAddress,
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// Get metadata
const metadata = await campaignClient.get_metadata();

// Donate
await campaignClient.donate({
  donor: walletAddress,
  amount: xlmToStroops(5), // 5 XLM
});

// Withdraw (owner only)
await campaignClient.withdraw({
  owner: walletAddress,
});

// Get donation history
const history = await campaignClient.get_donation_history({
  limit: 20,
  offset: 0,
});
```

---

## 🧪 Testing Checklist

### Contract Tests (All Passing ✅)
- [x] 33 campaign contract tests
- [x] 3 factory contract tests
- [x] Test campaign created via factory

### Frontend Tests (TODO)
- [ ] Create campaign flow
- [ ] Homepage loads campaigns
- [ ] Campaign detail page works
- [ ] Donate flow
- [ ] Withdraw flow (owner)
- [ ] Refund flow (failed campaign)
- [ ] Filter campaigns (All/My/Active)

---

## 🔑 Important Notes

**Validation Rules:**
- Min goal: 10 XLM (enforced in contract)
- Min donation: 0.1 XLM (enforced in contract)
- Deadline must be in future
- Title max: 100 chars
- Description max: 500 chars

**Campaign States:**
- Active: Not ended, goal not reached
- Success: Goal reached
- Failed: Ended, goal not reached
- Withdrawn: Owner already withdrew funds

**Withdrawal Rules:**
- Only owner can withdraw
- Must wait until campaign ended
- Must have reached goal
- Can only withdraw once

**Refund Rules:**
- Available if campaign ended AND goal NOT reached
- Manual claim (donor triggers)
- Returns full donation amount

---

## 📊 Current Progress

**Week 1 (Smart Contracts):** ✅ 100% Complete
- Campaign contract upgraded
- Factory contract created
- Deployed to testnet
- All tests passing (36/36)
- Documentation complete

**Week 2 (Frontend):** 🔄 40% Complete
- [x] Routing structure
- [x] Contract bindings generated
- [x] Contract constants file
- [x] Homepage template created
- [ ] Contract hooks
- [ ] Create Campaign page
- [ ] Campaign Detail page
- [ ] Integration & testing

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Generate contract bindings (if needed)
stellar contract bindings typescript \
  --contract-id CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA \
  --network testnet \
  --output-dir ./packages/factory

# Test contract via CLI
stellar contract invoke \
  --id CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA \
  --source alice \
  --network testnet \
  -- get_all_campaigns
```

---

## 📖 Reference Links

- Factory Contract Explorer: https://stellar.expert/explorer/testnet/contract/CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA
- Campaign Template Explorer: https://stellar.expert/explorer/testnet/contract/CAHWJK26JM6OMZVXHED76NDKL7PJ7FH3EVFSDT54FENZVF2ERN6WLDRK
- Development Spec: `/DEVELOPMENT_SPEC.md`
- Stellar Docs: https://developers.stellar.org

---

**Status:** Ready for frontend development! 🎉

Backend is complete, bindings are generated, and template files are ready.
You can now build the remaining pages and connect to the deployed contracts.
