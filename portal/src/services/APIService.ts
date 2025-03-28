/**
 * OpenIdentityProvider
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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
import { Injectable, HTTPService, OAuth2TokenManager, APIServiceBase } from "acfrontend";
import { API } from "../../dist/api";
import ENV from "../env";

@Injectable
export class APIService extends API
{
    constructor(httpService: HTTPService, oAuth2TokenManager: OAuth2TokenManager)
    {
        super( req => this.base.SendRequest(req) );

        this.base = new APIServiceBase(httpService, ENV.BACKEND.host, ENV.BACKEND.port, ENV.BACKEND.protocol);

        oAuth2TokenManager.tokenIssued.Subscribe(x => this.accessToken = x.accessToken);
    }

    //Private properties
    private set accessToken(value: string)
    {
        this.base.globalHeaders.Authorization = "Bearer " + value;
    }

    //State
    private base: APIServiceBase;
}