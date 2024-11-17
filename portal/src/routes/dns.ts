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
import { DNSRecord } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

const createRecordRoute: RouteSetup<{}, DNSRecord> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).dns.post(data),
        schema: OpenAPISchema("DNSRecord")
    },
    displayText: "Create record",
    icon: "plus",
    routingKey: "create",
};

export const dnsRoute: RouteSetup<{}, DNSRecord> = {
    content: {
        type: "list",
        actions: [createRecordRoute],
        boundActions: [
            {
                type: "delete",
                deleteResource: (_, record) => Use(APIService).dns._any_.delete(record.label),
            }
        ],
        requestObjects: () => Use(APIService).dns.get(),
        schema: OpenAPISchema("DNSRecord")
    },
    displayText: "DNS",
    icon: "postcard",
    requiredScopes: ["admin"],
    routingKey: "dns",
};