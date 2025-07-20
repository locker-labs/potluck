import { publicClient } from '@/clients/viem';
import {
  contractAddress,
  deploymentBlockBigInt,
  PotCreatedEventSignature,
  PotJoinedEventSignature,
  PotPayoutEventSignature,
} from '@/config';
import { type Address, type Abi, type GetFilterLogsReturnType, parseAbiItem } from 'viem';

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

export const getPotCreatedLogsForAddress = async (address: Address) => {
  let filter;

  if (typeof localStorage !== 'undefined') {
    filter = JSON.parse(localStorage.getItem(`potCreatedLogsFilter:${address}`) || 'null');
    console.log(`Filter of creator ${address.slice(8)} from ls:`, filter);
  }

  if (!filter) {
    filter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(PotCreatedEventSignature),
      fromBlock: deploymentBlockBigInt,
      args: { creator: address },
    });

    // localStorage.setItem(`potCreatedLogsFilter:${address}`, JSON.stringify(filter));
  }

  const logs = await publicClient.getFilterLogs({ filter });
  console.log(`Filter logs of creator ${address.slice(8)}:`, logs);
  return logs;
};

export const getPotCreatedLogsForAPot = async (
  potId: bigint,
): Promise<GetFilterLogsReturnType<Abi>> => {
  let potCreatedLogsFilter;
  const key = `potCreatedLogsFilter:${potId}`;

  if (typeof localStorage !== 'undefined') {
    potCreatedLogsFilter = JSON.parse(localStorage.getItem(key) || 'null');
  }

  if (!potCreatedLogsFilter) {
    potCreatedLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(PotCreatedEventSignature),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({ filter: potCreatedLogsFilter });
  console.log(`PotCreated Logs for pot ${potId}:`, logs);
  return logs as GetFilterLogsReturnType<Abi>;
};

export const getPotJoinedLogsForAPot = async (
  potId: bigint,
): Promise<GetFilterLogsReturnType<Abi>> => {
  let potJoinedLogsFilter;
  const key = `potJoinedLogsFilter:${potId}`;

  if (typeof localStorage !== 'undefined') {
    potJoinedLogsFilter = JSON.parse(localStorage.getItem(key) || 'null');
  }

  if (!potJoinedLogsFilter) {
    potJoinedLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(PotJoinedEventSignature),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({ filter: potJoinedLogsFilter });
  console.log(`PotJoined Logs for pot ${potId}:`, logs);
  return logs as GetFilterLogsReturnType<Abi>;
};

export const getPotPayoutLogsForAPot = async (
  potId: bigint,
): Promise<GetFilterLogsReturnType<Abi>> => {
  let potPayoutLogsFilter;
  const key = `potPayoutLogsFilter:${potId}`;

  if (typeof localStorage !== 'undefined') {
    potPayoutLogsFilter = JSON.parse(localStorage.getItem(key) || 'null');
  }

  if (!potPayoutLogsFilter) {
    potPayoutLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(PotPayoutEventSignature),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({ filter: potPayoutLogsFilter });
  console.log(`PotPayout Logs for pot ${potId}:`, logs);
  return logs as GetFilterLogsReturnType<Abi>;
};

export const getAllLogsForAPot = async (potId: bigint): Promise<GetFilterLogsReturnType<Abi>> => {
  const [createdLogs, joinedLogs, payoutLogs] = await Promise.all([
    getPotCreatedLogsForAPot(potId),
    getPotJoinedLogsForAPot(potId),
    getPotPayoutLogsForAPot(potId),
  ]);
  const logs: GetFilterLogsReturnType<Abi> = [...createdLogs, ...joinedLogs, ...payoutLogs];
  const sortedLogs = logs.sort((a, b) =>
    a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0,
  );
  return sortedLogs.reverse();
};

export const getPotRequests = async (
  potId: bigint
): Promise<GetFilterLogsReturnType<Abi>> => {
  let potRequestLogsFilter;
  const key = `potRequestLogsFilter:${potId}`;

  if (typeof localStorage !== "undefined") {
    potRequestLogsFilter = JSON.parse(localStorage.getItem(key) || "null");
  }

  if (!potRequestLogsFilter) {
    potRequestLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(
        "event PotAllowRequested(uint256 indexed potId, address indexed requester)"
      ),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({
    filter: potRequestLogsFilter,
  });
  console.log(`PotRequest Logs for pot ${potId}:`, logs);
  return logs as GetFilterLogsReturnType<Abi>;
};

export const hasRequestedPot = async (
  potId: bigint,
  address: Address
): Promise<boolean> => {
  let potRequestLogsFilter;
  const key = `potRequestLogsFilter:${potId}:${address}`;
  if (typeof localStorage !== "undefined") {
    potRequestLogsFilter = JSON.parse(localStorage.getItem(key) || "null");
  }

  if (!potRequestLogsFilter) {
    potRequestLogsFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(
        "event PotAllowRequested(uint256 indexed potId, address indexed requester)"
      ),
      fromBlock: deploymentBlockBigInt,
      args: { potId, requester: address },
    });
  }

  const logs = await publicClient.getFilterLogs({
    filter: potRequestLogsFilter,
  });
  console.log(`PotRequest Logs for pot ${potId}:`, logs);
  if (logs.length > 0) {
    return true;
  }
  return false;
};

export const getAllowedAddresses = async (
  potId: bigint
): Promise<Address[]> => {
  let allowedAddressesFilter;
  const key = `allowedAddressesFilter:${potId}`;

  if (typeof localStorage !== "undefined") {
    allowedAddressesFilter = JSON.parse(localStorage.getItem(key) || "null");
  }

  if (!allowedAddressesFilter) {
    allowedAddressesFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(
        "event AllowedParticipantAdded(uint256 indexed potId, address indexed user)"
      ),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({
    filter: allowedAddressesFilter,
  });
  // @ts-ignore: decoded logs have `.args`
  const addresses: Address[] = logs.map((log) => log.args.user);
  console.log(`Allowed Addresses Logs for pot ${potId}:`, logs);
  return addresses;
};

export const hasAllowedAddress = async (
  potId: bigint,
  address: Address
): Promise<boolean> => {
  let allowedAddressFilter;
  const key = `allowedAddressesFilter:${potId}:${address}`;
  if (typeof localStorage !== "undefined") {
    allowedAddressFilter = JSON.parse(localStorage.getItem(key) || "null");
  }

  if (!allowedAddressFilter) {
    allowedAddressFilter = await publicClient.createEventFilter({
      address: contractAddress,
      event: parseAbiItem(
        "event AllowedParticipantAdded(uint256 indexed potId, address indexed user)"
      ),
      fromBlock: deploymentBlockBigInt,
      args: { potId },
    });
  }

  const logs = await publicClient.getFilterLogs({
    filter: allowedAddressFilter,
  });
  console.log(`Allowed Addresses Logs for pot ${potId}:`, logs);
  if (logs.length > 0) {
    return true;
  }
  return false;
};
