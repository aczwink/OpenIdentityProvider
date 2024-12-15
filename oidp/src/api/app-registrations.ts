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

import { APIController, Body, BodyProp, Delete, Get, NotFound, Path, Post, Put, Query, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { AppRegistrationProperties, AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { ClaimsController, ClaimValue, ClaimVariableProperties } from "../data-access/ClaimsController";
import { ClientDataDTO, ClientEditableDataDTO, ClientsManager } from "../services/ClientsManager";
import { ClientsController } from "../data-access/ClientsController";
import { Of } from "acts-util-core";

interface ClientDataResultDTO
{
    data: ClientDataDTO;
}

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
        @Path appRegId: number
    )
    {
        await this.appRegistrationsController.Delete(appRegId);
    }

    @Get()
    public async RequestAppRegistration(
        @Path appRegId: number
    )
    {
        const appReg = await this.appRegistrationsController.Query(appRegId);
        if(appReg === undefined)
            return NotFound("app registration not found");

        return appReg;
    }

    @Put()
    public async UpdateAppRegistrationProperties(
        @Path appRegId: number,
        @Body props: AppRegistrationProperties
    )
    {
        await this.appRegistrationsController.Update(appRegId, props);
    }
}

@APIController("appregistrations/{appRegId}/claims")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api3_
{
    constructor(private claimsController: ClaimsController)
    {
    }

    @Post()
    public async CreateAppRegistrationClaim(
        @Path appRegId: number,
        @Body data: ClaimVariableProperties
    )
    {
        return await this.claimsController.AddVariable(appRegId, data);
    }

    @Get()
    public async RequestAppRegistrationClaims(
        @Path appRegId: number
    )
    {
        return await this.claimsController.QueryVariables(appRegId);
    }

    @Delete()
    public async DeleteAppRegistrationClaim(
        @Path appRegId: number,
        @BodyProp claimId: number,
    )
    {
        await this.claimsController.DeleteVariable(claimId);
    }

    @Post("values")
    public async AddValue(
        @Path appRegId: number,
        @Query claimId: number,
        @Body claimValue: ClaimValue
    )
    {
        await this.claimsController.AddValue(claimId, claimValue);
    }

    @Delete("values")
    public async DeleteValue(
        @Path appRegId: number,
        @Query claimId: number,
        @Body claimValue: ClaimValue
    )
    {
        await this.claimsController.DeleteValue(claimId, claimValue);
    }

    @Get("values")
    public async RequestClaimValues(
        @Path appRegId: number,
        @Query claimId: number
    )
    {
        return await this.claimsController.QueryValues(claimId);
    }
}

@APIController("appregistrations/{appRegId}/clients")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api4_
{
    constructor(private clientsController: ClientsController, private clientsManager: ClientsManager)
    {
    }

    @Post()
    public async CreateAppRegistrationClaim(
        @Path appRegId: number,
        @Body data: ClientEditableDataDTO
    )
    {
        return await this.clientsManager.Create(appRegId, data);
    }

    @Get()
    public async RequestAppRegistrationClients(
        @Path appRegId: number
    )
    {
        return await this.clientsController.QueryForAppRegistration(appRegId);
    }

    @Delete("{clientId}")
    public async DeleteAppRegistrationClient(
        @Path appRegId: number,
        @Path clientId: string
    )
    {
        await this.clientsManager.Delete(clientId);
    }

    @Get("{clientId}")
    public async RequestAppRegistrationClient(
        @Path appRegId: number,
        @Path clientId: string
    )
    {
        const result = await this.clientsManager.Query(clientId);
        if(result === undefined)
            return NotFound("client not found");
        return Of<ClientDataResultDTO>({ data: result });
    }

    @Put("{clientId}")
    public async UpdateAppRegistrationClientProperties(
        @Path appRegId: number,
        @Path clientId: string,
        @Body props: ClientEditableDataDTO
    )
    {
        await this.clientsManager.Update(appRegId, clientId, props);
    }
}