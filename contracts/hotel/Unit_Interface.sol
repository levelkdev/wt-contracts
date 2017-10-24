pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/*
 * Unit_Interface
 * Interface of Unit contract
 */
contract Unit_Interface is Ownable {

  bool public active;
  bytes32 public unitType;

  event Book(address from, uint fromDay, uint daysAmount);

  // Public methods
  function getReservation(uint day) constant returns(uint, uint, address);
  function getCost(uint fromDay, uint daysAmount) constant returns(uint256);
  function getLifCost(uint fromDay, uint daysAmount) constant returns(uint256);

  // Owner methods
  function setActive(bool _active) onlyOwner();
  function setCurrencyCode(bytes8 _currencyCode) onlyOwner();
  function setSpecialPrice(uint price, uint fromDay, uint daysAmount) onlyOwner();
  function setSpecialLifPrice(uint price, uint fromDay, uint daysAmount) onlyOwner();
  function setDefaultPrice(uint256 price) onlyOwner();
  function setDefaultLifPrice(uint256 price) onlyOwner();
  function book(address from, uint fromDay, uint daysAmount) onlyOwner() returns(bool);

}
