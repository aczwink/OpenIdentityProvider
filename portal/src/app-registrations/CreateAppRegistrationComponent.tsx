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

import { BootstrapIcon, FormField, JSX_CreateElement, JSX_Fragment, LineEdit, PushButton, Router, Use, UseDeferredAPI, UseState } from "acfrontend";
import { APIService } from "../APIService";
import { APIResponse } from "acfrontend/dist/RenderHelpers";
import { AppRegistrationProperties } from "../../dist/api";

export function AppRegFormComponent(input: { saveAPI: (data: AppRegistrationProperties) => Promise<APIResponse<string>>  })
{
    const state = UseState({
        appRegId: "",
        displayName: ""
    });
    const apiState = UseDeferredAPI(
        () => input.saveAPI({ displayName: state.displayName, redirectURIs: [], scopes: [] }),
        () => Use(Router).RouteTo("/appregistrations/" + state.appRegId)
    );

    if(apiState.started)
        return apiState.fallback;

    const isValid = (state.displayName.trim().length > 0);
    return <>
        <FormField title="Display Name">
            <LineEdit link={state.links.displayName} />
        </FormField>
        <PushButton color="primary" enabled={isValid} onActivated={apiState.start}><BootstrapIcon>floppy</BootstrapIcon> Save</PushButton>
    </>;
}

export function CreateAppRegistrationComponent()
{
    async function Save(data: AppRegistrationProperties)
    {
        const response = await Use(APIService).appregistrations.post(data);
        return response;
    }
    return <AppRegFormComponent saveAPI={Save} />;
}