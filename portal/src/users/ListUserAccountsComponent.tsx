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

import { BootstrapIcon, Component, Injectable, JSX_CreateElement, ProgressSpinner, RouterButton } from "acfrontend";
import { APIService } from "../APIService";
import { UserAccount } from "../../dist/api";

@Injectable
export class ListUserAccountsComponent extends Component
{
    constructor(private apiService: APIService)
    {
        super();

        this.users = null;
    }

    protected Render(): RenderValue
    {
        if(this.users === null)
            return <ProgressSpinner />;

        return <div className="container">
            <table className="table table-hover table-striped">
                <thead>
                    <tr>
                        <th>Id</th>
                    </tr>
                </thead>
                <tbody>
                {this.users.map(this.RenderUser.bind(this))}
                </tbody>
            </table>
            <RouterButton color="primary" route="users/add"><BootstrapIcon>plus</BootstrapIcon></RouterButton>
        </div>;
    }

    //Private methods
    private RenderUser(user: UserAccount)
    {
        return <tr>
            <td>{user.id}</td>
        </tr>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const response = await this.apiService.users.get();
        this.users = response.data;
    }

    //State
    private users: UserAccount[] | null;
}