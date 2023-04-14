pragma solidity ^0.8.17;

import {SolRsaVerify} from "./SolRsaVerify.sol";

contract RsaVerifyTest {
    using SolRsaVerify for bytes32;

    // Untested code
    function verify(
        bytes memory message,
        bytes memory signature,
        bytes memory exponent,
        bytes memory modulus
    ) public returns (uint){

        bytes32 hash = sha256(message);
        
        return hash.pkcs1Sha256Verify(signature, exponent, modulus);
    }

}