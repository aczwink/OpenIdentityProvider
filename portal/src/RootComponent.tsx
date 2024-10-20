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
import { BootstrapIcon, Component, Injectable, JSX_CreateElement, JSX_Fragment, Navigation, NavItem, ProgressSpinner, RouterComponent } from "acfrontend";
import { AuthService } from "./AuthService";

@Injectable
export class RootComponent extends Component
{
    constructor(private authService: AuthService)
    {
        super();
    }

    protected Render()
    {
        if(!this.authService.isLoggedIn)
            return <ProgressSpinner />;

        return <>
            <Navigation>
                <ul className="nav nav-pills">
                    <NavItem route="/appregistrations"><BootstrapIcon>app-indicator</BootstrapIcon> Application registrations</NavItem>
                    <NavItem route="/users"><BootstrapIcon>people-fill</BootstrapIcon> Users</NavItem>
                </ul>
            </Navigation>
            <div className="container-fluid">
                <RouterComponent />
            </div>
        </>;
    }

    //Event handlers
    override OnInitiated(): void
    {
        this.authService.accessToken.Subscribe(this.Update.bind(this));
        this.authService.HandleLoginFlow();
    }
}