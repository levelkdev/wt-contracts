const abiDecoder = require('abi-decoder');
const simulateCrowdsale = require('./simulateCrowdsale');
const lif2LifWei = require('./misc').lif2LifWei;

const LifToken = artifacts.require('LifToken.sol');
const Unit = artifacts.require('Unit.sol');
const Hotel = artifacts.require('Hotel.sol');
const WTIndex = artifacts.require('WTIndex.sol');

abiDecoder.addABI(Unit._json.abi);
abiDecoder.addABI(LifToken._json.abi);
abiDecoder.addABI(Hotel._json.abi);
abiDecoder.addABI(WTIndex._json.abi);
/**
 * A library of helpers that spin up various privateCall / booking interactions.
 */

/**
 * Executes a beginCall booking
 * @param  {Instance} hotel            Hotel instance that inherits from PrivateCall
 * @param  {Instance} unit             Unit instance being booked
 * @param  {Address}  client           Address of the person making a booking
 * @param  {Number}   fromDay          Day after 01-01-1970 booking starts
 * @param  {Number}   daysAmount       Number of days to book for
 * @param  {Number}   price            Default LifToken price ?
 * @param  {String}   tokenOp          'approveData' || 'transferData' || 'transferDataFrom'
 * @param  {Array}    accounts         The truffle contract accounts
 * @param  {Code}     passThroughData  call data to be executed in the Book drop through.
 * @param  {Object}   options          flags that trigger various error conditions in the call seq.
 * @return {Object}
 * @example
 *   const result = {
 *
 *     token,               // LifToken instance generated by simulateCrowdsale
 *     clientInitialBalance // clients token balance after crowdsale
 *     hotelInitialBalance  // calling contracts token balance after crowdsale (typically: 0);
 *     bookData,            // `book` call data
 *     beginCallData,       // `beginCall` call data
 *     transaction,         // Transaction object returned by `token.approveData / transferData`
 *     events,              // All abi-decoded events generated by the token call
 *     hash,                // dataHash of the call pending at `beginCall`
 *     userInfo,            // hex private data to the begin call: useful for testing error cases
 *     value                // number value of approval or transfer: 10e9
 *
 *   } = await help.runBeginCall(hotel, unit, augusto, 60, 5, 1, 'approveData', accounts, lengthData)
 */
async function runBeginCall(
  hotel,
  unit,
  client,
  fromDay,
  daysAmount,
  price,
  tokenOp,
  accounts,
  passThroughData,
  options
){

  const wtIndex = await WTIndex.at(await hotel.owner());

  // Options: userInfo?
  let userInfo;
  (!options || options && !options.userInfo)
    ? userInfo = web3.toHex('user info')
    : userInfo = options.userInfo;

  // Options: unit price?
  if (!options || options && !options.keepPreviousHotel){
    const setPriceData = unit.contract.setDefaultLifTokenPrice.getData(price);
    const callUnitData = hotel.contract.callUnit.getData(unit.address, setPriceData);
    await wtIndex.callHotel(0, callUnitData, {from: (await hotel.manager())});
  }

  // Options: approval value?
  let value;
  (!options || options && options.approvalValue === undefined)
    ? value = await unit.getPrice(fromDay, daysAmount)
    : value = options.approvalValue

  // Options: zombie unit?
  if (options && options.badUnit){
    unit = await Unit.new(hotel.address, web3.toHex('BASIC_ROOM'), {from: accounts[5]});
  }

  // Run crowdsale
  const crowdsale = await simulateCrowdsale(100000000000, [40,30,20,10,0], accounts, 1);
  const token = await LifToken.at(await crowdsale.token.call());
  await wtIndex.setLifToken(token.address);

  const hotelInitialBalance = await token.balanceOf(hotel.address);
  const clientInitialBalance = await token.balanceOf(client);

  // Compose token call
  const bookData = hotel.contract.book.getData(unit.address, client, fromDay, daysAmount, passThroughData);
  const beginCallData = hotel.contract.beginCall.getData(bookData, userInfo);

  const tokenOpCalls = {
    'approveData':      async () => await token.approveData(hotel.address, value, beginCallData, {from: client}),
    'transferData':     async () => await token.transferData(hotel.address, value, beginCallData, {from: client}),
    'transferDataFrom': async () => await token.transferDataFrom(hotel.address, receiver, value, beginCallData, {from: client})
  };

  // Execute
  let events;
  let callStarted;
  let dataHashTopic;
  let success = false;
  let tx;

  try {
    tx = await tokenOpCalls[tokenOp]();
    events = abiDecoder.decodeLogs(tx.receipt.logs);
    callStarted = events.filter(item => item && item.name === 'CallStarted')[0];
    dataHashTopic = callStarted.events.filter(item => item.name === 'dataHash')[0];
    success = true;
  } catch (e) {
    success = false;
  }

  return {
    userInfo: userInfo,
    value: value,
    token: token,
    hotelInitialBalance: hotelInitialBalance,
    clientInitialBalance: clientInitialBalance,
    bookData: bookData,
    beginCallData: beginCallData,
    transaction: tx,
    events: events,
    hash: dataHashTopic ? dataHashTopic.value : null,
    success: success
  }
}

/**
 * Executes a continueCall
 * @param  {Instance} index        WTIndex instance
 * @param  {Instance} hotel        Hotel instance
 * @param  {Address}  caller       Address of the contract that inherits from PrivateCall
 * @param  {Address}  hotelAccount Sender of the `callHotel` transaction
 * @param  {Bytes32}  hash         CallStarted dataHash value
 * @return {Object}
 * @example
 *   const result = {
 *     transaction,  // Transaction object returned by `token.approveData / transferData`
 *     events,       // All abi-decoded events generated by the token call
 *
 *   } = await help.runContiueCall(wtIndex, wtHotel, unit, hotelAccount, hash)
 */
async function runContinueCall(index, hotel, hotelAccount, hash){
  const _continue = hotel.contract.continueCall.getData(hash);
  const tx = await index.callHotel(0, _continue, {from: hotelAccount});
  const events = abiDecoder.decodeLogs(tx.receipt.logs);
  return {
    transaction: tx,
    events: events
  }
}

module.exports = {
  runBeginCall: runBeginCall,
  runContinueCall: runContinueCall
}
