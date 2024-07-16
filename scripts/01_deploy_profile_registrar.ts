import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { ProfileRegistrar } from '../artifacts/ts'

const deployProfileRegistrar: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (deployer.account.group !== network.settings.primaryGroup) {
    return
  }

  const result = await deployer.deployContract(ProfileRegistrar, {
    initialFields: {
      registrarOwner: network.settings.registrarOwner,
      primaryRegistrar: deployer.getDeployContractResultFromGroup('PrimaryRegistrar', network.settings.primaryGroup)
        .contractInstance.contractId
    }
  })

  console.log(
    `ProfileRegistrar contract address: ${result.contractInstance.address}, contract id: ${result.contractInstance.contractId}`
  )
}

export default deployProfileRegistrar
