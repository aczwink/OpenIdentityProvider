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
import { HumanUserAccount, UserAccount } from "../../dist/api";
import { APISchemaOf } from "../api-info";
import { Use } from "acfrontend";

const createUserRoute: RouteSetup<HumanUserAccount> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).users.post(data),
        schema: APISchemaOf(x => x.HumanUserAccount)
    },
    displayText: "Create user",
    icon: "person-plus",
    routingKey: "create",
};

export const userRoute: RouteSetup<HumanUserAccount, { userId: string }> = {
    content: {
        type: "object",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).users._any_.delete(ids.userId),
            }
        ],
        formTitle: (_, user) => user.eMailAddress,
        requestObject: ids => Use(APIService).users._any_.get(ids.userId),
        schema: APISchemaOf(x => x.HumanUserAccount)
    },
    displayText: "User",
    icon: "person",
    routingKey: "{userId}",
};

export const usersRoute: RouteSetup<HumanUserAccount> = {
    content: {
        type: "collection",
        actions: [createUserRoute],
        child: userRoute,
        dataSource: {
            call: () => Use(APIService).users.get(),
            id: "eMailAddress"
        },
    },
    displayText: "Users",
    icon: "person",
    requiredScopes: ["admin"],
    routingKey: "users",
};