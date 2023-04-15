// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/samples/SimpleAccountFactory.sol";
import "../src/interfaces/IEntryPoint.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        SimpleAccountFactory factory = new SimpleAccountFactory(
            IEntryPoint(0x0576a174D229E3cFA37253523E645A78A0C91B57)
        );
        vm.stopBroadcast();
    }
}
