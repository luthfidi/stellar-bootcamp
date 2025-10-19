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
    contractId: "CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA",
  }
} as const


export interface CampaignInfo {
  address: string;
  category: string;
  created_at: u64;
  id: u64;
  owner: string;
  title: string;
}

export interface Client {
  /**
   * Construct and simulate a create_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new campaign contract
   * Returns campaign ID
   */
  create_campaign: ({owner, title, description, goal, deadline, category, xlm_token, campaign_wasm_hash}: {owner: string, title: string, description: string, goal: i128, deadline: u64, category: string, xlm_token: string, campaign_wasm_hash: Buffer}, options?: {
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
   * Construct and simulate a get_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get campaign address by ID
   */
  get_campaign: ({id}: {id: u64}, options?: {
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
   * Construct and simulate a get_all_campaigns transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all campaigns with metadata
   */
  get_all_campaigns: (options?: {
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
  }) => Promise<AssembledTransaction<Array<CampaignInfo>>>

  /**
   * Construct and simulate a get_campaigns_by_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get campaigns by owner
   */
  get_campaigns_by_owner: ({owner}: {owner: string}, options?: {
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
  }) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_campaign_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total campaign count
   */
  get_campaign_count: (options?: {
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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAADENhbXBhaWduSW5mbwAAAAYAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABA=",
        "AAAAAAAAADJDcmVhdGUgYSBuZXcgY2FtcGFpZ24gY29udHJhY3QKUmV0dXJucyBjYW1wYWlnbiBJRAAAAAAAD2NyZWF0ZV9jYW1wYWlnbgAAAAAIAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAEZ29hbAAAAAsAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAAAAAAl4bG1fdG9rZW4AAAAAAAATAAAAAAAAABJjYW1wYWlnbl93YXNtX2hhc2gAAAAAA+4AAAAgAAAAAQAAAAY=",
        "AAAAAAAAABpHZXQgY2FtcGFpZ24gYWRkcmVzcyBieSBJRAAAAAAADGdldF9jYW1wYWlnbgAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAABM=",
        "AAAAAAAAAB9HZXQgYWxsIGNhbXBhaWducyB3aXRoIG1ldGFkYXRhAAAAABFnZXRfYWxsX2NhbXBhaWducwAAAAAAAAAAAAABAAAD6gAAB9AAAAAMQ2FtcGFpZ25JbmZv",
        "AAAAAAAAABZHZXQgY2FtcGFpZ25zIGJ5IG93bmVyAAAAAAAWZ2V0X2NhbXBhaWduc19ieV9vd25lcgAAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAABhHZXQgdG90YWwgY2FtcGFpZ24gY291bnQAAAASZ2V0X2NhbXBhaWduX2NvdW50AAAAAAAAAAAAAQAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    create_campaign: this.txFromJSON<u64>,
        get_campaign: this.txFromJSON<string>,
        get_all_campaigns: this.txFromJSON<Array<CampaignInfo>>,
        get_campaigns_by_owner: this.txFromJSON<Array<u64>>,
        get_campaign_count: this.txFromJSON<u64>
  }
}