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

import { Anchor, BootstrapIcon, JSX_CreateElement, JSX_Fragment, RouterButton, Use, UseAPI } from "acfrontend";
import { APIService } from "../APIService";
import { AppRegistrationOverviewData } from "../../dist/api";

function AppRegsTable(input: { appRegs: AppRegistrationOverviewData[] })
{
    return <div className="container">
        <table className="table table-hover table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                </tr>
            </thead>
            <tbody>
            {input.appRegs.map(x => <tr>
                <td><Anchor route={"/appregistrations/" + x.id}>{x.displayName}</Anchor></td>
            </tr>)}
            </tbody>
        </table>
        <RouterButton color="primary" route="appregistrations/add"><BootstrapIcon>plus</BootstrapIcon></RouterButton>
    </div>;
}

export function ListAppRegistrationsComponent()
{
    const apiState = UseAPI( () => Use(APIService).appregistrations.get() );
    return <>
        {apiState.success ? <AppRegsTable appRegs={apiState.data} /> : apiState.fallback}
    </>;
}