const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'clinicalreviewscheduler',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createNewEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewEvent', inputVars);
}
createNewEventRef.operationName = 'CreateNewEvent';
exports.createNewEventRef = createNewEventRef;

exports.createNewEvent = function createNewEvent(dcOrVars, vars) {
  return executeMutation(createNewEventRef(dcOrVars, vars));
};

const getMyEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyEvents');
}
getMyEventsRef.operationName = 'GetMyEvents';
exports.getMyEventsRef = getMyEventsRef;

exports.getMyEvents = function getMyEvents(dc) {
  return executeQuery(getMyEventsRef(dc));
};

const inviteUserToEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InviteUserToEvent', inputVars);
}
inviteUserToEventRef.operationName = 'InviteUserToEvent';
exports.inviteUserToEventRef = inviteUserToEventRef;

exports.inviteUserToEvent = function inviteUserToEvent(dcOrVars, vars) {
  return executeMutation(inviteUserToEventRef(dcOrVars, vars));
};

const getPublicEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicEvents');
}
getPublicEventsRef.operationName = 'GetPublicEvents';
exports.getPublicEventsRef = getPublicEventsRef;

exports.getPublicEvents = function getPublicEvents(dc) {
  return executeQuery(getPublicEventsRef(dc));
};
