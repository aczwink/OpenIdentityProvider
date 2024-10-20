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

import { APIController, Body, Get, Post, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { AppRegistrationProperties, AppRegistrationsController } from "../data-access/AppRegistrationsController";

@APIController("appregistrations")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private appRegistrationsController: AppRegistrationsController)
    {
    }

    @Post()
    public Create(
        @Body props: AppRegistrationProperties
    )
    {
        return this.appRegistrationsController.Create(props);
    }

    @Get()
    public async RequestAll()
    {
        return await this.appRegistrationsController.QueryAll();
    }
}