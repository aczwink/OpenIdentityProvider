/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

import { RouteSetup } from "acfrontendex";
import { APIService } from "../services/APIService";
import { AppRegistration, AppRegistrationProperties, ClaimValue, ClaimVariable, ClaimVariableProperties, ClientDataResultDTO, ClientEditableDataDTO, ClientOverviewData } from "../../dist/api";
import { APIMap, APIMapSingle, OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

type AppRegId = { appRegId: number };
type ClaimId = AppRegId & { claimId: number };
type ClientId = AppRegId & { clientId: string };

const createAppRegRoute: RouteSetup<{}, AppRegistrationProperties> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).appregistrations.post(data),
        schema: OpenAPISchema("AppRegistrationProperties")
    },
    displayText: "Create App-registration",
    icon: "plus",
    routingKey: "create",
};

const appRegPropsRoute: RouteSetup<AppRegId, AppRegistration> = {
    content: {
        type: "object",
        actions: [
            {
                type: "edit",
                requestObject: ids => Use(APIService).appregistrations._any_.get(ids.appRegId),
                schema: OpenAPISchema("AppRegistrationProperties"),
                updateResource: (ids, appReg) => Use(APIService).appregistrations._any_.put(ids.appRegId, appReg),
            },
            {
                type: "delete",
                deleteResource: ids => Use(APIService).appregistrations._any_.delete(ids.appRegId),
            }
        ],
        formTitle: (_, appReg) => appReg.displayName,
        requestObject: ids => Use(APIService).appregistrations._any_.get(ids.appRegId),
        schema: OpenAPISchema("AppRegistration")
    },
    displayText: "Overview",
    icon: "app-indicator",
    routingKey: "overview",
};

const createClaimRoute: RouteSetup<AppRegId, ClaimVariableProperties> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).appregistrations._any_.claims.post(ids.appRegId, data),
        schema: OpenAPISchema("ClaimVariableProperties")
    },
    displayText: "Add claim",
    icon: "plus",
    routingKey: "add",
};

const createClaimValueRoute: RouteSetup<ClaimId, ClaimValue> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).appregistrations._any_.claims.values.post(ids.appRegId, { claimId: ids.claimId }, data),
        schema: OpenAPISchema("ClaimValue")
    },
    displayText: "Add claim value",
    icon: "plus",
    routingKey: "add",
};

const claimValuesRoute: RouteSetup<ClaimId, ClaimValue> = {
    content: {
        type: "list",
        actions: [createClaimValueRoute],
        boundActions: [
            {
                type: "delete",
                deleteResource: (ids, value) => Use(APIService).appregistrations._any_.claims.values.delete(ids.appRegId, { claimId: ids.claimId }, value)
            }
        ],
        requestObjects: ids => Use(APIService).appregistrations._any_.claims.values.get(ids.appRegId, { claimId: ids.claimId }),
        schema: OpenAPISchema("ClaimValue")
    },
    displayText: "Values",
    icon: "card-list",
    routingKey: "values",
};

const claimRoute: RouteSetup<ClaimId> = {
    content: {
        type: "multiPage",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).appregistrations._any_.claims.delete(ids.appRegId, { claimId: ids.claimId })
            }
        ],
        entries: [
            {
                displayName: "",
                entries: [claimValuesRoute]
            }
        ],
        formTitle: _ => "Claim"
    },
    displayText: "Claim",
    icon: "passport",
    routingKey: "{claimId}",
};

const claimsRoute: RouteSetup<AppRegId, ClaimVariable> = {
    content: {
        type: "collection",
        actions: [createClaimRoute],
        child: claimRoute,
        id: "id",
        requestObjects: ids => Use(APIService).appregistrations._any_.claims.get(ids.appRegId),
        schema: OpenAPISchema("ClaimVariable")
    },
    displayText: "Claims",
    icon: "passport",
    routingKey: "claims",
};

const createClientRoute: RouteSetup<AppRegId, ClientEditableDataDTO> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).appregistrations._any_.clients.post(ids.appRegId, data),
        schema: OpenAPISchema("ClientEditableDataDTO")
    },
    displayText: "Add client",
    icon: "plus",
    routingKey: "add",
};

const clientRoute: RouteSetup<ClientId, ClientEditableDataDTO> = {
    content: {
        type: "object",
        actions: [
            {
                type: "edit",
                requestObject: ids => APIMapSingle(Use(APIService).appregistrations._any_.clients._any_.get(ids.appRegId, ids.clientId), x => x.data),
                schema: OpenAPISchema("ClientEditableDataDTO"),
                updateResource: (ids, props) => Use(APIService).appregistrations._any_.clients._any_.put(ids.appRegId, ids.clientId, props),
            },
            {
                type: "delete",
                deleteResource: ids => Use(APIService).appregistrations._any_.clients._any_.delete(ids.appRegId, ids.clientId),
            }
        ],
        formTitle: (_, client) => client.name ?? (client as any).data.name,
        requestObject: ids => Use(APIService).appregistrations._any_.clients._any_.get(ids.appRegId, ids.clientId) as any,
        schema: OpenAPISchema("ClientDataResultDTO"),
    },
    displayText: "Client",
    icon: "person-workspace",
    routingKey: "{clientId}",
};

const clientsRoute: RouteSetup<AppRegId, ClientOverviewData> = {
    content: {
        type: "collection",
        actions: [createClientRoute],
        child: clientRoute,
        id: "id",
        requestObjects: ids => Use(APIService).appregistrations._any_.clients.get(ids.appRegId),
        schema: OpenAPISchema("ClientOverviewData")
    },
    displayText: "Clients",
    icon: "person-workspace",
    routingKey: "clients",
};

const appRegRoute: RouteSetup<AppRegistration, AppRegId> = {
    content: {
        type: "multiPage",
        actions: [],
        entries: [
            {
                displayName: "",
                entries: [appRegPropsRoute, claimsRoute, clientsRoute]
            }
        ],
        formTitle: _ => "Application registration",
    },
    displayText: "Application registration",
    icon: "app-indicator",
    routingKey: "{appRegId}",
};

export const appRegistrationsRoutes: RouteSetup<{}, AppRegistration> = {
    content: {
        type: "collection",
        actions: [createAppRegRoute],
        child: appRegRoute,
        id: "id",
        requestObjects: () => Use(APIService).appregistrations.get(),
        schema: OpenAPISchema("AppRegistration")
    },
    displayText: "Application registrations",
    icon: "app-indicator",
    requiredScopes: ["admin"],
    routingKey: "appregistrations",
};