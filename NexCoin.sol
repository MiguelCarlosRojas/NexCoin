// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Gestión de transacciones offline y confirmación de pagos
/// @author MiguelCarlos, ToshiroInami e JhanmarcoGodoyLevano
/// @notice Este contrato permite iniciar transacciones offline, almacenarlas temporalmente y confirmarlas cuando la conectividad esté disponible.
/// @dev Se utiliza almacenamiento en la blockchain para gestionar transacciones pendientes y pagos.
contract MyContract is Ownable {

    /// @notice Estructura que define una transacción pendiente
    /// @dev Almacena la dirección del remitente, cantidad y estado de confirmación
    /// @param from Dirección del remitente
    /// @param amount Cantidad enviada
    /// @param confirmed Indica si la transacción ha sido confirmada
    struct PendingTransaction {
        address from;
        uint256 amount;
        bool confirmed;
        bool offline; // Indica si fue realizada offline
    }

    /// @notice Dirección del receptor de pagos designado
    address payable public paymentReceiver;

    /// @notice Mapeo para almacenar transacciones pendientes por dirección
    mapping(address => PendingTransaction) public pendingTransactions;

    /// @notice Evento que se emite cuando se inicia un pago
    event PaymentInitiated(address indexed from, uint256 amount, bool offline);

    /// @notice Evento que se emite cuando un pago es confirmado
    event PaymentConfirmed(address indexed from, uint256 amount);

    /// @notice Constructor que inicializa el contrato con el propietario y el receptor de pagos
    /// @param _owner Dirección del propietario del contrato
    /// @param _paymentReceiver Dirección del receptor de pagos
    constructor(address _owner, address payable _paymentReceiver) Ownable(_owner) {
        paymentReceiver = _paymentReceiver;
    }

    /// @notice Función para iniciar una transacción pendiente, incluyendo transacciones offline
    /// @dev Esta función almacena las transacciones, permitiendo que sean offline si no hay conectividad
    /// @param offline Indica si la transacción se realiza offline
    /// @custom:interaction El usuario debe enviar una cantidad mayor a 0 ETH
    function initiatePayment(bool offline) public payable {
        require(msg.value > 0, "Amount must be greater than 0");

        // Guardamos la transacción pendiente en el mapeo, incluyendo si es offline
        pendingTransactions[msg.sender] = PendingTransaction({
            from: msg.sender,
            amount: msg.value,
            confirmed: false,
            offline: offline
        });

        // Emitimos el evento de inicio de pago con el estado offline
        emit PaymentInitiated(msg.sender, msg.value, offline);
    }

    /// @notice Función para confirmar una transacción pendiente cuando se recupere la conectividad
    /// @dev Confirma la transacción y transfiere los fondos al receptor de pagos
    function confirmPayment() public {
        PendingTransaction storage transaction = pendingTransactions[msg.sender];
        require(transaction.amount > 0, "No pending transaction found");
        require(!transaction.confirmed, "Transaction already confirmed");

        // Transferimos el monto al receptor de pagos y confirmamos la transacción
        paymentReceiver.transfer(transaction.amount);
        transaction.confirmed = true;

        // Emitimos el evento de confirmación
        emit PaymentConfirmed(msg.sender, transaction.amount);
    }

    /// @notice Función para recibir pagos directos sin almacenar como transacción pendiente
    /// @dev Transfiere el ETH recibido directamente al `paymentReceiver`
    receive() external payable {
        paymentReceiver.transfer(msg.value);
        emit PaymentConfirmed(msg.sender, msg.value);
    }

    /// @notice Función de emergencia para reenviar pagos pendientes no confirmados
    /// @dev Utiliza esta función para asegurar que transacciones pendientes de usuarios que no tienen conectividad puedan ser procesadas luego
    function emergencyConfirm(address user) public onlyOwner {
        PendingTransaction storage transaction = pendingTransactions[user];
        require(transaction.amount > 0, "No pending transaction found");
        require(!transaction.confirmed, "Transaction already confirmed");

        paymentReceiver.transfer(transaction.amount);
        transaction.confirmed = true;

        emit PaymentConfirmed(user, transaction.amount);
    }
}
