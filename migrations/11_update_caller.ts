import path = require('path');
import {
  NetworkConfig,
  deployScript,
  ProofsGenerator,
  invoke,
  transfer,
} from '@pepe-team/waves-sc-test-utils';
import { address, seedWithNonce, keyPair } from '@waves/ts-lib-crypto';
import { InvokeScriptCallStringArgument } from '@waves/ts-types';

export default async function (
  deployerSeed: string,
  appliedNonce: number,
  network: NetworkConfig,
  proofsGenerator: ProofsGenerator
) {
  const deployerPrivateKey = keyPair(deployerSeed).privateKey;
  const deployerAddress = address(deployerSeed, network.chainID);

  const multisigAddress = address(
    { publicKey: keyPair(seedWithNonce(deployerSeed, 2)).publicKey },
    network.chainID
  );
  console.log('Multisig contract address =', multisigAddress);

  const wrappedTokenBridgeContract = keyPair(seedWithNonce(deployerSeed, 5));
  const wrappedTokenBridgeContractAddress = address(
    { publicKey: wrappedTokenBridgeContract.publicKey },
    network.chainID
  );
  console.log(
    'Wrapped Token Bridge contract address =',
    wrappedTokenBridgeContractAddress
  );

  await transfer(
    {
      amount: network.invokeFee,
      recipient: wrappedTokenBridgeContractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  let callerContact;
  switch (network.name) {
    case 'mainnet':
      callerContact = ''; // TODO
      throw 'todo';
      break;
    case 'testnet':
      callerContact = '0x9f21bdd5198a6c8779bf034810ab00c9d058069e';
      break;
    default:
      callerContact = '0x9f21bdd5198a6c8779bf034810ab00c9d058069e';
  }

  await invoke(
    {
      dApp: wrappedTokenBridgeContractAddress,
      call: {
        function: 'updateCallerContract',
        args: [
          {
            type: 'string',
            value: callerContact,
          },
        ],
      },
    },
    wrappedTokenBridgeContract.privateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  return appliedNonce + 1;
}
