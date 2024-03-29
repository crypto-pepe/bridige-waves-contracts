import path = require('path');
import {
  NetworkConfig,
  deployScript,
  ProofsGenerator,
  invoke,
  transfer,
} from '@pepe-team/waves-sc-test-utils';
import { address, seedWithNonce, keyPair } from '@waves/ts-lib-crypto';

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

  const tokenContract = keyPair(seedWithNonce(deployerSeed, 4));
  const tokenContractAddress = address(
    { publicKey: tokenContract.publicKey },
    network.chainID
  );
  console.log(
    'ETH-Ethereum-PPT token contract address =',
    tokenContractAddress
  );

  const wrappedTokenBridgeContract = keyPair(seedWithNonce(deployerSeed, 5));
  const wrappedTokenBridgeContractAddress = address(
    { publicKey: wrappedTokenBridgeContract.publicKey },
    network.chainID
  );
  console.log(
    'Wrapped Token Bridge contract address =',
    wrappedTokenBridgeContractAddress
  );

  const collectorFeeContract = keyPair(seedWithNonce(deployerSeed, 6));
  const collectorFeeContractAddress = address(
    { publicKey: collectorFeeContract.publicKey },
    network.chainID
  );
  console.log('Collector fee contract address =', collectorFeeContractAddress);

  const tokenEVMAdapterContract = keyPair(seedWithNonce(deployerSeed, 7));
  const tokenEVMAdapterContractAddress = address(
    { publicKey: tokenEVMAdapterContract.publicKey },
    network.chainID
  );
  console.log(
    'Token EVM Adapter contract address =',
    tokenEVMAdapterContractAddress
  );

  await transfer(
    {
      amount: 3 * network.invokeFee,
      recipient: wrappedTokenBridgeContractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  await invoke(
    {
      dApp: wrappedTokenBridgeContractAddress,
      call: {
        function: 'updateFeeRecipient',
        args: [
          {
            type: 'string',
            value: collectorFeeContractAddress, // feeRecipient_
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

  let execChainId;
  switch (network.name) {
    case 'mainnet':
      execChainId = 2;
      break;
    case 'testnet':
      execChainId = 10002;
      break;
    default:
      execChainId = 10002;
  }

  await invoke(
    {
      dApp: wrappedTokenBridgeContractAddress,
      call: {
        function: 'updateExecutionChain',
        args: [
          {
            type: 'integer',
            value: execChainId, // executionChainId_
          },
          { type: 'boolean', value: true }, // enabled_
        ],
      },
    },
    wrappedTokenBridgeContract.privateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  await invoke(
    {
      dApp: wrappedTokenBridgeContractAddress,
      call: {
        function: 'updateBindingInfo',
        args: [
          {
            type: 'integer',
            value: execChainId, // executionChainId_
          },
          {
            type: 'string',
            value: tokenContractAddress, // assetContract_
          },
          {
            type: 'string',
            value: '0x0000000000000000000000000000000000000000', // executionAsset_
          },
          {
            type: 'integer',
            value: 100000, // minAmount_
          },
          {
            type: 'integer',
            value: 15000, // minFee_
          },
          {
            type: 'integer',
            value: 1000000000, // thresholdFee_
          },
          {
            type: 'integer',
            value: 1000, // beforePercentFee_
          },
          {
            type: 'integer',
            value: 900, // afterPercentFee_
          },
          { type: 'boolean', value: true }, // enabled_
        ],
      },
    },
    wrappedTokenBridgeContract.privateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  await transfer(
    {
      amount: network.invokeFee,
      recipient: tokenEVMAdapterContractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  let nativeTokenBridgeContract = ''; // (CoinBridge.sol)
  switch (network.name) {
    case 'mainnet':
      nativeTokenBridgeContract = '0x882260324AD5A87bF5007904B4A8EF87023c856A';
      break;
    case 'testnet':
      nativeTokenBridgeContract = '0x4356Fc8912ee241464983c46E61A7069f8983f38';
      break;
    default:
      nativeTokenBridgeContract = '0x4356Fc8912ee241464983c46E61A7069f8983f38';
  }

  await invoke(
    {
      dApp: tokenEVMAdapterContractAddress,
      call: {
        function: 'setNativeTokenBridgeContract',
        args: [
          {
            type: 'string',
            value: nativeTokenBridgeContract, // contract_
          },
        ],
      },
    },
    tokenEVMAdapterContract.privateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  return appliedNonce + 1;
}
