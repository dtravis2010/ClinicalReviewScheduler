import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'clinicalreviewscheduler',
  location: 'us-east4'
};

export const createNewEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewEvent', inputVars);
}
createNewEventRef.operationName = 'CreateNewEvent';

export function createNewEvent(dcOrVars, vars) {
  return executeMutation(createNewEventRef(dcOrVars, vars));
}

export const getMyEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyEvents');
}
getMyEventsRef.operationName = 'GetMyEvents';

export function getMyEvents(dc) {
  return executeQuery(getMyEventsRef(dc));
}

export const inviteUserToEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InviteUserToEvent', inputVars);
}
inviteUserToEventRef.operationName = 'InviteUserToEvent';

export function inviteUserToEvent(dcOrVars, vars) {
  return executeMutation(inviteUserToEventRef(dcOrVars, vars));
}

export const getPublicEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicEvents');
}
getPublicEventsRef.operationName = 'GetPublicEvents';

export function getPublicEvents(dc) {
  return executeQuery(getPublicEventsRef(dc));
}

