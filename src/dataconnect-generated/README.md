# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyEvents*](#getmyevents)
  - [*GetPublicEvents*](#getpublicevents)
- [**Mutations**](#mutations)
  - [*CreateNewEvent*](#createnewevent)
  - [*InviteUserToEvent*](#inviteusertoevent)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyEvents
You can execute the `GetMyEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyEvents(): QueryPromise<GetMyEventsData, undefined>;

interface GetMyEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyEventsData, undefined>;
}
export const getMyEventsRef: GetMyEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyEvents(dc: DataConnect): QueryPromise<GetMyEventsData, undefined>;

interface GetMyEventsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyEventsData, undefined>;
}
export const getMyEventsRef: GetMyEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyEventsRef:
```typescript
const name = getMyEventsRef.operationName;
console.log(name);
```

### Variables
The `GetMyEvents` query has no variables.
### Return Type
Recall that executing the `GetMyEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMyEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyEvents } from '@dataconnect/generated';


// Call the `getMyEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
getMyEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `GetMyEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyEventsRef } from '@dataconnect/generated';


// Call the `getMyEventsRef()` function to get a reference to the query.
const ref = getMyEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## GetPublicEvents
You can execute the `GetPublicEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicEvents(): QueryPromise<GetPublicEventsData, undefined>;

interface GetPublicEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicEventsData, undefined>;
}
export const getPublicEventsRef: GetPublicEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicEvents(dc: DataConnect): QueryPromise<GetPublicEventsData, undefined>;

interface GetPublicEventsRef {
  ...
  (dc: DataConnect): QueryRef<GetPublicEventsData, undefined>;
}
export const getPublicEventsRef: GetPublicEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicEventsRef:
```typescript
const name = getPublicEventsRef.operationName;
console.log(name);
```

### Variables
The `GetPublicEvents` query has no variables.
### Return Type
Recall that executing the `GetPublicEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetPublicEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicEvents } from '@dataconnect/generated';


// Call the `getPublicEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
getPublicEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `GetPublicEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicEventsRef } from '@dataconnect/generated';


// Call the `getPublicEventsRef()` function to get a reference to the query.
const ref = getPublicEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewEvent
You can execute the `CreateNewEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewEvent(vars: CreateNewEventVariables): MutationPromise<CreateNewEventData, CreateNewEventVariables>;

interface CreateNewEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewEventVariables): MutationRef<CreateNewEventData, CreateNewEventVariables>;
}
export const createNewEventRef: CreateNewEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewEvent(dc: DataConnect, vars: CreateNewEventVariables): MutationPromise<CreateNewEventData, CreateNewEventVariables>;

interface CreateNewEventRef {
  ...
  (dc: DataConnect, vars: CreateNewEventVariables): MutationRef<CreateNewEventData, CreateNewEventVariables>;
}
export const createNewEventRef: CreateNewEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewEventRef:
```typescript
const name = createNewEventRef.operationName;
console.log(name);
```

### Variables
The `CreateNewEvent` mutation requires an argument of type `CreateNewEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewEventVariables {
  title: string;
  description?: string | null;
  startTime: TimestampString;
  endTime: TimestampString;
  location?: string | null;
  isPublic: boolean;
  categoryId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `CreateNewEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewEventData {
  event_insert: Event_Key;
}
```
### Using `CreateNewEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewEvent, CreateNewEventVariables } from '@dataconnect/generated';

// The `CreateNewEvent` mutation requires an argument of type `CreateNewEventVariables`:
const createNewEventVars: CreateNewEventVariables = {
  title: ..., 
  description: ..., // optional
  startTime: ..., 
  endTime: ..., 
  location: ..., // optional
  isPublic: ..., 
  categoryId: ..., // optional
};

// Call the `createNewEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewEvent(createNewEventVars);
// Variables can be defined inline as well.
const { data } = await createNewEvent({ title: ..., description: ..., startTime: ..., endTime: ..., location: ..., isPublic: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewEvent(dataConnect, createNewEventVars);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
createNewEvent(createNewEventVars).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

### Using `CreateNewEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewEventRef, CreateNewEventVariables } from '@dataconnect/generated';

// The `CreateNewEvent` mutation requires an argument of type `CreateNewEventVariables`:
const createNewEventVars: CreateNewEventVariables = {
  title: ..., 
  description: ..., // optional
  startTime: ..., 
  endTime: ..., 
  location: ..., // optional
  isPublic: ..., 
  categoryId: ..., // optional
};

// Call the `createNewEventRef()` function to get a reference to the mutation.
const ref = createNewEventRef(createNewEventVars);
// Variables can be defined inline as well.
const ref = createNewEventRef({ title: ..., description: ..., startTime: ..., endTime: ..., location: ..., isPublic: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewEventRef(dataConnect, createNewEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

## InviteUserToEvent
You can execute the `InviteUserToEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
inviteUserToEvent(vars: InviteUserToEventVariables): MutationPromise<InviteUserToEventData, InviteUserToEventVariables>;

interface InviteUserToEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InviteUserToEventVariables): MutationRef<InviteUserToEventData, InviteUserToEventVariables>;
}
export const inviteUserToEventRef: InviteUserToEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
inviteUserToEvent(dc: DataConnect, vars: InviteUserToEventVariables): MutationPromise<InviteUserToEventData, InviteUserToEventVariables>;

interface InviteUserToEventRef {
  ...
  (dc: DataConnect, vars: InviteUserToEventVariables): MutationRef<InviteUserToEventData, InviteUserToEventVariables>;
}
export const inviteUserToEventRef: InviteUserToEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the inviteUserToEventRef:
```typescript
const name = inviteUserToEventRef.operationName;
console.log(name);
```

### Variables
The `InviteUserToEvent` mutation requires an argument of type `InviteUserToEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InviteUserToEventVariables {
  eventId: UUIDString;
  inviteeId: UUIDString;
}
```
### Return Type
Recall that executing the `InviteUserToEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InviteUserToEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InviteUserToEventData {
  invitation_insert: Invitation_Key;
}
```
### Using `InviteUserToEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, inviteUserToEvent, InviteUserToEventVariables } from '@dataconnect/generated';

// The `InviteUserToEvent` mutation requires an argument of type `InviteUserToEventVariables`:
const inviteUserToEventVars: InviteUserToEventVariables = {
  eventId: ..., 
  inviteeId: ..., 
};

// Call the `inviteUserToEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await inviteUserToEvent(inviteUserToEventVars);
// Variables can be defined inline as well.
const { data } = await inviteUserToEvent({ eventId: ..., inviteeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await inviteUserToEvent(dataConnect, inviteUserToEventVars);

console.log(data.invitation_insert);

// Or, you can use the `Promise` API.
inviteUserToEvent(inviteUserToEventVars).then((response) => {
  const data = response.data;
  console.log(data.invitation_insert);
});
```

### Using `InviteUserToEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, inviteUserToEventRef, InviteUserToEventVariables } from '@dataconnect/generated';

// The `InviteUserToEvent` mutation requires an argument of type `InviteUserToEventVariables`:
const inviteUserToEventVars: InviteUserToEventVariables = {
  eventId: ..., 
  inviteeId: ..., 
};

// Call the `inviteUserToEventRef()` function to get a reference to the mutation.
const ref = inviteUserToEventRef(inviteUserToEventVars);
// Variables can be defined inline as well.
const ref = inviteUserToEventRef({ eventId: ..., inviteeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = inviteUserToEventRef(dataConnect, inviteUserToEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invitation_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invitation_insert);
});
```

