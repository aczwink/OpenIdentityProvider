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

import { APIController, Body, Delete, Get, NotFound, Path, Post, Query, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { AppRegistrationProperties, AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { ClaimsController, ClaimValue, ClaimVariableProperties } from "../data-access/ClaimsController";

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

@APIController("appregistrations/{appRegId}")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api2_
{
    constructor(private appRegistrationsController: AppRegistrationsController)
    {
    }

    @Delete()
    public async DeleteAppRegistration(
        @Path appRegId: string
    )
    {
        await this.appRegistrationsController.DeleteByExternalId(appRegId);
    }

    @Get()
    public async RequestAppRegistration(
        @Path appRegId: string
    )
    {
        return await this.appRegistrationsController.QueryByExternalId(appRegId);
    }
}

@APIController("appregistrations/{appRegId}/claims")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api3_
{
    constructor(private claimsController: ClaimsController, private appRegistrationsController: AppRegistrationsController)
    {
    }

    @Post()
    public async CreateAppRegistrationClaim(
        @Path appRegId: string,
        @Body data: ClaimVariableProperties
    )
    {
        const internalId = await this.appRegistrationsController.QueryInternalId(appRegId);
        if(internalId === undefined)
            return NotFound("app registration does not exist");
        return await this.claimsController.AddVariable(internalId, data);
    }

    @Get()
    public async RequestAppRegistrationClaims(
        @Path appRegId: string
    )
    {
        return await this.claimsController.QueryVariables(appRegId);
    }

    @Post("values")
    public async AddValue(
        @Path appRegId: string,
        @Query claimId: number,
        @Body claimValue: ClaimValue
    )
    {
        await this.claimsController.AddValue(claimId, claimValue);
    }

    @Delete("values")
    public async DeleteValue(
        @Path appRegId: string,
        @Query claimId: number,
        @Body claimValue: ClaimValue
    )
    {
        await this.claimsController.DeleteValue(claimId, claimValue);
    }

    @Get("values")
    public async RequestClaimValues(
        @Path appRegId: string,
        @Query claimId: number
    )
    {
        return await this.claimsController.QueryValues(claimId);
    }
}