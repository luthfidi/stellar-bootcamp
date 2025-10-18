# Stellar Indonesia Bootcamp

Full-stack crowdfunding dApp on Stellar blockchain with Soroban smart contracts.

**Workshop Notes:** https://blockdev-stellar.pages.dev/

---

## Meet 1 - Deliverables

### 1. Token Contract
- **Contract:** [CAPTNYMZVV7EXLAJQJQQ755FUTR62GUHKYPMWIAQONTCODY7JL3MZERJ](https://stellar.expert/explorer/testnet/contract/CAPTNYMZVV7EXLAJQJQQ755FUTR62GUHKYPMWIAQONTCODY7JL3MZERJ)
- Features: Token initialization, transfers, balance tracking

### 2. Crowdfunding Contract
- **Contract:** [CBNB37OEW7XFHGEBMEIRSNZY3LYI4ZJQIXH43S2ES3VP65DMNVA66AWF](https://stellar.expert/explorer/testnet/contract/CBNB37OEW7XFHGEBMEIRSNZY3LYI4ZJQIXH43S2ES3VP65DMNVA66AWF)
- **Functions:** 12 total
  - Core: `initialize`, `donate`, `get_total_raised`, `get_donation`
  - Extended: `get_goal`, `get_deadline`, `is_goal_reached`, `is_ended`, `get_progress_percentage`
  - Bonus: `refund` (failed campaigns)

### 3. Frontend Integration
- **Live Demo:** https://fe-crowdfun.vercel.app/
- React Router + TypeScript + Stellar SDK + Freighter Wallet
- Features: Campaign stats, progress tracking, donations, refunds

---

## Project Structure

```
stellar-bootcamp/
├── my-token-project/     # Smart Contracts (Rust)
│   └── contracts/
│       ├── token/
│       └── crowdfunding/
└── crowdfund/            # Frontend (React)
    ├── app/
    └── packages/         # Contract bindings
```

---

## Quick Start

### Build Contracts
```bash
cd my-token-project
stellar contract build
```

### Run Frontend
```bash
cd crowdfund
npm install
npm run dev
```

---

## Tech Stack

**Contracts:** Rust, Soroban SDK v23.0.3
**Frontend:** React Router v7, TypeScript, Tailwind CSS
**Network:** Stellar Testnet
**Wallet:** Freighter

---

## Testing

```bash
cd my-token-project/contracts/crowdfunding
cargo test  # 21/21 tests passed ✅
```

---

Built during Stellar Indonesia Bootcamp 🚀
