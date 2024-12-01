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
import { DNSRecord, DNSZone } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

type ZoneId = { zoneId: number; };

const createRecordRoute: RouteSetup<ZoneId, DNSRecord> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).dns._any_.post(ids.zoneId, data),
        schema: OpenAPISchema("DNSRecord")
    },
    displayText: "Create record",
    icon: "plus",
    routingKey: "create",
};

const dnsRecordsRoute: RouteSetup<ZoneId, DNSRecord> = {
    content: {
        type: "list",
        actions: [createRecordRoute],
        boundActions: [
            {
                type: "delete",
                deleteResource: (ids, record) => Use(APIService).dns._any_._any_.delete(ids.zoneId, record.label),
            }
        ],
        requestObjects: ids => Use(APIService).dns._any_.get(ids.zoneId),
        schema: OpenAPISchema("DNSRecord")
    },
    displayText: "DNS Records",
    icon: "postcard",
    routingKey: "records",
};

const dnsZoneRoute: RouteSetup<ZoneId, DNSZone> = {
    content: {
        type: "multiPage",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).dns._any_.delete(ids.zoneId),
            }
        ],
        entries: [
            {
                displayName: "",
                entries: [dnsRecordsRoute]
            }
        ],
        formTitle: _ => "DNS zone",
    },
    displayText: "DNS zone",
    icon: "postcard",
    routingKey: "{zoneId}",
};


const createZoneRoute: RouteSetup<{}, { name: string; }> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).dns.post(data),
        schema: {
            additionalProperties: false,
            properties: {
                name: {
                    type: "string"
                },
            },
            required: ["name"],
            type: "object",
        }
    },
    displayText: "Create zone",
    icon: "plus",
    routingKey: "create",
};

export const dnsRoute: RouteSetup<{}, DNSZone> = {
    content: {
        type: "collection",
        actions: [createZoneRoute],
        child: dnsZoneRoute,
        id: "id",
        requestObjects: () => Use(APIService).dns.get(),
        schema: OpenAPISchema("DNSZone")
    },
    displayText: "DNS zones",
    icon: "postcard",
    requiredScopes: ["admin"],
    routingKey: "dns",
};