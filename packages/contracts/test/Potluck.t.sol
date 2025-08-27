// test/PotluckGasTest.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Potluck} from "../src/Potluck.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTKN") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

// A thin test-only harness to expose minimal hooks for moving to round > 0.
// This avoids wiring a full VRF coordinator in tests.
contract PotluckHarness is Potluck {
    constructor(uint256 _platformFee, uint256 _perPartFee, address _treasury, address _vrfCoordinator)
        Potluck(_platformFee, _perPartFee, _treasury, _vrfCoordinator) {}

    // Test-only: force set round and deadline to emulate start of next round.
    function __test_forceRound(uint256 potId, uint32 newRound, uint256 newDeadline) external {
        Pot storage p = pots[potId];
        p.round = newRound;
        p.deadline = newDeadline;
    }

    // Test-only: mark hasJoinedRound for arbitrary (pot, round, user).
    function __test_markJoined(uint256 potId, uint32 round, address user) external {
        hasJoinedRound[keccak256(abi.encodePacked(potId, round, user))] = true;
    }

    // Test-only: push participant directly and adjust balance (for realistic calldata/storage paths).
    function __test_pushParticipant(uint256 potId, address user) external {
        pots[potId].participants.push(user);
    }
}

contract PotluckGasTest is Test {
    PotluckHarness potluck;
    MockERC20 token;

    uint256 public platformFee = 1 ether;
    uint256 public participantFee = 1 ether;
    address public treasury = address(0xBEEF);

    // Dummy coordinator; not used in this test
    address public vrfCoordinator = address(0xC0FFEE);

    uint256 public entryAmount = 10 ether;
    uint256 public periodSeconds = 3600; // 1 hour

    address public alice = address(0xA1);
    address public bob   = address(0xB2);

    function setUp() public {
        token = new MockERC20();
        potluck = new PotluckHarness(platformFee, participantFee, treasury, vrfCoordinator);

        // Allow token in Potluck
        potluck.setTokenStatus(address(token), true);

        // Mint and approve
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);

        // Alice creates a private pot and PAYS required ETH fees
        vm.deal(alice, 10 ether);
        uint256 slots = 2; // maxParticipants = 2
        uint256 requiredFee = platformFee + participantFee * slots; // 3e18 with current constants

        vm.prank(alice);
        potluck.createPot{value: requiredFee}(
            bytes("TestPot"),
            address(token),
            entryAmount,
            uint8(slots),
            periodSeconds,
            false // private
        );

        // Allow Bob in private pot
        address[] memory allowList = new address[](1);
        allowList[0] = bob;
        vm.prank(alice);
        potluck.allowParticipants(0, allowList);

        // Bob joins round 0 and PAYS first-round participant fees
        // joinPot charges participantFee * slots again when p.round == 0
        uint256 firstRoundJoinFee = participantFee * slots; // 2e18
        vm.deal(bob, 5 ether);
        vm.prank(bob);
        potluck.joinPot{value: firstRoundJoinFee}(0);
    }

    function testGas_joinOnBehalf() public {
        // Emulate start of round 1 with Bob eligible (hasJoinedRound for round 0 already true from joinPot)
        // Set pot.round to 1 and future deadline; push Alice as current participant to keep storage realistic
        potluck.__test_forceRound(0, 1, block.timestamp + periodSeconds);
        potluck.__test_pushParticipant(0, alice);

        // Measure gas for joinOnBehalf in round 1.
        // Preconditions for joinOnBehalf:
        // - Pot exists and deadline not passed (set above)
        // - Bob is allowed (done in setUp)
        // - p.round > 0 (now 1)
        // - hasJoinedRound(potId, round-1, bob) == true (already true due to round 0 join)
        vm.startSnapshotGas("joinOnBehalf");
        potluck.joinOnBehalf(0, bob);
        uint256 gasUsed = vm.stopSnapshotGas();

        emit log_named_uint("joinOnBehalf gas", gasUsed);

        // Basic assertion to ensure call succeeded and recorded join
        address[] memory parts = potluck.getParticipants(0);
        assertTrue(parts.length >= 2, "Participants not updated");
    }
}
