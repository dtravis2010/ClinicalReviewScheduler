import { CreateNewEventData, CreateNewEventVariables, GetMyEventsData, InviteUserToEventData, InviteUserToEventVariables, GetPublicEventsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateNewEvent(options?: useDataConnectMutationOptions<CreateNewEventData, FirebaseError, CreateNewEventVariables>): UseDataConnectMutationResult<CreateNewEventData, CreateNewEventVariables>;
export function useCreateNewEvent(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewEventData, FirebaseError, CreateNewEventVariables>): UseDataConnectMutationResult<CreateNewEventData, CreateNewEventVariables>;

export function useGetMyEvents(options?: useDataConnectQueryOptions<GetMyEventsData>): UseDataConnectQueryResult<GetMyEventsData, undefined>;
export function useGetMyEvents(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyEventsData>): UseDataConnectQueryResult<GetMyEventsData, undefined>;

export function useInviteUserToEvent(options?: useDataConnectMutationOptions<InviteUserToEventData, FirebaseError, InviteUserToEventVariables>): UseDataConnectMutationResult<InviteUserToEventData, InviteUserToEventVariables>;
export function useInviteUserToEvent(dc: DataConnect, options?: useDataConnectMutationOptions<InviteUserToEventData, FirebaseError, InviteUserToEventVariables>): UseDataConnectMutationResult<InviteUserToEventData, InviteUserToEventVariables>;

export function useGetPublicEvents(options?: useDataConnectQueryOptions<GetPublicEventsData>): UseDataConnectQueryResult<GetPublicEventsData, undefined>;
export function useGetPublicEvents(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicEventsData>): UseDataConnectQueryResult<GetPublicEventsData, undefined>;
