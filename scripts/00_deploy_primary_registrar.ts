import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { PrimaryRegistrar, PrimaryRegistrarTypes, Record, CredentialToken } from '../artifacts/ts'
import { ONE_ALPH } from '@alephium/web3'

const MinRegistrationDuration = 2592000000n // 30 days in ns
const RegisterCost = ONE_ALPH
const DurationCost = 38580247n

const deployPrimaryRegistrar: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (deployer.account.group !== network.settings.primaryGroup) {
    return
  }
  const recordTemplateResult = await deployer.deployContract(Record, {
    initialFields: Record.getInitialFieldsWithDefaultValues()
  })
  const credentialTokenTemplateResult = await deployer.deployContract(CredentialToken, {
    initialFields: { registrar: '', name: '' }
  })
  const initialFields: PrimaryRegistrarTypes.Fields = {
    registrarOwner: network.settings.registrarOwner,
    recordTemplateId: recordTemplateResult.contractInstance.contractId,
    credentialTokenTemplateId: credentialTokenTemplateResult.contractInstance.contractId,
    minRegistrationDuration: MinRegistrationDuration,
    registerCost: RegisterCost,
    durationCost: DurationCost
  }
  const result = await deployer.deployContract(PrimaryRegistrar, { initialFields: initialFields })
  console.log({ result, networkSettings: network.settings })
  console.log(
    `PrimaryRegistrar contract address: ${result.contractInstance.address}, contract id: ${result.contractInstance.contractId}`
  )
}

export default deployPrimaryRegistrar
