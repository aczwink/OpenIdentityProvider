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

import { JSX_CreateElement, RootInjector } from "acfrontend";
import { CustomFormatRegistry } from "acfrontendex";
import { UserValuePresenter } from "./UserValuePresenter";
import { UserSelectionComponent } from "./UserSelectionComponent";
import { UserGroupPresenter } from "./UserGroupPresenter";
import { UserGroupSelectionComponent } from "./UserGroupSelectionComponent";

export function RegisterCustomFormats()
{
    const cfm = RootInjector.Resolve(CustomFormatRegistry);

    cfm.RegisterFormatPresenter("number", "usergroup-id", userGroupId => <UserGroupPresenter userGroupId={userGroupId} />);
    cfm.RegisterFormatEditor("number", "usergroup-id", (value, valueChanged) => <UserGroupSelectionComponent userGroupId={value} valueChanged={valueChanged} />);
    cfm.RegisterFormatEditor("string", "user-id", (value, valueChanged) => <UserSelectionComponent userId={value} valueChanged={valueChanged} />);
    cfm.RegisterFormatPresenter("string", "user-id", userId => <UserValuePresenter userId={userId} />);
}