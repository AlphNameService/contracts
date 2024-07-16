/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  ExecutableScript,
  ExecuteScriptParams,
  ExecuteScriptResult,
  Script,
  SignerProvider,
  HexString,
} from "@alephium/web3";
import { default as BurnCredentialTokenScriptJson } from "../scripts/BurnCredentialToken.ral.json";
import { default as MintCredentialTokenScriptJson } from "../scripts/MintCredentialToken.ral.json";
import { default as RegisterPrimaryRecordScriptJson } from "../scripts/RegisterPrimaryRecord.ral.json";
import { default as RenewPrimaryRecordScriptJson } from "../scripts/RenewPrimaryRecord.ral.json";
import { default as SetProfileScriptJson } from "../scripts/SetProfile.ral.json";
import { default as TransferPrimaryRecordScriptJson } from "../scripts/TransferPrimaryRecord.ral.json";
import { default as WithdrawAlphScriptJson } from "../scripts/WithdrawAlph.ral.json";
import { Profile, AllStructs } from "./types";

export const BurnCredentialToken = new ExecutableScript<{
  registrar: HexString;
  name: HexString;
  credentialTokenId: HexString;
}>(Script.fromJson(BurnCredentialTokenScriptJson, "", AllStructs));

export const MintCredentialToken = new ExecutableScript<{
  registrar: HexString;
  name: HexString;
}>(Script.fromJson(MintCredentialTokenScriptJson, "", AllStructs));

export const RegisterPrimaryRecord = new ExecutableScript<{
  registrar: HexString;
  name: HexString;
  duration: bigint;
}>(Script.fromJson(RegisterPrimaryRecordScriptJson, "", AllStructs));

export const RenewPrimaryRecord = new ExecutableScript<{
  registrar: HexString;
  name: HexString;
  duration: bigint;
}>(Script.fromJson(RenewPrimaryRecordScriptJson, "", AllStructs));

export const SetProfile = new ExecutableScript<{
  registrar: HexString;
  profileOwner: Address;
  name: HexString;
  imgUri: HexString;
}>(Script.fromJson(SetProfileScriptJson, "", AllStructs));

export const TransferPrimaryRecord = new ExecutableScript<{
  registrar: HexString;
  profileRegistrar: HexString;
  name: HexString;
  toOwner: Address;
  toManager: Address;
}>(Script.fromJson(TransferPrimaryRecordScriptJson, "", AllStructs));

export const WithdrawAlph = new ExecutableScript<{
  registrar: HexString;
  amount: bigint;
}>(Script.fromJson(WithdrawAlphScriptJson, "", AllStructs));
