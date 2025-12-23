import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateNewEventData {
  event_insert: Event_Key;
}

export interface CreateNewEventVariables {
  title: string;
  description?: string | null;
  startTime: TimestampString;
  endTime: TimestampString;
  location?: string | null;
  isPublic: boolean;
  categoryId?: UUIDString | null;
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface GetMyEventsData {
  events: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    location?: string | null;
    isPublic: boolean;
    category?: {
      id: UUIDString;
      name: string;
      color?: string | null;
    } & Category_Key;
  } & Event_Key)[];
}

export interface GetPublicEventsData {
  events: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    location?: string | null;
    organizer: {
      id: UUIDString;
      displayName: string;
      email: string;
    } & User_Key;
      category?: {
        id: UUIDString;
        name: string;
        color?: string | null;
      } & Category_Key;
  } & Event_Key)[];
}

export interface Invitation_Key {
  eventId: UUIDString;
  inviteeId: UUIDString;
  __typename?: 'Invitation_Key';
}

export interface InviteUserToEventData {
  invitation_insert: Invitation_Key;
}

export interface InviteUserToEventVariables {
  eventId: UUIDString;
  inviteeId: UUIDString;
}

export interface Reminder_Key {
  id: UUIDString;
  __typename?: 'Reminder_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewEventVariables): MutationRef<CreateNewEventData, CreateNewEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewEventVariables): MutationRef<CreateNewEventData, CreateNewEventVariables>;
  operationName: string;
}
export const createNewEventRef: CreateNewEventRef;

export function createNewEvent(vars: CreateNewEventVariables): MutationPromise<CreateNewEventData, CreateNewEventVariables>;
export function createNewEvent(dc: DataConnect, vars: CreateNewEventVariables): MutationPromise<CreateNewEventData, CreateNewEventVariables>;

interface GetMyEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyEventsData, undefined>;
  operationName: string;
}
export const getMyEventsRef: GetMyEventsRef;

export function getMyEvents(): QueryPromise<GetMyEventsData, undefined>;
export function getMyEvents(dc: DataConnect): QueryPromise<GetMyEventsData, undefined>;

interface InviteUserToEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InviteUserToEventVariables): MutationRef<InviteUserToEventData, InviteUserToEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InviteUserToEventVariables): MutationRef<InviteUserToEventData, InviteUserToEventVariables>;
  operationName: string;
}
export const inviteUserToEventRef: InviteUserToEventRef;

export function inviteUserToEvent(vars: InviteUserToEventVariables): MutationPromise<InviteUserToEventData, InviteUserToEventVariables>;
export function inviteUserToEvent(dc: DataConnect, vars: InviteUserToEventVariables): MutationPromise<InviteUserToEventData, InviteUserToEventVariables>;

interface GetPublicEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicEventsData, undefined>;
  operationName: string;
}
export const getPublicEventsRef: GetPublicEventsRef;

export function getPublicEvents(): QueryPromise<GetPublicEventsData, undefined>;
export function getPublicEvents(dc: DataConnect): QueryPromise<GetPublicEventsData, undefined>;

