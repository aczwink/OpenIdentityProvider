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
import { AppRegistrationDTO, AppRegistrationOverviewData, AppRegistrationProperties, ClaimValue, ClaimVariable, ClaimVariableProperties } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

type AppRegId = { appRegId: string };
type ClaimId = AppRegId & { claimId: number };

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

const appRegPropsRoute: RouteSetup<AppRegId, AppRegistrationDTO> = {
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
        schema: OpenAPISchema("AppRegistrationDTO")
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
    routingKey: "{claimId}",
}

const claimsRoute: RouteSetup<AppRegId, ClaimVariable> = {
    content: {
        type: "collection",
        actions: [createClaimRoute],
        child: claimValuesRoute,
        id: "id",
        requestObjects: ids => Use(APIService).appregistrations._any_.claims.get(ids.appRegId),
        schema: OpenAPISchema("ClaimVariable")
    },
    displayText: "Claims",
    icon: "passport",
    routingKey: "claims",
};

const appRegRoute: RouteSetup<AppRegistrationDTO, AppRegId> = {
    content: {
        type: "multiPage",
        actions: [],
        entries: [
            {
                displayName: "",
                entries: [appRegPropsRoute, claimsRoute]
            }
        ],
        formTitle: _ => "Application registration",
    },
    displayText: "Application registration",
    icon: "app-indicator",
    routingKey: "{appRegId}",
};

export const appRegistrationsRoutes: RouteSetup<{}, AppRegistrationOverviewData> = {
    content: {
        type: "collection",
        actions: [createAppRegRoute],
        child: appRegRoute,
        id: "id",
        requestObjects: () => Use(APIService).appregistrations.get(),
        schema: OpenAPISchema("AppRegistrationOverviewData")
    },
    displayText: "Application registrations",
    icon: "app-indicator",
    requiredScopes: ["admin"],
    routingKey: "appregistrations",
};