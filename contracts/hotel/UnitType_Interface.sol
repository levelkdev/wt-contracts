pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/*
 * UnitType_Interface
 * Interface of UnitType contract
 */
contract UnitType_Interface is Ownable {

  bytes32 public unitType;
  uint public totalUnits;

  // Owner methods
  function edit(string _description, uint _minGuests, uint _maxGuests, string _price) onlyOwner();
  function addAmenity(uint amenityId) onlyOwner();
  function removeAmenity( uint amenityId) onlyOwner();
  function increaseUnits() onlyOwner();
  function decreaseUnits() onlyOwner();

  // Public methods
  function getInfo() constant returns(string, uint, uint, string);
  function getAmenities() constant returns(uint[]);

}
