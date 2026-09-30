// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NexCoin Marketplace & Payment Gateway
/// @author NexCoin Core Team
/// @notice Contrato oficial para procesamiento de compras en tienda, firmas criptográficas y pagos Web3
contract NexCoin is Ownable {

    /// @notice Estructura que define una transacción pendiente
    struct PendingTransaction {
        address from;
        uint256 amount;
        bool confirmed;
        bool offline;
    }

    /// @notice Estructura de compra oficial en el marketplace con firma digital
    struct OrderPurchase {
        bytes32 orderHash;
        string orderNumber;
        string voucherCode;
        address customer;
        address payable receiver;
        uint256 amount;
        bytes signature;
        uint256 timestamp;
        bool verified;
    }

    /// @notice Dirección del receptor de pagos designado
    address payable public paymentReceiver;

    /// @notice Mapeo de transacciones pendientes por dirección
    mapping(address => PendingTransaction) public pendingTransactions;

    /// @notice Mapeo de órdenes de compra firmadas por código de voucher
    mapping(string => OrderPurchase) public purchasesByVoucher;

    /// @notice Eventos
    event PaymentInitiated(address indexed from, uint256 amount, bool offline);
    event PaymentConfirmed(address indexed from, uint256 amount);
    event PurchaseSignedAndExecuted(
        bytes32 indexed orderHash,
        address indexed customer,
        string orderNumber,
        string voucherCode,
        uint256 amount,
        bytes signature,
        uint256 timestamp
    );

    constructor(address _owner, address payable _paymentReceiver) Ownable(_owner) {
        paymentReceiver = _paymentReceiver;
    }

    /// @notice Registrar una compra con su firma criptográfica en el contrato NexCoin
    /// @param orderNumber Número único de orden
    /// @param voucherCode Código inmutable del voucher emitido
    /// @param receiver Dirección wallet que recibe los fondos (proveedor o tesorería)
    /// @param signature Firma digital del comprador generada con su billetera Web3
    function executeSignedPurchase(
        string memory orderNumber,
        string memory voucherCode,
        address payable receiver,
        bytes memory signature
    ) public payable returns (bytes32) {
        bytes32 orderHash = keccak256(
            abi.encodePacked(orderNumber, voucherCode, msg.sender, msg.value, block.timestamp)
        );

        purchasesByVoucher[voucherCode] = OrderPurchase({
            orderHash: orderHash,
            orderNumber: orderNumber,
            voucherCode: voucherCode,
            customer: msg.sender,
            receiver: receiver,
            amount: msg.value,
            signature: signature,
            timestamp: block.timestamp,
            verified: true
        });

        if (msg.value > 0) {
            receiver.transfer(msg.value);
        }

        emit PurchaseSignedAndExecuted(
            orderHash,
            msg.sender,
            orderNumber,
            voucherCode,
            msg.value,
            signature,
            block.timestamp
        );

        return orderHash;
    }

    /// @notice Verificar si una firma coincide con el firmante esperado para un voucher
    function verifyOrderSignature(
        bytes32 messageHash,
        bytes memory signature
    ) public pure returns (address) {
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Longitud de firma invalida");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /// @notice Iniciar una transacción pendiente (online u offline)
    function initiatePayment(bool offline) public payable {
        require(msg.value > 0, "El monto debe ser mayor a 0");

        pendingTransactions[msg.sender] = PendingTransaction({
            from: msg.sender,
            amount: msg.value,
            confirmed: false,
            offline: offline
        });

        emit PaymentInitiated(msg.sender, msg.value, offline);
    }

    /// @notice Confirmar pago pendiente y transferir al receptor
    function confirmPayment() public {
        PendingTransaction storage transaction = pendingTransactions[msg.sender];
        require(transaction.amount > 0, "No hay transacciones pendientes");
        require(!transaction.confirmed, "La transaccion ya ha sido confirmada");

        paymentReceiver.transfer(transaction.amount);
        transaction.confirmed = true;

        emit PaymentConfirmed(msg.sender, transaction.amount);
    }

    /// @notice Recepción directa de pagos
    receive() external payable {
        paymentReceiver.transfer(msg.value);
        emit PaymentConfirmed(msg.sender, msg.value);
    }

    /// @notice Confirmación de emergencia por el propietario
    function emergencyConfirm(address user) public onlyOwner {
        PendingTransaction storage transaction = pendingTransactions[user];
        require(transaction.amount > 0, "No hay transacciones pendientes");
        require(!transaction.confirmed, "La transaccion ya fue confirmada");

        paymentReceiver.transfer(transaction.amount);
        transaction.confirmed = true;

        emit PaymentConfirmed(user, transaction.amount);
    }
}
