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
import { ActiveDirectoyDomainAdminData } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

export const domainRoute: RouteSetup<{}, ActiveDirectoyDomainAdminData> = {
    content: {
        type: "object",
        actions: [
            {
                type: "edit",
                requestObject: _ => Use(APIService).domain.get(),
                schema: OpenAPISchema("ActiveDirectoyDomainAdminData"),
                updateResource: (_, data) => Use(APIService).domain.put(data)
            }
        ],
        formTitle: _ => "Admin setup",
        requestObject: _ => Use(APIService).domain.get(),
        schema: OpenAPISchema("ActiveDirectoyDomainAdminData")
    },
    displayText: "Domain",
    icon: "gear",
    requiredScopes: ["admin"],
    routingKey: "domain",
};