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
import { APIResponse } from "acfrontend";
import { OpenAPI } from "acts-util-core";
import root from "../../oidp/dist/openapi.json";

const apiSchemas = root.components.schemas;
export function OpenAPISchema<T>(schemaName: keyof typeof apiSchemas)
{
    return apiSchemas[schemaName] as OpenAPI.ObjectSchema;
}

export async function APIMapSingle<T, U>(request: Promise<APIResponse<T>>, mapper: (source: T) => U): Promise<APIResponse<U>>
{
    const response = await request;
    if(response.data === undefined)
        return response as any;
    return {
        rawBody: response.rawBody,
        statusCode: response.statusCode,
        data: mapper(response.data)
    };
}

export async function APIMap<T, U>(request: Promise<APIResponse<T[]>>, mapper: (source: T) => U): Promise<APIResponse<U[]>>
{
    const response = await request;
    if(response.data === undefined)
        return response as any;
    return {
        rawBody: response.rawBody,
        statusCode: response.statusCode,
        data: response.data.map(mapper)
    };
}