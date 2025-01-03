/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  EventSubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  SignExecuteContractMethodParams,
  SignExecuteScriptTxResult,
  signExecuteMethod,
  addStdIdToFields,
  encodeContractFields,
} from "@alephium/web3";
import { default as CredentialTokenContractJson } from "../CredentialToken.ral.json";
import { getContractByCodeHash } from "./contracts";
import { Profile, AllStructs } from "./types";

// Custom types for the contract
export namespace CredentialTokenTypes {
  export type Fields = {
    registrar: HexString;
    name: HexString;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getSymbol: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getName: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getDecimals: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getTotalSupply: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    destroy: {
      params: CallContractParams<{ refundAddress: Address }>;
      result: CallContractResult<null>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };

  export interface SignExecuteMethodTable {
    getSymbol: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getName: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getDecimals: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getTotalSupply: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    destroy: {
      params: SignExecuteContractMethodParams<{ refundAddress: Address }>;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<
  CredentialTokenInstance,
  CredentialTokenTypes.Fields
> {
  encodeFields(fields: CredentialTokenTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      AllStructs
    );
  }

  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as CredentialTokenTypes.Fields;
  }

  consts = {
    ErrorCodes: {
      InvalidCaller: BigInt("0"),
      InvalidArgs: BigInt("1"),
      ExpectAssetAddress: BigInt("2"),
      NameHasBeenRegistered: BigInt("3"),
      ContractNotExists: BigInt("4"),
      NameHasExpired: BigInt("5"),
      InvalidCredentialToken: BigInt("6"),
    },
  };

  at(address: string): CredentialTokenInstance {
    return new CredentialTokenInstance(address);
  }

  tests = {
    getSymbol: async (
      params: Omit<
        TestContractParamsWithoutMaps<CredentialTokenTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getSymbol", params, getContractByCodeHash);
    },
    getName: async (
      params: Omit<
        TestContractParamsWithoutMaps<CredentialTokenTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getName", params, getContractByCodeHash);
    },
    getDecimals: async (
      params: Omit<
        TestContractParamsWithoutMaps<CredentialTokenTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getDecimals", params, getContractByCodeHash);
    },
    getTotalSupply: async (
      params: Omit<
        TestContractParamsWithoutMaps<CredentialTokenTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getTotalSupply", params, getContractByCodeHash);
    },
    destroy: async (
      params: TestContractParamsWithoutMaps<
        CredentialTokenTypes.Fields,
        { refundAddress: Address }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "destroy", params, getContractByCodeHash);
    },
  };
}

// Use this object to test and deploy the contract
export const CredentialToken = new Factory(
  Contract.fromJson(
    CredentialTokenContractJson,
    "",
    "846ced74c6377aca27899118df7ee0b69b5bf4de329036d8f157a796a715bec6",
    AllStructs
  )
);

// Use this class to interact with the blockchain
export class CredentialTokenInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<CredentialTokenTypes.State> {
    return fetchContractState(CredentialToken, this);
  }

  view = {
    getSymbol: async (
      params?: CredentialTokenTypes.CallMethodParams<"getSymbol">
    ): Promise<CredentialTokenTypes.CallMethodResult<"getSymbol">> => {
      return callMethod(
        CredentialToken,
        this,
        "getSymbol",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getName: async (
      params?: CredentialTokenTypes.CallMethodParams<"getName">
    ): Promise<CredentialTokenTypes.CallMethodResult<"getName">> => {
      return callMethod(
        CredentialToken,
        this,
        "getName",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getDecimals: async (
      params?: CredentialTokenTypes.CallMethodParams<"getDecimals">
    ): Promise<CredentialTokenTypes.CallMethodResult<"getDecimals">> => {
      return callMethod(
        CredentialToken,
        this,
        "getDecimals",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getTotalSupply: async (
      params?: CredentialTokenTypes.CallMethodParams<"getTotalSupply">
    ): Promise<CredentialTokenTypes.CallMethodResult<"getTotalSupply">> => {
      return callMethod(
        CredentialToken,
        this,
        "getTotalSupply",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    destroy: async (
      params: CredentialTokenTypes.CallMethodParams<"destroy">
    ): Promise<CredentialTokenTypes.CallMethodResult<"destroy">> => {
      return callMethod(
        CredentialToken,
        this,
        "destroy",
        params,
        getContractByCodeHash
      );
    },
  };

  transact = {
    getSymbol: async (
      params: CredentialTokenTypes.SignExecuteMethodParams<"getSymbol">
    ): Promise<CredentialTokenTypes.SignExecuteMethodResult<"getSymbol">> => {
      return signExecuteMethod(CredentialToken, this, "getSymbol", params);
    },
    getName: async (
      params: CredentialTokenTypes.SignExecuteMethodParams<"getName">
    ): Promise<CredentialTokenTypes.SignExecuteMethodResult<"getName">> => {
      return signExecuteMethod(CredentialToken, this, "getName", params);
    },
    getDecimals: async (
      params: CredentialTokenTypes.SignExecuteMethodParams<"getDecimals">
    ): Promise<CredentialTokenTypes.SignExecuteMethodResult<"getDecimals">> => {
      return signExecuteMethod(CredentialToken, this, "getDecimals", params);
    },
    getTotalSupply: async (
      params: CredentialTokenTypes.SignExecuteMethodParams<"getTotalSupply">
    ): Promise<
      CredentialTokenTypes.SignExecuteMethodResult<"getTotalSupply">
    > => {
      return signExecuteMethod(CredentialToken, this, "getTotalSupply", params);
    },
    destroy: async (
      params: CredentialTokenTypes.SignExecuteMethodParams<"destroy">
    ): Promise<CredentialTokenTypes.SignExecuteMethodResult<"destroy">> => {
      return signExecuteMethod(CredentialToken, this, "destroy", params);
    },
  };

  async multicall<Calls extends CredentialTokenTypes.MultiCallParams>(
    calls: Calls
  ): Promise<CredentialTokenTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      CredentialToken,
      this,
      calls,
      getContractByCodeHash
    )) as CredentialTokenTypes.MultiCallResults<Calls>;
  }
}
