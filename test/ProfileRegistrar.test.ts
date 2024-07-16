import {
  addressFromContractId,
  binToHex,
  ContractState,
  DUST_AMOUNT,
  ONE_ALPH,
  stringToHex,
  subContractId,
  web3
} from '@alephium/web3'
import {
  alph,
  defaultInitialAsset,
  randomAssetAddress,
  DefaultGroup,
  createPrimaryRegistrar,
  getContractState,
  ErrorCodes,
  createRecord,
  DefaultGasFee,
  createCredentialToken,
  getCredentialTokenPath,
  expectVMAssertionError,
  MinRegistrationDuration,
  randomContractId,
  DurationCost,
  RegisterCost,
  StorageRent,
  createProfileRegistrar
} from './fixtures/ANSFixture'
import { keccak256 } from 'ethers'
import {
  RecordTypes,
  PrimaryRegistrar,
  PrimaryRegistrarTypes,
  ProfileRegistrar,
  ProfileRegistrarTypes
} from '../artifacts/ts'
import { expectAssertionError } from '@alephium/web3-test'
import { Profile } from '../artifacts/ts/types'

function cost(duration: bigint): bigint {
  return DurationCost * duration
}

describe('test profile registrar', () => {
  const encoder = new TextEncoder()

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  })

  test('all profile functions', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)
    const profileRegistrarFixture = createProfileRegistrar(registrarFixture.address, registrarOwner)

    const nameOwner = randomAssetAddress()
    const name = encoder.encode('profilename')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    async function register(
      nodeOwner: string,
      duration: bigint,
      currentTs: number,
      extraContracts: ContractState[] = []
    ) {
      const alphAmount = RegisterCost + cost(duration) + DUST_AMOUNT + DefaultGasFee + StorageRent
      return PrimaryRegistrar.tests.register({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: nodeOwner, asset: { alphAmount } }],
        testArgs: {
          name: binToHex(name),
          owner: nodeOwner,
          payer: nodeOwner,
          duration: duration
        },
        existingContracts: [...registrarFixture.states(), ...extraContracts],
        blockTimeStamp: currentTs
      })
    }

    const nameResult = await register(nameOwner, MinRegistrationDuration, 0)

    async function setProfile(owner: string, extraContracts: ContractState[] = []) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee + StorageRent
      return ProfileRegistrar.tests.setProfile({
        address: profileRegistrarFixture.address,
        initialFields: profileRegistrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: owner, asset: { alphAmount } }],
        testArgs: {
          profileOwner: owner,
          name: binToHex(name),
          imgUri: stringToHex('http://imgUri.com')
        },
        existingContracts: [...profileRegistrarFixture.states(), ...extraContracts],
        blockTimeStamp: 0
      })
    }

    async function removeProfile(
      owner: string,
      caller: string,
      extraContracts: ContractState[] = [],
      maps?: { profiles?: Map<string, Profile> | undefined }
    ) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee + StorageRent
      return ProfileRegistrar.tests.removeProfile({
        address: profileRegistrarFixture.address,
        initialFields: profileRegistrarFixture.initialFields(),
        initialMaps: maps,
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: caller, asset: { alphAmount } }],
        testArgs: {
          profileOwner: owner
        },
        existingContracts: [...profileRegistrarFixture.states(), ...extraContracts]
      })
    }

    const record = createRecord(addressFromContractId(recordId), registrarFixture.contractId, nameOwner, 100n)

    // Cannot set profile if not name owner
    expectAssertionError(
      setProfile(randomAssetAddress(), [record]),
      profileRegistrarFixture.address,
      Number(ProfileRegistrar.consts.ErrorCodes.InvalidCaller)
    )

    // Cannot remove profile if profile isn't created
    expectAssertionError(
      removeProfile(nameOwner, nameOwner, [record]),
      profileRegistrarFixture.address,
      Number(ProfileRegistrar.consts.ErrorCodes.InvalidProfileOwner)
    )

    const profileResult = await setProfile(nameOwner, [record])
    const event = profileResult.events.find((e) => e.name === 'ProfileSet')! as ProfileRegistrarTypes.ProfileSetEvent
    expect(event.fields).toEqual({
      owner: nameOwner,
      name: binToHex(name),
      imgUri: stringToHex('http://imgUri.com')
    })

    const profile = await ProfileRegistrar.tests.getProfile({
      address: profileRegistrarFixture.address,
      initialFields: profileRegistrarFixture.initialFields(),
      initialMaps: {
        profiles: new Map([[nameOwner, event.fields]])
      },
      testArgs: {
        profileOwner: nameOwner
      },
      existingContracts: [...profileRegistrarFixture.states(), record]
    })

    expect(profile.returns.name).toEqual(binToHex(name))
    expect(profile.returns.imgUri).toEqual(stringToHex('http://imgUri.com'))

    // random cannot remove profile
    expectAssertionError(
      removeProfile(nameOwner, randomAssetAddress(), [record]),
      profileRegistrarFixture.address,
      Number(ProfileRegistrar.consts.ErrorCodes.InvalidProfileOwner)
    )

    const removeProfileResult = await removeProfile(nameOwner, nameOwner, [record], {
      profiles: new Map([[nameOwner, event.fields]])
    })
    const removeEvent = removeProfileResult.events.find(
      (e) => e.name === 'ProfileRemoved'
    )! as ProfileRegistrarTypes.ProfileSetEvent
    expect(event.fields).toEqual({
      owner: nameOwner,
      name: binToHex(name),
      imgUri: stringToHex('http://imgUri.com')
    })
  })
})
