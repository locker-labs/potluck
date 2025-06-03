// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/Potluck.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTKN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PotluckMerkleMultiAllowlistTest is Test {
    Potluck    potluck;
    MockERC20  token;
    address    treasury      = address(0xBEEF);
    uint256    platformFee   = 1 ether;
    uint256    entryAmount   = 10 ether;
    uint256    periodSeconds = 3600; // 1 hour

    // Sample addresses for allowlist
    address alice = address(0xA1);
    address bob   = address(0xB2);
    address carol = address(0xC3);
    address dave  = address(0xD4);

    bytes32[] public emptyProof;

    function setUp() public {
        // Deploy token and Potluck
        token   = new MockERC20();
        potluck = new Potluck(platformFee, treasury);

        // Mint and approve tokens for each
        token.mint(alice, 1000 ether);
        token.mint(bob,   1000 ether);
        token.mint(carol, 1000 ether);
        token.mint(dave,  1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(carol);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(dave);
        token.approve(address(potluck), type(uint256).max);

        emptyProof = new bytes32[](0);
    }

    /// @notice Compute the Merkle root of an array of addresses (sorted‐pair tree).
    function computeMerkleRoot(address[] memory addrs) internal pure returns (bytes32) {
        require(addrs.length > 0, "No leaves");
        // Build the array of leaf hashes
        bytes32[] memory layer = new bytes32[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            layer[i] = keccak256(abi.encodePacked(addrs[i]));
        }
        // Iteratively build upper layers
        while (layer.length > 1) {
            uint256 nextLen = (layer.length + 1) / 2;
            bytes32[] memory nextLayer = new bytes32[](nextLen);
            for (uint256 i = 0; i < layer.length; i += 2) {
                bytes32 a = layer[i];
                bytes32 b = (i + 1 < layer.length) ? layer[i + 1] : layer[i];
                // sort pair
                if (a < b) {
                    nextLayer[i / 2] = keccak256(abi.encodePacked(a, b));
                } else {
                    nextLayer[i / 2] = keccak256(abi.encodePacked(b, a));
                }
            }
            layer = nextLayer;
        }
        return layer[0];
    }

    /// @notice Generate the Merkle proof for index `idx` in the `addrs` array.
    function getMerkleProof(address[] memory addrs, uint256 idx) internal pure returns (bytes32[] memory) {
        require(idx < addrs.length, "Index OOB");
        uint256 n = addrs.length;
        // Compute tree depth (number of levels above leaves)
        uint256 depth = 0;
        uint256 size = n;
        while (size > 1) {
            depth++;
            size = (size + 1) / 2;
        }
        bytes32[] memory proof = new bytes32[](depth);

        // Create initial leaf layer
        bytes32[] memory layer = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) {
            layer[i] = keccak256(abi.encodePacked(addrs[i]));
        }

        uint256 currentIndex = idx;
        for (uint256 level = 0; level < depth; level++) {
            uint256 siblingIndex = (currentIndex % 2 == 0)
                ? currentIndex + 1
                : currentIndex - 1;

            // If sibling index is out of range, sibling = own hash
            bytes32 siblingHash = (siblingIndex < layer.length)
                ? layer[siblingIndex]
                : layer[currentIndex];

            proof[level] = siblingHash;

            // Build next layer
            uint256 nextLen = (layer.length + 1) / 2;
            bytes32[] memory nextLayer = new bytes32[](nextLen);
            for (uint256 i = 0; i < layer.length; i += 2) {
                bytes32 a = layer[i];
                bytes32 b = (i + 1 < layer.length) ? layer[i + 1] : layer[i];
                if (a < b) {
                    nextLayer[i / 2] = keccak256(abi.encodePacked(a, b));
                } else {
                    nextLayer[i / 2] = keccak256(abi.encodePacked(b, a));
                }
            }
            layer = nextLayer;
            currentIndex = currentIndex / 2;
        }
        return proof;
    }

    /// @notice Test that each allowlisted address can join using its Merkle proof.
    function testMultiAddressAllowlist() public {
        // (1) Build the allowlist array
        address[] memory allowlist = new address[](4);
        allowlist[0] = alice;
        allowlist[1] = bob;
        allowlist[2] = carol;
        allowlist[3] = dave;

        // (2) Compute Merkle root off-chain–style (in pure Solidity)
        bytes32 root = computeMerkleRoot(allowlist);

        // (3) Alice creates the pot with that root (potId == 0)
        vm.startPrank(alice);
        potluck.createPot(
            "MultiMerklePot",
            address(token),
            entryAmount,
            periodSeconds,
            root
        );
        vm.stopPrank();

        // (4) Warp forward a bit but still before deadline
        vm.warp(block.timestamp + 300);

        // (5) For each allowlisted address, generate its proof and join
        for (uint256 i = 1; i < allowlist.length; i++) {
            address participant = allowlist[i];
            bytes32[] memory proof = getMerkleProof(allowlist, i);

            vm.prank(participant);
            potluck.joinPot(0, proof);
        }

        // (6) Verify that all four addresses appear in participants array
        address[] memory participants = potluck.getParticipants(0);
        // Creator (alice) was auto-added in createPot, plus 4 joins ⇒ length = 5
        assertEq(participants.length, 4);
        // Order: [alice (creator), bob, carol, dave]
        assertEq(participants[0], alice);
        assertEq(participants[1], bob);
        assertEq(participants[2], carol);
        assertEq(participants[3], dave);
    }

    /// @notice Test that a non‐allowlisted address cannot join.
    function testMultiAllowlistNonMemberFail() public {
        // (1) Build the allowlist of only [alice, bob, carol, dave]
        address[] memory allowlist = new address[](4);
        allowlist[0] = alice;
        allowlist[1] = bob;
        allowlist[2] = carol;
        allowlist[3] = dave;

        // (2) Compute Merkle root
        bytes32 root = computeMerkleRoot(allowlist);

        // (3) Alice creates the pot with that root (potId == 0)
        vm.prank(alice);
        potluck.createPot("MultiMerklePot", address(token), entryAmount, periodSeconds, root);

        // (4) Warp forward but before deadline
        vm.warp(block.timestamp + 300);

        // (5) Eve (not in allowlist) tries to join
        address eve = address(0xE5);
        vm.prank(eve);
        vm.expectRevert(
            abi.encodeWithSelector(
                Potluck.InvalidParticipant.selector,
                eve,
                uint256(0)
            )
        );
        potluck.joinPot(0, emptyProof);
    }
}
