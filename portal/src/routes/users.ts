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
import { FullUserAccountData, HumanUserAccount, UserAccountOverviewData } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

const createUserRoute: RouteSetup<{}, HumanUserAccount> = {
    content: {
        type: "create",
        call: async (_, data) => {
            const response = await Use(APIService).users.post(data);
            alert("The users initial password is: " + response.data);
            return response;
        },
        schema: OpenAPISchema("HumanUserAccount")
    },
    displayText: "Create user",
    icon: "person-plus",
    routingKey: "create",
};

export const userRoute: RouteSetup<{ userId: string }, FullUserAccountData> = {
    content: {
        type: "object",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).users._any_.delete(ids.userId),
            }
        ],
        formTitle: (_, user) => (user.userAccount.type === "human") ? user.userAccount.eMailAddress : user.userAccount.externalId,
        requestObject: ids => Use(APIService).users._any_.get(ids.userId),
        schema: OpenAPISchema("FullUserAccountData")
    },
    displayText: "User",
    icon: "person",
    routingKey: "{userId}",
};

export const usersRoute: RouteSetup<{}, UserAccountOverviewData> = {
    content: {
        type: "collection",
        actions: [createUserRoute],
        child: userRoute,
        id: x => (x.type === "human") ? x.eMailAddress : x.externalId,
        requestObjects: () => Use(APIService).users.get(),
        schema: OpenAPISchema("HumanUserAccount"),
    },
    displayText: "Users",
    icon: "person",
    requiredScopes: ["admin"],
    routingKey: "users",
};