import {
  Address,
  addressFromContractId,
  Asset,
  binToHex,
  contractIdFromAddress,
  ContractState,
  Fields,
  groupOfAddress,
  HexString,
  ONE_ALPH,
  subContractId
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'
import {
  PrimaryRegistrar,
  Record,
  RecordTypes,
  CredentialToken,
  CredentialTokenTypes,
  ProfileRegistrar
} from '../../artifacts/ts'
import { randomContractAddress } from '@alephium/web3-test'

export const defaultInitialAsset: Asset = {
  alphAmount: ONE_ALPH / 10n
}
export const GasPrice = 100000000000n
export const MaxGasPerTx = 5000000n //625000n
export const DefaultGasFee = GasPrice * MaxGasPerTx
export const DefaultGroup = 0
export const MaxTTL = 1n << 255n
export const MinRegistrationDuration = 2592000000n // 30 days
export const MaxRegistrationDuration = 157784630000n // 5 years
export const RegisterCost = ONE_ALPH
export const DurationCost = 38580247n
export const StorageRent = 100000000000000000n

export const ErrorCodes = PrimaryRegistrar.consts.ErrorCodes

export class ContractFixture<T extends Fields> {
  selfState: ContractState<T>
  dependencies: ContractState[]
  address: string
  contractId: string

  states(): ContractState[] {
    return this.dependencies.concat([this.selfState])
  }

  initialFields(): T {
    return this.selfState.fields
  }

  constructor(selfState: ContractState<T>, dependencies: ContractState[]) {
    this.selfState = selfState
    this.dependencies = dependencies
    this.address = selfState.address
    this.contractId = selfState.contractId
  }
}

export function createRecord(
  address: Address,
  registrar: string,
  owner = randomAssetAddress(),
  ttl = 0n
): ContractState<RecordTypes.Fields> {
  return Record.stateForTest(
    {
      registrar,
      owner,
      manager: owner,
      ttl
    },
    defaultInitialAsset,
    address
  )
}

export function createCredentialToken(
  registrar: HexString,
  name: HexString,
  address = randomContractAddress()
): ContractState<CredentialTokenTypes.Fields> {
  return CredentialToken.stateForTest({ registrar, name }, undefined, address)
}

export function subContractAddress(parentId: string, path: string, groupIndex: number): string {
  return addressFromContractId(subContractId(parentId, path, groupIndex))
}

export function createPrimaryRegistrar(owner: string) {
  const primaryRecordTemplate = createRecord(randomContractAddress(), '')
  const credentialTokenTemplate = createCredentialToken('', '')
  const state = PrimaryRegistrar.stateForTest(
    {
      registrarOwner: owner,
      recordTemplateId: primaryRecordTemplate.contractId,
      credentialTokenTemplateId: credentialTokenTemplate.contractId,
      minRegistrationDuration: MinRegistrationDuration,
      registerCost: RegisterCost,
      durationCost: DurationCost
    },
    defaultInitialAsset,
    '289pFwn5J66XEHsXhK7Le6YC6MY8WLGXwyxQeG4sUCQ9D'
  ) // group 0
  return new ContractFixture(state, [primaryRecordTemplate, credentialTokenTemplate])
}

export function createProfileRegistrar(primaryRegistrarAddress: string, owner: string) {
  const primaryRecordTemplate = createRecord(randomContractAddress(), '')
  const state = ProfileRegistrar.stateForTest(
    {
      registrarOwner: owner,
      primaryRegistrar: binToHex(contractIdFromAddress(primaryRegistrarAddress))
    },
    defaultInitialAsset
  )
  return new ContractFixture(state, [primaryRecordTemplate])
}

export function alph(num: number): bigint {
  return ONE_ALPH * BigInt(num)
}

export function randomAssetAddress(): string {
  const prefix = Buffer.from([0x00])
  const bytes = Buffer.concat([prefix, randomBytes(32)])
  return base58.encode(bytes)
}

export function getContractState<T extends Fields>(contracts: ContractState[], idOrAddress: string): ContractState<T> {
  return contracts.find((c) => c.contractId === idOrAddress || c.address === idOrAddress)! as ContractState<T>
}

export async function expectVMAssertionError(promise: Promise<any>, errorCode: string) {
  try {
    await promise
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message.startsWith(`[API Error] - VM execution error: ${errorCode}`)).toEqual(true)
      return
    }
    throw error
  }
}

export function getCredentialTokenPath(node: HexString, ttl: bigint): HexString {
  return node + ttl.toString(16).padStart(64, '0')
}

export function randomContractId(group = 0): string {
  const address = randomContractAddress()
  if (groupOfAddress(address) === group) return binToHex(contractIdFromAddress(address))
  return randomContractId(group)
}
