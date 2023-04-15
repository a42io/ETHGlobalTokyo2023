// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../core/BaseAccount.sol";

import {RsaVerify} from "../RsaVerify.sol";

/**
 * minimal account.
 *  this is sample minimal account.
 *  has execute, eth handling methods
 *  has a single signer that can send requests through the entryPoint.
 */
contract SimpleAccount is BaseAccount, UUPSUpgradeable, Initializable {
    using ECDSA for bytes32;
    using RsaVerify for bytes32;

    //filler member, to push the nonce and owner to the same slot
    // the "Initializeble" class takes 2 bytes in the first slot
    bytes28 private _filler;

    //explicit sizes of nonce, to fit a single storage cell with "owner"
    uint96 private _nonce;
    address public owner;

    bytes internal constant modulus =
        hex"8f6047064f400fd2ff80ad6569c2cffc238079e2cb18648305a59b9f1f389730f9bf9b5e3e436f88065c06241c7189ba43b6adbe5ec7a979d4b42f2a450cd19e8075e5a817b04328a0d16ebfcb6bc09a96020217af6218f3765dbc129131edd004472ab45908bf02ec35b7c044e1c900f7df179fc19c94835802e58c432bc73cee54148a6f24d7316cca195791c87e07e85b07f80b71ddc15b9b053e6f0265a8e81c27c7546dea38cbb951ca71c384892b81df12c8cb0444f9e04d24d0d3323fa857075be26746f4b731a186a51cec24151597b9d31c9ef78db83f27ef0d973d4d2a2d8a9093c7118bf86322603a17d7814a05f6150963b72a275f645a099319";
    bytes internal constant exponent =
        hex"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001";

    bytes internal constant testSig =
        hex"40d846e8b932435d163105b9e35938bfc6c7a2d61b9b657bec671b62e87041edb158b110bd85d1f62dc2c54c0d55b7227bcbd8c8af74e6050634f057ef1def2f29b83909b52279c3ad5bde960177aef2b81f2cfbe45a696f79822cb26d41f3df24f0524d71b88c778793075853d4fe6d3061993cc60fa0932a965261bfb805b9a5d1c6c2aca8f23c7b617073f41b0f35097f1e24a7e092a044366f9e7c8ac9df1ef41286b893e7fc2514a2c98ddddf70e2d2f9b219f4c513ee8b8348691f209d12fc6202ad9c20e7b5ef2d875c155f0ffc1310aaba04b27457346c173a1be4708b35c32fa99f4571f0317b7db82414e89a0d0a139f561611a435475676299e44";
    bytes internal constant testData = hex"68656c6c6f";

    IEntryPoint private immutable _entryPoint;

    event SimpleAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed owner
    );

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    /// @inheritdoc BaseAccount
    function nonce() public view virtual override returns (uint256) {
        return _nonce;
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    function _onlyOwner() internal view {
        //directly from EOA owner, or through the account itself (which gets redirected through execute())
        require(
            msg.sender == owner || msg.sender == address(this),
            "only owner"
        );
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(
        address[] calldata dest,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(address anOwner) public virtual initializer {
        _initialize(anOwner);
    }

    function _initialize(address anOwner) internal virtual {
        owner = anOwner;
        emit SimpleAccountInitialized(_entryPoint, owner);
    }

    // Require the function call went through EntryPoint or owner
    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "account: not Owner or EntryPoint"
        );
    }

    /// implement template method of BaseAccount
    function _validateAndUpdateNonce(
        UserOperation calldata userOp
    ) internal override {
        require(_nonce++ == userOp.nonce, "account: invalid nonce");
    }

    /// implement template method of BaseAccount
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = sha256(abi.encode(testData));
        _verifySha256(hash, testSig, exponent, modulus);
        return 0;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        (newImplementation);
        _onlyOwner();
    }

    // verify
    function _verifySha256(
        bytes32 _hash,
        bytes memory _signature,
        bytes memory _exponent,
        bytes memory _modulus
    ) public view returns (uint256) {
        return _hash.pkcs1Sha256Verify(_signature, _exponent, _modulus);
    }
}
