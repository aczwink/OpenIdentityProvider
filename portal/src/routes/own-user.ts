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
import { ChangeUserPasswordDTO } from "../../dist/api";
import { Use } from "acfrontend";
import { APIService } from "../services/APIService";
import { OpenAPISchema } from "../api-info";

export const changeUserPassword: RouteSetup<{}, ChangeUserPasswordDTO> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).ownuser.put(data),
        schema: OpenAPISchema("ChangeUserPasswordDTO")
    },
    displayText: "Change password",
    icon: "key",
    routingKey: "changepw",
};