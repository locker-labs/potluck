import { type Address, keccak256, toBytes } from 'viem';
import { MerkleTree } from 'merkletreejs';

export function getJoinPotProof(joineeAddress: Address, participants: Address[]) {
  // Create leaf nodes
  const leaves = participants.map((addr) => keccak256(toBytes(addr)));

  // Create a Merkle tree
  const tree = new MerkleTree(leaves, (d: Uint8Array) => Buffer.from(keccak256(d).slice(2), 'hex'));
  const joineeLeaf = keccak256(toBytes(joineeAddress));

  // Generate proof
  const proof = tree.getHexProof(Buffer.from(joineeLeaf.slice(2), 'hex'));
  console.log('Merkle Proof:', proof);

  // verify locally
  const root = tree.getHexRoot();
  const isValid = tree.verify(
    proof,
    Buffer.from(joineeLeaf.slice(2), 'hex'),
    Buffer.from(root.slice(2), 'hex'),
  );
  console.log('Valid Proof:', isValid);

  return proof;
}
