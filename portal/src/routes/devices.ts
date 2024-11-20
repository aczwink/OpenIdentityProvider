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
import { APIMap, OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";
import { ComputerProperties } from "../../dist/api";

const deviceRoute: RouteSetup<{ deviceName: string }, ComputerProperties> = {
    content: {
        type: "object",
        actions: [],
        formTitle: ids => ids.deviceName,
        requestObject: ids => Use(APIService).devices._any_.get(ids.deviceName),
        schema: OpenAPISchema("ComputerProperties")
    },
    displayText: "Device",
    icon: "pc-display",
    routingKey: "{deviceName}",
};

export const devicesRoute: RouteSetup<{}, { name: string }> = {
    content: {
        type: "collection",
        child: deviceRoute,
        id: "name",
        requestObjects: () => APIMap(Use(APIService).devices.get(), x => ({ name: x })),
    },
    displayText: "Devices",
    icon: "pc-display",
    requiredScopes: ["admin"],
    routingKey: "devices",
};