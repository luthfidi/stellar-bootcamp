import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBNB37OEW7XFHGEBMEIRSNZY3LYI4ZJQIXH43S2ES3VP65DMNVA66AWF",
  }
} as const


export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize campaign baru dengan goal, deadline, dan XLM token address
   * Frontend perlu pass: owner address, goal (in stroops), deadline (unix timestamp), xlm_token (address)
   */
  initialize: ({owner, goal, deadline, xlm_token}: {owner: string, goal: i128, deadline: u64, xlm_token: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a donate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Donate ke campaign menggunakan XLM token transfer
   * Frontend perlu pass: donor address, amount (stroops)
   */
  donate: ({donor, amount}: {donor: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_total_raised transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total amount yang sudah terkumpul
   * Frontend bisa call tanpa parameter
   */
  get_total_raised: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_donation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get berapa banyak specific donor sudah donate
   * Frontend perlu pass: donor address
   */
  get_donation: ({donor}: {donor: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_is_already_init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_is_already_init: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_goal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get campaign goal amount
   * Frontend bisa call tanpa parameter
   */
  get_goal: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_deadline transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get campaign deadline timestamp
   * Frontend bisa call tanpa parameter
   */
  get_deadline: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a is_goal_reached transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check apakah campaign goal sudah tercapai
   * Returns true jika total raised >= goal
   */
  is_goal_reached: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a is_ended transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check apakah campaign sudah berakhir
   * Returns true jika current time > deadline
   */
  is_ended: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_progress_percentage transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate progress percentage dari campaign
   * Returns (total_raised * 100) / goal
   * Returns 0 jika goal adalah 0 (untuk avoid division by zero)
   */
  get_progress_percentage: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get owner address
   * Frontend bisa call untuk check siapa owner campaign
   */
  get_owner: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Refund function - allow donors to get their money back
   * Only works if campaign ended AND goal NOT reached
   * Returns the amount refunded to the donor
   */
  refund: ({donor}: {donor: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAKtJbml0aWFsaXplIGNhbXBhaWduIGJhcnUgZGVuZ2FuIGdvYWwsIGRlYWRsaW5lLCBkYW4gWExNIHRva2VuIGFkZHJlc3MKRnJvbnRlbmQgcGVybHUgcGFzczogb3duZXIgYWRkcmVzcywgZ29hbCAoaW4gc3Ryb29wcyksIGRlYWRsaW5lICh1bml4IHRpbWVzdGFtcCksIHhsbV90b2tlbiAoYWRkcmVzcykAAAAACmluaXRpYWxpemUAAAAAAAQAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAEZ29hbAAAAAsAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAAJeGxtX3Rva2VuAAAAAAAAEwAAAAA=",
        "AAAAAAAAAGZEb25hdGUga2UgY2FtcGFpZ24gbWVuZ2d1bmFrYW4gWExNIHRva2VuIHRyYW5zZmVyCkZyb250ZW5kIHBlcmx1IHBhc3M6IGRvbm9yIGFkZHJlc3MsIGFtb3VudCAoc3Ryb29wcykAAAAAAAZkb25hdGUAAAAAAAIAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAEhHZXQgdG90YWwgYW1vdW50IHlhbmcgc3VkYWggdGVya3VtcHVsCkZyb250ZW5kIGJpc2EgY2FsbCB0YW5wYSBwYXJhbWV0ZXIAAAAQZ2V0X3RvdGFsX3JhaXNlZAAAAAAAAAABAAAACw==",
        "AAAAAAAAAFBHZXQgYmVyYXBhIGJhbnlhayBzcGVjaWZpYyBkb25vciBzdWRhaCBkb25hdGUKRnJvbnRlbmQgcGVybHUgcGFzczogZG9ub3IgYWRkcmVzcwAAAAxnZXRfZG9uYXRpb24AAAABAAAAAAAAAAVkb25vcgAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAATZ2V0X2lzX2FscmVhZHlfaW5pdAAAAAAAAAAAAQAAAAE=",
        "AAAAAAAAADtHZXQgY2FtcGFpZ24gZ29hbCBhbW91bnQKRnJvbnRlbmQgYmlzYSBjYWxsIHRhbnBhIHBhcmFtZXRlcgAAAAAIZ2V0X2dvYWwAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAEJHZXQgY2FtcGFpZ24gZGVhZGxpbmUgdGltZXN0YW1wCkZyb250ZW5kIGJpc2EgY2FsbCB0YW5wYSBwYXJhbWV0ZXIAAAAAAAxnZXRfZGVhZGxpbmUAAAAAAAAAAQAAAAY=",
        "AAAAAAAAAFBDaGVjayBhcGFrYWggY2FtcGFpZ24gZ29hbCBzdWRhaCB0ZXJjYXBhaQpSZXR1cm5zIHRydWUgamlrYSB0b3RhbCByYWlzZWQgPj0gZ29hbAAAAA9pc19nb2FsX3JlYWNoZWQAAAAAAAAAAAEAAAAB",
        "AAAAAAAAAE5DaGVjayBhcGFrYWggY2FtcGFpZ24gc3VkYWggYmVyYWtoaXIKUmV0dXJucyB0cnVlIGppa2EgY3VycmVudCB0aW1lID4gZGVhZGxpbmUAAAAAAAhpc19lbmRlZAAAAAAAAAABAAAAAQ==",
        "AAAAAAAAAItDYWxjdWxhdGUgcHJvZ3Jlc3MgcGVyY2VudGFnZSBkYXJpIGNhbXBhaWduClJldHVybnMgKHRvdGFsX3JhaXNlZCAqIDEwMCkgLyBnb2FsClJldHVybnMgMCBqaWthIGdvYWwgYWRhbGFoIDAgKHVudHVrIGF2b2lkIGRpdmlzaW9uIGJ5IHplcm8pAAAAABdnZXRfcHJvZ3Jlc3NfcGVyY2VudGFnZQAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAEVHZXQgb3duZXIgYWRkcmVzcwpGcm9udGVuZCBiaXNhIGNhbGwgdW50dWsgY2hlY2sgc2lhcGEgb3duZXIgY2FtcGFpZ24AAAAAAAAJZ2V0X293bmVyAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAJFSZWZ1bmQgZnVuY3Rpb24gLSBhbGxvdyBkb25vcnMgdG8gZ2V0IHRoZWlyIG1vbmV5IGJhY2sKT25seSB3b3JrcyBpZiBjYW1wYWlnbiBlbmRlZCBBTkQgZ29hbCBOT1QgcmVhY2hlZApSZXR1cm5zIHRoZSBhbW91bnQgcmVmdW5kZWQgdG8gdGhlIGRvbm9yAAAAAAAABnJlZnVuZAAAAAAAAQAAAAAAAAAFZG9ub3IAAAAAAAATAAAAAQAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        donate: this.txFromJSON<null>,
        get_total_raised: this.txFromJSON<i128>,
        get_donation: this.txFromJSON<i128>,
        get_is_already_init: this.txFromJSON<boolean>,
        get_goal: this.txFromJSON<i128>,
        get_deadline: this.txFromJSON<u64>,
        is_goal_reached: this.txFromJSON<boolean>,
        is_ended: this.txFromJSON<boolean>,
        get_progress_percentage: this.txFromJSON<i128>,
        get_owner: this.txFromJSON<string>,
        refund: this.txFromJSON<i128>
  }
}