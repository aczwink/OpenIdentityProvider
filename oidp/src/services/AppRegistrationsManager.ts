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
import crypto from "crypto";
import { Injectable } from "acts-util-node";
import { AppRegistrationProperties, AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { UsersManager } from "./UsersManager";

@Injectable
export class AppRegistrationsManager
{
    constructor(private appRegistrationsController: AppRegistrationsController, private usersManager: UsersManager)
    {
    }

    //Public methods
    public async Create(props: AppRegistrationProperties)
    {
        const appUserId = await this.EnsureServicePrincipalExistsIfRequired(props);

        const externalId = crypto.randomUUID();
        await this.appRegistrationsController.Create(externalId, {
            ...props,
            appUserId,
        });
        return externalId as string;
    }

    public async DeleteByExternalId(appRegId: string)
    {
        const appReg = await this.appRegistrationsController.QueryByExternalId(appRegId);
        if(appReg?.appUserId !== null)
            await this.usersManager.DeleteUser(appReg!.appUserId);
        await this.appRegistrationsController.DeleteByExternalId(appRegId);
    }

    public async UpdateByExternalId(appRegId: string, props: AppRegistrationProperties)
    {
        if(props.type === "client_credentials")
        {
            const appUserId = await this.EnsureServicePrincipalExistsIfRequired(props);
            await this.appRegistrationsController.UpdateByExternalId(appRegId, {
                ...props,
                appUserId
            });
        }
        else
        {
            const appReg = await this.appRegistrationsController.QueryByExternalId(appRegId);

            await this.appRegistrationsController.UpdateByExternalId(appRegId, {
                ...props,
                appUserId: null,
            });

            if(appReg?.appUserId !== null)
                await this.usersManager.DeleteUser(appReg!.appUserId);
        }
    }

    //Private methods
    private EnsureServicePrincipalExistsIfRequired(props: AppRegistrationProperties)
    {
        if(props.type === "client_credentials")
        {
            return this.usersManager.CreateUser({
                type: "service-principal",
                displayName: this.MapAppRegNameToSPName(props.displayName),
                externalId: crypto.randomUUID()
            });
        }
        return null;
    }

    private MapAppRegNameToSPName(displayName: string)
    {
        return displayName.replace(/[ ]/g, "");
    }
}