import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CAHWJK26JM6OMZVXHED76NDKL7PJ7FH3EVFSDT54FENZVF2ERN6WLDRK",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAADkRvbmF0aW9uUmVjb3JkAAAAAAADAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
            "AAAAAQAAAAAAAAAAAAAAEENhbXBhaWduTWV0YWRhdGEAAAAHAAAAAAAAAAhjYXRlZ29yeQAAABEAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAEZ29hbAAAAAsAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAFdGl0bGUAAAAAAAAQ",
            "AAAAAAAAACFJbml0aWFsaXplIGNhbXBhaWduIHdpdGggbWV0YWRhdGEAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAABGdvYWwAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAACGNhdGVnb3J5AAAAEQAAAAAAAAAJeGxtX3Rva2VuAAAAAAAAEwAAAAA=",
            "AAAAAAAAABJEb25hdGUgdG8gY2FtcGFpZ24AAAAAAAZkb25hdGUAAAAAAAIAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAEhHZXQgdG90YWwgYW1vdW50IHlhbmcgc3VkYWggdGVya3VtcHVsCkZyb250ZW5kIGJpc2EgY2FsbCB0YW5wYSBwYXJhbWV0ZXIAAAAQZ2V0X3RvdGFsX3JhaXNlZAAAAAAAAAABAAAACw==",
            "AAAAAAAAAFBHZXQgYmVyYXBhIGJhbnlhayBzcGVjaWZpYyBkb25vciBzdWRhaCBkb25hdGUKRnJvbnRlbmQgcGVybHUgcGFzczogZG9ub3IgYWRkcmVzcwAAAAxnZXRfZG9uYXRpb24AAAABAAAAAAAAAAVkb25vcgAAAAAAABMAAAABAAAACw==",
            "AAAAAAAAAAAAAAATZ2V0X2lzX2FscmVhZHlfaW5pdAAAAAAAAAAAAQAAAAE=",
            "AAAAAAAAADtHZXQgY2FtcGFpZ24gZ29hbCBhbW91bnQKRnJvbnRlbmQgYmlzYSBjYWxsIHRhbnBhIHBhcmFtZXRlcgAAAAAIZ2V0X2dvYWwAAAAAAAAAAQAAAAs=",
            "AAAAAAAAAEJHZXQgY2FtcGFpZ24gZGVhZGxpbmUgdGltZXN0YW1wCkZyb250ZW5kIGJpc2EgY2FsbCB0YW5wYSBwYXJhbWV0ZXIAAAAAAAxnZXRfZGVhZGxpbmUAAAAAAAAAAQAAAAY=",
            "AAAAAAAAAFBDaGVjayBhcGFrYWggY2FtcGFpZ24gZ29hbCBzdWRhaCB0ZXJjYXBhaQpSZXR1cm5zIHRydWUgamlrYSB0b3RhbCByYWlzZWQgPj0gZ29hbAAAAA9pc19nb2FsX3JlYWNoZWQAAAAAAAAAAAEAAAAB",
            "AAAAAAAAAE5DaGVjayBhcGFrYWggY2FtcGFpZ24gc3VkYWggYmVyYWtoaXIKUmV0dXJucyB0cnVlIGppa2EgY3VycmVudCB0aW1lID4gZGVhZGxpbmUAAAAAAAhpc19lbmRlZAAAAAAAAAABAAAAAQ==",
            "AAAAAAAAAItDYWxjdWxhdGUgcHJvZ3Jlc3MgcGVyY2VudGFnZSBkYXJpIGNhbXBhaWduClJldHVybnMgKHRvdGFsX3JhaXNlZCAqIDEwMCkgLyBnb2FsClJldHVybnMgMCBqaWthIGdvYWwgYWRhbGFoIDAgKHVudHVrIGF2b2lkIGRpdmlzaW9uIGJ5IHplcm8pAAAAABdnZXRfcHJvZ3Jlc3NfcGVyY2VudGFnZQAAAAAAAAAAAQAAAAs=",
            "AAAAAAAAABFHZXQgb3duZXIgYWRkcmVzcwAAAAAAAAlnZXRfb3duZXIAAAAAAAAAAAAAAQAAABM=",
            "AAAAAAAAABVHZXQgY2FtcGFpZ24gbWV0YWRhdGEAAAAAAAAMZ2V0X21ldGFkYXRhAAAAAAAAAAEAAAfQAAAAEENhbXBhaWduTWV0YWRhdGE=",
            "AAAAAAAAAFNHZXQgZG9uYXRpb24gaGlzdG9yeSAocGFnaW5hdGVkKQpSZXR1cm5zIGxhc3QgTiBkb25hdGlvbnMgYmFzZWQgb24gbGltaXQgYW5kIG9mZnNldAAAAAAUZ2V0X2RvbmF0aW9uX2hpc3RvcnkAAAACAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAAAAAAABm9mZnNldAAAAAAABAAAAAEAAAPqAAAH0AAAAA5Eb25hdGlvblJlY29yZAAA",
            "AAAAAAAAADdXaXRoZHJhdyBmdW5kcyAtIE93bmVyIG9ubHksIGFmdGVyIGdvYWwgcmVhY2hlZCArIGVuZGVkAAAAAAh3aXRoZHJhdwAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAL",
            "AAAAAAAAAJFSZWZ1bmQgZnVuY3Rpb24gLSBhbGxvdyBkb25vcnMgdG8gZ2V0IHRoZWlyIG1vbmV5IGJhY2sKT25seSB3b3JrcyBpZiBjYW1wYWlnbiBlbmRlZCBBTkQgZ29hbCBOT1QgcmVhY2hlZApSZXR1cm5zIHRoZSBhbW91bnQgcmVmdW5kZWQgdG8gdGhlIGRvbm9yAAAAAAAABnJlZnVuZAAAAAAAAQAAAAAAAAAFZG9ub3IAAAAAAAATAAAAAQAAAAs="]), options);
        this.options = options;
    }
    fromJSON = {
        initialize: (this.txFromJSON),
        donate: (this.txFromJSON),
        get_total_raised: (this.txFromJSON),
        get_donation: (this.txFromJSON),
        get_is_already_init: (this.txFromJSON),
        get_goal: (this.txFromJSON),
        get_deadline: (this.txFromJSON),
        is_goal_reached: (this.txFromJSON),
        is_ended: (this.txFromJSON),
        get_progress_percentage: (this.txFromJSON),
        get_owner: (this.txFromJSON),
        get_metadata: (this.txFromJSON),
        get_donation_history: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        refund: (this.txFromJSON)
    };
}
