pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./hotel/Hotel.sol";

/**
   @title WTIndex, registry of all hotels registered on WT

   The hotels are stored in an array and can be filtered by the owner
   address.

   Inherits from OpenZeppelin's `Ownable`
 */
contract WTIndex is Ownable {

  // Array of addresses of `Hotel` contracts and mapping of their index position
  address[] public hotels;
  mapping(address => uint) public hotelsIndex;

  // Mapping of the hotels indexed by manager's address
  mapping(address => address[]) public hotelsByManager;

  // The address of the DAO contract
  address DAO;

  // Address of the LifToken contract
  address public LifToken;

  // Address of the DateTime contract
  address public DateTime;

  /**
     @dev Event triggered every time hotel is registered or called
  **/
  event log();

  /**
     @dev Event triggered when user receives DAO voting power
  **/
  event voteGiven(address receiver);

  modifier onlyHotel() {
    require(hotels[hotelsIndex[msg.sender]] != 0);
    _;
  }

  /**
     @dev Constructor. Creates the `WTIndex` contract

     @param _DateTime Address of the DateTime utility contract
   */
	function WTIndex(address _DateTime) {
    DateTime = _DateTime;
		hotels.length ++;
	}

  /**
     @dev `setDAO` allows the owner of the contract to change the
     address of the DAO contract

     @param _DAO The new contract address
   */
  function setDAO(address _DAO) onlyOwner() {
    DAO = _DAO;
  }

  /**
     @dev `setLifToken` allows the owner of the contract to change the
     address of the LifToken contract

     @param _LifToken The new contract address
   */
  function setLifToken(address _LifToken) onlyOwner() {
    LifToken = _LifToken;
  }

  /**
     @dev `setDateTime` allows the owner of the contract to change the
     address of the DateTime contract

     @param _DateTime The new contract address
   */
  function setDateTime(address _DateTime) onlyOwner() {
    DateTime = _DateTime;
  }

  /**
     @dev `registerHotel` Register new hotel in the index

     @param name The name of the hotel
     @param description The description of the hotel
   */
  function registerHotel(string name, string description) external {
    Hotel newHotel = new Hotel(name, description, msg.sender);
    hotelsIndex[newHotel] = hotels.length;
    hotels.push(newHotel);
    hotelsByManager[msg.sender].push(newHotel);
		log();
	}

  /**
     @dev `removeHotel` Allows a manager to remove a hotel

     @param index The hotel's index
   */
  function removeHotel(uint index) external {
    require(hotelsByManager[msg.sender][index] != address(0));
    delete hotels[hotelsIndex[hotelsByManager[msg.sender][index]]];
    delete hotelsIndex[hotelsByManager[msg.sender][index]];
    delete hotelsByManager[msg.sender][index];
	}

  /**
     @dev `callHotel` Call hotel in the index, the hotel can only
     be called by its manager

     @param index The index position of the hotel
     @param data The data to be executed in the hotel contract
   */
	function callHotel(uint index, bytes data) external {
		require(hotelsByManager[msg.sender][index].call(data));
		log();
	}

  /**
     @dev `giveVote` give vote to an address, it can be called only
     by a registered hotel

     @param userAddress The address to receive the votes
   */
  function giveVote(address userAddress) onlyHotel() {
      // TO DO
      voteGiven(userAddress);
  }

  /**
     @dev `getHotels` Get the addresses of all registered `Hotel` contracts

     returns The `Hotel` contract addresses
   */
  function getHotels() constant returns(address[]){
    return hotels;
  }

  /**
     @dev `getHotelsByManager` get all the hotels belonging to one manager

     returns The addresses of `Hotel` contracts that belong to one manager
   */
	function getHotelsByManager(address owner) constant returns(address[]){
		return hotelsByManager[owner];
	}

}
