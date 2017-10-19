pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

 /**
   @title Unit, contract for an individual unit in a Hotel

   A contract that represents an individual unit of a hotel registered in the
   WT network. Tracks the price and availability of this unit.

   Inherits from WT's `PrivateCall`
 */
contract Unit is Ownable {

  // The type of the unit
  bytes32 public unitType;

  // The status of the unit
  bool public active;

  // The default price for the Unit in LifTokens
  uint256 public defaultLifTokenPrice;

  /*
     Mapping of reservations, indexed by date represented by number of days
     after 01-01-1970
  */
  mapping(uint => UnitDay) reservations;
  struct UnitDay {
    string specialPrice;
    address bookedBy;
  }

  /**
     @dev Event triggered on every booking
  **/
  event Book(address from, uint fromDay, uint daysAmount);

  /**
     @dev Constructor. Creates the `Unit` contract with an active status

     @param _owner see `owner`
     @param _unitType see `unitType`
   */
  function Unit(address _owner, bytes32 _unitType) {
    owner = _owner;
    unitType = _unitType;
    active = true;
  }

  /**
     @dev `setActive` allows the owner of the contract to switch the status

     @param _active The new status of the unit
   */
  function setActive(bool _active) onlyOwner() {
    active = _active;
  }

  /**
     @dev `setPrice` allows the owner of the contract to set a price for
     a range of dates

     @param price The price of the unit
     @param fromDay The starting date of the period of days to change
     @param daysAmount The amount of days in the period
   */
  function setSpecialPrice(
    string price,
    uint fromDay,
    uint daysAmount
  ) onlyOwner() {
    uint toDay = fromDay+daysAmount;
    for (uint i = fromDay; i < toDay; i++)
      reservations[i].specialPrice = price;
  }

  function setDefaultLifTokenPrice(uint256 price) onlyOwner() {
    defaultLifTokenPrice = price;
  }

  /**
     @dev `book` allows the owner to make a reservation

     @param from The address of the opener of the reservation
     @param fromDay The starting day of the period of days to book
     @param daysAmount The amount of days in the booking period

     @return bool Whether the booking was successful or not
   */
  function book(
    address from,
    uint fromDay,
    uint daysAmount
  ) onlyOwner() returns(bool) {
    require(isFutureDay(fromDay));
    require(active);
    uint toDay = fromDay+daysAmount;

    for (uint i = fromDay; i < toDay ; i++){
      if (reservations[i].bookedBy != address(0)) {
        return false;
      }
    }

    for (i = fromDay; i < toDay ; i++)
      reservations[i].bookedBy = from;
    Book(from, fromDay, daysAmount);
    return true;
  }

  /**
     @dev `getReservation` get the avalibility and price of a day

     @param day The number of days after 01-01-1970

     @return string The price of the day
     @return address The address of the owner of the reservation
     returns 0x0 if its available
   */
  function getReservation(
    uint day
  ) constant returns(string, address) {
    return (
      reservations[day].specialPrice,
      reservations[day].bookedBy
    );
  }

  function getPrice(
    uint fromDay,
    uint daysAmount
  ) constant returns(uint256) {
    uint toDay = fromDay+daysAmount;
    uint totalPrice = 0;

    for (uint i = fromDay; i < toDay ; i++){
      if (bytes(reservations[i].specialPrice).length != 0) {
        //TODO: add the specialPrice to total
      } else {
        totalPrice += defaultLifTokenPrice;
      }
    }

    return totalPrice;
  }

  /**
     @dev `isFutureDay` checks that a timestamp is not a past date

     @param time The number of days after 01-01-1970

     @return bool If the timestamp is today or in the future
   */
  function isFutureDay(uint time) internal returns (bool) {
    return !(now / 86400 > time);
  }

}
