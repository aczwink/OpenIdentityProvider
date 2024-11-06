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
import { AppRegistration, AppRegistrationOverviewData, AppRegistrationProperties, ClaimValue, ClaimVariable, ClaimVariableProperties } from "../../dist/api";
import { APISchemaOf } from "../api-info";
import { Use } from "acfrontend";

type AppRegId = { appRegId: string };
type ClaimId = AppRegId & { claimId: number };

const createAppRegRoute: RouteSetup<AppRegistrationProperties> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).appregistrations.post(data),
        schema: APISchemaOf(schemas => schemas.AppRegistrationProperties)
    },
    displayText: "Create App-registration",
    icon: "plus",
    routingKey: "create",
};

const appRegPropsRoute: RouteSetup<AppRegistration, AppRegId> = {
    content: {
        type: "object",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).appregistrations._any_.delete(ids.appRegId),
            }
        ],
        formTitle: (_, appReg) => appReg.displayName,
        requestObject: ids => Use(APIService).appregistrations._any_.get(ids.appRegId),
        schema: APISchemaOf(x => x.AppRegistration)
    },
    displayText: "Overview",
    icon: "app-indicator",
    routingKey: "overview",
};

const createClaimRoute: RouteSetup<ClaimVariableProperties, AppRegId> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).appregistrations._any_.claims.post(ids.appRegId, data),
        schema: APISchemaOf(schemas => schemas.ClaimVariableProperties)
    },
    displayText: "Add claim",
    icon: "plus",
    routingKey: "add",
};

const createClaimValueRoute: RouteSetup<ClaimValue, ClaimId> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).appregistrations._any_.claims.values.post(ids.appRegId, { claimId: ids.claimId }, data),
        schema: APISchemaOf(schemas => schemas.ClaimValue)
    },
    displayText: "Add claim value",
    icon: "plus",
    routingKey: "add",
};

const claimValuesRoute: RouteSetup<ClaimValue, ClaimId> = {
    content: {
        type: "list",
        actions: [createClaimValueRoute],
        boundActions: [
            {
                type: "delete",
                deleteResource: (ids, value) => Use(APIService).appregistrations._any_.claims.values.delete(ids.appRegId, { claimId: ids.claimId }, value)
            }
        ],
        dataSource: {
            call: ids => Use(APIService).appregistrations._any_.claims.values.get(ids.appRegId, { claimId: ids.claimId }),
            id: "value",
            schema: APISchemaOf(x => x.ClaimValue)
        },
    },
    displayText: "Values",
    icon: "card-list",
    routingKey: "{claimId}",
}

const claimsRoute: RouteSetup<ClaimVariable, AppRegId> = {
    content: {
        type: "collection",
        actions: [createClaimRoute],
        child: claimValuesRoute,
        dataSource: {
            call: ids => Use(APIService).appregistrations._any_.claims.get(ids.appRegId),
            id: "id",
            schema: APISchemaOf(x => x.ClaimVariable)
        }
    },
    displayText: "Claims",
    icon: "passport",
    routingKey: "claims",
};

const appRegRoute: RouteSetup<AppRegistration, AppRegId> = {
    content: {
        type: "multiPage",
        actions: [],
        entries: [
            {
                displayName: "",
                entries: [appRegPropsRoute, claimsRoute]
            }
        ],
        formTitle: ids => "Application registration",
    },
    displayText: "Application registration",
    icon: "app-indicator",
    routingKey: "{appRegId}",
};

export const appRegistrationsRoutes: RouteSetup<AppRegistrationOverviewData> = {
    content: {
        type: "collection",
        actions: [createAppRegRoute],
        child: appRegRoute,
        dataSource: {
            call: () => Use(APIService).appregistrations.get(),
            id: "id"
        }
    },
    displayText: "Application registrations",
    icon: "app-indicator",
    requiredScopes: ["admin"],
    routingKey: "appregistrations",
};