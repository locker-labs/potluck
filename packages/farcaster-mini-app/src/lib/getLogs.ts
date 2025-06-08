import { publicClient } from '@/clients/viem';
import { contractAddress, deploymentBlockBigInt, PotCreatedEventSignature } from '@/config';
import { parseAbiItem } from 'viem';

export const getPotCreatedLogs = async () => {
  let potCreatedLogsFilter;

  if (typeof localStorage !== 'undefined') {
    potCreatedLogsFilter = JSON.parse(localStorage.getItem('potCreatedLogsFilter') || 'null');
  }

  if (!potCreatedLogsFilter) {
    potCreatedLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(PotCreatedEventSignature),
      fromBlock: deploymentBlockBigInt,
    });
  }

  const logs = await publicClient.getFilterLogs({ filter: potCreatedLogsFilter });
  console.log('Filter logs:', logs);
  return logs;
};

export const getPotCreatedLogsOG = async () => {
  return await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem(PotCreatedEventSignature),
  });
};

export const getLogs = async () => {
  return await publicClient.getLogs({
    address: contractAddress,
    //   event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256)'),
    //   args: {
    //     from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    //     to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac'
    //   },
    fromBlock: deploymentBlockBigInt,
  });
};

export const getFilterLogs = async () => {
  const filter = await publicClient.createEventFilter({
    address: contractAddress,
    event: parseAbiItem(PotCreatedEventSignature),
  });
  const logs = await publicClient.getFilterLogs({ filter });
  console.log('Filter logs:', logs);
  return logs;
};
