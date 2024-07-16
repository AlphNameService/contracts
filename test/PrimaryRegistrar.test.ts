import {
  addressFromContractId,
  binToHex,
  ContractState,
  DUST_AMOUNT,
  ONE_ALPH,
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
import { RecordTypes, PrimaryRegistrar, PrimaryRegistrarTypes, ProfileRegistrar } from '../artifacts/ts'
import { expectAssertionError } from '@alephium/web3-test'

function cost(duration: bigint): bigint {
  return DurationCost * duration
}

describe('test primary registrar', () => {
  const encoder = new TextEncoder()

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  })

  test('register', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    let name = encoder.encode('test.')
    let node = keccak256(name).slice(2)
    let recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

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

    const nodeOwner = randomAssetAddress()
    expectAssertionError(
      register(nodeOwner, MinRegistrationDuration, 0),
      registrarFixture.address,
      Number(ErrorCodes.InvalidArgs)
    )

    name = encoder.encode('te')
    expectAssertionError(
      register(nodeOwner, MinRegistrationDuration, 0),
      registrarFixture.address,
      Number(ErrorCodes.InvalidArgs)
    )

    name = encoder.encode('testing64mtesting64mtesting64mtesting64mtesting64mtesting64moreee')
    expectAssertionError(
      register(nodeOwner, MinRegistrationDuration, 0),
      registrarFixture.address,
      Number(ErrorCodes.InvalidArgs)
    )

    name = encoder.encode('test123')
    node = keccak256(name).slice(2)
    recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)
    const testResult = await register(nodeOwner, MinRegistrationDuration, 0)

    const registrarState = getContractState<PrimaryRegistrarTypes.Fields>(
      testResult.contracts,
      registrarFixture.contractId
    )
    expect(BigInt(registrarState.asset.alphAmount) - BigInt(defaultInitialAsset.alphAmount)).toEqual(
      RegisterCost + cost(MinRegistrationDuration)
    )

    const recordState = getContractState<RecordTypes.Fields>(testResult.contracts, recordId)
    expect(recordState.fields.owner).toEqual(nodeOwner)
    expect(recordState.fields.ttl).toEqual(MinRegistrationDuration)

    const event = testResult.events.find(
      (e) => e.name === 'NameRegistered'
    )! as PrimaryRegistrarTypes.NameRegisteredEvent
    expect(event.fields).toEqual({
      name: binToHex(name),
      owner: nodeOwner,
      manager: nodeOwner,
      ttl: MinRegistrationDuration
    })

    const record = createRecord(
      addressFromContractId(recordId),
      registrarFixture.contractId,
      randomAssetAddress(),
      100n
    )
    expectAssertionError(
      register(nodeOwner, MinRegistrationDuration, 99, [record]),
      registrarFixture.address,
      Number(ErrorCodes.NameHasBeenRegistered)
    )
  })

  test('register with an expired name', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)
    const prevNodeOwner = randomAssetAddress()
    const expiredRecord = createRecord(
      addressFromContractId(recordId),
      registrarFixture.contractId,
      prevNodeOwner,
      100n
    )
    async function register(nodeOwner: string, duration: bigint) {
      const alphAmount = RegisterCost + cost(duration) + DUST_AMOUNT + DefaultGasFee + StorageRent //alph(2) + cost(duration) + DUST_AMOUNT + DefaultGasFee
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
        existingContracts: [...registrarFixture.states(), expiredRecord],
        blockTimeStamp: 101
      })
    }

    const nodeOwner = randomAssetAddress()
    const testResult = await register(nodeOwner, MinRegistrationDuration)

    const registrarState = getContractState<PrimaryRegistrarTypes.Fields>(
      testResult.contracts,
      registrarFixture.contractId
    )
    expect(BigInt(registrarState.asset.alphAmount) - BigInt(defaultInitialAsset.alphAmount)).toEqual(
      RegisterCost + cost(MinRegistrationDuration) + StorageRent
    )

    const recordState = getContractState<RecordTypes.Fields>(testResult.contracts, recordId)
    expect(recordState.fields.owner).toEqual(nodeOwner)
    const ttl = MinRegistrationDuration + 101n
    expect(recordState.fields.ttl).toEqual(ttl)

    const event = testResult.events.find(
      (e) => e.name === 'NameRegistered'
    )! as PrimaryRegistrarTypes.NameRegisteredEvent
    expect(event.fields).toEqual({ name: binToHex(name), owner: nodeOwner, manager: nodeOwner, ttl })
  })

  test('renew', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    async function renew(nodeOwner: string, duration: bigint, currentTs: number, contractStates: ContractState[] = []) {
      const alphAmount = cost(duration) + DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.renew({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: nodeOwner, asset: { alphAmount } }],
        testArgs: {
          name: binToHex(name),
          payer: nodeOwner,
          duration: duration
        },
        existingContracts: [...registrarFixture.states(), ...contractStates],
        blockTimeStamp: currentTs
      })
    }

    function getRecord(ttl: bigint): ContractState {
      return createRecord(addressFromContractId(recordId), registrarFixture.contractId, nodeOwner, ttl)
    }

    const nodeOwner = randomAssetAddress()
    const record = getRecord(100n)
    expectAssertionError(
      renew(nodeOwner, MinRegistrationDuration, 101, [record]),
      registrarFixture.address,
      Number(ErrorCodes.NameHasExpired)
    )

    const testResult = await renew(nodeOwner, MinRegistrationDuration, 99, [record])
    const registrarState = getContractState<PrimaryRegistrarTypes.Fields>(
      testResult.contracts,
      registrarFixture.contractId
    )
    expect(BigInt(registrarState.asset.alphAmount) - BigInt(defaultInitialAsset.alphAmount)).toEqual(
      cost(MinRegistrationDuration)
    )

    const ttl = 100n + MinRegistrationDuration
    const recordState = getContractState<RecordTypes.Fields>(testResult.contracts, recordId)
    expect(recordState.fields.ttl).toEqual(ttl)

    const event = testResult.events.find((e) => e.name === 'NameRenewed')! as PrimaryRegistrarTypes.NameRenewedEvent
    expect(event.fields).toEqual({ name: binToHex(name), owner: nodeOwner, manager: nodeOwner, ttl })
  })

  test('purge expired name', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    async function purge(nodeOwner: string, currentTs: number, contractStates: ContractState[] = []) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.purgeExpiredName({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: nodeOwner, asset: { alphAmount } }],
        testArgs: {
          name: binToHex(name)
        },
        existingContracts: [...registrarFixture.states(), ...contractStates],
        blockTimeStamp: currentTs
      })
    }

    function getRecord(ttl: bigint): ContractState {
      return createRecord(addressFromContractId(recordId), registrarFixture.contractId, nodeOwner, ttl)
    }

    const nodeOwner = randomAssetAddress()
    const record = getRecord(100n)

    expectAssertionError(
      purge(nodeOwner, 99, [record]),
      registrarFixture.address,
      Number(ErrorCodes.NameHasBeenRegistered)
    )

    const testResult = await purge(nodeOwner, 101, [record])
    const event = testResult.events.find((e) => e.name === 'ContractDestroyed')
    expect(event?.fields.address).toEqual(record.address)
  })

  test('transfer', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    function getRecordAndCredentialToken(ttl: bigint, nodeOwner: string): [ContractState, ContractState] {
      const credentialTokenId = subContractId(
        registrarFixture.contractId,
        getCredentialTokenPath(node, BigInt(ttl)),
        DefaultGroup
      )
      const record = createRecord(addressFromContractId(recordId), registrarFixture.contractId, nodeOwner, ttl)
      const credentialToken = createCredentialToken(
        registrarFixture.contractId,
        binToHex(name),
        addressFromContractId(credentialTokenId)
      )
      return [record, credentialToken]
    }

    async function transfer(
      nodeOwner: string,
      toOwner: string,
      currentTs: number,
      credentialTokenId: string,
      contractStates: ContractState[] = []
    ) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.transfer({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: nodeOwner, asset: { alphAmount, tokens: [{ id: credentialTokenId, amount: 1n }] } }],
        testArgs: {
          name: binToHex(name),
          toOwner: toOwner,
          toManager: toOwner
        },
        existingContracts: [...registrarFixture.states(), ...contractStates],
        blockTimeStamp: currentTs
      })
    }

    function getRecord(ttl: bigint): ContractState {
      return createRecord(addressFromContractId(recordId), registrarFixture.contractId, owner, ttl)
    }

    const owner = randomAssetAddress()
    const toOwner = '19r12SR2DDqRSkyGgU39pHRj41zxRDk34otYysakRc3jt' // group 0 for sure
    const [record, credentialToken] = getRecordAndCredentialToken(100n, owner) // getRecord(100n)

    const testResult = await transfer(owner, toOwner, 99, credentialToken.contractId, [record, credentialToken])

    const recordState = getContractState<RecordTypes.Fields>(testResult.contracts, recordId)
    expect(recordState.fields.owner).toEqual(toOwner)
    expect(recordState.fields.manager).toEqual(toOwner)

    const event = testResult.events.find((e) => e.name === 'NameTransfer')! as PrimaryRegistrarTypes.NameRenewedEvent
    expect(event.fields).toEqual({
      name: binToHex(name),
      newOwner: toOwner,
      newManager: toOwner,
      oldOwner: owner,
      oldManager: owner,
      ttl: recordState.fields.ttl
    })
  })

  test('mint credential token', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)
    const nodeOwner = randomAssetAddress()

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    function getRecordAndCredentialToken(ttl: bigint): [ContractState, ContractState] {
      const credentialTokenId = subContractId(
        registrarFixture.contractId,
        getCredentialTokenPath(node, BigInt(ttl)),
        DefaultGroup
      )
      const record = createRecord(addressFromContractId(recordId), registrarFixture.contractId, nodeOwner, ttl)
      const credentialToken = createCredentialToken(
        registrarFixture.contractId,
        binToHex(name),
        addressFromContractId(credentialTokenId)
      )
      return [record, credentialToken]
    }

    async function mintCredentialToken(nodeOwner: string, currentTs: number, contractStates: ContractState[] = []) {
      return PrimaryRegistrar.tests.mintCredentialToken({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: nodeOwner, asset: { alphAmount: alph(2) } }],
        testArgs: {
          name: binToHex(name),
          payer: nodeOwner
        },
        existingContracts: [...registrarFixture.states(), ...contractStates],
        blockTimeStamp: currentTs
      })
    }

    const [record, credentialToken] = getRecordAndCredentialToken(100n)
    expectAssertionError(
      mintCredentialToken(randomAssetAddress(), 99, [record]),
      registrarFixture.address,
      Number(ErrorCodes.InvalidCaller)
    )
    expectAssertionError(
      mintCredentialToken(nodeOwner, 101, [record]),
      registrarFixture.address,
      Number(ErrorCodes.NameHasExpired)
    )

    const testResult = await mintCredentialToken(nodeOwner, 99, [record])
    const assetOutput = testResult.txOutputs.find((o) => o.address === nodeOwner)!
    expect(assetOutput.tokens).toEqual([{ id: credentialToken.contractId, amount: 1n }])
  })

  test('burn credential token', async () => {
    const registrarOwner = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)
    const nodeOwner = randomAssetAddress()

    const name = encoder.encode('test')
    const node = keccak256(name).slice(2)
    const recordId = subContractId(registrarFixture.contractId, node, DefaultGroup)

    function getRecordAndCredentialToken(ttl: bigint): [ContractState, ContractState] {
      const credentialTokenId = subContractId(
        registrarFixture.contractId,
        getCredentialTokenPath(node, BigInt(ttl)),
        DefaultGroup
      )
      const record = createRecord(addressFromContractId(recordId), registrarFixture.contractId, nodeOwner, ttl)
      const credentialToken = createCredentialToken(
        registrarFixture.contractId,
        binToHex(name),
        addressFromContractId(credentialTokenId)
      )
      return [record, credentialToken]
    }

    async function burnCredentialToken(
      nodeOwner: string,
      currentTs: number,
      credentialTokenId: string,
      contractStates: ContractState[] = []
    ) {
      return PrimaryRegistrar.tests.burnCredentialToken({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [
          { address: nodeOwner, asset: { alphAmount: alph(1), tokens: [{ id: credentialTokenId, amount: 1n }] } }
        ],
        testArgs: {
          name: binToHex(name),
          payer: nodeOwner
        },
        existingContracts: [...registrarFixture.states(), ...contractStates],
        blockTimeStamp: currentTs
      })
    }

    const [record, credentialToken] = getRecordAndCredentialToken(100n)
    expectAssertionError(
      burnCredentialToken(randomAssetAddress(), 99, credentialToken.contractId, [record, credentialToken]),
      registrarFixture.address,
      Number(ErrorCodes.InvalidCaller)
    )
    expectAssertionError(
      burnCredentialToken(nodeOwner, 101, credentialToken.contractId, [record, credentialToken]),
      registrarFixture.address,
      Number(ErrorCodes.NameHasExpired)
    )
    expectVMAssertionError(
      burnCredentialToken(nodeOwner, 99, credentialToken.contractId, [record, credentialToken]),
      'NotEnoughApprovedBalance'
    )

    const testResult = await burnCredentialToken(nodeOwner, 99, credentialToken.contractId, [record, credentialToken])
    expect(testResult.contracts.find((c) => c.contractId === credentialToken.contractId)).toEqual(undefined)
  })

  test('admin actions', async () => {
    const registrarOwner = randomAssetAddress()
    const randomAddress = randomAssetAddress()
    const registrarFixture = createPrimaryRegistrar(registrarOwner)

    async function updateOwner(owner: string, newOwner: string, contractStates: ContractState[] = []) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.updateRegistrarOwner({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: owner, asset: { alphAmount } }],
        testArgs: {
          newOwner: newOwner
        },
        existingContracts: [...contractStates]
      })
    }
    async function updateRegisterCost(owner: string, newCost: bigint, contractStates: ContractState[] = []) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.updateRegisterCost({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: owner, asset: { alphAmount } }],
        testArgs: {
          newRegisterCost: newCost
        },
        existingContracts: [...contractStates]
      })
    }
    async function updateDurationCost(owner: string, newCost: bigint, contractStates: ContractState[] = []) {
      const alphAmount = DUST_AMOUNT + DefaultGasFee
      return PrimaryRegistrar.tests.updateDurationCost({
        address: registrarFixture.address,
        initialFields: registrarFixture.initialFields(),
        initialAsset: defaultInitialAsset,
        inputAssets: [{ address: owner, asset: { alphAmount } }],
        testArgs: {
          newDurationCost: newCost
        },
        existingContracts: [...contractStates]
      })
    }

    expectAssertionError(
      updateOwner(randomAddress, randomAddress),
      registrarFixture.address,
      Number(ErrorCodes.InvalidCaller)
    )
    expectAssertionError(
      updateRegisterCost(randomAddress, 0n),
      registrarFixture.address,
      Number(ErrorCodes.InvalidCaller)
    )
    expectAssertionError(
      updateDurationCost(randomAddress, 0n),
      registrarFixture.address,
      Number(ErrorCodes.InvalidCaller)
    )

    const newDurationCost = 0n
    const durationCostResult = await updateDurationCost(registrarOwner, newDurationCost)
    const registrarStateDurationCost = getContractState<PrimaryRegistrarTypes.Fields>(
      durationCostResult.contracts,
      registrarFixture.contractId
    )
    expect(registrarStateDurationCost.fields.durationCost).toEqual(newDurationCost)

    expect(registrarStateDurationCost.fields.registerCost).toEqual(RegisterCost)
    const newRegisterCost = 0n
    const registerCostResult = await updateRegisterCost(registrarOwner, newRegisterCost)
    const registrarStateRegisterCost = getContractState<PrimaryRegistrarTypes.Fields>(
      registerCostResult.contracts,
      registrarFixture.contractId
    )
    expect(registrarStateRegisterCost.fields.registerCost).toEqual(newRegisterCost)

    const result = await updateOwner(registrarOwner, randomAddress)

    const registrarState = getContractState<PrimaryRegistrarTypes.Fields>(result.contracts, registrarFixture.contractId)
    expect(registrarState.fields.registrarOwner).toEqual(randomAddress)
  })
})
