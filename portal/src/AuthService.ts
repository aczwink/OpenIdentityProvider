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

import { Injectable, OAuth2Service } from "acfrontend";
import { APIService } from "./APIService";
import { Property } from "../../../ACTS-Util/core/dist/main";

@Injectable
export class AuthService
{
    constructor(private oAuth2Service: OAuth2Service, private apiService: APIService)
    {
        this._accessToken = new Property<string>("");
    }

    //Properties
    public get accessToken()
    {
        return this._accessToken;
    }

    public get isLoggedIn()
    {
        return this._accessToken.Get().length > 0;
    }
    
    //Public methods
    public async HandleLoginFlow()
    {
        if(this.isLoggedIn)
            return;

        const accessToken = await this.oAuth2Service.HandleAuthorizationCodeFlow({
            authorizeEndpoint: process.env.OIDP_AUTH_ENDPOINT!,
            clientId: process.env.OIDP_CLIENTID!,
            redirectURI: process.env.OIDP_REDIRECTURI!,
            scopes: ["openid", "admin"],
            tokenEndpoint: process.env.OIDP_TOKEN_ENDPOINT!
        });
        this.accessToken.Set(accessToken);
        this.apiService.accessToken = accessToken;
    }

    //Private state
    private _accessToken: Property<string>;
}