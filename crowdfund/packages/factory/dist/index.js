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
        contractId: "CAY6MSYRJCJLVLPNK2KESEEAIRCKZ7A3BCQTROCATKS5ZBFXUJSNSQIA",
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
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAADENhbXBhaWduSW5mbwAAAAYAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABA=",
            "AAAAAAAAADJDcmVhdGUgYSBuZXcgY2FtcGFpZ24gY29udHJhY3QKUmV0dXJucyBjYW1wYWlnbiBJRAAAAAAAD2NyZWF0ZV9jYW1wYWlnbgAAAAAIAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAEZ29hbAAAAAsAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAAIY2F0ZWdvcnkAAAARAAAAAAAAAAl4bG1fdG9rZW4AAAAAAAATAAAAAAAAABJjYW1wYWlnbl93YXNtX2hhc2gAAAAAA+4AAAAgAAAAAQAAAAY=",
            "AAAAAAAAABpHZXQgY2FtcGFpZ24gYWRkcmVzcyBieSBJRAAAAAAADGdldF9jYW1wYWlnbgAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAABM=",
            "AAAAAAAAAB9HZXQgYWxsIGNhbXBhaWducyB3aXRoIG1ldGFkYXRhAAAAABFnZXRfYWxsX2NhbXBhaWducwAAAAAAAAAAAAABAAAD6gAAB9AAAAAMQ2FtcGFpZ25JbmZv",
            "AAAAAAAAABZHZXQgY2FtcGFpZ25zIGJ5IG93bmVyAAAAAAAWZ2V0X2NhbXBhaWduc19ieV9vd25lcgAAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+oAAAAG",
            "AAAAAAAAABhHZXQgdG90YWwgY2FtcGFpZ24gY291bnQAAAASZ2V0X2NhbXBhaWduX2NvdW50AAAAAAAAAAAAAQAAAAY="]), options);
        this.options = options;
    }
    fromJSON = {
        create_campaign: (this.txFromJSON),
        get_campaign: (this.txFromJSON),
        get_all_campaigns: (this.txFromJSON),
        get_campaigns_by_owner: (this.txFromJSON),
        get_campaign_count: (this.txFromJSON)
    };
}
